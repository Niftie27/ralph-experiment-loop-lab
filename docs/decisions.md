# Project decisions

Dates are UTC. One row per decision. Seed = Tomas’s L1a instruction (2026-10-18); all 22 supplied decisions are preserved. Where a dated source contradicts a seed date, the source date wins. Historical dates not corroborated by a log are explicitly marked below. Sources are sanitized file references; workspace-only sources are not implied to be tracked in this public repo.

| Date (UTC) | Decision | Who | Why | Replaces | Source |
|---|---|---|---|---|---|
| 2026-10-10 | Keep raw 7 days; delete only after verified archive. Enabled 2026-10-17 in `8ed0178`. | Tomas | Disk | Earlier no automatic raw deletion | Seed; [S1] 2026-10-10 16:45–16:48; [S2] RET1 2026-10-17 23:08:58 |
| 2026-10-15 | Disable 5 research cron jobs. | Tomas | gpt-5.5 errors | — | Seed; historical decision date not independently verified; old-model errors remain in cron run metadata |
| 2026-10-17 | V6 forward window 2026-10-14T00:00Z to 2026-11-15T00:00Z (exclusive end); one evaluation after 2026-11-15T00:00Z; no interim looks or rule changes. | Tomas | Unbiased test | Preregistration `341d864` is the governing record, not a replaced decision | [S3] registered 2026-10-17T06:36:06Z; commit timestamp agrees. Corrects seed date 2026-10-16 |
| 2026-10-16 | OpenClaw 2026.10.3; openai/gpt-6-astra via ChatGPT OAuth; no API-key fallback. | Tomas | Old model unsupported | OpenClaw 2026.6.6 + gpt-5.5 | Seed; historical decision date not independently verified; installed version checked live in [state](state.md) |
| 2026-10-16 | Heartbeat and skill review off by config. | Tomas | Prompt collisions, quota | — | Seed; disabled state checked live; historical decision date not independently verified |
| 2026-10-16 | Use 2 GiB swapfile. | Tomas | RAM pressure | — | Seed; 2 GiB swap checked live; historical decision date not independently verified |
| 2026-10-17 | Pause memory vector index. | Tomas | Paid embeddings | — | Seed; historical decision date not independently verified |
| 2026-10-17 | Do not download missing aggTrades days now. | Tomas | Needed only for tick strategies | — | Seed; historical decision date not independently verified |
| 2026-10-17 | No Hermes now; A/B test later. | Tomas | No proven benefit | — | Seed; historical decision date not independently verified |
| 2026-10-18 | Re-enable 4 research cron jobs; keep state-of-edge off until after 2026-11-15. | Tomas | V6; state-of-edge exposes aggregate shadow PnL | 2026-10-15 five-job disablement (four jobs only) | Seed; current 4 enabled / 7 disabled state checked live through OpenClaw DB-backed CLI |
| 2026-10-18 | D102/D106/D109 are research data; inspect schema/structure only, no outcomes. | Tomas | V6 | Personal classification | Seed; [S4] D102/D106/D109 entry |
| 2026-10-18 | For a new tool, read docs first, then find connection options: MCP, API/SDK, CLI, webhook. | Tomas | Do not confuse missing MCP with unavailable tool | MCP-only check | Seed; no independent action-log source found |
| 2026-10-18 | Ledger IDs never change; assign new items the next free ID. | Tomas | Prevent ID collisions | — | Seed; no independent action-log source found |
| 2026-10-10 | Run hourly-row data checks daily at 00:20 UTC. | Tomas | Keep completeness checks automated | Manual-only checks | [S1] 16:39–16:41 entries; installed timer still agrees |
| 2026-10-11 | Enable hourly archive upload at :40 only after first-upload success, zero FAIL rows and latency proof. | Tomas | Verified archive without degrading collectors | Manual archive upload | [S5] step 6; [S2] 17:30 enablement; [S6] |
| 2026-10-11 | Retention requires matching archive PASS/local SHA, fresh remote SHA before deletion, deletion audit, and `.jsonl.xz` raw only. | Tomas | Fail closed on unverified archive or wrong raw format | Weaker archive-verification-marker gate | [S2] 17:54–20:57 entries, commits `cc0e7a2` / `27c68e0`; retained by `8ed0178` |
| 2026-10-17 | H3a batch: no automatic restart/retry; on OOM stop, do not raise MemoryMax. | H3a operating contract | Bounded research resource use | — | [S7] runtime/stop policy (does not authorize new work) |
| 2026-10-18 | Preserve byte-identical source mirrors; do not claim a sanitized substitute is R2-equal. | D1b implementation record | Honest source provenance and privacy | — | [S4] mirror/exclusion entry; two public-API exclusions later identified as mistaken by Tomas in L1a |
| 2026-10-18 | Strategy factory comes right after L1: harness I05 (H3b/H3c) extended with ledger items I48, I49 and I51. | Tomas | Priority | — | Seed (Tomas, L1b) |
| 2026-10-18 | Adversarial loop runs V6-blind (skips state-of-edge, shadow-PnL and watch-row inputs) until Tomas switches it off after the V6 evaluation | Tomas | V6: no interim looks | — | Tomas, P1 |
| 2026-10-18 | F1 D1: harness default Binance USD-M futures; spot is a pre-defined comparison; costs 5 + 3 bps per side, every report also at 2x costs; spot trials carry over into the trial count | Tomas | match collectors and venue | spot 4h, 4 + 3 bps | spec F1 v2 |
| 2026-10-18 | F1 D2: core BTC, ETH, SOL; cross-check XRP, DOGE; HYPE information only (insufficient_history) | Tomas | history length, overfit check | BTC/SOL only | spec F1 v2 |
| 2026-10-18 | F1 D3: walk-forward 12/3/3 with locked protocol; expanding window as the one locked sensitivity; holdout candidate = procedure's pick on the last 12 research months | Tomas | test the selection procedure | 5 diagnostic folds | spec F1 v2 |
| 2026-10-18 | F1 D4: pass bar DSR >= 0.95 on effective N from daily equity returns, fixed before F1b; economic gates stay; false-pass rate <= 5 % on null campaigns | Tomas | multiple testing | deflated-Sharpe proxy | spec F1 v2 |
| 2026-10-18 | F1 D5: H3c pilot 2 specs/day, <= 20 variants/spec, <= 40/day for 3 weeks, weekly review by Tomas; then a monthly trial budget set after F1b | Tomas | statistical budget, not quota | — | spec F1 v2 |
| 2026-10-18 | F1 D6: NautilusTrader on the PC as a batch worker on hash-verified snapshots; purpose = parity with live code | Tomas | VPS RAM | — | spec F1 v2 |
| 2026-10-18 | F1 D7: holdout only for frozen candidates after the F1c guard; I08 A and B recomputed on futures research data first; C forward only; min trades + Bonferroni; look budget 5; data after 2026-10-17 sealed as the next test period | Tomas | protect the holdout | H2 guard only | spec F1 v2 |

