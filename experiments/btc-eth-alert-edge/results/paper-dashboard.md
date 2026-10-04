# Forward Paper Dashboard

Generated: 2026-10-04T08:04:18.917Z
Source updated: 2026-10-04T08:04:18.872Z

Status: paper-only, no live execution.

This dashboard separates qualified A/B/C tiers from low-sample and avoid rows. Regime-aware groups are keyed by trend and volatility bucket so historical bucket checks can demand matching forward paper support. It is a research ledger, not an exchange paper account and not a trade recommendation.

## Overall

| Group | Total | Open | Closed | Winrate | Total R | Avg R | Targets | Stops |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| all | 500 | 11 | 489 | 33.1% | -57.3256 | -0.1172 | 126 | 296 |
| A/B/C | 41 | 2 | 39 | 35.9% | -3.4493 | -0.0884 | 11 | 24 |
| low-sample/avoid | 459 | 9 | 450 | 32.9% | -53.8763 | -0.1197 | 115 | 272 |

## By Tier

| Group | Total | Open | Closed | Winrate | Total R | Avg R | Targets | Stops |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| B | 12 | 0 | 12 | 50.0% | 4.8 | 0.4 | 6 | 6 |
| C | 29 | 2 | 27 | 29.6% | -8.2493 | -0.3055 | 5 | 18 |
| low-sample | 374 | 8 | 366 | 34.4% | -29.005 | -0.0792 | 97 | 213 |
| avoid | 85 | 1 | 84 | 26.2% | -24.8713 | -0.2961 | 18 | 59 |

## By Tier And Setup

| Group | Total | Open | Closed | Winrate | Total R | Avg R | Targets | Stops |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| low-sample / range_breakout_long | 129 | 1 | 128 | 40.6% | 16.7577 | 0.1309 | 48 | 69 |
| low-sample / momentum_reversal_long | 67 | 0 | 67 | 46.3% | 9.9005 | 0.1478 | 18 | 29 |
| low-sample / trend_pullback_reclaim_long | 54 | 3 | 51 | 43.1% | 3.7741 | 0.074 | 16 | 29 |
| low-sample / momentum_reversal_short | 50 | 0 | 50 | 20.0% | -22.7819 | -0.4556 | 7 | 37 |
| avoid / trend_pullback_reject_short | 45 | 0 | 45 | 17.8% | -23.586 | -0.5241 | 6 | 34 |
| low-sample / range_breakdown_short | 47 | 2 | 45 | 11.1% | -28.8492 | -0.6411 | 3 | 33 |
| low-sample / trend_pullback_reject_short | 27 | 2 | 25 | 24.0% | -7.8062 | -0.3122 | 5 | 16 |
| C / trend_pullback_reject_short | 16 | 2 | 14 | 35.7% | 0 | 0 | 5 | 9 |
| B / range_breakout_long | 11 | 0 | 11 | 54.5% | 5.8 | 0.5273 | 6 | 5 |
| avoid / momentum_reversal_long | 11 | 0 | 11 | 54.5% | 4.3147 | 0.3922 | 4 | 5 |
| avoid / range_breakdown_short | 10 | 1 | 9 | 22.2% | -3.4 | -0.3778 | 2 | 7 |
| avoid / momentum_reversal_short | 8 | 0 | 8 | 37.5% | 0.4 | 0.05 | 3 | 5 |
| avoid / trend_pullback_reclaim_long | 7 | 0 | 7 | 28.6% | -1.4 | -0.2 | 2 | 5 |
| C / trend_pullback_reclaim_long | 6 | 0 | 6 | 50.0% | -1.8854 | -0.3142 | 0 | 3 |
| avoid / range_breakout_long | 4 | 0 | 4 | 25.0% | -1.2 | -0.3 | 1 | 3 |
| C / range_breakout_long | 3 | 0 | 3 | 0.0% | -2.3639 | -0.788 | 0 | 2 |
| C / range_breakdown_short | 3 | 0 | 3 | 0.0% | -3 | -1 | 0 | 3 |
| B / trend_pullback_reject_short | 1 | 0 | 1 | 0.0% | -1 | -1 | 0 | 1 |
| C / momentum_reversal_short | 1 | 0 | 1 | 0.0% | -1 | -1 | 0 | 1 |

## By Tier, Setup, And Regime

