---
type: note
topic: hyperliquid-wallet-shadow-delay-sample
created: 2026-09-01T06:25:35Z
last_updated: 2026-09-01T08:31:00Z
work_item: unknowns.U-008 / unknowns.U-017
status: partial
scope: research-only
sources:
  - 2026-08-31-wallet-shadow-delay-evidence.md
  - 2026-09-01-no-key-copytrading-discovery-limit-map.md
  - ../../experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01.md
  - ../../experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01-address-5b5d.md
  - ../../experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01-address-20c2.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
related:
  - ../../decisions/unknowns.md
  - ../../decisions/copytrading-watch-ledger.md
  - ../../automation/work-queues.yaml
  - ../../experiments/copytrading-address-intake/src/run-hyperliquid-delay-sample.mjs
---
# Hyperliquid Wallet-Shadow Delay Sample

## Purpose

Open the smallest public/no-key blocker for `U-008` and `U-017`: can RALPH freeze recent known-address Hyperliquid fill rows and join them to public candle delay prices without building a scanner, scheduler, alert, account/key rail, paid data rail, demo/testnet setup, execution surface, or strategy promotion?

This was a manual tiny sample only. It used one known public leaderboard-derived address from prior RALPH notes, not a candidate wallet.

## Artifact

Added manual script:

- `experiments/copytrading-address-intake/src/run-hyperliquid-delay-sample.mjs`
- npm script: `ledger:hyperliquid-delay-sample`

Generated sample:

- `experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01.json`
- `experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01.md`
- `experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01-address-5b5d.json`
- `experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01-address-5b5d.md`
- `experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01-address-20c2.json`
- `experiments/copytrading-address-intake/results/hyperliquid-wallet-shadow-delay-sample-2026-09-01-address-20c2.md`

Primary run parameters:

- address: `0x7fdafde5cfb5465924316eced2d3715494c517d1`
- lookback: 60 minutes
- max rows: 12
- data route: Hyperliquid public `info` endpoint, `userFillsByTime` plus `candleSnapshot`
- settled window: `2026-09-01T05:34:40.497Z` to `2026-09-01T06:34:40.497Z`
- cost stress: `8` bps
- generated: `2026-09-01T06:40:40.497Z`

## Result

| Check | Result |
| --- | --- |
| Fills returned in 60-minute settled window | 720 |
| Frozen rows sampled | 24 |
| Rows joined to 1-minute candles | 24 |
| Entry rows / close rows | 22 / 2 |
| Unique coins | 6 |
| Unique coin-direction-minute groups | 8 |
| Positive 60s direction-adjusted rows before costs | 18/24 |
| Positive 180s direction-adjusted rows before costs | 19/24 |
| Positive 60s rows after 8 bps cost stress | 9/24 |
| Positive 180s rows after 8 bps cost stress | 17/24 |
| Main limitation | one known address only; no fees/slippage, exits, hidden hedge, or selection baseline |

The gross 60s and 180s rows are not useless, and the 180s count stays mostly positive under an 8 bps stress in this narrow slice. But the rows are highly clustered in one address and a few minute-level bursts, so this does not satisfy the 20+ independent quality-observation bar.

## Additional Known-Address Checks

To avoid overfitting the first known address, the same manual sampler was run against two other already-known addresses from the existing public leaderboard sample. No new address discovery was performed.

| Address | Fills returned | Rows | Entry rows | Unique coin-direction-minute groups | Net positive 60s after 8 bps | Net positive 180s after 8 bps | Read |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `0x7fdafde5cfb5465924316eced2d3715494c517d1` | 720 | 24 | 22 | 8 | 9/24 | 17/24 | mixed, clustered positive slice |
| `0x5b5d51203a0f9079f8aeb098a6523a13f298c060` | 622 | 24 | 24 | 2 | 0/24 | 0/24 | failed after cost stress; heavily one-coin burst |
| `0x20c2d95a3dfdca9e9ad12794d5fa6fad99da44f5` | 0 | 0 | 0 | 0 | 0/0 | 0/0 | inactive in this settled window |

The cross-address read is mixed and still biased by leaderboard sourcing. It supports keeping the route as a tiny falsifier, not promoting it into a strategy or recurring collector.

## What This Narrows

The public/no-key mechanics are better than a note-only claim:

- recent known-address rows can be frozen in the same run as candle joins;
- the script records observation age, fill direction, fill price, fee fields when available, and delay-price proxies;
- the output marks rows as one-address, no-hidden-hedge-check, and no-selection-baseline by default.

`U-008` and `U-017` remain open because the sample still lacks:

- 20+ independent quality observations after filters;
- at least 3 independent event windows for event-driven shadowing;
- conservative fee/slippage handling;
- exit observability;
- selection baseline against non-copied addresses/events;
- hidden-hedge and cross-venue exposure checks;
- non-leaderboard activity-defined sourcing.

## Decision

Do not promote wallet shadowing.

The new route is useful as a manual tiny falsifier only. It should be used to reject or narrow wallet-shadow hypotheses before any larger cohort work. It is not a scanner and does not authorize recurring capture.

Next valid `U-008`/`U-017` work, if Tomas wants it, is a deliberately scoped frozen event-window sample that waits long enough for 180s and 5m candles, caps rows tightly, and compares the delayed follower result against a no-copy baseline.

## U-008 / U-017 Wheel Gate

2026-09-01 update: U-008 and U-017 are no longer ready manual work without a named independent event/source trigger. Treat them as `Watch / named-trigger gated` under `wallet-shadow-independent-event-window-gate`.

Falsifiable item: `wallet-shadow-independent-event-window-gate`.

Question: do independent source-timestamped event windows produce 20+ quality observations where delayed wallet shadowing survives latency, costs, exits, hidden-hedge checks, and a no-copy baseline?

Trigger required before running:

- Tomas names an event/source/account hypothesis, or a source-ranked event record already in RALPH creates a precise event window;
- selection is frozen before outcome scoring;
- candidate accounts are predeclared from existing notes or an approved source route, not discovered by broad scanning;
- the study remains manual, public/no-key, and capped.

Minimum study contract:

- at least 3 independent event windows;
- 20+ quality observations after filters;
- raw fill/account rows and candle joins frozen in the same run;
- 60s, 180s, and 5m delay-price joins where available;
- explicit entry/exit classification;
- conservative cost/slippage stress;
- no-copy or non-selected baseline rows;
- hidden-hedge visibility flags, including current open-position/collateral limitations;
- cluster/outlier controls by address, coin, direction, and minute/window.

Reject or stay Watch if observations stay leaderboard-sourced, clustered, exit-blind, hidden-hedge blind, baseline-free, or too few after filters.

This wheel gate does not authorize HYPE L2 capture, broad wallet scanner/capture, scheduler, alerts, thresholds, account/key/paid service, demo/testnet, live trading, sizing, TP/SL, execution behavior, public posting, or strategy promotion.

## Boundary Delta

Changed: one manual experiment script, one package script alias, one local JSON/Markdown sample, wiki/router/state/log/memory/index references.

2026-09-01 routing update: U-008/U-017 moved from pending unknown work to Watch / named-trigger gated. No new rows or sampling were added.

Boundary delta: no scanner, scheduler, cron, systemd, alert, threshold, account, key, paid service, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, candidate wallet, paper-candidate wording, or strategy promotion changed.
