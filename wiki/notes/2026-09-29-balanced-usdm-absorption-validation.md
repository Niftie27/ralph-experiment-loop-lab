---
type: research-note
created: 2026-09-29T16:45:00Z
topic: usdm-orderflow-absorption
status: watch-only-no-promotion
work_item: validation.usdm-absorption-balanced-manifest-validation
tags:
  - ralph
  - research-only
  - orderflow
  - demo-sim
  - baseline-comparison
  - no-live-trading
  - no-execution
related:
  - ../../research-lanes/orderflow/README.md
  - ../../experiments/strategy-destruction-filter/results/usdm-orderflow-balanced-manifest.md
  - ../../experiments/strategy-destruction-filter/results/usdm-orderflow-demo-sim-batch.md
  - 2026-09-28-historical-orderflow-data-rails.md
---
# Balanced USD-M Absorption Validation

Built and ran a balanced frozen DEMO-SIM manifest for the USD-M absorption branch.

## Scope

- Research-only.
- Public/no-key Binance USD-M futures archives only.
- Archive inputs: daily `trades` plus coarse percentage-band `bookDepth`.
- No live alerts, watcher behavior, paper/demo alert logic, schedulers, thresholds, sizing, TP/SL, execution, accounts, keys, paid services, public posting, or strategy promotion changed.

## Implementation

Updated:

- `experiments/strategy-destruction-filter/src/run-usdm-orderflow-demo-sim-batch.mjs`
- `experiments/btc-eth-alert-edge/src/binance-usdm-archive.mjs`
- `experiments/strategy-destruction-filter/src/verify-filter.mjs`

Outputs:

- `experiments/strategy-destruction-filter/results/usdm-orderflow-balanced-manifest.json`
- `experiments/strategy-destruction-filter/results/usdm-orderflow-balanced-manifest.md`
- `experiments/strategy-destruction-filter/results/usdm-orderflow-demo-sim-batch.json`
- `experiments/strategy-destruction-filter/results/usdm-orderflow-demo-sim-batch.md`

The adapter now parses large decompressed Binance CSV files in chunks instead of converting an entire daily archive into one Node string. This was needed because at least one high-volume USD-M daily `trades` file exceeded Node's maximum string size.

The runner now emits row-level progress and uses soft caps for rows per symbol/date so the balanced manifest is not just another early-date cluster.

## Manifest

Selected `60/486` eligible closed DEMO-SIM rows.

Distribution:

- Dates: `2026-08-18` to `2026-09-08`
- Weeks: W34 `17`, W35 `20`, W36 `18`, W37 `5`
- Symbols: ADA `8`, AVAX `8`, BNB `8`, XRP `8`, BTC `7`, ETH `7`, LINK `5`, SOL `5`, DOGE `4`
- Setups: trend-pullback-reject short `16`, momentum-reversal long `12`, range-breakout long `11`, trend-pullback-reclaim long `11`, momentum-reversal short `6`, range-breakdown short `4`
- Directions: long `34`, short `26`
- Timeframes: 4h `51`, 1h `9`
- BTC gates: `BTC_RISK_ON` `32`, `BTC_TRANSITION` `15`, `BTC_SELF` `7`, `BTC_RISK_OFF` `6`
- Outcomes: positive `18`, negative `42`
- Original/outside-cluster rows: `9/51`

## Result

All `60/60` rows joined to both USD-M futures `trades` and `bookDepth`.

Headline descriptive slices:

| Slice | Rows | Win rate | Mean R | Median R | Net PnL USD |
| --- | ---: | ---: | ---: | ---: | ---: |
| all | 60 | 30.00% | -0.3328 | -1.0393 | -3849.01 |
| absorptionProxy=true | 25 | 44.00% | 0.0044 | -0.4948 | 298.73 |
| absorptionProxy=false | 35 | 20.00% | -0.5736 | -1.0424 | -4147.74 |
| liquidityThinningProxy=true | 3 | 33.33% | -0.1006 | -1.0242 | -249.64 |
| liquidityThinningProxy=false | 57 | 29.82% | -0.3450 | -1.0415 | -3599.38 |
| alignedCvd=true | 28 | 42.86% | -0.0186 | -0.5349 | 586.86 |
| alignedCvd=false | 32 | 18.75% | -0.6077 | -1.0419 | -4435.87 |

Comparable setup/regime bucket comparisons are intentionally stricter: same setup, direction, timeframe, market regime, and BTC gate, with both flagged and unflagged rows present.

Comparable summary:

| Feature | Scope | Buckets | Rows | Flagged rows | Flagged mean R | Unflagged mean R | Mean lift R |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| absorptionProxy | all | 2 | 9 | 5 | -0.2749 | -1.0460 | 0.5307 |
| liquidityThinningProxy | all | 0 | 0 | 0 | n/a | n/a | n/a |
| alignedCvd | all | 2 | 9 | 6 | -0.4106 | -1.0315 | 0.5124 |
| absorptionProxy | outside original cluster | 1 | 5 | 4 | -0.0820 | -1.0346 | 0.9526 |
| liquidityThinningProxy | outside original cluster | 0 | 0 | 0 | n/a | n/a | n/a |
| alignedCvd | outside original cluster | 1 | 5 | 4 | -0.0820 | -1.0346 | 0.9526 |

## Decision

Verdict: `balanced_usdm_archive_absorption_watch_only_no_promotion`.

Absorption did **not** trigger the explicit kill condition, because the only qualifying outside-cluster comparable bucket still showed positive lift. But the surviving comparable evidence is tiny: one outside-cluster bucket with only five rows.

Therefore:

- absorption is not killed to context-only from this run
- absorption is not a candidate
- aligned CVD looks similar because it overlaps heavily with the absorption definition here
- liquidity-thinning has too few comparable flagged rows to interpret
- no strategy or alert/paper/demo gate should change

Next useful step, only if continuing this branch, is to build either a larger balanced manifest or a deliberately bucket-targeted manifest that creates more flagged/unflagged pairs inside the same setup/regime buckets. Do not tune thresholds from the current table.
