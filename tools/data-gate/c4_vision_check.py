#!/usr/bin/env python3
"""c4_vision_check.py - data gate criteria 4 and 5: the collector's trade tape vs Binance Vision (USD-M futures).

Criterion 4: every aggTrade of a UTC day in the local tape (tape files of tools/collector/binance_live.py) is
compared, trade by trade on the aggTrade id a, with Binance Vision's daily aggTrades file: price p and size q as
Decimal, trade time T as int, buyer-is-maker m as bool.
Criterion 5: 1-minute bars built in the same tape pass are compared with Vision's daily 1m klines: open, high, low,
close, volume and taker buy volume as Decimal. The kline count and quote columns are not compared.

Stdlib only and streaming: memory holds the per-minute bars of one day, capped detail rows and counters.
The tape is only read. Everything written goes under --work:
  out/c4_days.tsv     one row per (symbol, day, kind); kind = aggTrades or klines1m
  out/c4_details.tsv  examples per (symbol, day, kind, type): at most 20, ID runs at most 50, order_error 3
  out/c4_run.log      one line per processed (symbol, day, kind), then an END line
  tmp/                the running day's downloads, deleted after use
  lock                fcntl lock: one run at a time

Statuses: ok, mismatch, bad_rows (bad tape rows are the only problem), tape_missing, order_error,
vision_parse_error, checksum_fail, vision_missing, download_error. Only download_error is processed again by a
later run (resume); every other status is final.

Usage:
  c4_vision_check.py [--work DIR] [--home DIR] [--symbols LIST] [--end-day YYYY-MM-DD] [--days LIST]
                     [--base-url URL] [--no-klines]
Exit: 0 every processed (symbol, day, kind) got a final status; 1 a download_error (or an unexpected error);
2 refused (bad arguments, unknown symbol, tmp/ not empty, lock held, unreadable earlier outputs).

Definitions this script uses where the task leaves a choice:
  first_a, last_a   lowest and highest valid tape aggTrade id of the day (aggTrades rows only).
  tape columns      tape_rows, tape_hours and tape_bad_rows are filled on klines1m rows too (same tape pass).
  bad_tape_row and the tape's order_error details are recorded under kind aggTrades only.
  Comparison columns stay empty when no comparison ran (download failure, checksum_fail, tape_missing).
"""
import argparse
import csv
import decimal
import fcntl
import gzip
import hashlib
import http.client
import io
import os
import re
import signal
import stat
import sys
import time
import traceback
import urllib.error
import urllib.request
import zipfile
import zlib
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation

DEFAULT_BASE_URL = "https://data.binance.vision/data/futures/um"
DEFAULT_END_DAY = "2026-11-03"
START_HOURS = {                       # first tape hour per symbol (UTC)
    "BTCUSDT": "2026-10-08T21Z",
    "ETHUSDT": "2026-10-09T05Z",
    "SOLUSDT": "2026-10-09T05Z",
    "HYPEUSDT": "2026-10-09T06Z",
}
DEFAULT_SYMBOLS = ",".join(START_HOURS)
TAPE_HEADER = "Time;Bids;;;;Ask;Delta;AggId;TradeTimeMs"
AGG, KL = "aggTrades", "klines1m"

DAYS_COLUMNS = (
    "symbol day kind status http last_modified etag zip_bytes zip_sha256 checksum_sha256 checksum_ok header "
    "vision_rows tape_rows tape_hours tape_bad_rows matched format_diff_p format_diff_q mism_p mism_q mism_T mism_m "
    "only_vision only_vision_before_start only_tape first_a last_a k_minutes_compared k_mism_open k_mism_high "
    "k_mism_low k_mism_close k_mism_volume k_mism_taker_buy k_minutes_tape_only k_minutes_kline_only"
).split()
DETAILS_COLUMNS = "symbol day kind type key vision tape".split()
RUN_TYPES = frozenset(("only_vision_run", "only_tape_run", "before_start_run"))
CAP_DETAIL, CAP_RUN, CAP_ORDER = 20, 50, 3

HTTP_TIMEOUT_S = 120
RETRY_DELAY_S = 2
CHUNK = 1 << 20
CHECKSUM_MAX_BYTES = 65536
USER_AGENT = "c4-vision-check/1"
IPV4_RE = re.compile(r"([0-9]{1,3}\.){3}[0-9]{1,3}")
DAY_RE = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}")
SHA256_RE = re.compile(r"[0-9a-fA-F]{64}")
EPOCH = datetime(1970, 1, 1, tzinfo=timezone.utc)
ZERO = Decimal(0)


class Refuse(Exception):
    """Exit 2 before anything is written."""


# ---------------------------------------------------------------- text helpers

_PRIVATE = []          # (path, replacement), longest first; filled by set_private_paths


def set_private_paths(work, home):
    pairs = []
    for path, repl in ((work, "<work>"), (home, "~"), (os.path.expanduser("~"), "~")):
        for p in {path, os.path.abspath(path), os.path.realpath(path)}:
            p = p.rstrip(os.sep)
            if len(p) > 1:
                pairs.append((p, repl))
    pairs.sort(key=lambda x: -len(x[0]))
    _PRIVATE[:] = pairs


