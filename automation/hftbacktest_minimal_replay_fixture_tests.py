#!/usr/bin/env python3
"""Deterministic fixtures for the research-only hftbacktest replay converter."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

import numpy as np


MODULE_PATH = Path(__file__).with_name("hftbacktest-minimal-replay-runtime-spike.py")
SPEC = importlib.util.spec_from_file_location("hftbacktest_minimal_replay_runtime_spike", MODULE_PATH)
assert SPEC and SPEC.loader
spike = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(spike)


def depth5(exchange_ts: int = 1_000, local_receive_ts: int = 1_001) -> dict:
    return {
        "ts": exchange_ts,
        "source": "binance",
        "type": "depth5",
        "symbol": "BTCUSDT",
        "exchangeTs": exchange_ts,
        "localReceiveTs": local_receive_ts,
        "raw": {
            "bids": [["100.00", "1.5"], ["99.99", "2.0"]],
            "asks": [["100.01", "1.25"], ["100.02", "2.5"]],
        },
    }


def book_ticker(exchange_ts: int = 1_002, local_receive_ts: int = 1_003) -> dict:
    return {
        "ts": exchange_ts,
        "source": "binance",
        "type": "book_ticker",
        "symbol": "BTCUSDT",
        "bid": 100.0,
        "ask": 100.01,
        "bidQty": 1.5,
        "askQty": 1.25,
        "exchangeTs": exchange_ts,
        "localReceiveTs": local_receive_ts,
    }


def trade(exchange_ts: int = 1_004, local_receive_ts: int = 1_005) -> dict:
    return {
        "ts": exchange_ts,
        "source": "binance",
        "type": "trade",
        "symbol": "BTCUSDT",
        "price": 100.0,
        "quantity": 0.01,
        "side": "sell_taker",
        "exchangeTs": exchange_ts,
        "localReceiveTs": local_receive_ts,
    }


def hyperliquid_l2_book(exchange_ts: int = 2_000, local_receive_ts: int = 2_001) -> dict:
    return {
        "ts": exchange_ts,
        "source": "hyperliquid",
        "type": "l2_book",
        "symbol": "BTC",
        "exchangeTs": exchange_ts,
        "localReceiveTs": local_receive_ts,
        "raw": {
            "coin": "BTC",
            "time": exchange_ts,
            "levels": [
                [{"px": "100.00", "sz": "1.5"}, {"px": "99.99", "sz": "2.0"}],
                [{"px": "100.01", "sz": "1.25"}, {"px": "100.02", "sz": "2.5"}],
            ],
        },
    }


def hyperliquid_trade(exchange_ts: int = 2_002, local_receive_ts: int = 2_003) -> dict:
    item = trade(exchange_ts, local_receive_ts)
    item.update({"source": "hyperliquid", "symbol": "BTC", "side": "A"})
    return item


class HftBacktestReplayFixtureTests(unittest.TestCase):
    def test_initial_depth_snapshot_uses_snapshot_flags(self) -> None:
        snapshot = spike.make_initial_snapshot(depth5())

        self.assertEqual(len(snapshot), 4)
        self.assertTrue(np.all(snapshot["ev"] & spike.DEPTH_SNAPSHOT_EVENT))
        self.assertEqual(float(max(snapshot["px"][(snapshot["ev"] & spike.BUY_EVENT) > 0])), 100.0)
        self.assertEqual(float(min(snapshot["px"][(snapshot["ev"] & spike.SELL_EVENT) > 0])), 100.01)

    def test_trade_depth_and_book_ticker_convert_to_event_dtype(self) -> None:
        rows, counts = spike.make_market_rows([depth5(), book_ticker(), trade()], depth5())

        self.assertEqual(rows.dtype, spike.event_dtype)
        self.assertEqual(counts, {"book_ticker": 1, "depth5": 1, "trade": 1})
        self.assertEqual(len(rows), 7)
        self.assertEqual(int(np.sum((rows["ev"] & spike.TRADE_EVENT) > 0)), 1)
        self.assertEqual(int(np.sum((rows["ev"] & spike.DEPTH_EVENT) > 0)), 6)

    def test_hyperliquid_l2_book_can_seed_and_convert_clean_rows(self) -> None:
        first_depth = hyperliquid_l2_book()
        snapshot = spike.make_initial_snapshot(first_depth)
        rows, counts = spike.make_market_rows([first_depth, hyperliquid_trade()], first_depth)

        self.assertEqual(len(snapshot), 4)
        self.assertEqual(counts, {"l2_book": 1, "trade": 1})
        self.assertEqual(rows.dtype, spike.event_dtype)
        self.assertEqual(int(np.sum((rows["ev"] & spike.TRADE_EVENT) > 0)), 1)
        self.assertEqual(int(np.sum((rows["ev"] & spike.DEPTH_EVENT) > 0)), 4)

    def test_event_order_correction_accepts_unsorted_capture_rows(self) -> None:
        rows, _ = spike.make_market_rows(
            [
                depth5(exchange_ts=1_000, local_receive_ts=1_002),
                trade(exchange_ts=1_004, local_receive_ts=1_006),
                book_ticker(exchange_ts=1_003, local_receive_ts=1_005),
            ],
            depth5(exchange_ts=1_000, local_receive_ts=1_002),
        )

        replay_rows = spike.correct_event_order(
            rows,
            np.argsort(rows["exch_ts"], kind="stable"),
            np.argsort(rows["local_ts"], kind="stable"),
        )

        spike.validate_event_order(replay_rows)
        self.assertGreaterEqual(int(np.min(replay_rows["local_ts"] - replay_rows["exch_ts"])), 0)

    def test_timestamp_quality_flags_missing_or_negative_latency(self) -> None:
        missing_exchange = book_ticker()
        missing_exchange["exchangeTs"] = None
        negative_latency = trade(exchange_ts=1_010, local_receive_ts=1_009)

        self.assertTrue(spike.timestamp_quality(missing_exchange)["missing_exchange_ts"])
        self.assertFalse(spike.timestamp_quality(missing_exchange)["missing_local_receive_ts"])
        self.assertTrue(spike.timestamp_quality(negative_latency)["negative_latency"])

    def test_crossed_or_nan_book_is_rejected_before_replay_claims(self) -> None:
        crossed_depth = depth5()
        crossed_depth["raw"]["asks"][0][0] = "99.99"

        with self.assertRaises(ValueError):
            spike.make_initial_snapshot(crossed_depth)
        with self.assertRaises(ValueError):
            spike.validate_top_of_book(float("nan"), 100.01)
        with self.assertRaises(ValueError):
            spike.validate_top_of_book(100.01, 100.01)

    def test_no_trade_baseline_stays_flat_on_fixture_replay(self) -> None:
        first_depth = depth5(exchange_ts=1_000, local_receive_ts=1_001)
        snapshot = spike.make_initial_snapshot(first_depth)
        rows, _ = spike.make_market_rows(
            [
                first_depth,
                book_ticker(exchange_ts=1_010, local_receive_ts=1_011),
                book_ticker(exchange_ts=1_020, local_receive_ts=1_021),
            ],
            first_depth,
        )
        replay_rows = spike.correct_event_order(
            rows,
            np.argsort(rows["exch_ts"], kind="stable"),
            np.argsort(rows["local_ts"], kind="stable"),
        )

        result = spike.run_no_trade(snapshot, replay_rows, 1_000_000)

        self.assertGreater(result["valid_book_observations"], 0)
        self.assertEqual(result["state"]["position"], 0.0)
        self.assertEqual(result["state"]["num_trades"], 0)


if __name__ == "__main__":
    unittest.main()
