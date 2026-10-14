#!/usr/bin/env python3
"""Evaluate fade/follow velocity-alert trades on archived price paths."""

from __future__ import annotations

import argparse
from array import array
import csv
import datetime as dt
import os
from pathlib import Path
import random
from typing import Iterable

import shadow_trades as st


UTC = dt.timezone.utc
DELAYS = (5, 30, 120)
TIMEOUTS = (30 * 60, 60 * 60, 4 * 60 * 60)
SIDES = ("fade", "follow")
TAKER_COST = 0.0007
MAKER_ENTRY = 0.0005
MAKER_EXIT_DEFAULT = 0.0005
MAKER_EXIT_TP = 0.0002
FIELDNAMES = [
    "alert_id",
    "symbol",
    "direction",
    "plan_tradable",
    "side",
    "variant",
    "price_path",
    "entry_time",
    "entry_price",
    "sl",
    "tp",
    "exit_time",
    "exit_price",
    "exit_reason",
    "R",
    "net_bps",
    "net_bps_maker",
    "alert_vs_path_bps",
]


class VelocityAlert:
    def __init__(self, row: dict[str, str]) -> None:
        self.alert_id = row["alert_id"]
        self.symbol_label = row["symbol"]
        self.symbol = f"{row['symbol']}USDT"
        self.direction = row["direction"]
        self.plan_tradable = row["plan_tradable"]
        self.alert_time = parse_time(row["event_time_utc"])
        self.alert_price = float(row["alert_price"])