def clean(value):
    """Text that is safe to write: home as ~, work as <work>, no IPv4 literal, no tab or line break."""
    s = "" if value is None else str(value)
    for path, repl in _PRIVATE:
        if path in s:
            s = s.replace(path, repl)
    if "." in s:
        s = IPV4_RE.sub("<ip>", s)
    return s.replace("\t", " ").replace("\r", " ").replace("\n", " ")


def describe_error(e):
    if isinstance(e, urllib.error.HTTPError):
        return f"HTTP {e.code}"
    if isinstance(e, OSError) and getattr(e, "filename", None):
        return f"{type(e).__name__}: {e.strerror or e} ({os.path.basename(str(e.filename))})"
    return f"{type(e).__name__}: {e}"


def utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def iso_ms(ms):
    try:
        return (EPOCH + timedelta(milliseconds=ms)).strftime("%Y-%m-%dT%H:%M:%S.") + f"{ms % 1000:03d}Z"
    except (OverflowError, ValueError):
        return str(ms)


def iso_minute(minute):
    try:
        return (EPOCH + timedelta(minutes=minute)).strftime("%Y-%m-%dT%H:%MZ")
    except (OverflowError, ValueError):
        return str(minute)


def isint(s):
    """Plain ASCII digits, at most 20 (ids and ms times; also keeps int() away from huge strings)."""
    return s.isdigit() and s.isascii() and len(s) <= 20


def dec(s):
    """Finite Decimal of s, or None. Decimal(text) is exact whatever the context precision."""
    try:
        d = Decimal(s)
    except (InvalidOperation, ValueError, TypeError):
        return None
    return d if d.is_finite() else None


# ---------------------------------------------------------------- details and order positions

class Details:
    """Capped detail rows of one (symbol, day, kind)."""

    def __init__(self):
        self.rows = []
        self.counts = {}

    @staticmethod
    def cap(typ):
        return CAP_ORDER if typ == "order_error" else CAP_RUN if typ in RUN_TYPES else CAP_DETAIL

    def full(self, typ):
        return self.counts.get(typ, 0) >= self.cap(typ)

    def add(self, typ, key, vision="", tape=""):
        n = self.counts.get(typ, 0)
        if n >= self.cap(typ):
            return
        self.counts[typ] = n + 1
        self.rows.append((typ, key, vision, tape))


class Order:
    """Strictly increasing id check shared by the tape and the Vision stream of one day."""

    def __init__(self, details):
        self.details = details
        self.count = 0

    @property
    def violated(self):
        return self.count > 0

    def violation(self, where, vision="", tape=""):
        self.count += 1
        if self.details is not None:
            self.details.add("order_error", where, vision, tape)


class Runs:
    """Consecutive ids of one kind (only in Vision, only in tape, before start) merged into lo-hi runs."""

    def __init__(self, details, typ, vision_side):
        self.details, self.typ, self.vision_side = details, typ, vision_side
        self.lo = self.hi = self.t_lo = self.t_hi = None

    def add(self, a, t):
        if self.hi is not None and a == self.hi + 1:
            self.hi, self.t_hi = a, t
            return
        self.flush()
        self.lo = self.hi = a
        self.t_lo = self.t_hi = t

    def flush(self):
        if self.lo is None:
            return
        if not self.details.full(self.typ):
            span = f"T {iso_ms(self.t_lo)}..{iso_ms(self.t_hi)}"
            key = f"{self.lo}-{self.hi} n={self.hi - self.lo + 1}"
            self.details.add(self.typ, key, span if self.vision_side else "", "" if self.vision_side else span)
        self.lo = self.hi = None


# ---------------------------------------------------------------- tape

def tape_dir(home, sym):
    if sym == "BTCUSDT":
        return os.path.join(home, "data", "binance")
    return os.path.join(home, "data", "binance-" + sym.lower())


def tape_paths(home, sym, day):
    """Hour files 00..23 of a UTC day that exist, in hour order; .csv.gz preferred over .csv.
    Also returns the hours that have both files (binance_live rebuilds a compressed hour's .csv when a very
    late trade arrives, and storage maintenance skips an hour whose .csv.gz exists)."""
    folder = tape_dir(home, sym)
    out, both = [], []
    for hour in range(24):
        base = os.path.join(folder, f"tape_{sym}_{day}T{hour:02d}Z.csv")
        if os.path.isfile(base + ".gz"):
            out.append(base + ".gz")
            if os.path.isfile(base):
                both.append(f"{hour:02d}")
        elif os.path.isfile(base):
            out.append(base)
    return out, both


