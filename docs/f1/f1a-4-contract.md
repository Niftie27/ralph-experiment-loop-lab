# F1a-4 contract

Binding contract for F1a-4 (funding-rate history with intervals), so Codex, the VPS agent and Claude Code review against the same text (decision 24). It consists of:

1. The plan `docs/f1/f1a-4-plan.md` at `c64902b`.
2. Tomas's approval below, verbatim as sent on 2026-10-28.
3. The binding decisions, rules, dispositions, tests, ledger proposals and hours estimate below, written by Claude Code on 2026-10-28 from that approval and the instructions of Claude in chat. Where they differ from the plan, this contract wins.

Labels: **tested** (how, how many items), **taken over** (from where), **reasoning**, **not verified**. The second opinion `docs/f1/f1a-4-plan-second-opinion.md` (main `e6ad34d`, VPS agent) is taken over throughout. Paths are relative to `experiments/strategy-destruction-filter` unless they start with `docs/`. No rate values appear here, and nothing about rows, files or sizes from 2025-10-17 on.

## Approval (verbatim)

Q: Jak dál s F1a-4? (a) = Claude Code napíše kontrakt: m1, m3, m4, m5, m7 podle doporučení; m2 jen jako 'proxy' mark price; m6 s novou třídou 'most na novou mřížku'; m9 → brána před F1c (kontrola hodinových epizod jiných symbolů před 2025-10-17); u každého bodu Q4 přijato/zamítnuto s důvodem; kód až po mém review kontraktu.
A: (a) Kontrakt se změnami (doporučeno)

Earlier the same day Tomas chose m8 (a) (taken over from Claude in chat; no verbatim text available).

## 1. Binding decisions

- **m1 (a) Source rule V1.** Binance Vision monthly fundingRate files are the only source of settlement time, rate and interval. REST is a reported, never-deciding cross-check outside F1a-4 code. A disagreement found by a later comparison is recorded as unresolved and blocks any claim of validated funding inputs until it is adjudicated; REST never overwrites Vision (second opinion Q2.1, adopted; ledger proposal L4).
- **m2 (a) as a proxy.** The trade close of the 1m candle that opens one minute before the settlement is a **mark-price proxy**, never "the mark price". Its error figures hold only for their sample: 1,708 of 1,725 settlements in 17 symbol-months, 2024-08..2025-09 (tested, plan section b; the first settlement of each month was not compared). No whole-history bound, no extrapolation to earlier years and no "10 times" figure is claimed: payment error per settlement is abs(rate) × abs(proxy / mark - 1), and both factors can rise together in stress periods (reasoning, second opinion C2). Missing-proxy policy and a stress comparison go to the payment phase (ledger L2). Final wording for the cell of the spec row "Intraday and swing (F1)" in `docs/factory-spec-f1.md` (Claude files it in a docs batch; this contract does not edit the spec):

  > Binance USD-M regular taker 5 bps + 3 bps slippage per side (16 bps round trip); every report also at 2× costs. Funding from the Binance Vision funding-rate history with each contract's actual interval (some settle every 4 h, others every 8 h, some for a while every 2 h or 1 h): a position open at a settlement pays or receives size × mark price × the settled rate (longs pay when the rate is positive). F1 uses a mark-price proxy, the trade close of the 1m candle before the settlement; in its sample (1,708 settlements, 2024-08 to 2025-09) the proxy differed from Binance's mark price by at most 15 bp of price and the payment by at most 0.002 bp of notional; no bound is claimed outside that sample. Stops trigger on trade price; mark-price data are otherwise needed only if liquidation is modelled, which F1 does not.

