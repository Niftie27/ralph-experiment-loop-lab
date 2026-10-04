# DEMO-SIM Impulse Exhaustion Cooldown Postmortem

Generated: 2026-09-27T07:57:45.551Z
Status: `cooldown_candidate_needs_forward_test`

This report tests simple research-only no-trade/cooldown filters against the existing `range_breakout_long + BTC_RISK_ON` survivor rows. It does not create a new entry rule. It asks whether prior BTC/alt overextension or recent synchronized SL information can cut the 2026-08-22-style damage without deleting the whole 2026-W34 impulse. It uses existing replay rows and local public candle cache only. No live alerts, watcher behavior, scheduler payloads, keys, accounts, sizing, TP/SL, execution, or public posting changed.

## Baseline

| Case | Rows | Net | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| selected_all | 107 | 9035.42 | 1.6348 | 50.5% | 24.5% |
| 2026-W34 | 66 | 7827.87 | 1.9714 | 59.1% | 21.1% |
| outside_focus_week | 41 | 1207.55 | 1.1956 | 36.6% | 13.4% |

## Candidate Filters

| Filter | Kept | Kept Net | Kept PF | Kept DD | Skipped | Skipped Net | W34 Kept Net |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| skip_btc_72h_return_gt_15pct | 70 | 6231.12 | 1.793 | 9.2% | 37 | 2804.30 | 5023.57 |
| skip_alt_basket_72h_median_gt_20pct | 76 | 9123.77 | 2.1612 | 7.8% | 31 | -88.35 | 7916.22 |
| skip_target_72h_return_gt_25pct | 81 | 10471.10 | 2.3427 | 10.4% | 26 | -1435.68 | 10072.14 |
| cooldown_after_3_sl_in_6h_for_24h | 107 | 9035.42 | 1.6348 | 24.5% | 0 | 0.00 | 7827.87 |

## Focus Week Filter Impact

| Case | Rows | Net | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| skip_btc_72h_return_gt_15pct | 29 | 5023.57 | 3.9863 | 69.0% | 12.6% |
| skip_alt_basket_72h_median_gt_20pct | 35 | 7916.22 | 5.7058 | 74.3% | 12.6% |
| skip_target_72h_return_gt_25pct | 45 | 10072.14 | 4.8452 | 73.3% | 12.6% |
| cooldown_after_3_sl_in_6h_for_24h | 66 | 7827.87 | 1.9714 | 59.1% | 21.1% |

## Interpretation

At least one cooldown candidate improves drawdown while retaining most survivor PnL. Best first candidate by retained net is `skip_target_72h_return_gt_25pct`, but this is still postmortem evidence and must be tested out of sample before any paper/watch use.

## Next Actions

- Convert the best cooldown candidate into a standalone purged forward test before any DEMO-SIM join.
- Do not wire to demo-sim:all, cron, live alerts, watchers, sizing, TP/SL, or execution.
