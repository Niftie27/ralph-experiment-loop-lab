---
type: research-note
status: unknown
tags:
  - ralph
  - research-note
  - automation
related:
  - ../research-map.md
---

# RALPH Subsystem Scheduler Upgrade

Created: 2026-09-24

## Question

Tomas clarified that RALPH should not only have broad categories like "backtesting lab" or "DEMO-SIM". Each subsystem should have a scheduled or trigger-based job, start work, produce useful output, and route that output toward profitable trading research.

## Current State

RALPH already has useful scheduled loops:

- `liquid-crypto-alert-edge-backtest`, every 4h UTC: mechanical refresh for alert-edge universe, backtests, paper state, verification, and now historical DEMO-SIM replay.
- `ralph-autoresearch-loop`, daily 09:30 Europe/Prague: one bounded research item per run.
- `ralph-state-of-edge-daily`, daily 19:15 Europe/Prague: deterministic promote / kill / watch / stale-data state.
- `ralph-adversarial-improvement-loop`, daily 19:30 Europe/Prague: critic/proposal loop after state-of-edge.
- `ralph-weekly-maintenance`, weekly Sunday 18:00 Europe/Prague: queue/index/tool-health/context hygiene.

This is a decent base, but the subsystem layer is still implicit. Some playbooks in `ralph-research-os/loops/` are manual and not represented as active subsystem jobs. `current-operating-map.md`, `loop-registry.yaml`, and cron prompts are partially out of sync with the new DEMO-SIM paper-fund direction.

## Problem

The current system answers "what cron jobs exist?" better than it answers:

- What subsystem owns this work?
- What starts the subsystem: cron, artifact change, closed trade, or human request?
- What inputs does it read?
- What output artifact must it produce?
- Who consumes that output?
- What notification gate applies?
- What makes the subsystem effective or ineffective?

Without that contract, tasks can become passive queue entries instead of reliable productive loops.

## Recommended Subsystems

### Data And Replay Refresh

- Owner: `liquid-crypto-alert-edge-backtest`
- Cadence: every 4h UTC
- Trigger: time
- Inputs: market candles, monitor feedback, trade journal, paper signals
- Outputs: edge snapshot, paper dashboard, historical DEMO-SIM replay, verification state
- Consumer: backtesting lab, state-of-edge, adversarial critic
- Useful if: outputs are fresh, verified, and not silently stale

### Strategy Discovery

- Owner: `ralph-autoresearch-loop`
- Cadence: daily bounded item; deeper source scans weekly or when queue empty
- Trigger: scheduled daily, new source, Tomas idea, weak current pipeline
- Inputs: public prior art, existing strategy notes, failed candidates, market observations
- Outputs: precise strategy candidate specs, not vague ideas
- Consumer: backtesting lab
- Useful if: each output includes mechanism, rule, data need, baseline, kill test, and why it might deserve capital

### Backtesting Lab

- Owner: `ralph-autoresearch-loop` plus experiment scripts
- Cadence: daily bounded item when pending candidate/spec exists
- Trigger: candidate spec, data refresh, measurement bug, state-of-edge candidate review
- Inputs: candidate specs, candle/trade/orderflow data, existing backtest harnesses
- Outputs: backtest report, walk-forward result, baseline comparison, reject/watch/demo-sim decision
- Consumer: DEMO-SIM paper fund
- Useful if: it kills weak ideas cheaply and promotes only evidence-backed survivors

### DEMO-SIM Paper Fund

- Owner: new/expanded DEMO-SIM ledger under the alert-edge experiment
- Cadence: every 4h refresh plus event-triggered update on closed simulated trade
- Trigger: new live DEMO-SIM event, replay refresh, closed fake position
- Inputs: `demo-sim-trades.jsonl`, historical replay, paper signal state
- Outputs: account-equity ledger, drawdown report, open exposure, strategy allocation table
- Consumer: state-of-edge, adversarial critic, Tomas only when a gate fires
- Useful if: it answers "would this have grown capital?" not only "did this trade win?"

### State Of Edge

