# DEMO-SIM Impulse Decay State Feature Scan

Generated: 2026-09-27T19:32:39.072Z
Status: `postmortem_only_no_forward_validation`

This standalone research-only scan tests whether a better impulse-decay state feature can filter the existing `range_breakout_long + BTC_RISK_ON` survivor rows. It does not create a new entry rule and does not change `demo-sim:all`, schedulers, alerts, watchers, sizing, TP/SL, execution, keys/accounts, paid services, or public posting.

## Baseline

| Window | Rows | Net | PF | DD |
| --- | ---: | ---: | ---: | ---: |
| all | 107 | 9035.42 | 1.6348 | 24.5% |
| focus | 66 | 7827.87 | 1.9714 | 21.1% |
| purged_forward | 41 | 1207.55 | 1.1956 | 13.4% |

## State Features

| State | Verdict | All kept | All net | All DD | Skipped | Forward kept | Forward net | Forward PF | Forward DD |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| target_72h_return_gt_25pct | postmortem_only | 81 | 10471.10 | 8.6% | 26 | 36 | 398.96 | 1.077 | 16.8% |
| recent_selected_sl_cluster | rejected | 102 | 7806.20 | 26.0% | 5 | 41 | 1207.55 | 1.1956 | 13.4% |
| prior48_hot_recent24_cool | rejected | 102 | 9034.70 | 24.5% | 5 | 36 | 1206.83 | 1.2448 | 12.2% |
| composite_impulse_decay_v1 | rejected | 103 | 8784.50 | 24.5% | 4 | 37 | 956.63 | 1.1847 | 12.2% |
| breadth_hot_then_breadth_fades | rejected | 103 | 8436.50 | 25.7% | 4 | 37 | 608.63 | 1.1101 | 14.8% |
| btc_up_alt_impulse_cools | rejected | 103 | 8436.50 | 25.7% | 4 | 37 | 608.63 | 1.1101 | 14.8% |
| target_hot_breadth_fades | rejected | 104 | 8186.30 | 26.8% | 3 | 38 | 358.43 | 1.062 | 17.2% |

## Interpretation

No scanned impulse-decay state improves the purged-forward slice versus baseline. Best forward net delta is `recent_selected_sl_cluster` at 0.00 USDT versus baseline, so the branch is rejected as a standalone forward-validated no-trade feature for now.

## Next Actions

- Do not promote an impulse-decay no-trade state from this scan.
- Keep the impulse-exhaustion branch as failure-mode memory.
- Future work should look for richer breadth/flow/orderflow evidence or wait for more forward rows instead of tuning these thresholds.
