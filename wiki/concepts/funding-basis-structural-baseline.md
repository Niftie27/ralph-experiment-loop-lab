---
type: concept
name: Funding Basis Structural Baseline
sources:
  - raw/patient-retail-strategy-map-2026-07-01.md
related:
  - wiki/concepts/patient-retail-strategy-map.md
  - wiki/notes/2026-07-01-wallet-shadowing-next-direction.md
created: 2026-07-01T22:50:00Z
last_updated: 2026-07-01T22:50:00Z
---

# Funding Basis Structural Baseline

Funding-rate / basis harvesting is the main structural branch for patient retail.

The simple form is:

> long spot + short perp, collect funding while staying roughly delta-neutral.

## Why It Fits Tomas

It does not require predicting direction or racing information.

The edge, if present, accrues over time from market structure: crowded leverage pays funding to the other side.

## Why It Is Not Risk-Free

Funding/basis can fail through:

- yield compression;
- funding flipping negative;
- liquidation risk on the perp leg;
- basis widening during stress;
- stablecoin depeg;
- venue/counterparty risk;
- rebalancing and execution costs.

Delta-neutral is not the same as safe.

## RALPH Role

Use this branch as:

- a no-prediction baseline;
- a comparison floor for smart-money alpha;
- a possible first practical monitor because it is easier to reason about than copy trading.

## Detection Problem

Detecting structural wallets from public data is harder than detecting directional positions because the book may be hedged across venues.

For M1, RALPH should first answer:

- what funding/basis data is publicly available;
- whether wallet-level detection is feasible;
- whether a simple market-level monitor is more realistic than wallet-level shadowing.

