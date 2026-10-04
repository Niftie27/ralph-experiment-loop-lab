# DEMO-SIM Range Breakout Survivor Stress

Generated: 2026-09-26T20:09:56.634Z
Source replay: `results/historical-demo-sim-replay.json`

Status: `narrow_paper_watch_research_candidate`

This report runs a research-only falsification pass on `range_breakout_long + BTC_RISK_ON` using the existing historical DEMO-SIM replay JSON. It does not fetch data and does not change live execution, accounts, keys, schedulers, cron payloads, alert wording, watcher behavior, sizing, TP/SL, or public posting.

## Baselines

| Case | Closed | Net USDT | PF | Max DD |
| --- | ---: | ---: | ---: | ---: |
| no_trade | 0 | 0.00 | n/a | 0.0% |
| all_closed_replay | 471 | -3507.91 | 0.9403 | 88.8% |
| long_only_all_setups | 278 | 10307.51 | 1.2984 | 52.9% |
| range_breakout_long_all_btc_gates | 165 | 9124.99 | 1.4398 | 38.5% |
| range_breakout_long_btc_risk_on | 107 | 9035.42 | 1.6348 | 24.5% |
| top_pocket_4h_b_or_low_sample | 70 | 8394.46 | 1.859 | 28.0% |

## Selected Survivor Splits

Filter: `setup=range_breakout_long, direction=long, btcGate.state=BTC_RISK_ON`

### By Timeframe

| Group | Closed | Winrate | Net USDT | PF | Max DD | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 4h | 75 | 56.0% | 8193.37 | 1.7723 | 26.1% | 6 |
| 1h | 32 | 37.5% | 842.05 | 1.2323 | 16.1% | 0 |

### By Tier

| Group | Closed | Winrate | Net USDT | PF | Max DD | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| low-sample | 85 | 50.6% | 7439.40 | 1.6345 | 26.3% | 5 |
| B | 13 | 61.5% | 2005.30 | 2.4817 | 4.8% | 1 |
| avoid | 6 | 50.0% | 427.92 | 2.3436 | 2.1% | 0 |
| C | 3 | 0.0% | -837.19 | 0 | 8.4% | 0 |

### By Symbol

| Group | Closed | Winrate | Net USDT | PF | Max DD | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ADA | 11 | 63.6% | 2676.58 | 2.7798 | 10.5% | 1 |
| AVAX | 16 | 56.3% | 2305.40 | 2.006 | 7.5% | 1 |
| DOGE | 14 | 57.1% | 1851.81 | 1.9893 | 12.9% | 1 |
| BNB | 16 | 62.5% | 1700.95 | 2.5539 | 5.9% | 0 |
| XRP | 14 | 50.0% | 1114.97 | 1.5335 | 12.0% | 1 |
| SOL | 15 | 53.3% | 797.50 | 1.4605 | 8.7% | 2 |
| ETH | 10 | 20.0% | -689.28 | 0.5223 | 11.5% | 0 |
| LINK | 11 | 27.3% | -722.50 | 0.6726 | 17.7% | 0 |

### By Month

| Group | Closed | Winrate | Net USDT | PF | Max DD | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-08 | 69 | 58.0% | 7747.56 | 1.8955 | 21.5% | 5 |
| 2026-09 | 38 | 36.8% | 1287.86 | 1.2307 | 13.4% | 1 |

### By Ambiguity

| Group | Closed | Winrate | Net USDT | PF | Max DD | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| unambiguous | 101 | 53.5% | 11415.02 | 1.963 | 17.3% | 0 |
| ambiguous | 6 | 0.0% | -2379.60 | 0 | 23.8% | 6 |

### By Exit Reason

| Group | Closed | Winrate | Net USDT | PF | Max DD | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| TP | 53 | 100.0% | 23253.89 | Infinity | 0.0% | 0 |
| TIME_EXIT | 3 | 33.3% | -94.99 | 0.1339 | 1.1% | 0 |
| SL | 51 | 0.0% | -14123.48 | 0 | 141.2% | 6 |

## Known Top Pocket

Pocket: `timeframe=4h, tier=B|low-sample`

### Top Pocket By Symbol

| Group | Closed | Winrate | Net USDT | PF | Max DD | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ADA | 9 | 66.7% | 2437.39 | 2.8476 | 10.7% | 1 |
| AVAX | 12 | 58.3% | 1771.38 | 1.8958 | 7.8% | 1 |
| BNB | 13 | 61.5% | 1354.88 | 2.3541 | 6.1% | 0 |
| XRP | 8 | 62.5% | 1050.08 | 1.7764 | 9.0% | 1 |
| DOGE | 9 | 55.6% | 906.04 | 1.6291 | 13.4% | 1 |
| SOL | 11 | 54.5% | 507.33 | 1.3511 | 8.0% | 2 |
| LINK | 4 | 50.0% | 497.79 | 1.732 | 6.1% | 0 |
| ETH | 4 | 25.0% | -130.42 | 0.7658 | 5.3% | 0 |

