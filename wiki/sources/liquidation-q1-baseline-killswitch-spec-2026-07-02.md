---
type: source
name: Liquidation Q1 Baseline Killswitch Spec
source: raw/liquidation-q1-baseline-killswitch-spec-2026-07-02.md
origin: local
authors:
  - Tomas
published_date: 2026-07-02
ingested_at: 2026-07-02T07:20:00Z
tags:
  - liquidations
  - baseline
  - kill-switch
  - replay
  - experiment
summary: Full Q1 test spec for killing the liquidation-map strategy before map/key/capital/subscription work. Tightens C-034 around relative cascade thresholds, point-in-time detection, passive-limit missed fills, risk-adjusted dumb baselines, outlier removal, clustered-loss days, and volatility-proxy checks.
related:
  - wiki/sources/liquidation-q1-baseline-kill-switch-2026-07-01.md
  - experiments/liquidation-q1-baseline-kill-switch/README.md
---

# Liquidation Q1 Baseline Killswitch Spec

This source is the canonical implementation spec for C-034/U-036.

It strengthens the earlier sequencing note into a concrete replay contract:

- no map, keys, capital, paid subscription, or product comparison before Q1;
- historical liquidation events plus candles only;
- cascade size must be relative to a rolling baseline, not an absolute threshold;
- event detection must be point-in-time and cannot use the completed future cascade;
- liquidation-aware entries must use the same passive-limit replay machinery as dumb baselines;
- missed fills, partial fills, adverse selection, fees, spread/slippage, tail loss, no-top-outlier PnL, clustered loss days, and volatility-proxy explanation are all kill criteria;
- output is one line: proceed to Q2 gap map or stop/build nothing.

Current implementation lives in `experiments/liquidation-q1-baseline-kill-switch/`.
