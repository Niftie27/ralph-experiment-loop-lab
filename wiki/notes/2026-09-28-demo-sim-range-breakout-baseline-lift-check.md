---
title: DEMO-SIM Range Breakout Baseline Lift Check
date: 2026-09-28
status: research_watch_only
tags:
  - ralph
  - demo-sim
  - paper-fund
  - range-breakout
  - baseline-lift
---

# DEMO-SIM Range Breakout Baseline Lift Check

## Context

This micro-run refreshed the existing DEMO-SIM bundle and checked whether the current survivor, `range_breakout_long + BTC_RISK_ON + 4h + B|low-sample`, still adds lift versus simple no-trade and broader long/BTC-risk-on baselines.

No source scan or new external data was used. Inputs were the refreshed local reports:

- `experiments/btc-eth-alert-edge/results/historical-demo-sim-replay.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-paper-fund-ledger.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-walk-forward-filter-grid.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-short-strategy-quarantine.json`

## Refresh Result

The full paper-fund surface remains capital-impaired:

- closed trades: `490`
- ending equity: `5868.50` USDT from `10000.00`
- net PnL: `-4131.50` USDT
- winrate: `35.71%`
- profit factor: `0.9320`
- ledger max drawdown: `85.85%`

Shorts remain quarantined:

- short records: `198`
- short-only net PnL: `-14469.77` USDT
- short-only profit factor: `0.4162`
- revalidated short families: `0/20`

Long-only / shorts-withheld remains better but not capital-ready:

- long records: `292`
- long-only net PnL: `+10338.27` USDT
- long-only profit factor: `1.2871`
- long-only max drawdown: `52.26%`

## Baseline Lift

Selected policy:

`range_breakout_long__all_directions__btc_risk_on__tf_4h__tier_b_or_low_sample`

Forward slice after the purged boundary:

| Policy | Verdict | Fwd n | Fwd Net | Fwd PF | Fwd DD |
| --- | --- | ---: | ---: | ---: | ---: |
| selected range-breakout pocket | survives | 26 | 2351.05 | 1.6356 | 6.94% |
| range-breakout 4h all tiers | survives | 30 | 1843.66 | 1.4065 | 6.33% |
| range-breakout all TF B/low-sample | survives | 32 | 2019.69 | 1.4469 | 13.17% |
| all long setups 4h B/low-sample | survives | 37 | 1045.43 | 1.1756 | 20.92% |
| all directions 4h B/low-sample | watch, drawdown high | 43 | 416.15 | 1.0595 | 25.52% |
| no-trade baseline | baseline | 0 | 0.00 | n/a | 0.00% |

Forward lift of the selected pocket:

- versus no-trade: `+2351.05` USDT, with `6.94%` max drawdown.
- versus all long setups / 4h / B|low-sample: `+1305.62` USDT, `+0.4600` PF, and `13.98` percentage points lower max drawdown, while taking 11 fewer trades.
- versus all directions / 4h / B|low-sample: `+1934.90` USDT, `+0.5761` PF, and `18.58` percentage points lower max drawdown, while taking 17 fewer trades.
- versus range-breakout 4h all tiers: `+507.39` USDT and `+0.2291` PF, but `0.61` percentage points higher max drawdown.

## Verdict

The selected pocket still deserves research-watch status because it beats the simple no-trade baseline and broader BTC-risk-on long baselines on the refreshed forward slice. It does not deserve capital, live/demo sizing, scheduler, watcher, alert-wording, threshold, TP/SL, or execution promotion.

Reasons not to promote:

- the full DEMO-SIM paper fund is still impaired;
- the survivor was selected from a grid;
- evidence is synthetic historical replay, not exchange fills;
- forward sample is only 26 trades;
- the replay does not model overlapping margin reservation, liquidation, funding, queue priority, or live slippage;
- long-only drawdown remains too high at the account surface.

## Next Useful Bounded Step

Freeze this policy as a research-watch candidate and run a small future extension only when fresh forward rows are available, or compare it with a stricter same-symbol/timeframe baseline that controls for symbol concentration.

## Verify / Reassess

- Verification command passed: `npm run demo-sim:all --prefix experiments/btc-eth-alert-edge`.
- The baseline-lift check used refreshed local JSON outputs and did not introduce new data sources, keys, paid APIs, scheduler changes, or live behavior.
- Notification gate: no Telegram update. This is useful internal state hygiene, not a concrete setup alert, urgent event, go/no-go request, repeated blocker, or material paper-fund state change requiring Tomas.
