# F1a-3 aggregation: implementation report

Branch `f1/a3-aggregation`, written 2026-10-27 by Claude Code on the PC. Contract `docs/f1/f1a-3-contract.md` (binding), plan `docs/f1/f1a-3-plan.md`. Every claim is labelled **tested** (how, how many), **taken over** (from where) or **reasoning**. Paths are relative to `experiments/strategy-destruction-filter` unless they start with `docs/`.

## Result

**Acceptance is not met: the full compare exits 1.** The aggregator is exact: in every bar where the compare fails, an independent sum of the raw 1m CSV tokens equals the aggregate, so the failures come from the reference data (tested, below). In the deciding intervals 1h and 4h:

- HYPE passes (every complete 1h and 4h bar equal in all nine columns).
- BTC, ETH, SOL, XRP and DOGE have 10 to 15 mismatched bars per interval. They fall on the same hours for every symbol (for example 2022-06-18T20:00, 2023-11-14T11:00, 2025-01-29T01:00). In these hours Binance Vision's own 1m series and 1h series disagree.
- SOL and XRP have absent rows on the five days that F1a-2 filled from daily 1m files (2022-02-26..28 and 2022-04-01..02): the monthly 1h, 4h and 1d reference files lack those days, as the monthly 1m files did.

Under V4 each class fails, and an exception needs a new decision. Nothing was changed to make the compare pass. Open decisions are listed at the end.

## What was built

| Commit | Content |
| --- | --- |
| 2, 3 | Interval-aware Vision paths and parser; the verified transport moved to `src/vision-transport.mjs` (pure moves, checked by Claude in chat) |
| 4 | Glossary rows in `docs/ubiquitous-language.md` |
| 5 `818063c` | `src/f1-aggregate.mjs`: `aggregateResearch({ reader, instrument, timeframes, dataStart, dataEnd, check })`; reads one calendar month at a time; exact decimals; P1 strict omit; V5 digest |
| 6 `1410dc3` | `src/f1-reference.mjs download`: the reference plan with its holdout guard, downloaded through the verified transport |
| 7 `8ba1bdd`, `e5efe41` | Export of three existing helpers (no behaviour change); `src/f1-reference.mjs compare` with V1, V3 and V4 |

Tests: 240 of 240 pass (`node --test --test-reporter=tap`, Node v24.10.0), 204 at the branch base.

## Commands, versions, inputs (V7)

- Node v24.10.0 (PC). Compare run at git revision `e5efe4139fa4c345918239a7405f4e94bea37dd0` (clean tree, recorded by the compare itself).
- `node src/f1-reference.mjs download` then `node src/f1-reference.mjs compare`, both with the default symbols BTC, ETH, SOL, XRP, DOGE and HYPE.
- 1m input: `results/manifest-f1-1m.json` sha256 `ab28161a599c91fbb8e1e026b2a9fc366ebd742340d9a28bbb552330f355b0ed`, unchanged since F1a-2. Research units read: 49 per core symbol and 6 for HYPE.
- Module hashes (sha256): `src/f1-aggregate.mjs` `dbbf651518c6bcf3337d004db0d4d624b07717ac115c3e6f8f24ba21bbe3430e` (also recorded by the compare), `src/f1-reference.mjs` `1ec75be2384eea563e49653eab67d0833daa41e080afc04a604b0b2a60f351c0`, `src/vision-source.mjs` `801da2419ff5d2ddccaac98abb73eea25e4bbd592f73ccafb5c1ebc24b562131`, `src/f1-1m-reader.mjs` `a3dc81432bfdfb1d328910b3a48f442c87263ab5b218983bfe3ea646a869d308`.
- Reference input: 1,175 planned files. Hash `c02548b9603aac295c92f751f77e6e5dc13db1bfbcafc5268ed064456cf24177` is the sha256 of one line per planned file in plan order, joined by newlines with a final newline. Each line is `<Vision path> <sha256 of its one local version>`, or `<Vision path> 404` for a not-published file (tested, throwaway script; method as stated).

## Precision survey (V7, rerun 2026-10-27)

Method (tested, throwaway script outside the repo; the rule it checks is used by `src/f1-aggregate.mjs`):

- Scope: every source zip of every research entry of the 1m manifest (251 entries; 263 files, daily fill files included). Each row is filtered to its unit bounds by open time before any value token is read.
- Tokens checked: the eight decimal columns open, high, low, close, volume, quote_volume, taker_buy_volume and taker_buy_quote_volume.
- Significant digits of a token: its digits without sign or dot, with leading zeros stripped.
- Round trip: `String(Number(token))` must equal the token in canonical form (exponent form expanded, trailing fractional zeros and a trailing dot removed, leading zeros removed).

Result: 10,715,220 rows (the 1m rows, plus the overlap of daily fill files with their monthly files). Tokens with more than 15 significant digits: 0. The maximum is 15 for BTC, ETH, SOL, DOGE and HYPE and 14 for XRP. Round-trip failures: 0. This matches plan section a. So recovering each 1m decimal with `String(x)` is exact on the whole research store. The aggregator still fails closed on exponent form, more than 15 significant digits, a negative value or a coefficient of 2^53 or more.

