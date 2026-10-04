---
type: note
created: 2026-08-27T18:08:00Z
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
  - 2026-08-27-strategy-filter-current-sieve-audit.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/config.default.json
  - ../../experiments/strategy-destruction-filter/src/verify-filter.mjs
---
# Strategy Filter Threshold Sensitivity

Bounded work item: `validation.strategy-filter-threshold-sensitivity`.

## Question

Which single survival-gate relaxation would create false survivors in the current 105-variant strategy-destruction-filter report?

## Local Statistics

Current verified report: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-08-25T22:39:59.454Z`.

- current survivors: 0 / 105
- variants that pass every gate except one: 6 / 105
- the only single missing gate for those near-survivors: `weak_out_of_sample_expectancy`
- no variant passes every gate except sample, whole-period expectancy, profit factor, deflated-Sharpe, drawdown, worst-slice, out-of-sample sample, or baseline-lift

Single-gate permissive test:

- remove/neutralize `minOutOfSampleExpectancyR`: 6 false survivors
- remove/neutralize any other single configured gate: 0 survivors

Out-of-sample threshold sweep, all other gates unchanged:

- `0.01`: 0 survivors
- `0`: 0 survivors
- `-0.025`: 0 survivors
- `-0.05`: 0 survivors
- `-0.075`: 0 survivors
- `-0.1`: 0 survivors
- `-0.15`: 0 survivors
- `-0.2356`: 4 false survivors
- `-0.2459`: 6 false survivors

False-survivor set if the out-of-sample gate were loosened to the first bad threshold:

- `perp-funding-trend-filter-fade-v0#6`: OOS expectancy `-0.2356R`, positive headline expectancy `0.3359R`, profit factor `1.6283`, deflated-Sharpe `1.6461`, drawdown `14.2831R`, positive folds `3 / 5`, positive OOS folds `0`.
- `perp-funding-trend-filter-fade-v0#3`: OOS expectancy `-0.2356R`, headline expectancy `0.2705R`, profit factor `1.489`, deflated-Sharpe `1.5645`, drawdown `14.2831R`, positive folds `3 / 5`, positive OOS folds `0`.
- `perp-funding-trend-filter-fade-v0#12`: OOS expectancy `-0.2356R`, headline expectancy `0.2833R`, profit factor `1.5108`, deflated-Sharpe `1.2766`, drawdown `14.2831R`, positive folds `3 / 5`, positive OOS folds `0`.
- `perp-funding-trend-filter-fade-v0#9`: OOS expectancy `-0.2356R`, headline expectancy `0.2051R`, profit factor `1.3525`, deflated-Sharpe `1.0549`, drawdown `14.2831R`, positive folds `4 / 5`, positive OOS folds `1`.

Two more HYPE funding variants become false survivors only if `minOutOfSampleExpectancyR` is relaxed to `-0.2459R`.

## Verification Change

Added a verifier tripwire in `src/verify-filter.mjs`:

- `config.gates.minOutOfSampleExpectancyR` must stay positive.
- any future `survived_research_gate` verdict must have strictly positive out-of-sample expectancy, independent of config drift.

`npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed after the change with `105` variants, `0` survivors, `10` feature studies, `7` accessible data rails, and research-only status.

## Reassessment

The current filter is not broadly fragile to one-gate loosening. It is specifically fragile to allowing negative out-of-sample expectancy. The HYPE funding family can look strong on headline expectancy, profit factor, deflated-Sharpe proxy, drawdown, and some walk-forward fold counts while still losing in the chronological OOS slice. That makes positive OOS expectancy a non-negotiable survival invariant, not just a configurable preference.

Next useful filter-hardening step: add a compact walk-forward consistency invariant for future survivors, because the false-survivor set still shows low or zero positive OOS folds even when headline folds look acceptable.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, risk/sizing, TP/SL, cron cadence, or Telegram update changed.
- Started from the router/queue state and read only the directly relevant strategy-filter files.
- Ran local statistics over the current 105-variant report.
- Added a verifier assertion because a one-gate relaxation would create false survivors.
- Ran the existing verifier after the change.
- Prior-art/wheel gate: no new data collection, package install, framework setup, or custom backtest expansion was needed; the existing harness output was sufficient.
- No Telegram notification gate met.
