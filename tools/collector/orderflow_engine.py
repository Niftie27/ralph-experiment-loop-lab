#!/usr/bin/env python3
"""
orderflow_engine.py - computes ATAS X style orderflow data from the files recorded by binance_live.py.

    python3 orderflow_engine.py --data ~/data/binance --out ~/data/features

Everything is computed from data that existed BEFORE each bar closed (no look-ahead), so the same numbers
can later be produced live for the bot.

Output files in --out:
  bars_60s.csv            one row per bar: OHLCV, bought/sold, delta, max/min delta, CVD, bar POC, session VWAP
                          and weekly VWAP with deviations, diagonal imbalances and stacks, cluster hits, big
                          trades, volume velocity, absorption and exhaustion, liquidations, mark/index/funding,
                          open interest and its change, order book (spread, depth, imbalance, biggest walls),
                          developing session POC/VAH/VAL, previous day levels, nearest naked POCs
  footprint_60s.jsonl.gz  every bar's footprint: price level, sold at bid, bought at ask, number of trades
  events.jsonl            big trades (whole market orders), velocity spikes, absorption, stacked imbalances,
                          cluster hits, liquidations, order book walls added / filled / pulled, naked POC touches
  sessions.csv            one row per UTC day: OHLC, volume, delta, VWAP, POC, VAH, VAL
  all_prices_<day>.csv    tick-level volume profile in the ATAS "All Prices" format, compare 1:1 with ATAS X

Options: --tf bar seconds (60), --level footprint price step in USD (5), --big big order BTC (10),
         --imb-ratio (3), --imb-min BTC (2), --cluster BTC (25), --vel alert x (5), --wall BTC (25),
         --from / --to UTC like 2026-10-08T10:00, --no-raw (skip liquidations, funding and OI: faster)
"""
import argparse
import csv
import glob
import gzip
import heapq
import json
import math
import os
import statistics
import sys
import zlib
from collections import deque
from datetime import datetime, timezone

NAN = float("nan")


def fbin(p, step):
    return round(math.floor(p / step + 1e-9) * step, 8)


def iso(ms):
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def day_key(ms):
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")


def week_key(ms):
    y, w, _ = datetime.fromtimestamp(ms / 1000, tz=timezone.utc).isocalendar()
    return f"{y}-W{w:02d}"


def r(x, d=1):
    return "" if x is None or (isinstance(x, float) and math.isnan(x)) else round(x, d)


class VWAP:
    def __init__(self):
        self.v = self.s1 = self.s2 = 0.0
        self.p0 = None

    def add(self, p, q):
        if self.p0 is None:
            self.p0 = p
        d = p - self.p0
        self.v += q
        self.s1 += d * q
        self.s2 += d * d * q

    def value(self):
        if self.v <= 0:
            return NAN, NAN
        m = self.s1 / self.v
        return self.p0 + m, math.sqrt(max(0.0, self.s2 / self.v - m * m))


class Profile:
    """Volume at every exact price (like ATAS All Prices) plus a binned copy for the value area."""

    def __init__(self, vbin):
        self.lv = {}            # price -> [bought at ask, sold at bid, trades]
        self.bins = {}
        self.vbin = vbin
        self.total = 0.0
        self.poc_px, self.poc_vol = NAN, -1.0

    def add(self, p, q, sell):
        L = self.lv.get(p)
        if L is None:
            L = self.lv[p] = [0.0, 0.0, 0]
        L[1 if sell else 0] += q
        L[2] += 1
        v = L[0] + L[1]
        if v > self.poc_vol:
            self.poc_px, self.poc_vol = p, v
        b = fbin(p, self.vbin)
        self.bins[b] = self.bins.get(b, 0.0) + q
        self.total += q

    def value_area(self, share=0.7):
        if not self.bins:
            return NAN, NAN
        arr = sorted(self.bins.items())
        pi = max(range(len(arr)), key=lambda i: arr[i][1])
        lo = hi = pi
        acc = arr[pi][1]
        while acc < share * self.total and (lo > 0 or hi < len(arr) - 1):
            up = arr[hi + 1][1] if hi < len(arr) - 1 else -1.0
            dn = arr[lo - 1][1] if lo > 0 else -1.0
            if up >= dn:
                hi += 1
                acc += up
            else:
                lo -= 1
                acc += dn
        return arr[hi][0] + self.vbin, arr[lo][0]


BAR_COLUMNS = [
    "time", "t_ms", "open", "high", "low", "close", "volume", "bought", "sold", "delta", "delta_pct", "trades",
    "max_delta", "min_delta", "cvd_session", "poc", "poc_vol",
    "vwap", "vwap_sd", "vwap_dist_sd", "wvwap", "wvwap_sd", "wvwap_dist_sd",
    "buy_imb", "sell_imb", "stack_buy", "stack_sell", "cluster_hits",
    "big_count", "big_bought", "big_sold", "big_max", "big_max_side",
    "vel_max", "absorb_candle", "absorb_high", "absorb_low", "exhaust_high", "exhaust_low",
    "liq_long", "liq_short", "liq_count", "mark", "index", "premium", "funding", "oi", "d_oi",
    "best_bid", "best_ask", "spread", "bid_depth", "ask_depth", "book_imb", "bid_wall_px", "bid_wall_qty",
    "ask_wall_px", "ask_wall_qty",
    "s_poc", "s_vah", "s_val", "s_high", "s_low",
    "pd_high", "pd_low", "pd_poc", "pd_vah", "pd_val", "pd_vwap", "naked_poc_above", "naked_poc_below",
]
SESSION_COLUMNS = ["day", "open", "high", "low", "close", "volume", "bought", "sold", "delta", "trades",
                   "vwap", "poc", "vah", "val", "partial"]


