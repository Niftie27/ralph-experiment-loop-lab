# F1a-2 contract

Binding contract for F1a-2 (Binance Vision USD-M 1m klines with checksum verification), so Codex, the VPS agent and Claude Code review against the same text. It consists of:

1. The answers A1-A12 in `docs/f1/f1a2-grill-me-answers-2026-10-20.md` (main `497ed90`).
2. The amendments to A1-A12 below, verbatim as Tomas sent them on 2026-10-20.
3. The plan approval below, verbatim as Tomas sent it on 2026-10-20. Where it changes the plan or the original F1a-2 prompt, it wins.

Critique points in `docs/f1/f1a2-grill-me-second-opinion.md` that are not in the amendments are outside F1a-2 and are listed as open in the Final report.

## Amendments to A1-A12 (verbatim)

A1 units
- windowFor() start/end and selectWindow work in SECONDS (h2-contract.mjs:28-32); 1m open_time is MILLISECONDS. Use explicit ms bounds parsed from the ISO strings; never pass 1m rows to selectWindow.
- Validate rows against their source file's month or day first, then clip into units, half-open [dataStart, dataEnd). The 2025-10 zip yields two disjoint units with no duplicate boundary row; 2026-10 uses daily files 01-16 only, never a monthly zip.
- --from/--to are inclusive source-month selectors, clipped to the F1a range. Boundary tests at 2021-10-18, 2025-10-17 and 2026-10-17.
A2 format
- H includes the padding; padding is the minimum 0-7 spaces. Column order exactly as listed in A3. ISO strings with .000Z. A fixed set of allowed header keys; key sort by plain code-unit order, never localeCompare.
- Reject before allocating columns: bad magic, unknown or duplicate keys, wrong column order, dtype or unit, invalid rowCount, header over 64 KiB, file length mismatch.
- Write explicitly little-endian (Buffer writeDoubleLE or DataView); never rely on the native byte order of typed arrays. Reject non-finite values; normalize -0 to 0, with a test.
- Tool and runtime versions go into the run report only, never into the file or the manifest.
A3 rows
- Accept only the exact header open_time,open,high,low,close,volume,close_time,quote_volume,count,taker_buy_volume,taker_buy_quote_volume,ignore or a numeric first row; anything else fails. Check every file; early months may differ (not verified). Test each variant you actually see.
- Measured by the VPS agent on BTCUSDT-1m-2024-01 (2026-10-20): checksum 21eeac04a76a7a35b10467e5e752fb2f8cff77cdeb57df6b50a23ce8d69bb190, zip 1,898,532 B, one CSV member 5,073,074 B, header row present, 12 columns, ms timestamps, close_time - open_time = 59,999, 44,640 rows.
- Milliseconds only in F1a-2. Any other timestamp unit fails closed with a clear error; no microsecond conversion.
- Every kept token non-empty and Number.isFinite; open_time a safe integer aligned to 60,000; count a safe non-negative integer; volume and quote_volume >= 0; 0 <= taker_buy_volume <= volume; 0 <= taker_buy_quote_volume <= quote_volume; OHLC checks as in A3.
- Missing ranges cover the whole unit including leading and trailing gaps, end exclusive. Coverage is computed over the expected unit list, so a missing file or empty unit shows as a gap instead of disappearing. Empty unit = gap status, no snapshot.
A4 determinism
- Same inputs = the exact set of source files and checksums, instrument, unit bounds and schemaVersion. Tests: two clean builds, reversed source enumeration and a rerun give identical snapshot and manifest bytes.
- compare is offline, never rewrites the committed manifest, fails on missing, extra or mismatching entries (all metadata, not only sha256), and treats zero compared entries as failure.
A5 manifest
- Append-only means logical: no entry is ever edited or removed; the file is serialized canonically sorted, not byte-prefix appended. Sort key (exchange, market, contract, period, dataStart, dataEnd, schemaVersion, sha256).
- Each entry has source 'binance-vision-archive' (existing name, h2-contract.mjs:105) and its checksums; a source file is the canonical relative Vision path, never a local path.
- Rerun: an existing snapshot file is verified by hash and reused (as h2-contract.mjs:131-133), not an error; an identical entry is a no-op.
- Hold the lock across read, validate and publish; never delete a lock automatically (a stale lock stops with a message). Order: snapshots written and fsynced, manifest temp file written and fsynced, rename, directory fsync. An orphan snapshot without an entry is harmless; verify lists orphans.
- A multi-month request composes exactly one entry per unit; more than one candidate for a unit fails as ambiguous.
A6 holdout seal
- At load, check ALL timestamps of a unit against its period, plus manifest-header agreement, instrument and schema, before any slicing.
- The new reader never falls back to cachedSeries (it has no holdout guard, h2-contract.mjs:150-160). Poison tests on every public reader entry point. Errors and logs for holdout units never contain prices.
A7 buffers
- Verified-bytes cache keyed by the expected sha256, bounded (one unit by default, LRU); an evicted or changed file is verified again.
- Return copies (new Float64Array(source)), never a subarray or view into the cache. Tests mutate the returned array and a new view on returned.buffer, then read again.
A8 memory
- 512 MiB whole-job ceiling: report maxRSS in MiB and also check RSS periodically during the run, aborting above the ceiling. Check that memory stays flat across successive units, not just in one.
- Context: the VPS had 902 MiB available and 1.6 GiB swap in use on 2026-10-20.
A10 CLI
- ZIP with Node built-ins only (zlib.inflateRaw, zlib.crc32): exactly one expected member, CRC32 and uncompressed size checked, uncompressed size capped (64 MiB per file). No external unzip.
- HTTPS to data.binance.vision only, redirects only to that host, per-request timeout, finite retries; download to a temp name, rename only after the CHECKSUM matches.
- One documented symbol convention (BTC or BTCUSDT), strict validation of symbols and months.
- Summary counts expected, downloaded, verified and gaps. Exit 1 on any mismatch; compare also fails when a required input is missing.
- The later VPS run will be launched as systemd-run --user --scope -p MemoryMax=1G -p CPUQuota=50% -- nice -n 19 ionice -c 3 node <cli> compare ... That run is out of scope now; the CLI only has to work unattended without a TTY.
A11 tests: add tests for every amendment above. The 73 existing tests (engine 37, data identity 15, research queue 12, h2 9) stay unchanged.

