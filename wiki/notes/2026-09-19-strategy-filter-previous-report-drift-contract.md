---
type: note
created: 2026-09-19T07:31:19Z
topic: strategy-destruction-filter
status: internal
work_item: validation.strategy-filter-previous-report-drift-contract
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
related:
  - ./2026-09-13-strategy-filter-survivor-shape-reporting.md
  - ./2026-09-17-strategy-filter-gate-group-reporting.md
  - ./2026-09-18-strategy-filter-near-miss-gate-pressure-audit.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/filter-report.md
---
# Strategy Filter Previous-Report Drift Contract

Bounded work item: `validation.strategy-filter-previous-report-drift-contract`.

## Question

After the near-miss gate-pressure audit, define the smallest previous-report comparison that would have surfaced the AVAX downgrade without loosening any hard gate.

## Current Evidence

Current generated report: `2026-09-17T07:35:11.990Z`.

- Candidates: `13`
- Variants: `131`
- Raw survivors: `0`
- Effective survivor shapes: `0`
- Rejected: `131`

Current gate-group counts:

- `headline_pass`: `12 / 131`
- `deflated_sharpe_pass`: `25 / 131`
- `oos_pass`: `25 / 131`
- `baseline_pass`: `34 / 131`
- `walk_forward_pass`: `3 / 131`
- `psr >= 0.95`: `39 / 131`
- `psr >= 0.975`: `34 / 131`
- `psr >= 0.99`: `29 / 131`

Previous survivor-shape note from `2026-09-13T06:33:46.939Z` recorded:

- Candidates: `13`
- Variants: `131`
- Raw survivors: `2`
- Effective survivor shapes: `1`
- Rejected: `129`
- Effective shape: `alert-edge-avax-range-breakdown-short-v0|shape-1`

The drift that matters:

- Raw survivors changed from `2` to `0`.
- Effective survivor shapes changed from `1` to `0`.
- Rejected variants changed from `129` to `131`.
- The prior AVAX effective survivor shape is now a rejected historical shape.
- The leading AVAX duplicate variants still pass headline, approximate deflated-Sharpe, chronological OOS, and baseline checks, but fail `weak_walk_forward_out_of_sample`.

## Contract

Add previous-report comparison only when there is a frozen prior report artifact or note with compatible fields. The comparison should be report-level and shape-level, not trade-by-trade, unless a specific drift requires deeper inspection.

Minimum fields:

- Previous and current `generatedAt`.
- Candidate count, variant count, raw survivors, effective survivor shapes, and rejected variants.
- Gate-group pass counts when both reports contain `gateGroupDiagnostics`.
- Added, removed, and status-changed effective survivor shapes.
- For changed shapes: representative variant id, current status, failure reasons, sample, expectancy, deflated-Sharpe proxy, OOS expectancy, OOS baseline lift, and walk-forward OOS-fold count.
- An explicit `no_threshold_change` statement when the drift is explained by fresh data or stricter reporting rather than a gate edit.

Non-goals:

- Do not turn drift reporting into a promotion signal.
- Do not loosen walk-forward, OOS, baseline, deflated-Sharpe, drawdown, failure-slice, or sample gates.
- Do not require long raw trade diffs inside the daily autoresearch loop.

## Verdict

The next useful implementation is a small previous-report comparison section in the strategy-filter report or a sidecar drift file. Its job is to make candidate state changes visible and auditable, especially `survivor -> rejected` or `watch -> discarded` transitions.

Current strategy state remains strict: zero survivor shapes, AVAX downgraded, and no candidate promotion.

## Verification

Ran a local statistics script over `experiments/strategy-destruction-filter/results/filter-report.json` and compared it with the existing `2026-09-13` survivor-shape note and `2026-09-17` gate-group note.

No web/source checks were used. No code, candidate definitions, data capture, scheduler, alert surface, threshold, risk/sizing/TP/SL, execution behavior, account/key/API access, paid service, public posting, or strategy promotion changed.

## Reassessment

Confidence is high that previous-report comparison is the right next hardening step because the current issue is interpretability of state changes, not absence of another hard gate. Confidence is medium on whether this should live inside `filter-report.json` or a sidecar file; the cheaper first implementation is a sidecar drift report generated from two frozen reports.

## Self-Check

- Stayed internal and research-only.
- Chose exactly one bounded work item.
- Used no new web/source checks.
- Used existing public/no-key report output and prior durable notes only.
- Produced one durable note plus minimal router/queue/state/log breadcrumbs.
- Did not change live trading, orders, wallet keys, exchange keys, paid APIs, account setup, scheduler/cadence, alert wording, thresholds, risk/sizing/TP/SL, execution, public posting, or strategy promotion.
- No Telegram notification gate met.