- Owner: `ralph-state-of-edge-daily`
- Cadence: daily 19:15 Prague
- Trigger: time
- Inputs: paper dashboard, shadow PnL, DEMO-SIM paper-fund report, replay report, freshness checks
- Outputs: promote / watch / kill / stale-data verdict
- Consumer: adversarial critic, autoresearch priority, rare Telegram gate
- Useful if: it gives a small deterministic capital-readiness state

### Adversarial Critic

- Owner: `ralph-adversarial-improvement-loop`
- Cadence: daily after state-of-edge; deeper weekly pass
- Trigger: time, candidate promotion, large drawdown, repeated stale data, blocker
- Inputs: state-of-edge, paper-fund report, strategy-filter report, replay report
- Outputs: proposal-only improvement report, high/critical gates
- Consumer: autoresearch queue, Tomas only when needed
- Useful if: it finds broken assumptions before capital does

### Trade Postmortem

- Owner: event-triggered paper/DEMO-SIM review job, not yet implemented
- Cadence: on closed DEMO-SIM/paper position; batch fallback daily
- Trigger: closed fake trade
- Inputs: close event, entry thesis, BTC regime, target symbol context, exit path
- Outputs: compact postmortem row and tags
- Consumer: strategy discovery, backtesting lab, state-of-edge
- Useful if: losses change future filters instead of becoming logs nobody reads

### Execution Readiness

- Owner: weekly maintenance or candidate-triggered readiness check
- Cadence: weekly or when a paper-fund strategy becomes capital-worthy
- Trigger: strategy candidate crosses evidence threshold
- Inputs: paper-fund report, code path, adapter status, keys/access status, kill switch status
- Outputs: blockers before demo/testnet/live-write capability
- Consumer: Tomas and future execution layer
- Useful if: it separates "profitable enough to discuss" from "safe enough to execute"

## Main Upgrade

Create an explicit `automation/subsystem-registry.yaml` that records for each subsystem:

- `id`
- `owner_loop`
- `mode`: `scheduled`, `artifact_triggered`, `event_triggered`, or `manual`
- `cadence_or_trigger`
- `inputs`
- `outputs`
- `consumer`
- `notification_gate`
- `effectiveness_check`
- `behavior_policy`
- `failure_behavior`
- `current_status`

Then update daily autoresearch and weekly maintenance to read this registry before choosing work. The queue should say "what work exists"; the subsystem registry should say "what machinery is supposed to run and why."

## Loop Behavior Policy

Tomas clarified that automation should not mean every loop repeats the same task forever. Each subsystem should declare its loop behavior:

- `deterministic`: same job every run; used for data refresh, replay refresh, state-of-edge, stale-output checks.
- `queue`: pick the highest-value pending task; used for precision fixes, paper-fund ledger work, walk-forward reports.
- `deepen`: stay on one promising topic across multiple runs until it is validated, killed, or blocked.
- `explore`: deliberately scan new strategy ideas, public prior art, repos, papers, and trader concepts.
- `connect`: synthesize across separate outputs to find combined edges or contradictions.
- `repair`: fix measurement, freshness, schema, routing, or verification defects before more research.

Non-deterministic loops should choose a behavior mode before doing work. The choice should be based on expected usefulness:

- Does it improve the chance of finding a profitable strategy?
- Does it reduce self-deception or overfit?
- Does it improve DEMO-SIM / paper-fund quality?
- Does it remove a blocker?
- Is there enough evidence to keep digging, or should the topic be killed?

This turns RALPH from scheduled scripts into autonomous research management: some loops are clocks, some loops are researchers, and the researchers should decide whether to continue, deepen, explore, connect, or repair.

## Smallest Next Implementation Slice

1. Add `automation/subsystem-registry.yaml`.
2. Include the eight subsystems above with current known cron IDs and artifact paths.
3. Add a small verifier script or maintenance check that flags:
   - scheduled subsystem without recent output
   - output artifact missing
   - stale output
   - manual subsystem that should be scheduled or triggered
   - queue item not owned by any subsystem
4. Make `ralph-weekly-maintenance` run that check.

This is more effective than adding many independent crons. The immediate problem is not cron count; it is missing subsystem contracts and stale artifact routing.

## Implementation Slice Completed

