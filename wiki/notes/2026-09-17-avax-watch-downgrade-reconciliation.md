---
type: note
created: 2026-09-17T07:46:00Z
topic: strategy-destruction-filter
status: internal
work_item: validation.strategy-filter-avax-watch-downgrade-reconciliation
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - rejected
  - watch-only
related:
  - ./2026-09-17-strategy-filter-gate-group-reporting.md
  - ./2026-08-29-avax-range-breakdown-watch.md
  - ../concepts/strategy-destruction-filter.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
  - ../../automation/work-queues.yaml
  - ../../decisions/discarded.md
---
# AVAX Watch Downgrade Reconciliation

Bounded work item: `validation.strategy-filter-avax-watch-downgrade-reconciliation`.

## Question

The refreshed strategy-filter report now has no survivors, but the work queue still carried `avax-1h-range-breakdown-short-down-low-vol` as a Watch item from the older 2026-08-29 historical-survivor note. This run reconciles that stale status.

## Current Evidence

Latest report: `2026-09-17T07:35:11.990Z`.

- Candidates: 13
- Variants tested: 131
- Raw survivors: 0
- Effective survivor shapes: 0
- Rejected variants: 131

AVAX `alert-edge-avax-range-breakdown-short-v0` now has 8/8 variants rejected:

- `#1/#2`: reject only on `weak_walk_forward_out_of_sample`; sample `217`, expectancy `0.1815R`, profit factor `1.3052`, deflated-Sharpe proxy `1.5665`, OOS expectancy `0.0761R`, OOS baseline lift `0.2457R`, but only 1 diagnostic OOS walk-forward fold.
- `#3/#4`: reject on `weak_out_of_sample_baseline_lift` and `weak_walk_forward_out_of_sample`.
- `#5/#6`: reject on `weak_walk_forward_out_of_sample`.
- `#7/#8`: reject on `weak_profit_factor` and `weak_walk_forward_out_of_sample`.

The older Watch thesis was already not paper-qualified because exact regime-tagged forward paper rows were 0. After the refresh, the historical-survivor premise is also gone.

## Decision

Move AVAX 1h `range_breakdown_short` down/low-vol out of Watch and into discarded historical-shape memory.

Revisit only if a future frozen report creates a fresh AVAX survivor shape that passes current hard gates and matching regime-tagged forward paper support reaches the explicit threshold. Do not keep a forward-paper wait open for a strategy shape that no longer survives the historical destruction filter.

## Verification

Ran a local statistics check over `filter-report.json` to enumerate the 8 AVAX variants and their rejection reasons. The report already passed the main verifier in the previous gate-group run:

- `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter`

No code or report output changed in this reconciliation run.

## Reassessment

Confidence is high on the routing decision: queue state should not preserve Watch status after both the historical survivor and forward-paper premises are absent. Confidence is medium on long-term AVAX strategy value because market regimes can change, so the discard has a narrow revisit trigger instead of a permanent ban.

## Self-Check

- Stayed internal and research-only.
- Used no new web/source checks.
- Used existing public/no-key report output only.
- Updated one durable note, the discarded ledger, queue state, router breadcrumb, loop state, and log.
- No live trading, orders, wallet keys, exchange keys, paid APIs, account setup, scheduler/cadence, alert wording, thresholds, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.
- No Telegram notification gate met.
