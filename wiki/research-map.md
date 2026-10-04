---
type: navigation
status: active
updated: 2026-10-04
tags:
  - ralph
  - research-map
  - navigation
  - obsidian
  - human-review
---

# RALPH Research Map

This is the human-facing map for RALPH. Use it when the workspace feels chaotic.

## Current Size

As of 2026-10-04:

- 197 dated research notes in `wiki/notes/`
- 51 concept/source/entity/comparison pages under `wiki/concepts/`, `wiki/sources/`, `wiki/entities/`, and `wiki/comparisons/`
- 61 experiment result Markdown reports under `experiments/*/results/`
- 57 experiment/source scripts under `experiments/*/src/`
- 202 source pages plus 10 reports in the OpenClaw bridge wiki
- 197/197 dated research notes now have valid frontmatter and explicit `tags:`

The most important number is not the total. The important thing is which lane a note belongs to and whether it is active, rejected, watch-only, or just background context.

## Current Branch Dashboard

<!-- BEGIN MANAGED CURRENT BRANCHES -->
Last generated: 2026-09-28T09:05:00Z

Use this section to choose the next bounded RALPH branch without rereading the whole vault.

| Branch | Lane | Status | Read first | Next allowed action |
| --- | --- | --- | --- | --- |
| `range_breakout_long + BTC_RISK_ON` survivor | DEMO-SIM / Alert-Edge Validation | `watch-only`, `research-only`, blocked by drawdown, ambiguous rows, loss cluster, and best-week concentration | `wiki/notes/2026-09-26-range-breakout-survivor-stress.md` and `wiki/concepts/impulse-exhaustion-research-branch.md` | Compare any future candidate against this baseline; do not promote it. |
| Impulse-exhaustion / impulse-decay | DEMO-SIM / Alert-Edge Validation | `postmortem-viable-only`, `not-forward-validated`, `no-promotion`; richer state scan also rejected forward validation | `wiki/concepts/impulse-exhaustion-research-branch.md` | Do not keep tuning this lane without new forward rows or richer breadth/flow/orderflow evidence. |
| Funding-persistence context | Strategy Families / DEMO-SIM context | `context-only`, `watch-only`, concentrated in 2026-08 / 2026-W34 | `wiki/notes/2026-09-27-funding-context-survivor-stress.md` | Keep as context/baseline only until separate cost, carry, tail, and account/margin accounting exists. |
| Planned-level public orderflow proxy | Orderflow / ATAS / TA Learning | `watch-only`, `research-only`, row gate satisfied, baseline mixed/no-promotion | `wiki/notes/2026-09-28-planned-level-proxy-refresh-baseline.md` and `experiments/strategy-destruction-filter/results/planned-level-proxy-baseline-check.md` | Use as falsification baseline; do not promote until richer labels beat candle MFE/MAE and explicit baselines. |
| PDH/PDL BTC-gated liquidity sweep long | DEMO-SIM / Alert-Edge Validation | `rejected`, `watch-only` | `wiki/notes/2026-09-26-pdh-pdl-second-gate-walk-forward.md` | Keep as a rejected reference; do not tune from the failed branch. |
| BTC-risk-on ORB continuation | DEMO-SIM / Alert-Edge Validation | `rejected`, `watch-only` | `wiki/notes/2026-09-26-btc-risk-on-orb-continuation-kill-test.md` | Keep as a rejected reference; do not tune the ORB window from this failed branch. |
| Range/grid offline falsifier | Strategy Families / Discovery | `rejected`, `watch-only` | `wiki/notes/2026-09-27-range-grid-offline-falsifier.md` | Keep as prior-art/falsifier memory; do not join it to DEMO-SIM or paper-fund surfaces. |
| Strategy-destruction filter | Strategy Families / Validation Infrastructure | `active`, `research-only`, no current survivors | `wiki/concepts/strategy-destruction-filter.md` | Use for strict falsification and validation hygiene, not go-live decisions. |
| USD-M absorption validation | Orderflow / DEMO-SIM context | `watch-only`, `research-only`, `no-promotion`; balanced, targeted, and full-path MFE/MAE rescore complete | `wiki/notes/2026-10-03-full-path-mfe-mae-usdm-absorption-rescore.md`, `wiki/notes/2026-09-29-targeted-usdm-absorption-falsification.md`, and `research-lanes/orderflow/README.md` | Absorption survived full-path MFE/MAE rescore as a research feature, but aligned CVD overlaps and evidence reuses frozen DEMO-SIM outcomes; stop tuning until fresh forward rows or a broader pre-registered sample. |
| Copytrading / wallet / cohort research | Copytrading / Wallet / Cohort Research | `watch-only`, `needs-approval` for richer exports; no live copying | `wiki/notes/2026-09-01-wallet-shadowing-existing-tool-coverage-map.md` | Wait for explicit access/export approval or a named independent event window before new sample runs. |
| Scheduler hygiene | Automation / Routing / Memory Hygiene | `verified-repaired`, no new recurring jobs | `automation/roadmap.md` and `automation/loop-state.yaml` | 2026-09-28 16:03 UTC alert-edge run verified the `demo-sim:all` payload; watch normal recurrence, no new scheduler. |

