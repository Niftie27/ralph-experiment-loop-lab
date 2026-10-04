---
type: note
created: 2026-09-12T16:25:00Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - baseline-comparison
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-09-12-strategy-filter-oos-baseline-lift-audit.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
---
# Strategy Filter OOS Baseline-Lift Gate Design

Bounded work item: `validation.strategy-filter-oos-baseline-lift-gate-design`.

## Question

If the weak AVAX survivor shape only slipped through because baseline lift is gated on the full sample, what is the smallest stricter gate that hardens the filter without changing the frozen report?

## Local Statistics

Current report: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-08-29T21:54:55.315Z`.

- candidates: 13
- variants tested: 131
- current raw survivors: 6
- current rejected variants: 125
- proposed hard gate: `outOfSampleExpectancyLiftR >= 0.01R`, matching the existing full-sample `minBaselineExpectancyLiftR`

Counterfactual result over the frozen report:

- survivors after the proposed OOS baseline-lift gate: 4 raw survivors
- unique survivor metric/signal shapes after the proposed gate: 2
- newly rejected survivors: `alert-edge-avax-range-breakdown-short-v0#3` and `#4`
- reason for both: `weak_out_of_sample_baseline_lift`
- below proposed OOS baseline-lift minimum: 90 variants total, including 2 current survivors and 88 already-rejected variants
- rejected variants that already pass the proposed OOS baseline-lift gate: 37, so this gate does not replace OOS expectancy, drawdown, failure-slice, low-sample, or walk-forward gates

Threshold sensitivity on current survivors:

| OOS baseline-lift threshold | raw survivors | unique metric/signal shapes |
| --- | ---: | ---: |
| `0.00R` | 4 | 2 |
| `0.01R` | 4 | 2 |
| `0.05R` | 4 | 2 |
| `0.10R` | 4 | 2 |
| `0.15R` | 2 | 1 |
| `0.20R` | 2 | 1 |

## Verdict

Use `outOfSampleExpectancyLiftR >= minBaselineExpectancyLiftR` as the next hardening target, not a harsher bespoke threshold. It is enough to reject the fragile duplicated AVAX shape without silently turning the filter into a one-shape survivor machine.

This should be implemented as a harness/reporting change in a future coding pass:

- add gate name `weak_out_of_sample_baseline_lift`
- require finite `baseline.comparison.outOfSampleExpectancyLiftR`
- compare it to `gates.minBaselineExpectancyLiftR`
- show the gate in the Markdown report and rejected ledger
- add a focused unit test where full-sample baseline lift passes but OOS baseline lift fails

Until that implementation exists, future research summaries should treat the current survivor count as `4 stricter raw survivors / 2 stricter unique shapes` when describing baseline-robust historical survivors. AVAX still remains Watch / forward-paper-needed because exact regime-tagged forward-paper rows are still insufficient.

## Reassessment

No web/source check was needed. This was a counterfactual local-statistics design pass over the frozen strategy-filter report. The proposed gate is deliberately conservative: it raises the floor on OOS baseline comparison while preserving current OOS expectancy, drawdown, failure-slice, low-sample, walk-forward, and deflated-Sharpe roles.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler changes, risk/sizing, TP/SL, execution, public posting, data capture, or strategy promotion.
- Started from the compact router and read only directly relevant strategy-filter artifacts.
- Used no new web/source checks.
- Ran local counterfactual statistics over the current 131-variant frozen report.
- Prior-art/wheel gate: no package install, framework setup, paid source, or custom backtest expansion was needed.
- Verify/Reassess result: OOS baseline lift should become a small hard gate before any new historical survivor is called strong.
- No Telegram notification gate met.
