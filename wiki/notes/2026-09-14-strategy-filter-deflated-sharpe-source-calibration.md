---
type: note
created: 2026-09-14T07:30:00Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - source-scan
  - strategy-family
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-09-10-strategy-filter-deflated-sharpe-sensitivity-audit.md
  - 2026-09-13-strategy-filter-oos-shrinkage-audit.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/src/engine.mjs
  - https://www.davidhbailey.com/dhbpapers/deflated-sharpe.pdf
---
# Strategy Filter Deflated-Sharpe Source Calibration

Bounded work item: `validation.strategy-filter-deflated-sharpe-source-calibration`.

## Question

Does the current strategy filter's approximate deflated-Sharpe gate match enough of the Bailey/López de Prado Deflated Sharpe Ratio idea to keep using it, and what should not be inferred from it?

## Source Calibration

Bailey and López de Prado define the Deflated Sharpe Ratio as a correction for selection bias under multiple testing and non-normal returns. Their paper stresses that not controlling for the number of trials makes backtest results over-optimistic, and that a normal holdout split alone does not solve multiple-testing risk when many variants are tried.

The full DSR path is richer than RALPH's current proxy:

- estimate a multiple-testing threshold from the distribution of Sharpe ratios across independent trials;
- account for the number of independent trials, including correlated/non-independent trials;
- adjust the observed Sharpe test for sample length, skewness, and kurtosis.

RALPH's current implementation in `experiments/strategy-destruction-filter/src/engine.mjs` is explicitly labeled `approximate_multiple_testing_deflated_sharpe`. It computes:

```text
observedSharpe - sqrt(2*ln(trialCount))*sqrt((1+0.5*observedSharpe^2)/(sample-1))
```

That means it is a conservative multiple-testing penalty on the observed trade Sharpe, not a full institutional DSR implementation. The separate `probabilisticSharpe` diagnostic does include a PSR-style sample/skew/kurtosis adjustment against the matched baseline, but it is intentionally diagnostic-only and not a survival gate.

## Local Statistics

Current report: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-09-13T06:33:46.939Z`.

- candidates: 13
- variants tested: 131
- raw survivors: 2
- effective survivor shapes: 1
- rejected variants: 129
- current deflated-Sharpe trial count: 131
- variants passing the deflated-Sharpe floor: 25 / 131
- headline passers by expectancy, profit factor, and deflated-Sharpe: 21 / 131
- rejected variants that still pass deflated Sharpe: 23 / 129

The rejected deflated-Sharpe passers concentrate in HYPE funding/fade variants and fragile AVAX near-misses:

- `perp-funding-only-fade-v0`: 5 rejected variants pass deflated Sharpe.
- `perp-funding-trend-filter-fade-v0`: 5 rejected variants pass deflated Sharpe.
- `perp-funding-regime-timeframe-fade-v0`: 7 rejected variants pass deflated Sharpe.
- `alert-edge-avax-range-breakdown-short-v0`: 6 rejected variants pass deflated Sharpe.

The only current survivors remain `alert-edge-avax-range-breakdown-short-v0#1/#2`, one effective duplicate shape. Both have sample `216`, expectancy `0.1879R`, profit factor `1.3175`, deflated Sharpe `1.6214`, OOS expectancy `0.0927R`, OOS baseline lift `0.125R`, and 5/5 positive walk-forward folds. This still does not promote AVAX because matching regime-specific forward-paper rows remain below threshold.

## Verdict

Keep the current deflated-Sharpe proxy as a rejection gate, but do not describe it as full DSR and do not use it as promotion evidence. It is doing useful pressure-test work, yet current local statistics show it is not sufficient: 23 rejected variants pass it while failing chronology, baseline, drawdown, failure-slice, or walk-forward gates.

No harness change is justified in this micro-run. A future implementation pass should only add full DSR-style reporting if the filter also freezes enough per-variant return series to estimate cross-variant Sharpe dispersion and an effective independent-trial count. Without that, a "full DSR" label would be false precision.

## Reassessment

The latest OOS and walk-forward gates remain the stronger defense against false positives. The current state is acceptable because the report already labels the implementation as an approximate proxy, survivor-shape reporting prevents duplicate overcounting, and AVAX remains Watch / forward-paper-needed.

No strategy promotion, alert change, scheduler change, data capture, account/key/API access, execution, or public posting was started.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, risk/sizing, TP/SL, scheduler changes, or public posting.
- Started from the compact router/state files and read only directly relevant strategy-filter files.
- Used one new source check: Bailey/López de Prado DSR paper at `https://www.davidhbailey.com/dhbpapers/deflated-sharpe.pdf`.
- Ran local statistics over the current 131-variant report.
- Prior-art/wheel gate: checked source method before proposing any custom implementation.
- Verify/Reassess result: current proxy label is acceptable; full DSR should remain proposed/watch until return-series and effective-trial inputs exist.
- No Telegram notification gate met.
