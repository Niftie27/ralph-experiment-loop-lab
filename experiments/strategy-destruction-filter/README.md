# Strategy Destruction Filter

Stage: active research harness.

Purpose: turn trading ideas into explicit rules, backtest them with costs, report failure slices, and reject weak candidates before they reach paper trading. This is not a live-trading system and must not use exchange keys, wallet keys, paid APIs, or automatic execution.

## Contract

Input:

- `candidates/seed-strategies.json`: plain-English ideas plus explicit rule families and parameter grids.
- `config.default.json`: public-data universe, cost assumptions, risk model, and survival gates.
- `schemas/strategy-idea.schema.json`: candidate intake contract for thesis, data requirements, validation baseline, and kill criteria.

Output:

- `results/filter-report.json`: machine-readable candidate verdicts.
- `results/filter-report.md`: human-readable survival/rejection report.
- `results/feature-study.json`: machine-readable feature-quality diagnostics.
- `results/feature-study.md`: funding/OI/RSI extreme-bucket report before adding more candidates.
- `results/aggtrades-velocity-event-study.json`: machine-readable low-sample gate over replay-clean Binance `aggTrades` velocity rows.
- `results/aggtrades-velocity-event-study.md`: human-readable event-study bucket/watch decision.
- `results/wick-alert-feedback-event-study.json`: machine-readable low-sample gate over local finalized WICK alert reviews.
- `results/wick-alert-feedback-event-study.md`: human-readable WICK fade/event-only bucket/watch decision.
- `results/shadow-pnl-ledger.json`: machine-readable conservative shadow PnL ledger for finalized tradable alert plans.
- `results/shadow-pnl-ledger.md`: human-readable shadow PnL summary with fill, TP, SL, ambiguity, and caveats.
- `results/level-breakout-acceptance-study.json`: machine-readable candle-only baseline for acceptance versus sweep/rejection around prior-candle high/low levels across timeframes.
- `results/level-breakout-acceptance-study.md`: human-readable baseline for planned-level/Cluster Search strategy development.
- `results/planned-level-proxy-replay.json`: machine-readable planned-level event schema plus optional public Binance `aggTrades` proxy windows for the Filip pdV/pdN / Cluster Search lane.
- `results/planned-level-proxy-replay.md`: human-readable planned-level proxy replay scaffold and next gate.
- `results/planned-level-proxy-baseline-check.json`: machine-readable sanity check for proxy fast-kill/hold labels against simple candle MFE/MAE.
- `results/planned-level-proxy-baseline-check.md`: human-readable planned-level proxy baseline check and no-promotion verdict.
- `schemas/atas-orderflow-event.schema.json`: ATAS exporter event contract for absorption/cluster-search rows with explicit BTC gate, level, orderflow, reaction, and no-live-change fields.
- `results/rejected-ideas.jsonl`: append-only rejected candidate records.
- `results/survivors.json`: candidates allowed to move to later paper-trading design.

Evaluation:

