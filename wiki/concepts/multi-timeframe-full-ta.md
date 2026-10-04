---
type: concept
name: Multi-Timeframe Full TA
sources:
  - docs/ubiquitous-language.md
  - wiki/concepts/prior-art-before-experiment.md
  - core/testing-protocol.md
  - wiki/notes/2026-08-30-previous-day-high-low-liquidity-sweep-intake.md
  - wiki/notes/2026-08-30-ta-primitive-intake-protocol.md
related:
  - wiki/concepts/tool-first-not-build-first.md
  - wiki/notes/2026-08-18-ta-learning-loop-alert-review.md
  - wiki/notes/2026-08-30-previous-day-high-low-liquidity-sweep-intake.md
  - wiki/notes/2026-08-30-ta-primitive-intake-protocol.md
  - ../crypto-updates/wiki/trading-journal/index.md
created: 2026-08-29T11:58:00Z
last_updated: 2026-08-30T14:48:00Z
---

# Multi-Timeframe Full TA

Full TA in RALPH means a multi-timeframe scenario map, not a verbose lower-timeframe trigger summary.

## Contract

A full TA record should separate:

- HTF context: trend, market structure, major liquidity, regime, high-impact levels, and thesis invalidation.
- Mid-TF setup: session/range structure, VWAP/value, acceptance or rejection, and likely next paths.
- LTF trigger: volume velocity, wick shock, sweep, orderflow, breakout/retest, or entry timing.
- Trade-class fit: whether the evidence supports a fast trade, medium trade, long-running trade, or no trade.
- Entry trigger horizon vs holding horizon: how quickly the entry evidence decays versus how long the broader thesis can remain valid.
- Scenario map: bullish continuation, bearish breakdown, chop/no-trade, fakeout, and what would prove each wrong.
- Execution plan: entry condition, invalidation, target logic, timeout, and conditions for holding or standing down.

## TA Primitives

Full TA can include reusable TA primitives supplied as separate learning notes. These are not isolated strategies by default; they are components to retrieve when the live or historical chart context makes them relevant.

Use and crosslink a TA primitive when its market condition is present:

- Prior session extremes: use [[wiki/notes/2026-08-30-previous-day-high-low-liquidity-sweep-intake]] when price is approaching, sweeping, accepting beyond, rejecting from, or chopping around previous day high/low.
- Session control: use VWAP context when judging whether a PDH/PDL break has directional backing or whether control is flat/balanced.
- Liquidity/fakeout: use sweep/reversal vocabulary when price breaks a watched level and quickly returns inside.
- Breakout continuation: use acceptance vocabulary when price opens/closes beyond a watched level and holds.
- No-trade: use no-trade vocabulary when the level reaction is overlapping, balanced, or unclear.

Future TA pieces from Tomas should be saved as source-backed notes, tagged by experience level, crosslinked here when they can be part of full TA, and retrieved only when the setup context calls for them.

Template/protocol: [[wiki/notes/templates/ta-primitive-intake]] and [[wiki/notes/2026-08-30-ta-primitive-intake-protocol]].

## Trade Classes

RALPH uses these default classes until Tomas explicitly overrides them:

- Fast trade: expected holding horizon from seconds to 30 minutes. LTF trigger can be the central evidence, but the plan must include strict no-chase, timeout, and invalidation rules.
- Medium trade: expected holding horizon from 30 minutes to 8 hours. Requires mid-TF setup plus LTF trigger; volume velocity alone is not enough.
- Long-running trade: expected holding horizon from 8 hours to multiple days or weeks. Requires HTF thesis, mid-TF acceptance/rejection structure, explicit invalidation, and exit/hold rules. LTF trigger is only entry timing.
- No trade: valid Full TA outcome when the scenario map is unclear, conflicting, late, overextended, or unsupported by source/statistical evidence.

## Volume Velocity

Volume velocity is an LTF trigger by default. It can justify attention and sometimes a fast trade setup, but it does not by itself justify medium or long-running trade framing.

For a medium trade, volume velocity should agree with mid-TF structure. For a long-running trade, it should also fit HTF context and a durable invalidation model. Otherwise RALPH should label it as a fast-trade trigger or no-trade observation.

## Alert Surface Rule

Telegram alert wording should not imply more than the evidence supports. If only LTF evidence is present, the alert should call it an LTF trigger and either link to the deeper Obsidian/RALPH page or mark HTF/mid-TF context as missing.

Default split:

- Telegram alert summary: compact action/review card with event, trade class, thesis label, invalidation, and strongest blockers.
- Obsidian/RALPH full analysis record: HTF context, mid-TF setup, LTF trigger, scenario map, execution plan, source/wheel notes, paper/shadow outcome, and later execution comparison.

Default delivery gate:

- Clean actionable setup: Telegram summary plus Obsidian/RALPH full analysis record.
- Interesting but non-actionable event: Obsidian/RALPH full analysis record only.
- Exceptional research sample: Telegram can be used if the event is rare, high-impact, or directly resolves an active unknown.
- Risk/context event: Telegram can be used if the information is timely and useful even without a trade.

Changing the user-visible alert surface still requires Tomas's explicit approval.

## Reassessment

The current historical alert journal is mostly legacy data without full TA fields. Future full TA alerts should be judged by whether the generated record contains the multi-timeframe fields above and whether paper/shadow outcomes differ by trade class.
