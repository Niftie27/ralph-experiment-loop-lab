---
type: research-note
date: 2026-08-26
tags:
  - ralph
  - shadow-pnl
  - autoresearch
  - obsidian
  - self-improvement
related:
  - 2026-08-26-wick-alert-feedback-event-study.md
  - 2026-08-26-velocity-replay-adapter-feasibility.md
  - ../../automation/ralph-autoresearch-loop.md
  - ../../loops/self-improvement-loop.md
sources:
  - ../../experiments/strategy-destruction-filter/results/shadow-pnl-ledger.json
  - ../../../crypto-updates/runtime/alert-feedback.jsonl
---

# Shadow PnL Ledger And Autoresearch Hardening

Status: research-only loop hardening. No live trading, orders, exchange keys, wallet keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution behavior changed.

## Question

Can the RALPH loop reduce HITL by automatically turning tradable alert plans into a conservative shadow PnL ledger and by making Obsidian and self-improvement explicit parts of the workflow?

## Result

Implemented `npm run ledger:shadow-pnl` under `experiments/strategy-destruction-filter`.

The ledger consumes finalized local alert feedback where the watcher emitted a tradable `fadePlan`. It records fill status from `entryResearch.live2m`, applies the plan's TP/SL lines, and uses a conservative stop-first assumption when the reviewed min/max range contains both target and stop. Time exits use the alert-time 30m checkpoint as an approximation.

This is not execution-grade replay. It excludes fees, slippage, queue position, latency, exchange constraints, and exact fill-time path ordering.

## Shadow PnL Read

Latest ledger:

- tradable plans: `72`
- filled: `56`
- target hits: `20`
- stop hits: `19`
- ambiguous stop-first outcomes: `17`
- time exits: `0`
- gross PnL before fees/slippage: `-1200` USD
- filled win rate: `0.3571`
- decision: `shadow_negative_or_unproven`

Interpretation: current tradable alert wording is not supported by conservative shadow accounting. The result is useful as a kill/watch input, not as a promotion input.

## Obsidian In The Loop

Obsidian is present as the knowledge and review layer, not the backtest engine.

Loop placement:

1. experiment scripts produce machine-readable JSON and short Markdown;
2. durable notes under `wiki/notes/` summarize results;
3. `openclaw wiki ingest` publishes selected notes into the OpenClaw bridge wiki;
4. Obsidian renders and searches that bridge wiki for human review and future retrieval.

## Automatic Self-Improvement

Self-improvement is allowed when it makes the system harder to fool:

- tighten gates;
- add validation checks;
- add data-quality flags;
- add shadow ledgers or scorecards;
- improve queue prioritization;
- improve Obsidian/wiki retrieval links;
- remember repeated failures so they are not repackaged.

Self-improvement must ask Tomas before:

- loosening gates;
- promoting to paper/live;
- changing watcher wording, thresholds, sizing, risk, TP/SL, cron cadence, or execution;
- adding paid data, credentials, exchange accounts, wallet access, or new recurring automation.

## Decision

The loop can be more autonomous for research, but not for promotion. Recommended operating shape:

`watch bucket -> autoresearch -> cheapest kill test -> shadow/replay/backtest -> discard/watch/propose -> HITL only for candidate/paper/live changes`

## Verification

Passed:

- `npm run ledger:shadow-pnl --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm run validate:candidates --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`
