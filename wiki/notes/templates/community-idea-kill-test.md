# Community Idea Kill-Test Template

Use one block per public operator, GitHub, X/Twitter, Reddit, blog, dashboard, or product idea.

The purpose is to turn an attractive claim into a falsifiable RALPH research input. Do not use this template to copy trades, change live alerts, or authorize execution.

## Idea: <short-name>

- **Status:** source-claim
- **Date added:** YYYY-MM-DD
- **Source / URL:**
- **Surface:** GitHub / docs / X-Twitter / Reddit / blog / dashboard / product / paper
- **Related candidates / unknowns:**
- **Access classification:** verified-public / verified-local / needs-key / needs-account / paid / blocked / unknown

### Claim

What exactly is the source claiming?

### Mechanism

Why should this work after fees, latency, slippage, hidden hedges, and Tomas's execution constraints?

### Market Fit

- **Venue:**
- **Symbols / sector:**
- **Timeframe / holding period:**
- **Regime dependency:**
- **Capacity / liquidity constraint:**

### Reuse Path

What existing code, config, notebook, dataset, API, dashboard, or process can RALPH reuse or benchmark instead of building from scratch?

### Data Needed

What data is needed to verify the claim?

Examples: candles, trades, book, fills, funding, open interest, wallet flows, labels, events, source posts, repo history.

### Dumb Baseline

What simple explanation might beat the fancy claim?

Examples: random direction, timestamp-matched hold, BTC beta, sector beta, volatility regime, drawdown/rally reversal, volume spike, funding rate, current alert-edge bucket.

### Cheapest Kill Test

What is the smallest public/no-key/local test that can falsify this?

### Kill Criteria

- 
- 
- 

### Source Quality

- **Reproducible code/data available:** yes / no / partial
- **Independent support:** none / weak / moderate / strong
- **Hindsight risk:** low / medium / high
- **Survivorship risk:** low / medium / high
- **Vendor/marketing risk:** low / medium / high

### Failure Modes

List concrete ways this fails: overfit, latency decay, slippage, fees, hidden hedges, regime change, exchange constraints, paid-data dependence, selection bias, copy delay, tail risk.

### Decision

Allowed values:

- `Rejected`
- `Watch`
- `Candidate`
- `Blocked`
- `Reassess`

No `Paper-Qualified`, `Alert-Qualified`, live, execution, sizing, TP/SL, or strategy-promotion state from this template alone.

### Next Micro-Action

One small read, fetch, query, local statistic, or source check.

### Notes

- 

---

## Example: Public GitHub Strategy Repo

- **Status:** source-claim
- **Date added:** 2026-08-29
- **Source / URL:** `https://github.com/example/repo`
- **Surface:** GitHub
- **Related candidates / unknowns:** C-039, U-040
- **Access classification:** verified-public

### Claim

The repo claims a volatility breakout strategy works on liquid crypto pairs.

### Mechanism

If true, abrupt volatility expansion creates continuation before fees and slippage erase the move. The mechanism must survive timestamp-matched breakout baselines and market-regime splits.

### Market Fit

- **Venue:** CEX spot/perps
- **Symbols / sector:** BTC/ETH/SOL or liquid alt basket
- **Timeframe / holding period:** intraday
- **Regime dependency:** high-vol trend expansion
- **Capacity / liquidity constraint:** liquid pairs only

### Reuse Path

Read the repo rules and convert them to a plain-English strategy spec. Do not run live code.

### Data Needed

Local candles, existing alert-edge paper rows, fees, and regime tags.

### Dumb Baseline

Timestamp-matched hold after same-size volatility breakout.

### Cheapest Kill Test

Replay the rule over existing no-key Binance candle data and require positive baseline lift out-of-sample.

### Kill Criteria

- No positive baseline lift.
- Profit factor below the current strategy-destruction gate.
- OOS expectancy <= 0.

### Source Quality

- **Reproducible code/data available:** partial
- **Independent support:** weak
- **Hindsight risk:** high
- **Survivorship risk:** medium
- **Vendor/marketing risk:** low

### Failure Modes

Overfit parameters, ignored fees, exchange-specific fills, regime decay, and cherry-picked pair selection.

### Decision

`Watch`

### Next Micro-Action

Create a source-falsification note before adding any candidate spec.

### Notes

- Treat repo popularity as routing evidence only, not validation.
