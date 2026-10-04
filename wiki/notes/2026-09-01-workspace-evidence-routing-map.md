---
type: note
topic: workspace-evidence-routing-map
created: 2026-09-01T20:37:07Z
last_updated: 2026-09-01T20:50:00Z
work_item: maintenance.workspace-evidence-routing-map
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - automation
related:
  - ../../core/navigation.md
  - ../../core/data-rails.md
  - ../../automation/retrieval-router.yaml
  - ../../decisions/unknowns.md
  - ../../../crypto-updates/wiki/README.md
  - ../../../crypto-updates/monitor-index.yaml
  - ../../../crypto-updates/orderflow-index.yaml
  - ../../../crypto-updates/setup-analysis-index.yaml
  - ../../../openclaw-research-os/index.yaml
  - ../../../zela-benchmark/intake.md
  - ../../../trading-journal/README.md
  - ./2026-09-01-legacy-trading-journal-reconciliation.md
---
# Workspace Evidence Routing Map

## Purpose

Tomas asked to continue normal internal RALPH work, walk the workspace gradually, and put or connect anything useful into the Obsidian-facing memory layer.

This pass does not ingest every file as a source. It creates the missing routing layer between the project vaults, generated Crypto Updates evidence, benchmark source trees, and RALPH's decision/wiki surface.

## Workspace Layers

| Layer | Primary path | Obsidian state | RALPH use |
| --- | --- | --- | --- |
| RALPH Research OS | `ralph-research-os/` | Native Obsidian-friendly vault with `.obsidian`, `index.yaml`, `index.md`, and `wiki/` | Main crypto research memory, queues, decisions, experiments, validation, and routing. |
| Crypto Updates | `crypto-updates/` | Has Obsidian-friendly generated wiki under `crypto-updates/wiki/` plus compact indexes | Live alert/review evidence, trading journal pages, setup-analysis summaries, orderflow capture indexes, and runtime databases. |
| OpenClaw Research OS | `openclaw-research-os/` | Separate global Obsidian-friendly research vault | Global agent/source-routing memory. Keep separate from RALPH unless a workflow/source-routing decision affects crypto research. |
| Zela Benchmark | `zela-benchmark/` | Source tree and case-file material, already summarized inside RALPH | Methodology case file. Read source docs only when the RALPH Zela case-file summary is insufficient. |
| Legacy trading journal | `trading-journal/` | Small manual Markdown journal | Historical manual notes only. Prefer `crypto-updates/wiki/trading-journal/index.md` for current execution/alert joins. |
| Continuation prompts | `continuation-prompts/` | Plain Markdown handoff files | Session continuity and compaction prevention, not source-grade research unless a handoff changes operating state. |
| Daily memory | `memory/` | Plain Markdown daily notes | Raw continuity. Promote only durable RALPH decisions into RALPH wiki or log. |

## Current Indexed Evidence

Crypto Updates is the largest "already in Obsidian but not always obvious from RALPH" surface:

- `crypto-updates/monitor-index.yaml` currently reports `497` feedback records, `251` alerts sent, `245` finalized reviews, and `1` manual review. Read it before `runtime/alert-feedback.jsonl`.
- `crypto-updates/orderflow-index.yaml` records no-key Binance/Hyperliquid orderflow capture runs. The largest BTC-only run has `855,975` records and `11,519` one-second feature rows, but the latest alignment still has `0` exact symbol/time matches with finalized alert reviews.
- `crypto-updates/wiki/README.md` defines the intended Obsidian read order: compact index first, generated wiki second, runtime JSONL/SQLite only when needed.
- `crypto-updates/setup-analysis-index.yaml` and `crypto-updates/wiki/setup-analysis/latest.md` are the TA/setup read path, with `crypto-updates/verify-setup-analysis.mjs` as the verifier.
- Root `trading-journal/` contains a few useful August manual notes, and a reconciliation pass found they are not fully represented in generated `crypto-updates/wiki/trading-journal/` pages for August 10-11. See `2026-09-01-legacy-trading-journal-reconciliation.md`.

RALPH should treat these as evidence sources already adjacent to Obsidian, not as material to blindly duplicate into `ralph-research-os/wiki/`.

## Routing Decisions

- For `U-004` public/free feed noise testing, start from `crypto-updates/monitor-index.yaml`, `crypto-updates/wiki/monitor/index.md`, and recent daily monitor pages. A valid noise test must ask whether public context later explains or filters concrete alert/review outcomes.
- For `U-038` public orderflow rail, start from `crypto-updates/orderflow-index.yaml`, `crypto-updates/wiki/orderflow/index.md`, and `crypto-updates/wiki/orderflow/replay-alignment.md`. Do not count saved captures as signal evidence until exact symbol/time overlap exists with finalized alert windows.
- For `U-027` branch-specific tool coverage, use this map plus `wiki/notes/2026-08-30-existing-tool-fit-map.md` before proposing custom code. If a workspace layer already has an index/wiki/runtime store, prefer linking and validating it over rebuilding it.
- For trade journal or execution-review work, prefer `crypto-updates/wiki/trading-journal/index.md`, but check `2026-09-01-legacy-trading-journal-reconciliation.md` for August 10-11. Use root `trading-journal/` as legacy manual context and reconcile any unique note before citing it as current evidence.
- For Zela, use `ralph-research-os/case-files/zela-benchmark/README.md` and `wiki/notes/2026-08-30-zela-validation-rules-extraction.md` first. Only read `../zela-benchmark/source/` when a methodology detail is missing.
- For OpenClaw-wide workflow or memory routing, use `../openclaw-research-os/index.yaml` first and keep global notes out of RALPH unless they affect RALPH routing directly.

## Do Not Duplicate

Do not copy large runtime files, generated alert pages, raw JSONL, SQLite databases, or source trees into RALPH wiki. Preserve source-of-truth layers:

- raw and runtime data stay in their owning directories;
- compact summaries and durable decisions go into RALPH wiki/notes;
- RALPH router points to the owning index/read path;
- bridge ingest is for important RALPH notes, not every generated alert page.

## Next Micro-Actions

1. Add a `workspace_evidence_routing` hot topic to the RALPH retrieval router.
2. Link this note from `core/navigation.md` and `core/data-rails.md`.
3. Narrow `U-004`, `U-027`, and `U-038` to use the workspace evidence map as the first read path.
4. Run RALPH validation and bridge-search verification.

## Boundary

This is routing and Obsidian hygiene only. It authorizes no new capture, scanner, collector, scheduler, cron, systemd, alert wording, thresholds, account, key, paid service, API use, demo/testnet setup, live trading, live copying, orders, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.
