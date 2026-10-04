---
type: note
created: 2026-09-21T07:30:00Z
topic: strategy-destruction-filter
status: internal
work_item: validation.strategy-filter-purged-embargo-verifier-assertion-map
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - audit
related:
  - ./2026-09-20-strategy-filter-purged-embargo-split-design.md
  - ./2026-09-20-strategy-filter-purged-embargo-implementation-scope.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/src/engine.mjs
  - ../../experiments/strategy-destruction-filter/src/verify-filter.mjs
---
# Strategy Filter Purged Embargo Verifier Assertion Map

Bounded work item: `validation.strategy-filter-purged-embargo-verifier-assertion-map`.

## Question

Where should the next purged/embargo implementation slice attach, and what assertions should prove it before any candidate interpretation changes?

## Local Statistics

The current public/no-key strategy-filter report remains non-promotional:

- Generated: `2026-09-17T07:35:11.990Z`
- Candidates: `13`
- Variants: `131`
- Survivors: `0`
- Effective survivor shapes: `0`
- Rejected: `131`

Report-shape checks over `filter-report.json`:

- `131 / 131` verdict rows lack per-variant purged/embargo split metadata.
- `0 / 131` rows have current in-sample plus out-of-sample sample mismatches.
- `0 / 131` rows have current candidate-vs-baseline total sample mismatches.
- Gate-group diagnostics still report `25 / 131` OOS passers; a stricter local proxy requiring OOS sample >= `30` and positive OOS expectancy finds `21`, with `1` carrying exactly `30` OOS trades.

The existing chronological split is internally consistent, but it cannot prove boundary independence because `engine.mjs` labels trades only as `index < splitIndex ? "in_sample" : "out_of_sample"`. `verify-filter.mjs` currently asserts chronological split, baseline identity, split sample sums, baseline sample parity, walk-forward diagnostics, and survivor gates; it does not yet assert `purged_boundary` accounting or candidate/baseline parity after boundary exclusion.

## Implementation Map

Smallest next code/report slice:

- In `engine.mjs`, introduce a split classifier beside `splitIndexForCandles` that returns `in_sample`, `purged_boundary`, or `out_of_sample` using `splitIndex`, `purgeBars`, and `embargoBars`.
- Default both `purgeBars` and `embargoBars` to `timeframe.maxBars`; allow config only to widen them.
- Apply the same split label to candidate trades and `time_matched_alternating_direction` baseline trades at the same signal timestamp.
- Exclude `purged_boundary` rows before computing `stats`, `splitStats`, `baseline.splitStats`, `baseline.comparison`, `walkForward`, `worstSlices`, verdict failures, survivor shapes, and rejected-ledger promotion metrics.
- Emit per verdict `splitMetadata` with `method`, `splitIndex`, `cutoffTime`, `purgeBars`, `embargoBars`, `purgedBoundaryTrades`, `inSampleTrades`, and `outOfSampleTrades`.

Verifier assertions to add before changing any gate language:

- Report-level split method is `purged_embargo_entry_time` when overlapping-label candidates are present.
- Every verdict has `splitMetadata.method`, integer `purgeBars`, integer `embargoBars`, and non-negative boundary/in-sample/OOS counts.
- `splitMetadata.inSampleTrades + splitMetadata.outOfSampleTrades === stats.sample`.
- `splitMetadata.purgedBoundaryTrades` is reported even when zero.
- Candidate and baseline total samples still match after boundary exclusion.
- Candidate and baseline in-sample/OOS samples still match after boundary exclusion.
- No survivor can pass below existing `minSample` or `minOutOfSampleSample` after boundary exclusion.
- The readiness audit keeps `purged-embargo-split` failing until these fields and assertions are present in a fresh report.

## Reassessment

The next useful step is now precise enough for a small implementation pass. The current filter is already rejecting every variant, so this work should be treated as validation hygiene and leak prevention, not as a path to promotion. If post-purge sample counts fall, the correct outcome is more rejection or Watch-only status, not looser thresholds.

## Self-Check

- Stayed internal and research-only.
- Chose exactly one bounded work item.
- Used no web/source checks.
- Ran local statistics over the current filter report and inspected only directly relevant local source files named by the selected router lane.
- Produced one durable note plus minimal router/queue/state/log breadcrumbs.
- Did not change strategy code, thresholds, scheduler/cadence, alert wording, data capture, account/key/API access, paid services, risk/sizing/TP/SL, execution, public posting, or strategy promotion.
- No Telegram notification gate met.
