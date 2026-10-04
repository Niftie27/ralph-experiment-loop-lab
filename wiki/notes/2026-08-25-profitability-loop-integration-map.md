---
type: note
created: 2026-08-25T22:05:00Z
topic: profitability-loop
status: active
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../../automation/current-operating-map.md
  - ../../automation/ralph-autoresearch-loop.md
  - ../../experiments/btc-eth-alert-edge/README.md
  - ../concepts/strategy-destruction-filter.md
  - ../concepts/forward-paper-trade-gate.md
  - ../notes/2026-08-19-high-probability-setup-router.md
  - ../notes/2026-08-21-alert-feedback-data-analysis.md
  - ../notes/2026-08-11-orderflow-feature-taxonomy.md
  - ../concepts/wallet-shadowing-strategy-model.md
---
# Profitability Loop Integration Map

Status: research-only operating map. This does not authorize live trading, autonomous order placement, exchange keys, wallet keys, paid APIs, new recurring jobs, or alert wording changes.

## Goal

RALPH's profitability loop should become a repeatable paper/demo evidence machine:

1. generate strategy hypotheses;
2. destroy weak ideas on historical data;
3. forward paper trade surviving or near-surviving ideas;
4. log signals, no-signals, context, outcomes, and management notes;
5. use postmortems to improve the next batch;
6. promote almost nothing until out-of-sample, walk-forward, and paper evidence agree.

The loop should run many well-logged paper observations, but keep the promotion gate strict.

## Component Contract

| Component | Role | Promotion authority |
| --- | --- | --- |
| `liquid-crypto-alert-edge-backtest` | High-throughput paper signal generator, historical bucket stats, liquid-universe refresh, and forward paper ledger. | Can qualify candidate buckets for deeper testing; cannot promote live alerts or demo automation by itself. |
| `strategy-destruction-filter` | Historical idea kill gate with explicit rules, costs, baselines, hostile slices, PSR-style diagnostics, and walk-forward diagnostics. | Can reject ideas or mark research leads; paper promotion requires stable OOS/walk-forward evidence. |
| `ralph-autoresearch-loop` | Scheduled or manual bounded researcher that mines notes, paper outcomes, external prior art, and local reports into the next small experiment. | Can update research memory and propose next work; notification only on significant candidate, repeated blocker, or explicit request. |
| Crypto Updates watcher / alert feedback | Event and volume velocity observation surface plus finalized follow/fade/noisy labels. | Provides candidate buckets and labels only; noisy alerts are not trade instructions. |
| Public orderflow / hftbacktest artifacts | Execution-realism and microstructure feature layer for CVD, imbalance, spread, latency, queue, and fill assumptions. | Can strengthen or falsify a setup after beating price-only baselines; not a direct trading permission. |
| Wallet shadowing / copytrading notes | Radar and hypothesis source, especially slow accumulator / cohort behavior. | Fast blind copy is rejected by default; slow/cohort ideas must pass forward paper trade gates. |
| Obsidian / RALPH wiki | Source memory, routing map, and durable decision log. | Keeps future runs from restarting or overclaiming. |
| Computer-use | Optional adapter for browser-only demo UIs, chart export, TradingView, Obsidian GUI, and platform dashboards. | Proposed/needs-access-verification; not core strategy logic. |

## Routing Rules

- Alert-edge B/C historical buckets become candidate ideas only when the sample, baseline lift, regime, and paper ledger are explicit.
- Low-sample and avoid rows remain learning inputs, even when recent paper R looks good.
- Strategy-destruction candidates must use the strict idea spec before backtesting.
- Orderflow features are attached as context and execution-realism checks before they are allowed to affect confidence.
- Wallet/trader shadowing starts as radar unless the holding period is slow enough to survive detection, processing, execution delay, fees, slippage, and beta adjustment.
- Computer-use should be audited before use; prefer public/no-key APIs and local files first.

## Current Evidence Snapshot

Latest inspected alert-edge dashboard generated `2026-08-25T20:04:25Z`:

- total paper signals: `129`, closed `126`, total `+33.6513R`, average `+0.2671R`;
- A/B/C subset: `12` total, `11` closed, winrate `54.5%`, total `+5.8R`, average `+0.5273R`;
- B tier: `8` closed, winrate `75.0%`, total `+8.8R`, average `+1.1R`;
- C tier: `4` total, `3` closed, winrate `0.0%`, total `-3R`;
- latest open signals: BNB 4h long `trend_pullback_reclaim_long` tier C, LINK 4h long `trend_pullback_reclaim_long` low-sample twice.

