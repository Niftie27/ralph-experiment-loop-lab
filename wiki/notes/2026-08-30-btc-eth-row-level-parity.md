---
type: note
topic: btc-eth-row-level-parity
created: 2026-08-30T06:31:00Z
last_updated: 2026-08-30T06:31:00Z
work_item: investigation.btc-eth-edge-row-level-parity
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - orderflow
  - ta
  - btc-risk-on
related:
  - 2026-08-11-btc-eth-edge-prior-art-scan.md
  - ../../experiments/btc-eth-alert-edge/src/framework_benchmark.py
  - ../../experiments/btc-eth-alert-edge/results/framework-benchmark.json
  - ../../experiments/btc-eth-alert-edge/results/framework-benchmark.md
---
# BTC/ETH Row-Level Parity

## Purpose

This closes a bounded `investigation.btc-eth-edge-row-level-parity` pass.

The previous vectorbt benchmark agreed directionally with the custom alert-edge conclusion, but only at aggregate level. This pass made the benchmark reproducible again and added explicit row-level entry-time overlap so framework agreement cannot be inferred from summary stats alone.

## Repair

The existing benchmark command failed in this runtime because `uv` resolved a newer Plotly package that rejected vectorbt's bundled `scattermapbox` template field.

Repair made:

- pinned the benchmark runner to `plotly<6` in `experiments/btc-eth-alert-edge/package.json`;
- updated `framework_benchmark.py` so the generated artifact records the exact pinned runner;
- added row-level custom event-study samples and vectorbt trade-row samples to `results/framework-benchmark.json`;
- added `results/framework-benchmark.md` as a compact human-readable report.

## Result

Scope: BTCUSDT and ETHUSDT 4h `momentum_reversal_long`.

| Symbol | Custom rows | Vectorbt rows | Shared entries | Custom-only | Vectorbt-only | Status |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| BTCUSDT | 47 | 34 | 33 | 14 | 1 | explainable_portfolio_tail_difference |
| ETHUSDT | 55 | 35 | 34 | 21 | 1 | explainable_portfolio_tail_difference |

Aggregate checks still reject the setup family as weak:

| Symbol | Custom event-study | Vectorbt portfolio |
| --- | --- | --- |
| BTCUSDT | 47 samples, 36.17% winrate, -0.1714R expectancy, 0.7334 PF | 34 trades, 39.39% win rate, -6.917% total return |
| ETHUSDT | 55 samples, 40.00% winrate, -0.1442R expectancy, 0.7464 PF | 35 trades, 38.24% win rate, -23.5246% total return |

## Interpretation

The row-level difference is explainable, not a promotion signal:

- custom event-study rows score each qualifying setup independently;
- vectorbt suppresses overlapping entries while a portfolio position is open;
- vectorbt also opens a recent tail signal before the custom event-study has enough future bars to score a full max-bars outcome.

## Decision

Keep vectorbt as an external sanity check, not as the sole source of truth.

Future benchmark claims must include row-level overlap and an explicit explanation for custom-only and framework-only rows. The BTC/ETH 4h `momentum_reversal_long` setup remains weak; no alert qualification, paper promotion, or strategy promotion follows from this pass.

## Verification

- `npm run benchmark:vectorbt --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed with the Plotly pin.

## Boundaries

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
