# Historical DEMO-SIM Replay

Generated: 2026-10-04T08:04:30.064Z

Status: research-only, no live execution. This report replays existing paper setup records through a DEMO-SIM-like lifecycle: entry, TP/SL, time-exit, and round-trip fees. It does not modify live watcher behavior, exchange keys, schedulers, or TradingView automation.

## Assumptions

- Entry: paper signal entry price at the setup candle close.
- Position: 1000 USDT margin at 10x, 10000 USDT notional.
- Fees: 5.5 bps per side, 11 bps round trip, matching live DEMO-SIM paper fee default.
- Time exit: signal `maxBars` on the signal timeframe.
- Candle ambiguity: if TP and SL are both touched inside one candle, the record is marked ambiguous and scored SL_FIRST.
- Bad R: records where rounded signal prices made entry and stop equal, so USDT PnL is still calculated but R-multiple is excluded.
- BTC gate: recorded as research context for each alt setup; this replay does not discard historical rows.

## Overall

| Total | Closed | Open/skipped | Winrate | Avg R | Net USDT | Profit factor | Bad R | Ambiguous | TP/SL/T |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 500 | 489 | 11 | 35.8% | -0.1487 | -6797.38 | 0.8937 | 0 | 8 | 135/295/59 |

## By Tier

| Group | Closed | Winrate | Avg R | Net USDT | Bad R | Ambig | TP/SL/T |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| low-sample | 366 | 38.3% | -0.0787 | -2574.36 | 0 | 7 | 107/210/49 |
| avoid | 84 | 25.0% | -0.4409 | -3732.63 | 0 | 0 | 17/60/7 |
| C | 27 | 29.6% | -0.3945 | -1765.56 | 0 | 0 | 5/19/3 |
| B | 12 | 50.0% | 0.3144 | 1275.16 | 0 | 1 | 6/6/0 |

## By Setup

| Group | Closed | Winrate | Avg R | Net USDT | Bad R | Ambig | TP/SL/T |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| range_breakout_long | 146 | 45.2% | 0.1516 | 6052.93 | 0 | 6 | 61/77/8 |
| trend_pullback_reject_short | 85 | 24.7% | -0.4374 | -4491.31 | 0 | 0 | 16/59/10 |
| momentum_reversal_long | 78 | 50.0% | 0.1443 | 4088.14 | 0 | 1 | 23/35/20 |
| trend_pullback_reclaim_long | 64 | 37.5% | -0.1444 | -1802.71 | 0 | 0 | 16/39/9 |
| momentum_reversal_short | 59 | 23.7% | -0.457 | -3503.9 | 0 | 0 | 11/42/6 |
| range_breakdown_short | 57 | 19.3% | -0.5744 | -7140.54 | 0 | 1 | 8/43/6 |

## By Symbol And Timeframe

| Group | Closed | Winrate | Avg R | Net USDT | Bad R | Ambig | TP/SL/T |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| BNB:4h | 48 | 43.8% | 0.0633 | 812.01 | 0 | 0 | 17/25/6 |
| AVAX:4h | 43 | 41.9% | 0.0073 | 498.52 | 0 | 2 | 12/22/9 |
| XRP:4h | 40 | 32.5% | -0.1873 | -1802.49 | 0 | 2 | 10/23/7 |
| DOGE:4h | 38 | 47.4% | 0.2121 | 2118.08 | 0 | 1 | 15/19/4 |
| LINK:4h | 38 | 39.5% | -0.0684 | -501.63 | 0 | 0 | 11/23/4 |
| ADA:4h | 35 | 37.1% | -0.1064 | -2143.68 | 0 | 1 | 11/19/5 |
| SOL:4h | 30 | 30.0% | -0.2883 | -1900.42 | 0 | 2 | 7/21/2 |
| ETH:4h | 28 | 32.1% | -0.257 | -1215.42 | 0 | 0 | 6/18/4 |
| BTC:4h | 28 | 28.6% | -0.3332 | -908.75 | 0 | 0 | 6/18/4 |
| ETH:1h | 25 | 20.0% | -0.6323 | -1454.56 | 0 | 0 | 3/20/2 |
| DOGE:1h | 22 | 50.0% | 0.2292 | 1264.7 | 0 | 0 | 9/10/3 |
| XRP:1h | 22 | 31.8% | -0.2379 | 44.01 | 0 | 0 | 5/14/3 |
| LINK:1h | 18 | 27.8% | -0.3837 | -808.49 | 0 | 0 | 4/13/1 |
| BNB:1h | 17 | 35.3% | -0.153 | -2.84 | 0 | 0 | 6/10/1 |
| SOL:1h | 17 | 29.4% | -0.325 | -242.44 | 0 | 0 | 4/12/1 |
| ADA:1h | 16 | 31.3% | -0.3296 | -427.84 | 0 | 0 | 3/11/2 |
| AVAX:1h | 12 | 41.7% | 0.1192 | 492.15 | 0 | 0 | 5/7/0 |
| BTC:1h | 12 | 16.7% | -0.8564 | -618.31 | 0 | 0 | 1/10/1 |

