---
type: source-scan
status: research-only
created: 2026-09-29T06:45:00Z
tags:
  - ralph
  - metrics
  - vendor-access
  - pricing
  - research-only
related:
  - ../../research-lanes/metrics/metric-tool-map.md
  - ../../research-lanes/vendor-access-pricing/pricing-watchlist.md
  - ../../research-lanes/orderflow/README.md
---

# Derivatives Metrics Vendor Access Scan

Purpose: extend the new metrics/vendor lane beyond the first Tardis/ATAS/CoinGlass/Nansen/Arkham/Dune map, with access/pricing facts that can guide buy/build decisions for RALPH.

## Added Candidates

| Source | Access/pricing observed | Metrics | RALPH fit | Status |
| --- | --- | --- | --- | --- |
| Coinalyze API | Free API, but requires sign-up/API key; docs state 40 calls/minute and limited intraday retention of roughly 1500-2000 datapoints | OI, funding, liquidations, long/short ratio, OHLCV, buy/sell volume | Best cheap/free first candidate for consolidated derivatives metric rows if Binance/Hyperliquid public APIs are too fragmented | `free-key-candidate` |
| Velo Data | API docs/search capture state API keys at `$199/mo`; monthly subscription has 3-month history and annual has full data history; web/app docs expose OI/funding/liquidation/orderbook heatmap context | OI, funding, liquidations, orderbook/market data, broad futures/options/spot rows, news | Strong API candidate if we want one clean cross-venue derivatives data surface; not first while public rails still answer the question | `paid-candidate` |
| Laevitas | API docs expose REST, WebSocket, MCP, and x402 pay-per-request; x402 page says no API key is needed, USDC on Base/Solana, and pay-only-for-use; search result also showed heavy API subscription at `$500/month` | Derivatives/options/perp analytics, OHLCV, orderbook, Greeks/vol surfaces, Hyperliquid analytics | Interesting targeted PAYG source for options/derivatives rows without committing to a monthly subscription | `payg-watch` |
| Hyblock | API page shows `$4,788/year` Professional launch pricing, 100+ endpoints and 1000+ tickers; docs require `x-api-key` issued to Professional API users or trial | Liquidation clusters, orderbook spread/imbalance, whale/retail positioning, funding, slippage, CVD | High-fit benchmark for liquidation/positioning maps, but too expensive as a first dependency | `expensive-benchmark` |
| TensorCharts | Current public page/manual show orderbook/trades heatmap and orderflow studies; current pricing was not captured from official current page | Manual heatmaps, CVD/VWAP/orderbook/trades visual studies | Manual visual prior art only; not an API/data rail | `manual-watch` |

## Routing Decision

Keep the active RALPH order:

1. Public/no-key Binance USD-M and exchange APIs first.
2. Coinalyze if a free-key derivatives metric source is acceptable and a tiny API-key approval is worth it.
3. Velo or CoinGlass when the need is a cleaner cross-venue derivatives API with a monthly bill.
4. Laevitas x402 when a small targeted paid query is cheaper than a subscription.
5. Hyblock only as a benchmark/trial for liquidation and positioning maps after a frozen manifest proves public/proxy metrics are the bottleneck.

No source here changes alert logic, schedulers, thresholds, execution, sizing, TP/SL, or strategy status.

## Sources

- Coinalyze API docs: https://api.coinalyze.net/v1/doc/
- Velo docs/API: https://docs.velo.xyz/ and https://docs.velo.xyz/api
- Laevitas API/x402 docs: https://api.laevitas.ch/ and https://apiv2.laevitas.ch/x402/
- Hyblock API page/docs: https://hyblockcapital.com/api and https://docs.hyblockcapital.com/
- TensorCharts public/manual pages: https://www.tensorcharts.com/ and https://docs.tensorcharts.com/
