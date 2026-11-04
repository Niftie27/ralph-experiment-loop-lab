#!/usr/bin/env python3
"""Tests of the fixes for the PR #9 review findings in binance_live.py (docs/reviews/pr9-fixes-2026-11-04.md):
the silence watchdog, a NEW that is never ready (F1), OLD's end without a ready NEW, and the stop of a connection
that is silent and waiting in recv().

Run:  python3 -m unittest discover -s tools/collector -p "test_handover_fixes.py" -v      (websockets==17.2)

Uses the fake Binance of test_reconnect_handover.py through test_handover_adversarial.py (local websockets server,
REST mocked). Nothing leaves the machine. New limits are lowered per test; the rest keeps the values of
test_reconnect_handover.HandoverTest.SETTINGS.
"""
import asyncio
import gzip
import json
import os
import re
import signal
import sys
import time
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import test_handover_adversarial as adv        # noqa: E402  (fake Binance and checks; also un-stubs websockets)
import binance_live as bl                       # noqa: E402

SYM, STREAMS, SUFFIXES, ALL = adv.SYM, adv.STREAMS, adv.SUFFIXES, adv.ALL
ws_keys, read_raw = adv.ws_keys, adv.read_raw
WATCHDOG = re.compile(r"^hlidac ticha (market|public): (\S+) bez zpravy ([\d.]+) s", re.M)


def drop_streams(feed, suffixes):
    """The server connection `feed` stops sending these streams from now on."""
    orig = feed.messages
    feed.messages = lambda tick: [m for m in orig(tick) if m[1] not in suffixes]


class FixBase(adv.AdvBase):
    """AdvBase (fake, checks) with the new limits at their production values unless a test lowers them."""

    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.enterContext(mock.patch.multiple(bl, SILENCE_MAX_S=60, HANDOVER_READY_MAX_S=30, WATCHDOG_TICK_S=1.0,
                                              STOP_GRACE_S=0.5, CLOSE_WAIT_S=1.0))

    def watchdog_lines(self):
        return WATCHDOG.findall(self.log())

    def lines(self, prefix):
        return [x for x in self.log().splitlines() if x.startswith(prefix)]

    def failures(self, kind=None):
        return [f for f in self.col.handover_failures if kind is None or f["kind"] == kind]

    async def closed_at(self, feed, timeout, what):
        await self.until(lambda: feed.closed.is_set(), timeout, what)
        return time.monotonic()

    def assert_trades_complete(self, raw):
        """Every aggTrade id once over ws and REST: a gap was refilled by the backfill."""
        ws, rest = ws_keys(raw, "aggTrade"), ws_keys(raw, "aggTrade", src="rest")
        self.assertEqual(sorted(ws + rest), list(range(ws[0], ws[-1] + 1)))


# ---------------------------------------------------------------------------------------------- silence watchdog