Completed: 2026-09-24T18:12:00Z

Added `automation/subsystem-registry.yaml` as the explicit subsystem contract layer. It keeps the existing cron topology and makes the subsystem layer visible:

- `data_replay_refresh`
- `strategy_discovery`
- `backtesting_lab`
- `demo_sim_paper_fund`
- `state_of_edge`
- `adversarial_critic`
- `trade_postmortem`
- `execution_readiness`
- `memory_router_maintenance`

Each subsystem now has the required contract fields: behavior policy, cadence or trigger, inputs, outputs, consumers, notification gate, effectiveness check, failure behavior, and current status. Pending queue items are owned by either strategy discovery, backtesting lab, or DEMO-SIM paper fund so maintenance can detect ownerless work.

Extended `automation/research-validation-checklist.mjs` with a `subsystemRegistry` check. The check is intentionally small and research-only: it verifies required fields, active scheduled output presence, stale active outputs over 72 hours, and pending queue items not listed in subsystem ownership.

Updated `automation/README.md` so weekly maintenance treats the subsystem registry as an authoritative state file and includes subsystem contract coverage in the validation checklist.

Verification:

- YAML parse passed for `automation/subsystem-registry.yaml`, `loop-state.yaml`, `work-queues.yaml`, and `loop-registry.yaml` using Python `yaml.safe_load`.
- `node --check automation/research-validation-checklist.mjs` passed.
- `node automation/research-validation-checklist.mjs` ran successfully and generated `outputs/research-validation-checklist.*`.
- New `subsystemRegistry` check: `warn`, with 9 subsystem contracts, 0 missing fields, 0 missing active outputs, 2 stale active outputs (`outputs/evidence-ledger-prioritizer.*`), and 0 unowned pending queue items.
- Existing checklist status remains `fail` because the wiki index count is stale (`index=199`, `actual=224`), and paper/demo remains `not-ready`; these are pre-existing maintenance surfaces, not new scheduler mutations.

No new cron jobs were created. No live execution, keys, paid APIs, TradingView automation, alert wording, thresholds, watcher behavior, risk/sizing, or strategy promotion changed.

## DEMO-SIM Paper Fund Ledger Slice

Completed: 2026-09-24T19:30:00Z

Added `experiments/btc-eth-alert-edge/src/demo-sim-paper-fund-ledger.mjs` as the first deterministic paper-fund interpretation layer on top of `results/historical-demo-sim-replay.json`.

New outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-paper-fund-ledger.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-paper-fund-ledger.md`

The report starts with a 10,000 USDT paper bankroll, applies closed replay records in exit-time order, and surfaces:

- starting capital and ending equity
- gross PnL, fees, and net PnL after fees
- return, peak-to-trough drawdown, max drawdown timestamp
- closed/open-or-skipped counts and skipped reasons
- strategy/setup/symbol/timeframe/tier/BTC-gate grouping
- monthly equity surface and recent ledger rows
- explicit limitations around synthetic replay, overlapping exposure, margin reservation, funding, liquidation, slippage, BTC-gate filtering, and rounded signal-price risk

Current generated status is `capital_impaired_review_required`: 10,000 USDT start, 4,253.94 USDT ending equity, -5,746.06 USDT net PnL after 4,972.00 USDT fees, 452 closed replay trades, 8 open/skipped rows, 31.6% winrate, profit factor 0.8966, and 80.8% max drawdown. `range_breakout_long:long` remains the best current pocket (+9,101.44 USDT net), while all short setup families remain materially negative.

Updated `experiments/btc-eth-alert-edge/package.json` with:

- `demo-sim:ledger`
- `demo-sim:all`

Updated `automation/subsystem-registry.yaml` so `demo_sim_paper_fund` outputs now point to the actual ledger artifacts. Moved `demo-sim-paper-fund-ledger-implementation` and `demo-sim-paper-fund-drawdown-and-risk-report` from validation pending to done in `automation/work-queues.yaml`.

Verification:

- `node --check src/demo-sim-paper-fund-ledger.mjs`
- `node --check src/historical-demo-sim-replay.mjs`
- `npm run demo-sim:all --prefix ralph-research-os/experiments/btc-eth-alert-edge`

No new cron jobs were created. No live execution, exchange keys, paid APIs, TradingView automation, alert wording, thresholds, watcher behavior, risk/sizing, or strategy promotion changed.

## DEMO-SIM Range Breakout BTC Risk-On Gate Slice

Completed: 2026-09-24T19:36:00Z

Added `experiments/btc-eth-alert-edge/src/demo-sim-range-breakout-btc-risk-on-gate.mjs` as the first forward-gate surface for the current strongest pocket.

New outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-range-breakout-btc-risk-on-gate.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-range-breakout-btc-risk-on-gate.md`

