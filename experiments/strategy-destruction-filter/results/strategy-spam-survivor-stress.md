# Strategy Spam Survivor Stress

Generated: 2026-10-04T08:34:07.610Z
Status: research-only-strategy-spam-survivor-stress

Research-only stress pass for the single strategy-spam survivor. This does not import candidates, promote strategies, alter live/paper/demo behavior, or change schedulers.

## Decision

- Verdict: watch_only_survivor_stress_failed
- Failures: extra_20bps_round_trip_rejects, no_symbol_or_timeframe_transfer
- Candidate import: false
- Strategy promotion: false
- Scheduler/cron change: false
- Recurring lane decision: do_not_wire_recurring_until_survivor_stress_is_reviewed
- Interpretation: The spam survivor is still useful as a falsification target, but the stress pass found fragility. Keep it out of curated candidates and do not wire recurring promotion behavior around it.

## Survivor

- Variant: spam-alt-btc-gated-ma-reclaim-v0#57
- Rule: ma_reclaim
- Params: {"symbol":"SOL","timeframe":"4h","fast":20,"slow":50,"rsiFloorLong":45,"rsiCeilShort":50}

## Cases

- base_survivor: survived_research_gate; failures=none; sample=262; exp=0.1391R; PF=1.2595; OOS=0.1089R; lift=0.0357R; DD=15.2085R
- strict_btc_gate: survived_research_gate; failures=none; sample=196; exp=0.1582R; PF=1.298; OOS=0.142R; lift=0.2607R; DD=12.7317R
- double_costs: survived_research_gate; failures=none; sample=262; exp=0.0901R; PF=1.1602; OOS=0.0474R; lift=0.0357R; DD=16.1325R
- extra_10bps_round_trip: survived_research_gate; failures=none; sample=262; exp=0.1041R; PF=1.1876; OOS=0.0649R; lift=0.0357R; DD=15.8685R
- extra_20bps_round_trip: rejected; failures=weak_profit_factor; sample=262; exp=0.0691R; PF=1.1205; OOS=0.021R; lift=0.0357R; DD=16.5285R
- transfer_ETH_4h: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample; sample=274; exp=-0.1271R; PF=0.8057; OOS=-0.0237R; lift=-0.0779R; DD=47.3175R
- transfer_SOL_1h: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample; sample=1027; exp=-0.0769R; PF=0.8878; OOS=-0.0104R; lift=0.0942R; DD=99.2511R

## Base Splits

### Direction

- long: sample=150, exp=0.2302R, total=34.5347R, PF=1.452, DD=11.4036R
- short: sample=112, exp=0.0169R, total=1.897R, PF=1.0296, DD=13.3404R

### Month

- 2026-05: sample=4, exp=1.5145R, total=6.0581R, PF=n/a, DD=0R
- 2026-04: sample=4, exp=1.3932R, total=5.5727R, PF=n/a, DD=0R
- 2023-02: sample=7, exp=0.7477R, total=5.2341R, PF=3.5273, DD=2.071R
- 2022-03: sample=6, exp=0.8171R, total=4.9029R, PF=3.3326, DD=1.0522R
- 2024-04: sample=3, exp=1.555R, total=4.6649R, PF=n/a, DD=0R
- 2023-01: sample=6, exp=0.7768R, total=4.6606R, PF=3.265, DD=1.0316R
- 2024-06: sample=6, exp=0.7177R, total=4.3061R, PF=4.3233, DD=1.0804R
- 2022-04: sample=5, exp=0.8521R, total=4.2605R, PF=5.0784, DD=1.0447R
- 2023-11: sample=5, exp=0.843R, total=4.2152R, PF=4.9455, DD=1.0426R
- 2025-01: sample=5, exp=0.8401R, total=4.2007R, PF=5.1427, DD=1.014R
- 2023-05: sample=4, exp=1.0434R, total=4.1737R, PF=4.9059, DD=1.0686R
- 2026-03: sample=7, exp=0.5458R, total=3.8209R, PF=2.2053, DD=2.1312R

