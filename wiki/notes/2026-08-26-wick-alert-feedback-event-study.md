---
type: research-note
date: 2026-08-26
tags:
  - ralph
  - wick
  - alert-feedback
  - strategy-destruction-filter
related:
  - 2026-08-21-alert-feedback-data-analysis.md
  - 2026-08-26-velocity-replay-adapter-feasibility.md
  - ../concepts/strategy-destruction-filter.md
sources:
  - ../../experiments/strategy-destruction-filter/results/wick-alert-feedback-event-study.json
  - ../../../crypto-updates/runtime/alert-feedback.jsonl
---

# WICK Alert Feedback Event Study

Status: research-only local alert-feedback event study. No live trading, orders, exchange keys, wallet keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution behavior changed.

## Question

Do finalized `WICK 5s` reviews support a strict wick-fade candidate, especially for rows where the live watcher emitted a tradable fade plan?

## Result

Verdict: `watch_or_kill_low_sample`.

Current WICK evidence is not clean enough for promotion. The study found `54` included finalized WICK reviews, `29` tradable fade rows, and `24` buckets. No bucket cleared the gate.

Gate settings:

- minimum sample for candidate: `10`
- minimum dominant verdict share: `0.75`
- minimum tradable fade support share: `0.60`

Totals:

- included WICK reviews: `54`
- excluded WICK reviews: `4`
- tradable fade rows: `29`
- candidate-ready buckets: `0`

## Tradable Fade Read

Across tradable fade rows:

- supports fade: `12`
- against fade: `17`

This is a warning against turning current WICK fade wording into a strict candidate from local feedback alone. The evidence is still useful, but it should be treated as a watch/kill gate until more reviewed outcomes accumulate.

Top buckets:

- `BTC|5s|DOWN|tradable_fade|4/5`: `N=3`, verdicts `fade-useful=2`, `follow-useful=1`, fade support `0.6667`
- `ETH|5s|UP|tradable_fade|4/5`: `N=3`, verdicts `fade-useful=2`, `follow-useful=1`, fade support `0.6667`
- `BTC|5s|UP|tradable_fade|0/5`: `N=3`, verdicts `fade-useful=1`, `follow-useful=2`, fade support `0.3333`
- `BTC|5s|UP|tradable_fade|4/5`: `N=3`, verdicts `fade-useful=1`, `follow-useful=2`, fade support `0.3333`
- `SOL|5s|DOWN|event_only|5/5`: `N=6`, verdicts `fade-useful=4`, `follow-useful=2`, fade support `0.6667`, still event-only and low-sample

## Decision

Do not add a strict wick-fade candidate yet. Keep WICK evidence separate from VELOCITY. The next useful action is continued reviewed sample collection or a later replay-clean WICK-specific test, not changing live alert behavior.

## Verification

Passed:

- `npm run study:wick-feedback --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm run validate:candidates --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`
