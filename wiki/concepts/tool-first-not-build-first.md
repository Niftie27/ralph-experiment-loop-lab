---
type: concept
name: Tool First, Not Build First
sources:
  - raw/tool-first-pivot-2026-07-01.md
related:
  - wiki/concepts/patient-retail-strategy-map.md
  - wiki/notes/2026-07-01-m1-board.md
created: 2026-07-01T22:58:00Z
last_updated: 2026-07-01T22:58:00Z
---

# Tool First, Not Build First

RALPH should not assume that a trading bot, scanner, paper-trade harness, or data collector must be custom-built.

The default decision order is:

1. Use existing product or open-source tool.
2. Configure or integrate existing tool.
3. Write a small adapter or signal layer.
4. Build custom infrastructure only when the missing piece is real and verified.

## What Not To Build First

- generic backtest engine;
- generic dry-run/paper-trading engine;
- grid/range bot;
- copy-trading execution platform;
- raw market data warehouse;
- MEV or transaction simulation tooling before a strategy requires it.

## What May Need Custom Work

- patient-retail smart-money cohort signal;
- exit-shadowing quality metrics;
- branch-selection discipline;
- prior-art-first tool evaluation;
- glue between on-chain signal and a proven engine;
- Tomas-specific forward validation and decision memo.

## Guardrail

Existing tools do not remove validation risk.

They reduce build work, but RALPH must still guard against:

- survivorship bias;
- leaderboard universe bias;
- lookahead bias;
- multiple testing;
- market beta mistaken for alpha;
- live-key and capital risk.

