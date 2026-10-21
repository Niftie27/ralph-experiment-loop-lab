# F1a-2 round 5 implementation plan (row quarantine and daily fill)

Plan for the binding "Amendment 2026-10-21, review round 5" in `docs/f1/f1a-2-contract.md`. No code in this commit. All anchors are at `219b170`; `src/` and `test/` mean `experiments/strategy-destruction-filter/src/` and `.../test/`. Where this plan and the amendment differ, the amendment wins; differences I found are in section 9.

Baseline before this plan: `node --test` 148/148. Backup of the stopped commit 10 manifest outside the repo: sha256 `e0606e81ca67532816ed29292ceedde6ec016ca181a4ff2e3d7a4ceeb22fae03`, 328 entries.

## 1. Changes per amendment point

New names used below (all in `src/vision-source.mjs` unless noted): `QUARANTINE_RULES` (the seven texts in fixed order), `QUARANTINE_CAP = 10`, `fillSources(unit, openTime)`, `mergeUnit(unit, base, fills, loadDaily)`, `unitQuarantine(unit, inputs)`, `minuteRanges(openTimes)`.

**Q1 (value rules quarantine, everything else fatal).** `parseKlines` (`src/vision-source.mjs:104-154`): split the rule chain at `:143-151`. The count rule (`:143`) keeps its expression and stays a throw. The seven value rules (`:144-150`) keep their text and order, are exported as `QUARANTINE_RULES`, and give a record `{ openTime, rule }` (first broken rule) instead of the throw at `:151`. Structural checks (`:106-114`, `:121-134`) and the finite check (`:136-140`) run first, unchanged, so a quarantined row has passed all of them. ZIP, CRC32 and CHECKSUM checks (`:12-63`) are untouched.

**Q2 (no candle, dense columns, coverage after merge).** `parseKlines`: accepted rows are written at a separate write index; `previous = openTime` (`:134`) still runs before the value rules, so a duplicate open_time after a quarantined row still fails at `:133`. If any row was quarantined, each column is cut to the accepted length with a copy (`slice`), so there are no zero slots. Return value becomes `{ variant, rowCount, columns, quarantined }` with `rowCount` = accepted rows. A file whose rows are all quarantined returns `rowCount: 0` (the "no rows" check at `:114` still counts lines). Coverage stays `unitCoverage` (`:238-248`), now called on the final merged `open_time` in `buildUnit` (`src/f1-1m-store.mjs:194`). An all-quarantined unit takes the existing empty path (`src/f1-1m-store.mjs:195`) and keeps its records in the run result.

**Q3 (quarantinedRows).** `ENTRY_KEYS` (`src/f1-1m-store.mjs:14-15`) gains `quarantinedRows`; `checkEntry` (`:130-143`) validates it (section 3). Records are built by `unitQuarantine` (base sources) and `mergeUnit` (monthly plus fill dailies): `file` = canonical source path, `openTime` = ISO `.000Z`, only open times inside `[dataStart, dataEnd)`, sorted by openTime, then file. Written into the entry at `src/f1-1m-store.mjs:198-200`.

**Q4 (cap 10 per physical file).** `parseKlines` counts quarantined rows over the whole file, before clipping or merging; the 11th throws `rowError(row, openTime, 'more than 10 quarantined rows in this file')` (`:155`, no values). Because the cap lives in the parser, the 2025-10 monthly file has one counter for both units (both units fail through the shared parse), and every daily, base or fill, has its own counter, also when it fills nothing (every present fill daily is parsed in `mergeUnit`).

**Q5 (no exit code; per-symbol report).** No change to the status rules in `summarize` (`src/f1-1m-store.mjs:280-290`), `compareStore` (`:374-375`) or `EXIT` (`src/vision-1m.mjs:181`). New per-symbol objects `quarantine` and `fill` (section 3) in `coverageOf` (`src/f1-1m-store.mjs:268-279`; used by build and, newly, by compare) and in `verify` (`src/vision-1m.mjs:169-179`, from the entries). The CLI keeps stripping `entries` and `units` from build output (`src/vision-1m.mjs:190`), so the report lives in `coverage`.

