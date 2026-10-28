# F1a-3 aggregation: implementation report

Branch `f1/a3-aggregation`. Written 2026-10-27 by Claude Code on the PC (commit 8, `cd23e4e`); updated 2026-10-28 after amendments 1 and 2 (commit 16). Contract `docs/f1/f1a-3-contract.md` (binding, with both amendments verbatim), plan `docs/f1/f1a-3-plan.md`. Every claim is labelled **tested** (how, how many), **taken over** (from where) or **reasoning**. Paths are relative to `experiments/strategy-destruction-filter` unless they start with `docs/`.

## Result

**Acceptance is met under the contract with amendments 1 and 2: the full compare exits 0** (tested, run at `2786b45`, clean tree). Every symbol has status ok and no unexplained bar:

- **1h.** For every symbol the mismatched 1h bars are exactly the E1 hours whose aggregate bar is complete (D1).
- **4h and 1d.** Every mismatched bar holds an E1 hour or is in E2. The mismatched bars without an E1 hour are exactly the complete E2 bars without one (D5).
- **No other disposition.** No absent_row, reference_quarantined or absent_file in 1h or 4h.
- **SOL and XRP filled days.** With the D2 daily reference files, their five filled days compare like every other day.

The aggregator was not changed after commit 5. No minute was filled or flagged. No test, threshold, gate, cost or window was changed to make the compare pass.

## Amendments (taken over: contract)

- **Amendment 1 (Tomas, 2026-10-27).**
  - D1: the exception class E1 and the 1h acceptance.
  - D2: daily 1h, 4h and 1d reference files for the days the 1m store fills from daily files (SOL and XRP 2022-02-26..28 and 2022-04-01..02), plus daily 5m and 15m files for SOL 2022-02-26..28.
  - D3: the PR is opened after the fix commits.
  - Implemented in commits 10 (`764bf80`), 11 (`f5db4ad`) and 12 (`6c953ce`).
