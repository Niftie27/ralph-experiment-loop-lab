---
type: source
name: Liquidation-Map Liquidity Provision
sources:
  - raw/liquidation-map-liquidity-provision-2026-07-01.md
related:
  - wiki/concepts/liquidation-map-liquidity-provision.md
  - wiki/comparisons/liquidation-map-build-vs-buy.md
created: 2026-07-01T23:25:00Z
last_updated: 2026-07-01T23:25:00Z
---

# Liquidation-Map Liquidity Provision

## Summary

This source records the "be the house" strategy inversion:

> Instead of copying smart money, provide passive liquidity around forced-flow/liquidation clusters.

The branch is promising as a RALPH candidate because it is:

- patient;
- passive;
- no-key feasible at research stage;
- differentiated as a data/visualization artifact;
- structurally different from copy-trading.

## Critical Correction

Hyperliquid user state can expose `liquidationPx`, but a complete global liquidation map still needs address-universe discovery, indexing, or an existing data product. Do not assume one official endpoint returns a full global heatmap.

## Main Caveat

This branch has negative skew.

It may win often by catching cascade overshoots, but lose badly when the cascade is a genuine trend move. Position sizing, exposure caps, and regime filtering are core to the strategy.

