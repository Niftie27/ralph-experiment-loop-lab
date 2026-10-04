---
type: note
topic: patient-retail-strategy-leg-repeat-fit-map
created: 2026-09-01T05:42:29Z
last_updated: 2026-09-01T05:42:29Z
work_item: unknowns.U-037
status: done
scope: research-only
sources:
  - 2026-08-31-strategy-leg-garden-harvest.md
  - 2026-08-31-patient-retail-archetype-prioritization.md
  - 2026-08-31-funding-basis-baseline-monitor.md
  - 2026-08-31-smart-money-cohort-discovery-layer.md
  - 2026-08-31-strategy-family-budget-fit-map.md
  - 2026-09-01-event-vs-continuous-small-operator-map.md
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - ../../decisions/unknowns.md
  - ../../decisions/candidates.md
  - ../../automation/work-queues.yaml
---
# Patient-Retail Strategy Leg Repeat-Fit Map

## Purpose

Resolve `U-037` for current routing: identify which rough strategy legs repeatedly fit Tomas's patient-retail constraints before any one is promoted to Q1.

This note preserves route priority only. It does not promote a strategy, define live alerts, create a scheduler, collect new market data, create an account/key/paid source, set sizing, TP/SL, or execution behavior.

## Fit Criteria

A leg repeatedly fits only if it shows up across prior notes as:

- slow enough for human/agent latency;
- testable before live execution;
- compatible with public/no-key or local data, or explicitly access-gated;
- paired with a dumb baseline;
- carrying a clear kill test and failure mode;
- able to produce paper evidence without alert or execution changes.

## Current Ranking

| Rank | Leg | Repeat-fit state | Why | Next state |
| ---: | --- | --- | --- | --- |
| 1 | Funding/basis persistence baseline | Best active no-key baseline | Repeats across patient-retail prioritization, strategy garden, budget map, and public snapshot work; slow, measurable, public/no-key, and useful as a no-prediction comparison floor. | Continue only via manual elapsed-time snapshots or fixed-window paper accounting; no scheduler/account. |
| 2 | Smart-money mid-cap accumulation | Highest-upside access-gated alpha | Repeats as Tomas's preferred slow-informational branch, but every serious route needs Nansen/Dune/Arkham-style rows with exits. | Watch/HITL export sample; no scanner or cohort before rows exist. |
| 3 | Offline range/grid falsifier | Useful watch-only structural test | Repeats as patient-retail compatible and productized elsewhere, but trend tails and inventory risk require offline rejection first. | One-file public-candle falsifier only when selected; no product/account/bot. |
| 4 | Event-radar-to-paper filter | Useful context/falsifier, weak strategy fit | Repeats as bounded event-window research and replay context, but event execution and wallet copying are latency/selection-bias hostile. | Radar/falsifier only; no scanner/copy signal. |
| 5 | Token-unlock liquidity pressure | Plausible source-first watch | Fits latency but lacks verified exportable source rows and is likely crowded if modeled naively. | Source-first scan only after selected; no build. |
| 6 | Delegated copy / copy vaults | Prior-art only | Repeats as useful UX/risk vocabulary, but not as evidence because survivorship, leaderboard bias, and execution/account boundaries dominate. | Keep as prior art and rejection source. |

## Decision

`U-037` is resolved for current routing.

The repeat-fit stack is:

1. funding/basis as the active no-key comparison floor;
2. smart-money mid-cap accumulation as the main access-gated alpha branch;
3. range/grid as an offline falsifier;
4. event radar as context and replay-window selection;
5. token unlocks as source-first watch;
6. delegated copy as prior art.

No leg is promoted to Q1 or paper-candidate by this map. The next active work still depends on a named trigger: elapsed-time funding/basis rerun, row-count threshold change, access/export approval, or explicit selection of one offline/source-first falsifier.

## Boundary Delta

Changed: wiki/router/queue/state/log/index/memory only.

Boundary delta: no scheduler, cron, systemd, alert, threshold, account, key, paid service, API use, collector, scanner, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.
