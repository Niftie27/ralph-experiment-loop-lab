---
type: research-note
created: 2026-09-12T18:40:00Z
topic: filip-feedback
status: proxy-scaffold-watch
work_item: investigation.filip-pdv-pdn-cluster-strategy-development
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - orderflow
  - ta
related:
  - 2026-09-08-filip-pdv-pdn-cluster-strategy-development-lane.md
  - 2026-09-08-level-breakout-acceptance-baseline.md
  - 2026-09-08-planned-level-orderflow-decision-protocol.md
  - 2026-09-08-planned-level-post-entry-autoresearch-scan.md
sources:
  - ../../experiments/strategy-destruction-filter/src/run-planned-level-proxy-replay.mjs
  - ../../experiments/strategy-destruction-filter/results/planned-level-proxy-replay.json
  - ../../experiments/strategy-destruction-filter/results/planned-level-proxy-replay.md
---
# Planned-Level Proxy Replay Scaffold

Bounded work item: `investigation.filip-pdv-pdn-cluster-strategy-development`.

## Change

Added the first public/no-key proxy replay scaffold for the Filip pdV/pdN plus Cluster Search lane. The script freezes BTC 1h previous-day high/low events, records the BTC gate, classifies the planned-level interaction, and can optionally fetch bounded Binance public `aggTrades` windows for proxy orderflow features: trade-side delta, CVD slope proxy, aggressive volume near the level, price progress per aggressive volume, opposing absorption candidate, fail-back/reclaim, and fast-kill versus hold/retest labels.

Default run is cron-safe and does not fetch live public trades. Explicit fetch uses `PLANNED_LEVEL_PROXY_FETCH=1`.

## Verification

- `node --check ralph-research-os/experiments/strategy-destruction-filter/src/run-planned-level-proxy-replay.mjs` passed.
- Default no-fetch run passed with 8 frozen BTC planned-level rows.
- Explicit bounded public/no-key fetch passed with `PLANNED_LEVEL_PROXY_FETCH=1 PLANNED_LEVEL_PROXY_MAX_EVENTS=8 PLANNED_LEVEL_PROXY_MAX_FETCH_EVENTS=2 PLANNED_LEVEL_PROXY_MAX_PAGES=2`, producing 8 rows and 2 fetched BTCUSDT public `aggTrades` windows.
- `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed 29 tests.
- `npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter` passed and now verifies the planned-level proxy report boundary/gates.

## Result

Latest report generated `2026-09-12T18:36:34.660Z`:

- candidate events: 8;
- fetched trade windows: 2;
- no-fetch rows: 6;
- fetch-failed rows: 0;
- verdict: `schema_ready_trade_windows_low_sample`.

Fetched examples:

- `BTC-1h-previous_day_low-1789128000`: BTC gate `BTC_RISK_ON`, setup `fade_long`, proxy `mixed_no_trade_proxy`, fast-kill label `hold_or_retest_candidate`, 2000 trades fetched.
- `BTC-1h-previous_day_high-1789131600`: BTC gate `BTC_RISK_ON`, setup `continuation_long`, proxy `fail_back_or_reclaim`, fast-kill label `fast_kill_candidate`, 2000 trades fetched.

These rows prove the access path and schema, not an edge. The lane remains below rule-testing threshold.

## Routing Decision

Move the broad Filip planned-level branch out of ready-now and into Watch until the row gate is met:

- minimum frozen planned-level events before candidate: 20;
- minimum fetched public trade windows before hold/fast-kill rule test: 10;
- BTC gate required on every row;
- baseline lift required before any promotion.

Next useful action is to accumulate/freeze planned-level paper events or run a larger bounded public fetch when context and runtime budget allow. Do not add a strategy candidate, live alert, live threshold, scheduler, data capture, or execution behavior from this scaffold alone.

## Boundary

No live trading, autonomous orders, exchange mutations, wallet keys, exchange keys, paid APIs, account setup, public posting, live alert wording, live alert thresholds, scheduler/cadence, risk/sizing/TP/SL, execution behavior, watcher behavior, recurring data capture, or strategy promotion changed.
