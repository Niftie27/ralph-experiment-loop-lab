---
type: pricing-watchlist
status: active
created: 2026-09-28T22:20:00Z
observed_at: 2026-09-29
tags:
  - ralph
  - research-only
  - pricing
  - vendor-access
related:
  - README.md
  - ../orderflow/README.md
  - ../metrics/metric-tool-map.md
  - ../copytrading/README.md
---

# Pricing Watchlist

Observed from official or vendor-controlled pages on 2026-09-29. Recheck before any purchase.

| Tool | Observed price/access | RALPH fit | Buy status |
| --- | --- | --- | --- |
| Binance public archives | Free/no-key public archive | First orderflow batch rail; trades + USD-M `bookDepth` | `active-free` |
| Tardis.dev | Minimum order shown as `$300`; all-exchanges monthly example shown as `$2,200/month`; first-day-of-month samples no-key | True historical trade/depth replay benchmark | `expensive-benchmark`; buy only after no-key schema proof and frozen manifest |
| ATAS | Start free; Plus `EUR 19.95/month`; Pro `EUR 39.95/month`; Ultra `EUR 49.95/month`; 14-day trial | Human orderflow microscope, replay, footprint, Cluster Search, manual labels | `trial-candidate`; likely Pro/Ultra only if Tomas wants visual workflow |
| CoinGlass API | Hobbyist `$29/month`, Startup `$79/month`, Standard `$299/month`, Professional `$699/month`, Enterprise quote | Consolidated OI/funding/liquidation/derivatives context | `cheap-candidate` for metrics if public exchange APIs are insufficient |
| Coinalyze API | API docs say free API, sign-up/API key required, 40 calls/minute, intraday retention roughly 1500-2000 datapoints | Consolidated OI/funding/liquidations/long-short/buy-sell metric rows | `free-key-candidate`; needs account/API-key approval before active use |
| Velo Data API | Docs/search capture: `$199/month` API keys; monthly gives 3-month history, annual gives full data history | Clean cross-venue derivatives/spot/options data API and chart exports | `paid-candidate`; compare against CoinGlass before buying |
| Laevitas API | x402 beta says no API key and pay only for use; page examples show `$0.001/request` and 100-call credit bundles; search capture shows heavy API subscription at `$500/month` | Targeted derivatives/options/perp analytics and MCP/PAYG experiments | `payg-watch`; interesting if tiny paid rows beat monthly subscription |
| Hyblock API | API page shows `$4,788/year` Professional launch pricing; docs require `x-api-key` for active Professional/trial users | Liquidation clusters, orderbook imbalance, whale/retail positioning, CVD/funding | `expensive-benchmark`; trial only after a frozen manifest |
| Nansen Pro | `$69/month` monthly or `$49/month` annual equivalent per official help article | Smart money, labels, alerts, slow-accumulator/cohort research | `cheap-candidate` for wallet/cohort branch, not orderflow |
| Arkham API | API page offers free trial/access flow; docs mention credit pricing, but public exact credit costs not captured here | Entity labels, fund flows, HyperCore/Polymarket intelligence | `needs-approval`; enrich/export only |
| Dune | Free plan has API/credits; blog says paid monthly plan changing to `$75/month`, annual `$65/month` after Oct 21 | Custom on-chain/wallet/cohort queries | `cheap-candidate`; use public/free first |
| Copin | Copy trading fee docs: Hyperliquid Copin fee `0.025%` trade size plus Hyperliquid taker fee `0.035%`; CEX copy has no Copin fee, exchange fees apply | Perp copytrading prior art/tool; possible API but access requires application | `watch`; research only, no live copy |
| GMGN | Copy trading docs show configurable copy rules; fee docs say one copy trade includes buy/sell amount, gas priority fee, and `1%` GMGN handling fee. GMGN says no open data API currently; whitelist is for trading/user-volume partners | Solana smart-money/copy UX reference, not data rail | `avoid-for-now` for RALPH data; risky execution surface |
| CoinAPI | Pricing page exists; exact plan prices need direct capture before decision | Broad market data API and flat files | `vendor`; recheck if needed |
| Kaiko | Market-data vendor, likely enterprise/contact-sales for serious L1/L2 | Institutional benchmark | `contact-sales`; too heavy until public rails fail |
| Crypto Lake | Market-data vendor; exact pricing not captured here | Alternative historical data lake | `vendor`; recheck later |
| TensorCharts | Current official pricing not captured; public/manual pages expose orderbook/trades heatmap and orderflow tools | Manual heatmap/orderflow visual prior art | `manual-watch`; not an API/data rail until current pricing/export path is verified |

## Cheap/Good Candidates

1. CoinGlass API if RALPH needs consolidated OI/funding/liquidation metrics faster than exchange-by-exchange scraping.
2. Coinalyze if a free-key, rate-limited consolidated derivatives API is enough for the first metric rows.
3. Dune if wallet/cohort/on-chain rows need SQL and export.
4. Nansen Pro if slow accumulator/smart-money labels become the active branch.
5. ATAS Pro/Ultra trial if Tomas wants manual replay/label workflow.
6. Laevitas x402 for tiny paid derivatives/options rows where pay-per-request is cheaper than a subscription.

## Not Yet Worth Buying

- Tardis full paid coverage until USD-M/OKX/no-key samples prove that true depth replay is the bottleneck.
- Kaiko/Crypto Lake/CoinAPI until we have a precise data gap with a frozen manifest.
- Hyblock annual API until a frozen liquidation/positioning-manifest proves public/CoinGlass/Velo/Laevitas proxies are insufficient.
- Copytrading execution products until a paper-only copyability study survives latency, slippage, exit, and hidden-hedge tests.

## Sources

- Tardis pricing/order page: https://tardis.dev/
- ATAS pricing: https://atas.net/pricing/
- CoinGlass pricing: https://www.coinglass.com/pricing
- Coinalyze API docs: https://api.coinalyze.net/v1/doc/
- Velo docs/API: https://docs.velo.xyz/ and https://docs.velo.xyz/api
- Laevitas API/x402 docs: https://api.laevitas.ch/ and https://apiv2.laevitas.ch/x402/
- Hyblock API page/docs: https://hyblockcapital.com/api and https://docs.hyblockcapital.com/
- TensorCharts pages: https://www.tensorcharts.com/ and https://docs.tensorcharts.com/
- Nansen Pro help article: https://academy.nansen.ai/en/help/articles/9412804-about-nansen-pro
- Arkham API: https://arkm.com/api and https://arkm.com/docs
- Dune pricing/credits blog: https://dune.com/blog/credits-changing
- Copin fee docs: https://docs.copin.io/features/fees-structure
- GMGN copy docs: https://docs.gmgn.ai/index/copy-trade-copy-smart-money-automatically-earn-sol
- GMGN API Q&A: https://docs.gmgn.ai/index/q-a