class WatchdogTest(FixBase):

    async def test_f01_silent_connection_reconnected(self):
        """The only market connection goes silent on every stream (the server still answers pings and close):
        one watchdog line naming the stream, the connection and the seconds, the connection is aborted within
        SILENCE_MAX_S plus a small margin, and today's error path reconnects; the aggTrade gap is refilled."""
        bl.SILENCE_MAX_S, bl.RECONNECT_AFTER_S = 1.0, 10_000
        await self.start(kinds=("market",), one_handover=False)
        await asyncio.sleep(0.3)
        old = self.server.feeds["market"][0]
        old.stall()
        t_stall = time.monotonic()
        t_abort = await self.closed_at(old, 3, "silent OLD aborted")
        await self.until(lambda: len(self.server.feeds["market"]) == 2, 3, "reconnected")
        t_again = self.server.attempts["market"][1][0]
        await self.until(lambda: self.backfills and len(self.backfill_done) == len(self.backfills), 5, "backfill")
        raw = await self.finish(error_path=True)
        found = self.watchdog_lines()
        self.assertEqual([x[:2] for x in found], [("market", f"{SYM}@markPrice@1s")], self.log())
        self.assertGreaterEqual(float(found[0][2]), bl.SILENCE_MAX_S)
        self.assertRegex(self.log(), r"na spojeni otevrenem pred [\d.]+ h, rusim ho a pripojuji znovu")
        self.assertGreater(t_abort - t_stall, bl.SILENCE_MAX_S - 0.15, "aborted before the stream was silent long")
        self.assertLess(t_abort - t_stall, bl.SILENCE_MAX_S + 0.3, "not within SILENCE_MAX_S plus a small margin")
        self.assertIn("spojeni market spadlo (ConnectionClosedError), zkousim znovu za 1 s", self.log())
        self.assertLess(t_again - t_abort, 1.0 + 0.5, "today's error path: backoff 1 s, then reconnect")
        self.assertEqual(len(self.backfills), 1)
        self.assert_trades_complete(raw)

    async def test_f02_book_ticker_stops_depth_continues(self):
        """public: bookTicker stops while depth@100ms keeps flowing on the same connection: the watchdog names
        bookTicker, aborts, and the reconnect restarts the book from a snapshot (today's path)."""
        bl.SILENCE_MAX_S, bl.RECONNECT_AFTER_S = 1.0, 10_000
        await self.start(kinds=("public",), one_handover=False)
        old = self.server.feeds["public"][0]
        drop_streams(old, {"bookTicker"})
        t0 = time.monotonic()
        depth_before = sum(1 for s, _ in old.sent if s == "depth@100ms")
        t_abort = await self.closed_at(old, 3, "OLD aborted")
        depth_during = sum(1 for s, _ in old.sent if s == "depth@100ms") - depth_before
        await self.until(lambda: len(self.server.feeds["public"]) == 2 and self.col.book.state == "synced", 5,
                         "reconnected, book synced")
        await self.finish(error_path=True)
        self.assertEqual([x[:2] for x in self.watchdog_lines()], [("public", f"{SYM}@bookTicker")], self.log())
        self.assertGreater(depth_during, 50, "depth kept flowing while bookTicker was silent")
        self.assertLess(t_abort - t0, bl.SILENCE_MAX_S + 0.3)
        self.assertEqual(self.restarts, 1, "today's reconnect path restarts the book")

    async def test_f03_force_order_silent_triggers_nothing(self):
        """forceOrder sends nothing at all (liquidations can be silent for hours) for 8 x SILENCE_MAX_S: no watchdog
        line, no reconnect."""
        bl.SILENCE_MAX_S, bl.RECONNECT_AFTER_S = 0.5, 10_000
        await self.start(kinds=("market",), one_handover=False)          # liq_every=0: no forceOrder at all
        await asyncio.sleep(8 * bl.SILENCE_MAX_S)
        raw = await self.finish()
        self.assertEqual(self.watchdog_lines(), [])
        self.assertEqual(len(self.server.attempts["market"]), 1)
        self.assertEqual(ws_keys(raw, "forceOrder"), [])
        self.assert_exactly_once(raw, ["aggTrade", "markPrice@1s"])

    async def test_f04_agg_trade_silent_mark_price_continues_triggers_nothing(self):
        """aggTrade stops while markPrice continues on the same connection for 8 x SILENCE_MAX_S: no watchdog line,
        no reconnect (trades can pause; REST refills a gap)."""
        bl.SILENCE_MAX_S, bl.RECONNECT_AFTER_S = 0.5, 10_000
        await self.start(kinds=("market",), one_handover=False)
        drop_streams(self.server.feeds["market"][0], {"aggTrade"})
        await asyncio.sleep(8 * bl.SILENCE_MAX_S)
        raw = await self.finish()
        self.assertEqual(self.watchdog_lines(), [])
        self.assertEqual(len(self.server.attempts["market"]), 1)
        self.assert_exactly_once(raw, ["markPrice@1s"])


# ---------------------------------------------------------------------------------------------- F1: NEW never ready

