# Strategy Destruction Filter Report

Generated: 2026-09-28T14:55:22.006Z
Status: research-only-no-live-execution.

## Totals

- Candidates: 13
- Variants tested: 131
- Survivors: 0
- Effective survivor shapes: 0
- Rejected: 131

## Gate Group Diagnostics

Reproducible grouped pass counts for auditing why headline-looking variants do or do not survive the full research gate.

- headline_pass: 12 / 131 pass
  - Passers: 12; rejected passers: 12; survivor passers: 0; pass rate: 0.0916
  - Definition: minimum sample, positive expectancy after costs, profit factor, drawdown, and worst-slice gates
- deflated_sharpe_pass: 25 / 131 pass
  - Passers: 25; rejected passers: 25; survivor passers: 0; pass rate: 0.1908
  - Definition: approximate multiple-testing deflated-Sharpe proxy clears the configured floor
- oos_pass: 21 / 131 pass
  - Passers: 21; rejected passers: 21; survivor passers: 0; pass rate: 0.1603
  - Definition: chronological out-of-sample sample and expectancy gates
- baseline_pass: 40 / 131 pass
  - Passers: 40; rejected passers: 40; survivor passers: 0; pass rate: 0.3053
  - Definition: full-sample and out-of-sample lift versus the time-matched alternating-direction baseline
- walk_forward_pass: 3 / 131 pass
  - Passers: 3; rejected passers: 3; survivor passers: 0; pass rate: 0.0229
  - Definition: equal-trade-count walk-forward diagnostics clear positive-fold and diagnostic OOS-fold checks
- psr_diagnostic_band:
  - <0.95: passers=93; rejected passers=93; survivor passers=0; pass rate=0.7099
  - >=0.95: passers=38; rejected passers=38; survivor passers=0; pass rate=0.2901
  - >=0.975: passers=34; rejected passers=34; survivor passers=0; pass rate=0.2595
  - >=0.99: passers=24; rejected passers=24; survivor passers=0; pass rate=0.1832
- effective_shape_pass: raw survivors=0; effective survivor shapes=0; representatives=none

## Survivor Shape Diagnostics

Groups raw survivor variants by identical realized metrics, split results, baseline comparison, walk-forward diagnostics, and worst slices. This prevents non-operative parameter duplicates from being counted as independent edges.

- Effective survivor shapes: 0

## Gates

- Minimum sample: 80
- Minimum out-of-sample sample: 20
- Minimum deflated Sharpe proxy: 0.35
- Minimum profit factor: 1.15
- Minimum expectancy after costs: 0.05R
- Minimum out-of-sample expectancy: 0.01R
- Minimum baseline expectancy lift: 0.01R
- Minimum out-of-sample baseline expectancy lift: 0.01R
- Maximum drawdown: 18R
- Worst-slice floor: -0.25R

## Evaluation

Data:
- BTC 1h: 43784 candles, 2021-09-29T15:00:00.000Z to 2026-09-27T23:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- BTC 4h: 10950 candles, 2021-09-29T16:00:00.000Z to 2026-09-28T12:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- ETH 1h: 43784 candles, 2021-09-29T15:00:00.000Z to 2026-09-27T23:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- ETH 4h: 10950 candles, 2021-09-29T16:00:00.000Z to 2026-09-28T12:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- SOL 1h: 43784 candles, 2021-09-29T15:00:00.000Z to 2026-09-27T23:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- SOL 4h: 10950 candles, 2021-09-29T16:00:00.000Z to 2026-09-28T12:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- XRP 1h: 43784 candles, 2021-09-29T15:00:00.000Z to 2026-09-27T23:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- XRP 4h: 10950 candles, 2021-09-29T16:00:00.000Z to 2026-09-28T12:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- DOGE 1h: 43784 candles, 2021-09-29T15:00:00.000Z to 2026-09-27T23:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- DOGE 4h: 10950 candles, 2021-09-29T16:00:00.000Z to 2026-09-28T12:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- AVAX 1h: 43784 candles, 2021-09-29T15:00:00.000Z to 2026-09-27T23:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- AVAX 4h: 10950 candles, 2021-09-29T16:00:00.000Z to 2026-09-28T12:00:00.000Z, lookback=1825d, source=binance-public-archive-rest-tail, market=spot
- HYPE 1h: 15891 candles, 2024-12-05T12:00:00.000Z to 2026-09-28T14:00:00.000Z, lookback=1825d, source=bybit-v5-linear-kline, market=linear_perpetual, features=[fundingRows=1986, candlesWithFunding=15887; openInterestRows=15890, candlesWithOpenInterestChange=15889]
- HYPE 4h: 3973 candles, 2024-12-05T12:00:00.000Z to 2026-09-28T12:00:00.000Z, lookback=1825d, source=bybit-v5-linear-kline, market=linear_perpetual, features=[fundingRows=1986, candlesWithFunding=3972; openInterestRows=3972, candlesWithOpenInterestChange=3971]

- Split: purged_embargo_entry_time, in-sample ratio 0.7, purge/embargo default to timeframe maxBars unless widened
- Baseline: time_matched_alternating_direction
- Deflated Sharpe label: approximate_multiple_testing_deflated_sharpe (approximate_proxy)
- Probabilistic Sharpe diagnostic: diagnostic_probabilistic_sharpe_proxy (psr_style_proxy)

## Anti-Overfit / Split Hygiene

- Chronological split: purged_embargo_entry_time, in-sample ratio 0.7, cutoff anchored by entry time per market/timeframe.
- Purged/embargo boundary: purge bars default to each timeframe maxBars, embargo bars default to each timeframe maxBars, candidate boundary rows=320, baseline boundary rows=320.
- Baseline: time_matched_alternating_direction; candidate and baseline rows use the same split and purged-boundary accounting.
- Walk-forward diagnostic: equal_trade_count_chronological_folds, 5 equal-trade-count chronological folds; survival still requires majority positive folds and all diagnostic OOS folds to clear the OOS gate.
- Multiple-testing guard: approximate_multiple_testing_deflated_sharpe (approximate_proxy); PSR-style probability is diagnostic-only and cannot promote a strategy by itself.
- Promotion result: survivors=0, effective survivor shapes=0; no threshold or promotion change is implied by this report.

## Verdicts

### alert-edge-avax-range-breakdown-short-v0#1

Status: rejected
Failures: weak_walk_forward_out_of_sample
Stats: sample=217, expectancy=0.1815R, profitFactor=1.3052, sharpe=1.9254, deflatedSharpe=1.5665, probabilisticSharpe=0.9817, maxDD=10.1373R
Split: inSample=139/0.2407R, outOfSample=78/0.0761R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=4/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.0043R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.196R, outOfSampleLift=0.0875R, deflatedSharpeLift=1.9365
Idea: Retest the strongest remaining AVAX liquid alert-edge B-tier bucket: AVAX 1h range breakdown short in a down/low-vol regime.

Worst slices:
- AVAX 1h down|low-vol: sample=217, expectancy=0.1815R, winRate=0.4747

### alert-edge-avax-range-breakdown-short-v0#2

Status: rejected
Failures: weak_walk_forward_out_of_sample
Stats: sample=217, expectancy=0.1815R, profitFactor=1.3052, sharpe=1.9254, deflatedSharpe=1.5665, probabilisticSharpe=0.9817, maxDD=10.1373R
Split: inSample=139/0.2407R, outOfSample=78/0.0761R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=4/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.0043R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.196R, outOfSampleLift=0.0875R, deflatedSharpeLift=1.9365
Idea: Retest the strongest remaining AVAX liquid alert-edge B-tier bucket: AVAX 1h range breakdown short in a down/low-vol regime.

Worst slices:
- AVAX 1h down|low-vol: sample=217, expectancy=0.1815R, winRate=0.4747

### perp-funding-trend-filter-fade-v0#6

Status: rejected
Failures: weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample
Stats: sample=89, expectancy=0.3203R, profitFactor=1.5926, sharpe=2.1379, deflatedSharpe=1.5346, probabilisticSharpe=1, maxDD=15.3906R
Split: inSample=56/0.6535R, outOfSample=33/-0.2451R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=0, minFoldExpectancy=-0.326R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.7753R, outOfSampleLift=0.3161R, deflatedSharpeLift=6.1989
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 1h range|mid-vol: sample=45, expectancy=-0.0213R, winRate=0.3778
- HYPE 1h range|high-vol: sample=23, expectancy=0.6725R, winRate=0.6087
- HYPE 4h range|high-vol: sample=12, expectancy=0.8347R, winRate=0.6667
- HYPE 1h range|low-vol: sample=7, expectancy=0.8735R, winRate=0.7143

### perp-funding-trend-filter-fade-v0#3

Status: rejected
Failures: weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=114, expectancy=0.2577R, profitFactor=1.462, sharpe=1.9659, deflatedSharpe=1.4629, probabilisticSharpe=0.9921, maxDD=15.3906R
Split: inSample=81/0.4626R, outOfSample=33/-0.2451R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=0, minFoldExpectancy=-0.2463R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.3117R, outOfSampleLift=-0.1697R, deflatedSharpeLift=2.2029
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 1h range|mid-vol: sample=51, expectancy=0.0756R, winRate=0.4118
- HYPE 1h range|high-vol: sample=40, expectancy=0.2291R, winRate=0.45
- HYPE 1h range|low-vol: sample=7, expectancy=0.8735R, winRate=0.7143
- HYPE 4h range|high-vol: sample=14, expectancy=0.8837R, winRate=0.7143

### perp-funding-only-fade-v0#7

Status: rejected
Failures: drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=486, expectancy=0.1005R, profitFactor=1.1683, sharpe=1.6454, deflatedSharpe=1.4279, probabilisticSharpe=1, maxDD=42.2875R
Split: inSample=377/0.1546R, outOfSample=109/-0.0864R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=0, minFoldExpectancy=-0.1173R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2896R, outOfSampleLift=-0.0771R, deflatedSharpeLift=5.1033
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 1h down|high-vol: sample=4, expectancy=-0.847R, winRate=0
- HYPE 1h down|mid-vol: sample=96, expectancy=-0.4074R, winRate=0.2396
- HYPE 4h up|high-vol: sample=47, expectancy=0.0342R, winRate=0.4255
- HYPE 1h range|mid-vol: sample=51, expectancy=0.0756R, winRate=0.4118
- HYPE 1h up|mid-vol: sample=95, expectancy=0.086R, winRate=0.4316
- HYPE 1h up|high-vol: sample=83, expectancy=0.2053R, winRate=0.4458
- HYPE 1h range|high-vol: sample=40, expectancy=0.2291R, winRate=0.45

### perp-funding-trend-filter-fade-v0#1

Status: rejected
Failures: drawdown_too_high, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_walk_forward_baseline_lift
Stats: sample=230, expectancy=0.1418R, profitFactor=1.251, sharpe=1.6145, deflatedSharpe=1.3014, probabilisticSharpe=0.8873, maxDD=32.1698R
Split: inSample=224/0.1492R, outOfSample=6/-0.1347R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=4/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=2, minFoldExpectancy=-0.8996R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1054R, outOfSampleLift=0.9334R, deflatedSharpeLift=1.0978
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 4h up|high-vol: sample=47, expectancy=0.0342R, winRate=0.4255
- HYPE 1h up|mid-vol: sample=95, expectancy=0.086R, winRate=0.4316
- HYPE 1h up|high-vol: sample=83, expectancy=0.2053R, winRate=0.4458
- HYPE 4h up|mid-vol: sample=3, expectancy=0.818R, winRate=0.6667
- HYPE 1h up|low-vol: sample=2, expectancy=1.6747R, winRate=1

### perp-funding-regime-timeframe-fade-v0#1

Status: rejected
Failures: drawdown_too_high, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift
Stats: sample=180, expectancy=0.1586R, profitFactor=1.2809, sharpe=1.5785, deflatedSharpe=1.2287, probabilisticSharpe=0.851, maxDD=32.1698R
Split: inSample=176/0.1869R, outOfSample=4/-1.0843R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=4/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=2, minFoldExpectancy=-0.4801R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1036R, outOfSampleLift=0R, deflatedSharpeLift=0.9275
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 1h up|mid-vol: sample=95, expectancy=0.086R, winRate=0.4316
- HYPE 1h up|high-vol: sample=83, expectancy=0.2053R, winRate=0.4458
- HYPE 1h up|low-vol: sample=2, expectancy=1.6747R, winRate=1

### perp-funding-trend-filter-fade-v0#12

Status: rejected
Failures: weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=82, expectancy=0.2658R, profitFactor=1.4734, sharpe=1.7041, deflatedSharpe=1.1608, probabilisticSharpe=0.8072, maxDD=15.3906R
Split: inSample=49/0.6099R, outOfSample=33/-0.2451R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.2827R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1366R, outOfSampleLift=-0.1697R, deflatedSharpeLift=0.725
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 1h range|mid-vol: sample=41, expectancy=-0.1257R, winRate=0.3415
- HYPE 4h range|high-vol: sample=10, expectancy=0.6476R, winRate=0.6
- HYPE 1h range|high-vol: sample=22, expectancy=0.7495R, winRate=0.6364
- HYPE 1h range|low-vol: sample=7, expectancy=0.8735R, winRate=0.7143

### alert-edge-avax-range-breakdown-short-v0#3

Status: rejected
Failures: weak_walk_forward_out_of_sample
Stats: sample=188, expectancy=0.1483R, profitFactor=1.2438, sharpe=1.4657, deflatedSharpe=1.1369, probabilisticSharpe=0.9987, maxDD=9.4761R
Split: inSample=119/0.1927R, outOfSample=69/0.0719R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.1912R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2981R, outOfSampleLift=0.4869R, deflatedSharpeLift=3.0106
Idea: Retest the strongest remaining AVAX liquid alert-edge B-tier bucket: AVAX 1h range breakdown short in a down/low-vol regime.

Worst slices:
- AVAX 1h down|low-vol: sample=188, expectancy=0.1483R, winRate=0.4628

### alert-edge-avax-range-breakdown-short-v0#4

Status: rejected
Failures: weak_walk_forward_out_of_sample
Stats: sample=188, expectancy=0.1483R, profitFactor=1.2438, sharpe=1.4657, deflatedSharpe=1.1369, probabilisticSharpe=0.9987, maxDD=9.4761R
Split: inSample=119/0.1927R, outOfSample=69/0.0719R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.1912R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2981R, outOfSampleLift=0.4869R, deflatedSharpeLift=3.0106
Idea: Retest the strongest remaining AVAX liquid alert-edge B-tier bucket: AVAX 1h range breakdown short in a down/low-vol regime.

Worst slices:
- AVAX 1h down|low-vol: sample=188, expectancy=0.1483R, winRate=0.4628

### perp-funding-regime-timeframe-fade-v0#7

Status: rejected
Failures: low_sample, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample
Stats: sample=75, expectancy=0.275R, profitFactor=1.4929, sharpe=1.6857, deflatedSharpe=1.1209, probabilisticSharpe=1, maxDD=15.3906R
Split: inSample=45/0.6298R, outOfSample=30/-0.2573R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=0, minFoldExpectancy=-0.3655R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.7335R, outOfSampleLift=0.2544R, deflatedSharpeLift=5.5222
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 1h range|mid-vol: sample=45, expectancy=-0.0213R, winRate=0.3778
- HYPE 1h range|high-vol: sample=23, expectancy=0.6725R, winRate=0.6087
- HYPE 1h range|low-vol: sample=7, expectancy=0.8735R, winRate=0.7143

### alert-edge-avax-range-breakdown-short-v0#5

Status: rejected
Failures: weak_walk_forward_out_of_sample
Stats: sample=186, expectancy=0.1322R, profitFactor=1.2134, sharpe=1.2943, deflatedSharpe=0.9831, probabilisticSharpe=0.9959, maxDD=10.1841R
Split: inSample=116/0.1784R, outOfSample=70/0.0556R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=5/5, positiveOosFolds=1, minFoldExpectancy=-0.1157R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.264R, outOfSampleLift=0.2R, deflatedSharpeLift=2.6332
Idea: Retest the strongest remaining AVAX liquid alert-edge B-tier bucket: AVAX 1h range breakdown short in a down/low-vol regime.

Worst slices:
- AVAX 1h down|low-vol: sample=186, expectancy=0.1322R, winRate=0.457

### alert-edge-avax-range-breakdown-short-v0#6

