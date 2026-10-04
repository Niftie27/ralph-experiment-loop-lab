# Log

# 2026-10-04T08:52:00Z - strategy spam recurring lane contract

- Trigger: Tomas said to continue after the survivor stress pass. The manual survivor did not justify promotion, but the strategy-spam process itself is useful as a recurring research furnace.
- Output: added `wiki/notes/2026-10-04-strategy-spam-recurring-lane-contract.md`; updated `experiments/strategy-destruction-filter/src/run-strategy-spam-funnel.mjs` with `STRATEGY_SPAM_PROFILE=recurring`; added npm script `study:strategy-spam-funnel:recurring`; updated `src/verify-filter.mjs`, `automation/ralph-autoresearch-loop.md`, `automation/loop-state.yaml`, `automation/current-operating-map.md`, `automation/work-queues.yaml`, `wiki/research-map.md`, and `index.yaml`.
- Recurring lane shape: no new standalone cron; existing `ralph-autoresearch-loop` may choose strategy spam at most weekly or when no ready-now branch exists. Recurring command is `npm run study:strategy-spam-funnel:recurring --prefix ralph-research-os/experiments/strategy-destruction-filter`; recurring profile is capped at 300 variants and includes BTC volume breakout, BTC RSI fade, BTC MA reclaim/reject, and BTC-gated alt MA reclaim/reject.
- Guardrails: outputs stay outside `seed-strategies.json`; survivors require `study:strategy-spam-survivor-stress` and manual review before candidate wording; no normal notification unless a genuine HITL candidate decision appears.
- Verification: `node --check src/run-strategy-spam-funnel.mjs`; manual full spam rerun; `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`; YAML/checklist verification.
- Boundary: no standalone cron, scheduler cadence, delivery, live trading, orders, keys, paid APIs, account setup, wallet connection, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, candidate import, or strategy promotion changed.

# 2026-10-04T08:40:00Z - strategy spam survivor stress

- Trigger: Tomas said to continue after the spam funnel cleanup found one SOL 4h BTC-gated MA reclaim/reject research survivor.
- Output: added `experiments/strategy-destruction-filter/src/run-strategy-spam-survivor-stress.mjs`; added npm script `study:strategy-spam-survivor-stress`; generated `results/strategy-spam-survivor-stress.json` and `.md`; updated `src/verify-filter.mjs`; added `wiki/notes/2026-10-04-strategy-spam-survivor-stress.md`; updated queue/map/index/log/memory state.
- Result: verdict `watch_only_survivor_stress_failed`. Base survivor still passes (262 sample, expectancy `0.1391R`, PF `1.2595`, OOS `0.1089R`, DD `15.2085R`) and stricter BTC gate also passes (196 sample, expectancy `0.1582R`, PF `1.2980`, OOS `0.1420R`, DD `12.7317R`). But extra 20 bps round-trip rejects on weak PF (`1.1205`), ETH 4h transfer rejects hard (expectancy `-0.1271R`, DD `47.3175R`), and SOL 1h transfer rejects hard (expectancy `-0.0769R`, DD `99.2511R`).
- Interpretation: the survivor is useful as a falsification target and evidence that BTC-gated alt spam can surface pockets, but it is not robust enough for candidate import or recurring promotion behavior. Long side carries nearly all edge; shorts are near-flat.
- Verification: `node --check src/run-strategy-spam-survivor-stress.mjs`; `npm run study:strategy-spam-survivor-stress --prefix ralph-research-os/experiments/strategy-destruction-filter`; `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`; `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter`.
- Boundary: no live trading, orders, keys, paid APIs, account setup, wallet connection, scheduler/cron change, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, candidate import, or strategy promotion changed.

# 2026-10-04T08:30:00Z - strategy spam funnel cleanup with BTC-gated alts

- Trigger: Tomas asked to continue after approving the recurring strategy-spam direction; previous session had handoffed before compaction risk.
- Output: updated `experiments/strategy-destruction-filter/src/run-strategy-spam-funnel.mjs` with a rotating batch manifest, effective metric-shape dedupe, and ETH/SOL alt spam behind an explicit BTC regime gate; updated `src/engine.mjs` with an optional research-only `signalGate`; updated `src/verify-filter.mjs`; regenerated `results/strategy-spam-funnel-btc-first-pass.json` and `.md`; added `wiki/notes/2026-10-04-strategy-spam-funnel-cleanup-btc-gated-alt-dedupe.md`; updated queue/map/index state.
- Result: 7 families / 390 variants / 1 survivor / 389 rejected / 10 near misses. Effective metric-shape dedupe found 367 shapes, 11 duplicate metric-shape groups, and 23 duplicate variant rows. BTC gate checked 164884 ETH/SOL alt signals, passed 64036, blocked 100848, and had zero stale BTC rows.
- Survivor: `spam-alt-btc-gated-ma-reclaim-v0#57`, SOL 4h, fast `20`, slow `50`, RSI floor/ceiling `45/50`; sample `262`, expectancy `0.1391R`, PF `1.2595`, OOS `0.1089R`, baseline lift `0.0357R`, max DD `15.2085R`, no current gate failures. This is a research survivor only; no candidate import or strategy promotion.
- Verification: `node --check src/run-strategy-spam-funnel.mjs`; `node --check src/engine.mjs`; `npm run study:strategy-spam-funnel --prefix ralph-research-os/experiments/strategy-destruction-filter`; `node --check src/verify-filter.mjs`; `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter`; `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`.
- Next: run survivor-specific stress before any recurring wiring; only after that, consider adding the spam funnel as an owned mode inside existing `ralph-autoresearch-loop`. No standalone cron yet.
- Boundary: no live trading, orders, keys, paid APIs, account setup, wallet connection, scheduler/cron change, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, candidate import, or strategy promotion changed.

# 2026-09-29T15:08:00Z - Miles 3-tier AI trading setup intake

- Trigger: Tomas provided a Miles Deutscher newsletter transcript about a 3-tier setup where AI reads broker data, can route orders through Interactive Brokers Trader Workstation/API, and can be controlled from a phone via Telegram; the transcript also included an interview-first crypto trading bot prompt.
- Output: added `wiki/notes/2026-09-29-miles-3-tier-ai-trading-setup-intake.md`; updated `automation/work-queues.yaml` with source-intake done item `miles-3-tier-ai-trading-setup-intake-2026-09-29` and Watch item `ralph-operator-console-human-in-the-loop-prior-art`; linked the note from `wiki/research-map.md`; updated daily memory.
- Result: classified the source as RALPH operator-interface / human-in-the-loop execution prior art, not an execution feature. Useful pieces are tiered autonomy, read-only-first workflow, `Trading_Context.md`, explicit no-trade conditions, ledger/review cadence, mobile status/pause commands, and paper/human-approval gates.
- Safety interpretation: Tier 2/Tier 3 execution, TWS/API order routing, Telegram command execution, always-on listener/token handling, broker/exchange account connection, disabled confirmations, sizing/TP/SL, and live/paper execution remain out of scope without separate explicit approval and a fresh safety spec.
- Boundary: no IBKR/Claude/TWS/Telegram setup, account connection, API key, wallet key, exchange key, paper/live order routing, scheduler, live alert wording, thresholds, sizing, TP/SL, execution behavior, paid service, or strategy promotion changed.

# 2026-09-29T14:55:00Z - algorithmic paper trading course intake

- Trigger: Tomas provided a course transcript about building a Python/Django algorithmic paper-trading system with Massive market data, SnapTrade brokerage connection, Alpaca paper trading, and 12-month equity momentum.
- Output: added `wiki/notes/2026-09-29-algorithmic-paper-trading-course-intake.md`; updated `automation/work-queues.yaml` with source-intake done item `algorithmic-paper-trading-course-intake-2026-09-29` and Watch item `algorithmic-paper-trading-system-prior-art`; linked the note from `wiki/research-map.md`; updated daily memory.
- Result: classified the source as RALPH algorithmic-system prior art, not a crypto strategy candidate. Useful pieces are data/signal/portfolio/order-boundary/performance model separation, paper-first architecture, rate-limit/caching patterns, admin/dashboard observability, and explicit brokerage permission boundaries. Weak transfer: US equity momentum and Alpaca/SnapTrade assumptions do not directly map to crypto perps/orderflow.
- Verification: checked official docs/search snippets for SnapTrade, Massive, and Alpaca current surfaces; YAML parse and research-validation checklist were run after editing.
- Boundary: no SnapTrade/Alpaca/Massive account, key, OAuth, brokerage connection, paper order route, live trading, scheduler, alert logic, thresholds, sizing, TP/SL, execution, paid/API setup, or strategy promotion changed.

# 2026-09-29T14:42:00Z - USD-M absorption validation backlog item

- Trigger: Tomas asked to save the recommended next step to the backlog before moving to two new topics.
- Output: added `usdm-absorption-balanced-manifest-validation` to `automation/work-queues.yaml` Watch items and documented the shape in `research-lanes/orderflow/README.md` plus `wiki/research-map.md`.
- Backlog shape: balanced 60-120 row frozen DEMO-SIM manifest, diversified by date/week, symbol, setup, direction, timeframe, BTC gate, and outcome; re-run public/no-key USD-M `trades` + `bookDepth`; compare absorption, liquidity-thinning, and aligned CVD against same setup/regime rows; kill the idea to context-only if lift disappears outside the original cluster.
- Boundary: no scheduler, live/demo/paper alert logic, thresholds, sizing, TP/SL, execution, paid/API key/account access, or strategy promotion changed.

# 2026-09-29T14:10:00Z - USD-M orderflow DEMO-SIM broader batch

- Trigger: Tomas said to continue after the derivatives metrics vendor scan; selected the current orderflow lane's next useful batch.
- Output: updated `experiments/strategy-destruction-filter/src/run-usdm-orderflow-demo-sim-batch.mjs`, `src/verify-filter.mjs`, regenerated `results/usdm-orderflow-demo-sim-batch.json` and `.md`, and updated orderflow research notes/state/memory.
- Result: broader batch analyzed 30 frozen DEMO-SIM rows and joined all 30 to public/no-key Binance USD-M futures `trades` plus `bookDepth`. Verdict is `usdm_archive_features_broader_sample_ready_no_promotion`. Absorption proxy rows were descriptively stronger (22 rows, 54.55% win rate, mean R 0.4023, median R 1.1994, net +1630.84 USD) than unflagged rows (8 rows, 0% win rate, mean R -1.1122, net -1606.66 USD). Liquidity-thinning proxy rows were bad in this sample (7 rows, 0% win rate, mean R -1.0718, net -1251.01 USD).
- Implementation finding: the 30-window scale exposed a V8 stack limit from `out.push(...day.trades)` on large parsed trade arrays. The runner now appends rows with loops.
- Verification: `node --check src/run-usdm-orderflow-demo-sim-batch.mjs`; `USDM_ORDERFLOW_BATCH_WINDOWS=30 npm run study:usdm-orderflow-demo-sim --prefix ralph-research-os/experiments/strategy-destruction-filter`; `node --check src/verify-filter.mjs`; `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`.
- Boundary: no scheduler, cron, watcher/paper/demo alert logic, paid signup, account, API key, wallet connection, live copying, live trading, orders, thresholds, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-29T07:30:00Z - DEMO-SIM paper-fund ledger implementation verification

- Selected item: `validation.demo-sim-paper-fund-ledger-implementation`.
- Result: the ledger implementation already exists and is wired as `npm run demo-sim:ledger`; this run verified it rather than rebuilding. Refreshed status remains `capital_impaired_review_required`: 490 closed trades from 500 source records, 6651.64 USDT ending equity from 10000.00 starting capital, -3348.36 USDT net after 5390.00 USDT fees, 36.12% winrate, PF 0.9460, and 84.86% max drawdown.
- Verification: `node --check src/demo-sim-paper-fund-ledger.mjs` passed; `npm run demo-sim:ledger --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed. No web checks or paid/keyed sources were used. The item is already in `automation/work-queues.yaml` validation done; `automation/loop-state.yaml` now removes it from current priority so the next bounded item is `demo-sim-paper-fund-drawdown-and-risk-report`.
- Reassess: effective and sensible for capital discipline because it prevents rerunning stale implementation work and keeps attention on risk/drawdown reporting. Confidence is high for implementation presence and current ledger numbers, but the ledger remains synthetic DEMO-SIM evidence, not live-capital evidence.
- Boundary: no live/demo sizing, watcher/paper alert logic, scheduler, threshold, TP/SL, execution, account/key/API, paid source, public posting, or strategy promotion changed.

# 2026-09-29T06:50:00Z - derivatives metrics vendor access scan

- Trigger: Tomas said to continue after creating the orderflow, metrics, vendor-pricing, and copytrading research lanes.
- Output: added `wiki/notes/2026-09-29-derivatives-metrics-vendor-access-scan.md`; updated `research-lanes/metrics/metric-tool-map.md`, `research-lanes/vendor-access-pricing/pricing-watchlist.md`, `wiki/research-map.md`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`, and `memory/2026-09-29.md`.
- Result: Coinalyze is now classified as a free-key candidate for OI/funding/liquidations/long-short/buy-sell rows, but still needs account/API-key approval. Velo is a `$199/month` paid API candidate with 3-month monthly history and fuller annual history. Laevitas is a PAYG/x402 watch source for targeted derivatives/options rows without a subscription. Hyblock is a high-fit but expensive liquidation/positioning benchmark at `$4,788/year` Professional launch pricing. TensorCharts is manual orderflow visual prior art only until current pricing/export path is verified.
- Verification: source facts came from official/vendor-controlled docs/pages; no API credentials were used. YAML parse passed with local Python/PyYAML. `research-validation-checklist.mjs` kept the known overall `fail` state because of pre-existing retrieval failure, cron warning, and paper-demo `not-ready`; touched-note frontmatter, path refs, HITL, loop quality, handoff readiness, and boundary delta passed.
- Boundary: no scheduler, cron, watcher/paper/demo alert logic, paid signup, account, API key, wallet connection, live copying, live trading, orders, thresholds, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-27T08:10:00Z - impulse exhaustion cooldown postmortem

- Selected item: `validation.impulse-exhaustion-cooldown-postmortem`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-impulse-exhaustion-cooldown-postmortem.mjs`, producing `results/demo-sim-impulse-exhaustion-cooldown-postmortem.json` and `.md`. Added standalone package script `demo-sim:impulse-cooldown-postmortem`; did not add it to `demo-sim:all` or any cron/scheduler payload.
- Result: verdict `cooldown_candidate_needs_forward_test`. Baseline selected survivor was 107 trades, +9035.42 USDT, PF 1.6348, 24.54% max drawdown. The target-symbol prior-72h return >25% skip kept 81 trades and improved to +10471.10 USDT, PF 2.3427, 10.43% max drawdown; skipped rows were net negative (-1435.68 USDT). The alt-basket prior-72h median return >20% skip kept 76 trades, +9123.77 USDT, PF 2.1612, 7.83% max drawdown.
- Context finding: `btc_hot|alt_hot|target_hot` was the obvious danger bucket: 19 trades, -3586.65 USDT, PF 0.3405, 42.23% max drawdown. Target-symbol overextension is the best first crude proxy, but this is postmortem-selected evidence only.
- Interpretation: this is not a promotion; it defines the next validation. Recommended next route is a standalone purged forward test of target-symbol prior-72h return >25% as a no-trade/cooldown rule, with alt-basket >20% as comparison.
- Verification: `node --check src/demo-sim-impulse-exhaustion-cooldown-postmortem.mjs` passed; `npm run demo-sim:impulse-cooldown-postmortem --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed; `work-queues.yaml` and `package.json` parsed; `demo-sim:all` still excludes the impulse cooldown postmortem. `research-validation-checklist.mjs` ran with queue/path/delivery/HITL/boundary checks passing; overall remains `fail` because of pre-existing retrieval failure, subsystem/cron warnings, and paper-demo `not-ready`.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-27T08:00:00Z - survivor cluster postmortem

- Selected item: `validation.survivor-cluster-postmortem`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-survivor-cluster-postmortem.mjs`, producing `results/demo-sim-survivor-cluster-postmortem.json` and `.md`. Added standalone package script `demo-sim:survivor-cluster-postmortem`; did not add it to `demo-sim:all` or any cron/scheduler payload.
- Result: verdict `cluster_explains_survivor_but_not_robust_edge`. The selected `range_breakout_long + BTC_RISK_ON` survivor has 107 closed, +9035.42 USDT, PF 1.6348, 50.5% winrate, 24.54% max drawdown. Focus week 2026-W34 contributes 66 trades, +7827.87 USDT, PF 1.9714, 59.1% winrate; outside that week the same selected survivor drops to +1207.55 USDT, PF 1.1956, 36.6% winrate.
- Market context: BTC returned +19.8% over the focus week, with BTC risk-on share 100.0%. The focus was broad: 7/8 symbols were positive in selected rows, and local candle week returns were strongly positive across the alt set.
- Failure mode: synchronized post-impulse loss, not one bad symbol. Worst cluster was 2026-08-22T04:00Z to 05:00Z, 13 trades, -4752.49 USDT across AVAX, BNB, DOGE, ETH, LINK, SOL, XRP.
- Interpretation: the useful pocket looks like short-lived broad alt risk-on expansion under BTC confirmation, not a durable standalone range-breakout rule. Next research should look for no-trade/cool-down conditions after synchronized impulse, not more naive entry variants.
- Verification: `node --check src/demo-sim-survivor-cluster-postmortem.mjs` passed; `npm run demo-sim:survivor-cluster-postmortem --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed; `work-queues.yaml` and `package.json` parsed; `demo-sim:all` still excludes the survivor cluster postmortem. `research-validation-checklist.mjs` ran with queue/path/delivery/HITL/boundary checks passing; overall remains `fail` because of pre-existing retrieval failure, subsystem/cron warnings, and paper-demo `not-ready`.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-27T07:50:00Z - funding context survivor stress

- Selected item: `validation.funding-context-survivor-stress`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-funding-context-survivor-stress.mjs`, producing `results/demo-sim-funding-context-survivor-stress.json` and `.md`. Added standalone package script `demo-sim:funding-survivor-stress`; did not add it to `demo-sim:all` or any cron/scheduler payload.
- Rule: rejoin existing cached public/no-key Hyperliquid funding rows to existing DEMO-SIM replay rows; restrict to `range_breakout_long + BTC_RISK_ON + persistent_positive`; stress remove-best symbol/month/week, fees/costs, stale/missing funding, top-pocket drawdown, and loss clusters.
- Result: verdict `reject_week_concentration`. Persistent-positive funding remained positive overall: 55 closed, +6420.03 USDT per 10k toy equity, PF 1.8497, 58.2% winrate, 22.83% max drawdown. But it failed remove-best-month and remove-best-week: all 55 trades were in 2026-08, and removing 2026-W34 left only 3 trades at -80.31 USDT / PF 0.8647. Top-pocket persistent-positive drawdown remained 26.69%, above the 25% readiness gate.
- Interpretation: funding is useful explanatory context, not a robust promotion filter. Do not wire to DEMO-SIM paper fund, live alerts, watchers, sizing, TP/SL, execution, or schedulers.
- Verification: `node --check src/demo-sim-funding-context-survivor-stress.mjs` passed; `npm run demo-sim:funding-survivor-stress --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed; `work-queues.yaml` and `package.json` parsed; `demo-sim:all` still excludes the funding survivor stress script. `research-validation-checklist.mjs` ran with queue/path/delivery/HITL/boundary checks passing; overall remains `fail` because of pre-existing retrieval failure, subsystem/cron warnings, and paper-demo `not-ready`.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-27T07:30:00Z - range grid offline falsifier

- Selected item: `validation.range-grid-offline-falsifier`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-range-grid-offline-falsifier.mjs`, producing `results/demo-sim-range-grid-offline-falsifier.json` and `.md`. Added standalone package script `demo-sim:range-grid-falsifier`; did not add it to `demo-sim:all` or any cron/scheduler payload.
- Rule: existing local Binance spot 4h candles for BTC, ETH, and SOL; prior-only rolling 180-candle range; buy at first inner grid level, sell at upper inner grid level, stop half a grid step below lower range, time-exit after 12 bars; BTC `BTC_TRANSITION` gate by close/MA20/MA50; 12 bps round-trip cost.
- Result: verdict `reject_loses_to_no_trade`. Grid total: 292 trades, -140605.35 USDT per 10k accounting surface, PF 0.0576, 11.3% winrate, 1411.79% max drawdown, and 206 stop/trend-break exits. Every symbol was deeply negative: BTC -33958.61, ETH -48915.78, SOL -57730.96 USDT per 10k.
- Interpretation: trend-break losses dominate the fixed range-grid mean-reversion wins. Keep range-grid as rejected/watch-only reference; do not join to DEMO-SIM paper fund, live alerts, watchers, sizing, TP/SL, execution, or schedulers.
- Verification: `node --check src/demo-sim-range-grid-offline-falsifier.mjs` passed; `npm run demo-sim:range-grid-falsifier --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed; `work-queues.yaml` and `package.json` parsed; `demo-sim:all` still excludes the range-grid falsifier. `research-validation-checklist.mjs` ran with queue/path/delivery/HITL/boundary checks passing; overall remains `fail` because of pre-existing retrieval failure, subsystem/cron warnings, and paper-demo `not-ready`.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-27T07:22:00Z - funding persistence re-verification after resume

- Trigger: Tomas asked to continue where the interrupted RALPH funding-context run left off.
- Result: existing `validation.funding-persistence-context-baseline` artifacts were present and coherent: standalone script, standalone npm script, public/no-key Hyperliquid cache, result JSON/Markdown, note, roadmap, and queue state.
- Verification rerun: `node --check ralph-research-os/experiments/btc-eth-alert-edge/src/demo-sim-funding-persistence-context-baseline.mjs` passed; `npm run demo-sim:funding-persistence --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed; `work-queues.yaml` parsed; `demo-sim:all` still does not include the funding script.
- Result reminder: `persistent_positive` funding context remains a useful research-only hint for `range_breakout_long + BTC_RISK_ON`, not a strategy promotion and not carry/account/margin/sizing/execution logic.
- Notification: concise Telegram result sent via OpenClaw, accepted as messageId `7039`. Visible read-back could not be independently verified because no Telegram read/history tool was available in this turn.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-26T21:45:00Z - funding persistence context baseline

- Selected item: `validation.funding-persistence-context-baseline`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-funding-persistence-context-baseline.mjs`, producing `results/demo-sim-funding-persistence-context-baseline.json` and `.md`, plus local public cache `data/funding/hyperliquid-funding-history-demo-sim.json`. Added standalone package script `demo-sim:funding-persistence`; did not add it to `demo-sim:all` or any cron/scheduler payload.
- Access check: Hyperliquid public/no-key `metaAndAssetCtxs` exposed all DEMO-SIM replay symbols and `fundingHistory` returned rows without account, key, paid service, or scheduler changes. Cache contains 4500 funding rows for ADA, AVAX, BNB, BTC, DOGE, ETH, LINK, SOL, and XRP.
- Result: verdict `funding_context_improves_research_bucket`. Baseline `range_breakout_long + BTC_RISK_ON`: 107 closed, +9035.42 USDT per 10k toy equity, PF 1.6348, 50.5% winrate, 24.54% max drawdown. Funding-available subset: 69 closed, +7747.56 USDT, PF 1.8955, 58.0% winrate, 21.49% max drawdown. Best bucket `persistent_positive`: 55 closed, +6420.03 USDT, +116.73 USDT/trade, PF 1.8497, 58.2% winrate, 22.83% max drawdown; average PnL lift versus BTC regime alone was +32.28 USDT/trade and PF lift was +0.2149.
- Interpretation: persistent positive funding is a useful research context hint for the current survivor, not a strategy promotion and not carry/account/margin/sizing/execution logic. It still inherits survivor-stress blockers: synthetic replay, selected-after-grid bias, top-pocket drawdown, negative ambiguous rows, loss-cluster risk, and week concentration.
- Verification: public/no-key access probe passed; `node --check src/demo-sim-funding-persistence-context-baseline.mjs` passed; `npm run demo-sim:funding-persistence --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-26T19:05:00Z - BTC risk-on ORB continuation kill test

- Selected item: `validation.btc-risk-on-opening-range-breakout-continuation`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-orb-continuation.mjs`, producing `results/demo-sim-orb-continuation.json` and `.md`. Added standalone package script `demo-sim:orb-continuation`; did not add it to `demo-sim:all`, cron, or any scheduler payload.
- Result: fixed UTC 4h ORB acceptance is rejected. Primary ORB walk-forward: 329 trades, -3206.24 USDT per 10k toy equity, PF 0.8947, 45.59% winrate, 99.47% max drawdown, and only 1/5 positive forward months. Touch-only OR-high baseline was also negative: 368 walk-forward trades, -4609.44 per 10k, PF 0.8683. No-trade beats both on capital preservation, and existing `range_breakout_long + BTC_RISK_ON` replay remains much stronger at 107 trades, +9035.42 per 10k, PF 1.6348, and 24.54% max drawdown.
- Interpretation: do not tune this ORB branch from the failed fixed rule. Keep `range_breakout_long + BTC_RISK_ON` as the only current watch pocket, still not promoted because strict-filter and capital-impairment blockers remain.
- Verification: `node --check src/demo-sim-orb-continuation.mjs` passed; `npm run demo-sim:orb-continuation --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed; touched YAML parsed. `node ralph-research-os/automation/research-validation-checklist.mjs` ran with queue/path/delivery/HITL/boundary checks passing, while overall remains `fail` due to pre-existing retrieval/index drift plus subsystem/cron warnings and paper-demo not-ready state.
- Notification: concise Telegram result sent to Tomas via `openclaw message send`, accepted with messageId `7016`. Visible delivery could not be independently verified because `openclaw message read --channel telegram` returned `Unsupported Telegram action: read`.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

## [2026-09-20 16:14 UTC] exporter | RalphOrderflowExporter source hardening

- Trigger: Tomas continued the ATAS exporter build from `continuation-prompts/2026-09-20-1556-ralph-atas-exporter-build-handoff.md`.
- Context: checked `session_status` first (`0/200k`, compactions `0`), read the handoff, source skeleton, exporter design note, manual ATAS rail note, backtest data inventory, and data rails.
- Output: updated `ralph-research-os/tools/atas/RalphOrderflowExporter/RalphOrderflowExporter.cs` with candle-aware `base(true)`, `DenyCalculationTimeFrameChange = true`, `bar < CurrentBar` guard, and local `errors.log` diagnostics. Added `Find-AtasRuntime.ps1` to locate `OFT.PlatformX.runtimeconfig.json` and `ATAS.Indicators.dll` on Tomas's ATAS machine. Updated `README.md` and refreshed `RalphOrderflowExporter-v0-source.zip`.
- Verification: package contents verified locally. Build not run because this workspace has no `dotnet` binary and no installed `ATAS.Indicators.dll`; first compile still needs Tomas's local runtime target and DLL path.
- Boundary: read-only exporter source/package/docs only; no trading/orders, account/position/order/execution/stat export, keys, paid-plan activation, alert thresholds/cadence, scheduler, risk/sizing/TP/SL, or execution changes.

## [2026-09-20 16:57 UTC] exporter | RalphOrderflowExporter ATAS X rail verified

- Trigger: Tomas attached the compiled custom indicator DLL to an ATAS X `BTCUSDT` `H1` chart and ran the local file check command.
- Result: `%LOCALAPPDATA%\RalphOrderflowExporter\status.json` reported `state:"ok"` with no error and `feature-windows.jsonl` contained live ATAS-derived bar/footprint feature windows.
- Evidence shape: rows include OHLC, volume, bid/ask volume, delta, VWAP, price-level count, max-volume price, max-volume-price volume, and max positive/negative delta price levels.
- Interpretation: the indicator is expected to be mostly invisible on-chart because it is a read-only exporter, not a visual overlay. This is the first confirmed end-to-end ATAS X custom DLL to local JSONL orderflow rail for RALPH.
- Follow-up: rerunning the check near the next hour appended bar `233` with `candle_time` `2026-09-20T17:00:00.0000000` and `last_trade_time` `2026-09-20T17:00:00.0080000Z`, proving the exporter advances into a fresh live H1 candle rather than only exporting the initial chart history.

## [2026-09-20 16:10 UTC] maintenance | weekly routing and service-health check

- Trigger: scheduled `ralph-weekly-maintenance` isolated run.
- Context/cron: `session_status` showed context `0/200k`, compactions `0`. Gateway cron is enabled; restricted cron visibility allowed current-job live checks only. Current `ralph-weekly-maintenance` has consecutive errors `0`; visible prior failures were old usage-limit errors, followed by successful runs. Other RALPH cron mirrors are present in `automation/loop-state.yaml`/`automation/loop-registry.yaml`, but live `get/runs` for non-current jobs was restricted in this run.
- Validation: YAML parsed for `index.yaml`, `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, `automation/loop-state.yaml`, and `automation/loop-registry.yaml`; JSON parsed for `graph/decision-graph.json` and local `outputs/*.json`. `index.yaml` reports `total_sources: 19` and `total_wiki_pages: 199`; `work-queues.yaml` has `0` pending items, no active item, and `24` Watch items.
- Output: refreshed `outputs/evidence-ledger-prioritizer.*` locally. Current prioritizer is `pendingItems: 0`, `readyNow: 0`, `watchUntilThreshold: 1`, `needsWheelGate: 0`; the only threshold-watch item is `ta-call-candidates-20-row-threshold`. Updated `automation/current-operating-map.md` to include the already-registered `ralph-adversarial-improvement-loop` in Active Runtime.
- Service health: `node crypto-updates/service-health-check.mjs` completed and wrote `crypto-updates/runtime/service-health-report.json`. Both `crypto-updates-market-watcher.service` and `bybit-execution-reactor.service` are active/running. Attention states: `crypto-updates-market-watcher.service` had 2 OOM-related journal lines in the last 24h and a SOL duplicate-alert cluster of 3 Telegram sends at `2026-09-19T18:09Z` within milliseconds. Current watcher memory is about `135 MB`, restart counter is not high, watcher log is fresh, and reactor log is fresh.
- Boundary: maintenance/doc routing and local output refresh only; no strategy branch, scheduler mutation, alert wording, thresholds, watcher behavior, account/key/API access, paid service, demo/testnet setup, live trading, orders, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion changed.
- Notification: service-health attention recorded. A concise Tomas-facing attention note was attempted because the duplicate alert cluster was user-visible, but `sessions_send` was forbidden by restricted session-tree visibility; visible delivery was not verified. No concrete HITL decision was required from this maintenance run.

# 2026-09-13T06:34:18Z - strategy-filter survivor shape reporting

- Trigger: continued after the manual scheduled loop identified that raw survivor counts overstated the effective AVAX survivor diversity.
- Output: updated `experiments/strategy-destruction-filter/src/run-filter.mjs` to emit `survivorShapes` and `totals.survivorShapes`; updated `src/verify-filter.mjs` to require the JSON and Markdown shape diagnostics; regenerated `results/filter-report.json`, `results/filter-report.md`, `results/survivors.json`, and `results/rejected-ideas.jsonl`; added `wiki/notes/2026-09-13-strategy-filter-survivor-shape-reporting.md`.
- Result: fresh report remains 13 candidates / 131 variants / 2 raw survivors / 129 rejected, but now explicitly reports 1 effective survivor shape: `alert-edge-avax-range-breakdown-short-v0|shape-1`. The duplicate raw survivors are `#1` and `#2`, with identical realized metrics and only `rsiMaxShort` different (`45` vs `50`). AVAX remains Watch / forward-paper-needed.
- Verification: `node --check src/run-filter.mjs` passed; `node --check src/verify-filter.mjs` passed; `npm run filter` passed; `npm run verify` passed; `npm test` passed 29 tests; `state-of-edge-report` returned `no_trade_negative_edge`; prioritizer remains 0 pending / 0 ready-now / 2 threshold-watch / 0 needs-wheel-gate; checklist remains expected warn with retrieval/pathRefs/queues/delivery/HITL/loop/handoff/boundary pass and paperDemo not-ready.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, watcher behavior, data capture, public posting, or strategy promotion changed.
- Notification: manual Telegram update requested by Tomas's `continue`.

# 2026-09-13T06:18:00Z - strategy-filter post-gate survivor concentration audit

- Loop: `ralph-autoresearch-loop`.
- Item: `validation.strategy-filter-post-gate-survivor-concentration-audit`.
- Output: `wiki/notes/2026-09-13-strategy-filter-post-gate-survivor-concentration-audit.md`; updated `automation/retrieval-router.yaml` and `automation/loop-state.yaml`.
- Verification: local Node statistics over `experiments/strategy-destruction-filter/results/filter-report.json`; no web/source checks used.
- Verdict: current filter report has 13 candidates / 131 variants / 2 raw survivors / 129 rejected, but only 1 effective survivor shape: AVAX 1h `range_breakdown_short` in down/low-vol. The two raw survivors have identical realized metrics; AVAX stays Watch / forward-paper-needed. `weak_walk_forward_out_of_sample` remains the dominant rejection reason and is the only failure on AVAX #3-#8, so strict walk-forward OOS handling is still useful rather than decorative.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, watcher behavior, data capture, public posting, or strategy promotion changed.
- Notification: none; no Telegram gate met.

## [2026-09-13 05:59 UTC] maintenance | live cron mirror and no-ready-route check

- Trigger: Tomas said `Continue` after the planned-level proxy scaffold, while the evidence prioritizer already showed no ready-now work.
- Verification: `session_status` showed context 0% and compactions 0; live OpenClaw cron list/runs verified `ralph-autoresearch-loop`, `ralph-state-of-edge-daily`, `ralph-weekly-maintenance`, and `liquid-crypto-alert-edge-backtest` are enabled with consecutiveErrors 0. `ralph-autoresearch-loop` last manual run still has a non-fatal Ruby diagnostic warning but finished `ok` with `NO_TELEGRAM_UPDATE`; `ralph-state-of-edge-daily` last run also finished `ok` with `NO_TELEGRAM_UPDATE`.
- Output: refreshed `outputs/evidence-ledger-prioritizer.*` and `outputs/research-validation-checklist.*`; updated `automation/loop-state.yaml` live verification timestamps and state-of-edge next run mirror; added `memory/2026-09-13.md`.
- Result: prioritizer remains `pendingItems: 0`, `readyNow: 0`, `watchUntilThreshold: 2`, `needsWheelGate: 0`; checklist remains expected `warn` because runtime cron verification is still a live-tool requirement and `paperDemo` is not-ready (`AVAX` exact forward-paper rows `0/20`). No new branch was started because the next useful work is threshold, named-trigger, or explicit HITL-gated.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence mutation, risk/sizing/TP/SL, execution, watcher behavior, public posting, data capture, or strategy promotion changed.

## [2026-09-08 11:05 UTC] investigation | level breakout acceptance baseline

- Trigger: Tomas asked to work only on Filip/pdV-pdN/Cluster Search and especially determine whether it is usable for deciding breakouts up/down across timeframes.
- Output: added `experiments/strategy-destruction-filter/src/run-level-breakout-acceptance-study.mjs`; added npm script `study:level-breakout`; generated `experiments/strategy-destruction-filter/results/level-breakout-acceptance-study.json` and `.md`; added `wiki/notes/2026-09-08-level-breakout-acceptance-baseline.md`; added `wiki/notes/2026-09-08-planned-level-orderflow-decision-protocol.md`; linked the notes from the Filip feedback lane and retrieval router.
- Result: candle-only acceptance/rejection around previous-candle and previous-day high/low levels is mostly weak across BTC/ETH/SOL/HYPE, often around `40-50%` favorable-first. Mild hints exist for some 4h previous-day-high acceptance buckets, but not enough for standalone trading. Current verdict: Filip's framework is usable only as preplanned level + timeframe context + acceptance/rejection + Cluster Search/orderflow confirmation + no-trade state.
- Verification: `npm run study:level-breakout --prefix ralph-research-os/experiments/strategy-destruction-filter` passed; `node --check ralph-research-os/experiments/strategy-destruction-filter/src/run-level-breakout-acceptance-study.mjs` passed; `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed 28 tests.
- Boundary delta: research script, outputs, wiki/router/log/memory only; no live trading, live alerts, thresholds, scheduler, account/key/API/paid access, demo/testnet, order, risk/sizing/leverage, TP/SL, execution behavior, public posting, or strategy promotion changed.

## [2026-09-08 10:45 UTC] investigation | Filip pdV/pdN Cluster strategy lane

- Trigger: Tomas said he wants the agent to independently develop the Filip hypothesis and that he will occasionally pass along what Filip writes.
- Output: added `wiki/notes/2026-09-08-filip-pdv-pdn-cluster-strategy-development-lane.md`; linked it from the Filip feedback lane and retrieval router; added `investigation.filip-pdv-pdn-cluster-strategy-development` to the pending work queue.
- Result: established an active-design, paper-only lane for a planned-level/orderflow-reaction alert family around pdV/pdN bands, value-area context, same-side magnets, weekday/distance conditioning, and Cluster Search or public-orderflow proxy confirmation.
- Boundary delta: research memory and pending queue only; no live trading, live alerts, thresholds, scheduler, account/key/API/paid access, demo/testnet, order, risk/sizing/leverage, TP/SL, execution behavior, public posting, or strategy promotion changed.

## [2026-09-08 10:34 UTC] source lane | Filip BTC pdV/pdN prediction intake

- Trigger: Tomas relayed Filip's tuned BTC Monday prediction for 2026-09-07 and asked to save it in Obsidian, dig into it, and optionally give Filip feedback.
- Output: added `wiki/notes/2026-09-08-filip-btc-pdv-pdn-prediction-intake.md`; linked it from `wiki/filip_feedback/README.md`; updated `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, and `automation/current-operating-map.md`.
- Result: preserved the core claim: `O=80301` above prior-day value, `pdV=79844` and `pdN=79900` as one tight same-side band, weak unconditional `OvsPDVA=A` statistics, stronger Monday/bucket conditioning, and a three-scenario orderflow-confirmed plan. Research verdict: high-quality hypothesis, not evidence, until Filip provides row-level export and exact definitions for the custom fields and cluster-search colors.
- Boundary delta: research memory and Watch queue only; no live trading, live alerts, thresholds, scheduler, account/key/API/paid access, demo/testnet, order, risk/sizing/leverage, TP/SL, execution behavior, public posting, or strategy promotion changed.

# 2026-09-01T21:20:00Z - workspace owner-index reconciliation

- Trigger: gateway restarted while OpenClaw was waiting; session resumed at 0% context and continued Tomas's approved internal workspace/Obsidian cleanup.
- Output: added `wiki/notes/2026-09-01-workspace-owner-index-reconciliation.md`; updated `core/navigation.md`, `core/data-rails.md`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`, and `index.yaml`/`index.md` metadata.
- Result: reconciled the remaining owner indexes after checking `crypto-updates/README.md`, `crypto-updates/wiki/README.md`, `crypto-updates/monitor-index.yaml`, `crypto-updates/digest-index.yaml`, `crypto-updates/setup-analysis-index.yaml`, `openclaw-research-os/index.yaml`, `openclaw-research-os/wiki/overview.md`, `zela-benchmark/README.md`, `zela-benchmark/intake.md`, `zela-benchmark/review-plan.md`, and `memory/2026-09-01.md`. Decision: RALPH owns crypto decisions; Crypto Updates owns generated evidence and live compact indexes; OpenClaw Research OS owns global workflow/source-routing memory; Zela remains a methodology case file unless explicitly reopened; root `trading-journal/` is legacy August 10-11 sidecar evidence; daily memory is continuity/cross-check material, not the first source for current evidence.
- Boundary delta: Obsidian/wiki routing and local docs only; no scheduler, cron, systemd, capture, scanner, collector, alert wording, thresholds, account, key, paid service, API use, demo/testnet setup, live trading, live copying, orders, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion changed.

## [2026-09-01 09:41 UTC] decision | open unknown route reconciliation

- Trigger: Tomas challenged the empty RALPH queue and asked the agent to try to find internal work within RALPH.
- Output: added `wiki/notes/2026-09-01-open-unknown-route-reconciliation.md`; marked U-005, U-012, U-028, and U-013 resolved for current routing; downgraded C-027 to Watch/setup approval; updated `automation/work-queues.yaml`, `automation/loop-state.yaml`, `automation/current-operating-map.md`, `automation/retrieval-router.yaml`, `index.yaml`, `index.md`, generated prioritizer/checklist outputs, bridge source `source.ralph-open-unknown-route-reconciliation`, `log.md`, and `memory/2026-09-01.md`.
- Result: found real internal mismatches. `U-005` still asked what should trigger promotion versus discard, but the current A2/no-key answer already exists across the approved flywheel, source-falsification guide, candidate scoring dry run, and strategy score rubric. `U-012` still asked which guide/framework docs to trust, but the trading-bot build guide map, framework wheel gate, framework shortlist comparison, and build-vs-buy memo already answer with a composite guide rather than one authority. `U-028` still asked whether Freqtrade can be the default no-key engine, but the Freqtrade spike found no local runnable path and already extracted validation-hygiene lessons. `U-013` still asked whether Hummingbot is unsuitable, but existing notes already classify it as unsuitable for first active A2/no-key use and useful as Watch/reference/prior art. Promotion now routes through named trigger/selected branch, mechanism, baseline, falsifier, access class, cheapest kill test, tier-appropriate evidence, and HITL approval for gated surfaces.
- Verification: `node --check automation/evidence-ledger-prioritizer.mjs` passed; research-validation checklist remains overall `warn` only for known cron warning and `paperDemo: not-ready`; prioritizer remains `pendingItems: 0`, `watchItems: 4`, `readyNow: 0`, `watchUntilThreshold: 2`, `needsWheelGate: 0`; bridge-ingested/search-verified as `source.ralph-open-unknown-route-reconciliation`.
- Boundary delta: docs/router/state only; no TA/AVAX threshold rerun, capture, scanner, collector, scheduler, cron, systemd, account, key, paid service, API use, demo/testnet setup, live trading, live copying, orders, live alert wording, thresholds, risk/sizing/leverage/TP/SL, execution behavior, public posting, dependency adoption, paper-candidate wording, or strategy promotion changed.

## [2026-09-01 06:40 UTC] unknown | Hyperliquid wallet-shadow delay sample

- Trigger: Tomas said it was up to the agent and allowed opening something if it was substantially blocking, then said continue.
- Output: added `experiments/copytrading-address-intake/src/run-hyperliquid-delay-sample.mjs`; added npm alias `ledger:hyperliquid-delay-sample`; generated `experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01.*`; added `wiki/notes/2026-09-01-hyperliquid-wallet-shadow-delay-sample.md`; updated `decisions/unknowns.md`, router/map/state/index/log/memory references.
- Result: primary known address `0x7fd...17d1` returned 720 fills in a settled window and a mixed positive clustered slice: 9/24 net-positive at 60s and 17/24 at 180s after 8 bps stress. Known address `0x5b5...c060` returned 622 fills but failed after cost stress with 0/24 net-positive at both delays. Known address `0x20c...44f5` had 0 fills. Rows remain clustered and leaderboard-sourced, so U-008/U-017 remain open.
- Verification: `node --check experiments/copytrading-address-intake/src/run-hyperliquid-delay-sample.mjs` passed; manual sample run wrote JSON/Markdown outputs.
- Boundary delta: no scanner, recurring capture, scheduler, cron, systemd, alert, threshold, account, key, paid service, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, candidate wallet, paper-candidate wording, or strategy promotion changed.

## [2026-08-31 21:47 UTC] unknown | strategy family budget fit map

- Trigger: Tomas said continue after U-002 closed; current prioritizer had no ready-now routes and U-009 remained a needs-wheel-gate unknown. Pricing/access was rechecked live because budget facts go stale.
- Output: added `wiki/notes/2026-08-31-strategy-family-budget-fit-map.md`; moved U-009 from unknowns pending to done; updated `decisions/unknowns.md`, `decisions/candidates.md`, `automation/work-queues.yaml`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`, `automation/loop-state.yaml`, index metadata, generated prioritizer/checklist outputs, log, and daily memory.
- Result: best current-budget families are active `$0`/public/local work first: market-level funding/basis baseline, local alert-edge/TA strategy destruction, bounded public orderflow research, offline range/grid falsifiers, and tiny Hyperliquid event/fill delay falsifiers. Under-budget but approval-gated families are tiny Nansen/Dune/Arkham-style smart-money exports, 0xArchive replay samples, and CoinGlass derivatives context only when tied to a named surviving question. High-frequency market making, DEX arb/MEV, broad live copytrading, scanner stacks, and execution-first strategies do not fit.
- Verification: `node --check automation/evidence-ledger-prioritizer.mjs` passed; `evidence-ledger-prioritizer` now reports `pendingItems: 13`, `readyNow: 0`, `watchUntilThreshold: 2`, `needsWheelGate: 11`; `research-validation-checklist` remains overall `warn` only for cron warn and paperDemo not-ready; bridge-ingested/search-verified as `source.ralph-strategy-family-budget-fit-map`; Obsidian search finds the new note.
- Boundary delta: no account, key, paid service, API use, scanner, collector, scheduler, cron, alert wording, threshold, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, cohort creation, paper-candidate wording, or strategy promotion changed.

## [2026-08-31 21:37 UTC] unknown | wallet-shadow event candidate signal spec

- Trigger: Tomas continued from the U-007 handoff and asked the agent to choose `unknowns.U-002` as an investigation brief without starting threshold checks, HYPE L2 capture, scanners, schedulers, alerts, accounts, keys, paid services, demo/testnet accounts, live trading, sizing, TP/SL, execution, public posting, or strategy promotion.
- Output: added `wiki/notes/2026-08-31-wallet-shadow-event-candidate-signal-spec.md`; moved U-002 from unknowns pending to done; updated `decisions/unknowns.md`, `decisions/candidates.md`, `automation/work-queues.yaml`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`, `automation/loop-state.yaml`, index metadata, generated prioritizer/checklist outputs, log, and daily memory.
- Result: opportunistic wallet-shadow/high-volatility event candidates now require frozen source-timestamped event/account rows, access classification, raw-row storage, same-run delay-price joins, cost/fill realism, exit observability, beta/outlier controls, hidden-hedge flags, and explicit reject/watch/radar-only/blocked/follow-up-ledger states. Copyability review requires 20+ quality observations across 3+ event windows; no current wallet, cohort, event, or signal is paper-qualified.
- Verification: `node --check automation/evidence-ledger-prioritizer.mjs` passed; `evidence-ledger-prioritizer` now reports `pendingItems: 14`, `readyNow: 0`, `watchUntilThreshold: 2`, `needsWheelGate: 12`; `research-validation-checklist` remains overall `warn` only for cron warn and paperDemo not-ready; bridge-ingested/search-verified as `source.ralph-wallet-shadow-event-candidate-signal-spec`; Obsidian search finds the new note.
- Boundary delta: no scanner, collector, scheduler, cron, alert wording, threshold, account, key, paid service, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, cohort creation, paper-candidate wording, or strategy promotion changed.

## [2026-08-31 21:28 UTC] unknown | work queue state policy

- Trigger: Tomas said continue after the HYPE event-only branch; context was 55%, so only a small adjacent maintenance pass was safe.
- Output: added `wiki/notes/2026-08-31-work-queue-state-policy.md`; updated `automation/evidence-ledger-prioritizer.mjs` so the report exposes top needs-wheel-gate items; moved U-007 from unknowns pending to done; updated `decisions/unknowns.md`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`, `automation/current-operating-map.md`, index metadata, generated prioritizer/checklist outputs, bridge index, and log.
- Result: queue states now separate pending, active, done, watch, blocked, and discarded. Promotion requires named triggers, one selected branch, context below the handoff threshold, and a wheel gate/access classification/cheapest falsifier before expansion. Threshold rows and access-gated branches should stay Watch/blocked instead of cluttering ready work.
- Verification: `node --check automation/evidence-ledger-prioritizer.mjs` passed; bridge-ingested/search-verified `source.ralph-work-queue-state-policy`; Obsidian search finds the new note; prioritizer now reports `pendingItems: 15`, `readyNow: 0`, `watchUntilThreshold: 2`, `needsWheelGate: 13`; `research-validation-checklist` remains overall `warn` only for cron warn and paperDemo not-ready.
- Boundary delta: no scheduler, cron, alert wording, threshold, account, key, paid service, demo/testnet setup, live trading, sizing, TP/SL, execution behavior, public posting, or strategy promotion changed.

## [2026-08-31 21:20 UTC] validation | HYPE feedback event-only velocity kill test

- Trigger: Tomas continued from `continuation-prompts/2026-08-31-1915-ralph-after-hype-feedback-work-package.md` and reiterated that Filip/Tomas HYPE feedback must become quantified strategy research, not alert commentary.
- Output: added `wiki/notes/2026-08-31-hype-feedback-event-only-velocity-kill-test.md`; moved `validation.hype-feedback-to-quantified-demo-strategy-loop` from pending to done; updated `decisions/discarded.md`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`, `automation/current-operating-map.md`, index metadata, generated prioritizer/checklist outputs, bridge index, and log.
- Result: local feedback provided 95 finalized HYPE reviews and 93 HYPE velocity reviews. Existing analyzer classifies every HYPE velocity row as `hype_event_only`, because fresh L2 and signed-flow confirmation are absent. Broad follow results were near baseline: 30m 48/93 (51.6%, Wilson 95% 41.6-61.5%, average +0.0968%) and 1h 52/93 (55.9%, 45.8-65.6%, average +0.1868%). The best coarse bucket, HYPE 5m UP, had 17/27 follow at 30m and 18/27 at 1h, but wide confidence ranges and average adverse excursion of 1.3532%.
- Decision: reject the current HYPE event-only velocity follow/fade rule as a strategy candidate. The correct next HYPE branch is not more commentary; it is the separate Watch-only `hype-l2-absorption-capture-falsifier`, and that still requires explicit Tomas approval before capture/replay work.
- Verification: regenerated `index.md`; bridge-ingested/search-verified `source.ralph-hype-feedback-event-only-velocity-kill-test`; Obsidian search finds the new note; `evidence-ledger-prioritizer` now reports `pendingItems: 16`, `readyNow: 0`, `watchUntilThreshold: 2`; `research-validation-checklist` remains overall `warn` only for cron warn and paperDemo not-ready.
- Boundary delta: no L2 capture, collector, scheduler, alert wording, threshold, account, key, paid service, demo/testnet setup, live trading, sizing, TP/SL, execution behavior, public posting, or strategy promotion changed.

## [2026-08-31 20:56 UTC] source lane | Filip feedback intake

- Tomas clarified that Filip feedback will recur and should be treated like TA pieces within the full-TA intake system
- added `wiki/filip_feedback/README.md` as a dedicated Filip feedback source lane
- added `wiki/notes/templates/filip-feedback-intake.md`
- linked the HYPE quantified strategy work package to the Filip feedback lane/template
- bridge-ingested/search-verified as `source.ralph-filip-feedback-source-lane` and `source.ralph-filip-feedback-intake-template`
- Obsidian verified after Tomas emphasized it: wiki render mode is `obsidian`, official CLI is available, `obsidian files` lists both Filip feedback files, direct `obsidian read` works, and Obsidian search returns the lane/template/work-package context
- updated router/index/log/memory/handoff only; no strategy run, backtest, demo/testnet account, L2 capture, collector, scheduler, alert, threshold, account/key, paid service, live trading, sizing, TP/SL, execution behavior, watcher behavior, public posting, or strategy promotion changed

## [2026-08-31 19:12 UTC] queue | HYPE quantified strategy work package

- Tomas clarified the required action: save the HYPE feedback work, put it in the queue for further research/testing, and then get back to the prior RALPH continuation state
- context reached 60%, so no new substantial research pass was started in this session
- added `wiki/notes/2026-08-31-hype-feedback-quantified-strategy-work-package.md`
- moved `hype-feedback-to-quantified-demo-strategy-loop` from watch into `validation.pending`
- updated the evidence prioritizer so this item is `needs-wheel-gate`, not blind ready-now work
- created context-threshold handoff `continuation-prompts/2026-08-31-1915-ralph-after-hype-feedback-work-package.md`
- boundary delta: note/router/queue/prioritizer/log/memory/index only; no strategy run, backtest, demo/testnet account, L2 capture, collector, scheduler, alert, threshold, account/key, paid service, live trading, sizing, TP/SL, execution behavior, watcher behavior, public posting, or strategy promotion changed

## [2026-08-31 19:08 UTC] memory | quantified strategy feedback standard

- Tomas corrected the standard for RALPH feedback handling: do not treat feedback as an alert/digest or vague follow/fade/noisy classification task
- durable rule: feedback should be addressed by researching/designing a tradeable strategy, testing it, local paper/demo trading where allowed, and reporting precise numbers or defensible ranges such as winrate, expectancy, drawdown, baseline lift, sample, and regime split
- renamed the watch item from `hype-alert-feedback-decomposition-review` to `hype-feedback-to-quantified-demo-strategy-loop`
- updated `core/profitability-flywheel.md`, `core/communication-protocol.md`, `MEMORY.md`, `automation/current-operating-map.md`, `automation/work-queues.yaml`, and `memory/2026-08-31.md`
- boundary delta: memory/protocol/queue/map/log only; no strategy research pass, backtest, demo/testnet account, L2 capture, collector, scheduler, alert, threshold, account/key, paid service, live trading, sizing, TP/SL, execution behavior, watcher behavior, public posting, or strategy promotion changed

## [2026-08-31 18:57 UTC] queue | HYPE alert feedback decomposition watch item

- Tomas corrected the workflow: finish addressing the feedback, queue it, and return to the prior RALPH state instead of jumping topics
- audited current queue shape: unknowns pending 14, validation pending 2 threshold-wait items, discovery/investigation/decision pending 0, watch items already overloaded; evidence prioritizer reports `pendingItems: 16`, `readyNow: 0`, `watchUntilThreshold: 2`
- added `hype-alert-feedback-decomposition-review` to watch items so the non-L2 part of the feedback is not lost
- interpretation: future HYPE review should split overcombined/overfit alert logic from absorption/L2 availability, venue/book freshness, trigger family, and post-alert outcome before any verdict or threshold discussion
- boundary delta: queue/map/log/memory only; no research branch, L2 capture, collector, scheduler, alert, threshold, account/key, paid service, demo/testnet setup, live trading, sizing, TP/SL, execution behavior, watcher behavior, public posting, or strategy promotion changed

## [2026-08-31 18:52 UTC] queue | HYPE L2 absorption capture watch item

- Tomas clarified: not now, but put the L2 work in queue
- added `hype-l2-absorption-capture-falsifier` to `automation/work-queues.yaml` watch items only
- updated `automation/current-operating-map.md` so future workers treat it as a bounded no-key capture/replay proposal, not authorization to run a collector
- boundary delta: queue/map/log/memory only; no L2 capture, collector, scheduler, alert, threshold, account/key, paid service, demo/testnet setup, live trading, sizing, TP/SL, execution behavior, watcher behavior, public posting, or strategy promotion changed

## [2026-08-31 18:47 UTC] ad-hoc | HYPE L2 access routes

- Tomas asked to find ways to access L2 data after HYPE alert feedback flagged missing absorption/orderflow context
- added `wiki/notes/2026-08-31-hype-l2-access-routes.md`
- verified no-key live HYPE L2 snapshots from Hyperliquid `l2Book`, Binance USD-M futures `HYPEUSDT` depth, and Bybit linear `HYPEUSDT` orderbook
- verdict: basic HYPE L2 access is active-public-proxy; the real blocker is capture/replay alignment around alert timestamps and whether L2-derived absorption explains outcomes better than price-only context
- paid/keyed normalized or order-level routes such as GoldRush/CoinAPI/Tardis/0xArchive-style providers stay needs-approval/watch until Tomas explicitly approves account/key/paid evaluation
- verification: checklist remains `warn` only because cron is warn and paperDemo is not-ready; evidence prioritizer remains `pendingItems: 16`, `readyNow: 0`, `watchUntilThreshold: 2`; bridge-ingested/search-verified as `source.ralph-hype-l2-access-routes`
- boundary delta: wiki/router/data-rail/log/memory only; no collector, scanner, cohort, alert, threshold, scheduler, account, key, paid service, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, watcher behavior, or strategy promotion changed

## [2026-08-31 05:52 UTC] discovery | strategy leg garden harvest

- selected the last ready branch from the evidence prioritizer: `discovery.strategy-leg-garden`
- added `wiki/notes/2026-08-31-strategy-leg-garden-harvest.md`
- preserved five raw legs with data rails, dumb baselines, kill tests, and tail risks: funding-basis-persistence-baseline, smart-money-mid-cap-accumulation, range-grid-offline-falsifier, token-unlock-liquidity-pressure, and event-radar-to-paper-filter
- no leg was promoted; next measurable no-key branch remains `funding-basis-baseline-monitor`
- updated C-035 and U-037
- bridge-ingested `wiki/notes/2026-08-31-strategy-leg-garden-harvest.md` as `source.ralph-strategy-leg-garden-harvest` and search-verified it
- fixed `automation/evidence-ledger-prioritizer.mjs` so the report says `none` instead of `undefined.undefined` when no ready-now routes remain
- boundary delta: wiki/router/queue/state/log/memory/index only; no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed

## [2026-08-31 05:44 UTC] discovery | patient-retail archetype prioritization

- selected `discovery.patient-retail-archetype-prioritization` after the mid-cap flow scan closed
- added `wiki/notes/2026-08-31-patient-retail-archetype-prioritization.md`
- result: funding/basis structural baseline is the next practical no-key branch because Hyperliquid public funding/open-interest context is reachable and the branch is slow, falsifiable, and baseline-shaped
- smart-money/mid-cap accumulation remains higher-upside but access/export-gated; range/grid remains watch/offline-falsifier; token unlocks are source-first watch; delegated copy is prior-art only; event-timing wallets remain radar-only
- updated C-023/C-025 next actions and narrowed U-021/U-025 under current no-key constraints
- bridge-ingested `wiki/notes/2026-08-31-patient-retail-archetype-prioritization.md` as `source.ralph-patient-retail-archetype-prioritization` and search-verified it
- boundary delta: wiki/router/queue/state/log/memory/index only; no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed

## [2026-08-31 05:36 UTC] discovery | mid-cap accumulation flow scan

- continued the approved RALPH queue after Tomas said `Continue`; session context was 27% with 0 compactions
- selected `discovery.mid-cap-accumulation-flow-scan` from `outputs/evidence-ledger-prioritizer.md`
- added `wiki/notes/2026-08-31-mid-cap-accumulation-flow-scan.md`
- result: Dune is query-fit but key/export-gated; Nansen is highest-fit but paid/keyed or x402 approval-gated; Arkham is useful for entity/label/holder/flow enrichment but access-gated; DefiLlama is active no-key context only
- no frozen cohort was created because the branch still lacks at least 20 candidate wallets plus 7-14 day token-flow and exit-flow rows from a public/no-key/exportable source
- updated C-022/C-030 next actions and narrowed U-024/U-030 to access/exportability plus exit-flow coverage
- bridge-ingested `wiki/notes/2026-08-31-mid-cap-accumulation-flow-scan.md` as `source.ralph-mid-cap-accumulation-flow-scan` and search-verified it
- boundary delta: wiki/router/queue/state/log/memory/index only; no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed

## [2026-08-31 04:03 UTC] maintenance | cron and eval drift check

- continued from `continuation-prompts/2026-08-31-0125-ralph-maintenance-eval-expansion-handoff.md` after Tomas said `continue`; session context was 0% with 0 compactions
- reran `research-validation-checklist`: overall `warn`; retrieval/pathRefs/queues/delivery/hitlQuality/loopQuality/handoffReadiness/boundaryDelta pass; cron warn; paperDemo not-ready
- reran `evidence-ledger-prioritizer`: 30 pending items, 3 ready discovery/strategy-adjacent routes, 2 threshold-watch routes; no strategy/discovery branch was started
- performed read-only OpenClaw cron verification: `ralph-autoresearch-loop` remains enabled, next run `2026-08-31T07:30:00Z`, current error streak remains 2; `ralph-weekly-maintenance` remains enabled for `2026-09-06T16:00:00Z`
- refreshed the local cron mirror `live_verified_at` timestamp and generated validation/prioritizer outputs
- boundary delta: loop-state/current-map/log/memory plus generated outputs only; no scheduler change, strategy branch, live trading, demo/testnet setup, account/key, paid service, alert wording, threshold, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion changed

## [2026-08-30 21:42 UTC] maintenance | read-only cron mirror refresh

- continued RALPH maintenance after Tomas asked to keep going until the usual handoff threshold; session context was 16% with 0 compactions
- performed read-only OpenClaw cron inspection; `ralph-autoresearch-loop` remains enabled, next run `2026-08-31T07:30:00Z`, with 2 consecutive errors
- mirrored the exact live diagnostic wording into `automation/loop-state.yaml`: timeout during tool execution, gateway-restart interruption, no delivery
- refreshed `outputs/evidence-ledger-prioritizer.*`; it now reports 30 pending items, 3 ready, and 2 threshold-watch, but the ready items are discovery/strategy-adjacent and were not started under the current maintenance-only boundary
- tightened `automation/evidence-ledger-prioritizer.mjs` report wording so future maintenance continuations treat ready discovery/strategy-adjacent routes as routing candidates, not approval to start a branch
- no scheduler payload, cadence, timeout, delivery, or enabled state was changed
- boundary delta: loop-state/current-map/log/memory plus generated prioritizer/checklist outputs only; no strategy branch, live trading, demo/testnet setup, account/key, paid service, alert wording, threshold, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion changed

## [2026-08-31 01:12 UTC] maintenance | validation path-reference check

- continued maintenance after Codex usage reset; session context was 16% with 0 compactions
- extended `automation/research-validation-checklist.mjs` with `pathRefs`, a dependency-free check over simple local path values in `index.yaml` and `automation/retrieval-router.yaml`
- extended `automation/research-validation-checklist.mjs` with `hitlQuality`, verifying the scheduler remediation approval text exists and excludes sensitive surfaces
- extended `automation/research-validation-checklist.mjs` with `loopQuality`, verifying the autoresearch runbook still has bounded-run and verification guardrails
- extended `automation/research-validation-checklist.mjs` with `handoffReadiness`; fixed the first version to choose the latest RALPH continuation prompt by mtime instead of lexical filename order
- tightened cron output so the report includes local autoresearch consecutive-error count, next run, and last error
- updated the `indexing_and_evals` router status to list the expanded checklist fields for future startup routing
- current report: overall `warn`; retrieval pass; pathRefs pass with 334 checked and 0 missing; queues pass; cron warn with 2 timeout/gateway-restart errors and next run `2026-08-31T07:30:00Z`; delivery pass; hitlQuality pass; loopQuality pass; handoffReadiness pass; paperDemo not-ready; boundaryDelta pass
- updated the checklist note and maintenance runbook wording so future workers see the new eval rows
- boundary delta: validation script/docs/log/memory plus generated checklist output only; no strategy branch, scheduler change, live trading, demo/testnet setup, account/key, paid service, alert wording, threshold, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion changed

## [2026-08-30 20:55 UTC] maintenance | cron warning detection tightening

- continued from `continuation-prompts/2026-08-30-2042-ralph-maintenance-complete-handoff.md` after Tomas said `continue`; session context was 11% with 0 compactions
- verified live OpenClaw cron read-only: `ralph-autoresearch-loop` is enabled, next run `2026-08-31T07:30:00Z`, and still has 2 consecutive timeout/gateway-restart errors
- added `wiki/notes/2026-08-30-autoresearch-cron-remediation-hitl.md` with read-only evidence, smallest remediation options, and the exact HITL approval text required before any scheduler mutation
- tightened `automation/research-validation-checklist.mjs` so its cron check recognizes the local `timeout / gateway restart` and `timeout/gateway-restart` wording from `loop-state.yaml` and `current-operating-map.md`
- updated `index.yaml`, regenerated `index.md`, and routed the HITL note through `automation/retrieval-router.yaml` and `automation/current-operating-map.md`
- reran the checklist; output remains overall `warn`, with cron now explicitly summarized as a known `ralph-autoresearch-loop` timeout/gateway-restart warning; `paperDemo` remains `not-ready` because AVAX exact forward-paper rows are 0/20
- boundary delta: wiki/router/index/map/validation script/report/log/memory only; no scheduler change, cron payload/cadence/delivery change, strategy branch, live trading, demo/testnet setup, account/key, paid service, alert wording, threshold, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion changed

## [2026-08-30 20:04 UTC] cron | liquid crypto alert-edge refresh

- Paper state changed: backtest/verify closed 3 paper rows; overall paper dashboard `169` closed, `84W/84L/1 scratch`, avg `0.3018R`, winrate `49.70%`; qualified A/B/C remains small-sample at `17` closed, `9W/8L`, avg `0.3267R`, winrate `52.94%`. Latest candidates `7` and paper open `11` remain research/paper-only; shadow PnL stayed `shadow_negative_or_unproven` at `-1530` gross USD, wick/aggtrades studies stayed low-sample/watch, and no candidate was promoted.

## [2026-08-30 20:00 UTC] maintenance | research-validation checklist

- mode: maintenance-only eval surface
- added `wiki/notes/2026-08-30-research-validation-checklist.md`
- added local report script `automation/research-validation-checklist.mjs`
- checklist covers retrieval/index budget, queue consistency, cron health, delivery verification, paper/demo readiness, and boundary deltas
- generated `outputs/research-validation-checklist.json` and `outputs/research-validation-checklist.md`
- updated `index.yaml`, `index.md`, `automation/retrieval-router.yaml`, and `automation/current-operating-map.md`
- repaired local cron mirror in `automation/loop-state.yaml`: `ralph-autoresearch-loop` next run now matches live cron at `2026-08-31T07:30:00Z`, records 2 consecutive timeout/gateway-restart errors, and `ralph-weekly-maintenance` next run is `2026-09-06T16:00:00Z`
- updated `automation/README.md`, `automation/manual-runbook.md`, and `core/automation-policy.md` so future maintenance workers run the local validation report and verify cron warnings through OpenClaw cron before any scheduler decision
- boundary delta: wiki/router/log/memory plus local validation script/output only; no strategy branch, scheduler change, live trading, account/key, paid service, alert wording, threshold, risk/sizing/TP/SL, execution behavior, external dependency, public posting, or strategy promotion changed

## [2026-08-30 19:24 UTC] maintenance | communication and demo-trading policy

- mode: maintenance/design, not a research branch
- added `core/communication-protocol.md` with short commands: `context`, `continue`, `maintain`, `lookback`, `handoff`, `demo`, `hitl`, `ship`, and `stop`
- updated `docs/ubiquitous-language.md` with `research/validation engine`, `demo trading`, `evals`, and `short command`
- updated `core/profitability-flywheel.md`, `core/automation-policy.md`, and `automation/ralph-autoresearch-loop.md` so demo/paper trading is mandatory before any real-money proposal; local paper/no-key dry-run remains allowed, exchange demo/testnet account/key setup still requires HITL
- created pending Skill Workshop proposal `ralph-short-command-protocol-20260830-d928fcacd8` for reusable command-language behavior; not applied/installed yet
- inspected cron state: `liquid-crypto-alert-edge-backtest` is active every 4h UTC; `ralph-autoresearch-loop` is active Monday/Thursday 09:30 Europe/Prague but currently shows 2 consecutive timeout/restart errors; daily digest and urgent watcher cron are disabled
- scheduler change: added `ralph-weekly-maintenance` for Sunday 18:00 Europe/Prague after Tomas explicitly allowed reasonable maintenance frequency; isolated, delivery none, maintenance-only
- boundary delta: internal docs/policy plus one maintenance cron; no real-money trading, exchange account/key, paid service, live alert wording, execution integration, dependency, or strategy promotion changed

## [2026-08-30 16:07 UTC] discovery | grid/range existing-tool trial design

- mode: research-only tool-first trial design
- added `wiki/notes/2026-08-30-grid-range-existing-tool-trial-design.md`
- checked current public docs/pages for Hummingbot Grid Strike/Grid Executor/Hyperliquid connector, Pionex fees/demo/grid setup, TradingView Pine strategies, and a public Hyperliquid grid bot repo
- verdict: grid/range bot execution and simulation are already productized, but active use crosses account/key/wallet/capital or manual UI boundaries; RALPH should first run an offline public-candle falsifier versus simple range/no-trade baselines with fees, spread/slippage, funding, and trend-break loss assumptions fixed
- queue impact: `discovery.grid-range-existing-tool-trial-design` moved to done; C-028 remains `Watch`; U-027 remains `Open` for branch-specific output-contract checks
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30 16:02 UTC] discovery | Hyperliquid data feasibility spike

- mode: research-only public/no-key feasibility check
- added `wiki/notes/2026-08-30-hyperliquid-data-feasibility-spike.md`
- live-probed Hyperliquid public stats leaderboard plus official `info` payloads for `meta`, `allMids`, `predictedFundings`, `fundingHistory`, `candleSnapshot`, `clearinghouseState`, and `userFills`
- verdict: Hyperliquid is an active public research rail for market/funding context, discovery-only address seeds, and known-address rejection/watch triage; capped `userFills` and leaderboard bias block complete-history, copyability, hidden-hedge, activity-universe, or strategy-edge claims
- queue impact: `discovery.hyperliquid-data-feasibility-spike` moved to done; C-017 and C-038 next actions updated; U-019 remains `Open` pending a non-leaderboard activity-defined seed route
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30 15:53 UTC] discovery | public/free source-feed list

- mode: research-only source/access map
- added `wiki/notes/2026-08-30-public-free-source-feed-list.md`
- verified current public/no-key access from this workspace for DefiLlama, DEXScreener, GeckoTerminal, Alternative.me Fear & Greed, Hyperliquid info, Hyperliquid public leaderboard, Binance spot REST, and Bybit v5 public REST
- verdict: Binance/Bybit/Hyperliquid market data are active public proxies; Hyperliquid public stats plus info endpoints are active discovery/verification rails; DefiLlama is active public context; DEXScreener and GeckoTerminal are watch/active proxies for token/pair liquidity; Alternative.me is context only; CoinGecko keyless is watch/fragile because stable free usage requires account/key; Nansen/Arkham/Dune-style cohort work remains needs-access unless free exportable rows or approved access are verified
- queue impact: `discovery.public-free-source-feed-list` moved to done; C-004 and C-010 next actions updated; U-004 remains `Open` pending a noise test against concrete alert/review outcomes
- bridge: ingested and search-verified as `RALPH Public Free Source Feed List`
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, skill installation, watcher behavior, or strategy promotion changed

## [2026-08-30 15:27 UTC] discovery | existing-tool fit map

- mode: research-only routing map
- added `wiki/notes/2026-08-30-existing-tool-fit-map.md`
- inspected the tool-first pivot, build-vs-buy decision, framework shortlist, event-driven repo search, aggregate-flow feasibility, copytrading route ledger/address sample, and orderflow alignment audit
- verdict: vectorbt is the active candle sanity rail; Freqtrade is validation-hygiene reference but not locally runnable; hftbacktest/Nautilus are replay/fill-realism references; Nautilus/Barter/Basana are event-driven architecture references; public orderflow is active-public-proxy; Hyperliquid wallet routes are discovery/verification only; Nansen/Arkham/Dune-style cohort work remains needs-access/approval; grid/MM/copy products are prior art
- queue impact: `discovery.existing-tool-fit-map` moved to done; C-026 remains `Candidate`; U-027 and U-018 remain `Open`
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, skill installation, watcher behavior, or strategy promotion changed

## [2026-08-30 15:24 UTC] discovery | event-driven bot repo search

- mode: research-only public repo scan
- added `wiki/notes/2026-08-30-event-driven-bot-repo-search.md`
- inspected public GitHub/search results and public metadata/READMEs for NautilusTrader, Barter, Basana, Botvana, Supurr, Hyperliquid grid/MM bots, Perp Lobster, and browser-wallet market-making apps
- verdict: NautilusTrader, Barter, and Basana are useful architecture references; Botvana is stale/early-stage as an active rail; Hyperliquid-specific grid/MM/browser-wallet bots are source claims and risk-boundary specimens, not install/run targets
- queue impact: `discovery.event-driven-bot-repo-search` moved to done; C-009 remains `Candidate`
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, skill installation, watcher behavior, or strategy promotion changed

## [2026-08-30 15:18 UTC] discovery | aggregate-flow signal feasibility

- mode: research-only feasibility split
- added `wiki/notes/2026-08-30-aggregate-flow-signal-feasibility.md`
- inspected the handoff-selected wallet/cohort and orderflow sources plus local orderflow and monitor indexes
- checked current public access surfaces for Nansen, Arkham, Dune, and Hyperliquid info endpoints
- verdict: wallet/cohort aggregate flow is `needs-access` for broad programmatic mid-cap cohort construction and `watch` for manual/source research; exchange/orderflow aggregate flow is `active-public-proxy`; alert-edge aggregate flow is `watch`
- queue impact: `discovery.aggregate-flow-signal-feasibility` moved to done
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] maintenance | TA primitive intake protocol

- mode: bounded Obsidian/RALPH protocol hardening
- added `wiki/notes/templates/ta-primitive-intake.md`
- added `wiki/notes/2026-08-30-ta-primitive-intake-protocol.md`
- updated `wiki/concepts/multi-timeframe-full-ta.md` to link the reusable template/protocol from the TA primitives section
- updated `automation/current-operating-map.md` so future RALPH runs see the TA primitive intake rule during startup/routing
- updated `index.yaml` and `index.md` page counts
- rule: future TA pieces from Tomas should be saved as source-backed notes when source-grade, tagged by experience level, crosslinked into full TA when applicable, and given explicit retrieval/ignore conditions
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] correction | PDH/PDL as full-TA primitive

- mode: Tomas correction applied to Obsidian/RALPH trading knowledge
- updated `wiki/concepts/multi-timeframe-full-ta.md` so TA primitives supplied by Tomas are treated as reusable full-TA components, not isolated strategy notes
- updated `wiki/notes/2026-08-30-previous-day-high-low-liquidity-sweep-intake.md` with explicit "when to use in full TA" retrieval/crosslink rules
- updated `wiki/sources/chart-champions-previous-day-high-low-strategy-2026-08-30.md` and `index.yaml` summary to classify PDH/PDL liquidity-sweep material as a full-TA primitive when prior-session extremes, sweep/reversal, breakout acceptance, no-trade, or VWAP session-control context is present
- standing intake rule: future TA pieces from Tomas should be saved as source-backed Obsidian/RALPH notes, tagged by experience level, crosslinked into the full-TA concept when applicable, and retrieved only when the market context calls for them
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] ingest-update | Chart Champions source URL and chapters

- mode: manual source metadata update from Tomas
- updated Chart Champions PDH/PDL source with stable YouTube URL `https://www.youtube.com/watch?v=mgK6kHH3RJI`, video ID `mgK6kHH3RJI`, and chapter anchors
- chapters: intro, PDH/PDL definition, TradingView marking, liquidity sweep/reversal, breakout/acceptance, no-trade condition, VWAP confirmation, recap
- updated `raw/chart-champions-previous-day-high-low-strategy-2026-08-30.md`, `wiki/sources/chart-champions-previous-day-high-low-strategy-2026-08-30.md`, `wiki/notes/2026-08-30-previous-day-high-low-liquidity-sweep-intake.md`, `index.yaml`, and `index.md`
- remaining caveat: TradingView indicator link was not supplied or verified
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] ingest-update | Chart Champions PDH/PDL transcript completion

- mode: manual source update from Tomas for existing Obsidian/RALPH trading knowledge intake
- updated `raw/chart-champions-previous-day-high-low-strategy-2026-08-30.md` with the rest of the supplied transcript
- updated `wiki/sources/chart-champions-previous-day-high-low-strategy-2026-08-30.md`
- updated `wiki/notes/2026-08-30-previous-day-high-low-liquidity-sweep-intake.md`
- expanded extraction with the source's three reaction model: liquidity sweep and reversal, breakout and acceptance, and unclear no-trade
- added VWAP confirmation, RTH/full-session distinction, overlap/chop no-trade conditions, source stop/target examples, and RALPH fields for `vwap_context` and `target_family`
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] ingest | Chart Champions previous day high/low liquidity sweep transcript

- mode: manual source intake from Tomas for Obsidian/RALPH trading knowledge
- added `raw/chart-champions-previous-day-high-low-strategy-2026-08-30.md`
- added `wiki/sources/chart-champions-previous-day-high-low-strategy-2026-08-30.md`
- added `wiki/notes/2026-08-30-previous-day-high-low-liquidity-sweep-intake.md`
- extracted durable rules: previous day high/low are decision/liquidity levels, not automatic support/resistance; session basis must be explicit and consistent; sweep-fail, failed breakout, continuation, tag/no-trade, and reversal are separate scenarios; TradingView indicators are drawing aids, not edge claims
- source caveat: transcript was partial/manual and the runtime did not recover a stable YouTube watch URL or indicator link
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] decision | MEV bot case file, not execution

- mode: research-only decision memo
- added `wiki/notes/2026-08-30-mev-bot-case-file-not-execution.md`
- updated `decisions/decisions.md`
- decision: historical Base MEV archive remains a validation case file only, not a live bot, execution workspace, deploy target, or codebase to resume without explicit fresh audit approval
- queue impact: `decision.mev-bot-case-file-not-execution` moved to done; decision pending is now empty
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] decision | index generated navigation split

- mode: research-os maintenance decision
- added `wiki/notes/2026-08-30-index-generated-navigation-split.md`
- updated `decisions/decisions.md`
- decision: keep `index.yaml` and `index.md` as generated source/wiki catalog artifacts; keep RALPH-specific operating navigation in `core/navigation.md`, `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, and decision files
- queue impact: `decision.index-generated-navigation-split` moved to done
- boundary preserved: routing/catalog decision only; no live trading, alerts, thresholds, execution, keys, paid services, scheduler, or strategy promotion changed

## [2026-08-30] investigation | Zela validation rules extraction

- mode: research-only methodology extraction
- added `wiki/notes/2026-08-30-zela-validation-rules-extraction.md`
- extracted RALPH rules from Zela M4/M5 and shutdown handoff: paired measurement, symmetric filtering, denominator/exclusion discipline, caveat-beside-claim, distribution/tail reporting, frozen artifacts, reviewer checks, workload scope, access/freshness labels, and shutdown stop-loss
- marked `C-003` done and resolved `U-003`
- queue impact: `investigation.zela-validation-rules-extraction` moved to done; investigation pending is now empty
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] investigation | Trump-person event radar rules

- mode: research-only radar routing
- added `wiki/notes/2026-08-30-trump-person-event-radar-rules.md`
- current access check: White House News, Presidential Actions, and Remarks pages are reachable; Truth Social profile is JS-gated in this runtime; Trumpstruth is a public secondary archive/discovery route
- defined source priority, event record fields, routing rules, neutral output language, and falsifiers for Trump-person market events
- updated `C-018` and resolved `U-020`
- queue impact: `investigation.trump-person-event-radar-rules` moved to done and `U-020` moved from unknowns pending to done
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] investigation | wallet-shadowing forward paper trade spec

- mode: research-only T3 paper/shadow contract
- added `wiki/notes/2026-08-30-wallet-shadowing-forward-paper-trade-spec.md`
- defined frozen cohort fields, wallet event ledger fields, latency/cost metrics, kill rules, and decision states for wallet-shadow paper validation
- updated `C-017` and `C-038` next actions so Hyperliquid/copytrading work routes through the forward-paper spec before any scanner or paper-qualified claim
- decision: no existing wallet or cohort is paper-qualified; six-address Hyperliquid sample remains zero-copy-candidates
- queue impact: `investigation.wallet-shadowing-forward-paper-trade-spec` moved to done
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] investigation | event-triggered wallet-shadow falsification

- mode: research-only falsification-contract consolidation
- added `wiki/notes/2026-08-30-event-triggered-wallet-shadow-falsification.md`
- made non-copyability the null hypothesis for event-triggered wallet shadowing
- defined pre-registered test shape: frozen event windows, activity-defined accounts, no-key fill/state route, event-relative timing, latency scenarios, holding period, cost/fill assumptions, beta/context checks, outlier dependence, and exit-shadowing
- updated `C-008` next action from generic brief/checklist to tiny frozen event ledger or T3 forward-paper spec before any scanner
- queue impact: `investigation.event-triggered-wallet-shadow-falsification` moved to done
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] maintenance | queue consistency repair

- moved stale `U-006` from `automation/work-queues.yaml` unknowns pending to done because `decisions/unknowns.md` marks it resolved after the MEV failure-mode extraction
- boundary preserved: routing metadata only; no live trading, alerts, thresholds, execution, keys, paid services, scheduler, or strategy promotion changed

## [2026-08-30] investigation | wallet-shadow high-volatility event brief

- mode: research-only wallet-shadow investigation brief
- added `wiki/notes/2026-08-30-wallet-shadow-high-volatility-event-brief.md`
- separated high-volatility event wallet behavior into hypothesis/radar value versus copyability evidence
- defined event classes, account archetypes, minimum event-ledger fields, and cheapest falsifiers for event-triggered wallet-shadowing
- decision: continue to `investigation.event-triggered-wallet-shadow-falsification`; no current address is copyable and leaderboard/event/radar rows remain watch or radar-only until frozen forward paper evidence exists
- queue impact: `investigation.wallet-shadow-high-volatility-event-brief` moved to done
- boundary preserved: no live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] investigation | trading-bot operation map

- mode: research-only operation-surface consolidation
- added `wiki/notes/2026-08-30-trading-bot-operation-map.md`
- verified current official framework references for operation lessons: Freqtrade bias/dry-run discipline, Hummingbot long-running script/controller vocabulary, NautilusTrader event-driven parity, and Jesse paper/live workflow vocabulary
- operation surface now explicit: strategy specification, data intake, signal engine, T2 backtest/replay, T3 forward paper/shadow, monitoring, postmortem, and human approval boundary
- decision: no trading bot build or framework adoption; future bot-like work requires a T4 no-key prototype proposal tied to a specific paper-supported candidate and missing capability
- queue impact: `investigation.trading-bot-operation-map` moved to done
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] investigation | trading-bot build guide map closeout

- mode: research-only guide closeout
- added `wiki/notes/2026-08-30-trading-bot-build-guide-map-closeout.md`
- current build order: strategy family and speed fit, wheel gate and access classification, falsifiable hypothesis, cheapest kill test, offline backtest/replay, forward paper/shadow, postmortem/decision, then small adapter/no-key prototype only if evidence justifies it
- decision: generic trading bot design remains out of scope
- queue impact: `investigation.trading-bot-build-guide-map` moved to done
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] investigation | trader-grade TA feature taxonomy

- mode: research-only taxonomy consolidation
- added `wiki/notes/2026-08-30-trader-grade-ta-feature-taxonomy.md`
- separated feature layers into HTF context, mid-TF setup, LTF trigger, orderflow proxy, derivatives context, statistical evidence, and quality flags
- current falsifier: public orderflow remains pipeline evidence only until exact symbol/time overlap exists with finalized alerts
- queue impact: `investigation.trader-grade-ta-feature-taxonomy` moved to done
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] investigation | strategy-family taxonomy

- mode: research-only taxonomy consolidation
- added `wiki/notes/2026-08-30-strategy-family-taxonomy.md`
- classified RALPH strategy families by speed, data rail, validation path, baseline, main failure mode, current state, and next allowed move
- priority: slow structural baselines first, slow informational cohorts second, TA/orderflow/paper evidence only when it feeds strict rejection or forward-paper gates, delegated products as build-vs-buy references, speed MEV as discard/reference unless explicitly reopened
- queue impact: `investigation.strategy-family-taxonomy` moved to done
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] investigation | MEV bot failure-mode extraction

- mode: research-only case-file extraction
- added `wiki/notes/2026-08-30-mev-bot-failure-mode-extraction.md`
- source-backed rules extracted: archive provenance check, secret-free monitor mode, input schema validation, config contract validation, simulation realism, end-to-end event wiring, metric contract validation, venue mechanics, and latency-budget proof
- marked `C-006` done in `decisions/candidates.md`
- marked `U-006` resolved in `decisions/unknowns.md`
- reassessment: MEV archive material should feed validation checklists and execution-boundary reviews, not near-term bot work
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] investigation | framework shortlist comparison

- mode: research-only Profitability Flywheel run
- added `wiki/notes/2026-08-30-framework-shortlist-comparison.md`
- refreshed `experiments/btc-eth-alert-edge/framework-benchmark-plan.md` with the current vectorbt `plotly<6` runner and row-level parity result
- ranking: vectorbt is the active ephemeral benchmark rail; Freqtrade is a validation-hygiene reference but not locally runnable; hftbacktest/Nautilus are replay and architecture references; Jesse and OctoBot/grid/copy products are secondary workflow/tool-fit references
- decision: no full framework adoption; next framework action must be tied to a concrete missing capability
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] investigation | build-vs-buy decision memo

- mode: research-only Profitability Flywheel run
- added `wiki/notes/2026-08-30-build-vs-buy-decision-memo.md`
- updated `decisions/decisions.md` with the active build-vs-buy guardrail
- decision: RALPH defaults to existing tools, frameworks, public APIs, dashboards, and datasets before custom infrastructure
- custom RALPH work is justified for branch selection, falsifier design, validation/rejection discipline, Tomas-specific paper evidence, small adapters, and durable memory
- future custom build/data/backtest expansion must name the existing rail checked or classify the branch as `needs-access`, `watch`, or `custom-exception`
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-30] investigation | BTC/ETH row-level parity

- mode: research-only Profitability Flywheel run
- recovered `npm run benchmark:vectorbt` after `uv` resolved a Plotly version incompatible with vectorbt's bundled `scattermapbox` theme by pinning `plotly<6`
- added row-level parity output to `experiments/btc-eth-alert-edge/src/framework_benchmark.py`
- generated `experiments/btc-eth-alert-edge/results/framework-benchmark.json` and `experiments/btc-eth-alert-edge/results/framework-benchmark.md`
- result: BTCUSDT 4h `momentum_reversal_long` had 47 custom event-study rows, 34 vectorbt portfolio rows, 33 shared entries, 14 custom-only rows, and 1 vectorbt-only tail row
- result: ETHUSDT 4h `momentum_reversal_long` had 55 custom event-study rows, 35 vectorbt portfolio rows, 34 shared entries, 21 custom-only rows, and 1 vectorbt-only tail row
- reassessment: row differences are explainable by vectorbt's one-position portfolio mechanics plus the custom event-study's full max-bars maturity requirement; aggregate evidence remains weak, so no promotion
- boundary preserved: no live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed

## [2026-08-29] validation | SOL B-tier alert-edge candidate destruction

- mode: research-only Profitability Flywheel run
- selected `SOL 1h trend_pullback_reclaim_long up/low-vol` as the next untested B-tier alert-edge bucket after XRP and DOGE had already been strict-tested
- added strict candidate `alert-edge-sol-trend-pullback-reclaim-long-v0` to `experiments/strategy-destruction-filter/candidates/seed-strategies.json`
- ran `npm run validate:candidates`, `npm run filter`, `npm run study:features`, and `npm run verify`
- result: 11 candidates / 122 variants / 0 survivors / 122 rejected
- SOL verdict: rejected; full-sample expectancy `-0.0359R`, profit factor `0.9476`, deflated-Sharpe proxy `-0.6698`, max drawdown `45.7886R`, OOS expectancy `0.0709R`, baseline lift `0.1174R`, walk-forward positive folds `1/5`
- reassessment: alert-edge B-tier headline remains useful for candidate generation, but not enough for promotion; the paper ledger needs regime tagging before regime-specific forward support can be verified
- boundary preserved: no live trading, keys, paid services, public posting, scheduler changes, live alert wording, risk/sizing/TP/SL, execution behavior, cron/systemd changes, watcher behavior, orders, accounts, or strategy promotion changed

## [2026-08-29] validation | Profitability Flywheel operating contract

- mode: internal docs/router/queue formalization after Tomas approval
- formalized `wiki/notes/2026-08-29-ralph-grand-loop-verify-reassess.md` as the active research/paper operating contract
- added `core/profitability-flywheel.md`
- updated `core/navigation.md`, `docs/ubiquitous-language.md`, `automation/current-operating-map.md`, `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, and `automation/ralph-autoresearch-loop.md`
- queue status: marked `validation.profitability-flywheel-routing-contract-formalization` done
- boundary preserved: no live trading, keys, paid services, public posting, scheduler changes, live alert wording, risk/sizing/TP/SL, execution behavior, cron/systemd changes, watcher behavior, orders, accounts, or strategy promotion changed

## [2026-08-28] discovery | Freqtrade no-key dry-run spike

- mode: research-only, access/viability check for Freqtrade as a strategy-filter validation-hygiene benchmark
- added `wiki/notes/2026-08-28-freqtrade-no-key-dry-run-spike.md`
- updated `automation/work-queues.yaml`, `automation/retrieval-router.yaml`, and `automation/loop-state.yaml`
- source checks: official Freqtrade configuration/dry-run, data-download, backtesting, lookahead-analysis, and recursive-analysis docs
- local access checks: `freqtrade` binary absent; `python3` import absent; `docker`, `pipx`, and `pip3` absent; no local Freqtrade filename hits under the workspace/home search
- verdict: Freqtrade is a useful source-backed validation-hygiene benchmark, but not an active local dependency; next safe local step is `validation.strategy-filter-bias-hygiene-checklist`
- reassessment/self-check: exceeded the intended four-source cap by one source check while verifying backtesting separately; research-only; public/free docs only; no package install, account setup, exchange integration, live execution, orders, wallet keys, paid APIs, alert wording, watcher behavior, risk/sizing, TP/SL, cron cadence, public posting, Telegram notification, or strategy promotion changed

## [2026-08-27] discovery | operator profile community autoresearch lane

- mode: research-only, source-lane design after Tomas clarified that RALPH should also learn from GitHub profiles/repos, X/Twitter, Reddit, and public communities
- added `wiki/notes/2026-08-27-operator-profile-community-autoresearch-lane.md`
- updated `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, `automation/ralph-autoresearch-loop.md`, `decisions/candidates.md`, and `decisions/unknowns.md`
- verified access shape: GitHub connector can search public repos and returned `freqtrade/freqtrade`, `freqtrade/frequi`, and `freqtrade/freqtrade-strategies`; GitHub REST search docs confirm rate-limited search and auth-required code search; official X API docs show pay-per-usage credits; Reddit developer terms apply to API/developer-service usage
- status: GitHub is active read-only; X/Twitter and Reddit are watch/manual web sources until API access, cost, freshness, exportability, and terms are explicitly approved
- no new cron/cadence, no paid API, no social posting/messaging, no scraping, no live trading, no watcher wording, risk/sizing, TP/SL, execution, or orders changed

## [2026-08-27] discovery | Hyperliquid public address sample

- mode: research-only, public/no-key address sample
- added `wiki/notes/2026-08-27-hyperliquid-public-address-sample.md`
- added `experiments/copytrading-address-intake/src/run-hyperliquid-address-intake.mjs` plus `npm run intake:hyperliquid`
- added `experiments/copytrading-address-intake/data/sample-addresses.json`; the runner now supports `--addresses <json>` for later public cohorts without editing code
- generated `experiments/copytrading-address-intake/results/hyperliquid-address-intake.md` and `.json`
- updated `decisions/copytrading-watch-ledger.md` with three public HypurrScan-discovered Hyperliquid addresses plus conservative sample-only/rejected-as-copy classifications
- verified locally that public-search address seeds can be independently probed through Hyperliquid `info` with no key: `clearinghouseState` and `userFills` returned 200 OK for all sampled addresses
- all sampled addresses were currently flat in the no-key `clearinghouseState` response, so none is a live signal or copy candidate
- first repeatable intake verdict: `0x20c2...44f5` stays watch/sample-only from a profitable but capped ETH-only returned slice; `0x1d52...4397` and `0xc2a...e5f2` are rejected-as-copy/watch-as-evidence from negative capped returned PnL; `0xb317...83ae` stays radar-only
- retained the next gate: route-quality, history-quality, archetype, latency/capacity/copyability, then frozen paper cohort only after separate HITL approval
- OpenClaw bridge ingest/search verified for `RALPH Hyperliquid Public Address Sample`; wiki lint reported 0 issues
- no live copying, trading, keys, paid APIs, cron/cadence, watcher behavior, alert wording, risk/sizing, TP/SL, execution, or orders changed

## [2026-08-26] discovery | copytrading autoresearch lane

- mode: research-only, public/no-key access check plus loop/router docs
- added `wiki/notes/2026-08-26-copytrading-autoresearch-lane.md`
- added `decisions/copytrading-watch-ledger.md` as the candidate/watch ledger for accounts, wallets, cohorts, venues, archetypes, latency, liquidity/capacity, holding period, realized-history evidence, copyability risks, and conservative statuses
- verified Hyperliquid official `info` endpoint locally without a key for `meta`, `spotMeta`, `userFills`, and `clearinghouseState`; one known radar address returned fills and an empty current clearinghouse state, so this is usable as a read-only evidence rail for known addresses
- marked Dune, Arkham, and Nansen API routes as `needs-access` because official docs require API keys/access; public dashboards/products such as HypurrScan, HyperDash, ASXN, HyperTracker, Copin/HyperX/Dexly-style tools stay watch/manual until export/API access is verified
- updated autoresearch loop, retrieval router, work queues, current operating map, data rails, navigation, candidates, and unknowns so copytrading/wallet-following is first-class but still watch/shadow/paper-only
- OpenClaw bridge ingest/search verified for `RALPH Copytrading Autoresearch Lane`
- no live copying, trading, keys, paid APIs, cron/cadence, watcher behavior, alert wording, risk/sizing, TP/SL, execution, or orders changed

## [2026-08-26] validation | shadow PnL and autoresearch loop hardening

- mode: research-only, local finalized alert-feedback ledger and loop docs
- added `experiments/strategy-destruction-filter/src/run-shadow-pnl-ledger.mjs` and `npm run ledger:shadow-pnl`
- shadow ledger covers tradable WICK/VELOCITY alert plans: 72 tradable plans, 56 filled, 20 target hits, 19 stop hits, 17 ambiguous stop-first outcomes, 0 time exits
- conservative gross PnL before fees/slippage is `-1200` USD; filled win rate is 0.3571
- updated autoresearch docs so Obsidian is explicit as the knowledge/review layer, not the backtest engine
- updated self-improvement loop rules: automatic tightening, data-quality flags, scorecards, Obsidian links, queue splitting, and repeated-failure memory are allowed; loosening gates or changing live behavior requires Tomas
- no strict candidate added; no paper/live promotion
- safety stance unchanged: no live trading, keys, paid APIs, cron, watcher behavior, alert wording, risk/sizing, TP/SL, execution, or orders

## [2026-08-26] validation | WICK alert feedback event-study gate

- mode: research-only, local finalized alert-feedback event study with no refetch
- added `experiments/strategy-destruction-filter/src/run-wick-alert-feedback-event-study.mjs` and `npm run study:wick-feedback`
- kept WICK separate from VELOCITY: 54 included WICK reviews, 4 excluded by strict quality checks, 24 buckets
- tradable fade rows: 29 total, 12 support fade, 17 are against fade
- no candidate-ready bucket; current decision is `watch_or_kill_low_sample`
- top tradable buckets are still tiny: `BTC|5s|DOWN|tradable_fade|4/5` N=3 fade support 0.6667; `ETH|5s|UP|tradable_fade|4/5` N=3 fade support 0.6667
- no strict candidate added; do not promote wick-fade from this local evidence yet
- verification passed: `study:wick-feedback`, `validate:candidates`, and `verify`
- safety stance unchanged: no live trading, keys, paid APIs, cron, watcher behavior, alert wording, risk/sizing, TP/SL, execution, or orders

## [2026-08-26] validation | aggTrades velocity event-study gate

- mode: research-only, local replay-output event study with no refetch
- added `experiments/strategy-destruction-filter/src/run-aggtrades-velocity-event-study.mjs` and `npm run study:aggtrades-velocity`
- consumed replay-clean Binance `aggTrades` rows only: 29 usable rows, 13 primary buckets, 18 velocity-band buckets
- low-sample gate requires N >= 10 and dominant verdict share >= 0.75; current decision is `watch_low_sample`
- top primary buckets: `ETH|5m|UP` N=5 dominant follow-useful 0.80; `ETH|60s|DOWN` N=5 dominant fade-useful 0.80; `ETH|5m|DOWN` N=3 dominant fade-useful 0.6667; `SOL|15m|DOWN` N=2 dominant fade-useful 1.00
- no strict candidate added; ETH 60s DOWN fade remains blocked because the same mechanism already failed the strict destruction filter without new data
- verification passed: `assess:velocity-replay`, `replay:aggtrades`, `study:aggtrades-velocity`, `validate:candidates`, `npm test`, and `verify`
- safety stance unchanged: no live trading, keys, paid APIs, cron, watcher behavior, alert wording, risk/sizing, TP/SL, execution, or orders

## [2026-08-22] validation | hftbacktest native timestamp probe

- mode: research-only, bounded no-key 30s BTC public capture
- fixed `automation/hftbacktest-orderflow-replay-feasibility.mjs` timestamp evidence bug where `Number(null)` treated missing `exchangeTs` as native timestamp evidence
- added timestamp evidence by projected row kind to the feasibility report
- ran `ORDERFLOW_SPIKE_DURATION_MS=30000 ORDERFLOW_SPIKE_SYMBOLS=BTC node crypto-updates/orderflow-spike.mjs`
- generated features for run `2026-08-22T07-41-21-734Z`: 6,318 raw events and 70 one-second feature rows
- timestamp split: Binance trades native; Binance `book_ticker`/`depth5` fallback; Hyperliquid `trade`/`l2_book` native
- extended `automation/hftbacktest-minimal-replay-runtime-spike.py` for env-selected source/symbol/run and Hyperliquid `l2_book` snapshots
- Hyperliquid BTC replay smoke: 195 selected events, 666 replay rows, 0 missing exchange/local timestamps, no-trade flat, passive quote 2 simulated fills under frozen zero-fee/zero-latency assumptions
- added `outputs/hftbacktest-native-timestamp-probe.md` and `.json`
- safety stance unchanged: no live watcher, alert text, thresholds, recurring jobs, keys, paid APIs, risk, sizing, or execution

## [2026-08-22] validation | hftbacktest replay fixture tests

- mode: research-only, local deterministic fixtures in the isolated hftbacktest uv venv
- added `automation/hftbacktest_minimal_replay_fixture_tests.py`
- hardened `automation/hftbacktest-minimal-replay-runtime-spike.py` with timestamp-quality flags and top-of-book guards
- generated `outputs/hftbacktest-replay-fixture-tests.md` and `.json`
- fixture coverage: depth snapshot seeding, trade/depth/book_ticker `event_dtype` conversion, event-order correction, missing timestamp flags, negative latency flag, crossed/locked/non-positive/NaN book rejection, and flat no-trade baseline
- verification passed: 6 unittest fixtures, converter rerun, and py_compile
- notable correction: BTCUSDT capture-v2 has separate local receive timestamps, but 605 Binance events still lack a distinct `exchangeTs` value and use `ts` as the exchange-time fallback
- safety stance unchanged: no live watcher, alert text, thresholds, recurring jobs, keys, paid APIs, risk, sizing, or execution

## [2026-08-21] query | relative pair matrix context layer

- mode: research-only, local candles first, no web and no paid/API/key access
- added `wiki/notes/2026-08-21-relative-pair-matrix.md`
- computed synthetic relative pairs for BTC/ETH/SOL/XRP/ADA/BNB/DOGE/AVAX/LINK from Binance spot USDT candles on 1h and 4h
- found 4h data fresh through `2026-08-21T12:00Z` and 1h data only through `2026-08-20T23:00Z`
- SOL 4h range breakout context was mixed: SOLUSDT was positive, but SOL lagged BTC and only partly beat ETH, so it should be treated as market-beta/mixed relative confirmation rather than pure SOL leadership
- bounded BTC/ETH/SOL alert join found 57 finalized rows with mixed relative-confirmation counts; useful for pre-ML/context features, not a promotable gate
- Czech Telegram summary send returned `ok` with message id `3938`, but Telegram readback is unsupported in this plugin, so visible delivery remains unverified
- safety stance unchanged: no live alert text, thresholds, risk, sizing, execution, keys, exchange accounts, wallets, or paid APIs

## [2026-07-01] ingest | RALPH Research OS M0 bootstrap

- mode: init, seed-only, no discovery rounds
- created AI Research OS v4 directory structure
- added RALPH decision layer, loops, case files, and experiment templates
- sources ingested: 0
- safety stance: research automation only; no execution, no trading, no keys, no paid infra

## [2026-07-01] ingest | primary RALPH sources

- mode: append, seed-only, no discovery rounds
- raw files added: RALPH transcript, Crypto Trading Bots handoff, Zela planner handoff, AI Research OS README, AI Research OS conventions, MEV bot archive asset
- wiki source pages written: 6
- corrections: generated index contract restored; RALPH navigation moved to `core/navigation.md`; queue and candidate scoring added
- safety stance unchanged: no execution, no trading, no keys, no paid infra

## [2026-07-01] lint | source graph validation

- ran upstream AI Research OS index generator and lint scripts
- broken links: 0
- orphan sources: 0
- missing hubs: 0
- YAML validation passed for index and automation files

## [2026-07-01] ingest | operating thesis voice note

- mode: append, seed-only, no discovery rounds
- raw voice transcript and audio asset added
- source page written for Tomas's operating thesis
- added operating thesis, milestones, strategy research loop, framework/repo discovery loop, market volatility watch loop, A2 research engine runbook, and skill creation policy
- safety stance unchanged: recurring automation remains draft until explicitly approved

## [2026-07-01] query | M1 strategy seed scan

- mode: A1 seed scan, web-assisted
- produced `wiki/notes/2026-07-01-m1-strategy-seed-scan.md`
- initial framework shortlist: Freqtrade, Hummingbot, Jesse, Homerun, NautilusTrader, vectorbt, REVM/Anvil/Alloy
- initial strategy families: event-triggered wallet-shadow, CEX with on-chain filter, volatility regimes, DeFi monitoring, liquidations, prediction markets, speed MEV, market making, new-chain scout, funding/perp basis
- no execution, keys, exchange accounts, or paid infra

## [2026-07-01] query | trading bot build guide map

- added `core/testing-protocol.md`
- added `loops/x-github-research-loop.md`
- added `wiki/notes/2026-07-01-trading-bot-build-guide-map.md`
- captured Hummingbot capital-fit concern as an unknown, not an assumption
- sources checked: Freqtrade docs, Hummingbot docs, NautilusTrader docs, Jesse docs/site

## [2026-07-01] setup | AI Research OS local install

- installed workshop repo mirror under `.openclaw/vendor/ai-research-os-workshop`
- installed local workshop skills under `.claude/skills/`
- added Obsidian-compatible config under `ralph-research-os/.obsidian/`
- added setup and loop output policy docs
- verified index generation through installed skill path

## [2026-07-01] setup | input output flow

- added `core/input-output-flow.md`
- defined how links, docs, repos, PDFs, audio, video, images, notes, and loop outputs enter RALPH
- clarified that YouTube transcript URLs are first-class AI Research OS inputs, while Telegram/local media need transcript/OCR/visual extraction before source promotion
- linked the flow from agent instructions, navigation, source intake, and A2 runbook

## [2026-07-01] ingest | AI Research OS workshop video

- mode: append, seed-only, no discovery rounds
- added `raw/youtube-ai-research-os-workshop-video.md` and `wiki/sources/youtube-ai-research-os-workshop-video.md`
- added `wiki/notes/2026-07-01-ai-research-os-video-guide.md` as the RALPH guide adaptation
- extracted YouTube metadata, under-video notes, links, timestamps, and page summary
- transcript extraction blocked by YouTube runtime protections; recorded fallback unknown `U-014`
- regenerated index and verified broken links 0, orphan sources 0, missing hubs 0

## [2026-07-01] query | YouTube transcript fallback

- tested `youtube-transcript-api`, `yt-dlp`, Invidious/Piped probes, and local `whisper.cpp`
- direct YouTube caption extraction remains unreliable from this cloud runtime
- local `whisper.cpp` with `ggml-base.bin` transcribed sample MP3/WAV successfully
- added `wiki/notes/2026-07-01-youtube-transcript-fallback-playbook.md`
- decision: public captions first, local ASR from provided media second; cookies/browser session only after explicit approval

## [2026-07-01] ingest | manual YouTube transcript

- Tomas supplied the AI Research OS video transcript from the Chrome extension `Youtube Transcript AI Summary`
- updated `raw/youtube-ai-research-os-workshop-video.md` with full manual transcript
- preserved manual transcript asset under `raw/assets/youtube-ai-research-os-workshop-video/`
- updated source summary, guide note, fallback playbook, and media-ingest decision
- marked `U-014` resolved for M1

## [2026-07-01] query | Obsidian connector verification

- recorded the throwaway YouTube account idea as a watch-only RALPH media-ingest fallback, not the default
- verified that RALPH is Obsidian-compatible and has the workshop `obsidian-cli` skill installed
- verified that no live Obsidian connector is active in this runtime: no `obsidian` CLI, no paired OpenClaw nodes, and no MCP servers
- corrected scope: system-level agent memory planning belongs outside RALPH
## [2026-07-01] cleanup | M1 board

- added `wiki/notes/2026-07-01-m1-board.md`
- clarified the top 3 next M1 loops: strategy-family taxonomy, framework shortlist comparison, and event-triggered wallet-shadow falsification
- fixed overview wording for the AI Research OS workshop video transcript: direct extraction was blocked, but Tomas's browser-extension transcript is now ingested
- no recurring/background loop was activated

## [2026-07-01] ingest | wallet-shadowing transcripts

- mode: append, seed-only, no discovery rounds
- Tomas supplied two RALPH / MEV bot wallet-shadowing transcripts: ChatGPT and Claude
- copied both transcripts verbatim into `raw/`
- added source pages, address inventory, wallet-shadowing strategy model, forward paper-trade gate, Trump risk radar, prior-art-before-experiment, and copyable-vs-radar comparison
- updated M1 board: Hyperliquid-first wallet-shadowing research is now the active working direction; later corrected scope so only Trump-person event material is radar-only
- added candidate `C-017` Hyperliquid-first wallet-shadowing research and `C-018` Trump risk radar
- added unknowns `U-017` through `U-020` for delay/cost survival, existing tools, activity-defined Hyperliquid universe, and Trump radar rules
- no live trading, wallet keys, exchange accounts, paid infra, or recurring loops were enabled

## [2026-07-01] query | wallet-shadowing prior-art tool scan

- ran the first manual A1 loop from the new wallet-shadowing direction
- checked Hyperliquid official docs, Copin, HyperX, Nansen, Chainstack, Dexly/HyperTracker/BitMEX-style references
- conclusion: discovery/tracking/copy-trading tools exist, but RALPH still needs independent forward paper-trade validation for Tomas-specific capture ratio
- updated M1 board: next loop is `hyperliquid-data-feasibility-spike`

## [2026-07-01] correction | Trump means president/person

- Tomas clarified that "Trump" means Donald Trump as president/person and his market-moving statements, not TRUMP coin or MELANIA coin
- updated wallet-shadowing notes, M1 board, synthesis, overview, candidates, unknowns, queues, and address inventory
- TRUMP/MELANIA/WLF token/treasury material remains only in raw transcripts and is out of scope unless Tomas explicitly reopens token/entity research
- current radar target is Trump-person event risk, especially wallets positioning around public statements, tariff/geopolitical/crypto-reserve comments, and similar violent market catalysts

## [2026-07-01] correction | wallet shadowing latency axis

- Tomas shared a prior-art-informed correction: the right axis is edge speed versus Tomas's latency, not coin choice
- added `raw/wallet-shadowing-latency-axis-correction-2026-07-01.md`
- added `wiki/concepts/shadowability-latency-axis.md` and `wiki/comparisons/wallet-shadowing-archetype-map.md`
- revised M1 board so Hyperliquid is the first technical branch, not the default alpha thesis
- added candidates for shadowability archetype mapping, aggregate smart-money flow, funding/basis wallet detection, and mid-cap accumulation research
- next loop should compare archetypes before overbuilding a BTC/ETH perp copy scanner

## [2026-07-01] ingest | patient-retail strategy map

- Tomas supplied `patient_retail_strategy_map.md`
- copied it verbatim into `raw/patient-retail-strategy-map-2026-07-01.md`
- added source summary, patient-retail strategy map, smart-money accumulation cohort concept, funding/basis structural baseline concept, archetype comparison, and OpenClaw prompt
- updated M1 board so next branch selection is patient-retail first: smart-money cohort discovery versus funding/basis baseline
- added candidates for patient-retail strategy map, smart-money cohort discovery, and funding/basis baseline monitor
- added unknowns for first-branch selection and exit-shadowing measurement

## [2026-07-01] correction | tool-first pivot

- Tomas challenged the build-first framing and asked why RALPH should not use existing tools such as Freqtrade, grid bots, Dune, EigenPhi, Tenderly, Copin, or similar products
- added `raw/tool-first-pivot-2026-07-01.md`
- added source summary, `tool-first-not-build-first`, and `existing-tools-vs-custom-ralph-layer`
- updated M1 board so `existing-tool-fit-map` comes before custom scanner/bot implementation
- added candidates for tool-first existing stack, Freqtrade as engine, and grid/range existing-tool trial
- added unknowns U-027 and U-028 for existing tool coverage and Freqtrade dry-run viability

## [2026-07-01] correction | slow copy-trading distinction

- Tomas clarified that the copy-trading branch he means is slow mid-cap spot accumulator following with week-scale holding periods, not fast Hyperliquid perp mirroring
- added `raw/slow-copy-trading-distinction-2026-07-01.md`
- added source page and comparison `fast-copy-trading-vs-slow-accumulator-following`
- updated smart-money accumulation cohort and copyable-vs-radar comparison
- added candidate C-029 and unknown U-029 around exit/distribution risk

## [2026-07-01] query | slow accumulator tool fit check

- checked official docs for Copin, Nansen, Arkham, Dune, Freqtrade, and Hyperliquid-related tooling
- conclusion: Copin is primarily perp DEX analytics/copy trading; it is not the likely primary source for slow spot/mid-cap accumulation
- Nansen is the best initial fit for smart-money accumulation workflows and API endpoints
- Arkham is useful for wallet/entity enrichment and transaction sanity checks
- Dune is useful for custom historical SQL/API extraction if coverage/freshness is sufficient
- Freqtrade is an engine, not a smart-money signal source
- added comparison `slow-accumulator-tool-fit-map`, candidate C-030, and unknown U-030

## [2026-07-01] query | liquidation-map liquidity provision

- Tomas proposed a "be the house" inversion: provide passive liquidity around forced liquidation clusters instead of copying smart money
- verified that Hyperliquid user state exposes liquidation prices via clearinghouse state references, while official docs frame info endpoint as exchange/specific-user data rather than a ready global heatmap
- found existing Hyperliquid liquidation map/data products including CoinGlass, Kiyotaka, TradingDifferent, Allium/Datawallet-style heatmaps, and 0xArchive-style liquidation data
- recorded correction: custom global map needs address-universe/indexing or a data provider; do not assume one endpoint gives all liquidation levels
- added concept `liquidation-map-liquidity-provision`, comparison `liquidation-map-build-vs-buy`, candidate C-031, and unknowns U-031/U-032

## [2026-07-01] spec | liquidation-map feasibility

- added `wiki/notes/2026-07-01-liquidation-map-feasibility-spec.md`
- defined no-key loop: tool-first heatmap/export inspection, small historical cascade sample, replay simulator, decision memo
- added candidate C-032 and unknown U-033 for replay data availability
- reiterated no live orders, keys, leverage, or recurring watcher before explicit approval

## [2026-07-01] correction | liquidation-map prior-art gap

- Tomas challenged the unsupported claim that a custom liquidation map is a missing differentiated retail layer
- verified claim-specific docs/pricing instead of relying on memory: Nansen pricing/credits, CoinGlass heatmap API/pricing, Hyperliquid info/liquidation mechanics, 0xArchive liquidation data/pricing, Kiyotaka and TradingDifferent heatmaps
- corrected RALPH: liquidation heatmaps/data products already exist; the possible gap is exportable history, replay, methodology transparency, passive-order simulation, adverse selection, and tail-risk scoring
- added `raw/liquidation-map-prior-art-gap-map-2026-07-01.md` and source page
- added candidate C-033 and unknowns U-034/U-035
- moved the next liquidation-map loop from replay/build toward `liquidation-map-prior-art-gap-map`

## [2026-07-01] correction | liquidation Q1 baseline kill switch

- Tomas caught a sequencing error: broad product/gap mapping is too early if the liquidation reversal edge has not beaten simple baselines
- verified that Nansen pricing sources conflict: API docs still show Free 10x credit consumption and 1,000 Pro starter credits, while a newer Nansen Academy article says the 10x markup was removed, Free has daily refresh to 10, and Pro has 2,000 monthly credits
- added `raw/liquidation-q1-baseline-kill-switch-2026-07-01.md` and source page
- updated liquidation feasibility spec so the first gate is Q1 plus baseline comparison, not broad heatmap product comparison
- added candidate C-034 and unknown U-036
- next liquidation-map loop is now `liquidation-q1-baseline-kill-switch`; broad gap map is only useful if Q1 survives

## [2026-07-02] experiment | C-034 liquidation Q1 harness

- added `experiments/liquidation-q1-baseline-kill-switch/` with a Node.js CLI harness for Q1, dumb candle/drawdown baselines, conservative costs, tail thresholds, volatility-proxy diagnostics, and cross-asset cascade clustering
- verified source constraints on 2026-07-02: native Hyperliquid `candleSnapshot` is limited to the most recent 5000 candles, while 0xArchive exposes the needed historical `liquidations` and `candles` route contracts
- ran fixture tests successfully with `npm test`
- ran preflight successfully; historical run is blocked because this runtime has no `OXARCHIVE_API_KEY`
- next action for U-036: add a 0xArchive key, fetch a bounded BTC/ETH/SOL window, run the harness, and record the proceed/discard decision from actual EV/tail/baseline metrics

## [2026-07-02] correction | C-034 spec conformance pass

- Tomas attached the full Q1 baseline kill-switch spec; saved it as `raw/liquidation-q1-baseline-killswitch-spec-2026-07-02.md` and summarized it at `wiki/sources/liquidation-q1-baseline-killswitch-spec-2026-07-02.md`
- tightened the C-034 harness to match the full spec: relative rolling liquidation thresholds, point-in-time cascade crossing, passive-limit replay, missed-fill opportunities, partial fills, no-top-outlier PnL, clustered-day loss metrics, and risk-adjusted baseline comparison
- changed tests so synthetic data is allowed to kill the liquidation thesis when dumb candle/drawdown baselines explain the move
- extended fetch to support comma-separated symbols such as `BTC,ETH,SOL` so cross-asset cascade clustering can be measured on real data
- reran `npm test` and `preflight`; both pass, and the real historical run remains blocked only by missing `OXARCHIVE_API_KEY`

## [2026-07-02] result | U-036 liquidation Q1 kill-switch

- Tomas provided a 0xArchive key for the run; used it only as a runtime environment variable and did not write it to repo files or logs
- fetched 2026-06-01 to 2026-07-01 5m data for BTC, ETH, and SOL from 0xArchive: 25,905 candles and 208,486 liquidation events
- optimized C-034 point-in-time event building from naive per-fill filtering to sliding-window grouping so the full dataset could run without shrinking the test
- result file: `experiments/liquidation-q1-baseline-kill-switch/results/major-2026-06.json`
- Q1 verdict: `do_not_build`
- liquidation cascade rule: 1,001 opportunities, 483 fills, 48.25% fill rate, 35.61% win rate, mean return -0.1148%, total return approx -114.96%, risk-adjusted score -4.42
- best dumb baseline: large-candle reversal mean return +0.1702%, risk-adjusted score +1.20
- blockers: negative EV after costs, does not beat dumb baselines, fails risk-adjusted baseline comparison, PnL depends on top outlier wins, and worst clustered day was -22.00%
- cross-asset cascade clustering was material: 56.04% of liquidation cascade signals clustered across BTC/ETH/SOL within the configured window
- decision: stop the liquidation-map build path for this Q1 configuration; do not proceed to Q2 gap map unless Tomas explicitly asks for a separate robustness/sensitivity run

## [2026-07-02] direction | strategy leg garden

- Tomas chose an exploratory mode: keep inventing and collecting more strategy legs with notes until something clicks, instead of forcing an immediate next branch
- added `wiki/notes/2026-07-02-strategy-leg-garden.md`
- updated M1 board: `strategy-leg-garden` replaces liquidation Q1 as the third active loop

## [2026-08-18] setup | TA learning loop bootstrap

- mode: A2 research/indexing only, approved by Tomas for background post-alert analysis
- added `automation/ta-learning-loop.md` and registered `ta-learning-loop` in `automation/loop-registry.yaml`
- added `../crypto-updates/analyze-alert-setups.mjs`, producing `../crypto-updates/setup-analysis-index.yaml`, `../crypto-updates/runtime/setup-analysis.json`, and `../crypto-updates/wiki/setup-analysis/latest.md`
- updated `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, `automation/loop-state.yaml`, and Crypto Updates ubiquitous language
- no standalone cron was enabled because the worker had no OpenClaw cron tool; the loop can run manually or from the approved isolated RALPH autoresearch loop
- pending Skill Workshop proposal created: `ralph-ta-learning-loop-20260818-d79d9f390f`; not applied or installed
- Telegram completion summary was accepted as message id `3539`, but visible delivery was not verified because Telegram read is unsupported by the local message CLI
- live alert text changed: no; execution, risk, sizing, TP/SL, and entry-valid rules unchanged
- moved C-031 through C-034 to discarded/completed state, added C-035 for the leg garden, and marked U-031 through U-034 plus U-036 resolved/killed where applicable
- added U-037 for tracking which rough legs repeatedly fit patient-retail constraints before promotion to a Q1-style test

## [2026-07-02] template | strategy leg note

- added `wiki/notes/templates/strategy-leg-note.md`
- template keeps every exploratory leg in the same comparable shape: thesis, observation, mechanism, speed, data rail, dumb baseline, cheapest kill test, kill criteria, tail risk, existing tools, and next micro-action
- included liquidation-map cascade reversal as a filled killed example so the first closed branch remains visible in the new note format
- added the rule that a leg remains `raw-idea` until it has a filled `Cheapest Kill Test`
## 2026-08-10

- Added `wiki/notes/2026-08-10-agent-skills-trading-bot-scan.md` after Tomas asked about RALPH autoresearch, Obsidian/second-brain behavior, and agent skills for crypto trading/trading-bot construction. Conclusion: RALPH has the loop architecture, recurring automation is not active, Obsidian render mode exists but Obsidian CLI is missing, and external trading skills should be audited before install.
- Activated A2 `ralph-autoresearch-loop` after Tomas explicitly approved independent recurring research with self-verification and rare notifications. Cron job `195477c4-ebd4-43e1-96f7-33d1f4cfd10d` runs in isolated OpenClaw sessions on Monday and Thursday at 09:30 Europe/Prague, uses public/free sources and local RALPH state, and may message Tomas only for promotion decisions, repeated blockers, timely research samples, or materially useful briefs. Hard exclusions remain: no live trading, wallet keys, exchange-account setup, paid APIs, public publishing, or automatic skill installation.
- Created pending Skill Workshop proposal `ralph-autoresearch-20260810-1551ecd971` to capture the loop procedure as a reusable skill. It is not applied or installed.
- Added index-first retrieval and token-budget rules after Tomas emphasized that RALPH must index its own work instead of rereading the vault. New files: `core/indexing-token-budget.md`, `automation/retrieval-router.yaml`, and `wiki/concepts/index-first-retrieval.md`. Updated autoresearch docs, RALPH agent instructions, cron prompt, and the pending `ralph-autoresearch` skill proposal. Obsidian status: RALPH is Obsidian-friendly markdown; OpenClaw main wiki render mode is Obsidian, but Obsidian CLI/bridge is currently unavailable.
- Added Crypto Updates monitor indexing after Tomas asked for monitor outputs to flow through all layers. Verified `crypto-updates-market-watcher.service` active, kept disabled polling watcher disabled, added `crypto-updates/index-monitor-feedback.mjs`, `runtime/monitor-index.sqlite`, `monitor-index.yaml`, and `wiki/monitor/` pages, and linked them from RALPH through `automation/retrieval-router.yaml`.
- Tomas approved applying pending reusable workflows, but `skill_workshop apply` timed out while applying both `crypto-monitor-indexing-20260810-aa80ec4d38` and `ralph-autoresearch-20260810-1551ecd971`. Did not bypass Skill Workshop by manually editing live skills.
- Promoted public orderflow as the current research priority for high-probability trade research. Added `wiki/notes/2026-08-10-public-orderflow-data-rail.md`, candidate `C-036`, unknown `U-038`, and work queue items for no-key public orderflow capture and alert-alignment validation. Implemented `crypto-updates/orderflow-spike.mjs` and captured BTC/ETH Binance + Hyperliquid public WebSocket data without keys; latest 15-second run `2026-08-10T22-50-15-062Z` produced 870 raw records.
- Added `crypto-updates/orderflow-features.mjs` and derived 104 compact 1-second feature rows from the latest spike into `features.sqlite`, `features-1s.csv`, and `features-manifest.yaml`. Next validation is aligning these features with Crypto Updates alert/review outcomes before proposing any strategy implementation.
## 2026-08-11

- Tomas approved broad background work for BTC/ETH alert backtesting and paper-trading. Added `btc-eth-alert-edge` as an approved paper-only loop with local public-data backtest outputs under `experiments/btc-eth-alert-edge/`.
- Tomas reinforced a hard "do not reinvent the wheel" rule. Promoted prior-art/wheel scan into `rules.md`, `core/testing-protocol.md`, and BTC/ETH alert-edge loop docs; added first BTC/ETH alert-edge prior-art scan.
- Added Binance public archive/rest-tail adapter for BTC/ETH alert-edge candles. First clean run generated a valid snapshot from Binance data and kept current BTC/ETH 4h reversal candidates at `low-sample`; invalid timestamp paper records from the first adapter run were reset.
- Added Tomas's "run own statistics / Verify-Reassess / find another way" rule to RALPH operating files and revised the pending reusable wheel-gate skill proposal. Ran first vectorbt benchmark via `uv`; it agreed with the weak-edge verdict for BTC/ETH 4h momentum reversal longs.
- Expanded alert-edge scope from BTC/ETH only to a dynamic crypto universe selector. Added public Binance/Hyperliquid/CoinGecko universe scan, verified SOL/HYPE coverage, separated single-venue movers into watch-only, and updated the 4h cron to refresh universe plus backtest snapshots.
- Added global access-verification gate after Tomas clarified that tools/data must be checked for real workspace access before being marked active. Created pending Skill Workshop proposal `access-verification-gate-20260811-6b57e389c7`; updated `AGENTS.md`, RALPH rules, prior-art gate, and autoresearch prompt.
- Added trader-grade TA/orderflow stack and access audit notes. Verified active access for Binance public data, Hyperliquid public data, vectorbt via `uv`, and local paper/shadow trading. Classified ATAS, Bookmap, Exocharts, TradingView, CoinGlass, Coinalyze, Laevitas, and Hyblock as watch/needs-approval or public-proxy benchmarks until access/account/API/subscription requirements are satisfied.
- Manual `ralph-autoresearch-loop` run timed out at 900s; narrowed future cron prompt into a micro-autoresearch loop with one bounded work item, at most 4 new source checks, no long setup unless explicitly selected as a spike, and no user-visible completion output.
- 2026-08-11 12:03 UTC alert-edge refresh completed successfully. Latest BTC/ETH setup candidates remain low-sample/weak, so no setup alert was sent. Dynamic universe selected liquid/moving assets including BTC, ETH, SOL, HYPE and watch-only high movers for later TA/orderflow gating.
- 2026-08-11 13:30 UTC continued from `continuation-prompts/2026-08-11-ralph-alert-edge-handoff.md`. Added public-proxy evidence capture to `crypto-updates/realtime-market-watcher.mjs`: Binance trade-side CVD/aggressive volume, Binance top-5 depth imbalance/spread/depth-shift, optional suppression logging, and optional compact evidence lines. Updated `index-monitor-feedback.mjs` to count `alert_suppressed`. Restarted watcher and verified Binance/Hyperliquid reconnect. Refreshed universe/backtest snapshots; BTC/ETH latest 4h momentum-reversal longs remain low-sample/weak, so no setup alert. Tomas immediately clarified that realtime watcher alerts must still send normally by default; changed the evidence gate to log-only unless `CRYPTO_UPDATES_REQUIRE_ALERT_EVIDENCE=1`, and kept the alert text unchanged unless `CRYPTO_UPDATES_INCLUDE_ALERT_EVIDENCE_LINE=1`.
- 2026-08-11 13:52 UTC Tomas clarified the intended watcher taxonomy: BTC and ETH alerts should keep sending as trading setup alerts; SOL and HYPE should also keep sending, but as event/move alerts rather than trading setups. Updated SOL/HYPE wording to `Event-only: neni trading setup; pro SOL/HYPE jen sbiram pohybova data.` and restarted the watcher.
- 2026-08-11 13:59 UTC Tomas added a hard approval gate: anything included in user-visible crypto alerts must be explicitly approved by him first. Added this to RALPH rules and alert-edge loop docs, created pending Skill Workshop proposal `crypto-alert-approval-gate-20260811-08ec40e191`, and guarded watcher alert-surface feature flags behind `CRYPTO_UPDATES_ALERT_SURFACE_CHANGE_APPROVED=1`.
- 2026-08-11 14:06 UTC audited whether any realtime alerts were missed while the watcher had the unapproved blocking gate. Checked `runtime/alert-feedback.jsonl` and `runtime/realtime-market-watcher.log` for 13:23-14:07 UTC. Result: no `alert_sent`, no `alert_suppressed`, and no finalized review records in that window; only restart/connect lines. Current watcher process is running and connected.
- 2026-08-11 14:12 UTC verified Tomas's HYPEUSDT Bybit close through read-only API: short qty 173.43, avg entry 55.05, avg exit 54.40, closed PnL +110.1164009 USDT, no remaining open position. Added `scripts/bybit-execution-reactor.mjs`, seeded its state to avoid re-alerting the already reported close, and created pending Skill Workshop proposal `bybit-execution-reaction-20260811-63c019e7d0`. Initially tested cron `bybit-execution-reactor` (`833300ba-9d59-4e0f-85be-6697dffd36ce`), then disabled it to avoid model-token polling. Replaced it with enabled user systemd service `bybit-execution-reactor.service`, polling read-only Bybit every 30s and sending Telegram only for new trade executions. Verified service active/running with `NRestarts=0` and no duplicate HYPE message.
- 2026-08-11 14:25 UTC Tomas clarified process attribution: ETH was an OpenClaw alert-driven trade; HYPE was not a trade from an OpenClaw setup alert, but an emotional/revenge-risk manual trade after the ETH loss. Updated trading journal entries to keep signal attribution separate from PnL outcome.
- 2026-08-11 20:44 UTC reconstructed the ETH DOWN VELOCITY alert from Telegram 3316 using Binance public `aggTrades`. The planned fade-long entry range would have filled and reached +0.30% TP before the -0.50% SL across first-in-range, range-high, midpoint, and range-low models. Added `trading-journal/2026-08-11-eth-alert-hypothetical-tp.md`; classify as missed alert-driven hypothetical winner, not durable edge proof.
- 2026-08-11 20:58 UTC Tomas clarified attribution for the same ETH alert: TP was hit, the OpenClaw call was good, and the miss was Tomas's execution/process error. Count it as a good alert plus missed user-execution opportunity, not as an alert failure.
- 2026-08-11 16:04 UTC alert-edge refresh completed successfully. Universe top set includes SOL, BTC, TUT, ETH, XRP; no data-source errors. Paper state changed: prior BTC/ETH 4h momentum-reversal longs closed at stops (-1R each), and two low-sample BTC/ETH 4h range-breakdown shorts are now open.
- 2026-08-11 20:03 UTC alert-edge refresh completed successfully. Universe top set shifted to SOL, ETH, TUT, BTC, TST; no data-source errors. Paper state remains two open low-sample BTC/ETH 4h range-breakdown shorts, with no closes this run.
- 2026-08-12 00:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, SOL, HOLO, TUT, ETH; no data-source errors. Paper state remains two open low-sample 4h range-breakdown shorts, with one low-sample close this run.
- 2026-08-12 04:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, SOL, HOLO, PROM, TUT; no data-source errors. Paper state remains two open positions, no closes this run, with latest BTC 4h momentum-reversal long still low-sample/weak.
- 2026-08-12 12:03 UTC alert-edge refresh completed successfully. Universe top set shifted to KAITO, BTC, ETH, SOL, TUT; no data-source errors. Paper state changed to one open low-sample BTC 4h momentum-reversal long; BTC/ETH 4h range-breakdown shorts closed at stops (-1R each).
- 2026-08-12 16:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ETH, KAITO, BTC, HYPE, SOL; no data-source errors. Paper state changed to two open positions: existing BTC 4h low-sample momentum-reversal long plus new ETH 4h avoid-tier trend-pullback short candidate.
- 2026-08-12 20:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, SOL, ETH, KAITO, PROM; no data-source errors. Paper state remains two open positions, no closes this run, latest ETH 4h trend-pullback short remains avoid-tier.
## 2026-08-13

- 2026-08-13 07:32 UTC `ralph-autoresearch-loop` ran `validation.orderflow-alert-alignment-backtest` as a bounded local-statistics check. Added `wiki/notes/2026-08-13-orderflow-alert-alignment-check.md`: joined 9 finalized Crypto Updates alert reviews to matching alert records and grouped verdicts by stored public orderflow evidence. Result: C-036 stays `Candidate` and U-038 stays `Open`; current sample is too small, fresh public depth was unavailable on every scored alert, `score 2/5` clustered with 3 follow-through cases, and one `score 4/5` ETH case ended noisy. Updated router, work queue, and loop state. No Telegram notification gate was met.
- 2026-08-13 08:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ETH, SOL, BTC, TUT, HYPE; no data-source errors. Paper state remains two open positions, no closes this run, and no fresh setup candidates on latest completed candles.
- 2026-08-13 12:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, BANK, HYPE, ETH, SOL; no data-source errors. Paper state changed to three open positions, no closes this run, latest ETH 4h trend-pullback short remains avoid-tier.
- 2026-08-13 16:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, SOL, TUT, HYPE, ETH; no data-source errors. Paper state remains three open positions, no closes this run, latest ETH 4h trend-pullback short remains avoid-tier.
- 2026-08-13 20:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, AVNT, HYPE, EDEN, ETH; no data-source errors. Paper state changed to two open positions with one close this run; latest ETH 4h trend-pullback short remains avoid-tier.
## 2026-08-14

- 2026-08-14 00:03 UTC alert-edge refresh completed successfully. Universe top set shifted to SOL, ETH, BTC, HYPE, ETHFI; no data-source errors. Paper state remains two open positions, no closes this run, and no fresh setup candidates on latest completed candles.
- 2026-08-14 04:03 UTC alert-edge refresh completed successfully. Universe top set shifted to EDEN, HYPE, BTC, ETH, SOL; no data-source errors. Paper state changed to four open positions, no closes this run, with fresh ETH 4h low-sample and ETH 1h avoid-tier trend-pullback short candidates.
- 2026-08-14 08:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, ETH, HYPE, ETHFI, SOL; no data-source errors. Paper state remains four open positions, no closes this run, with latest ETH 4h low-sample and ETH 1h avoid-tier trend-pullback short candidates still active.
- 2026-08-14 12:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ACE, BTC, SOL, HYPE, TUT; no data-source errors. Paper state changed to three open positions with one close this run; latest ETH 4h low-sample and ETH 1h avoid-tier trend-pullback short candidates remain the fresh candidates.
- 2026-08-14 16:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ACE, BTC, ETH, EDEN, TUT; no data-source errors. Paper state remains three open positions, no closes this run, latest candidate is ETH 1h avoid-tier trend-pullback short.
## 2026-08-15

- 2026-08-15 00:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ACE, SOL, ALICE, HYPE, BTC; no data-source errors. Paper state remains three open positions, no closes this run, latest candidate is ETH 1h avoid-tier trend-pullback short.
- 2026-08-15 04:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ACE, BTC, ETH, LINK, SOL; no data-source errors. Paper state changed to two open positions with one close this run, and no fresh setup candidates on latest completed candles.
- 2026-08-15 08:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ACE, ETH, ROBO, BTC, LINK; no data-source errors. Paper state changed to one open position with one close this run, and no fresh setup candidates on latest completed candles.
- 2026-08-15 12:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ACE, BTC, SOL, COW, ETH; no data-source errors. Paper state remains one open position, no closes this run, and no fresh setup candidates on latest completed candles.
- 2026-08-15 16:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ACE, COW, SOL, WAL, LINK; no data-source errors. Paper state remains one open position, no closes this run, and no fresh setup candidates on latest completed candles.
- 2026-08-15 20:03 UTC alert-edge refresh completed successfully. Universe top set shifted to COW, BTC, ACE, NIL, SOL; no data-source errors. Paper state remains one open position, no closes this run, and no fresh setup candidates on latest completed candles.
## 2026-08-16

- 2026-08-16 00:03 UTC alert-edge refresh completed successfully. Universe top set shifted to COW, ETH, BTC, ACE, SOL; no data-source errors. Paper state changed to zero open positions with one close this run, and no fresh setup candidates on latest completed candles.
- 2026-08-16 04:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ACE, COW, BTC, SOL, HEMI; no data-source errors. Paper state changed to one open position, no closes this run, latest candidate is BTC 1h avoid-tier momentum-reversal short.
- 2026-08-16 08:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ACE, SOL, HEMI, COW, ETH; no data-source errors. Paper state changed to two open positions, no closes this run, with latest ETH 4h low-sample trend-pullback short and BTC 1h avoid-tier momentum-reversal short candidates.
- 2026-08-16 12:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ETH, CHIP, HEMI, ACE, COW; no data-source errors. Paper state remains two open positions, no closes this run, with latest ETH 4h low-sample trend-pullback short and BTC 1h avoid-tier momentum-reversal short candidates.
- 2026-08-16 16:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, ETH, CHIP, ACE, SOL; no data-source errors. Paper state remains two open positions, no closes this run, with latest ETH 4h low-sample trend-pullback short and BTC 1h avoid-tier momentum-reversal short candidates.
- 2026-08-16 20:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, PORTAL, SOL, ACE, ETH; no data-source errors. Paper state remains two open positions with one close this run, with latest BTC 4h low-sample and BTC 1h avoid-tier momentum-reversal short candidates.
- 2026-08-17 00:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ETH, BTC, SOL, PORTAL, HYPE; no data-source errors. Paper state changed to four open positions, no closes this run, with latest BTC/ETH 4h low-sample trend-pullback shorts and BTC 4h low-sample momentum-reversal short candidates.
- 2026-08-17 04:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ACE, ETH, BTC, PORTAL, HEMI; no data-source errors. Paper state changed to three open positions with four closes this run; latest candidates include ETH 4h low-sample range-breakout long plus BTC/ETH 1h avoid-tier range-breakdown shorts and BTC/ETH 4h low-sample shorts.
## 2026-08-17

- 2026-08-17 07:31 UTC `ralph-autoresearch-loop` ran `validation.ta-orderflow-alert-gate-backtest` as a bounded local-statistics refresh of `wiki/notes/2026-08-13-orderflow-alert-alignment-check.md`. Rejoined 13 finalized Crypto Updates alert reviews to matching alert records. Result: `score 4/5` now splits across follow, fade, and noisy outcomes; `score 2/5` still maps to 3 same-window follow-through cases but remains too small. C-036 stays `Candidate`; U-038 stays `Open`; next useful step remains fresh public depth capture aligned to alert samples. No Telegram notification gate was met.
- 2026-08-17 08:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ETH, BTC, PORTAL, CHIP, HEMI; no data-source errors. Paper state remains three open positions, no closes this run, with latest ETH 4h low-sample range-breakout long, BTC/ETH 1h avoid-tier range-breakdown shorts, and BTC/ETH 4h low-sample shorts.
- 2026-08-17 11:45 UTC added first machine-readable RALPH decision graph seed at `graph/decision-graph.json`, with `graph/README.md`. It maps Crypto Updates watcher outputs to alert feedback, monitor index, BTC/ETH wick-fade hypothesis, entry-timing evidence, existing RALPH loops/experiment, and live-rule approval boundary. Validation passed with `OK 13 nodes, 12 edges`.
- 2026-08-17 12:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, SOL, GPS, ACE, HYPE; no data-source errors. Paper state remains three open positions, no closes this run, with latest ETH 4h low-sample range-breakout long plus BTC/ETH 1h avoid-tier range-breakdown short candidates.
- 2026-08-17 16:03 UTC alert-edge refresh completed successfully. Universe top set shifted to GPS, BTC, ETH, SOL, ACE; no data-source errors. Paper state changed to five open positions, no closes this run, with fresh BTC/ETH 4h low-sample range-breakout long candidates plus BTC/ETH 1h avoid-tier range-breakdown shorts still active.
- 2026-08-17 20:03 UTC alert-edge refresh completed successfully. Universe top set shifted to GPS, BTC, SOL, TUT, ACE; no data-source errors. Paper state changed to seven open positions, no closes this run, with fresh BTC 4h low-sample range-breakout long and ETH 4h low-sample momentum-reversal short candidates plus prior BTC/ETH 4h low-sample and BTC/ETH 1h avoid-tier candidates still active.
## 2026-08-18

- 2026-08-18 00:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, HYPE, GPS, ACE, ZEC; no data-source errors. Paper state remains seven open positions, no closes this run, with latest BTC 4h low-sample range-breakout long and ETH 4h low-sample momentum-reversal short candidates plus prior BTC/ETH 4h and BTC/ETH 1h candidates still active.
- 2026-08-18 04:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, GPS, TUT, ETH, HYPE; no data-source errors. Paper state changed to four open positions with four closes this run, with latest BTC 4h low-sample momentum-reversal short, BTC 4h low-sample range-breakout long, and ETH 4h low-sample momentum-reversal short candidates.
- 2026-08-18 08:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ACE, TUT, BTC, ETH, SOL; no data-source errors. Paper state remains four open positions, no closes this run, with latest BTC 4h low-sample momentum-reversal short candidate.
- 2026-08-18 12:03 UTC alert-edge refresh completed successfully. Universe top set shifted to SOL, ETH, GPS, BTC, TUT; no data-source errors. Paper state remains four open positions, no closes this run, with latest BTC 4h low-sample momentum-reversal short candidate.
- 2026-08-18 16:03 UTC alert-edge refresh completed successfully. Universe top set shifted to SOL, BTC, ETH, ACE, GPS; no data-source errors. Paper state changed to one open position with four closes this run; latest candidate is BTC 4h low-sample range-breakout long.
- 2026-08-19 04:03 UTC alert-edge refresh completed successfully. Universe top set shifted to GPS, BTC, ACE, HYPE, SOL; no data-source errors. Paper state changed to six open positions, no closes this run, with latest XRP 4h low-sample trend-pullback-reject short, BNB/AVAX 1h avoid-tier shorts, SOL 4h low-sample momentum-reversal short, and AVAX 4h C-tier trend-pullback-reject short candidates.
2026-08-19T07:48:00Z - Added high-probability setup router note after Tomas clarified alerts need rough win/loss probability and should focus on high-probability setups, not raw movement. Current research-only router candidates: regime-aligned range breakout, range/low-vol momentum reversal, downtrend breakdown/pullback reject, sweep/reclaim, VWAP as confluence. Live alert text unchanged.
2026-08-19T07:54:00Z - Updated high-probability setup router after Tomas clarified that fast watcher alerts and final trades are not the same object. RALPH should model a high-probability setup as an evolving TA thesis with staged probability updates: setup watch, entry candidate, manage, invalidated, post-review. TP/SL/trailing can change as management choices while thesis/invalidation stay explicit. Live alert text unchanged.
- 2026-08-19 08:03 UTC alert-edge refresh completed successfully. Universe top set shifted to SOL, ETH, BTC, ACE, HYPE; no data-source errors. Paper state remains six open positions, no closes this run, with latest XRP 4h low-sample short plus BNB/AVAX 1h avoid-tier shorts; no A/high-probability label justified from this run.
## 2026-08-20

- 2026-08-20 07:30 UTC `ralph-autoresearch-loop` ran `validation.ta-orderflow-alert-gate-backtest` as a bounded local-statistics refresh of `wiki/notes/2026-08-13-orderflow-alert-alignment-check.md`. Rejoined 60 finalized Crypto Updates alert reviews to matching alert records. Result: score/CVD-only evidence remains non-promotable (`score 4/5` splits 4 follow, 4 fade, 1 noisy; `score 0` is also balanced), and all 60 joined alerts still have fresh public depth unavailable. C-036 stays `Candidate`; U-038 stays `Open`; next useful step is fresh public depth capture or book freshness repair, not another score-only refresh. No Telegram notification gate was met.
- 2026-08-20 08:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ETH, HYPE, SOL, BTC, BOME; no data-source errors. Paper state changed materially to 11 open positions with 18 closes this run; latest promoted candidates are ADA 1h B, SOL 4h B, and XRP 4h B range-breakout longs, while low-sample rows remain learning inputs and no A/high-probability label is justified.
- 2026-08-20 12:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ETH, HYPE, SOL, BTC, XRP; no data-source errors. Paper state remains 11 open positions with 6 closes this run; latest promoted candidates are XRP 4h B and ADA 1h B range-breakout longs, while low-sample rows remain learning inputs and no A/high-probability label is justified.
- 2026-08-20 16:03 UTC alert-edge refresh completed successfully. Universe top set is HYPE, ETH, XRP, SOL, BTC; no data-source errors. Paper state changed to 12 open positions with 4 closes this run; latest promoted candidates remain XRP 4h B and ADA 1h B range-breakout longs, while low-sample rows remain learning inputs and no A/high-probability label is justified.
- 2026-08-20 20:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ETH, BTC, SOL, XRP, PUMP; no data-source errors. Paper state remains 12 open positions with 2 closes this run; latest promoted candidates remain XRP 4h B and ADA 1h B range-breakout longs, while low-sample rows remain learning inputs and no A/high-probability label is justified.
- 2026-08-20 22:20 UTC Tomas told RALPH to design its own layers and set its own goals. Added `core/autonomous-layer-goals.md` and `wiki/concepts/autonomous-research-layers.md` as the active A2 self-goal contract: safety/data/setup/backtest/forward-paper/candidate/pre-ML/future-ML/knowledge layers, with immediate goals for a forward paper tier dashboard, fresh public depth repair, B-tier separation from low-sample noise, and an ML-ready feature/label spec. Updated router, work queue, and loop state. Live trading, alert wording, risk, sizing, execution, keys, paid APIs, and real accounts remain outside autonomy.
- 2026-08-20 22:29 UTC completed first self-set goal `validation.forward-paper-tier-dashboard`. Added `experiments/btc-eth-alert-edge/src/paper-dashboard.mjs`, wired `npm run backtest` to refresh paper-dashboard JSON/Markdown, extended `npm run verify`, and updated experiment/runbook docs. Verified full path with `npm run backtest` plus `npm run verify`; current split: all paper rows 67 total / 55 closed / -3.7598R, qualified A/B/C rows 8 total / 7 closed / +1.4R, low-sample/avoid rows -5.1598R. No live behavior or alert wording changed.
- 2026-08-20 22:37 UTC continued `validation.book-freshness-repair-for-orderflow-alert-gate`. Found the root cause for all joined Binance alerts having `bookFresh=false`: `realtime-market-watcher.mjs` subscribed to `depth5@100ms` but parsed compact `b`/`a` arrays, while Binance partial-depth messages in this stream provide `bids`/`asks`. Patched the watcher parser to accept both forms and derive symbols from combined-stream names. Verified syntax and a representative parser-shape smoke check. Did not restart the running watcher because a 22:05 UTC HYPE alert still had an active 1h review; activation and fresh BTC/ETH/SOL alert verification remain pending. No live behavior, alert wording, risk, sizing, execution, account, key, or paid-data change was made.
- 2026-08-20 22:52 UTC continued `validation.book-freshness-repair-for-orderflow-alert-gate` with a no-key public alternate-route check only. Ran a 12s BTC/ETH/SOL `orderflow-spike.mjs` capture: 1,751 total records, including Binance `depth5` rows for BTCUSDT 58, ETHUSDT 58, and SOLUSDT 29, all with finite bid/ask spreads. Updated `wiki/notes/2026-08-20-book-freshness-repair.md` and `automation/loop-state.yaml`. The remaining blocker is live/shadow watcher verification, not public source access. Did not restart the live watcher because applying the parser fix could affect user-visible alert evidence fields under the alert-surface approval rule.
## 2026-08-21

- 2026-08-21 00:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, PUMP, ENA, XRP, HYPE; no data-source errors. Paper state remains 12 open positions, no closes this run, latest promoted candidates remain XRP 4h B and ADA 1h B range-breakout longs; low-sample rows remain learning inputs and no A/high-probability label is justified.
- 2026-08-21 04:03 UTC alert-edge refresh completed successfully. Universe top set shifted to XRP, BTC, SOL, ENA, PUMP; no data-source errors. Paper state changed to 9 open positions with 9 closes this run; latest promoted candidate is SOL 4h B range-breakout long. Qualified paper rows are still small sample (9 total / 8 closed / +3.2R), so no A/high-probability label is justified.
- 2026-08-21 05:59 UTC `ralph-autoresearch-loop` continued `validation.book-freshness-repair-for-orderflow-alert-gate` with a bounded local feature-shape check. Ran the existing compact feature extractor on the 2026-08-20 no-key BTC/ETH/SOL orderflow capture. It produced 112 1-second feature rows with 561 trades and 1,184 book updates represented; Binance BTCUSDT/ETHUSDT/SOLUSDT feature rows have finite average spread and L1 imbalance. Updated `wiki/notes/2026-08-20-book-freshness-repair.md` and `automation/loop-state.yaml`. C-036 stays `Candidate`; U-038 stays `Open` because the capture does not overlap finalized alert/review samples. No live behavior, alert wording, risk, sizing, execution, account, key, or paid-data change was made.
- 2026-08-21 08:03 UTC alert-edge refresh completed successfully. Universe top set shifted to BTC, ENA, ETH, PUMP, SOL; no data-source errors. Paper state changed to 10 open positions with 3 closes this run; latest promoted candidate remains SOL 4h B range-breakout long. Qualified paper rows remain small sample (10 total / 8 closed / +3.2R), so no A/high-probability label is justified.
- 2026-08-21 08:40 UTC watcher depth parser roll verified after Tomas approval: service restarted at 08:25 UTC, active PID 1188639, Binance and Hyperliquid reconnected, and post-roll ETH alert `ETH-UP-1787301604930-4fuxko` recorded `bookFresh=true` with non-null book fields. Czech Telegram summary send was accepted by OpenClaw but visible delivery was still unverified at cron end. No alert wording, risk, sizing, thresholds, trading, keys, or paid APIs changed.
- 2026-08-21 12:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ENA, BTC, PUMP, XRP, SOL; no data-source errors. Paper state changed to 9 open positions with 3 closes this run; latest promoted candidate remains SOL 4h B range-breakout long. Qualified paper rows remain small sample (10 total / 9 closed / +5R), so no A/high-probability label is justified.
- 2026-08-21 12:41 UTC watcher bookAgeMs timestamp fix rolled: pre-restart 1h reviews for HYPE-DOWN-1787310763677-ofohli and SOL-DOWN-1787310760275-0fd565 were finalized, `node --check` passed, service restarted at 12:20 UTC with PID 1194643, Binance and Hyperliquid reconnected, and no immediate errors appeared. No new BTC/ETH/SOL alert arrived during the bounded post-roll window; one HYPE alert did arrive but is outside the requested Binance book-evidence check, so post-roll BTC/ETH/SOL `bookAgeMs` evidence remains pending. No trading, keys, paid APIs, alert wording, risk, sizing, or thresholds changed.
- 2026-08-21 12:50 UTC `ralph-autoresearch-loop` continued `validation.book-freshness-repair-for-orderflow-alert-gate` with a bounded post timestamp-fix check. Service is active with PID 1194643 and reconnect logs are present. Since the 12:20 UTC restart, the local monitor has one HYPE alert and zero BTC/ETH/SOL alerts or finalized BTC/ETH/SOL reviews, so clean post-fix alignment evidence remains pending. Early post-roll BTC/ETH/SOL rows prove book fields can populate but had negative `bookAgeMs`, so they are operational evidence only. Updated `wiki/notes/2026-08-20-book-freshness-repair.md` and `automation/loop-state.yaml`; C-036 stays `Candidate`, U-038 stays `Open`, and no Telegram notification gate was met.
- 2026-08-21 13:25 UTC ran a research-only RALPH alert-feedback data analysis over local Crypto Updates feedback. Joined 117 alert_sent rows to 110 finalized reviews and wrote `wiki/notes/2026-08-21-alert-feedback-data-analysis.md`. Raw score/CVD remains non-promotable; only HYPE velocity and BTC/ETH/SOL wick buckets are worth monitoring. Parser-roll book evidence populated but is quality-tainted by negative `bookAgeMs` and one `score=6/5`; post-12:20 timestamp-fix BTC/ETH/SOL finalized reviews are still zero. C-036 stays `Candidate`, U-038 stays `Open`; no live alert, risk, sizing, threshold, trading, key, account, or paid-API change. Czech Telegram summary was accepted as message `3925`; Telegram readback is unsupported here, so visible delivery remains unverified.
- 2026-08-21 14:30 UTC post timestamp-fix bookAge verifier inspected BTC/ETH/SOL `alert_sent` rows after the 12:20 UTC watcher restart. Found five rows: BTC at 13:39 had stale public depth but non-negative `bookAgeMs=21076` and `score=0/5`; SOL 13:39, ETH 13:39, BTC 13:58, and ETH 14:06 all had `bookFresh=true`, non-negative ages from 20ms to 2790ms, populated spread/depth/imbalance fields, and scores within `maxScore=5`. No negative `bookAgeMs` or `score > maxScore` violation was found. This verifies the timestamp fix on live BTC/ETH/SOL alert evidence, while predictive promotion still needs finalized review/outcome samples. Czech Telegram summary sent via `openclaw message send`, accepted as message `3945`; Telegram readback is unsupported, so visible delivery remains unverified.
- 2026-08-21 16:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ENA, BTC, ZEC, XRP, HYPE; no data-source errors. Paper state remains 9 open positions with 1 close this run; latest promoted candidate remains SOL 4h B range-breakout long amid low-sample 4h breakout rows. Qualified paper rows remain small sample (10 total / 9 closed / +5R), so no A/high-probability label is justified.
- 2026-08-21 20:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ZEC, ENA, BTC, ETH, XRP; no data-source errors. Paper state remains 9 open positions with no closes this run; latest detected setups are ADA/BNB/XRP 4h low-sample range-breakout longs and LINK 1h low-sample trend-pullback-reclaim long. Qualified paper rows remain small sample (10 total / 9 closed / +5R), so no A/high-probability label is justified.
2026-08-21T21:24Z - Built `experiments/strategy-destruction-filter`, a research-only strategy survival filter inspired by Tomas's deflated-Sharpe/idea-destruction direction. First run tested 3 seed ideas / 9 variants across BTC/ETH/SOL 1h/4h public Binance data with costs and failure slices; all 9 variants were rejected. Verification passed. No live execution, keys, paid APIs, risk/sizing, or watcher behavior changed.

## 2026-08-22

- 2026-08-22 00:03 UTC alert-edge refresh completed successfully. Universe top set shifted to ZEC, ETH, BTC, SOL, XRP; no data-source errors. Paper state changed to 13 open positions with 4 closes this run; latest promoted candidate is SOL 4h B range-breakout long, while ETH/BNB/XRP/DOGE/ADA/LINK/AVAX 4h detections remain low-sample. Qualified paper rows remain small sample (11 total / 10 closed / +6.8R), so no A/high-probability label is justified.
- 2026-08-22 04:03 UTC alert-edge refresh completed successfully. Universe top set shifted materially to ZEC, XRP, HYPE, SUI, TRUMP; no data-source errors. Paper state changed to 26 open positions with 5 closes this run; latest promoted candidate remains SOL 4h B range-breakout long, while most fresh 1h/4h breakout detections are low-sample learning inputs. Qualified paper rows remain small sample (11 total / 10 closed / +6.8R), so no A/high-probability label is justified.
2026-08-22T02:35Z - Cleaned up RALPH operating direction after Tomas said the schedule/system felt chaotic. Verified active cron/jobs and services, created `automation/current-operating-map.md`, retargeted the existing `ralph-autoresearch-loop` cron prompt toward strategy-filter validation without changing cadence or adding jobs, and updated work queues/loop state. No live execution, keys, paid APIs, watcher thresholds, or alert wording changed.
2026-08-22T04:05Z - Hardened `experiments/strategy-destruction-filter` with chronological out-of-sample split support, a deterministic time-matched alternating-direction baseline, and labeled approximate deflated-Sharpe calibration. Full public Binance no-key run tested 3 candidates / 9 variants across BTC/ETH/SOL 1h/4h; all 9 were rejected and 0 survived. `npm test`, `npm run filter`, and `npm run verify` passed. Telegram summary sent via `openclaw message send`, accepted as message `4112`; Telegram readback is unsupported, so visible delivery remains unverified. No live execution, keys, paid APIs, watcher thresholds, or alert wording changed.
2026-08-22T04:13Z - Expanded `experiments/strategy-destruction-filter` from short initial lookbacks to downloaded multi-year Binance public archive history. Default BTC/ETH/SOL spot 1h and 4h lookbacks are now 1825 days, and the report records candle coverage per source. Latest run covered BTC/ETH/SOL 1h from 2021-08-23 05:00 UTC to 2026-08-21 23:00 UTC (43,792 candles each) and 4h from 2021-08-23 08:00 UTC to 2026-08-22 04:00 UTC (10,950 candles each). Result stayed strict: 3 candidates / 9 variants / 0 survivors / 9 rejected. `npm test`, `npm run filter`, and `npm run verify` passed. No live execution, keys, paid APIs, watcher thresholds, or alert wording changed.
2026-08-22T04:48Z - Continued strategy-filter data-rail work under the new verify/reassess/dig rule. Checked available MCP connectors and found no relevant crypto market-data MCP exposed. Verified direct public access instead: Hyperliquid `candleSnapshot` and `fundingHistory` work for HYPE but 1h candles are practically row-capped; Bybit v5 public linear market has active `HYPEUSDT`, launch time `2024-12-04T12:52:20Z`, and pageable klines/funding/open-interest. Added `src/market-data.mjs`, `src/audit-data-rails.mjs`, Bybit linear HYPE support, report market identity fields, market-data access audit outputs, and parser coverage. Latest full filter run now includes BTC/ETH/SOL Binance spot plus HYPE Bybit linear perps: HYPE 1h 14,993 candles from 2024-12-05 12:00 UTC to 2026-08-22 04:00 UTC and HYPE 4h 3,749 candles over the same interval. Result remains 3 candidates / 9 variants / 0 survivors / 9 rejected. `npm run audit:data`, `npm test`, `npm run filter`, and `npm run verify` passed; verifier now requires the generated data-access audit and saw 7 accessible rails. No live execution, keys, paid APIs, recurring jobs, watcher thresholds, or alert wording changed.
2026-08-22T05:03Z - Extended `experiments/strategy-destruction-filter` from HYPE candle access to HYPE perps-context testing. Bybit funding and open-interest histories are now joined onto HYPE candles, feature coverage is reported, and a new `perp-funding-oi-fade-v0` candidate tests crowded funding/OI reversion under the same OOS/baseline/deflated-Sharpe/failure-slice gates. Latest run: 4 candidates / 13 variants / 0 survivors / 13 rejected. The best perps-context variant had positive in-sample expectancy but failed out-of-sample expectancy and failure-slice gates, so it was rejected rather than promoted. `npm test`, `npm run filter`, and `npm run verify` passed. No live execution, keys, paid APIs, recurring jobs, watcher thresholds, or alert wording changed.
2026-08-22T05:35Z - Added a pre-candidate feature diagnostic layer to `experiments/strategy-destruction-filter`. New `npm run study:features` writes `results/feature-study.json` and `.md` with funding, open-interest-change, and RSI baseline distributions plus forward-return buckets by market/timeframe/regime. Latest generated report: 8 studies / 48 buckets. HYPE high-positive funding shows a raw short/fade tendency over 6 bars, while OI-change extremes alone are weak and RSI-only baselines remain mixed; this is diagnostic only, not a promoted strategy. `npm test`, `npm run study:features`, `npm run audit:data`, `npm run filter`, and `npm run verify` passed. Filter remains 4 candidates / 13 variants / 0 survivors / 13 rejected. No live execution, keys, paid APIs, recurring jobs, watcher thresholds, risk/sizing, or alert wording changed.
2026-08-22T05:58Z - Completed `validation.strategy-idea-spec-schema` as the next flexible/systematic loop after the feature study. Added `schemas/strategy-idea.schema.json`, `src/candidate-spec.mjs`, `src/validate-candidates.mjs`, and `npm run validate:candidates`; `run-filter` and `verify-filter` now reject malformed candidate ideas before backtesting. Existing seed strategies now include mechanism, edge speed, falsifiable claim, data requirements, baseline, gates, and kill criteria. Queue moved this item to done; next validation priority is `pre-ml-feature-label-table-spec`. `npm run validate:candidates`, `npm test`, `npm run audit:data`, `npm run study:features`, `npm run filter`, and `npm run verify` passed. No live execution, keys, paid APIs, recurring jobs, watcher thresholds, risk/sizing, or alert wording changed.
2026-08-22T06:05Z - Completed `validation.pre-ml-feature-label-table-spec`. Added `schemas/pre-ml-feature-row.schema.json`, `src/feature-table-spec.mjs`, `src/validate-feature-table.mjs`, and `npm run validate:features` to the alert-edge experiment; `npm run verify` now enforces the generated swarm feature table contract. Fresh `npm run swarm` produced 73 joined alert rows, 13 clean and 60 tainted, and top simple scouts remain weak around 42% accuracy, so this blocks ML/trade promotion rather than enabling it. `npm run validate:features` and `npm run verify` passed. No live execution, keys, paid APIs, recurring jobs, watcher thresholds, risk/sizing, or alert wording changed.
2026-08-22T06:08Z - Completed `validation.candidate-scoring-dry-run`. Added `automation/candidate-scoring-dry-run.mjs`, producing `outputs/candidate-scoring-dry-run.json` and `.md` from `decisions/candidates.md` using `core/candidate-scoring.md` dimensions. First pass exposed and fixed a routing bug where discarded candidates could rank near the top; corrected sorting now keeps discarded branches out of active top routes. Dry-run result: 37 candidates, 4 benchmark, 22 investigate, 7 watch, 4 discard. Top active routes are C-015, C-036, C-009, C-004, and C-003. This is a queue router only, not strategy promotion or candidate-state mutation. No live execution, keys, paid APIs, recurring jobs, watcher thresholds, risk/sizing, or alert wording changed.
2026-08-22T06:20Z - Completed `validation.strategy-score-rubric-dry-run`. Added `automation/strategy-score-rubric-dry-run.mjs`, a second-stage research-only review over the candidate scoring dry-run. It reviewed 37 candidates without mutating candidate states: 29 accepted routes, 1 downgrade, 3 holds, and 4 discarded branches preserved. Rubric-qualified benchmark routes are C-015 X/GitHub strategy knowledge loop, C-036 public orderflow data rail, and C-009 trading bot framework/repo map. C-004 DefiLlama battlefield context was downgraded from benchmark to investigate until it has a falsifiable benchmark target. C-027, C-037, and C-012 were held at watch due to execution/live-adjacent wording that needs research-only containment. No live execution, keys, paid APIs, recurring jobs, watcher thresholds, risk/sizing, execution, or alert wording changed.
2026-08-22T06:37Z - Completed `discovery.x-github-strategy-keyword-scan` as the next C-015 loop. Wrote `wiki/notes/2026-08-22-x-github-strategy-knowledge-scan.md` from bounded public GitHub/web and unauthenticated GitHub API checks. Main result: public repos should feed validation patterns, overfit/postmortem rules, and execution-realism tests, not direct strategy copying. Freqtrade remains the best C-009 no-key framework spike, hftbacktest is the strongest C-036 orderflow-replay feasibility lead, and Quantito is a useful Hyperliquid overfit warning. Added `validation.hftbacktest-orderflow-replay-feasibility` as the next concrete C-036 test. No live execution, keys, paid APIs, recurring jobs, watcher thresholds, risk/sizing, execution, or alert wording changed.
2026-08-22T06:44Z - Completed `validation.hftbacktest-orderflow-replay-feasibility`. Added `automation/hftbacktest-orderflow-replay-feasibility.mjs` and generated `outputs/hftbacktest-orderflow-replay-feasibility.md` from the existing no-key public orderflow capture `2026-08-20T22-49-17-670Z`. The script projected 1,751 raw events into 4,617 hftbacktest-like trade/depth/top-of-book rows, but every projected row lacks a separate local receive timestamp and 3,396 rows lack native exchange timestamp evidence. Verdict: partial schema fit, not replay-grade yet. Added `validation.orderflow-capture-v2-schema` as the next blocker. No hftbacktest install/run, live execution, keys, paid APIs, recurring jobs, watcher thresholds, risk/sizing, execution, or alert wording changed.
2026-08-22T06:49Z - Completed `validation.orderflow-capture-v2-schema`. Updated only the read-only public capture tool `crypto-updates/orderflow-spike.mjs` to store `exchangeTs`, `localReceiveTs`, and `sequenceId` in raw JSONL plus `exchange_ts`, `local_receive_ts`, and `sequence_id` in SQLite. A bounded 5s no-key BTC capture (`2026-08-22T06-48-09-276Z`) produced 751 raw events; the hftbacktest feasibility checker projected 1,780 rows with 0 missing separate local timestamps and 0 missing native exchange timestamp evidence. Schema blocker is cleared; next blocker is `validation.hftbacktest-minimal-replay-runtime-spike`. No live watcher, alert wording, thresholds, keys, paid APIs, risk/sizing, execution, or recurring job changed.
2026-08-22T07:08Z - Completed `validation.hftbacktest-minimal-replay-runtime-spike`. Created an isolated scratch `uv` venv and installed `hftbacktest==2.4.4` without global Python changes. Added `automation/hftbacktest-minimal-replay-runtime-spike.py` plus JSON/Markdown outputs. The script converted the no-key capture-v2 run `2026-08-22T06-48-09-276Z` to Binance BTCUSDT-only `event_dtype`, seeded a first depth snapshot, corrected exchange/local timestamp ordering, and replayed 1,756 rows. No-trade baseline stayed flat with 20 finite-book observations; passive fixed-spread single quote produced one simulated fill under zero-fee, zero-latency, 0.001 BTC assumptions. Verdict: runtime path validated, not edge evidence. Next work needs fixture tests, longer bounded capture, and conservative fee/latency assumptions before any strategy claims. No live watcher, alert wording, thresholds, keys, paid APIs, recurring jobs, risk/sizing, execution, or strategy promotion changed.
2026-08-22T08:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set remains ZEC, TRUMP, XRP, PUMP, SOL, HYPE, BTC, SUI, ENA, BOME, ETH, AAVE, DOGE, ONG, TRB, LIT, DASH, ENS, POL, ADA; no data-source errors. Paper state changed to 13 open positions with 13 closes this run and 20 latest candidates. Historical B/C buckets show positive expectancy over baseline in several rows, but paper-qualified A/B/C evidence is still only 11 total rows / 11 closed / +5.8R, so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-22T10:44Z - Finalized `validation.two-to-four-hour-orderflow-capture` for run `2026-08-22T08-39-ralph-hl-btc-2h`. PID 1287957 was complete and wrote `manifest.yaml` plus 855,975 raw records: Hyperliquid 57,390 and Binance 798,585. Feature extraction produced 11,519 one-second rows. Replay feasibility projected 1,885,667 hftbacktest-like rows with 0 missing separate local receive timestamps; Hyperliquid BTC depth/trade projected rows had native exchange timestamp evidence. Hyperliquid-only hftbacktest smoke validated 176,075 replay rows, 0 missing exchange/local timestamp events, 0 negative feed-latency rows, no-trade flat, and 2 passive fixture fills under zero-fee/zero-latency assumptions. Syntax, unittest, YAML, and JSON parse checks passed. OpenClaw accepted a Telegram-visible summary but session history did not verify visible delivery. No live watcher, alert wording, thresholds, keys, paid APIs, risk/sizing, execution, or orders changed.
2026-08-22T12:05Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set changed materially to ZEC, TRUMP, SOL, XRP, PUMP, BTC, HYPE, ASTER, SUI, LIT, HEMI, ETH, POL, ENA, DASH, DOGE, AAVE, MOVE, STX, ACE; no data-source errors. Paper state is 13 open with 1 close this run and 19 latest candidates; all latest detections are low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-22T16:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted to ZEC, TRUMP, POL, SOL, PUMP, BTC, HYPE, XRP, ENA, ETH, TAO, DOGE, LIT, LINK, ONG, STX, AAVE, DASH, ASTER, MELANIA; no data-source errors. Paper state remains 13 open with 0 closes this run and latest candidates dropped to 13; all latest detections are low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-22T20:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to ZEC, TRUMP, PUMP, SOL, ENA, ETH, BTC, HYPE, XRP, DASH, POL, STX, DOGE, AAVE, VVV, MELANIA, TUT, PYTH, ONG, BNB; no data-source errors. Paper state remains 13 open with 0 closes this run and 13 latest candidates, all low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-23T00:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to TRUMP, PUMP, ETH, BTC, SOL, HYPE, ZEC, ZRO, XRP, DOGE, ENA, TUT, TAO, STX, ONG, POL, MELANIA, ONDO, ASTER, SUI; no data-source errors. Paper state remains 13 open with 0 closes this run and 13 latest candidates, all low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-23T04:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to TRUMP, ETH, BTC, SUI, HYPE, PUMP, ZEC, TAO, SOL, LINK, TUT, WLD, ONDO, ASTER, NEAR, ORDI, ADA, WLFI, XRP, MELANIA; no data-source errors. Paper state changed materially to 1 open with 13 closes this run and 1 latest candidate: XRP 1h long momentum_reversal_long, low-sample with negative historical expectancy, so it is a learning input only. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-23T08:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to TRUMP, SOL, ETH, BTC, PUMP, HYPE, ZEC, TUT, ZRO, ENA, STX, XRP, TAO, SUI, DOGE, WLD, MOVE, ZAMA, BNB, ADA; no data-source errors. Paper state remains 1 open with 0 closes this run and 1 latest candidate: XRP 1h long momentum_reversal_long, low-sample with negative historical expectancy, so it is a learning input only. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-23T12:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to PUMP, ENA, SOL, ETH, BTC, HYPE, TUT, ZRO, XRP, STX, XPL, UNI, AAVE, TRUMP, ZEC, DOGE, ACE, ETHFI, LIT, BNB; no data-source errors. Paper state changed to 4 open with 0 closes this run and 4 latest candidates: ETH/LINK/AVAX 4h trend_pullback_reclaim_long and XRP 1h momentum_reversal_long, all low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-23T16:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to ENA, SOL, BTC, PUMP, HYPE, ZEC, XRP, ZRO, TUT, ETH, STX, AAVE, TRUMP, SUI, PENDLE, MORPHO, ETHFI, XPL, UNI, DOGE; no data-source errors. Paper state remains 4 open with 0 closes this run and 4 latest candidates: ETH/LINK/AVAX 4h trend_pullback_reclaim_long and XRP 1h momentum_reversal_long, all low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-23T20:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, BTC, HYPE, ENA, PUMP, ZEC, XRP, ETH, TRUMP, TAO, MORPHO, PENGU, AAVE, ZRO, ONDO, SPK, ASTER, DOGE, XPL, TUT; no data-source errors. Paper state remains 4 open with 0 closes this run and 4 latest candidates: ETH/LINK/AVAX 4h trend_pullback_reclaim_long and XRP 1h momentum_reversal_long, all low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-24T00:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, BTC, HYPE, TRUMP, ZEC, PUMP, ETH, ENA, PENGU, MORPHO, TAO, AAVE, LIT, SPK, XRP, NEAR, DOGE, SUI, PENDLE, XPL; no data-source errors. Paper state remains 4 open with 0 closes this run, but latest candidates dropped to 1: XRP 1h momentum_reversal_long, low-sample with negative historical expectancy, so it is a learning input only. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
# 2026-08-24T07:30:00Z - RALPH autoresearch micro-run

- Work item: `validation.strategy-filter-calibration-audit`.
- Output: `wiki/notes/2026-08-24-strategy-filter-calibration-audit.md`.
- Verdict: Current strategy-destruction filter remains a valid rejection gate: 13 variants tested, 0 survivors, 0 positive out-of-sample expectancy, and 0 current deflated-Sharpe proxy passes. The best-looking in-sample variant still failed out-of-sample and out-of-sample baseline lift.
- Reassessment: Keep the current `approximate_multiple_testing_deflated_sharpe` label; do not overstate it as full DSR. Next smallest hardening step is a diagnostic-only PSR-style metric using skewness, kurtosis, sample length, and matched-baseline Sharpe.
- Boundaries: no live trading, orders, keys, paid APIs, account setup, package install, alert wording change, or Telegram notification.
2026-08-24T12:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to BTC, SOL, ENA, HYPE, PUMP, ZEC, ETH, PROM, PENGU, SUI, MORPHO, LIT, LINK, SPK, ONDO, TUT, AAVE, PORTAL, TRUMP, XRP; no data-source errors. Paper state changed to 10 open with 0 closes this run and 9 latest candidates: BTC/ETH/BNB/XRP/DOGE/ADA/AVAX 1h momentum_reversal_short plus BTC/BNB 1h range_breakout_long; latest rows are avoid or low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R, PF implied by only 6 targets vs 5 losses), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-24T16:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to BTC, ETH, SOL, HYPE, VIRTUAL, TUT, PUMP, ZEC, PROM, SUPER, TRUMP, AERO, PORTAL, ENA, LIT, PENGU, XRP, AAVE, DOGE, BNB; no data-source errors. Paper state remains 10 open with 0 closes this run and 9 latest candidates, all avoid or low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R, PF implied by only 6 targets vs 5 losses), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-25T00:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, BTC, ETH, HYPE, PUMP, ZEC, XRP, TUT, SUI, AERO, PROM, SUPER, STORJ, TRUMP, PORTAL, SPK, ENA, DOGE, HEMI, AAVE; no data-source errors. Paper state changed to 11 open with 0 closes this run and 10 latest candidates, all avoid or low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R, 6 wins and 5 losses), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-25T04:05Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, BTC, ETH, HYPE, AERO, ZEC, TUT, PROM, PUMP, VIRTUAL, SUI, STORJ, ONG, SUPER, AAVE, ENA, XRP, INJ, PENGU, WIF; no data-source errors. Paper state changed to 8 open with 8 closes this run and 6 latest candidates, all low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R, 6 wins and 5 losses; PF not enough without sample size), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-25T12:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, BTC, ENA, ZEC, ETH, PUMP, TUT, ONG, HYPE, HEMI, MORPHO, TRUMP, XRP, DOGE, AAVE, PORTAL, SUI, BNB, XMR, INJ; no data-source errors. Paper state changed to 3 open with 2 closes this run and 5 latest candidates: BTC/XRP/DOGE/AVAX 4h long trend/range setups plus ADA 1h short trend_pullback_reject_short, all low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (11 total / 11 closed / +5.8R, 6 wins and 5 losses), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-25T13:16Z - Continued Tomas's profitability trader loop from `continuation-prompts/2026-08-25-1308-profitability-trader-loop-handoff.md`. Hardened `experiments/strategy-destruction-filter` with diagnostic-only `diagnostic_probabilistic_sharpe_proxy`, comparing variant trade Sharpe against matched baseline Sharpe while accounting for sample length, skew, and kurtosis. Latest full run: 4 candidates / 13 variants / 0 survivors / 13 rejected. Best HYPE funding/OI fade variant has PSR-style probability 0.9426 versus baseline but still fails expectancy, profit factor, deflated-Sharpe, failure-slice, and out-of-sample gates, so no promotion. `npm test`, `npm run validate:candidates`, `npm run filter`, and `npm run verify` passed. No live execution, keys, paid APIs, recurring jobs, watcher thresholds, risk/sizing, or alert wording changed.
2026-08-25T13:50Z - Continued profitability trader loop by converting the HYPE funding feature-study lead into explicit candidates. Added funding-only, trend-filtered, and trend+timeframe-filtered HYPE perp fade rules to `experiments/strategy-destruction-filter`. Full run now tests 7 candidates / 65 variants, with 0 survivors / 65 rejected. Best trend-filtered variant (`perp-funding-trend-filter-fade-v0#6`) had sample 90, expectancy +0.3359R, profit factor 1.6283, deflated-Sharpe proxy 1.6783, max drawdown 14.2831R, but failed out-of-sample expectancy at -0.2356R. Best 1h range-only variant had +0.294R but only 76 samples and negative OOS. Verdict: HYPE funding fade is a promising research lead but not paper-promotion-ready. `npm run validate:candidates`, `npm test`, `npm run filter`, and `npm run verify` passed. No live execution, keys, paid APIs, recurring jobs, watcher thresholds, risk/sizing, or alert wording changed.
2026-08-25T21:24Z - Continued profitability trader loop by adding walk-forward diagnostics to `experiments/strategy-destruction-filter`. Reports now include 5 equal-trade-count chronological folds with positive-fold counts, baseline-lift fold counts, OOS-fold counts, and minimum fold expectancy. Latest run remains 7 candidates / 65 variants / 0 survivors. The top HYPE funding trend variant still has strong headline expectancy but only 3/5 positive folds and 0 positive OOS folds; its last two folds are negative. Broader funding-only variant has 4/5 positive folds but still fails hard OOS, drawdown, and failure-slice gates. `npm run validate:candidates`, `npm test` (22/22), `npm run filter`, and `npm run verify` passed. No live execution, keys, paid APIs, recurring jobs, watcher thresholds, risk/sizing, or alert wording changed.
2026-08-25T16:05Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, BTC, HYPE, ZRO, ZEC, PUMP, ONG, ETH, HEMI, TRUMP, ENA, XRP, AERO, LIT, DOGE, PROM, STX, SUI, BNB, VVV; no data-source errors. Paper state remains 3 open with 2 closes this run, but latest candidates changed to BNB 4h long trend_pullback_reclaim_long tier C, LINK 4h long trend_pullback_reclaim_long low-sample, and ADA 1h short trend_pullback_reject_short low-sample. Qualified A/B/C paper evidence remains small sample (12 total / 11 closed / +5.8R, 6 wins and 5 losses), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-25T20:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, ETH, BTC, HYPE, ZRO, ZEC, ONG, XRP, STX, PROM, PEOPLE, BMT, TRUMP, PUMP, DOGE, SUI, ENA, POL, AAVE, BNB; no data-source errors. Paper state remains 3 open with 0 closes this run and 3 latest candidates: BNB 4h trend_pullback_reclaim_long tier C, LINK 4h trend_pullback_reclaim_long low-sample, and ADA 1h trend_pullback_reject_short low-sample. Qualified A/B/C paper evidence remains small sample (12 total / 11 closed / +5.8R, 6 wins and 5 losses), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-25T22:05Z - Continued Tomas's profitability loop from the Obsidian/RALPH handoff. Created `wiki/notes/2026-08-25-profitability-loop-integration-map.md` and updated `automation/current-operating-map.md` plus `automation/retrieval-router.yaml` with an explicit integration route: `liquid-crypto-alert-edge-backtest` is the high-throughput paper ledger, `strategy-destruction-filter` is the kill gate, `ralph-autoresearch-loop` is the bounded researcher, orderflow/hftbacktest is context and execution realism, copytrading/shadowing is radar or slow-cohort hypothesis source, and computer-use remains optional/needs-access-verification. Latest inspected alert-edge dashboard had 129 total paper signals and only 12 A/B/C rows; B tier was +8.8R over 8 closed rows, while C tier was -3R over 3 closed rows, so no A/high-probability promotion. No live execution, keys, paid APIs, cron cadence, Telegram alert wording, risk/sizing, orders, or watcher behavior changed.
2026-08-25T22:06Z - Ran the first concrete alert-edge-to-destruction-filter integration. Added generic optional `symbol`, `timeframe`, `trend`, and `volatility` filters to `experiments/strategy-destruction-filter`, added XRP Binance spot to the filter universe, and added `alert-edge-xrp-range-breakout-v0` from the strongest current alert-edge B-tier bucket (`XRP 4h range_breakout_long up/mid-vol`). Latest verified run: 8 candidates / 69 variants / 0 survivors / 69 rejected; feature study now has 10 studies / 56 buckets. Best XRP variant had sample 134, expectancy +0.0278R, PF 1.0435, deflated-Sharpe -0.0183, OOS +0.2115R, baseline lift -0.0978R, max drawdown 24.9469R, and 3/5 positive folds, so it is rejected. Commands passed: `npm run audit:data`, `npm run validate:candidates`, `npm test`, `npm run study:features`, `npm run filter`, and `npm run verify`. No live execution, keys, paid APIs, cron cadence, Telegram alert wording, risk/sizing, orders, or watcher behavior changed.
2026-08-25T22:45Z - Continued the approved `volume velocity -> strict candidate` pass. Added reproducible alert-feedback velocity analysis to `experiments/strategy-destruction-filter`, selected the cleanest source bucket `ETH|60s|DOWN|5/5|clean_orderflow_book` with 4/4 fade-useful reviews, added a strict `volume_velocity_fade` OHLCV proxy rule, and added candidate `alert-feedback-eth-velocity-fade-v0`. Full filter run: 9 candidates / 105 variants / 0 survivors / 105 rejected. Best new ETH variant had sample 954, expectancy -0.1655R, PF 0.7693, deflated-Sharpe -4.2329, OOS -0.1932R, baseline lift -0.0312R, max drawdown 164.213R, and 0/5 positive folds, so the bucket remains only a watch/research lead. Verified with alert-feedback analysis, candidate validation, tests, data audit, feature study, filter, and verify. No live trading, keys, paid APIs, cron cadence, alert wording, watcher behavior, risk/sizing, execution, or orders changed.
2026-08-26T00:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, ZEC, HYPE, STX, ETH, ONG, SUI, BTC, PUMP, BMT, LINK, PEOPLE, TRUMP, PROM, XRP, DOGE, STORJ, ENA, MON, ZRO; no data-source errors. Paper state changed to 1 open with 2 closes this run and 3 latest candidates: BNB 4h trend_pullback_reclaim_long tier C, LINK 4h trend_pullback_reclaim_long low-sample, and ADA 1h trend_pullback_reject_short low-sample. Qualified A/B/C paper evidence remains small sample (12 total / 11 closed / +5.8R, 6 wins and 5 losses), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-26T04:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, BTC, ETH, ZEC, STX, HYPE, ENA, PUMP, BMT, TRUMP, ONG, XRP, DOGE, PROM, SUI, MON, FARTCOIN, ZRO, STORJ, ADA; no data-source errors. Paper state changed to 11 open with 0 closes this run and 10 latest candidates: ETH/DOGE/ADA 4h long learning setups plus BTC/ETH/SOL/BNB/LINK 1h long momentum_reversal_long and XRP/DOGE 1h short range_breakdown_short; latest rows are avoid or low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (12 total / 11 closed / +5.8R, 6 wins and 5 losses; PF not enough without sample size or forward confirmation), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-26T07:56Z - Continued the volume-velocity branch after the killed ETH proxy. Added research-only `npm run assess:velocity-replay` to `experiments/strategy-destruction-filter`, producing `results/velocity-replay-adapter-feasibility.json` and `.md`, plus note `wiki/notes/2026-08-26-velocity-replay-adapter-feasibility.md`. Verdict: 1m candles are only coarse context and cannot honestly replay the watcher's 5s volume-velocity ratio; exact Binance replay needs public/no-key `aggTrades`, while historical book evidence and HYPE historical replay remain unavailable/unverified in the current path. Totals: 146 velocity reviews, 144 included after strict exclusions, 3 with cached 1m coverage, 54 Binance rows needing aggTrades. `npm run assess:velocity-replay`, `npm run validate:candidates`, `npm test` (26/26), and `npm run verify` passed. No live execution, keys, paid APIs, recurring jobs, watcher behavior, alert wording, risk/sizing, TP/SL, or orders changed.
# 2026-08-28T12:04:13Z - RALPH main-session continuation

- Work item: `validation.strategy-filter-lookahead-source-guard`.
- Output: `experiments/strategy-destruction-filter/test/engine.test.mjs` and updated `wiki/notes/2026-08-28-strategy-filter-bias-hygiene-checklist.md`.
- Code change: added `signal path source avoids explicit future candle access`, a focused source-pattern guard over pre-entry signal helpers (`sma`, `rollingHigh`, `rollingLow`, `rsi`, `atr`, `volumeZ`, `rollingReturnPct`, `marketContext`, and `signalForVariant`). The guard flags explicit future candle access and whole-series aggregation patterns, while leaving post-entry exit simulation out of scope.
- Verification: first test run failed on a false positive around a legitimate `index - period + 1` warmup loop; the pattern was narrowed to true `index + n` loop starts. Final `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed 28/28; `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed over 9 candidates / 105 variants / 0 survivors / 105 rejected rows.
- Reassessment: Freqtrade-derived bias-hygiene scaffolding is now complete enough for current signal helpers. Next useful route should return to alert/orderflow evidence quality: `validation.ta-orderflow-alert-gate-backtest` or `validation.book-freshness-repair-for-orderflow-alert-gate`.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, package install, alert wording, watcher behavior, risk/sizing, TP/SL, cron cadence, public posting, or strategy promotion changed.

# 2026-08-28T11:49:02Z - RALPH main-session continuation

- Work item: `validation.strategy-filter-startup-variance-guard`.
- Output: `experiments/strategy-destruction-filter/test/engine.test.mjs` and updated `wiki/notes/2026-08-28-strategy-filter-bias-hygiene-checklist.md`.
- Code change: added `signal decisions are stable after truncating warmup history`, a deterministic test that compares full-history signals against a prefix-truncated warmup history for representative breakout, RSI reversion, MA reclaim, funding reversion, and volume-velocity fade rule shapes.
- Verification: `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed 27/27; `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed over 9 candidates / 105 variants / 0 survivors / 105 rejected rows.
- Reassessment: startup/recursive variance now has a native representative guard. Next smallest hardening item is `validation.strategy-filter-lookahead-source-guard` for obvious future-index access patterns before expanding signal helpers.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, package install, alert wording, watcher behavior, risk/sizing, TP/SL, cron cadence, public posting, or strategy promotion changed.

# 2026-08-28T11:37:31Z - RALPH main-session continuation

- Work item: `validation.strategy-filter-bias-hygiene-checklist`.
- Trigger: Tomas said to continue after the isolated cron run was interrupted by gateway restart; no second cron trigger was started.
- Output: `wiki/notes/2026-08-28-strategy-filter-bias-hygiene-checklist.md`.
- Verdict: completed the Freqtrade-derived bias-hygiene checklist without installing or activating Freqtrade. Current local filter evidence already verifies research-only status, chronological OOS split, time-matched baseline, approximate multiple-testing deflated-Sharpe label, walk-forward diagnostics, source coverage, and candidate-consistent semantic rejected ledger rows over 9 candidates / 105 variants / 0 survivors.
- Reassessment: the remaining cheap native hardening item is `validation.strategy-filter-startup-variance-guard`, a deterministic truncated-warmup/recursive-variance check before more rule-family expansion. Lookahead leakage is partially covered by helper implementation style, but not yet by a dedicated verifier/static invariant.
- Verification: local code/report inspection plus YAML parse, `npm run verify`, OpenClaw wiki ingest, and OpenClaw wiki search verification.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, package install, alert wording, watcher behavior, risk/sizing, TP/SL, cron cadence, public posting, or strategy promotion changed.

2026-08-26T08:09Z - Implemented the bounded Binance public `aggTrades` volume-velocity replay adapter as `experiments/strategy-destruction-filter/src/replay-binance-aggtrades-velocity.mjs` with `npm run replay:aggtrades`. It fetched/cached only trade windows around existing Binance velocity alerts and reconstructed watcher fields: trigger move, 5s recent notional, prior-5m 5s-slot average, and volume velocity ratio. Full bounded run replayed 54 Binance velocity rows, 54 OK, 0 fetch failures, 29 exact watcher-field matches within tolerance. Top replay-clean buckets remain low sample: ETH 5m UP follow-useful N=4 and ETH 60s DOWN fade-useful N=4. Verdict: exact replay is feasible, but still no new strict candidate/promotion; wait for more replay-clean samples or build a low-sample event-study gate instead of another broad OHLCV proxy. Verification passed: `npm run replay:aggtrades`, `npm run validate:candidates`, `npm test` (26/26), and `npm run verify`. No live execution, keys, paid APIs, recurring jobs, watcher behavior, alert wording, risk/sizing, TP/SL, or orders changed.
2026-08-26T08:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, BTC, ZEC, HYPE, ZRO, ETH, SUI, BMT, PUMP, PENGU, XRP, TRUMP, ONG, DOGE, ENA, STORJ, EDEN, RE, ADA, FARTCOIN; no data-source errors. Paper state remains 11 open with 0 closes this run and 10 latest candidates, all avoid or low-sample learning inputs. Qualified A/B/C paper evidence remains small sample (12 total / 11 closed / +5.8R, 6 wins and 5 losses; PF not enough without sample size or forward confirmation), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-26T12:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to BTC, BMT, HYPE, XRP, SOL, ETH, PUMP, ZEC, ZRO, FARTCOIN, AAVE, DOGE, TRUMP, SUI, BICO, RE, EDEN, PORTAL, ACE, ENA; no data-source errors. Paper state changed to 12 open with 0 closes this run and 11 latest candidates: BNB 4h trend_pullback_reclaim_long tier C, 7 low-sample rows, and 3 avoid rows. Qualified A/B/C paper evidence remains small sample (13 total / 11 closed / +5.8R, 6 wins and 5 losses), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-26T20:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to BTC, ETH, XRP, HYPE, ONG, SOL, PUMP, SUI, PENGU, EDEN, BICO, LINK, TAO, POL, ZEC, ENA, DOGE, HEI, BMT, RE; no data-source errors. Paper state changed to 17 open with 0 closes this run and 13 latest candidates: BNB 4h trend_pullback_reclaim_long tier C, 8 low-sample rows, and 4 avoid rows. Qualified A/B/C paper evidence remains small sample (13 total / 11 closed / +5.8R, 6 wins and 5 losses), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-27T00:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, ONG, ETH, ZEC, PUMP, XRP, BTC, HYPE, EDEN, BICO, SUI, ONT, FARTCOIN, TAO, TRUMP, UNI, PENGU, WLD, LIT, DOGE; no data-source errors. Paper state changed to 21 open with 0 closes this run and 16 latest candidates: BNB 4h trend_pullback_reclaim_long tier C, 11 low-sample rows, and 4 avoid rows. Qualified A/B/C paper evidence remains small sample (14 total / 11 closed / +5.8R, 6 wins and 5 losses; PF not enough without sample size or forward confirmation), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-27T04:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to ETH, BTC, BICO, HYPE, SOL, SPX, ONG, PUMP, ONT, XRP, POL, ZEC, PENGU, PROM, TRUMP, ENA, DOGE, BNB, GPS, RE; no data-source errors. Paper state changed to 18 open with 8 closes this run and 14 latest candidates: BNB 4h trend_pullback_reclaim_long tier C, 12 low-sample rows, and 1 avoid row. Qualified A/B/C paper evidence remains small sample (14 total / 11 closed / +5.8R, 6 wins and 5 losses; PF and expectancy lift are not enough without sample size or forward confirmation), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.

# 2026-08-27T07:30:00Z - RALPH autoresearch micro-run

- Work item: `validation.strategy-filter-current-sieve-audit`.
- Output: `wiki/notes/2026-08-27-strategy-filter-current-sieve-audit.md`.
- Verdict: latest strategy-destruction-filter report remains a valid rejection layer: 9 candidates / 105 variants / 0 survivors. Own stats found 32/105 positive headline expectancy, 12/105 positive OOS, 17/105 deflated-Sharpe gate passes, 42/105 PSR diagnostics >= 0.8, and 0/105 all-gate passes.
- Reassessment: HYPE funding still looks like the main false-positive trap because DS/PSR can look good while OOS/drawdown/failure slices fail. XRP alert-edge has positive OOS but weak whole-period expectancy/PF/DS/drawdown. ETH velocity OHLCV proxy is uniformly negative. Added next bounded item: `validation.strategy-filter-threshold-sensitivity`.
- Verification: `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed.

# 2026-10-03T16:25:00Z - full-path MFE/MAE USD-M absorption rescore

- Scope: resumed `validation.usdm-absorption-full-path-mfe-mae-rescore` from the 2026-09-29 handoff; research-only, no live/paper/demo alert behavior, scheduler, execution, keys, paid service, sizing, TP/SL, risk, or strategy-promotion changes.
- Change: added `experiments/strategy-destruction-filter/src/run-usdm-full-path-mfe-mae-rescore.mjs`, npm script `study:usdm-full-path-mfe-mae`, verifier coverage, result JSON/Markdown, and note `wiki/notes/2026-10-03-full-path-mfe-mae-usdm-absorption-rescore.md`.
- Measurement: joined the existing targeted USD-M sample to canonical DEMO-SIM candle paths using the same candle-source resolution as `historical-demo-sim-replay.mjs`. Full path is first candle after entry through exit candle inclusive; MFE/MAE R uses entry-stop risk, while final R remains net DEMO-SIM R after fees.
- Result: 76/80 targeted rows had full-path coverage; 4 old original-cluster rows were missing from the current regenerated replay. Verdict `full_path_absorption_research_feature_watch_only_no_promotion`. Outside the original cluster, absorption had 8 comparable buckets / 76 rows, final-R lift `+0.8651R`, MFE lift `+0.3469R`, MAE lift `-0.3164R`, and net path opportunity lift `+0.6633R`. Aligned CVD remains near-identical; liquidity-thinning remains weak/mixed.
- Decision: absorption remains a research feature, watch-only, no-promotion. Do not tune thresholds or turn absorption into watcher/paper/demo/live gates. Next valid absorption work requires fresh forward rows or a broader pre-registered sample not selected after seeing existing DEMO-SIM outcomes.
- Verification: `node --check` for the new script and verifier, `npm run study:usdm-full-path-mfe-mae --prefix ralph-research-os/experiments/strategy-destruction-filter`, and `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed.
- Boundary: no live alerts, watcher behavior, paper/demo alert logic, scheduler config, orders, account/key/API use, paid source, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-10-03T16:30:00Z - market bot reverse-engineering backlog

- Scope: Tomas asked why RALPH is not identifying existing market bots and reverse-engineering them. Added research-only backlog note `wiki/notes/2026-10-03-market-bot-reverse-engineering-backlog.md` and queued `discovery.market-bot-reverse-engineering-source-map`.
- Decision: first pass should be a bounded manual source/prior-art map across public bots, frameworks, products, and repos, converting observable claims into RALPH kill tests. Do not create a recurring loop yet; automate only if the source list proves stable and worth periodic refresh.
- Boundary: no paid signup, credentialed scraping, access-control bypassing, proprietary code copying, live trading, execution routing, account/key/API setup, scheduler change, watcher/paper/demo/live logic, risk/sizing/TP/SL, public posting, or strategy promotion changed.

# 2026-10-03T16:13:00Z - loop catch-up and validation repair

- Scope: manual catch-up after Tomas noticed the main session had not advanced work after saying it would move on; research/paper-only, no live execution or scheduler mutation.
- Refresh: verified the `liquid-crypto-alert-edge-backtest` cron completed at 2026-10-03T16:03Z, then manually refreshed `watch-row-aging-ledger`, `evidence-ledger-prioritizer`, `ralph-adversarial-improvement-loop`, and `research-validation-checklist`.
- Result: state-of-edge remains `no_trade_watch_low_sample`. Watch ledger now reports 4 active watch rows and 1 decaying-before-sample-gate row; adversarial verdict remains `no_action_needed`, `critical=0`, `high=0`, `proposals=0`, `notifyTomas=false`; evidence prioritizer has `readyNow=0` and only `ta-call-candidates-20-row-threshold` waiting at 9/20.
- Repair: validation initially failed because `index.yaml` listed 245 wiki pages while the actual `wiki/` count was 250. Updated `index.yaml` count and timestamp; validation rerun is `warn` with retrieval/path/queues/subsystem/delivery/HITL/loop/handoff/frontmatter passing, expected cron warn, and expected `paperDemo` not-ready.
- State sync: updated `automation/loop-state.yaml` and `automation/current-operating-map.md` so they reflect the 2026-10-03 16:03 UTC alert-edge success, 16:10 UTC manual maintenance refresh, `readyNow=0`, and the wait-for-threshold/named-trigger gate.
- Verification: YAML parse passed for `automation/loop-state.yaml` and `index.yaml`; `node ralph-research-os/automation/research-validation-checklist.mjs` and `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed.
- Boundary: no live alerts, watcher behavior, paper/demo alert logic, scheduler config, orders, account/key/API use, paid source, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

- 2026-10-03T08:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall 485 closed / -0.1301R / 32.37% winrate, qualified A/B/C 38 closed / -0.0645R / 36.84%, shadow PnL remains `shadow_negative_or_unproven` at 75 filled / -1430 USD gross; DEMO-SIM full replay degraded materially and remains capital-impaired (-7642.16 USD net, PF 0.8808, 89.55% max drawdown), shorts remain quarantined, while the 4h `range_breakout_long` + `BTC_RISK_ON` + `B|low-sample` walk-forward pocket still survives research-only checks (26 forward closed, +2351.05 USD net, PF 1.6356, 6.9% DD) without high-probability, sizing, or go-live promotion.

- 2026-10-03T04:04Z liquid alert-edge refresh: required outputs refreshed; state-of-edge verdict remains `no_trade_watch_low_sample`; paper overall 485 closed / -0.1301R / 32.37% winrate, qualified A/B/C 38 closed / -0.0645R / 36.84%, shadow PnL remains `shadow_negative_or_unproven` at 75 filled / -1430 USD gross; DEMO-SIM all-replay materially worsened to capital-impaired (-7468.38 USD net, PF 0.8832, 90.36% max DD), shorts remain fully quarantined, and the 4h `range_breakout_long` + `BTC_RISK_ON` + `B|low-sample` pocket still survives research-only walk-forward checks (26 forward closed, +2351.05 USD net, PF 1.6356, 6.9% DD) without high-probability or go-live promotion.

- 2026-10-03T00:04Z liquid alert-edge refresh: required outputs refreshed; verdict remains `no_trade_watch_low_sample`; paper overall 485 closed / -0.1244R / 32.58% winrate, qualified A/B/C 39 closed / -0.0884R / 35.90%, shadow PnL remains `shadow_negative_or_unproven` at 75 filled / -1430 USD gross; DEMO-SIM all-replay materially worsened to capital-impaired (-7270.19 USD net, PF 0.8863, max DD 92.21%), shorts remain fully quarantined, while the 4h `range_breakout_long` + `BTC_RISK_ON` + `B|low-sample` pocket still survives research-only walk-forward checks (26 forward closed, +2351.05 USD net, PF 1.6356) without high-probability or go-live promotion.

# 2026-09-29T16:58:00Z - targeted USD-M absorption falsification

- Scope: one follow-up after the balanced USD-M absorption run, targeted to force flagged/unflagged comparisons inside the same setup/direction/timeframe/regime/BTC-gate buckets.
- Change: added `USDM_ORDERFLOW_SAMPLE_MODE=bucket-targeted`, separate targeted outputs, and entry-candle-only excursion proxy fields to the USD-M orderflow runner.
- Outputs: `experiments/strategy-destruction-filter/results/usdm-orderflow-targeted-comparable-manifest.json/.md`, `experiments/strategy-destruction-filter/results/usdm-orderflow-targeted-comparable-demo-sim-batch.json/.md`, and `wiki/notes/2026-09-29-targeted-usdm-absorption-falsification.md`.
- Result: 80/80 targeted rows joined to public/no-key Binance USD-M trades plus bookDepth. Verdict `targeted_usdm_absorption_falsification_watch_only_no_promotion`.
- Comparable outside original cluster: absorption 8 buckets / 76 rows, flagged mean R `0.4963` vs unflagged `-0.2654`, mean lift `0.8651R`; aligned CVD similar at lift `0.8817R`; liquidity-thinning mixed/weak.
- Entry-candle proxy outside original cluster: absorption flagged mean net opportunity `0.6865R` vs unflagged `-0.1172R`; note this is entry-candle-only, not full-path MFE/MAE.
- Decision: absorption survived as a research feature, not a candidate or alert gate. Stop tuning this branch until fresh forward rows or a proper full-path candle-series MFE/MAE join exists.
- Verification: `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed. Boundary held: no live/paper/demo alert behavior, scheduler, execution, keys/accounts, paid services, sizing/TP/SL/risk, or strategy promotion changed.
- Boundaries: no live trading, orders, keys, paid APIs, account setup, alert wording, watcher behavior, risk/sizing, TP/SL, cron change, or Telegram notification.
2026-08-27T08:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, BTC, HYPE, RUNE, ETH, ZEC, POL, BICO, PUMP, MOVR, TUT, ONG, ENA, XRP, PYTH, XPL, PENGU, TAO, BMT, SPX; no data-source errors. Paper state changed to 19 open with 0 closes this run and 10 latest candidates: BNB 4h trend_pullback_reclaim_long tier C, 8 low-sample rows, and 1 newly closed SOL low-sample target among recent candidates. Qualified A/B/C paper evidence remains small sample (14 total / 11 closed / +5.8R, 6 wins and 5 losses, PF/expectancy not enough without sample size or forward confirmation), so no A/high-probability label is justified. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-27T12:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, ETH, BTC, HYPE, ONG, TAO, ZEC, ENA, TUT, MOVR, HEMI, PUMP, RUNE, BICO, SPX, BEAMX, XRP, VET, PENGU, POL; no data-source errors. Paper state changed to 15 open with 5 closes this run and 7 latest candidates: SOL 4h range_breakout_long tier B plus 6 low-sample rows. Qualified A/B/C paper evidence remains small sample (15 total / 12 closed / +6.2738R, 7 wins and 5 losses, avg +0.5228R), so no A/high-probability label is justified without more forward sample. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-27T16:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, ENA, ETH, BTC, HYPE, XRP, CHIP, TRUMP, ONG, VET, PUMP, PENGU, MOVR, HEMI, SPX, PROM, BEAMX, TAO, ZEC, TUT; no data-source errors. Paper state changed to 16 open with 2 closes this run and 10 latest candidates: 2 SOL 4h range_breakout_long tier B rows plus 8 low-sample rows. Qualified A/B/C paper evidence remains small sample (16 total / 12 closed / +6.2738R, 7 wins and 5 losses, avg +0.5228R), so no A/high-probability label is justified without more forward sample. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-27T20:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, ENA, BTC, ETH, HYPE, VET, TRUMP, ONG, PUMP, MOVR, HEMI, CHIP, LINK, PROM, BEAMX, XRP, ZEC, FARTCOIN, PENGU, LIT; no data-source errors. Paper state changed to 16 open with 1 close this run and 10 latest candidates: 3 SOL 4h range_breakout_long tier B rows, including 1 newly closed target, plus 7 low-sample rows. Qualified A/B/C paper evidence remains small sample (17 total / 13 closed / +8.0738R, 8 wins and 5 losses, avg +0.6211R), so no A/high-probability label is justified without more forward sample. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.

# 2026-08-27T21:29:25Z - RALPH autoresearch micro-run

- Work item: `validation.strategy-filter-rejection-ledger-schema-guard`.
- Output: `wiki/notes/2026-08-27-strategy-filter-rejection-ledger-schema-guard.md`.
- Verdict: the semantic schema guard is specified. Current strict-filter artifacts have 105 rejected report rows and 105 rejected JSONL rows; report verdict rows include `idea` but not `thesis`/`dataRequirements`/`validation`, and rejected JSONL rows include none of those semantic fields. Candidate specs contain the needed semantic fields for all 9 candidates.
- Reassessment: numeric rejection quality is already verified, but `rejected-ideas.jsonl` should not be treated as anti-repackaging memory for text-first community/operator/profile intake until candidate-consistent semantic carry-through is implemented and verified. Queued `validation.strategy-filter-rejection-ledger-semantic-field-implementation`.
- Verification: local Node statistics over `filter-report.json`, `rejected-ideas.jsonl`, and `seed-strategies.json`; no web checks.
- Boundaries: no live trading, orders, keys, paid APIs, account setup, alert wording, watcher behavior, risk/sizing, TP/SL, cron change, or Telegram notification.
2026-08-28T00:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, BTC, ETH, ENA, HYPE, BICO, TUT, FARTCOIN, ONG, HEMI, XPL, TRUMP, CHIP, BEAMX, PUMP, JUP, BMT, XRP, TAO, PROM; no data-source errors. Paper state changed to 15 open with 1 close this run and 9 latest candidates: 2 SOL 4h range_breakout_long tier B rows plus 7 low-sample rows. Qualified A/B/C evidence remains small sample (17 total / 13 closed / +8.0738R, 8 wins and 5 losses, avg +0.6211R), so no A/high-probability label is justified without more forward sample. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-28T04:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to SOL, BTC, ENA, HYPE, TRUMP, XRP, HEMI, ZEC, ETH, SUI, PUMP, LINK, BICO, ADA, SKR, AAVE, BEAMX, MOVR, PENGU, BMT; no data-source errors. Paper state changed to 12 open with 5 closes this run and 3 latest candidates: SOL 4h range_breakout_long tier C plus 2 low-sample rows. Qualified A/B/C evidence remains small sample (17 total / 14 closed / +7.0738R, 8 wins and 6 losses, avg +0.5053R), so no A/high-probability label is justified without more forward sample. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.
2026-08-28T08:04Z - Alert-edge refresh completed successfully on the full BTC/ETH/SOL/BNB/XRP/DOGE/ADA/LINK/AVAX backtest set. Universe top set shifted materially to TRUMP, SOL, ENA, BTC, HYPE, HEMI, ETH, TUT, PUMP, BMT, TAO, RUNE, SKR, ZEC, XRP, PENGU, HEI, LIT, UNI, DOGE; no data-source errors. Paper state changed to 11 open with 2 closes this run and 3 latest candidates: AVAX 4h avoid short, ADA 4h low-sample short, and ETH 1h low-sample long. Qualified A/B/C evidence remains small sample (17 total / 15 closed / +7.5544R, 9 wins and 6 losses, avg +0.5036R), so no A/high-probability label is justified without more forward sample and live-paper stability. No live execution, keys, paid APIs, Telegram, risk/sizing, orders, or alert wording changed.

# 2026-08-28T05:24:00Z - RALPH autoresearch micro-run

- Work item: `validation.strategy-filter-rejection-ledger-semantic-field-implementation`.
- Output: `automation/loop-state.yaml` and `log.md`; no new wiki note.
- Verification: local Node statistics over `experiments/strategy-destruction-filter/results/rejected-ideas.jsonl` and `candidates/seed-strategies.json` still show 105 rejected JSONL rows with 0/105 coverage for `idea`, `thesis.*`, `dataRequirements.*`, and `validation.*`, while all 9 source candidates carry the required semantic fields.
- Reassessment: the smallest useful implementation still requires experiment source edits, regenerated result ledgers, and verifier assertions. Those files remain outside this cron payload's allowed durable-output set, so this is a repeated scope blocker rather than a technical blocker.
- Blocker count: 2 consecutive occurrences recorded in `automation/loop-state.yaml`; no Telegram notification gate met yet because the standing rule requires 3 repeated blocker runs.
- Boundaries: no live trading, orders, keys, paid APIs, account setup, alert wording, watcher behavior, risk/sizing, TP/SL, cron change, public posting, or Telegram notification.

# 2026-08-28T05:27:00Z - RALPH autoresearch micro-run

- Work item: `validation.strategy-filter-rejection-ledger-semantic-field-implementation`.
- Output: `automation/loop-state.yaml` and `log.md`; no new wiki note.
- Verification: local Node statistics over `experiments/strategy-destruction-filter/results/rejected-ideas.jsonl` and `candidates/seed-strategies.json` still show 105 rejected JSONL rows with 0/105 coverage for `idea`, `thesis.*`, `dataRequirements.*`, and `validation.*`, while all 9 source candidates carry the required semantic fields.
- Reassessment: the smallest useful implementation still requires experiment source edits, regenerated result ledgers, and verifier assertions. Those files remain outside this cron payload's allowed durable-output set, so this is a repeated scope blocker rather than a technical blocker.
- Blocker count: 3 consecutive occurrences recorded in `automation/loop-state.yaml`; repeated-blocker notification gate is met.
- Telegram text prepared in Czech: `RALPH: už třetí běh naráží na stejný scope blocker. Aby šel dokončit semantic carry-through do rejected-ideas.jsonl, potřebuju příštímu běhu povolit úpravy experiment source/result souborů, nejen wiki/automation/log. Bez toho budu tuhle položku přeskakovat a brát jiné bounded research úkoly.`
- Telegram delivery attempt: failed through OpenClaw `sessions_send`; no visible session found for `telegram:1539856256` or label `telegram`, so visible delivery was not verified.
- Boundaries: no live trading, orders, keys, paid APIs, account setup, alert wording, watcher behavior, risk/sizing, TP/SL, cron change, public posting, or strategy promotion.

# 2026-08-28T05:38:37Z - RALPH main-session continuation

- Work item: `validation.strategy-filter-rejection-ledger-semantic-field-implementation`.
- Trigger: Tomas said to continue after the isolated cron hit the repeated scope blocker; main session could edit experiment source/result files.
- Code change: preserved candidate semantic fields through `expandCandidate`/`summarizeVariantRuns`, wrote `idea`, `thesis`, `dataRequirements`, and `validation` into each `results/rejected-ideas.jsonl` row, and added verifier assertions that each rejected row matches its source candidate.
- Result: regenerated strict-filter outputs still have 9 candidates, 105 variants, 0 survivors, and 105 rejected rows. Rejected ledger semantic coverage is now 105/105.
- Verification: `npm run validate:candidates`, `npm test`, `npm run filter`, and `npm run verify` passed. The new verifier failed on the stale ledger before regeneration, confirming the guard catches the old gap.
- State: moved `strategy-filter-rejection-ledger-semantic-field-implementation` from validation pending to done and marked the scope blocker resolved in `automation/loop-state.yaml`.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, watcher behavior, risk/sizing, TP/SL, cron cadence, public posting, or strategy promotion changed.

# 2026-08-28T05:42:00Z - RALPH autoresearch micro-run

- Work item: `discovery.trading-bot-framework-github-map`.
- Output: `wiki/notes/2026-08-28-framework-shortlist-wheel-gate.md`.
- Source checks: Freqtrade lookahead/backtesting docs; NautilusTrader docs; vectorbt docs/GitHub page; Jesse docs/site.
- Access verification: local package/binary check found `freqtrade`, `vectorbt`, `nautilus_trader`, and `jesse` are not installed, so none were marked active local dependencies.
- Verdict: keep the current strategy-destruction-filter as the active local harness; use Freqtrade as the first validation-hygiene benchmark, vectorbt as a possible parameter-sweep kill-test rail, NautilusTrader as an event/replay architecture reference, and Jesse as a secondary crypto workflow reference.
- Reassessment: next bounded framework item should be a no-key Freqtrade validation-hygiene spike only if selected; no broad framework setup or package install was started.
- Boundaries: no live trading, orders, keys, paid APIs, account setup, package install, alert wording, watcher behavior, risk/sizing, TP/SL, cron change, public posting, Telegram notification, or strategy promotion.

# 2026-08-28T06:42:00Z - RALPH autoresearch micro-run

- Work item: `validation.strategy-filter-routing-reconciliation`.
- Output: `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, `automation/loop-state.yaml`, and `log.md`; no new wiki note.
- Verification: local Node statistics over current strategy-destruction-filter artifacts verified 9 candidates, 105 variants, 0 survivors, 105 rejected rows, and 105/105 rejected rows carrying `idea`, `thesis`, `dataRequirements`, and `validation` semantics.
- Reassessment: the strategy-filter router was stale because it still pointed at completed OOS, deflated-Sharpe, and plain-English schema items. The clean next hardening route is the already queued `discovery.freqtrade-no-key-dry-run-spike`, which should compare validation-hygiene reuse before any custom expansion.
- Access/tool note: `jq` is not installed in this workspace, so the run used Node for local JSON/JSONL statistics. No web/source checks were needed.
- Boundaries: no live trading, orders, keys, paid APIs, account setup, package install, alert wording, watcher behavior, risk/sizing, TP/SL, cron cadence, public posting, Telegram notification, or strategy promotion changed.

# 2026-08-28T12:04:27Z - Liquid crypto alert-edge refresh

- Universe/backtest/verify passed for canonical symbols BTC, ETH, SOL, BNB, XRP, DOGE, ADA, LINK, and AVAX; latest paper candidates: 3; paper state now open 10, closed this run 1, overall 163 signals with 51.1657R. A/B/C remains small-sample: 17 total, 15 closed, 9 wins, 6 losses, avg 0.5036R, PF not promoted beyond research label. No data-source failures, Telegram, live orders, keys, paid APIs, risk/sizing, TP/SL, or alert behavior changes.

# 2026-08-28T12:18:40Z - RALPH subagent continuation

- Work item: `validation.ta-orderflow-alert-gate-backtest`.
- Trigger: continuation handoff from the main Telegram session; the main source session is at 60% context, so this was kept to one bounded local-statistics pass in the subagent. The cron job was not triggered.
- Output: updated `wiki/notes/2026-08-13-orderflow-alert-alignment-check.md`, `automation/work-queues.yaml`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`, and `log.md`.
- Verification/statistics: `crypto-updates/monitor-index.yaml` now shows 450 total monitor records, 227 alert_sent, and 222 reviews_finalized through `2026-08-28T12:03:28.505Z`. A local Node join found 216 quality-included reviews with matching alerts and 6 excluded legacy/parser-roll rows with negative `bookAgeMs`; one excluded row also had `score=6/5`. Clean fresh-book BTC/ETH/SOL evidence exists on 63 rows, split 36 fade-useful, 23 follow-useful, and 4 noisy. The largest narrow clean-book bucket is SOL WICK 5s DOWN score 5/5 with aligned CVD, aligned negative book imbalance, and depth thinning: 6 rows, 5 fade-useful and 1 follow-useful.
- Reassessment: C-036 stays `Candidate`; U-038 stays `Open`. The broad alert/orderflow refresh is now complete for the current dataset, but no live gate or strategy promotion is justified. The narrow SOL clean-book wick-down bucket is only a future kill-test seed, not an actionable alert rule.
- Telegram update: `openclaw message send` accepted the Czech update as Telegram message `4840`; `openclaw message read` is unsupported for Telegram here, so visible delivery could not be independently verified.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, installs, public posting, cron cadence, watcher behavior, alert wording, risk/sizing, TP/SL, or strategy promotion changed.

# 2026-08-28T12:44:10Z - RALPH main-session continuation

- Work item: `validation.book-freshness-repair-for-orderflow-alert-gate`.
- Trigger: explicit continuation handoff from the Telegram main session; session status showed 0% context and 0 compactions. The cron job was not triggered.
- Output: updated `wiki/notes/2026-08-20-book-freshness-repair.md`, moved the item from validation pending to done in `automation/work-queues.yaml`, and updated `automation/retrieval-router.yaml`, `automation/loop-state.yaml`, and `log.md`.
- Verification/statistics: local Node join over `crypto-updates/runtime/alert-feedback.jsonl` after the `2026-08-21T12:20:00Z` timestamp-fix restart found 73 post-fix joined BTC/ETH/SOL reviews from `2026-08-21T13:39:13.744Z` through `2026-08-28T11:03:14.158Z`; 63 clean fresh-book rows; 10 stale-but-nonnegative rows; 0 missing/unavailable book ages; 0 negative `bookAgeMs`; and 0 `score > maxScore` rows. Fresh book age distribution was min 6ms, p50 350ms, p90 1356ms, max 3640ms.
- Reassessment: the parser mismatch and timestamp-quality repair are closed for BTC/ETH/SOL alert evidence. Fresh-book outcomes remain mixed at 36 fade-useful, 23 follow-useful, and 4 noisy, so this is not a live gate, not a strategy promotion, and not a change to alert behavior. C-036 stays `Candidate`; U-038 stays `Open`.
- Telegram update: `message(action=send)` returned messageId `4857`; `sessions_history` then showed a new assistant message in `agent:main:telegram:direct:1539856256` mirrored as `voice-1787921234869.mp3`.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, installs, public posting, cron cadence, watcher behavior, alert wording, risk/sizing, TP/SL, or strategy promotion changed.

# 2026-08-28T12:53:14Z - RALPH main-session continuation

- Work item: `validation.no-key-first-experiment-selection`.
- Trigger: Tomas said "Ok. Go." after the previous visible update. Session status showed 34% context and 0 compactions. The cron job was not triggered.
- Output: added `wiki/notes/2026-08-28-no-key-first-experiment-selection.md`, moved `no-key-first-experiment-selection` from validation pending to done, updated `automation/retrieval-router.yaml`, `automation/loop-state.yaml`, and `log.md`, and refreshed `crypto-updates` setup-analysis artifacts after an access-verification smoke run.
- Verification/statistics: Binance public `/api/v3/time` and Hyperliquid public `info/allMids` were reachable without keys. The selected next route is `validation.ta-learning-loop-call-candidate-forward-check` because setup analysis was stale at 15 reviewed setups from `2026-08-18T20:20:40.322Z` while the monitor index had 222 finalized reviews through `2026-08-28T12:03:28.619Z`.
- Recovery note: a `CRYPTO_UPDATES_SKIP_CANDLES=1` analyzer smoke run rewrote setup-analysis outputs without candle context; the run immediately repaired that by running the normal public/no-key analyzer refresh. Current setup analysis is generated at `2026-08-28T12:52:54.014Z` with 223 reviewed setups, 5 unreviewed alerts, 132 candle-context-ready rows, and `callLineDecision=research_candidate_not_live`.
- Reassessment: the next no-key-first experiment should reuse the existing TA learning loop and inspect whether the refreshed low-sample `velocity-shock-60s|DOWN|evidence-high` fade/reversion call candidate deserves durable watch tracking or should stay research-only/no-change. No live alert change or strategy promotion is justified by this selection pass.
- Telegram update: `message(action=send)` returned messageId `4860`; `sessions_history` then showed a new assistant message after Tomas's "Ok. Go." mirrored as `voice-1787921739464.mp3`.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, installs, public posting, cron cadence, watcher behavior, alert wording, risk/sizing, TP/SL, or strategy promotion changed.

# 2026-08-28T16:04:30Z - liquid-crypto-alert-edge cron refresh

- Full public/no-key universe + backtest + verify refreshed for BTC, ETH, SOL, BNB, XRP, DOGE, ADA, LINK, and AVAX. Verify passed with 18 sources, 427 setup stats, 3 latest candidates, 7 open paper signals, and 4 paper signals closed this run. A/B/C paper sample remains small at 17 closed signals, 0.3267R avg, 52.94% winrate; treat low-sample rows as learning inputs only, with no live trading, alert behavior, sizing, TP/SL, keys, paid APIs, or Telegram change.

# 2026-08-28T20:04:30Z - liquid-crypto-alert-edge cron refresh

- Full public/no-key universe + backtest + verify refreshed for BTC, ETH, SOL, BNB, XRP, DOGE, ADA, LINK, and AVAX. Verify passed with 18 sources, 427 setup stats, 4 latest candidates, 6 open paper signals, and 3 paper signals closed this run. A/B/C paper sample remains small at 17 closed signals, 0.3267R avg, 52.94% winrate; latest candidates are all low-sample/avoid learning inputs, with no live trading, alert behavior, sizing, TP/SL, keys, paid APIs, or Telegram change.

# 2026-08-29T04:04:36Z - liquid-crypto-alert-edge cron refresh

- Full public/no-key universe + backtest + verify refreshed for BTC, ETH, SOL, BNB, XRP, DOGE, ADA, LINK, and AVAX. Verify passed with 18 sources, 428 setup stats, 2 latest candidates, 4 open paper signals, and 2 paper signals closed this run. A/B/C paper sample remains small at 17 closed signals, 0.3267R avg, 52.94% winrate; latest candidates are low-sample learning inputs only, with no live trading, alert behavior, sizing, TP/SL, keys, paid APIs, or Telegram change.

# 2026-08-29T08:04:33Z - liquid-crypto-alert-edge cron refresh

- Full public/no-key universe + backtest + verify refreshed for BTC, ETH, SOL, BNB, XRP, DOGE, ADA, LINK, and AVAX. Verify passed with 18 sources, 428 setup stats, 2 latest candidates, 6 open paper signals, and 0 paper signals closed this run. A/B/C paper sample remains small at 17 closed signals, 0.3267R avg, 52.94% winrate; latest candidates remain learning inputs only, with no live trading, alert behavior, sizing, TP/SL, keys, paid APIs, or Telegram change.

# 2026-08-29T11:58:00Z - RALPH shared-language maintenance

- Trigger: Tomas challenged whether "full TA" was being used too narrowly for lower-timeframe volume-velocity alerts, reinforced do-not-reinvent-the-wheel / verify / meta-rule discipline, and asked whether RALPH should do Obsidian maintenance or a grill-me session.
- Skills used: `obsidian-vault-maintainer`, `grill-me`, `ubiquitous-language`, and `ai-coding-operating-rhythm`.
- Output: added `docs/ubiquitous-language.md`, `wiki/concepts/multi-timeframe-full-ta.md`, and `wiki/notes/2026-08-29-shared-language-maintenance-and-grill-me.md`; updated `core/navigation.md` and `automation/retrieval-router.yaml` with the shared-language route; ingested the new concept and note into the main Obsidian-rendered bridge wiki and search-verified both.
- Source/wheel spot check: verified current primary docs for Freqtrade lookahead-analysis, vectorbt, NautilusTrader backtesting, and Jesse docs/site as reuse/reference candidates; no package install or framework adoption was started.
- Reassessment: volume velocity is an LTF trigger by default, not sufficient Full TA. Full TA now means HTF context, mid-TF setup, LTF trigger, scenario alternatives, invalidation, and trade-class fit. The next step should be a Tomas grill-me branch on canonical trade classes before changing alert wording or code.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, package install, public posting, cron cadence, watcher behavior, alert wording, risk/sizing, TP/SL, execution behavior, or strategy promotion changed.

# 2026-08-29T14:00:00Z - RALPH trade-class defaults

- Trigger: Tomas asked the agent to correct the fast/medium/long-running trade ranges itself and continue.
- Output: updated `docs/ubiquitous-language.md`, `wiki/concepts/multi-timeframe-full-ta.md`, `wiki/notes/2026-08-29-shared-language-maintenance-and-grill-me.md`, and `automation/retrieval-router.yaml`.
- Decision: separate chart/data timeframe from entry trigger horizon and holding horizon. Default trade classes are fast trade = seconds to 30 minutes, medium trade = 30 minutes to 8 hours, long-running trade = 8 hours to multiple days or weeks, and no-trade = valid Full TA outcome.
- Reassessment: this removes the false implication that a lower-timeframe trigger defines the whole trade. Volume velocity remains useful mainly as LTF entry evidence; medium and long-running classifications require higher context.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, package install, public posting, cron cadence, watcher behavior, alert wording, risk/sizing, TP/SL, execution behavior, or strategy promotion changed.

# 2026-08-29T14:04:00Z - RALPH alert-surface default

- Trigger: continued the shared-language grill-me maintenance after setting trade-class defaults.
- Output: updated `docs/ubiquitous-language.md`, `wiki/concepts/multi-timeframe-full-ta.md`, and `wiki/notes/2026-08-29-shared-language-maintenance-and-grill-me.md`.
- Decision: default to split alert surface. Telegram should carry a compact alert summary with event, trade class, thesis label, invalidation, and strongest blockers; Obsidian/RALPH should carry the full analysis record with scenario map, source/wheel notes, paper/shadow result, and execution comparison.
- Boundary: this is a vocabulary/operating-default note only, not a change to user-visible alert wording or watcher code.

# 2026-08-29T14:07:00Z - RALPH non-actionable event delivery default

- Trigger: Tomas asked the agent to answer the grill-me alert-delivery question itself.
- Output: updated `docs/ubiquitous-language.md`, `wiki/concepts/multi-timeframe-full-ta.md`, and `wiki/notes/2026-08-29-shared-language-maintenance-and-grill-me.md`.
- Decision: if Full TA finds an interesting market event but no clean trade, default to Obsidian/RALPH only. Telegram is reserved for actionable alerts, exceptional research samples, or timely risk/context events.
- Boundary: this is a vocabulary/operating-default note only, not a change to live watcher delivery gates, alert wording, or execution behavior.

# 2026-08-29T14:09:00Z - RALPH source sufficiency default

- Trigger: continued grill-me maintenance by resolving the source-sufficiency branch conservatively.
- Output: updated `docs/ubiquitous-language.md` and `wiki/notes/2026-08-29-shared-language-maintenance-and-grill-me.md`.
- Decision: for strategy/build/execution-adjacent work, require the wheel gate before custom data collection, backtest expansion, prototype, or build. T1 should use at least 3 relevant independent sources when available, prefer primary/official sources, classify access status, and explicitly say when fewer sources exist. LLM agreement alone is not independent evidence.
- Boundary: no live trading, orders, keys, paid APIs, installs, cron, watcher, alert wording, risk/sizing, TP/SL, or execution behavior changed.

# 2026-08-29T14:10:00Z - RALPH autonomy defaults

- Trigger: continued grill-me maintenance by resolving the autonomy branch conservatively.
- Output: updated `docs/ubiquitous-language.md` and `wiki/notes/2026-08-29-shared-language-maintenance-and-grill-me.md`.
- Decision: RALPH may work alone on local notes, Obsidian maintenance, source search, public/no-key checks, local statistics, paper/shadow analysis, and draft proposals. Tomas approval is required for paid APIs, accounts, keys, dependency installs, live alert wording/delivery changes, recurring job changes, risk/sizing/TP/SL changes, large repo changes, public posting, or anything affecting real trading behavior. Autonomous live orders, wallet-key handling, credential storage in vaults, bypassing controls, and unverified LLM-consensus evidence remain forbidden.
- Boundary: no live trading, orders, keys, paid APIs, installs, cron, watcher, alert wording, risk/sizing, TP/SL, execution behavior, public posting, or strategy promotion changed.

# 2026-08-29T14:12:00Z - RALPH evaluation bucket default

- Trigger: completed the current shared-language grill-me maintenance pass by resolving outcome accounting.
- Output: updated `docs/ubiquitous-language.md` and `wiki/notes/2026-08-29-shared-language-maintenance-and-grill-me.md`.
- Decision: keep paper/shadow alerts, exact-follow executions, modified-alert executions, and manual-independent executions as separate evaluation buckets. Alert quality is judged first from paper/shadow and exact-follow evidence. Modified-alert outcomes measure Tomas-plus-alert interaction. Manual-independent outcomes form Tomas's baseline, not RALPH alert quality.
- Boundary: no live trading, orders, keys, paid APIs, installs, cron, watcher, alert wording, risk/sizing, TP/SL, execution behavior, public posting, or strategy promotion changed.

# 2026-08-29T14:37:00Z - Future-alert additive context rollout

- Trigger: Tomas clarified that historical alerts do not need rewriting; future alerts can add other/companion alert context or append context to existing alerts.
- Code output: updated `crypto-updates/realtime-market-watcher.mjs` so future TA records/messages include trade class, entry trigger horizon, holding horizon, and delivery class; updated `crypto-updates/index-trade-research-journal.mjs` so future alert pages render those fields.
- Docs output: updated `crypto-updates/docs/ubiquitous-language.md` and `crypto-updates/strategy-notes.md` with additive-alert context terms.
- Verification: checked no active alert reviews in the last 65 minutes before restart; `node --check` passed for watcher and journal builder; journal rebuild passed over 244 legacy alerts / 0 executions / 244 paper-shadow rows; `npm run verify --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- Activation: restarted `crypto-updates-market-watcher.service` at `2026-08-29 14:37:24 UTC`; PID `1656150`; Binance and Hyperliquid streams reconnected.
- Boundaries: no historical alerts rewritten, no live trading, orders, keys, paid APIs, installs, cron cadence, thresholds, risk/sizing, TP/SL, or execution behavior changed.

- 2026-08-29T14:58:00Z - Shadow PnL refresh remains negative/unproven: 86 tradable plans, 69 filled, 24 target hits, 45 stop-like outcomes, gross PnL -1530 USD before fees/slippage; no candidate promoted.

# 2026-08-29T16:18:00Z - DOGE alert-edge candidate destruction look-back

- Trigger: continuation from Tomas's approved maintenance/look-back request after inspecting RALPH navigation and Obsidian/wiki state.
- Output: added `alert-edge-doge-momentum-reversal-long-v0` to `experiments/strategy-destruction-filter/candidates/seed-strategies.json`; added DOGE public Binance spot candles to `config.default.json`; aligned `strategy-idea.schema.json` rule enum with validator-supported rules; regenerated `filter-report.*`, `rejected-ideas.jsonl`, `survivors.json`, and `feature-study.*`; added `wiki/notes/2026-08-29-doge-candidate-destruction-lookback.md`; updated current operating map, retrieval router, work queue, and loop state.
- Verdict: strict filter generated at `2026-08-29T16:11:54.495Z` tested 10 candidates / 121 variants / 0 survivors / 121 rejected. DOGE candidate had 16 rejected variants. Best DOGE variant had sample 140, expectancy 0.0598R, PF 1.0915, deflated Sharpe 0.2287, max drawdown 18.4736R, OOS 43 trades / 0.2113R, and baseline lift 0.12R; rejected for weak profit factor, deflated-Sharpe fail, and drawdown too high.
- Verification: `validate:candidates`, `filter`, `study:features`, `verify`, and `npm test` passed after refreshing the stale feature-study artifact. Final verifier reports 121 variants, 0 survivors, 121 rejected, 12 feature studies, velocity replay exact rows available, low-sample event studies still watch-only, shadow PnL negative/unproven, and 7 accessible data rails.
- Reassessment: DOGE momentum-reversal-long is a useful rejected idea, not a promotion candidate. Continue mining B-tier alert-edge rows only through the strict filter, or switch to `validation.ta-learning-loop-call-candidate-forward-check` for realized paper/shadow outcome comparison.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, package install, public posting, cron cadence, watcher behavior, alert wording, risk/sizing, TP/SL, execution behavior, or strategy promotion changed.

# 2026-08-29T16:38:00Z - TA learning call-candidate forward check

- Trigger: Tomas said to continue after the DOGE candidate destruction/look-back pass.
- Output: refreshed `crypto-updates` setup-analysis artifacts from local monitor feedback; added `wiki/notes/2026-08-29-ta-learning-call-candidate-forward-check.md`; updated retrieval router, work queue, loop state, and log.
- Result: setup analysis generated at `2026-08-29T16:31:04.037Z` has 240 reviewed setups, 5 unreviewed alerts, 245 hypothetical alert decisions, and 149 reviewed setups with candle context. `callLineDecision` remains `research_candidate_not_live` and `live_alert_text_change=false`.
- Candidate check: `velocity-shock-60s|DOWN|evidence-high` remains a low-sample fade/reversion call candidate with 9 rows, 7/9 aligned fade outcomes, 6 tradable research entries, and 0 matched executions. New `wick-shock|UP|evidence-medium` appears as a low-sample follow-through call candidate with 5 rows, 4/5 aligned follow outcomes, 3 tradable research entries, and 0 matched executions.
- Reassessment: both generated `Call:` lines stay watch-only. Do not wire live Telegram wording before at least 20 reviewed rows, stable asset/regime split, enough tradable research entries, and ideally exact-follow execution evidence. The live TA execution journal still has 0 matched executions and 244 paper/shadow alerts.
- Verification: `node --check crypto-updates/analyze-alert-setups.mjs`, `node --check crypto-updates/verify-setup-analysis.mjs`, `node crypto-updates/analyze-alert-setups.mjs`, `node crypto-updates/verify-setup-analysis.mjs`, and `npm run verify --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, package install, public posting, cron cadence, watcher behavior, alert wording, risk/sizing, TP/SL, execution behavior, or strategy promotion changed.

# 2026-08-29T21:22:04Z - Forward paper regime tagging repair

- Trigger: continuation branch `validation.add-forward-paper-regime-tagging-before-more-historical-bucket-promotion` under the approved RALPH Profitability Flywheel.
- Output: updated `experiments/btc-eth-alert-edge/src/backtest.mjs`, `src/paper-dashboard.mjs`, `src/verify-backtest.mjs`, `README.md`, `paper/signals.json`, `results/edge-snapshot.json`, `results/edge-summary.md`, and `results/paper-dashboard.*`; added `wiki/notes/2026-08-29-forward-paper-regime-tagging.md`; updated retrieval router, work queue, loop state, and current operating map.
- Result: forward paper signals now carry `trend`, `volatility`, and combined `regime`; existing rows are backfilled from local candles during backtest refresh. The dashboard now exposes `byTierSetupRegime` and `bySymbolTimeframeSetupRegime`, plus matching Markdown sections.
- Verification: `npm run backtest --prefix ralph-research-os/experiments/btc-eth-alert-edge` and `npm run verify --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed. Final verifier reported 9 symbols, 18 sources, 428 setup stats, 3 latest candidates, 171 paper signals, 9 open, 162 closed, and 0 missing paper regime tags; feature-table validation still passed with 73 rows and 13 clean rows.
- Reassessment: future B-tier historical bucket checks should require matching forward paper support at symbol/timeframe/setup/direction/regime granularity. Adjacent regimes are context, not direct T3 support. No strategy was promoted.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.

# 2026-08-29T22:05:51Z - Source falsification guide

- Trigger: continuation branch `validation.guide-source-falsification` under the approved RALPH Profitability Flywheel after AVAX produced a historical Watch candidate with 0 exact regime-tagged forward-paper rows.
- Output: added `wiki/notes/2026-08-29-source-falsification-guide.md`; updated retrieval router, work queue, loop state, current operating map, and log.
- Result: future source-backed ideas, historical survivors, operator/community inputs, and candidate expansions now have a required cheap falsification pass before promotion or custom expansion. The guide requires claim, mechanism, market/venue/timeframe/regime, baseline, cheapest kill test, source reliability, access classification, falsifier, and decision. Evidence classes are `source-claim`, `source-prior-art`, `source-reproducible`, `source-falsified`, and `source-unresolved`.
- AVAX implication: `alert-edge-avax-range-breakdown-short-v0` remains `source-unresolved` and Watch / forward-paper-needed only because exact regime-tagged forward paper rows for `AVAX|1h|range_breakdown_short|down/low-vol` are 0.
- Reassessment: `validation.guide-source-falsification` is done. The next useful branch is `validation.ai-research-os-index-lint`, unless a forward-paper threshold is reached for an existing Watch item first.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.

# 2026-08-29T21:48:33Z - AVAX range breakdown watch

- Trigger: Tomas told the agent to work longer after the forward-paper regime-tagging branch. Continued inside the approved RALPH Profitability Flywheel with `validation.optionally-test-remaining-avax-b-tier-alert-edge-candidates`.
- Input bucket: AVAX 1h `range_breakdown_short` short in `down/low-vol`, alert-edge historical stats 44 samples, expectancy `0.2088R`, profit factor `1.3553`, baseline expectancy `-0.0807R`.
- Output: added `alert-edge-avax-range-breakdown-short-v0` to `experiments/strategy-destruction-filter/candidates/seed-strategies.json`; added AVAX public/no-key Binance spot candles to `experiments/strategy-destruction-filter/config.default.json`; tightened `experiments/strategy-destruction-filter/src/engine.mjs` so walk-forward diagnostic failures affect verdict status; regenerated filter and feature-study artifacts; added `wiki/notes/2026-08-29-avax-range-breakdown-watch.md`; updated current operating map, retrieval router, work queue, and loop state.
- Filter repair: first run reported 8 AVAX survivors but `verify-filter.mjs` rejected the report because variants #7/#8 did not clear all diagnostic OOS folds. The engine now emits walk-forward failures such as `weak_walk_forward_out_of_sample`, so report verdicts and verifier agree.
- Final result: 12 candidates / 130 variants / 6 survivors / 124 rejected. AVAX had 6/8 historical survivors; best variant `#1` had sample 213, expectancy `0.2066R`, profit factor `1.3536`, deflated-Sharpe proxy `1.7773`, max drawdown `10.1373R`, OOS 74 trades / `0.1426R`, baseline lift `0.4098R`, and 5/5 positive walk-forward folds. Variants #7/#8 were rejected for `weak_walk_forward_out_of_sample`.
- Forward-paper gate: exact regime-tagged forward paper rows for `AVAX|1h|range_breakdown_short|down/low-vol` are 0, with 0 adjacent same-setup AVAX 1h short rows. Decision is Watch / forward-paper-needed only; not paper-qualified, alert-qualified, live-qualified, or promoted.
- Verification: `validate:candidates`, `filter`, `study:features`, `verify`, and `npm test` passed after the filter repair. Final verifier reports 130 variants, 6 survivors, 124 rejected, 14 feature studies, 7 accessible data rails, and tests passed 28/28.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.

# 2026-08-29T21:56:44Z - AVAX trend pullback rejection

- Trigger: continued one more bounded AVAX branch after the AVAX range breakdown watch result: `validation.optionally-test-avax-trend-pullback-reclaim-b-tier-candidate`.
- Input bucket: AVAX 1h `trend_pullback_reclaim_long` long in `up/mid-vol`, alert-edge historical stats 41 samples, expectancy `0.1273R`, profit factor `1.2173`, baseline expectancy `-0.1055R`.
- Output: added `alert-edge-avax-trend-pullback-reclaim-long-v0` to `experiments/strategy-destruction-filter/candidates/seed-strategies.json`; regenerated filter and feature-study artifacts; added `wiki/notes/2026-08-29-avax-trend-pullback-rejection.md`; updated the AVAX range-breakdown watch note counts; updated current operating map, retrieval router, work queue, and loop state.
- Final result: 13 candidates / 131 variants / 6 survivors / 125 rejected. The new AVAX pullback candidate was rejected with sample 621, expectancy `0.0037R`, profit factor `1.0058`, deflated-Sharpe proxy `-0.0563`, max drawdown `56.1718R`, OOS 195 trades / `-0.1091R`, baseline lift `0.0154R`, 2/5 positive walk-forward folds, 2/5 positive baseline-lift folds, 0/2 diagnostic OOS folds, and minimum fold expectancy `-0.1511R`.
- Forward-paper gate: exact regime-tagged forward paper rows for `AVAX|1h|trend_pullback_reclaim_long|up/mid-vol` are 0, with 0 adjacent same-setup AVAX 1h long rows. Historical gates already reject it, so missing forward paper is confirming evidence rather than the deciding blocker.
- Verification: `validate:candidates`, `filter`, `study:features`, `verify`, and `npm test` passed. Final verifier reports 131 variants, 6 survivors, 125 rejected, 14 feature studies, 7 accessible data rails, and tests passed 28/28.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.

# 2026-08-30T19:47:22Z - Indexing and evals audit

- Trigger: continuation handoff for Tomas's indexing/evals/meta thread; started with "Do we have evals?" and did not open a strategy branch.
- Output: added `wiki/notes/2026-08-30-indexing-and-evals-audit.md`; updated `index.yaml`, `index.md`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`, and memory.
- Result: RALPH has partial evals through setup-analysis, alert-edge, strategy-filter, liquidation harness, evidence-prioritizer, generated YAML indexes, and SQLite runtime stores. Missing first-class evals are retrieval/index-budget, loop quality, HITL-question quality, demo/paper-readiness, reusable delivery verification, and cron-health failure streak tests.
- Verification: re-ran YAML parse for `index.yaml`, `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, and `automation/loop-state.yaml`; JSON parse for `graph/decision-graph.json`; wiki count; OpenClaw cron list/get for `ralph-weekly-maintenance`; and bridge ingest/search for the new note.
- Boundaries: changed wiki/router/log/memory only; no real-money trading, orders, keys, accounts, paid services, demo/testnet setup, alert wording, thresholds, risk/sizing/TP/SL, execution behavior, scheduler changes, dependency adoption, public posting, or strategy promotion changed.

# 2026-08-29T22:14:02Z - AI Research OS index lint

- Trigger: bounded branch `validation.ai-research-os-index-lint` under the approved RALPH Profitability Flywheel after the forward-paper regime-tagging, AVAX candidate, and source-falsification guide updates.
- Output: added `wiki/notes/2026-08-29-ai-research-os-index-lint.md`; added YAML frontmatter to `wiki/notes/2026-08-29-forward-paper-regime-tagging.md`, `wiki/notes/2026-08-29-avax-range-breakdown-watch.md`, and `wiki/notes/2026-08-29-avax-trend-pullback-rejection.md`; updated `index.yaml`, regenerated `index.md`, and updated the retrieval router, work queues, loop state, current operating map, and log.
- Result: repaired stale catalog routing state. `index.yaml` now reports the current wiki-page count, the top-level generated index routes to the new 2026-08-29 notes, and the validation queue no longer lists `ai-research-os-index-lint` as pending.
- Verification: YAML parse passed for `index.yaml`, `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, and `automation/loop-state.yaml`; JSON parse passed for `graph/decision-graph.json`; frontmatter parse passed for the repaired notes and the new lint note; path-reference lint found no missing local paths in index/router/queue/state files; bridge ingest/search verified the new and materially repaired notes. OpenClaw bridge lint still reports 16 older broken-wikilink warnings from previously ingested copied RALPH source pages; the new/refreshed pages search-verified correctly.
- Reassessment: next useful branch is `validation.recheck-ta-call-candidates-after-20-row-threshold` unless exact regime-tagged forward paper rows become available for the AVAX watch item first. Do not run the AVAX recheck while the exact row count remains 0.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
# 2026-08-29T22:34:12Z - Evidence ledger prioritizer

- Trigger: Tomas challenged the previous stop at low context and told the agent to keep working under the approved RALPH loop. Threshold branches were checked first and were not evidence-ready.
- Output: added `automation/evidence-ledger-prioritizer.mjs`, generated `outputs/evidence-ledger-prioritizer.json` and `.md`, added `wiki/notes/2026-08-29-evidence-ledger-prioritizer.md`, and updated work queue, loop state, retrieval router, current operating map, and index catalog.
- Result: after marking the prioritizer done, the ledger ranks 61 remaining pending work items by evidence readiness and cheap kill-test value: 28 ready-now, 2 threshold-watch, and 31 needs-wheel-gate. Held `validation.recheck-ta-call-candidates-after-20-row-threshold` because the largest call bucket is `9/20`; held `validation.recheck-avax-range-breakdown-after-forward-paper-threshold` because exact AVAX 1h `range_breakdown_short` short `down/low-vol` forward-paper rows are `0/20`.
- Reassessment: next useful branch is `investigation.community-idea-to-kill-test-template`, with GitHub/operator source mapping as secondary ready work. Do not rerun threshold branches before evidence exists.
- Verification: `node --check ralph-research-os/automation/evidence-ledger-prioritizer.mjs` and `node ralph-research-os/automation/evidence-ledger-prioritizer.mjs` passed.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
# 2026-08-29T22:42:18Z - Community idea kill-test template

- Trigger: continued after `decision.autoresearch-evidence-ledger-prioritizer`, which ranked `investigation.community-idea-to-kill-test-template` as the next ready branch.
- Output: added `wiki/notes/templates/community-idea-kill-test.md`, added `wiki/notes/2026-08-29-community-idea-kill-test-template.md`, and updated work queue, loop state, retrieval router, current operating map, and index catalog.
- Result: public GitHub/operator/X/Reddit/blog/dashboard/product/paper ideas now have a stable intake shape: source URL, surface, access classification, claim, mechanism, market fit, reuse path, data needed, dumb baseline, cheapest kill test, kill criteria, source quality, failure modes, bounded decision, and next micro-action.
- Reassessment: use GitHub/code-backed source mapping before broad X/Reddit scans. The template only allows Rejected, Watch, Candidate, Blocked, or Reassess; it cannot produce Paper-Qualified, Alert-Qualified, live, execution, sizing, TP/SL, or strategy-promotion states.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
# 2026-08-29T22:52:06Z - GitHub operator source map

- Trigger: continued after `investigation.community-idea-to-kill-test-template`; the evidence ledger prioritizer ranked GitHub/operator source mapping as the next ready branch.
- Source checks: public GitHub API metadata and raw README/docs fetches for `freqtrade/freqtrade`, `titouannwtt/freqtrade-ultimate`, `nkaz001/hftbacktest`, `djienne/COPY_WALLET_HYPERLIQUID`, `SimSimButDifferent/HyperLiquidAlgoBot`, `chainstacklabs/hyperliquid-trading-bot`, and `Drakkar-Software/OctoBot`; public Freqtrade docs checked Hyperliquid account/data/rate-limit constraints.
- Output: added `wiki/notes/2026-08-29-github-operator-source-map.md`; updated work queue, loop state, retrieval router, current operating map, and index catalog.
- Result: strongest usable output is not a new strategy. Freqtrade/Freqtrade Ultimate/hftbacktest are validation-practice and constraint sources. Copy-wallet, grid, and indicator/ML Hyperliquid bot repos are source claims to falsify with the community kill-test template, not candidate evidence.
- Reassessment: next useful branch is targeted `discovery.public-orderflow-data-rail-spike` or `discovery.copytrading-public-route-ledger`. Broader X/Reddit scans should wait behind stricter noise filters.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
# 2026-08-30T04:05:18Z - Cron alert-edge refresh

- Paper state changed: backtest/verify closed 1 paper row; overall paper dashboard `163` closed, `81W/81L/1 scratch`, avg `0.2912R`, winrate `49.69%`; qualified `17` closed, `9W/8L`, avg `0.3267R`, winrate `52.94%`. Shadow PnL remains `shadow_negative_or_unproven` at `-1530` gross USD; wick and aggtrades studies stayed low-sample/watch with no candidate added.

# 2026-08-30T05:58:00Z - Orderflow replay alignment audit

- Trigger: continued the approved RALPH Profitability Flywheel after the GitHub source-map pass; selected `discovery.public-orderflow-data-rail-spike` because the evidence ledger ranked it as the top ready route and the remaining gap was replay alignment, not exchange connectivity.
- Output: added `crypto-updates/orderflow-alert-replay-alignment.mjs`; generated `crypto-updates/runtime/orderflow-alignment/latest.json` and `crypto-updates/wiki/orderflow/replay-alignment.md`; updated `crypto-updates/orderflow-index.yaml`, `crypto-updates/wiki/orderflow/index.md`, `wiki/notes/2026-08-30-orderflow-replay-alignment-audit.md`, `automation/work-queues.yaml`, `automation/loop-state.yaml`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`, `index.yaml`, and `index.md`.
- Result: the audit checked 244 alert records, 239 finalized reviews, and 6 saved orderflow feature runs. It found 0 exact symbol/time matches and 8 near misses or partial overlaps. The two-hour BTC capture overlapped seven finalized HYPE/SOL alert windows by time, but not symbol.
- Decision: `discovery.public-orderflow-data-rail-spike` is done for this bounded replay-alignment branch. Saved captures remain pipeline evidence, not alert-classification evidence. C-036 stays `Candidate`; U-038 stays `Open`.
- Reassessment: next orderflow work should capture BTC/ETH/SOL/HYPE during active alert windows or run the alignment audit immediately after future captures. Do not rerun score-only refreshes before exact symbol/time overlap exists.
- Verification: `node crypto-updates/orderflow-alert-replay-alignment.mjs` passed after tightening overlap decisions to use manifest capture windows instead of feature timestamp extrema.
- Boundaries: no live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.

# 2026-08-30T06:06:00Z - Copytrading public route ledger

- Trigger: continued under the approved RALPH Profitability Flywheel after the orderflow replay-alignment branch; selected `discovery.copytrading-public-route-ledger` as the next ready no-key copytrading/source-lane item.
- Output: added `experiments/copytrading-address-intake/src/run-hyperliquid-public-route-ledger.mjs`, updated `experiments/copytrading-address-intake/package.json`, generated `experiments/copytrading-address-intake/results/hyperliquid-public-route-ledger.json` and `.md`, added `wiki/notes/2026-08-30-copytrading-public-route-ledger.md`, and updated `decisions/copytrading-watch-ledger.md`, work queue, loop state, retrieval router, current operating map, index catalog, and log.
- Access result: Hyperliquid public stats leaderboard at `https://stats-data.hyperliquid.xyz/Mainnet/leaderboard` returned 44,149 structured address rows without a key. Web checks also found Hyperliquid official leaderboard/app, HypurrScan, HyperDash Explore, HyperTracker, Nansen Hyperliquid leaderboard API docs, and Apify Hyperliquid leaderboard actors.
- Classification: Hyperliquid public stats leaderboard is active discovery-only; Hyperliquid official info endpoint remains active no-key verification for `clearinghouseState`/`userFills`; HypurrScan and HyperDash are watch/manual; HyperTracker/Nansen/Apify-style routes remain needs-access or needs-approval for programmatic use.
- Selection-bias result: 22,230 rows had positive all-time PnL, while 2,126 had positive all-time PnL but negative week PnL. Top rows also show stale/withdrawn-profit, inactive recent-volume, recent-drawdown, and small-account capacity risks.
- Decision: `discovery.copytrading-public-route-ledger` is done for this bounded pass. No leaderboard row is a copy candidate; seeds must pass independent fill/state intake plus outlier, latency, capacity, beta, hidden-hedge, and exit-shadowing checks before any frozen paper cohort spec.
- Verification: `node --check experiments/copytrading-address-intake/src/run-hyperliquid-public-route-ledger.mjs` and `npm run ledger:public-routes --prefix ralph-research-os/experiments/copytrading-address-intake` passed.
- Boundaries: no live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.

# 2026-08-30T06:14:00Z - X/Reddit strategy inspiration scan

- Trigger: continued under the approved RALPH Profitability Flywheel after the copytrading route ledger; selected `discovery.x-reddit-strategy-inspiration-scan` from the evidence prioritizer, but applied strict social-noise filters.
- Source checks: public web/search results for Reddit algo-trading discussions, Hyperliquid copytrading/verifier GitHub sources, Hyperliquid data-layer GitHub/source claims, and X orderflow/data-layer posts. X search results were noisy and many were rejected as generic/spam/product-copy without inspectable evidence.
- Output: added `wiki/notes/2026-08-30-x-reddit-strategy-inspiration-scan.md`; updated work queue, loop state, retrieval router, current operating map, index catalog, and log.
- Result: retained only source-backed falsification themes: failed-strategy postmortems, paper-test duration discipline, data/source quality, deep order-book realism, opening-range breakout as a dumb baseline, Hyperliquid copytrading verifier claims, and Hyperliquid data-layer product claims.
- Decision: `discovery.x-reddit-strategy-inspiration-scan` is done for this bounded pass. No social item became a strategy candidate; each retained item routes through an existing local falsifier or the community idea kill-test template.
- Boundaries: no live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.

# 2026-08-30T06:16:00Z - Hyperliquid leaderboard address sample

- Trigger: continued under the approved RALPH Profitability Flywheel after verifying the public Hyperliquid stats leaderboard route; selected `discovery.hyperliquid-copytrading-address-sample`.
- Output: updated `experiments/copytrading-address-intake/src/run-hyperliquid-address-intake.mjs` with `--output-prefix`, added `experiments/copytrading-address-intake/data/public-leaderboard-addresses-2026-08-30.json`, generated `experiments/copytrading-address-intake/results/hyperliquid-leaderboard-address-intake-2026-08-30.json` and `.md`, added `wiki/notes/2026-08-30-hyperliquid-leaderboard-address-sample.md`, and updated `decisions/copytrading-watch-ledger.md`, work queue, loop state, retrieval router, current operating map, index catalog, and log.
- Result: six leaderboard-derived addresses were checked through public/no-key `clearinghouseState` and `userFills`. The sample produced 0 copy candidates, 2/6 accounts with open positions, 4/6 capped fill responses, 1/6 no-fill response, 1 rejected-as-copy row, and 5 watch/sample-only rows.
- Decision: `discovery.hyperliquid-copytrading-address-sample` is done for this bounded pass. The useful output is the pipeline from public leaderboard seed to no-key rejection/watch classification, not the sampled addresses themselves.
- Verification: `node --check experiments/copytrading-address-intake/src/run-hyperliquid-address-intake.mjs` and `npm run intake:hyperliquid --prefix ralph-research-os/experiments/copytrading-address-intake -- --addresses ralph-research-os/experiments/copytrading-address-intake/data/public-leaderboard-addresses-2026-08-30.json --output-prefix hyperliquid-leaderboard-address-intake-2026-08-30` passed.
- Boundaries: no live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
- 2026-08-31T04:05Z cron refresh: paper state changed with 15 paper rows closed this run; overall paper `184` closed, `85W/98L/1 scratch`, avg `0.2163R`, winrate `46.20%`; qualified `18` closed, `9W/9L`, avg `0.2530R`, winrate `50.00%`. Shadow PnL remains `shadow_negative_or_unproven` at `-1530` gross USD; wick and aggtrades studies stayed low-sample/watch with no candidate added.
# 2026-08-31T06:50:00Z - funding/basis previous-output comparison extension

- Implemented manual previous-output comparison in `automation/funding-basis-public-snapshot-table.mjs`.
- The script now reads the previous local `outputs/funding-basis-public-snapshot-table.json` before overwriting it and renders a `Previous-Run Comparison` section when matching coins exist.
- Verified by rerunning the script: output still has 20 rows, 233 Hyperliquid markets, 864 funding-history rows, and a comparison against the prior `2026-08-31T06:20:56.153Z` run.
- Decision: current funding/basis branch should stop or use manual elapsed-time reruns next. Scheduler, live monitor, alert, account, demo/testnet setup, threshold, sizing, or execution requires separate explicit HITL.
- Boundary delta: no live trading, accounts, keys, paid services, demo/testnet setup, scheduler change, alerts, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.

# 2026-08-31T06:44:00Z - funding/basis fixed-window accounting design

- Completed `validation.funding-basis-fixed-window-accounting-design` as a research-only design.
- Added `wiki/notes/2026-08-31-funding-basis-fixed-window-accounting-design.md`.
- Defined frozen window records, accounting rows, qualitative cost classes, required dumb-baseline comparisons, tail-risk flags, and research states: reject, watch, or needs-longer-paper-window.
- Decision: next safe implementation is optional previous-output ingestion for manual repeated runs. Scheduler, live monitor, alert, account, demo/testnet setup, threshold, sizing, or execution requires separate explicit HITL.
- Boundary delta: no live trading, accounts, keys, paid services, demo/testnet setup, scheduler change, alerts, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.

# 2026-08-31T06:35:00Z - funding/basis public snapshot table

- Completed `validation.funding-basis-public-snapshot-table` as a one-shot public/no-key baseline artifact.
- Added `automation/funding-basis-public-snapshot-table.mjs`.
- Generated `outputs/funding-basis-public-snapshot-table.json` and `outputs/funding-basis-public-snapshot-table.md`.
- Added `wiki/notes/2026-08-31-funding-basis-public-snapshot-table.md`.
- Run result: 233 Hyperliquid perp markets returned; 20 table rows; 864 funding-history rows fetched across the top 12 daily-notional markets; 12 rows had enough short-window history for observation; DefiLlama stable/yield context included a 4.07% TVL-weighted top-stable-pool APY sample.
- Decision: public/no-key data rail is validated for baseline diagnostics only. C-025 remains Candidate/baseline, not paper-qualified or promoted.
- Boundary delta: no live trading, accounts, keys, paid services, demo/testnet setup, scheduler change, alerts, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.

# 2026-08-31T06:28:00Z - funding/basis baseline monitor spec

- Completed `discovery.funding-basis-baseline-monitor` as a bounded read-only feasibility/spec pass.
- Added `wiki/notes/2026-08-31-funding-basis-baseline-monitor.md`.
- Workspace access checks verified no-key Hyperliquid `metaAndAssetCtxs` and BTC `fundingHistory`, plus no-key DefiLlama yields, stablecoins, and open-interest context.
- Updated queue/router/state/current map/candidate/unknown/index files only.
- Decision: funding/basis is feasible as a no-prediction patient-retail comparison floor, not a promoted strategy. Next safe artifact is `validation.funding-basis-public-snapshot-table`.
- Boundary delta: no live trading, accounts, keys, paid services, demo/testnet setup, scheduler change, alerts, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.

# 2026-08-31T11:25:45Z - funding/basis wallet detection spike

- Trigger: Tomas continued from `continuation-prompts/2026-08-31-1105-ralph-after-funding-basis-baseline-handoff.md` and explicitly selected `discovery.funding-basis-wallet-detection-spike` as the next bounded item.
- Output: added `wiki/notes/2026-08-31-funding-basis-wallet-detection-spike.md`; updated work queue, loop state, retrieval router, current operating map, candidates, unknowns, index catalog, log, and memory.
- Result: Hyperliquid known-address public routes can expose current perp state, recent/capped fills, time-window capped fills, and funding/ledger rows for a known address. They cannot prove actor-level structural basis because the hedge can live on another venue, wallet, sub-account, vault, borrow/spot rail, or instrument that the address query cannot see.
- Decision: C-021 stays Watch as `weak-public-detectability`; U-023 is resolved for the current no-key phase. Market-level funding/basis baseline monitoring is more realistic than wallet-level detection until Tomas explicitly approves actor-clustering and cross-venue exposure access.
- Boundary delta: no scanner, cohort, live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, scheduler change, alerts, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.

# 2026-09-01T05:54:41Z - no-key copytrading discovery limit map

- Trigger: continued after U-019 with context still below the handoff threshold; selected U-039 as the last compact wallet-source synthesis before the remaining wallet items become row/access-gated.
- Output: added `wiki/notes/2026-09-01-no-key-copytrading-discovery-limit-map.md`; updated work queue, loop state, retrieval router, current operating map, unknowns, index catalog, generated prioritizer/checklist outputs, bridge source, log, and memory.
- Result: U-039 is resolved for current routing. No-key copytrading discovery is useful for prior art, triage, rejection, and tiny falsifiers, but not enough to produce useful copy candidates without non-leaderboard universe rows, full history, exits, hedge visibility, and slow cohort coverage.
- Boundary delta: no account, key, paid service, API use, collector, scanner, scheduler, cron, systemd, alert, threshold, copy rule, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.

# 2026-09-01T05:51:43Z - Hyperliquid activity-defined universe route

- Trigger: continued after U-024 with context still below the handoff threshold; selected U-019 as a route-contract branch only.
- Output: added `wiki/notes/2026-09-01-hyperliquid-activity-defined-universe-route.md`; updated work queue, loop state, retrieval router, current operating map, unknowns, index catalog, generated prioritizer/checklist outputs, bridge source, log, and memory.
- Result: U-019 is resolved for current routing. RALPH cannot yet claim an activity-defined Hyperliquid universe because active no-key routes cover leaderboard seeds and known-address verification, not non-leaderboard venue-wide account discovery by recent activity. Future work needs a public/no-key activity export or HITL-approved tiny keyed/export sample.
- Boundary delta: no account, key, paid service, API use, collector, scanner, scheduler, cron, systemd, alert, threshold, copy rule, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.

# 2026-09-01T05:48:36Z - mid-cap accumulation coverage liquidity map

- Trigger: continued after U-022 with context still below the handoff threshold; selected U-024 as a compact coverage/liquidity closeout.
- Output: added `wiki/notes/2026-09-01-mid-cap-accumulation-coverage-liquidity-map.md`; updated work queue, loop state, retrieval router, current operating map, unknowns, index catalog, generated prioritizer/checklist outputs, bridge source, log, and memory.
- Result: U-024 is resolved for current routing. Mid-cap accumulation remains high-fit in principle, but active no-key data cannot yet measure enough coverage and liquidity. Keep Watch/needs-access until frozen 20+ wallet/entity rows include entry, exit/distribution, flow quality, liquidity/impact context, baselines, and outlier controls.
- Boundary delta: no account, key, paid service, API use, collector, scanner, scheduler, cron, systemd, alert, threshold, copy rule, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.

# 2026-09-01T05:45:28Z - cohort flow vs single-wallet signal map

- Trigger: continued after U-037 with context still below the handoff threshold; selected U-022 as a compact wallet/cohort routing synthesis.
- Output: added `wiki/notes/2026-09-01-cohort-flow-vs-single-wallet-signal-map.md`; updated work queue, loop state, retrieval router, current operating map, unknowns, index catalog, generated prioritizer/checklist outputs, bridge source, log, and memory.
- Result: U-022 is resolved for current routing. Cohort flow is the preferred signal target over single-wallet copying for Tomas's patient-retail constraints, but remains Watch/needs-access until frozen 20+ wallet/entity rows include entry, exit/distribution, baselines, delayed follower result, and outlier controls. Single-wallet copying stays radar/falsifier/rejection material.
- Boundary delta: no account, key, paid service, API use, collector, scanner, scheduler, cron, systemd, alert, threshold, copy rule, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.

# 2026-09-01T05:42:29Z - patient-retail strategy-leg repeat-fit map

- Trigger: Tomas said `Continue`; `session_status` showed context 54% and 0 compactions, so one compact research-only branch was still inside the no-compaction threshold.
- Output: added `wiki/notes/2026-09-01-patient-retail-strategy-leg-repeat-fit-map.md`; updated work queue, loop state, retrieval router, current operating map, unknowns, index catalog, generated prioritizer/checklist outputs, bridge source, log, and memory.
- Result: U-037 is resolved for current routing. Repeat-fit strategy legs are funding/basis as active no-key baseline, smart-money mid-cap accumulation as access-gated alpha, range/grid as offline falsifier, event radar as context/falsifier, token unlocks as source-first watch, and delegated copy as prior art. No leg moved to Q1, paper-candidate, alerts, sizing, or execution.
- Boundary delta: no scheduler, cron, systemd, alert, threshold, account, key, paid service, API use, collector, scanner, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.

# 2026-09-01T05:16:09Z - wallet-shadowing existing-tool coverage map

- Trigger: continued after U-010 because context remained safe and U-018 was a bounded synthesis from already verified tool/access notes.
- Output: added `wiki/notes/2026-09-01-wallet-shadowing-existing-tool-coverage-map.md`; updated work queue, loop state, retrieval router, current operating map, unknowns, index catalog, generated prioritizer/checklist outputs, bridge source, log, and memory.
- Result: U-018 is resolved for current routing. Existing tools already cover enough of wallet-shadowing to avoid broad custom scanner/copy-engine work: Hyperliquid public stats plus official info endpoints are active for seed and known-address triage/tiny falsifiers; Nansen/Dune/Arkham-style sources are serious slow-accumulator or enrichment routes only after explicit approved export/API access. Remaining gaps are evidence/access gaps, not generic engineering gaps.
- Boundary delta: no account, key, paid service, API use, collector, scanner, scheduler, cron, systemd, alert, threshold, copy rule, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.

# 2026-09-01T05:12:43Z - event vs continuous small-operator map

- Trigger: continued after U-011 because context remained at 0% with 0 compactions and the prioritizer still had no ready-now routes but multiple wheel-gated unknowns.
- Output: added `wiki/notes/2026-09-01-event-vs-continuous-small-operator-map.md`; updated work queue, loop state, retrieval router, current operating map, unknowns, index catalog, generated prioritizer/checklist outputs, bridge source, log, and memory.
- Result: U-010 is resolved for current routing. Event-triggered trading is easier for bounded research and harder for execution-grade trading because useful edge often decays fastest when latency, spreads, slippage, stale data, missed fills, hidden hedges, and selection bias are worst. RALPH should use events as falsifiers/radar unless frozen rows prove delayed copyability; slow continuous/structural families remain better latency-fit research surfaces.
- Boundary delta: no scheduler, cron, systemd, alert, threshold, account, key, paid service, API use, collector, scanner, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.

# 2026-09-01T20:37:07Z - workspace evidence routing map

- Trigger: Tomas approved normal internal RALPH/workspace cleanup and asked to walk the workspace gradually, putting or linking anything useful into the Obsidian-facing layer.
- Output: added `wiki/notes/2026-09-01-workspace-evidence-routing-map.md`; updated `core/navigation.md`, `core/data-rails.md`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`, `decisions/unknowns.md`, and `index.yaml`.
- Result: created a compact route between `ralph-research-os`, `crypto-updates`, `openclaw-research-os`, `zela-benchmark`, root `trading-journal`, continuation prompts, and daily memory. The map records that `crypto-updates` already has Obsidian-friendly generated pages and compact indexes for monitor feedback, setup analysis, trading journal, and orderflow captures, while raw JSONL/SQLite/source trees should stay in their owner directories. Root `trading-journal/` is legacy manual context; the current canonical execution/alert journal is `crypto-updates/wiki/trading-journal/index.md`.
- Decision: U-004, U-027, and U-038 should start from compact local indexes and Obsidian pages before raw/runtime scans or custom rebuild proposals. Saved orderflow captures remain pipeline evidence only until exact symbol/time overlap exists with finalized alert windows.
- Boundary delta: Obsidian/wiki routing and local docs only; no capture, scanner, collector, scheduler, cron, systemd, alert wording, thresholds, account, key, paid service, API use, demo/testnet setup, live trading, live copying, orders, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion changed.

# 2026-09-01T20:45:00Z - experiment output read-path map

- Trigger: continued the same internal workspace/Obsidian cleanup after the first map revealed that experiment outputs had many Markdown and JSON result surfaces but a sparse root `experiments/README.md`.
- Output: added `wiki/notes/2026-09-01-experiment-output-read-path-map.md`; updated `experiments/README.md`, `core/navigation.md`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`, and `index.yaml`.
- Result: documented the default read path for RALPH experiments: prioritizer/checklist, experiment README, result Markdown, matching JSON only when row-level fields are needed, and source/tests only when debugging or changing an experiment.
- Decision: `btc-eth-alert-edge`, `strategy-destruction-filter`, `copytrading-address-intake`, `liquidation-q1-baseline-kill-switch`, and root `outputs/` now have a compact Obsidian-facing route. Survivors, live execution joins, and orderflow captures remain evidence surfaces, not direct strategy-promotion proof.
- Boundary delta: Obsidian/wiki routing and local docs only; no capture, scanner, collector, scheduler, cron, systemd, alert wording, thresholds, account, key, paid service, API use, demo/testnet setup, live trading, live copying, orders, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion changed.

# 2026-09-01T20:50:00Z - legacy trading journal reconciliation

- Trigger: continued workspace inventory after finding a small root `trading-journal/` outside the generated Crypto Updates journal surface.
- Output: added `wiki/notes/2026-09-01-legacy-trading-journal-reconciliation.md`; updated `wiki/notes/2026-09-01-workspace-evidence-routing-map.md`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`, and `index.yaml`.
- Result: root `trading-journal/` has three useful manual August 10-11 records: an ETHUSDT alert-driven stopped-out long, an ETHUSDT missed alert hypothetical TP reconstruction, and a HYPEUSDT manual/emotional short close. Generated `crypto-updates/wiki/trading-journal/daily/2026-08-10.md` and `2026-08-11.md` currently report `Executions: 0`, so generated journal counts are incomplete for those dates.
- Decision: keep `crypto-updates/wiki/trading-journal/index.md` as the current generated execution/alert join surface, but check the reconciliation note before August 10-11 process-quality claims. Do not hand-edit generated journal pages; future reconciliation should add a manual-import source path or companion-source marker.
- Boundary delta: Obsidian/wiki routing and local docs only; no generated runtime data, capture, scanner, collector, scheduler, cron, systemd, alert wording, thresholds, account, key, paid service, API use, demo/testnet setup, live trading, live copying, orders, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion changed.

# 2026-09-01T20:55:00Z - Obsidian CLI status refresh

- Trigger: workspace cleanup found a current-state mismatch: U-016 still said Obsidian CLI was not active, while current OpenClaw wiki status and Obsidian helper probes showed it is available.
- Output: added `wiki/notes/2026-09-01-obsidian-cli-status-refresh.md`; updated `decisions/unknowns.md`, `core/ai-research-os-setup.md`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`, and `index.yaml`.
- Result: verified `/home/coder/.local/bin/obsidian version` returns `1.13.7 (installer 1.13.7)`, `obsidian files` returns workspace vault files, and `openclaw wiki obsidian search` finds current RALPH notes.
- Decision: U-016 is resolved for current routing as CLI active. Use Obsidian CLI for search/open/navigation sanity checks, but keep Markdown/YAML indexes as the durable contract for scheduled and isolated workers.
- Boundary delta: tooling-state docs only; no Obsidian config change, connector setup, scheduler, cron, systemd, account/key/API access, live trading, alert behavior, execution behavior, public posting, or strategy promotion changed.

# 2026-09-01T08:49:07Z - idle-router handoff

- Trigger: Tomas said `Continue` after RALPH reached an honest idle state; `session_status` showed context `159k/272k = 58%`, compactions 0.
- Action: stopped before starting another substantial branch and created `continuation-prompts/2026-09-01-0849-ralph-idle-router-after-watch-gates.md`.
- Verification: reran `evidence-ledger-prioritizer` and `research-validation-checklist`; prioritizer remained `pendingItems: 0`, `readyNow: 0`, `watchUntilThreshold: 2`; checklist remained overall `warn` with handoff readiness now pointing to the new handoff.
- Decision: next fresh session should not invent more work from `continue` alone. RALPH needs a row-count threshold change, a named trigger/source/account/event, or explicit gated approval.
- Boundary delta: handoff/log/memory/verifier outputs only; no TA/AVAX rerun, data sample, wallet-shadow sample, scheduler, alert, threshold, account/key, paid service, demo/testnet, live trading, sizing, TP/SL, execution, public posting, or strategy promotion changed.

# 2026-09-01T08:41:00Z - threshold-watch pending cleanup

- Trigger: Tomas said `Ok, continue` after all needs-wheel-gate items had been converted to Watch gates.
- Output: updated `automation/evidence-ledger-prioritizer.mjs`, `automation/work-queues.yaml`, `automation/current-operating-map.md`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`, `index.yaml`, `index.md`, generated verifier outputs, `log.md`, and `memory/2026-09-01.md`.
- Result: moved `recheck-ta-call-candidates-after-20-row-threshold` and `recheck-avax-range-breakdown-after-forward-paper-threshold` out of validation pending and into tracked Watch gates: `ta-call-candidates-20-row-threshold` and `avax-1h-range-breakdown-short-down-low-vol`.
- Decision: the prioritizer now keeps threshold-watch gates visible without counting them as manual pending work. Current expected router state is no ready-now work and no needs-wheel-gate work unless a row threshold, named trigger, or explicit approval fires.
- Boundary delta: no TA/AVAX rerun, market data sample, wallet-shadow sample, scheduler, alert, threshold, account/key, paid service, demo/testnet, live trading, sizing, TP/SL, execution, public posting, or strategy promotion changed.

# 2026-09-01T08:31:00Z - wallet-shadow U-008/U-017 wheel gate

- Trigger: continued internal router cleanup after U-001; `session_status` was still below the handoff threshold.
- Output: updated `wiki/notes/2026-09-01-hyperliquid-wallet-shadow-delay-sample.md`, `automation/work-queues.yaml`, `automation/current-operating-map.md`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`, `decisions/unknowns.md`, `decisions/candidates.md`, `index.yaml`, `index.md`, generated verifier outputs, `log.md`, and `memory/2026-09-01.md`; bridge-ingested/search-verified the updated note as `source.ralph-hyperliquid-wallet-shadow-delay-sample`.
- Result: converted U-008/U-017 from pending unknown work into Watch-only `wallet-shadow-independent-event-window-gate`.
- Decision: no new wallet-shadow sample runs are authorized until Tomas names an independent event/source/account trigger or a source-ranked event record creates a precise window. A future study must require 3+ windows, 20+ quality observations, same-run raw rows plus delay joins, entry/exit classification, conservative costs, baseline rows, hidden-hedge flags, and cluster/outlier controls.
- Boundary delta: no new rows, sampling, HYPE L2 capture, broad wallet scanner/capture, scheduler, alert, threshold, account/key, paid service, demo/testnet, live trading, sizing, TP/SL, execution, public posting, or strategy promotion changed.

# 2026-09-01T08:24:00Z - Arkham U-001 wheel gate

- Trigger: Tomas said `Continue` after wallet-shadow stand-down; `session_status` showed context 29% and compactions 0.
- Output: updated `wiki/notes/2026-08-31-arkham-evaluation-checklist.md`, `automation/work-queues.yaml`, `automation/current-operating-map.md`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`, `decisions/unknowns.md`, `decisions/candidates.md`, `index.yaml`, `index.md`, generated verifier outputs, `log.md`, and `memory/2026-09-01.md`; bridge-ingested/search-verified the updated note as `source.ralph-arkham-evaluation-checklist`.
- Result: converted U-001 from pending unknown work into Watch-only `arkham-material-value-tiny-export-gate`. The falsifiable sample contract requires explicit Tomas approval for account/API-plan-or-trial/API-key access, spend cap, endpoint scope, local export path, and comparison against current public routes before any Arkham API/export work can start.
- Decision: U-001 remains open but is no longer ready manual work. It should reopen only after the approved tiny sample exists, and success means Arkham changes a concrete RALPH routing/rejection decision versus public data.
- Boundary delta: no Arkham account, key, paid plan, API call, export, broad transfer scan, scanner, cohort, scheduler, alert, threshold, demo/testnet, live trading, sizing, TP/SL, execution, public posting, or strategy promotion changed.

# 2026-09-01T07:46:01Z - wallet-shadow event-window stand-down

- Trigger: Tomas said `Continue` from `continuation-prompts/2026-09-01-0650-ralph-after-wallet-shadow-delay-sample.md`; fresh `session_status` showed context 0% and compactions 0.
- Action: read the handoff plus `wiki/notes/2026-09-01-hyperliquid-wallet-shadow-delay-sample.md`, then checked the current queue/verifier state.
- Result: did not start a new Hyperliquid wallet-shadow sample because there is no named independent event trigger and the only allowed next branch was a scoped frozen event-window study or stand-down. `evidence-ledger-prioritizer` still reports `pendingItems: 5`, `readyNow: 0`, `watchUntilThreshold: 2`, and `needsWheelGate: 3`. `research-validation-checklist` remains overall `warn`, with the known `cron` warn and `paperDemo` not-ready only.
- Decision: U-008/U-017 stay open; no new wallet-shadow rows, scanner/capture, threshold, scheduler, alert, account/key, paid source, demo/testnet, live trading, sizing, TP/SL, execution, public posting, or strategy promotion changed.

# 2026-09-01T05:08:06Z - A2 operating safety brief

- Trigger: Tomas continued from `continuation-prompts/2026-09-01-0240-ralph-after-u002-u009-context-threshold.md`; fresh `session_status` showed context 0% and compactions 0.
- Output: added `wiki/notes/2026-09-01-a2-operating-safety-brief.md`; updated work queue, loop state, retrieval router, current operating map, unknowns, index catalog, generated prioritizer/checklist outputs, bridge source, log, and memory.
- Result: U-011 is resolved for the current A2/no-key phase. Approved loops are narrow, one-branch, router/index-first, internal by default, self-verified, and limited to minimal durable updates. Dormant playbooks stay Watch, TA/AVAX stay threshold-watch, and HYPE L2, wallet-shadow capture, paid/keyed sources, scheduler changes, alerts, accounts, demo/testnet, execution, sizing, TP/SL, public posting, and strategy promotion remain blocked or HITL-gated until named triggers or explicit approval exist.
- Boundary delta: no scheduler, cron, systemd, alert, threshold, account, key, paid service, API use, collector, scanner, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.

# 2026-08-31T11:34:48Z - slow accumulator copytrading source fit

- Trigger: Tomas said `Continue`; context was 50%, compactions 0, so one bounded branch was still feasible under the 60% handoff rule.
- Output: added `wiki/notes/2026-08-31-slow-accumulator-copytrading-source-fit.md`; updated work queue, loop state, retrieval router, current operating map, candidates, unknowns, index catalog, log, and memory.
- Source result: Nansen Smart Money netflows are highest-fit for slow token accumulation/distribution but require approved API/payment access; Dune is the transparent extraction route if an API/manual export path is approved; Arkham fits entity/flow enrichment; Hyperliquid, Copin, HyperDash, and similar copytrading products are mostly perp-copy prior art, not slow spot accumulation evidence.
- Decision: `discovery.slow-accumulator-copytrading-source-fit` is done. C-022 and C-038 remain Candidate/Watch-style source lanes; U-039 stays open for non-leaderboard activity-defined no-key discovery, but the source-fit split is now documented.
- Boundary delta: no scanner, cohort, live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, scheduler change, alerts, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.

# 2026-08-31T11:38:19Z - slow accumulator following exit risk scan

- Trigger: continued one more bounded branch under the RALPH Profitability Flywheel while context was still below the 60% handoff threshold.
- Output: added `wiki/notes/2026-08-31-slow-accumulator-following-exit-risk-scan.md`; updated work queue, loop state, retrieval router, current operating map, candidates, unknowns, index catalog, log, and memory.
- Result: defined exit/distribution risk as the main slow-accumulator failure mode. Missing exit rows are a veto, not a caveat. A future paper row must include frozen selection, wallet/entity, token, entry flow, stablecoin flow where available, exit/distribution flow, CEX/bridge/off-ramp context where visible, price path, liquidity, beta context, delayed follower result, and quality flags.
- Decision: `discovery.slow-accumulator-following-exit-risk-scan` is done. C-029 remains Candidate but routes to exit-first frozen paper design or approved export sample, not scanner/prototype work. U-026 and U-029 are narrowed but still open until measured rows exist.
- Boundary delta: no scanner, cohort, live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, scheduler change, alerts, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.

# 2026-08-31T11:41:37Z - slow accumulator tool fit map update

- Trigger: continued adjacent consolidation after source-fit and exit-risk scans; the work was a bounded update of the older July comparison.
- Output: updated `wiki/comparisons/slow-accumulator-tool-fit-map.md`; added `wiki/notes/2026-08-31-slow-accumulator-tool-fit-map-update.md`; updated work queue, loop state, retrieval router, current operating map, candidates, index catalog, log, and memory.
- Result: current ranking is Nansen Smart Money netflows first, Dune export/SQL second, Arkham enrichment third, DefiLlama/public market data as context, and Hyperliquid/Copin/HyperDash/BitMEX-style copytrading surfaces as prior art or triage only.
- Decision: `discovery.slow-accumulator-tool-fit-map` is done. The map now routes future slow-accumulator work away from copytrading scanner builds and toward access/export or exit-first paper design.
- Boundary delta: no scanner, cohort, live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, scheduler change, alerts, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.

# 2026-08-31T13:07:37Z - funding/basis manual elapsed-time rerun

- Trigger: Tomas asked to continue the RALPH audit after a previous delivery/processing error; workspace state showed the wallet-detection branch and adjacent slow-accumulator branches had already completed, while `evidence-ledger-prioritizer` reported `readyNow: 0`.
- Output: manually reran `automation/funding-basis-public-snapshot-table.mjs`, updating `outputs/funding-basis-public-snapshot-table.json` and `.md`; reran `evidence-ledger-prioritizer` and `research-validation-checklist`.
- Result: the public/no-key collector returned 233 Hyperliquid markets, 20 table rows, 864 funding-history rows, 12 observe rows, and top stable-yield context APY 4.06%. Previous-run comparison showed BTC/ETH/SOL/HYPE/PUMP/XRP/UNI funding stayed broadly stable; XMR and LIT current funding cooled; SKR moved from history-not-fetched to observe but with extreme negative funding, mark/oracle divergence, and impact-width caveats.
- Verification: `node --check automation/funding-basis-public-snapshot-table.mjs` passed; `evidence-ledger-prioritizer` stayed `readyNow: 0`, `pendingItems: 21`, `watchUntilThreshold: 2`; `research-validation-checklist` stayed overall `warn` with retrieval/pathRefs/queues/delivery/hitlQuality/loopQuality/handoffReadiness/boundaryDelta passing, cron warn, and paperDemo not-ready.
- Decision: no further ready bounded route exists right now. Funding/basis remains manual elapsed-time baseline observation; wallet-level structural-basis detection stays Watch/weak-public-detectability.
- Boundary delta: local JSON/Markdown outputs and current map/log/memory only; no scheduler, live monitor, alert, threshold, account, key, paid service, scanner, cohort, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion changed.

# 2026-08-31T13:20:00Z - wallet-shadow delay evidence

- Trigger: Tomas said `continue`; current context was 34%, compactions 0. With no ready-now routes, selected the next bounded needs-wheel-gate item: `discovery.wallet-shadow-delay-evidence`.
- Output: added `wiki/notes/2026-08-31-wallet-shadow-delay-evidence.md`; updated work queue, loop state, retrieval router, current operating map, candidates, unknowns, index catalog, generated prioritizer/checklist outputs, and memory; bridge-ingested/search-verified the note as `source.ralph-wallet-shadow-delay-evidence`.
- Result: official Hyperliquid docs and live probes confirm public/no-key `userFillsByTime` plus `candleSnapshot` can support small delay tests for recent known-address fills. A 20-minute probe for `0x7fdafde5cfb5465924316eced2d3715494c517d1` returned 396 fills; one SOL open-short fill joined to 1-minute candles and produced 15s/60s/180s/5m delay price proxies.
- Reassess: this proves the measurement path only. A narrow historical window based on saved summary timestamps returned zero fills, so future delay ledgers must capture raw rows and market joins in the same run. U-008/U-017 remain open until 20+ quality observations across frozen event windows survive delay, costs, exits, selection bias, and hidden-hedge checks.
- Verification: rebuilt `index.md`; first checklist caught a real wiki-count mismatch after adding the page, then updating `index.yaml` to 159 wiki pages restored validation to overall `warn` with retrieval passing. `evidence-ledger-prioritizer` now reports `pendingItems: 20`, `readyNow: 0`, `watchUntilThreshold: 2`. OpenClaw wiki search returns `source.ralph-wallet-shadow-delay-evidence`.
- Boundary delta: no scanner, cohort, live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, scheduler change, alerts, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.

# 2026-09-03T07:30:00Z - strategy filter survivor uniqueness audit

- Trigger: scheduled `ralph-autoresearch-loop`; selected one bounded priority-1 filter-hardening item.
- Output: added `wiki/notes/2026-09-03-strategy-filter-survivor-uniqueness-audit.md`; updated retrieval router and loop state; bridge ingest/search verification completed.
- Result: current filter report remains 13 candidates / 131 variants / 6 raw survivors / 125 rejected, but the raw survivor count is inflated as an independence signal. All survivors are `alert-edge-avax-range-breakdown-short-v0`; the 6 survivors collapse to 3 unique metric/signal shapes because pairs #1/#2, #3/#4, and #5/#6 differ only by `rsiMaxShort` while testing a short-only candidate shape.
- Decision: keep AVAX range breakdown as Watch / forward-paper-needed because exact regime-tagged forward-paper rows remain 0; future reporting should prefer survivor-shapes over raw survivor counts when identical-trade parameter duplicates appear.
- Boundary delta: research note/router/state/log only; no Telegram update, strategy promotion, live/paper execution, orders, wallet keys, exchange keys, paid APIs, account setup, scheduler/cadence change, live alert wording, thresholds, risk/sizing/TP/SL, public posting, scanner, or data capture.

# 2026-08-31T16:40:52Z - context handoff before more RALPH work

- Trigger: Tomas said `Continue`, but `session_status` showed context `192k/272k` (`70%`) with 0 compactions.
- Action: stopped substantial work and created `continuation-prompts/2026-08-31-1640-ralph-after-wallet-delay-handoff.md`.
- Next recommended fresh-session branch: `discovery.wallet-shadowing-archetype-shadowability-map`, research-only/routing-only, because it can synthesize funding/basis, slow-accumulator, event-radar, and delay-evidence work without paid access or scanner construction.
- Boundary delta: handoff/log/memory only; no scheduler, live monitor, alert, threshold, account/key/paid service, scanner, cohort, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion changed.

# 2026-08-31T17:47:38Z - wallet-shadowing archetype shadowability map

- Trigger: Tomas continued from `continuation-prompts/2026-08-31-1640-ralph-after-wallet-delay-handoff.md`; fresh `session_status` showed context 0%, compactions 0.
- Output: updated `wiki/comparisons/wallet-shadowing-archetype-map.md`; added `wiki/notes/2026-08-31-wallet-shadowing-archetype-shadowability-map.md`; updated work queue, loop state, retrieval router, current operating map, candidates, unknowns, index catalog, log, and memory.
- Result: synthesized funding/basis, slow accumulator, event-radar, and delay-evidence work into a route map by latency, data availability, hidden-hedge risk, exit observability, no-key measurability, and next falsifier.
- Decision: market-level funding/basis is the current no-key measurable latency-tolerant comparison floor; wallet-level structural funding/basis remains Watch/weak-public-detectability; slow accumulator following remains the higher-upside alpha branch but requires approved/exported smart-money data with exit/distribution rows; event and Hyperliquid wallet-shadowing remain tiny frozen-falsifier routes, not scanner or strategy-promotion routes. U-021 is resolved for current no-key routing and C-019 is done.
- Boundary delta: no scanner, cohort, live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, scheduler change, alerts, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.

# 2026-08-31T17:56:47Z - Arkham evaluation checklist

- Trigger: Tomas said `Continue`; `session_status` showed context 37%, compactions 0. With no ready-now routes and only two discovery items pending, selected bounded `discovery.arkham-evaluation-checklist`.
- Output: added `wiki/notes/2026-08-31-arkham-evaluation-checklist.md`; updated `wiki/entities/arkham.md`, work queue, loop state, retrieval router, current operating map, candidates, unknowns, index catalog, log, and memory.
- Source/access result: Arkham public docs and LLM docs are reachable; docs show entity/address intelligence, labels, transfers, token top-flow, entity balance changes, portfolio/history, balances, loans, counterparties, HyperCore context, alerts/user objects, usage analytics, and credit/rate-limit documentation. API use requires an Arkham account, API plan or trial, and API key. Usage-based subscriptions start at $100 and terms include fees, overages, payment authorization, and non-refundability.
- Workspace probe: direct no-key calls to `GET /chains`, `GET /networks/status`, `GET /intelligence/entity/binance`, and `GET /token/top_flow/usd-coin?timeLast=24h&limit=1` all returned HTTP 400 with an API-key signup message, so even zero-credit endpoints are not active anonymously here.
- Decision: Arkham remains Candidate / `needs-approval / enrichment-first`. U-001 stays open until an approved tiny export/API sample proves decision value over public routes. No active Arkham rail, scanner, cohort, alert, account, key, paid plan, scheduler, threshold, sizing, execution, public output, or strategy promotion was created.
- Boundary delta: wiki/router/queue/state/log/memory/index only.

# 2026-08-31T18:00:26Z - smart-money cohort discovery layer

- Trigger: continued after the Arkham checklist while context was below the handoff threshold and only one discovery item remained.
- Output: added `wiki/notes/2026-08-31-smart-money-cohort-discovery-layer.md`; updated `wiki/concepts/smart-money-accumulation-cohort.md`, work queue, loop state, retrieval router, current operating map, candidates, unknowns, index catalog, log, and memory.
- Result: defined the slow smart-money cohort discovery layer as a frozen row/export contract, not a scanner or actual cohort. Minimum valid sample requires 20+ wallets/entities over a 7-14 day entry plus exit/distribution window, with selection time, source/access class, label confidence, token/liquidity context, entry and exit flows, off-ramp context where visible, delayed follower result, baselines, and quality flags.
- Decision: C-024 remains Candidate, but no public/no-key source can fill the row contract now. U-022, U-024, U-030, and U-039 remain open until measured rows exist. Next valid move is HITL approval for a tiny Nansen/Dune/Arkham export/API sample, or leave the branch Watch.
- Boundary delta: wiki/router/queue/state/log/memory/index only; no scanner, cohort, account, key, paid service, live copying, live trading, orders, scheduler or cron changes, alerts, thresholds, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion.

# 2026-09-02T00:05:00Z - liquid-crypto alert-edge refresh

- Cron refresh updated monitor/trade journal, live TA execution journal, universe, backtest, paper signals, and shadow PnL outputs. Execution-vs-alert evidence now has 253 alerts, 6 executions, and 253 paper/shadow rows; latest dashboard remains low-sample/unproven (overall 205 paper rows, 0.1561 avgR, 43.88% winrate; qualified A/B/C 23 rows, 0.1871 avgR, 47.37% winrate). Shadow PnL ledger is still `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies added no candidate (`watch_or_kill_low_sample` / `watch_low_sample`). No high-probability label justified.
- 2026-09-02T04:03Z cron refresh: monitor/trade journal and BTC/ETH alert-edge outputs refreshed; paper dashboard ticked up to 207 total / 197 closed, 0.1644 avgR, 44.16% winrate, with qualified A/B/C at 23 total / 20 closed, 0.2677 avgR, 50.00% winrate, but still low-sample/unproven. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, -1530 USD gross); wick and aggtrades studies stayed low-sample with no candidate added. No notify/no live change.
- 2026-09-02T16:03Z cron refresh: monitor/trade journal and BTC/ETH alert-edge outputs refreshed; paper dashboard improved to 209 total / 201 closed, 0.1831 avgR, 44.78% winrate, with qualified A/B/C at 23 total / 22 closed, 0.4070 avgR, 54.55% winrate, but sample remains too small for a high-probability label. Latest candidates: ETH 4h range_breakdown_short low-sample (n=34, expectancy 0.0553R, PF 1.0933) and XRP 4h avoid (n=44, expectancy -0.4226R, PF 0.4590). Shadow ledger remains `shadow_negative_or_unproven` (69 fills, -1530 USD gross); wick and aggtrades studies stayed low-sample with no candidate added. No notify/no live change.
- 2026-09-02T20:03Z cron refresh: execution-vs-alert evidence updated to 253 alerts, 8 executions, and 253 paper/shadow rows; paper dashboard is 209 total / 202 closed, 0.1853 avgR, 45.05% winrate, with qualified A/B/C still 23 total / 22 closed, 0.4070 avgR, 54.55% winrate. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, -1530 USD gross); wick and aggtrades studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-03T00:04Z cron refresh: monitor/trade journal and BTC/ETH alert-edge outputs refreshed; one paper row closed, moving dashboard to 209 total / 203 closed, 0.1795 avgR, 44.83% winrate, with qualified A/B/C now fully closed at 23 rows, 0.3458 avgR, 52.17% winrate. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, -1530 USD gross); wick and aggtrades studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-03T04:03Z cron refresh: monitor/trade journal and BTC/ETH alert-edge outputs refreshed; paper dashboard moved to 214 total / 207 closed, 0.1567 avgR, 43.96% winrate, with qualified A/B/C fully closed at 24 rows, 0.2898 avgR, 50.00% winrate. This is a mild regression from the prior refresh and still too low-sample for a high-probability label. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, -1530 USD gross); wick and aggtrades studies stayed low-sample with no candidate added. No notify/no live change.
- 2026-09-03T16:03Z cron refresh: monitor/trade journal and BTC/ETH alert-edge outputs refreshed; execution-vs-alert evidence now has 255 alerts, 9 executions, and 255 paper/shadow rows. Paper dashboard expanded to 224 total / 213 closed, 0.1373 avgR, 43.19% winrate, with qualified A/B/C unchanged at 24 closed, 0.2898 avgR, 50.00% winrate; the broader paper set mildly regressed and remains low-sample/unproven. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, -1530 USD gross); wick and aggtrades studies stayed low-sample with no candidate added. No notify/no live change.
- 2026-09-03T20:03Z cron refresh: monitor/trade journal and BTC/ETH alert-edge outputs refreshed; execution-vs-alert evidence now has 256 alerts, 9 executions, and 256 paper/shadow rows. Paper dashboard expanded to 230 total / 213 closed, 0.1373 avgR, 43.19% winrate, with qualified A/B/C unchanged at 24 closed, 0.2898 avgR, 50.00% winrate; no closed-outcome improvement yet, and high-probability remains unjustified. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, -1530 USD gross); wick and aggtrades studies stayed low-sample with no candidate added. No notify/no live change.
- 2026-09-04T00:04Z cron refresh: monitor/trade journal and BTC/ETH alert-edge outputs refreshed; execution-vs-alert evidence now has 258 alerts, 13 executions, and 258 paper/shadow rows. Paper dashboard expanded to 237 total / 214 closed, 0.1319 avgR, 42.99% winrate, with qualified A/B/C fully closed at 24 rows, 0.2898 avgR, 50.00% winrate; broader paper results mildly regressed and remain low-sample/unproven. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-04T04:03Z cron refresh: monitor/trade journal and BTC/ETH alert-edge outputs refreshed; paper dashboard closed 3 more rows and regressed to 237 total / 217 closed, 0.1163 avgR, 42.40% winrate, with qualified A/B/C unchanged at 24 closed, 0.2898 avgR, 50.00% winrate. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-04T08:03Z cron refresh: execution-vs-alert evidence updated to 258 alerts, 14 executions, and 258 paper/shadow rows; paper dashboard closed 1 more row and regressed slightly to 237 total / 218 closed, 0.1112 avgR, 42.20% winrate, with qualified A/B/C unchanged at 24 closed, 0.2898 avgR, 50.00% winrate. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-04T12:04Z cron refresh: execution-vs-alert evidence updated to 258 alerts, 18 executions, and 258 paper/shadow rows; paper dashboard closed 1 more row and regressed slightly to 238 total / 219 closed, 0.1061 avgR, 42.01% winrate, with qualified A/B/C unchanged at 24 closed, 0.2898 avgR, 50.00% winrate. Latest detected setup is LINK 4h range_breakout_long, low-sample with negative expectancy (-0.016R). Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-04T16:03Z cron refresh: execution-vs-alert evidence updated to 269 alerts, 20 executions, and 269 paper/shadow rows; paper dashboard closed 14 rows and regressed to 239 total / 233 closed, 0.0637 avgR, 40.34% winrate, with qualified A/B/C unchanged at 24 closed, 0.2898 avgR, 50.00% winrate. Latest LINK candidates now include 4h momentum_reversal_short (n=20, 0.3651R expectancy, PF 1.7575) and 4h range_breakout_long (n=16, -0.0159R expectancy, PF 0.9761), both low-sample only. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-05T08:04Z cron refresh: monitor/trade journal and alert-edge outputs refreshed; paper dashboard expanded to 247 total / 234 closed, 0.0591 avgR, 40.17% winrate, with qualified A/B/C unchanged at 24 closed, 0.2898 avgR, 50.00% winrate. Latest candidates include BNB 4h range_breakout_long as avoid plus low-sample XRP 4h momentum_reversal_short (n=18, 0.7356R expectancy, PF 3.0681); no high-probability label justified. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No notify/no live change.
- 2026-09-08T08:05Z cron refresh: monitor/trade journal and alert-edge outputs refreshed; execution-vs-alert evidence now has 273 alerts, 20 executions, and 273 paper/shadow rows. Paper dashboard expanded to 260 total / 256 closed, 0.0612 avgR, 40.63% winrate, with qualified A/B/C at 25 total / 24 closed, 0.2898 avgR, 50.00% winrate; still low-sample/unproven, no high-probability label. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No notify/no live change.

- 2026-09-08T11:46Z - RALPH planned-level post-entry autoresearch scan: created wiki/notes/2026-09-08-planned-level-post-entry-autoresearch-scan.md, linked it from planned-level protocol and Filip strategy lane, and bridge-ingested/search-verified it. Decision: T1 Watch prior-art support for no-key post-entry microstructure replay adapter; hftbacktest is benchmark/reference only, public Binance/Bybit endpoints verified, ATAS labels external/export-needed, X/Reddit weak/manual sources only; no live/order/key/API/scheduler/alert/sizing/execution changes.
- 2026-09-08T16:03Z cron refresh: execution-vs-alert evidence updated to 275 alerts, 20 executions, and 275 paper/shadow rows; paper dashboard improved to 268 total / 258 closed, 0.0747 avgR, 41.09% winrate, with qualified A/B/C at 26 total / 24 closed, 0.2898 avgR, 50.00% winrate. Latest detected includes an open XRP 4h range_breakout_long B setup (historical n=41, 0.438R expectancy, PF 1.89), but forward sample remains too small for a high-probability label. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No notify/no live change.
- 2026-09-08T20:03Z cron refresh: execution-vs-alert evidence refreshed with 275 alerts, 20 executions, and 275 paper/shadow rows; paper dashboard closed 2 more rows and slipped to 268 total / 260 closed, 0.0664 avgR, 40.77% winrate, while qualified A/B/C stayed 26 total / 24 closed, 0.2898 avgR, 50.00% winrate. XRP 4h range_breakout_long remains an open B setup, but forward sample is still too small for a high-probability label. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No notify/no live change.
- 2026-09-09T08:04Z cron refresh: execution-vs-alert evidence updated to 275 alerts, 21 executions, and 275 paper/shadow rows; paper dashboard expanded to 277 total / 266 closed, 0.0634 avgR, 40.60% winrate, while qualified A/B/C moved to 26 total / 25 closed, 0.2382 avgR, 48.00% winrate. Qualified forward evidence mildly regressed and remains low-sample/unproven. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-09T16:03Z cron refresh: execution-vs-alert evidence updated to 278 alerts, 21 executions, and 278 paper/shadow rows; paper dashboard closed 6 more rows and regressed to 277 total / 272 closed, 0.0400 avgR, 39.71% winrate, while qualified A/B/C fully closed at 26 rows, 0.1906 avgR, 46.15% winrate. Latest candidates are low-sample ETH/DOGE/ADA/LINK pullback or reversal rows plus BNB 1h avoid; no high-probability label justified. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No notify/no live change.
- 2026-09-09T20:03Z cron refresh: execution-vs-alert evidence updated to 279 alerts, 22 executions, and 279 paper/shadow rows; paper dashboard unchanged at 277 total / 272 closed, 0.0400 avgR, 39.71% winrate, while qualified A/B/C remains fully closed at 26 rows, 0.1906 avgR, 46.15% winrate. Latest detected setups are ADA 1h short trend_pullback_reject_short low-sample/negative and BNB 1h long trend_pullback_reclaim_long avoid; no high-probability label justified. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No notify/no live change.
- 2026-09-10T00:04Z cron refresh: execution-vs-alert evidence updated to 280 alerts, 23 executions, and 280 paper/shadow rows; paper dashboard closed 3 more rows and regressed to 279 total / 275 closed, 0.0286 avgR, 39.27% winrate, while qualified A/B/C remains fully closed at 26 rows, 0.1906 avgR, 46.15% winrate. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-10T04:04Z cron refresh: execution-vs-alert evidence still has 280 alerts, 23 executions, and 280 paper/shadow rows; paper dashboard expanded to 294 total / 281 closed and regressed to 0.0166 avgR, 38.79% winrate, while qualified A/B/C is 27 closed, 0.1465 avgR, 44.44% winrate. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
# 2026-09-10T07:30:00Z - strategy-filter deflated-Sharpe sensitivity audit

- Loop: `ralph-autoresearch-loop`.
- Item: `validation.strategy-filter-deflated-sharpe-sensitivity-audit`.
- Output: `wiki/notes/2026-09-10-strategy-filter-deflated-sharpe-sensitivity-audit.md`; updated `automation/retrieval-router.yaml` and `automation/loop-state.yaml`.
- Verification: local Node statistics over `experiments/strategy-destruction-filter/results/filter-report.json`; no web/source checks used.
- Verdict: approximate deflated Sharpe is not the weak link. Current `trialCount=131` yields 25/131 deflated-Sharpe passers; all six raw AVAX survivors remain above the gate under harsher hypothetical trial counts through 10000, but rejected HYPE funding/fade variants also pass deflated Sharpe while failing OOS, drawdown, failure-slice, or walk-forward gates. Keep deflated Sharpe as a rejection gate, not a promotion signal.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, or strategy promotion changed.
- Notification: none; no Telegram gate met.
- 2026-09-10T16:03Z cron refresh: execution-vs-alert evidence updated to 280 alerts, 28 executions, and 280 paper/shadow rows; paper dashboard expanded to 302 total / 285 closed and regressed to 0.0023 avgR, 38.25% winrate, while qualified A/B/C is 28 total / 27 closed, 0.1465 avgR, 44.44% winrate, with one open C BTC 4h range_breakdown_short. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-10T20:03Z cron refresh: execution-vs-alert evidence updated to 281 alerts, 28 executions, and 281 paper/shadow rows; paper dashboard expanded to 304 total / 285 closed, still 0.0023 avgR and 38.25% winrate, while qualified A/B/C remains 28 total / 27 closed, 0.1465 avgR, 44.44% winrate, with one open qualified row. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-11T08:04Z cron refresh: execution-vs-alert evidence updated to 282 alerts, 29 executions, and 282 paper/shadow rows; paper dashboard expanded to 311 total / 293 closed and crossed negative to -0.0025 avgR, 37.88% winrate, while qualified A/B/C stayed 28 total / 27 closed, 0.1465 avgR, 44.44% winrate with one open row. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-11T12:03Z cron refresh: execution-vs-alert evidence remains 282 alerts, 29 executions, and 282 paper/shadow rows; one paper row closed, moving dashboard to 312 total / 294 closed, -0.0059 avgR, 37.76% winrate, while qualified A/B/C stays 28 total / 27 closed, 0.1465 avgR, 44.44% winrate with one open row. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-11T16:04Z cron refresh: execution-vs-alert evidence updated to 284 alerts, 30 executions, and 284 paper/shadow rows; dashboard expanded to 314 total / 306 closed and degraded to -0.0174 avgR, 37.25% winrate, while qualified A/B/C fully closed at 28 rows, 0.1055 avgR, 42.86% winrate. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-11T20:05Z cron refresh: execution-vs-alert evidence updated to 289 alerts, 30 executions, and 289 paper/shadow rows; paper dashboard stayed 314 total / 306 closed, -0.0174 avgR, 37.25% winrate, while qualified A/B/C stayed fully closed at 28 rows, 0.1055 avgR, 42.86% winrate. Latest setups are ETH/AVAX/ADA 4h low-sample plus ETH 1h avoid shorts; no high-probability label justified. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample with no candidate added. No notify/no live change.
- 2026-09-12T04:04Z cron refresh: execution-vs-alert evidence stayed at 289 alerts, 30 executions, and 289 paper/shadow rows; paper dashboard closed 3 more rows and regressed to 317 total / 309 closed, -0.0270 avgR, 36.89% winrate, while qualified A/B/C remains fully closed at 28 rows, 0.1055 avgR, 42.86% winrate. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample/watch with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-12T12:04Z cron refresh: execution-vs-alert evidence stayed at 289 alerts, 30 executions, and 289 paper/shadow rows; paper dashboard closed 1 more row and slipped to 317 total / 310 closed, -0.0285 avgR, 36.77% winrate, while qualified A/B/C remains fully closed at 28 rows, 0.1055 avgR, 42.86% winrate. Latest detections are XRP/DOGE/LINK 1h trend_pullback_reject_short low-sample rows, with only LINK positive but n=33. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample/watch with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-12T16:03Z cron refresh: execution-vs-alert evidence stayed at 289 alerts, 30 executions, and 289 paper/shadow rows; paper dashboard closed 1 more row and slipped to 318 total / 311 closed, -0.0284 avgR, 36.66% winrate, while qualified A/B/C remains fully closed at 28 rows, 0.1055 avgR, 42.86% winrate. Shadow ledger remains `shadow_negative_or_unproven` (69 fills, 24 targets, 24 stops, 21 ambiguous stop-first, -1530 USD gross); wick and aggtrades velocity studies stayed low-sample/watch with no candidate added. No high-probability label, no notify/no live change.
- 2026-09-12T16:10Z autonomy upgrade: Tomas approved "Do everything" for mostly no-HITL RALPH operation. Implemented research/paper autonomy changes only: added `automation/state-of-edge-report.mjs`, generated `outputs/state-of-edge-report.*` with verdict `no_trade_watch_low_sample`, changed `ralph-autoresearch-loop` live cron cadence to daily 09:30 Europe/Prague, added live cron `ralph-state-of-edge-daily` at daily 19:15 Europe/Prague and manually verified it completed `NO_TELEGRAM_UPDATE`, wired the 4h alert-edge refresh prompt to run state-of-edge, repaired stale `index.yaml` wiki count 185 -> 192, and reran `research-validation-checklist` to retrieval pass / overall warn because paperDemo remains not-ready. Boundary: no live orders, exchange mutation, keys, paid APIs, public posting, alert wording, thresholds, risk/sizing/TP/SL, or execution behavior changed.

# 2026-09-12T16:10:35Z - weekly maintenance check

- Trigger: isolated `ralph-weekly-maintenance` cron run.
- Context: `session_status` showed context 0%, compactions 0, usage available; no handoff needed.
- Verification: local validation checklist passed retrieval/pathRefs/queues/delivery/HITL/loop/handoff/boundary checks with overall `warn` only because cron health still needs live-state verification; YAML parsed for `index.yaml`, `automation/loop-registry.yaml`, `automation/loop-state.yaml`, `automation/retrieval-router.yaml`, and `automation/work-queues.yaml`; JSON parsed for `graph/decision-graph.json` and current output JSONs; Node syntax checks passed for the maintenance scripts.
- Output refresh: regenerated `outputs/research-validation-checklist.*` and `outputs/evidence-ledger-prioritizer.*`. Prioritizer now sees 1 pending/ready route, `investigation.filip-pdv-pdn-cluster-strategy-development`, with 2 threshold-watch items and 4 watch gates.
- Cron health: OpenClaw cron is enabled. Visible `ralph-weekly-maintenance` state still reports `consecutiveErrors: 4`, all prior `rate_limit` failures, with delivery not requested. This run did not mutate the scheduler; a successful completion should clear or supersede the stale error state on the next status read.
- Follow-up live cron verification after completion: `ralph-weekly-maintenance` now reports `lastStatus: ok`, `consecutiveErrors: 0`, and next run `2026-09-13T16:00:00Z`; it still has a non-fatal diagnostic warning from a failed Ruby check.
- Boundary delta: outputs/log/memory only; no strategy branch, scheduler change, cron mutation, live trading, accounts/keys, paid services, demo/testnet setup, alert wording, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion.

# 2026-09-12T16:17:39Z - strategy-filter OOS baseline-lift audit

- Loop: `ralph-autoresearch-loop`.
- Item: `validation.strategy-filter-oos-baseline-lift-audit`.
- Output: `wiki/notes/2026-09-12-strategy-filter-oos-baseline-lift-audit.md`; updated `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, and `automation/loop-state.yaml`.
- Verification: local Node statistics over `experiments/strategy-destruction-filter/results/filter-report.json`; no web/source checks used.
- Verdict: OOS and walk-forward gates are doing most of the useful destruction work. 17 variants pass deflated Sharpe but fail OOS sample or expectancy; 15 rejected variants have positive expectancy and pass profit-factor plus deflated Sharpe while still failing OOS, drawdown, failure-slice, low-sample, or walk-forward gates. Weak spot: `alert-edge-avax-range-breakdown-short-v0#3/#4` survives current full-sample baseline-lift gates despite negative OOS baseline lift (`-0.1171R`) and one negative walk-forward fold. Treat that duplicated AVAX shape as fragile/watch-only; future reporting should surface or gate positive OOS baseline lift before calling a survivor strong.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.
- Notification: none; no Telegram gate met.

# 2026-09-12T16:25:00Z - strategy-filter OOS baseline-lift gate design

- Loop: `ralph-autoresearch-loop`.
- Item: `validation.strategy-filter-oos-baseline-lift-gate-design`.
- Output: `wiki/notes/2026-09-12-strategy-filter-oos-baseline-lift-gate-design.md`; updated `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, and `automation/loop-state.yaml`; bridge source `source.ralph-strategy-filter-oos-baseline-lift-gate-design`.
- Verification: local Node counterfactual statistics over `experiments/strategy-destruction-filter/results/filter-report.json`; no web/source checks used.
- Verdict: adding a hard `weak_out_of_sample_baseline_lift` gate at the existing `minBaselineExpectancyLiftR` floor (`0.01R`) would reduce current survivors from 6 raw / 3 unique metric shapes to 4 raw / 2 unique metric shapes by rejecting only the duplicated fragile AVAX #3/#4 shape. The proposed gate complements rather than replaces the current suite: 37 already-rejected variants pass OOS baseline lift while still failing OOS expectancy, drawdown, failure-slice, low-sample, or walk-forward checks.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.
- Notification: none; no Telegram gate met.

# 2026-09-12T16:49:00Z - autoresearch run verification and index count repair

- Trigger: Tomas continued from `continuation-prompts/2026-09-12-1628-ralph-autonomy-upgrade-handoff.md` and required live cron verification before trusting old session memory.
- Verification: `session_status` showed context 0% and compactions 0; cron `get` and `runs` verified manual run `manual:195477c4-ebd4-43e1-96f7-33d1f4cfd10d:1789230307401:4` finished `ok` with `NO_TELEGRAM_UPDATE`, next run `2026-09-13T07:30:00Z`, and only a non-fatal Ruby diagnostic warning.
- Result: inspected recent files, bridge-search verified `source.ralph-strategy-filter-oos-baseline-lift-gate-design`, updated daily memory, and repaired `index.yaml`/`index.md` from 193 to actual 194 wiki pages.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-12T16:55:00Z - strategy-filter OOS baseline-lift gate implementation

- Trigger: continued the approved RALPH research/paper autonomy upgrade after cron verification; the 16:25 design note identified `weak_out_of_sample_baseline_lift` as a small local hardening pass.
- Output: updated `experiments/strategy-destruction-filter/src/engine.mjs`, `src/verify-filter.mjs`, `src/run-filter.mjs`, and `test/engine.test.mjs`; regenerated `results/filter-report.json`, `results/filter-report.md`, `results/survivors.json`, and `results/rejected-ideas.jsonl`; refreshed state-of-edge, checklist, and prioritizer outputs; added `wiki/notes/2026-09-12-strategy-filter-oos-baseline-lift-gate-implementation.md`; bridge source `source.ralph-strategy-filter-oos-baseline-lift-gate-implementation`; updated router/queue/state/log/memory/index.
- Verification: `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed 29 tests; `node --check` passed for edited scripts; `npm run filter` passed; `npm run verify` passed with 2 survivors / 129 rejected; `state-of-edge-report` passed with `no_trade_watch_low_sample`; `research-validation-checklist` remains expected `warn`; `evidence-ledger-prioritizer` passed; OpenClaw wiki ingest/search verified the bridge source.
- Result: strategy filter now rejects non-finite or below-floor `baseline.comparison.outOfSampleExpectancyLiftR` using the existing `minBaselineExpectancyLiftR` (`0.01R`). Fresh report has 13 candidates / 131 variants / 2 raw survivors / 129 rejected. Surviving raw variants are `alert-edge-avax-range-breakdown-short-v0#1` and `#2`, one duplicate metric/signal shape with OOS baseline lift `0.125R`. AVAX remains Watch / forward-paper-needed because exact regime-tagged forward-paper rows are still `0/20`.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, watcher behavior, public posting, data capture, or strategy promotion changed.

# 2026-09-12T18:40:00Z - planned-level proxy replay scaffold

- Trigger: Tomas said to continue the workflow after the strategy-filter hardening; current next ready route was `investigation.filip-pdv-pdn-cluster-strategy-development`.
- Output: added `experiments/strategy-destruction-filter/src/run-planned-level-proxy-replay.mjs`, npm script `study:planned-level-proxy`, outputs `results/planned-level-proxy-replay.json` and `.md`, verifier coverage in `src/verify-filter.mjs`, note `wiki/notes/2026-09-12-planned-level-proxy-replay-scaffold.md`, bridge source `source.ralph-planned-level-proxy-replay-scaffold`, and router/queue/state/log/memory/index updates.
- Verification: `node --check` passed for the new script; default no-fetch run passed with 8 frozen BTC planned-level rows; explicit bounded public/no-key run with `PLANNED_LEVEL_PROXY_FETCH=1 PLANNED_LEVEL_PROXY_MAX_EVENTS=8 PLANNED_LEVEL_PROXY_MAX_FETCH_EVENTS=2 PLANNED_LEVEL_PROXY_MAX_PAGES=2` passed with 2 fetched BTCUSDT `aggTrades` windows and 0 fetch failures; `npm test` passed 29 tests; `npm run verify` passed; OpenClaw wiki ingest/search verified the bridge source; research-validation checklist remains expected `warn`.
- Result: the scaffold proves a BTC-gated public/no-key row schema and trade-window access path for planned-level post-entry monitoring. Verdict is `schema_ready_trade_windows_low_sample`, not candidate-ready. Moved the broad Filip branch out of ready-now into Watch item `filip-planned-level-proxy-replay-row-threshold` until there are 20 frozen planned-level events and 10 fetched public trade windows.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, watcher behavior, recurring data capture, public posting, or strategy promotion changed.

# 2026-09-13T04:04:00Z - alert-edge refresh verdict degraded negative

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict is `no_trade_negative_edge`; paper overall 315 closed at -0.0300R / 36.51% winrate, qualified A/B/C 28 closed at +0.1055R / 42.86%, shadow PnL 69 filled at -1530 USD gross / 34.78% winrate. Candidate actions remain watch/kill-or-avoid only; no high-probability label justified.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-13T07:30:00Z - strategy-filter OOS shrinkage audit

- Loop: `ralph-autoresearch-loop`.
- Item: `validation.strategy-filter-oos-shrinkage-audit`.
- Output: `wiki/notes/2026-09-13-strategy-filter-oos-shrinkage-audit.md`; updated `automation/retrieval-router.yaml` and `automation/loop-state.yaml`; bridge source `source.ralph-strategy-filter-oos-shrinkage-audit`.
- Verification: local Node statistics over `experiments/strategy-destruction-filter/results/filter-report.json`; YAML parse passed for router/state/queues; OpenClaw wiki ingest/search verified the bridge source; no web/source checks used.
- Verdict: current report remains 13 candidates / 131 variants / 2 raw survivors / 1 effective survivor shape / 129 rejected. Of 21 headline passers by expectancy, profit factor, and deflated-Sharpe, 13 still fail at least one OOS gate. The sole effective survivor shape is still AVAX 1h `range_breakdown_short` down/low-vol; it passes OOS and baseline-lift gates but OOS expectancy (`0.0927R`) is only `38.5%` of in-sample expectancy (`0.2407R`), so future survivor reporting should surface OOS shrinkage and AVAX remains Watch / forward-paper-needed.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, watcher behavior, public posting, data capture, or strategy promotion changed.
- Notification: none; no Telegram gate met.

# 2026-09-13T16:05:00Z - weekly maintenance index and queue mirror repair

- Trigger: isolated `ralph-weekly-maintenance` cron run.
- Context: `session_status` showed context 0%, compactions 0, usage healthy; no handoff needed.
- Verification: explicit YAML parse passed for `index.yaml`, `automation/retrieval-router.yaml`, `automation/work-queues.yaml`, `automation/loop-state.yaml`, and `automation/loop-registry.yaml`; JSON parse passed for `outputs/evidence-ledger-prioritizer.json`, `outputs/research-validation-checklist.json`, and `graph/decision-graph.json`; Node syntax checks passed for the maintenance scripts.
- Repairs: fixed `index.yaml` `total_wiki_pages` from 198 to actual 199 and corrected the stale `automation/work-queues.yaml` autoresearch cadence mirror from Monday/Thursday to daily 09:30 Europe/Prague.
- Output refresh: regenerated `outputs/research-validation-checklist.*` and `outputs/evidence-ledger-prioritizer.*`. Checklist is now overall `warn` with retrieval/pathRefs/queues passing; remaining warning is cron-reporting/paper-demo readiness. Prioritizer reports 0 pending, 0 ready-now, 2 threshold-watch, and 0 needs-wheel-gate.
- Cron health: OpenClaw scheduler is enabled. Live `get` for the current maintenance job shows the previous completed run as `lastStatus: ok`, `consecutiveErrors: 0`, delivery not requested, and only a non-fatal prior diagnostic warning while this run is in progress; local mirror still shows 0 consecutive errors for RALPH cron lanes.
- Boundary: outputs/index/queue/log/memory only; no strategy branch, scheduler mutation, live trading, accounts/keys, paid services, demo/testnet setup, alert wording, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, public posting, or strategy promotion changed.
- Notification: none; no Telegram gate met.

# 2026-09-14T07:30:00Z - strategy-filter deflated-Sharpe source calibration

- Loop: `ralph-autoresearch-loop`.
- Item: `validation.strategy-filter-deflated-sharpe-source-calibration`.
- Output: `wiki/notes/2026-09-14-strategy-filter-deflated-sharpe-source-calibration.md`; updated `automation/retrieval-router.yaml` and `automation/loop-state.yaml`; bridge source `source.ralph-strategy-filter-deflated-sharpe-source-calibration`.
- Source check: Bailey/López de Prado, "The Deflated Sharpe Ratio: Correcting for Selection Bias, Backtest Overfitting and Non-Normality", `https://www.davidhbailey.com/dhbpapers/deflated-sharpe.pdf`.
- Verification: local Node statistics over `experiments/strategy-destruction-filter/results/filter-report.json`; checked `src/engine.mjs` formula and labels; YAML parse passed for router/state/queues; OpenClaw wiki ingest/search verified the bridge source.
- Verdict: RALPH's current `deflatedSharpe` is correctly labeled as an approximate multiple-testing proxy, not full DSR. It remains useful as a rejection gate, but not as promotion evidence: 25/131 variants pass the deflated-Sharpe floor, and 23 rejected variants pass it while failing chronology, baseline, drawdown, failure-slice, or walk-forward gates. Full DSR reporting should stay proposed/watch until the filter freezes per-variant return series and can estimate effective independent-trial count.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, watcher behavior, public posting, data capture, or strategy promotion changed.
- Notification: none; no Telegram gate met.

# 2026-09-14T08:05:00Z - alert-edge refresh remains negative, paper quality regressed

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict remains `no_trade_negative_edge`; paper overall is now 328 closed at -0.0600R / 35.37% winrate, qualified A/B/C 30 closed at +0.0318R / 40.00%, and shadow PnL 69 filled at -1530 USD gross / 34.78% winrate. The qualified edge weakened versus the prior logged +0.1055R / 42.86%, so no high-probability label is justified.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-14T12:05:00Z - alert-edge refresh remains negative, qualified paper crossed negative

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict remains `no_trade_negative_edge`; paper overall is now 329 closed at -0.0628R / 35.26% winrate, qualified A/B/C 31 closed at -0.0015R / 38.71%, and shadow PnL 69 filled at -1530 USD gross / 34.78% winrate. Qualified paper crossed from slightly positive to slightly negative versus the prior logged refresh, so no high-probability label is justified.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-14T20:05:00Z - alert-edge verdict softened to watch low-sample, still no trade

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict changed to `no_trade_watch_low_sample`; paper overall is now 330 closed at -0.0638R / 35.15% winrate, qualified A/B/C remains 31 closed at -0.0015R / 38.71%, and shadow PnL remains 69 filled at -1530 USD gross / 34.78% winrate. ETH 4h `trend_pullback_reclaim_long` is watch-only at n=29 / +0.1651R / PF 1.2799, below proof threshold, so no high-probability label is justified.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-15T04:05:00Z - alert-edge watch verdict persists, overall paper regressed

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict remains `no_trade_watch_low_sample`; paper overall is now 346 closed at -0.0909R / 34.10% winrate, qualified A/B/C remains 31 closed at -0.0015R / 38.71%, and shadow PnL remains 69 filled at -1530 USD gross / 34.78% winrate. Overall paper regressed versus the prior logged -0.0638R / 35.15%, and ETH 4h `trend_pullback_reclaim_long` remains watch-only at n=29 / +0.1651R / PF 1.2799, below proof threshold.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.
## 2026-09-15T07:30:00Z - RALPH autoresearch: strategy-filter chronology gate overlap audit

- Item: `validation.strategy-filter-chronology-gate-overlap-audit`.
- Output: `wiki/notes/2026-09-15-strategy-filter-chronology-gate-overlap-audit.md`; bridge source `source.ralph-strategy-filter-chronology-gate-overlap-audit`.
- Stats: current `filter-report.json` still has 13 candidates / 131 variants / 2 raw survivors / 1 effective survivor shape / 129 rejected. 21 variants pass headline expectancy/profit-factor/deflated-Sharpe; only 2 survive; all 19 rejected headline passers fail at least one chronology gate. 21 variants pass both OOS expectancy and OOS baseline lift, but 19 of those are still rejected by other gates.
- Verification: `npm run verify --prefix /home/coder/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter` passed with `ok=true`, `variants=131`, `survivors=2`, `rejected=129`, `accessibleDataRails=7`.
- Decision: keep hard OOS and walk-forward chronology gates strict; no harness change in this micro-run. AVAX remains Watch / forward-paper-needed, not promoted.
- Boundary: no strategy promotion, alert change, scheduler change, data capture, account/key/API access, paid service, execution, or public posting. Notification gate not met.

# 2026-09-15T08:04:00Z - alert-edge verdict worsened to no-trade negative edge

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict changed from `no_trade_watch_low_sample` to `no_trade_negative_edge`; paper overall remains 346 closed at -0.0909R / 34.10% winrate, qualified A/B/C remains 31 closed at -0.0015R / 38.71%, and shadow PnL remains 69 filled at -1530 USD gross / 34.78% winrate. Current candidate actions are all `kill_or_avoid`; no high-probability label is justified.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-15T16:05:00Z - alert-edge returns to watch-only low-sample state

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict changed from `no_trade_negative_edge` to `no_trade_watch_low_sample`; paper overall is 348 closed at -0.0881R / 34.20% winrate, qualified A/B/C improved to 32 closed at +0.0548R / 40.63%, and shadow PnL remains 69 filled at -1530 USD gross / 34.78% winrate. Only current non-kill action is ETH 4h `range_breakdown_short` at n=16 / +0.4232R / PF 1.9457, so it is watch-only and not high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-15T20:05:00Z - alert-edge stays watch-only; XRP joins low-sample watch set

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict remains `no_trade_watch_low_sample`; paper overall is 353 closed at -0.0614R / 35.13% winrate, qualified A/B/C remains 32 closed at +0.0548R / 40.63%, and shadow PnL remains 69 filled at -1530 USD gross / 34.78% winrate. Current non-kill actions are ETH 4h `range_breakdown_short` at n=16 / +0.4232R / PF 1.9457 and XRP 4h `range_breakdown_short` at n=20 / +0.1153R / PF 1.1946, both watch-only low-sample rows, not high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.
# 2026-09-16T07:30:00Z - RALPH autoresearch: strategy-filter PSR diagnostic overlap audit

- Item: `validation.strategy-filter-psr-diagnostic-overlap-audit`.
- Output: `wiki/notes/2026-09-16-strategy-filter-psr-diagnostic-overlap-audit.md`; bridge source `source.ralph-strategy-filter-psr-diagnostic-overlap-audit`.
- Stats: current `filter-report.json` still has 13 candidates / 131 variants / 2 raw survivors / 1 effective survivor shape / 129 rejected. PSR-style diagnostic passers: 40/131 at >=0.95, 34/131 at >=0.975, and 25/131 at >=0.99. At >=0.95, 38/40 passers are still rejected and 20/40 fail the existing deflated-Sharpe floor. At >=0.99, the arbitrary cut would reject both current AVAX raw survivors despite no source-backed threshold calibration.
- Verification: `npm run verify --prefix /home/coder/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter` passed with `ok=true`, `variants=131`, `survivors=2`, `rejected=129`, `accessibleDataRails=7`.
- Decision: keep PSR-style probability diagnostic-only; do not promote it to a hard survival gate. Next useful harness improvement is reproducible gate-group pass reporting, not another threshold. AVAX remains Watch / forward-paper-needed, not promoted.
- Boundary: no strategy promotion, alert change, scheduler change, data capture, account/key/API access, paid service, execution, or public posting. Notification gate not met.

# 2026-09-16T08:05:00Z - alert-edge stays watch-only; candidate set rotates

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict remains `no_trade_watch_low_sample`; paper overall is 353 closed at -0.0614R / 35.13% winrate, qualified A/B/C remains 32 closed at +0.0548R / 40.63%, and shadow PnL remains 69 filled at -1530 USD gross / 34.78% winrate. Candidate actions now show BNB 1h `trend_pullback_reject_short` as `kill_or_avoid` at n=86 / -0.3238R / PF 0.6055, while XRP 4h `range_breakdown_short` remains watch-only at n=20 / +0.1153R / PF 1.1946; no high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-16T12:05:00Z - alert-edge reverts to no-trade negative edge

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict changed from `no_trade_watch_low_sample` to `no_trade_negative_edge`; paper overall is 354 closed at -0.0561R / 35.31% winrate, qualified A/B/C remains 32 closed at +0.0548R / 40.63%, and shadow PnL remains 69 filled at -1530 USD gross / 34.78% winrate. Only current candidate action is BNB 1h `trend_pullback_reject_short` as `kill_or_avoid` at n=86 / -0.3238R / PF 0.6055; no high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-16T16:05:00Z - alert-edge returns to watch-low-sample

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict changed from `no_trade_negative_edge` to `no_trade_watch_low_sample`; paper overall is 354 closed at -0.0561R / 35.31% winrate, qualified A/B/C remains 32 closed at +0.0548R / 40.63%, and shadow PnL remains 69 filled at -1530 USD gross / 34.78% winrate. Candidate actions now show ADA 4h `range_breakdown_short` as `watch_low_sample` at n=36 / +0.2725R / PF 1.5802, while BNB 1h `trend_pullback_reject_short` remains `kill_or_avoid` at n=85 / -0.3141R / PF 0.6156; no high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-17T04:05:00Z - alert-edge reverts to no-trade negative edge

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict changed from `no_trade_watch_low_sample` to `no_trade_negative_edge`; paper overall is 360 closed at -0.0711R / 34.72% winrate, qualified A/B/C is 33 closed at +0.0229R / 39.39%, and shadow PnL remains 69 filled at -1530 USD gross / 34.78% winrate. Current candidate actions are all `kill_or_avoid`; no high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-17T07:45:00Z - RALPH autoresearch: strategy-filter gate-group reporting

- Item: `validation.strategy-filter-gate-group-reporting`.
- Output: `wiki/notes/2026-09-17-strategy-filter-gate-group-reporting.md`, bridge source `source.ralph-strategy-filter-gate-group-reporting`, `experiments/strategy-destruction-filter/src/run-filter.mjs`, `experiments/strategy-destruction-filter/src/verify-filter.mjs`, refreshed `experiments/strategy-destruction-filter/results/filter-report.*`, `survivors.json`, and `rejected-ideas.jsonl`.
- Stats: fresh report has 13 candidates / 131 variants / 0 raw survivors / 0 effective survivor shapes / 131 rejected. Gate group counts: `headline_pass` 12/131, `deflated_sharpe_pass` 25/131, `oos_pass` 25/131, `baseline_pass` 34/131, `walk_forward_pass` 3/131, PSR >=0.95 39/131, PSR >=0.975 34/131, PSR >=0.99 29/131.
- Decision: gate-group diagnostics are now generated and verified. The prior AVAX `range_breakdown_short` Watch survivor shape is downgraded to rejected historical shape because the duplicate top variants now fail `weak_walk_forward_out_of_sample` after the current data refresh. No strategy promotion or live surface change.
- Verification: syntax checks passed; `npm run filter --prefix ralph-research-os/experiments/strategy-destruction-filter` passed with `ok=true`, `survivors=0`, `rejected=131`; `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed with `accessibleDataRails=7`; `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed 29 tests.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-17T07:46:00Z - RALPH autoresearch: AVAX Watch downgrade reconciliation

- Item: `validation.strategy-filter-avax-watch-downgrade-reconciliation`.
- Output: `wiki/notes/2026-09-17-avax-watch-downgrade-reconciliation.md`, `decisions/discarded.md`, `automation/work-queues.yaml`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`; bridge source `source.ralph-avax-watch-downgrade-reconciliation`.
- Stats: current `filter-report.json` has 13 candidates / 131 variants / 0 raw survivors / 0 effective survivor shapes / 131 rejected. AVAX `alert-edge-avax-range-breakdown-short-v0` has 8/8 variants rejected; top duplicate variants fail `weak_walk_forward_out_of_sample` despite positive headline, OOS, baseline, and deflated-Sharpe stats.
- Decision: remove `avax-1h-range-breakdown-short-down-low-vol` from Watch and record it as discarded historical-shape memory. Reopen only after a future frozen report creates a fresh AVAX survivor shape that passes current hard gates and matching regime-tagged forward paper reaches the explicit threshold.
- Verification: local statistics check over `filter-report.json`; no code/report output changed. Bridge ingest/search verified.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-17T20:05:00Z - alert-edge returns to watch-low-sample

- Verification: scheduled paper/shadow refresh completed all monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict changed from the last logged `no_trade_negative_edge` state to `no_trade_watch_low_sample`; paper overall is 368 closed at -0.0799R / 34.24% winrate, qualified A/B/C is 33 closed at +0.0229R / 39.39%, and shadow PnL remains 69 filled at -1530 USD gross / 34.78% winrate. Current candidate action watch is BTC 4h `trend_pullback_reject_short` at n=43 / +0.1006R / PF 1.1757; all other listed actions are `kill_or_avoid`, so no high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-18T07:31:59Z - RALPH autoresearch: strategy-filter near-miss gate-pressure audit

- Item: `validation.strategy-filter-near-miss-gate-pressure-audit`.
- Output: `wiki/notes/2026-09-18-strategy-filter-near-miss-gate-pressure-audit.md`, `automation/work-queues.yaml`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`; bridge source `source.ralph-strategy-filter-near-miss-gate-pressure-audit`.
- Stats: current `filter-report.json` remains 13 candidates / 131 variants / 0 raw survivors / 0 effective survivor shapes / 131 rejected. Four variants pass headline, approximate deflated-Sharpe, OOS, and baseline gates while failing only `weak_walk_forward_out_of_sample`; all four are duplicate AVAX historical shapes. Only 3/131 variants pass the walk-forward group, and all three still fail other hard gates.
- Decision: keep hard gates unchanged. The zero-survivor state is not just one arbitrary threshold killing otherwise strong candidates; rejection pressure remains broad across walk-forward OOS, profit factor, deflated-Sharpe proxy, drawdown, expectancy, and OOS baseline lift. Next useful improvement is previous-report/drift reporting, not looser thresholds.
- Verification: local statistics check over `experiments/strategy-destruction-filter/results/filter-report.json`, reconciled against generated `Gate Group Diagnostics`; bridge ingest/search verified.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-18T08:05:11Z - alert-edge watch candidate rotated, still no-trade

- Verification: scheduled paper/shadow refresh completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict remains `no_trade_watch_low_sample`. Paper overall is 372 closed at -0.0822R / 34.14% winrate, qualified A/B/C is 34 closed at -0.0072R / 38.24%, and shadow PnL remains negative/unproven at 69 filled / -1530 USD gross / 34.78% winrate. Watch candidate rotated from the prior BTC 4h pullback-reject shape to DOGE 4h `momentum_reversal_short` at n=18 / +0.8424R / PF 3.7780; low sample, no high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-20T07:40:00Z - RALPH autoresearch: strategy-filter purged/embargo implementation scope

- Item: `validation.strategy-filter-purged-embargo-implementation-scope`.
- Output: `wiki/notes/2026-09-20-strategy-filter-purged-embargo-implementation-scope.md`, `automation/work-queues.yaml`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`; bridge source `source.ralph-strategy-filter-purged-embargo-implementation-scope`.
- Stats: current `filter-report.json` remains 13 candidates / 131 variants / 0 survivors / 0 effective survivor shapes / 131 rejected. Gate pass counts are headline 12, deflated-Sharpe proxy 25, OOS 25, baseline 34, walk-forward 3. The report has no exact split-boundary fields, so boundary impact cannot be counted directly yet; 5 of 25 OOS passers have 30 or fewer OOS trades and may lose eligibility after purging.
- Decision: next useful implementation is a small report/verifier capability for `purged_embargo_entry_time`: per-variant split metadata, boundary exclusion from candidate/baseline/walk-forward/survivor metrics, and verifier assertions. Keep thresholds unchanged; lower post-purge samples stay rejected or Watch-only.
- Verification: local statistics check over `experiments/strategy-destruction-filter/results/filter-report.json`; no web/source checks used; bridge ingest/search verified.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, data capture, risk/sizing/TP/SL, execution, public posting, code change, or strategy promotion changed.

# 2026-09-18T12:04:12Z - alert-edge watch roster expanded, still no-trade

- Verification: scheduled paper/shadow refresh completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict remains `no_trade_watch_low_sample`. Paper overall is 372 closed at -0.0822R / 34.14% winrate, qualified A/B/C is 34 closed at -0.0072R / 38.24%, and shadow PnL remains negative/unproven at 69 filled / -1530 USD gross / 34.78% winrate. Watch candidates now include SOL 4h `momentum_reversal_short` n=17 / +0.3777R / PF 1.7551, DOGE 4h `range_breakout_long` n=24 / +0.1136R / PF 1.1844, and DOGE 4h `momentum_reversal_short` n=18 / +0.8424R / PF 3.7780; all remain low-sample watch inputs, not high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-18T20:04:14Z - alert-edge watch roster contracted, still no-trade

- Verification: scheduled paper/shadow refresh completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict remains `no_trade_watch_low_sample`. Paper overall is 377 closed at -0.0796R / 34.22% winrate, qualified A/B/C is 34 closed at -0.0072R / 38.24%, and shadow PnL remains negative/unproven at 69 filled / -1530 USD gross / 34.78% winrate. Watch candidates contracted to SOL 4h `momentum_reversal_short` n=17 / +0.3777R / PF 1.7551 and DOGE 4h `range_breakout_long` n=24 / +0.1136R / PF 1.1844; the prior DOGE 4h `momentum_reversal_short` watch row is no longer listed. Still low-sample watch only, not high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-19T00:05:16Z - alert-edge watch roster expanded, still no-trade

- Verification: scheduled paper/shadow refresh completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict remains `no_trade_watch_low_sample`. Paper overall is 377 closed at -0.0796R / 34.22% winrate, qualified A/B/C is 34 closed at -0.0072R / 38.24%, and shadow PnL remains negative/unproven at 69 filled / -1530 USD gross / 34.78% winrate. Watch candidates expanded to BTC/ETH/XRP/DOGE/LINK 4h `momentum_reversal_short` plus DOGE 4h `range_breakout_long`; all are low-sample watch rows, not high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-19T04:05:18Z - alert-edge watch roster rotated, still no-trade

- Verification: scheduled paper/shadow refresh completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed.
- Result: state-of-edge verdict remains `no_trade_watch_low_sample`. Paper overall is 381 closed at -0.0598R / 34.91% winrate, qualified A/B/C is 34 closed at -0.0072R / 38.24%, and shadow PnL remains negative/unproven at 69 filled / -1530 USD gross / 34.78% winrate. Watch roster rotated to ADA 4h `range_breakout_long` plus BTC/ETH/XRP/DOGE/LINK 4h `momentum_reversal_short`; all remain low-sample watch rows, not high-probability proof.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-19T07:31:19Z - RALPH autoresearch: strategy-filter previous-report drift contract

- Item: `validation.strategy-filter-previous-report-drift-contract`.
- Output: `wiki/notes/2026-09-19-strategy-filter-previous-report-drift-contract.md`, `automation/work-queues.yaml`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`; bridge source `source.ralph-strategy-filter-previous-report-drift-contract`.
- Stats: current `filter-report.json` remains 13 candidates / 131 variants / 0 raw survivors / 0 effective survivor shapes / 131 rejected. Compared against the 2026-09-13 survivor-shape note, the important drift is 2 raw survivors / 1 effective AVAX shape -> 0 / 0; the prior AVAX shape is now a rejected historical shape rather than a Watch survivor.
- Decision: next useful implementation is a small previous-report comparison section or sidecar drift file covering generatedAt, totals, compatible gate-group counts, added/removed/status-changed effective survivor shapes, representative metrics/failures for changed shapes, and an explicit no-threshold-change statement. Keep hard gates unchanged; no candidate promotion.
- Verification: local statistics check over `experiments/strategy-destruction-filter/results/filter-report.json`, reconciled against the 2026-09-13 survivor-shape note and 2026-09-17 gate-group note; bridge ingest/search verified.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture, or strategy promotion changed.

# 2026-09-19T12:05:27Z - alert-edge watch roster rotated, still no-trade

- Verification: scheduled paper/shadow refresh completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed. State-of-edge verdict remains `no_trade_watch_low_sample`; paper overall is 385 closed at -0.0623R / 34.81% winrate, qualified A/B/C remains 34 closed at -0.0072R / 38.24%, and shadow PnL remains negative/unproven at 69 filled / -1530 USD gross / 34.78% winrate. Watch roster rotated to LINK 4h `range_breakout_long`, XRP/DOGE 4h `momentum_reversal_short`, and ADA 4h `range_breakout_long`; AVAX 4h `range_breakout_long` remains `kill_or_avoid`. All watch rows remain low-sample or weak-expectancy learning inputs, not high-probability proof. No Telegram sent; no live trading, orders, exchange mutations, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-19T08:05:20Z - alert-edge watch roster adds AVAX avoid, still no-trade

- Verification: scheduled paper/shadow refresh completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed. State-of-edge verdict remains `no_trade_watch_low_sample`; paper overall is 383 closed at -0.0647R / 34.73% winrate, qualified A/B/C remains 34 closed at -0.0072R / 38.24%, shadow PnL remains negative/unproven at 69 filled / -1530 USD gross / 34.78% winrate, and AVAX 4h `range_breakout_long` is now `kill_or_avoid` while BTC/ETH/XRP/DOGE/LINK 4h `momentum_reversal_short` plus ADA 4h `range_breakout_long` remain low-sample watch rows. No Telegram sent; no live trading, orders, exchange mutations, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-19T16:05:10Z - alert-edge roster shifts, still no-trade

- Verification: scheduled paper/shadow refresh completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed. Verdict remains `no_trade_watch_low_sample`; paper overall is 388 closed at -0.0623R / 34.79% winrate, qualified A/B/C remains 34 closed at -0.0072R / 38.24%, and shadow PnL remains negative/unproven at 69 filled / -1530 USD gross / 34.78% winrate. Candidate roster shifted to XRP/DOGE 4h `momentum_reversal_short` watch rows, LINK 4h `range_breakout_long` watch, and DOGE/AVAX 4h `range_breakout_long` kill/avoid rows; all remain low-sample or weak-expectancy learning inputs, not high-probability proof. No Telegram sent; no live trading, orders, exchange mutations, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-19T20:05:15Z - alert-edge paper drift worsens, still no-trade

- Verification: scheduled paper/shadow refresh completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge steps; required outputs refreshed. Verdict remains `no_trade_watch_low_sample`; paper overall moved to 393 closed at -0.0672R / 34.61% winrate, qualified A/B/C remains 34 closed at -0.0072R / 38.24%, and shadow PnL remains negative/unproven at 69 filled / -1530 USD gross / 34.78% winrate. Current candidate actions are XRP 4h `momentum_reversal_short` watch, LINK 4h `range_breakout_long` watch, and DOGE/AVAX 4h `range_breakout_long` kill/avoid rows; all remain low-sample or weak-expectancy learning inputs, not high-probability proof. No Telegram sent; no live trading, orders, exchange mutations, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-19T20:26:37Z - RALPH/crypto runtime hardening

- Changed: bounded realtime watcher TA context cache (`CRYPTO_UPDATES_TA_CACHE_MAX_ENTRIES`, default 24), added asset/direction in-flight alert dedup before async TA/send work, added `crypto-updates/service-health-check.mjs`, generated `crypto-updates/runtime/service-health-report.json` and `crypto-updates/wiki/monitor/service-health.md`, added strategy-filter drift sidecar (`npm run drift:filter`) with compact 2026-09-13 baseline, added verifier checks, and queued `strategy-filter-previous-report-drift-sidecar-closeout`.
- Result: watcher restarted successfully at 2026-09-19T20:26:06Z and is active/running; health report still records the last-24h pre-fix evidence: 4 OOM-related journal lines and 2 SOL duplicate alert clusters. Drift report now shows AVAX `range_breakdown_short` survivor shape changed from `survived_research_gate` to `rejected` with `weak_walk_forward_out_of_sample`, preserving `no_threshold_change` and `zero_survivor_shapes_no_promotion`.
- Verification: `node --check` passed for watcher and health/drift scripts; `node crypto-updates/service-health-check.mjs` passed; `npm run drift:filter`, `npm run verify`, and `npm test` passed for `strategy-destruction-filter` (29/29 tests).
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, live alert wording, thresholds, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion changed. Weekly maintenance cron prompt was updated with Tomas's approval to include read-only service health inspection and to avoid treating missing optional `jq`/`yq` as a warning by itself.

# 2026-09-19T21:00:00Z - RALPH adversarial improvement loop bootstrap

- Changed: added `automation/ralph-adversarial-improvement-loop.mjs` and runbook, `automation/atas-access-audit.mjs`, `automation/backtest-readiness-audit.mjs`, ATAS orderflow event schema, npm script aliases, verifier checks, and generated `outputs/atas-access-audit.*`, `outputs/backtest-readiness-audit.*`, and `outputs/ralph-adversarial-improvement-report.*`.
- Result: ATAS audit verdict is `dev_runtime_partial_no_atas_install`; no local ATAS install/feed access is active yet. Backtest readiness is 10/11 with the explicit remaining gap `purged-embargo-split`. Critic verdict is `proposals_ready_internal`, 5 proposal-only improvements, 0 high/critical findings, and `notifyTomas=false`.
- Scheduler: created isolated daily cron `ralph-adversarial-improvement-loop` (`fa47f4d7-f195-4236-ad27-3e72e340158e`) at 19:30 Europe/Prague, delivery none, Telegram only through its high/critical gate.
- Verification: `node --check` passed for new scripts; ATAS/backtest/critic scripts ran successfully; `npm run drift:filter`, `npm run verify`, and `npm test` passed for `strategy-destruction-filter` (29/29 tests); YAML parsed with Python/PyYAML.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion changed.

# 2026-09-20T00:05:21Z - alert-edge paper refresh remains no-trade

- Verification: scheduled liquid-crypto alert-edge loop completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge report; required outputs refreshed. Verdict remains `no_trade_watch_low_sample`; paper overall is 395 closed at -0.0577R / 34.94% winrate, qualified A/B/C remains 34 closed at -0.0072R / 38.24%, and shadow PnL remains negative/unproven at 69 filled / -1530 USD gross / 34.78% winrate. Candidate actions are dominated by XRP 4h `momentum_reversal_short` watch_low_sample plus repeated AVAX/DOGE 4h `range_breakout_long` kill/avoid rows; low-sample favorable pockets are still learning inputs, not high-probability proof. No Telegram sent; no live trading, orders, exchange mutations, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-20T04:05:22Z - alert-edge paper refresh turns negative-edge

- Verification: scheduled liquid-crypto alert-edge loop completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge report; required outputs refreshed. Verdict changed from `no_trade_watch_low_sample` to `no_trade_negative_edge`; paper overall is 404 closed at -0.0648R / 34.65% winrate, qualified A/B/C is 35 closed at -0.0356R / 37.14%, and shadow PnL remains negative/unproven at 70 filled / -1500 USD gross / 35.71% winrate. Candidate actions are kill/avoid rows for ETH/SOL 1h `momentum_reversal_long` and AVAX 4h `range_breakout_long`; no high-probability label is justified. No Telegram sent; no live trading, orders, exchange mutations, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-20T07:37:11Z - RALPH autoresearch: strategy-filter purged/embargo split design

- Item: `validation.backtest-readiness-purged-embargo-design`.
- Output: `wiki/notes/2026-09-20-strategy-filter-purged-embargo-split-design.md`, `automation/work-queues.yaml`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`; bridge source `source.ralph-strategy-filter-purged-embargo-split-design`.
- Design: before overlapping intraday/orderflow labels can be promotion-ready, add `purged_embargo_entry_time`: anchor the current 70% chronological split, default `purgeBars` and `embargoBars` to `timeframe.maxBars`, exclude boundary trades from survival/baseline/walk-forward metrics, apply identical timestamp exclusion to the matched baseline, and report purged counts per variant. Current 1h/4h max horizons are 24 bars and 12 bars respectively.
- Decision: keep `purged-embargo-split` as a failing readiness check until implemented. Do not loosen thresholds to offset lower post-purge sample counts; if samples fall below gates, reject or keep Watch.
- Verification: local checks inspected `outputs/backtest-readiness-audit.md`, strategy-filter README/config/report totals, and current `src/engine.mjs` split implementation. No web/source checks used.
- Boundary: no Telegram sent, no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, data capture, risk/sizing/TP/SL, execution, public posting, code change, or strategy promotion changed.

# 2026-09-20T08:59:49Z - ATAS manual orderflow rail confirmed

- Input: Tomas manually exported ATAS X Bid/Ask Tape and Smart Tape CSV samples after discovering the widget launcher at `+ -> New Widget`.
- Result: added `wiki/notes/2026-09-20-atas-manual-orderflow-rail.md` and updated `core/data-rails.md` with an `ATAS Manual Orderflow Export` rail. Bid/Ask Tape is confirmed as the primary manual orderflow source; Smart Tape is supplemental unless more columns can be enabled.
- Verification: local checks over Tomas-provided CSVs found Bid/Ask Tape has 4,199 data rows, schema `Time;Bids;;;;Ask;Delta`, time range `09:46:49..10:39:58`, and delta range `-163.438..65.223`; Smart Tape has 79 data rows, schema `Time;Price;Volume`, time range `10:40:28..10:41:27`, and one blank price/volume row.
- Boundary: manual HITL data rail only; no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, automated ATAS capture, risk/sizing/TP/SL, execution, public posting, or strategy promotion changed.

# 2026-09-20T10:34:00Z - ATAS automation audit updated

- Input: Tomas asked to continue from the ATAS handoff, check session context first, and audit automatic ATAS access while preserving volume velocity as the screening/trigger layer.
- Result: session context was `0/200k`, compactions `0`. Added `wiki/notes/2026-09-20-atas-automation-access-audit.md` and updated `core/data-rails.md` plus the manual ATAS rail note. Verdict: manual CSV is active; direct automatic ATAS pull from this workspace is still unproven because no local ATAS install/process/export folder is reachable. Best automation route is a read-only ATAS C# custom indicator/exporter inside ATAS writing append-only JSONL/CSV; watched manual export folder is fallback.
- Metric bridge: keep `volume_velocity` as screening/trigger; add ATAS confirmation features `delta_velocity`, `bid_side_velocity`, `ask_side_velocity`, `volume_per_price_progress`, `absorption_score`, `exhaustion_score`, and `breakout_quality_score`.
- Verification: checked official ATAS docs for custom indicators, ATAS X install/runtime behavior, candle/footprint/tick/cumulative-trade/market-depth/MBO/statistics access, official GitHub indicator examples, local ATAS path scan, existing audit outputs, and Tomas-provided Bid/Ask Tape/Smart Tape samples.
- Boundary: no live trading, orders, wallet keys, exchange keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, public posting, data capture automation, or strategy promotion changed.

# 2026-09-20T10:45:00Z - ATAS Classic vs X exporter plan

- Input: Tomas asked to compare Classic ATAS against ATAS X and clarify what is needed from him for C# indicator/exporter work and future HITL.
- Result: added `wiki/notes/2026-09-20-atas-classic-vs-x-exporter-plan.md` and linked it from the automation audit and data rails. Official docs indicate Classic is Windows/WPF, ATAS X is cross-platform, most Classic indicators without WPF UI/custom editors should load in ATAS X, and the runtime target must match `.NET 8`/`.NET 10` as shown by `OFT.Platform.runtimeconfig.json` or `OFT.PlatformX.runtimeconfig.json`.
- HITL ask: Tomas should pick ATAS X vs Classic for first test, provide version/runtime/install context, confirm instrument/feed pair, optionally export Classic Bid/Ask Tape and Smart Tape samples, and later approve one read-only DLL test plus a non-secret output folder.
- Boundary: no live trading, orders, keys, paid APIs, account setup, alert wording, thresholds, scheduler/cadence, execution, data-capture automation, or strategy promotion changed.

# 2026-09-20T12:05:00Z - scheduled RALPH jobs status check

- Status: cron scheduler enabled with 8 jobs. `liquid-crypto-alert-edge-backtest` ran at 12:03 UTC successfully and remains `no_trade_negative_edge`; 407 closed paper trades, 34.40% winrate, -0.0657R avg, shadow PnL still -1500 USD. `ralph-autoresearch-loop` did run today: first 07:30 UTC attempt timed out, retry finished OK at 07:44 UTC with `strategy-filter-purged-embargo-implementation-scope`; no Telegram gate. `ralph-adversarial-improvement-loop`, daily state-of-edge, and weekly maintenance had not run yet today because their scheduled times are later.
- Health: `crypto-updates-market-watcher.service` and `bybit-execution-reactor.service` are active/running. Service health still raises attention because the last-24h window includes the Sep 19 pre-fix OOM kill and SOL duplicate alert cluster; no new post-fix crash was found in this check.
- Boundary: read-only status/health check only; no live trading, orders, account/key/API changes, thresholds, alert wording, scheduler changes, sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-20T12:50:00Z - ATAS X speed/data-surface note

- Input: Tomas asked whether ATAS X is faster than Classic and what data ATAS X can provide/how fast.
- Result: added `wiki/notes/2026-09-20-atas-x-speed-and-data-surface.md` and linked it from the Classic/X plan and data rails. Working decision: prefer ATAS X first because ATAS positions it as the faster/current platform and Tomas already verified usable ATAS X Bid/Ask Tape and Smart Tape exports; Classic is only a fallback if X lacks a needed module/export/historical mode path.
- Data surface: manual CSV is active for Bid/Ask Tape and Smart Tape. C# indicator API can access candle ask/bid/volume/delta, footprint/cluster price levels, online ticks, cumulative trades, historical cumulative trades, market depth, and provider-supported MBO; account/trading statistics remain out of RALPH scope.
- Latency decision: manual CSV is seconds/minutes HITL; exporter should be event-driven/near-realtime but must be measured with timestamps before any live decision label. First exporter should emit compact 250ms-1s or bucket-close feature windows rather than a raw firehose.
- Boundary: no live trading, orders, keys, paid APIs, account setup, scheduler/cadence, alert wording, thresholds, execution, or strategy promotion changed.

# 2026-09-20T13:04:00Z - ATAS docs ingested into Obsidian/RALPH

- Input: Tomas asked to read the ATAS docs and save them into Obsidian.
- Result: used the Obsidian vault maintainer workflow, confirmed bridge/Obsidian availability, read official ATAS technical docs nav and top-level pages, and added `wiki/sources/atas-api-docs-2026-09-20.md` plus `wiki/notes/2026-09-20-atas-docs-ingestion.md`. Linked source pack from the ATAS X speed/data-surface note. Bridge-ingested/search-verified as `source.ralph-atas-api-docs-2026-09-20` and `source.ralph-atas-docs-ingestion`; Obsidian search finds the new RALPH notes.
- Synthesis: ATAS docs support three rails: active manual CSV, likely read-only no-custom-UI C# exporter, and explicitly avoided strategy/order/account APIs. ATAS X remains preferred; Classic is fallback only for missing X module/export path or runtime issue.
- Boundary: source ingestion/architecture memory only; no exporter install, no automatic capture, no account/order/statistics data, no live trading, no scheduler/cadence/threshold/alert/execution changes.

# 2026-09-20T13:35:00Z - ATAS X Bid/Ask Tape 3 and Smart Tape 3 parsed

- Input: Tomas forwarded continuation from the high-context session and asked to continue inspecting the new ATAS X CSV samples.
- Verification: current session status was `0/200k` context with 0 compactions. Parsed inbound files `Bid_Ask_tape_3---e4820f4f-b8d8-49ba-8110-a8b4bc781c1e.csv` and `Smart_tape_3---eb29a04f-4683-40f4-8c8d-1df0e17930cb.csv`.
- Result: updated `wiki/notes/2026-09-20-atas-manual-orderflow-rail.md` and `core/data-rails.md`. Bid/Ask Tape 3 has 4,515 rows over `09:46:49..11:07:04`, bid-side sum `1722.685`, ask-side sum `1836.674`, and delta range `-175.663..114.220`. Smart Tape 3 has 1,837 rows over `10:52:16..11:07:05`, volume sum `610.39`, and max print `11:07:04;80283.0;83.98`.
- Interpretation: Bid/Ask Tape remains the primary data rail; Smart Tape is useful for matching compact print spikes. The Smart Tape max print at `80283.0` aligns with a large Bid/Ask Tape ask-side event near `80283.0`, making it a good first feature-design case for absorption/exhaustion/breakout-quality scoring.
- Boundary: CSV parsing and note updates only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, automatic ATAS capture, execution, or strategy promotion changed.

# 2026-09-20T13:33:11Z - ATAS Classic screenshot/export check

- Input: Tomas sent Classic ATAS screenshots plus `Bid_Ask_tape_4_CLassic---4dce2f84-d104-437d-b124-6c6cf33a3bb9.csv`.
- Verification: current session status was 30% context with 0 compactions. Parsed the inbound Classic CSV and visually inspected the screenshots.
- Result: Classic exposes the same relevant widget family as ATAS X, and Classic Smart Tape has richer visible UI columns (`Time`, `Price`, `+/-`, `Volume`, `Bid`, `Asks`, `Sizes`, `Avg`), but the visible Smart Tape context menu lacks `Export` / `Save to file`. Classic Bid/Ask Tape CSV uses the same schema as ATAS X (`Time;Bids;;;;Ask;Delta`) and this received file has 12 rows over `15:28:46..15:29:31`, bid-side sum `16.183`, ask-side sum `7.874`, and delta range `-8.309..4.115`.
- Interpretation: Classic is not yet export-superior to ATAS X. Keep ATAS X Bid/Ask Tape as the primary manual rail; use Classic only for further checks if it reveals longer/better Bid/Ask Tape, `All Prices`, replay/historical export, or a cleaner C# workflow.
- Boundary: screenshot/CSV analysis and note updates only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, automatic ATAS capture, execution, or strategy promotion changed.

# 2026-09-20T13:58:00Z - ATAS Classic longer buffer and All Prices parsed

- Input: Tomas sent three Classic settings screenshots plus `Bid_Ask_Classic_2---d3089fa9-cfe1-48fe-961b-bb08ef8f5912.csv` and `All_prices_Classic---2331c19f-e1b4-4d7d-a5a1-ab5874b9263b.csv`, asking whether ATAS X has history/replay and what the Classic test means.
- Verification: session status was 29% context with 0 compactions. Archived the raw Classic follow-up evidence under `raw/atas-manual-exports/2026-09-20/classic-followup-1552/`. Parsed both CSVs locally.
- Result: updated `core/data-rails.md`, `wiki/notes/2026-09-20-atas-manual-orderflow-rail.md`, and `wiki/notes/2026-09-20-atas-classic-vs-x-exporter-plan.md`. `Bid_Ask_Classic_2` has 153 rows over `15:28:46..15:47:43`, same Bid/Ask Tape schema as ATAS X, bid-side sum `270.692`, ask-side sum `421.677`, net ask minus bid `150.985`, and delta range `-102.358..159.050`. `All_prices_Classic` has 5,419 rows with `Price;Volume;Trades;Bid;Asks;Delta`, total volume `47330.804`, net delta `-1630.986`, and price range `80095.9..81294.9`.
- Interpretation: Classic can export a longer accumulated Bid/Ask Tape buffer and useful All Prices price-level distribution, but still has not proven selected historical/replay export. ATAS X has a visible `Replay` UI entry, but whether Replay can drive exportable Bid/Ask Tape/All Prices slices remains unverified. Official docs support historical cumulative trade requests in a custom indicator/exporter path.
- Boundary: manual evidence parsing and note updates only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, automatic ATAS capture, execution, or strategy promotion changed.

# 2026-09-20T14:38:00Z - ATAS screenshots: replay gated and visual widgets

- Input: Tomas sent four ATAS screenshots and asked to inspect all of them.
- Verification: session status was 49% context with 0 compactions. Archived screenshots under `raw/atas-manual-exports/2026-09-20/atas-screenshots-1430/` and visually inspected them.
- Result: updated `core/data-rails.md`, `wiki/notes/2026-09-20-atas-manual-orderflow-rail.md`, and `wiki/notes/2026-09-20-atas-classic-vs-x-exporter-plan.md`.
- Findings: the data-provider chooser shows crypto venues including Binance/Bybit/OKX/Kraken and the chart context shows `BTCUSDT@BinanceFutures`, but this is still Tomas-machine UI access, not workspace automation. `Market Replay` exists in the UI but is blocked on the current `Start` subscription; the modal says `Plus`, `Pro`, or `Ultra` / trial is needed. Widgets tab shows `Market Pressure`, `Price Change`, `DOM Pressure`, and `Delta Divergence`. `Market Pressure` context menu lacks export in the screenshot; `Delta Divergence` is relevant as feature inspiration for cross-horizon delta divergence but not yet a data rail.
- Boundary: screenshot analysis and notes only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, automatic ATAS capture, execution, or strategy promotion changed.

# 2026-09-20T15:21:00Z - RALPH backtest data inventory direction and Classic batch 15:02

- Input: Tomas asked to save a durable answer about what kinds of backtests RALPH can run, where data should come from, what is currently available, and how to upgrade data collection/backtesting rather than relying only on ATAS Market Replay or manual CSVs.
- Result: added `wiki/notes/2026-09-20-ralph-backtest-data-inventory.md`, updated `core/data-rails.md`, `wiki/notes/2026-09-20-atas-manual-orderflow-rail.md`, and refreshed `continuation-prompts/2026-09-20-1446-atas-csharp-exporter-next-handoff.md`.
- New data parsed: archived Tomas's latest Classic files under `raw/atas-manual-exports/2026-09-20/classic-followup-1502/`. `Classic_All_Prices` has 6,963 rows, schema `Price;Volume;Trades;Bid;Asks;Delta`, total volume `53390.850`, bid `27215.591`, asks `26175.259`, net delta `-1040.332`, price range `80095.9..81294.9`. `Chart_Classic_2` has 1,042 5m OHLC rows over `2026-09-17 02:00:00..2026-09-20 16:50:00`, no volume/delta columns, timestamp format observed as `YYYY-DD-MM HH:MM:SS`.
- Decision: next session should prioritize verified backtest data inventory across price/volume, trade-print, orderflow-ish, footprint/volume-at-price, widget-state, and live-capture/forward-test categories. Fetch public/no-key historical data where possible; derive proxies only when direct data is unavailable and label them honestly. Start the ATAS read-only C# exporter skeleton only after docs/access/licensing are verified.
- Boundary: data inventory, parsing, notes, and handoff only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, automatic ATAS capture, execution, or strategy promotion changed.

# 2026-09-20T15:35:00Z - verified RALPH backtest inventory and exporter gate

- Input: Tomas asked to continue from the 14:46 handoff, verify the backtest data inventory before coding, include the latest Classic `15:02` files, verify ATAS C# custom indicator/exporter access and plan limits, and only start `RalphOrderflowExporter` if access is verified.
- Verification: session status was `0/200k`, compactions `0`. Read the handoff, ATAS manual/automation/classic notes, data rails, latest inventory, ATAS docs cache, local `crypto-updates` orderflow captures, and `zela-benchmark` datasets. Public no-key probes returned data from Binance spot/futures klines, aggTrades, and depth; Bybit linear klines/recent trades; and Hyperliquid `l2Book`.
- Inventory result: updated `wiki/notes/2026-09-20-ralph-backtest-data-inventory.md` with a matrix for price/volume, trade-print, orderflow-ish, footprint/volume-at-price, widget-state, and live-capture/forward-test backtests. `crypto-updates` is active pipeline/public-orderflow evidence but has no exact finalized alert symbol/time overlap; Zela benchmark is feed-latency data, not market candles; Classic `15:02` All Prices is usable footprint/volume-at-price distribution and Chart Classic is OHLC-only.
- ATAS access result: local docs verify custom C# indicators, `OnCalculate`, candle/footprint access, `OnNewTrade`, cumulative trade hooks, historical `RequestForCumulativeTrades`, and market-depth surfaces. Current ATAS pricing confirms Start/free includes ATAS X, real-time crypto exchange access, one crypto connection, basic indicators, three indicators per chart, and no Market Replay. Pricing does not explicitly verify custom DLL loading on Start.
- Decision: created `wiki/notes/2026-09-20-ralph-orderflow-exporter-v0-design.md` as a gated design. Do not build/deploy the C# DLL until Tomas confirms `Add custom indicator` works in his current setup and provides the runtime target from `OFT.PlatformX.runtimeconfig.json` or `OFT.Platform.runtimeconfig.json`. Continue public fetchers and ATAS manual import in parallel.
- Boundary: research/design/note updates only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, automatic ATAS capture, C# build/deploy, execution, or strategy promotion changed.

# 2026-09-20T15:42:00Z - ATAS X ZIP follow-up parsed

- Input: Tomas sent `Documents---99a79cb5-13fa-4adf-b071-aa11619351e2.zip` and asked whether it contains ATAS X All Prices/Bid Ask/Smart Tape data and whether ATAS X has Replay while Classic does not.
- Verification: extracted ZIP under `raw/atas-manual-exports/2026-09-20/atasx-followup-1538/`. Files: `Smart_Tape_ATASX.csv`, `Bid_Ask_ATASX.csv`, `All_prices_ATASX.csv`.
- Parsed results: `Bid_Ask_ATASX` has 9,286 rows over `16:41:16..17:33:11`, bid-side sum `1809.677`, ask-side sum `2306.228`, net ask minus bid `496.551`, delta range `-61.211..720.364`, price range `80570.5..80910.1`. `Smart_Tape_ATASX` has 1,951 rows over `17:20:00..17:33:31`, volume sum `718.69`, one blank price/volume row, and 497 zero-volume rows. `All_prices_ATASX` has 6,059 rows, total volume `52943.020`, bid `26981.378`, asks `25961.642`, net delta `-1019.736`, price range `80095.9..81294.9`.
- Interpretation: ATAS X now proves all three useful manual rails: Bid/Ask Tape, Smart Tape, and All Prices. This strengthens ATAS X as the default manual rail. ATAS X has visible Replay UI but Start blocks Market Replay; Classic replay is only `not-visible/unverified` from current evidence, not globally disproven.
- Boundary: ZIP extraction/parsing and note updates only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, automatic ATAS capture, C# build/deploy, execution, or strategy promotion changed.

# 2026-09-20T15:47:00Z - Replay/MCP/C# insertion clarification

- Input: Tomas asked whether the short exports were Classic, what `visible-but-subscription-gated` means, whether ATAS X or Classic has MCP, and how the C# exporter would be inserted.
- Clarification: the very short 12-row `Bid_Ask_tape_4_CLassic` was Classic; `Bid_Ask_Classic_2` was also Classic but longer at 153 rows. The first 79-row Smart Tape sample was ATAS X, and the latest 9,286-row `Bid_Ask_ATASX` came from ATAS X. Shortness alone proves only a short live/current widget buffer at export time, not absence of history/replay.
- Replay precision: ATAS X has a visible Replay UI surface, but Tomas's Start plan blocks Market Replay via a modal. The submitted CSVs are widget exports and are not verified replay exports. Classic replay remains `not-visible/unverified`, not proven impossible.
- MCP precision: neither ATAS X nor Classic is known to expose an MCP server/connector. Both are documented around C# custom indicator DLLs. The practical bridge is a read-only indicator writing append-only JSONL/CSV, which RALPH/OpenClaw can then read; an MCP/file watcher could be added later over those files.
- C# insertion path: confirm `Add custom indicator`, read runtime target from `OFT.PlatformX.runtimeconfig.json` or `OFT.Platform.runtimeconfig.json`, build a C# class library referencing `ATAS.Indicators.dll`, add/copy the DLL into the ATAS X or Classic indicators folder, attach it to the chart/instrument, and write only local feature windows/status files.
- Boundary: clarification and note update only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, automatic ATAS capture, C# build/deploy, execution, or strategy promotion changed.

# 2026-09-20T15:55:00Z - RalphOrderflowExporter V0 source skeleton created

- Input: Tomas confirmed `Add custom indicator` is visible in ATAS X and asked for the C# file, asking whether it was token-heavy or should wait for another session.
- Result: created a minimal read-only source skeleton under `tools/atas/RalphOrderflowExporter/` and packaged it as `tools/atas/RalphOrderflowExporter-v0-source.zip` for Telegram delivery. Files: `RalphOrderflowExporter.cs`, `RalphOrderflowExporter.csproj`, and `README.md`.
- Behavior: indicator writes `%LOCALAPPDATA%\RalphOrderflowExporter\feature-windows.jsonl` and `status.json`; exports one compact bar/footprint summary per bar using `GetCandle(bar)` and `GetAllPriceLevels()`; avoids trading/account/order/position/execution/statistics/key surfaces.
- Build gate: not compiled in this workspace because Tomas's installed `ATAS.Indicators.dll` and exact runtime target are still needed. Next HITL: provide `OFT.PlatformX.runtimeconfig.json` target or confirm `.NET 8`/`.NET 10`, and provide/reference `ATAS.Indicators.dll` path.
- Boundary: source skeleton and ZIP packaging only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, automatic ATAS capture, C# DLL build/deploy, execution, or strategy promotion changed.

# 2026-09-20T15:56:00Z - continuation handoff for ATAS exporter build

- Input: Tomas explicitly asked to create the handoff now and continue in a new session.
- Context status: `162k/272k`, `59%`, compactions `0`.
- Result: created `continuation-prompts/2026-09-20-1556-ralph-atas-exporter-build-handoff.md` with current state, hard constraints, exporter skeleton files, ATAS X/Classic/replay clarifications, verified data inventory, next steps, and an inline copy-paste prompt.
- Boundary: handoff/memory update only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, automatic ATAS capture, C# DLL build/deploy, execution, or strategy promotion changed.

# 2026-09-20T17:14:00Z - RalphOrderflowExporter M5 timeframe follow verified

- Input: Tomas changed the ATAS X chart timeframe and checked `%LOCALAPPDATA%\RalphOrderflowExporter\status.json` plus `feature-windows.jsonl`.
- Result: exporter stayed attached and followed the chart timeframe. `status.json` reported `state:"ok"`, `instrument:"BTCUSDT"`, `timeframe:"M5"`, and `utc:"2026-09-20T17:11:38.1989389Z"`. JSONL tail contained M5 bars `1066` to `1070` from `16:50` through the live partial `17:10` bar.
- Decision: V0 can be used by manually switching ATAS X chart timeframe; no re-add is needed unless status/rows stop updating. Because the same JSONL now has mixed H1 and M5 rows, downstream ingestion must filter by `instrument + timeframe`, or V1 should split output into per-symbol/timeframe files.
- Boundary: verification and note update only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, automatic ATAS capture beyond Tomas's manual chart use, execution, or strategy promotion changed.

# 2026-09-20T20:25:00Z - RalphOrderflowExporter split output files implemented

- Input: Tomas approved continuing after the Codex usage-limit reset and asked to implement the split output behavior.
- Result: updated `tools/atas/RalphOrderflowExporter/RalphOrderflowExporter.cs` so bar/footprint summary rows now write to `%LOCALAPPDATA%\RalphOrderflowExporter\feature-windows-{instrument}-{timeframe}.jsonl`, with `status.json` pointing to the active output. Added per-output duplicate-bar tracking instead of one global last-written bar. Updated README examples and rebuilt `tools/atas/RalphOrderflowExporter-v0-source.zip`.
- Delivery: sent the refreshed ZIP and Windows rebuild/test commands to Tomas via Telegram; `message` returned `ok` with message id `6713`, but source-chat history verification was not available from this turn.
- Boundary: source package update only; local workspace has no `dotnet`, `csc`, or `mcs`, so compile/load verification still needs Tomas's Windows ATAS machine. No live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, execution, or strategy promotion changed.

# 2026-09-21T07:30:00Z - strategy filter purged/embargo verifier assertion map

- Loop: `ralph-autoresearch-loop`.
- Work item: `validation.strategy-filter-purged-embargo-verifier-assertion-map`.
- Output: `wiki/notes/2026-09-21-strategy-filter-purged-embargo-verifier-assertion-map.md`, `automation/work-queues.yaml`, `automation/retrieval-router.yaml`, `automation/loop-state.yaml`, bridge source `source.ralph-purged-embargo-verifier-assertion-map`.
- Result: mapped the smallest verifier assertion surface for the purged/embargo split implementation. Current report remains `13` candidates / `131` variants / `0` survivors / `0` effective survivor shapes; all `131` verdict rows lack purged/embargo split metadata, while current split sample sums and candidate-vs-baseline total sample parity still match.
- Boundary: no strategy code, thresholds, scheduler/cadence, alert wording, data capture, account/key/API access, paid service, risk/sizing/TP/SL, execution, public posting, or strategy promotion changed. No Telegram notification gate met.

# 2026-09-20T20:29:00Z - split output source built on Windows

- Input: Tomas ran `Build-AtasX.ps1` from `C:\Users\tompa\Downloads\RalphOrderflowExporter` after receiving the split-output ZIP.
- Result: build succeeded for `net10.0-windows`, producing `bin\Release\net10.0-windows\RalphOrderflowExporter.dll`. The SDK/runtime remained .NET SDK `10.0.401` / host `10.0.12`. Warnings increased to 8, all obsolete `Indicator.Instrument` / `Indicator.TimeFrame` warnings.
- Next gate: load the rebuilt DLL in ATAS X, attach it, and verify split output files under `%LOCALAPPDATA%\RalphOrderflowExporter\feature-windows-*.jsonl`.
- Boundary: compile verification only; no ATAS load/write proof for the split file behavior yet. No live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, execution, or strategy promotion changed.

# 2026-09-20T20:30:00Z - split output H1 runtime write verified

- Input: Tomas ran the split-output verification command after building and attaching/reloading the exporter.
- Result: `status.json` reported `state:"ok"`, `instrument:"BTCUSDT"`, `timeframe:"H1"`, and `output:"C:\\Users\\tompa\\AppData\\Local\\RalphOrderflowExporter\\feature-windows-BTCUSDT-H1.jsonl"` at `2026-09-20T20:29:12.1699961Z`. The split file existed with length `167958` and fresh last-write time.
- Clarification: `feature-windows-BTCUSDT-M5.jsonl` did not exist because the active rebuilt chart was H1; the test command had hardcoded M5. Sent Tomas a generic verification command that tails `status.output`, plus instructions to switch ATAS to M5 to create the M5 split file.
- Boundary: H1 split file write verified; M5 split file not yet verified on the rebuilt DLL. No live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, execution, or strategy promotion changed.

# 2026-09-20T20:33:00Z - split output H1 live append verified

- Input: Tomas reran the generic `$status.output` verification command.
- Result: active output remained `feature-windows-BTCUSDT-H1.jsonl`; file length advanced from `167958` to `335913`, and last-write time advanced to `20.09.2026 22:31:57`. This verifies the rebuilt split-output DLL is actively appending live H1 rows.
- Next gate: switch ATAS chart to M5 and rerun the generic checker to create/verify `feature-windows-BTCUSDT-M5.jsonl`.
- Boundary: H1 split-file live append verified; M5 split-file live append still pending. No live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, execution, or strategy promotion changed.

# 2026-09-22T07:30:00Z - strategy filter purged/embargo implementation preflight

- Verification: selected one bounded `ralph-autoresearch-loop` work item, `validation.strategy-filter-purged-embargo-implementation-preflight`, starting from the router/state files and the directly relevant strategy-filter note/report/source surfaces.
- Result: created `wiki/notes/2026-09-22-strategy-filter-purged-embargo-implementation-preflight.md`. Current strategy-filter report remains 13 candidates / 131 variants / 0 survivors / 0 effective survivor shapes. OOS pressure remains non-promotional: 25 variants pass basic OOS sample/expectancy, 5 have 30 or fewer OOS trades, and the thinnest OOS passer has exactly 20 OOS trades but is already rejected by other hard gates.
- Next gate: small code pass only, adding a pure split classifier near `splitIndexForCandles`, identical candidate/baseline `purged_boundary` treatment, per-verdict `splitMetadata`, and verifier assertions before any candidate interpretation changes.
- Boundary: no Telegram sent; no live trading, orders, wallet/API/exchange-key handling, paid APIs, public posting, scheduler/cadence changes, alert wording, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-20T20:34:00Z - split output H1 payload tail verified

- Input: Tomas included the tail of `feature-windows-BTCUSDT-H1.jsonl` from the generic checker.
- Result: tail contained valid `ralph_orderflow_window_v0` rows for bars `234`, `235`, and live partial `236`; bar `236` had `candle_time:"2026-09-20T20:00:00.0000000"` and `last_trade_time:"2026-09-20T20:31:56.7500000Z"`.
- Boundary: payload validity verified for H1 split stream only; M5 split stream still pending chart switch. No live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, execution, or strategy promotion changed.

# 2026-09-20T20:55:00Z - price-level stream source packaged

- Input: Tomas asked whether the exporter work would continue toward covering the missing ATAS features.
- Result: added `price-levels-{instrument}-{timeframe}.jsonl` output to `RalphOrderflowExporter.cs`, writing one `ralph_orderflow_price_level_v0` row per candle price level with price, volume, bid, ask, and delta. `status.json` now includes `price_level_output`. README updated and `RalphOrderflowExporter-v0-source.zip` rebuilt/sent to Tomas with build and dual-stream verification commands.
- Boundary: source package sent only; compile/load/runtime verification of `price-levels-*` is pending on Tomas's Windows ATAS machine. No live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, execution, or strategy promotion changed.

# 2026-09-20T21:02:00Z - price-level stream verified on BTCUSDT M5

- Input: Tomas rebuilt/reloaded the price-level exporter and ran the dual-stream verification command.
- Result: `status.json` reported `state:"ok"`, `timeframe:"M5"`, `output` pointing to `feature-windows-BTCUSDT-M5.jsonl`, and `price_level_output` pointing to `price-levels-BTCUSDT-M5.jsonl`. Fresh files existed: feature file length `2345769`, price-level file length `4230481`, both last-written `20.09.2026 23:01:46`.
- Payload proof: feature tail contained M5 bars `1115` and live partial `1116`; price-level tail contained valid `ralph_orderflow_price_level_v0` rows for bar `1116` with prices `81010`, `81020`, and `81030` and volume/bid/ask/delta fields.
- Boundary: bar-summary and price-level streams are now verified for BTCUSDT M5. Raw trade/tape and cumulative trade streams are not implemented yet. No live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, execution, or strategy promotion changed.

# 2026-09-20T21:08:00Z - exporter usage and roadmap note created

- Input: Tomas asked to write down the full state and asked whether the ATAS indicator is useful for RALPH and how it works when he is away from the ATAS PC.
- Result: created `wiki/notes/2026-09-20-ralph-orderflow-exporter-usage-and-roadmap.md` covering current verified outputs, timeframes, manual and future automated workflows, away-from-PC options, RALPH usefulness, limitations, and next layers.
- Key decision: the exporter is useful as a read-only ATAS-to-RALPH data rail, but current live capture requires ATAS X/chart/indicator running somewhere. Away-from-PC options are leaving the Windows ATAS PC on, using remote desktop, running ATAS on a Windows VPS/cloud desktop after access/license verification, and later adding watcher/stale-status alerts.
- Boundary: documentation only; no live trading, orders, account/API/key changes, scheduler/cadence changes, alert wording, thresholds, paid plan/trial activation, execution, strategy promotion, or automation setup changed.

# 2026-09-21T02:04:00Z - orderflow pairing for ETH velocity alerts

- Input: Tomas asked whether orderflow would be useful paired with the last three ETH velocity alerts.
- Decision: yes; orderflow is an appropriate confirmation layer for velocity events that remain `no-trade` when price structure/level confirmation is missing. It should help classify aggressive participation vs thin movement/absorption.
- Design point: ETH velocity alerts need `ETHUSDT` target orderflow; `BTCUSDT` orderflow is the BTC regime gate. Proposed capture context: `BTCUSDT M5/H1` for regime plus `ETHUSDT M1/M5/H1` for target confirmation.
- Intended pipeline: velocity alert -> BTC gate -> target PA/levels -> orderflow aggression/absorption -> possible upgrade from event-only/no-trade to setup-watch or entry-candidate.
- Boundary: design note only; no live trade, execution, thresholds, alert wording, scheduler/cadence, API/key/account, or automation changes.

# 2026-09-21T00:05:00Z - liquid crypto alert-edge cron refresh

- Verification: scheduled liquid-crypto alert-edge loop completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge report; required outputs refreshed.
- Result: state-of-edge verdict changed from the last logged `no_trade_negative_edge` state to `no_trade_watch_low_sample`. Paper overall is 410 closed at -0.0639R / 34.39% winrate, qualified A/B/C is 35 closed at -0.0356R / 37.14%, and shadow PnL remains negative/unproven at 70 filled / -1500 USD gross / 35.71% winrate. Current non-kill watch is DOGE 4h `trend_pullback_reclaim_long` at n=24 / +0.2612R / PF 1.4878; low sample, not high-probability proof.
- Boundary: no Telegram sent; no live trading, orders, exchange mutations, wallet/API/key handling, paid APIs, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-21T08:05:00Z - liquid crypto alert-edge cron refresh

- Verification: scheduled liquid-crypto alert-edge loop completed monitor, journal, universe, backtest, verify, shadow-PnL, wick-feedback, aggtrades-velocity, and state-of-edge report; required outputs refreshed.
- Result: state-of-edge verdict changed back to `no_trade_negative_edge`. Paper overall is 416 closed at -0.0639R / 34.38% winrate, qualified A/B/C is 35 closed at -0.0356R / 37.14%, and shadow PnL remains negative/unproven at 70 filled / -1500 USD gross / 35.71% winrate. Candidate actions are all `kill_or_avoid`; no setup has high-probability proof.
- Boundary: no Telegram sent; no live trading, orders, exchange mutations, wallet/API/key handling, paid APIs, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-21T12:05:00Z - liquid crypto alert-edge cron refresh

- Verification: scheduled loop completed and required outputs refreshed; state-of-edge verdict changed from `no_trade_negative_edge` to `no_trade_watch_low_sample`. Paper overall is 416 closed at -0.0639R / 34.38% winrate, qualified A/B/C is 35 closed at -0.0356R / 37.14%, shadow PnL remains negative/unproven at 70 filled / -1500 USD gross / 35.71%; ETH/XRP/ADA 4h range-breakout rows are watch-only/low-sample, not high-probability proof.
- Boundary: no Telegram sent; no live trading, orders, exchange mutations, wallet/API/key handling, paid APIs, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-21T17:30:00Z - adversarial improvement cron refresh

- Verification: scheduled `ralph-adversarial-improvement-loop` completed and refreshed `outputs/ralph-adversarial-improvement-report.json` and `.md`; verdict remains `proposals_ready_internal`.
- Result: no high/critical findings and Telegram gate stayed closed. Repeated blockers remain proposal-only: low planned-level evidence (`8` frozen events vs `20` gate, `2` public trade windows vs `10` gate), no native purged/embargo split contract yet, walk-forward near-miss pressure, low-sample watch roster, and zero destruction-filter survivors.
- Boundary: no Telegram sent; no live trading, orders, wallet/API/exchange-key handling, paid APIs, public posting, alert wording, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-21T20:05:00Z - liquid crypto alert-edge cron refresh

- Verification: scheduled loop completed and required outputs refreshed; state-of-edge verdict remains `no_trade_watch_low_sample`.
- Result: paper overall moved to 420 closed at -0.0528R / 34.76% winrate, qualified A/B/C remains weak at 35 closed / -0.0356R / 37.14%, and shadow PnL remains negative/unproven at 70 filled / -1500 USD gross / 35.71%. Watch-only rows include ETH/XRP/ADA/LINK 4h range-breakout variants, still low-sample or insufficient expectancy proof; no high-probability label justified.
- Boundary: no Telegram sent; no live trading, orders, exchange mutations, wallet/API/key handling, paid APIs, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-22T00:05:00Z - liquid crypto alert-edge cron refresh

- Verification: scheduled loop completed and required outputs refreshed; state-of-edge verdict remains `no_trade_watch_low_sample`.
- Result: paper overall improved but remains negative at 421 closed / -0.0484R / 34.92% winrate, qualified A/B/C flipped barely positive at 36 closed / +0.0154R / 38.89%, and shadow PnL remains negative/unproven at 70 filled / -1500 USD gross / 35.71%. Watch-only 4h range-breakout rows now include XRP n=40 / +0.4055R / PF 1.8033, ETH n=30 / +0.2795R / PF 1.5234, ADA n=17 / +0.2838R / PF 1.5186, and LINK n=45 / +0.0725R / PF 1.1187; still low-sample/insufficient forward proof, not high-probability evidence.
- Boundary: no Telegram sent; no live trading, orders, exchange mutations, wallet/API/key handling, paid APIs, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-22T04:05:00Z - liquid crypto alert-edge cron refresh

- Verification: scheduled loop completed and required outputs refreshed; state-of-edge verdict remains `no_trade_watch_low_sample`.
- Result: paper overall regressed to 430 closed / -0.0684R / 34.19% winrate, while qualified A/B/C remains barely positive at 36 closed / +0.0154R / 38.89%; shadow PnL remains negative/unproven at 70 filled / -1500 USD gross / 35.71%. Current watch-only rows include XRP 4h range-breakout n=40 / +0.4055R / PF 1.8033, AVAX 1h trend-pullback n=33 / +0.1876R / PF 1.3164, XRP 1h range-breakout n=28 / +0.0808R / PF 1.1312, and LINK 4h range-breakout n=45 / +0.0725R / PF 1.1187; no high-probability label justified.
- Boundary: no Telegram sent; no live trading, orders, exchange mutations, wallet/API/key handling, paid APIs, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-22T08:05:00Z - liquid crypto alert-edge cron refresh

- Verification: scheduled loop completed and required outputs refreshed; state-of-edge verdict remains `no_trade_watch_low_sample`.
- Result: paper overall regressed to 434 closed / -0.0770R / 33.87% winrate and qualified A/B/C flipped negative at 38 closed / -0.0380R / 36.84%; shadow PnL remains negative/unproven at 70 filled / -1500 USD gross / 35.71%. Watch-only rows still include XRP 4h range-breakout n=40 / +0.4055R / PF 1.8033, AVAX 1h trend-pullback n=33 / +0.1876R / PF 1.3164, XRP 1h range-breakout n=28 / +0.0808R / PF 1.1312, and LINK 4h range-breakout n=45 / +0.0725R / PF 1.1187; ETH 1h range-breakout and DOGE 1h range-breakout remain kill/avoid. No high-probability label justified.
- Boundary: no Telegram sent; no live trading, orders, exchange mutations, wallet/API/key handling, paid APIs, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-22T12:05:00Z - liquid crypto alert-edge cron refresh

- Verification: scheduled loop completed and required outputs refreshed; state-of-edge verdict remains `no_trade_watch_low_sample`.
- Result: no new paper closures since the prior run; paper overall remains 434 closed / -0.0770R / 33.87% winrate, qualified A/B/C remains 38 closed / -0.0380R / 36.84%, and shadow PnL remains negative/unproven at 70 filled / -1500 USD gross / 35.71%. Candidate surface now foregrounds watch-only XRP 1h range-breakout n=28 / +0.0808R / PF 1.1312 and AVAX 1h trend-pullback n=33 / +0.1876R / PF 1.3164, while ETH 1h and DOGE 1h range-breakout remain kill/avoid; no high-probability label justified.
- Boundary: no Telegram sent; no live trading, orders, exchange mutations, wallet/API/key handling, paid APIs, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-23T04:05:00Z - liquid crypto alert-edge cron refresh

- Verification: scheduled loop completed and required outputs refreshed; state-of-edge verdict remains `no_trade_watch_low_sample`.
- Result: paper overall is 440 closed / -0.0768R / 33.86% winrate, qualified A/B/C remains weak at 38 closed / -0.0380R / 36.84%, and shadow PnL remains negative/unproven at 70 filled / -1500 USD gross / 35.71%. Candidate surface rotated to watch-only LINK 1h trend-pullback reclaim long n=25 / +0.3856R / PF 1.8118 vs baseline -0.0141R; still low-sample, not high-probability proof.
- Boundary: no Telegram sent; no live trading, orders, exchange mutations, wallet/API/key handling, paid APIs, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution, or strategy promotion changed.

# 2026-09-23T07:30:00Z - RALPH autoresearch loop

- Selected item: `validation.strategy-filter-atas-verifier-status-reconciliation`.
- Verification: `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed `29 / 29`; `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` failed on `ATAS access audit verdict invalid`.
- Result: added `wiki/notes/2026-09-23-strategy-filter-atas-verifier-drift-blocker.md`. The blocker is verifier/status drift: ATAS audit now reports `manual_csv_active__automatic_access_unproven`, while `verify-filter.mjs` only allows older local-access verdicts. Next bounded step is to reconcile the verifier while keeping manual CSV research-only, `canPullDirectlyNow=false`, and no-live/no-install boundaries explicit before the purged/embargo code pass.
- Boundary: no Telegram sent; no live trading, orders, wallet/API/exchange-key handling, paid APIs, account setup, data capture, public posting, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

- 2026-09-23T12:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall 447 closed / -0.0782R / 33.78%, qualified A/B/C 39 closed / -0.0464R / 35.90%, shadow PnL still `shadow_negative_or_unproven`; wick-feedback reports `candidate_ready` for `ETH|5s|UP|tradable_fade|5/5` but candidateAdded=false and no high-probability label is justified.

# 2026-09-23T17:30:00Z - adversarial improvement cron refresh

- Verification: scheduled `ralph-adversarial-improvement-loop` completed and refreshed `outputs/ralph-adversarial-improvement-report.json` and `.md`; verdict remains `proposals_ready_internal`.
- Result: no high/critical findings and Telegram gate stayed closed. Repeated blockers remain proposal-only: low planned-level evidence (`8` frozen events vs `20` gate, `2` public trade windows vs `10` gate), no native purged/embargo split contract yet, walk-forward near-miss pressure, low-sample watch roster, and zero destruction-filter survivors.
- Boundary: no Telegram sent; no live trading, orders, wallet/API/exchange-key handling, paid APIs, public posting, alert wording, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.
- 2026-09-24T04:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall 448 closed / -0.0803R / 33.71%, qualified A/B/C 39 closed / -0.0464R / 35.90%, shadow PnL still `shadow_negative_or_unproven`; candidate surface rotated to watch-only XRP 1h momentum_reversal_long n=11 / +0.3140R / PF 1.7913, low-sample only with no high-probability label.

# 2026-09-24T07:30:00Z - RALPH autoresearch loop

- Selected item: `validation.strategy-filter-atas-verifier-status-reconciliation`.
- Change: updated `experiments/strategy-destruction-filter/src/verify-filter.mjs` so `manual_csv_active__automatic_access_unproven` is an accepted ATAS audit verdict only when manual CSV is explicitly usable, direct automatic pull remains false, and the Bid/Ask Tape schema is present.
- Verification: `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed `29 / 29`; `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed with 131 variants, 0 survivors, and 131 rejected.
- Result: added `wiki/notes/2026-09-24-strategy-filter-atas-verifier-status-reconciliation.md`; moved the queue to `validation.strategy-filter-purged-embargo-split-classifier-implementation`.
- Boundary: no Telegram sent; no live trading, orders, wallet/API/exchange-key handling, paid APIs, account setup, data capture, public posting, alert wording, thresholds, scheduler/cadence, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

- 2026-09-24T16:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall 452 closed / -0.0884R / 33.41% winrate, qualified A/B/C 39 closed / -0.0464R / 35.90%, shadow PnL still `shadow_negative_or_unproven` at 71 filled / -1470 USD gross / 36.62%; candidate surface is mostly kill/avoid with only XRP 1h momentum_reversal_long n=11 / +0.3140R / PF 1.7913 as watch-low-sample, so no high-probability label is justified.

# 2026-09-24T18:12:00Z - RALPH subsystem scheduler setup

- Selected item: `maintenance.ralph-subsystem-scheduler-contracts`.
- Change: added `automation/subsystem-registry.yaml` with explicit subsystem contracts for data/replay refresh, strategy discovery, backtesting lab, DEMO-SIM paper fund, state-of-edge, adversarial critic, trade postmortem, execution readiness, and memory/router maintenance.
- Verification: extended `automation/research-validation-checklist.mjs` with a `subsystemRegistry` check for required fields, active output presence, stale active outputs over 72 hours, and pending queue ownership; `node --check` passed; YAML parse passed with Python `yaml.safe_load`; checklist ran and reported the new subsystem check as warn only because `outputs/evidence-ledger-prioritizer.*` is stale. Existing retrieval index count remains stale (`index=199`, `actual=224`) and paper/demo remains not-ready; this was not caused by the subsystem registry.
- Bridge: ingested and search-verified `wiki/notes/2026-09-24-ralph-subsystem-scheduler-upgrade.md` as `source.ralph-subsystem-scheduler-upgrade`.
- Boundary: no Telegram sent; no new cron jobs; no live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, alert wording, thresholds, watcher behavior, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-24T19:30:00Z - DEMO-SIM paper fund ledger surface

- Selected item: `validation.demo-sim-paper-fund-ledger-implementation` plus `validation.demo-sim-paper-fund-drawdown-and-risk-report`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-paper-fund-ledger.mjs`, producing `results/demo-sim-paper-fund-ledger.json` and `.md` from the historical replay. Added package scripts `demo-sim:ledger` and `demo-sim:all`. Updated the subsystem registry to point at the actual ledger artifacts and moved both queue items to done.
- Result: generated status is `capital_impaired_review_required`: 10,000 USDT starting bankroll, 4,253.94 USDT ending equity, -5,746.06 USDT net PnL after 4,972.00 USDT fees, 452 closed replay trades, 8 open/skipped rows, 31.6% winrate, profit factor 0.8966, and 80.8% max drawdown. `range_breakout_long:long` is the only major positive setup pocket; short setup families remain materially negative.
- Verification: `node --check src/demo-sim-paper-fund-ledger.mjs` passed; `node --check src/historical-demo-sim-replay.mjs` passed; `npm run demo-sim:all --prefix ralph-research-os/experiments/btc-eth-alert-edge` regenerated replay and ledger outputs.
- Boundary: no Telegram sent; no new cron jobs; no live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, alert wording, thresholds, watcher behavior, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-24T19:36:00Z - DEMO-SIM range-breakout BTC risk-on forward gate

- Selected item: `validation.demo-sim-range-breakout-btc-risk-on-forward-gate`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-range-breakout-btc-risk-on-gate.mjs`, producing `results/demo-sim-range-breakout-btc-risk-on-gate.json` and `.md`. Added package script `demo-sim:range-gate` and extended `demo-sim:all` to regenerate replay, ledger, and gate outputs.
- Result: `range_breakout_long + BTC_RISK_ON` is the first pocket that survives a crude August-fit / September-forward gate, with 107 closed trades, +9,265.87 USDT net, 44.9% winrate, PF 1.6956, and 19.6% max drawdown overall. September forward is positive but materially weaker: 38 closed, +1,044.71 USDT net, 28.9% winrate, PF 1.2065, -0.2424 avg R, and 16.8% max drawdown. Verdict is `candidate_survives_forward_gate`, not capital-ready.
- Verification: `node --check src/demo-sim-range-breakout-btc-risk-on-gate.mjs` passed; `npm run demo-sim:all --prefix ralph-research-os/experiments/btc-eth-alert-edge` regenerated replay, ledger, and gate outputs. Updated subsystem registry outputs and moved the queue item to done.
- Boundary: no Telegram sent; no new cron jobs; no live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, alert wording, thresholds, watcher behavior, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-24T19:43:00Z - DEMO-SIM paper signal price precision repair

- Selected item: `validation.demo-sim-replay-signal-price-precision-fix`.
- Change: added `experiments/btc-eth-alert-edge/src/repair-paper-signal-precision.mjs`, producing `results/paper-signal-precision-repair.json` and `.md`. Updated `backtest.mjs` so fresh paper candidate entry/stop/target levels are stored at 8 decimals instead of 2 decimals. Added package script `paper:repair-precision` and extended `demo-sim:all` to repair precision before replay, ledger, and gate generation.
- Result: repaired 69 existing paper-signal rows from cached entry candles and ATR14; bad-risk rows fell from 53 to 0 with 0 skipped. Regenerated ledger remains capital-impaired: 4,542.86 USDT ending equity, -5,457.14 USDT net PnL, 35.6% winrate, PF 0.9038, 0 bad-R records, and 87.8% max drawdown. Regenerated `range_breakout_long + BTC_RISK_ON` still survives the crude forward gate: 107 closed, +9,035.42 USDT net, 50.5% winrate, PF 1.6348, 24.5% max drawdown overall; September forward is +1,287.86 USDT, 36.8% winrate, PF 1.2307, and -0.0265 avg R.
- Verification: `node --check src/backtest.mjs` passed; `node --check src/repair-paper-signal-precision.mjs` passed; `npm run demo-sim:all --prefix ralph-research-os/experiments/btc-eth-alert-edge` regenerated precision repair, replay, ledger, and gate outputs. Updated subsystem registry outputs and moved the queue item to done.
- Boundary: no Telegram sent; no new cron jobs; no live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, alert wording, thresholds, watcher behavior, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

- 2026-09-25T00:04Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall 453 closed / -0.0842R / 33.55% winrate, qualified A/B/C 39 closed / -0.0464R / 35.90%, shadow PnL remains `shadow_negative_or_unproven` at 71 filled / -1470 USD gross / 36.62%; DEMO-SIM replay remains negative overall at 453 closed / -0.129R / 35.8% winrate / PF 0.9141 with `range_breakout_long` still the main positive family at 165 closed / +0.2286R / +9124.99 USDT but with 6 ambiguous rows; candidate actions now include SOL 4h trend_pullback_reclaim_long watch-low-sample n=33 / +0.1790R / PF 1.3151 and XRP 1h momentum_reversal_long watch-low-sample n=11 / +0.3140R / PF 1.7913, so no high-probability or go-live label is justified.
- 2026-09-25T04:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall 454 closed / -0.0863R / 33.48% winrate, qualified A/B/C unchanged at 39 closed / -0.0464R / 35.90%, shadow PnL remains `shadow_negative_or_unproven` at 71 filled / -1470 USD gross / 36.62%; DEMO-SIM replay remains negative overall at 454 closed / -0.131R / 35.7% winrate / PF 0.9107 with `range_breakout_long` still positive but ambiguity-bearing, and the state-of-edge candidate surface dropped the prior XRP 1h long watch while keeping only SOL 4h trend_pullback_reclaim_long and AVAX 1h trend_pullback_reject_short as watch-low-sample, so no high-probability or go-live label is justified.

# 2026-09-25T07:30:00Z - DEMO-SIM replay walk-forward filter grid

- Selected item: `validation.demo-sim-replay-walk-forward-filter-grid`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-walk-forward-filter-grid.mjs`, producing `results/demo-sim-walk-forward-filter-grid.json` and `.md`. Added package script `demo-sim:walk-forward-grid` and extended `demo-sim:all` to regenerate the grid after replay, ledger, and range-gate outputs.
- Result: tested 1008 simple interpretable filters with an August fit window, a 3-day purged boundary on each side of the September split, and a September forward window. Eighteen filters survived as research-only candidates; the top filter was 4h `range_breakout_long` under `BTC_RISK_ON` and tier `B|low-sample`, with 44 fit trades, +6043.41 USDT, PF 1.9951, then 26 post-purge forward trades, +2351.05 USDT, PF 1.6356, and 6.9% max drawdown. This is not capital-ready because the replay is synthetic, the split is short, and the selected filter came from a grid.
- Verification: `node --check src/demo-sim-walk-forward-filter-grid.mjs` passed; `npm run demo-sim:walk-forward-grid --prefix ralph-research-os/experiments/btc-eth-alert-edge` generated outputs; `npm run verify --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed. Moved the queue item to done.
- Boundary: no Telegram sent; no new cron jobs; no live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, alert wording, thresholds, watcher behavior, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

- 2026-09-25T08:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall 455 closed / -0.0821R / 33.63% winrate, qualified A/B/C unchanged at 39 closed / -0.0464R / 35.90%, shadow PnL remains `shadow_negative_or_unproven` at 71 filled / -1470 USD gross / 36.62%; DEMO-SIM replay remains negative overall at 455 closed / -0.1269R / 35.8% winrate / PF 0.9208 with `range_breakout_long` still the main positive but ambiguity-bearing family, and the state-of-edge candidate surface dropped SOL 4h while keeping only AVAX 1h trend_pullback_reject_short as watch-low-sample, so no high-probability or go-live label is justified.
- 2026-09-25T12:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall 457 closed / -0.0739R / 33.92% winrate, qualified A/B/C unchanged at 39 closed / -0.0464R / 35.90%, shadow PnL remains `shadow_negative_or_unproven` at 71 filled / -1470 USD gross / 36.62%; DEMO-SIM replay remains negative overall while BTC_RISK_ON is positive at 159 closed / +0.0961R / +4579.21 USDT with 6 ambiguous rows, and SOL 4h trend_pullback_reclaim_long returned to watch-low-sample alongside AVAX 1h trend_pullback_reject_short, so no high-probability or go-live label is justified.
- 2026-09-25T16:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall 460 closed / -0.0742R / 34.13% winrate, qualified A/B/C unchanged at 39 closed / -0.0464R / 35.90%, shadow PnL remains `shadow_negative_or_unproven` at 71 filled / -1470 USD gross / 36.62%; DEMO-SIM replay remains negative overall at 460 closed / -0.119R / 36.3% winrate / PF 0.9387 while BTC_RISK_ON stays positive at 159 closed / +0.0961R / +4579.21 USDT with 6 ambiguous rows, and only SOL 4h trend_pullback_reclaim_long plus AVAX 1h trend_pullback_reject_short remain watch-low-sample, so no high-probability or go-live label is justified.
- 2026-09-26T00:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall 460 closed / -0.0742R / 34.13% winrate, qualified A/B/C unchanged at 39 closed / -0.0464R / 35.90%, shadow PnL remains `shadow_negative_or_unproven` at 71 filled / -1470 USD gross / 36.62%; DEMO-SIM replay remains negative overall at 460 closed / -0.1188R / 36.3% winrate / PF 0.9396 while `range_breakout_long` remains the positive but ambiguity-bearing family at 165 closed / +0.2286R / +9124.99 USDT, and the watch surface narrowed to AVAX 1h trend_pullback_reject_short only after SOL 4h dropped from watch-low-sample, so no high-probability or go-live label is justified.
- 2026-09-26T04:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall expanded to 468 closed and regressed to -0.0840R / 33.76% winrate, qualified A/B/C is 39 closed / -0.0464R / 35.90%, shadow PnL remains `shadow_negative_or_unproven` at 71 filled / -1470 USD gross / 36.62%; DEMO-SIM replay remains negative overall at 468 closed / -0.1288R / 35.9% winrate / PF 0.9260 while `range_breakout_long` remains the only positive family at 165 closed / +0.2286R / +9124.99 USDT with 6 ambiguous rows, and watch-low-sample candidates shifted to XRP 1h and LINK 1h trend_pullback_reclaim_long without high-probability proof or go-live justification.

# 2026-09-26T13:08:00Z - DEMO-SIM short strategy quarantine and revalidation

- Selected item: `validation.demo-sim-short-strategy-quarantine-and-revalidation`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-short-strategy-quarantine.mjs`, producing `results/demo-sim-short-strategy-quarantine.json` and `.md`. Added package script `demo-sim:short-quarantine` and extended `demo-sim:all` to run precision repair, replay, ledger, range-gate, walk-forward grid, and short quarantine in sequence. Updated subsystem registry outputs and moved the queue item to done.
- Result: all short families remain quarantined. The report tested 20 short buckets with a purged August/September revalidation gate; 0 revalidated even for watch-only. Shorts alone: 193 closed, 44 wins / 149 losses, 22.8% winrate, -13,815.42 USDT net after 2,123 USDT fees, PF 0.4286, avg R -0.4878. Withholding shorts changes the replay surface by +13,815.42 USDT; long-only replay is +9,495.01 USDT net and 19,495.01 USDT ending equity, but still has 52.9% max drawdown, so it is not capital-ready.
- Verification: `node --check src/demo-sim-short-strategy-quarantine.mjs` passed; `npm run demo-sim:all --prefix ralph-research-os/experiments/btc-eth-alert-edge` regenerated all DEMO-SIM outputs. Current full ledger remains `capital_impaired_review_required`: 5,679.59 USDT ending equity, -4,320.41 USDT net, 35.9% winrate, PF 0.926, 87.8% ledger max drawdown. Walk-forward top survivor remains `range_breakout_long` / `BTC_RISK_ON` / `4h` / `B|low-sample`, with post-purge forward +2,351.05 USDT and PF 1.6356.
- Boundary: no Telegram alert logic, live watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, thresholds, risk/sizing/TP/SL, execution behavior, strategy promotion, scheduler cadence, or new cron jobs changed.

# 2026-09-26T13:20:00Z - Strategy filter purged/embargo split classifier

- Selected item: `validation.strategy-filter-purged-embargo-split-classifier-implementation`.
- Change: implemented explicit `purged_embargo_entry_time` split accounting in `experiments/strategy-destruction-filter/src/engine.mjs`. Candidate and time-matched baseline trades now use the same split classifier around the 70/30 split; rows inside the purge/embargo boundary are kept as accounting rows but excluded before metrics, walk-forward diagnostics, survivor shapes, and rejected-ledger outputs. Added per-verdict `splitMetadata`, updated `config.default.json`, report rendering, verifier assertions, and tests. Also added latest-local-cache fallback in `src/market-data.mjs` after a Bybit public rate-limit (`retCode 10006`) blocked exact-window refresh.
- Result: regenerated filter report remains strictly non-promotional: 13 candidates, 131 variants, 0 survivors, 0 survivor shapes, 131 rejected. Total candidate purged-boundary rows excluded: 379. Backtest readiness audit now passes 11/11 and reports `ready_for_research_only_validation`. Drift report downgraded the prior baseline survivor shape to rejected with `weak_walk_forward_out_of_sample`; verdict remains `zero_survivor_shapes_no_promotion`.
- Verification: `node --check` passed for touched scripts; `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed 31/31; `npm run filter && npm run audit:backtest && npm run drift:filter && npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed.
- Boundary: no thresholds, scheduler, alert wording, live watcher behavior, data capture, account/key/API access, paid service, execution, public posting, sizing, TP/SL, strategy promotion, live orders, wallet/API/exchange-key handling, or cron jobs changed.

# 2026-09-26T17:25:00Z - PDH/PDL BTC-gated liquidity sweep long kill test

- Selected item: `validation.pdh-pdl-btc-gated-liquidity-sweep-long-kill-test`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-pdh-pdl-liquidity-sweep-long.mjs`, producing `results/demo-sim-pdh-pdl-liquidity-sweep-long.json` and `.md`. Added package script `demo-sim:pdh-pdl-sweep`; did not add it to scheduled or `demo-sim:all` chains.
- Result: verdict `survives_first_kill_test`, not promoted. September forward sweep/reclaim under BTC_RISK_ON: 99 trades, 60.61% winrate, +7044.59 USDT per 10k toy equity, PF 1.6579, 22.48% max drawdown. Touch-only baseline forward: 191 trades, 55.50% winrate, +6260.02 USDT per 10k, PF 1.2966, 35.59% max drawdown. Forward lift was +784.57 USDT per 10k and +0.3613 PF delta, but full-history sweep/reclaim stayed negative at -22645.05 USDT per 10k, PF 0.7781, and 239.44% max drawdown.
- Interpretation: keep as a research-only watch candidate for harsher purged monthly walk-forward, PDH-vs-PDL split, session-definition sensitivity, drawdown, symbol-concentration, and range-breakout comparison. No alert/capital readiness.
- Verification: `npm run demo-sim:pdh-pdl-sweep --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed. `node ralph-research-os/automation/research-validation-checklist.mjs` ran; queue integrity passed, but overall checklist remains failed because of existing maintenance drift/stale outputs/cron warnings and paper-demo not-ready state.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-26T17:32:00Z - PDH/PDL second-gate walk-forward

- Selected item: `validation.pdh-pdl-second-gate-walk-forward`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-pdh-pdl-second-gate-walk-forward.mjs`, producing `results/demo-sim-pdh-pdl-second-gate-walk-forward.json` and `.md`. Added package script `demo-sim:pdh-pdl-second-gate`; did not add it to scheduled or `demo-sim:all` chains.
- Result: second gate rejects PDH/PDL promotion. Best sweep variant was `sweep_reclaim|pdh_reclaim_long|session_8h`, with 785 walk-forward trades, +16050.85 USDT per 10k toy equity, PF 1.2606, but only 2/5 positive forward months and 117.91% max drawdown. Best touch-only baseline was stronger: `touch_baseline|pdh_touch_hold|session_8h`, 1577 trades, +42877.06 per 10k, PF 1.3869. True PDL sweep/reclaim variants were negative across tested sessions.
- Interpretation: the cheap-test edge was mostly PDH reclaim, not true PDL liquidity sweep. Downgrade PDH/PDL to rejected/watch-only reference; next route is `btc-risk-on-opening-range-breakout-continuation`.
- Verification: `npm run demo-sim:pdh-pdl-second-gate --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-26T17:30:22Z - adversarial improvement cron refresh

- Verification: scheduled `ralph-adversarial-improvement-loop` completed and refreshed `outputs/ralph-adversarial-improvement-report.json` and `.md`; verdict is `needs_attention_internal`.
- Result: new HIGH `backtest-hygiene-gap`: backtest report is missing `chronological split`. Smallest proposed action is `repair-backtest-hygiene`: restore missing anti-overfit report sections, then validate with `npm run filter` and `npm run verify`. Medium proposal-only pressure remains on planned-level sample size, fetched trade windows, native purged/embargo contract, walk-forward near misses, and low-sample watch rows.
- Telegram gate: notify Tomas because high/critical internal issue list contains `backtest-hygiene-gap`. Delivery metadata returned Telegram messageId `7009`; direct `sessions_history` verification was blocked by tree-restricted visibility.
- Boundary: research/proposal only; no live trading, orders, wallet/API/exchange-key handling, paid APIs, public posting, live alert wording changes, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-26T20:15:00Z - range-breakout survivor stress

- Selected item: `validation.demo-sim-range-breakout-survivor-stress`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-range-breakout-survivor-stress.mjs`, producing `results/demo-sim-range-breakout-survivor-stress.json` and `.md`. Added standalone package script `demo-sim:range-breakout-stress`; did not add it to `demo-sim:all` or any cron/scheduler payload.
- Result: verdict `narrow_paper_watch_research_candidate`. Selected `range_breakout_long + BTC_RISK_ON`: 107 closed, +9035.42 USDT per 10k toy equity, PF 1.6348, 24.54% max drawdown, 6 ambiguous rows. Known top pocket `4h + B|low-sample`: 70 closed, +8394.46 USDT, PF 1.8590, 28.02% max drawdown, 6 ambiguous rows. It stayed positive after removing best symbol, best month, and best week, and under double-fee / extra-cost stresses.
- Blockers: top-pocket drawdown exceeds the 25% capital-readiness gate; extra 20 bps round-trip cost stress raises top-pocket drawdown to 30.8%; ambiguous selected rows are -2379.60 USDT under SL-first scoring; worst top-pocket loss cluster is -5236.30 USDT; best week 2026-W34 contributes +6123.72 USDT. Keep only as paper-watch/research candidate, with no live or DEMO sizing promotion.
- Verification: `node --check src/demo-sim-range-breakout-survivor-stress.mjs` passed; `npm run demo-sim:range-breakout-stress --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- Telegram result message was accepted by the OpenClaw Telegram plugin as messageId `7024`; visible delivery could not be independently verified because `openclaw message read --channel telegram` returned `Unsupported Telegram action: read`.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-27T07:30:00Z - DEMO-SIM paper fund state refresh

- Selected item: `validation.demo-sim-paper-fund-state-refresh`, a bounded reconciliation pass because the named paper-fund and backtesting-lab priority queue items were already marked done.
- Change: re-ran the existing `demo-sim:all` chain only; no new script, note, queue item, threshold, scheduler, watcher, or strategy logic was added.
- Result: current replay expanded to 480 closed trades and remains `capital_impaired_review_required`: ending equity 5909.30 USDT, -4090.70 USDT net, 35.63% winrate, PF 0.9315, fees 5280.00 USDT, and 87.82% ledger max drawdown. Shorts remain the main damage source and stay quarantined: 197 short records, -14164.31 USDT net, PF 0.4225, 0/20 short families revalidated even for watch-only. Long-only/shorts-withheld improves to 20073.61 USDT ending equity but still has 52.91% max drawdown, so it is not capital-ready. The narrow survivor remains 4h `range_breakout_long` under `BTC_RISK_ON` and tier `B|low-sample`, with 26 post-purge forward trades, +2351.05 USDT, PF 1.6356, and 6.94% max drawdown.
- Verify/Reassess: the bundle passed end-to-end. Verdicts are internally consistent: whole paper fund impaired, short families quarantined, and the long survivor stays research/watch-only because evidence is synthetic, selected from a grid, and not promoted through a live/demo sizing gate. This is useful for state hygiene but not worth a Telegram notification.
- Verification: `npm run demo-sim:all --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- Boundary: no Telegram sent; no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-27T08:10:24Z - Impulse cooldown purged forward test

- Selected item: `validation.impulse-cooldown-purged-forward-test`.
- Change: added `experiments/btc-eth-alert-edge/src/demo-sim-impulse-cooldown-purged-forward-test.mjs`, producing `results/demo-sim-impulse-cooldown-purged-forward-test.json` and `.md`. Added standalone package script `demo-sim:impulse-cooldown-forward`; did not add it to `demo-sim:all` or any cron/scheduler payload.
- Result: verdict `postmortem_viable_only_forward_not_confirmed`, viability tag `postmortem_viable_only`. The target-symbol prior-72h return >25% skip improved the full postmortem sample but failed the purged-forward slice: baseline forward was 41 trades, +1207.55 USDT, PF 1.1956, 13.45% max drawdown; target-skip forward was 36 trades, +398.96 USDT, PF 1.0770, 16.80% max drawdown. Do not tag this as `viable_forward_validation_candidate`.
- Verification: `node --check src/demo-sim-impulse-cooldown-purged-forward-test.mjs` passed; `npm run demo-sim:impulse-cooldown-forward --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed. `demo-sim:all` remains unchanged and excludes the impulse cooldown scripts.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-27T16:05:00Z - Weekly maintenance

- Scope: `ralph-weekly-maintenance` internal maintenance only.
- Context: `session_status` reported 0/200k context and 0 compactions.
- Service health: `node crypto-updates/service-health-check.mjs` passed; `crypto-updates-market-watcher.service` and `bybit-execution-reactor.service` are active/running, with 0 OOM kills, 0 duplicate alert clusters, watcher restarts 0, reactor restarts 1, and no Tomas notification gate.
- Validation: YAML/JSON parse passed for RALPH routing/state files and service-health report. Initial checklist failed on stale catalog count (`index.yaml` 229 wiki pages vs 240 actual) and stale prioritizer outputs.
- Repair: updated `index.yaml` `total_wiki_pages` to 240 and refreshed catalog timestamp; updated generated `index.md` timestamp; refreshed `outputs/evidence-ledger-prioritizer.*` and `outputs/research-validation-checklist.*`.
- Verification: final checklist is `warn`, not `fail`: retrieval, path refs, queues, subsystem registry, delivery, HITL quality, loop quality, handoff readiness, note frontmatter, and boundary delta pass. Remaining non-action states are cron warning from local state and paper/demo not-ready (`AVAX range_breakdown_short down/low-vol` 0/20 exact forward-paper rows).
- Cron health: live cron tool visibility in this isolated run exposed only the maintenance job; it is enabled/running with 0 consecutive errors. Local `loop-state.yaml` still records `liquid-crypto-alert-edge-backtest` at 5 consecutive rate-limit errors plus payload drift requiring explicit scheduler-change approval before repair; no scheduler mutation was attempted.
- Boundary: no Telegram sent; no new wiki note; no bridge ingest needed; no scheduler/cron changes, live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, demo/testnet setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.

# 2026-09-27T17:30:25Z - adversarial improvement cron repeated blocker

- Verification: scheduled `ralph-adversarial-improvement-loop` completed and refreshed `outputs/ralph-adversarial-improvement-report.json` and `.md`; verdict is `needs_attention_internal`.
- Result: repeated HIGH `backtest-hygiene-gap`: backtest report is still missing `chronological split`. Smallest proposed action remains `repair-backtest-hygiene`: restore missing anti-overfit report sections, then validate with `npm run filter` and `npm run verify`. Medium proposal-only pressure remains on planned-level sample size, fetched trade windows, native purged/embargo contract, walk-forward near misses, and low-sample watch rows.
- Telegram gate: notify Tomas because the high internal issue repeats. OpenClaw Telegram plugin accepted the Czech summary as messageId `7107`; visible delivery could not be independently verified from this tree-restricted cron session.
- Boundary: research/proposal only; no live trading, orders, wallet/API/exchange-key handling, paid APIs, public posting, live alert wording changes, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.
- 2026-09-28T00:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall is 487 closed / -0.0859R / 34.09% winrate, qualified A/B/C is 41 closed / -0.0646R / 36.59%, shadow PnL remains `shadow_negative_or_unproven` at 71 filled / -1470 USD gross / 36.62%; DEMO-SIM replay remains negative overall at 487 closed / -0.1333R / 36.1% winrate / PF 0.9442 while `range_breakout_long` stays the main positive but ambiguity-bearing family at 167 closed / +0.2217R / +9056.84 USDT, and the watch-low-sample surface rotated to XRP 4h `momentum_reversal_long` n=10 / +0.7116R / PF 3.5457 with no high-probability or go-live label justified.

# 2026-09-28T07:30:00Z - DEMO-SIM range-breakout baseline lift check

- Selected item: `validation.demo-sim-range-breakout-baseline-lift-check`, a bounded continuation because the named paper-fund and backtesting-lab priority queue items are already marked done.
- Change: re-ran the existing `demo-sim:all` chain and added one durable note, `wiki/notes/2026-09-28-demo-sim-range-breakout-baseline-lift-check.md`, comparing the current `range_breakout_long + BTC_RISK_ON + 4h + B|low-sample` pocket against no-trade and broader BTC-risk-on baselines. Updated the `btc_eth_alert_edge` router status and loop state.
- Result: full paper fund remains `capital_impaired_review_required`: 490 closed trades, ending equity 5868.50 USDT, -4131.50 USDT net, 35.71% winrate, PF 0.9320, fees 5390.00 USDT, and 85.85% ledger max drawdown. Shorts remain quarantined: 198 records, -14469.77 USDT, PF 0.4162, 0/20 revalidated. Long-only/shorts-withheld improves to +10338.27 USDT but still has 52.26% max drawdown.
- Baseline lift: selected pocket still has 26 post-purge forward trades, +2351.05 USDT, PF 1.6356, and 6.94% max drawdown. It beats no-trade by +2351.05 USDT, all long setups / 4h / B|low-sample by +1305.62 USDT and +0.4600 PF with 13.98 percentage points lower drawdown, and all directions / 4h / B|low-sample by +1934.90 USDT and +0.5761 PF with 18.58 percentage points lower drawdown.
- Verify/Reassess: useful research-watch signal remains, but no promotion is justified because the replay is synthetic, the policy was grid-selected, forward sample is 26 trades, and the account surface is impaired. No Telegram notification gate met.
- Verification: `npm run demo-sim:all --prefix experiments/btc-eth-alert-edge` passed.
- Boundary: no Telegram sent; no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, TradingView automation, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.
- 2026-09-28T08:05Z liquid alert-edge refresh: outputs refreshed; state-of-edge remains `no_trade_watch_low_sample`; paper overall regressed to 488 closed / -0.1010R / 33.20% winrate, qualified A/B/C to 43 closed / -0.1081R / 34.88% winrate, shadow PnL remains `shadow_negative_or_unproven` at 71 filled / -1470 USD gross / 36.62%; DEMO-SIM replay remains negative at 488 closed / -0.148R / 35.7% winrate / PF 0.9284 while `range_breakout_long` remains the main positive but ambiguity-bearing family at 167 closed / +0.2217R / +9056.84 USDT; no high-probability or go-live label justified.

# 2026-09-28T14:55:59Z - adversarial backtest-hygiene reconciliation

- Scope: manual repair of the repeated adversarial `backtest-hygiene-gap` after Tomas approved this as the next RALPH work item.
- Finding: the strategy-destruction filter already emits `evaluation.split.method=purged_embargo_entry_time`, `antiOverfitControls`, and Markdown `## Anti-Overfit / Split Hygiene`; `verify-filter.mjs` already asserts the anti-overfit section. The adversarial critic was stale: it only accepted old `chronological_entry_time` and always emitted `purged-split-not-yet-native`.
- Change: updated `automation/ralph-adversarial-improvement-loop.mjs` to accept `purged_embargo_entry_time` as a chronological split, require native purged-boundary accounting when that method is active, and suppress the purged-split warning when native accounting is present.
- Verification: `node --check ralph-research-os/automation/ralph-adversarial-improvement-loop.mjs`, `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` (31/31), `npm run filter`, `npm run drift:filter`, `npm run verify`, and `node ralph-research-os/automation/ralph-adversarial-improvement-loop.mjs` all passed.
- Result: adversarial report is now `proposals_ready_internal`, `critical=0`, `high=0`, `notifyTomas=false`; remaining findings are medium watch items only: 6 walk-forward near misses and 3 low-sample watch rows.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, demo/testnet setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-28T15:14:32Z - walk-forward near-miss sidecar

- Scope: manual follow-up on the remaining adversarial medium proposal `walk-forward-near-miss-sidecar`, after confirming the next repaired `liquid-crypto-alert-edge-backtest` scheduled output was not yet available before the 16:00 UTC run.
- Change: added `experiments/strategy-destruction-filter/src/run-walk-forward-near-miss-sidecar.mjs` and npm script `sidecar:walk-forward-near-miss`; generated `results/walk-forward-near-miss-sidecar.json` and `.md`. Updated `automation/ralph-adversarial-improvement-loop.mjs` so a fresh sidecar matching the current `filter-report.json` suppresses the sidecar proposal while keeping walk-forward pressure visible.
- Result: sidecar verdict `near_misses_visible_no_threshold_change`. The 6 near misses are all AVAX 1h range-breakdown short variants; best OOS expectancy is 0.0761R, but each has only 1/2 required diagnostic OOS folds and fold 5 is weak, with worst fold expectancy -0.1912R. Latest adversarial report remains `proposals_ready_internal`, `critical=0`, `high=0`, `notifyTomas=false`; only `watch-row-aging-ledger` remains as an actionable proposal.
- Verification: `node --check ralph-research-os/experiments/strategy-destruction-filter/src/run-walk-forward-near-miss-sidecar.mjs`, `node --check ralph-research-os/automation/ralph-adversarial-improvement-loop.mjs`, `npm run sidecar:walk-forward-near-miss --prefix ralph-research-os/experiments/strategy-destruction-filter`, `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`, and `node ralph-research-os/automation/ralph-adversarial-improvement-loop.mjs` passed.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, paper alert logic, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, demo/testnet setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-28T16:05:10Z - repaired alert-edge cron verified

- Verification: the first scheduled `liquid-crypto-alert-edge-backtest` run after the `demo-sim:all` payload repair ran at `2026-09-28T16:03:09Z` and finished `ok` at `2026-09-28T16:05:10Z`. Cron history and local mtimes confirm requested outputs were refreshed around `16:03-16:04Z`.
- Result: state-of-edge remains `no_trade_watch_low_sample`; paper overall is 488 closed / -0.0895R / 33.61% winrate, qualified A/B/C is 43 closed / -0.1081R / 34.88%, shadow PnL remains `shadow_negative_or_unproven` at 72 filled / -1440 USD gross, and DEMO-SIM paper fund remains `capital_impaired_review_required` with ending equity 7021.60 USDT, PF 0.9511, and 85.32% max drawdown.
- Interpretation: scheduler repair is operationally verified; no go-live or high-probability label is justified. Range-breakout BTC-risk-on remains research/watch-only and shorts remain quarantined.
- Boundary: no Telegram notification gate met; no live execution, scheduler mutation, watcher/paper alert logic change, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-28T16:13:04Z - watch-row aging ledger

- Scope: manual follow-up on the remaining adversarial medium proposal `watch-row-aging-ledger`.
- Change: added `automation/watch-row-aging-ledger.mjs`, producing `outputs/watch-row-aging-ledger.json` and `.md`. Updated `automation/ralph-adversarial-improvement-loop.mjs` so a fresh ledger matching the current state-of-edge report suppresses the ledger proposal while keeping low-sample pressure visible.
- Result: ledger verdict `watch_rows_active_low_sample_no_promotion`: 3 active watch rows, 0 decaying before sample gate, 0 sample-gate reached, min active sample gap 15. Active rows are ADA 4h momentum_reversal_long, LINK 4h trend_pullback_reclaim_long, and AVAX 4h trend_pullback_reject_short. Latest adversarial report is now `no_action_needed`, `critical=0`, `high=0`, `proposals=0`, `notifyTomas=false`.
- Verification: `node --check ralph-research-os/automation/watch-row-aging-ledger.mjs`, `node --check ralph-research-os/automation/ralph-adversarial-improvement-loop.mjs`, `node ralph-research-os/automation/watch-row-aging-ledger.mjs`, `node ralph-research-os/automation/ralph-adversarial-improvement-loop.mjs`, `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`, and `loop-state.yaml` parse passed.
- Boundary: no scheduler or cron payload changes; no live alerts, watcher behavior, paper alert logic, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, demo/testnet setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-28T18:38:48Z - scheduled loop rate-limit recovery

- Finding: scheduled `ralph-state-of-edge-daily` and `ralph-adversarial-improvement-loop` failed during the Codex subscription usage-limit window. State-of-edge retried from 17:15:00Z to 17:21:54Z; adversarial retried from 17:30:00Z to 17:36:54Z. Error reason was rate_limit.
- Recovery: manually reran `state-of-edge-report.mjs`, refreshed `watch-row-aging-ledger.mjs`, reran `ralph-adversarial-improvement-loop.mjs`, and verified `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter`.
- Result: state-of-edge remains `no_trade_watch_low_sample`; watch-row aging ledger remains `watch_rows_active_low_sample_no_promotion` with 3 active rows, 0 decaying, 0 sample-gate reached; adversarial report remains `no_action_needed`, `critical=0`, `high=0`, `proposals=0`, `notifyTomas=false`. Verification reports `adversarialImprovementVerdict=no_action_needed`.
- Cleanup: updated roadmap/current map/research map to mark the repaired `demo-sim:all` alert-edge cron verified, then refreshed `outputs/research-validation-checklist.*`; checklist remains `warn` with retrieval/path/queues/subsystems/delivery/HITL/loop/handoff/frontmatter/boundary passing and paperDemo still not-ready.
- Boundary: no scheduler config changes; no live alerts, watcher behavior, paper alert logic, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, demo/testnet setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-28T21:20:34Z - evidence prioritizer validation triage

- Scope: bounded continuation from `continuation-prompts/2026-09-28-2110-ralph-next-work-handoff.md`; research/paper-only, watch-only, no live execution.
- Refresh: ran `node ralph-research-os/automation/evidence-ledger-prioritizer.mjs`, `node ralph-research-os/automation/research-validation-checklist.mjs`, and `node ralph-research-os/automation/watch-row-aging-ledger.mjs`.
- Result: prioritizer reports `pendingItems=0`, `readyNow=0`, `watchUntilThreshold=1`, and top ready route `none`. The remaining threshold watch is `ta-call-candidates-20-row-threshold` with the largest TA call bucket still `9/20`.
- Validation: checklist remains `warn` with all integrity checks passing except expected `paperDemo: not-ready`; AVAX 1h `range_breakdown_short` exact forward-paper rows remain `0/20`.
- Watch ledger: `watch_rows_active_low_sample_no_promotion` with 2 active rows, 0 decaying, 0 sample-gate reached, min active sample gap 15. ADA 4h momentum reversal long and LINK 4h trend pullback reclaim long remain active; AVAX 4h trend pullback reject short is now `not_seen_current`.
- Decision: do not start planned-level/Binance aggTrades expansion or range-breakout survivor postmortem from this state. Stand down until the next scheduled loop or until a threshold gate, named trigger, or explicit HITL approval creates fresh evidence.
- Boundary: no scheduler config changes; no live alerts, watcher behavior, paper alert logic, live execution, orders, wallet/API/exchange-key handling, paid APIs, account setup, demo/testnet setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-28T21:34:00Z - orderflow data-rail dig

- Scope: data-access research for orderflow usable in backtesting/demo-sim and live-alert research; no code path, scheduler, or live/paper logic changes.
- Finding: Binance USD-M futures public archives are better than the earlier spot-only rail. S3 listing shows `aggTrades`, `trades`, `bookDepth`, `bookTicker`, `metrics`, mark/index/premium klines, and normal klines under `data/futures/um/daily/`; spot daily listing only exposes `aggTrades`, `trades`, and `klines`.
- Access verification: Binance USD-M futures `BTCUSDT` `trades` and `bookDepth` for `2025-01-01` returned HTTP 200. `bookDepth` parsed as `timestamp,percentage,depth,notional`, giving coarse historical depth/liquidity bands rather than full L2 replay.
- Tardis check: official HTTP API supports historical raw `trade` and `depth` feeds; no-key first-day-of-month sample access works, and a Binance `trade` sample for `2024-03-01T00:03Z` returned real rows. Full coverage requires API key/subscription; current site pricing showed minimum order `$300`.
- Bybit/Hyperliquid check: Bybit V5 recent trades works no-key but remains recent-only from verified API access; Hyperliquid current `recentTrades` and `l2Book` work no-key, while historical S3 remains requester-pays/needs-tooling because local `aws` and `lz4` are absent.
- Updated `wiki/notes/2026-09-28-historical-orderflow-data-rails.md` with the new access map and recommendation.
- Recommendation: next orderflow branch should be a Binance USD-M futures archive batch over frozen demo-sim/live-alert review windows, joining `trades`/`aggTrades` with `bookDepth` liquidity bands and comparing to candle-only/proxy baselines. Tardis no-key samples should be used as a true trade+depth schema/proof benchmark only; no recurring job or live/demo feature injection until the batch proves stable lift.
- Boundary: no scheduler config changes; no live alerts, watcher behavior, paper alert logic, live execution, orders, wallet/API/exchange-key handling, paid APIs/account setup, demo/testnet setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-28T22:05:07Z - USD-M orderflow DEMO-SIM batch

- Scope: implemented the recommended Binance USD-M archive batch as research-only plumbing over frozen DEMO-SIM rows; no strategy tuning or alert/demo integration.
- Change: added `experiments/btc-eth-alert-edge/src/binance-usdm-archive.mjs`, `experiments/strategy-destruction-filter/src/run-usdm-orderflow-demo-sim-batch.mjs`, npm script `study:usdm-orderflow-demo-sim`, and outputs `results/usdm-orderflow-demo-sim-batch.json/.md`. Added verifier assertions in `verify-filter.mjs`.
- Finding: USD-M `bookDepth` CSV timestamps are string datetimes, not numeric timestamps; parser now handles both trade numeric timestamps and book-depth strings. The first naive 3-window run hit Node heap pressure from retaining full parsed daily archives; the runner now parses only requested windows from disk-cached CSVs.
- Result: default batch analyzed 3 frozen closed DEMO-SIM rows and joined all 3 to public/no-key USD-M trades plus coarse percentage-band `bookDepth`. Verdict `usdm_archive_features_sample_ready_no_promotion`; tiny sample had 2 absorption-proxy rows and 1 liquidity-thinning proxy row, treated as plumbing smoke only.
- Verification: `node --check` for the adapter and runner, `npm run study:usdm-orderflow-demo-sim --prefix ralph-research-os/experiments/strategy-destruction-filter`, and `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed.
- Boundary: no scheduler config changes; no live alerts, watcher behavior, paper/demo alert logic, live execution, orders, wallet/API/exchange-key handling, paid APIs/account setup, demo/testnet setup, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-09-28T22:20:00Z - research lane folders for data/tool/pricing decisions

- Scope: organizational pass after Tomas asked for folders for orderflow research, other metrics/tools, pricing logs, ATAS+Tardis workflow, and copytrading research.
- Change: added `research-lanes/` with `orderflow/`, `metrics/`, `vendor-access-pricing/`, and `copytrading/` folders. Added lane README files, `orderflow/atas-tardis-workflow.md`, `metrics/metric-tool-map.md`, `vendor-access-pricing/pricing-watchlist.md`, and `copytrading/tool-access-map.md`.
- Pricing/access logged from official/vendor pages observed on 2026-09-28: Tardis minimum order `$300` and all-exchanges monthly example `$2,200/month`; ATAS Start free plus paid tiers `EUR 19.95/39.95/49.95` per month; CoinGlass API from `$29/month`; Nansen Pro `$69/month` monthly or `$49/month` annual equivalent; Dune paid pricing change to `$75/month` monthly / `$65/month` annual after Oct 21; Copin copy fee examples; GMGN copy settings and no-open-data-API caveat.
- Interpretation captured: ATAS plus Tardis is a labeling/falsification workflow, not a direct edge. Tardis provides deterministic historical trade/depth replay; ATAS provides visual footprint/cluster review. Copytrading folder is for research, tools, and paper-only gates, not live copying.
- Routing: updated `wiki/research-map.md` and `automation/retrieval-router.yaml` so future workers start from the new lane folders before broad scans or buy/build proposals.
- Verification: `loop-state.yaml` and `retrieval-router.yaml` parse; `node ralph-research-os/automation/research-validation-checklist.mjs` passed with expected `warn` state only (`paperDemo` not-ready and non-blocking cron warning); `openclaw wiki lint` reported 0 errors and 30 pre-existing bridge-wiki warnings, none from the new `research-lanes/` files.
- Boundary: no scheduler config changes; no live alerts, watcher behavior, paper/demo alert logic, live execution, orders, wallet/API/exchange-key handling, paid APIs/account setup, wallet connection, live copytrading, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

- 2026-09-29T00:05Z liquid alert-edge refresh: required outputs refreshed; state-of-edge changed from the last logged `no_trade_watch_low_sample` to `no_trade_negative_edge`; paper overall 487 closed / -0.0819R / 33.88% winrate, qualified A/B/C 43 closed / -0.1081R / 34.88%, shadow PnL remains `shadow_negative_or_unproven` at 72 filled / -1440 USD gross; DEMO-SIM remains capital-impaired overall while the 4h `range_breakout_long` + `BTC_RISK_ON` + `B|low-sample` walk-forward pocket still survives research-only grid checks, shorts remain quarantined, and no high-probability or go-live label is justified.
- 2026-09-29T04:05Z liquid alert-edge refresh: required outputs refreshed; verdict remains `no_trade_negative_edge`; paper overall 490 closed / -0.0875R / 33.67% winrate, qualified A/B/C 44 closed / -0.0648R / 36.36%, shadow PnL remains `shadow_negative_or_unproven` at 72 filled / -1440 USD gross; DEMO-SIM all-replay remains capital-impaired (-3348.36 USD net, PF 0.946), shorts remain quarantined, and the 4h `range_breakout_long` + `BTC_RISK_ON` + `B|low-sample` pocket still survives research-only walk-forward checks (26 forward closed, +2351.05 USD net, PF 1.6356) without high-probability or go-live promotion.
- 2026-09-29T08:06Z liquid alert-edge refresh: required outputs refreshed; verdict changed back to `no_trade_watch_low_sample`; paper overall 488 closed / -0.0953R / 33.40% winrate, qualified A/B/C unchanged at 44 closed / -0.0648R / 36.36%, shadow PnL remains `shadow_negative_or_unproven` at 72 filled / -1440 USD gross; DEMO-SIM all-replay remains capital-impaired (-3939.85 USD net, PF 0.9366), shorts remain quarantined, and the 4h `range_breakout_long` + `BTC_RISK_ON` + `B|low-sample` pocket still survives research-only walk-forward checks (26 forward closed, +2351.05 USD net, PF 1.6356) without high-probability or go-live promotion.

# 2026-10-03T07:35:41Z - DEMO-SIM paper-fund drawdown/risk report

- Scope: `validation.demo-sim-paper-fund-drawdown-and-risk-report`; research/paper-only, no live execution, no keys/accounts/paid APIs, no scheduler or alert changes.
- Change: extended `experiments/btc-eth-alert-edge/src/demo-sim-paper-fund-ledger.mjs` so the existing ledger output now includes capital remaining, fee drag, fees as share of loss, worst consecutive loss streak, worst 25/50-trade windows, and 25/50/75/90% drawdown tripwires. Refreshed `results/demo-sim-paper-fund-ledger.json` and `.md`.
- Result: full-surface verdict is `paper_fund_capital_impaired_stop_and_rebuild_required`: 485 closed trades from 500 source records, 2531.62 USDT ending equity from 10000.00 USDT starting capital, -7468.38 USDT net after 5335.00 USDT fees, 35.05% winrate, PF 0.8832, 90.36% max drawdown, 25.32% capital remaining, fees at 53.35% of starting capital and 71.43% of net loss, worst loss streak 20 trades / -2441.74 USDT, worst 25-trade window -4991.90 USDT, worst 50-trade window -7358.29 USDT. All 25/50/75/90% drawdown tripwires are breached.
- Reassess: the full DEMO-SIM replay surface is not capital-ready and should be treated as a damaged paper fund. Long-only positive pockets can continue through separate walk-forward and drawdown-containment research, but the combined surface must not receive promotion language.
- Verification: `node --check src/demo-sim-paper-fund-ledger.mjs` and `npm run demo-sim:ledger` passed. `automation/loop-state.yaml` parse passed.
- Boundary: no live/demo sizing, watcher/paper alert logic, scheduler, threshold, TP/SL, execution, account/key/API, paid source, public posting, or strategy promotion changed.

# 2026-09-29T16:45:00Z - balanced USD-M absorption validation

- Scope: resumed `usdm-absorption-balanced-manifest-validation` as research-only orderflow validation; no live/paper/demo alert behavior, scheduler, execution, keys, paid service, sizing, TP/SL, risk, or strategy-promotion changes.
- Change: added 60-row frozen balanced manifest output and reran Binance USD-M public/no-key `trades` plus `bookDepth` joins. Updated the USD-M archive adapter to parse large decompressed CSV archives in chunks after a high-volume daily file exceeded Node's max string size. Added row progress output and symbol/date soft caps to the runner.
- Outputs: `experiments/strategy-destruction-filter/results/usdm-orderflow-balanced-manifest.json/.md`, refreshed `experiments/strategy-destruction-filter/results/usdm-orderflow-demo-sim-batch.json/.md`, and saved `wiki/notes/2026-09-29-balanced-usdm-absorption-validation.md`.
- Result: 60/60 rows joined to both trades and bookDepth. Verdict `balanced_usdm_archive_absorption_watch_only_no_promotion`. Absorption mean R was `0.0044` vs unflagged `-0.5736`; outside the original cluster, the only qualifying comparable bucket showed lift `0.9526R` across 5 rows.
- Decision: absorption did not trigger the context-only kill condition, but the comparable evidence is far too small for a candidate. Liquidity-thinning had no comparable flagged bucket. Aligned CVD overlaps heavily with absorption in the qualifying bucket. No promotion.
- Verification: `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed.

# 2026-10-03T16:52:00Z - market bot reverse-engineering source map

- Scope: first bounded pass for `discovery.market-bot-reverse-engineering-source-map`; public docs/repos only, research-only prior-art extraction.
- Output: added `wiki/notes/2026-10-03-market-bot-reverse-engineering-source-map.md` and moved the discovery queue item from pending to done.
- Result: public bot/product/repo landscape clusters around grid/range, DCA, market making, TA/breakout rules, signal marketplaces, wallet/copy tracking, AI/operator shells, and event-driven validation frameworks. No source became a strategy candidate. Useful output is a set of kill-test templates for grid, DCA, market making, signal marketplace, and wallet-copy claims.
- Decision: do not create a recurring bot-market scan yet; first prove one extracted claim produces reusable falsifier output. Best next manual branch, if continuing this lane, is a tiny `grid_range_claim_falsifier` or `market_making_spread_claim_falsifier`.
- Boundary: no live trading, orders, keys, paid APIs, account setup, wallet connection, credentialed scraping, scheduler/cron change, watcher behavior, alert wording, paper/demo alert logic, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion changed.

# 2026-10-03T17:18:00Z - state-of-edge cron recovery verified

- Check: inspected live OpenClaw cron state/history for `ralph-state-of-edge-daily` after the 17:15 UTC scheduled slot.
- Result: scheduled run at `2026-10-03T17:15:00Z` finished `ok` with summary `NO_TELEGRAM_UPDATE`, next run `2026-10-04T17:15:00Z`, and consecutive errors reset to `0`.
- State update: refreshed `automation/loop-state.yaml` for the state-of-edge cron only. The adversarial cron was not yet due; its recovery still needs verification after `2026-10-03T17:30:00Z`.
- Boundary: no scheduler config, cron payload, live alerts, watcher behavior, paper/demo alert logic, live execution, orders, wallet/API/exchange-key handling, paid services, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-10-03T17:34:00Z - adversarial cron recovery verified

- Check: inspected live OpenClaw cron state/history for `ralph-adversarial-improvement-loop` after the 17:30 UTC scheduled slot.
- Result: scheduled run at `2026-10-03T17:30:00Z` finished `ok` at `2026-10-03T17:30:43Z` with summary `NO_TELEGRAM_UPDATE`; next run is `2026-10-04T17:30:00Z`, and consecutive errors reset to `0`.
- State update: refreshed `automation/loop-state.yaml` for the adversarial improvement cron to record scheduled recovery from the prior Codex subscription usage-limit errors.
- Boundary: no scheduler config, cron payload, live alerts, watcher behavior, paper/demo alert logic, live execution, orders, wallet/API/exchange-key handling, paid services, Telegram execution path, IBKR/Claude/TWS integration, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-10-03T17:52:00Z - grid range claim falsifier contract

- Scope: Tomas approved the next tiny bot-market follow-up after the public bot source map; research-only design contract, no implementation/backtest.
- Output: added `wiki/notes/2026-10-03-grid-range-claim-falsifier-contract.md`, updated C-028 in `decisions/candidates.md`, and recorded `grid-range-claim-falsifier-contract` under validation done.
- Result: the contract preserves the prior rejected range-grid falsifier as the default baseline and blocks another grid test unless a specific public bot/source claim provides a better prior-only range source, explicit inventory cap, fee-safe spacing, BTC gate, and trend-break control.
- Decision: `grid_range_claim_falsifier` is a contract, not an active strategy test. The next actual implementation, if requested, should be a one-symbol source-claim replay against simple range fade, no-trade, buy-and-hold, and the prior naive-grid baseline.
- Boundary: no scheduler config, cron payload, live alerts, watcher behavior, paper/demo alert logic, live execution, orders, wallet/API/exchange-key handling, paid services, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-10-03T18:03:00Z - strategy spam funnel BTC first pass

- Scope: Tomas pushed to simplify edge search into high-throughput strategy spam plus survival filtering. Implemented a BTC-only public-candle first pass outside curated candidates.
- Change: added `experiments/strategy-destruction-filter/src/run-strategy-spam-funnel.mjs`, npm script `study:strategy-spam-funnel`, outputs `results/strategy-spam-funnel-btc-first-pass.json/.md`, verifier guards in `src/verify-filter.mjs`, and note `wiki/notes/2026-10-03-strategy-spam-funnel-btc-first-pass.md`.
- Result: 5 candidate families expanded to 254 BTC 1h/4h variants; verdict `no_survivors_rejected_batch`: 0 survivors, 254 rejected, 10 near misses. Best rows were volume-breakout variants with positive aggregate expectancy/lift but negative OOS expectancy, high drawdown, weak PF, bad failure slices, and weak walk-forward OOS.
- Decision: the spam funnel is useful and should stay separate from `seed-strategies.json`; no candidate import unless a future spam variant survives strict gates and gets manual review. Next expansion should add alt-symbol spam only with explicit BTC regime gating or one source-inspired family at a time.
- Verification: `node --check src/run-strategy-spam-funnel.mjs`, `node --check src/verify-filter.mjs`, `npm run study:strategy-spam-funnel --prefix ralph-research-os/experiments/strategy-destruction-filter`, and `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed.
- Boundary: no scheduler config, cron payload, live alerts, watcher behavior, paper/demo alert logic, live execution, orders, wallet/API/exchange-key handling, paid services, candidate import, public posting, thresholds, risk/sizing/TP/SL, execution behavior, or strategy promotion changed.

# 2026-10-04T00:05:00Z - alert-edge cron stale-data attention

- Result: liquid-crypto alert-edge cron completed all refresh/backtest/demo-sim/verification commands, but state-of-edge verdict is `needs_attention_data_stale` because `watcherLog` is stale at ~28.4h while paperDashboard, edgeSnapshot, shadowPnl, tradeJournal, and executionLog are fresh.
- Evidence: range_breakout_long BTC_RISK_ON walk-forward survivor remains watch/candidate only (`forward` n=26, winrate 46.15%, PF 1.6356, avgR 0.2387, maxDD 6.94%); all short families remain quarantined; full replay remains capital-impaired.
- Boundary: no Telegram sent by this log write, no live trading/exchange mutation/wallet/API-key/paid-service action, no strategy promotion, and no alert/watcher thresholds changed.

# 2026-10-04T04:05:00Z - alert-edge cron repeated stale-data attention

- Result: liquid-crypto alert-edge cron completed all refresh/backtest/demo-sim/verification commands, but state-of-edge verdict remains `needs_attention_data_stale` because `watcherLog` is stale at ~32.4h while paperDashboard, edgeSnapshot, shadowPnl, tradeJournal, and executionLog are fresh.
- Evidence: range_breakout_long BTC_RISK_ON walk-forward survivor remains watch/candidate only (`forward` n=26, winrate 46.15%, PF 1.6356, avgR 0.2387, maxDD 6.94%); all short families remain quarantined; full replay remains capital-impaired.
- Boundary: no Telegram sent by this log write, no live trading/exchange mutation/wallet/API-key/paid-service action, no strategy promotion, and no alert/watcher thresholds changed.

# 2026-10-04T07:30:00Z - autoresearch DEMO-SIM priority reassessment

- Scope: bounded `ralph-autoresearch-loop` reassessment of the requested priority list after the listed DEMO-SIM paper-fund, replay, walk-forward grid, BTC gate, short quarantine, and strategy-discovery tasks were already marked done.
- Result: did not restart completed work or open a new source scan. Verified the 2026-10-04 04:04 UTC DEMO-SIM artifact bundle and the current evidence prioritizer. Full paper-fund state remains `capital_impaired_review_required`: 490 closed trades, 2954.58 USDT ending equity from 10000.00 USDT, -7045.42 USDT net after 5390.00 USDT fees, 35.71% winrate, PF 0.8902, and 88.32% max drawdown.
- Reassess: walk-forward grid and BTC_RISK_ON range-breakout gate still leave only a watch/candidate survivor, all short families remain quarantined, and `outputs/evidence-ledger-prioritizer.md` remains `readyNow=0`. Next useful action is still wait for threshold evidence, a named trigger, or explicit HITL-gated branch.
- Verification: `npm run verify --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed. Updated `automation/loop-state.yaml`.
- Boundary: no Telegram sent, no live trading/exchange mutation/wallet/API-key/paid-service action, no scheduler or watcher change, no alert wording/threshold/risk/sizing/TP/SL/execution change, and no strategy promotion.

# 2026-10-04T08:05:00Z - alert-edge cron repeated stale watcher attention

- Result: liquid-crypto alert-edge cron completed all requested refresh/backtest/demo-sim/verification commands, but state-of-edge verdict remains `needs_attention_data_stale` because `watcherLog` is stale at ~36.4h while paperDashboard, edgeSnapshot, shadowPnl, tradeJournal, and executionLog are fresh.
- Evidence: walk-forward survivor remains range_breakout_long under BTC_RISK_ON watch/candidate only (`forward` n=26, winrate 46.15%, PF 1.6356, avgR 0.2387, maxDD 6.94%); full replay remains capital-impaired; all short families remain quarantined.
- Boundary: no Telegram sent by this log write, no live trading/exchange mutation/wallet/API-key/paid-service action, no strategy promotion, and no alert/watcher thresholds changed.
