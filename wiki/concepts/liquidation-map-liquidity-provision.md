---
type: concept
name: Liquidation-Map Liquidity Provision
sources:
  - raw/liquidation-map-liquidity-provision-2026-07-01.md
related:
  - wiki/concepts/patient-retail-strategy-map.md
  - wiki/concepts/tool-first-not-build-first.md
created: 2026-07-01T23:25:00Z
last_updated: 2026-07-01T23:25:00Z
---

# Liquidation-Map Liquidity Provision

Liquidation-map liquidity provision is a patient-retail strategy candidate built around forced flows.

The idea:

1. Map where leveraged positions are likely to liquidate.
2. Identify dense clusters.
3. Place passive liquidity beyond or around forced-flow levels.
4. Capture overshoot/reversion after price-insensitive liquidation pressure.

## Why It Fits Tomas

- It is not fast copy-trading.
- It can be researched without keys or live capital.
- It uses data-engineering skill more than prediction.
- It can become a visible portfolio artifact: liquidation map, replay, and simulator.

## What Must Be Verified

- Whether existing liquidation maps are good enough.
- Whether raw Hyperliquid data can recreate enough of the map.
- Whether the edge survives fees, spread, missed fills, and adverse selection.
- Whether cascade/reversion can be separated from real trend continuation.

## Risk Model

The strategy is negative-skew:

- many small reversion wins;
- rare large losses when price keeps trending.

Therefore risk controls are not optional:

- tiny per-level position sizing;
- max correlated exposure;
- kill switch during macro/news shock;
- stop or invalidation logic;
- no live capital before replay/paper evidence.