Status: rejected
Failures: weak_walk_forward_out_of_sample
Stats: sample=186, expectancy=0.1322R, profitFactor=1.2134, sharpe=1.2943, deflatedSharpe=0.9831, probabilisticSharpe=0.9959, maxDD=10.1841R
Split: inSample=116/0.1784R, outOfSample=70/0.0556R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=5/5, positiveOosFolds=1, minFoldExpectancy=-0.1157R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.264R, outOfSampleLift=0.2R, deflatedSharpeLift=2.6332
Idea: Retest the strongest remaining AVAX liquid alert-edge B-tier bucket: AVAX 1h range breakdown short in a down/low-vol regime.

Worst slices:
- AVAX 1h down|low-vol: sample=186, expectancy=0.1322R, winRate=0.457

### perp-funding-only-fade-v0#5

Status: rejected
Failures: weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=409, expectancy=0.0766R, profitFactor=1.1272, sharpe=1.1585, deflatedSharpe=0.9587, probabilisticSharpe=0.9947, maxDD=35.6311R
Split: inSample=336/0.1379R, outOfSample=73/-0.2057R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.3004R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1641R, outOfSampleLift=-0.2086R, deflatedSharpeLift=2.5482
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 1h down|high-vol: sample=4, expectancy=-0.847R, winRate=0
- HYPE 1h down|mid-vol: sample=66, expectancy=-0.4422R, winRate=0.2273
- HYPE 4h down|high-vol: sample=14, expectancy=-0.0908R, winRate=0.4286
- HYPE 4h up|high-vol: sample=46, expectancy=-0.0034R, winRate=0.413
- HYPE 1h range|high-vol: sample=36, expectancy=0.0582R, winRate=0.3889
- HYPE 1h up|mid-vol: sample=91, expectancy=0.1063R, winRate=0.4396
- HYPE 1h range|mid-vol: sample=40, expectancy=0.1832R, winRate=0.45

### perp-funding-trend-filter-fade-v0#9

Status: rejected
Failures: weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=103, expectancy=0.1904R, profitFactor=1.3241, sharpe=1.3793, deflatedSharpe=0.9475, probabilisticSharpe=0.9996, maxDD=15.3906R
Split: inSample=70/0.3957R, outOfSample=33/-0.2451R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=4/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.4332R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.435R, outOfSampleLift=-0.4243R, deflatedSharpeLift=3.4253
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 1h range|mid-vol: sample=45, expectancy=-0.0853R, winRate=0.3556
- HYPE 1h range|high-vol: sample=38, expectancy=0.2949R, winRate=0.4737
- HYPE 4h range|high-vol: sample=11, expectancy=0.7506R, winRate=0.6364
- HYPE 1h range|low-vol: sample=7, expectancy=0.8735R, winRate=0.7143

### perp-funding-regime-timeframe-fade-v0#3

Status: rejected
Failures: weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=98, expectancy=0.1953R, profitFactor=1.3338, sharpe=1.3809, deflatedSharpe=0.9378, probabilisticSharpe=0.8988, maxDD=15.3906R
Split: inSample=68/0.395R, outOfSample=30/-0.2573R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.2648R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1792R, outOfSampleLift=-0.28R, deflatedSharpeLift=1.1381
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 1h range|mid-vol: sample=51, expectancy=0.0756R, winRate=0.4118
- HYPE 1h range|high-vol: sample=40, expectancy=0.2291R, winRate=0.45
- HYPE 1h range|low-vol: sample=7, expectancy=0.8735R, winRate=0.7143

### perp-funding-regime-timeframe-fade-v0#15

Status: rejected
Failures: low_sample, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=70, expectancy=0.2493R, profitFactor=1.4388, sharpe=1.4764, deflatedSharpe=0.933, probabilisticSharpe=0.8267, maxDD=15.3906R
Split: inSample=40/0.6292R, outOfSample=30/-0.2573R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.315R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.16R, outOfSampleLift=-0.28R, deflatedSharpeLift=0.7971
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 1h range|mid-vol: sample=41, expectancy=-0.1257R, winRate=0.3415
- HYPE 1h range|high-vol: sample=22, expectancy=0.7495R, winRate=0.6364
- HYPE 1h range|low-vol: sample=7, expectancy=0.8735R, winRate=0.7143

### perp-funding-only-fade-v0#1

Status: rejected
Failures: weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=579, expectancy=0.0557R, profitFactor=1.0913, sharpe=1.0058, deflatedSharpe=0.8464, probabilisticSharpe=0.9942, maxDD=52.3706R
Split: inSample=420/0.1439R, outOfSample=159/-0.1772R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=1, minFoldExpectancy=-0.3239R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1357R, outOfSampleLift=-0.0831R, deflatedSharpeLift=2.5354
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 1h up|low-vol: sample=2, expectancy=-1.1372R, winRate=0
- HYPE 4h range|mid-vol: sample=3, expectancy=-0.787R, winRate=0
- HYPE 1h range|low-vol: sample=14, expectancy=-0.4269R, winRate=0.2857
- HYPE 1h range|mid-vol: sample=72, expectancy=-0.263R, winRate=0.2917
- HYPE 1h down|mid-vol: sample=135, expectancy=-0.2059R, winRate=0.3111
- HYPE 4h up|high-vol: sample=46, expectancy=-0.0034R, winRate=0.413
- HYPE 1h range|high-vol: sample=36, expectancy=0.0582R, winRate=0.3889
- HYPE 4h down|high-vol: sample=27, expectancy=0.0874R, winRate=0.4444

### perp-funding-only-fade-v0#3

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=756, expectancy=0.0374R, profitFactor=1.0603, sharpe=0.7717, deflatedSharpe=0.6423, probabilisticSharpe=0.9789, maxDD=82.1501R
Split: inSample=502/0.1308R, outOfSample=254/-0.147R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.1887R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0965R, outOfSampleLift=0.0192R, deflatedSharpeLift=2.0428
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 1h range|low-vol: sample=28, expectancy=-0.4839R, winRate=0.25
- HYPE 4h range|mid-vol: sample=6, expectancy=-0.4568R, winRate=0.1667
- HYPE 1h up|low-vol: sample=7, expectancy=-0.3344R, winRate=0.2857
- HYPE 1h range|mid-vol: sample=97, expectancy=-0.2858R, winRate=0.2887
- HYPE 1h down|mid-vol: sample=200, expectancy=-0.1586R, winRate=0.325
- HYPE 4h up|high-vol: sample=47, expectancy=0.0342R, winRate=0.4255
- HYPE 4h down|high-vol: sample=41, expectancy=0.1388R, winRate=0.4634
- HYPE 1h down|high-vol: sample=17, expectancy=0.1654R, winRate=0.4118

### perp-funding-regime-timeframe-fade-v0#9

Status: rejected
Failures: drawdown_too_high, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=135, expectancy=0.1097R, profitFactor=1.1918, sharpe=0.9602, deflatedSharpe=0.6342, probabilisticSharpe=0.9778, maxDD=32.1698R
Split: inSample=131/0.1461R, outOfSample=4/-1.0843R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.8008R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2221R, outOfSampleLift=-1.4R, deflatedSharpeLift=1.9946
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 1h up|mid-vol: sample=61, expectancy=-0.0041R, winRate=0.4098
- HYPE 1h up|high-vol: sample=72, expectancy=0.1626R, winRate=0.4306
- HYPE 1h up|low-vol: sample=2, expectancy=1.6747R, winRate=1

### perp-funding-regime-timeframe-fade-v0#11

Status: rejected
Failures: weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=90, expectancy=0.1498R, profitFactor=1.2486, sharpe=1.0183, deflatedSharpe=0.6104, probabilisticSharpe=1, maxDD=15.3906R
Split: inSample=60/0.3533R, outOfSample=30/-0.2573R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.485R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.56R, outOfSampleLift=-0.28R, deflatedSharpeLift=4.7505
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 1h range|mid-vol: sample=45, expectancy=-0.0853R, winRate=0.3556
- HYPE 1h range|high-vol: sample=38, expectancy=0.2949R, winRate=0.4737
- HYPE 1h range|low-vol: sample=7, expectancy=0.8735R, winRate=0.7143

### alert-edge-avax-range-breakdown-short-v0#7

Status: rejected
Failures: weak_profit_factor, weak_walk_forward_out_of_sample
Stats: sample=165, expectancy=0.09R, profitFactor=1.1414, sharpe=0.8327, deflatedSharpe=0.5497, probabilisticSharpe=0.9793, maxDD=11.5709R
Split: inSample=103/0.1268R, outOfSample=62/0.0288R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=4/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.3004R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2157R, outOfSampleLift=0.0649R, deflatedSharpeLift=2.0675
Idea: Retest the strongest remaining AVAX liquid alert-edge B-tier bucket: AVAX 1h range breakdown short in a down/low-vol regime.

Worst slices:
- AVAX 1h down|low-vol: sample=165, expectancy=0.09R, winRate=0.4424

### alert-edge-avax-range-breakdown-short-v0#8

Status: rejected
Failures: weak_profit_factor, weak_walk_forward_out_of_sample
Stats: sample=165, expectancy=0.09R, profitFactor=1.1414, sharpe=0.8327, deflatedSharpe=0.5497, probabilisticSharpe=0.9793, maxDD=11.5709R
Split: inSample=103/0.1268R, outOfSample=62/0.0288R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=4/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.3004R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2157R, outOfSampleLift=0.0649R, deflatedSharpeLift=2.0675
Idea: Retest the strongest remaining AVAX liquid alert-edge B-tier bucket: AVAX 1h range breakdown short in a down/low-vol regime.

Worst slices:
- AVAX 1h down|low-vol: sample=165, expectancy=0.09R, winRate=0.4424

### perp-funding-regime-timeframe-fade-v0#4

Status: rejected
Failures: low_sample, bad_failure_slice, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample
Stats: sample=16, expectancy=0.6403R, profitFactor=2.6323, sharpe=1.8551, deflatedSharpe=0.5253, probabilisticSharpe=0.9992, maxDD=6.2762R
Split: inSample=13/0.8164R, outOfSample=3/-0.1226R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=0, minFoldExpectancy=-1.0353R
Baseline: method=time_matched_alternating_direction, expectancyLift=1.1237R, outOfSampleLift=0.9333R, deflatedSharpeLift=3.5226
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h range|high-vol: sample=14, expectancy=0.8837R, winRate=0.7143

### perp-funding-only-fade-v0#15

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=417, expectancy=0.0367R, profitFactor=1.0592, sharpe=0.5625, deflatedSharpe=0.3978, probabilisticSharpe=0.9818, maxDD=42.2875R
Split: inSample=308/0.0803R, outOfSample=109/-0.0864R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.1512R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1336R, outOfSampleLift=-0.0852R, deflatedSharpeLift=2.1419
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 1h down|high-vol: sample=4, expectancy=-0.847R, winRate=0
- HYPE 1h down|mid-vol: sample=95, expectancy=-0.4301R, winRate=0.2316
- HYPE 4h up|high-vol: sample=38, expectancy=-0.1103R, winRate=0.3684
- HYPE 1h range|mid-vol: sample=45, expectancy=-0.0853R, winRate=0.3556
- HYPE 1h up|mid-vol: sample=61, expectancy=-0.0041R, winRate=0.4098
- HYPE 1h up|high-vol: sample=72, expectancy=0.1626R, winRate=0.4306

### perp-funding-trend-filter-fade-v0#7

Status: rejected
Failures: weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=174, expectancy=0.055R, profitFactor=1.0934, sharpe=0.5555, deflatedSharpe=0.3004, probabilisticSharpe=0.9758, maxDD=32.1698R
Split: inSample=168/0.0617R, outOfSample=6/-0.1347R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.6208R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1884R, outOfSampleLift=-0.9333R, deflatedSharpeLift=2.0415
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h up|high-vol: sample=38, expectancy=-0.1103R, winRate=0.3684
- HYPE 1h up|mid-vol: sample=61, expectancy=-0.0041R, winRate=0.4098
- HYPE 1h up|high-vol: sample=72, expectancy=0.1626R, winRate=0.4306
- HYPE 1h up|low-vol: sample=2, expectancy=1.6747R, winRate=1

### perp-funding-regime-timeframe-fade-v0#8

Status: rejected
Failures: low_sample, deflated_sharpe_fail, bad_failure_slice, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample
Stats: sample=14, expectancy=0.5635R, profitFactor=2.257, sharpe=1.4575, deflatedSharpe=0.2139, probabilisticSharpe=0.995, maxDD=6.2762R
Split: inSample=11/0.7506R, outOfSample=3/-0.1226R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=0, minFoldExpectancy=-1.0372R
Baseline: method=time_matched_alternating_direction, expectancyLift=1R, outOfSampleLift=0.9333R, deflatedSharpeLift=2.7882
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h range|high-vol: sample=12, expectancy=0.8347R, winRate=0.6667

### alert-edge-doge-momentum-reversal-long-v0#9

Status: rejected
Failures: weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_walk_forward_out_of_sample
Stats: sample=141, expectancy=0.0505R, profitFactor=1.0768, sharpe=0.4304, deflatedSharpe=0.1546, probabilisticSharpe=0.8482, maxDD=18.4736R
Split: inSample=98/-0.0188R, outOfSample=43/0.2083R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.3415R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1192R, outOfSampleLift=0.1954R, deflatedSharpeLift=1.0381
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=141, expectancy=0.0505R, winRate=0.4326

### perp-funding-oi-fade-v0#3

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=126, expectancy=0.044R, profitFactor=1.0727, sharpe=0.3723, deflatedSharpe=0.0835, probabilisticSharpe=0.9445, maxDD=13.342R
Split: inSample=97/0.1409R, outOfSample=29/-0.2804R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.4029R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1819R, outOfSampleLift=-0.1443R, deflatedSharpeLift=1.6675
Idea: Fade crowded perp moves when funding is stretched, open interest expands, and RSI is extended.

Worst slices:
- HYPE 1h range|mid-vol: sample=12, expectancy=-0.6142R, winRate=0.1667
- HYPE 4h down|high-vol: sample=6, expectancy=-0.4873R, winRate=0.1667
- HYPE 4h range|mid-vol: sample=1, expectancy=-0.2336R, winRate=0
- HYPE 1h range|high-vol: sample=7, expectancy=-0.2289R, winRate=0.2857
- HYPE 1h up|high-vol: sample=23, expectancy=-0.19R, winRate=0.3478
- HYPE 1h down|mid-vol: sample=24, expectancy=0.0042R, winRate=0.375
- HYPE 1h up|mid-vol: sample=18, expectancy=0.2532R, winRate=0.5
- HYPE 4h up|high-vol: sample=21, expectancy=0.259R, winRate=0.4762

### alert-edge-doge-momentum-reversal-long-v0#13

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=107, expectancy=0.0482R, profitFactor=1.0735, sharpe=0.3586, deflatedSharpe=0.0457, probabilisticSharpe=0.4493, maxDD=10.6162R
Split: inSample=77/0.007R, outOfSample=30/0.1539R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.2156R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0168R, outOfSampleLift=-0.3733R, deflatedSharpeLift=-0.1195
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=107, expectancy=0.0482R, winRate=0.4299

### perp-funding-regime-timeframe-fade-v0#12

Status: rejected
Failures: low_sample, deflated_sharpe_fail, bad_failure_slice, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=13, expectancy=0.4715R, profitFactor=1.9766, sharpe=1.1625, deflatedSharpe=-0.0044, probabilisticSharpe=0.1198, maxDD=6.2762R
Split: inSample=10/0.6497R, outOfSample=3/-0.1226R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-1.0372R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.4308R, outOfSampleLift=-1.8667R, deflatedSharpeLift=-0.6366
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h range|high-vol: sample=11, expectancy=0.7506R, winRate=0.6364

### perp-funding-only-fade-v0#8

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=379, expectancy=0.01R, profitFactor=1.0157, sharpe=0.1462, deflatedSharpe=-0.0153, probabilisticSharpe=0.614, maxDD=46.6666R
Split: inSample=270/0.049R, outOfSample=109/-0.0864R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=0, minFoldExpectancy=-0.2851R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0197R, outOfSampleLift=0.2636R, deflatedSharpeLift=0.2895
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 1h down|mid-vol: sample=95, expectancy=-0.4301R, winRate=0.2316
- HYPE 4h up|high-vol: sample=36, expectancy=-0.3724R, winRate=0.25
- HYPE 1h down|high-vol: sample=1, expectancy=-0.2864R, winRate=0
- HYPE 1h up|mid-vol: sample=66, expectancy=-0.0834R, winRate=0.3788
- HYPE 1h range|mid-vol: sample=45, expectancy=-0.0213R, winRate=0.3778
- HYPE 1h up|high-vol: sample=46, expectancy=0.0244R, winRate=0.3913
- HYPE 4h down|high-vol: sample=20, expectancy=0.2102R, winRate=0.5

### perp-funding-regime-timeframe-fade-v0#2

