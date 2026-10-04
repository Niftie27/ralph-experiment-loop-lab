---
type: source
title: AI Research OS Conventions
original_path: https://github.com/iusztinpaul/ai-research-os-workshop/blob/main/plugins/ai-research-os/skills/research/CONVENTIONS.md
raw_file: raw/ai-research-os-conventions.md
assets: []
authors: [AI Research OS workshop]
published_date: 2026-06-27
relevance_score: 1.0
ingested: 2026-07-01T06:12:00Z
last_updated: 2026-07-01T06:12:00Z
entities: []
concepts: [wiki/concepts/research-loop.md, wiki/concepts/decision-layer.md]
---

# AI Research OS Conventions

Raw source: [[raw/ai-research-os-conventions]]

## Why This Source Matters

This is the authoritative data contract for the upstream AI Research OS layout.

## Key Contract Points

- Agents read `index.md` / `index.yaml` first, then `wiki/`, then `raw/`.
- `raw/` and `raw/assets/` are immutable.
- `wiki/` is mutable synthesis.
- `index.yaml` is canonical, and `index.md` is always regenerated from it.
- `log.md` is append-only and uses `## [YYYY-MM-DD] <op> | <subject>`.
- Every claim in a wiki page that comes from a specific source should link back to a source page or raw file.
- Conversation transcripts should not be put into a research dir unless they are deliberate source material.

## RALPH Implications

The first M0 bootstrap was structurally close, but incomplete until the RALPH transcript, MEV handoff, Zela handoff, and AI Research OS docs became indexed sources. RALPH-specific navigation should live outside generated `index.md`.
