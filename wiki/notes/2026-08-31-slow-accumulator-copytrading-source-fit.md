---
type: note
topic: slow-accumulator-copytrading-source-fit
created: 2026-08-31T11:34:48Z
last_updated: 2026-08-31T11:34:48Z
work_item: discovery.slow-accumulator-copytrading-source-fit
status: complete
scope: research-only
sources:
  - ../concepts/smart-money-accumulation-cohort.md
  - ../comparisons/slow-accumulator-tool-fit-map.md
  - ../comparisons/fast-copy-trading-vs-slow-accumulator-following.md
  - 2026-08-31-mid-cap-accumulation-flow-scan.md
  - 2026-08-31-patient-retail-archetype-prioritization.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-30-hyperliquid-data-feasibility-spike.md
  - 2026-08-30-wallet-shadowing-forward-paper-trade-spec.md
  - https://nansen.ai/api
  - https://docs.nansen.ai/api/smart-money/netflows
  - https://docs.nansen.ai/api/smart-money/holdings
  - https://docs.nansen.ai/guides/templates/complex-use-cases/use-case-2-find-and-copytrade-wallets-on-hyperliquid
  - https://hyperdash.com/copytrading
  - https://arkm.com/api
tags:
  - ralph
  - research-note
  - wallet-shadowing
  - source-scan
related:
  - ../concepts/smart-money-accumulation-cohort.md
  - ../comparisons/slow-accumulator-tool-fit-map.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
  - ../../decisions/copytrading-watch-ledger.md
---
# Slow Accumulator Copytrading Source Fit

## Purpose

This closes `discovery.slow-accumulator-copytrading-source-fit` as a bounded source-fit classification.

Question: can copytrading/product/profile surfaces contribute to Tomas's slow accumulator branch, or do they mostly solve the wrong problem?

No scanner, copy target, cohort, alert, threshold, account, key, paid service, risk sizing, TP/SL, execution, scheduler, public posting, or strategy promotion was created.

## Target Signal

The target is not fast perp mirroring.

For RALPH, "slow accumulator following" means:

- spot or on-chain mid-cap accumulation;
- holding periods in days or weeks;
- repeated pre-run accumulation across multiple independent tokens;
- cohort flow, not one famous wallet;
- exit and distribution tracking;
- beta-adjusted residual alpha;
- frozen out-of-sample paper validation.

Any source that mainly ranks profitable perp traders, supports real-time mirroring, or emphasizes headline PnL is prior art rather than primary evidence for this branch.

## Source Fit Matrix

| Source type | Fit | What it can provide | Main caveat | Current state |
| --- | --- | --- | --- | --- |
| Nansen Smart Money netflows | High | Token-level smart-money net inflow/outflow over 1h, 24h, 7d, and 30d windows; labels such as Fund and Smart Trader; token age, sector, market-cap and trader-count filters | API key, credits, x402/payment path, vendor label bias, rolling 30-day history | `needs-approval`, highest-fit |
| Nansen Smart Money holdings | Medium-high | Aggregated current smart-money holdings and 24h balance change across supported chains | Current snapshot only; no custom historical date range; aggregated rather than per-wallet rows | `needs-approval`, useful context |
| Nansen Hyperliquid copytrade guide/API | Low for slow accumulator, useful prior art | Perp leaderboard, perp positions, and perp trades for finding and mirroring successful Hyperliquid traders | Explicitly optimized for perp copytrading and real-time monitoring, not slow spot accumulation | `prior-art / wrong-speed` |
| Arkham API / platform | Medium-high enrichment | Entity labels, flows, balances, counterparties, transactions, HyperCore/HyperEVM context | API/access gated; attribution uncertainty; enrichment does not equal strategy evidence | `needs-access / needs-approval` |
| Dune public SQL/query route | Medium-high extraction if access exists | Custom cohort SQL over transfers, balances, swaps, and token-flow windows | API export key/manual export needed; label quality and table coverage must be verified per chain | `watch / needs-key-or-manual-export` |
| Hyperliquid public info + stats | Low-medium for slow accumulator | Perp account state, fills, funding, leaderboard seeds, market context | Perp-focused; no mid-cap spot/on-chain cohort flow; capped fills and leaderboard bias | `active-public-prior-art / triage` |
| HyperDash / Copin / BitMEX-style copy products | Low for slow accumulator | UX, copytrading metrics, real-time perp trader discovery, productized risk surfaces | Solves fast trader mirroring, often leaderboard/performance selected; crossing into accounts/copy execution requires HITL | `prior-art / do-not-use-active` |
| DefiLlama / public market context | Context only | TVL, yield, stablecoins, DEX volume, prices/open interest context | No wallet/entity cohort construction | `active-public-context` |

## Access Verification

Live/public checks on 2026-08-31:

- Nansen API public page advertises Smart Money tracking, wallet profiling, token screening, REST/CLI/MCP access, a free trial credit tier, Pro credits, and x402 pay-per-call. This is accessible as documentation and pricing context, not active usage permission.
- Nansen Smart Money `netflows` docs expose exactly relevant token accumulation/distribution fields, but the endpoint is authenticated and the live unauthenticated API probe returned HTTP 401.
- Nansen Smart Money `holdings` docs expose aggregated current smart-money holdings and 24h change, but not a historical date-range ledger.
- Nansen's Hyperliquid copytrading guide is explicitly a perp leaderboard/position/trade mirroring workflow, so it is not the slow accumulator target.
- Arkham API public page exposes broad entity/flow/balance intelligence claims; a direct unauthenticated `api.arkm.com/chains` probe returned HTTP 400, so this workspace still has no active Arkham API rail.
- HyperDash copytrading page presents automatic real-time copytrading of profitable Hyperliquid traders, which is useful as product prior art but out of scope for active RALPH work without explicit HITL.

## Classification

Slow accumulator source fit is now clearer:

1. Nansen Smart Money netflows are the highest-fit productized input for the exact signal, but approval-gated.
2. Dune is the most transparent extraction route if Tomas provides an API key/manual export or a usable public result table.
3. Arkham is best as label/entity/flow enrichment, not as the first active source.
4. Hyperliquid, Copin, HyperDash, and copytrade products are mainly perp-copy prior art; they should not define the slow accumulator universe.
5. DefiLlama and public market data should remain context filters and dumb baselines.

The no-key workspace still cannot produce the minimum frozen slow-accumulator cohort contract: at least 20 wallets/entities with token-level 7-14 day accumulation and exit/distribution rows.

## Decision

`discovery.slow-accumulator-copytrading-source-fit` is complete.

Verdict: copytrading surfaces can inform RALPH's UX, risk vocabulary, and falsifiers, but they should not drive slow accumulator selection. The serious source path is smart-money/token-flow data, especially Nansen or Dune, with Arkham as enrichment. Under current constraints, this stays `watch / needs-access`, not `paper-candidate`.

## Next Safe Step

Do not build a copytrading scanner from Hyperliquid/Copin/HyperDash for the slow accumulator branch.

Safe next moves are:

- `discovery.slow-accumulator-tool-fit-map`: update the older tool-fit comparison with current source/access facts;
- `discovery.slow-accumulator-following-exit-risk-scan`: define the exit/distribution falsifier before any entry signal work;
- HITL-only: approve a tiny Dune/Nansen export test with fixed spend/key boundaries and no trading/execution permissions.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, scanner, cohort, or strategy promotion changed.
