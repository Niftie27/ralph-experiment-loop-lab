"""Tests for c4_vision_check.py (data gate criteria 4 and 5). Offline: mock Vision files are served by http.server
on localhost (port 0, own thread), mock tape files live in temp folders, the script runs as a subprocess.

Run: python3 -m unittest discover -s tools/data-gate -p "test_c4_*.py" -v
"""
import fcntl
import functools
import gzip
import hashlib
import http.server
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest
import zipfile
from datetime import datetime, timedelta, timezone
from decimal import Decimal

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "c4_vision_check.py")
TAPE_HEADER = "Time;Bids;;;;Ask;Delta;AggId;TradeTimeMs\n"
AGG_HEADER = "agg_trade_id,price,quantity,first_trade_id,last_trade_id,transact_time,is_buyer_maker"
KLINE_HEADER = ("open_time,open,high,low,close,volume,close_time,quote_volume,count,taker_buy_volume,"
                "taker_buy_quote_volume,ignore")
IP_RE = re.compile(r"([0-9]{1,3}\.){3}[0-9]{1,3}")
EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)
SYM = "BTCUSDT"
DAY = "2026-10-10"
DAY2 = "2026-10-11"
COUNT_COLUMNS = ("vision_rows tape_rows tape_hours tape_bad_rows matched format_diff_p format_diff_q mism_p mism_q "
                 "mism_T mism_m only_vision only_vision_before_start only_tape first_a last_a").split()
MISM_COLUMNS = ("format_diff_p format_diff_q mism_p mism_q mism_T mism_m only_vision only_vision_before_start "
                "only_tape tape_bad_rows").split()
K_COLUMNS = ("k_mism_open k_mism_high k_mism_low k_mism_close k_mism_volume k_mism_taker_buy k_minutes_tape_only "
             "k_minutes_kline_only").split()

SERVE_ROOT = None
SERVER = None
PORT = None
FAIL = {}            # URL path -> HTTP status served instead of the file


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def end_headers(self):
        self.send_header("ETag", '"mock-etag-1"')
        super().end_headers()

    def do_GET(self):
        code = FAIL.get(self.path)
        if code:
            self.send_error(code)
            return
        super().do_GET()


def setUpModule():
    global SERVE_ROOT, SERVER, PORT
    SERVE_ROOT = tempfile.mkdtemp(prefix="c4serve")
    SERVER = http.server.ThreadingHTTPServer(("localhost", 0), functools.partial(Handler, directory=SERVE_ROOT))
    PORT = SERVER.server_address[1]
    threading.Thread(target=SERVER.serve_forever, daemon=True).start()


def tearDownModule():
    SERVER.shutdown()
    SERVER.server_close()
    shutil.rmtree(SERVE_ROOT, ignore_errors=True)


# ---------------------------------------------------------------- mock data

def day_ms(day):
    return int(datetime.strptime(day, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp() * 1000)


def hour_key(ms):
    return (EPOCH + timedelta(milliseconds=ms)).strftime("%Y-%m-%dT%HZ")


def clock(ms):
    return (EPOCH + timedelta(milliseconds=ms)).strftime("%d.%m.%Y %H:%M:%S.") + f"{ms % 1000:03d}"


def make_trades(day, hours=range(24), start_a=None, per_hour=4):
    """[a, T, p, q, m] rows; per hour 3 trades in minute 0 and 1 in minute 1."""
    a = start_a if start_a is not None else 1_000_000 + (day_ms(day) // 86_400_000 % 1000) * 1000
    out = []
    base = day_ms(day)
    for h in hours:
        for k in range(per_hour):
            t = base + h * 3_600_000 + k * 20_000 + 7
            out.append([a, t, f"{67000 + a % 7}.{a % 10}", f"0.00{a % 9 + 1}", a % 3 == 0])
            a += 1
    return out


def tape_line(a, t, p, q, m, f3="0"):
    """A row as binance_live.tape_line writes it (bid side when m is true)."""
    if m:
        return f"{clock(t)};{p};{q};{f3};0;{p}9;-1.000;{a};{t}"
    return f"{clock(t)};{p}1;0;{f3};{q};{p};1.000;{a};{t}"


def tape_folder(home, sym):
    return os.path.join(home, "data", "binance" if sym == "BTCUSDT" else "binance-" + sym.lower())


def write_tape_file(home, sym, hour, lines, gz=True):
    folder = tape_folder(home, sym)
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, f"tape_{sym}_{hour}.csv")
    text = TAPE_HEADER + "".join(line + "\n" for line in lines)
    if gz:
        with gzip.open(path + ".gz", "wt", encoding="utf-8") as fh:
            fh.write(text)
        return path + ".gz"
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)
    return path


