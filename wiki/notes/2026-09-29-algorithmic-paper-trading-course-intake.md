---
type: source-intake
status: watch-only
created: 2026-09-29T14:55:00Z
topic: algorithmic-trading-system-prior-art
tags:
  - ralph
  - algorithmic-trading
  - paper-trading
  - architecture
  - source-intake
  - research-only
  - no-live-trading
related:
  - ../../automation/work-queues.yaml
  - ../../wiki/research-map.md
  - ../../research-lanes/orderflow/README.md
  - ../../core/profitability-flywheel.md
sources:
  - Tomas-provided transcript/message 2026-09-29
  - https://docs.snaptrade.com/docs/getting-started
  - https://docs.snaptrade.com/docs/trading-with-snaptrade
  - https://docs.snaptrade.com/demo/getting-started
  - https://massive.com/docs
  - https://www.massive.com/stocks
  - https://docs.alpaca.markets/us/v1.4.2/docs/paper-trading
---

# Algorithmic Paper Trading Course Intake

Tomas provided a transcript of a hands-on algorithmic trading course that builds a Python/Django paper-trading system:

- market data from Massive
- brokerage connection and account/order abstraction via SnapTrade
- Alpaca paper trading account for simulated execution
- a 50-stock universe
- 12-month momentum / 12-minus-1 style equity momentum scores
- generated buy signals, portfolio connection, and order submission
- Django models for stocks, price data, momentum scores, trading signals, portfolios, positions, trades, and performance metrics
- management commands, rate-limit handling, caching, admin UI, migrations, and a dashboard

## RALPH Fit

This belongs in RALPH as **algorithmic-system prior art**, not as a crypto strategy candidate.

Useful parts for RALPH:

- clear separation of data ingestion, signal calculation, portfolio state, order state, and performance metrics
- paper-first brokerage/execution boundary
- explicit data models for signals, trades, positions, rebalances, and performance
- dashboard/admin surfaces for inspection before action
- rate-limit-aware data client patterns
- OAuth/brokerage-connection lifecycle as a design reference
- "one boring baseline strategy first" discipline

Weak or non-transferable parts:

- US equity 12-month momentum is slow, portfolio-style, and structurally different from RALPH's crypto/DeFi/orderflow work
- Alpaca/SnapTrade execution and US stock-market assumptions do not map directly to crypto perp venues
- the course demonstrates app construction more than robust strategy validation
- buy-top-momentum and optional short-bottom-momentum is too naive to treat as an edge without walk-forward, costs, slippage, borrow/short constraints, market-regime filters, and baseline comparisons

## Proposed RALPH Placement

Create an "algorithmic systems" reference lane inside the existing RALPH Discovery / Source Scans / Tools area, not a new execution lane.

Use it to improve RALPH's internal architecture:

1. Data rail: adapters for public/no-key archives and future approved APIs.
2. Signal rail: research-only feature rows and candidate labels.
3. Portfolio/paper rail: paper account state, ledger, positions, intended orders, simulated fills.
4. Execution boundary: explicit no-live-trading default, with any broker/API order surface approval-gated.
5. Observability: dashboard/report rows for balances, trades, drawdowns, rebalances, rejected signals, and health.

## Potential RALPH Backlog Item

`algorithmic-paper-trading-system-prior-art`

Shape:

- summarize the course as architecture prior art
- map its Django models to RALPH's existing DEMO-SIM and strategy-destruction-filter entities
- identify which missing RALPH entities are worth adding later, such as intended order, simulated fill, portfolio snapshot, rebalance event, and broker-capability surface
- do not implement SnapTrade, Alpaca, Massive, brokerage auth, live trading, or paper order routing without explicit approval

## Current Access Notes

- SnapTrade docs describe hosted brokerage connection, read vs trade permissions, and Alpaca Paper as a demo brokerage route. Trading support depends on the connected institution/account and permission mode.
- Massive docs describe market data APIs and stock-market data products, including grouped/bulk stock data and WebSocket/API access.
- Alpaca docs describe paper trading as a separate API environment with separate credentials from live.

These are access-watch facts only. No account creation, key generation, paid signup, OAuth flow, brokerage connection, paper order routing, or code integration is approved by this note.

## Decision

Keep this source as **watch-only architecture input** for RALPH's algorithmic/paper-trading section.

Do not copy the 12-month equity momentum strategy into RALPH as a trading candidate. The useful thing is the shape of the system: data -> signal -> portfolio -> paper/order boundary -> audit/reporting.

## Boundary

No live trading, paper order routing, brokerage connection, account/key/API setup, paid service, OAuth flow, scheduler change, alert logic, thresholds, sizing, TP/SL, execution, or strategy promotion changed.
