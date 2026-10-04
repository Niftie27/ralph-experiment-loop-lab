---
type: note
created: 2026-09-15T07:30:00Z
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
  - 2026-09-13-strategy-filter-oos-shrinkage-audit.md
  - 2026-09-14-strategy-filter-deflated-sharpe-source-calibration.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
---
# Strategy Filter Chronology Gate Overlap Audit

Bounded work item: `validation.strategy-filter-chronology-gate-overlap-audit`.

## Question

After the out-of-sample baseline-lift gate and deflated-Sharpe source calibration, are the chronology gates still doing independent rejection work, or are they just duplicating headline expectancy/profit-factor/deflated-Sharpe gates?

## Local Statistics

Current report: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-09-13T06:33:46.939Z`.

- Candidates: 13
- Variants tested: 131
- Raw survivors: 2
- Effective survivor shapes: 1
- Rejected variants: 129
- Headline passers by full-sample expectancy, profit factor, and deflated-Sharpe: 21 / 131
- Headline passers that survived all gates: 2 / 21
- Headline passers rejected by chronology gates: 19 / 21
- Variants passing OOS sample plus OOS expectancy: 25 / 131
- Variants passing OOS baseline lift: 51 / 131
- Variants passing both OOS expectancy and OOS baseline lift: 21 / 131
- Variants passing both OOS checks but still rejected: 19 / 21

Failure counts among the 19 rejected headline passers:

- `weak_walk_forward_out_of_sample`: 17
- `weak_out_of_sample_expectancy`: 13
- `weak_out_of_sample_baseline_lift`: 9
- `drawdown_too_high`: 4
- `low_out_of_sample_sample`: 4
- `weak_walk_forward_baseline_lift`: 3
- `low_sample`: 3
- `bad_failure_slice`: 2

The rejected headline passers concentrate in:

- `perp-funding-regime-timeframe-fade-v0`: 7
- `alert-edge-avax-range-breakdown-short-v0`: 6
- `perp-funding-trend-filter-fade-v0`: 5
- `perp-funding-only-fade-v0`: 1

## Interpretation

The chronology layer is still carrying real independent load. A full-sample headline trio would let 21 variants through; the current full filter reduces that to 2 raw survivors and 1 effective survivor shape. All 19 rejected headline passers fail at least one chronology gate, usually walk-forward OOS stability, hard OOS expectancy, or hard OOS baseline lift.

The audit also shows why the newest OOS baseline-lift gate is not enough by itself. Nineteen variants pass both OOS expectancy and OOS baseline lift but are still rejected by other gates, especially walk-forward OOS, deflated-Sharpe, profit factor, drawdown, and failure slices. That is useful overlap, not redundancy: the filter is forcing candidates to survive multiple hostile views rather than one lucky split.

## Verdict

Keep chronology gates strict. In particular:

- keep hard 70/30 OOS expectancy and OOS baseline lift;
- keep equal-trade-count walk-forward diagnostics as survival gates;
- continue reporting survivor shapes, because AVAX raw survivors still collapse to one effective shape;
- do not promote AVAX from Watch until matching regime-specific forward-paper evidence reaches threshold.

No harness change is justified in this micro-run. The next useful strategy-filter hardening item should be a small candidate-level report that separates `headline_pass`, `oos_pass`, `walk_forward_pass`, and `effective_shape_pass` counts so future audits do not need ad hoc scripts.

## Verification

Ran:

```bash
npm run verify --prefix /home/coder/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter
```

Result: `ok=true`, `variants=131`, `survivors=2`, `rejected=129`, `accessibleDataRails=7`.

## Reassessment

The current filter is conservative in the right place. Deflated-Sharpe remains useful as a multiple-testing rejection proxy, but chronology and walk-forward gates are the main protection against attractive all-sample artifacts. Confidence is medium-high because this audit uses the current frozen report; it does not refresh data or add new candidates.

No strategy promotion, alert change, scheduler change, data capture, account/key/API access, execution, paid service, or public posting was started.

## Self-Check

- Stayed research-only and internal.
- Used no new web/source checks.
- Read router/state and directly relevant strategy-filter notes only.
- Ran local statistics over the current report.
- Verified the report with the existing verifier.
- Created one durable note and updated the smallest router/state/log breadcrumbs.
- No Telegram notification gate met.
