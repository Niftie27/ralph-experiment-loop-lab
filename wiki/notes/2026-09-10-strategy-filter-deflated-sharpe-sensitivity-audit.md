---
type: note
created: 2026-09-10T07:30:00Z
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
  - 2026-08-27-strategy-filter-psr-diagnostic-stress.md
  - 2026-09-03-strategy-filter-survivor-uniqueness-audit.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/src/engine.mjs
---
# Strategy Filter Deflated-Sharpe Sensitivity Audit

Bounded work item: `validation.strategy-filter-deflated-sharpe-sensitivity-audit`.

## Question

Is the current approximate deflated-Sharpe proxy too loose or too brittle after the latest 131-variant strategy-filter run?

## Local Statistics

Current report: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-08-29T21:54:55.315Z`.

- candidates: 13
- variants tested: 131
- unique metric/signal shapes: 127
- reported survivors: 6
- survivor family count: 1 (`alert-edge-avax-range-breakdown-short-v0`)
- unique survivor metric shapes: 3
- current deflated-Sharpe trial count: 131
- current deflated-Sharpe penalty: `sqrt(2*ln(131)) = 3.1226`
- current deflated-Sharpe pass count: 25 / 131 variants
- current survivors passing deflated-Sharpe gate: 6 / 6

Sensitivity if the same formula is replayed with alternate trial counts:

- `trialCount=13`: 27 / 131 variants pass deflated Sharpe; 6 / 6 survivors still pass; weakest survivor deflated Sharpe `1.3018`.
- `trialCount=127`: 25 / 131 variants pass; 6 / 6 survivors still pass; weakest survivor `1.2082`.
- `trialCount=131`: 25 / 131 variants pass; 6 / 6 survivors still pass; weakest survivor `1.2071`.
- `trialCount=250`: 25 / 131 variants pass; 6 / 6 survivors still pass; weakest survivor `1.1850`.
- `trialCount=500`: 25 / 131 variants pass; 6 / 6 survivors still pass; weakest survivor `1.1627`.
- `trialCount=1000`: 24 / 131 variants pass; 6 / 6 survivors still pass; weakest survivor `1.1416`.
- `trialCount=5000`: 24 / 131 variants pass; 6 / 6 survivors still pass; weakest survivor `1.0963`.
- `trialCount=10000`: 24 / 131 variants pass; 6 / 6 survivors still pass; weakest survivor `1.0781`.

The six AVAX raw survivors remain above the `0.35` deflated-Sharpe gate even under a much harsher hypothetical trial-count penalty:

- `#1/#2`: current deflated Sharpe `1.7770`; at `trialCount=1000000`, still `1.509`.
- `#3/#4`: current `1.3606`; at `trialCount=1000000`, still `1.112`.
- `#5/#6`: current `1.2071`; at `trialCount=1000000`, still `0.972`.

The more dangerous false-positive shape is rejected variants that pass deflated Sharpe but fail chronology or failure slices. The top rejected deflated-Sharpe passers are still HYPE funding/fade variants:

- `perp-funding-only-fade-v0#7`: deflated Sharpe `1.6554`, but OOS expectancy `-0.0615R`, max drawdown `40.5661R`, bad failure slice, and weak walk-forward OOS.
- `perp-funding-trend-filter-fade-v0#6`: deflated Sharpe `1.6318`, but OOS expectancy `-0.2356R` and weak walk-forward OOS.
- `perp-funding-trend-filter-fade-v0#3`: deflated Sharpe `1.5526`, but OOS expectancy `-0.2356R` and weak walk-forward OOS.

## Verdict

The current deflated-Sharpe proxy is not the weak link in the filter. It is robust enough to penalize broad parameter search, but it cannot be allowed to promote strategies by itself. Twenty-five variants pass the deflated-Sharpe gate, while only six raw variants survive all gates, and those six are still only three duplicated AVAX historical shapes with zero matching forward-paper support.

Do not loosen the deflated-Sharpe threshold. Do not make deflated Sharpe a primary promotion signal. Keep it as one required rejection gate beside chronological OOS expectancy, baseline lift, failure-slice drawdown, walk-forward consistency, and forward-paper evidence.

## Reassessment

No harness change is needed in this micro-run. A future reporter improvement would be useful: show deflated-Sharpe pass counts separately from all-gate survivors, and group survivor counts by unique signal/metric shape so raw parameter-grid duplicates cannot make the filter look stronger than it is.

AVAX remains Watch / forward-paper-needed. No candidate, alert, scheduler, data capture, execution, or account/key/API state changed.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, risk/sizing, TP/SL, scheduler changes, or public posting.
- Started from the compact router and read only the directly relevant strategy-filter notes/results/code.
- Used no new web/source checks; existing local report and harness code were sufficient.
- Ran local statistics over the current 131-variant report.
- Prior-art/wheel gate: no package install, framework setup, paid source, or custom backtest expansion was needed.
- Verify/Reassess result: deflated Sharpe remains a useful rejection gate, not a promotion signal; OOS/walk-forward/forward-paper gates remain more important.
- No Telegram notification gate met.
