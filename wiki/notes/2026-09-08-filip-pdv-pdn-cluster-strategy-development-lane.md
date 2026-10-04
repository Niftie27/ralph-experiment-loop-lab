---
type: research-note
date: 2026-09-08
tags:
  - ralph
  - filip-feedback
  - strategy-development
  - cluster-search
  - planned-level-alert
status: active-design
related:
  - 2026-09-08-filip-btc-pdv-pdn-prediction-intake.md
  - 2026-09-08-planned-level-post-entry-autoresearch-scan.md
  - ../filip_feedback/README.md
  - templates/filip-feedback-intake.md
  - ../../automation/work-queues.yaml
  - ../../core/profitability-flywheel.md
---

# Filip pdV/pdN Cluster Strategy Development Lane

## User Direction

Tomas wants the agent to keep developing the Filip/pdV-pdN/Cluster Search hypothesis independently. Tomas may occasionally relay what Filip writes, but the agent should not wait passively for complete feedback.

## Working Mandate

Develop a paper-only strategy lane around:

- pre-open `pdV/pdN` and value-area context;
- same-side magnet bands;
- weekday and distance-bucket conditioning;
- Cluster Search or public-orderflow proxy confirmation;
- planned-level alert types distinct from current wick/velocity shock alerts.

This lane may produce specs, hypotheses, research notes, proxy tests, backtest/paper designs, validation scripts, and Obsidian summaries. It may not change live alerts, thresholds, execution, sizing, scheduler behavior, paid/keyed access, or strategy status without explicit Tomas approval.

## Strategy Shape

### Pre-Open Map

Freeze before the session:

- session open;
- PDVAH/PDVAL/POC or available approximations;
- PWV/WV/WV+1 if definitions are available;
- `pdV`/`pdN` magnet levels;
- `sameSide` flag;
- distance bucket from open;
- weekday and volatility regime;
- invalidation levels.

### Alert Family

Keep this as a new planned-level family, not part of current `WICK/VELOCITY` alerts:

- `PLANNED_LEVEL_WATCH`: price approaches frozen pdV/pdN band.
- `LEVEL_REACTION_CANDIDATE`: price tests the band and orderflow/Cluster Search confirms absorption or rejection.
- `LEVEL_ACCEPTANCE_BREAK`: price accepts through the band or through the value-area boundary with aligned flow.
- `PLAN_INVALIDATED`: thesis no longer fits, or price chops without a qualifying reaction.

### Confirmation Logic

Preferred long candidate:

- support-band touch around pdV/pdN;
- buyer absorption in Filip's Cluster Search convention, or a proxy showing high aggressive sell volume without downside continuation;
- delta divergence or CVD stabilization;
- 1m/5m close back above the band;
- RSI/context filter only if it survives validation.

Preferred short candidate:

- failure to hold PDVAH/WV+1 or pdV/pdN band;
- no buyer absorption at the band;
- aligned aggressive selling or negative CVD;
- 1m/5m acceptance below the band plus failed retest;
- BTC/regime gate does not fight the setup.

## Development Plan

1. Formalize Filip's field definitions as Tomas relays them.
2. Build an approximation path from public data when ATAS export is unavailable.
3. Define row schema for each future daily plan and alert candidate.
4. Backtest the level-hit claim separately from trade expectancy.
5. Paper-test the planned-level alert family before any live alert proposal.
6. Compare against dumb baselines: no-trade, first-touch fade, first-touch continuation, opening-range breakout, and current wick/velocity watcher.

## Data Needs

Best evidence:

- Filip's row-level CSV/export;
- ATAS Cluster Search screenshots/alerts or exported events;
- exact definitions for `pdV`, `pdN`, `OvsPDVA`, `OvsPWV`, `sameSide`, `stred`, `dayBias`, and cluster colors.

Fallback evidence:

- public Binance/Bybit/Hyperliquid candles and trades;
- approximate footprint clusters by price bucket, trade side, volume, delta, and post-touch reaction;
- manual daily plan rows from Tomas/Filip.

## Current State

- `2026-09-08`: first BTC Monday prediction saved as intake.
- `2026-09-08`: planned-level protocol upgraded with mandatory post-entry monitoring and a source-backed autoresearch scan. Best next direction is a no-key post-entry microstructure replay adapter using public Binance/Bybit trades/book data, benchmarked against hftbacktest concepts before any custom replay engine or dependency adoption.
- This lane is active-design / paper-only.
- Next useful work: design the minimal row schema and proxy test for public BTC data, then wait for either Filip definitions or a Tomas-approved approximation pass.

## Boundary

No live trading, alert wording, thresholds, scheduler, account/key/API/paid access, demo/testnet, order, risk/sizing/leverage, TP/SL, execution behavior, public posting, or strategy promotion changed by creating this lane.
