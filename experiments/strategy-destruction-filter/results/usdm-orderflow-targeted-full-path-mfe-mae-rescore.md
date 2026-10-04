# USD-M Absorption Full-Path MFE/MAE Rescore

Generated: 2026-10-03T16:22:09.259Z

Research-only full-path candle-series MFE/MAE rescore for the existing targeted USD-M absorption sample. It does not change live alerts, watcher gates, paper/demo logic, schedulers, thresholds, sizing, TP/SL, execution, accounts, keys, paid services, public posting, or strategy status.

## Decision

- Verdict: full_path_absorption_research_feature_watch_only_no_promotion
- Reason: Outside the original cluster, absorption comparable buckets show final R lift 0.8651 and MFE lift 0.3469 across 76 rows. This is full-path candle evidence, but it still reuses frozen DEMO-SIM outcomes and remains no-promotion.
- Rows with full path: 76/80
- Mean MFE/MAE R: 1.3947 / 0.9976
- Losing rows that offered >=1R before exit: 12
- Winning rows that suffered >=1R adverse before exit: 0

## Feature Slices

| Slice | Rows | Full path | Win rate | Mean final R | Median final R | Mean MFE R | Mean MAE R | Mean net path opp R | Losers offered 1R | Winners suffered 1R |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| all | 80 | 76 | 43.42 | 0.1054 | -1.0279 | 1.3947 | 0.9976 | 0.3971 | 12 | 0 |
| absorptionProxy=true | 41 | 37 | 56.76 | 0.4963 | 0.9769 | 1.5574 | 0.8427 | 0.7147 | 2 | 0 |
| absorptionProxy=false | 39 | 39 | 30.77 | -0.2654 | -1.0382 | 1.2404 | 1.1446 | 0.0958 | 10 | 0 |
| alignedCvd=true | 43 | 39 | 56.41 | 0.4879 | 0.9769 | 1.5531 | 0.8606 | 0.6924 | 2 | 0 |
| alignedCvd=false | 37 | 37 | 29.73 | -0.2977 | -1.0382 | 1.2278 | 1.142 | 0.0858 | 10 | 0 |
| liquidityThinningProxy=true | 9 | 8 | 50 | 0.2113 | -0.2514 | 1.4787 | 0.7438 | 0.7349 | 1 | 0 |
| liquidityThinningProxy=false | 71 | 68 | 42.65 | 0.093 | -1.0349 | 1.3848 | 1.0275 | 0.3574 | 11 | 0 |

## Comparable Full-Path Buckets

Feature comparisons are restricted to rows with the same setup, direction, timeframe, market regime, and BTC gate, and only buckets with both flagged and unflagged rows.

| Feature | Scope | Buckets | Rows | Flagged rows | Final R lift | MFE R lift | MAE R lift | Net path opp lift R |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| absorptionProxy | all | 8 | 76 | 37 | 0.8651 | 0.3469 | -0.3164 | 0.6633 |
| alignedCvd | all | 8 | 76 | 39 | 0.8817 | 0.3743 | -0.3044 | 0.6787 |
| liquidityThinningProxy | all | 5 | 46 | 8 | -0.2013 | -0.3428 | -0.2062 | -0.1367 |
| absorptionProxy | outsideOriginalCluster | 8 | 76 | 37 | 0.8651 | 0.3469 | -0.3164 | 0.6633 |
| alignedCvd | outsideOriginalCluster | 8 | 76 | 39 | 0.8817 | 0.3743 | -0.3044 | 0.6787 |
| liquidityThinningProxy | outsideOriginalCluster | 5 | 46 | 8 | -0.2013 | -0.3428 | -0.2062 | -0.1367 |

## Bucket Details