### Week

- 2023-W07: sample=4, exp=1.388R, total=5.552R, PF=n/a, DD=0R
- 2023-W11: sample=2, exp=1.7674R, total=3.5349R, PF=n/a, DD=0R
- 2024-W24: sample=2, exp=1.7621R, total=3.5242R, PF=n/a, DD=0R
- 2021-W51: sample=2, exp=1.7591R, total=3.5182R, PF=n/a, DD=0R
- 2023-W48: sample=2, exp=1.7557R, total=3.5114R, PF=n/a, DD=0R
- 2024-W17: sample=2, exp=1.7533R, total=3.5065R, PF=n/a, DD=0R
- 2023-W19: sample=2, exp=1.7521R, total=3.5041R, PF=n/a, DD=0R
- 2024-W42: sample=2, exp=1.7363R, total=3.4726R, PF=n/a, DD=0R
- 2024-W34: sample=2, exp=1.7362R, total=3.4724R, PF=n/a, DD=0R
- 2026-W11: sample=2, exp=1.7319R, total=3.4638R, PF=n/a, DD=0R
- 2026-W16: sample=2, exp=1.7303R, total=3.4605R, PF=n/a, DD=0R
- 2026-W01: sample=2, exp=1.7273R, total=3.4546R, PF=n/a, DD=0R

### Regime

- up|mid-vol: sample=73, exp=0.3537R, total=25.821R, PF=1.715, DD=6.4622R
- down|mid-vol: sample=44, exp=0.2758R, total=12.1351R, PF=1.5379, DD=5.7877R
- up|high-vol: sample=77, exp=0.1132R, total=8.7137R, PF=1.2163, DD=9.8693R
- down|high-vol: sample=68, exp=-0.1506R, total=-10.2381R, PF=0.7528, DD=14.368R

## Remove-Best Stresses

- remove_best_direction: removed=long, removedTotal=34.5347R, remainderSample=112, remainderExp=0.0169R, remainderTotal=1.897R
- remove_best_month: removed=2026-05, removedTotal=6.0581R, remainderSample=258, remainderExp=0.1177R, remainderTotal=30.3736R
- remove_best_week: removed=2023-W07, removedTotal=5.552R, remainderSample=258, remainderExp=0.1197R, remainderTotal=30.8797R

## Worst Loss Runs

- 2022-05-29T00:00:00.000Z to 2022-07-22T12:00:00.000Z: trades=9, net=-8.9015R, directions=long/short, regimes=down|high-vol;up|high-vol
- 2026-06-17T12:00:00.000Z to 2026-08-06T16:00:00.000Z: trades=8, net=-8.6778R, directions=long/short, regimes=down|mid-vol;up|mid-vol
- 2023-08-28T04:00:00.000Z to 2023-09-07T20:00:00.000Z: trades=5, net=-5.3584R, directions=long/short, regimes=down|mid-vol;up|mid-vol
- 2025-04-26T00:00:00.000Z to 2025-05-28T12:00:00.000Z: trades=5, net=-5.2945R, directions=long, regimes=up|mid-vol
- 2025-11-28T08:00:00.000Z to 2025-12-26T00:00:00.000Z: trades=5, net=-5.2833R, directions=long/short, regimes=down|high-vol;down|mid-vol;up|mid-vol

## Boundary

Stress output is research-only. It does not edit seed-strategies.json or any scheduler/autoresearch loop.

## Limitations

- This reruns candle-level public OHLCV backtests only; it does not model order book queueing, funding, margin, live fills, or exchange outages.
- The survivor came from a spam search, so multiple-testing and selection bias remain material even when a stress row passes.
- Symbol-transfer checks use the same simple MA reclaim/reject params, not a newly optimized symbol-specific strategy.
- BTC gate classification is a coarse candle-level regime proxy, not full TA/orderflow confirmation.