## Plan approval (verbatim)

F1a-2 plan approval. This is the binding approval; if an earlier approval message reached you, this one replaces it. Merged from two independent reviews of your plan.

Approved: modules, paths, header unit strings, manifest entry fields, tests, commit order, D1, D2, D4 (with change 2), D6 (with change 6), D7. Changes:

1. Contract doc first: before the glossary commit, add docs/f1/f1a-2-contract.md containing, verbatim, the "Amendments" list to A1-A12 you received with the grill-me answers and this approval, so Codex and the VPS agent review against the same contract. Docs-only commit.
2. D4: a pattern with a slash in the middle is anchored to the directory of its .gitignore, so "results/*.lock" in the root .gitignore does NOT ignore experiments/strategy-destruction-filter/results/manifest-f1-1m.json.lock (checked with git check-ignore). Use the full path or "**/results/*.lock" and put the git check-ignore -v output in that commit body.
3. D3 rejected. If any source of a unit has more than one local version, build fails closed for that unit with a message listing the versions; existing snapshots and entries stay untouched; no combination building. This replaces the prompt line "A changed checksum for an already recorded file creates a new snapshot": automatic new snapshots wait for a version-selection rule (open point); never overwriting still holds. Replace the "changed checksum gives a new snapshot" test with this fail-closed test. Reason: combination units would be refused by the reader as ambiguous anyway.
4. Exit codes: 0 ok and complete; 1 any mismatch or failure; 2 usage error; 3 finished but incomplete, meaning at least one expected source file is missing (404 on both the zip and its .CHECKSUM, after listing per D6). Missing minutes inside a present file are reported in coverage but do not set 3. Any other download failure after the finite retries (5xx, timeout, DNS error, truncated body), or a 404 on only one of the pair, is 1, never a gap. compare with a missing required input is 1. Add a test for each code.
5. Glossary Signal row: signalForVariant (engine.mjs:138) returns an array of {direction, reason} objects, possibly empty, not a single object. The other rows are fine (the fast scalp wording matches docs/factory-spec-f1.md line 115).
6. D6: probing stays Vision-only. Report HYPE's first Vision file and first 1m candle (UTC) in the Final report and the doc; the listing date is cross-checked against a second source outside your code. Months before the first file stay not_listed.
7. TDD evidence: every code commit body states the new tests' red count before the implementation and green count after, plus the full-suite total.
8. Push earlier: push after commit 9 (measurement gate; results only in the commit body; do not commit results/manifest-f1-1m.json or any snapshot then) and tell Tomas to open the PR. The full download, build, manifest and docs/f1/f1a-2-vision-1m.md come only after the Codex review is clean, built from a clean store (remove your own earlier outputs first).
9. Final report additionally: total disk usage of the zips and of the snapshots on the PC.

