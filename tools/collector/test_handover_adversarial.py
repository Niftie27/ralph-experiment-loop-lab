#!/usr/bin/env python3
"""Adversarial tests of the make-before-break reconnect handover (PR #9) in binance_live.py.

Run:  python3 -m unittest discover -s tools/collector -p "test_handover_adversarial.py" -v   (websockets==17.2)

Uses the fake Binance from test_reconnect_handover.py (one shared event generator, local websockets server, REST
mocked). Nothing leaves the machine. Each test states the attack it makes; a failing test is a finding and is left
failing on purpose (see docs/reviews/pr9-adversarial-2026-11-04.md).
"""
import asyncio
import collections
import gc
import gzip
import json
import math
import os
import signal
import sys
import threading
import time
import types
import unittest
import weakref
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import test_reconnect_handover as base         # noqa: E402  (also un-stubs websockets if needed)
import binance_live as bl                       # noqa: E402

websockets = base.websockets
SYM, A0, STREAMS, SUFFIXES = base.SYM, base.A0, base.STREAMS, base.SUFFIXES
ALL = SUFFIXES["market"] + SUFFIXES["public"]
ws_keys, read_raw = base.ws_keys, base.read_raw
DAY_S = 24 * 3600                               # Binance closes every connection after 24 h


# ---------------------------------------------------------------------------------------------- fake server

class AdvFake(base.FakeBinance):
    """FakeBinance whose depth updates have unique price levels, varying quantities and deletions, so the local
    book after a run is a real check (every lost, doubled or reordered update changes it)."""

    @staticmethod
    def _level(side, i):
        return f"{(70000.0 if side == 'b' else 90000.0) + (i % 4000) * 0.1:.1f}"

    def tick(self):
        super().tick()
        for upd in self.ticks[-1]["depth"]:
            i = upd["id"]
            for side in ("b", "a"):
                lv = [[self._level(side, i), f"{1 + (i * 7919) % 997}.000"]]
                if i % 3 == 0:
                    lv.append([self._level(side, i - 2), "0.000"])        # delete an earlier level
                upd[side] = lv

    def updates(self, after_u, upto_u):
        """Server truth: every depth update with after_u < id <= upto_u, in id order."""
        return [upd for t in self.ticks for upd in t["depth"] if after_u < upd["id"] <= upto_u]


def drop_on_new(pred, also=None):
    """on_open callback: NEW (the feed being opened) never sends a message for which pred(suffix, tick_k, start)
    is true; `also(old, new)` runs too."""
    def on_open(old, new):
        orig, start = new.messages, new.pos
        new.messages = lambda tick: [m for m in orig(tick) if not pred(m[1], tick["k"], start)]
        if also:
            also(old, new)
    return on_open


def lag_old(seconds):
    return lambda old, new: setattr(old, "delay", seconds)


_real_time = time.time


class ShiftedTime:
    """Stands in for the `time` module: wall clock shifted by `offset` s, monotonic and sleep unchanged."""

    monotonic = staticmethod(time.monotonic)
    sleep = staticmethod(time.sleep)
    perf_counter = staticmethod(time.perf_counter)

    def __init__(self, offset=0.0):
        self.offset = offset

    def time(self):
        return _real_time() + self.offset


class SpyHandover(bl.Handover):
    """bl.Handover that the tests can count while alive (weak references only)."""
    alive = weakref.WeakSet()

    def __init__(self):
        super().__init__()
        SpyHandover.alive.add(self)


def fd_count():
    return len(os.listdir("/proc/self/fd"))


def raw_in_order(out):
    """(file name, line) for every raw line, files in hour order, lines in write order."""
    rows = []
    for name in sorted(os.listdir(out)):
        if name.startswith("raw_"):
            with gzip.open(os.path.join(out, name), "rt", encoding="utf-8") as f:
                rows += [(name, json.loads(line)) for line in f]
    return rows


def once_problems(server, raw, suffixes, ordered=True):
    """Per stream: keys the server sent in the recorded range but not recorded, keys recorded twice, and (if ordered)
    whether the write order differs from the server order. {} when every event is there exactly once."""
    out = {}
    for s in suffixes:
        got, exp = ws_keys(raw, s), server.keys(s)
        if not exp:
            continue
        if not got:
            out[s] = "nothing recorded"
            continue
        idx = {k: i for i, k in enumerate(exp)}
        unknown = [k for k in got if k not in idx]
        if unknown:
            out[s] = {"not sent by the server": (len(unknown), unknown[:3])}
            continue
        lo, hi = min(idx[k] for k in got), max(idx[k] for k in got)
        want, have = exp[lo:hi + 1], set(got)
        missing = [k for k in want if k not in have]
        dups = [k for k, c in collections.Counter(got).items() if c > 1]
        p = {}
        if missing:
            p["missing"] = (len(missing), missing[:3])
        if dups:
            p["duplicates"] = (len(dups), dups[:3])
        if ordered and not missing and not dups and got != want:
            p["out_of_order"] = True
        if p:
            out[s] = p
    return out


def depth_breaks(lines):
    """Written ws depth diffs whose pu is not the previous written u (write order)."""
    breaks, prev = [], None
    for x in lines:
        if x["src"] == "ws" and x["stream"] == f"{SYM}@depth@100ms":
            d = x["data"]
            if prev is not None and d["pu"] != prev:
                breaks.append((prev, d["pu"], d["u"]))
            prev = d["u"]
    return breaks


def apply_updates(bids, asks, updates):
    bids, asks = dict(bids), dict(asks)
    for upd in updates:
        for side, levels in ((bids, upd["b"]), (asks, upd["a"])):
            for p, q in levels:
                p, q = float(p), float(q)
                if q == 0:
                    side.pop(p, None)
                else:
                    side[p] = q
    return bids, asks


# ---------------------------------------------------------------------------------------------- base class

