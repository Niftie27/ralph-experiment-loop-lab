import csv
import json
import tempfile
import unittest
from pathlib import Path

import export_velocity_alerts as eva


def write_jsonl(path: Path, records):
    with path.open("w") as f:
        for record in records:
            f.write(json.dumps(record) + "\n")


class ExportVelocityAlertsTests(unittest.TestCase):
    def test_exports_velocity_alert_with_review_and_ignores_wick(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            snapshot = root / "feedback.jsonl"
            output = root / "velocity.csv"
            pages = root / "pages"
            data_root = root / "data"
            (data_root / "bybit-public").mkdir(parents=True)
            pages.mkdir()
            write_jsonl(
                snapshot,
                [
                    {
                        "type": "alert_sent",
                        "alert": {
                            "id": "BTC-UP-1-abc",
                            "assetSymbol": "btcusdt",
                            "assetLabel": "BTC",
                            "direction": "UP",
                            "eventTime": 1000,
                            "price": 100.5,
                            "triggerKind": "VELOCITY",
                            "triggerLabel": "60s",
                            "triggerMovePct": 0.7,
                            "thresholdPct": 0.6,
                            "windowMs": 60000,
                            "volumeVelocityRatio": 2.5,
                            "fadePlan": {
                                "tradable": True,
                                "fadeDirection": "SHORT",
                                "takeProfitPct": 0.3,
                                "stopLossPct": 0.5,
                                "worstFillPrice": 100.5,
                            },
                            "source": "Binance live trade stream",
                        },
                    },
                    {
                        "type": "review_finalized",
                        "review": {"id": "BTC-UP-1-abc"},
                        "classification": {"verdict": "continuation"},
                    },
                    {
                        "type": "alert_sent",
                        "alert": {
                            "id": "BTC-UP-2-def",
                            "assetLabel": "BTC",
                            "direction": "UP",
                            "eventTime": 2000,
                            "price": 101,
                            "triggerKind": "WICK",
                        },
                    },
                ],
            )
            args = type(
                "Args",
                (),
                {
                    "snapshot": snapshot,
                    "output": output,
                    "pages_dir": pages,
                    "data_root": data_root,
                    "estimate_sizes": False,
                },
            )
            eva.run(args)
            with output.open() as f:
                rows = list(csv.DictReader(f))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["alert_id"], "BTC-UP-1-abc")
        self.assertEqual(rows[0]["review_finalized"], "y")
        self.assertEqual(rows[0]["verdict"], "continuation")
        self.assertEqual(rows[0]["fade_direction"], "SHORT")

    def test_stops_on_duplicate_velocity_alert_id(self):
        records = [
            {
                "type": "alert_sent",
                "alert": {
                    "id": "dup",
                    "assetLabel": "ETH",
                    "direction": "DOWN",
                    "eventTime": 1000,
                    "price": 10,
                    "triggerKind": "VELOCITY",
                    "fadePlan": {"tradable": False},
                },
            },
            {
                "type": "alert_sent",
                "alert": {
                    "id": "dup",
                    "assetLabel": "ETH",
                    "direction": "DOWN",
                    "eventTime": 2000,
                    "price": 11,
                    "triggerKind": "VELOCITY",
                    "fadePlan": {"tradable": False},
                },
            },
        ]
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            snapshot = root / "feedback.jsonl"
            write_jsonl(snapshot, records)
            args = type(
                "Args",
                (),
                {
                    "snapshot": snapshot,
                    "output": root / "out.csv",
                    "pages_dir": root,
                    "data_root": root,
                    "estimate_sizes": False,
                },
            )
            with self.assertRaisesRegex(ValueError, "duplicate alert_id"):
                eva.run(args)

    def test_stops_on_non_numeric_price(self):
        with self.assertRaisesRegex(ValueError, "non-numeric price"):
            eva.alert_to_row(
                {
                    "type": "alert_sent",
                    "alert": {
                        "id": "bad",
                        "assetLabel": "BTC",
                        "eventTime": 1,
                        "price": "100",
                        "triggerKind": "VELOCITY",
                        "fadePlan": {},
                    },
                },
                {},
            )


if __name__ == "__main__":
    unittest.main()
