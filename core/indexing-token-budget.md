# Indexing And Token Budget

Status: active retrieval contract for RALPH loops.

## Principle

Every byte read into the model costs context tokens. Reading an index is not free, but a compact index is cheap compared with rereading full notes, raw transcripts, repo dumps, or logs.

RALPH should behave like an indexed research system:

1. Read a small router.
2. Read the canonical catalog.
3. Read only the relevant synthesis pages.
4. Read source summaries before raw sources.
5. Read raw/full material only when the claim needs proof, exact detail, or a fresh extraction.

## Retrieval Layers

Use this order by default:

1. `automation/retrieval-router.yaml` - smallest active map for recurring workers.
2. `index.yaml` - canonical source catalog and source summaries.
3. `core/navigation.md` - operating map and current next-run guidance.
4. `wiki/overview.md`, `wiki/synthesis.md`, relevant `wiki/concepts/`, `wiki/comparisons/`, `wiki/entities/`, and `wiki/notes/`.
5. `wiki/sources/<slug>.md` - source-level executive summaries.
6. `raw/<slug>.md` or `raw/assets/` - immutable full source material.

Stop at the first layer that answers the question.

## Read Budget Defaults

For recurring autoresearch runs:

- Startup: read at most the router, `index.yaml`, `automation/work-queues.yaml`, `automation/loop-state.yaml`, `automation/ralph-autoresearch-loop.md`, and one selected loop file.
- Selection: prefer `rg` against paths/tags/headings before opening files.
- Drill-down: open at most 3-5 wiki/source pages for a normal bounded run.
- Raw: do not open raw transcripts or assets unless the selected work item explicitly needs source verification.
- Logs: read `tail`, not the full log, unless reconstructing history.

If the run needs to exceed this budget, record why in `log.md`.

## Write Budget Defaults

Every durable output must update the smallest useful index:

- New source-grade input: update `raw/`, `wiki/sources/`, `index.yaml`, regenerate `index.md`, and append `log.md`.
- New reusable synthesis: update or create the relevant wiki page and ensure it appears through `index.md` regeneration or `automation/retrieval-router.yaml`.
- New active loop/runbook/queue change: update `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, and `log.md`.
- New decision/candidate/unknown: update the decision file and, if it affects active routing, `automation/retrieval-router.yaml`.

Do not duplicate full summaries across multiple files. Store the substance once and link to it.

## Obsidian Role

Obsidian is the human UI and markdown knowledge graph. It is not automatically a zero-token database for the model.

For RALPH, Obsidian works as a practical database when files keep:

- stable filenames
- frontmatter
- wikilinks
- small index/router files
- source summaries separate from raw sources

If Obsidian CLI or bridge becomes available, use it for search/open/navigation, but keep the file-based index contract because scheduled workers must also run without the app.

## Self-Check

Before ending a loop, verify:

- did I start from router/index rather than broad file reads?
- did I stop reading when the answer was sufficient?
- did any new durable output update the relevant index?
- did I avoid copying large raw text into summaries?
- did I keep the next worker's startup path cheap?
