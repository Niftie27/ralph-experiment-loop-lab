#!/usr/bin/env python3
"""Shadow-trade evaluator for short-watch alerts.

The public repo contains code only. Alert rows and output CSVs live under
``/home/coder/ralph-state``; market dumps live under
``/home/coder/ralph-research-data`` and local collector directories.
"""

from __future__ import annotations

import argparse
from array import array
import csv
import datetime as dt
import gzip
import json
import lzma
import math
import os
import resource
import statistics
import sys
import time
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterator


UTC = dt.timezone.utc
COST_BPS_PER_SIDE = 7.0
DELAYS = (5, 30, 120)
TIMEOUTS = (4 * 3600, 24 * 3600)
EXIT_MODES = ("TP1-only", "TP2-only", "TP3-only", "ladder")
TP_MODES = ("as_sent", "corrected")
LOAD_SPILL_SECONDS = 60
FIELDNAMES = [
    "alert_id",
    "source_id",
    "version",
    "variant",
    "tp_mode",
    "price_path",
    "entry_time",
    "entry_price",
    "exit_time",
    "exit_price",
    "exit_reason",
    "R",
    "risk_bps",
    "covered_until",
    "dropped_tps",
]


@dataclass(frozen=True)
class Alert:
    alert_id: str
    source_id: str
    version: str
    alert_time: dt.datetime
    symbol: str
    mark_logged: float
    sl: float
    tps: tuple[float, float, float]


@dataclass(frozen=True)
class Trade:
    """Tiny test helper. Production loaders keep arrays, not Trade objects."""

    time_ms: int
    price: float

    def __init__(self, time: dt.datetime | int, price: float, order: int = 0) -> None:
        object.__setattr__(self, "time_ms", int(time.timestamp() * 1000) if isinstance(time, dt.datetime) else int(time))
        object.__setattr__(self, "price", float(price))


@dataclass(frozen=True)
class Coverage:
    start: dt.datetime
    end: dt.datetime
    label: str


@dataclass
class Window:
    times: array = field(default_factory=lambda: array("q"))
    prices: array = field(default_factory=lambda: array("d"))
    price_path: str = "missing"
    covered_until: dt.datetime | None = None
    coverage: list[Coverage] = field(default_factory=list)
    order_violations: int = 0
    duplicates: int = 0
    notes: list[str] = field(default_factory=list)

    @property
    def trades_count(self) -> int:
        return len(self.times)


