---
type: note
topic: autoresearch-cron-remediation-hitl
created: 2026-08-30T20:58:30Z
last_updated: 2026-08-30T20:58:30Z
work_item: maintenance.autoresearch-cron-remediation-hitl
status: proposed
scope: research-os-maintenance
tags:
  - ralph
  - research-note
  - automation
related:
  - ../../automation/loop-state.yaml
  - ../../automation/current-operating-map.md
  - ../../automation/research-validation-checklist.mjs
  - ../../automation/ralph-autoresearch-loop.md
  - ../../core/automation-policy.md
  - ../../core/communication-protocol.md
---
# Autoresearch Cron Remediation HITL

## Evidence

Read-only OpenClaw cron inspection on 2026-08-30 showed:

- `ralph-autoresearch-loop` is enabled.
- Schedule is Monday and Thursday 09:30 Europe/Prague.
- Next run is `2026-08-31T07:30:00Z`.
- Session target is isolated.
- Delivery is none.
- Current state is `error`.
- Consecutive errors are `2`.
- Recent failures are timeout and gateway-restart interruptions.

Local RALPH state already records this in `automation/loop-state.yaml` and `automation/current-operating-map.md`.

## Diagnosis

This is a scheduler-health warning, not a strategy or trading blocker.

The likely failure shape is that the autoresearch prompt is still broad enough to approach the 600 second timeout when tool setup, source reads, or gateway instability are slow. The job contract already says one bounded item, stop early, and avoid long package installs, but the live run history shows this is not reliably enough.

## Smallest Remediation Options

Any of these would mutate scheduler behavior and need explicit Tomas approval before action:

1. Increase `payload.timeoutSeconds` for `ralph-autoresearch-loop`.
2. Narrow the cron prompt further so it must select only maintenance-safe or pre-ranked items when prior run status is error.
3. Add a preflight step that exits early with a blocker note when setup/tool availability is slow.
4. Temporarily disable the job until Tomas approves a revised prompt/timeout.

Preferred first proposal: narrow the prompt and add an early-exit rule before increasing timeout. The current 600 second cap is a useful guardrail; making the job smaller preserves the micro-run design better than simply giving it more time.

## HITL Ask

Needs HITL: scheduler remediation.

Concrete approval to request only when Tomas wants cron behavior fixed:

```text
Approve a scheduler update to `ralph-autoresearch-loop`: keep the same Monday/Thursday cadence and delivery none, but narrow the prompt after error states so it exits early or selects only one pre-ranked tiny item before timeout. No live trading, accounts, keys, paid services, alert wording, thresholds, risk/sizing, TP/SL, or execution behavior changes.
```

## Boundary Delta

Changed: wiki note only.

Boundary delta: no scheduler change, cron payload/cadence/delivery change, strategy branch, live trading, demo/testnet setup, account/key, paid service, alert wording, threshold, risk/sizing/TP/SL, execution behavior, public posting, or strategy promotion.