class Sink:
    def __init__(self, out_dir, tf):
        os.makedirs(out_dir, exist_ok=True)
        self.out = out_dir
        self.bars_f = open(os.path.join(out_dir, f"bars_{tf}s.csv"), "w", newline="")
        self.bars = csv.writer(self.bars_f)
        self.bars.writerow(BAR_COLUMNS)
        self.fp = gzip.open(os.path.join(out_dir, f"footprint_{tf}s.jsonl.gz"), "wt", encoding="utf-8")
        self.ev = open(os.path.join(out_dir, "events.jsonl"), "w", encoding="utf-8")
        self.ses_f = open(os.path.join(out_dir, "sessions.csv"), "w", newline="")
        self.ses = csv.writer(self.ses_f)
        self.ses.writerow(SESSION_COLUMNS)
        self.counts = {"bars": 0}

    def bar(self, row, footprint):
        self.bars.writerow([row.get(c, "") for c in BAR_COLUMNS])
        self.fp.write(json.dumps(footprint, separators=(",", ":")) + "\n")
        self.counts["bars"] += 1

    def event(self, e):
        self.ev.write(json.dumps(e, separators=(",", ":")) + "\n")
        self.counts[e["type"]] = self.counts.get(e["type"], 0) + 1

    def session(self, row, profile, day, partial):
        self.ses.writerow([row.get(c, "") for c in SESSION_COLUMNS])
        name = f"all_prices_{day}{'_partial' if partial else ''}.csv"
        with open(os.path.join(self.out, name), "w", encoding="utf-8") as f:
            f.write("Price;Volume;Trades;Bid;Asks;Delta\n")
            for p, (buy, sell, n) in sorted(profile.lv.items(), key=lambda kv: -(kv[1][0] + kv[1][1])):
                f.write(f"{p:.1f};{buy + sell:.3f};{n};{sell:.3f};{buy:.3f};{buy - sell:.3f}\n")

    def close(self):
        for f in (self.bars_f, self.fp, self.ev, self.ses_f):
            f.close()


class NullSink:
    """Used while the live engine catches up on today's recorded trades: nothing is written twice."""
    counts = {}

    def bar(self, row, footprint):
        pass

    def event(self, e):
        pass

    def session(self, row, profile, day, partial):
        pass

    def close(self):
        pass


LIVE_BAR_KEYS = ["t_ms", "open", "high", "low", "close", "volume", "bought", "sold", "delta", "cvd_session", "poc",
                 "vwap", "vwap_sd", "vel_max", "absorb_candle", "big_max", "big_max_side", "liq_long", "liq_short",
                 "oi", "d_oi", "book_imb", "s_poc", "s_vah", "s_val", "buy_imb", "sell_imb", "stack_buy", "stack_sell"]


def _num(v):
    if v in ("", None):
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return v


