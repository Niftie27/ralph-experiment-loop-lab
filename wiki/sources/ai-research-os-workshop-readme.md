---
type: source
title: AI Research OS Workshop README
original_path: https://github.com/iusztinpaul/ai-research-os-workshop
raw_file: raw/ai-research-os-workshop-readme.md
assets: []
authors: [Louis-Francois Bouchard, Paul Iusztin]
published_date: 2026-06-27
relevance_score: 1.0
ingested: 2026-07-01T06:12:00Z
last_updated: 2026-07-01T06:12:00Z
entities: []
concepts: [wiki/concepts/research-loop.md]
---

# AI Research OS Workshop README

Raw source: [[raw/ai-research-os-workshop-readme]]

## Why This Source Matters

This is the upstream source for the persistent research-memory pattern RALPH is based on.

## Key Claims

- Research should persist as local markdown wiki artifacts instead of disappearing in chat.
- The core layout is `raw/`, `wiki/sources/`, `wiki/concepts/`, `wiki/entities/`, `wiki/comparisons/`, `wiki/overview.md`, `wiki/synthesis.md`, `wiki/open-questions.md`, `index.yaml`, `index.md`, and `log.md`.
- `index.yaml` is the catalog future agents read first.
- The system supports query, append, deep, and init modes.
- Deep discovery is opt-in; append mode ingests provided sources only.

## RALPH Implications

RALPH should keep AI Research OS as the source/wiki/index contract and put its decision/automation layer around that contract, not inside the generated index.
