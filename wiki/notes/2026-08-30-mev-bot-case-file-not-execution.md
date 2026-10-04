---
type: note
topic: mev-bot-case-file-not-execution
created: 2026-08-30T09:48:00Z
last_updated: 2026-08-30T09:48:00Z
work_item: decision.mev-bot-case-file-not-execution
status: complete
scope: research-only
sources:
  - 2026-08-30-mev-bot-failure-mode-extraction.md
  - ../../case-files/mev-bot/README.md
  - ../../case-files/mev-bot/review.md
  - ../sources/mev-bot-archive.md
  - ../sources/crypto-trading-bots-project-handoff.md
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../../decisions/decisions.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
  - ../../core/profitability-flywheel.md
---
# MEV Bot Case File, Not Execution

## Decision

The historical Base MEV bot archive remains a RALPH case file and validation source. It is not an active execution workspace, live bot, deploy target, or codebase to resume.

## Rationale

The source-backed review found blockers that are disqualifying for execution-adjacent work:

- the archive is pre-patch;
- monitoring and trading are not cleanly separated;
- monitoring mode still expects signer-secret configuration;
- the event path is not end to end;
- simulation emits placeholder gas/PnL assumptions;
- seed-wallet CSV shape does not match the expected struct;
- Prometheus rules reference mismatched metrics;
- Base sequencer and Flashblocks timing weaken speed-copy assumptions.

These are useful lessons, but they do not justify startup, repair, deployment, or trading logic.

## Allowed Use

Use the archive and review to extract:

- provenance checks;
- monitor/trade boundary rules;
- schema/config/event/metric contract checks;
- simulation realism requirements;
- venue-mechanics questions;
- latency-budget falsifiers;
- examples of why execution-capable code must be audited before trust.

## Forbidden Without New Explicit Approval

- running the archive as a live or execution-capable system;
- wiring secrets, wallet keys, or exchange keys;
- fixing compose or code with the intent to deploy;
- changing monitors into trading services;
- treating the archive's strategies as candidates without new T1/T2 evidence;
- reviving Base wallet-shadowing as a speed edge without delay/fill proof.

## Queue Impact

`C-006` and `U-006` are already complete from the failure-mode extraction. This decision memo closes the remaining decision queue item and prevents future RALPH runs from reopening the archive as implementation work by accident.

## Reassess

Reopen only if Tomas explicitly asks for a fresh code audit, and even then start from source provenance plus read-only checks. Do not jump to execution repair.

## Boundaries

No live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
