#!/usr/bin/env python3
"""Lossless storage maintenance for finished RALPH collector hours.

Actions are dry-run by default. Use --apply only after reviewing the printed list.
"""
import argparse
import csv
import gzip
import hashlib
import json
import lzma
import os
import shutil
import subprocess
import sys
from datetime import datetime, timedelta, timezone


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


def shift_hour(hour, delta):
    start = datetime.strptime(hour, "%Y-%m-%dT%HZ").replace(tzinfo=timezone.utc)
    return (start + timedelta(hours=delta)).strftime("%Y-%m-%dT%HZ")


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
        try:
            with open(path, "rb") as src, gzip.open(tmp, "wb", compresslevel=6) as dst:
                shutil.copyfileobj(src, dst, 1024 * 1024)
            verify_and_replace("gzip_tape", path, tmp, out)
        except Exception as err:
            remove_tmp(tmp)
            log_error(f"gzip_tape failed for {path}: {err}")
    return actions


def xz_raw(path, apply):
    out = path.removesuffix(".gz") + ".xz"
    if os.path.exists(out):
        return []
    actions = [f"xz raw {path} -> {out}"]
    if apply:
        tmp = out + ".tmp"
        try:
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
        except Exception as err:
            remove_tmp(tmp)
            log_error(f"xz_raw failed for {path}: {err}")
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


def file_sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def raw_hour(symbol, raw_path):
    return os.path.basename(raw_path).removeprefix(f"raw_{symbol}_").removesuffix(".jsonl.gz").removesuffix(".jsonl.xz")


def read_data_check(repo, symbol, hour):
    path = os.path.join(repo, "data-checks", f"{hour[:10]}.csv")
    if not os.path.exists(path):
        return None
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("symbol") == symbol and row.get("hour") == hour:
                return row
    return None


def read_archive_check(repo, symbol, hour):
    path = os.path.join(repo, "data-checks", "archive-verified.csv")
    if not os.path.exists(path):
        return None
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("symbol") == symbol and row.get("hour") == hour:
                return row
    return None


def test_compressed(path):
    if path.endswith(".gz"):
        return subprocess.run(["gzip", "-t", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
    if path.endswith(".xz"):
        return subprocess.run(["xz", "-t", path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
    return os.path.exists(path)


def retention_status(data_dir, repo, symbol, raw_path):
    hour = raw_hour(symbol, raw_path)
    tape = os.path.join(data_dir, f"tape_{symbol}_{hour}.csv")
    tape_gz = tape + ".gz"
    book = os.path.join(data_dir, f"book_{symbol}_{hour}.jsonl.gz")
    book_xz = os.path.join(data_dir, f"book_{symbol}_{hour}.jsonl.xz")
    reasons = []
    row = read_data_check(repo, symbol, hour)
    next_row = read_data_check(repo, symbol, shift_hour(hour, 1))
    tape_file = tape_gz if os.path.exists(tape_gz) else tape if os.path.exists(tape) else None
    book_file = book_xz if os.path.exists(book_xz) else book if os.path.exists(book) else None
    archive = read_archive_check(repo, symbol, hour)
    if not row:
        reasons.append("missing_data_check_h")
    elif row.get("missing_id_count") != "0" or row.get("verify") != "PASS":
        reasons.append(f"bad_data_check_h missing={row.get('missing_id_count')} verify={row.get('verify')}")
    if not next_row:
        reasons.append("missing_data_check_h_plus_1")
    if not tape_file:
        reasons.append("missing_tape")
    elif row and sha_lines(tape_file) != row.get("tape_sha256"):
        reasons.append("tape_sha_mismatch")
    if not book_file:
        reasons.append("missing_book")
    elif not test_compressed(book_file):
        reasons.append("book_compression_invalid")
    if not archive:
        reasons.append("missing_storagebox_archive_verification")
    else:
        local_raw_sha = file_sha256(raw_path)
        if archive.get("status") != "PASS" or archive.get("raw_sha256") != local_raw_sha or archive.get("remote_sha256") != local_raw_sha:
            reasons.append("bad_storagebox_archive_verification")
    return {"path": raw_path, "hour": hour, "ok": not reasons, "reasons": reasons, "row": row}


def retention_candidates(data_dir, repo, symbol, days):
    cutoff = datetime.now(timezone.utc).timestamp() - days * 86400
    out = []
    for name in sorted(os.listdir(data_dir)):
        if not name.startswith(f"raw_{symbol}_") or not (name.endswith(".jsonl.gz") or name.endswith(".jsonl.xz")):
            continue
        path = os.path.join(data_dir, name)
        if hour_end(name) < cutoff:
            status = retention_status(data_dir, repo, symbol, path)
            if status["ok"]:
                out.append(status)
    return out


def retention_report(data_dir, repo, symbol, days):
    cutoff = datetime.now(timezone.utc).timestamp() - days * 86400
    rows = []
    for name in sorted(os.listdir(data_dir)):
        if not name.startswith(f"raw_{symbol}_") or not (name.endswith(".jsonl.gz") or name.endswith(".jsonl.xz")):
            continue
        path = os.path.join(data_dir, name)
        status = retention_status(data_dir, repo, symbol, path)
        if hour_end(name) >= cutoff:
            status["ok"] = False
            status["reasons"] = ["not_older_than_retention_days"] + status["reasons"]
        rows.append(status)
    return rows


def main():
    ap = argparse.ArgumentParser(description="Compress finished tape/raw hours and report raw retention candidates.")
    ap.add_argument("--symbol", required=True)
    ap.add_argument("--data", required=True)
    ap.add_argument("--features", required=True)
    ap.add_argument("--repo", default="~/ralph-experiment-loop-lab")
    ap.add_argument("--grace-min", type=int, default=15)
    ap.add_argument("--retention-days", type=int, default=7)
    ap.add_argument("--max-hours", type=int, default=0, help="limit compression to the oldest N finished hours; 0 means no limit")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--delete-raw", action="store_true", help="delete retention candidates; only use after dry-run approval")
    args = ap.parse_args()
    symbol = args.symbol.upper()
    repo = os.path.abspath(os.path.expanduser(args.repo))
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
    report = retention_report(args.data, repo, symbol, args.retention_days)
    candidates = [row for row in report if row["ok"]]
    print("RAW_RETENTION_CANDIDATES")
    for row in candidates:
        print(row["path"])
    print("RAW_RETENTION_REPORT")
    for row in report:
        reason = "OK" if row["ok"] else ";".join(row["reasons"])
        print(f"{row['hour']} {row['path']} {reason}")
    if args.apply and args.delete_raw:
        for row in candidates:
            path = row["path"]
            size = os.path.getsize(path)
            os.remove(path)
            print(f"DELETED {path} size={size} data_check={json.dumps(row['row'], sort_keys=True)}")


if __name__ == "__main__":
    main()
