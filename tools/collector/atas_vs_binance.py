#!/usr/bin/env python3
"""
ATAS vs Binance
===============

1) Compare an ATAS X "Bid/Ask Tape" CSV with Binance's own trades for the same minutes:

    python3 atas_vs_binance.py compare Bid_Ask_Tape_7th_OCT_19_2120.csv

   It figures out whether ATAS showed Binance Futures or Binance Spot, then checks
   volume, buyers, sellers and delta minute by minute, volume at every exact price
   (footprint) and second by second. Add --detail 18:33:16 to see one second in both.

2) Record Binance trades into the same CSV format as ATAS, with no clicking:

    python3 atas_vs_binance.py record --hours 1 --out data

   Run it every hour (cron / Task Scheduler) and you get one file per hour that
   the "Read the tape" dashboard opens like an ATAS export.

Only the Python standard library is used. Binance blocks US IP addresses (HTTP 451),
so run it from your own computer or a server in Europe.
"""
import argparse
import json
import os
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

SYMBOL = "BTCUSDT"
MARKETS = {
    "futures": {"url": "https://fapi.binance.com/fapi/v1/aggTrades", "pause": 1.0, "tick": 0.1, "name": "Binance Futures (USDⓈ-M)"},
    "spot": {"url": "https://api.binance.com/api/v3/aggTrades", "pause": 0.25, "tick": 0.01, "name": "Binance Spot"},
}
HOUR_MS = 3_600_000


# ---------------------------------------------------------------- Binance

