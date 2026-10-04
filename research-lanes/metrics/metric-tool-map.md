---
type: source-map
status: draft
created: 2026-09-28T22:20:00Z
tags:
  - ralph
  - research-only
  - metrics
  - access-verification
related:
  - README.md
  - ../vendor-access-pricing/pricing-watchlist.md
---

# Metric Tool Map

This map routes metric families to tools and access status. Prices are summarized in `../vendor-access-pricing/pricing-watchlist.md`.

## Active No-Key First

| Tool/source | Metrics | Use first for |
| --- | --- | --- |
| Binance USD-M archives | trades, aggTrades, bookDepth, bookTicker, mark/index/premium klines, metrics | Perp tape + coarse liquidity + mark/index context |
| Binance spot archives | trades, aggTrades, klines | Spot tape companion |
| Hyperliquid public API | current recent trades, L2 book, known-account current/history routes where available | HYPE/perp current checks and tiny known-wallet falsifiers |
| Exchange REST APIs | recent trades, klines, funding, OI where exposed | Small current/recent sanity checks |

## Vendor/Approval Watch

| Tool/source | Metrics | RALPH use | Status |
| --- | --- | --- | --- |
| Tardis | true historical trades, depth, funding, OI, liquidations, replay | Benchmark for true orderflow replay | vendor; no-key samples active |
| OKX historical data | tick trades, candles, order book data | Next public alternative to verify | watch |
| CoinGlass | OI, funding, liquidations, long/short, options/futures/spot API | Consolidated derivatives dashboard/API | vendor; potentially cheap starter |
| Coinalyze API | OI, funding, liquidations, long/short ratio, buy/sell volume, OHLCV | Cheap/free consolidated derivatives rows and API sanity checks | free API with key; intraday history limited |
| Velo Data | OI, funding, liquidations, futures/options/spot rows, orderbook endpoints, news | Clean API/web chart source for derivatives context and broad market scans | vendor; $199/mo API |
| Laevitas | derivatives/options/perp analytics, REST/WebSocket, MCP, x402 pay-per-request | PAYG candidate for targeted derivatives/options rows without monthly commitment | x402 beta/PAYG; subscription for heavy use |
| Hyblock | liquidation clusters, orderbook imbalance, OI/profile, whale/retail positioning, CVD | Liquidation-map and positioning benchmark source | expensive API; trial/pro subscription required |
| CoinAPI | historical trades, quotes, L2 snapshots, L3, flat files | General historical market data API | vendor/API-key |
| Kaiko | institutional L1/L2 market data | Enterprise-grade market data | vendor/likely expensive |
| Crypto Lake | book-derived and market data products | Potential market data lake | vendor |
| Nansen | smart money, labels, wallet/entity alerts | Slow accumulator and cohort research | vendor; Pro may be affordable |
| Arkham API | entity labels, fund flows, HyperCore, Polymarket | Entity enrichment and HyperCore intelligence | needs account/API approval |
| Dune | SQL over on-chain datasets, API exports | Custom wallet/cohort queries | free/paid credits; needs account for API |
| Kaito | sentiment/mindshare/smart followers | Narrative context only | PAYG/watch |
| TensorCharts | orderbook/trades heatmap, CVD/VWAP/orderflow studies | Manual orderflow visual reference, like ATAS-lite/web prior art | manual/watch; current pricing not captured |

## Selection Rule

Choose tools by the cheapest falsifier:

1. Free public archive/API.
2. No-key sample.
3. Manual export.
4. Cheap monthly/PAYG plan with explicit spend cap.
5. Larger vendor purchase only after a frozen manifest and kill criteria exist.
