---
type: note
topic: cohort-flow-vs-single-wallet-signal-map
created: 2026-09-01T05:45:28Z
last_updated: 2026-09-01T05:45:28Z
work_item: unknowns.U-022
status: done
scope: research-only
sources:
  - 2026-08-30-aggregate-flow-signal-feasibility.md
  - ../concepts/smart-money-accumulation-cohort.md
  - ../comparisons/copyable-wallets-vs-radar-wallets.md
  - 2026-08-31-smart-money-cohort-discovery-layer.md
  - 2026-09-01-wallet-shadowing-existing-tool-coverage-map.md
  - 2026-09-01-event-vs-continuous-small-operator-map.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
related:
  - ../../decisions/unknowns.md
  - ../../decisions/candidates.md
  - ../../automation/work-queues.yaml
---
# Cohort Flow Vs Single-Wallet Signal Map

## Purpose

Resolve `U-022` for current routing: decide whether aggregate cohort flow is a better signal target than single-wallet copying, and what evidence would be needed before it can become more than a watch item.

This note is routing memory only. It does not create a cohort, scanner, collector, account, key, paid source, schedule, alert, threshold, paper candidate, live trade, sizing, TP/SL, execution behavior, or public post.

## Decision

For Tomas's patient-retail constraints, cohort flow is the preferred signal target over single-wallet copying.

But preferred does not mean active or proven. Under current no-key access, wallet/cohort aggregate flow remains Watch / needs-access because the workspace cannot yet produce frozen token-flow plus exit/distribution rows for 20+ wallets/entities.

Single-wallet copying stays useful only for:

- radar/context;
- failure-mode examples;
- known-address delay falsifiers;
- rejection of leaderboard-biased candidates.

## Why Cohort Flow Is Better In Principle

| Dimension | Cohort flow | Single-wallet copying |
| --- | --- | --- |
| Selection bias | Lower if cohort is frozen before outcome review and not leaderboard-selected. | Very high when chosen by PnL, screenshots, social reputation, or one famous address. |
| Hidden hedge risk | Reduced, not removed; multiple entities can still share hidden exposure. | High because the visible wallet may be one leg of a hedge. |
| Latency fit | Better for slow accumulation over days/weeks. | Often poor unless wallet behavior is slow and exits are visible. |
| Outlier dependence | Can be tested by removing largest wallet/token/event. | Often dominated by one wallet, one trade, or one event. |
| Exit risk | Measurable only if exit/distribution rows exist. | Usually weak unless full round trips are visible. |
| Baselines | Can compare against token hold, beta, sector, momentum, and no-trade. | Usually confounded by wallet-specific leverage, timing, and unavailable hedges. |

## Required Evidence Before Active Promotion

A cohort-flow branch can move beyond Watch only with a frozen sample that includes:

- at least 20 wallets/entities;
- 7-14 day entry accumulation window;
- later exit/distribution/reduction rows or explicit no-exit status;
- token, chain, liquidity, and market-cap context;
- label source and label confidence;
- delayed follower entry and exit model;
- conservative cost/missed-fill class;
- BTC/ETH/SOL, sector, momentum, token-hold, and no-trade baselines;
- outlier test with largest wallet/token/event removed;
- quality flags for vendor-label bias, exchange/internal/LP/treasury flows, thin liquidity, and hidden-hedge risk.

## Current Routing

| Route | State | Reason |
| --- | --- | --- |
| Nansen/Dune/Arkham-style slow cohort rows | Blocked / HITL | Best-fit source family, but requires approved export/API/account/payment/manual rows. |
| Hyperliquid public known-address checks | Active for triage/falsifiers | Useful for recent fills/state, but not a broad slow spot cohort source. |
| Hyperliquid public leaderboard seeds | Watch / biased seed source | Useful for rejection and sampling only; cannot prove copyability. |
| Exchange/orderflow aggregate flow | Separate active-public-proxy | This is market microstructure flow, not smart-money cohort flow. |
| Single-wallet event/radar rows | Watch / radar-only | Useful event context, but not copyable without frozen delay/cost/exit evidence. |

## Boundary For Next Work

The next valid cohort-flow move is not scanner construction. It is one of:

- wait for Tomas to approve a tiny Nansen/Dune/Arkham export/API sample;
- find a public no-key/exportable table that already has cohort rows;
- keep using funding/basis as the no-key comparison floor;
- use single-wallet rows only as rejection/radar/delay-falsifier material.

## Boundary Delta

Changed: wiki/router/queue/state/log/index/memory only.

Boundary delta: no account, key, paid service, API use, collector, scanner, scheduler, cron, systemd, alert, threshold, copy rule, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.