def http_json(url, params, tries=6):
    full = url + "?" + urllib.parse.urlencode(params)
    for attempt in range(tries):
        try:
            req = urllib.request.Request(full, headers={"User-Agent": "atas-vs-binance/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as err:
            if err.code == 451:
                sys.exit("Binance blokuje tuhle lokaci (HTTP 451). Spust skript ze sveho pocitace nebo z evropskeho serveru.")
            if err.code == 418:
                sys.exit("Binance docasne zablokoval tuhle IP (HTTP 418). Pockej aspon 5 minut a zkus to znovu.")
            if err.code == 429:
                try:
                    wait = max(1.0, float(err.headers.get("Retry-After") or 60))
                except (TypeError, ValueError):
                    wait = 60
                time.sleep(wait)
                continue
            if err.code >= 500:
                time.sleep(2 * (attempt + 1))
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            time.sleep(2 * (attempt + 1))
    sys.exit("Binance neodpovida, zkus to za chvili znovu.")


def fetch_trades(market, start_ms, end_ms, quiet=False):
    """All aggTrades with start_ms <= T < end_ms. Each: a, p, q, T, m (m=True means the seller was aggressive)."""
    cfg = MARKETS[market]
    out = []
    window_start = start_ms
    batch = []
    while window_start < end_ms and not batch:
        batch = http_json(cfg["url"], {"symbol": SYMBOL, "startTime": window_start,
                                       "endTime": min(end_ms, window_start + HOUR_MS) - 1, "limit": 1000})
        if not batch:
            window_start += HOUR_MS
    calls = 1
    while batch:
        out.extend(t for t in batch if start_ms <= t["T"] < end_ms)
        if batch[-1]["T"] >= end_ms:
            break
        time.sleep(cfg["pause"])
        batch = http_json(cfg["url"], {"symbol": SYMBOL, "fromId": batch[-1]["a"] + 1, "limit": 1000})
        calls += 1
        if not quiet and calls % 20 == 0:
            done = (out[-1]["T"] - start_ms) / max(1, end_ms - start_ms) if out else 0
            print(f"  stahuju {cfg['name']}: {min(100, done * 100):.0f} %", flush=True)
    return out


# ---------------------------------------------------------------- ATAS file

def num(s):
    s = (s or "").strip()
    if not s:
        return 0.0
    if "," in s and "." not in s:
        s = s.replace(",", ".")
    return float(s)


def read_atas(path, day, utc_offset_h):
    """Rows of an ATAS Bid/Ask Tape: (utc_ms, buy_size, sell_size, buy_price, sell_price)."""
    with open(path, encoding="utf-8-sig", errors="replace") as f:
        lines = [l.strip() for l in f if l.strip()]
    if not lines or not lines[0].lower().replace(" ", "").startswith("time;bids"):
        sys.exit("Tohle neni ATAS Bid/Ask Tape export (cekam hlavicku Time;Bids;;;;Ask;Delta).")
    parsed = []
    for line in lines[1:]:
        p = line.split(";")
        if len(p) < 7:
            continue
        stamp = p[0].strip()
        try:
            if " " in stamp:
                dt = datetime.strptime(stamp.rsplit(".", 1)[0] if stamp.count(".") > 2 else stamp, "%d.%m.%Y %H:%M:%S")
                parsed.append((dt, None, p))
            else:
                hh, mm, ss = stamp.split(":")
                sec = int(hh) * 3600 + int(mm) * 60 + float(ss.replace(",", "."))
                parsed.append((None, sec, p))
        except ValueError:
            continue
    # File is newest first. Time-only rows get the date of the newest row; walking back, a jump
    # forward of more than 12 hours means we crossed midnight.
    rows, day_shift, prev = [], 0, None
    base = datetime(day.year, day.month, day.day)
    offset = timedelta(hours=utc_offset_h)
    for dt, sec, p in parsed:
        if dt is None:
            if prev is not None and sec > prev + 43_200:
                day_shift -= 1
            prev = sec
            dt = base + timedelta(days=day_shift, seconds=sec)
        utc_ms = int((dt - offset).replace(tzinfo=timezone.utc).timestamp() * 1000)
        rows.append((utc_ms, num(p[4]), num(p[2]), num(p[5]), num(p[1])))
    rows.reverse()                      # oldest first, so rows inside one second stay in order
    rows.sort(key=lambda r: r[0])
    return rows


def default_utc_offset(day):
    local = datetime(day.year, day.month, day.day, 12).astimezone()
    return local.utcoffset().total_seconds() / 3600


# ---------------------------------------------------------------- compare

def per_minute_atas(rows):
    m = {}
    for t, bv, sv, bp, sp in rows:
        k = t // 60_000
        x = m.setdefault(k, [0.0, 0.0, 0])
        x[0] += bv
        x[1] += sv
        x[2] += 1
    return m


def per_minute_binance(trades):
    m = {}
    for tr in trades:
        k = tr["T"] // 60_000
        x = m.setdefault(k, [0.0, 0.0, 0])
        q = float(tr["q"])
        if tr["m"]:
            x[1] += q
        else:
            x[0] += q
        x[2] += 1
    return m


def price_gap(rows, trades):
    """Median distance between each ATAS price and the closest Binance price in the same second."""
    by_sec = {}
    for tr in trades:
        by_sec.setdefault(tr["T"] // 1000, []).append(float(tr["p"]))
    gaps = []
    for t, bv, sv, bp, sp in rows:
        prices = by_sec.get(t // 1000)
        if not prices:
            continue
        px = bp if bv > 0 else sp
        gaps.append(min(abs(px - p) for p in prices))
    return statistics.median(gaps) if gaps else float("inf")


def overlap(a, b):
    """Share of b's volume that a has at the same key: sum(min(a, b)) / sum(b)."""
    tot = sum(b.values())
    return sum(min(v, a.get(k, 0.0)) for k, v in b.items()) / tot if tot else float("nan")


def footprint_atas(rows, nd):
    fp = {}
    for t, bv, sv, bp, sp in rows:
        if bv > 0:
            fp[("buy", round(bp, nd))] = fp.get(("buy", round(bp, nd)), 0.0) + bv
        if sv > 0:
            fp[("sell", round(sp, nd))] = fp.get(("sell", round(sp, nd)), 0.0) + sv
    return fp


def footprint_binance(trades, nd):
    fp = {}
    for tr in trades:
        k = ("sell" if tr["m"] else "buy", round(float(tr["p"]), nd))
        fp[k] = fp.get(k, 0.0) + float(tr["q"])
    return fp


def per_second(rows=None, trades=None):
    out = {}
    for t, bv, sv, bp, sp in rows or []:
        out[t // 1000] = out.get(t // 1000, 0.0) + bv + sv
    for tr in trades or []:
        out[tr["T"] // 1000] = out.get(tr["T"] // 1000, 0.0) + float(tr["q"])
    return out


def fmt(v, d=1):
    return f"{v:,.{d}f}".replace(",", " ")


def best_clock_offset(rows, trades, lo=-3000, hi=3000, step=100):
    """Shift Binance trade times by d ms and find the d where per-second volume matches ATAS best."""
    a_sec = per_second(rows=rows)
    a_total = sum(a_sec.values()) or 1.0
    tq = [(tr["T"], float(tr["q"])) for tr in trades]
    best = (0, -1.0)
    for d in range(lo, hi + 1, step):
        b = {}
        for t, q in tq:
            sec = (t + d) // 1000
            if sec in a_sec:
                b[sec] = b.get(sec, 0.0) + q
        ov = sum(min(v, b.get(k, 0.0)) for k, v in a_sec.items()) / a_total
        if ov > best[1]:
            best = (d, ov)
    return best


def shifted(trades, d):
    return [{**tr, "T": tr["T"] + d} for tr in trades]


def footprint_atas_inward(rows, nd, tick):
    """ATAS footprint with buy prices moved one tick down and sell prices one tick up."""
    fp = {}
    for t, bv, sv, bp, sp in rows:
        if bv > 0:
            k = ("buy", round(bp - tick, nd))
            fp[k] = fp.get(k, 0.0) + bv
        if sv > 0:
            k = ("sell", round(sp + tick, nd))
            fp[k] = fp.get(k, 0.0) + sv
    return fp


def compare(args):
    if not os.path.exists(args.file):
        sys.exit(f"Soubor {args.file} neexistuje.")
    day = datetime.strptime(args.date, "%Y-%m-%d").date() if args.date else datetime.fromtimestamp(os.path.getmtime(args.file)).date()
    offset = args.utc_offset if args.utc_offset is not None else default_utc_offset(day)
    rows = read_atas(args.file, day, offset)
    if len(rows) < 10:
        sys.exit("V souboru je moc malo radku.")
    first_ms = rows[0][0] // 1000 * 1000
    last_ms = rows[-1][0] // 1000 * 1000 + 1000
    local = lambda ms: (datetime.fromtimestamp(ms / 1000, tz=timezone.utc) + timedelta(hours=offset)).strftime("%H:%M:%S")
    print(f"ATAS soubor: {len(rows)} radku, {day} {local(rows[0][0])} - {local(rows[-1][0])} (posun od UTC {offset:+g} h)")

    # 1) Which market did ATAS show?
    probe_start = first_ms // 60_000 * 60_000
    probe_rows = [r for r in rows if r[0] < probe_start + 120_000]
    best_market = None
    for market in (["futures", "spot"] if args.market == "auto" else [args.market]):
        sample = fetch_trades(market, probe_start, probe_start + 120_000, quiet=True)
        gap = price_gap(probe_rows, sample)
        print(f"  {MARKETS[market]['name']}: typicky rozdil ceny {gap:.2f} $")
        if best_market is None or gap < best_market[1]:
            best_market = (market, gap)
    market = best_market[0]
    tick = MARKETS[market]["tick"]
    nd = 1 if tick >= 0.1 else 2

    # 2) Trades for the ATAS window plus one minute on each side (for the clock search)
    print(f"Stahuju vsechny obchody z {MARKETS[market]['name']} pro stejne obdobi...")
    raw = fetch_trades(market, first_ms - 60_000, last_ms + 60_000)
    print("Hledam posun hodin mezi ATASem a Binance...")
    d, sec_ov = best_clock_offset(rows, raw)
    sec_ov0 = overlap(per_second(rows=rows), per_second(trades=[t for t in raw if first_ms <= t["T"] < last_ms]))
    trades = [t for t in shifted(raw, d) if first_ms <= t["T"] < last_ms]

    a, b = per_minute_atas(rows), per_minute_binance(trades)
    minutes = sorted(set(a) | set(b))
    tot = lambda m, i: sum(v[i] for v in m.values())
    a_buy, a_sell, b_buy, b_sell = tot(a, 0), tot(a, 1), tot(b, 0), tot(b, 1)
    matched = sum(1 for k in minutes if abs(sum(a.get(k, [0, 0])[:2]) - sum(b.get(k, [0, 0])[:2])) <= max(0.01, 0.01 * sum(b.get(k, [0, 0])[:2])))
    fp_b = footprint_binance(trades, nd)
    fp_exact = overlap(footprint_atas(rows, nd), fp_b)
    fp_tick = overlap(footprint_atas_inward(rows, nd, tick), fp_b)

    print()
    print(f"Porovnavam presne stejne okno {local(first_ms)} - {local(last_ms)}; Binance casy posunute o {d:+d} ms")
    print(f"{'':30}{'ATAS':>14}{'Binance':>14}")
    print(f"{'Objem celkem (BTC)':30}{fmt(a_buy + a_sell):>14}{fmt(b_buy + b_sell):>14}")
    print(f"{'Nakoupili spechajici (BTC)':30}{fmt(a_buy):>14}{fmt(b_buy):>14}")
    print(f"{'Prodali spechajici (BTC)':30}{fmt(a_sell):>14}{fmt(b_sell):>14}")
    print(f"{'Delta (BTC)':30}{fmt(a_buy - a_sell):>14}{fmt(b_buy - b_sell):>14}")
    print(f"{'Radku / obchodu':30}{fmt(len(rows), 0):>14}{fmt(len(trades), 0):>14}")
    print(f"{'Presnost casu':30}{'sekundy':>14}{'milisekundy':>14}")
    print(f"Po sekundach: {sec_ov0 * 100:.1f} % objemu ve stejne sekunde bez posunu, {sec_ov * 100:.1f} % s posunem {d:+d} ms")
    print(f"Minuty, kde objem sedi na 1 % (s posunem): {matched} z {len(minutes)}")
    print(f"Footprint presne na stejne cene a strane: {fp_exact * 100:.1f} %")
    print(f"Footprint, kdyz ATAS nakupy posunu o 1 tick dolu a prodeje o 1 tick nahoru: {fp_tick * 100:.1f} %")
    print()
    print("Po 10 minutach:")
    print(f"  {'cas':8}{'radku/min ATAS':>16}{'obchodu/min Binance':>21}{'fp presne':>11}{'fp 1 tick':>11}  objem ATAS / Binance")
    blocks = {}
    for k in minutes:
        blk = k // 10 * 10
        x = blocks.setdefault(blk, [0, 0, 0.0, 0.0, 0])
        x[0] += a.get(k, [0, 0, 0])[2]
        x[1] += b.get(k, [0, 0, 0])[2]
        x[2] += sum(a.get(k, [0, 0])[:2])
        x[3] += sum(b.get(k, [0, 0])[:2])
        x[4] += 1
    for blk, (ar, br, av, bvol, n) in sorted(blocks.items()):
        lo, hi = blk * 60_000, (blk + 10) * 60_000
        rb = [r for r in rows if lo <= r[0] < hi]
        fb = footprint_binance([t for t in trades if lo <= t["T"] < hi], nd)
        e = overlap(footprint_atas(rb, nd), fb)
        i = overlap(footprint_atas_inward(rb, nd, tick), fb)
        print(f"  {local(lo)[:5]:8}{ar / n:>16.0f}{br / n:>21.0f}{e * 100:>10.0f}%{i * 100:>10.0f}%  {fmt(av)} / {fmt(bvol)}")
    if args.detail:
        show_second(args.detail, rows, trades, day, offset, nd, d)

    print()
    vol_diff = abs((a_buy + a_sell) - (b_buy + b_sell)) / max(1e-9, b_buy + b_sell)
    print("Verdikt:")
    if vol_diff < 0.005:
        print(f"- Objem i delta sedi (rozdil {vol_diff * 100:.2f} %): ATAS ukazuje stejne obchody jako {MARKETS[market]['name']}.")
    else:
        print(f"- Objem se lisi o {vol_diff * 100:.2f} %: v ATAS exportu neco chybi, nebo je navic.")
    if d < 0:
        print(f"- Casy: ATAS ma kazdy obchod o ~{-d} ms drive nez cas obchodu na burze. Hodiny tveho Windows nejspis jdou pozadu.")
    elif d > 0:
        print(f"- Casy: ATAS ma kazdy obchod o ~{d} ms pozdeji nez cas obchodu na burze (zpozdeni dat a hodiny tveho PC).")
    if fp_tick > fp_exact + 0.2:
        print(f"- Ceny: ATAS pise u nakupu cenu o 1 tick vys a u prodeju o 1 tick niz nez skutecny obchod "
              f"(sedi {fp_tick * 100:.0f} % objemu po posunu, presne jen {fp_exact * 100:.0f} %).")
    print(f"- Radky: Binance ma {len(trades) / max(1, len(rows)):.1f}x vic radku a milisekundy, ATAS obchody slucuje.")


def show_second(clock, rows, trades, day, offset, nd, d=0):
    hh, mm, ss = (int(x) for x in clock.split(":"))
    local_dt = datetime(day.year, day.month, day.day, hh, mm, ss)
    center = int((local_dt - timedelta(hours=offset)).replace(tzinfo=timezone.utc).timestamp() * 1000)
    for k in (-1, 0, 1):
        start, end = center + k * 1000, center + (k + 1) * 1000
        label = (local_dt + timedelta(seconds=k)).strftime("%H:%M:%S")
        print()
        print(f"Detail sekundy {label} (Binance posunuty o {d:+d} ms):")
        a = {}
        for t, bv, sv, bp, sp in rows:
            if start <= t < end:
                if bv > 0:
                    a[("nakup", round(bp, nd))] = a.get(("nakup", round(bp, nd)), 0.0) + bv
                if sv > 0:
                    a[("prodej", round(sp, nd))] = a.get(("prodej", round(sp, nd)), 0.0) + sv
        b, first = {}, {}
        for tr in trades:
            if start <= tr["T"] < end:
                key = ("prodej" if tr["m"] else "nakup", round(float(tr["p"]), nd))
                b[key] = b.get(key, 0.0) + float(tr["q"])
                first.setdefault(key, tr["T"] - start)
        print(f"  ATAS: {sum(a.values()):.3f} BTC na {len(a)} cenach | Binance: {sum(b.values()):.3f} BTC na {len(b)} cenach")
        for key in sorted(set(a) | set(b), key=lambda x: (x[1], x[0]))[:30]:
            print(f"    {key[0]:6} {key[1]:>12.{nd}f}   ATAS {a.get(key, 0.0):>9.3f}   Binance {b.get(key, 0.0):>9.3f}"
                  + (f"   od .{first[key]:03d} s" if key in first else ""))
        if len(set(a) | set(b)) > 30:
            print(f"    ... a dalsich {len(set(a) | set(b)) - 30} cen")


# ---------------------------------------------------------------- record

def record(args):
    end_ms = int(time.time()) // 60 * 60_000
    start_ms = end_ms - int(args.hours * HOUR_MS)
    cfg = MARKETS[args.market]
    print(f"Stahuju {cfg['name']} {SYMBOL} za posledni {args.hours:g} h...")
    trades = sorted(fetch_trades(args.market, start_ms, end_ms), key=lambda t: (t["T"], t["a"]))
    if not trades:
        sys.exit("Binance nevratil zadne obchody.")
    os.makedirs(args.out, exist_ok=True)
    stamp = datetime.fromtimestamp(end_ms / 1000).strftime("%Y%m%d_%H%M")
    path = os.path.join(args.out, f"Bid_Ask_Tape_{SYMBOL}_binance_{args.market}_{stamp}.csv")
    tick = cfg["tick"]
    lines, delta = [], 0.0
    for t in trades:
        price, qty = float(t["p"]), float(t["q"])
        when = datetime.fromtimestamp(t["T"] / 1000)
        clock = when.strftime("%d.%m.%Y %H:%M:%S.") + f"{t['T'] % 1000:03d}"
        if t["m"]:   # seller was aggressive: volume traded at the bid
            delta -= qty
            lines.append(f"{clock};{price};{qty};0;0;{price + tick:.2f};{delta:.3f}")
        else:        # buyer was aggressive: volume traded at the ask
            delta += qty
            lines.append(f"{clock};{price - tick:.2f};0;0;{qty};{price};{delta:.3f}")
    with open(path, "w", encoding="utf-8") as f:
        f.write("Time;Bids;;;;Ask;Delta\n")
        f.write("\n".join(reversed(lines)) + "\n")   # newest first, like ATAS
    print(f"Hotovo: {len(trades)} obchodu -> {path}")


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description="Porovnej ATAS export s Binance, nebo nahravej Binance obchody do stejneho CSV.")
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("compare", help="porovnej ATAS Bid/Ask Tape s Binance")
    c.add_argument("file")
    c.add_argument("--date", help="den exportu RRRR-MM-DD (vychozi: datum souboru)")
    c.add_argument("--utc-offset", type=float, help="posun ATAS casu od UTC v hodinach (vychozi: tvuj pocitac, v Praze v rijnu +2)")
    c.add_argument("--market", choices=["auto", "futures", "spot"], default="auto")
    c.add_argument("--detail", help="ukaz jednu sekundu v obou zdrojich, napr. 18:33:16 (tvuj cas)")
    r = sub.add_parser("record", help="stahni Binance obchody do CSV ve formatu ATAS")
    r.add_argument("--hours", type=float, default=1.0)
    r.add_argument("--out", default="binance_tape")
    r.add_argument("--market", choices=["futures", "spot"], default="futures")
    args = ap.parse_args()
    compare(args) if args.cmd == "compare" else record(args)


if __name__ == "__main__":
    main()
