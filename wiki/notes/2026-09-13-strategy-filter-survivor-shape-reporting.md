---
type: note
created: 2026-09-13T06:34:18Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-09-13-strategy-filter-post-gate-survivor-concentration-audit.md
sources:
  - ../../experiments/strategy-destruction-filter/src/run-filter.mjs
  - ../../experiments/strategy-destruction-filter/src/verify-filter.mjs
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
---
# Strategy Filter Survivor Shape Reporting

Bounded work item: `validation.strategy-filter-survivor-shape-reporting`.

## Why

The post-gate survivor concentration audit found that the current filter had `2` raw survivors but only `1` effective survivor shape. Both surviving AVAX variants share identical realized metrics and differ only by `rsiMaxShort` (`45` vs `50`).

Raw survivor counts can therefore overstate independent evidence when parameter variants produce identical trades and diagnostics.

## Change

Added `survivorShapes` to `results/filter-report.json` and a `Survivor Shape Diagnostics` section to `results/filter-report.md`.

The grouping key uses:

- candidate identity and family;
- realized stats;
- chronological split stats;
- baseline comparison;
- walk-forward diagnostics;
- worst slices.

Each shape records:

- `shapeId`;
- raw survivor `variantIds`;
- `rawSurvivorCount`;
- representative variant;
- duplicate parameter differences;
- headline metrics.

## Current Result

Fresh report generated at `2026-09-13T06:33:46.939Z`:

- candidates: `13`
- variants: `131`
- raw survivors: `2`
- effective survivor shapes: `1`
- rejected: `129`

Current effective survivor shape:

- `alert-edge-avax-range-breakdown-short-v0|shape-1`
- raw variants: `#1`, `#2`
- duplicate parameter difference: `rsiMaxShort` (`45` vs `50`)
- sample: `216`
- expectancy: `0.1879R`
- profit factor: `1.3175`
- deflated-Sharpe proxy: `1.6214`
- max drawdown: `10.1373R`
- out-of-sample expectancy: `0.0927R`
- out-of-sample baseline lift: `0.125R`

## Verification

- `node --check src/run-filter.mjs` passed.
- `node --check src/verify-filter.mjs` passed.
- `npm run filter` passed and regenerated the filter report.
- `npm run verify` passed.
- `npm test` passed 29 tests.
- `node automation/state-of-edge-report.mjs` passed with `no_trade_negative_edge`.
- `node automation/evidence-ledger-prioritizer.mjs` passed with `0` pending and `0` ready-now.
- `node automation/research-validation-checklist.mjs` remains expected `warn`: retrieval/pathRefs/queues/delivery/HITL/loop/handoff/boundary pass; paperDemo remains not-ready.

## Decision

Future strategy-filter summaries should distinguish `raw survivors` from `effective survivor shapes`.

AVAX remains Watch / forward-paper-needed. This change does not promote any strategy and does not alter live alerts, thresholds, scheduler cadence, execution behavior, data capture, account/key/API access, or public posting.
