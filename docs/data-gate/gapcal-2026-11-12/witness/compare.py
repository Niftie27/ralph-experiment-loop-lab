#!/usr/bin/env python3
"""compare.py - wit95: compare the awk witness (wit.sh / wit.awk) with the gapcal outputs.

Usage: python3 compare.py <gapcal out dir> <witness out dir>
A gapcal row of gaps.tsv or reconnects.tsv is expected from the witness when it lies wholly inside a window:
start >= window start and start + len_ms < window end (the witness has no state before the window and no data
after it). Gap rows must match exactly (symbol, stream, start, len_ms, sibling_msgs, conn_max_silence_ms).
Reconnect rows must match exactly, except rows the witness reports as open at the window end: there the delays the
witness saw must match and an unseen delay must be never or reach past the window end in gapcal.
Line counts per hour must equal files.tsv; non-layout lines, other streams and backward steps must be 0 (gapcal
reported bad=0, other_streams=0, recv_back=0); xz must have written nothing to stderr.
Prints one line per check and VERDICT PASS or VERDICT FAIL; exit 0 on PASS, 1 on FAIL.
"""
import calendar
import collections
import os
import sys
from datetime import datetime

WINDOWS = ["2026-11-10T12Z", "2026-11-11T02Z", "2026-11-11T13Z"]
HOURS = 3
SYMS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "HYPEUSDT"]


def hour_ms(label):
    return calendar.timegm(datetime.strptime(label, "%Y-%m-%dT%HZ").timetuple()) * 1000


def utc_ms(s):
    d = datetime.strptime(s, "%Y-%m-%dT%H:%M:%S.%fZ")
    return calendar.timegm(d.timetuple()) * 1000 + d.microsecond // 1000


def tsv(path):
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")
    if lines and lines[-1] == "":
        lines.pop()
    return [x.split("\t") for x in lines]


def main():
    gdir, wdir = sys.argv[1], sys.argv[2]
    fails = []
    files = {(r[0], r[1]): r for r in tsv(os.path.join(gdir, "files.tsv"))[1:]}
    gaps = [(r[0], r[1], utc_ms(r[2]), int(r[3]), int(r[4]), int(r[5])) for r in tsv(os.path.join(gdir, "gaps.tsv"))[1:]]
    recs = [(r[0], r[1], utc_ms(r[2]), int(r[3]), r[4], r[5], r[6], r[7])
            for r in tsv(os.path.join(gdir, "reconnects.tsv"))[1:]]
    err = os.path.getsize(os.path.join(wdir, "xz_err.txt"))
    print(f"xz stderr bytes {err}")
    if err:
        fails.append("xz stderr")
    tot = collections.Counter()
    for w in WINDOWS:
        w0 = hour_ms(w)
        w1 = w0 + HOURS * 3600 * 1000
        for sym in SYMS:
            path = os.path.join(wdir, f"w_{w}_{sym}.tsv")
            if not os.path.exists(path):
                fails.append(f"{w} {sym} witness file missing")
                print(f"{w} {sym} witness file missing")
                continue
            rows = tsv(path)
            kinds = collections.Counter(r[0] for r in rows)
            if set(kinds) - set("LGRN") or kinds["L"] != HOURS or kinds["N"] != 1:
                fails.append(f"{w} {sym} witness file malformed")
                print(f"{w} {sym} witness file malformed {dict(kinds)}")
                continue
            msg = []
            for r in rows:
                if r[0] == "L":
                    g = files.get((sym, r[2]))
                    ok = g is not None and g[2] == "ok" and int(g[3]) == int(r[3])
                    tot["hours"] += 1
                    tot["hours_equal"] += ok
                    if not ok:
                        msg.append(f"lines {r[2]} witness {r[3]} gapcal {g[3] if g else 'none'}")
                    for name, v in (("nonstd", r[4]), ("nonws", r[5]), ("other", r[6])):
                        tot[name] += int(v)
                    if int(r[4]) or int(r[6]):
                        msg.append(f"{r[2]} nonstd {r[4]} other {r[6]}")
                if r[0] == "N":
                    tot["neg"] += int(r[2]) + int(r[3])
                    if int(r[2]) or int(r[3]):
                        msg.append(f"backward steps {r[2]} {r[3]}")
            wg = collections.Counter(tuple([r[1], r[2]] + [int(x) for x in r[3:7]]) for r in rows if r[0] == "G")
            eg = collections.Counter(g for g in gaps if g[0] == sym and g[2] >= w0 and g[2] + g[3] < w1)
            miss, extra = eg - wg, wg - eg
            tot["gap_rows"] += sum(eg.values())
            tot["gap_match"] += sum((eg & wg).values())
            for g in sorted((eg & wg).elements()):
                tot["gap_match_" + g[1]] += 1
            for g in sorted(miss.elements()):
                msg.append("gap missing in witness " + " ".join(map(str, g)))
            for g in sorted(extra.elements()):
                msg.append("gap extra in witness " + " ".join(map(str, g)))
            er = [x for x in recs if x[0] == sym and x[2] >= w0 and x[2] + x[3] < w1]
            wr = [r for r in rows if r[0] == "R"]
            tot["rec_rows"] += len(er)
            left = list(er)
            for r in wr:
                key = (r[1], r[2], int(r[3]), int(r[4]))
                first = int(r[5])
                hit = [x for x in left if x[:4] == key]
                if len(hit) != 1:
                    msg.append("reconnect extra in witness " + " ".join(r[1:]))
                    continue
                x = hit[0]
                left.remove(x)
                if r[10] in ("closed", "superseded"):
                    ok = (x[4], x[5], x[6], x[7]) == (r[6], r[7], r[8], r[9])
                else:
                    ok = (x[4], x[6]) == (r[6], r[8])
                    for gv, wv in ((x[5], r[7]), (x[7], r[9])):
                        if wv != "never":
                            ok = ok and gv == wv
                        else:
                            ok = ok and (gv == "never" or first + int(gv) >= w1)
                    tot["rec_open"] += 1
                tot["rec_match"] += ok
                if not ok:
                    msg.append("reconnect differs gapcal " + " ".join(map(str, x)) + " witness " + " ".join(r[1:]))
            for x in left:
                msg.append("reconnect missing in witness " + " ".join(map(str, x)))
            print(f"{w} {sym} gap_rows {sum(eg.values())} reconnect_rows {len(er)} " + ("OK" if not msg else "DIFF"))
            for m in msg:
                print("  " + m)
            if msg:
                fails.append(f"{w} {sym}")
    print("hours equal %d/%d" % (tot["hours_equal"], tot["hours"]))
    print("gap rows matched %d/%d (%s)" % (tot["gap_match"], tot["gap_rows"], ", ".join(
        f"{s} {tot['gap_match_' + s]}" for s in ("aggTrade", "markPrice@1s", "depth@100ms", "bookTicker"))))
    print("reconnect rows matched %d/%d (open at window end %d)" % (tot["rec_match"], tot["rec_rows"], tot["rec_open"]))
    print("nonstd %d nonws %d other %d backward %d" % (tot["nonstd"], tot["nonws"], tot["other"], tot["neg"]))
    if tot["hours"] != len(WINDOWS) * len(SYMS) * HOURS or tot["hours_equal"] != tot["hours"]:
        fails.append("hours")
    if tot["rec_match"] != tot["rec_rows"]:
        fails.append("reconnects")
    print("VERDICT " + ("PASS" if not fails else "FAIL " + "; ".join(fails)))
    return 0 if not fails else 1


if __name__ == "__main__":
    sys.exit(main())
