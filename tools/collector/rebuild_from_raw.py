#!/usr/bin/env python3
"""Rebuild tape files and engine outputs from raw files without deleting old outputs."""
import argparse
import gzip
import json
import os
import shutil
import subprocess
import sys
import zlib
from datetime import datetime, timezone

import binance_live
from symbol_settings import for_symbol


def hour_from_name(path, symbol):
    name = os.path.basename(path)
    return name.removeprefix(f"raw_{symbol}_").removesuffix(".jsonl.gz").removesuffix(".jsonl.xz")


def hour_start_ms(hour):
    return int(datetime.strptime(hour, "%Y-%m-%dT%HZ").replace(tzinfo=timezone.utc).timestamp() * 1000)


def bound_ms(value):
    if not value:
        return None
    text = value.replace("Z", "+00:00")
    if text.endswith("+00:00"):
        dt = datetime.fromisoformat(text)
    else:
        dt = datetime.fromisoformat(text).replace(tzinfo=timezone.utc)
    return int(dt.timestamp() * 1000)


def engine_bound(value):
    if not value:
        return None
    dt = datetime.fromtimestamp(bound_ms(value) / 1000, tz=timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M")


def is_complete(hour):
    end = datetime.strptime(hour, "%Y-%m-%dT%HZ").replace(tzinfo=timezone.utc).timestamp() + 3600
    return datetime.now(timezone.utc).timestamp() > end + 900


def raw_files(data_dir, symbol, since=None, until=None):
    since_ms = bound_ms(since)
    until_ms = bound_ms(until)
    files = []
    for name in os.listdir(data_dir):
        if name.startswith(f"raw_{symbol}_") and (name.endswith(".jsonl.gz") or name.endswith(".jsonl.xz")):
            hour = hour_from_name(name, symbol)
            start_ms = hour_start_ms(hour)
            end_ms = start_ms + 3_600_000
            if since_ms is not None and end_ms <= since_ms:
                continue
            if until_ms is not None and start_ms >= until_ms:
                continue
            if is_complete(hour):
                files.append(os.path.join(data_dir, name))
    return sorted(files)


def read_raw(path):
    opener = gzip.open if path.endswith(".gz") else __import__("lzma").open
    try:
        with opener(path, "rt", encoding="utf-8") as f:
            for line in f:
                if "@aggTrade" not in line:
                    continue
                yield json.loads(line)["data"]
    except (EOFError, OSError, zlib.error):
        return


def archive_name():
    return datetime.now(timezone.utc).strftime("run_%Y%m%dT%H%M%SZ")


def move_existing(paths, rounded_dir, run_id=None):
    target_dir = os.path.join(rounded_dir, run_id or archive_name())
    os.makedirs(target_dir, exist_ok=True)
    for path in paths:
        if os.path.exists(path):
            shutil.move(path, os.path.join(target_dir, os.path.basename(path)))


def rebuild_tapes(data_dir, symbol, settings, since=None, until=None, run_id=None):
    moved = []
    for raw in raw_files(data_dir, symbol, since, until):
        hour = hour_from_name(raw, symbol)
        tape = os.path.join(data_dir, f"tape_{symbol}_{hour}.csv")
        old = [p for p in (tape, tape + ".gz") if os.path.exists(p)]
        move_existing(old, os.path.join(data_dir, "tape_rounded"), run_id)
        if old:
            moved.extend(old)
        trades = {}
        for t in read_raw(raw):
            trades[int(t["a"])] = t
        rec = binance_live.Recorder(data_dir, symbol, settings)
        rec._write_sorted(tape, trades)
    return moved


def move_features(features_dir, run_id=None):
    moved = []
    rounded = os.path.join(features_dir, "engine_rounded")
    for name in os.listdir(features_dir) if os.path.isdir(features_dir) else []:
        if name == "live.json" or name == "live.json.tmp" or name.startswith("live_"):
            continue
        path = os.path.join(features_dir, name)
        if os.path.isfile(path):
            move_existing([path], rounded, run_id)
            moved.append(path)
    return moved


def main():
    ap = argparse.ArgumentParser(description="Rebuild completed tape hours and engine output from raw data.")
    ap.add_argument("--symbol", required=True)
    ap.add_argument("--data", required=True)
    ap.add_argument("--features", required=True)
    ap.add_argument("--since")
    ap.add_argument("--until")
    ap.add_argument("--tapes-only", action="store_true", help="rebuild tapes only; do not move or rebuild engine outputs")
    args = ap.parse_args()
    symbol = args.symbol.upper()
    settings = for_symbol(symbol)
    run_id = archive_name()
    moved = rebuild_tapes(args.data, symbol, settings, args.since, args.until, run_id)
    if not args.tapes_only:
        moved += move_features(args.features, run_id)
    cmd = [sys.executable, os.path.join(os.path.dirname(__file__), "orderflow_engine.py"),
           "--symbol", symbol, "--data", args.data, "--out", args.features]
    if args.since:
        cmd += ["--from", engine_bound(args.since)]
    if args.until:
        cmd += ["--to", engine_bound(args.until)]
    print("MOVED_TO_ROUNDED")
    for path in moved:
        print(path)
    if args.tapes_only:
        print("TAPES_ONLY: skipped engine move/rebuild")
        return
    print("RUN", " ".join(cmd))
    subprocess.check_call(cmd)


if __name__ == "__main__":
    main()