## Sources

- Seed: Tomas’s Task L1a (retry), 2026-10-18. User-supplied historical decisions are recorded as instructions, not retroactively verified facts.
- [S1] Local workspace `~/.openclaw/workspace/continuation-prompts/2026-10-10-1547-ralph-storage-maintenance-latency-handoff.md`, dated entries in Resume progress.
- [S2] Local workspace `~/.openclaw/workspace/continuation-prompts/2026-10-10-0623-ralph-trade-time-rebuild-action-log.md`, dated action entries and RET1 section.
- [S3] [V6 preregistration](prereg-velocity-forward-2026-10.md), header registration timestamp and rules 1/10; `git show -s --format='%h %aI %s' 341d864`.
- [S4] [D1b action log](d1b-action-log.md), 2026-10-18. Also [data catalog mirror manifest](data-catalog.md#downstream-source-mirror-verification-d1b).
- [S5] Local workspace `~/.openclaw/workspace/continuation-prompts/2026-10-11-1711-step5c-archive-timer.md`, user’s step 6 enablement gate.
- [S6] [Archive upload proof](archive-upload-proof-2026-10-11.md).
- [S7] [H3a action log](../experiments/strategy-destruction-filter/results/h3a-action-log.md), 2026-10-17 runtime/stop policy. Outcome results were not used to alter V6.

## Unresolved

- No independent dated handoff/action-log corroboration was found for the seed rows marked unverified. Their dates remain Tomas’s supplied dates, not guesses.
- This is a sourced operational seed (22 supplied + 5 found), not an exhaustive historical decision archive. Ledger items belong to part B.
