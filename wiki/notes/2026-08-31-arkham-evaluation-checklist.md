---
type: note
topic: arkham-evaluation-checklist
created: 2026-08-31T17:56:47Z
last_updated: 2026-09-01T08:24:00Z
work_item: discovery.arkham-evaluation-checklist
status: complete
scope: research-only
sources:
  - ../entities/arkham.md
  - https://arkm.com/api
  - https://arkm.com/api/docs
  - https://arkm.com/llms.txt
  - https://arkm.com/llms/guides/getting-access.md
  - https://arkm.com/llms/guides/credit-pricing.md
  - https://arkm.com/llms/guides/rate-limits.md
  - https://arkm.com/llms/guides/how-arkham-labels-wallets.md
  - https://arkm.com/llms/get-intelligence-entity_balance_changes.md
  - https://arkm.com/llms/get-transfers.md
  - https://arkm.com/llms/get-token-top_flow-id.md
  - https://arkm.com/llms/get-hypercore-entity-entity-summary.md
  - https://arkm.com/api-terms-of-service
tags:
  - ralph
  - research-note
  - wallet-shadowing
related:
  - ../entities/arkham.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---
# Arkham Evaluation Checklist

## Purpose

This closes `discovery.arkham-evaluation-checklist` as a bounded access and source-fit evaluation.

Question: can Arkham materially improve RALPH wallet/entity research, and what must be true before Tomas approves any account, key, paid plan, export, or integration?

No account, API key, paid service, scraper, scanner, cohort, alert, scheduler, threshold, risk sizing, TP/SL, execution behavior, public output, or strategy promotion was created.

## Access Reality

Current access classification: `needs-approval / not active`.

Arkham's public API docs are readable from this workspace. The actual API data route is not usable here without approved access:

| Check | Result |
| --- | --- |
| Public API guide | Readable; API docs describe access, authentication, labels, credits, rate limits, endpoints, and LLM-friendly docs |
| Getting access | Requires an Arkham account, API plan or trial, and generated API key |
| Plan/pricing | Usage-based subscriptions start at `$100`; trial access may be offered after request review |
| Terms/cost risk | Subscription fees, overages, non-refundability, and payment authorization require explicit HITL before any use |
| Direct no-key probe | `GET /chains`, `GET /networks/status`, `GET /intelligence/entity/binance`, and `GET /token/top_flow/usd-coin` returned HTTP 400 with an API-key signup message |
| Workspace state | No Arkham account, key, plan, trial, MCP, connector, or paid access is active for RALPH |

Docs list some zero-credit endpoints, but this workspace still cannot call them anonymously. For RALPH, "zero credits" must not be treated as "no account/key needed."

## Fit For RALPH

Arkham looks useful as enrichment, not as a first active signal rail.

| RALPH need | Arkham fit | Caveat |
| --- | --- | --- |
| Entity attribution | High | Labels are confidence-gated but still probabilistic and vendor-defined |
| Address clustering | High | Useful for hidden-address risk, but does not prove strategy intent |
| Cross-chain balances and portfolios | Medium-high | Better for context than frozen copyability without row exports |
| Transfers and top flows | Medium-high | Per-row billing and heavy endpoint limits matter; raw rows still need baseline/falsifier design |
| Slow accumulator research | Medium-high enrichment | Nansen/Dune remain better primary signal/extraction candidates; Arkham can label and cross-check |
| HyperCore/Hyperliquid context | Medium-high | Entity/account endpoints could improve subaccount and portfolio visibility, but require API access |
| Funding/basis hidden-hedge checks | Medium | Could reduce blind spots if entity clustering spans spot/perp/loan routes, but cannot certify off-venue books alone |
| Event-wallet anomaly research | Medium | Helps attribution and counterparties; still needs frozen event windows and delay/cost/exit ledger |
| Live alerts/copying | Out of scope | Any alerting, account, key, paid usage, or execution-facing use requires separate explicit approval |

## Approval Checklist

