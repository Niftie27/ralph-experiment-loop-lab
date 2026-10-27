# F1a-3 plan second opinion

**tested — date:** `date -u`, once: Tue Oct 27 18:58:02 UTC 2026.

**reasoning — Verdict: approve with changes.** Adopt C1-C5, correct the precision claim, and make the reference-coverage and weekly-boundary contracts explicit before implementation. This is approval of the design direction, not evidence that the proposed implementation passes.

## Evidence and scope

- **tested:** The prescribed initial `git status --porcelain` printed nothing (one run); `git pull --ff-only` reported already up to date (one run); branch fetch succeeded (one run); `git log -1 --format=%h origin/f1/a3-aggregation` printed `80ff807` (one run). The plan was read with the supplied `git show`, without checking out its branch.
- **taken over — sources:** Plan sections a-n at `80ff807`; current main `docs/MAP.md`, `docs/findings.md`, `docs/factory-spec-f1.md`, `docs/state.md`; repository instructions and the source locations below. Code observations are static readings, not execution tests. Paths beginning `src/` below are relative to `experiments/strategy-destruction-filter/`.
- **taken over — plan a, c, h, j:** Claude's 204/204 tests, 966 exact-token comparisons, 10,715,220-row precision survey, coverage counts, reference listings and timings are PC evidence, not tests rerun by this reviewer. The throwaway scripts are not committed according to the plan; their execution and results are not independently verified here.
- **reasoning — input contract:** Aggregation needs verified Binance linear-perpetual instrument identity, strictly increasing minute opens, all nine value columns, research-only bounds and explicit missing-minute information. The proposed source has these interfaces; exact recovery of original decimals additionally depends on the PC survey, not merely the presence of Float64 columns. Funding, OI, exact orderflow and strategy-specific features are outside this aggregation contract; passing aggregation does not establish strategy-input completeness.
- **taken over — task constraints:** No Node runs, reference downloads, trading, new keys, subagents, scheduler changes or runtime changes are part of this review. No live hash-parity claim is made. The only authored artifact is this document; future ledger/contract/test changes below are recommendations for the PC author, not writes performed here.

## Open questions 1-7

1. **reasoning — agree with 1(a), compute on read now.** A second persistence/manifest protocol is premature before F1b establishes reuse. Require one aggregation per shared run/cache rather than repeating it in every variant child; the reported per-symbol cost is taken over from plan a, not newly measured.
2. **reasoning — agree with 2(a), strict omit now.** It preserves complete-bar semantics without silently teaching the existing engine to step across gaps; the XRP eligibility decision belongs in the F1b contract and ledger (C4).
3. **reasoning — agree with 3(a), all nine columns.** Quote and taker volumes are meaningful downstream inputs, and their inclusion catches errors an OHLCV-only comparison would miss. Specify correctly rounded Number equality separately from exact decimal equality (finding P1-1).
4. **reasoning — agree with 4(a), with C3 added.** Keep 1h/4h deciding and 1d/1w reported, but add a bounded, non-deciding 5m/15m sample per symbol to exercise the previously untested grids against external files.
5. **reasoning — agree with 5(a), subject to C1.** Partial Vision evidence plus exact-intermediate compositional tests is a reasonable response to absent weekly archives, but internal consistency is not independent exchange validation. Report the last externally compared week and unverified remainder separately for every symbol, including HYPE with no weekly reference.
6. **reasoning — agree with 6(a) for this phase, with C5.** Avoid a duplicate VPS workload now, but defer reproducibility evidence rather than declaring it unnecessary because E1 stores no artifact; computed outputs still have digests.
7. **reasoning — agree with 7(a).** No holdout aggregate or reference work is needed to validate research aggregation. Apply the boundary to the entire candle interval, not just its open time (P2-2).

## Claude's chat conditions C1-C5

