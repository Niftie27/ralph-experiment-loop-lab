# F1a-2 grill-me: independent second opinion

2026-10-20. Audited `main` at `4396bd6b47ee498802cea879b4078ae34c0e4456` after fetching origin: clean tree, no divergence or pull needed. Supplied answer pack SHA-256: `b5b14ad0a6fbe32db37f0e3c9f9afe761171bb88ed48cc9b091b717136caeaa1` (verified before review; copied unchanged).

**Verdict: sound direction, but change the contracts below before implementation acceptance.** This reviews proposed answers, not a completed F1a-2 implementation. No F1a-2 columnar writer/reader/CLI was found in the tracked source inventory at this revision; an unmerged PC implementation or cross-host build is **not verified**. No backtest, sealed-price inspection, production runtime edit, scheduler change or dependency installation was performed. The only downloaded market data was the requested research-month sample. Existing runtime-to-repo equality was not re-audited; this documentation-only change does not alter executable files or claim global R2 certification.

## Authority and citation key

The pack's six decisions remain fixed: columnar format with buffer protection; live-runtime parity decision before F1d with D6 unchanged; Node statistics with PC-generated Python fixtures; later Vision/collector data-only comparison; spot only for a pre-registered comparison; F1b `inconclusive`. None is reopened here.

Code citations below use these repository-relative aliases, with line numbers at audited HEAD:

- H = `experiments/strategy-destruction-filter/src/h2-contract.mjs`
- M = `experiments/strategy-destruction-filter/src/market-data.mjs`
- E = `experiments/strategy-destruction-filter/src/engine.mjs`
- Q = `experiments/strategy-destruction-filter/src/research-queue.mjs`
- W = `experiments/strategy-destruction-filter/src/queue-worker.mjs`
- TH = `experiments/strategy-destruction-filter/test/h2.test.mjs`
- TI = `experiments/strategy-destruction-filter/test/data-identity.test.mjs`
- S = `docs/factory-spec-f1.md`; D = `docs/decisions.md`

Both architecture-review documents were read as proposals/evidence, not as a substitute for current code. The six decisions are authoritative from the supplied pack, not independently reconstructed from unseen sessions. Existing code conflicts to carry forward: `inconclusive` is not implemented (E:615–628,630–668; W:28 maps non-survivors to reject), and the engine still freezes object arrays (E:350–351; H:125,147). These are planned F1b/F1e changes, not reasons to reopen decisions. D6 still explicitly means live-code parity (D:32; S:169). The older VPS-first build placement in S:168 is superseded by PC development plus VPS rebuild/compare (D:36,38).

## A1–A12 verdicts

### A1 — change: specify milliseconds at the boundary and source clipping

Keep the proposed instrument/month partitions exactly. H:7–9 confirms their dates; H:17–28 accepts subwindows but rejects crossing a locked period. **`windowFor().start/end` are seconds, not milliseconds** (H:28), and `selectWindow` consumes candle seconds (H:30–32). Require explicit `startMs = start * 1000`, `endMs = end * 1000`, or separately parsed ISO milliseconds for this format. Never feed `open_time` milliseconds into the old selector unchanged. Preserve half-open intervals.

Distinguish the source archive window from the output unit: validate source rows against their source day/month, then clip into each unit. Otherwise A3's “inside the unit window” would reject valid October rows deliberately outside the split. The mixed October 2025 ZIP must yield disjoint research/holdout units without duplicate boundary rows. October 2026 must use daily files 01–16, never its full monthly ZIP. Freeze `--from/--to` as inclusive source-month selectors with explicit period clipping; no implicit extension to the current date. Add boundary tests for 2021-10-18, 2025-10-17 and 2026-10-17. Existing half-open tests use seconds (TH:23–29).

### A2 — change: make the byte ABI fully executable

Keep magic, uint32-LE H, padded canonical UTF-8 JSON and ten f64-LE columns. Define H to include padding, with the **minimum** 0–7 ASCII spaces needed for alignment. Pin the exact column order from A3, ISO formatting (`.000Z`), units, allowed header keys, nested canonical-key ordering, source-path encoding and final manifest newline. Use ordinal comparisons, not locale-dependent sorting. Reject duplicate keys, wrong column order/types/units, non-finite values, invalid rowCount and oversized headers/files before allocation. Encode explicitly little-endian, rather than assuming native typed-array byte order.

