#!/usr/bin/env python3
"""
binance_live.py - live recorder for Binance USD-M futures (default BTCUSDT).

Records everything Binance publishes that ATAS uses, plus what ATAS exports do not give you:

  trades         every aggTrade (Binance groups fills with the same price and taker side per 100 ms)
  liquidations   forceOrder (Binance sends at most one per second per symbol)
  mark price     mark, index, funding rate, next funding time, every second
  --book         the FULL order book: diff updates every 100 ms + REST snapshot, kept in sync locally
                 (Binance's documented procedure); every second the top 100 levels per side are saved
  --bbo          best bid / best ask on every change
  --oi           open interest every 10 s
  --all          all of the above

Files, one set per hour (UTC) in --out:
  tape_BTCUSDT_<hour>.csv          trades in ATAS Bid/Ask Tape format (+ Binance trade ID and ms time)
  raw_BTCUSDT_<hour>.jsonl.gz      every message with all fields (lossless: the order book can be rebuilt
                                   from the snapshots + diffs in here)
  book_BTCUSDT_<hour>.jsonl.gz     order book top 100 levels per side, once per second (heatmap / DOM)

With --all expect hundreds of MB per day (compressed).

Missing trades are detected from Binance trade IDs and filled from REST. A broken order book sequence
triggers a fresh snapshot automatically. Binance closes every connection after 24 h; before that the collector
hands over to a new connection opened while the old one is still read (make-before-break), dropping duplicates.
The new connection is taken over only once it has delivered every stream except forceOrder. A connection on which
a stream other than aggTrade and forceOrder stays silent for SILENCE_MAX_S is dropped and opened again.

--features DIR  also run orderflow_engine.py live and write everything it computes to DIR, including
                live.json for dashboard.py (needs orderflow_engine.py in the same folder)

Install once:   python3 -m venv ~/venv && ~/venv/bin/pip install websockets
Run:            ~/venv/bin/python binance_live.py --all --out ~/data/binance
Stop:           Ctrl+C
"""
import argparse
import asyncio
import collections
import gzip
import json
import math
import os
import signal
import sys
import time
import traceback
import types
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import orderflow_engine as ofe          # lives next to this file; optional
except ImportError:
    ofe = None
from symbol_settings import add_cli_args, for_symbol, overrides_from_args

try:
    import orjson                           # optional, about 3x faster parsing: ~/venv/bin/pip install orjson
    loads = orjson.loads
except ImportError:
    loads = json.loads

try:
    import websockets
except ImportError:
    sys.exit("Chybi knihovna websockets. Nainstaluj: python3 -m venv ~/venv && ~/venv/bin/pip install websockets")

WS_BASE = "wss://fstream.binance.com"
REST_AGG = "https://fapi.binance.com/fapi/v1/aggTrades"
REST_DEPTH = "https://fapi.binance.com/fapi/v1/depth"
REST_OI = "https://fapi.binance.com/fapi/v1/openInterest"
BOOK_LEVELS_SAVED = 100
RECONNECT_AFTER_S = 23 * 3600 + 50 * 60     # Binance closes every connection after 24 h
# The scheduled reconnect is a make-before-break handover (Collector.run_endpoint): NEW connects and buffers
# while OLD is still processed, then OLD is closed in the background and NEW passes a duplicate filter.
HANDOVER_MAX_S = 3                  # once NEW is ready, switch at the latest this long after that
HANDOVER_FILTER_S = 10              # after the switch, drop duplicates this long
HANDOVER_RETRY_S = 30               # a failed handover is tried again no sooner than this
HANDOVER_BUFFER_MAX = 20000         # NEW's buffer; reaching it switches at once (or aborts a NEW that is not ready)
HANDOVER_CONNECT_TIMEOUT_S = 10     # opening NEW
HANDOVER_READY_MAX_S = 30           # NEW must deliver every cadence stream this long after opening, or it is aborted
SILENCE_MAX_S = 60                  # a watched stream silent this long on the live connection: abort and reconnect
WATCHDOG_TICK_S = 1.0               # the silence watchdog looks this often (at least 10 times per SILENCE_MAX_S)
STOP_GRACE_S = 0.5                  # at stop, a connection still waiting in recv() after this long is closed
CLOSE_WAIT_S = 1.0                  # at stop, a close handshake gets this long, then the connection is aborted
LIQ_MEMORY_MS = 60_000              # forceOrder identities kept for the duplicate filter


def ws_connect(url):
    """Opens a Binance stream connection; the one place for the options, so a handover's NEW uses the same ones."""
    return websockets.connect(url, ping_interval=20, ping_timeout=20, max_size=2 ** 22)


def cadence_streams(streams):
    """The streams with a steady cadence: all but @forceOrder (liquidations can be silent for hours). A handover's
    NEW is ready once it has delivered each of them at least once."""
    return [s for s in streams if not s.endswith("@forceOrder")]


def watched_streams(streams):
    """The streams the silence watchdog watches: the cadence streams except @aggTrade (trades can pause and REST
    refills them; the other streams of the same connection still reveal a dead connection)."""
    return [s for s in cadence_streams(streams) if not s.endswith("@aggTrade")]


def note_stream(seen, msg, now):
    """seen[stream] = now for a ws message (text); the stream name is read without parsing (stream_of)."""
    stream = stream_of(msg)
    if stream is not None:
        seen[stream] = now


def stream_key(stream, data):
    """Duplicate key of a ws message: aggTrade a, depth u, bookTicker u, markPrice E; None for other streams."""
    if stream.endswith("@aggTrade"):
        return data.get("a")
    if "@depth" in stream or stream.endswith("@bookTicker"):
        return data.get("u")
    if "@markPrice" in stream:
        return data.get("E")
    return None


def liq_identity(data):
    """forceOrder identity (E, o.s, o.S, o.T, o.q, o.p): two different liquidations may share E."""
    o = data.get("o") or {}
    return data.get("E"), o.get("s"), o.get("S"), o.get("T"), o.get("q"), o.get("p")


def stream_of(msg):
    """Stream name read from the text without parsing it: Binance sends {"stream":"<name>","data":...}."""
    if not msg.startswith('{"stream":"'):
        return None
    end = msg.find('"', 11)
    return msg[11:end] if end > 11 else None


def utc_hour_key(ms):
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime("%Y-%m-%dT%HZ")


def local_clock(ms):
    return datetime.fromtimestamp(ms / 1000).strftime("%d.%m.%Y %H:%M:%S.") + f"{ms % 1000:03d}"


HEADER = "Time;Bids;;;;Ask;Delta;AggId;TradeTimeMs\n"
GRACE_MS = 10 * 60 * 1000                    # keep an hour open 10 min after it ends, for late (backfilled) trades


def tape_line(t, delta, settings):
    """One aggTrade as an ATAS Bid/Ask Tape row (time;bid price;bid size;0;ask size;ask price;running delta)
    plus two extra columns the dashboard ignores: Binance aggTrade ID and trade time in ms."""
    p, ok = _tape_price(str(t["p"]), settings)
    q = str(t["q"])
    tick = Decimal(str(settings.tick_size))
    tail = f";{delta:.3f};{t['a']};{t['T']}"
    if t["m"]:   # buyer was the maker, so the seller was aggressive: volume at the bid
        ask = _format_price(Decimal(p) + tick, settings.price_decimals) if ok else p
        return f"{local_clock(t['T'])};{p};{q};0;0;{ask}" + tail
    bid = _format_price(Decimal(p) - tick, settings.price_decimals) if ok else p
    return f"{local_clock(t['T'])};{bid};0;0;{q};{p}" + tail


def _format_price(price, decimals):
    return f"{price:.{decimals}f}"


