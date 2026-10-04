---
type: note
topic: pdh-pdl-second-gate-walk-forward
created: 2026-09-26T17:32:00Z
last_updated: 2026-09-26T17:32:00Z
work_item: validation.pdh-pdl-second-gate-walk-forward
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - walk-forward
related:
  - 2026-09-26-pdh-pdl-btc-gated-liquidity-sweep-long-kill-test.md
  - 2026-09-26-demo-sim-strategy-candidate-spec-seed-list.md
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-pdh-pdl-second-gate-walk-forward.md
---
# PDH/PDL Second Gate Walk-Forward

## Purpose

This closes the harsher second gate for `pdh-pdl-btc-gated-liquidity-sweep-long` after the cheap September-forward test survived.

The second gate tested whether the apparent forward edge survives:

- PDH reclaim vs true PDL sweep/reclaim split
- monthly previous-fit/current-forward walk-forward folds
- 24h forward-month embargo
- UTC, 8h, and 12h session offsets
- touch-only baseline comparison
- limited comparison to existing `range_breakout_long + BTC_RISK_ON` DEMO-SIM replay rows

## Implementation

Added `experiments/btc-eth-alert-edge/src/demo-sim-pdh-pdl-second-gate-walk-forward.mjs` and package script `demo-sim:pdh-pdl-second-gate`.

Outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-pdh-pdl-second-gate-walk-forward.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-pdh-pdl-second-gate-walk-forward.md`

## Result

Verdict: `reject_no_touch_baseline_lift`.

The best sweep/reclaim variant was:

- `sweep_reclaim|pdh_reclaim_long|session_8h`
- walk-forward trades: 785
- winrate: 47.90%
- net: +16050.85 USDT per 10k toy equity
- profit factor: 1.2606
- max drawdown: 117.91%
- positive forward months: 2/5

Best touch-only baseline:

- `touch_baseline|pdh_touch_hold|session_8h`
- walk-forward trades: 1577
- winrate: 48.13%
- net: +42877.06 USDT per 10k toy equity
- profit factor: 1.3869
- max drawdown: 128.85%

The true PDL sweep/reclaim variants were weak:

- UTC PDL sweep/reclaim: 110 walk-forward trades, -3929.76 per 10k, PF 0.6348
- 8h PDL sweep/reclaim: 112 walk-forward trades, -8393.32 per 10k, PF 0.2987
- 12h PDL sweep/reclaim: 116 walk-forward trades, -8668.97 per 10k, PF 0.3080

Existing `range_breakout_long + BTC_RISK_ON` replay comparison remains stronger on the limited available surface:

- August: 69 trades, +7747.56 per 10k, PF 1.8955
- September: 38 trades, +1287.86 per 10k, PF 1.2307

## Interpretation

The cheap test's apparent edge was mostly PDH reclaim, not true PDL liquidity sweep/reclaim. Under harsher monthly folds and session sensitivity, PDH/PDL does not clear the second gate.

Reasons:

- not positive in at least 60% of forward months
- drawdown far above the 25% gate
- best sweep/reclaim variant loses to best touch-only baseline
- true PDL sweep/reclaim variants are negative
- range-breakout BTC-risk-on remains a better existing research pocket on available replay rows

Conclusion: downgrade PDH/PDL from active validation to rejected/watch-only reference. Do not promote to paper candidate, alert logic, sizing, execution, or scheduler automation.

## Next Route

Move to the next seeded strategy candidate: `btc-risk-on-opening-range-breakout-continuation`.

Rationale: ORB is closer to the existing range-breakout survivor, can be tested with one fixed single-config rule, and can be compared directly against `range_breakout_long + BTC_RISK_ON` without adding accounts, keys, paid services, schedulers, alert changes, sizing, or execution.

## Verification

- `npm run demo-sim:pdh-pdl-second-gate --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.

## Boundary Delta

Changed:

- added one research-only DEMO-SIM script
- added one package script
- generated second-gate result JSON/Markdown
- updated queues/docs/memory

Unchanged:

- no live trading
- no live alert wording
- no watcher behavior
- no scheduler or cron payloads
- no keys, accounts, wallets, or paid APIs
- no sizing, leverage, risk, TP/SL, or execution behavior
- no public posting
- no strategy promotion