## Aggregates (tested, compare run and a six-timeframe run)

Complete and incomplete bars equal plan section c in every cell (complete / incomplete):

| Symbol | 5m | 15m | 1h | 4h | 1d | 1w |
| --- | --- | --- | --- | --- | --- | --- |
| BTC, ETH, SOL, DOGE | 420,480 / 0 | 140,160 / 0 | 35,040 / 0 | 8,760 / 0 | 1,460 / 0 | 208 / 1 |
| XRP | 420,479 / 1 | 140,159 / 1 | 35,039 / 1 | 8,759 / 1 | 1,459 / 1 | 207 / 2 |
| HYPE (from 2025-05-01) | 40,194 / 0 | 13,398 / 0 | 3,349 / 1 | 837 / 1 | 139 / 1 | 19 / 2 |

- XRP: one `missing_minutes` bar per timeframe around the quarantined minute 2023-11-30T12:35Z.
- HYPE: partial bars 1h 10:00 (30 of 60), 4h 08:00 (90 of 240), 1d 2025-05-30 (810 of 1440) and 1w 2025-05-26 (3690 of 10080). Empty ranges start 2025-05-01; the 5m range holds 8,478 slots.
- Every symbol: the week of 2025-10-13 is `window_edge` with 5,760 of 10,080 minutes.

The full-window digests of 1h, 4h, 1d and 1w are the same in the compare run (four timeframes) and in a separate six-timeframe run. A first all-BigInt version of the aggregator gave the same six BTC digests as the final version.

## Reference download (tested)

Exit 0 in 32 min; maxRSS 104 MiB. Of 1,175 planned files, 1,151 were downloaded and verified against their CHECKSUM, 0 failed and 0 CHECKSUMs were repaired. 24 files are not published (404 on the zip and its CHECKSUM): the monthly 1w files 2023-07..12 of ETH, SOL, XRP and DOGE. No monthly file of 2025-10 or later and no daily file from 2025-10-17 was planned or requested (holdout guard tested in `test/f1-reference.test.mjs`).

## Compare (tested)

Exit 1 in 59 s. maxRSS 328 MiB at the guard's last sample and 335,920 KB by `/usr/bin/time` (ceiling 512 MiB, six symbols in one process including all result arrays; V2 memory acceptance met). In every row below, Number equality equals the equal count (`numberEqual`), so no difference is a rounding effect.

Deciding intervals (dispositions of complete bars: equal / mismatched / reference_quarantined / absent_row / absent_file):

| Symbol | 1h | 4h |
| --- | --- | --- |
| BTC | 35,025 / 15 / 0 / 0 / 0 | 8,747 / 13 / 0 / 0 / 0 |
| ETH | 35,027 / 13 / 0 / 0 / 0 | 8,747 / 13 / 0 / 0 / 0 |
| SOL | 34,908 / 12 / 0 / 120 / 0 | 8,718 / 12 / 0 / 30 / 0 |
| XRP | 34,908 / 11 / 0 / 120 / 0 | 8,719 / 10 / 0 / 30 / 0 |
| DOGE | 35,028 / 12 / 0 / 0 / 0 | 8,748 / 12 / 0 / 0 / 0 |
| HYPE | 3,349 / 0 / 0 / 0 / 0 | 837 / 0 / 0 / 0 / 0 |

Reported intervals. These never change the exit code:

- **1d.** Mismatches: 12 for every core symbol except XRP (11), 0 for HYPE. Absent rows: 5 each for SOL and XRP (the filled days).
- **1w.** Mismatches: BTC 7, ETH, SOL, XRP and DOGE 5 each. Each mismatch is a week that contains a mismatched hour.
- **1w absent rows.** 13 per core symbol: weeks that cross a month boundary (for example 2021-11-29 and 2022-01-24). These weeks are in no monthly 1w file.
- **C3 months.** BTC 2022-06: 5m 3 and 15m 4 mismatches. ETH 2023-03, DOGE 2024-05 and HYPE 2025-08: every bar equal. SOL 2022-02: 7,200 equal 5m bars and 864 absent rows (the three filled days). XRP 2023-11: one mismatch each in 5m and 15m, and the quarantined-minute bars reported as incomplete.

Weekly evidence (approval 5(a)):

| Symbol | Equal weeks | Last externally compared week | Unverified remainder |
| --- | --- | --- | --- |
| BTC | 100 | 2024-01-01 | 92 weeks, 2024-01-08..2025-10-06 |
| ETH, SOL, DOGE | 76 | 2024-01-01 | 92 weeks, 2024-01-08..2025-10-06 |
| XRP | 76 | 2024-01-01 | 92 weeks, 2024-01-08..2025-10-06 |
| HYPE | none | none | all 19 complete weeks (no 1w reference) |

The unverified remainder and the weeks of the not-published months (ETH, SOL, XRP and DOGE 2023-07..12) are checked internally only: a test proves that a week equals its seven days on exact intermediates. They are never counted equal.

### Why the compare fails (tested)

