# Research OS Contract

RALPH follows the AI Research OS v4 contract with RALPH-specific extensions.

## Base Contract

- `index.yaml` is canonical.
- `index.md` is generated from `index.yaml`.
- `log.md` is append-only.
- `raw/` is immutable.
- `wiki/` is mutable synthesis.
- Agents read index first, wiki second, raw third.
- Reads are not free: agents use indexes to select the smallest relevant context, then stop drilling once the question is answered.

## RALPH Extensions

- `loops/` defines recurring research processes.
- `decisions/` tracks unknowns, candidates, decisions, and discards.
- `experiments/` tracks validation work.
- `case-files/` isolates domain-specific histories.
- `core/` stores operating model, rules, capability maps, and automation policy.
- `automation/` stores runbooks and state for approved recurring runs.
- `automation/retrieval-router.yaml` stores a compact active-work map for token-budgeted scheduled workers.
- `core/navigation.md` stores RALPH-specific navigation that should not be hand-added to generated `index.md`.
- `core/indexing-token-budget.md` defines the retrieval/read budget and index-update rules.
- `.claude/skills/` stores the local AI Research OS workshop skills used by this workspace.