class AdvBase(base.HandoverTest):
    """The setup and checks of test_reconnect_handover.HandoverTest, without its scenarios (they run there)."""

    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.backfill_gate = None                     # threading.Event: a REST backfill waits for it
        self.backfill_done = []
        self.enterContext(mock.patch.object(bl, "Handover", SpyHandover))

    def _rest_agg_trades(self, symbol, first, last):
        self.backfills.append((first, last))
        if self.backfill_gate is not None:
            self.backfill_gate.wait(15)
        out = [dict(self.server.aggs[a]) for a in range(first, last + 1) if a in self.server.aggs]
        self.backfill_done.append((first, last))
        return out

    async def start(self, kinds=("market", "public"), one_handover=True, **server_kw):
        self.server = AdvFake(**server_kw)
        await self.server.start()
        self.addAsyncCleanup(self.server.close)
        self.col = bl.Collector(self.args())
        self.restarts = 0
        real_restart = self.col.book.restart

        def counted_restart():
            self.restarts += 1
            real_restart()
        self.col.book.restart = counted_restart
        self.tasks = {k: asyncio.create_task(self.col.run_endpoint(k, STREAMS[k])) for k in kinds}
        if one_handover:
            watch = asyncio.create_task(self._one_handover_each(kinds))
            self.addCleanup(watch.cancel)
        await self.until(lambda: all(self.server.feeds[k] for k in kinds), 5, "connected")
        await self.until(lambda: self.col.book.state == "synced" or "public" not in kinds, 5, "book synced")
        self.resyncs_before = self.col.book.resyncs
        self.book0 = (dict(self.col.book.bids), dict(self.col.book.asks), self.col.book.prev_u)

    def args(self, **kw):
        a = dict(symbol=SYM, out=self.out, bbo=True, book=True, oi=False, all=False, quiet=True, features=None,
                 live_port=0, ws_base=f"ws://localhost:{self.server.port}", rest_base=None, symbols_config=None)
        a.update(kw)
        return types.SimpleNamespace(**a)

    def log(self):
        return self.stdout.getvalue()

    def trigger_handover(self, t0_wall):
        """Make the deadline check fire on the next message of a connection opened after t0_wall, but not again
        soon after the switch (the next one would be ~as far away as start() is now)."""
        bl.RECONNECT_AFTER_S = max(0.0, bl.time.time() - t0_wall - 0.3)

    def once_problems(self, raw, suffixes, ordered=True):
        return once_problems(self.server, raw, suffixes, ordered)

    def assert_once(self, raw, suffixes, ordered=True, extra=None):
        p = self.once_problems(raw, suffixes, ordered)
        p.update({k: v for k, v in (extra or {}).items() if v})
        self.assertFalse(p, f"problems: {p}")

    def assert_book_matches_server(self):
        """The local book equals the book state at start() plus every server update since, in order."""
        bids0, asks0, u0 = self.book0
        bk = self.col.book
        self.assertEqual(bk.state, "synced")
        bids, asks = apply_updates(bids0, asks0, self.server.updates(u0, bk.prev_u))
        self.assertEqual((len(bk.bids), len(bk.asks)), (len(bids), len(asks)), "book size")
        self.assertEqual(bk.bids, bids, "bids differ from the server book")
        self.assertEqual(bk.asks, asks, "asks differ from the server book")

    def assert_no_resync(self, raw):
        snaps = [x for x in raw if x["src"] == "rest" and x["stream"].endswith("@depthSnapshot")]
        self.assertEqual(len(snaps), 1, "a REST depth snapshot was loaded after the initial one")
        self.assertEqual((self.col.book.resyncs, self.restarts), (self.resyncs_before, 0))

    def attempt_times(self, kind):
        return [t for t, _ in self.server.attempts[kind]]

    async def stop_and_cancel(self, wait=3.0):
        """Stop; cancel run_endpoint if it does not return (it may sit in recv() on a silent connection)."""
        self.col.stop.set()
        done, pending = await asyncio.wait(self.tasks.values(), timeout=wait)
        for t in pending:
            t.cancel()
        if pending:
            await asyncio.wait(pending, timeout=5)
        await asyncio.sleep(0.05)
        self.col.rec.close()
        return [t for t in self.tasks if self.tasks[t] in pending]


for _name in [n for n in dir(base.HandoverTest) if n.startswith("test_")]:
    setattr(AdvBase, _name, None)                     # not collected again here


# ---------------------------------------------------------------------------------------------- 1, 2: exactly once, depth chain

