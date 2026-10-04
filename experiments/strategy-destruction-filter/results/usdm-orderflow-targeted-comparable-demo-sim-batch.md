# USD-M Orderflow DEMO-SIM Batch

Generated: 2026-09-29T16:53:54.714Z

Research-only Binance USD-M archive batch joining futures trades and coarse bookDepth rows to frozen DEMO-SIM events. It does not change live alerts, watcher gates, paper/demo logic, schedulers, thresholds, sizing, TP/SL, execution, accounts, keys, paid services, public posting, or strategy status.

## Decision

- Verdict: targeted_usdm_absorption_falsification_watch_only_no_promotion
- Reason: USD-M public archives joined to 80/80 bucket-targeted frozen DEMO-SIM rows with both futures trades and coarse bookDepth. Absorption proxy mean R=0.5493 vs unflagged mean R=-0.2654; outside the original cluster, comparable-bucket absorption lift is 0.8651 R across 76 rows. Absorption is watch-only and not promoted.
- Manifest: results/usdm-orderflow-targeted-comparable-manifest.json
- Analyzed windows: 80/80
- Rows with trades/bookDepth: 80/80
- Positive/negative outcome rows: 36/44
- Absorption proxy rows: 41
- Liquidity-thinning proxy rows: 9
- Aligned CVD rows: 43
- Rows with entry-candle excursion proxy: 80
- Original/outside-cluster rows: 4/76
- Absorption kill condition: not triggered, still watch-only/no-promotion

## Feature Outcome Comparison

| Slice | Rows | Win rate | Mean R | Median R | Net PnL USD |
| --- | ---: | ---: | ---: | ---: | ---: |
| all | 80 | 45 | 0.1521 | -1.0216 | 2837.32 |
| absorptionProxy=true | 41 | 58.54 | 0.5493 | 0.9997 | 5970.42 |
| absorptionProxy=false | 39 | 30.77 | -0.2654 | -1.0382 | -3133.1 |
| liquidityThinningProxy=true | 9 | 44.44 | 0.0696 | -1.0187 | -449.02 |
| liquidityThinningProxy=false | 71 | 45.07 | 0.1626 | -1.0316 | 3286.35 |
| alignedCvd=true | 43 | 58.14 | 0.5392 | 0.9997 | 6192.85 |
| alignedCvd=false | 37 | 29.73 | -0.2977 | -1.0382 | -3355.53 |

## Comparable Setup/Regime Buckets

Feature comparisons below are restricted to buckets with the same setup, direction, timeframe, market regime, and BTC gate, and only buckets that have both flagged and unflagged rows.

| Feature | Scope | Buckets | Rows | Flagged rows | Flagged mean R | Unflagged mean R | Mean lift R |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| absorptionProxy | all | 8 | 80 | 41 | 0.5493 | -0.2654 | 0.8799 |
| liquidityThinningProxy | all | 5 | 50 | 9 | 0.0696 | 0.1674 | -0.4009 |
| alignedCvd | all | 8 | 80 | 43 | 0.5392 | -0.2977 | 0.8957 |
| absorptionProxy | outsideOriginalCluster | 8 | 76 | 37 | 0.4963 | -0.2654 | 0.8651 |
| liquidityThinningProxy | outsideOriginalCluster | 5 | 46 | 8 | 0.2113 | 0.0432 | -0.2013 |
| alignedCvd | outsideOriginalCluster | 8 | 76 | 39 | 0.4879 | -0.2977 | 0.8817 |

## Entry-Candle Excursion Proxy

This is an entry-candle-only candle baseline proxy from the DEMO-SIM row's candle range, not full-path MFE/MAE.

| Feature | Scope | Buckets | Rows | Flagged mean net opportunity R | Unflagged mean net opportunity R | Mean lift R |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| absorptionProxy | all | 8 | 80 | 0.7806 | -0.1172 | 0.8978 |
| liquidityThinningProxy | all | 5 | 50 | 0.232 | 0.4879 | -0.2558 |
| alignedCvd | all | 8 | 80 | 0.741 | -0.1197 | 0.8606 |
| absorptionProxy | outsideOriginalCluster | 8 | 76 | 0.6865 | -0.1172 | 0.8037 |
| liquidityThinningProxy | outsideOriginalCluster | 5 | 46 | 0.4239 | 0.3184 | 0.1056 |
| alignedCvd | outsideOriginalCluster | 8 | 76 | 0.6477 | -0.1197 | 0.7673 |

