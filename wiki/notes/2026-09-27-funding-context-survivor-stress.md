---
type: note
topic: funding-context-survivor-stress
created: 2026-09-27T07:50:00Z
last_updated: 2026-09-27T07:50:00Z
work_item: validation.funding-context-survivor-stress
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - funding
related:
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-funding-context-survivor-stress.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-funding-persistence-context-baseline.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-range-breakout-survivor-stress.md
---
# Funding Context Survivor Stress

## Purpose

This hardens the previous `funding-persistence-context-baseline` hint.

The test re-joins existing cached public/no-key Hyperliquid funding rows onto existing DEMO-SIM replay rows, restricts to `range_breakout_long + BTC_RISK_ON + persistent_positive`, and asks whether the funding context survives remove-best symbol/month/week, fee stress, stale/missing checks, loss-cluster checks, and top-pocket drawdown.

No new funding data was fetched. No paper-fund allocation, sizing, TP/SL, alert, watcher, scheduler, or execution behavior changed.

## Implementation

Added `experiments/btc-eth-alert-edge/src/demo-sim-funding-context-survivor-stress.mjs` and standalone package script `demo-sim:funding-survivor-stress`.

Outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-funding-context-survivor-stress.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-funding-context-survivor-stress.md`

The script is not included in `demo-sim:all` and is not wired to cron.

## Result

Verdict: `reject_week_concentration`.

Persistent-positive funding on the selected survivor:

- 55 closed trades
- +6420.03 USDT per 10k toy equity
- PF 1.8497
- 58.2% winrate
- 22.83% max drawdown

Top-pocket persistent-positive funding:

- 40 closed trades
- +4605.96 USDT
- PF 1.7584
- 60.0% winrate
- 26.69% max drawdown

Concentration stresses:

- remove best symbol BNB: remainder +4841.39 USDT, PF 1.6640, 23.63% max drawdown
- remove best month 2026-08: remainder 0 trades, 0.00 USDT
- remove best week 2026-W34: remainder 3 trades, -80.31 USDT, PF 0.8647

Cost stress:

- double fees: +5815.03 USDT, PF 1.7447, 24.30% max drawdown
- extra 10 bps round trip: +5870.03 USDT, PF 1.7539, 24.17% max drawdown
- extra 20 bps round trip: +5320.03 USDT, PF 1.6637, 25.55% max drawdown

Funding availability:

- available funding rows: 69 selected trades, +7747.56 USDT, PF 1.8955, 21.49% max drawdown
- stale funding rows: 38 selected trades, +1287.86 USDT, PF 1.2307, 13.35% max drawdown

Worst persistent-positive consecutive loss cluster:

- 2026-08-22T04:00:00Z to 2026-08-22T05:00:00Z
- 13 trades
- -4752.49 USDT
- symbols: AVAX, BNB, DOGE, ETH, LINK, SOL, XRP

## Interpretation

Persistent-positive funding is a useful explanatory context hint, but it is not robust enough to become a promotion filter.

The branch stays positive after symbol removal and cost stresses, but it fails remove-best-month and remove-best-week. Nearly all evidence is in August 2026, especially week 2026-W34. The top-pocket persistent-positive drawdown also remains above the 25% readiness gate.

Keep funding as context only. Do not wire it to DEMO-SIM paper fund, live alerts, watchers, sizing, TP/SL, execution, or schedulers.

## Verification

- `node --check ralph-research-os/experiments/btc-eth-alert-edge/src/demo-sim-funding-context-survivor-stress.mjs` passed.
- `npm run demo-sim:funding-survivor-stress --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- `work-queues.yaml` and `package.json` parsed.
- `demo-sim:all` was checked and still does not include the funding survivor stress script.
- `node ralph-research-os/automation/research-validation-checklist.mjs` ran with queue/path/delivery/HITL/boundary checks passing; overall remains `fail` because of pre-existing retrieval failure, subsystem/cron warnings, and paper-demo `not-ready`.

## Boundary Delta

Changed:

- added one research-only funding survivor stress script
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
