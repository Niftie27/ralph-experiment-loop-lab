# Experiments

Experiments are validation work. They test claims before prototypes.

States:

- `planned`
- `active`
- `completed`
- `blocked`
- `discarded`

Use templates from `experiments/templates/`.

## Active

- `strategy-destruction-filter`: research-only strategy survival filter. Turns explicit strategy specs into backtests, realistic-cost statistics, failure slices, deflated-Sharpe-proxy scoring, rejected idea logs, and survivor artifacts. No live execution.
- `btc-eth-alert-edge`: paper-only liquid-crypto alert edge backtest and forward-paper support.
- `volume-velocity-dex-discrepancy`: read-only DEX quote latency/stale-state measurement for same-chain discrepancy survival. No keys, orders, paid infra, or execution.

## Read Order

1. `../outputs/evidence-ledger-prioritizer.md`
2. `../outputs/research-validation-checklist.md`
3. this file
4. the selected experiment `README.md`
5. the selected experiment `results/*.md`
6. matching `results/*.json` only when row-level fields are needed
7. source code/tests only when debugging or changing the experiment

See `../wiki/notes/2026-09-01-experiment-output-read-path-map.md` for the current Obsidian-facing routing map.

## Experiment Surfaces

- `btc-eth-alert-edge`: use `results/edge-summary.md`, `results/paper-dashboard.md`, and `results/live-ta-execution-journal.md` before raw `paper/signals.json`.
- `strategy-destruction-filter`: use `results/filter-report.md`, `results/shadow-pnl-ledger.md`, and `results/feature-study.md` before raw JSON/JSONL.
- `volume-velocity-dex-discrepancy`: use `results/e2e-latency-summary.md` before raw `results/e2e-latency-samples.jsonl`.
- `copytrading-address-intake`: use the Markdown result ledgers first; current wallet-shadow work is Watch/named-trigger only.
- `liquidation-q1-baseline-kill-switch`: current Q1 branch is discarded; reuse only as a validation pattern unless Tomas explicitly reopens it.
