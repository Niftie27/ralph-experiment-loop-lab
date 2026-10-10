#!/usr/bin/env python3
import gzip
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import storage_maintenance


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


if __name__ == "__main__":
    unittest.main()