| Group | Total | Open | Closed | Winrate | Total R | Avg R | Targets | Stops |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| low-sample / range_breakout_long / up/mid-vol | 54 | 1 | 53 | 47.2% | 15.1043 | 0.285 | 22 | 24 |
| low-sample / range_breakout_long / range/mid-vol | 35 | 0 | 35 | 25.7% | -7.3518 | -0.2101 | 9 | 23 |
| low-sample / range_breakout_long / up/high-vol | 34 | 0 | 34 | 44.1% | 6.6052 | 0.1943 | 14 | 19 |
| low-sample / momentum_reversal_short / range/mid-vol | 33 | 0 | 33 | 21.2% | -14.1819 | -0.4298 | 4 | 23 |
| low-sample / trend_pullback_reclaim_long / up/mid-vol | 32 | 1 | 31 | 41.9% | 4.6442 | 0.1498 | 12 | 18 |
| low-sample / momentum_reversal_long / range/mid-vol | 30 | 0 | 30 | 50.0% | 9.4918 | 0.3164 | 9 | 11 |
| avoid / trend_pullback_reject_short / down/mid-vol | 23 | 0 | 23 | 30.4% | -4.636 | -0.2016 | 5 | 14 |
| avoid / trend_pullback_reject_short / down/low-vol | 22 | 0 | 22 | 4.5% | -18.95 | -0.8614 | 1 | 20 |
| low-sample / trend_pullback_reclaim_long / up/high-vol | 19 | 0 | 19 | 47.4% | 0.1299 | 0.0068 | 4 | 10 |
| low-sample / range_breakdown_short / range/mid-vol | 16 | 0 | 16 | 18.8% | -7.9159 | -0.4947 | 2 | 11 |
| low-sample / momentum_reversal_long / up/mid-vol | 14 | 0 | 14 | 35.7% | -1.946 | -0.139 | 3 | 8 |
| low-sample / trend_pullback_reject_short / down/mid-vol | 14 | 0 | 14 | 14.3% | -8.8262 | -0.6304 | 1 | 10 |
| low-sample / momentum_reversal_long / up/high-vol | 13 | 0 | 13 | 76.9% | 10.8244 | 0.8326 | 6 | 2 |
| low-sample / range_breakdown_short / down/mid-vol | 14 | 1 | 13 | 15.4% | -7.07 | -0.5438 | 1 | 9 |
| B / range_breakout_long / up/mid-vol | 11 | 0 | 11 | 54.5% | 5.8 | 0.5273 | 6 | 5 |
| avoid / momentum_reversal_long / range/low-vol | 11 | 0 | 11 | 54.5% | 4.3147 | 0.3922 | 4 | 5 |
| C / trend_pullback_reject_short / down/mid-vol | 13 | 2 | 11 | 36.4% | 0.2 | 0.0182 | 4 | 7 |
| avoid / momentum_reversal_short / range/low-vol | 8 | 0 | 8 | 37.5% | 0.4 | 0.05 | 3 | 5 |
| low-sample / trend_pullback_reject_short / down/low-vol | 8 | 0 | 8 | 37.5% | 0.4 | 0.05 | 3 | 5 |
| low-sample / momentum_reversal_short / down/low-vol | 8 | 0 | 8 | 0.0% | -8 | -1 | 0 | 8 |
| avoid / range_breakdown_short / down/low-vol | 6 | 0 | 6 | 33.3% | -0.4 | -0.0667 | 2 | 4 |
| C / trend_pullback_reclaim_long / up/mid-vol | 5 | 0 | 5 | 60.0% | -0.8854 | -0.1771 | 0 | 2 |
| avoid / trend_pullback_reclaim_long / up/low-vol | 5 | 0 | 5 | 20.0% | -2.2 | -0.44 | 1 | 4 |
| low-sample / range_breakdown_short / down/high-vol | 6 | 1 | 5 | 0.0% | -2.8633 | -0.5727 | 0 | 2 |
| low-sample / momentum_reversal_long / up/low-vol | 5 | 0 | 5 | 20.0% | -3.7697 | -0.7539 | 0 | 4 |
| low-sample / range_breakdown_short / range/low-vol | 5 | 0 | 5 | 0.0% | -5 | -1 | 0 | 5 |
| low-sample / momentum_reversal_short / range/high-vol | 3 | 0 | 3 | 66.7% | 2.6 | 0.8667 | 2 | 1 |
| low-sample / trend_pullback_reject_short / down/high-vol | 5 | 2 | 3 | 33.3% | 0.62 | 0.2067 | 1 | 1 |
| C / trend_pullback_reject_short / down/low-vol | 3 | 0 | 3 | 33.3% | -0.2 | -0.0667 | 1 | 2 |
| low-sample / momentum_reversal_short / down/mid-vol | 3 | 0 | 3 | 33.3% | -0.2 | -0.0667 | 1 | 2 |

