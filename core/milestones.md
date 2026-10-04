# RALPH Milestones

## M0 — Workspace Bootstrap

Status: completed.

- AI Research OS structure exists.
- Primary sources ingested.
- Decision layer, rules, queues, loops, and case files exist.

## M1 — Strategy Discovery Engine

Goal: produce a ranked map of possible strategy families before designing a bot.

Outputs:

- strategy taxonomy
- trading bot operation map
- repo/framework shortlist
- event-triggered wallet-shadow hypothesis brief
- first discard list

Exit criteria:

- at least 10 strategy families reviewed
- at least 10 public repos/frameworks reviewed
- at least 5 failure modes extracted
- at least 1 candidate promoted to benchmark or watch

## M2 — Data And Simulation Rails

Goal: identify the cheapest rails for replaying or simulating candidate ideas.

Outputs:

- EVM/L2 data rail comparison
- CEX/backtest rail comparison
- wallet/entity API checklist
- simulation/replay harness recommendation

Exit criteria:

- one candidate can be tested without live trading, keys, accounts, or paid infra

## M3 — First Read-Only Experiment

Goal: run one bounded validation experiment.

Outputs:

- benchmark plan
- dataset
- result memo
- decision: discard, watch, investigate, benchmark again, or prototype-later

## M4 — Prototype Design

Goal: design a no-key, no-live prototype around one validated candidate.

Exit criteria:

- reproducible evidence exists
- risk/cost bounded
- Tomas explicitly approves prototype scope