Status: rejected
Failures: low_sample, weak_profit_factor, deflated_sharpe_fail, low_out_of_sample_sample, weak_walk_forward_baseline_lift
Stats: sample=50, expectancy=0.0813R, profitFactor=1.1436, sharpe=0.4477, deflatedSharpe=-0.0202, probabilisticSharpe=0.7331, maxDD=17.8706R
Split: inSample=48/0.0111R, outOfSample=2/1.7644R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=2, minFoldExpectancy=-1.0344R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.112R, outOfSampleLift=2.8R, deflatedSharpeLift=0.6028
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 4h up|high-vol: sample=47, expectancy=0.0342R, winRate=0.4255
- HYPE 4h up|mid-vol: sample=3, expectancy=0.818R, winRate=0.6667

### alert-edge-doge-momentum-reversal-long-v0#1

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=101, expectancy=0.0345R, profitFactor=1.0522, sharpe=0.2498, deflatedSharpe=-0.0673, probabilisticSharpe=0.5801, maxDD=14.2016R
Split: inSample=73/0.0316R, outOfSample=28/0.0421R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=1, minFoldExpectancy=-0.4397R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.028R, outOfSampleLift=-0.2R, deflatedSharpeLift=0.1977
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=101, expectancy=0.0345R, winRate=0.4257

### perp-funding-only-fade-v0#9

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=510, expectancy=-0.0025R, profitFactor=0.996, sharpe=-0.0433, deflatedSharpe=-0.1818, probabilisticSharpe=0.2029, maxDD=59.0967R
Split: inSample=351/0.0766R, outOfSample=159/-0.1772R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=1, minFoldExpectancy=-0.3823R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0491R, outOfSampleLift=-0.2292R, deflatedSharpeLift=-0.8127
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 1h up|low-vol: sample=2, expectancy=-1.1372R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h range|mid-vol: sample=3, expectancy=-0.787R, winRate=0
- HYPE 1h range|low-vol: sample=14, expectancy=-0.4269R, winRate=0.2857
- HYPE 1h range|mid-vol: sample=66, expectancy=-0.4036R, winRate=0.2424
- HYPE 1h down|mid-vol: sample=134, expectancy=-0.2205R, winRate=0.306
- HYPE 4h up|high-vol: sample=37, expectancy=-0.161R, winRate=0.3514
- HYPE 1h range|high-vol: sample=34, expectancy=0.1216R, winRate=0.4118

### alert-edge-avax-trend-pullback-reclaim-long-v0#1

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=617, expectancy=-0.0032R, profitFactor=0.995, sharpe=-0.0594, deflatedSharpe=-0.1853, probabilisticSharpe=0.4802, maxDD=56.1718R
Split: inSample=427/0.0496R, outOfSample=190/-0.1219R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.1882R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0027R, outOfSampleLift=-0.0979R, deflatedSharpeLift=-0.0499
Idea: Retest the remaining AVAX liquid alert-edge B-tier bucket: AVAX 1h trend pullback reclaim long in an up/mid-vol regime.

Worst slices:
- AVAX 1h up|mid-vol: sample=617, expectancy=-0.0032R, winRate=0.389

### alert-edge-doge-momentum-reversal-long-v0#5

Status: rejected
Failures: low_sample, weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, low_out_of_sample_sample, weak_walk_forward_out_of_sample
Stats: sample=57, expectancy=0.0431R, profitFactor=1.0657, sharpe=0.2335, deflatedSharpe=-0.1895, probabilisticSharpe=0.8028, maxDD=15.0836R
Split: inSample=43/-0.0905R, outOfSample=14/0.4535R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.8846R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.155R, outOfSampleLift=0.2R, deflatedSharpeLift=0.888
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=57, expectancy=0.0431R, winRate=0.4211

### perp-funding-regime-timeframe-fade-v0#16

Status: rejected
Failures: low_sample, deflated_sharpe_fail, bad_failure_slice, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=12, expectancy=0.3623R, profitFactor=1.6928, sharpe=0.8533, deflatedSharpe=-0.2463, probabilisticSharpe=0.5001, maxDD=6.2762R
Split: inSample=9/0.524R, outOfSample=3/-0.1226R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-1.0388R
Baseline: method=time_matched_alternating_direction, expectancyLift=0R, outOfSampleLift=0.9333R, deflatedSharpeLift=0.0002
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h range|high-vol: sample=10, expectancy=0.6476R, winRate=0.6

### alert-edge-xrp-range-breakout-v0#3

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high
Stats: sample=132, expectancy=0.0018R, profitFactor=1.0028, sharpe=0.0154, deflatedSharpe=-0.2574, probabilisticSharpe=0.9721, maxDD=24.9469R
Split: inSample=71/-0.1783R, outOfSample=61/0.2114R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=2, minFoldExpectancy=-0.5298R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2102R, outOfSampleLift=0.2997R, deflatedSharpeLift=2.1045
Idea: Retest the strongest current liquid alert-edge B-tier bucket: XRP 4h range breakout long in an up/mid-vol regime.

Worst slices:
- XRP 4h up|mid-vol: sample=132, expectancy=0.0018R, winRate=0.3864

### perp-funding-only-fade-v0#13

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=340, expectancy=-0.0066R, profitFactor=0.9896, sharpe=-0.0922, deflatedSharpe=-0.2621, probabilisticSharpe=0.2059, maxDD=38.9725R
Split: inSample=267/0.0479R, outOfSample=73/-0.2057R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.3238R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0599R, outOfSampleLift=-0.2607R, deflatedSharpeLift=-0.802
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 1h down|high-vol: sample=4, expectancy=-0.847R, winRate=0
- HYPE 1h down|mid-vol: sample=65, expectancy=-0.4759R, winRate=0.2154
- HYPE 4h up|high-vol: sample=37, expectancy=-0.161R, winRate=0.3514
- HYPE 4h down|high-vol: sample=13, expectancy=-0.0186R, winRate=0.4615
- HYPE 1h range|mid-vol: sample=34, expectancy=-0.0108R, winRate=0.3824
- HYPE 1h up|mid-vol: sample=57, expectancy=0.022R, winRate=0.4211

### perp-funding-only-fade-v0#11

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=687, expectancy=-0.0076R, profitFactor=0.988, sharpe=-0.1511, deflatedSharpe=-0.271, probabilisticSharpe=0.9476, maxDD=90.1375R
Split: inSample=433/0.0741R, outOfSample=254/-0.147R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.3242R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0802R, outOfSampleLift=-0.019R, deflatedSharpeLift=1.6972
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 1h range|low-vol: sample=28, expectancy=-0.4839R, winRate=0.25
- HYPE 4h range|mid-vol: sample=6, expectancy=-0.4568R, winRate=0.1667
- HYPE 1h range|mid-vol: sample=91, expectancy=-0.3893R, winRate=0.2527
- HYPE 1h up|low-vol: sample=7, expectancy=-0.3344R, winRate=0.2857
- HYPE 1h down|mid-vol: sample=199, expectancy=-0.1682R, winRate=0.3216
- HYPE 4h up|high-vol: sample=38, expectancy=-0.1103R, winRate=0.3684
- HYPE 4h range|high-vol: sample=23, expectancy=0.0534R, winRate=0.4348

### alert-edge-doge-momentum-reversal-long-v0#11

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_walk_forward_out_of_sample
Stats: sample=118, expectancy=-0.0014R, profitFactor=0.9979, sharpe=-0.0111, deflatedSharpe=-0.2998, probabilisticSharpe=0.963, maxDD=21.6495R
Split: inSample=82/-0.0726R, outOfSample=36/0.1607R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.4546R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2193R, outOfSampleLift=0.0778R, deflatedSharpeLift=1.9739
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=118, expectancy=-0.0014R, winRate=0.4153

### alert-edge-xrp-range-breakout-v0#1

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift
Stats: sample=154, expectancy=-0.0118R, profitFactor=0.9819, sharpe=-0.1091, deflatedSharpe=-0.3623, probabilisticSharpe=0.2961, maxDD=32.3309R
Split: inSample=86/-0.2137R, outOfSample=68/0.2435R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=2, minFoldExpectancy=-0.4367R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0589R, outOfSampleLift=0.1865R, deflatedSharpeLift=-0.5278
Idea: Retest the strongest current liquid alert-edge B-tier bucket: XRP 4h range breakout long in an up/mid-vol regime.

Worst slices:
- XRP 4h up|mid-vol: sample=154, expectancy=-0.0118R, winRate=0.3831

### perp-funding-oi-fade-v0#4

Status: rejected
Failures: low_sample, weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, bad_failure_slice, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=69, expectancy=0.0025R, profitFactor=1.004, sharpe=0.0155, deflatedSharpe=-0.3632, probabilisticSharpe=0.5561, maxDD=9.8281R
Split: inSample=50/0.2004R, outOfSample=19/-0.5185R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=1, minFoldExpectancy=-0.7233R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0227R, outOfSampleLift=-0.8359R, deflatedSharpeLift=0.1434
Idea: Fade crowded perp moves when funding is stretched, open interest expands, and RSI is extended.

Worst slices:
- HYPE 1h range|mid-vol: sample=7, expectancy=-0.6796R, winRate=0.1429
- HYPE 4h down|high-vol: sample=4, expectancy=-0.33R, winRate=0.25
- HYPE 4h range|mid-vol: sample=1, expectancy=-0.2336R, winRate=0
- HYPE 1h up|high-vol: sample=12, expectancy=-0.2293R, winRate=0.3333
- HYPE 1h down|mid-vol: sample=12, expectancy=-0.1496R, winRate=0.3333
- HYPE 1h range|high-vol: sample=5, expectancy=0.0913R, winRate=0.4
- HYPE 4h up|high-vol: sample=15, expectancy=0.2161R, winRate=0.4667
- HYPE 1h up|mid-vol: sample=6, expectancy=0.3436R, winRate=0.5

### perp-funding-regime-timeframe-fade-v0#5

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift
Stats: sample=114, expectancy=-0.0091R, profitFactor=0.9855, sharpe=-0.0737, deflatedSharpe=-0.3678, probabilisticSharpe=0.0667, maxDD=26.2254R
Split: inSample=110/0.03R, outOfSample=4/-1.0843R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=2, minFoldExpectancy=-0.742R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1874R, outOfSampleLift=0R, deflatedSharpeLift=-1.3857
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 1h up|mid-vol: sample=66, expectancy=-0.0834R, winRate=0.3788
- HYPE 1h up|high-vol: sample=46, expectancy=0.0244R, winRate=0.3913
- HYPE 1h up|low-vol: sample=2, expectancy=1.6747R, winRate=1

### alert-edge-doge-momentum-reversal-long-v0#15

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=93, expectancy=-0.0124R, profitFactor=0.9817, sharpe=-0.0868, deflatedSharpe=-0.413, probabilisticSharpe=0.9407, maxDD=16.4643R
Split: inSample=67/-0.0714R, outOfSample=26/0.1394R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.3555R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2155R, outOfSampleLift=0R, deflatedSharpeLift=1.7478
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=93, expectancy=-0.0124R, winRate=0.4086

### alert-edge-xrp-range-breakout-v0#2

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift
Stats: sample=138, expectancy=-0.0169R, profitFactor=0.9743, sharpe=-0.1478, deflatedSharpe=-0.416, probabilisticSharpe=0.4312, maxDD=26.8319R
Split: inSample=76/-0.2227R, outOfSample=62/0.2354R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=2, minFoldExpectancy=-0.4483R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0199R, outOfSampleLift=0.2825R, deflatedSharpeLift=-0.1758
Idea: Retest the strongest current liquid alert-edge B-tier bucket: XRP 4h range breakout long in an up/mid-vol regime.

Worst slices:
- XRP 4h up|mid-vol: sample=138, expectancy=-0.0169R, winRate=0.3841

### alert-edge-doge-momentum-reversal-long-v0#7

Status: rejected
Failures: low_sample, weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, low_out_of_sample_sample, weak_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=52, expectancy=-0.0052R, profitFactor=0.9923, sharpe=-0.0269, deflatedSharpe=-0.4642, probabilisticSharpe=0.4291, maxDD=17.294R
Split: inSample=38/-0.1742R, outOfSample=14/0.4535R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=1, minFoldExpectancy=-0.8597R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0345R, outOfSampleLift=0.4R, deflatedSharpeLift=-0.178
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=52, expectancy=-0.0052R, winRate=0.4038

### perp-funding-only-fade-v0#23

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=376, expectancy=-0.0204R, profitFactor=0.9682, sharpe=-0.2998, deflatedSharpe=-0.4646, probabilisticSharpe=0.1898, maxDD=54.2394R
Split: inSample=267/0.0065R, outOfSample=109/-0.0864R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.1877R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0608R, outOfSampleLift=-0.0771R, deflatedSharpeLift=-0.8737
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 1h down|high-vol: sample=4, expectancy=-0.847R, winRate=0
- HYPE 1h down|mid-vol: sample=95, expectancy=-0.4301R, winRate=0.2316
- HYPE 1h range|mid-vol: sample=37, expectancy=-0.3243R, winRate=0.2703
- HYPE 1h up|mid-vol: sample=43, expectancy=-0.2742R, winRate=0.3256
- HYPE 4h up|high-vol: sample=33, expectancy=-0.183R, winRate=0.3333
- HYPE 1h up|high-vol: sample=67, expectancy=0.2306R, winRate=0.4478

### alert-edge-xrp-range-breakout-v0#4

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift
Stats: sample=119, expectancy=-0.029R, profitFactor=0.9563, sharpe=-0.2353, deflatedSharpe=-0.5267, probabilisticSharpe=0.7812, maxDD=21.5425R
Split: inSample=63/-0.2116R, outOfSample=56/0.1765R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=2, minFoldExpectancy=-0.4844R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0931R, outOfSampleLift=0.3265R, deflatedSharpeLift=0.847
Idea: Retest the strongest current liquid alert-edge B-tier bucket: XRP 4h range breakout long in an up/mid-vol regime.

Worst slices:
- XRP 4h up|mid-vol: sample=119, expectancy=-0.029R, winRate=0.3782

### perp-funding-only-fade-v0#2

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample
Stats: sample=472, expectancy=-0.0271R, profitFactor=0.958, sharpe=-0.4465, deflatedSharpe=-0.5974, probabilisticSharpe=0.9869, maxDD=65.0096R
Split: inSample=313/0.0492R, outOfSample=159/-0.1772R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.3616R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1305R, outOfSampleLift=0.096R, deflatedSharpeLift=2.3944
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 1h up|low-vol: sample=2, expectancy=-1.1372R, winRate=0
- HYPE 4h range|mid-vol: sample=3, expectancy=-0.787R, winRate=0
- HYPE 4h up|high-vol: sample=35, expectancy=-0.4334R, winRate=0.2286
- HYPE 1h range|low-vol: sample=14, expectancy=-0.4269R, winRate=0.2857
- HYPE 1h range|mid-vol: sample=66, expectancy=-0.3599R, winRate=0.2576
- HYPE 1h down|mid-vol: sample=134, expectancy=-0.2205R, winRate=0.306
- HYPE 1h up|high-vol: sample=45, expectancy=-0.0142R, winRate=0.3778
- HYPE 4h down|high-vol: sample=26, expectancy=0.0549R, winRate=0.4231

### alert-edge-doge-momentum-reversal-long-v0#2

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample
Stats: sample=140, expectancy=-0.0386R, profitFactor=0.9443, sharpe=-0.3325, deflatedSharpe=-0.6045, probabilisticSharpe=0.9924, maxDD=21.8306R
Split: inSample=101/-0.0504R, outOfSample=39/-0.0081R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.4514R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2648R, outOfSampleLift=0.5026R, deflatedSharpeLift=2.7609
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=140, expectancy=-0.0386R, winRate=0.4

### perp-funding-only-fade-v0#4

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=649, expectancy=-0.0258R, profitFactor=0.9602, sharpe=-0.4965, deflatedSharpe=-0.6265, probabilisticSharpe=0.8249, maxDD=96.0504R
Split: inSample=395/0.0521R, outOfSample=254/-0.147R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=4/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.2994R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0477R, outOfSampleLift=-0.0557R, deflatedSharpeLift=0.9847
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 1h range|low-vol: sample=28, expectancy=-0.4839R, winRate=0.25
- HYPE 4h range|mid-vol: sample=6, expectancy=-0.4568R, winRate=0.1667
- HYPE 4h up|high-vol: sample=36, expectancy=-0.3724R, winRate=0.25
- HYPE 1h range|mid-vol: sample=91, expectancy=-0.3576R, winRate=0.2637
- HYPE 1h up|low-vol: sample=7, expectancy=-0.3344R, winRate=0.2857
- HYPE 1h down|mid-vol: sample=199, expectancy=-0.1682R, winRate=0.3216
- HYPE 1h up|high-vol: sample=46, expectancy=0.0244R, winRate=0.3913
- HYPE 1h up|mid-vol: sample=92, expectancy=0.0902R, winRate=0.4348

