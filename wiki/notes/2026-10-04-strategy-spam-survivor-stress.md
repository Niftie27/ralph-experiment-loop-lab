---
type: research-note
created: 2026-10-04T08:40:00Z
topic: strategy-spam-survivor-stress
status: complete
work_item: validation.strategy-spam-survivor-stress
scope: research-only
tags:
  - ralph
  - research-only
  - validation
  - strategy-spam
  - survivor-stress
  - btc-gate
  - no-live-trading
  - no-execution
related:
  - 2026-10-04-strategy-spam-funnel-cleanup-btc-gated-alt-dedupe.md
  - ../../experiments/strategy-destruction-filter/results/strategy-spam-survivor-stress.md
  - ../../experiments/strategy-destruction-filter/results/strategy-spam-funnel-btc-first-pass.md
  - ../../experiments/strategy-destruction-filter/src/run-strategy-spam-survivor-stress.mjs
---
# Strategy Spam Survivor Stress

## Purpose

The cleaned strategy-spam funnel found one research survivor: `spam-alt-btc-gated-ma-reclaim-v0#57`, a SOL 4h BTC-gated MA reclaim/reject variant.

This pass stress-tests that survivor before any candidate import or recurring-lane wiring.

## Implementation

Added:

- `experiments/strategy-destruction-filter/src/run-strategy-spam-survivor-stress.mjs`
- npm script `study:strategy-spam-survivor-stress`
- outputs:
  - `experiments/strategy-destruction-filter/results/strategy-spam-survivor-stress.json`
  - `experiments/strategy-destruction-filter/results/strategy-spam-survivor-stress.md`

Updated:

- `experiments/strategy-destruction-filter/src/verify-filter.mjs`

## Stresses

The stress runner reruns the exact survivor and checks:

- stricter BTC gate;
- doubled costs;
- extra 10 bps round-trip cost;
- extra 20 bps round-trip cost;
- same params on ETH 4h;
- same params on SOL 1h;
- direction, month, week, regime, and remove-best splits.

## Result

Verdict: `watch_only_survivor_stress_failed`.

Failures:

- `extra_20bps_round_trip_rejects`
- `no_symbol_or_timeframe_transfer`

Base survivor still passes:

- sample `262`;
- expectancy `0.1391R`;
- profit factor `1.2595`;
- OOS expectancy `0.1089R`;
- max drawdown `15.2085R`.

Stricter BTC gate also passes:

- sample `196`;
- expectancy `0.1582R`;
- profit factor `1.2980`;
- OOS expectancy `0.1420R`;
- max drawdown `12.7317R`.

Cost stress:

- double costs still passes: expectancy `0.0901R`, PF `1.1602`;
- extra 10 bps round-trip still passes: expectancy `0.1041R`, PF `1.1876`;
- extra 20 bps round-trip rejects on weak PF: expectancy `0.0691R`, PF `1.1205`.

Transfer stress:

- ETH 4h rejects hard: expectancy `-0.1271R`, PF `0.8057`, max DD `47.3175R`;
- SOL 1h rejects hard: expectancy `-0.0769R`, PF `0.8878`, max DD `99.2511R`.

Direction split:

- long side carries almost all edge: 150 trades, `0.2302R` expectancy, `34.5347R` total;
- short side is near-flat: 112 trades, `0.0169R` expectancy, `1.897R` total.

Remove-best period stress stays positive, so the main failure is not one best month/week. The weak points are transfer failure, short-side weakness, and fee fragility at +20 bps.

## Decision

Keep the survivor as watch-only research evidence and a falsification target.

Do not:

- import it into `seed-strategies.json`;
- promote it as a strategy;
- wire it into live/paper/demo behavior;
- create or alter cron/scheduler/autoresearch behavior around it.

The recurring strategy-spam lane should still be considered a research furnace, but this survivor does not justify recurring promotion behavior.

## Boundary

No live trading, orders, keys, paid APIs, account setup, wallet connection, scheduler/cron change, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, candidate import, or strategy promotion changed.
