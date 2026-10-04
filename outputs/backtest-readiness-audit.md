# Backtest Readiness Audit

Generated: 2026-09-27T17:38:46.468Z

Verdict: ready_for_research_only_validation

## Checks

- PASS chronological-split: Uses a chronological entry-time split anchor.
- PASS walk-forward-diagnostics: Every variant has walk-forward diagnostics.
- PASS baseline-comparison: Uses deterministic time-matched baseline.
- PASS multiple-testing-penalty: Reports approximate multiple-testing deflated-Sharpe proxy.
- PASS gate-group-diagnostics: Reports grouped pass pressure.
- PASS survivor-shape-dedup: Deduplicates equivalent survivor shapes.
- PASS positive-oos-gate: Requires positive out-of-sample expectancy.
- PASS baseline-lift-gate: Requires lift over baseline.
- PASS planned-level-btc-gate: Orderflow/planned-level rows require explicit BTC gate.
- PASS planned-level-sample-gates: Orderflow proxy has frozen-event and trade-window sample gates.
- PASS purged-embargo-split: Implements explicit purged/embargo split accounting for overlapping labels.

## Next Actions

- purged-embargo-split-design: Keep explicit purged/embargo split accounting active before promoting overlapping intraday/orderflow labels. (active_guard)
- cost-assumption-surface: Keep fees/slippage/funding/spread assumptions visible in every strategy report. (active_guard)
- baseline-always-on: Every candidate must continue to beat a time-matched baseline and pass OOS baseline lift. (active_guard)

## Boundary

Audit only; no live trading, thresholds, scheduler, alert wording, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed.