Current `canonical` sorts object keys for identity comparisons (H:71,82), but does not establish a binary-file ABI. This box reports Node `v24.22.0`; PC `v24.10` is user-supplied and not independently measured. Add byte-exact fixtures for header padding, decimals, exponent inputs if permitted, and negative zero (reject or normalize consistently). `Number()` alone cannot establish determinism of path names, metadata, sorting or serialization. No tool/runtime version goes into snapshot identity; record build versions separately in the run report.

### A3 — change: close numeric-validation holes and distinguish timestamp fields

Require nonempty numeric tokens before `Number()`, and `Number.isFinite` for every retained value. Require safe integer aligned `open_time`, safe nonnegative integer trade count, nonnegative base/quote volumes, and `0 <= taker_buy_volume <= volume`, `0 <= taker_buy_quote_volume <= quote_volume`. Preserve the stated OHLC checks. NaN or Infinity can otherwise slip through individual comparisons; the old OHLCV freezer explicitly checks finiteness (H:121–123), but it has no validation of these new quote/taker/count columns there.

Use an exact recognized CSV header/schema, not a heuristic that silently discards an unknown first row. The measured file has the A3 column order, a header, 12 columns, millisecond times and a 59,999 ms closing offset; see measurements below. Other file variants remain **not verified**. For any later microsecond variant, validate in native units: an inclusive close may be `open + 59,999,999` microseconds, which is not divisible by 1,000. Exact-divisibility conversion applies to retained open times; do not apply it blindly to a discarded inclusive close timestamp. Do not claim such a variant was observed here.

Compute missing ranges over the entire unit, including leading/trailing gaps; define range ends as exclusive. A missing archive/unit must appear in coverage, not disappear when reports derive coverage only from existing entries. Empty units need explicit gap status, not invented candles. Retain sparse rows. The later contiguous-input conflict is real (Q:23–26).

### A4 — change: pin the inputs and compare the complete expected set

Agree with SHA-256 of uncompressed snapshot bytes and cross-host proof. Define “same inputs” as the exact source-file/checksum set, full instrument, unit bounds and schema; retain old checksum-addressed source versions when upstream republishes. A new file cannot validate an old manifest merely because the filename matches.

Run two clean builds plus reversed source enumeration and identical rerun; compare snapshot bytes and canonical manifest bytes. The later cross-host compare must prove all requested expected entries were rebuilt, fail missing/extra/mismatched entries, and never rewrite its reference manifest. Compare manifest metadata too, not just listed snapshot hashes. A zero-entry comparison is failure. Current H2 hashes JSON bytes and the whole manifest separately (H:125–126,148); that is not a proof of this new format. Actual cross-host F1a-2 equality is **not verified** today.

### A5 — change: distinguish immutable entries from sorted serialization

The manifest path is trackable; `.gitignore:14,20` ignores the proposed raw/snapshot locations, not `results/manifest-f1-1m.json` (also checked with `git check-ignore`). Keep the H2 manifest byte-identical; measured SHA-256 is `41dc53724f78315658a5e07071db5b1aab4f8811ff7ff37e1849dfea4f11a308`.

Specify **append-only logical entries, canonical sorted serialization**, not byte-prefix append-only storage. Sorting an inserted entry can reorder existing entries. If byte-prefix preservation is required, it conflicts with run-order-independent sorting and needs a distinct append log; do not silently promise both. Current H2 appends its series array and refuses changed bytes for an existing instrument/window (H:139–144); TI:268–280 protects its old prefix/entries. New F1 entries may represent republished archives as S:136 requires, but must not change H2's convention in place.

Use the full sort key `(exchange, market, contract, period, dataStart, dataEnd, schemaVersion, sha256)`, immutable entry equality and idempotent duplicate detection. Add explicit `source: binance-vision-archive` or an equally unambiguous versioned manifest-kind field: file/checksum pairs alone omit the named provenance convention (H:100–112; TI:230–244). Source `file` means a canonical relative Vision path, never an absolute local path. Define snapshot lookup by its hash path and validate header/manifest agreement. Resolution of a broad window composes exactly one unambiguous unit per partition; it must not demand that a multi-month request fit exactly one month. Changed-source ambiguity remains fail-closed unless an explicit hash set is selected.