class ExactlyOnceTest(AdvBase):

    async def test_a01_old_lags_2_5_s_overlap_identical_events(self):
        """A1 (items 1, 2): OLD has run 2.5 s behind for a while when NEW opens (production HANDOVER_MAX_S = 3 s):
        for 2.5 s both connections deliver the same events, OLD 2.5 s later. Every aggTrade, depth, markPrice,
        forceOrder and bookTicker exactly once; written depth diffs keep pu == previous u; no REST snapshot, no
        resync, no backfill; local book == server book."""
        bl.HANDOVER_MAX_S, bl.RECONNECT_AFTER_S = 3.0, 4.5
        await self.start(liq_every=7)
        for kind in ("market", "public"):
            self.server.feeds[kind][0].delay = 2.5
        reps = {k: await self.handover_done(k, timeout=14) for k in ("market", "public")}
        raw = await self.finish()
        for kind, rep in reps.items():
            self.assertEqual(rep["reason"], "caught_up", kind)
            self.assertGreater(rep["t_switch"] - rep["t_first"], 2.3, f"{kind}: the overlap lasted ~2.5 s")
            self.assertGreater(rep["buffered"], 200, kind)
        self.assert_exactly_once(raw, ALL)
        self.assertEqual(depth_breaks(raw), [])
        self.assert_no_resync(raw)
        self.assertEqual(self.backfills, [])
        self.assert_book_matches_server()

    async def test_a02_new_lags_3_s_inside_filter(self):
        """A2 (items 1, 2): NEW runs steadily 3 s behind OLD (HANDOVER_FILTER_S 5 s >= the lag): for 3 s after the
        switch NEW delivers exactly what OLD already delivered. All dropped, nothing lost or doubled, depth chain
        continues, no resync, local book == server book."""
        bl.HANDOVER_FILTER_S, bl.RECONNECT_AFTER_S = 5.0, 4.5      # >= 300 ticks of history before NEW
        await self.start(liq_every=7)
        for kind in ("market", "public"):
            self.server.plans[kind].append({"behind": 300, "delay": 3.0})
        reps = {k: await self.handover_done(k, timeout=16) for k in ("market", "public")}
        raw = await self.finish()
        self.assertGreaterEqual(reps["market"]["dropped"]["aggTrade"], 280)
        self.assertGreaterEqual(reps["public"]["dropped"]["depth@100ms"], 280)
        self.assertGreaterEqual(reps["market"]["dropped"]["forceOrder"], 60)
        self.assert_exactly_once(raw, ALL)
        self.assertEqual(depth_breaks(raw), [])
        self.assert_no_resync(raw)
        self.assertEqual(self.backfills, [])
        self.assert_book_matches_server()

    async def test_a03_new_streams_start_at_different_moments(self):
        """A3 (items 1, 3): OLD lags 0.3 s; NEW's markPrice (market) and bookTicker (public) start 0.5 s after its
        other streams. The switch condition only looks at streams NEW has already sent, so it switches before
        OLD delivered the markPrice / bookTicker events that NEW will never send. Expect zero loss."""
        late = {"markPrice@1s", "bookTicker"}
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append(
                {"on_open": drop_on_new(lambda s, k, start: s in late and k < start + 50, also=lag_old(0.3))})
        reps = {k: await self.handover_done(k) for k in ("market", "public")}
        raw = await self.finish()
        self.assertEqual({r["reason"] for r in reps.values()}, {"caught_up"})
        self.assert_once(raw, ALL)

    async def test_a05_old_alive_but_lags_more_than_max(self):
        """A5 (items 1, 2): OLD keeps delivering but runs 2.6 s behind while HANDOVER_MAX_S is 2.0 s (production:
        OLD more than 3 s behind, e.g. a backlog in the collector itself). The forced 'max_time' switch closes OLD
        with events it has but has not processed and NEW never had: markPrice, forceOrder, bookTicker lost, the book
        resyncs, aggTrade is backfilled. Expect zero loss and no resync (OLD was still alive and advancing)."""
        bl.RECONNECT_AFTER_S = 4.5
        await self.start(liq_every=7)
        for kind in ("market", "public"):
            self.server.feeds[kind][0].delay = 2.6
        reps = {k: await self.handover_done(k, timeout=14) for k in ("market", "public")}
        await self.until(lambda: self.col.book.state == "synced" and len(self.backfill_done) == len(self.backfills),
                         5, "book synced, backfill done")
        raw = await self.finish()
        self.assertEqual({r["reason"] for r in reps.values()}, {"max_time"})
        self.assert_once(raw, ["markPrice@1s", "forceOrder", "bookTicker", "depth@100ms"],
                         extra={"book resyncs": self.col.book.resyncs - self.resyncs_before,
                                "REST backfills": self.backfills})

    async def test_a04_new_lags_old_longer_than_filter(self):
        """A4 (item 1): NEW runs steadily 1.5 s behind OLD while HANDOVER_FILTER_S is 1.0 s (production: a NEW
        more than 10 s behind). After the filter window NEW's duplicates are written again. Expect exactly once."""
        bl.HANDOVER_FILTER_S, bl.RECONNECT_AFTER_S = 1.0, 3.0      # >= 150 ticks of history before NEW
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append({"behind": 150, "delay": 1.5})
        for kind in ("market", "public"):
            await self.handover_done(kind, timeout=10)
        await asyncio.sleep(1.0)
        raw = await self.finish(settle=0, error_path=True)
        self.assert_once(raw, ALL, extra={"book resyncs": self.col.book.resyncs - self.resyncs_before})


# ---------------------------------------------------------------------------------------------- 3: failures during a handover

