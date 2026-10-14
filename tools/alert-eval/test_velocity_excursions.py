import datetime as dt
import math
import unittest
from array import array

import velocity_excursions as ve


UTC = dt.timezone.utc


def ms(seconds):
    return int((dt.datetime(2026, 1, 1, tzinfo=UTC) + dt.timedelta(seconds=seconds)).timestamp() * 1000)


def alert(direction="UP"):
    return ve.VelocityAlert(
        {
            "alert_id": "a1",
            "symbol": "BTC",
            "direction": direction,
            "plan_tradable": "y",
            "event_time_utc": "2026-01-01T00:00:00.000Z",
            "alert_price": "100",
        }
    )


def row(prices, times=None, direction="UP", pre_prices=None, pre_times=None, coverage_ok=True, pre_covered=True):
    if times is None:
        times = [0 + i for i in range(len(prices))]
    if pre_prices is None:
        pre_prices = []
    if pre_times is None:
        pre_times = []
    return ve.build_excursion_row(
        alert(direction),
        array("q", [ms(t) for t in times]),
        array("d", prices),
        array("q", [ms(t) for t in pre_times]),
        array("d", pre_prices),
        coverage_ok,
        pre_covered,
    )


class VelocityExcursionsTests(unittest.TestCase):
    def test_up_values_by_hand(self):
        out = row([100, 101, 99], times=[0, 10, 30])
        self.assertEqual(out["p0"], "100")
        self.assertEqual(out["drift_10"], "100")
        self.assertEqual(out["mfe_10"], "100")
        self.assertEqual(out["mae_10"], "0")
        self.assertEqual(out["drift_30"], "-100")
        self.assertEqual(out["mfe_30"], "100")
        self.assertEqual(out["mae_30"], "-100")
        self.assertEqual(out["fav_ms_50"], "10000")
        self.assertEqual(out["adv_ms_50"], "30000")
        self.assertEqual(out["n_trades_30m"], "3")

    def test_down_mirror_matches_up(self):
        up = row([100, 101, 99], times=[0, 10, 30], direction="UP")
        down = row([100, 99, 101], times=[0, 10, 30], direction="DOWN")
        for field in ("drift_10", "mfe_10", "mae_10", "drift_30", "mfe_30", "mae_30", "fav_ms_50", "adv_ms_50"):
            self.assertEqual(up[field], down[field])

    def test_never_hit_thresholds_are_empty(self):
        out = row([100, 100.01, 99.99], times=[0, 10, 20])
        self.assertEqual(out["fav_ms_5"], "")
        self.assertEqual(out["adv_ms_5"], "")

    def test_horizon_boundary_is_inclusive(self):
        out = row([100, 101], times=[0, 10])
        self.assertEqual(out["drift_10"], "100")
        self.assertEqual(out["mfe_10"], "100")

    def test_uncovered_pre_window_is_empty(self):
        out = row(
            [100, 101],
            times=[0, 10],
            pre_prices=[98, 99, 100],
            pre_times=[-120, -60, -1],
            coverage_ok=False,
            pre_covered=False,
        )
        self.assertEqual(out["coverage_ok"], "n")
        self.assertEqual(out["pre_range_1m"], "")
        self.assertEqual(out["pre_range_5m"], "")
        self.assertEqual(out["pre_range_30m"], "")
        self.assertEqual(out["pre_rv_5m"], "")

    def test_pre_values_when_covered(self):
        out = row([100], times=[0], pre_prices=[98, 99, 100], pre_times=[-120, -60, -1])
        self.assertEqual(out["pre_range_1m"], "100")
        self.assertEqual(out["pre_range_5m"], "200")
        self.assertEqual(out["pre_range_30m"], "200")
        self.assertTrue(float(out["pre_rv_5m"]) > 0)


if __name__ == "__main__":
    unittest.main()
