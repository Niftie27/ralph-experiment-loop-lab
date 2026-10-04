---
type: note
topic: survivor-cluster-postmortem
created: 2026-09-27T08:00:00Z
last_updated: 2026-09-27T08:00:00Z
work_item: validation.survivor-cluster-postmortem
status: complete
scope: research-only
tags:
  - ralph
  - demo-sim
  - range-breakout-survivor
  - impulse-exhaustion
  - synchronized-loss-cluster
  - research-only
  - no-promotion
related:
  - ../concepts/impulse-exhaustion-research-branch.md
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-survivor-cluster-postmortem.md
  - 2026-09-27-funding-context-survivor-stress.md
  - 2026-09-26-range-breakout-survivor-stress.md
---

# Survivor Cluster Postmortem

## Purpose

This decomposes the only useful current pocket, `range_breakout_long + BTC_RISK_ON`, with special attention to the concentrated August 2026 / `2026-W34` evidence.

It does not test a new strategy. It asks what regime shape produced the survivor and what failure mode blocks promotion.

## Implementation

Added `experiments/btc-eth-alert-edge/src/demo-sim-survivor-cluster-postmortem.mjs` and standalone package script `demo-sim:survivor-cluster-postmortem`.

Outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-survivor-cluster-postmortem.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-survivor-cluster-postmortem.md`

The script uses existing DEMO-SIM replay rows, local Binance spot candles, and cached public/no-key funding context only. It is not included in `demo-sim:all` and is not wired to cron.

## Result

Verdict: `cluster_explains_survivor_but_not_robust_edge`.

Selected survivor overall:

- 107 closed trades
- +9035.42 USDT per 10k toy equity
- PF 1.6348
- 50.5% winrate
- 24.54% max drawdown

Focus month/week:

- 2026-08: 69 trades, +7747.56 USDT, PF 1.8955, 58.0% winrate, 21.49% max drawdown
- 2026-W34: 66 trades, +7827.87 USDT, PF 1.9714, 59.1% winrate, 21.13% max drawdown
- outside 2026-W34: 41 trades, +1207.55 USDT, PF 1.1956, 36.6% winrate

## Market Context

BTC context during focus week:

- BTC 4h close-to-close return: +19.8%
- BTC high from start: +23.2%
- BTC low from start: -0.4%
- BTC risk-on share: 100.0%
- average BTC 4h range: 2.5%

The broad symbol context was also risk-on:

- 7 of 8 focus symbols were positive in the selected rows.
- Week returns from local candles were strongly positive across the alt set, for example XRP +55.5%, DOGE +32.5%, ADA +32.3%, ETH +26.5%, SOL +21.8%, AVAX +20.5%, LINK +20.3%, BNB +17.1%.

## Failure Mode

The main failure was not one bad symbol. It was synchronized post-impulse loss.

Worst focus-week loss cluster:

- 2026-08-22T04:00:00Z to 2026-08-22T05:00:00Z
- 13 trades
- -4752.49 USDT
- symbols: AVAX, BNB, DOGE, ETH, LINK, SOL, XRP

Second-worst cluster:

- 2026-08-19T22:00:00Z to 2026-08-20T03:00:00Z
- 8 trades
- -1439.01 USDT
- symbols: ADA, AVAX, BNB, DOGE, ETH, LINK, SOL, XRP

## Interpretation

The useful pocket looks like a short-lived broad alt risk-on expansion under BTC confirmation, not a durable standalone range-breakout rule.

The learning is now more specific: the edge may be in detecting the early/middle part of a synchronized BTC-led alt impulse, and the no-trade/cool-down mechanism must avoid late synchronized losses after that impulse.

Do not promote the survivor or funding context from this cluster alone.

## Next Route

Recommended next validation is not another naive entry variant. If continuing research, run a standalone `impulse-exhaustion-cooldown-postmortem` around the 2026-08-22 loss cluster:

- identify conditions present before the synchronized loss burst
- compare candidate no-trade/cool-down filters against W34 winners
- test whether a cool-down would preserve enough early impulse profit while cutting late losses
- keep standalone only, not `demo-sim:all`, cron, watcher behavior, sizing, TP/SL, or execution

## Verification

- `node --check ralph-research-os/experiments/btc-eth-alert-edge/src/demo-sim-survivor-cluster-postmortem.mjs` passed.
- `npm run demo-sim:survivor-cluster-postmortem --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- `work-queues.yaml` and `package.json` parsed.
- `demo-sim:all` was checked and still does not include the survivor cluster postmortem.
- `node ralph-research-os/automation/research-validation-checklist.mjs` ran with queue/path/delivery/HITL/boundary checks passing; overall remains `fail` because of pre-existing retrieval failure, subsystem/cron warnings, and paper-demo `not-ready`.

## Boundary Delta

Changed:

- added one research-only survivor cluster postmortem script
- added one standalone package script
- generated standalone JSON/Markdown results
- updated roadmap, queue, log, and memory

Unchanged:

- no scheduler or cron payload changes
- no live alerts
- no watcher behavior
- no keys, accounts, wallets, or paid APIs
- no sizing, leverage, risk, TP/SL, or execution behavior
- no public posting
- no strategy promotion
