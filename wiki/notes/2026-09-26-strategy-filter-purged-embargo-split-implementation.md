---
type: note
created: 2026-09-26T13:20:00Z
topic: strategy-destruction-filter
status: internal
work_item: validation.strategy-filter-purged-embargo-split-classifier-implementation
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
related:
  - ./2026-09-20-strategy-filter-purged-embargo-split-design.md
  - ./2026-09-22-strategy-filter-purged-embargo-implementation-preflight.md
sources:
  - ../../experiments/strategy-destruction-filter/src/engine.mjs
  - ../../experiments/strategy-destruction-filter/src/verify-filter.mjs
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../outputs/backtest-readiness-audit.json
---
# Strategy Filter Purged/Embargo Split Implementation

Implemented the queued purged/embargo split classifier for the strategy-destruction filter.

## What Changed

- `config.default.json` now uses `evaluation.split.method = purged_embargo_entry_time`.
- `engine.mjs` now classifies entries as `in_sample`, `purged_boundary`, or `out_of_sample`.
- Purge and embargo bars default to the timeframe `maxBars` label horizon and config can only widen them.
- Candidate and time-matched baseline trades receive the same split label.
- `purged_boundary` rows are kept for accounting but excluded before stats, split stats, baseline comparison, walk-forward diagnostics, survivor shapes, and rejected-ledger metrics.
- Every verdict now emits `splitMetadata` with per-run split index, cutoff time, purge/embargo bars, boundary counts, and included sample counts.
- `verify-filter.mjs` now requires the purged/embargo method and asserts candidate/baseline parity after exclusion.
- `backtest-readiness-audit.mjs` now passes the purged/embargo check only when report metadata proves the guard is active.
- `market-data.mjs` falls back to the latest local Bybit cache if public Bybit fetches hit a rate limit or fetch error.

## Result

Latest regenerated filter report:

- Candidates: `13`
- Variants: `131`
- Survivors: `0`
- Survivor shapes: `0`
- Rejected: `131`
- Purged candidate boundary rows excluded: `379`
- Basic OOS sample/expectancy passers: `25`, all still rejected by other gates

Backtest readiness audit now reports `ready_for_research_only_validation` with `11/11` checks passing.

The drift report downgraded the old baseline survivor shape to rejected because it failed `weak_walk_forward_out_of_sample`. Verdict remains `zero_survivor_shapes_no_promotion`.

## Verification

- `node --check` passed for touched scripts.
- `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed `31/31`.
- `npm run filter && npm run audit:backtest && npm run drift:filter && npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed.

## Boundary

No thresholds, scheduler, alert wording, live watcher behavior, data capture, account/key/API access, paid service, execution, public posting, sizing, TP/SL, strategy promotion, live orders, wallet/API/exchange-key handling, or cron jobs changed.
