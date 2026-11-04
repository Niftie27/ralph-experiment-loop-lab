#!/usr/bin/env python3
"""
soak_reconnect.py - soak run of the binance_live.py collector with the make-before-break reconnect (PR #9) for one
symbol, with a short scheduled reconnect, into a scratch directory, next to the live collectors without touching them.

Run (on the VPS, from the checkout that holds the PR #9 collector):
  ~/venv/bin/python tools/collector/soak_reconnect.py --symbol ethusdt --out ~/soak/eth-1 --duration-s 7200

  --symbol             required
  --out                required; a new or empty directory (see the guards below)
  --reconnect-after-s  scheduled reconnect after this many seconds, default 300, at least 60
  --duration-s         stop after this many seconds, required, at most 14400 (4 h)

What it does:
  - imports binance_live.py from this file's own directory, sets binance_live.RECONNECT_AFTER_S, and runs the
    collector in this process exactly as `binance_live.py --symbol <s> --all --quiet --out <out>` would.
    Never --features: no orderflow engine, no live dashboard port. binance_live.py is not changed.
  - after --duration-s it sends itself SIGTERM, which the collector handles as a normal shutdown (systemd stop,
    Ctrl+C): the current hour files are flushed and the tapes finalized. Exit 0.
  - prints one line per scheduled handover, taken from the collector's own report line ("predavani <endpoint>:
    prepnuto ..."):
        SOAK handover <UTC time> <endpoint>
    The collector prints that report when the handover's duplicate filter ends (HANDOVER_FILTER_S, 10 s, after the
    switch), at the next switch, or at shutdown, whichever comes first; the time is when the line appeared.
    Failed handovers and reconnects after an error are printed the same way (SOAK handover-failed, SOAK error).
    All collector output is passed through unchanged.

Guards (exit 2, nothing started, nothing created):
  - --out exists and is not an empty directory
  - --out, resolved (symlinks followed), is ~/data or inside ~/data (the live collectors' data)
  - --out, resolved, equals or is inside a directory listed in the environment variable SOAK_FORBIDDEN
    (colon separated, e.g. SOAK_FORBIDDEN=/srv/ralph:/srv/archive)
  - --reconnect-after-s below 60, --duration-s above 14400 or not positive, a symbol that is not 2-20 letters/digits
  - the binance_live.py next to this file has no make-before-break handover (not the PR #9 collector)

Note: it opens two Binance WebSocket connections of its own and uses REST from the same IP as the live collectors
(--all: depth snapshot at start and after a resync, aggTrades backfill on a gap, open interest every 10 s).
"""
import argparse
import math
import os
import re
import signal
import sys
import threading
import time
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
MIN_RECONNECT_S = 60
MAX_DURATION_S = 14400
TERM_GRACE_S = 30            # after --duration-s, wait at most this long for the collector's own SIGTERM handler

HANDOVER_LINE = re.compile(r"^predavani (market|public): prepnuto ")
FAILED_LINE = re.compile(r"^predavani (market|public): nove spojeni ")
ERROR_LINE = re.compile(r"^spojeni (market|public) spadlo ")
SYMBOL_RE = re.compile(r"[A-Za-z0-9]{2,20}")


class Refused(Exception):
    pass


def utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def _inside(path, root):
    root = root.rstrip(os.sep) or os.sep
    return path == root or path.startswith(root if root.endswith(os.sep) else root + os.sep)


def forbidden_roots(environ):
    roots = [("~/data", os.path.expanduser("~/data"))]
    for entry in environ.get("SOAK_FORBIDDEN", "").split(":"):
        if entry.strip():
            roots.append((f"SOAK_FORBIDDEN entry {entry}", os.path.expanduser(entry.strip())))
    return roots


def check_out(out, environ=os.environ):
    """The resolved --out, or Refused."""
    expanded = os.path.expanduser(out)
    resolved = os.path.realpath(expanded)
    for label, root in forbidden_roots(environ):
        if _inside(resolved, os.path.realpath(root)):
            raise Refused(f"--out {out} resolves to {resolved}, which is {label} or inside it")
    if os.path.lexists(expanded) or os.path.lexists(resolved):
        if not os.path.isdir(resolved):
            raise Refused(f"--out {out} exists and is not a directory")
        if os.listdir(resolved):
            raise Refused(f"--out {out} exists and is not empty")
    return resolved


def parse_args(argv, min_reconnect_s):
    ap = argparse.ArgumentParser(description="Soak run of the PR #9 collector for one symbol with a short scheduled "
                                             "reconnect, into a scratch directory.")
    ap.add_argument("--symbol", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--reconnect-after-s", type=float, default=300.0,
                    help=f"scheduled reconnect after this many seconds (default 300, at least {MIN_RECONNECT_S})")
    ap.add_argument("--duration-s", type=float, required=True, help=f"stop after this many seconds (at most {MAX_DURATION_S})")
    ap.add_argument("--ws-base", help=argparse.SUPPRESS)        # local fake Binance in the tests
    ap.add_argument("--rest-base", help=argparse.SUPPRESS)
    args = ap.parse_args(argv)
    if not SYMBOL_RE.fullmatch(args.symbol):
        raise Refused(f"--symbol {args.symbol!r} is not 2-20 letters or digits")
    if not (math.isfinite(args.reconnect_after_s) and args.reconnect_after_s >= min_reconnect_s):
        raise Refused(f"--reconnect-after-s {args.reconnect_after_s:g} is below the minimum {min_reconnect_s:g}")
    if not (math.isfinite(args.duration_s) and 0 < args.duration_s <= MAX_DURATION_S):
        raise Refused(f"--duration-s {args.duration_s:g} must be above 0 and at most {MAX_DURATION_S}")
    return args


