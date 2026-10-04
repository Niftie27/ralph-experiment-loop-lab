---
type: comparison
name: Liquidation Map Build vs Buy
sources:
  - raw/liquidation-map-liquidity-provision-2026-07-01.md
  - raw/liquidation-map-prior-art-gap-map-2026-07-01.md
  - raw/liquidation-q1-baseline-kill-switch-2026-07-01.md
related:
  - wiki/concepts/liquidation-map-liquidity-provision.md
  - wiki/comparisons/existing-tools-vs-custom-ralph-layer.md
  - wiki/sources/liquidation-map-prior-art-gap-map-2026-07-01.md
  - wiki/sources/liquidation-q1-baseline-kill-switch-2026-07-01.md
created: 2026-07-01T23:25:00Z
last_updated: 2026-07-01T23:59:00Z
---

# Liquidation Map Build vs Buy

| Option | What it gives | What it may not give | RALPH stance |
| --- | --- | --- | --- |
| CoinGlass / Kiyotaka / TradingDifferent / Datawallet | ready liquidation heatmap UI | raw export, replay, custom rules, exact methodology, passive-order simulation | inspect first; do not rebuild UI |
| 0xArchive / Allium / indexed providers | liquidation event data and context | cost, coverage, export limits, exact cluster model, predicted-level heatmap | inspect if available; likely better for replay than UI-only tools |
| Hyperliquid info endpoint + address universe | user `liquidationPx` and positions | global address discovery, scaling, rate limits | feasible spike, not assumed |
| Custom RALPH map | full control, portfolio artifact, custom replay | build cost, data completeness, maintenance, false edge risk | only after prior-art gap map |

## Decision Rule

Do not build a liquidation map just because it is interesting.

Also do not spend a full product-comparison loop before the strategy survives the cheap Q1 test.

First answer:

- do liquidation/cascade events produce replay-positive bounce EV after conservative costs?
- does that liquidation-aware rule beat simple candle/drawdown reversal baselines?

If no, stop. The heatmap is context, not alpha.

Build only if existing tools cannot answer:

- where clusters are;
- how they change over time;
- whether passive bids/offers around them would have worked after fees and adverse selection;
- whether replay data is exportable enough for Tomas-specific validation.

## Corrected Gap

The map itself is not obviously missing. Retail/prosumer liquidation heatmaps and APIs exist.

The possible RALPH gap is narrower:

- exportable historical data rather than live-only UI;
- predicted liquidation levels versus actual liquidation events;
- transparent enough methodology to avoid cargo-culting a proprietary visualization;
- replay harness for passive orders around clusters;
- adverse excursion, missed fill, partial fill, and tail-loss accounting;
- comparison against simpler baselines such as volatility/liquidity rules.

If existing products provide these cheaply, RALPH should use them. If they provide only the visual map, RALPH should build the adapter/scorer, not another dashboard.

## Why It May Be Missing

Do not assume "missing" means "edge."

Possible explanations:

- heatmaps are useful discretionary context but not standalone alpha;
- clusters can attract continuation instead of reversal;
- public levels become crowded;
- negative skew dominates the average result;
- historical export/replay is paid or rate-limited;
- the signal is mostly leverage/volatility beta.

The next loop must decide which explanation fits.