class Bar:
    """One tape minute: open/close by lowest/highest a, high, low, volume, taker buy volume (m false)."""
    __slots__ = ("oa", "op", "od", "ca", "cp", "cd", "hp", "hd", "lp", "ld", "vol", "buy", "n")

    def __init__(self, a, p, pd, qd, m):
        self.oa = self.ca = a
        self.op = self.cp = self.hp = self.lp = p
        self.od = self.cd = self.hd = self.ld = pd
        self.vol = qd
        self.buy = ZERO if m else qd
        self.n = 1

    def add(self, a, p, pd, qd, m):
        if a < self.oa:
            self.oa, self.op, self.od = a, p, pd
        elif a > self.ca:
            self.ca, self.cp, self.cd = a, p, pd
        if pd > self.hd:
            self.hp, self.hd = p, pd
        elif pd < self.ld:
            self.lp, self.ld = p, pd
        self.vol += qd
        if not m:
            self.buy += qd
        self.n += 1


class TapeReader:
    """One streaming pass over the hour files of a day. Yields (a, T, p, q, m, Decimal p, Decimal q) for every
    valid row in file order, counts rows and bad rows, checks that a strictly increases, builds minute bars."""

    def __init__(self, paths, details, order, want_bars):
        self.paths = paths
        self.details = details
        self.order = order
        self.bars = {} if want_bars else None
        self.rows = 0
        self.bad = 0
        self.min_a = self.min_a_t = self.max_a = None

    def _bad(self, where, why, text):
        self.bad += 1
        if self.details is not None:
            self.details.add("bad_tape_row", where, "", f"{why}: {text[:200]}")

    def __iter__(self):
        prev = None
        bars = self.bars
        cur_minute = cur_bar = None
        last_p = last_pd = None
        for path in self.paths:
            name = os.path.basename(path)
            lineno = 0
            try:
                if path.endswith(".gz"):
                    fh = gzip.open(path, "rt", encoding="utf-8", errors="replace")
                else:
                    fh = open(path, "r", encoding="utf-8", errors="replace")
                with fh:
                    for line in fh:
                        lineno += 1
                        line = line.rstrip("\r\n")
                        if lineno == 1 and line == TAPE_HEADER:
                            continue
                        f = line.split(";")
                        if len(f) != 9:
                            self._bad(f"{name}:{lineno}", f"{len(f)} fields, expected 9", line)
                            continue
                        sa, st, f2 = f[7], f[8], f[2]
                        if not isint(sa):
                            self._bad(f"{name}:{lineno}", "aggTrade id not an integer", line)
                            continue
                        if not isint(st):
                            self._bad(f"{name}:{lineno}", "trade time not an integer", line)
                            continue
                        if f[3] != "0":
                            self._bad(f"{name}:{lineno}", "field 3 not 0", line)
                            continue
                        if f2 != "0":
                            qd = dec(f2)
                            if qd is None or qd <= 0:
                                self._bad(f"{name}:{lineno}", "bid size neither a number > 0 nor 0", line)
                                continue
                            if f[4] != "0":
                                self._bad(f"{name}:{lineno}", "bid row with ask size not 0", line)
                                continue
                            p, q, m = f[1], f2, True
                        else:
                            p, q, m = f[5], f[4], False
                            qd = dec(q)
                            if qd is None:
                                self._bad(f"{name}:{lineno}", "ask size not a number", line)
                                continue
                        if p == last_p:
                            pd = last_pd
                        else:
                            pd = dec(p)
                            if pd is None:
                                self._bad(f"{name}:{lineno}", "price not a number", line)
                                continue
                            last_p, last_pd = p, pd
                        a, t = int(sa), int(st)
                        if prev is not None and a <= prev:
                            self.order.violation(f"tape {name}:{lineno}", "", f"a={a} after a={prev}")
                        prev = a
                        self.rows += 1
                        if self.min_a is None or a < self.min_a:
                            self.min_a, self.min_a_t = a, t
                        if self.max_a is None or a > self.max_a:
                            self.max_a = a
                        if bars is not None:
                            minute = t // 60000
                            if minute == cur_minute:
                                cur_bar.add(a, p, pd, qd, m)
                            else:
                                bar = bars.get(minute)
                                if bar is None:
                                    bars[minute] = bar = Bar(a, p, pd, qd, m)
                                else:
                                    bar.add(a, p, pd, qd, m)
                                cur_minute, cur_bar = minute, bar
                        yield (a, t, p, q, m, pd, qd)
            except (OSError, EOFError, zlib.error) as e:
                # A damaged file counts as one bad row; the rest of that file is skipped.
                self._bad(f"{name}:{lineno + 1}", "read error, rest of file skipped", describe_error(e))


# ---------------------------------------------------------------- Vision

class VisionCsv:
    """The one CSV inside a Vision zip, streamed (never extracted). Detects the header row."""

    def __init__(self, zip_path, ncols, details):
        self.zip_path = zip_path
        self.ncols = ncols
        self.details = details
        self.header = None
        self.rows = 0
        self.error = None

    def fail(self, rownum, why, text=""):
        if self.error is None:
            self.error = why
            self.details.add("vision_parse_error", f"row {rownum}: {why}", text[:200], "")

    def records(self):
        rownum = 0
        try:
            with zipfile.ZipFile(self.zip_path) as zf:
                members = [i for i in zf.infolist() if not i.is_dir()]
                if len(members) != 1 or not members[0].filename.lower().endswith(".csv"):
                    self.fail(0, f"zip holds {len(members)} files, expected one CSV")
                    return
                with zf.open(members[0]) as raw, io.TextIOWrapper(raw, encoding="utf-8-sig", newline="") as text:
                    for rec in csv.reader(text):
                        rownum += 1
                        if not rec:
                            continue
                        if self.header is None:
                            self.header = not isint(rec[0])
                            if self.header:
                                continue
                        if len(rec) != self.ncols:
                            self.fail(rownum, f"{len(rec)} fields, expected {self.ncols}", ",".join(rec))
                            return
                        yield rownum, rec
        except (zipfile.BadZipFile, zipfile.LargeZipFile, zlib.error, OSError, EOFError, UnicodeDecodeError,
                csv.Error, NotImplementedError, RuntimeError) as e:
            self.fail(rownum, "read error: " + describe_error(e))


