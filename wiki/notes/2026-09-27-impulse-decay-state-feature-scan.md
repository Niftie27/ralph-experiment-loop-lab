---
type: note
topic: impulse-decay-state-feature-scan
created: 2026-09-27T19:35:00Z
last_updated: 2026-09-27T19:35:00Z
work_item: validation.impulse-decay-state-feature-scan
status: complete
scope: research-only
tags:
  - ralph
  - demo-sim
  - range-breakout-survivor
  - impulse-exhaustion
  - impulse-decay
  - postmortem-viable-only
  - not-forward-validated
  - rejected
  - no-promotion
  - research-only
related:
  - ../concepts/impulse-exhaustion-research-branch.md
  - ../../automation/roadmap.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-impulse-decay-state-feature-scan.md
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-impulse-decay-state-feature-scan.json
  - ../../experiments/btc-eth-alert-edge/src/demo-sim-impulse-decay-state-feature-scan.mjs
  - 2026-09-27-impulse-cooldown-purged-forward-test.md
---

# Impulse Decay State Feature Scan

## Purpose

Test whether a better standalone impulse-decay state feature can filter the existing `range_breakout_long + BTC_RISK_ON` survivor rows after the crude target-symbol 72h overextension rule failed purged-forward validation.

This is a no-trade/state-feature falsifier only. It does not create a new entry rule.

## Result

Status: `postmortem_only_no_forward_validation`.

Baseline purged-forward slice:

- 41 trades
- +1207.55 USDT
- PF 1.1956
- 13.45% max drawdown

Best forward result was `recent_selected_sl_cluster`, but it changed nothing on the purged-forward slice:

- 41 trades
- +1207.55 USDT
- PF 1.1956
- 13.45% max drawdown
- forward delta: 0.00 USDT

The prior postmortem winner, `target_72h_return_gt_25pct`, still improves the full known sample but worsens the purged-forward slice:

- purged-forward kept 36 trades
- +398.96 USDT
- PF 1.0770
- 16.80% max drawdown

## Interpretation

No scanned impulse-decay state improves the purged-forward slice versus baseline. The branch remains useful as failure-mode memory for broad BTC-led alt impulse endings, but the tested state features are not standalone forward-validated no-trade filters.

## Boundary

No `demo-sim:all`, scheduler/cron, live alert, watcher behavior, threshold, key/account, paid service, sizing, TP/SL, execution, public posting, or strategy promotion changed.
