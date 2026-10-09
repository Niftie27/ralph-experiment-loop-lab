#!/usr/bin/env python3
import os
import sys
import types
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.modules.setdefault("websockets", types.SimpleNamespace())

import binance_live
from symbol_settings import SymbolSettings


class BinanceLiveTapeTest(unittest.TestCase):
    def test_tape_line_uses_opposite_side_price_from_tick_for_sell(self):
        settings = SymbolSettings("BTCUSDT", tick_size=0.1, price_decimals=1)
        trade = {"p": "82617.20", "q": "0.072", "m": True, "a": 1, "T": 1791532800052}
        row = binance_live.tape_line(trade, -0.072, settings).split(";")
        self.assertEqual(row[1], "82617.2")
        self.assertEqual(row[2], "0.072")
        self.assertEqual(row[4], "0")
        self.assertEqual(row[5], "82617.3")

    def test_tape_line_uses_opposite_side_price_from_tick_for_buy(self):
        settings = SymbolSettings("ETHUSDT", tick_size=0.01, price_decimals=2)
        trade = {"p": "2502.87", "q": "1.600", "m": False, "a": 2, "T": 1791532799969}
        row = binance_live.tape_line(trade, 1.600, settings).split(";")
        self.assertEqual(row[1], "2502.86")
        self.assertEqual(row[2], "0")
        self.assertEqual(row[4], "1.600")
        self.assertEqual(row[5], "2502.87")


if __name__ == "__main__":
    unittest.main()
