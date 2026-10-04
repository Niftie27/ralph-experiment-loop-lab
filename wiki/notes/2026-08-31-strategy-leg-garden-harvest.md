---
type: note
topic: strategy-leg-garden-harvest
created: 2026-08-31T05:52:00Z
last_updated: 2026-08-31T05:52:00Z
work_item: discovery.strategy-leg-garden
status: complete
scope: research-only
sources:
  - 2026-07-02-strategy-leg-garden.md
  - templates/strategy-leg-note.md
  - 2026-08-31-patient-retail-archetype-prioritization.md
  - 2026-08-31-mid-cap-accumulation-flow-scan.md
  - 2026-08-30-grid-range-existing-tool-trial-design.md
  - 2026-08-30-hyperliquid-data-feasibility-spike.md
  - https://api-docs.defillama.com/
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
  - ../concepts/patient-retail-strategy-map.md
---
# Strategy Leg Garden Harvest

## Purpose

This closes the current bounded `discovery.strategy-leg-garden` pass.

Goal: preserve a few compact patient-retail strategy legs with explicit data rails, dumb baselines, kill tests, and tail risks. These are not candidates, live-alert changes, or execution plans.

## Leg: funding-basis-persistence-baseline

- **Status:** raw-idea / best-next-baseline
- **Date added:** 2026-08-31
- **Source / prompt:** patient-retail prioritization; Hyperliquid public `metaAndAssetCtxs`
- **Related candidates / unknowns:** C-025, U-023, U-025

### Thesis

A simple market-level funding/basis monitor may be the cleanest no-prediction baseline for patient-retail research.

### Observation

Funding/basis is slow enough to observe and public Hyperliquid context exposes funding, open interest, price, and volume without keys.

### Mechanism

If leveraged crowding persistently pays funding, a roughly hedged spot/perp or proxy baseline may collect structural yield; the edge is market-structure carry, not directional prediction.

### Speed / Latency Fit

Good. The signal changes over hours/days, not seconds.

### Data Rail

Hyperliquid public info endpoint for funding/OI/volume context; DefiLlama for market, stablecoin, protocol, and yield context; local candles for price and volatility.

### Dumb Baseline

Hold stablecoins, no-trade, staking/yield proxy, or spot-only exposure over the same window.

### Cheapest Kill Test

Measure funding persistence and flip frequency over top liquid Hyperliquid markets, then reject if positive carry is rare, unstable, too crowded, or dominated by tail-risk assumptions before any account/demo step.

### Kill Criteria

- Funding flips often enough to erase the carry premise.
- Expected carry after conservative hedge/rebalance costs is below a simple no-risk/yield baseline.
- Tail stress requires leverage or margin assumptions RALPH cannot safely model without account/exchange integration.

### Tail Risk

Funding compression, funding flip, liquidation or basis blowout on hedge leg, venue risk, stablecoin depeg, and rebalancing costs.

### Existing Tools / Prior Art

Exchange funding dashboards, Hyperliquid public API, DefiLlama yields/stablecoin context, and future Freqtrade/vectorbt-style offline accounting if the baseline needs simulation.

### Next Micro-Action

Run `discovery.funding-basis-baseline-monitor` as a read-only feasibility/spec pass.

## Leg: smart-money-mid-cap-accumulation

- **Status:** raw-idea / access-gated-alpha
- **Date added:** 2026-08-31
- **Source / prompt:** mid-cap accumulation scan
- **Related candidates / unknowns:** C-022, C-024, C-029, C-030, U-024, U-030

### Thesis

Slow mid-cap wallet/cohort accumulation may lead multi-day retail repricing if the cohort can be frozen before the move and followed through exits.

### Observation

This is Tomas's preferred slow-informational branch, but current public/no-key rails do not yet produce enough wallet plus token-flow plus exit-flow rows.

### Mechanism

Repeated informed accumulation before attention may expose private research, early narrative rotation, or liquidity-aware positioning.

### Speed / Latency Fit

Good if holding periods are days/weeks and exits can be tracked; bad if signal is only a vendor-labeled hindsight screen.

### Data Rail

Nansen/Dune/Arkham exports or approved/manual rows; DefiLlama only for universe/liquidity context.

### Dumb Baseline

Mid-cap momentum, BTC/ETH beta, sector beta, volume breakout, or random top-liquidity basket.

### Cheapest Kill Test

One frozen token/cohort export: at least 20 wallets, 7-14 days of entry and exit flow, and a comparison to momentum/beta baselines.

### Kill Criteria

- Cannot export enough rows without paid/keyed access or manual UI work.
- PnL is dominated by one wallet, one token, or broad beta.
- Exits are missing, delayed, or show Tomas would become exit liquidity.

### Tail Risk

Vendor-label survivorship, wash/internal transfers, exchange wallets, private hedges, illiquid mid-caps, and distribution into late buyers.

### Existing Tools / Prior Art

Nansen smart-money APIs, Dune transfer SQL, Arkham labels/flows, and public dashboards as source claims.

### Next Micro-Action