def load_collector():
    """binance_live from this file's directory, and only if it is the collector with the handover."""
    if sys.path[:1] != [HERE]:
        sys.path.insert(0, HERE)
    import binance_live
    where = os.path.dirname(os.path.realpath(binance_live.__file__))
    if where != os.path.realpath(HERE):
        raise Refused(f"imported binance_live from {where}, not from {HERE}")
    if not (hasattr(binance_live, "Handover") and hasattr(binance_live.Collector, "_switch")):
        raise Refused(f"{binance_live.__file__} has no make-before-break handover (not the PR #9 collector)")
    return binance_live


class LineTap:
    """sys.stdout stand-in: passes everything through and calls on_line for every complete line."""

    def __init__(self, target, on_line):
        self.target, self.on_line, self.buf = target, on_line, ""
        self.lock = threading.Lock()

    def write(self, s):
        self.target.write(s)
        with self.lock:
            self.buf += s
            lines = self.buf.split("\n")
            self.buf = lines.pop()
        for line in lines:
            self.on_line(line)
        return len(s)

    def flush(self):
        self.target.flush()

    def __getattr__(self, name):
        return getattr(self.target, name)


class Soak:
    def __init__(self, out_stream):
        self.out = out_stream
        self.counts = {"handover": {"market": 0, "public": 0}, "handover-failed": {"market": 0, "public": 0},
                       "error": {"market": 0, "public": 0}}
        self.timer_fired = False

    def on_line(self, line):
        for what, rx in (("handover", HANDOVER_LINE), ("handover-failed", FAILED_LINE), ("error", ERROR_LINE)):
            m = rx.match(line)
            if m:
                self.counts[what][m.group(1)] += 1
                print(f"SOAK {what} {utc_now()} {m.group(1)}", file=self.out, flush=True)
                return

    def stop_after(self, duration_s, done):
        """Thread: after duration_s, SIGTERM to this process once the collector's own handler is installed."""
        if done.wait(duration_s):
            return
        deadline = time.monotonic() + TERM_GRACE_S
        while signal.getsignal(signal.SIGTERM) in (signal.SIG_DFL, _early_term) and time.monotonic() < deadline:
            if done.wait(0.05):
                return
        self.timer_fired = True
        print(f"SOAK stop {utc_now()} after {duration_s:g} s: SIGTERM (the collector's normal shutdown)",
              file=self.out, flush=True)
        os.kill(os.getpid(), signal.SIGTERM)


def _early_term(signum, frame):
    """SIGTERM before the collector installed its own handler: nothing to flush yet."""
    raise SystemExit(0)


def main(argv=None, min_reconnect_s=MIN_RECONNECT_S):
    """CLI entry. min_reconnect_s is for the tests only (the CLI has no option for it)."""
    try:
        args = parse_args(argv, min_reconnect_s)
        out = check_out(args.out)
        bl = load_collector()
    except Refused as err:
        print(f"soak_reconnect: refused: {err}", file=sys.stderr, flush=True)
        return 2
    collector_argv = ["--symbol", args.symbol, "--all", "--quiet", "--out", out]
    if args.ws_base:
        collector_argv += ["--ws-base", args.ws_base]
    if args.rest_base:
        collector_argv += ["--rest-base", args.rest_base]
    real_stdout = sys.stdout
    soak = Soak(real_stdout)
    bl.RECONNECT_AFTER_S = args.reconnect_after_s
    print(f"SOAK start {utc_now()} symbol={args.symbol} out={out} reconnect_after_s={args.reconnect_after_s:g} "
          f"duration_s={args.duration_s:g} collector={os.path.join(os.path.dirname(bl.__file__), 'binance_live.py')} "
          f"args={' '.join(collector_argv)}", file=real_stdout, flush=True)
    done = threading.Event()
    timer = threading.Thread(target=soak.stop_after, args=(args.duration_s, done), name="soak-stop", daemon=True)
    old_argv, old_term = sys.argv, signal.signal(signal.SIGTERM, _early_term)
    sys.argv = [os.path.join(os.path.dirname(bl.__file__), "binance_live.py")] + collector_argv
    sys.stdout = LineTap(real_stdout, soak.on_line)
    code = 0
    try:
        timer.start()
        bl.main()
    except SystemExit as e:
        code = e.code if isinstance(e.code, int) else (0 if e.code is None else 1)
    finally:
        done.set()
        sys.stdout, sys.argv = real_stdout, old_argv
        signal.signal(signal.SIGTERM, old_term)
    c = soak.counts
    how = "after --duration-s" if soak.timer_fired else "stopped early (signal from outside or the collector ended)"
    print(f"SOAK end {utc_now()} {how}: handovers market={c['handover']['market']} public={c['handover']['public']}, "
          f"failed handovers {sum(c['handover-failed'].values())}, reconnects after an error {sum(c['error'].values())}",
          file=real_stdout, flush=True)
    return code


if __name__ == "__main__":
    sys.exit(main())