class LiveSink:
    """Appends bars and events to one file per UTC day and keeps the recent ones in memory for live.json."""

    def __init__(self, out_dir, tf):
        os.makedirs(out_dir, exist_ok=True)
        self.out, self.tf = out_dir, tf
        self.day = None
        self.files = {}
        self.recent_bars = deque(maxlen=720)
        self.recent_fp = deque(maxlen=120)
        self.recent_events = deque(maxlen=2000)
        self.counts = {}
        self.on_bar = None          # set by the collector to push live
        self.on_event = None
        self._preload()

    def _paths(self, day):
        return (os.path.join(self.out, f"live_bars_{self.tf}s_{day}.csv"),
                os.path.join(self.out, f"live_events_{day}.jsonl"))

    def _preload(self):
        now = datetime.now(timezone.utc)
        days = [(now.timestamp() - 86400) * 1000, now.timestamp() * 1000]
        for ms in days:
            bars_p, ev_p = self._paths(day_key(ms))
            if os.path.exists(bars_p):
                with open(bars_p, newline="") as f:
                    for row in csv.DictReader(f):
                        self.recent_bars.append({k: _num(row.get(k)) for k in LIVE_BAR_KEYS})
            if os.path.exists(ev_p):
                with open(ev_p, encoding="utf-8") as f:
                    for line in f:
                        try:
                            self.recent_events.append(json.loads(line))
                        except ValueError:
                            pass

    def _ensure_day(self, t_ms):
        day = day_key(t_ms)
        if day == self.day:
            return
        for f in self.files.values():
            f.close()
        self.day = day
        bars_p, ev_p = self._paths(day)
        new = not os.path.exists(bars_p)
        self.files["bars"] = open(bars_p, "a", newline="")
        self.bars = csv.writer(self.files["bars"])
        if new:
            self.bars.writerow(BAR_COLUMNS)
        self.files["ev"] = open(ev_p, "a", encoding="utf-8")
        self.files["fp"] = gzip.open(os.path.join(self.out, f"live_footprint_{self.tf}s_{day}.jsonl.gz"), "at", encoding="utf-8")

    def bar(self, row, footprint):
        self._ensure_day(row["t_ms"])
        self.bars.writerow([row.get(c, "") for c in BAR_COLUMNS])
        self.files["fp"].write(json.dumps(footprint, separators=(",", ":")) + "\n")
        compact = {k: _num(row.get(k)) for k in LIVE_BAR_KEYS}
        self.recent_bars.append(compact)
        self.recent_fp.append(footprint)
        self.flush()
        if self.on_bar:
            self.on_bar(compact, footprint)

    def event(self, e):
        self._ensure_day(e["t"])
        self.files["ev"].write(json.dumps(e, separators=(",", ":")) + "\n")
        self.recent_events.append(e)
        self.counts[e["type"]] = self.counts.get(e["type"], 0) + 1
        if self.on_event:
            self.on_event(e)

    def session(self, row, profile, day, partial):
        if partial:
            return
        path = os.path.join(self.out, "live_sessions.csv")
        new = not os.path.exists(path)
        with open(path, "a", newline="") as f:
            w = csv.writer(f)
            if new:
                w.writerow(SESSION_COLUMNS)
            w.writerow([row.get(c, "") for c in SESSION_COLUMNS])
        with open(os.path.join(self.out, f"all_prices_{day}.csv"), "w", encoding="utf-8") as f:
            f.write("Price;Volume;Trades;Bid;Asks;Delta\n")
            for p, (buy, sell, n) in sorted(profile.lv.items(), key=lambda kv: -(kv[1][0] + kv[1][1])):
                f.write(f"{p:.1f};{buy + sell:.3f};{n};{sell:.3f};{buy:.3f};{buy - sell:.3f}\n")

    def flush(self):
        for f in self.files.values():
            f.flush()

    def close(self):
        for f in self.files.values():
            f.close()
        self.files = {}

    def build_live(self, engine, extra):
        """Everything the dashboard needs. Call it from the thread that feeds the engine."""
        return {"generated": int(datetime.now(timezone.utc).timestamp() * 1000), "tf": self.tf,
                "status": engine.status(), "bars": list(self.recent_bars), "events": self._pick_events(),
                "footprints": list(self.recent_fp)[-60:], "collector": extra}

    def _pick_events(self):
        """Book wall changes and clusters can be frequent; keep them from pushing out the important events."""
        noisy = {"wall_added", "wall_filled", "wall_pulled", "cluster"}
        main = [e for e in self.recent_events if e["type"] not in noisy][-100:]
        rest = [e for e in self.recent_events if e["type"] in noisy][-50:]
        return sorted(main + rest, key=lambda e: e["t"])

    def write_json(self, snap):
        path = os.path.join(self.out, "live.json")
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(snap, f, separators=(",", ":"))
        os.replace(tmp, path)


