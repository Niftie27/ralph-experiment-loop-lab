# Hyperliquid Wallet-Shadow Delay Sample

Generated: 2026-09-01T06:43:55.545Z

Mode: research-only, public/no-key, manual tiny sample.

## Verdict

Captured 24 recent fill rows from one known public Hyperliquid address; 24 joined to public 1m candles. 16/24 joined rows had positive gross 60s delay and 2/24 had positive gross 180s delay. After the configured cost stress, 0/24 stayed positive at 60s and 0/24 stayed positive at 180s. This is a mechanics/falsifier artifact only. It does not prove copyability, candidate quality, or strategy edge.

## Capture

- Address: `0x5b5d51203a0f9079f8aeb098a6523a13f298c060`
- Lookback minutes: 60
- Settle minutes: 6
- Cost stress: 8 bps
- Window: 2026-09-01T05:37:55.545Z to 2026-09-01T06:37:55.545Z
- Requested max rows: 24
- Fills returned in window: 622

## Rows

| Time | Coin | Dir | Price | Size | Age sec | 60s gross | 60s net | 180s gross | 180s net | Flags |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 2026-09-01T06:35:13.817Z | SOL | Open Short | 103.87 | 15.42 | 521.7 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:13.817Z | SOL | Open Short | 103.87 | 1.68 | 521.7 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:13.817Z | SOL | Open Short | 103.87 | 8.55 | 521.7 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:13.817Z | SOL | Open Short | 103.87 | 18.65 | 521.7 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:13.817Z | SOL | Open Short | 103.87 | 3.83 | 521.7 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:12.936Z | SOL | Open Short | 103.87 | 4.55 | 522.6 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:12.936Z | SOL | Open Short | 103.87 | 15.54 | 522.6 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:12.936Z | SOL | Open Short | 103.87 | 16.29 | 522.6 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:12.936Z | SOL | Open Short | 103.87 | 11.76 | 522.6 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:12.116Z | SOL | Open Short | 103.87 | 11.72 | 523.4 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:12.116Z | SOL | Open Short | 103.87 | 0.57 | 523.4 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:12.116Z | SOL | Open Short | 103.87 | 10 | 523.4 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:12.116Z | SOL | Open Short | 103.87 | 4.66 | 523.4 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:12.116Z | SOL | Open Short | 103.87 | 21.1 | 523.4 | 2.89 | -5.11 | -0.96 | -8.96 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:11.059Z | SOL | Open Short | 103.9 | 0.16 | 524.5 | 5.77 | -2.23 | 1.92 | -6.08 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:35:11.059Z | SOL | Open Short | 103.89 | 48 | 524.5 | 4.81 | -3.19 | 0.96 | -7.04 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:30:45.901Z | SOL | Open Short | 103.87 | 19.42 | 789.6 | -11.55 | -19.55 | -8.66 | -16.66 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:30:45.901Z | SOL | Open Short | 103.87 | 5.64 | 789.6 | -11.55 | -19.55 | -8.66 | -16.66 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:30:45.901Z | SOL | Open Short | 103.87 | 23.08 | 789.6 | -11.55 | -19.55 | -8.66 | -16.66 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:30:44.966Z | SOL | Open Short | 103.87 | 0.16 | 790.6 | -11.55 | -19.55 | -8.66 | -16.66 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:30:44.966Z | SOL | Open Short | 103.87 | 3.17 | 790.6 | -11.55 | -19.55 | -8.66 | -16.66 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:30:44.966Z | SOL | Open Short | 103.87 | 14.28 | 790.6 | -11.55 | -19.55 | -8.66 | -16.66 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:30:44.966Z | SOL | Open Short | 103.87 | 9.14 | 790.6 | -11.55 | -19.55 | -8.66 | -16.66 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:30:44.966Z | SOL | Open Short | 103.87 | 19.78 | 790.6 | -11.55 | -19.55 | -8.66 | -16.66 | single-known-address, no-hidden-hedge-check, no-selection-baseline |

## Decision

This tiny frozen sample can inform U-008/U-017 mechanics, but it does not close either unknown. A real closeout still needs 20+ quality observations across independent frozen windows, fee/slippage modeling, selection baseline, exit observability, and hidden-hedge checks.

Boundary delta: no scanner, scheduler, alert, account/key, paid source, demo/testnet, live trading, sizing, TP/SL, execution, public posting, or strategy promotion changed.
