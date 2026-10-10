#!/usr/bin/env python3
"""Verify one tape hour against Binance raw aggTrade messages by trade time."""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from trade_time_tapes import (  # noqa: E402
    load_raw_trades_for_trade_hour,
    load_tape_trades,
    minute_bars,
    parse_raw_hour_from_path,
)


def close(a, b, eps=1e-9):
    return abs(a - b) <= eps


def hour_from_tape(path):
    name = os.path.basename(path)
    stem = name.removesuffix(".csv.gz").removesuffix(".csv")
    if not stem.startswith("tape_"):
        raise ValueError(f"not a tape file: {path}")
    _, symbol, hour = stem.split("_", 2)
    return symbol, hour


def main():
    ap = argparse.ArgumentParser(description="Verify tape aggTrade IDs and minute bars from trade-time raw aggTrades.")
    ap.add_argument("--raw", help="raw file for the target hour; adjacent H-1/H/H+1 files are loaded from the same directory")
    ap.add_argument("--data", help="raw/tape data directory")
    ap.add_argument("--symbol")
    ap.add_argument("--hour")
    ap.add_argument("--tape", required=True)
    args = ap.parse_args()
    if args.raw:
        data_dir, symbol, hour = parse_raw_hour_from_path(args.raw)
    else:
        data_dir = args.data or os.path.dirname(args.tape)
        symbol, hour = args.symbol, args.hour
        if not symbol or not hour:
            symbol, hour = hour_from_tape(args.tape)
    raw_trades = load_raw_trades_for_trade_hour(data_dir, symbol, hour, require_next=True)
    tape_trades = load_tape_trades(args.tape)
    raw_ids, tape_ids = set(raw_trades), set(tape_trades)
    if raw_ids != tape_ids:
        missing = sorted(raw_ids - tape_ids)[:20]
        extra = sorted(tape_ids - raw_ids)[:20]
        print(
            f"FAIL {os.path.basename(args.tape)} id_set raw={len(raw_ids)} tape={len(tape_ids)} "
            f"missing={len(raw_ids - tape_ids)} extra={len(tape_ids - raw_ids)}"
        )
        if missing:
            print("missing_ids", missing)
        if extra:
            print("extra_ids", extra)
        sys.exit(1)
    raw, tape = minute_bars(raw_trades), minute_bars(tape_trades)
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
    print(f"PASS {os.path.basename(args.tape)} ids={len(raw_ids)} minutes={len(raw)}")


if __name__ == "__main__":
    main()
