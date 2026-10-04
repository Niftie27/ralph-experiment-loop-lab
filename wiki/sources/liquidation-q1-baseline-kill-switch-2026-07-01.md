---
type: source
name: Liquidation Q1 Baseline Kill Switch
source: raw/liquidation-q1-baseline-kill-switch-2026-07-01.md
origin: web
authors:
  - Tomas
  - assistant
published_date: 2026-07-01
ingested_at: 2026-07-01T23:59:00Z
tags:
  - liquidations
  - baseline
  - kill-switch
  - replay
  - build-vs-buy
  - pricing
summary: Sequencing correction for the liquidation-map branch. Before broad product gap mapping or building, run a cheap Q1 test: do liquidation cascade reversals beat simple drawdown/candle baselines after costs and tail risk?
sha256: 2d27520fd1dd80156bb9b01629bd1556d1ac0a0b8d391e6facb11b38aabc8ce5
related:
  - wiki/sources/liquidation-map-prior-art-gap-map-2026-07-01.md
  - wiki/notes/2026-07-01-liquidation-map-feasibility-spec.md
  - wiki/comparisons/liquidation-map-build-vs-buy.md
---

# Liquidation Q1 Baseline Kill Switch

This source narrows the liquidation-map branch to the cheapest possible falsification step.

## Main Correction

Do not start with a wide product comparison.

First answer:

> Do liquidation cascades create a replay-positive bounce edge after costs, and does that beat simple drawdown/candle reversal baselines?

If not, the liquidation map is probably a volatility proxy rather than alpha.

## Current Status

RALPH should run `liquidation-q1-baseline-kill-switch` before broad `liquidation-map-prior-art-gap-map` and before any replay harness build.

The only product/tool question needed right now is: which source gives the cheapest historical liquidation events and candles for this Q1 test?
