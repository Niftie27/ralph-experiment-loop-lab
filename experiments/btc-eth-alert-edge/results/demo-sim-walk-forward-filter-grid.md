# DEMO-SIM Walk-Forward Filter Grid

Generated: 2026-10-04T08:04:30.300Z
Source replay: `results/historical-demo-sim-replay.json`

Status: `candidate_survives_walk_forward_grid`

This report runs a small purged walk-forward grid over existing historical DEMO-SIM replay rows. It fits simple interpretable filters before the split, excludes a 3-day boundary on each side, and checks post-purge forward behavior after fees. It is research-only and does not change live execution, keys, schedulers, TradingView automation, alert wording, thresholds, watchers, risk/sizing, or strategy promotion.

## Summary

| Closed Records | Policies Tested | Survivors | Watch | Rejected |
| ---: | ---: | ---: | ---: | ---: |
| 489 | 1008 | 14 | 3 | 991 |

## Split Contract

- Fit exits before: 2026-08-29T00:00:00.000Z
- Purged boundary: 2026-08-29T00:00:00.000Z to 2026-09-04T00:00:00.000Z
- Forward exits from: 2026-09-04T00:00:00.000Z
- Fit pass: closedTrades>=30, netPnlUsd>0, profitFactor>=1.2
- Forward pass: closedTrades>=15, netPnlUsd>0, profitFactor>=1.05, maxDrawdownPct<=25%

## Top Policies

| Policy | Verdict | Score | Fit n | Fit Net | Fit PF | Purge n | Fwd n | Fwd Net | Fwd PF | Fwd DD |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| range_breakout_long__all_directions__btc_risk_on__tf_4h__tier_b_or_low_sample | candidate_survives_walk_forward_grid | 2519.11 | 39 | 4667.33 | 1.7685 | 0 | 26 | 2351.05 | 1.6356 | 6.9% |
| range_breakout_long__long__btc_risk_on__tf_4h__tier_b_or_low_sample | candidate_survives_walk_forward_grid | 2519.11 | 39 | 4667.33 | 1.7685 | 0 | 26 | 2351.05 | 1.6356 | 6.9% |
| range_breakout_long__all_directions__btc_risk_on__tf_4h__all_tiers | candidate_survives_walk_forward_grid | 1981.065 | 39 | 4667.33 | 1.7685 | 0 | 30 | 1843.66 | 1.4065 | 6.3% |
| range_breakout_long__long__btc_risk_on__tf_4h__all_tiers | candidate_survives_walk_forward_grid | 1981.065 | 39 | 4667.33 | 1.7685 | 0 | 30 | 1843.66 | 1.4065 | 6.3% |
| range_breakout_long__all_directions__btc_risk_on__tf_4h__tier_not_avoid | candidate_survives_walk_forward_grid | 1559.695 | 39 | 4667.33 | 1.7685 | 0 | 29 | 1513.85 | 1.3337 | 6.5% |
| range_breakout_long__long__btc_risk_on__tf_4h__tier_not_avoid | candidate_survives_walk_forward_grid | 1559.695 | 39 | 4667.33 | 1.7685 | 0 | 29 | 1513.85 | 1.3337 | 6.5% |
| range_breakout_long__all_directions__btc_risk_on__all_timeframes__tier_b_or_low_sample | candidate_survives_walk_forward_grid | 1472.795 | 51 | 6562.76 | 1.9099 | 0 | 32 | 2019.69 | 1.4469 | 13.2% |
| range_breakout_long__long__btc_risk_on__all_timeframes__tier_b_or_low_sample | candidate_survives_walk_forward_grid | 1472.795 | 51 | 6562.76 | 1.9099 | 0 | 32 | 2019.69 | 1.4469 | 13.2% |
| range_breakout_long__all_directions__btc_risk_on__all_timeframes__all_tiers | candidate_survives_walk_forward_grid | 680.675 | 51 | 6562.76 | 1.9099 | 0 | 38 | 1287.86 | 1.2307 | 13.4% |
| range_breakout_long__long__btc_risk_on__all_timeframes__all_tiers | candidate_survives_walk_forward_grid | 680.675 | 51 | 6562.76 | 1.9099 | 0 | 38 | 1287.86 | 1.2307 | 13.4% |
| range_breakout_long__all_directions__btc_risk_on__all_timeframes__tier_not_avoid | candidate_survives_walk_forward_grid | 495.045 | 51 | 6562.76 | 1.9099 | 0 | 35 | 1182.50 | 1.2207 | 13.5% |
| range_breakout_long__long__btc_risk_on__all_timeframes__tier_not_avoid | candidate_survives_walk_forward_grid | 495.045 | 51 | 6562.76 | 1.9099 | 0 | 35 | 1182.50 | 1.2207 | 13.5% |
| all_setups__long__btc_risk_on__tf_4h__tier_b_or_low_sample | candidate_survives_walk_forward_grid | -118.56 | 54 | 3375.00 | 1.3871 | 2 | 37 | 1045.43 | 1.1756 | 20.9% |
| all_setups__long__btc_risk_on__tf_4h__all_tiers | candidate_survives_walk_forward_grid | -246.115 | 57 | 3383.00 | 1.3799 | 2 | 42 | 792.26 | 1.1167 | 20.3% |
| all_setups__long__btc_risk_on_or_transition__all_timeframes__tier_b_or_low_sample | watch_forward_drawdown_high | -4110.485 | 82 | 7967.56 | 1.731 | 9 | 119 | 1448.66 | 1.0845 | 65.1% |
| all_setups__long__btc_risk_on_or_transition__tf_4h__tier_b_or_low_sample | watch_forward_drawdown_high | -5178.39 | 59 | 4647.09 | 1.5048 | 9 | 101 | 892.73 | 1.0568 | 71.1% |
| all_setups__long__all_btc__all_timeframes__tier_b_or_low_sample | watch_forward_drawdown_high | -6512.81 | 88 | 8183.75 | 1.7177 | 12 | 157 | 1126.26 | 1.0514 | 85.7% |
| momentum_reversal_long__all_directions__btc_not_risk_off__tf_1h__tier_b_or_low_sample | reject_fit_sample_low | 3099.09 | 3 | 201.56 | 1.6077 | 0 | 10 | 1115.01 | 7.7582 | 1.6% |
| momentum_reversal_long__all_directions__btc_not_risk_off__tf_1h__tier_not_avoid | reject_fit_sample_low | 3099.09 | 3 | 201.56 | 1.6077 | 0 | 10 | 1115.01 | 7.7582 | 1.6% |
| momentum_reversal_long__long__btc_not_risk_off__tf_1h__tier_b_or_low_sample | reject_fit_sample_low | 3099.09 | 3 | 201.56 | 1.6077 | 0 | 10 | 1115.01 | 7.7582 | 1.6% |