def parse_time(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


def fmt_time(value: dt.datetime | None) -> str:
    if value is None:
        return ""
    return value.astimezone(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def fmt_ms(value_ms: int | None) -> str:
    if value_ms is None:
        return ""
    return fmt_time(dt.datetime.fromtimestamp(value_ms / 1000, tz=UTC))


def parse_price(value: str) -> float:
    return float(value.replace(",", "").strip())


def day_start(day: dt.date) -> dt.datetime:
    return dt.datetime(day.year, day.month, day.day, tzinfo=UTC)


def hour_floor(value: dt.datetime) -> dt.datetime:
    return value.astimezone(UTC).replace(minute=0, second=0, microsecond=0)


def iter_days(start: dt.datetime, end: dt.datetime) -> Iterator[dt.date]:
    current = start.date()
    last = (end - dt.timedelta(milliseconds=1)).date()
    while current <= last:
        yield current
        current += dt.timedelta(days=1)


def iter_hours(start: dt.datetime, end: dt.datetime) -> Iterator[dt.datetime]:
    current = hour_floor(start)
    while current <= end:
        yield current
        current += dt.timedelta(hours=1)


def load_alerts(path: Path) -> list[Alert]:
    alerts: list[Alert] = []
    with path.open(newline="") as f:
        for row in csv.DictReader(f):
            if row.get("text_source") == "none" or row.get("side") != "SHORT":
                continue
            alerts.append(
                Alert(
                    alert_id=row["alert_id"],
                    source_id=row["source_id"],
                    version=row["version"],
                    alert_time=parse_time(row["utc_time"]),
                    symbol=row["symbol"],
                    mark_logged=parse_price(row["mark_logged"]),
                    sl=parse_price(row["sl_sent"]),
                    tps=(parse_price(row["tp1_sent"]), parse_price(row["tp2_sent"]), parse_price(row["tp3_sent"])),
                )
            )
    return alerts


def load_manifest(path: Path) -> set[tuple[str, dt.date]]:
    verified: set[tuple[str, dt.date]] = set()
    if not path.exists():
        return verified
    with path.open(newline="") as f:
        for row in csv.DictReader(f):
            if row.get("source") != "binance-vision" or row.get("checksum_status") != "verified":
                continue
            name = Path(row["file"]).name
            prefix = f"{row.get('symbol', '')}-aggTrades-"
            if not name.startswith(prefix) or not name.endswith(".zip"):
                continue
            try:
                verified.add((row["symbol"], dt.date.fromisoformat(name[len(prefix) : -4])))
            except ValueError:
                continue
    return verified


def load_data_checks(repo: Path) -> set[tuple[str, dt.datetime]]:
    passed: set[tuple[str, dt.datetime]] = set()
    checks_dir = repo / "data-checks"
    if not checks_dir.exists():
        return passed
    for path in checks_dir.glob("*.csv"):
        with path.open(newline="") as f:
            for row in csv.DictReader(f):
                if row.get("verify") != "PASS":
                    continue
                try:
                    hour = dt.datetime.strptime(row["hour"], "%Y-%m-%dT%HZ").replace(tzinfo=UTC)
                    passed.add((row["symbol"], hour))
                except (KeyError, ValueError):
                    continue
    return passed


def binance_archive_file(root: Path, symbol: str, day: dt.date) -> Path:
    return root / f"{symbol}-aggTrades-{day.isoformat()}.zip"


def bybit_file(root: Path, symbol: str, day: dt.date) -> Path:
    return root / f"{symbol}{day.isoformat()}.csv.gz"


def local_raw_dir(symbol: str) -> Path:
    mapping = {
        "BTCUSDT": Path("/home/coder/data/binance"),
        "HYPEUSDT": Path("/home/coder/data/binance-hypeusdt"),
    }
    return mapping.get(symbol, Path(f"/home/coder/data/binance-{symbol.lower()}"))


def raw_file(symbol: str, hour: dt.datetime) -> Path:
    return local_raw_dir(symbol) / f"raw_{symbol}_{hour.strftime('%Y-%m-%dT%HZ')}.jsonl.xz"


def merge_coverage(items: list[Coverage]) -> list[Coverage]:
    if not items:
        return []
    items = sorted(items, key=lambda c: (c.start, c.end, c.label))
    merged = [items[0]]
    for item in items[1:]:
        prev = merged[-1]
        if item.start <= prev.end and item.label == prev.label:
            merged[-1] = Coverage(prev.start, max(prev.end, item.end), prev.label)
        else:
            merged.append(item)
    return merged


def continuous_covered_until(coverage: list[Coverage], start: dt.datetime) -> dt.datetime | None:
    current = start
    found = False
    for item in sorted(coverage, key=lambda c: c.start):
        if item.end <= current:
            continue
        if item.start > current:
            break
        current = max(current, item.end)
        found = True
    return current if found else None


def price_path_label(labels: set[str]) -> str:
    if not labels:
        return "missing"
    if "collector_unchecked" in labels:
        return "collector_unchecked"
    return "+".join(sorted(labels))


def coverage_for_binance(
    symbol: str,
    start: dt.datetime,
    end: dt.datetime,
    archive_root: Path,
    manifest_verified: set[tuple[str, dt.date]],
    data_checks: set[tuple[str, dt.datetime]],
) -> tuple[list[Coverage], str, list[str]]:
    coverage: list[Coverage] = []
    labels: set[str] = set()
    notes: list[str] = []
    for day in iter_days(start, end):
        archive = binance_archive_file(archive_root, symbol, day)
        if archive.exists() and (symbol, day) in manifest_verified:
            coverage.append(Coverage(day_start(day), day_start(day) + dt.timedelta(days=1), "binance_archive"))
            labels.add("binance_archive")
            continue
        for hour in iter_hours(day_start(day), day_start(day) + dt.timedelta(hours=23)):
            path = raw_file(symbol, hour)
            if not path.exists():
                continue
            label = "collector_raw" if (symbol, hour) in data_checks else "collector_unchecked"
            coverage.append(Coverage(hour, hour + dt.timedelta(hours=1), label))
            labels.add(label)
        if not any(c.start.date() == day for c in coverage):
            notes.append(f"missing_price_coverage {symbol} {day.isoformat()}")
    return merge_coverage(coverage), price_path_label(labels), notes


def coverage_for_bybit(symbol: str, start: dt.datetime, end: dt.datetime, root: Path) -> tuple[list[Coverage], str, list[str]]:
    coverage: list[Coverage] = []
    notes: list[str] = []
    for day in iter_days(start, end):
        if bybit_file(root, symbol, day).exists():
            coverage.append(Coverage(day_start(day), day_start(day) + dt.timedelta(days=1), "bybit_public"))
        else:
            notes.append(f"missing_bybit_public {symbol} {day.isoformat()}")
    return merge_coverage(coverage), "bybit_public", notes


def append_trade(times: array, prices: array, t_ms: int, price: float, start_ms: int, end_ms: int) -> bool:
    if t_ms < start_ms or t_ms > end_ms:
        return False
    times.append(int(t_ms))
    prices.append(float(price))
    return True


def sort_window(times: array, prices: array) -> None:
    ordered = sorted(zip(times, prices), key=lambda x: x[0])
    times[:] = array("q", (t for t, _ in ordered))
    prices[:] = array("d", (p for _, p in ordered))


def read_binance_archive(path: Path, start_ms: int, end_ms: int, window: Window) -> None:
    prev_key: tuple[int, int] | None = None
    with zipfile.ZipFile(path) as z:
        name = z.namelist()[0]
        with z.open(name) as raw:
            reader = csv.DictReader((line.decode("utf-8") for line in raw))
            for row in reader:
                t_ms = int(row["transact_time"])
                if t_ms < start_ms:
                    continue
                if t_ms > end_ms:
                    break
                key = (t_ms, int(row["agg_trade_id"]))
                if prev_key is not None and key < prev_key:
                    window.order_violations += 1
                prev_key = key
                append_trade(window.times, window.prices, t_ms, float(row["price"]), start_ms, end_ms)


def read_collector_raw_files(symbol: str, start: dt.datetime, end: dt.datetime, start_ms: int, end_ms: int, window: Window) -> None:
    seen_ids: set[int] = set()
    prev_key: tuple[int, int] | None = None
    for hour in iter_hours(start - dt.timedelta(hours=1), end + dt.timedelta(hours=1)):
        path = raw_file(symbol, hour)
        if not path.exists():
            continue
        with lzma.open(path, "rt") as f:
            for line in f:
                obj = json.loads(line)
                data = obj.get("data") or {}
                if data.get("e") != "aggTrade":
                    continue
                trade_id = int(data["a"])
                t_ms = int(data["T"])
                if t_ms < start_ms or t_ms > end_ms:
                    continue
                if trade_id in seen_ids:
                    window.duplicates += 1
                    continue
                seen_ids.add(trade_id)
                key = (t_ms, trade_id)
                if prev_key is not None and key < prev_key:
                    window.order_violations += 1
                prev_key = key
                append_trade(window.times, window.prices, t_ms, float(data["p"]), start_ms, end_ms)


def read_bybit_file(path: Path, start_ms: int, end_ms: int, window: Window) -> None:
    prev_key: tuple[int, int] | None = None
    with gzip.open(path, "rt") as f:
        reader = csv.DictReader(f)
        for order, row in enumerate(reader):
            t_ms = int(float(row["timestamp"]) * 1000)
            if t_ms < start_ms:
                continue
            if t_ms > end_ms:
                break
            key = (t_ms, order)
            if prev_key is not None and key < prev_key:
                window.order_violations += 1
            prev_key = key
            append_trade(window.times, window.prices, t_ms, float(row["price"]), start_ms, end_ms)


def load_window(
    source: str,
    alert: Alert,
    archive_root: Path,
    bybit_root: Path,
    manifest_verified: set[tuple[str, dt.date]],
    data_checks: set[tuple[str, dt.datetime]],
) -> Window:
    start = alert.alert_time
    end = alert.alert_time + dt.timedelta(seconds=max(DELAYS) + max(TIMEOUTS) + LOAD_SPILL_SECONDS)
    start_ms = int(start.timestamp() * 1000)
    end_ms = int(end.timestamp() * 1000)
    if source == "binance":
        coverage, label, notes = coverage_for_binance(alert.symbol, start, end, archive_root, manifest_verified, data_checks)
    else:
        coverage, label, notes = coverage_for_bybit(alert.symbol, start, end, bybit_root)
    window = Window(price_path=label, notes=notes)
    window.coverage = coverage
    if source == "binance":
        for day in iter_days(start, end):
            archive = binance_archive_file(archive_root, alert.symbol, day)
            if archive.exists() and (alert.symbol, day) in manifest_verified:
                read_binance_archive(archive, start_ms, end_ms, window)
            else:
                read_collector_raw_files(alert.symbol, max(start, day_start(day)), min(end, day_start(day) + dt.timedelta(days=1)), start_ms, end_ms, window)
    else:
        for day in iter_days(start, end):
            path = bybit_file(bybit_root, alert.symbol, day)
            if path.exists():
                read_bybit_file(path, start_ms, end_ms, window)
    if window.order_violations:
        sort_window(window.times, window.prices)
        window.notes.append(f"order_violations_sorted {source} {alert.alert_id} {window.order_violations}")
    if window.duplicates:
        window.notes.append(f"collector_duplicates_deduped {alert.symbol} {alert.alert_id} {window.duplicates}")
    window.covered_until = continuous_covered_until(coverage, start)
    return window


def arrays_from_trades(trades: list[Trade]) -> tuple[array, array]:
    return array("q", (t.time_ms for t in trades)), array("d", (t.price for t in trades))


def trade_r(entry: float, exit_price: float, sl: float) -> float:
    risk = sl - entry
    if risk <= 0:
        return math.nan
    costs = (entry + exit_price) * COST_BPS_PER_SIDE / 10000.0
    return (entry - exit_price - costs) / risk


def select_tps(alert: Alert, tp_mode: str, exit_mode: str) -> tuple[list[tuple[int, float]], int]:
    tps = list(enumerate(alert.tps, start=1))
    if exit_mode != "ladder":
        idx = int(exit_mode[2])
        tps = [(idx, alert.tps[idx - 1])]
    if tp_mode == "corrected":
        kept = [(idx, tp) for idx, tp in tps if tp < alert.mark_logged]
        return kept, len(tps) - len(kept)
    return tps, 0


def base_row(alert: Alert, delay_s: int, timeout_s: int, exit_mode: str, tp_mode: str, price_path: str, covered_until: dt.datetime | None) -> dict[str, str]:
    return {
        "alert_id": alert.alert_id,
        "source_id": alert.source_id,
        "version": alert.version,
        "variant": f"delay={delay_s}s|timeout={timeout_s // 3600}h|exit={exit_mode}",
        "tp_mode": tp_mode,
        "price_path": price_path,
        "entry_time": "",
        "entry_price": "",
        "exit_time": "",
        "exit_price": "",
        "exit_reason": "",
        "R": "",
        "risk_bps": "",
        "covered_until": fmt_time(covered_until),
        "dropped_tps": "0",
    }


def find_entry_index(times: array, entry_after_ms: int) -> int | None:
    for i, t_ms in enumerate(times):
        if t_ms >= entry_after_ms:
            return i
    return None


def finish(row: dict[str, str], reason: str, exit_time_ms: int, r_value: float, exit_price: float) -> dict[str, str]:
    row["exit_time"] = fmt_ms(exit_time_ms)
    row["exit_price"] = f"{exit_price:.12g}"
    row["exit_reason"] = reason
    row["R"] = f"{r_value:.8f}"
    return row


def is_full_path_covered(covered_until: dt.datetime | None, entry_time_ms: int, timeout_s: int) -> bool:
    if covered_until is None:
        return False
    entry_time = dt.datetime.fromtimestamp(entry_time_ms / 1000, tz=UTC)
    return covered_until >= entry_time + dt.timedelta(seconds=timeout_s)


def eval_single(
    alert: Alert,
    times: array | list[Trade],
    prices: array | int,
    delay_s: int | None = None,
    timeout_s: int | None = None,
    exit_mode: str | None = None,
    tp_mode: str | None = None,
    price_path: str | None = None,
    covered_until: dt.datetime | None = None,
) -> dict[str, str]:
    if times and isinstance(times[0], Trade):  # Backward-compatible tests.
        trades = times  # type: ignore[assignment]
        times, prices = arrays_from_trades(trades)  # type: ignore[arg-type]
    assert isinstance(times, array)
    assert isinstance(prices, array)
    assert delay_s is not None and timeout_s is not None and exit_mode is not None and tp_mode is not None and price_path is not None
    row = base_row(alert, delay_s, timeout_s, exit_mode, tp_mode, price_path, covered_until)
    entry_after = alert.alert_time + dt.timedelta(seconds=delay_s)
    entry_i = find_entry_index(times, int(entry_after.timestamp() * 1000))
    if entry_i is None:
        row["exit_reason"] = "no_entry_data"
        return row
    entry_time_ms = times[entry_i]
    entry = prices[entry_i]
    row["entry_time"] = fmt_ms(entry_time_ms)
    row["entry_price"] = f"{entry:.12g}"
    row["risk_bps"] = f"{((alert.sl - entry) / entry * 10000.0):.6f}"
    if entry >= alert.sl:
        row["exit_reason"] = "skipped_sl_before_entry"
        return row
    selected, dropped = select_tps(alert, tp_mode, exit_mode)
    row["dropped_tps"] = str(dropped)
    if exit_mode == "ladder":
        return eval_ladder(row, alert, times, prices, entry_i, selected, timeout_s, covered_until)
    tp = selected[0][1] if selected else None
    return eval_one_target(row, alert, times, prices, entry_i, tp, timeout_s, covered_until)


def eval_one_target(
    row: dict[str, str],
    alert: Alert,
    times: array,
    prices: array,
    entry_i: int,
    tp: float | None,
    timeout_s: int,
    covered_until: dt.datetime | None,
) -> dict[str, str]:
    entry_time_ms = times[entry_i]
    entry = prices[entry_i]
    deadline_ms = entry_time_ms + timeout_s * 1000
    last_i: int | None = None
    for i in range(entry_i + 1, len(times)):
        if times[i] > deadline_ms:
            break
        last_i = i
        price = prices[i]
        if price >= alert.sl:
            return finish(row, "SL", times[i], trade_r(entry, alert.sl, alert.sl), alert.sl)
        if tp is not None and price <= tp:
            return finish(row, "TP", times[i], trade_r(entry, tp, alert.sl), tp)
    if not is_full_path_covered(covered_until, entry_time_ms, timeout_s) or last_i is None:
        row["exit_reason"] = "path_incomplete"
        return row
    return finish(row, "timeout", times[last_i], trade_r(entry, prices[last_i], alert.sl), prices[last_i])


def eval_ladder(
    row: dict[str, str],
    alert: Alert,
    times: array,
    prices: array,
    entry_i: int,
    selected: list[tuple[int, float]],
    timeout_s: int,
    covered_until: dt.datetime | None,
) -> dict[str, str]:
    entry_time_ms = times[entry_i]
    entry = prices[entry_i]
    if selected:
        weight = 1.0 / len(selected)
        open_slices = [{"idx": idx, "tp": tp, "weight": weight} for idx, tp in selected]
    else:
        open_slices = [{"idx": 0, "tp": None, "weight": 1.0}]
    realized: list[float] = []
    deadline_ms = entry_time_ms + timeout_s * 1000
    last_i: int | None = None
    last_event: tuple[str, int, float] | None = None
    for i in range(entry_i + 1, len(times)):
        if times[i] > deadline_ms:
            break
        last_i = i
        price = prices[i]
        if price >= alert.sl:
            for open_slice in open_slices:
                realized.append(open_slice["weight"] * trade_r(entry, alert.sl, alert.sl))
            open_slices = []
            last_event = ("SL", i, alert.sl)
            break
        hit = [s for s in open_slices if s["tp"] is not None and price <= s["tp"]]
        if hit:
            for open_slice in hit:
                realized.append(open_slice["weight"] * trade_r(entry, float(open_slice["tp"]), alert.sl))
            open_slices = [s for s in open_slices if s not in hit]
            last_event = (f"TP{hit[-1]['idx']}", i, price)
            if not open_slices:
                break
    if open_slices:
        if not is_full_path_covered(covered_until, entry_time_ms, timeout_s) or last_i is None:
            row["exit_reason"] = "path_incomplete"
            return row
        for open_slice in open_slices:
            realized.append(open_slice["weight"] * trade_r(entry, prices[last_i], alert.sl))
        last_event = ("timeout", last_i, prices[last_i])
    if last_event is None:
        row["exit_reason"] = "path_incomplete"
        return row
    reason, i, exit_price = last_event
    return finish(row, reason, times[i], sum(realized), exit_price)


def eval_window(alert: Alert, window: Window) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for delay in DELAYS:
        for timeout in TIMEOUTS:
            entry_after = alert.alert_time + dt.timedelta(seconds=delay)
            covered_until = continuous_covered_until(window.coverage, entry_after)
            for exit_mode in EXIT_MODES:
                for tp_mode in TP_MODES:
                    rows.append(eval_single(alert, window.times, window.prices, delay, timeout, exit_mode, tp_mode, window.price_path, covered_until))
    return rows


def evaluate(alerts: list[Alert], args: argparse.Namespace) -> tuple[list[dict[str, str]], list[str], dict[str, list[int]]]:
    manifest_verified = load_manifest(Path(args.manifest))
    data_checks = load_data_checks(Path(args.data_checks_repo))
    notes: list[str] = []
    rows: list[dict[str, str]] = []
    counts: dict[str, list[int]] = {}
    for source in ("binance", "bybit"):
        for alert in alerts:
            window = load_window(source, alert, Path(args.binance_root), Path(args.bybit_root), manifest_verified, data_checks)
            notes.extend(window.notes)
            counts.setdefault(window.price_path, []).append(window.trades_count)
            rows.extend(eval_window(alert, window))
            del window
    return rows, sorted(set(notes)), counts


def alert_order_key(row: dict[str, str]) -> tuple[str, str]:
    return row["entry_time"] or row["covered_until"] or "", row["alert_id"]


def stats(rows: list[dict[str, str]]) -> dict[str, object]:
    tradable = sorted(
        [r for r in rows if r["R"] and r["exit_reason"] not in {"skipped_sl_before_entry", "path_incomplete", "no_entry_data"}],
        key=alert_order_key,
    )
    skipped = len([r for r in rows if r["exit_reason"] in {"skipped_sl_before_entry", "path_incomplete", "no_entry_data"}])
    values = [float(r["R"]) for r in tradable]
    wins = [v for v in values if v > 0]
    losses = [v for v in values if v < 0]
    peak = 0.0
    equity = 0.0
    max_dd = 0.0
    for v in values:
        equity += v
        peak = max(peak, equity)
        max_dd = max(max_dd, peak - equity)
    return {
        "count": len(values),
        "skipped": skipped,
        "winrate": (len(wins) / len(values) if values else math.nan),
        "avg_r": (sum(values) / len(values) if values else math.nan),
        "sum_r": sum(values),
        "pf": "no losses" if values and not losses else ((sum(wins) / abs(sum(losses))) if losses else math.nan),
        "max_dd": max_dd,
    }


def fmt_float(value: object, ndigits: int = 3) -> str:
    if isinstance(value, str):
        return value
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return "NA"
    return f"{float(value):.{ndigits}f}"


def count_summary(counts: dict[str, list[int]]) -> str:
    parts = []
    for path, vals in sorted(counts.items()):
        if vals:
            parts.append(f"{path}:min={min(vals)} median={int(statistics.median(vals))} max={max(vals)}")
    return "; ".join(parts) if parts else "none"


def print_reports(rows: list[dict[str, str]], counts: dict[str, list[int]]) -> None:
    print(f"rows={len(rows)}")
    print(f"trades_per_window {count_summary(counts)}")
    print("target slices: delay=30s timeout=4h exit=TP1-only/ladder")
    target_variants = {"delay=30s|timeout=4h|exit=TP1-only", "delay=30s|timeout=4h|exit=ladder"}
    grouped: dict[tuple[str, str, str, str, str], list[dict[str, str]]] = {}
    for row in rows:
        if row["variant"] in target_variants:
            grouped.setdefault((row["source_id"], row["version"], row["price_path"], row["variant"], row["tp_mode"]), []).append(row)
    for key in sorted(grouped):
        s = stats(grouped[key])
        alerts = ",".join(r["alert_id"] for r in sorted(grouped[key], key=alert_order_key))
        print(
            "|".join(key),
            f"count={s['count']} skipped={s['skipped']} winrate={fmt_float(s['winrate'])} avgR={fmt_float(s['avg_r'])} sumR={fmt_float(s['sum_r'])} PF={fmt_float(s['pf'])} maxDD={fmt_float(s['max_dd'])} alerts={alerts}",
        )
    print("grid all alerts:")
    grid: dict[tuple[str, str, str], list[dict[str, str]]] = {}
    for row in rows:
        grid.setdefault((row["variant"], row["tp_mode"], row["price_path"]), []).append(row)
    for key in sorted(grid):
        s = stats(grid[key])
        print("|".join(key), f"count={s['count']} skipped={s['skipped']} winrate={fmt_float(s['winrate'])} avgR={fmt_float(s['avg_r'])} sumR={fmt_float(s['sum_r'])} PF={fmt_float(s['pf'])} maxDD={fmt_float(s['max_dd'])}")
    target = [r for r in rows if r["variant"] == "delay=30s|timeout=4h|exit=TP1-only" and r["risk_bps"]]
    by_source: dict[str, list[float]] = {}
    for row in target:
        by_source.setdefault(row["source_id"], []).append(float(row["risk_bps"]))
    for source, vals in sorted(by_source.items()):
        print(f"risk_bps {source}: min={min(vals):.3f} median={statistics.median(vals):.3f} max={max(vals):.3f}")
    low = sorted({r["alert_id"] for r in target if float(r["risk_bps"]) < 14.0})
    print("risk_bps_lt_14:", ",".join(low) if low else "none")
    pairs: dict[tuple[str, str, str], dict[str, float]] = {}
    for row in rows:
        if not row["R"]:
            continue
        bucket = pairs.setdefault((row["alert_id"], row["variant"], row["tp_mode"]), {})
        bucket[row["price_path"]] = float(row["R"])
    diffs = []
    for (alert_id, variant, tp_mode), vals in pairs.items():
        bybit = vals.get("bybit_public")
        other = next((v for k, v in vals.items() if k != "bybit_public"), None)
        if bybit is not None and other is not None and abs(other - bybit) > 0.1:
            diffs.append((alert_id, variant, tp_mode, other - bybit))
    print(f"binance_bybit_abs_R_diff_gt_0.1 count={len(diffs)}")
    for alert_id, variant, tp_mode, diff in diffs[:120]:
        print(f"diff {alert_id}|{variant}|{tp_mode}|{diff:.4f}")
    print("edge_note n=18 (12 current-version) is far too small for any edge conclusion")


def write_rows(rows: list[dict[str, str]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)
    os.chmod(path, 0o600)


def probe(args: argparse.Namespace) -> int:
    alerts = [a for a in load_alerts(Path(args.ledger)) if a.symbol == "BTCUSDT"]
    manifest_verified = load_manifest(Path(args.manifest))
    data_checks = load_data_checks(Path(args.data_checks_repo))
    days = {}
    for alert in alerts:
        path = binance_archive_file(Path(args.binance_root), alert.symbol, alert.alert_time.date())
        if path.exists():
            days[alert.alert_time.date()] = path.stat().st_size
    if not days:
        print("probe no BTC alert day has a Binance zip")
        return 1
    largest_day = max(days, key=days.get)
    alert = next(a for a in alerts if a.alert_time.date() == largest_day)
    started = time.monotonic()
    window = load_window("binance", alert, Path(args.binance_root), Path(args.bybit_root), manifest_verified, data_checks)
    wall = time.monotonic() - started
    rss_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    print(f"probe alert={alert.alert_id} day={largest_day.isoformat()} trades={window.trades_count} ru_maxrss_kb={rss_kb} wall_s={wall:.3f} path={window.price_path}")
    if rss_kb > 600 * 1024:
        print("probe_stop peak RSS over 600 MB")
        return 2
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ledger", default="/home/coder/ralph-state/alert-ledger.csv")
    parser.add_argument("--output", default="/home/coder/ralph-state/shadow-trades-a3a.csv")
    parser.add_argument("--binance-root", default="/home/coder/ralph-research-data/binance-vision")
    parser.add_argument("--bybit-root", default="/home/coder/ralph-research-data/bybit-public")
    parser.add_argument("--manifest", default="/home/coder/ralph-research-data/manifest.csv")
    parser.add_argument("--data-checks-repo", default="/home/coder/ralph-data-checks-repo")
    parser.add_argument("--summary-only", action="store_true")
    parser.add_argument("--probe", action="store_true")
    args = parser.parse_args(argv)
    if args.probe:
        return probe(args)
    started = time.monotonic()
    alerts = load_alerts(Path(args.ledger))
    rows, notes, counts = evaluate(alerts, args)
    if not args.summary_only:
        write_rows(rows, Path(args.output))
    rss_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    print(f"alerts={len(alerts)} current_version={sum(1 for a in alerts if not a.version.startswith('unknown-'))} ru_maxrss_kb={rss_kb} wall_s={time.monotonic() - started:.3f}")
    if notes:
        print("coverage_notes=" + "; ".join(notes[:30]))
    print_reports(rows, counts)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
