---
type: note
topic: ta-primitive-intake-protocol
created: 2026-08-30T14:48:00Z
last_updated: 2026-08-30T14:48:00Z
status: complete
scope: research-only
source: Tomas correction in Telegram, 2026-08-30
tags:
  - ralph
  - research-note
  - orderflow
  - ta
related:
  - templates/ta-primitive-intake.md
  - ../concepts/multi-timeframe-full-ta.md
  - 2026-08-30-previous-day-high-low-liquidity-sweep-intake.md
  - 2026-08-30-trader-grade-ta-feature-taxonomy.md
---
# TA Primitive Intake Protocol

## Purpose

Tomas clarified that TA pieces he sends over time are not random note dumps. They can become reusable full-TA components that RALPH should know when to retrieve, apply, and crosslink.

This note defines the default intake protocol for those pieces.

## Intake Contract

When Tomas supplies a TA/trading piece:

1. Save the raw material as a source artifact when it is source-grade.
2. Create or update a source page with author/channel, URL, transcript quality, timestamps, and caveats.
3. Create a structured TA primitive note using [[wiki/notes/templates/ta-primitive-intake]].
4. Tag the note by experience level: beginner, intermediate, advanced, expert/research.
5. Crosslink it into [[wiki/concepts/multi-timeframe-full-ta]] if it can be part of full TA.
6. Add explicit retrieval rules: when to use it, when to ignore it, and which market conditions trigger it.
7. Translate it into RALPH fields only after preserving the source's own logic.
8. Keep intake separate from validation, alert changes, execution, and strategy promotion.

## What Counts As A TA Primitive

A TA primitive is a reusable analytical component, not necessarily a complete strategy.

Examples:

- prior-session high/low;
- VWAP session control;
- liquidity sweep and reclaim;
- breakout acceptance;
- failed breakout;
- no-trade chop/overlap;
- opening range;
- value area and point of control;
- trend/retest/reclaim;
- orderflow confirmation;
- derivatives context;
- invalidation and target logic.

## Retrieval Rule

Future RALPH analysis should retrieve a TA primitive only when the chart or research object actually contains its trigger condition.

For example, the PDH/PDL note should be retrieved when price is interacting with prior-session extremes, when a report mentions liquidity sweep/fakeout/acceptance, or when VWAP/session control is needed to distinguish continuation from reversal or no-trade.

Do not force every primitive into every analysis. Full TA is a scenario map with relevant components, not a checklist of all known concepts.

## Crosslink Rule

Crosslink a TA primitive when it materially affects:

- HTF context;
- mid-TF setup;
- LTF trigger;
- session-control read;
- target or invalidation logic;
- no-trade decision;
- validation schema;
- paper/shadow ledger fields.

Do not crosslink only because a keyword is visible. The link should help a future agent or Tomas decide what the chart means.

## Promotion Boundary

TA primitive intake can produce:

- raw source artifact;
- source page;
- structured note;
- full-TA crosslink;
- retrieval rule;
- validation-field suggestion;
- cheapest falsifier proposal.

TA primitive intake cannot produce:

- live alert changes;
- new thresholds;
- trade recommendations;
- TP/SL/sizing rules for live use;
- execution changes;
- strategy candidate promotion;
- paid/keyed access;
- scheduler or watcher changes.

Those require separate approval and evidence gates.

## Current Example

The first normalized TA primitive is [[wiki/notes/2026-08-30-previous-day-high-low-liquidity-sweep-intake]], sourced from Chart Champions' PDH/PDL liquidity-sweep video.

It is a full-TA primitive for prior-session extremes, liquidity sweep/reversal, breakout acceptance, no-trade chop, and VWAP session-control context.

## Verification

Future TA primitive intakes should verify:

- YAML/frontmatter parses;
- index page count matches;
- source/note are searchable in Obsidian/OpenClaw bridge;
- full-TA concept links back to the primitive when applicable;
- no boundary-changing side effect occurred.

## Boundaries

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
