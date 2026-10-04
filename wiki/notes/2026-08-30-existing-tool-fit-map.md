---
type: note
topic: existing-tool-fit-map
created: 2026-08-30T15:27:00Z
last_updated: 2026-08-30T15:27:00Z
work_item: discovery.existing-tool-fit-map
status: complete
scope: research-only
sources:
  - ../../raw/tool-first-pivot-2026-07-01.md
  - 2026-08-30-build-vs-buy-decision-memo.md
  - 2026-08-30-framework-shortlist-comparison.md
  - 2026-08-30-event-driven-bot-repo-search.md
  - 2026-08-30-aggregate-flow-signal-feasibility.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-30-hyperliquid-leaderboard-address-sample.md
  - 2026-08-30-orderflow-replay-alignment-audit.md
tags:
  - ralph
  - research-note
  - source-scan
related:
  - ../concepts/tool-first-not-build-first.md
  - ../comparisons/existing-tools-vs-custom-ralph-layer.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
  - ../../automation/retrieval-router.yaml
---
# Existing Tool Fit Map

## Purpose

This closes `discovery.existing-tool-fit-map` as a compact tool-first routing map.

The goal is not to choose a tool to run. The goal is to prevent RALPH from building generic bot, scanner, data, paper-trading, grid, copytrading, or replay infrastructure before checking whether an existing rail already covers the job.

No package install, clone, account setup, key, paid API, scheduler, live alert, live copy, live trading, or strategy promotion changed.

## Current Fit Map

| Job | Best current rail | Access state | RALPH stance |
| --- | --- | --- | --- |
| Candle setup sanity checks | `vectorbt` plus current local event-study harness | active-local/ephemeral | Use for row-level parity and aggregate sanity checks before trusting custom setup stats. |
| Validation hygiene | Freqtrade docs and concepts | verified-public / not locally runnable | Use lookahead, recursive/startup-variance, dry-run, and trade-export discipline as checks; no setup without approval. |
| Order-book/fill realism | hftbacktest and NautilusTrader concepts | verified-public/reference | Use when a candidate needs order-book replay or fill-realism reasoning; do not expand replay work without a concrete candidate. |
| Event-driven architecture | NautilusTrader, Barter, Basana | verified-public/reference | Architecture references for event/command separation, audit streams, mock execution, and paper/backtest/live parity claims. |
| Hyperliquid execution/product examples | Supurr, Perp Lobster, Go/Rust Hyperliquid grid/MM repos, browser-wallet apps | verified-public / execution-adjacent | Source claims and risk-boundary specimens only; no install/run/setup because useful paths require accounts, wallets, keys, builder fees, paid infra, or live-capable code. |
| Public orderflow data | Binance and Hyperliquid public WebSockets plus local `crypto-updates` feature layer | active-public-proxy | Capture/feature extraction works; remains pipeline evidence until exact alert/orderflow overlap exists. |
| Alert/review labels | Crypto Updates monitor index and local SQLite/JSONL | active-local | Use as research labels and paper evidence only; no alert wording or threshold change from analysis alone. |
| Hyperliquid wallet/address verification | Hyperliquid public stats leaderboard and official no-key info endpoints | active discovery-only / active no-key verification | Good for seed discovery and known-address fill/state checks; not copyability evidence. |
| Slow accumulator cohort discovery | Nansen/Arkham/Dune-style data products | needs-access / needs-approval | Likely right source family, but broad programmatic use is paid/keyed or unverified here. |
| Grid/range bot trial | Productized bots and public Hyperliquid grid/MM repos | watch | Treat as prior art. A separate grid-range trial design must prove what RALPH wants to learn without account/key/live drift. |
| MEV/EVM simulation | Historical MEV case file, Tenderly/EigenPhi later if needed | case-file/deferred | Keep as validation lessons only unless a future strategy family explicitly needs EVM simulation. |

## Build Only If Missing

The custom RALPH layer remains narrow:

- select branches;
- turn sources into falsifiable claims;
- verify access and bias;
- maintain paper/shadow evidence;
- run rejection gates;
- write durable source-backed memory;
- build small adapters only when an existing rail cannot provide the RALPH output contract.

## Current Decisions

C-026 stays `Candidate`, but its first pass is now complete: the current existing-tool map exists.

U-027 stays `Open` because tool coverage is not a one-time question. It remains open for future branch-specific checks, especially pricing/export/API limits and exact output-contract compatibility.

U-018 also stays `Open` for wallet-shadowing-specific workflow coverage because Nansen/Arkham/Dune/Copin/HyperX access is not fully verified in this workspace.

## Cheapest Next Actions

- For a new validation branch: name the existing framework or local rail checked before writing custom code.
- For wallet/cohort research: find one no-key/exportable public source that can produce actual cohort rows before proposing a paid/keyed data path.
- For grid/range work: produce a trial design first; do not connect a wallet, create an API wallet, approve a builder fee, or run a bot.
- For orderflow: wait for exact symbol/time alert overlap before another signal-value pass.

## Boundary

This map is routing memory only. It authorizes no dependency adoption, account, key, paid data, scheduler, live execution, alert wording, thresholds, risk/sizing/TP/SL, copytrading, public posting, or strategy promotion.
