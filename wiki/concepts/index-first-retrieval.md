---
type: concept
name: Index-First Retrieval
created: '2026-08-10T22:18:31Z'
last_updated: '2026-08-10T22:18:31Z'
related:
  - core/indexing-token-budget.md
  - automation/retrieval-router.yaml
  - core/research-os-contract.md
---

# Index-First Retrieval

Index-first retrieval is RALPH's rule for avoiding repeated expensive context loads.

The working order is:

1. Read the compact router.
2. Read `index.yaml` summaries.
3. Read the relevant wiki synthesis page.
4. Read `wiki/sources/` summaries.
5. Read `raw/` only when proof or exact detail is required.

This does not make reads free. It makes them selective. A small index still costs tokens, but it prevents the worker from rereading the entire vault, long transcripts, raw assets, or old logs.

For Obsidian, the same rule creates a usable graph: stable filenames, wikilinks, frontmatter, and generated index pages make the markdown vault navigable for humans and agents.

> Synthesis: Obsidian is the UI and local knowledge graph; `index.yaml` plus `automation/retrieval-router.yaml` is the agent-facing database layer.
