# Strategy Filter Drift Report

Generated: 2026-09-28T14:55:48.632Z
Baseline: 2026-09-13T06:33:46.939Z (wiki/notes/2026-09-13-strategy-filter-survivor-shape-reporting.md)
Current: 2026-09-28T14:55:22.006Z

## Totals Drift

- candidates: 13 -> 13 (+0)
- variants: 131 -> 131 (+0)
- survivors: 2 -> 0 (-2)
- survivorShapes: 1 -> 0 (-1)
- rejected: 129 -> 131 (+2)

## Shape Status Changes

### alert-edge-avax-range-breakdown-short-v0|shape-1

- Representative: alert-edge-avax-range-breakdown-short-v0#1
- Status: survived_research_gate -> rejected
- Current failures: weak_walk_forward_out_of_sample
- Current metrics: sample=217, expectancy=0.1815R, profitFactor=1.3052, deflatedSharpe=1.5665
- OOS: sample=78, expectancy=0.0761R, baselineLift=0.0875R
- Walk-forward: positiveFolds=4/5, positiveOosFolds=1

## Gate Group Comparison

- unavailable: baseline lacks compatible gateGroupDiagnostics

## Decision

- Verdict: zero_survivor_shapes_no_promotion
- No threshold change: yes
- Promotion changed: no
- Next action: Keep strict gates; use drift report to audit survivor/watch downgrades before considering any threshold change.

Generated local drift outputs only; no live trading, orders, exchange mutation, keys, paid APIs, alert wording, thresholds, sizing, TP/SL, execution behavior, scheduler cadence, or strategy promotion changed.