### alert-edge-doge-momentum-reversal-long-v0#3

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=88, expectancy=-0.0458R, profitFactor=0.934, sharpe=-0.3129, deflatedSharpe=-0.6557, probabilisticSharpe=0.8812, maxDD=15.9719R
Split: inSample=63/-0.0928R, outOfSample=25/0.0725R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=1, minFoldExpectancy=-0.6464R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1668R, outOfSampleLift=0.224R, deflatedSharpeLift=1.343
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=88, expectancy=-0.0458R, winRate=0.3977

### perp-funding-only-fade-v0#16

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=334, expectancy=-0.039R, profitFactor=0.9404, sharpe=-0.5394, deflatedSharpe=-0.7225, probabilisticSharpe=0.8932, maxDD=54.6629R
Split: inSample=225/-0.016R, outOfSample=109/-0.0864R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.3511R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.088R, outOfSampleLift=0.2554R, deflatedSharpeLift=1.3492
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h up|high-vol: sample=30, expectancy=-0.513R, winRate=0.2
- HYPE 1h down|mid-vol: sample=95, expectancy=-0.4301R, winRate=0.2316
- HYPE 1h down|high-vol: sample=1, expectancy=-0.2864R, winRate=0
- HYPE 1h up|mid-vol: sample=46, expectancy=-0.1423R, winRate=0.3696
- HYPE 1h range|mid-vol: sample=41, expectancy=-0.1257R, winRate=0.3415
- HYPE 1h up|high-vol: sample=37, expectancy=-0.0944R, winRate=0.3514

### perp-funding-only-fade-v0#6

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=302, expectancy=-0.0455R, profitFactor=0.9304, sharpe=-0.6007, deflatedSharpe=-0.7963, probabilisticSharpe=0.8488, maxDD=44.9381R
Split: inSample=229/0.0056R, outOfSample=73/-0.2057R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=0, minFoldExpectancy=-0.4633R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0768R, outOfSampleLift=0.2439R, deflatedSharpeLift=1.1237
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 1h down|mid-vol: sample=65, expectancy=-0.4759R, winRate=0.2154
- HYPE 4h up|high-vol: sample=35, expectancy=-0.4334R, winRate=0.2286
- HYPE 1h down|high-vol: sample=1, expectancy=-0.2864R, winRate=0
- HYPE 4h down|high-vol: sample=13, expectancy=-0.1694R, winRate=0.3846
- HYPE 1h up|mid-vol: sample=62, expectancy=-0.0644R, winRate=0.3871
- HYPE 1h up|high-vol: sample=45, expectancy=-0.0142R, winRate=0.3778
- HYPE 1h range|mid-vol: sample=34, expectancy=0.0739R, winRate=0.4118

### alert-edge-doge-momentum-reversal-long-v0#6

Status: rejected
Failures: low_sample, weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_walk_forward_out_of_sample
Stats: sample=76, expectancy=-0.0688R, profitFactor=0.9021, sharpe=-0.438, deflatedSharpe=-0.8155, probabilisticSharpe=0.7925, maxDD=22.0121R
Split: inSample=56/-0.1844R, outOfSample=20/0.2551R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.5793R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1237R, outOfSampleLift=0.28R, deflatedSharpeLift=0.9373
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=76, expectancy=-0.0688R, winRate=0.3816

### alert-edge-doge-momentum-reversal-long-v0#14

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=147, expectancy=-0.0662R, profitFactor=0.9057, sharpe=-0.5878, deflatedSharpe=-0.8677, probabilisticSharpe=0.8931, maxDD=21.7086R
Split: inSample=105/-0.0857R, outOfSample=42/-0.0174R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=0, minFoldExpectancy=-0.2961R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1358R, outOfSampleLift=0.0666R, deflatedSharpeLift=1.4067
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=147, expectancy=-0.0662R, winRate=0.3878

### alert-edge-sol-trend-pullback-reclaim-long-v0#1

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=365, expectancy=-0.0505R, profitFactor=0.9269, sharpe=-0.7097, deflatedSharpe=-0.8929, probabilisticSharpe=0.919, maxDD=45.7886R
Split: inSample=186/-0.1324R, outOfSample=179/0.0345R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.2334R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0983R, outOfSampleLift=0.1978R, deflatedSharpeLift=1.523
Idea: Retest the next untested liquid alert-edge B-tier bucket: SOL 1h trend pullback reclaim long in an up/low-vol regime.

Worst slices:
- SOL 1h up|low-vol: sample=365, expectancy=-0.0505R, winRate=0.4027

### perp-funding-regime-timeframe-fade-v0#13

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=85, expectancy=-0.0787R, profitFactor=0.8772, sharpe=-0.5685, deflatedSharpe=-0.9357, probabilisticSharpe=0.9645, maxDD=26.2254R
Split: inSample=81/-0.029R, outOfSample=4/-1.0843R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.806R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2306R, outOfSampleLift=-1.4R, deflatedSharpeLift=2.1609
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 1h up|mid-vol: sample=46, expectancy=-0.1423R, winRate=0.3696
- HYPE 1h up|high-vol: sample=37, expectancy=-0.0944R, winRate=0.3514
- HYPE 1h up|low-vol: sample=2, expectancy=1.6747R, winRate=1

### alert-edge-doge-momentum-reversal-long-v0#4

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=122, expectancy=-0.081R, profitFactor=0.8859, sharpe=-0.6557, deflatedSharpe=-0.9686, probabilisticSharpe=0.9896, maxDD=22.1785R
Split: inSample=88/-0.1105R, outOfSample=34/-0.0046R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=0, minFoldExpectancy=-0.4776R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2643R, outOfSampleLift=0.4118R, deflatedSharpeLift=2.7105
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=122, expectancy=-0.081R, winRate=0.3852

### perp-funding-only-fade-v0#19

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=646, expectancy=-0.0437R, profitFactor=0.9329, sharpe=-0.8453, deflatedSharpe=-0.9886, probabilisticSharpe=0.0495, maxDD=95.415R
Split: inSample=392/0.0232R, outOfSample=254/-0.147R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.3159R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0869R, outOfSampleLift=0.0192R, deflatedSharpeLift=-1.6674
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 1h range|mid-vol: sample=83, expectancy=-0.5251R, winRate=0.2048
- HYPE 1h range|low-vol: sample=28, expectancy=-0.4839R, winRate=0.25
- HYPE 4h range|mid-vol: sample=6, expectancy=-0.4568R, winRate=0.1667
- HYPE 1h up|low-vol: sample=7, expectancy=-0.3344R, winRate=0.2857
- HYPE 4h up|high-vol: sample=33, expectancy=-0.183R, winRate=0.3333
- HYPE 1h down|mid-vol: sample=199, expectancy=-0.1682R, winRate=0.3216
- HYPE 4h range|high-vol: sample=21, expectancy=-0.1098R, winRate=0.381

### perp-funding-only-fade-v0#17

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=469, expectancy=-0.0518R, profitFactor=0.9203, sharpe=-0.859, deflatedSharpe=-1.0279, probabilisticSharpe=0.9489, maxDD=66.1537R
Split: inSample=310/0.0126R, outOfSample=159/-0.1772R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=0, minFoldExpectancy=-0.3774R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0952R, outOfSampleLift=-0.0831R, deflatedSharpeLift=1.7799
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 1h up|low-vol: sample=2, expectancy=-1.1372R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h range|mid-vol: sample=3, expectancy=-0.787R, winRate=0
- HYPE 1h range|mid-vol: sample=58, expectancy=-0.5999R, winRate=0.1724
- HYPE 1h range|low-vol: sample=14, expectancy=-0.4269R, winRate=0.2857
- HYPE 4h up|high-vol: sample=32, expectancy=-0.2438R, winRate=0.3125
- HYPE 1h down|mid-vol: sample=134, expectancy=-0.2205R, winRate=0.306
- HYPE 1h range|high-vol: sample=33, expectancy=0.0721R, winRate=0.3939

### perp-funding-trend-filter-fade-v0#4

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift
Stats: sample=153, expectancy=-0.0783R, profitFactor=0.8799, sharpe=-0.7522, deflatedSharpe=-1.0391, probabilisticSharpe=0.2796, maxDD=28.8416R
Split: inSample=147/-0.076R, outOfSample=6/-0.1347R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=2, minFoldExpectancy=-0.7367R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0621R, outOfSampleLift=0R, deflatedSharpeLift=-0.6293
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 4h up|high-vol: sample=36, expectancy=-0.3724R, winRate=0.25
- HYPE 1h up|mid-vol: sample=66, expectancy=-0.0834R, winRate=0.3788
- HYPE 1h up|high-vol: sample=46, expectancy=0.0244R, winRate=0.3913
- HYPE 4h up|mid-vol: sample=3, expectancy=0.818R, winRate=0.6667
- HYPE 1h up|low-vol: sample=2, expectancy=1.6747R, winRate=1

### perp-funding-trend-filter-fade-v0#11

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=136, expectancy=-0.086R, profitFactor=0.8739, sharpe=-0.7588, deflatedSharpe=-1.0638, probabilisticSharpe=0.1701, maxDD=35.4224R
Split: inSample=66/-0.1692R, outOfSample=70/-0.0075R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=1, minFoldExpectancy=-0.5333R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1108R, outOfSampleLift=0.0797R, deflatedSharpeLift=-1.0093
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 1h down|mid-vol: sample=95, expectancy=-0.4301R, winRate=0.2316
- HYPE 1h down|high-vol: sample=1, expectancy=-0.2864R, winRate=0
- HYPE 4h down|high-vol: sample=19, expectancy=0.2755R, winRate=0.5263
- HYPE 4h down|mid-vol: sample=5, expectancy=0.6231R, winRate=0.6
- HYPE 1h down|low-vol: sample=16, expectancy=1.3191R, winRate=0.875

### perp-funding-trend-filter-fade-v0#5

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=137, expectancy=-0.0928R, profitFactor=0.8643, sharpe=-0.8241, deflatedSharpe=-1.134, probabilisticSharpe=0.3148, maxDD=36.4512R
Split: inSample=67/-0.182R, outOfSample=70/-0.0075R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=1, minFoldExpectancy=-0.5521R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0554R, outOfSampleLift=0.0524R, deflatedSharpeLift=-0.5294
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 1h down|mid-vol: sample=95, expectancy=-0.4301R, winRate=0.2316
- HYPE 1h down|high-vol: sample=1, expectancy=-0.2864R, winRate=0
- HYPE 4h down|high-vol: sample=20, expectancy=0.2102R, winRate=0.5
- HYPE 4h down|mid-vol: sample=5, expectancy=0.6231R, winRate=0.6
- HYPE 1h down|low-vol: sample=16, expectancy=1.3191R, winRate=0.875

### perp-funding-trend-filter-fade-v0#2

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=142, expectancy=-0.0925R, profitFactor=0.8643, sharpe=-0.839, deflatedSharpe=-1.1448, probabilisticSharpe=0.1336, maxDD=35.5201R
Split: inSample=72/-0.1753R, outOfSample=70/-0.0075R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=1, minFoldExpectancy=-0.5673R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1257R, outOfSampleLift=0.0797R, deflatedSharpeLift=-1.1743
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 1h down|high-vol: sample=4, expectancy=-0.847R, winRate=0
- HYPE 1h down|mid-vol: sample=96, expectancy=-0.4074R, winRate=0.2396
- HYPE 4h down|high-vol: sample=21, expectancy=0.2446R, winRate=0.5238
- HYPE 4h down|mid-vol: sample=5, expectancy=0.6231R, winRate=0.6
- HYPE 1h down|low-vol: sample=16, expectancy=1.3191R, winRate=0.875

### alert-edge-doge-momentum-reversal-long-v0#8

Status: rejected
Failures: low_sample, weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, low_out_of_sample_sample, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=69, expectancy=-0.1224R, profitFactor=0.8309, sharpe=-0.7505, deflatedSharpe=-1.1791, probabilisticSharpe=0.7053, maxDD=23.0774R
Split: inSample=50/-0.2382R, outOfSample=19/0.1822R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=1, minFoldExpectancy=-0.74R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0875R, outOfSampleLift=0.2947R, deflatedSharpeLift=0.6446
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=69, expectancy=-0.1224R, winRate=0.3623

### perp-funding-only-fade-v0#12

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=604, expectancy=-0.0556R, profitFactor=0.9155, sharpe=-1.0402, deflatedSharpe=-1.1981, probabilisticSharpe=0.8832, maxDD=104.0467R
Split: inSample=350/0.0108R, outOfSample=254/-0.147R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=0, minFoldExpectancy=-0.2406R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0618R, outOfSampleLift=-0.0939R, deflatedSharpeLift=1.2873
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h up|high-vol: sample=30, expectancy=-0.513R, winRate=0.2
- HYPE 1h range|low-vol: sample=28, expectancy=-0.4839R, winRate=0.25
- HYPE 4h range|mid-vol: sample=6, expectancy=-0.4568R, winRate=0.1667
- HYPE 1h range|mid-vol: sample=87, expectancy=-0.4223R, winRate=0.2414
- HYPE 1h up|low-vol: sample=7, expectancy=-0.3344R, winRate=0.2857
- HYPE 1h down|mid-vol: sample=199, expectancy=-0.1682R, winRate=0.3216
- HYPE 1h up|high-vol: sample=37, expectancy=-0.0944R, winRate=0.3514

### perp-funding-trend-filter-fade-v0#8

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=140, expectancy=-0.099R, profitFactor=0.8554, sharpe=-0.8928, deflatedSharpe=-1.206, probabilisticSharpe=0.8251, maxDD=34.4914R
Split: inSample=70/-0.1906R, outOfSample=70/-0.0075R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.6512R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.102R, outOfSampleLift=0.2489R, deflatedSharpeLift=1.0836
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 1h down|high-vol: sample=4, expectancy=-0.847R, winRate=0
- HYPE 1h down|mid-vol: sample=95, expectancy=-0.4301R, winRate=0.2316
- HYPE 4h down|high-vol: sample=20, expectancy=0.3082R, winRate=0.55
- HYPE 4h down|mid-vol: sample=5, expectancy=0.6231R, winRate=0.6
- HYPE 1h down|low-vol: sample=16, expectancy=1.3191R, winRate=0.875

### perp-funding-regime-timeframe-fade-v0#10

Status: rejected
Failures: low_sample, weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, low_out_of_sample_sample, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=39, expectancy=-0.1344R, profitFactor=0.7918, sharpe=-0.6853, deflatedSharpe=-1.2482, probabilisticSharpe=0.6462, maxDD=21.6314R
Split: inSample=37/-0.237R, outOfSample=2/1.7644R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-1.0318R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0717R, outOfSampleLift=0R, deflatedSharpeLift=0.4697
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h up|high-vol: sample=38, expectancy=-0.1103R, winRate=0.3684

### perp-funding-only-fade-v0#10

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=427, expectancy=-0.0694R, profitFactor=0.8947, sharpe=-1.1001, deflatedSharpe=-1.2917, probabilisticSharpe=0.8826, maxDD=73.0059R
Split: inSample=268/-0.0054R, outOfSample=159/-0.1772R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=1, minFoldExpectancy=-0.485R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0742R, outOfSampleLift=-0.0501R, deflatedSharpeLift=1.3063
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 1h up|low-vol: sample=2, expectancy=-1.1372R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h range|mid-vol: sample=3, expectancy=-0.787R, winRate=0
- HYPE 4h up|high-vol: sample=29, expectancy=-0.5915R, winRate=0.1724
- HYPE 1h range|mid-vol: sample=62, expectancy=-0.4508R, winRate=0.2258
- HYPE 1h range|low-vol: sample=14, expectancy=-0.4269R, winRate=0.2857
- HYPE 1h down|mid-vol: sample=134, expectancy=-0.2205R, winRate=0.306
- HYPE 1h up|high-vol: sample=36, expectancy=-0.1459R, winRate=0.3333

### alert-edge-doge-momentum-reversal-long-v0#16

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=127, expectancy=-0.1163R, profitFactor=0.8391, sharpe=-0.968, deflatedSharpe=-1.3051, probabilisticSharpe=0.1636, maxDD=28.1835R
Split: inSample=92/-0.1183R, outOfSample=35/-0.111R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=1, minFoldExpectancy=-0.4762R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.121R, outOfSampleLift=-0.56R, deflatedSharpeLift=-1.0651
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=127, expectancy=-0.1163R, winRate=0.3701