Hold the exclusive lock across read/validate/publish; create snapshots first, then atomically publish a complete manifest in the same filesystem. On an existing snapshot, verify the bytes and reuse it instead of treating every rerun's `wx` collision as failure (H:131–133 already follows that pattern). Specify flush/fsync policy, orphan recovery and lock ownership; never automatically delete someone else's lock. Rename is atomic visibility, not by itself crash durability.

### A6 — change: guard every research entry point before exposing data

Retain an unconditional F1a-2 research-reader refusal of holdout, independent of `--final`. Validate requested bounds against the immutable PERIODS constants, manifest against header, and **all** timestamps in a purported research unit, not only returned slice timestamps. Otherwise a file containing hidden holdout rows can pass a narrow research slice. Authenticate instrument/schema and row order before binary search. Return no raw buffer containing excluded rows.

Privileged ingestion/verification/comparison may process sealed source bytes only for structure, counts and hashes; errors, samples, logs and stack wrappers must not print their prices. This is a logical API boundary, not filesystem isolation: 0444 and a mixed-month ZIP cannot hide data from the same account. Do not make the ZIP parser a strategy input path. Freeze the later, already-approved Vision/collector data-quality comparison's dates/metrics/output separately; this review does not perform it.

Existing bypass surfaces matter: `cachedSeries` verifies a hash but does not call a holdout guard (H:150–160), and the fixed loader calls it before fetching (M:18–19). The old guard needs only `--final` plus a matching research identity (H:77–84), not survival or a consumed look. The engine invokes it (E:349); the queue forces research (Q:14–17; W:7). New format integrations must not fall back through the unguarded cache as an authorization substitute. Add poison-path tests across every public reader and rejected-window route; do not weaken existing tests or claim F1c is already implemented.

### A7 — change: bound the cache and pin ownership of verified bytes

Fresh arrays per call are the right isolation baseline. Measured here on Node v24.22.0: freezing a nonempty Float64Array throws TypeError; `new Float64Array(existingArray)` creates an independent buffer. Freeze the wrapper and deep-copy/freeze exposed metadata too. Tests must mutate both returned elements and a new view of `returned.buffer`, then confirm another read and another reader remain unchanged. Never return a subarray/view into the private verified cache.

Define “verify once” as once per immutable retained byte buffer keyed by expected hash, not once per pathname followed by unchecked disk re-reads. A changed/replaced file or an evicted cache entry must be reverified. Mode 0444 alone is not an immutability/security boundary. Keep an explicit bounded/LRU cache (initially one unit), because retaining every verified month defeats A8. Existing frozen per-bar objects are a different contract (H:147); ordinary cached JSON arrays are returned mutable (H:160). Cross-call isolation, not universal immutability of the consumer's own arrays, is what A7 promises.

### A8 — change: separate acceptance accounting from the outer hard limit

Keep 512 MiB as the whole-job acceptance ceiling; do not redefine it as 512 MiB per subprocess. On Linux, report `process.resourceUsage().maxRSS / 1024` as MiB and include startup/parse/decompression/serialization/read-copy overlap. maxRSS is process accounting, not aggregate cgroup accounting. Even if the proposed implementation uses one Node process, collect cgroup `memory.peak`, current usage, swap and OOM events for the entire job; explicitly state that cgroup memory includes charged cache and is not numerically identical to RSS. A final maxRSS report detects a violation after the fact, so bound allocations and stop on monitored over-budget usage as well.

Measured host headroom is 902 MiB, not the earlier 737 MiB. That does not establish admission safety or satisfy the earlier proposed 1.5 GiB floor. Do not lower an admission floor implicitly. There is no active old H3a scope enforcing the limit on this session: measurements below. Require an explicitly bounded job scope, live headroom check and no OOM restart. F1a-2's actual peak is **not verified** because its builder was not available/run.

### A9 — agree

