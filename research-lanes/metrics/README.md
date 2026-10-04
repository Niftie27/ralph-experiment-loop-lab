---
type: research-lane
status: active
created: 2026-09-28T22:20:00Z
tags:
  - ralph
  - research-only
  - metrics
  - market-context
related:
  - ../../wiki/concepts/funding-basis-structural-baseline.md
  - ../../automation/retrieval-router.yaml
---

# Metrics Research Lane

Purpose: keep an inventory of useful non-price context metrics, their source routes, pricing/access status, and where they might fit in RALPH.

## Metric Families

| Metric family | Why it matters | Active/free route | Paid/vendor candidates | Current status |
| --- | --- | --- | --- | --- |
| Perp tape / taker delta / CVD | Measures aggressive flow around levels | Binance USD-M archives, Binance REST windows | Tardis, Kaiko, CoinAPI, Crypto Lake | Active first batch via USD-M |
| Book depth / liquidity thinning | Tests wall/void/absorption context | Binance USD-M `bookDepth` percentage bands | Tardis true L2/L3, OKX, Kaiko, CoinAPI, Crypto Lake | Active coarse proxy; true depth benchmark pending |
| Funding / basis | Detects perp crowding, carry pressure, squeeze fuel | Exchange APIs, Hyperliquid current routes, Binance/OKX derivatives context | CoinGlass, Laevitas, Velo, Tardis derivatives | Active as context, not promotion filter |
| Open interest | New position build vs closing/liquidation | Exchange APIs where available, CoinGlass if bought | CoinGlass, Coinalyze, Laevitas, Velo | Needs consolidated source map |
| Liquidations | Forced-flow context and liquidation cascade/fade tests | Exchange recent feeds where available | Tardis, CoinGlass, Coinalyze | Watch; source quality matters |
| Mark/index/premium | Perp vs spot/index divergence | Binance USD-M archive mark/index/premium klines | Tardis, CoinGlass, Kaiko | Good next USD-M feature extension |
| Spot vs perp flow split | Distinguishes spot-led dump from perp crowding | Binance spot + USD-M archives | Tardis multi-venue, Kaiko/CoinAPI | Recommended later join |
| On-chain/wallet/entity flow | Smart money, exchange inflow/outflow, slow accumulation | Hyperliquid public routes, Dune free/API, manual Arkham/Nansen views | Nansen, Arkham API, Dune paid, CryptoQuant/Glassnode | Needs approval for serious rows |
| Social/narrative/mindshare | Event/narrative filter, not execution trigger | Public feeds/manual watch | Kaito PAYG, LunarCrush-style tools | Watch; only as context/falsifier |

## Current Priority

For orderflow-backed alert research, prioritize:

1. USD-M `trades` + `bookDepth`
2. USD-M mark/index/premium klines
3. funding + OI around the same event window
4. spot tape companion for BTC/ETH/SOL where relevant
5. true-depth benchmark sample from Tardis or OKX

## Rule

No metric becomes a watcher gate until it beats simpler baselines on frozen rows with BTC gate and target PA included.