Before Arkham can move from `needs-approval` to active evaluation, Tomas would need to approve a narrow, read-only trial/export test with:

| Requirement | Gate |
| --- | --- |
| Account/key | Explicit HITL for account, API key, storage path, and revocation plan |
| Spend | Hard budget, including plan/trial cap, overage disabled or bounded, and no auto-upgrade assumption |
| Data scope | A tiny frozen sample only, such as 3-5 known entities/addresses or 1-2 tokens/windows |
| Endpoints | Predeclared endpoints and limits; avoid streaming and broad transfer scans first |
| Output | Local JSON/Markdown export rows only; no live watcher, scheduler, alert, or scanner |
| Quality | Record entity confidence, label type, source date, row freshness, and missing data |
| Falsifier | Compare Arkham output against raw public routes or Dune/Nansen/export alternatives |
| Promotion rule | Enrichment can improve source confidence, but cannot by itself create a paper candidate |

## Suggested Tiny Trial Shape

If Tomas later approves access, the first test should be enrichment-first:

1. Pick 3 known sample addresses/entities already in RALPH watch notes.
2. Query only intelligence, balances/portfolio, counterparties or flow, and if relevant HyperCore summary/trades with small limits.
3. Export rows with label confidence, entity IDs, address counts, chain coverage, token balances/flows, and missing fields.
4. Ask whether Arkham resolved a concrete unknown that public Hyperliquid/DefiLlama could not.
5. Reject or keep Watch if it only adds interesting labels without exit, flow, or falsifier value.

Do not start with WebSocket streams, user alerts, broad transfers, leaderboard mining, or a scanner.

## Decision

`discovery.arkham-evaluation-checklist` is complete.

Verdict: Arkham is worth keeping as a `needs-approval / enrichment-first` rail. It may materially improve entity attribution, clustering, HyperCore context, and flow enrichment, but the workspace cannot use it now without account/key/API-plan approval. It should not be treated as the primary slow-accumulator signal source before Nansen/Dune export questions are resolved, and it cannot promote wallet-shadowing by itself.

U-001 remains open until an approved tiny export/API sample proves Arkham adds decision value over public routes.

## U-001 Wheel Gate

2026-09-01 update: U-001 is no longer a ready manual research branch under current no-key constraints. Treat it as `Watch / approval-gated tiny sample` until Tomas explicitly approves account/API-plan-or-trial/API-key access, a hard spend limit, and a local export path.

Falsifiable item: `arkham-material-value-tiny-export-gate`.

Question: does a tiny Arkham export/API sample change a concrete RALPH decision compared with current public routes?

Allowed only after explicit approval:

- 3-5 already-known addresses/entities from RALPH notes;
- read-only API/export rows only;
- predeclared endpoints and row limits;
- local JSON/Markdown artifact with label confidence, entity/address coverage, balances/flows/counterparties where available, missing fields, and retrieval timestamp;
- comparison against public Hyperliquid/DefiLlama/Dune-or-manual alternatives;
- decision states limited to `reject`, `watch`, or `needs-second-sample`.

Reject conditions:

- Arkham only adds interesting labels without changing candidate rejection/routing;
- entity confidence, row coverage, or freshness is too weak;
- hidden-hedge, exit/distribution, or baseline questions remain unchanged;
- spend/terms/export limits are not acceptable.

This wheel gate does not authorize creating an account, storing a key, starting paid service, broad transfer scan, streaming, scheduler, alert, wallet/cohort scanner, paper candidate, demo/testnet, live trading, sizing, TP/SL, execution behavior, public posting, or strategy promotion.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only. 2026-09-01 update changed routing only: U-001 moved from pending unknown work to approval-gated watch until Tomas names and approves the tiny sample.

Boundary delta: no account, API key, paid service, scraper, scanner, cohort, live copying, live trading, orders, scheduler or cron changes, alerts, thresholds, risk/sizing/leverage/TP/SL, execution behavior, public posting, or strategy promotion changed.
