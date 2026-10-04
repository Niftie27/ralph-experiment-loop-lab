# Automation Policy

RALPH may automate research, not execution.

Allowed without separate approval:

- Read public/free sources.
- Read local RALPH, Zela, and crypto-updates files.
- Draft source summaries.
- Update wiki pages.
- Add unknowns, candidates, and investigation briefs.
- Propose experiments.
- Run local read-only analysis over existing local data.
- Draft reusable skill proposals from repeated loop failures or successes.

Needs explicit approval:

- Creating cron/systemd jobs or persistent background workers.
- Activating OpenClaw recurring cron/session tasks.
- Using paid APIs or paid infrastructure.
- Creating accounts.
- Sending messages externally beyond status updates to Tomas.
- Downloading large datasets.
- Modifying large external codebases.

Forbidden:

- Real-money trading.
- Wallet-key handling.
- Exchange-account setup.
- Autonomous order execution.
- Public publishing.

Mandatory before any real-money path:

- local paper trading, historical backtests, public-data forward tests, or no-key dry-run simulations;
- demo/testnet exchange or broker tools only after explicit Tomas approval for the specific account/key/setup.

## Autonomy Levels

`A0`: Manual only. Agent updates files during a conversation.

`A1`: Agent-run loops. Tomas asks "run loop X"; agent runs once and reports.

`A2`: Scheduled research. A recurring job collects public/free sources and drafts updates. Requires approval.

`A3`: Autonomous paid or external actions. Not allowed in current RALPH.

Current level: `A2` active for approved recurring research/paper automation only.

A2 is active through `automation/ralph-autoresearch-loop.md`, the 4h alert-edge backtest refresh, and the 2026-09-12 Tomas-approved no-HITL research/paper autonomy upgrade. It is governed by `core/profitability-flywheel.md`. This approval does not extend to real-money trading, keys, paid services, public posting, live alert wording, risk/sizing/TP/SL, or execution changes.

Approved maintenance:

- `ralph-weekly-maintenance`: isolated weekly maintenance at Sunday 18:00 Europe/Prague. Scope is queue/index/tool-health/context hygiene only, silent unless a meaningful HITL/blocker/integrity issue appears. Local maintenance should run `node ralph-research-os/automation/research-validation-checklist.mjs` and treat `cron: warn` as a reason to verify live scheduler state through the OpenClaw cron tool, not as permission to mutate the scheduler.
- `ralph-state-of-edge-daily`: isolated daily state-of-edge check at 19:15 Europe/Prague. Scope is deterministic paper/shadow/journal/freshness reporting and promote/kill/watch routing only, silent unless a candidate review, stale-data attention state, repeated blocker, or urgent risk issue appears.