class SilentNewTest(FixBase):

    async def test_f06_silent_new_aborted_logged_retried_never_two(self):
        """Three NEWs in a row open and send nothing: each is aborted HANDOVER_READY_MAX_S after opening with one
        log line naming the missing streams, retried no sooner than HANDOVER_RETRY_S, never two NEWs at once; the
        fourth NEW is normal and switched to. OLD keeps the feed throughout."""
        bl.HANDOVER_READY_MAX_S, bl.HANDOVER_RETRY_S = 0.8, 1.0
        await self.start(kinds=("market",), one_handover=False)
        self.server.plans["market"].extend([{"hold": 3600}] * 3)
        most_open = 0

        def sample():
            nonlocal most_open
            most_open = max(most_open, sum(not f.closed.is_set() for f in self.server.feeds["market"]))
            return len(self.failures()) >= 3 and self.reports("market")
        await self.until(sample, 15, "3 aborts, then a switch")
        bl.RECONNECT_AFTER_S = 10_000
        rep = await self.handover_done("market")
        raw = await self.finish()
        self.assertEqual([f["stage"] for f in self.failures()], ["not_ready"] * 3)
        lines = self.lines("predavani market: nove spojeni neni pripravene")
        self.assertEqual(len(lines), 3, self.log())
        for x in lines:
            self.assertIn(f"chybi: {SYM}@aggTrade, {SYM}@markPrice@1s", x)
        t = self.attempt_times("market")
        self.assertEqual(len(t), 5, "OLD, 3 silent NEWs, the normal NEW")
        for a, b in zip(t[1:], t[2:]):
            self.assertGreaterEqual(b - a, bl.HANDOVER_READY_MAX_S + bl.HANDOVER_RETRY_S, "retry too early")
            self.assertLess(b - a, bl.HANDOVER_READY_MAX_S + bl.HANDOVER_RETRY_S + 0.6, "retry too late")
        self.assertLessEqual(most_open, 2, "two NEWs at once")
        self.assertEqual(rep["reason"], "caught_up")
        self.assertIs(rep["agg_gap"], False)
        self.assert_exactly_once(raw, SUFFIXES["market"])
        self.assertEqual(self.backfills, [])

    async def test_f07_old_closed_while_new_not_ready_reconnects_at_once(self):
        """A12's attack: NEW opens and sends nothing, then the server closes OLD with a close frame (as Binance's
        24 h cut may be). The silent NEW is never switched to: it is dropped, one line is logged, and the endpoint
        connects again at once through the normal path; the aggTrade gap is refilled from REST."""
        await self.start(kinds=("market",), one_handover=False)
        self.server.plans["market"].append({"hold": 3600})
        await self.until(lambda: len(self.server.feeds["market"]) == 2, 5, "NEW open")
        bl.RECONNECT_AFTER_S = 10_000
        await asyncio.sleep(0.3)
        old, new = self.server.feeds["market"]
        await old.ws.close()
        t_close, t_close_ms = time.monotonic(), int(time.time() * 1000)
        await self.until(lambda: len(self.server.feeds["market"]) == 3, 2, "reconnected")
        t_again = self.attempt_times("market")[2]
        await self.closed_at(new, 2, "silent NEW closed")
        await asyncio.sleep(1.0)
        raw = await self.finish()                 # a close frame takes the normal path, not the error path
        self.assertLess(t_again - t_close, 0.3, "not reconnected at once")
        self.assertEqual(list(self.col.handovers), [], "the silent NEW was switched to")
        lines = self.lines("predavani market: nove spojeni neni pripravene")
        self.assertEqual(len(lines), 1, self.log())
        self.assertIn("a stare skoncilo (ConnectionClosedOK", lines[0])
        self.assertIn("pripojuji znovu", lines[0])
        self.assertEqual([f["stage"] for f in self.failures()], ["old_ended"])
        after = [x for x in raw if x["stream"] == f"{SYM}@aggTrade" and x["recv_ms"] > t_close_ms + 300]
        self.assertGreater(len(after), 50)
        self.assert_trades_complete(raw)

    async def test_f08_old_aborted_while_new_not_ready_takes_error_path(self):
        """As F07, but OLD's TCP connection drops: the silent NEW is dropped and logged, and today's error path
        (backoff 1 s) reconnects."""
        await self.start(kinds=("market",), one_handover=False)
        self.server.plans["market"].append({"hold": 3600})
        await self.until(lambda: len(self.server.feeds["market"]) == 2, 5, "NEW open")
        bl.RECONNECT_AFTER_S = 10_000
        await asyncio.sleep(0.3)
        old, new = self.server.feeds["market"]
        old.abort()
        t_drop = time.monotonic()
        await self.until(lambda: len(self.server.feeds["market"]) == 3, 3, "reconnected")
        await self.closed_at(new, 2, "silent NEW closed")
        await self.until(lambda: self.backfills and len(self.backfill_done) == len(self.backfills), 5, "backfill")
        raw = await self.finish(error_path=True)
        self.assertLess(self.attempt_times("market")[2] - t_drop, 1.0 + 0.5)
        self.assertEqual(list(self.col.handovers), [])
        self.assertEqual(len(self.lines("predavani market: nove spojeni neni pripravene")), 1, self.log())
        self.assertIn("spojeni market spadlo (ConnectionClosedError), zkousim znovu za 1 s", self.log())
        self.assert_trades_complete(raw)


