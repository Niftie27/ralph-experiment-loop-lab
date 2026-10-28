# F1a-3 plan: aggregation 1m to 5m, 15m, 1h, 4h, 1d, 1w

Plan only (no code). Branch `f1/a3-aggregation` from main `5e6b490`, written 2026-10-27. Every claim is labelled **tested** (how, how many), **taken over** (from where) or **reasoning**. Paths are relative to `experiments/strategy-destruction-filter` unless they start with `docs/`. Throwaway checks ran outside the repo with the repo code imported read-only; their scripts are not committed.

Precheck (tested): `node src/vision-1m.mjs verify --symbols BTC,ETH,SOL,XRP,DOGE,HYPE --from 2021-10 --to 2026-10` on the PC store: exit 0, status ok, zips 425, entries 329, orphans 0, sources 425, failures none; coverage per symbol equal to `docs/f1/f1a-2-vision-1m.md` (BTC, ETH, SOL, DOGE 2,628,000 bars and 0 missing minutes; XRP 2,627,999 and 1; HYPE 726,570 and 42,390); maxRSS 143 MiB, 21 s. `results/manifest-f1-1m.json` sha256 `ab28161a599c91fbb8e1e026b2a9fc366ebd742340d9a28bbb552330f355b0ed`, as in `docs/f1/f1a-2-vision-1m.md`. The F1a-2 store exists and passes, so no rebuild step is needed. Test suite on the branch base: 204 of 204 pass (`node --test --test-reporter=tap`).

## a. Scope and exact rules

Scope: one aggregator that turns research 1m candles into 5m, 15m, 1h, 4h, 1d and 1w bars, and a check against Binance Vision USD-M kline files. Holdout and later data are out of scope (section d).

Samples (tested): seven BTCUSDT reference zips downloaded to a scratch folder outside the repo, each CHECKSUM verified (sha256 equal): monthly 1h, 4h, 1d and 1w of 2024-01, monthly 1w of 2021-10, daily 1h of 2025-10-16, daily 1w of 2023-06-12. All are research period.