The proposed src/test placement and ignored data directories fit the existing layout and ignore rules (`.gitignore:14,20`). Preserve full identity in mapping data: H:37–51 already distinguishes providers; H:54–59 distinguishes instruments and legacy spot. A mapping row is routing, not proof that a new market's schema or timestamp semantics are supported. Keep F1a-2 limited to the approved USD-M contracts; adding spot stays deferred. Avoid changing the existing loader merely to introduce the new archive path (M:14–57 is the current fixed-window object-series route).

### A10 — missing: exact bounded launcher and failure/coverage semantics

Keep four subcommands, sequential downloads, no REST fallback and JSON summaries. Add a frozen source inventory, strict symbol/month validation, finite retry/time/size bounds, checked HTTPS redirects restricted to the approved source host, partial-download publication and archive-member/CRC/uncompressed-size validation. Node built-ins-only means no unmentioned external unzip runtime dependency. ZIP parsing/decompression is still implementation work, not supplied by the manifest conventions.

Define a partial-coverage result explicitly: 404 is a reported gap, never an invisible success. `compare` fails if a required committed entry's input is absent; reports include expected/attempted/verified/gap counts, and compare is offline/read-only against its reference. Download, verify and compare must all be launched inside the bounded scope, not just the last command.

Future shell pattern, from the experiment directory, with the actual merged CLI path replacing the placeholder (no such CLI execution was done today):

```sh
systemd-run --user --scope -p MemoryMax=1G -p CPUQuota=50% -- \
  nice -n 19 ionice -c 3 node src/<merged-vision-cli>.mjs compare \
  --symbols BTC --from 2024-01 --to 2024-01
```

Use the CLI's documented symbol convention (BTC versus BTCUSDT must be fixed), then expand to approved units only after the gate. The process must read its actual cgroup path, assert `memory.max=1073741824` and `cpu.max` quota/period = 0.5 **before work**, and capture counters before scope exit. Apply an overall 90-minute timeout and preserve failure exit status; do not install a timer, modify services, raise limits or retry after OOM. Pin the repo revision and source-tree hashes before/after; execute the repository source directly (no runtime copy drift). Keep host paths out of public summaries. The old launch precedent is `experiments/strategy-destruction-filter/results/h3a-action-log.md:6–7`; saved properties record the two limits at `results/h3a-r6-properties.txt:3–4` under that experiment. A fresh transient probe successfully demonstrated those limits today; the historical scope is no longer active.

### A11 — change: extend the acceptance matrix, preserve the 73 existing tests

Static count is 73 `test(...)` declarations: engine 37, identity 15, queue 12, H2 9. This documentation task did not rerun the suite or witness red-before-green development, so passing/TDD claims are **not verified** here. Existing examples cover cross-period and hash conflicts (TH:28–39), authorization before candle access (TH:51–69), source checksum metadata rejection (TI:256–265) and H2 preservation (TI:268–292); they do not certify a new ZIP/parser/binary reader.

Add the edge cases from A1–A10: seconds/ms adapters; split-month clipping; finite/empty/negative quote/taker values; whole-file mislabeled-period rejection; corrupt header lengths/columns before allocation; locale-independent ordering and pinned-source rebuilds; idempotent rerun; both manifest/snapshot crash states; modified-on-disk and evicted-cache rereads; multi-unit ambiguity; missing archive coverage; bounded ZIP expansion; CLI compare with zero/missing/extra entries; and resource-limit preflight failure. Keep all old tests unchanged. No need to require an unobserved microsecond variant in current USD-M ingestion; reject it until an explicit tested contract exists.

### A12 — agree

The one research month is the correct first builder gate; the requested archive inspection below is **not** that builder benchmark. Full snapshot bytes, build wall time and maxRSS remain **not verified**. Do not infer full-range acceptance from ZIP size or one fresh-process peak: verify bounded memory across successive units, including the reader cache, and disk requirements before scaling. Keep all listed downstream work deferred. Current registry rows store whole-manifest provenance and four metrics (E:355–361), so future snapshot dependency hashes/return artifacts still need explicit F1a-3/F1b integration. The engine's object freezing remains F1e work (E:350–351). No trial, funding or live-runtime decision is changed here.

