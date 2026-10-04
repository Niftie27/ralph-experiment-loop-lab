---
type: note
topic: btc-risk-on-orb-continuation-kill-test
created: 2026-09-26T19:05:00Z
last_updated: 2026-09-26T19:05:00Z
work_item: validation.btc-risk-on-opening-range-breakout-continuation
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - rejected
  - btc-risk-on
related:
  - 2026-09-26-demo-sim-strategy-candidate-spec-seed-list.md
  - 2026-09-26-pdh-pdl-second-gate-walk-forward.md
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-orb-continuation.md
---
# BTC Risk-On ORB Continuation Kill Test

## Purpose

This closes the cheapest fixed-rule validation for `btc-risk-on-opening-range-breakout-continuation`.

The test asked whether a simple opening-range breakout continuation rule can replace or challenge the existing `range_breakout_long + BTC_RISK_ON` DEMO-SIM replay pocket without tuning.

## Implementation

Added `experiments/btc-eth-alert-edge/src/demo-sim-orb-continuation.mjs` and package script `demo-sim:orb-continuation`.

Outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-orb-continuation.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-orb-continuation.md`

Fixed rule:

- 1h cached Binance spot candles
- first 4 UTC hourly candles define the opening range
- one long per symbol/day on the first later close above opening-range high
- explicit BTC gate must be `BTC_RISK_ON` by the same close/MA20/MA50 proxy used in DEMO-SIM replay context
- entry at candidate candle close
- fixed 12h hold exit
- 4 bps fee plus 2 bps slippage per side
- no parameter search

## Result

Verdict: `reject_drawdown_too_high`.

Primary ORB acceptance:

- overall: 423 trades, -9420.67 USDT per 10k toy equity, PF 0.7655, 152.51% max drawdown
- walk-forward: 329 trades, -3206.24 per 10k, PF 0.8947, 99.47% max drawdown
- positive forward months: 1/5

Simple OR-high touch baseline:

- overall: 467 trades, -9954.93 per 10k, PF 0.7761, 138.10% max drawdown
- walk-forward: 368 trades, -4609.44 per 10k, PF 0.8683, 91.56% max drawdown
- positive forward months: 1/5

No-trade baseline beats both on drawdown and PnL preservation.

Existing `range_breakout_long + BTC_RISK_ON` replay comparison remains stronger on the limited replay surface:

- 107 trades, +9035.42 per 10k, PF 1.6348, 24.54% max drawdown
- August: 69 trades, +7747.56 per 10k, PF 1.8955
- September: 38 trades, +1287.86 per 10k, PF 1.2307

## Interpretation

The fixed UTC 4h ORB acceptance rule is rejected. September was positive, but the broader March-September surface and purged monthly walk-forward are negative, unstable, and drawdown-impaired.

Reasons:

- walk-forward net is negative after fixed costs
- walk-forward PF is below 1.1
- only 1/5 forward months is positive
- walk-forward drawdown is far above the 25% kill threshold
- existing `range_breakout_long + BTC_RISK_ON` is materially stronger

Do not tune the ORB window or convert this into paper/live logic from this result. If ORB is revisited later, it should require a new mechanism reason, not parameter search around this failed fixed rule.

## Next Route

Keep `range_breakout_long + BTC_RISK_ON` as the only current watch pocket, still blocked from promotion by strict-filter failure and DEMO-SIM capital impairment. Next useful research should move laterally to another seed, such as funding-persistence context or range/grid offline falsification, unless Tomas explicitly asks to harden the existing range-breakout survivor.

## Verification

- `node --check ralph-research-os/experiments/btc-eth-alert-edge/src/demo-sim-orb-continuation.mjs` passed.
- `npm run demo-sim:orb-continuation --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- YAML parse passed for `automation/work-queues.yaml`, `automation/retrieval-router.yaml`, and `index.yaml`.
- `node ralph-research-os/automation/research-validation-checklist.mjs` ran; queue/path/delivery/HITL/boundary checks pass, but overall remains `fail` because of pre-existing retrieval/index drift plus subsystem/cron warnings and paper-demo not-ready state.

## Boundary Delta

Changed:

- added one research-only DEMO-SIM script
- added one standalone package script
- generated fixed-rule ORB result JSON/Markdown
- updated queues/docs/memory

Unchanged:

- no scheduler or cron payload changes
- no live alerts
- no watcher behavior
- no keys, accounts, wallets, or paid APIs
- no sizing, leverage, risk, TP/SL, or execution behavior
- no public posting
- no strategy promotion
