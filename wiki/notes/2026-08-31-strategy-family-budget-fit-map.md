---
type: note
topic: strategy-family-budget-fit-map
created: 2026-08-31T21:47:36Z
last_updated: 2026-08-31T21:47:36Z
work_item: unknowns.U-009
status: done
scope: research-only
sources:
  - raw/ralph-operating-thesis-voice-note-2026-07-01.md
  - core/operating-thesis.md
  - 2026-08-30-strategy-family-taxonomy.md
  - 2026-08-31-patient-retail-archetype-prioritization.md
  - 2026-08-30-existing-tool-fit-map.md
  - 2026-08-31-wallet-shadowing-archetype-shadowability-map.md
  - 2026-08-31-smart-money-cohort-discovery-layer.md
  - 2026-08-31-wallet-shadow-event-candidate-signal-spec.md
  - https://nansen.ai/api
  - https://docs.nansen.ai/getting-started/credits
  - https://docs.dune.com/resources/credits-billing/how-credits-work
  - https://docs.dune.com/api-reference/overview/billing
  - https://docs.dune.com/learning/how-tos/export-data-out
  - https://0xarchive.io/pricing.md
  - https://www.coinglass.com/pricing
  - https://www.freqtrade.io/en/stable/
  - https://hummingbot.org/faq/
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - ../../decisions/unknowns.md
  - ../../decisions/candidates.md
  - ../../core/profitability-flywheel.md
  - ../../automation/work-queues.yaml
---
# Strategy Family Budget Fit Map

## Purpose

Resolve `U-009` for the current no-key/A2 phase: identify which RALPH strategy families fit Tomas's preferred roughly `$100/month` infra budget, and which families should stay Watch or approval-gated because cost, access, data depth, or live-capable operations would pull the work out of scope.

Pricing and plan facts were checked on 2026-08-31 because this information changes. This note does not approve any purchase, account, key, paid API, scanner, scheduler, demo/testnet setup, live trading, alert change, sizing, TP/SL, execution behavior, or strategy promotion.

## Current Pricing And Access Facts

| Source/tool | Current observed price/access | RALPH access class |
| --- | --- | --- |
| Hyperliquid public info endpoints | Public/no-key routes already validated locally for market context, candles, funding, and known-address checks. | Active public/no-key. |
| DefiLlama | Public/no-key context routes already validated locally. | Active public/no-key. |
| Freqtrade | Official docs describe it as free/open-source and explicitly require dry-run before risking money. | Free software/reference; live/dry-run exchange use still approval-gated. |
| Hummingbot | Official FAQ says Hummingbot software is free; common use adds exchange API keys/private keys and exchange fees. | Free software/reference; execution-capable use is approval-gated. |
| Nansen API | Official API page shows Free `$0`, Pro `$49/month`, 100 trial credits, daily 10-credit refill, Pro 2000 starting credits, and x402 from `$0.01/query`; docs also show a separate updated credit/pricing guide. | Under budget for tiny tests, but account/API/x402/payment approval required before use. |
| Dune | Official docs show Free `2,500` credits/month, Analyst `$75/month`, Plus `$399/month`, and usage-based query/export credits; API exports need an API key. | Free/Analyst under budget, but account/API key/export approval required before active use. |
| 0xArchive | Official pricing markdown shows Free `$0` with `50k` credits/month and Build `$49/month` with `80M` credits/month; Pro is `$199/month`. | Free/Build under budget, but account/API key approval required before active use. |
| CoinGlass | Official pricing page shows Hobbyist `$29/month`, Startup `$79/month`, Standard `$299/month`, Professional `$699/month`. | Hobbyist/Startup under budget, but paid/keyed approval required and rate limits may restrict research. |
| Arkham | Existing 2026-08-31 Arkham checklist found API docs/access, but direct no-key probes failed and useful data requires account/API-plan-or-trial/API-key approval. | Needs approval; do not treat as active budget-fit until a concrete plan/export is approved. |

## Budget-Fit Strategy Matrix

