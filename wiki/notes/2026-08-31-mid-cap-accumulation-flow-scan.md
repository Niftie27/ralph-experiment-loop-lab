---
type: note
topic: mid-cap-accumulation-flow-scan
created: 2026-08-31T05:36:00Z
last_updated: 2026-08-31T05:36:00Z
work_item: discovery.mid-cap-accumulation-flow-scan
status: complete
scope: research-only
sources:
  - ../concepts/smart-money-accumulation-cohort.md
  - 2026-08-30-aggregate-flow-signal-feasibility.md
  - ../comparisons/slow-accumulator-tool-fit-map.md
  - 2026-07-01-wallet-shadowing-next-direction.md
  - https://dune.com/queries/7879081
  - https://docs.dune.com/data-catalog/curated/token-transfers/overview
  - https://agents.nansen.ai/
  - https://nansen.ai/api
  - https://arkm.com/api/docs
  - https://arkm.com/llms.txt
  - https://api-docs.defillama.com/
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../concepts/smart-money-accumulation-cohort.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---
# Mid-Cap Accumulation Flow Scan

## Purpose

This closes `discovery.mid-cap-accumulation-flow-scan` for a bounded wheel-gate pass.

Question: can RALPH currently produce a frozen mid-cap accumulator cohort and token-level flow rows from public/no-key sources, without paid APIs, accounts, keys, or custom scanner work?

No live trading, copying, alerts, thresholds, execution, risk, sizing, TP/SL, keys, accounts, paid services, scheduler changes, or strategy promotion changed.

## Starting Constraint

The target branch is slow, patient-retail smart-money accumulation, not fast perp copy trading. The unit should be a cohort and a round-trip flow test:

- candidate mid-cap tokens;
- wallets or entities that repeatedly accumulate before multi-day or multi-week moves;
- stablecoin-to-alt rotation and net token accumulation over rolling windows;
- exit/distribution detection, not entry-only copying;
- beta and outlier controls.

That means a source must expose more than a token price chart. It needs at least address/entity identity, token balances or transfers, time, amount, and exportable rows.

## Source Checks

### Dune

Dune is the best public-schema candidate but not currently active as a no-key programmatic rail.

Evidence:

- Dune's token transfer docs list public chain-specific transfer tables such as `tokens_evm.transfers`, `tokens_solana.transfers`, and `tokens_tron.transfers`, with roughly hourly refresh and broad chain coverage.
- Search found a relevant public query, `Smart Money Rotation - Net Token Flows of $1M+ Wallets (30d)`, whose premise is close to this branch: wallets with more than $1M of Ethereum DEX trades and net token flow.
- Direct unauthenticated calls to `https://api.dune.com/api/v1/query/7879081` and `/results` returned `401 {"error":"invalid API Key"}` in this workspace.

Classification: `watch / needs-key`. Dune can likely express the query, and public query pages can inspire SQL, but RALPH cannot yet rely on Dune as an active export rail without an API key, approved account/session, or manual export supplied by Tomas.

### Nansen

Nansen is the closest productized source for the exact signal, but it is paid/keyed or x402-paid.

Evidence:

- Nansen's agent page says it supports Smart Money tracking, wallet profiling, token screening, CLI/MCP/REST, and structured JSON.
- It lists x402 pay-per-call access and specific smart-money/token-flow style endpoints, including Smart Money net flow, holdings, DEX trades, inflows, and token flow intelligence.
- The same page describes a Smart Money signal workflow that detects labeled-wallet accumulation before broader attention.

Classification: `needs-approval`. This is probably the highest-fit data product for C-030, but using it crosses paid/keyed/x402 access and cannot become active without Tomas HITL.

### Arkham

Arkham is high-fit for enrichment and holder/flow inspection, but not a no-key active rail.

Evidence:

- Arkham API docs describe an entity-first intelligence API with address/entity labels, confidence-scored attribution, balances, flows, counterparties, token holders, token top-flow, transfer search, and entity balance changes.
- Direct unauthenticated access to `https://api.arkm.com/chains` returned an access message requiring an API key.

Classification: `needs-access / needs-approval`. Arkham can enrich or validate wallets/entities, but it should not be treated as active for cohort construction until credentials or an approved x402/pay-per-request route are available.

### DefiLlama

DefiLlama is active as public/no-key context, not as wallet-cohort signal.

Evidence:

- The public API docs list no-key endpoints for protocols, TVL, chain TVL, prices, stablecoins, yields, DEX volume, fees, revenue, and open interest.
- A direct request to `https://api.llama.fi/protocols` returned HTTP 200 from this workspace.

Classification: `active-public-context`. Useful for mid-cap universe filtering, protocol/category/liquidity context, prices, TVL, stablecoin regime, and DEX volume. It does not expose wallet-level accumulator cohorts or holder flow rows by itself.

## Bounded Verdict

The slow mid-cap accumulation branch is not dead, but it is not yet executable from public/no-key data in this workspace.

Current best route:

1. Use DefiLlama and existing local market data only for universe/context filtering.
2. Keep Dune as `watch / needs-key`; public query pages can define SQL/falsifiers, but API export is blocked without a key.
3. Keep Nansen as `needs-approval`; it is the closest exact productized fit.
4. Keep Arkham as `needs-access / needs-approval`; it is better as entity/label enrichment than as the first no-key cohort source.

No frozen cohort was created because the minimum input contract is not met: at least 20 candidate wallets plus token-level 7-14 day accumulation/exit rows from a no-key/exportable source.

## Cheapest Next Falsifier

Before any scanner build, paid product use, or account setup:

- find one Dune public query whose SQL can define the cohort and whose results can be exported through an approved key/manual export;
- select one real mid-cap token with adequate liquidity and non-memecoin status;
- produce a frozen table with address, token, time bucket, net token flow, net USD flow, stablecoin flow, entry/exit flags, and source row URL/query ID;
- require at least 20 candidate wallets over a 7-14 day window;
- reject the branch if the data cannot separate accumulation from exchange/internal/LP/noise flows or if exit/distribution rows are absent.

If Tomas wants the highest-probability shortcut, the smallest HITL is not "build a scanner." It is: approve a tiny Nansen or Dune access/export test with a fixed spend/key boundary and no trading/execution permissions.

## Decision

`discovery.mid-cap-accumulation-flow-scan` is done for this bounded pass.

- C-022 stays `Candidate`, but next action changes from broad feasibility to a Dune/Nansen access/export decision.
- C-030 stays `Candidate`, with Nansen as highest-fit but approval-gated, Dune as query-fit but key/export-gated, Arkham as enrichment-gated, and DefiLlama as context-only.
- U-024 and U-030 stay `Open`, now narrowed to exportability/access and exit-flow coverage rather than generic tool discovery.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
