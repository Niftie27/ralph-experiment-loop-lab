#!/usr/bin/env python3
"""Inspect raw openInterest freshness independently of the collector."""
import argparse
import gzip
import json
import lzma
import math
import os
import re
import resource
import subprocess
import tempfile
import time
import zlib
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path


DAY_MS = 24 * 60 * 60 * 1000
SYMBOL_RE = re.compile(r"[A-Z0-9]+", re.ASCII)
READ_ERRORS = (gzip.BadGzipFile, zlib.error, lzma.LZMAError)


def iso_ms(value):
    if value is None:
        return "none"
    return datetime.fromtimestamp(value / 1000, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def format_age(age_s):
    if age_s is None:
        return "none"
    if age_s < 120:
        return f"{age_s}s"
    if age_s < 7200:
        return f"{age_s // 60}m"
    if age_s < 172800:
        return f"{age_s // 3600}h{age_s % 3600 // 60:02d}m"
    return f"{age_s // 86400}d{age_s % 86400 // 3600:02d}h"


def positive_int(value):
    return type(value) is int and value > 0


def valid_record(line, symbol, now_ms):
    try:
        row = json.loads(line)
        if not isinstance(row, dict):
            return None
        recv = row.get("recv_ms")
        data = row.get("data")
        if (row.get("src") != "rest"
                or row.get("stream") != f"{symbol.lower()}@openInterest"
                or not positive_int(recv) or recv > now_ms + 60000
                or not isinstance(data, dict) or data.get("symbol") != symbol
                or not positive_int(data.get("time"))):
            return None
        oi = float(data["openInterest"])
        return recv if math.isfinite(oi) and oi > 0 else None
    except (ValueError, TypeError, KeyError, OverflowError):
        return None


@dataclass
class Observation:
    symbol: str
    last: int | None = None
    age_s: int | None = None
    state: str = "STALE"
    valid: int = 0
    invalid: int = 0
    read_errors: int = 0
    truncated: int = 0
    files: list = field(default_factory=list)
    raw_written_s: int | None = None
    error: tuple | None = None


def hour_candidates(directory, symbol, hour):
    """List again on a conversion race; this is also the test race hook."""
    names = set(os.listdir(directory))
    stem = f"raw_{symbol}_{hour:%Y-%m-%dT%HZ}.jsonl"
    return [directory / (stem + suffix) for suffix in (".gz", ".xz", "")
            if stem + suffix in names]


def open_raw(path):
    if path.suffix == ".gz":
        return gzip.open(path, "rb")
    if path.suffix == ".xz":
        return lzma.open(path, "rb")
    return path.open("rb")


def merge_hour(result, part, path):
    result.files.append(path.name)
    result.valid += part.valid
    result.invalid += part.invalid
    result.read_errors += part.read_errors
    result.truncated |= part.truncated
    if part.last is not None:
        result.last = max(result.last or 0, part.last)
    if part.error is not None:
        result.error = part.error


def read_hour(directory, symbol, hour, now_ms, result):
    candidates = hour_candidates(directory, symbol, hour)
    vanished = set()
    for attempt in range(2):
        path = next((p for p in candidates if p not in vanished), None)
        if path is None:
            return
        part = Observation(symbol)
        try:
            with open_raw(path) as source:
                for line in source:
                    if not line.endswith(b"\n"):
                        continue
                    if b"@openInterest" not in line:
                        continue
                    recv = valid_record(line, symbol, now_ms)
                    if recv is None:
                        part.invalid += 1
                    else:
                        part.valid += 1
                        part.last = max(part.last or 0, recv)
        except FileNotFoundError:
            # Discard a vanished attempt, so an hour is never counted twice.
            vanished.add(path)
            if attempt == 0:
                candidates = hour_candidates(directory, symbol, hour)
            continue
        except EOFError:
            part.truncated = 1
        except READ_ERRORS as exc:
            part.read_errors = 1
            part.error = (type(exc).__name__, path.name)
        except Exception as exc:
            part.error = (type(exc).__name__, path.name)
            merge_hour(result, part, path)
            raise
        merge_hour(result, part, path)
        return


def check_symbol(symbol, directory, now_ms, stale_s, previous):
    result = Observation(symbol)
    context = directory.name
    failed = False
    try:
        cur = datetime.fromtimestamp(now_ms / 1000, timezone.utc).replace(
            minute=0, second=0, microsecond=0)
        for hour in (cur, cur - timedelta(hours=1)):
            read_hour(directory, symbol, hour, now_ms, result)
            if result.valid:
                break
    except Exception as exc:
        failed = True
        if result.error is None or result.error[0] != type(exc).__name__:
            result.error = (type(exc).__name__, context)
    try:
        newest_mtime = None
        with os.scandir(directory) as entries:
            for entry in entries:
                if not entry.name.startswith(f"raw_{symbol}_"):
                    continue
                context = entry.name
                try:
                    if entry.is_file():
                        mtime = entry.stat().st_mtime_ns
                        newest_mtime = max(newest_mtime or mtime, mtime)
                except FileNotFoundError:
                    continue
        if newest_mtime is not None:
            result.raw_written_s = (now_ms * 1000000 - newest_mtime) // 1000000000
    except Exception as exc:
        if not failed:
            result.error = (type(exc).__name__, context)
        failed = True
    if previous is not None:
        result.last = max(result.last or 0, previous)
    if result.last is not None:
        result.age_s = (now_ms - result.last) // 1000
    if failed or (result.read_errors > 0 and result.valid == 0):
        result.state = "ERROR"
    elif result.age_s is not None and result.age_s <= stale_s:
        result.state = "OK"
    return result


def empty_state():
    return {"version": 1, "symbols": {}, "runs": [], "last_heartbeat_day": None}


def read_json(path):
    with path.open(encoding="utf-8") as source:
        return json.load(source)


def read_state(path):
    try:
        state = read_json(path)
    except FileNotFoundError:
        return empty_state(), True
    if (not isinstance(state, dict) or type(state.get("version")) is not int
            or state["version"] != 1 or not isinstance(state.get("symbols"), dict)
            or not isinstance(state.get("runs"), list)
            or any(not positive_int(run) for run in state["runs"])
            or (state.get("last_heartbeat_day") is not None
                and not isinstance(state["last_heartbeat_day"], str))):
        raise ValueError("Invalid freshness state")
    for symbol, entry in state["symbols"].items():
        if (SYMBOL_RE.fullmatch(symbol) is None or not isinstance(entry, dict)
                or any(entry.get(key) is not None and not positive_int(entry[key])
                       for key in ("last_valid_recv_ms", "notified_ms"))
                or entry.get("notified_state") not in (None, "OK", "STALE", "ERROR")):
            raise ValueError("Invalid symbol state")
    return state, False


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                         prefix=path.name + ".", suffix=".tmp",
                                         delete=False) as output:
            tmp = Path(output.name)
            json.dump(value, output, indent=2, sort_keys=True)
            output.write("\n")
        os.replace(tmp, path)
    finally:
        if tmp is not None:
            tmp.unlink(missing_ok=True)


