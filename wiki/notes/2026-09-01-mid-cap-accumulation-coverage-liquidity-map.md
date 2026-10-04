---
type: note
topic: mid-cap-accumulation-coverage-liquidity-map
created: 2026-09-01T05:48:36Z
last_updated: 2026-09-01T05:48:36Z
work_item: unknowns.U-024
status: done
scope: research-only
sources:
  - 2026-08-31-mid-cap-accumulation-flow-scan.md
  - 2026-08-31-slow-accumulator-following-exit-risk-scan.md
  - 2026-08-31-smart-money-cohort-discovery-layer.md
  - 2026-09-01-cohort-flow-vs-single-wallet-signal-map.md
  - 2026-09-01-patient-retail-strategy-leg-repeat-fit-map.md
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../../decisions/unknowns.md
  - ../../decisions/candidates.md
  - ../../automation/work-queues.yaml
---
# Mid-Cap Accumulation Coverage Liquidity Map

## Purpose

Resolve `U-024` for current routing: decide whether mid-cap accumulation can be measured with enough coverage and liquidity to matter under the current no-key/A2 constraints.

This is a coverage/liquidity routing note only. It does not create a cohort, scanner, collector, account, key, paid source, schedule, alert, threshold, paper candidate, live trade, sizing, TP/SL, execution behavior, or public post.

## Decision

Mid-cap accumulation remains one of the best-fitting strategy ideas for Tomas in principle, but it is not currently measurable enough from active no-key workspace data to become a paper candidate.

The branch is Watch / needs-access until a source can provide both:

- coverage: frozen 20+ wallet/entity rows with entry and exit/distribution windows;
- liquidity: token volume/market-cap/spread or impact context proving a delayed follower could enter and exit without turning the paper result into fantasy.

## Minimum Measurement Bar

| Requirement | Pass bar | Current state |
| --- | --- | --- |
| Wallet/entity coverage | 20+ wallets/entities selected before outcome scoring. | Not available from active no-key routes. |
| Time coverage | 7-14 day entry window plus later exit/distribution or explicit no-exit. | Requires Nansen/Dune/Arkham-style export or manual rows. |
| Token scope | Mid-cap, real projects, not fresh illiquid launches or one meme narrative. | DefiLlama/public data can help filter, but not identify cohorts. |
| Flow quality | Net token and USD flow, stablecoin/source-of-funds where visible, exchange/internal/LP/treasury flags. | Not available from current public/no-key local state. |
| Liquidity realism | Volume, market cap, spread/impact proxy, and capacity caveat. | Public context can help, but must be joined to cohort rows. |
| Exit observability | Exit/distribution/reduction rows are first-class. | Missing exits are a veto before paper promotion. |
| Baselines | Token hold, beta, sector, momentum, and no-trade. | Feasible after rows exist. |
| Outlier control | Re-score without largest wallet/token/event. | Feasible after rows exist. |

## Current Source Split

- DefiLlama/public market data: active context and liquidity filter, not wallet/entity flow.
- Hyperliquid public routes: active for known-address perp checks and tiny falsifiers, not slow spot/mid-cap cohort coverage.
- Dune: query-fit and likely transparent, but key/export/manual-row gated.
- Nansen: highest-fit productized source for smart-money netflows, but approval/payment/key gated.
- Arkham: enrichment/label/entity fit, but approval/account/API gated and not the first active signal source.

## Routing Consequence

Do not spend current A2 work on a mid-cap accumulation scanner. The missing piece is not a parser; it is source access and row quality.

The next valid branch is one of:

- HITL-approved tiny Nansen/Dune/Arkham export/API sample;
- a no-key public table that already exposes exportable cohort flow rows;
- continued funding/basis baseline observation as the comparison floor;
- token-unlock source-first scan only if selected separately.

## Boundary Delta

Changed: wiki/router/queue/state/log/index/memory only.

Boundary delta: no account, key, paid service, API use, collector, scanner, scheduler, cron, systemd, alert, threshold, copy rule, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.