| Rule | Status |
| --- | --- |
| A bar is labelled by its open time (Vision's open_time, ms UTC); it covers [open, open + interval); close_time = open + interval - 1 ms | tested: 991 rows of the 7 samples, all aligned, all close_time rules hold, all consecutive pairs contiguous |
| 5m, 15m, 1h, 4h open on multiples of the interval since 1970-01-01T00:00Z; 1d opens at 00:00 UTC | tested for 1h (768 rows), 4h (186), 1d (31); 5m and 15m by reasoning (same epoch grid; not compared) |
| 1w opens Monday 00:00 UTC and closes Sunday 23:59:59.999 (open_time - 4 days is a multiple of 7 days) | tested: 6 weekly rows in 3 files (2021-10-04, -11, -18, -25, 2023-06-12, 2024-01-01); the names of all 178 BTCUSDT daily 1w files are Mondays (one listing) |
| open = first minute's open; high = max; low = min; close = last minute's close | tested: 0 mismatches on 966 bars (below) |
| volume, quote_volume, count, taker_buy_volume, taker_buy_quote_volume = sums over the bar's minutes | tested: 0 mismatches on 966 bars |
| close_time is checked structurally, ignore is dropped (as the 1m parser does) | taken over: `src/vision-source.mjs:76`, contract F4 |

Sums are compared **exactly as decimals**, not with a tolerance. Evidence (tested):

- BTCUSDT 2024-01: the exact decimal sums of the 1m CSV tokens (scaled BigInt) equal the reference tokens in all 9 value columns on 744 1h, 186 4h, 31 1d and 1 1w bars; BTCUSDT 2021-10: 4 of 4 weeks. 0 mismatches in 966 bars.
- The same bars from the float64 snapshot columns (through `openResearch1m`): open, high, low, close and count are exactly equal; naive float64 sums differ from `Number(token)` in 69-100 % of the bars per column and interval (max relative error 3.9e-15); a Neumaier sum still differs in about 5 % of 1h bars. Daily 1h 2025-10-16 (24 bars): same pattern.
- All research 1m tokens in the store (10,715,220 rows from 263 source files, 8 decimal columns, 6 symbols, filtered to research unit bounds before any value is read): 0 tokens with more than 15 significant digits (max is exactly 15, quote volumes), and `String(Number(token))` gives back the token's decimal in 100 %. So the float64 the snapshot holds identifies its decimal exactly.

Rule: the aggregator recovers each 1m sum value's decimal with `String(x)` (ECMAScript shortest round trip), adds scaled integers (BigInt), and returns `Number(decimal string)` for the bar; the compare parses the reference token with the same parser as the 1m loader. Equality is then exact float64 equality, which here is also exact decimal equality. The aggregator fails closed when `String(x)` uses exponent form or has more than 15 significant digits (reasoning: the guarantee holds only up to 15 digits; residual risk, a 16-digit original whose double prints with 15 digits, cannot be seen from the snapshot; the 1h/4h compare would catch it there). Exact sums are also independent of summation order, so 1m to 4h and 1m to 1h to 4h give identical bits (reasoning; a TDD test).

Cost (tested, throwaway streaming version, one process per symbol, six timeframes in one pass over the research window): BTC 11.3 s, ETH 10.4 s, SOL 9.8 s, XRP 12.4 s, DOGE 9.6 s (2,102,400 rows each; XRP 2,102,399), HYPE 1.4 s (200,970 rows); maxRSS 335-350 MiB, HYPE 137 MiB. A first version that kept every bar as an object reached 615 MiB, over the 512 MiB ceiling: the module must stream (section e).

## b. Spec clarification (ledger I75 c)

Proposed wording for the spec's Aggregation row: "Acceptance: every research bar the aggregator emits as complete, at 1h and 4h, is equal in open, high, low, close, volume, quote_volume, count, taker_buy_volume and taker_buy_quote_volume to the same bar in Binance Vision USD-M 1h and 4h kline files (the same archive as the 1m source, CHECKSUM verified). Reported per symbol and interval: reference rows, compared bars, equal, mismatched, and skipped bars by reason. Differences against REST /fapi/v1/klines, if ever looked at, are counted separately and never decide acceptance."

OHLCV is required by the spec. Proposal: compare all nine value columns (open question 3), because the same exact rule holds for them (tested, 966 bars) and quote_volume and taker_buy volumes feed the delta proxy (spec Data plan). REST is not used in F1a-3.

## c. Incomplete-aggregate policy (I75 c)

A bar is complete when every minute of it has an accepted 1m candle and it lies wholly inside the requested window, which lies inside the research window. Minutes are never filled or interpolated, and no holdout minute is read to complete a research bar.

All incomplete research bars, found by aggregating the whole research window of all six symbols (tested; counts as complete / incomplete):

| Symbol | 5m | 15m | 1h | 4h | 1d | 1w |
| --- | --- | --- | --- | --- | --- | --- |
| BTC, ETH, SOL, DOGE | 420,480 / 0 | 140,160 / 0 | 35,040 / 0 | 8,760 / 0 | 1,460 / 0 | 208 / 1 |
| XRP | 420,479 / 1 | 140,159 / 1 | 35,039 / 1 | 8,759 / 1 | 1,459 / 1 | 207 / 2 |
| HYPE (window from 2025-05-01) | 40,194 / 0 | 13,398 / 0 | 3,349 / 1 | 837 / 1 | 139 / 1 | 19 / 2 |

- XRP: the quarantined minute 2023-11-30T12:35Z makes one bar incomplete in every timeframe (by reasoning the 5m 12:35, 15m 12:30, 1h 12:00, 4h 12:00, 1d 2023-11-30 and 1w 2023-11-27 bars; the counts are tested).
- HYPE: 42,390 empty minutes before the first candle 2025-05-30T10:30Z give empty slots (8,478 5m slots, tested) and one partial bar in 1h, 4h, 1d and 1w (10:00 holds 30 of 60 minutes, tested); 5m and 15m start complete at 10:30 because 10:30 is on their grid. `openResearch1m` refuses windows that start before HYPE's first unit (not_listed months have no entry; taken over from `src/f1-1m-reader.mjs:82`), so HYPE requests start at 2025-05-01.
- Research end 2025-10-17T00:00Z (a Friday) is on every grid except 1w: the week opening 2025-10-13 holds 5,760 of 10,080 research minutes (tested) and is incomplete for every symbol. Research start 2021-10-18 is a Monday, so no leading partial week (tested: 208 complete weeks).
- No other incomplete bar exists in the research window (tested). The daily-filled SOL and XRP ranges are complete minutes and give complete bars.

Options:

| Option | Aggregator output | Effect on research-queue and engine |
| --- | --- | --- |
| P1 strict omit (recommended) | Only complete bars are candles. Incomplete bars and empty ranges are listed as integrity metadata: open time, minutes present, minutes expected, reason `missing_minutes` or `window_edge`; never values | No code change in F1a-3. When F1b feeds futures bars to `inputIssues` (`src/research-queue.mjs:26` demands one candle per step), XRP 1h and 4h over the full research window fail "incomplete research OHLCV coverage" (1 of 35,040 and 1 of 8,760 bars), HYPE fails as before (insufficient_history). The engine is untouched |
| P2 omit plus gap-aware consumers | As P1 | `inputIssues` accepts a series whose only gaps are the listed incomplete bars; the engine handles a gap (no signal whose lookback spans it, indicator warm-up restarts, positions across it). Engine change is critical code and belongs with the F1b accounting contract (I75 a) |
| P3 partial bars with a flag | Partial bars from the minutes present, flagged | Rejected: a partial bar differs from Binance's bar (Binance's XRP 12:00 bar includes the quarantined minute) and a consumer that ignores the flag uses it silently |

