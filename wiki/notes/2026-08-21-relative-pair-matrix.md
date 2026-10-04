---
type: research-note
date: 2026-08-21
tags:
  - ralph
  - relative-strength
  - pair-matrix
  - data-analysis
  - ta
related:
  - 2026-08-21-alert-feedback-data-analysis.md
  - 2026-08-20-book-freshness-repair.md
sources:
  - ../../experiments/btc-eth-alert-edge/data/candles/
  - ../../experiments/btc-eth-alert-edge/results/edge-summary.md
  - ../../experiments/btc-eth-alert-edge/results/paper-dashboard.md
  - ../../../crypto-updates/runtime/alert-feedback.jsonl
---

# Relative Pair Matrix

Status: research-only pass over local candle and feedback files through `2026-08-21T13:40Z`. This made no live alert wording, threshold, risk, sizing, execution, key, account, wallet, broker, exchange, or paid-API change.

## Verdict

Tomas is right: USDT pairs are necessary for execution-like alerting and PnL accounting, but the TA/data-science layer should also compare the whole relative matrix. Synthetic pairs such as `SOL/BTC = SOLUSDT / BTCUSDT` answer a different question than `SOLUSDT`: whether SOL is moving on its own or merely riding market beta.

The useful design is a context layer, not a replacement for USDT alert prices:

- keep `BTCUSDT`, `ETHUSDT`, `SOLUSDT`, and liquid-alt USDT candles as the executable/alert surface;
- compute relative rank and ratio trends across the available universe;
- attach relative confirmation/contradiction to setup interpretation before any future follow/fade promotion;
- do not promote a gate yet because the recent alert join is mixed and sample quality is still limited.

## Data Used

Local candles under `experiments/btc-eth-alert-edge/data/candles/` cover nine Binance spot symbols: `BTC`, `ETH`, `SOL`, `XRP`, `ADA`, `BNB`, `DOGE`, `AVAX`, and `LINK`.

Freshness differs by timeframe:

| Timeframe | Shared rows | Shared range |
| --- | ---: | --- |
| `1h` | 4,307 | `2026-02-22T13:00Z` to `2026-08-20T23:00Z` |
| `4h` | 2,160 | `2025-08-26T16:00Z` to `2026-08-21T12:00Z` |

Because the latest local `1h` candles stop at `2026-08-20T23:00Z`, the freshest relative read for the current paper candidates should use the `4h` set. New BTC/ETH/SOL alerts around `2026-08-21T13:39Z` are not yet fully judgeable from local candle context.

## Latest 4h Relative Matrix

Latest shared 4h close: `2026-08-21T12:00Z`.

### 1-Bar Relative Move

Over `2026-08-21T08:00Z` to `2026-08-21T12:00Z`, the matrix was flat. `ADA` was the strongest relative asset, while `AVAX` was weakest.

| Rank | Asset | Avg relative move vs rest | USDT move |
| ---: | --- | ---: | ---: |
| 1 | ADA | +0.34% | +0.33% |
| 2 | ETH | +0.16% | +0.17% |
| 3 | BNB | +0.05% | +0.07% |
| 4 | SOL | +0.01% | +0.03% |
| 5 | BTC | +0.01% | +0.03% |
| 6 | LINK | -0.07% | -0.04% |
| 7 | DOGE | -0.07% | -0.04% |
| 8 | XRP | -0.14% | -0.10% |
| 9 | AVAX | -0.28% | -0.23% |

Strongest pairs: `ADA/AVAX +0.56%`, `ADA/XRP +0.43%`, `ETH/AVAX +0.39%`.

### 4-Bar Relative Move

Over `2026-08-20T20:00Z` to `2026-08-21T12:00Z`, `XRP` and `ADA` led; `ETH`, `AVAX`, and `SOL` lagged despite positive USDT returns.

| Rank | Asset | Avg relative move vs rest | USDT move |
| ---: | --- | ---: | ---: |
| 1 | XRP | +2.97% | +6.92% |
| 2 | ADA | +2.65% | +6.63% |
| 3 | LINK | +1.29% | +5.37% |
| 4 | BTC | +0.99% | +5.10% |
| 5 | DOGE | -1.13% | +3.13% |
| 6 | BNB | -1.20% | +3.07% |
| 7 | SOL | -1.23% | +3.03% |
| 8 | AVAX | -1.77% | +2.54% |
| 9 | ETH | -2.30% | +2.04% |

Strongest pairs: `XRP/ETH +4.78%`, `ADA/ETH +4.50%`, `XRP/AVAX +4.28%`.

### 12-Bar Relative Move

Over `2026-08-19T12:00Z` to `2026-08-21T12:00Z`, `XRP` dominated and SOL lagged BTC/ETH.

| Rank | Asset | Avg relative move vs rest | USDT move |
| ---: | --- | ---: | ---: |
| 1 | XRP | +12.21% | +26.98% |
| 2 | ADA | +3.60% | +18.22% |
| 3 | DOGE | -0.08% | +14.47% |
| 4 | AVAX | -0.58% | +13.96% |
| 5 | ETH | -0.71% | +13.83% |
| 6 | LINK | -0.99% | +13.55% |
| 7 | BTC | -2.56% | +11.95% |
| 8 | SOL | -4.10% | +10.38% |
| 9 | BNB | -5.02% | +9.44% |

Key BTC/ETH/SOL ratios over the same window:

