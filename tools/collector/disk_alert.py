#!/usr/bin/env python3
"""Check free disk space and optionally send a throttled OpenClaw alert."""
import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone


def iso_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_state(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def write_state(path, state):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, sort_keys=True)
        f.write("\n")
    os.replace(tmp, path)


def send_openclaw(openclaw_bin, channel, target, message):
    return subprocess.run(
        [openclaw_bin, "message", "send", "--channel", channel, "--target", target, "--message", message],
        text=True,
        capture_output=True,
        check=False,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default="/home/coder/data")
    ap.add_argument("--min-free-pct", type=float, default=20.0)
    ap.add_argument("--send-alert", action="store_true")
    ap.add_argument("--state", default="/home/coder/data/disk-alert-state.json")
    ap.add_argument("--throttle-hours", type=float, default=6.0)
    ap.add_argument("--openclaw-bin", default="/home/coder/.npm-global/bin/openclaw")
    ap.add_argument("--channel", default="telegram")
    ap.add_argument("--target", default="telegram:1539856256")
    ap.add_argument("--label", default="RALPH disk alert")
    args = ap.parse_args()
    usage = shutil.disk_usage(args.path)
    free_pct = usage.free / usage.total * 100
    status = f"disk_free_pct={free_pct:.2f} path={args.path} threshold={args.min_free_pct:.2f}"
    print(status)
    if free_pct >= args.min_free_pct:
        return
    if not args.send_alert:
        sys.exit(2)
    now = time.time()
    state = read_state(args.state)
    last_sent_at = float(state.get("last_sent_at", 0) or 0)
    throttle_s = max(0.0, args.throttle_hours * 3600)
    if last_sent_at and now - last_sent_at < throttle_s:
        remaining = int(throttle_s - (now - last_sent_at))
        print(f"THROTTLED last_sent_iso={state.get('last_sent_iso')} remaining_s={remaining}")
        return
    message = (
        f"{args.label}: free disk is {free_pct:.2f}% below {args.min_free_pct:.2f}% "
        f"on {args.path} at {iso_now()}. total={usage.total} used={usage.used} free={usage.free}"
    )
    result = send_openclaw(args.openclaw_bin, args.channel, args.target, message)
    print(f"OPENCLAW_SEND status={result.returncode}")
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)
    if result.returncode != 0:
        sys.exit(result.returncode or 1)
    state.update(
        {
            "last_sent_at": now,
            "last_sent_iso": iso_now(),
            "last_free_pct": round(free_pct, 2),
            "last_threshold_pct": args.min_free_pct,
            "last_path": args.path,
        }
    )
    write_state(args.state, state)


if __name__ == "__main__":
    main()
