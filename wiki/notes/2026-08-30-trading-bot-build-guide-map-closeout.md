---
type: note
topic: trading-bot-build-guide-map
created: 2026-08-30T09:38:00Z
last_updated: 2026-08-30T09:38:00Z
work_item: investigation.trading-bot-build-guide-map
status: complete
scope: research-only
sources:
  - https://www.freqtrade.io/en/stable/strategy-101/
  - https://hummingbot.org/docs/
  - https://nautilustrader.io/docs/latest/concepts/architecture/
  - https://jesse.trade/
tags:
  - ralph
  - research-note
  - misc-research
related:
  - 2026-07-01-trading-bot-build-guide-map.md
  - 2026-08-30-framework-shortlist-comparison.md
  - 2026-08-30-build-vs-buy-decision-memo.md
  - 2026-08-30-strategy-family-taxonomy.md
  - ../../core/profitability-flywheel.md
  - ../../core/testing-protocol.md
---
# Trading Bot Build Guide Map Closeout

## Purpose

This closes `investigation.trading-bot-build-guide-map`.

The original 2026-07-01 guide map remains valid: RALPH should not follow one framework or guidebook blindly. This closeout updates the build order under the active Profitability Flywheel.

## Current Build Order

RALPH's trading-system build order is:

1. Strategy family and speed fit.
2. Wheel gate and access classification.
3. Plain-English hypothesis with falsifier.
4. Cheapest kill test.
5. Offline backtest/replay with baseline and bias checks.
6. Forward paper/shadow evidence.
7. Postmortem and decision.
8. Small adapter or no-key prototype only if evidence justifies it.
9. Explicit Tomas approval before any account, key, paid service, live alert change, risk/sizing/TP/SL, scheduler, or execution step.

## Guide Source Roles

| Source family | Use | Current state |
| --- | --- | --- |
| Freqtrade docs | staged backtest, dry-run, lookahead/recursive bias discipline | reference until setup is approved |
| vectorbt | cheap external benchmark for candle/statistical setup tests | active ephemeral benchmark rail |
| NautilusTrader | event-driven architecture, replay, live/backtest parity concepts | architecture reference |
| Jesse | crypto strategy workflow vocabulary | secondary reference |
| Hummingbot | connector/config separation and market-making architecture | watch/reference because capital fit is uncertain |
| Failure cases | concrete checks for secrets, schema, wiring, simulation, metrics, and venue assumptions | active RALPH validation material |

## Decision

The build-guide map is complete enough for current RALPH routing.

Do not start a generic trading bot design. The next build-related work should be attached to a concrete evidence gap, such as:

- a specific candidate needing a framework parity check;
- a specific orderflow candidate needing replay/fill realism;
- a specific paper-qualified idea needing a no-key prototype proposal;
- a specific framework setup proposal for Tomas to approve.

## Falsifier

This build order is wrong if RALPH finds a framework that can already produce the full RALPH output contract with lower risk and less glue than the current local harnesses.

Until then, existing frameworks teach and benchmark. They do not define RALPH's build roadmap.

## Boundaries

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
