---
type: note
topic: hype-feedback-event-only-velocity-kill-test
created: 2026-08-31T21:20:00Z
last_updated: 2026-08-31T21:20:00Z
work_item: validation.hype-feedback-to-quantified-demo-strategy-loop
status: done
scope: local-feedback-proxy-kill-test
decision: rejected-event-only
sources:
  - ../../../crypto-updates/runtime/alert-feedback.jsonl
  - ../../experiments/strategy-destruction-filter/results/volume-velocity-alert-feedback.md
tags:
  - ralph
  - research-note
  - strategy-family
  - rejected
related:
  - 2026-08-31-hype-feedback-quantified-strategy-work-package.md
  - ../filip_feedback/README.md
  - ../../core/profitability-flywheel.md
  - ../../automation/work-queues.yaml
---
# HYPE Feedback Event-Only Velocity Kill Test

## Scope

This closes the first bounded branch of `validation.hype-feedback-to-quantified-demo-strategy-loop`.

Question: can the current HYPE alert/feedback rows produce a quantified tradeable rule without L2 absorption or signed-flow evidence?

Boundary: this is a local research proxy over finalized alert feedback only. It does not start L2 capture, collectors, schedulers, alerts, thresholds, accounts, keys, paid services, demo/testnet accounts, live trading, sizing, TP/SL, execution behavior, public posting, or strategy promotion.

## Hypothesis

H0: HYPE velocity alerts without fresh signed flow or order-book evidence are not independently tradeable. Follow/fade labels should not be promoted unless a precise rule beats a 50% direction baseline with defensible sample size and adverse-excursion control.

Research rule tested: at a finalized HYPE `VELOCITY` event, mark an entry at the alert price in the alert direction and evaluate fixed time exits at 1m, 5m, 15m, 30m, and 1h. This is a direction/proxy test, not an executable order rule.

## Local Evidence

Source: `crypto-updates/runtime/alert-feedback.jsonl`, summarized by `npm run analyze:alert-feedback --prefix ralph-research-os/experiments/strategy-destruction-filter` plus a local HYPE-only checkpoint summary.

- HYPE finalized reviews: 95.
- HYPE velocity reviews: 93.
- Data quality: all HYPE velocity rows are `hype_event_only` in the existing analyzer because current rows lack fresh public depth and signed trade-flow confirmation.
- All HYPE velocity rows, follow direction:
  - 1m: 39/93 follow, 41.9%; Wilson 95% range 32.4-52.1%; average directional move -0.0063%.
  - 5m: 53/93 follow, 57.0%; Wilson 95% range 46.8-66.6%; average +0.2137%.
  - 15m: 50/93 follow, 53.8%; Wilson 95% range 43.7-63.5%; average +0.2447%.
  - 30m: 48/93 follow, 51.6%; Wilson 95% range 41.6-61.5%; average +0.0968%.
  - 1h: 52/93 follow, 55.9%; Wilson 95% range 45.8-65.6%; average +0.1868%.
  - Average favorable excursion: +1.5450%; average adverse excursion: 1.2717%.
- Best-looking coarse bucket, `HYPE velocity 5m UP`:
  - N=27.
  - 30m follow: 17/27, 63.0%; Wilson 95% range 44.2-78.5%; average +0.2585%.
  - 1h follow: 18/27, 66.7%; Wilson 95% range 47.8-81.4%; average +0.3219%.
  - Adverse excursion remains material: average 1.3532%, median 0.7396%.
- `HYPE velocity 60s DOWN` is a possible fade-looking bucket, but it is too small and unstable:
  - N=16.
  - 30m fade: 12/16, 75.0%; Wilson 95% range 50.5-89.8%; average directional move -0.6029%.
  - 1h fade: 10/16, 62.5%; Wilson 95% range 38.6-81.5%; average directional move -0.5480%.
  - Adverse excursion is larger than favorable excursion on average: 1.6532% adverse vs 1.4155% favorable.

## Decision

Reject the current event-only HYPE velocity rule as a strategy candidate.

Reason: the broad sample does not clear a useful baseline by enough to survive costs, timing, slippage, and adverse excursion, and the best coarse buckets have wide confidence ranges. More importantly, Filip/Tomas's actual critique is exactly the missing data: without L2 absorption or signed-flow context, the existing HYPE rows cannot distinguish continuation, stop-run reversal, or noisy volatility.

State:

- `validation.hype-feedback-to-quantified-demo-strategy-loop`: done for the event-only proxy branch.
- `hype-l2-absorption-capture-falsifier`: remains Watch only.

## Revisit Trigger

Reopen as a new bounded branch only when one of these is true:

- Tomas explicitly approves HYPE L2/orderflow capture or another non-event-only data source.
- A saved capture/replay already exists with exact HYPE symbol/time overlap around at least 20 finalized HYPE velocity events.
- A future Filip feedback piece provides a more precise HYPE hypothesis that can be tested with currently available local/public data without crossing approval gates.

Required future metric shape: sample count, follow/fade winrate with confidence range, average and median fixed-horizon move, favorable/adverse excursion, regime split, baseline comparison, data-quality flags, and a reject/watch/paper-qualified decision.
