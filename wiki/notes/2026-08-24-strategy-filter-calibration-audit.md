---
type: note
created: 2026-08-24T07:30:00Z
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
  - https://www.quantresearch.org/Publications.htm
  - https://www.quantconnect.com/research/17112/probabilistic-sharpe-ratio/
---
# Strategy Filter Calibration Audit

Bounded work item: `validation.strategy-filter-calibration-audit`.

## Question

After the 2026-08-22 filter hardening pass, is the current out-of-sample, baseline, and deflated-Sharpe layer good enough as a rejection filter before adding more strategy ideas?

## Evidence Checked

- Local report: `experiments/strategy-destruction-filter/results/filter-report.json`.
- Local implementation: `experiments/strategy-destruction-filter/src/engine.mjs`.
- Local verifier: `experiments/strategy-destruction-filter/src/verify-filter.mjs`.
- Source check: Lopez de Prado's publication index says DSR corrects for selection bias under multiple testing and non-normal returns.
- Source check: QuantConnect's PSR note highlights that Sharpe significance depends on sample length, skewness, kurtosis, and the benchmark Sharpe, not only the observed Sharpe.

## Local Statistics

Current filter report:

- variants tested: 13
- survivors: 0
- positive in-sample expectancy: 2 / 13
- positive out-of-sample expectancy: 0 / 13
- positive in-sample and out-of-sample expectancy: 0 / 13
- beat overall matched-timestamp baseline by configured lift: 7 / 13
- beat matched-timestamp baseline out-of-sample by configured lift: 1 / 13
- passed current deflated-Sharpe proxy gate: 0 / 13

Failure counts:

- `weak_expectancy_after_costs`: 13 / 13
- `weak_profit_factor`: 13 / 13
- `weak_out_of_sample_expectancy`: 13 / 13
- `deflated_sharpe_fail`: 13 / 13
- `drawdown_too_high`: 11 / 13
- `bad_failure_slice`: 8 / 13
- `weak_baseline_lift`: 6 / 13
- `low_sample`: 1 / 13
- `low_out_of_sample_sample`: 1 / 13

Top rejected variant by current deflated-Sharpe proxy:

- `perp-funding-oi-fade-v0#3`: sample 124, in-sample expectancy `0.1537R`, out-of-sample expectancy `-0.3702R`, overall baseline lift `0.181R`, out-of-sample baseline lift `-0.1662R`, deflated-Sharpe proxy `0.0887`.

## Calibration Read

The current filter is correctly conservative for rejection: every variant fails before any paper-trading promotion, and the strongest-looking in-sample variant collapses out-of-sample. The matched-timestamp baseline is useful, because several variants beat the baseline overall while still failing out-of-sample; that prevents a timing artifact from looking like a tradable rule.

The current `deflatedSharpe` implementation is honestly labeled as `approximate_proxy`, but it is not a full DSR implementation. It subtracts a trial-count penalty from observed trade Sharpe:

`observedSharpe - sqrt(2*ln(trialCount))*sqrt((1+0.5*observedSharpe^2)/(sample-1))`

That catches broad parameter-search inflation, but it does not yet include return skewness, kurtosis, benchmark Sharpe, or a PSR-style probability threshold. Based on the source checks, those missing pieces are exactly what make PSR/DSR more robust than ordinary Sharpe-style comparisons.

## Verdict

Do not promote any current strategy. The current filter is acceptable as a kill gate, but not yet strong enough to call surviving future candidates statistically validated.

Next smallest hardening step: add a `probabilistic_sharpe_proxy` diagnostic beside the current proxy, using trade-return skewness, kurtosis, sample length, and the matched baseline Sharpe as `SR*`. Keep it diagnostic-only until fixture tests prove expected behavior on normal, negatively skewed, and fat-tailed synthetic return sets.

## Access / Wheel Check

- No paid data, exchange account, wallet key, API key, or package install used.
- Public source access worked for QuantConnect and Lopez de Prado's publication index.
- SSRN direct page fetch returned HTTP 403 through the browser tool, so SSRN is source-listed but not treated as fully accessible for automated extraction in this run.
- Existing local filter code and reports were enough; no custom backtest expansion was needed.

## Self-Check

- Stayed research-only; no live execution, orders, keys, paid APIs, or alert wording changes.
- Read router-first and only directly relevant filter notes/code.
- Used 3 web/source checks, under the 4-check budget.
- Ran own local statistics over the current filter report.
- Reassessed the direct path: current proxy is fine for rejection, but future survival claims need a PSR/DSR-style diagnostic before trust.
- No Telegram notification gate met.
