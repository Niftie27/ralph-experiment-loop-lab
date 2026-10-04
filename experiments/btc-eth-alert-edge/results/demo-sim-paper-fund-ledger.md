# DEMO-SIM Paper Fund Ledger

Generated: 2026-10-04T08:04:30.153Z
Source replay: `results/historical-demo-sim-replay.json`

Status: `capital_impaired_review_required`

This report interprets historical DEMO-SIM replay rows as a paper-fund ledger. It starts with 10000.00 USDT, applies closed replay trades in exit-time order, and tracks fee-adjusted equity and drawdown. It is research-only and does not change live execution, keys, schedulers, TradingView automation, alert wording, thresholds, watchers, or sizing behavior.

## Account Summary

| Starting Capital | Ending Equity | Net PnL | Return | Gross PnL | Fees | Closed | Open/skipped | Winrate | Profit Factor | Max DD | Max DD At | Bad R | Ambig |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: |
| 10000.00 | 3202.62 | -6797.38 | -68.0% | -1418.38 | 5379.00 | 489 | 11 | 35.8% | 0.8937 | 18695.08 (87.3%) | 2026-09-18T12:00:00.000Z | 0 | 8 |

## Drawdown And Risk Report

| Metric | Value |
| --- | --- |
| Risk verdict | paper_fund_capital_impaired_stop_and_rebuild_required |
| Capital remaining | 32.0% |
| Fee drag vs starting capital | 53.8% |
| Fees as share of net loss | 79.1% |
| Worst loss streak | 20 trades / -2441.74 USDT / 2026-09-14T00:00:00.000Z -> 2026-09-14T16:00:00.000Z |
| Worst 25-trade window | -4991.90 USDT / 2026-09-06T12:00:00.000Z -> 2026-09-09T20:00:00.000Z |
| Worst 50-trade window | -7358.29 USDT / 2026-09-08T00:00:00.000Z -> 2026-09-11T12:00:00.000Z |

### Drawdown Tripwires

| DD Threshold | Breached | First At | Equity After |
| --- | --- | --- | ---: |
| 25.0% | yes | 2026-08-31T16:00:00.000Z | 15992.93 |
| 50.0% | yes | 2026-09-09T12:00:00.000Z | 10558.81 |
| 75.0% | yes | 2026-09-11T12:00:00.000Z | 5167.38 |
| 90.0% | no | n/a | n/a |

### Risk Interpretation

- The full replay surface is not capital-ready: ending equity is deeply impaired and max drawdown is above any reasonable paper-fund review threshold.
- Fees are large enough to explain most of the net loss, so any future candidate must clear costs before it earns paper-capital status.
- Short families and BTC_RISK_OFF rows remain the clearest avoid/quarantine surfaces; long-only positive pockets still require separate walk-forward and drawdown containment.

## Monthly Equity Surface

| Month | Closed | Net USDT | Fees | Ending Equity | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2026-08 | 143 | 5761.34 | 1573.00 | 15761.34 | 26.4% |
| 2026-09 | 331 | -11889.40 | 3641.00 | 3871.94 | 87.3% |
| 2026-10 | 15 | -669.32 | 165.00 | 3202.62 | 86.5% |

## By Strategy

| Group | Closed | Winrate | Net USDT | Fees | PF | Avg R | Bad R | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| range_breakout_long:long | 146 | 45.2% | 6052.93 | 1606.00 | 1.2922 | 0.1516 | 0 | 6 |
| momentum_reversal_long:long | 78 | 50.0% | 4088.14 | 858.00 | 1.5837 | 0.1443 | 0 | 1 |
| trend_pullback_reclaim_long:long | 64 | 37.5% | -1802.71 | 704.00 | 0.8115 | -0.1444 | 0 | 0 |
| momentum_reversal_short:short | 59 | 23.7% | -3503.90 | 649.00 | 0.5496 | -0.457 | 0 | 0 |
| trend_pullback_reject_short:short | 85 | 24.7% | -4491.31 | 935.00 | 0.5346 | -0.4374 | 0 | 0 |
| range_breakdown_short:short | 57 | 19.3% | -7140.54 | 627.00 | 0.2243 | -0.5744 | 0 | 1 |

## By Setup

| Group | Closed | Winrate | Net USDT | Fees | PF | Avg R | Bad R | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| range_breakout_long | 146 | 45.2% | 6052.93 | 1606.00 | 1.2922 | 0.1516 | 0 | 6 |
| momentum_reversal_long | 78 | 50.0% | 4088.14 | 858.00 | 1.5837 | 0.1443 | 0 | 1 |
| trend_pullback_reclaim_long | 64 | 37.5% | -1802.71 | 704.00 | 0.8115 | -0.1444 | 0 | 0 |
| momentum_reversal_short | 59 | 23.7% | -3503.90 | 649.00 | 0.5496 | -0.457 | 0 | 0 |
| trend_pullback_reject_short | 85 | 24.7% | -4491.31 | 935.00 | 0.5346 | -0.4374 | 0 | 0 |
| range_breakdown_short | 57 | 19.3% | -7140.54 | 627.00 | 0.2243 | -0.5744 | 0 | 1 |

