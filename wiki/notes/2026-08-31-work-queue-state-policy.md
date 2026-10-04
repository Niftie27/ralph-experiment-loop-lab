---
type: note
topic: work-queue-state-policy
created: 2026-08-31T21:28:00Z
last_updated: 2026-08-31T21:28:00Z
work_item: unknowns.U-007
status: done
scope: queue-routing-policy
tags:
  - ralph
  - research-note
  - automation
related:
  - ../../automation/work-queues.yaml
  - ../../automation/evidence-ledger-prioritizer.mjs
  - ../../outputs/evidence-ledger-prioritizer.md
  - ../../core/decision-framework.md
  - ../../core/loop-output-policy.md
  - ../../core/profitability-flywheel.md
---
# Work Queue State Policy

## Purpose

Resolve U-007 for the current RALPH phase: work queues should promote, block, watch, and discard items by evidence state, not by how interesting the idea sounds.

The queue is a router. It is not a promise to execute everything in order, and it does not authorize work across approval gates.

## Queue States

- `pending`: a bounded item that may be selected when it has a clear next action and stays inside current approval scope.
- `active`: exactly one item currently being worked. It should return to `pending`, `done`, `watch`, `blocked`, or a follow-up item before the run ends.
- `done`: the bounded item produced a durable artifact or explicit no-op decision. Done does not mean the larger topic is solved.
- `watch`: interesting but not spend-worthy until a concrete threshold, access approval, source, row count, or market event changes.
- `blocked`: cannot progress without a specific missing input, tool, account, key, paid plan, source, dataset, or Tomas approval.
- `discarded`: rejected for current constraints. Keep the reason and revisit trigger in `decisions/discarded.md`.

## Promotion Rules

Promote `watch -> pending` only when a named trigger fires:

- row-count threshold reached;
- approved access/export/API sample exists;
- exact source or replay overlap becomes available;
- Tomas sends a precise new feedback item;
- a prior branch creates a required prerequisite artifact.

Promote `pending -> active` only when:

- context is safely below the handoff threshold;
- the item is the single selected branch;
- the first step is a wheel gate, access classification, or cheapest falsifier;
- the branch does not silently cross live-alert, scheduler, account, key, paid-service, sizing, TP/SL, execution, public-posting, or strategy-promotion gates.

Promote `candidate/watch -> paper-qualified proposal` only through the Profitability Flywheel evidence gates. Queue movement alone cannot promote a strategy.

## Blocking And Watch Rules

Use `watch`, not `pending`, when the next action is "wait until enough rows exist" or "wait for a source/access approval." Use `blocked` when the required blocker is specific and current work cannot produce a useful proxy.

Current examples:

- TA candidate recheck stays threshold-watch until largest call bucket reaches 20 reviewed rows.
- AVAX range-breakdown recheck stays threshold-watch until exact forward paper rows reach 20.
- HYPE L2 absorption stays watch-only until Tomas approves capture/replay or existing exact HYPE overlap rows exist.
- Arkham/Nansen/Dune-style source work stays approval-gated until a tiny approved access/export sample exists.

## Discard Rules

Discard when a bounded test fails its current gate, even if the larger topic remains interesting.

Required discard fields:

- date;
- item;
- reason;
- evidence;
- revisit trigger.

Example: HYPE event-only velocity follow/fade is discarded as a strategy rule, while HYPE L2 absorption remains watch-only as a separate possible falsifier.

## Prioritizer Output Contract

`outputs/evidence-ledger-prioritizer.md` should always expose:

- ready-now routes;
- threshold-watch routes;
- top needs-wheel-gate routes;
- counts for pending, ready-now, threshold-watch, and needs-wheel-gate.

This prevents invisible overload: a pile of unknowns should appear as gated work needing conversion into one falsifiable artifact, not as a silent backlog pretending to be ready.

## Decision

U-007 is resolved for the current no-key/A2 research phase. Future changes should update this policy if RALPH gains approved account/API/demo/scheduler capabilities.
