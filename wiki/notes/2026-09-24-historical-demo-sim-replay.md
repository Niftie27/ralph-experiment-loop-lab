---
type: research-note
status: unknown
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
related:
  - ../research-map.md
---

# Historical DEMO-SIM Replay

Created: 2026-09-24

## Summary

Implemented a research-only historical replay harness for the BTC/ETH alert-edge experiment:

- Script: `ralph-research-os/experiments/btc-eth-alert-edge/src/historical-demo-sim-replay.mjs`
- Inputs: existing `paper/signals.json` setup records plus cached 1h/4h candle files.
- Outputs: `results/historical-demo-sim-replay.json` and `results/historical-demo-sim-replay.md`.
- Scope: no live execution, no scheduler edits, no exchange keys, no TradingView automation.

## Replay Contract

Each setup is replayed as a DEMO-SIM-like synthetic position:

- Entry at the setup signal entry price.
- TP and SL from the signal record.
- Time exit at the signal `maxBars` horizon.
- 1000 USDT margin, 10x leverage, 10000 USDT notional.
- Fees: 5.5 bps per side, matching the live DEMO-SIM paper fee default.
- If TP and SL are both inside the same candle, mark `ambiguous: true` and score conservatively as `SL_FIRST`.
- BTC gate state is recorded for each alt setup as context, but historical rows are not discarded.

## Current Run

Generated at 2026-09-24T17:02:01.894Z:

- Total signals: 460
- Closed: 452
- Open/skipped: 8
- Winrate: 31.6%
- Net PnL: -5746.06 USDT
- Average R: -0.201 after excluding invalid R records
- Profit factor: 0.8966
- Ambiguous candles: 17
- Exits: 126 TP / 280 SL / 46 time-exit
- Bad R records: 53, caused by rounded signal prices where entry and stop are equal

BTC gate grouping was directionally meaningful:

- `BTC_RISK_ON`: 159 closed, 37.7% winrate, +4375.09 USDT, average R +0.0309
- `BTC_TRANSITION`: 160 closed, 34.4% winrate, +902.85 USDT, average R -0.1386
- `BTC_RISK_OFF`: 86 closed, 16.3% winrate, -9826.94 USDT, average R -0.6356

## Decision

This confirms Tomas's intuition that old setups should be replayed through the same lifecycle as DEMO-SIM rather than only bucketed in coarse research stats. The next research fix should preserve full precision for generated signal levels, because rounded low-price assets created invalid R-multiple rows.