Recommendation: P1 in F1a-3; whether XRP needs P2 is an F1b decision (open question 2). Tests: section j.

## d. Holdout

- No holdout value is aggregated or compared in F1a-3 (A6 seal; `docs/f1/f1a-2-contract.md` amendment round 4). The only 1m read path is `openResearch1m`, which refuses any window outside 2021-10-18..2025-10-17 (taken over, `src/f1-1m-reader.mjs:28`).
- The 1w bar opening 2025-10-13 stays incomplete on the research side; the aggregator never asks for minutes from 2025-10-17 on.
- Reference files: no file containing a bar that opens on or after 2025-10-17 is downloaded, parsed or compared: no monthly 2025-10 or later, daily files only 2025-10-01..16 (reasoning; the monthly 2025-10 file holds holdout bars).
- Integrity metadata only, if anything about the holdout is reported: availability of files (the listing in section h saw daily 1h, 4h and 1d files for 2025-10-01..31 and none for 1w).
- Anything more (holdout aggregates for F1c, holdout reference files as sealed storage) is open question 7, not a design choice.

## e. Storage and memory

| Option | For | Against |
| --- | --- | --- |
| E1 compute on read (recommended) | No new manifest, format kind or provenance source; aggregates are a pure function of verified 1m snapshots and the aggregator code; smallest review surface (F1a-2 needed 8 rounds, mostly manifest edge cases: `docs/findings.md` F11) | 10-12 s per core symbol for six timeframes (tested above); a consumer that aggregates in every backtest child process cannot afford that |
| E2 stored aggregate snapshots with manifest entries | Consumers pay nothing; reuses the F1a-2 verify and compare pattern | A second append-only manifest, format kind and verify/compare path before any consumer exists; about 48 MB per symbol (reasoning: 606,109 research bar slots x 10 columns x 8 bytes) |

Recommendation E1 now. Storage for consumers (E2, or a run-scoped cache computed once per queue run) is decided in F1b, when the H3a futures rerun shows the access pattern (open question 1).

Data identity and provenance (E1): every result carries the instrument (exchange, market, contract), timeframe, window, the input units `{sha256, dataStart, dataEnd}` returned by `openResearch1m`, the sha256 of the aggregator module, and a sha256 digest of the output columns and incomplete list. No manifest entry is written. If E2 is chosen later, each entry records exchange, market type and contract and a new provenance source (for example `f1-1m-aggregate`) listing its input snapshot hashes (AGENTS.md, Data identity).

