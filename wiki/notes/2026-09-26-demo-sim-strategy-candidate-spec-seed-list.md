---
type: note
topic: demo-sim-strategy-candidate-spec-seed-list
created: 2026-09-26T16:50:00Z
last_updated: 2026-09-26T16:50:00Z
work_item: discovery.demo-sim-strategy-candidate-spec-seed-list
status: complete
scope: research-only
sources:
  - 2026-09-26-demo-sim-profitable-strategy-source-scan.md
  - 2026-08-30-strategy-family-taxonomy.md
  - 2026-08-31-strategy-leg-garden-harvest.md
  - 2026-08-31-funding-basis-baseline-monitor.md
  - 2026-08-30-x-reddit-strategy-inspiration-scan.md
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
related:
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge
---
# DEMO-SIM Strategy Candidate Spec Seed List

## Purpose

This closes `demo-sim-strategy-candidate-spec-seed-list` with four research-only candidate specs. Each is designed to be cheap to kill using current RALPH public/no-key rails or existing DEMO-SIM outputs.

None is paper-qualified, alert-qualified, or capital-ready.

## Shared Gate

Every directional alt setup must use the RALPH BTC gate:

- Long candidates require `BTC_RISK_ON` or a clear transition into risk-on.
- Short candidates remain quarantined unless a separate short thesis passes its own purged forward gate.
- `BTC_STALE`, unresolved `BTC_TRANSITION`, BTC breakdown, or BTC rejection blocks long promotion.
- Full-TA context and baseline comparison are required before candidate promotion.

## Spec: pdh-pdl-btc-gated-liquidity-sweep-long

- **Mechanism:** Prior-day high/low sweeps can mark liquidity grabs. A long candidate only exists when price sweeps/loses then reclaims a prior-session level and BTC is risk-on or clearly transitioning risk-on.
- **Public data requirement:** Public OHLCV for BTC and target symbol; prior-day high/low computed from a fixed UTC/session definition; optional trades/orderflow only as later context.
- **Baseline:** Timestamp-matched hold after touching PDH/PDL; simple range-breakout long; no-trade.
- **Cheapest kill test:** Add mechanical PDH/PDL sweep/reclaim labels to existing DEMO-SIM replay rows and compare expectancy, profit factor, drawdown, and baseline lift inside `BTC_RISK_ON`.
- **Kill criteria:** No positive OOS/baseline lift; result depends on ambiguous session definitions; profit comes from one symbol/week; fails purged/embargo chronology; drawdown worse than range-breakout survivor.
- **DEMO-SIM route:** Extend `btc-eth-alert-edge` replay with derived prior-session levels and reclaim labels; report as a bucket, not a live alert.
- **Promotion blockers:** Needs at least enough frozen rows across symbols/regimes; requires fee/slippage accounting and no-trade comparison.

## Spec: btc-risk-on-opening-range-breakout-continuation

- **Mechanism:** In risk-on BTC regimes, early-session range acceptance/breakout may continue as liquidity chases trend; this tests ORB as a dumb baseline and possible replacement for overfit range-breakout pockets.
- **Public data requirement:** Public OHLCV/trades for BTC and target symbol; fixed opening/session window; current BTC regime labels.
- **Baseline:** Existing `range_breakout_long + BTC_RISK_ON`; timestamp-matched random entry in same session; no-trade.
- **Cheapest kill test:** Define one opening range window, one acceptance close, one fixed hold/exit rule, and test without parameter search before any grid.
- **Kill criteria:** Does not beat the existing range-breakout survivor; only works after tuning the opening window; fails after fees; collapses outside one market week; no purged/embargo survivor.
- **DEMO-SIM route:** Add an ORB bucket to the walk-forward grid only after a fixed v0 rule file exists; first run should be single-config.
- **Promotion blockers:** Must prove it is not just the already-known range-breakout survivor renamed.

## Spec: funding-persistence-context-baseline

- **Mechanism:** Persistent positive or negative funding/OI regimes may explain when directional alert-edge results are helped or hurt by crowded leverage. This is a context/baseline candidate, not an execution strategy.
- **Public data requirement:** Hyperliquid funding history/context; public BTC/ETH/SOL candles; DefiLlama yield/stablecoin context for comparison floor.
- **Baseline:** No-trade; stablecoin/yield proxy; spot-only exposure; existing BTC regime labels without funding context.
- **Cheapest kill test:** Join funding sign/persistence buckets onto existing DEMO-SIM rows and ask whether candidate results improve versus BTC regime alone.
- **Kill criteria:** Funding labels add no baseline lift; labels are stale or unavailable at decision time; gross carry would be below public yield proxy after conservative costs; tail flags dominate.
- **DEMO-SIM route:** Add funding/context sidecar table and report split performance; do not emit trade instructions.
- **Promotion blockers:** Any move from context to carry paper accounting needs separate account/margin/cost design and Tomas approval.

## Spec: range-grid-offline-falsifier

- **Mechanism:** A bounded grid/range rule may harvest oscillation in sideways regimes, but should be killed quickly if trend tails erase many small gains.
- **Public data requirement:** Public candles/trades for BTC/ETH/SOL or liquid alts; BTC regime label; fixed fee/spread/slippage assumptions.
- **Baseline:** Buy-and-hold; no-trade; simple DCA; existing range-breakout long.
- **Cheapest kill test:** Run one offline public-candle grid simulator over fixed ranges chosen only from prior data; compare against buy-and-hold and no-trade after costs.
- **Kill criteria:** Trend-break losses dominate; only works with hindsight range bounds; requires unrealistically tight fills; fails when BTC leaves range/transition state; does not beat no-trade or buy-and-hold.
- **DEMO-SIM route:** Separate offline falsifier first; only join to `btc-eth-alert-edge` if it produces a regime filter worth testing.
- **Promotion blockers:** Hummingbot/Pionex/account/product trials require separate approval; no live/paper bot from this spec.

## Phase 2 Decision

The Phase 2 "expand strategy supply" discovery requirement is satisfied at seed level: at least three candidate specs now exist with mechanism, public data requirement, baseline, kill criteria, DEMO-SIM route, BTC gate, and blockers.

Next queue should move back to validation: choose one spec and implement the cheapest kill test. Recommended first kill test is `pdh-pdl-btc-gated-liquidity-sweep-long` because it reuses existing OHLCV and full-TA source memory without accounts, keys, products, or schedulers.

## Boundary Delta

Changed: research notes and queue state only.

Unchanged: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion.