class FailureTest(AdvBase):

    def assert_one_retry(self, kind, t_fail_attempt=1):
        """Attempt 0 is OLD, attempt 1 the failed NEW, attempt 2 the retry; no more, spaced by HANDOVER_RETRY_S."""
        t = self.attempt_times(kind)
        self.assertEqual(len(t), 3, f"{kind}: connection attempts {len(t)}")
        self.assertGreaterEqual(t[2] - t[t_fail_attempt], bl.HANDOVER_RETRY_S, f"{kind}: retry too early")

    async def test_a10_new_open_times_out(self):
        """A10 (item 3): NEW's opening handshake never completes within HANDOVER_CONNECT_TIMEOUT_S: logged as a
        connect failure, OLD keeps the feed (exactly once, no resync), one retry after HANDOVER_RETRY_S."""
        bl.HANDOVER_CONNECT_TIMEOUT_S = 0.5
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append({"slow_open": 2.0})
        reps = {k: await self.handover_done(k, timeout=10) for k in ("market", "public")}
        raw = await self.finish()
        fails = [(f["kind"], f["stage"], f["error"].split(":")[0]) for f in self.col.handover_failures]
        self.assertEqual(sorted(fails), [("market", "connect", "TimeoutError"), ("public", "connect", "TimeoutError")])
        self.assertEqual(self.log().count("nove spojeni se neotevrelo"), 2)
        for kind in ("market", "public"):
            self.assert_one_retry(kind)
            self.assertEqual(reps[kind]["reason"], "caught_up")
        self.assert_exactly_once(raw, ALL)
        self.assert_no_resync(raw)
        self.assertEqual(self.backfills, [])

    async def test_a11_new_opens_but_sends_nothing(self):
        """A11 (item 3): NEW opens (answers pings) but never sends a message. Expect: OLD keeps the feed, the
        handover is given up and logged, and one retry follows. HANDOVER_MAX_S only counts from NEW's first
        message, so without a message the handover never ends: no failure, no log, no retry."""
        await self.start(kinds=("market",))
        self.server.plans["market"].append({"hold": 3600})
        await self.until(lambda: len(self.server.feeds["market"]) == 2, 5, "NEW open")
        t_open = time.monotonic()
        limit = bl.HANDOVER_MAX_S + bl.HANDOVER_CONNECT_TIMEOUT_S + bl.HANDOVER_RETRY_S + 3.0
        while time.monotonic() - t_open < limit and len(self.server.attempts["market"]) < 3:
            await asyncio.sleep(0.05)
        pending = len(self.col.handover_failures), len(self.server.attempts["market"])
        msgs = self.col.stats.msgs
        await asyncio.sleep(0.3)
        old_feeding = self.col.stats.msgs > msgs
        raw = await self.finish(settle=0)
        self.assertTrue(old_feeding, "OLD kept the feed")
        self.assert_exactly_once(raw, SUFFIXES["market"])
        self.assertEqual(
            (pending[0], pending[1] >= 3, "predavani market: nove spojeni" in self.log()), (1, True, True),
            f"{limit:.0f} s after NEW opened silently: no handover failure recorded, no retry, nothing logged")

    async def test_a12_silent_new_then_old_closed_by_server(self):
        """A12 (item 3): as A11, then the server closes OLD with a close frame (Binance's 24 h cut). The pending
        handover switches to the silent NEW ('old_ended') and the endpoint records nothing more. main 90b1f61 has
        no parallel NEW: OLD's end goes straight to a fresh connection."""
        await self.start(kinds=("market",))
        self.server.plans["market"].append({"hold": 3600})
        await self.until(lambda: len(self.server.feeds["market"]) == 2, 5, "NEW open")
        await asyncio.sleep(0.5)
        old = self.server.feeds["market"][0]
        await old.ws.close()
        t_close_ms = int(time.time() * 1000)
        await asyncio.sleep(3.0)
        cancelled = await self.stop_and_cancel()
        raw = read_raw(self.out)
        after = [x for x in raw if x["stream"] == f"{SYM}@aggTrade" and x["recv_ms"] > t_close_ms + 500]
        reasons = [r["reason"] for r in self.col.handovers]
        self.assertEqual(reasons, ["old_ended"], "the silent NEW was taken over")
        self.assertGreater(len(after), 100, f"nothing recorded in the 3 s after OLD closed; run_endpoint stuck in "
                                            f"recv() on the silent NEW (cancelled: {cancelled})")

    async def test_a13_new_sends_only_some_streams(self):
        """A13 (item 3): market NEW never sends markPrice, public NEW never sends bookTicker. The switch only needs
        the streams NEW sent, so it switches and those streams stop for good. Expect: OLD keeps the feed (or the
        handover fails and is logged); markPrice and bookTicker keep being recorded."""
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append({"on_open": drop_on_new(lambda s, k, start: s in ("markPrice@1s", "bookTicker"))})
        reps = {k: await self.handover_done(k) for k in ("market", "public")}
        await asyncio.sleep(1.0)
        raw = await self.finish(settle=0)
        self.assert_exactly_once(raw, ["aggTrade", "depth@100ms"])
        later = {s: len([x for x in raw if x["stream"] == f"{SYM}@{s}" and x["recv_ms"] > reps[kind]["switch_ms"] + 300])
                 for s, kind in (("markPrice@1s", "market"), ("bookTicker", "public"))}
        self.assertNotIn(0, later.values(), f"messages recorded more than 0.3 s after the switch: {later}; "
                                            f"the switch reports did not mention a missing stream")

    async def test_a14_server_closes_new_at_once(self):
        """A14 (item 3): the server sends a close frame to NEW right after the handshake: read failure logged,
        OLD keeps the feed, exactly one retry after HANDOVER_RETRY_S, nothing lost."""
        await self.start()

        def close_new(old, new):
            asyncio.get_running_loop().create_task(new.ws.close())
        for kind in ("market", "public"):
            self.server.plans[kind].append({"hold": 3600, "on_open": close_new})
        reps = {k: await self.handover_done(k) for k in ("market", "public")}
        raw = await self.finish()
        fails = sorted((f["kind"], f["stage"], f["error"].split(":")[0]) for f in self.col.handover_failures)
        self.assertEqual(fails, [("market", "read", "ConnectionClosedOK"), ("public", "read", "ConnectionClosedOK")])
        self.assertEqual(self.log().count("spadlo pred prepnutim"), 2)
        for kind in ("market", "public"):
            self.assert_one_retry(kind)
            self.assertEqual(reps[kind]["reason"], "caught_up")
        self.assert_exactly_once(raw, ALL)
        self.assert_no_resync(raw)

    async def test_a15_old_ends_during_overlap(self):
        """A15 (item 3): OLD stalls and NEW continues exactly where OLD stopped; during the overlap OLD ends:
        market by a TCP abort, public by a close frame. Switch 'old_ended', not the error path: exactly once, depth
        chain continues, no resync, no backfill, book == server book."""
        bl.HANDOVER_MAX_S = 3.0
        await self.start(liq_every=7)
        for kind in ("market", "public"):
            self.server.plans[kind].append({"stall_old": True, "ahead": 0})
        await self.until(lambda: all(len(self.server.feeds[k]) == 2 and len(self.server.feeds[k][1].sent) > 20
                                     for k in ("market", "public")), 5, "NEWs buffering")
        self.assertEqual(list(self.col.handovers), [], "no switch yet")
        self.server.feeds["market"][0].abort()
        await self.server.feeds["public"][0].ws.close()
        reps = {k: await self.handover_done(k) for k in ("market", "public")}
        raw = await self.finish()
        for kind, rep in reps.items():
            self.assertEqual(rep["reason"], "old_ended", kind)
            self.assertLess(rep["t_switch"] - rep["t_first"], 1.5, kind)
        self.assert_exactly_once(raw, ALL)
        self.assertEqual(depth_breaks(raw), [])
        self.assert_no_resync(raw)
        self.assertEqual(self.backfills, [])
        self.assert_book_matches_server()

    async def test_a16_both_die_during_overlap(self):
        """A16 (item 3): OLD stalls, NEW buffers, then both are aborted: today's error path once per endpoint
        (backoff, reconnect, book.restart), one new connection each (no second NEW in parallel), no duplicate,
        aggTrade gap filled from REST, book synced again, no unhandled exception."""
        bl.HANDOVER_MAX_S = 3.0
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append({"stall_old": True, "ahead": 0})
        await self.until(lambda: all(len(self.server.feeds[k]) == 2 and len(self.server.feeds[k][1].sent) > 20
                                     for k in ("market", "public")), 5, "NEWs buffering")
        bl.RECONNECT_AFTER_S = 10_000
        for kind in ("market", "public"):
            self.server.feeds[kind][1].abort()
            self.server.feeds[kind][0].abort()
        await self.until(lambda: all(len(self.server.feeds[k]) == 3 for k in ("market", "public")), 6, "reconnected")
        await self.until(lambda: self.col.book.state == "synced", 5, "book synced")
        await self.until(lambda: len(self.backfill_done) == len(self.backfills) and self.backfills, 5, "backfill")
        raw = await self.finish(error_path=True)
        self.assertEqual(list(self.col.handovers), [])
        for kind in ("market", "public"):
            self.assertEqual(len(self.server.attempts[kind]), 3, kind)
            self.assertEqual(len(self.server.feeds[kind]), 3, kind)
        self.assertEqual(self.restarts, 1)
        for s in ALL:
            self.assert_increasing(raw, s)
        ws, rest = ws_keys(raw, "aggTrade"), ws_keys(raw, "aggTrade", src="rest")
        self.assertEqual(sorted(ws + rest), list(range(ws[0], ws[-1] + 1)))


