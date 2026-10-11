#!/usr/bin/env python3
import gzip
import csv
import hashlib
import lzma
import os
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import storage_maintenance


def write_csv(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "symbol",
                "hour",
                "first_aggTrade_id",
                "last_aggTrade_id",
                "trade_count",
                "missing_id_count",
                "tape_sha256",
                "verify",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)


def file_sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def write_archive_state(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fields = [
        "verified_at_utc",
        "symbol",
        "hour",
        "kind",
        "remote_path",
        "size_bytes",
        "local_sha256",
        "remote_sha256",
        "status",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


class StorageMaintenanceTest(unittest.TestCase):
    def test_truncated_raw_logs_error_and_continues(self):
        with tempfile.TemporaryDirectory() as root:
            data = os.path.join(root, "data")
            features = os.path.join(root, "features")
            os.makedirs(data)
            os.makedirs(features)
            open(os.path.join(features, "events.jsonl"), "w", encoding="utf-8").close()

            bad_raw = os.path.join(data, "raw_BTCUSDT_2026-10-09T00Z.jsonl.gz")
            with open(bad_raw, "wb") as f:
                f.write(b"not-a-valid-gzip")

            good_raw = os.path.join(data, "raw_BTCUSDT_2026-10-09T01Z.jsonl.gz")
            with gzip.open(good_raw, "wb") as f:
                f.write(b'{"stream":"btcusdt@aggTrade","data":{"a":1}}\n')

            tape = os.path.join(data, "tape_BTCUSDT_2026-10-09T01Z.csv")
            with open(tape, "w", encoding="utf-8") as f:
                f.write("Time;Bids;;;;Ask;Delta;AggId;TradeTimeMs\n")

            old_argv = sys.argv
            out, err = StringIO(), StringIO()
            try:
                sys.argv = [
                    "storage_maintenance.py",
                    "--symbol",
                    "BTCUSDT",
                    "--data",
                    data,
                    "--features",
                    features,
                    "--apply",
                ]
                with redirect_stdout(out), redirect_stderr(err):
                    storage_maintenance.main()
            finally:
                sys.argv = old_argv

            self.assertIn("ERROR xz_raw compression failed", err.getvalue())
            self.assertTrue(os.path.exists(bad_raw))
            self.assertFalse(os.path.exists(bad_raw.removesuffix(".gz") + ".xz"))
            self.assertTrue(os.path.exists(good_raw.removesuffix(".gz") + ".xz"))
            self.assertFalse(os.path.exists(good_raw))
            self.assertTrue(os.path.exists(tape + ".gz"))
            self.assertFalse(os.path.exists(tape))

    def make_retention_fixture(self, root):
        data = os.path.join(root, "data")
        repo = os.path.join(root, "repo")
        archive_state = os.path.join(root, "state", "archive-files.csv")
        os.makedirs(data)
        os.makedirs(os.path.join(repo, "data-checks"))
        raw = os.path.join(data, "raw_BTCUSDT_2026-10-01T00Z.jsonl.xz")
        with lzma.open(raw, "wb") as f:
            f.write(b"raw\n")
        tape = os.path.join(data, "tape_BTCUSDT_2026-10-01T00Z.csv.gz")
        with gzip.open(tape, "wb") as f:
            f.write(b"tape\n")
        book = os.path.join(data, "book_BTCUSDT_2026-10-01T00Z.jsonl.gz")
        with gzip.open(book, "wb") as f:
            f.write(b"book\n")
        rows = [
            {
                "symbol": "BTCUSDT",
                "hour": "2026-10-01T00Z",
                "first_aggTrade_id": "1",
                "last_aggTrade_id": "1",
                "trade_count": "1",
                "missing_id_count": "0",
                "tape_sha256": storage_maintenance.sha_lines(tape),
                "verify": "PASS",
            },
            {
                "symbol": "BTCUSDT",
                "hour": "2026-10-01T01Z",
                "first_aggTrade_id": "2",
                "last_aggTrade_id": "2",
                "trade_count": "1",
                "missing_id_count": "0",
                "tape_sha256": "next",
                "verify": "PASS",
            },
        ]
        write_csv(os.path.join(repo, "data-checks", "2026-10-01.csv"), rows)
        raw_sha = file_sha(raw)
        write_archive_state(
            archive_state,
            [
                {
                    "verified_at_utc": "2026-10-11T00:00:00Z",
                    "symbol": "BTCUSDT",
                    "hour": "2026-10-01T00Z",
                    "kind": "raw",
                    "remote_path": "ralph/raw/BTCUSDT/2026-10-01/raw_BTCUSDT_2026-10-01T00Z.jsonl.xz",
                    "size_bytes": str(os.path.getsize(raw)),
                    "local_sha256": raw_sha,
                    "remote_sha256": raw_sha,
                    "status": "PASS",
                }
            ],
        )
        return data, repo, archive_state, raw, tape, book

    def test_retention_requires_data_check_h(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, archive_state, raw, _tape, _book = self.make_retention_fixture(root)
            os.remove(os.path.join(repo, "data-checks", "2026-10-01.csv"))
            status = storage_maintenance.retention_status(data, repo, archive_state, "BTCUSDT", raw)
            self.assertIn("missing_data_check_h", status["reasons"])

    def test_retention_requires_data_check_h_plus_1(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, archive_state, raw, _tape, _book = self.make_retention_fixture(root)
            row = storage_maintenance.read_data_check(repo, "BTCUSDT", "2026-10-01T00Z")
            write_csv(os.path.join(repo, "data-checks", "2026-10-01.csv"), [row])
            status = storage_maintenance.retention_status(data, repo, archive_state, "BTCUSDT", raw)
            self.assertIn("missing_data_check_h_plus_1", status["reasons"])

    def test_retention_requires_matching_tape_sha(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, archive_state, raw, tape, _book = self.make_retention_fixture(root)
            with gzip.open(tape, "wb") as f:
                f.write(b"changed\n")
            status = storage_maintenance.retention_status(data, repo, archive_state, "BTCUSDT", raw)
            self.assertIn("tape_sha_mismatch", status["reasons"])

    def test_retention_requires_valid_book(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, archive_state, raw, _tape, book = self.make_retention_fixture(root)
            with open(book, "wb") as f:
                f.write(b"not-gzip")
            status = storage_maintenance.retention_status(data, repo, archive_state, "BTCUSDT", raw)
            self.assertIn("book_compression_invalid", status["reasons"])

    def test_retention_requires_storagebox_archive_verification(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, archive_state, raw, _tape, _book = self.make_retention_fixture(root)
            os.remove(archive_state)
            status = storage_maintenance.retention_status(data, repo, archive_state, "BTCUSDT", raw)
            self.assertIn("missing_storagebox_archive_verification", status["reasons"])

    def test_retention_accepts_all_conditions(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, archive_state, raw, _tape, _book = self.make_retention_fixture(root)
            status = storage_maintenance.retention_status(data, repo, archive_state, "BTCUSDT", raw)
            self.assertTrue(status["ok"])

    def test_archive_row_sha_must_match_current_local_raw(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, archive_state, raw, _tape, _book = self.make_retention_fixture(root)
            with lzma.open(raw, "wb") as f:
                f.write(b"changed\n")
            status = storage_maintenance.retention_status(data, repo, archive_state, "BTCUSDT", raw)
            self.assertIn("bad_storagebox_archive_verification", status["reasons"])

    def test_delete_mode_remote_mismatch_keeps_file_and_exits_one(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, archive_state, raw, _tape, _book = self.make_retention_fixture(root)
            old_run = storage_maintenance.subprocess.run
            try:
                storage_maintenance.subprocess.run = lambda *a, **k: subprocess.CompletedProcess(a[0], 0, stdout="badsha  file\n", stderr="")
                old_argv = sys.argv
                sys.argv = [
                    "storage_maintenance.py",
                    "--symbol",
                    "BTCUSDT",
                    "--data",
                    data,
                    "--features",
                    os.path.join(root, "features"),
                    "--repo",
                    repo,
                    "--archive-state",
                    archive_state,
                    "--retention-days",
                    "0",
                    "--apply",
                    "--delete-raw",
                ]
                code = storage_maintenance.main()
            finally:
                sys.argv = old_argv
                storage_maintenance.subprocess.run = old_run
            self.assertEqual(code, 1)
            self.assertTrue(os.path.exists(raw))

    def test_delete_mode_ssh_error_keeps_file_and_exits_one(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, archive_state, raw, _tape, _book = self.make_retention_fixture(root)
            old_run = storage_maintenance.subprocess.run
            try:
                def fail_run(*_args, **_kwargs):
                    cmd = _args[0]
                    if cmd and cmd[0] == "ssh":
                        raise subprocess.CalledProcessError(255, ["ssh"], stderr="ssh failed")
                    return old_run(*_args, **_kwargs)
                storage_maintenance.subprocess.run = fail_run
                old_argv = sys.argv
                sys.argv = [
                    "storage_maintenance.py",
                    "--symbol",
                    "BTCUSDT",
                    "--data",
                    data,
                    "--features",
                    os.path.join(root, "features"),
                    "--repo",
                    repo,
                    "--archive-state",
                    archive_state,
                    "--retention-days",
                    "0",
                    "--apply",
                    "--delete-raw",
                ]
                code = storage_maintenance.main()
            finally:
                sys.argv = old_argv
                storage_maintenance.subprocess.run = old_run
            self.assertEqual(code, 1)
            self.assertTrue(os.path.exists(raw))

    def test_younger_than_retention_is_not_candidate(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, archive_state, raw, _tape, _book = self.make_retention_fixture(root)
            report = storage_maintenance.retention_report(data, repo, archive_state, "BTCUSDT", 365)
            row = next(item for item in report if item["path"] == raw)
            self.assertFalse(row["ok"])
            self.assertIn("not_older_than_retention_days", row["reasons"])

    def test_delete_mode_deletes_only_xz_raw_and_writes_deleted_row(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, archive_state, raw, _tape, _book = self.make_retention_fixture(root)
            raw_gz = os.path.join(data, "raw_BTCUSDT_2099-10-01T02Z.jsonl.gz")
            with gzip.open(raw_gz, "wb") as f:
                f.write(b"raw-gz\n")
            old_home = os.environ.get("HOME")
            old_run = storage_maintenance.subprocess.run
            try:
                os.environ["HOME"] = root
                storage_maintenance.subprocess.run = lambda *a, **k: subprocess.CompletedProcess(
                    a[0], 0, stdout=f"{file_sha(raw)}  remote\n", stderr=""
                )
                old_argv = sys.argv
                sys.argv = [
                    "storage_maintenance.py",
                    "--symbol",
                    "BTCUSDT",
                    "--data",
                    data,
                    "--features",
                    os.path.join(root, "features"),
                    "--repo",
                    repo,
                    "--archive-state",
                    archive_state,
                    "--retention-days",
                    "0",
                    "--apply",
                    "--delete-raw",
                ]
                code = storage_maintenance.main()
            finally:
                sys.argv = old_argv
                storage_maintenance.subprocess.run = old_run
                if old_home is None:
                    os.environ.pop("HOME", None)
                else:
                    os.environ["HOME"] = old_home
            self.assertEqual(code, 0)
            self.assertFalse(os.path.exists(raw))
            self.assertTrue(os.path.exists(raw_gz))
            with open(os.path.join(root, "ralph-state", "raw-deleted.csv"), newline="", encoding="utf-8") as f:
                deleted_rows = list(csv.DictReader(f))
            self.assertEqual(len(deleted_rows), 1)
            self.assertEqual(deleted_rows[0]["hour"], "2026-10-01T00Z")

    def test_repo_argument_selects_data_check_source(self):
        with tempfile.TemporaryDirectory() as root:
            data, good_repo, archive_state, raw, _tape, _book = self.make_retention_fixture(root)
            bad_repo = os.path.join(root, "bad-repo")
            os.makedirs(os.path.join(bad_repo, "data-checks"))
            self.assertFalse(storage_maintenance.retention_status(data, bad_repo, archive_state, "BTCUSDT", raw)["ok"])
            self.assertTrue(storage_maintenance.retention_status(data, good_repo, archive_state, "BTCUSDT", raw)["ok"])


if __name__ == "__main__":
    unittest.main()
