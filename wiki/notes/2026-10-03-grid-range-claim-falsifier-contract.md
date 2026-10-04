---
type: research-note
created: 2026-10-03T17:52:00Z
topic: grid-range-claim-falsifier-contract
status: complete
work_item: validation.grid-range-claim-falsifier-contract
scope: research-only
tags:
  - ralph
  - research-only
  - validation
  - trading-bots
  - grid
  - strategy-family
  - no-live-trading
  - no-execution
related:
  - 2026-10-03-market-bot-reverse-engineering-source-map.md
  - 2026-08-30-grid-range-existing-tool-trial-design.md
  - 2026-09-27-range-grid-offline-falsifier.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-range-grid-offline-falsifier.md
  - ../../decisions/candidates.md
---
# Grid Range Claim Falsifier Contract

## Purpose

This closes `validation.grid-range-claim-falsifier-contract` as a tiny bot-market follow-up.

The goal is not to revive the rejected grid branch. The goal is to define the minimum evidence contract a public grid-bot claim must satisfy before RALPH spends another test on it.

## Prior State

RALPH already did two relevant passes:

- `wiki/notes/2026-08-30-grid-range-existing-tool-trial-design.md`: grid/range bots are heavily productized, but real use crosses account, key, wallet, capital, UI, or execution boundaries.
- `wiki/notes/2026-09-27-range-grid-offline-falsifier.md`: a naive fixed offline grid over BTC/ETH/SOL 4h candles was rejected hard.

The existing offline falsifier verdict is `reject_loses_to_no_trade`:

- 292 trades;
- `-140605.35` USDT per 10k accounting surface;
- 11.30% winrate;
- PF `0.0576`;
- 1411.79% max drawdown;
- 206 stop/trend-break exits.

So the default assumption is: generic grid claims are rejected until a source-backed variant fixes the exact failure modes.

## Hypothesis

A grid/range bot claim is only worth a fresh RALPH test if it defines, before seeing outcomes:

- why the market is range-bound;
- how the range is selected without hindsight;
- how grid spacing clears fees, spread, slippage, and funding;
- how inventory is capped;
- how trend-break loss is stopped early;
- how BTC regime blocks alt grids when cross-market risk shifts.

Without those fields, the claim is marketing or product UX, not strategy evidence.

## Public Claim Class

Claim family: grid bots harvest oscillation by placing laddered buy and sell orders inside a bounded price range.

Useful public-source examples from the bot-market map:

- Pionex-style built-in grid products;
- Bitsgap GRID/COMBO/DCA bot family;
- 3Commas grid/DCA bot family;
- Hummingbot Grid Strike/Grid Executor references;
- public Hyperliquid grid/MM repos as execution-adjacent specimens.

These sources prove the family is productized. They do not prove positive expected value.

## Required Data Contract

Any future grid falsifier must freeze this row schema before running:

| Field | Requirement |
| --- | --- |
| `symbol` | Liquid symbol; start with BTC/ETH/SOL or a single source-justified alt. |
| `venue` | Spot or perp explicitly; include maker/taker and funding assumptions if perp. |
| `timeframe` | Candle or tick resolution named before run. |
| `range_source` | Prior-only source such as previous session range, value area, N-bar channel, or source-defined bot range. |
| `range_frozen_at` | Timestamp before the first simulated fill. |
| `btc_gate` | `BTC_TRANSITION` required by default; `BTC_RISK_ON` and `BTC_RISK_OFF` require a source-backed exception. |
| `grid_spacing_bps` | Must exceed round-trip cost plus spread/slippage buffer. |
| `levels` | Number of levels fixed before run. |
| `capital_model` | Fixed capital, inventory cap, max adds, and max capital lockup. |
| `entry_rule` | Exact first fill rule; no hindsight range redraw. |
| `exit_rule` | Take-profit, stop, time exit, and forced trend-break exit. |
| `fee_model` | Maker/taker/slippage/funding model frozen before run. |
| `baseline_rows` | No-trade, buy-and-hold, simple range fade, and prior rejected naive-grid baseline where comparable. |
| `failure_flags` | Trend break, range redraw, inventory saturation, fee drag, funding drag, liquidation risk, single-window concentration. |

## Mandatory Baselines

A fresh grid claim must beat all applicable baselines:

1. `no_trade`: zero risk, zero fees.
2. `buy_and_hold`: same symbol and window.
3. `simple_range_fade`: one entry near lower range, one exit near midpoint or upper range, no ladder.
4. `rejected_naive_grid`: the 2026-09-27 fixed prior-range grid result when symbol/timeframe is comparable.
5. `btc_gate_skip`: what happens if the same windows are filtered by BTC regime versus not filtered.

If the grid only beats a strawman but loses to simple range fade or no-trade, discard it.

## Kill Criteria

Kill immediately if any of these are true:

- net expectancy is <= 0 after fees, spread/slippage, and funding;
- max drawdown exceeds buy-and-hold drawdown or breaches a fixed capital stop;
- stop/trend-break exits dominate mean-reversion exits;
- profit comes from one symbol, one month, or one unusually clean sideways pocket;
- grid spacing only works because fees/slippage are ignored;
- range is selected or redrawn with future information;
- inventory cap is missing or assumes unbounded averaging;
- BTC gate blocks the majority of profitable alt windows, implying hidden market-beta dependence;
- live/product use would require account, key, wallet, paid plan, or execution setup before offline evidence exists.

## Upgrade Criteria

Move from Watch to `candidate-for-backtest-design` only if all are true:

- at least 3 symbols or 3 non-overlapping windows survive, unless the source claim is explicitly single-symbol;
- net expectancy remains positive after conservative costs;
- PF is above 1.2 and not driven by one outlier window;
- max drawdown is bounded and lower than the prior rejected naive-grid result;
- trend-break exits are controlled by an explicit rule, not averaged through;
- simple range fade is beaten on the same rows;
- BTC gate is explicit and does not rely on stale or contradictory regime context;
- output rows are reproducible from public/no-key data.

Even then, the next state is only `candidate-for-backtest-design`, not paper/demo/live.

## Current Decision

`grid_range_claim_falsifier` is now a design contract, not an active test.

Do not run another grid backtest unless a specific public bot/source claim supplies a concrete improvement over the rejected naive-grid baseline: better range source, explicit inventory cap, fee-safe spacing, and trend-break control.

If Tomas wants the next actual implementation, the smallest valid one is a one-symbol, pre-registered source-claim replay that compares:

- source-style grid;
- simple range fade;
- no-trade;
- buy-and-hold;
- prior naive-grid rules.

## Boundary

No live trading, no orders, no keys, no paid APIs, no account setup, no wallet connection, no credentialed scraping, no scheduler/cron change, no watcher behavior, no alert wording, no paper/demo alert logic, no risk, no sizing, no TP/SL, no execution, no public posting, and no strategy promotion changed.
