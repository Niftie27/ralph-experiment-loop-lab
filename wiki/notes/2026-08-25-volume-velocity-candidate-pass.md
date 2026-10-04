---
type: research-note
created: 2026-08-25T22:45:00Z
topic: volume-velocity-candidate-pass
status: rejected-research-candidate
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - ../notes/2026-08-25-profitability-loop-integration-map.md
  - ../notes/2026-08-21-alert-feedback-data-analysis.md
  - ../notes/2026-08-13-orderflow-alert-alignment-check.md
  - ../concepts/strategy-destruction-filter.md
  - ../../experiments/strategy-destruction-filter/README.md
sources:
  - ../../../crypto-updates/runtime/alert-feedback.jsonl
  - ../../experiments/strategy-destruction-filter/results/volume-velocity-alert-feedback.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
---
# Volume Velocity Candidate Pass

Status: research-only. This pass changed no live trading, orders, exchange keys, wallet keys, paid APIs, cron cadence, alert wording, watcher behavior, thresholds, risk, sizing, TP/SL, or execution.

## Question

Can the best clean `VELOCITY` alert-feedback bucket become a strict `strategy-destruction-filter` candidate without relying on pre-fix, stale-book, HYPE event-only, or malformed evidence rows?

## Data-Quality Pass

Added a reproducible local analysis command:

```bash
npm run analyze:alert-feedback --prefix ralph-research-os/experiments/strategy-destruction-filter
```

The pass joined `alert_sent` rows to `review_finalized` rows in `crypto-updates/runtime/alert-feedback.jsonl`, kept only `VELOCITY` alerts, separated HYPE event-only rows from BTC/ETH/SOL evidence rows, and excluded rows with:

- delayed or untrusted delivery;
- negative `bookAgeMs`;
- `score > maxScore`.

Result:

- `146` joined velocity reviews;
- `144` included after strict quality exclusions;
- `2` excluded rows:
  - `ETH-DOWN-1787306244437-fyw5vc`: negative `bookAgeMs`;
  - `SOL-DOWN-1787310760275-0fd565`: negative `bookAgeMs` and `score=6/5`.

## Selected Bucket

Selected research seed:

- Bucket: `ETH|60s|DOWN|5/5|clean_orderflow_book`
- Sample: `4`
- Verdict mix: `4` fade-useful, `0` follow-useful, `0` noisy
- Average directional move: `30m -0.4829%`, `1h -0.5246%`
- Alert ids:
  - `ETH-DOWN-1787351462736-f5kvh3`
  - `ETH-DOWN-1787364017274-190mj4`
  - `ETH-DOWN-1787644182524-q4d5qb`
  - `ETH-DOWN-1787692087789-pk6bzs`

Interpretation: this is the cleanest velocity bucket because it is ETH/Binance, has evidence `5/5`, fresh public book state, non-negative book ages, and finalized reviews. It is not a promotion candidate by itself because `N=4` is tiny.

## Candidate Conversion

Added `alert-feedback-eth-velocity-fade-v0` as a strict candidate using the smallest honest historical proxy available in the current filter:

- Rule: `volume_velocity_fade`
- Symbol/timeframe: ETH `1h`
- Direction: `long` after a down shock
- Mechanism: high-evidence ETH 60s DOWN velocity alerts may mark short-term exhaustion when trade-flow/book evidence is fresh.
- Proxy caveat: the filter uses OHLCV candle return and volume-z shocks; it does not reconstruct exact 60s row-level alert events from historical tick/order-book data.
- Baseline: time-matched alternating direction.
- Kill criteria: low source-bucket sample, proxy-not-row-level-velocity caveat, weak OOS expectancy, weak baseline lift, bad failure slice, deflated-Sharpe failure.

## Destruction Filter Result

Latest full run:

- `9` candidates;
- `105` variants;
- `0` survivors;
- `105` rejected.

Best new ETH velocity-fade variant:

- Variant: `alert-feedback-eth-velocity-fade-v0#8`
- Parameters: `returnLookback=1`, `minMovePct=1`, `volumeZ=1`, `rsiLow=45`, `rsiHigh=55`
- Sample: `954`
- Expectancy: `-0.1655R`
- Profit factor: `0.7693`
- Deflated-Sharpe proxy: `-4.2329`
- Out-of-sample expectancy: `-0.1932R`
- Baseline expectancy lift: `-0.0312R`
- Max drawdown: `164.213R`
- Walk-forward: `0/5` positive folds

Verdict: rejected. The source bucket stays a watch/research lead only. The broad ETH hourly proxy says not to promote this into paper/live strategy logic.

## Verification

Passed:

```bash
npm run analyze:alert-feedback --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run validate:candidates --prefix ralph-research-os/experiments/strategy-destruction-filter
npm test --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run audit:data --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run study:features --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run filter --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter
```

The test suite now has `26/26` passing tests.

## Next Read

Do not keep squeezing this candidate without new data. The next useful work is either:

- wait for more finalized clean BTC/ETH/SOL velocity alerts with fresh book fields; or
- build a separate 1m/tick replay adapter if exact 60s velocity events need historical reconstruction.
