---
type: source-lane
topic: filip-feedback
created: 2026-08-31T20:56:00Z
last_updated: 2026-09-08T10:34:00Z
status: active-intake-lane
source_person: Filip
related:
  - ../notes/templates/filip-feedback-intake.md
  - ../notes/2026-08-31-hype-feedback-quantified-strategy-work-package.md
  - ../notes/2026-09-08-filip-btc-pdv-pdn-prediction-intake.md
  - ../notes/2026-09-08-filip-pdv-pdn-cluster-strategy-development-lane.md
  - ../notes/2026-09-08-level-breakout-acceptance-baseline.md
  - ../notes/2026-09-08-planned-level-orderflow-decision-protocol.md
  - ../../core/profitability-flywheel.md
---

# Filip Feedback

Filip feedback is a recurring trader-feedback source lane.

Treat it like TA primitive intake, but with one extra rule: feedback should become quantified strategy research when it makes a trading claim, not just commentary.

## Intake Rule

When Tomas sends Filip feedback:

1. Preserve the raw claim and context.
2. Identify what kind of feedback it is: TA primitive, orderflow critique, strategy critique, execution realism, risk critique, or data gap.
3. Convert tradeable feedback into a precise hypothesis and falsifier.
4. Queue a work package only when it can lead to test/backtest/replay/paper evidence.
5. Require exact metrics or defensible ranges before calling it useful.

## Boundary

Filip feedback can update source memory, queue, hypotheses, templates, and research notes. It cannot directly change live alerts, thresholds, sizing, TP/SL, execution behavior, scheduler behavior, paid/keyed access, or strategy status without the usual evidence and HITL gates.

## Current Items

- [[../notes/2026-09-08-filip-btc-pdv-pdn-prediction-intake|2026-09-08 Filip BTC pdV/pdN prediction intake]] - high-quality BTC intraday hypothesis around Monday pdV/pdN band behavior, but row-level export and objective cluster/delta definitions are required before any validation or promotion.
- [[../notes/2026-09-08-filip-pdv-pdn-cluster-strategy-development-lane|2026-09-08 Filip pdV/pdN Cluster strategy development lane]] - active-design, paper-only lane for Tomas's request that the agent independently develop Filip's hypothesis into a strategy and planned-level alert family.
- [[../notes/2026-09-08-level-breakout-acceptance-baseline|2026-09-08 level breakout acceptance baseline]] - first public-data baseline; candle-only acceptance/rejection around prior highs/lows is mostly weak, so Cluster Search/orderflow should be tested as the false-break filter rather than used as a standalone entry.
- [[../notes/2026-09-08-planned-level-orderflow-decision-protocol|2026-09-08 planned level orderflow decision protocol]] - v0 paper protocol for classifying level breaks as accepted break, sweep/rejection, or no-trade across timeframe ladders.
