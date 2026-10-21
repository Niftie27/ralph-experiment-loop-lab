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

## Amendment 2026-10-21, review round 3

Binding from 2026-10-21, after the Codex review of 0392097 on PR #2: a local version used as evidence for (c) must be readable evidence. Asymmetric evidence rule, verbatim as Tomas sent it:

- For (c), a local version counts only after it passes the same check the build uses (readVerifiedSource: CHECKSUM present and parsed, zip sha256 equal to both the directory name and the CHECKSUM). Manifest entries and 200s in this run count as before.
- For (b) and the unit rule, any local version still counts, because there it can only block not_listed.
- A local version that fails the check is not an error of the listing rule: it only stops counting for (c). The build of its own unit fails as it does now.
- Check lazily: stop at the first later source that is verified evidence, so a normal run hashes at most one extra zip per instrument.

## Amendment 2026-10-21, review round 4 (holdout seal: integrity metadata)

The Codex finding on f9f5838 (verify's coverage report includes holdout entries) is declined by Tomas on 2026-10-21. The A6 seal protects outcomes, not data integrity. Integrity metadata of holdout units may be stored, checked and reported: file availability (present, gap, not_listed), CHECKSUM and snapshot verification, row counts, missing minutes, missing ranges, and the open times of the first and last candle. It is needed to know before pre-registration whether the holdout is complete. Sealed until the pre-registered evaluation: open, high, low and close prices, volumes and trade counts, and anything computed from candle values (returns, volatility, ranges, statistics, signals, metrics). Errors and logs for holdout units never contain prices (A6 unchanged). The approved manifest entry fields are unchanged.

## Amendment 2026-10-21, review round 5 (commit 10 stop: row quarantine and daily fill)

Binding from 2026-10-21. The commit 10 full build stopped. Tomas decided (29) row quarantine, (30) fill monthly gaps from daily files, (31) a unit depends only on the fill dailies of its own days, (32) unavailable fill days are not stored in the manifest. Merged from Claude's draft and the VPS second opinion (main 5ca4a8c: docs/f1/f1a2-amendment-r5-draft.md, sha256 8233cbe1f75278687f3f91470734a753de7ac02e6548416bbe60aee8771f510a; docs/f1/f1a2-amendment-r5-second-opinion.md, sha256 433d6c242d89b83c785e85495a8937aa834272559d961934b9befb4ec10fdce2). For the cases it names, this amendment overrides A3 (value rules fail the file), approval points 3 and 4, and round 4 ("approved manifest entry fields are unchanged").

Why (reported data, not re-derived here): XRPUSDT-1m-2023-11 row 2023-11-30T12:35:00Z breaks "taker_buy_volume must be within 0..volume"; the VPS agent found the same row in the daily file and in REST /fapi/v1/klines. The SOLUSDT and XRPUSDT monthly files 2022-02 and 2022-04 lack 2022-02-26T00:00Z..2022-03-01T00:00Z and 2022-04-01T00:00Z..2022-04-03T00:00Z (end-exclusive); the daily files of those days are complete and CHECKSUM-verified.

Terms. Base source: a source from planUnits (a monthly file, or a daily of 2026-10-01..16). Fill source: a daily derived by F1 for a unit built from a monthly file. Dependencies of a unit: its base source plus its fill sources.

### Q. Row quarantine
Q1. Only the seven value rules of parseKlines (vision-source.mjs:144-150) quarantine, with their existing text and order: "volume must be >= 0", "quote_volume must be >= 0", "taker_buy_volume must be within 0..volume", "taker_buy_quote_volume must be within 0..quote_volume", "low must be > 0", "low above min(open, close)", "high below max(open, close)". The recorded rule is the first broken one in that order. Everything else still fails the whole file as now: ZIP, CRC32, CHECKSUM, newline at end, header, empty line, 12 fields, millisecond timestamps, minute alignment, close_time = open_time + 59,999, file bounds, strictly increasing open_time, finite decimals, and the count rule (vision-source.mjs:143; same expression, stays fatal). These checks keep running before the value rules, so a quarantined row has passed all of them.
Q2. A quarantined row gives no candle; accepted columns stay dense (no zero slots). Its open_time still takes part in the alignment, bounds and strictly increasing checks, so a duplicate open_time right after it fails. Coverage (rowCount, missingMinutes, missingRanges, firstOpenTime, lastOpenTime) is computed after the merge (F4) and clipping: only minutes without an accepted candle in the final unit are missing. A unit without any accepted candle is empty as now (no snapshot, no entry); its quarantine records still appear in the run report.
Q3. New entry field quarantinedRows: one record {file, openTime, rule} per quarantined row of any dependency whose open time lies in the unit's [dataStart, dataEnd). file = the canonical source path (data/futures/um/...) and must be in the entry's sources; openTime = ISO with .000Z on a whole minute; rule = one of the seven texts; unique per (file, openTime); sorted by openTime, then file, plain code-unit order; [] when none. No values. checkEntry validates all of this.
Q4. More than 10 quarantined rows in one physical source file fail every unit that depends on that file (10 passes, 11 fails). Counted over the whole file before clipping, merge or deduplication; the monthly file of 2025-10 has one counter for both units; each daily has its own counter, also when it fills nothing. The cap is a chosen fail-closed limit, not a diagnosis; changing it needs a new decision.
Q5. Quarantine alone sets no exit code, like missing minutes inside a present file. Precedence unchanged: any failure (1) over incomplete (3). Exit 0 does not mean full minute coverage. Build, verify and compare report per symbol: quarantined source rows, unique quarantined minutes, the list {file, openTime, rule} without duplicates across the two split units, filled minutes, fill sources used, and unavailable fill days.

### F. Daily fill of monthly gaps
F1. Fill set: only for units built from a monthly file. A unit's fill sources are data/futures/um/daily/klines/<contract>/1m/<contract>-1m-<YYYY-MM-DD>.zip (with .CHECKSUM) for every UTC day inside the unit's [dataStart, dataEnd) that has at least one minute without an accepted candle in the verified monthly file (absent or quarantined), leading and trailing days included. It is derived from the verified monthly file and the unit bounds only: never from --from/--to, other months, other symbols, the manifest or a reference manifest. Split month 2025-10: each unit depends only on the dailies of its own days (decision 31); 2025-10-17T00:00Z is a day boundary, so every day belongs to exactly one unit; the monthly file stays shared as now. Units built from base dailies (2026-10) get no fill sources and filledRanges []: no recursion, no request for 2026-10-17 or later.
F2. download: after a monthly file is verified, newly downloaded or already stored (the cache-hit path, vision-1m.mjs:142-148, parses too), parse it with the same parseKlines, quarantine and cap, derive the fill sets of its units, and fetch each fill source with the same transport, CHECKSUM verification, version directories and the existing single 404 marker (f1-1m-store.mjs:80-86). A monthly file that fails parsing or the cap in download is 1, since no fill set can be derived. Exception to approval point 4, for fill sources only: the 404 marker (404 on both the zip and its CHECKSUM) means "fill unavailable" for that day; not a gap, no exit 3, reported. A 404 on only one of the pair, or any other failure after the retries, is 1. Base sources unchanged.
F3. Fill sources are never listing evidence. notListedSources keeps the planUnits base sources only (f1-1m-store.mjs:95-110); the base plan is never extended with fill sources. A fill daily never becomes a first file, never proves (b) or (c), never turns a gap into not_listed. Rounds 2 and 3 unchanged.
F4. build merges by open time after every dependency of the unit is fully validated (assembleUnit's concatenation, vision-source.mjs:209-233, is not a merge). Per minute (monthly / daily): valid / absent: monthly row; absent / valid: daily row (filled); valid / valid: equal in all 10 kept columns (KLINE_COLUMNS, vision-source.mjs:69; parsed float64 values, +0 equals -0, no epsilon), else the unit fails (sources disagree), the monthly row is kept when equal; valid / quarantined or quarantined / valid: the unit fails (no winner is chosen, even where the daily could repair the monthly row); quarantined / quarantined: missing, two records; quarantined / absent or absent / quarantined: missing, one record; absent / absent: missing. Every minute of every present fill daily is compared, not only the holes. This is equality of parsed values, not of CSV bytes: close_time is checked structurally, ignore is not compared.
F5. The dependency state of the whole unit is checked before building. Any dependency with more than one local version, or a present version that fails readVerifiedSource, fails the unit (approval point 3, now covering fill sources), and this outranks missing. Then: a fill source without a local version but with the 404 marker is "fill unavailable"; without a local version and without the marker the unit is missing, as for an absent base source (build exit 3 with recorded404 false; compare missing_input, exit 1). On any failure, existing entries and snapshots stay untouched.
F6. sources = the base source plus every fill source that has a local version, whether or not it fills a minute, sorted by file as now; the same list in the snapshot header and the entry. Unavailable fill days are not stored in the manifest (decision 32): they are the fill set derived from the monthly file minus sources, and are reported in the run summary; a daily that appears later gives a different rebuilt entry, which compare reports as mismatched. New entry field filledRanges: sorted, maximal, non-empty, end-exclusive {start, end} ranges (ISO .000Z) of the minutes taken from fill dailies, inside the unit, within the present minutes and disjoint from missingRanges; [] when none; validated by checkEntry. quarantinedRows and filledRanges exist only in the manifest entry: snapshot header keys and format v1 are unchanged. ENTRY_KEYS gains exactly these two keys. A manifest with the old key set fails readManifest; there is no migration, and the commit 10 rerun starts from a clean store.
F7. firstSourceFile in coverage is the first base source of the first built unit, never a fill source (f1-1m-store.mjs:275 takes sources[0], and daily/ sorts before monthly/). firstFiles in download lists base sources only. Approval point 6 unchanged.
F8. verify, in addition to today's checks: every {file, sha256} in every entry's sources must exist as a local version and pass readVerifiedSource, so a deleted referenced zip fails; checkEntry validates the new fields. Re-deriving, merging and quarantine stay with compare, which rebuilds. compare derives fill sets from the verified local monthly bytes, never from the reference; the reference stays listing evidence and the expected value; any difference in sources, filledRanges or quarantinedRows is mismatched.
F9. Holdout (narrow extension of round 4): quarantine and fill apply to holdout units too. Added to the integrity metadata of round 4: open times of quarantined rows with the fixed rule text, fill source names and availability, filledRanges, and the pass or fail result of the source agreement check. Still sealed: raw or derived candle values (prices, volumes, trade counts, sizes or examples of a mismatch, values of quarantined rows) in manifest fields, errors, logs, reports, commit bodies and docs. Source zips and snapshots stay the permitted sealed storage. The research reader is unchanged. The approved manifest entry fields change only by the two fields above.
F10. Memory: download parses one monthly file at a time and releases it; build holds the monthly accepted columns and its quarantine index plus one fill daily at a time; the parsed cache (f1-1m-store.mjs:217-224) keeps only the current unit's dependencies (for the split month, the monthly file); guard.check runs around every new parse and merge step; the built-in 512 MiB ceiling is unchanged; the rerun reports runtime and maxRSS per step.

### Expected outcome of the rerun (to check, not to force)
- Exit codes: download 0, build 0, rebuild all unchanged with the same manifest sha256, verify 0.
- SOL and XRP: 2022-02-26..28 and 2022-04-01..02 filled (7,200 minutes per symbol); lastOpenTime of the 2022-02 unit becomes 2022-02-28T23:59:00.000Z and firstOpenTime of the 2022-04 unit 2022-04-01T00:00:00.000Z.
- XRP 2023-11: built; two quarantinedRows records (monthly and daily 2023-11-30, 2023-11-30T12:35:00.000Z, "taker_buy_volume must be within 0..volume") and one missing minute; the daily is in sources; other missing minutes in that month not verified.
- HYPE 2025-05: fill days 05-01..30; 05-01..29 unavailable; 05-30 present, agrees and fills nothing; first candle 2025-05-30T10:30:00.000Z and 42,390 missing minutes unchanged; the entry changes (daily 05-30 in sources); firstSourceFile stays the monthly HYPEUSDT-1m-2025-05.zip.
- Every other unit (no fill source, no quarantined row): the entry gains only quarantinedRows [] and filledRanges []; the snapshot sha256 equals the stopped commit 10 build.

### Tests (at least)
Each of the seven value rules quarantines with its exact text; first-rule order on a row with several value failures; the count rule and every structural error still fail; a structural error after a quarantinable row fails; a duplicate open_time right after a quarantined row fails; 10 quarantined rows pass and 11 fail; 6 + 5 across the 2025-10 boundary fail both units; an over-cap daily that fills nothing fails its unit; an all-quarantined unit is empty and its records are in the report; a gap is filled; a mismatch anywhere on a fetched day fails; valid / quarantined fails in both directions; quarantined in both gives two records and one missing minute; a fill with the 404 marker is unavailable, gives no exit 3 and is no listing evidence; a 404 on one of the pair gives 1; a fill without version and marker makes the unit missing; two versions of a fill source fail and outrank a missing one; download derives fills on the cache-hit path; the split month uses only the dailies of each unit's own days; 2026-10 gets no fill; fill sets and common entries are byte-identical for narrow and broad --from/--to, reversed enumeration and a warm rerun; firstSourceFile is a base source; verify fails on a deleted referenced zip and on tampered new fields; compare matches a filled unit and reports mismatched when the reference entry lists a fill daily that is unavailable locally; a manifest with the old key set is rejected; holdout records and every diagnostic path (mismatch, over-cap) contain no values. The 73 old tests stay byte-identical; changed F1a-2 tests are named in the commit body.