- **reasoning — C1: agree.** Preserve coefficient/scale BigInt intermediates through both aggregation paths; compare the exact intermediate results and then compare final Number encodings after a single conversion. Do not feed rounded hourly/daily aggregate Numbers back through the 1m decimal-recovery routine. Include both four-hours/four-hours-of-1h and week/seven-days fixtures with sums exceeding 15 significant digits. **taken over — user-supplied Claude condition:** The synthetic demonstration of aggregate sums exceeding 15 digits was Claude's test; it was not rerun here.
- **reasoning — C2: agree.** The transport extraction must be a pure move in a separate commit. Preserve retry classification, four attempts, backoff, pause, redirects, timeout/size limits, CHECKSUM-first ordering, 404 handling, local checksum repair, version behavior and dependency-injection seams. **taken over — code:** These behaviors are implemented in `src/vision-1m.mjs:21`, `:74`, `:104` and `:124`. Keep the 1m caller's defaults, paths, summary and exits unchanged; the interval-aware parser extension is a different change, with unchanged 1m behavior as its regression contract. Existing tests passing is necessary but does not alone prove a move was behavior-neutral.
- **reasoning — C3: agree.** One fully research-contained month per symbol at 5m and 15m is a proportionate independent check. Choose and record months before examining results; use a listed full month for HYPE. Report files, rows, complete bars, equality, mismatches and skips independently of deciding 1h/4h status. Reference availability and sample size are not verified here; do not turn unavailable files into an equality claim.
- **reasoning — C4: agree.** Add an explicit F1b gate in the ledger: XRP full-window eligibility must be resolved before claiming the required cross-symbol evaluation is ready. **taken over — code and plan c:** `src/research-queue.mjs:26` requires every expected timestamp, while the plan omits one XRP 1h and one 4h candle. **reasoning:** Feeding those arrays to the unchanged function fails coverage. **taken over — code:** XRP is not currently in `SYMBOLS` at `src/research-queue.mjs:12`; therefore this is a future adapter/eligibility gate, not a claim that today's queue already evaluates and rejects XRP. Do not relax the gate or fill the missing candle in F1a-3.
- **reasoning — C5: agree.** Compare PC/VPS output digests when F1f runs on the VPS, using identical input snapshot hashes, instrument, windows, timeframes and aggregation code/version. Record counts and integrity metadata too. A mismatch blocks that deployment's parity acceptance; no reproduction or download is requested now. Canonical digest encoding must be specified first (P2-4).

## Other findings, P0-P3

### P0

**reasoning:** No P0 identified in the reviewed plan/source scope. This is not a runtime or security certification.

### P1-1 — Number equality does not prove exact decimal equality

**taken over — plan a:** The plan says exact float64 equality is "also exact decimal equality" after converting the exact aggregate and reference tokens to Number. **taken over — code:** `src/vision-source.mjs:80` and `:97` implement decimal-to-Number parsing; `:149` stores parsed values in Float64 columns. Longer decimals are accepted through `Number(...)`.

**reasoning:** C1 fixes the compositional test but not this comparison claim: conversion is many-to-one once aggregate/reference decimals exceed the guaranteed precision. Two different exact sums can round to the same Number. Required change: either define acceptance accurately as equality of correctly rounded numeric columns, retaining Claude's exact-token checks as separate evidence, or retain reference decimal tokens and compare scaled integers if exact-decimal acceptance is intended. Do not describe the Number-only compare as an exact-decimal proof. No failing implementation is alleged; implementation is still planned.

### P2-1 — Cache capacity alone does not make a reader call streaming

**taken over — code:** `src/f1-1m-reader.mjs:79` collects all requested units in `parts`; `:86` retains their decoded columns; `:91` allocates a combined result. Capacity at `:36` limits cached bytes, not those per-call retained parts.

**reasoning:** The plan's explicit month-by-month calls are essential, not optional optimization. Specify/test that the aggregator never calls `read` for the full multi-year window, releases each returned month, and keeps an in-progress weekly bar across month boundaries. Whole-process memory checks must cover result arrays and successive symbols, not merely one reader cache. The throwaway memory results do not verify the eventual implementation.

### P2-2 — Weekly source bounds and the holdout boundary need separate rules

