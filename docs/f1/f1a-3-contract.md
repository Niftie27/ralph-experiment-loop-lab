# F1a-3 contract

Binding contract for F1a-3 (aggregation 1m to 5m, 15m, 1h, 4h, 1d, 1w), so Codex, the VPS agent and Claude Code review against the same text (decision 24). It consists of:

1. The plan `docs/f1/f1a-3-plan.md` at `80ff807`.
2. The approval below, verbatim as Tomas sent it on 2026-10-27. Where it differs from the plan, it wins.
3. The C3 months and the revised hours estimate below, written by Claude Code before any 5m or 15m result was seen.

## Approval (verbatim)

F1a-3 approval (Tomas, 2026-10-27): docs/f1/f1a-3-plan.md at 80ff807 is approved with the changes below. Inputs: review by Claude in chat; VPS agent second opinion docs/f1/f1a-3-plan-second-opinion.md on main at c450c25 (verdict: approve with changes).

Open questions: 1(a) compute on read, consumer storage decided in F1b; 2(a) P1 strict omit; 3(a) all nine value columns; 4(a) 1h and 4h decide, 1d and 1w reported, plus C3; 5(a) partial Vision 1w evidence plus the C1 tests, reporting per symbol the last externally compared week and the unverified remainder (HYPE has no 1w reference); 6(a) no VPS reproduction now, plus C5; 7(a) no holdout aggregates and no holdout reference files.

Changes:
C1. Composition tests (4h vs its four 1h bars, a week vs its seven days) compare exact BigInt intermediates, with fixtures whose sums exceed 15 significant digits. Decimals are never recovered from aggregate Numbers; every timeframe is computed from 1m.
C2. The transport extraction is a pure move in its own commit: retries, backoff, redirects, timeouts, size caps, CHECKSUM-first order, 404 markers, repair, versions, injection seams, defaults, paths, summaries and exit codes unchanged. The interval-aware parser is a separate commit with unchanged 1m behaviour as its regression contract.
C3. A reported, non-deciding 5m and 15m compare on one fully research-contained month per symbol (HYPE: a full listed research month). The months are recorded in this contract before any 5m or 15m result is seen. An unavailable file is reported, never counted as equal.
C4. XRP is not in research-queue SYMBOLS today; before F1b uses XRP as a cross-check, its full-window eligibility is decided (ledger gate). F1a-3 never fills a minute and never relaxes inputIssues.
C5. PC and VPS output digests are compared when F1f runs on the VPS (ledger item); nothing runs on the VPS now.
V1. Acceptance is exact decimal equality: for every compared column, the reference token parsed as a scaled integer equals the aggregate's exact sum. Number equality is reported in addition and is not the proof. This supersedes plan section a where it calls Number equality "also exact decimal equality".
V2. The aggregator calls the reader for one month at a time, never for a multi-year window, releases each month, and carries open bars (the weekly bar included) across month boundaries; a spy-reader test proves it. Memory acceptance (maxRSS <= 512 MiB) covers result arrays and successive symbols in one process.
V3. Reference parser: the row cap counts grid opens inside the source file; a weekly row may close outside its source file. Separately, a reference or aggregate bar is admitted as research only when open_time + interval <= 2025-10-17T00:00Z. A poisoned boundary-week reference fixture tests it.
V4. Every complete aggregate bar in a deciding interval (1h, 4h) gets exactly one disposition: equal, mismatched, reference_quarantined, absent_row or absent_file; the counts reconcile with the totals. Any mismatched or absent_row bar fails (exit 1). Any reference_quarantined or absent_file bar leaves the compare incomplete (exit 3) and is listed; an exception needs a new decision. Exit 1 takes precedence over exit 3. A deciding window with zero compared bars fails.
V5. One canonical digest schema (byte order, column order, chronological order of metadata) covering instrument, timeframe, window, input units, columns, incomplete bars and empty ranges; the git revision is recorded besides the module hash.
V6. P1 gives completeness, not as-of availability (supersedes plan section f where it says P1 already gives it). F1d must use a higher-timeframe bar only when open_time + interval <= decision time (ledger item for F1d); no engine change in F1a-3.
V7. The implementation report keeps the precision-survey method, input hashes, commands, versions and result counts; the unavailable 1w tail stays labelled unverified.

Ledger items filed by Claude in chat, not by Claude Code: the C4 gate, the C5 digest check, the V6 F1d as-of rule, and a runtime consumer inventory on the VPS before F1f.

## C3 months (recorded before any 5m or 15m result was seen)

No 5m or 15m file has been listed, downloaded or parsed and no 5m or 15m aggregate has been computed when these months are written. One calendar month per symbol, wholly inside the research window (2021-11..2025-09), spread over the years:

