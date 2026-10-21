# F1a-2 round 5 plan: independent second opinion

## Verdict and evidence boundary

**Changes required before implementation is approved as written.** The quarantine and daily-fill design is substantially faithful to the amendment; the blocking issues are transport wording, failure precedence, cache lifetime/guard placement, and an incomplete verification/reporting specification. This is a document review, not implementation or rerun approval.

Reviewed after `git fetch origin`: `origin/f1/a2-vision-1m` at `8f58ad3`. Plan SHA256 verified as `9db4870eb7e0f34c9eab191929c599a3d82b041356c5033feebd449c6e4ab5cb`. A Git tree diff confirms `src/` and `test/` on that branch are identical to `219b170`. No pull, code change, dataset download, execution of the proposed pipeline, runtime change, or deletion was performed. The reported 148/148 baseline and stopped manifest's contents/hash were **not verified** independently; they are reported by the plan, not results of this review (P:5).

Anchor notation throughout this document expands to repository paths at `8f58ad3`:

- **P** = `docs/f1/f1a2-r5-plan.md`.
- **C** = `docs/f1/f1a-2-contract.md`.
- **V** = `experiments/strategy-destruction-filter/src/vision-source.mjs`.
- **S** = `experiments/strategy-destruction-filter/src/f1-1m-store.mjs`.
- **CLI** = `experiments/strategy-destruction-filter/src/vision-1m.mjs`.
- **FMT** = `experiments/strategy-destruction-filter/src/f1-1m-format.mjs`.
- **TV**, **TS**, **TC**, **TR** = respectively `experiments/strategy-destruction-filter/test/vision-source.test.mjs`, `f1-1m-store.test.mjs`, `vision-1m-cli.test.mjs`, `f1-1m-reader.test.mjs`.

Thus `P:23` is a path:line citation, not a citation to a future implementation. Proposed behavior below is judged from the plan; runtime correctness remains **not verified**. The amendment overrides earlier rules for its named cases (C:122).

## 1. Q1–Q5 and F1–F10: coverage, correctness, anchors

