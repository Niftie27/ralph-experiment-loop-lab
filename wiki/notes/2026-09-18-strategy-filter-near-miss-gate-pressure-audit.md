---
type: note
created: 2026-09-18T07:31:59Z
topic: strategy-destruction-filter
status: internal
work_item: validation.strategy-filter-near-miss-gate-pressure-audit
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - audit
related:
  - ./2026-09-17-strategy-filter-gate-group-reporting.md
  - ./2026-09-17-avax-watch-downgrade-reconciliation.md
  - ../concepts/strategy-destruction-filter.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
---
# Strategy Filter Near-Miss Gate Pressure Audit

Bounded work item: `validation.strategy-filter-near-miss-gate-pressure-audit`.

## Question

After the refreshed strategy-filter report moved to zero survivors, check whether the hard gates are rejecting plausible near-misses for one narrow reason, or whether rejection pressure is still broad enough to avoid false survivor language.

## Current Evidence

Latest report: `2026-09-17T07:35:11.990Z`.

- Candidates: 13
- Variants tested: 131
- Raw survivors: 0
- Effective survivor shapes: 0
- Rejected variants: 131

Gate group counts from the report:

- `headline_pass`: 12 / 131
- `deflated_sharpe_pass`: 25 / 131
- `oos_pass`: 25 / 131
- `baseline_pass`: 34 / 131
- `walk_forward_pass`: 3 / 131

Local overlap statistics:

- 4 / 131 variants pass headline, deflated-Sharpe proxy, OOS, and baseline gates while failing walk-forward.
- 0 / 131 variants pass all five gate groups.
- 4 / 131 variants have exactly one failure reason, and all four fail only `weak_walk_forward_out_of_sample`.
- Those four are all AVAX duplicate historical shapes:
  - `alert-edge-avax-range-breakdown-short-v0#1`
  - `alert-edge-avax-range-breakdown-short-v0#2`
  - `alert-edge-avax-range-breakdown-short-v0#5`
  - `alert-edge-avax-range-breakdown-short-v0#6`
- Only 3 / 131 variants pass the walk-forward group at all; each still fails other hard gates.

Dominant failure counts:

- `weak_walk_forward_out_of_sample`: 122
- `weak_profit_factor`: 109
- `deflated_sharpe_fail`: 106
- `drawdown_too_high`: 102
- `weak_expectancy_after_costs`: 100
- `weak_out_of_sample_expectancy`: 99
- `weak_out_of_sample_baseline_lift`: 86

## Verdict

The current zero-survivor state is not just a single arbitrary threshold killing otherwise strong candidates. The only one-reason near-misses are AVAX duplicate shapes, and the active rejection pressure remains broad across walk-forward OOS, profit factor, approximate multiple-testing deflated-Sharpe, drawdown, expectancy, and OOS baseline lift.

Keep the current hard gates unchanged. The next useful strategy-filter improvement is not a looser threshold; it is previous-report comparison or drift reporting so state changes like the AVAX downgrade are surfaced cleanly.

## Verification

Ran a local statistics script over `experiments/strategy-destruction-filter/results/filter-report.json` and compared the counts with the generated `Gate Group Diagnostics` in `filter-report.md`.

No code, candidate definitions, report output, data capture, scheduler, alert surface, threshold, or execution behavior changed.

## Reassessment

Confidence is high on the audit counts because they come from the current generated report. Confidence is medium on whether walk-forward OOS should be the long-term decisive gate for AVAX specifically; the correct current action remains strict rejection because matching forward-paper support is absent and the refreshed historical report has no survivor shapes.

## Self-Check

- Stayed internal and research-only.
- Used no web/source checks.
- Used existing public/no-key report output only.
- Chose exactly one bounded work item.
- Updated one durable note plus the smallest router/queue/state/log breadcrumbs.
- No live trading, orders, wallet keys, exchange keys, paid APIs, account setup, scheduler/cadence, alert wording, thresholds, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.
- No Telegram notification gate met.