def warm_up(engine, data_dir):
    """Replay today's recorded trades so session VWAP, POC, CVD and velocity are right after a restart."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    n = 0
    for path in sorted(glob.glob(os.path.join(data_dir, f"tape_*_{today}T*.csv"))):
        for t, _, _, d in iter_trades_file(path):
            engine.on_trade(t, *d)
            n += 1
    return n


class Engine:
    def __init__(self, cfg, sink):
        self.c = cfg
        self.sink = sink
        self.tf_ms = cfg.tf * 1000
        self.bar = None
        self.session = None
        self.week = None
        self.wvwap = VWAP()
        self.prev = []                      # finished session summaries
        self.naked = {}                     # POC price -> day it came from
        self.recent = deque(maxlen=20)      # (volume, range) of recent bars
        self.secs = deque()                 # (second, notional, signed notional)
        self.sec_total = 0.0
        self.cur_sec = None
        self.vel_since = None
        self.last_vel = -10 ** 12
        self.last_price = NAN
        self.order = None                   # trades with the same time and side = one market order
        self.book = None
        self.walls = {}
        self.mark = None
        self.oi = NAN
        self.oi_bar_open = NAN
        self.pending_liq = []
        self.vel_last = NAN
        self.last_vel_ratio = 0.0
        self.last_shock = -10 ** 12
        self.last_shock_move = 0.0
        self.liq_recent = deque()
        self.state_path = None

    # ------------------------------------------------------------------ time
    def advance(self, t):
        s = t // 1000
        if self.cur_sec is None:
            self.cur_sec = s
        elif s > self.cur_sec:
            if s - self.cur_sec > 60:       # data gap: velocity needs a fresh 5 minutes
                self.secs.clear()
                self.sec_total = 0.0
                self.vel_since = None
            else:
                for sec in range(self.cur_sec, s):
                    self._finish_second(sec)
            self.cur_sec = s
        if self.bar is not None and t >= self.bar["start"] + self.tf_ms:
            if self.order is not None and self.order["T"] < self.bar["start"] + self.tf_ms:
                self._emit_order()
            self._close_bar()
            self.bar = None
        if self.session is not None and day_key(t) != self.session["day"] and self.bar is None:
            self._close_session(partial=False)

    def _price_shock(self, sec):
        """Price move inside the last 5 s against the last trade price 5 s ago (like RALPH's WICK), from trade prices."""
        ref, lo, hi, notional = None, None, None, 0.0
        for k in range(len(self.secs) - 1, -1, -1):
            x = self.secs[k]
            if x[0] > sec:
                continue
            if x[0] <= sec - 5:
                ref = x[5]
                break
            lo = x[3] if lo is None else min(lo, x[3])
            hi = x[4] if hi is None else max(hi, x[4])
            notional += x[1]
        if ref is None or lo is None:
            return
        down, up = (lo - ref) / ref * 100, (hi - ref) / ref * 100
        move, to = (down, lo) if abs(down) >= abs(up) else (up, hi)
        if abs(move) < self.c.wick:
            return
        if sec - self.last_shock < 30 and abs(move) < 1.5 * self.last_shock_move:
            return
        self.last_shock, self.last_shock_move = sec, abs(move)
        self.sink.event({"type": "price_shock", "t": sec * 1000, "time": iso(sec * 1000), "side": "down" if move < 0 else "up",
                         "move_pct": round(move, 3), "from": ref, "to": to, "window_s": 5, "notional_5s": round(notional)})

    def _finish_second(self, sec):
        while self.secs and self.secs[0][0] <= sec - 300:
            self.sec_total -= self.secs.popleft()[1]
        self._price_shock(sec)
        if self.vel_since is None:
            self.vel_since = sec
        if sec - self.vel_since < 300:
            return
        recent = signed = 0.0
        for k in range(len(self.secs) - 1, -1, -1):
            if self.secs[k][0] <= sec - 5:
                break
            if self.secs[k][0] <= sec:
                recent += self.secs[k][1]
                signed += self.secs[k][2]
        base = self.sec_total - recent
        if base <= 0:
            return
        ratio = recent / (base / 59)
        self.vel_last = ratio
        if self.bar is not None:
            self.bar["vel_max"] = max(self.bar["vel_max"], ratio)
        if ratio >= self.c.vel and (sec - self.last_vel >= 60 or ratio >= 2 * self.last_vel_ratio):
            self.last_vel, self.last_vel_ratio = sec, ratio
            self.sink.event({"type": "velocity", "t": sec * 1000, "time": iso(sec * 1000), "ratio": round(ratio, 1),
                             "side": "buy" if signed >= 0 else "sell", "price": r(self.last_price)})

    # ------------------------------------------------------------------ inputs
    def on_trade(self, T, p, q, sell):
        if self.bar is not None and T < self.bar["start"]:
            T = self.bar["start"]                 # late trade: count it in the open bar
        self.advance(T)
        if self.order is not None and (self.order["T"] != T or self.order["sell"] != sell):
            self._emit_order()
        if self.order is None:
            self.order = {"T": T, "sell": sell, "qty": 0.0, "notional": 0.0, "lo": p, "hi": p, "levels": set()}
        o = self.order
        o["qty"] += q
        o["notional"] += p * q
        o["lo"], o["hi"] = min(o["lo"], p), max(o["hi"], p)
        o["levels"].add(p)

        if self.session is None:
            self._open_session(T, p)
        if self.bar is None:
            self._open_bar(T, p)
        b, s = self.bar, self.session
        b["high"], b["low"], b["close"] = max(b["high"], p), min(b["low"], p), p
        b["volume"] += q
        b["trades"] += 1
        if sell:
            b["sold"] += q
        else:
            b["bought"] += q
        d = b["bought"] - b["sold"]
        b["max_delta"], b["min_delta"] = max(b["max_delta"], d), min(b["min_delta"], d)
        cell = b["fp"].setdefault(fbin(p, self.c.level), [0.0, 0.0, 0])
        cell[0 if sell else 1] += q
        cell[2] += 1

        s["profile"].add(p, q, sell)
        s["vwap"].add(p, q)
        s["high"], s["low"], s["close"] = max(s["high"], p), min(s["low"], p), p
        s["volume"] += q
        s["trades"] += 1
        s["cvd"] += -q if sell else q
        s["sold" if sell else "bought"] += q
        wk = week_key(T)
        if wk != self.week:
            self.week, self.wvwap = wk, VWAP()
        self.wvwap.add(p, q)

        sec = T // 1000
        n = p * q
        if self.secs and self.secs[-1][0] == sec:
            x = self.secs[-1]
            self.secs[-1] = (sec, x[1] + n, x[2] + (-n if sell else n), min(x[3], p), max(x[4], p), p)
        else:
            self.secs.append((sec, n, -n if sell else n, p, p, p))
        self.sec_total += n
        self.last_price = p

    def on_book(self, t, d):
        if not d.get("b") or not d.get("a"):
            return
        prev = self.book
        self.book = d
        walls = {}
        for side, levels in (("bid", d["b"]), ("ask", d["a"])):
            for p, q in levels:
                if q >= self.c.wall:
                    walls[(side, p)] = q
        bid_lo, ask_hi = d["b"][-1][0], d["a"][-1][0]           # edges of the saved part of the book
        best_bid, best_ask = d["b"][0][0], d["a"][0][0]
        if prev and prev.get("b") and prev.get("a"):
            pbid_lo, pask_hi = prev["b"][-1][0], prev["a"][-1][0]
            for (side, p), q in walls.items():
                seen_before = p >= pbid_lo if side == "bid" else p <= pask_hi
                if (side, p) not in self.walls and seen_before:       # not just scrolling into view
                    self.sink.event({"type": "wall_added", "t": t, "time": iso(t), "side": side, "price": p, "qty": round(q, 3)})
        for (side, p), q in self.walls.items():
            if (side, p) in walls:
                continue
            still_in_view = p >= bid_lo if side == "bid" else p <= ask_hi
            if not still_in_view:
                continue                                        # price moved away, the wall is just out of view
            traded = best_bid < p if side == "bid" else best_ask > p
            self.sink.event({"type": "wall_filled" if traded else "wall_pulled", "t": t, "time": iso(t),
                             "side": side, "price": p, "qty": round(q, 3)})
        self.walls = walls

    def on_liq(self, T, side, qty, price, avg):
        kind = "long" if side == "SELL" else "short"     # a forced SELL closes a long
        self.liq_recent.append((T, kind, qty))
        b = self.bar
        if b is not None and b["start"] <= T < b["start"] + self.tf_ms:
            b["liq_" + kind] += qty
            b["liq_count"] += 1
        else:
            self.pending_liq.append((T, kind, qty))
        self.sink.event({"type": "liquidation", "t": T, "time": iso(T), "liquidated": kind, "qty": round(qty, 3),
                         "price": r(avg or price)})

    def on_mark(self, t, d):
        self.mark = d

    def on_oi(self, t, oi):
        self.oi = oi

    # ------------------------------------------------------------------ bars
    def _open_bar(self, T, p):
        start = T // self.tf_ms * self.tf_ms
        self.bar = {"start": start, "open": p, "high": p, "low": p, "close": p, "volume": 0.0, "bought": 0.0,
                    "sold": 0.0, "trades": 0, "max_delta": 0.0, "min_delta": 0.0, "fp": {}, "vel_max": 0.0,
                    "big_count": 0, "big_bought": 0.0, "big_sold": 0.0, "big_max": 0.0, "big_max_side": "",
                    "liq_long": 0.0, "liq_short": 0.0, "liq_count": 0}
        self.oi_bar_open = self.oi
        keep = []
        for lt, kind, qty in self.pending_liq:
            if start <= lt < start + self.tf_ms:
                self.bar["liq_" + kind] += qty
                self.bar["liq_count"] += 1
            elif lt >= start + self.tf_ms:
                keep.append((lt, kind, qty))
        self.pending_liq = keep

    def _emit_order(self):
        o, self.order = self.order, None
        if o["qty"] < self.c.big:
            return
        side = "sell" if o["sell"] else "buy"
        self.sink.event({"type": "big_trade", "t": o["T"], "time": iso(o["T"]), "side": side, "qty": round(o["qty"], 3),
                         "avg_price": round(o["notional"] / o["qty"], 2), "from": o["lo"], "to": o["hi"],
                         "levels": len(o["levels"])})
        b = self.bar
        if b is not None and b["start"] <= o["T"] < b["start"] + self.tf_ms:
            b["big_count"] += 1
            b["big_sold" if o["sell"] else "big_bought"] += o["qty"]
            if o["qty"] > b["big_max"]:
                b["big_max"], b["big_max_side"] = o["qty"], side

    def _close_bar(self):
        b, s, c = self.bar, self.session, self.c
        fp, step = b["fp"], c.level
        t_ms = b["start"]
        rng = b["high"] - b["low"]
        poc_bin, poc_cell = max(fp.items(), key=lambda kv: kv[1][0] + kv[1][1])
        poc_vol = poc_cell[0] + poc_cell[1]

        buy_imb, sell_imb = set(), set()
        for x, (bid, ask, _) in fp.items():
            below = fp.get(round(x - step, 8))
            above = fp.get(round(x + step, 8))
            if ask >= c.imb_min and ask >= c.imb_ratio * max(below[0] if below else 0.0, 1e-9):
                buy_imb.add(x)
            if bid >= c.imb_min and bid >= c.imb_ratio * max(above[1] if above else 0.0, 1e-9):
                sell_imb.add(x)

        def stacks(levels, side):
            best, run = 0, []
            for x in sorted(levels):
                run = run + [x] if run and abs(x - run[-1] - step) < 1e-6 else [x]
                best = max(best, len(run))
                if len(run) == 3:
                    self.sink.event({"type": "stacked_imbalance", "t": t_ms, "time": iso(t_ms), "side": side,
                                     "from": run[0], "to": run[-1] + step})
            return best

        stack_buy, stack_sell = stacks(buy_imb, "buy"), stacks(sell_imb, "sell")
        hits = 0
        for x, (bid, ask, n) in fp.items():
            if bid + ask >= c.cluster:
                hits += 1
                self.sink.event({"type": "cluster", "t": t_ms, "time": iso(t_ms), "price": x, "volume": round(bid + ask, 3),
                                 "sold": round(bid, 3), "bought": round(ask, 3), "delta": round(ask - bid, 3), "trades": n})

        # absorption: heavy one-sided aggression that did not move price its way
        delta = b["bought"] - b["sold"]
        absorb = ""
        if len(self.recent) >= 5:
            med_vol = statistics.median(v for v, _ in self.recent)
            med_rng = statistics.median(g for _, g in self.recent)
            progress = (b["close"] - b["open"]) * (1 if delta > 0 else -1)
            if (med_vol > 0 and b["volume"] >= 2 * med_vol and abs(delta) >= 0.2 * b["volume"]
                    and progress <= 0.25 * med_rng):
                absorb = "bull" if delta < 0 else "bear"
                self.sink.event({"type": "absorption", "t": t_ms, "time": iso(t_ms), "kind": absorb,
                                 "price": poc_bin, "volume": round(b["volume"], 3), "delta": round(delta, 3)})
        top, bot = fp.get(fbin(b["high"], step)), fp.get(fbin(b["low"], step))
        med_cell = statistics.median(v[0] + v[1] for v in fp.values())
        absorb_high = bool(top and rng > 0 and top[1] >= max(c.imb_min, 3 * med_cell) and b["close"] <= b["high"] - 0.25 * rng)
        absorb_low = bool(bot and rng > 0 and bot[0] >= max(c.imb_min, 3 * med_cell) and b["close"] >= b["low"] + 0.25 * rng)
        exhaust_high = bool(top and rng > 0 and len(fp) >= 3 and (top[0] + top[1]) <= 0.1 * poc_vol)
        exhaust_low = bool(bot and rng > 0 and len(fp) >= 3 and (bot[0] + bot[1]) <= 0.1 * poc_vol)

        vw, sd = s["vwap"].value()
        wv, wsd = self.wvwap.value()
        vah, val = s["profile"].value_area(c.va)
        pd = self.prev[-1] if self.prev else {}

        for lvl in list(self.naked):
            if b["low"] <= lvl <= b["high"]:
                self.sink.event({"type": "naked_poc_touched", "t": t_ms, "time": iso(t_ms), "price": lvl, "from_day": self.naked[lvl]})
                del self.naked[lvl]
        above = min((x for x in self.naked if x > b["close"]), default=NAN)
        below = max((x for x in self.naked if x < b["close"]), default=NAN)

        row = {
            "time": iso(t_ms), "t_ms": t_ms, "open": b["open"], "high": b["high"], "low": b["low"], "close": b["close"],
            "volume": r(b["volume"], 3), "bought": r(b["bought"], 3), "sold": r(b["sold"], 3), "delta": r(delta, 3),
            "delta_pct": r(delta / b["volume"] * 100 if b["volume"] else NAN, 1), "trades": b["trades"],
            "max_delta": r(b["max_delta"], 3), "min_delta": r(b["min_delta"], 3), "cvd_session": r(s["cvd"], 3),
            "poc": poc_bin, "poc_vol": r(poc_vol, 3),
            "vwap": r(vw, 1), "vwap_sd": r(sd, 2), "vwap_dist_sd": r((b["close"] - vw) / sd if sd > 0 else NAN, 2),
            "wvwap": r(wv, 1), "wvwap_sd": r(wsd, 2), "wvwap_dist_sd": r((b["close"] - wv) / wsd if wsd > 0 else NAN, 2),
            "buy_imb": len(buy_imb), "sell_imb": len(sell_imb), "stack_buy": stack_buy, "stack_sell": stack_sell,
            "cluster_hits": hits, "big_count": b["big_count"], "big_bought": r(b["big_bought"], 3),
            "big_sold": r(b["big_sold"], 3), "big_max": r(b["big_max"], 3), "big_max_side": b["big_max_side"],
            "vel_max": r(b["vel_max"], 1), "absorb_candle": absorb, "absorb_high": int(absorb_high),
            "absorb_low": int(absorb_low), "exhaust_high": int(exhaust_high), "exhaust_low": int(exhaust_low),
            "liq_long": r(b["liq_long"], 3), "liq_short": r(b["liq_short"], 3), "liq_count": b["liq_count"],
            "oi": r(self.oi, 3), "d_oi": r(self.oi - self.oi_bar_open, 3),
            "s_poc": r(s["profile"].poc_px, 1), "s_vah": r(vah, 1), "s_val": r(val, 1),
            "s_high": s["high"], "s_low": s["low"],
            "pd_high": pd.get("high", ""), "pd_low": pd.get("low", ""), "pd_poc": pd.get("poc", ""),
            "pd_vah": pd.get("vah", ""), "pd_val": pd.get("val", ""), "pd_vwap": pd.get("vwap", ""),
            "naked_poc_above": r(above, 1), "naked_poc_below": r(below, 1),
        }
        if self.mark:
            m = self.mark
            row.update({"mark": r(float(m["p"]), 1), "index": r(float(m["i"]), 1),
                        "premium": r(float(m["p"]) - float(m["i"]), 2), "funding": m.get("r", "")})
        bk = self.book
        if bk and bk.get("b") and bk.get("a"):
            bb, ba = bk["b"][0][0], bk["a"][0][0]
            bd, ad = sum(q for _, q in bk["b"]), sum(q for _, q in bk["a"])
            bw, aw = max(bk["b"], key=lambda x: x[1]), max(bk["a"], key=lambda x: x[1])
            row.update({"best_bid": bb, "best_ask": ba, "spread": r(ba - bb, 1), "bid_depth": r(bd, 3), "ask_depth": r(ad, 3),
                        "book_imb": r((bd - ad) / (bd + ad) if bd + ad else NAN, 3), "bid_wall_px": bw[0],
                        "bid_wall_qty": r(bw[1], 3), "ask_wall_px": aw[0], "ask_wall_qty": r(aw[1], 3)})
        footprint = {"t": t_ms, "step": step,
                     "lv": [[x, round(v[0], 3), round(v[1], 3), v[2]] for x, v in sorted(fp.items(), reverse=True)]}
        self.sink.bar(row, footprint)
        self.recent.append((b["volume"], rng))

    # ------------------------------------------------------------------ sessions
    def _open_session(self, T, p):
        self.session = {"day": day_key(T), "profile": Profile(self.c.profile_bin), "vwap": VWAP(), "open": p,
                        "high": p, "low": p, "close": p, "volume": 0.0, "bought": 0.0, "sold": 0.0, "trades": 0, "cvd": 0.0}

    def _close_session(self, partial):
        s = self.session
        if s is None:
            return
        vw, _ = s["vwap"].value()
        vah, val = s["profile"].value_area(self.c.va)
        row = {"day": s["day"], "open": s["open"], "high": s["high"], "low": s["low"], "close": s["close"],
               "volume": r(s["volume"], 3), "bought": r(s["bought"], 3), "sold": r(s["sold"], 3),
               "delta": r(s["bought"] - s["sold"], 3), "trades": s["trades"], "vwap": r(vw, 1),
               "poc": s["profile"].poc_px, "vah": r(vah, 1), "val": r(val, 1), "partial": int(partial)}
        self.sink.session(row, s["profile"], s["day"], partial)
        if not partial:
            self.prev.append({"high": s["high"], "low": s["low"], "poc": s["profile"].poc_px, "vah": r(vah, 1),
                              "val": r(val, 1), "vwap": r(vw, 1)})
            self.prev = self.prev[-30:]
            self.naked[s["profile"].poc_px] = s["day"]
            if self.state_path:
                self.save_state(self.state_path)
        self.session = None

    # ------------------------------------------------------------------ live helpers
    def save_state(self, path):
        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump({"prev": self.prev, "naked": [[k, v] for k, v in self.naked.items()]}, f)
        os.replace(tmp, path)

    def load_state(self, path):
        try:
            with open(path, encoding="utf-8") as f:
                d = json.load(f)
            self.prev = d.get("prev", [])
            self.naked = {float(k): v for k, v in d.get("naked", [])}
        except (OSError, ValueError):
            pass

    def status(self):
        """Everything known right now, for the live dashboard and later for RALPH."""
        st = {"last_price": r(self.last_price), "velocity": r(self.vel_last, 1)}
        b, s = self.bar, self.session
        if b is not None:
            st["bar"] = {"t": b["start"], "open": b["open"], "high": b["high"], "low": b["low"], "close": b["close"],
                         "volume": r(b["volume"], 3), "bought": r(b["bought"], 3), "sold": r(b["sold"], 3),
                         "delta": r(b["bought"] - b["sold"], 3), "vel_max": r(b["vel_max"], 1)}
            st["bar_fp"] = {"t": b["start"], "step": self.c.level,
                            "lv": [[x, round(v[0], 3), round(v[1], 3), v[2]] for x, v in sorted(b["fp"].items(), reverse=True)]}
        if s is not None:
            vw, sd = s["vwap"].value()
            vah, val = s["profile"].value_area(self.c.va)
            st["session"] = {"day": s["day"], "open": s["open"], "high": s["high"], "low": s["low"],
                             "volume": r(s["volume"], 3), "cvd": r(s["cvd"], 3), "vwap": r(vw, 1), "sd": r(sd, 2),
                             "poc": r(s["profile"].poc_px, 1), "vah": r(vah, 1), "val": r(val, 1)}
        st["prev_day"] = self.prev[-1] if self.prev else None
        st["naked"] = sorted(self.naked)
        if self.mark:
            st["mark"] = {"mark": r(float(self.mark["p"]), 1), "index": r(float(self.mark["i"]), 1),
                          "funding": self.mark.get("r"), "next_funding": self.mark.get("T")}
        st["oi"] = r(self.oi, 3)
        now = (self.cur_sec or 0) * 1000
        while self.liq_recent and self.liq_recent[0][0] < now - 300_000:
            self.liq_recent.popleft()
        st["liq_5m"] = {"long": r(sum(q for _, k, q in self.liq_recent if k == "long"), 3),
                        "short": r(sum(q for _, k, q in self.liq_recent if k == "short"), 3),
                        "count": len(self.liq_recent)}
        bk = self.book
        if bk and bk.get("b") and bk.get("a"):
            bd, ad = sum(q for _, q in bk["b"]), sum(q for _, q in bk["a"])
            st["book"] = {"best_bid": bk["b"][0][0], "best_ask": bk["a"][0][0], "bid_depth": r(bd, 3), "ask_depth": r(ad, 3),
                          "imbalance": r((bd - ad) / (bd + ad) if bd + ad else NAN, 3),
                          "bid_walls": sorted(bk["b"], key=lambda x: -x[1])[:3], "ask_walls": sorted(bk["a"], key=lambda x: -x[1])[:3]}
        return st

    def finish(self):
        if self.order is not None:
            self._emit_order()
        self._close_session(partial=True)     # the last bar is still open, so it is not written


# ---------------------------------------------------------------------- reading the recorded files
def read_gz_lines(path):
    try:
        with gzip.open(path, "rt", encoding="utf-8") as f:
            for line in f:
                yield line
    except (EOFError, OSError, zlib.error):
        return                                 # the file that is still being written ends mid-block


def iter_trades(data_dir):
    for path in sorted(glob.glob(os.path.join(data_dir, "tape_*.csv"))):
        yield from iter_trades_file(path)


def iter_trades_file(path):
    """One hourly tape file, sorted by trade time and ID, without duplicates."""
    rows = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            p = line.rstrip("\n").split(";")
            if len(p) < 9 or p[0].startswith("Time"):
                continue
            try:
                sold, bought, a, T = float(p[2] or 0), float(p[4] or 0), int(p[7]), int(p[8])
            except ValueError:
                continue
            if sold > 0:
                rows[a] = (T, float(p[1]), sold, True)
            elif bought > 0:
                rows[a] = (T, float(p[5]), bought, False)
    for a in sorted(rows, key=lambda k: (rows[k][0], k)):
        T, price, q, sell = rows[a]
        yield (T, 1, "trade", (price, q, sell))


def iter_book(data_dir):
    for path in sorted(glob.glob(os.path.join(data_dir, "book_*.jsonl.gz"))):
        for line in read_gz_lines(path):
            try:
                d = json.loads(line)
            except ValueError:
                continue
            yield (d["t"], 0, "book", d)


def iter_misc(data_dir):
    for path in sorted(glob.glob(os.path.join(data_dir, "raw_*.jsonl.gz"))):
        for line in read_gz_lines(path):
            if "@forceOrder" not in line and "@markPrice" not in line and "@openInterest" not in line:
                continue
            try:
                m = json.loads(line)
            except ValueError:
                continue
            st, d = m.get("stream", ""), m.get("data", {})
            if st.endswith("@forceOrder") and "o" in d:
                o = d["o"]
                yield (int(o.get("T", d.get("E", m["recv_ms"]))), 2, "liq", o)
            elif "@markPrice" in st:
                yield (int(d.get("E", m["recv_ms"])), 2, "mark", d)
            elif st.endswith("@openInterest"):
                yield (int(d.get("time") or m["recv_ms"]), 2, "oi", d)


def parse_utc(s):
    return int(datetime.strptime(s, "%Y-%m-%dT%H:%M").replace(tzinfo=timezone.utc).timestamp() * 1000)


def main():
    ap = argparse.ArgumentParser(description="ATAS X style orderflow data from recorded Binance files")
    ap.add_argument("--data", default=os.path.expanduser("~/data/binance"))
    ap.add_argument("--out", default=os.path.expanduser("~/data/features"))
    ap.add_argument("--tf", type=int, default=60, help="bar length in seconds")
    ap.add_argument("--level", type=float, default=5.0, help="footprint price step in USD")
    ap.add_argument("--profile-bin", type=float, default=1.0, help="price step for the value area")
    ap.add_argument("--va", type=float, default=0.7)
    ap.add_argument("--big", type=float, default=10.0, help="big trade: whole market order of at least this many BTC")
    ap.add_argument("--imb-ratio", type=float, default=3.0)
    ap.add_argument("--imb-min", type=float, default=2.0)
    ap.add_argument("--cluster", type=float, default=25.0, help="cluster hit: footprint cell with at least this many BTC")
    ap.add_argument("--vel", type=float, default=5.0)
    ap.add_argument("--wick", type=float, default=0.25, help="price shock: move of at least this many %% within 5 s")
    ap.add_argument("--wall", type=float, default=25.0, help="order book wall: one price level with at least this many BTC")
    ap.add_argument("--from", dest="t_from")
    ap.add_argument("--to", dest="t_to")
    ap.add_argument("--no-raw", action="store_true", help="skip liquidations, funding and open interest")
    c = ap.parse_args()

    t0 = parse_utc(c.t_from) if c.t_from else None
    t1 = parse_utc(c.t_to) if c.t_to else None
    sources = [iter_book(c.data), iter_trades(c.data)] + ([] if c.no_raw else [iter_misc(c.data)])
    sink = Sink(c.out, c.tf)
    eng = Engine(c, sink)
    n = 0
    first = last = None
    for t, _, kind, d in heapq.merge(*sources, key=lambda x: (x[0], x[1])):
        if (t0 and t < t0) or (t1 and t >= t1):
            continue
        first = first or t
        last = t
        n += 1
        if kind == "trade":
            eng.on_trade(t, *d)
        elif kind == "book":
            eng.on_book(t, d)
        elif kind == "liq":
            try:
                eng.on_liq(t, d.get("S", ""), float(d.get("z") or d.get("q") or 0), float(d.get("p") or 0), float(d.get("ap") or 0))
            except ValueError:
                pass
        elif kind == "mark":
            eng.on_mark(t, d)
        elif kind == "oi":
            try:
                eng.on_oi(t, float(d["openInterest"]))
            except (KeyError, ValueError):
                pass
        if n % 500_000 == 0:
            print(f"  zpracovano {n:,} zprav, jsem u {iso(t)}".replace(",", " "), flush=True)
    eng.finish()
    sink.close()
    if not n:
        sys.exit(f"V {c.data} jsem nenasel zadna data.")
    print(f"Hotovo: {n:,} zprav od {iso(first)} do {iso(last)}".replace(",", " "))
    for k, v in sorted(sink.counts.items()):
        print(f"  {k}: {v}")
    print(f"Vystupy jsou v {c.out}")


if __name__ == "__main__":
    main()