## Comparable Bucket Details

| Feature | Scope | Bucket | Rows | Flagged rows | Flagged mean R | Unflagged mean R | Lift R |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| absorptionProxy | all | momentum_reversal_long|long|4h|range/mid-vol|BTC_RISK_OFF | 10 | 4 | -0.3489 | 0.3468 | -0.6957 |
| absorptionProxy | all | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 10 | 8 | 0.3408 | 0.3359 | 0.0049 |
| absorptionProxy | all | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 5 | 1.02 | -0.7377 | 1.7577 |
| absorptionProxy | all | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 5 | 1.0907 | -0.4713 | 1.5619 |
| absorptionProxy | all | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 5 | 1.3914 | -0.4847 | 1.8762 |
| absorptionProxy | all | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 7 | -0.2541 | -1.0578 | 0.8037 |
| absorptionProxy | all | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_TRANSITION | 10 | 3 | 0.5537 | -0.0936 | 0.6473 |
| absorptionProxy | all | trend_pullback_reject_short|short|4h|down/mid-vol|BTC_TRANSITION | 10 | 4 | 0.949 | -0.1343 | 1.0833 |
| liquidityThinningProxy | all | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 10 | 3 | 0.8314 | 0.1291 | 0.7023 |
| liquidityThinningProxy | all | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 2 | -0.2542 | 0.24 | -0.4942 |
| liquidityThinningProxy | all | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 1 | -1.0187 | 0.4573 | -1.476 |
| liquidityThinningProxy | all | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 2 | 0.3516 | 0.4788 | -0.1272 |
| liquidityThinningProxy | all | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 1 | -1.0435 | -0.4342 | -0.6093 |
| alignedCvd | all | momentum_reversal_long|long|4h|range/mid-vol|BTC_RISK_OFF | 10 | 5 | 0.063 | 0.074 | -0.0111 |
| alignedCvd | all | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 10 | 8 | 0.3408 | 0.3359 | 0.0049 |
| alignedCvd | all | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 5 | 1.02 | -0.7377 | 1.7577 |
| alignedCvd | all | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 5 | 1.0907 | -0.4713 | 1.5619 |
| alignedCvd | all | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 5 | 1.3914 | -0.4847 | 1.8762 |
| alignedCvd | all | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 7 | -0.2541 | -1.0578 | 0.8037 |
| alignedCvd | all | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_TRANSITION | 10 | 4 | 0.1539 | 0.065 | 0.0889 |
| alignedCvd | all | trend_pullback_reject_short|short|4h|down/mid-vol|BTC_TRANSITION | 10 | 4 | 0.949 | -0.1343 | 1.0833 |
| absorptionProxy | outsideOriginalCluster | momentum_reversal_long|long|4h|range/mid-vol|BTC_RISK_OFF | 10 | 4 | -0.3489 | 0.3468 | -0.6957 |
| absorptionProxy | outsideOriginalCluster | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 5 | 1.02 | -0.7377 | 1.7577 |
| absorptionProxy | outsideOriginalCluster | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 5 | 1.0907 | -0.4713 | 1.5619 |
| absorptionProxy | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 7 | -0.2541 | -1.0578 | 0.8037 |
| absorptionProxy | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_TRANSITION | 10 | 3 | 0.5537 | -0.0936 | 0.6473 |
| absorptionProxy | outsideOriginalCluster | trend_pullback_reject_short|short|4h|down/mid-vol|BTC_TRANSITION | 10 | 4 | 0.949 | -0.1343 | 1.0833 |
| absorptionProxy | outsideOriginalCluster | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 9 | 4 | 1.2992 | -0.4847 | 1.7839 |
| absorptionProxy | outsideOriginalCluster | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 7 | 5 | 0.0659 | 0.3359 | -0.27 |
| liquidityThinningProxy | outsideOriginalCluster | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 2 | -0.2542 | 0.24 | -0.4942 |
| liquidityThinningProxy | outsideOriginalCluster | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 1 | -1.0187 | 0.4573 | -1.476 |
| liquidityThinningProxy | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 1 | -1.0435 | -0.4342 | -0.6093 |
| liquidityThinningProxy | outsideOriginalCluster | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 9 | 2 | 0.3516 | 0.2957 | 0.0559 |
| liquidityThinningProxy | outsideOriginalCluster | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 7 | 2 | 1.7788 | -0.5112 | 2.29 |
| alignedCvd | outsideOriginalCluster | momentum_reversal_long|long|4h|range/mid-vol|BTC_RISK_OFF | 10 | 5 | 0.063 | 0.074 | -0.0111 |
| alignedCvd | outsideOriginalCluster | range_breakout_long|long|4h|range/mid-vol|BTC_TRANSITION | 10 | 5 | 1.02 | -0.7377 | 1.7577 |
| alignedCvd | outsideOriginalCluster | range_breakout_long|long|4h|up/high-vol|BTC_RISK_ON | 10 | 5 | 1.0907 | -0.4713 | 1.5619 |
| alignedCvd | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_RISK_ON | 10 | 7 | -0.2541 | -1.0578 | 0.8037 |
| alignedCvd | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/mid-vol|BTC_TRANSITION | 10 | 4 | 0.1539 | 0.065 | 0.0889 |
| alignedCvd | outsideOriginalCluster | trend_pullback_reject_short|short|4h|down/mid-vol|BTC_TRANSITION | 10 | 4 | 0.949 | -0.1343 | 1.0833 |
| alignedCvd | outsideOriginalCluster | range_breakout_long|long|4h|up/mid-vol|BTC_RISK_ON | 9 | 4 | 1.2992 | -0.4847 | 1.7839 |
| alignedCvd | outsideOriginalCluster | range_breakout_long|long|1h|up/mid-vol|BTC_RISK_ON | 7 | 5 | 0.0659 | 0.3359 | -0.27 |

