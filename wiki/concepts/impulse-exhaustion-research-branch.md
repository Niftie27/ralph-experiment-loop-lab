---
type: concept
status: active
updated: 2026-09-27
tags:
  - ralph
  - demo-sim
  - range-breakout-survivor
  - impulse-exhaustion
  - impulse-decay
  - postmortem-viable-only
  - not-forward-validated
  - no-promotion
related:
  - ../notes/2026-09-27-survivor-cluster-postmortem.md
  - ../notes/2026-09-27-impulse-exhaustion-cooldown-postmortem.md
  - ../notes/2026-09-27-impulse-cooldown-purged-forward-test.md
  - ../notes/2026-09-27-impulse-decay-state-feature-scan.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-survivor-cluster-postmortem.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-impulse-exhaustion-cooldown-postmortem.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-impulse-cooldown-purged-forward-test.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-impulse-decay-state-feature-scan.md
---

# Impulse Exhaustion Research Branch

## Status

This branch is saved as research memory for the `range_breakout_long + BTC_RISK_ON` survivor.

Current tag: `postmortem_viable_only`.

It is not `viable_forward_validation_candidate`, not paper viable, not live viable, and not a DEMO-SIM/paper-fund promotion path.

## What It Explains

The useful survivor pocket looks like a short-lived broad alt risk-on expansion under BTC confirmation, concentrated in 2026-W34.

The failure mode is synchronized post-impulse loss, especially the 2026-08-22 loss cluster:

- 13 trades
- -4752.49 USDT
- symbols: AVAX, BNB, DOGE, ETH, LINK, SOL, XRP

The postmortem cooldown scan found that the `target-symbol prior 72h return >25%` skip improved the full known sample, but the standalone purged-forward test rejected it as a forward-validation candidate. A follow-up impulse-decay state-feature scan also failed to find a broader breadth/participation/loss-cluster state that improves the purged-forward slice.

## Canonical Evidence Trail

1. `wiki/notes/2026-09-27-survivor-cluster-postmortem.md`
   - identifies 2026-W34 concentration and synchronized post-impulse loss.
2. `wiki/notes/2026-09-27-impulse-exhaustion-cooldown-postmortem.md`
   - finds the crude target 72h >25% skip as a postmortem explanation.
3. `wiki/notes/2026-09-27-impulse-cooldown-purged-forward-test.md`
   - downgrades the rule to `postmortem_viable_only` because purged-forward performance worsened.
4. `wiki/notes/2026-09-27-impulse-decay-state-feature-scan.md`
   - rejects the tested richer impulse-decay states as standalone forward-validated no-trade features.

## Future Use

Use this branch as:

- a failure-mode memory for broad BTC-led alt impulse endings
- a seed for future richer impulse-decay or breadth/participation features only if new evidence exists
- a no-promotion warning against crude fixed 72h overextension skips

Do not use it as:

- a live alert rule
- a watcher gate
- a sizing, TP/SL, or execution rule
- a scheduler or `demo-sim:all` addition
- evidence that `range_breakout_long + BTC_RISK_ON` is capital-ready

## Next Research Shape

The first richer standalone state-feature scan is complete and rejected for forward validation. If this direction continues again, require new evidence or new forward rows before testing another feature that combines:

- breadth/participation decay after broad alt impulse
- synchronized SL/loss cluster state
- BTC still risk-on while alts roll over
- volatility expansion then compression or failure
- target overextension only as one weak input

Keep the next pass standalone and research-only unless Tomas explicitly approves a boundary change.
