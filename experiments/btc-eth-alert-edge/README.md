# Liquid Crypto Alert Edge Experiment

Stage: T2 offline backtest plus T3 forward paper/shadow.

Purpose: maintain local liquid-crypto setup statistics for alert qualification. This is not a live-trading system and must not use exchange keys, wallet keys, paid APIs, or automatic execution.

Scope is expanding toward a dynamic liquid-crypto universe. BTC/ETH remain benchmark assets, but SOL, HYPE, and other larger/mid-sized alts can enter when public data, liquidity, movement, and event context justify deeper stats. See `universe-policy.md`.

## Output Contract

- `results/edge-snapshot.json`: machine-readable latest setup stats and active alert candidates.
- `results/edge-summary.md`: short human-readable summary.
- `paper/signals.json`: forward paper-trade records generated from live/latest setup candidates, including trend/volatility regime tags.
- `results/paper-dashboard.json`: machine-readable forward paper ledger summary split by tier, setup, symbol, timeframe, and regime.
- `results/paper-dashboard.md`: human-readable forward paper dashboard that separates A/B/C rows from low-sample/avoid learning rows and adds regime-aware candidate-check views.
- `results/universe-snapshot.json`: dynamic asset universe selected from public venue/trending rails.
- `results/agent-swarm-feature-table.json` / `.csv`: research-only joined alert outcome feature table with USDT candle context, orderflow/book fields, relative-matrix context, labels, and quality flags.
- `results/agent-scoreboard.json` / `.md`: research-only specialist agent scoreboard; these are forecast-quality measurements, not live gates.
- `results/agent-scoreboard-slices.json` / `.md`: grouped scoreboards by asset, trigger, direction, data quality, relative alignment, and beta bucket.
- `results/swarm-runs/<run-id>/`: research-only file-backed launch runs with per-job JSON artifacts and Markdown/JSON run summaries.

Future alert writers should read `results/edge-snapshot.json` and include this block when a BTC/ETH setup is mentioned:

```text
Edge: A-/B/C or low sample
Backtest: winrate, sample count, expectancy in R, profit factor
Baseline: same-symbol/timeframe/direction naive comparison
Regime: trend/range and volatility bucket
Paper: forward sample count and recent status when available
```

## Setup Families v0

- `trend_pullback_reclaim_long`: trend is up, price pulls into/reclaims SMA20.
- `trend_pullback_reject_short`: trend is down, price rejects SMA20.
- `range_breakout_long`: close breaks prior range high with volume confirmation.
- `range_breakdown_short`: close breaks prior range low with volume confirmation.
- `momentum_reversal_long`: oversold RSI recovers while not in a strong downtrend.
- `momentum_reversal_short`: overbought RSI rolls over while not in a strong uptrend.

## Conservative Assumptions

- Binance public spot archives plus public REST tail are the preferred free data rail; Coinbase public candles are a fallback.
- Stop/target collisions inside the same candle are scored as stop-first.
- Fees and slippage are subtracted from R.
- Backtest stats are descriptive evidence, not financial advice.
- Low sample setups must stay below high-probability tier.

## Run

```bash
npm run backtest --prefix ralph-research-os/experiments/btc-eth-alert-edge
npm run universe --prefix ralph-research-os/experiments/btc-eth-alert-edge
npm run verify --prefix ralph-research-os/experiments/btc-eth-alert-edge
npm run swarm --prefix ralph-research-os/experiments/btc-eth-alert-edge
npm run validate:features --prefix ralph-research-os/experiments/btc-eth-alert-edge
npm run swarm:launch --prefix ralph-research-os/experiments/btc-eth-alert-edge -- --dry-run
npm run swarm:launch --prefix ralph-research-os/experiments/btc-eth-alert-edge -- --mode local
```

`npm run backtest` also refreshes `results/paper-dashboard.json` and `results/paper-dashboard.md` after updating `paper/signals.json`.

For only the forward paper dashboard:

```bash
npm run paper --prefix ralph-research-os/experiments/btc-eth-alert-edge
```

For an incremental symbol check:

```bash
RALPH_BACKTEST_SYMBOLS=SOL npm run backtest --prefix ralph-research-os/experiments/btc-eth-alert-edge
npm run verify --prefix ralph-research-os/experiments/btc-eth-alert-edge
```

## Data Rail

The default rail reuses existing Binance public archives:

- monthly/daily spot kline ZIPs from `data.binance.vision`
- public Binance REST klines for the recent tail that archives may not yet include
- local JSON cache under `data/candles/`
- local archive CSV cache under `data/binance-archive-cache/`

This keeps custom code focused on alert statistics and paper-state glue, not historical data collection.

## Research Swarm

The first RALPH swarm layer is deliberately offline:

- feature builders join finalized alert feedback to cached candle context, orderflow/book evidence, and synthetic relative-pair features;
- scouts make simple follow/fade/noisy predictions from one evidence family at a time;
- ensemble scouts test multi-source combinations without promoting them to gates;
- the scoreboard measures coverage and correctness against finalized outcomes;
- grouped scoreboards show which agents work or fail in specific slices;
- the risk critic abstains on tainted rows, including stale/missing book data and known pre-fix quality issues.

This keeps the architecture as many researchers, one scorer, and zero autonomous execution.

## Swarm Launcher

`swarm-manifest.json` defines bounded research jobs for a local fan-out/fan-in swarm run:

- `post_alert_dataset_audit`
- `relative_context_review`
- `orderflow_book_quality_audit`
- `slice_watchlist_review`
- `risk_governor_review`
- `synthesis_report`

The launcher has three modes:

- default / `--dry-run`: validate the manifest and print the planned jobs without writing artifacts;
- `--mode local`: run deterministic in-process research jobs from current local files and write artifacts under `results/swarm-runs/<run-id>/`;
- `--mode openclaw`: prepare child-session prompt files only; it does not launch sessions by itself.

The launcher is research-only. It does not touch watcher services, alert wording, thresholds, risk, sizing, account/key/wallet access, paid APIs, or execution. The current risk governor blocks promotion by design because the clean sample is too small, quality flags remain present, and no out-of-sample promotion test exists.

## Pre-ML Feature Table

`schemas/pre-ml-feature-row.schema.json` documents the row contract for the research-only alert feature table. `npm run validate:features` verifies the generated `results/agent-swarm-feature-table.json` before any model work is allowed. The current contract requires deterministic labels, candle context, relative context, quality flags, and clean/tainted row accounting.
