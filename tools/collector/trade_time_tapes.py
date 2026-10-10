#!/usr/bin/env python3
"""Shared trade-time tape helpers for Binance raw/tape files."""
import csv
import gzip
import json
import lzma
import os
import zlib
from datetime import datetime, timedelta, timezone


def read_lines(path):
    opener = lzma.open if path.endswith(".xz") else gzip.open if path.endswith(".gz") else open
    try:
        with opener(path, "rt", encoding="utf-8") as f:
            yield from f
    except (EOFError, OSError, zlib.error):
        return


def hour_start_ms(hour):
    return int(datetime.strptime(hour, "%Y-%m-%dT%HZ").replace(tzinfo=timezone.utc).timestamp() * 1000)


def hour_key_from_ms(ms):
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime("%Y-%m-%dT%HZ")


def shift_hour(hour, delta):
    start = datetime.strptime(hour, "%Y-%m-%dT%HZ").replace(tzinfo=timezone.utc)
    return (start + timedelta(hours=delta)).strftime("%Y-%m-%dT%HZ")


def raw_path(data_dir, symbol, hour):
    base = os.path.join(data_dir, f"raw_{symbol}_{hour}.jsonl")
    for suffix in (".xz", ".gz"):
        path = base + suffix
        if os.path.exists(path):
            return path
    return None


def parse_raw_hour_from_path(path):
    name = os.path.basename(path)
    if not name.startswith("raw_"):
        raise ValueError(f"not a raw file: {path}")
    stem = name.removesuffix(".jsonl.gz").removesuffix(".jsonl.xz")
    prefix, symbol, hour = stem.split("_", 2)
    if prefix != "raw":
        raise ValueError(f"not a raw file: {path}")
    return os.path.dirname(path), symbol, hour


def adjacent_raw_paths(data_dir, symbol, hour):
    return [
        raw_path(data_dir, symbol, shift_hour(hour, -1)),
        raw_path(data_dir, symbol, hour),
        raw_path(data_dir, symbol, shift_hour(hour, 1)),
    ]


def load_raw_trades_for_trade_hour(data_dir, symbol, hour, require_next=True):
    start = hour_start_ms(hour)
    end = start + 3_600_000
    paths = adjacent_raw_paths(data_dir, symbol, hour)
    if paths[1] is None:
        raise FileNotFoundError(f"missing raw file for {symbol} {hour}")
    if require_next and paths[2] is None:
        raise FileNotFoundError(f"missing next raw file for {symbol} {hour}; cannot close trade-time boundary")
    trades = {}
    for path in [p for p in paths if p]:
        for line in read_lines(path):
            if "@aggTrade" not in line:
                continue
            try:
                data = json.loads(line).get("data", {})
                trade_time = int(data["T"])
                if start <= trade_time < end:
                    trades[int(data["a"])] = data
            except (KeyError, TypeError, ValueError, json.JSONDecodeError):
                continue
    return trades


def load_tape_trades(path):
    trades = {}
    opener = gzip.open if path.endswith(".gz") else open
    with opener(path, "rt", encoding="utf-8") as f:
        for row in csv.reader(f, delimiter=";"):
            if len(row) < 9 or row[0] == "Time":
                continue
            try:
                sold, bought = float(row[2] or 0), float(row[4] or 0)
                agg_id, trade_time = int(row[7]), int(row[8])
            except ValueError:
                continue
            if sold:
                trades[agg_id] = {"a": agg_id, "T": trade_time, "p": row[1], "q": row[2], "m": True}
            elif bought:
                trades[agg_id] = {"a": agg_id, "T": trade_time, "p": row[5], "q": row[4], "m": False}
    return trades


def minute(ms):
    return ms // 60000


def add_minute(bucket, t_ms, price, qty, sell):
    key = minute(t_ms)
    row = bucket.setdefault(
        key,
        {"open": price, "high": price, "low": price, "close": price, "volume": 0.0, "delta": 0.0},
    )
    row["high"] = max(row["high"], price)
    row["low"] = min(row["low"], price)
    row["close"] = price
    row["volume"] += qty
    row["delta"] += -qty if sell else qty


def minute_bars(trades):
    out = {}
    for agg_id in sorted(trades, key=lambda key: (int(trades[key]["T"]), key)):
        t = trades[agg_id]
        add_minute(out, int(t["T"]), float(t["p"]), float(t["q"]), bool(t["m"]))
    return out