def write_tape(home, sym, trades, plain_hours=()):
    """Tape files grouped by the UTC hour of T, rows in the given order. plain_hours (0-23) are written as .csv."""
    by_hour = {}
    for tr in trades:
        by_hour.setdefault(hour_key(tr[1]), []).append(tr)
    for hour, rows in by_hour.items():
        write_tape_file(home, sym, hour, [tape_line(*r) for r in rows], gz=int(hour[11:13]) not in plain_hours)


def write_zip(path, member, text, bad_checksum=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(member, text)
    with open(path, "rb") as fh:
        digest = hashlib.sha256(fh.read()).hexdigest()
    if bad_checksum:
        digest = "0" * 64
    with open(path + ".CHECKSUM", "w", encoding="ascii") as fh:
        fh.write(f"{digest}  {os.path.basename(path)}\n")


def agg_zip_path(prefix, sym, day):
    return os.path.join(SERVE_ROOT, prefix, "daily", "aggTrades", sym, f"{sym}-aggTrades-{day}.zip")


def write_agg_zip(prefix, sym, day, trades, header=True, bad_checksum=False):
    lines = [AGG_HEADER] if header else []
    for a, t, p, q, m in trades:
        lines.append(f"{a},{p},{q},{a * 10},{a * 10 + 2},{t},{'true' if m else 'false'}")
    write_zip(agg_zip_path(prefix, sym, day), f"{sym}-aggTrades-{day}.csv", "\n".join(lines) + "\n", bad_checksum)


def kline_rows(day, trades):
    """1440 rows built from trades the way Binance builds them; minutes without trades have volume 0."""
    by_minute = {}
    for tr in trades:
        by_minute.setdefault(tr[1] // 60000, []).append(tr)
    rows = []
    last_close = "67000.0"
    first_minute = day_ms(day) // 60000
    for i in range(1440):
        minute = first_minute + i
        trs = sorted(by_minute.get(minute, []), key=lambda tr: tr[0])
        if trs:
            prices = [Decimal(tr[2]) for tr in trs]
            o, c = trs[0][2], trs[-1][2]
            h, lo = str(max(prices)), str(min(prices))
            vol = sum((Decimal(tr[3]) for tr in trs), Decimal("0.000"))
            buy = sum((Decimal(tr[3]) for tr in trs if not tr[4]), Decimal("0.000"))
            last_close = c
        else:
            o = h = lo = c = last_close
            vol = buy = Decimal("0.000")
        ot = minute * 60000
        rows.append([str(ot), o, h, lo, c, str(vol), str(ot + 59999), "1234.5", str(len(trs)), str(buy), "12.3", "0"])
    return rows


def write_kline_zip(prefix, sym, day, rows, header=True):
    lines = [KLINE_HEADER] if header else []
    lines += [",".join(r) for r in rows]
    path = os.path.join(SERVE_ROOT, prefix, "daily", "klines", sym, "1m", f"{sym}-1m-{day}.zip")
    write_zip(path, f"{sym}-1m-{day}.csv", "\n".join(lines) + "\n")


def read_tsv(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as fh:
        lines = fh.read().split("\n")
    header = lines[0].split("\t")
    return [dict(zip(header, line.split("\t"), strict=True)) for line in lines[1:] if line]


def tree_sha256(folder):
    out = {}
    for root, _dirs, files in os.walk(folder):
        for name in files:
            path = os.path.join(root, name)
            with open(path, "rb") as fh:
                out[os.path.relpath(path, folder)] = hashlib.sha256(fh.read()).hexdigest()
    return out


# ---------------------------------------------------------------- tests

class C4VisionCheckTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp(prefix="c4test")
        self.home = os.path.join(self.dir, "home")
        self.work = os.path.join(self.dir, "work")
        os.makedirs(self.home)
        self.prefix = self._testMethodName
        self.base = f"http://localhost:{PORT}/{self.prefix}"
        self.outputs = []        # (stdout, stderr) of every run

    def tearDown(self):
        FAIL.clear()
        shutil.rmtree(self.dir, ignore_errors=True)
        shutil.rmtree(os.path.join(SERVE_ROOT, self.prefix), ignore_errors=True)

    def check(self, *extra, end_day=DAY, work=None):
        cmd = [sys.executable, SCRIPT, "--home", self.home, "--work", work or self.work, "--base-url", self.base,
               "--end-day", end_day, "--symbols", SYM, *extra]
        env = {k: v for k, v in os.environ.items()
               if k.lower() not in ("http_proxy", "https_proxy", "all_proxy", "no_proxy")}
        env["no_proxy"] = env["NO_PROXY"] = "localhost"
        proc = subprocess.run(cmd, capture_output=True, text=True, env=env, timeout=300)
        self.outputs.append((proc.stdout, proc.stderr))
        return proc

    def days(self, work=None):
        return read_tsv(os.path.join(work or self.work, "out", "c4_days.tsv"))

    def row(self, day, kind="aggTrades", work=None):
        rows = [r for r in self.days(work) if (r["symbol"], r["day"], r["kind"]) == (SYM, day, kind)]
        self.assertTrue(rows, f"no row for {day} {kind}")
        return rows[-1]

    def details(self, day, kind="aggTrades", typ=None):
        rows = read_tsv(os.path.join(self.work, "out", "c4_details.tsv"))
        return [r for r in rows if (r["symbol"], r["day"], r["kind"]) == (SYM, day, kind)
                and (typ is None or r["type"] == typ)]

    def tmp_entries(self, work=None):
        return os.listdir(os.path.join(work or self.work, "tmp"))

    def assert_zero(self, row, columns):
        for c in columns:
            self.assertEqual(row[c], "0", f"{c} in {row}")

    def test_01_identical_day_with_header(self):
        trades = make_trades(DAY)
        write_tape(self.home, SYM, trades)
        write_agg_zip(self.prefix, SYM, DAY, trades, header=True)
        write_kline_zip(self.prefix, SYM, DAY, kline_rows(DAY, trades), header=True)
        proc = self.check("--days", DAY)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        r = self.row(DAY)
        self.assertEqual(r["status"], "ok")
        self.assertEqual(r["checksum_ok"], "yes")
        self.assertEqual(r["header"], "yes")
        self.assertEqual(r["http"], "200")
        self.assertEqual(r["etag"], '"mock-etag-1"')
        self.assertTrue(r["last_modified"])
        self.assertEqual(r["zip_sha256"], r["checksum_sha256"])
        self.assertEqual(r["zip_bytes"], str(os.path.getsize(agg_zip_path(self.prefix, SYM, DAY))))
        n = str(len(trades))
        self.assertEqual((r["vision_rows"], r["tape_rows"], r["matched"]), (n, n, n))
        self.assertEqual(r["tape_hours"], "24")
        self.assertEqual((r["first_a"], r["last_a"]), (str(trades[0][0]), str(trades[-1][0])))
        self.assert_zero(r, MISM_COLUMNS)
        k = self.row(DAY, "klines1m")
        self.assertEqual(k["status"], "ok")
        self.assertEqual(k["k_minutes_compared"], "48")
        self.assert_zero(k, K_COLUMNS)
        self.assertEqual(self.details(DAY), [])
        self.assertEqual(self.tmp_entries(), [])

    def test_02_identical_day_without_header(self):
        trades = make_trades(DAY)
        write_tape(self.home, SYM, trades)
        write_agg_zip(self.prefix, SYM, DAY, trades, header=True)
        work_a = os.path.join(self.dir, "work_a")
        self.assertEqual(self.check("--days", DAY, "--no-klines", work=work_a).returncode, 0)
        write_agg_zip(self.prefix, SYM, DAY, trades, header=False)
        proc = self.check("--days", DAY, "--no-klines")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        with_header, without = self.row(DAY, work=work_a), self.row(DAY)
        self.assertEqual((with_header["header"], without["header"]), ("yes", "no"))
        self.assertEqual(without["status"], "ok")
        for c in COUNT_COLUMNS:
            self.assertEqual(with_header[c], without[c], c)
        self.assertEqual(without["vision_rows"], str(len(trades)))

    def test_03_price_format_difference_is_a_match(self):
        trades = make_trades(DAY)
        tape = [list(t) for t in trades]
        trades[5][2], tape[5][2] = "67000.1", "67000.10"
        write_tape(self.home, SYM, tape)
        write_agg_zip(self.prefix, SYM, DAY, trades)
        proc = self.check("--days", DAY, "--no-klines")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        r = self.row(DAY)
        self.assertEqual(r["status"], "ok")
        self.assertEqual(r["format_diff_p"], "1")
        self.assertEqual((r["mism_p"], r["format_diff_q"], r["matched"]), ("0", "0", str(len(trades))))

    def test_04_field_mismatches(self):
        trades = make_trades(DAY)
        tape = [list(t) for t in trades]
        tape[3][2] = "67100.1"                  # p
        tape[7][3] = "0.555"                    # q
        tape[11][1] += 1                        # T, same minute
        tape[15][4] = not tape[15][4]           # m
        write_tape(self.home, SYM, tape)
        write_agg_zip(self.prefix, SYM, DAY, trades)
        proc = self.check("--days", DAY, "--no-klines")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        r = self.row(DAY)
        self.assertEqual(r["status"], "mismatch")
        self.assertEqual([r[c] for c in ("mism_p", "mism_q", "mism_T", "mism_m")], ["1", "1", "1", "1"])
        self.assertEqual(r["matched"], str(len(trades)))
        self.assertEqual((r["only_vision"], r["only_tape"]), ("0", "0"))
        for typ, i, field in (("mism_p", 3, 2), ("mism_q", 7, 3), ("mism_T", 11, 1)):
            d = self.details(DAY, typ=typ)
            self.assertEqual(len(d), 1, typ)
            self.assertEqual((d[0]["key"], d[0]["vision"], d[0]["tape"]),
                             (str(trades[i][0]), str(trades[i][field]), str(tape[i][field])))
        d = self.details(DAY, typ="mism_m")
        self.assertEqual(len(d), 1)
        self.assertEqual(d[0]["key"], str(trades[15][0]))
        self.assertEqual({d[0]["vision"], d[0]["tape"]}, {"true", "false"})

    def test_05_only_vision_and_only_tape(self):
        trades = make_trades(DAY)
        tape = [t for i, t in enumerate(trades) if i != 10]
        vision = [t for i, t in enumerate(trades) if i != 20]
        write_tape(self.home, SYM, tape)
        write_agg_zip(self.prefix, SYM, DAY, vision)
        proc = self.check("--days", DAY, "--no-klines")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        r = self.row(DAY)
        self.assertEqual(r["status"], "mismatch")
        self.assertEqual((r["only_vision"], r["only_tape"], r["only_vision_before_start"]), ("1", "1", "0"))
        self.assertEqual(r["matched"], str(len(trades) - 2))
        a10, a20 = trades[10][0], trades[20][0]
        self.assertEqual([d["key"] for d in self.details(DAY, typ="only_vision_run")], [f"{a10}-{a10} n=1"])
        self.assertEqual([d["key"] for d in self.details(DAY, typ="only_tape_run")], [f"{a20}-{a20} n=1"])

    def test_06_first_day_before_start(self):
        first, later = "2026-10-08", "2026-10-09"
        for day in (first, later):
            trades = make_trades(day)
            write_tape(self.home, SYM, [t for t in trades if t[1] >= day_ms(day) + 21 * 3_600_000])
            write_agg_zip(self.prefix, SYM, day, trades)
        proc = self.check("--days", f"{first},{later}", "--no-klines", end_day=later)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        r1, r2 = self.row(first), self.row(later)
        self.assertEqual((r1["status"], r1["only_vision_before_start"], r1["only_vision"]), ("ok", "84", "0"))
        self.assertEqual((r1["tape_hours"], r1["matched"]), ("3", "12"))
        self.assertEqual((r2["status"], r2["only_vision_before_start"], r2["only_vision"]), ("mismatch", "0", "84"))
        lo = make_trades(first)[0][0]
        self.assertEqual([d["key"] for d in self.details(first, typ="before_start_run")], [f"{lo}-{lo + 83} n=84"])
        self.assertEqual(self.details(first, typ="only_vision_run"), [])
        lo2 = make_trades(later)[0][0]
        self.assertEqual([d["key"] for d in self.details(later, typ="only_vision_run")], [f"{lo2}-{lo2 + 83} n=84"])

    def test_07_mixed_csv_gz_and_missing_hour(self):
        trades = make_trades(DAY)
        hour5 = [t for t in trades if hour_key(t[1]).endswith("T05Z")]
        write_tape(self.home, SYM, [t for t in trades if t not in hour5], plain_hours=set(range(0, 24, 2)))
        # hour 07 has both files: the .csv.gz (correct) wins over a .csv with other content
        write_tape_file(self.home, SYM, f"{DAY}T07Z", ["garbage"], gz=False)
        write_agg_zip(self.prefix, SYM, DAY, trades)
        proc = self.check("--days", DAY, "--no-klines")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        r = self.row(DAY)
        self.assertEqual(r["tape_hours"], "23")
        self.assertEqual((r["only_vision"], r["only_tape"], r["tape_bad_rows"]), ("4", "0", "0"))
        self.assertEqual(r["status"], "mismatch")
        lo, hi = hour5[0][0], hour5[-1][0]
        self.assertEqual([d["key"] for d in self.details(DAY, typ="only_vision_run")], [f"{lo}-{hi} n=4"])
        with open(os.path.join(self.work, "out", "c4_run.log"), encoding="utf-8") as fh:
            self.assertIn("hours with both .csv and .csv.gz, .csv.gz used: 07", fh.read())
        folder = tape_folder(self.home, SYM)
        names = os.listdir(folder)
        self.assertIn(f"tape_{SYM}_{DAY}T00Z.csv", names)
        self.assertIn(f"tape_{SYM}_{DAY}T01Z.csv.gz", names)

    def test_08_order_error_then_next_day_ok(self):
        bad, good = make_trades(DAY), make_trades(DAY2)
        tape = [list(t) for t in bad]
        tape[13], tape[14] = tape[14], tape[13]       # same hour, ids out of order
        write_tape(self.home, SYM, tape)
        write_agg_zip(self.prefix, SYM, DAY, bad)
        write_tape(self.home, SYM, good)
        write_agg_zip(self.prefix, SYM, DAY2, good)
        proc = self.check("--days", f"{DAY},{DAY2}", "--no-klines", end_day=DAY2)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        r = self.row(DAY)
        self.assertEqual(r["status"], "order_error")
        d = self.details(DAY, typ="order_error")
        self.assertTrue(1 <= len(d) <= 3, d)
        self.assertTrue(d[0]["key"].startswith(f"tape tape_{SYM}_{DAY}T03Z.csv.gz:"), d[0])
        self.assertEqual(r["tape_rows"], str(len(bad)))
        self.assertEqual(r["vision_rows"], str(len(bad)))
        r2 = self.row(DAY2)
        self.assertEqual(r2["status"], "ok")
        self.assertEqual(r2["matched"], str(len(good)))

    def test_09_checksum_mismatch(self):
        trades = make_trades(DAY)
        write_tape(self.home, SYM, trades)
        write_agg_zip(self.prefix, SYM, DAY, trades, bad_checksum=True)
        proc = self.check("--days", DAY, "--no-klines")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        r = self.row(DAY)
        self.assertEqual((r["status"], r["checksum_ok"]), ("checksum_fail", "no"))
        self.assertEqual(r["checksum_sha256"], "0" * 64)
        self.assertNotEqual(r["zip_sha256"], r["checksum_sha256"])
        for c in ("matched", "vision_rows", "mism_p", "only_vision", "only_tape", "header"):
            self.assertEqual(r[c], "", c)
        self.assertEqual(self.details(DAY), [])
        self.assertEqual(self.tmp_entries(), [])

    def test_10_vision_404_then_next_day(self):
        write_tape(self.home, SYM, make_trades(DAY))
        good = make_trades(DAY2)
        write_tape(self.home, SYM, good)
        write_agg_zip(self.prefix, SYM, DAY2, good)
        proc = self.check("--days", f"{DAY},{DAY2}", "--no-klines", end_day=DAY2)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        r = self.row(DAY)
        self.assertEqual((r["status"], r["http"]), ("vision_missing", "404"))
        self.assertEqual(r["tape_rows"], str(len(make_trades(DAY))))
        self.assertEqual(self.row(DAY2)["status"], "ok")
        self.assertEqual(self.tmp_entries(), [])

    def test_11_klines(self):
        first, d_a, d_b, d_c = "2026-10-08", DAY, DAY2, "2026-10-12"
        for day in (first, d_a, d_b, d_c):
            trades = make_trades(day)
            tape = [t for t in trades if day != first or t[1] >= day_ms(day) + 21 * 3_600_000]
            write_tape(self.home, SYM, tape)
            write_agg_zip(self.prefix, SYM, day, trades)
            rows = kline_rows(day, trades)
            if day == d_b:                     # one wrong high in a minute with trades (01:00)
                rows[60][2] = str(Decimal(rows[60][2]) + 1)
            if day == d_c:                     # volume in 10:30, a minute without tape trades
                self.assertEqual(rows[630][5], "0.000")
                rows[630][5] = "1.000"
            write_kline_zip(self.prefix, SYM, day, rows, header=day != d_b)
        proc = self.check("--days", ",".join((first, d_a, d_b, d_c)), end_day=d_c)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        k1 = self.row(first, "klines1m")       # first day: minutes before the first tape trade are skipped
        self.assertEqual((k1["status"], k1["k_minutes_compared"], k1["k_minutes_kline_only"]), ("ok", "6", "0"))
        ka = self.row(d_a, "klines1m")
        self.assertEqual((ka["status"], ka["header"], ka["vision_rows"], ka["k_minutes_compared"]),
                         ("ok", "yes", "1440", "48"))
        self.assert_zero(ka, K_COLUMNS)
        kb = self.row(d_b, "klines1m")
        self.assertEqual((kb["status"], kb["header"], kb["vision_rows"], kb["k_mism_high"]),
                         ("mismatch", "no", "1440", "1"))
        self.assert_zero(kb, [c for c in K_COLUMNS if c != "k_mism_high"])
        d = self.details(d_b, "klines1m", "k_mism_high")
        self.assertEqual([x["key"] for x in d], [f"{d_b}T01:00Z"])
        kc = self.row(d_c, "klines1m")
        self.assertEqual((kc["status"], kc["k_minutes_kline_only"]), ("mismatch", "1"))
        self.assert_zero(kc, [c for c in K_COLUMNS if c != "k_minutes_kline_only"])
        self.assertEqual([x["key"] for x in self.details(d_c, "klines1m", "k_kline_only")], [f"{d_c}T10:30Z"])
        for day in (first, d_a, d_b, d_c):
            self.assertEqual(self.row(day)["status"], "ok", day)
        self.assertEqual(self.tmp_entries(), [])

    def test_12_resume_and_retry_after_500(self):
        for day in (DAY, DAY2):
            trades = make_trades(day)
            write_tape(self.home, SYM, trades)
            write_agg_zip(self.prefix, SYM, day, trades)
        proc = self.check("--days", DAY, "--no-klines", end_day=DAY2)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(len(self.days()), 1)
        FAIL[f"/{self.prefix}/daily/aggTrades/{SYM}/{SYM}-aggTrades-{DAY2}.zip"] = 500
        proc = self.check("--no-klines", end_day=DAY2)
        self.assertEqual(proc.returncode, 1, proc.stderr)
        r = self.row(DAY2)
        self.assertEqual((r["status"], r["http"]), ("download_error", "500"))
        FAIL.clear()
        proc = self.check("--no-klines", end_day=DAY2)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(self.row(DAY2)["status"], "ok")
        rows = self.days()
        keys = [(r["symbol"], r["day"], r["kind"]) for r in rows if r["status"] != "download_error"]
        self.assertEqual(len(keys), len(set(keys)), keys)
        self.assertEqual([(r["day"], r["status"]) for r in rows],
                         [(DAY, "ok"), ("2026-10-08", "tape_missing"), ("2026-10-09", "tape_missing"),
                          (DAY2, "download_error"), (DAY2, "ok")])
        proc = self.check("--no-klines", end_day=DAY2)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(len(self.days()), 5)
        with open(os.path.join(self.work, "out", "c4_run.log"), encoding="utf-8") as fh:
            ends = [line.split("\t") for line in fh.read().splitlines() if line.split("\t")[1:2] == ["END"]]
        self.assertEqual([e[-1] for e in ends], ["exit=0", "exit=1", "exit=0", "exit=0"])

    def test_13_tmp_empty_and_tape_untouched(self):
        trades = make_trades(DAY)
        write_tape(self.home, SYM, trades, plain_hours={3})
        write_agg_zip(self.prefix, SYM, DAY, trades)
        write_kline_zip(self.prefix, SYM, DAY, kline_rows(DAY, trades))
        before = tree_sha256(self.home)
        proc = self.check("--days", DAY)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(self.tmp_entries(), [])
        work2 = os.path.join(self.dir, "work2")
        os.makedirs(os.path.join(work2, "tmp"))
        with open(os.path.join(work2, "tmp", "leftover.zip"), "wb") as fh:
            fh.write(b"x")
        proc = self.check("--days", DAY, work=work2)
        self.assertEqual(proc.returncode, 2)
        self.assertIn("tmp/ is not empty", proc.stderr)
        self.assertEqual(sorted(os.listdir(work2)), ["tmp"])
        self.assertEqual(os.listdir(os.path.join(work2, "tmp")), ["leftover.zip"])
        self.assertEqual(tree_sha256(self.home), before)

    def test_14_malformed_tape_rows(self):
        trades = make_trades(DAY)
        lines = [tape_line(*t) for t in trades if hour_key(t[1]).endswith("T02Z")]
        good_two = lines[:]
        lines.insert(1, "01.01.2026 00:00:00.000;67000.1;0.001;0;0;67000.2;0;123")     # 8 fields
        lines.insert(3, tape_line(*trades[9], f3="1"))                                 # field 3 not 0
        write_tape(self.home, SYM, [t for t in trades if not hour_key(t[1]).endswith("T02Z")])
        write_tape_file(self.home, SYM, f"{DAY}T02Z", lines)
        write_agg_zip(self.prefix, SYM, DAY, trades)
        write_kline_zip(self.prefix, SYM, DAY, kline_rows(DAY, trades))
        proc = self.check("--days", DAY)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        r = self.row(DAY)
        self.assertEqual((r["status"], r["tape_bad_rows"]), ("bad_rows", "2"))
        self.assertEqual(r["tape_rows"], str(len(trades)))
        self.assert_zero(r, [c for c in MISM_COLUMNS if c != "tape_bad_rows"])
        d = self.details(DAY, typ="bad_tape_row")
        self.assertEqual([x["key"] for x in d], [f"tape_{SYM}_{DAY}T02Z.csv.gz:3", f"tape_{SYM}_{DAY}T02Z.csv.gz:5"])
        self.assertTrue(d[0]["tape"].startswith("8 fields"), d[0])
        self.assertTrue(d[1]["tape"].startswith("field 3 not 0"), d[1])
        self.assertEqual(len(good_two), 4)
        k = self.row(DAY, "klines1m")
        self.assertEqual((k["status"], k["tape_bad_rows"]), ("bad_rows", "2"))
        self.assert_zero(k, K_COLUMNS)

    def test_15_no_paths_and_no_ip_literals(self):
        days = [DAY, DAY2, "2026-10-12", "2026-10-13", "2026-10-14"]
        for day in days:
            trades = make_trades(day)
            write_tape(self.home, SYM, trades)
            if day != DAY2:                                         # DAY2: 404
                write_agg_zip(self.prefix, SYM, day, trades, bad_checksum=day == "2026-10-13")
        FAIL[f"/{self.prefix}/daily/aggTrades/{SYM}/{SYM}-aggTrades-2026-10-12.zip"] = 500
        with open(os.path.join(tape_folder(self.home, SYM), f"tape_{SYM}_2026-10-14T05Z.csv.gz"), "wb") as fh:
            fh.write(b"not gzip")                                   # read error detail
        proc = self.check("--days", ",".join(days), "--no-klines", end_day=days[-1])
        self.assertEqual(proc.returncode, 1, proc.stderr)
        self.assertEqual(self.row(DAY2)["status"], "vision_missing")
        self.assertEqual(self.row("2026-10-12")["status"], "download_error")
        self.assertEqual(self.row("2026-10-13")["status"], "checksum_fail")
        self.assertEqual(self.row("2026-10-14")["status"], "mismatch")
        self.assertTrue(self.details("2026-10-14", typ="bad_tape_row"))
        self.assertEqual(self.check("--symbols", "XRPUSDT").returncode, 2)
        texts = list(self.outputs[-2]) + list(self.outputs[-1])
        for name in os.listdir(os.path.join(self.work, "out")):
            with open(os.path.join(self.work, "out", name), encoding="utf-8") as fh:
                texts.append(fh.read())
        with open(os.path.join(self.work, "out", "c4_run.log"), encoding="utf-8") as fh:
            self.assertIn("HTTP 500", fh.read())
        private = {self.dir, os.path.realpath(self.dir), self.home, self.work, SERVE_ROOT, HERE,
                   tempfile.gettempdir() + os.sep}
        for text in texts:
            for p in private:
                self.assertNotIn(p, text)
            self.assertIsNone(IP_RE.search(text), IP_RE.search(text))
        # The error-text filter itself: home -> ~, work -> <work>, no tab or line break.
        sys.path.insert(0, HERE)
        try:
            import c4_vision_check as c4
        finally:
            sys.path.remove(HERE)
        c4.set_private_paths(self.work, self.home)
        self.assertEqual(c4.clean(f"open {self.home}/data/x\tthen {self.work}/tmp/y\n"),
                         "open ~/data/x then <work>/tmp/y ")

    def test_16_lock_held(self):
        trades = make_trades(DAY)
        write_tape(self.home, SYM, trades)
        write_agg_zip(self.prefix, SYM, DAY, trades)
        os.makedirs(self.work)
        fd = os.open(os.path.join(self.work, "lock"), os.O_RDWR | os.O_CREAT)
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            proc = self.check("--days", DAY, "--no-klines")
            self.assertEqual(proc.returncode, 2)
            self.assertIn("lock", proc.stderr)
            self.assertEqual(os.listdir(self.work), ["lock"])
        finally:
            fcntl.flock(fd, fcntl.LOCK_UN)
            os.close(fd)
        proc = self.check("--days", DAY, "--no-klines")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(self.row(DAY)["status"], "ok")

    def test_17_bad_arguments(self):
        for extra in (("--symbols", "XRPUSDT"), ("--end-day", "2026-13-01"), ("--days", "2026-10-1"),
                      ("--base-url", "ftp://localhost/x")):
            proc = self.check(*extra)
            self.assertEqual(proc.returncode, 2, extra)
            self.assertFalse(os.path.exists(self.work), extra)


if __name__ == "__main__":
    unittest.main()
