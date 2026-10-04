---
type: note
created: 2026-08-27T21:29:25Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - rejected
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-08-27-strategy-filter-rejection-ledger-quality-audit.md
sources:
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/results/rejected-ideas.jsonl
  - ../../experiments/strategy-destruction-filter/candidates/seed-strategies.json
---
# Strategy Filter Rejection Ledger Schema Guard

Bounded work item: `validation.strategy-filter-rejection-ledger-schema-guard`.

## Question

What exact semantic fields must the rejected-ideas ledger carry so future text-first strategy intake cannot repackage killed mechanisms as new ideas?

## Local Statistics

Current strict-filter output: `experiments/strategy-destruction-filter/results/filter-report.json`, generated `2026-08-25T22:39:59.454Z`.

- candidates: 9
- variants: 105
- report rejected rows: 105
- rejected JSONL rows: 105
- unique rejected idea texts present in report: 9
- unique candidate mechanisms present in candidate specs: 9

Semantic-field coverage:

- `filter-report.json` verdict rows: `idea` present on 105/105 rejected rows.
- `filter-report.json` verdict rows: `thesis`, `dataRequirements`, and `validation` absent on 105/105 rejected rows.
- `rejected-ideas.jsonl` rows: `idea`, `thesis`, `dataRequirements`, and `validation` absent on 105/105 rows.
- `candidates/seed-strategies.json`: `idea`, `thesis.mechanism`, `thesis.edgeSpeed`, `thesis.expectedBehavior`, `thesis.falsifiableClaim`, `dataRequirements`, and `validation` present on 9/9 candidates.

## Guard Contract

The minimal useful rejected-ledger semantic guard should require every rejected JSONL row to include:

- `idea`
- `thesis.mechanism`
- `thesis.edgeSpeed`
- `thesis.expectedBehavior`
- `thesis.falsifiableClaim`
- `dataRequirements.markets`
- `dataRequirements.requiredFeatures`
- `dataRequirements.minLookbackDays`
- `validation.baseline`
- `validation.gates`
- `validation.killCriteria`

The guard should fail verification if any rejected row lacks those fields, or if a rejected row's copied semantic fields disagree with the source candidate matching `candidateId`.

## Implementation Shape

Smallest code change for a future implementation pass:

1. Preserve candidate-level semantic fields through `expandCandidate`/`summarizeVariantRuns`, or join verdict rows back to the candidate map in `run-filter.mjs`.
2. Add the semantic fields to each `rejected-ideas.jsonl` row.
3. Extend `verify-filter.mjs` to parse every rejected JSONL row and assert the required semantic fields are present and candidate-consistent.
4. Rerun `npm run validate:candidates`, `npm test`, `npm run filter`, and `npm run verify`.

## Boundary

This cron payload allowed durable outputs only in RALPH wiki/decision/automation/log files. I did not rewrite experiment source files or generated result ledgers in this micro-run. The implementation is therefore queued as `validation.strategy-filter-rejection-ledger-semantic-field-implementation`.

## Verdict

The guard is well-scoped and should be implemented before relying on `rejected-ideas.jsonl` as the anti-repackaging memory for community/operator/profile strategy intake. Numeric rejection quality is already verified; the missing protection is candidate-consistent semantic carry-through.

## Reassessment

Do not add new strategy candidates from social/community sources until this semantic ledger is active, unless the run manually checks the source candidate and rejection ledger together. Otherwise, paraphrased repeats of rejected mechanisms can slip past the JSONL ledger even when the numeric failures are correct.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, risk/sizing, TP/SL, cron cadence, or Telegram update changed.
- Started from the router/queue state and read only directly relevant strategy-filter notes and artifacts.
- Ran local statistics over `filter-report.json`, `rejected-ideas.jsonl`, and `seed-strategies.json`.
- Used no new web/source checks.
- Prior-art/wheel gate: no package install, framework setup, paid source, or custom backtest expansion was needed.
- Verify/Reassess result: exact guard fields are known; implementation remains a bounded follow-up because this cron payload restricted durable outputs.
- No Telegram notification gate met.
