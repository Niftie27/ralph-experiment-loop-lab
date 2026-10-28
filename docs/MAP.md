# RALPH map (read this first)

Updated: 2026-10-28 (F1a-3, PR #3). Size cap 3,500 bytes, checked by `tools/docs-budget/docs-budget.test.mjs`. If the phase below is no longer current, this file is stale: say so before you act.

## What RALPH is now

Research and paper only; nothing trades. Main line = the backtesting factory F1 (`docs/factory-spec-f1.md`, approved 2026-10-18). VPS production (collectors BTC/ETH/SOL/HYPE, v1 alerts, short watchers, archive, data checks) keeps running and is not the main line.

## Where F1 is

- F1a-1 data identity: DONE (merge 7d73008).
- F1a-2 Binance Vision 1m klines + manifest: DONE (merge 6ebaa26; reproduced on the VPS, `docs/f1/vps-compare-2026-10-22/`).
- F1a-3 aggregation 1m to 5m, 15m, 1h, 4h, 1d and 1w: DONE (PR #3; report `docs/f1/f1a-3-aggregation.md`, contract with amendments 1-2 `docs/f1/f1a-3-contract.md`). Binance Vision's own files disagree in a few bars, listed in `docs/f1/f1a-3-e1.csv` and `docs/f1/f1a-3-e2.csv`.
- Next: F1a-4 funding, then F1b statistics. Before F1b uses volume, count or taker columns, decide how E1 and E2 bars are treated (ledger item pending).
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

Archive from before the F1 decision: `wiki/`, `raw/`, `core/`, `loops/`, `index.yaml`, `index.md`, `rules.md`, `automation/retrieval-router.yaml`, `automation/current-operating-map.md`. Kept, not deleted; they do not describe the current state.

## Standing process

- Every F1 phase plan from F1a-3 on: prior-art step, hours estimate, at most 3 Codex review rounds per PR (decisions 37, 44, 42).
- Light lookback after every F1 phase; deep reassess at big milestones or every 14 days; extra lookback on a surprise (decision 39). Every lookback checks that this file is current.
- Nothing counts as confirmed without a test. Label claims: tested (how, how many), taken over (from where), reasoning.
- Repo files are the one source of truth; Obsidian is only a viewer (decision 45). Public repo: no hosts, user names, IPs, chat ids or home paths.