## By Symbol And Timeframe

| Group | Closed | Winrate | Net USDT | Fees | PF | Avg R | Bad R | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| DOGE:4h | 38 | 47.4% | 2118.08 | 418.00 | 1.4191 | 0.2121 | 0 | 1 |
| DOGE:1h | 22 | 50.0% | 1264.70 | 242.00 | 1.8016 | 0.2292 | 0 | 0 |
| BNB:4h | 48 | 43.8% | 812.01 | 528.00 | 1.1952 | 0.0633 | 0 | 0 |
| AVAX:4h | 43 | 41.9% | 498.52 | 473.00 | 1.069 | 0.0073 | 0 | 2 |
| AVAX:1h | 12 | 41.7% | 492.15 | 132.00 | 1.4325 | 0.1192 | 0 | 0 |
| XRP:1h | 22 | 31.8% | 44.01 | 242.00 | 1.021 | -0.2379 | 0 | 0 |
| BNB:1h | 17 | 35.3% | -2.84 | 187.00 | 0.9968 | -0.153 | 0 | 0 |
| SOL:1h | 17 | 29.4% | -242.44 | 187.00 | 0.8257 | -0.325 | 0 | 0 |
| ADA:1h | 16 | 31.3% | -427.84 | 176.00 | 0.772 | -0.3296 | 0 | 0 |
| LINK:4h | 38 | 39.5% | -501.63 | 418.00 | 0.9264 | -0.0684 | 0 | 0 |
| BTC:1h | 12 | 16.7% | -618.31 | 132.00 | 0.1546 | -0.8564 | 0 | 0 |
| LINK:1h | 18 | 27.8% | -808.49 | 198.00 | 0.6029 | -0.3837 | 0 | 0 |
| BTC:4h | 28 | 28.6% | -908.75 | 308.00 | 0.6536 | -0.3332 | 0 | 0 |
| ETH:4h | 28 | 32.1% | -1215.42 | 308.00 | 0.6504 | -0.257 | 0 | 0 |
| ETH:1h | 25 | 20.0% | -1454.56 | 275.00 | 0.3254 | -0.6323 | 0 | 0 |
| XRP:4h | 40 | 32.5% | -1802.49 | 440.00 | 0.735 | -0.1873 | 0 | 2 |
| SOL:4h | 30 | 30.0% | -1900.42 | 330.00 | 0.636 | -0.2883 | 0 | 2 |
| ADA:4h | 35 | 37.1% | -2143.68 | 385.00 | 0.7519 | -0.1064 | 0 | 1 |

## By Tier

| Group | Closed | Winrate | Net USDT | Fees | PF | Avg R | Bad R | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| B | 12 | 50.0% | 1275.16 | 132.00 | 1.8594 | 0.3144 | 0 | 1 |
| C | 27 | 29.6% | -1765.56 | 297.00 | 0.5108 | -0.3945 | 0 | 0 |
| low-sample | 366 | 38.3% | -2574.36 | 4026.00 | 0.9496 | -0.0787 | 0 | 7 |
| avoid | 84 | 25.0% | -3732.63 | 924.00 | 0.5159 | -0.4409 | 0 | 0 |

## By BTC Gate

| Group | Closed | Winrate | Net USDT | Fees | PF | Avg R | Bad R | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| BTC_RISK_ON | 149 | 40.9% | 2568.08 | 1639.00 | 1.111 | 0.0346 | 0 | 6 |
| BTC_TRANSITION | 198 | 42.4% | 377.80 | 2178.00 | 1.0165 | -0.0089 | 0 | 0 |
| BTC_SELF | 40 | 25.0% | -1527.05 | 440.00 | 0.5448 | -0.4902 | 0 | 0 |
| BTC_RISK_OFF | 102 | 19.6% | -8216.21 | 1122.00 | 0.4337 | -0.554 | 0 | 2 |

## Recent Ledger Rows

