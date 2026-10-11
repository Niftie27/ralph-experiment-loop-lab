#!/usr/bin/env python3
import contextlib
import csv
import gzip
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import data_checks


def write_raw(path, trades):
    with gzip.open(path, "wt", encoding="utf-8") as f:
        for trade in trades:
            f.write(json.dumps({"stream": "btcusdt@aggTrade", "data": trade}) + "\n")


def write_tape(path, trades):
    with open(path, "w", encoding="utf-8") as f:
        f.write("Time;Bids;;;;Ask;Delta;AggId;TradeTimeMs\n")
        for trade in sorted(trades, key=lambda item: (item["T"], item["a"])):
            if trade["m"]:
                f.write(f"0;{trade['p']};{trade['q']};;;0;0;{trade['a']};{trade['T']}\n")
            else:
                f.write(f"0;0;;;{trade['q']};{trade['p']};0;{trade['a']};{trade['T']}\n")


def run(cmd, cwd=None, check=True):
    return subprocess.run(cmd, cwd=cwd, text=True, capture_output=True, check=check)


def git(cmd, repo, check=True):
    return run(["git", "-C", repo, *cmd], check=check)


def config_identity(repo):
    git(["config", "user.name", "OpenClaw Codex"], repo)
    git(["config", "user.email", "openclaw-codex@local"], repo)


def make_remote_with_clone(root):
    remote = os.path.join(root, "remote.git")
    seed = os.path.join(root, "seed")
    clone = os.path.join(root, "clone")
    run(["git", "init", "--bare", remote])
    run(["git", "clone", remote, seed])
    git(["checkout", "-b", "main"], seed)
    config_identity(seed)
    os.makedirs(os.path.join(seed, "data-checks"))
    with open(os.path.join(seed, "README.md"), "w", encoding="utf-8") as f:
        f.write("seed\n")
    git(["add", "README.md", "data-checks"], seed)
    git(["commit", "-m", "seed"], seed)
    git(["push", "-u", "origin", "main"], seed)
    run(["git", "-C", remote, "symbolic-ref", "HEAD", "refs/heads/main"])
    run(["git", "clone", remote, clone])
    config_identity(clone)
    return remote, clone


def write_sample_data(root, trades):
    data = os.path.join(root, "data")
    os.makedirs(data)
    h0 = "2026-10-10T00Z"
    h1 = "2026-10-10T01Z"
    write_raw(os.path.join(data, f"raw_BTCUSDT_{h0}.jsonl.gz"), trades)
    write_raw(os.path.join(data, f"raw_BTCUSDT_{h1}.jsonl.gz"), [])
    write_tape(os.path.join(data, f"tape_BTCUSDT_{h0}.csv"), trades)
    return data


def run_main(repo, data, extra_args=None):
    original = data_checks.DEFAULT_SYMBOLS
    buf = io.StringIO()
    try:
        data_checks.DEFAULT_SYMBOLS = {"BTCUSDT": (data, os.path.join(os.path.dirname(data), "features"))}
        with contextlib.redirect_stdout(buf):
            data_checks.main(["--repo", repo, "--commit-push", "--symbol", "BTCUSDT", "--grace-min", "0", *(extra_args or [])])
    finally:
        data_checks.DEFAULT_SYMBOLS = original
    return buf.getvalue()


def csv_rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


