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
