# F1a-2: Binance Vision USD-M 1m download and build (commit 10)

Commit 10 of F1a-2: the full 1m download, build and manifest from a clean store, rerun after review round 5 (row quarantine and daily fill). It is the "later rerun" of `docs/f1/f1a2-r5-plan.md` section 8 with approval point 10 of the round 5 approval in `docs/f1/f1a-2-contract.md`. Branch `f1/a2-vision-1m` at `fb183e5` (PR #2 review clean), run on the PC on 2026-10-22 with the built-in 512 MiB ceiling, no cgroup. All paths below are relative to `experiments/strategy-destruction-filter`. No compare here: that is the VPS step.

Holdout units (from 2025-10-17) are reported with integrity metadata only (contract amendments rounds 4 and 5, F9): availability, row counts, missing minutes and ranges, open times. No prices, volumes, trade counts or values computed from candles appear in this document.

## Clean store

From the code (`src/vision-1m.mjs` parseArgs, `src/f1-1m-store.mjs`), download, build and verify write only these paths inside the clone; this matches plan section 8:

| Path | Written by | Before the rerun |
| --- | --- | --- |
| `data/vision/` | download: zips and CHECKSUMs under `<sha256>/` version directories, `*.tmp-*` temp files, `404/` markers (base and fill) | 563,577,075 B: 413 zips, 413 CHECKSUMs, 43 markers, no temp files |
| `data/market-cache/f1-1m/` | build: `<sha256>.bin` snapshots and their `*.tmp-*` temp files | 1,105,122,544 B: 328 snapshots |
| `results/manifest-f1-1m.json` with `.tmp` and `.lock` | build (the lock is created and removed by the run) | 281,859 B, sha256 equal to the stopped commit 10 backup; no `.tmp`, no `.lock` |

verify only reads. compare (not run) rebuilds into the operating system's temp directory, outside the clone. Nothing else was under `data/` (no `data/market-cache/h2/`). Exactly the three paths were deleted; the empty parent `data/market-cache/` stayed. Afterwards none of them existed and `git status` showed no tracked change.

## Commands and runs

Node v24.10.0 on linux. Wall time and maxRSS from `/usr/bin/time -v` (GNU time) for steps 1-4; the CLI's own memory report (`memory.maxRssMiB`) agrees. Step 5 is the read-only check script and was not timed.

| Step | Command | Exit | Wall time | maxRSS |
| --- | --- | --- | --- | --- |
| 1 | `node src/vision-1m.mjs download --symbols BTC,ETH,SOL,XRP,DOGE,HYPE --from 2021-10 --to 2026-10` | 0 | 21:37.05 | 178,020 KiB (174 MiB) |
| 2 | `node src/vision-1m.mjs build --symbols BTC,ETH,SOL,XRP,DOGE,HYPE --from 2021-10 --to 2026-10` | 0 | 0:45.34 | 188,632 KiB (184 MiB) |
| 3 | the same build again, without a download | 0 | 0:32.19 | 188,116 KiB (184 MiB) |
| 4 | `node src/vision-1m.mjs verify --symbols BTC,ETH,SOL,XRP,DOGE,HYPE --from 2021-10 --to 2026-10` | 0 | 0:10.27 | 141,944 KiB (139 MiB) |
| 5 | `node <check script> <outside the repo>/commit10-stopped-manifest-f1-1m.json results/manifest-f1-1m.json` | 0 | not timed | not measured |

Summary counts:

- Step 1, status ok. Base sources: expected 456, verified 413 = downloaded 413 + skipped 0, gaps 0, notListed 43, failed 0; repaired none; failures none. Fill sources (`fills.counts`): expected 41, downloaded 12, skipped 0, verified 12, unavailable 29, failed 0, monthlyParseFailed 0.
- Step 2, status ok: units 372, built 329, unchanged 0, empty 0, missing 0, notListed 43, failed 0.
- Step 3, status ok: units 372, built 0, unchanged 329, empty 0, missing 0, notListed 43, failed 0.
- Step 4, status ok: zips 425 (413 base + 12 fill), entries 329, orphans 0, sources 425; failures none.
- Step 5: `"status": "ok"`, failureCount 0 (see Regression).

## Coverage per symbol

From the build summary (step 2). Expected minutes count every unit that is not not_listed, over the F1a range 2021-10-18T00:00Z..2026-10-17T00:00Z (end-exclusive). Last candle for every symbol: 2026-10-16T23:59:00.000Z.

| Symbol | First base source file | First candle (UTC) | Bars | Expected minutes | Missing minutes | Missing ranges | not_listed months | Gaps |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BTCUSDT | `data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2021-10.zip` | 2021-10-18T00:00:00.000Z | 2,628,000 | 2,628,000 | 0 | 0 | none | 0 |
| ETHUSDT | `data/futures/um/monthly/klines/ETHUSDT/1m/ETHUSDT-1m-2021-10.zip` | 2021-10-18T00:00:00.000Z | 2,628,000 | 2,628,000 | 0 | 0 | none | 0 |
| SOLUSDT | `data/futures/um/monthly/klines/SOLUSDT/1m/SOLUSDT-1m-2021-10.zip` | 2021-10-18T00:00:00.000Z | 2,628,000 | 2,628,000 | 0 | 0 | none | 0 |
| XRPUSDT | `data/futures/um/monthly/klines/XRPUSDT/1m/XRPUSDT-1m-2021-10.zip` | 2021-10-18T00:00:00.000Z | 2,627,999 | 2,628,000 | 1 | 1 | none | 0 |
| DOGEUSDT | `data/futures/um/monthly/klines/DOGEUSDT/1m/DOGEUSDT-1m-2021-10.zip` | 2021-10-18T00:00:00.000Z | 2,628,000 | 2,628,000 | 0 | 0 | none | 0 |
| HYPEUSDT | `data/futures/um/monthly/klines/HYPEUSDT/1m/HYPEUSDT-1m-2025-05.zip` | 2025-05-30T10:30:00.000Z | 726,570 | 768,960 | 42,390 | 1 | 43: 2021-10..2025-04 | 0 |

Missing ranges (end-exclusive; every range there is, so fewer than the 10 largest):

| Symbol | Start | End | Minutes |
| --- | --- | --- | --- |
| HYPEUSDT | 2025-05-01T00:00:00.000Z | 2025-05-30T10:30:00.000Z | 42,390 |
| XRPUSDT | 2023-11-30T12:35:00.000Z | 2023-11-30T12:36:00.000Z | 1 |

The XRPUSDT minute is the quarantined row below. The HYPEUSDT range is the part of its first listed month before the first candle.

## Quarantine and daily fill per symbol

Quarantined source rows and unique quarantined minutes from build and verify (equal); filled minutes and fill sources used from build; unavailable fill days from verify's `unavailableAtBuild` (the state recorded at build time, derived from the entries).

| Symbol | Quarantined source rows | Unique quarantined minutes | Filled minutes | Fill sources used | Unavailable fill days |
| --- | --- | --- | --- | --- | --- |
| BTCUSDT | 0 | 0 | 0 | 0 | 0 |
| ETHUSDT | 0 | 0 | 0 | 0 | 0 |
| SOLUSDT | 0 | 0 | 7,200 | 5 | 0 |
| XRPUSDT | 2 | 1 | 7,200 | 6 | 0 |
| DOGEUSDT | 0 | 0 | 0 | 0 | 0 |
| HYPEUSDT | 0 | 0 | 0 | 1 | 29 |

Quarantine records `{file, openTime, rule}` (all of them):

| file | openTime | rule |
| --- | --- | --- |
| `data/futures/um/daily/klines/XRPUSDT/1m/XRPUSDT-1m-2023-11-30.zip` | 2023-11-30T12:35:00.000Z | taker_buy_volume must be within 0..volume |
| `data/futures/um/monthly/klines/XRPUSDT/1m/XRPUSDT-1m-2023-11.zip` | 2023-11-30T12:35:00.000Z | taker_buy_volume must be within 0..volume |

Fill sources and filled ranges per unit (all research units; no holdout unit has a fill source or a quarantined row):

| Unit | Fill sources (daily files) | filledRanges | Filled minutes | Unavailable fill days |
| --- | --- | --- | --- | --- |
| SOLUSDT 2022-02 | 2022-02-26, 2022-02-27, 2022-02-28 | 2022-02-26T00:00:00.000Z..2022-03-01T00:00:00.000Z | 4,320 | none |
| SOLUSDT 2022-04 | 2022-04-01, 2022-04-02 | 2022-04-01T00:00:00.000Z..2022-04-03T00:00:00.000Z | 2,880 | none |
| XRPUSDT 2022-02 | 2022-02-26, 2022-02-27, 2022-02-28 | 2022-02-26T00:00:00.000Z..2022-03-01T00:00:00.000Z | 4,320 | none |
| XRPUSDT 2022-04 | 2022-04-01, 2022-04-02 | 2022-04-01T00:00:00.000Z..2022-04-03T00:00:00.000Z | 2,880 | none |
| XRPUSDT 2023-11 | 2023-11-30 (quarantined in both files at the same minute: fills nothing) | none | 0 | none |
| HYPEUSDT 2025-05 | 2025-05-30 (agrees with the monthly file, fills nothing) | none | 0 | 29: 2025-05-01..2025-05-29 (404 on both files) |

The daily file paths follow `data/futures/um/daily/klines/<contract>/1m/<contract>-1m-<YYYY-MM-DD>.zip`. No fill day 2025-05-31 for HYPEUSDT, and no XRPUSDT 2023-11 fill day other than 2023-11-30.

## HYPE listing

- First Vision file: `data/futures/um/monthly/klines/HYPEUSDT/1m/HYPEUSDT-1m-2025-05.zip` (download `firstFiles` and build `firstSourceFile` agree).
- First 1m candle: 2025-05-30T10:30:00.000Z.
- exchangeInfo onboardDate, fetched by the VPS agent on 2026-10-21 outside this code: 2025-05-30T10:30:00Z. The first candle equals the onboard date.
- not_listed: 2021-10..2025-04 (43 months), none from 2025-05 on.

## Holdout integrity

78 holdout entries, 13 per symbol (2025-10-17T00:00Z..2026-10-17T00:00Z). For every symbol: first candle 2025-10-17T00:00:00.000Z, last candle 2026-10-16T23:59:00.000Z, 525,600 rows, 0 missing minutes, 0 quarantined rows, no fill source. The 2026-10 units are built from the base dailies 2026-10-01..16 (96 files) and have no fill sources.

## Regression against the stopped commit 10 build

Backup: `<outside the repo>/commit10-stopped-manifest-f1-1m.json`, sha256 `e0606e81ca67532816ed29292ceedde6ec016ca181a4ff2e3d7a4ceeb22fae03`, 328 entries (checked before the clean store). Check script sha256 `c2608a86cddfbd265dff5fb9d04057d3e84367ab8987b2ee46fd79d5fe291863`: it reads the backup as raw JSON, the new manifest through the repo's `readManifest` and compares by unit key.

- Result: status ok, failureCount 0, new manifest accepted by `readManifest`.
- Units compared: 329 (323 regression units + 6 named units). Regression units equal to the backup: 323 of 323, each with the identical snapshot sha256 and an entry equal apart from `quarantinedRows: []` and `filledRanges: []`.
- Named units, each compared field by field with the amendment's expected outcome:
  - SOLUSDT 2022-02 and XRPUSDT 2022-02: 4,320 minutes filled from 3 dailies, last candle now 2022-02-28T23:59:00.000Z, no missing range.
  - SOLUSDT 2022-04 and XRPUSDT 2022-04: 2,880 minutes filled from 2 dailies, first candle now 2022-04-01T00:00:00.000Z, no missing range.
  - HYPEUSDT 2025-05: daily 2025-05-30 added to sources, coverage unchanged (42,390 missing minutes, first candle 2025-05-30T10:30:00.000Z), 29 unavailable fill days.
  - XRPUSDT 2023-11: new (it failed in commit 10), 2 quarantine records, 1 missing minute, daily 2023-11-30 in sources.
- For the five changed units the monthly source sha256 equals the backup's and the snapshot sha256 changed with the sources.

## Store on the PC

| Item | Count | Bytes |
| --- | --- | --- |
| Base zips | 413 (317 monthly + 96 daily of 2026-10) | 561,670,769 |
| Fill zips | 12 | 617,231 |
| All zips | 425 | 562,288,000 |
| CHECKSUMs | 425 | |
| 404 markers | 72 (43 base, 29 fill) | |
| `data/vision/` total (`du -sb`) | | 564,249,587 |
| Snapshots | 329 | 1,109,696,504 |
| `data/market-cache/f1-1m/` total (`du -sb`) | | 1,109,733,368 |

## Manifest and determinism

- `results/manifest-f1-1m.json`: 329 entries (251 research, 78 holdout), 303,650 bytes, sha256 `ab28161a599c91fbb8e1e026b2a9fc366ebd742340d9a28bbb552330f355b0ed`.
- Determinism rerun (step 3): built 0, unchanged 329, same not_listed (43) and empty (0) counts, exit 0, and the manifest sha256 after step 3 identical to step 2.