def _tape_price(price_text, settings):
    tick = Decimal(str(settings.tick_size))
    try:
        price = Decimal(price_text)
    except InvalidOperation:
        print(f"WARN binance_live: {settings.symbol} invalid trade price={price_text}; keeping original", file=sys.stderr)
        return price_text, False
    if tick <= 0 or price % tick != 0:
        print(
            f"WARN binance_live: {settings.symbol} price={price_text} not multiple of tick_size={settings.tick_size}; keeping original",
            file=sys.stderr,
        )
        return price_text, False
    return _format_price(price, settings.price_decimals), True


def parse_tape_line(line):
    f = line.rstrip("\n").split(";")
    sell = float(f[2] or 0)
    if sell > 0:
        return {"a": int(f[7]), "T": int(f[8]), "p": f[1], "q": f[2], "m": True}
    return {"a": int(f[7]), "T": int(f[8]), "p": f[5], "q": f[4], "m": False}


def hour_end_ms(hour):
    start = datetime.strptime(hour, "%Y-%m-%dT%HZ").replace(tzinfo=timezone.utc)
    return int(start.timestamp() * 1000) + 3_600_000


class Recorder:
    def __init__(self, out_dir, symbol, settings):
        self.out, self.sym = out_dir, symbol.upper()
        self.settings = settings
        os.makedirs(out_dir, exist_ok=True)
        self.hours = {}           # hour -> {"trades": {a: trade}, "fh": file, "delta": float}
        self.raw = None
        self.raw_hour = None
        self.last_flush = time.time()

    def _tape_path(self, hour):
        return os.path.join(self.out, f"tape_{self.sym}_{hour}.csv")

    def _write_sorted(self, path, trades):
        tmp = path + ".tmp"
        delta = 0.0
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(HEADER)
            for a in sorted(trades):
                t = trades[a]
                delta += -float(t["q"]) if t["m"] else float(t["q"])
                f.write(tape_line(t, delta, self.settings) + "\n")
        os.replace(tmp, path)

    def _open(self, hour):
        path = self._tape_path(hour)
        trades = {}
        zipped = path + ".gz"
        source = path if os.path.exists(path) else zipped if os.path.exists(zipped) else None
        if source:             # restart within the same hour: keep what is already on disk
            opener = gzip.open if source.endswith(".gz") else open
            with opener(source, "rt", encoding="utf-8") as f:
                next(f, None)
                for line in f:
                    try:
                        t = parse_tape_line(line)
                        trades[t["a"]] = t
                    except (IndexError, ValueError):
                        continue
            self._write_sorted(path, trades)
        delta = sum(-float(t["q"]) if t["m"] else float(t["q"]) for t in trades.values())
        fh = open(path, "a", encoding="utf-8")
        if not trades:
            fh.write(HEADER)
        self.hours[hour] = {"trades": trades, "fh": fh, "delta": delta}

    def add_trade(self, t, now_ms):
        hour = utc_hour_key(t["T"])
        if hour not in self.hours:
            self._open(hour)                  # also reopens a finished hour if a very late trade arrives
        h = self.hours[hour]
        if t["a"] in h["trades"]:
            return
        h["trades"][t["a"]] = t
        h["delta"] += -float(t["q"]) if t["m"] else float(t["q"])
        h["fh"].write(tape_line(t, h["delta"], self.settings) + "\n")
        self.finalize_old(now_ms)

    def _finalize(self, hour):
        h = self.hours.pop(hour)
        h["fh"].close()
        self._write_sorted(self._tape_path(hour), h["trades"])   # sorted by trade ID, correct running delta

    def finalize_old(self, now_ms):
        for hour in [k for k in self.hours if now_ms > hour_end_ms(k) + GRACE_MS]:
            self._finalize(hour)

    def _raw_file(self, recv_ms):
        hour = utc_hour_key(recv_ms)
        if hour != self.raw_hour:
            if self.raw:
                self.raw.close()
            self.raw_hour = hour
            self.raw = gzip.open(os.path.join(self.out, f"raw_{self.sym}_{hour}.jsonl.gz"), "at", encoding="utf-8",
                                 compresslevel=1)
        return self.raw

    def add_raw(self, stream, data, recv_ms, src="ws"):
        self._raw_file(recv_ms).write(json.dumps({"recv_ms": recv_ms, "src": src, "stream": stream, "data": data},
                                                 separators=(",", ":")) + "\n")

    def add_raw_text(self, recv_ms, msg):
        """Same line format as add_raw, built from Binance's own text: {"recv_ms":..,"src":"ws","stream":..,"data":..}"""
        self._raw_file(recv_ms).write('{"recv_ms":%d,"src":"ws",%s\n' % (recv_ms, msg[1:]))

    def add_book(self, t_ms, update_id, bids, asks):
        hour = utc_hour_key(t_ms)
        if hour != getattr(self, "book_hour", None):
            if getattr(self, "book_fh", None):
                self.book_fh.close()
            self.book_hour = hour
            self.book_fh = gzip.open(os.path.join(self.out, f"book_{self.sym}_{hour}.jsonl.gz"), "at", encoding="utf-8",
                                     compresslevel=1)
        self.book_fh.write(json.dumps({"t": t_ms, "u": update_id, "b": bids, "a": asks}, separators=(",", ":")) + "\n")

    def flush(self, force=False):
        if force or time.time() - self.last_flush > 5:
            for h in self.hours.values():
                h["fh"].flush()
            if self.raw:
                self.raw.flush()
            if getattr(self, "book_fh", None):
                self.book_fh.flush()
            self.last_flush = time.time()

    def close(self):
        for hour in list(self.hours):
            self._finalize(hour)
        if self.raw:
            self.raw.close()
            self.raw = None
        if getattr(self, "book_fh", None):
            self.book_fh.close()
            self.book_fh = None


class Stats:
    """Live numbers for the console: trades, volume, delta, RALPH volume velocity, delay."""

    def __init__(self, settings):
        self.settings = settings
        self.sec = collections.OrderedDict()   # second -> [notional, signed notional]
        self.delays = collections.deque(maxlen=2000)
        self.msgs = 0
        self.trades = 0
        self.gaps = 0
        self.backfilled = 0
        self.liqs = 0
        self.last_price = None
        self.first_s = None       # velocity needs 5 minutes of history first
        self.oi = None
        self.book = None

    def add_trade(self, t, recv_ms):
        s = t["T"] // 1000
        if self.first_s is None:
            self.first_s = s
        n = float(t["p"]) * float(t["q"])
        x = self.sec.setdefault(s, [0.0, 0.0])
        x[0] += n
        x[1] += -n if t["m"] else n
        while self.sec and next(iter(self.sec)) < s - 400:
            self.sec.popitem(last=False)
        if "E" in t:
            self.delays.append(recv_ms - t["E"])
        self.trades += 1
        self.last_price = float(t["p"])

    def velocity(self, now_s):
        if self.first_s is None or now_s - self.first_s < 300:
            return float("nan")
        recent = sum(v[0] for k, v in self.sec.items() if now_s - 5 < k <= now_s)
        base = sum(v[0] for k, v in self.sec.items() if now_s - 300 < k <= now_s - 5)
        return recent / (base / 59) if base > 0 else float("nan")

    def line(self):
        now_s = int(time.time())
        last60 = [v for k, v in self.sec.items() if now_s - 60 < k <= now_s]
        vol = sum(v[0] for v in last60)
        delta = sum(v[1] for v in last60)
        vel = self.velocity(now_s)
        dl = sorted(self.delays)
        med_s = f"~{dl[len(dl) // 2]:.0f} ms" if dl else "-"
        price = f"{self.last_price:,.{self.settings.price_decimals}f}".replace(",", " ") if self.last_price else "-"
        if vel == vel:
            vel_s = f"{vel:.1f}x"
        else:
            warm = 300 - (now_s - self.first_s) if self.first_s else 300
            vel_s = f"za {warm} s" if warm > 0 else "-"
        return (f"{datetime.now():%H:%M:%S}  cena {price}  obchody {self.trades}  posledni minuta: "
                f"{vol / 1e6:.2f} M$  delta {delta / 1e6:+.2f} M$  velocity {vel_s}  "
                f"zpozdeni {med_s}  mezery {self.gaps} (doplneno {self.backfilled})  likvidace {self.liqs}"
                + self.book_text() + (f"  OI {self.oi:,.0f} BTC".replace(",", " ") if self.oi else ""))

    def book_text(self):
        bk = self.book
        if bk is None:
            return ""
        if bk.state != "synced":
            return "  book: synchronizuju"
        if not bk.bids or not bk.asks:
            return "  book: prazdny"
        bb, ba = max(bk.bids), min(bk.asks)
        return f"  book {len(bk.bids)}/{len(bk.asks)} urovni, spread {self.settings.price(ba - bb)}, resync {bk.resyncs}"


