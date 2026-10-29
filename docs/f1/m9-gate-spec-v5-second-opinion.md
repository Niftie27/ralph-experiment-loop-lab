# m9 gate spec v5 second opinion (VPS agent)

**tested — method:** Read v5 and v4 in full from `~/m9-gate-spec-v5-2026-10-29.txt` and `~/m9-gate-spec-v4-2026-10-29.txt`, compared their text with `diff -u`, read `docs/f1/m9-gate-spec-v4-second-opinion.md`, and inspected `parseChecksum`, lines 50–55 of `experiments/strategy-destruction-filter/src/vision-source.mjs`, with `git show` at `c33f9c7`. BLOCK 1 matched the expected spec hash, branch identity, clean main state and ancestry. Static reading is not execution of the gate or parser.

**taken over — scope:** The supplied review instruction limits this review to C29–C33 and their changed header, S1, O11 and E2 sentences. Tomas's decisions, C1–C28 and the G2/U9/U10 deferrals are taken over from v5 and the supplied instruction, not independently revalidated. No scan, source acquisition, F1 execution or protected invocation was performed. Actual archive contents and future implementation behavior are not verified.

## BLOCK 2

**tested — exact prescribed command output:**

```text
v24.22.0
25 U+0009 U+000A U+000B U+000C U+000D U+0020 U+00A0 U+1680 U+2000 U+2001 U+2002 U+2003 U+2004 U+2005 U+2006 U+2007 U+2008 U+2009 U+200A U+2028 U+2029 U+202F U+205F U+3000 U+FEFF
```

## Q1. Resolution

- **reasoning — C29 / A resolved:** S1 now rejects every whitespace code point matched by the pinned parser's filename pattern. The previously permitted whitespace-bearing basename counterexample is removed. See Q2.
- **reasoning — C30 / B resolved:** E2 requires the O4 status comparison only where the manifest has the row. When TREE has no frozen key, its selected absent keys are not_listed records, checked against O8, without requiring nonexistent O4 rows. See Q3.
- **reasoning — C31 / C resolved:** The F1 branch explicitly uses only O6, O13 and O11; the other E2 requirements do not apply. Their specified absence is not an implementation error. O11 now expressly hashes only O6 and O13 on that branch.
- **reasoning — C32 / G1 resolved:** O6 is an explicit input for its observed node/module identities, from which Claude reproduces the script-stage pin_mismatch reason against E1. Claude's separate pin check remains a final-stage observation, not a substitute for the VPS record.
- **reasoning — C33 / G3 resolved:** The nonexistent F23 reference is removed and replaced with the mutation requirement itself. Negative tests remain sandbox-only and do not decide the run outcome.

**reasoning — remaining findings:** None within the requested change scope. No outstanding gap is excluded from the verdict count. Review severities P1/P2/P3 are distinct from the spec's outcome labels; resolved items are not findings.

## Q2. C29 whitespace and sidecar grammar

**tested — whitespace enumeration:** BLOCK 2 ran on the expected Node v24.22.0 and enumerated all Unicode scalar values. Expanding S1's two ranges gives exactly the printed 25 code points: five in U+0009–U+000D, eleven in U+2000–U+200A, and the nine other listed values. There is no omission or addition.

**tested — source inspection:** The pinned function matches `^([0-9a-f]{64}) {2}([^\s]+)\n$`, without flags, requires a string, compares the captured filename exactly with `expectedZipName`, and returns the captured digest.

**reasoning — equivalence:** For every symbol prefix S1 allows, its canonical zip basename is nonempty and contains no JavaScript whitespace. The fixed suffix adds none. Thus the basename fits `[^\s]+`; its literal punctuation has no regex meaning because it is input, not interpolated pattern text. The digest, exactly two spaces, basename equality and terminal LF agree with I1. On the stipulated valid text/expected-basename input, I1's sidecar form and parseChecksum's acceptance coincide. This is a source-level deduction, not an additional parser experiment or a claim that real keys with unusual characters exist. URL transport remains the explicitly deferred G2 test.

