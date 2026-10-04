---
type: note
topic: pdh-pdl-btc-gated-liquidity-sweep-long-kill-test
created: 2026-09-26T17:25:00Z
last_updated: 2026-09-26T17:25:00Z
work_item: validation.pdh-pdl-btc-gated-liquidity-sweep-long-kill-test
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - rejected
  - btc-risk-on
related:
  - 2026-09-26-demo-sim-strategy-candidate-spec-seed-list.md
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-pdh-pdl-liquidity-sweep-long.md
---
# PDH/PDL BTC-Gated Liquidity Sweep Long Kill Test

## Purpose

This closes the cheapest validation pass for `pdh-pdl-btc-gated-liquidity-sweep-long`.

The test is research-only. It does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, sizing, risk rules, TP/SL policy, or execution.

## Implementation

Added `experiments/btc-eth-alert-edge/src/demo-sim-pdh-pdl-liquidity-sweep-long.mjs` and package script `demo-sim:pdh-pdl-sweep`.

The script derives mechanical labels from cached public Binance spot OHLCV:

- timeframe: 1h
- symbols: ETH, SOL, BNB, XRP, DOGE, ADA, LINK, AVAX
- session definition: UTC calendar day
- BTC gate: `BTC_RISK_ON` only, using the same close/MA20/MA50 proxy as existing DEMO-SIM replay context
- primary event: long after PDL sweep/reclaim or PDH reclaim
- entry: candidate candle close
- exit: 12 bars later at close
- costs: 4 bps fee plus 2 bps slippage per side
- split: August 2026 fit, September 2026 forward, first 24h of September embargoed
- baselines: no-trade and touch-only hold after PDH/PDL interaction under the same BTC gate

Outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-pdh-pdl-liquidity-sweep-long.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-pdh-pdl-liquidity-sweep-long.md`

## Result

Verdict: `survives_first_kill_test`, not promoted.

Forward September sweep/reclaim slice:

- 99 trades
- 60 wins / 39 losses
- 60.61% winrate
- average net return 0.71%
- +7044.59 USDT per 10k toy equity
- profit factor 1.6579
- max drawdown 22.48%

Forward touch-only baseline:

- 191 trades
- 55.50% winrate
- average net return 0.33%
- +6260.02 USDT per 10k toy equity
- profit factor 1.2966
- max drawdown 35.59%

Forward lift versus touch-only:

- +784.57 USDT per 10k toy equity
- +0.3613 profit-factor delta

Important blocker: the full-history sweep/reclaim result is still negative:

- 1066 trades
- 37.43% winrate
- -22645.05 USDT per 10k toy equity
- profit factor 0.7781
- max drawdown 239.44%

## Interpretation

The candidate was not killed by the cheapest forward/OOS baseline check because September forward results improved versus touch-only and no-trade. That is enough to keep studying it.

It is not capital-ready or alert-ready. The overall historical result is negative, drawdown is large, the forward edge is concentrated in the recent slice, and the rule is dominated by `pdh_reclaim_long` rather than true PDL sweeps. UTC session definition remains a material ambiguity.

## Next Gate

Keep as research-only watch candidate.

Next validation should be stricter:

- purged walk-forward across multiple monthly folds, not one August/September split
- compare against `range_breakout_long + BTC_RISK_ON`
- split PDH reclaim from PDL sweep/reclaim
- require session-definition sensitivity check
- add drawdown and symbol-concentration kill criteria

## Verification

- `npm run demo-sim:pdh-pdl-sweep --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- `node ralph-research-os/automation/research-validation-checklist.mjs` ran. Queue integrity passed, but overall checklist remains failed due pre-existing research-vault maintenance drift: `index.yaml` wiki count was stale, subsystem registry has stale active outputs, cron has known timeout/gateway-restart warnings, and paper/demo remains not-ready.

## Boundary Delta

Changed:

- added one DEMO-SIM research script
- added one package script
- generated PDH/PDL DEMO-SIM result JSON/Markdown
- updated RALPH queues/docs/memory

Unchanged:

- no live trading
- no live alert wording
- no watcher behavior
- no scheduler or cron payloads
- no keys, accounts, wallets, or paid APIs
- no sizing, leverage, risk, TP/SL, or execution behavior
- no public posting
- no strategy promotion
