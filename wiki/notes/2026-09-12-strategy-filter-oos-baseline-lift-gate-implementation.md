---
type: note
created: 2026-09-12T16:55:00Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - baseline-comparison
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-09-12-strategy-filter-oos-baseline-lift-audit.md
  - 2026-09-12-strategy-filter-oos-baseline-lift-gate-design.md
sources:
  - ../../experiments/strategy-destruction-filter/src/engine.mjs
  - ../../experiments/strategy-destruction-filter/src/verify-filter.mjs
  - ../../experiments/strategy-destruction-filter/test/engine.test.mjs
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
---
# Strategy Filter OOS Baseline-Lift Gate Implementation

Bounded work item: `validation.strategy-filter-oos-baseline-lift-gate-implementation`.

## Change

Implemented the stricter out-of-sample baseline-lift gate proposed by the same-day design note.

- `src/engine.mjs` now rejects variants with failure `weak_out_of_sample_baseline_lift` when `baseline.comparison.outOfSampleExpectancyLiftR` is not finite or is below `gates.minBaselineExpectancyLiftR`.
- `src/verify-filter.mjs` now asserts every surviving variant also clears the out-of-sample baseline-lift floor.
- `src/run-filter.mjs` reports the out-of-sample baseline-lift floor in the Markdown gate list.
- `test/engine.test.mjs` adds a focused case where full-sample baseline lift passes but out-of-sample lift fails.

## Result

Fresh regeneration at `2026-09-12T16:53:55.187Z` produced:

- candidates: 13
- variants tested: 131
- survivors: 2
- rejected: 129
- surviving raw variants: `alert-edge-avax-range-breakdown-short-v0#1` and `#2`
- surviving unique metric/signal shapes: 1, because `#1/#2` remain a duplicate shape

The survivors have:

- expectancy: `0.1879R`
- out-of-sample expectancy: `0.0927R`
- baseline expectancy lift: `0.2099R`
- out-of-sample baseline lift: `0.125R`
- walk-forward folds: 5/5 positive expectancy, 4/5 positive baseline lift

AVAX remains Watch / forward-paper-needed because exact regime-tagged forward-paper rows are still `0/20`. This is a stronger historical-research filter, not a strategy promotion.

## Verification

- `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed 29 tests.
- `node --check` passed for `src/engine.mjs`, `src/verify-filter.mjs`, and `src/run-filter.mjs`.
- `npm run filter --prefix ralph-research-os/experiments/strategy-destruction-filter` passed.
- `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed with 2 survivors, 129 rejected, 14 feature studies, 7 accessible data rails.
- `node ralph-research-os/automation/state-of-edge-report.mjs` passed with verdict `no_trade_watch_low_sample`.
- `node ralph-research-os/automation/research-validation-checklist.mjs` passed with expected overall `warn`: paper/demo remains not-ready and cron has a warning diagnostic, while retrieval/pathRefs/queues/delivery/HITL/loop/handoff/boundary checks pass.
- `node ralph-research-os/automation/evidence-ledger-prioritizer.mjs` passed and now reports strategy filter `13 candidates / 131 variants / 2 survivors / 129 rejected`.

## Boundary

No live trading, autonomous orders, exchange mutations, wallet keys, exchange keys, paid APIs, account setup, public posting, live alert wording, live alert thresholds, scheduler/cadence, risk/sizing/TP/SL, execution behavior, watcher behavior, data capture, or strategy promotion changed.
