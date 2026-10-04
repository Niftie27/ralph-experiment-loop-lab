# DEMO-SIM Range Breakout BTC Risk-On Gate

Generated: 2026-10-04T08:04:30.202Z
Source replay: `results/historical-demo-sim-replay.json`

Status: `candidate_survives_forward_gate`

This report tests whether the strongest current DEMO-SIM pocket, `range_breakout_long`, still looks useful when restricted to explicit BTC `BTC_RISK_ON` context and checked against a simple August fit / September forward split. It is research-only and does not change live execution, keys, schedulers, TradingView automation, alert wording, thresholds, watchers, risk/sizing, or strategy promotion.

## Policy Comparison

| Policy | All Closed | All Net | All PF | Fit Net | Fit PF | Forward Closed | Forward Net | Forward PF | Forward DD | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| all_closed_replay | 489 | -6797.38 | 0.8937 | 5761.34 | 1.318 | 331 | -11889.40 | 0.7307 | 128.7% | reject_forward_weak |
| long_only_all_setups | 288 | 8338.36 | 1.2237 | 8349.37 | 1.6538 | 177 | -1000.84 | 0.9592 | 85.1% | reject_forward_weak |
| range_breakout_long_all_btc_gates | 146 | 6052.93 | 1.2922 | 7822.81 | 2.0266 | 85 | -1769.88 | 0.8648 | 49.2% | reject_forward_weak |
| range_breakout_long_btc_risk_on | 89 | 7850.62 | 1.6136 | 6562.76 | 1.9099 | 38 | 1287.86 | 1.2307 | 13.4% | candidate_survives_forward_gate |

## Selected Gate

Selected filter: `setup=range_breakout_long, direction=long, btcGate.state=BTC_RISK_ON`

Interpretation: The BTC_RISK_ON range-breakout-long pocket survives the first crude forward gate, but September forward profit is much weaker than August fit and drawdown remains too large for capital readiness.

## Selected By Month

| Group | Closed | Winrate | Net USDT | PF | Max DD | Bad R | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2026-08 | 51 | 58.8% | 6562.76 | 1.9099 | 22.7% | 0 | 5 |
| 2026-09 | 38 | 36.8% | 1287.86 | 1.2307 | 13.4% | 0 | 1 |

## Selected By Symbol And Timeframe

| Group | Closed | Winrate | Net USDT | PF | Max DD | Bad R | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ADA:4h | 9 | 66.7% | 2437.39 | 2.8476 | 10.7% | 0 | 1 |
| AVAX:4h | 12 | 58.3% | 1771.38 | 1.8958 | 7.8% | 0 | 1 |
| BNB:4h | 13 | 61.5% | 1518.31 | 2.5174 | 6.0% | 0 | 0 |
| DOGE:1h | 4 | 75.0% | 1100.86 | 4.9822 | 2.7% | 0 | 0 |
| DOGE:4h | 9 | 55.6% | 906.04 | 1.6291 | 13.4% | 0 | 1 |
| XRP:4h | 7 | 57.1% | 790.81 | 1.5847 | 9.2% | 0 | 1 |
| AVAX:1h | 3 | 66.7% | 720.72 | 6.6491 | 1.2% | 0 | 0 |
| ADA:1h | 1 | 100.0% | 423.78 | n/a | 0.0% | 0 | 0 |
| SOL:1h | 2 | 50.0% | 227.46 | 3.1224 | 1.0% | 0 | 0 |
| XRP:1h | 4 | 25.0% | -8.85 | 0.9839 | 5.2% | 0 | 0 |
| SOL:4h | 9 | 44.4% | -16.76 | 0.9884 | 8.4% | 0 | 2 |
| LINK:4h | 7 | 28.6% | -339.40 | 0.7763 | 13.6% | 0 | 0 |
| LINK:1h | 2 | 0.0% | -473.55 | 0 | 4.7% | 0 | 0 |
| ETH:4h | 3 | 0.0% | -556.79 | 0 | 5.6% | 0 | 0 |
| ETH:1h | 4 | 0.0% | -650.80 | 0 | 6.5% | 0 | 0 |

## Selected By Tier

| Group | Closed | Winrate | Net USDT | PF | Max DD | Bad R | Ambig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| low-sample | 73 | 50.7% | 6992.20 | 1.6619 | 26.9% | 0 | 5 |
| B | 10 | 60.0% | 1590.25 | 2.3606 | 4.9% | 0 | 1 |
| avoid | 3 | 33.3% | 105.36 | 1.4694 | 2.2% | 0 | 0 |
| C | 3 | 0.0% | -837.19 | 0 | 8.4% | 0 | 0 |

## Next Actions

- Do not promote to live or DEMO sizing.
- Keep short setup families quarantined until separately validated.
- Repair signal price precision before trusting R-multiple diagnostics.
- Run a purged/walk-forward filter grid before changing watcher behavior.

## Limitations

- This is a coarse two-month fit/forward split over synthetic historical replay rows.
- It does not model overlapping margin reservation, liquidation, funding, queue priority, slippage, or live order handling.
- BTC_RISK_ON is the existing replay gate state, not a newly approved live watcher rule.
- The September forward window is short and still includes rounded-price bad-R rows.
- A surviving report means research should continue, not that the strategy is capital-ready.
