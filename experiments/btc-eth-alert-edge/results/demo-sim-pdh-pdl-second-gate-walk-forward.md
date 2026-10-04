# DEMO-SIM PDH/PDL Second Gate Walk-Forward

Generated: 2026-09-26T17:28:19.816Z

Status: `reject_no_touch_baseline_lift`

Candidate: `pdh-pdl-btc-gated-liquidity-sweep-long`

This is a harsher research-only second gate. It splits PDH reclaim from true PDL sweep/reclaim, tests UTC/8h/12h session boundaries, uses previous-month fit/current-month forward folds with a 24h forward embargo, and compares against touch-only plus the existing `range_breakout_long + BTC_RISK_ON` DEMO-SIM replay surface. It does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, risk/sizing, TP/SL, or execution.

## Decision

Verdict: `reject_no_touch_baseline_lift`

- best sweep variant is not positive in at least 60% of forward months
- best sweep variant max drawdown is above 25%
- best sweep variant does not beat best touch-only baseline

## Top Sweep/Reclaim Variants

| Variant | WF Trades | WF Net/10k | WF PF | WF DD | Pos Months | All Trades | All Net/10k |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| sweep_reclaim / pdh_reclaim_long / session_8h | 785 | 16050.85 | 1.2606 | 117.91% | 2/5 | 945 | 3583.34 |
| sweep_reclaim / pdl_sweep_reclaim_long / session_0h | 110 | -3929.76 | 0.6348 | 58.28% | 3/5 | 159 | 4605.27 |
| sweep_reclaim / pdh_reclaim_long / session_12h | 819 | -5086.18 | 0.9292 | 233.12% | 2/5 | 973 | -16313.47 |
| sweep_reclaim / pdh_reclaim_long / session_0h | 710 | -7469.18 | 0.8872 | 208.79% | 2/5 | 907 | -27250.31 |
| sweep_reclaim / pdl_sweep_reclaim_long / session_8h | 112 | -8393.32 | 0.2987 | 86.16% | 1/5 | 150 | -9146.13 |
| sweep_reclaim / pdl_sweep_reclaim_long / session_12h | 116 | -8668.97 | 0.308 | 89.55% | 1/5 | 147 | -10132.1 |

## Top Touch Baselines

| Variant | WF Trades | WF Net/10k | WF PF | WF DD | Pos Months | All Trades | All Net/10k |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| touch_baseline / pdh_touch_hold / session_8h | 1577 | 42877.06 | 1.3869 | 128.85% | 3/5 | 1936 | 10531.98 |
| touch_baseline / pdh_touch_hold / session_0h | 1490 | -2108.46 | 0.9825 | 96.82% | 3/5 | 1906 | -38677.49 |
| touch_baseline / pdh_touch_hold / session_12h | 1655 | -5151.57 | 0.9608 | 297.97% | 1/5 | 1986 | -33035.71 |
| touch_baseline / pdl_touch_hold / session_12h | 227 | -7298.68 | 0.6604 | 97.20% | 2/5 | 264 | -9474.98 |
| touch_baseline / pdl_touch_hold / session_0h | 233 | -9113.12 | 0.6097 | 120.11% | 2/5 | 328 | 9335.64 |
| touch_baseline / pdl_touch_hold / session_8h | 223 | -10283.36 | 0.5747 | 104.26% | 1/5 | 274 | -11718.81 |

## Best Sweep By Symbol

| Group | Trades | Winrate | Net/10k | PF | DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| BNB | 137 | 48.91% | 1370.24 | 1.2215 | 13.15% |
| SOL | 136 | 52.94% | 6019.6 | 1.6718 | 29.05% |
| LINK | 133 | 42.86% | -1611.28 | 0.8754 | 28.22% |
| ETH | 120 | 39.17% | 1658.8 | 1.1969 | 29.18% |
| AVAX | 114 | 47.37% | 419.18 | 1.0446 | 60.18% |
| DOGE | 113 | 40.71% | -2864.01 | 0.7911 | 64.90% |
| XRP | 97 | 40.21% | 227.72 | 1.0265 | 38.72% |
| ADA | 95 | 46.32% | -1636.91 | 0.8681 | 36.98% |

## Sweep By Session Offset

| Group | Trades | Winrate | Net/10k | PF | DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| 12h | 1120 | 38.57% | -26445.57 | 0.7494 | 405.56% |
| 8h | 1095 | 43.65% | -5562.78 | 0.942 | 275.28% |
| 0h | 1066 | 37.43% | -22645.05 | 0.7781 | 239.44% |

## Range Breakout BTC_RISK_ON Comparison

Existing DEMO-SIM replay comparison is limited to available paper-signal replay rows, currently August/September only.

| Group | Trades | Winrate | Net/10k | PF | DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2026-08 | 69 | 57.97% | 7747.56 | 1.8955 | 21.49% |
| 2026-09 | 38 | 36.84% | 1287.86 | 1.2307 | 13.35% |

## Limitations

- Session sensitivity uses three simple offsets only: UTC, UTC+8, and UTC+12 style session boundaries.
- Monthly folds are still candle-only and do not model book/trade flow, funding, liquidation context, queue position, or margin reservation.
- Range-breakout comparison uses available historical DEMO-SIM replay rows, not a freshly derived candle-native range-breakout simulation.
- The BTC gate remains a coarse research proxy, not a live watcher rule.
