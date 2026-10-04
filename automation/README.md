# Automation

This directory stores approved automation runbooks and state.

Recurring automation is active for RALPH research only.

Active jobs:

- `ralph-autoresearch-loop`
- `ralph-weekly-maintenance`
- `ralph-state-of-edge-daily`

Cadence:

- `ralph-autoresearch-loop`: daily at 09:30 Europe/Prague.
- `ralph-weekly-maintenance`: Sunday at 18:00 Europe/Prague.
- `ralph-state-of-edge-daily`: daily at 19:15 Europe/Prague.

Runtime: OpenClaw cron agent turn in an isolated session so the Telegram main-session context does not grow.

Delivery: none by default. The loop may send Tomas a Telegram message only when the notification rules in `ralph-autoresearch-loop.md` are met.

Authoritative state:

- `automation/retrieval-router.yaml`
- `automation/loop-state.yaml`
- `automation/loop-registry.yaml`
- `automation/subsystem-registry.yaml`
- `automation/roadmap.md`
- `automation/ralph-autoresearch-loop.md`
- `automation/research-validation-checklist.mjs`

Manual and scheduled loops should update `automation/work-queues.yaml`.

Scheduled workers must read `automation/retrieval-router.yaml` first and update it when durable output changes active routing. This keeps future runs cheap: index reads still cost tokens, but they prevent broad vault scans.

Maintenance workers should run:

```bash
node ralph-research-os/automation/research-validation-checklist.mjs
```

The generated report under `outputs/research-validation-checklist.md` is the compact eval surface for retrieval/index budget, simple path-reference health, queue consistency, subsystem contract coverage, cron health, delivery verification, HITL ask quality, loop quality, handoff readiness, paper/demo readiness, and boundary deltas.

State-of-edge workers should run:

```bash
node ralph-research-os/automation/state-of-edge-report.mjs
```

The generated report under `outputs/state-of-edge-report.md` is the compact deterministic surface for paper results, shadow PnL, live data freshness, latest candidates, and the current promote/kill/watch posture. It is still research/paper-only.

Any new cron job, daemon, or scheduled task still needs the same written contract:

- loop name
- cadence
- inputs
- outputs
- data sources
- cost
- stop conditions
- failure behavior
- notification behavior

Tomas approved the A2 RALPH autoresearch loop on 2026-08-10, weekly maintenance on 2026-08-30, and a broader no-HITL research/paper autonomy upgrade on 2026-09-12. This approval does not cover live trading, wallet keys, exchange-account setup, paid APIs, public publishing, or automatic skill installation.

Any automation outside this approved RALPH autoresearch scope still requires explicit approval.
