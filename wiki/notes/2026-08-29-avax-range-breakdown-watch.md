---
type: note
topic: avax-range-breakdown-watch
created: 2026-08-29T21:48:33Z
last_updated: 2026-08-29T22:14:02Z
work_item: validation.optionally-test-remaining-avax-b-tier-alert-edge-candidates
status: watch
scope: research-only
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - watch-only
related:
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
  - ../../experiments/btc-eth-alert-edge/results/paper-dashboard.md
  - ../concepts/strategy-destruction-filter.md
  - ../concepts/forward-paper-trade-gate.md
  - ./2026-08-29-forward-paper-regime-tagging.md
---
# AVAX Range Breakdown Watch

Date: 2026-08-29
Status: watch, not paper-qualified
Scope: RALPH Profitability Flywheel, strict historical kill test plus regime-aware forward paper check

## Trigger

After forward paper regime tagging was repaired, the next queued branch was `validation.optionally-test-remaining-avax-b-tier-alert-edge-candidates`. The strongest remaining AVAX historical B-tier alert-edge bucket was:

- symbol: `AVAX`
- timeframe: `1h`
- setup: `range_breakdown_short`
- direction: `short`
- regime: `down/low-vol`
- alert-edge historical stats: 44 samples, expectancy `0.2088R`, profit factor `1.3553`, baseline expectancy `-0.0807R`

## Candidate

Added research-only candidate `alert-edge-avax-range-breakdown-short-v0` to the strategy destruction filter.

Data access: AVAX Binance public spot candles were added to the local destruction-filter universe. This is public/no-key historical data and does not require exchange keys, wallet keys, paid services, accounts, or live execution.

## Filter Repair

The first filter run exposed an internal consistency bug: `verify-filter.mjs` already required survivor labels to satisfy walk-forward diagnostic out-of-sample folds, but `engine.mjs` did not add those diagnostic failures to the verdict. The filter initially reported 8 AVAX survivors and then failed verification.

The filter verdict now includes walk-forward diagnostic failures:

- `insufficient_walk_forward_folds`
- `weak_walk_forward_expectancy`
- `weak_walk_forward_baseline_lift`
- `weak_walk_forward_out_of_sample`
- `invalid_walk_forward_worst_fold`

After rerun, the report and verifier agree.

## Final Historical Result

Current strict filter report after the later AVAX pullback candidate was added:

- candidates: 13
- variants: 131
- survivors: 6
- rejected: 125
- AVAX variants tested: 8
- AVAX survivors: 6
- AVAX rejected variants: 2, both for `weak_walk_forward_out_of_sample`

Best AVAX survivor:

- variant: `alert-edge-avax-range-breakdown-short-v0#1`
- parameters: `lookback=20`, `volumeZ=0.4`, `rsiMaxShort=45`, `trend=down`, `volatility=low-vol`
- sample: 213
- expectancy: `0.2066R`
- profit factor: `1.3536`
- deflated-Sharpe proxy: `1.7773`
- max drawdown: `10.1373R`
- out-of-sample: 74 trades, `0.1426R`
- baseline lift: `0.4098R`
- walk-forward: 5/5 positive folds, 5/5 positive baseline-lift folds, 2/2 diagnostic out-of-sample folds
- minimum fold expectancy: `0.0548R`

## Forward Paper Check

Regime-aware forward paper check:

- exact key: `AVAX|1h|range_breakdown_short|down/low-vol`
- exact forward paper rows: 0
- adjacent same-symbol/timeframe/setup/direction rows in other regimes: 0

Decision: historical research gate survives, but T3 forward paper support is absent. This candidate moves to Watch / Forward-paper-needed only. It is not paper-qualified, alert-qualified, or live-qualified.

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

## Reassessment

This is the first alert-edge candidate in the current run set to survive the strict historical destruction filter after the walk-forward verdict repair. The next honest move is not promotion; it is to monitor for exact regime-tagged forward paper rows and later recheck if enough forward samples accumulate.

Useful next branches:

- `validation.recheck-avax-range-breakdown-after-forward-paper-threshold`
- retest the second AVAX B-tier bucket, `AVAX 1h trend_pullback_reclaim_long up/mid-vol`, only as another strict research candidate
- add an explicit forward-paper threshold for historical survivors before any future paper-qualified proposal

## Boundaries

No live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