# ---------------------------------------------------------------------------------------------- 4: timing and leaks

class TimingTest(AdvBase):

    async def test_a20_failed_handovers_past_the_24_h_limit(self):
        """A20 (item 4): production RECONNECT_AFTER_S (23 h 50 min), every NEW refused, the clock moved so OLD is
        24 h + 1 s old. Expect the collector to notice before Binance cuts OLD: a log line about the 24 h limit,
        or a fallback to the old break-and-reconnect. It only keeps retrying the handover every HANDOVER_RETRY_S
        ('stare bezi dal') with no notion of the hard limit."""
        bl.RECONNECT_AFTER_S = 23 * 3600 + 50 * 60
        bl.HANDOVER_RETRY_S = 0.4
        clock = ShiftedTime()
        self.enterContext(mock.patch.object(bl, "time", clock))
        await self.start(kinds=("market",), one_handover=False)
        for _ in range(200):
            self.server.plans["market"].append({"refuse": True})
        clock.offset = bl.RECONNECT_AFTER_S + 1
        await self.until(lambda: len(self.col.handover_failures) >= 2, 5, "handovers failing")
        log_at_limit = len(self.log())
        clock.offset = DAY_S + 1
        await asyncio.sleep(4 * bl.HANDOVER_RETRY_S)
        late = self.log()[log_at_limit:]
        old_closed_by_collector = self.server.feeds["market"][0].closed.is_set()
        n_fail = len(self.col.handover_failures)
        bl.RECONNECT_AFTER_S = 10 ** 9
        await self.finish(settle=0, error_path=True)
        self.assertGreaterEqual(n_fail, 4)
        self.assertTrue(old_closed_by_collector or "24" in late,
                        f"OLD is 24 h + 1 s old; {n_fail} failed handovers, no fallback and no line about the limit:"
                        f"\n{late[-400:]}")

    async def test_a21_next_handover_counts_from_new_open(self):
        """A21 (item 4): NEW-1 refused; NEW-2 opens after HANDOVER_RETRY_S and the switch takes ~0.8 s (OLD lags).
        The next scheduled handover must start RECONNECT_AFTER_S after NEW-2 opened (not after the switch, not
        after OLD's start or the failed attempt)."""
        bl.HANDOVER_RETRY_S = 0.6
        await self.start(kinds=("market",), one_handover=False)
        self.server.plans["market"].extend([{"refuse": True}, {"on_open": lag_old(0.8)}, {}])
        await self.until(lambda: len(self.server.attempts["market"]) >= 4, 10, "third handover started")
        bl.RECONNECT_AFTER_S = 10_000
        t = self.attempt_times("market")
        rep = self.reports("market")[0]
        await self.finish(settle=0.2)
        self.assertGreater(rep["t_switch"] - rep["t_open"], 0.6, "the switch took time")
        self.assertGreaterEqual(t[2] - t[1], bl.HANDOVER_RETRY_S)
        gap = t[3] - t[2]
        self.assertGreaterEqual(gap, self.SETTINGS["RECONNECT_AFTER_S"], "next handover too early")
        self.assertLess(gap, self.SETTINGS["RECONNECT_AFTER_S"] + 0.4, "next handover not counted from NEW's open")

    async def test_a22_fifty_handovers_leak_nothing(self):
        """A22 (item 4): 50 handovers in a row on each endpoint (RECONNECT_AFTER_S 0.25 s). After each switch:
        tasks, file descriptors, Handover objects and closing tasks stay bounded; afterwards they are back at the
        baseline; every event exactly once over all 50, depth chain intact, no resync, no backfill."""
        bl.RECONNECT_AFTER_S, bl.HANDOVER_FILTER_S, bl.HANDOVER_MAX_S = 0.25, 0.1, 1.0
        await self.start(one_handover=False, liq_every=7)
        gc.collect()
        fds0, tasks0 = fd_count(), len(asyncio.all_tasks())
        seen, samples, checkpoints = {"market": set(), "public": set()}, [], []
        end = time.monotonic() + 90
        while min(len(v) for v in seen.values()) < 50:
            self.assertLess(time.monotonic(), end, f"only {[len(v) for v in seen.values()]} handovers")
            new = [r for r in list(self.col.handovers) if id(r) not in seen[r["kind"]]]
            for r in new:
                seen[r["kind"]].add(id(r))
            if new:
                samples.append((len(asyncio.all_tasks()), fd_count(), sum(len(v) for v in self.col._closing.values())))
                if len(seen["market"]) % 10 == 0 and len(checkpoints) < len(seen["market"]) // 10:
                    gc.collect()
                    checkpoints.append((len(asyncio.all_tasks()), fd_count(), len(SpyHandover.alive)))
            await asyncio.sleep(0.003)
        bl.RECONNECT_AFTER_S = 10_000
        await self.until(lambda: not any(self.col._closing.values()), 15, "background closes finished")
        await asyncio.sleep(0.3)
        gc.collect()
        fds1, tasks1, alive = fd_count(), len(asyncio.all_tasks()), len(SpyHandover.alive)
        per_kind = {k: len(self.server.feeds[k]) for k in ("market", "public")}
        open_server_side = {k: sum(not f.closed.is_set() for f in self.server.feeds[k]) for k in ("market", "public")}
        raw = await self.finish(settle=0)
        self.assertEqual(list(self.col.handover_failures), [])
        self.assertGreaterEqual(min(per_kind.values()), 51)
        self.assertEqual(open_server_side, {"market": 1, "public": 1}, "connections left open")
        first, last = samples[:20], samples[-20:]
        for i, what in enumerate(("tasks", "fds", "closing tasks")):     # a leak raises the floor between handovers
            self.assertLessEqual(min(x[i] for x in last), min(x[i] for x in first) + 1,
                                 f"{what}: the floor grows with the number of handovers: {first[:3]} ... {last[-3:]}")
        self.assertLessEqual(max(x[0] for x in samples), tasks0 + 12, f"tasks: baseline {tasks0}, {samples[-3:]}")
        self.assertLessEqual(max(x[1] for x in samples), fds0 + 12, f"fds: baseline {fds0}, {samples[-3:]}")
        self.assertGreaterEqual(len(checkpoints), 5)
        self.assertLessEqual(max(c[2] for c in checkpoints), 2, f"Handover objects alive after gc: {checkpoints}")
        self.assertEqual((fds1, tasks1, alive), (fds0, tasks0, 0), "not back at baseline")
        self.assert_exactly_once(raw, ALL)
        self.assertEqual(depth_breaks(raw), [])
        self.assert_no_resync(raw)
        self.assertEqual(self.backfills, [])
        self.assert_book_matches_server()


