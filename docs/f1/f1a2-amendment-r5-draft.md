## Amendment 2026-10-21, commit 10 stop (row quarantine and daily fill)

Status: DRAFT for review. Decided by Tomas on 2026-10-21: (1) quarantine, (2) fill monthly gaps from daily files. The rule text below is open for review.

### Why
The commit 10 full build (PC, 2026-10-21) stopped:
- XRPUSDT-1m-2023-11, row 2023-11-30T12:35:00Z: taker_buy_volume 132462.5 > volume 91695.7. A VPS check (2026-10-21) found the same row in the daily file XRPUSDT-1m-2023-11-30 and in Binance REST /fapi/v1/klines. It is a source value defect, not an archive or parser defect. The other 412 files passed every row rule.
- SOLUSDT and XRPUSDT monthly files 2022-02 and 2022-04 lack 2022-02-26T00:00Z..2022-03-01T00:00Z and 2022-04-01T00:00Z..2022-04-03T00:00Z (7,200 minutes per symbol, ranges end-exclusive). The daily files of those days are complete (1,440 rows each, CHECKSUM verified); the 3 minutes probed by REST at each range start equal the daily rows in all 12 columns. BTC, ETH and DOGE have no such gaps.
The manifest is not committed yet, so new entry fields need no migration.

### Q. Row quarantine
Q1. Scope: only the value rules of the row check (vision-source.mjs parseKlines): volume >= 0; quote_volume >= 0; taker_buy_volume within 0..volume; taker_buy_quote_volume within 0..quote_volume; low > 0; low <= min(open, close); high >= max(open, close). Every other check still fails the source file as now: newline at end, header, empty line, 12 fields, millisecond timestamps, minute alignment, close_time = open_time + 59,999, file bounds, strictly increasing open_time, finite decimals, count format.
Q2. A row that breaks a value rule is quarantined: its open_time still takes part in the alignment, bounds and ordering checks, but it gives no candle. Its minute counts as missing in rowCount, missingMinutes and missingRanges.
Q3. Each quarantined row is recorded in its unit's manifest entry, new field quarantinedRows: array of {file, openTime, rule}; file = the Vision path of the source, openTime = ISO, rule = the first broken rule's text; sorted by openTime, then file; [] when none. No values.
Q4. More than 10 quarantined rows in one source file fail that unit (many violations point to a parser or format fault, not single bad rows).
Q5. Quarantine does not change exit codes. Like missing minutes inside a present file, it is reported (per symbol: count and list) and never sets 1 or 3 by itself.

### F. Daily fill of monthly gaps
F1. Only for units built from a monthly file. Every UTC day of that monthly file that lies inside the F1a range and has at least one missing minute in the monthly file (absent or quarantined) has a fill source: futures/um/daily/klines/<contract>/1m/<contract>-1m-<YYYY-MM-DD>.zip with its .CHECKSUM. The set is derived from the verified monthly file alone, so it does not depend on --from/--to, other months, other symbols or the manifest.
F2. download fetches the fill sources after verifying the monthly file, with the same transport, CHECKSUM verification, storage, version directories and 404 markers as other sources. Exit codes as approval point 4, with one exception: a fill source with recorded 404 on both the zip and its .CHECKSUM means "no fill available" for that day; it is no gap and does not set 3. A 404 on only one of the pair, or any other download failure after the retries, is 1.
F3. Fill sources are never listing evidence (notListedSources ignores them) and never make a unit not_listed or missing by their 404.
F4. build: a minute missing in the monthly file takes the daily row of that minute if that row is not quarantined. Every minute present in both files must be equal in all 10 kept columns (parsed values); a difference, or a row valid in one file and quarantined in the other, fails the unit (sources disagree). A row quarantined in both stays missing and is listed once per file in quarantinedRows. A minute missing in both stays missing.
F5. A fill source with more than one local version fails the unit (approval point 3). A fill source absent locally without both 404 markers makes the unit missing, like any absent source.
F6. Entry: sources lists the monthly file and every fill source that was read (file, sha256), sorted by file as now. New field filledRanges: end-exclusive ranges of the minutes taken from daily files; [] when none.
F7. verify and compare apply the same rules. verify checks every fill source in sources like any other source. compare rebuilds with the same fill set.
F8. Holdout: quarantine and fill apply to holdout units too. File names, open times, rule names, ranges and the agree/disagree result count as integrity metadata under the round 4 amendment. No prices, volumes, trade counts or values derived from them are printed or stored.

### Expected outcome of the rerun (to check, not to force)
- SOL and XRP: 2022-02-26..28 and 2022-04-01..02 filled from daily files; no other change.
- XRP 2023-11: built; one quarantined row (2023-11-30T12:35:00Z, taker_buy_volume rule) in the monthly and the daily file; that minute missing.
- HYPE: dailies 2025-05-01..29 have 404 (no fill); 2025-05-30 daily agrees from 10:30Z; first candle 2025-05-30T10:30:00Z and 42,390 missing minutes unchanged.
- BTC, ETH, DOGE: no fill source, no quarantined row; entries change only by the two new empty fields.

### Tests (at least)
Each of the 7 value rules quarantines; a structural error still fails; 11 quarantined rows in one file fail the unit; a holdout quarantine record holds no values; a gap is filled from a daily; an overlap mismatch fails; valid in one file and quarantined in the other fails; quarantined in both stays missing; fill 404 on both gives no fill, no exit 3 and no listing evidence; 404 on one of the pair gives 1; two local versions of a fill source fail; the fill set and entries are identical for different --from/--to selections; verify and compare accept a filled unit and reject a changed fill source. The 73 old tests stay byte-identical; changed F1a-2 tests are named in the commit body.
