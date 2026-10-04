---
type: note
topic: copytrading-public-route-ledger
created: 2026-08-30T06:06:00Z
last_updated: 2026-08-30T06:06:00Z
work_item: discovery.copytrading-public-route-ledger
status: complete
scope: research-only
sources:
  - https://stats-data.hyperliquid.xyz/Mainnet/leaderboard
  - https://app.hyperliquid.xyz/leaderboard
  - https://api.hyperliquid.xyz/info
  - https://hypurrscan.io/
  - https://hyperdash.com/explore
  - https://hypertracker.io/
  - https://app.coinmarketman.com/hypertracker/api
  - https://docs.nansen.ai/api/hyperliquid/hyperliquid-leaderboard
  - https://apify.com/gochujang/hyperliquid-leaderboard
tags:
  - ralph
  - research-note
  - wallet-shadowing
  - source-scan
  - no-key
related:
  - 2026-08-26-copytrading-autoresearch-lane.md
  - 2026-08-27-hyperliquid-public-address-sample.md
  - ../../decisions/copytrading-watch-ledger.md
  - ../../experiments/copytrading-address-intake/results/hyperliquid-public-route-ledger.md
---
# Copytrading Public Route Ledger

## Purpose

This closes a bounded `discovery.copytrading-public-route-ledger` pass.

The goal was to separate currently usable public/no-key copytrading discovery routes from product pages, paid APIs, and manual watch surfaces before any address or cohort is treated as evidence.

## Output

Added `experiments/copytrading-address-intake/src/run-hyperliquid-public-route-ledger.mjs` and `ledger:public-routes` to the local experiment package.

The script writes:

- `experiments/copytrading-address-intake/results/hyperliquid-public-route-ledger.json`
- `experiments/copytrading-address-intake/results/hyperliquid-public-route-ledger.md`

## Access Snapshot

| Route | Access class | Programmatic? | RALPH use | Status |
| --- | --- | --- | --- | --- |
| Hyperliquid public stats leaderboard | verified public/no-key | yes | address seed discovery only; must independent-check fills/state | active discovery route |
| Hyperliquid official info endpoint | verified public/no-key | yes | `clearinghouseState` and `userFills` checks for known addresses | active verification route |
| HypurrScan | verified public/manual | not verified | manual address/profile cross-checks | watch/manual |
| HyperDash Explore | verified public JS page | not verified | manual cohort discovery and prior-art UX reference | watch/manual |
| HyperTracker | verified public page; API/pricing exists | needs account/API for product route | manual discovery and prior-art; API remains needs-access | watch/needs-access |
| Nansen Hyperliquid leaderboard API | documented API-key route | not active here | possible future smart-money reference if approved | needs-access |
| Apify Hyperliquid leaderboard actors | public listing; paid-per-use/account path | not active here | fallback extractor watch item if free route breaks | watch/needs-approval |

## Leaderboard Probe

The public stats endpoint returned:

| Measure | Count |
| --- | ---: |
| Rows returned | 44,149 |
| Rows with addresses | 44,149 |
| Rows with positive all-time PnL | 22,230 |
| Positive all-time PnL plus negative week PnL | 2,126 |

## Interpretation

The official public stats endpoint is useful because it gives RALPH a no-key address-seed route without scraping a rendered dashboard.

It is still not strategy evidence:

- the source is leaderboard-selected;
- high all-time PnL can coexist with current drawdown, tiny current account value, withdrawn funds, stale accounts, or zero recent volume;
- it does not expose hidden hedges, full round trips, latency tolerance, copy slippage, beta, or exit behavior;
- rows must pass the existing `userFills`/`clearinghouseState` intake before entering any cohort spec.

## Decision

`discovery.copytrading-public-route-ledger` is done for this bounded pass.

The next copytrading branch should not ask "which top wallet should we copy?" It should take a small activity-defined sample from the public stats route, then run the no-key address intake and reject obvious stale, tiny, one-hit, high-turnover, hidden-hedge, or negative-PnL profiles.

## Verify / Reassess

Verification:

- `npm run ledger:public-routes --prefix ralph-research-os/experiments/copytrading-address-intake` passed.
- The public stats endpoint returned 44,149 structured leaderboard rows without a key.
- Web checks confirmed the relevant public/manual/needs-access surfaces were still present on 2026-08-30.

Reassessment:

Copytrading remains useful as a source lane, not an execution lane. The strongest current route is Hyperliquid public stats leaderboard for seed discovery plus official info endpoint for independent no-key verification. HyperTracker/Nansen/Apify-style routes remain watch/needs-access or needs-approval unless Tomas explicitly approves accounts, keys, or paid usage.

No live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
