# F1a-4 funding: step 8 report

Branch `f1/a4-funding`. Written 2026-11-11 by Claude in chat (session f1a4_89_step8report) from the step 8 outputs; committed by Tomas from WSL on the PC. Contract `docs/f1/f1a-4-contract.md` (binding, with amendments 1 and 2), plan `docs/f1/f1a-4-plan.md` (sections i and k). Every claim is labelled **tested** (how, how many), **taken over** (from where) or **reasoning**. Paths are relative to `experiments/strategy-destruction-filter` unless they start with `docs/`. No rate value appears here. For the holdout month files only availability and CHECKSUM are stated; nothing about any holdout row, and no file size (amendment 2 B1).

## Result

**Acceptance (plan section i, as changed by amendment 2 B1) is met** (tested: `download.json` and `verify.json` of the run below):

- `download` exit 0, status `ok`: 360 planned sources, 317 downloaded and CHECKSUM verified, 43 not listed, 0 gaps, 0 failures, no version conflict, no repaired CHECKSUM file.
- `verify` (research only) exit 0, status `ok` for all six symbols: every research file present and verified, no parse failure, no gap month, no anomaly (no off-grid settlement, unexplained gap, unexplained change, unproven first settlement, trailing-edge or empty-file case).
- not_listed is exactly HYPEUSDT 2021-10..2025-04 (43 months), identical in `download` and `verify`.
- maxRSS 100 MiB (`download`) and 89 MiB (`verify`), ceiling 512 MiB.
- Holdout: availability and CHECKSUM per file only. `integrity` was not run (decision 60); it runs once, in the m4 step.

The digests below are first values: no second run has reproduced them yet.

## Run (tested: step 8 console, taken over where marked)

