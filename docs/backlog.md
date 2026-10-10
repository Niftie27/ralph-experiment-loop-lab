# RALPH backlog
Rule: nothing here enters trading decisions without a passing backtest AND a passing live simulation.
Data-quality and ops items may go in any time, with Tomas's OK.

## Now: data correctness and ops
1. Watchdog: collectors alive, last trade age < 30 s, last book update age, timers ran. One Telegram message
 on failure only.
2. PC vs VPS cross-check: the PC computes the same hourly checksums as data-checks/ and compares them with
 the VPS file from GitHub.
3. Weekly copy of derived data to Tomas's PC (backup; derived data grow ~0.27 GB/day and would fill the VPS
 disk within about a month).
4. Recalibrate ETH/SOL/HYPE thresholds after 7 days of data (current values come from one hour,
 2026-10-09T08Z).
5. A trade arriving more than 15 min after its hour reopens a gzipped tape: the collector writes a new
 tape.csv next to the old tape.csv.gz, maintenance skips it, and readers can count trades twice.
 Fix: merge both by AggId into one verified .gz.
6. If compression hurts latency later, try xz -3 or run compression only at night (measured 2026-10-10:
 worst 28/20/23 ms, dashboard 32 ms).
7. Dashboard is BTC-only (labels, decimals, size thresholds). Make it per-symbol later, low priority.

## For D and v2: realism
8. v1 paper and demo-sim fill at the exact spot alert price with zero delay (optimistic). v2 fills at the
 first futures price after the latency (150/500/1000/2000 ms sweep), plus spread and fees.
9. Limit-order fills: count a fill only when price trades through the limit by 1 tick (a touch is not a fill).
10. Costs: maker/taker fees, spread from recorded book, funding for positions held across funding times.
11. Holdout lock: keep the last 2+ weeks untouched until a strategy's final check; log every variant tried.
12. Split results by session (Asia/EU/US) and volatility regime.
13. Live/replay parity: replay a recorded day through the same code; it must produce that day's live alerts.
14. Diagnostics before rejecting OR accepting a result: data gaps (missing IDs), stale book at the signal
 time, receive-vs-event latency, reconnects, clock drift, fill assumptions, look-ahead (future data).

## Later: features, gated by backtests and live simulation
15. Binance spot collector: spot-futures lead/lag and basis (2026-10-08 17:00:25Z: futures -0.432 % vs spot
 -0.177 % in 5 s).
16. Bybit allLiquidation, CME gap, TPO single prints / LVN, candle patterns.
17. Funding/OI divergence as a regime filter.
18. Optional v1.1: a copy of v1 with realistic fills, running next to unchanged v1.

## Decisions and cleanup: Tomas decides
19. More disk (Tomas buys later): then extend raw retention beyond 7 days.
20. One Telegram chat receives everything. v2 messages go to a separate test chat.
21. Short-watch scripts: fixed levels from 2026-09-19, no expiry.
22. v1: close code not logged, no backfill after reconnects (21-25 per day on 10-07 and 10-08). Not fixing;
 v2 replaces it.
