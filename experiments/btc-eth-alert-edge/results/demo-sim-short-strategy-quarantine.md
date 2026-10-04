# DEMO-SIM Short Strategy Quarantine

Generated: 2026-10-04T08:04:30.360Z
Source replay: `results/historical-demo-sim-replay.json`

Status: `all_short_families_quarantined`

This report quarantines and revalidates short strategy families from the historical DEMO-SIM replay. It is research-only and does not alter live execution, exchange keys, schedulers, TradingView automation, alert wording, thresholds, watchers, risk/sizing, or strategy promotion.

## Account Impact

| Surface | Closed | Winrate | Net USDT | PF | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| all replay | 489 | 35.8% | -6797.38 | 0.8937 | 88.3% |
| short only | 201 | 22.9% | -15135.75 | 0.4318 | 148.7% |
| long only / shorts withheld | 288 | 44.8% | 8338.36 | 1.2237 | 56.5% |

Withholding shorts changes the replay surface by 15135.74 USDT and leaves long-only ending equity at 18338.36 USDT with max drawdown 56.5%.

## Revalidation Contract

- Fit exits before: 2026-08-29T00:00:00.000Z
- Purged boundary: 2026-08-29T00:00:00.000Z to 2026-09-04T00:00:00.000Z
- Forward exits from: 2026-09-04T00:00:00.000Z
- Revalidation gate: fit n>=20, fit net>0, fit PF>=1.2, forward n>=10, forward net>0, forward PF>=1.1, forward maxDD<=20%

## Short Family Results

| Family | Verdict | All n | All Net | All PF | Fit n | Fit Net | Fit PF | Fwd n | Fwd Net | Fwd PF |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| all_shorts | quarantine_fit_sample_low | 201 | -15135.75 | 0.4318 | 15 | 495.70 | 1.2887 | 145 | -12136.12 | 0.3685 |
| short_btc_gate__btc_risk_off | quarantine_fit_sample_low | 72 | -8379.26 | 0.2003 | 0 | 0.00 | n/a | 62 | -6835.81 | 0.207 |
| short_setup__range_breakdown_short | quarantine_fit_sample_low | 57 | -7140.54 | 0.2243 | 2 | 383.50 | Infinity | 41 | -5221.31 | 0.1902 |
| short_setup_btc__range_breakdown_short__btc_risk_off | quarantine_fit_sample_low | 26 | -4512.61 | 0.0816 | 0 | 0.00 | n/a | 23 | -3814.53 | 0.0951 |
| short_setup__trend_pullback_reject_short | quarantine_fit_sample_low | 85 | -4491.31 | 0.5346 | 2 | 228.22 | 1.963 | 62 | -3996.51 | 0.4241 |
| short_btc_gate__btc_transition | quarantine_fit_sample_low | 91 | -3878.08 | 0.6406 | 9 | 1382.90 | 6.3336 | 56 | -3303.41 | 0.5273 |
| short_setup_btc__trend_pullback_reject_short__btc_risk_off | quarantine_fit_sample_low | 42 | -3789.71 | 0.274 | 0 | 0.00 | n/a | 36 | -3073.85 | 0.2663 |
| short_setup__momentum_reversal_short | quarantine_fit_sample_low | 59 | -3503.90 | 0.5496 | 11 | -116.02 | 0.9216 | 42 | -2918.30 | 0.4994 |
| short_setup_btc__momentum_reversal_short__btc_transition | quarantine_fit_sample_low | 40 | -2508.58 | 0.4986 | 7 | 999.39 | 4.8545 | 29 | -3211.96 | 0.2779 |
| short_btc_gate__btc_risk_on | quarantine_fit_sample_low | 21 | -2481.07 | 0.4029 | 5 | -992.66 | 0.3191 | 15 | -1577.41 | 0.4151 |
| short_setup_btc__range_breakdown_short__btc_transition | quarantine_fit_sample_low | 25 | -1403.03 | 0.5424 | 2 | 383.50 | Infinity | 13 | -357.55 | 0.6978 |
| short_setup_btc__momentum_reversal_short__btc_risk_on | quarantine_fit_sample_low | 10 | -1166.87 | 0.4897 | 3 | -1220.88 | 0 | 7 | 54.01 | 1.0507 |
| short_setup_btc__range_breakdown_short__btc_risk_on | quarantine_fit_sample_low | 2 | -709.64 | 0 | 0 | 0.00 | n/a | 2 | -709.64 | 0 |
| short_setup_btc__trend_pullback_reject_short__btc_risk_on | quarantine_fit_sample_low | 9 | -604.57 | 0.4783 | 2 | 228.22 | 1.963 | 6 | -921.79 | 0 |
| short_setup_btc__range_breakdown_short__btc_self | quarantine_fit_sample_low | 4 | -515.26 | 0 | 0 | 0.00 | n/a | 3 | -339.59 | 0 |
| short_btc_gate__btc_self | quarantine_fit_sample_low | 17 | -397.33 | 0.6719 | 1 | 105.47 | Infinity | 12 | -419.48 | 0.5404 |
| short_setup_btc__trend_pullback_reject_short__btc_self | quarantine_fit_sample_low | 8 | -130.56 | 0.7628 | 0 | 0.00 | n/a | 6 | -266.98 | 0.4341 |
| short_setup_btc__momentum_reversal_short__btc_risk_off | quarantine_fit_sample_low | 4 | -76.94 | 0.7767 | 0 | 0.00 | n/a | 3 | 52.57 | 1.2445 |
| short_setup_btc__trend_pullback_reject_short__btc_transition | quarantine_fit_sample_low | 26 | 33.54 | 1.0123 | 0 | 0.00 | n/a | 14 | 266.10 | 1.1961 |
| short_setup_btc__momentum_reversal_short__btc_self | quarantine_fit_sample_low | 5 | 248.49 | 2.7092 | 1 | 105.47 | Infinity | 3 | 187.08 | 2.8462 |

