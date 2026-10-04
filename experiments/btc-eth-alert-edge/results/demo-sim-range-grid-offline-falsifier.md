# DEMO-SIM Range Grid Offline Falsifier

Generated: 2026-09-27T07:27:22.756Z
Status: `reject_loses_to_no_trade`

This is a research-only offline falsifier for the seeded range/grid idea. It uses existing local public Binance spot 4h candles for BTC/ETH/SOL, derives each grid range only from prior candles, requires BTC `BTC_TRANSITION` context, and compares the fixed grid against no-trade and buy-and-hold baselines after conservative costs. It does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, risk/sizing, TP/SL, execution, or public posting.

## Rule

- Range: Prior-only rolling 180 4h candles; lower=20th percentile lows, upper=80th percentile highs.
- Grid: Buy at the first inner grid level under BTC_TRANSITION, sell at the upper inner grid level, stop half a grid step below the lower range, or time-exit after 12 bars.
- BTC gate: BTC_TRANSITION only by close/MA20/MA50 proxy; BTC_RISK_OFF and BTC_RISK_ON are skipped.
- Round-trip cost: 12 bps

## Grid Results

| Case | Trades | Net/10k | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| grid_total | 292 | -140605.35 | 0.0576 | 11.30% | 1411.79% |
| BTC | 94 | -33958.61 | 0.069 | 12.77% | 343.18% |
| ETH | 97 | -48915.78 | 0.0712 | 12.37% | 499.00% |
| SOL | 101 | -57730.96 | 0.0386 | 8.91% | 577.31% |

## Buy-And-Hold Baselines

| Symbol | Net/10k | Start | End |
| --- | ---: | --- | --- |
| BTC | -2349.22 | 2025-11-01T08:00:00.000Z | 2026-09-27T04:00:00.000Z |
| ETH | -3063.09 | 2025-11-01T08:00:00.000Z | 2026-09-27T04:00:00.000Z |
| SOL | -3542.23 | 2025-11-01T08:00:00.000Z | 2026-09-27T04:00:00.000Z |
| equal_weight_buy_hold | -2984.85 | n/a | n/a |

## Grid By Month

| Case | Trades | Net/10k | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2026-09 | 1 | 203.35 | Infinity | 100.00% | 0.00% |
| 2026-03 | 12 | 54.67 | 1.0352 | 41.67% | 12.86% |
| 2026-07 | 6 | -28.09 | 0.9655 | 50.00% | 7.55% |
| 2026-08 | 9 | -50.70 | 0.9327 | 44.44% | 4.21% |
| 2026-01 | 11 | -2665.14 | 0.0166 | 9.09% | 26.83% |
| 2026-04 | 17 | -2909.80 | 0.385 | 29.41% | 39.81% |
| 2026-05 | 39 | -9918.13 | 0.0348 | 5.13% | 99.20% |
| 2025-12 | 47 | -14519.04 | 0.1451 | 19.15% | 145.19% |
| 2026-06 | 47 | -24054.23 | 0.0243 | 6.38% | 240.54% |
| 2025-11 | 59 | -40072.30 | 0 | 0.00% | 400.72% |
| 2026-02 | 44 | -46645.93 | 0 | 0.00% | 466.46% |

## Grid By Exit Reason

| Case | Trades | Net/10k | PF | Winrate | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| GRID_MEAN_REVERSION | 14 | 4646.22 | Infinity | 100.00% | 0.00% |
| TIME_EXIT | 72 | -19228.09 | 0.1701 | 26.39% | 192.28% |
| STOP_OR_TREND_BREAK | 206 | -126023.47 | 0 | 0.00% | 1260.23% |

## Interpretation

Verdict: `reject_loses_to_no_trade`

The fixed offline range-grid rule fails the cheap falsifier and should not be joined to DEMO-SIM or paper-fund surfaces.

## Blockers

- grid loses to no-trade
- grid loses to best buy-and-hold baseline (BTC)
- grid max drawdown is 1411.79%
- profit is not distributed across at least two symbols
- single fixed offline fill model does not prove executable grid fills

## Next Actions

- Keep range-grid offline falsifier as rejected/watch-only reference.
- Do not join this branch to DEMO-SIM paper fund, live alerts, watchers, sizing, TP/SL, execution, or schedulers.
- Route next work back to survivor hardening, source discovery, or a new user-approved validation branch.

## Boundary Delta

Changed: standalone research script and standalone JSON/Markdown outputs only.

Unchanged: no scheduler or cron payloads, no live alerts, no watcher behavior, no keys/accounts/paid services, no sizing, no TP/SL, no execution behavior, no public posting, and no strategy promotion.