### perp-funding-only-fade-v0#21

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=299, expectancy=-0.0844R, profitFactor=0.8723, sharpe=-1.1279, deflatedSharpe=-1.3592, probabilisticSharpe=0.4755, maxDD=58.4477R
Split: inSample=226/-0.0452R, outOfSample=73/-0.2057R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=0, minFoldExpectancy=-0.5291R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0044R, outOfSampleLift=-0.2086R, deflatedSharpeLift=-0.0679
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 1h down|high-vol: sample=4, expectancy=-0.847R, winRate=0
- HYPE 1h down|mid-vol: sample=65, expectancy=-0.4759R, winRate=0.2154
- HYPE 1h range|mid-vol: sample=26, expectancy=-0.328R, winRate=0.2692
- HYPE 1h up|mid-vol: sample=39, expectancy=-0.2637R, winRate=0.3333
- HYPE 4h up|high-vol: sample=32, expectancy=-0.2438R, winRate=0.3125
- HYPE 4h down|high-vol: sample=11, expectancy=-0.013R, winRate=0.4545

### alert-edge-doge-momentum-reversal-long-v0#10

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_walk_forward_out_of_sample
Stats: sample=205, expectancy=-0.1088R, profitFactor=0.8495, sharpe=-1.1473, deflatedSharpe=-1.4288, probabilisticSharpe=0.9158, maxDD=34.9068R
Split: inSample=141/-0.1683R, outOfSample=64/0.0224R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.403R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.1259R, outOfSampleLift=0.175R, deflatedSharpeLift=1.5794
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=205, expectancy=-0.1088R, winRate=0.3756

### alert-edge-doge-momentum-reversal-long-v0#12

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=168, expectancy=-0.1281R, profitFactor=0.8247, sharpe=-1.2263, deflatedSharpe=-1.5461, probabilisticSharpe=0.471, maxDD=36.4097R
Split: inSample=116/-0.1488R, outOfSample=52/-0.0818R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.49R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0084R, outOfSampleLift=-0.1077R, deflatedSharpeLift=-0.0832
Idea: Retest the next untested liquid alert-edge B-tier bucket: DOGE 1h momentum reversal long in a range/low-vol regime.

Worst slices:
- DOGE 1h range|low-vol: sample=168, expectancy=-0.1281R, winRate=0.369

### perp-funding-only-fade-v0#24

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=312, expectancy=-0.097R, profitFactor=0.8566, sharpe=-1.3138, deflatedSharpe=-1.5555, probabilisticSharpe=0.5695, maxDD=62.9533R
Split: inSample=203/-0.1026R, outOfSample=109/-0.0864R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.5356R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0125R, outOfSampleLift=0.2554R, deflatedSharpeLift=0.1955
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h up|high-vol: sample=27, expectancy=-0.5068R, winRate=0.1852
- HYPE 1h up|mid-vol: sample=35, expectancy=-0.491R, winRate=0.2571
- HYPE 1h down|mid-vol: sample=95, expectancy=-0.4301R, winRate=0.2316
- HYPE 1h range|mid-vol: sample=36, expectancy=-0.3042R, winRate=0.2778
- HYPE 1h down|high-vol: sample=1, expectancy=-0.2864R, winRate=0
- HYPE 1h up|high-vol: sample=37, expectancy=-0.0944R, winRate=0.3514

### perp-funding-only-fade-v0#14

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=257, expectancy=-0.1189R, profitFactor=0.8246, sharpe=-1.4814, deflatedSharpe=-1.7641, probabilisticSharpe=0.996, maxDD=55.1287R
Split: inSample=184/-0.0845R, outOfSample=73/-0.2057R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=0, minFoldExpectancy=-0.471R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2006R, outOfSampleLift=0.1918R, deflatedSharpeLift=3.0788
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h up|high-vol: sample=29, expectancy=-0.5915R, winRate=0.1724
- HYPE 1h down|mid-vol: sample=65, expectancy=-0.4759R, winRate=0.2154
- HYPE 1h down|high-vol: sample=1, expectancy=-0.2864R, winRate=0
- HYPE 1h up|high-vol: sample=36, expectancy=-0.1459R, winRate=0.3333
- HYPE 1h up|mid-vol: sample=42, expectancy=-0.1199R, winRate=0.381
- HYPE 4h down|high-vol: sample=12, expectancy=-0.0978R, winRate=0.4167

### perp-funding-only-fade-v0#20

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=582, expectancy=-0.0873R, profitFactor=0.8697, sharpe=-1.6155, deflatedSharpe=-1.8122, probabilisticSharpe=0.6543, maxDD=104.8423R
Split: inSample=328/-0.0411R, outOfSample=254/-0.147R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.2122R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0203R, outOfSampleLift=-0.0939R, deflatedSharpeLift=0.4347
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 1h range|mid-vol: sample=82, expectancy=-0.5187R, winRate=0.2073
- HYPE 4h up|high-vol: sample=27, expectancy=-0.5068R, winRate=0.1852
- HYPE 1h range|low-vol: sample=28, expectancy=-0.4839R, winRate=0.25
- HYPE 4h range|mid-vol: sample=6, expectancy=-0.4568R, winRate=0.1667
- HYPE 1h up|low-vol: sample=7, expectancy=-0.3344R, winRate=0.2857
- HYPE 4h range|high-vol: sample=20, expectancy=-0.2043R, winRate=0.35
- HYPE 1h down|mid-vol: sample=199, expectancy=-0.1682R, winRate=0.3216

### perp-funding-oi-fade-v0#2

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=265, expectancy=-0.1205R, profitFactor=0.8189, sharpe=-1.553, deflatedSharpe=-1.8385, probabilisticSharpe=0.0211, maxDD=45.4956R
Split: inSample=191/-0.093R, outOfSample=74/-0.1916R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.3102R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1646R, outOfSampleLift=-0.3282R, deflatedSharpeLift=-2.1826
Idea: Fade crowded perp moves when funding is stretched, open interest expands, and RSI is extended.

Worst slices:
- HYPE 1h down|low-vol: sample=1, expectancy=-1.1208R, winRate=0
- HYPE 4h down|mid-vol: sample=1, expectancy=-1.0475R, winRate=0
- HYPE 1h up|low-vol: sample=5, expectancy=-0.573R, winRate=0.2
- HYPE 1h up|high-vol: sample=39, expectancy=-0.5386R, winRate=0.2051
- HYPE 1h range|mid-vol: sample=24, expectancy=-0.4963R, winRate=0.2083
- HYPE 4h down|high-vol: sample=5, expectancy=-0.4721R, winRate=0.2
- HYPE 4h range|mid-vol: sample=4, expectancy=-0.1554R, winRate=0.25
- HYPE 1h down|mid-vol: sample=12, expectancy=-0.1496R, winRate=0.3333

### perp-funding-only-fade-v0#18

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=405, expectancy=-0.1157R, profitFactor=0.829, sharpe=-1.8079, deflatedSharpe=-2.0601, probabilisticSharpe=0.9376, maxDD=76.543R
Split: inSample=246/-0.0759R, outOfSample=159/-0.1772R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=3/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.5176R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0971R, outOfSampleLift=-0.0501R, deflatedSharpeLift=1.7351
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 1h up|low-vol: sample=2, expectancy=-1.1372R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h range|mid-vol: sample=3, expectancy=-0.787R, winRate=0
- HYPE 4h up|high-vol: sample=26, expectancy=-0.5941R, winRate=0.1538
- HYPE 1h range|mid-vol: sample=57, expectancy=-0.592R, winRate=0.1754
- HYPE 1h range|low-vol: sample=14, expectancy=-0.4269R, winRate=0.2857
- HYPE 1h down|mid-vol: sample=134, expectancy=-0.2205R, winRate=0.306
- HYPE 1h up|high-vol: sample=36, expectancy=-0.1459R, winRate=0.3333

### perp-funding-regime-timeframe-fade-v0#6

Status: rejected
Failures: low_sample, weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, low_out_of_sample_sample, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=39, expectancy=-0.2808R, profitFactor=0.6128, sharpe=-1.4564, deflatedSharpe=-2.1835, probabilisticSharpe=0.9694, maxDD=22.1325R
Split: inSample=37/-0.3914R, outOfSample=2/1.7644R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=1, minFoldExpectancy=-1.0327R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.3041R, outOfSampleLift=0R, deflatedSharpeLift=2.7772
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 4h up|high-vol: sample=36, expectancy=-0.3724R, winRate=0.25
- HYPE 4h up|mid-vol: sample=3, expectancy=0.818R, winRate=0.6667

### perp-funding-trend-filter-fade-v0#10

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, low_out_of_sample_sample, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=116, expectancy=-0.1994R, profitFactor=0.7097, sharpe=-1.7516, deflatedSharpe=-2.2151, probabilisticSharpe=0.9934, maxDD=32.3161R
Split: inSample=110/-0.2029R, outOfSample=6/-0.1347R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=2/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=1, minFoldExpectancy=-0.9817R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2488R, outOfSampleLift=-0.9333R, deflatedSharpeLift=3.1547
Idea: Fade stretched HYPE funding only inside one explicit market trend regime to test whether funding edge is regime-dependent.

Worst slices:
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h up|high-vol: sample=30, expectancy=-0.513R, winRate=0.2
- HYPE 1h up|mid-vol: sample=46, expectancy=-0.1423R, winRate=0.3696
- HYPE 1h up|high-vol: sample=37, expectancy=-0.0944R, winRate=0.3514
- HYPE 1h up|low-vol: sample=2, expectancy=1.6747R, winRate=1

### perp-funding-only-fade-v0#22

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=235, expectancy=-0.2034R, profitFactor=0.7135, sharpe=-2.4866, deflatedSharpe=-2.8995, probabilisticSharpe=0.9997, maxDD=68.837R
Split: inSample=162/-0.2023R, outOfSample=73/-0.2057R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=3/5, positiveOosFolds=0, minFoldExpectancy=-0.5368R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2518R, outOfSampleLift=0.1918R, deflatedSharpeLift=4.1392
Idea: Fade HYPE perp moves when funding is stretched and RSI confirms positioning stress, without requiring open-interest expansion.

Worst slices:
- HYPE 4h range|mid-vol: sample=2, expectancy=-1.0638R, winRate=0
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h up|high-vol: sample=26, expectancy=-0.5941R, winRate=0.1538
- HYPE 1h up|mid-vol: sample=31, expectancy=-0.5057R, winRate=0.2581
- HYPE 1h down|mid-vol: sample=65, expectancy=-0.4759R, winRate=0.2154
- HYPE 1h range|mid-vol: sample=25, expectancy=-0.2991R, winRate=0.28
- HYPE 1h down|high-vol: sample=1, expectancy=-0.2864R, winRate=0
- HYPE 1h up|high-vol: sample=36, expectancy=-0.1459R, winRate=0.3333

### perp-funding-oi-fade-v0#1

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=526, expectancy=-0.1726R, profitFactor=0.7505, sharpe=-3.1576, deflatedSharpe=-3.491, probabilisticSharpe=0.0417, maxDD=101.4063R
Split: inSample=383/-0.1541R, outOfSample=143/-0.2224R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.3374R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0977R, outOfSampleLift=-0.1349R, deflatedSharpeLift=-1.9723
Idea: Fade crowded perp moves when funding is stretched, open interest expands, and RSI is extended.

Worst slices:
- HYPE 4h down|mid-vol: sample=1, expectancy=-1.0475R, winRate=0
- HYPE 4h down|high-vol: sample=8, expectancy=-0.6254R, winRate=0.125
- HYPE 1h up|low-vol: sample=14, expectancy=-0.5335R, winRate=0.2143
- HYPE 1h range|mid-vol: sample=50, expectancy=-0.5198R, winRate=0.2
- HYPE 1h range|high-vol: sample=20, expectancy=-0.3571R, winRate=0.25
- HYPE 1h up|high-vol: sample=70, expectancy=-0.3508R, winRate=0.2857
- HYPE 4h up|mid-vol: sample=29, expectancy=-0.2413R, winRate=0.2759
- HYPE 1h up|mid-vol: sample=172, expectancy=-0.1626R, winRate=0.3372

### alert-feedback-eth-velocity-fade-v0#8

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=936, expectancy=-0.1508R, profitFactor=0.7874, sharpe=-3.551, deflatedSharpe=-3.827, probabilisticSharpe=0.0051, maxDD=161.9218R
Split: inSample=677/-0.1453R, outOfSample=259/-0.1654R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.3R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1126R, outOfSampleLift=-0.1622R, deflatedSharpeLift=-2.8271
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=124, expectancy=-0.2697R, winRate=0.3387
- ETH 1h down|mid-vol: sample=373, expectancy=-0.211R, winRate=0.3217
- ETH 1h down|low-vol: sample=209, expectancy=-0.1113R, winRate=0.3876
- ETH 1h range|mid-vol: sample=141, expectancy=-0.077R, winRate=0.3688
- ETH 1h up|mid-vol: sample=22, expectancy=-0.0738R, winRate=0.3636
- ETH 1h down|high-vol: sample=38, expectancy=0.0165R, winRate=0.3947
- ETH 1h up|low-vol: sample=25, expectancy=0.1322R, winRate=0.48
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#7

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=718, expectancy=-0.1833R, profitFactor=0.7457, sharpe=-3.8188, deflatedSharpe=-4.1546, probabilisticSharpe=0.0006, maxDD=149.365R
Split: inSample=521/-0.1687R, outOfSample=197/-0.2217R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.3025R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1634R, outOfSampleLift=-0.163R, deflatedSharpeLift=-3.6347
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=87, expectancy=-0.3767R, winRate=0.3103
- ETH 1h down|mid-vol: sample=298, expectancy=-0.2664R, winRate=0.302
- ETH 1h down|low-vol: sample=176, expectancy=-0.1709R, winRate=0.3693
- ETH 1h down|high-vol: sample=36, expectancy=-0.0024R, winRate=0.3889
- ETH 1h range|mid-vol: sample=102, expectancy=0.0107R, winRate=0.402
- ETH 1h up|mid-vol: sample=4, expectancy=0.305R, winRate=0.5
- ETH 1h range|high-vol: sample=2, expectancy=0.3542R, winRate=0.5
- ETH 1h up|low-vol: sample=13, expectancy=0.5941R, winRate=0.6923

### perp-funding-regime-timeframe-fade-v0#14

Status: rejected
Failures: low_sample, weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, low_out_of_sample_sample, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=31, expectancy=-0.5302R, profitFactor=0.3468, sharpe=-2.8866, deflatedSharpe=-4.1824, probabilisticSharpe=0.9942, maxDD=25.1627R
Split: inSample=29/-0.6885R, outOfSample=2/1.7644R
Purged boundary: candidate=0, baseline=0
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-1.0328R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.2991R, outOfSampleLift=0R, deflatedSharpeLift=5.0891
Idea: Fade stretched HYPE funding only on one timeframe and one trend regime after trend-filter results suggested 4h/range slices may be unstable.

Worst slices:
- HYPE 4h up|mid-vol: sample=1, expectancy=-1.0469R, winRate=0
- HYPE 4h up|high-vol: sample=30, expectancy=-0.513R, winRate=0.2

### alert-feedback-eth-velocity-fade-v0#13

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=594, expectancy=-0.2071R, profitFactor=0.7171, sharpe=-3.943, deflatedSharpe=-4.3228, probabilisticSharpe=0.0042, maxDD=141.8741R
Split: inSample=426/-0.1872R, outOfSample=168/-0.2573R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.3063R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.145R, outOfSampleLift=-0.1171R, deflatedSharpeLift=-3.0188
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=61, expectancy=-0.5165R, winRate=0.2623
- ETH 1h down|mid-vol: sample=260, expectancy=-0.2944R, winRate=0.2885
- ETH 1h down|low-vol: sample=131, expectancy=-0.1877R, winRate=0.3588
- ETH 1h range|mid-vol: sample=96, expectancy=-0.0455R, winRate=0.375
- ETH 1h down|high-vol: sample=33, expectancy=0.0068R, winRate=0.3939
- ETH 1h range|high-vol: sample=2, expectancy=0.3542R, winRate=0.5
- ETH 1h up|mid-vol: sample=3, expectancy=0.7748R, winRate=0.6667
- ETH 1h up|low-vol: sample=8, expectancy=1.345R, winRate=1

