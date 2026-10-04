---
type: research-note
created: 2026-10-03T16:25:00Z
topic: usdm-orderflow-absorption
status: research-feature-watch-only
work_item: validation.usdm-absorption-full-path-mfe-mae-rescore
tags:
  - ralph
  - research-only
  - orderflow
  - demo-sim
  - mfe-mae
  - baseline-comparison
  - no-live-trading
  - no-execution
related:
  - 2026-09-29-targeted-usdm-absorption-falsification.md
  - 2026-09-29-balanced-usdm-absorption-validation.md
  - ../../experiments/strategy-destruction-filter/results/usdm-orderflow-targeted-full-path-mfe-mae-rescore.md
  - ../../research-lanes/orderflow/README.md
---
# Full-Path MFE/MAE USD-M Absorption Rescore

Built the full-path candle-series MFE/MAE layer for the existing targeted USD-M absorption sample.

## Scope

- Research-only.
- Frozen existing DEMO-SIM closed rows.
- Same canonical candle-source resolution as `historical-demo-sim-replay.mjs`: Binance spot candles first, then Coinbase-style fallbacks.
- Re-scored the existing targeted USD-M sample; did not rerun or change USD-M trade/bookDepth joins.
- No live alerts, paper/demo alert logic, scheduler, thresholds, sizing, TP/SL, execution, accounts, keys, paid services, public posting, or strategy promotion changed.

## Implementation

Added:

- `experiments/strategy-destruction-filter/src/run-usdm-full-path-mfe-mae-rescore.mjs`
- npm script `study:usdm-full-path-mfe-mae`

Updated:

- `experiments/strategy-destruction-filter/src/verify-filter.mjs`

Outputs:

- `experiments/strategy-destruction-filter/results/usdm-orderflow-targeted-full-path-mfe-mae-rescore.json`
- `experiments/strategy-destruction-filter/results/usdm-orderflow-targeted-full-path-mfe-mae-rescore.md`

Measurement contract:

- Path starts at the first candle after the DEMO-SIM entry candle.
- Path ends at the DEMO-SIM exit candle, inclusive.
- Risk R is `abs(entryPrice - stopLossPrice) / entryPrice`.
- MFE/MAE R is gross candle excursion relative to entry-stop risk.
- Final R remains the existing DEMO-SIM net R after fees.

## Data Note

The previous USD-M batch called its single-candle baseline `entry-candle-only`, but the current replay writer stores `candleRange` from the exit candle. Treat that older field as a single-candle proxy only, not a reliable entry-candle or full-path MFE/MAE baseline.

The targeted USD-M sample has 80 rows. Full-path replay records were available for 76/80 rows. The 4 missing rows are old original-cluster rows not present in the current regenerated replay; the comparable outside-cluster rescore still has 76 rows.

## Result

Verdict: `full_path_absorption_research_feature_watch_only_no_promotion`.

Headline full-path slices:

| Slice | Rows | Full path | Win rate | Mean final R | Mean MFE R | Mean MAE R | Mean net path opp R |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| all | 80 | 76 | 43.42% | 0.1054 | 1.3947 | 0.9976 | 0.3971 |
| absorptionProxy=true | 41 | 37 | 56.76% | 0.4963 | 1.5574 | 0.8427 | 0.7147 |
| absorptionProxy=false | 39 | 39 | 30.77% | -0.2654 | 1.2404 | 1.1446 | 0.0958 |
| alignedCvd=true | 43 | 39 | 56.41% | 0.4879 | 1.5531 | 0.8606 | 0.6924 |
| alignedCvd=false | 37 | 37 | 29.73% | -0.2977 | 1.2278 | 1.1420 | 0.0858 |
| liquidityThinningProxy=true | 9 | 8 | 50.00% | 0.2113 | 1.4787 | 0.7438 | 0.7349 |
| liquidityThinningProxy=false | 71 | 68 | 42.65% | 0.0930 | 1.3848 | 1.0275 | 0.3574 |

Comparable outside-original-cluster buckets:

| Feature | Buckets | Rows | Flagged rows | Final R lift | MFE R lift | MAE R lift | Net path opp lift R |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| absorptionProxy | 8 | 76 | 37 | 0.8651 | 0.3469 | -0.3164 | 0.6633 |
| alignedCvd | 8 | 76 | 39 | 0.8817 | 0.3743 | -0.3044 | 0.6787 |
| liquidityThinningProxy | 5 | 46 | 8 | -0.2013 | -0.3428 | -0.2062 | -0.1367 |

Interpretation:

- Absorption still survives as a research feature under full-path trade quality.
- Aligned CVD remains very similar, confirming the overlap caveat from the targeted falsification note.
- Liquidity-thinning remains weak/mixed and should not be used as positive support.
- The sample still reuses frozen DEMO-SIM outcomes and was selected for comparable buckets, so this is not a neutral population estimate and not a promotion.

## Decision

Absorption remains `research-feature-watch-only`.

Do not:

- turn absorption into a watcher gate
- turn absorption into paper/demo/live alert logic
- tune thresholds from this sample
- promote a strategy from this rescore

Next valid absorption work requires either fresh forward rows or a broader pre-registered sample that is not selected after seeing the existing DEMO-SIM outcomes.

## Boundary

No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed.