| Point | Verdict | Evidence and qualification |
|---|---|---|
| Q1 | Covered, correct | P:11 targets the exact structural/finite/count/value-rule sequence in V:104, V:121, V:136 and V:143. It preserves the seven rules and first-rule order required by C:129. ZIP/CHECKSUM anchors V:12 and V:57 are right. |
| Q2 | Covered, correct with ordering clarification | P:13 preserves the previous timestamp before quarantine (V:134), uses dense accepted columns, and computes coverage after merging (S:194; C:130). An all-quarantined **monthly** input must still discover and validate fills before deciding the unit is empty; a valid daily against its quarantine is a conflict, not an empty-success shortcut (C:139; P:27). The old empty return is indeed S:195. |
| Q3 | Covered, correct; strengthen relational checks | P:15 and P:64 cover the exact keys, source membership, canonical time, unit bounds, first rule, uniqueness and code-unit sorting in C:131. ENTRY_KEYS and checkEntry anchors S:14 and S:130 are correct. Add the inexpensive cross-field checks in section B below. |
| Q4 | Covered, correct | P:17 puts the cap in parseKlines over the full file, before unit clipping; this matches C:132 and the shared monthly source in V:199–202. The rowError anchor is V:155. Present fill parsing must not be skipped when another fill is missing; see F5. |
| Q5 | Covered, conditional | P:19 and P:68–75 specify all six report components in C:133, including empty-unit records for build/compare. Existing status anchors S:280, S:374 and CLI:181 are right. Verify has only entries, so its report cannot be a complete run report for empty or missing units (P:200). Resolve/report that scope, rather than imply equivalence. |
| F1 | Covered, correct | P:21 follows C:136: only monthly units, full accepted monthly timestamps, own days, no selection/reference dependency, and no recursion. V:179–206 is the correct source/planning anchor. Counting fewer than 1,440 accepted timestamps works because files are minute-aligned, strictly increasing and bounded (V:130–134), and all current unit boundaries are UTC midnights (TV:151–172). |
| F2 | Covered, incorrect wording requiring change | P:23 says ZIP only after CHECKSUM 404. A CHECKSUM 200 needs a ZIP fetch unless the matching verified local version is reused (CLI:131–153). The amendment explicitly requires the same transport (C:137). Keep parsing on fresh and cached monthly paths; do not parse base dailies or fill dailies in download merely to discover recursive fills (P:43–47). |
| F3 | Covered, correct | P:25 leaves the base plan unchanged. S:96–108 filters listing evidence through the planned base paths even though inManifest contains all entry sources. Thus distinct monthly-fill daily paths do not match base evidence. Maintain that filter, and test both local and manifest-only fill evidence (C:138; P:125, P:128). |
| F4 | Covered, correct design | P:27 covers the full minute truth table, all ten parsed columns, equal signed zeros, comparisons beyond holes, and one quarantine record per source row (C:139; V:69). Keeping assembleUnit for base-daily concatenation is correct (V:209–233). Validation/merge may be streamed privately, but no output may be published until all present dependencies pass. |
| F5 | Covered, incomplete precedence | P:29 correctly checks multiple/corrupt fill versions before missing, as C:140 explicitly requires. However only base inputs are parsed before the missing decision; fill parse/CRC/cap failures arise later in mergeUnit (P:27). This conflicts with the plan's general failure-over-missing promise and C:133, C:139. Validate present fills before returning missing; preserve streaming memory. See A. |
| F6 | Covered, correct with validation caveat | P:31 and P:66 match C:141: all present fills in provenance, unavailable days only in report, new fields only in manifest, old layout rejected. FMT:12, FMT:38, FMT:53 are correct header anchors. The proposed disjoint/maximal checks are appropriate, but their meaning depends on valid missingRanges; current S:139 checks shape/ISO syntax only, not coverage truth. See sections 2 and B. |
| F7 | Covered, correct for build; clarify verify | P:33 replaces the actual problematic expression at S:275 with the base plan. Preserve the optional/empty-unit handling present there; a symbol with no built unit must not throw. If verify shares the new reporting helper, classify daily sources as fills only for monthly-base entries (P:55, P:68). CLI:139 is the correct download first-file anchor. |
| F8 | Covered, correct with report limitations | P:35 adds the missing referenced-source check. S:298–310 performs the same checksum/hash/directory checks as S:113–119, so a passed-set lookup is sufficient in the normal non-concurrent verification model. S:364 compares complete canonical entries, S:366 handles missing inputs. Verify must not pretend schema checks reconstruct truthful quarantine/fill provenance; compare remains that authority (C:143). |
| F9 | Covered, correct scope | P:37, P:138 preserve value-free integrity diagnostics and the unchanged reader as C:144 requires. Tests must include download's monthly parse/cap path as well as build/compare; no raw/derived candle values should appear in diagnostics or published test failure artifacts. Existing rowError is value-free (V:155). |
| F10 | Covered, not correct as a lifetime claim | P:39/P:100 cite S:217–224, but eviction at S:224 happens **after** buildUnit; it retains previous-unit parses while the next unit is processed, and is skipped on thrown parse errors (S:242). Move pruning before processing and make failure cleanup explicit. Add post-parse/post-merge checks and targeted download guard tests; see section 8 (C:145). |

The cited existing-code locations generally identify the right functions. The substantive anchor-related errors are interpretations of CLI:131–153 (transport), S:224 (cache lifetime), and S:230–233 (late-source diagnostic), not shifted line numbers. The late-source case normally takes “uses other source versions,” not the quoted “rebuilt entry differs” branch (P:213; S:231–233).

## 2. Section 9 contradiction 1: exactness and boundaries

