# RALPH Research OS

RALPH is a general crypto bot lab and market-structure research OS for DeFi, MEV, benchmarks, data rails, watcher/automation loops, demo-sim and paper-trading experiments, strategy filters, orderflow/backtest tooling, candidate decisions, and research memory.

It is not a trading bot. It does not run live trading, hold wallet keys, use exchange accounts, or start paid infrastructure by default.

The workspace follows the AI Research OS v4 shape: `index.yaml` and `index.md` are the catalog, `wiki/` is the mutable synthesis layer, and `raw/` is immutable source storage.

RALPH adds a decision layer: loops, unknowns, candidates, experiments, case files, rules, and decision memos.

For RALPH-specific navigation, use `core/navigation.md`. `index.md` stays generated from `index.yaml`.

Current operating thesis: strategy discovery comes before bot architecture. See `core/operating-thesis.md`.

AI Research OS workshop skills are installed locally in `.claude/skills/`; setup details are in `core/ai-research-os-setup.md`.

## GitHub Publish Boundary

This repository is meant to publish the RALPH source code, Markdown research memory, schemas, small configs, and compact generated reports. It deliberately does not publish heavyweight local caches, runtime state, credentials, or local editor/app files.

Intentionally local / not pushed:

- `experiments/**/data/`, including the large Binance USD-M futures trade cache under `experiments/btc-eth-alert-edge/data/binance-usdm-archive-cache/`. That cache is about 17 GB locally and consists mostly of regenerated public trade CSV extracts.
- Experiment cache, temp, and runtime folders such as `experiments/**/cache/`, `experiments/**/.cache/`, `experiments/**/tmp/`, and `experiments/**/runtime/`.
- Named market-data cache folders such as `binance-usdm-archive-cache/`, `market-cache/`, `aggtrades-cache/`, and `planned-level-aggtrades-cache/`.
- Dependency, build, and test-output folders such as `node_modules/`, virtualenvs, `dist/`, `build/`, `coverage/`, `.pytest_cache/`, and `__pycache__/`.
- Local Obsidian/editor state such as `.obsidian/` and `.DS_Store`.
- Secrets and credential-like files, including `.env*`, private keys, cookies, sessions, and files with secret/credential naming.
- Bulky archived source assets under `raw/assets/` such as `.tar`, `.tar.gz`, `.zip`, and `.ogg` files.

If a future experiment needs a dataset that cannot be regenerated from public sources, keep only a manifest, provenance notes, schema, and small sample in Git. Store the full dataset out-of-band and document the retrieval path before relying on it.
