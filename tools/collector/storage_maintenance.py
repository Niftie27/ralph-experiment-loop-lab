#!/usr/bin/env python3
"""Lossless storage maintenance for finished RALPH collector hours.

Actions are dry-run by default. Use --apply only after reviewing the printed list.
"""
import argparse
import gzip
import hashlib
import lzma
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone


def sha_lines(path):
    h = hashlib.sha256()
    opener = lzma.open if path.endswith(".xz") or path.endswith(".xz.tmp") else gzip.open if path.endswith(".gz") or path.endswith(".gz.tmp") else open
    with opener(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def hour_end(name):
    hour = name.split("_")[-1]
    hour = hour.removesuffix(".csv").removesuffix(".gz").removesuffix(".xz").removesuffix(".jsonl")
    return datetime.strptime(hour, "%Y-%m-%dT%HZ").replace(tzinfo=timezone.utc).timestamp() + 3600


def finished(path, grace_min):
    return datetime.now(timezone.utc).timestamp() > hour_end(os.path.basename(path)) + grace_min * 60


def run(cmd):
    subprocess.check_call(cmd)


def log_error(message):
    print(f"ERROR {message}", file=sys.stderr)


def remove_tmp(path):
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


def verify_and_replace(kind, source, tmp, output):
    source_sha = sha_lines(source)
    output_sha = sha_lines(tmp)
    if source_sha != output_sha:
        log_error(f"{kind} verification failed for {source} source_sha256={source_sha} output_sha256={output_sha}")
        remove_tmp(tmp)
        return False
    os.replace(tmp, output)
    os.remove(source)
    print(f"VERIFIED {kind} {source} -> {output} source_sha256={source_sha} output_sha256={output_sha}")
    return True


def gzip_tape(path, apply):
    out = path + ".gz"
    if os.path.exists(out):
        return []
    actions = [f"gzip tape {path} -> {out}"]
    if apply:
        tmp = out + ".tmp"
        with open(path, "rb") as src, gzip.open(tmp, "wb", compresslevel=6) as dst:
            shutil.copyfileobj(src, dst, 1024 * 1024)
        verify_and_replace("gzip_tape", path, tmp, out)
    return actions


def xz_raw(path, apply):
    out = path.removesuffix(".gz") + ".xz"
    if os.path.exists(out):
        return []
    actions = [f"xz raw {path} -> {out}"]
    if apply:
        tmp = out + ".tmp"
        with open(tmp, "wb") as dst:
            gzip_proc = subprocess.Popen(["gzip", "-cd", path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            xz_proc = subprocess.Popen(
                ["nice", "-n", "19", "ionice", "-c", "3", "xz", "-6", "-c"],
                stdin=gzip_proc.stdout,
                stdout=dst,
                stderr=subprocess.PIPE,
            )
            gzip_proc.stdout.close()
            _, xz_stderr = xz_proc.communicate()
            gzip_stderr = gzip_proc.stderr.read()
            gzip_rc = gzip_proc.wait()
            if gzip_rc != 0 or xz_proc.returncode != 0:
                remove_tmp(tmp)
                log_error(
                    f"xz_raw compression failed for {path} gzip_rc={gzip_rc} xz_rc={xz_proc.returncode} "
                    f"gzip_stderr={gzip_stderr.decode(errors='replace').strip()} "
                    f"xz_stderr={xz_stderr.decode(errors='replace').strip()}"
                )
                return actions
        verify_and_replace("xz_raw", path, tmp, out)
    return actions


def pending_hours(data_dir, symbol, grace_min):
    hours = {}
    for name in sorted(os.listdir(data_dir)):
        path = os.path.join(data_dir, name)
        if name.startswith(f"tape_{symbol}_") and name.endswith(".csv") and finished(path, grace_min):
            hour = name.removeprefix(f"tape_{symbol}_").removesuffix(".csv")
            hours.setdefault(hour, {})["tape"] = path
        if name.startswith(f"raw_{symbol}_") and name.endswith(".jsonl.gz") and finished(path, grace_min):
            hour = name.removeprefix(f"raw_{symbol}_").removesuffix(".jsonl.gz")
            hours.setdefault(hour, {})["raw"] = path
    return sorted(hours.items())


def has_verified_outputs(data_dir, features_dir, symbol, raw_path):
    hour = os.path.basename(raw_path).removeprefix(f"raw_{symbol}_").removesuffix(".jsonl.gz").removesuffix(".jsonl.xz")
    tape = os.path.join(data_dir, f"tape_{symbol}_{hour}.csv")
    tape_gz = tape + ".gz"
    book = os.path.join(data_dir, f"book_{symbol}_{hour}.jsonl.gz")
    book_xz = os.path.join(data_dir, f"book_{symbol}_{hour}.jsonl.xz")
    if not (os.path.exists(tape) or os.path.exists(tape_gz)):
        return False
    if not (os.path.exists(book) or os.path.exists(book_xz)):
        return False
    if not os.path.exists(os.path.join(features_dir, "events.jsonl")):
        return False
    return True


def retention_candidates(data_dir, features_dir, symbol, days):
    cutoff = datetime.now(timezone.utc).timestamp() - days * 86400
    out = []
    for name in sorted(os.listdir(data_dir)):
        if not name.startswith(f"raw_{symbol}_") or not (name.endswith(".jsonl.gz") or name.endswith(".jsonl.xz")):
            continue
        path = os.path.join(data_dir, name)
        if hour_end(name) < cutoff and has_verified_outputs(data_dir, features_dir, symbol, path):
            out.append(path)
    return out


def main():
    ap = argparse.ArgumentParser(description="Compress finished tape/raw hours and report raw retention candidates.")
    ap.add_argument("--symbol", required=True)
    ap.add_argument("--data", required=True)
    ap.add_argument("--features", required=True)
    ap.add_argument("--grace-min", type=int, default=15)
    ap.add_argument("--retention-days", type=int, default=14)
    ap.add_argument("--max-hours", type=int, default=0, help="limit compression to the oldest N finished hours; 0 means no limit")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--delete-raw", action="store_true", help="delete retention candidates; only use after dry-run approval")
    args = ap.parse_args()
    symbol = args.symbol.upper()
    actions = []
    hours = pending_hours(args.data, symbol, args.grace_min)
    if args.max_hours > 0:
        hours = hours[:args.max_hours]
    for _, paths in hours:
        if "tape" in paths:
            actions += gzip_tape(paths["tape"], args.apply)
        if "raw" in paths:
            actions += xz_raw(paths["raw"], args.apply)
    print("ACTIONS")
    for action in actions:
        print(action)
    candidates = retention_candidates(args.data, args.features, symbol, args.retention_days)
    print("RAW_RETENTION_CANDIDATES")
    for path in candidates:
        print(path)
    if args.apply and args.delete_raw:
        for path in candidates:
            os.remove(path)
            print(f"DELETED {path}")


if __name__ == "__main__":
    main()
