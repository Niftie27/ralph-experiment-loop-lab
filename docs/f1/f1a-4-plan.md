# F1a-4 plan: funding-rate history with intervals

Plan only (no code, no contract). Branch `f1/a4-funding` from main `a25778b`, written 2026-10-28. Every claim is labelled **tested** (how, how many), **taken over** (from where) or **reasoning**. Paths are relative to `experiments/strategy-destruction-filter` unless they start with `docs/`. Throwaway checks ran in a scratch folder outside the repo (one of them imports the repo's 1m reader read-only); their scripts are not committed, except the two read-only VPS check scripts in Appendix A. The prior-art report `docs/f1/f1a-4-prior-art.md` (VPS agent) is taken over; every fact below that the plan relies on was re-checked on the PC on 2026-10-28 or is marked not verified.

Precheck (tested): `node --test --test-reporter=tap` on the branch base: 264 of 264 pass, PC Node v24.10.0, 21.6 s.

## a. Scope and source facts

Scope: a funding data layer for the Binance USD-M perpetuals BTCUSDT, ETHUSDT, SOLUSDT, XRPUSDT, DOGEUSDT and HYPEUSDT over the F1 range 2021-10-18..2026-10-17: per settlement the settled rate, the settlement time and the contract's interval as published, with provenance, coverage and schedule anomalies; a research reader; holdout integrity only. Out of scope: payment accounting (a later phase; section f defines the fields it needs), REST code, mark-price data, predicted funding.

| Fact | Status |
| --- | --- |
| Vision monthly fundingRate listing: BTC 81, ETH 81, SOL 73, XRP 81, DOGE 75, HYPE 17 zips, each with a `.CHECKSUM`; first month 2020-01, 2020-01, 2020-09, 2020-01, 2020-07, 2025-05; last month 2026-09 for all six; no month gap; no daily fundingRate files; no other keys | tested: 12 S3 listings (monthly and daily per symbol), 2026-10-28 17:22Z; equal to the prior-art counts |
| F1 range months 2021-10..2026-09: 317 zips, 290,698 B in all, the largest 1,620 B (SOLUSDT 2022-11) | tested: listing sizes |
| Publication: every file up to 2023-03 (and SOLUSDT 2023-04) has LastModified 2023-05-09 (bulk publication); the other files 7.7 h to 24.4 days after their month ended; from 2025-07 on every file within 72 h; 2026-10 is not listed | tested: listing LastModified of all 408 files |
| Format: one CSV member named like the zip, header `calc_time,funding_interval_hours,last_funding_rate`, millisecond `calc_time`, newline at the end | tested: 8 samples, CHECKSUM verified (BTCUSDT 2021-10 and 2025-09, ETHUSDT 2020-01, SOLUSDT 2022-10..12, HYPEUSDT 2025-05 and 2025-09), 816 rows |
| Rate token: plain with 8 decimals, or exponent form (`-2.7E-7`, `9.5E-7`, `-1.0E-7`; source: Binance Vision, CC BY-NC-SA 4.0); exact decimal places at most 8 | tested: 8 of the 816 rows use exponent form; REST gives the same values in plain form (`-0.00000027`), equal as exact decimals |
| `calc_time` lies 0 to 30 ms after the full hour of the settlement (max 30 ms, SOLUSDT; not only 1 and 5 ms); REST `fundingTime` carries the same millisecond | tested: 816 Vision rows; 255 of 255 events in SOLUSDT 2022-11 and BTCUSDT 2025-09 have equal times and equal rates in REST and Vision; max 20 ms in 1,725 further REST records |
| Interval column values: 8 (BTC, ETH, SOL outside the episode below), 4 (HYPE; 2 SOL rows), 2 (99 SOL rows, 2022-11-10T04:00..2022-11-18T08:00) | tested: 8 samples |
| HYPEUSDT: first settlement 2025-05-30T12:00:00.006Z, interval 4; fundingInfo `updateTime` 1748601134819 = 2025-05-30T10:32:14.819Z; first 1m candle 10:30 | tested (Vision 2025-05 file, one fundingInfo GET); the first candle taken over from `docs/f1/f1a-2-vision-1m.md` |
| fundingInfo today has 814 rows; for the six symbols the same values as the prior-art report. SOLUSDT shows 8 h and `updateTime` null although it settled every 4 h and 2 h in 2022-11, so fundingInfo is no interval history | tested: one GET, 2026-10-28 |
| REST fundingRate `markPrice` is "" for BTCUSDT up to 2023-10-31T00:00Z and set from 2023-10-31T08:00Z; "" in all 165 SOLUSDT 2022-11 records; set in all 1,725 records of the sizing months (section b). `rateType` is Regular in all 2,257 records fetched | tested: 3 query sets, 2,257 records (BTC 2023-09..12 in one 367-record query) |
| Binance funding FAQ (page "Introduction to Binance Futures Funding Rates", updated 2026-03-06): default 8 h at 00:00, 08:00 and 16:00 UTC; "the funding rates calculated from 00:00 - 08:00 are exchanged at 08:00"; a "15-second deviation in the actual funding fee transaction time"; "Funding Amount = Nominal Value of Positions * Funding Rate", "(Nominal Value of Positions = Mark Price * Size of a Contract)"; a positive rate makes longs pay shorts, a negative rate shorts pay longs; only positions open at the funding time pay or receive, and a position opened at 08:00:05 can still be charged; rate formula "Funding Rate (F) = [Average Premium Index (P) + clamp (interest rate - Premium Index (P), 0.05%, -0.05%)] / (8 / N)"; section 8: from 2025-05-02 08:00 UTC a settlement at the rate cap or floor switches the contract to 1-hour settlements from the next hour, and from 2026-01-02 12:00 UTC a contract on 1-hour settlements returns to 4 hours on the 17th cycle after 16 cycles with an absolute rate at or below 0.025 %; such adjustments are not announced | read through the WebFetch tool on 2026-10-28, which returns extracted quotes and summaries; `curl` from the PC got HTTP 202 with an empty body (as the VPS agent did), so the raw page text is **not verified** |
| Vision `markPriceKlines` exist for BTCUSDT: monthly 1m 2020-01..2026-09 (81 zips), intervals 1m to 1mo | tested: two listings; content not read |

Reasoning from the FAQ formula: the published rate is already per settlement (divided by 8/N), so a payment is rate × notional and is never multiplied by hours; the interval matters for the schedule, completeness and annualising only.

## b. Spec clarification: payment price

The spec row "Intraday and swing" says "mark price matters only if liquidation is modelled". The API documentation ties `markPrice` to the funding fee charge (taken over, prior-art report) and the FAQ above says notional = mark price × size (not verified, see a). So the payment uses the mark price, and the question is whether a stand-in is good enough.

Size of the effect (tested): REST `markPrice` against the close of the research 1m candle that opens one minute before the settlement (read with `openResearch1m` from the F1a-2 store), 17 symbol-months: BTC, ETH, SOL, XRP and DOGE in 2024-08, 2025-04 and 2025-09; HYPE in 2025-06 and 2025-09. 1,725 settlements, 1,708 compared (the first settlement of each month needs the previous month's last minute, outside the window read). maxRSS 185 MiB, 6.7 s.

| Symbol | Median of abs(close - mark) / mark | p99 per month (max) | Max | Max payment error per settlement |
| --- | --- | --- | --- | --- |
| BTC | 0.01-0.30 bp | 5.8 bp | 5.8 bp | < 0.001 bp of notional |
| ETH | 0.08-0.46 bp | 5.5 bp | 5.5 bp | < 0.001 bp |
| SOL | 0.41-0.75 bp | 6.7 bp | 6.7 bp | 0.001 bp |
| XRP | 0.29-0.90 bp | 6.7 bp | 6.7 bp | 0.001 bp |
| DOGE | 0.29-0.96 bp | 9.1 bp | 9.1 bp | 0.001 bp |
| HYPE | 0.67-1.44 bp | 9.9 bp | 15.0 bp | 0.002 bp |

All 1,708: median 0.42 bp, p99 7.2 bp, max 15.0 bp of price; the open of the settlement minute gives a max of 13.9 bp. Per month the signed error sums to at most 0.02 bp of notional, against 33-190 bp of summed absolute rates. Not measurable before 2023-10-31 from REST (no `markPrice`). Reasoning: even at a 2 % rate cap (HYPE) and a 15 bp price difference the error is 0.3 bp of notional per settlement, small against 16 bp of round-trip costs.

Proposed wording for the spec row (Tomas decides, open question 2): "Funding: at each settlement a position that is open at the settlement time pays or receives size × mark price × the settled rate (longs pay when the rate is positive). F1 uses the trade close of the 1m candle before the settlement as the mark price: in 1,708 settlements (2024-08 to 2025-09) it differed from Binance's mark price by at most 15 bp of price, at most 0.002 bp of notional per payment. Mark-price data are otherwise needed only if liquidation is modelled, which F1 does not."

## c. Coverage, offsets and missing settlements

Settlement time = `calc_time` minus (`calc_time` mod 1 h). Every interval seen or documented (1, 2, 4, 8 h) is a whole number of hours, so every settlement lies on the hour (reasoning; the scan checks it). Proposed parser bounds (open question 7, after the VPS check): a remainder of 15,000 ms or more fails the file (the FAQ's 15-second deviation; seen at most 30 ms); an interval outside {1, 2, 4, 8} fails the file. Changing either needs a new decision.

| Class | Rule | Exit |
| --- | --- | --- |
| not_listed month | Both the zip and its CHECKSUM answer 404, proven with the F1a-2 listing rule (contract rounds 2 and 3: evidence for (a), (b), (c)). Expected: HYPE 2021-10..2025-04 | 0, reported |
| pre-listing span | From the start of the instrument's first listed month to its first settlement (HYPE 2025-05-01T00:00Z..2025-05-30T12:00Z): the contract did not exist, so nothing is missing | 0, reported |
| gap month | 404 on both for a month after the first listed one, or not proven not_listed | 3 |
| pending month | 2026-10 (not listed on 2026-10-28; open question 4); not planned in F1a-4 | none |
| duplicate settlement | Two rows with the same settlement hour, or a settlement not after the previous one in its file | 1 (file fails) |
| unexplained gap | Hours since the previous settlement equal neither the row's interval nor the previous row's interval | stop rule (section i) |
| off-grid settlement | The settlement hour is not a multiple of the row's interval | stop rule (section i) |

No settlement is ever filled; a missing settlement stays missing (Freqtrade warns that filled rates make backtests inaccurate; taken over, prior-art report). Samples (tested): no duplicate, no off-grid settlement and no unexplained gap within each of the 8 files and across the three contiguous SOL months.

Interval semantics at a change (tested on SOLUSDT 2022-11, Vision and REST agree on all 165 settlements; REST has no settlement at 2022-11-10T02:00):

| Settlement (UTC) | Interval column | Hours since previous | Hours to next |
| --- | --- | --- | --- |
| 2022-11-09 16:00 | 8 | 8 | 4 |
| 2022-11-09 20:00 | 4 | 4 | 4 |
| 2022-11-10 00:00 | 4 | 4 | 4 |
| 2022-11-10 04:00 | 2 | 4 | 2 |
| 2022-11-18 08:00 | 2 | 2 | 8 |
| 2022-11-18 16:00 | 8 | 8 | 8 |

Neither reading fits all three changes: "the column describes the period before" fails at 2022-11-10 04:00; "the period after" fails at 2022-11-09 16:00 and 2022-11-18 08:00. Reading (reasoning): the column is the setting in force when the rate was settled; at a change the elapsed period can match either the old or the new setting. Consequence: the data layer keeps the published `intervalHours` unchanged plus a derived `elapsedHours`, and the schedule check accepts an elapsed time equal to the row's or the previous row's interval. Neither value scales a payment (section a).

Finding more transition rows: the VPS check in Appendix A scans all 342 monthly files of the six symbols from their first month to 2025-10 and lists every change, gap, duplicate, offset bucket and token form. If no 1-hour episode (the 2025-05-02 rule) shows up in the six symbols, the rule is documented but unseen; a scan of other symbols (candidates from fundingInfo, 814 rows) is open question 9, not needed for F1a-4.

## d. Holdout and sealed data

- Research: settlements with 2021-10-18T00:00Z <= settlement time < 2025-10-17T00:00Z. The settlement at 2025-10-17T00:00Z belongs to the holdout (half-open; it pays for 2025-10-16T16:00..2025-10-17T00:00 but happens at the holdout start, and a research backtest ends before it; reasoning).
- The 2025-10 file holds research and holdout rows. The research parser reads the `calc_time` field first and leaves every row at or after 2025-10-17T00:00Z unread and uncounted (the scan in Appendix A does the same; tested on a synthetic file whose sealed rows carry invalid tokens). The research reader refuses any window outside the research window, as `openResearch1m` does.
- Holdout integrity, proposed stricter than F1a-2 round 4 (open question 3): per holdout month only availability, CHECKSUM verification and pass or fail of the parse and of the schedule check; no settlement counts, interval values or settlement times. Reason (reasoning from the FAQ section 8 rule): since 2025-05-02 a settlement at the cap or floor switches the contract to hourly settlements, so counts, intervals and times in the holdout reveal when funding hit its cap, which is an outcome.
- After 2026-10-17: nothing is planned. The 2026-10 monthly file, when published, holds holdout days 01-16 and sealed days 17-31, and no daily funding files exist (open question 4).
- The VPS check downloads no month after 2025-10.

## e. Storage, sizes, memory and terms

| Option | For | Against |
| --- | --- | --- |
| S1 compute on read (recommended) | About 30,000 rows in 317 small zips; parsing all of them is cheap; no manifest, no snapshot format, no format review (`docs/findings.md` F11); provenance = the {file, sha256} list, the module sha256, the git revision and a canonical digest, as F1a-3 V5 | Each consumer parses again (reasoning: milliseconds for this size) |
| S2 stored snapshots with manifest entries (F1a-2 pattern) | Same verify and compare pattern as 1m | A second manifest kind and its review surface for 290 KB of input |

Sizes: zips 290,698 B (tested, listing) plus 317 CHECKSUM files of about 100 B and 43 HYPE 404 markers (reasoning). Location `data/vision/data/futures/um/monthly/fundingRate/<contract>/<sha256>/`, gitignored (tested: `git check-ignore -v` matches `.gitignore:14 experiments/**/data/`). Rows (reasoning): about 5,400 per core symbol at 8 h over 2021-10..2026-09 plus change episodes, about 2,900 for HYPE, about 30,000 in all, about 22,700 in research. Memory: tested maxRSS 92 MiB for the download script (2 files) and 57 MiB for the scan (8 files), PC Node v24.10.0. The A8 ceiling of 512 MiB and `memoryGuard` apply; acceptance maxRSS <= 512 MiB, expected below 128 MiB (reasoning).

Terms (ledger I93, taken over): the Vision data are under CC BY-NC-SA 4.0 for non-commercial research. No bulk data in the repo: code, synthetic test fixtures and reports with counts, times and hashes only; any quoted excerpt says "Source: Binance Vision (CC BY-NC-SA 4.0)".

## f. Modules, interfaces and fields for the payment phase

F1a-4 changes neither `src/research-queue.mjs`, `src/engine.mjs` nor `src/h2-contract.mjs`. Names are provisional; glossary rows in a docs commit.

- `src/vision-source.mjs`: `fundingSource(instrument, month)` returns `{ file, checksumFile, zipName, csvName, kind: 'monthly', startMs, endMs }` for `data/futures/um/monthly/fundingRate/<contract>/<contract>-fundingRate-<YYYY-MM>.zip`; `planFundingUnits(symbol)` plans 2021-10..2026-09, clips to the F1a range and splits 2025-10 at 2025-10-17 like `planUnits`, never 2026-10.
- `src/f1-1m-store.mjs`: `notListedSources` takes the planned units instead of calling `planUnits` itself (refactor; 1m behaviour unchanged), so the listing rule stays implemented once.
- `src/vision-transport.mjs`: `fetchSource` unchanged (CHECKSUM first, version directories, 404 markers, finite retries, data.binance.vision only).
- `src/f1-funding.mjs` (new, deep): `parseFunding(csv, source, { sealMs })` returns frozen columns or throws on a structural error; `openResearchFunding({ zipRoot })` returns `read({ instrument, dataStart, dataEnd })`; CLI `download` and `verify` with exit codes 0, 1, 2, 3 (decision 22) and the memory guard.

Columns returned by `read`, one entry per settlement:

| Column | Meaning | Source |
| --- | --- | --- |
| `settlementTime` | ms UTC on the hour | `calc_time` floored to the hour |
| `calcTime` | ms UTC, verbatim | `calc_time` |
| `rate` | Number of the exact decimal; exponent and plain tokens of one value give the same Number | `last_funding_rate` |
| `intervalHours` | 1, 2, 4 or 8, verbatim | `funding_interval_hours` |
| `elapsedHours` | hours since the previous settlement (the previous month's file is read when needed); null for the instrument's first settlement and after a gap month | derived |
| `sourceIndex` | index into `sources` | provenance |

Window metadata: instrument (exchange, market, contract), dataStart, dataEnd, `sources` [{file, sha256}], first settlement, not_listed months, pre-listing span, anomalies (none expected), digest, module sha256, git revision.

Fields the payment phase needs, defined here, implemented later (with the F1b accounting contract, ledger I75 a): position size and side at each `settlementTime` (engine); notional price (the 1m close before the settlement, if open question 2 is (a)); sign (a positive rate makes longs pay); event order, proposal: a position counts at a settlement when its entry fill time <= `settlementTime` < its exit fill time, and a fill within 15 s of a settlement counts only when that costs the strategy. As-of rule for features (F1d, like F1a-3 V6): a rate is usable only for decisions at or after `settlementTime` + 1 minute, never before `calcTime`.

## g. Prior art (decision 37)

F = read by Claude Code on 2026-10-28; T = taken over from `docs/f1/f1a-4-prior-art.md`, not re-read; W = read through the WebFetch tool only; N = named, not read.

| Source | Use | Reason | Status |
| --- | --- | --- | --- |
| Binance Vision monthly fundingRate archive | use | Explicit per-row interval, CHECKSUM per zip, every symbol from before the F1 range; equal to REST on 255 settlements | F (12 listings, 8 samples) |
| Own Vision transport, store, listing rule, memory guard (`src/vision-transport.mjs`, `src/f1-1m-store.mjs`, `src/vision-1m.mjs`) | use | Verified in F1a-2 and F1a-3; works on any monthly source | F (code read) |
| REST `/fapi/v1/fundingRate` | reference only | No interval, no checksum, `markPrice` empty before 2023-10-31; a reported cross-check, not a source (section h) | F (2,257 records) |
| REST `/fapi/v1/fundingInfo` | reference only | Current settings, no history (SOLUSDT shows 8 h and null) | F (one GET) |
| Binance funding FAQ | reference only | Settlement times, formula, mark price, interval rules | W (raw text not verified) |
| Binance fee FAQ, settlement announcements 2025-05-02 and 2026-01-02, Binance Academy | not used | The FAQ section 8 covers both announcements' rules | N |
| binance-public-data README and dataset terms | reference only | Layout, CHECKSUM, later updates; terms re-read by Claude in chat (I93) | T |
| ccxt `fetchFundingRateHistory` | rejected | REST wrapper without per-event interval | T |
| Freqtrade funding fees | reference only | A filled missing rate makes backtests inaccurate: F1 never fills | T |
| NautilusTrader FundingRateUpdate | reference only | A rate update is not a payment; interval in minutes, optional | T |
| Tardis derivative_ticker and fundingRate channels | rejected | Predicted or sampled funding, not settled funding; paid history | T |

No library is installed or used.

## h. Source files, transport and source rule

| Option | For | Against |
| --- | --- | --- |
| V1 Vision monthly fundingRate only (recommended) | Same archive and CHECKSUM path as the klines (ledger I59: Vision only for futures snapshots); explicit interval per row; versioned, hash-verifiable files; equal to REST on 255 settlements including exponent tokens | No mark price (not needed under section b), no rate type (Regular in all 2,257 REST records) |
| V2 Vision plus REST `markPrice` and `rateType` | Mark price at the settlement from 2023-10-31 | Half the research window has no `markPrice`; a second source path with pagination and rate limits; nothing to verify the REST bytes against |
| V3 REST only | One request per 1,000 settlements | No interval, no checksum, no versions; against the I59 precedent |

Recommendation V1 (open question 1). REST stays a reported, never-deciding cross-check outside F1a-4 code: the 255-settlement spot check above, and a full comparison in the input data review (ledger I84 a).

Files: per symbol the monthly files 2021-10..2026-09 (HYPE 2025-05..2026-09) = 317 zips with CHECKSUMs, plus the HYPE months 2021-10..2025-04 probed for 404 evidence: about 720 GETs (reasoning: 317 x 2 + 43 x 2). Republished files (prior-art report: archives may be updated; ledger I77 (1)): each download compares the current CHECKSUM with the stored versions; a new sha256 is stored as a second version, and any month with more than one local version fails closed (exit 1) and is listed until a version-selection rule exists. LastModified is not used (S3 shows only the current object). The digest covers every source sha256, so a republish changes it.

## i. Checks and acceptance

`verify` (offline, after `download`): every planned file present and CHECKSUM verified, every file parses, the schedule check over each symbol's whole history, coverage per symbol.

Proposed acceptance: exit 0 when every planned file is present and verified, no file fails, the research has no unexplained gap and no off-grid settlement, not_listed covers exactly HYPE 2021-10..2025-04, and maxRSS <= 512 MiB; exit 3 for a gap month; exit 1 for any failure (precedence 1 over 3). Stop rule: an unexplained gap or off-grid settlement in the research is listed and the phase stops for Tomas (amendment, as in F1a-3), never a silent pass and never a fill (open question 6). Holdout: pass or fail only (section d).

Report per symbol: files, research settlements, first settlement, every research interval change (time, old, new, elapsed), offset maximum, not_listed months, pre-listing span, maxRSS, runtime, input hashes.

Within-source consistency (F18): Vision has no second funding file per month (no daily files), so the internal check is the interval column against elapsed time. VPS reproduction of the F1a-4 run: not needed (reasoning: small deterministic input; a digest comparison can join the F1f check of F1a-3 C5).

Before approval, the VPS check in Appendix A (read-only, decision 49) answers what the samples cannot: the maximum offset, duplicates, every interval change from 2020 to 2025-10-16, unexplained gaps and token forms in all 342 files. Its result decides the parser bounds of section c before the contract.

## j. Tests (TDD, synthetic fixtures, no real data)

Fixtures: one-member zips built in the tests from a few CSV rows, as the existing tests do; no Vision file and no real rate in any test.

- Paths and plan: `fundingSource` names; `planFundingUnits` gives 2021-10..2026-09, splits 2025-10 at 2025-10-17, never plans 2026-10; HYPE months.
- Parser: exact header and the numeric first-row variant; 3 fields; 13-digit `calc_time` inside the file's month; remainders 0, 30 and 14,999 ms pass, 15,000 fails; interval 1, 2, 4, 8 pass, 3 and 0 fail; `-2.7E-7` and `-0.00000027` give the same Number; more than 8 exact decimal places fails; duplicate and non-increasing settlements fail; missing final newline, CRC and member-name errors fail.
- Seal: rows at or after 2025-10-17T00:00Z with poison tokens do not fail a research read and are not counted; a settlement at 2025-10-17T00:00:00.002Z is holdout; the reader refuses windows outside the research window; the holdout report and every diagnostic contain no counts, intervals, times or rates of holdout rows.
- Schedule: the SOL-like 8 -> 4 -> 2 -> 8 fixture gives no anomaly; an unexplained gap and an off-grid settlement are listed and trigger the stop status; `elapsedHours` across a month boundary reads the previous file; null at the first settlement and after a gap month.
- Coverage: not_listed with full evidence, a gap without it (exit 3), the pre-listing span from the first settlement; the listing-rule refactor keeps every 1m test green.
- Versions: two local versions of a month fail (exit 1).
- Memory: a guard trip aborts the run (injected check, as F1a-2 round 5 point 5).
- Expected 35-45 new tests (reasoning); the 264 existing tests stay unchanged.

## k. Commits and review

After Tomas approves this plan: (1) `docs/f1/f1a-4-contract.md` with the approval verbatim (decision 24); (2) refactor: `notListedSources` takes the planned units, no behaviour change; (3) glossary rows (docs); (4) funding paths and parser with tests; (5) download with tests; (6) verify with coverage and the schedule check, with tests; (7) research reader with tests; (8) full download and verify on the PC, report `docs/f1/f1a-4-funding.md` and `docs/MAP.md` in the same commit (F21). Every code commit body has "TDD evidence:" (red count before, green after, suite total) and a Final report; `git log -1 --format='[%(trailers)]'` prints `[]` before every push. Each commit is pushed to `f1/a4-funding`; Tomas opens the PR; at most 3 Codex rounds (decision 42), each started only by Tomas. The seal path (parser skip, reader refusal, holdout report) and data identity are critical code for a full review by Claude in chat.

## l. Hours estimate (decisions 44, 46)

Wall clock from this plan commit to the merge commit: about 12 h, range 8-20 h (reasoning; F1a-3: estimate 19 h, measured 14 h 46 min with two amendments). In wall-clock hours: VPS check with Claude's test and review 1.5; second opinion 1; approval latency 1-3; contract and refactor 1; glossary 0.3; parser 1; download 0.7; verify 1; reader 1; full run and report 0.5 (about 720 GETs, a few minutes; verify seconds); PR and up to 3 Codex rounds 2-3. Agent time, information only: about 2.5 h.

## m. Open questions for Tomas

1. Source rule: (a) V1 Vision monthly only, REST a reported cross-check outside F1a-4 code; (b) V2; (c) V3. Recommendation (a).
2. Payment price: (a) the spec wording in section b (1m close before the settlement as the mark price); (b) Vision markPriceKlines as an extra dataset; (c) REST `markPrice` (empty before 2023-10-31). Recommendation (a).
3. Holdout integrity for funding: (a) pass or fail only per month (section d); (b) as F1a-2 round 4 (counts, times, intervals). Recommendation (a).
4. October 2026: (a) outside F1a-4; before any holdout look (F1c) add the monthly file once published, reading 2026-10-01..16 and leaving later rows unread; (b) REST for 2026-10-01..16; (c) holdout funding ends at 2026-10-01. Recommendation (a).
5. Storage: (a) S1 compute on read; (b) S2 snapshots and manifest. Recommendation (a).
6. Unexplained gap or off-grid settlement in the research: (a) stop rule and amendment; (b) list and pass. Recommendation (a).
7. Parser bounds after the VPS check: (a) remainder below 15 s and interval in {1, 2, 4, 8}; (b) other bounds. Recommendation (a), unless the check shows otherwise.
8. Order of the VPS jobs (one at a time): (a) Appendix A check, then the second opinion with its result, then approval; (b) second opinion first. Recommendation (a).
9. Transition semantics beyond the six symbols: (a) not in F1a-4; (b) a VPS check of other symbols chosen from fundingInfo. Recommendation (a).

## n. Prior-art open questions and ledger items

The eight open questions of `docs/f1/f1a-4-prior-art.md`:

1. October 2026 and HYPE before its first file: HYPE answered (not_listed months with 404 evidence, pre-listing span to the first settlement 2025-05-30T12:00:00.006Z, tested); October 2026 passed to Tomas (question 4).
2. Interval semantics at a change: partly answered (three tested changes, neither reading fits all, so column plus elapsed time); the full scan is planned (Appendix A); further symbols passed to Tomas (question 9).
3. Payment price and event order: price answered (FAQ through the fetch tool, effect sized) and passed to Tomas (question 2); event order proposed in section f for the payment phase.
4. Offsets, duplicates, absent rows, rate types, boundaries: answered for the samples (0-30 ms, same ms in REST, no duplicate, `rateType` Regular in 2,257 records, half-open by settlement time); the full history planned (Appendix A); bounds passed to Tomas (question 7).
5. CHECKSUM, republished files, coverage, within-source consistency: planned (sections c, h, i).
6. Storage and guard for research and holdout: planned (sections d, e); passed to Tomas (questions 3, 5).
7. Library: answered, none (section g).
8. Terms and vendor limits: answered (section e, ledger I93); no paid vendor is used.

Ledger items: none is changed. I77 (1) (no version-selection rule after a republish) and (5) (404 markers are never removed) apply unchanged to the funding files. Proposed for Claude in chat to file: the event-order rule for the payment phase; the F1d as-of rule for funding; a full REST-versus-Vision funding comparison in I84 (a).

## Appendix A. VPS check (read-only, decision 49)

Purpose: section c and i. Tested by Claude Code on the PC (Node v24.10.0): `funding-download.mjs` on 2 months (one 404 pair, exit 3 as designed; one CHECKSUM ok) and on the 8 samples (exit 0); `funding-scan.mjs` on the 8 samples (output summarised in sections a and c) and on two synthetic files (transitions, a duplicate, an unexplained gap, an off-grid row, a row outside its month, sealed rows with invalid tokens: all reported as expected, sealed rows unread). Not yet tested on the VPS (Node 24.22.0 taken over from ledger I59): Claude in chat tests and packages it before sending (R7; `docs/findings.md` F22), one VPS job at a time. HTTPS GETs to data.binance.vision only, about 684 of them; nothing is written outside `~/f1a4-scan`. sha256: `funding-download.mjs` `34f9214db803b874980b35f1bd1abc944cb1d426bec3ca522bfebe19685c0b51`, `funding-scan.mjs` `b883ad63ced0ee396ba38ac3f1d25f9add993224d22cf43a6e89076f11f7b071` (each code block below holds the file's exact bytes, final newline included).

Commands, in order (`~/f1a4-scan` must not exist before step 0; the two scripts are saved to `~/f1a4-scan/bin/` first):

```sh
date -u
node --version
grep MemAvailable /proc/meminfo
sha256sum ~/f1a4-scan/bin/funding-download.mjs ~/f1a4-scan/bin/funding-scan.mjs
systemd-run --user --scope -p MemoryMax=512M -p CPUQuota=50% -- nice -n 19 ionice -c 3 node ~/f1a4-scan/bin/funding-download.mjs ~/f1a4-scan/zips BTCUSDT:2020-01:2025-10 ETHUSDT:2020-01:2025-10 SOLUSDT:2020-09:2025-10 XRPUSDT:2020-01:2025-10 DOGEUSDT:2020-07:2025-10 HYPEUSDT:2025-05:2025-10 > ~/f1a4-scan/download.txt 2>&1; echo "download exit $?"
tail -n 1 ~/f1a4-scan/download.txt
systemd-run --user --scope -p MemoryMax=512M -p CPUQuota=50% -- nice -n 19 ionice -c 3 node ~/f1a4-scan/bin/funding-scan.mjs ~/f1a4-scan/zips > ~/f1a4-scan/scan.txt 2>&1; echo "scan exit $?"
cat ~/f1a4-scan/scan.txt
```

Expected (reasoning): `TOTAL ok 342 missing 0 mismatch 0`, download exit 0, scan exit 0, one block per symbol and `SCAN DONE symbols 6`. Every gap the scan reports at a file boundary is real here, because the months are contiguous. Output contains no rate values and nothing from 2025-10-17 on.

`funding-download.mjs`:

```js
// Downloads monthly Binance Vision fundingRate zips and their CHECKSUM files and verifies sha256 (read-only check).
// Usage: node funding-download.mjs <new empty outdir> SYMBOL:FROM:TO [...]   e.g. BTCUSDT:2025-09:2025-09
// HTTPS to data.binance.vision only, no redirects, 3 attempts, 1 s apart. Prints one line per file and a total line.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const [out, ...specs] = process.argv.slice(2);
if (!out || !specs.length) { console.error('usage: funding-download.mjs <outdir> SYMBOL:FROM:TO ...'); process.exit(2); }
if (fs.existsSync(out) && fs.readdirSync(out).length) { console.error(`${out} is not empty`); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
      if (res.status === 200 || res.status === 404) return { status: res.status, bytes: Buffer.from(await res.arrayBuffer()) };
      throw new Error(`HTTP ${res.status}`);
    } catch (e) { if (i === 3) throw new Error(`${url}: ${e.message}`); await sleep(1000); }
  }
}
const months = (from, to) => {
  const r = [];
  for (let y = +from.slice(0, 4), m = +from.slice(5, 7); `${y}-${String(m).padStart(2, '0')}` <= to; m === 12 ? (y++, m = 1) : m++) r.push(`${y}-${String(m).padStart(2, '0')}`);
  return r;
};
let ok = 0, missing = 0, bad = 0;
for (const spec of specs) {
  const [sym, from, to] = spec.split(':');
  if (!/^[A-Z0-9]+USDT$/.test(sym) || !/^\d{4}-\d\d$/.test(from) || !/^\d{4}-\d\d$/.test(to)) { console.error(`bad spec ${spec}`); process.exit(2); }
  for (const month of months(from, to)) {
    const name = `${sym}-fundingRate-${month}.zip`;
    const url = `https://data.binance.vision/data/futures/um/monthly/fundingRate/${sym}/${name}`;
    const sum = await get(`${url}.CHECKSUM`);
    const zip = await get(url);
    if (sum.status === 404 || zip.status === 404) { missing++; console.log(`${name} checksum ${sum.status} zip ${zip.status} MISSING`); continue; }
    const expected = sum.bytes.toString('latin1').trim().split(/\s+/);
    const actual = createHash('sha256').update(zip.bytes).digest('hex');
    const pass = expected.length === 2 && expected[1] === name && expected[0] === actual;
    fs.writeFileSync(path.join(out, name), zip.bytes);
    fs.writeFileSync(path.join(out, `${name}.CHECKSUM`), sum.bytes);
    if (pass) ok++; else bad++;
    console.log(`${name} ${zip.bytes.length} B sha256 ${actual} ${pass ? 'CHECKSUM ok' : 'CHECKSUM MISMATCH'}`);
    await sleep(200);
  }
}
console.log(`TOTAL ok ${ok} missing ${missing} mismatch ${bad}`);
process.exitCode = bad ? 1 : missing ? 3 : 0;
```

`funding-scan.mjs`:

```js
// F1a-4 read-only check: offline scan of verified Binance Vision monthly fundingRate zips. Prints no rate values.
// Usage: node funding-scan.mjs <dir with SYMBOL-fundingRate-YYYY-MM.zip files>
// Rows whose calc_time is at or after 2025-10-17T00:00Z are skipped unread (only their time field is parsed) and not counted.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SEAL = Date.parse('2025-10-17T00:00:00Z'), HOUR = 3600000, LIMIT = 40;
const HEADER = 'calc_time,funding_interval_hours,last_funding_rate';
const iso = t => new Date(t).toISOString();
const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
const hist = m => [...m].sort((a, b) => (a[0] > b[0]) - (a[0] < b[0])).map(([k, v]) => `${k}:${v}`).join(' ') || '-';
const bucket = ms => ms === 0 ? '0' : ms < 10 ? '1-9' : ms < 100 ? '10-99' : ms < 1000 ? '100-999' : ms < 15000 ? '1000-14999' : '>=15000';

// The single member of a zip: end of central directory, central entry, local header, inflate, CRC32 and size checks.
function member(buf, name) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0 || buf.readUInt16LE(eocd + 10) !== 1) throw new Error(`${name}: not a one-member zip`);
  const cd = buf.readUInt32LE(eocd + 16);
  const method = buf.readUInt16LE(cd + 10), crc = buf.readUInt32LE(cd + 16), csize = buf.readUInt32LE(cd + 20), usize = buf.readUInt32LE(cd + 24);
  const memberName = buf.toString('latin1', cd + 46, cd + 46 + buf.readUInt16LE(cd + 28));
  const lh = buf.readUInt32LE(cd + 42);
  const start = lh + 30 + buf.readUInt16LE(lh + 26) + buf.readUInt16LE(lh + 28);
  const raw = buf.subarray(start, start + csize);
  const data = method === 8 ? zlib.inflateRawSync(raw) : method === 0 ? raw : null;
  if (!data || data.length !== usize || zlib.crc32(data) !== crc) throw new Error(`${name}: bad member`);
  return { memberName, text: data.toString('latin1') };
}

const symbols = new Map();
for (const f of fs.readdirSync(process.argv[2]).filter(f => /^[A-Z0-9]+-fundingRate-\d{4}-\d\d\.zip$/.test(f)).sort()) {
  const sym = f.split('-')[0], month = f.slice(-11, -4);
  const s = symbols.get(sym) ?? { files: 0, notes: new Map(), rows: [], bad: [] };
  symbols.set(sym, s);
  s.files++;
  const { memberName, text } = member(fs.readFileSync(path.join(process.argv[2], f)), f);
  bump(s.notes, memberName === f.replace(/\.zip$/, '.csv') ? 'member ok' : 'member OTHER');
  const lines = text.split('\n');
  if (lines.at(-1) === '') lines.pop(); else s.bad.push(`${f}: no newline at end`);
  if (lines[0].replace(/\r$/, '') === HEADER) { bump(s.notes, 'header'); lines.shift(); } else bump(s.notes, /^\d/.test(lines[0]) ? 'no header' : 'OTHER first line');
  lines.forEach((line, i) => {
    const comma = line.indexOf(',');
    if (!/^\d{13}$/.test(line.slice(0, comma))) { s.bad.push(`${f} line ${i + 2}: bad calc_time`); return; }
    const t = Number(line.slice(0, comma));
    if (t >= SEAL) return; // sealed row: nothing else is read
    const p = line.replace(/\r$/, '').split(',');
    // Rate token: plain decimal or exponent form (seen: -2.7E-7); places = decimal places of the exact value.
    const m = /^(-?)(\d+)(?:\.(\d+))?(?:E(-?\d+))?$/.exec(p[2] ?? '');
    if (p.length !== 3 || !/^\d+$/.test(p[1]) || !m) { s.bad.push(`${f} line ${i + 2}: malformed`); return; }
    if (iso(t).slice(0, 7) !== month) s.bad.push(`${f} line ${i + 2}: ${iso(t)} outside the file's month`);
    const frac = (m[3] ?? '').replace(/0+$/, '');
    s.rows.push({ t, h: Number(p[1]), form: m[4] === undefined ? 'plain' : 'exponent', places: Math.max(0, frac.length - Number(m[4] ?? 0)) });
  });
}

for (const [sym, s] of symbols) {
  const rows = s.rows.sort((a, b) => a.t - b.t), offsets = new Map(), intervals = new Map(), gaps = new Map(), forms = new Map(), places = new Map(), out = [];
  let maxOffset = 0;
  rows.forEach((r, i) => {
    const off = r.t % HOUR, ev = r.t - off;
    bump(offsets, bucket(off)); bump(intervals, r.h); bump(forms, r.form); bump(places, r.places);
    maxOffset = Math.max(maxOffset, off);
    if ((ev / HOUR) % r.h !== 0) out.push(`off-grid event ${iso(ev)} h=${r.h}`);
    if (i === 0) return;
    const p = rows[i - 1], pev = p.t - (p.t % HOUR), d = (ev - pev) / HOUR, next = rows[i + 1];
    bump(gaps, d);
    if (d === 0) out.push(`duplicate event ${iso(ev)} (calc_time ${p.t} and ${r.t})`);
    else if (p.h !== r.h) out.push(`change ${iso(pev)} h=${p.h} -> ${iso(ev)} h=${r.h}, elapsed ${d} h, next ${next ? `${(next.t - next.t % HOUR - ev) / HOUR} h later h=${next.h}` : '-'}`);
    else if (d !== r.h) out.push(`unexplained gap ${d} h before ${iso(ev)} (h=${r.h})`);
  });
  console.log(`== ${sym}: files ${s.files} (${hist(s.notes)}), rows before 2025-10-17 ${rows.length}, first ${rows.length ? iso(rows[0].t) : '-'}, last ${rows.length ? iso(rows.at(-1).t) : '-'}`);
  for (const b of s.bad) console.log(`  BAD ${b}`);
  console.log(`  ms past the hour: ${hist(offsets)}, max ${maxOffset}`);
  console.log(`  interval hours ${hist(intervals)}; rate token ${hist(forms)}; exact decimal places ${hist(places)}`);
  console.log(`  hours between consecutive rows: ${hist(gaps)}`);
  for (const o of out.slice(0, LIMIT)) console.log(`  ${o}`);
  if (out.length > LIMIT) console.log(`  ... ${out.length - LIMIT} more lines not shown`);
}
console.log(`SCAN DONE symbols ${symbols.size}`);
```
