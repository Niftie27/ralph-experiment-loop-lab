---
type: note
topic: trading-bot-operation-map
created: 2026-08-30T09:39:00Z
last_updated: 2026-08-30T09:39:00Z
work_item: investigation.trading-bot-operation-map
status: complete
scope: research-only
sources:
  - https://www.freqtrade.io/en/stable/
  - https://www.freqtrade.io/en/stable/lookahead-analysis/
  - https://www.freqtrade.io/en/stable/recursive-analysis/
  - https://hummingbot.org/docs/
  - https://hummingbot.org/strategies/v2-strategies/
  - https://nautilustrader.io/docs/latest/
  - https://jesse.trade/
tags:
  - ralph
  - research-note
  - misc-research
related:
  - 2026-07-01-trading-bot-build-guide-map.md
  - 2026-08-30-trading-bot-build-guide-map-closeout.md
  - 2026-08-30-framework-shortlist-comparison.md
  - 2026-08-30-mev-bot-failure-mode-extraction.md
  - 2026-08-30-strategy-family-taxonomy.md
  - ../../core/profitability-flywheel.md
  - ../../core/testing-protocol.md
---
# Trading Bot Operation Map

## Purpose

This closes `investigation.trading-bot-operation-map`.

The question is not "what bot should RALPH build?" The useful question is: if a future candidate earns prototype work, what operating surface must exist so RALPH does not confuse a script, a backtest, or a dashboard with a trading system?

## Operating Surface

| Surface | RALPH role | Minimum required before use |
| --- | --- | --- |
| Strategy specification | Plain-English contract for the idea | Mechanism, venue, timeframe, data rail, baseline, falsifier, failure modes |
| Data intake | Reproducible evidence source | Source, freshness, timestamp semantics, gaps, fees, symbol mapping, survivorship risk |
| Signal engine | Research-only decision function | Deterministic inputs, no future leakage, explicit no-trade state, explainable feature snapshot |
| Backtest/replay | T2 kill-test rail | Baseline lift, fees/slippage, OOS/walk-forward, multiple-testing penalty, row-level audit |
| Forward paper/shadow | T3 reality check | Forward-only samples, missed-fill labels, timeouts, collisions, stale-data flags, R outcomes |
| Monitoring | Operator visibility | Logs, state, health checks, data freshness, drift, unexpected position/order detection |
| Postmortem | Learning layer | Expected mechanism versus realized follow/fade/noisy outcome and root-cause flags |
| Human approval gate | Boundary layer | Required before accounts, keys, paid services, live alerts, risk, sizing, orders, or persistent execution |

## Framework Lessons

Freqtrade contributes staged operation discipline: backtesting, dry-run, live run modes, web or Telegram monitoring, and explicit lookahead/recursive-analysis checks. RALPH should treat those as bias and paper/live divergence warnings even while Freqtrade is not an active local dependency.

Hummingbot contributes long-running process vocabulary: scripts, controllers, executors, market data providers, and configurable deployments. For RALPH, this is a reminder to separate candidate logic from per-venue configuration and to keep live-capable controller work approval-gated.

NautilusTrader contributes the clearest architecture reference: event-driven components, data and execution boundaries, backtest/live parity, and adapter discipline. RALPH should borrow the operating checklist, not the full engine, until a concrete replay/fill-realism candidate needs it.

Jesse contributes practical workflow vocabulary for crypto strategy research, backtesting, paper/live sessions, charts, logs, and notifications. It remains a secondary reference for operator UX and paper/live comparison, not a default framework.

## RALPH Operation Sequence

1. Candidate enters as a source-backed lead or local alert/paper evidence row.
2. Wheel gate checks existing tools, APIs, datasets, dashboards, and framework fit.
3. Candidate receives a plain-English strategy specification and falsifier.
4. T2 kill test runs on the cheapest appropriate rail.
5. T2 result must include row-level audit, baseline, bias checks, and rejection reasons.
6. Only surviving candidates move to T3 forward paper/shadow.
7. T3 postmortem compares live delay, missing fills, freshness, and mechanism behavior against T2 assumptions.
8. Only a candidate with T2 and T3 support can justify a T4 no-key prototype proposal.
9. Any live-capable, account, key, paid, scheduler, alert wording, risk, sizing, or execution step waits for explicit Tomas approval.

## Failure Controls

Before any bot-like prototype, RALPH must be able to answer:

- What data was available at decision time?
- What exact rule produced signal, no-signal, or reject?
- What dumb baseline did it beat?
- What fees, slippage, and fill assumptions were used?
- What part fails under OOS, walk-forward, deflated-Sharpe/proxy, or startup variance?
- What happens when data is stale, missing, duplicated, or symbol-mismatched?
- What monitoring proves it is paper-only or read-only?
- What evidence would make RALPH stop, downgrade, or ask Tomas?

## Current Decision

Do not build or adopt a trading bot.

The current operation map says RALPH should keep operating as an evidence system with small adapters. Future bot-like work is allowed only as a documented T4 proposal attached to a specific paper-supported candidate and a specific missing capability.

## Reassess

Confidence went up that the framework shortlist is enough for current routing. There is no need for another broad bot-framework comparison right now.

Next useful branch should move away from generic bot architecture and toward strategy-specific evidence, especially:

- `investigation.wallet-shadow-high-volatility-event-brief`;
- `investigation.event-triggered-wallet-shadow-falsification`;
- `investigation.wallet-shadowing-forward-paper-trade-spec`;
- or a validation recheck only after evidence thresholds are met.

## Boundaries

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
