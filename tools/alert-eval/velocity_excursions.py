#!/usr/bin/env python3
"""Build per-alert velocity excursion rows from Binance USD-M archives."""

from __future__ import annotations

import argparse
from array import array
from bisect import bisect_left, bisect_right
import csv
import datetime as dt
import math
import os
from collections import OrderedDict
from pathlib import Path
from typing import Iterable

import shadow_trades as st


UTC = dt.timezone.utc
HORIZONS = (10, 30, 60, 120, 300, 900, 1800)
THRESHOLDS_BPS = (5, 10, 20, 30, 50, 75, 100, 150, 200)
PRE_WINDOWS = (60, 300, 1800)
MAX_CACHE_DAYS = 3


BASE_FIELDS = [
    "alert_id",
    "symbol",
    "direction",
    "plan_tradable",
    "t0",
    "p0_time",
    "p0",
    "coverage_ok",
]
HORIZON_FIELDS = [name for h in HORIZONS for name in (f"drift_{h}", f"mfe_{h}", f"mae_{h}")]
THRESHOLD_FIELDS = [name for x in THRESHOLDS_BPS for name in (f"fav_ms_{x}", f"adv_ms_{x}")]
PRE_FIELDS = ["pre_range_1m", "pre_range_5m", "pre_range_30m", "pre_rv_5m", "n_trades_30m"]
FIELDNAMES = BASE_FIELDS + HORIZON_FIELDS + THRESHOLD_FIELDS + PRE_FIELDS


class VelocityAlert:
    def __init__(self, row: dict[str, str]) -> None:
        self.alert_id = row["alert_id"]
        self.symbol_label = row["symbol"]
        self.symbol = f"{row['symbol']}USDT"
        self.direction = row["direction"]
        self.plan_tradable = row["plan_tradable"]
        self.t0 = parse_time(row["event_time_utc"])
        self.alert_price = float(row["alert_price"])


class ArchiveCache:
    def __init__(self, root: Path, manifest_verified: set[tuple[str, dt.date]], max_days: int = MAX_CACHE_DAYS) -> None:
        self.root = root
        self.manifest_verified = manifest_verified
        self.max_days = max_days
        self.days: OrderedDict[tuple[str, dt.date], tuple[array, array] | None] = OrderedDict()

    def is_verified(self, symbol: str, day: dt.date) -> bool:
        return (symbol, day) in self.manifest_verified and st.binance_archive_file(self.root, symbol, day).exists()

    def get_day(self, symbol: str, day: dt.date) -> tuple[array, array] | None:
        key = (symbol, day)
        if key in self.days:
            self.days.move_to_end(key)
            return self.days[key]
        if not self.is_verified(symbol, day):
            value = None
        else:
            window = st.Window(price_path="binance_archive")
            start = st.day_start(day)
            start_ms = int(start.timestamp() * 1000)
            end_ms = int((start + dt.timedelta(days=1)).timestamp() * 1000) - 1
            st.read_binance_archive(st.binance_archive_file(self.root, symbol, day), start_ms, end_ms, window)
            st.check_window_order_and_duplicates("binance", f"{symbol}-{day.isoformat()}", window)
            value = (window.times, window.prices)
        self.days[key] = value
        while len(self.days) > self.max_days:
            self.days.popitem(last=False)
        return value


