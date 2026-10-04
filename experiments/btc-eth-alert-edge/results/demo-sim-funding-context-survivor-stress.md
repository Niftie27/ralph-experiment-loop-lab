# DEMO-SIM Funding Context Survivor Stress

Generated: 2026-09-27T07:43:46.344Z
Status: `reject_week_concentration`

This report stress-tests the previous funding-context hint. It re-joins existing cached public/no-key Hyperliquid funding rows onto existing DEMO-SIM replay rows, restricts to `range_breakout_long + BTC_RISK_ON + persistent_positive`, and asks whether the funding context survives concentration, cost, missing/stale, drawdown, and top-pocket checks. It does not fetch data and does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, risk/sizing, TP/SL, execution, or public posting.

## Baselines

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| no_trade | 0 | 0.00 | 0.00 | n/a | n/a | 0.0% |
| btc_regime_alone | 107 | 9035.42 | 84.44 | 1.6348 | 50.5% | 24.5% |
| funding_available_subset | 69 | 7747.56 | 112.28 | 1.8955 | 58.0% | 21.5% |
| persistent_positive | 55 | 6420.03 | 116.73 | 1.8497 | 58.2% | 22.8% |
| survivor_stress_selected | 107 | 9035.42 | n/a | 1.6348 | 50.5% | 24.5% |
| funding_baseline_persistent_positive | 55 | 6420.03 | 116.73 | 1.8497 | 58.2% | 22.8% |

## Persistent Positive Summary

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| persistent_positive | 55 | 6420.03 | 116.73 | 1.8497 | 58.2% | 22.8% |
| top_pocket_persistent_positive | 40 | 4605.96 | 115.15 | 1.7584 | 60.0% | 26.7% |

## Remove-Best Stresses

| Stress | Removed | Removed Net | Remainder n | Remainder Net | Remainder PF | Remainder DD |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| without_best_symbol | BNB | 1578.64 | 48 | 4841.39 | 1.664 | 23.6% |
| without_best_month | 2026-08 | 6420.03 | 0 | 0.00 | n/a | 0.0% |
| without_best_week | 2026-W34 | 6500.34 | 3 | -80.31 | 0.8647 | 5.6% |

## Cost Stress

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| base | 55 | 6420.03 | 116.73 | 1.8497 | 58.2% | 22.8% |
| double_fees | 55 | 5815.03 | 105.73 | 1.7447 | 58.2% | 24.3% |
| extra_10bps_round_trip | 55 | 5870.03 | 106.73 | 1.7539 | 58.2% | 24.2% |
| extra_20bps_round_trip | 55 | 5320.03 | 96.73 | 1.6637 | 58.2% | 25.6% |

## By Symbol / Month / Week

### By Symbol

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| BNB | 7 | 1578.64 | 225.52 | 6.9665 | 85.7% | 2.2% |
| XRP | 9 | 1543.60 | 171.51 | 2.2157 | 66.7% | 8.6% |
| ADA | 6 | 1402.61 | 233.77 | 2.6058 | 66.7% | 7.1% |
| AVAX | 8 | 1339.17 | 167.40 | 2.3641 | 62.5% | 6.1% |
| SOL | 9 | 709.88 | 78.88 | 1.5809 | 55.6% | 6.2% |
| DOGE | 8 | 318.87 | 39.86 | 1.2465 | 50.0% | 7.7% |
| LINK | 5 | 276.31 | 55.26 | 1.3065 | 40.0% | 8.1% |
| ETH | 3 | -749.05 | -249.68 | 0 | 0.0% | 7.5% |

### By Month

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-08 | 55 | 6420.03 | 116.73 | 1.8497 | 58.2% | 22.8% |

### By Week

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-W34 | 52 | 6500.34 | 125.01 | 1.9337 | 59.6% | 22.5% |
| 2026-W35 | 3 | -80.31 | -26.77 | 0.8647 | 33.3% | 5.6% |

## Missing And Stale Funding

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| available | 69 | 7747.56 | 112.28 | 1.8955 | 58.0% | 21.5% |
| stale | 38 | 1287.86 | 33.89 | 1.2307 | 36.8% | 13.4% |

## Worst Consecutive Loss Clusters

| Start | End | Trades | Net USD | Symbols |
| --- | --- | ---: | ---: | --- |
| 2026-08-22T04:00:00.000Z | 2026-08-22T05:00:00.000Z | 13 | -4752.49 | AVAX,BNB,DOGE,ETH,LINK,SOL,XRP |
| 2026-08-22T04:00:00.000Z | 2026-08-22T04:00:00.000Z | 2 | -873.45 | ADA |
| 2026-08-28T00:00:00.000Z | 2026-08-28T12:00:00.000Z | 2 | -593.60 | SOL |
| 2026-08-22T00:00:00.000Z | 2026-08-22T00:00:00.000Z | 2 | -473.55 | LINK |
| 2026-08-19T22:00:00.000Z | 2026-08-19T22:00:00.000Z | 2 | -343.09 | DOGE,XRP |

## Interpretation

Persistent-positive funding remains positive at 55 trades, 6420.03 USDT, PF 1.8497, and 22.8% max drawdown. Remove-best symbol/month/week remainders stay 4841.39, 0.00, and -80.31 USDT respectively. However, top-pocket persistent-positive funding still has 26.7% max drawdown, so this remains a research context hint rather than a promotion.

## Blockers

- persistent_positive fails remove-best-week stress
- persistent_positive fails remove-best-month stress
- top-pocket persistent_positive drawdown remains above readiness gate at 26.7%
- ambiguous persistent_positive rows are negative

## Next Actions

- Keep funding as a useful context hint only, not a promotion filter.
- Do not wire funding context to demo-sim:all, cron, live alerts, watchers, sizing, TP/SL, or execution.
- Route next work to survivor postmortems or fresh source discovery rather than adding naive entry rules.
