---
type: note
topic: avax-trend-pullback-rejection
created: 2026-08-29T21:56:44Z
last_updated: 2026-08-29T22:14:02Z
work_item: validation.optionally-test-avax-trend-pullback-reclaim-b-tier-candidate
status: rejected
scope: research-only
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - rejected
related:
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
  - ../../experiments/btc-eth-alert-edge/results/paper-dashboard.md
  - ../concepts/strategy-destruction-filter.md
  - ../concepts/forward-paper-trade-gate.md
  - ./2026-08-29-avax-range-breakdown-watch.md
---
# AVAX Trend Pullback Rejection

Date: 2026-08-29
Status: rejected
Scope: RALPH Profitability Flywheel, strict historical kill test plus regime-aware forward paper check

## Trigger

After testing AVAX 1h `range_breakdown_short` down/low-vol, the next remaining AVAX B-tier alert-edge bucket was:

- symbol: `AVAX`
- timeframe: `1h`
- setup: `trend_pullback_reclaim_long`
- direction: `long`
- regime: `up/mid-vol`
- alert-edge historical stats: 41 samples, expectancy `0.1273R`, profit factor `1.2173`, baseline expectancy `-0.1055R`

## Candidate

Added research-only candidate `alert-edge-avax-trend-pullback-reclaim-long-v0` to the strategy destruction filter.

Data access: the AVAX public/no-key Binance spot rail was already added during the AVAX range-breakdown run. No new account, key, paid service, or execution path was used.

## Result

The candidate was rejected by the strict destruction filter.

Final filter totals:

- candidates: 13
- variants: 131
- survivors: 6
- rejected: 125
- survivors by candidate: all 6 survivors belong to `alert-edge-avax-range-breakdown-short-v0`

AVAX pullback variant:

- variant: `alert-edge-avax-trend-pullback-reclaim-long-v0#1`
- parameters: `fast=20`, `slow=50`, `rsiFloorLong=45`, `trend=up`, `volatility=mid-vol`
- sample: 621
- expectancy: `0.0037R`
- profit factor: `1.0058`
- deflated-Sharpe proxy: `-0.0563`
- max drawdown: `56.1718R`
- out-of-sample: 195 trades, `-0.1091R`
- baseline lift: `0.0154R`
- walk-forward: 2/5 positive folds, 2/5 positive baseline-lift folds, 0/2 diagnostic out-of-sample folds
- minimum fold expectancy: `-0.1511R`

Failures:

- `weak_expectancy_after_costs`
- `weak_profit_factor`
- `deflated_sharpe_fail`
- `drawdown_too_high`
- `weak_out_of_sample_expectancy`
- `weak_walk_forward_expectancy`
- `weak_walk_forward_baseline_lift`
- `weak_walk_forward_out_of_sample`

## Forward Paper Check

Regime-aware forward paper check:

- exact key: `AVAX|1h|trend_pullback_reclaim_long|up/mid-vol`
- exact forward paper rows: 0
- adjacent same-symbol/timeframe/setup/direction rows in other regimes: 0

The historical kill test already rejects the candidate, so the missing forward paper is not the deciding blocker. It confirms there is no T3 support either.

## Decision

Reject `alert-edge-avax-trend-pullback-reclaim-long-v0`. Do not move it to Watch, Paper-Qualified, Alert-Qualified Proposal, or any live/execution-adjacent state.

The only remaining AVAX output from this branch is the separate Watch item for `AVAX 1h range_breakdown_short down/low-vol`, which historically survived but has zero exact regime-specific forward paper rows.

## Verification

Commands:

```bash
npm run validate:candidates --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run filter --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run study:features --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter
npm test --prefix ralph-research-os/experiments/strategy-destruction-filter
```

Final verification passed:

- verifier: 131 variants, 6 survivors, 125 rejected, 14 feature studies, 7 accessible data rails
- tests: 28/28 passed

## Boundaries

No live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
