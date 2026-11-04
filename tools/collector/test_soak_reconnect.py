#!/usr/bin/env python3
"""Tests of soak_reconnect.py: the guards, the clean stop, and a short soak run with several handovers against the
local fake Binance (WebSocket from test_reconnect_handover.py, REST from a local HTTP server). Nothing leaves the
machine.

Run:  python3 -m unittest discover -s tools/collector -p "test_soak_reconnect.py" -v      (websockets==17.2)
"""
import asyncio
import collections
import contextlib
import io
import json
import os
import shutil
import signal
import sys
import tempfile
import threading
import time
import types
import unittest
import urllib.parse
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import test_handover_adversarial as adv        # noqa: E402  (fake Binance, exactly-once checks)
import soak_reconnect as soak                   # noqa: E402

SYM, ALL = adv.SYM, adv.ALL


def run_main(argv, **kw):
    """soak.main in this process; (exit code, stdout, stderr)."""
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        try:
            code = soak.main(argv, **kw)
        except SystemExit as e:
            code = e.code
    return code, out.getvalue(), err.getvalue()


class GuardTest(unittest.TestCase):
    """Refusals happen before anything is started or created."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="soak_guard_")
        self.addCleanup(shutil.rmtree, self.tmp, True)
        self.home = os.path.join(self.tmp, "home")
        os.makedirs(os.path.join(self.home, "data", "binance"))
        self.enterContext(mock.patch.dict(os.environ, {"HOME": self.home, "SOAK_FORBIDDEN": ""}))
        self.started = []
        self.enterContext(mock.patch.object(soak, "load_collector", lambda: self.started.append(1) or self.fail("started")))

    def refused(self, argv, why, **kw):
        code, out, err = run_main(argv, **kw)
        self.assertEqual(code, 2, f"{argv}: {err}")
        self.assertIn(why, err)
        self.assertEqual(self.started, [])
        return err

    def argv(self, out, *extra):
        return ["--symbol", "ethusdt", "--out", out, "--duration-s", "600", *extra]

    def test_out_not_empty_or_not_a_directory(self):
        full = os.path.join(self.tmp, "full")
        os.makedirs(full)
        open(os.path.join(full, "raw_x.jsonl.gz"), "w").close()
        self.refused(self.argv(full), "exists and is not empty")
        afile = os.path.join(self.tmp, "afile")
        open(afile, "w").close()
        self.refused(self.argv(afile), "exists and is not a directory")
        dangling = os.path.join(self.tmp, "dangling")
        os.symlink(os.path.join(self.tmp, "nowhere"), dangling)
        self.refused(self.argv(dangling), "exists and is not a directory")
        self.assertFalse(os.path.exists(os.path.join(self.tmp, "nowhere")))

    def test_out_is_or_is_inside_home_data(self):
        for out in ("~/data", os.path.join(self.home, "data"), "~/data/", "~/data/binance", "~/data/new/soak",
                    os.path.join(self.home, "x", "..", "data", "soak")):
            self.refused(self.argv(out), "which is ~/data or inside it")
        link = os.path.join(self.tmp, "link_to_data")
        os.symlink(os.path.join(self.home, "data"), link)
        self.refused(self.argv(os.path.join(link, "soak")), "which is ~/data or inside it")
        self.assertFalse(os.path.exists(os.path.join(self.home, "data", "new")))
        self.assertFalse(os.path.exists(os.path.join(self.home, "data", "soak")))

    def test_home_data_symlink_is_resolved(self):
        real = os.path.join(self.tmp, "srv_data")
        os.makedirs(real)
        shutil.rmtree(os.path.join(self.home, "data"))
        os.symlink(real, os.path.join(self.home, "data"))
        self.refused(self.argv(os.path.join(real, "soak")), "which is ~/data or inside it")

    def test_soak_forbidden(self):
        a, b = os.path.join(self.tmp, "live_a"), os.path.join(self.tmp, "live_b")
        os.makedirs(a)
        with mock.patch.dict(os.environ, {"SOAK_FORBIDDEN": f"{a}::{b}"}):
            self.refused(self.argv(a), f"SOAK_FORBIDDEN entry {a}")
            self.refused(self.argv(os.path.join(b, "deep", "soak")), f"SOAK_FORBIDDEN entry {b}")
            ok = soak.check_out(os.path.join(self.tmp, "live_a2"))      # same prefix, not inside
            self.assertEqual(ok, os.path.realpath(os.path.join(self.tmp, "live_a2")))
            self.assertEqual(soak.check_out(os.path.join(self.tmp, "soak_new")),
                             os.path.realpath(os.path.join(self.tmp, "soak_new")))

    def test_reconnect_and_duration_limits(self):
        new = os.path.join(self.tmp, "new")
        self.refused(self.argv(new, "--reconnect-after-s", "59"), "below the minimum 60")
        self.refused(self.argv(new, "--reconnect-after-s", "nan"), "below the minimum 60")
        self.refused(["--symbol", "ethusdt", "--out", new, "--duration-s", "14401"], "at most 14400")
        self.refused(["--symbol", "ethusdt", "--out", new, "--duration-s", "0"], "at most 14400")
        self.refused(["--symbol", "eth/usdt", "--out", new, "--duration-s", "60"], "is not 2-20 letters")
        self.assertFalse(os.path.exists(new))

    def test_cli_has_no_minimum_option_and_needs_required_args(self):
        new = os.path.join(self.tmp, "new")
        for argv in (self.argv(new, "--min-reconnect-s", "1"), ["--out", new, "--duration-s", "60"],
                     ["--symbol", "ethusdt", "--duration-s", "60"], ["--symbol", "ethusdt", "--out", new]):
            code, _, err = run_main(argv)
            self.assertEqual(code, 2, argv)
        self.assertEqual(self.started, [])


class WiringTest(unittest.TestCase):
    """What the wrapper hands the collector, with a stand-in collector (no network)."""

    def test_imports_the_pr9_collector_from_its_own_directory(self):
        bl = soak.load_collector()
        self.assertEqual(os.path.dirname(os.path.realpath(bl.__file__)), os.path.realpath(HERE))
        with mock.patch.dict(bl.__dict__):
            del bl.__dict__["Handover"]
            with self.assertRaisesRegex(soak.Refused, "no make-before-break handover"):
                soak.load_collector()

    def test_args_reconnect_and_handover_lines(self):
        tmp = tempfile.mkdtemp(prefix="soak_wiring_")
        self.addCleanup(shutil.rmtree, tmp, True)
        out = os.path.join(tmp, "out")
        seen = {}

        def fake_main():
            seen["argv"], seen["reconnect"] = list(sys.argv), fake.RECONNECT_AFTER_S
            seen["sigterm"] = signal.getsignal(signal.SIGTERM)
            print("pripojeno: market btcusdt@aggTrade", flush=True)
            print("predavani market: prepnuto 0.012 s po otevreni noveho spojeni (stare spojeni dohnalo nove), ...",
                  flush=True)
            print("predavani public: nove spojeni se neotevrelo (TimeoutError: ), stare bezi dal", flush=True)
            print("predavani public: prepnuto 0.020 s po otevreni noveho spojeni (plny buffer), ...", flush=True)
        fake = types.SimpleNamespace(RECONNECT_AFTER_S=85800, main=fake_main, __file__=os.path.join(HERE, "binance_live.py"))
        with mock.patch.object(soak, "load_collector", lambda: fake):
            t0 = datetime.now(timezone.utc)
            code, stdout, err = run_main(["--symbol", "ethusdt", "--out", out, "--duration-s", "30",
                                          "--reconnect-after-s", "60"])
        self.assertEqual(code, 0, err)
        self.assertEqual(seen["argv"][1:], ["--symbol", "ethusdt", "--all", "--quiet", "--out", os.path.realpath(out)])
        self.assertEqual(seen["reconnect"], 60.0)
        self.assertIs(seen["sigterm"], soak._early_term)
        self.assertNotIn("--features", " ".join(seen["argv"]))
        lines = [x for x in stdout.splitlines() if x.startswith("SOAK handover ")]
        self.assertEqual([x.split()[3] for x in lines], ["market", "public"])
        for x in lines:
            t = datetime.strptime(x.split()[2], "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=timezone.utc)
            self.assertLess(abs((t - t0).total_seconds()), 5)
        self.assertEqual(len([x for x in stdout.splitlines() if x.startswith("SOAK handover-failed")]), 1)
        self.assertIn("predavani market: prepnuto", stdout, "collector output passes through")
        self.assertIn("stopped early", stdout)
        self.assertIs(signal.getsignal(signal.SIGTERM), signal.SIG_DFL)


# ---------------------------------------------------------------------------------------------- live soak run

class RestFake:
    """Binance REST endpoints the collector uses with --all, served from the fake WebSocket server's state."""

    def __init__(self, ws):
        self.ws, self.calls = ws, collections.Counter()
        fake = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def do_GET(self):
                u = urllib.parse.urlparse(self.path)
                q = dict(urllib.parse.parse_qsl(u.query))
                fake.calls[u.path] += 1
                now = int(time.time() * 1000)
                if u.path == "/fapi/v1/exchangeInfo":
                    body = {"symbols": [{"symbol": "BTCUSDT", "filters": [{"filterType": "PRICE_FILTER", "tickSize": "0.10"}]}]}
                elif u.path == "/fapi/v1/depth":
                    body = {"lastUpdateId": fake.ws.depth_id, "E": now, "T": now,
                            "bids": [["79990.0", "1.000"]], "asks": [["80010.0", "1.000"]]}
                elif u.path == "/fapi/v1/aggTrades":
                    a = int(q["fromId"])
                    body = [fake.ws.aggs[i] for i in range(a, a + int(q.get("limit", 500))) if i in fake.ws.aggs]
                elif u.path == "/fapi/v1/openInterest":
                    body = {"symbol": "BTCUSDT", "openInterest": "1234.500", "time": now}
                else:
                    self.send_error(404)
                    return
                data = json.dumps(body).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

        self.httpd = ThreadingHTTPServer(("localhost", 0), Handler)
        self.port = self.httpd.server_address[1]
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()

    def close(self):
        self.httpd.shutdown()
        self.httpd.server_close()


