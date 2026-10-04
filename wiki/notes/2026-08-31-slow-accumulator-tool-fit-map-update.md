---
type: note
topic: slow-accumulator-tool-fit-map-update
created: 2026-08-31T11:41:37Z
last_updated: 2026-08-31T11:41:37Z
work_item: discovery.slow-accumulator-tool-fit-map
status: complete
scope: research-only
sources:
  - ../comparisons/slow-accumulator-tool-fit-map.md
  - 2026-08-31-slow-accumulator-copytrading-source-fit.md
  - 2026-08-31-slow-accumulator-following-exit-risk-scan.md
  - 2026-08-31-mid-cap-accumulation-flow-scan.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
  - source-scan
related:
  - ../concepts/smart-money-accumulation-cohort.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---
# Slow Accumulator Tool Fit Map Update

## Purpose

This closes `discovery.slow-accumulator-tool-fit-map` by updating the older comparison with current access and boundary facts.

No scanner, copy target, cohort, alert, threshold, account, key, paid service, risk sizing, TP/SL, execution, scheduler, public posting, or strategy promotion was created.

## Update

Updated `wiki/comparisons/slow-accumulator-tool-fit-map.md` with the 2026-08-31 source-fit split:

- Nansen Smart Money netflows are the highest-fit productized source for slow token accumulation/distribution, but need approved API/payment/credit access.
- Dune is the most transparent extraction route if a key or manual export is approved.
- Arkham is label/entity/flow enrichment, not the first active source.
- DefiLlama/public market data are context and baseline inputs only.
- Hyperliquid public info/stats, Copin, HyperDash, and BitMEX-style copytrading surfaces are prior art or triage for perps, not primary slow spot accumulation evidence.

## Decision

The current slow-accumulator tool map is no longer "which dashboard should we copy from?" It is:

1. use no-key context only until access is approved;
2. require smart-money/token-flow rows, not leaderboard PnL;
3. require exit/distribution rows before paper promotion;
4. keep copytrading products as prior art and falsifier sources.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, scanner, cohort, or strategy promotion changed.
