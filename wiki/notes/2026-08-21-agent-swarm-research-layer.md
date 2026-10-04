---
type: research-note
date: 2026-08-21
tags:
  - ralph
  - agent-swarm
  - feature-table
  - alert-feedback
  - data-analysis
related:
  - 2026-08-21-alert-feedback-data-analysis.md
  - 2026-08-21-relative-pair-matrix.md
  - 2026-08-20-book-freshness-repair.md
sources:
  - ../../experiments/btc-eth-alert-edge/src/agent-swarm-research.mjs
  - ../../experiments/btc-eth-alert-edge/results/agent-swarm-feature-table.json
  - ../../experiments/btc-eth-alert-edge/results/agent-scoreboard.md
  - ../../../crypto-updates/runtime/alert-feedback.jsonl
---

# Agent Swarm Research Layer

Status: first offline implementation. This made no live alert wording, threshold, risk, sizing, execution, exchange/account, wallet, key, or paid-API change.

## What Was Built

Added `experiments/btc-eth-alert-edge/src/agent-swarm-research.mjs`, exposed as:

```bash
npm run swarm --prefix ralph-research-os/experiments/btc-eth-alert-edge
```

The script creates a research-only feature table and scoreboard:

- `results/agent-swarm-feature-table.json`
- `results/agent-swarm-feature-table.csv`
- `results/agent-scoreboard.json`
- `results/agent-scoreboard.md`
- `results/agent-scoreboard-slices.json`
- `results/agent-scoreboard-slices.md`

## Architecture

The implemented shape matches the safe RALPH swarm model: many researchers, one scorer, zero autonomous executors.

Feature builders join finalized live-alert feedback to:

- alert metadata: asset, direction, trigger kind/label, trigger move, source;
- finalized review labels: follow, fade, or noisy from 1h directional move;
- orderflow/book evidence: score, CVD, book freshness, imbalance, spread, top-5 depth, depth change;
- point-in-time USDT candles;
- synthetic relative-matrix context from cached Binance spot candles.

Specialist agents then make simple, auditable predictions:

- `trigger_follow_scout`
- `trigger_fade_scout`
- `cvd_confirmation_scout`
- `book_pressure_scout`
- `relative_strength_scout`
- `velocity_continuation_scout`
- `wick_exhaustion_scout`
- `risk_quality_critic`
- `multi_source_follow_scout`
- `clean_book_relative_scout`
- `relative_contrarian_scout`

## First Run

Run timestamp: `2026-08-21T19:05:44Z`.

Dataset:

- joined finalized rows: `63`
- clean rows: `5`
- tainted rows: `58`
- labels: `27` follow, `25` fade, `11` noisy
- relative alignment: `21` confirmed, `26` mixed, `16` contradicted
- quality flags: `52` book-not-fresh, `6` negative-book-age, `1` score-above-max

Top scoreboard rows:

| Agent | Coverage | Accuracy | Read |
| --- | ---: | ---: | --- |
| `book_pressure_scout` | 17.5% | 45.5% | learning |
| `trigger_follow_scout` | 100.0% | 42.9% | learning |
| `wick_exhaustion_scout` | 54.0% | 41.2% | inverted/weak |
| `trigger_fade_scout` | 100.0% | 39.7% | inverted/weak |
| `cvd_confirmation_scout` | 98.4% | 35.5% | inverted/weak |

## V2 Additions

Run timestamp: `2026-08-21T19:38:10Z`.

The second pass added:

- per-row `agentPredictions` for all `11` scouts/critics/ensembles;
- `20` grouped scoreboard slices;
- grouped views by asset, trigger kind, trigger label, direction, data quality, relative alignment, and beta bucket;
- ensemble scouts for multi-source follow confirmation and clean book-plus-relative context;
- slice sorting that suppresses tiny 1/1 false leaders.

Useful slice reads:

| Slice | Rows | Best Current Scout | Read |
| --- | ---: | --- | --- |
| `asset: ETH` | 31 | `book_pressure_scout` at 60.0% on 5 rows | watch, low coverage |
| `betaBucket: idiosyncratic-weakness` | 27 | `wick_exhaustion_scout` at 60.0% on 15 rows | watch |
| `asset: BTC` | 18 | `velocity_continuation_scout` at 57.1% on 7 rows | watch, low sample |
| `betaBucket: cross-pair-divergence` | 11 | `trigger_follow_scout` at 63.6% on 11 rows | watch, likely regime-specific |

No global or sliced result is promotable yet because clean rows remain only `5` and most high-looking slice results are low-sample.

## Read

The first swarm does not yet identify a promotable trading gate. That is the useful result: it proves the harness is measuring agents against outcomes instead of letting many agents vote themselves into false confidence.

The clean post-book-fix sample is still tiny (`5` rows), so the risk critic appropriately abstained on most rows. The next worthwhile improvement is sample growth plus richer agents that can test combinations, for example book pressure plus relative context plus trigger family, rather than one evidence family at a time.

## Next Steps

- Rerun after more finalized post-`2026-08-21T12:20Z` BTC/ETH/SOL reviews exist.
- Rerun grouped scoreboards after every new batch of finalized clean book rows.
- Add minimum-sample confidence intervals before any scout can be called candidate-grade.
- Add ensemble agents only when component slices show stable out-of-sample behavior.
- Keep the executor boundary closed until a clean, forward, out-of-sample scoreboard improves materially over naive follow/fade baselines.