| Feature | Scope | Bucket | Rows | Flagged | Final R lift | MFE R lift | MAE R lift | Net path opp lift R |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| absorptionProxy | all | momentum_reversal_long|long|4h|range/mid-vol|BTC_RISK_OFF | 10 | 4 | -0.6957 | -0.8103 | 0.3922 | -1.2025 |
| absorptionProxy | all | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 5 | 1.7577 | 0.5613 | -0.6204 | 1.1817 |
| absorptionProxy | all | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 5 | 1.5619 | 0.4748 | -1.0987 | 1.5735 |
| absorptionProxy | all | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 7 | 0.8037 | 0.2558 | -0.0664 | 0.3222 |
| absorptionProxy | all | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_TRANSITION | 10 | 3 | 0.6473 | 0.4571 | -0.0034 | 0.4605 |
| absorptionProxy | all | trend_pullback_reject_short|short|4h|down/mid-vol|BTC_TRANSITION | 10 | 4 | 1.0833 | 0.5888 | -0.3748 | 0.9637 |
| absorptionProxy | all | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 9 | 4 | 1.7839 | 0.8233 | -0.8416 | 1.6649 |
| absorptionProxy | all | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 7 | 5 | -0.27 | 0.5257 | 0.1771 | 0.3485 |
| alignedCvd | all | momentum_reversal_long|long|4h|range/mid-vol|BTC_RISK_OFF | 10 | 5 | -0.0111 | -0.3378 | 0.2623 | -0.6001 |
| alignedCvd | all | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 5 | 1.7577 | 0.5613 | -0.6204 | 1.1817 |
| alignedCvd | all | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 5 | 1.5619 | 0.4748 | -1.0987 | 1.5735 |
| alignedCvd | all | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 7 | 0.8037 | 0.2558 | -0.0664 | 0.3222 |
| alignedCvd | all | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_TRANSITION | 10 | 4 | 0.0889 | 0.1931 | 0.2181 | -0.0251 |
| alignedCvd | all | trend_pullback_reject_short|short|4h|down/mid-vol|BTC_TRANSITION | 10 | 4 | 1.0833 | 0.5888 | -0.3748 | 0.9637 |
| alignedCvd | all | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 9 | 4 | 1.7839 | 0.8233 | -0.8416 | 1.6649 |
| alignedCvd | all | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 7 | 5 | -0.27 | 0.5257 | 0.1771 | 0.3485 |
| liquidityThinningProxy | all | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 2 | -0.4942 | -0.3569 | -0.2545 | -0.1025 |
| liquidityThinningProxy | all | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 1 | -1.476 | -1.1668 | 0.2361 | -1.403 |
| liquidityThinningProxy | all | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 1 | -0.6093 | -0.7076 | -0.2139 | -0.4939 |
| liquidityThinningProxy | all | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 9 | 2 | 0.0559 | -0.3508 | -0.3931 | 0.0422 |
| liquidityThinningProxy | all | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 7 | 2 | 2.29 | 1.3861 | -0.5176 | 1.9037 |
| absorptionProxy | outsideOriginalCluster | momentum_reversal_long|long|4h|range/mid-vol|BTC_RISK_OFF | 10 | 4 | -0.6957 | -0.8103 | 0.3922 | -1.2025 |
| absorptionProxy | outsideOriginalCluster | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 5 | 1.7577 | 0.5613 | -0.6204 | 1.1817 |
| absorptionProxy | outsideOriginalCluster | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 5 | 1.5619 | 0.4748 | -1.0987 | 1.5735 |
| absorptionProxy | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 7 | 0.8037 | 0.2558 | -0.0664 | 0.3222 |
| absorptionProxy | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_TRANSITION | 10 | 3 | 0.6473 | 0.4571 | -0.0034 | 0.4605 |
| absorptionProxy | outsideOriginalCluster | trend_pullback_reject_short|short|4h|down/mid-vol|BTC_TRANSITION | 10 | 4 | 1.0833 | 0.5888 | -0.3748 | 0.9637 |
| absorptionProxy | outsideOriginalCluster | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 9 | 4 | 1.7839 | 0.8233 | -0.8416 | 1.6649 |
| absorptionProxy | outsideOriginalCluster | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 7 | 5 | -0.27 | 0.5257 | 0.1771 | 0.3485 |
| alignedCvd | outsideOriginalCluster | momentum_reversal_long|long|4h|range/mid-vol|BTC_RISK_OFF | 10 | 5 | -0.0111 | -0.3378 | 0.2623 | -0.6001 |
| alignedCvd | outsideOriginalCluster | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 5 | 1.7577 | 0.5613 | -0.6204 | 1.1817 |
| alignedCvd | outsideOriginalCluster | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 5 | 1.5619 | 0.4748 | -1.0987 | 1.5735 |
| alignedCvd | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 7 | 0.8037 | 0.2558 | -0.0664 | 0.3222 |
| alignedCvd | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_TRANSITION | 10 | 4 | 0.0889 | 0.1931 | 0.2181 | -0.0251 |
| alignedCvd | outsideOriginalCluster | trend_pullback_reject_short|short|4h|down/mid-vol|BTC_TRANSITION | 10 | 4 | 1.0833 | 0.5888 | -0.3748 | 0.9637 |
| alignedCvd | outsideOriginalCluster | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 9 | 4 | 1.7839 | 0.8233 | -0.8416 | 1.6649 |
| alignedCvd | outsideOriginalCluster | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 7 | 5 | -0.27 | 0.5257 | 0.1771 | 0.3485 |
| liquidityThinningProxy | outsideOriginalCluster | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 2 | -0.4942 | -0.3569 | -0.2545 | -0.1025 |
| liquidityThinningProxy | outsideOriginalCluster | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 1 | -1.476 | -1.1668 | 0.2361 | -1.403 |
| liquidityThinningProxy | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 1 | -0.6093 | -0.7076 | -0.2139 | -0.4939 |
| liquidityThinningProxy | outsideOriginalCluster | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 9 | 2 | 0.0559 | -0.3508 | -0.3931 | 0.0422 |
| liquidityThinningProxy | outsideOriginalCluster | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 7 | 2 | 2.29 | 1.3861 | -0.5176 | 1.9037 |