# ---------------------------------------------------------------------------------------------- stop

class StopTest(FixBase):

    async def test_f09_stop_during_silent_recv_ends_within_5_s(self):
        """Both endpoints silent and waiting in recv(), the server ignoring everything the client sends (its close
        too): setting stop ends run_endpoint within 5 s and the server sees the connections closed."""
        bl.RECONNECT_AFTER_S = 10_000
        await self.start(one_handover=False)
        await asyncio.sleep(0.2)
        for kind in ("market", "public"):
            feed = self.server.feeds[kind][0]
            feed.stall()
            feed.ignore_input = True
        await asyncio.sleep(0.5)
        t0 = time.monotonic()
        raw = await self.finish(settle=0)
        self.assertLess(time.monotonic() - t0, 5.0)
        for kind in ("market", "public"):
            await self.closed_at(self.server.feeds[kind][0], 1, f"{kind} closed")
            sent = [k for s, k in self.server.feeds[kind][0].sent if s == SUFFIXES[kind][0]]
            self.assertEqual(ws_keys(raw, SUFFIXES[kind][0]), sent, f"{kind}: everything received was recorded")

    async def test_f10_sigterm_during_silent_recv_through_main(self):
        """Collector.main() gets SIGTERM while both connections are silent and the server ignores their close:
        within 5 s every endpoint has ended (main() cancels them; then the rest of asyncio.run's teardown),
        'ulozeno, konec' is printed, the files are complete and readable, and the server sees every connection
        closed."""
        self.server = adv.AdvFake()
        await self.server.start()
        self.addAsyncCleanup(self.server.close)
        self.col = bl.Collector(self.args())
        loop = asyncio.get_running_loop()
        self.addCleanup(lambda: [loop.remove_signal_handler(s) for s in (signal.SIGINT, signal.SIGTERM)])
        bl.RECONNECT_AFTER_S = 10_000
        main = asyncio.create_task(self.col.main())
        self.tasks = {"main": main}
        await self.until(lambda: self.server.feeds["market"] and self.server.feeds["public"]
                         and self.col.book.state == "synced", 8, "connected")
        for kind in ("market", "public"):
            feed = self.server.feeds[kind][0]
            feed.stall()
            feed.ignore_input = True
        await asyncio.sleep(0.5)
        os.kill(os.getpid(), signal.SIGTERM)
        t0 = time.monotonic()
        await asyncio.wait_for(main, 5)
        left = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()
                and getattr(t.get_coro(), "__qualname__", "").startswith("Collector.")]
        for t in left:                                # what asyncio.run does after main() returns
            t.cancel()
        if left:
            await asyncio.wait(left, timeout=5)
        took = time.monotonic() - t0
        self.assertTrue(all(t.done() for t in left))
        self.assertLess(took, 5.0)
        for kind in ("market", "public"):
            await self.closed_at(self.server.feeds[kind][0], 1, f"{kind} closed")
        self.assertIn("ulozeno, konec", self.log())
        for name in os.listdir(self.out):
            self.assertFalse(name.endswith(".tmp"), name)
            if name.endswith(".gz"):
                with gzip.open(os.path.join(self.out, name), "rt", encoding="utf-8") as f:
                    for line in f:
                        json.loads(line)
        raw = read_raw(self.out)
        for kind in ("market", "public"):
            sent = [k for s, k in self.server.feeds[kind][0].sent if s == SUFFIXES[kind][0]]
            self.assertEqual(ws_keys(raw, SUFFIXES[kind][0]), sent, f"{kind}: flushed up to the silence")
        self.assertEqual(self.loop_errors, [])


if __name__ == "__main__":
    unittest.main()
