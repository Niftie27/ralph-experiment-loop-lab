#!/usr/bin/env python3
"""Pair Tomas's Telegram short-watch export with the local alert ledger."""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import re
import statistics
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


UTC = dt.timezone.utc
SOURCE_SYMBOLS = {
    "sw-btc-82k": "BTC",
    "sw-hype": "HYPE",
    "sw-zec": "ZEC",
}
OUTPUT_FIELDS = [
    "alert_id",
    "export_id",
    "telegram_utc",
    "dt_s",
    "symbol",
    "format",
    "price",
    "sl",
    "tp1",
    "tp2",
    "tp3",
    "match_status",
]


@dataclass(frozen=True)
class ExportAlert:
    export_id: str
    telegram_utc: dt.datetime
    symbol: str
    fmt: str
    price: Decimal
    sl: Decimal
    tp1: Decimal
    tp2: Decimal
    tp3: Decimal
    text: str
    price_scale: int


@dataclass(frozen=True)
class LedgerAlert:
    alert_id: str
    source_id: str
    utc_time: dt.datetime
    symbol: str
    mark_logged: Decimal
    sl_sent: str
    tp1_sent: str
    tp2_sent: str
    tp3_sent: str
    telegram_message_id: str
    status: str


@dataclass(frozen=True)
class Edge:
    export_id: str
    alert_id: str
    dt_s: float


