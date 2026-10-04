---
type: concept
name: Wallet Shadowing Strategy Model
sources:
  - raw/wallet-shadowing-chatgpt-session-transcript.md
  - raw/wallet-shadowing-claude-session-transcript.md
related:
  - wiki/concepts/forward-paper-trade-gate.md
  - wiki/concepts/trump-risk-radar.md
  - wiki/comparisons/copyable-wallets-vs-radar-wallets.md
created: 2026-07-01T19:45:00Z
last_updated: 2026-07-01T19:45:00Z
---

# Wallet Shadowing Strategy Model

Wallet shadowing sounds simple: observe a profitable wallet and copy it. The transcripts show that this is strategically dangerous unless RALPH separates discovery, validation, and execution.

## Core Model

Wallet shadowing should have two separate phases:

1. Discovery/screening finds wallets that deserve a test.
2. Forward validation measures whether their edge survives Tomas's delay and costs.

Historical profit is not sufficient. It can be survivor bias, beta, luck, or one-off information advantage.

## Copyability Requirements

A wallet is not copyable unless it passes all of these:

- enough closed trades to evaluate behavior;
- PnL not dominated by one or two outliers;
- edge remains after fees, slippage, and realistic latency;
- holding period is longer than detection plus execution delay;
- drawdown is survivable;
- PnL is not mostly market beta;
- style is repeatable across regimes;
- wallet is not only one leg of a hidden hedge or clustered book.

## Recommended Universe

Start with Hyperliquid, not because it is guaranteed to work, but because it offers the cleanest first research surface:

- public data endpoints;
- clear perp positions/fills;
- strong ecosystem tools;
- direct relevance to event/perp wallet behavior;
- no immediate wallet keys or live execution needed.

The candidate universe should be activity-defined, not leaderboard-defined. A leaderboard is already survivor-selected.

## RALPH Rule

No wallet becomes a copy candidate because it is famous. It becomes a candidate only after it passes a reproducible screen and then survives forward paper-trade.

