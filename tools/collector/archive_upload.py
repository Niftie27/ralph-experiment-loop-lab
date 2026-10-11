#!/usr/bin/env python3
"""Upload verified finished collector hours to the Storage Box archive."""
import argparse
import csv
import fcntl
import hashlib
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone


DEFAULT_SYMBOLS = {
    "BTCUSDT": ("~/data/binance", "~/data/features"),
    "ETHUSDT": ("~/data/binance-ethusdt", "~/data/features-ethusdt"),
    "SOLUSDT": ("~/data/binance-solusdt", "~/data/features-solusdt"),
    "HYPEUSDT": ("~/data/binance-hypeusdt", "~/data/features-hypeusdt"),
}
KINDS = ("raw", "tape", "book")
STATE_COLUMNS = [
    "verified_at_utc",
    "symbol",
    "hour",
    "kind",
    "remote_path",
    "size_bytes",
    "local_sha256",
    "remote_sha256",
    "status",
]
HOUR_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}Z$")


@dataclass(frozen=True)
class ArchiveFile:
    symbol: str
    hour: str
    kind: str
    local_path: str
    remote_dir: str
    remote_path: str
    size_bytes: int


class ArchiveError(Exception):
    pass


class RealRemote:
    def __init__(self):
        self.upload_results = []

    def _run(self, cmd, check=True):
        return subprocess.run(cmd, text=True, capture_output=True, check=check)

    def mkdir_p(self, remote_dir):
        try:
            self._run(["ssh", "storagebox", "mkdir", "-p", remote_dir])
            return
        except subprocess.CalledProcessError:
            parts = remote_dir.split("/")
            current = []
            for part in parts:
                current.append(part)
                self._run(["ssh", "storagebox", "mkdir", "-p", "/".join(current)])

    def exists(self, remote_path):
        result = self._run(["ssh", "storagebox", "stat", remote_path], check=False)
        return result.returncode == 0

    def sha256(self, remote_path):
        result = self._run(["ssh", "storagebox", "sha256sum", remote_path])
        return result.stdout.split()[0]

    def upload(self, local_path, remote_dir):
        cmd = [
            "rsync",
            "-a",
            "--ignore-existing",
            "--partial-dir=.rsync-partial",
            "--bwlimit=20000",
            "--stats",
            "-e",
            "ssh -o BatchMode=yes",
            local_path,
            f"storagebox:{remote_dir}/",
        ]
        started = time.monotonic()
        result = self._run(cmd)
        elapsed = time.monotonic() - started
        self.upload_results.append(
            {
                "local_path": local_path,
                "remote_dir": remote_dir,
                "elapsed_seconds": elapsed,
                "stdout": result.stdout,
                "stderr": result.stderr,
            }
        )
        return self.upload_results[-1]


def utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def expand(path):
    return os.path.abspath(os.path.expanduser(path))


def parse_hour_end_ts(hour):
    if not HOUR_RE.match(hour):
        raise ValueError(f"invalid hour: {hour}")
    return datetime.strptime(hour, "%Y-%m-%dT%HZ").replace(tzinfo=timezone.utc).timestamp() + 3600


def file_sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def finished_hour(hour, now_ts, grace_min):
    return now_ts > parse_hour_end_ts(hour) + grace_min * 60


def old_enough(path, now_ts, mtime_min):
    return now_ts > os.path.getmtime(path) + mtime_min * 60


def candidate_paths(data_dir, symbol, now_ts=None, grace_min=30, mtime_min=15):
    now_ts = time.time() if now_ts is None else now_ts
    hours = {}
    prefix = {
        "raw": f"raw_{symbol}_",
        "tape": f"tape_{symbol}_",
        "book": f"book_{symbol}_",
    }
    suffix = {
        "raw": ".jsonl.xz",
        "tape": ".csv.gz",
        "book": ".jsonl.gz",
    }
    for name in sorted(os.listdir(data_dir)):
        if name.endswith(".tmp"):
            continue
        for kind in KINDS:
            if not name.startswith(prefix[kind]) or not name.endswith(suffix[kind]):
                continue
            hour = name.removeprefix(prefix[kind]).removesuffix(suffix[kind])
            path = os.path.join(data_dir, name)
            if finished_hour(hour, now_ts, grace_min) and old_enough(path, now_ts, mtime_min):
                hours.setdefault(hour, {})[kind] = path
    out = []
    for hour in sorted(hours):
        paths = hours[hour]
        if all(kind in paths for kind in KINDS):
            day = hour[:10]
            for kind in KINDS:
                remote_kind = "raw" if kind == "raw" else "derived"
                remote_dir = f"ralph/{remote_kind}/{symbol}/{day}"
                remote_path = f"{remote_dir}/{os.path.basename(paths[kind])}"
                out.append(
                    ArchiveFile(
                        symbol=symbol,
                        hour=hour,
                        kind=kind,
                        local_path=paths[kind],
                        remote_dir=remote_dir,
                        remote_path=remote_path,
                        size_bytes=os.path.getsize(paths[kind]),
                    )
                )
    return out