- **Amendment 2 (Tomas, 2026-10-28).**
  - D4: E1 unchanged, and the revised four-day cross-check.
  - D5: the exception class E2 (a 4h or 1d bar whose Vision row does not reproduce from Vision's own 1h rows). D5 replaces the 4h and 1d part of D1.
  - Implemented in commits 14 (`742360d`) and 15 (`2786b45`).

Neither class says which file is right. Before F1b uses volume, count or taker columns, the treatment of E1 and E2 bars is decided (ledger items filed by Claude in chat).

## What was built

| Commit | Content |
| --- | --- |
| 2, 3 | Interval-aware Vision paths and parser; the verified transport moved to `src/vision-transport.mjs` (pure moves, checked by Claude in chat) |
| 4 | Glossary rows in `docs/ubiquitous-language.md` |
| 5 `818063c` | `src/f1-aggregate.mjs`: `aggregateResearch({ reader, instrument, timeframes, dataStart, dataEnd, check })`; reads one calendar month at a time; exact decimals; P1 strict omit; V5 digest |
| 6 `1410dc3` | `src/f1-reference.mjs download`: the reference plan with its holdout guard, downloaded through the verified transport |
| 7 `8ba1bdd`, `e5efe41` | Export of three existing helpers (no behaviour change); `src/f1-reference.mjs compare` with V1, V3 and V4 |
| 10 `764bf80` | D2: the daily reference files of the filled days in the plan (1,211 planned files) |
| 11 `f5db4ad`, 14 `742360d` | `src/f1-e1.mjs`: the E1 and E2 lists from Vision's own files, with its own exact sums and no import of `src/f1-aggregate.mjs` or `src/f1-reference.mjs` |
| 12 `6c953ce`, 15 `2786b45` | Compare reads the committed lists (`--e1`, `--e2`) and applies D1 and D5 |

Tests: 264 of 264 pass (`node --test`, Node v24.10.0), 204 at the branch base.

## Commands, versions, inputs (V7)

- **Runtime.** Node v24.10.0 (PC). E1, E2 and the compare were run at git revision `2786b453a400626529b069d213c2f3fdca1d0414` (clean tree, recorded by both scripts).
- **Commands.**
  - `node src/f1-reference.mjs download`. The 36 D2 files of SOL and XRP were fetched on 2026-10-27 with `--symbols SOL,XRP` at `6c953ce`: exit 0, 7.5 min, all published.
  - `node src/f1-e1.mjs`: writes `docs/f1/f1a-3-e1.csv` and `docs/f1/f1a-3-e2.csv`.
  - `node src/f1-reference.mjs compare`.
  - All with the default symbols BTC, ETH, SOL, XRP, DOGE and HYPE.
- **1m input.** `results/manifest-f1-1m.json` sha256 `ab28161a599c91fbb8e1e026b2a9fc366ebd742340d9a28bbb552330f355b0ed`, unchanged since F1a-2. Research units: 49 per core symbol and 6 for HYPE.
- **Module hashes (sha256).**
  - `src/f1-aggregate.mjs` `dbbf651518c6bcf3337d004db0d4d624b07717ac115c3e6f8f24ba21bbe3430e` (unchanged since commit 5, also recorded by the compare)
  - `src/f1-reference.mjs` `cf3e24549a4024c410392e1a0e353b26b217dc8a7b61986538a2ba7d8f332bd2`
  - `src/f1-e1.mjs` `a2fae79611906f70f7883aa8eb0e548a48d8267a9a4d1a3d1d5e889e4d9e6a99` (also recorded by the E1 run)
  - `src/vision-source.mjs` `801da2419ff5d2ddccaac98abb73eea25e4bbd592f73ccafb5c1ebc24b562131`
  - `src/f1-1m-reader.mjs` `a3dc81432bfdfb1d328910b3a48f442c87263ab5b218983bfe3ea646a869d308`
- **Reference input.** 1,211 planned files: 351 each for 1h, 4h and 1d, 140 for 1w, and 9 each for 5m and 15m. Of these, 1,187 are verified and 24 are not published.
  - Hash `76e305d79f21ac79beb84d9b9dd0b075fef62c6e2ecd4ea403e6041ed44e5663`: the sha256 of one line per planned file in plan order (symbols BTC, ETH, SOL, XRP, DOGE, HYPE), joined by newlines with a final newline.
  - Each line is `<Vision path> <sha256 of its one local version>`, or `<Vision path> 404` for a file that is not published (tested, throwaway script; method as in commit 8).
- **Lists (committed).**
  - `docs/f1/f1a-3-e1.csv`: 64 rows, sha256 `66d3586410e248be96ea69ee30634e23a722844ba2c2d3d104c597a5635de976`. It is byte-identical to the list of the stopped run at `6c953ce`.
  - `docs/f1/f1a-3-e2.csv`: 23 rows, sha256 `bfb25b0a33735ad7ca94dd222bd11a3aeef229653058fd7aafd00716a3a9a219`.
  - The E1 run's input digest (every 1m source and every 1h, 4h and 1d file with its hash) is `c3840365f13417d73d6fed0ba0e7b23c91985405a7210be75d071e3aa7a42156`, over 263 1m sources, 351 1h files and 702 4h and 1d files.

## E1 and E2 (tested, run of `src/f1-e1.mjs` at `2786b45`)

Exit 0 in 50 s; maxRSS 356 MiB (guard) and 364,544 KB (`/usr/bin/time`). Every planned 1h, 4h and 1d file was verified; no file was absent.

| Symbol | Hours checked | E1 hours | 4h bars checked | E2 4h | 1d bars checked | E2 1d |
| --- | --- | --- | --- | --- | --- | --- |
| BTC | 35,040 | 15 | 8,760 | 3 | 1,460 | 2 |
| ETH | 35,040 | 13 | 8,760 | 2 | 1,460 | 2 |
| SOL | 35,040 | 12 | 8,760 | 2 | 1,460 | 2 |
| XRP | 35,040 | 12 | 8,760 | 2 | 1,460 | 4 |
| DOGE | 35,040 | 12 | 8,760 | 2 | 1,460 | 2 |
| HYPE | 3,349 | 0 | 837 | 0 | 139 | 0 |

A bar is checked only when all its minutes (E1) or all its 1h rows (E2) are present. The only short bars are HYPE's first listed day, 2025-05-30: the hour 10:00, the 4h bar 08:00 and the day itself.

**E1, 18 distinct hours (64 rows).** The committed list gives the differing columns and the relative differences.

| Hour (UTC) | Symbols |
| --- | --- |
| 2022-05-28T17:00 | XRP |
| 2022-06-18T20:00 | BTC, ETH, SOL, XRP, DOGE |
| 2022-06-22T11:00 | BTC, ETH, SOL, DOGE |
| 2022-06-23T19:00, 2022-06-24T11:00, 2022-07-04T11:00, 2022-08-19T00:00, 2022-08-21T08:00 | BTC, ETH, SOL, XRP, DOGE |
| 2023-08-16T15:00 | BTC, ETH |
| 2023-11-10T15:00, 2023-11-10T16:00 | BTC |
| 2023-11-14T11:00 | ETH, SOL, XRP, DOGE |
| 2023-11-30T12:00 | XRP (its aggregate bar is incomplete: quarantined minute 12:35) |
| 2024-10-28T21:00 | BTC, ETH, SOL, DOGE |
| 2025-01-14T13:00 | BTC, ETH, SOL, XRP, DOGE |
| 2025-01-14T15:00 | BTC |
| 2025-01-29T01:00, 2025-01-29T02:00 | BTC, ETH, SOL, XRP, DOGE |

**E2, 23 bars.**

- 4h 2022-07-16T04:00, 1d 2022-07-16 and 1d 2023-08-16: BTC, ETH, SOL, XRP and DOGE (15 bars). In each, Vision's 4h or 1d volume, quote volume, count and taker sums differ from the sum of its own 1h rows. On 2022-07-16 the 1h sums are smaller by a relative 1e-5 to 4.5e-4. On 2023-08-16 they are larger by 2.4e-2 to 3.6e-2.
- 4h 2024-10-28T20:00: BTC, ETH, SOL and DOGE (open, and low for ETH and SOL). The bar holds the E1 hour 21:00.
- BTC 4h 2023-11-10T12:00 (close and the sums). It holds the E1 hour 15:00.
- XRP 4h 2023-11-14T08:00 and 1d 2023-11-14 (volume). Both hold the E1 hour 11:00.
- XRP 1d 2023-11-30 (taker_buy_volume). It holds the E1 hour 12:00.

### Cross-checks (tested)

- **E1 on the four days of amendment 1 (D4).**
  - Expected: the 24 hours of Claude in chat's check minus BTC 2023-11-14T11:00, that is 23 hours. The 24 are BTC, ETH, SOL, XRP and DOGE at 2022-06-18T20:00, 2023-11-14T11:00, 2025-01-29T01:00 and 2025-01-29T02:00, plus BTC, ETH, SOL and DOGE at 2024-10-28T21:00.
  - E1 rows on 2022-06-18, 2023-11-14, 2024-10-28 and 2025-01-29: exactly these 23. None is missing and none is extra.
- **E2 in 2022-07 and 2023-08.** The E2 rows of these months are exactly the 15 expected bars: 4h 2022-07-16T04:00, 1d 2022-07-16 and 1d 2023-08-16 for BTC, ETH, SOL, XRP and DOGE. None is missing and none is extra.

### BTC and ETH on 2023-08-16 (tested)

- **Their E1 hour.** BTC and ETH each have the E1 hour 2023-08-16T15:00. It differs in volume, quote volume, count and both taker sums: the 1m sums exceed the 1h row by a relative 7.8e-6 to 1.4e-4 for BTC and 4.4e-4 to 1.2e-3 for ETH. SOL, XRP and DOGE have no E1 hour that day.
- **Why the run at `6c953ce` showed only SOL, XRP and DOGE.** The 1d bar 2023-08-16 mismatches for all five core symbols. For BTC and ETH it holds the E1 hour 15:00, so D1 accepted it there. Only SOL, XRP and DOGE were left unexplained.
- **Under D5.** The bar is an E2 bar for all five symbols, as Claude in chat found. For SOL, XRP and DOGE it is a complete E2 bar without an E1 hour, and it mismatches. For BTC and ETH it is an E2 bar that holds an E1 hour, which passes whether it matches or not.

## Precision survey (V7, rerun 2026-10-27; unchanged)

Method (tested, throwaway script outside the repo; the rule it checks is used by `src/f1-aggregate.mjs`):

- Scope: every source zip of every research entry of the 1m manifest (251 entries; 263 files, daily fill files included). Each row is filtered to its unit bounds by open time before any value token is read.
- Tokens checked: the eight decimal columns open, high, low, close, volume, quote_volume, taker_buy_volume and taker_buy_quote_volume.
- Significant digits of a token: its digits without sign or dot, with leading zeros stripped.
- Round trip: `String(Number(token))` must equal the token in canonical form (exponent form expanded, trailing fractional zeros and a trailing dot removed, leading zeros removed).

Result: 10,715,220 rows (the 1m rows, plus the overlap of daily fill files with their monthly files). Tokens with more than 15 significant digits: 0. The maximum is 15 for BTC, ETH, SOL, DOGE and HYPE and 14 for XRP. Round-trip failures: 0. This matches plan section a. So recovering each 1m decimal with `String(x)` is exact on the whole research store. The aggregator still fails closed on exponent form, more than 15 significant digits, a negative value or a coefficient of 2^53 or more.

## Aggregates (tested, compare runs and a six-timeframe run)

Complete and incomplete bars equal plan section c in every cell (complete / incomplete):

| Symbol | 5m | 15m | 1h | 4h | 1d | 1w |
| --- | --- | --- | --- | --- | --- | --- |
| BTC, ETH, SOL, DOGE | 420,480 / 0 | 140,160 / 0 | 35,040 / 0 | 8,760 / 0 | 1,460 / 0 | 208 / 1 |
| XRP | 420,479 / 1 | 140,159 / 1 | 35,039 / 1 | 8,759 / 1 | 1,459 / 1 | 207 / 2 |
| HYPE (from 2025-05-01) | 40,194 / 0 | 13,398 / 0 | 3,349 / 1 | 837 / 1 | 139 / 1 | 19 / 2 |

- XRP: one `missing_minutes` bar per timeframe around the quarantined minute 2023-11-30T12:35Z.
- HYPE: partial bars 1h 10:00 (30 of 60), 4h 08:00 (90 of 240), 1d 2025-05-30 (810 of 1440) and 1w 2025-05-26 (3690 of 10080). Empty ranges start 2025-05-01; the 5m range holds 8,478 slots.
- Every symbol: the week of 2025-10-13 is `window_edge` with 5,760 of 10,080 minutes.

The full-window digests of 1h, 4h, 1d and 1w are the same in the compare runs (four timeframes) and in a separate six-timeframe run. A first all-BigInt version of the aggregator gave the same six BTC digests as the final version.

## Reference download (tested)

- **Commit 8 run.** Exit 0 in 32 min; maxRSS 104 MiB.
  - Of 1,175 planned files, 1,151 were downloaded and verified against their CHECKSUM. 0 failed and 0 CHECKSUMs were repaired.
  - 24 files are not published (404 on the zip and its CHECKSUM): the monthly 1w files 2023-07..12 of ETH, SOL, XRP and DOGE.
- **D2 run (2026-10-27).** The 36 added daily files of SOL and XRP were fetched and verified; all are published.
- **Holdout guard.** No monthly file of 2025-10 or later and no daily file from 2025-10-17 was planned or requested (tested in `test/f1-reference.test.mjs`).

## Compare (tested, run at `2786b45`)

Exit 0 in 39 s. maxRSS 336 MiB at the guard's last sample and 343,948 KB by `/usr/bin/time` (ceiling 512 MiB, six symbols in one process; V2 memory acceptance met). In every interval, Number equality equals the equal count (`numberEqual`). Every planned file of 1h, 4h, 1d, 5m and 15m was verified.

Dispositions of complete bars (equal / mismatched / reference_quarantined / absent_row / absent_file):

| Symbol | 1h (deciding) | 4h (deciding) | 1d (reported, D5) |
| --- | --- | --- | --- |
| BTC | 35,025 / 15 / 0 / 0 / 0 | 8,747 / 13 / 0 / 0 / 0 | 1,448 / 12 / 0 / 0 / 0 |
| ETH | 35,027 / 13 / 0 / 0 / 0 | 8,747 / 13 / 0 / 0 / 0 | 1,448 / 12 / 0 / 0 / 0 |
| SOL | 35,028 / 12 / 0 / 0 / 0 | 8,748 / 12 / 0 / 0 / 0 | 1,448 / 12 / 0 / 0 / 0 |
| XRP | 35,028 / 11 / 0 / 0 / 0 | 8,749 / 10 / 0 / 0 / 0 | 1,448 / 11 / 0 / 0 / 0 |
| DOGE | 35,028 / 12 / 0 / 0 / 0 | 8,748 / 12 / 0 / 0 / 0 | 1,448 / 12 / 0 / 0 / 0 |
| HYPE | 3,349 / 0 / 0 / 0 / 0 | 837 / 0 / 0 / 0 / 0 | 139 / 0 / 0 / 0 / 0 |

Acceptance (D1 for 1h, D5 for 4h and 1d). Mismatched bars that hold an E1 hour / mismatched bars without one; every mismatched bar without one is a complete E2 bar, and every complete E2 bar without one mismatches:

| Symbol | 1h: mismatched = E1 hours with a complete bar | 4h | 1d |
| --- | --- | --- | --- |
| BTC | 15 = 15 | 12 / 1 | 11 / 1 |
| ETH | 13 = 13 | 12 / 1 | 11 / 1 |
| SOL | 12 = 12 | 11 / 1 | 10 / 2 |
| XRP | 11 = 11 (E1 lists 12; 2023-11-30T12:00 has an incomplete bar) | 9 / 1 | 9 / 2 |
| DOGE | 12 = 12 | 11 / 1 | 10 / 2 |
| HYPE | 0 = 0 | 0 / 0 | 0 / 0 |

The mismatched bars without an E1 hour are 4h 2022-07-16T04:00 and 1d 2022-07-16 for the five core symbols, and 1d 2023-08-16 for SOL, XRP and DOGE. D5 does not require an E2 bar that holds an E1 hour to mismatch: BTC has 13 4h bars that hold an E1 hour, and 12 of them mismatch. The equal one is 2023-11-10T12:00, which is also an E2 bar.

Other reported intervals (they never change the exit code):

- **C3 months.**
  - BTC 2022-06: 5m 3 and 15m 4 mismatches, each holding an E1 hour.
  - ETH 2023-03, DOGE 2024-05 and HYPE 2025-08: every bar equal.
  - SOL 2022-02: every bar equal, 8,064 5m and 2,688 15m, the three filled days included through their D2 daily files.
  - XRP 2023-11: one mismatch each in 5m and 15m, holding the E1 hour 2023-11-14T11:00, and the quarantined-minute bars reported as incomplete.
- **1w.** Mismatches: BTC 7, ETH, SOL, XRP and DOGE 5 each. All but one hold an E1 hour. The exception, for each core symbol, is the week 2022-07-11: it holds the E2 day 2022-07-16.

### 1w absent rows and unverified weeks (tested; corrects commit 8)

Commit 8 said the 13 absent 1w rows per core symbol were weeks that cross a month boundary. That is wrong. 2022-01-24, for example, lies inside January.

**True reason.** Each absent row is a week whose holding file is published and CHECKSUM-verified but has no row with that open time. The holding file is the monthly 1w file of the month in which the week opens (the compare's rule). No other planned 1w file has the row either. This was tested by reading every row of the 28 planned 1w files of each core symbol (throwaway script): no open time is in two files.

**Not a month-crossing rule.**

- Of BTC's 13 absent weeks, 4 cross a month boundary and 9 lie within one month.
- Of the 24 month-crossing weeks among the 120 weeks 2021-10-18..2024-01-29, BTC has rows for 20.
- The 2024-01 file holds only the row of 2024-01-01.
- Why Vision omits these rows is not visible in the files.

The compare lists at most 10 absent rows per interval, so the full list below comes from that script. It matches the compare's counts and its first 10 rows. Files are `<SYMBOL>USDT-1w-<month>.zip`, monthly.

| Symbol | Absent 1w rows: week open (file month) |
| --- | --- |
| BTC | 2021-11-29 (2021-11), 2022-01-24 (2022-01), 2022-03-28 (2022-03), 2022-05-23 (2022-05), 2022-09-05 (2022-09), 2023-02-20 (2023-02), 2023-04-10 (2023-04), 2023-06-26 (2023-06), 2023-09-04 (2023-09), 2024-01-08, 2024-01-15, 2024-01-22, 2024-01-29 (all 2024-01) |
| ETH, DOGE | 2021-11-29 (2021-11), 2022-01-24 (2022-01), 2022-03-28 (2022-03), 2022-05-23 (2022-05), 2022-09-05 (2022-09), 2023-02-20 (2023-02), 2023-04-10 (2023-04), 2023-05-29 (2023-05), 2023-06-26 (2023-06), 2024-01-08, 2024-01-15, 2024-01-22, 2024-01-29 (all 2024-01) |
| SOL, XRP | 2021-11-29 (2021-11), 2022-01-24 (2022-01), 2022-02-28 (2022-02), 2022-05-23 (2022-05), 2022-09-05 (2022-09), 2023-02-20 (2023-02), 2023-04-10 (2023-04), 2023-05-29 (2023-05), 2023-06-26 (2023-06), 2024-01-08, 2024-01-15, 2024-01-22, 2024-01-29 (all 2024-01) |

For ETH, SOL, XRP and DOGE, 2023-09-04 is not an absent row: its file 2023-09 is not published, so the week is absent_file.

**Each week counted once.** The compare's "unverified remainder" (the weeks after the last compared week, 2024-01-01) and its absent_row count overlap in the four weeks 2024-01-08..29. These are absent rows of the 2024-01 file and also part of the 92 unverified weeks. The partition below counts each complete week once.

| Symbol | Complete weeks | 2021-10-18..2024-01-01 | 2024-01-08..2025-10-06 | Not externally compared |
| --- | --- | --- | --- | --- |
| BTC | 208 | 116 = 107 compared (100 equal, 7 mismatched) + 9 absent_row | 92 = 4 absent_row (2024-01 file) + 88 absent_file (no 1w file planned after 2024-01) | 101 |
| ETH, SOL, DOGE | 208 | 116 = 81 compared (76 equal, 5 mismatched) + 9 absent_row + 26 absent_file (2023-07..12 not published) | 92 = 4 + 88, as BTC | 127 |
| XRP | 207 | 115 = 81 compared + 9 absent_row + 25 absent_file (the week 2023-11-27 is incomplete) | 92 = 4 + 88, as BTC | 126 |
| HYPE | 19 | none | 19 absent_file (no 1w reference) | 19 |

The weeks not externally compared are checked internally only: a test proves that a week equals its seven days on exact intermediates. They are never counted equal.

### History: why the compare failed at `cd23e4e` (tested then)

The commit 8 run (`e5efe41`, exit 1) failed on three groups of bars:

- The E1 hours, later defined by D1.
- The SOL and XRP filled days, later fixed by D2.
- The source-inconsistent 4h and 1d bars, later defined as E2 by D5.

The aggregator matched an independent raw 1m sum in every failing bar.

Commit 8 also said that the daily 1m and 1h files agree with the monthly files. That is narrower than it read. It was tested for three hours (BTC 2022-06-18T20:00, ETH 2023-11-14T11:00, XRP 2025-01-29T01:00). Amendment 2 (A) records that for BTCUSDT 2023-11-14 the daily and monthly 1m files differ in the rows 11:38-11:42. A full daily-versus-monthly comparison is ledger item I84.

## Digests (V5; for the PC and VPS comparison of C5)

The first 16 hex digits of each sha256 are below; the full digests are in the compare output. They are identical in the commit 8 run and in the run at `2786b45` (tested). 1h, 4h, 1d and 1w cover the research window (HYPE from 2025-05-01); 5m and 15m cover the C3 month.

| Symbol | 1h | 4h | 1d | 1w | 5m (C3) | 15m (C3) |
| --- | --- | --- | --- | --- | --- | --- |
| BTC | e59f445d29d7d9ba | 004ba75229f5fb43 | bdbc6b8351d7de99 | f08d966c00e7dbb5 | 8fdd5f897f4f7e0f | b88d3109b91c9b99 |
| ETH | 621da947fb4f36dc | 66b60c4355ac6700 | 0f4b6aaed498c19e | d05f04ad6d3b218f | 5d45a3255f3779ec | 80457331c440e82c |
| SOL | f1d0723342425083 | 3b2e3b0a67351364 | eb9b82e3446f52b4 | 808455d3af3fecc8 | 4a70034b0cf51f9d | 6593e5712373fc6f |
| XRP | 49626244a5dd978b | 2857175784f7becd | fb131ed4289ad5b9 | 8a12e09f26acbb73 | c4faccf22343cef2 | b69489e1c603eff8 |
| DOGE | 61a81e804055e677 | eaf28b33e2259167 | c6cd7b3fd1343e70 | 0ef288d250ac7288 | adf79cc9e1dde005 | 2797b15e1e7ecdb4 |
| HYPE | 2a0b87d5cf871386 | 0aafdfcd5ee09104 | 63c1bf0275d60cac | bf3e1b86ded765a0 | 97e398133d40b314 | edf6ea00509dc799 |

## Memory and time (tested)

- **Compare.** Six symbols in one process: maxRSS 336 MiB, 39 s at `2786b45`. The commit 8 run took 59 s at 328 MiB.
- **E1 and E2.** Six symbols in one process: maxRSS 356 MiB, 50 s.
- **Six timeframes over each whole research window.**
  - One symbol: maxRSS 278 to 293 MiB, 8 to 17 s per core symbol, about 1.3 s for HYPE.
  - Six symbols in one process: 508 MiB, close to the 512 MiB ceiling.
- **The F1a-2 reader alone.** Reading every month of five symbols takes it to 289 MiB.
- **Consequence (reasoning).** A consumer that needs 5m or 15m over the whole window for several symbols in one process should aggregate per process or use F1b storage (decision 1(a)).

## Deviations and corrections

1. **Zero compared bars.** Since commit 7 (`e5efe41`) the compare exits 1 when a 1h or 4h interval of a symbol has zero compared bars.
   - Review by Claude in chat (2026-10-28): this per-interval rule is not in V4. It is a stricter addition, and the e5efe41 TDD note ("zero compared bars fail under V4") attributes it to V4 wrongly.
   - Claude in chat on V4's own outcomes: an interval whose bars are all absent_file exits 3, and an interval with no complete bars exits 0.
   - V4 itself ends with "A deciding window with zero compared bars fails." The per-interval rule is stricter than reading that window as a symbol's 1h and 4h compare together.
   - The code is unchanged; changing the rule is Tomas's decision. In the run at `2786b45` every 1h and 4h interval has compared bars, so the rule decided nothing.
2. **Commit 4 trailer.** Commit 4 (`13b2c67`) ends with a paragraph beginning "Tests: docs-budget test 5 pass", which git parses as a trailer. The rule is that commits carry no trailers.
   - History is not rewritten: no amend after a push, no force-push.
   - Every later commit was checked with `%(trailers)` before its push. Commits 11 and 14 had the same problem and were amended before their first push.
   - No other commit on the branch carries a trailer (tested with `git log --format=%(trailers)`).
3. **Commit 12.** A 1d mismatch without an E1 hour fails the compare. This deviation was reported in commit 12 and is kept by D5, which makes 1d part of the acceptance.
4. **Commit 15.** Two expected messages of the existing D1 test changed ("... without an E1 hour" became "... without an E1 hour and not in E2"), because D5 replaces the 4h and 1d part of D1. The cases still exit 1.

## Hours (decision 44)

Estimate in the contract: about 19 h, range 15-25, from the first branch commit to merge.

Agent time since `80ff807` (tested, measured just before this commit): about 2.3 h of active session time. The method sums the gaps of 15 min or less between consecutive timestamped entries of the session transcripts on the PC. Allowing gaps up to 30 min, which takes in waits on downloads and runs, gives about 3.6 h.

Wall clock:

- 2026-10-27: 18:38 to 23:12 UTC.
- 2026-10-28: from 08:09 UTC.

The time for review by Claude in chat and Tomas is not included. The agent time is far below the estimate, and below its 15 h lower bound.

## Open items

- **PR.** Not opened. D3 says the PR is opened after the fix commits, and the session prompt says no PR in this session. Tomas decides when.
- **Ledger items filed by Claude in chat.**
  - I84: the daily-versus-monthly comparison.
  - The treatment of E1 and E2 bars before F1b uses volume, count or taker columns.
  - C4, C5, the V6 F1d as-of rule, and the runtime consumer inventory.
