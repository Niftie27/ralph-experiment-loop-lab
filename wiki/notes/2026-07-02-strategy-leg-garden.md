---
type: note
name: Strategy Leg Garden
sources:
  - raw/liquidation-q1-baseline-killswitch-spec-2026-07-02.md
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - wiki/notes/2026-07-01-m1-board.md
  - wiki/notes/templates/strategy-leg-note.md
  - decisions/candidates.md
  - decisions/discarded.md
  - core/testing-protocol.md
created: 2026-07-02T08:35:00Z
last_updated: 2026-07-02T08:35:00Z
---

# Strategy Leg Garden

Tomas's current preferred mode is exploratory:

> Keep finding and writing down more strategy legs until something clicks and fits.

This is not a request to pick the next branch immediately. It is a request to widen the candidate surface while preserving the discipline learned from U-036.

## Operating Rule

RALPH should collect many possible legs, but each note should keep the cheapest falsification path visible.

The goal is:

- many rough legs;
- short notes;
- no premature build;
- no paid infra by default;
- no live trading;
- no optimizer loop hunting for a lucky result;
- promote only when a leg has enough shape to test cleanly.

## Leg Note Shape

Template: [[wiki/notes/templates/strategy-leg-note]]

Every new leg note should answer these in a compact form:

- **Observation:** what made this leg interesting?
- **Mechanism:** why might this be edge rather than narrative?
- **Speed:** is the edge slow enough for Tomas after detection, thinking, fees, and slippage?
- **Data rail:** what source could observe it cheaply?
- **Dumb baseline:** what simple rule might explain it without the fancy signal?
- **Cheapest kill test:** what one replay/paper test could kill it?
- **Tail risk:** what clustered or asymmetric loss can erase the wins?
- **Existing tools:** what product/repo already covers part of this?
- **Next micro-action:** one small read, fetch, source check, or note.

## Promotion Rule

A leg can move from rough note to candidate when it has:

- a concrete observable signal;
- at least one credible data rail;
- a dumb baseline it must beat;
- an explicit kill condition;
- a reason it fits patient-retail constraints better than speed competition.

A leg can move to a Q1-style validation only when:

- the test window is pre-registered;
- thresholds are fixed before the run;
- baseline and cost model are fixed before the run;
- the result can say proceed or stop in one line.

## Current Leg Backlog

These are not selected winners. They are working legs to keep collecting around:

- smart-money accumulation cohort;
- slow mid-cap spot accumulation;
- funding/basis structural baseline;
- aggregate cohort flow;
- exit-shadowing/distribution detection;
- event/risk radar around market-moving public statements;
- range/grid existing-tool trial;
- Freqtrade as validation rail rather than signal source;
- public Dune/Nansen/Arkham data-source fit;
- failure-mode library from killed branches and old bot archives.

## Lesson From Liquidation Q1

The liquidation-map branch was useful even though it died.

It proved that RALPH can turn a tempting idea into a cheap replay gate and stop before map/product/build work. The reusable win is the pattern:

> signal versus dumb baseline, after costs, with tail-risk and outlier checks.

Future legs should inherit that pattern without becoming over-engineered too early.

## Template Rule

Use `wiki/notes/templates/strategy-leg-note.md` for new legs.

Status stays `raw-idea` until `Cheapest Kill Test` is filled. A leg without a kill test is allowed to exist, but it is not allowed to become a candidate.