- **m3 (a) Holdout integrity.** Per holdout month only: availability, CHECKSUM verification, and pass or fail of the parse and of the schedule check. No settlement counts, interval values, settlement times, row numbers, sizes or failure details. A failing or unresolved holdout month blocks every holdout evaluation; it is never repaired by inspecting holdout rows, only through rules developed on documentation and research inputs (second opinion Q2.3, adopted).
- **m4 (a) October 2026.** Outside F1a-4. Before any holdout look (F1c), a separately approved step adds that month's file and reads only its rows before 2026-10-17, leaving later rows unread. Until then holdout evaluation is blocked; a pass of the earlier holdout months does not certify the whole holdout (second opinion Q2.4, adopted).
- **m5 (a) Storage S1, compute on read.** No manifest and no snapshot format. Identity and digest, binding: the digest is the sha256 of the canonical JSON (`canonicalJson` of `src/f1-1m-format.mjs`: keys in plain code-unit order) of `{ schema: 'f1-funding-v1', instrument: {exchange, market, contract}, dataStart, dataEnd, sources: [{file, sha256}] in file order, coverage, anomalies, columns }`, where `columns` holds the settlement-ordered arrays `settlementTime`, `calcTime`, `rate` (canonical exact decimal strings, not Numbers), `intervalHours`, `elapsedHours` and `sourceIndex`; `coverage` and `anomalies` are in chronological order. Code identity is recorded beside the digest, not inside it: the sha256 of every module in the local import closure of `src/f1-funding.mjs`, sorted by path, plus the git revision. The 2025-10 file's sha256 is part of research provenance; it never authorises statistics about that file's holdout rows (second opinion Q4 e/f/h, adopted). A shared in-process cache for consumers (second opinion Q2.5) is rejected for F1a-4: no consumer exists yet; F1b decides it.
- **m6 (a) Stop rule with a new transition class.** Section 2 defines the class "bridge to the new grid". Every other unexplained gap or off-grid settlement in the research, and every coverage case section 3 marks as unresolved, stops the phase for an amendment; nothing is filled.
- **m7 (a) Parser bounds as a chosen validation policy, not an exchange guarantee.** A row fails its file unless `calc_time` mod 3,600,000 is below 15,000 ms and the interval is one of 1, 2, 4, 8. A time just before the hour (remainder near 3,600,000 ms) fails: signed offsets are not accepted. Changing either bound needs a new decision. The FAQ's 15-second deviation concerns account fee timing (payment phase), not archive timestamps; the two are separate (second opinion Q2.7, adopted).
- **m8 done.** The Appendix A check ran (section 4) and the second opinion `e6ad34d` exists.
- **m9 replaced by (c).** A separately approved, research-only check (data before 2025-10-17 only) of hourly episodes in other symbols, entry and exit, including the `funding_interval_hours` labels on the boundary rows, is a gate before F1c accepts funding integrity. It is not part of F1a-4. Candidates come from historical announcements, not from current fundingInfo (ledger L1).

## 2. Schedule check and the bridge to the new grid

