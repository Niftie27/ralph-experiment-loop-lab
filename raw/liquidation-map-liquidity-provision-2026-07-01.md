---
source_type: telegram_message_and_web_check
created: 2026-07-01T23:25:00Z
authors:
  - Tomas
  - assistant
---

# Liquidation-Map Liquidity Provision

Tomas supplied a creative strategy inversion:

> Stop trying to be smart money. Be the house.

The idea is to stop copying winners and instead provide passive liquidity around forced-flow events. The strongest proposed branch is Hyperliquid liquidation-map liquidity provision:

- aggregate liquidation prices / liquidation risk across wallets;
- identify clusters where forced sellers or forced buyers may trigger cascade pressure;
- place passive limit bids/offers beyond visible clusters;
- capture overshoot/reversion after forced liquidations.

This is not a latency race in the same way as copy-trading fast fills because orders can be placed passively in advance.

## Verification

Initial source check:

- Hyperliquid official docs describe the info endpoint as fetching exchange and specific user information, with pagination limits for time-range responses.
- Chainstack's Hyperliquid `clearinghouseState` reference documents `liquidationPx` in user asset positions.
- Hyperliquid official liquidation docs explain liquidation mechanics and backstop/liquidator vault behavior.
- Existing liquidation maps/products already exist for Hyperliquid, including CoinGlass, Kiyotaka, TradingDifferent, Allium, Datawallet, and third-party API/indexing products.

Important correction:

`liquidationPx` being available for a user does not mean a single official endpoint returns all user liquidation prices as a ready-made global heatmap. A custom map needs either:

- a discovered/indexed address universe and repeated `clearinghouseState` queries;
- an indexed data provider;
- an existing liquidation heatmap/product.

## Strategy Shape

This is closer to liquidity provision / mean reversion around forced flow than smart-money copying.

Potential edge:

- forced liquidations are price-insensitive;
- cascade pressure can overshoot fair price;
- passive liquidity can be placed before the event;
- the signal is visible as positioning/cluster risk, not a late copy fill.

Main risk:

> Negative skew. Many small wins can be erased by one real trend/crash where the knife never bounces.

Risk controls are the strategy, not an implementation detail:

- small position size;
- max correlated exposure;
- strict invalidation;
- regime filter distinguishing cascade/reversion from real trend;
- no leverage-heavy live experimentation;
- paper/replay first.

## Sources

- Hyperliquid info endpoint: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
- Hyperliquid liquidations: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations
- Hyperliquid clearinghouse: https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/clearinghouse
- Chainstack clearinghouseState reference: https://docs.chainstack.com/reference/hyperliquid-info-clearinghousestate
- CoinGlass Hyperliquid Liquidation Map: https://www.coinglass.com/hyperliquid-liquidation-map
- Kiyotaka Hyperliquid liquidation heatmaps: https://kiyotaka.ai/blog/liquidation-heatmaps-for-hyperliquid
- TradingDifferent liquidation heatmap: https://tradingdifferent.com/dashboard/liquidation-heatmap
- 0xArchive Hyperliquid liquidation data: https://0xarchive.io/blog/hyperliquid-liquidations-data

