#!/usr/bin/env python3
"""Make-before-break reconnect handover of binance_live.Collector.run_endpoint, against a local fake Binance.

Run:  python3 -m unittest discover -s tools/collector -p "test_reconnect_*.py" -v      (needs websockets)

The fake server emulates Binance combined streams ({"stream": "<sym>@<stream>", "data": {...}}) from ONE shared
event generator (a tick every 10 ms), so two connections at the same position get byte-identical events, like
Binance fan-out. Per connection it can: ignore or delay the client's close, start earlier or later than another
connection's position, stall, lag, batch depth updates differently, inject a message, drop the TCP connection,
and refuse the opening handshake. REST (snapshot, aggTrades backfill) is mocked; nothing leaves the machine.
"""
import asyncio
import collections
import contextlib
import gc
import gzip
import http
import io
import json
import logging
import os
import shutil
import socket
import sys
import tempfile
import time
import types
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if not isinstance(sys.modules.get("websockets"), (types.ModuleType, type(None))):
    del sys.modules["websockets"]               # test_binance_live.py stubs it when it is imported first
try:
    import websockets
    from websockets.asyncio.server import ServerConnection, serve
except ImportError:
    raise unittest.SkipTest("websockets is not installed (pip install websockets==17.2)")

import binance_live as bl                       # noqa: E402

SYM = "btcusdt"
A0, D0 = 5_000_000, 70_000_000                  # first aggTrade id, first depth update id
STREAMS = {"market": [f"{SYM}@aggTrade", f"{SYM}@forceOrder", f"{SYM}@markPrice@1s"],
           "public": [f"{SYM}@depth@100ms", f"{SYM}@bookTicker"]}
SUFFIXES = {k: [s.split("@", 1)[1] for s in v] for k, v in STREAMS.items()}
QUIET = logging.getLogger("fake_binance")
QUIET.disabled = True


def text(suffix, data):
    return json.dumps({"stream": f"{SYM}@{suffix}", "data": data}, separators=(",", ":"))


def key_of(suffix, d):
    """The test's own duplicate key (independent of binance_live)."""
    if suffix == "aggTrade":
        return d["a"]
    if suffix in ("depth@100ms", "bookTicker"):
        return d["u"]
    if suffix == "markPrice@1s":
        return d["E"]
    o = d["o"]
    return (d["E"], o["s"], o["S"], o["T"], o["q"], o["p"])


class ServerConn(ServerConnection):
    """Server side of one connection; can ignore or delay everything the client sends (its close included)."""
    feed = None

    def data_received(self, data):
        f = self.feed
        if f is not None and f.ignore_input:
            return
        if f is not None and f.input_delay:
            self.loop.call_later(f.input_delay, self._late, data)
            return
        super().data_received(data)

    def _late(self, data):
        if not self.transport.is_closing():
            super().data_received(data)


class Feed:
    """One client connection as the fake server sees it."""

    def __init__(self, server, kind, ws, pos, plan):
        self.server, self.kind, self.ws, self.pos = server, kind, ws, pos      # pos: next tick to send
        self.delay = plan.get("delay", 0.0)               # send tick i at its time + delay (lag)
        self.hold_until = time.monotonic() + plan.get("hold", 0.0)
        self.depth_batch = plan.get("depth_batch", (2, 0))  # (n, phase): one event per n ids, ending at id % n == phase
        self.abort_after = plan.get("abort_after")        # drop the TCP connection after this many messages
        self.stalled = False
        self.ignore_input = False
        self.input_delay = 0.0
        self.busy = False
        self.sent = []                                    # (suffix, key) per message sent
        self.extra = []
        self.pending = []
        self.changed = asyncio.Event()
        self.closed = asyncio.Event()

    def poke(self):
        self.changed.set()

    def stall(self):
        self.stalled = True

    def abort(self):
        self.ws.transport.abort()

    def inject(self, msg):
        self.extra.append(msg)
        self.poke()

    def messages(self, tick):
        if self.kind == "market":
            return [tick["agg"]] + ([tick["mark"]] if tick["mark"] else []) + tick["liqs"]
        n, phase = self.depth_batch
        out = []
        for upd in tick["depth"]:
            self.pending.append(upd)
            if upd["id"] % n == phase:
                u = upd["id"]
                d = {"e": "depthUpdate", "E": upd["E"], "T": upd["E"], "s": "BTCUSDT", "U": u - n + 1, "u": u,
                     "pu": u - n, "b": [x for p in self.pending for x in p["b"]],
                     "a": [x for p in self.pending for x in p["a"]]}
                out.append((text("depth@100ms", d), "depth@100ms", u))
                self.pending = []
        return out + [tick["bbo"]]

    async def _wait(self, timeout):
        self.changed.clear()
        try:
            await asyncio.wait_for(self.changed.wait(), timeout)
        except TimeoutError:
            pass

    async def _send(self, msg, suffix=None, key=None):
        await self.ws.send(msg)
        if suffix:
            self.sent.append((suffix, key))
        if self.abort_after is not None and len(self.sent) >= self.abort_after:
            self.abort_after = None
            self.abort()

    async def run(self):
        try:
            while True:
                while self.extra:
                    await self._send(self.extra.pop(0))
                ticks, now = self.server.ticks, time.monotonic()
                if now < self.hold_until:
                    await self._wait(self.hold_until - now)
                elif self.stalled or self.pos >= len(ticks):
                    await self._wait(None)
                elif now < ticks[self.pos]["t"] + self.delay:
                    await self._wait(ticks[self.pos]["t"] + self.delay - now)
                else:
                    self.busy = True
                    for msg, suffix, key in self.messages(ticks[self.pos]):
                        await self._send(msg, suffix, key)
                    self.pos += 1
                    self.busy = False
        except websockets.exceptions.ConnectionClosed:
            pass