| Family | Budget fit | Why | Allowed next shape |
| --- | --- | --- | --- |
| Market-level funding/basis baseline | Strong now | Uses active no-key Hyperliquid and DefiLlama context; slow enough for Tomas; no prediction needed. | Manual snapshots and fixed-window paper accounting only. |
| Local alert-edge / TA / strategy-destruction filter | Strong now | Uses existing local Crypto Updates labels, public candles, and local validation scripts. | Continue only when row thresholds change or a named candidate needs a kill test. |
| Public orderflow feature research | Strong for small local captures | Binance/Hyperliquid/Bybit-style public feeds are no-key; storage/cpu cost is local and bounded. | One-shot bounded capture/alignment when a named alert/replay question exists; no scheduler or live alert change. |
| Offline range/grid falsifier | Strong as offline research | Public candles and existing local/vectorbt-style tools can compare against no-trade, hold, and simple grid baselines. | Offline public-candle falsifier only; no product account, bot run, wallet, or API key. |
| Hyperliquid known-address wallet-delay tests | Medium | Public/no-key known-address fills and candles can support tiny recent-row delay falsifiers, but selection bias and capped history dominate. | Tiny frozen event/fill ledger proposal only after named trigger. |
| Smart-money / slow mid-cap accumulation | Medium after approval | Fits latency best, but serious rows likely require Nansen/Dune/Arkham-style export; Nansen Pro and Dune Analyst are within budget, but access and data sufficiency are unproven. | HITL-approved tiny export/API sample; no scanner or cohort before rows exist. |
| Aggregate cohort flow | Medium after approval | Cohort aggregation may reduce single-wallet noise, but it needs labelled/exportable rows and exits. | Same as slow accumulation: approved tiny export with exit rows and baselines. |
| CoinGlass derivatives/liquidation/orderflow source work | Medium after approval | Hobbyist/Startup are under `$100/month`; may help data coverage, but liquidation Q1 was already killed and API use is paid/keyed. | Only a branch-specific source test if it answers a surviving candidate question. |
| 0xArchive historical/replay data | Medium after approval | Free/Build are under budget and fit Hyperliquid/Lighter replay, but account/key/export boundaries apply. | Approved API-key sample only for a named replay need, not broad data hoarding. |
| Hummingbot/Freqtrade execution or dry-run | Weak now | Software is free, but real usefulness crosses exchange account/API/key, bot operations, and execution-adjacent risk. | Documentation/reference and offline validation hygiene only until explicitly approved. |
| High-frequency market making, DEX arb, MEV, live copytrading | Poor | Edge depends on latency, capital, execution, keys, live infrastructure, and operational risk, not just monthly data cost. | Discard/reference unless Tomas explicitly reopens with a narrow non-execution question. |

## Budget Allocation Rule

Within the current `$100/month` constraint, RALPH should treat free/public/local work as active and paid/keyed sources as proposal-only:

- `$0`: Hyperliquid public info, DefiLlama context, local Crypto Updates data, public candles, vectorbt/local scripts, Freqtrade/Hummingbot docs, small manual public web research.
- `$1-$50 proposed`: Nansen Pro or x402 tiny calls, 0xArchive Build, tiny VPS/storage only if a local process later needs it; all require explicit approval before use.
- `$51-$100 proposed`: Dune Analyst, CoinGlass Startup, or one narrow data-source month; do not stack multiple subscriptions inside the budget unless Tomas approves a specific test.
- `>$100`: Dune Plus, CoinGlass Standard+, 0xArchive Pro+, broad paid analytics stacks, enterprise-style feeds, and production order-book replay are out of current budget.

The default spending plan is still `$0/month` until a branch names:

1. the exact missing rows;
2. why public/local proxies cannot answer it;
3. the cheapest approved source;
4. the expected row count;
5. the stop condition after one tiny sample.

## Decision

`U-009` is resolved for current routing.

Best budget-fit families now:

1. market-level funding/basis baseline;
2. local alert-edge/TA strategy destruction;
3. bounded public orderflow research;
4. offline range/grid falsifiers;
5. tiny Hyperliquid known-address/event delay falsifiers.

Best under-budget but approval-gated families:

1. slow smart-money/mid-cap accumulation through a tiny Nansen/Dune/Arkham-style export/API sample;
2. 0xArchive replay for a named Hyperliquid/Lighter data need;
3. CoinGlass derivatives context only if a surviving candidate needs its specific data.

Current non-fit families: high-frequency market making, DEX arb/MEV, broad live copytrading, production scanner stacks, and any strategy requiring live execution before T1/T2/T3 evidence.

`U-035` remains open because this note is a family-level budget map, not a final endpoint-by-endpoint credit estimate for Nansen/Arkham/Dune/0xArchive.

## Boundary Delta

Changed: wiki/router/queue/state/log/index/memory only.

Boundary delta: no account, key, paid service, API use, scanner, collector, scheduler, cron, alert wording, threshold, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, cohort creation, paper-candidate wording, or strategy promotion changed.