## Q3. F07 changed-sentence audit against the whole spec

- **reasoning — header and C29–C33:** The v5 replacement/provenance text and change descriptions agree with the operative edits. The administrative next-step text retains the stated last-review policy. Historical C1–C28 entries describe their original changes rather than overriding v5's explicit refinements. No changed sentence requires reversing a recorded decision.
- **reasoning — S1 / C29:** The added whitespace rejection is a freeze-unresolved condition, not silent symbol filtering. It therefore agrees with S1's freeze rules, F1's stop branch and P0. It does not change exact-six exclusion, canonical key identity, byte ordering, URL encoding or the output field restrictions.
- **reasoning — not_listed / C30:** If TREE has other frozen months but the selected month is absent, O4 has that month's not_listed row and E2 compares it. If TREE has no frozen key at all, O4 has no TREE rows and the explicit exception applies. Both cases require the selected key to be absent from O8's frozen key list. O8's symbol list may still contain TREE when it has no canonical allowed-month key; E2 correctly tests key absence, not symbol absence. O7 still requires status-only records, no bytes and an empty fixture digest. Excluded/not_verified keys that are actually frozen retain the O4 comparison and cannot be reclassified as not_listed under this rule.
- **reasoning — F1 branch / C31:** E2's initial branch explicitly says nothing else in E2 applies. This scopes the later normal recomputation, fixture checks, pin checks and difference rule; it is not contradicted by their continued presence later in that paragraph. F1 requires exactly O6 items reached, O13 P0 freeze_unresolved and O11; O11's changed parenthesis lists exactly the two other files. The final P0 is consistent with the outcome policy. A completed freeze with zero keys is no_key, not automatically this branch. The exception excuses only the specified missing ordinary outputs, not corruption or incomplete writes of the three required files; F5 remains in force.
- **reasoning — normal E2 / C32:** Adding only O6's node/module lines as identity inputs resolves the missing-input issue without importing its derived counts as independent truth. The normal recomputation remains based on O0/O4/O8 for timing, statuses and frozen membership; the expected identities still come from E1. Partial O6 on the F1 branch is not demanded as a full pin record because that branch bypasses normal E2. O13's script stage and Claude's final-stage check remain distinct.
- **reasoning — mutation rule / C33:** The replacement specifies negative synthetic tests, not arbitrary edits that must all fail. Each chosen mutation must yield its expected first-failure exclusion under I1/I2. It neither exports rejected real files nor makes mutation results script-stage outcome reasons. Verified fixture parity and the restriction against decoding the third field remain unchanged. Constructing such tests and validating their implementation are later work, not verified here.

**reasoning — result:** Checking the changed sentences against Definitions, S, I, D, O, E, P, F and the change history identified no literal contradiction, outcome/recomputation defect or new unresolved input requirement in this scope.

## Q4. Leak paths

**reasoning — no newly permitted leak:** C29 narrows admissible names; C30 changes status comparisons, not byte eligibility; C31 restricts failure outputs to summary/status/hash artifacts; C32 adds identity metadata as an input; C33 confines mutations to Claude's sandbox. None authorizes emitting a sealed row, an excluded/not_verified file's row or an incomplete fetch body.

**taken over — safeguards from v5 I1/I2/O7:** Whole-file acceptance is required before rows can enter outputs; a later exclusion withholds earlier rows as well. October cannot supply fixture bytes, and a sealed routing token in an April–September file excludes that file. Raw fixtures require final verified status; rejected or absent selections are records only. I1 separately forbids incomplete-fetch bytes in every output. Whole-archive integrity processing is not permission to export sealed rows.

**reasoning — assurance boundary:** These are spec-level conclusions. The review neither tested runtime enforcement nor certified real archive data. Those limitations are not additional findings about C29–C33.

Verdict: no contradiction