Memory: the built-in 512 MiB whole-job ceiling of A8 applies, enforced by the existing guard pattern (`memoryGuard` in `src/vision-1m.mjs`: periodic RSS checks, abort above the ceiling, maxRSS in the report). The module streams month by month through `openResearch1m` (capacity 1), keeps one open bar per timeframe and writes complete bars into preallocated typed arrays; it never holds a whole 1m window. Measured on the full compare run: maxRSS per step and RSS flat across the six symbols in one process; acceptance at or under 512 MiB.

## f. Integration scope and modules

F1a-3 changes neither `src/research-queue.mjs`, nor `src/engine.mjs`, nor `src/h2-contract.mjs`. Later: the futures feed into the queue with an adapter to the engine's candle shape (`time` in seconds) and the gap policy (F1b, H3a rerun on futures 4h); BTC daily and weekly context from 1d and 1w (F1d; a week counts only after it closes, which P1 already gives).

Modules (names provisional, glossary terms in a docs commit):

- `src/f1-aggregate.mjs`: `aggregateResearch({ reader, instrument, timeframes, dataStart, dataEnd, check })` returns, per timeframe, frozen columns of complete bars (`open_time`, the nine value columns), the incomplete and empty lists, the input units and the digest. `reader` is an `openResearch1m` instance, the only data path. `barOpen(timeframe, t)` is the one grid function.
- `src/vision-source.mjs`: Vision paths and `parseKlines` take the interval (today `1m` is hard-coded at :204-205, the minute checks at :123 and :141-142); 1w alignment uses the Monday offset.
- `src/vision-transport.mjs`: the verified transport moved out of `src/vision-1m.mjs` (:74-144, not exported today), shared by the 1m download and the reference download (I75 F11).
- `src/f1-reference.mjs`: CLI `download` and `compare` for reference files, exit codes as decision 22.

## g. Prior art (decision 37)

Status as in `docs/research/sources.md`: F = fetched and read by Claude Code in this session (2026-10-27), R = in the repo, N = named only, not verified.

| Source | Use | Reason | Status |
| --- | --- | --- | --- |
| binance/binance-public-data README | reference only | Lists intervals 1s..1mo, the 12 kline columns, `.CHECKSUM` per zip and `sha256sum -c`; daily files appear the next day, monthly ones on the first Monday; futures timestamps in ms. It has download scripts only, no aggregation and no compare; our transport is already verified (F1a-2) | R, F |
| pandas `DataFrame.resample` (docs) | reference only | Python, not in the Node path. Documented defaults are traps for this job: origin `start_day`, and `W` defaults to closed right and label right, so weekly bins are labelled by their right edge, unlike Binance's open-time label | F |
| NautilusTrader bar aggregation (docs, concepts/data) | reference only, for the D6 parity test | Builds bars from bars (`@` composite types). Defaults differ from our policy: `time_bars_timestamp_on_close` true (stamp at close), `time_bars_build_with_no_updates` true (emits bars without data), `time_bars_skip_first_non_full_bar` false (emits a partial first bar) | R, F |
| Freqtrade `merge_informative_pair` (docs) | reference only, for F1d | Merges higher-timeframe candles shifted by one candle because dates are open dates, with ffill; warns that `.resample('1h')` labels by the left edge. Not an aggregator for this phase | R (wiki), F |
| npm `ohlc-resample` 2.2.0 (README; found by one npm registry search "ohlc resample", 10 results, 1 relevant) | rejected | OHLCV only (no quote volume, count, taker columns), float only, bucket alignment and partial buckets undocumented, needs Node 26 or newer (PC v24.10.0 tested; VPS v24.22.0 taken over from I78), LGPL-3.0; no installs | F |
| ccxt, python-binance | rejected | REST clients; acceptance uses Vision files (I75 c) | N, not verified |
| QuantConnect LEAN consolidators, DuckDB `time_bucket` | rejected | Other stacks or an install; nothing a 150-line module needs | N, not verified |