class SoakRunTest(unittest.IsolatedAsyncioTestCase):

    async def test_short_soak_three_plus_handovers_zero_loss_clean_stop(self):
        """A 10 s soak (reconnect after 1.5 s, minimum lowered through the test-only argument) as a subprocess:
        >= 3 'SOAK handover' lines per endpoint matching the collector's own reports, exit 0 through the normal
        shutdown ('ulozeno, konec'), files flushed to the stop, and every aggTrade, depth, markPrice, forceOrder and
        bookTicker exactly once over all handovers, depth chain intact, one depth snapshot, no REST backfill."""
        self.server = adv.AdvFake(liq_every=7)
        await self.server.start()
        self.addAsyncCleanup(self.server.close)
        rest = RestFake(self.server)
        self.addCleanup(rest.close)
        tmp = tempfile.mkdtemp(prefix="soak_run_")
        self.addCleanup(shutil.rmtree, tmp, True)
        out = os.path.join(tmp, "out")
        code = ("import sys; sys.path.insert(0, %r); import soak_reconnect; "
                "sys.exit(soak_reconnect.main(sys.argv[1:], min_reconnect_s=0.5))" % HERE)
        env = dict(os.environ, HOME=os.path.join(tmp, "home"), SOAK_FORBIDDEN="")
        proc = await asyncio.create_subprocess_exec(
            sys.executable, "-c", code, "--symbol", SYM, "--out", out, "--reconnect-after-s", "1.5",
            "--duration-s", "10", "--ws-base", f"ws://localhost:{self.server.port}",
            "--rest-base", f"http://localhost:{rest.port}", stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT, env=env)
        try:
            stdout, _ = await asyncio.wait_for(proc.communicate(), 60)
        finally:
            if proc.returncode is None:
                proc.kill()
                await proc.wait()
        log = stdout.decode()
        lines = log.splitlines()
        self.assertEqual(proc.returncode, 0, log[-3000:])
        self.assertIn("ulozeno, konec", log)
        start = next(x for x in lines if x.startswith("SOAK start"))
        self.assertIn(f"args=--symbol {SYM} --all --quiet --out {os.path.realpath(out)}", start)
        self.assertNotIn("--features", start)
        stop = next(x for x in lines if x.startswith("SOAK stop"))
        t_stop = datetime.strptime(stop.split()[2], "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=timezone.utc)
        handovers = collections.Counter(x.split()[3] for x in lines if x.startswith("SOAK handover "))
        reports = collections.Counter(x.split()[1].rstrip(":") for x in lines if x.startswith("predavani ")
                                      and ": prepnuto " in x)
        sys.__stderr__.write(f"\nsoak run: handovers {dict(handovers)}, REST calls {dict(rest.calls)}\n")
        self.assertEqual(handovers, reports)
        self.assertGreaterEqual(min(handovers["market"], handovers["public"]), 3, handovers)
        for x in lines:
            if x.startswith("SOAK handover "):
                t = datetime.strptime(x.split()[2], "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=timezone.utc)
                self.assertLessEqual(abs((t - t_stop).total_seconds()), 12)
        self.assertNotRegex(log, r"spojeni (market|public) spadlo|nove spojeni se neotevrelo|spadlo pred prepnutim")
        for kind in ("market", "public"):
            self.assertEqual(len(self.server.attempts[kind]), 1 + handovers[kind] + 0, kind)
        raw = adv.read_raw(out)
        self.assertFalse(adv.once_problems(self.server, raw, ALL), adv.once_problems(self.server, raw, ALL))
        self.assertEqual(adv.depth_breaks(raw), [])
        self.assertEqual((rest.calls["/fapi/v1/depth"], rest.calls["/fapi/v1/aggTrades"]), (1, 0), dict(rest.calls))
        self.assertGreater(rest.calls["/fapi/v1/openInterest"], 0)
        last_ms = max(x["recv_ms"] for x in raw if x["src"] == "ws")
        self.assertLess(t_stop.timestamp() * 1000 - last_ms, 1000, "raw not flushed up to the stop")
        tape = [n for n in os.listdir(out) if n.startswith("tape_")]
        self.assertTrue(tape)
        ids = []
        for n in sorted(tape):
            with open(os.path.join(out, n), encoding="utf-8") as f:
                next(f)
                part = [int(line.split(";")[7]) for line in f]
            self.assertEqual(part, sorted(part), f"{n} not finalized")
            ids += part
        self.assertEqual(sorted(ids), sorted(adv.ws_keys(raw, "aggTrade")))
        self.assertFalse([n for n in os.listdir(out) if n.endswith(".tmp")])


if __name__ == "__main__":
    unittest.main()