## Amendment 2026-10-21, review round 2 (listing rule)

Binding from 2026-10-21. It replaces the selection-relative not_listed rule (a 404 before the first file found in the same invocation) after the Codex review of 9a996e9 on PR #2, and makes "months before the first file stay not_listed" (plan approval point 6) and the exit code 3 (point 4) depend on recorded evidence. Rule and evidence sources, verbatim as Tomas sent them:

- A missing source (404 recorded on both the zip and its CHECKSUM) is not_listed only if (a), (b) and (c) are ALL supported by recorded evidence; otherwise it is a gap:
  (a) it and every earlier source of the same instrument from the F1a range start (2021-10-18) have recorded 404 markers;
  (b) no earlier source exists: no local version, no manifest entry using it, no 200 in this run;
  (c) at least one later source exists: a local version, a manifest entry, or a 200 in this run.
- Evidence outside --from/--to counts. Missing or unreadable evidence never counts toward not_listed.
- A gap may become not_listed only when (a)-(c) are fully supported.
- A unit is not_listed only if every one of its sources is not_listed. A unit with any present source is never not_listed: its missing sources are gaps, the unit status is missing, and the run exits 3.
- Implement the rule once and use it in download, build and compare.
  - compare uses the reference manifest as manifest evidence, because its rebuild manifest is temporary. Keep the round-1 rules: missing_input without 404 evidence -> exit 1; a reference entry without a rebuilt twin -> exit 1.
  - download reads the manifest read-only, without the lock. An absent file means no entries. A present but unreadable or invalid file means exit 1 with a clear message.

Clarifications 1-3 of Tomas's answer "A" (verbatim):

1. Rule wording
   - not_listed requires (a), (b) and (c) all supported by recorded evidence.
   - Missing or unreadable evidence never counts toward not_listed.
   - A result that is a gap today may become not_listed only when (a)-(c) are fully supported, as in your example.
   - Add test 4b: after test 3, a single-month download of 2024-05 gives not_listed and exit 0.
   - Add a test: the same single-month download in a store WITHOUT the earlier 404 markers gives a gap and exit 3.

2. HYPE / contract point 6
   - Your reading is right: "months before the first file stay not_listed" applies only when "before the first file" is proven by (a)-(c). A selection-relative first file is exactly finding 2.
   - Add a test: HYPE --from 2025-01 without evidence for 2021-10..2024-12 gives 2025-01..04 as gaps and exit 3.

3. Evidence sources
   - compare uses the reference manifest, because its rebuild manifest is temporary.
   - download reads the manifest read-only, without the lock:
     - absent file = no entries;
     - present but unreadable or invalid = exit 1 with a clear message, never a silent "no evidence".
   - Add a test for the invalid-manifest case.

"Your example" in point 1: after a download of 2021-10..2024-06 in which every month up to 2024-05 answered 404 on both files and 2024-06 exists, a download of 2024-05 alone was a gap (exit 3) under the old rule and is not_listed (exit 0) under this one.