- 2026-10-04T00:00:00.000Z SOL 4h short trend_pullback_reject_short: net -257.17 USDT, equity 3202.62 USDT, DD 85.0%, BTC BTC_RISK_ON
- 2026-10-03T21:00:00.000Z SOL 1h long momentum_reversal_long: net 108.27 USDT, equity 3459.79 USDT, DD 83.8%, BTC BTC_TRANSITION
- 2026-10-03T21:00:00.000Z ETH 1h long momentum_reversal_long: net 63.02 USDT, equity 3351.52 USDT, DD 84.4%, BTC BTC_TRANSITION
- 2026-10-03T21:00:00.000Z DOGE 1h long momentum_reversal_long: net 75.82 USDT, equity 3288.50 USDT, DD 84.6%, BTC BTC_TRANSITION
- 2026-10-03T21:00:00.000Z ADA 1h long momentum_reversal_long: net 146.61 USDT, equity 3212.68 USDT, DD 85.0%, BTC BTC_TRANSITION
- 2026-10-03T16:00:00.000Z BNB 4h short momentum_reversal_short: net -142.51 USDT, equity 3066.06 USDT, DD 85.7%, BTC BTC_RISK_ON
- 2026-10-03T14:00:00.000Z BNB 1h long momentum_reversal_long: net 120.48 USDT, equity 3208.57 USDT, DD 85.0%, BTC BTC_TRANSITION
- 2026-10-03T12:00:00.000Z BNB 4h short trend_pullback_reject_short: net -146.24 USDT, equity 3088.09 USDT, DD 85.6%, BTC BTC_RISK_ON
- 2026-10-03T11:00:00.000Z AVAX 1h long momentum_reversal_long: net 337.41 USDT, equity 3234.33 USDT, DD 84.9%, BTC BTC_TRANSITION
- 2026-10-03T04:00:00.000Z LINK 4h short range_breakdown_short: net -361.77 USDT, equity 2896.92 USDT, DD 86.5%, BTC BTC_RISK_ON
- 2026-10-03T00:00:00.000Z AVAX 4h short range_breakdown_short: net -347.87 USDT, equity 3258.68 USDT, DD 84.8%, BTC BTC_RISK_ON
- 2026-10-02T04:00:00.000Z ETH 1h long trend_pullback_reclaim_long: net 138.22 USDT, equity 3606.55 USDT, DD 83.2%, BTC BTC_RISK_ON
- 2026-10-02T03:00:00.000Z XRP 1h short trend_pullback_reject_short: net -120.10 USDT, equity 3468.33 USDT, DD 83.8%, BTC BTC_RISK_ON
- 2026-10-02T02:00:00.000Z LINK 1h short trend_pullback_reject_short: net -166.00 USDT, equity 3588.43 USDT, DD 83.2%, BTC BTC_RISK_ON
- 2026-10-02T00:00:00.000Z SOL 1h short trend_pullback_reject_short: net -117.51 USDT, equity 3754.43 USDT, DD 82.5%, BTC BTC_RISK_ON
- 2026-09-30T20:00:00.000Z XRP 4h long momentum_reversal_long: net -56.43 USDT, equity 3871.94 USDT, DD 81.9%, BTC BTC_RISK_OFF
- 2026-09-30T12:00:00.000Z AVAX 4h long trend_pullback_reclaim_long: net -454.46 USDT, equity 3928.37 USDT, DD 81.7%, BTC BTC_TRANSITION
- 2026-09-30T12:00:00.000Z AVAX 4h long range_breakout_long: net -454.46 USDT, equity 4382.83 USDT, DD 79.5%, BTC BTC_TRANSITION
- 2026-09-30T08:00:00.000Z DOGE 4h long momentum_reversal_long: net 267.88 USDT, equity 4837.29 USDT, DD 77.4%, BTC BTC_RISK_OFF
- 2026-09-30T08:00:00.000Z ADA 4h long momentum_reversal_long: net 90.63 USDT, equity 4569.41 USDT, DD 78.7%, BTC BTC_RISK_OFF
- 2026-09-30T00:00:00.000Z DOGE 4h short range_breakdown_short: net 60.23 USDT, equity 4478.78 USDT, DD 79.1%, BTC BTC_TRANSITION
- 2026-09-29T16:00:00.000Z ADA 4h long trend_pullback_reclaim_long: net -369.84 USDT, equity 4418.55 USDT, DD 79.4%, BTC BTC_TRANSITION
- 2026-09-29T16:00:00.000Z LINK 4h long range_breakout_long: net -356.47 USDT, equity 4788.40 USDT, DD 77.6%, BTC BTC_RISK_OFF
- 2026-09-29T12:00:00.000Z ETH 4h long range_breakout_long: net -172.47 USDT, equity 5144.86 USDT, DD 76.0%, BTC BTC_TRANSITION
- 2026-09-29T12:00:00.000Z AVAX 4h long range_breakout_long: net -474.49 USDT, equity 5317.34 USDT, DD 75.2%, BTC BTC_TRANSITION

## Limitations

- The ledger is built from historical synthetic DEMO-SIM replay rows, not real exchange fills.
- Closed trades are sequenced by exit time; overlapping exposure, margin reservation, funding, liquidation, borrow costs, queue priority, and slippage are not modeled.
- The current replay records BTC gate context but does not filter rows by BTC gate pass/fail.
- Some source rows have rounded signal prices that make R-multiple invalid; USDT PnL is still counted after fees.
- This is an interpretation surface for capital discipline, not evidence that any strategy is live-capital-ready.
