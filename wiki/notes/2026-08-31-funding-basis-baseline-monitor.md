---
type: note
topic: funding-basis-baseline-monitor
created: 2026-08-31T06:28:00Z
last_updated: 2026-08-31T06:28:00Z
work_item: discovery.funding-basis-baseline-monitor
status: complete
scope: research-only
sources:
  - ../concepts/funding-basis-structural-baseline.md
  - 2026-08-31-patient-retail-archetype-prioritization.md
  - 2026-08-31-strategy-leg-garden-harvest.md
  - 2026-08-30-hyperliquid-data-feasibility-spike.md
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals
  - https://api-docs.defillama.com/
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - strategy-family
  - baseline-comparison
  - funding
related:
  - ../concepts/funding-basis-structural-baseline.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---
# Funding/Basis Baseline Monitor

## Purpose

This closes `discovery.funding-basis-baseline-monitor` as a bounded read-only feasibility and spec pass.

Question: can RALPH define a no-prediction funding/basis baseline monitor using public/no-key data, before any exchange account, demo/testnet setup, live alert, sizing, or execution work?

No live trading, copying, orders, alerts, thresholds, execution, risk sizing, leverage, TP/SL, accounts, keys, paid services, scheduler changes, or strategy promotion changed.

## Access Verification

Workspace checks on 2026-08-31:

| Route | Result | Fit |
| --- | --- | --- |
| Hyperliquid `metaAndAssetCtxs` | HTTP 200; 233 perp markets and 233 market-context rows returned without a key | Active public market snapshot rail |
| Hyperliquid `fundingHistory` for BTC | HTTP 200; 500 funding-history rows returned without a key | Active public funding-history rail |
| DefiLlama yields pools | HTTP 200; 17,291 pool rows returned without a key | Active public baseline/yield context |
| DefiLlama stablecoins | HTTP 200; 422 pegged assets returned without a key | Active public stablecoin/context rail |
| DefiLlama open-interest overview | HTTP 200; protocol/open-interest overview returned without a key | Active public venue/context rail, not trade evidence |

Sample Hyperliquid market context fields included `funding`, `openInterest`, `dayNtlVlm`, `premium`, `oraclePx`, `markPx`, `midPx`, `impactPxs`, and daily base volume. This is enough for a monitor spec, not enough for an execution claim.

## Baseline Contract

The monitor should measure market-structure carry, not predict direction.

Minimum row shape:

| Field group | Required fields |
| --- | --- |
| Identity | `observed_at`, `venue`, `coin`, `source_endpoint` |
| Funding | current funding, funding-history window, funding sign, funding continuity |
| Price/basis | mark, mid, oracle, premium, prev-day price |
| Liquidity | open interest, daily notional volume, daily base volume, impact prices if available |
| Context | broad market regime, stablecoin/yield baseline context, data freshness |
| Accounting assumptions | conservative hedge proxy, estimated rebalance cost class, borrow/yield proxy, tail-risk flags |
| Decision state | observe, reject-for-now, needs-paper-accounting, needs-HITL |

The first artifact should be a table of observations and diagnostics. It should not emit trade instructions.

## Checks To Run

Funding persistence:

- Track whether positive funding persists across multi-hour windows.
- Track how often sign flips occur.
- Separate current funding snapshots from historical funding windows.
- Reject any claim that relies on one snapshot.

Liquidity and crowding:

- Rank markets by public open interest and daily notional volume.
- Exclude thin markets from any later paper-accounting proposal.
- Flag cases where high funding appears only in low-liquidity or impact-sensitive markets.

Cost and basis realism:

- Compare gross carry to conservative rebalance and hedge-cost assumptions.
- Keep stablecoin/yield context as the dumb baseline.
- Treat `long spot + short perp` as a model only until a real spot/perp venue pair is approved and verified.

Tail-risk checks:

- Funding flips negative.
- Basis widens during stress.
- Mark/oracle divergence grows.
- Hedge leg liquidity disappears.
- Stablecoin/yield baseline degrades.
- Any account/margin/liquidation assumption becomes necessary.

## Dumb Baselines

Use these as comparison floors before any paper/demo proposal:

- hold stablecoins;
- no-trade;
- simple DeFi yield proxy from public DefiLlama yield data;
- spot-only exposure over the same market window;
- equal-weight top-liquid perp market observation with no carry selection.

## Kill Criteria

Kill or downgrade the branch before any account/demo step if:

- public data cannot be collected repeatedly without keys or fragile scraping;
- positive funding is rare, unstable, or mostly low-liquidity;
- gross carry is plausibly below stablecoin/yield or no-risk proxy after conservative costs;
- the model requires leverage, liquidation math, account state, or venue-specific margin assumptions to look viable;
- tail-risk flags dominate the observed carry.

## Next Artifact

If this branch continues, the next safe artifact is `validation.funding-basis-public-snapshot-table`: a local one-shot public-data collector and Markdown/JSON report over top liquid Hyperliquid perp markets.

That proposal remains read-only and no-key. It may collect public snapshots and funding history, but it must not create an exchange account, place trades, create alerts, define live thresholds, size risk, touch schedulers, or claim profitability.

## Decision

`funding-basis-baseline-monitor` is feasible as a no-key research baseline. It should become RALPH's comparison floor for patient-retail branches, especially smart-money/mid-cap accumulation.

It is not a strategy candidate promotion. The value is a slow, measurable reference class: if future wallet/cohort alpha cannot beat a dumb funding/basis or stablecoin/yield baseline after costs and tail-risk accounting, the alpha branch should be rejected.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
