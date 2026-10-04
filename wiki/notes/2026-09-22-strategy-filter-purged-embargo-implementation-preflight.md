---
type: note
created: 2026-09-22T07:30:00Z
topic: strategy-destruction-filter
status: internal
work_item: validation.strategy-filter-purged-embargo-implementation-preflight
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
related:
  - ./2026-09-20-strategy-filter-purged-embargo-split-design.md
  - ./2026-09-20-strategy-filter-purged-embargo-implementation-scope.md
  - ./2026-09-21-strategy-filter-purged-embargo-verifier-assertion-map.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
  - ../../experiments/strategy-destruction-filter/src/engine.mjs
  - ../../experiments/strategy-destruction-filter/src/verify-filter.mjs
---
# Strategy Filter Purged Embargo Implementation Preflight

Bounded work item: `validation.strategy-filter-purged-embargo-implementation-preflight`.

## Question

What is the smallest safe code slice for implementing purged/embargo split accounting without changing strategy interpretation?

## Local Statistics

The current report remains non-promotional:

- Generated: `2026-09-17T07:35:11.990Z`
- Candidates: `13`
- Variants: `131`
- Survivors: `0`
- Effective survivor shapes: `0`
- Rejected: `131`
- Split method: `chronological_entry_time`
- Minimum sample: `80`
- Minimum out-of-sample sample: `20`

OOS gate pressure is concentrated in already-rejected rows:

- `25 / 131` variants currently pass the basic OOS sample plus OOS expectancy gates.
- `5 / 25` OOS passers have `30` or fewer OOS trades.
- The thinnest OOS passer is `alert-edge-doge-momentum-reversal-long-v0#6` with exactly `20` OOS trades and it is already rejected for low full-sample count, weak expectancy, weak profit factor, deflated-Sharpe failure, drawdown, baseline, and walk-forward failures.
- The other low-margin OOS passers with `25`, `26`, `28`, and `30` OOS trades are also rejected for non-OOS gates.

This means boundary exclusion is unlikely to hide a live survivor in the current report. Its value is leak prevention for future candidates and for planned-level/orderflow labels that may overlap across the 70/30 boundary.

## Exact Attachment Points

`engine.mjs` has a narrow implementation surface:

- `splitIndexForCandles(candles, splitConfig)` already centralizes the 70% chronological split index.
- `simulateTrade(...)` already returns `entryIndex`, `exitIndex`, `entryTime`, and `exitTime`, which is enough to report boundary-excluded trades after classification.
- `backtestVariant(...)` currently assigns `split` from `index < splitIndex ? "in_sample" : "out_of_sample"` before simulating both candidate and time-matched baseline trades.
- `summarizeVariantRuns(...)` already funnels all candidate and baseline trades into `stats`, `splitStats`, `baseline.splitStats`, baseline comparison, walk-forward diagnostics, verdicts, worst slices, and report rows.

Smallest safe code slice:

1. Add a pure split classifier near `splitIndexForCandles`, returning `in_sample`, `purged_boundary`, or `out_of_sample`.
2. Default `purgeBars` and `embargoBars` to `timeframe.maxBars`; allow config only to widen them, not silently shrink below label horizon.
3. Use the classifier inside `backtestVariant(...)` for candidate and baseline trades at the same signal timestamp.
4. Keep `purged_boundary` trades in a local accounting list but exclude them before `summarizeVariantRuns(...)` computes candidate stats, matched-baseline stats, walk-forward diagnostics, verdict failures, survivor shapes, and rejected-ledger metrics.
5. Emit `splitMetadata` per verdict with `method`, `splitIndex`, `cutoffTime`, `purgeBars`, `embargoBars`, `purgedBoundaryTrades`, `inSampleTrades`, and `outOfSampleTrades`.

`verify-filter.mjs` should keep the current research-only assertions and add only contract checks:

- report split method is `purged_embargo_entry_time` once enabled;
- every verdict has non-negative `splitMetadata` counts;
- `splitMetadata.inSampleTrades + splitMetadata.outOfSampleTrades === stats.sample`;
- `purgedBoundaryTrades` is present even when zero;
- candidate and baseline total, in-sample, and OOS samples still match after boundary exclusion;
- no survivor can pass below existing full-sample or OOS sample gates after exclusion;
- the backtest-readiness `purged-embargo-split` check stays failing until a fresh report includes the metadata and verifier assertions.

## Reassessment

Do not change gates, thresholds, alert wording, scheduler cadence, data capture, or strategy status while adding this. The first implementation should be allowed to create more rejections or lower sample counts. If post-purge OOS counts break a near-miss row, the correct action is rejection or Watch-only status, not threshold loosening.

Next useful branch: a small implementation pass that edits only `engine.mjs`, `verify-filter.mjs`, and generated strategy-filter outputs, then runs `npm run filter`, `npm run verify`, and the focused test suite if available.

## Self-Check

- Stayed internal and research-only.
- Chose exactly one bounded work item.
- Used no web/source checks.
- Ran local statistics over the current filter report.
- Read only the relevant strategy-filter note/report/source surfaces named by the router path.
- Produced one durable note plus minimal router/queue/state/log breadcrumbs.
- Did not change strategy code, thresholds, scheduler/cadence, alert wording, data capture, account/key/API access, paid services, risk/sizing/TP/SL, execution, public posting, or strategy promotion.
- No Telegram notification gate met.
