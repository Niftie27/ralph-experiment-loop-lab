---
type: concept
status: active
updated: 2026-08-20
tags:
  - ralph
  - autonomous-research
  - paper-trading
  - pre-ml
---

# Autonomous Research Layers

RALPH's autonomous work is organized as layered evidence, not as a single trading bot.

The canonical contract is `ralph-research-os/core/autonomous-layer-goals.md`.

## Layer Stack

1. Safety and boundaries: no live trading or real-money changes without Tomas.
2. Data rails: public/free data freshness, coverage, and trust.
3. Setup detection: explainable setup families and regimes.
4. Historical backtest: winrate, expectancy, profit factor, sample size, and baseline comparison.
5. Forward paper ledger: fake forward entries, stops, targets, and outcomes.
6. Candidate decision layer: Watch, Candidate, Paper-Qualified, Alert-Qualified, Rejected, Blocked.
7. Pre-ML dataset layer: clean features and deterministic labels.
8. Future ML layer: calibrated probability only after label quality is real.
9. Human-facing knowledge layer: Obsidian/OpenClaw wiki summaries Tomas can inspect.

## Current Self-Set Goals

- Build a forward paper dashboard split by tier and setup family.
- Repair fresh public depth capture or record the no-key blocker.
- Keep low-sample paper trades out of B-tier headline evaluation.
- Prepare an ML-ready feature/label table before training any model.
- Keep durable outputs readable in Obsidian-compatible Markdown.

## Current Non-Goal

RALPH should not train a model, change live alerts, or propose real execution until the evidence stack is cleaner and Tomas explicitly approves the next boundary crossing.