No tool was found that checks klines against Vision files (searched: the binance-public-data README and the npm search above; PyPI not searched).

## h. Reference files

Listing (tested, read-only S3 listings of the Vision bucket on 2026-10-27; one request per kind, symbol and interval directory = 48, daily narrowed to 2025-10 so each fits one page; plus one test request before and four follow-ups, 53 in all):

- Monthly 1h, 4h and 1d with a CHECKSUM for every zip, all six symbols, up to 2026-09: BTC, ETH, XRP from 2020-01, SOL 2020-09, DOGE 2020-07, HYPE 2025-05.
- Daily 1h, 4h and 1d for 2025-10-01..31 with CHECKSUMs, all six symbols.
- 1w is not published for the whole research window: monthly 1w ends at 2024-01 (BTC 49 files 2020-01..2024-01; ETH and XRP 43, SOL 35, DOGE 37, HYPE 0; ETH lacks 2023-07..12, the gaps of the others not listed), and the 2024-01 file holds one week (2024-01-01). Daily 1w exists only for BTC 2020-01-06..2023-06-12 (178 files, 2 gaps) and not at all for 2025-10. So 1w equality can be checked only from 2021-10-18 to the last published week per symbol (open question 5).

Files to download (reasoning): per symbol and interval 1h, 4h, 1d, the monthly files 2021-10..2025-09 and the daily files 2025-10-01..16 (HYPE monthly from 2025-05); 1w monthly 2021-10..2024-01 where published. About 1,160 files, about 2,330 GETs. Disk about 15 MB (reasoning: BTC samples are 38,890 B per monthly 1h, 10,664 B 4h, 2,139 B 1d, at most 458 B 1w, 1,594 B daily 1h).

Transport: the same verified path as the 1m files after the refactor in section f (HTTPS to data.binance.vision only, CHECKSUM first, sha256 version directories, 404 markers, finite retries). Location: `data/vision/data/futures/um/{monthly,daily}/klines/<contract>/<interval>/<sha256>/` (gitignored: `git check-ignore -v` matches `.gitignore:14 experiments/**/data/`, tested). A reference file with more than one local version fails its comparison (approval point 3, ledger I77 (1)). A 404 on both files is "not published": for 1h and 4h it makes the compare incomplete (exit 3); for 1d and 1w it is reported only.

## i. Compare

- Units: per symbol and interval, every reference row inside the research window. Compared when the aggregator has the bar complete. Intervals: 1h and 4h decide acceptance; 1d and 1w are reported (open question 4).
- Counts per symbol and interval: reference files (verified, not published), reference rows, rows outside the research window, compared, equal, mismatched, skipped by reason (`aggregate_incomplete`, `reference_quarantined`), complete aggregate bars without a reference row.
- Expected counts (reasoning from section c): 1h compared 35,040 per core symbol (XRP 35,039, HYPE 3,349), 4h 8,760 (XRP 8,759, HYPE 837).
- A mismatch, or a complete aggregate bar missing from a present 1h or 4h reference file, fails (exit 1) and lists the first 10 open times per symbol and interval with the column names, no values. The reference rows are parsed with the interval-aware parser: structural errors fail the file; a value-rule row is quarantined and skipped.
- VPS reproduction like I78: not needed under E1 (reasoning: no stored artifact whose hash must match; the 1m inputs were reproduced on the VPS in I78; the result is deterministic because the decimal rule is fully specified by ECMAScript). If Tomas wants one (open question 6), it reruns the reference download and compare on the VPS and checks equal counts and equal output digests per symbol and timeframe.

## j. Tests (TDD, fixtures of a few days, no real data in tests)