def send_message(args, text):
    try:
        sent = subprocess.run(
            [args.openclaw_bin, "message", "send", "--channel", args.channel,
             "--target", os.environ["OI_TG_TARGET"], "--message", text],
            capture_output=True, check=False)
        return sent.returncode == 0
    except OSError:
        return False


def details(result):
    raw = ("no raw file" if result.raw_written_s is None
           else f"raw file written {format_age(result.raw_written_s)} ago")
    return f"(last {iso_ms(result.last)}, {raw})"


def status_text(result, old=None, change=False, started=False):
    transition = f"{old or 'none'}->{result.state}" if change else result.state
    text = f"{result.symbol} {transition}"
    if result.state == "ERROR":
        return text + f" ({result.error[0]} {result.error[1]})"
    text += f" {format_age(result.age_s)}"
    if change or (started and result.state == "STALE"):
        text += " " + details(result)
    return text


def notify_failure(args, now_ms):
    try:
        marker = read_json(args.marker)
    except FileNotFoundError:
        marker = {"first_failure": iso_ms(now_ms), "last_notice_ms": 0}
        write_json(args.marker, marker)
    if marker["last_notice_ms"] and now_ms - marker["last_notice_ms"] < 6 * 3600000:
        return 0
    text = (f"RALPH OI check FAILED at {marker['first_failure']}. "
            "See journalctl --user -u ralph-oi-freshness -n 50")
    if not send_message(args, text):
        return 3
    marker["last_notice_ms"] = now_ms
    write_json(args.marker, marker)
    return 0