## Rows

| Event | Setup | Outcome R | Trades | Book rows | Delta notional | CVD % | Entry progress bps | Entry candle net opp R | Bid depth chg % | Ask depth chg % | Flags |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| LINK:4h:range_breakout_long:1787126400 | range_breakout_long long | 1.7603 | 21351 | 720 | 470750.67 | 5.6862 | -65.5067 | 2.2294 | -7.0738 | -9.9606 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ETH:1h:range_breakout_long:1787169600 | range_breakout_long long | 1.7415 | 197006 | 720 | 61795539.95 | 15.3944 | -476.9805 | 2.7187 | -3 | 1.6495 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| SOL:1h:range_breakout_long:1787169600 | range_breakout_long long | 1.7186 | 31682 | 720 | 1508669.55 | 5.2105 | -157.6684 | 2.9576 | -2.9239 | -1.1007 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ADA:1h:range_breakout_long:1787173200 | range_breakout_long long | -1.0634 | 49124 | 720 | 1470109.75 | 7.0533 | -31.5623 | -1.303 | -15.6889 | -19.5278 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, liquidityThinningProxy, usableForExpansion |
| XRP:4h:range_breakout_long:1787212800 | range_breakout_long long | 1.623 | 51421 | 720 | 9705362.54 | 28.7233 | -517.6471 | 2.0767 | -3.7753 | -9.3085 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ADA:4h:range_breakout_long:1787270400 | range_breakout_long long | 0.9769 | 12116 | 720 | 680496.29 | 14.001 | -495.2381 | 1.02 | -0.2949 | -2.9528 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| LINK:4h:range_breakout_long:1787270400 | range_breakout_long long | 1.7294 | 11669 | 720 | 245981.09 | 8.4271 | -171.4024 | 2.6324 | 16.1108 | -2.8678 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| DOGE:1h:range_breakout_long:1787342400 | range_breakout_long long | 1.7546 | 38397 | 720 | -216512.72 | -2.1806 | -278.1912 | 1.95 | 0.9276 | -2.2972 | weakDirectionalProgress, usableForExpansion |
| ETH:4h:range_breakout_long:1787342400 | range_breakout_long long | -1.0316 | 149924 | 720 | -3822078.42 | -1.5673 | -362.3177 | -1.3415 | 13.8451 | 11.4669 | weakDirectionalProgress, usableForExpansion |
| SOL:4h:range_breakout_long:1787342400 | range_breakout_long long | -1.0375 | 48189 | 720 | -1937575.47 | -4.2043 | -266.752 | 1.0982 | -3.1185 | -3.1638 | weakDirectionalProgress, usableForExpansion |
| AVAX:1h:range_breakout_long:1787346000 | range_breakout_long long | 1.7971 | 12199 | 720 | 322436.7 | 14.3381 | -136.4221 | 2.8789 | -2.7252 | -10.4748 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, liquidityThinningProxy, usableForExpansion |
| LINK:1h:range_breakout_long:1787346000 | range_breakout_long long | -1.0495 | 37146 | 720 | 158706.69 | 1.5657 | -207.2368 | -1.1074 | -5.379 | -0.2695 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BNB:4h:range_breakout_long:1787356800 | range_breakout_long long | -1.0434 | 53107 | 720 | -159603.55 | -0.9252 | -459.5396 | -1.4805 | -0.2562 | -2.4584 | weakDirectionalProgress, usableForExpansion |
| SOL:4h:range_breakout_long:1787356800 | range_breakout_long long | -1.0351 | 74655 | 720 | -7453772.17 | -9.4818 | -332.679 | -1.0297 | 2.0238 | -5.267 | weakDirectionalProgress, usableForExpansion |
| XRP:4h:range_breakout_long:1787356800 | range_breakout_long long | -1.0191 | 183690 | 720 | -4850632.6 | -6.5451 | -834.6154 | -0.4678 | -2.5437 | -4.4356 | weakDirectionalProgress, usableForExpansion |
| AVAX:4h:trend_pullback_reclaim_long:1787616000 | trend_pullback_reclaim_long long | -1.0419 | 9191 | 720 | 179266.85 | 12.5137 | -94.4882 | -1.49 | 0.2893 | -1.9162 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| LINK:4h:trend_pullback_reclaim_long:1787774400 | trend_pullback_reclaim_long long | -1.0387 | 7560 | 720 | -295340.69 | -21.2709 | -313.253 | -1.1212 | 0.304 | -4.3706 | weakDirectionalProgress, usableForExpansion |
| AVAX:4h:trend_pullback_reclaim_long:1787832000 | trend_pullback_reclaim_long long | -1.0435 | 5896 | 720 | -271530.85 | -22.7042 | -151.5957 | -1.0368 | 7.7853 | -15.1639 | weakDirectionalProgress, liquidityThinningProxy, usableForExpansion |
| SOL:4h:range_breakout_long:1787832000 | range_breakout_long long | -1.0384 | 65794 | 720 | -3145484.42 | -6.4246 | -278.9179 | -0.9218 | -5.8085 | -14.403 | weakDirectionalProgress, liquidityThinningProxy, usableForExpansion |
| AVAX:4h:trend_pullback_reject_short:1787918400 | trend_pullback_reject_short short | -0.4948 | 5043 | 720 | -95927.39 | -14.6357 | -100.955 | -0.6 | -4.9219 | 2.2194 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| SOL:4h:trend_pullback_reclaim_long:1788004800 | trend_pullback_reclaim_long long | -1.0375 | 17386 | 720 | -858388.79 | -6.4343 | -138.0558 | -1.2078 | 0.728 | -2.5481 | weakDirectionalProgress, usableForExpansion |
| SOL:4h:trend_pullback_reclaim_long:1788091200 | trend_pullback_reclaim_long long | -1.0573 | 41387 | 720 | 6487409.88 | 13.3906 | -55.5085 | -2.9314 | -9.7958 | 10.8499 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| AVAX:4h:trend_pullback_reject_short:1788120000 | trend_pullback_reject_short short | -1.0602 | 4758 | 720 | 46733.02 | 5.8408 | -434.5992 | -1.0385 | -1.6931 | 8.3141 | weakDirectionalProgress, usableForExpansion |
| DOGE:4h:trend_pullback_reject_short:1788120000 | trend_pullback_reject_short short | -1.0608 | 13499 | 720 | 164923.54 | 3.6383 | -454.6009 | -1.3 | 0.4961 | 6.7853 | weakDirectionalProgress, usableForExpansion |
| ETH:4h:trend_pullback_reject_short:1788120000 | trend_pullback_reject_short short | -1.0765 | 64957 | 720 | 24252336.96 | 23.8988 | -359.4717 | -1.1839 | -3.714 | 19.1911 | weakDirectionalProgress, usableForExpansion |
| LINK:4h:trend_pullback_reject_short:1788206400 | trend_pullback_reject_short short | 0.7252 | 9353 | 720 | -366151.19 | -17.199 | -77.7385 | 1.1231 | -2.5657 | 3.7334 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| XRP:4h:trend_pullback_reject_short:1788206400 | trend_pullback_reject_short short | 1.6161 | 35837 | 720 | -658540.79 | -4.6831 | -59.4203 | 1.76 | -4.799 | -3.1774 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| XRP:4h:trend_pullback_reject_short:1788235200 | trend_pullback_reject_short short | 1.9494 | 29299 | 720 | -1189193.07 | -11.53 | -24.6377 | 2.34 | 3.9712 | 0.3703 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| SOL:4h:momentum_reversal_long:1788307200 | momentum_reversal_long long | -1.0424 | 26128 | 720 | -20922.01 | -0.1149 | -27.919 | -1.1192 | -0.8062 | 6.1743 | weakDirectionalProgress, usableForExpansion |
| BNB:4h:range_breakout_long:1788422400 | range_breakout_long long | 1.714 | 29646 | 720 | 2418370.99 | 21.0992 | -133.2527 | 1.5049 | -0.6082 | 4.4502 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ADA:4h:range_breakout_long:1788436800 | range_breakout_long long | -1.0242 | 10667 | 720 | -351093.77 | -11.0502 | -568.1818 | -0.86 | 20.8869 | -16.039 | weakDirectionalProgress, liquidityThinningProxy, usableForExpansion |
| AVAX:4h:range_breakout_long:1788436800 | range_breakout_long long | -1.0551 | 6582 | 720 | -111719.46 | -8.366 | -290.2796 | -1.6067 | -3.7258 | 5.7802 | weakDirectionalProgress, usableForExpansion |
| DOGE:4h:range_breakout_long:1788436800 | range_breakout_long long | -1.0465 | 16899 | 720 | 1020831.71 | 14.8732 | -665.9193 | -1.2405 | 6.6107 | -0.4306 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| LINK:4h:range_breakout_long:1788436800 | range_breakout_long long | -1.0447 | 9498 | 720 | -215438.1 | -10.9664 | -414.2615 | -0.0517 | -0.7832 | -9.852 | weakDirectionalProgress, usableForExpansion |
| BNB:4h:range_breakout_long:1788580800 | range_breakout_long long | 1.7416 | 15779 | 720 | -1965416.96 | -39.4309 | -213.3424 | 2.4363 | -2.1905 | -12.6015 | weakDirectionalProgress, liquidityThinningProxy, usableForExpansion |
| DOGE:4h:range_breakout_long:1788624000 | range_breakout_long long | -1.0347 | 20194 | 720 | -1179795.34 | -14.9404 | -375.592 | -1.0742 | -4.3112 | 0 | weakDirectionalProgress, usableForExpansion |
| DOGE:4h:trend_pullback_reclaim_long:1788868800 | trend_pullback_reclaim_long long | -1.0415 | 48257 | 720 | -8696386.15 | -30.4349 | -216.2162 | -0.666 | -0.9727 | 0 | weakDirectionalProgress, usableForExpansion |
| XRP:4h:trend_pullback_reclaim_long:1788868800 | trend_pullback_reclaim_long long | -1.0786 | 34920 | 720 | -1921896.92 | -9.6669 | -297.2028 | -0.735 | -4.5585 | 82.8351 | weakDirectionalProgress, usableForExpansion |
| DOGE:4h:trend_pullback_reclaim_long:1788897600 | trend_pullback_reclaim_long long | -1.0454 | 30637 | 720 | 866446.64 | 7.0715 | 29.9833 | -1.6117 | -0.1175 | 0 | alignedAggressiveFlow, alignedCvd, usableForExpansion |
| DOGE:4h:trend_pullback_reclaim_long:1788926400 | trend_pullback_reclaim_long long | -1.0451 | 28398 | 720 | 888224.58 | 8.4931 | -89.1187 | -0.938 | 0.7235 | 0 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ETH:4h:trend_pullback_reclaim_long:1788926400 | trend_pullback_reclaim_long long | -1.0768 | 106732 | 720 | 7238432.17 | 3.5793 | -58.2745 | -0.8067 | 0.1066 | 0 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BNB:4h:momentum_reversal_long:1788998400 | momentum_reversal_long long | -1.0606 | 34624 | 720 | 1411313.79 | 13.5455 | -9.535 | -1.5244 | -1.7732 | 1.7302 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| LINK:4h:momentum_reversal_long:1788998400 | momentum_reversal_long long | -1.0382 | 11463 | 720 | -75874.93 | -2.6207 | -37.2566 | -1.1088 | -0.9966 | 0 | weakDirectionalProgress, usableForExpansion |
| SOL:4h:momentum_reversal_long:1788998400 | momentum_reversal_long long | -1.0536 | 29589 | 720 | 1879841.01 | 7.7017 | -44.1913 | -1.5933 | 3.4676 | 12.7155 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BNB:4h:momentum_reversal_long:1789056000 | momentum_reversal_long long | 1.7393 | 29841 | 720 | -224104.94 | -2.2365 | -105.826 | 1.4988 | 3.8445 | 10.977 | weakDirectionalProgress, usableForExpansion |
| DOGE:4h:momentum_reversal_long:1789056000 | momentum_reversal_long long | 1.7598 | 32648 | 720 | -619659.62 | -5.696 | -71.4881 | 1.1937 | -13.0064 | 10.896 | weakDirectionalProgress, usableForExpansion |
| AVAX:4h:momentum_reversal_long:1789084800 | momentum_reversal_long long | -1.0483 | 11825 | 720 | -229935.11 | -9.2677 | -6.7024 | 1.1471 | -4.2708 | 27.4497 | weakDirectionalProgress, usableForExpansion |
| DOGE:4h:momentum_reversal_long:1789084800 | momentum_reversal_long long | 1.7565 | 29127 | 720 | 1031482.98 | 10.4368 | -38.209 | 1.4636 | 18.6697 | -7.133 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| LINK:4h:momentum_reversal_long:1789084800 | momentum_reversal_long long | 1.7105 | 13788 | 720 | 152198.53 | 4.7886 | 2.6087 | 1.4688 | 1.8941 | 7.9231 | alignedAggressiveFlow, alignedCvd, usableForExpansion |
| AVAX:4h:momentum_reversal_long:1789128000 | momentum_reversal_long long | -1.0379 | 8249 | 720 | 185868.43 | 12.5108 | -313.9842 | -1.3682 | 7.4557 | -3.4344 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ETH:4h:trend_pullback_reclaim_long:1789315200 | trend_pullback_reclaim_long long | 1.7411 | 86016 | 720 | 34442991.99 | 18.1266 | -26.0174 | 2.3266 | -11.7117 | -3.2576 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| DOGE:4h:trend_pullback_reject_short:1789372800 | trend_pullback_reject_short short | -1.0764 | 17426 | 720 | 469030.96 | 8.4779 | -11.8878 | -0.8257 | -2.8 | 5.1903 | weakDirectionalProgress, usableForExpansion |
| ETH:4h:trend_pullback_reclaim_long:1789401600 | trend_pullback_reclaim_long long | 1.7192 | 92756 | 720 | -13619509.62 | -11.272 | -130.8268 | 1.4007 | 2.6806 | 2.0753 | weakDirectionalProgress, usableForExpansion |
| XRP:4h:range_breakout_long:1789401600 | range_breakout_long long | -1.0803 | 48379 | 720 | -826571.36 | -4.3006 | -400 | -0.27 | 2.684 | -2.1985 | weakDirectionalProgress, usableForExpansion |
| AVAX:1h:range_breakout_long:1789416000 | range_breakout_long long | -1.0944 | 12796 | 720 | 134721.96 | 3.505 | -62.1762 | -1.0111 | -6.3193 | -6.5859 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BNB:4h:trend_pullback_reject_short:1789416000 | trend_pullback_reject_short short | 1.7108 | 23183 | 720 | 430609.71 | 6.8315 | -120.0688 | 1.8205 | -5.4714 | 7.9116 | weakDirectionalProgress, usableForExpansion |
| ADA:4h:trend_pullback_reject_short:1789430400 | trend_pullback_reject_short short | 1.7574 | 10148 | 720 | 62027.27 | 3.2169 | -141.3255 | 2.3031 | -2.8741 | 3.1212 | weakDirectionalProgress, usableForExpansion |
| ADA:4h:range_breakout_long:1789689600 | range_breakout_long long | 0.9758 | 9194 | 720 | 135609.69 | 4.83 | -772.7273 | 1.5 | -4.9559 | -4.9882 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| AVAX:4h:range_breakout_long:1789689600 | range_breakout_long long | 1.7133 | 7170 | 720 | 24997.48 | 1.7128 | -431.4465 | 2.3 | -7.6863 | -3.3872 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| SOL:4h:range_breakout_long:1789704000 | range_breakout_long long | 1.7434 | 101439 | 720 | 7016769.52 | 5.4424 | -103.0441 | 2.5789 | -4.2512 | -6.4418 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ETH:4h:range_breakout_long:1789732800 | range_breakout_long long | 0.5158 | 91930 | 720 | -11191969.73 | -9.1501 | -311.3705 | 0.3905 | 4.5187 | -11.3595 | weakDirectionalProgress, liquidityThinningProxy, usableForExpansion |
| AVAX:4h:range_breakout_long:1789776000 | range_breakout_long long | 1.8212 | 9479 | 720 | 245923.3 | 11.5844 | -296.8198 | 4.0045 | -3.9659 | 8.0498 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| AVAX:4h:range_breakout_long:1789804800 | range_breakout_long long | 1.7922 | 17241 | 720 | 458313.38 | 11.9494 | -725.3219 | 2.9448 | 2.3161 | -6.2183 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| DOGE:4h:range_breakout_long:1789819200 | range_breakout_long long | -1.046 | 20944 | 720 | -675553.75 | -8.081 | -64.0881 | -0.8414 | 8.777 | 3.9349 | weakDirectionalProgress, usableForExpansion |
| BNB:4h:trend_pullback_reclaim_long:1789891200 | trend_pullback_reclaim_long long | 1.7252 | 25136 | 720 | 868526.9 | 7.6864 | -40.3938 | 2.2894 | -3.8557 | 0.4318 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| AVAX:4h:range_breakout_long:1789905600 | range_breakout_long long | -1.0187 | 152533 | 720 | 1399740.79 | 4.4599 | -866.7835 | -1.3224 | -4.3355 | -41.822 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, liquidityThinningProxy, usableForExpansion |
| DOGE:4h:trend_pullback_reclaim_long:1789905600 | trend_pullback_reclaim_long long | 1.76 | 22630 | 720 | 855688.09 | 8.8853 | -71.079 | 3.8422 | -1.2289 | -3.5573 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ADA:4h:range_breakout_long:1789977600 | range_breakout_long long | 1.9736 | 16777 | 720 | 35337.13 | 1.137 | -308.3333 | 2.01 | -10.1761 | 5.296 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| DOGE:4h:range_breakout_long:1789977600 | range_breakout_long long | 1.7612 | 63899 | 720 | 2953621.83 | 10.4694 | -305.2699 | 1.4017 | 12.5408 | 18.6188 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ETH:4h:range_breakout_long:1789977600 | range_breakout_long long | -0.0086 | 138474 | 720 | 17136349.67 | 7.8034 | -216.4836 | 0.3501 | 4.9714 | 8.9095 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| DOGE:4h:range_breakout_long:1789992000 | range_breakout_long long | 1.7642 | 55797 | 720 | -1368457.73 | -6.1831 | -385.2872 | 2.8615 | -7.7159 | 4.8645 | weakDirectionalProgress, usableForExpansion |
| DOGE:1h:range_breakout_long:1790020800 | range_breakout_long long | 1.7605 | 78254 | 720 | 262519.55 | 1.1713 | -92.8329 | 1.8266 | 0.5939 | -14.9908 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, liquidityThinningProxy, usableForExpansion |
| ETH:1h:range_breakout_long:1790020800 | range_breakout_long long | -1.0828 | 131518 | 720 | -3085971.37 | -1.5735 | -53.0805 | -1.2892 | -1.6231 | 12.2438 | weakDirectionalProgress, usableForExpansion |
| XRP:1h:range_breakout_long:1790020800 | range_breakout_long long | -1.0841 | 68338 | 720 | 3816349.09 | 12.1594 | -127.451 | -1.325 | -1.9793 | -4.0094 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| SOL:4h:trend_pullback_reclaim_long:1790265600 | trend_pullback_reclaim_long long | 1.7525 | 60285 | 720 | -3114913.76 | -5.3354 | -83.5465 | 1.497 | -5.9709 | -4.3912 | weakDirectionalProgress, usableForExpansion |
| SOL:4h:trend_pullback_reclaim_long:1790323200 | trend_pullback_reclaim_long long | 0.9997 | 31702 | 720 | 68710.58 | 0.1859 | -355.0737 | 1.3822 | -14.086 | -4.302 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BNB:4h:trend_pullback_reclaim_long:1790366400 | trend_pullback_reclaim_long long | 0.076 | 11479 | 720 | -321976.84 | -15.1806 | -26.3791 | 0.0008 | 3.8216 | -2.2577 | weakDirectionalProgress, usableForExpansion |
| BNB:4h:trend_pullback_reclaim_long:1790409600 | trend_pullback_reclaim_long long | -1.0797 | 8830 | 720 | 317545.09 | 14.6357 | -23.0852 | -1.5006 | 2.1168 | -4.418 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ETH:4h:trend_pullback_reclaim_long:1790452800 | trend_pullback_reclaim_long long | -1.0911 | 20667 | 720 | -3907639.44 | -11.1178 | -58.8949 | -1.4486 | -1.1328 | -2.6999 | weakDirectionalProgress, usableForExpansion |
| XRP:4h:trend_pullback_reclaim_long:1790481600 | trend_pullback_reclaim_long long | -1.0425 | 22700 | 720 | 416143.56 | 4.0631 | -143.6091 | -1.3953 | -6.1866 | -2.4065 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |

## Interpretation

- `absorptionProxy` means aggressive flow aligned with the demo-sim direction, but price progress from entry stayed weak inside the sampled window.
- `liquidityThinningProxy` means the relevant near-side percentage-band bookDepth notional fell by more than 10% from pre-entry to post-entry.
- `alignedCvd` means signed taker delta agrees with the DEMO-SIM trade direction.
- Entry-candle net opportunity R is a candle-only proxy from the entry candle range. It is not a full-path MFE/MAE replacement.
- Feature/outcome comparisons are descriptive only and comparable-bucket comparisons are deliberately bucketed by setup/regime context. They reuse the existing DEMO-SIM replay outcome labels and do not introduce MFE/MAE, fill modeling, new thresholds, or signal gating.
- Binance `bookDepth` is percentage-band aggregate depth, not true L2 replay. It is useful as a liquidity-surface proxy beside tape, not as a replacement for Tardis/OKX true depth samples.
- The kill condition is explicit: if absorption lift disappears outside the original clustered sample, absorption is context-only rather than a candidate.

## Boundary

No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed.
