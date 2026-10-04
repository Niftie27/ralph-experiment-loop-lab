---
type: comparison
name: RALPH M0 vs AI Research OS Contract
sources:
  - wiki/sources/ai-research-os-conventions.md
  - wiki/sources/ralph-session-transcript-structured.md
  - wiki/sources/crypto-trading-bots-project-handoff.md
related:
  - core/research-os-contract.md
  - core/navigation.md
  - automation/work-queues.yaml
created: 2026-07-01T06:12:00Z
last_updated: 2026-07-01T06:12:00Z
---

# RALPH M0 vs AI Research OS Contract

## Verdict

The first RALPH M0 bootstrap had the right direction, but it was too much of a skeleton. It created folders and loop names before fully ingesting the primary sources that justify them.

## What Was Correct

- It used the v4 layout: `index.yaml`, `index.md`, `raw/`, `wiki/`, and `log.md`.
- It kept RALPH separate from Zela, MEV bot, Job Hunt, and Polymarket.
- It added a decision layer that AI Research OS does not provide by default.
- It kept the hard safety stance: no live trading, no keys, no exchange accounts, no paid infra, no public publishing.

## What Was Weak

- `total_sources: 0` meant future agents had no canonical source graph.
- `index.md` was hand-written as a full RALPH navigation page, but AI Research OS expects it to be regenerated from `index.yaml`.
- The MEV bot case file was too shallow compared with the actual handoff and archive.
- Candidate promotion rules were not concrete enough.
- The automation state had loop names but not a real work queue.
- Source citation discipline was not yet enforceable because source pages were missing.

## Implemented Corrections

- Primary sources were copied into `raw/` or `raw/assets/`.
- Per-source summaries were added under `wiki/sources/`.
- `index.yaml` now indexes the primary sources.
- `index.md` is regenerated with the upstream `build_index_md.py` script.
- RALPH-specific navigation moved to `core/navigation.md`.
- Candidate scoring was added to `core/candidate-scoring.md`.
- Work queues were added to `automation/work-queues.yaml`.
- MEV bot case file was expanded with source-backed blockers and non-execution stance.

> Synthesis: RALPH should be AI Research OS at the memory layer and a stricter decision OS above it. The more autonomous RALPH becomes, the more important it is that source intake and decision thresholds are machine-readable before any recurring loop runs.

