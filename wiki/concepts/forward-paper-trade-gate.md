---
type: concept
name: Forward Paper Trade Gate
sources:
  - raw/wallet-shadowing-chatgpt-session-transcript.md
  - raw/wallet-shadowing-claude-session-transcript.md
related:
  - wiki/concepts/wallet-shadowing-strategy-model.md
  - core/testing-protocol.md
created: 2026-07-01T19:45:00Z
last_updated: 2026-07-01T19:45:00Z
---

# Forward Paper Trade Gate

The forward paper-trade gate is the main protection against fooling ourselves with historical wallet PnL.

## Why It Exists

Backtests over selected wallets are weak evidence because the wallet was often selected after it already won. That creates survivor bias.

The gate asks a narrower question:

> If RALPH had selected this wallet at time T, and Tomas copied with real delay and costs after time T, how much of the wallet's future PnL would Tomas capture?

## Required Structure

1. Select candidate wallets using only data before time T.
2. Freeze the cohort.
3. Do not add winners during the forward window.
4. Simulate copy entries with latency scenarios: 15s, 60s, 180s, 5min.
5. Include fees, slippage, partial fills, max position caps, and position-sizing limits.
6. Track wallet future PnL and paper shadow PnL separately.

## Core Metrics

- `capture_ratio = paper_shadow_pnl / wallet_pnl_after_selection`
- `latency_adjusted_expectancy`
- max shadow drawdown
- median trade capture
- PnL without top outlier
- hit rate after costs
- beta-adjusted residual PnL

## Anti-Bias Additions

- Use activity-defined universe, not leaderboard-only universe.
- Regress wallet PnL against BTC/ETH beta so RALPH does not copy ordinary leveraged market exposure.
- Account for multiple testing when many wallets are tested at once.
- Prefer a second holdout window before live capital.

## RALPH Rule

Until a wallet passes this gate, it is not copyable. It can be a research lead, radar wallet, or paper-trade candidate only.

