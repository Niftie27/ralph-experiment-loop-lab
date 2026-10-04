---
source_type: tool_check
created: 2026-07-01T23:15:00Z
authors:
  - assistant
---

# Slow Accumulator Tool Fit Check

Question:

> Which existing tools can actually support slow mid-cap spot accumulator following, rather than fast perp copy trading?

Initial official-source check:

## Copin

Copin is primarily a perpetual DEX analytics and copy-trading product.

Its docs describe it as a data analytics infrastructure solution for perpetual decentralized exchanges. It enables exploring, analyzing, and copying on-chain traders from perpetual DEXs, and its Hyperliquid copy-trading docs require connecting a Hyperliquid API wallet.

Implication:

- good prior art for perp copy-trading and trader profiling;
- not the primary source for slow spot/mid-cap accumulation;
- anything involving copy execution or API wallet is inspect-only until explicit approval.

Sources:

- https://docs.copin.io/
- https://docs.copin.io/features/decentralized-copy-trading-dcp/connect-hyperliquid

## Nansen

Nansen is the best initial fit for slow smart-money spot accumulation research.

Its docs/API describe Token God Mode, Smart Money movements, holder-base analysis, exchange-flow tracking, flow intelligence, holders, token flows, who-bought/sold, DEX trades, transfers, and Wallet Profiler-style workflows.

Implication:

- likely best tool to evaluate first for smart-money cohort discovery;
- still not truth: Smart Money labels can be survivorship-biased and vendor-defined;
- RALPH must use Nansen as a candidate-source and then apply independent forward validation.

Sources:

- https://docs.nansen.ai/api/overview
- https://nansen.ai/post/how-to-track-smart-money-crypto-accumulation-ultimate-guide
- https://academy.nansen.ai/articles/6611574-track-smart-money-accumulation-early-using-token-god-mode-profiler

## Arkham

Arkham is useful for entity/address/label intelligence and transaction investigation.

Its API docs emphasize addresses, entities, labels, transactions, rate limits, pagination, and probabilistic attribution.

Implication:

- useful for validating wallet/entity identity and tracking specific addresses;
- useful second opinion or enrichment layer;
- less clearly a cohort/screener engine than Nansen for smart-money accumulation.

Source:

- https://arkm.com/api/docs

## Dune

Dune is a programmable SQL/API data warehouse and can run custom analytics workflows.

Dune docs describe query execution and API result retrieval. Its Hyperliquid data page shows market data such as volume, open interest, and funding, but monthly updated.

Implication:

- good for custom historical cohort queries if the right chain/tables/labels exist;
- not automatically real-time;
- Hyperliquid Dune data is market-data oriented, not the slow spot accumulation source.

Sources:

- https://docs.dune.com/api-reference/overview/introduction
- https://docs.dune.com/data-catalog/community/hyperliquid/overview

## Freqtrade

Freqtrade is an execution/backtest/dry-run engine, not a smart-money signal source.

Docs confirm backtesting, exchange support, and lookahead-analysis. Hyperliquid support exists, but Hyperliquid spot has limitations and private calls require wallet/API-wallet private key configuration.

Implication:

- useful later as validation/execution engine;
- not where the slow smart-money signal lives;
- no keys/live capital without explicit approval.

Sources:

- https://www.freqtrade.io/en/stable/exchanges/
- https://www.freqtrade.io/en/stable/backtesting/
- https://www.freqtrade.io/en/stable/lookahead-analysis/

## Tenderly / EigenPhi

Tenderly is transaction simulation/debug/infrastructure. EigenPhi is MEV/flow analytics.

Implication:

- not primary tools for patient-retail smart-money accumulation;
- relevant later only if a branch needs EVM simulation or MEV strategy research.

## Working Conclusion

For slow mid-cap accumulator following:

1. Start with Nansen as the primary tool candidate.
2. Use Arkham for wallet/entity enrichment and sanity checks.
3. Use Dune for custom SQL/cohort historical extraction if coverage is sufficient.
4. Treat Copin/HyperX as perp-copy prior art, not the slow spot signal source.
5. Treat Freqtrade as possible engine, not signal.
6. Defer EigenPhi/Tenderly unless the strategy family changes.

