---
type: note
name: TA Learning Call Candidate Forward Check
created: 2026-08-29T16:31:04Z
last_updated: 2026-08-29T16:38:00Z
tags:
  - autoresearch
  - ta-learning-loop
  - alert-feedback
  - paper-shadow
  - maintenance
related:
  - ../../automation/ta-learning-loop.md
  - ./2026-08-18-ta-learning-loop-alert-review.md
  - ./2026-08-28-no-key-first-experiment-selection.md
  - ./2026-08-29-doge-candidate-destruction-lookback.md
  - ../concepts/forward-paper-trade-gate.md
  - ../concepts/multi-timeframe-full-ta.md
  - ../../../crypto-updates/setup-analysis-index.yaml
  - ../../../crypto-updates/wiki/setup-analysis/latest.md
  - ../../../crypto-updates/runtime/setup-analysis.json
  - ../../experiments/btc-eth-alert-edge/results/live-ta-execution-journal.md
  - ../../experiments/btc-eth-alert-edge/results/paper-dashboard.md
---

# TA Learning Call Candidate Forward Check

Status: completed; keep both generated `Call:` lines research-only/watch. No live alert text, watcher behavior, execution, order, risk, sizing, TP/SL, cron, key, account, paid API, or strategy-promotion behavior changed.

## Refresh

The setup analyzer was refreshed from local monitor feedback before checking the call candidates.

- Generated: `2026-08-29T16:31:04.037Z`
- Reviewed setups: 240
- Unreviewed alerts: 5
- Total hypothetical alert decisions: 245
- Reviewed setups with candle context: 149
- Live alert text changed: false
- Call-line status: `research_candidate_not_live`

The refresh added 17 reviewed setups and 17 candle-context-ready rows versus the previous 2026-08-28 output.

## Candidate Buckets

### `velocity-shock-60s|DOWN|evidence-high`

Generated call: `Call: fade/reversion favored (low-sample)`

- Sample: 9
- Alignment: 7 fade / 2 follow, 77.8%
- Assets: ETH 5, SOL 3, BTC 1
- Hypothetical actions: 6 `consider_fade_with_confirmation`, 3 `observe_only`
- Entry quality: 6 tradable research entries, 3 event-only rows
- Matched executions: 0
- Median favorable fade move: 0.6293%
- Median adverse fade move: 0.4738%
- Trend contexts: downtrend 4, higher-timeframe uptrend 3, mixed 2

Verdict: keep as watch-only. It is coherent enough to preserve as a low-sample research bucket, but the sample is tiny, the asset mix includes event-only SOL rows, and there are no exact-follow executions.

### `wick-shock|UP|evidence-medium`

Generated call: `Call: follow-through favored (low-sample)`

- Sample: 5
- Alignment: 4 follow / 1 fade, 80.0%
- Assets: SOL 2, ETH 2, BTC 1
- Hypothetical actions: 3 `consider_follow_after_confirmation`, 2 `observe_only`
- Entry quality: 3 tradable research entries, 2 event-only rows
- Matched executions: 0
- Median favorable follow move: 0.6854%
- Median adverse follow move: 0.1521%
- Trend contexts: downtrend 2, higher-timeframe uptrend 1, mixed 1, flat 1

Verdict: watch-only and weaker than the 60s DOWN fade bucket because N=5 is below a serious promotion threshold. It may be useful as a future review bucket if more wick-UP medium-evidence rows arrive.

## Forward/Paper Context

The live TA execution journal currently has zero matched executions and 244 paper/shadow alerts, so this pass cannot validate exact-follow profitability. It can only compare post-alert paper/shadow review outcomes and generated hypothetical decisions.

The alert-edge paper dashboard verified at `2026-08-29T16:04:48Z` remains paper-only:

- Overall: 171 total, 9 open, 162 closed, 49.4% winrate, 46.902R total, 0.2895R average
- A/B/C: 17 total, 0 open, 17 closed, 52.9% winrate, 5.5544R total, 0.3267R average
- Feature rows: 73, clean feature rows: 13

This supports continued paper/shadow logging, not live wording changes.

## Verification

Commands run:

- `node --check crypto-updates/analyze-alert-setups.mjs`
- `node --check crypto-updates/verify-setup-analysis.mjs`
- `node crypto-updates/analyze-alert-setups.mjs`
- `node crypto-updates/verify-setup-analysis.mjs`
- `npm run verify --prefix ralph-research-os/experiments/btc-eth-alert-edge`

## Reassessment

Do not wire either `Call:` line into live Telegram alerts yet. The next useful data rule is: keep collecting finalized reviews, then re-run this check when a candidate bucket reaches at least 20 reviewed rows with full candle context, stable asset/regime split, and enough tradable research entries. Exact-follow executions remain a separate stronger evidence bucket when they eventually exist.

Crosslinks:

- [[automation/ta-learning-loop]]
- [[wiki/notes/2026-08-18-ta-learning-loop-alert-review]]
- [[wiki/notes/2026-08-28-no-key-first-experiment-selection]]
- [[wiki/notes/2026-08-29-doge-candidate-destruction-lookback]]
- [[wiki/concepts/forward-paper-trade-gate]]
- [[wiki/concepts/multi-timeframe-full-ta]]
