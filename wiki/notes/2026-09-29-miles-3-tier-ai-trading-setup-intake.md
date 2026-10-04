---
title: Miles 3-tier AI trading setup intake
date: 2026-09-29
type: source-intake
status: watch-only
tags:
  - ralph
  - source-intake
  - algorithmic-systems
  - operator-interface
  - human-in-the-loop
  - watch-only
---

# Miles 3-tier AI trading setup intake

## Source

Tomas provided a Miles Deutscher newsletter transcript about a 3-tier AI trading setup:

1. Tier 1: read-only broker/account awareness through an AI connector.
2. Tier 2: execution through Interactive Brokers Trader Workstation/API.
3. Tier 3: phone control through a Telegram bot and always-on listener.

The transcript also included a crypto-bot prompt that starts by interviewing the trader before touching any exchange or execution layer.

## Classification

This belongs in RALPH as operator-interface and human-in-the-loop execution architecture prior art.

It does not belong in RALPH as an approved execution feature, live broker connector, or strategy edge.

Best RALPH placement:

- Discovery / Source Scans / Tools
- Future operator-console notes
- Future human-in-the-loop execution safety design, only if Tomas explicitly approves that branch

## What transfers well to RALPH

- Tiered autonomy model: read-only before paper before execution.
- Interview-first design: force the operator to define assets, timeframes, entries, exits, invalidation, position sizing, max risk, and when not to trade before any bot code exists.
- `Trading_Context.md` as an explicit operating-context artifact rather than hidden prompt memory.
- Trade ledger and learning loop: log every trade, review every 10 trades, run a fuller analysis every 25 trades, and do not mutate strategy after one outcome.
- Mobile control commands such as `/positions`, `/balance`, `/lasttrade`, `/ledger`, `/pause`, and `/resume`.
- Paper-first and approval-first flow before real orders.
- Explicit account capability/permission thinking.

## RALPH-specific interpretation

For RALPH, the strongest use is not "trade from phone." The strongest use is a disciplined operator console:

- ask "what is my current exposure?"
- summarize open risk and stale theses
- show why a setup is blocked
- generate a proposed action ticket for human review
- log the final human decision
- support a hard `/pause` state

This complements the existing RALPH research system because RALPH already has strategy-destruction filters, DEMO-SIM evidence, BTC-gated context, and no-go boundaries. The Miles source adds a useful product/operations shape around those pieces.

## What should not transfer

- Do not connect IBKR, Claude, Trader Workstation, exchange APIs, broker accounts, wallet keys, or Telegram order execution as part of this intake.
- Do not disable confirmations.
- Do not put account-control tokens on an always-on machine without a separate security design.
- Do not treat lower friction as pure good. Some friction prevents revenge trading, fatigue trades, and badly worded text commands becoming orders.
- Do not let a mobile bot become the source of market truth; RALPH's BTC regime, orderflow, validation, and analyst/source context still need to gate decisions.

## Verified access notes

- Interactive Brokers documents AI/MCP-style integrations that connect supported AI platforms to IBKR account data and account actions after authorization.
- IBKR Trader Workstation API settings include a read-only mode, enabled by default as a precaution, and disabling it changes the risk profile materially.
- IBKR AI Instructions flow appears review-and-submit oriented for turning AI-generated instructions into live orders.
- Claude/Anthropic MCP connectors are a real tool pattern, but remote connectors and local desktop extensions have different security boundaries.

## Recommendation

Adopt the source as a watch-only RALPH architecture reference.

Near-term useful addition:

- Create a RALPH operator-context template inspired by the prompt: allowed assets, disallowed assets, BTC gate requirement, no-trade conditions, max autonomy, evidence requirements, review cadence, and logging schema.

Do not build Tier 2 or Tier 3 execution. If this ever moves beyond notes, the first acceptable branch is read-only operator visibility plus a ledger/review workflow. Any paper/live execution, exchange account, broker account, API key, Telegram control surface, sizing, TP/SL, or order-routing capability requires separate explicit approval and a fresh safety spec.