def vision_agg_rows(vcsv, order):
    """Yields (a, T, p, q, m) from a Vision aggTrades CSV; checks that a strictly increases."""
    prev = None
    gen = vcsv.records()
    try:
        for rownum, rec in gen:
            sa, p, q, _first, _last, st, sm = rec
            if not (isint(sa) and isint(st)):
                vcsv.fail(rownum, "agg_trade_id or transact_time not an integer", ",".join(rec))
                return
            low = sm.lower()
            if low == "true":
                m = True
            elif low == "false":
                m = False
            else:
                vcsv.fail(rownum, "is_buyer_maker not true or false", ",".join(rec))
                return
            a = int(sa)
            if prev is not None and a <= prev:
                order.violation(f"vision row {rownum}", f"a={a} after a={prev}", "")
            prev = a
            vcsv.rows += 1
            yield (a, int(st), p, q, m)
    finally:
        gen.close()


class Download:
    __slots__ = ("outcome", "http", "last_modified", "etag", "size", "sha256", "error")

    def __init__(self):
        self.outcome, self.http, self.error = "error", None, ""
        self.last_modified = self.etag = self.sha256 = ""
        self.size = None


def download(url, dest):
    """Stream url to dest while hashing. One retry on error; HTTP 404 is final at once."""
    res = Download()
    for attempt in (1, 2):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
                res.http = resp.status
                if resp.status != 200:
                    raise OSError(f"HTTP {resp.status}")
                res.last_modified = resp.headers.get("Last-Modified", "")
                res.etag = resp.headers.get("ETag", "")
                expected = resp.headers.get("Content-Length")
                digest = hashlib.sha256()
                size = 0
                with open(dest, "wb") as out:
                    while True:
                        chunk = resp.read(CHUNK)
                        if not chunk:
                            break
                        out.write(chunk)
                        digest.update(chunk)
                        size += len(chunk)
                if expected and expected.isdigit() and int(expected) != size:
                    raise OSError(f"short body, {size} of {expected} bytes")
                res.size, res.sha256, res.outcome, res.error = size, digest.hexdigest(), "ok", ""
                return res
        except urllib.error.HTTPError as e:
            res.http = e.code
            try:
                e.close()
            except Exception:
                pass
            if e.code == 404:
                res.outcome, res.error = "missing", "HTTP 404"
                return res
            res.error = f"HTTP {e.code}"
        except (urllib.error.URLError, http.client.HTTPException, OSError, ValueError) as e:
            res.error = describe_error(e)
        if attempt == 1:
            time.sleep(RETRY_DELAY_S)
    res.outcome = "error"
    return res


def parse_checksum(path, zip_name):
    """(sha256 hex or None, problem text or "") from a Vision .CHECKSUM file: "<sha256>  <zip name>"."""
    with open(path, "rb") as fh:
        data = fh.read(CHECKSUM_MAX_BYTES + 1)
    if len(data) > CHECKSUM_MAX_BYTES:
        return None, "CHECKSUM file too large"
    try:
        parts = data.decode("ascii").split()
    except UnicodeDecodeError:
        return None, "CHECKSUM file not ASCII"
    if not parts or not SHA256_RE.fullmatch(parts[0]):
        return None, "CHECKSUM file has no sha256"
    value = parts[0].lower()
    if len(parts) > 2 or (len(parts) == 2 and parts[1].lstrip("*") != zip_name):
        return value, "CHECKSUM file names another file"
    return value, ""


def vision_zip_name(sym, day, kind):
    return f"{sym}-aggTrades-{day}.zip" if kind == AGG else f"{sym}-1m-{day}.zip"


def expected_names(sym, day, kind):
    name = vision_zip_name(sym, day, kind)
    return frozenset((name, name + ".CHECKSUM"))


def vision_url(base, sym, day, kind):
    name = vision_zip_name(sym, day, kind)
    if kind == AGG:
        return f"{base}/daily/aggTrades/{sym}/{name}"
    return f"{base}/daily/klines/{sym}/1m/{name}"


# ---------------------------------------------------------------- comparisons

