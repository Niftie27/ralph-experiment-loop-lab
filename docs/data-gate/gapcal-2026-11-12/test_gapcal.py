import csv
import json
import lzma
import os
import tempfile
import unittest

import gapcal as g

H0 = g.hour_ms("2026-11-05T00Z")


def ws(t, sym, s):
    return '{"recv_ms":%d,"src":"ws","stream":"%s@%s","data":{"e":"x"}}\n' % (t, sym.lower(), s)


def rest(t, sym, s):
    return json.dumps({"recv_ms": t, "src": "rest", "stream": f"{sym.lower()}@{s}", "data": {}},
                      separators=(",", ":")) + "\n"


class T(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp()
        self.out = os.path.join(self.d, "out")

    def write(self, sym, label, lines, sub=None):
        sub = sub or ("binance" if sym == "BTCUSDT" else "binance-" + sym.lower())
        os.makedirs(os.path.join(self.d, sub), exist_ok=True)
        with lzma.open(os.path.join(self.d, sub, f"raw_{sym}_{label}.jsonl.xz"), "wt") as f:
            f.writelines(lines)

    def run_(self, syms=("BTCUSDT",), now=H0 + 10 * 3600 * 1000):
        g.run(self.d, list(syms), self.out, now)
        return {n: list(csv.DictReader(open(os.path.join(self.out, n)), delimiter="\t"))
                for n in ("summary.tsv", "gaps.tsv", "reconnects.tsv", "files.tsv")}

    def row(self, r, sym, stream):
        return [x for x in r["summary.tsv"] if x["symbol"] == sym and x["stream"] == stream][0]

    def test_parse(self):
        self.assertEqual(g.parse(ws(5, "BTCUSDT", "depth@100ms")), (5, True, "depth@100ms"))
        self.assertEqual(g.parse(rest(7, "BTCUSDT", "aggTrade")), (7, False, "aggTrade"))
        other = json.dumps({"src": "ws", "recv_ms": 9, "stream": "btcusdt@bookTicker", "data": {}})
        self.assertEqual(g.parse(other), (9, True, "bookTicker"))
        self.assertIsNone(g.parse("garbage\n"))

    def test_gap_bins_wait_and_rest_ignored(self):
        L = [ws(H0, "BTCUSDT", "aggTrade"), ws(H0 + 1000, "BTCUSDT", "aggTrade"),
             rest(H0 + 5000, "BTCUSDT", "aggTrade"), ws(H0 + 13000, "BTCUSDT", "aggTrade")]
        r = self.run_()
        self.write("BTCUSDT", "2026-11-05T00Z", L)
        r = self.run_()
        a = self.row(r, "BTCUSDT", "aggTrade")
        self.assertEqual((a["msgs"], a["max_gap_ms"], a["n_gt2s"], a["n_gt10s"], a["n_gt20s"]), ("3", "12000", "1", "1", "0"))
        self.assertAlmostEqual(float(a["wait_frac_gt10s"]), 2000 / 13000, places=3)
        self.assertEqual(len(r["gaps.tsv"]), 1)

    def test_stream_only_vs_connection_silence(self):
        L = []
        for i in range(0, 41001, 100):
            L.append(ws(H0 + i, "BTCUSDT", "depth@100ms"))
        L.insert(0, ws(H0, "BTCUSDT", "bookTicker"))
        L.append(ws(H0 + 41000, "BTCUSDT", "bookTicker"))
        L.append(ws(H0 + 90000, "BTCUSDT", "depth@100ms"))
        L.append(ws(H0 + 90000, "BTCUSDT", "bookTicker"))
        self.write("BTCUSDT", "2026-11-05T00Z", L)
        r = self.run_()
        b = self.row(r, "BTCUSDT", "bookTicker")
        self.assertEqual(b["max_stream_only_gap_ms"], "41000")
        self.assertEqual((b["n_stream_only_gt10s"], b["n_stream_only_gt30s"]), ("1", "1"))
        d = self.row(r, "BTCUSDT", "depth@100ms")
        self.assertEqual((d["max_gap_ms"], d["max_stream_only_gap_ms"]), ("49000", "0"))
        rows = {(x["stream"], x["len_ms"]): x for x in r["gaps.tsv"]}
        self.assertEqual(rows[("bookTicker", "41000")]["sibling_msgs"], "411")
        self.assertEqual(rows[("bookTicker", "49000")]["conn_max_silence_ms"], "49000")
        rc = r["reconnects.tsv"]
        self.assertEqual(len(rc), 1)
        self.assertEqual((rc[0]["conn"], rc[0]["len_ms"], rc[0]["delay_a_ms"], rc[0]["delay_b_ms"]),
                         ("public", "49000", "0", "0"))

    def test_reconnect_delays_and_never(self):
        L = [ws(H0, "BTCUSDT", "aggTrade"), ws(H0, "BTCUSDT", "markPrice@1s"),
             ws(H0 + 10000, "BTCUSDT", "forceOrder"), ws(H0 + 10500, "BTCUSDT", "markPrice@1s"),
             ws(H0 + 11500, "BTCUSDT", "markPrice@1s")]
        self.write("BTCUSDT", "2026-11-05T00Z", L)
        r = self.run_()
        rc = r["reconnects.tsv"][0]
        self.assertEqual((rc["conn"], rc["len_ms"], rc["stream_a"], rc["delay_a_ms"], rc["stream_b"], rc["delay_b_ms"]),
                         ("market", "10000", "aggTrade", "never", "markPrice@1s", "500"))

    def test_missing_hour_resets_and_boundary_continues(self):
        self.write("BTCUSDT", "2026-11-05T00Z", [ws(H0 + 3599000, "BTCUSDT", "markPrice@1s")])
        self.write("BTCUSDT", "2026-11-05T01Z", [ws(H0 + 3606000, "BTCUSDT", "markPrice@1s")])
        self.write("BTCUSDT", "2026-11-05T03Z", [ws(H0 + 3 * 3600000 + 1000, "BTCUSDT", "markPrice@1s")])
        r = self.run_()
        m = self.row(r, "BTCUSDT", "markPrice@1s")
        self.assertEqual((m["msgs"], m["max_gap_ms"], m["hours"]), ("3", "7000", "3"))
        notes = [x["note"] for x in r["files.tsv"] if x["hour"] != "-"]
        self.assertEqual(notes, ["ok", "ok", "ok_after_missing_hour"])

    def test_unfinished_hour_tmp_and_other_symbol_skipped(self):
        self.write("BTCUSDT", "2026-11-05T00Z", [ws(H0, "BTCUSDT", "aggTrade"), ws(H0 + 3000, "BTCUSDT", "aggTrade")])
        self.write("BTCUSDT", "2026-11-05T01Z", [ws(H0 + 3600000, "BTCUSDT", "aggTrade")])
        self.write("ETHUSDT", "2026-11-05T00Z", [ws(H0, "ETHUSDT", "aggTrade")], sub="binance")
        open(os.path.join(self.d, "binance", "raw_BTCUSDT_2026-11-05T02Z.jsonl.xz.tmp"), "w").write("x")
        r = self.run_(now=H0 + 3600000 + 1000)
        a = self.row(r, "BTCUSDT", "aggTrade")
        self.assertEqual((a["msgs"], a["hours"]), ("2", "1"))
        notes = [(x["hour"], x["note"]) for x in r["files.tsv"] if x["hour"] != "-"]
        self.assertEqual(notes, [("2026-11-05T00Z", "ok"), ("2026-11-05T01Z", "skip_not_finished")])

    def test_recv_back_and_bad_lines(self):
        L = [ws(H0 + 5000, "BTCUSDT", "depth@100ms"), ws(H0 + 4000, "BTCUSDT", "bookTicker"), "junk\n"]
        self.write("BTCUSDT", "2026-11-05T00Z", L)
        r = self.run_()
        tail = [x["note"] for x in r["files.tsv"] if x["hour"] == "-"][0]
        self.assertIn("bad=1 recv_back=1", tail)
        self.assertIn("dirs=binance", tail)

    def test_four_symbols_dirs(self):
        for s in ("BTCUSDT", "ETHUSDT", "SOLUSDT", "HYPEUSDT"):
            self.write(s, "2026-11-05T00Z", [ws(H0, s, "bookTicker"), ws(H0 + 2500, s, "bookTicker")])
        r = self.run_(syms=("BTCUSDT", "ETHUSDT", "SOLUSDT", "HYPEUSDT"))
        for s in ("BTCUSDT", "ETHUSDT", "SOLUSDT", "HYPEUSDT"):
            self.assertEqual(self.row(r, s, "bookTicker")["n_gt2s"], "1")
        tails = [x["note"].split()[0] for x in r["files.tsv"] if x["hour"] == "-"]
        self.assertEqual(tails, ["dirs=binance", "dirs=binance-ethusdt", "dirs=binance-solusdt", "dirs=binance-hypeusdt"])


    def test_conn_max_inside_matches_brute_force(self):
        import random
        rnd = random.Random(7)
        for _ in range(300):
            sils, t = [], 0
            for _ in range(rnd.randint(0, 30)):
                t += rnd.randint(0, 5000)
                g_ = rnd.randint(1000, 9000)
                sils.append([t, g_])
                t += g_
            starts = [a for a, _ in sils]
            s0 = rnd.randint(-2000, t + 2000)
            e0 = s0 + rnd.randint(1, 40000)
            brute = max([min(a + g_, e0) - max(a, s0) for a, g_ in sils if a < e0 and a + g_ > s0], default=0)
            self.assertEqual(g.conn_max_inside(sils, starts, s0, e0), brute)

    def test_agg_rows_only_over_10s_but_counted(self):
        L = [ws(H0, "BTCUSDT", "aggTrade"), ws(H0 + 5000, "BTCUSDT", "aggTrade"), ws(H0 + 16000, "BTCUSDT", "aggTrade"),
             ws(H0, "BTCUSDT", "bookTicker"), ws(H0 + 2500, "BTCUSDT", "bookTicker")]
        self.write("BTCUSDT", "2026-11-05T00Z", L)
        r = self.run_()
        a = self.row(r, "BTCUSDT", "aggTrade")
        self.assertEqual((a["n_gt2s"], a["n_gt5s"], a["n_gt10s"], a["max_stream_only_gap_ms"]), ("2", "1", "1", "0"))
        self.assertEqual(sorted((x["stream"], x["len_ms"]) for x in r["gaps.tsv"]),
                         [("aggTrade", "11000"), ("bookTicker", "2500")])

    def test_label_order_across_dirs_and_duplicate_skipped(self):
        self.write("BTCUSDT", "2026-11-05T00Z", [ws(H0 + 1000, "BTCUSDT", "markPrice@1s")])
        self.write("BTCUSDT", "2026-11-05T01Z", [ws(H0 + 3601000, "BTCUSDT", "markPrice@1s")], sub="binance-btcusdt")
        self.write("BTCUSDT", "2026-11-05T02Z", [ws(H0 + 7201000, "BTCUSDT", "markPrice@1s")])
        self.write("BTCUSDT", "2026-11-05T01Z", [ws(H0 + 3605000, "BTCUSDT", "markPrice@1s")])
        r = self.run_()
        m = self.row(r, "BTCUSDT", "markPrice@1s")
        self.assertEqual((m["msgs"], m["max_gap_ms"], m["hours"]), ("3", "3600000", "3"))
        notes = [(x["hour"], x["note"]) for x in r["files.tsv"] if x["hour"] != "-"]
        self.assertEqual(notes, [("2026-11-05T00Z", "ok"), ("2026-11-05T01Z", "ok"),
                                 ("2026-11-05T01Z", "skip_duplicate_label"), ("2026-11-05T02Z", "ok")])
        tail = [x["note"] for x in r["files.tsv"] if x["hour"] == "-"][0]
        self.assertIn("dirs=binance,binance-btcusdt recv_back=0", tail.replace(" bad=0", ""))

    def test_progress_lines(self):
        import contextlib
        import io
        self.write("BTCUSDT", "2026-11-05T00Z", [ws(H0, "BTCUSDT", "aggTrade")])
        self.write("BTCUSDT", "2026-11-05T09Z", [ws(H0 + 9 * 3600000, "BTCUSDT", "aggTrade")])
        e = io.StringIO()
        with contextlib.redirect_stderr(e):
            self.run_(now=H0 + 9 * 3600000 + 5)
        self.assertEqual([x for x in e.getvalue().splitlines() if x.startswith(("SYMBOL", "HOUR"))],
                         ["SYMBOL BTCUSDT files=2", "HOUR BTCUSDT 2026-11-05T00Z ok lines=1 secs=0.0",
                          "HOUR BTCUSDT 2026-11-05T09Z skip_not_finished"])


if __name__ == "__main__":
    unittest.main()