**Accept the algebra for successfully built monthly-base units; change its scope and tests.** Let U be the unit's minute grid, A its accepted monthly minutes, F the minutes actually taken from daily files, and M its final missing minutes. Successful F4 merging preserves every minute of A and adds only minutes outside A. Hence final accepted minutes are the disjoint union A ∪ F, and **U minus A = M ∪ F**. This follows from C:139–141 and P:27, not from a new assumption about the data. No candle values need to be read by verify to compute the day projection (P:200).

For such an entry, expected fill days are exactly the UTC days touching `missingRanges ∪ filledRanges`. Unavailable-at-build days are that set minus the canonical daily source days in this entry (C:136, C:141). Required qualifications:

1. Apply only when the entry has the corresponding monthly **base** source. Base-daily entries in 2026-10 have missing ranges but no fills; reporting all their source files as fill sources is wrong (C:126, C:136; P:51).
2. Project each half-open interval `[start,end)` onto days using `dayStart < end && dayEnd > start`. Ending exactly at midnight adds no next day. Clip/check bounds against the unit, including 2021-10-18 and 2025-10-17 (V:200–202; C:136).
3. Deduplicate days, use full canonical contract/date paths, and sort. A fully filled gap still triggers its day through filledRanges; an unavailable day appears through missingRanges; a present daily that fills nothing is removed by sources. The latter is essential for HYPE (C:151; P:52).
4. A monthly-quarantined minute stays missing in every successful outcome: a valid counterpart would fail. Daily-only quarantine also stays missing. Duplicate quarantine records do not create extra minutes or days (C:139; P:27).
5. This is the state represented by the successfully built entry, **not current availability**. A later downloaded daily does not retroactively change the entry; compare detects the changed rebuild, while verify may pass both local ZIPs and still report the old entry's unavailable-at-build day (C:141, C:143; S:298, S:364). Label the report accordingly.
6. Empty units have no entry and missing/failed units are not represented completely either. Verify cannot recover their report from entries alone (C:130; P:73, P:200). Obtain the proposed scope decision before commit 9 or explicitly report that these units are not represented; do not silently claim a complete Q5 report.
7. Schema-valid tampering can falsify M or F: S:139 currently does not prove missing coverage and S:323–325 does not compare missingRanges to snapshot timestamps. The algebra is exact for builder-produced entries, not proof of authentic metadata in arbitrary manifests. Cheap relational checks help; compare still re-derives the result (C:143).

Add fixtures for fully filled days, midnight-ending intervals, multiple ranges in one day, split boundaries, HYPE's present-but-no-fill daily, a base-daily entry with missing minutes, and a newly present daily absent from the reference entry. P:140–143 do not explicitly cover these derivation cases.

## 3. Seven deviations and two actionable open questions