def group_hours(files):
    hours = {}
    for item in files:
        hours.setdefault((item.symbol, item.hour), []).append(item)
    return [(key, sorted(value, key=lambda x: KINDS.index(x.kind))) for key, value in sorted(hours.items())]


def read_passed(state_path):
    passed = set()
    if not os.path.exists(state_path):
        return passed
    with open(state_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("status") == "PASS":
                passed.add(row.get("remote_path"))
    return passed


def append_state_rows(state_path, rows):
    os.makedirs(os.path.dirname(state_path), exist_ok=True)
    exists = os.path.exists(state_path)
    with open(state_path, "a+", newline="", encoding="utf-8") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        if not exists or os.path.getsize(state_path) == 0:
            writer = csv.DictWriter(f, fieldnames=STATE_COLUMNS)
            writer.writeheader()
        writer = csv.DictWriter(f, fieldnames=STATE_COLUMNS)
        for row in rows:
            writer.writerow(row)
        f.flush()
        os.fsync(f.fileno())
        fcntl.flock(f, fcntl.LOCK_UN)


def dry_run_report(files, state_path):
    passed = read_passed(state_path)
    totals = {}
    for item in files:
        if item.remote_path in passed:
            continue
        key = (item.symbol, item.kind)
        count, size = totals.get(key, (0, 0))
        totals[key] = (count + 1, size + item.size_bytes)
    total_bytes = sum(size for _, size in totals.values())
    print("DRY_RUN")
    for symbol in sorted({item.symbol for item in files}):
        for kind in KINDS:
            count, size = totals.get((symbol, kind), (0, 0))
            print(f"{symbol} {kind} count={count} bytes={size}")
    print(f"TOTAL bytes={total_bytes} gb={total_bytes / 1_000_000_000:.6f}")


def limit_hours(files, limit):
    if not limit:
        return files
    selected = []
    for _key, hour_files in group_hours(files)[:limit]:
        selected.extend(hour_files)
    return selected


def upload_files(files, state_path, remote):
    passed = read_passed(state_path)
    rows = []
    failed = False
    uploads = 0
    skipped = 0
    verified_existing = 0
    for item in files:
        if item.remote_path in passed:
            skipped += 1
            continue
        local_sha = file_sha256(item.local_path)
        remote.mkdir_p(item.remote_dir)
        existed = remote.exists(item.remote_path)
        if not existed:
            remote.upload(item.local_path, item.remote_dir)
            uploads += 1
        remote_sha = remote.sha256(item.remote_path)
        status = "PASS" if local_sha == remote_sha else "FAIL"
        if existed and status == "PASS":
            verified_existing += 1
        if status != "PASS":
            failed = True
        row = {
            "verified_at_utc": utc_now(),
            "symbol": item.symbol,
            "hour": item.hour,
            "kind": item.kind,
            "remote_path": item.remote_path,
            "size_bytes": str(item.size_bytes),
            "local_sha256": local_sha,
            "remote_sha256": remote_sha,
            "status": status,
        }
        rows.append(row)
        print(
            f"{status} {item.symbol} {item.hour} {item.kind} "
            f"size={item.size_bytes} remote={item.remote_path} sha256={remote_sha}"
        )
    if rows:
        append_state_rows(state_path, rows)
    print(f"SUMMARY uploads={uploads} verified_existing={verified_existing} skipped_pass={skipped} new_rows={len(rows)}")
    if failed:
        raise ArchiveError("one or more archive hashes did not match")
    return rows


def selected_files(symbols, data_dirs, state_path, limit, now_ts=None):
    all_files = []
    for symbol in symbols:
        files = candidate_paths(data_dirs[symbol], symbol, now_ts=now_ts)
        files = [item for item in files if item.remote_path not in read_passed(state_path)]
        all_files.extend(limit_hours(files, limit))
    return all_files


def parse_args(argv=None):
    ap = argparse.ArgumentParser(description="Upload finished RALPH collector hours to Storage Box.")
    ap.add_argument("--symbol", action="append", choices=sorted(DEFAULT_SYMBOLS), help="symbol to upload; repeatable")
    ap.add_argument("--state", default="~/ralph-state/archive-files.csv")
    ap.add_argument("--limit", type=int, default=0, help="upload at most N complete hours per selected symbol")
    ap.add_argument("--dry-run", action="store_true", help="print local upload counts without network calls")
    for symbol, (data_dir, _features_dir) in DEFAULT_SYMBOLS.items():
        ap.add_argument(f"--data-{symbol.lower()}", default=data_dir)
    return ap.parse_args(argv)


def main(argv=None, remote=None):
    args = parse_args(argv)
    symbols = args.symbol or sorted(DEFAULT_SYMBOLS)
    state_path = expand(args.state)
    data_dirs = {symbol: expand(getattr(args, f"data_{symbol.lower()}")) for symbol in DEFAULT_SYMBOLS}
    files = selected_files(symbols, data_dirs, state_path, args.limit)
    if args.dry_run:
        dry_run_report(files, state_path)
        return 0
    try:
        upload_files(files, state_path, remote or RealRemote())
    except ArchiveError as err:
        print(f"ERROR {err}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
