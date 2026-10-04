---
type: note
created: 2026-08-29T20:22:00Z
topic: sol-b-tier-candidate-destruction
status: rejected
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
related:
  - ../../core/profitability-flywheel.md
  - ../../automation/retrieval-router.yaml
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge/results/edge-summary.md
  - ../../experiments/btc-eth-alert-edge/results/paper-dashboard.md
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
---
# SOL B-Tier Candidate Destruction

Status: research-only rejection. This note does not change live alerts, scheduler behavior, risk, sizing, TP/SL, execution, keys, paid services, public posting, or strategy promotion.

## Flywheel Step

Queue item: `select-next-b-tier-alert-edge-candidate-after-forward-sample`.

Under the `RALPH Profitability Flywheel`, this run used the current local alert-edge paper/backtest outputs to select the next untested B-tier historical bucket, convert it into one strict candidate, run the strategy-destruction filter, and decide whether it deserved forward-paper or paper-qualified status.

## Selection

Latest local inputs:

- `experiments/btc-eth-alert-edge/results/edge-summary.md` generated `2026-08-29T20:04:26Z`.
- `experiments/btc-eth-alert-edge/results/paper-dashboard.md` generated `2026-08-29T20:04:26Z`.
- Existing strict alert-edge candidates already covered XRP 4h range breakout long and DOGE 1h momentum reversal long.

Remaining untested B-tier historical buckets:

| Bucket | Hist N | Exp R | PF | Baseline Exp R | Lift | Exact paper rows |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| SOL 1h trend_pullback_reclaim_long up/low-vol | 82 | 0.1065 | 1.1749 | -0.1557 | 0.2622 | 0 |
| AVAX 1h trend_pullback_reclaim_long up/mid-vol | 41 | 0.1273 | 1.2173 | -0.1149 | 0.2422 | 0 |
| AVAX 1h range_breakdown_short down/low-vol | 44 | 0.2088 | 1.3553 | 0.0233 | 0.1855 | 0 |

Selection: `SOL 1h trend_pullback_reclaim_long up/low-vol`, because it had the largest remaining historical sample and the best remaining lift after already-tested XRP and DOGE.

Important limitation: the paper signal ledger does not store regime, and this selected bucket had no exact symbol/timeframe/setup/direction paper rows. That means this was only eligible for a strict historical kill test, not forward-paper or paper-qualified promotion.

## Candidate Added

Added research-only candidate:

- `alert-edge-sol-trend-pullback-reclaim-long-v0`
- family: `alert_edge_trend_pullback`
- rule: `ma_reclaim`
- filters: `SOL`, `1h`, `trend=up`, `volatility=low-vol`
- claim: SOL 1h low-vol trend pullbacks that reclaim the fast moving average should keep positive expectancy, beat matched timestamp baselines, and survive OOS after costs.
- explicit no-promotion condition: do not paper-qualify without forward paper support.

## Strict Filter Result

Verification commands:

- `npm run validate:candidates`
- `npm run filter`
- `npm run study:features`
- `npm run verify`

Overall strict harness:

- candidates: `11`
- variants: `122`
- survivors: `0`
- rejected: `122`

SOL candidate result:

- variant: `alert-edge-sol-trend-pullback-reclaim-long-v0#1`
- sample: `353`
- win rate: `40.79%`
- expectancy: `-0.0359R`
- profit factor: `0.9476`
- deflated Sharpe proxy: `-0.6698`
- max drawdown: `45.7886R`
- total net: `-12.661R`
- OOS sample: `174`
- OOS expectancy: `0.0709R`
- walk-forward positive folds: `1/5`
- baseline expectancy: `-0.1533R`
- baseline lift: `0.1174R`

Failure gates:

- `weak_expectancy_after_costs`
- `weak_profit_factor`
- `deflated_sharpe_fail`
- `drawdown_too_high`

## Decision

Reject `alert-edge-sol-trend-pullback-reclaim-long-v0`.

The alert-edge headline bucket looked mildly positive, and the OOS slice was positive, but the stricter full-sample replay rejected the idea: negative expectancy after costs, sub-1 profit factor, failed deflated-Sharpe proxy, excessive drawdown, and only one positive walk-forward fold.

This is not a live signal, not an alert wording change, and not a paper-qualified candidate.

## Reassess

Confidence in the Profitability Flywheel increased: the loop correctly converted an attractive B-tier bucket into a falsifiable candidate and rejected it before promotion.

Confidence in the SOL 1h pullback-reclaim mechanism decreased. Do not repackage the same idea unless a future run adds materially different evidence such as regime-specific forward paper rows, better execution-realism evidence, or a different source-backed mechanism.

Next branch:

1. Continue remaining B-tier historical kill tests with AVAX only if the loop needs more candidate destruction examples.
2. Higher-value route may be improving forward-paper regime tagging, because the current paper ledger cannot verify regime-level support for historical buckets.
3. Keep orderflow and TA call-candidate work watch-only until sample thresholds and execution attribution improve.

## Self-Check

- Scope: A2 research/paper only.
- Used current router, queue, state, flywheel contract, alert-edge outputs, paper ledger, and strict local filter artifacts.
- Used existing local/public data only.
- No web search was needed because this was not custom build/data expansion; it reused the already wheel-gated local strategy-destruction harness.
- No live trading, wallet keys, exchange keys, paid APIs/services, accounts, public posting, scheduler changes, live alert wording, risk/sizing/TP/SL, execution changes, watcher behavior, orders, or strategy promotion changed.