The report compares four policies over closed historical DEMO-SIM replay rows:

- all closed replay rows
- long-only rows with shorts withheld
- `range_breakout_long` across all BTC gate states
- `range_breakout_long` only when replay BTC gate state is `BTC_RISK_ON`

It treats 2026-08 as the fit window and 2026-09 as the forward window. After the signal-price precision repair, the selected `range_breakout_long + BTC_RISK_ON` policy generated 107 closed trades, +9,035.42 USDT net after fees, 50.5% winrate, 1.6348 profit factor, and 24.5% max drawdown overall. The forward window stayed positive but decayed sharply: 38 closed trades, +1,287.86 USDT net, 36.8% winrate, 1.2307 profit factor, -0.0265 avg R, and 13.4% max drawdown.

Decision: `candidate_survives_forward_gate`, but only as continued research. It is not capital-ready because forward quality is weak and drawdown is still high. Next useful work is a purged/walk-forward grid and short-family quarantine/revalidation before any watcher behavior, thresholds, sizing, alerting, or execution changes.

Verification:

- `node --check src/demo-sim-range-breakout-btc-risk-on-gate.mjs`
- `npm run demo-sim:all --prefix ralph-research-os/experiments/btc-eth-alert-edge`

Updated `automation/subsystem-registry.yaml` to route the new gate outputs through `backtesting_lab` and `demo_sim_paper_fund`. Moved `demo-sim-range-breakout-btc-risk-on-forward-gate` from validation pending to done.

No new cron jobs were created. No live execution, exchange keys, paid APIs, TradingView automation, alert wording, thresholds, watcher behavior, risk/sizing, or strategy promotion changed.

## DEMO-SIM Signal Price Precision Repair Slice

Completed: 2026-09-24T19:43:00Z

Added `experiments/btc-eth-alert-edge/src/repair-paper-signal-precision.mjs` to fix the rounded paper-signal price problem before replay accounting. The root issue was that `backtest.mjs` stored fresh candidate entry/stop/target levels rounded to 2 decimals, collapsing small-priced assets such as DOGE and ADA into `entry == stop` rows. `backtest.mjs` now stores fresh candidate levels to 8 decimals, and the repair script reconstructs existing paper-signal entry/stop/target levels from cached entry candles plus ATR14.

New outputs:

- `experiments/btc-eth-alert-edge/results/paper-signal-precision-repair.json`
- `experiments/btc-eth-alert-edge/results/paper-signal-precision-repair.md`

Repair result: `beforeBadRisk=53`, `afterBadRisk=0`, `repaired=69`, `skipped=0`. After regeneration, the ledger is still `capital_impaired_review_required`, but current measured output is now 4,542.86 USDT ending equity, -5,457.14 USDT net PnL, 35.6% winrate, PF 0.9038, 0 bad-R records, and 87.8% max drawdown. The precision fix improved measurement quality but did not make the overall system capital-ready.

Verification:

- `node --check src/backtest.mjs`
- `node --check src/repair-paper-signal-precision.mjs`
- `npm run demo-sim:all --prefix ralph-research-os/experiments/btc-eth-alert-edge`

Updated `demo-sim:all` so future scheduled/demo-sim refreshes repair precision before replay, ledger, and gate outputs. Moved `demo-sim-replay-signal-price-precision-fix` from validation pending to done.

No new cron jobs were created. No live execution, exchange keys, paid APIs, TradingView automation, alert wording, thresholds, watcher behavior, risk/sizing, or strategy promotion changed.