def parse_time(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


def fmt_ms(value_ms: int | None) -> str:
    if value_ms is None:
        return ""
    return dt.datetime.fromtimestamp(value_ms / 1000, UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def fmt_num(value: float | None) -> str:
    if value is None or math.isnan(value):
        return ""
    if abs(value) < 1e-12:
        value = 0.0
    return f"{value:.12g}"


def read_alerts(path: Path) -> list[VelocityAlert]:
    with path.open(newline="") as f:
        alerts = [VelocityAlert(row) for row in csv.DictReader(f)]
    return sorted(alerts, key=lambda a: (a.symbol, a.t0, a.alert_id))


def read_only_ids(path: Path | None) -> set[str] | None:
    if path is None:
        return None
    ids: set[str] = set()
    with path.open(newline="") as f:
        sample = f.read(4096)
        f.seek(0)
        if "," in sample.splitlines()[0]:
            for row in csv.DictReader(f):
                if row.get("alert_id"):
                    ids.add(row["alert_id"])
        else:
            for line in f:
                line = line.strip()
                if line:
                    ids.add(line)
    return ids


def iter_days_ms(start_ms: int, end_ms: int) -> Iterable[dt.date]:
    current = dt.datetime.fromtimestamp(start_ms / 1000, UTC).date()
    last = dt.datetime.fromtimestamp(end_ms / 1000, UTC).date()
    while current <= last:
        yield current
        current += dt.timedelta(days=1)


def interval_verified(cache: ArchiveCache, symbol: str, start_ms: int, end_ms: int) -> bool:
    if end_ms < start_ms:
        return True
    return all(cache.is_verified(symbol, day) for day in iter_days_ms(start_ms, end_ms))


def gather_trades(cache: ArchiveCache, symbol: str, start_ms: int, end_ms: int, include_end: bool = True) -> tuple[array, array]:
    times = array("q")
    prices = array("d")
    for day in iter_days_ms(start_ms, end_ms):
        loaded = cache.get_day(symbol, day)
        if loaded is None:
            continue
        day_times, day_prices = loaded
        left = bisect_left(day_times, start_ms)
        right = bisect_right(day_times, end_ms) if include_end else bisect_left(day_times, end_ms)
        times.extend(day_times[left:right])
        prices.extend(day_prices[left:right])
    return times, prices


def base_row(alert: VelocityAlert, coverage_ok: bool) -> dict[str, str]:
    row = {
        "alert_id": alert.alert_id,
        "symbol": alert.symbol_label,
        "direction": alert.direction,
        "plan_tradable": alert.plan_tradable,
        "t0": alert.t0.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "p0_time": "",
        "p0": "",
        "coverage_ok": "y" if coverage_ok else "n",
    }
    for field in FIELDNAMES:
        row.setdefault(field, "")
    return row


def movement_bps(direction: str, p0: float, price: float) -> float:
    sign = 1.0 if direction == "UP" else -1.0
    return sign * (price - p0) / p0 * 10000.0


def compute_pre_rv_5m(times: array, prices: array, start_ms: int, end_ms: int) -> float | None:
    if not times:
        return None
    per_second: dict[int, float] = {}
    for t_ms, price in zip(times, prices):
        sec = t_ms // 1000
        per_second[sec] = price
    start_sec = start_ms // 1000
    end_sec = (end_ms - 1) // 1000
    last: float | None = None
    series: list[float] = []
    for sec in range(start_sec, end_sec + 1):
        if sec in per_second:
            last = per_second[sec]
        if last is not None:
            series.append(last)
    if len(series) < 2:
        return None
    total = 0.0
    for prev, cur in zip(series, series[1:]):
        if prev:
            total += ((cur - prev) / prev) ** 2
    return math.sqrt(total) * 10000.0


def build_excursion_row(
    alert: VelocityAlert,
    future_times: array,
    future_prices: array,
    pre_times: array,
    pre_prices: array,
    coverage_ok: bool,
    pre_covered: bool,
) -> dict[str, str]:
    row = base_row(alert, coverage_ok)
    t0_ms = int(alert.t0.timestamp() * 1000)
    p0_i = bisect_left(future_times, t0_ms)
    if p0_i >= len(future_times):
        return row
    p0_time = future_times[p0_i]
    p0 = future_prices[p0_i]
    row["p0_time"] = fmt_ms(p0_time)
    row["p0"] = fmt_num(p0)

    moves = [movement_bps(alert.direction, p0, price) for price in future_prices]
    for horizon_s in HORIZONS:
        end_ms = t0_ms + horizon_s * 1000
        end_i = bisect_right(future_times, end_ms)
        if end_i <= p0_i:
            continue
        horizon_moves = moves[p0_i:end_i]
        row[f"drift_{horizon_s}"] = fmt_num(horizon_moves[-1])
        row[f"mfe_{horizon_s}"] = fmt_num(max(horizon_moves))
        row[f"mae_{horizon_s}"] = fmt_num(min(horizon_moves))

    search_end_i = bisect_right(future_times, t0_ms + 1800 * 1000)
    for threshold in THRESHOLDS_BPS:
        fav_ms: int | None = None
        adv_ms: int | None = None
        for t_ms, move in zip(future_times[p0_i:search_end_i], moves[p0_i:search_end_i]):
            elapsed = int(t_ms - p0_time)
            if fav_ms is None and move >= threshold:
                fav_ms = elapsed
            if adv_ms is None and move <= -threshold:
                adv_ms = elapsed
            if fav_ms is not None and adv_ms is not None:
                break
        row[f"fav_ms_{threshold}"] = "" if fav_ms is None else str(fav_ms)
        row[f"adv_ms_{threshold}"] = "" if adv_ms is None else str(adv_ms)

    row["n_trades_30m"] = str(search_end_i - p0_i)
    if pre_covered:
        for seconds, field in ((60, "pre_range_1m"), (300, "pre_range_5m"), (1800, "pre_range_30m")):
            start = t0_ms - seconds * 1000
            left = bisect_left(pre_times, start)
            right = bisect_left(pre_times, t0_ms)
            vals = pre_prices[left:right]
            if vals:
                row[field] = fmt_num((max(vals) - min(vals)) / p0 * 10000.0)
        rv_start = t0_ms - 300 * 1000
        left = bisect_left(pre_times, rv_start)
        right = bisect_left(pre_times, t0_ms)
        rv = compute_pre_rv_5m(pre_times[left:right], pre_prices[left:right], rv_start, t0_ms)
        row["pre_rv_5m"] = fmt_num(rv)
    return row


def evaluate_alert(alert: VelocityAlert, cache: ArchiveCache) -> dict[str, str]:
    t0_ms = int(alert.t0.timestamp() * 1000)
    future_end_ms = t0_ms + 1800 * 1000
    coverage_end_ms = t0_ms + 1801 * 1000
    pre_start_ms = t0_ms - 1800 * 1000
    coverage_ok = interval_verified(cache, alert.symbol, t0_ms, coverage_end_ms)
    pre_covered = interval_verified(cache, alert.symbol, pre_start_ms, t0_ms - 1)
    future_times, future_prices = gather_trades(cache, alert.symbol, t0_ms, future_end_ms)
    pre_times, pre_prices = gather_trades(cache, alert.symbol, pre_start_ms, t0_ms - 1)
    return build_excursion_row(alert, future_times, future_prices, pre_times, pre_prices, coverage_ok, pre_covered)


def evaluate(alerts: Iterable[VelocityAlert], args: argparse.Namespace) -> list[dict[str, str]]:
    manifest_verified = st.load_manifest(Path(args.manifest))
    cache = ArchiveCache(Path(args.binance_root), manifest_verified)
    rows = []
    for alert in alerts:
        rows.append(evaluate_alert(alert, cache))
    return rows


def write_rows(rows: list[dict[str, str]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)
    os.chmod(path, 0o600)


def summarize(rows: list[dict[str, str]], elapsed_seconds: float) -> None:
    counts: dict[str, int] = {}
    for row in rows:
        counts[row["coverage_ok"]] = counts.get(row["coverage_ok"], 0) + 1
    print(f"rows={len(rows)}")
    print("coverage_ok " + " ".join(f"{key}={counts[key]}" for key in sorted(counts)))
    if rows:
        print(f"seconds_per_alert={elapsed_seconds / len(rows):.6f}")


def build_parser() -> argparse.ArgumentParser:
    home = Path.home()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--alerts", type=Path, default=home / "ralph-state" / "velocity-alerts.csv")
    parser.add_argument("--output", type=Path, default=home / "ralph-state" / "velocity-excursions.csv")
    parser.add_argument("--binance-root", default=str(home / "ralph-research-data/binance-vision"))
    parser.add_argument("--manifest", default=str(home / "ralph-research-data/manifest.csv"))
    parser.add_argument("--only-ids", type=Path)
    return parser


def main(argv: list[str] | None = None) -> int:
    import time

    args = build_parser().parse_args(argv)
    alerts = read_alerts(args.alerts)
    only_ids = read_only_ids(args.only_ids)
    if only_ids is not None:
        alerts = [alert for alert in alerts if alert.alert_id in only_ids]
    started = time.monotonic()
    rows = evaluate(alerts, args)
    write_rows(rows, args.output)
    summarize(rows, time.monotonic() - started)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
