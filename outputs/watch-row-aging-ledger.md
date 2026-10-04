# Watch-Row Aging Ledger

Generated: 2026-10-03T16:10:20.747Z

Status: research-paper-watch-row-aging-ledger

Verdict: watch_rows_include_decay_no_promotion

Source state-of-edge: 2026-10-03T16:03:58.588Z (no_trade_watch_low_sample)

## Summary

- Active watch rows: 4
- Decaying before sample gate: 1
- Sample-gate reached rows: 0
- Min active sample gap: 30
- Oldest active age: 0 days
- By state: aging_low_sample_watch=3, decaying_before_sample_gate=1, not_seen_current=3

## Rows

- ADA|1h|momentum_reversal_long|long|range/mid-vol: aging_low_sample_watch, age=0.0000d, sample=20/50, exp=0.4108R, PF=1.8408, baselineLift=0.5059R, paper=0 closed / n/a avg.
- ADA|4h|trend_pullback_reject_short|short|down/high-vol: aging_low_sample_watch, age=0.0000d, sample=18/50, exp=0.2021R, PF=1.4983, baselineLift=0.1244R, paper=1 closed / 1.8000R avg.
- BNB|4h|trend_pullback_reclaim_long|long|up/low-vol: aging_low_sample_watch, age=0.0000d, sample=15/50, exp=0.6927R, PF=2.8385, baselineLift=0.7492R, paper=0 closed / n/a avg.
- SOL|1h|momentum_reversal_long|long|range/mid-vol: decaying_before_sample_gate, age=0.0000d, sample=12/50, exp=0.0991R, PF=1.1819, baselineLift=0.2193R, paper=1 closed / -1.0000R avg.
- ADA|4h|momentum_reversal_long|long|range/mid-vol: not_seen_current, age=0.2100d, sample=24/50, exp=0.1215R, PF=1.2588, baselineLift=0.2654R, paper=0 closed / n/a avg.
- AVAX|4h|trend_pullback_reject_short|short|down/high-vol: not_seen_current, age=0.1000d, sample=15/50, exp=0.2378R, PF=1.4881, baselineLift=0.1680R, paper=0 closed / n/a avg.
- LINK|4h|trend_pullback_reclaim_long|long|up/mid-vol: not_seen_current, age=0.2100d, sample=35/50, exp=0.0594R, PF=1.1084, baselineLift=0.1361R, paper=4 closed / 0.4000R avg.

## Decision

Watch rows are tracked as paper/research inventory only; aging, sample progress, and decay are visibility signals, not promotion gates.

## Boundary

Research/paper sidecar only. No live orders, scheduler changes, alert wording changes, paper alert logic changes, thresholds, sizing, TP/SL, execution behavior, or strategy promotion changed.
