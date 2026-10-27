# RALPH findings: error classes and rules

Read before every prompt, plan or run. One entry per error class: what happened (date, where), the rule that prevents it. Add an entry when a class repeats or costs a run; never delete one (mark it superseded). Size cap 8,000 bytes (`tools/docs-budget/docs-budget.test.mjs`); when full, merge entries instead of dropping them.

## Checks and output parsing

- **F01 Output format assumed, not tested** (class A, 3x on 2026-10-22). Runner v1 grepped TAP "# tests" while Node 24 without a TTY prints the spec reporter; a prompt expected result lines to start with RESULT, but they start with a UTC timestamp; an IPv6 pattern matched HH:MM: in every timestamp. Rule: every check that reads program output is tested by Claude on a real sample from the target machine and version and handed over as an exact command; agents run it unchanged and never write their own replacement (R7, decision 43). Parse `node --test` only with `--test-reporter=tap`. Test VPS scripts on the VPS Node version.
- **F02 Read-only prompt with a costly command** (2026-10-23). `openclaw memory status --index` rebuilds the index and can call a paid embedding provider. Rule: read-only prompts contain only commands known to be read-only; a failed point stops only that point.
- **F03 Old reply mistaken for a hung job** (2026-10-22). Rule: every status prompt prints `date -u` first.

## Prompts and delivery

- **F04 Length limit as a failure criterion** (2026-10-20). A 9,000-character cap made the VPS agent stop under the failure rule. Rule: write "Length is not a failure criterion."
- **F05 Text copied from a rendered .md preview** (2026-10-22). Line breaks, backticks and text in angle brackets were lost, so a script hash could not match. Rule: deliver code and exact text as downloaded files with a sha256 check, or as short plain chat code blocks.
- **F06 Second-opinion scope** (2026-10-21). The VPS agent applied its own VPS rules (cgroup, runtime identity) to PC steps under review. Rule: second-opinion prompts say that R1-R6 govern the agent's own VPS actions only.
- **F07 Prompt contradicts itself** (2026-10-21, F1a-2 round 2). "Never turn a gap into not_listed" conflicted with shared evidence outside the selection; Claude Code stopped correctly. Rule: before sending, check every absolute sentence against the rest of the prompt.

## Claims and memory

- **F08 Taken-over text stated as fact** (2026-10-22). Claude wrote data start dates and installed tools as facts that came only from a continuation prompt. Rule: nothing is confirmed without Claude's own test; label every claim tested / taken over / reasoning.
- **F09 Several memories, none current** (2026-10-23). Vault (2026-10-04), docs (2026-10-20), a private continuation prompt and OpenClaw memory disagreed; the old read order loaded ~81 KB of pre-F1 routing and never reached F1. Rule: `docs/MAP.md` first, size-capped; repo files are the source of truth (decision 45).
- **F10 Agent memory stopped filling** (2026-10-18 onward; reasoning, not tested). Strict read-only or "commit only X" prompts after /new leave the VPS agent no room for its daily memory notes. Open: ledger I81.

## Review and scope

- **F11 Review rounds on edge cases** (class B, F1a-2, 8 Codex rounds). Most rounds were about hand-edited or corrupted manifests and an information-only symbol. Rule: at most 3 rounds per PR, then only P0/P1; the rest goes to the ledger (decisions 36, 42).
- **F12 Join-based key comparison** (2026-10-21, Codex P1). `keys.join(',')` accepted a merged key "exchange,market". Rule: compare object keys element-wise with one exact helper (F1a-2 round 8).

## Code and environment

- **F13 Shell rule not enforced** (2026-10-20/21). Claude Code used heredocs, `$(...)` and `;` chains despite CLAUDE.md. Rule: permissions, not prose, enforce it; reviewers check the commands used.
- **F14 "TDD:" parsed as a git trailer** (2026-10-21). Rule: commit bodies use "TDD evidence:".
- **F15 Environment leaks** (2026-10-22). Journal short-iso lines contain the host name (field 2); the F1a-2 compare writes ~1.1 GB to `os.tmpdir()`, which follows TMPDIR. Rule: strip field 2 before committing journal lines; set TMPDIR on disk and refuse tmpfs.
- **F16 Watchdog inside the watched cgroup** (2026-10-22, design note, not observed). The memory stop rule ran inside the job's own cgroup, so a cgroup stall would stall it too. Rule: future runners put the watchdog outside.