## Missing items (five, prioritized)

1. Exact unit/ABI/validation contract, including source clipping, seconds-to-ms adapters and inclusive-close handling.
2. Complete integrity/authorization boundary: every read path, full-unit bounds, verified-byte cache ownership and bounded eviction.
3. Reproducible source inventory, logical append-only semantics, idempotent/crash-safe publication and full expected-set comparison.
4. Concrete cgroup launcher, admission rule, aggregate accounting and full-run memory/disk gate.
5. Explicit unavailable-unit coverage and downstream multi-unit/incomplete-aggregate contract, without substituting incomplete data for strategy inputs.

## Top three changes

1. Make milliseconds, half-open splits and all-column finite/range validation explicit before writing snapshots.
2. Seal all reader paths and pin bounded, private verified buffers; a label or one-time pathname hash is insufficient.
3. Make rebuilds idempotent and complete-set deterministic, with a verified 1 GiB / 50% CPU launcher and 512 MiB acceptance accounting.

## Measured facts: real archive and resource envelope

Input contract for this probe: only the USD-M BTCUSDT January 2024 1m archive's transport integrity and physical CSV layout. Required: published ZIP SHA-256, 12 source fields with named order, timestamp units and close/open offset. These were present. No strategy input completeness is claimed: funding, orderflow/ATAS, exact CVD, profile levels, manual deviations, execution latency/costs and regime labels were not supplied by this probe. Higher-timeframe/profile/proxy features remain derivation work under their own contracts; none was fabricated or tested as a strategy.

Fetched in an owned `/tmp` directory from [Binance Vision ZIP](https://data.binance.vision/data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01.zip) and its [published CHECKSUM](https://data.binance.vision/data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01.zip.CHECKSUM), 2026-10-20 around 15:53 UTC. SHA-256 matched both digest and expected filename:

`21eeac04a76a7a35b10467e5e752fb2f8cff77cdeb57df6b50a23ce8d69bb190`

- ZIP: 1,898,532 bytes; sole CSV member: 5,073,074 uncompressed bytes.
- Header row: **yes**. Data column count: **12**, checked across **44,640** rows.
- Timestamp unit: **milliseconds UTC epoch**; first open `1704067200000` = 2024-01-01T00:00:00Z, last `1706745540000` = 2024-01-31T23:59:00Z.
- `close_time - open_time`: **59,999**, checked across all data rows.
- Ten-f64 numeric payload arithmetic: 3,571,200 bytes, **not a measured snapshot file size** (header excluded).

Header and one sample research row, verbatim:

```csv
open_time,open,high,low,close,volume,close_time,quote_volume,count,taker_buy_volume,taker_buy_quote_volume,ignore
1704067200000,42314.00,42335.80,42289.60,42331.90,289.641,1704067259999,12256155.25625,3310,175.211,7414459.86355,0
```

The download/streamed CSV probe used Python standard library for inspection only, inside a transient user scope with measured `memory.max=1073741824`, `cpu.max=50000 100000`. This does not add Python to the proposed Node production pipeline. Before cleanup, checked that the owned temp directory contained exactly the downloaded ZIP and CHECKSUM, both regular non-symlink files; deleted only those files and the now-empty directory, then verified absence. No extracted CSV or probe script was left behind.

Read-only `free -m` snapshot around 15:52 UTC: RAM total 3814, used 2912, free 254, shared 3, buff/cache 916, **available 902 MiB**; swap total 2047, used 1596, free 451 MiB. These are instantaneous observations, not reservations. Node is `v24.22.0`.

The current session's gateway cgroup and inspected ancestors had unlimited `memory.max` and `cpu.max` (`max 100000`), not the factory limits. Gateway cgroup `memory.current=1873657856`, `memory.peak=2656989184`; these are existing service values, **not this job's peak**. The historical H3a scope lookup returned inactive/not-found with empty ControlGroup; an initially guessed batch-service name also did not exist. Thus historical saved limits are not proof of current containment. The successful fresh probe proves the user-scope mechanism works; it does not reserve 1 GiB, clear host memory pressure, establish a safe full-build admission floor, or prove the later Node builder fits 512 MiB.