## Selected Policy

`range_breakout_long__all_directions__btc_risk_on__tf_4h__tier_b_or_low_sample`

setup=range_breakout_long, all directions, btc=BTC_RISK_ON, timeframe=4h, tier=B|low-sample

Verdict: `candidate_survives_walk_forward_grid`

Interpretation: At least one simple policy survives the purged August/September walk-forward grid, but this is still research-only because the replay is synthetic, sample sizes are small, and the selected filter was chosen from a grid.

## Selected Forward By Symbol And Timeframe

| Group | Closed | Winrate | Net USDT | PF | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| AVAX:4h | 6 | 66.7% | 1280.51 | 2.286 | 8.1% |
| DOGE:4h | 5 | 60.0% | 1043.26 | 2.8048 | 5.8% |
| ADA:4h | 3 | 66.7% | 954.21 | 3.1405 | 4.5% |
| XRP:4h | 2 | 50.0% | 120.94 | 1.4467 | 2.6% |
| ETH:4h | 2 | 0.0% | -197.38 | 0 | 2.0% |
| SOL:4h | 2 | 50.0% | -208.29 | 0.0659 | 2.2% |
| LINK:4h | 1 | 0.0% | -252.06 | 0 | 2.5% |
| BNB:4h | 5 | 20.0% | -390.13 | 0.4699 | 7.1% |

## Selected Forward By Tier

| Group | Closed | Winrate | Net USDT | PF | Max DD |
| --- | ---: | ---: | ---: | ---: | ---: |
| low-sample | 24 | 45.8% | 2230.10 | 1.6506 | 7.2% |
| B | 2 | 50.0% | 120.94 | 1.4467 | 2.6% |

## Next Actions

- Do not promote to live, DEMO sizing, or watcher behavior from this grid alone.
- Freeze the top surviving policy and run a longer forward-paper or replay extension before treating it as a candidate.
- Compare the selected filter against a simple no-trade / long-only baseline on the same post-purge rows.

## Limitations

- The replay is synthetic historical DEMO-SIM evidence, not real exchange fills.
- The walk-forward split has only August/September coverage, so survivorship and multiple-testing risk remain material.
- Purged boundary rows are excluded by exit time only; overlapping position risk, funding, liquidation, queue priority, and slippage are not modeled.
- The grid intentionally uses simple interpretable filters rather than optimized parameters; a survivor is a candidate for further falsification, not a promotion.
