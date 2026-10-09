#!/usr/bin/env python3
import io
import json
import os
import sys
import unittest
from contextlib import redirect_stderr
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import symbol_settings


class FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return self.payload


class SymbolSettingsTest(unittest.TestCase):
    def setUp(self):
        symbol_settings._EXCHANGE_INFO_CACHE.clear()

    def test_exchange_info_selects_requested_symbol_when_btc_is_first(self):
        payload = {
            "symbols": [
                {
                    "symbol": "BTCUSDT",
                    "filters": [{"filterType": "PRICE_FILTER", "tickSize": "0.10"}],
                },
                {
                    "symbol": "ETHUSDT",
                    "filters": [{"filterType": "PRICE_FILTER", "tickSize": "0.01"}],
                },
            ]
        }

        def fake_urlopen(url, timeout):
            self.assertEqual(url, "https://fapi.binance.com/fapi/v1/exchangeInfo")
            self.assertEqual(timeout, 20)
            return FakeResponse(payload)

        settings = symbol_settings.SymbolSettings("ETHUSDT", tick_size=0.1, price_decimals=1)
        err = io.StringIO()
        with patch("urllib.request.urlopen", fake_urlopen), redirect_stderr(err):
            out = symbol_settings.apply_exchange_info(settings, "https://fapi.binance.com")

        self.assertIs(out, settings)
        self.assertEqual(out.tick_size, 0.01)
        self.assertEqual(out.price_decimals, 2)
        self.assertIn("WARN symbol_settings: ETHUSDT config tick_size=0.1 exchange tickSize=0.01; using exchange tick", err.getvalue())


if __name__ == "__main__":
    unittest.main()
