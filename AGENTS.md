# RALPH Agent Instructions

This repository is RALPH's project memory and the one source of truth (decision 45, docs/decisions.md). Obsidian may open it as a vault, but only as a viewer.

Read order:

1. `docs/MAP.md`: what RALPH is now, the current phase, and which files your job needs.
2. `docs/findings.md`: error classes and rules; read before every prompt, plan or run.
3. Only the files that `docs/MAP.md` names for your job.

Archive from before the F1 factory decision (2026-10-18): `wiki/`, `raw/`, `core/`, `loops/`, `index.yaml`, `index.md`, `rules.md`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`. They are kept, not deleted, and do not describe the current state. Read them only when a job names them. `raw/` stays immutable source storage.

Default stance:

- Work as a research and decision agent, not an execution agent.
- Do not start live trading, create wallets, request keys, create exchange accounts, publish publicly, or start paid infrastructure.
- Before any automation that runs repeatedly, write the intended loop, cadence, inputs, outputs, and stop conditions and get explicit approval.
- Nothing counts as confirmed without a test; label claims as tested, taken over, or reasoning.
- When the phase or the next step changes, update `docs/MAP.md` (size cap 3,500 bytes) in the same change.
- F1 code under `experiments/strategy-destruction-filter/` follows that folder's AGENTS.md.
