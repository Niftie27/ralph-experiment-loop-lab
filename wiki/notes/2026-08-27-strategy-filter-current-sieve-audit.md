---
type: note
created: 2026-08-27T07:30:00Z
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
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
---
# Strategy Filter Current Sieve Audit

Bounded work item: `validation.strategy-filter-current-sieve-audit`.

## Question

After the latest alert-edge and alert-feedback candidates expanded the filter to 105 variants, is the strategy-destruction filter still rejecting for the right reasons, and what is the next smallest useful validation step?

## Local Statistics

Current verified report: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-08-25T22:39:59.454Z`.

- candidates: 9
- variants tested: 105
- survivors: 0
- rejected: 105
- positive overall expectancy: 32 / 105
- positive out-of-sample expectancy: 12 / 105
- positive overall and out-of-sample expectancy: 5 / 105
- positive matched-timestamp baseline lift: 48 / 105
- positive out-of-sample baseline lift: 26 / 105
- current deflated-Sharpe gate pass: 17 / 105
- PSR-style diagnostic >= 0.8: 42 / 105
- at least 3 / 5 positive walk-forward folds: 29 / 105
- all numeric survival gates passed: 0 / 105

Failure counts:

- `weak_out_of_sample_expectancy`: 93 / 105
- `drawdown_too_high`: 90 / 105
- `weak_profit_factor`: 89 / 105
- `deflated_sharpe_fail`: 88 / 105
- `weak_expectancy_after_costs`: 84 / 105
- `bad_failure_slice`: 80 / 105
- `weak_baseline_lift`: 57 / 105
- `low_out_of_sample_sample`: 17 / 105
- `low_sample`: 11 / 105

Family read:

- HYPE/perp-context reversion remains the only family producing apparent statistical strength: 28 / 56 positive expectancy, 17 / 56 deflated-Sharpe gate passes, and 27 / 56 with at least 3 positive folds. It still has only 8 / 56 positive out-of-sample variants and no survivors.
- The XRP alert-edge breakout family has 4 / 4 positive out-of-sample variants, but 0 / 4 deflated-Sharpe gate passes and drawdown/profit-factor failures remain.
- The ETH alert-feedback velocity OHLCV proxy has 0 / 36 positive expectancy, 0 / 36 positive out-of-sample, 0 / 36 deflated-Sharpe passes, and 0 / 36 with at least 3 positive folds. This branch should not be rewrapped as another coarse OHLCV strict candidate.

Top apparent HYPE variant by deflated-Sharpe remains rejected:

- `perp-funding-only-fade-v0#7`: sample `482`, expectancy `0.1163R`, profit factor `1.1968`, deflated-Sharpe proxy `1.6608`, PSR diagnostic `1`, but out-of-sample expectancy `-0.0615R`, max drawdown `40.5661R`, and worst-slice failure.

Top apparent XRP alert-edge variant remains rejected:

- `alert-edge-xrp-range-breakout-v0#1`: sample `154`, out-of-sample expectancy `0.2408R`, out-of-sample baseline lift `0.2738R`, but overall expectancy only `0.0065R`, profit factor `1.01`, deflated-Sharpe proxy `-0.1872`, max drawdown `32.3309R`, and only 3 / 5 positive folds.

## Verification

`npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed with `105` variants, `0` survivors, `10` feature studies, `7` accessible data rails, and research-only status.

No web checks were needed. The local report, existing harness, and previous public-source calibration note were sufficient for this bounded audit.

## Reassessment

The filter is behaving as intended as a destruction layer: superficially attractive metrics disagree with each other, and the gate rejects rather than paper-promotes. The current strongest false-positive shapes are:

1. HYPE funding variants with good headline DS/PSR but negative or unstable out-of-sample behavior.
2. XRP alert-edge breakout variants with positive OOS but weak whole-period expectancy, weak profit factor, drawdown, and DS failure.

The next smallest useful validation is not another broad strategy idea. It is a threshold-sensitivity check over the existing report: identify which single gate change would create false survivors, especially relaxing out-of-sample expectancy, drawdown, or deflated-Sharpe. If one loosened gate creates survivors, add a regression fixture or verifier assertion that prevents that failure mode from being silently reintroduced.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, risk/sizing, TP/SL, or cron changes.
- Started from router/queue state and read only directly relevant strategy-filter notes/results.
- Ran own local statistics over the current 105-variant report.
- Ran the existing verifier and confirmed the current report is internally valid.
- Prior-art/wheel gate: no custom expansion was proposed before checking existing local harness outputs; no package install or new data rail was needed.
- No Telegram notification gate met.
