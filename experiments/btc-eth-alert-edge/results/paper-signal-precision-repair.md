# Paper Signal Precision Repair

Generated: 2026-10-04T08:04:29.910Z
Source: `paper/signals.json`

Status: `complete`

This report repairs rounded paper-signal entry/stop/target levels by reconstructing them from cached entry candles and ATR14. It is research-only and does not change live execution, exchange keys, schedulers, TradingView automation, alert wording, thresholds, watchers, risk/sizing, or strategy promotion.

## Summary

| Before Bad Risk | After Bad Risk | Repaired | Skipped |
| ---: | ---: | ---: | ---: |
| 0 | 0 | 66 | 0 |

## Repairs By Symbol And Timeframe

| Group | Repaired |
| --- | ---: |
| DOGE:4h | 34 |
| DOGE:1h | 15 |
| ADA:1h | 11 |
| ADA:4h | 6 |

## Sample Repairs

| ID | Old Entry | Old Stop | New Entry | New Stop | Risk After |
| --- | ---: | ---: | ---: | ---: | ---: |
| DOGE:1h:range_breakout_long:1790020800 | 0.10018 | 0.09739343 | 0.10018 | 0.09739343 | 2.8% |
| DOGE:4h:range_breakout_long:1790006400 | 0.09854 | 0.095306 | 0.09854 | 0.095306 | 3.3% |
| DOGE:4h:range_breakout_long:1789992000 | 0.09733 | 0.09433857 | 0.09733 | 0.09433857 | 3.1% |
| ADA:4h:range_breakout_long:1789992000 | 0.2448 | 0.23679429 | 0.2448 | 0.23679429 | 3.3% |
| DOGE:4h:range_breakout_long:1789977600 | 0.09336 | 0.09071314 | 0.09336 | 0.09071314 | 2.8% |
| DOGE:1h:momentum_reversal_short:1789934400 | 0.08735 | 0.08831171 | 0.08735 | 0.08831171 | 1.1% |
| ADA:1h:momentum_reversal_short:1789934400 | 0.227 | 0.23078 | 0.227 | 0.23078 | 1.7% |
| DOGE:4h:trend_pullback_reclaim_long:1789920000 | 0.08738 | 0.08506914 | 0.08738 | 0.08506914 | 2.6% |
| DOGE:4h:trend_pullback_reclaim_long:1789905600 | 0.08582 | 0.083462 | 0.08582 | 0.083462 | 2.7% |
| DOGE:4h:range_breakout_long:1789819200 | 0.08894 | 0.08681257 | 0.08894 | 0.08681257 | 2.4% |
| DOGE:4h:momentum_reversal_short:1789790400 | 0.0867 | 0.08864229 | 0.0867 | 0.08864229 | 2.2% |
| DOGE:4h:momentum_reversal_short:1789761600 | 0.08747 | 0.08939171 | 0.08747 | 0.08939171 | 2.2% |
| DOGE:4h:range_breakout_long:1789732800 | 0.08751 | 0.08555229 | 0.08751 | 0.08555229 | 2.2% |
| DOGE:4h:range_breakout_long:1789718400 | 0.08535 | 0.08356114 | 0.08535 | 0.08356114 | 2.1% |
| DOGE:4h:momentum_reversal_short:1789704000 | 0.08446 | 0.08609286 | 0.08446 | 0.08609286 | 1.9% |
| ADA:1h:trend_pullback_reject_short:1789596000 | 0.1927 | 0.19569143 | 0.1927 | 0.19569143 | 1.6% |
| DOGE:4h:range_breakdown_short:1789473600 | 0.08169 | 0.08345571 | 0.08169 | 0.08345571 | 2.2% |
| ADA:4h:trend_pullback_reject_short:1789430400 | 0.2052 | 0.21049714 | 0.2052 | 0.21049714 | 2.6% |
| DOGE:4h:trend_pullback_reject_short:1789416000 | 0.08366 | 0.08518057 | 0.08366 | 0.08518057 | 1.8% |
| DOGE:4h:trend_pullback_reject_short:1789372800 | 0.08412 | 0.08533114 | 0.08412 | 0.08533114 | 1.4% |

## Limitations

- This reconstructs detector paper-signal prices from cached entry candles and ATR14; it does not fetch new data.
- Existing paper-dashboard resultR fields are not used by DEMO-SIM replay and are not re-scored here.
- This repairs measurement precision only; it does not change live watcher behavior, thresholds, sizing, or execution.
