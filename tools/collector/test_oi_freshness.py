#!/usr/bin/env python3
import contextlib
import copy
import gzip
import io
import json
import lzma
import os
import re
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import oi_freshness as oi


def timestamp(text):
    return int(datetime.fromisoformat(text).timestamp() * 1000)


def record(now, symbol="BTCUSDT", age=8):
    return {"recv_ms": now - age * 1000, "src": "rest",
            "stream": f"{symbol.lower()}@openInterest",
            "data": {"openInterest": "123.45", "symbol": symbol, "time": now - 1000}}


def encode(rows):
    return b"".join(json.dumps(row).encode() + b"\n" for row in rows)


class FreshnessTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.now = timestamp("2026-11-11T12:30:00+00:00")
        self.state = self.root / "state.json"
        self.marker = self.root / "failed"
        self.log = self.root / "calls.jsonl"
        self.fake = self.root / "openclaw"
        self.fake.write_text(
            f"#!{sys.executable}\n"
            "import json, os, sys\n"
            "with open(os.environ['FAKE_LOG'], 'a') as f:\n"
            "    f.write(json.dumps(sys.argv[1:]) + '\\n')\n"
            "print(os.environ['FAKE_LOG'])\n"
            "print(os.environ['FAKE_LOG'], file=sys.stderr)\n"
            "sys.exit(int(os.environ.get('FAKE_EXIT', '0')))\n")
        self.fake.chmod(0o700)
        self.env = mock.patch.dict(os.environ, {
            "OI_TG_TARGET": "test-target", "FAKE_LOG": str(self.log), "FAKE_EXIT": "0"})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.directories = {}
        for symbol in ("BTCUSDT", "ETHUSDT"):
            self.directories[symbol] = self.root / symbol
            self.directories[symbol].mkdir()

    def raw(self, rows=None, *, symbol="BTCUSDT", hour_offset=0, suffix=".gz",
            payload=None, now=None):
        now = self.now if now is None else now
        hour = datetime.fromtimestamp(now / 1000, timezone.utc) + timedelta(hours=hour_offset)
        path = self.directories[symbol] / f"raw_{symbol}_{hour:%Y-%m-%dT%HZ}.jsonl{suffix}"
        payload = encode(rows or []) if payload is None else payload
        if suffix == ".gz":
            payload = gzip.compress(payload)
        elif suffix == ".xz":
            payload = lzma.compress(payload)
        path.write_bytes(payload)
        os.utime(path, ns=((now - 4000) * 1000000,) * 2)
        return path

    def arguments(self, *, now=None, send=False, symbols=("BTCUSDT",), failure=False):
        args = ["--state", str(self.state), "--marker", str(self.marker),
                "--openclaw-bin", str(self.fake), "--now-ms", str(self.now if now is None else now)]
        if failure:
            args.append("--notify-failure")
        else:
            for symbol in symbols:
                args.extend(["--symbol", f"{symbol}={self.directories[symbol]}"])
        if send:
            args.append("--send")
        return args

    def run_main(self, **kwargs):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = oi.main(self.arguments(**kwargs))
        return code, out.getvalue()

    def cli(self, args):
        return subprocess.run([sys.executable, str(Path(oi.__file__)), *args],
                              capture_output=True, text=True, check=False)

    def calls(self):
        if not self.log.exists():
            return []
        return [json.loads(line) for line in self.log.read_text().splitlines()]

    def messages(self):
        return [call[call.index("--message") + 1] for call in self.calls()]

    def save_state(self, *, last=None, notified="OK", runs=None, day=None):
        state = oi.empty_state()
        state["symbols"]["BTCUSDT"] = {
            "last_valid_recv_ms": last, "notified_state": notified, "notified_ms": self.now - 1000}
        state["runs"] = runs or []
        state["last_heartbeat_day"] = day
        self.state.write_text(json.dumps(state))
        return state

    def test_t01_healthy_current_and_skip_previous(self):
        self.raw([record(self.now, age=30), record(self.now)])
        prev = self.raw([record(self.now, age=3600)], hour_offset=-1, suffix=".xz")
        code, out = self.run_main()
        self.assertEqual(code, 0)
        self.assertIn("state=OK age_s=8", out)
        self.assertIn("valid=2 invalid=0 read_errors=0", out)
        self.assertIn("raw_written_s=4", out)
        self.assertNotIn(prev.name, out)
        self.assertIn("RALPH OI started: BTCUSDT OK 8s", out)

    def test_t02_stale_boundary(self):
        for age, state in ((900, "OK"), (901, "STALE")):
            with self.subTest(age=age):
                self.raw([record(self.now, age=age)])
                self.assertIn(f"state={state} age_s={age}", self.run_main()[1])

    def test_t03_cut_gzip_and_partial_line(self):
        rows = [record(self.now, age=9), record(self.now)]
        path = self.raw(payload=encode(rows) + b'{"stream":"btcusdt@openInterest"')
        path.write_bytes(path.read_bytes()[:-8])
        code, out = self.run_main()
        self.assertEqual(code, 0)
        self.assertIn("state=OK age_s=8", out)
        self.assertIn("valid=2 invalid=0 read_errors=0", out)
        self.assertIn("truncated=1", out)
        # Also exercise an intact container with an unterminated final line.
        self.raw(payload=encode(rows) + b"bad @openInterest")
        self.assertIn("valid=2 invalid=0", self.run_main()[1])

    def test_t04_still_open_flushed_gzip(self):
        path = self.raw()
        with gzip.open(path, "at", encoding="utf-8") as writer:
            writer.write(encode([record(self.now), record(self.now, age=9)]).decode())
            writer.flush()
            code, out = self.run_main()
            self.assertEqual(code, 0)
            self.assertIn("valid=2 invalid=0 read_errors=0", out)
            self.assertIn("truncated=1", out)

    def test_t05_two_gzip_members(self):
        path = self.raw([record(self.now, age=9)])
        with gzip.open(path, "ab") as writer:
            writer.write(encode([record(self.now)]))
        self.assertIn("valid=2 invalid=0 read_errors=0", self.run_main()[1])

    def test_t06_previous_xz_without_current_oi(self):
        self.now = timestamp("2026-11-11T12:10:00+00:00")
        self.raw(payload=b'{"stream":"btcusdt@aggTrade"}\n')
        self.raw([record(self.now, age=1200)], hour_offset=-1, suffix=".xz")
        out = self.run_main()[1]
        self.assertIn("state=STALE age_s=1200", out)
        self.assertIn("valid=1 invalid=0", out)
        self.assertIn(".jsonl.gz,raw_BTCUSDT_2026-11-11T11Z.jsonl.xz", out)

    def test_t07_previous_gzip(self):
        prev = self.raw([record(self.now, age=3600)], hour_offset=-1)
        out = self.run_main()[1]
        self.assertIn("state=STALE age_s=3600", out)
        self.assertIn(f"files={prev.name}", out)

    def test_t08_prefer_gzip_and_read_hour_once(self):
        path = self.raw([record(self.now, age=3600)], hour_offset=-1)
        xz = self.raw([record(self.now)] * 3, hour_offset=-1, suffix=".xz")
        self.raw([record(self.now)] * 5, hour_offset=-1, suffix="")
        out = self.run_main()[1]
        self.assertIn("valid=1 invalid=0", out)
        self.assertIn(f"files={path.name} truncated=0", out)
        self.assertNotIn(xz.name, out)

    def test_t09_saved_record_thirteen_days_old(self):
        self.save_state(last=self.now - 13 * oi.DAY_MS)
        out = self.run_main()[1]
        self.assertIn("state=STALE age_s=1123200", out)
        self.assertIn("OK->STALE 13d00h", out)
        self.assertIn("last 2026-10-29T12:30:00Z", out)

    def test_t10_no_raw_and_no_state(self):
        out = self.run_main()[1]
        self.assertIn("state=STALE age_s=none last=none", out)
        self.assertIn("last none, no raw file", out)

    def test_t11_thirteen_invalid_records(self):
        base = record(self.now)
        rows = []
        for key, value in (("src", "ws"), ("stream", "ETHUSDT@openInterest"),
                           ("recv_ms", self.now + 61000), ("recv_ms", True)):
            row = copy.deepcopy(base)
            row[key] = value
            rows.append(row)
        for key, value in (("symbol", "ETHUSDT"), ("openInterest", "NaN"),
                           ("openInterest", "inf"), ("openInterest", "0"),
                           ("openInterest", "-1"), ("openInterest", "abc"),
                           ("time", None), ("time", "123")):
            row = copy.deepcopy(base)
            if value is None:
                del row["data"][key]
            else:
                row["data"][key] = value
            rows.append(row)
        self.raw(payload=b"bad @openInterest\n" + encode(rows))
        out = self.run_main()[1]
        self.assertIn("state=STALE", out)
        self.assertIn("valid=0 invalid=13 read_errors=0", out)

    def test_record_validation_types_and_future_limit(self):
        base = record(self.now)
        self.assertIsNone(oi.valid_record(b'["@openInterest"]', "BTCUSDT", self.now))
        for key, value in (("recv_ms", 0), ("recv_ms", "1"), ("data", [])):
            row = copy.deepcopy(base)
            row[key] = value
            self.assertIsNone(oi.valid_record(json.dumps(row), "BTCUSDT", self.now))
        for value in (0, True, -1):
            row = copy.deepcopy(base)
            row["data"]["time"] = value
            self.assertIsNone(oi.valid_record(json.dumps(row), "BTCUSDT", self.now))
        base["recv_ms"] = self.now + 60000
        self.assertEqual(oi.valid_record(json.dumps(base), "BTCUSDT", self.now), self.now + 60000)

    def test_t12_out_of_order_and_state_max(self):
        self.raw([record(self.now, age=20), record(self.now), record(self.now, age=30)])
        self.assertIn("state=OK age_s=8", self.run_main()[1])
        self.save_state(last=self.now - 4000)
        self.assertIn("state=OK age_s=4", self.run_main()[1])

    def test_t13_transitions_send_once(self):
        symbols = ("BTCUSDT", "ETHUSDT")
        for symbol in symbols:
            self.raw([record(self.now, symbol)], symbol=symbol)
        self.assertEqual(self.run_main(send=True, symbols=symbols)[0], 0)
        self.assertEqual(len(self.calls()), 1)
        self.assertTrue(self.messages()[0].startswith("RALPH OI started: "))
        self.run_main(send=True, symbols=symbols)
        self.assertEqual(len(self.calls()), 1)
        self.raw([record(self.now, "ETHUSDT", age=4320)], symbol="ETHUSDT")
        # Saved freshness must age too; retain the stale hour as raw evidence.
        later = self.now + 4320000
        self.raw([record(later)], now=later)
        self.run_main(send=True, symbols=symbols, now=later)
        self.assertEqual(len(self.calls()), 2)
        self.assertIn("ETHUSDT OK->STALE 72m", self.messages()[1])
        self.run_main(send=True, symbols=symbols, now=later)
        self.assertEqual(len(self.calls()), 2)
        self.raw([record(later, "ETHUSDT")], symbol="ETHUSDT", now=later)
        self.run_main(send=True, symbols=symbols, now=later)
        self.assertEqual(len(self.calls()), 3)
        self.assertIn("ETHUSDT STALE->OK", self.messages()[2])
        self.assertEqual(self.calls()[0][:5], ["message", "send", "--channel", "telegram", "--target"])

    @unittest.skipIf(os.geteuid() == 0, "chmod 000 is ineffective when running as root")
    def test_t14_unreadable_file_other_symbol_ok(self):
        path = self.raw([record(self.now)])
        self.raw([record(self.now, "ETHUSDT")], symbol="ETHUSDT")
        path.chmod(0)
        self.addCleanup(path.chmod, 0o600)
        code, out = self.run_main(symbols=("BTCUSDT", "ETHUSDT"))
        self.assertEqual(code, 0)
        self.assertIn("OI BTCUSDT state=ERROR", out)
        self.assertIn(f"PermissionError {path.name}", out)
        self.assertIn("OI ETHUSDT state=OK", out)

    def test_permission_error_isolated_even_as_root(self):
        path = self.raw([record(self.now)])
        self.raw([record(self.now, "ETHUSDT")], symbol="ETHUSDT")
        original = oi.open_raw

        def open_or_fail(candidate):
            if candidate == path:
                raise PermissionError(str(path))
            return original(candidate)

        with mock.patch.object(oi, "open_raw", side_effect=open_or_fail):
            code, out = self.run_main(symbols=("BTCUSDT", "ETHUSDT"))
        self.assertEqual(code, 0)
        self.assertIn("OI BTCUSDT state=ERROR", out)
        self.assertIn(f"PermissionError {path.name}", out)
        self.assertIn("OI ETHUSDT state=OK", out)
        self.assertNotIn(str(self.root), out)

    def test_t15_send_failure_preserves_notifications_and_retries(self):
        before = self.save_state(last=self.now - oi.DAY_MS)
        self.raw([record(self.now, age=1000)])
        os.environ["FAKE_EXIT"] = "1"
        code, out = self.run_main(send=True)
        self.assertEqual(code, 3)
        state = json.loads(self.state.read_text())
        self.assertEqual(state["symbols"]["BTCUSDT"]["notified_state"], "OK")
        self.assertEqual(state["symbols"]["BTCUSDT"]["notified_ms"],
                         before["symbols"]["BTCUSDT"]["notified_ms"])
        self.assertEqual(state["symbols"]["BTCUSDT"]["last_valid_recv_ms"], self.now - 1000000)
        self.assertEqual(state["runs"], [self.now])
        self.assertIn("sent=0", out)
        os.environ["FAKE_EXIT"] = "0"
        self.assertEqual(self.run_main(send=True)[0], 0)
        self.assertEqual(len(self.calls()), 2)
        self.assertEqual(self.messages()[0], self.messages()[1])
        self.run_main(send=True)
        self.assertEqual(len(self.calls()), 2)

    def test_t16_daily_heartbeat_and_combined_change(self):
        first = timestamp("2026-11-11T07:30:00+00:00")
        self.raw([record(first)], now=first)
        self.run_main(send=True, now=first)
        self.assertEqual(len(self.calls()), 1)
        self.assertIn("RALPH OI started:", self.messages()[0])
        self.assertIn("\nRALPH OI daily: runs 1/24 in 24h | BTCUSDT OK 8s | invalid 0 | read_errors 0",
                      self.messages()[0])
        later = first + 15 * 60000
        self.raw([record(later)], now=later)
        self.run_main(send=True, now=later)
        self.assertEqual(len(self.calls()), 1)
        tomorrow = first + oi.DAY_MS
        self.run_main(send=True, now=tomorrow)
        self.assertEqual(len(self.calls()), 2)
        self.assertIn("RALPH OI change: BTCUSDT OK->STALE", self.messages()[1])
        self.assertIn("\nRALPH OI daily:", self.messages()[1])
        self.assertEqual(json.loads(self.state.read_text())["last_heartbeat_day"], "2026-11-12")

    def test_heartbeat_failure_retries_and_new_symbol_changes(self):
        now = timestamp("2026-11-11T07:30:00+00:00")
        self.save_state(last=now - 8000)
        os.environ["FAKE_EXIT"] = "1"
        self.assertEqual(self.run_main(send=True, now=now)[0], 3)
        self.assertIsNone(json.loads(self.state.read_text())["last_heartbeat_day"])
        os.environ["FAKE_EXIT"] = "0"
        self.run_main(send=True, now=now, symbols=("BTCUSDT", "ETHUSDT"))
        self.assertIn("ETHUSDT none->STALE", self.messages()[-1])
        self.assertIn("RALPH OI daily:", self.messages()[-1])

    def test_t17_prune_runs_and_include_current(self):
        self.save_state(runs=[self.now - oi.DAY_MS - 1, self.now - oi.DAY_MS,
                              self.now - oi.DAY_MS + 1, self.now - 3600000])
        self.run_main(send=True)
        self.assertEqual(json.loads(self.state.read_text())["runs"],
                         [self.now - oi.DAY_MS + 1, self.now - 3600000, self.now])

    def test_t18_vanished_gzip_rescanned_once(self):
        path = self.raw([record(self.now)])
        xz = self.raw([record(self.now, age=9)], suffix=".xz")
        original = oi.hour_candidates

        def listed_then_removed(*args):
            candidates = original(*args)
            path.unlink(missing_ok=True)
            return candidates

        with mock.patch.object(oi, "hour_candidates", side_effect=listed_then_removed) as hook:
            out = self.run_main()[1]
        self.assertEqual(hook.call_count, 2)
        self.assertIn("state=OK age_s=9", out)
        self.assertIn("valid=1 invalid=0", out)
        self.assertIn(f"files={xz.name}", out)

    def test_t19_dry_run_writes_and_deletes_nothing(self):
        self.raw([record(self.now)])
        self.marker.write_text(json.dumps({"first_failure": oi.iso_ms(self.now), "last_notice_ms": 0}))
        marker_bytes = self.marker.read_bytes()
        code, out = self.run_main()
        self.assertEqual(code, 0)
        self.assertFalse(self.state.exists())
        self.assertEqual(self.calls(), [])
        self.assertIn("WOULD_SEND: RALPH OI started:", out)
        self.assertIn("WOULD_SEND: RALPH OI check recovered", out)
        self.assertEqual(self.marker.read_bytes(), marker_bytes)
        self.save_state()
        state_bytes = self.state.read_bytes()
        self.run_main()
        self.assertEqual(self.state.read_bytes(), state_bytes)

    def test_vanish_during_read_does_not_double_count(self):
        path = self.raw([record(self.now)])
        xz = self.raw([record(self.now), record(self.now, age=9)], suffix=".xz")
        original = oi.open_raw

        def disappearing_lines():
            yield encode([record(self.now)])
            path.unlink()
            raise FileNotFoundError(str(path))

        @contextlib.contextmanager
        def open_or_vanish(candidate):
            if candidate == path:
                yield disappearing_lines()
            else:
                with original(candidate) as source:
                    yield source

        with mock.patch.object(oi, "open_raw", side_effect=open_or_vanish):
            out = self.run_main()[1]
        self.assertIn("state=OK age_s=8", out)
        self.assertIn("valid=2 invalid=0", out)
        self.assertIn(f"files={xz.name}", out)

    def test_read_error_keeps_records_and_raw_age(self):
        path = self.raw([record(self.now)], suffix="")

        def broken_lines():
            yield encode([record(self.now)])
            raise OSError(str(path))

        @contextlib.contextmanager
        def broken_source(candidate):
            yield broken_lines()

        with mock.patch.object(oi, "open_raw", side_effect=broken_source):
            code, out = self.run_main(send=True)
        self.assertEqual(code, 0)
        self.assertIn("state=ERROR age_s=8", out)
        self.assertIn("valid=1 invalid=0 read_errors=0", out)
        self.assertIn("raw_written_s=4", out)
        self.assertIn(f"OSError {path.name}", self.messages()[0])
        self.assertEqual(json.loads(self.state.read_text())["symbols"]["BTCUSDT"]["last_valid_recv_ms"],
                         self.now - 8000)
        self.assertNotIn(str(self.root), out)
        self.assertNotIn(str(self.root), self.messages()[0])

    def test_t20_missing_target_is_config_error(self):
        del os.environ["OI_TG_TARGET"]
        for kwargs in ({"send": True}, {"failure": True}):
            with self.subTest(kwargs=kwargs):
                result = self.cli(self.arguments(**kwargs))
                self.assertEqual(result.returncode, 2)
                self.assertFalse(self.state.exists())
                self.assertFalse(self.marker.exists())
                self.assertEqual(self.calls(), [])

    def test_invalid_symbol_config(self):
        for symbol in ("BTCUSDT", "btcusdt=data", "BTCUSDT=", "../BTC=data"):
            args = self.arguments() + ["--symbol", symbol]
            self.assertEqual(self.cli(args).returncode, 2)
        self.assertNotIn("--now-ms", self.cli(["--help"]).stdout)

    def test_t21_failure_notice_throttle_and_failed_retry(self):
        self.assertEqual(self.run_main(failure=True)[0], 0)
        first = json.loads(self.marker.read_text())
        self.assertEqual(first, {"first_failure": oi.iso_ms(self.now), "last_notice_ms": self.now})
        self.assertEqual(len(self.calls()), 1)
        self.assertEqual(self.messages()[0],
                         f"RALPH OI check FAILED at {oi.iso_ms(self.now)}. "
                         "See journalctl --user -u ralph-oi-freshness -n 50")
        self.run_main(failure=True, now=self.now + 6 * 3600000 - 1)
        self.assertEqual(len(self.calls()), 1)
        self.run_main(failure=True, now=self.now + 6 * 3600000)
        self.assertEqual(len(self.calls()), 2)
        self.assertEqual(json.loads(self.marker.read_text())["first_failure"], first["first_failure"])
        before = self.marker.read_bytes()
        os.environ["FAKE_EXIT"] = "1"
        self.assertEqual(self.run_main(failure=True, now=self.now + 12 * 3600000)[0], 3)
        self.assertEqual(self.marker.read_bytes(), before)

    def test_first_failure_send_failure_still_creates_marker(self):
        os.environ["FAKE_EXIT"] = "1"
        self.assertEqual(self.run_main(failure=True)[0], 3)
        first = json.loads(self.marker.read_text())
        self.assertEqual(first["last_notice_ms"], 0)
        os.environ["FAKE_EXIT"] = "0"
        self.assertEqual(self.run_main(failure=True, now=self.now + 1000)[0], 0)
        self.assertEqual(len(self.calls()), 2)
        self.assertEqual(json.loads(self.marker.read_text())["first_failure"], first["first_failure"])

    def test_t22_recovery_success_and_failure(self):
        self.raw([record(self.now)])
        self.marker.write_text(json.dumps({"first_failure": oi.iso_ms(self.now - 1000),
                                          "last_notice_ms": self.now - 1000}))
        before = self.marker.read_bytes()
        os.environ["FAKE_EXIT"] = "1"
        self.assertEqual(self.run_main(send=True)[0], 3)
        self.assertEqual(self.marker.read_bytes(), before)
        self.assertIsNone(json.loads(self.state.read_text())["symbols"]["BTCUSDT"]["notified_state"])
        os.environ["FAKE_EXIT"] = "0"
        self.assertEqual(self.run_main(send=True)[0], 0)
        self.assertFalse(self.marker.exists())
        self.assertIn("RALPH OI check recovered (first failure 2026-11-11T12:29:59Z)", self.messages()[-1])

    def test_t23_invalid_state_unchanged(self):
        for content in (b"{invalid", b"[]", b'{"version": 2}'):
            with self.subTest(content=content):
                self.state.write_bytes(content)
                result = self.cli(self.arguments(send=True))
                self.assertEqual(result.returncode, 1)
                self.assertIn("Traceback", result.stderr)
                self.assertEqual(self.state.read_bytes(), content)
                self.assertEqual(self.calls(), [])

    def test_t24_corrupt_gzip_retains_records_and_empty_is_error(self):
        # A corrupt second gzip member follows a complete first member.
        broken = bytearray(gzip.compress(b"@openInterest\n"))
        broken[10] = 0xff  # reserved DEFLATE block type, inside the gzip container
        path = self.raw([record(self.now)])
        path.write_bytes(path.read_bytes() + broken)
        out = self.run_main()[1]
        self.assertIn("state=OK age_s=8", out)
        self.assertIn("valid=1 invalid=0 read_errors=1", out)
        path.write_bytes(broken)
        out = self.run_main()[1]
        self.assertIn("state=ERROR", out)
        self.assertIn("valid=0 invalid=0 read_errors=1", out)
        self.assertIn(f"error {path.name}", out)
        path.write_bytes(b"not gzip")
        self.assertIn(f"BadGzipFile {path.name}", self.run_main()[1])

    def test_corrupt_xz_and_plain_jsonl(self):
        path = self.raw(suffix=".xz")
        path.write_bytes(b"not xz")
        self.assertIn(f"LZMAError {path.name}", self.run_main()[1])
        path.unlink()
        plain = self.raw([record(self.now)], suffix="")
        out = self.run_main()[1]
        self.assertIn("state=OK age_s=8", out)
        self.assertIn(plain.name, out)

    def test_t25_age_format_table(self):
        for age, expected in ((None, "none"), (0, "0s"), (119, "119s"), (120, "2m"),
                              (7199, "119m"), (7200, "2h00m"), (172799, "47h59m"),
                              (172800, "2d00h")):
            with self.subTest(age=age):
                self.assertEqual(oi.format_age(age), expected)

    def test_t26_no_tmp_left_success_or_failed_replace(self):
        self.raw([record(self.now)])
        self.run_main(send=True)
        self.assertEqual(list(self.root.rglob("*.tmp")), [])
        before = self.state.read_bytes()
        with mock.patch.object(oi.os, "replace", side_effect=OSError("replace failed")):
            with self.assertRaises(OSError):
                self.run_main(send=True)
        self.assertEqual(self.state.read_bytes(), before)
        self.assertEqual(list(self.root.rglob("*.tmp")), [])

    def test_t27_private_paths_not_in_stdout_messages_or_sources(self):
        self.raw([record(self.now)])
        code, out = self.run_main(send=True)
        failure_code, failure_out = self.run_main(failure=True)
        recovery_code, recovery_out = self.run_main(send=True)
        self.assertEqual((code, failure_code, recovery_code), (0, 0, 0))
        for text in [out, failure_out, recovery_out, *self.messages()]:
            self.assertTrue(text.isascii())
            for private in (str(self.root), os.path.expanduser("~")):
                self.assertNotIn(private, text)
        folder = Path(__file__).resolve().parent
        for name in ("oi_freshness.py", "test_oi_freshness.py", "ralph-oi-freshness.service",
                     "ralph-oi-freshness.timer", "ralph-oi-freshness-failure.service"):
            source = (folder / name).read_text()
            self.assertIsNone(re.search("telegram:" + r"[0-9]", source), name)
            self.assertIsNone(re.search(r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b", source), name)
            for prefix in ("/" + "home" + "/", "/" + "root"):
                self.assertNotIn(prefix, source, name)


if __name__ == "__main__":
    unittest.main()
