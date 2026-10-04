---
type: note
topic: index-generated-navigation-split
created: 2026-08-30T09:47:00Z
last_updated: 2026-08-30T09:47:00Z
work_item: decision.index-generated-navigation-split
status: complete
scope: research-os-maintenance
sources:
  - ../../README.md
  - ../../AGENTS.md
  - ../../core/navigation.md
  - ../../core/research-os-contract.md
  - ../../core/indexing-token-budget.md
  - ../../raw/ai-research-os-conventions.md
tags:
  - ralph
  - research-note
  - automation
related:
  - ../../decisions/decisions.md
  - ../../automation/retrieval-router.yaml
  - ../../automation/work-queues.yaml
---
# Index Generated Navigation Split

## Decision

Keep `index.yaml` and `index.md` as AI Research OS catalog artifacts. Keep RALPH-specific operating navigation in `core/navigation.md`, `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, and the decision files.

## Rationale

`index.md` is generated from `index.yaml` and the wiki filesystem. It should help agents find sources and wiki pages, not carry custom operational routing that will be overwritten or silently drift.

RALPH has extra surfaces that AI Research OS does not own:

- loops;
- candidates;
- unknowns;
- decisions;
- experiments;
- active runtime maps;
- queue state;
- safety and approval boundaries.

Those belong in RALPH navigation and automation files, not the generated catalog.

## Rule

When durable RALPH routing changes:

- update `automation/retrieval-router.yaml` for compact agent routing;
- update `automation/work-queues.yaml` for task state;
- update `core/navigation.md` only when human/agent navigation categories change;
- update `decisions/decisions.md` when a durable decision changes behavior;
- update `index.yaml` and regenerated `index.md` only for source/wiki catalog metadata and new wiki-page visibility.

## Falsifier

Revisit this if RALPH gets a custom deterministic index generator that can preserve both AI Research OS source catalog semantics and RALPH operational routing without manual edits.

Until then, do not hand-place RALPH operational logic in `index.md`.

## Verification

Current local files already reflect this split:

- `README.md` says `index.md` stays generated and RALPH navigation belongs in `core/navigation.md`;
- `AGENTS.md` says to treat `index.md` as generated output;
- `core/navigation.md` states that `index.yaml` and `index.md` are source/wiki catalog artifacts;
- `automation/retrieval-router.yaml` is the compact routing layer for workers.

## Boundaries

No live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
