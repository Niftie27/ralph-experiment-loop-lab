# Level Breakout Acceptance Study

Generated: 2026-09-08T11:00:29.733Z

Scope: research-only candle baseline for deciding whether level breaks tend to behave better as acceptance/continuation or sweep/rejection across timeframes. This does not use ATAS Cluster Search; it is the baseline that a Cluster Search strategy must beat.

Definitions:

- `acceptance_up/down`: candle breaks previous candle high/low and closes beyond the level by at least `0.05 ATR`.
- `rejection_*_sweep`: candle trades through the previous high/low but closes back inside.
- `weak_*_break`: candle closes barely beyond the level but not enough for acceptance.
- Outcome: whether price reaches `0.5 ATR` favorable before `0.5 ATR` adverse within the timeframe horizon.

## Summary

| Symbol | Timeframe | Level | Kind | Sample | Fav first % | Adv first % | Avg close return % | Avg ATR return |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| BTC | 1h | previous_candle | acceptance_down | 5167 | 40.66 | 46.45 | -0.04 | -0.035 |
| BTC | 1h | previous_candle | acceptance_up | 5565 | 41.26 | 47.89 | -0.01 | 0.008 |
| BTC | 1h | previous_candle | rejection_down_sweep | 6134 | 44.96 | 45.32 | 0.03 | 0.028 |
| BTC | 1h | previous_candle | rejection_up_sweep | 6139 | 44.47 | 45.82 | -0.03 | -0.05 |
| BTC | 1h | previous_candle | weak_down_break | 605 | 46.61 | 44.79 | -0.07 | -0.128 |
| BTC | 1h | previous_candle | weak_up_break | 619 | 45.72 | 44.75 | 0.01 | 0.007 |
| BTC | 1h | previous_day_high | acceptance_up | 258 | 40.7 | 40.7 | 0.04 | 0.041 |
| BTC | 1h | previous_day_high | rejection_up_sweep | 257 | 45.14 | 40.47 | 0.01 | -0.089 |
| BTC | 1h | previous_day_high | weak_up_break | 12 | 41.67 | 50 | -0.39 | -0.244 |
| BTC | 1h | previous_day_low | acceptance_down | 211 | 44.55 | 33.65 | 0.02 | 0.097 |
| BTC | 1h | previous_day_low | rejection_down_sweep | 247 | 40.89 | 39.27 | 0.03 | -0.037 |
| BTC | 1h | previous_day_low | weak_down_break | 11 | 45.45 | 45.45 | 0.09 | 0.566 |
| BTC | 1d | previous_candle | acceptance_down | 208 | 47.12 | 39.9 | -0.37 | -0.037 |
| BTC | 1d | previous_candle | acceptance_up | 227 | 46.26 | 42.29 | 0.7 | 0.34 |
| BTC | 1d | previous_candle | rejection_down_sweep | 244 | 52.87 | 40.98 | 0.21 | 0.086 |
| BTC | 1d | previous_candle | rejection_up_sweep | 262 | 41.6 | 50 | -0.37 | -0.106 |
| BTC | 1d | previous_candle | weak_down_break | 10 | 40 | 50 | -2.73 | -1.054 |
| BTC | 1d | previous_candle | weak_up_break | 31 | 48.39 | 48.39 | 0.86 | 0.233 |
| BTC | 4h | previous_candle | acceptance_down | 1188 | 41.92 | 43.69 | -0.14 | -0.067 |
| BTC | 4h | previous_candle | acceptance_up | 1372 | 44.1 | 43.51 | 0.15 | 0.137 |
| BTC | 4h | previous_candle | rejection_down_sweep | 1570 | 43.06 | 43.69 | 0.06 | 0.039 |
| BTC | 4h | previous_candle | rejection_up_sweep | 1610 | 42.55 | 44.84 | -0.14 | -0.105 |
| BTC | 4h | previous_candle | weak_down_break | 119 | 42.86 | 44.54 | -0.22 | -0.065 |
| BTC | 4h | previous_candle | weak_up_break | 143 | 49.65 | 37.76 | 0.19 | 0.205 |
| BTC | 4h | previous_day_high | acceptance_up | 251 | 48.61 | 40.64 | 0.27 | 0.286 |
| BTC | 4h | previous_day_high | rejection_up_sweep | 260 | 42.69 | 43.85 | -0.01 | -0.018 |
| BTC | 4h | previous_day_high | weak_up_break | 15 | 53.33 | 33.33 | 0.49 | 0.227 |
| BTC | 4h | previous_day_low | acceptance_down | 207 | 43.48 | 42.51 | -0.4 | -0.261 |
| BTC | 4h | previous_day_low | rejection_down_sweep | 250 | 41.2 | 43.2 | -0.12 | -0.21 |
| BTC | 4h | previous_day_low | weak_down_break | 10 | 30 | 60 | 0.43 | 0.401 |
| ETH | 1h | previous_candle | acceptance_down | 4909 | 42.84 | 45.98 | -0.02 | -0.012 |
| ETH | 1h | previous_candle | acceptance_up | 5291 | 44.11 | 46.51 | 0.03 | 0.038 |
| ETH | 1h | previous_candle | rejection_down_sweep | 6019 | 45.24 | 46.62 | 0.01 | 0.003 |
| ETH | 1h | previous_candle | rejection_up_sweep | 6152 | 45.71 | 45.55 | -0.05 | -0.054 |
| ETH | 1h | previous_candle | weak_down_break | 587 | 43.95 | 47.87 | -0.01 | 0.022 |
| ETH | 1h | previous_candle | weak_up_break | 665 | 45.41 | 47.07 | -0.07 | -0.022 |
| ETH | 1h | previous_day_high | acceptance_up | 235 | 42.98 | 37.45 | 0.04 | -0.006 |
| ETH | 1h | previous_day_high | rejection_up_sweep | 257 | 48.64 | 42.8 | -0.1 | -0.114 |
| ETH | 1h | previous_day_high | weak_up_break | 18 | 38.89 | 55.56 | -0.12 | -0.11 |
| ETH | 1h | previous_day_low | acceptance_down | 226 | 41.15 | 38.05 | -0.08 | 0.023 |
| ETH | 1h | previous_day_low | rejection_down_sweep | 228 | 45.61 | 40.35 | -0.05 | -0.085 |
| ETH | 1h | previous_day_low | weak_down_break | 13 | 23.08 | 46.15 | -0.57 | -0.663 |
| ETH | 1d | previous_candle | acceptance_down | 200 | 46 | 41.5 | 0.07 | 0.065 |
| ETH | 1d | previous_candle | acceptance_up | 229 | 42.79 | 48.91 | -0.06 | 0.086 |
| ETH | 1d | previous_candle | rejection_down_sweep | 239 | 49.79 | 38.49 | 0.54 | 0.132 |
| ETH | 1d | previous_candle | rejection_up_sweep | 264 | 39.02 | 50.76 | -0.88 | -0.252 |
| ETH | 1d | previous_candle | weak_down_break | 22 | 50 | 31.82 | -0.79 | -0.306 |
| ETH | 1d | previous_candle | weak_up_break | 11 | 36.36 | 54.55 | 2.88 | 0.677 |
| ETH | 4h | previous_candle | acceptance_down | 1205 | 45.15 | 44.73 | -0.05 | 0 |
| ETH | 4h | previous_candle | acceptance_up | 1304 | 45.63 | 42.1 | 0.14 | 0.098 |
| ETH | 4h | previous_candle | rejection_down_sweep | 1512 | 43.32 | 46.43 | 0.12 | 0.098 |
| ETH | 4h | previous_candle | rejection_up_sweep | 1605 | 44.17 | 45.73 | -0.13 | -0.1 |
| ETH | 4h | previous_candle | weak_down_break | 114 | 42.98 | 47.37 | -0.4 | -0.272 |
| ETH | 4h | previous_candle | weak_up_break | 162 | 48.15 | 43.83 | -0.1 | 0.033 |
| ETH | 4h | previous_day_high | acceptance_up | 217 | 49.77 | 40.09 | 0.08 | 0.08 |
| ETH | 4h | previous_day_high | rejection_up_sweep | 276 | 41.3 | 48.55 | -0.55 | -0.404 |
| ETH | 4h | previous_day_high | weak_up_break | 17 | 58.82 | 41.18 | -0.36 | 0.056 |
| ETH | 4h | previous_day_low | acceptance_down | 198 | 49.49 | 39.9 | -0.03 | 0.138 |
| ETH | 4h | previous_day_low | rejection_down_sweep | 241 | 44.81 | 44.4 | 0.52 | 0.288 |
| ETH | 4h | previous_day_low | weak_down_break | 26 | 38.46 | 53.85 | 0.31 | 0.102 |
| SOL | 1h | previous_candle | acceptance_down | 5263 | 43.63 | 46.65 | -0.11 | -0.052 |
| SOL | 1h | previous_candle | acceptance_up | 5471 | 43.76 | 46.97 | 0 | -0.014 |
| SOL | 1h | previous_candle | rejection_down_sweep | 6137 | 46.02 | 46.33 | 0.06 | 0.022 |
| SOL | 1h | previous_candle | rejection_up_sweep | 6209 | 46.8 | 45.51 | -0.09 | -0.056 |
| SOL | 1h | previous_candle | weak_down_break | 514 | 43.97 | 50 | -0.23 | -0.109 |
| SOL | 1h | previous_candle | weak_up_break | 603 | 43.95 | 49.25 | -0.12 | -0.108 |
| SOL | 1h | previous_day_high | acceptance_up | 257 | 41.63 | 44.75 | 0.05 | 0.08 |
| SOL | 1h | previous_day_high | rejection_up_sweep | 260 | 46.54 | 45.77 | -0.04 | -0.043 |
| SOL | 1h | previous_day_high | weak_up_break | 17 | 58.82 | 35.29 | -0.36 | -0.217 |
| SOL | 1h | previous_day_low | acceptance_down | 206 | 46.6 | 36.89 | -0.22 | -0.072 |
| SOL | 1h | previous_day_low | rejection_down_sweep | 242 | 41.74 | 47.11 | 0.02 | -0.04 |
| SOL | 1h | previous_day_low | weak_down_break | 29 | 44.83 | 48.28 | -0.41 | -0.153 |
| SOL | 1d | previous_candle | acceptance_down | 217 | 48.85 | 40.55 | -0.68 | -0.065 |
| SOL | 1d | previous_candle | acceptance_up | 248 | 47.18 | 41.13 | 1.38 | 0.29 |
| SOL | 1d | previous_candle | rejection_down_sweep | 226 | 43.36 | 49.12 | 0.87 | 0.129 |
| SOL | 1d | previous_candle | rejection_up_sweep | 257 | 50.97 | 39.3 | -0.4 | -0.045 |
| SOL | 1d | previous_candle | weak_down_break | 27 | 55.56 | 29.63 | 0.08 | 0.107 |
| SOL | 1d | previous_candle | weak_up_break | 22 | 68.18 | 27.27 | 2.2 | 0.403 |
| SOL | 4h | previous_candle | acceptance_down | 1261 | 44.49 | 45.28 | -0.29 | -0.055 |
| SOL | 4h | previous_candle | acceptance_up | 1373 | 45.08 | 44.79 | 0.3 | 0.133 |
| SOL | 4h | previous_candle | rejection_down_sweep | 1571 | 44.05 | 46.59 | 0.12 | 0.033 |
| SOL | 4h | previous_candle | rejection_up_sweep | 1595 | 45.27 | 45.08 | -0.32 | -0.108 |
| SOL | 4h | previous_candle | weak_down_break | 136 | 51.47 | 40.44 | 0.69 | 0.327 |
| SOL | 4h | previous_candle | weak_up_break | 150 | 40 | 50.67 | 0.16 | -0.059 |
| SOL | 4h | previous_day_high | acceptance_up | 255 | 43.14 | 47.06 | 0.29 | 0.128 |
| SOL | 4h | previous_day_high | rejection_up_sweep | 257 | 42.41 | 46.69 | -0.04 | -0.064 |
| SOL | 4h | previous_day_high | weak_up_break | 22 | 50 | 50 | 0.36 | 0.005 |
| SOL | 4h | previous_day_low | acceptance_down | 224 | 44.2 | 45.54 | -0.54 | -0.045 |
| SOL | 4h | previous_day_low | rejection_down_sweep | 227 | 44.05 | 48.02 | 0.22 | 0.041 |
| SOL | 4h | previous_day_low | weak_down_break | 23 | 43.48 | 47.83 | 0.71 | 0.35 |
| HYPE | 1h | previous_candle | acceptance_down | 3193 | 42.53 | 48.39 | -0.27 | -0.092 |
| HYPE | 1h | previous_candle | acceptance_up | 3410 | 41.23 | 49.77 | -0.03 | -0.004 |
| HYPE | 1h | previous_candle | rejection_down_sweep | 3672 | 45.45 | 47.52 | 0.1 | 0.042 |
| HYPE | 1h | previous_candle | rejection_up_sweep | 3720 | 47.72 | 46.18 | -0.09 | -0.045 |
| HYPE | 1h | previous_candle | weak_down_break | 324 | 48.15 | 44.75 | -0.36 | -0.258 |
| HYPE | 1h | previous_candle | weak_up_break | 356 | 41.01 | 54.49 | -0.27 | -0.082 |
| HYPE | 1h | previous_day_high | acceptance_up | 148 | 39.86 | 46.62 | 0.09 | 0.199 |
| HYPE | 1h | previous_day_high | rejection_up_sweep | 164 | 48.17 | 41.46 | 0.15 | 0.114 |
| HYPE | 1h | previous_day_high | weak_up_break | 12 | 33.33 | 50 | -0.55 | -0.332 |
| HYPE | 1h | previous_day_low | acceptance_down | 136 | 41.91 | 43.38 | -0.37 | -0.166 |
| HYPE | 1h | previous_day_low | rejection_down_sweep | 154 | 48.05 | 37.66 | 0.1 | 0.078 |
| HYPE | 1h | previous_day_low | weak_down_break | 9 | 66.67 | 33.33 | 0.41 | 0.468 |
| HYPE | 1d | previous_candle | acceptance_down | 133 | 43.61 | 41.35 | -1.41 | -0.138 |
| HYPE | 1d | previous_candle | acceptance_up | 143 | 44.06 | 43.36 | 1.12 | 0.214 |
| HYPE | 1d | previous_candle | rejection_down_sweep | 141 | 43.97 | 43.26 | 0.77 | 0.098 |
| HYPE | 1d | previous_candle | rejection_up_sweep | 158 | 43.67 | 46.84 | -1 | -0.149 |
| HYPE | 1d | previous_candle | weak_down_break | 20 | 45 | 50 | -1.72 | -0.285 |
| HYPE | 1d | previous_candle | weak_up_break | 13 | 38.46 | 53.85 | -0.85 | 0.112 |
| HYPE | 4h | previous_candle | acceptance_down | 733 | 42.84 | 48.43 | -0.75 | -0.151 |
| HYPE | 4h | previous_candle | acceptance_up | 813 | 41.45 | 48.95 | 0.5 | 0.165 |
| HYPE | 4h | previous_candle | rejection_down_sweep | 987 | 45.39 | 46.91 | 0.16 | 0.015 |
| HYPE | 4h | previous_candle | rejection_up_sweep | 997 | 44.83 | 46.84 | -0.46 | -0.13 |
| HYPE | 4h | previous_candle | weak_down_break | 90 | 52.22 | 43.33 | -0.04 | 0.094 |
| HYPE | 4h | previous_candle | weak_up_break | 82 | 41.46 | 52.44 | -0.12 | -0.051 |
| HYPE | 4h | previous_day_high | acceptance_up | 147 | 38.78 | 48.98 | 0.54 | 0.184 |
| HYPE | 4h | previous_day_high | rejection_up_sweep | 157 | 47.77 | 45.22 | 0.14 | 0.039 |
| HYPE | 4h | previous_day_high | weak_up_break | 18 | 50 | 44.44 | 0.57 | -0.152 |
| HYPE | 4h | previous_day_low | acceptance_down | 120 | 42.5 | 46.67 | -0.75 | -0.191 |
| HYPE | 4h | previous_day_low | rejection_down_sweep | 160 | 49.38 | 43.75 | 0.39 | 0.151 |
| HYPE | 4h | previous_day_low | weak_down_break | 17 | 47.06 | 52.94 | -0.1 | -0.107 |

## Read

- Candle-only acceptance/rejection is a baseline, not the final strategy.
- A planned-level/Cluster Search strategy is useful only if it improves the false-break filter versus these simple candle buckets.
- The next version should add predefined session levels such as PDH/PDL, VWAP/value approximations, and then public orderflow or ATAS-derived Cluster Search events.

## Boundary

No live alert wording, thresholds, scheduler, account/key/API/paid access, demo/testnet, live trading, order, sizing, TP/SL, execution behavior, public posting, or strategy promotion changed.
