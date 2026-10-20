# F1a-1: data identity

Step F1a-1 of the [F1 factory spec](../factory-spec-f1.md) (Data plan, "Data identity"; first item of rollout F1a), approved by Tomas on 2026-10-19. Branch `f1/a1-identity` from `7238f6c`. All code is in `experiments/strategy-destruction-filter`.

## What changed

Exchange, market type and contract are now part of every snapshot key and every registry identity, so a spot snapshot can never answer a futures request or the reverse.

An **instrument** is the triple `{ exchange, market, contract }`; `contract` is the exchange's instrument symbol. Providers map to instruments like this:

| Provider (`symbolConfig.provider`) | exchange | market | contract |
| --- | --- | --- | --- |
| `binance-spot` (default, unchanged) | `binance` | `spot` | `binanceSpotSymbol`, else `<SYMBOL>USDT` |
| `bybit-linear` (HYPE today) | `bybit` | `linear_perpetual` | `bybitSymbol`, else `<SYMBOL>USDT` |
| `binance-usdm` (coming; no fetcher yet) | `binance` | `linear_perpetual` | `binanceUsdmSymbol`, else `<SYMBOL>USDT` |

`linear_perpetual` is the market term the candidates already use (`dataRequirements.markets`); Bybit linear and Binance USD-M perpetuals differ by exchange. Any other provider throws `Unsupported market-data provider`.

Legacy data: records written before F1a-1 carry none of the three fields. They are read as `binance / spot / <SYMBOL>USDT` and never rewritten:

- the 2 entries in `results/manifest-h2.json` (BTC 4h, SOL 4h): their bytes are the Binance Vision `BTCUSDT` and `SOLUSDT` spot archives (rebuilt below with matching SHA-256);
- the 400 rows in `results/variant-registry.jsonl`: all BTC or SOL 4h research rows with `manifestSha256` = `41dc5372…a308`, the SHA-256 of the current manifest;
- the 398 items in `research-queue.json`.

A record with only some of the three fields fails with `Incomplete data identity`.

### Files and functions

| File | Function | Change |
| --- | --- | --- |
| `src/h2-contract.mjs` | `instrumentFor`, `instrumentForSymbol`, `instrumentOf`, `sameInstrument` | New. Provider config to instrument; config symbol to instrument (default Binance spot); legacy-aware read of a manifest entry, registry identity or queue item; equality |
| | `freezeSeries`, `cachedSeries` | Optional `instrument` argument (default from the config symbol). The manifest key includes the instrument; new entries store `exchange`, `market`, `contract`; snapshot bytes and file names are unchanged (still content-addressed); `cachedSeries` meta carries the instrument |
| | `identityFor` | Optional `instrument` argument; the identity includes `exchange`, `market`, `contract` |
| | `registryRows` | Legacy rows get the Binance spot instrument on read (row and `identity`); the file is not touched |
| | `guardHoldout` | Unchanged code. It now compares identities that include the instrument, so a legacy spot research row authorizes only the Binance spot identity |
| `src/market-data.mjs` | `fetchConfiguredCandles` | Resolves the instrument from the symbol config for cache lookup, fetch symbol and freeze. Offline `snapshotInputs`: an unqualified `SYMBOL:TF` key is legacy Binance spot input only; other instruments need `EXCHANGE:MARKET:CONTRACT:TF` |
| `src/engine.mjs` | `backtestVariant` | Optional `options.instrument` (default from the config symbol) for identity, guard and freeze |
| `src/research-queue.mjs` | `inputIssues` | Market type comes from the instrument instead of a `HYPE` special case (same result for the current config) |
| | `buildQueue` | Looks up each symbol with its instrument; new items record `instrument` and `btcInstrument` (null without a BTC gate) |
| | `validateQueue` | Items without both fields are legacy Binance spot; partial or mixed instruments are rejected |
| `src/queue-worker.mjs` | worker | Resolves the item and BTC-gate snapshots and the registry identity by the item instrument |
| `test/data-identity.test.mjs` | 14 tests | New (3 of them for provenance, below) |

### Provenance (PR #1, review round 1)

Each new manifest entry also records where its candles came from, as `provenance: { source, checksums? }`. Provenance is not part of the manifest key, and it does not change the snapshot bytes or their SHA-256.

| Source | Written by |
| --- | --- |
| `binance-public-rest-fixed-window`, `bybit-v5-linear-kline` | `fetchConfiguredCandles`, REST fetch (the names the fetchers already use in `meta.source`) |
| `snapshot-input` | `fetchConfiguredCandles`, offline input from `config.snapshotInputs` |
| `binance-vision-archive` | Future archive loader (Binance Vision download phase). Must list `checksums: [{ file, sha256 }]`, the published SHA-256 checksums each file was verified against |
| `caller-supplied` | `freezeSeries` or `backtestVariant` called directly with candles and no stated source (the default) |

- An archive source with no checksums, or with any checksum that is not a 64-hex SHA-256, is rejected before anything is written.
- Any other source name is also rejected before any write (fail closed).
- `backtestVariant` passes `options.provenance` through to `freezeSeries`.
- Entries written before this change have no `provenance` and are never rewritten. `provenanceOf` reads them as `{ source: 'legacy-unknown' }`, and `cachedSeries` puts that value in its meta.
- Same key and same bytes from a different source: no new entry is added and the first entry's provenance stays.

Not changed: snapshot bytes and hashes, the manifest and registry files, `research-queue.json`, costs, gates, windows, holdout logic, default market (Binance spot). The engine hash recorded in new registry rows (`engineSha256`) changes because `engine.mjs` changed.

## Tests

`node --test` in `experiments/strategy-destruction-filter`:

| | tests | pass | fail |
| --- | --- | --- | --- |
| Baseline at `7238f6c` | 58 | 58 | 0 |
| After F1a-1 | 69 | 69 | 0 |
| After review round 1 (provenance) | 72 | 72 | 0 |

New tests (`test/data-identity.test.mjs`):

1. Binance spot, Bybit linear and Binance USD-M perpetual are three distinct instruments; the configured default stays Binance spot.
2. A spot snapshot cannot answer a futures request and the reverse (`freezeSeries`, `cachedSeries`); spot and futures bytes for the same symbol and window coexist.
3. The fixed loader never answers a futures symbol with spot bytes, or the reverse (`fetchConfiguredCandles`, offline).
4. Legacy manifest entries resolve only for Binance spot `<SYMBOL>USDT` (not USD-M, Bybit or `BTCUSDC`) and are never rewritten or reordered.
5. The committed H2 manifest (2 entries) and registry (400 rows) map to Binance spot without changing a byte.
6. The same variant gets different registry identities for spot and futures.
7. Legacy registry rows read as Binance spot; the unchanged holdout guard matches only the spot identity.
8. `backtestVariant` registers and freezes under the requested instrument.
9. `buildQueue` looks up each symbol by its instrument and records it on every item; a futures-only SOL snapshot yields no spot SOL item.
10. `validateQueue` rejects incomplete instruments and keeps the committed legacy queue valid.
11. The queue worker resolves only the item instrument; a legacy item is not answered by futures bytes, a futures item not by spot bytes (same bytes, different key).
12. New entries carry their source:
    - REST, archive with checksums, default `caller-supplied`, offline loader input (`snapshot-input`), and `backtestVariant` passing it on.
    - The snapshot SHA-256 is the same for every source.
    - The same key and bytes from another source add nothing and rewrite nothing.
13. An archive source without valid checksums, or an unknown source, is rejected before any write.
14. Legacy entries read as `legacy-unknown`:
    - The committed manifest keeps SHA-256 `41dc5372…a308`.
    - A new entry appended to a copy of it leaves the old bytes as an exact prefix.
    - Re-freezing a legacy entry rewrites nothing.

No behavior change, checked on real data (snapshots rebuilt from Binance Vision, see below, in a temp dir outside the repo):

- 12 committed H3a items (6 first, 3 with BTC gate, 3 passes) rerun through the real queue worker at `7238f6c` and after F1a-1: identical results, also identical to the results and trial count stored in `research-queue.json` from the VPS run. Registry identities differ only by the added instrument fields; metrics equal; the manifest stayed at `41dc5372…a308`.
- `buildQueue` after F1a-1 equals `buildQueue` at `7238f6c` except the two new fields (398 items), and that equals the committed queue minus run fields.

## Part A: environment

PC (WSL2), 2026-10-19:

| | |
| --- | --- |
| Node | v24.10.0 (VPS: v24.22.0); major ≥ 22, no install needed |
| npm | 11.6.1 |
| CPUs (`nproc`) | 8 |
| RAM | 3.74 GiB total, 2.31 GiB available; swap 1.0 GiB, 0 used |
| Disk under `~` | 130 GB free of 251 GB (46 % used) |

## Part A: reproducibility of the H2 series

Re-frozen through `fetchConfiguredCandles` with `config.h2Paths` in a temp dir outside the repo (Binance spot REST `/api/v3/klines`, research window):

| Series | Manifest SHA-256 | REST re-freeze SHA-256 | Count (manifest / REST) | Result |
| --- | --- | --- | --- | --- |
| BTC 4h | `054139a7…0559` | `a0541e44…9703` | 8760 / 8760 | different |
| SOL 4h | `d86acd4b…30fd` | `b43333b6…0f8f` | 8760 / 8760 | different |

Nothing was changed. Per series exactly 2 candles differ, only in volume; open, high, low, close and times are equal:

| Candle (UTC) | BTC volume manifest / REST | SOL volume manifest / REST |
| --- | --- | --- |
| 2021-12-24T00:00Z (first difference, index 402) | 7819.85505 / 7842.74828 | 265018.63 / 265440.25 |
| 2021-12-27T04:00Z | differs (max relative 0.35 %) | differs (max relative 0.16 %) |

Cause: the manifest bytes were never REST bytes. `run-h2-sol4h.mjs` froze them from the H1 cache, which the old loader built from Binance Vision monthly spot archives. Rebuilding from Binance Vision (`data/spot/monthly/klines/<SYMBOL>USDT/4h`, 2021-10 to 2025-10, 49 files per symbol, 49/49 `.CHECKSUM` files matched) with the same parser gives exactly `054139a7…0559` and `d86acd4b…30fd`; the 2021-10 CSV hashes also match `archiveSha256` in `results/h2-sol4h.json`. Binance's REST and archive volumes disagree on these two 4h candles.

Consequences: the frozen snapshots are reproducible from Binance Vision, not from REST. Pointed at the real manifest, `fetchConfiguredCandles` on a machine without the cache would fail closed (`Fixed series already frozen with different bytes`), not replace the data. The futures data in F1a should be frozen from Binance Vision files with checksums, as the spec plans.

## Open points for later F1a steps

- `binance-usdm` has an instrument but no fetcher; it throws `Unsupported market-data provider` until the futures data step adds one. The futures default also comes then (D1).
- 382 of the 398 H3a items declare `markets: ['spot']` only, so the F1b rerun of the H3a grid on futures needs candidates that accept `linear_perpetual`.
- The manifest keeps `schemaVersion: 1`; entries without instrument fields mean legacy Binance spot.
- Proposed terms for `docs/ubiquitous-language.md`: instrument, exchange, market type, contract, legacy record (not edited in this step).