| Item | Decision | Reason |
|---|---|---|
| Deviation 1 (P:203) | Accept | “Any dependency” includes base dailies; corrupt/multiple must outrank absent (C:126, C:140). Add mixed-state tests as P:136 proposes. This is compliance, not permission to change the base plan. |
| Deviation 2 (P:204) | Accept | The cap diagnostic has row/time/fixed text and no values, consistent with C:132, C:144 and V:155. |
| Deviation 3 (P:205) | Change | Separate base/fill summaries are useful, but parse-failed monthly files counted both verified and failed change terminal accounting. Existing transport-success counters overlap already (`verified = downloaded + skipped`), but `verified + gaps + notListed + failed = expected` held for completed base processing (CLI:120–166). Document explicitly which counters are transport events and which are terminal outcomes, or preserve the terminal partition by incrementing success only after required monthly parsing. Test fresh and cached parse failures, and ensure fill failures set overall status 1 without inflating base failures. C:63, C:137 require the exit result, not this specific counter layout. |
| Deviation 4 (P:206) | Accept | The walk's successful `(file,sha256)` set proves the same checks as readVerifiedSource (S:113–119, S:303–310). Match exact path and hash, not basename or hash alone. Counts.sources should say whether it counts reference occurrences or unique pairs; split units share a pair (P:83; V:199–202). Concurrent mutation protection beyond existing semantics is not verified or claimed. |
| Deviation 5 (P:207) | Accept | Internal kind helps distinguish base-monthly and base-daily; serialize only `{file,sha256}` into provenance as FMT:38 already does. Header keys remain unchanged (C:141). |
| Deviation 6 (P:208) | Accept with explicit commit evidence | Amendment permits named F1a-2 fixture/assertion changes while protecting the 73 older tests (C:155). P:147–155 names the affected helpers and assertions, corroborated by TV:103, TV:126, TS:19, TS:29, TS:280 and TR:16, TR:32. Byte-diff the protected files per code commit; no new implementation has yet been verified. |
| Deviation 7 (P:209) | Reject the justification; change | CLI:182–187 already accepts an internal deps object. An optional internal guard factory/check hook or testing the extracted worker is not a new CLI flag. Targeted deterministic checks are possible without weakening production ceiling enforcement. P:171 is a current test limitation, not inherent untestability (C:145). |
| Open question 1 (P:212) | Accept as a separate scoped docs choice | Distinguish archive gap-fill from execution/backtest fill. The collision is real (`docs/ubiquitous-language.md:120`, `:144`). It does not block the algorithm; terminology in C:126 is already binding. Do not silently expand this docs-only review into glossary edits. |
| Open question 2 (P:213) | Accept behavior; change diagnostic citation | A later daily changes sources, even if it fills nothing, hence the snapshot header and entry can change (C:141; FMT:53–55). Existing build refuses replacing the entry and compare mismatches (S:230–233, S:364). Normally the source-version branch at S:232 fires, not the “rebuilt entry differs” text at S:233. Add the concrete later-daily test. |

P:214 is a third numbered paragraph, but it is a carry-forward list, not another new actionable question. Its unresolved items remain **not verified** here; this review does not resolve marker lifecycle, version selection, listing cost or the second-source listing date.

## 4. Data-flow verdicts

### Split month 2025-10 — accept, subject to cache fix

Download deduplicates the shared monthly base (CLI:124), parses the whole file once, derives each unit's own fill days, then releases it before sequential downloads (P:43–47). Build reuses the same whole-file parse across the two units, while merge and quarantine output are clipped separately at 2025-10-17T00:00:00.000Z (P:50; V:200–202; TV:197–212). A whole-month cap violation fails both units even if the offending rows straddle the boundary; a bad fill daily affects only its owning unit (C:132, C:136). No duplicate boundary record or cross-unit fill dependency is allowed. Verify deduplicates day/report records appropriately, not physical-file checks into fictional separate files (P:64, P:70; C:133).

### Daily month 2026-10 — accept, isolate reporting

There are 16 base dailies and no monthly source, no fill derivation, and no request on/after 2026-10-17 (V:196–198; TV:162–166; P:45). Download verifies transport only; build parses each present daily, concatenates accepted rows, reports quarantine, and writes filledRanges empty (P:49–51). Failure precedence must examine present base dependencies before an absent daily wins (P:29; C:140). Report fill sources/unavailable fills as empty here: path kind `daily` alone is insufficient to classify a fill (C:126, C:136).

### HYPE 2025-05 — accept as expected, not measured here

Monthly parsing derives days 05-01..30, with 05-01..29 unavailable and 05-30 present; the present daily is fully parsed and compared even though it fills no minute (C:151; P:46, P:52). It belongs in both provenance lists, keeps filledRanges empty under the expected outcome, and must not displace the monthly firstSourceFile (C:141–142). Its presence also changes snapshot header bytes, so this unit is correctly excluded from snapshot regression identity (FMT:53–55; P:191). A need for 05-31 is a newly observed deviation requiring stop/report, not a new assumption to force away (P:46, P:190). Actual source availability and coverage are **not verified** in this docs-only review.

### Parsed cache — change

A whole-file successful parse, keyed by file/hash, supports split reuse and a single physical-file cap; fill dailies should be short-lived (S:188–190; P:39). But the existing post-unit filter is too late and exception-sensitive (S:222–244). Prune to the incoming unit's base keys before processing, retaining the shared monthly key for the split; release non-current state on failure too. Do not put fill parses in the persistent cache. If missing-state precedence needs present fills validated first, stream and discard them or retain only bounded staged output, not all daily parse objects (C:145; P:27, P:29).

