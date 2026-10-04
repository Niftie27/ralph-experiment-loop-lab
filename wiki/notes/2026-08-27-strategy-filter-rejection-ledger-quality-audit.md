---
type: note
created: 2026-08-27T21:20:00Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - rejected
  - audit
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-08-27-strategy-filter-psr-diagnostic-stress.md
sources:
  - ../../experiments/strategy-destruction-filter/results/rejected-ideas.jsonl
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
---
# Strategy Filter Rejection Ledger Quality Audit

Bounded work item: `validation.strategy-filter-rejection-ledger-quality-audit`.

## Question

Is the rejection ledger good enough for future autoresearch runs to avoid repackaging already-killed strategy shapes?

## Local Statistics

Current ledger: `experiments/strategy-destruction-filter/results/rejected-ideas.jsonl`, generated `2026-08-25T22:39:59.454Z`.

- rejected rows: 105
- missing `failures`: 0
- listed failure/gate mismatches from a local recomputation: 0
- computed gate failures missing from ledger rows: 0
- rows missing `params`: 0
- rows missing baseline comparison: 0
- rows missing out-of-sample split stats: 0
- rows missing plain-English idea text: 105

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

Six variants are one-failure near misses, and every one is blocked only by `weak_out_of_sample_expectancy`:

- `perp-funding-trend-filter-fade-v0#6`: OOS `-0.2356R`, sample `90`, expectancy `0.3359R`, profit factor `1.6283`, deflated-Sharpe `1.6461`
- `perp-funding-trend-filter-fade-v0#3`: OOS `-0.2356R`, sample `115`, expectancy `0.2705R`, profit factor `1.489`, deflated-Sharpe `1.5645`
- `perp-funding-trend-filter-fade-v0#12`: OOS `-0.2356R`, sample `83`, expectancy `0.2833R`, profit factor `1.5108`, deflated-Sharpe `1.2766`
- `perp-funding-trend-filter-fade-v0#9`: OOS `-0.2356R`, sample `104`, expectancy `0.2051R`, profit factor `1.3525`, deflated-Sharpe `1.0549`
- `perp-funding-regime-timeframe-fade-v0#3`: OOS `-0.2459R`, sample `99`, expectancy `0.2107R`, profit factor `1.3639`, deflated-Sharpe `1.0475`
- `perp-funding-regime-timeframe-fade-v0#11`: OOS `-0.2459R`, sample `91`, expectancy `0.1671R`, profit factor `1.2803`, deflated-Sharpe `0.7272`

## Verdict

The ledger is mechanically consistent with the configured gates, but it is not yet semantically rich enough to be the only anti-repackaging memory. The JSONL rows keep variant IDs, family, stats, splits, baseline comparison, failures, and params, but they omit the plain-English idea/thesis text that exists in `filter-report.json` and `filter-report.md`.

That omission matters because future idea intake and community-source scans will reason in English first. Without `idea`, `mechanism`, or `candidate-thesis` fields in the rejected ledger, a later worker can detect parameter-repeat failures but may miss a paraphrased repeat of the same killed mechanism.

## Reassessment

Do not loosen gates. The current failure ledger correctly preserves the hard rejection reasons, and the repeated near-miss pattern confirms the OOS gate is doing useful work. The next small improvement should be a schema guard: require each rejected row to carry the human-readable idea text from the report, and preferably the candidate `mechanism`/`falsifiableClaim` from the strict idea spec, so the rejection ledger becomes useful for text-first strategy-destruction filtering.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, risk/sizing, TP/SL, cron cadence, or Telegram update changed.
- Started from router/queue state and read only directly relevant strategy-filter files.
- Ran local statistics over the 105-row rejection ledger and recomputed gate/failure consistency.
- Used no new web/source checks.
- Prior-art/wheel gate: no package install, framework setup, paid source, or custom backtest expansion was needed.
- Verify/Reassess result: ledger is numerically consistent but needs semantic fields before it can block paraphrased repeats.
- No Telegram notification gate met.
