import datetime as dt
import csv
import gzip
import math
import tempfile
import unittest
import zipfile
from pathlib import Path

import shadow_trades as st


UTC = dt.timezone.utc


def t(seconds):
    return dt.datetime(2026, 1, 1, tzinfo=UTC) + dt.timedelta(seconds=seconds)


def alert(mark=100.0, sl=102.0, tps=(99.0, 98.0, 97.0)):
    return st.Alert("a1", "src", "v", t(0), "BTCUSDT", mark, sl, tps)


def tr(seconds, price, order=0):
    return st.Trade(t(seconds), price, order)


def run(trades, exit_mode="TP1-only", tp_mode="as_sent", timeout=3600, covered=4000, mark=100, tps=(99, 98, 97)):
    times, prices = st.arrays_from_trades(trades)
    return st.eval_single(alert(mark=mark, tps=tps), times, prices, 5, timeout, exit_mode, tp_mode, "test", t(covered))


class ShadowTradeTests(unittest.TestCase):
    def test_sl_first(self):
        row = run([tr(5, 100), tr(6, 102.2), tr(7, 98)])
        self.assertEqual(row["exit_reason"], "SL")
        self.assertLess(float(row["R"]), 0)

    def test_tp_first(self):
        row = run([tr(5, 100), tr(6, 99), tr(7, 103)])
        self.assertEqual(row["exit_reason"], "TP")
        self.assertGreater(float(row["R"]), 0)

    def test_timeout(self):
        row = run([tr(5, 100), tr(50, 100.5), tr(100, 100.25)], timeout=90, covered=200)
        self.assertEqual(row["exit_reason"], "timeout")
        self.assertEqual(row["exit_price"], "100.5")

    def test_no_fake_timeout_at_end_of_data(self):
        row = run([tr(5, 100), tr(50, 100.5)], timeout=3600, covered=100)
        self.assertEqual(row["exit_reason"], "path_incomplete")
        self.assertEqual(row["R"], "")

    def test_entry_trade_cannot_trigger_exit(self):
        row = run([tr(5, 99), tr(10, 100.5)], exit_mode="TP1-only")
        self.assertEqual(row["exit_reason"], "timeout")

    def test_tp_above_entry_as_sent_vs_corrected(self):
        trades = [tr(5, 100), tr(6, 100.5), tr(8, 99.0)]
        sent = run(trades, exit_mode="TP1-only", tp_mode="as_sent", mark=100, tps=(101, 98, 97))
        corrected = run(trades, exit_mode="TP1-only", tp_mode="corrected", mark=100, tps=(101, 98, 97))
        self.assertEqual(sent["exit_reason"], "TP")
        self.assertEqual(corrected["exit_reason"], "timeout")

    def test_entry_already_beyond_sl_skipped(self):
        row = run([tr(5, 103), tr(6, 99)])
        self.assertEqual(row["exit_reason"], "skipped_sl_before_entry")
        self.assertEqual(row["R"], "")

    def test_ladder_accounting(self):
        row = run([tr(5, 100), tr(6, 99), tr(7, 98), tr(8, 97)], exit_mode="ladder")
        expected = (
            st.trade_r(100, 99, 102) / 3
            + st.trade_r(100, 98, 102) / 3
            + st.trade_r(100, 97, 102) / 3
        )
        self.assertAlmostEqual(float(row["R"]), expected, places=7)

    def test_cost_math(self):
        r = st.trade_r(100, 99, 102)
        expected = (100 - 99 - (100 + 99) * 0.0007) / 2
        self.assertAlmostEqual(r, expected)

    def test_corrected_ladder_tp1_dropped_splits_halves(self):
        row = run(
            [tr(5, 100), tr(6, 99.5), tr(7, 98), tr(8, 97)],
            exit_mode="ladder",
            tp_mode="corrected",
            mark=100,
            tps=(101, 98, 97),
        )
        expected = st.trade_r(100, 98, 102) / 2 + st.trade_r(100, 97, 102) / 2
        self.assertEqual(row["dropped_tps"], "1")
        self.assertAlmostEqual(float(row["R"]), expected, places=7)

    def test_window_loader_zip_in_window_and_ordered(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            archive = root / "BTCUSDT-aggTrades-2026-01-01.zip"
            csv_name = "BTCUSDT-aggTrades-2026-01-01.csv"
            with zipfile.ZipFile(archive, "w") as z:
                z.writestr(
                    csv_name,
                    "agg_trade_id,price,quantity,first_trade_id,last_trade_id,transact_time,is_buyer_maker\n"
                    "1,101,1,1,1,1,false\n"
                    f"2,100,1,1,1,{int(t(1).timestamp()*1000)},false\n"
                    f"3,99,1,1,1,{int(t(10).timestamp()*1000)},false\n",
                )
            a = alert()
            window = st.load_window(
                "binance",
                a,
                root,
                root,
                {("BTCUSDT", dt.date(2026, 1, 1))},
                set(),
            )
            self.assertEqual(window.trades_count, 2)
            self.assertEqual(list(window.prices), [100.0, 99.0])
            self.assertEqual(window.order_violations, 0)

    def test_window_loader_gz_in_window_and_ordered(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            path = root / "BTCUSDT2026-01-01.csv.gz"
            with gzip.open(path, "wt", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["timestamp", "symbol", "side", "size", "price", "tickDirection", "trdMatchID", "grossValue", "homeNotional", "foreignNotional"])
                writer.writeheader()
                writer.writerow({"timestamp": "0", "price": "101"})
                writer.writerow({"timestamp": str(t(1).timestamp()), "price": "100"})
                writer.writerow({"timestamp": str(t(10).timestamp()), "price": "99"})
            a = alert()
            window = st.load_window("bybit", a, root, root, set(), set())
            self.assertEqual(window.trades_count, 2)
            self.assertEqual(list(window.prices), [100.0, 99.0])
            self.assertEqual(window.order_violations, 0)


if __name__ == "__main__":
    unittest.main()
