---
type: note
topic: aggregate-flow-signal-feasibility
created: 2026-08-30T15:18:00Z
last_updated: 2026-08-30T15:18:00Z
work_item: discovery.aggregate-flow-signal-feasibility
status: complete
scope: research-only
sources:
  - ../../raw/wallet-shadowing-latency-axis-correction-2026-07-01.md
  - ../../raw/patient-retail-strategy-map-2026-07-01.md
  - ../../raw/slow-accumulator-tool-fit-check-2026-07-01.md
  - ../../raw/slow-copy-trading-distinction-2026-07-01.md
  - 2026-08-10-public-orderflow-data-rail.md
  - 2026-08-30-orderflow-replay-alignment-audit.md
  - 2026-08-30-trader-grade-ta-feature-taxonomy.md
  - ../../../crypto-updates/orderflow-index.yaml
  - ../../../crypto-updates/wiki/orderflow/index.md
  - ../../../crypto-updates/monitor-index.yaml
  - https://docs.nansen.ai/api/overview
  - https://nansen.ai/api
  - https://arkm.com/api/
  - https://docs.dune.com/api-reference/executions/endpoint/execute-query
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../concepts/smart-money-accumulation-cohort.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---
# Aggregate-Flow Signal Feasibility

## Purpose

This closes `discovery.aggregate-flow-signal-feasibility`.

The question is whether RALPH can currently turn "aggregate flow" into a usable research signal with accessible public/no-key/local data. This note separates three meanings that should not be mixed:

- wallet/cohort aggregate flow;
- exchange/orderflow aggregate flow;
- alert-edge aggregate flow.

No live trading, copying, alerts, thresholds, execution, risk, sizing, TP/SL, keys, accounts, paid services, scheduler changes, or strategy promotion changed.

## Source-Backed Starting Point

The wallet-shadowing latency correction says the right unit may be cohorts, not single wallets: net smart-money positioning, stablecoin-to-alt rotation, and group agreement should reduce single-wallet selection bias.

The patient-retail strategy map gives the actual construction target: define a cohort, track net accumulation and stablecoin-to-alt rotation over rolling windows, and require the signal to survive hours/days of delay plus exit-shadowing and beta decomposition.

The slow-copy distinction keeps fast perp mirroring separate from slow mid-cap accumulator following. Aggregate flow belongs mainly to the slow accumulator branch, not to fast copytrading.

The public orderflow rail and replay-alignment audit prove a different kind of aggregate flow: no-key Binance/Hyperliquid trade/book capture and one-second feature extraction work, but saved captures currently have zero exact symbol/time matches against finalized Crypto Updates alerts.

Current local orderflow index evidence:

- 7 saved public orderflow capture entries.
- Largest capture: 2-hour BTC-only run with 855,975 records and 11,519 one-second feature rows.
- Best multi-asset capture: 10-minute BTC/ETH/SOL run with 87,516 records and 3,647 one-second feature rows.
- Latest alignment audit: 244 alert records, 239 finalized reviews, 6 feature runs, 0 exact symbol/time matches, 8 near misses.

Current monitor index evidence:

- 484 monitor records.
- 244 alerts sent.
- 239 finalized reviews.
- Assets covered: BTC, ETH, HYPE, SOL.

Current public access check:

- Nansen currently exposes Smart Money and token/on-chain analytics via API documentation and a public API pricing page. Programmatic use is paid or pay-per-call, so it is `needs-approval` before RALPH treats it as active.
- Arkham publicly describes an enterprise blockchain/entity API. Programmatic use is `needs-access` until this workspace has approved credentials or an active connector.
- Dune supports query execution and result APIs, but API use requires a Dune API key; no workspace key or connector is active here.
- Hyperliquid official info endpoints remain useful no-key verification for known users, but they do not by themselves create a broad slow mid-cap spot cohort feed.

## Route Classification

| Route | Current state | Why |
| --- | --- | --- |
| Wallet/cohort aggregate flow | `needs-access` for broad programmatic mid-cap cohort construction; `watch` for manual/source research | The desired signal needs labelled or queryable wallet cohorts, token flows, stablecoin-to-alt rotation, exits, and beta controls. Existing local sources point to Nansen/Arkham/Dune, but current programmatic access is paid/keyed or unverified. Hyperliquid no-key user endpoints can verify known addresses, not discover a broad spot accumulator cohort without biased seed selection. |
| Exchange/orderflow aggregate flow | `active-public-proxy` | Binance and Hyperliquid no-key capture works locally, feature extraction works, and the local index proves scale beyond smoke tests. This is aggregate taker/book flow, not wallet-smart-money flow. It is pipeline evidence only until aligned to alert/review outcomes. |
| Alert-edge aggregate flow | `watch` | Crypto Updates has enough alert/review rows to be a future label surface, but saved orderflow windows currently have zero exact symbol/time matches. Aggregate alert-edge features cannot be promoted until exact overlap exists and price-plus-orderflow beats price-only baseline by asset/trigger family. |

## Feasibility Verdict

Aggregate flow is feasible as a research family, but only one sub-route is currently active with accessible data:

1. Exchange/orderflow aggregate flow is technically feasible now with public/no-key data.
2. Wallet/cohort aggregate flow is conceptually preferred for patient-retail slow accumulation, but not currently active without approved Nansen/Arkham/Dune-style access or a public no-key substitute.
3. Alert-edge aggregate flow is feasible as a future validation join, but current saved data does not support signal claims because exact alert/orderflow overlap is zero.

Therefore C-020 stays `Candidate`, U-022 stays `Open`, C-036 stays `Candidate`, and U-038 stays `Open`.

## Cheapest Falsifiers

Wallet/cohort aggregate flow:

- Falsifier: can RALPH produce a frozen list of at least 20 candidate mid-cap accumulator wallets plus token-level flow rows for a 7-14 day window from no-key/public/local sources without paid/API access?
- Current answer: not proven. Public/no-key Hyperliquid routes verify known perp addresses, but do not provide the target slow spot cohort feed.
- Next micro-action: run a no-key public-source search for one exportable Dune query or public dashboard that exposes token-holder/DEX-transfer cohort rows for a real mid-cap token. If no exportable rows exist, keep the branch `needs-access`.

Exchange/orderflow aggregate flow:

- Falsifier: during an alert/review window, capture BTC/ETH/SOL/HYPE public orderflow and show at least one exact symbol/time match in `orderflow-alert-replay-alignment.mjs`.
- Current answer: local capture works, but existing saved data has 0 exact matches.
- Next micro-action: when manually allowed or already running under an approved capture context, include BTC/ETH/SOL/HYPE and rerun the alignment immediately after capture. Do not add a scheduler or watcher change from this note.

Alert-edge aggregate flow:

- Falsifier: on exact matched samples, compare price-only alert outcomes against price-plus-orderflow features and require improvement by asset/trigger family.
- Current answer: cannot test yet because exact matched samples are absent.
- Next micro-action: wait for exact overlap evidence before another score-only refresh.

## Decision

`discovery.aggregate-flow-signal-feasibility` is done for this bounded pass.

Do not promote aggregate flow as a strategy. Route future work as:

- C-020/U-022 wallet/cohort aggregate flow: watch or needs-access until a no-key/exportable cohort source exists.
- C-036/U-038 exchange/orderflow aggregate flow: active public-proxy data rail, validation blocked on exact alert/orderflow overlap.
- Alert-edge aggregate flow: watch, not live-alert input.

## Boundaries

This was research-only. No live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
