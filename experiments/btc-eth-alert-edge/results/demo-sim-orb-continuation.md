# DEMO-SIM ORB Continuation Kill Test

Generated: 2026-09-26T19:00:31.870Z

Status: `reject_drawdown_too_high`

Candidate: `btc-risk-on-opening-range-breakout-continuation`

This is a fixed-rule research-only kill test for BTC-risk-on opening-range breakout continuation. It uses cached Binance spot 1h candles, a UTC 4h opening range, first close acceptance above the opening-range high, explicit BTC `BTC_RISK_ON` gating, fixed 12h hold exit, and fixed conservative costs. It does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, risk/sizing, TP/SL, or execution.

## Decision

Verdict: `reject_drawdown_too_high`

- ORB acceptance walk-forward net is not positive after fixed costs
- ORB acceptance walk-forward PF is not above 1.1
- ORB acceptance is not positive in at least 60% of forward months
- ORB acceptance walk-forward max drawdown is above 25%
- existing range_breakout_long + BTC_RISK_ON replay remains stronger on its limited comparison surface

## Policy Comparison

| Policy | All Trades | All Net/10k | All PF | WF Trades | WF Net/10k | WF PF | WF DD | Pos Months |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| orb_acceptance | 423 | -9420.67 | 0.7655 | 329 | -3206.24 | 0.8947 | 99.47% | 1/5 |
| touch_baseline | 467 | -9954.93 | 0.7761 | 368 | -4609.44 | 0.8683 | 91.56% | 1/5 |
| no_trade | 0 | 0 | n/a | 0 | 0 | n/a | 0.00% | 0/0 |

## ORB By Symbol

| Group | Trades | Winrate | Net/10k | PF | DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| ETH | 62 | 35.48% | -1396.93 | 0.695 | 22.96% |
| BNB | 55 | 49.09% | 468.67 | 1.1621 | 12.01% |
| SOL | 55 | 45.45% | -1941.68 | 0.6536 | 28.74% |
| LINK | 55 | 38.18% | -1989.1 | 0.606 | 30.70% |
| XRP | 55 | 34.55% | -2507.16 | 0.6034 | 27.64% |
| DOGE | 49 | 46.94% | -98.54 | 0.9775 | 16.86% |
| ADA | 47 | 46.81% | -348.32 | 0.9374 | 22.13% |
| AVAX | 45 | 37.78% | -1607.6 | 0.7218 | 36.74% |

## ORB By Month

| Group | Trades | Winrate | Net/10k | PF | DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2026-07 | 80 | 46.25% | -1285.5 | 0.8033 | 34.38% |
| 2026-04 | 80 | 31.25% | -3847.08 | 0.4757 | 46.58% |
| 2026-05 | 78 | 39.74% | -2493.7 | 0.5656 | 27.50% |
| 2026-08 | 71 | 43.66% | -2955.29 | 0.6834 | 49.25% |
| 2026-06 | 64 | 34.38% | -3752.35 | 0.4491 | 41.79% |
| 2026-09 | 50 | 60.00% | 4913.25 | 2.1131 | 17.15% |

## Touch Baseline By Symbol

| Group | Trades | Winrate | Net/10k | PF | DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| XRP | 65 | 41.54% | -1101.63 | 0.8247 | 17.20% |
| SOL | 63 | 42.86% | -2049.56 | 0.6866 | 26.90% |
| BNB | 61 | 54.10% | 839.37 | 1.2837 | 7.40% |
| LINK | 61 | 42.62% | -660.39 | 0.8679 | 15.20% |
| ETH | 60 | 41.67% | -605.76 | 0.8592 | 14.49% |
| ADA | 53 | 43.40% | -1826.96 | 0.7697 | 21.37% |
| AVAX | 52 | 36.54% | -2016.64 | 0.661 | 35.66% |
| DOGE | 52 | 32.69% | -2533.36 | 0.5384 | 36.17% |

## Existing Range Breakout BTC_RISK_ON Comparison

Existing range-breakout comparison uses available historical DEMO-SIM replay rows, not a candle-native ORB derivation.

| Group | Trades | Winrate | Net/10k | PF | DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2026-08 | 69 | 57.97% | 7747.56 | 1.8955 | 21.49% |
| 2026-09 | 38 | 36.84% | 1287.86 | 1.2307 | 13.35% |

## Fixed Rule

- Timeframe: 1h
- Opening range: first 4 UTC hourly candles.
- Entry: first later close above opening-range high.
- BTC gate: `BTC_RISK_ON` only by close/MA20/MA50 proxy.
- Exit: 12 bars later at close.
- Costs: 4 bps fee plus 2 bps slippage per side.
- Parameter search: none.

## Limitations

- This is a candle-only 1h fixed-rule kill test and does not include orderflow, funding, queue priority, live fill quality, or margin reservation.
- The ORB session is fixed to UTC and intentionally not tuned.
- The existing range-breakout comparison is from available DEMO-SIM replay rows and is not timestamp-matched to every candle-native ORB trade.
- BTC_RISK_ON is an explicit research proxy, not a live watcher rule change.
