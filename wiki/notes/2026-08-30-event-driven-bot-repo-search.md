---
type: note
topic: event-driven-bot-repo-search
created: 2026-08-30T15:24:00Z
last_updated: 2026-08-30T15:24:00Z
work_item: discovery.event-driven-bot-repo-search
status: complete
scope: research-only
sources:
  - https://github.com/nautechsystems/nautilus_trader
  - https://github.com/barter-rs/barter-rs
  - https://github.com/gbeced/basana
  - https://github.com/featherenvy/botvana
  - https://github.com/Supurr-App/Hyperliquid-Supurr-Bot
  - https://github.com/smohantty/hyperliquid-trading-bot
  - https://github.com/zer0cache/hyperliquid-market-maker-bot
  - https://github.com/ThisNewMark/perplobster
  - https://github.com/kylebolton/HyperliquidMarketMaker
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - 2026-08-29-github-operator-source-map.md
  - 2026-08-30-framework-shortlist-comparison.md
  - 2026-08-30-trading-bot-operation-map.md
  - templates/community-idea-kill-test.md
  - ../../loops/framework-repo-discovery-loop.md
  - ../../decisions/candidates.md
---
# Event-Driven Bot Repo Search

## Purpose

This closes `discovery.event-driven-bot-repo-search`.

The branch searched public GitHub/web results and fetched public GitHub metadata/READMEs only. It did not clone repos, install dependencies, run third-party code, create accounts, configure keys, approve wallet connections, change schedulers, or touch live trading surfaces.

## Search Result

Event-driven bot sources split into three useful buckets for RALPH:

1. Mature architecture references.
2. Small educational/framework references.
3. Execution-adjacent Hyperliquid product/bot claims to falsify, not run.

## Source Map

| Source | Evidence observed | Access class | RALPH use | Decision |
| --- | --- | --- | --- | --- |
| `nautechsystems/nautilus_trader` | Public, production-grade Rust/Python engine spanning research, deterministic simulation, and live execution in one event-driven architecture; supports many venues and backtesting with quote/trade/order-book/custom data. | verified-public / heavy-framework | Strong architecture and research-to-live parity reference; do not adopt or run unless a later candidate needs it. | Watch |
| `barter-rs/barter-rs` | Public Rust ecosystem for live, paper, and backtesting; separates data, execution, integration, strategy, risk, audit stream, and state replica concepts. | verified-public | Good compact event-loop/domain model reference for public market-data + mock execution separation. | Watch |
| `gbeced/basana` | Public Python async/event-driven framework focused on crypto; includes backtesting, CCXT live integration, and a Binance order-book mirror example. | verified-public | Lightweight educational reference for order-book synchronization and async event-driven shape. | Watch |
| `featherenvy/botvana` | Public Rust event-driven distributed platform; README says early development, FTX/Binance support, thread-per-core engines, market-data/trading/exchange/audit components. | verified-public / stale-risk | Architecture specimen only; FTX dependency and early-stage state make it poor as an active rail. | Rejected as active rail |
| `Supurr-App/Hyperliquid-Supurr-Bot` | Public Hyperliquid Rust engine claiming single-binary backtest/paper/live parity, strategy trait, Hyperliquid-specific grid/DCA/MM/arb/tick strategies, and AI/operator workflow. | verified-public / execution-adjacent | Source claim to falsify for Hyperliquid-specific lightweight engine ideas; not an install target. | Watch |
| `smohantty/hyperliquid-trading-bot` | Public Rust Hyperliquid grid bot with account registry, API wallet private key requirement, dry-run simulation block, and live dashboard. | verified-public / key-required-for-use | Execution-adjacent grid/product specimen; useful for config/account risk patterns. | Watch |
| `zer0cache/hyperliquid-market-maker-bot` | Public Go Hyperliquid market-making bot with typed channel pipeline, paper/live modes, markout, toxicity, rate-limit budgeting, and diagnostic binaries; requires QuickNode and API wallet for live. | verified-public / key-and-paid-infra-required-for-use | Strong market-making architecture/risk-control specimen; do not run because use requires paid/keyed infrastructure and is explicitly real trading software. | Watch |
| `ThisNewMark/perplobster` | Public Hyperliquid market-maker/grid bot with WebSocket architecture, dashboard, setup wizard, wallet connection, builder fee, and trade-only API wallet flow. | verified-public / account-wallet-required | Productized workflow specimen and risk-boundary example; no setup or skill install. | Watch |
| `kylebolton/HyperliquidMarketMaker` | Public Next.js browser-wallet market-making app with real-time data and automated trading setup through browser wallet connection. | verified-public / wallet-required | Reject as active RALPH rail because the primary UX is wallet-connected automated trading. | Rejected as active rail |

## What RALPH Should Learn

Architecture patterns worth preserving:

- split strategy logic from exchange transport;
- feed strategies events and have them emit commands rather than call exchange APIs directly;
- keep paper/backtest/live semantics as close as possible, but treat parity claims as source claims until verified;
- make risk/audit/monitoring separate consumers of state, not hidden side effects in strategy code;
- keep public market-data intake separate from private execution and account state;
- prefer diagnostic/read-only tools before any executable bot path.

Claims to distrust:

- "backtest to production in minutes" is a deployment claim, not evidence of edge;
- grid/MM bots can look operationally mature while still hiding adverse selection, inventory, funding, fee, and tail-risk failure modes;
- AI/operator skills around deployment raise the risk of accidental execution drift;
- browser-wallet or API-wallet setup is out of bounds until Tomas approves an exact separate action.

## Cheapest Kill Tests

For event-driven architecture:

- Before adopting a framework, map one RALPH candidate into the framework's smallest offline/paper interface and check whether the framework reduces validation work versus current local scripts.

For Hyperliquid grid/MM repo claims:

- Use the community idea kill-test template to extract one claim at a time, then require baseline lift versus a simple range/grid or timestamp-matched hold before any candidate can exist.

For execution-adjacent repos:

- Reject as active rails when their useful path requires wallet connection, private key, API wallet, paid QuickNode, builder fee approval, live mode, or deployment skill installation.

## Decision

`discovery.event-driven-bot-repo-search` is done for this bounded pass.

No repo becomes a strategy candidate. NautilusTrader, Barter, and Basana are the cleanest architecture references. Supurr, the Go Hyperliquid market maker, Perp Lobster, and similar Hyperliquid-specific bots are useful source claims and risk-boundary specimens. Browser-wallet and API-wallet bots are not active rails.

C-009 remains `Candidate` as a framework/repo research lane. The next useful follow-up is either an existing-tool fit map or a tiny community kill-test record for one specific grid/MM claim, not cloning/running any bot.

## Boundaries

No live copying, live trading, orders, wallet keys, exchange keys, paid services, account setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, skill installation, or strategy promotion changed.