def compare_agg(tape, vcsv, order, det, first_day, row):
    """Merge-join of the tape and the Vision aggTrades stream on a. Returns the stop reason or ""."""
    tape_it = iter(tape)
    vis_it = vision_agg_rows(vcsv, order)
    matched = fdp = fdq = mp = mq = mt = mm = only_v = before = only_t = 0
    runs_v = Runs(det, "only_vision_run", True)
    runs_b = Runs(det, "before_start_run", True)
    runs_t = Runs(det, "only_tape_run", False)
    t = next(tape_it, None)
    v = next(vis_it, None)
    first_tape_a = t[0] if t is not None else None
    stop = ""
    while t is not None or v is not None:
        if order.violated:
            stop = "order_error"
            break
        if vcsv.error:
            stop = "vision_parse_error"
            break
        if v is None or (t is not None and t[0] < v[0]):
            only_t += 1
            runs_t.add(t[0], t[1])
            t = next(tape_it, None)
        elif t is None or v[0] < t[0]:
            if first_day and first_tape_a is not None and v[0] < first_tape_a:
                before += 1
                runs_b.add(v[0], v[1])
            else:
                only_v += 1
                runs_v.add(v[0], v[1])
            v = next(vis_it, None)
        else:
            matched += 1
            a = t[0]
            if t[2] != v[2]:
                vd = dec(v[2])
                if vd is not None and vd == t[5]:
                    fdp += 1
                else:
                    mp += 1
                    det.add("mism_p", str(a), v[2], t[2])
            if t[3] != v[3]:
                vd = dec(v[3])
                if vd is not None and vd == t[6]:
                    fdq += 1
                else:
                    mq += 1
                    det.add("mism_q", str(a), v[3], t[3])
            if t[1] != v[1]:
                mt += 1
                det.add("mism_T", str(a), str(v[1]), str(t[1]))
            if t[4] != v[4]:
                mm += 1
                det.add("mism_m", str(a), "true" if v[4] else "false", "true" if t[4] else "false")
            t = next(tape_it, None)
            v = next(vis_it, None)
    if not stop:
        stop = "order_error" if order.violated else "vision_parse_error" if vcsv.error else ""
    for runs in (runs_v, runs_b, runs_t):
        runs.flush()
    for _ in tape_it:          # finish the tape pass: counts, bars and order positions
        pass
    for _ in vis_it:           # finish the Vision stream: row count and order positions
        pass
    row.update(matched=matched, format_diff_p=fdp, format_diff_q=fdq, mism_p=mp, mism_q=mq, mism_T=mt, mism_m=mm,
               only_vision=only_v, only_vision_before_start=before, only_tape=only_t)
    return stop


def compare_klines(zip_path, bars, skip_before, det, row):
    """Vision 1m klines vs tape minute bars. Returns the stop reason or ""."""
    vcsv = VisionCsv(zip_path, 12, det)
    order = Order(det)
    seen = set()
    compared = k_open = k_high = k_low = k_close = k_vol = k_buy = kline_only = tape_only = 0
    prev = None
    stop = ""
    gen = vcsv.records()
    try:
        for rownum, rec in gen:
            if not isint(rec[0]):
                vcsv.fail(rownum, "open_time not an integer", ",".join(rec))
                break
            open_time = int(rec[0])
            if open_time % 60000:
                vcsv.fail(rownum, "open_time not on a minute", ",".join(rec))
                break
            vals = [dec(rec[i]) for i in (1, 2, 3, 4, 5, 9)]
            if any(x is None for x in vals):
                vcsv.fail(rownum, "price or volume not a number", ",".join(rec))
                break
            if prev is not None and open_time <= prev:
                order.violation(f"vision row {rownum}", f"open_time={open_time} after {prev}", "")
                stop = "order_error"
                break
            prev = open_time
            vcsv.rows += 1
            minute = open_time // 60000
            if skip_before is not None and minute < skip_before:
                continue
            o, h, lo, c, vol, buy = vals
            bar = bars.get(minute)
            if bar is None:
                if vol > 0:
                    kline_only += 1
                    det.add("k_kline_only", iso_minute(minute), f"volume={rec[5]}", "")
                continue
            seen.add(minute)
            compared += 1
            key = iso_minute(minute)
            if o != bar.od:
                k_open += 1
                det.add("k_mism_open", key, rec[1], bar.op)
            if h != bar.hd:
                k_high += 1
                det.add("k_mism_high", key, rec[2], bar.hp)
            if lo != bar.ld:
                k_low += 1
                det.add("k_mism_low", key, rec[3], bar.lp)
            if c != bar.cd:
                k_close += 1
                det.add("k_mism_close", key, rec[4], bar.cp)
            if vol != bar.vol:
                k_vol += 1
                det.add("k_mism_volume", key, rec[5], str(bar.vol))
            if buy != bar.buy:
                k_buy += 1
                det.add("k_mism_taker_buy", key, rec[9], str(bar.buy))
    finally:
        gen.close()
    if not stop and vcsv.error:
        stop = "vision_parse_error"
    if not stop:
        for minute in sorted(bars):
            if minute in seen or (skip_before is not None and minute < skip_before):
                continue
            tape_only += 1
            bar = bars[minute]
            det.add("k_tape_only", iso_minute(minute), "", f"trades={bar.n} volume={bar.vol}")
    row.update(header="" if vcsv.header is None else "yes" if vcsv.header else "no", vision_rows=vcsv.rows,
               k_minutes_compared=compared, k_mism_open=k_open, k_mism_high=k_high, k_mism_low=k_low,
               k_mism_close=k_close, k_mism_volume=k_vol, k_mism_taker_buy=k_buy,
               k_minutes_tape_only=tape_only, k_minutes_kline_only=kline_only)
    return stop