class FakeBinance:
    """Binance combined streams from one shared generator; `plans[kind]` holds options for the next connections."""

    def __init__(self, tick_s=0.01, mark_every=10, liq_every=0):
        self.tick_s, self.mark_every, self.liq_every = tick_s, mark_every, liq_every
        self.ticks = []
        self.feeds = {"market": [], "public": []}
        self.plans = {"market": collections.deque(), "public": collections.deque()}
        self.attempts = {"market": [], "public": []}     # (time.monotonic(), refused) per opening handshake
        self.aggs = {}                                    # a -> REST aggTrade, for the backfill mock
        self.depth_id = D0
        self.last_E = 0

    async def start(self):
        self.server = await serve(self._handler, "localhost", 0, family=socket.AF_INET, create_connection=ServerConn,
                                  process_request=self._process_request, logger=QUIET)
        self.port = self.server.sockets[0].getsockname()[1]
        self.gen = asyncio.create_task(self._generate())

    async def close(self):
        self.gen.cancel()
        for feeds in self.feeds.values():
            for f in feeds:
                f.abort()
        self.server.close()
        await self.server.wait_closed()
        await asyncio.wait([self.gen])

    def tick(self):
        k = len(self.ticks)
        E = self.last_E = max(int(time.time() * 1000), self.last_E + 1)
        a, price = A0 + k, 80000.0 + (k % 40) * 0.1
        agg = {"a": a, "p": f"{price:.1f}", "q": "0.010", "f": 2 * a, "l": 2 * a, "T": E, "m": k % 2 == 0}
        self.aggs[a] = agg
        t = {"t": time.monotonic(), "k": k,
             "agg": (text("aggTrade", {"e": "aggTrade", "E": E, "s": "BTCUSDT", **agg}), "aggTrade", a),
             "mark": None, "liqs": [], "depth": []}
        if k % self.mark_every == 0:
            d = {"e": "markPriceUpdate", "E": E, "s": "BTCUSDT", "p": f"{price:.1f}", "i": f"{price:.1f}", "P": "0",
                 "r": "0.0001", "T": E + 3_600_000}
            t["mark"] = (text("markPrice@1s", d), "markPrice@1s", E)
        if self.liq_every and k % self.liq_every == 0:
            for side, q, p in (("SELL", "0.014", f"{price - 1:.1f}"), ("BUY", "0.020", f"{price + 1:.1f}")):
                d = {"e": "forceOrder", "E": E, "o": {"s": "BTCUSDT", "S": side, "o": "LIMIT", "f": "IOC", "q": q,
                                                     "p": p, "ap": p, "X": "FILLED", "l": q, "z": q, "T": E}}
                t["liqs"].append((text("forceOrder", d), "forceOrder", key_of("forceOrder", d)))
        for i in (1, 2):
            t["depth"].append({"id": D0 + 2 * k + i, "E": E, "b": [[f"{price - 0.1 * i:.1f}", "1.000"]],
                               "a": [[f"{price + 0.1 * i:.1f}", "1.000"]]})
        u = D0 + 2 * k + 2
        d = {"e": "bookTicker", "u": u, "s": "BTCUSDT", "b": f"{price:.1f}", "B": "1.000", "a": f"{price + 0.1:.1f}",
             "A": "1.000", "T": E, "E": E}
        t["bbo"] = (text("bookTicker", d), "bookTicker", u)
        self.ticks.append(t)
        self.depth_id = u

    def keys(self, suffix):
        """Every key the generator produced for a stream, in order (depth in the default batching)."""
        if suffix == "depth@100ms":
            return [t["depth"][-1]["id"] for t in self.ticks]
        if suffix == "forceOrder":
            return [k for t in self.ticks for _, _, k in t["liqs"]]
        pick = {"aggTrade": "agg", "markPrice@1s": "mark", "bookTicker": "bbo"}[suffix]
        return [t[pick][2] for t in self.ticks if t[pick]]

    async def _generate(self):
        while True:
            self.tick()
            for feeds in self.feeds.values():
                for f in feeds:
                    f.poke()
            await asyncio.sleep(self.tick_s)

    async def _process_request(self, connection, request):
        kind = "market" if request.path.startswith("/market/") else "public"
        plan = self.plans[kind].popleft() if self.plans[kind] else {}
        self.attempts[kind].append((time.monotonic(), bool(plan.get("refuse"))))
        if plan.get("slow_open"):
            await asyncio.sleep(plan["slow_open"])
        if plan.get("refuse"):
            return connection.respond(http.HTTPStatus.SERVICE_UNAVAILABLE, "refused\n")
        connection.plan = (kind, plan)
        return None

    async def _handler(self, ws):
        kind, plan = ws.plan
        open_feeds = [f for f in self.feeds[kind] if not f.closed.is_set()]
        old = open_feeds[-1] if open_feeds else None
        if plan.get("stall_old"):
            old.stall()
            while old.busy:                               # stop exactly at a tick boundary
                await asyncio.sleep(0.001)
        if old is None:
            pos = len(self.ticks)
        elif "behind" in plan:
            pos = old.pos - plan["behind"]
        elif "ahead" in plan:
            pos = old.pos + plan["ahead"]
        else:
            pos = len(self.ticks)
        feed = Feed(self, kind, ws, pos, plan)
        ws.feed = feed
        self.feeds[kind].append(feed)
        if plan.get("on_open"):
            plan["on_open"](old, feed)
        sender = asyncio.create_task(feed.run())
        try:
            await ws.wait_closed()
        finally:
            sender.cancel()
            feed.closed.set()


