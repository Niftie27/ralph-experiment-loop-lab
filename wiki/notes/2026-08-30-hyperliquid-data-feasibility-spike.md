---
type: note
topic: hyperliquid-data-feasibility-spike
created: 2026-08-30T16:02:00Z
last_updated: 2026-08-30T16:02:00Z
work_item: discovery.hyperliquid-data-feasibility-spike
status: complete
scope: research-only
sources:
  - https://api.hyperliquid.xyz/info
  - https://stats-data.hyperliquid.xyz/Mainnet/leaderboard
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
tags:
  - ralph
  - research-note
  - orderflow
  - ta
  - wallet-shadowing
related:
  - 2026-08-30-public-free-source-feed-list.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-30-hyperliquid-leaderboard-address-sample.md
  - 2026-08-30-wallet-shadowing-forward-paper-trade-spec.md
  - ../../core/data-rails.md
  - ../../decisions/copytrading-watch-ledger.md
---
# Hyperliquid Data Feasibility Spike

## Purpose

This closes `discovery.hyperliquid-data-feasibility-spike` as a bounded public/no-key feasibility check.

The question was not "which wallet should RALPH copy?" The question was whether Hyperliquid can support cheap falsifiers for wallet-shadowing, copytrading-source research, funding/basis context, and market-data replay before Tomas approves accounts, keys, paid tools, scheduler changes, or live trading.

## Live Probe Snapshot

Checked from this workspace on 2026-08-30:

| Route | Probe | Result | RALPH use |
| --- | --- | --- | --- |
| Public stats leaderboard | `GET /Mainnet/leaderboard` | HTTP 200, structured leaderboard rows | address seed discovery only |
| Universe metadata | `info` payload `{"type":"meta"}` | HTTP 200, public perp universe | active market universe/context |
| All mids | `info` payload `{"type":"allMids"}` | HTTP 200, current mids map | active price/context snapshot |
| Predicted fundings | `info` payload `{"type":"predictedFundings"}` | HTTP 200, cross-venue funding rows | active funding/basis context |
| Funding history | `info` payload `{"type":"fundingHistory","coin":"BTC",...}` | HTTP 200, 72 hourly BTC rows for 3 days | active funding-history proxy |
| Candle snapshot | `info` payload `{"type":"candleSnapshot","req":{"coin":"BTC","interval":"1m",...}}` | HTTP 200, 61 one-minute candles for 1 hour | active candle/replay proxy |
| Address state | `info` payload `{"type":"clearinghouseState","user":...}` | HTTP 200, account value and open positions | active verification for known addresses |
| Address fills | `info` payload `{"type":"userFills","user":...}` | HTTP 200, 2000 returned fills in the sample | active triage, capped-history caveat |

These results verify reachable public access now. They do not prove production reliability, full historical completeness, copyability, export terms beyond public access, or strategy edge.

## Feasibility Verdict

Hyperliquid is a good first public data rail for RALPH, but only for bounded research:

- Strong: current market universe, mids, public candles, funding history, predicted funding, account state, open positions, and recent/account fill triage for known addresses.
- Strong: no-key seed discovery through the public stats leaderboard, when paired with independent `clearinghouseState` and `userFills` checks.
- Weak: full wallet-history proof, activity-defined candidate discovery without leaderboard bias, hidden-hedge detection, off-venue hedge detection, exact copy latency simulation, and mid-cap spot accumulation outside Hyperliquid perps.
- Blocked for promotion: `userFills` can be capped, so returned fills are enough to reject or keep watch rows, but not enough to certify a copyable account or complete performance history.

## Cheapest Falsifiers Enabled

| Branch | Cheap falsifier enabled by Hyperliquid | Decision boundary |
| --- | --- | --- |
| Wallet/copytrading source lane | Seed small public address samples, then reject accounts with stale state, capped/thin fills, negative returned close-fill PnL, concentrated coins, or unsafe open-position profiles. | Can produce watch/reject rows only. |
| Activity-defined cohort work | Use public account state and fills for already discovered addresses, but require a non-leaderboard seed route before claiming activity-defined universe quality. | `U-019` remains open. |
| Funding/basis baseline | Pull funding history and predicted funding for candidate coins before any structural baseline monitor proposal. | Context/falsifier only, no strategy signal. |
| Alert/orderflow context | Use candles and public market state as supporting replay context; use WebSocket orderflow work for tick-level features. | No alert wording or threshold change. |
| Mid-cap feasibility | Check whether candidate coins exist on Hyperliquid, have public candles/funding, and can be cross-checked against DEX/CEX liquidity routes. | Hyperliquid alone cannot validate spot accumulation. |

## Next Micro-Action

The best next Hyperliquid-related branch is not another leaderboard sample. It should be one of:

- `discovery.wallet-shadow-delay-evidence`: define delay scenarios and test whether public fill/state timestamps can support latency-adjusted shadow PnL.
- `discovery.slow-accumulator-copytrading-source-fit`: decide whether Hyperliquid perps can contribute to slow accumulator research, or whether that branch still requires Nansen/Arkham/Dune-style spot/on-chain cohort data.
- `discovery.grid-range-existing-tool-trial-design`: use Hyperliquid only as a market-data/context rail unless a no-key paper/demo grid route is explicitly approved.

## Boundary

This page authorizes no live copying, live trading, wallet keys, exchange keys, paid APIs, account setup, public posting, scheduler changes, alert wording, thresholds, risk/sizing, TP/SL, execution behavior, orders, dependency adoption, watcher behavior, or strategy promotion.