def rest_agg_trades(symbol, from_id, to_id):
    """Missing aggTrades by ID from REST. Each call costs 20 of the 2400 weight Binance allows per minute
    and IP, so we make at most one call per second (1200 per minute, half of the limit)."""
    out, nxt = [], from_id
    while nxt <= to_id:
        batch = rest_get(REST_AGG, {"symbol": symbol.upper(), "fromId": nxt, "limit": 1000})
        if not batch:
            break
        out.extend(t for t in batch if t["a"] <= to_id)
        nxt = batch[-1]["a"] + 1
        time.sleep(1.0)
    return out


def _retry_after(err, default):
    try:
        return max(1.0, float(err.headers.get("Retry-After") or default))
    except (TypeError, ValueError, AttributeError):
        return default


def rest_get(url, params, tries=5):
    """REST call that respects Binance limits: on 429 wait as long as Binance asks, on 418 (IP ban) stop."""
    q = urllib.parse.urlencode(params)
    for attempt in range(tries):
        try:
            with urllib.request.urlopen(url + "?" + q, timeout=20) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 418:
                print("Binance docasne blokuje REST z teto IP (HTTP 418), cekam a dotaz vzdavam", flush=True)
                time.sleep(_retry_after(e, 300))
                return None
            if e.code == 429:
                print("Binance hlasi prilis mnoho REST dotazu (HTTP 429), cekam", flush=True)
                time.sleep(_retry_after(e, 60))
                continue
            time.sleep(2 * (attempt + 1))
        except (urllib.error.URLError, TimeoutError):
            time.sleep(2 * (attempt + 1))
    return None


class OrderBook:
    """Full local order book, synced the way Binance documents it:
    buffer diff events, load a REST snapshot, drop events older than it, check that the first event spans
    the snapshot ID and that every next event's pu equals the previous u; otherwise start over."""

    def __init__(self):
        self.bids, self.asks = {}, {}
        self.state = "empty"          # empty -> loading -> synced
        self.buffer = []
        self.snapshot_id = None
        self.prev_u = None
        self.resyncs = 0

    def _reset(self, keep=None):
        self.bids, self.asks = {}, {}
        self.state = "loading"
        self.buffer = list(keep or [])
        self.prev_u = None
        self.resyncs += 1

    def _process(self, e):
        if e["u"] < self.snapshot_id:
            return True                               # older than the snapshot: drop
        if self.prev_u is None:
            if not (e["U"] <= self.snapshot_id <= e["u"] or e.get("pu") == self.snapshot_id):
                return False                          # snapshot and stream do not line up
        elif e["pu"] != self.prev_u:
            return False                              # an update was missed
        for side, levels in ((self.bids, e["b"]), (self.asks, e["a"])):
            for p, q in levels:
                p, q = float(p), float(q)
                if q == 0:
                    side.pop(p, None)
                else:
                    side[p] = q
        self.prev_u = e["u"]
        return True

    def restart(self):
        self.bids, self.asks = {}, {}
        self.state = "empty"
        self.buffer = []
        self.prev_u = None
        self.resyncs += 1

    def on_event(self, e):
        """Returns True while the book needs a (new) REST snapshot."""
        if self.state == "synced":
            if self._process(e):
                return False
            self._reset(keep=[e])
            return True
        self.buffer.append(e)
        if len(self.buffer) > 600:                    # keep at most ~60 s of updates while waiting
            self.buffer = self.buffer[-600:]
        self.state = "loading"
        return True

    def load_snapshot(self, snap):
        """Returns True when the snapshot did not line up and another one is needed."""
        self.bids = {float(p): float(q) for p, q in snap["bids"] if float(q) > 0}
        self.asks = {float(p): float(q) for p, q in snap["asks"] if float(q) > 0}
        self.snapshot_id = snap["lastUpdateId"]
        self.prev_u = None
        pending, self.buffer = self.buffer, []
        for e in pending:
            if not self._process(e):
                self._reset()
                return True
        self.state = "synced"
        return False

    def top(self, n=BOOK_LEVELS_SAVED):
        b = sorted(self.bids.items(), key=lambda x: -x[0])[:n]
        a = sorted(self.asks.items(), key=lambda x: x[0])[:n]
        return b, a


HEAT_RANGE, HEAT_STEP = 150.0, 2.0      # heatmap: +-150 USD around the price in 2 USD rows
FRAG_STEPS = (50, 100, 200)             # fragility: BTC resting within 50 / 100 / 200 USD of the best price


class LiveHub:
    """Local WebSocket that pushes live data to dashboards. A slow dashboard loses messages instead of slowing
    the collector: every client has its own small queue and the oldest message is dropped when it is full."""

    def __init__(self, port):
        self.port = port
        self.clients = {}
        self.snapshot = None

    def has_clients(self):
        return bool(self.clients)

    async def serve(self, stop):
        async def handler(ws):
            q = asyncio.Queue(maxsize=300)
            self.clients[ws] = q
            try:
                if self.snapshot:
                    await ws.send(self.snapshot())
                while True:
                    await ws.send(await q.get())
            except websockets.exceptions.ConnectionClosed:
                pass
            finally:
                self.clients.pop(ws, None)
        try:
            async with websockets.serve(handler, "127.0.0.1", self.port, max_size=2 ** 22):
                print(f"zive data pro dashboard: ws://localhost:{self.port}", flush=True)
                await stop.wait()
        except OSError as e:
            print(f"zivy port {self.port} nejde otevrit ({e}), dashboard pobezi bez zivych dat", flush=True)

    def push(self, obj):
        if not self.clients:
            return
        msg = json.dumps(obj, separators=(",", ":"))
        for q in list(self.clients.values()):
            if q.full():
                try:
                    q.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            q.put_nowait(msg)


class Handover:
    """NEW connection of one make-before-break handover, while OLD is still being processed."""

    def __init__(self):
        self.ws = None                  # NEW, once open
        self.buf = []                   # (recv_ms, msg) from NEW in arrival order; recv_ms = true receive time
        self.first = {}                 # stream -> key of NEW's first message of it (None: no switch condition)
        self.need = set()               # cadence streams NEW has not delivered yet (the caller fills it)
        self.seen = {}                  # stream -> time.monotonic() of NEW's last message of it (silence watchdog)
        self.full = False               # the buffer reached HANDOVER_BUFFER_MAX and the reader stopped
        self.error = None               # (stage, exception) when NEW failed before the switch
        self.waiter = None              # future _during_handover waits on; notify() resolves it
        self.task = None                # the reader
        self.t_start = time.monotonic()
        self.t_open = self.t_first = None
        self.t_ready = None             # time.monotonic() when NEW had delivered every cadence stream: it is ready
        self.open_wall = None           # time.time() when NEW opened: its RECONNECT_AFTER_S counts from here

    def notify(self):
        """Something changed (NEW opened, a message, an error, or stop): wake _during_handover."""
        w = self.waiter
        if w is not None and not w.done():
            w.set_result(None)


