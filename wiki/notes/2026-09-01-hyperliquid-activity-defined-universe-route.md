---
type: note
topic: hyperliquid-activity-defined-universe-route
created: 2026-09-01T05:51:43Z
last_updated: 2026-09-01T05:51:43Z
work_item: unknowns.U-019
status: done
scope: research-only
sources:
  - 2026-08-30-hyperliquid-data-feasibility-spike.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-30-hyperliquid-leaderboard-address-sample.md
  - 2026-09-01-wallet-shadowing-existing-tool-coverage-map.md
  - 2026-09-01-cohort-flow-vs-single-wallet-signal-map.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
related:
  - ../../decisions/unknowns.md
  - ../../decisions/copytrading-watch-ledger.md
  - ../../automation/work-queues.yaml
---
# Hyperliquid Activity-Defined Universe Route

## Purpose

Resolve `U-019` for current routing: define what an activity-defined Hyperliquid candidate universe would require, and classify what current no-key routes can and cannot provide without leaderboard bias.

This is a route contract only. It does not run address discovery, create a scanner, collect event rows, create accounts/keys, use paid services, change schedulers or alerts, define copy rules, set sizing, TP/SL, execution behavior, or promote a strategy.

## Decision

RALPH cannot currently claim an activity-defined Hyperliquid candidate universe.

The workspace has active no-key routes for:

- market universe/context;
- public leaderboard seed rows;
- known-address state and fill verification;
- tiny known-address delay/rejection falsifiers.

It does not yet have a non-leaderboard public route that discovers accounts by current activity across the full venue. Therefore `activity-defined` remains a route contract and Watch item, not an active universe.

## Required Universe Contract

A future activity-defined sample must be selected by behavior available before outcome scoring, such as:

- recent trading activity above a minimum notional/volume threshold;
- multi-day or multi-week persistence rather than one winning print;
- current account state/fill availability through official no-key routes;
- diversity across assets and regimes;
- exclusion or flagging of stale, withdrawn, tiny-account, capped-fill, one-asset, hidden-hedge, and leaderboard-only profiles;
- clear freeze time and raw-row storage path;
- no dependence on all-time PnL rank.

Minimum output should be a frozen sample table, not a scanner:

| Field group | Required fields |
| --- | --- |
| Freeze | `run_id`, `selection_time`, source route, access class, raw-row path |
| Activity | recent fill count, recent notional/volume proxy, active days/window, current open-position flag |
| Quality | capped-fill flag, stale/withdrawn flag, concentration flag, account-value class |
| Bias | whether source was leaderboard-derived, all-time PnL rank, current-vs-historical mismatch |
| Verification | `clearinghouseState` result, `userFills` or time-bounded fill result, missing-data reason |
| Decision | reject, watch, radar-only, blocked, or follow-up-falsifier |

## Current Source Classification

| Route | State | Why |
| --- | --- | --- |
| Hyperliquid public stats leaderboard | Active seed route, biased | Returns many structured address rows, but selection is leaderboard/PnL-shaped. |
| Hyperliquid official info endpoints | Active verification route | Can check known addresses, current state, fills, funding, candles, and market context. |
| Activity-defined venue-wide account discovery | Not verified / Watch | No current no-key route has been verified to enumerate accounts by recent activity without leaderboard selection. |
| HyperDash/HypurrScan/HyperTracker/manual pages | Watch/manual/needs-access | Useful for cross-check and UX prior art, not a programmatic active universe. |
| Nansen/Apify/product APIs | Needs approval | May help if approved, but not active no-key workspace access. |

## Next Valid Move

Do not build a scanner now.

The next valid U-019-adjacent branch is only one of:

- find an existing public/no-key export that enumerates Hyperliquid accounts by recent activity;
- ask for HITL approval for a tiny keyed/product/export sample;
- use leaderboard seeds only as biased rejection samples;
- keep activity-defined universe work Watch until a source route changes.

## Boundary Delta

Changed: wiki/router/queue/state/log/index/memory only.

Boundary delta: no account, key, paid service, API use, collector, scanner, scheduler, cron, systemd, alert, threshold, copy rule, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.