### Top Pocket By Month

| Group | Closed | Winrate | Net USDT | PF | Max DD | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-08 | 44 | 63.6% | 6043.41 | 1.9951 | 24.9% | 5 |
| 2026-09 | 26 | 46.2% | 2351.05 | 1.6356 | 6.9% | 1 |

### Top Pocket By Week

| Group | Closed | Winrate | Net USDT | PF | Max DD | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-W34 | 41 | 65.9% | 6123.72 | 2.1176 | 24.5% | 5 |
| 2026-W39 | 14 | 50.0% | 1836.42 | 2.1541 | 7.3% | 0 |
| 2026-W38 | 7 | 57.1% | 1182.73 | 2.0816 | 6.0% | 1 |
| 2026-W35 | 3 | 33.3% | -80.31 | 0.8647 | 5.6% | 0 |
| 2026-W36 | 5 | 20.0% | -668.10 | 0.3411 | 7.5% | 0 |

### Top Pocket Remove-Best Stresses

| Stress | Removed | Removed Net | Remainder n | Remainder Net | Remainder PF |
| --- | --- | ---: | ---: | ---: | ---: |
| top_pocket_without_best_symbol | ADA | 2437.39 | 61 | 5957.07 | 1.7048 |
| top_pocket_without_best_month | 2026-08 | 6043.41 | 26 | 2351.05 | 1.6356 |
| top_pocket_without_best_week | 2026-W34 | 6123.72 | 29 | 2270.74 | 1.529 |

### Top Pocket Fee Sensitivity

| Group | Closed | Winrate | Net USDT | PF | Max DD | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| base | 70 | 57.1% | 8394.46 | 1.859 | 28.0% | 6 |
| double_fees | 70 | 57.1% | 7624.46 | 1.7548 | 29.5% | 6 |
| extra_10bps_round_trip | 70 | 57.1% | 7694.46 | 1.764 | 29.4% | 6 |
| extra_20bps_round_trip | 70 | 55.7% | 6994.46 | 1.674 | 30.8% | 6 |

### Worst Consecutive Loss Clusters

| Start | End | Trades | Net USDT | Symbols |
| --- | --- | ---: | ---: | --- |
| 2026-08-22T04:00:00.000Z | 2026-08-22T04:00:00.000Z | 13 | -5236.30 | ADA,AVAX,BNB,DOGE,ETH,LINK,SOL,XRP |
| 2026-08-28T00:00:00.000Z | 2026-09-04T12:00:00.000Z | 3 | -845.66 | LINK,SOL |
| 2026-09-22T00:00:00.000Z | 2026-09-22T04:00:00.000Z | 2 | -792.00 | AVAX,BNB |
| 2026-09-06T04:00:00.000Z | 2026-09-06T12:00:00.000Z | 3 | -761.93 | BNB,DOGE |
| 2026-09-19T20:00:00.000Z | 2026-09-20T00:00:00.000Z | 2 | -695.98 | ADA,DOGE |

## Decision

Verdict: `narrow_paper_watch_research_candidate`

The survivor passed the cheap remove-best symbol/month/week and fee stresses, but remains a narrow research-only paper-watch candidate with blockers. The blockers are large enough to prevent any live, sizing, watcher, TP/SL, execution, or scheduler promotion.

Next route: `paper-watch-only with blockers`

## Blockers

- top pocket max drawdown is 28.0%, above the 25% capital-readiness gate
- extra 20 bps round-trip cost stress raises top-pocket drawdown to 30.8%
- ambiguous selected rows are negative (-2379.60 USDT) under SL-first scoring
- worst top-pocket consecutive loss cluster is -5236.30 USDT from 2026-08-22T04:00:00.000Z to 2026-08-22T04:00:00.000Z
- best week 2026-W34 contributes 6123.72 USDT, so week concentration remains material even though the remainder stays positive

## Next Actions

- Keep only as narrow research-only paper-watch candidate.
- Require longer forward replay/paper evidence and independent mechanism validation before any promotion discussion.
- Do not promote to live, DEMO sizing, watcher behavior, TP/SL, execution, or scheduler automation.

## Limitations

- The replay is synthetic historical DEMO-SIM evidence, not exchange fills.
- The top pocket was identified by earlier grid search, so multiple-testing and survivorship risk remain material.
- Cost stress adjusts closed-row PnL only; it does not remodel queue priority, liquidation, funding, or overlapping margin.
- No new data was fetched; this is a falsification pass over the existing replay output.
