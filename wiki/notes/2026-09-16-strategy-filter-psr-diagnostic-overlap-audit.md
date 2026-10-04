---
type: note
created: 2026-09-16T07:30:00Z
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
  - 2026-09-14-strategy-filter-deflated-sharpe-source-calibration.md
  - 2026-09-15-strategy-filter-chronology-gate-overlap-audit.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
---
# Strategy Filter PSR Diagnostic Overlap Audit

Bounded work item: `validation.strategy-filter-psr-diagnostic-overlap-audit`.

## Question

The filter already reports a diagnostic PSR-style probability beside the approximate multiple-testing deflated-Sharpe proxy. Would turning that diagnostic into another hard survival gate add useful protection, or would it create false precision and arbitrary threshold risk?

## Local Statistics

Current report: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-09-13T06:33:46.939Z`.

- Candidates: 13
- Variants tested: 131
- Raw survivors: 2
- Effective survivor shapes: 1
- Rejected variants: 129
- Deflated-Sharpe passers at the current hard floor: 25 / 131
- PSR-style diagnostic passers at `>= 0.95`: 40 / 131
- PSR-style diagnostic passers at `>= 0.975`: 34 / 131
- PSR-style diagnostic passers at `>= 0.99`: 25 / 131

At `PSR >= 0.95`, the diagnostic is looser than the current deflated-Sharpe gate:

- 38 / 40 PSR passers are still rejected by the full filter.
- 20 / 40 PSR passers fail the existing deflated-Sharpe floor.
- Both current AVAX raw survivors pass, so the diagnostic does not separate the effective survivor shape from many false positives.

Failure counts among rejected `PSR >= 0.95` passers:

- `weak_walk_forward_out_of_sample`: 37
- `weak_out_of_sample_expectancy`: 28
- `drawdown_too_high`: 25
- `weak_profit_factor`: 23
- `deflated_sharpe_fail`: 20
- `weak_expectancy_after_costs`: 18
- `bad_failure_slice`: 16
- `weak_out_of_sample_baseline_lift`: 16

At `PSR >= 0.99`, the diagnostic becomes harsher but starts rejecting the current survivors too:

- 25 / 131 variants pass.
- 25 / 25 passers are still rejected; the two current AVAX survivors fail the arbitrary `0.99` cut because their diagnostic probability is `0.9872`.
- That makes `0.99` too blunt as a hard gate without a source-backed calibration reason.

The diagnostic also does not replace the existing approximate deflated-Sharpe gate. Five rejected variants pass the deflated-Sharpe floor while staying below `PSR 0.95`; all five are already killed by OOS, drawdown, or walk-forward gates.

## Interpretation

The PSR-style diagnostic is useful context, but it is not a clean hard gate in the current report. A permissive threshold such as `0.95` admits many variants that the strict filter correctly rejects by OOS, walk-forward, drawdown, failure-slice, profit-factor, or deflated-Sharpe checks. A stricter threshold such as `0.99` would reject the only current effective survivor shape while still leaving only rejected variants above the cut.

This is exactly the kind of metric that should remain diagnostic until the filter stores enough per-variant return series and benchmark-return series to calibrate thresholds deliberately. The existing hard gates remain better grounded: full-sample expectancy/profit factor, approximate multiple-testing deflated Sharpe, chronological OOS expectancy, OOS baseline lift, walk-forward stability, drawdown, and failure-slice behavior.

## Verdict

Do not promote PSR-style probability to a hard survival gate in the current filter. Keep it as diagnostic reporting only.

The next useful harness improvement remains reporting clarity rather than a new threshold: expose gate-group pass counts for `headline_pass`, `oos_pass`, `walk_forward_pass`, `baseline_pass`, `deflated_sharpe_pass`, `psr_diagnostic_band`, and `effective_shape_pass` so future audits can be reproducible without ad hoc scripts.

AVAX remains Watch / forward-paper-needed. No strategy promotion, alert change, scheduler change, data capture, account/key/API access, paid service, execution, or public posting was started.

## Verification

Ran:

```bash
npm run verify --prefix /home/coder/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter
```

Result: `ok=true`, `variants=131`, `survivors=2`, `rejected=129`, `accessibleDataRails=7`.

## Reassessment

Confidence is medium-high for this bounded conclusion because it uses the current frozen 131-variant report and directly compares the diagnostic metric against existing full-filter outcomes. It does not claim a universal PSR threshold; it only says the current report does not justify turning this diagnostic into a hard gate.

## Self-Check

- Stayed research-only and internal.
- Used no new web/source checks.
- Read router/state and directly relevant strategy-filter notes only.
- Ran local statistics over the current report.
- Verified the report with the existing verifier.
- Created one durable note and will update the smallest router/state/log breadcrumbs.
- No Telegram notification gate met.