### alert-feedback-eth-velocity-fade-v0#14

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=774, expectancy=-0.1855R, profitFactor=0.744, sharpe=-4.0027, deflatedSharpe=-4.3399, probabilisticSharpe=0.042, maxDD=167.5814R
Split: inSample=551/-0.1812R, outOfSample=223/-0.1962R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.2887R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0827R, outOfSampleLift=-0.1065R, deflatedSharpeLift=-1.9496
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=93, expectancy=-0.4033R, winRate=0.2903
- ETH 1h down|mid-vol: sample=322, expectancy=-0.2349R, winRate=0.3106
- ETH 1h up|mid-vol: sample=18, expectancy=-0.1557R, winRate=0.3333
- ETH 1h down|low-vol: sample=152, expectancy=-0.1358R, winRate=0.375
- ETH 1h range|mid-vol: sample=135, expectancy=-0.1209R, winRate=0.3481
- ETH 1h down|high-vol: sample=35, expectancy=0.0268R, winRate=0.4
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1
- ETH 1h up|low-vol: sample=15, expectancy=0.3753R, winRate=0.6

### alert-feedback-eth-velocity-fade-v0#9

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=587, expectancy=-0.2115R, profitFactor=0.7116, sharpe=-4.0083, deflatedSharpe=-4.396, probabilisticSharpe=0.001, maxDD=135.6451R
Split: inSample=430/-0.1918R, outOfSample=157/-0.2656R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.3163R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1724R, outOfSampleLift=-0.1662R, deflatedSharpeLift=-3.5435
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=73, expectancy=-0.4389R, winRate=0.2877
- ETH 1h down|mid-vol: sample=240, expectancy=-0.2543R, winRate=0.3083
- ETH 1h down|low-vol: sample=152, expectancy=-0.2285R, winRate=0.3487
- ETH 1h up|mid-vol: sample=3, expectancy=-0.1619R, winRate=0.3333
- ETH 1h range|mid-vol: sample=83, expectancy=-0.0985R, winRate=0.3614
- ETH 1h down|high-vol: sample=29, expectancy=0.1674R, winRate=0.4483
- ETH 1h up|low-vol: sample=6, expectancy=0.9492R, winRate=0.8333
- ETH 1h range|high-vol: sample=1, expectancy=1.7544R, winRate=1

### trend-breakout-volume-v0#4

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=14549, expectancy=-0.0481R, profitFactor=0.928, sharpe=-4.353, deflatedSharpe=-4.4367, probabilisticSharpe=1, maxDD=752.3506R
Split: inSample=9954/-0.0326R, outOfSample=4595/-0.0815R
Purged boundary: candidate=16, baseline=16
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=5/5, positiveOosFolds=0, minFoldExpectancy=-0.0804R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0586R, outOfSampleLift=0.0129R, deflatedSharpeLift=5.5563
Idea: Trade breakouts only when price clears the recent range with above-normal volume.

Worst slices:
- XRP 4h down|low-vol: sample=1, expectancy=-1.1253R, winRate=0
- DOGE 4h up|low-vol: sample=2, expectancy=-1.1229R, winRate=0
- BTC 1h range|high-vol: sample=2, expectancy=-1.0434R, winRate=0
- XRP 1h range|high-vol: sample=6, expectancy=-1.0416R, winRate=0
- BTC 4h range|low-vol: sample=10, expectancy=-0.583R, winRate=0.2
- HYPE 1h down|high-vol: sample=59, expectancy=-0.4649R, winRate=0.2034
- BTC 4h up|high-vol: sample=8, expectancy=-0.444R, winRate=0.25
- AVAX 4h range|mid-vol: sample=30, expectancy=-0.4419R, winRate=0.2333

### alert-feedback-eth-velocity-fade-v0#11

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=493, expectancy=-0.2345R, profitFactor=0.6835, sharpe=-4.1085, deflatedSharpe=-4.541, probabilisticSharpe=0.0001, maxDD=124.0582R
Split: inSample=353/-0.2228R, outOfSample=140/-0.2638R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.3347R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.2246R, outOfSampleLift=-0.1688R, deflatedSharpeLift=-4.2347
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=64, expectancy=-0.3954R, winRate=0.2969
- ETH 1h down|mid-vol: sample=194, expectancy=-0.2863R, winRate=0.299
- ETH 1h range|mid-vol: sample=68, expectancy=-0.2016R, winRate=0.3235
- ETH 1h down|low-vol: sample=135, expectancy=-0.1752R, winRate=0.3704
- ETH 1h down|high-vol: sample=26, expectancy=-0.0175R, winRate=0.3846
- ETH 1h up|low-vol: sample=3, expectancy=0.2354R, winRate=0.6667
- ETH 1h up|mid-vol: sample=2, expectancy=0.3093R, winRate=0.5
- ETH 1h range|high-vol: sample=1, expectancy=1.7544R, winRate=1

### alert-feedback-eth-velocity-fade-v0#1

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=967, expectancy=-0.176R, profitFactor=0.7557, sharpe=-4.2358, deflatedSharpe=-4.553, probabilisticSharpe=0.1824, maxDD=184.0051R
Split: inSample=705/-0.165R, outOfSample=262/-0.2057R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.2778R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0377R, outOfSampleLift=0.0708R, deflatedSharpeLift=-1.0119
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h down|mid-vol: sample=365, expectancy=-0.2645R, winRate=0.3041
- ETH 1h range|low-vol: sample=148, expectancy=-0.2532R, winRate=0.3446
- ETH 1h down|low-vol: sample=262, expectancy=-0.1643R, winRate=0.374
- ETH 1h range|mid-vol: sample=124, expectancy=-0.0261R, winRate=0.3871
- ETH 1h down|high-vol: sample=36, expectancy=-0.0024R, winRate=0.3889
- ETH 1h up|mid-vol: sample=9, expectancy=0.3035R, winRate=0.5556
- ETH 1h up|low-vol: sample=21, expectancy=0.3226R, winRate=0.5714
- ETH 1h range|high-vol: sample=2, expectancy=0.3542R, winRate=0.5

### alert-feedback-eth-velocity-fade-v0#2

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=1284, expectancy=-0.1568R, profitFactor=0.7804, sharpe=-4.3204, deflatedSharpe=-4.6007, probabilisticSharpe=0.0786, maxDD=221.8506R
Split: inSample=931/-0.1575R, outOfSample=353/-0.1547R
Purged boundary: candidate=3, baseline=3
Walk-forward: positiveFolds=1/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=1, minFoldExpectancy=-0.2699R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0516R, outOfSampleLift=-0.0067R, deflatedSharpeLift=-1.5544
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h up|low-vol: sample=50, expectancy=-0.2384R, winRate=0.34
- ETH 1h down|mid-vol: sample=446, expectancy=-0.2067R, winRate=0.3251
- ETH 1h range|low-vol: sample=214, expectancy=-0.1429R, winRate=0.3785
- ETH 1h down|low-vol: sample=328, expectancy=-0.1407R, winRate=0.3841
- ETH 1h range|mid-vol: sample=172, expectancy=-0.1224R, winRate=0.3547
- ETH 1h up|mid-vol: sample=32, expectancy=-0.0869R, winRate=0.375
- ETH 1h down|high-vol: sample=38, expectancy=0.0165R, winRate=0.3947
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#3

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=766, expectancy=-0.1985R, profitFactor=0.7283, sharpe=-4.2716, deflatedSharpe=-4.6309, probabilisticSharpe=0.0308, maxDD=161.0559R
Split: inSample=564/-0.1723R, outOfSample=202/-0.2717R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.3165R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0892R, outOfSampleLift=-0.0047R, deflatedSharpeLift=-2.1178
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=113, expectancy=-0.3348R, winRate=0.3186
- ETH 1h down|mid-vol: sample=280, expectancy=-0.2767R, winRate=0.3036
- ETH 1h down|low-vol: sample=227, expectancy=-0.1903R, winRate=0.3656
- ETH 1h range|mid-vol: sample=99, expectancy=-0.1171R, winRate=0.3535
- ETH 1h down|high-vol: sample=29, expectancy=0.1674R, winRate=0.4483
- ETH 1h up|mid-vol: sample=6, expectancy=0.5379R, winRate=0.6667
- ETH 1h up|low-vol: sample=11, expectancy=0.7459R, winRate=0.7273
- ETH 1h range|high-vol: sample=1, expectancy=1.7544R, winRate=1

### alert-feedback-eth-velocity-fade-v0#15

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=498, expectancy=-0.2465R, profitFactor=0.6715, sharpe=-4.3341, deflatedSharpe=-4.7856, probabilisticSharpe=0.0005, maxDD=134.1755R
Split: inSample=361/-0.2137R, outOfSample=137/-0.3332R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.3724R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.2019R, outOfSampleLift=-0.1186R, deflatedSharpeLift=-3.8835
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=54, expectancy=-0.5641R, winRate=0.2407
- ETH 1h down|mid-vol: sample=215, expectancy=-0.3042R, winRate=0.2884
- ETH 1h down|low-vol: sample=116, expectancy=-0.2204R, winRate=0.3448
- ETH 1h range|mid-vol: sample=79, expectancy=-0.1646R, winRate=0.3291
- ETH 1h down|high-vol: sample=27, expectancy=0.1533R, winRate=0.4444
- ETH 1h up|mid-vol: sample=2, expectancy=0.3093R, winRate=0.5
- ETH 1h up|low-vol: sample=4, expectancy=1.2915R, winRate=1
- ETH 1h range|high-vol: sample=1, expectancy=1.7544R, winRate=1

### alert-feedback-eth-velocity-fade-v0#10

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=758, expectancy=-0.2098R, profitFactor=0.7146, sharpe=-4.5037, deflatedSharpe=-4.8825, probabilisticSharpe=0.0023, maxDD=168.5901R
Split: inSample=550/-0.1979R, outOfSample=208/-0.2412R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.3615R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1383R, outOfSampleLift=-0.0982R, deflatedSharpeLift=-3.2295
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h up|mid-vol: sample=13, expectancy=-0.4446R, winRate=0.2308
- ETH 1h range|low-vol: sample=105, expectancy=-0.3891R, winRate=0.2952
- ETH 1h down|mid-vol: sample=297, expectancy=-0.2295R, winRate=0.3165
- ETH 1h down|low-vol: sample=180, expectancy=-0.2004R, winRate=0.3556
- ETH 1h range|mid-vol: sample=114, expectancy=-0.1695R, winRate=0.3333
- ETH 1h down|high-vol: sample=30, expectancy=0.1271R, winRate=0.4333
- ETH 1h up|low-vol: sample=16, expectancy=0.2203R, winRate=0.5
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#35

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=603, expectancy=-0.2395R, profitFactor=0.6792, sharpe=-4.6305, deflatedSharpe=-5.0662, probabilisticSharpe=0, maxDD=155.7634R
Split: inSample=437/-0.2246R, outOfSample=166/-0.2788R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.3149R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.2291R, outOfSampleLift=-0.125R, deflatedSharpeLift=-4.7481
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=82, expectancy=-0.3927R, winRate=0.2927
- ETH 1h down|mid-vol: sample=241, expectancy=-0.2773R, winRate=0.3029
- ETH 1h range|mid-vol: sample=85, expectancy=-0.2461R, winRate=0.3059
- ETH 1h down|low-vol: sample=158, expectancy=-0.1918R, winRate=0.3608
- ETH 1h up|mid-vol: sample=4, expectancy=-0.0468R, winRate=0.5
- ETH 1h down|high-vol: sample=28, expectancy=-0.0356R, winRate=0.3571
- ETH 1h up|low-vol: sample=3, expectancy=1.1682R, winRate=1
- ETH 1h range|high-vol: sample=2, expectancy=1.7562R, winRate=1

### alert-feedback-eth-velocity-fade-v0#17

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=421, expectancy=-0.2791R, profitFactor=0.6338, sharpe=-4.5686, deflatedSharpe=-5.0839, probabilisticSharpe=0.0002, maxDD=126.5977R
Split: inSample=299/-0.2583R, outOfSample=122/-0.3302R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.351R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.2392R, outOfSampleLift=-0.2706R, deflatedSharpeLift=-4.3049
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=49, expectancy=-0.5329R, winRate=0.2449
- ETH 1h down|mid-vol: sample=174, expectancy=-0.3272R, winRate=0.2816
- ETH 1h range|mid-vol: sample=65, expectancy=-0.2661R, winRate=0.2923
- ETH 1h down|low-vol: sample=104, expectancy=-0.1941R, winRate=0.3558
- ETH 1h down|high-vol: sample=24, expectancy=-0.0488R, winRate=0.375
- ETH 1h up|mid-vol: sample=2, expectancy=0.3093R, winRate=0.5
- ETH 1h up|low-vol: sample=2, expectancy=0.9144R, winRate=1
- ETH 1h range|high-vol: sample=1, expectancy=1.7544R, winRate=1

### alert-feedback-eth-velocity-fade-v0#4

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=1004, expectancy=-0.1932R, profitFactor=0.735, sharpe=-4.749, deflatedSharpe=-5.0945, probabilisticSharpe=0.0066, maxDD=207.5692R
Split: inSample=731/-0.1795R, outOfSample=273/-0.2298R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.3211R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1036R, outOfSampleLift=-0.1086R, deflatedSharpeLift=-2.7775
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=165, expectancy=-0.2738R, winRate=0.3333
- ETH 1h down|mid-vol: sample=341, expectancy=-0.2391R, winRate=0.3167
- ETH 1h up|mid-vol: sample=18, expectancy=-0.2372R, winRate=0.3333
- ETH 1h range|mid-vol: sample=137, expectancy=-0.1926R, winRate=0.3285
- ETH 1h down|low-vol: sample=281, expectancy=-0.1654R, winRate=0.3772
- ETH 1h up|low-vol: sample=29, expectancy=0.0774R, winRate=0.4483
- ETH 1h down|high-vol: sample=30, expectancy=0.1271R, winRate=0.4333
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#5

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=626, expectancy=-0.2386R, profitFactor=0.6805, sharpe=-4.6955, deflatedSharpe=-5.1286, probabilisticSharpe=0.0437, maxDD=156.1069R
Split: inSample=453/-0.2076R, outOfSample=173/-0.3199R
Purged boundary: candidate=1, baseline=1
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.3994R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0888R, outOfSampleLift=-0.1224R, deflatedSharpeLift=-1.9882
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=94, expectancy=-0.3825R, winRate=0.2979
- ETH 1h down|mid-vol: sample=218, expectancy=-0.2819R, winRate=0.3028
- ETH 1h range|mid-vol: sample=82, expectancy=-0.2163R, winRate=0.3171
- ETH 1h down|low-vol: sample=196, expectancy=-0.2003R, winRate=0.3622
- ETH 1h down|high-vol: sample=26, expectancy=-0.0175R, winRate=0.3846
- ETH 1h up|low-vol: sample=5, expectancy=0.2232R, winRate=0.6
- ETH 1h up|mid-vol: sample=4, expectancy=0.6574R, winRate=0.75
- ETH 1h range|high-vol: sample=1, expectancy=1.7544R, winRate=1

### alert-feedback-eth-velocity-fade-v0#29

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=656, expectancy=-0.2378R, profitFactor=0.681, sharpe=-4.7944, deflatedSharpe=-5.2256, probabilisticSharpe=0.0016, maxDD=167.7833R
Split: inSample=477/-0.2258R, outOfSample=179/-0.2696R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.341R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1537R, outOfSampleLift=-0.1082R, deflatedSharpeLift=-3.4129
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=89, expectancy=-0.4545R, winRate=0.2697
- ETH 1h down|mid-vol: sample=246, expectancy=-0.2885R, winRate=0.3008
- ETH 1h down|low-vol: sample=191, expectancy=-0.1739R, winRate=0.3717
- ETH 1h range|mid-vol: sample=89, expectancy=-0.1584R, winRate=0.3371
- ETH 1h down|high-vol: sample=30, expectancy=-0.0592R, winRate=0.3667
- ETH 1h up|mid-vol: sample=4, expectancy=-0.0468R, winRate=0.5
- ETH 1h up|low-vol: sample=5, expectancy=0.2382R, winRate=0.6
- ETH 1h range|high-vol: sample=2, expectancy=1.7562R, winRate=1