Current safest autonomous next branch, if cleanup continues: fix RALPH index/retrieval count drift. If research continues instead, use the planned-level proxy baseline as a falsifier before any richer orderflow-label work, or choose another bounded branch outside the impulse-decay lane. No live alerts, watcher logic, schedulers, sizing, TP/SL, or execution should change.

<!-- END MANAGED CURRENT BRANCHES -->

## Start Here

For a quick orientation, read in this order:

1. `automation/roadmap.md`
2. `automation/retrieval-router.yaml`
3. `automation/work-queues.yaml`
4. `wiki/research-map.md`
5. `wiki/concepts/impulse-exhaustion-research-branch.md` for the current DEMO-SIM survivor branch

For machine routing, `automation/retrieval-router.yaml` is canonical. For Tomas-readable orientation, this page is canonical.

## Main Lanes

### DEMO-SIM / Alert-Edge Validation

Approximate current notes: 65.

Purpose: test whether alert/backtest/paper rows survive baseline, fees, drawdown, walk-forward, and postmortems.

Current status:

- Broad DEMO-SIM paper fund is not capital-ready.
- Shorts are quarantined.
- `range_breakout_long + BTC_RISK_ON` is research/watch-only.
- The latest impulse-exhaustion branch is tagged `postmortem-viable-only`, `not-forward-validated`, and `no-promotion`.
- The richer impulse-decay state scan is also rejected for standalone forward validation.

Canonical current branch:

- `wiki/concepts/impulse-exhaustion-research-branch.md`

Useful recent notes:

- `wiki/notes/2026-09-27-survivor-cluster-postmortem.md`
- `wiki/notes/2026-09-27-impulse-exhaustion-cooldown-postmortem.md`
- `wiki/notes/2026-09-27-impulse-cooldown-purged-forward-test.md`
- `wiki/notes/2026-09-27-impulse-decay-state-feature-scan.md`
- `wiki/notes/2026-09-27-funding-context-survivor-stress.md`
- `wiki/notes/2026-09-26-range-breakout-survivor-stress.md`

### Orderflow / ATAS / TA Learning

Approximate current notes: 17.

Purpose: bring trader-grade context, ATAS exports, level behavior, and orderflow realism into the research process.

Current lane folder:

- `research-lanes/orderflow/README.md`
- `research-lanes/orderflow/atas-tardis-workflow.md`

Useful notes:

- `wiki/notes/2026-09-20-ralph-orderflow-exporter-usage-and-roadmap.md`
- `wiki/notes/2026-09-20-atas-manual-orderflow-rail.md`
- `wiki/notes/2026-09-29-balanced-usdm-absorption-validation.md`
- `wiki/notes/2026-09-29-targeted-usdm-absorption-falsification.md`
- `wiki/notes/2026-09-28-planned-level-proxy-refresh-baseline.md`
- `wiki/notes/2026-09-28-historical-orderflow-data-rails.md`
- `wiki/notes/2026-09-08-level-breakout-acceptance-baseline.md`
- `wiki/concepts/multi-timeframe-full-ta.md`

### Copytrading / Wallet / Cohort Research

Approximate current notes: 23.

Purpose: evaluate wallet shadowing, slow accumulators, Hyperliquid public routes, and cohort-flow ideas.

Current status:

- No live copying.
- Public/no-key routes are mostly discovery and feasibility.
- Access-gated products such as Nansen, Arkham, Dune, and richer exports remain approval-gated unless explicitly authorized.

Current lane folder:

- `research-lanes/copytrading/README.md`
- `research-lanes/copytrading/tool-access-map.md`

Useful notes:

- `wiki/notes/2026-09-01-wallet-shadowing-existing-tool-coverage-map.md`
- `wiki/notes/2026-09-01-hyperliquid-activity-defined-universe-route.md`
- `wiki/notes/2026-08-31-smart-money-cohort-discovery-layer.md`
- `wiki/concepts/wallet-shadowing-strategy-model.md`

### Discovery / Source Scans / Tools

Approximate current notes: 14.

Purpose: avoid building blindly. This lane checks existing tools, public sources, prior art, frameworks, and cheap falsifiers.

Current pricing/access folder:

- `research-lanes/vendor-access-pricing/README.md`
- `research-lanes/vendor-access-pricing/pricing-watchlist.md`

Useful notes:

