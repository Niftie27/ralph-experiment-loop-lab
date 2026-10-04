---
type: note
topic: wallet-shadow-delay-evidence
created: 2026-08-31T13:20:00Z
last_updated: 2026-08-31T13:20:00Z
work_item: discovery.wallet-shadow-delay-evidence
status: complete
scope: research-only
sources:
  - 2026-08-30-hyperliquid-data-feasibility-spike.md
  - 2026-08-30-event-triggered-wallet-shadow-falsification.md
  - 2026-08-30-wallet-shadowing-forward-paper-trade-spec.md
  - ../concepts/shadowability-latency-axis.md
  - ../../experiments/copytrading-address-intake/results/hyperliquid-leaderboard-address-intake-2026-08-30.md
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits
tags:
  - ralph
  - research-note
  - wallet-shadowing
related:
  - ../concepts/shadowability-latency-axis.md
  - ../concepts/wallet-shadowing-strategy-model.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
  - ../../decisions/copytrading-watch-ledger.md
---
# Wallet-Shadow Delay Evidence

## Purpose

This closes `discovery.wallet-shadow-delay-evidence` as a bounded measurement-path probe.

Question: can public/no-key Hyperliquid data support a realistic wallet-shadow delay test before RALPH builds any scanner, cohort, alert, threshold, or execution surface?

No scanner, cohort, live copying, live trading, account, key, paid service, scheduler, alert, threshold, risk sizing, TP/SL, execution behavior, public posting, or strategy promotion was created.

## Public Data Check

Official Hyperliquid docs still support the basic no-key measurement path:

| Surface | Relevant doc reality | Delay-test value |
| --- | --- | --- |
| `userFills` | Returns at most 2000 most recent fills for a user. | Enough for recent event rows, not enough for full history proof. |
| `userFillsByTime` | Returns at most 2000 fills per response and only the 10000 most recent fills are available. | Good for narrow frozen windows if queried close to the event; weak for stale backfills. |
| Time-range pagination | Time-range responses only return limited elements or distinct data blocks; larger ranges require pagination from the last returned timestamp. | Future ledgers must store raw rows at capture time instead of relying on summaries. |
| `candleSnapshot` | Public info endpoint can return candle rows for a coin and interval. | Enough to join wallet fill time to delayed public prices at minute granularity. |
| `clearinghouseState` | Requires the actual master or sub-account address, not an agent wallet address. | Useful for current exposure and stale-account rejection, not full behavior reconstruction. |
| Rate limits | Info requests have request weights, and data-returning endpoints add weight per returned item. | A small manual ledger is feasible; broad scanning is not justified under current constraints. |

## Workspace Probe

Used the known Hyperliquid public leaderboard sample address `0x7fdafde5cfb5465924316eced2d3715494c517d1` as a measurement specimen, not as a copy candidate.

Probe results on 2026-08-31:

| Probe | Result |
| --- | --- |
| `userFills` latest response | HTTP 200, 2000 fills returned, response capped, earliest `2026-08-31T11:34:09.019Z`, latest `2026-08-31T13:18:45.037Z` |
| `userFillsByTime`, last 15 minutes | HTTP 200, 289 fills returned, uncapped |
| `userFillsByTime`, last 20 minutes | HTTP 200, 396 fills returned, uncapped |
| `candleSnapshot` join around a selected fill | HTTP 200, 8 one-minute candles returned around the selected SOL fill |

One narrow historical window based only on a prior summary returned zero fills. That is a useful failure: RALPH must not treat summarized earliest/latest fill times as enough for delay simulation. Raw event rows and market-data joins need to be captured in the same bounded run.

## Example Delay Join

Selected example from the 20-minute probe:

| Field | Value |
| --- | --- |
| Address | `0x7fdafde5cfb5465924316eced2d3715494c517d1` |
| Coin | SOL |
| Wallet fill | `Open Short` |
| Fill time | `2026-08-31T13:02:07.834Z` |
| Fill price | `103.03` |
| Candle rows | 8 one-minute rows around the event |

Delay scenarios from public 1-minute candles:

| Delay | Public price proxy | Direction-adjusted edge vs wallet fill |
| ---: | ---: | ---: |
| 15s | 102.87 | +15.53 bps |
| 60s | 102.81 | +21.35 bps |
| 180s | 102.89 | +13.59 bps |
| 300s | 102.89 | +13.59 bps |

This proves the mechanics are measurable for some recent fills. It does not prove the address, archetype, or strategy has edge. The sample was cherry-picked from one address/window to validate the join path only.

## Falsifier Contract

A future wallet-shadow delay ledger should store one row per raw fill/event:

| Field group | Required fields |
| --- | --- |
| Identity | `run_id`, `captured_at`, address, source route, archetype, frozen selection time |
| Wallet event | `wallet_event_time`, coin, dir, side, size, fill price, closed PnL if present, current account state |
| Observation | when RALPH fetched the row, age at observation, whether row came from latest fills or time-window fills |
| Delay prices | 15s, 60s, 180s, 5m public price proxies, candle interval, missing-price flag |
| Costs | fee estimate, slippage class, partial/missed fill rule, capacity note |
| Context | BTC/ETH beta context, volatility window, event label if any |
| Quality flags | capped-history, stale-window, summary-only, hidden-hedge-risk, open-position-temptation, one-asset-concentration, no-exit |
| Verdict | `reject`, `watch`, `radar-only`, `needs-raw-capture`, or `paper-candidate` |

Minimum bar before any paper-candidate state:

- at least 20 quality observations after filters;
- at least 3 independent event windows for event-driven cohorts;
- raw rows stored from the same run as delay-price joins;
- 60s and 180s delay scenarios non-negative after conservative costs;
- exits observable or explicitly classified as radar-only;
- no more than half of positive PnL from one event, coin, or address;
- no capped-history row used as full-history proof.

## Decision

`discovery.wallet-shadow-delay-evidence` is complete.

Verdict: public/no-key Hyperliquid data can support a small latency-adjusted wallet-shadow falsifier for recent known-address fills, but it does not support broad scanner claims or copyability proof. The next valid implementation is a tiny frozen event ledger that captures raw fill rows and candle joins together, then rejects quickly if 60s/180s delay plus costs breaks the edge.

This narrows U-008 and U-017 but does not resolve them. Wallet shadowing remains a research lane, not a strategy promotion.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, scanner, cohort, or strategy promotion changed.
