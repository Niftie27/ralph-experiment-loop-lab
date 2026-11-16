#!/usr/bin/env python3
"""gapcal: per-stream receive-time gaps in collector raw files (read-only).

For each symbol, reads every complete hour file raw_<SYM>_<YYYY-MM-DDTHHZ>.jsonl.xz in name order and uses
only websocket lines (src ws). Per stream (aggTrade, markPrice@1s on market; depth@100ms, bookTicker on public):
gap counts, the time-weighted wait beyond a limit, and every gap > 2 s (aggTrade: > 10 s; its shorter gaps are
only counted) with the connection's longest all-stream silence inside it. Per connection: every all-stream silence >= 3 s and the delay from the connection's first
message after it to the first message of each stream. Writes summary.tsv, gaps.tsv, reconnects.tsv, files.tsv.
Hours are read in label order; a second file with the same hour label is skipped. Progress goes to stderr.
"""
import argparse
import bisect
import glob
import json
import lzma
import os
import re
import resource
import sys
import time
from datetime import datetime, timezone

CONN = {"aggTrade": "market", "markPrice@1s": "market", "forceOrder": "market",
        "depth@100ms": "public", "bookTicker": "public"}
MEASURED = ["aggTrade", "markPrice@1s", "depth@100ms", "bookTicker"]
BINS_S = [2, 5, 10, 20, 30, 45, 60]
WAIT_S = [10, 20, 30, 60]
GAP_ROW_MS = 2000
ROW_MS = {"aggTrade": 10000}   # gaps.tsv threshold per stream (default GAP_ROW_MS)
CONN_SIL_MS = 1000
RECONNECT_MS = 3000
NAME = re.compile(r"^raw_([A-Z0-9]+)_(\d{4}-\d{2}-\d{2}T\d{2}Z)\.jsonl\.xz$")
PREFIX = '{"recv_ms":'
WS = ',"src":"ws","stream":"'


