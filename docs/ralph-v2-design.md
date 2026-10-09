# RALPH v2 Design

Status: proposal, waiting for approval
Date: 2026-10-09

## Boundary

RALPH v2 is a research and simulation stack, not a live-control stack.

- v1 watcher, alerts, demo-sim, and paper-trading paths stay isolated and unchanged.
- No trading keys, no execution, no account creation, and no service restarts are part of this proposal.
- v2 starts in shadow mode: write logs/reports first, send Telegram only after explicit approval.
- Backtests come first, then demo-sim-2, then paper-trading-2.

## Goal

Build one replayable futures-first research path that can answer:

1. Would the 2026-10-08 17:00:25 UTC move have fired?
2. Which alerts fire per day on recorded/live futures data?
3. Which strategies survive after costs, latency, slippage, and out-of-sample validation?
4. Which data enhancements add value in backtests before they are allowed into decisions?

## Architecture

### Collectors

Existing futures collectors provide BTC/ETH/SOL/HYPE events and `live.json`.

v2 reads collector output only. It does not control collectors directly. Collector compression/file-format changes are expected from Claude and should be consumed through a small reader interface.

Required streams:

- trades: tick tape for rolling price, volume, candles, CVD, and replay.
- depth/book ticker: top-of-book and depth-derived slippage/thin-book checks.
- liquidations: liquidation bursts and cascade exhaustion.
- live snapshots: latest normalized market state for dashboards and watchdogs.

### signals-v2

`signals-v2` is a separate service reading futures collector files/events.

It evaluates triggers continuously on rolling windows. It must not depend on fixed 5-second bucket boundaries for the decision. A 5-second window may be used as a measurement horizon, but a candidate can be emitted at any event time once the rolling state crosses a rule.

Every candidate carries a no-look-ahead context snapshot:

- signal timestamp and source event timestamp
- symbol, venue, market type, and stream freshness
- rolling windows used by the trigger
- current multi-timeframe candle state with only data known at signal time
- local orderflow state
- depth/slippage state
- liquidation state
- HTF context from already-closed candles only
- config version and parameter hash

### alerting-v2

v2 alerts are separate from v1 alerts.

Telegram prefix after approval: `RALPH v2 · FUTURES`

Initial mode: shadow log only.

Initial futures alert rules:

- price shock: futures price move `>= 0.30% / 5s`
- volume-only velocity: `>= 10x`, re-fire after cooldown when `>= 2x`
- liquidation burst
- fragile book: BTC depth within 100 USD is `< 50%` of its 30-minute median

The alert output must include the triggering rule, symbol, rolling-window values, no-look-ahead context, replay/live source, and whether required book/liquidation data was present.

## Candle System

Candles are built from trades for live and replay parity.

Trigger timeframes:

- 1s
- 5s

Setup timeframes:

- 1m
- 5m
- 15m

Context timeframes:

- 1h
- 4h
- 1D

Rules:

- candle open/close times are exact UTC boundaries
- open is the first trade at or after the boundary
- close is the last trade before the next boundary
- high/low are trade extremes inside the interval
- volume is sum of trade quantity
- taker-side volume is retained when available
- incomplete current candles can be used only as current-state context, never as closed HTF confirmation

HTF history source:

- Binance klines or `data.binance.vision` for history bootstrap.
- Mark replay runs where historical data lacks book/depth/liquidation fields.

## One Live/Replay Path

Live and replay use the same engine:

1. `MarketEventReader` yields normalized events.
2. `RollingMarketState` updates candles, windows, depth, orderflow, and liquidation state.
3. `SignalRules` evaluate candidate triggers.
4. `StrategyRules` decide setup eligibility.
5. `ExecutionSimulator` consumes futures tape after signal time plus configured latency.
6. `LedgerWriter` records fills, fees, slippage, funding, MFE/MAE/R, and config hash.

Replay sources:

- recorded futures data from 2026-10-08 onward
- Binance historical trades/klines from `data.binance.vision`

Replay acceptance gate:

- the 2026-10-08 17:00:25 UTC BTC move must produce a v2 futures candidate
- output must report alerts/day per symbol and per rule
- output must mark rules that could not be evaluated because book or liquidation data was unavailable

## demo-sim-2

`demo-sim-2` is one framework with pluggable strategies. Strategy IDs can be `2`, `3`, `4`, etc.; each strategy owns its config and ledger, but all use the same event reader, state engine, fill model, and reporting.

Common fill model:

- entry decision timestamp is signal timestamp plus configured decision latency
- fills use futures tape after signal time, never pre-signal data
- taker fees are charged
- slippage is estimated from book depth when available
- fallback slippage is explicitly marked when depth is missing
- funding is included for positions spanning funding boundaries
- MFE, MAE, R, realized PnL, fees, slippage, and max drawdown are recorded

Paper-trading-2 later reuses the same framework and config format.

## Strategy 2: Level + Orderflow Fade

Purpose: fade an impulse into a meaningful level only when orderflow shows exhaustion against the move.

Candidate levels:

- VWAP +/- 2 standard deviations
- POC
- VAH
- VAL
- previous day high
- previous day low
- naked POC

Required data:

- trades for price, volume, VWAP, CVD, and candle construction
- volume profile built from trade price/quantity
- depth/book data for absorption and slippage
- manually supplied or derived daily levels when needed
- optional ATAS/manual exports only as research labels until a reproducible data path exists

Why this data:

- the edge thesis depends on price reaching a defended level, not just moving fast
- orderflow confirmation is the guard against blindly fading trend continuation

Decision sketch:

- price reaches a configured level band
- impulse into the level is large enough to matter
- absorption or stacked imbalance appears against the move
- book/slippage does not make the trade structurally bad
- HTF context does not veto the fade

## Strategy 3: Cascade Exhaustion Fade

Purpose: fade liquidation-driven exhaustion when forced selling/buying accelerates into a local extreme and then stalls.

Required data:

- trades for shock, local low/high, and post-signal tape
- liquidation stream for burst detection
- depth/book data for absorption and fill/slippage
- 1s/5s candles for trigger state
- 1m/5m/15m candles for setup context

Why this data:

- the strategy specifically claims forced-flow exhaustion, so liquidation and post-burst absorption must be visible
- without liquidation data it becomes only a generic price-shock fade and must be reported separately

Decision sketch:

- price shock crosses threshold
- liquidation burst occurs in the same direction
- price makes a local extreme
- absorption appears at or just after the extreme
- entry is simulated only on futures tape after the signal plus latency

## Strategy 4: Breakout Continuation

Purpose: follow a strong move when orderflow and book structure imply continuation rather than exhaustion.

Required data:

- trades for velocity, CVD, and candles
- depth/book data for thin-book direction and slippage
- stacked imbalance or reproducible proxy from taker-side flow/depth
- HTF candle context for avoiding low-quality chop

Why this data:

- continuation needs both speed and structural ease in the direction of the move
- a thin book can be opportunity or danger; the simulator must price slippage explicitly

Decision sketch:

- velocity trigger fires
- taker flow/imbalance agrees with direction
- book is thin in the move direction but still fillable under slippage limits
- setup timeframe does not show immediate level rejection

## Statistics Rules

Rules are fixed before reading results:

- target at least about 100 trades per strategy before judging
- out-of-sample period is never used for tuning
- report results after all modeled costs
- compare against a random baseline and a simple baseline
- every parameter change gets a logged config hash and a new out-of-sample validation
- no strategy is promoted from backtest to demo-sim-2 without a written decision memo

Per-strategy report:

- trades
- win rate
- average R
- max drawdown
- MFE
- MAE
- cost breakdown
- alerts/day and candidates/day
- missing-data flags

## Daily v1 vs v2 Report

Daily comparison should report:

- v1 alerts
- v2 shadow alerts
- missed big futures moves
- replay/sim results
- false positives worth reviewing
- data gaps
- service health
- files produced
- active flags/config hashes
- rollback notes

v1 remains the rollback baseline. v2 can be disabled by stopping only v2 services and leaving v1 untouched.

## Data Enhancements Gate

Enhancements are data features first. They can influence decisions only after backtests show incremental value.

### Bybit Public Liquidations

Feature: Bybit `allLiquidation.{symbol}` stream next to Binance `forceOrder`.

Expected value:

- Bybit provides broader public liquidation visibility than Binance's snapshot-style forced-order feed.
- Helps distinguish exchange-local events from cross-venue cascade events.

Gate:

- add as a feature column only
- backtest with and without it
- promote only if it improves out-of-sample results or materially reduces missed cascades

Access status:

- proposed, not active
- needs official API/schema verification before implementation

### Binance Spot Collector

Feature: collect Binance spot trades/book next to futures.

Expected value:

- measure who leads: spot vs perpetual
- basis and dislocation context
- spot CVD vs perp CVD divergence

Gate:

- feature-only until a replay shows it improves selection or vetoes bad trades

Access status:

- proposed, not active
- likely public/no-key, but still needs stream/schema verification before implementation

### CME Gap Levels

Feature: Friday close / Sunday open levels for CME BTC futures.

Expected value:

- level context for weekend crypto moves around traditional futures gaps

Candidate source:

- delayed/free CME BTC futures quotes or downloadable historical settlement/quote pages, subject to access verification

Gate:

- level-only feature
- no decision use until backtest shows gap levels improve outcomes near those levels

Access status:

- proposed, not active
- source and license/terms must be verified before relying on it

### Single Prints and Low-Volume Nodes

Feature: TPO single prints and low-volume nodes from profile.

Expected value:

- identify thin auction areas and likely traverse/reject zones

Required data:

- reproducible TPO profile builder for single prints
- volume profile from trades for LVNs

Gate:

- feature-only
- backtest as level context, not a standalone trigger

### Candlestick Confirmations

Feature: engulfing, pin bar, and inside bar confirmations at levels.

Expected value:

- cheap, interpretable confirmation layer at predefined levels

Implementation note:

- reuse existing SFP-style candle logic where possible
- patterns must be confirmations, not primary triggers

Gate:

- compare level/orderflow strategy with and without candle confirmation
- keep only if it improves out-of-sample quality after costs

## Storage Proposal Placeholder

Storage measurement is a separate Phase 2 task and should be completed before any retention automation is implemented.

Current intended policy to measure and price:

- derived data kept forever
- raw data kept 7 days on the VPS
- older raw deleted or archived to Hetzner Storage Box only after approval
- nightly systemd user timer only after review
- disk alert below 20% free

No deletion, archival account setup, or timer installation is approved by this document.

## Open Questions Before Approval

1. Confirm whether v2 design should live under `docs/` or as a dated `wiki/notes/` decision note too.
2. Confirm initial symbols: BTC/ETH/SOL/HYPE only, or BTC-first until replay acceptance passes.
3. Confirm latency assumptions for first replay: fixed milliseconds, measured collector delay, or a small sweep.
4. Confirm whether v2 Telegram stays fully disabled until after replay statistics, or can send to a separate test chat after the first acceptance gate.
5. Confirm how strict the first replay gate should be when book/liquidation data is missing from historical sources.

