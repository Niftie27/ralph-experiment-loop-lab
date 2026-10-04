---
type: note
topic: event-triggered-wallet-shadow-falsification
created: 2026-08-30T09:43:00Z
last_updated: 2026-08-30T09:43:00Z
work_item: investigation.event-triggered-wallet-shadow-falsification
status: complete
scope: research-only
sources:
  - 2026-08-30-wallet-shadow-high-volatility-event-brief.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-30-hyperliquid-leaderboard-address-sample.md
  - ../concepts/wallet-shadowing-strategy-model.md
  - ../concepts/shadowability-latency-axis.md
  - ../concepts/forward-paper-trade-gate.md
  - ../comparisons/copyable-wallets-vs-radar-wallets.md
  - ../concepts/trump-risk-radar.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
  - strategy-family
related:
  - ../../decisions/copytrading-watch-ledger.md
  - ../../decisions/candidates.md
  - ../../core/profitability-flywheel.md
  - ../../core/testing-protocol.md
---
# Event-Triggered Wallet-Shadow Falsification

## Purpose

This closes `investigation.event-triggered-wallet-shadow-falsification`.

The branch turns high-volatility wallet-shadowing into a falsifiable research test. It does not promote any wallet, change alerts, create a scanner, or define copy rules.

## Claim To Test

Some wallets or account cohorts repeatedly position around high-volatility events early enough, slowly enough, and cleanly enough that Tomas could capture positive forward paper value after realistic detection delay, fees, slippage, and capacity limits.

## Null Hypothesis

Event-triggered wallet-shadowing is not copyable for Tomas under current constraints.

It is only radar/prior-art unless RALPH can show:

- event timing was knowable before or near the wallet move;
- candidate selection did not use future winners;
- holding period survives realistic observation and execution delay;
- shadow PnL remains positive after costs and missing fills;
- PnL is not just BTC/ETH beta or one outlier;
- exits can be shadowed, not just entries;
- hidden hedge risk is explicitly bounded.

## Pre-Registered Test Shape

| Step | Rule | Failure result |
| --- | --- | --- |
| Event set | Select 5-10 event windows before wallet outcome review | Reject if events are chosen only because a wallet won |
| Candidate universe | Use pre-event or activity-defined accounts, not leaderboard winners | Reject leaderboard-only cohort |
| Data route | Prefer no-key Hyperliquid `userFills` and `clearinghouseState` for known addresses | Block if account history cannot be independently fetched |
| Timing | Classify fills as pre-event, during, after, or late | Radar-only if fill follows obvious public price move |
| Latency | Simulate 15s, 60s, 180s, and 5min detection/execution delay | Reject if edge disappears at 60s or 180s for non-slow ideas |
| Holding period | Measure entry-to-exit or position persistence | Reject fast scalps unless delay-adjusted fill still works |
| Cost/fill | Include fees, slippage, partial fills, and no-fill cases | Reject if profitability relies on perfect fills |
| Beta/context | Compare against BTC/ETH or broad market move | Downgrade if residual edge vanishes |
| Outlier dependence | Remove the largest winning event | Reject if thesis depends on one event |
| Exit shadowing | Measure whether exits are observable and capturable | Radar-only if exits cannot be shadowed |

## Minimum Pass Bar

This branch does not set a live-trading bar. It sets a paper-test entry bar.

A cohort can become a paper-candidate only if:

- at least 20 event/account observations exist after quality filters;
- at least 3 independent event windows contribute observations;
- no single event contributes more than half of positive PnL;
- 60s and 180s latency scenarios remain non-negative after costs;
- median holding period is materially longer than detection plus execution delay;
- post-selection forward measurement is possible without keys, paid APIs, accounts, or live orders;
- the decision can be written as watch, paper-candidate, rejected, radar-only, or blocked.

## Immediate Cheap Test

Do not build a scanner first.

The cheapest next test is a small manual/no-key event ledger:

1. Choose a few recent violent BTC/ETH/SOL/HYPE move windows from existing Crypto Updates alerts or public market candles.
2. Add known Hyperliquid addresses from the watch ledger or public stats route only if their fills can be fetched no-key.
3. Compute event-relative fill timing and holding-period buckets.
4. Label each row with `copyable`, `radar-only`, `late`, `too-fast`, `hidden-hedge-risk`, `beta-risk`, or `blocked`.
5. Stop after the first decisive reject condition rather than expanding the dataset.

## Decision

`C-008` remains a candidate research direction, but its next action changes:

Old action: build strategy brief and falsification checklist.

New action: build a tiny event ledger or forward-paper spec only if the inputs are frozen before outcome review.

## Reassess

Confidence increased that RALPH has a good falsification contract. Confidence did not increase that event-triggered wallet-shadowing is profitable or copyable.

The next wallet-shadow branch should be either:

- `investigation.wallet-shadowing-forward-paper-trade-spec`, if RALPH wants to formalize the T3 ledger first;
- or a new bounded `validation.event-wallet-shadow-small-ledger` item, if Tomas wants actual no-key event/fill rows before more planning.

## Boundaries

No live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