def final_status(stop, problems, bad_rows):
    if stop:
        return stop
    if problems:
        return "mismatch"
    if bad_rows:
        return "bad_rows"
    return "ok"


# ---------------------------------------------------------------- run

class Run:
    def __init__(self, args, work, home, tmp, out):
        self.args, self.work, self.home, self.tmp, self.out = args, work, home, tmp, out
        self.processed = self.skipped = self.download_errors = 0
        self.days_fh = self.details_fh = self.log_fh = None

    def open_outputs(self):
        os.makedirs(self.out, exist_ok=True)
        os.makedirs(self.tmp, exist_ok=True)
        self.days_fh = open(os.path.join(self.out, "c4_days.tsv"), "a", encoding="utf-8", newline="")
        if self.days_fh.tell() == 0:
            self.days_fh.write("\t".join(DAYS_COLUMNS) + "\n")
        self.details_fh = open(os.path.join(self.out, "c4_details.tsv"), "a", encoding="utf-8", newline="")
        if self.details_fh.tell() == 0:
            self.details_fh.write("\t".join(DETAILS_COLUMNS) + "\n")
        self.log_fh = open(os.path.join(self.out, "c4_run.log"), "a", encoding="utf-8", newline="")
        self.days_fh.flush()
        self.details_fh.flush()

    def log(self, line):
        self.log_fh.write(line + "\n")
        self.log_fh.flush()
        print(line, flush=True)

    @staticmethod
    def _sync(fh):
        fh.flush()
        os.fsync(fh.fileno())

    def finish(self, row, det, t0, note):
        """Details first, then the day row (flushed), then the log line."""
        sym, day, kind = row["symbol"], row["day"], row["kind"]
        for typ, key, vision, tape in det.rows:
            self.details_fh.write("\t".join(clean(x) for x in (sym, day, kind, typ, key, vision, tape)) + "\n")
        self._sync(self.details_fh)
        self.days_fh.write("\t".join(clean(row[c]) for c in DAYS_COLUMNS) + "\n")
        self._sync(self.days_fh)
        fields = [utc_now(), sym, day, kind, row["status"], f"{time.monotonic() - t0:.1f}"]
        if note:
            fields.append(clean(note))
        self.log("\t".join(fields))
        self.processed += 1
        if row["status"] == "download_error":
            self.download_errors += 1

    def remove_downloads(self, paths, allowed):
        """Delete only this run's downloads of the day: exact names, directly inside tmp/."""
        tmp_real = os.path.realpath(self.tmp)
        for path in paths:
            name = os.path.basename(path)
            if name not in allowed or os.path.realpath(os.path.dirname(path)) != tmp_real:
                self.log(f"{utc_now()}\tWARN\tnot deleting unexpected path {clean(name)}")
                continue
            try:
                st = os.lstat(path)
            except FileNotFoundError:
                continue
            if stat.S_ISDIR(st.st_mode):
                self.log(f"{utc_now()}\tWARN\tnot deleting directory {clean(name)}")
                continue
            os.remove(path)

    def fetch(self, sym, day, kind, row, downloaded):
        """Download zip + .CHECKSUM into tmp/. Returns (zip path or None, note). Sets row status on failure."""
        zip_name = vision_zip_name(sym, day, kind)
        url = vision_url(self.args.base_url, sym, day, kind)
        zip_path = os.path.join(self.tmp, zip_name)
        ck_path = zip_path + ".CHECKSUM"
        downloaded.extend((zip_path, ck_path))
        dl = download(url, zip_path)
        row["http"] = "" if dl.http is None else dl.http
        if dl.outcome == "missing":
            row["status"] = "vision_missing"
            return None, f"{zip_name} HTTP 404"
        if dl.outcome == "error":
            row["status"] = "download_error"
            return None, f"{zip_name} {dl.error}"
        row.update(last_modified=dl.last_modified, etag=dl.etag, zip_bytes=dl.size, zip_sha256=dl.sha256)
        ck = download(url + ".CHECKSUM", ck_path)
        if ck.outcome == "missing":
            row.update(checksum_ok="no", status="checksum_fail")
            return None, f"{zip_name}.CHECKSUM HTTP 404"
        if ck.outcome == "error":
            row["status"] = "download_error"
            return None, f"{zip_name}.CHECKSUM {ck.error}"
        value, problem = parse_checksum(ck_path, zip_name)
        row["checksum_sha256"] = value or ""
        ok = value is not None and not problem and value == dl.sha256
        row["checksum_ok"] = "yes" if ok else "no"
        if not ok:
            row["status"] = "checksum_fail"
            return None, problem or "sha256 of the zip differs from CHECKSUM"
        return zip_path, ""

    def process_day(self, sym, day, kinds):
        first_day = day == START_HOURS[sym][:10]
        paths, both = tape_paths(self.home, sym, day)
        tape_note = f"hours with both .csv and .csv.gz, .csv.gz used: {','.join(both)}" if both else ""
        if not paths:
            for kind in kinds:
                t0 = time.monotonic()
                row = new_row(sym, day, kind)
                row.update(status="tape_missing", tape_hours=0)
                self.finish(row, Details(), t0, "")
            return
        want_agg, want_kl = AGG in kinds, KL in kinds
        ctx = decimal.getcontext()
        ctx.clear_flags()
        t0 = time.monotonic()
        tape = None
        if want_agg:
            row = new_row(sym, day, AGG)
            row["tape_hours"] = len(paths)
            det = Details()
            files = []
            note = ""
            try:
                zip_path, note = self.fetch(sym, day, AGG, row, files)
                note = "; ".join(x for x in (note, tape_note) if x)
                if want_kl or row["status"] != "download_error":
                    order = Order(det)
                    tape = TapeReader(paths, det, order, want_kl)
                    if zip_path:
                        vcsv = VisionCsv(zip_path, 7, det)
                        stop = compare_agg(tape, vcsv, order, det, first_day, row)
                        row.update(header="" if vcsv.header is None else "yes" if vcsv.header else "no",
                                   vision_rows=vcsv.rows)
                        problems = (row["mism_p"] or row["mism_q"] or row["mism_T"] or row["mism_m"]
                                    or row["only_vision"] or row["only_tape"])
                        row["status"] = final_status(stop, problems, tape.bad)
                    else:
                        for _ in tape:
                            pass
                    row.update(tape_rows=tape.rows, tape_bad_rows=tape.bad,
                               first_a="" if tape.min_a is None else tape.min_a,
                               last_a="" if tape.max_a is None else tape.max_a)
            finally:
                self.remove_downloads(files, expected_names(sym, day, AGG))
            self.finish(row, det, t0, note)
        if want_kl:
            t1 = time.monotonic() if want_agg else t0
            if tape is None:
                tape = TapeReader(paths, None, Order(None), True)
                for _ in tape:
                    pass
            row = new_row(sym, day, KL)
            row.update(tape_hours=len(paths), tape_rows=tape.rows, tape_bad_rows=tape.bad)
            det = Details()
            files = []
            note = ""
            try:
                zip_path, note = self.fetch(sym, day, KL, row, files)
                note = "; ".join(x for x in (note, tape_note) if x)
                if zip_path:
                    skip_before = None
                    if first_day and tape.min_a_t is not None:
                        skip_before = tape.min_a_t // 60000
                    stop = compare_klines(zip_path, tape.bars, skip_before, det, row)
                    problems = any(row[c] for c in ("k_mism_open", "k_mism_high", "k_mism_low", "k_mism_close",
                                                    "k_mism_volume", "k_mism_taker_buy", "k_minutes_tape_only",
                                                    "k_minutes_kline_only"))
                    row["status"] = final_status(stop, problems, tape.bad)
                if ctx.flags[decimal.Inexact]:
                    note = (note + "; " if note else "") + "tape volume sums were rounded"
            finally:
                self.remove_downloads(files, expected_names(sym, day, KL))
            self.finish(row, det, t1, note)


