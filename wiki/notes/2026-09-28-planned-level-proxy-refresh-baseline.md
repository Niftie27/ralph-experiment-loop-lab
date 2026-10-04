---
type: research-note
created: 2026-09-28T09:05:00Z
topic: filip-feedback
status: proxy-baseline-mixed-watch
work_item: validation.planned-level-proxy-refresh-baseline
tags:
  - ralph
  - research-only
  - orderflow
  - planned-level
  - validation
  - watch-only
  - no-promotion
related:
  - 2026-09-12-planned-level-proxy-replay-scaffold.md
  - 2026-09-08-planned-level-orderflow-decision-protocol.md
  - ../../experiments/strategy-destruction-filter/results/planned-level-proxy-replay.md
  - ../../experiments/strategy-destruction-filter/results/planned-level-proxy-baseline-check.md
---
# Planned-Level Proxy Refresh Baseline

Bounded branch: `validation.planned-level-proxy-refresh-baseline`.

## Change

Refreshed the existing Filip planned-level / Cluster Search public-data proxy lane with currently accessible no-key data. The run used the existing BTC previous-day high/low event scaffold and explicit bounded Binance public `aggTrades` fetching:

```bash
PLANNED_LEVEL_PROXY_FETCH=1 PLANNED_LEVEL_PROXY_MAX_EVENTS=20 PLANNED_LEVEL_PROXY_MAX_FETCH_EVENTS=10 PLANNED_LEVEL_PROXY_MAX_PAGES=12 npm run study:planned-level-proxy --prefix ralph-research-os/experiments/strategy-destruction-filter
```

Added a small baseline checker:

- `experiments/strategy-destruction-filter/src/run-planned-level-proxy-baseline-check.mjs`
- `npm run study:planned-level-proxy-baseline --prefix ralph-research-os/experiments/strategy-destruction-filter`
- `experiments/strategy-destruction-filter/results/planned-level-proxy-baseline-check.json`
- `experiments/strategy-destruction-filter/results/planned-level-proxy-baseline-check.md`

The checker consumes the refreshed replay output and compares proxy `fast_kill_candidate` versus `hold_or_retest_candidate` labels against crude 1/3/5-candle MFE/MAE direction. This is only a sanity check before richer orderflow work.

## Result

Refreshed replay:

- candidate events: 20;
- fetched public trade windows: 10;
- no-fetch rows: 10;
- fetch-failed rows: 0;
- verdict: `proxy_replay_rows_ready_for_baseline_test`.

Baseline check:

- fetched rows: 10;
- fast-kill candidates: 6;
- hold/retest candidates: 4;
- 5-candle overall favorable-dominant share: 40% (4/10);
- 5-candle fast-kill label support: 50% (3/6);
- 5-candle hold/retest label support: 25% (1/4);
- verdict: `proxy_labels_mixed_no_promotion`.

Interpretation: the public proxy access path is now proven at the branch's original 20/10 gate, but the initial proxy labels are mixed and should not be promoted. This is useful as a falsification baseline: future ATAS/manual-export or richer public orderflow work has to beat this mixed label quality, not merely look orderflow-shaped.

## Routing Decision

The old row-threshold watch item is satisfied for the existing public BTC planned-level scaffold. Keep the lane in Watch as `planned-level-proxy-label-baseline-watch`.

Next useful orderflow-adjacent work should be one of:

- improve the label definition only if it is benchmarked against this baseline and remains research-only;
- compare matching Tomas-provided ATAS manual exports against the public proxy for the same windows if matching exports exist;
- collect more frozen planned-level rows before attempting any richer rule family.

Do not add a strategy candidate, paper/live alert wording, thresholds, scheduler, capture daemon, account/key/paid access, sizing, TP/SL, or execution behavior from this result.

## Boundary

No live trading, autonomous orders, exchange mutations, wallet keys, exchange keys, paid APIs, account setup, public posting, live alert wording, live alert thresholds, scheduler/cadence, risk/sizing/TP/SL, execution behavior, watcher behavior, recurring data capture, or strategy promotion changed.
