---
type: note
created: 2026-09-13T06:18:00Z
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
  - 2026-09-12-strategy-filter-oos-baseline-lift-gate-implementation.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
  - ../../experiments/strategy-destruction-filter/results/survivors.json
  - ../../experiments/strategy-destruction-filter/config.default.json
---
# Strategy Filter Post-Gate Survivor Concentration Audit

Bounded work item: `validation.strategy-filter-post-gate-survivor-concentration-audit`.

## Question

After the `weak_out_of_sample_baseline_lift` hard gate, does the strategy filter still have meaningful survivor diversity, or only one concentrated watch-only shape?

## Local Statistics

The current frozen report was generated at `2026-09-12T16:53:55.187Z` and contains:

- candidates: 13
- variants tested: 131
- raw survivors: 2
- rejected variants: 129

Both raw survivors are from one candidate family: `alert-edge-avax-range-breakdown-short-v0`.

The raw survivor IDs are:

- `alert-edge-avax-range-breakdown-short-v0#1`
- `alert-edge-avax-range-breakdown-short-v0#2`

They share identical realized metrics:

- sample: 216 trades
- expectancy: `0.1879R`
- profit factor: `1.3175`
- deflated-Sharpe proxy: `1.6214`
- max drawdown: `10.1373R`
- out-of-sample sample: 77 trades
- out-of-sample expectancy: `0.0927R`
- baseline expectancy lift: `0.2099R`
- out-of-sample baseline lift: `0.125R`
- walk-forward: 5/5 positive expectancy folds, 4/5 positive baseline-lift folds, 2 positive out-of-sample diagnostic folds
- minimum fold expectancy: `0.0256R`

The only parameter difference between `#1` and `#2` is `rsiMaxShort` (`45` vs `50`), but the realized trades and metrics are identical in the frozen report. Treat the current post-gate survivor state as one effective AVAX watch shape, not two independent edges.

## Rejection Shape

Failure counts among the 129 rejected variants:

- `weak_walk_forward_out_of_sample`: 119
- `weak_profit_factor`: 107
- `deflated_sharpe_fail`: 106
- `drawdown_too_high`: 102
- `weak_out_of_sample_expectancy`: 100
- `weak_expectancy_after_costs`: 99
- `weak_out_of_sample_baseline_lift`: 81
- `bad_failure_slice`: 79
- `weak_walk_forward_expectancy`: 78
- `weak_walk_forward_baseline_lift`: 69
- `weak_baseline_lift`: 61
- `low_out_of_sample_sample`: 19
- `low_sample`: 15

Only 12/131 variants avoid the `weak_walk_forward_out_of_sample` failure. The post-gate filter is therefore mostly destroying variants through chronological/out-of-sample stability, not through one isolated scalar threshold.

## Near Misses

The six AVAX variants `#3` through `#8` each fail only `weak_walk_forward_out_of_sample`.

They have positive aggregate expectancy, positive out-of-sample expectancy, and positive out-of-sample baseline lift, but only one positive out-of-sample diagnostic fold. This supports keeping the current walk-forward diagnostic strict: without it, the report would overstate AVAX parameter diversity.

## Decision

Current strategy-filter summary language should say:

> The filter has 2 raw survivors but only 1 effective survivor shape: AVAX 1h `range_breakdown_short` in down/low-vol. It remains Watch / forward-paper-needed because exact regime-tagged forward-paper rows are still below threshold.

No strategy is promoted. No forward paper, alert wording, thresholds, scheduler, execution behavior, data capture, account/key/API access, or public posting changed.

## Next Reassess

The next useful strategy-filter validation item is not another scalar-threshold audit. Prefer one of:

- wait for the AVAX exact regime-tagged forward-paper row threshold before re-testing promotion language;
- add explicit duplicate-shape reporting to the filter output if future summaries keep using raw survivor counts;
- run a small source/prior-art check for whether the current duplicate-shape definition should ignore non-operative parameters by rule.

## Self-Check

- Used local frozen strategy-filter outputs only; no web/source checks.
- Started from the router, work queues, loop state, and autoresearch contract.
- Chose exactly one bounded work item.
- Ran local statistics over the report instead of relying on report wording.
- Kept AVAX as Watch / forward-paper-needed.
- Did not change live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, watcher behavior, data capture, public posting, or strategy promotion.
- This note is a durable `wiki/notes` update and must be OpenClaw wiki bridge ingested and search verified.
