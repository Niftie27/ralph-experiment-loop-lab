---
type: note
topic: open-unknown-route-reconciliation
created: 2026-09-01T09:30:59Z
last_updated: 2026-09-01T09:41:56Z
work_item: decision.open-unknown-route-reconciliation
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../../decisions/unknowns.md
  - ../../decisions/candidates.md
  - ../../automation/work-queues.yaml
  - ../../outputs/candidate-scoring-dry-run.md
  - ../../outputs/strategy-score-rubric-dry-run.md
  - ./2026-08-29-ralph-grand-loop-verify-reassess.md
  - ./2026-08-29-source-falsification-guide.md
  - ./2026-07-01-trading-bot-build-guide-map.md
  - ./2026-08-28-framework-shortlist-wheel-gate.md
  - ./2026-08-30-framework-shortlist-comparison.md
  - ./2026-08-30-build-vs-buy-decision-memo.md
  - ./2026-08-30-grid-range-existing-tool-trial-design.md
  - ./2026-08-31-strategy-family-budget-fit-map.md
---
# Open Unknown Route Reconciliation

## Purpose

Tomas challenged the empty manual queue and asked RALPH to look for remaining internal work instead of stopping at "idle." The queue itself was clean, but `decisions/unknowns.md` still had open unknowns that were not reflected in active/pending queues. This pass audits that mismatch without starting external access, capture, scanners, alert changes, scheduler changes, demo/testnet work, or trading.

## Finding

The first real internal mismatch is `U-005`: "What should trigger candidate promotion versus discard?"

It remained `Open`, but later RALPH artifacts already answer the current A2/no-key version of the question:

- `wiki/notes/2026-08-29-ralph-grand-loop-verify-reassess.md` defines the state machine from raw input through Watch, Candidate, kill-tested candidate, forward paper, paper-qualified, HITL review, alert-qualified proposal, and rejection/block/reassess states.
- `wiki/notes/2026-08-29-source-falsification-guide.md` defines the source-falsification minimum output: claim, mechanism, access class, cheapest kill test, baseline, falsifier, decision, next branch, and stop trigger.
- `outputs/candidate-scoring-dry-run.md` proves the first-stage router can score candidate route quality but should not mutate states by itself.
- `outputs/strategy-score-rubric-dry-run.md` adds the second-stage review layer and explicitly downgrades or holds broad, paid/account-dependent, live/key/execution-adjacent, or underspecified work.

## Current Promotion Rule

For the current A2/no-key RALPH phase, promotion requires all of:

- named trigger or selected branch;
- explicit mechanism, market/venue/timeframe, baseline, and falsifier;
- access classification as public/no-key, verified-local, or explicitly HITL-approved if gated;
- cheapest kill test first;
- enough evidence for the claimed tier, including OOS/walk-forward or forward-paper support where strategy-shaped;
- no live/key/account/paid/scheduler/alert/risk/execution/public-posting boundary crossing without Tomas approval.

## Current Discard Or Watch Rule

Discard, Watch, or Block when any of these dominate:

- missing mechanism or missing specific next action;
- inaccessible data, unverified export path, account/key/paid dependency, or unclear terms;
- weak baseline lift, failed OOS/walk-forward, excessive drawdown, low sample, stale labels, impossible fills, hidden hedges, or selection bias;
- source is only social proof, screenshots, popularity, vendor score, or hindsight chart;
- execution-adjacent wording appears before research-only containment.

## Decision

Resolve `U-005` for current routing. The durable answer is not a single threshold; it is the combined flywheel state machine plus source-falsification and strategy-score-rubric gates.

Remaining open unknowns are still valid, but most are either Watch/needs-access, threshold-dependent, branch-specific output-contract checks, or require fresh public/source research before queue mutation.

## Second Finding

`U-012`: "Which guidebook or framework docs should RALPH trust for trading-bot build order?" also remained `Open`, but the current vault already answers it for A2/no-key routing.

Use a composite guide, not one authority:

