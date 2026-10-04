---
type: note
created: 2026-09-13T07:30:00Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - audit
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-09-13-strategy-filter-survivor-shape-reporting.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
---
# Strategy Filter OOS Shrinkage Audit

Bounded work item: `validation.strategy-filter-oos-shrinkage-audit`.

## Question

After survivor-shape reporting and the hard out-of-sample baseline-lift gate, are headline-good variants still mostly dying when checked against chronological out-of-sample behavior?

## Method

Ran local statistics over the current generated strategy-filter report from `2026-09-13T06:33:46.939Z`.

No web checks, paid APIs, account access, new data capture, scheduler change, or strategy execution was used.

## Current Counts

- candidates: `13`
- variants: `131`
- raw survivors: `2`
- effective survivor shapes: `1`
- rejected: `129`
- positive in-sample expectancy: `47/131` (`35.9%`)
- positive out-of-sample expectancy: `32/131` (`24.4%`)
- variants passing out-of-sample sample, expectancy, and OOS baseline-lift floors: `21/131` (`16.0%`)
- variants passing deflated-Sharpe proxy: `25/131` (`19.1%`)
- deflated-Sharpe passers that still fail OOS sample or expectancy: `17/25`
- deflated-Sharpe passers that still fail OOS baseline lift: `12/25`
- headline passers by expectancy, profit factor, and deflated Sharpe: `21`
- headline passers still failing at least one OOS gate: `13/21` (`61.9%`)

## Survivor Read

The only effective survivor shape remains AVAX 1h `range_breakdown_short` in down/low-vol:

- raw variants: `alert-edge-avax-range-breakdown-short-v0#1` and `#2`
- effective shapes: `1`
- sample: `216`
- in-sample expectancy: `0.2407R`
- out-of-sample expectancy: `0.0927R`
- OOS shrink from in-sample: `-0.1480R`
- OOS / in-sample ratio: `0.3851`
- OOS baseline lift: `0.1250R`
- walk-forward positive folds: `5/5`
- walk-forward positive baseline-lift folds: `4/5`
- positive OOS folds: `2`
- minimum fold expectancy: `0.0256R`

This is still not a promotion. It is one historical watch shape with noticeable OOS decay and no matching regime-specific forward-paper threshold.

## Rejection Read

The most useful destruction gates remain chronological and walk-forward:

- `weak_walk_forward_out_of_sample`: `120`
- `weak_profit_factor`: `107`
- `deflated_sharpe_fail`: `106`
- `drawdown_too_high`: `102`
- `weak_out_of_sample_expectancy`: `100`
- `weak_expectancy_after_costs`: `99`
- `weak_out_of_sample_baseline_lift`: `80`

The worst in-sample to OOS collapses are still concentrated in HYPE funding/fade variants. Several have attractive in-sample expectancy but strongly negative OOS expectancy, including:

- `perp-funding-regime-timeframe-fade-v0#1`: `0.1869R` IS to `-1.0843R` OOS
- `perp-funding-regime-timeframe-fade-v0#9`: `0.1461R` IS to `-1.0843R` OOS
- `perp-funding-trend-filter-fade-v0#6`: `0.6535R` IS to `-0.1872R` OOS
- `perp-funding-regime-timeframe-fade-v0#7`: `0.6298R` IS to `-0.1935R` OOS

## Decision

Keep the current hard OOS gates. Deflated-Sharpe remains useful as a rejection gate, but it is not enough for promotion because many variants can clear it while failing chronological OOS, OOS baseline lift, or walk-forward diagnostics.

Future reporting should surface OOS shrinkage for every survivor shape. A survivor with strong in-sample metrics but OOS expectancy below roughly half of in-sample should stay Watch unless forward paper and walk-forward evidence are independently strong.

AVAX remains Watch / forward-paper-needed. No strategy promotion, live alert wording, threshold, scheduler, data capture, account/key/API access, execution, or public posting changed.

## Self-Check

- Started from the compact router and loop state.
- Read only the directly relevant strategy-filter concept, latest survivor-shape note, and current generated report.
- Used local statistics only.
- Kept output to one durable note plus router/state/log updates.
- No financial advice or execution instruction added.
- No Telegram notification gate met.
