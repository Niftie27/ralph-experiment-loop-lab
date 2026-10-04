# BTC/ETH Alert Edge Loop

Status: approved by Tomas in Telegram on 2026-08-11.

Purpose: maintain a background paper/demo evidence layer for liquid crypto alerts. BTC/ETH remain benchmark assets, but SOL, HYPE, and currently moving larger/mid-sized alts can enter through a dynamic universe selector before deeper setup stats are trusted.

Cadence:

- Every 4 hours: refresh dynamic universe, public OHLCV candles, setup statistics, and paper/shadow signals.
- Daily or during alert writing: read `experiments/btc-eth-alert-edge/results/edge-snapshot.json`.
- During broad alt alerts: read `experiments/btc-eth-alert-edge/results/universe-snapshot.json` first.

Inputs:

- Coinbase Exchange public BTC-USD and ETH-USD candles.
- Binance spot/futures public market metadata and 24h tickers.
- Hyperliquid public market metadata and asset contexts.
- CoinGecko trending search as a context hint.
- Local setup definitions in `experiments/btc-eth-alert-edge/src/backtest.mjs`.
- Local universe policy in `experiments/btc-eth-alert-edge/universe-policy.md`.
- Local paper signal state in `experiments/btc-eth-alert-edge/paper/signals.json`.
- Existing no-key dry-run/framework tooling when it can validate the same setup without live execution.
- Prior-art/wheel scan notes before expanding the custom engine or adding new data collectors.

Outputs:

- `experiments/btc-eth-alert-edge/results/edge-snapshot.json`
- `experiments/btc-eth-alert-edge/results/edge-summary.md`
- `experiments/btc-eth-alert-edge/results/universe-snapshot.json`
- `experiments/btc-eth-alert-edge/results/universe-summary.md`
- `experiments/btc-eth-alert-edge/paper/signals.json`
- `experiments/btc-eth-alert-edge/results/paper-dashboard.json`
- `experiments/btc-eth-alert-edge/results/paper-dashboard.md`
- Internal synthesis into RALPH notes only when it changes alert gating, setup trust, or validation decisions.

Stop conditions:

- Public data source fails repeatedly for more than 48 hours.
- Backtest outputs become inconsistent with paper-trade observations.
- Existing tools/datasets clearly cover the same need better than the custom layer; pivot to adapter/benchmark mode.
- Tomas asks to pause or disable the loop.
- Any step would require exchange keys, wallet keys, paid APIs, live order placement, or account setup.

Forbidden:

- Live execution.
- Financial advice language.
- Exchange keys, wallet keys, cookies, or private account data.
- Paid APIs or paid infrastructure without separate approval.
- Testnet/demo exchange accounts or API keys without separate explicit approval.

Alert integration rule:

Any user-visible alert change requires explicit Tomas approval before implementation or enablement. This includes new assets, setup labels, event-vs-trading taxonomy, evidence blocks, thresholds, cooldowns, delivery gates, and wording that makes an alert more or less tradable.

When an alert mentions BTC or ETH, include a short edge block from the latest snapshot. Prefer tiers and expectancy over fake precision. Mark low-sample buckets clearly.

When an alert mentions SOL, HYPE, or another alt, first include why the asset is in the selected universe now: venue coverage, liquidity, movement/event reason, data-source gaps, and whether setup stats are mature or low-sample.

Reuse rule:

Before adding setup families, data rails, or a more complex backtest engine, check whether Freqtrade, vectorbt, NautilusTrader, CCXT, Binance public archives, Hyperliquid public APIs, Dune-style dashboards, public GitHub repos, or published research already provide the needed layer.
