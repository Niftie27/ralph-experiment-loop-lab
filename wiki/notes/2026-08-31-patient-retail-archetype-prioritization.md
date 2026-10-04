---
type: note
topic: patient-retail-archetype-prioritization
created: 2026-08-31T05:44:00Z
last_updated: 2026-08-31T05:44:00Z
work_item: discovery.patient-retail-archetype-prioritization
status: complete
scope: research-only
sources:
  - ../concepts/patient-retail-strategy-map.md
  - ../comparisons/patient-retail-strategy-archetypes.md
  - ../concepts/funding-basis-structural-baseline.md
  - 2026-08-31-mid-cap-accumulation-flow-scan.md
  - 2026-08-30-hyperliquid-data-feasibility-spike.md
  - 2026-08-30-grid-range-existing-tool-trial-design.md
  - 2026-08-30-strategy-family-taxonomy.md
  - https://api-docs.defillama.com/
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
  - https://dune.com/queries/7879081
  - https://agents.nansen.ai/
  - https://arkm.com/api/docs
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - ../concepts/patient-retail-strategy-map.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---
# Patient-Retail Archetype Prioritization

## Purpose

This closes `discovery.patient-retail-archetype-prioritization` for a bounded prioritization pass.

Question: which patient-retail archetype should RALPH prefer next, given Tomas's constraints, current no-key access, evidence gates, and failure modes?

No live trading, copying, alerts, thresholds, execution, risk, sizing, TP/SL, keys, accounts, paid services, scheduler changes, or strategy promotion changed.

## Ranking Criteria

The patient-retail branch should score high only when it:

- survives hours/days latency;
- has public/no-key or already-local data;
- can be falsified before paid access or custom build;
- has a clear dumb baseline;
- has a known main failure mode;
- can produce paper/demo evidence without touching live execution.

## Current Access Facts

- Hyperliquid public `info` endpoint works from this workspace. `metaAndAssetCtxs` returned 233 markets with per-market context fields including funding, open interest, mark/mid/oracle prices, and daily volume.
- DefiLlama docs expose no-key free endpoints for protocols, prices, stablecoins, yields, DEX volume, fees, revenue, and open interest; the local `api.llama.fi/protocols` check returned HTTP 200.
- Dune can express useful on-chain transfer queries and a public smart-money net-flow query exists, but unauthenticated Dune API/result calls returned `401 invalid API Key`.
- Nansen appears closest to the smart-money accumulation target, but useful endpoints are API/key or x402-paid.
- Arkham has entity/address/label/holder/flow APIs but is access/key-gated in this workspace.

## Prioritized Archetypes

| Rank | Archetype | State | Why | Next falsifier |
| ---: | --- | --- | --- | --- |
| 1 | Funding/basis structural baseline | `best-next-no-key` | Slow, measurable, no prediction required, and Hyperliquid exposes live public funding/open-interest context. It is a baseline, not an alpha claim. | Build a read-only public-data feasibility note/monitor spec: funding persistence, flip frequency, OI/liquidity, costs, and tail/liquidation assumptions. |
| 2 | Smart-money / mid-cap accumulation cohort | `high-upside-access-gated` | Best fit for Tomas's slow-informational thesis, but current no-key sources do not produce frozen wallet plus token-flow plus exit-flow rows. | HITL-bound Dune/Nansen export test or manual export; require at least 20 wallets over a 7-14 day window with entry and exit rows. |
| 3 | Range/grid structural-statistical | `watch-offline-falsifier` | Patient and productized, but trend tails and inventory risk dominate. Existing tools already cover execution/product side. | Offline public-candle falsifier against no-trade and simple range baselines before any product/demo/account step. |
| 4 | Token unlock / public schedule | `watch-source-first` | Slow public information fits latency, but the naive trade is crowded and easy to overfit. | Find one no-key source with exportable unlock rows, recipient class, liquidity, and post-unlock price/volume labels. |
| 5 | Delegated copy / copy vaults | `prior-art-only` | Can teach UX and risk surfaces, but adds operator, fee, survivorship, and blow-up risk. | Treat products as source claims; require independent forward-paper evidence before any candidate. |
| 6 | Event-timing wallets | `radar-only` | Possible anomaly value, but copyability and attribution fail the latency constraint. | Keep source-ranked event radar; no copy candidate without separate frozen event windows and forward-paper validation. |

## Decision

The next practical patient-retail branch should be `funding-basis-baseline-monitor`, not another wallet scanner.

Reason: it is the best no-key, slow, falsifiable baseline now available. It gives RALPH a no-prediction comparison floor. Smart-money accumulation remains the preferred alpha branch in spirit, but it is access/export-gated after the 2026-08-31 mid-cap scan.

C-025 moves ahead of C-022/C-024/C-029 for the next no-key branch. C-022/C-024/C-029 remain candidates, but should wait for Dune/Nansen/Arkham access/export evidence or manual rows. C-035 strategy leg garden remains useful as exploration, but it should not outrank the funding/basis baseline if the goal is the next measurable patient-retail artifact.

U-021 is partially answered: slow structural funding/basis is the most immediately shadowable/measurable archetype, while smart-money accumulation is conceptually stronger but access-gated. U-025 is partially answered for current constraints: build the funding/basis baseline first, keep smart-money cohort as the next access-gated alpha branch.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, or strategy promotion changed.