- **Independent check of every research hour.** For every research hour of the monthly files, a throwaway script summed the raw 1m CSV tokens with BigInt, without `src/f1-aggregate.mjs`, and compared all nine columns with the 1h CSV token. It finds exactly the compare's mismatch counts: BTC 15, ETH 13, SOL 12, DOGE 12 and HYPE 0. For XRP it finds 12; the twelfth is 2023-11-30T12:00, which holds the quarantined minute, so the aggregate does not compare it (11 in the compare).
- **The aggregator matches the raw sums.** In each mismatched bar listed by the compare, the raw 1m sum equals the aggregate's exact value; the bar has 60 of 60 minutes.
- **Size and direction.** Mostly the 1m sums of volume, quote volume, count and both taker volumes are smaller than the 1h token, by a relative 1e-5 to 0.18. In a few hours open, high, low or close differ instead (for example 2024-10-28T21:00).
- **Daily files agree with monthly files.** For three of these hours (BTC 2022-06-18T20:00, ETH 2023-11-14T11:00, XRP 2025-01-29T01:00), the daily 1m and 1h files of the day were fetched (CHECKSUM verified, kept in memory only). The daily 1m rows are identical to the monthly 1m rows (60 of 60), and daily and monthly 1h agree with each other. The 1m series still disagrees with the 1h series. So Vision publishes 1m and 1h klines that are not consistent with each other in these hours; neither file is stale.
- **Absent rows on the filled days.** They are the F1a-2 filled days exactly (manifest `filledRanges` of SOL and XRP). The monthly 1h, 4h, 1d, 5m and 15m files lack them as the monthly 1m files did. The reference plan has no daily fill files.

## Digests (V5; for the PC and VPS comparison of C5)

The first 16 hex digits of each sha256 are below; the full digests are in the compare output. 1h, 4h, 1d and 1w cover the research window (HYPE from 2025-05-01); 5m and 15m cover the C3 month.

| Symbol | 1h | 4h | 1d | 1w | 5m (C3) | 15m (C3) |
| --- | --- | --- | --- | --- | --- | --- |
| BTC | e59f445d29d7d9ba | 004ba75229f5fb43 | bdbc6b8351d7de99 | f08d966c00e7dbb5 | 8fdd5f897f4f7e0f | b88d3109b91c9b99 |
| ETH | 621da947fb4f36dc | 66b60c4355ac6700 | 0f4b6aaed498c19e | d05f04ad6d3b218f | 5d45a3255f3779ec | 80457331c440e82c |
| SOL | f1d0723342425083 | 3b2e3b0a67351364 | eb9b82e3446f52b4 | 808455d3af3fecc8 | 4a70034b0cf51f9d | 6593e5712373fc6f |
| XRP | 49626244a5dd978b | 2857175784f7becd | fb131ed4289ad5b9 | 8a12e09f26acbb73 | c4faccf22343cef2 | b69489e1c603eff8 |
| DOGE | 61a81e804055e677 | eaf28b33e2259167 | c6cd7b3fd1343e70 | 0ef288d250ac7288 | adf79cc9e1dde005 | 2797b15e1e7ecdb4 |
| HYPE | 2a0b87d5cf871386 | 0aafdfcd5ee09104 | 63c1bf0275d60cac | bf3e1b86ded765a0 | 97e398133d40b314 | edf6ea00509dc799 |

## Memory and time (tested)

- **Compare.** Six symbols in one process: maxRSS 328 MiB, 59 s.
- **Six timeframes over each whole research window.** One symbol: maxRSS 278 to 293 MiB, 8 to 17 s per core symbol, about 1.3 s for HYPE. Six symbols in one process: 508 MiB, close to the 512 MiB ceiling.
- **The F1a-2 reader alone.** Reading every month of five symbols takes it to 289 MiB.
- **Consequence (reasoning).** A consumer that needs 5m or 15m over the whole window for several symbols in one process should aggregate per process or use F1b storage (decision 1(a)).

## Open decisions for Tomas (with Claude in chat)

1. **Vision 1m against 1h inconsistency** (17 distinct hours from 2022-05-28 to 2025-01-29, 12 of them shared by four or five symbols; the independent check lists them). Options:
   - (a) Accept the 1m series as the source of truth and list these hours as approved exceptions, by open time, with a new decision as V4 requires.
   - (b) Treat the hours as data defects of the 1m store, for example flag their 1m minutes or their aggregate bars. This needs a rule for which minutes are wrong, which the archive does not say.
   - (c) Look at a third source (REST klines or aggTrades) for these hours only, reported and never deciding.

   Recommendation (reasoning): (a) plus a ledger item for (c). The aggregate equals its 1m source exactly, the inconsistency is Binance's, and F1b uses 1m-derived bars throughout.
2. **The filled days of SOL and XRP.** Options:
   - (a) Extend the reference plan with daily 1h, 4h, 1d, 5m and 15m files for days where a monthly reference file lacks rows, as F1a-2 does for 1m (a plan change).
   - (b) Approve the five days as exceptions.

   Recommendation (reasoning): (a), because it keeps the comparison external.
3. **Branch status.** The code is complete and the tests pass, but the acceptance gate is not met. Opening the PR now, with this report as the case for a decision, or after the decision is Tomas's call.
