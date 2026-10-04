---
type: note
topic: experiment-output-read-path-map
created: 2026-09-01T20:45:00Z
last_updated: 2026-09-01T20:45:00Z
work_item: maintenance.experiment-output-read-path-map
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../../experiments/README.md
  - ../../outputs/evidence-ledger-prioritizer.md
  - ../../outputs/research-validation-checklist.md
  - ../../experiments/btc-eth-alert-edge/README.md
  - ../../experiments/strategy-destruction-filter/README.md
  - ../../experiments/copytrading-address-intake/results/hyperliquid-public-route-ledger.md
  - ../../experiments/liquidation-q1-baseline-kill-switch/README.md
  - ../../../crypto-updates/wiki/trading-journal/index.md
  - ../../../crypto-updates/orderflow-index.yaml
---
# Experiment Output Read Path Map

## Purpose

RALPH has accumulated multiple experiment folders and generated outputs. This note records the compact read path so future work starts from summaries, reports, and verifiers instead of raw JSON, JSONL, or source code.

## Default Read Order

1. `outputs/evidence-ledger-prioritizer.md`
2. `outputs/research-validation-checklist.md`
3. `experiments/README.md`
4. The selected experiment `README.md`
5. The selected experiment `results/*.md`
6. Matching `results/*.json` only when row-level fields are needed
7. Source code/tests only when debugging or changing the experiment

## Experiment Surfaces

| Experiment | First read | Compact result surface | Use | Current route |
| --- | --- | --- | --- | --- |
| `btc-eth-alert-edge` | `experiments/btc-eth-alert-edge/README.md` | `results/edge-summary.md`, `results/paper-dashboard.md`, `results/live-ta-execution-journal.md` | Alert-edge backtests, paper signals, live TA execution joins | Paper/research only; live journal joins are evidence, not strategy proof. |
| `strategy-destruction-filter` | `experiments/strategy-destruction-filter/README.md` | `results/filter-report.md`, `results/shadow-pnl-ledger.md`, `results/feature-study.md`, `results/rejected-ideas.jsonl` | Candidate rejection, survivor diagnostics, feature sanity | Active rejection/filter rail; no promotion without forward paper and HITL gates. |
| `copytrading-address-intake` | `experiments/copytrading-address-intake/results/hyperliquid-public-route-ledger.md` | leaderboard intake and wallet-shadow delay sample Markdown outputs | Public/no-key Hyperliquid address triage and tiny delay falsifiers | Watch/named-trigger only; no scanner or copy candidate route. |
| `liquidation-q1-baseline-kill-switch` | `experiments/liquidation-q1-baseline-kill-switch/README.md` | `results/major-2026-06.json` plus killed-branch notes | Liquidation/cascade Q1 falsifier | Discarded for current Q1; reusable as validation pattern only. |
| Root `outputs/` | `outputs/evidence-ledger-prioritizer.md` | generated Markdown and JSON reports | Cross-branch routing/evals | Maintenance and routing, not direct strategy evidence. |

## Routing Decisions

- Use Markdown result reports first. JSON and JSONL are evidence stores, not default context.
- Do not treat `results/survivors.json` as promotion. Survivors need matching forward-paper support and the Profitability Flywheel gate.
- Do not treat `crypto-updates/wiki/trading-journal/index.md` live execution joins as strategy profitability proof. They are process/evidence review surfaces.
- For U-038 orderflow work, the correct first surface is still `../crypto-updates/orderflow-index.yaml` and `../crypto-updates/wiki/orderflow/replay-alignment.md`; RALPH experiment outputs explain why saved captures are pipeline evidence only.
- For U-027 build-vs-buy/tool coverage, prefer this map before proposing another custom harness.

## Boundary

This is local navigation and Obsidian hygiene only. It authorizes no new capture, scanner, collector, scheduler, cron, systemd, alert wording, thresholds, account, key, paid service, API use, demo/testnet setup, live trading, live copying, orders, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.
