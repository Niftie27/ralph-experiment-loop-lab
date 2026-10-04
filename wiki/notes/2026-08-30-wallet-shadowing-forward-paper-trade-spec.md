---
type: note
topic: wallet-shadowing-forward-paper-trade-spec
created: 2026-08-30T09:44:00Z
last_updated: 2026-08-30T09:44:00Z
work_item: investigation.wallet-shadowing-forward-paper-trade-spec
status: complete
scope: research-only
sources:
  - ../concepts/forward-paper-trade-gate.md
  - ../concepts/wallet-shadowing-strategy-model.md
  - ../concepts/shadowability-latency-axis.md
  - ../comparisons/copyable-wallets-vs-radar-wallets.md
  - 2026-08-30-event-triggered-wallet-shadow-falsification.md
  - 2026-08-30-wallet-shadow-high-volatility-event-brief.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-30-hyperliquid-leaderboard-address-sample.md
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - wallet-shadowing
  - walk-forward
related:
  - ../../decisions/copytrading-watch-ledger.md
  - ../../decisions/candidates.md
  - ../../core/profitability-flywheel.md
  - ../../core/testing-protocol.md
---
# Wallet-Shadowing Forward Paper Trade Spec

## Purpose

This closes `investigation.wallet-shadowing-forward-paper-trade-spec`.

The branch defines the T3 paper/shadow contract for wallet-following research. It is not a live-copy plan, account setup, alert wording change, execution rule, or scanner build.

## Entry Rule

A wallet, account, or cohort can enter this spec only after it has:

- a source record in the watch ledger;
- a defined archetype: fast perp, swing perp, event radar, slow accumulator, funding/basis, or aggregate cohort;
- no-key or approved-access evidence route;
- enough historical/fill/position records to understand holding period and basic behavior;
- a frozen selection timestamp;
- a written falsifier.

Leaderboard PnL alone is not entry evidence.

## Frozen Cohort Contract

Before the forward window starts, record:

| Field | Requirement |
| --- | --- |
| `cohort_id` | Stable name for the paper cohort |
| `selection_time` | Timestamp when the cohort is frozen |
| `selection_source` | Public route, manual source, or approved API |
| `addresses_or_accounts` | Exact identifiers, no additions during the window |
| `archetype` | One of the approved wallet-shadow archetypes |
| `allowed_assets` | Symbols or asset universe |
| `max_shadow_notional` | Research cap for paper calculations only |
| `latency_scenarios` | At minimum 15s, 60s, 180s, 5min |
| `cost_model` | Fees, slippage, partial-fill rule |
| `exit_rule` | Mirror wallet exit, timeout, or explicit non-copyable |
| `kill_rule` | Predefined stop/downgrade conditions |

## Event Ledger Row

Each observed wallet action should create one row:

| Field | Meaning |
| --- | --- |
| `observed_at` | When RALPH saw or fetched the wallet action |
| `wallet_event_time` | Exchange/wallet fill or position-change timestamp |
| `address` | Candidate account or wallet |
| `asset` | Coin/symbol |
| `side` | Long, short, close, reduce, or unknown |
| `size_notional` | Approximate wallet notional where available |
| `entry_price` | Wallet entry or observed price |
| `shadow_prices` | 15s/60s/180s/5min available paper entry prices |
| `fill_status` | filled, partial, missed, stale, or blocked |
| `exit_event_time` | Wallet exit timestamp when known |
| `wallet_pnl` | Wallet PnL after selection |
| `shadow_pnl_r` | Paper result in R after latency/costs |
| `beta_context` | BTC/ETH or market-context label |
| `quality_flags` | capped-history, hidden-hedge-risk, stale, late, outlier, no-exit |

## Metrics

Report at cohort and archetype level:

- observations after quality filters;
- events/windows represented;
- fill rate by latency scenario;
- `capture_ratio = shadow_pnl / wallet_pnl_after_selection`;
- expectancy in R by latency scenario;
- max shadow drawdown;
- median trade capture;
- PnL without largest winner;
- beta-adjusted residual PnL where possible;
- exit-shadow success rate;
- downgrade/reject reasons.

## Kill Rules

Reject or downgrade before expansion if any of these occur:

- fewer than 20 quality observations after the initial paper window;
- fewer than 3 independent event windows for event-driven cohorts;
- 60s or 180s latency scenarios turn negative after costs;
- more than half of positive PnL comes from one event or one asset;
- fills are mostly missed, stale, or partial under realistic latency;
- exits cannot be observed or copied;
- account behavior appears to be one leg of a hidden hedge;
- current account state conflicts with historical profile claims;
- edge disappears after BTC/ETH beta/context adjustment.

## Decision States

| State | Meaning | Next action |
| --- | --- | --- |
| `watch` | Interesting but insufficient | Keep collecting bounded evidence |
| `paper-candidate` | Meets entry rule and cohort is frozen | Start paper ledger only |
| `radar-only` | Timing/context useful but not copyable | Use as context, not entries |
| `rejected` | Failed pre-registered kill rule | Record reason and stop expansion |
| `blocked` | Data/access missing | Mark needs-access or ask Tomas |
| `paper-qualified` | T3 survives gate | Draft HITL review, not live trading |

## Current Decision

No existing wallet or cohort is paper-qualified.

The Hyperliquid no-key pipeline is good enough to support a small future paper ledger, but the six-address sample produced zero copy candidates. Future work should either build a tiny frozen event ledger or run a slow-accumulator source-fit pass before any scanner/prototype discussion.

## Reassess

Confidence increased that RALPH has a clear T3 contract for wallet-shadowing. Confidence did not increase that fast event copytrading fits Tomas. The slowest archetypes still deserve priority: slow accumulator, funding/basis, and aggregate cohort flow.

## Boundaries

No live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
