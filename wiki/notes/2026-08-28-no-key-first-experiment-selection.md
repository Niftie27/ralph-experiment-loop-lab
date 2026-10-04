---
type: research-note
date: 2026-08-28
tags:
  - ralph
  - validation
  - no-key-first
  - routing
related:
  - 2026-08-20-book-freshness-repair.md
  - 2026-08-13-orderflow-alert-alignment-check.md
  - 2026-08-28-strategy-filter-bias-hygiene-checklist.md
sources:
  - ../../../crypto-updates/monitor-index.yaml
  - ../../../crypto-updates/setup-analysis-index.yaml
  - ../../../crypto-updates/analyze-alert-setups.mjs
  - ../../experiments/btc-eth-alert-edge/results/paper-dashboard.md
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
---

# No-Key First Experiment Selection

Selected queue item: `validation.no-key-first-experiment-selection`.

Purpose: choose the next experiment route from active local/public rails before adding custom collection, framework setup, paid APIs, accounts, keys, or live behavior.

## Access Check

Current no-key/local routes are usable:

| Route | Access | Current evidence |
| --- | --- | --- |
| TA learning loop refresh / call-candidate forward check | local `alert-feedback.jsonl`, local Node analyzer, public Binance/Hyperliquid candle endpoints | selected next |
| BTC/ETH/SOL/liquid alert-edge paper dashboard | local backtest and paper ledger artifacts | already refreshed at `2026-08-28T12:04:27Z` |
| strategy-destruction filter | local Node harness plus public cached market data | current report has 9 candidates / 105 variants / 0 survivors |
| guide/source falsification | public web or local docs | useful, but lower immediate value than stale monitor-derived setup analysis |
| AI Research OS index lint | local files only | maintenance task, not the highest evidence-value next item |

Endpoint smoke checks:

- Binance public `/api/v3/time`: reachable without key at run time.
- Hyperliquid public `info` / `allMids`: reachable without key at run time.

No package install, paid API, exchange account, wallet key, exchange key, cron run, watcher restart, alert wording change, risk/sizing change, TP/SL change, live execution, or public posting was used.

## Selection

The next no-key-first route should be `validation.ta-learning-loop-call-candidate-forward-check`.

Reason: the setup analyzer index was stale before this pass: `15` reviewed setups from `2026-08-18T20:20:40.322Z` versus `222` finalized monitor reviews in `crypto-updates/monitor-index.yaml` through `2026-08-28T12:03:28.619Z`. That makes the existing TA learning loop the cheapest high-value validation step, because it can reuse current local monitor evidence before any new collector, social/source scan, or framework work.

## Bounded Refresh Side Effect

During access verification, a smoke run with `CRYPTO_UPDATES_SKIP_CANDLES=1` rewrote the setup-analysis outputs without candle context. That was immediately repaired by a normal no-key/public-data refresh of `crypto-updates/analyze-alert-setups.mjs`.

Current setup-analysis state after repair:

- generated: `2026-08-28T12:52:54.014Z`
- reviewed setups: `223`
- unreviewed alerts: `5`
- candle-context-ready: `132`
- live alert text changed: `no`
- call line decision: `research_candidate_not_live`
- current low-sample research candidate: `velocity-shock-60s|DOWN|evidence-high` -> `Call: fade/reversion favored (low-sample)` with sample `9`

This refresh is not a live alert change and not a promotion. It only makes the next selected validation item current enough to inspect.

## Verify / Reassess

The no-key-first decision is complete: use the existing TA learning loop before adding new machinery. The next bounded item is `validation.ta-learning-loop-call-candidate-forward-check`, focused on whether the refreshed low-sample call candidate deserves a durable watch entry or should stay research-only/no-change.

Do not change live alert text, watcher behavior, thresholds, assets, risk, sizing, TP/SL, execution, cron cadence, keys, accounts, or paid data during that follow-up without explicit Tomas approval.
