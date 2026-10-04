---
type: note
topic: hype-l2-access-routes
created: 2026-08-31T18:47:17Z
last_updated: 2026-08-31T18:47:17Z
work_item: ad-hoc.hype-l2-access-routes
status: complete
scope: access-research-only
sources:
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
  - https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/ws-api/market-data
  - https://bybit-exchange.github.io/docs/v5/market/orderbook
  - https://bybit-exchange.github.io/docs/v5/websocket/public/orderbook
  - https://hyperliquid.gitbook.io/hyperliquid-docs/historical-data
  - https://goldrush.dev/docs/goldrush-hyperliquid/websocket-api/overview
tags:
  - ralph
  - research-note
  - access-review
  - misc-research
related:
  - 2026-08-10-public-orderflow-data-rail.md
  - 2026-08-13-orderflow-alert-alignment-check.md
  - 2026-08-31-wallet-shadowing-archetype-shadowability-map.md
  - ../../core/data-rails.md
  - ../../../crypto-updates/orderflow-index.yaml
---
# HYPE L2 Access Routes

## Purpose

Tomas asked whether RALPH should try to find ways to access L2 data after HYPE alert feedback said absorption/orderflow context is missing.

This is an access map only. It does not create a collector, scanner, alert, threshold, scheduler, account, key, paid feed, paper/demo account, execution path, TP/SL, sizing rule, or strategy promotion.

## Live No-Key Probes

Checked from this workspace on 2026-08-31:

| Venue | Probe | Result | Use |
| --- | --- | --- | --- |
| Hyperliquid | `POST https://api.hyperliquid.xyz/info` with `{"type":"l2Book","coin":"HYPE"}` | OK; returned bid/ask levels with price, size, and order-count field `n` | Best HYPE-native no-key L2 snapshot rail |
| Binance USD-M futures | `GET https://fapi.binance.com/fapi/v1/depth?symbol=HYPEUSDT&limit=20` | OK; returned HYPEUSDT bids/asks and update timestamps | Liquid CEX comparison rail |
| Bybit linear | `GET https://api.bybit.com/v5/market/orderbook?category=linear&symbol=HYPEUSDT&limit=25` | OK; returned HYPEUSDT bids/asks, sequence, and matching-engine timestamp | Second CEX comparison rail |

Verdict: basic HYPE L2 access is not blocked. The missing layer is disciplined capture and replay around alert timestamps.

## Route Classes

| Route | Access | Strength | Weakness | Current status |
| --- | --- | --- | --- | --- |
| Hyperliquid public L2 | No key for current snapshots/WebSocket | Native HYPE venue, includes visible price-level depth and order count per level | Aggregated L2 cannot prove hidden intent or queue identity | Active-public-proxy |
| Binance futures L2 | No key for public snapshots/streams | Deep liquid CEX comparison; docs support snapshot plus depth stream local book maintenance | RPI orders excluded; venue may lead or lag Hyperliquid | Active-public-proxy |
| Bybit linear L2 | No key for public snapshots/streams | Up to 1000-level public snapshot; WebSocket depth levels documented | RPI orders excluded; not always the lead venue | Active-public-proxy |
| Hyperliquid historical S3 | Public docs say L2 book snapshots are in `market_data` | Possible replay source for older HYPE book context | Need file/path availability check and storage-size discipline before relying on it | Watch-public-archive |
| Paid/keyed normalized providers | Tardis.dev, CoinAPI, GoldRush, 0xArchive, Amberdata-style products | Easier historical/replay/L4/order-level access; GoldRush advertises Hyperliquid L4/wildcard L2 with key | Key/account/paid terms likely; needs explicit approval before use | Needs-approval |

## Absorption Fit

L2 can support a weak-to-medium absorption proxy:

- aggressive trades hit a side but price fails to progress
- top-of-book or near-book depth replenishes after being hit
- spread stays contained while taker flow is one-sided
- visible depth thickens at the defended level

But L2 cannot fully prove absorption. Stronger evidence needs synchronized trades plus book deltas, and Hyperliquid order-level/L4 or keyed normalized feeds may be needed for queue/order lifecycle evidence.

## Cheapest Next Falsifier

If Tomas approves a future bounded experiment, the cheapest no-key version is:

1. Capture HYPE for 30-60 minutes from Hyperliquid, Binance futures, and Bybit linear.
2. Store raw ticks/deltas outside the wiki, with local receive timestamps.
3. Derive compact rows for 1s/5s/30s windows around HYPE alert timestamps: spread, top-N depth, depth-within-bps, imbalance, depth replenishment, trade CVD, and price progress.
4. Label rows as `absorption_observed`, `absorption_unobserved`, or `book_stale`.
5. Compare whether those labels explain Filip/Tomas review outcomes better than price-only alert context.

No strategy should be promoted unless this beats the existing price-only baseline across enough reviewed HYPE alerts.

## Decision

Mark HYPE L2 as `active-public-proxy` for access, but keep absorption as `unvalidated-feature`.

The immediate RALPH correction is smaller than expected: do not say L2 is hard to access in general. Say current alert review lacks captured L2/footprint context at alert time. Live public L2 exists; historical/replay-grade and L4/order-level data remain gated by capture discipline, public archive checks, or HITL-approved providers.

## Boundary Delta

Changed: wiki/router/data-rail/log/memory only.

No collector, scanner, cohort, alert, threshold, scheduler, account, key, paid service, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, watcher behavior, or strategy promotion changed.
