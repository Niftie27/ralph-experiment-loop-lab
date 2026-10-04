---
type: note
created: 2026-08-27T20:36:00Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - walk-forward
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-08-27-strategy-filter-threshold-sensitivity.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/src/verify-filter.mjs
---
# Strategy Filter Walk-Forward Survivor Invariant

Bounded work item: `validation.strategy-filter-walk-forward-survivor-invariant`.

## Question

After the threshold-sensitivity run showed that negative out-of-sample expectancy is the fragile gate, what compact walk-forward invariant should prevent future headline-strong variants from surviving with weak chronological consistency?

## Local Statistics

Current verified report: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-08-25T22:39:59.454Z`.

- candidates: 9
- variants tested: 105
- current survivors: 0
- variants with at least 3 / 5 positive walk-forward folds: 29 / 105
- variants with at least 3 / 5 positive baseline-lift folds: 40 / 105
- variants with at least 2 diagnostic OOS folds above the OOS gate: 9 / 105
- variants passing all three walk-forward consistency checks: 3 / 105
- variants that pass every hard gate except the OOS expectancy gate in this local replay check: 2 / 105
- OOS-relaxed variants that also pass the walk-forward consistency checks: 0 / 105

The two OOS-relaxed false-survivor shapes were both HYPE funding regime/timeframe variants:

- `perp-funding-regime-timeframe-fade-v0#3`: OOS expectancy `-0.2459R`, positive folds `3 / 5`, positive baseline-lift folds `2 / 5`, positive diagnostic OOS folds `1 / 2`, minimum fold expectancy `-0.2648R`.
- `perp-funding-regime-timeframe-fade-v0#11`: OOS expectancy `-0.2459R`, positive folds `3 / 5`, positive baseline-lift folds `4 / 5`, positive diagnostic OOS folds `1 / 2`, minimum fold expectancy `-0.3691R`.

## Verification Change

Added a verifier survivor tripwire in `src/verify-filter.mjs`. Any future `survived_research_gate` verdict must now have:

- at least 5 valid walk-forward folds;
- at least 60% positive walk-forward folds;
- at least 60% positive baseline-lift folds;
- all diagnostic OOS folds clearing the configured OOS expectancy gate;
- a finite worst fold expectancy.

This does not promote or retest any strategy. It only prevents future survivor records from passing verification when a headline result is not chronologically consistent.

`npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed after the change with `105` variants, `0` survivors, `10` feature studies, `7` accessible data rails, and research-only status.

## Reassessment

The walk-forward invariant is a useful second tripwire after the strict positive OOS expectancy assertion. The current report still has no survivors, so the invariant cannot prove that any strategy is good. It does prove that the verifier will reject a future survivor if its profitability depends on one chronological slice while the diagnostic OOS folds are weak.

Next useful filter-hardening step: keep the filter stable rather than adding more gates immediately. The higher-value next queue item is likely `validation.ta-orderflow-alert-gate-backtest` only if it feeds a strict candidate input, or a small candidate-quality routing task if the next run stays in the strategy-filter lane.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, risk/sizing, TP/SL, cron cadence, or Telegram update changed.
- Started from the router/queue state and read only the directly relevant strategy-filter files.
- Ran local statistics over the current 105-variant report.
- Added a verifier assertion instead of expanding data collection or inventing a new strategy.
- Ran the verifier after the change.
- Prior-art/wheel gate: no package install, framework setup, paid source, or new custom backtest expansion was needed; the existing harness output was sufficient.
- No Telegram notification gate met.
