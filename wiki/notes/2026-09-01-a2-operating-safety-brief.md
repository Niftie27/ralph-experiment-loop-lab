---
type: note
topic: a2-operating-safety-brief
created: 2026-09-01T05:08:06Z
last_updated: 2026-09-01T05:08:06Z
work_item: unknowns.U-011
status: done
scope: operating-safety
sources:
  - ../../automation/ralph-autoresearch-loop.md
  - ../../automation/a2-research-engine-runbook.md
  - ../../automation/current-operating-map.md
  - ../../automation/work-queues.yaml
  - ../../automation/loop-state.yaml
  - 2026-08-31-work-queue-state-policy.md
  - ../../outputs/evidence-ledger-prioritizer.md
  - ../../outputs/research-validation-checklist.md
tags:
  - ralph
  - research-note
  - automation
related:
  - ../../decisions/unknowns.md
  - ../../core/profitability-flywheel.md
  - ../../core/loop-output-policy.md
  - ../../core/indexing-token-budget.md
---
# A2 Operating Safety Brief

## Purpose

Resolve `U-011` for the current A2/no-key phase: define which recurring or background loop shapes can safely run without producing slop, and where RALPH must wait for row thresholds, named triggers, access approval, or human judgment.

This is a safety and routing brief only. It does not create or modify cron, systemd, schedulers, alerts, thresholds, accounts, keys, paid services, demo/testnet accounts, live trading, sizing, TP/SL, execution behavior, public posting, wallet-shadow capture, or strategy promotion.

## Classification

| Loop shape | State | Allowed next action | Anti-slop gate |
| --- | --- | --- | --- |
| `ralph-autoresearch-loop` | Active, approved | One isolated bounded research item on the approved cadence. | Select exactly one queue item; use router/index first; output at most one durable note plus minimal state updates; self-verify before exit. |
| `ralph-weekly-maintenance` | Active, approved | Queue/index/tool-health/context hygiene and cheap verifier refresh. | Maintenance only; no strategy branch unless Tomas explicitly asks; no scheduler or live-surface mutation. |
| `liquid-crypto-alert-edge-backtest` | Active, paper-only | Refresh existing local alert-edge experiment outputs. | Delivery `none`; no live execution, alert wording, threshold, risk, sizing, TP/SL, or order behavior changes. |
| `crypto-updates-market-watcher.service` | Active, observation/alerting | Keep observing market moves and writing local feedback. | Not a strategy promotion engine; watcher noise requires enough finalized rows before any wording or threshold proposal. |
| Read-only execution reactor | Active, monitor-only | Observe existing execution metadata where already configured. | No order placement and no execution behavior changes. |
| Dormant loop playbooks under `loops/` | Watch | May be selected by an active approved loop or manual request as one bounded item. | Playbook files are not schedules; do not treat them as active jobs. |
| TA/AVAX threshold rechecks | Watch until threshold | Recheck only after row counts change. | TA largest call bucket must reach 20 reviewed rows; AVAX exact forward rows must reach 20. |
| HYPE L2 absorption capture/replay | Blocked / HITL | Wait for explicit Tomas approval or existing exact overlap rows. | No collector, replay job, scheduler, alert change, threshold, account, key, paid feed, or strategy status change from queue interest alone. |
| Wallet-shadow frozen event-ledger capture/scanner | Blocked / HITL | Wait for Tomas selection or a named trigger/event row, then draft a tiny proposal. | Must use frozen source-timestamped rows; no scanner/capture run without approval. |
| Nansen/Dune/Arkham/0xArchive/CoinGlass source tests | Blocked / HITL | Only a tiny approved sample for a named surviving question. | Verify workspace access, cost, license/terms, row coverage, freshness, export/API route, and stop condition before treating source as active. |
| Demo/testnet/live trading or execution-capable bots | Blocked / HITL | Separate explicit approval, after paper/demo readiness exists. | Mandatory paper/demo evidence first; no keys, accounts, sizing, TP/SL, execution, public posting, or strategy promotion by automation. |

## Notification Thresholds

Normal A2 output stays internal. Notify Tomas only when at least one condition is true:

- a candidate reaches a real promotion gate and needs human go/no-go;
- a high-value unknown cannot progress without Tomas's judgment;
- the same blocker repeats for 3 consecutive runs;
- a market event creates a timely research sample worth capturing;
- a concrete alert-worthy setup or urgent event needs attention;
- Tomas explicitly asks for the output.

For delivery-sensitive messages, visible source-chat delivery must be verified before claiming Tomas saw it.

## Stop Conditions

Stop the current loop and write a blocker or handoff when:

- context reaches the 60% handoff threshold before another substantial pass;
- the selected branch needs account/key/paid/source approval;
- row thresholds are not met and no proxy test can change that;
- the run is about to expand into a scanner, scheduler, collector, live alert, execution, or account setup;
- verifier output remains ambiguous after one retest and one lateral check;
- the branch would produce only generic summaries without a falsifiable state change.

Timeout-prone recurring runs should split the item smaller before the next run.

## Required Verifiers

Every A2 recurring or manual loop should verify:

- queue state has no hidden active item and only one selected branch;
- current output updates the smallest appropriate files;
- no forbidden boundary changed;
- any durable note under `wiki/notes/` or `wiki/sources/` is bridge-ingested and search-verified;
- `research-validation-checklist` and `evidence-ledger-prioritizer` are rerun when queue/index/output state changes;
- threshold-watch items are not rerun before the row count changes;
- access-gated sources are classified as blocked/HITL until usable workspace access is approved and verified.

## Decision

`U-011` is resolved for the current A2/no-key phase.

Safe A2 automation is narrow: approved recurring jobs may maintain indexes, run one bounded research item, refresh local paper-only experiment state, and record evidence. They must not broaden into market newsletters, vague strategy inspiration, scanner construction, paid/keyed source use, live alert tuning, demo/testnet setup, or execution behavior.

The immediate queue implication is unchanged: no ready-now routes exist, TA/AVAX stay threshold-watch, and the next useful manual branch must choose one remaining `needs-wheel-gate` unknown or wait for a named trigger.

## Boundary Delta

Changed: wiki/router/queue/state/log/index/memory only.

Boundary delta: no scheduler, cron, systemd, alert, threshold, account, key, paid service, API use, collector, scanner, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.