class Endpoint:
    """One endpoint's current connection, its handover state, and what the silence watchdog reads."""

    def __init__(self, kind, url, streams, ws):
        self.kind, self.url, self.streams, self.ws = kind, url, streams, ws
        self.cadence = cadence_streams(streams)
        self.watched = watched_streams(streams)
        self.started = time.time()
        self.t_conn = time.monotonic()  # the current connection opened; a stream it never sent is silent since then
        self.seen = {}                  # stream -> time.monotonic() of the current connection's last message of it
        self.handover = None            # Handover in progress
        self.retry_at = 0.0             # time.time() before which no handover starts (after a failed one)
        self.filter_until = None        # time.monotonic() until which NEW's duplicates are dropped
        self.report = None              # the last switch; printed when its filter ends


HANDOVER_REASONS = {"caught_up": "stare spojeni dohnalo nove", "max_time": "vyprsel HANDOVER_MAX_S",
                    "old_ended": "stare spojeni skoncilo", "buffer_full": "plny buffer"}


class Collector:
    def __init__(self, args):
        self.args = args
        self.sym = args.symbol.lower()
        self.settings = for_symbol(args.symbol, args.symbols_config, args.rest_base, overrides_from_args(args))
        print(
            f"symbol settings: {self.settings.symbol} tick_size={self.settings.tick_size} "
            f"price_decimals={self.settings.price_decimals}",
            flush=True,
        )
        self.rec = Recorder(args.out, self.sym, self.settings)
        self.stats = Stats(self.settings)
        self.last_a = None
        self.stop = asyncio.Event()
        self.book = OrderBook() if (args.book or args.all) else None
        self.stats.book = self.book
        self.snapshot_busy = False
        self.started = int(time.time() * 1000)
        self.last_a = self._last_recorded_id()
        self.engine = None
        self.live_sink = None
        self.hub = None
        self.tick_trades = []
        self.heat_cols = collections.deque(maxlen=900)      # last 15 minutes of heatmap columns
        self.ws_last = {}                   # stream -> key of the last processed ws message (stream_key)
        self.last_bbo_text = None           # last processed bookTicker as text; its u is parsed only when needed
        self._bbo_u = (None, None)          # (text, u) cache for _last_bbo_u
        self.liq_seen = collections.deque()  # (recv_ms, liq_identity) of the last LIQ_MEMORY_MS
        self.handovers = collections.deque(maxlen=100)          # one report per switch (also printed)
        self.handover_failures = collections.deque(maxlen=100)  # aborted handovers
        self._closing = {}                  # kind -> tasks closing a connection in the background
        if getattr(args, "features", None):
            self._start_engine(args.features)
            if self.engine is not None and getattr(args, "live_port", 0):
                self.hub = LiveHub(args.live_port)
                self.hub.snapshot = self._live_snapshot
                self.live_sink.on_bar = lambda bar, fp: self.hub.push({"type": "bar", "bar": bar, "fp": fp})
                self.live_sink.on_event = lambda e: self.hub.push({"type": "event", "e": e})

    def _last_recorded_id(self):
        """Continue from the last trade on disk, so trades missed during a restart are filled from REST."""
        files = sorted(f for f in os.listdir(self.rec.out)
                       if f.startswith(f"tape_{self.sym.upper()}_") and (f.endswith(".csv") or f.endswith(".csv.gz")))
        if not files:
            return None
        best = None
        path = os.path.join(self.rec.out, files[-1])
        opener = gzip.open if path.endswith(".gz") else open
        with opener(path, "rt", encoding="utf-8") as f:
            for line in f:
                parts = line.split(";")
                if len(parts) >= 9 and parts[7].isdigit():
                    best = max(best or 0, int(parts[7]))
        return best

    def _start_engine(self, out_dir):
        if ofe is None:
            print("orderflow_engine.py neni vedle binance_live.py, pocitani je vypnute", flush=True)
            return
        cfg = types.SimpleNamespace(tf=60, va=0.7, imb_ratio=3.0, vel=5.0, wick=0.25, **self.settings.__dict__)
        try:
            self.live_sink = ofe.LiveSink(out_dir, cfg.tf, self.settings)
            eng = ofe.Engine(cfg, ofe.NullSink())
            state = os.path.join(out_dir, "engine_state.json")
            eng.load_state(state)
            n = ofe.warm_up(eng, self.rec.out)
            eng.sink = self.live_sink
            eng.state_path = state
            self.engine = eng
            print(f"pocitani zapnuto, dohnal jsem {n} dnesnich obchodu z disku", flush=True)
        except Exception as e:
            self._engine_failed(e)

    def _engine_failed(self, e):
        print(f"chyba ve vypoctech, vypinam je (nahravani bezi dal): {e}", flush=True)
        traceback.print_exc()
        self.engine = None

    def _feed(self, stream, d):
        try:
            if stream.endswith("@aggTrade"):
                self.engine.on_trade(int(d["T"]), float(d["p"]), float(d["q"]), bool(d["m"]))
                if self.hub is not None:
                    self.tick_trades.append((int(d["E"]), float(d["p"]), float(d["q"]), bool(d["m"])))
            elif stream.endswith("@forceOrder"):
                o = d.get("o", {})
                self.engine.on_liq(int(o.get("T", d.get("E", 0))), o.get("S", ""), float(o.get("z") or o.get("q") or 0),
                                   float(o.get("p") or 0), float(o.get("ap") or 0))
            elif "@markPrice" in stream:
                self.engine.on_mark(int(d.get("E", 0)), d)
        except Exception as e:
            self._engine_failed(e)

    def on_message(self, msg, recv_ms, parsed=None):
        """One WebSocket message. The best bid/ask stream is the busiest one and is only recorded, never parsed
        (only a handover parses its u, see _last_bbo_u). `parsed`: the message as the handover filter parsed it."""
        if isinstance(msg, bytes):
            msg = msg.decode()
        if not msg.startswith('{"stream"'):
            return
        self.rec.add_raw_text(recv_ms, msg)
        if "@bookTicker" in msg[:48]:
            self.last_bbo_text = msg
            self.stats.msgs += 1
            self.rec.flush()
            return
        m = loads(msg) if parsed is None else parsed
        stream, data = m["stream"], m["data"]
        if stream.endswith("@forceOrder"):
            self._note_liq(data, recv_ms)
        else:
            key = stream_key(stream, data)
            if key is not None:
                self.ws_last[stream] = key
        self.handle(stream, data, recv_ms, raw_done=True)

    def _note_liq(self, data, recv_ms):
        seen = self.liq_seen
        seen.append((recv_ms, liq_identity(data)))
        while seen and seen[0][0] < recv_ms - LIQ_MEMORY_MS:
            seen.popleft()

    def _last_bbo_u(self):
        """u of the last processed bookTicker, parsed from its text only when a handover needs it."""
        text = self.last_bbo_text
        if text is None:
            return None
        if self._bbo_u[0] is not text:
            try:
                self._bbo_u = (text, loads(text)["data"]["u"])
            except (ValueError, KeyError, TypeError):
                self._bbo_u = (text, None)
        return self._bbo_u[1]

    def _last_key(self, stream):
        if stream.endswith("@bookTicker"):
            return self._last_bbo_u()
        if stream.endswith("@forceOrder"):
            return self.liq_seen[-1][1] if self.liq_seen else None
        return self.ws_last.get(stream)

    def handle(self, stream, data, recv_ms, src="ws", raw_done=False):
        self.stats.msgs += 1
        if not raw_done:
            self.rec.add_raw(stream, data, recv_ms, src)
        if stream.endswith("@aggTrade"):
            a = data["a"]
            if self.last_a is not None and a > self.last_a + 1 and src == "ws":
                self.stats.gaps += 1
                if a - self.last_a - 1 <= 300_000:
                    asyncio.get_running_loop().create_task(self.backfill(self.last_a + 1, a - 1))
                else:
                    print(f"mezera {a - self.last_a - 1} obchodu je moc velka na doplneni, preskakuji", flush=True)
            if self.last_a is None or a > self.last_a:
                self.last_a = a
            self.rec.add_trade(data, recv_ms)
            self.stats.add_trade(data, recv_ms)
        elif stream.endswith("@forceOrder"):
            self.stats.liqs += 1
        if self.engine is not None and src == "ws" and ("@aggTrade" in stream or "@forceOrder" in stream or "@markPrice" in stream):
            self._feed(stream, data)
        if "@depth@" in stream and self.book is not None:
            if self.book.on_event(data) and not self.snapshot_busy:
                self.snapshot_busy = True             # set before the task starts, so only one runs
                asyncio.get_running_loop().create_task(self.load_snapshot())
        self.rec.flush()

    async def load_snapshot(self):
        try:
            for attempt in range(10):
                await asyncio.sleep(0.5)          # let a few diff events buffer first
                snap = await asyncio.to_thread(rest_get, REST_DEPTH, {"symbol": self.sym.upper(), "limit": 1000})
                if not snap:
                    continue
                self.rec.add_raw(f"{self.sym}@depthSnapshot", snap, int(time.time() * 1000), src="rest")
                if not self.book.load_snapshot(snap):
                    return
        finally:
            self.snapshot_busy = False

    async def save_book(self):
        while not self.stop.is_set():
            await asyncio.sleep(1)
            if self.book is not None and self.book.state == "synced":
                b, a = self.book.top()
                t = int(time.time() * 1000)
                self.rec.add_book(t, self.book.prev_u, b, a)
                if self.engine is not None:
                    try:
                        self.engine.on_book(t, {"b": [list(x) for x in b], "a": [list(x) for x in a]})
                    except Exception as e:
                        self._engine_failed(e)

    async def poll_oi(self):
        while not self.stop.is_set():
            data = await asyncio.to_thread(rest_get, REST_OI, {"symbol": self.sym.upper()})
            if data:
                self.rec.add_raw(f"{self.sym}@openInterest", data, int(time.time() * 1000), src="rest")
                try:
                    self.stats.oi = float(data["openInterest"])
                    if self.engine is not None:
                        self.engine.on_oi(int(time.time() * 1000), self.stats.oi)
                except (KeyError, ValueError):
                    pass
            await asyncio.sleep(10)

    async def backfill(self, first, last):
        trades = await asyncio.to_thread(rest_agg_trades, self.sym, first, last)
        now = int(time.time() * 1000)
        for t in trades:
            t = {"e": "aggTrade", **t}
            self.handle(f"{self.sym}@aggTrade", t, now, src="rest")
        self.stats.backfilled += len(trades)

    async def run_endpoint(self, kind, streams):
        url = f"{self.args.ws_base}/{kind}/stream?streams=" + "/".join(streams)
        backoff = 1
        try:
            while not self.stop.is_set():
                try:
                    opened = await self._connect(url)
                    if opened is None:
                        break                                 # stop while connecting
                    ep = Endpoint(kind, url, streams, opened[0])
                    print(f"pripojeno: {kind} {', '.join(streams)}", flush=True)
                    if kind == "public" and self.book is not None and self.book.state != "empty":
                        self.book.restart()       # new connection: start the book over from a snapshot
                    backoff = 1
                    ep.started, ep.t_conn = opened[1], opened[2]
                    guard = asyncio.get_running_loop().create_task(self._guard(ep), name=f"watchdog-{kind}")
                    try:
                        await self._read(ep)
                    finally:
                        # Everything that closes is started before the first await: a second cancel (asyncio.run's
                        # teardown after main() cancelled us) interrupts only the waiting.
                        guard.cancel()
                        reader = self._end_endpoint(ep)
                        self._close_in_background(kind, ep.ws)    # usually closed already; never waited for here
                        await asyncio.wait([t for t in (guard, reader) if t is not None])
                        if not guard.cancelled() and guard.exception() is not None:
                            print(f"hlidac {kind} skoncil chybou: {guard.exception()!r}", flush=True)
                except (OSError, asyncio.TimeoutError, websockets.exceptions.WebSocketException) as err:
                    if self.stop.is_set():
                        break                                 # the stop closed or aborted the connection
                    if "451" in str(err):
                        print("Binance odmita tuhle IP (HTTP 451, typicky server v USA). Spust to z Evropy.", flush=True)
                    print(f"spojeni {kind} spadlo ({err.__class__.__name__}), zkousim znovu za {backoff} s", flush=True)
                    await self._sleep_unless_stop(backoff)
                    backoff = min(60, backoff * 2)
        finally:
            await self._drain_closing(kind)           # stop or cancel: background closes end, bounded by CLOSE_WAIT_S

    async def _connect(self, url):
        """(connection, time.time(), time.monotonic() when it opened), or None when stop is set first (the attempt
        is then cancelled, which aborts it). The open times are taken in the connecting task itself."""
        loop = asyncio.get_running_loop()

        async def opening():
            ws = await ws_connect(url)
            return ws, time.time(), time.monotonic()
        conn = loop.create_task(opening(), name="connect")
        stop = loop.create_task(self.stop.wait(), name="connect-stop")
        try:
            await asyncio.wait((conn, stop), return_when=asyncio.FIRST_COMPLETED)
        except BaseException:                         # run_endpoint cancelled while connecting
            conn.cancel()
            stop.cancel()
            await asyncio.wait((conn, stop))
            if not conn.cancelled() and conn.exception() is None:
                conn.result()[0].transport.abort()    # it opened anyway
            raise
        conn.cancel()                                 # no effect when it is done
        stop.cancel()
        await asyncio.wait((conn, stop))
        return None if conn.cancelled() else conn.result()   # result() raises the connect error

    async def _sleep_unless_stop(self, seconds):
        try:
            await asyncio.wait_for(self.stop.wait(), seconds)
        except asyncio.TimeoutError:
            pass

    async def _read(self, ep):
        """Reads the endpoint's current connection until it ends or stop is set, as `async for msg in ws` did.
        When the existing deadline check fires, a handover starts instead of leaving the connection."""
        while True:
            if ep.handover is not None:
                if not await self._during_handover(ep):
                    return
                continue
            try:
                msg = await ep.ws.recv()
            except websockets.exceptions.ConnectionClosedOK as err:
                if not self.stop.is_set():
                    print(f"spojeni {ep.kind} skoncilo ({err.__class__.__name__}: {err}), {self._old_age(ep)}, "
                          f"pripojuji znovu", flush=True)
                return
            if isinstance(msg, bytes):
                msg = msg.decode()
            note_stream(ep.seen, msg, time.monotonic())
            self._deliver(ep, msg, int(time.time() * 1000))
            if self.stop.is_set():
                return
            if time.time() - ep.started > RECONNECT_AFTER_S and time.time() >= ep.retry_at:
                self._start_handover(ep)

    def _start_handover(self, ep):
        """Its own method, so no frame of the reading loop keeps the Handover alive after the switch."""
        h = ep.handover = Handover()
        h.need = set(ep.cadence)
        h.task = asyncio.get_running_loop().create_task(
            self._handover_reader(ep.url, h), name=f"handover-new-{ep.kind}")

    def _old_age(self, ep):
        """OLD's age for the log lines, counted like RECONNECT_AFTER_S (Binance closes a connection after 24 h)."""
        return f"stare spojeni bezi uz {(time.time() - ep.started) / 3600:.1f} h"

    async def _guard(self, ep):
        """Silence watchdog of the endpoint's live connection, and the stop of a connection waiting in recv().
        A watched stream (watched_streams) that delivered nothing for SILENCE_MAX_S on the current connection (the
        only one, OLD during a handover, NEW once switched to): one log line, the connection is aborted, and
        run_endpoint reconnects through its error path (aggTrade gap -> REST backfill, public -> book restart), or
        a handover whose NEW is ready switches ('old_ended'). NEW is not current before the switch; its readiness
        covers it. run_endpoint cancels this task when reading ends."""
        fired = None
        while True:
            try:
                await asyncio.wait_for(self.stop.wait(), min(WATCHDOG_TICK_S, SILENCE_MAX_S / 10))
                break
            except asyncio.TimeoutError:
                pass
            if ep.seen is fired or not ep.watched:
                continue                              # already aborted, waiting for _read to notice
            now = time.monotonic()
            stream, silent = max(((s, now - ep.seen.get(s, ep.t_conn)) for s in ep.watched), key=lambda x: x[1])
            if silent >= SILENCE_MAX_S:
                fired = ep.seen
                print(f"hlidac ticha {ep.kind}: {stream} bez zpravy {silent:.1f} s (limit {SILENCE_MAX_S:g} s) na "
                      f"spojeni otevrenem pred {(now - ep.t_conn) / 3600:.2f} h, rusim ho a pripojuji znovu", flush=True)
                ep.ws.transport.abort()
        # stop: _read returns by itself on the next message (and this task is cancelled); a silent one is closed
        if ep.handover is not None:
            ep.handover.notify()                      # _during_handover sees stop at once
        await asyncio.sleep(STOP_GRACE_S)
        ws = ep.ws
        self._close_in_background(ep.kind, ws)
        await asyncio.sleep(CLOSE_WAIT_S)
        ws.transport.abort()                          # the close handshake did not finish in time

    async def _handover_reader(self, url, h):
        """Opens NEW and buffers its messages with their true receive time until the switch cancels it
        (recv() is cancel-safe: a message is either in the buffer or still unread on NEW). NEW is ready once every
        stream in h.need has delivered a message."""
        try:
            h.ws = await asyncio.wait_for(ws_connect(url), HANDOVER_CONNECT_TIMEOUT_S)
        except Exception as err:
            h.error = ("connect", err)
            h.notify()
            return
        h.t_open, h.open_wall = time.monotonic(), time.time()
        h.notify()
        try:
            while len(h.buf) < HANDOVER_BUFFER_MAX:
                msg = await h.ws.recv()
                recv_ms, now = int(time.time() * 1000), time.monotonic()
                if isinstance(msg, bytes):
                    msg = msg.decode()
                h.buf.append((recv_ms, msg))
                if h.t_first is None:
                    h.t_first = now
                stream = stream_of(msg)
                if stream is not None:
                    h.seen[stream] = now
                    if stream not in h.first:                 # parsed once per stream
                        no_condition = stream.endswith("@forceOrder")
                        h.first[stream] = None if no_condition else stream_key(stream, loads(msg)["data"])
                        h.need.discard(stream)
                if h.t_ready is None and not h.need:
                    h.t_ready = now
                h.notify()
            h.full = True
        except Exception as err:                      # NEW closed or broke before the switch
            h.error = ("read", err)
        h.notify()

    def _handover_state(self, h):
        """What the handover does now: ("switch", reason), ("abort", stage), or (None, seconds to the next deadline;
        None: wait for h.notify()). A NEW that is not ready is never switched to, by any path."""
        now = time.monotonic()
        full = h.full or len(h.buf) >= HANDOVER_BUFFER_MAX
        if h.t_ready is None:
            if h.t_open is None:
                return None, None                     # still opening; HANDOVER_CONNECT_TIMEOUT_S ends that
            if full:
                return "abort", "buffer_full"
            left = h.t_open + HANDOVER_READY_MAX_S - now
            return ("abort", "not_ready") if left <= 0 else (None, left)
        for stream, key in h.first.items():
            if key is None:
                continue                              # forceOrder: no condition
            last = self._last_key(stream)
            if last is None or last < key:
                break
        else:
            return "switch", "caught_up"              # OLD reached NEW's first key on every stream
        left = h.t_ready + HANDOVER_MAX_S - now
        if left <= 0:
            return "switch", "max_time"
        if full:
            return "switch", "buffer_full"
        return None, left

    async def _during_handover(self, ep):
        """OLD is processed as usual while NEW connects and buffers. Returns True after a switch or an abort,
        False when reading must stop: stop is set, or OLD ended normally without a ready NEW. OLD ending with an
        error and no ready NEW raises that error (today's reconnect path)."""
        h = ep.handover
        loop = asyncio.get_running_loop()
        recv = None
        try:
            while True:
                if self.stop.is_set():
                    return False                      # the watchdog task notifies h when stop is set
                if h.error is not None:
                    action, detail = "abort", h.error[0]
                    break
                action, detail = self._handover_state(h)
                if action is not None:
                    break
                if recv is None:
                    recv = loop.create_task(ep.ws.recv(), name=f"handover-old-{ep.kind}")
                if h.waiter is None or h.waiter.done():
                    h.waiter = loop.create_future()   # state is read above, so no notify() is missed
                await asyncio.wait((recv, h.waiter), timeout=detail, return_when=asyncio.FIRST_COMPLETED)
                if recv.done():
                    done, recv = recv, None
                    try:
                        msg = done.result()
                    except websockets.exceptions.ConnectionClosed as err:
                        if h.t_ready is not None and h.error is None:
                            action, detail = "switch", "old_ended"
                        else:
                            action, detail = "old_ended", err     # no ready NEW: drop it, reconnect at once
                        break
                    if isinstance(msg, bytes):
                        msg = msg.decode()
                    note_stream(ep.seen, msg, time.monotonic())
                    self._deliver(ep, msg, int(time.time() * 1000))
        finally:
            h.waiter = None
            if recv is not None and not recv.done():
                recv.cancel()                         # OLD's recv() is cancel-safe: an unread message stays queued
                await asyncio.wait((recv,))           # OLD's recv() must be free before OLD is read again
            if recv is not None and not recv.cancelled():
                recv.exception()                      # retrieved, so asyncio never warns about it
        if action == "switch":
            await self._switch(ep, detail)
            return True
        if action == "abort":
            await self._abort_handover(ep, detail)
            return True
        await self._abort_handover(ep, "old_ended", old_err=detail)
        if isinstance(detail, websockets.exceptions.ConnectionClosedOK):
            return False                              # run_endpoint connects again at once
        raise detail                                  # run_endpoint's error path

    async def _switch(self, ep, reason):
        """OLD -> NEW. OLD is closed in a background task the reading loop never waits for; NEW's buffer and then
        its live messages pass the duplicate filter for HANDOVER_FILTER_S. The book is not restarted: a depth
        event whose pu does not continue resyncs it through on_event, an aggTrade gap is backfilled in handle."""
        h = ep.handover
        if not h.task.done():
            h.task.cancel()                           # the reader stops at recv(), nothing is lost
        await asyncio.wait((h.task,))
        if ep.report is not None:
            self._filter_done(ep)
        old, ep.ws, ep.handover = ep.ws, h.ws, None
        ep.started = h.open_wall
        ep.seen, ep.t_conn = h.seen, h.t_open         # the watchdog now watches NEW, with NEW's own arrival times
        self._close_in_background(ep.kind, old)
        now = time.monotonic()
        ep.filter_until = now + HANDOVER_FILTER_S
        ep.report = {"kind": ep.kind, "reason": reason, "seconds": now - h.t_open, "buffered": len(h.buf),
                     "dropped": {s.split("@", 1)[-1]: 0 for s in ep.streams}, "depth_continued": None,
                     "agg_gap": None, "old_last": {s: self._last_key(s) for s in ep.streams},
                     "t_start": h.t_start, "t_open": h.t_open, "t_first": h.t_first, "t_ready": h.t_ready,
                     "t_switch": now, "switch_ms": int(time.time() * 1000), "t_filter_end": None}
        self.handovers.append(ep.report)
        for recv_ms, msg in h.buf:
            self._deliver(ep, msg, recv_ms)

    def _deliver(self, ep, msg, recv_ms):
        """A message from the endpoint's current connection; within HANDOVER_FILTER_S after a switch it first
        passes the duplicate filter."""
        if ep.filter_until is not None:
            if time.monotonic() < ep.filter_until:
                self._filter(ep, msg, recv_ms)
                return
            self._filter_done(ep)
        self.on_message(msg, recv_ms)

    def _filter(self, ep, msg, recv_ms):
        """Drops a message already processed (key <= the stream's last key, or a forceOrder seen in the last
        LIQ_MEMORY_MS): neither recorded nor handled."""
        if isinstance(msg, bytes):
            msg = msg.decode()
        if not msg.startswith('{"stream"'):
            return
        m = loads(msg)
        stream, data = m["stream"], m["data"]
        rep = ep.report
        if stream.endswith("@forceOrder"):
            key = liq_identity(data)
            cutoff = int(time.time() * 1000) - LIQ_MEMORY_MS
            dup = any(ident == key for t, ident in self.liq_seen if t >= cutoff)
        else:
            key = stream_key(stream, data)
            last = self._last_key(stream)
            dup = key is not None and last is not None and key <= last
        if dup:
            name = stream.split("@", 1)[-1]
            rep["dropped"][name] = rep["dropped"].get(name, 0) + 1
            return
        if "@depth" in stream and rep["depth_continued"] is None:
            rep["depth_continued"] = data.get("pu") == self.ws_last.get(stream)
        elif stream.endswith("@aggTrade") and rep["agg_gap"] is None:
            rep["agg_gap"] = self.last_a is not None and key is not None and key > self.last_a + 1
        self.on_message(msg, recv_ms, parsed=m)
        if stream.endswith("@bookTicker"):
            self._bbo_u = (self.last_bbo_text, key)

    def _filter_done(self, ep):
        rep, ep.report, ep.filter_until = ep.report, None, None
        rep["t_filter_end"] = time.monotonic()
        yes_no = {None: "-", True: "ano", False: "ne"}
        dropped = ", ".join(f"{k} {v}" for k, v in rep["dropped"].items())
        print(f"predavani {rep['kind']}: prepnuto {rep['seconds']:.3f} s po otevreni noveho spojeni "
              f"({HANDOVER_REASONS[rep['reason']]}), v bufferu {rep['buffered']}, zahozene duplicity: {dropped}, "
              f"kniha navazala (pu == posledni u): {yes_no[rep['depth_continued']]}, "
              f"mezera v obchodech: {yes_no[rep['agg_gap']]}", flush=True)

    async def _abort_handover(self, ep, stage, old_err=None):
        """Drops NEW and logs one line. stage: connect / read (NEW failed), not_ready (not ready within
        HANDOVER_READY_MAX_S of opening), buffer_full (the buffer filled before NEW was ready): OLD keeps the feed
        and the next try comes no sooner than HANDOVER_RETRY_S. old_ended: OLD ended without a ready NEW, and the
        caller reconnects. NEW's reader is cancelled (cancel-safe, no handshake) and NEW is closed in the background,
        so the data path never waits for a close handshake."""
        h, ep.handover = ep.handover, None
        h.task.cancel()                               # no effect when it is done; awaited at the end
        ep.retry_at = time.time() + HANDOVER_RETRY_S
        if h.ws is not None:
            self._close_in_background(ep.kind, h.ws)
        missing = ", ".join(sorted(h.need)) or "-"
        n, age, retry = len(h.buf), self._old_age(ep), f"dalsi pokus nejdriv za {HANDOVER_RETRY_S} s"
        if stage in ("connect", "read"):
            err = h.error[1]
            error = f"{err.__class__.__name__}: {err}"
            what = "se neotevrelo" if stage == "connect" else f"spadlo pred prepnutim, zahazuji {n} zprav"
            line = f"nove spojeni {what} ({error}), stare bezi dal, {age}, {retry}"
        elif stage == "not_ready":
            error = f"not ready {HANDOVER_READY_MAX_S:g} s after opening, missing: {missing}"
            line = (f"nove spojeni neni pripravene ani {HANDOVER_READY_MAX_S:g} s po otevreni, chybi: {missing}, "
                    f"zahazuji ho ({n} zprav v bufferu), stare bezi dal, {age}, {retry}")
        elif stage == "buffer_full":
            error = f"buffer full ({n}) before ready, missing: {missing}"
            line = (f"nove spojeni zaplnilo buffer ({n} zprav) a neni pripravene, chybi: {missing}, zahazuji ho, "
                    f"stare bezi dal, {age}, {retry}")
        else:
            state = ("se jeste otevira" if h.ws is None and h.error is None else
                     f"selhalo ({h.error[1].__class__.__name__})" if h.error is not None else f"chybi: {missing}")
            error = f"old ended ({old_err.__class__.__name__}), NEW not ready: {state}"
            line = (f"nove spojeni neni pripravene ({state}) a stare skoncilo ({old_err.__class__.__name__}: "
                    f"{old_err}), {age}, zahazuji nove a pripojuji znovu")
        self.handover_failures.append({"kind": ep.kind, "stage": stage, "error": error, "missing": sorted(h.need),
                                       "buffered": n, "old_age_s": time.time() - ep.started, "t": time.monotonic()})
        print(f"predavani {ep.kind}: {line}", flush=True)
        await asyncio.wait((h.task,))

    def _end_endpoint(self, ep):
        """The endpoint's connection is ending (error, end, stop or cancel): an unfinished handover is dropped, its
        reader cancelled (a connect in progress is then aborted by websockets) and its NEW, if open, closed in the
        background; a report still in its filter window is printed. Returns the reader task for the caller to await,
        or None. Never awaits, so a cancel cannot skip the closing."""
        h, ep.handover = ep.handover, None
        reader = None
        if h is not None:
            if not h.task.done():
                h.task.cancel()
                reader = h.task
            if h.ws is not None:
                self._close_in_background(ep.kind, h.ws)
        if ep.report is not None:
            self._filter_done(ep)
        return reader

    def _close_in_background(self, kind, ws):
        """Closes a connection in its own task (the close handshake can take close_timeout); a reference is kept
        and its exception is printed, never raised. Cancelled (even before it ran), it aborts the connection."""
        async def close():
            try:
                await ws.close()
            except Exception as err:
                print(f"zavirani spojeni {kind} v pozadi: {err.__class__.__name__}: {err}", flush=True)

        def done(t):
            tasks.pop(t, None)
            if t.cancelled():
                ws.transport.abort()
        task = asyncio.get_running_loop().create_task(close(), name=f"handover-close-{kind}")
        tasks = self._closing.setdefault(kind, {})                # task -> its connection
        tasks[task] = ws
        task.add_done_callback(done)

    async def _drain_closing(self, kind):
        """At the end of run_endpoint: background closes get CLOSE_WAIT_S, then their connections are aborted."""
        tasks = self._closing.get(kind)
        if not tasks:
            return
        try:
            _, pending = await asyncio.wait(set(tasks), timeout=CLOSE_WAIT_S)
        except asyncio.CancelledError:                # asyncio.run's teardown: no more waiting
            for ws in list(tasks.values()):
                ws.transport.abort()
            raise
        for t in pending:
            ws = tasks.get(t)
            if ws is not None:
                ws.transport.abort()
        if pending:
            await asyncio.wait(pending, timeout=CLOSE_WAIT_S)

    def _heat_column(self, t):
        bk = self.book
        if bk is None or bk.state != "synced" or not bk.bids or not bk.asks:
            return None
        best_bid, best_ask = max(bk.bids), min(bk.asks)
        mid = (best_bid + best_ask) / 2
        heat_range, heat_step = self.settings.heat_range, self.settings.heat_step
        lo = math.floor((mid - heat_range) / heat_step) * heat_step
        n = int(2 * heat_range / heat_step) + 1
        b, a = [0.0] * n, [0.0] * n
        frag = {}
        far = max(self.settings.frag_steps)
        bid_lv = sorted(((p, q) for p, q in bk.bids.items() if p >= min(lo, best_bid - far)), reverse=True)
        ask_lv = sorted((p, q) for p, q in bk.asks.items() if p <= max(lo + n * heat_step, best_ask + far))
        for p, q in bid_lv:
            i = int((p - lo) // heat_step)
            if 0 <= i < n:
                b[i] += q
        for p, q in ask_lv:
            i = int((p - lo) // heat_step)
            if 0 <= i < n:
                a[i] += q
        for x in self.settings.frag_steps:
            frag[f"d{x}"] = round(sum(q for p, q in bid_lv if p >= best_bid - x), 2)
            frag[f"u{x}"] = round(sum(q for p, q in ask_lv if p <= best_ask + x), 2)
        known = {"bid_lo": min(bk.bids), "ask_hi": max(bk.asks)}
        return {"type": "heat", "t": t, "mid": float(self.settings.price(mid)), "lo": float(self.settings.price(lo)),
                "step": heat_step,
                "b": [round(v, 2) for v in b], "a": [round(v, 2) for v in a], "frag": frag, "known": known}

    async def live_heat(self):
        while not self.stop.is_set():
            await asyncio.sleep(1)
            try:
                col = self._heat_column(int(time.time() * 1000))
            except Exception as e:
                print(f"heatmapa: {e}", flush=True)
                col = None
            if col:
                self.heat_cols.append(col)
                self.hub.push(col)

    async def live_ticks(self):
        n = 0
        while not self.stop.is_set():
            await asyncio.sleep(0.1)
            n += 1
            trades, self.tick_trades = self.tick_trades, []
            if not self.hub.has_clients() or self.engine is None:
                continue
            agg, e_max = {}, 0
            for e, p, q, sell in trades:
                k = (1 if sell else 0, round(p / self.settings.tick_size) * self.settings.tick_size)
                x = agg.setdefault(k, [0.0, 0, p, p])
                x[0] += q
                x[1] += 1
                x[2], x[3] = min(x[2], p), max(x[3], p)
                e_max = max(e_max, e)
            b = self.engine.bar
            bk = self.book
            tick = {"type": "tick", "t": int(time.time() * 1000), "e": e_max or None, "price": self.engine.last_price,
                    "vel": None if self.engine.vel_last != self.engine.vel_last else round(self.engine.vel_last, 1),
                    "tr": [[s, lo, hi, round(q, 3), c] for (s, _), (q, c, lo, hi) in agg.items()]}
            if bk is not None and bk.state == "synced" and bk.bids and bk.asks:
                tick["bb"], tick["ba"] = max(bk.bids), min(bk.asks)
            if b is not None:
                tick["bar"] = {"t": b["start"], "o": b["open"], "h": b["high"], "l": b["low"], "c": b["close"],
                               "v": round(b["volume"], 3), "d": round(b["bought"] - b["sold"], 3)}
                if n % 5 == 0:
                    tick["fp"] = [[x, round(v[0], 3), round(v[1], 3)] for x, v in sorted(b["fp"].items(), reverse=True)]
            self.hub.push(tick)

    def _live_snapshot(self):
        sink = self.live_sink
        return json.dumps({"type": "snapshot", "t": int(time.time() * 1000), "bars": list(sink.recent_bars),
                           "events": sink._pick_events(), "heat": list(self.heat_cols),
                           "status": self.engine.status() if self.engine else None}, separators=(",", ":"))

    async def write_live(self):
        while not self.stop.is_set():
            await asyncio.sleep(2)
            if self.engine is None or self.live_sink is None:
                continue
            dl = sorted(self.stats.delays)
            bk = self.book
            extra = {"started": self.started, "trades": self.stats.trades, "gaps": self.stats.gaps,
                     "backfilled": self.stats.backfilled, "liquidations": self.stats.liqs,
                     "delay_ms": dl[len(dl) // 2] if dl else None,
                     "book": None if bk is None else {"state": bk.state, "bids": len(bk.bids), "asks": len(bk.asks),
                                                      "resyncs": bk.resyncs},
                     "data_dir": self.rec.out}
            try:
                snap = self.live_sink.build_live(self.engine, extra)        # in the loop: no race with new trades
                if self.hub is not None:
                    self.hub.push({"type": "status", "status": snap["status"], "collector": extra})
                await asyncio.to_thread(self.live_sink.write_json, snap)
            except Exception as e:
                print(f"live.json se nepovedlo zapsat: {e}", flush=True)

    async def report(self):
        while not self.stop.is_set():
            await asyncio.sleep(10)
            if not self.args.quiet:
                print(self.stats.line(), flush=True)

    async def main(self):
        loop = asyncio.get_running_loop()
        for s in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(s, self.stop.set)
            except NotImplementedError:
                pass
        market = [f"{self.sym}@aggTrade", f"{self.sym}@forceOrder", f"{self.sym}@markPrice@1s"]
        want_bbo = self.args.bbo or self.args.all
        public = ([f"{self.sym}@depth@100ms"] if self.book is not None else []) + ([f"{self.sym}@bookTicker"] if want_bbo else [])
        tasks = [asyncio.create_task(self.run_endpoint("market", market)), asyncio.create_task(self.report()),
                 asyncio.create_task(self.write_live())]
        if self.hub is not None:
            tasks += [asyncio.create_task(self.hub.serve(self.stop)), asyncio.create_task(self.live_ticks()),
                      asyncio.create_task(self.live_heat())]
        if public:
            tasks.append(asyncio.create_task(self.run_endpoint("public", public)))
        if self.book is not None:
            tasks.append(asyncio.create_task(self.save_book()))
        if self.args.oi or self.args.all:
            tasks.append(asyncio.create_task(self.poll_oi()))
        await self.stop.wait()
        for t in tasks:
            t.cancel()
        self.rec.close()
        if self.live_sink is not None:
            self.live_sink.close()
        print("ulozeno, konec", flush=True)


def main():
    ap = argparse.ArgumentParser(description="Live nahravani Binance Futures dat do souboru.")
    ap.add_argument("--symbol", default="btcusdt")
    ap.add_argument("--out", default="binance_data")
    ap.add_argument("--bbo", action="store_true", help="nahravat i nejlepsi bid/ask pri kazde zmene")
    ap.add_argument("--book", action="store_true", help="nahravat cely order book (zmeny po 100 ms + snapshoty)")
    ap.add_argument("--oi", action="store_true", help="nahravat open interest kazdych 10 s")
    ap.add_argument("--all", action="store_true", help="vsechno: obchody, cely order book, nejlepsi bid/ask, likvidace, funding, OI")
    ap.add_argument("--quiet", action="store_true", help="nevypisovat stav kazdych 10 s")
    ap.add_argument("--features", help="zaroven pocitat orderflow (orderflow_engine.py) a zapisovat sem, vcetne live.json")
    ap.add_argument("--live-port", type=int, default=8051, help="port pro zivy dashboard (0 = vypnuto), jen s --features")
    ap.add_argument("--ws-base", default=WS_BASE, help=argparse.SUPPRESS)       # for the local load test
    ap.add_argument("--rest-base", default="https://fapi.binance.com", help=argparse.SUPPRESS)
    add_cli_args(ap)
    args = ap.parse_args()
    global REST_AGG, REST_DEPTH, REST_OI
    REST_AGG, REST_DEPTH, REST_OI = (args.rest_base + "/fapi/v1/aggTrades", args.rest_base + "/fapi/v1/depth",
                                     args.rest_base + "/fapi/v1/openInterest")
    asyncio.run(Collector(args).main())


if __name__ == "__main__":
    main()
