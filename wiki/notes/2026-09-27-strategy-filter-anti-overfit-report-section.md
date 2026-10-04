---
type: note
topic: strategy-filter-anti-overfit-report-section
created: 2026-09-27T17:50:00Z
last_updated: 2026-09-27T17:50:00Z
work_item: validation.strategy-filter-anti-overfit-report-section
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - strategy-filter
  - backtest-hygiene
  - anti-overfit
  - purged-forward-test
  - no-promotion
related:
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/src/run-filter.mjs
  - ../../experiments/strategy-destruction-filter/src/verify-filter.mjs
  - ../../outputs/backtest-readiness-audit.md
  - ../concepts/strategy-destruction-filter.md
---

# Strategy Filter Anti-Overfit Report Section

## Purpose

Repair a reporting hygiene gap: the strategy-destruction filter had purged/embargo chronological split logic and verifier assertions, but the human Markdown report did not have a dedicated anti-overfit section that made the split hygiene obvious.

## Change

Added an `antiOverfitControls` summary to `experiments/strategy-destruction-filter/results/filter-report.json` and a matching `## Anti-Overfit / Split Hygiene` section to `filter-report.md`.

The section now states:

- chronological split method: `purged_embargo_entry_time`
- in-sample ratio: `0.7`
- purged/embargo boundary accounting for candidate and baseline rows
- time-matched alternating-direction baseline
- equal-trade-count chronological walk-forward diagnostics
- multiple-testing guard
- no-promotion result

The verifier now fails if the JSON summary or Markdown section disappears.

## Verification

Commands run:

```bash
npm run filter --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run drift:filter --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run audit:backtest --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter
```

Result:

- `filter`: 13 candidates, 131 variants, 0 survivors, 131 rejected
- `drift:filter`: `zero_survivor_shapes_no_promotion`
- `audit:backtest`: `ready_for_research_only_validation`, 11 pass, 0 fail
- `verify`: pass

## Boundary

No live trading, scheduler/cron, watcher behavior, alert wording, thresholds, keys/accounts, paid services, sizing, TP/SL, execution behavior, public posting, or strategy promotion changed.
