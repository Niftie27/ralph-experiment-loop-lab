# Strategy Leg Note Template

Copy one block per leg. Keep field order stable so legs stay comparable.

## Leg: <short-name>

- **Status:** raw-idea
- **Date added:** YYYY-MM-DD
- **Source / prompt:** 
- **Related candidates / unknowns:** 

### Thesis

One sentence: what might work?

### Observation

What made this leg interesting?

### Mechanism

Why might this be edge rather than narrative or beta?

### Speed / Latency Fit

Can Tomas realistically observe, decide, and act before the edge decays?

### Data Rail

What cheap source could observe this?

Examples: public API, Dune query, Nansen/Arkham export, exchange candles, GitHub dataset, manual sample.

### Dumb Baseline

What simple rule might explain the same effect without the fancy signal?

Examples: candle magnitude, drawdown, volume spike, volatility regime, funding rate, BTC beta, sector beta.

### Cheapest Kill Test

One sentence: what is the smallest replay, paper test, or source check that can kill this?

If this is blank, keep status as `raw-idea`. It is not a candidate yet.

### Kill Criteria

- 
- 
- 

### Tail Risk

What clustered, asymmetric, or hidden risk can erase many normal wins?

### Existing Tools / Prior Art

What product, repo, dashboard, or paper already covers part of this?

### Next Micro-Action

One small read, fetch, sample, or note.

### Notes

- 

---

## Example: Liquidation-Map Cascade Reversal

- **Status:** killed
- **Date added:** 2026-07-02
- **Source / prompt:** liquidation-map liquidity provision branch, then Q1 baseline kill-switch
- **Related candidates / unknowns:** C-031 through C-034, U-031 through U-036

### Thesis

After forced liquidation cascades, passive opposite-side liquidity might capture overshoot/reversion.

### Observation

Liquidations are forced, price-insensitive flow, and retail liquidation heatmaps make the branch visually tempting.

### Mechanism

If forced flow overshoots fair price, passive bids/offers near the overshoot could earn reversion. The risk is that liquidation data is only a delayed volatility/drawdown proxy.

### Speed / Latency Fit

Potentially acceptable only as a replayed/passive rule, not as fast discretionary reaction.

### Data Rail

0xArchive historical Hyperliquid liquidations plus candles; native Hyperliquid `candleSnapshot` is limited to recent candles and was not enough for broad history.

### Dumb Baseline

Large candle reversal and drawdown/rally reversal with the same passive-limit, cost, missed-fill, and exit machinery.

### Cheapest Kill Test

Run one fixed historical replay window and require the liquidation-aware rule to beat dumb baselines after costs, missed fills, outlier removal, and clustered-loss checks.

### Kill Criteria

- EV <= 0 after costs.
- Does not beat dumb baselines on mean return and risk-adjusted score.
- PnL depends on top outlier wins.
- One clustered-loss day erases many wins.

### Tail Risk

In crash regimes, BTC/ETH/SOL liquidation cascades cluster together, so passive bids across symbols fill and lose together.

### Existing Tools / Prior Art

CoinGlass and other heatmap/data products already cover much of the map layer. The missing question was whether the signal itself had replay edge.

### Next Micro-Action

None by default. Keep closed unless Tomas explicitly asks for a pre-registered robustness run.

### Notes

- June 2026 BTC/ETH/SOL replay result: `do_not_build`.
- Report: `experiments/liquidation-q1-baseline-kill-switch/results/major-2026-06.json`.
- Key figures: -0.1148% mean return per opportunity, -4.42 risk-adjusted score, best dumb baseline +0.1702% mean and +1.20 risk-adjusted, worst clustered day -22.00%.
