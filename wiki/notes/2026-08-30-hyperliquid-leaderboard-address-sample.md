---
type: note
topic: hyperliquid-leaderboard-address-sample
created: 2026-08-30T06:16:00Z
last_updated: 2026-08-30T06:16:00Z
work_item: discovery.hyperliquid-copytrading-address-sample
status: complete
scope: research-only
sources:
  - https://stats-data.hyperliquid.xyz/Mainnet/leaderboard
  - https://api.hyperliquid.xyz/info
tags:
  - ralph
  - research-note
  - wallet-shadowing
related:
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-27-hyperliquid-public-address-sample.md
  - ../../decisions/copytrading-watch-ledger.md
  - ../../experiments/copytrading-address-intake/data/public-leaderboard-addresses-2026-08-30.json
  - ../../experiments/copytrading-address-intake/results/hyperliquid-leaderboard-address-intake-2026-08-30.md
---
# Hyperliquid Leaderboard Address Sample

## Purpose

This closes a bounded `discovery.hyperliquid-copytrading-address-sample` pass.

After the public route ledger verified the Hyperliquid stats leaderboard as a no-key discovery route, this pass selected six leaderboard-derived addresses with different visible risks and ran the existing no-key address intake against official `clearinghouseState` and `userFills`.

## Output

Updated `experiments/copytrading-address-intake/src/run-hyperliquid-address-intake.mjs` so custom samples can write a named output prefix instead of overwriting the older default result.

Added:

- `experiments/copytrading-address-intake/data/public-leaderboard-addresses-2026-08-30.json`
- `experiments/copytrading-address-intake/results/hyperliquid-leaderboard-address-intake-2026-08-30.json`
- `experiments/copytrading-address-intake/results/hyperliquid-leaderboard-address-intake-2026-08-30.md`

## Result

| Measure | Count |
| --- | ---: |
| Addresses sampled | 6 |
| Copy candidates produced | 0 |
| Current open-position accounts | 2 |
| Capped fill responses | 4 |
| No-fill responses | 1 |
| Rejected-as-copy rows | 1 |

Rows:

| Address | Status | Key reason |
| --- | --- | --- |
| `0x4ec8fe22a531a96c8a846aaf5cbef73202649a80` | watch/sample-only | flat, emptied/stale, 9 fills only, concentrated unknown coin |
| `0x393d0b87ed38fc779fd9611144ae649ba6082109` | watch/sample-only | flat, emptied/stale, no fills in latest public response |
| `0x7fdafde5cfb5465924316eced2d3715494c517d1` | rejected-as-copy/watch-as-evidence | 32 open positions, capped fills, negative returned close-fill PnL |
| `0x9794bbbc222b6b93c1417d01aa1ff06d42e5333b` | watch/sample-only | flat, emptied/stale, capped fills, concentrated unknown coin |
| `0x20c2d95a3dfdca9e9ad12794d5fa6fad99da44f5` | watch/sample-only | flat, emptied/stale, capped ETH-only returned fills |
| `0x5b5d51203a0f9079f8aeb098a6523a13f298c060` | watch/sample-only | 8 open positions, capped SOL-heavy returned fills |

## Decision

`discovery.hyperliquid-copytrading-address-sample` is done for this bounded pass.

The route is useful, but leaderboard seed quality is weak without deeper filters. No sampled wallet becomes a copy candidate. The next useful copytrading work should define an activity-filtered cohort test that rejects:

- accounts with no or stale fills;
- accounts whose public fills are capped before full history is understood;
- accounts dominated by one asset or unknown coin;
- open-position accounts where hidden hedges and live-copy temptation are high;
- accounts with negative returned close-fill PnL;
- leaderboard rows whose current account state conflicts with historical PnL.

## Verify / Reassess

Verification:

- `node --check experiments/copytrading-address-intake/src/run-hyperliquid-address-intake.mjs` passed.
- `npm run intake:hyperliquid --prefix ralph-research-os/experiments/copytrading-address-intake -- --addresses ralph-research-os/experiments/copytrading-address-intake/data/public-leaderboard-addresses-2026-08-30.json --output-prefix hyperliquid-leaderboard-address-intake-2026-08-30` passed.

Reassessment:

The main value is not the sampled addresses. It is the pipeline: public leaderboard seed -> official no-key fill/state intake -> conservative rejection/watch classification. That is enough to continue source-lane research without live copy, keys, accounts, paid APIs, or strategy promotion.

No live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