**F1 (fill set).** `fillSources(unit, openTime)` (new): only for a unit whose single base source is a monthly file; for every UTC day `d` in `[unit.startMs, unit.endMs)` with fewer than 1,440 accepted monthly open times in `[d, d + 1 day)` it returns the daily source built with the existing `source()` helper (`:179-184`), which gains a `kind` field (`'monthly' | 'daily'`). Unit bounds are all midnight-aligned (2021-10-18, month starts, 2025-10-17, 2026-10-17), so each day lies in one unit. Inputs are only the parsed monthly `open_time` column and the unit; never `--from/--to`, other months, symbols or manifests. Units of 2026-10 (base dailies, `:196-198`) return `[]`. `planUnits` (`:187-206`) is not changed.

**F2 (download fetches fills).** `download` (`src/vision-1m.mjs:114-167`): commit 3 first moves the per-source body (`:129-153`) into `fetchSource(source, ...)` without behavior change. Then, for each base source of kind `monthly` that is verified, newly stored (`:150-153`) or a cache hit (`:142-148`, whose bytes are already read at `:143`), download parses it (`readZipMember` + `parseKlines`, cap included), derives `fillSources` for each unit of that file in the requested months, releases the parse, and runs `fetchSource` for every fill day: CHECKSUM first, zip only after a CHECKSUM 404; 404 on both writes the existing marker (`recordMissing`, `src/f1-1m-store.mjs:82-85`) and counts as unavailable; a 404 on one of the pair or any other failure after the retries is a failure (exit 1). A monthly file that fails parsing or the cap is a failure (exit 1). Fills never enter `fetched` or `firstFiles` (`:125`, `:139`), so base behavior and the listing step (`:160-164`) are unchanged.

**F3 (no listing evidence).** `notListedSources` (`src/f1-1m-store.mjs:95-112`) is not changed: it walks only `planUnits` base sources (`:96-97`), so fill markers, fill versions and fill files in manifest entries never match. Tests prove it (section 6).

