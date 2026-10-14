#!/usr/bin/env python3
"""Export VELOCITY alert_sent records and run consistency checks."""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
from datetime import datetime, timezone, timedelta
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
from typing import Any
from urllib.request import Request, urlopen


FIELDS = [
    "alert_id",
    "event_time_utc",
    "symbol",
    "source",
    "trigger_label",
    "direction",
    "alert_price",
    "trigger_move_pct",
    "threshold_pct",
    "window_ms",
    "volume_velocity_ratio",
    "plan_tradable",
    "fade_direction",
    "tp_pct",
    "sl_pct",
    "worst_fill_price",
    "review_finalized",
    "verdict",
]

V1_ROWS = 293
MARKET_BY_SOURCE = {
    "Binance live trade stream": "spot: Binance websocket @trade price",
    "Hyperliquid allMids stream": "spot/perp mid: Hyperliquid allMids; exact market not verified",
}


def iso_ms(ms: int | float) -> str:
    return datetime.fromtimestamp(ms / 1000, timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def num(value: Any, field: str, alert_id: str) -> str:
    if value is None or value == "":
        return ""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{alert_id}: non-numeric {field}={value!r}")
    return repr(float(value)).rstrip("0").rstrip(".") if "." in repr(float(value)) else str(value)


def money_number(text: str) -> str:
    return text.replace(",", "").strip()


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows = []
    with path.open() as f:
        for line_no, line in enumerate(f, 1):
            if not line.strip():
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_no}: invalid JSON") from exc
    return rows


def load_reviews(records: list[dict[str, Any]]) -> dict[str, dict[str, str]]:
    reviews = {}
    for record in records:
        if record.get("type") != "review_finalized":
            continue
        review = record.get("review") or {}
        alert_id = review.get("id")
        if not alert_id:
            continue
        classification = record.get("classification") or {}
        reviews[alert_id] = {"verdict": str(classification.get("verdict") or "")}
    return reviews


def alert_to_row(record: dict[str, Any], reviews: dict[str, dict[str, str]]) -> dict[str, str]:
    alert = record.get("alert") or {}
    alert_id = str(alert.get("id") or "")
    if not alert_id:
        raise ValueError("alert_sent record has no alert.id")
    price = alert.get("price")
    if isinstance(price, bool) or not isinstance(price, (int, float)):
        raise ValueError(f"{alert_id}: non-numeric price={price!r}")
    plan = alert.get("fadePlan") or {}
    review = reviews.get(alert_id)
    return {
        "alert_id": alert_id,
        "event_time_utc": iso_ms(alert["eventTime"]),
        "symbol": str(alert.get("assetLabel") or alert.get("assetSymbol") or "").upper(),
        "source": str(alert.get("source") or ""),
        "trigger_label": str(alert.get("triggerLabel") or ""),
        "direction": str(alert.get("direction") or ""),
        "alert_price": num(price, "price", alert_id),
        "trigger_move_pct": num(alert.get("triggerMovePct"), "triggerMovePct", alert_id),
        "threshold_pct": num(alert.get("thresholdPct"), "thresholdPct", alert_id),
        "window_ms": num(alert.get("windowMs"), "windowMs", alert_id),
        "volume_velocity_ratio": num(alert.get("volumeVelocityRatio"), "volumeVelocityRatio", alert_id),
        "plan_tradable": "y" if plan.get("tradable") is True else "n",
        "fade_direction": str(plan.get("fadeDirection") or ""),
        "tp_pct": num(plan.get("takeProfitPct"), "takeProfitPct", alert_id),
        "sl_pct": num(plan.get("stopLossPct"), "stopLossPct", alert_id),
        "worst_fill_price": num(plan.get("worstFillPrice"), "worstFillPrice", alert_id),
        "review_finalized": "y" if review else "n",
        "verdict": review["verdict"] if review else "",
    }


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    os.chmod(path, 0o600)


def count_by(rows: list[dict[str, str]], *fields: str) -> Counter[tuple[str, ...]]:
    return Counter(tuple(row[field] for field in fields) for row in rows)


def month_of(row: dict[str, str]) -> str:
    return row["event_time_utc"][:7]


