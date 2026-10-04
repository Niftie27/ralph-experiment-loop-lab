---
type: research-note
status: unknown
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../research-map.md
---

# Pre-ML Feature Label Table Spec

Date: 2026-08-22
Status: research-only, no live execution.

## Decision

RALPH can keep building the alert-feature table, but it is not ready for model training. The table is now treated as a pre-ML contract with validation gates, not as a training set.

## Contract

The generated `experiments/btc-eth-alert-edge/results/agent-swarm-feature-table.json` must validate before any model work:

- deterministic alert identity and timestamp;
- asset, direction, trigger kind, trigger label, and trigger move;
- deterministic follow/fade/noisy label from finalized review outcome;
- 1h and 4h candle context;
- 1h and 4h relative-market context;
- relative alignment and beta bucket;
- orderflow/book fields where available;
- quality flags;
- clean versus tainted row accounting.

The schema is documented at `experiments/btc-eth-alert-edge/schemas/pre-ml-feature-row.schema.json`. The validator is `npm run validate:features --prefix ralph-research-os/experiments/btc-eth-alert-edge`, and `npm run verify` now enforces it.

## Latest Validation

Fresh swarm regeneration produced:

- rows: 73;
- clean rows: 13;
- tainted rows: 60;
- feature validation: passed;
- alert-edge verifier: passed.

Top simple scouts remain weak, with the best current broad scout at roughly 42% accuracy. That supports the current block: no model training, no alert promotion, and no live implications until clean sample size and out-of-sample validation improve.

## Next Useful Loop

Do not tune a model. The next useful loop is candidate scoring/rubric dry-run or more clean row accumulation, especially post-fix book/orderflow rows.
