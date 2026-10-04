---
type: note
created: 2026-09-12T16:17:39Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - baseline-comparison
  - audit
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-09-03-strategy-filter-survivor-uniqueness-audit.md
  - 2026-09-10-strategy-filter-deflated-sharpe-sensitivity-audit.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/README.md
---
# Strategy Filter OOS Baseline-Lift Audit

Bounded work item: `validation.strategy-filter-oos-baseline-lift-audit`.

## Question

Does the current strategy-destruction filter still rely on the right hard gates after the latest AVAX survivor and HYPE funding/fade rejection set, especially around out-of-sample split and baseline comparison?

## Local Statistics

Current report: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-08-29T21:54:55.315Z`.

- candidates: 13
- variants tested: 131
- raw survivors: 6
- rejected variants: 125
- hard split: chronological entry-time, `70%` in-sample / `30%` out-of-sample
- baseline: time-matched alternating direction

The current hard gates correctly reject many false positives:

- 17 variants pass the deflated-Sharpe gate but fail OOS sample or OOS expectancy.
- 15 rejected variants have positive full-sample expectancy, pass profit-factor, and pass deflated Sharpe, but still fail OOS, drawdown, failure-slice, low-sample, or walk-forward gates.
- Top example: `perp-funding-only-fade-v0#7` has `0.1163R` expectancy, `1.1968` profit factor, and `1.6554` deflated Sharpe, but OOS expectancy is `-0.0615R`, max drawdown is `40.5661R`, and walk-forward OOS support is `0`.

The remaining survivor weakness is more specific:

- `alert-edge-avax-range-breakdown-short-v0#3` and `#4` survive all current hard gates with OOS expectancy `0.1473R`, but their OOS baseline lift is `-0.1171R`: the matched alternating-direction baseline made `0.2644R` in the same OOS slice.
- The same two variants also have one negative walk-forward fold: min fold expectancy `-0.0539R`, despite `4/5` positive headline folds and `4/5` positive baseline-lift folds.
- This is 2 raw survivors, one duplicated metric/signal shape in the prior survivor-uniqueness sense. The stronger AVAX survivor shapes `#1/#2` and `#5/#6` keep positive OOS baseline lift.
- Across all variants, 14 pass deflated Sharpe while having negative OOS baseline lift.

## Verdict

The OOS and walk-forward gates are doing most of the useful destruction work. Deflated Sharpe is necessary but far from sufficient.

The filter's soft spot is that the hard baseline-lift gate currently uses full-sample lift, while OOS baseline lift is only reported. That allowed one duplicated AVAX survivor shape to pass even though its OOS slice underperformed the matched baseline.

Do not promote or paper-qualify that weaker AVAX shape. For future strict candidate reporting, prefer `survivor-shapes with positive OOS baseline lift` over raw survivor count. A future harness tightening should add an explicit positive OOS baseline-lift gate or, at minimum, tag survivors with negative OOS lift as `watch_only_fragile_survivor`.

AVAX remains Watch / forward-paper-needed. No alert, scheduler, threshold, execution, account/key/API, data capture, or strategy-promotion state changed.

## Reassessment

No source/web check was needed; this was a local statistics audit over the current frozen report. The best next filter hardening is small and mechanical: make OOS baseline lift visible in summaries and decide whether it becomes a hard gate before any new historical survivor is described as strong.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, risk/sizing, TP/SL, scheduler changes, or public posting.
- Started from the compact router and read only directly relevant strategy-filter artifacts.
- Used no new web/source checks.
- Ran local statistics over the current 131-variant report.
- Prior-art/wheel gate: no package install, framework setup, paid source, or custom backtest expansion was needed.
- Verify/Reassess result: chronological OOS and walk-forward gates remain essential; OOS baseline lift should become more prominent or harder.
- No Telegram notification gate met.
