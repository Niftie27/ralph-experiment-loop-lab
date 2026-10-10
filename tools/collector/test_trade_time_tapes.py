#!/usr/bin/env python3
import gzip
import json
import os
import sys
import tempfile
import types
import unittest
from contextlib import redirect_stdout
from io import StringIO

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.modules.setdefault("websockets", types.SimpleNamespace())

import binance_live
import rebuild_from_raw
import verify_hour
from symbol_settings import SymbolSettings
from trade_time_tapes import load_tape_trades


def write_raw(path, rows):
    with gzip.open(path, "wt", encoding="utf-8") as f:
        for recv_ms, trade in rows:
            f.write(json.dumps({"recv_ms": recv_ms, "stream": "btcusdt@aggTrade", "data": trade}) + "\n")


class TradeTimeTapeBoundaryTest(unittest.TestCase):
    def test_verify_and_rebuild_use_trade_time_across_raw_receive_hour_boundary(self):
        settings = SymbolSettings("BTCUSDT", tick_size=0.1, price_decimals=1)
        h21 = "2026-10-08T21Z"
        h22 = "2026-10-08T22Z"
        trade_in_21 = {"a": 100, "T": 1791496799900, "p": "81669.5", "q": "0.003", "m": True}
        trade_22 = {"a": 101, "T": 1791496800100, "p": "81670.0", "q": "0.002", "m": False}

        with tempfile.TemporaryDirectory() as data_dir:
            write_raw(os.path.join(data_dir, f"raw_BTCUSDT_{h21}.jsonl.gz"), [])
            write_raw(
                os.path.join(data_dir, f"raw_BTCUSDT_{h22}.jsonl.gz"),
                [(1791496800050, trade_in_21), (1791496800150, trade_22)],
            )
            rec = binance_live.Recorder(data_dir, "BTCUSDT", settings)
            rec._write_sorted(os.path.join(data_dir, f"tape_BTCUSDT_{h21}.csv"), {100: trade_in_21})

            out = StringIO()
            with redirect_stdout(out):
                verify_hour.main_args = None
                old_argv = sys.argv
                try:
                    sys.argv = [
                        "verify_hour.py",
                        "--raw",
                        os.path.join(data_dir, f"raw_BTCUSDT_{h21}.jsonl.gz"),
                        "--tape",
                        os.path.join(data_dir, f"tape_BTCUSDT_{h21}.csv"),
                    ]
                    verify_hour.main()
                finally:
                    sys.argv = old_argv
            self.assertIn("PASS tape_BTCUSDT_2026-10-08T21Z.csv ids=1", out.getvalue())

            os.remove(os.path.join(data_dir, f"tape_BTCUSDT_{h21}.csv"))
            moved = rebuild_from_raw.rebuild_tapes(data_dir, "BTCUSDT", settings, since="2026-10-08T21:00:00Z", until="2026-10-08T22:00:00Z")
            self.assertEqual(moved, [])
            rebuilt = load_tape_trades(os.path.join(data_dir, f"tape_BTCUSDT_{h21}.csv"))
            self.assertEqual(set(rebuilt), {100})


if __name__ == "__main__":
    unittest.main()
