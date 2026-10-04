---
type: note
topic: mev-bot-failure-mode-extraction
created: 2026-08-30T09:16:00Z
last_updated: 2026-08-30T09:16:00Z
work_item: investigation.mev-bot-failure-mode-extraction
status: complete
scope: research-only
sources:
  - raw/crypto-trading-bots-project-handoff.md
  - raw/assets/mev-bot-archive/mev-bot_1_.tar.gz
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../../case-files/mev-bot/review.md
  - ../../case-files/mev-bot/README.md
  - ../sources/mev-bot-archive.md
  - ../sources/crypto-trading-bots-project-handoff.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---
# MEV Bot Failure-Mode Extraction

## Purpose

This closes `investigation.mev-bot-failure-mode-extraction`.

The Base MEV bot archive remains a case file, not an execution workspace. This pass extracts reusable validation rules from the archive review without booting code, changing services, touching keys, or opening any live path.

## Extracted Failure Modes

| Failure mode | Source-backed symptom | RALPH validation rule |
| --- | --- | --- |
| Pre-patch archive drift | Archive notes and handoff say available repo is pre-patch | Never treat an archived trading repo as current until patch provenance and exact commit/state are verified |
| Monitor/trade boundary leak | Compose hard-fails on `VAULT_SIGNER_KEY` even when monitoring should not require signing | Monitoring, paper, and research modes must start without trading secrets |
| Schema mismatch | `seed_wallets.csv` shape does not match the Rust struct expected by `strategy-shadow` | Validate input schemas before any replay, paper, or startup claim |
| Env-var mismatch | Compose passes `BANKROLL`, while `bundler` reads `BANKROLL_ETH` | Verify config contract names across compose, services, docs, and runtime defaults |
| Fake simulation metrics | `sim-pool` does `eth_call`, then reports fixed gas and zero PnL | Simulation output must expose real modeled assumptions; placeholder gas/PnL cannot feed decisions |
| Broken event wiring | `strategy-shadow` publishes `sim.req`; `sim-pool` does not consume NATS; `bundler` waits for `exec.order` | End-to-end message paths must be traced before any execution-readiness claim |
| Metric mismatch | Prometheus alert rules reference metrics that do not match emitted names | Observability rules must be tested against emitted metric names, not docs alone |
| Sequencer/latency mismatch | Base wallet-shadowing is weakened by sequencer ordering and timing constraints | Chain/venue microstructure must match the strategy; copying assumptions are invalid without delay/fill proof |
| Speed architecture mismatch | 500 ms pending-block polling is questionable for speed-sensitive MEV | If the edge is latency-sensitive, prove the latency budget before writing strategy logic |

## RALPH Rules To Reuse

- A repo can be a source of lessons without being a runnable system.
- Research/monitoring mode must not require wallet or exchange secrets.
- Every strategy path needs a data contract, event contract, config contract, and metric contract check.
- Simulation must be decision-grade before it can affect candidates.
- End-to-end wiring must be proven before any execution discussion.
- Venue mechanics are part of the strategy, not an implementation detail.
- Monitoring-first remains the default; execution-later requires explicit Tomas approval and a fresh audit.

## Queue Impact

- `investigation.mev-bot-failure-mode-extraction`: done.
- `C-006`: done as a case-file rules extraction.
- `U-006`: resolved for mandatory validation rules.

This does not resolve `U-008` or any broader wallet-shadow/MEV profitability question.

## Reassess

MEV material should feed future RALPH validation checklists and execution-boundary reviews, not near-term bot work. If a future branch references an archived repo or execution-capable codebase, start with these kill checks before any install, startup, patch, or strategy evaluation.

## Boundaries

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