## By Symbol And Timeframe

| Group | Total | Open | Closed | Winrate | Total R | Avg R | Targets | Stops |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| BNB / 4h | 50 | 2 | 48 | 43.8% | 6.9705 | 0.1452 | 17 | 25 |
| AVAX / 4h | 44 | 1 | 43 | 44.2% | 2.7788 | 0.0646 | 12 | 22 |
| XRP / 4h | 42 | 2 | 40 | 27.5% | -6.1018 | -0.1525 | 10 | 23 |
| DOGE / 4h | 40 | 2 | 38 | 34.2% | -0.6973 | -0.0184 | 11 | 21 |
| LINK / 4h | 38 | 0 | 38 | 36.8% | -1.4863 | -0.0391 | 11 | 22 |
| ADA / 4h | 38 | 3 | 35 | 40.0% | -0.2565 | -0.0073 | 10 | 19 |
| SOL / 4h | 30 | 0 | 30 | 30.0% | -6.373 | -0.2124 | 7 | 20 |
| ETH / 4h | 29 | 1 | 28 | 32.1% | -4.5983 | -0.1642 | 6 | 16 |
| BTC / 4h | 28 | 0 | 28 | 25.0% | -6.7263 | -0.2402 | 6 | 17 |
| ETH / 1h | 25 | 0 | 25 | 20.0% | -12.4853 | -0.4994 | 3 | 20 |
| XRP / 1h | 22 | 0 | 22 | 31.8% | -3.3034 | -0.1502 | 5 | 14 |
| DOGE / 1h | 22 | 0 | 22 | 27.3% | -3.9674 | -0.1803 | 5 | 13 |
| LINK / 1h | 18 | 0 | 18 | 27.8% | -5.5115 | -0.3062 | 4 | 13 |
| BNB / 1h | 17 | 0 | 17 | 35.3% | 0.05 | 0.0029 | 6 | 10 |
| SOL / 1h | 17 | 0 | 17 | 29.4% | -3.8191 | -0.2247 | 4 | 12 |
| ADA / 1h | 16 | 0 | 16 | 25.0% | -5.829 | -0.3643 | 3 | 12 |
| AVAX / 1h | 12 | 0 | 12 | 41.7% | 2 | 0.1667 | 5 | 7 |
| BTC / 1h | 12 | 0 | 12 | 16.7% | -7.9697 | -0.6641 | 1 | 10 |

## By Symbol, Timeframe, Setup, And Regime

