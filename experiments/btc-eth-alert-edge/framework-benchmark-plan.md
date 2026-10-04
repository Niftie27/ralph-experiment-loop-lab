# BTC/ETH Edge Framework Benchmark Plan

Status: first bounded vectorbt benchmark implemented.

Purpose: verify the custom alert-edge snapshot against an established backtesting framework before trusting it for high-probability alert labels.

## Candidate Frameworks

- `vectorbt`: first choice for fast signal/portfolio metric parity checks.
- `Freqtrade`: first choice for crypto-bot style backtest/dry-run discipline.
- `NautilusTrader`: later choice if event-driven fills, latency, or replay realism become central.

## Current Local State

- System Python has no `pip`.
- A naive unpinned `uv run --with vectorbt` tried an old dependency chain that failed on Python 3.12.
- `uv run --with 'vectorbt>=0.26.0' --with 'plotly<6' --with pandas --with numpy` works and imports vectorbt. The Plotly pin is required because newer Plotly rejects vectorbt's bundled `scattermapbox` theme field.
- Current custom engine uses cached Binance public archive/rest-tail candles under `data/candles/`.

## Benchmark Scope v1

Compare one setup family first:

- `momentum_reversal_long`
- symbols: BTCUSDT and ETHUSDT
- timeframe: 4h
- same input candles from `data/candles/binance-spot-*-4h.json`
- same entry timestamps
- same stop/target model where framework support allows
- same fees/slippage assumptions where framework support allows

## Acceptance Criteria

- Framework and custom trade count differ by no more than explainable timestamp/window rules.
- Winrate and expectancy differences are explained by fill/collision assumptions.
- Any mismatch becomes a documented rule in `README.md` and alert caveats.
- If the framework makes the custom simulator redundant, keep only an adapter into `edge-snapshot.json`.

## Output

- `results/framework-benchmark.json`
- `results/framework-benchmark.md`
- short note in `results/edge-summary.md` or RALPH wiki if the result changes trust level.

## Current Benchmark Command

```bash
npm run benchmark:vectorbt --prefix ralph-research-os/experiments/btc-eth-alert-edge
```

The first benchmark deliberately records both:

- independent event-study stats for setup-level parity
- vectorbt portfolio sanity stats for framework behavior under position/capital mechanics

## First Result

Output: `results/framework-benchmark.json`.

- BTCUSDT 4h `momentum_reversal_long`: event-study 47 samples, 36.17% winrate, -0.1714R expectancy; vectorbt portfolio 34 trades, 39.39% win rate, -6.917% total return.
- ETHUSDT 4h `momentum_reversal_long`: event-study 55 samples, 40.00% winrate, -0.1442R expectancy; vectorbt portfolio 35 trades, 38.24% win rate, -23.5246% total return.

Row-level parity now reports explainable framework/custom differences: vectorbt suppresses overlapping portfolio entries and may include a recent tail signal before custom max-bars scoring is mature.

Reassessment: vectorbt agrees with the weak-edge conclusion but is not a drop-in replacement yet because its portfolio model handles position overlap/capital differently than RALPH's independent event-study scoring.

## Guardrails

- No live trading.
- No exchange keys.
- No paid data.
- No framework install without a bounded spike reason.