## 5. Exit-code table — accept the table, fix implementations feeding it

P:87–94 is substantially consistent with approval point 4 and its named round-5 exceptions (C:63, C:122, C:133, C:137, C:140):

- **Download:** 0 for successful bases/not_listed and stored/unavailable fills; 3 only for base gaps without failures; 1 for asymmetric 404, transport/integrity failure, monthly parse/cap or guard failure. A fill failure must participate in the overall status even when base counts.failed is zero; current CLI:166 looks only at base counts, so the new summary cannot merely add a nested fills object (P:79, P:89).
- **Build:** unavailable fill means no exit 3; unmarked absent fill means missing/3; any failure outranks it with 1. Within-cap quarantine, in-file missing minutes, and an empty unit alone do not set 3 (S:282–283; TS:179; C:130, C:133). This does not mean full minute coverage.
- **Verify:** 0 or 1, not 3; deleted referenced sources become failures (C:143; P:91).
- **Compare:** missing required input is 1; reference-without-twin, mismatched, extra, failed/aborted and zero compared fail. A proven base gap absent from the reference can be 3 only without another failure (S:337–375; C:82; P:92). All not_listed/empty with zero compared is still 1, so read the zero-compared exception before the table's 0 column.
- **Usage:** remains 2 (CLI:181, CLI:199–204; TC:57).

Do not confuse “unavailable fill” with a base source 404 or with a missing unmarked fill. Mixed failure/incomplete tests must cover both base and fill paths (C:133, C:140; P:131, P:136).

## 6. Tests — amendment covered on paper, additions needed

Every explicit item in C:155 has a named proposed home in P:110–143. Coverage mapping:

| Amendment requirement | Plan test numbers / anchors |
|---|---|
| Seven rules/exact text, first-rule order, count and structural failures, structural-after-quarantine, duplicate-after-quarantine | 3–6 (P:112–115) |
| Cap 10/11, split 6+5, over-cap no-fill daily, empty with records | 7, 10, 23, 9 (P:116, P:119, P:132, P:118) |
| Gap fill, mismatch beyond holes, valid/quarantine both ways, double quarantine | 12–15 (P:121–124) |
| Unavailable marker/no exit 3/no listing, asymmetric 404, missing unmarked fill, multiple fill versions outrank missing | 16, 18, 19, 21, 22 (P:125–131) |
| Monthly cache hit, own split days, no 2026-10 fills, selection/enumeration/warm determinism, first base source | 17, 24, 27, 25, 26 (P:126, P:133–136) |
| Deleted referenced ZIP/tampered fields, compare match/mismatch, old schema rejection, value-free holdout diagnostics | 31, 32, 2, 29 (P:140–141, P:111, P:138) |

This is **plan coverage, not passing tests**. Baseline tests confirm relevant seams: parser assertions TV:103 and TV:126, store provenance TS:72, deterministic builds TS:104, corruption TS:133, guard abort TS:270/TS:280, and CLI exit/network tests TC:57, TC:68, TC:89, TC:157. The new suite does not exist at the reviewed revision (P:157–169).

Add or clarify these cases before calling the testing plan complete:

