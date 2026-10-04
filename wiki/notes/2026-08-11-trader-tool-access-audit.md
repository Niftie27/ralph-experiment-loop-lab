---
type: research-note
date: 2026-08-11
tags:
  - ralph
  - access-audit
  - trader-tools
  - orderflow
  - ta
---

# Trader Tool Access Audit

Purpose: verify actual access before promoting trader-grade tools/data into RALPH alert workflows. This follows Tomas's global rule: do not merely list tools; prove whether the workspace can use them now, needs a proxy, or requires explicit approval.

## Verified Active Now

| Tool/Data | Access State | Probe | Use Now |
| --- | --- | --- | --- |
| Binance public REST/archives/WS | `active` | `api.binance.com/api/v3/exchangeInfo?symbol=BTCUSDT` returned `BTCUSDT UTC`. | OHLCV, trades, order book/depth proxies, dynamic universe, alert feedback. |
| Hyperliquid public info/WS | `active` | `POST https://api.hyperliquid.xyz/info` with `metaAndAssetCtxs` returned 232 perp assets. | HYPE/SOL/perp universe, mids, L2/book/trade context. |
| vectorbt via `uv` | `active-public-proxy` | `uv run --with vectorbt --with pandas --with numpy ...` returned `vectorbt 1.1.0`. | Independent backtest/portfolio sanity checks. |
| Local paper/shadow trading | `active` | `btc-eth-alert-edge/config.default.json` has `paperTrading.enabled: true`; `paper/signals.json` exists. | Forward paper statistics and alert candidate scoring. |

## Watch / Benchmark Only

| Tool/Data | Access State | Why |
| --- | --- | --- |
| ATAS | `watch/needs-approval` | Official site has orderflow/volume platform, exchange connections, market replay, API language, and paid plans/free trial. Not installed locally; active use needs platform/account/subscription/trial and possibly data-feed setup. Source: https://atas.net/ and https://atas.net/pricing/ |
| Bookmap | `watch/needs-approval`, partial public metadata | Official crypto page and API docs are useful benchmarks; package/pricing page shows crypto backfill tiers and platform packages. Historical instruments endpoint redirects publicly, but active platform/API use needs Bookmap install/package/account. Sources: https://bookmap.com/crypto, https://bookmap.com/knowledgebase/docs/API, https://bookmap.com/packages-comparison/ |
| Exocharts | `watch/needs-approval` | Official site/pricing show web/desktop orderflow platform and paid subscriptions. Not installed; active use needs subscription/account. Sources: https://exocharts.com/ and https://exocharts.com/pricing.html |
| TradingView | `watch/needs-approval` | Webhooks are official and useful for alert UX/bridge concepts, but active use needs TradingView account/alerts and webhook endpoint. No active market-data API path verified. Source: https://www.tradingview.com/support/solutions/43000529348-how-to-configure-webhook-alerts/ |

## Needs Key / Paid / Account Approval

| Tool/Data | Access State | Probe | Notes |
| --- | --- | --- | --- |
| Coinalyze API | `needs-approval` | Direct funding-rate probe returned `401 Invalid/Missing API key`. | Official docs require API key; useful for OI/funding/predicted funding/liquidations/basis. Sources: https://api.coinalyze.net/v1/doc/ and https://coinalyze.net/ |
| Hyblock API | `needs-approval` | Direct liquidation heatmap probe returned forbidden/auth failure. | Official docs use OAuth2/client credentials/API key for liquidation heatmap/levels. Sources: https://docs.hyblockcapital.com/ and https://docs.hyblockcapital.com/liquidation-heatmap |
| CoinGlass API | `needs-approval/watch` | Direct `api.coinglass.com` probe failed to connect from workspace; docs/pricing are public. | API markets itself for OI, funding, liquidations, heatmaps, long/short ratios, L2/L3 books, but active access likely needs plan/key and endpoint validation. Sources: https://docs.coinglass.com/reference/getting-started-with-your-api and https://www.coinglass.com/pricing |
| Laevitas API | `needs-approval/watch` | Swagger page reachable, but real endpoint/auth access not verified. | Useful for options/futures/volatility/funding/derivatives data; active use likely needs account/API access. Sources: https://www.laevitas.ch/ and https://apiv2.laevitas.ch/swagger |

## Current Active Path

Use public/no-key proxies first:

- CVD from trade streams.
- Aggressive buy/sell volume from trades where side inference is available.
- Book imbalance, spread, and depth changes from public order book streams.
- Liquidity shift / sweep proxies from depth and trade bursts.
- Volume profile/VWAP/session levels from public OHLCV/trades.
- Backtest with local event-study plus vectorbt sanity checks.
- Forward paper/shadow observations from live alert feedback.

Do not mark ATAS, Bookmap, Exocharts, TradingView, CoinGlass, Coinalyze, Laevitas, or Hyblock as active signal sources until access is verified and approved where needed.

## Next Internal Step

Build `active-public-proxy` features first and measure whether they improve alert classification:

- CVD slope/divergence before wick alerts.
- Aggressive volume burst vs recent baseline.
- Book imbalance and spread/depth shift.
- Post-alert MFE/MAE outcome by feature bucket.

Only ask Tomas for keys/subscriptions if a public proxy shows likely edge but lacks necessary coverage/freshness/granularity.

