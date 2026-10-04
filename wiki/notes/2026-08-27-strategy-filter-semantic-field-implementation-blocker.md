---
type: note
created: 2026-08-27T21:33:25Z
topic: strategy-destruction-filter
status: internal
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
related:
  - ../concepts/strategy-destruction-filter.md
  - 2026-08-27-strategy-filter-rejection-ledger-schema-guard.md
sources:
  - ../../experiments/strategy-destruction-filter/results/rejected-ideas.jsonl
  - ../../experiments/strategy-destruction-filter/results/filter-report.json
  - ../../experiments/strategy-destruction-filter/candidates/seed-strategies.json
---
# Strategy Filter Semantic Field Implementation Blocker

Bounded work item: `validation.strategy-filter-rejection-ledger-semantic-field-implementation`.

## Question

Can the queued semantic-field implementation be completed inside the current cron durable-output boundary?

## Result

No. The implementation requires edits outside the payload's allowed durable-output set:

- update the experiment source that writes `results/rejected-ideas.jsonl`;
- regenerate `results/rejected-ideas.jsonl` through the strategy filter run;
- extend the verifier so rejected rows must carry candidate-consistent semantic fields.

The current cron payload allowed durable outputs only under wiki notes/sources, decisions, automation state/router/queues, and `log.md`. I therefore did not rewrite experiment source files or generated result ledgers in this run.

## Carry-Forward Contract

When a future run is explicitly allowed to edit experiment source/result files, the smallest implementation remains:

1. Join each rejected verdict row back to the candidate matching `candidateId`.
2. Write `idea`, `thesis`, `dataRequirements`, and `validation` into every rejected JSONL row.
3. Add verifier assertions that every rejected row has the semantic fields required by `2026-08-27-strategy-filter-rejection-ledger-schema-guard.md`.
4. Rerun `validate:candidates`, `test`, `filter`, and `verify` for the strategy-destruction-filter harness.

## Reassessment

This is a scope blocker, not a technical blocker. The prior schema-guard note already proves candidate specs contain the needed fields and the current ledger omits them. Until source/result edits are allowed, keep `validation.strategy-filter-rejection-ledger-semantic-field-implementation` pending and avoid treating `rejected-ideas.jsonl` as a complete anti-repackaging memory for text-first strategy intake.

## Self-Check

- Stayed research-only; no live execution, orders, wallet keys, exchange keys, paid APIs, account setup, public posting, alert wording, risk/sizing, TP/SL, cron cadence, or Telegram update changed.
- Started from the router/queue state and read only directly relevant strategy-filter notes/artifacts.
- Used no new web/source checks.
- Prior-art/wheel gate: no framework, package, paid source, custom backtest expansion, or data-collection expansion was needed.
- Verify/Reassess result: exact next implementation is known, but this run could not make the required experiment source/result edits under the durable-output boundary.
- No Telegram notification gate met; this is not yet a repeated blocker after three runs.