1. **Present fill parse/CRC/cap failure plus another unmarked missing fill**, both enumeration orders; the result must be failed, never missing. Current proposed test 22 covers versions/integrity, and 23 over-cap in isolation, not their parse+missing combination (P:131–132; P:29).
2. **Verify's inferred unavailable days** with all section-2 edge cases, including 2026-10 exclusion and empty-unit scope; tampered cross-field consistency under B (P:140–143; P:200).
3. **Download transport matrix:** CHECKSUM 200/cache miss gets ZIP; CHECKSUM 200/cache hit parses monthly; CHECKSUM 404 probes ZIP; both asymmetric cases fail; missing fill markers do not skip required re-probes. Existing sparse CLI fixtures return 404 for unpublished fills (TC:31, TC:70–84); warm rerun assertions must filter base requests, not forbid all ZIP requests globally (P:152).
4. **Summary accounting and precedence:** monthly parse failure on fresh and cached bytes; fill-only failure with all bases successful; mixed base gap and fill failure (CLI:147–166; P:79, P:205).
5. **Memory/guard sequencing:** deterministic injected guard trip before and after parse/merge; propagation as run-abort rather than ordinary unit failure; failure-path cache pruning across successive units; retain only the shared monthly parse across the split (S:210, S:223–244; P:139, P:171).
6. **Complete merge matrix** should explicitly include absent/quarantined and valid/absent, beyond named quarantine/absent, plus all-quarantined monthly input with a conflicting present daily (C:139; P:124, P:118). Test unchanged monthly-overlap values with differing ignored field/CSV spelling if needed to distinguish parsed equality from byte equality (C:139).
7. **Holdout output tests** should cover all commands, including download monthly parse/cap failure; no fixture sentinel values should leak from public diagnostics (C:144; P:37, P:138).

No required behavior is inherently untestable. Deterministic unit tests cannot prove production peak RSS/flatness; that requires the later constrained measurement run (C:44, C:145). The internal guard test seam does not need a new CLI flag (CLI:182–187).

## 7. Later rerun — accept conditional counts; tighten procedure

**Counts:** 323 regression units and 329 total entries are arithmetically consistent with the plan's claimed stopped 328-entry baseline: remove the four SOL/XRP month entries plus HYPE May from regression, leaving 323; add the previously failed XRP November entry to reach 329 (P:191; C:149–152). Independently, the base plan has 62 units per symbol (TV:153); five full-history symbols contribute 310, and HYPE from May 2025 through October 2026 contributes 19 including the October 2025 split, giving 329 under the expected availability. Actual stopped-manifest membership/hash and successful rerun counts are **not verified**. Compare exact unit keys, not just totals; verify the backup hash before any cleanup (P:5, P:191).

**Expected outcomes:** retain the SOL/XRP fill days and resulting boundaries, the two XRP November quarantine records and required daily, HYPE's unavailable days and unchanged first time, and exact snapshot/entry regression for all others (C:149–152). XRP November's other missing minutes are explicitly **not verified** by the contract (C:150). Add an explicit stop/report for any additional missing minute or fill day there, including the suffix after 2023-11-30T12:35Z; do not infer the stopped parser inspected that suffix. This makes P:190 operational without misrepresenting the expected outcome as a complete prior measurement.

**Stop rules:** P:186–193 is strong: failed steps, changed rebuild manifest, unexpected availability/first source, parser/cap/agreement conflicts and unexpected changed units stop publication. Add explicit checking of step 3's exit status, not only its counts/hash. Require the expected per-unit quarantine/fill sets and regression keys as well as totals. Quarantine/unavailable days are not automatic stops by themselves, but newly unexpected ones still trigger the expected-outcome stop (P:190 versus P:193).

**Clean-store list:** P:177 matches default paths from CLI:43–44 and the actual ZIP/CHECKSUM/404 layout in S:56–86, snapshot temp naming in S:32, and manifest temp/lock names in S:157, S:164. Inventory exact own artifacts and sizes before deletion; include checksum-only crash remnants and temp files, plus all base/fill 404 markers. Confirm resolved paths are inside the intended clone, no symlink/path escape or concurrent writer, and preserve the verified outside-repo backup. A lock is not permission to delete an active writer's lock: C:35 and S:167–174 require checking ownership/state. Delete only the inventoried owned outputs, not tracked data or unrelated caches. Then verify the paths are actually clean as well as clean tracked status; `git status` alone cannot prove ignored outputs are gone (P:177).

