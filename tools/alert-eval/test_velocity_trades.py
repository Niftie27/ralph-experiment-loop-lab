import datetime as dt
import math
import unittest
from array import array

import velocity_trades as vt


UTC = dt.timezone.utc


def ms(seconds):
    return int((dt.datetime(2026, 1, 1, tzinfo=UTC) + dt.timedelta(seconds=seconds)).timestamp() * 1000)


def alert(direction="DOWN", price=100.0):
    row = {
        "alert_id": "a1",
        "symbol": "BTC",
        "direction": direction,
        "plan_tradable": "y",
        "event_time_utc": "2026-01-01T00:00:00.000Z",
        "alert_price": str(price),
    }
    return vt.VelocityAlert(row)


def run(prices, times=None, direction="DOWN", mode="fade", delay=5, timeout=60, covered=3600):
    if times is None:
        times = [5 + i for i in range(len(prices))]
    arr_t = array("q", [ms(t) for t in times])
    arr_p = array("d", prices)
    covered_until = dt.datetime(2026, 1, 1, tzinfo=UTC) + dt.timedelta(seconds=covered)
    return vt.eval_variant(alert(direction), arr_t, arr_p, covered_until, mode, delay, timeout, "test", 0.0)


class VelocityTradesTests(unittest.TestCase):
    def test_long_tp(self):
        row = run([100, 100.2, 100.31], direction="DOWN", mode="fade")
        self.assertEqual(row["exit_reason"], "TP")
        self.assertEqual(row["exit_price"], "100.3")
        self.assertGreater(float(row["R"]), 0)

    def test_long_sl_uses_trade_price(self):
        row = run([100, 99.7, 99.4], direction="DOWN", mode="fade")
        self.assertEqual(row["exit_reason"], "SL")
        self.assertEqual(row["exit_price"], "99.4")
        self.assertLess(float(row["R"]), 0)

    def test_short_tp(self):
        row = run([100, 99.9, 99.69], direction="UP", mode="fade")
        self.assertEqual(row["exit_reason"], "TP")
        self.assertEqual(row["exit_price"], "99.7")

    def test_short_sl_uses_trade_price(self):
        row = run([100, 100.2, 100.7], direction="UP", mode="fade")
        self.assertEqual(row["exit_reason"], "SL")
        self.assertEqual(row["exit_price"], "100.7")

    def test_timeout(self):
        row = run([100, 100.1, 100.2], times=[5, 20, 70], timeout=30, covered=100)
        self.assertEqual(row["exit_reason"], "timeout")
        self.assertEqual(row["exit_price"], "100.1")

    def test_delay_selects_first_trade_at_or_after_delay(self):
        row = run([100, 101, 101.5], times=[5, 29, 30], delay=30)
        self.assertEqual(row["entry_time"], "2026-01-01T00:00:30.000Z")
        self.assertEqual(row["entry_price"], "101.5")

    def test_entry_trade_never_exits(self):
        row = run([100], times=[5], timeout=30, covered=100)
        self.assertEqual(row["exit_reason"], "path_incomplete")
        self.assertEqual(row["R"], "")

    def test_no_entry(self):
        row = run([100], times=[4], delay=5)
        self.assertEqual(row["exit_reason"], "no_entry")

    def test_path_incomplete(self):
        row = run([100, 100.1], times=[5, 6], timeout=60, covered=10)
        self.assertEqual(row["exit_reason"], "path_incomplete")

    def test_metamorphic_mirrored_zero_cost(self):
        original_cost = vt.TAKER_COST
        try:
            vt.TAKER_COST = 0.0
            base_prices = [100, 100.1, 100.2, 100.31]
            long_row = run(base_prices, direction="DOWN", mode="fade")
            mirrored = [200 - p for p in base_prices]
            short_row = run(mirrored, direction="UP", mode="fade")
        finally:
            vt.TAKER_COST = original_cost
        self.assertEqual(long_row["exit_reason"], short_row["exit_reason"])
        self.assertEqual(long_row["exit_time"], short_row["exit_time"])
        self.assertTrue(math.isclose(float(long_row["R"]), float(short_row["R"]), rel_tol=1e-9))


if __name__ == "__main__":
    unittest.main()
