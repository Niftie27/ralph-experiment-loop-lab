---
type: note
topic: evidence-ledger-prioritizer
created: 2026-08-29T22:34:12Z
last_updated: 2026-08-29T22:34:12Z
work_item: decision.autoresearch-evidence-ledger-prioritizer
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - automation
related:
  - ../../core/profitability-flywheel.md
  - ../../outputs/evidence-ledger-prioritizer.md
  - ../../automation/work-queues.yaml
---
# Evidence Ledger Prioritizer

## Purpose

This closes `decision.autoresearch-evidence-ledger-prioritizer`.

The gap was routing discipline: after a branch finishes, RALPH needs to know whether the next item is actually evidence-ready, threshold-waiting, or just attractive because it is near the top of a queue.

## Output

Added `automation/evidence-ledger-prioritizer.mjs`.

The script reads:

- `automation/work-queues.yaml`;
- `../crypto-updates/runtime/setup-analysis.json`;
- `experiments/btc-eth-alert-edge/results/paper-dashboard.json`;
- `experiments/strategy-destruction-filter/results/filter-report.json`;
- `outputs/strategy-score-rubric-dry-run.json`.

It writes:

- `outputs/evidence-ledger-prioritizer.json`;
- `outputs/evidence-ledger-prioritizer.md`.

## Evidence Snapshot

- Pending queue items ranked: 61.
- Ready-now items: 28.
- Threshold-watch items: 2.
- Needs-wheel-gate items: 31.
- TA setup analysis remains below threshold: largest generated call bucket is `9/20` reviewed rows.
- AVAX range-breakdown forward paper remains below threshold: exact `AVAX|1h|range_breakdown_short|short|down/low-vol` rows are `0/20`.
- Strategy filter state remains: 13 candidates, 131 variants, 6 survivors, 125 rejected.

## Decision

Do not rerun the TA call-candidate or AVAX range-breakdown threshold checks until their required rows exist.

Next useful branch:

`investigation.community-idea-to-kill-test-template`

Why: it turns GitHub/operator/social ideas into claim, mechanism, data, baseline, falsifier, and decision records before strategy work. That supports Tomas's do-not-reinvent-the-wheel and verify/reassess rules without changing live systems.

Secondary ready branches:

- `discovery.github-strategy-profile-scan`;
- `discovery.operator-profile-source-map`;
- targeted `discovery.public-orderflow-data-rail-spike`.

Social/X/Reddit scans should remain behind stricter noise filters than GitHub/code-backed sources.

## Verify / Reassess

Verification:

- `node --check automation/evidence-ledger-prioritizer.mjs` passed.
- `node automation/evidence-ledger-prioritizer.mjs` generated the JSON and Markdown ledger.
- The generated ledger correctly held the two threshold-dependent validation items.

Reassessment:

This is a control-plane improvement. It improves queue choice but does not promote strategies or alter any live behavior.

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
