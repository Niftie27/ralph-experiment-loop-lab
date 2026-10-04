# Strategy Research Loop

Purpose: discover and compare trading strategy families before designing a trading bot system.

## Trigger

- Manual A1 request.
- Future approved A2 research cadence.
- New source mentions a strategy, bot architecture, or market failure mode.

## Inputs

- source pages
- MEV bot case file
- wallet-shadow case file
- public repos
- papers
- X/Twitter threads when available
- benchmark lessons

## Actions

1. Pick one strategy family or repo cluster.
2. Identify the actual edge being claimed.
3. Classify it as speed, information, inventory, latency, statistical, structural, liquidation, market-making, event-driven, or operational.
4. Score fit against Tomas's budget and skills.
5. Identify required data, simulation, capital, and infra.
6. Extract failure modes and exploitation risk.
7. Decide: discard, watch, investigate, benchmark, or prototype-later.

## Outputs

- strategy note under `wiki/notes/`
- candidate update
- unknown update
- discard record if needed
- queue update

## Safety

- No trading.
- No keys.
- No exchange accounts.
- No paid infra.