**Execution envelope:** P:179–184 specifies time/maxRSS and the built-in ceiling but omits the task-required 1 GiB / 50% CPU cgroup wrapper. Add that wrapper to every later heavy step, with code/runtime hash identity checked before starting. Record per-step wall time/maxRSS and flatness across successive units (C:44, C:145), plus final ZIP/snapshot disk usage (C:68). Do not start that rerun before the review gate at P:173. This review runs none of it and changes no watcher, cron, timer or runtime.

## 8. Memory and guard placement — changes required

The broad streaming design is good: download parses one monthly at a time; build retains one monthly and one fill daily plus staged accepted output (P:39, P:98–100; C:145). The memory estimates are not measured proof (P:102).

Concrete corrections:

- **Pre-prune cache, including exception paths.** S:224 filters only after buildUnit returns; the previous unit remains during next-unit parsing/merge, and an exception skips filtering entirely (S:242). This contradicts the claimed current-unit-only peak and can retain partial parses through successive failures. Move selection of reusable keys before the next unit; clean up even on failed parses (P:39; C:145).
- **Check around, not only before.** P:39 lists before-parse/load/assembly checks. Add post-parse and post-merge checks while their allocations are live, and before snapshot encoding/publication, including unchanged/empty paths. S:235's existing write check is only on the newly built branch; unchanged writeOnce at S:228 bypasses it. The timer in CLI:51 cannot sample during synchronous inflate/parse/merge; final maxRSS failure at CLI:197 may occur after publication (V:42, V:104; S:250). A run-abort check must propagate via the guard-marked mechanism S:210/S:243.
- **Bound staged fill storage honestly.** “minutes × 80 B” in P:100 is column payload, not a bound for JavaScript row objects, indexes, range records or retained buffers. Use typed storage or measure/document overhead; no retained references to every parsed daily (P:27; C:145). Releasing references does not promise immediate RSS reclamation.
- **Test download guard boundaries.** Reject P:171/P:209's claim that the only alternative widens the CLI interface. CLI:182 already has dependency injection; a private worker/guard factory seam is enough. Verify an injected guard failure aborts further requests, rather than being swallowed by the per-source catch at CLI:154.
- **Measure the final system.** Parsing allocates columns before row validation (V:115), quarantine slicing can temporarily duplicate buffers (P:13), and network buffering has chunks plus a concatenated buffer (CLI:83–90). The existing 64 MiB inflated-file cap and 512 MiB guard remain, but tiny real-file estimates cannot establish worst-case RSS. Peak and successive-unit flatness remain **not verified** until the constrained rerun (C:44; P:102).

## Assessment of the first review, after the independent review

### A — Agree, with a contract precision note

A present fill parse/CRC/cap failure should outrank a different missing fill. P:29 parses bases before its missing step, but verifies only fill hashes before deciding missing; parsing is deferred to P:27. C:140 explicitly names multi-version/readVerifiedSource errors, whereas broader failure precedence and validation obligations are C:133 and C:139. Thus this is not a claim that the literal F5 sentence itself names parsing. Fix the inconsistent combined behavior and test both enumeration orders. A streamed validation/staging pass is acceptable; no need to retain every daily parse or publish partial output (C:145).

### B — Agree as inexpensive strengthening, not a full integrity proof

For successfully built entries, these are true consequences of C:139–141 and worth validating in checkEntry beyond P:64–66:

- Every quarantined openTime is inside missingRanges: a valid counterpart would have failed the unit.
- Every filled minute's day has its canonical daily in sources; apply only to monthly-base entries.
- Every daily source of a monthly entry is on a day touching missingRanges or filledRanges, including a daily that contributes no minute.

Use interval/day operations rather than materializing every minute. Also validate missingRanges' order, bounds, alignment and totals before relying on them; current S:139 is only a syntactic check. These checks do not prove that arbitrary plausible metadata describes the actual source rows; compare is still needed (C:143; S:364). The third invariant must not reject the 2026-10 base dailies (C:136).

### C — Agree

