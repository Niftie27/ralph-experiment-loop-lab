# USD-M Orderflow DEMO-SIM Batch

Generated: 2026-09-29T16:35:43.413Z

Research-only Binance USD-M archive batch joining futures trades and coarse bookDepth rows to frozen DEMO-SIM events. It does not change live alerts, watcher gates, paper/demo logic, schedulers, thresholds, sizing, TP/SL, execution, accounts, keys, paid services, public posting, or strategy status.

## Decision

- Verdict: balanced_usdm_archive_absorption_watch_only_no_promotion
- Reason: USD-M public archives joined to 60/60 balanced frozen DEMO-SIM rows with both futures trades and coarse bookDepth. Absorption proxy mean R=0.0044 vs unflagged mean R=-0.5736; outside the original cluster, comparable-bucket absorption lift is 0.9526 R across 5 rows. Absorption is watch-only and not promoted.
- Manifest: results/usdm-orderflow-balanced-manifest.json
- Analyzed windows: 60/60
- Rows with trades/bookDepth: 60/60
- Positive/negative outcome rows: 18/42
- Absorption proxy rows: 25
- Liquidity-thinning proxy rows: 3
- Aligned CVD rows: 28
- Original/outside-cluster rows: 9/51
- Absorption kill condition: not triggered, still watch-only/no-promotion

## Feature Outcome Comparison

| Slice | Rows | Win rate | Mean R | Median R | Net PnL USD |
| --- | ---: | ---: | ---: | ---: | ---: |
| all | 60 | 30 | -0.3328 | -1.0393 | -3849.01 |
| absorptionProxy=true | 25 | 44 | 0.0044 | -0.4948 | 298.73 |
| absorptionProxy=false | 35 | 20 | -0.5736 | -1.0424 | -4147.74 |
| liquidityThinningProxy=true | 3 | 33.33 | -0.1006 | -1.0242 | -249.64 |
| liquidityThinningProxy=false | 57 | 29.82 | -0.345 | -1.0415 | -3599.38 |
| alignedCvd=true | 28 | 42.86 | -0.0186 | -0.5349 | 586.86 |
| alignedCvd=false | 32 | 18.75 | -0.6077 | -1.0419 | -4435.87 |

## Comparable Setup/Regime Buckets

Feature comparisons below are restricted to buckets with the same setup, direction, timeframe, market regime, and BTC gate, and only buckets that have both flagged and unflagged rows.

| Feature | Scope | Buckets | Rows | Flagged rows | Flagged mean R | Unflagged mean R | Mean lift R |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| absorptionProxy | all | 2 | 9 | 5 | -0.2749 | -1.046 | 0.5307 |
| liquidityThinningProxy | all | 0 | 0 | 0 | n/a | n/a | n/a |
| alignedCvd | all | 2 | 9 | 6 | -0.4106 | -1.0315 | 0.5124 |
| absorptionProxy | outsideOriginalCluster | 1 | 5 | 4 | -0.082 | -1.0346 | 0.9526 |
| liquidityThinningProxy | outsideOriginalCluster | 0 | 0 | 0 | n/a | n/a | n/a |
| alignedCvd | outsideOriginalCluster | 1 | 5 | 4 | -0.082 | -1.0346 | 0.9526 |

## Comparable Bucket Details

| Feature | Scope | Bucket | Rows | Flagged rows | Flagged mean R | Unflagged mean R | Lift R |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| absorptionProxy | all | trend_pullback_reclaim_long|long|4h|up/high-vol|BTC_RISK_ON | 5 | 4 | -0.082 | -1.0346 | 0.9526 |
| absorptionProxy | all | momentum_reversal_short|short|4h|range/mid-vol|BTC_RISK_ON | 4 | 1 | -1.0464 | -1.0498 | 0.0034 |
| alignedCvd | all | trend_pullback_reclaim_long|long|4h|up/high-vol|BTC_RISK_ON | 5 | 4 | -0.082 | -1.0346 | 0.9526 |
| alignedCvd | all | momentum_reversal_short|short|4h|range/mid-vol|BTC_RISK_ON | 4 | 2 | -1.0679 | -1.0299 | -0.0379 |
| absorptionProxy | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/high-vol|BTC_RISK_ON | 5 | 4 | -0.082 | -1.0346 | 0.9526 |
| alignedCvd | outsideOriginalCluster | trend_pullback_reclaim_long|long|4h|up/high-vol|BTC_RISK_ON | 5 | 4 | -0.082 | -1.0346 | 0.9526 |

