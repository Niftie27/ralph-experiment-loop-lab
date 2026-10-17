# H1 — SOL 4h entry-mode comparison

Generated: 2026-10-17T06:49:19.630Z

## Scope and source

Copied 266 SOL/BTC 4h public archive CSVs (3785354 bytes) from the existing 61 MB Binance archive cache into the matching gitignored checkout cache; existing engine fetched missing public archives and REST tail once per symbol; froze resulting JSON snapshots. The 46 MB market-cache was Bybit HYPE, not SOL/BTC.

Strategy: spam-alt-btc-gated-ma-reclaim-v0; parameters: {"symbol":"SOL","timeframe":"4h","fast":20,"slow":50,"rsiFloorLong":45,"rsiCeilShort":50}.
Costs per side: fee 4 bps + slippage 3 bps. Risk: 1.2 ATR; target: 1.8 R; maxBars: 12.

Required OHLCV is present and validated; ATR/RSI/MAs/volume Z and gate state are locally derived. No missing strategy-critical input. No ATAS/orderflow/manual fields are required by this candle strategy.

- BTC: 10950 candles; 2021-10-18T08:00:00.000Z → 2026-10-17T04:00:00.000Z; file `data/market-cache/h1-BTC-4h.json`; SHA256 `1abfaa8e39cf5ec3abf212f724f09101d597c20bbd5e156560c3dfac2bffa87e`.
- SOL: 10950 candles; 2021-10-18T08:00:00.000Z → 2026-10-17T04:00:00.000Z; file `data/market-cache/h1-SOL-4h.json`; SHA256 `322a7a54bbfa289dc0b3570c27c35eb34911d79ab153a19473701a0beef51ae9`.

## Results alongside October 4

| Variant | Snapshot / entry mode | Trades | Expectancy R | PF | OOS expectancy R | Max DD R |
|---|---|---:|---:|---:|---:|---:|
| base | 2026-10-04 original | 262 | 0.1391 | 1.2595 | 0.1089 | 15.2085 |
| base | current / signal_close | 267 | 0.1263 | 1.2341 | 0.0963 | 15.2085 |
| base | current / next_open | 267 | 0.1262 | 1.234 | 0.0964 | 15.2159 |
| strict_btc_gate | 2026-10-04 original | 196 | 0.1582 | 1.298 | 0.142 | 12.7317 |
| strict_btc_gate | current / signal_close | 198 | 0.1489 | 1.2792 | 0.1295 | 12.7317 |
| strict_btc_gate | current / next_open | 198 | 0.1486 | 1.2786 | 0.1295 | 12.7317 |

## Long / short split

| Variant | Snapshot / mode | Direction | Trades | Expectancy R | PF |
|---|---|---|---:|---:|---:|
| base | 2026-10-04 original | long | 150 | 0.2302 | 1.452 |
| base | 2026-10-04 original | short | 112 | 0.0169 | 1.0296 |
| base | signal_close | long | 150 | 0.1977 | 1.3773 |
| base | signal_close | short | 117 | 0.0347 | 1.0621 |
| base | next_open | long | 150 | 0.1975 | 1.3768 |
| base | next_open | short | 117 | 0.0349 | 1.0623 |
| strict_btc_gate | 2026-10-04 original | long | not verified | not verified | not verified |
| strict_btc_gate | 2026-10-04 original | short | not verified | not verified | not verified |
| strict_btc_gate | signal_close | long | 118 | 0.218 | 1.422 |
| strict_btc_gate | signal_close | short | 80 | 0.047 | 1.0842 |
| strict_btc_gate | next_open | long | 118 | 0.2177 | 1.4213 |
| strict_btc_gate | next_open | short | 80 | 0.0468 | 1.0838 |

Original strict-gate direction split: not verified; absent from the original report.

## Semantics and verification

signal_close is the default unchanged path. next_open retains signal-bar ATR/gate; entryIndex/time identify next bar; inclusive maxBars horizon starts at entry bar; stop-first includes that bar. Candidate and baseline split/purge labels use actual entry index. No next bar => null; existing backtest signal bounds remain unchanged.

Verified: the BTC gate aligns BTC 4h to SOL 4h by candle.time (src/run-strategy-spam-survivor-stress.mjs lines 214-219) and reads no later index. classifyBtcRegime calls marketContext at that index; its indicators use only that index and earlier candles.

31/31 original offline tests passed; 37/37 tests passed after H1 (six added). Four runs, one immutable snapshot, identical costs. Baseline metrics and split diagnostics are in JSON.

Executed these source files directly from this checkout under R6; no deployed/runtime copies.

- `src/engine.mjs`: `156a77dadb535cbe8a4289b8be602f5454c02964baa03185577f8979ef512456`
- `src/run-h1-entry-mode-sol4h.mjs`: `d1dfd602a90df0ac3a265848bfce775b7a324db047b89ebe5c0a5b6ad7dc1b15`
- `src/run-strategy-spam-survivor-stress.mjs`: `5da48c04e07966b632a30a35696fcfda381c4a104bf7d93203f88bdb956055a8`
- `src/market-data.mjs`: `3296d99db1f49f0c167515996dbd2143e028c221991126142a8c7eea2f86353e`
- `config.default.json`: `bf9d30df877dd83757d890786b993aa507d5547ac502bb369d0e20b23da90895`

## Limitations

- Current frozen snapshot differs from October 4; comparisons to historical numbers mix data-window and entry-mode effects. Compare the two modes within this snapshot to isolate entry semantics.
- Original REST-tail bytes were not preserved; no claim of exact October 4 snapshot reproduction.
- Engine REST tail includes the latest candle, possibly still open. The snapshot is frozen identically for all four runs; this existing data behavior is unchanged.
- Candle model only; no strategy promotion or execution claim.