- `wiki/notes/2026-07-01-trading-bot-build-guide-map.md`: no single guidebook should be trusted blindly; use framework docs for lifecycle/constraints, public repos for architecture patterns, failure cases for guardrails, and RALPH stage gates for sequencing.
- `wiki/notes/2026-08-28-framework-shortlist-wheel-gate.md`: Freqtrade is the validation-hygiene reference, vectorbt is the parameter-sweep/candle sanity rail, NautilusTrader/hftbacktest are replay/fill-realism references, and Jesse is a secondary crypto workflow reference.
- `wiki/notes/2026-08-30-framework-shortlist-comparison.md`: keep custom RALPH harnesses for Tomas-specific output contracts, but benchmark and borrow validation discipline from existing frameworks.
- `wiki/notes/2026-08-30-build-vs-buy-decision-memo.md`: reuse or benchmark existing rails first; custom work is justified only for branch selection, falsifier design, rejection discipline, Tomas-specific paper evidence, small adapters, and memory.

Resolve `U-012` for current routing. Reopen only if a concrete candidate needs a branch-specific framework/action decision or a framework can directly produce the RALPH output contract with less custom code.

## Third Finding

`U-028`: "Can Freqtrade serve as the default no-key backtest/dry-run engine for patient-retail strategy validation?" also had enough existing evidence for a current-routing answer.

The answer is no for active/default use, yes for reference/benchmark use:

- `wiki/notes/2026-08-28-freqtrade-no-key-dry-run-spike.md` found no verified local runnable path: no `freqtrade` binary, no Python import, no Docker, no `pipx`/`pip3`, and no cached local Freqtrade repo.
- The same note says official docs are still useful for validation hygiene: lookahead leakage, recursive/startup variance, dry-run-before-risk discipline, trade exports, fees, timeranges, and historical-data assumptions.
- `wiki/notes/2026-08-28-strategy-filter-bias-hygiene-checklist.md` already extracted the two strongest Freqtrade guard concepts into RALPH-native checks without installing Freqtrade.
- `wiki/notes/2026-08-30-framework-shortlist-comparison.md` ranks Freqtrade as a validation-hygiene reference, not a locally runnable engine.

Resolve `U-028` for current routing: Freqtrade should not be the default active no-key engine until Tomas approves a setup route or a local dependency path appears. Keep it as a Watch/reference rail for bias hygiene and future branch-specific setup proposals.

## Fourth Finding

`U-013`: "Is Hummingbot unsuitable for Tomas because it assumes larger capital or market-making inventory?" is also answerable for current routing.

The answer is yes for first active rail, no for reference value:

- `wiki/notes/2026-07-01-trading-bot-build-guide-map.md` already says Hummingbot is not accepted as a good fit; it is only a source to test, and Tomas's capital/market-making concern is a valid falsification point.
- `wiki/notes/2026-08-30-grid-range-existing-tool-trial-design.md` says Hummingbot Grid Strike/Grid Executor prove grid/range logic is productized, but real use crosses local setup and exchange connector credential boundaries; Hyperliquid connector paths include API-key or wallet flows.
- `wiki/notes/2026-08-31-strategy-family-budget-fit-map.md` says Hummingbot software is free/reference, while execution-capable use crosses exchange account/API/key, bot operations, and execution-adjacent risk.
- `wiki/notes/2026-08-30-trading-bot-operation-map.md` keeps Hummingbot useful as process vocabulary: scripts, controllers, executors, market data providers, and config separation.

Resolve `U-013` for current routing: Hummingbot is unsuitable as Tomas's first active rail under A2/no-key constraints, but remains a Watch/reference/prior-art source. Reopen only after an offline grid/range falsifier survives costs and baselines, or Tomas explicitly approves local setup plus account/key/testnet boundaries.

## Boundary Delta

Changed docs/router/state only. No TA/AVAX threshold rerun, capture, scanner, collector, scheduler, cron, systemd, account, key, paid service, API use, demo/testnet setup, live trading, live copying, orders, live alert wording, thresholds, risk/sizing/leverage/TP/SL, execution behavior, public posting, dependency adoption, paper-candidate wording, or strategy promotion changed.
