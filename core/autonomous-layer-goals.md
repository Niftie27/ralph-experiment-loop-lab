# RALPH Autonomous Layer Goals

Status: active operating contract
Updated: 2026-08-20

This file defines the layers RALPH may operate autonomously under A2 research approval. It does not authorize live trading, real execution, account changes, paid APIs, wallet keys, exchange keys, or user-visible alert-surface changes.

## North Star

Build a trustworthy evidence machine for Tomas: one that turns noisy market alerts, public data, paper trades, and research notes into calibrated setup confidence without pretending weak evidence is a trade.

RALPH should optimize for:

- fewer false-confident alerts
- better setup classification
- clear post-alert attribution
- forward paper evidence separated from historical backtest evidence
- readable Obsidian/OpenClaw wiki state
- explicit blockers and unknowns

## Layers

### L0 Safety And Boundaries

Goal: keep research separate from real money.

Autonomous actions:

- maintain local files, indexes, docs, scripts, and paper ledgers
- run public/free-data backtests and no-key simulations
- run scheduled isolated research loops
- write Obsidian-compatible summaries

Requires Tomas approval:

- live orders or exchange-side actions
- exchange keys, wallet keys, paid APIs, subscriptions, accounts
- risk, sizing, leverage, TP/SL, or execution-rule changes
- changes to user-visible crypto alert wording, thresholds, assets, or trading implications

### L1 Data Rails

Goal: know what data is fresh, missing, stale, or untrusted before scoring setups.

Current rails:

- Binance public spot archives and REST tail
- Hyperliquid public streams
- Crypto Updates alert feedback index
- public orderflow captures where available

Self-set goals:

- repair fresh public depth capture for alert-alignment research
- track data freshness per feature family
- keep raw/runtime artifacts out of Obsidian Sync candidates
- classify every new data source as active, watch, proposed, or needs-approval

Promotion gate:

- a feature cannot influence setup confidence unless freshness, coverage, and label alignment are documented.

### L2 Setup Detection

Goal: identify repeatable, explainable setup families before any model training.

Current setup families:

- range breakout long
- range breakdown short
- trend pullback reclaim long
- trend pullback reject short
- momentum reversal long
- momentum reversal short

Self-set goals:

- add regime context to every detected setup
- separate event-only move alerts from trade-setup candidates
- keep low-sample rows as learning inputs, not recommendations
- maintain a short list of B-tier candidates worth forward monitoring

Promotion gate:

- no A/high-probability label without sufficient sample size, positive expectancy over baseline, reasonable profit factor, and forward paper support.

### L3 Historical Backtest

Goal: estimate whether a setup family has historical edge in a specific symbol, timeframe, and regime.

Current outputs:

- `experiments/btc-eth-alert-edge/results/edge-snapshot.json`
- `experiments/btc-eth-alert-edge/results/edge-summary.md`

Self-set goals:

- compare every candidate to a simple baseline
- report expectancy in R, winrate, profit factor, and sample size together
- demote impressive raw expectancy when sample size is too small
- keep B/C/low-sample tiers honest and conservative

Promotion gate:

- backtest can qualify a setup for paper tracking; it cannot by itself justify live alert changes.

### L4 Forward Paper Ledger

Goal: test what happens after setups are detected in real time, without using real money.

Current output:

- `experiments/btc-eth-alert-edge/paper/signals.json`

Self-set goals:

- split paper results by tier, setup family, symbol, timeframe, and regime
- produce a forward-only dashboard so B-tier candidates are not mixed with low-sample noise
- track open, closed, hit-target, stop, timeout, and collision outcomes
- keep paper PnL in R, not dollars

Promotion gate:

- a setup cannot become high-confidence without forward paper evidence that supports the historical bucket.

### L5 Candidate Decision Layer

Goal: turn evidence into explicit candidate states, not vague confidence.

Allowed states:

- Watch
- Candidate
- Paper-Qualified
- Alert-Qualified
- Rejected
- Blocked

Self-set goals:

- maintain candidate pages with evidence, unknowns, and thresholds
- record why a candidate is not promoted
- prefer rejection over indefinite vague interest

Promotion gate:

- moving from Paper-Qualified to Alert-Qualified requires Tomas approval if it changes visible alert behavior.

### L6 Pre-ML Dataset Layer

Goal: build clean labels and features before training any model.

Candidate features:

- regime
- volatility bucket
- trend/range context
- setup family
- alert velocity
- wick size
- volume confirmation
- CVD proxy
- depth imbalance
- spread/depth shift
- funding/basis where available

Candidate labels:

- follow
- fade
- noisy
- TP before SL
- SL before TP
- max favorable excursion
- max adverse excursion

Self-set goals:

- repair missing public depth before using orderflow heavily
- keep labels deterministic and reproducible
- export compact training tables only after label quality is acceptable

Promotion gate:

- no ML model until feature coverage and labels are auditable.

### L7 ML Layer

Goal: add calibrated probability only after the pre-ML layer is clean.

Preferred first models:

- logistic regression
- gradient boosting
- random forest

Avoid at first:

- deep learning
- opaque overfit models
- models trained on incomplete orderflow labels

Self-set goals:

- require train/test split by time
- compare against rule-based baseline
- calibrate probabilities
- report false positives as seriously as wins

Promotion gate:

- a model is advisory only until it beats rule-based baseline out-of-sample and survives forward paper monitoring.

### L8 Human-Facing Knowledge Layer

Goal: make research readable and inspectable.

Current rails:

- OpenClaw wiki bridge
- Obsidian-compatible Markdown
- RALPH Research OS
- Crypto Updates wiki outputs

Self-set goals:

- keep durable summaries short and source-backed
- ingest important RALPH notes into OpenClaw wiki
- avoid syncing raw/runtime artifacts into human Obsidian vaults
- maintain an explicit "what changed" log after important runs

## Current Autonomous Goals

1. Build a forward paper dashboard split by tier and setup family.
2. Repair fresh public depth capture or document why it cannot be repaired with no-key public data.
3. Continue 4h alert-edge backtest and paper ledger refresh.
4. Promote only B-tier candidates with both historical and forward support.
5. Prepare, but do not train, an ML-ready feature/label table.
6. Keep Obsidian/OpenClaw wiki outputs readable enough that Tomas can inspect the system later.

## Current Non-Goals

- no live trading
- no autonomous execution
- no paid data acquisition
- no exchange account integration
- no wallet integration
- no hidden change to alert wording or trading implications
- no ML model until data coverage and labels are clean
