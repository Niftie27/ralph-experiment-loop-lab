import csv
import tempfile
import unittest
from pathlib import Path

import build_eval_input as bei


FIELDS = [
    "alert_id",
    "source_id",
    "version",
    "utc_time",
    "symbol",
    "side",
    "mark_logged",
    "sl_sent",
    "tp1_sent",
    "tp2_sent",
    "tp3_sent",
    "text_source",
    "status",
]


def write_csv(path, fieldnames, rows):
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


class BuildEvalInputTests(unittest.TestCase):
    def test_fills_missing_prices_and_excludes_unpaired_exports(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            ledger = root / "ledger.csv"
            export = root / "export.csv"
            output = root / "out.csv"
            write_csv(
                ledger,
                FIELDS,
                [
                    {
                        "alert_id": "a1",
                        "source_id": "sw-btc-82k",
                        "version": "v",
                        "utc_time": "2026-01-01T00:00:00Z",
                        "symbol": "BTCUSDT",
                        "side": "SHORT",
                        "mark_logged": "100",
                        "sl_sent": "",
                        "tp1_sent": "",
                        "tp2_sent": "",
                        "tp3_sent": "",
                        "text_source": "none",
                        "status": "sent",
                    }
                ],
            )
            write_csv(
                export,
                ["alert_id", "sl", "tp1", "tp2", "tp3", "match_status"],
                [
                    {"alert_id": "a1", "sl": "102", "tp1": "99", "tp2": "98", "tp3": "97", "match_status": "paired"},
                    {"alert_id": "", "sl": "1", "tp1": "1", "tp2": "1", "tp3": "1", "match_status": "unpaired_export"},
                ],
            )
            args = type("Args", (), {"ledger": ledger, "alert_texts_export": export, "output": output})
            bei.run(args)
            with output.open() as f:
                rows = list(csv.DictReader(f))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["sl_sent"], "102")
        self.assertEqual(rows[0]["tp3_sent"], "97")
        self.assertEqual(rows[0]["text_source"], "telegram_export")

    def test_stops_on_existing_value_disagreement(self):
        row = {
            "alert_id": "a1",
            "sl_sent": "102.1",
            "tp1_sent": "99",
            "tp2_sent": "98",
            "tp3_sent": "97",
            "text_source": "cache",
        }
        export_rows = {"a1": {"sl": "102", "tp1": "99", "tp2": "98", "tp3": "97"}}
        with self.assertRaisesRegex(ValueError, "disagreement"):
            bei.fill_row(row, export_rows)


if __name__ == "__main__":
    unittest.main()