- multi-year downloaded Binance public archive candles with REST tail for recent spot candles;
- public Bybit v5 linear-perpetual candles for markets that do not have suitable Binance spot history, currently HYPE;
- Bybit funding and open-interest history joined to HYPE candles as optional perp context features;
- chronological entry-time split, currently 70% in-sample / 30% out-of-sample;
- diagnostic equal-trade-count chronological walk-forward folds, reported separately from the hard 70/30 gate;
- time-matched alternating-direction baseline with the same signal timestamps and trade count;
- labeled `approximate_multiple_testing_deflated_sharpe` calibration, used as an overfit-rejection proxy rather than a full institutional Deflated Sharpe Ratio implementation.
- diagnostic-only `diagnostic_probabilistic_sharpe_proxy`, used to compare each variant's trade Sharpe against the matched baseline while accounting for sample length, skew, and kurtosis. It is reported for inspection, not used as a survival gate.
- explicit funding-only, trend-filtered, and timeframe-filtered HYPE perp fade variants so feature-study leads can be falsified without changing watcher alerts or paper/live execution.
- optional `symbol`, `timeframe`, `trend`, and `volatility` candidate filters so upstream alert-edge buckets can be retested as stricter destruction-filter candidates.
- research-only `volume_velocity_fade` proxy rule that tests contrarian entries after large OHLCV return and volume-z shocks. It is not a reconstruction of second-level alert events; it is a coarse historical destruction test before any forward paper work.
- research-only velocity replay feasibility report that separates coarse 1m candle context from exact watcher replay requirements: Binance public `aggTrades` can rebuild 5s notional slots for Binance assets, but historical fresh-book evidence and HYPE historical trade/book replay are not available from the current 1m cache.
- research-only Binance `aggTrades` velocity replay that fetches bounded public/no-key trade windows around existing Binance velocity alerts, caches them locally, and compares reconstructed watcher fields against recorded `triggerMovePct`, `volumeRecentNotional`, and `volumeVelocityRatio`.
- research-only `aggTrades` velocity event study that consumes the replay output without refetching and requires at least 10 replay-clean rows plus a 75% dominant verdict share before any bucket can be considered candidate-ready.
- research-only WICK alert feedback event study that keeps WICK separate from VELOCITY and requires at least 10 rows, 75% dominant verdict share, and 60% tradable-fade support before any wick-fade bucket can be considered candidate-ready.
- research-only shadow PnL ledger for tradable alert plans, using recorded entry bands, TP/SL, finalized reviews, and conservative stop-first handling for ambiguous TP/SL collisions. This is not execution-grade and excludes fees, slippage, queue position, and latency.
- research-only planned-level proxy replay scaffold that freezes BTC previous-day level events, records the BTC regime gate, and optionally fetches bounded public/no-key Binance `aggTrades` windows for trade-side delta, CVD slope, level-adjacent aggressive volume, fail-back/reclaim, and fast-kill labels. Default run does not fetch live public trades; set `PLANNED_LEVEL_PROXY_FETCH=1` for bounded fetches.
- research-only planned-level proxy baseline check that consumes the fetched proxy rows and compares fast-kill versus hold/retest labels against crude 1/3/5-candle MFE/MAE direction. This is a sanity check before richer orderflow work, not a strategy candidate.

## Run

```bash
npm run audit:data --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run analyze:alert-feedback --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run assess:velocity-replay --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run replay:aggtrades --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run study:aggtrades-velocity --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run study:wick-feedback --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run ledger:shadow-pnl --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run study:level-breakout --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run study:planned-level-proxy --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run study:planned-level-proxy-baseline --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run validate:candidates --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run study:features --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run filter --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run drift:filter --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run audit:atas --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run audit:backtest --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run critic --prefix ralph-research-os/experiments/strategy-destruction-filter
npm run verify --prefix ralph-research-os/experiments/strategy-destruction-filter
npm test --prefix ralph-research-os/experiments/strategy-destruction-filter
```

## Gates

A candidate fails by default unless it clears every configured gate:

- minimum sample count;
- positive expectancy after fees and slippage;
- profit factor;
- max drawdown;
- worst regime slice;
- out-of-sample sample and expectancy;
- lift versus the deterministic baseline;
- deflated-Sharpe proxy that penalizes broad parameter searches.

## Design Rule

Generating candidates is cheap. Survival is expensive. RALPH should discard many ideas and promote almost none.

## Latest Integration Read

The first liquid alert-edge B-tier bucket candidate, `alert-edge-xrp-range-breakout-v0`, was added on 2026-08-25 with XRP Binance spot data. The latest verified run tests 8 candidates / 69 variants / 0 survivors. The best XRP variant has positive out-of-sample expectancy but fails headline expectancy, profit factor, deflated-Sharpe, drawdown, and baseline-lift gates, so it is rejected rather than paper-promoted.