- `wiki/notes/2026-09-29-miles-3-tier-ai-trading-setup-intake.md`
- `wiki/notes/2026-09-29-algorithmic-paper-trading-course-intake.md`
- `wiki/notes/2026-10-03-market-bot-reverse-engineering-backlog.md`
- `wiki/notes/2026-10-03-market-bot-reverse-engineering-source-map.md`
- `wiki/notes/2026-10-03-grid-range-claim-falsifier-contract.md`
- `wiki/notes/2026-10-03-strategy-spam-funnel-btc-first-pass.md`
- `wiki/notes/2026-10-04-strategy-spam-funnel-cleanup-btc-gated-alt-dedupe.md`
- `wiki/notes/2026-10-04-strategy-spam-survivor-stress.md`
- `wiki/notes/2026-10-04-strategy-spam-recurring-lane-contract.md`
- `wiki/notes/2026-09-26-demo-sim-profitable-strategy-source-scan.md`
- `wiki/notes/2026-08-30-build-vs-buy-decision-memo.md`
- `wiki/notes/2026-08-30-existing-tool-fit-map.md`
- `wiki/concepts/prior-art-before-experiment.md`

Algorithmic-system prior art:

- SnapTrade/Massive/Alpaca momentum course is watch-only architecture input for data -> signal -> portfolio -> paper/order boundary -> audit/reporting.
- Do not treat the 12-month equity momentum rule as a RALPH strategy candidate without separate crypto fit, baseline, and validation work.
- Miles Deutscher 3-tier AI trading setup is watch-only operator-interface prior art: useful for read-only visibility, context/interview files, trade ledger/review cadence, and mobile pause/status commands; do not import Tier 2/Tier 3 execution, broker/exchange connection, Telegram order routing, account keys, or confirmation-off workflows without separate approval and safety design.

### Automation / Routing / Memory Hygiene

Approximate current notes: 13.

Purpose: keep RALPH navigable, verifiable, and bounded.

Useful files:

- `automation/retrieval-router.yaml`
- `automation/work-queues.yaml`
- `automation/research-validation-checklist.mjs`
- `core/navigation.md`
- `core/loop-output-policy.md`

### Strategy Families / Concepts / Decisions

Approximate current notes: 14 plus concept pages.

Purpose: hold strategy-family maps and decision rules that are not tied to one experiment result.

Useful pages:

- `core/profitability-flywheel.md`
- `wiki/concepts/patient-retail-strategy-map.md`
- `wiki/concepts/funding-basis-structural-baseline.md`
- `wiki/concepts/strategy-destruction-filter.md`

### Metrics / Market Context Sources

Purpose: track non-price metrics, source routes, access status, and pricing before promoting metrics into experiments.

Current lane folder:

- `research-lanes/metrics/README.md`
- `research-lanes/metrics/metric-tool-map.md`

Current priority metrics:

- USD-M trades plus `bookDepth`
- mark/index/premium klines
- funding and open interest
- spot vs perp flow split
- consolidated derivatives rows from Coinalyze/CoinGlass/Velo/Laevitas only after access and cost are explicitly classified
- liquidation/positioning-map vendors such as Hyblock only as benchmark/trial candidates after a frozen manifest
- on-chain/wallet/entity flow only after approved export/API access

Recent source scan:

- `wiki/notes/2026-09-29-derivatives-metrics-vendor-access-scan.md`

## Tag Vocabulary

Use these tags in frontmatter for new notes.

Core identity:

- `ralph`
- `research-only`
- `human-review`

Lane tags:

- `demo-sim`
- `alert-edge`
- `orderflow`
- `atas`
- `wallet-shadowing`
- `copytrading`
- `source-scan`
- `automation`
- `strategy-family`

Status tags:

- `active`
- `watch-only`
- `rejected`
- `postmortem-viable-only`
- `not-forward-validated`
- `forward-validation-candidate`
- `no-promotion`
- `needs-approval`
- `blocked`

Boundary tags:

- `no-live-trading`
- `no-execution`
- `no-cron-change`
- `no-demo-sim-all`
- `no-paper-fund`
- `approval-required`

Evidence tags:

- `purged-forward-test`
- `walk-forward`
- `postmortem`
- `baseline-comparison`
- `drawdown-risk`
- `fee-stress`
- `btc-risk-on`
- `impulse-exhaustion`
- `synchronized-loss-cluster`

## Tomas Notes

Put your own RALPH notes in:

- `wiki/notes/tomas-notes-inbox.md` for quick unstructured thoughts
- or a dated note such as `wiki/notes/2026-09-27-your-topic.md` if the thought belongs to a specific branch

Recommended frontmatter for your own note:

```yaml
---
type: tomas-note
status: inbox
tags:
  - ralph
  - human-note
  - needs-triage
related:
  - wiki/research-map.md
---
```

Keep your notes simple. RALPH can later triage them into a concept, decision, queue item, or experiment.

## Rule Going Forward

Every new durable RALPH note should have:

- `type`
- `status`
- `tags`
- `related`
- a short "Boundary" or "Unchanged" section if it touches trading, schedulers, alerts, accounts, sizing, TP/SL, or execution

No more untagged branches. As of 2026-09-27, the existing dated `wiki/notes/` backlog has been conservatively backfilled with lane/status/search tags and verified with `noteFrontmatter` in `automation/research-validation-checklist.mjs`.
