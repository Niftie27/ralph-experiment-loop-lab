---
type: note
name: TA Learning Loop Alert Review
created: '2026-08-18T20:08:00Z'
updated: '2026-08-19T03:19:00Z'
status: active
tags:
  - ralph
  - research-note
  - orderflow
  - ta
related:
  - ../../automation/ta-learning-loop.md
  - ../../../crypto-updates/wiki/setup-analysis/latest.md
  - ../../../crypto-updates/setup-analysis-index.yaml
  - ../concepts/forward-paper-trade-gate.md
---
# TA Learning Loop Alert Review

This note is the RALPH-facing Obsidian entry point for the Crypto Updates TA learning loop.

The loop treats each reviewed market alert as a hypothetical trade setup, then asks what TA context would have helped Tomas trade, skip, fade, or wait for confirmation. It is research and indexing only. It does not change live orders, execution, sizing, leverage, TP/SL, alert thresholds, or watcher behavior without explicit HITL approval.

## Current State

- Analyzer: [crypto-updates/analyze-alert-setups.mjs](../../../crypto-updates/analyze-alert-setups.mjs)
- Compact index: [crypto-updates/setup-analysis-index.yaml](../../../crypto-updates/setup-analysis-index.yaml)
- Latest readable setup review: [crypto-updates/wiki/setup-analysis/latest.md](../../../crypto-updates/wiki/setup-analysis/latest.md)
- Row output: [crypto-updates/runtime/setup-analysis.json](../../../crypto-updates/runtime/setup-analysis.json)
- Candle cache: [crypto-updates/runtime/setup-candle-context-cache.json](../../../crypto-updates/runtime/setup-candle-context-cache.json)
- Runbook: [[automation/ta-learning-loop]]

Latest verified analysis has 16 total hypothetical alert decisions: 15 reviewed setups, 1 unreviewed alert, and candle context for 10 reviewed setups. Candle context uses public no-key 1m candles where available and leaves missing history explicitly as `unknown_without_candle_context`.

ETH alert `3517` remains delayed/untrusted from the websocket backlog incident and must not be promoted into trading evidence.

## TA Question

The working question is:

> If Tomas saw this alert in time and considered trading it, what TA context would have improved the decision?

The target is not constant strategy hopping. The target is to discover and maintain a small set of high-probability setup definitions. Different tactics such as follow, fade, wait, or skip are only candidate responses after TA context says the setup is actually viable.

For each setup, future review should prefer concrete labels over vague commentary:

- market regime: trend, range, compression, expansion
- location: support, resistance, middle of range, lower/upper third, impulse into level
- setup action: follow, fade, skip, wait for confirmation
- entry quality: tradable, event-only, stop-risk without TP, TP possible but path-order ambiguous
- reason tags: why it likely worked, failed, or became noise
- confidence: low until sample size and candle/orderflow coverage improve

## Current Learning

The first candle-context pass produced one non-live research candidate:

- `wick-shock|DOWN|evidence-medium`
- Sample: 3 reviewed setups
- Bias: follow
- Candidate line: `Call: follow-through favored (low-sample)`

This is not wired into future alerts. It is a research candidate only because the sample is still tiny and RALPH needs more post-alert outcomes before promoting live wording.

The current per-alert hypothetical action mix is:

- `consider_fade_with_confirmation`: 2
- `consider_follow_after_confirmation`: 2
- `observe_only`: 8
- `skip_no_edge`: 3
- `skip_untrusted_delivery`: 1

These labels are generated into [crypto-updates/wiki/setup-analysis/latest.md](../../../crypto-updates/wiki/setup-analysis/latest.md) and [crypto-updates/runtime/setup-analysis.json](../../../crypto-updates/runtime/setup-analysis.json). They are learning labels, not trade instructions.

Verification is explicit: [crypto-updates/verify-setup-analysis.mjs](../../../crypto-updates/verify-setup-analysis.mjs) checks that JSON/YAML/wiki outputs agree, every alert decision has action/thesis/why/learning tags, `live_alert_text_change` remains false, and ETH `3517` remains `skip_untrusted_delivery`.

Reassessment is part of the loop, not a final polish step. After every run, the agent should ask whether the current confidence/probability labels are still justified by sample size, candle/orderflow coverage, manual TA context, and delayed-delivery exclusions. If not, keep the setup as research-only or downgrade it.

## Better-Winrate Hypothesis

The early hypothesis is that winrate can improve less by changing alert thresholds immediately and more by adding a TA decision layer on top of alerts:

- skip alerts with missing or untrusted delivery context
- skip or down-rank noisy buckets until they earn a pattern
- prefer follow-through when candle context shows continuation rather than snapback
- prefer fades only when wick shock occurs into nearby support/resistance and path ambiguity is acceptable
- keep `Call:` wording short, low-sample-labeled, and non-prescriptive until promoted

Future probability labels should be calibrated from reviewed outcomes and manual TA audits. Early labels should stay qualitative or bucketed (`low`, `leaning`, `medium`, `high_candidate`) until sample size and forward checks justify a numeric estimate.

Backtesting is part of the learning loop. The liquid-crypto alert-edge backtest currently covers BTC, ETH, SOL, BNB, XRP, DOGE, ADA, LINK, and AVAX in paper-only mode. Latest verified expanded run produced 423 historical setup-stat buckets and 7 latest paper detections across 18 symbol/timeframe sources. Low-sample rows are explicitly ranked below A/B/C candidates so raw 100% tiny-sample results do not masquerade as high-probability setups.

## Obsidian Retrieval Contract

When a future session needs to work on this loop, read in this order:

1. [[automation/ta-learning-loop]]
2. [crypto-updates/setup-analysis-index.yaml](../../../crypto-updates/setup-analysis-index.yaml)
3. [crypto-updates/wiki/setup-analysis/latest.md](../../../crypto-updates/wiki/setup-analysis/latest.md)
4. This note
5. [ralph-research-os/experiments/btc-eth-alert-edge/results/edge-summary.md](../../experiments/btc-eth-alert-edge/results/edge-summary.md)
6. [crypto-updates/runtime/setup-analysis.json](../../../crypto-updates/runtime/setup-analysis.json) only when row-level proof is needed
7. [ralph-research-os/experiments/btc-eth-alert-edge/results/edge-snapshot.json](../../experiments/btc-eth-alert-edge/results/edge-snapshot.json) only when backtest row proof is needed

Keep this note compact. Detailed per-alert rows belong in the generated Crypto Updates setup-analysis files.

## HITL Boundary

No approval is needed for:

- local analysis and indexing
- public no-key candle/orderflow joins
- Obsidian-friendly notes and links
- non-live recommendation candidates

Approval is required before:

- changing live alert text
- changing risk, sizing, leverage, TP/SL, entry, stop, or threshold rules
- placing orders
- adding paid APIs, exchange keys, wallet keys, or external account changes
- adding a new scheduled/background job outside already approved isolated loops
