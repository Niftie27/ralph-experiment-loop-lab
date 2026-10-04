---
type: research-note
created: 2026-09-29T16:58:00Z
topic: usdm-orderflow-absorption
status: research-feature-watch-only
work_item: validation.usdm-absorption-targeted-comparable-falsification
tags:
  - ralph
  - research-only
  - orderflow
  - demo-sim
  - baseline-comparison
  - no-live-trading
  - no-execution
related:
  - 2026-09-29-balanced-usdm-absorption-validation.md
  - ../../experiments/strategy-destruction-filter/results/usdm-orderflow-targeted-comparable-demo-sim-batch.md
  - ../../experiments/strategy-destruction-filter/results/usdm-orderflow-targeted-comparable-manifest.md
---
# Targeted USD-M Absorption Falsification

Follow-up to the balanced 60-row USD-M absorption run. This pass targeted comparable buckets directly instead of broad date/symbol balance.

## Scope

- Research-only.
- Public/no-key Binance USD-M `trades` plus `bookDepth`.
- Frozen existing DEMO-SIM rows only.
- No live alerts, paper/demo alert logic, scheduler, thresholds, sizing, TP/SL, execution, accounts, keys, paid services, public posting, or strategy promotion changed.

## Outputs

- `experiments/strategy-destruction-filter/results/usdm-orderflow-targeted-comparable-manifest.json`
- `experiments/strategy-destruction-filter/results/usdm-orderflow-targeted-comparable-manifest.md`
- `experiments/strategy-destruction-filter/results/usdm-orderflow-targeted-comparable-demo-sim-batch.json`
- `experiments/strategy-destruction-filter/results/usdm-orderflow-targeted-comparable-demo-sim-batch.md`

## Manifest

Selected `80/486` eligible closed DEMO-SIM rows.

Shape:

- Date range: `2026-08-19` to `2026-09-27`
- Original/outside-cluster rows: `4/76`
- Comparable buckets: 8 buckets, mostly 10 rows each
- Setups: range-breakout long `40`, trend-pullback-reclaim long `20`, momentum-reversal long `10`, trend-pullback-reject short `10`
- Directions: long `70`, short `10`
- BTC gates: `BTC_RISK_ON` `40`, `BTC_TRANSITION` `30`, `BTC_RISK_OFF` `10`
- Outcomes: positive `36`, negative `44`

This is deliberately not a broad market sample. It is a falsification sample designed to create flagged/unflagged comparisons inside the same setup, direction, timeframe, regime, and BTC-gate buckets.

## Result

All `80/80` rows joined to both USD-M trades and `bookDepth`.

Verdict: `targeted_usdm_absorption_falsification_watch_only_no_promotion`.

Headline:

| Slice | Rows | Win rate | Mean R | Median R | Net PnL USD |
| --- | ---: | ---: | ---: | ---: | ---: |
| all | 80 | 45.00% | 0.1521 | -1.0216 | 2837.32 |
| absorptionProxy=true | 41 | 58.54% | 0.5493 | 0.9997 | 5970.42 |
| absorptionProxy=false | 39 | 30.77% | -0.2654 | -1.0382 | -3133.10 |
| liquidityThinningProxy=true | 9 | 44.44% | 0.0696 | -1.0187 | -449.02 |
| liquidityThinningProxy=false | 71 | 45.07% | 0.1626 | -1.0316 | 3286.35 |
| alignedCvd=true | 43 | 58.14% | 0.5392 | 0.9997 | 6192.85 |
| alignedCvd=false | 37 | 29.73% | -0.2977 | -1.0382 | -3355.53 |

Comparable-bucket result:

| Feature | Scope | Buckets | Rows | Flagged rows | Flagged mean R | Unflagged mean R | Mean lift R |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| absorptionProxy | all | 8 | 80 | 41 | 0.5493 | -0.2654 | 0.8799 |
| absorptionProxy | outside original cluster | 8 | 76 | 37 | 0.4963 | -0.2654 | 0.8651 |
| liquidityThinningProxy | outside original cluster | 5 | 46 | 8 | 0.2113 | 0.0432 | -0.2013 |
| alignedCvd | outside original cluster | 8 | 76 | 39 | 0.4879 | -0.2977 | 0.8817 |

Entry-candle-only proxy:

| Feature | Scope | Buckets | Rows | Flagged mean net opportunity R | Unflagged mean net opportunity R | Mean lift R |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| absorptionProxy | outside original cluster | 8 | 76 | 0.6865 | -0.1172 | 0.8037 |
| liquidityThinningProxy | outside original cluster | 5 | 46 | 0.4239 | 0.3184 | 0.1056 |
| alignedCvd | outside original cluster | 8 | 76 | 0.6477 | -0.1197 | 0.7673 |

The candle proxy is entry-candle-only from the DEMO-SIM row's `candleRange`, not full-path MFE/MAE.

## Decision

Absorption survived this targeted falsification pass as a **research feature**, not as a candidate strategy or alert gate.

Decision:

- Do not mark absorption context-only from this test.
- Do not promote absorption into watcher, paper/demo, live alert, risk, sizing, TP/SL, or execution logic.
- Treat absorption and aligned CVD as likely overlapping views of the same tape condition in this implementation.
- Treat liquidity-thinning as weak/mixed; it is not useful as a positive support feature from this sample.

Main caveats:

- The targeted manifest was selected to create comparable buckets, so it is not a neutral population estimate.
- It reuses existing DEMO-SIM outcomes.
- The candle baseline is entry-candle-only; full-path MFE/MAE would require joining candle series across the replay horizon.

Next best action is to stop tuning absorption for now. If this feature is revisited, require either fresh forward rows or a proper full-path MFE/MAE/candle-series join before any new claim.
