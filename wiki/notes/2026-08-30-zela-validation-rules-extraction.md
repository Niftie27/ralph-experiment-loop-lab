---
type: note
topic: zela-validation-rules-extraction
created: 2026-08-30T09:46:00Z
last_updated: 2026-08-30T09:46:00Z
work_item: investigation.zela-validation-rules-extraction
status: complete
scope: research-only
sources:
  - ../sources/zela-planner-handoff.md
  - ../../raw/zela-planner-handoff.md
  - ../../case-files/zela-benchmark/README.md
  - ../../case-files/zela-benchmark/lessons.md
  - ../../../zela-benchmark/source/README.md
  - ../../../zela-benchmark/source/docs/M4_RESULTS.md
  - ../../../zela-benchmark/source/docs/M5_RESULTS.md
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
  - ../../core/testing-protocol.md
  - ../../core/profitability-flywheel.md
---
# Zela Validation Rules Extraction

## Purpose

This closes `investigation.zela-validation-rules-extraction` and resolves `U-003` for current RALPH routing.

Zela is not a current trading target. The useful RALPH output is benchmark discipline: how to measure, caveat, reproduce, and stop when the target changes.

## Extracted Rules

| Rule | Zela lesson | RALPH use |
| --- | --- | --- |
| Paired measurement | M5 used paired runs and reported the paired-run denominator separately | Compare candidates against baselines on matched rows where possible |
| Symmetric filtering | M5 filtered cold starts symmetrically and disclosed filtered errors | Apply identical quality filters to strategy and baseline rows |
| Denominator discipline | M5 separated 3,411 paired runs from 2,571 known-leader routing rows | Every percentage must state its denominator and exclusion count |
| Caveat beside claim | README and M4/M5 paired headline ratios with baseline-handicap caveats | Put fees, slippage, freshness, sample, and bias caveats next to results |
| Distribution over median | M4 showed median alone hid bimodal latency | Report tail, regimes, drawdown, and failure slices, not only headline expectancy |
| Source-of-truth artifacts | Frozen datasets, manifests, scripts, and result CSVs reproduce M5 | Keep raw/result artifacts linked for every promoted RALPH note |
| Independent review | Reviewer caught ratio and run-id bugs in M4 | Use reviewer-style checks for result math, joins, and wording before promotion |
| Workload scope | Zela report said read path only, not write path/live workflow | State exactly what a strategy test does and does not measure |
| Access/freshness limits | M5 upstream refresh path may drift due external validator metadata | Freeze result artifacts; label live refetches as refreshes, not reproduction |
| Stop-loss on dead target | Handoff says live Zela target shut down; do not auto-continue build | Reassess when venue/source/product disappears or thesis becomes moot |

## RALPH Validation Checklist

Before any RALPH candidate is promoted beyond watch:

1. Define the measured workload in one sentence.
2. Define the baseline and why it is fair.
3. Record whether rows are paired, matched, or unmatched.
4. Apply symmetric exclusions where possible.
5. State denominator, exclusion count, and missing-data reason for every headline rate.
6. Report median/tail or expectancy/drawdown/failure slices, not one number.
7. Pair every numeric claim with the caveat that changes interpretation.
8. Keep source artifacts linked: raw input, manifest, code path, result file, note.
9. Run a reviewer pass against math, joins, leakage, and wording.
10. Stop or pivot if the thing being benchmarked disappears, becomes inaccessible, or no longer maps to Tomas's goal.

## RALPH-Specific Applications

For alert-edge and strategy-destruction work:

- matched rows beat broad aggregates;
- baseline lift must be reported with sample size and rejection slices;
- forward-paper rows should keep unmatched/missed/stale cases visible.

For wallet-shadowing:

- frozen cohort timestamp is the equivalent of Zela's frozen manifest;
- capture ratios need denominator and missing-fill counts;
- source-profile PnL is not enough without post-selection paper rows.

For orderflow/replay:

- exact symbol/time overlap is mandatory before treating captures as alert-classification evidence;
- pipeline evidence must be labeled separately from strategy evidence.

## Decision

`C-003` remains useful as methodology but the extraction branch is complete. `U-003` is resolved for current routing.

Future Zela work should not revive the old live benchmark unless Tomas explicitly reopens it. Use Zela as a validation-quality reference and builder-credibility case file.

## Reassess

Confidence increased that Zela's strongest transferable value is denominator/caveat/reproducibility discipline, not latency numbers themselves.

The next RALPH work should return to evidence production or queue hygiene, not more Zela reading.

## Boundaries

No live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