| Pair | 12-bar relative move |
| --- | ---: |
| `BTC/ETH` | -1.66% |
| `ETH/BTC` | +1.68% |
| `SOL/BTC` | -1.41% |
| `SOL/ETH` | -3.04% |
| `BTC/SOL` | +1.43% |
| `ETH/SOL` | +3.13% |

## Latest 1h Relative Matrix

Latest shared 1h close: `2026-08-20T23:00Z`, so this is less fresh than the 4h analysis.

Over the latest 24 `1h` bars, `XRP` was the clear relative leader and `LINK`, `SOL`, and `ETH` lagged:

| Rank | Asset | Avg relative move vs rest | USDT move |
| ---: | --- | ---: | ---: |
| 1 | XRP | +9.49% | +14.66% |
| 2 | AVAX | +1.95% | +7.57% |
| 3 | DOGE | +1.60% | +7.24% |
| 4 | ADA | +0.67% | +6.36% |
| 5 | BTC | -0.44% | +5.32% |
| 6 | BNB | -1.47% | +4.35% |
| 7 | ETH | -2.61% | +3.29% |
| 8 | SOL | -3.26% | +2.67% |
| 9 | LINK | -4.74% | +1.28% |

Key BTC/ETH/SOL ratios over the latest 24 `1h` bars:

| Pair | 24-bar relative move |
| --- | ---: |
| `BTC/ETH` | +1.97% |
| `ETH/BTC` | -1.93% |
| `SOL/BTC` | -2.52% |
| `SOL/ETH` | -0.60% |
| `BTC/SOL` | +2.58% |
| `ETH/SOL` | +0.60% |

## SOL 4h Paper Candidate Read

The current paper dashboard listed `SOL 4h range_breakout_long` as a B-tier open candidate at `2026-08-21T04:00Z`, with related SOL 4h breakout rows around `00:00Z` and `08:00Z`.

Relative context:

| Time | SOLUSDT pre-1 bar | `SOL/BTC` pre-1 | `SOL/BTC` pre-4 | `SOL/ETH` pre-1 | `SOL/ETH` pre-4 | Read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `2026-08-21T00:00Z` | +1.64% | -0.38% | -1.38% | +1.03% | +0.23% | mixed: SOL beat ETH, lagged BTC |
| `2026-08-21T04:00Z` | +1.47% | -0.92% | -1.72% | +0.16% | +1.51% | mixed: USDT breakout was real, but BTC-relative lag warned against calling it broad strength |
| `2026-08-21T08:00Z` | -0.13% | -0.67% | -2.02% | -0.08% | +1.38% | weakening: SOL lagged BTC and near-term ETH |

Interpretation: SOL’s USDT breakout signal was not “fake,” but it was not clean relative leadership either. A future setup router should mark this as `market-beta / mixed-relative-confirmation`, not a pure SOL-strength breakout.

## Recent Alert Join

A bounded join over `crypto-updates/runtime/alert-feedback.jsonl` found 57 finalized BTC/ETH/SOL reviews with available 4h relative context. Using the existing checkpoint directional move as a rough follow/fade label:

| Bucket | Count |
| --- | ---: |
| follow | 25 |
| fade | 22 |
| noisy | 10 |

Relative context versus alert direction was also mixed:

| Relative context vs alert direction | Count |
| --- | ---: |
| confirmed | 18 |
| contradicted | 17 |
| mixed | 22 |

Recent examples:

- `2026-08-21T07:15Z` BTC UP wick: `BTC/ETH` was positive over pre-1 and pre-4 bars, and the 1h outcome followed.
- `2026-08-21T08:40Z` ETH UP wick: `ETH/BTC` was negative over pre-1 and pre-4 bars, and the 1h outcome faded.
- `2026-08-21T09:11Z` SOL UP wick: `SOL/BTC` and near-term `SOL/ETH` were negative, and the 1h outcome faded.
- `2026-08-21T11:12Z` SOL DOWN velocity: SOL was weak vs BTC and mixed vs ETH before the alert, but the 1h outcome followed upward, so relative context alone was not enough.

This is enough to justify adding relative features to the research dataset, not enough to call a high-probability rule.

## Proposed Research Features

For each alert/setup row, attach:

- `relative_rank_1b`, `relative_rank_4b`, `relative_rank_12b`, `relative_rank_24b` within the current liquid universe;
- `vs_btc_return_1b/4b/12b/24b` and `vs_eth_return_1b/4b/12b/24b` for non-BTC/ETH assets;
- `btc_eth_ratio_return_1b/4b/12b/24b` for BTC and ETH alerts;
- `relative_alignment`: confirmed, contradicted, mixed, or unavailable relative to alert/setup direction;
- `beta_bucket`: market-beta, idiosyncratic-strength, idiosyncratic-weakness, or cross-pair-divergence;
- `freshness_flags` so stale 1h candles cannot be mixed into fresh 4h interpretations.

## Next Action

Add a research-only feature-label table pass before ML or gate promotion. The next pass should join alert/setup rows to point-in-time USDT candles and synthetic ratios, then test whether relative alignment improves follow/fade classification beyond price-only and orderflow-only features by asset, trigger family, timeframe, and regime.

Keep C-036 and U-038 open. Relative-pair analysis belongs in the pre-ML/context layer; it should not change live alerts or risk controls until it proves incremental value on clean forward samples.