def utc(ms):
    return datetime.fromtimestamp(ms / 1000, timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def hour_ms(label):
    return int(datetime.strptime(label, "%Y-%m-%dT%HZ").replace(tzinfo=timezone.utc).timestamp() * 1000)


def parse(line):
    """(recv_ms, src_is_ws, stream_suffix) or None for a line this tool cannot read."""
    if line.startswith(PREFIX):
        i = line.find(",", 11)
        if i > 11 and line.startswith(WS, i):
            j = i + len(WS)
            k = line.find('"', j)
            name = line[j:k]
            at = name.find("@")
            if k > j and at > 0:
                return int(line[11:i]), True, name[at + 1:]
    try:
        o = json.loads(line)
        name = o["stream"]
        return int(o["recv_ms"]), o["src"] == "ws", name[name.index("@") + 1:]
    except (ValueError, KeyError, TypeError):
        return None


class Sym:
    def __init__(self, sym):
        self.sym = sym
        self.reset()
        self.n = {s: 0 for s in MEASURED}
        self.span = {s: 0 for s in MEASURED}
        self.maxgap = {s: 0 for s in MEASURED}
        self.bins = {s: [0] * len(BINS_S) for s in MEASURED}
        self.wait = {s: [0] * len(WAIT_S) for s in MEASURED}
        self.gaps = []          # [stream, start_ms, len_ms, sibling_msgs]
        self.csil = {"market": [], "public": []}   # [start_ms, len_ms] all-stream silences >= CONN_SIL_MS
        self.recon = []         # [conn, start_ms, len_ms, first_ms, {stream: first_ms}]
        self.recv_back = 0
        self.bad = 0
        self.other_streams = 0

    def reset(self):
        self.last = {}          # stream -> last recv_ms
        self.cnt = {}           # stream -> messages since the last reset
        self.ccnt = {}          # conn -> messages since the last reset
        self.sib_at = {}        # stream -> sibling message count at its last message
        self.clast = {}         # conn -> last recv_ms of any of its streams
        self.open_recon = {}    # conn -> index in self.recon while streams are still missing

    def feed(self, t, s):
        c = CONN.get(s)
        if c is None:
            self.other_streams += 1
            return
        cl = self.clast.get(c)
        if cl is not None:
            if t < cl:
                self.recv_back += 1
                t = cl
            g = t - cl
            if g >= CONN_SIL_MS:
                self.csil[c].append([cl, g])
                if g >= RECONNECT_MS:
                    self.recon.append([c, cl, g, t, {}])
                    self.open_recon[c] = len(self.recon) - 1
        self.clast[c] = t
        self.ccnt[c] = self.ccnt.get(c, 0) + 1
        self.cnt[s] = self.cnt.get(s, 0) + 1
        if s not in MEASURED:
            return
        oi = self.open_recon.get(c)
        if oi is not None:
            firsts = self.recon[oi][4]
            if s not in firsts:
                firsts[s] = t
                if all(x in firsts for x in MEASURED if CONN[x] == c):
                    del self.open_recon[c]
        p = self.last.get(s)
        sib = self.ccnt[c] - self.cnt[s]
        if p is not None:
            g = t - p
            self.span[s] += g
            if g > self.maxgap[s]:
                self.maxgap[s] = g
            if g > GAP_ROW_MS:
                for i, b in enumerate(BINS_S):
                    if g > b * 1000:
                        self.bins[s][i] += 1
                for i, w in enumerate(WAIT_S):
                    if g > w * 1000:
                        self.wait[s][i] += g - w * 1000
                if g > ROW_MS.get(s, GAP_ROW_MS):
                    self.gaps.append([s, p, g, sib - self.sib_at.get(s, 0)])
        self.n[s] += 1
        self.last[s] = t
        self.sib_at[s] = sib


def conn_max_inside(sils, starts, start, end):
    """Longest overlap of an all-stream silence of the connection with (start, end). sils are disjoint and sorted by
    start (consecutive gaps of one connection); starts = [a for a, g in sils]."""
    best = 0
    i = max(bisect.bisect_right(starts, start) - 1, 0)
    while i < len(sils):
        a, g = sils[i]
        if a >= end:
            break
        b = a + g
        if b > start:
            best = max(best, min(b, end) - max(a, start))
        i += 1
    return best


def run(root, symbols, out, now_ms):
    os.makedirs(out, exist_ok=True)
    files_rows, summary, gap_rows, recon_rows = [], [], [], []
    for sym in symbols:
        paths = sorted((NAME.match(os.path.basename(p)).group(2), p)
                       for p in glob.glob(os.path.join(root, "binance*", f"raw_{sym}_*.jsonl.xz"))
                       if NAME.match(os.path.basename(p)) and NAME.match(os.path.basename(p)).group(1) == sym)
        dirs = sorted({os.path.basename(os.path.dirname(p)) for _, p in paths})
        print(f"SYMBOL {sym} files={len(paths)}", file=sys.stderr, flush=True)
        st = Sym(sym)
        prev = None
        prev_label = None
        for label, p in paths:
            if label == prev_label:
                files_rows.append([sym, label, "skip_duplicate_label", 0, 0, 0])
                print(f"HOUR {sym} {label} skip_duplicate_label", file=sys.stderr, flush=True)
                continue
            prev_label = label
            h = hour_ms(label)
            if h + 3600 * 1000 > now_ms:
                files_rows.append([sym, label, "skip_not_finished", 0, 0, 0])
                print(f"HOUR {sym} {label} skip_not_finished", file=sys.stderr, flush=True)
                continue
            note = "ok"
            if prev is not None and h != prev + 3600 * 1000:
                st.reset()
                note = "ok_after_missing_hour"
            t0 = time.time()
            lines = 0
            try:
                with lzma.open(p, "rt", encoding="utf-8", errors="replace") as fh:
                    for line in fh:
                        lines += 1
                        r = parse(line)
                        if r is None:
                            st.bad += 1
                        elif r[1]:
                            st.feed(r[0], r[2])
            except (OSError, EOFError, lzma.LZMAError) as e:
                note = "read_error_" + type(e).__name__
                st.reset()
            files_rows.append([sym, label, note, lines, round(time.time() - t0, 1),
                               resource.getrusage(resource.RUSAGE_SELF).ru_maxrss // 1024])
            print("HOUR %s %s %s lines=%d secs=%s" % tuple(files_rows[-1][:5]), file=sys.stderr, flush=True)
            prev = h
        starts = {}
        for c in st.csil:
            st.csil[c].sort()
            starts[c] = [a for a, _ in st.csil[c]]
        hours = sum(1 for r in files_rows if r[0] == sym and r[2].startswith("ok"))
        for s in MEASURED:
            span = st.span[s]
            stream_only = [g for g in st.gaps if g[0] == s and conn_max_inside(st.csil[CONN[s]], starts[CONN[s]], g[1], g[1] + g[2]) < 2000]
            summary.append([sym, s, hours, st.n[s], round(span / 1000), st.maxgap[s]] + st.bins[s] +
                           [f"{(w / span) if span else 0:.2e}" for w in st.wait[s]] +
                           [max([g[2] for g in stream_only], default=0), sum(1 for g in stream_only if g[2] > 10000),
                            sum(1 for g in stream_only if g[2] > 30000)])
        for s, a, g, sib in st.gaps:
            gap_rows.append([sym, s, utc(a), g, sib, conn_max_inside(st.csil[CONN[s]], starts[CONN[s]], a, a + g)])
        for c, a, g, first, firsts in st.recon:
            row = [sym, c, utc(a), g]
            for s in MEASURED:
                if CONN[s] == c:
                    row += [s, firsts[s] - first if s in firsts else "never"]
            recon_rows.append(row)
        files_rows.append([sym, "-", "dirs=" + ",".join(dirs) + f" bad={st.bad} recv_back={st.recv_back} "
                           f"other_streams={st.other_streams}", 0, 0, 0])
    hdr_sum = (["symbol", "stream", "hours", "msgs", "span_s", "max_gap_ms"] + [f"n_gt{b}s" for b in BINS_S] +
               [f"wait_frac_gt{w}s" for w in WAIT_S] + ["max_stream_only_gap_ms", "n_stream_only_gt10s",
                                                       "n_stream_only_gt30s"])
    for name, hdr, rows in (("summary.tsv", hdr_sum, summary),
                            ("gaps.tsv", ["symbol", "stream", "start_utc", "len_ms", "sibling_msgs",
                                          "conn_max_silence_ms"], gap_rows),
                            ("reconnects.tsv", ["symbol", "conn", "start_utc", "len_ms", "stream_a", "delay_a_ms",
                                                "stream_b", "delay_b_ms"], recon_rows),
                            ("files.tsv", ["symbol", "hour", "note", "lines", "secs", "maxrss_mb"], files_rows)):
        with open(os.path.join(out, name), "w", encoding="utf-8") as f:
            f.write("\t".join(hdr) + "\n")
            for r in rows:
                f.write("\t".join(str(x) for x in r) + "\n")
    return summary


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", default=os.path.expanduser("~/data"))
    ap.add_argument("--symbols", default="BTCUSDT,ETHUSDT,SOLUSDT,HYPEUSDT")
    ap.add_argument("--out", required=True)
    ap.add_argument("--now-ms", type=int, default=None)
    a = ap.parse_args()
    now = a.now_ms if a.now_ms is not None else int(time.time() * 1000)
    run(a.root, a.symbols.split(","), a.out, now)
    print("gapcal done", file=sys.stderr)


if __name__ == "__main__":
    main()
