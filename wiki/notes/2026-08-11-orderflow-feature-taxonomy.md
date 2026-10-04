---
type: research-note
date: 2026-08-11
tags:
  - ralph
  - orderflow
  - feature-taxonomy
  - active-public-proxy
related:
  - 2026-08-10-public-orderflow-data-rail.md
  - 2026-08-11-trader-tool-access-audit.md
  - ../../decisions/unknowns.md
sources:
  - https://developers.binance.com/en/docs/catalog/core-trading-spot-trading/api/ws-streams/~
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions.md
---

# Orderflow Feature Taxonomy

Status: active-public-proxy taxonomy for U-038. This is research support only, not a trading signal.

## Existing Feature Layer

Source run: `crypto-updates/runtime/orderflow-spikes/2026-08-11T11-43-28-031Z/features.sqlite`.

Current extracted 1-second rows:

- signed taker quantity and buy/sell taker split
- total quantity and notional
- VWAP, first/last price, and bucket price-change bps
- book update count
- average spread bps
- average L1 imbalance

Coverage check:

| Source | Symbol | Rows | Trade seconds | Book seconds | Avg spread bps | Avg L1 imbalance | Max abs price-change bps |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Binance | BTCUSDT | 600 | 472 | 599 | 0.0037 | -0.2657 | 3.8643 |
| Binance | ETHUSDT | 600 | 342 | 598 | 0.0538 | 0.1267 | 2.8530 |
| Binance | SOLUSDT | 583 | 286 | 580 | 1.3138 | 0.0591 | 3.9401 |
| Hyperliquid | BTC | 620 | 406 | 600 | 0.1566 | 0.2217 | 1.0883 |
| Hyperliquid | ETH | 619 | 278 | 600 | 0.5326 | 0.3677 | 2.6431 |
| Hyperliquid | SOL | 625 | 161 | 600 | 0.1405 | 0.2117 | 3.0210 |

Interpretation: book-derived features are dense enough for public-proxy gating; trade-derived features are usable but sparser on Hyperliquid/SOL in this 10-minute sample. Binance and Hyperliquid spread/imbalance magnitudes are not directly comparable without source normalization.

## Feature Families

Use these as the first reusable buckets for alert alignment:

| Family | Proxy features | Test against alert outcome | Current status |
| --- | --- | --- | --- |
| Directional pressure | signed quantity, CVD slope, buy/sell split | follow-through after directional alert | implemented at 1s; needs 5s/60s rollups |
| Liquidity pressure | average L1 imbalance, book update count | continuation when book leans with move | implemented at 1s; normalize per source |
| Friction/shock | spread bps, depth/update burst proxy | fade risk after unstable move | implemented partially; depth-within-bps missing |
| Sweep/exhaustion | large one-second price change plus trade burst plus quick reversal | fade-useful vs noisy classification | rule not implemented |
| Absorption | aggressive signed flow without price progress or with opposing book pressure | failed breakout or fade candidate | rule not implemented |
| Cross-venue confirmation | Binance vs Hyperliquid feature agreement and lead/lag | higher confidence only when venues confirm | not implemented |

## Minimal Rollup Spec

Before any strategy promotion, derive read-only feature windows around each alert:

- `pre_60s`: CVD change, trade notional z-score, average spread, mean imbalance.
- `trigger_5s`: signed quantity, price-change bps, max spread, trade burst count.
- `post_60s`: continuation bps, CVD follow-through, imbalance persistence.
- `post_30m` and `post_1h`: join to existing review fields for fade/follow-through labels.

Baseline comparison:

- price-only alert features from the existing monitor
- price plus orderflow families above
- sample counts by asset/source so HYPE/SOL event-only data is not mixed with BTC/ETH setup claims

## Rollup Proxy Check

Micro-run: `2026-08-11T22:53:49Z`.

Work item: `discovery.public-orderflow-data-rail-spike`, narrowed to whether existing 1-second feature rows can support the required 5-second and 60-second public-proxy windows without collecting new data.

Method: read `crypto-updates/runtime/orderflow-spikes/2026-08-11T11-43-28-031Z/features.sqlite` with local Node `node:sqlite` and aggregate existing rows by source/symbol/window. No web checks, credentials, exchange accounts, live trading, or new alert thresholds were used.

5-second rollup coverage:

| Source | Symbol | Windows | Complete | Trade-window % | Book-window % | Trades | Notional | Max abs 1s price-change bps |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Binance | BTCUSDT | 121 | 118 | 98.3 | 100.0 | 7,144 | 11,500,286 | 3.8643 |
| Binance | ETHUSDT | 121 | 118 | 96.7 | 100.0 | 6,203 | 1,668,954 | 2.8530 |
| Binance | SOLUSDT | 120 | 105 | 95.8 | 100.0 | 2,884 | 858,286 | 3.9401 |
| Hyperliquid | BTC | 127 | 121 | 100.0 | 95.3 | 898 | 2,070,836 | 1.0883 |
| Hyperliquid | ETH | 131 | 120 | 92.4 | 92.4 | 598 | 1,757,869 | 2.6431 |
| Hyperliquid | SOL | 139 | 119 | 78.4 | 87.1 | 248 | 89,528 | 3.0210 |

60-second rollup coverage:

| Source | Symbol | Windows | Complete | Trade-window % | Book-window % | Trades | Notional | Max abs 1s price-change bps |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Binance | BTCUSDT | 11 | 8 | 100.0 | 100.0 | 7,144 | 11,500,286 | 3.8643 |
| Binance | ETHUSDT | 11 | 8 | 100.0 | 100.0 | 6,203 | 1,668,954 | 2.8530 |
| Binance | SOLUSDT | 11 | 3 | 100.0 | 100.0 | 2,884 | 858,286 | 3.9401 |
| Hyperliquid | BTC | 12 | 9 | 100.0 | 91.7 | 898 | 2,070,836 | 1.0883 |
| Hyperliquid | ETH | 12 | 9 | 100.0 | 91.7 | 598 | 1,757,869 | 2.6431 |
| Hyperliquid | SOL | 13 | 9 | 100.0 | 84.6 | 248 | 89,528 | 3.0210 |

Verdict: the existing public/free feature layer is dense enough to compute `trigger_5s` and `pre/post_60s` proxies for BTC/ETH/SOL on Binance and Hyperliquid, but the 10-minute sample is still not alert-edge evidence because it did not overlap an indexed alert/review window. SOL completeness is weaker, especially on 60-second Binance windows and Hyperliquid trade density, so SOL should be reported separately until a longer capture verifies coverage.

Next validation: align a verified capture window with `crypto-updates/runtime/alert-feedback.jsonl` or run a bounded 2-4 hour public capture, then compare price-only alert outcomes against price-plus-orderflow rollups. Do not promote C-036 beyond `Candidate` until that comparison beats the price-only baseline on real alert/review samples.

## Verify / Reassess

The public orderflow rail remains `active-public-proxy`, not proven edge. The 10-minute capture proves viable feature density and rollup feasibility but did not overlap the indexed alert/review sample, so it cannot promote C-036. Next validation should align future alert feedback rows to feature windows and report whether orderflow improves fade/follow-through classification over price-only baseline.

Self-check: public/free data only; no credentials; no exchange accounts; no alert wording or threshold changes; no financial advice; no duplicate note found before writing; source claims cite official Binance/Hyperliquid documentation already in the rail. The `2026-08-11T22:53:49Z` micro-run used only local feature artifacts and made no Telegram notification because no notification gate was met.
