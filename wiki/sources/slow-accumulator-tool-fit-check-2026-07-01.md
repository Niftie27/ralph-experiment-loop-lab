---
type: source
name: Slow Accumulator Tool Fit Check
sources:
  - raw/slow-accumulator-tool-fit-check-2026-07-01.md
related:
  - wiki/comparisons/slow-accumulator-tool-fit-map.md
  - wiki/concepts/smart-money-accumulation-cohort.md
created: 2026-07-01T23:15:00Z
last_updated: 2026-07-01T23:15:00Z
---

# Slow Accumulator Tool Fit Check

## Summary

This source checks which existing tools actually fit slow mid-cap spot accumulator following.

The main conclusion:

> The slow accumulator signal most likely lives in Nansen / Arkham / Dune-style on-chain analytics, not in Copin-style perp copy-trading platforms.

## Tool Ranking

1. Nansen: primary candidate for smart-money accumulation and cohort discovery.
2. Arkham: wallet/entity enrichment and address validation.
3. Dune: custom SQL/API historical extraction.
4. Copin/HyperX: perp copy-trading prior art, not slow spot source.
5. Freqtrade: validation/execution engine, not signal source.
6. Tenderly/EigenPhi: later specialty tools for simulation/MEV, not this branch.

## RALPH Implication

The next tool-first loop should not evaluate "copy-trading" generally.

It should ask:

> Can Nansen plus Arkham plus Dune produce a slow mid-cap accumulator cohort that can be frozen and forward-tested?

