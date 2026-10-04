---
type: note
created: 2026-09-03T07:30:00Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - audit
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-08-29-avax-range-breakdown-watch.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/config.default.json
---
# Strategy Filter Survivor Uniqueness Audit

Bounded work item: `validation.strategy-filter-survivor-uniqueness-audit`.

## Question

Do the current strategy-destruction-filter survivors represent independent evidence, or is the survivor count inflated by parameter-grid duplication?

## Local Statistics

Current report: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-08-29T21:54:55.315Z`.

- candidates: 13
- variants tested: 131
- reported survivors: 6
- survivor family count: 1 (`alert-edge-avax-range-breakdown-short-v0`)
- unique survivor metric shapes after collapsing identical performance/split/walk-forward/baseline metrics: 3
- duplicate survivor groups by metric shape: `#1/#2`, `#3/#4`, `#5/#6`
- all duplicate pairs differ only by `rsiMaxShort` (`45` vs `50`) while testing a short-only AVAX range-breakdown bucket, so that parameter does not change entries for this candidate shape
- forward-paper-ready survivors: 0

Survivor weakness checks:

- `#1/#2`: sample `213`, OOS sample `74`, OOS expectancy `0.1426R`, baseline lift `0.4098R`, OOS baseline lift `0.259R`, walk-forward positive folds `5/5`, positive baseline-lift folds `5/5`, positive OOS folds `2`.
- `#3/#4`: sample `184`, OOS sample `65`, OOS expectancy `0.1473R`, baseline lift `0.2792R`, OOS baseline lift `-0.1171R`, walk-forward positive folds `4/5`, positive baseline-lift folds `4/5`, positive OOS folds `2`, minimum fold expectancy `-0.0539R`.
- `#5/#6`: sample `182`, OOS sample `66`, OOS expectancy `0.1289R`, baseline lift `0.2733R`, OOS baseline lift `0.1392R`, walk-forward positive folds `5/5`, positive baseline-lift folds `4/5`, positive OOS folds `2`.

## Verdict

The filter is not showing six independent AVAX discoveries. It is showing three materially distinct historical AVAX parameter shapes, duplicated by a non-operative short-side RSI parameter. This does not create a live or paper promotion because the AVAX bucket is already Watch / forward-paper-needed with zero exact regime-tagged forward-paper rows.

For future filter reporting, treat survivor counts as parameter-grid artifacts until collapsed by unique signal/metric shape. Promotion language should say "survivor shapes" rather than raw "survivors" when duplicate parameter combinations produce identical trades.

## Reassessment

No harness change is needed inside this micro-run. The immediate guard is documentation/routing: keep AVAX historical survivors in Watch, require exact forward-paper rows before candidate language, and prefer a future compact reporter check that groups identical trade outcomes before summary counts.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, risk/sizing, TP/SL, scheduler changes, or public posting.
- Started from the compact router and read only the directly relevant strategy-filter notes/results.
- Used no new web/source checks; existing local report and config were sufficient.
- Ran local statistics over the current 131-variant report.
- Verify/Reassess result: the AVAX survivor count is inflated as a raw count, but not promotion-relevant because forward-paper support is still absent.
- No Telegram notification gate met.
