# DEMO-SIM Survivor Cluster Postmortem

Generated: 2026-09-27T07:51:32.560Z
Status: `cluster_explains_survivor_but_not_robust_edge`

This report does not test a new strategy. It decomposes the only useful current pocket, `range_breakout_long + BTC_RISK_ON`, with special attention to 2026-08 / 2026-W34. It uses existing DEMO-SIM replay rows, local Binance spot candles, and cached public/no-key funding context only. It does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, sizing, TP/SL, execution, or public posting.

## Summary

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| selected_all | 107 | 9035.42 | 84.44 | 1.6348 | 50.5% | 24.5% |
| 2026-08 | 69 | 7747.56 | 112.28 | 1.8955 | 58.0% | 21.5% |
| 2026-W34 | 66 | 7827.87 | 118.60 | 1.9714 | 59.1% | 21.1% |
| outside_focus_week | 41 | 1207.55 | 29.45 | 1.1956 | 36.6% | 13.4% |

## Focus Splits

### By Symbol

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| BNB | 10 | 1761.27 | 176.13 | 5.9112 | 80.0% | 2.2% |
| ADA | 8 | 1722.37 | 215.30 | 2.6279 | 62.5% | 6.9% |
| XRP | 9 | 1543.60 | 171.51 | 2.2157 | 66.7% | 8.6% |
| SOL | 9 | 1193.27 | 132.59 | 2.4768 | 66.7% | 5.3% |
| AVAX | 9 | 1152.47 | 128.05 | 1.9864 | 55.6% | 6.2% |
| LINK | 7 | 366.76 | 52.39 | 1.3282 | 42.9% | 8.0% |
| DOGE | 8 | 318.87 | 39.86 | 1.2465 | 50.0% | 7.7% |
| ETH | 6 | -230.74 | -38.46 | 0.7656 | 33.3% | 7.1% |

### By Timeframe And Tier

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 4h / low-sample | 34 | 3974.47 | 116.90 | 1.768 | 61.8% | 26.1% |
| 4h / B | 7 | 2149.25 | 307.04 | 8.06 | 85.7% | 2.4% |
| 1h / low-sample | 21 | 1566.18 | 74.58 | 1.6809 | 47.6% | 13.7% |
| 4h / avoid | 1 | 306.30 | 306.30 | Infinity | 100.0% | 0.0% |
| 1h / avoid | 2 | 16.26 | 8.13 | 1.1729 | 50.0% | 0.9% |
| 1h / B | 1 | -184.59 | -184.59 | 0 | 0.0% | 1.8% |

### By Exit Day

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-08-21 | 16 | 6564.68 | 410.29 | 24.7468 | 93.8% | 1.6% |
| 2026-08-20 | 11 | 2369.90 | 215.45 | 4.563 | 72.7% | 4.2% |
| 2026-08-19 | 12 | 414.36 | 34.53 | 1.4074 | 50.0% | 8.9% |
| 2026-08-22 | 27 | -1521.08 | -56.34 | 0.7506 | 37.0% | 36.0% |

### By Funding Context

| Case | Closed | Net USD | Avg USD | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| persistent_positive | 52 | 6500.34 | 125.01 | 1.9337 | 59.6% | 22.5% |
| positive_not_persistent | 12 | 1237.08 | 103.09 | 2.4056 | 58.3% | 8.2% |
| negative_not_persistent | 2 | 90.46 | 45.23 | 1.4191 | 50.0% | 2.1% |

## BTC Context

- Month BTC return: 21.4%; risk-on share 94.6%; average 4h range 1.7%.
- Week BTC return: 19.8%; risk-on share 100.0%; high from start 23.2%; low from start -0.4%.

## Broad Symbol Context

| Symbol | Month Ret | Week Ret | Week High | Week Low | Avg 4h Range |
| --- | ---: | ---: | ---: | ---: | ---: |
| ADA | 16.9% | 32.3% | 47.7% | -0.7% | 5.5% |
| AVAX | 16.1% | 20.5% | 31.7% | -0.4% | 4.1% |
| BNB | 15.5% | 17.1% | 20.5% | -0.2% | 2.4% |
| DOGE | 22.3% | 32.5% | 43.5% | -0.5% | 4.8% |
| ETH | 28.5% | 26.5% | 32.4% | -0.4% | 3.5% |
| LINK | 18.4% | 20.3% | 29.2% | -1.1% | 4.3% |
| SOL | 35.7% | 21.8% | 32.5% | -0.8% | 3.6% |
| XRP | 39.5% | 55.5% | 69.0% | -0.2% | 6.3% |

## Worst Loss Clusters In Focus Week

| Start | End | Trades | Net USD | Symbols |
| --- | --- | ---: | ---: | --- |
| 2026-08-22T04:00:00.000Z | 2026-08-22T05:00:00.000Z | 13 | -4752.49 | AVAX,BNB,DOGE,ETH,LINK,SOL,XRP |
| 2026-08-19T22:00:00.000Z | 2026-08-20T03:00:00.000Z | 8 | -1439.01 | ADA,AVAX,BNB,DOGE,ETH,LINK,SOL,XRP |
| 2026-08-22T04:00:00.000Z | 2026-08-22T04:00:00.000Z | 2 | -873.45 | ADA |
| 2026-08-22T00:00:00.000Z | 2026-08-22T00:00:00.000Z | 2 | -473.55 | LINK |
| 2026-08-21T23:00:00.000Z | 2026-08-21T23:00:00.000Z | 1 | -276.44 | DOGE |
| 2026-08-20T12:00:00.000Z | 2026-08-20T12:00:00.000Z | 1 | -243.22 | AVAX |

## Mechanism Read

- 2026-W34 contributes 7827.87 USDT from 66 selected rows; outside that week the same selected survivor has 1207.55 USDT.
- The focus week is broad rather than single-symbol only: 7/8 symbols are positive, but the worst loss cluster still hits many symbols together.
- BTC context is supportive but not explosive: BTC stays 100.0% risk-on through the focus window with 19.8% close-to-close return.
- The useful pocket looks like a short-lived broad alt risk-on expansion under BTC confirmation, not a durable standalone range-breakout rule.
- The main failure mode is synchronized symbol-level loss after the expansion impulse, especially the 2026-08-22 cluster.

## Next Actions

- Do not promote the survivor or funding context from this cluster alone.
- If continuing research, build a standalone impulse-exhaustion/post-breakout-decay postmortem around 2026-08-22 to identify no-trade or cool-down conditions.
- Prefer mechanisms that explain when to stand down after a broad synchronized alt impulse, not more naive entry variants.
- Keep all work research-only; no demo-sim:all, cron, watcher, sizing, TP/SL, execution, key, or account changes.