def new_row(sym, day, kind):
    row = dict.fromkeys(DAYS_COLUMNS, "")
    row.update(symbol=sym, day=day, kind=kind)
    return row


def read_done(out):
    """(symbol, day, kind) keys that already have a final row. Refuses unreadable earlier outputs."""
    done = set()
    days_path = os.path.join(out, "c4_days.tsv")
    for path, columns in ((days_path, DAYS_COLUMNS), (os.path.join(out, "c4_details.tsv"), DETAILS_COLUMNS)):
        if not os.path.exists(path):
            continue
        name = os.path.basename(path)
        with open(path, "r", encoding="utf-8", newline="") as fh:
            first = fh.readline()
            if not first:
                continue
            if first != "\t".join(columns) + "\n":
                raise Refuse(f"{name} has an unexpected header line")
            lineno = 1
            for line in fh:
                lineno += 1
                if not line.endswith("\n"):
                    raise Refuse(f"{name} line {lineno} is incomplete (no line end)")
                fields = line[:-1].split("\t")
                if len(fields) != len(columns):
                    raise Refuse(f"{name} line {lineno} has {len(fields)} fields, expected {len(columns)}")
                if path == days_path and fields[3] != "download_error":
                    done.add((fields[0], fields[1], fields[2]))
    return done


def parse_day(text, what):
    if not DAY_RE.fullmatch(text):
        raise Refuse(f"{what} {text!r} is not YYYY-MM-DD")
    try:
        return date.fromisoformat(text)
    except ValueError:
        raise Refuse(f"{what} {text!r} is not a valid date") from None


