---
type: note
topic: public-free-source-feed-list
created: 2026-08-30T15:53:00Z
last_updated: 2026-08-30T15:53:00Z
work_item: discovery.public-free-source-feed-list
status: complete
scope: research-only
sources:
  - https://api-docs.defillama.com/
  - https://docs.dexscreener.com/api/reference
  - https://api.geckoterminal.com/docs/index.html
  - https://support.coingecko.com/hc/en-us/articles/4538771776153-What-is-the-rate-limit-for-CoinGecko-API-public-plan
  - https://developers.binance.com/en/docs/catalog/core-trading-spot-trading/api/ws-streams/~
  - https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/ws-streams/public
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
  - https://bybit-exchange.github.io/docs/v5/websocket/public/orderbook
  - https://bybit-exchange.github.io/docs/v5/websocket/public/trade
  - https://alternative.me/crypto/api/
tags:
  - ralph
  - research-note
  - source-scan
  - no-key
related:
  - ../../core/data-rails.md
  - 2026-08-30-existing-tool-fit-map.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-10-public-orderflow-data-rail.md
  - ../../../crypto-updates/orderflow-index.yaml
  - ../../../crypto-updates/monitor-index.yaml
---
# Public Free Source Feed List

## Purpose

This closes `discovery.public-free-source-feed-list` as a bounded Market/Battlefield source map.

The goal is not to start another collector. The goal is to separate feeds that this workspace can actually access without keys or paid accounts from feeds that need manual/watch handling before RALPH treats them as active inputs.

## Verified From This Workspace

Checked on 2026-08-30:

| Feed | Probe | HTTP |
| --- | --- | ---: |
| DefiLlama public API | `https://api.llama.fi/v2/chains` | 200 |
| DEXScreener API | `https://api.dexscreener.com/latest/dex/search?q=SOL` | 200 |
| GeckoTerminal public API | `https://api.geckoterminal.com/api/v2/networks` | 200 |
| Alternative.me Fear & Greed | `https://api.alternative.me/fng/?limit=1` | 200 |
| Hyperliquid info endpoint | `POST https://api.hyperliquid.xyz/info` with `{"type":"meta"}` | 200 |
| Hyperliquid public leaderboard | `https://stats-data.hyperliquid.xyz/Mainnet/leaderboard` | 200 |
| Binance spot REST | `https://api.binance.com/api/v3/exchangeInfo?symbol=BTCUSDT` | 200 |
| Bybit v5 public REST | `https://api.bybit.com/v5/market/instruments-info?category=linear&symbol=BTCUSDT` | 200 |

These probes verify current reachable access only. They do not prove strategy edge, export completeness, historical depth, legal fit, or stable production reliability.

## Feed Classes

| Class | Feeds | Current RALPH use | Status |
| --- | --- | --- | --- |
| Exchange market data | Binance public REST/WebSocket, Bybit public REST/WebSocket, Hyperliquid public info/WebSocket | candles, trades, book ticker/orderbook, funding/context where available, orderflow capture and alert replay alignment | active-public-proxy |
| DeFi and protocol context | DefiLlama public API | TVL, fees, yields, stablecoin, chain/protocol battlefield context | active-public-context |
| DEX pair and token liquidity | DEXScreener API, GeckoTerminal public API | token/pair discovery, DEX liquidity/volume sanity checks, mid-cap context | watch/active-proxy |
| Sentiment/macro backdrop | Alternative.me Fear & Greed | coarse market regime context only | watch/context |
| Wallet/address seed and verification | Hyperliquid public stats leaderboard plus official info endpoint | address seed discovery and independent fill/state checks for known addresses | active-discovery-only |
| Paid/keyed or unverified cohort tools | Nansen, Arkham, Dune API/export, CoinMarketCap Pro, higher-tier CoinGecko/GeckoTerminal, paid copytrading exports | possible future cohort and label work only after access approval | needs-access |

## Routing Decisions

- Use Binance, Bybit, and Hyperliquid for market/orderflow research when the output is local capture, compact features, or alert replay alignment.
- Use DefiLlama for broad battlefield context, not for trade timing.
- Use DEXScreener and GeckoTerminal to check whether a mid-cap idea has enough liquidity and market structure to deserve deeper work.
- Use Alternative.me only as a low-resolution sentiment label; it cannot be a strategy signal by itself.
- Use Hyperliquid public stats only for seed discovery. It remains leaderboard-biased and must be paired with `clearinghouseState` and `userFills` checks before any address enters a frozen paper ledger.
- Keep Nansen/Arkham/Dune-style cohort work as `needs-access` unless a future pass verifies free exportable rows or Tomas explicitly approves account/key/paid evaluation.

## Cheapest Falsifiers

| Branch | Cheapest falsifier |
| --- | --- |
| Market/Battlefield loop | A daily source pull should add context that later explains or filters alert/review outcomes; if it only creates newsletter-like summaries, reject it for RALPH. |
| Mid-cap accumulation scan | A candidate token must have public DEX/CEX liquidity and enough historical market data before any wallet/cohort work. |
| Wallet/copytrading route | A public address seed must survive no-key fill/state inspection and selection-bias checks before any forward-paper spec. |
| Orderflow route | Captures must overlap finalized alert windows by exact symbol/time before being treated as signal evidence. |
| DeFi context route | Protocol/chain context must map to a concrete hypothesis, risk filter, or battlefield regime; otherwise keep it as background only. |

## Next Micro-Action

The next useful branch is not another broad source list. It should choose one pending patient-retail item and use this map to decide whether the branch has enough public/no-key data to run a cheap falsifier.

Good candidates:

- `discovery.mid-cap-accumulation-flow-scan`
- `discovery.hyperliquid-data-feasibility-spike`
- `discovery.grid-range-existing-tool-trial-design`

## Boundary

This page is routing memory only. It authorizes no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion.
