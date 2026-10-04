---
type: tool-access-map
status: active
created: 2026-09-28T22:20:00Z
tags:
  - ralph
  - research-only
  - copytrading
  - wallet-shadowing
  - tools
related:
  - README.md
  - ../vendor-access-pricing/pricing-watchlist.md
---

# Copytrading Tool Access Map

## Tool Classes

| Tool class | Examples | What it can do for RALPH | Status |
| --- | --- | --- | --- |
| Perp copy platforms | Copin, exchange copy modules | Show product settings, fees, risk controls, leaderboard behavior | Prior art/watch; no live copy |
| Meme/Solana copy tools | GMGN and similar | Fast wallet-copy UX, liquidity and market-cap filters, failure modes | Prior art/watch; execution risk high |
| Wallet/entity intelligence | Arkham, Nansen | Labels, entity clustering, fund flows, smart money lists | Needs approval/export |
| Query platforms | Dune | Custom cohort queries and exports | Free/cheap candidate |
| Venue-native public APIs | Hyperliquid public info endpoints | Known-wallet/fill checks and tiny delay falsifiers | Active for small tests |
| Manual explorers | HypurrScan, HyperDash, Arkham UI if account exists | Human review and address triage | Manual/HITL |

## Copin Notes

Official docs indicate:

- Hyperliquid copy fee: Copin `0.025%` of trade size.
- Hyperliquid trading fee example: `0.035%` taker fee.
- CEX copy via Bybit/OKX/BingX/Bitget/Gate has no Copin fee listed; normal exchange fees apply.
- API docs expose copy-trade configuration fields such as volume, leverage, copied account, exchange, stop loss, take profit, reverse copy, max volume multiplier, and filters.

RALPH use: settings/failure-mode reference and possible paper-only source, not live execution.

## GMGN Notes

Official docs indicate:

- Copy trading supports fixed buy or capped follow-buy, follow-up selling/no-follow selling/TP-SL, priority fee, anti-MEV, slippage, market-cap limits, liquidity limits, token-age limits, min/max copy amount, and auto-pause after 3 failed copy trades.
- Fee docs say one copy trade includes buy/sell amount, gas priority fee, and `1%` GMGN handling fee.
- GMGN Q&A says there is no open data API currently; data crawling/IP whitelist is for trading users with transaction volume/user volume.

RALPH use: UX and risk-control reference only. Avoid as data rail for now.

## Better RALPH Path

1. Use Hyperliquid public known-wallet rows for tiny mechanics tests.
2. If Tomas approves, buy/export Nansen/Dune/Arkham rows for slow accumulator/cohort discovery.
3. Build paper-only delayed follower tests.
4. Compare against beta/no-trade/baseline.
5. Treat copy platforms as execution prior art, not default infrastructure.

## Sources

- Copin fees: https://docs.copin.io/features/fees-structure
- Copin API: https://api-docs.copin.io/api-reference/copy-trades/create-copy-trade
- Copin developer docs: https://docs.copin.io/features/developer
- GMGN copy trading docs: https://docs.gmgn.ai/index/copy-trade-copy-smart-money-automatically-earn-sol
- GMGN Q&A: https://docs.gmgn.ai/index/q-a