Read: B-tier range-breakout evidence is worth mining into explicit strategy candidates, but the qualified paper sample is still too small for A/high-probability claims. C-tier should be treated skeptically until forward evidence improves.

Latest inspected strategy-destruction state after adding the first alert-edge bucket candidate:

- `8` candidates / `69` variants / `0` survivors;
- `XRP 4h range_breakout_long up/mid-vol` was converted from alert-edge B-tier into `alert-edge-xrp-range-breakout-v0`;
- best XRP variant: sample `134`, expectancy `0.0278R`, profit factor `1.0435`, deflated-Sharpe proxy `-0.0183`, out-of-sample expectancy `0.2115R`, baseline lift `-0.0978R`, max drawdown `24.9469R`, `3/5` positive folds;
- verdict: rejected because headline expectancy, profit factor, deflated-Sharpe, drawdown, and baseline lift were too weak, despite positive OOS.
- HYPE funding fade remains a research lead, not paper promotion;
- walk-forward diagnostics weakened the best headline variant.

## Volume Velocity Path

The existing watcher and `alert-feedback.jsonl` already contain `VELOCITY` buckets. The useful route is:

`watcher event -> alert feedback review -> alert-edge/paper ledger -> autoresearch bucket stats -> strict strategy candidate -> destruction filter -> forward paper gate`

Known local reads:

- HYPE `VELOCITY 5m DOWN score 0` had `12` joined samples and a possible continuation read, but HYPE lacked signed flow/book evidence in that path.
- HYPE `VELOCITY 60s DOWN score 0` had `9` joined samples and a possible exhaustion/fade read, still event-only.
- Mixed score buckets and pre-fix book freshness bugs block promotion.

Next smallest useful work: rerun the alert feedback join with data-quality exclusions, then convert only the best velocity bucket into a strict candidate spec if the cleaned sample still has a coherent mechanism.

## Orderflow Path

Orderflow should answer whether a setup is real or just price motion:

- compare price-only outcomes to price-plus-orderflow outcomes;
- keep assets/source rows separated;
- reject stale book rows, negative `bookAgeMs`, missing timestamp evidence, and source-mismatched HYPE rows;
- use hftbacktest-style replay for latency, queue, fee, and fill realism before any execution-facing claim.

The existing 2-4 hour no-key BTC capture proved replay feasibility, not edge.

## Copytrading / Shadowing Path

Use prior art and existing tools first. Copytrading is split:

- fast perp copytrading: default radar/prior-art only because latency, worse fills, and leaderboard survivorship are likely fatal;
- slow accumulator following: viable candidate branch if cohort-based, selected by activity rather than PnL leaderboard, and validated through round-trip forward paper testing.

No wallet is copyable until it passes the forward paper trade gate.

## Demo / Paper Trading Implication

The local paper ledger is the default engine now. A browser/demo account can be useful later for GUI-only platforms or exchange-paper lifecycle realism, but the next profitable-trader work should first improve the local loop:

- more clean paper samples;
- cleaner bucket-to-candidate conversion;
- better postmortems;
- stricter distinction between observation, candidate, paper-qualified, and alert-qualified.

## Next Bounded Run

Recommended next manual/autoresearch item:

1. inspect `paper-dashboard.json` and `edge-snapshot.json`;
2. either convert the next strongest alert-edge B-tier bucket, or write a reusable adapter that imports alert-edge bucket filters into strict strategy specs;
3. include paper-support requirements and low-sample kill criteria;
4. test through `strategy-destruction-filter`;
5. leave C-tier and low-sample rows as learning inputs.

## Self-Check

- Used Obsidian-aware startup/status checks and local RALPH notes before writing.
- Used public/free/local data only.
- No live trading, orders, account setup, keys, paid APIs, cron changes, alert wording, risk, sizing, or execution changes.
- Prior-art/wheel gate applied as a routing rule: reuse existing alert-edge, orderflow, wallet-shadowing, and wiki artifacts before building new machinery.
- Verification passed after code changes: candidate validation, 24/24 tests, data audit, feature study, filter, and verify.
