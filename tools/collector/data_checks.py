#!/usr/bin/env python3
"""Write hourly RALPH data-quality checks into repo data-checks CSV files."""
import argparse
import csv
import gzip
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from trade_time_tapes import (  # noqa: E402
    load_tape_trades,
    minute_bars,
    parse_raw_hour_from_path,
    raw_path,
    read_lines,
    shift_hour,
)

COLUMNS = [
    "symbol",
    "hour",
    "first_aggTrade_id",
    "last_aggTrade_id",
    "trade_count",
    "missing_id_count",
    "tape_sha256",
    "verify",
]

DEFAULT_SYMBOLS = {
    "BTCUSDT": ("~/data/binance", "~/data/features"),
    "ETHUSDT": ("~/data/binance-ethusdt", "~/data/features-ethusdt"),
    "SOLUSDT": ("~/data/binance-solusdt", "~/data/features-solusdt"),
    "HYPEUSDT": ("~/data/binance-hypeusdt", "~/data/features-hypeusdt"),
}


def compact_trade(data):
    return {
        "T": int(data["T"]),
        "p": data["p"],
        "q": data["q"],
        "m": bool(data["m"]),
    }


def expand(path):
    return os.path.abspath(os.path.expanduser(path))


def hour_end_ts(hour):
    return datetime.strptime(hour, "%Y-%m-%dT%HZ").replace(tzinfo=timezone.utc).timestamp() + 3600


def raw_finished(data_dir, symbol, hour, grace_min):
    path = raw_path(data_dir, symbol, hour)
    if not path:
        return False
    return datetime.now(timezone.utc).timestamp() > hour_end_ts(hour) + grace_min * 60


def available_hours(data_dir, symbol):
    prefix = f"raw_{symbol}_"
    hours = set()
    for name in os.listdir(data_dir):
        if not name.startswith(prefix):
            continue
        if name.endswith(".jsonl.gz"):
            hours.add(name.removeprefix(prefix).removesuffix(".jsonl.gz"))
        elif name.endswith(".jsonl.xz"):
            hours.add(name.removeprefix(prefix).removesuffix(".jsonl.xz"))
    return sorted(hours)


def raw_files(data_dir, symbol):
    prefix = f"raw_{symbol}_"
    out = []
    for name in os.listdir(data_dir):
        if name.startswith(prefix) and (name.endswith(".jsonl.gz") or name.endswith(".jsonl.xz")):
            out.append(os.path.join(data_dir, name))
    return sorted(out)


def tape_path(data_dir, symbol, hour):
    base = os.path.join(data_dir, f"tape_{symbol}_{hour}.csv")
    plain = os.path.exists(base)
    gz = os.path.exists(base + ".gz")
    if plain and gz:
        raise RuntimeError(f"both plain and gz tape exist for {symbol} {hour}")
    if plain:
        return base
    if gz:
        return base + ".gz"
    raise FileNotFoundError(f"missing tape for {symbol} {hour}")


