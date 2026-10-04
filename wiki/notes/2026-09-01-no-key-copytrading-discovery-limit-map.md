---
type: note
topic: no-key-copytrading-discovery-limit-map
created: 2026-09-01T05:54:41Z
last_updated: 2026-09-01T05:54:41Z
work_item: unknowns.U-039
status: done
scope: research-only
sources:
  - 2026-08-31-slow-accumulator-copytrading-source-fit.md
  - 2026-09-01-wallet-shadowing-existing-tool-coverage-map.md
  - 2026-09-01-hyperliquid-activity-defined-universe-route.md
  - 2026-09-01-cohort-flow-vs-single-wallet-signal-map.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-30-hyperliquid-leaderboard-address-sample.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
  - no-key
related:
  - ../../decisions/unknowns.md
  - ../../decisions/copytrading-watch-ledger.md
  - ../../automation/work-queues.yaml
---
# No-Key Copytrading Discovery Limit Map

## Purpose

Resolve `U-039` for current routing: decide whether copytrading/wallet-following discovery can produce useful candidates without paid/keyed access or leaderboard bias.

This is a discovery-limit map only. It does not create a scanner, account, key, paid source, API use, copy rule, alert, schedule, collector, paper candidate, sizing, TP/SL, execution behavior, live trade, or public post.

## Decision

No-key copytrading discovery is useful for prior art, triage, and rejection. It is not currently enough to produce useful copy candidates.

The best no-key routes can:

- find Hyperliquid leaderboard-derived address seeds;
- independently check known addresses through official public info endpoints;
- reject stale, withdrawn, tiny, capped-fill, concentrated, or negative-return profiles;
- teach product UX/risk vocabulary;
- provide radar or tiny delay-falsifier material.

They cannot yet:

- create a non-leaderboard activity-defined universe;
- prove full account history or hidden hedge state;
- produce slow spot/mid-cap smart-money rows;
- observe entry and exit/distribution for a 20+ wallet/entity cohort;
- justify copyability or paper-candidate status.

## Current Routing

| Source family | Current no-key value | Candidate value |
| --- | --- | --- |
| Hyperliquid public stats leaderboard | High for seed/rejection volume, but leaderboard-biased. | Watch/reject only. |
| Hyperliquid official info endpoints | High for known-address state/fill checks and tiny falsifiers. | Triage/falsifier only. |
| HypurrScan/HyperDash/Copin/HyperTracker manual pages | Useful product and profile prior art. | Manual watch, not active signal. |
| Nansen/Dune/Arkham-style smart-money rows | Best serious source family, but not active no-key here. | Needs HITL export/API approval. |
| Copytrading products and bot repos | Useful risk-boundary examples. | Prior art; no account/copy/execution use. |

## Practical Rule

Do not ask "which wallet should we copy?" from no-key discovery.

Ask:

1. Which public route produced this address?
2. Is the route leaderboard/PnL-selected?
3. Can official no-key state/fills reject it?
4. Is history capped or stale?
5. Are exits and hidden hedges observable?
6. Does the row become Watch, radar-only, reject, blocked, or a tiny follow-up falsifier?

If the answer requires a paid/keyed data product, account login, manual export, scraper, scanner, or live copy setup, the branch is HITL-gated.

## Boundary Delta

Changed: wiki/router/queue/state/log/index/memory only.

Boundary delta: no account, key, paid service, API use, collector, scanner, scheduler, cron, systemd, alert, threshold, copy rule, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.
