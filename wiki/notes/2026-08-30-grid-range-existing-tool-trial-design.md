---
type: note
topic: grid-range-existing-tool-trial-design
created: 2026-08-30T16:07:00Z
last_updated: 2026-08-30T16:07:00Z
work_item: discovery.grid-range-existing-tool-trial-design
status: complete
scope: research-only
sources:
  - https://hummingbot.org/blog/strategy-guide-grid-strike/
  - https://hummingbot.org/strategies/v2-strategies/executors/gridexecutor/
  - https://hummingbot.org/exchanges/hyperliquid/
  - https://www.pionex.com/en/fees
  - https://support.pionex.com/hc/en-us/articles/45361340740761-Futures-Demo-Trading
  - https://www.pionex.com/blog/grid-bot-setup/
  - https://www.tradingview.com/pine-script-docs/concepts/strategies/
  - https://github.com/chainstacklabs/hyperliquid-trading-bot
tags:
  - ralph
  - research-note
  - source-scan
  - strategy-family
related:
  - 2026-08-30-existing-tool-fit-map.md
  - 2026-08-30-event-driven-bot-repo-search.md
  - 2026-08-30-hyperliquid-data-feasibility-spike.md
  - 2026-08-30-strategy-family-taxonomy.md
  - ../../decisions/candidates.md
---
# Grid Range Existing Tool Trial Design

## Purpose

This closes `discovery.grid-range-existing-tool-trial-design` as a research-only design pass.

The goal is not to launch a bot. The goal is to decide how RALPH should evaluate range/grid ideas without building custom execution code or crossing account, key, wallet, paid-service, scheduler, or live-trading boundaries.

## Current Source Check

Checked on 2026-08-30:

| Tool/source | What it proves | Access boundary | RALPH stance |
| --- | --- | --- | --- |
| Hummingbot Grid Strike and Grid Executor | Grid logic, range/level parameters, order management, stop/take-profit/time barriers, and spot/perp connector support are already productized in an open-source bot framework. | Real use requires local setup and exchange connector credentials; Hyperliquid connector docs include API-key or wallet flows, with testnet still needing an account/key path. | Reference and possible future approved paper/testnet rail, not active execution. |
| Pionex grid bot pages, fee page, and futures demo documentation | Grid products and demo/fake-money futures practice exist; Pionex spot trading fee is listed as 0.05% and bot use still incurs trading/funding/spread costs. | Product/account surface; demo/live bot use requires platform account and acceptance of venue constraints. | Prior-art/reference only unless Tomas explicitly approves account/product evaluation. |
| TradingView Pine strategies | Strategy scripts can backtest and forward-test hypothetical trades, but broker emulator behavior depends on chart data and intrabar assumptions. | Public docs; actual scripts/UI are manual or account/UI dependent. | Useful for manual visual/paper reasoning, not authoritative fill realism. |
| Hyperliquid grid bot repos | Existing Hyperliquid grid bots use testnet/private-key or API-wallet flows and carry explicit trading-risk disclaimers. | Key/account/execution-adjacent even on testnet. | Safety specimen and config reference only; no clone/run/setup. |

## Trial Design

The first RALPH trial should be an offline range/grid falsifier, not a connected bot.

Minimum design:

| Field | Requirement |
| --- | --- |
| Market | one liquid pair only, preferably BTC/ETH/SOL first |
| Regime | pre-registered range or low-volatility window; no hindsight redraw |
| Range | fixed from prior data only, such as prior day/session high-low, value area, or N-bar channel |
| Grid spacing | fixed before run, with fee-adjusted minimum spacing |
| Capital model | notional-only paper budget; no leverage by default |
| Costs | maker/taker fee assumption, spread/slippage buffer, funding for perps |
| Baselines | buy-and-hold/flat, simple range mean-reversion, and no-trade |
| Kill condition | reject if net expectancy fails costs, breaks on trend days, or does not beat the simple range baseline |
| Output | compact markdown result plus machine-readable rows if later implemented |

## Falsifiers

Grid/range deserves no custom build if any of these are true:

- profit disappears after a realistic two-leg fee plus spread/slippage model;
- most gains come from one unusually clean sideways window;
- trend-break losses dominate many small wins;
- a simpler range mean-reversion or no-trade baseline is equal or better;
- the setup requires leverage, constant monitoring, or exchange-specific execution tricks;
- the only attractive route is a live/product bot account rather than a reproducible offline result.

## Decision

`C-028` stays `Watch`, not `Candidate`.

Grid/range is already heavily productized. RALPH should not build or run a grid bot until a range hypothesis first survives an offline falsifier against simple baselines and costs. If a future test is justified, the first implementation should be a local paper/backtest spec using public candles and conservative fill assumptions, then possibly an approved demo/testnet product comparison. Hummingbot, Pionex, TradingView, and Hyperliquid grid repos remain references.

## Next Micro-Action

Do not connect a bot. If grid/range returns to the top of the queue, write a tiny offline test spec for one liquid symbol and one pre-registered range regime. A good starting question is:

> Does a fixed prior-session range grid beat a simple range mean-reversion baseline after two-leg fees and trend-break losses?

## Boundary

This page authorizes no live copying, live trading, wallet keys, exchange keys, API keys, account setup, paid APIs, public posting, scheduler changes, alert wording, thresholds, risk/sizing, TP/SL, execution behavior, orders, dependency adoption, watcher behavior, or strategy promotion.
