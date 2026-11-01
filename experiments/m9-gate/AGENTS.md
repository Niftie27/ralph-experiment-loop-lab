## Code Review Rules

Research only; nothing here trades. The contract for every file under experiments/m9-gate/ is docs/f1/m9-gate-spec-v6.2.txt on main (sha256 adae5a30cf2882821cc7a8dcf177c9ce4b7c5d2c4711c0ec28e4cb9ece01ee1b, approved 2026-10-31). Report violations of these rules as P1 and name the spec clause.

### Spec conformance
- Flag any behavior of m9-scan.mjs that differs from spec v6.2, and any point the spec leaves open that the code settles without saying so. Safe path: implement the clause as written; name an open point in the PR description instead of settling it in code.

### Holdout seal and the six excluded symbols
- Flag any path that lists, downloads or reads an object key of the six excluded symbols (S1); that reads more than the routing token of a row at or after the seal in a 2025-10 file, or reports a count, statistic, size, time or row number of such rows (I2); or that records anything but resource_2025_10 for a resource abort inside a 2025-10 file (F6). Safe path: route by the calc_time token first and drop sealed rows unread.
- Flag O7 fixtures from month 2025-10 or from keys outside the O7 selection, and any output other than the raw O7 fixture bytes that contains a rate or price (O).

### scheduleClass import
- Flag any use of experiments/strategy-destruction-filter/src/f1-funding.mjs other than scheduleClass called as E1 states, and any weakening of the preflight or pre-import checks of Node v24.22.0 and the seven closure hashes (E1, F5, F6). Safe path: import scheduleClass unchanged; a pin difference at preflight rejects the run before any request, import or output, and one found by the re-hash immediately before the import invalidates the run (F5).

### Resources and network
- Flag any network request other than the anonymous S3 listing of data.binance.vision (s3-ap-northeast-1.amazonaws.com) and its zip and .CHECKSUM objects on data.binance.vision; any received body byte, non-200 bodies included, outside the byte counter; and any read, decompression, line count or output write without its bound (F6). Safe path: count every body byte and abort at the bound; a bound hit is a resource abort, never an exclusion.

### Tests, limits and pins
- Flag edits or deletions of existing tests, expected values without a spec clause or recorded 4a data behind them, and changes to LIMITS, PINS or the failure policy (F1 to F6) in the same PR as the code they judge, unless the PR description says Tomas approved them. Safe path: propose the change in a PR comment.
- experiments/m9-gate/review/ holds Claude's independent review harness: flag any import from m9-scan.mjs into review/s54/indep.mjs.

### Public repository hygiene
- Flag private hostnames, usernames, IP addresses, chat ids, absolute home paths, keys or anything from ~/.ssh; public exchange and data API hosts are fine. Safe path: write ~ and placeholders.