| Symbol | Month | Why this month |
| --- | --- | --- |
| BTCUSDT | 2022-06 | spread over the years |
| ETHUSDT | 2023-03 | spread over the years |
| SOLUSDT | 2022-02 | contains the daily-filled minutes 2022-02-26..28 (F1a-2 round 5), so the fill path is checked against Binance's own 5m and 15m bars |
| XRPUSDT | 2023-11 | contains the quarantined minute 2023-11-30T12:35Z, so the incomplete-bar disposition is exercised (the 5m and 15m bars holding it are reported as aggregate_incomplete, never compared) |
| DOGEUSDT | 2024-05 | spread over the years |
| HYPEUSDT | 2025-08 | a full listed research month (HYPE's first month 2025-05 is partial) |

The 5m and 15m monthly files of these months are fetched with the reference download in commit (8). A file that is not published is reported as unavailable and never counted as equal; these results never decide acceptance.

## Revised hours estimate (decision 44)

The plan's estimate (about 15 h, range 12-20) rises to about 19 h, range 15-25, from the first branch commit to merge including the compare step (reasoning). Added: aggregator +1 h (C1 exact BigInt intermediates and composition fixtures, V2 month-by-month spy test, V5 canonical digest); reference parser and download +1 h (V1 scaled-integer reference tokens, V3 grid-open row cap and research admission with the poisoned boundary-week fixture); compare +1.5 h (V4 disposition partition and exit precedence, C3 5m and 15m sample); report +0.5 h (V7 precision-survey method, hashes, commands, versions).

## Amendment 1 (verbatim)

F1a-3 amendment 1 (Tomas, 2026-10-27). Inputs: docs/f1/f1a-3-aggregation.md at cd23e4e (full compare at e5efe41, exit 1); an independent check by Claude in chat, run on the PC: 40 daily Vision files (1m and 1h of BTC, ETH, SOL, XRP and DOGE on 2022-06-18, 2023-11-14, 2024-10-28 and 2025-01-29), every CHECKSUM verified, 480 hours, 24 hours where the 60 1m rows do not reproduce the 1h row.

Decisions: 1(a), 2(a), 3 PR after the fix commits.

D1. Exception class E1 (source-inconsistent hours). A research hour of a symbol is in E1 if and only if Binance Vision's own 60 1m rows of that hour do not reproduce Vision's 1h row in at least one of the nine value columns (first open, max high, min low, last close; exact decimal sums of volume, quote_volume, count, taker_buy_volume and taker_buy_quote_volume). E1 is computed by a committed script that does not import src/f1-aggregate.mjs and uses its own exact sums, from the 1m files of the store and the 1h reference files of the compare. The list (symbol, open time, minutes, differing columns, relative difference of each differing sum) is committed. Acceptance with E1, per symbol: the mismatched 1h bars equal the E1 hours whose aggregate bar is complete; every mismatched 4h and 1d bar contains at least one E1 hour; everything else in V4 is unchanged (any other mismatch or any absent_row in 1h or 4h exits 1; reference_quarantined or absent_file in 1h or 4h exits 3; 1 wins over 3). E1 does not say which file is right: in XRP 2023-11-14T11:00 the 1m volume is higher and the 1m quote volume lower than the 1h row. In F1a-3 the aggregator is not changed and no minute is filled or flagged.

D2. The reference plan adds daily 1h, 4h and 1d files for the days the 1m store fills from daily files (manifest filledRanges: SOL and XRP 2022-02-26..28 and 2022-04-01..02), and daily 5m and 15m files where such a day lies in the symbol's C3 month (SOL 2022-02-26..28). They count like monthly files: 1h and 4h decide. An unpublished daily file is absent_file (exit 3 for 1h and 4h).

D3. The PR is opened after the fix commits; every push to the open PR is one Codex round (decision 42).

Ledger item filed by Claude in chat, not by Claude Code: before F1b uses volume, count or taker columns, decide how E1 hours are treated (keep, flag or omit), with a reported, never-deciding aggTrades check of the E1 hours as evidence.

## Amendment 2 (verbatim)

F1a-3 amendment 2 (Tomas, 2026-10-28). Inputs: the run at 6c953ce as reported by Claude Code (E1 64 hours: BTC 15, ETH 13, SOL 12, XRP 12, DOGE 12, HYPE 0; compare exit 1); a second independent check by Claude in chat, run on the PC, 34 Vision files, every CHECKSUM verified: (A) BTCUSDT 2023-11-14, the daily and monthly 1m files differ by value in the rows 11:38-11:42; the monthly 1m rows reproduce the monthly and the daily 1h row of 11:00, the daily 1m rows reproduce neither; (B) in 2022-07 and 2023-08 the monthly 4h row 2022-07-16T04:00 and the monthly 1d rows 2022-07-16 and 2023-08-16 do not reproduce from Vision's own monthly 1h rows for BTC, ETH, SOL, XRP and DOGE; every other 4h and 1d row of those months does.

Decisions: 1(a), 2(a).

D4. D1 is unchanged: E1 is computed from the 1m files the store uses, so BTC 2023-11-14T11:00 is not in E1 (the store's monthly 1m rows reproduce the 1h row). That Vision's daily and monthly files can differ is recorded as a finding; a full daily-versus-monthly comparison is scheduled in the input data review (ledger I84), not done in F1a-3. The cross-check for the four days checked under amendment 1 becomes: E1 on those days equals the 24 hours listed there minus BTC 2023-11-14T11:00.

D5. Exception class E2 (source-inconsistent higher bars). A research 4h or 1d bar of a symbol is in E2 if and only if all its Vision 1h rows are present in the 1h reference files and Vision's own 4h or 1d row does not reproduce from them in at least one of the nine value columns (same rules as D1). E2 is computed by the same committed script as E1 (no import of src/f1-aggregate.mjs, own exact sums) from the 1h, 4h and 1d reference files of the compare, and its list (symbol, interval, open time, differing columns, relative difference of each differing sum) is committed. Acceptance replaces the 4h and 1d part of D1, per symbol and interval: every mismatched 4h and 1d bar holds an E1 hour or is in E2; the mismatched 4h and 1d bars that hold no E1 hour equal the E2 bars that hold no E1 hour and whose aggregate bar is complete. The 1h part of D1 and everything else in V4 are unchanged. E2 does not say which file is right.

Ledger items filed by Claude in chat, not by Claude Code: the daily-versus-monthly comparison (I84); before F1b uses volume, count or taker columns, decide how E1 and E2 bars are treated, with the aggTrades check as evidence.
