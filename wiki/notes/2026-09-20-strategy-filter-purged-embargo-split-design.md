---
type: note
created: 2026-09-20T07:37:11Z
topic: strategy-destruction-filter
status: internal
work_item: validation.backtest-readiness-purged-embargo-design
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
related:
  - ./2026-09-19-strategy-filter-previous-report-drift-contract.md
sources:
  - ../../outputs/backtest-readiness-audit.md
  - ../../experiments/strategy-destruction-filter/README.md
  - ../../experiments/strategy-destruction-filter/config.default.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/src/engine.mjs
---
# Strategy Filter Purged Embargo Split Design

Bounded work item: `validation.backtest-readiness-purged-embargo-design`.

## Question

Define the smallest purged/embargo split contract needed before overlapping intraday/orderflow labels can be promoted beyond research.

## Current Evidence

The latest backtest readiness audit marks the strategy filter `not_ready_for_promotion` only because `purged-embargo-split` is not implemented. Existing checks already pass for chronological split, walk-forward diagnostics, baseline comparison, approximate multiple-testing penalty, gate-group diagnostics, survivor-shape deduplication, positive OOS gate, OOS baseline lift, planned-level BTC gate, and planned-level sample gates.

Current filter state remains strict:

- Candidates: `13`
- Variants: `131`
- Survivors: `0`
- Effective survivor shapes: `0`
- Rejected: `131`

The current split is chronological by entry time at `70%` of candles. Trade labels can overlap the split boundary because simulated exits may use future bars up to `timeframe.maxBars`: `24` bars on `1h` and `12` bars on `4h`. Both equal roughly one calendar day of label horizon, but the 4h horizon spans two days in wall-clock time.

## Design Contract

Add a split mode named `purged_embargo_entry_time` before any overlapping intraday, planned-level, or orderflow-derived label is eligible for paper-candidate wording.

Minimum behavior:

- Keep the existing chronological split ratio as the anchor: `splitIndex = floor(candles.length * inSampleRatio)`.
- Derive `purgeBars` and `embargoBars` per timeframe. Default to `timeframe.maxBars`; allow config override only to make the gap larger.
- Assign `in_sample` only when `entryIndex < splitIndex - purgeBars`.
- Assign `out_of_sample` only when `entryIndex >= splitIndex + embargoBars`.
- Assign boundary trades to `purged_boundary` and exclude them from survival stats, baseline stats, walk-forward survival checks, survivor shapes, and rejected-ledger promotion metrics.
- Apply the identical split label to the matched alternating-direction baseline so candidate and baseline lose the same boundary timestamps.
- Report `splitIndex`, `cutoffTime`, `purgeBars`, `embargoBars`, `purgedBoundaryTrades`, `inSampleTrades`, and `outOfSampleTrades` per variant.
- Add verifier assertions that no survived variant has an in-sample label window crossing the split boundary and that baseline sample counts still match candidate sample counts after boundary exclusion.

Conservative label-window rule:

- For current candle strategies, compute the label window as `[entryIndex, min(entryIndex + timeframe.maxBars, candles.length - 1)]`, not the realized early exit, so stop/target trades do not receive a smaller gap only because the outcome was already known.
- For planned-level/orderflow event rows, use the declared reaction horizon or max validation window as the label-window end. If the event schema lacks a horizon, classify the row as `split_not_ready`.

## Promotion Gate

Until this is implemented, `purged-embargo-split` stays a failing readiness check and any overlapping-label output remains `research_only_not_promotion_ready`.

After implementation, promotion eligibility still requires the existing hard gates:

- positive expectancy after costs;
- profit factor floor;
- maximum drawdown floor;
- worst-slice floor;
- positive OOS expectancy;
- OOS lift over the time-matched baseline;
- deflated-Sharpe proxy floor;
- walk-forward diagnostics.

No threshold should be loosened to compensate for lower post-purge sample counts. If sample counts fall below gates, the candidate is rejected or kept in Watch for more frozen forward evidence.

## Verification

Local checks used no web/source fetches. They inspected the readiness audit, strategy-filter README, config, report totals, and current engine split implementation. The design is intentionally smaller than a full combinatorial purged K-fold implementation: it closes the known holdout-boundary leak first and leaves richer cross-validation as proposed/watch unless a survivor reappears.

## Reassessment

Confidence is high that the immediate weakness is boundary leakage from entry-time-only splitting, not missing another statistical threshold. Confidence is medium that defaulting both purge and embargo to `timeframe.maxBars` is the best long-term value; it is conservative and cheap, but later orderflow labels may need event-specific horizons once row schemas are populated.

## Self-Check

- Stayed internal and research-only.
- Chose exactly one bounded work item.
- Used no new web/source checks.
- Produced one durable note plus minimal queue/router/state/log breadcrumbs.
- Did not change code, thresholds, scheduler/cadence, alert wording, data capture, account/key/API access, paid services, risk/sizing/TP/SL, execution, public posting, or strategy promotion.
- No Telegram notification gate met.
