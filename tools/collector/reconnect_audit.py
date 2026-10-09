#!/usr/bin/env python3
"""Read-only reconnect audit for v1 watcher and collector services."""
import argparse
import re
import subprocess
from collections import defaultdict
from datetime import datetime, timedelta, timezone


ISO = re.compile(r"(?P<ts>\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|\+\d{2}:?\d{2})?)")


def parse_ts(line):
    m = ISO.search(line)
    if not m:
        return None
    raw = m.group("ts").replace(" ", "T").replace("Z", "+00:00")
    if re.search(r"[+-]\d{4}$", raw):
        raw = raw[:-5] + raw[-5:-2] + ":" + raw[-2:]
    if not re.search(r"[+-]\d{2}:\d{2}$", raw):
        raw += "+00:00"
    return datetime.fromisoformat(raw).astimezone(timezone.utc)


def audit_lines(lines, close_pat, connect_pat, since):
    days = defaultdict(lambda: {"reconnects": 0, "gaps": []})
    pending = None
    for line in lines:
        ts = parse_ts(line)
        if ts is None:
            continue
        if ts < since:
            continue
        if close_pat.search(line):
            pending = ts
            days[ts.date().isoformat()]["reconnects"] += 1
        elif pending and connect_pat.search(line):
            days[pending.date().isoformat()]["gaps"].append((ts - pending).total_seconds())
            pending = None
    return days


def watcher_log(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        return f.readlines()


def journal(service):
    cmd = ["journalctl", "--user", "-u", service, "--since", "7 days ago", "--no-pager", "-o", "short-iso"]
    try:
        return subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL).splitlines()
    except subprocess.CalledProcessError:
        return []


def print_audit(name, days):
    print(name)
    for day in sorted(days):
        gaps = days[day]["gaps"]
        if gaps:
            avg = sum(gaps) / len(gaps)
            worst = max(gaps)
            print(f"  {day}: reconnects={days[day]['reconnects']} gaps={len(gaps)} avg_gap_s={avg:.1f} max_gap_s={worst:.1f}")
        else:
            print(f"  {day}: reconnects={days[day]['reconnects']} gaps=0")


def main():
    ap = argparse.ArgumentParser(description="Count reconnects and gap lengths over the last 7 days.")
    ap.add_argument("--watcher-log", default="/home/coder/.openclaw/workspace/crypto-updates/runtime/realtime-market-watcher.log")
    ap.add_argument("--collector-service", action="append", default=[
        "ralph-collector.service",
        "ralph-collector-ethusdt.service",
        "ralph-collector-solusdt.service",
        "ralph-collector-hypeusdt.service",
    ])
    args = ap.parse_args()
    since = datetime.now(timezone.utc) - timedelta(days=7)
    watcher = audit_lines(
        watcher_log(args.watcher_log),
        re.compile(r"websocket closed|websocket idle|forcing reconnect", re.I),
        re.compile(r"\bconnected\b", re.I),
        since,
    )
    print_audit("v1-watcher", watcher)
    print("v1-window-state")
    print("  reconnect does not clear history/volumeHistory/flowHistory Maps; process restart does.")
    print("  During a reconnect gap, rolling windows keep prior in-process points but receive no new trade points.")
    for service in args.collector_service:
        days = audit_lines(
            journal(service),
            re.compile(r"spojeni .* spadlo|forcing reconnect|websocket.*closed", re.I),
            re.compile(r"pripojeno:", re.I),
            since,
        )
        print_audit(service, days)


if __name__ == "__main__":
    main()
