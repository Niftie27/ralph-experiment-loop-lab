---
type: note
topic: research-validation-checklist
created: 2026-08-30T20:00:12Z
last_updated: 2026-08-31T01:12:00Z
work_item: maintenance.research-validation-checklist
status: active
scope: research-os-maintenance
tags:
  - ralph
  - research-note
  - automation
  - audit
related:
  - 2026-08-30-indexing-and-evals-audit.md
  - ../../core/testing-protocol.md
  - ../../core/indexing-token-budget.md
  - ../../core/communication-protocol.md
  - ../../automation/retrieval-router.yaml
  - ../../automation/work-queues.yaml
  - ../../automation/loop-state.yaml
  - ../../automation/current-operating-map.md
  - ../../automation/research-validation-checklist.mjs
  - ../../outputs/research-validation-checklist.md
---
# Research Validation Checklist

Purpose: make RALPH evals visible as one maintenance surface. Run this before broad research expansion, after scheduler failures, and during weekly maintenance.

This checklist does not promote strategies. It only judges whether RALPH is safe to keep looping, whether retrieval is narrow enough, and whether paper/demo evidence is ready for a next-stage decision.

Local report command:

```bash
node ralph-research-os/automation/research-validation-checklist.mjs
```

## Quick Verdict Fields

Each maintenance pass should write these fields in the note, log entry, or final summary:

- `retrieval`: pass / warn / fail
- `pathRefs`: pass / warn / fail
- `queues`: pass / warn / fail
- `cron`: pass / warn / fail
- `delivery`: pass / warn / fail / not-applicable
- `hitlQuality`: pass / warn / fail
- `loopQuality`: pass / warn / fail
- `handoffReadiness`: pass / warn / fail
- `paperDemo`: pass / warn / fail / not-ready
- `boundaryDelta`: none / docs-router-only / needs-HITL / blocked

## Checks

| Check | Pass condition | Warn/fail condition | Current first test |
| --- | --- | --- | --- |
| Retrieval/index budget | `retrieval-router.yaml` names the active topic and a small read set; `index.yaml` count matches wiki files. | Broad vault scan, raw dump, stale count, missing hot-topic route. | `indexing_and_evals` route exists; count `148/148` after the cron HITL note. |
| Path references | Simple local path values in `index.yaml` and `retrieval-router.yaml` resolve, excluding intentional directories and wildcards. | Missing routed note/source/output, stale index reference, or broken simple path after a move. | `334` simple local path refs checked, `0` missing. |
| Queue consistency | `work-queues.yaml` and `loop-state.yaml` do not contradict done/pending/active state for the selected item. | Same item pending and done, stale active lane, unresolved queue item already closed in decisions. | Weekly maintenance must inspect selected lane only unless a contradiction appears. |
| Cron health | Active RALPH jobs are enabled intentionally; consecutive errors/timeouts are known, bounded, routed, and counted from local state. | Unexplained disabled job, repeated timeout with no note, delivery mode drift, unexpected scheduler mutation. | `ralph-weekly-maintenance` enabled; `ralph-autoresearch-loop` has 2 timeout/gateway-restart errors. |
| Delivery verification | Any promised user-facing alert/brief/message has visible delivery evidence or is marked unverified. | Treating accepted/pending/cron success as proof Tomas saw it. | Normal maintenance uses delivery none; visible messages require source-chat verification when promised. |
| HITL quality | Approval asks exist only after a concrete likely-useful blocker and name the exact permitted mutation plus excluded sensitive surfaces. | Broad asks, missing boundary terms, premature account/key/paid/scheduler requests, or no exact copyable approval text. | Scheduler remediation HITL ask exists and is narrow. |
| Loop quality | Autoresearch runbook preserves isolated sessions, exactly one bounded item, narrow reads, stop-early timeout behavior, bridge ingest/search, and sensitive-surface exclusions. | Broad loop contract, missing stop condition, no verification route, or ambiguous mutation authority. | Autoresearch loop contract has bounded-run and verification guardrails. |
| Handoff readiness | Communication protocol names the 60-70% handoff rule and the latest RALPH continuation prompt is selected by file mtime, not filename sorting. | Missing protocol rule, missing continuation prompt, or stale handoff selected because filenames sort oddly. | Latest RALPH handoff is `2026-08-30-2110-ralph-cron-hitl-maintenance-handoff.md`. |
| Paper/demo readiness | Candidate has T2 plus matching T3 paper rows, frozen assumptions, cost/slippage model, and a decision memo before demo/testnet discussion. | Historical-only survivor, missing forward paper, mixed evaluation buckets, or demo/testnet account/key need without HITL. | AVAX range breakdown remains Watch because exact forward-paper rows are below threshold. |
| Boundary delta | Summary names only changed surfaces. | Generic safety boilerplate or silent live/paid/key/scheduler surface change. | Use `Changed: ...` and `Boundary delta: ...` from `communication-protocol.md`. |

## Maintenance Output Shape

Use this compact shape:

```text
Validation: retrieval pass, pathRefs pass, queues pass, cron warn, delivery n/a, hitlQuality pass, loopQuality pass, handoffReadiness pass, paperDemo not-ready.
Changed: wiki/router/log/memory only.
Boundary delta: docs-router-only.
Next: fix cron timeout before expanding strategy work.
```

## Promotion Rule

No strategy candidate moves beyond Watch because this checklist passes. Passing means the research-validation engine is coherent enough to continue. Candidate promotion still requires the staged testing protocol in `core/testing-protocol.md`, including forward paper/demo evidence where relevant.
