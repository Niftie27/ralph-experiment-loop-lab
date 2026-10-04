---
type: note
topic: impulse-cooldown-purged-forward-test
created: 2026-09-27T08:10:24Z
last_updated: 2026-09-27T08:10:24Z
work_item: validation.impulse-cooldown-purged-forward-test
status: complete
scope: research-only
tags:
  - ralph
  - demo-sim
  - range-breakout-survivor
  - impulse-exhaustion
  - purged-forward-test
  - postmortem-viable-only
  - not-forward-validated
  - research-only
  - no-promotion
related:
  - ../concepts/impulse-exhaustion-research-branch.md
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-impulse-cooldown-purged-forward-test.md
  - 2026-09-27-impulse-exhaustion-cooldown-postmortem.md
---

# Impulse Cooldown Purged Forward Test

## Purpose

This validates the postmortem cooldown candidate outside the 2026-W34 focus week.

Predeclared rule:

- keep existing `range_breakout_long + BTC_RISK_ON` survivor rows
- skip a row when target-symbol prior 72h return is greater than 25%
- compare against the unfiltered selected survivor and the alt-basket prior 72h median return >20% comparison
- use a 24h embargo after the W34 focus-window end

## Implementation

Added `experiments/btc-eth-alert-edge/src/demo-sim-impulse-cooldown-purged-forward-test.mjs` and standalone package script `demo-sim:impulse-cooldown-forward`.

Outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-impulse-cooldown-purged-forward-test.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-impulse-cooldown-purged-forward-test.md`

The script uses existing DEMO-SIM replay rows and local public candle cache only. It is not included in `demo-sim:all` and is not wired to cron.

## Result

Verdict: `postmortem_viable_only_forward_not_confirmed`.

Viability tag: `postmortem_viable_only`.

Purged-forward baseline after the 24h W34 embargo:

- 41 trades
- +1207.55 USDT
- PF 1.1956
- 36.6% winrate
- 13.45% max drawdown

Purged-forward target 72h >25% skip rule:

- 36 trades
- +398.96 USDT
- PF 1.0770
- 33.3% winrate
- 16.80% max drawdown

Alt-basket 72h median >20% comparison:

- same as baseline on the purged-forward slice: 41 trades, +1207.55 USDT, PF 1.1956, 13.45% max drawdown

## Interpretation

The target-symbol overextension skip remains useful as a postmortem explanation of the known W34 failure cluster, but it did not improve the purged-forward slice. It is not a `viable_forward_validation_candidate`.

Do not promote this rule or wire it to DEMO-SIM paper fund, live alerts, watchers, sizing, TP/SL, execution, `demo-sim:all`, or cron.

## Next Route

- Keep `target 72h >25%` as `postmortem_viable_only`, useful for describing impulse exhaustion but not forward-confirmed.
- Stop treating crude 72h overextension as the next promotion path.
- If continuing this lane, search for a better breadth/impulse-decay state feature or gather more genuinely forward rows over time.

## Verification

- `node --check ralph-research-os/experiments/btc-eth-alert-edge/src/demo-sim-impulse-cooldown-purged-forward-test.mjs` passed.
- `npm run demo-sim:impulse-cooldown-forward --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- `demo-sim:all` was checked and still does not include the impulse cooldown postmortem or forward test.

## Boundary Delta

Changed:

- added one research-only purged-forward validation script
- added one standalone package script
- generated standalone JSON/Markdown results
- updated roadmap, queue, log, and memory

Unchanged:

- no scheduler or cron payload changes
- no live alerts
- no watcher behavior
- no keys, accounts, wallets, or paid APIs
- no sizing, leverage, risk, TP/SL, or execution behavior
- no public posting
- no strategy promotion