### alert-feedback-eth-velocity-fade-v0#16

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=643, expectancy=-0.2442R, profitFactor=0.6751, sharpe=-4.8644, deflatedSharpe=-5.3059, probabilisticSharpe=0.0165, maxDD=169.2166R
Split: inSample=461/-0.224R, outOfSample=182/-0.2954R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.3948R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1121R, outOfSampleLift=-0.1407R, deflatedSharpeLift=-2.4886
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=83, expectancy=-0.4995R, winRate=0.253
- ETH 1h up|mid-vol: sample=12, expectancy=-0.3897R, winRate=0.25
- ETH 1h down|mid-vol: sample=263, expectancy=-0.2596R, winRate=0.3042
- ETH 1h range|mid-vol: sample=110, expectancy=-0.2195R, winRate=0.3091
- ETH 1h down|low-vol: sample=134, expectancy=-0.1982R, winRate=0.3507
- ETH 1h down|high-vol: sample=28, expectancy=0.1107R, winRate=0.4286
- ETH 1h up|low-vol: sample=10, expectancy=0.1157R, winRate=0.5
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#26

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=1445, expectancy=-0.1723R, profitFactor=0.7603, sharpe=-5.0641, deflatedSharpe=-5.3697, probabilisticSharpe=0.0096, maxDD=284.2517R
Split: inSample=1049/-0.1818R, outOfSample=396/-0.1469R
Purged boundary: candidate=4, baseline=4
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.2318R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0813R, outOfSampleLift=-0.0207R, deflatedSharpeLift=-2.582
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=198, expectancy=-0.2752R, winRate=0.3283
- ETH 1h down|mid-vol: sample=551, expectancy=-0.2378R, winRate=0.3158
- ETH 1h up|low-vol: sample=41, expectancy=-0.2317R, winRate=0.3415
- ETH 1h down|low-vol: sample=357, expectancy=-0.1221R, winRate=0.3894
- ETH 1h range|mid-vol: sample=205, expectancy=-0.0908R, winRate=0.3659
- ETH 1h up|mid-vol: sample=35, expectancy=-0.0268R, winRate=0.4
- ETH 1h down|high-vol: sample=52, expectancy=0.1107R, winRate=0.4231
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#12

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=621, expectancy=-0.2511R, profitFactor=0.6649, sharpe=-4.9545, deflatedSharpe=-5.4114, probabilisticSharpe=0.0003, maxDD=165.2932R
Split: inSample=444/-0.2401R, outOfSample=177/-0.2788R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.4014R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1867R, outOfSampleLift=-0.1114R, deflatedSharpeLift=-4.0378
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=88, expectancy=-0.4104R, winRate=0.2841
- ETH 1h up|mid-vol: sample=8, expectancy=-0.3916R, winRate=0.25
- ETH 1h down|mid-vol: sample=237, expectancy=-0.283R, winRate=0.2996
- ETH 1h up|low-vol: sample=9, expectancy=-0.2735R, winRate=0.3333
- ETH 1h range|mid-vol: sample=91, expectancy=-0.2705R, winRate=0.2967
- ETH 1h down|low-vol: sample=158, expectancy=-0.1576R, winRate=0.3734
- ETH 1h down|high-vol: sample=27, expectancy=-0.0555R, winRate=0.3704
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#32

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=1264, expectancy=-0.1842R, profitFactor=0.745, sharpe=-5.0885, deflatedSharpe=-5.4167, probabilisticSharpe=0.0025, maxDD=255.0948R
Split: inSample=913/-0.1843R, outOfSample=351/-0.1841R
Purged boundary: candidate=4, baseline=4
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.2897R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1048R, outOfSampleLift=-0.0898R, deflatedSharpeLift=-3.1209
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=168, expectancy=-0.2637R, winRate=0.3333
- ETH 1h down|mid-vol: sample=511, expectancy=-0.2396R, winRate=0.3151
- ETH 1h range|mid-vol: sample=192, expectancy=-0.1689R, winRate=0.3385
- ETH 1h down|low-vol: sample=279, expectancy=-0.1421R, winRate=0.3799
- ETH 1h up|low-vol: sample=30, expectancy=-0.0791R, winRate=0.4
- ETH 1h up|mid-vol: sample=30, expectancy=-0.0332R, winRate=0.4
- ETH 1h down|high-vol: sample=48, expectancy=0.1212R, winRate=0.4167
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#27

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=846, expectancy=-0.2247R, profitFactor=0.6972, sharpe=-5.1152, deflatedSharpe=-5.5183, probabilisticSharpe=0.003, maxDD=206.4205R
Split: inSample=621/-0.2133R, outOfSample=225/-0.2564R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.3007R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1254R, outOfSampleLift=-0.0115R, deflatedSharpeLift=-3.1366
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=103, expectancy=-0.4565R, winRate=0.2718
- ETH 1h down|mid-vol: sample=338, expectancy=-0.2945R, winRate=0.2959
- ETH 1h down|low-vol: sample=236, expectancy=-0.203R, winRate=0.3602
- ETH 1h range|mid-vol: sample=113, expectancy=-0.089R, winRate=0.3628
- ETH 1h down|high-vol: sample=38, expectancy=0.1037R, winRate=0.4211
- ETH 1h up|mid-vol: sample=5, expectancy=0.3029R, winRate=0.6
- ETH 1h up|low-vol: sample=11, expectancy=0.4943R, winRate=0.6364
- ETH 1h range|high-vol: sample=2, expectancy=1.7562R, winRate=1

### trend-breakout-volume-v0#3

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=16427, expectancy=-0.0569R, profitFactor=0.9152, sharpe=-5.4869, deflatedSharpe=-5.5845, probabilisticSharpe=1, maxDD=964.9704R
Split: inSample=11196/-0.0443R, outOfSample=5231/-0.0839R
Purged boundary: candidate=20, baseline=20
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=5/5, positiveOosFolds=0, minFoldExpectancy=-0.0856R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0548R, outOfSampleLift=0.0401R, deflatedSharpeLift=5.5485
Idea: Trade breakouts only when price clears the recent range with above-normal volume.

Worst slices:
- XRP 4h down|low-vol: sample=1, expectancy=-1.1253R, winRate=0
- DOGE 4h up|low-vol: sample=2, expectancy=-1.1229R, winRate=0
- BTC 1h range|high-vol: sample=2, expectancy=-1.0434R, winRate=0
- XRP 1h range|high-vol: sample=7, expectancy=-1.0414R, winRate=0
- ETH 1h up|high-vol: sample=3, expectancy=-0.7925R, winRate=0
- BTC 4h range|low-vol: sample=12, expectancy=-0.6787R, winRate=0.1667
- XRP 4h up|low-vol: sample=5, expectancy=-0.5699R, winRate=0.2
- AVAX 4h range|mid-vol: sample=34, expectancy=-0.4329R, winRate=0.2353

### alert-feedback-eth-velocity-fade-v0#31

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=983, expectancy=-0.2126R, profitFactor=0.7104, sharpe=-5.2184, deflatedSharpe=-5.5993, probabilisticSharpe=0.0345, maxDD=228.8697R
Split: inSample=713/-0.2023R, outOfSample=270/-0.24R
Purged boundary: candidate=3, baseline=3
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.3017R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.076R, outOfSampleLift=-0.0118R, deflatedSharpeLift=-2.0647
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=117, expectancy=-0.3085R, winRate=0.3248
- ETH 1h down|mid-vol: sample=418, expectancy=-0.3003R, winRate=0.2919
- ETH 1h down|low-vol: sample=234, expectancy=-0.1956R, winRate=0.359
- ETH 1h range|mid-vol: sample=139, expectancy=-0.1268R, winRate=0.3525
- ETH 1h down|high-vol: sample=47, expectancy=0.0864R, winRate=0.4043
- ETH 1h up|mid-vol: sample=9, expectancy=0.2505R, winRate=0.5556
- ETH 1h range|high-vol: sample=4, expectancy=0.3551R, winRate=0.5
- ETH 1h up|low-vol: sample=15, expectancy=0.5503R, winRate=0.6667

### alert-feedback-eth-velocity-fade-v0#30

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=842, expectancy=-0.2293R, profitFactor=0.6901, sharpe=-5.238, deflatedSharpe=-5.6511, probabilisticSharpe=0, maxDD=209.1821R
Split: inSample=611/-0.2207R, outOfSample=231/-0.2522R
Purged boundary: candidate=3, baseline=3
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.3012R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.2124R, outOfSampleLift=0.0196R, deflatedSharpeLift=-5.1743
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=128, expectancy=-0.3848R, winRate=0.2891
- ETH 1h up|low-vol: sample=13, expectancy=-0.3268R, winRate=0.3077
- ETH 1h up|mid-vol: sample=12, expectancy=-0.2775R, winRate=0.3333
- ETH 1h down|mid-vol: sample=304, expectancy=-0.2771R, winRate=0.3059
- ETH 1h range|mid-vol: sample=119, expectancy=-0.217R, winRate=0.3193
- ETH 1h down|low-vol: sample=231, expectancy=-0.1255R, winRate=0.3896
- ETH 1h down|high-vol: sample=31, expectancy=-0.0909R, winRate=0.3548
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#33

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=764, expectancy=-0.2403R, profitFactor=0.6791, sharpe=-5.2213, deflatedSharpe=-5.6537, probabilisticSharpe=0.0019, maxDD=193.719R
Split: inSample=561/-0.2313R, outOfSample=203/-0.265R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.2722R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1398R, outOfSampleLift=-0.1176R, deflatedSharpeLift=-3.352
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=92, expectancy=-0.4306R, winRate=0.2826
- ETH 1h down|mid-vol: sample=324, expectancy=-0.2988R, winRate=0.2932
- ETH 1h down|low-vol: sample=192, expectancy=-0.2196R, winRate=0.349
- ETH 1h range|mid-vol: sample=107, expectancy=-0.1897R, winRate=0.3271
- ETH 1h down|high-vol: sample=35, expectancy=0.0846R, winRate=0.4
- ETH 1h up|mid-vol: sample=5, expectancy=0.3029R, winRate=0.6
- ETH 1h up|low-vol: sample=7, expectancy=1.0479R, winRate=0.8571
- ETH 1h range|high-vol: sample=2, expectancy=1.7562R, winRate=1

### alert-feedback-eth-velocity-fade-v0#28

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=1104, expectancy=-0.2072R, profitFactor=0.7176, sharpe=-5.3681, deflatedSharpe=-5.7371, probabilisticSharpe=0.0304, maxDD=252.9593R
Split: inSample=799/-0.2069R, outOfSample=305/-0.2082R
Purged boundary: candidate=3, baseline=3
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.2668R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0733R, outOfSampleLift=0.0349R, deflatedSharpeLift=-2.1141
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=156, expectancy=-0.3714R, winRate=0.2949
- ETH 1h up|mid-vol: sample=19, expectancy=-0.2829R, winRate=0.3158
- ETH 1h down|mid-vol: sample=416, expectancy=-0.2448R, winRate=0.3149
- ETH 1h down|low-vol: sample=291, expectancy=-0.1565R, winRate=0.378
- ETH 1h range|mid-vol: sample=155, expectancy=-0.1525R, winRate=0.3419
- ETH 1h up|low-vol: sample=24, expectancy=-0.1222R, winRate=0.375
- ETH 1h down|high-vol: sample=39, expectancy=0.0743R, winRate=0.4103
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#36

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=764, expectancy=-0.2431R, profitFactor=0.6745, sharpe=-5.3055, deflatedSharpe=-5.7444, probabilisticSharpe=0.0001, maxDD=201.0678R
Split: inSample=552/-0.2268R, outOfSample=212/-0.2853R
Purged boundary: candidate=3, baseline=3
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.3403R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1756R, outOfSampleLift=-0.115R, deflatedSharpeLift=-4.1868
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=113, expectancy=-0.377R, winRate=0.292
- ETH 1h range|mid-vol: sample=114, expectancy=-0.3015R, winRate=0.2895
- ETH 1h down|mid-vol: sample=298, expectancy=-0.2745R, winRate=0.3054
- ETH 1h up|low-vol: sample=11, expectancy=-0.1759R, winRate=0.3636
- ETH 1h down|low-vol: sample=186, expectancy=-0.1531R, winRate=0.3763
- ETH 1h up|mid-vol: sample=10, expectancy=-0.1112R, winRate=0.4
- ETH 1h down|high-vol: sample=28, expectancy=-0.0356R, winRate=0.3571
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#6

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=799, expectancy=-0.2391R, profitFactor=0.6795, sharpe=-5.3237, deflatedSharpe=-5.7542, probabilisticSharpe=0.0003, maxDD=201.1885R
Split: inSample=578/-0.2128R, outOfSample=221/-0.3079R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.4257R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1608R, outOfSampleLift=-0.156R, deflatedSharpeLift=-3.9185
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=132, expectancy=-0.3539R, winRate=0.303
- ETH 1h range|mid-vol: sample=111, expectancy=-0.281R, winRate=0.2973
- ETH 1h down|mid-vol: sample=263, expectancy=-0.2681R, winRate=0.308
- ETH 1h down|low-vol: sample=237, expectancy=-0.175R, winRate=0.3755
- ETH 1h up|low-vol: sample=16, expectancy=-0.1482R, winRate=0.375
- ETH 1h up|mid-vol: sample=10, expectancy=-0.1122R, winRate=0.4
- ETH 1h down|high-vol: sample=27, expectancy=-0.0555R, winRate=0.3704
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#25

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=1113, expectancy=-0.2073R, profitFactor=0.7172, sharpe=-5.3977, deflatedSharpe=-5.7672, probabilisticSharpe=0.0014, maxDD=261.6828R
Split: inSample=814/-0.2033R, outOfSample=299/-0.2184R
Purged boundary: candidate=3, baseline=3
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.2657R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1196R, outOfSampleLift=-0.0698R, deflatedSharpeLift=-3.371
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=135, expectancy=-0.3618R, winRate=0.3037
- ETH 1h down|mid-vol: sample=450, expectancy=-0.3035R, winRate=0.2911
- ETH 1h down|low-vol: sample=293, expectancy=-0.1695R, winRate=0.372
- ETH 1h range|mid-vol: sample=149, expectancy=-0.0412R, winRate=0.3826
- ETH 1h up|low-vol: sample=23, expectancy=0.0762R, winRate=0.4783
- ETH 1h down|high-vol: sample=50, expectancy=0.1008R, winRate=0.42
- ETH 1h up|mid-vol: sample=9, expectancy=0.2505R, winRate=0.5556
- ETH 1h range|high-vol: sample=4, expectancy=0.3551R, winRate=0.5

### alert-feedback-eth-velocity-fade-v0#18

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=534, expectancy=-0.2863R, profitFactor=0.6268, sharpe=-5.2809, deflatedSharpe=-5.8037, probabilisticSharpe=0, maxDD=163.2914R
Split: inSample=378/-0.2718R, outOfSample=156/-0.3216R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.3532R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.2566R, outOfSampleLift=-0.1437R, deflatedSharpeLift=-5.1481
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=71, expectancy=-0.5273R, winRate=0.2394
- ETH 1h up|mid-vol: sample=8, expectancy=-0.3916R, winRate=0.25
- ETH 1h range|mid-vol: sample=88, expectancy=-0.3205R, winRate=0.2727
- ETH 1h down|mid-vol: sample=211, expectancy=-0.2932R, winRate=0.2938
- ETH 1h down|low-vol: sample=121, expectancy=-0.1887R, winRate=0.3554
- ETH 1h up|low-vol: sample=7, expectancy=-0.1506R, winRate=0.4286
- ETH 1h down|high-vol: sample=25, expectancy=-0.0885R, winRate=0.36
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#34

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=983, expectancy=-0.2256R, profitFactor=0.6958, sharpe=-5.5436, deflatedSharpe=-5.9467, probabilisticSharpe=0.0029, maxDD=236.785R
Split: inSample=712/-0.2195R, outOfSample=271/-0.2416R
Purged boundary: candidate=3, baseline=3
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.2865R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1167R, outOfSampleLift=-0.0285R, deflatedSharpeLift=-3.1497
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=135, expectancy=-0.3691R, winRate=0.2963
- ETH 1h down|mid-vol: sample=397, expectancy=-0.257R, winRate=0.3098
- ETH 1h range|mid-vol: sample=146, expectancy=-0.2479R, winRate=0.3082
- ETH 1h up|mid-vol: sample=17, expectancy=-0.1856R, winRate=0.3529
- ETH 1h down|low-vol: sample=231, expectancy=-0.1747R, winRate=0.368
- ETH 1h up|low-vol: sample=18, expectancy=0.0699R, winRate=0.4444
- ETH 1h down|high-vol: sample=35, expectancy=0.0846R, winRate=0.4
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#23

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=770, expectancy=-0.2556R, profitFactor=0.6621, sharpe=-5.5922, deflatedSharpe=-6.0514, probabilisticSharpe=0.0052, maxDD=205.2293R
Split: inSample=561/-0.2422R, outOfSample=209/-0.2915R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.3511R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1212R, outOfSampleLift=-0.1095R, deflatedSharpeLift=-2.9777
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=118, expectancy=-0.3602R, winRate=0.3051
- ETH 1h down|mid-vol: sample=264, expectancy=-0.3188R, winRate=0.2879
- ETH 1h down|low-vol: sample=249, expectancy=-0.2303R, winRate=0.3534
- ETH 1h range|mid-vol: sample=94, expectancy=-0.1477R, winRate=0.3404
- ETH 1h down|high-vol: sample=32, expectancy=-0.1201R, winRate=0.3438
- ETH 1h up|mid-vol: sample=4, expectancy=-0.0468R, winRate=0.5
- ETH 1h up|low-vol: sample=7, expectancy=0.2286R, winRate=0.5714
- ETH 1h range|high-vol: sample=2, expectancy=1.7562R, winRate=1