Both qualifications are essential. Restrict to monthly-base entries and use end-exclusive day intersection; otherwise daily-base gaps or midnight ends create invented fills (C:136; P:200; V:196–202). Section 2 gives the precise rule and additional scope limitations.

### D — Partly agree

Agree that P:205 breaks the prior **terminal partition** `expected = verified + gaps + notListed + failed`. Disagree if “base counts are a partition” means summing all seven fields: downloaded/skipped and verified already overlap (CLI:147, CLI:153; TC:75, TC:83). The contract fixes status semantics, not a prohibition on overlapping diagnostic counts (C:63, C:137). Require explicit transport-versus-terminal accounting and tests; do not describe this as unchanged base-count semantics.

### E — Agree

P:23's “zip only after a CHECKSUM 404” is false for the normal uncached success path. CLI:150 fetches it after CHECKSUM 200; CLI:142–148 is the cache exception. Rewrite: CHECKSUM first; after 404 probe ZIP to distinguish paired/asymmetric absence; after 200 use a verified matching local ZIP or fetch and verify it. This also applies to fill fetches under C:137.

### F — Agree as a conservative rerun gate

C:150 explicitly leaves other missing minutes unverified, and the previous parser throws at the first value-rule failure (V:143–151); reaching one bad row is not proof about later rows. Treat any extra missing minute or fill day in XRP November as stop/report, not automatic acceptance or a reason to alter expected data. P:190 implies a broad deviation stop but should name this uncertainty. The actual post-failure suffix and stopped build log are **not verified** here.

## Must-fix

1. Correct F2 transport wording and require aggregate exit 1 for fill-only failure (P:23, P:79; CLI:150, CLI:166).
2. Validate present fill parsing/CRC/cap before returning missing; add the mixed-state tests (P:27–29; C:133, C:139).
3. Correct cache pruning/lifetime and guard placement/propagation; add deterministic download guard coverage (S:210–244; P:39, P:171; C:145).
4. Specify monthly-only, half-open, entry-state inference for verify; resolve missing/empty report scope and test the derivation (P:200; C:130, C:133, C:136).
5. Make deviation 3's counter semantics explicit, including fresh/cache parse failure and fill-only failure (P:205; CLI:120–166).
6. Make the later rerun's unknown XRP suffix an explicit stop, verify the baseline before cleanup, and include the constrained execution envelope and step-3 exit check (C:150; P:177–191).

## Should-fix

- Add B's cross-field invariants and missingRanges structural consistency checks; keep compare as the source-derived authority (S:139; C:143).
- Clarify counts.sources occurrence-versus-unique meaning, preserve no-built-unit firstSourceFile behavior, and label unavailable-at-build versus live availability (P:83; S:275; C:141).
- Make every merge truth-table branch, no-value diagnostic path, and late-daily conflict scenario explicit in tests; correct the latter diagnostic citation (P:118, P:124, P:138, P:213; S:232).
- Separate typed-array payload estimates from total RSS and record successive-unit flatness plus disk totals (P:100; C:44, C:68).
- Resolve the glossary homonym in a separate authorized docs change, not in this review (P:212; `docs/ubiquitous-language.md:144`).

## Accepted as is

- Fixed quarantine rules/order, fatal structural/count checks, dense columns, full-file cap, source-row records and post-merge coverage (P:11–17; C:129–132).
- Monthly-local fill discovery, split-unit isolation, no daily recursion, full-day parsed-value agreement and complete present-source provenance (P:21, P:27, P:31; C:136, C:139–141).
- Base-only listing/first-file behavior, unchanged snapshot format and reader, and value-free integrity reporting (P:25, P:33, P:37; C:138, C:142, C:144).
- Verify's passed-source set instead of redundant hashing, compare's full-entry equality, rejection of the old manifest key set, and no automatic version selection (P:31, P:35, P:206; S:230–233, S:364).
- Deviations 1, 2, 4, 5 and the explicitly named F1a-2 test edits; the conditional 323/329 arithmetic and clean-store/review-before-rerun principle (P:191, P:203–208; C:67, C:155).
