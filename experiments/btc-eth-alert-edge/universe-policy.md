# Dynamic Crypto Universe Policy

Status: initial.

Purpose: widen alert/statistics coverage beyond BTC/ETH without collecting every possible alt forever.

## Goal

Maintain a dynamic research universe for liquid majors and larger/mid-sized alts such as SOL, HYPE, and whatever is currently moving with enough liquidity and available data.

This is a selector, not a trade signal.

## Selection Inputs

Prefer existing public rails:

- Binance spot `exchangeInfo` and 24h ticker.
- Binance USD-M futures `exchangeInfo` and 24h ticker.
- Hyperliquid public `metaAndAssetCtxs`.
- CoinGecko trending search as a context hint, not a trading signal.
- Existing orderflow/features and news/security/event context when available.

## Selection Criteria

An asset can enter the selected universe when it has one or more of:

- strong liquidity on at least one trusted venue
- large 24h movement or volatility expansion
- multiple venue coverage
- watchlist status from Tomas/RALPH
- strong event/news/security/protocol reason
- useful derivatives context such as open interest or funding

## Current Watchlist

- BTC
- ETH
- SOL
- HYPE

## Guardrails

- Do not backtest every alt by default.
- Do not promote low-liquidity names from trending alone.
- Exclude stablecoins/quote assets from directional setup scans.
- Do not rely on one venue when another venue shows contradictory liquidity/price behavior.
- Do not use paid data or account keys without explicit approval.
- Always mark data-source gaps in alerts and summaries.

## Alert Rule

For assets outside BTC/ETH, first show universe evidence:

- why this asset is in scope now
- venue/liquidity coverage
- movement or event trigger
- available history/sample depth
- whether setup stats are mature, weak, or low-sample

Only then attach setup probability stats.