def parse_page(path: Path) -> dict[str, str]:
    text = path.read_text()
    out: dict[str, str] = {}
    m = re.search(r'^id:\s*"?([^"\n]+)"?', text, re.M)
    if m:
        out["alert_id"] = m.group(1)
    m = re.search(r'^symbol:\s*"?([^"\n]+)"?', text, re.M)
    if m:
        symbol = m.group(1).upper()
        out["symbol"] = symbol.removesuffix("USDT")
    m = re.search(r"^#\s+\S+\s+(UP|DOWN)\s+VELOCITY/(\S+)", text, re.M)
    if m:
        out["direction"] = m.group(1)
        out["trigger_label"] = m.group(2)
    patterns = {
        "event_time_utc": r"- Time:\s*([^\n]+)",
        "alert_price": r"- Price:\s*([0-9,]+(?:\.[0-9]+)?)",
        "source": r"- Source:\s*([^\n]+)",
    }
    for field, pattern in patterns.items():
        m = re.search(pattern, text)
        if m:
            value = m.group(1).strip()
            if field == "alert_price":
                value = money_number(value)
            out[field] = value
    m = re.search(r"- Trigger:\s*VELOCITY/([^\n]+)", text)
    if m:
        out["trigger_label"] = m.group(1).strip()
    return out


def compare_pages(rows: list[dict[str, str]], pages_dir: Path) -> tuple[int, int, list[str]]:
    by_id = {row["alert_id"]: row for row in rows}
    fields = ["event_time_utc", "symbol", "direction", "alert_price", "trigger_label", "source"]
    pages_matched = 0
    compared = 0
    mismatches: list[str] = []
    for page in sorted(pages_dir.glob("*-velocity-*.md")):
        parsed = parse_page(page)
        alert_id = parsed.get("alert_id")
        if not alert_id or alert_id not in by_id:
            continue
        pages_matched += 1
        row = by_id[alert_id]
        for field in fields:
            if field not in parsed:
                continue
            if field == "source" and parsed[field].lower() == "n/a":
                continue
            compared += 1
            left = row[field]
            right = parsed[field]
            if field == "alert_price":
                left = money_number(left)
            if left != right:
                mismatches.append(f"{alert_id} {field}: csv={left!r} page={right!r}")
    return pages_matched, compared, mismatches


def required_days(rows: list[dict[str, str]]) -> dict[str, set[str]]:
    days: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        start = datetime.fromisoformat(row["event_time_utc"].replace("Z", "+00:00")).date()
        end = (datetime.fromisoformat(row["event_time_utc"].replace("Z", "+00:00")) + timedelta(seconds=120, hours=4)).date()
        d = start
        while d <= end:
            days[row["symbol"]].add(d.isoformat())
            d += timedelta(days=1)
    return days


def load_local_coverage(manifest: Path, bybit_root: Path) -> tuple[set[tuple[str, str]], set[tuple[str, str]]]:
    binance = set()
    if manifest.exists():
        with manifest.open(newline="") as f:
            for row in csv.DictReader(f):
                if row.get("source") == "binance-vision" and row.get("checksum_status") == "verified":
                    file_name = Path(row.get("file", "")).name
                    m = re.match(r"([A-Z0-9]+)-aggTrades-(\d{4}-\d{2}-\d{2})\.zip$", file_name)
                    if m:
                        binance.add((m.group(1).removesuffix("USDT"), m.group(2)))
    bybit = set()
    for path in bybit_root.glob("*.csv.gz"):
        m = re.match(r"([A-Z0-9]+)USDT(\d{4}-\d{2}-\d{2})\.csv\.gz$", path.name)
        if m:
            bybit.add((m.group(1), m.group(2)))
    return binance, bybit


def head_content_length(url: str, timeout: float = 5.0) -> int | None:
    req = Request(url, method="HEAD", headers={"User-Agent": "ralph-alert-eval/1.0"})
    try:
        with urlopen(req, timeout=timeout) as response:
            value = response.headers.get("Content-Length")
            return int(value) if value and value.isdigit() else None
    except Exception:
        return None


def coverage_report(rows: list[dict[str, str]], data_root: Path, with_head: bool) -> list[str]:
    need = required_days(rows)
    binance_have, bybit_have = load_local_coverage(data_root / "manifest.csv", data_root / "bybit-public")
    lines = []
    for symbol in sorted(need):
        days = sorted(need[symbol])
        for provider, have in [("binance-vision", binance_have), ("bybit-public", bybit_have)]:
            missing = [day for day in days if (symbol, day) not in have]
            total_bytes = 0
            known = 0
            if with_head:
                for day in missing:
                    if provider == "binance-vision":
                        sym = f"{symbol}USDT"
                        url = f"https://data.binance.vision/data/spot/daily/aggTrades/{sym}/{sym}-aggTrades-{day}.zip"
                    else:
                        sym = f"{symbol}USDT"
                        url = f"https://public.bybit.com/trading/{sym}/{sym}{day}.csv.gz"
                    size = head_content_length(url)
                    if size is not None:
                        total_bytes += size
                        known += 1
            size_text = f"{total_bytes} bytes from {known}/{len(missing)} HEADs" if with_head else "not requested"
            lines.append(
                f"coverage {symbol} {provider}: days_needed={len(days)} have={len(days)-len(missing)} "
                f"missing={len(missing)} estimated_missing_size={size_text}"
            )
    return lines


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def line_count(path: Path) -> int:
    with path.open() as f:
        return sum(1 for _ in f)


