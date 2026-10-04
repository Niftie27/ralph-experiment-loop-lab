---
type: note
created: 2026-09-20T07:40:00Z
topic: strategy-destruction-filter
status: internal
work_item: validation.strategy-filter-purged-embargo-implementation-scope
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
related:
  - ./2026-09-20-strategy-filter-purged-embargo-split-design.md
sources:
  - ../../outputs/backtest-readiness-audit.md
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
  - ../../experiments/strategy-destruction-filter/README.md
---
# Strategy Filter Purged Embargo Implementation Scope

Bounded work item: `validation.strategy-filter-purged-embargo-implementation-scope`.

## Question

What is the smallest implementation step after the purged/embargo split design?

## Local Statistics

The current strategy-filter report is still strict and promotion-safe:

- Generated: `2026-09-17T07:35:11.990Z`
- Split method: `chronological_entry_time`
- Candidates: `13`
- Variants: `131`
- Survivors: `0`
- Effective survivor shapes: `0`
- Rejected: `131`

Gate pressure remains non-promotional:

- Headline pass: `12 / 131`
- Deflated-Sharpe proxy pass: `25 / 131`
- OOS pass: `25 / 131`
- Baseline pass: `34 / 131`
- Walk-forward pass: `3 / 131`

A proxy inspection of `filter-report.json` found no exact per-trade entry-index, label-window, split-boundary, or purged-boundary fields in the public report. That means the current report can confirm that the split is entry-time chronological and strict enough to reject every variant, but it cannot directly quantify how many current trades would be removed by the new purge/embargo rule.

The report does show `25` OOS-passing variants, with `5` of those carrying `30` or fewer OOS trades. Those low-margin OOS passers are the most likely to lose OOS eligibility after boundary exclusion if the implementation removes enough nearby trades. This is a reason to keep the sample gates hard, not a reason to relax them.

## Smallest Implementation Slice

Implement the next step as a report/verifier capability before changing any candidate interpretation:

- Add per-variant split metadata for `purged_embargo_entry_time`: `splitIndex`, `cutoffTime`, `purgeBars`, `embargoBars`, `purgedBoundaryTrades`, `inSampleTrades`, and `outOfSampleTrades`.
- Derive `purgeBars` and `embargoBars` from `timeframe.maxBars` by default.
- Exclude `purged_boundary` trades from candidate metrics, matched-baseline metrics, walk-forward survival checks, survivor-shape grouping, and rejected-ledger promotion metrics.
- Apply identical boundary exclusion to the time-matched alternating-direction baseline at the same signal timestamps.
- Add verifier assertions that every report using overlapping labels exposes purged/embargo metadata and that candidate and baseline post-boundary sample counts remain matched.

Do not change gates, thresholds, scheduler cadence, live alert wording, or promotion language while adding this. The expected first result can safely be more rejections or lower samples; any candidate falling below sample gates stays rejected or Watch-only.

## Reassessment

The design gap is now narrower: the blocker is not another statistical threshold, but missing boundary-aware split accounting in the report/verifier contract. Confidence is high that the next useful work is a small code/report implementation plus tests. Confidence is medium on the eventual sample impact because current reports do not expose the exact boundary rows yet.

## Self-Check

- Stayed internal and research-only.
- Chose exactly one bounded work item.
- Used no web/source checks.
- Ran local statistics over the current filter report.
- Produced one durable note plus minimal router/queue/state/log breadcrumbs.
- Did not change code, thresholds, scheduler/cadence, alert wording, data capture, account/key/API access, paid services, risk/sizing/TP/SL, execution, public posting, or strategy promotion.
- No Telegram notification gate met.