Only continue after a Dune/Nansen/Arkham export/access HITL or manual export sample.

## Leg: range-grid-offline-falsifier

- **Status:** raw-idea / watch-offline
- **Date added:** 2026-08-31
- **Source / prompt:** grid/range existing-tool trial design
- **Related candidates / unknowns:** C-028, U-027

### Thesis

Simple range/grid behavior may fit patient retail if it can beat no-trade and buy-and-hold through sideways regimes after costs.

### Observation

Products already solve execution/UI, so RALPH's only useful role is a cheap offline falsifier.

### Mechanism

Mean reversion within stable ranges can harvest oscillation, but one trend tail can erase many small wins.

### Speed / Latency Fit

Good mechanically, but only if the operator avoids discretionary chasing and accepts long quiet periods.

### Data Rail

Public candles and existing offline range/grid design; no account, key, or product login.

### Dumb Baseline

No-trade, buy-and-hold, fixed DCA, or simple moving-average regime filter.

### Cheapest Kill Test

Run one public-candle range/grid falsifier with pre-fixed fees, spread/slippage, funding if perps, and trend-break losses.

### Kill Criteria

- Does not beat no-trade or buy-and-hold after costs.
- Loss clusters dominate returns.
- Results require unrealistically tight fills or manual intervention.

### Tail Risk

Trend break, gap, inventory concentration, exchange/product risk, and parameter overfit.

### Existing Tools / Prior Art

Hummingbot, Pionex, TradingView strategies, and public grid bots are prior art, not approval to use products.

### Next Micro-Action

Keep watch until a one-file offline falsifier is worth running.

## Leg: token-unlock-liquidity-pressure

- **Status:** raw-idea / source-first-watch
- **Date added:** 2026-08-31
- **Source / prompt:** patient-retail archetype map
- **Related candidates / unknowns:** U-037

### Thesis

Large token unlocks may create slow, public supply pressure or post-unlock relief if recipient type, liquidity, and market regime are classified correctly.

### Observation

The timeline is slow enough for Tomas, but the naive short-unlock trade is crowded and often priced in.

### Mechanism

Unlocks change liquid float and recipient optionality. The edge, if any, comes from separating sellable supply from non-selling or already-hedged supply.

### Speed / Latency Fit

Good for observation; weak if the event is too public and already priced.

### Data Rail

Needs a no-key/exportable unlock calendar with recipient class, unlock size, float, liquidity, and post-event price/volume labels.

### Dumb Baseline

Market beta, sector beta, pre-event drift, volatility regime, and simple post-event mean reversion.

### Cheapest Kill Test

Find one exportable unlock dataset and test whether recipient/liquidity labels beat a naive unlock-size baseline.

### Kill Criteria

- No exportable source with recipient/liquidity fields.
- Signal is explained by market/sector beta.
- Results reverse when excluding top outlier events.

### Tail Risk

Crowded positioning, hedging, unlock delay/change, low liquidity, and narrative shocks.

### Existing Tools / Prior Art

Public unlock calendars and dashboards, not yet access-verified in this workspace.

### Next Micro-Action

Source-first scan only; do not build.

## Leg: event-radar-to-paper-filter

- **Status:** raw-idea / radar-only
- **Date added:** 2026-08-31
- **Source / prompt:** Trump-person event radar and wallet-shadow falsification notes
- **Related candidates / unknowns:** C-008, C-018, U-002, U-020

### Thesis

Large public/political event shocks can create replay windows and context labels, even if wallets around them are not copyable.

### Observation

Event radar is useful for selecting volatile windows, but not as a live trade trigger.

### Mechanism

Public statements, policy shocks, tariffs, reserve comments, or geopolitical news can create forced repositioning and liquidity dislocations.

### Speed / Latency Fit

Weak for copying. Acceptable as replay-window selection and context tagging.

### Data Rail

Official public source pages, archived public posts, local alert/review rows, and public market candles/orderflow.

### Dumb Baseline

Large candle, volatility spike, volume spike, and BTC beta around the same timestamp.

### Cheapest Kill Test

Freeze event windows and test whether event labels improve replay/paper classification over simple volatility/candle baselines.

### Kill Criteria

- Event labels do not beat volatility/candle baselines.
- Timestamp/source attribution is ambiguous.
- Wallet behavior cannot be separated from hindsight or leaderboard bias.

### Tail Risk

Narrative overfit, fake attribution, delayed public source, political noise, and model storytelling.

### Existing Tools / Prior Art

Local alert-edge paper ledger, official public pages, and event-window replay notes.

### Next Micro-Action

Keep radar-only; use only when a concrete event window needs labeling.

## Decision

This garden pass produces no promoted strategy. It narrows the next useful queue:

1. `funding-basis-baseline-monitor` is the next no-key measurable branch.
2. `smart-money-mid-cap-accumulation` waits for access/export evidence.
3. `range-grid-offline-falsifier` stays watch.
4. `token-unlock-liquidity-pressure` needs a source-first scan.
5. `event-radar-to-paper-filter` stays radar/context only.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
