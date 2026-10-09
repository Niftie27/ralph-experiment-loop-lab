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
triggers a fresh snapshot automatically.

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

    def on_message(self, msg, recv_ms):
        """One WebSocket message. The best bid/ask stream is the busiest one and is only recorded, never parsed."""
        if isinstance(msg, bytes):
            msg = msg.decode()
        if not msg.startswith('{"stream"'):
            return
        self.rec.add_raw_text(recv_ms, msg)
        if "@bookTicker" in msg[:48]:
            self.stats.msgs += 1
            self.rec.flush()
            return
        m = loads(msg)
        self.handle(m["stream"], m["data"], recv_ms, raw_done=True)

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
        while not self.stop.is_set():
            try:
                async with websockets.connect(url, ping_interval=20, ping_timeout=20, max_size=2 ** 22) as ws:
                    print(f"pripojeno: {kind} {', '.join(streams)}", flush=True)
                    if kind == "public" and self.book is not None and self.book.state != "empty":
                        self.book.restart()       # new connection: start the book over from a snapshot
                    backoff = 1
                    started = time.time()
                    async for msg in ws:
                        self.on_message(msg, int(time.time() * 1000))
                        if time.time() - started > RECONNECT_AFTER_S or self.stop.is_set():
                            break
            except (OSError, asyncio.TimeoutError, websockets.exceptions.WebSocketException) as err:
                if "451" in str(err):
                    print("Binance odmita tuhle IP (HTTP 451, typicky server v USA). Spust to z Evropy.", flush=True)
                print(f"spojeni {kind} spadlo ({err.__class__.__name__}), zkousim znovu za {backoff} s", flush=True)
                await asyncio.sleep(backoff)
                backoff = min(60, backoff * 2)

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
