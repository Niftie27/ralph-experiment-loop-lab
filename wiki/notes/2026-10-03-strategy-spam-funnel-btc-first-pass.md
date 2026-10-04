---
type: research-note
created: 2026-10-03T18:03:00Z
topic: strategy-spam-funnel-btc-first-pass
status: complete
work_item: validation.strategy-spam-funnel-btc-first-pass
scope: research-only
tags:
  - ralph
  - research-only
  - validation
  - strategy-spam
  - btc
  - no-live-trading
  - no-execution
related:
  - 2026-10-03-market-bot-reverse-engineering-source-map.md
  - 2026-10-03-grid-range-claim-falsifier-contract.md
  - ../../experiments/strategy-destruction-filter/results/strategy-spam-funnel-btc-first-pass.md
  - ../../experiments/strategy-destruction-filter/src/run-strategy-spam-funnel.mjs
---
# Strategy Spam Funnel BTC First Pass

## Purpose

Tomas challenged the process: instead of overcomplicating reverse-engineering and strategy design, why not spam strategies and see what survives?

This pass turns that correction into a runnable first funnel: cheap high-throughput BTC-only strategy spam over public candle data, isolated from the curated strategy candidates.

## Implementation

Added:

- `experiments/strategy-destruction-filter/src/run-strategy-spam-funnel.mjs`
- npm script `study:strategy-spam-funnel`
- outputs:
  - `experiments/strategy-destruction-filter/results/strategy-spam-funnel-btc-first-pass.json`
  - `experiments/strategy-destruction-filter/results/strategy-spam-funnel-btc-first-pass.md`

Updated:

- `experiments/strategy-destruction-filter/src/verify-filter.mjs` with a research-only guard for the spam-funnel output.

The script intentionally does not edit `candidates/seed-strategies.json`. Survivors, if any, must be manually reviewed before becoming curated candidates.

## Test Surface

Scope:

- BTC only.
- Public Binance spot candles.
- Timeframes: 1h and 4h.
- Same strict gates as the destruction filter: sample, expectancy, profit factor, drawdown, worst slice, out-of-sample, baseline lift, walk-forward, and deflated-Sharpe proxy.

Families spammed:

- BTC volume breakout.
- BTC RSI fade.
- BTC moving-average reclaim/reject.
- BTC downside volume-shock fade.
- BTC upside volume-shock fade.

## Result

Verdict: `no_survivors_rejected_batch`.

- Candidate families: 5.
- Variants tested: 254.
- Survivors: 0.
- Rejected: 254.
- Near misses: 10.

Best-looking variants were BTC volume-breakout variants. They had positive aggregate expectancy and baseline lift, but failed the things that matter:

- weak profit factor;
- drawdown too high;
- bad failure slice;
- negative out-of-sample expectancy;
- weak out-of-sample baseline lift;
- weak walk-forward out-of-sample.

Representative top row:

- `spam-btc-volume-breakout-v0#65`
- sample `527`
- expectancy `0.0715R`
- PF `1.1262`
- OOS expectancy `-0.123R`
- baseline lift `0.1292R`
- max drawdown `29.7271R`
- rejected.

## Interpretation

This is the right shape for RALPH's edge search: generate many simple ideas cheaply, kill most of them, and only deep-dive real survivors.

The first batch found no survivor. That is still progress because it replaces theory with a measured rejection and gives the system a runnable spam harness.

Next useful expansion:

1. Add alt-symbol spam only with explicit BTC regime gating.
2. Add one source-inspired family at a time from the bot-market map.
3. Keep spam outputs separate from curated candidates until a variant survives strict gates.
4. Summarize duplicate metric-shapes so parameter clones do not create fake breadth.

## Boundary

No live trading, orders, keys, paid APIs, account setup, wallet connection, scheduler/cron change, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, candidate import, or strategy promotion changed.