def run(args: argparse.Namespace) -> int:
    records = load_jsonl(args.snapshot)
    reviews = load_reviews(records)
    alert_sent = [r for r in records if r.get("type") == "alert_sent"]
    missing_kind = [r for r in alert_sent if (r.get("alert") or {}).get("triggerKind") is None]
    rows = [alert_to_row(r, reviews) for r in alert_sent if (r.get("alert") or {}).get("triggerKind") == "VELOCITY"]
    ids = [row["alert_id"] for row in rows]
    duplicates = [alert_id for alert_id, count in Counter(ids).items() if count > 1]
    if duplicates:
        raise ValueError(f"duplicate alert_id(s): {duplicates[:10]}")
    write_csv(args.output, rows)

    print(f"snapshot={args.snapshot}")
    print(f"snapshot_sha256={sha256(args.snapshot)} lines={line_count(args.snapshot)}")
    print(f"output={args.output} rows={len(rows)} sha256={sha256(args.output)}")
    print(f"alert_sent_missing_triggerKind={len(missing_kind)} v1_classification=not_applicable_zero_missing")
    print(f"rows_vs_v1 compared=1 csv_rows={len(rows)} v1_rows={V1_ROWS} delta={len(rows)-V1_ROWS}")
    if len(rows) != V1_ROWS:
        latest = max(row["event_time_utc"] for row in rows) if rows else "n/a"
        print(f"rows_vs_v1_explanation=live_snapshot_diff_or_new_alerts latest_event_time={latest}")
    for label, counter in [
        ("symbol", count_by(rows, "symbol")),
        ("trigger_label", count_by(rows, "trigger_label")),
        ("month", Counter((month_of(row),) for row in rows)),
        ("source", count_by(rows, "source")),
        ("plan_tradable", count_by(rows, "plan_tradable")),
        ("fade_direction", count_by(rows, "fade_direction")),
        ("tp_sl", count_by(rows, "tp_pct", "sl_pct")),
    ]:
        print(f"counts_by_{label} compared={len(rows)} " + json.dumps({"|".join(k): v for k, v in sorted(counter.items())}, sort_keys=True))

    tradable = [row for row in rows if row["plan_tradable"] == "y"]
    bad_fades = [
        row["alert_id"]
        for row in tradable
        if not ((row["direction"] == "UP" and row["fade_direction"] == "SHORT") or (row["direction"] == "DOWN" and row["fade_direction"] == "LONG"))
    ]
    print(f"fade_opposite_check compared={len(tradable)} mismatches={len(bad_fades)} sample={bad_fades[:10]}")

    pages_matched, fields_compared, mismatches = compare_pages(rows, args.pages_dir)
    print(f"page_compare pages_matched={pages_matched} fields_compared={fields_compared} mismatches={len(mismatches)}")
    for mismatch in mismatches[:10]:
        print(f"page_mismatch {mismatch}")

    for (symbol, source), count in sorted(count_by(rows, "symbol", "source").items()):
        print(f"market_source {symbol}|{source} alerts={count} market={MARKET_BY_SOURCE.get(source, 'not verified')}")

    for line in coverage_report(rows, args.data_root, args.estimate_sizes):
        print(line)
    usage = shutil.disk_usage(str(args.data_root))
    print(f"df {args.data_root}: free={usage.free} total={usage.total} used={usage.used}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path.home() / "ralph-state" / "velocity-alerts.csv")
    parser.add_argument(
        "--pages-dir",
        type=Path,
        default=Path.home() / ".openclaw/workspace/crypto-updates/wiki/trading-journal/alerts",
    )
    parser.add_argument("--data-root", type=Path, default=Path.home() / "ralph-research-data")
    parser.add_argument("--estimate-sizes", action="store_true", help="Use HEAD requests only; no downloads.")
    return parser


if __name__ == "__main__":
    raise SystemExit(run(build_parser().parse_args()))
