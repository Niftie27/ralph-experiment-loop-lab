# Hyperliquid Wallet-Shadow Delay Sample

Generated: 2026-09-01T06:40:40.497Z

Mode: research-only, public/no-key, manual tiny sample.

## Verdict

Captured 24 recent fill rows from one known public Hyperliquid address; 24 joined to public 1m candles. 18/24 joined rows had positive gross 60s delay and 19/24 had positive gross 180s delay. After the configured cost stress, 9/24 stayed positive at 60s and 17/24 stayed positive at 180s. This is a mechanics/falsifier artifact only. It does not prove copyability, candidate quality, or strategy edge.

## Capture

- Address: `0x7fdafde5cfb5465924316eced2d3715494c517d1`
- Lookback minutes: 60
- Settle minutes: 6
- Cost stress: 8 bps
- Window: 2026-09-01T05:34:40.497Z to 2026-09-01T06:34:40.497Z
- Requested max rows: 24
- Fills returned in window: 720

## Rows

| Time | Coin | Dir | Price | Size | Age sec | 60s gross | 60s net | 180s gross | 180s net | Flags |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 2026-09-01T06:34:33.989Z | xyz:MU | Close Long | 959.85 | 0.172 | 366.5 | -5.42 | -13.42 | 3.96 | -4.04 | exit-row-not-entry-signal, single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:34:31.570Z | xyz:SNDK | Open Short | 1548.5 | 0.244 | 368.9 | 5.81 | -2.19 | -7.75 | -15.75 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:34:31.570Z | xyz:SNDK | Open Short | 1548.5 | 0.421 | 368.9 | 5.81 | -2.19 | -7.75 | -15.75 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:48.575Z | xyz:SNDK | Open Short | 1549.3 | 0.04 | 411.9 | 10.97 | 2.97 | 10.33 | 2.33 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:47.024Z | XMR | Open Short | 522.24 | 0.449 | 413.5 | -17.23 | -25.23 | -1.53 | -9.53 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:47.024Z | XMR | Open Short | 522.35 | 0.673 | 413.5 | -15.12 | -23.12 | 0.57 | -7.43 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:31.479Z | xyz:SNDK | Open Short | 1549.1 | 0.055 | 429 | 9.68 | 1.68 | 9.04 | 1.04 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:30.876Z | xyz:SNDK | Open Short | 1549.1 | 0.129 | 429.6 | 9.68 | 1.68 | 9.04 | 1.04 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:30.876Z | xyz:SNDK | Open Short | 1549.1 | 1.9 | 429.6 | 9.68 | 1.68 | 9.04 | 1.04 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:30.267Z | xyz:SNDK | Open Short | 1549.1 | 0.129 | 430.2 | 9.68 | 1.68 | 9.04 | 1.04 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:29.664Z | xyz:SNDK | Open Short | 1549.1 | 0.129 | 430.8 | 9.68 | 1.68 | 9.04 | 1.04 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:29.060Z | xyz:SNDK | Open Short | 1549.1 | 1.484 | 431.4 | 9.68 | 1.68 | 9.04 | 1.04 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:29.060Z | xyz:SNDK | Open Short | 1549.1 | 0.129 | 431.4 | 9.68 | 1.68 | 9.04 | 1.04 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:29.060Z | xyz:SNDK | Open Short | 1549.1 | 1 | 431.4 | 9.68 | 1.68 | 9.04 | 1.04 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:33:26.644Z | xyz:NVDA | Close Long | 220.45 | 2.27 | 433.9 | -0.45 | -8.45 | -3.18 | -11.18 | exit-row-not-entry-signal, single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:32:56.460Z | WLD | Open Short | 0.37187 | 693.7 | 464 | -4.84 | -12.84 | 9.68 | 1.68 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:32:15.521Z | xyz:SNDK | Open Short | 1549.2 | 0.993 | 505 | 3.87 | -4.13 | 10.33 | 2.33 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:32:10.052Z | xyz:SNDK | Open Short | 1549.2 | 0.77 | 510.4 | 3.87 | -4.13 | 10.33 | 2.33 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:32:09.383Z | xyz:SNDK | Open Short | 1549.2 | 0.23 | 511.1 | 3.87 | -4.13 | 10.33 | 2.33 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:32:06.949Z | xyz:SNDK | Open Short | 1549.2 | 0.129 | 513.5 | 3.87 | -4.13 | 10.33 | 2.33 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:32:06.546Z | xyz:SNDK | Open Short | 1549.2 | 0.803 | 514 | 3.87 | -4.13 | 10.33 | 2.33 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:32:06.349Z | xyz:SNDK | Open Short | 1549.2 | 0.129 | 514.1 | 3.87 | -4.13 | 10.33 | 2.33 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:32:06.349Z | xyz:SNDK | Open Short | 1549.2 | 1 | 514.1 | 3.87 | -4.13 | 10.33 | 2.33 | single-known-address, no-hidden-hedge-check, no-selection-baseline |
| 2026-09-01T06:31:56.957Z | xyz:GOLD | Open Short | 4431 | 0.2052 | 523.5 | 0 | -8 | -2.71 | -10.71 | single-known-address, no-hidden-hedge-check, no-selection-baseline |

## Decision

This tiny frozen sample can inform U-008/U-017 mechanics, but it does not close either unknown. A real closeout still needs 20+ quality observations across independent frozen windows, fee/slippage modeling, selection baseline, exit observability, and hidden-hedge checks.

Boundary delta: no scanner, scheduler, alert, account/key, paid source, demo/testnet, live trading, sizing, TP/SL, execution, public posting, or strategy promotion changed.