- Tomas on the PC (WSL), 2026-11-10 23:35:45 to 23:46:24 UTC, with a shell block that Claude in chat ran first in its sandbox (mock Vision, Node 24.22.0, bash and dash, 8 stop branches; taken over: chat session seal_88_pr10review).
- Code: fresh clone, detached at `5654505` (merge of PR #10), tree clean. Node v24.10.0, linux.
- Data directory `~/code/f1a4-step8/data` on the PC, outside the repo, not committed (m5: storage S1, compute on read). First 1m candles from the default manifest `results/manifest-f1-1m.json`.
- From `experiments/strategy-destruction-filter`:
  - `node --test --test-reporter=tap test/f1-funding*.test.mjs`: 71 tests, 71 pass, 0 fail.
  - `node src/f1-funding.mjs download --data-dir <data>`: exit 0, 23:36:30 to 23:46:21 UTC (9 min 51 s).
  - `node src/f1-funding.mjs verify --data-dir <data>`: exit 0, 23:46:21 to 23:46:24 UTC (3 s; `date` has 1 s resolution).
- Outputs kept on the PC, not committed: `download.json` sha256 `492c1b83166bec17e396db67b777fd547112c74acd49fddff70496578748596d`, `verify.json` sha256 `67b1f744bdb738ccc0dcad33eebaafc08b5b8d1101f8045e6a420550f138469d`. Every figure in this report comes from these two files (tested: Claude in chat checked both sha256 against the console and every figure in the tables below against the files with a script).

## Files

Each symbol has 60 monthly sources, 2021-10..2026-09; 2026-10 is never planned (m4). The split below is reasoning from the month names, checked against the counts (tested):

| Part | Months | Files | State |
| --- | --- | --- | --- |
| Research sources | 2021-10..2025-10 | 251 (49 each for BTC, ETH, SOL, XRP, DOGE; 6 for HYPE, 2025-05..2025-10) | verified and parsed by `verify` |
| Holdout month files | 2025-11..2026-09 | 66 (11 per symbol) | available, CHECKSUM verified; nothing else read or reported |
| Not listed | HYPE 2021-10..2025-04 | 43 | not_listed by the F1a-2 listing rule |

251 is the sum of `verified` over the six symbols in `verify`, and 251 + 66 = 317 = `downloaded` = `verified` in `download` (tested). The 2025-10 files are research sources that also hold sealed rows; their research parse read only `calc_time` of sealed rows (contract Q4 row d:81-82, amendment 2 B2).

## Research per symbol (tested: `verify.json`)

Research window 2021-10-18T00:00Z to 2025-10-17T00:00Z (end exclusive).

| Symbol | Research files | Settlements | First | Last | Offset max | Interval changes |
| --- | --- | --- | --- | --- | --- | --- |
| BTCUSDT | 49 / 49 | 4,380 | 2021-10-18T00:00Z | 2025-10-16T16:00Z | 31 ms | none |
| ETHUSDT | 49 / 49 | 4,380 | 2021-10-18T00:00Z | 2025-10-16T16:00Z | 31 ms | none |
| SOLUSDT | 49 / 49 | 4,455 | 2021-10-18T00:00Z | 2025-10-16T16:00Z | 31 ms | 3 (below) |
| XRPUSDT | 49 / 49 | 4,380 | 2021-10-18T00:00Z | 2025-10-16T16:00Z | 31 ms | none |
| DOGEUSDT | 49 / 49 | 4,380 | 2021-10-18T00:00Z | 2025-10-16T16:00Z | 31 ms | none |
| HYPEUSDT | 6 / 49 (43 not listed) | 837 | 2025-05-30T12:00Z | 2025-10-16T20:00Z | 20 ms | none |

Total 22,812 research settlements. Offset = `calc_time` minus the settlement hour.

SOLUSDT interval changes, all class `interval_change` (contract section 2: pass):

| Time (UTC) | Old (h) | New (h) | Elapsed (h) |
| --- | --- | --- | --- |
| 2022-11-09T20:00Z | 8 | 4 | 4 |
| 2022-11-10T04:00Z | 4 | 2 | 4 |
| 2022-11-18T16:00Z | 2 | 8 | 8 |

No bridge to the new grid occurred in the research (tested: no `bridge` change in `verify`).

## Coverage at the edges (contract section 3; tested: `verify.json`)

- Leading edge, BTC, ETH, SOL, XRP, DOGE: each first research settlement (2021-10-18T00:00Z) was checked against its predecessor in the 2021-10 file; no anomaly. Rows before 2021-10-18 were read for the predecessor only and are not counted above.
- Leading edge, HYPE: before listing 2021-10-18T00:00Z to 2025-05-01T00:00Z (the 43 not_listed months); listed, before the first charge 2025-05-30T10:30Z (first 1m candle) to 2025-05-30T12:00Z. The first settlement is the first grid point of its interval after that candle (no `first_settlement_unproven` anomaly).
- Trailing edge: the last research settlement is 2025-10-16T16:00Z (BTC, ETH, SOL, XRP, DOGE) and 2025-10-16T20:00Z (HYPE); no `trailing_edge` anomaly. It was decided without reading a sealed row.

## Cross-checks (Claude in chat)

- 4,380 = 1,460 days x 3 settlements per day at 8 h (tested: day count and the 8 h grid computed over the research window).
- SOLUSDT 4,455 = 4,380 + 75 (tested: the sequence rebuilt from the three changes): 2 settlements at 4 h (2022-11-09T20:00Z, 2022-11-10T00:00Z) and 99 at 2 h (2022-11-10T04:00Z to 2022-11-18T08:00Z) replace 26 points of the 8 h grid.
- The completed VPS scan of 2026-10-28 (taken over: contract section 4) agrees: intervals 2, 4 and 8 h only; the only interval changes are these three; no off-grid settlement or unexplained gap; HYPE 837 rows before 2025-10-17 and offset maximum 20 ms (= `verify`). The research offset maximum of 31 ms is at most the scan's 47 ms over the whole history. The scan's row for 47 ms was not located (not verified).

## Input hashes

Chosen with Tomas in this session (question tool): the digest per symbol, the code identity and the sha256 of the two output files (above). No per-file list: `verify` does not print it, and the digest binds it.

Digest (m5: sha256 of the canonical JSON of schema, instrument, dataStart, dataEnd, sources `{file, sha256}` in file order, coverage, anomalies and columns, here over the whole research window):

| Symbol | Digest |
| --- | --- |
| BTCUSDT | `afc43f2715d25e516c09456f2a59b95b566a12dbadf500c03254ef51ee354721` |
| ETHUSDT | `1c064d3ddb535a5fb0647ad5d1ec79aefb01e03b1eaafebfb886aa430953c2a4` |
| SOLUSDT | `4db3355f027532677418135059cb2b52c91288cea030d338a63d7ba1f7aed003` |
| XRPUSDT | `825dc9476d29d3ab7665d81361cb5d7694882c212680e6ed7cbce37be57290b5` |
| DOGEUSDT | `fa95ca3154776a630e8c58f8f3eeff93dfe5f1f0b268099fde19584b1c2f44bd` |
| HYPEUSDT | `c051014616d35a85a6b9a22d0f532e8575c36cebadab571af5421287fff942f9` |

The sha256 of each whole 2025-10 file is the only digest input that depends on holdout bytes (amendment 2 B2). If a later digest disagrees, the research reader returns the `{file, sha256}` list (`sources`) to locate the file (reasoning, from the code).

Code identity (`verify`): git revision `5654505334dba88bbc19465243a0f22853cd4788`, not dirty; module closure of `src/f1-funding.mjs` (tested: Claude in chat recomputed all 7 sha256 from the repo at `5654505`, 7 equal):

| Module | sha256 |
| --- | --- |
| `src/f1-1m-format.mjs` | `b261d673ae36576273dbf3f3d5bc14a89901d71990f3388f2e08b1b3ae17820f` |
| `src/f1-1m-store.mjs` | `1795c7344d5da729caf0c71ff74b5f08ba45ab03e09338f6a5daab289f745ea2` |
| `src/f1-funding.mjs` | `9115702852beba863e996a8e7a0009763741bafe2a93a9f36107000f5c793858` |
| `src/h2-contract.mjs` | `8fee0b4dbd7f03d7c00f1c8fe7461b7772bb3deb93f16d74850bd043df5beaf1` |
| `src/vision-1m.mjs` | `09fdbd908159c12eda159f34fd0b89aae6723e8f38b345277a75bab0f4121f30` |
| `src/vision-source.mjs` | `d918bf6804803028d56e7e9c42efd459fc94b77f6cf4a4ed57dba7f3fca1d891` |
| `src/vision-transport.mjs` | `ed051e5a6b15aefcbacaf9be432e63d181a75b3b711b1ab8acd985f2b5a6b130` |

## Memory and time (tested: the two output files and the console)

| Command | maxRSS (process peak) | RSS at guard checks | Ceiling | Wall clock |
| --- | --- | --- | --- | --- |
| `download` | 100 MiB | 360 checks, first 54, last 100, max 100 MiB | 512 MiB | 9 min 51 s |
| `verify` | 89 MiB | 294 checks, first 63, last 86, max 86 MiB | 512 MiB | 3 s |

## Holdout status (amendment 2 B1)

Established: the 66 holdout month files are available and CHECKSUM verified (`download`). Not established: no holdout parse, no holdout schedule check, no integrity result. Holdout evaluation stays blocked until the m4 step: the one `integrity` run after the m9 (c) gate (decisions 57, 60), with the October 2026 file added there (m4). The data directory above is the input for that step unless decided otherwise. The 2025-10 version binding between the paths (M4) is deferred to that step (amendment 2 B8).

## Not established by F1a-4

- Payment amounts and the mark-price proxy (m2; payment phase).
- The REST cross-check (m1; outside F1a-4 code).
- Vision's interval labels on the boundary rows of an hourly episode (contract section 2, not verified; the m9 (c) gate).
- A reproduction of the digests (plan section i: a VPS rerun is not needed; a digest comparison can join the F1f check).

## Deviations

- Step 8 is `download` plus research `verify` (decision 60, amendment 2 B1), not the single verify including holdout of decision 52.
- The report was written by Claude in chat and committed by Tomas from WSL, not by Claude Code (executor chosen with Tomas in session seal_88_pr10review).
- The commit before this one merges `main` at `828c10f` into this branch, so that `docs/MAP.md` here continues from `main`'s version (decision with Tomas in this session). `main` had changed `docs/MAP.md` twice since the merge base and names a file that existed only on `main`. No file was changed on both sides (tested: merge in Claude's sandbox, no conflict, `main` to merge result = the 14 F1a-4 files).
- Hours: contract section 8 measures wall clock from the plan commit `c64902b` to the merge commit; that figure is due at the PR merge.
