# H2 — fixed windows, locked holdout, variant registry

Scope: candle engine only; no strategy, parameter, v1, watcher, or service changes.
The shared backtest entry point clips input before signals, exits, split and walk-forward; it checks holdout authorization before doing any computation. Period endpoints are exclusive. Default research: 2021-10-18 through 2025-10-17; locked holdout: 2025-10-17 through 2026-10-17 (UTC midnight boundaries).

Interfaces: config.dataStart/dataEnd (UTC ISO), period (research default or holdout); holdout additionally requires CLI --final and an existing research registry row matching candidate/variant, params, symbol, timeframe, entry mode, costs, risk and maxBars. This is a workflow guard, not a security boundary against modified source. Raw statistics helpers remain general-purpose primitives; use backtestVariant for candle experiments.

Snapshots: immutable content-addressed JSON in the ignored data/market-cache/h2 directory. Manifest describes every loaded series; existing window bytes cannot silently change. Each completed backtest appends one registry row, including zero-trade runs; rejected authorization attempts append nothing. Append-only is enforced by the writer (O_APPEND), not OS permissions against manual edits. Distinct counts: npm run registry:counts.

Input contract: aligned contiguous SOL/BTC 4h time/open/high/low/close/volume. ATR14, RSI14, MA20/50, volume Z and BTC gate are locally derivable. ATAS, CVD/delta, manual levels, deviations, funding and order book are not required by this existing candle candidate. Missing or invalid required data blocks the demonstration. No substitute strategy inputs.

Tests: offline boundary clipping; guard denial with either missing prerequisite; matching identity success on synthetic data; immutable snapshot checks; append-only byte-prefix proof; engine integration including IS/OOS and walk-forward bounds. Existing engine regression suite retained with research-dated synthetic fixtures and isolated temporary registry/cache paths.

Demonstration: only base and strict_btc_gate, unchanged SOL 4h survivor parameters, next_open, research only. This candidate was selected on data that includes the holdout period. A later holdout run is NOT clean validation for this candidate. No holdout metrics are requested or computed by the demonstration.

Limitations: no trading or promotion claim; candle execution model unchanged; no external data access needed for the demonstration. Historical reports are left untouched and are not new registry trials. All computations execute the checkout sources directly under R6; runtime hashes are recorded and compared to committed blobs before push.