# ---------------------------------------------------------------------------------------------- 5: REST gap fill

class GapFillTest(AdvBase):

    async def test_a30_backfill_running_during_handover(self):
        """A30 (item 5): OLD skips 5 aggTrades, the REST backfill starts and is held until the handover has switched
        and its filter has ended. The backfill completes, each id is recorded once (ws or rest), the tape has every
        id once, no second (spurious) backfill."""
        bl.RECONNECT_AFTER_S = 10_000
        self.backfill_gate = threading.Event()
        t0 = bl.time.time()
        await self.start(kinds=("market",))
        old = self.server.feeds["market"][0]
        k0 = old.pos + 5
        orig = old.messages
        old.messages = lambda tick: [m for m in orig(tick) if not (m[1] == "aggTrade" and k0 <= tick["k"] < k0 + 5)]
        await self.until(lambda: self.backfills, 3, "gap detected")
        self.trigger_handover(t0)
        await self.handover_done("market")
        self.assertEqual(self.backfill_done, [], "backfill still held")
        self.backfill_gate.set()
        await self.until(lambda: self.backfill_done, 5, "backfill done")
        raw = await self.finish()
        self.assertEqual(self.backfills, [(A0 + k0, A0 + k0 + 4)])
        ws, rest = ws_keys(raw, "aggTrade"), ws_keys(raw, "aggTrade", src="rest")
        self.assertEqual(sorted(rest), list(range(A0 + k0, A0 + k0 + 5)))
        self.assertEqual(sorted(ws + rest), list(range(ws[0], ws[-1] + 1)), "gap or duplicate")
        self.assertEqual(self.col.stats.backfilled, 5)
        tape = collections.Counter()
        for name in os.listdir(self.out):
            if name.startswith("tape_"):
                with open(os.path.join(self.out, name), encoding="utf-8") as f:
                    next(f)
                    tape.update(int(line.split(";")[7]) for line in f)
        self.assertEqual(sorted(tape), list(range(ws[0], ws[-1] + 1)))
        self.assertEqual(set(tape.values()), {1})


# ---------------------------------------------------------------------------------------------- 6: hour boundary

class HourBoundaryTest(AdvBase):

    async def _run_across_hour(self, lag=0.6):
        """Clocks of the collector and the fake server shifted so the top of an hour falls inside the overlap."""
        now = time.time()
        hour = math.ceil((now + 3.0) / 3600) * 3600
        clock = ShiftedTime(hour - 3.0 - now)
        self.enterContext(mock.patch.object(bl, "time", clock))
        self.enterContext(mock.patch.object(base, "time", clock))
        bl.RECONNECT_AFTER_S = 10_000
        t0 = clock.time()
        await self.start(liq_every=7)
        self.assertLess(clock.time(), hour - 0.5, "start() took too long for this test")
        for kind in ("market", "public"):
            self.server.plans[kind].append({"on_open": lag_old(lag)})
        while clock.time() < hour - lag / 2:
            await asyncio.sleep(0.002)
        self.trigger_handover(t0)
        reps = {k: await self.handover_done(k) for k in ("market", "public")}
        for kind, rep in reps.items():
            opened_ms = rep["switch_ms"] - (rep["t_switch"] - rep["t_open"]) * 1000
            self.assertLess(opened_ms, hour * 1000, f"{kind}: NEW opened after the hour")
            self.assertGreater(rep["switch_ms"], hour * 1000, f"{kind}: switched before the hour")
        return hour, reps

    async def test_a40_hour_boundary_inside_overlap_files_and_once(self):
        """A40 (item 6): the top of the hour inside the overlap: every raw line is in the file of its recv_ms hour,
        every event exactly once over both hours, every trade once in the tape file of its T hour."""
        hour, reps = await self._run_across_hour()
        raw = await self.finish()
        rows = raw_in_order(self.out)
        wrong = [(n, x["recv_ms"]) for n, x in rows if n != f"raw_{SYM.upper()}_{bl.utc_hour_key(x['recv_ms'])}.jsonl.gz"]
        self.assertEqual(wrong, [])
        self.assertEqual(len({n for n, _ in rows}), 2)
        self.assert_once(raw, ALL, ordered=False)
        ids = collections.Counter()
        for name in sorted(os.listdir(self.out)):
            if name.startswith("tape_"):
                with open(os.path.join(self.out, name), encoding="utf-8") as f:
                    next(f)
                    for line in f:
                        a, t_ms = int(line.split(";")[7]), int(line.split(";")[8])
                        ids[a] += 1
                        self.assertEqual(name, f"tape_{SYM.upper()}_{bl.utc_hour_key(t_ms)}.csv")
        self.assertEqual(set(ids.values()), {1})
        self.assertEqual(sorted(ids), sorted(ws_keys(raw, "aggTrade")))

    async def test_a41_hour_boundary_inside_overlap_write_order(self):
        """A41 (items 2, 6): same run; read the raw files in hour order, lines in write order (how a book rebuild or
        a C4-style replay reads them): depth pu == previous u and aggTrade / bookTicker keys increasing. The buffered
        NEW events carry earlier recv_ms than OLD's last events, so the hour H-1 file is appended after hour H began
        and the chain breaks twice at the boundary. main 90b1f61 writes in key order."""
        await self._run_across_hour()
        await self.finish()
        lines = [x for _, x in raw_in_order(self.out)]
        problems = {"depth pu breaks": depth_breaks(lines)}
        for s in ("aggTrade", "bookTicker"):
            k = [base.key_of(s, x["data"]) for x in lines if x["src"] == "ws" and x["stream"] == f"{SYM}@{s}"]
            problems[f"{s} backwards"] = [(a, b) for a, b in zip(k, k[1:]) if b <= a][:3]
        problems = {k: v for k, v in problems.items() if v}
        self.assertFalse(problems, f"problems in file order: {problems}")

    async def test_a42_recv_ms_order_within_file(self):
        """A42 (item 8): OLD lags 0.5 s (no hour boundary). In each raw file, recv_ms per stream should not go
        backwards in write order (main 90b1f61: it never does). The buffer is written with NEW's earlier receive
        times after OLD's later ones."""
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append({"on_open": lag_old(0.5)})
        for kind in ("market", "public"):
            await self.handover_done(kind)
        await self.finish()
        back = collections.Counter()
        worst = collections.Counter()
        last = {}
        for name, x in raw_in_order(self.out):
            if x["src"] != "ws":
                continue
            prev = last.get((name, x["stream"]))
            if prev is not None and x["recv_ms"] < prev:
                back[x["stream"]] += 1
                worst[x["stream"]] = max(worst[x["stream"]], prev - x["recv_ms"])
            last[(name, x["stream"])] = max(prev or 0, x["recv_ms"])
        self.assertFalse(back, f"lines whose recv_ms is below an earlier line of the same stream and file: "
                               f"{dict(back)}, by up to {dict(worst)} ms")


