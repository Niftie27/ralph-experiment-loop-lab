# Phase 2 Diagnostics And Storage Report

Date: 2026-10-09
Scope: read-only diagnostics and measurements. No v1 edits, no service restarts, no deletions, no keys, no accounts, no timers.

## BTC 2026-10-08 17:00:25 UTC Diagnostic

Command run:

```bash
python3 /home/coder/ralph_collector/diag_1900.py
```

Output:

```text
1) Stejnych 5 sekund na Futures a na Spotu
Binance Futures: cena 5 s pred 80,877.7, minimum 80,528.0, pohyb -0.432 %, objem za 5 s 130.96 M$, normal 2.31 M$ za 5 s, velocity 56.7x
Binance Spot   : cena 5 s pred 80,915.3, minimum 80,772.0, pohyb -0.177 %, objem za 5 s 5.41 M$, normal 0.27 M$ za 5 s, velocity 19.8x
   RALPHuv BTC WICK alert v 17:38 prisel pri -0,30 % za 5 s, takze jeho prah je asi 0,30 %.

2) Zpozdeni naseho sberace (cas prijeti minus cas odeslani burzou), nejvyssi za sekundu, v ms
   soubor /home/coder/data/binance/raw_BTCUSDT_2026-10-08T17Z.jsonl.gz nenalezen
```

Interpretation:

- The futures move would satisfy a `>= 0.30% / 5s` futures trigger.
- The spot move did not satisfy the current BTC v1 spot threshold: `-0.177% / 5s` vs required about `-0.30% / 5s`.
- The local raw futures file for `2026-10-08T17Z` is not present, so collector delay could not be measured from local raw data for that exact minute.

## Watcher Log Around 17:00:25 UTC

File: `/home/coder/.openclaw/workspace/crypto-updates/runtime/realtime-market-watcher.log`

```text
16941 [2026-10-08T16:59:44.330Z] binance websocket closed; reconnecting in 5s
16942 [2026-10-08T16:59:49.335Z] connecting wss://stream.binance.com:9443/stream?streams=btcusdt@trade/btcusdt@depth5@100ms/ethusdt@trade/ethusdt@depth5@100ms/solusdt@trade/solusdt@depth5@100ms
16943 [2026-10-08T16:59:51.101Z] connected
16944 [2026-10-08T17:03:09.271Z] binance websocket closed; reconnecting in 5s
16945 [2026-10-08T17:03:14.276Z] connecting wss://stream.binance.com:9443/stream?streams=btcusdt@trade/btcusdt@depth5@100ms/ethusdt@trade/ethusdt@depth5@100ms/solusdt@trade/solusdt@depth5@100ms
16946 [2026-10-08T17:03:16.831Z] connected
```

Alert-feedback query for `2026-10-08T16:55:00Z..17:05:00Z` returned `0` alert/review rows.

Why no BTC alert:

- v1 was connected and reading Binance spot streams around the event.
- It only records alert/review log lines, not every trade decision.
- The current Binance stream URL is spot-only: `wss://stream.binance.com:9443/stream?...btcusdt@trade...`.
- The v1 BTC threshold is `0.30% / 5s`.
- Spot moved only `-0.177% / 5s`, so the threshold did not fire.
- Futures moved `-0.432% / 5s`; v1 does not use that futures stream for alert triggers.

Explicit current-state confirmation: v1 alert triggers are still spot-only for BTC/ETH/SOL. The same futures-only `-0.432% / 5s` move with spot at `-0.177% / 5s` would not alert today unless a separate futures trigger path is added and approved.

## Recompute Frequency

Current v1 watcher:

- handles each Binance `@trade` websocket message as it arrives
- appends the trade to rolling price and volume histories
- checks thresholds immediately after each trade
- computes volume velocity from rolling trade notional, not from a fixed 5-second bucket schedule

So trigger and velocity evaluation are effectively per trade/event. The measurement windows are rolling windows such as `5s`, `60s`, `5m`, and `15m`, but the code does not wait for a 5-second bucket close.

Relevant code path:

- `connectBinance()` reads `btcusdt@trade`, `ethusdt@trade`, `solusdt@trade`
- `handleTrade()` appends the event and evaluates every threshold
- `maybeAlert()` calls `volumeVelocity(asset.symbol, eventTime)` at alert time

## Storage Measurement

Sample hour: complete BTC raw hour `BTCUSDT 2026-10-09T08Z`.

Files:

- raw gzip: `/home/coder/data/binance/raw_BTCUSDT_2026-10-09T08Z.jsonl.gz`
- tape csv: `/home/coder/data/binance/tape_BTCUSDT_2026-10-09T08Z.csv`
- book gzip: `/home/coder/data/binance/book_BTCUSDT_2026-10-09T08Z.jsonl.gz`

Raw file:

- compressed gzip bytes: `38,249,432`
- uncompressed JSONL bytes: `308,431,974`
- lines: `1,015,179`
- duration: `3,599.990 s`

Byte share by stream, measured on uncompressed JSONL line bytes:

| stream | lines | bytes | share |
| --- | ---: | ---: | ---: |
| `btcusdt@bookTicker` | 946,436 | 225,927,705 | 73.25% |
| `btcusdt@depth@100ms` | 35,276 | 74,379,466 | 24.12% |
| `btcusdt@aggTrade` | 29,501 | 7,094,670 | 2.30% |
| `btcusdt@markPrice@1s` | 3,600 | 932,400 | 0.30% |
| `btcusdt@openInterest` | 351 | 51,597 | 0.02% |
| `btcusdt@depthSnapshot` | 1 | 42,173 | 0.01% |
| `btcusdt@forceOrder` | 14 | 3,963 | ~0.00% |

Compression measurements, all read-only against the source file and using `nice -n 19 ionice -c3` for the compressor:

| case | output bytes | ratio vs current raw gzip | real | user | sys | max RSS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `xz -6`, keep `bookTicker` | 17,834,304 | 46.63% | 91.69s | 74.88s | 1.30s | 85,248 KB |
| `zstd -19`, keep `bookTicker` | 17,965,935 | 46.97% | 189.03s | 172.40s | 1.14s | 219,264 KB |
| `xz -6`, without `bookTicker` | 9,866,048 | 25.79% | 52.47s | 43.92s | 0.90s | 85,248 KB |
| `zstd -19`, without `bookTicker` | 10,341,765 | 27.04% | 59.72s | 51.71s | 0.78s | 170,880 KB |
| `gzip -9` tape csv | 430,827 | 17.57% of tape csv | 0.41s | 0.28s | 0.00s | 2,176 KB |

Projection per BTC day from this hour:

| policy | bytes/hour | GB/day decimal | GiB/day |
| --- | ---: | ---: | ---: |
| current: raw gzip + plain tape + book gzip | 42,508,892 | 1.020 | 0.950 |
| current raw gzip + gzip tape + book gzip | 40,487,641 | 0.972 | 0.905 |
| `xz -6` raw, keep `bookTicker` + gzip tape + book gzip | 20,072,513 | 0.482 | 0.449 |
| `zstd -19` raw, keep `bookTicker` + gzip tape + book gzip | 20,204,144 | 0.485 | 0.452 |
| `xz -6` raw without `bookTicker` + gzip tape + book gzip | 12,104,257 | 0.291 | 0.271 |
| `zstd -19` raw without `bookTicker` + gzip tape + book gzip | 12,579,974 | 0.302 | 0.281 |

Interpretation:

- Dropping `bookTicker` from raw is the biggest single storage win.
- `xz -6` was smaller than `zstd -19` on this sample and materially faster than `zstd -19`.
- `zstd -19` is not attractive here unless future operational constraints favor zstd tooling.
- Better default proposal: raw recompress with `xz -6`, tape gzip, keep derived/book files as designed, and do not write `bookTicker` to raw once Claude's collector/engine changes support that safely.

## ETH/SOL/HYPE Growth Check

Only partial multi-symbol history is available locally as of this measurement:

- ETH complete comparable hours: mostly `06Z`, `07Z`, `08Z`; `05Z` is partial/smaller.
- SOL complete comparable hours: mostly `06Z`, `07Z`, `08Z`; `05Z` is partial/smaller.
- HYPE complete comparable hours: `06Z`, `07Z`, `08Z`; no 24-hour sample yet.

Representative raw gzip bytes:

| symbol | 06Z | 07Z | 08Z |
| --- | ---: | ---: | ---: |
| ETH | 31,672,345 | 36,517,918 | 34,278,808 |
| SOL | 13,846,069 | 14,577,434 | 15,126,518 |
| HYPE | 6,085,872 | 13,914,257 | 12,654,835 |

This is not yet a valid 24-hour growth measurement. Re-measure after 24 complete hours before sizing retention for ETH/SOL/HYPE.

## Retention Proposal

Proposed policy, not implemented:

- derived data: keep forever, because it is compact and useful for research/replay indices
- raw data on VPS: keep 7 days
- older raw: archive to Hetzner Storage Box or delete only after explicit approval
- no account creation without approval
- nightly user systemd timer only after review
- disk alert when free space drops below 20%

Hetzner Storage Box access/cost check:

- official page lists Storage Box tiers with 1 TB, 5 TB, 10 TB, and 20 TB capacity, unlimited traffic, SFTP/SCP/rsync/WebDAV/BorgBackup/Restic/Rclone support, optional Germany/Finland location, and no minimum contract period
- current public price scrape did not expose numeric prices directly because the page renders prices through Hetzner localization components
- external current-price references show BX11 1 TB around `EUR 3.20/mo` excluding VAT; verify inside Hetzner Console before approval or ordering

Source: https://www.hetzner.com/storage/storage-box/?country=us

## Implementation Boundaries

Implemented in this pass:

- diagnostics run
- log inspection
- storage measurement
- proposal written

Not implemented:

- no v1 watcher edit
- no service restart
- no collector edit
- no compression automation
- no deletion/archive
- no account setup
- no systemd timer
- no disk alert
