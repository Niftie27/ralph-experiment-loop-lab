import sys
src=open(sys.argv[1],encoding='utf-8').read()  # usage: python3 make_v6.py <spec-v5> (writes m9-gate-spec-v6.txt in cwd)
E=[
("m9 (c) gate spec v5, 2026-10-29 (research only). Replaces v4 (sha256",
 "m9 (c) gate spec v6, 2026-10-30 (research only). Replaces v5 (sha256 5e8ce1e4032d92ba7fffc613beea5e63180c42281f75e7b422b9667b24edec8b), v4 (sha256"),
("Save this document unchanged as ~/m9-gate-spec-v5-2026-10-29.txt (if that file exists, do not overwrite it: stop and say so), then run `sha256sum ~/m9-gate-spec-v5-2026-10-29.txt`",
 "Save this document unchanged as ~/m9-gate-spec-v6-2026-10-30.txt (if that file exists, do not overwrite it: stop and say so), then run `sha256sum ~/m9-gate-spec-v6-2026-10-30.txt`"),
("or invalid UTF-8 leaves the freeze unresolved. Then list every remaining symbol prefix, all pages.",
 "or invalid UTF-8 leaves the freeze unresolved; so does a symbol equal to \".\" or \"..\" (a URL parser removes it as a dot segment). Then list every remaining symbol prefix, all pages. Pagination caps: at most 30 pages for the root listing and at most 5 pages per symbol listing; a listing still truncated at its cap, or a truncated page without NextMarker, leaves the freeze unresolved (F1)."),
("The exact listing endpoint, its query encoding and this download encoding are fixed and tested on real keys in the run document (R7).",
 "Listing request (anonymous ListObjects v1, tested on the 4a outputs): GET https://s3-ap-northeast-1.amazonaws.com/data.binance.vision?delimiter=%2F&prefix=<P>, followed by &marker=<M> on every page after the first, where <P> is the listing prefix and <M> the NextMarker of the previous page, each with every byte outside A-Z, a-z, 0-9, \"-\", \".\", \"_\" and \"~\" percent-encoded as %XX (uppercase hex, UTF-8 bytes; \"/\" becomes %2F), and no other parameter (no max-keys). The run document tests the listing and download encodings again on real keys (R7)."),
("(archive) the bytes end with a ZIP end record, single disk, no zip64, and the central directory sits directly before the end record and is well formed;",
 "(archive) the bytes end with a ZIP end record (a trailing archive comment of the declared length is allowed), single disk (both disk numbers 0, entries on this disk equal to the total, disk number start 0 in every central record), no zip64 (no 0xFFFF entry count, no 0xFFFFFFFF central directory size or offset, no 0xFFFFFFFF compressed size, uncompressed size or local header offset in a central record), and the central directory sits directly before the end record and consists of exactly as many well-formed central records as the end record states, with no other bytes;"),
("exactly one entry, named as the zip basename with .zip replaced by .csv, general-purpose flags 0,",
 "exactly one entry, named, as exact UTF-8 bytes, as the zip basename with .zip replaced by .csv, general-purpose flags exactly 0, or exactly 0x0800 (bit 11) only if the name contains a byte above 0x7F,"),
("Archive, member and crc accept the variant readZipMember in the same file at c33f9c7 accepts.",
 "Archive, member and crc accept the variant readZipMember in the same file at c33f9c7 accepts, with these stated deviations: the member name is compared as exact UTF-8 bytes (readZipMember compares a latin1 decoding and so rejects every non-ASCII name); flags 0x0800 is accepted for a non-ASCII name (readZipMember accepts only 0; a real 2025-10 zip of a non-ASCII symbol has 0x0800 in both headers, probe 2026-10-30); a disk number start other than 0 and zip64 markers in a central record fail archive (readZipMember does not check the disk number start and reports zip64 sizes after the name check). vision-source.mjs is never changed."),
("The third field must be present; its value",
 "The third field must be present (an empty third field is present); its value"),
("first_pass:<status> and then final:<status> for the statuses verified_nonempty, verified_empty, not_verified and excluded:<check> for each check name in this order: missing_checksum, checksum, hash, archive, member, crc, routing, framing, fields, month, order, hour, interval; rows_o0;",
 "first_pass:<status> for each status in the order verified_nonempty, verified_empty, not_verified and excluded:<check> for each check name in this order: missing_checksum, checksum, hash, archive, member, crc, routing, framing, fields, month, order, hour, interval, then final:<status> for each status in the same order; rows_o0;"),
("runs_entry:<era>:<status> for each era and D2 entry status (left_censored_segment, left_censored_window, observed), era of the first row; runs_exit:<era>:<status> for each era and D2 exit status (observed, right_censored_seal, right_censored_segment), era of the last row;",
 "runs_entry:<era>:<status> era-major (era1, era2, era3; within an era the D2 entry statuses left_censored_segment, left_censored_window, observed), era of the run's first row; runs_exit:<era>:<status> era-major (within an era the D2 exit statuses observed, right_censored_seal, right_censored_segment), era of the run's last row;"),
("O6 does not contain its own hash.",
 "O6 does not contain its own hash. On the F1 branch O6 contains, in this order, only listing_pages, prefixes_received, the six dropped lines, symbols_listed, symbols_with_keys, noncanonical_names and keys_frozen (0 or false where the freeze did not reach them), then the node line and the module lines."),
("E1 counts eligible pairs by the mutually exclusive tuple",
 "Pin check: before any network request the script compares the Node version and the seven file hashes with E1; any difference is a preflight rejection (F6): no request, no import, no result. Immediately before the import it hashes the seven files again; any difference invalidates the run (F5) and nothing is imported. The script-stage O13 therefore never contains pin_mismatch; Claude's own pin check against the O6 lines in E2 stays. E1 counts eligible pairs by the mutually exclusive tuple"),
("hitting any bound is a resource abort, not an exclusion.",
 "hitting any bound is a resource abort, not an exclusion. The sidecar size bound applies to HTTP 200 bodies only; a non-200 body is discarded unread under a separate error-body bound that the run document freezes after probing one real 404 body. Lines at or after the seal count toward the line bounds and every 2025-10 file is under the zip and member bounds, so a resource abort while a 2025-10 file is processed records the single reason resource_2025_10, never the bound that was hit."),
("From v1 (kept in v2 to v5):","From v1 (kept in v2 to v6):"),
("\nNext: Tomas approves (question tool);",
 "\nFrom v5 (source: Claude's review in sessions 49 to 54: cloud review items R1-01 to R1-23, the bit-11 probe of 2026-10-30, own tests r, r2, r3, the strict mock from the 4a pages and fixture mutations; and Tomas's decision of 2026-10-30):\n"
 "C34 Bit 11 and Tomas: flags 0x0800 only for a non-ASCII member name, local flags equal central flags; vision-source.mjs untouched (I1).\n"
 "C35 Stated readZipMember deviations: exact UTF-8 name bytes; disk number start 0 and zip64 central markers under archive (N5: the scan already reports a nonzero disk number start as archive); an archive comment stays allowed (I1).\n"
 "C36 N1: a symbol \".\" or \"..\" leaves the freeze unresolved (S1).\n"
 "C37 R1-12, R1-13 and G2: listing endpoint, query encoding (%2F, no max-keys) and pagination caps 30 and 5 fixed in the spec and tested on the 4a outputs; a cap reached while truncated, or a truncated page without NextMarker, leaves the freeze unresolved (S1, F1).\n"
 "C38 R1-11: pin check before any request, hashes again immediately before the import, never an import after a mismatch (E1).\n"
 "C39 N4 and R1-15: sidecar bound on HTTP 200 bodies only, error-body bound frozen by the run document after a real 404 probe; one generic abort reason for 2025-10 files (F6).\n"
 "C40 R1-09, R1-23, N2 and N3: O6 first_pass block before the final block, runs era-major, F1-branch O6 content (O6).\n"
 "C41 Empty third field counts as present (I2).\n"
 "Not changed: S3 (R1-10: the spec already gives available for the tested case; the scan's partial is an implementation error for the fix batch); U10 stays deferred.\n"
 "\nNext (v5 text replaced): Tomas approves (question tool);"),
]
s=src
for i,(o,n) in enumerate(E,1):
    c=s.count(o); assert c==1,(i,c,o[:60]); s=s.replace(o,n)
s=s.replace("Next (v5 text replaced): Tomas approves (question tool); a last short second opinion on the v5 changes (C29 to C33) by the VPS agent (a P1 stops; P2 and P3 findings are fixed by Claude without another review, decision of 2026-10-29); then the (4) document (script and fixtures by the VPS agent) and the run document, with commands tested by Claude (R7).",
 "Next: a second opinion on the v6 changes (C34 to C41) by the VPS agent with Claude's own tests (Tomas's decision of 2026-10-30); dispositions and approval by Tomas (question tool); then one fix batch for the scan (deviations, test gaps and surviving mutations) and the run document, with commands tested by Claude (R7).")
assert 'v5 text replaced' not in s
open('m9-gate-spec-v6.txt','w',encoding='utf-8',newline='\n').write(s)
print(len(E),'edits ok')
