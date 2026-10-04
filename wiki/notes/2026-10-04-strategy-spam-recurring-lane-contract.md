---
type: research-note
created: 2026-10-04T08:52:00Z
topic: strategy-spam-recurring-lane-contract
status: complete
work_item: decision.strategy-spam-recurring-lane-contract
scope: research-only
tags:
  - ralph
  - research-only
  - autoresearch
  - strategy-spam
  - scheduler-boundary
  - no-live-trading
  - no-execution
related:
  - 2026-10-04-strategy-spam-funnel-cleanup-btc-gated-alt-dedupe.md
  - 2026-10-04-strategy-spam-survivor-stress.md
  - ../../automation/ralph-autoresearch-loop.md
  - ../../automation/loop-state.yaml
  - ../../experiments/strategy-destruction-filter/src/run-strategy-spam-funnel.mjs
---
# Strategy Spam Recurring Lane Contract

## Purpose

Tomas asked whether strategy spam should become recurring. The answer is yes, but as an owned research lane inside the existing `ralph-autoresearch-loop`, not as a new standalone cron.

This contract wires the lane into RALPH's existing autoresearch rules without changing scheduler cadence or delivery.

## Approved Shape

Strategy spam is allowed as a controlled autoresearch mode when:

- no higher-priority ready-now branch exists;
- the previous strategy-spam run is at least 7 days old, unless Tomas explicitly asks for a manual run;
- the run uses the recurring profile, not the full manual profile;
- the batch is bounded to at most 300 variants;
- outputs stay outside `seed-strategies.json`;
- survivors trigger stress/manual review, not automatic import.

Recurring command:

```bash
npm run study:strategy-spam-funnel:recurring --prefix ralph-research-os/experiments/strategy-destruction-filter
```

Manual full-surface command:

```bash
npm run study:strategy-spam-funnel --prefix ralph-research-os/experiments/strategy-destruction-filter
```

## Recurring Profile

The recurring profile is intentionally smaller than the full manual cleanup pass.

Included families:

- `spam-btc-volume-breakout-v0`
- `spam-btc-rsi-fade-v0`
- `spam-btc-ma-reclaim-v0`
- `spam-alt-btc-gated-ma-reclaim-v0`

Excluded from the default recurring profile:

- BTC velocity shock fades;
- alt BTC-gated RSI fades;
- grid/DCA/MM;
- funding/basis.

Those excluded surfaces stay manual or future-rotating until separately stressed.

## Current Evidence

The full manual cleanup pass found one survivor, `spam-alt-btc-gated-ma-reclaim-v0#57` on SOL 4h.

The survivor stress pass downgraded it to watch-only:

- base and stricter BTC gate still passed;
- extra 20 bps round-trip rejected it on weak PF;
- ETH 4h transfer rejected;
- SOL 1h transfer rejected;
- long side carried nearly all edge while shorts were near-flat.

Therefore the recurring lane may continue mining, but it must not promote this survivor.

## Boundary

No new standalone cron was created.

No live trading, orders, keys, paid APIs, account setup, wallet connection, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, candidate import, or strategy promotion changed.
