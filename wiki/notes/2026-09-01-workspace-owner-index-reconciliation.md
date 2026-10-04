---
type: note
topic: workspace-owner-index-reconciliation
created: 2026-09-01T21:20:00Z
last_updated: 2026-09-01T21:20:00Z
work_item: maintenance.workspace-owner-index-reconciliation
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - automation
related:
  - ./2026-09-01-workspace-evidence-routing-map.md
  - ./2026-09-01-experiment-output-read-path-map.md
  - ./2026-09-01-legacy-trading-journal-reconciliation.md
  - ./2026-09-01-obsidian-cli-status-refresh.md
  - ../../core/navigation.md
  - ../../core/data-rails.md
  - ../../automation/retrieval-router.yaml
  - ../../../crypto-updates/README.md
  - ../../../crypto-updates/wiki/README.md
  - ../../../crypto-updates/monitor-index.yaml
  - ../../../crypto-updates/digest-index.yaml
  - ../../../crypto-updates/setup-analysis-index.yaml
  - ../../../openclaw-research-os/index.yaml
  - ../../../openclaw-research-os/wiki/overview.md
  - ../../../zela-benchmark/README.md
  - ../../../zela-benchmark/intake.md
  - ../../../zela-benchmark/review-plan.md
  - ../../../memory/2026-09-01.md
---
# Workspace Owner Index Reconciliation

## Purpose

This pass continues Tomas's approved internal workspace cleanup by checking the remaining owner indexes around RALPH instead of copying raw files into the wiki.

It reconciles where future agents should start when a question crosses `ralph-research-os/`, `crypto-updates/`, `openclaw-research-os/`, `zela-benchmark/`, root `trading-journal/`, and daily memory.

## Owner Layers

| Owner | First read | Obsidian state | RALPH route |
| --- | --- | --- | --- |
| RALPH | `ralph-research-os/index.yaml`, `core/navigation.md`, `automation/retrieval-router.yaml` | Native Obsidian-friendly project vault | Crypto research decisions, unknowns, candidates, strategy validation, and durable notes. |
| Crypto Updates | `crypto-updates/README.md`, `crypto-updates/wiki/README.md`, compact YAML indexes | Has generated Obsidian-friendly wiki pages plus compact owner indexes | Evidence source for alerts, monitor feedback, setup analysis, trading journal, digests, and orderflow runs. Link summaries; do not duplicate raw runtime rows. |
| OpenClaw Research OS | `openclaw-research-os/index.yaml`, `openclaw-research-os/wiki/overview.md` | Separate global Obsidian-friendly vault | Global workflow/source-routing memory. Keep it outside RALPH unless a global routing decision affects RALPH directly. |
| Zela Benchmark | `zela-benchmark/README.md`, `intake.md`, `review-plan.md`; then RALPH Zela case file | Source tree plus planning docs; already summarized inside RALPH | Methodology and validation discipline only. Do not revive or rerun the benchmark without explicit Tomas approval. |
| Root trading journal | `trading-journal/README.md`, then the three dated notes | Manual Markdown sidecar | Legacy August 10-11 manual trade context. Use through [[2026-09-01-legacy-trading-journal-reconciliation]]. |
| Daily memory | `memory/YYYY-MM-DD.md` | Raw continuity notes | Promote only durable RALPH decisions or routing changes into RALPH wiki/log. Do not use daily notes as source-grade evidence without checking the owning project files. |

## Current Owner Index Facts

- `crypto-updates/monitor-index.yaml` has advanced to `499` feedback records, `253` alerts sent, `245` finalized reviews, and `1` manual review. This is a live owner index, not an instruction to change thresholds.
- `crypto-updates/digest-index.yaml` remains historical only. Daily/newsletter-style briefs are disabled unless Tomas explicitly asks to resume them.
- `crypto-updates/setup-analysis-index.yaml` remains the compact read path for TA setup analysis, with `240` reviewed setups and `5` unreviewed alerts in the latest generated snapshot. Do not rerun TA/threshold work until row-count gates change.
- `openclaw-research-os/` already defines the global hub/project-vault split. Its older overview still says no active Obsidian connector was verified, but current workspace tooling status is captured in [[2026-09-01-obsidian-cli-status-refresh]] and `TOOLS.md`.
- `zela-benchmark/` root docs still describe access/context as pending. RALPH's current Zela decision is therefore the case-file route: use Zela as validation methodology, not an active benchmark revival.
- `memory/2026-09-01.md` already contains the durable day-level narrative for RALPH routing, handoffs, watch gates, and workspace cleanup. Future sessions should not mine daily memory first when an owner index exists.

## Routing Decisions

- For broad workspace cleanup, start with [[2026-09-01-workspace-evidence-routing-map]], then this owner-index note, then the owner-specific README/index.
- For Crypto Updates evidence, read owner indexes before generated wiki pages, generated wiki pages before SQLite/JSON, and raw JSONL/logs only for proof/debugging.
- For OpenClaw-wide workflow, update `openclaw-research-os/` or workspace memory first; add a RALPH note only when the decision changes crypto/RALPH routing.
- For Zela, keep `../zela-benchmark/source/` as secondary proof material behind the RALPH case file and [[2026-08-30-zela-validation-rules-extraction]].
- For daily memory, use it as continuity and cross-check, not as the first source for current evidence.

## Boundary

This is owner-index reconciliation and Obsidian hygiene only. It authorizes no scheduler/cron/systemd change, capture, scanner, collector, alert wording, threshold update, account/key/API/paid access, demo/testnet setup, live trading, live copying, order placement, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.