def read_raw(out):
    lines = []
    for name in sorted(os.listdir(out)):
        if name.startswith("raw_"):
            with gzip.open(os.path.join(out, name), "rt", encoding="utf-8") as f:
                lines += [json.loads(line) for line in f]
    return lines


def ws_keys(raw, suffix, src="ws"):
    stream = f"{SYM}@{suffix}"
    return [key_of(suffix, x["data"]) for x in raw if x["src"] == src and x["stream"] == stream]


class HandoverTest(unittest.IsolatedAsyncioTestCase):
    SETTINGS = dict(RECONNECT_AFTER_S=1.2, HANDOVER_MAX_S=2.0, HANDOVER_FILTER_S=1.0, HANDOVER_RETRY_S=1.0,
                    HANDOVER_BUFFER_MAX=20000, HANDOVER_CONNECT_TIMEOUT_S=2.0)

    async def asyncSetUp(self):
        self.loop_errors = []
        asyncio.get_running_loop().set_exception_handler(lambda loop, ctx: self.loop_errors.append(ctx))
        self.out = tempfile.mkdtemp(prefix="handover_test_")
        self.addCleanup(shutil.rmtree, self.out, True)
        self.stdout = io.StringIO()
        self.enterContext(contextlib.redirect_stdout(self.stdout))
        self.enterContext(mock.patch.multiple(bl, websockets=websockets, **self.SETTINGS))
        self.enterContext(mock.patch.object(bl, "rest_agg_trades", self._rest_agg_trades))
        self.enterContext(mock.patch.object(bl, "rest_get", self._rest_get))
        self.backfills = []
        self.col = None
        self.tasks = {}

    async def asyncTearDown(self):
        pending = [t for t in self.tasks.values() if not t.done()]
        if pending:                                       # a failed test: do not leave the collector running
            self.col.stop.set()
            await asyncio.wait(pending, timeout=12)
            for t in pending:
                t.cancel()

    def _rest_agg_trades(self, symbol, first, last):
        self.backfills.append((first, last))
        return [dict(self.server.aggs[a]) for a in range(first, last + 1) if a in self.server.aggs]

    def _rest_get(self, url, params, tries=5):
        if "/depth" not in url:
            return None
        now = int(time.time() * 1000)
        return {"lastUpdateId": self.server.depth_id, "E": now, "T": now,
                "bids": [["79990.0", "1.000"]], "asks": [["80010.0", "1.000"]]}

    async def start(self, kinds=("market", "public"), **server_kw):
        self.server = FakeBinance(**server_kw)
        await self.server.start()
        self.addAsyncCleanup(self.server.close)
        args = types.SimpleNamespace(symbol=SYM, out=self.out, bbo=True, book=True, oi=False, all=False, quiet=True,
                                     features=None, live_port=0, ws_base=f"ws://localhost:{self.server.port}",
                                     rest_base=None, symbols_config=None)
        self.col = bl.Collector(args)
        self.restarts = 0
        real_restart = self.col.book.restart

        def counted_restart():
            self.restarts += 1
            real_restart()
        self.col.book.restart = counted_restart
        self.tasks = {k: asyncio.create_task(self.col.run_endpoint(k, STREAMS[k])) for k in kinds}
        watch = asyncio.create_task(self._one_handover_each(kinds))
        self.addCleanup(watch.cancel)
        await self.until(lambda: all(self.server.feeds[k] for k in kinds), 5, "connected")
        await self.until(lambda: self.col.book.state == "synced" or "public" not in kinds, 5, "book synced")
        self.resyncs_before = self.col.book.resyncs

    async def _one_handover_each(self, kinds):
        """RECONNECT_AFTER_S is tiny in the tests; once every endpoint has switched, no second handover starts."""
        while not all(self.reports(k) for k in kinds):
            await asyncio.sleep(0.005)
        bl.RECONNECT_AFTER_S = 10_000

    async def until(self, pred, timeout, what):
        end = time.monotonic() + timeout
        while not pred():
            if time.monotonic() > end:
                self.fail(f"timed out after {timeout} s waiting for: {what}\n{self.stdout.getvalue()}")
            await asyncio.sleep(0.005)

    def reports(self, kind):
        return [r for r in self.col.handovers if r["kind"] == kind]

    async def handover_done(self, kind, timeout=8):
        await self.until(lambda: any(r["t_filter_end"] for r in self.reports(kind)), timeout, f"{kind} handover")
        return self.reports(kind)[0]

    async def finish(self, settle=0.3, error_path=False):
        """Stop the collector the way main() sets stop, then return its raw output. Unless error_path, today's
        reconnect-after-error path must not have been taken."""
        await asyncio.sleep(settle)
        self.col.stop.set()
        done, pending = await asyncio.wait(self.tasks.values(), timeout=12)
        self.assertFalse(pending, "run_endpoint did not return after stop")
        for t in done:
            self.assertIsNone(t.result())

        def collector_busy():
            return [t for t in asyncio.all_tasks() if t is not asyncio.current_task()
                    and getattr(t.get_coro(), "__qualname__", "").startswith("Collector.")]
        await self.until(lambda: not collector_busy(), 5, "collector tasks (snapshot, backfill) finished")
        self.col.rec.close()
        gc.collect()
        await asyncio.sleep(0)
        self.assertEqual(self.loop_errors, [], "asyncio reported an unhandled exception or a pending task")
        left = [t.get_name() for t in asyncio.all_tasks() if t.get_name().startswith("handover-")]
        self.assertEqual(left, [], "handover tasks still pending after run_endpoint returned")
        if not error_path:
            self.assertNotRegex(self.stdout.getvalue(), r"spojeni (market|public) spadlo \(", "error path taken")
        return read_raw(self.out)

    def assert_exactly_once(self, raw, suffixes):
        for s in suffixes:
            got, exp = ws_keys(raw, s), self.server.keys(s)
            if not exp:
                continue                                  # e.g. forceOrder when the generator sends none
            self.assertTrue(got, f"{s}: nothing recorded")
            want = exp[exp.index(got[0]):exp.index(got[-1]) + 1]
            dups = [k for k, c in collections.Counter(got).items() if c > 1]
            missing = sorted(set(want) - set(got), key=want.index)
            self.assertEqual((missing[:5], len(missing), dups[:5], len(dups)), ([], 0, [], 0), s)
            self.assertEqual(got, want, f"{s}: keys out of order")

    def assert_increasing(self, raw, suffix):
        got = ws_keys(raw, suffix)
        self.assertTrue(all(x < y for x, y in zip(got, got[1:])), f"{suffix}: keys not strictly increasing")

    def expected_dropped(self, feed, rep, suffix):
        """NEW's messages that OLD had already delivered when the switch happened."""
        last = rep["old_last"][f"{SYM}@{suffix}"]
        if suffix == "forceOrder":
            order = self.server.keys("forceOrder")
            return sum(1 for s, k in feed.sent if s == suffix and order.index(k) <= order.index(last))
        return sum(1 for s, k in feed.sent if s == suffix and k <= last)

    # ------------------------------------------------------------------ scenarios

    async def test_h01_normal_handover_server_ignores_close(self):
        """H1: every event exactly once, keys in order, no recorded gap > 300 ms, no resync, switch well before
        the 10 s close timeout while OLD's close is still pending in the background."""
        await self.start(liq_every=7)
        for kind in ("market", "public"):
            self.server.plans[kind].append({"on_open": lambda old, new: setattr(old, "ignore_input", True)})
        reps = {}
        for kind in ("market", "public"):
            await self.until(lambda: self.reports(kind), 8, f"{kind} switch")
            reps[kind] = self.reports(kind)[0]
        msgs = self.col.stats.msgs
        await asyncio.sleep(0.6)
        for kind in ("market", "public"):
            self.assertTrue(self.col._closing.get(kind), f"{kind}: OLD's close should still be waiting")
            self.assertFalse(self.server.feeds[kind][0].closed.is_set())
        self.assertGreater(self.col.stats.msgs, msgs + 100, "processing continued while OLD's close was pending")
        for kind in ("market", "public"):
            await self.handover_done(kind)
            self.server.feeds[kind][0].abort()            # release OLD so the test can stop quickly
        raw = await self.finish()
        for kind, rep in reps.items():
            self.assertLess(rep["t_switch"] - rep["t_start"], 2.0, kind)
            self.assertEqual(rep["reason"], "caught_up", kind)
        self.assertIs(reps["public"]["depth_continued"], True)
        self.assertIs(reps["market"]["agg_gap"], False)
        self.assert_exactly_once(raw, SUFFIXES["market"] + SUFFIXES["public"])
        for s in ("aggTrade", "depth@100ms", "bookTicker"):
            rep = reps["market" if s == "aggTrade" else "public"]
            t = sorted(x["recv_ms"] for x in raw if x["src"] == "ws" and x["stream"] == f"{SYM}@{s}"
                       and abs(x["recv_ms"] - rep["switch_ms"]) <= 1000)
            self.assertLessEqual(max(b - a for a, b in zip(t, t[1:])), 300, s)
            self.assertGreater(ws_keys(raw, s)[-1], rep["old_last"][f"{SYM}@{s}"], s)
        self.assertEqual(self.col.book.resyncs, self.resyncs_before)
        self.assertEqual((self.restarts, self.backfills), (0, []))
        self.assertEqual([len(self.server.attempts[k]) for k in ("market", "public")], [2, 2])
        self.assertIn("predavani market: prepnuto", self.stdout.getvalue())

    async def test_h02_new_starts_behind_old(self):
        """H2: NEW replays 30 ticks OLD already delivered; they are dropped and counted, nothing is lost. OLD's
        close is answered only 2 s late."""
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append({"behind": 30, "on_open": lambda old, new: setattr(old, "input_delay", 2.0)})
        reps = {k: await self.handover_done(k) for k in ("market", "public")}
        raw = await self.finish()
        for kind, rep in reps.items():
            self.assertLess(rep["t_switch"] - rep["t_start"], 1.0, kind)
            new = self.server.feeds[kind][1]
            for s in SUFFIXES[kind]:
                if s == "forceOrder":
                    continue
                want = self.expected_dropped(new, rep, s)
                self.assertEqual(rep["dropped"][s], want, f"{kind} {s}")
            self.assertGreaterEqual(rep["dropped"]["aggTrade" if kind == "market" else "bookTicker"], 25)
        self.assert_exactly_once(raw, SUFFIXES["market"] + SUFFIXES["public"])
        self.assertEqual((self.col.book.resyncs, self.restarts, self.backfills), (self.resyncs_before, 0, []))

    async def test_h03_old_lags_behind_new(self):
        """H3: OLD runs 0.3 s behind; the switch waits until OLD reaches NEW's first keys."""
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append({"on_open": lambda old, new: setattr(old, "delay", 0.3)})
        reps = {k: await self.handover_done(k) for k in ("market", "public")}
        raw = await self.finish()
        for kind, rep in reps.items():
            self.assertEqual(rep["reason"], "caught_up", kind)
            self.assertGreater(rep["t_switch"] - rep["t_first"], 0.2, kind)
            self.assertLess(rep["t_switch"] - rep["t_first"], bl.HANDOVER_MAX_S, kind)
            new_first = {}
            for s, k in self.server.feeds[kind][1].sent:
                new_first.setdefault(s, k)
            for s in SUFFIXES[kind]:
                if s != "forceOrder" and s in new_first:
                    self.assertGreaterEqual(rep["old_last"][f"{SYM}@{s}"], new_first[s], f"{kind} {s}")
        self.assert_exactly_once(raw, SUFFIXES["market"] + SUFFIXES["public"])
        self.assertIs(reps["public"]["depth_continued"], True)
        self.assertEqual((self.col.book.resyncs, self.restarts, self.backfills), (self.resyncs_before, 0, []))

    async def test_h04_old_stalls(self):
        """H4: OLD stalls and NEW starts 20 ticks later: switch after HANDOVER_MAX_S, the aggTrade gap goes to the
        backfill, the depth pu break resyncs the book exactly once through on_event."""
        bl.HANDOVER_MAX_S = 0.5
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append({"stall_old": True, "ahead": 20})
        reps = {k: await self.handover_done(k) for k in ("market", "public")}
        await self.until(lambda: self.col.book.state == "synced", 5, "book resynced")
        raw = await self.finish()
        for kind, rep in reps.items():
            self.assertEqual(rep["reason"], "max_time", kind)
            self.assertGreaterEqual(rep["t_switch"] - rep["t_first"], 0.5, kind)
        old = self.server.feeds["market"][0]
        self.assertEqual(self.backfills, [(A0 + old.pos, A0 + old.pos + 19)])
        self.assertIs(reps["market"]["agg_gap"], True)
        self.assertIs(reps["public"]["depth_continued"], False)
        self.assertEqual(self.col.book.resyncs, self.resyncs_before + 1)
        self.assertEqual(self.restarts, 0)
        ws, rest = ws_keys(raw, "aggTrade"), ws_keys(raw, "aggTrade", src="rest")
        self.assertEqual(sorted(ws + rest), list(range(ws[0], ws[-1] + 1)))
        for s in SUFFIXES["market"] + SUFFIXES["public"]:
            self.assert_increasing(raw, s)

    async def test_h05_new_batches_depth_differently(self):
        """H5: NEW batches depth ids at odd boundaries and starts 20 ticks behind: duplicates dropped by u, the
        book resyncs once through on_event, nothing crashes."""
        await self.start(kinds=("public",))
        self.server.plans["public"].append({"behind": 20, "depth_batch": (2, 1)})
        rep = await self.handover_done("public")
        await self.until(lambda: self.col.book.state == "synced", 5, "book resynced")
        raw = await self.finish()
        new = self.server.feeds["public"][1]
        self.assertEqual(rep["dropped"]["depth@100ms"], self.expected_dropped(new, rep, "depth@100ms"))
        self.assertGreater(rep["dropped"]["depth@100ms"], 10)
        self.assertIs(rep["depth_continued"], False)
        self.assertEqual(self.col.book.resyncs, self.resyncs_before + 1)
        self.assertEqual(self.restarts, 0)
        self.assert_increasing(raw, "depth@100ms")
        self.assertTrue(any(k % 2 for k in ws_keys(raw, "depth@100ms")), "NEW's batching was recorded")
        self.assert_exactly_once(raw, ["bookTicker"])

    async def test_h06_new_refused_then_retry(self):
        """H6: the first NEW is refused (HTTP 503): OLD keeps running, the retry after HANDOVER_RETRY_S succeeds."""
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append({"refuse": True})
        reps = {k: await self.handover_done(k) for k in ("market", "public")}
        raw = await self.finish()
        for kind in ("market", "public"):
            (t1, refused1), (t2, refused2) = self.server.attempts[kind][1:3]
            self.assertEqual((refused1, refused2), (True, False), kind)
            self.assertGreaterEqual(t2 - t1, bl.HANDOVER_RETRY_S, kind)
            self.assertEqual(len(self.reports(kind)), 1, kind)
            self.assertEqual(self.server.attempts[kind][0][1], False)
        self.assertEqual([f["stage"] for f in self.col.handover_failures], ["connect", "connect"])
        self.assertEqual(self.stdout.getvalue().count("nove spojeni se neotevrelo"), 2)
        self.assert_exactly_once(raw, SUFFIXES["market"] + SUFFIXES["public"])
        self.assertEqual((self.col.book.resyncs, self.restarts, self.backfills), (self.resyncs_before, 0, []))
        self.assertIs(reps["public"]["depth_continued"], True)

    async def test_h07_new_reader_fails_before_switch(self):
        """H7: OLD lags 0.5 s, so the switch waits; NEW drops after 5 messages: handover aborted, its buffer
        dropped, OLD continues, the retry succeeds."""
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append({"abort_after": 5, "on_open": lambda old, new: setattr(old, "delay", 0.5)})
        reps = {k: await self.handover_done(k) for k in ("market", "public")}
        raw = await self.finish()
        fails = {f["kind"]: f for f in self.col.handover_failures}
        for kind in ("market", "public"):
            self.assertEqual(fails[kind]["stage"], "read")
            t_fail, t_retry = self.server.attempts[kind][1][0], self.server.attempts[kind][2][0]
            self.assertGreaterEqual(t_retry - t_fail, bl.HANDOVER_RETRY_S, kind)
            self.assertEqual(reps[kind]["reason"], "caught_up", kind)
            self.assertEqual(len(self.server.feeds[kind]), 3)
        self.assertIn("spadlo pred prepnutim", self.stdout.getvalue())
        self.assert_exactly_once(raw, SUFFIXES["market"] + SUFFIXES["public"])
        self.assertEqual((self.col.book.resyncs, self.restarts, self.backfills), (self.resyncs_before, 0, []))

    async def test_h08_force_order(self):
        """H8: forceOrder pairs (same E, different side) every 5 ticks; NEW replays 30 ticks: each liquidation is
        recorded once and both events of a pair are kept."""
        await self.start(kinds=("market",), liq_every=5)
        self.server.plans["market"].append({"behind": 30})
        rep = await self.handover_done("market")
        raw = await self.finish()
        new = self.server.feeds["market"][1]
        self.assertEqual(rep["dropped"]["forceOrder"], self.expected_dropped(new, rep, "forceOrder"))
        self.assertGreaterEqual(rep["dropped"]["forceOrder"], 10)
        self.assert_exactly_once(raw, ["forceOrder", "aggTrade", "markPrice@1s"])
        per_e = collections.Counter(k[0] for k in ws_keys(raw, "forceOrder"))
        self.assertTrue(per_e and set(per_e.values()) == {2}, "both liquidations with the same E are kept")
        after = [k for k in ws_keys(raw, "forceOrder") if k[0] > rep["old_last"][f"{SYM}@forceOrder"][0]]
        self.assertGreaterEqual(len(after), 2, "pairs after the switch came through NEW")

    async def test_h09_book_ticker_parsed_only_in_handover(self):
        """H9: bookTicker duplicates are dropped using the last raw text's u, while loads() never sees a
        bookTicker outside the handover window."""
        real_loads, calls = bl.loads, []

        def counting_loads(s):
            if "@bookTicker" in s[:48]:
                calls.append(time.monotonic())
            return real_loads(s)
        self.enterContext(mock.patch.object(bl, "loads", counting_loads))
        await self.start(kinds=("public",))
        t0 = time.monotonic()
        self.server.plans["public"].append({"behind": 30})
        rep = await self.handover_done("public")
        await asyncio.sleep(0.6)
        raw = await self.finish(settle=0)
        self.assertGreater(len(calls), 0)
        self.assertEqual([c for c in calls if c < rep["t_start"]], [], "bookTicker parsed before the handover")
        self.assertEqual([c for c in calls if c > rep["t_filter_end"]], [], "bookTicker parsed after the filter")
        self.assertLess(t0, rep["t_start"])
        normal = [x for x in raw if x["stream"] == f"{SYM}@bookTicker" and x["recv_ms"] < rep["switch_ms"] - 500]
        self.assertGreater(len(normal), 50, "bookTicker flowed in normal operation before the handover")
        new = self.server.feeds["public"][1]
        self.assertEqual(rep["dropped"]["bookTicker"], self.expected_dropped(new, rep, "bookTicker"))
        self.assertGreaterEqual(rep["dropped"]["bookTicker"], 25)
        self.assert_exactly_once(raw, ["bookTicker", "depth@100ms"])

    async def test_h10_stop_during_handover(self):
        """H10: stop while market's NEW buffers (OLD lags 1 s) and public's NEW is still opening: the tasks
        return, both connections of each endpoint are closed, no unhandled exception, no task left pending."""
        bl.HANDOVER_MAX_S = 5.0
        await self.start()
        self.server.plans["market"].append({"on_open": lambda old, new: setattr(old, "delay", 1.0)})
        self.server.plans["public"].append({"slow_open": 1.5})
        await self.until(lambda: len(self.server.feeds["market"]) == 2 and len(self.server.feeds["market"][1].sent) > 10
                         and len(self.server.attempts["public"]) == 2, 5, "handovers in progress")
        t = time.monotonic()
        await self.finish(settle=0)                       # checks: tasks returned, no loop error, no pending task
        self.assertLess(time.monotonic() - t, 2.0)
        self.assertEqual(list(self.col.handovers), [])
        for f in self.server.feeds["market"] + self.server.feeds["public"]:
            await asyncio.wait_for(f.closed.wait(), 2)
        self.assertEqual(len(self.server.feeds["public"]), 1, "public NEW never opened")

    async def test_h11_reconnect_after_error_unchanged(self):
        """H11: the server drops public's connection: today's path (backoff 1 s, reconnect, book.restart())."""
        bl.RECONNECT_AFTER_S = 1000
        await self.start()
        await asyncio.sleep(0.2)
        t_drop = time.monotonic()
        self.server.feeds["public"][0].abort()
        await self.until(lambda: len(self.server.feeds["public"]) == 2, 5, "public reconnected")
        await self.until(lambda: self.col.book.state == "synced", 5, "book synced again")
        raw = await self.finish(error_path=True)
        self.assertGreaterEqual(self.server.attempts["public"][1][0] - t_drop, 0.9)
        self.assertEqual(self.restarts, 1)
        self.assertEqual(self.col.book.resyncs, self.resyncs_before + 1)
        self.assertEqual(list(self.col.handovers), [])
        self.assertIn("spojeni public spadlo (ConnectionClosedError), zkousim znovu za 1 s", self.stdout.getvalue())
        self.assertEqual(len(self.server.feeds["market"]), 1)
        self.assert_exactly_once(raw, SUFFIXES["market"])
        resumed = [k for s, k in self.server.feeds["public"][1].sent if s == "bookTicker"]
        self.assertIn(resumed[0], ws_keys(raw, "bookTicker"), "recording resumed on the new connection")

    async def test_h12_backwards_aggtrade_after_filter(self):
        """H12: a backwards ws aggTrade is dropped inside HANDOVER_FILTER_S and recorded as today after it."""
        await self.start(kinds=("market",))
        self.server.plans["market"].append({})
        await self.until(lambda: self.reports("market"), 8, "switch")
        new = self.server.feeds["market"][1]
        early = self.server.ticks[new.pos - 50]["agg"]
        new.inject(early[0])
        rep = await self.handover_done("market")
        late = self.server.ticks[new.pos - 40]["agg"]
        new.inject(late[0])
        raw = await self.finish()
        agg = collections.Counter(ws_keys(raw, "aggTrade"))
        self.assertEqual(agg[early[2]], 1, "inside the filter window the backwards aggTrade is dropped")
        self.assertEqual(agg[late[2]], 2, "after the filter window it is recorded as today")
        self.assertGreaterEqual(rep["dropped"]["aggTrade"], 1)

    async def test_h13_buffer_cap_switches_at_once(self):
        """H13: OLD stalls, NEW continues exactly where OLD stopped but sends its backlog in one burst after
        0.3 s: the buffer cap (20) switches at once, long before HANDOVER_MAX_S, and nothing is lost."""
        bl.HANDOVER_BUFFER_MAX = 20
        bl.HANDOVER_MAX_S = 3.0
        await self.start()
        for kind in ("market", "public"):
            self.server.plans[kind].append({"stall_old": True, "ahead": 0, "hold": 0.3})
        reps = {k: await self.handover_done(k) for k in ("market", "public")}
        raw = await self.finish()
        for kind, rep in reps.items():
            self.assertEqual(rep["reason"], "buffer_full", kind)
            self.assertEqual(rep["buffered"], 20, kind)
            self.assertLess(rep["t_switch"] - rep["t_first"], 0.2, kind)
        self.assert_exactly_once(raw, SUFFIXES["market"] + SUFFIXES["public"])
        self.assertIs(reps["public"]["depth_continued"], True)
        self.assertIs(reps["market"]["agg_gap"], False)
        self.assertEqual((self.col.book.resyncs, self.restarts, self.backfills), (self.resyncs_before, 0, []))


if __name__ == "__main__":
    unittest.main()
