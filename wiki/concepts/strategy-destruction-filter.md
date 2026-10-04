# Strategy Destruction Filter

RALPH should treat strategy ideas as guilty until proven useful. The system's first job is not to invent more entries and exits, but to filter, falsify, and discard weak ideas before they reach paper trading or execution.

## Why It Matters

Internet-fed trading agents can easily blend popular strategies, trader threads, and overfit examples into something that sounds coherent but has no durable edge. Quant discipline starts by trying to prove an idea is luck.

## Validation Contract

Each candidate strategy should move through a hard validation loop:

1. Translate the plain-English idea into explicit rules.
2. Generate deterministic, testable code.
3. Backtest across hostile market regimes.
4. Include fees, slippage, latency assumptions, and execution constraints.
5. Report failure slices, not just headline returns.
6. Penalize multiple testing with deflated Sharpe or an equivalent adjustment.
7. Require paper-trading evidence before live promotion.

The current filter also reports a diagnostic-only probabilistic Sharpe proxy. It compares a variant's trade Sharpe against the matched timestamp baseline while accounting for sample length, skew, and kurtosis. This is intentionally not a survival gate yet: a strategy can beat a worse baseline while still losing money after costs.

## Current Data Rails

- BTC/ETH/SOL/XRP spot: downloaded Binance public archive candles with REST tail, currently 1h/4h over a requested 1825-day window.
- HYPE: Bybit v5 public linear-perpetual klines for `HYPEUSDT`, because Binance spot is not the right historical venue. Coverage starts near the Bybit HYPEUSDT launch in December 2024.
- HYPE perps context: Bybit funding history and open-interest history are joined onto HYPE candles as optional features. Current funding/OI fade candidates must still pass out-of-sample, baseline, and failure-slice gates before promotion.
- Hyperliquid public API is verified accessible for HYPE candles and funding history, but the 1h candle snapshot is row-capped in practice; use it for funding/context next, not as the first full OHLCV backtest rail.
- No crypto market-data MCP connector is currently exposed in this workspace; direct public/no-key APIs are the active rail until a useful connector is verified.

## Feature Diagnostics

Before adding another strategy candidate, run `npm run study:features --prefix ralph-research-os/experiments/strategy-destruction-filter`. The feature study writes `results/feature-study.json` and `.md`, bucketed by funding, open-interest change, RSI-only baselines, regime, and forward-return horizon.

Current HYPE diagnostic read: high-positive funding has a raw short/fade tendency over 6 bars on both 1h and 4h samples, but the first combined funding/OI strategy still failed out-of-sample and failure-slice gates. OI-change extremes alone are not directional enough. RSI-only baselines are mixed across BTC/ETH/SOL/HYPE and should be treated as comparison buckets, not standalone evidence.

2026-08-25 PSR diagnostic read: the filter still rejects all 13 tested variants. The best HYPE funding/OI fade variant has positive overall expectancy (`0.0354R`) and a high PSR-style probability versus its matched baseline (`0.9426`), but it still fails expectancy, profit factor, deflated-Sharpe, failure-slice, and out-of-sample gates. This confirms the diagnostic is useful context, not a promotion reason.

Later 2026-08-25 funding-fade expansion: funding-only and trend/timeframe-filtered HYPE variants improved headline metrics but still failed promotion. The strongest all-timeframe trend-filtered variant (`perp-funding-trend-filter-fade-v0#6`) had sample `90`, expectancy `0.3359R`, profit factor `1.6283`, deflated-Sharpe proxy `1.6783`, max drawdown `14.2831R`, and positive baseline lift, but out-of-sample expectancy was `-0.2356R`. The best 1h range-only variant had sample `76`, expectancy `0.294R`, but failed low-sample and out-of-sample gates. Conclusion: HYPE funding fade is a live research lead, not a paper-trading promotion.

Later 2026-08-25 walk-forward diagnostic: the HYPE funding lead is not stable enough. `perp-funding-trend-filter-fade-v0#6` had 3/5 positive chronological folds and 3/5 positive baseline-lift folds, but the last two folds were negative (`-0.1453R`, `-0.326R`) and positive OOS folds were `0`. The broader funding-only variant `#7` had 4/5 positive folds, but the final two folds were weak/negative and hard 70/30 OOS stayed negative. Keep researching the mechanism, but do not paper-promote without a walk-forward-consistent variant.

Later 2026-08-25 alert-edge integration: the first liquid alert-edge B-tier bucket was converted into a strict filter candidate, `alert-edge-xrp-range-breakout-v0`, with generic `symbol`, `timeframe`, `trend`, and `volatility` filters added to the harness. XRP public Binance spot data was added to the filter universe. Latest run: `8` candidates / `69` variants / `0` survivors. The best XRP range-breakout variant had sample `134`, expectancy `0.0278R`, profit factor `1.0435`, deflated-Sharpe proxy `-0.0183`, out-of-sample expectancy `0.2115R`, baseline lift `-0.0978R`, and max drawdown `24.9469R`. Conclusion: positive OOS alone is not enough; the bucket is rejected until it beats baseline and drawdown/profit-factor gates.

## Candidate Intake Contract

Before a strategy idea can enter the filter, run `npm run validate:candidates --prefix ralph-research-os/experiments/strategy-destruction-filter`. Candidate specs must include a plain-English thesis, mechanism, edge speed, falsifiable claim, data requirements, validation baseline, gates, kill criteria, and rule-specific parameter grids. The filter and verifier both enforce this so vague ideas fail before backtesting.

Generic candidate parameters can now include optional `symbol`, `timeframe`, `trend`, and `volatility` filters when an upstream evidence source such as alert-edge identifies a specific bucket. These filters narrow the test; they do not relax survival gates.

## Design Rule

Generating candidates is cheap. Survival is expensive. RALPH should discard many ideas and promote almost none.

## Source

- [[../../raw/trading-system-filter-thesis-2026-08-21|Trading-System Filter Thesis]]
