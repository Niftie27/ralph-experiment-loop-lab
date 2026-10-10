#!/usr/bin/env python3
import csv
import gzip
import json
import os
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


if __name__ == "__main__":
    unittest.main()