# ---------------------------------------------------------------------------------------------- 7: shutdown

class ShutdownTest(AdvBase):

    async def test_a50_sigterm_during_handover_through_main(self):
        """A50 (item 7): Collector.main() (signal handlers, cancel, rec.close) gets SIGTERM while market's NEW
        buffers (OLD lags 1 s) and public's NEW is still opening. Then the rest of asyncio.run's teardown (cancel
        what is left). Expect: 'ulozeno, konec', every file complete and readable, tapes finalized, no unhandled
        exception, and the server sees every connection closed."""
        bl.HANDOVER_MAX_S = 5.0
        self.server = AdvFake()
        await self.server.start()
        self.addAsyncCleanup(self.server.close)
        self.col = bl.Collector(self.args())
        loop = asyncio.get_running_loop()
        self.addCleanup(lambda: [loop.remove_signal_handler(s) for s in (signal.SIGINT, signal.SIGTERM)])
        main = asyncio.create_task(self.col.main())
        self.tasks = {"main": main}
        await self.until(lambda: self.server.feeds["market"] and self.server.feeds["public"], 5, "connected")
        self.server.plans["market"].append({"on_open": lag_old(1.0)})
        self.server.plans["public"].append({"slow_open": 1.5})
        await self.until(lambda: len(self.server.feeds["market"]) == 2 and len(self.server.feeds["market"][1].sent) > 10
                         and len(self.server.attempts["public"]) == 2, 8, "handovers in progress")
        os.kill(os.getpid(), signal.SIGTERM)
        await asyncio.wait_for(main, 5)
        left = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()
                and getattr(t.get_coro(), "__qualname__", "").startswith("Collector.")]
        for t in left:                                # what asyncio.run does after main() returns
            t.cancel()
        if left:
            await asyncio.wait(left, timeout=5)
        t0 = time.monotonic()
        while time.monotonic() - t0 < 3 and not all(f.closed.is_set() for fs in self.server.feeds.values() for f in fs):
            await asyncio.sleep(0.05)
        open_feeds = [(k, i) for k, fs in self.server.feeds.items() for i, f in enumerate(fs) if not f.closed.is_set()]
        self.assertIn("ulozeno, konec", self.log())
        self.assertEqual(list(self.col.handovers), [])
        for name in os.listdir(self.out):
            path = os.path.join(self.out, name)
            self.assertFalse(name.endswith(".tmp"), name)
            if name.endswith(".gz"):
                with gzip.open(path, "rt", encoding="utf-8") as f:
                    for line in f:
                        json.loads(line)
            elif name.startswith("tape_"):
                with open(path, encoding="utf-8") as f:
                    next(f)
                    ids = [int(line.split(";")[7]) for line in f]
                self.assertEqual(ids, sorted(ids), "tape not finalized")
        raw = read_raw(self.out)
        for s in ALL:
            self.assert_increasing(raw, s)
        self.assertEqual(self.loop_errors, [])
        self.assertEqual(open_feeds, [], "connections the server still sees open 3 s after the teardown")


# ---------------------------------------------------------------------------------------------- 8: other

class OtherTest(AdvBase):

    async def test_a60_old_ends_before_new_opens_takes_todays_path(self):
        """A60 (items 3, 8): NEW's handshake is slow (1 s); OLD is aborted while NEW is still opening: today's error
        path (logged, backoff, reconnect, book.restart), NEW's connection attempt is dropped and closed, no second
        NEW, no unhandled exception."""
        await self.start(kinds=("public",))
        self.server.plans["public"].append({"slow_open": 1.0})
        await self.until(lambda: len(self.server.attempts["public"]) == 2, 5, "NEW opening")
        bl.RECONNECT_AFTER_S = 10_000
        self.server.feeds["public"][0].abort()
        await self.until(lambda: len(self.server.feeds["public"]) >= 2 and self.col.book.state == "synced"
                         and "spojeni public spadlo" in self.log(), 6, "public reconnected")
        await asyncio.sleep(1.5)
        raw = await self.finish(error_path=True)
        self.assertEqual([r["kind"] for r in self.col.handovers], [])
        self.assertEqual(self.restarts, 1)
        self.assertLessEqual(sum(not f.closed.is_set() for f in self.server.feeds["public"]), 1)
        for s in SUFFIXES["public"]:
            self.assert_increasing(raw, s)


