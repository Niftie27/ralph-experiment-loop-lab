---
type: note
topic: range-grid-offline-falsifier
created: 2026-09-27T07:30:00Z
last_updated: 2026-09-27T07:30:00Z
work_item: validation.range-grid-offline-falsifier
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - rejected
related:
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-range-grid-offline-falsifier.md
  - 2026-09-26-demo-sim-strategy-candidate-spec-seed-list.md
---
# Range Grid Offline Falsifier

## Purpose

This closes the first cheap validation for `range-grid-offline-falsifier`.

The test is an offline public-candle falsifier for the seeded range/grid idea. It uses existing local Binance spot 4h candles for BTC, ETH, and SOL; derives each range only from prior candles; requires BTC `BTC_TRANSITION` context; and compares the fixed grid against no-trade and buy-and-hold after conservative costs.

No exchange account, bot product, live alert, paper-fund allocation, sizing, TP/SL, watcher, scheduler, or execution behavior changed.

## Implementation

Added `experiments/btc-eth-alert-edge/src/demo-sim-range-grid-offline-falsifier.mjs` and standalone package script `demo-sim:range-grid-falsifier`.

Outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-range-grid-offline-falsifier.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-range-grid-offline-falsifier.md`

The script is not included in `demo-sim:all` and is not wired to cron.

## Rule

- Universe: BTC, ETH, SOL spot 4h candles.
- Range: prior-only rolling 180 4h candles; lower = 20th percentile lows; upper = 80th percentile highs.
- Grid: buy at the first inner grid level, sell at the upper inner grid level, stop half a grid step below the lower range, or time-exit after 12 bars.
- BTC gate: only trade when BTC is `BTC_TRANSITION` by close/MA20/MA50 proxy.
- Costs: 4 bps fee plus 2 bps slippage per side, 12 bps round-trip.

## Result

Verdict: `reject_loses_to_no_trade`.

Grid total:

- 292 trades
- -140605.35 USDT per 10k accounting surface
- 11.3% winrate
- PF 0.0576
- 1411.79% max drawdown
- 206 stop/trend-break exits

By symbol:

- BTC: 94 trades, -33958.61 USDT, PF 0.0690
- ETH: 97 trades, -48915.78 USDT, PF 0.0712
- SOL: 101 trades, -57730.96 USDT, PF 0.0386

Buy-and-hold baselines over the same post-lookback window were also negative, but far less bad:

- BTC: -2349.22 USDT per 10k
- ETH: -3063.09 USDT per 10k
- SOL: -3542.23 USDT per 10k
- equal-weight buy-and-hold: -2984.85 USDT per 10k

## Interpretation

The fixed offline range-grid rule is rejected. Trend-break losses dominate the mean-reversion wins, and the branch loses to no-trade and buy-and-hold by a wide margin.

Keep this as a rejected/watch-only reference. Do not join it to DEMO-SIM paper fund, live alerts, watchers, sizing, TP/SL, execution, or schedulers.

## Verification

- `node --check ralph-research-os/experiments/btc-eth-alert-edge/src/demo-sim-range-grid-offline-falsifier.mjs` passed.
- `npm run demo-sim:range-grid-falsifier --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- `work-queues.yaml` and `package.json` parsed.
- `demo-sim:all` was checked and still does not include the range-grid falsifier.
- `node ralph-research-os/automation/research-validation-checklist.mjs` ran with queue/path/delivery/HITL/boundary checks passing; overall remains `fail` because of pre-existing retrieval failure, subsystem/cron warnings, and paper-demo `not-ready`.

## Boundary Delta

Changed:

- added one research-only offline grid falsifier script
- added one standalone package script
- generated standalone JSON/Markdown results
- updated roadmap, queue, log, and memory

Unchanged:

- no scheduler or cron payload changes
- no live alerts
- no watcher behavior
- no keys, accounts, wallets, or paid APIs
- no sizing, leverage, risk, TP/SL, or execution behavior
- no public posting
- no strategy promotion