class DataChecksTest(unittest.TestCase):
    def test_hour_requires_next_raw_and_writes_exact_columns(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            repo = os.path.join(root, "repo")
            os.makedirs(data)
            os.makedirs(repo)
            h0 = "2026-10-10T00Z"
            h1 = "2026-10-10T01Z"
            h2 = "2026-10-10T02Z"
            trade0 = {"a": 10, "T": 1791590400100, "p": "100.0", "q": "0.5", "m": True}
            late_h0 = {"a": 11, "T": 1791593999900, "p": "101.0", "q": "0.4", "m": False}
            trade1 = {"a": 12, "T": 1791594000100, "p": "102.0", "q": "0.3", "m": True}

            write_raw(os.path.join(data, f"raw_BTCUSDT_{h0}.jsonl.gz"), [trade0])
            write_raw(os.path.join(data, f"raw_BTCUSDT_{h1}.jsonl.gz"), [late_h0, trade1])
            write_tape(os.path.join(data, f"tape_BTCUSDT_{h0}.csv"), [trade0, late_h0])

            original = data_checks.DEFAULT_SYMBOLS
            try:
                data_checks.DEFAULT_SYMBOLS = {"BTCUSDT": (data, os.path.join(root, "features"))}
                rows = []
                for hour in data_checks.available_hours(data, "BTCUSDT"):
                    if data_checks.raw_path(data, "BTCUSDT", data_checks.shift_hour(hour, 1)):
                        rows.append(data_checks.check_hour(data, "BTCUSDT", hour))
                changed = data_checks.write_rows(repo, rows)
            finally:
                data_checks.DEFAULT_SYMBOLS = original

            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["verify"], "PASS")
            self.assertEqual(rows[0]["missing_id_count"], 0)
            self.assertEqual(rows[0]["first_aggTrade_id"], 10)
            self.assertEqual(rows[0]["last_aggTrade_id"], 11)
            self.assertEqual(changed, [os.path.join(repo, "data-checks", "2026-10-10.csv")])
            with open(changed[0], newline="", encoding="utf-8") as f:
                reader = csv.reader(f)
                self.assertEqual(next(reader), data_checks.COLUMNS)

    def test_check_symbol_skips_completed_hours(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            os.makedirs(data)
            h0 = "2026-10-10T00Z"
            h1 = "2026-10-10T01Z"
            trade0 = {"a": 10, "T": 1791590400100, "p": "100.0", "q": "0.5", "m": True}

            write_raw(os.path.join(data, f"raw_BTCUSDT_{h0}.jsonl.gz"), [trade0])
            write_raw(os.path.join(data, f"raw_BTCUSDT_{h1}.jsonl.gz"), [])
            write_tape(os.path.join(data, f"tape_BTCUSDT_{h0}.csv"), [trade0])

            rows = data_checks.check_symbol(data, "BTCUSDT", 0, completed={("BTCUSDT", h0)})
            self.assertEqual(rows, [])

    def test_raw_finished_waits_for_next_hour_grace(self):
        self.assertGreater(data_checks.hour_end_ts("2026-10-10T00Z"), 0)
        self.assertEqual(
            datetime.fromtimestamp(data_checks.hour_end_ts("2026-10-10T00Z"), tz=timezone.utc).hour,
            1,
        )

    def test_commit_push_discards_leftover_dirty_csv_and_pushes_data_checks_only(self):
        with tempfile.TemporaryDirectory() as root:
            _remote, clone = make_remote_with_clone(root)
            trade = {"a": 10, "T": 1791590400100, "p": "100.0", "q": "0.5", "m": True}
            data = write_sample_data(root, [trade])
            os.makedirs(os.path.join(clone, "data-checks"), exist_ok=True)
            dirty_path = os.path.join(clone, "data-checks", "2026-10-10.csv")
            with open(dirty_path, "w", encoding="utf-8") as f:
                f.write(",".join(data_checks.COLUMNS) + "\nBROKEN\n")
            git(["add", "data-checks/2026-10-10.csv"], clone)

            run_main(clone, data)

            self.assertEqual(git(["status", "--short"], clone).stdout, "")
            self.assertEqual(git(["rev-parse", "HEAD"], clone).stdout, git(["rev-parse", "origin/main"], clone).stdout)
            touched = git(["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"], clone).stdout.splitlines()
            self.assertEqual(touched, ["data-checks/2026-10-10.csv"])
            rows = csv_rows(os.path.join(clone, "data-checks", "2026-10-10.csv"))
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["verify"], "PASS")

    def test_commit_push_refuses_dirty_file_outside_data_checks(self):
        with tempfile.TemporaryDirectory() as root:
            _remote, clone = make_remote_with_clone(root)
            data = write_sample_data(root, [{"a": 10, "T": 1791590400100, "p": "100.0", "q": "0.5", "m": True}])
            before = git(["rev-parse", "origin/main"], clone).stdout
            with open(os.path.join(clone, "README.md"), "a", encoding="utf-8") as f:
                f.write("dirty\n")

            with self.assertRaises(SystemExit) as err:
                run_main(clone, data)

            self.assertEqual(err.exception.code, 1)
            self.assertEqual(git(["rev-parse", "origin/main"], clone).stdout, before)
            self.assertEqual(git(["rev-parse", "HEAD"], clone).stdout, before)

    def test_commit_push_no_staged_changes_when_nothing_to_commit(self):
        with tempfile.TemporaryDirectory() as root:
            _remote, clone = make_remote_with_clone(root)
            data = write_sample_data(root, [{"a": 10, "T": 1791590400100, "p": "100.0", "q": "0.5", "m": True}])
            run_main(clone, data)
            before = git(["rev-parse", "HEAD"], clone).stdout

            out = run_main(clone, data)

            self.assertIn("GIT no staged changes", out)
            self.assertEqual(git(["rev-parse", "HEAD"], clone).stdout, before)

    def test_remote_same_day_csv_is_synced_before_compute_and_union_is_written(self):
        with tempfile.TemporaryDirectory() as root:
            remote, clone = make_remote_with_clone(root)
            other = os.path.join(root, "other")
            run(["git", "clone", remote, other])
            config_identity(other)
            os.makedirs(os.path.join(other, "data-checks"), exist_ok=True)
            remote_row = {
                "symbol": "BTCUSDT",
                "hour": "2026-10-09T23Z",
                "first_aggTrade_id": "1",
                "last_aggTrade_id": "1",
                "trade_count": "1",
                "missing_id_count": "0",
                "tape_sha256": "abc",
                "verify": "PASS",
            }
            data_checks.write_day(os.path.join(other, "data-checks", "2026-10-10.csv"), {(remote_row["symbol"], remote_row["hour"]): remote_row})
            git(["add", "data-checks/2026-10-10.csv"], other)
            git(["commit", "-m", "other data check"], other)
            git(["push", "origin", "main"], other)
            data = write_sample_data(root, [{"a": 10, "T": 1791590400100, "p": "100.0", "q": "0.5", "m": True}])

            run_main(clone, data)

            with open(os.path.join(clone, "data-checks", "2026-10-10.csv"), encoding="utf-8") as f:
                content = f.read()
            self.assertNotIn("<<<<<<<", content)
            hours = {row["hour"] for row in csv_rows(os.path.join(clone, "data-checks", "2026-10-10.csv"))}
            self.assertEqual(hours, {"2026-10-09T23Z", "2026-10-10T00Z"})

    def test_push_rejected_by_remote_move_rebases_and_pushes_once_more(self):
        with tempfile.TemporaryDirectory() as root:
            remote, clone = make_remote_with_clone(root)
            data = write_sample_data(root, [{"a": 10, "T": 1791590400100, "p": "100.0", "q": "0.5", "m": True}])
            real_check_call = data_checks.subprocess.check_call

            def move_remote_once(cmd, *args, **kwargs):
                if cmd[:4] == ["git", "-C", clone, "commit"] and not hasattr(move_remote_once, "done"):
                    result = real_check_call(cmd, *args, **kwargs)
                    other = os.path.join(root, "mover")
                    run(["git", "clone", remote, other])
                    config_identity(other)
                    with open(os.path.join(other, "README.md"), "a", encoding="utf-8") as f:
                        f.write("remote move\n")
                    git(["add", "README.md"], other)
                    git(["commit", "-m", "remote move"], other)
                    git(["push", "origin", "main"], other)
                    move_remote_once.done = True
                    return result
                return real_check_call(cmd, *args, **kwargs)

            original = data_checks.subprocess.check_call
            try:
                data_checks.subprocess.check_call = move_remote_once
                run_main(clone, data)
            finally:
                data_checks.subprocess.check_call = original

            self.assertEqual(git(["rev-parse", "HEAD"], clone).stdout, git(["rev-parse", "origin/main"], clone).stdout)
            log = git(["log", "--oneline", "-2"], clone).stdout
            self.assertIn("Update hourly data checks", log)
            self.assertIn("remote move", log)

    def test_archive_verified_csv_is_ignored_and_unchanged(self):
        with tempfile.TemporaryDirectory() as root:
            _remote, clone = make_remote_with_clone(root)
            data = write_sample_data(root, [{"a": 10, "T": 1791590400100, "p": "100.0", "q": "0.5", "m": True}])
            archive = os.path.join(clone, "data-checks", "archive-verified.csv")
            os.makedirs(os.path.dirname(archive), exist_ok=True)
            content = "symbol,hour,raw_sha256,remote_sha256,status\nBTCUSDT,2026-10-10T00Z,a,b,PASS\n"
            with open(archive, "w", encoding="utf-8") as f:
                f.write(content)
            git(["add", "data-checks/archive-verified.csv"], clone)
            git(["commit", "-m", "archive marker"], clone)
            git(["push", "origin", "main"], clone)

            run_main(clone, data)

            with open(archive, encoding="utf-8") as f:
                self.assertEqual(f.read(), content)
            rows = csv_rows(os.path.join(clone, "data-checks", "2026-10-10.csv"))
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["hour"], "2026-10-10T00Z")


if __name__ == "__main__":
    unittest.main()
