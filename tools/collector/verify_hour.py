#!/usr/bin/env python3
"""Verify one tape hour against its raw Binance aggTrade messages."""
import argparse
import csv
import gzip
import json
import lzma
import os
import sys
import zlib
from collections import defaultdict


def lines(path):
    opener = lzma.open if path.endswith(".xz") else gzip.open if path.endswith(".gz") else open
    try:
        with opener(path, "rt", encoding="utf-8") as f:
            yield from f
    except (EOFError, OSError, zlib.error):
        return


def minute(ms):
    return ms // 60000


def add(bucket, t_ms, price, qty, sell):
    k = minute(t_ms)
    row = bucket.setdefault(k, {"open": price, "high": price, "low": price, "close": price,
                                "volume": 0.0, "delta": 0.0})
    row["high"] = max(row["high"], price)
    row["low"] = min(row["low"], price)
    row["close"] = price
    row["volume"] += qty
    row["delta"] += -qty if sell else qty


def raw_minutes(path):
    out = {}
    for line in lines(path):
        if "@aggTrade" not in line:
            continue
        m = json.loads(line)
        d = m.get("data", {})
        add(out, int(d["T"]), float(d["p"]), float(d["q"]), bool(d["m"]))
    return out


def tape_minutes(path):
    out = {}
    with (gzip.open(path, "rt", encoding="utf-8") if path.endswith(".gz") else open(path, encoding="utf-8")) as f:
        for row in csv.reader(f, delimiter=";"):
            if len(row) < 9 or row[0] == "Time":
                continue
            sold, bought = float(row[2] or 0), float(row[4] or 0)
            if sold:
                add(out, int(row[8]), float(row[1]), sold, True)
            elif bought:
                add(out, int(row[8]), float(row[5]), bought, False)
    return out


def close(a, b, eps=1e-9):
    return abs(a - b) <= eps


def main():
    ap = argparse.ArgumentParser(description="Verify OHLC/volume/delta per minute from tape equals raw aggTrades.")
    ap.add_argument("--raw", required=True)
    ap.add_argument("--tape", required=True)
    args = ap.parse_args()
    raw, tape = raw_minutes(args.raw), tape_minutes(args.tape)
    bad = []
    for k in sorted(set(raw) | set(tape)):
        r, t = raw.get(k), tape.get(k)
        if r is None or t is None:
            bad.append((k, "missing", r, t))
            continue
        for field in ("open", "high", "low", "close", "volume", "delta"):
            if not close(r[field], t[field]):
                bad.append((k, field, r[field], t[field]))
    if bad:
        print(f"FAIL {os.path.basename(args.tape)} mismatches={len(bad)}")
        for item in bad[:20]:
            print(item)
        sys.exit(1)
    print(f"PASS {os.path.basename(args.tape)} minutes={len(raw)}")


if __name__ == "__main__":
    main()
