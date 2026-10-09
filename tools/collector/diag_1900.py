#!/usr/bin/env python3
"""
diag_1900.py - what happened at 19:00:25 (8. 10. 2026, Prague time)

1) The same 5 seconds on Binance Futures and Binance Spot: price move, 5 s volume, volume velocity
   (RALPH's formula: last 5 s notional / average 5 s notional over the previous 5 minutes).
   This shows whether a watcher that listens to Spot could have missed the move.
2) From your own raw file: how late our collector received trades and book updates, second by second.

Run in WSL:  python3 diag_1900.py      (needs internet, takes about a minute)
"""
import gzip
import json
import os
import time
import urllib.parse
import urllib.request
import zlib
from datetime import datetime, timedelta, timezone

T0 = 1791478825000                      # 17:00:25 UTC = 19:00:25 Prague
RAW = os.path.expanduser("~/data/binance/raw_BTCUSDT_2026-10-08T17Z.jsonl.gz")


def local(sec):
    return (datetime.fromtimestamp(sec, tz=timezone.utc) + timedelta(hours=2)).strftime("%H:%M:%S")


def get(url, params):
    with urllib.request.urlopen(url + "?" + urllib.parse.urlencode(params), timeout=20) as r:
        return json.loads(r.read())


def trades(url, start, end):
    out = []
    batch = get(url, {"symbol": "BTCUSDT", "startTime": start, "endTime": end - 1, "limit": 1000})
    while batch:
        out += [t for t in batch if start <= t["T"] < end]
        if batch[-1]["T"] >= end - 1 or len(batch) < 1000:
            break
        time.sleep(1.0)                 # stay far below Binance REST limits
        batch = get(url, {"symbol": "BTCUSDT", "fromId": batch[-1]["a"] + 1, "limit": 1000})
    return out


def analyse(name, url):
    tr = trades(url, T0 - 310_000, T0 + 10_000)
    sec = {}
    for t in tr:
        k, p = t["T"] // 1000, float(t["p"])
        x = sec.setdefault(k, [0.0, p, p, p])
        x[0] += p * float(t["q"])
        x[1], x[2], x[3] = min(x[1], p), max(x[2], p), p
    s0 = T0 // 1000
    ref = next(sec[k][3] for k in range(s0 - 5, s0 - 60, -1) if k in sec)
    lo = min(sec[k][1] for k in range(s0 - 4, s0 + 1) if k in sec)
    recent = sum(sec[k][0] for k in range(s0 - 4, s0 + 1) if k in sec)
    base = sum(sec[k][0] for k in range(s0 - 299, s0 - 4) if k in sec)
    print(f"{name}: cena 5 s pred {ref:,.1f}, minimum {lo:,.1f}, pohyb {(lo - ref) / ref * 100:+.3f} %, "
          f"objem za 5 s {recent / 1e6:,.2f} M$, normal {base / 59 / 1e6:,.2f} M$ za 5 s, velocity {recent / (base / 59):.1f}x")


print("1) Stejnych 5 sekund na Futures a na Spotu")
analyse("Binance Futures", "https://fapi.binance.com/fapi/v1/aggTrades")
analyse("Binance Spot   ", "https://api.binance.com/api/v3/aggTrades")
print("   RALPHuv BTC WICK alert v 17:38 prisel pri -0,30 % za 5 s, takze jeho prah je asi 0,30 %.")

print()
print("2) Zpozdeni naseho sberace (cas prijeti minus cas odeslani burzou), nejvyssi za sekundu, v ms")
if not os.path.exists(RAW):
    print(f"   soubor {RAW} nenalezen")
else:
    lag = {}
    try:
        with gzip.open(RAW, "rt", encoding="utf-8") as f:
            for line in f:
                if '"recv_ms":17914788' not in line:      # 17:00:00-17:01:39 UTC only
                    continue
                m = json.loads(line)
                d, st = m.get("data", {}), m.get("stream", "")
                if "E" not in d:
                    continue
                kind = "obchody" if "aggTrade" in st else "kniha" if "@depth@" in st else "bid/ask" if "bookTicker" in st else None
                if kind:
                    k = (m["recv_ms"] // 1000, kind)
                    lag[k] = max(lag.get(k, 0), m["recv_ms"] - d["E"])
    except (EOFError, OSError, zlib.error):
        pass                                             # the file of the current hour is still being written
    print(f"   {'cas':9}{'obchody':>9}{'kniha':>9}{'bid/ask':>9}")
    for s in range(T0 // 1000 - 6, T0 // 1000 + 12):
        row = [lag.get((s, k)) for k in ("obchody", "kniha", "bid/ask")]
        print(f"   {local(s):9}" + "".join(f"{v:>9}" if v is not None else f"{'-':>9}" for v in row))
    print("   Pod 500 ms = v poradku. Tisice ms = sberac nestihal (nebo jely hodiny).")