def parse_time(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


def fmt_time(value: dt.datetime) -> str:
    return value.astimezone(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_decimal(value: str | int | float | Decimal) -> Decimal:
    return Decimal(str(value).replace(",", "").strip())


def decimal_places(value: str) -> int:
    clean = value.replace(",", "").strip()
    return len(clean.split(".", 1)[1]) if "." in clean else 0


def text_price_token(text: str, fmt: str) -> str:
    if fmt == "new":
        match = re.search(r"SHORT CANDIDATE @([\d,]+(?:\.\d+)?)", text)
    else:
        match = re.search(r"\bmark ([\d,]+(?:\.\d+)?)", text)
    if not match:
        raise ValueError("price token not found in alert text")
    return match.group(1)


def quantize(value: Decimal, places: int) -> Decimal:
    return value.quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)


def price_matches(export: ExportAlert, ledger: LedgerAlert) -> bool:
    unit = Decimal(1).scaleb(-export.price_scale)
    return abs(ledger.mark_logged - export.price) <= unit / 2


def load_export(path: Path) -> list[ExportAlert]:
    rows: list[ExportAlert] = []
    with path.open() as f:
        for line_no, line in enumerate(f, 1):
            if not line.strip():
                continue
            raw = json.loads(line)
            token = text_price_token(raw["text"], raw["format"])
            rows.append(
                ExportAlert(
                    export_id=str(raw["export_id"]),
                    telegram_utc=parse_time(raw["telegram_utc"]),
                    symbol=raw["symbol"],
                    fmt=raw["format"],
                    price=parse_decimal(token),
                    sl=parse_decimal(raw["sl"]),
                    tp1=parse_decimal(raw["tp1"]),
                    tp2=parse_decimal(raw["tp2"]),
                    tp3=parse_decimal(raw["tp3"]),
                    text=raw["text"],
                    price_scale=decimal_places(token),
                )
            )
            if rows[-1].price != parse_decimal(raw["price"]):
                raise ValueError(f"line {line_no}: text price differs from parsed price field")
    return rows


def load_ledger(path: Path) -> list[LedgerAlert]:
    alerts: list[LedgerAlert] = []
    with path.open(newline="") as f:
        for row in csv.DictReader(f):
            source_id = row.get("source_id", "")
            if source_id not in SOURCE_SYMBOLS or row.get("side") != "SHORT":
                continue
            if row.get("status") not in {"sent", "send_failed", "failed"}:
                continue
            alerts.append(
                LedgerAlert(
                    alert_id=row["alert_id"],
                    source_id=source_id,
                    utc_time=parse_time(row["utc_time"]),
                    symbol=SOURCE_SYMBOLS[source_id],
                    mark_logged=parse_decimal(row["mark_logged"]),
                    sl_sent=row.get("sl_sent", ""),
                    tp1_sent=row.get("tp1_sent", ""),
                    tp2_sent=row.get("tp2_sent", ""),
                    tp3_sent=row.get("tp3_sent", ""),
                    telegram_message_id=row.get("telegram_message_id", ""),
                    status=row.get("status", ""),
                )
            )
    return alerts


def candidate_edges(exports: list[ExportAlert], ledger: list[LedgerAlert], max_seconds: int = 60) -> list[Edge]:
    edges: list[Edge] = []
    for ex in exports:
        for led in ledger:
            if ex.symbol != led.symbol:
                continue
            dt_s = (ex.telegram_utc - led.utc_time).total_seconds()
            if abs(dt_s) <= max_seconds and price_matches(ex, led):
                edges.append(Edge(ex.export_id, led.alert_id, dt_s))
    return edges


def pair_unique(edges: list[Edge]) -> tuple[dict[str, Edge], set[str], set[str]]:
    by_export: dict[str, list[Edge]] = {}
    by_alert: dict[str, list[Edge]] = {}
    for edge in edges:
        by_export.setdefault(edge.export_id, []).append(edge)
        by_alert.setdefault(edge.alert_id, []).append(edge)
    pairs: dict[str, Edge] = {}
    ambiguous_exports: set[str] = set()
    ambiguous_alerts: set[str] = set()
    for export_id, export_edges in by_export.items():
        if len(export_edges) > 1:
            ambiguous_exports.add(export_id)
            continue
        edge = export_edges[0]
        if len(by_alert[edge.alert_id]) == 1:
            pairs[export_id] = edge
        else:
            ambiguous_exports.add(export_id)
            ambiguous_alerts.add(edge.alert_id)
    for alert_id, alert_edges in by_alert.items():
        if len(alert_edges) > 1:
            ambiguous_alerts.add(alert_id)
            for edge in alert_edges:
                ambiguous_exports.add(edge.export_id)
                pairs.pop(edge.export_id, None)
    return pairs, ambiguous_exports, ambiguous_alerts


def parse_alert_text(text: str) -> dict[str, Decimal]:
    if "SHORT CANDIDATE @" in text:
        price = re.search(r"SHORT CANDIDATE @([\d,]+(?:\.\d+)?)", text)
        sl = re.search(r"SL ~([\d,]+(?:\.\d+)?)", text)
        tps = re.search(r"TP ([\d,]+(?:\.\d+)?)/([\d,]+(?:\.\d+)?)/([\d,]+(?:\.\d+)?)", text)
    else:
        price = re.search(r"\bmark ([\d,]+(?:\.\d+)?)", text)
        sl = re.search(r"cca ([\d,]+(?:\.\d+)?)", text)
        tps = re.search(
            r"TARGETS: (?:TP1 )?([\d,]+(?:\.\d+)?)(?:, TP2 | / )([\d,]+(?:\.\d+)?)(?:, TP3 | / )([\d,]+(?:\.\d+)?)",
            text,
        )
    if not (price and sl and tps):
        raise ValueError("could not parse alert text")
    return {
        "price": parse_decimal(price.group(1)),
        "sl": parse_decimal(sl.group(1)),
        "tp1": parse_decimal(tps.group(1)),
        "tp2": parse_decimal(tps.group(2)),
        "tp3": parse_decimal(tps.group(3)),
    }


def load_text_cache(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    texts: dict[str, str] = {}
    with path.open(newline="") as f:
        for row in csv.DictReader(f):
            message_id = row.get("message_id", "")
            if not message_id.isdigit():
                continue
            texts[message_id] = row.get("full_text", "")
    return texts


def decimal_equal(a: Decimal, b: Decimal) -> bool:
    return a.compare(b) == Decimal("0")


def compare_known_texts(
    exports_by_id: dict[str, ExportAlert],
    ledger_by_id: dict[str, LedgerAlert],
    pairs: dict[str, Edge],
    text_cache: dict[str, str],
) -> tuple[list[str], dict[str, int]]:
    mismatches: list[str] = []
    compared = {"cache": 0, "ledger": 0}
    for export_id, edge in sorted(pairs.items(), key=lambda item: int(item[0])):
        ledger = ledger_by_id[edge.alert_id]
        cached = text_cache.get(ledger.telegram_message_id)
        ex = exports_by_id[export_id]
        if cached:
            parsed = parse_alert_text(cached)
            compared["cache"] += 1
            for field in ("price", "sl", "tp1", "tp2", "tp3"):
                export_value = getattr(ex, field)
                if not decimal_equal(export_value, parsed[field]):
                    mismatches.append(f"{edge.alert_id} export_id={export_id} cache {field}: export={export_value} cache={parsed[field]}")
        ledger_fields = {
            "sl": ledger.sl_sent,
            "tp1": ledger.tp1_sent,
            "tp2": ledger.tp2_sent,
            "tp3": ledger.tp3_sent,
        }
        if any(ledger_fields.values()):
            compared["ledger"] += 1
        for field, raw in ledger_fields.items():
            if not raw:
                continue
            ledger_value = parse_decimal(raw)
            if not decimal_equal(getattr(ex, field), ledger_value):
                mismatches.append(f"{edge.alert_id} export_id={export_id} ledger {field}: export={getattr(ex, field)} ledger={ledger_value}")
    return mismatches, compared


def write_output(path: Path, exports: list[ExportAlert], pairs: dict[str, Edge], ambiguous_exports: set[str]) -> None:
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        for ex in exports:
            edge = pairs.get(ex.export_id)
            if edge:
                status = "paired"
                alert_id = edge.alert_id
                dt_s = f"{edge.dt_s:.3f}"
            elif ex.export_id in ambiguous_exports:
                status = "ambiguous"
                alert_id = ""
                dt_s = ""
            else:
                status = "unpaired_export"
                alert_id = ""
                dt_s = ""
            writer.writerow(
                {
                    "alert_id": alert_id,
                    "export_id": ex.export_id,
                    "telegram_utc": fmt_time(ex.telegram_utc),
                    "dt_s": dt_s,
                    "symbol": ex.symbol,
                    "format": ex.fmt,
                    "price": str(ex.price),
                    "sl": str(ex.sl),
                    "tp1": str(ex.tp1),
                    "tp2": str(ex.tp2),
                    "tp3": str(ex.tp3),
                    "match_status": status,
                }
            )


def tp1_counts(exports: list[ExportAlert]) -> tuple[dict[str, tuple[int, int]], dict[str, tuple[int, int]]]:
    by_format: dict[str, list[bool]] = {}
    by_symbol_format: dict[str, list[bool]] = {}
    for ex in exports:
        is_bad = ex.tp1 >= ex.price
        by_format.setdefault(ex.fmt, []).append(is_bad)
        by_symbol_format.setdefault(f"{ex.symbol}/{ex.fmt}", []).append(is_bad)
    return (
        {key: (sum(values), len(values)) for key, values in sorted(by_format.items())},
        {key: (sum(values), len(values)) for key, values in sorted(by_symbol_format.items())},
    )


def report(
    exports: list[ExportAlert],
    ledger: list[LedgerAlert],
    edges: list[Edge],
    pairs: dict[str, Edge],
    ambiguous_exports: set[str],
    ambiguous_alerts: set[str],
    mismatches: list[str],
    known_text_compared: dict[str, int],
) -> str:
    paired_alerts = {edge.alert_id for edge in pairs.values()}
    unpaired_exports = [ex.export_id for ex in exports if ex.export_id not in pairs and ex.export_id not in ambiguous_exports]
    unpaired_alerts = [led.alert_id for led in ledger if led.alert_id not in paired_alerts and led.alert_id not in ambiguous_alerts]
    dts = sorted(abs(edge.dt_s) for edge in pairs.values())
    dt_line = "dt_abs_s min/median/max: n/a"
    if dts:
        dt_line = f"dt_abs_s min/median/max: {min(dts):.3f}/{statistics.median(dts):.3f}/{max(dts):.3f}"
    by_format, by_symbol_format = tp1_counts(exports)
    lines = [
        f"exports: {len(exports)}",
        f"ledger_candidates: {len(ledger)}",
        f"candidate_edges: {len(edges)}",
        f"pairs: {len(pairs)}",
        f"ambiguous_exports: {len(ambiguous_exports)} {','.join(sorted(ambiguous_exports, key=int)) if ambiguous_exports else ''}".rstrip(),
        f"ambiguous_alerts: {len(ambiguous_alerts)} {','.join(sorted(ambiguous_alerts)) if ambiguous_alerts else ''}".rstrip(),
        f"unpaired_exports: {len(unpaired_exports)} {','.join(unpaired_exports)}".rstrip(),
        f"unpaired_alerts: {len(unpaired_alerts)} {','.join(unpaired_alerts)}".rstrip(),
        dt_line,
        "tp1_ge_price_by_format: " + ", ".join(f"{key}={bad}/{total}" for key, (bad, total) in by_format.items()),
        "tp1_ge_price_by_symbol_format: " + ", ".join(f"{key}={bad}/{total}" for key, (bad, total) in by_symbol_format.items()),
        f"known_text_compared cache: {known_text_compared.get('cache', 0)}",
        f"known_text_compared ledger: {known_text_compared.get('ledger', 0)}",
        f"known_text_mismatches: {len(mismatches)}",
    ]
    lines.extend(mismatches)
    return "\n".join(lines)


def run(args: argparse.Namespace) -> int:
    exports = load_export(args.export_jsonl)
    ledger = load_ledger(args.ledger_csv)
    edges = candidate_edges(exports, ledger, args.max_seconds)
    pairs, ambiguous_exports, ambiguous_alerts = pair_unique(edges)
    exports_by_id = {ex.export_id: ex for ex in exports}
    ledger_by_id = {led.alert_id: led for led in ledger}
    text_cache = load_text_cache(args.text_cache_csv)
    mismatches, known_text_compared = compare_known_texts(exports_by_id, ledger_by_id, pairs, text_cache)
    write_output(args.output_csv, exports, pairs, ambiguous_exports)
    print(report(exports, ledger, edges, pairs, ambiguous_exports, ambiguous_alerts, mismatches, known_text_compared))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    state_dir = Path.home() / "ralph-state"
    parser.add_argument("--export-jsonl", type=Path, default=state_dir / "short-candidates.jsonl")
    parser.add_argument("--ledger-csv", type=Path, default=state_dir / "alert-ledger.csv")
    parser.add_argument("--text-cache-csv", type=Path, default=state_dir / "short-watch-alert-texts.csv")
    parser.add_argument("--output-csv", type=Path, default=state_dir / "alert-texts-export.csv")
    parser.add_argument("--max-seconds", type=int, default=60)
    return parser


if __name__ == "__main__":
    raise SystemExit(run(build_parser().parse_args()))