- Grid: 5m, 15m, 1h, 4h, 1d on the epoch grid; 1w on Mondays, including weeks across a month and a year end (2021-12-27) and 2024-01-01; a window that starts off the grid lists its first bar as `window_edge`.
- Columns: open first, high max, low min, close last, count sum; each of the four volume sums exact where naive float differs (sixty 0.1 values give 6, not 5.999999999999998); 4h from 1m equals the sum of its four 1h bars bit for bit; exponent form or more than 15 significant digits fails closed.
- Missing minute: one missing minute omits its bar in all six timeframes and lists it (open time, 59 of 60, reason), neighbours unchanged, nothing filled.
- Leading gap: HYPE-like fixture gives empty ranges and partial first 1h, 4h, 1d, 1w bars; 5m starts complete at the first candle.
- Boundary week: a window ending 2025-10-17T00:00Z lists the 2025-10-13 week as `window_edge` with 5,760 of 10,080 minutes; a spy reader fails on any request past 2025-10-17.
- Holdout poison: a manifest fixture whose holdout snapshots are poison files; aggregation and compare of research windows never read them; a request reaching into the holdout fails before any read; the reference planner never plans a monthly 2025-10 or later file or a daily from 2025-10-17.
- Reference parser: interval alignment (1w Monday offset), close_time = open + interval - 1, row cap per file, header and no-header files (both seen in the samples), quarantined reference rows skipped and reported.
- Compare: equal fixtures exit 0 with counts; one changed reference value exits 1 with open time and column; a missing reference row exits 1; a not-published 1h file exits 3; two local versions exit 1.
- Memory: ceiling abort through the injected check seam; RSS flat across successive symbols.
- Refactor commits: the 204 existing tests unchanged and green after each.

## k. Commits and review

After Tomas approves this plan: (1) `docs/f1/f1a-3-contract.md` with the approval verbatim (decision 24); (2) refactor: interval-aware Vision paths and parser, no behaviour change; (3) refactor: shared transport module, no behaviour change; (4) glossary rows (docs); (5) aggregator with tests; (6) reference download with tests; (7) compare with tests; (8) full reference download and compare on the PC, results in `docs/f1/f1a-3-aggregation.md` and the commit body; push and PR. Every code commit body has "TDD evidence:" (red count before, green after, suite total). Review: one commit per round; at most 3 Codex rounds on the PR, from round 4 only P0/P1 are fixed and the rest goes to the ledger (decision 42).

## l. Hours estimate (decision 44)

About 15 hours of agent work from the first branch commit to merge, including the compare step (reasoning; F1a-2 took 3 days and 8 rounds): contract 0.5; two refactors 3; glossary 0.5; aggregator 3; reference download 2; compare 2; full download and compare with the doc 1 (download about 10-15 min, compare about 1-2 min); 3 Codex rounds 3. Range 12-20 hours; wall time 2-3 days with review latency.

## m. Open questions for Tomas

1. Storage: (a) compute on read now, consumer storage decided in F1b; (b) stored aggregate snapshots with a manifest now. Recommendation (a).
2. Incomplete bars: (a) P1 strict omit now, P2 for XRP decided in F1b; (b) P2 now; (c) P3. Recommendation (a).
3. Compared columns: (a) all nine value columns; (b) OHLCV only. Recommendation (a).
4. Intervals compared: (a) 1h and 4h decide, 1d and 1w reported; (b) 5m and 15m too (more downloads, size not measured); (c) 1h and 4h only. Recommendation (a).
5. 1w after the last published week (2024-01 at the latest): (a) accept partial Vision evidence plus the bit-exact internal test that a week equals its seven days; (b) REST 1w, counted separately; (c) nothing. Recommendation (a).
6. VPS reproduction: (a) none; (b) rerun download and compare on the VPS with equal digests. Recommendation (a).
7. Holdout: (a) no holdout aggregates or holdout reference files in F1a-3; (b) download holdout reference files as sealed storage for F1c. Recommendation (a).

## n. Ledger I77 items touched

None is changed. Two apply unchanged to the reference files because they reuse the F1a-2 transport and store: (1) no version-selection rule after a republish, so two local versions of a reference file fail closed; (5) 404 markers are never removed, now also for unpublished 1w months. (6) does not apply: F1 tests run from `experiments/strategy-destruction-filter`. (7) does not apply: the reference compare uses no temp directory.