def parse_args(argv):
    ap = argparse.ArgumentParser(description="Data gate C4/C5: local trade tape vs Binance Vision (USD-M).")
    ap.add_argument("--work", default="~/c4", help="work folder for out/, tmp/ and lock (default ~/c4)")
    ap.add_argument("--home", default="~", help="home folder that holds data/binance* (default ~)")
    ap.add_argument("--symbols", default=DEFAULT_SYMBOLS, help=f"comma list (default {DEFAULT_SYMBOLS})")
    ap.add_argument("--end-day", default=DEFAULT_END_DAY, help=f"last UTC day (default {DEFAULT_END_DAY})")
    ap.add_argument("--days", default=None, help="comma list of YYYY-MM-DD that limits the run")
    ap.add_argument("--base-url", default=DEFAULT_BASE_URL, help=f"Vision base (default {DEFAULT_BASE_URL})")
    ap.add_argument("--no-klines", action="store_true", help="skip criterion 5 (1m klines)")
    args = ap.parse_args(argv)
    symbols = []
    for s in args.symbols.split(","):
        s = s.strip().upper()
        if s not in START_HOURS:
            raise Refuse(f"unknown symbol {s!r}; known: {DEFAULT_SYMBOLS}")
        if s not in symbols:
            symbols.append(s)
    args.symbols = symbols
    args.end = parse_day(args.end_day, "--end-day")
    args.day_filter = None
    if args.days is not None:
        args.day_filter = {parse_day(d.strip(), "--days").isoformat() for d in args.days.split(",")}
    base = args.base_url.strip().rstrip("/")
    if not re.fullmatch(r"https?://[^\s/]+(/[^\s]*)?", base):
        raise Refuse("--base-url must be an http(s) URL")
    args.base_url = base
    return args


def days_for(sym, end, day_filter):
    d = date.fromisoformat(START_HOURS[sym][:10])
    while d <= end:
        if day_filter is None or d.isoformat() in day_filter:
            yield d.isoformat()
        d += timedelta(days=1)


def tmp_not_empty(tmp):
    if os.path.lexists(tmp) and not os.path.isdir(tmp):
        return "tmp exists and is not a folder"
    if os.path.isdir(tmp) and os.listdir(tmp):
        return f"tmp/ is not empty ({len(os.listdir(tmp))} entries); inspect and empty it first"
    return ""


def _on_signal(signum, _frame):
    raise SystemExit(128 + signum)


def main(argv=None):
    lock_fd = None
    try:
        args = parse_args(argv)
        work = os.path.abspath(os.path.expanduser(args.work))
        home = os.path.abspath(os.path.expanduser(args.home))
        set_private_paths(work, home)
        tmp, out = os.path.join(work, "tmp"), os.path.join(work, "out")
        problem = tmp_not_empty(tmp)
        if problem:
            raise Refuse(problem)
        try:
            os.makedirs(work, exist_ok=True)
            lock_fd = os.open(os.path.join(work, "lock"), os.O_RDWR | os.O_CREAT, 0o644)
        except OSError as e:
            raise Refuse("cannot open the lock: " + describe_error(e)) from None
        try:
            fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            raise Refuse("another run holds the lock") from None
        problem = tmp_not_empty(tmp)
        if problem:
            raise Refuse(problem)
        done = read_done(out)
    except Refuse as e:
        print(f"c4_vision_check: refused: {clean(e)}", file=sys.stderr)
        return 2

    signal.signal(signal.SIGTERM, _on_signal)
    ctx = decimal.getcontext()
    ctx.prec = 60                        # volume sums stay exact; a rounding is reported in the log note
    for trap in list(ctx.traps):         # no Decimal exception can stop a run: dec() rejects NaN and
        ctx.traps[trap] = False          # infinities, an absurd sum becomes a reported mismatch
    run = Run(args, work, home, tmp, out)
    code = 1
    end_note = ""
    try:
        run.open_outputs()
        kinds_all = [AGG] if args.no_klines else [AGG, KL]
        for sym in args.symbols:
            for day in days_for(sym, args.end, args.day_filter):
                kinds = [k for k in kinds_all if (sym, day, k) not in done]
                run.skipped += len(kinds_all) - len(kinds)
                if kinds:
                    run.process_day(sym, day, kinds)
        code = 1 if run.download_errors else 0
    except KeyboardInterrupt:
        code, end_note = 130, "interrupted"
    except SystemExit as e:
        code, end_note = (e.code if isinstance(e.code, int) else 1), "stopped by signal"
    except Exception as e:  # report without absolute paths, then exit 1
        code, end_note = 1, "error " + describe_error(e)
        frames = traceback.extract_tb(e.__traceback__)
        lines = [f"  {os.path.basename(f.filename)}:{f.lineno} in {f.name}" for f in frames]
        print("c4_vision_check: unexpected error\n" + "\n".join(clean(x) for x in lines)
              + "\n" + clean(describe_error(e)), file=sys.stderr)
    finally:
        if run.log_fh is not None:
            fields = [utc_now(), "END", f"processed={run.processed}", f"skipped={run.skipped}",
                      f"download_error={run.download_errors}", f"exit={code}"]
            if end_note:
                fields.append(clean(end_note))
            run.log("\t".join(fields))
        for fh in (run.days_fh, run.details_fh, run.log_fh):
            if fh is not None:
                fh.close()
    return code


if __name__ == "__main__":
    sys.exit(main())