| Group | Total | Open | Closed | Winrate | Total R | Avg R | Targets | Stops |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| BNB / 4h / range_breakout_long / up/mid-vol | 16 | 1 | 15 | 60.0% | 11.0282 | 0.7352 | 9 | 5 |
| AVAX / 4h / range_breakout_long / up/high-vol | 10 | 0 | 10 | 40.0% | 1.2 | 0.12 | 4 | 6 |
| SOL / 4h / range_breakout_long / up/mid-vol | 9 | 0 | 9 | 44.4% | 1.3828 | 0.1536 | 3 | 4 |
| ADA / 4h / range_breakout_long / up/high-vol | 7 | 0 | 7 | 57.1% | 4.2 | 0.6 | 4 | 3 |
| BTC / 4h / range_breakout_long / up/mid-vol | 7 | 0 | 7 | 57.1% | 3.3418 | 0.4774 | 3 | 2 |
| BNB / 4h / trend_pullback_reclaim_long / up/mid-vol | 7 | 0 | 7 | 57.1% | -0.0854 | -0.0122 | 1 | 3 |
| AVAX / 4h / range_breakout_long / up/mid-vol | 6 | 0 | 6 | 83.3% | 8 | 1.3333 | 5 | 1 |
| DOGE / 4h / trend_pullback_reclaim_long / up/mid-vol | 6 | 0 | 6 | 66.7% | 5.2 | 0.8667 | 4 | 2 |
| LINK / 4h / trend_pullback_reclaim_long / up/high-vol | 6 | 0 | 6 | 66.7% | 3.6559 | 0.6093 | 3 | 2 |
| ETH / 4h / trend_pullback_reclaim_long / up/mid-vol | 6 | 0 | 6 | 50.0% | 2.4 | 0.4 | 3 | 3 |
| BNB / 4h / trend_pullback_reject_short / down/low-vol | 6 | 0 | 6 | 33.3% | -0.4 | -0.0667 | 2 | 4 |
| AVAX / 4h / trend_pullback_reject_short / down/mid-vol | 6 | 0 | 6 | 16.7% | -3.8853 | -0.6475 | 0 | 4 |
| ETH / 4h / range_breakout_long / range/mid-vol | 6 | 0 | 6 | 0.0% | -5.1134 | -0.8522 | 0 | 5 |
| ADA / 1h / trend_pullback_reject_short / down/mid-vol | 6 | 0 | 6 | 0.0% | -6 | -1 | 0 | 6 |
| ETH / 1h / trend_pullback_reject_short / down/low-vol | 6 | 0 | 6 | 0.0% | -6 | -1 | 0 | 6 |
| XRP / 4h / range_breakout_long / up/mid-vol | 5 | 0 | 5 | 60.0% | 3.4 | 0.68 | 3 | 2 |
| LINK / 4h / range_breakout_long / up/high-vol | 5 | 0 | 5 | 60.0% | 2.0052 | 0.401 | 2 | 2 |
| DOGE / 4h / trend_pullback_reject_short / down/mid-vol | 6 | 1 | 5 | 40.0% | 1.207 | 0.2414 | 2 | 2 |
| ADA / 4h / range_breakout_long / range/mid-vol | 5 | 0 | 5 | 40.0% | 0.6 | 0.12 | 2 | 3 |
| DOGE / 1h / range_breakout_long / up/mid-vol | 5 | 0 | 5 | 40.0% | 0.6 | 0.12 | 2 | 3 |
| XRP / 4h / trend_pullback_reject_short / down/mid-vol | 6 | 1 | 5 | 40.0% | 0.6 | 0.12 | 2 | 3 |
| XRP / 4h / momentum_reversal_short / range/mid-vol | 5 | 0 | 5 | 40.0% | 0.085 | 0.017 | 1 | 2 |
| DOGE / 4h / range_breakout_long / up/high-vol | 5 | 0 | 5 | 20.0% | -2.2 | -0.44 | 1 | 4 |
| AVAX / 4h / momentum_reversal_long / up/high-vol | 4 | 0 | 4 | 100.0% | 4.0544 | 1.0136 | 1 | 0 |
| BNB / 1h / range_breakdown_short / down/low-vol | 4 | 0 | 4 | 50.0% | 1.6 | 0.4 | 2 | 2 |
| BNB / 4h / momentum_reversal_long / range/mid-vol | 4 | 0 | 4 | 50.0% | 1.6 | 0.4 | 2 | 2 |
| LINK / 4h / momentum_reversal_long / range/mid-vol | 4 | 0 | 4 | 50.0% | 1.6 | 0.4 | 2 | 2 |
| SOL / 4h / trend_pullback_reclaim_long / up/mid-vol | 4 | 0 | 4 | 50.0% | 0.8442 | 0.211 | 1 | 2 |
| LINK / 4h / trend_pullback_reject_short / down/mid-vol | 4 | 0 | 4 | 50.0% | 0.4423 | 0.1106 | 1 | 2 |
| ADA / 1h / momentum_reversal_short / range/mid-vol | 4 | 0 | 4 | 25.0% | -1.2 | -0.3 | 1 | 3 |
| DOGE / 1h / trend_pullback_reject_short / down/low-vol | 4 | 0 | 4 | 25.0% | -1.2 | -0.3 | 1 | 3 |
| DOGE / 4h / range_breakout_long / up/mid-vol | 4 | 0 | 4 | 25.0% | -1.2 | -0.3 | 1 | 3 |
| XRP / 1h / trend_pullback_reject_short / down/low-vol | 4 | 0 | 4 | 25.0% | -1.2 | -0.3 | 1 | 3 |
| ADA / 4h / trend_pullback_reclaim_long / up/high-vol | 4 | 0 | 4 | 25.0% | -1.97 | -0.4925 | 0 | 3 |
| LINK / 4h / range_breakout_long / range/mid-vol | 4 | 0 | 4 | 0.0% | -3.2258 | -0.8065 | 0 | 3 |
| BTC / 1h / trend_pullback_reject_short / down/low-vol | 4 | 0 | 4 | 0.0% | -4 | -1 | 0 | 4 |
| DOGE / 4h / momentum_reversal_short / range/mid-vol | 4 | 0 | 4 | 0.0% | -4 | -1 | 0 | 4 |
| ETH / 1h / momentum_reversal_long / range/low-vol | 3 | 0 | 3 | 100.0% | 3.9147 | 1.3049 | 1 | 0 |
| AVAX / 1h / range_breakout_long / up/mid-vol | 3 | 0 | 3 | 66.7% | 2.6 | 0.8667 | 2 | 1 |
| LINK / 1h / trend_pullback_reclaim_long / up/mid-vol | 3 | 0 | 3 | 66.7% | 2.6 | 0.8667 | 2 | 1 |