## Rows

| Event | Setup | Outcome R | Trades | Book rows | Delta notional | CVD % | Entry progress bps | Bid depth chg % | Ask depth chg % | Flags |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| SOL:4h:momentum_reversal_short:1787068800 | momentum_reversal_short short | -1.0894 | 31956 | 720 | -3703229.9 | -10.3277 | 18.1394 | -0.6592 | 2.5681 | alignedAggressiveFlow, alignedCvd, usableForExpansion |
| AVAX:1h:trend_pullback_reject_short:1787083200 | trend_pullback_reject_short short | -1.1388 | 4002 | 720 | -200741.44 | -25.2348 | -64.9762 | -1.2572 | 3.7376 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BNB:1h:trend_pullback_reject_short:1787086800 | trend_pullback_reject_short short | -1.4091 | 5173 | 720 | 623133.7 | 47.4307 | -14.1072 | -0.036 | -1.4888 | weakDirectionalProgress, usableForExpansion |
| XRP:4h:trend_pullback_reject_short:1787097600 | trend_pullback_reject_short short | -1.11 | 13058 | 720 | -59575.81 | -0.9777 | 20 | 2.3239 | -5.2985 | alignedAggressiveFlow, alignedCvd, usableForExpansion |
| ADA:4h:trend_pullback_reject_short:1787126400 | trend_pullback_reject_short short | -1.0647 | 3668 | 720 | 177721.64 | 17.3979 | -5.7176 | 2.0367 | -1.1996 | weakDirectionalProgress, usableForExpansion |
| AVAX:4h:trend_pullback_reject_short:1787126400 | trend_pullback_reject_short short | -1.0771 | 5083 | 720 | -214781.13 | -16.6608 | -63.3914 | -6.2434 | 7.1689 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ADA:4h:momentum_reversal_short:1787184000 | momentum_reversal_short short | -1.0198 | 12058 | 720 | 676567.59 | 16.3561 | -444.4444 | -9.8834 | -12.0951 | weakDirectionalProgress, usableForExpansion |
| AVAX:4h:momentum_reversal_short:1787184000 | momentum_reversal_short short | -1.0464 | 13637 | 720 | -66860.56 | -2.7395 | -5.9259 | -5.1204 | -8.1612 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BNB:4h:momentum_reversal_short:1787184000 | momentum_reversal_short short | -1.1038 | 30182 | 720 | 2427536.77 | 21.8333 | -35.4423 | -7.2952 | 7.593 | weakDirectionalProgress, usableForExpansion |
| BTC:4h:range_breakout_long:1787284800 | range_breakout_long long | -0.2055 | 135893 | 720 | -19778351.81 | -5.4134 | -193.117 | 1.1972 | -1.1435 | weakDirectionalProgress, usableForExpansion |
| ADA:4h:range_breakout_long:1787342400 | range_breakout_long long | -1.0253 | 19144 | 720 | -219082.84 | -4.7131 | -465.2174 | -1.7923 | 0.9982 | weakDirectionalProgress, usableForExpansion |
| BNB:1h:trend_pullback_reclaim_long:1787342400 | trend_pullback_reclaim_long long | 1.7199 | 26950 | 720 | -510754.94 | -6.7806 | -43.1774 | -1.5919 | -4.7997 | weakDirectionalProgress, usableForExpansion |
| BNB:4h:range_breakout_long:1787356800 | range_breakout_long long | -1.0434 | 53107 | 720 | -159603.55 | -0.9252 | -459.5396 | -0.2562 | -2.4584 | weakDirectionalProgress, usableForExpansion |
| XRP:1h:momentum_reversal_long:1787436000 | momentum_reversal_long long | 1.5677 | 118921 | 720 | 3048919.15 | 6.6868 | 4.0816 | 4.4322 | 3.2128 | alignedAggressiveFlow, alignedCvd, usableForExpansion |
| AVAX:4h:trend_pullback_reclaim_long:1787472000 | trend_pullback_reclaim_long long | -0.0402 | 9082 | 720 | 297526.39 | 18.7815 | -177.9548 | -0.5883 | -2.9616 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ETH:4h:trend_pullback_reclaim_long:1787472000 | trend_pullback_reclaim_long long | 0.5635 | 150539 | 720 | 18065101.05 | 5.8056 | -111.354 | -10.1022 | -1.5475 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| LINK:4h:trend_pullback_reclaim_long:1787472000 | trend_pullback_reclaim_long long | 0.1771 | 16805 | 720 | 567230.66 | 17.0466 | -63.9229 | -9.7781 | 0.2329 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| LINK:4h:trend_pullback_reclaim_long:1787601600 | trend_pullback_reclaim_long long | -1.0346 | 11250 | 720 | -368537.45 | -21.567 | -83.405 | -4.5766 | -1.2229 | weakDirectionalProgress, usableForExpansion |
| ADA:1h:trend_pullback_reject_short:1787608800 | trend_pullback_reject_short short | -1.0487 | 6370 | 720 | -42456.77 | -4.3481 | -40.9091 | 3.9091 | 2.6677 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| AVAX:4h:trend_pullback_reclaim_long:1787616000 | trend_pullback_reclaim_long long | -1.0419 | 9191 | 720 | 179266.85 | 12.5137 | -94.4882 | 0.2893 | -1.9162 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BTC:4h:range_breakout_long:1787616000 | range_breakout_long long | -1.0617 | 62901 | 720 | 4928951.09 | 3.7232 | -194.5271 | -4.2073 | 0.9835 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| DOGE:4h:trend_pullback_reclaim_long:1787616000 | trend_pullback_reclaim_long long | -1.0284 | 37488 | 720 | 338220.89 | 2.6461 | -181.6402 | 21.6241 | 9.8371 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ADA:4h:momentum_reversal_long:1787702400 | momentum_reversal_long long | -0.0031 | 10570 | 720 | -378932.95 | -13.9291 | -104.7619 | -5.5627 | -2.6401 | weakDirectionalProgress, usableForExpansion |
| DOGE:4h:momentum_reversal_long:1787702400 | momentum_reversal_long long | 0.3173 | 35822 | 720 | -941800.35 | -8.0343 | -136.1643 | 3.3178 | 1.9989 | weakDirectionalProgress, usableForExpansion |
| ETH:4h:trend_pullback_reclaim_long:1787702400 | trend_pullback_reclaim_long long | 1.7511 | 120113 | 720 | -2848532.16 | -1.8112 | -119.0394 | 3.2235 | -0.5978 | weakDirectionalProgress, usableForExpansion |
| XRP:4h:momentum_reversal_long:1787803200 | momentum_reversal_long long | -0.575 | 24268 | 720 | 573029.31 | 8.1 | -24.1135 | 0.6829 | -0.0793 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| SOL:4h:range_breakout_long:1787817600 | range_breakout_long long | 1.7609 | 170560 | 720 | 9401974.32 | 4.4139 | -92.3521 | -15.1286 | -12.5603 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, liquidityThinningProxy, usableForExpansion |
| SOL:4h:range_breakout_long:1787832000 | range_breakout_long long | -1.0384 | 65794 | 720 | -3145484.42 | -6.4246 | -278.9179 | -5.8085 | -14.403 | weakDirectionalProgress, liquidityThinningProxy, usableForExpansion |
| ADA:4h:trend_pullback_reject_short:1787875200 | trend_pullback_reject_short short | 0.9769 | 6945 | 720 | -141693.65 | -7.6695 | -142.8571 | -6.5727 | -2.8693 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| AVAX:4h:trend_pullback_reject_short:1787889600 | trend_pullback_reject_short short | 0.3874 | 6868 | 720 | -185710.21 | -15.9524 | -62.1622 | 6.3881 | 0.1706 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| AVAX:4h:trend_pullback_reject_short:1787918400 | trend_pullback_reject_short short | -0.4948 | 5043 | 720 | -95927.39 | -14.6357 | -100.955 | -4.9219 | 2.2194 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BTC:4h:momentum_reversal_long:1787976000 | momentum_reversal_long long | 0.4207 | 27194 | 720 | -7436774.02 | -9.5708 | -8.3232 | -1.1551 | 1.8373 | weakDirectionalProgress, usableForExpansion |
| ETH:4h:momentum_reversal_long:1787976000 | momentum_reversal_long long | 1.7397 | 31289 | 720 | -12393323.67 | -23.329 | -2.1753 | -7.6343 | 2.2948 | weakDirectionalProgress, usableForExpansion |
| BNB:4h:momentum_reversal_long:1787990400 | momentum_reversal_long long | -1.0846 | 11595 | 720 | -962499.43 | -22.2394 | -19.1485 | -2.1996 | -1.4089 | weakDirectionalProgress, usableForExpansion |
| BTC:4h:momentum_reversal_long:1788076800 | momentum_reversal_long long | -1.1215 | 18551 | 720 | -2682132.19 | -4.8067 | -5.5907 | 1.3421 | 2.7336 | weakDirectionalProgress, usableForExpansion |
| SOL:4h:trend_pullback_reclaim_long:1788091200 | trend_pullback_reclaim_long long | -1.0573 | 41387 | 720 | 6487409.88 | 13.3906 | -55.5085 | -9.7958 | 10.8499 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| AVAX:4h:range_breakdown_short:1788120000 | range_breakdown_short short | -1.0602 | 4758 | 720 | 46733.02 | 5.8408 | -434.5992 | -1.6931 | 8.3141 | weakDirectionalProgress, usableForExpansion |
| LINK:4h:trend_pullback_reject_short:1788206400 | trend_pullback_reject_short short | 0.7252 | 9353 | 720 | -366151.19 | -17.199 | -77.7385 | -2.5657 | 3.7334 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| XRP:4h:trend_pullback_reject_short:1788206400 | trend_pullback_reject_short short | 1.6161 | 35837 | 720 | -658540.79 | -4.6831 | -59.4203 | -4.799 | -3.1774 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BNB:4h:trend_pullback_reject_short:1788235200 | trend_pullback_reject_short short | 1.7007 | 10249 | 720 | -468165.9 | -24.3517 | -43.159 | 2.2362 | -2.1432 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BTC:4h:trend_pullback_reject_short:1788249600 | trend_pullback_reject_short short | 1.7124 | 71829 | 720 | -17353019.72 | -5.7271 | -22.9491 | 9.5856 | -6.1363 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ETH:4h:trend_pullback_reject_short:1788264000 | trend_pullback_reject_short short | 1.7392 | 72508 | 720 | -17890168.65 | -14.5472 | -22.0909 | 6.496 | -3.634 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| SOL:4h:momentum_reversal_long:1788307200 | momentum_reversal_long long | -1.0424 | 26128 | 720 | -20922.01 | -0.1149 | -27.919 | -0.8062 | 6.1743 | weakDirectionalProgress, usableForExpansion |
| ETH:4h:range_breakdown_short:1788336000 | range_breakdown_short short | -1.0633 | 58786 | 720 | -17557920.9 | -19.3257 | -144.8436 | -4.6935 | -4.6967 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| XRP:4h:range_breakdown_short:1788336000 | range_breakdown_short short | -1.0488 | 25936 | 720 | 282645.34 | 2.3179 | -103.0075 | -0.4691 | 3.7535 | weakDirectionalProgress, usableForExpansion |
| BNB:4h:range_breakout_long:1788422400 | range_breakout_long long | 1.714 | 29646 | 720 | 2418370.99 | 21.0992 | -133.2527 | -0.6082 | 4.4502 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| ADA:4h:range_breakout_long:1788436800 | range_breakout_long long | -1.0242 | 10667 | 720 | -351093.77 | -11.0502 | -568.1818 | 20.8869 | -16.039 | weakDirectionalProgress, liquidityThinningProxy, usableForExpansion |
| BNB:4h:range_breakout_long:1788436800 | range_breakout_long long | -1.0773 | 60696 | 720 | -3357819.09 | -11.8274 | -224.7237 | -7.3821 | 24.7116 | weakDirectionalProgress, usableForExpansion |
| LINK:4h:range_breakout_long:1788508800 | range_breakout_long long | -1.0456 | 12463 | 720 | -20362.8 | -0.7341 | -89.7756 | -2.1282 | 0 | weakDirectionalProgress, usableForExpansion |
| LINK:4h:momentum_reversal_short:1788523200 | momentum_reversal_short short | -1.0401 | 15653 | 720 | 220413.46 | 7.446 | -332.7616 | 0.4974 | 0 | weakDirectionalProgress, usableForExpansion |
| XRP:1h:momentum_reversal_long:1788552000 | momentum_reversal_long long | 0.663 | 40682 | 720 | -4872289.55 | -15.9456 | -27.1429 | -2.0559 | -7.5173 | weakDirectionalProgress, usableForExpansion |
| DOGE:4h:range_breakout_long:1788624000 | range_breakout_long long | -1.0347 | 20194 | 720 | -1179795.34 | -14.9404 | -375.592 | -4.3112 | 0 | weakDirectionalProgress, usableForExpansion |
| BTC:4h:momentum_reversal_long:1788638400 | momentum_reversal_long long | -1.0999 | 32261 | 720 | -31427222.42 | -28.5333 | -15.7644 | 0.1307 | 0 | weakDirectionalProgress, usableForExpansion |
| ADA:1h:momentum_reversal_short:1788645600 | momentum_reversal_short short | -1.0861 | 8663 | 720 | 319083.17 | 13.6828 | -36.4465 | 3.2333 | 0 | weakDirectionalProgress, usableForExpansion |
| XRP:4h:momentum_reversal_long:1788652800 | momentum_reversal_long long | -1.0781 | 24845 | 720 | -790513.77 | -4.7354 | -59.8592 | -1.0397 | 0 | weakDirectionalProgress, usableForExpansion |
| XRP:1h:trend_pullback_reject_short:1788811200 | trend_pullback_reject_short short | -1.154 | 26519 | 720 | 635592.83 | 4.5726 | 27.8571 | -6.4087 | -4.9241 | usableForExpansion |
| ETH:1h:trend_pullback_reject_short:1788814800 | trend_pullback_reject_short short | -1.1769 | 41000 | 720 | -9823714.44 | -12.8724 | -16.4988 | -1.1425 | 0 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| BTC:4h:range_breakdown_short:1788840000 | range_breakdown_short short | -1.1129 | 39452 | 720 | -27734923.86 | -22.9789 | -39.1937 | -2.376 | 8.6182 | alignedAggressiveFlow, alignedCvd, weakDirectionalProgress, absorptionProxy, usableForExpansion |
| DOGE:4h:trend_pullback_reclaim_long:1788868800 | trend_pullback_reclaim_long long | -1.0415 | 48257 | 720 | -8696386.15 | -30.4349 | -216.2162 | -0.9727 | 0 | weakDirectionalProgress, usableForExpansion |
| ETH:4h:trend_pullback_reclaim_long:1788868800 | trend_pullback_reclaim_long long | -1.071 | 73326 | 720 | -24175872.29 | -17.0537 | -122.3475 | 2.1098 | 0 | weakDirectionalProgress, usableForExpansion |

## Interpretation

- `absorptionProxy` means aggressive flow aligned with the demo-sim direction, but price progress from entry stayed weak inside the sampled window.
- `liquidityThinningProxy` means the relevant near-side percentage-band bookDepth notional fell by more than 10% from pre-entry to post-entry.
- `alignedCvd` means signed taker delta agrees with the DEMO-SIM trade direction.
- Feature/outcome comparisons are descriptive only and comparable-bucket comparisons are deliberately bucketed by setup/regime context. They reuse the existing DEMO-SIM replay outcome labels and do not introduce MFE/MAE, fill modeling, new thresholds, or signal gating.
- Binance `bookDepth` is percentage-band aggregate depth, not true L2 replay. It is useful as a liquidity-surface proxy beside tape, not as a replacement for Tardis/OKX true depth samples.
- The kill condition is explicit: if absorption lift disappears outside the original clustered sample, absorption is context-only rather than a candidate.

## Boundary

No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed.
