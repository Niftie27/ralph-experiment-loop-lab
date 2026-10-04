---
type: note
topic: forward-paper-regime-tagging
created: 2026-08-29T21:22:04Z
last_updated: 2026-08-29T22:14:02Z
work_item: validation.add-forward-paper-regime-tagging-before-more-historical-bucket-promotion
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - walk-forward
related:
  - ../../experiments/btc-eth-alert-edge/paper/signals.json
  - ../../experiments/btc-eth-alert-edge/results/paper-dashboard.md
  - ../concepts/forward-paper-trade-gate.md
---
# Forward Paper Regime Tagging Repair

Date: 2026-08-29
Status: completed
Scope: RALPH Profitability Flywheel, T3 forward paper evidence quality

## Trigger

The SOL B-tier candidate destruction pass exposed an evidence-accounting gap: historical alert-edge buckets are regime-specific, but `experiments/btc-eth-alert-edge/paper/signals.json` only carried symbol, timeframe, setup, direction, and tier. That made future B-tier candidate checks vulnerable to treating forward paper support from adjacent regimes as matching evidence.

## Change

The alert-edge backtest now persists explicit regime fields on forward paper signals:

- `trend`: `up`, `down`, or `range`
- `volatility`: `high-vol`, `mid-vol`, or `low-vol`
- `regime`: `${trend}/${volatility}`

Existing paper-ledger rows are backfilled from local candles during the normal backtest refresh when the signal candle is available. Latest candidates and setup stats also expose separate `trend` and `volatility` fields, not only a combined `regime` string.

The forward paper dashboard now includes regime-aware summary groups:

- `byTierSetupRegime`
- `bySymbolTimeframeSetupRegime`

The Markdown dashboard also renders `By Tier, Setup, And Regime` plus `By Symbol, Timeframe, Setup, And Regime` sections. Open and recent-closed signal lines now include the regime string.

## Verification

Commands:

```bash
npm run backtest --prefix ralph-research-os/experiments/btc-eth-alert-edge
npm run verify --prefix ralph-research-os/experiments/btc-eth-alert-edge
```

Verifier result:

- symbols: 9
- sources: 18
- setup stats: 428
- latest candidates: 3
- paper signals: 171 total, 9 open, 162 closed
- missing paper regime tags: 0
- paper dashboard overall: 171 total, average `0.2895R`, winrate `49.38%`
- A/B/C paper rows: 17 closed, average `0.3267R`, winrate `52.94%`
- feature table validation still passes with 73 rows and 13 clean rows

The verifier now fails if setup stats, latest candidates, or paper signals have missing/invalid trend or volatility fields, or if `regime` does not match `${trend}/${volatility}`.

## Decision Impact

Future historical B-tier candidate selection should require matching forward-paper evidence at symbol/timeframe/setup/direction/regime granularity. Adjacent regimes can remain context, but they are not direct T3 support for promotion.

This repair does not promote any strategy. It only improves the evidence ledger and dashboard used before future candidate checks.

## Boundaries

No live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
