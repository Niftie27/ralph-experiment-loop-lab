---
type: note
created: 2026-08-27T21:10:00Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-08-24-strategy-filter-calibration-audit.md
  - 2026-08-27-strategy-filter-walk-forward-survivor-invariant.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/config.default.json
---
# Strategy Filter PSR Diagnostic Stress

Bounded work item: `validation.strategy-filter-psr-diagnostic-stress`.

## Question

After adding a diagnostic PSR-style proxy, would treating PSR as a promotion signal weaken the strategy-destruction filter?

## Local Statistics

Current report: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-08-25T22:39:59.454Z`.

- candidates: 9
- variants tested: 105
- current survivors: 0
- variants with PSR diagnostic at least `0.5`: 49 / 105; positive OOS expectancy: 7 / 49
- variants with PSR diagnostic at least `0.8`: 42 / 105; positive OOS expectancy: 5 / 42
- variants with PSR diagnostic at least `0.95`: 27 / 105; positive OOS expectancy: 3 / 27
- variants with PSR diagnostic at least `0.99`: 18 / 105; positive OOS expectancy: 1 / 18
- high-PSR variants also passing headline expectancy, profit factor, and deflated-Sharpe gates: 13 / 105
- high-PSR variants with non-positive OOS expectancy: 37 / 42

High-PSR failure counts:

- `weak_out_of_sample_expectancy`: 37 / 42
- `drawdown_too_high`: 31 / 42
- `weak_profit_factor`: 28 / 42
- `deflated_sharpe_fail`: 25 / 42
- `weak_expectancy_after_costs`: 24 / 42
- `bad_failure_slice`: 23 / 42
- `low_out_of_sample_sample`: 10 / 42
- `low_sample`: 6 / 42

The most dangerous shape is not low PSR. It is a high-PSR HYPE funding family variant with attractive headline metrics but negative chronological OOS expectancy. Examples:

- `perp-funding-trend-filter-fade-v0#6`: PSR `1`, deflated-Sharpe `1.6461`, expectancy `0.3359R`, profit factor `1.6283`, OOS expectancy `-0.2356R`, positive OOS folds `0`.
- `perp-funding-trend-filter-fade-v0#3`: PSR `0.9952`, deflated-Sharpe `1.5645`, expectancy `0.2705R`, profit factor `1.489`, OOS expectancy `-0.2356R`, positive OOS folds `0`.
- `perp-funding-regime-timeframe-fade-v0#11`: PSR `1`, deflated-Sharpe `0.7272`, expectancy `0.1671R`, profit factor `1.2803`, OOS expectancy `-0.2459R`, positive OOS folds `1`.

## Verdict

Keep the PSR-style proxy diagnostic-only. In the current report, raising the PSR diagnostic threshold does not isolate robust strategies; it mostly keeps HYPE funding variants that fail chronological OOS behavior. PSR is useful as a warning label on return-shape significance, but it must not override OOS expectancy, baseline lift, drawdown, worst-slice, or walk-forward consistency.

The current stricter tripwires are still pointed at the right failure mode:

- positive OOS expectancy must remain non-negotiable;
- walk-forward OOS consistency must be required for any future survivor;
- high PSR without OOS survival should be treated as an overfit-risk signature, not evidence.

## Reassessment

No code change is needed yet. The existing verifier already prevents the observed high-PSR false-survivor path through positive OOS and walk-forward assertions. The next useful strategy-filter work should be candidate-input quality, not another statistical gate: convert future alert-edge/orderflow ideas into strict plain-English specs with explicit mechanism, baseline, OOS split, and cheapest kill test before they enter the harness.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, risk/sizing, TP/SL, cron cadence, or Telegram update changed.
- Started from the router/queue state and read only directly relevant strategy-filter files.
- Ran local statistics over the current 105-variant report.
- Used no new web/source checks; existing local report and prior calibration note were sufficient.
- Prior-art/wheel gate: no package install, framework setup, paid source, or custom backtest expansion was needed.
- Verify/Reassess result: PSR is retained as a diagnostic, not promoted to a survival gate.
- No Telegram notification gate met.
