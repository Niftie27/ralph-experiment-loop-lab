# H2 SOL 4h research-only demonstration

Candidate: `spam-alt-btc-gated-ma-reclaim-v0`. Entry mode: `next_open`.
Research interval: `[2021-10-18T00:00:00Z, 2025-10-17T00:00:00Z)`.
Each SOL/BTC series contains 8,760 aligned, contiguous 4h candles. The two missing start candles per H1 series were recovered from the existing local October 2021 public archive; no network was used.

| Variant | Trades | Expectancy R | PF | OOS expectancy R | Max DD R |
|---|---:|---:|---:|---:|---:|
| base | 212 | 0.1157 | 1.2141 | 0.0707 | 15.2159 |
| strict_btc_gate | 163 | 0.1284 | 1.2365 | 0.1103 | 12.7317 |

Registry: 2 lines, 2 distinct variants in the candidate family. IDs preserve the original candidate variant ID with `:base` / `:strict_btc_gate` suffixes. Existing params, risk, costs and gate logic are unchanged. IS/OOS and five walk-forward folds stay inside research. The OOS column is research OOS, not holdout.

**Selection contamination:** this candidate was selected on data that includes the holdout period. A later holdout run is not clean validation for it. No holdout metrics were computed.

Offline tests: 46 passed, 0 failed (37 existing + 9 H2). Initial run: 45 passed, 1 failed (`1634515260 !== 60`, synthetic feature timestamp assertion). Fixed once; the single rerun passed 46/46. All tests and demonstration computations used R6.

Snapshot hashes and coverage: `manifest-h2.json`. Runtime source hashes, input provenance, unchanged params, split boundaries, gate diagnostics and walk-forward details: `h2-sol4h.json`. Every successful backtest appends its own metrics and provenance to `variant-registry.jsonl`.

Commands, from this experiment directory (apply the required R6 wrapper):

- `node --test test/*.test.mjs` — offline suite, isolated temporary test artifacts.
- `node src/variant-counts.mjs` — distinct variant IDs per candidate family.
- `node src/run-h2-sol4h.mjs` — two research runs; reruns append two more rows, never truncate the registry.

No services restarted, watchers/v1 changed, Storage Box actions, trading, new keys, tuning or new strategies. Cache remains gitignored.
