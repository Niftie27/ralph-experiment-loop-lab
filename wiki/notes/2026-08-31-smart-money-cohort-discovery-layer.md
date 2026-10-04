---
type: note
topic: smart-money-cohort-discovery-layer
created: 2026-08-31T18:00:26Z
last_updated: 2026-08-31T18:00:26Z
work_item: discovery.smart-money-cohort-discovery-layer
status: complete
scope: research-only
sources:
  - ../concepts/smart-money-accumulation-cohort.md
  - 2026-08-31-mid-cap-accumulation-flow-scan.md
  - 2026-08-31-slow-accumulator-copytrading-source-fit.md
  - 2026-08-31-slow-accumulator-following-exit-risk-scan.md
  - ../comparisons/slow-accumulator-tool-fit-map.md
  - 2026-08-31-arkham-evaluation-checklist.md
  - 2026-08-31-wallet-shadowing-archetype-shadowability-map.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
related:
  - ../concepts/smart-money-accumulation-cohort.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---
# Smart-Money Cohort Discovery Layer

## Purpose

This closes `discovery.smart-money-cohort-discovery-layer` as a bounded design and routing artifact.

Question: what is the smallest valid discovery layer for slow smart-money accumulation without building a scanner or creating a cohort from weak public data?

No scanner, cohort, account, key, paid source, alert, threshold, scheduler, risk sizing, TP/SL, execution behavior, public output, or strategy promotion was created.

## Core Rule

The discovery layer is a frozen row contract, not a live system.

RALPH must not select "smart wallets" from a leaderboard, PnL page, attractive chart, or vendor label alone. A future row only becomes eligible for paper design if it contains enough information to test whether a delayed follower could have entered and exited after the row was selected.

## Minimum Row Contract

| Field group | Required fields |
| --- | --- |
| Freeze | `run_id`, `selection_time`, source, source URL/query/export ID, access class |
| Identity | wallet or entity ID, chain(s), label source, label confidence or quality class |
| Token | token address/ID, symbol, chain, sector/category, market-cap class |
| Entry flow | entry window, net token flow, net USD flow, number of contributing wallets/entities |
| Stable funding | stablecoin/source-of-funds flow where visible |
| Exit flow | exit/distribution/reduction window, net token and USD outflow, explicit no-exit if absent |
| Off-ramp context | CEX deposit, bridge-out, known market-maker/protocol/internal route where visible |
| Market context | price path from selection through exit/timeout, liquidity/volume, spread or impact proxy |
| Baselines | token buy-and-hold, BTC/ETH/SOL beta, sector basket, simple momentum, no-trade |
| Follower model | delayed entry, delayed exit, conservative cost class, missed/partial fill flag |
| Quality flags | missing exit, vendor-label bias, LP/internal/treasury/exchange flow, thin liquidity, one-token/wallet dependence |
| Verdict | reject, watch, radar-only, needs-access, needs-exit, or paper-design-eligible |

Minimum viable sample remains 20+ wallets/entities over a 7-14 day entry plus exit/distribution window. Anything smaller is a case study or access test, not a cohort.

## Source Routing

| Source | Role | Current state |
| --- | --- | --- |
| Nansen Smart Money netflows | Highest-fit primary signal for token accumulation/distribution | Needs HITL access/payment/key approval |
| Dune SQL/export | Transparent extraction and reproducible tables | Needs API key/manual export or approved logged-in workflow |
| Arkham | Entity attribution, clustering, balances, flows, counterparties, HyperCore enrichment | Needs account/API-plan-or-trial/API-key approval; enrichment-first |
| DefiLlama/public market data | Token/protocol/liquidity/yield/context baseline | Active public context only; cannot identify smart-money cohorts |
| Hyperliquid public routes | Known-address perp/fill triage and delay falsifiers | Not a slow spot accumulator source |
| Copin/HyperDash/copy products | UX/risk prior art | Wrong-speed for slow accumulator selection |

## Kill Criteria

Downgrade the branch to Watch or reject a proposed sample if:

- exit/distribution rows are missing;
- the cohort is chosen after the pump or by performance leaderboard;
- source labels are opaque and cannot be cross-checked;
- flow is mostly exchange, internal, LP, treasury, bridge, or market-maker plumbing;
- delayed follower PnL loses versus token hold, beta, sector, momentum, or no-trade baseline;
- one wallet, one token, or one event explains most of the positive result;
- liquidity cannot support entry and exit under conservative public assumptions;
- the source requires unapproved paid access, account setup, key storage, scraping, or live alerting.

## Decision

`discovery.smart-money-cohort-discovery-layer` is complete.

Verdict: smart-money cohort discovery remains a Candidate, but the active unit is now a future frozen export/sample contract. Current public/no-key sources cannot create the required cohort because the missing pieces are wallet/entity labels, durable token-flow rows, exit/distribution coverage, and export/API access. The next valid move is HITL approval for a tiny Nansen/Dune/Arkham export test, or leave the branch Watch while RALPH continues no-key baselines and tiny falsifiers.

U-022, U-024, U-030, and U-039 remain open until measured rows exist. C-024 remains Candidate but no scanner/prototype is authorized.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no scanner, cohort, account, key, paid service, live copying, live trading, orders, scheduler or cron changes, alerts, thresholds, risk/sizing/leverage/TP/SL, execution behavior, public posting, or strategy promotion changed.
