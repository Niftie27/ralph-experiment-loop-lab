# Liquidation Q1 Baseline Kill Switch

Status: `active`, blocked on live historical liquidation credentials for a real run.

This experiment tests one question before any liquidation-map build:

> Do liquidation cascade reversal entries beat dumb candle/drawdown reversal baselines after conservative costs and tail loss checks?

Canonical spec source: `raw/liquidation-q1-baseline-killswitch-spec-2026-07-02.md`.

## Verified Source Constraints

- Hyperliquid native `candleSnapshot` is not enough for long replay windows: official docs say only the most recent 5000 candles are available.
- Hyperliquid historical S3 is not a complete candle/liquidation research API: official docs say S3 has L2 book snapshots and asset contexts; node fills exist separately, but candles are not provided in that archive.
- 0xArchive currently exposes route contracts for `/v1/hyperliquid/liquidations/{symbol}` and `/v1/hyperliquid/candles/{symbol}` with `start`, `end`, `cursor`, and `limit`. Its public pricing page says Free has full endpoint coverage, full history, 90-day query windows, 50k credits/month, and no exports.
- 0xArchive still requires an API key. The current runtime has no `OXARCHIVE_API_KEY`, so only fixture verification was run here.

Sources:

- Hyperliquid `candleSnapshot`: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
- Hyperliquid historical data: https://hyperliquid.gitbook.io/hyperliquid-docs/historical-data
- 0xArchive OpenAPI: https://docs.0xarchive.io/openapi.json
- 0xArchive pricing: https://0xarchive.io/pricing

## Commands

Run the deterministic fixture:

```bash
npm test --prefix ralph-research-os/experiments/liquidation-q1-baseline-kill-switch
```

Preflight local/live prerequisites:

```bash
node ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/src/q1-harness.mjs preflight
```

Fetch a bounded historical window after adding an API key:

```bash
OXARCHIVE_API_KEY=... node ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/src/q1-harness.mjs fetch \
  --symbol BTC,ETH,SOL \
  --start 2026-06-01T00:00:00Z \
  --end 2026-07-01T00:00:00Z \
  --interval 5m \
  --out ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/data/major-2026-06
```

Run the Q1 gate:

```bash
node ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/src/q1-harness.mjs run \
  --candles ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/data/major-2026-06/candles.json \
  --liquidations ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/data/major-2026-06/liquidations.json \
  --out ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/results/major-2026-06.json
```

## Spec Conformance

Implemented:

- relative cascade trigger: current point-in-time window must exceed a rolling liquidation-notional baseline;
- no post-entry cascade lookahead: a signal is emitted only when the running window crosses the threshold;
- same passive-limit replay machinery for liquidation signals and dumb baselines;
- missed fills are counted as zero-return opportunities, not dropped;
- partial fills reduce return exposure;
- costs include fee plus slippage/spread bps per side;
- report includes fill rate, median/tail/worst return, no-top-outlier PnL, worst clustered day, volatility-proxy correlation, and cross-asset cascade clustering when multi-symbol data is provided.

Still intentionally rough:

- partial-fill modelling is conservative and candle-based, not order-book accurate;
- volatility/beta check is a correlation proxy, not a full regression model yet;
- holdout discipline is represented in config, but this CLI does not optimize thresholds, so there is no automated train/holdout search loop.

## Decision Rule

Proceed to Q2 only if all are true:

- liquidation-aware rule has positive mean EV after fees/slippage;
- it beats both dumb baselines by at least `minEdgeBps` and on `riskAdjustedScore`;
- worst trade and 5th-percentile tail are not worse than the allowed tail thresholds;
- PnL still survives removing the top outlier wins;
- worst clustered-loss day does not breach the configured threshold;
- the signal is not merely a high-correlation volatility proxy.

Otherwise discard the liquidation-map build path or keep it radar-only.
