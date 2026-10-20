# F1a-2 grill-me answers (draft for second opinion), 2026-10-20

Written by Claude (chat). Basis: docs/f1/architecture-review-2026-10-20.md (sha256 4d07e4e6...) and docs/f1/architecture-review-2026-10-20-second-opinion.md (sha256 17ae484d...), both at main 4396bd6; code claims of the second opinion checked by Claude (17 of 17 supported). Tomas's decisions 2026-10-20: (1) 1m format = columnar with a format spec and buffer protection; (2) live runtime decided before F1d by a parity test, D6 unchanged until then; (3) F1b statistics in Node with Python reference fixtures generated on the PC; (4) Vision-vs-collector data-only comparison after F1a-2; (5) spot history only with a pre-registered comparison; (6) `inconclusive` status in the F1b protocol. "Node built-ins only" stays.

## A1. Snapshot unit
One instrument x one calendar month, split at the period boundary (PERIODS: research 2021-10-18T00:00Z..2025-10-17T00:00Z, holdout ..2026-10-17T00:00Z, end exclusive). Per symbol: 2021-10 from 10-18 (research); monthly 2021-11..2025-09 (research); 2025-10 split into 10-01..10-17 (research) and 10-17..11-01 (holdout), both listing the same source zip; monthly 2025-11..2026-09 (holdout); 2026-10-01..10-17 (holdout) built from daily files 01..16. A missing file (404) is a coverage gap: no unit, reported, never filled from REST. Reason: matches Vision files, bounds memory to one month, and `windowFor` rejects windows that cross a period.