## By BTC Gate

| Group | Closed | Winrate | Avg R | Net USDT | Bad R | Ambig | TP/SL/T |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| BTC_TRANSITION | 198 | 42.4% | -0.0089 | 377.8 | 0 | 0 | 60/110/28 |
| BTC_RISK_ON | 149 | 40.9% | 0.0346 | 2568.08 | 0 | 6 | 54/82/13 |
| BTC_RISK_OFF | 102 | 19.6% | -0.554 | -8216.21 | 0 | 2 | 14/75/13 |
| BTC_SELF | 40 | 25.0% | -0.4902 | -1527.05 | 0 | 0 | 7/28/5 |

## Recent Closed Replays

- 2026-10-02T21:00:00.000Z AVAX 1h long momentum_reversal_long: TP, net 337.4104 USDT, 1.7432R, BTC BTC_TRANSITION
- 2026-10-02T21:00:00.000Z ADA 1h long momentum_reversal_long: TIME_EXIT, net 146.6109 USDT, 0.7172R, BTC BTC_TRANSITION
- 2026-10-02T21:00:00.000Z DOGE 1h long momentum_reversal_long: TIME_EXIT, net 75.8244 USDT, 0.4459R, BTC BTC_TRANSITION
- 2026-10-02T21:00:00.000Z BNB 1h long momentum_reversal_long: TP, net 120.4826 USDT, 1.6494R, BTC BTC_TRANSITION
- 2026-10-02T21:00:00.000Z SOL 1h long momentum_reversal_long: TIME_EXIT, net 108.2692 USDT, 0.8904R, BTC BTC_TRANSITION
- 2026-10-02T21:00:00.000Z ETH 1h long momentum_reversal_long: TIME_EXIT, net 63.0213 USDT, 0.6237R, BTC BTC_TRANSITION
- 2026-10-02T16:00:00.000Z AVAX 4h short range_breakdown_short: SL, net -347.8705 USDT, -1.0327R, BTC BTC_RISK_ON
- 2026-10-02T16:00:00.000Z LINK 4h short range_breakdown_short: SL, net -361.7669 USDT, -1.0314R, BTC BTC_RISK_ON
- 2026-10-02T16:00:00.000Z BNB 4h short trend_pullback_reject_short: SL, net -146.2359 USDT, -1.0813R, BTC BTC_RISK_ON
- 2026-10-02T16:00:00.000Z SOL 4h short trend_pullback_reject_short: SL, net -257.1743 USDT, -1.0447R, BTC BTC_RISK_ON
- 2026-10-02T12:00:00.000Z BNB 4h short momentum_reversal_short: SL, net -142.5092 USDT, -1.0836R, BTC BTC_RISK_ON
- 2026-10-01T22:00:00.000Z ETH 1h long trend_pullback_reclaim_long: TP, net 138.2215 USDT, 1.6673R, BTC BTC_RISK_ON
