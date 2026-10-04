---
type: note
name: Liquidation Map Feasibility Spec
sources:
  - raw/liquidation-map-liquidity-provision-2026-07-01.md
  - raw/liquidation-map-prior-art-gap-map-2026-07-01.md
  - raw/liquidation-q1-baseline-kill-switch-2026-07-01.md
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - wiki/concepts/liquidation-map-liquidity-provision.md
  - wiki/comparisons/liquidation-map-build-vs-buy.md
  - wiki/sources/liquidation-map-prior-art-gap-map-2026-07-01.md
  - wiki/sources/liquidation-q1-baseline-kill-switch-2026-07-01.md
created: 2026-07-01T23:35:00Z
last_updated: 2026-07-01T23:59:00Z
---

# Liquidation Map Feasibility Spec

This is a no-key feasibility spec for the liquidation-map liquidity provision branch.

It is not a live trading plan.

It is also not a justification to build a generic liquidation heatmap. After Tomas's correction, this spec must be gated by prior-art and product-gap verification.

After Tomas's second correction, the first gate is even narrower:

> Q1: do liquidation/cascade events produce a replay-positive bounce edge after costs, and does that edge beat dumb candle/drawdown baselines?

If Q1 fails, broad product gap mapping is unnecessary.

## Goal

Answer:

> Can passive liquidity around liquidation clusters produce a replay-positive edge after fees, spread, missed fills, adverse selection, and tail losses?

## Data Inputs

### Tool-First Inputs

For the first Q1 test, inspect existing products only to find the cheapest historical liquidation-event source:

- CoinGlass Hyperliquid liquidation map;
- Kiyotaka Hyperliquid liquidation heatmaps;
- TradingDifferent liquidation heatmap;
- 0xArchive / Allium / other indexed data providers.

For each, check:

- export/API availability;
- asset coverage;
- historical event or level availability;
- predicted-level heatmap versus actual liquidation-event feed;
- whether enough candle/price data is available for a small replay;
- cost.

Full heatmap methodology comparison is Q2, only after Q1 beats baselines.

### Raw Hyperliquid Inputs

Only if existing products are insufficient:

- public market data / candles;
- order book snapshots if available;
- liquidation events if available through public or indexed sources;
- `clearinghouseState` for known user addresses;
- discovered address universe from public leaderboards, fills, vaults, or data providers.

Critical limitation:

> `liquidationPx` is useful per known user, but a global map requires an address universe or indexed provider.

## Cluster Construction

For each asset/time snapshot:

1. Collect positions with side, size, leverage/margin, and `liquidationPx` where available.
2. Convert each position into estimated forced-flow notional at liquidation price.
3. Bucket liquidation prices into percentage bands around spot, e.g. 0.25%, 0.5%, or ATR-scaled bins.
4. Compute cluster mass:
   - total notional;
   - side imbalance;
   - distance from current price;
   - cluster density versus recent baseline;
   - proximity to support/resistance or recent wick zones.
5. Flag only clusters large relative to:
   - recent volume;
   - order book depth;
   - realized volatility;
   - average liquidation event size.

## Passive Paper Strategy

For a downside long-liquidity test:

1. If a large long-liquidation cluster sits below spot, place simulated passive bids below or around the cluster.
2. Fill only if replayed price trades through the limit level.
3. Exit rules:
   - fixed bounce target;
   - time stop;
   - volatility-adjusted stop;
   - trend-continuation invalidation.
4. Charge:
   - maker/taker fees;
   - spread;
   - missed fills;
   - partial fills;
   - slippage / adverse selection.

Mirror the logic for upside short-liquidity tests only in paper.

## Replay Metrics

Measure:

- fill rate;
- average adverse excursion after fill;
- max adverse excursion;
- bounce probability;
- median bounce size;
- time to bounce;
- tail loss distribution;
- expected value after fees;
- PnL by volatility regime;
- PnL by market trend regime;
- PnL excluding top outlier wins;
- worst clustered-loss day;
- correlation across assets during cascade.

## Baseline Kill Switch

Before using cluster-aware logic as signal, test against dumb baselines with the same costs, exits, stops, and risk controls:

1. Buy after large red candle / sell after large green candle.
2. Buy after X% drawdown from rolling high / sell after X% rally from rolling low.
3. Optional: realized-volatility percentile reversal rule.

If liquidation-aware entries do not beat these baselines, the map is probably a volatility/drawdown proxy and the branch should be demoted or discarded.

## Falsification Rules

Discard or demote if:

- existing tools already provide the map and replay export cheaply;
- existing products provide the useful layer and RALPH would only duplicate a dashboard;
- cluster map cannot be built without paid/closed data;
- most profit comes from rare outlier bounces;
- one trend day wipes out many normal wins;
- edge disappears after realistic fill assumptions;
- cluster signal is just a proxy for volatility/beta;
- risk controls dominate so much that return falls below staking/basis baseline.

## Minimal No-Key Loop

0. Run `liquidation-q1-baseline-kill-switch`.
1. Find the cheapest historical liquidation-event source.
2. Collect a small historical sample of liquidation cascade days manually or through free export.
3. Simulate passive levels around event/cascade zones.
4. Compare against dumb candle/drawdown baselines.
5. Only if Q1 passes, run broader `liquidation-map-prior-art-gap-map`.
6. Produce a decision memo:
   - build custom map;
   - build only adapter/scorer;
   - use existing tool;
   - keep as visual/radar only;
   - discard.

## Risk Boundary

No live orders, no exchange keys, no wallet keys, no leverage, and no recurring watcher until Tomas explicitly approves a later phase.