**F4 (merge by open time).** `mergeUnit(unit, base, fills, loadDaily)` (new, pure): `base = { file, parsed }` for the monthly file; `fills` = the present fill sources in day order; `loadDaily(source)` returns a parsed daily (the store's loader runs `guard.check`, `readVerifiedSource`, `readZipMember`, `parseKlines`). For each daily, every accepted or quarantined minute is compared against the monthly accepted index (sorted `open_time`, binary search) and the monthly quarantine map, in the cases of F4: valid/valid compares the 10 columns of `KLINE_COLUMNS` (`:69`) with `===` (so +0 equals -0, no epsilon) and keeps the monthly row; absent/valid collects the daily row as filled; valid/quarantined and quarantined/valid throw; quarantined/quarantined, quarantined/absent and absent/quarantined stay missing with one record per quarantined source row. After the last daily the monthly rows clipped to the unit and the filled rows (disjoint by construction) are merged into new dense columns. `assembleUnit` (`:209-234`) stays for the concatenation of the 2026-10 base dailies only.

**F5 (dependency state first).** `buildUnit` (`src/f1-1m-store.mjs:180-202`) is reordered. Today absent is checked before multiple (`:181-185`). New order: (1) base versions: any source with more than one version fails; (2) every present base is parsed through the cache (`readVerifiedSource` + parse); any error fails; (3) any absent base: `missing` with `recorded404` per file, as now; (4) monthly unit: `fillSources`; any fill with more than one version fails; every present fill passes `readVerifiedSource` or the unit fails; (5) only then a fill without version and without marker makes the unit `missing` with `{ file, recorded404: false }`; a fill without version but with the marker is unavailable. Failed outranks missing, also for the base dailies of 2026-10 (section 9). Existing entries and snapshots stay untouched on any failure (no change to `:225-241`).

**F6 (sources, unavailable days, filledRanges).** `buildUnit`: `sources` = the base source plus every present fill source, sorted by file as now (`:200`, and `encodeSnapshot` sorts the header list, `src/f1-1m-format.mjs:38,42`). Unavailable fill days go only into the run result (`unavailableFills`), never into the entry. `filledRanges = minuteRanges(filled open times)`: sorted, maximal, end-exclusive. `ENTRY_KEYS` gains `filledRanges`; `checkEntry` validates it. Snapshot header keys and format v1 (`src/f1-1m-format.mjs:12`, `:53-55`) are unchanged. A manifest with the old key set fails in `checkEntry` (`:132`) and thus in `readManifest` (`:151`); no migration code.

**F7 (first file is a base source).** `coverageOf` (`src/f1-1m-store.mjs:275`): `firstSourceFile` = `built[0].unit.sources[0].file` (the base plan) instead of `entry.sources[0]`. `download` keeps setting `firstFiles` only on the base path (`src/vision-1m.mjs:139`).

**F8 (verify, compare).** `verifyStore` (`src/f1-1m-store.mjs:294-335`): the walk (`:298-312`) records every zip that passed (the same check as `readVerifiedSource`: CHECKSUM present and parsed, sha256 equal to the CHECKSUM and to the directory name, `:309`); then for every entry (`:316-328`) every `{ file, sha256 }` in `sources` must be in that set, else a failure `source <file>@<sha256> of <contract> <period> <dataStart>: not a verified local version`. `checkEntry` covers the new fields through `readManifest` (`:315`). New count `counts.sources`. `compareStore` (`:345-380`) keeps rebuilding through `buildStore` with `listingEntries: reference` (`:350`), so fill sets come from local monthly bytes and the reference stays evidence and expected value; any difference in `sources`, `filledRanges` or `quarantinedRows` is already `mismatched` by the canonical comparison (`:364`). A fill without version and marker reaches `missing_input` through `u.files` (`:366`). compare output gains `coverage` (rebuilt coverage incl. the Q5 report).

**F9 (holdout).** No new code path prints values: records carry `file`, `openTime`, `rule`; merge errors carry the open time and the two file names (`sources disagree at <ISO>: <monthly> / <daily>`, `valid row in <file> against a quarantined row in <file> at <ISO>`); the cap error carries row number, open time and the rule text only. The reader (`src/f1-1m-reader.mjs`) is not changed. Tests run every diagnostic path on holdout units with recognizable values and assert none appears (section 6).

**F10 (memory).** Download: one monthly parse at a time, released before the fill requests. Build: `parsedCache` (`src/f1-1m-store.mjs:217-224`) keeps only the current unit's base parses (filter at `:224` uses `unit.sources`, the base plan; for the split month the monthly file); fill dailies are parsed one at a time inside `mergeUnit` and never cached. New `guard.check` calls: download before each monthly parse and before each fill source; build before each base parse, before each fill load, before the final assembly. The ceiling (`src/vision-1m.mjs:18`, 512 MiB) is unchanged.

## 2. Data flow per command

**download** (network, sequential, `src/vision-1m.mjs:114-167`). Read the 1m manifest read-only as listing evidence (`:118-119`, unchanged). Per symbol, per base source of `planUnits(symbol, {from, to})` (`:124`): `fetchSource`. For a verified monthly file: parse once (cap), derive `fillSources` per unit of that file, release the parse, `fetchSource` per fill day in day order (unavailable on a 404 pair; failure otherwise). Then the base listing step (`:160-164`) as now.
- Split month 2025-10: one fetch and one parse of `...-2025-10.zip`; fill days = research days 10-01..16 with a missing minute plus holdout days 10-17..31 with a missing minute; each day belongs to one unit (decision 31).
- 2026-10: 16 base dailies, kind `daily`; no parse, no fill.
- HYPE 2025-05: monthly verified and parsed; one unit; fill days 05-01..30 (05-31 only if it lacks a minute). Expected: 29 pairs of 404 (markers, unavailable) and 05-30 stored.
- Parsed cache: none in download.

**build** (offline, `src/f1-1m-store.mjs:207-258`). Lock and manifest as now. Per symbol: listing set from base sources only (`:216`, unchanged); per unit: `guard.check`, then `buildUnit` in the F5 order; monthly unit: `mergeUnit` with the present fills; 2026-10: `assembleUnit` plus `unitQuarantine` over the 16 dailies; coverage on the final `open_time`; empty or entry. The comparison with existing entries (`:225-241`) is unchanged: an equal entry is `unchanged`, a different one fails (so a fill daily that appears after a build fails that unit until a version-selection rule exists, as approval point 3 already does for base sources).
- Split month: the research unit merges only its own fill days, the holdout unit only its own; both reuse the cached monthly parse (one cap counter); monthly records are split by open time, so no record appears in both entries.
- 2026-10: no fill sources, `filledRanges: []`; quarantine records from the base dailies.
- HYPE 2025-05: 29 unavailable, 05-30 verified, parsed, compared minute by minute; `sources` = daily 05-30 + monthly; `firstSourceFile` from the base plan, so still the monthly file.
- Parsed cache: base parses of the current unit only; fill dailies never.

**verify** (offline). Walk and verify every stored zip (incl. fill dailies), recording the passed set; read the manifest (new `checkEntry`); per entry: every source must be in the passed set; snapshot hash, size and header as now; orphans. Coverage per contract from the entries, with the Q5 report (section 3; unavailable days derived from entry fields, section 9).

**compare** (offline). Read the reference; temp build with `listingEntries: reference`; classify as now; output adds `coverage` of the rebuild.

## 3. Schemas and report fields

`ENTRY_KEYS` (plain code-unit sorted, as `:132` compares the sorted key list):
`bytes, contract, dataEnd, dataStart, exchange, filledRanges, firstOpenTime, lastOpenTime, market, missingMinutes, missingRanges, period, quarantinedRows, rowCount, schemaVersion, sha256, source, sources`.

`quarantinedRows`: array of `{ file, openTime, rule }`. `checkEntry`: exactly these three keys; `file` is one of the entry's `sources[].file`; `openTime` matches `ISO`, round-trips through `Date`, is a multiple of 60,000 ms and lies in `[dataStart, dataEnd)`; `rule` is in `QUARANTINE_RULES`; the list is strictly increasing by (openTime, file) in plain code-unit order, which also makes (file, openTime) unique; `[]` when none.

`filledRanges`: array of `{ start, end }`. `checkEntry`: exactly these two keys; both ISO, round-trip, minute-aligned; `start < end`; `dataStart <= start` and `end <= dataEnd`; strictly sorted with `previous.end < next.start` (maximal and disjoint); no overlap with any `missingRanges` range; total filled minutes `<= rowCount`; `[]` when none.

Per-symbol report (build `coverage[]`, compare `coverage[]`, verify `coverage[]`), added beside the existing fields:
```
quarantine: { sourceRows: <int>, uniqueMinutes: <int>, rows: [{ file, openTime, rule }] }   // rows sorted by openTime, then file
fill:       { filledMinutes: <int>, sources: [<fill daily file>], unavailable: [<fill daily file>] }   // sorted by file
```
Build and compare take them from units with status built, unchanged or empty; verify from the entries.

Run result per unit (internal `units` of `buildStore`, and the input of `coverageOf`): adds `quarantinedRows`, `filledMinutes`, `fillSources`, `unavailableFills`; `files` of a missing unit may now list a fill file with `recorded404: false`.

download summary adds:
```
fills: { counts: { expected, downloaded, skipped, verified, unavailable, failed }, unavailable: [<fill daily file>] }
```
`counts` (base) keeps its seven keys; `failures` and `repaired` hold base and fill entries, each prefixed by its Vision path.

verify summary: `counts` gains `sources` (referenced `{file, sha256}` checked). compare summary gains `coverage`.

## 4. Exit codes after the change

| Command | 0 | 1 | 3 |
|---|---|---|---|
| download | every base file stored or not_listed; every fill stored or unavailable | any base or fill failure after retries, a 404 on one of a pair, a CHECKSUM or stored-copy mismatch, a monthly parse or cap failure, an unreadable manifest, the memory guard | a base gap and no failure |
| build | every unit built, unchanged, empty or not_listed | any failed unit (two versions or a corrupt version of any dependency, parse or cap, source disagreement, valid/quarantined, entry conflict), the lock, the memory guard | a missing unit (absent base, or a fill without version and marker) and no failure |
| verify | all zips, referenced sources, snapshots and the manifest verify | anything else, the memory guard | not used |
| compare | all in-scope units matched, not_listed or empty | mismatched, extra, missing_input (incl. a fill without version and marker), failed, aborted or zero compared | a gap and no failure |

Usage errors stay 2. Quarantined rows within the cap and unavailable fill days never set 1 or 3.

## 5. Memory

Download peak: one base response (compressed zip, a few MB for the real monthly files) plus its inflated CSV (capped at 64 MiB, about 5 MB real) plus the parsed monthly columns (44,640 rows x 10 x 8 B, about 3.4 MiB), released before the fill requests; a fill response is about 70 KB and is not parsed. `guard.check`: before each base source (`src/vision-1m.mjs:128`), before each monthly parse, before each fill source.

Build peak: the cached base parse of the current unit (monthly columns about 3.4 MiB, or 16 dailies of the same total), its zip and CSV while parsing, one fill daily (zip, CSV, columns well under 1 MiB), the collected filled rows (at most the unit's minutes x 80 B), the merged columns (about 3.4 MiB) and the encoded snapshot (about 3.4 MiB). `guard.check`: per unit (`src/f1-1m-store.mjs:219`), before each base parse, before each fill load, before the final assembly, before the write (`:235`). Verify and compare: as today; verify reads no zip twice.

Commit 10 measured with the old code: download maxRSS 124 MiB, build 184 and 191 MiB, verify 149 MiB. The new peaks are not verified; the rerun reports them per step.

## 6. Tests

New tests (file; amendment points; commit from section 7):

| # | Name | File | Points | Commit |
|---|---|---|---|---|
| 1 | F1a-2 r5 store: entries carry quarantinedRows and filledRanges; checkEntry rejects bad keys, foreign files, off-minute, out-of-unit, unsorted or duplicate records, unknown rules, and non-maximal, overlapping or missing-range ranges | test/f1-1m-store.test.mjs | Q3, F6 | 4 |
| 2 | F1a-2 r5 store: a manifest with the old key set is rejected by readManifest, build and verify | test/f1-1m-store.test.mjs | F6 | 4 |
| 3 | F1a-2 r5 quarantine: each of the seven value rules quarantines its row with the exact text; no candle, dense columns | test/vision-source.test.mjs | Q1, Q2 | 5 |
| 4 | F1a-2 r5 quarantine: a row breaking several value rules records the first in the fixed order | test/vision-source.test.mjs | Q1 | 5 |
| 5 | F1a-2 r5 quarantine: the count rule, every structural error and a structural error after a quarantinable row still fail the file | test/vision-source.test.mjs | Q1 | 5 |
| 6 | F1a-2 r5 quarantine: a duplicate open_time right after a quarantined row fails | test/vision-source.test.mjs | Q2 | 5 |
| 7 | F1a-2 r5 quarantine: 10 quarantined rows in one file pass, 11 fail | test/vision-source.test.mjs | Q4 | 5 |
| 8 | F1a-2 r5 store: a quarantined row is recorded in its unit's entry and build report; quarantine sets no exit code | test/f1-1m-store.test.mjs | Q3, Q5 | 5 |
| 9 | F1a-2 r5 store: an all-quarantined unit is empty, without snapshot or entry, and its records are in the report | test/f1-1m-store.test.mjs | Q2 | 5 |
| 10 | F1a-2 r5 store: 6 + 5 quarantined rows across the 2025-10 boundary fail both units | test/f1-1m-store.test.mjs | Q4 | 5 |
| 11 | F1a-2 r5 fill set: the days of a monthly unit with a minute lacking an accepted candle, leading and trailing days included; per unit in 2025-10; none for 2026-10 | test/vision-source.test.mjs | F1 | 6 |
| 12 | F1a-2 r5 merge: a gap is filled from a daily; valid/valid equal keeps the monthly row; filledRanges are maximal and end-exclusive | test/vision-source.test.mjs | F4, F6 | 6 |
| 13 | F1a-2 r5 merge: a value mismatch anywhere on a fetched day fails, also outside the holes; +0 equals -0 | test/vision-source.test.mjs | F4 | 6 |
| 14 | F1a-2 r5 merge: valid / quarantined fails in both directions | test/vision-source.test.mjs | F4 | 6 |
| 15 | F1a-2 r5 merge: quarantined in both gives two records and one missing minute; quarantined / absent gives one record | test/vision-source.test.mjs | F4, Q3 | 6 |
| 16 | F1a-2 r5 cli download: a verified monthly file is parsed and its fill days fetched, CHECKSUM first; a 404 pair is fill unavailable (exit 0), not a gap, not listing evidence | test/vision-1m-cli.test.mjs | F2, F3 | 7 |
| 17 | F1a-2 r5 cli download: fills are derived on the cache-hit path | test/vision-1m-cli.test.mjs | F2 | 7 |
| 18 | F1a-2 r5 cli download: a fill 404 on one of the pair, a failing fill, and a monthly parse or cap failure exit 1 | test/vision-1m-cli.test.mjs | F2, Q4 | 7 |
| 19 | F1a-2 r5 cli download: firstFiles names base sources only; fill files never appear in gaps or notListed | test/vision-1m-cli.test.mjs | F3, F7 | 7 |
| 20 | F1a-2 r5 store: a filled unit lists the monthly file and every present fill daily, also one that fills nothing, in sources, header and entry; unavailable days are reported, not stored | test/f1-1m-store.test.mjs | F6 | 8 |
| 21 | F1a-2 r5 store: a fill with the 404 marker is unavailable (no exit 3, not listing evidence); a fill without version and marker makes the unit missing (recorded404 false) | test/f1-1m-store.test.mjs | F2, F3, F5 | 8 |
| 22 | F1a-2 r5 store: two versions or a corrupt version of a fill source fail the unit and outrank a missing fill | test/f1-1m-store.test.mjs | F5 | 8 |
| 23 | F1a-2 r5 store: an over-cap daily that fills nothing fails its unit | test/f1-1m-store.test.mjs | Q4 | 8 |
| 24 | F1a-2 r5 store: the split month uses only the dailies of each unit's own days; no record in both units | test/f1-1m-store.test.mjs | F1, Q3, Q5 | 8 |
| 25 | F1a-2 r5 store: fill sets and common entries are byte-identical for narrow and broad --from/--to, reversed enumeration and a warm rerun | test/f1-1m-store.test.mjs | F1, A4 | 8 |
| 26 | F1a-2 r5 store: firstSourceFile is the base source when a fill daily sorts first | test/f1-1m-store.test.mjs | F7 | 8 |
| 27 | F1a-2 r5 store: 2026-10 base dailies record quarantine, get no fill and filledRanges []; a corrupt daily outranks a missing one | test/f1-1m-store.test.mjs | F1, F5 | 8 |
| 28 | F1a-2 r5 store: build report per symbol (source rows, unique minutes, list without split duplicates, filled minutes, fill sources, unavailable days) | test/f1-1m-store.test.mjs | Q5 | 8 |
| 29 | F1a-2 r5 store: holdout records, fill reports and every diagnostic path (mismatch, valid/quarantined, over-cap) contain no values | test/f1-1m-store.test.mjs | F9 | 8 |
| 30 | F1a-2 r5 store: the memory guard is checked before each base parse and each fill load; a trip at a fill load aborts the build and publishes nothing | test/f1-1m-store.test.mjs | F10 | 8 |
| 31 | F1a-2 r5 store: verify fails on a deleted referenced zip (monthly or fill daily) and on tampered new fields | test/f1-1m-store.test.mjs | F8 | 9 |
| 32 | F1a-2 r5 store: compare matches a filled unit and reports mismatched when the reference lists a fill daily that is unavailable locally | test/f1-1m-store.test.mjs | F8, F6 | 9 |
| 33 | F1a-2 r5 store: compare: a fill daily without version and marker is a missing input (exit 1) | test/f1-1m-store.test.mjs | F5, F8 | 9 |
| 34 | F1a-2 r5 cli: verify and compare report quarantine and fill per symbol; download, build, verify, compare exit 0 on a store with a filled gap and a quarantined row | test/vision-1m-cli.test.mjs | Q5, F8 | 9 |

Existing F1a-2 tests that change (none of the 73 old tests; `config.default.json` and `results/manifest-h2.json` untouched):

- `test/vision-source.test.mjs:103` "every kept token is a non-empty finite decimal; quote, taker and count rules hold": the value-rule assertions (`:111-116`, `:120-122`) expect a throw; Q1 makes them quarantine. They become quarantine assertions; finite, field and count assertions stay. Commit 5.
- `test/vision-source.test.mjs:126` "errors name the row and time, never a price": its failing row breaks "high below max(open, close)", now quarantined. It gets a structural failure with the same prices and also checks the quarantine record. Commit 5.
- `test/f1-1m-store.test.mjs:29-30` (`ENTRY_KEYS`) and `:72` "build writes one snapshot per unit ...": the key list and the expected entry gain the two fields. Commit 4.
- `test/f1-1m-reader.test.mjs:32-46` helper `plant()`: hand-made entries gain `quarantinedRows: []` and `filledRanges: []`, else `readManifest` rejects them before the reader check under test. Setup only; affects the reader tests at `:77` and `:88`. Commit 4.
- `test/f1-1m-store.test.mjs:336` "failures and summaries for holdout units ... never prices": its row now quarantines; it asserts the record (time, rule) and no prices, and keeps a failure path through a structural error. Uses the `put` helper with `csv`, so the commit 8 helper change covers its setup. Commit 5.
- `test/vision-1m-cli.test.mjs:68` "download: sequential HTTPS ...": `:78-79` expect two requests per month and `:84` only CHECKSUM requests on the rerun; the sparse fixture months now also request their fill days. It asserts the monthly requests in order with their fill requests after them, and on the rerun only CHECKSUM requests for the monthly files. Commit 7.
- `test/f1-1m-store.test.mjs:19-23` helper `put()`: for a monthly source it also records the 404 marker of every day of the month (fill unavailable), since under F5 a sparse fixture month without fill evidence is missing. Setup only, assertions unchanged. Every store test that calls `put()` gets the markers: `:72`, `:104`, `:122`, `:133`, `:149`, `:165`, `:179`, `:211`, `:228`, `:243`, `:259`, `:270`, `:280`, `:294`, `:327`, `:336`; those that build a sparse month need them to keep their result. Commit 8.
- `test/f1-1m-reader.test.mjs:16-27` helper `fixture()`: records the same fill markers; setup only; affects all seven reader tests. Commit 8.
- `test/f1-1m-store.test.mjs:280` "a run aborted after some snapshots publishes nothing ...": the guard trips on its third call; the new checks around parse and merge move that call into the first unit. It trips on the second unit's label instead. Commit 8.

## 7. Commit order

Each code commit: failing tests first, then the implementation; the body states the red count of the new tests before, the green count after, the full-suite total, and the changed existing tests by name. No commit mixes a refactor with new behavior.

1. Done: contract amendment round 5 (docs).
2. This plan (docs).
3. Refactor: `fetchSource` extracted from `download` (`src/vision-1m.mjs:129-153`); no behavior change, 148/148, no test change.
4. Entry schema: `ENTRY_KEYS`, `checkEntry` for both fields (build writes `[]`), old key set rejected. Tests 1-2; changes `ENTRY_KEYS`/`:72` (store) and `plant()` (reader).
5. Row quarantine end to end without fill: `parseKlines`, `QUARANTINE_RULES`, cap, `unitQuarantine`, entry records, build and verify `quarantine` report. Tests 3-10; changes vision-source `:103`, `:126`, store `:336`.
6. Pure fill functions: `source()` `kind`, `fillSources`, `mergeUnit`, `minuteRanges`; not wired yet. Tests 11-15.
7. Download fills: F2, F3, F7 (download side), `fills` summary. Tests 16-19; changes cli `:68`.
8. Build fills: F1, F4, F5, F6, F7, F10 in `buildUnit`, `buildStore`, `coverageOf`; `fill` report. Tests 20-30; changes store `put()`, `:280`, reader `fixture()`.
9. Verify and compare: F8, Q5 for verify and compare. Tests 31-34.

Test limit: `main` builds its own guard from `--max-rss-mib` (`src/vision-1m.mjs:187`), so a CLI test can only trip it at the first check; the new download checks are not targeted by a test, and no test seam is added for them. Build's new checks are targeted at store level (test 30).

Then push once, Codex review rounds as usual; the rerun of section 8 only after a clean review confirmed by Claude in chat.

## 8. The later rerun

Clean store first (approval point 8), only inside the clone, from the code: `experiments/strategy-destruction-filter/data/vision/` (zips, CHECKSUMs and `*.tmp-*` under `<sha256>/` directories, and every `404/` marker, base and fill, monthly and daily), `experiments/strategy-destruction-filter/data/market-cache/f1-1m/` (`*.bin` and temp files), `experiments/strategy-destruction-filter/results/manifest-f1-1m.json` with `.lock` and `.tmp`. Record the list and sizes, delete exactly those, then `git status` must show no tracked change.

Commands, from `experiments/strategy-destruction-filter`, each under `/usr/bin/time -v` for wall time and maxRSS, built-in ceiling:
1. `node src/vision-1m.mjs download --symbols BTC,ETH,SOL,XRP,DOGE,HYPE --from 2021-10 --to 2026-10`
2. `node src/vision-1m.mjs build --symbols BTC,ETH,SOL,XRP,DOGE,HYPE --from 2021-10 --to 2026-10`
3. the same build again, without a download
4. `node src/vision-1m.mjs verify --symbols BTC,ETH,SOL,XRP,DOGE,HYPE --from 2021-10 --to 2026-10`
No compare (VPS step).

Stop rules (no commit, report instead):
- exit code other than 0 in steps 1, 2 or 4; step 3 not all unchanged (built 0, unchanged = step 2 built, same not_listed and empty counts) or a different manifest sha256;
- any not_listed month for BTC, ETH, SOL, XRP or DOGE; for HYPE a not_listed month from 2025-05 on, a first base file other than the monthly `HYPEUSDT-1m-2025-05.zip`, or a first 1m candle before 2025-05-30T10:30:00Z;
- any structural parser or format failure, any file over the quarantine cap, any source disagreement or valid/quarantined conflict (all exit 1 anyway);
- any difference from the expected outcome of the amendment: the fill sources, unavailable days, `filledRanges` and `quarantinedRows` of SOL and XRP 2022-02 and 2022-04, XRP 2023-11 and HYPE 2025-05, or any other unit with a fill source or a quarantined row;
- regression check against the backup (`<outside the repo>/commit10-stopped-manifest-f1-1m.json`, sha256 `e0606e81...ae03`, 328 entries): every unit without a fill source and without a quarantined row must have the identical snapshot sha256 and an entry equal apart from `quarantinedRows: []` and `filledRanges: []`. Expected: 323 such units (328 minus SOL and XRP 2022-02 and 2022-04 and HYPE 2025-05), plus XRP 2023-11 new, 329 entries in total. Any other difference is a stop.

Not stops: quarantined value rows within the cap; unavailable fill days.

If nothing stops: `docs/f1/f1a-2-vision-1m.md` as in the commit 10 prompt, plus per symbol the quarantine and fill report, and the regression result; commit the manifest and the doc only.

## 9. Deviations, contradictions and open questions

Contradictions:
1. Q5 vs F8 and decision 32 (verify and unavailable fill days). Q5 asks verify to report unavailable fill days; F8 keeps re-deriving with compare, and decision 32 keeps them out of the manifest. Proposal, no guess beyond it: verify derives them from the entry alone. For a built monthly unit the minutes without an accepted monthly candle are exactly `missingRanges` plus `filledRanges` (F4: a monthly-valid minute is never missing or filled; a filled minute was monthly-absent), so the fill set is the days touching those ranges and the unavailable days are that set minus the entry's daily sources. No monthly bytes are read. Empty units have no entry, so verify cannot report them (build and compare do). Needs Tomas's confirmation before commit 9; nothing before it depends on it.

Deviations (choices the amendment leaves open):
1. F5 for base sources: "any dependency" includes the 16 base dailies of 2026-10, so a daily with two versions or a corrupt one now fails the unit even when another daily is absent (today `missing`, `src/f1-1m-store.mjs:182-185`). Followed as written; no existing test covers that mix.
2. The cap error text is not in the amendment: proposed `more than 10 quarantined rows in this file`, with row number and open time of the 11th, no values.
3. download keeps `counts` base-only and puts fills into a new `fills` object, so the approval-point-4 meaning of the base counts and the existing count assertions stay. A monthly file that verifies but fails parsing counts as downloaded and verified (its bytes are stored) and as failed.
4. verify checks referenced sources against the zips its own walk already verified (the identical check to `readVerifiedSource`) instead of hashing them twice.
5. `source()` gains an internal `kind` field; it is not in any header or entry.
6. Existing F1a-2 tests change as listed in section 6, mostly setup through the `put()`, `fixture()` and `plant()` helpers.
7. The new memory-guard checks in download have no targeted test (section 7, test limit); adding a guard seam to `main` would widen the CLI interface.

Open questions:
1. Glossary: "fill" here (a minute taken from a daily file) collides with the execution and backtest "fill" in `docs/ubiquitous-language.md` ("Execution", "Ambiguous fill"; ledger I61 already tracks homonyms for the F1a-2 PR). Proposal: rows for base source, fill source, quarantined row and fill unavailable, plus a homonym row, in a docs commit of this round. Tomas decides whether it goes into PR #2.
2. A fill daily that is published after a build changes the rebuilt entry; build then fails that unit ("the rebuilt entry differs", `src/f1-1m-store.mjs:230-233`) until a version-selection rule exists, and compare reports it as mismatched. This follows approval point 3; noted because it can now happen without any republished base file.
3. Carried from earlier rounds, unchanged: 404 markers are never removed; version selection after a republished source; listing-rule cost on the full store not measured; critique points outside F1a-2; A12 deferred items; HYPE listing date from a second source.