def parse_time(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(UTC)


def fmt_ms(value_ms: int | None) -> str:
    if value_ms is None:
        return ""
    return dt.datetime.fromtimestamp(value_ms / 1000, UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def fmt_num(value: float | None) -> str:
    if value is None:
        return ""
    return f"{value:.12g}"


def read_alerts(path: Path) -> list[VelocityAlert]:
    with path.open(newline="") as f:
        return [VelocityAlert(row) for row in csv.DictReader(f)]


def required_days(alert: VelocityAlert) -> set[dt.date]:
    end = alert.alert_time + dt.timedelta(seconds=max(DELAYS), hours=4)
    days = set()
    day = alert.alert_time.date()
    while day <= end.date():
        days.add(day)
        day += dt.timedelta(days=1)
    return days


def load_verified_binance(manifest: Path) -> set[tuple[str, dt.date]]:
    return st.load_manifest(manifest)


def has_bybit(bybit_root: Path, symbol: str, day: dt.date) -> bool:
    return st.bybit_file(bybit_root, symbol, day).exists()


def complete_for_both_paths(alert: VelocityAlert, manifest_verified: set[tuple[str, dt.date]], bybit_root: Path) -> bool:
    for day in required_days(alert):
        if (alert.symbol, day) not in manifest_verified:
            return False
        if not has_bybit(bybit_root, alert.symbol, day):
            return False
    return True


def pick_complete_alerts(alerts: list[VelocityAlert], count: int, manifest_verified: set[tuple[str, dt.date]], bybit_root: Path) -> list[VelocityAlert]:
    eligible = [a for a in alerts if complete_for_both_paths(a, manifest_verified, bybit_root)]
    by_symbol: dict[str, list[VelocityAlert]] = {}
    for alert in eligible:
        by_symbol.setdefault(alert.symbol_label, []).append(alert)
    picked: list[VelocityAlert] = []
    while len(picked) < count:
        changed = False
        for symbol in sorted(by_symbol):
            if by_symbol[symbol] and len(picked) < count:
                picked.append(by_symbol[symbol].pop(0))
                changed = True
        if not changed:
            break
    return picked


def shadow_alert(alert: VelocityAlert) -> st.Alert:
    return st.Alert(alert.alert_id, "velocity", "v3", alert.alert_time, alert.symbol, alert.alert_price, 0.0, (0.0, 0.0, 0.0))


def load_price_window(source: str, alert: VelocityAlert, args: argparse.Namespace, manifest_verified: set[tuple[str, dt.date]]) -> st.Window:
    return st.load_window(
        source,
        shadow_alert(alert),
        Path(args.binance_root),
        Path(args.bybit_root),
        manifest_verified,
        set(),
    )


def first_index_at_or_after(times: array, target_ms: int) -> int | None:
    for i, t_ms in enumerate(times):
        if t_ms >= target_ms:
            return i
    return None


def side_direction(alert_direction: str, mode: str) -> str:
    if mode == "fade":
        return "SHORT" if alert_direction == "UP" else "LONG"
    return "LONG" if alert_direction == "UP" else "SHORT"


def signed(side: str) -> int:
    return 1 if side == "LONG" else -1


def levels(entry: float, side: str) -> tuple[float, float]:
    if side == "LONG":
        return entry * (1 - 0.005), entry * (1 + 0.003)
    return entry * (1 + 0.005), entry * (1 - 0.003)


def net_values(entry: float, exit_price: float, sl: float, side: str, reason: str, costs: float | None = None) -> tuple[float, float, float]:
    if costs is None:
        costs = TAKER_COST
    s = signed(side)
    numerator = s * (exit_price - entry) - (entry + exit_price) * costs
    risk = abs(sl - entry)
    r_value = numerator / risk if risk else float("nan")
    net_bps = numerator / entry * 10000.0
    exit_cost = MAKER_EXIT_TP if reason == "TP" else MAKER_EXIT_DEFAULT
    maker_num = s * (exit_price - entry) - entry * MAKER_ENTRY - exit_price * exit_cost
    maker_bps = maker_num / entry * 10000.0
    return r_value, net_bps, maker_bps


def base_row(alert: VelocityAlert, mode: str, variant: str, price_path: str, alert_vs_path_bps: float | None) -> dict[str, str]:
    return {
        "alert_id": alert.alert_id,
        "symbol": alert.symbol_label,
        "direction": alert.direction,
        "plan_tradable": alert.plan_tradable,
        "side": mode,
        "variant": variant,
        "price_path": price_path,
        "entry_time": "",
        "entry_price": "",
        "sl": "",
        "tp": "",
        "exit_time": "",
        "exit_price": "",
        "exit_reason": "",
        "R": "",
        "net_bps": "",
        "net_bps_maker": "",
        "alert_vs_path_bps": fmt_num(alert_vs_path_bps),
    }


def eval_variant(
    alert: VelocityAlert,
    times: array,
    prices: array,
    covered_until: dt.datetime | None,
    mode: str,
    delay_s: int,
    timeout_s: int,
    price_path: str,
    alert_vs_path_bps: float | None,
) -> dict[str, str]:
    variant = f"{delay_s}s|{timeout_s // 60}m"
    row = base_row(alert, mode, variant, price_path, alert_vs_path_bps)
    entry_i = first_index_at_or_after(times, int((alert.alert_time + dt.timedelta(seconds=delay_s)).timestamp() * 1000))
    if entry_i is None:
        row["exit_reason"] = "no_entry"
        return row
    entry_time_ms = times[entry_i]
    entry = prices[entry_i]
    side = side_direction(alert.direction, mode)
    sl, tp = levels(entry, side)
    row["entry_time"] = fmt_ms(entry_time_ms)
    row["entry_price"] = fmt_num(entry)
    row["sl"] = fmt_num(sl)
    row["tp"] = fmt_num(tp)
    deadline_ms = entry_time_ms + timeout_s * 1000
    last_i: int | None = None
    for i in range(entry_i + 1, len(times)):
        if times[i] > deadline_ms:
            break
        last_i = i
        price = prices[i]
        if side == "LONG":
            if price <= sl:
                return finish(row, entry, price, times[i], sl, side, "SL")
            if price >= tp:
                return finish(row, entry, tp, times[i], sl, side, "TP")
        else:
            if price >= sl:
                return finish(row, entry, price, times[i], sl, side, "SL")
            if price <= tp:
                return finish(row, entry, tp, times[i], sl, side, "TP")
    if covered_until is None or covered_until < dt.datetime.fromtimestamp(deadline_ms / 1000, UTC) or last_i is None:
        row["exit_reason"] = "path_incomplete"
        return row
    return finish(row, entry, prices[last_i], times[last_i], sl, side, "timeout")


def finish(row: dict[str, str], entry: float, exit_price: float, exit_time_ms: int, sl: float, side: str, reason: str) -> dict[str, str]:
    r_value, net_bps, maker_bps = net_values(entry, exit_price, sl, side, reason)
    row["exit_time"] = fmt_ms(exit_time_ms)
    row["exit_price"] = fmt_num(exit_price)
    row["exit_reason"] = reason
    row["R"] = f"{r_value:.8f}"
    row["net_bps"] = f"{net_bps:.6f}"
    row["net_bps_maker"] = f"{maker_bps:.6f}"
    return row


def eval_window(alert: VelocityAlert, window: st.Window) -> list[dict[str, str]]:
    event_i = first_index_at_or_after(window.times, int(alert.alert_time.timestamp() * 1000))
    alert_vs_path_bps = None
    if event_i is not None:
        alert_vs_path_bps = (window.prices[event_i] - alert.alert_price) / alert.alert_price * 10000.0
    rows = []
    for mode in SIDES:
        for delay_s in DELAYS:
            for timeout_s in TIMEOUTS:
                entry_after = alert.alert_time + dt.timedelta(seconds=delay_s)
                covered_until = st.continuous_covered_until(window.coverage, entry_after)
                rows.append(eval_variant(alert, window.times, window.prices, covered_until, mode, delay_s, timeout_s, window.price_path, alert_vs_path_bps))
    return rows


def evaluate(alerts: Iterable[VelocityAlert], args: argparse.Namespace) -> tuple[list[dict[str, str]], list[str]]:
    manifest_verified = load_verified_binance(Path(args.manifest))
    rows: list[dict[str, str]] = []
    used: list[str] = []
    for alert in alerts:
        used.append(alert.alert_id)
        for source in ("binance", "bybit"):
            window = load_price_window(source, alert, args, manifest_verified)
            rows.extend(eval_window(alert, window))
    return rows, used


def write_rows(rows: list[dict[str, str]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)
    os.chmod(path, 0o600)


def summarize(rows: list[dict[str, str]], used: list[str], sample_seed: int, sample_n: int) -> None:
    print(f"alerts_used={len(used)} " + ",".join(used))
    print(f"rows={len(rows)}")
    counts: dict[tuple[str, str], int] = {}
    for row in rows:
        counts[(row["price_path"], row["exit_reason"])] = counts.get((row["price_path"], row["exit_reason"]), 0) + 1
    for (path, reason), count in sorted(counts.items()):
        print(f"exit_reason {path}|{reason} {count}")
    rng = random.Random(sample_seed)
    for row in rng.sample(rows, min(sample_n, len(rows))):
        print("sample_row " + ",".join(f"{field}={row[field]}" for field in FIELDNAMES))


def build_parser() -> argparse.ArgumentParser:
    home = Path.home()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--alerts", type=Path, default=home / "ralph-state" / "velocity-alerts.csv")
    parser.add_argument("--output", type=Path, default=home / "ralph-state" / "velocity-trades.csv")
    parser.add_argument("--binance-root", default=str(home / "ralph-research-data/binance-vision"))
    parser.add_argument("--bybit-root", default=str(home / "ralph-research-data/bybit-public"))
    parser.add_argument("--manifest", default=str(home / "ralph-research-data/manifest.csv"))
    parser.add_argument("--complete-both-limit", type=int, default=0)
    parser.add_argument("--sample-seed", type=int, default=42)
    parser.add_argument("--sample-rows", type=int, default=6)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    alerts = read_alerts(args.alerts)
    if args.complete_both_limit:
        alerts = pick_complete_alerts(alerts, args.complete_both_limit, load_verified_binance(Path(args.manifest)), Path(args.bybit_root))
    rows, used = evaluate(alerts, args)
    write_rows(rows, args.output)
    summarize(rows, used, args.sample_seed, args.sample_rows)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
