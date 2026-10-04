# RALPH Agent Instructions

This directory is the RALPH Research OS workspace.

Read order:

1. `automation/retrieval-router.yaml`
2. `index.yaml`
3. `index.md` only when the Obsidian/wiki page list is useful
4. `wiki/overview.md` or `wiki/synthesis.md` only when needed
5. `rules.md`
6. `core/navigation.md`
7. Relevant `loops/`, `decisions/`, `case-files/`, `automation/`, and `experiments/`

Do not bulk-read `raw/` unless the wiki layer is insufficient. `raw/` is immutable source storage.

Reading indexes still costs tokens. The point is to spend a small number of tokens to select the right few files, not to reread the vault. Follow `core/indexing-token-budget.md`.

Default stance:

- Work as a research and decision agent, not an execution agent.
- Collect evidence, update summaries, identify unknowns, propose candidates, and draft decision memos.
- Do not start live trading, create wallets, request keys, create exchange accounts, publish publicly, or start paid infrastructure.
- Before any automation that runs repeatedly, write the intended loop, cadence, inputs, outputs, and stop conditions under `automation/` and get explicit approval.
- Treat `index.md` as generated output. Put RALPH-specific navigation in `core/navigation.md`.
- Strategy discovery comes before trading-bot architecture. Read `core/operating-thesis.md` and `core/milestones.md` before proposing system design.
- Use `core/input-output-flow.md` to classify user inputs, media, links, repos, local files, and loop outputs before saving anything.
- Use `core/loop-output-policy.md` to decide whether a loop output belongs in queues, wiki notes, source intake, or decisions.
- Update the smallest relevant index after durable changes: `automation/retrieval-router.yaml` for active routing, `index.yaml` and regenerated `index.md` for source-grade additions, and the relevant decision/queue files for active work.
