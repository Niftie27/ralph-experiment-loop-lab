---
type: note
name: DOGE Candidate Destruction Lookback
created: 2026-08-29T16:11:54Z
last_updated: 2026-08-29T16:18:00Z
tags:
  - autoresearch
  - strategy-destruction-filter
  - alert-edge
  - doge
  - maintenance
related:
  - ../concepts/strategy-destruction-filter.md
  - ../concepts/forward-paper-trade-gate.md
  - ../concepts/multi-timeframe-full-ta.md
  - ./2026-08-25-profitability-loop-integration-map.md
  - ./2026-08-28-strategy-filter-bias-hygiene-checklist.md
  - ./2026-08-29-shared-language-maintenance-and-grill-me.md
  - ../../experiments/strategy-destruction-filter/candidates/seed-strategies.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
  - ../../experiments/btc-eth-alert-edge/results/edge-summary.md
  - ../../experiments/btc-eth-alert-edge/results/paper-dashboard.md
---

# DOGE Candidate Destruction Lookback

Status: rejected by strict research-only destruction filter. No live alert, execution, order, key, risk, sizing, TP/SL, cron, watcher, or strategy-promotion behavior changed.

## Source Bucket

The manual alert-edge look-back selected the next untested B-tier bucket after the already-tested XRP candidate:

- DOGE 1h `momentum_reversal_long`
- Regime: range/low-vol
- Source paper stats: 51 rows, 52.9% winrate, 0.325R expectancy, 1.60 profit factor, -0.099R matched baseline expectancy

This bucket was converted into `alert-edge-doge-momentum-reversal-long-v0` using the existing `volume_velocity_fade` executable rule, constrained to DOGE 1h range/low-vol and long-only downside velocity fades.

## Filter Verdict

The refreshed strict filter report generated at `2026-08-29T16:11:54.495Z` tested 10 candidates and 121 variants across BTC, ETH, SOL, XRP, DOGE, and HYPE 1h/4h sources.

- Survivors: 0
- Rejected: 121
- DOGE candidate variants: 16
- DOGE survivors: 0

Best DOGE variant:

- Variant: `alert-edge-doge-momentum-reversal-long-v0#9`
- Params: DOGE 1h range/low-vol, return lookback 2, min move 0.65%, volume Z 0.8, RSI low 35
- Sample: 140
- Expectancy: 0.0598R
- Profit factor: 1.0915
- Deflated Sharpe proxy: 0.2287
- Max drawdown: 18.4736R
- OOS sample/expectancy: 43 / 0.2113R
- Baseline lift: 0.12R
- Failures: `weak_profit_factor`, `deflated_sharpe_fail`, `drawdown_too_high`

The OOS slice looked better than the in-sample slice, but the whole candidate still fails the promotion gate. This is a useful rejection, not a near-promotion: headline expectancy was barely over the floor, profit factor stayed below gate, drawdown exceeded the cap, and the multiple-testing penalty removed the Sharpe claim.

## Verification

Commands run:

- `npm run validate:candidates --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm run filter --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm run study:features --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter`

Verification note: the first `verify` pass failed because the feature-study artifact still had the old source count after DOGE was added to the research-only filter universe. Refreshing `study:features` repaired the artifact alignment. Final `verify` passed with 121 variants, 0 survivors, 121 rejected, 12 feature studies, and 7 accessible data rails.

## Maintenance Crosslinks

This note links the candidate rejection back into the active RALPH operating map:

- [[wiki/concepts/strategy-destruction-filter]]
- [[wiki/concepts/forward-paper-trade-gate]]
- [[wiki/concepts/multi-timeframe-full-ta]]
- [[wiki/notes/2026-08-25-profitability-loop-integration-map]]
- [[wiki/notes/2026-08-28-strategy-filter-bias-hygiene-checklist]]
- [[wiki/notes/2026-08-29-shared-language-maintenance-and-grill-me]]

## Reassessment

Do not promote DOGE momentum-reversal-long to paper/live alert changes from this result. Keep mining B-tier alert-edge buckets only as strict candidate inputs. The next useful loop is either another B-tier candidate after fresh forward sample, or `validation.ta-learning-loop-call-candidate-forward-check` if the goal is to compare setup-analyzer calls against realized paper/shadow outcomes.
