# DEMO-SIM PDH/PDL BTC-Gated Liquidity Sweep Long

Generated: 2026-09-26T17:19:07.392Z

Status: `survives_first_kill_test`

Candidate: `pdh-pdl-btc-gated-liquidity-sweep-long`

This is the cheapest research-only kill test for the seeded PDH/PDL liquidity sweep long idea. It derives prior UTC day high/low levels from cached public OHLCV, applies the existing BTC `BTC_RISK_ON` gate, and compares sweep/reclaim holds against a touch-only hold baseline and no-trade. It does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, risk/sizing, or execution.

## Test Contract

- Primary rule: Long only when an alt 1h candle sweeps below PDL and closes back above PDL, or trades below PDH and closes back above PDH, while BTC gate is BTC_RISK_ON.
- Entry/exit: candidate candle close; 12 bars later at close.
- Cost: 4 bps fee plus 2 bps slippage per side, subtracted as fixed round-trip cost.
- Split: fit `2026-08`; forward `2026-09` with first 24h embargoed.
- Session: UTC calendar day; prior day levels require at least 12 hourly candles.

## Results

| Policy | Window | Trades | Winrate | Avg Net | Net / 10k | PF | Max DD | Embargo |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| sweep_reclaim | overall | 1066 | 37.43% | -0.21% | -22645.05 | 0.7781 | 239.44% |  |
| sweep_reclaim | fit | 225 | 39.11% | 0.17% | 3803.81 | 1.1618 | 52.00% |  |
| sweep_reclaim | forward | 99 | 60.61% | 0.71% | 7044.59 | 1.6579 | 22.48% | 6 |
| touch_baseline | overall | 2234 | 40.91% | -0.13% | -29341.85 | 0.85 | 222.62% |  |
| touch_baseline | fit | 483 | 41.61% | 0.14% | 6661.45 | 1.155 | 59.61% |  |
| touch_baseline | forward | 191 | 55.50% | 0.33% | 6260.02 | 1.2966 | 35.59% | 12 |

Forward baseline lift:

- Net PnL per 10k USD: 784.57
- Profit factor delta: 0.3613

## Forward Sweep By Symbol

| Group | Trades | Winrate | Avg Net | Net / 10k | PF | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ADA | 24 | 41.67% | -1.02% | -2456.16 | 0.4755 | 25.05% |
| XRP | 16 | 68.75% | 1.25% | 1994.69 | 2.2711 | 11.23% |
| LINK | 13 | 61.54% | 1.45% | 1888.37 | 2.609 | 7.32% |
| ETH | 12 | 50.00% | 0.05% | 62.04 | 1.053 | 4.37% |
| AVAX | 11 | 90.91% | 3.39% | 3732.77 | 83.7433 | 0.41% |
| DOGE | 9 | 55.56% | -0.37% | -333.03 | 0.7264 | 11.27% |
| BNB | 8 | 75.00% | 1.44% | 1148.42 | 5.2803 | 2.41% |
| SOL | 6 | 66.67% | 1.68% | 1007.5 | 2.7316 | 3.85% |

## Forward Sweep By Event Type

| Group | Trades | Winrate | Avg Net | Net / 10k | PF | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| pdh_reclaim_long | 97 | 59.79% | 0.70% | 6746.43 | 1.6301 | 22.79% |
| pdl_sweep_reclaim_long | 2 | 100.00% | 1.49% | 298.17 | n/a | 0.00% |

## All Sweep By Month

| Group | Trades | Winrate | Avg Net | Net / 10k | PF | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-08 | 225 | 39.11% | 0.17% | 3803.81 | 1.1618 | 52.00% |
| 2026-05 | 204 | 39.22% | -0.27% | -5457.52 | 0.5865 | 56.95% |
| 2026-04 | 202 | 33.17% | -0.47% | -9567.83 | 0.5786 | 97.81% |
| 2026-07 | 190 | 30.00% | -0.67% | -12644.19 | 0.3408 | 121.77% |
| 2026-06 | 140 | 32.86% | -0.37% | -5231.91 | 0.5696 | 56.74% |
| 2026-09 | 105 | 58.10% | 0.61% | 6452.59 | 1.5699 | 23.11% |

## Decision

The candidate survived the first cheap falsification pass, but remains research-only and requires stronger purged walk-forward, drawdown, and baseline tests before any promotion.

Queue action: Close validation item as first kill test complete; do not promote strategy.

## Limitations

- This is a mechanical 1h OHLCV-only test; no order book, trades, delta, liquidation, or volume-profile context is used.
- PDH/PDL uses UTC days only; alternate sessions are a known ambiguity and remain a kill criterion for later work.
- Fixed-hold exits are a cheap falsifier, not an optimized trading plan.
- Rows may overlap and do not reserve margin; this is not executable account simulation.
- BTC gate is a coarse MA20/MA50 proxy inherited from DEMO-SIM research outputs, not a live watcher rule.
