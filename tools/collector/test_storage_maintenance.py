#!/usr/bin/env python3
import gzip
import csv
import hashlib
import os
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
        os.makedirs(data)
        os.makedirs(os.path.join(repo, "data-checks"))
        raw = os.path.join(data, "raw_BTCUSDT_2026-10-01T00Z.jsonl.gz")
        with gzip.open(raw, "wb") as f:
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
        with open(os.path.join(repo, "data-checks", "archive-verified.csv"), "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["symbol", "hour", "raw_sha256", "remote_sha256", "status"])
            writer.writeheader()
            raw_sha = file_sha(raw)
            writer.writerow(
                {
                    "symbol": "BTCUSDT",
                    "hour": "2026-10-01T00Z",
                    "raw_sha256": raw_sha,
                    "remote_sha256": raw_sha,
                    "status": "PASS",
                }
            )
        return data, repo, raw, tape, book

    def test_retention_requires_data_check_h(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, raw, _tape, _book = self.make_retention_fixture(root)
            os.remove(os.path.join(repo, "data-checks", "2026-10-01.csv"))
            status = storage_maintenance.retention_status(data, repo, "BTCUSDT", raw)
            self.assertIn("missing_data_check_h", status["reasons"])

    def test_retention_requires_data_check_h_plus_1(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, raw, _tape, _book = self.make_retention_fixture(root)
            row = storage_maintenance.read_data_check(repo, "BTCUSDT", "2026-10-01T00Z")
            write_csv(os.path.join(repo, "data-checks", "2026-10-01.csv"), [row])
            status = storage_maintenance.retention_status(data, repo, "BTCUSDT", raw)
            self.assertIn("missing_data_check_h_plus_1", status["reasons"])

    def test_retention_requires_matching_tape_sha(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, raw, tape, _book = self.make_retention_fixture(root)
            with gzip.open(tape, "wb") as f:
                f.write(b"changed\n")
            status = storage_maintenance.retention_status(data, repo, "BTCUSDT", raw)
            self.assertIn("tape_sha_mismatch", status["reasons"])

    def test_retention_requires_valid_book(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, raw, _tape, book = self.make_retention_fixture(root)
            with open(book, "wb") as f:
                f.write(b"not-gzip")
            status = storage_maintenance.retention_status(data, repo, "BTCUSDT", raw)
            self.assertIn("book_compression_invalid", status["reasons"])

    def test_retention_requires_storagebox_archive_verification(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, raw, _tape, _book = self.make_retention_fixture(root)
            os.remove(os.path.join(repo, "data-checks", "archive-verified.csv"))
            status = storage_maintenance.retention_status(data, repo, "BTCUSDT", raw)
            self.assertIn("missing_storagebox_archive_verification", status["reasons"])

    def test_retention_accepts_all_conditions(self):
        with tempfile.TemporaryDirectory() as root:
            data, repo, raw, _tape, _book = self.make_retention_fixture(root)
            status = storage_maintenance.retention_status(data, repo, "BTCUSDT", raw)
            self.assertTrue(status["ok"])


if __name__ == "__main__":
    unittest.main()
