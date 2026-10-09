#!/usr/bin/env python3
"""
loadtest_live.py - does the collector keep up live when the market goes crazy?

1. Reads your real raw file from 8. 10. 2026 and finds the busiest second around 19:00 (trades, book updates).
2. Starts a local fake Binance that sends 2x that load for 10 seconds (plus calm before and after).
3. Runs your collector (~/code/binance_live.py) against it and measures the delay of every message,
   and how fast the live dashboard feed (WebSocket) gets the data.

Run:   ~/venv/bin/python ~/code/loadtest_live.py
It uses local ports 8765/8766 and /tmp only. Your real collector keeps running untouched.
"""
import asyncio
import gzip
import json
import os
import random
import shutil
import signal
import subprocess
import sys
import threading
import time
import zlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

RAW = os.path.expanduser("~/data/binance/raw_BTCUSDT_2026-10-08T17Z.jsonl.gz")
COLLECTOR = os.path.expanduser("~/code/binance_live.py")
WS_PORT, REST_PORT, LIVE_PORT = 8765, 8766, 8059


# ---------------------------------------------------------------- fake Binance (runs in a child process)
def fake_server(trades, bbo, levels):
    import websockets
    start = time.time()
    st = {"u": 1000, "a": 1, "p": 80000.0}
    base = {"trades": 300, "bbo": 1000, "levels": 200}
    burst = {"trades": trades, "bbo": bbo, "levels": levels}
    phase = lambda: burst if 8 <= time.time() - start < 18 else base
    now = lambda: int(time.time() * 1000)

    async def market(ws):
        last_mark = 0
        while True:
            ts = now()
            for _ in range(max(1, phase()["trades"] // 100)):
                st["p"] += random.choice((-0.1, 0, 0.1))
                st["a"] += 1
                await ws.send('{"stream":"btcusdt@aggTrade","data":{"e":"aggTrade","E":%d,"s":"BTCUSDT","a":%d,"p":"%.1f",'
                              '"q":"%.3f","nq":"0","f":%d,"l":%d,"T":%d,"m":%s}}' % (ts, st["a"], st["p"], random.random(), st["a"],
                                                                                  st["a"], ts, random.choice(("true", "false"))))
            if ts - last_mark >= 1000:
                last_mark = ts
                await ws.send('{"stream":"btcusdt@markPrice@1s","data":{"e":"markPriceUpdate","E":%d,"s":"BTCUSDT","p":"%.1f",'
                              '"i":"%.1f","P":"0","r":"0.0001","T":%d}}' % (ts, st["p"], st["p"], ts + 3600000))
            await asyncio.sleep(0.01)

    async def public(ws):
        last_depth = 0
        while True:
            ph, ts = phase(), now()
            for _ in range(max(1, ph["bbo"] // 100)):
                await ws.send('{"stream":"btcusdt@bookTicker","data":{"e":"bookTicker","u":%d,"s":"BTCUSDT","b":"%.1f","B":"%.3f",'
                              '"a":"%.1f","A":"%.3f","T":%d,"E":%d}}' % (st["u"], st["p"], random.random() * 5, st["p"] + 0.1,
                                                                        random.random() * 5, ts, ts))
            if ts - last_depth >= 100:
                last_depth, half, p = ts, ph["levels"] // 2, st["p"]
                b = ",".join('["%.1f","%.3f"]' % (p - 0.1 * k, random.random() * 3) for k in range(half))
                a = ",".join('["%.1f","%.3f"]' % (p + 0.1 * k, random.random() * 3) for k in range(half))
                pu = st["u"]
                st["u"] += 1
                await ws.send('{"stream":"btcusdt@depth@100ms","data":{"e":"depthUpdate","E":%d,"T":%d,"s":"BTCUSDT","U":%d,'
                              '"u":%d,"pu":%d,"b":[%s],"a":[%s]}}' % (ts, ts, st["u"], st["u"], pu, b, a))
            await asyncio.sleep(0.01)

    async def handler(ws):
        try:
            await (market(ws) if "/market/" in ws.request.path else public(ws))
        except websockets.exceptions.ConnectionClosed:
            pass

    class Rest(BaseHTTPRequestHandler):
        def do_GET(self):
            p = st["p"]
            if "/depth" in self.path:
                body = {"lastUpdateId": st["u"], "E": now(), "T": now(),
                        "bids": [["%.1f" % (p - 0.1 * k), "1.0"] for k in range(1000)],
                        "asks": [["%.1f" % (p + 0.1 * k), "1.0"] for k in range(1000)]}
            elif "/openInterest" in self.path:
                body = {"symbol": "BTCUSDT", "openInterest": "95000.0", "time": now()}
            else:
                body = []
            data = json.dumps(body).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, *a):
            pass

    threading.Thread(target=ThreadingHTTPServer(("127.0.0.1", REST_PORT), Rest).serve_forever, daemon=True).start()

    async def main():
        async with websockets.serve(handler, "127.0.0.1", WS_PORT, max_size=2 ** 24):
            await asyncio.sleep(40)

    asyncio.run(main())


# ---------------------------------------------------------------- real peak from your raw file
def real_peak():
    cnt, levels = {}, 0
    try:
        with gzip.open(RAW, "rt", encoding="utf-8") as f:
            for line in f:
                if '"recv_ms":17914788' not in line and '"recv_ms":17914787' not in line:
                    continue
                m = json.loads(line)
                d, s = m.get("data", {}), m.get("stream", "")
                if "E" not in d:
                    continue
                k = "trades" if "aggTrade" in s else "bbo" if "bookTicker" in s else "depth" if "@depth@" in s else None
                if k:
                    key = (d["E"] // 1000, k)
                    cnt[key] = cnt.get(key, 0) + 1
                    if k == "depth":
                        levels = max(levels, len(d.get("b", [])) + len(d.get("a", [])))
    except (OSError, EOFError, zlib.error):
        pass
    peak = {k: max([v for (s, kk), v in cnt.items() if kk == k] or [0]) for k in ("trades", "bbo", "depth")}
    return peak, levels


def run():
    peak, levels = real_peak()
    if peak["trades"]:
        print(f"Skutecna spicka kolem 19:00: {peak['trades']} obchodu/s, {peak['bbo']} zmen bid/ask/s, "
              f"kniha az {levels} urovni v jedne zmene")
    else:
        print("Raw soubor z 19:00 tu neni, beru spicku namerenou 8. 10. 2026 v 19:00:25 (4463 obchodu/s, 4937 bid/ask/s, 4465 urovni).")
        peak, levels = {"trades": 4463, "bbo": 4937}, 4465
    trades, bbo, lv = 2 * peak["trades"], 2 * peak["bbo"], max(800, levels)
    print(f"Test: 10 s zateze {trades} obchodu/s, {bbo} bid/ask/s a kniha {lv} urovni kazdych 100 ms (2x spicka)")

    out, feat = "/tmp/loadtest_out", "/tmp/loadtest_feat"
    shutil.rmtree(out, ignore_errors=True)
    shutil.rmtree(feat, ignore_errors=True)
    srv = subprocess.Popen([sys.executable, __file__, "--server", str(trades), str(bbo), str(lv)])
    time.sleep(1.5)
    col = subprocess.Popen([sys.executable, COLLECTOR, "--all", "--quiet", "--out", out, "--features", feat,
                            "--ws-base", f"ws://127.0.0.1:{WS_PORT}", "--rest-base", f"http://127.0.0.1:{REST_PORT}",
                            "--live-port", str(LIVE_PORT)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    t_start = time.time() - 1.5
    feed = []

    def listen():
        import websockets

        async def go():
            await asyncio.sleep(2)
            try:
                async with websockets.connect(f"ws://127.0.0.1:{LIVE_PORT}", max_size=2 ** 24) as ws:
                    while time.time() < t_start + 25:
                        try:
                            m = json.loads(await asyncio.wait_for(ws.recv(), 1))
                        except asyncio.TimeoutError:
                            continue
                        if m.get("type") == "tick" and m.get("e"):
                            feed.append((time.time() - t_start, int(time.time() * 1000) - m["e"]))
            except OSError:
                pass
        asyncio.run(go())

    th = threading.Thread(target=listen, daemon=True)
    th.start()
    time.sleep(24)
    th.join(timeout=5)
    col.send_signal(signal.SIGTERM)
    try:
        col.wait(timeout=20)
    except subprocess.TimeoutExpired:
        col.kill()
    srv.kill()

    lag, cnt, t0 = {}, {}, None
    for name in sorted(os.listdir(out)) if os.path.isdir(out) else []:
        if not name.startswith("raw_"):
            continue
        try:
            with gzip.open(os.path.join(out, name), "rt", encoding="utf-8") as f:
                for line in f:
                    m = json.loads(line)
                    d, s = m.get("data", {}), m.get("stream", "")
                    k = "obchody" if "aggTrade" in s else "kniha" if "@depth@" in s else "bid/ask" if "bookTicker" in s else None
                    if not k or "E" not in d:
                        continue
                    t0 = t0 or d["E"]
                    key = ((d["E"] - t0) // 1000, k)
                    lag[key] = max(lag.get(key, 0), m["recv_ms"] - d["E"])
                    cnt[key] = cnt.get(key, 0) + 1
        except (OSError, EOFError, zlib.error):
            pass
    if not lag:
        print("Sberac nic nezapsal. Bezi ~/code/binance_live.py v nejnovejsi verzi (umi --ws-base)?")
        return
    print(f"{'s':>3} {'obchody':>9} {'kniha':>8} {'bid/ask':>9}   nejvyssi zpozdeni v ms (zatez je v sekundach 7-17)")
    for s in range(0, 22):
        print(f"{s:>3}" + "".join(f"{lag.get((s, k), '-'):>9}" for k in ("obchody", "kniha", "bid/ask")))
    worst = {k: max([v for (s, kk), v in lag.items() if kk == k and 7 <= s <= 18] or [0]) for k in ("obchody", "kniha", "bid/ask")}
    got = {k: int(sum(v for (s, kk), v in cnt.items() if kk == k and 8 <= s <= 16) / 9) for k in ("obchody", "bid/ask")}
    print(f"Behem zateze skutecne doruceno: {got['obchody']} obchodu/s a {got['bid/ask']} bid/ask/s")
    burst_feed = sorted(l for t, l in feed if 8 <= t <= 18)
    if burst_feed:
        print(f"Zivy dashboard pri zatezi: data z burzy dorazila typicky za {burst_feed[len(burst_feed) // 2]} ms, "
              f"95 % do {burst_feed[int(len(burst_feed) * 0.95)]} ms, nejhur {burst_feed[-1]} ms")
    else:
        print("Zivy dashboard: zadna data (sberac bez --live-port?)")
    ok = worst["obchody"] < 250 and worst["kniha"] < 500 and worst["bid/ask"] < 500 and bool(burst_feed) and burst_feed[-1] < 500
    print(f"Nejhorsi zpozdeni: obchody {worst['obchody']} ms, kniha {worst['kniha']} ms, bid/ask {worst['bid/ask']} ms")
    print("VYSLEDEK: " + ("PROSEL, sberac stiha i dvojnasobek spicky." if ok else "NEPROSEL, sberac pri zatezi zaostava."))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--server":
        fake_server(int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]))
    else:
        if len(sys.argv) > 2 and sys.argv[1] == "--collector":
            COLLECTOR = sys.argv[2]
        run()
