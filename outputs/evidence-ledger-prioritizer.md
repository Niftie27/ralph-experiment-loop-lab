# Evidence Ledger Prioritizer

Generated: 2026-10-03T16:10:20.832Z
Status: research-only-router.

Ranks pending RALPH work by evidence readiness and cheap kill-test value. It does not promote strategies, change live alerts, change schedules, or authorize execution.

## Evidence Snapshot

- TA setup analysis: 240 reviewed, 149 candle-context-ready, largest call bucket 9/20.
- Forward paper: 500 signals, 484 closed, 16 open.
- AVAX exact forward rows: 0/20 for AVAX 1h range_breakdown_short down/low-vol.
- Strategy filter: 13 candidates, 131 variants, 0 survivors, 131 rejected.
- Strategy rubric: 3 benchmark routes and 20 investigate routes.
- Queue state: 0 pending, 3 watch, 0 ready-now, 1 threshold-watch, 0 needs-wheel-gate.

## Top Ready Routes

| Lane | Item | Score | Decision | Next action |
| --- | --- | ---: | --- | --- |

## Threshold Watch

| Lane | Item | Score | Evidence | Next action |
| --- | --- | ---: | --- | --- |
| watch | ta-call-candidates-20-row-threshold | 44 | largest TA call bucket is 9/20 reviewed rows | Keep in Watch until more finalized reviewed alert rows arrive. |

## Needs Wheel Gate

| Lane | Item | Score | Gate | Next action |
| --- | --- | ---: | --- | --- |

## Watch Gates

| Lane | Item | Score | Gate | Next action |
| --- | --- | ---: | --- | --- |
| watch | arkham-material-value-tiny-export-gate | 45 | approval-gated account/API/export sample; no active no-key route | Stay Watch until Tomas explicitly approves account/API-plan-or-trial/API-key access, spend cap, endpoint scope, and local export path. |
| watch | wallet-shadow-independent-event-window-gate | 45 | named independent event/source/account trigger required before sampling | Stay Watch until Tomas names a trigger or a source-ranked event record creates a precise independent window. |

## Reassess

The next useful manual branch should not rerun TA or AVAX threshold checks until the required rows exist. Current top ready route is none. No ready-now or needs-wheel-gate pending routes remain; continue only when threshold evidence, a named trigger, or explicit HITL-gated approval appears. If using social sources, require public pages plus a code/data/source-backed falsifier for every idea. Copytrading and Hyperliquid address work should classify no-key access and selection bias before any paper cohort spec.

Maintenance gate: ready discovery or strategy-adjacent routes are routing candidates only. A maintenance-only continuation must not start one unless Tomas explicitly asks for that branch.

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
