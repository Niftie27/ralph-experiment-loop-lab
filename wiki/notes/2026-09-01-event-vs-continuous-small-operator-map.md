---
type: note
topic: event-vs-continuous-small-operator-map
created: 2026-09-01T05:12:43Z
last_updated: 2026-09-01T05:12:43Z
work_item: unknowns.U-010
status: done
scope: research-only
sources:
  - 2026-08-30-wallet-shadow-high-volatility-event-brief.md
  - 2026-08-30-event-triggered-wallet-shadow-falsification.md
  - 2026-08-30-trading-bot-operation-map.md
  - 2026-08-30-event-driven-bot-repo-search.md
  - 2026-08-31-wallet-shadow-event-candidate-signal-spec.md
  - 2026-08-31-strategy-family-budget-fit-map.md
  - 2026-09-01-a2-operating-safety-brief.md
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - ../../decisions/unknowns.md
  - ../../core/profitability-flywheel.md
  - ../../core/testing-protocol.md
  - ../../automation/work-queues.yaml
---
# Event Vs Continuous Small-Operator Map

## Purpose

Resolve `U-010` for current routing: decide whether event-triggered trading is easier or harder than continuous trading for a small operator like Tomas, and what that means for RALPH's next research shape.

This is a routing note, not a strategy proposal. It does not create a signal, event ledger, scanner, collector, schedule, alert change, account, key, paid source, demo/testnet setup, live trade, sizing, TP/SL, execution behavior, public post, or strategy promotion.

## Short Answer

Event-triggered trading is easier for research scoping and harder for execution-grade trading.

It is easier because events give RALPH bounded windows, explicit timestamps, natural no-trade baselines, and faster rejection. It is harder because the useful edge often decays fastest exactly when spreads, slippage, stale data, fills, hidden hedges, and selection bias are worst.

For Tomas's current A2/no-key phase, event-triggered work should stay a falsifier and radar lane. Continuous or slow structural families remain better default research surfaces when they can be measured without live execution pressure.

## Comparison

| Dimension | Event-triggered | Continuous | RALPH implication |
| --- | --- | --- | --- |
| Scope control | Strong: finite windows and timestamps. | Weak: can drift into always-on scanning. | Events are good for bounded kill tests. |
| Data volume | Lower, but bursty and timing-sensitive. | Higher, smoother, easier to sample. | Events reduce storage but raise timestamp/freshness requirements. |
| Latency | Usually hostile; the obvious move may already be gone. | Depends on family; slow structural edges can tolerate delay. | Event scalps are poor fit; post-event swings or slow flows are more plausible. |
| Selection bias | Very high if events or wallets are chosen after winners are known. | High, but easier to randomize over fixed windows. | Event rows must be frozen before outcome scoring. |
| Cost/fill realism | Hardest during volatility. | Easier to approximate for slower systems. | Event candidates need conservative missed-fill and slippage rules. |
| Hidden hedge risk | High for wallet/event accounts. | High for wallet strategies, lower for market-level baselines. | Visible event wallet legs should default to radar unless exits and hedges are bounded. |
| Operator burden | Intermittent, but urgent when active. | Can be batched if slow; dangerous if always-on live. | A2 should not page Tomas for normal event summaries. |
| Validation value | Strong as a kill test and failure-mode generator. | Strong as baseline and steady paper ledger. | Use events to reject ideas and train realism gates, not to promote quickly. |

## Event Work That Fits

Safe event-triggered research in the current phase:

- source-timestamped event windows selected before outcome review;
- post-event or persistence tests that survive 60s and 180s delay;
- market-level event baselines versus no-trade, BTC/ETH beta, momentum, and reversal;
- tiny frozen Hyperliquid known-address delay falsifiers after a named trigger or Tomas selection;
- radar-only notes for political/geopolitical/venue events where attribution or exits are weak.

Unsafe or approval-gated event work:

- live event scanners or alert wording changes;
- wallet-shadow capture/replay without explicit approval;
- execution-first bots that require accounts, keys, or live routing;
- treating leaderboard PnL, social claims, screenshots, or retrospective winners as signal evidence;
- event scalping where the holding period is shorter than observation plus execution delay.

## Continuous Work That Fits

Safe continuous-style research in the current phase:

- market-level funding/basis baseline snapshots and fixed-window accounting;
- local alert-edge/TA strategy destruction only when row thresholds change or a named candidate needs a kill test;
- public/orderflow feature research as one-shot bounded capture/alignment, not a permanent collector;
- offline range/grid falsifiers against no-trade and hold baselines.

Continuous work becomes unsafe when it quietly turns into live monitoring expansion, threshold tuning, account setup, paid feed adoption, execution wiring, or always-on scanner construction without HITL approval.

## Decision

`U-010` is resolved for current routing.

RALPH should not prefer event-triggered trading because it sounds more opportunistic. It should prefer event-triggered research when the event gives a bounded falsifier. For actual small-operator strategy fit, slow and continuous/structural families still have the better latency profile, while event-triggered wallet-shadowing remains Watch or radar-only until frozen rows prove delayed copyability.

Next valid event branch, if selected later, is not a scanner. It is a tiny frozen event-ledger proposal using the U-002 signal spec, and it must stop at the first decisive reject condition.

## Boundary Delta

Changed: wiki/router/queue/state/log/index/memory only.

Boundary delta: no scheduler, cron, systemd, alert, threshold, account, key, paid service, API use, collector, scanner, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.
