# Market Data Access Audit

Generated: 2026-08-29T21:51:31.731Z
Status: research-only-no-live-execution

## Summary

- Accessible: 7
- Limited: 0
- Blocked: 0
- Decision: Use Bybit v5 linear klines as the first HYPE historical OHLCV rail; keep Hyperliquid funding/current context and Bybit funding/open-interest as verified next feature rails.

## Checks

### hyperliquid-HYPE-1h-candles

- Venue: Hyperliquid
- Endpoint: POST /info type=candleSnapshot
- Status: accessible
- Rows: 169
- First: 2026-08-22T21:00:00.000Z
- Last: 2026-08-29T21:00:00.000Z
- Note: Accessible for recent candles; longer 1h pulls are row-capped in practice, so this is not the first full OHLCV backtest rail.

### hyperliquid-HYPE-funding

- Venue: Hyperliquid
- Endpoint: POST /info type=fundingHistory
- Status: accessible
- Rows: 500
- First: 2026-07-30T22:00:00.003Z
- Last: 2026-08-20T17:00:00.009Z
- Note: Verified no-key funding history rail for future funding/premium features.

### hyperliquid-HYPE-current-context

- Venue: Hyperliquid
- Endpoint: POST /info type=metaAndAssetCtxs
- Status: accessible
- Rows: 1
- First: n/a
- Last: n/a
- Note: Current funding/open-interest context is accessible, but this is a snapshot rather than a historical series.

### bybit-HYPEUSDT-instrument

- Venue: Bybit
- Endpoint: GET /v5/market/instruments-info
- Status: accessible
- Rows: 1
- First: n/a
- Last: n/a
- Note: Confirms HYPEUSDT linear perpetual is an active public market.

### bybit-HYPEUSDT-60-klines

- Venue: Bybit
- Endpoint: GET /v5/market/kline
- Status: accessible
- Rows: 10
- First: 2026-08-29T12:00:00.000Z
- Last: 2026-08-29T21:00:00.000Z
- Note: Pageable and now wired into the strategy filter for HYPE OHLCV.

### bybit-HYPEUSDT-funding

- Venue: Bybit
- Endpoint: GET /v5/market/funding/history
- Status: accessible
- Rows: 5
- First: 2026-08-28T08:00:00.000Z
- Last: 2026-08-29T16:00:00.000Z
- Note: Verified funding history rail for future feature joins.

### bybit-HYPEUSDT-open-interest

- Venue: Bybit
- Endpoint: GET /v5/market/open-interest
- Status: accessible
- Rows: 5
- First: 2026-08-29T17:00:00.000Z
- Last: 2026-08-29T21:00:00.000Z
- Note: Verified open-interest history rail for future feature joins.