if os.environ.get("PR9_MAIN_CODE"):
    # Optional comparison with main 90b1f61:  git show 90b1f61:tools/collector/binance_live.py > /tmp/bl_main.py
    # PR9_MAIN_CODE=/tmp/bl_main.py python3 -m unittest test_handover_adversarial.MainComparisonTest -v
    import importlib.util

    def _load_main():
        spec = importlib.util.spec_from_file_location("binance_live_main", os.environ["PR9_MAIN_CODE"])
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod

    class MainComparisonTest(AdvBase):
        """The same scenarios against main's collector (no handover): what main loses or does."""

        async def asyncSetUp(self):
            global bl
            self._bl_pr = bl
            bl = _load_main()
            for k in ("HANDOVER_MAX_S", "HANDOVER_FILTER_S", "HANDOVER_RETRY_S", "HANDOVER_BUFFER_MAX",
                      "HANDOVER_CONNECT_TIMEOUT_S"):
                setattr(bl, k, 0)
            base.bl, self._base_bl = bl, base.bl
            bl.Handover = SpyHandover
            await super().asyncSetUp()

        async def asyncTearDown(self):
            global bl
            await super().asyncTearDown()
            bl, base.bl = self._bl_pr, self._base_bl

        async def test_m12_silent_new_connection_then_old_closed(self):
            """main: the scheduled reconnect (RECONNECT_AFTER_S) opens a silent connection: nothing recorded."""
            await self.start(kinds=("market",), one_handover=False)
            self.server.plans["market"].append({"hold": 3600})
            await self.until(lambda: len(self.server.feeds["market"]) == 2, 15, "reconnected")
            bl.RECONNECT_AFTER_S = 10_000
            t_ms = int(time.time() * 1000)
            await asyncio.sleep(3.0)
            await self.stop_and_cancel()
            after = [x for x in read_raw(self.out) if x["stream"] == f"{SYM}@aggTrade" and x["recv_ms"] > t_ms + 500]
            self.assertEqual(len(after), 0, "main records nothing on a silent connection either")

        async def test_m01_scheduled_reconnect_server_ignores_close(self):
            """main: the scheduled reconnect while the server ignores the client's close (as H1 does for the PR):
            the close handshake runs into close_timeout (10 s) and every stream is silent that long."""
            await self.start(one_handover=False)
            for kind in ("market", "public"):
                self.server.feeds[kind][0].ignore_input = True
            await self.until(lambda: all(len(self.server.feeds[k]) == 2 for k in ("market", "public")), 15, "reconnected")
            bl.RECONNECT_AFTER_S = 10_000
            await asyncio.sleep(0.5)
            await self.stop_and_cancel()
            raw = read_raw(self.out)
            gaps = {}
            for sfx in ("aggTrade", "markPrice@1s", "depth@100ms", "bookTicker"):
                t = sorted(x["recv_ms"] for x in raw if x["src"] == "ws" and x["stream"] == f"{SYM}@{sfx}")
                gaps[sfx] = max(b - a for a, b in zip(t, t[1:])) / 1000
            sys.__stderr__.write(f"\nmain, largest silence per stream at the scheduled reconnect: {gaps}\n")
            self.assertTrue(all(9.0 <= g <= 11.5 for g in gaps.values()), gaps)
            self.assertGreaterEqual(self.restarts, 1, "book restarted (resync)")

        async def test_m13_reconnect_onto_connection_without_some_streams(self):
            """main: the scheduled reconnect lands on a connection without markPrice / bookTicker: lost as well."""
            await self.start(one_handover=False)
            for kind in ("market", "public"):
                self.server.plans[kind].append({"on_open": drop_on_new(lambda sfx, k, start: sfx in ("markPrice@1s", "bookTicker"))})
            await self.until(lambda: all(len(self.server.feeds[k]) == 2 for k in ("market", "public")), 15, "reconnected")
            bl.RECONNECT_AFTER_S = 10_000
            t_ms = int(time.time() * 1000)
            await asyncio.sleep(1.5)
            await self.stop_and_cancel()
            raw = read_raw(self.out)
            later = {sfx: len([x for x in raw if x["stream"] == f"{SYM}@{sfx}" and x["recv_ms"] > t_ms + 300])
                     for sfx in ("markPrice@1s", "bookTicker", "aggTrade")}
            self.assertEqual((later["markPrice@1s"], later["bookTicker"]), (0, 0), later)
            self.assertGreater(later["aggTrade"], 50)

        async def test_m50_sigterm_through_main(self):
            """main: SIGTERM through Collector.main(), then asyncio.run's teardown; are connections closed?"""
            self.server = AdvFake()
            await self.server.start()
            self.addAsyncCleanup(self.server.close)
            self.col = bl.Collector(self.args())
            loop = asyncio.get_running_loop()
            self.addCleanup(lambda: [loop.remove_signal_handler(s) for s in (signal.SIGINT, signal.SIGTERM)])
            main = asyncio.create_task(self.col.main())
            self.tasks = {"main": main}
            await self.until(lambda: self.server.feeds["market"] and self.server.feeds["public"], 8, "connected")
            await asyncio.sleep(0.5)
            os.kill(os.getpid(), signal.SIGTERM)
            await asyncio.wait_for(main, 5)
            left = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()
                    and getattr(t.get_coro(), "__qualname__", "").startswith("Collector.")]
            for t in left:
                t.cancel()
            if left:
                await asyncio.wait(left, timeout=5)
            t0 = time.monotonic()
            while time.monotonic() - t0 < 3 and not all(f.closed.is_set() for fs in self.server.feeds.values()
                                                        for f in fs):
                await asyncio.sleep(0.05)
            open_feeds = [(k, i) for k, fs in self.server.feeds.items() for i, f in enumerate(fs)
                          if not f.closed.is_set()]
            self.assertIn("ulozeno, konec", self.log())
            self.assertEqual(open_feeds, [], "main: connections still open after SIGTERM + teardown")


if __name__ == "__main__":
    unittest.main()
