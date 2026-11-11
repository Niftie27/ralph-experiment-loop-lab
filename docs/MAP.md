# RALPH map (read this first)

Updated: 2026-11-11 (lookback 3; OI checker live). Size cap 3,500 bytes, checked by `tools/docs-budget/docs-budget.test.mjs`. If the phase below is no longer current, this file is stale: say so before you act.

## What RALPH is now

Research and paper only; nothing trades. Main line = the backtesting factory F1 (`docs/factory-spec-f1.md`, approved 2026-10-18). VPS production (collectors BTC/ETH/SOL/HYPE, v1 alerts, short watchers, archive, data checks) keeps running and is not the main line.

## Where F1 is

- F1a-1 data identity: DONE (merge 7d73008).
- F1a-2 Vision 1m klines + manifest: DONE (merge 6ebaa26; VPS reproduction `docs/f1/vps-compare-2026-10-22/`).
- F1a-3 aggregation 1m to 5m-1w: DONE (merge a474890; report `docs/f1/f1a-3-aggregation.md`). Vision's own files disagree in a few bars: `docs/f1/f1a-3-e1.csv`, `docs/f1/f1a-3-e2.csv`.
- F1a-4 funding: DONE (merge 772e937; report `docs/f1/f1a-4-funding.md`). Holdout: availability and CHECKSUM only; its one integrity run is the m4 step before F1c (decision 60). Next: the F1b protocol plan; gates before F1b and F1c: decision 57.
- Side line, at most 1/3 of Claude (decision 53): data gate (ledger I98, I99); OI checker live 2026-11-11 (58 (1)); next PR #9 with 0b (58 (2)). Last deep reassess 2026-11-09 (decisions 52-59).
- Due (UTC; decision 64; check at every session start): V6 evaluation after 2026-11-15; PR #9 with 0b by 2026-11-22; deep reassess by 2026-11-23; F1b at 1.5x of its estimate (set with its plan). Parking the open phase or starting a later gate needs a decision row.
- No hypothesis has been tested in F1 yet.

## For job X read Y

| Job | Read |
|---|---|
| Any job | this file, `docs/findings.md` |
| Plan an F1 phase | `docs/factory-spec-f1.md`, `docs/decisions.md` (rows from 2026-10-18), `docs/ledger.md` I59 and I75, the newest files in `docs/f1/` |
| F1 code | `experiments/strategy-destruction-filter/AGENTS.md`, the phase contract in `docs/f1/`, `docs/ubiquitous-language.md` |
| Data questions | `docs/data-catalog.md` (large: read only the section you need) |
| What runs on the VPS | `docs/state.md` |
| Ideas and open threads | `docs/ledger.md` |
| Outside sources | `docs/research/sources.md` |
| Pre-F1 research | archive (see below); only when a job names it |

Archive from before the F1 decision (kept, not current): `wiki/`, `raw/`, `core/`, `loops/`, `index.yaml`, `index.md`, `rules.md`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`.

## Standing process

- Every F1 phase plan from F1a-3 on: prior-art step (decision 37), hours estimate in wall clock from git that lists the review steps (decisions 44, 46, 63), at most 3 Codex review rounds per PR and 3 second-opinion rounds per spec (decisions 42, 65).
- Light lookback after every F1 phase. Checklist: does the work move the main line (an edge found or hypotheses killed); repeated finding classes (`docs/findings.md`); wall-clock hours vs estimate, split at git commits (decision 63); prior-art step done; this file current. Output = decisions and ledger items only. Deep reassess at the end of F1a and F1b, at the latest every 14 days; extra lookback on a surprise (decision 39).
- Nothing counts as confirmed without a test. Label claims: tested (how, how many), taken over (from where), reasoning.
- Repo files are the one source of truth; Obsidian is only a viewer (decision 45). Public repo: no hosts, user names, IPs, chat ids or home paths.
