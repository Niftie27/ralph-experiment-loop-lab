import datetime as dt
import unittest
from decimal import Decimal

import pair_telegram_export as pte


UTC = dt.timezone.utc


def t(seconds):
    return dt.datetime(2026, 1, 1, tzinfo=UTC) + dt.timedelta(seconds=seconds)


def export(export_id, seconds=0, symbol="BTC", price="100", text_price="100", fmt="new"):
    text = f"{symbol} SHORT CANDIDATE @{text_price} | manual only\nSL ~102 | TP 99/98/97"
    return pte.ExportAlert(
        export_id=str(export_id),
        telegram_utc=t(seconds),
        symbol=symbol,
        fmt=fmt,
        price=Decimal(text_price.replace(",", "")),
        sl=Decimal("102"),
        tp1=Decimal("99"),
        tp2=Decimal("98"),
        tp3=Decimal("97"),
        text=text,
        price_scale=pte.decimal_places(text_price),
    )


def ledger(alert_id, seconds=0, symbol="BTC", mark="100.0"):
    source = {"BTC": "sw-btc-82k", "HYPE": "sw-hype", "ZEC": "sw-zec"}[symbol]
    return pte.LedgerAlert(
        alert_id=alert_id,
        source_id=source,
        utc_time=t(seconds),
        symbol=symbol,
        mark_logged=Decimal(mark),
        sl_sent="102",
        tp1_sent="99",
        tp2_sent="98",
        tp3_sent="97",
        telegram_message_id="1",
        status="sent",
    )


class PairTelegramExportTests(unittest.TestCase):
    def test_pairs_one_to_one_within_60s_and_text_precision(self):
        edges = pte.candidate_edges([export(1, seconds=10, text_price="100")], [ledger("a1", seconds=0, mark="100.4")])
        pairs, ambiguous_exports, ambiguous_alerts = pte.pair_unique(edges)
        self.assertEqual(list(pairs), ["1"])
        self.assertEqual(pairs["1"].alert_id, "a1")
        self.assertEqual(pairs["1"].dt_s, 10)
        self.assertFalse(ambiguous_exports)
        self.assertFalse(ambiguous_alerts)

    def test_rejects_over_60s(self):
        edges = pte.candidate_edges([export(1, seconds=61)], [ledger("a1", seconds=0)])
        self.assertEqual(edges, [])

    def test_rejects_price_when_not_equal_at_text_precision(self):
        edges = pte.candidate_edges([export(1, text_price="100.0")], [ledger("a1", mark="100.06")])
        self.assertEqual(edges, [])

    def test_reports_ambiguity(self):
        edges = pte.candidate_edges([export(1)], [ledger("a1"), ledger("a2", seconds=1)])
        pairs, ambiguous_exports, ambiguous_alerts = pte.pair_unique(edges)
        self.assertEqual(pairs, {})
        self.assertEqual(ambiguous_exports, {"1"})
        self.assertEqual(ambiguous_alerts, set())

    def test_known_text_report_counts_cache_and_ledger_comparisons(self):
        ex = export(1)
        led = ledger("a1")
        edge = pte.Edge("1", "a1", 0)
        mismatches, compared = pte.compare_known_texts(
            {"1": ex},
            {"a1": led},
            {"1": edge},
            {"1": "BTC SHORT CANDIDATE @100 | manual only\nSL ~102 | TP 99/98/97"},
        )
        self.assertEqual(mismatches, [])
        self.assertEqual(compared, {"cache": 1, "ledger": 1})

    def test_known_text_report_counts_ledger_when_cache_missing(self):
        ex = export(1)
        led = ledger("a1")
        edge = pte.Edge("1", "a1", 0)
        mismatches, compared = pte.compare_known_texts({"1": ex}, {"a1": led}, {"1": edge}, {})
        self.assertEqual(mismatches, [])
        self.assertEqual(compared, {"cache": 0, "ledger": 1})


if __name__ == "__main__":
    unittest.main()
