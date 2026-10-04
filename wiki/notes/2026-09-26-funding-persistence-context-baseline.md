---
type: note
topic: funding-persistence-context-baseline
created: 2026-09-26T21:45:00Z
last_updated: 2026-09-26T21:45:00Z
work_item: validation.funding-persistence-context-baseline
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - baseline-comparison
  - funding
related:
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-funding-persistence-context-baseline.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-range-breakout-survivor-stress.md
  - 2026-09-26-demo-sim-strategy-candidate-spec-seed-list.md
---
# Funding Persistence Context Baseline

## Purpose

This starts and closes the first cheap validation for `funding-persistence-context-baseline`.

The test is under RALPH `backtesting_lab`: it joins public/no-key Hyperliquid funding sign and persistence context onto existing DEMO-SIM rows, then compares whether the context improves `range_breakout_long + BTC_RISK_ON` versus BTC regime alone, no-trade, and the latest survivor stress results.

`demo_sim_paper_fund` remains only a consumer/comparison surface. No paper-fund allocation, sizing, TP/SL, alert, watcher, scheduler, or execution behavior changed.

## Implementation

Added `experiments/btc-eth-alert-edge/src/demo-sim-funding-persistence-context-baseline.mjs` and standalone package script `demo-sim:funding-persistence`.

Outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-funding-persistence-context-baseline.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-funding-persistence-context-baseline.md`
- `experiments/btc-eth-alert-edge/data/funding/hyperliquid-funding-history-demo-sim.json`

The script is not included in `demo-sim:all` and is not wired to cron.

## Public Access Check

Verified Hyperliquid public/no-key `info` access before the run:

- `metaAndAssetCtxs` exposed all DEMO-SIM replay symbols: ADA, AVAX, BNB, BTC, DOGE, ETH, LINK, SOL, XRP.
- `fundingHistory` returned historical rows without account, key, paid service, or scheduler changes.
- Local cache now contains 4500 funding rows for the replay window.

## Result

Verdict: `funding_context_improves_research_bucket`.

Baseline `range_breakout_long + BTC_RISK_ON`:

- 107 closed trades
- +9035.42 USDT per 10k toy equity
- PF 1.6348
- 50.5% winrate
- 24.54% max drawdown

Funding-available subset:

- 69 closed trades
- +7747.56 USDT
- PF 1.8955
- 58.0% winrate
- 21.49% max drawdown

Best predeclared persistence bucket:

- bucket: `persistent_positive`
- 55 closed trades
- +6420.03 USDT
- +116.73 USDT average per trade
- PF 1.8497
- 58.2% winrate
- 22.83% max drawdown
- average PnL lift versus BTC regime alone: +32.28 USDT/trade
- PF lift versus BTC regime alone: +0.2149

Known top pocket with persistent positive funding:

- 40 closed trades
- +4605.96 USDT
- PF 1.7584
- 26.69% max drawdown

## Interpretation

Persistent positive funding is a useful research context hint for the current survivor, not a standalone strategy.

It improves the selected bucket on average PnL, profit factor, winrate, and selected-bucket drawdown versus BTC regime alone. But it does not remove the broader survivor-stress blockers: synthetic replay, selected-after-grid bias, top-pocket drawdown above the 25% readiness gate, negative ambiguous rows, loss-cluster risk, and week concentration.

Do not convert this into carry, margin, sizing, entry, alert, watcher, TP/SL, or execution logic without a separate cost/tail/accounting design and explicit Tomas approval.

## Verification

- Hyperliquid public/no-key access check passed for `metaAndAssetCtxs` and `fundingHistory`.
- `node --check ralph-research-os/experiments/btc-eth-alert-edge/src/demo-sim-funding-persistence-context-baseline.mjs` passed.
- `npm run demo-sim:funding-persistence --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.

## Boundary Delta

Changed:

- added one research-only funding-context join script
- added one standalone package script
- generated standalone JSON/Markdown results
- cached public/no-key Hyperliquid funding rows locally
- updated roadmap, queue, log, and memory

Unchanged:

- no scheduler or cron payload changes
- no live alerts
- no watcher behavior
- no keys, accounts, wallets, or paid APIs
- no sizing, leverage, risk, TP/SL, or execution behavior
- no public posting
- no strategy promotion
