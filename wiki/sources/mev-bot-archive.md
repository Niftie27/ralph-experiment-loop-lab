---
type: source
title: MEV Bot Archive Tarball
original_path: local://openclaw-media/mev-bot_1_.tar.gz
raw_file: raw/assets/mev-bot-archive/mev-bot_1_.tar.gz
assets: [raw/assets/mev-bot-archive/mev-bot_1_.tar.gz]
authors: [Tomas, assistant]
published_date: 2026-06-30
relevance_score: 1.0
ingested: 2026-07-01T06:12:00Z
last_updated: 2026-07-01T06:12:00Z
entities: [wiki/entities/mev-bot-case-file.md]
concepts: [wiki/concepts/benchmark-discipline.md]
---

# MEV Bot Archive Tarball

Raw source: [[raw/assets/mev-bot-archive/mev-bot_1_.tar.gz]]

## Why This Source Matters

This archive is the actual repo snapshot for the Base L2 MEV bot case file. It was inspected in `/tmp/ralph-mev-review/mev-bot` for review, without modifying the original archive.

## Archive Contents Reviewed

- Go services: `scraper`, `pairwatcher`, `sim-pool`, and `internal/rotator`.
- Rust services: `strategy-shadow` and `bundler`.
- Compose, Dockerfiles, NATS, Prometheus, PostgreSQL migrations, seed wallets, and project docs.

## Review Notes

- The archive is explicitly pre-patch according to `ARCHIVE_NOTES.md`.
- `seed_wallets.csv` has six columns, while `strategy-shadow` expects `address,roi`; startup can panic during CSV deserialization.
- `docker-compose.yml` passes `BANKROLL`, while `bundler` reads `BANKROLL_ETH`.
- `VAULT_SIGNER_KEY` hard-fails compose startup, even though monitoring should not require trading secrets.
- `sim-pool` performs `eth_call`, then reports `GasUsed = 21000` and `PnLWei = 0`; this is not a real profitability simulation.
- `strategy-shadow` publishes `sim.req`; `sim-pool` does not consume NATS; `bundler` listens for `exec.order`; nothing currently bridges these into a validated execution path.
- Prometheus alert rules reference metric names that do not match the service metrics in several places.

## RALPH Implications

Treat the archive as a source of system-design and failure-mode lessons. Do not boot it as an active bot. Any future work starts with a read-only audit checklist and isolated patch review, not execution.
