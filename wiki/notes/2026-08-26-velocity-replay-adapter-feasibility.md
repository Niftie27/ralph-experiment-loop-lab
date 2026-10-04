---
type: research-note
date: 2026-08-26
tags:
  - ralph
  - volume-velocity
  - replay-adapter
  - strategy-destruction-filter
related:
  - 2026-08-25-profitability-loop-integration-map.md
  - 2026-08-21-alert-feedback-data-analysis.md
  - ../concepts/strategy-destruction-filter.md
sources:
  - ../../experiments/strategy-destruction-filter/results/velocity-replay-adapter-feasibility.json
  - ../../experiments/strategy-destruction-filter/results/aggtrades-velocity-event-study.json
  - ../../../crypto-updates/runtime/alert-feedback.jsonl
  - ../../../crypto-updates/runtime/setup-candle-context-cache.json
  - ../../../crypto-updates/realtime-market-watcher.mjs
---

# Velocity Replay Adapter Feasibility

Status: research-only bounded feasibility pass. No live trading, orders, exchange keys, wallet keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution behavior changed.

## Question

Can the killed ETH volume-velocity proxy be improved with a 1m/no-key replay adapter before adding another strict candidate?

## Result

Verdict: build a public Binance `aggTrades` replay adapter before any new volume-velocity candidate. Do not treat 1m candles as exact watcher replay.

The watcher computes `volumeVelocityRatio` from a 5-second recent notional bucket compared with the previous 5 minutes split into 5-second slots. A 1m OHLCV cache can sanity-check coarse price direction and context, but it compresses twelve 5-second slots into one row and cannot reconstruct the actual trigger slot, intraminute ordering, or 5-second notional ratio.

## Local Report

Generated `experiments/strategy-destruction-filter/results/velocity-replay-adapter-feasibility.json` and `.md` via `npm run assess:velocity-replay`.

Totals:

- velocity reviews: `146`
- included after strict quality exclusions: `144`
- excluded by strict quality: `2`
- rows with cached 1m candle coverage: `3`
- coarse 1m same-sign moves: `3`
- rows needing Binance public `aggTrades` for exact volume-velocity replay: `54`

## Data-Access Boundary

Accessible now:

- local alert feedback JSONL;
- local public 1m candle context cache;
- public/no-key Binance `aggTrades` is proposed for exact Binance replay.

Not established as active:

- historical HYPE trade/book replay;
- historical fresh-book reconstruction from candles or trades.

Fresh book evidence must come from recorded alert-time live depth features or a live/public depth capture. It cannot be rebuilt from 1m candles or Binance `aggTrades`.

## Decision

The prior `alert-feedback-eth-velocity-fade-v0` remains killed by the destruction filter. Do not add another strict volume-velocity candidate from the same evidence yet.

Next useful bounded step: implement a research-only Binance public `aggTrades` adapter that reconstructs:

1. 5-second recent notional;
2. previous-5-minute 5-second average slot notional;
3. 60s/5m/15m price move from millisecond trades;
4. exact replay comparison to recorded watcher fields for BTC/ETH/SOL/XRP alerts.

Keep HYPE as event-only movement taxonomy until historical Hyperliquid trade/book access is verified.

## Binance AggTrades Replay Pass

Follow-up bounded implementation added `experiments/strategy-destruction-filter/src/replay-binance-aggtrades-velocity.mjs` and `npm run replay:aggtrades`.

The script fetches only public/no-key Binance `aggTrades` windows around existing finalized Binance velocity alerts, caches them under `data/aggtrades-cache/`, and compares reconstructed fields to recorded watcher fields:

- trigger price move from last trade at or before `eventTime - triggerWindow` to last trade at or before `eventTime`;
- 5-second recent notional;
- prior 5-minute average 5-second slot notional;
- volume velocity ratio.

Replay result:

- Binance velocity rows replayed: `54`
- replay OK: `54`
- fetch failures: `0`
- exact watcher-field matches within tolerance: `29`
- usable bucket rows: `29`
- report verdict: `exact_replay_rows_available_for_bucket_selection`

Top replay-clean buckets:

- `ETH|5m|UP|follow-useful`: `N=4`, avg replay velocity `2.8529`, avg move `+0.9176%`
- `ETH|60s|DOWN|fade-useful`: `N=4`, avg replay velocity `8.2763`, avg move `-0.6599%`
- `ETH|5m|DOWN|fade-useful`: `N=2`, avg replay velocity `2.3853`, avg move `-0.9016%`
- `SOL|15m|DOWN|fade-useful`: `N=2`, avg replay velocity `4.6540`, avg move `-1.6612%`

Interpretation: exact public replay is now feasible for Binance velocity alerts, but the replay-clean buckets are still too small for promotion. The previous ETH 60s DOWN fade bucket is confirmed as replay-clean at `N=4`, but its strict OHLCV proxy candidate was already killed by the destruction filter. The next candidate should not be a broad OHLCV proxy; it should either wait for more replay-clean forward samples or use a replay-clean event-study adapter with a strict low-sample kill gate.

## AggTrades Event-Study Gate

Follow-up bounded implementation added `experiments/strategy-destruction-filter/src/run-aggtrades-velocity-event-study.mjs` and `npm run study:aggtrades-velocity`.

The study consumes `results/binance-aggtrades-velocity-replay.json` only. It does not refetch data. It uses replay-clean rows where `replay.usableForBucket === true`, groups by asset, trigger label, direction, and velocity band, and reports verdict mix, recorded 30m/1h directional move distributions, replay trigger-move and velocity-ratio distributions, aggressive buy-share distributions, and exact row IDs.

Gate settings:

- minimum sample for candidate: `10`
- minimum dominant verdict share: `0.75`
- same strict-filter mechanism blocked without new data: `true`

Event-study result:

- usable replay-clean rows: `29`
- primary buckets: `13`
- velocity-band buckets: `18`
- candidate-ready buckets: `0`
- decision: `watch_low_sample`
- strict candidate added: `false`

Top primary event-study buckets:

- `ETH|5m|UP`: `N=5`, dominant `follow-useful` share `0.80`, 30m avg `+1.3865%`, 1h avg `+2.2869%`, replay velocity avg `2.9411`
- `ETH|60s|DOWN`: `N=5`, dominant `fade-useful` share `0.80`, 30m avg `-0.4112%`, 1h avg `-0.4324%`, replay velocity avg `7.8514`
- `ETH|5m|DOWN`: `N=3`, dominant `fade-useful` share `0.6667`, 30m avg `-0.4606%`, 1h avg `-0.7355%`, replay velocity avg `9.2829`
- `SOL|15m|DOWN`: `N=2`, dominant `fade-useful` share `1.00`, 30m avg `-1.2250%`, 1h avg `-0.7675%`, replay velocity avg `4.6540`

Interpretation: exact Binance public replay remains useful, but current replay-clean buckets are still too small for a defensible strategy candidate. The ETH 60s DOWN fade bucket is also blocked as the same mechanism that already failed the strict destruction filter via `alert-feedback-eth-velocity-fade-v0`, absent new data.

## Verification

Passed:

- `npm run assess:velocity-replay --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm run replay:aggtrades --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm run study:aggtrades-velocity --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm run validate:candidates --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`
