---
type: note
topic: range-breakout-survivor-stress
created: 2026-09-26T20:15:00Z
last_updated: 2026-09-26T20:15:00Z
work_item: validation.demo-sim-range-breakout-survivor-stress
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
related:
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-range-breakout-survivor-stress.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-walk-forward-filter-grid.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-range-breakout-btc-risk-on-gate.md
---
# Range Breakout Survivor Stress

## Purpose

This closes the next falsification pass for the current DEMO-SIM survivor: `range_breakout_long + BTC_RISK_ON`.

The pass used only `experiments/btc-eth-alert-edge/results/historical-demo-sim-replay.json` and did not fetch new data.

## Implementation

Added `experiments/btc-eth-alert-edge/src/demo-sim-range-breakout-survivor-stress.mjs` and standalone package script `demo-sim:range-breakout-stress`.

Outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-range-breakout-survivor-stress.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-range-breakout-survivor-stress.md`

This script is not included in `demo-sim:all` and is not wired to cron.

## Result

Verdict: `narrow_paper_watch_research_candidate`.

Selected survivor:

- filter: `setup=range_breakout_long`, `direction=long`, `btcGate.state=BTC_RISK_ON`
- 107 closed trades
- +9035.42 USDT per 10k toy equity
- PF 1.6348
- 24.54% max drawdown
- 6 ambiguous rows

Known top pocket:

- filter: `4h + B|low-sample`
- 70 closed trades
- +8394.46 USDT per 10k toy equity
- PF 1.8590
- 28.02% max drawdown
- 6 ambiguous rows

Remove-best tests:

- without best symbol ADA: +5957.07 USDT, PF 1.7048
- without best month 2026-08: +2351.05 USDT, PF 1.6356
- without best week 2026-W34: +2270.74 USDT, PF 1.5290

Fee sensitivity:

- double fees: +7624.46 USDT, PF 1.7548
- extra 10 bps round trip: +7694.46 USDT, PF 1.7640
- extra 20 bps round trip: +6994.46 USDT, PF 1.6740

## Interpretation

The survivor did not fail the cheap remove-best symbol/month/week or fee stresses, so do not downgrade it to rejected.

It is still blocked from promotion:

- top-pocket max drawdown is 28.0%, above the 25% capital-readiness gate
- extra 20 bps cost stress pushes top-pocket drawdown to 30.8%
- ambiguous selected rows are negative at -2379.60 USDT under SL-first scoring
- worst top-pocket consecutive loss cluster is -5236.30 USDT
- best week 2026-W34 contributes +6123.72 USDT, so week concentration remains material
- evidence is synthetic and the pocket was selected after an earlier grid search

Conclusion: keep `range_breakout_long + BTC_RISK_ON` only as a narrow paper-watch/research candidate with blockers. No live promotion, no DEMO sizing change, no watcher change, no TP/SL change, no execution change, and no scheduler update.

## Next Route

Phase 1 survivor falsification can be considered closed for now. The next research route can move laterally to the seeded Phase 2 candidates, especially `funding-persistence-context-baseline`, unless Tomas explicitly asks for more hardening of the range-breakout branch.

## Verification

- `node --check ralph-research-os/experiments/btc-eth-alert-edge/src/demo-sim-range-breakout-survivor-stress.mjs` passed.
- `npm run demo-sim:range-breakout-stress --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.

## Boundary Delta

Changed:

- added one research-only DEMO-SIM stress script
- added one standalone package script
- generated survivor stress result JSON/Markdown
- updated queues/docs/memory

Unchanged:

- no scheduler or cron payload changes
- no live alerts
- no watcher behavior
- no keys, accounts, wallets, or paid APIs
- no sizing, leverage, risk, TP/SL, or execution behavior
- no public posting
- no strategy promotion