## Open Signals

- 2026-10-04T04:00:00.000Z ETH 4h long trend_pullback_reclaim_long up/low-vol low-sample: open
- 2026-10-03T16:00:00.000Z BNB 4h long range_breakout_long up/mid-vol low-sample: open
- 2026-10-03T12:00:00.000Z BNB 4h long trend_pullback_reclaim_long up/low-vol low-sample: open
- 2026-10-03T08:00:00.000Z AVAX 4h long trend_pullback_reclaim_long up/mid-vol low-sample: open
- 2026-10-03T04:00:00.000Z ADA 4h short trend_pullback_reject_short down/high-vol low-sample: open
- 2026-10-02T16:00:00.000Z XRP 4h short trend_pullback_reject_short down/mid-vol C: open
- 2026-10-02T16:00:00.000Z XRP 4h short range_breakdown_short down/mid-vol avoid: open
- 2026-10-02T16:00:00.000Z DOGE 4h short trend_pullback_reject_short down/mid-vol C: open
- 2026-10-02T16:00:00.000Z DOGE 4h short range_breakdown_short down/mid-vol low-sample: open
- 2026-10-02T16:00:00.000Z ADA 4h short trend_pullback_reject_short down/high-vol low-sample: open
- 2026-10-02T16:00:00.000Z ADA 4h short range_breakdown_short down/high-vol low-sample: open

## Recent Closed

- 2026-10-02T16:00:00.000Z SOL 4h short trend_pullback_reject_short down/mid-vol avoid: stop -1R
- 2026-10-02T21:00:00.000Z ETH 1h long momentum_reversal_long range/low-vol avoid: horizon 0.733R
- 2026-10-02T21:00:00.000Z SOL 1h long momentum_reversal_long range/mid-vol low-sample: horizon 0.981R
- 2026-10-02T21:00:00.000Z DOGE 1h long momentum_reversal_long range/mid-vol low-sample: horizon 0.511R
- 2026-10-02T21:00:00.000Z ADA 1h long momentum_reversal_long range/mid-vol low-sample: horizon 0.771R
- 2026-10-02T12:00:00.000Z BNB 4h short momentum_reversal_short range/mid-vol low-sample: stop -1R
- 2026-10-02T21:00:00.000Z BNB 1h long momentum_reversal_long range/low-vol avoid: target 1.8R
- 2026-10-02T16:00:00.000Z BNB 4h short trend_pullback_reject_short down/mid-vol C: stop -1R
- 2026-10-02T21:00:00.000Z AVAX 1h long momentum_reversal_long range/mid-vol low-sample: target 1.8R
- 2026-10-02T16:00:00.000Z LINK 4h short range_breakdown_short range/high-vol low-sample: stop -1R
- 2026-10-02T16:00:00.000Z AVAX 4h short range_breakdown_short range/high-vol low-sample: stop -1R
- 2026-10-01T22:00:00.000Z ETH 1h long trend_pullback_reclaim_long up/low-vol avoid: target 1.8R
- 2026-10-01T21:00:00.000Z XRP 1h short trend_pullback_reject_short down/low-vol avoid: stop -1R
- 2026-10-01T21:00:00.000Z LINK 1h short trend_pullback_reject_short down/mid-vol low-sample: stop -1R
- 2026-10-01T21:00:00.000Z SOL 1h short trend_pullback_reject_short down/low-vol avoid: stop -1R
- 2026-09-28T20:00:00.000Z XRP 4h long momentum_reversal_long range/mid-vol low-sample: horizon -0.173R
- 2026-09-29T04:00:00.000Z AVAX 4h long trend_pullback_reclaim_long up/high-vol low-sample: stop -1R
- 2026-09-29T04:00:00.000Z AVAX 4h long range_breakout_long up/high-vol low-sample: stop -1R
- 2026-09-28T08:00:00.000Z DOGE 4h long momentum_reversal_long range/mid-vol low-sample: horizon 1.121R
- 2026-09-28T08:00:00.000Z ADA 4h long momentum_reversal_long range/mid-vol low-sample: horizon 0.344R
