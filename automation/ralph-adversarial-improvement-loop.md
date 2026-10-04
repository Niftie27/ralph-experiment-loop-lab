# RALPH Adversarial Improvement Loop

Status: proposed-active, research-only.

Purpose: repeatedly criticize, update, and improve RALPH without giving the loop permission to trade, loosen gates, change live alerts, or mutate execution behavior.

## Cadence

- Light pass: daily after `ralph-state-of-edge-daily`.
- Deep pass: weekly after maintenance.
- Session target: isolated.
- Default delivery: none.
- Telegram Tomas only for high/critical risk, repeated blocker, candidate review requiring HITL, or broken monitoring.

## Phases

1. Critic: inspect strategy-filter, state-of-edge, planned-level/orderflow, runtime health, stale data, and recent drift.
2. Proposal: write concrete proposal records, never live changes.
3. Validation: require existing verifier/backtest/paper-shadow evidence before promotion.
4. Memory: route durable results to RALPH notes/log/queue, not main memory.
5. Telegram gate: notify only when the output needs Tomas's judgment or risk attention.

## Hard Boundaries

- No live trading.
- No order placement.
- No wallet keys or exchange keys.
- No paid API/feed/account setup.
- No live alert wording changes.
- No risk/sizing/TP/SL changes.
- No execution behavior changes.
- No strategy promotion without explicit evidence and HITL.

## Command

```bash
node ralph-research-os/automation/ralph-adversarial-improvement-loop.mjs
```

## Required Inputs

- `experiments/strategy-destruction-filter/results/filter-report.json`
- `experiments/strategy-destruction-filter/results/filter-drift-report.json`
- `experiments/strategy-destruction-filter/results/planned-level-proxy-replay.json`
- `experiments/strategy-destruction-filter/results/shadow-pnl-ledger.json`
- `outputs/state-of-edge-report.json`
- `../crypto-updates/runtime/service-health-report.json`

## Outputs

- `outputs/ralph-adversarial-improvement-report.json`
- `outputs/ralph-adversarial-improvement-report.md`
