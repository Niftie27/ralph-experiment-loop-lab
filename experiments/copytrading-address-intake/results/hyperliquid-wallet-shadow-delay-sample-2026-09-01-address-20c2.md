# Hyperliquid Wallet-Shadow Delay Sample

Generated: 2026-09-01T06:43:55.698Z

Mode: research-only, public/no-key, manual tiny sample.

## Verdict

Captured 0 recent fill rows from one known public Hyperliquid address; 0 joined to public 1m candles. 0/0 joined rows had positive gross 60s delay and 0/0 had positive gross 180s delay. After the configured cost stress, 0/0 stayed positive at 60s and 0/0 stayed positive at 180s. This is a mechanics/falsifier artifact only. It does not prove copyability, candidate quality, or strategy edge.

## Capture

- Address: `0x20c2d95a3dfdca9e9ad12794d5fa6fad99da44f5`
- Lookback minutes: 60
- Settle minutes: 6
- Cost stress: 8 bps
- Window: 2026-09-01T05:37:55.698Z to 2026-09-01T06:37:55.698Z
- Requested max rows: 24
- Fills returned in window: 0

## Rows

| Time | Coin | Dir | Price | Size | Age sec | 60s gross | 60s net | 180s gross | 180s net | Flags |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |

## Decision

This tiny frozen sample can inform U-008/U-017 mechanics, but it does not close either unknown. A real closeout still needs 20+ quality observations across independent frozen windows, fee/slippage modeling, selection baseline, exit observability, and hidden-hedge checks.

Boundary delta: no scanner, scheduler, alert, account/key, paid source, demo/testnet, live trading, sizing, TP/SL, execution, public posting, or strategy promotion changed.