## A2. File format v1
- Bytes 0-7: ASCII magic `RALPHCOL`. Bytes 8-11: uint32 LE header length H. Then H bytes of header: canonical JSON (keys sorted recursively, no whitespace, UTF-8), right-padded with ASCII spaces so that 12 + H is a multiple of 8. Then the columns in header order, each rowCount float64 little-endian values, no gaps. File length must equal 12 + H + 8 x columns x rowCount exactly.
- Header fields: schemaVersion 1, kind `binance_vision_kline_1m`, instrument {exchange, market, contract}, period, dataStart, dataEnd, columns [{name, dtype "f64le", unit}], rowCount, firstOpenTime, lastOpenTime, sources [{file, sha256}] sorted by file name (sha256 from each file's own .CHECKSUM, so a republished source always gives a new snapshot identity).
- Nothing time-of-run, host, path or tool-version dependent in the file.
- Any change to header fields, columns, dtypes or units = new schemaVersion; the reader rejects unknown versions.

## A3. Columns, units, row rules
- 10 columns: open_time (ms UTC epoch), open, high, low, close (USDT per base), volume (base), quote_volume (USDT), count (trades), taker_buy_volume (base), taker_buy_quote_volume (USDT). close_time is checked (open_time + 59,999 ms) and dropped; ignore is dropped.
- Decimals parsed with Number(). Header-row presence, column order and timestamp unit are detected from the real files, with a test for every variant seen. If a file uses microseconds, divide by 1000 exactly and fail if not divisible.
- Row rules (fail the unit, report, no snapshot): open_time % 60,000 = 0; strictly increasing (duplicates or disorder fail); inside the unit window; low > 0, low <= min(open, close), high >= max(open, close); volume >= 0; count a non-negative integer; taker_buy_volume <= volume.
- Rows stay sparse. Missing minutes are counted and listed as ranges, never filled. Note for F1a-3: research-queue.mjs:23-26 demands contiguous 1h/4h candles, so F1a-3 must define incomplete aggregates.

## A4. Hash and determinism
SHA-256 over the uncompressed snapshot bytes; no gzip in F1a-2. A second build from the same zips gives byte-identical snapshots and manifest (test). The cross-host proof is the later VPS `compare` run (decision 2026-10-19 #5), not the Number() rounding argument alone.

## A5. Manifest
- results/manifest-f1-1m.json (tracked), schemaVersion 1. results/manifest-h2.json stays byte-identical (sha256 41dc5372...).
- One self-contained entry per snapshot: instrument, period, dataStart, dataEnd, schemaVersion, sha256, bytes, rowCount, firstOpenTime, lastOpenTime, missingMinutes, missingRanges, sources [{file, sha256}].
- Append-only: no entry is ever edited or removed; a changed source checksum gives a new snapshot and a new entry. Entries are kept sorted by (contract, dataStart, sha256) so the bytes do not depend on run order. No timestamps in the manifest.
- Resolution: an (instrument, window) request must match exactly one entry, otherwise fail as ambiguous (no "latest wins" rule until one is decided).
- Single writer: a lock file created with flag `wx` (refuse if present); the manifest is written to a temp file and renamed (atomic). Snapshots are written with flag `wx`, mode 0o444.
- Coverage per symbol (first/last candle, bars vs expected minutes, missing ranges) is derived from the entries and printed by verify/build; no separate tracked file.

## A6. Holdout seal
- The build step (privileged) writes holdout units. The reader refuses period `holdout` always until F1c (test).
- The reader checks that the requested window lies inside its period and that every returned open_time lies inside the requested window (test: an entry mislabeled `research` that contains holdout times is refused).
- No command prints holdout prices; reports show counts, times and hashes only. Zips are read only by build/verify/compare, never by strategy code. The CLI rejects dates after 2026-10-17.

## A7. Reader contract and buffer protection
Verifies magic, header, schemaVersion, exact file length and sha256 once per process per file. Returns a frozen plain object holding fresh Float64Array copies on every call, because typed arrays cannot be frozen (Object.freeze throws on non-empty views; checked on Node 22). Test: mutate a returned array, read again, values unchanged. Time-range slicing by binary search on open_time. A shared-buffer optimization is deferred to F1e and needs a post-run re-hash rule.

## A8. Memory budget
512 MiB peak for the whole job (all processes; F1a-2 uses one process and no workers), measured with process.resourceUsage().maxRSS and reported per run. One unit in memory at a time. Reason: 1 GiB cgroup on the VPS, and the VPS showed 737 MiB available on 2026-10-20. If a measured peak exceeds the budget: stop and report.

## A9. Locations
Inside experiments/strategy-destruction-filter, so `node --test` covers it: new modules in src/ plus one CLI script, tests in test/. Zips and .CHECKSUM files under data/vision/ mirroring the Vision path; snapshots under data/market-cache/f1-1m/<sha256>.bin. Both gitignored by the existing rules `experiments/**/data/` and `**/market-cache/`. Instrument to Vision path mapping is data (`linear_perpetual` on binance -> futures/um), not code branches.

## A10. CLI
One script with subcommands download | verify | build | compare; flags --symbols, --from YYYY-MM, --to YYYY-MM (default the F1a range).
- download: sequential, retry with backoff, data.binance.vision only, skips a file already present whose CHECKSUM verifies; 404 = gap in the summary.
- verify: no network; recomputes every zip's sha256 against its CHECKSUM.
- build: only from verified zips; writes snapshots and manifest entries.
- compare: rebuilds into a temp directory and compares every sha256 with the committed manifest (the later VPS run).
Exit 0 ok, 1 any mismatch or failure, 2 usage error. JSON summary on stdout; no hosts, usernames or home paths.

## A11. Tests first (each seen failing before the code)
Tampered zip, missing CHECKSUM and mismatching CHECKSUM fail before any write; header-row and timestamp-unit variants seen in real files; close_time check; duplicate, unsorted and misaligned rows fail; OHLC and taker rules; sparse gap reported, not filled; byte layout (magic, header length, padding to 8, exact length); unknown schemaVersion and truncated file rejected; two builds byte-identical and run-order independent; manifest-h2.json sha256 unchanged; holdout refusal, window bound check, mislabeled entry; buffer isolation; lock refuses a second writer; atomic manifest write; dates after 2026-10-17 rejected; ambiguous resolution fails. The 73 existing tests stay green and unchanged.

## A12. Measurement gate and out of scope
First build BTC 2024-01 only and report zip bytes, CSV bytes, snapshot bytes, peak maxRSS and wall time; continue to the full range only under the budget. Out of scope, listed as open in the Final report: registry rows referencing snapshot hashes (F1a-3/F1b), engine accepting typed arrays (F1e), incomplete-aggregate policy (F1a-3), funding (F1a-4), trial key incl. instrument (I60), Vision-vs-collector comparison (after F1a-2), shared verified Vision transport for alert-edge trades/bookDepth (ledger).
