---
type: comparison
name: Slow Accumulator Tool Fit Map
sources:
  - raw/slow-accumulator-tool-fit-check-2026-07-01.md
  - raw/liquidation-map-prior-art-gap-map-2026-07-01.md
  - raw/liquidation-q1-baseline-kill-switch-2026-07-01.md
related:
  - wiki/concepts/smart-money-accumulation-cohort.md
  - wiki/comparisons/existing-tools-vs-custom-ralph-layer.md
  - wiki/sources/liquidation-map-prior-art-gap-map-2026-07-01.md
  - wiki/sources/liquidation-q1-baseline-kill-switch-2026-07-01.md
created: 2026-07-01T23:15:00Z
last_updated: 2026-08-31T11:41:37Z
---

# Slow Accumulator Tool Fit Map

| Tool | Fit for slow spot accumulation | Role | Caveat |
| --- | --- | --- | --- |
| Nansen | High | Smart-money/token flow/cohort discovery | vendor labels and smart-money sets need validation; pricing/credits must be checked before treating as default |
| Arkham | Medium-high | entity/wallet labels, transaction history, address enrichment | attribution is probabilistic; not enough alone for cohort strategy |
| Dune | Medium-high | custom SQL/API extraction and dashboards | depends on table coverage, freshness, and label availability |
| Copin | Low for this branch | perp copy-trading prior art | focused on perp DEX traders, not slow spot accumulation |
| HyperX/HyperDash/Hypurrscan | Low-medium | Hyperliquid perp intelligence | useful if branch returns to perps, not spot accumulation |
| Freqtrade | Medium as engine | backtest/dry-run/execution once signal exists | not a smart-money data source |
| Tenderly | Low now | transaction simulation/debug later | not a discovery tool |
| EigenPhi | Low now | MEV/flow analytics later | different strategy family |

## Current Answer

For slow mid-cap accumulator following, the tool stack should start as:

> Nansen for signal discovery, Arkham for wallet/entity enrichment, Dune for custom historical extraction, Freqtrade later only as validation/execution engine.

Copin should not be the primary tool unless it can prove coverage of slow spot accumulation, not just perp copy trading.

## Pricing Correction

Do not assume Nansen is affordable or unaffordable from reputation.

As of the checked docs, Nansen pricing is inconsistent across official pages:

- API docs list Pro at $49/month annual or $69/month monthly, Pro starter credits at 1,000, and Free as 100 credits with faster/10x consumption.
- A newer Nansen Academy article says the Free 10x markup was removed, Free has 100 credits plus daily refresh to 10, and Pro has 2,000 credits/month.
- x402 pay-per-call is a separate access path.

Before any paid step, reconcile pricing from the live account/API page and estimate actual endpoint calls and monthly credits for the specific RALPH workflow.

## 2026-08-31 Update

The slow accumulator branch now has three later checks:

- `wiki/notes/2026-08-31-mid-cap-accumulation-flow-scan.md`
- `wiki/notes/2026-08-31-slow-accumulator-copytrading-source-fit.md`
- `wiki/notes/2026-08-31-slow-accumulator-following-exit-risk-scan.md`

Current tool ranking:

| Rank | Tool/source | Current fit | RALPH role | Boundary |
| ---: | --- | --- | --- | --- |
| 1 | Nansen Smart Money netflows | Highest | Aggregated token accumulation/distribution by smart-money labels across rolling windows | `needs-approval`; API/payment/credit access required |
| 2 | Dune | High if exportable | Transparent SQL and reproducible wallet/token-flow tables | `watch / needs-key-or-manual-export` |
| 3 | Arkham | Medium-high | Entity labels, flow/balance enrichment, cross-checking attribution | `needs-access / needs-approval` |
| 4 | DefiLlama/public market data | Context | Liquidity, TVL, stablecoin/yield, market and sector baseline context | active public context only |
| 5 | Hyperliquid public info/stats | Prior art / triage | Perp account/fill checks, market context, leaderboard seed rejection | not a slow spot accumulator source |
| 6 | Copin/HyperDash/BitMEX-style copytrading | Prior art | UX, copytrading risk vocabulary, product patterns to falsify | do not use for active slow accumulator selection |

Key change: copytrading/perp products are no longer ambiguous first candidates for this branch. They mostly solve the wrong-speed problem. Slow accumulator work should start from smart-money/token-flow sources and must treat missing exit/distribution rows as a veto.

No scanner, copy target, cohort, account, key, paid source, scheduler, alert, threshold, execution behavior, or strategy promotion is authorized by this update.