## Worst Short Buckets

### By Setup

| Group | Closed | Winrate | Net USDT | PF |
| --- | ---: | ---: | ---: | ---: |
| range_breakdown_short | 57 | 19.3% | -7140.54 | 0.2243 |
| trend_pullback_reject_short | 85 | 24.7% | -4491.31 | 0.5346 |
| momentum_reversal_short | 59 | 23.7% | -3503.90 | 0.5496 |

### By BTC Gate

| Group | Closed | Winrate | Net USDT | PF |
| --- | ---: | ---: | ---: | ---: |
| BTC_RISK_OFF | 72 | 12.5% | -8379.26 | 0.2003 |
| BTC_TRANSITION | 91 | 31.9% | -3878.08 | 0.6406 |
| BTC_RISK_ON | 21 | 19.0% | -2481.07 | 0.4029 |
| BTC_SELF | 17 | 23.5% | -397.33 | 0.6719 |

### By Setup And BTC Gate

| Group | Closed | Winrate | Net USDT | PF |
| --- | ---: | ---: | ---: | ---: |
| range_breakdown_short / BTC_RISK_OFF | 26 | 7.7% | -4512.61 | 0.0816 |
| trend_pullback_reject_short / BTC_RISK_OFF | 42 | 14.3% | -3789.71 | 0.274 |
| momentum_reversal_short / BTC_TRANSITION | 40 | 22.5% | -2508.58 | 0.4986 |
| range_breakdown_short / BTC_TRANSITION | 25 | 36.0% | -1403.03 | 0.5424 |
| momentum_reversal_short / BTC_RISK_ON | 10 | 20.0% | -1166.87 | 0.4897 |
| range_breakdown_short / BTC_RISK_ON | 2 | 0.0% | -709.64 | 0 |
| trend_pullback_reject_short / BTC_RISK_ON | 9 | 22.2% | -604.57 | 0.4783 |
| range_breakdown_short / BTC_SELF | 4 | 0.0% | -515.26 | 0 |
| trend_pullback_reject_short / BTC_SELF | 8 | 25.0% | -130.56 | 0.7628 |
| momentum_reversal_short / BTC_RISK_OFF | 4 | 25.0% | -76.94 | 0.7767 |
| trend_pullback_reject_short / BTC_TRANSITION | 26 | 42.3% | 33.54 | 1.0123 |
| momentum_reversal_short / BTC_SELF | 5 | 40.0% | 248.49 | 2.7092 |

## Decision

No short family earns revalidation. Shorts should remain quarantined in DEMO-SIM research until a separately specified short thesis passes a purged forward gate.

## Next Actions

- Exclude short families from any capital-readiness interpretation of the current paper fund.
- Keep collecting short alerts as research rows, but mark them quarantine/watch-only.
- Require a new short thesis spec before testing shorts again; do not rescue them by loosening the current gate.
- Continue evaluating the long range-breakout BTC_RISK_ON branch against stricter baselines.

## Limitations

- This report does not mutate live watchers, alert text, schedulers, exchange state, or paper signal generation.
- The replay is synthetic historical DEMO-SIM evidence, not real exchange fills.
- The fit/forward split has limited month coverage and should be treated as a kill/quarantine surface, not final proof.
- Removing shorts improves the replay ledger mechanically, but long-only survivorship still needs separate walk-forward and baseline checks.