def main(argv=None):
    started = time.monotonic()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--symbol", action="append", default=[])
    parser.add_argument("--state", type=Path)
    parser.add_argument("--marker", type=Path)
    parser.add_argument("--stale-s", type=int, default=900)
    parser.add_argument("--heartbeat-hour", type=int, default=7)
    parser.add_argument("--send", action="store_true")
    parser.add_argument("--openclaw-bin", default="openclaw")
    parser.add_argument("--channel", default="telegram")
    parser.add_argument("--notify-failure", action="store_true")
    parser.add_argument("--now-ms", type=int, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    if (args.send or args.notify_failure) and not os.environ.get("OI_TG_TARGET"):
        parser.error("OI_TG_TARGET is required for sending")
    if args.marker is None:
        parser.error("--marker is required")
    if args.stale_s < 0 or not 0 <= args.heartbeat_hour <= 23:
        parser.error("invalid threshold or heartbeat hour")
    symbols = {}
    for item in args.symbol:
        symbol, sep, directory = item.partition("=")
        if not sep or not directory or SYMBOL_RE.fullmatch(symbol) is None or symbol in symbols:
            parser.error("--symbol must be a unique uppercase SYM=DIR")
        symbols[symbol] = Path(directory)
    if not args.notify_failure and (not symbols or args.state is None):
        parser.error("check mode requires --symbol and --state")
    now_ms = args.now_ms if args.now_ms is not None else time.time_ns() // 1000000
    if args.notify_failure:
        return notify_failure(args, now_ms)
    state, first_run = read_state(args.state)
    state["runs"] = [run for run in state["runs"] if now_ms - DAY_MS < run <= now_ms]
    state["runs"].append(now_ms)
    results = []
    changes = []
    for symbol, directory in symbols.items():
        entry = state["symbols"].setdefault(symbol, {
            "last_valid_recv_ms": None, "notified_state": None, "notified_ms": None})
        result = check_symbol(symbol, directory, now_ms, args.stale_s, entry["last_valid_recv_ms"])
        results.append(result)
        entry["last_valid_recv_ms"] = result.last
        if result.state != entry["notified_state"]:
            changes.append(status_text(result, entry["notified_state"], change=True))
        age = "none" if result.age_s is None else result.age_s
        raw = "none" if result.raw_written_s is None else result.raw_written_s
        print(f"OI {symbol} state={result.state} age_s={age} last={iso_ms(result.last)} "
              f"valid={result.valid} invalid={result.invalid} read_errors={result.read_errors} "
              f"files={','.join(result.files)} truncated={result.truncated} raw_written_s={raw}")
    messages = []
    if first_run:
        messages.append("RALPH OI started: " + " | ".join(
            status_text(result, started=True) for result in results))
    elif changes:
        messages.append("RALPH OI change: " + " | ".join(changes))
    now = datetime.fromtimestamp(now_ms / 1000, timezone.utc)
    day = now.strftime("%Y-%m-%d")
    heartbeat = now.hour == args.heartbeat_hour and state["last_heartbeat_day"] != day
    if heartbeat:
        messages.append(f"RALPH OI daily: runs {len(state['runs'])}/24 in 24h | "
                        + " | ".join(status_text(result) for result in results)
                        + f" | invalid {sum(r.invalid for r in results)}"
                        + f" | read_errors {sum(r.read_errors for r in results)}")
    try:
        marker = read_json(args.marker)
    except FileNotFoundError:
        marker = None
    if marker is not None:
        messages.append(f"RALPH OI check recovered (first failure {marker['first_failure']})")
    sent = False
    failed = False
    if messages:
        if args.send:
            sent = send_message(args, "\n".join(messages))
            failed = not sent
        else:
            for message in messages:
                print("WOULD_SEND: " + message)
    if sent:
        for result in results:
            state["symbols"][result.symbol].update(
                notified_state=result.state, notified_ms=now_ms)
        if heartbeat:
            state["last_heartbeat_day"] = day
    if args.send:
        write_json(args.state, state)
        if sent and marker is not None:
            args.marker.unlink(missing_ok=True)
    print(f"RUN changes={len(changes)} sent={int(sent)} heartbeat={int(heartbeat)} "
          f"runtime_s={time.monotonic() - started:.1f} "
          f"maxrss_mb={resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024:.1f}")
    return 3 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
