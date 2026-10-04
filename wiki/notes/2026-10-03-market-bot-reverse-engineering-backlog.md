---
type: research-note
created: 2026-10-03T16:30:00Z
topic: market-bot-reverse-engineering
status: backlog
work_item: discovery.market-bot-reverse-engineering-source-map
tags:
  - ralph
  - research-only
  - source-scan
  - trading-bots
  - prior-art
  - no-live-trading
  - no-execution
related:
  - ../research-map.md
  - ../../automation/work-queues.yaml
  - 2026-08-30-build-vs-buy-decision-memo.md
  - 2026-08-30-existing-tool-fit-map.md
---
# Market Bot Reverse-Engineering Backlog

Tomas asked why RALPH is not systematically identifying bots already on the market and reverse-engineering them.

## Backlog Item

`discovery.market-bot-reverse-engineering-source-map`

Goal: map existing public trading bots, bot frameworks, copytrading products, grid/market-making systems, signal products, and open-source strategy repos, then extract falsifiable ideas for RALPH.

## Scope

Research-only source/prior-art work:

- identify public bots, frameworks, products, and strategy repositories
- classify access: public docs, public repo, public demo, paid product, account-gated, API-gated, closed/proprietary
- extract observable strategy families: grid, DCA, momentum, mean reversion, funding/basis, copytrading, market-making, arbitrage, liquidation/flow, news/event, AI-agent/HITL
- extract their validation claims: backtest style, paper/live proof, risk controls, fees/slippage, drawdown disclosure, exchange support, data needs
- translate interesting claims into RALPH kill tests, baselines, and data requirements
- prefer existing tools and public rails before custom RALPH builds

## Reverse-Engineering Boundary

Allowed:

- read public docs, repos, marketing pages, public examples, public configs, public issue discussions
- run no-key open-source examples locally when safe and useful
- inspect strategy logic from permissively available code
- create source maps, prior-art notes, falsifier templates, and candidate kill-test ideas

Not allowed without explicit approval:

- paid signups
- credentialed scraping
- bypassing access controls
- copying proprietary code or violating licenses
- exchange/broker/wallet/API-key setup
- live trading, copytrading, execution routing, or account connection
- turning a bot idea into watcher/paper/demo/live logic

## Initial Candidate Classes

- Open-source bot frameworks: Freqtrade, Hummingbot, Jesse, OctoBot, Nautilus/hftbacktest-adjacent research tools.
- Commercial bot products: Pionex/grid tools, 3Commas-style automation, Bitsgap-style grid/DCA, exchange-native bots.
- Copytrading and wallet-following products: Copin, GMGN, Hyperliquid public leaderboard routes, Nansen/Arkham-style account discovery where approved.
- Strategy/content sources: public GitHub repos, operator writeups, product docs, benchmark claims, postmortems.

## First Useful Output

Create a table with:

- bot/product/repo name
- access class
- supported markets/venues
- observable strategy family
- claimed edge
- evidence quality
- data needed to falsify
- cheapest RALPH kill test
- legal/licensing/access notes
- decision: discard / watch / source idea / needs approval / candidate kill-test

## Decision

Add to backlog as a discovery/source-scan branch. Do not create a recurring loop yet. First run should be bounded and manual; create automation only if it produces a stable source list that genuinely benefits from periodic refresh.

## Boundary

No live trading, orders, keys, paid APIs, account setup, credentialed scraping, access-control bypassing, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed.