def content_sha256(path):
    opener = gzip.open if path.endswith(".gz") else open
    h = hashlib.sha256()
    with opener(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def close(a, b, eps=1e-9):
    return abs(a - b) <= eps


def verify_tape(data_dir, symbol, hour, tape):
    raw_trades = load_raw_trades(data_dir, symbol, hour)
    return verify_tape_with_raw(raw_trades, tape)


def verify_tape_with_raw(raw_trades, tape):
    tape_trades = load_tape_trades(tape)
    raw_ids, tape_ids = set(raw_trades), set(tape_trades)
    if raw_ids != tape_ids:
        return "FAIL"
    raw, tape_bars = minute_bars(raw_trades), minute_bars(tape_trades)
    for key in set(raw) | set(tape_bars):
        r, t = raw.get(key), tape_bars.get(key)
        if r is None or t is None:
            return "FAIL"
        for field in ("open", "high", "low", "close", "volume", "delta"):
            if not close(r[field], t[field]):
                return "FAIL"
    return "PASS"


def load_raw_trades(data_dir, symbol, hour):
    start = int(datetime.strptime(hour, "%Y-%m-%dT%HZ").replace(tzinfo=timezone.utc).timestamp() * 1000)
    end = start + 3_600_000
    trades = {}
    for raw_hour in (shift_hour(hour, -1), hour, shift_hour(hour, 1)):
        path = raw_path(data_dir, symbol, raw_hour)
        if not path:
            if raw_hour == hour or raw_hour == shift_hour(hour, 1):
                raise FileNotFoundError(f"missing raw file for {symbol} {raw_hour}")
            continue
        for line in read_lines(path):
            if "@aggTrade" not in line:
                continue
            try:
                data = json.loads(line).get("data", {})
                trade_time = int(data["T"])
                if start <= trade_time < end:
                    trades[int(data["a"])] = compact_trade(data)
            except (KeyError, TypeError, ValueError, json.JSONDecodeError):
                continue
    return trades


def indexed_raw_trades(data_dir, symbol):
    by_hour = {}
    for path in raw_files(data_dir, symbol):
        try:
            _data_dir, _symbol, receive_hour = parse_raw_hour_from_path(path)
        except ValueError:
            continue
        allowed = {shift_hour(receive_hour, -1), receive_hour, shift_hour(receive_hour, 1)}
        for line in read_lines(path):
            if "@aggTrade" not in line:
                continue
            try:
                data = json.loads(line).get("data", {})
                trade_hour = datetime.fromtimestamp(int(data["T"]) / 1000, tz=timezone.utc).strftime("%Y-%m-%dT%HZ")
                if trade_hour in allowed:
                    by_hour.setdefault(trade_hour, {})[int(data["a"])] = compact_trade(data)
            except (KeyError, TypeError, ValueError, json.JSONDecodeError):
                continue
    return by_hour


def check_hour(data_dir, symbol, hour):
    raw_trades = load_raw_trades(data_dir, symbol, hour)
    return row_for_hour(data_dir, symbol, hour, raw_trades)


def row_for_hour(data_dir, symbol, hour, raw_trades):
    ids = sorted(raw_trades)
    first_id = ids[0] if ids else ""
    last_id = ids[-1] if ids else ""
    missing = 0 if not ids else (last_id - first_id + 1 - len(ids))
    tape = tape_path(data_dir, symbol, hour)
    try:
        verify = verify_tape_with_raw(raw_trades, tape)
    except Exception:
        verify = "FAIL"
    return {
        "symbol": symbol,
        "hour": hour,
        "first_aggTrade_id": first_id,
        "last_aggTrade_id": last_id,
        "trade_count": len(ids),
        "missing_id_count": missing,
        "tape_sha256": content_sha256(tape),
        "verify": verify,
    }


def check_symbol(data_dir, symbol, grace_min, completed=None, use_index=False):
    completed = completed or set()
    rows = []
    raw_index = indexed_raw_trades(data_dir, symbol) if use_index else None
    for hour in available_hours(data_dir, symbol):
        if (symbol, hour) in completed:
            continue
        next_hour = shift_hour(hour, 1)
        if not raw_finished(data_dir, symbol, next_hour, grace_min):
            continue
        if raw_index is None:
            rows.append(check_hour(data_dir, symbol, hour))
        else:
            rows.append(row_for_hour(data_dir, symbol, hour, raw_index.get(hour, {})))
    return rows


def read_existing(path):
    rows = {}
    if not os.path.exists(path):
        return rows
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows[(row["symbol"], row["hour"])] = row
    return rows


def existing_keys(repo):
    keys = set()
    checks_dir = os.path.join(repo, "data-checks")
    if not os.path.isdir(checks_dir):
        return keys
    for name in os.listdir(checks_dir):
        if name.endswith(".csv"):
            keys.update(read_existing(os.path.join(checks_dir, name)))
    return keys


def write_day(path, rows):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    ordered = [rows[key] for key in sorted(rows)]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(ordered)


def write_rows(repo, rows):
    by_day = {}
    for row in rows:
        day = row["hour"][:10]
        by_day.setdefault(day, []).append(row)
    changed = []
    for day, new_rows in by_day.items():
        path = os.path.join(repo, "data-checks", f"{day}.csv")
        existing = read_existing(path)
        before = {key: dict(value) for key, value in existing.items()}
        for row in new_rows:
            existing[(row["symbol"], row["hour"])] = {key: str(row[key]) for key in COLUMNS}
        if existing != before:
            write_day(path, existing)
            changed.append(path)
    return changed


def git_commit_push(repo, paths):
    if not paths:
        print("GIT no changes")
        return
    subprocess.check_call(["git", "-C", repo, "add", "--", "data-checks/"])
    diff = subprocess.run(["git", "-C", repo, "diff", "--cached", "--quiet", "--", "data-checks/"])
    if diff.returncode == 0:
        print("GIT no staged changes")
        return
    subprocess.check_call(["git", "-C", repo, "commit", "-m", "Update hourly data checks", "--", "data-checks/"])
    subprocess.check_call(["git", "-C", repo, "push", "origin", "main"])


def main():
    ap = argparse.ArgumentParser(description="Backfill/update hourly data-check CSVs.")
    ap.add_argument("--repo", default=".", help="repo root that receives data-checks/YYYY-MM-DD.csv")
    ap.add_argument("--grace-min", type=int, default=15)
    ap.add_argument("--commit-push", action="store_true", help="commit and push changed data-check CSVs")
    ap.add_argument("--symbol", action="append", help="limit to symbol; may be repeated")
    ap.add_argument("--all", action="store_true", help="recheck all finished hours instead of only missing rows")
    args = ap.parse_args()
    repo = expand(args.repo)
    symbols = args.symbol or list(DEFAULT_SYMBOLS)
    if args.commit_push:
        subprocess.check_call(["git", "-C", repo, "pull", "--rebase", "origin", "main"])
    completed = set() if args.all else existing_keys(repo)
    rows, failures = [], []
    for symbol in symbols:
        data_dir, _features_dir = DEFAULT_SYMBOLS[symbol]
        data_dir = expand(data_dir)
        try:
            for row in check_symbol(data_dir, symbol, args.grace_min, completed, use_index=args.all):
                rows.append(row)
                if row["missing_id_count"] != 0 or row["verify"] != "PASS":
                    failures.append(row)
        except Exception as err:
            failures.append({"symbol": symbol, "error": str(err)})
    changed = write_rows(repo, rows)
    print(f"ROWS {len(rows)} CHANGED_FILES {len(changed)}")
    for path in changed:
        print(path)
    if failures:
        print("FAILURES")
        for row in failures:
            print(row)
    if args.commit_push:
        git_commit_push(repo, changed)
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
