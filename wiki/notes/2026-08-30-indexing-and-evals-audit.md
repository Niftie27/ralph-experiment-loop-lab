---
type: note
topic: indexing-and-evals-audit
created: 2026-08-30T19:47:22Z
last_updated: 2026-08-30T19:47:22Z
work_item: maintenance.indexing-and-evals-audit
status: complete
scope: research-os-maintenance
tags:
  - ralph
  - research-note
  - automation
  - audit
related:
  - ../../core/indexing-token-budget.md
  - ../../core/testing-protocol.md
  - ../../core/communication-protocol.md
  - ../../automation/retrieval-router.yaml
  - ../../automation/current-operating-map.md
  - ../../../crypto-updates/verify-setup-analysis.mjs
  - ../../experiments/btc-eth-alert-edge/src/verify-backtest.mjs
  - ../../experiments/strategy-destruction-filter/src/verify-filter.mjs
  - ../../automation/evidence-ledger-prioritizer.mjs
---
# Indexing And Evals Audit

## Question

Tomas asked whether RALPH has evals, whether indexing/databases reduce token burn, and whether the system is using its tools and loops effectively.

This pass is maintenance-only. It does not open a strategy branch.

## Answer

RALPH has partial evals.

Existing eval-like assets:

- `crypto-updates/verify-setup-analysis.mjs` checks setup-analysis/index/runtime consistency.
- `ralph-research-os/experiments/btc-eth-alert-edge/src/verify-backtest.mjs` checks alert-edge backtest and paper-state outputs.
- `ralph-research-os/experiments/strategy-destruction-filter/src/verify-filter.mjs` checks survivor/rejection invariants.
- `ralph-research-os/experiments/strategy-destruction-filter/test/engine.test.mjs` unit-tests the destruction-filter engine.
- `ralph-research-os/experiments/liquidation-q1-baseline-kill-switch/test/q1-harness.test.mjs` tests the liquidation baseline harness.
- `ralph-research-os/automation/evidence-ledger-prioritizer.mjs` ranks queued work by evidence readiness and cheap kill-test value.
- `crypto-updates/runtime/monitor-index.sqlite`, `crypto-updates/runtime/orderflow-spikes/*/*.sqlite`, `monitor-index.yaml`, `orderflow-index.yaml`, and `setup-analysis-index.yaml` act as compact query/index surfaces over larger raw event stores.

Missing evals:

- retrieval/index-budget eval;
- loop-quality eval;
- HITL-question quality eval;
- demo/paper-readiness eval;
- reusable delivery-verification eval;
- cron-health eval for consecutive failures, restarts, and timeouts.

## Indexing Read

Obsidian/wiki indexes reduce retrieval cost by helping the agent choose small file slices. They do not make reads free: once a file is loaded, its tokens still count.

SQLite helps most on raw market/runtime data because SQL can return aggregates and narrow row sets instead of dumping JSONL, Markdown logs, or full event directories.

The useful next upgrade is an index/eval maintenance branch: add tiny checks that prove router coverage, queue consistency, cron health, and paper/demo readiness before more research loops run.

## Tool And Loop Read

RALPH is using tools and loops, but unevenly:

- Good: index-first routing exists; generated indexes and SQLite stores exist; paper/backtest/filter verifiers exist; cron runs isolated jobs; bridge ingest/search is available.
- Weak: the eval layer is scattered across scripts, notes, and runtime checks instead of one explicit `researchValidationEngine` checklist.
- Weak: cron-health and context-handoff discipline are documented but not yet reusable tests.
- Weak: HITL quality is policy-driven, not measured.

## Decision

Treat evals as first-class maintenance, not optional polish. The next maintenance branch should create a small eval checklist/report, not a strategy branch.

## Boundaries

Changed: wiki/router/log/memory only. No real-money trading, orders, keys, accounts, paid services, demo/testnet setup, alert wording, thresholds, risk/sizing/TP/SL, execution behavior, scheduler changes, dependency adoption, public posting, or strategy promotion changed.
