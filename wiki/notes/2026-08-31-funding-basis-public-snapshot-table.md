---
type: note
topic: funding-basis-public-snapshot-table
created: 2026-08-31T06:35:00Z
last_updated: 2026-08-31T06:35:00Z
work_item: validation.funding-basis-public-snapshot-table
status: complete
scope: research-only
sources:
  - 2026-08-31-funding-basis-baseline-monitor.md
  - ../concepts/funding-basis-structural-baseline.md
  - ../../outputs/funding-basis-public-snapshot-table.md
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals
  - https://api-docs.defillama.com/
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - source-scan
  - strategy-family
  - funding
  - no-key
related:
  - ../../outputs/funding-basis-public-snapshot-table.json
  - ../../outputs/funding-basis-public-snapshot-table.md
  - ../../automation/funding-basis-public-snapshot-table.mjs
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---
# Funding/Basis Public Snapshot Table

## Purpose

This closes `validation.funding-basis-public-snapshot-table` as a one-shot public/no-key baseline artifact.

Question: can RALPH collect a concrete funding/basis observation table without crossing into accounts, keys, live alerts, thresholds, sizing, or execution?

No live trading, copying, orders, alerts, thresholds, execution, risk sizing, leverage, TP/SL, accounts, keys, paid services, scheduler changes, or strategy promotion changed.

## Artifact

Added:

- `automation/funding-basis-public-snapshot-table.mjs`
- `outputs/funding-basis-public-snapshot-table.json`
- `outputs/funding-basis-public-snapshot-table.md`

The script uses public Hyperliquid `info` requests and DefiLlama yields data. It writes local JSON/Markdown only.

## Snapshot Summary

Run generated at `2026-08-31T06:20:56.153Z`:

| Metric | Value |
| --- | ---: |
| Hyperliquid markets returned | 233 |
| Table rows | 20 |
| Funding-history rows fetched | 864 |
| Rows with enough short-window history for observation | 12 |
| Caution rows | 0 |
| History-not-fetched / insufficient rows | 8 |
| Top stable-yield context APY | 4.07% |

Top daily-notional markets in the snapshot were BTC, ETH, SOL, HYPE, ZEC, PUMP, XRP, XMR, LIT, UNI, TRUMP, and ENA among the rows with fetched funding history.

## Early Read

This validates the data rail, not the economics.

The table shows BTC and ETH had stable positive short-window funding in this run. Several other high-volume markets had funding sign flips, and some rows had mark/oracle or impact-width caveats. That is exactly why this branch should remain a baseline diagnostic: gross carry can look simple, but the first serious falsifier is costs plus tail risk, not headline funding.

The stable/yield context gives a dumb comparison floor. It is not an approved venue or allocation.

## Decision

`validation.funding-basis-public-snapshot-table` passes as a read-only public-data artifact.

C-025 should stay Candidate / baseline. It is now supported by an actual local snapshot report, but it is not paper-qualified and not promoted.

Next safe step, if Tomas continues this branch, is a fixed-window paper-accounting design: define how to compare repeated public snapshots against conservative hedge/rebalance cost classes and stable/yield baselines. That still must not create accounts, keys, live alerts, thresholds, risk sizing, execution, scheduler changes, or profitability claims.

## Boundary Delta

Changed: local automation script, local output reports, wiki/router/queue/state/log/memory/index only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