**taken over — code:** `src/vision-source.mjs:123` derives its row cap from minute count; `:141` and `:142` enforce minute alignment/close; `:143` bounds the open time to the source file. `src/vision-source.mjs:210` defines calendar-file bounds. `src/f1-1m-reader.mjs:28` protects 1m requests but does not protect a new reference downloader/parser.

**reasoning:** For weekly references, count grid opens inside the calendar file for the row cap; do not simply floor file duration divided by seven days. A Monday-labelled weekly row can legitimately close outside its source month/day. Separately, a research reference candle must end at or before the research cutoff before its values are admitted. The week opening 2025-10-13 crosses that cutoff despite its research-side open. Today's reported absence of that weekly archive is not a durable guard. Add a poisoned boundary-week reference fixture and distinguish source-file ownership from research containment.

### P2-3 — Specify deciding-reference coverage as an accounting partition

**taken over — plan i:** Missing rows fail, quarantined reference rows are skipped, and counts include complete aggregates without reference rows. **taken over — code:** `src/vision-source.mjs:164` through `:174` quarantine value-rule failures and return accepted columns separately from quarantine records.

**reasoning:** Define disjoint dispositions for every complete aggregate: equal, mismatched, reference-quarantined, absent-row, or absent-file. State explicitly whether a quarantined deciding reference leaves the compare incomplete or is an approved exception; otherwise "every complete bar equals" conflicts with a successful comparison that silently skips one. Require reconciled counts and no vacuous zero-compared success for a populated deciding window. This clarifies the gate before implementation rather than changing it after results.

### P2-4 — Canonical output identity must include integrity state

**taken over — plan e/f:** Results contain instrument, timeframe, window, input units, module hash, columns, incomplete and empty lists; the digest wording explicitly mentions columns and the incomplete list but not empty ranges.

**reasoning:** Define one canonical digest schema with explicit byte order, column order, chronological metadata order and treatment of empty ranges. Include the identity/window and all integrity lists, or bind their separately named hashes into a result hash. Record a code revision as well as the module hash when helper code affects results. This makes C5 reproducible and prevents an omitted empty range from being invisible to a digest-only comparison.

### P2-5 — Full-window completeness is not historical availability

**taken over — plan f:** The plan says a week counts only after closing, "which P1 already gives." **taken over — code:** `src/f1-1m-reader.mjs:69` accepts a window, not a per-decision as-of time; it can return all research data requested at once.

**reasoning:** P1 prevents structurally partial bars, but a complete historical week in a batch array still contains future minutes relative to Monday's decision. Correct that wording now and record the F1d adapter obligation: use an HTF bar only when `open_time + interval <= decision_time`. Add the future-bar mutation/as-of test in F1d; no engine change belongs in this phase.

### P3 — Make the evidence boundary durable

**taken over — plan a and g:** Precision/performance checks used uncommitted throwaway scripts and prior-art claims have mixed evidence statuses.

**reasoning:** In the implementation report, preserve the reproducible precision-survey method, exact input hashes, command/version and result counts; keep the unavailable weekly tail explicitly unverified. No expansion into new packages or benchmark work is necessary for this review.

## VPS collisions outside the repository

**taken over — user-supplied Claude result:** Inside the repository, only F1 modules and tests import `src/vision-1m.mjs`, `src/vision-source.mjs` or their transport. This import inventory was not rerun here.

**taken over — `docs/state.md`, sections (a)-(d), (h):** The documented runtime entrypoints are collectors, watcher/reactor scripts and maintenance/scheduling components, not these F1 modules. Much of that inventory is explicitly a 2026-10-18 snapshot; the document also records incomplete downstream mirroring. It is not current exhaustive external-consumer evidence.

**reasoning — answer: not verified.** No supplied exact R7 command inventories current external runtime imports, dynamic loading or subprocess calls. No current code/log evidence read in this review establishes their absence across everything running outside the repository. Therefore there is no justified "no collisions" claim, and no replacement process/import checker was invented. A future runtime consumer inventory is a deployment precondition, not grounds to run or alter watchers now. Current whole-chain runtime/repo SHA-256 equality is likewise not verified here; historical equality in `docs/state.md` is not fresh proof.
