# Walk-Forward Near-Miss Sidecar

Generated: 2026-09-28T15:14:20.120Z

Status: research-only-walk-forward-near-miss-sidecar

Source filter report: 2026-09-28T14:55:22.006Z

Verdict: near_misses_visible_no_threshold_change

## Summary

- Near misses: 6
- By family: alert_edge_breakdown=6
- By symbol: AVAX=6
- Best OOS expectancy among near misses: 0.0761R
- Weakest fold expectancy among near misses: -0.1912R

## Near Misses

- alert-edge-avax-range-breakdown-short-v0#1: AVAX 1h breakout down/low-vol; OOS 0.0761R, PF 1.1181, walk-forward OOS 1/2; weak diagnostic folds: f5 -0.0043R.
- alert-edge-avax-range-breakdown-short-v0#2: AVAX 1h breakout down/low-vol; OOS 0.0761R, PF 1.1181, walk-forward OOS 1/2; weak diagnostic folds: f5 -0.0043R.
- alert-edge-avax-range-breakdown-short-v0#3: AVAX 1h breakout down/low-vol; OOS 0.0719R, PF 1.1113, walk-forward OOS 1/2; weak diagnostic folds: f5 -0.1912R.
- alert-edge-avax-range-breakdown-short-v0#4: AVAX 1h breakout down/low-vol; OOS 0.0719R, PF 1.1113, walk-forward OOS 1/2; weak diagnostic folds: f5 -0.1912R.
- alert-edge-avax-range-breakdown-short-v0#5: AVAX 1h breakout down/low-vol; OOS 0.0556R, PF 1.0852, walk-forward OOS 1/2; weak diagnostic folds: f5 -0.1157R.
- alert-edge-avax-range-breakdown-short-v0#6: AVAX 1h breakout down/low-vol; OOS 0.0556R, PF 1.0852, walk-forward OOS 1/2; weak diagnostic folds: f5 -0.1157R.

## Decision

Variants clear the other current gates but still fail the late-fold OOS diagnostic, so the right action is visibility, not gate relaxation.

## Boundary

Research-only sidecar. No live orders, alert wording changes, thresholds, sizing, TP/SL, execution behavior, scheduler changes, or strategy promotion changed.
