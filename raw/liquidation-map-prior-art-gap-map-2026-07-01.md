# Liquidation-Map Prior Art Gap Map

Source: Telegram correction from Tomas plus claim-specific web verification.
Date: 2026-07-01

## Context

Tomas pushed back on three overconfident claims:

1. Do not assert tool capabilities or costs without reading the relevant docs.
2. Do not assume Nansen is affordable before checking pricing.
3. Do not claim "this does not exist for retail, so build the missing differentiated layer" without mapping whether it is missing because it is hard, expensive, closed, already solved, or simply not useful.

This memo corrects the liquidation-map branch from "build likely missing layer" to:

> Existing liquidation heatmap/data products already exist. RALPH's next task is to map the actual gap: exportability, history, replayability, methodology transparency, and whether passive liquidity around liquidation clusters has positive replay EV after adverse selection and tail losses.

## Claim-Specific Verification

### Nansen cost is not assumed

Official Nansen API docs currently show:

- Pro subscription: $49/month annual or $69/month monthly.
- Starter credits: 1,000 credits before first purchase.
- Free plan: 100 trial credits with 10x credit consumption.
- Nansen x402 pay-per-call: basic tier at $0.01/call and premium tier at $0.05/call, including Smart Money data in the premium tier.

Verdict:

> Nansen is not "free" and should not be treated as a default paid dependency. It is feasible for small verification, but systematic smart-money backtesting can still become expensive through API call volume.

### Liquidation maps already exist

Observed retail/prosumer liquidation-map products or data sources:

- CoinGlass liquidation heatmap UI and API endpoint.
- CoinGlass API pricing from $29/month for Hobbyist, with higher tiers for larger endpoint counts/rate limits.
- Kiyotaka Hyperliquid liquidation heatmaps.
- TradingDifferent liquidation heatmap UI for crypto and other markets.
- 0xArchive Hyperliquid liquidation event data with REST/WebSocket, free tier, paid replay/export tiers.
- Allium / Datawallet-style Hyperliquid liquidation dashboards and data layers.

Verdict:

> The map itself is not obviously missing. The possible missing layer is not "draw a heatmap." It is exportable historical replay, methodology transparency, passive-order simulation, adverse-excursion scoring, and tail-risk accounting under Tomas-specific constraints.

### Hyperliquid raw path has limits

Hyperliquid docs describe the info endpoint as returning exchange and specific-user data. `clearinghouseState` can return a user's margin/account/position state, but a global liquidation map still needs a user universe, indexed state, or a data provider. Hyperliquid liquidations use mark price, which blends external CEX prices and Hyperliquid's book state, so exact monitoring needs the proper liquidation mechanics rather than a naive book-price trigger.

Verdict:

> A raw RALPH-built Hyperliquid map is plausible only if address discovery/indexing is solved. Do not assume one public endpoint gives complete global liquidation clusters.

## Why Might This Not Be a Retail Productive Edge?

Possible explanations to map before building:

1. Visualization already exists, but signal does not imply profit.
   Heatmaps can show likely forced-flow zones without saying whether to fade, follow, avoid, or provide liquidity.

2. Liquidation clusters may be magnets, not reversal zones.
   A cluster can attract price and accelerate continuation. Passive liquidity provision can catch a bounce or catch a real trend continuation.

3. Negative skew may dominate.
   Many small reversions can be erased by one trend day or correlated cascade. Position sizing is the strategy, not a detail.

4. Public heatmaps may crowd the same levels.
   If many traders place orders around the same visible zones, the edge can decay, turn into stop-hunting, or become path-dependent.

5. Useful replay data may be paid or export-limited.
   UI-only heatmaps are useful for discretionary context but weak for systematic replay. API/export/history costs can decide feasibility.

6. The signal may be a volatility/beta proxy.
   Big clusters may just appear when volatility and leverage are high. Any replay must benchmark against simpler volatility/liquidity rules.

## Build Only the Missing Differentiated Layer

This principle still stands, but only after this gap test:

1. If a product provides map + history + export + replay context cheaply, use it.
2. If a product provides map but not replay/export, build only the replay adapter around exported or sampled data.
3. If raw data exists but no product gives Tomas-specific replay/risk scoring, build that scorer, not another generic heatmap.
4. If neither data nor replay is available at reasonable cost, demote to visual radar or discard.
5. If replay shows negative EV after fees, missed fills, adverse selection, and tail risk, discard even if the map is visually impressive.

## Updated Next Loop

Before `liquidation-map-replay-harness`, run:

> `liquidation-map-prior-art-gap-map`

Output required:

- product list;
- cost;
- export/API/history support;
- methodology transparency;
- whether data is predicted liquidation levels or actual liquidation events;
- whether passive reversion around clusters has empirical support;
- minimum no-key/no-paid sample possible;
- verdict: use existing product, build adapter, build custom indexer, radar-only, or discard.

## Sources Checked

- Nansen credits/pricing: https://docs.nansen.ai/getting-started/credits
- Nansen x402 pay-per-call: https://nansen.ai/post/how-nansen-enabled-pay-per-call-onchain-data-access-with-x402-and-payai
- Nansen API overview / Smart Money endpoints: https://docs.nansen.ai/api/overview
- CoinGlass pricing: https://www.coinglass.com/pricing
- CoinGlass liquidation heatmap API: https://docs.coinglass.com/reference/liquidation-heatmap
- Kiyotaka Hyperliquid liquidation heatmaps: https://kiyotaka.ai/blog/liquidation-heatmaps-for-hyperliquid
- TradingDifferent liquidation heatmap: https://tradingdifferent.com/
- 0xArchive Hyperliquid liquidation data: https://0xarchive.io/blog/hyperliquid-liquidations-data
- 0xArchive pricing: https://0xarchive.io/pricing
- Hyperliquid info endpoint: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
- Hyperliquid liquidations: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations
- Chainstack clearinghouseState: https://docs.chainstack.com/reference/hyperliquid-info-clearinghousestate