### trend-breakout-volume-v0#2

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=19647, expectancy=-0.0576R, profitFactor=0.9142, sharpe=-6.0747, deflatedSharpe=-6.173, probabilisticSharpe=1, maxDD=1188.2196R
Split: inSample=13475/-0.046R, outOfSample=6172/-0.083R
Purged boundary: candidate=24, baseline=24
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=5/5, positiveOosFolds=0, minFoldExpectancy=-0.0952R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0399R, outOfSampleLift=0.0336R, deflatedSharpeLift=4.3799
Idea: Trade breakouts only when price clears the recent range with above-normal volume.

Worst slices:
- AVAX 4h down|low-vol: sample=1, expectancy=-1.1789R, winRate=0
- SOL 4h up|low-vol: sample=1, expectancy=-1.1372R, winRate=0
- AVAX 4h up|low-vol: sample=1, expectancy=-1.1306R, winRate=0
- XRP 4h down|low-vol: sample=2, expectancy=-1.1254R, winRate=0
- DOGE 4h up|low-vol: sample=3, expectancy=-1.1218R, winRate=0
- BTC 1h range|high-vol: sample=3, expectancy=-1.0419R, winRate=0
- ETH 4h range|low-vol: sample=16, expectancy=-0.6044R, winRate=0.1875
- XRP 1h range|high-vol: sample=13, expectancy=-0.5986R, winRate=0.2308

### alert-feedback-eth-velocity-fade-v0#21

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=992, expectancy=-0.2348R, profitFactor=0.6866, sharpe=-5.7885, deflatedSharpe=-6.2064, probabilisticSharpe=0.0009, maxDD=243.9072R
Split: inSample=729/-0.2172R, outOfSample=263/-0.2838R
Purged boundary: candidate=2, baseline=2
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.314R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1318R, outOfSampleLift=-0.1109R, deflatedSharpeLift=-3.5515
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=141, expectancy=-0.3488R, winRate=0.3121
- ETH 1h down|mid-vol: sample=362, expectancy=-0.3064R, winRate=0.2901
- ETH 1h down|low-vol: sample=309, expectancy=-0.247R, winRate=0.3463
- ETH 1h range|mid-vol: sample=120, expectancy=-0.0772R, winRate=0.3667
- ETH 1h down|high-vol: sample=40, expectancy=0.0468R, winRate=0.4
- ETH 1h up|mid-vol: sample=5, expectancy=0.3029R, winRate=0.6
- ETH 1h up|low-vol: sample=13, expectancy=0.4498R, winRate=0.6154
- ETH 1h range|high-vol: sample=2, expectancy=1.7562R, winRate=1

### alert-feedback-eth-velocity-fade-v0#20

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=1791, expectancy=-0.184R, profitFactor=0.7471, sharpe=-6.0148, deflatedSharpe=-6.3373, probabilisticSharpe=0, maxDD=364.1118R
Split: inSample=1302/-0.1941R, outOfSample=489/-0.157R
Purged boundary: candidate=4, baseline=4
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.2745R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1412R, outOfSampleLift=0.0185R, deflatedSharpeLift=-4.8867
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h up|low-vol: sample=63, expectancy=-0.2474R, winRate=0.3333
- ETH 1h down|mid-vol: sample=613, expectancy=-0.2456R, winRate=0.3116
- ETH 1h range|low-vol: sample=295, expectancy=-0.2042R, winRate=0.3559
- ETH 1h down|low-vol: sample=502, expectancy=-0.1695R, winRate=0.3745
- ETH 1h range|mid-vol: sample=223, expectancy=-0.109R, winRate=0.3587
- ETH 1h up|mid-vol: sample=35, expectancy=-0.0268R, winRate=0.4
- ETH 1h down|high-vol: sample=54, expectancy=0.0683R, winRate=0.4074
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#19

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=1341, expectancy=-0.2123R, profitFactor=0.7127, sharpe=-6.0525, deflatedSharpe=-6.4274, probabilisticSharpe=0.0585, maxDD=311.5334R
Split: inSample=982/-0.2177R, outOfSample=359/-0.1976R
Purged boundary: candidate=3, baseline=3
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.3283R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0562R, outOfSampleLift=-0.0334R, deflatedSharpeLift=-1.7607
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h down|mid-vol: sample=490, expectancy=-0.3091R, winRate=0.2878
- ETH 1h range|low-vol: sample=200, expectancy=-0.2901R, winRate=0.33
- ETH 1h down|low-vol: sample=399, expectancy=-0.2013R, winRate=0.3609
- ETH 1h range|mid-vol: sample=160, expectancy=-0.0259R, winRate=0.3875
- ETH 1h down|high-vol: sample=52, expectancy=0.0572R, winRate=0.4038
- ETH 1h up|low-vol: sample=27, expectancy=0.0948R, winRate=0.4815
- ETH 1h up|mid-vol: sample=9, expectancy=0.2505R, winRate=0.5556
- ETH 1h range|high-vol: sample=4, expectancy=0.3551R, winRate=0.5

### alert-feedback-eth-velocity-fade-v0#24

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=1008, expectancy=-0.2409R, profitFactor=0.678, sharpe=-6.0195, deflatedSharpe=-6.4497, probabilisticSharpe=0.0104, maxDD=258.6014R
Split: inSample=729/-0.2267R, outOfSample=279/-0.278R
Purged boundary: candidate=3, baseline=3
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=1/5, positiveOosFolds=0, minFoldExpectancy=-0.3589R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0949R, outOfSampleLift=-0.0316R, deflatedSharpeLift=-2.6499
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h range|low-vol: sample=173, expectancy=-0.3117R, winRate=0.3179
- ETH 1h down|mid-vol: sample=329, expectancy=-0.294R, winRate=0.2979
- ETH 1h up|mid-vol: sample=12, expectancy=-0.2775R, winRate=0.3333
- ETH 1h range|mid-vol: sample=128, expectancy=-0.2341R, winRate=0.3125
- ETH 1h down|low-vol: sample=309, expectancy=-0.1888R, winRate=0.3722
- ETH 1h down|high-vol: sample=33, expectancy=-0.148R, winRate=0.3333
- ETH 1h up|low-vol: sample=20, expectancy=-0.0633R, winRate=0.4
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### alert-feedback-eth-velocity-fade-v0#22

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=1331, expectancy=-0.2209R, profitFactor=0.7024, sharpe=-6.2906, deflatedSharpe=-6.681, probabilisticSharpe=0.0016, maxDD=316.7727R
Split: inSample=963/-0.2153R, outOfSample=368/-0.2357R
Purged boundary: candidate=3, baseline=3
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.3076R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1069R, outOfSampleLift=-0.2232R, deflatedSharpeLift=-3.3315
Idea: Retest the cleanest local volume-velocity feedback bucket: ETH 60s DOWN alerts with 5/5 evidence and fresh public book state, where finalized reviews all favored a fade.

Worst slices:
- ETH 1h up|mid-vol: sample=19, expectancy=-0.2829R, winRate=0.3158
- ETH 1h down|mid-vol: sample=456, expectancy=-0.2685R, winRate=0.3048
- ETH 1h range|low-vol: sample=215, expectancy=-0.2667R, winRate=0.3349
- ETH 1h down|low-vol: sample=394, expectancy=-0.2163R, winRate=0.3604
- ETH 1h range|mid-vol: sample=167, expectancy=-0.1695R, winRate=0.3353
- ETH 1h up|low-vol: sample=35, expectancy=-0.0512R, winRate=0.4
- ETH 1h down|high-vol: sample=41, expectancy=0.0203R, winRate=0.3902
- ETH 1h up|high-vol: sample=1, expectancy=0.3086R, winRate=1

### trend-breakout-volume-v0#1

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=22813, expectancy=-0.0701R, profitFactor=0.8964, sharpe=-7.9846, deflatedSharpe=-8.1032, probabilisticSharpe=1, maxDD=1622.4144R
Split: inSample=15623/-0.0606R, outOfSample=7190/-0.0907R
Purged boundary: candidate=31, baseline=31
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=5/5, positiveOosFolds=0, minFoldExpectancy=-0.1101R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0439R, outOfSampleLift=0.03R, deflatedSharpeLift=5.2358
Idea: Trade breakouts only when price clears the recent range with above-normal volume.

Worst slices:
- AVAX 4h down|low-vol: sample=1, expectancy=-1.1789R, winRate=0
- AVAX 4h up|low-vol: sample=2, expectancy=-1.1327R, winRate=0
- XRP 4h down|low-vol: sample=2, expectancy=-1.1254R, winRate=0
- AVAX 4h range|low-vol: sample=1, expectancy=-1.1221R, winRate=0
- DOGE 4h up|low-vol: sample=3, expectancy=-1.1218R, winRate=0
- BTC 1h range|high-vol: sample=3, expectancy=-1.0419R, winRate=0
- ETH 1h up|high-vol: sample=3, expectancy=-0.7925R, winRate=0
- ETH 4h range|low-vol: sample=18, expectancy=-0.663R, winRate=0.1667

### ma-regime-continuation-v0#1

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_out_of_sample
Stats: sample=18327, expectancy=-0.0893R, profitFactor=0.8682, sharpe=-9.2042, deflatedSharpe=-9.356, probabilisticSharpe=0.9956, maxDD=1663.7623R
Split: inSample=13021/-0.0816R, outOfSample=5306/-0.1084R
Purged boundary: candidate=21, baseline=21
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=4/5, positiveOosFolds=0, minFoldExpectancy=-0.1782R
Baseline: method=time_matched_alternating_direction, expectancyLift=0.0249R, outOfSampleLift=0.0032R, deflatedSharpeLift=2.712
Idea: Follow the dominant moving-average regime after a pullback reclaims the fast average.

Worst slices:
- BTC 4h down|high-vol: sample=34, expectancy=-0.5565R, winRate=0.2353
- DOGE 4h up|low-vol: sample=9, expectancy=-0.5027R, winRate=0.2222
- XRP 1h down|high-vol: sample=30, expectancy=-0.4753R, winRate=0.3
- AVAX 1h down|high-vol: sample=68, expectancy=-0.4486R, winRate=0.2353
- XRP 4h down|low-vol: sample=19, expectancy=-0.4006R, winRate=0.2632
- ETH 4h up|low-vol: sample=24, expectancy=-0.393R, winRate=0.2917
- XRP 4h up|low-vol: sample=7, expectancy=-0.3376R, winRate=0.2857
- BTC 1h down|high-vol: sample=8, expectancy=-0.3366R, winRate=0.25

### wick-fade-reversion-v0#2

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=13644, expectancy=-0.2448R, profitFactor=0.6664, sharpe=-22.9129, deflatedSharpe=-23.3469, probabilisticSharpe=0, maxDD=3345.953R
Split: inSample=8877/-0.2696R, outOfSample=4767/-0.1985R
Purged boundary: candidate=20, baseline=20
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.3551R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.1172R, outOfSampleLift=-0.0789R, deflatedSharpeLift=-11.5731
Idea: Fade sharp exhaustion moves when RSI is stretched and the market is not in strong trend expansion.

Worst slices:
- SOL 4h range|low-vol: sample=1, expectancy=-1.1364R, winRate=0
- DOGE 4h up|low-vol: sample=1, expectancy=-1.1318R, winRate=0
- SOL 4h up|low-vol: sample=1, expectancy=-1.1229R, winRate=0
- HYPE 4h down|mid-vol: sample=6, expectancy=-1.0507R, winRate=0
- BTC 1h range|high-vol: sample=1, expectancy=-1.042R, winRate=0
- ETH 1h range|high-vol: sample=8, expectancy=-1.0407R, winRate=0
- HYPE 4h up|high-vol: sample=5, expectancy=-1.0366R, winRate=0
- ETH 4h down|low-vol: sample=10, expectancy=-0.6712R, winRate=0.2

### wick-fade-reversion-v0#1

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=20795, expectancy=-0.2067R, profitFactor=0.7135, sharpe=-23.5147, deflatedSharpe=-23.8754, probabilisticSharpe=0, maxDD=4305.6174R
Split: inSample=13643/-0.2331R, outOfSample=7152/-0.1562R
Purged boundary: candidate=23, baseline=23
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=2/5, positiveOosFolds=0, minFoldExpectancy=-0.3069R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0505R, outOfSampleLift=0.0291R, deflatedSharpeLift=-6.1167
Idea: Fade sharp exhaustion moves when RSI is stretched and the market is not in strong trend expansion.

Worst slices:
- SOL 4h range|low-vol: sample=1, expectancy=-1.1364R, winRate=0
- SOL 4h up|low-vol: sample=1, expectancy=-1.1229R, winRate=0
- SOL 4h down|low-vol: sample=1, expectancy=-1.1207R, winRate=0
- HYPE 4h down|mid-vol: sample=6, expectancy=-1.0507R, winRate=0
- ETH 1h range|high-vol: sample=9, expectancy=-1.0403R, winRate=0
- HYPE 4h up|high-vol: sample=12, expectancy=-1.0356R, winRate=0
- BTC 1h range|high-vol: sample=3, expectancy=-0.7201R, winRate=0
- BTC 4h range|high-vol: sample=8, expectancy=-0.6066R, winRate=0.25

### wick-fade-reversion-v0#4

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=21144, expectancy=-0.2309R, profitFactor=0.6823, sharpe=-26.8361, deflatedSharpe=-27.2442, probabilisticSharpe=0, maxDD=4887.5238R
Split: inSample=14022/-0.2518R, outOfSample=7122/-0.1899R
Purged boundary: candidate=25, baseline=25
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.3051R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0915R, outOfSampleLift=-0.0414R, deflatedSharpeLift=-11.2538
Idea: Fade sharp exhaustion moves when RSI is stretched and the market is not in strong trend expansion.

Worst slices:
- SOL 4h range|low-vol: sample=1, expectancy=-1.1364R, winRate=0
- AVAX 4h range|low-vol: sample=2, expectancy=-1.1357R, winRate=0
- DOGE 4h up|low-vol: sample=1, expectancy=-1.1318R, winRate=0
- SOL 4h up|low-vol: sample=1, expectancy=-1.1229R, winRate=0
- HYPE 4h down|mid-vol: sample=11, expectancy=-1.052R, winRate=0
- ETH 1h range|high-vol: sample=9, expectancy=-1.0411R, winRate=0
- HYPE 4h up|high-vol: sample=6, expectancy=-0.9768R, winRate=0
- BTC 4h range|high-vol: sample=14, expectancy=-0.793R, winRate=0.1429

### wick-fade-reversion-v0#3

Status: rejected
Failures: weak_expectancy_after_costs, weak_profit_factor, deflated_sharpe_fail, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_expectancy, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample
Stats: sample=28295, expectancy=-0.2064R, profitFactor=0.7131, sharpe=-27.4557, deflatedSharpe=-27.8166, probabilisticSharpe=0, maxDD=5845.6611R
Split: inSample=18788/-0.2298R, outOfSample=9507/-0.1603R
Purged boundary: candidate=28, baseline=28
Walk-forward: positiveFolds=0/5, positiveBaselineLiftFolds=0/5, positiveOosFolds=0, minFoldExpectancy=-0.2888R
Baseline: method=time_matched_alternating_direction, expectancyLift=-0.0738R, outOfSampleLift=-0.0074R, deflatedSharpeLift=-10.3364
Idea: Fade sharp exhaustion moves when RSI is stretched and the market is not in strong trend expansion.

Worst slices:
- SOL 4h range|low-vol: sample=1, expectancy=-1.1364R, winRate=0
- AVAX 4h range|low-vol: sample=2, expectancy=-1.1357R, winRate=0
- SOL 4h up|low-vol: sample=1, expectancy=-1.1229R, winRate=0
- SOL 4h down|low-vol: sample=1, expectancy=-1.1207R, winRate=0
- HYPE 4h down|mid-vol: sample=11, expectancy=-1.052R, winRate=0
- ETH 1h range|high-vol: sample=10, expectancy=-1.0407R, winRate=0
- HYPE 4h up|high-vol: sample=13, expectancy=-1.008R, winRate=0
- BTC 4h range|high-vol: sample=15, expectancy=-0.8097R, winRate=0.1333