## Row Sample

| Event | Setup | Direction | Final R | MFE R | MAE R | Bars to MFE/MAE | Flags |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| LINK:4h:range_breakout_long:1787126400 | range_breakout_long 4h up/mid-vol BTC_RISK_ON | long | 1.7603 | n/a | n/a | n/a/n/a | absorptionProxy, alignedCvd |
| ETH:1h:range_breakout_long:1787169600 | range_breakout_long 1h up/mid-vol BTC_RISK_ON | long | 1.7415 | n/a | n/a | n/a/n/a | absorptionProxy, alignedCvd |
| SOL:1h:range_breakout_long:1787169600 | range_breakout_long 1h up/mid-vol BTC_RISK_ON | long | 1.7186 | n/a | n/a | n/a/n/a | absorptionProxy, alignedCvd |
| ADA:1h:range_breakout_long:1787173200 | range_breakout_long 1h up/mid-vol BTC_RISK_ON | long | -1.0634 | n/a | n/a | n/a/n/a | absorptionProxy, alignedCvd, liquidityThinningProxy |
| XRP:4h:range_breakout_long:1787212800 | range_breakout_long 4h up/mid-vol BTC_RISK_ON | long | 1.623 | 2.49 | 0.4133 | 1/1 | absorptionProxy, alignedCvd |
| ADA:4h:range_breakout_long:1787270400 | range_breakout_long 4h up/high-vol BTC_RISK_ON | long | 0.9769 | 1.02 | 0.38 | 3/1 | absorptionProxy, alignedCvd |
| LINK:4h:range_breakout_long:1787270400 | range_breakout_long 4h up/high-vol BTC_RISK_ON | long | 1.7294 | 2.7853 | 0.1529 | 1/1 | absorptionProxy, alignedCvd |
| DOGE:1h:range_breakout_long:1787342400 | range_breakout_long 1h up/mid-vol BTC_RISK_ON | long | 1.7546 | 2.101 | 0.1511 | 1/1 | none |
| ETH:4h:range_breakout_long:1787342400 | range_breakout_long 4h up/high-vol BTC_RISK_ON | long | -1.0316 | 0.1562 | 1.4977 | 2/2 | none |
| SOL:4h:range_breakout_long:1787342400 | range_breakout_long 4h up/mid-vol BTC_RISK_ON | long | -1.0375 | 3.28 | 2.1818 | 2/2 | none |
| AVAX:1h:range_breakout_long:1787346000 | range_breakout_long 1h up/mid-vol BTC_RISK_ON | long | 1.7971 | 2.8789 | 0.1105 | 7/1 | absorptionProxy, alignedCvd, liquidityThinningProxy |
| LINK:1h:range_breakout_long:1787346000 | range_breakout_long 1h up/mid-vol BTC_RISK_ON | long | -1.0495 | 0.8889 | 1.1074 | 1/3 | absorptionProxy, alignedCvd |
| BNB:4h:range_breakout_long:1787356800 | range_breakout_long 4h up/mid-vol BTC_RISK_ON | long | -1.0434 | 0.4377 | 1.9182 | 1/1 | none |
| SOL:4h:range_breakout_long:1787356800 | range_breakout_long 4h up/high-vol BTC_RISK_ON | long | -1.0351 | 1.9637 | 2.9934 | 1/1 | none |
| XRP:4h:range_breakout_long:1787356800 | range_breakout_long 4h up/high-vol BTC_RISK_ON | long | -1.0191 | 1.5544 | 2.0222 | 1/1 | none |
| AVAX:4h:trend_pullback_reclaim_long:1787616000 | trend_pullback_reclaim_long 4h up/mid-vol BTC_RISK_ON | long | -1.0419 | 0.42 | 1.49 | 1/3 | absorptionProxy, alignedCvd |
| LINK:4h:trend_pullback_reclaim_long:1787774400 | trend_pullback_reclaim_long 4h up/mid-vol BTC_RISK_ON | long | -1.0387 | 1.3303 | 1.1212 | 7/11 | none |
| AVAX:4h:trend_pullback_reclaim_long:1787832000 | trend_pullback_reclaim_long 4h up/mid-vol BTC_RISK_ON | long | -1.0435 | 0.4053 | 1.0368 | 3/5 | liquidityThinningProxy |
| SOL:4h:range_breakout_long:1787832000 | range_breakout_long 4h up/mid-vol BTC_RISK_ON | long | -1.0384 | 1.1075 | 1.1629 | 2/6 | liquidityThinningProxy |
| AVAX:4h:trend_pullback_reject_short:1787918400 | trend_pullback_reject_short 4h down/mid-vol BTC_TRANSITION | short | -0.4948 | 0.6944 | 0.6 | 1/12 | absorptionProxy, alignedCvd |
| SOL:4h:trend_pullback_reclaim_long:1788004800 | trend_pullback_reclaim_long 4h up/mid-vol BTC_TRANSITION | long | -1.0375 | 0.7955 | 1.5325 | 6/8 | none |
| SOL:4h:trend_pullback_reclaim_long:1788091200 | trend_pullback_reclaim_long 4h up/mid-vol BTC_RISK_ON | long | -1.0573 | 0.4216 | 2.9314 | 1/2 | absorptionProxy, alignedCvd |
| AVAX:4h:trend_pullback_reject_short:1788120000 | trend_pullback_reject_short 4h down/mid-vol BTC_TRANSITION | short | -1.0602 | 0.2231 | 1.0385 | 1/2 | none |
| DOGE:4h:trend_pullback_reject_short:1788120000 | trend_pullback_reject_short 4h down/mid-vol BTC_TRANSITION | short | -1.0608 | 0.4244 | 1.3 | 1/5 | none |
| ETH:4h:trend_pullback_reject_short:1788120000 | trend_pullback_reject_short 4h down/mid-vol BTC_TRANSITION | short | -1.0765 | 0.4469 | 1.1839 | 1/3 | none |
| LINK:4h:trend_pullback_reject_short:1788206400 | trend_pullback_reject_short 4h down/mid-vol BTC_TRANSITION | short | 0.7252 | 1.5846 | 0.7846 | 9/4 | absorptionProxy, alignedCvd |
| XRP:4h:trend_pullback_reject_short:1788206400 | trend_pullback_reject_short 4h down/mid-vol BTC_TRANSITION | short | 1.6161 | 1.76 | 0.5567 | 7/2 | absorptionProxy, alignedCvd |
| XRP:4h:trend_pullback_reject_short:1788235200 | trend_pullback_reject_short 4h down/mid-vol BTC_TRANSITION | short | 1.9494 | 2.34 | 0.25 | 7/1 | absorptionProxy, alignedCvd |
| SOL:4h:momentum_reversal_long:1788307200 | momentum_reversal_long 4h range/mid-vol BTC_RISK_OFF | long | -1.0424 | 0.0538 | 1.1192 | 1/2 | none |
| BNB:4h:range_breakout_long:1788422400 | range_breakout_long 4h range/mid-vol BTC_TRANSITION | long | 1.714 | 1.807 | 0.3021 | 1/1 | absorptionProxy, alignedCvd |
| ADA:4h:range_breakout_long:1788436800 | range_breakout_long 4h range/mid-vol BTC_TRANSITION | long | -1.0242 | 0.72 | 1.08 | 4/6 | liquidityThinningProxy |
| AVAX:4h:range_breakout_long:1788436800 | range_breakout_long 4h range/mid-vol BTC_TRANSITION | long | -1.0551 | 0.4533 | 1.6067 | 2/6 | none |
| DOGE:4h:range_breakout_long:1788436800 | range_breakout_long 4h range/mid-vol BTC_TRANSITION | long | -1.0465 | 0.3741 | 1.2405 | 1/3 | absorptionProxy, alignedCvd |
| LINK:4h:range_breakout_long:1788436800 | range_breakout_long 4h range/mid-vol BTC_TRANSITION | long | -1.0447 | 1.3241 | 1.0897 | 5/6 | none |
| BNB:4h:range_breakout_long:1788580800 | range_breakout_long 4h up/mid-vol BTC_RISK_ON | long | 1.7416 | 2.4363 | 0.0064 | 2/1 | liquidityThinningProxy |
| DOGE:4h:range_breakout_long:1788624000 | range_breakout_long 4h up/high-vol BTC_RISK_ON | long | -1.0347 | 0.4311 | 1.0742 | 3/5 | none |
| DOGE:4h:trend_pullback_reclaim_long:1788868800 | trend_pullback_reclaim_long 4h up/mid-vol BTC_TRANSITION | long | -1.0415 | 0.3912 | 1.0572 | 6/6 | none |
| XRP:4h:trend_pullback_reclaim_long:1788868800 | trend_pullback_reclaim_long 4h up/mid-vol BTC_TRANSITION | long | -1.0786 | 1.035 | 1.22 | 1/6 | none |
| DOGE:4h:trend_pullback_reclaim_long:1788897600 | trend_pullback_reclaim_long 4h up/mid-vol BTC_TRANSITION | long | -1.0454 | 0.7051 | 1.6117 | 4/5 | alignedCvd |
| DOGE:4h:trend_pullback_reclaim_long:1788926400 | trend_pullback_reclaim_long 4h up/mid-vol BTC_RISK_ON | long | -1.0451 | 0.3157 | 1.2537 | 2/2 | absorptionProxy, alignedCvd |

## Interpretation

- Full-path MFE/MAE uses the same candle-source resolution as `historical-demo-sim-replay.mjs` and measures from the first candle after entry through the exit candle.
- MFE/MAE R is gross path excursion relative to entry-stop risk. Final R remains the DEMO-SIM net R after fees.
- The previous `candleOnlyFeatures` field in the USD-M orderflow batch should be treated as a single-candle proxy only; this report is the durable full-path measurement surface.
- A positive absorption result here remains a research feature, not a watcher, paper/demo, live alert, risk, sizing, TP/SL, execution, or promotion rule.

## Boundary

No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed.