For each research settlement r and its predecessor p (the previous settlement of the instrument, read from the previous month's file when needed and from rows before the research window when r is the first research settlement; never from a sealed row), with p.h and r.h the published intervals and d = (r.settlementTime - p.settlementTime) / 1 h:

| Case | Class | Result |
| --- | --- | --- |
| Rows of one file not strictly increasing in `calc_time` in source order, or two rows with one settlement hour | disorder or duplicate | file fails, exit 1 (checked before any sorting) |
| r's settlement hour (from 00:00 UTC) is not a multiple of r.h | off-grid | stop |
| p.h == r.h and d == r.h | regular | ok |
| p.h == r.h and d != r.h | unexplained gap (not loosened) | stop |
| p.h != r.h and (d == p.h or d == r.h) | interval change | ok (the three SOLUSDT 2022-11 changes) |
| p.h == 1, r.h == 4, 1 < d < 4, r on the 4 h grid | **bridge to the new grid** | ok, recorded with its times |
| any other change | unexplained change | stop |

Since r is on the 4 h grid and d < 4, r is the first 4 h grid point after p, so a bridge has d = 2 or d = 3 (reasoning).

Why the bridge exists (**tested**: one read of the public CMS endpoint `https://www.binance.com/bapi/composite/v1/public/cms/article/detail/query?articleCode=6d707b1f7ae34f419621b4c807464ab1`, HTTP 200, 56,443 B, 2026-10-28): Binance's announcement "Important Updates on Funding Rate Settlement Frequency of USDⓈ-M Perpetual Contracts (2025-09-01)", published 2025-08-31, makes the return from 1-hour to 4-hour settlement automatic from 2025-09-01 00:00 UTC; its TREEUSDT example adjusts the setting at 2025-08-31 14:15 UTC after the hourly settlement at 14:00, and the next settlement is 16:00, then 20:00 and 00:00; it lists the 4-hour grid 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC. The example is a conditional schedule, not evidence that it happened (reasoning, second opinion Q5).

Change against the proposal of Claude in chat (reasoning): the proposal admitted any p.h < r.h. This contract admits only 1 -> 4, the one return documented by a source read (the September announcement; the FAQ section 8 rule from 2026-01-02 also returns to 4 hours, tested below). A short gap between other intervals (for example 2 -> 8 on the 8 h grid) is undocumented, so it stops for an amendment instead of passing silently.

**Not verified** by anyone: which `funding_interval_hours` Vision writes on the boundary rows of an hourly episode (second opinion Q5 (c)). If Vision labels the bridge row with the old interval (16:00 with h = 1, d = 2), the same-interval rule stops the research run, which is intended; the m9 (c) gate settles the labels. The research scan (section 4) contains no hourly episode, so the bridge class changes no research result today (taken over, scan).

Settlement grids: the FAQ gives the default 8-hour settlements at 00:00, 08:00 and 16:00 UTC (**tested**: raw article text from the same CMS endpoint, `articleCode=360033525031`, HTTP 200, 91,413 B); the September announcement gives the 4-hour grid above (tested). All grids are anchored at 00:00 UTC; whole-hour intervals alone would not prove that (second opinion Q4 c:49, adopted).

## 3. Coverage at the edges

Pairwise checks never pass vacuously (second opinion Q7 P1, adopted). Per instrument and research window:

| Case | Rule | Result |
| --- | --- | --- |
| Leading edge, instrument listed before the window (BTC, ETH, SOL, XRP, DOGE) | The first research settlement is checked against its predecessor in the 2021-10 file (rows before 2021-10-18 are not sealed) | as section 2 |
| Leading edge, instrument listed inside the window (HYPE) | Before listing: the months proven not_listed by the F1a-2 listing rule. Listed but before the first charge: from the first 1m candle in the F1a-2 manifest (2025-05-30T10:30Z, taken over from `docs/f1/f1a-2-vision-1m.md`) to the first settlement; the first settlement must be the first grid point of its interval after that candle (12:00 for 4 h), else an earlier settlement may be missing | ok or stop (unproven missing first settlement) |
| Trailing edge | 2025-10-17T00:00Z minus the last research settlement must not exceed that settlement's interval (8 h: last at 16:00; 4 h: 20:00), decided without reading a sealed row | ok or stop |
| Empty listed file | A verified file with no settlement in its research part | stop |
| Gap month | 404 on both without not_listed evidence | exit 3; `elapsedHours` null after it |
| Prior evidence | The 2021-10 files carry rows before the research window; they are read for the predecessor only | not reported as research |

The plan's single "pre-listing span" is replaced by the two spans above ("before listing", "listed, before the first charge"); the plan wrongly called the whole prefix "the contract did not exist" (second opinion Q7 P2, adopted). Reasoning for HYPE: the 4 h grid points around listing are 08:00 (before the first candle) and 12:00, so 12:00 is the first possible settlement.

## 4. Evidence corrections and the completed scan

- **Scan (taken over: Tomas ran the plan's Appendix A commands on the VPS over SSH, 2026-10-28, Node v24.22.0; full output in the prompt of Claude in chat):** 342 files, `TOTAL ok 342 missing 0 mismatch 0`, download exit 0, scan exit 0; every header and member name accepted; intervals 2, 4 and 8 h only; no 1-hour episode; the only interval changes are the three SOLUSDT 2022-11 changes of plan section c; no BAD, duplicate, off-grid or unexplained-gap line. Rows before 2025-10-17: BTC 6,348, ETH 6,348, SOL 5,653, XRP 6,332, DOGE 5,774, HYPE 837. This is completed evidence; the commands are not to be rerun. It supersedes the plan's description of the check as a step still to run.
- **Offsets:** the full scan's maximum is 47 ms (HYPE 20 ms; taken over, scan). Every place where the plan says "seen at most 30 ms" (sections a, c and the test list) reads 47 ms; 30 ms remains the figure for the 8 PC samples only (tested, plan).
- **Decimal places (correction of Claude in chat's claims):** BTCUSDT has no row with 2 exact decimal places and 2 rows with 3; SOLUSDT has 7 rows with 2 and 1 with 3 (taken over, scan). A decimal-place count is not a magnitude bound in general: an 8-place value can be large (reasoning). The scan's place count is a heuristic that can overcount exponent spellings with trailing zeros in an integer mantissa (second opinion Q7 P2); none is known to exist, and the parser computes exact places (section 6).
- **Completeness (correction):** "sum of gaps == first-to-last span" always holds because it telescopes; it proves no completeness, it only showed that the pasted output was intact. The gap histogram rules out internal gaps among the observed rows; a missing first or last row is ruled out by neither (reasoning). For BTC, ETH, SOL, XRP and DOGE the research window lies strictly inside each observed span, so their research edges are interior rows (reasoning from the scan's first and last times); HYPE's leading edge is handled by section 3.
- **Sizes, research-only months (tested: the monthly listings of 2026-10-28, months 2021-11..2025-09):** 240 zips, 212,371 B in all, the largest 1,620 B (SOLUSDT 2022-11). The 2021-10 files (5, 4,715 B) also hold rows before the window. The 2025-10 files hold holdout rows and are in no size figure. The plan's byte total, its largest-file figure, its publication-timing figures and its estimated holdout row counts (sections a, e) are withdrawn; planned file names and counts derived from month names stay plan text, not measurements.
- **fundingInfo:** the plan's live fundingInfo values and row count are withdrawn as evidence. That fundingInfo is no interval history rests on its documentation, which has no time query (taken over, second opinion Q5 source 5).
- **FAQ:** the plan's "raw page text not verified" is replaced: the raw article text was read through the CMS endpoint (tested, section 2), including "Funding Amount = Nominal Value of Positions * Funding Rate", "(Nominal Value of Positions = Mark Price * Size of a Contract)", the 15-second transaction deviation, the 08:00:05 example and the section 8 rule effective 2025-05-02 08:00 UTC. The May 2025 announcement itself was not read by Claude Code (taken over, second opinion Q5 source 2). The FAQ's rate formula is not implemented in F1a-4.

## 5. Disposition of the second opinion

Q4 rows (line references are to the plan at `c64902b`):

| Q4 row | Disposition | Reason | Lands in |
| --- | --- | --- | --- |
| a:9 separate data-layer acceptance | adopted | F1a-4 accepts the research data layer and holdout integrity up to the m4 month only; payment and feature readiness are not claimed | sections 1 (m3, m4), 6 |
| a:14-15, e:90-93, h:151 mixed-period sizes | adopted in part | Byte totals, largest-file and timing figures withdrawn and replaced by tested research-only figures; planned file counts stay plan text | section 4 |
| a:16-19 sample vs full scan | adopted | The 8 PC samples stay a labelled sample; the scan is taken-over evidence; no REST claim widened | section 4 |
| a:20-21, g:130 live fundingInfo | adopted | Current settings are not historical evidence and postdate the research | sections 1 (m9), 4 |
| a:23, g:131-132 FAQ and September notice | adopted | Both read through the CMS endpoint (tested); transaction delay kept apart from archive offsets | sections 1 (m7), 2, 4 |
| a:26, b:30, b:43-45 proxy and error claims | adopted | Proxy wording, sample-only figures, first-of-month gap, joint stress risk | section 1 (m2); ledger L2 |
| c:49 offsets, grid anchor, 15 s | adopted | 47 ms restated; grids from sources; 15 s is policy | sections 1 (m7), 2, 4 |
| c:54, n:202 pre-first-charge | adopted | Two spans and an unresolved case defined | section 3 |
| c:58-59, c:74 transition policy | adopted in part | A documented transition class replaces the universal predicate; the bridge is limited to the documented 1 -> 4 return, unchanged-interval gaps are not loosened | section 2 |
| c:61, c:76, i:163, n:203/205, Appendix A:215/230 scan status | adopted | Scan recorded as completed; no histogram-sum proof | section 4 |
| d:81-82, i:155-159, j:171 integrity path | adopted | Integrity check separate from the research reader; a failure located in sealed rows is reported only as "sealed part of <file> fails" and fails closed; reading `calc_time` for seal routing and order is allowed, no other sealed field | sections 1 (m3), 6 |
| e:90/93, f:104/117, h:151 digest and identity | adopted | Canonical digest bytes and code identity defined | section 1 (m5) |
| f:112 exact decimals | adopted in part | Exact decimal (sign, digits, scale) computed from the token; Number derived from the canonical decimal; canonical zero; more than 8 exact places fails. Rejected: retaining the original token text, because the verified zip, bound by its sha256, already keeps the bytes | sections 1 (m5), 6 |
| f:114/117, i:155-159, j:172-174 predecessors and edges | adopted | Predecessor reads, edges, empty files, gap months defined | sections 2, 3, 6 |
| f:119, n:204/211 event order and as-of | adopted in part | Stay proposals for later phases; the symmetric boundary matrix and the meaning of "adverse" are specified there, not in F1a-4; the one-minute lag is a conservative model, not measured latency | ledger L2, L3 |
| g:134-137, h:149, n:211 ccxt, adjudication, C8 priorities | adopted in part | ccxt stays rejected (its paginator assumes 8 h); adjudication and corrected priorities go to the full comparison, not F1a-4 code | section 4; ledger L4 |
| i:161 consistency vs completeness, parity | adopted | Interval-versus-gap is a consistency check; PC/VPS digest parity is deferred evidence, not unnecessary | section 4; ledger L5 |
| j:170-173 tests | adopted | All named cases are in the test list | section 6 |
| k:180, l:184 contract, estimate, MAP | adopted | This contract; new estimate; MAP in the phase-changing commit (F21) | sections 7, 8 |
| m:189/193-196, n:203/205/211 m2, m6, m8, m9 | adopted | As decided by Tomas | section 1 |
| Appendix A:338-339, 344, 354-356, 366 scan limitations | adopted | Limits recorded: place heuristic, sorting before checks, change rows not tested against the gap rule, unconditional SCAN DONE. The evidence therefore rests on reading the printed output (no BAD line), not on the exit code; the scripts are not altered or rerun | section 4 |

Q7 findings:

| Finding | Disposition | Reason | Lands in |
| --- | --- | --- | --- |
| P1 transition model too narrow | adopted in part | Bridge class for the documented 1 -> 4 return only; other short changes still stop | section 2; ledger L1 |
| P1 completeness can pass vacuously at the edges | adopted | Edge, empty-file and first-settlement rules | section 3; tests |
| P2 scan diagnostics are not the production validator | adopted | The production parser checks source order before sorting, applies the gap rule to change rows, fails on any anomaly and computes exact places | sections 2, 6 |
| P2 payment proxy and event order | adopted in part | Not implemented in F1a-4; event order, ties, flips, missing proxy without forward fill and a stress comparison are specified for the payment phase | ledger L2 |
| P2 pre-first-charge vs pre-listing | adopted | Two spans and listing evidence | section 3 |
| P2 identity, mutability, availability | adopted in part | Canonical hash and dependency identity now; `read` returns fresh typed-array copies in a frozen object, as `openResearch1m` does, never views; F1d as-of tests and F1f parity are later | section 1 (m5); tests; ledger L3, L5 |
| P3 documentation and stale status | adopted in part | Corrected C8 counts, CMS route and September notice recorded here; the FAQ formula is not implemented (its clamp-order issue, taken over, does not matter to F1a-4); MAP and sources updates and pinning external code revisions are left to Claude's docs batch and the later comparator | sections 2, 4; ledger L4, L6 |

Counts: Q4 21 rows (16 adopted, 5 adopted in part, 0 rejected); Q7 7 findings (3 adopted, 4 adopted in part, 0 rejected). Rejected parts: retaining the original token text (inside f:112) and, outside Q4 and Q7, the consumer cache of Q2.5 (section 1, m5).

## 6. Tests (TDD, synthetic fixtures only, no real rates)

Fixtures are one-member zips built in the tests from a few rows with placeholder rates; no Vision file, no real rate. The 264 existing tests stay unchanged.

- Offsets: remainders 0, 47 and 14,999 ms pass; 15,000 ms fails; a time just before the hour (remainder 3,599,990 ms) fails.
- Intervals: 1, 2, 4 and 8 pass; 0, 3, 6, 12 and 24 fail.
- Bridge: 1 h row at 14:00 then 4 h row at 16:00 (d = 2) passes as a bridge; 13:00 then 16:00 (d = 3) passes; a bridge row off the 4 h grid (14:00 then 17:00) stops; a bridge row labelled with the old interval (16:00, h = 1, d = 2) stops; a short gap between other intervals (2 h then 8 h on the 8 h grid, d = 4) stops.
- Unchanged interval: a gap of 16 h between two 8 h rows stops.
- SOL-like 8 -> 4 -> 2 -> 8 sequence passes, published labels and elapsed hours kept.
- Order: a row earlier than its predecessor in source order fails before any sorting; two rows in one settlement hour fail.
- Edges: first research settlement 2021-10-18T00:00 with its predecessor 2021-10-17T16:00 in the same file passes (out-of-window predecessor); first research row at 08:00 after a 16:00 predecessor stops; a month's first settlement takes its predecessor from the previous month's file; last research settlement 2025-10-16T16:00 (8 h) passes, 2025-10-16T08:00 as the last stops; a HYPE-like instrument with first candle 10:30 and first settlement 12:00 passes, 16:00 stops; an empty listed file inside the research stops; a gap month gives exit 3 and `elapsedHours` null after it.
- Tokens: an exponent and a plain spelling of one value give the same canonical decimal and the same Number; an integer mantissa with trailing zeros (`100E-10`), `1.0E-8` and `0.00000001` are equal and have 8 exact places; negative zero spellings give canonical zero; 9 exact places fail; malformed tokens fail.
- Seal: rows at or after 2025-10-17T00:00Z carry poison tokens and a marker; a research read passes, and no column, count, coverage entry, digest input, report line or error message contains the marker or any sealed time; a sealed row with a malformed `calc_time` fails the file with a message that names only the file and "sealed part".
- Holdout integrity: the report holds per month only availability, CHECKSUM and pass or fail; a failing holdout month exits 1 with no row detail.
- Reader: refuses windows outside the research window; returned columns are fresh copies (mutating them and their buffers does not change a second read).
- Digest: identical across reversed source enumeration and reruns; changes when a source sha256 changes; code identity lists every module of the import closure.
- Store and listing: two local versions of a month exit 1; the not_listed evidence rule for HYPE months; the refactor of `notListedSources` keeps every 1m test green.
- Memory: a guard trip aborts the run (injected check).

## 7. Ledger proposals for Claude to file

Claude Code edits none of `docs/ledger.md`, `docs/decisions.md`, `docs/state.md` or `docs/MAP.md` in this step.

- **L1 m9 (c) gate before F1c:** a separately approved, research-only check (data before 2025-10-17 only) of hourly episodes in other symbols, entry and exit, including the boundary-row interval labels; candidates from historical announcements, not current fundingInfo; frozen samples, checks and failure policy written before it runs.
- **L2 Payment phase (with I75 a, I84 c):** event-order rule as a symmetric matrix (long and short; entry, exit and flip; fill before, inside or after the 15-second window around a settlement), with "adverse" defined as the side that pays; the mark-price proxy, and a missing proxy minute makes that payment unresolved, never forward-filled; a research-only stress comparison of the proxy against Vision mark-price candles.
- **L3 F1d as-of rule for funding:** a settled rate is usable only for decisions at or after settlementTime + 1 minute and never before `calcTime` (a conservative model, not measured latency), with future-mutation tests.
- **L4 I84 (a) full REST-versus-Vision funding comparison:** SOLUSDT's seven 2-place rows first, then the three 3-place rows (BTCUSDT 2, SOLUSDT 1), then every research settlement; disagreements recorded as unresolved and blocking any validated-inputs claim until adjudicated; no reliance on ccxt's 8-hour paginator; external code revisions pinned.
- **L5 F1f parity:** PC and VPS funding digests on identical input hashes, coverage and anomalies included (with F1a-3 C5).
- **L6 Docs batch:** the m2 spec-row wording of section 1; `docs/research/sources.md` gains the CMS route and the September 2025 announcement.

## 8. Hours estimate for the rest of F1a-4 (decisions 44, 46)

Measure: wall clock from the plan commit `c64902b` (author time 2026-10-28T17:40:29Z) to the merge commit. The plan estimated about 12 h, range 8-20 h. New estimate: about 14 h, range 10-26 h (reasoning). Added since the plan: the bridge class, edge coverage, the digest schema, the sanitized integrity path and about 15 more tests (+2 h). Remaining after this contract, in wall-clock hours: Claude's contract review 1-3; refactor 0.5; glossary 0.3; parser with tokens and bounds 1.5; download 0.7; verify with schedule, edges and holdout integrity 2; reader and digest 1.5; full run and report with MAP 0.5; PR and up to 3 Codex rounds (decision 42) 2-3. The top of the range is one overnight wait. Agent time is reported as information only.

## Amendment 1 (verbatim)

F1a-4 amendment 1 (Tomas, 2026-10-28). Input: the review of this contract at 27a777f by Claude in chat (four text findings; no code existed yet).

Q: Jak s kontraktem F1a-4? Doporučuju (a): opravy 1–4 jako amendment 1 v prvním commitu implementačního kola. Codex pak reviewuje už proti opravenému textu a neztratíme celý cyklus.
A: (a) Schválit, amendment 1 jako 1. commit implementace (doporučeno)

Where this amendment differs from sections 1-8, this amendment wins.

A1. Research reader and holdout integrity are separate paths (fixes a conflict between m3, section 2 and the Q4 row d:81-82). The section 2 rule that a predecessor is never taken from a sealed row, and the Q4 row d:81-82 rule that only `calc_time` of a sealed row may be read, govern the research reader and everything it returns or reports. The holdout integrity path reads every field of the holdout units: "2025-10 sealed part" (the 2025-10 rows at or after 2025-10-17T00:00Z) and the months 2025-11..2026-09 (HYPE likewise). It applies the parser rules (section 1 m7, section 6) and the section 2 table to every holdout settlement and its predecessor, including the boundary pair of the last research settlement and the first holdout settlement, which counts toward "2025-10 sealed part". An empty holdout unit fails. Per unit it reports only availability, CHECKSUM and pass or fail; a failure message names only the unit. No count, time, interval, rate, row number or size of a holdout row leaves the integrity path, and nothing from it enters the research reader's columns, coverage, anomalies or digest. October 2026 stays outside F1a-4 (m4). Tests: a holdout fixture with an unexplained gap fails its unit with no row detail; a schedule failure in the boundary pair fails "2025-10 sealed part" only; an empty holdout unit fails; a research read and its digest are unchanged by any holdout fixture.

A2. Section 2: the clause "the FAQ section 8 rule from 2026-01-02 also returns to 4 hours, tested below" is withdrawn as unverified; section 4 records no such date. The bridge class rests on the September 2025 announcement alone. Whether the FAQ's section 8 rule changed after 2025-10-16 is not verified; if a holdout unit fails, documented rule versions are the only repair route (m3).

A3. Section 4, completeness: "For BTC, ETH, SOL, XRP and DOGE the research window lies strictly inside each observed span, so their research edges are interior rows" holds for the leading edge only. The scan reads no row at or after 2025-10-17T00:00Z (plan section d), so the last research settlement of every symbol is the last observed row, and the trailing-edge rule of section 3 is the only check of it.

A4. Section 6 adds to and changes the plan's test list (plan section j); every plan test it does not change stays, with 30 ms read as 47 ms. This includes: a settlement at 2025-10-17T00:00:00.002Z is holdout; the exact header and the numeric first-row variant; 3 fields; a 13-digit `calc_time` inside the file's month; missing final newline, CRC and member-name errors fail; `fundingSource` names and `planFundingUnits` (2021-10..2026-09, 2025-10 split at 2025-10-17, 2026-10 never planned, HYPE months).
