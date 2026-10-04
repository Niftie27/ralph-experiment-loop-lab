# A2 Research Engine Runbook

Status: approved, active for `ralph-autoresearch-loop`.

This is the first safe recurring automation design for RALPH. Tomas approved A2 recurring autoresearch on 2026-08-10 after asking RALPH to work independently in a loop, self-verify outputs, and contact him only when truly needed.

## Goal

Run internal research loops in the background so RALPH keeps discovering strategies, repos, frameworks, market events, failure modes, and paper/demo validation paths while Tomas is not actively driving every step.

## Active Cadence

- Monday and Thursday 09:30 Europe/Prague: one isolated autoresearch loop run.
- Each run chooses one bounded work item from strategy research, framework/repo discovery, X/GitHub research, market/battlefield research, or self-improvement.
- The loop favors depth and verification over broad daily summaries.
- The loop is for the agent's own work; Tomas only sees it on request or when something genuinely significant appears.
- Each run is a micro-run: one work item, selective reads, limited source checks, and no long tool installation/setup unless explicitly selected as a bounded spike.

## Allowed Actions

- Read local RALPH files.
- Read public/free web sources.
- Search GitHub/public docs.
- Draft source summaries.
- Update RALPH markdown files.
- Update queues, unknowns, candidates, decisions, and discards.
- Propose reusable skills or rule updates.
- Classify new inputs through `core/input-output-flow.md`.
- Save relevant loop outputs according to `core/loop-output-policy.md`.
- Run local paper/shadow trading, historical backtests, public-data forward tests, and no-key dry-run simulations.

## Forbidden Actions

- Live trading.
- Wallet keys.
- Exchange accounts.
- Paid APIs or paid infra.
- Public publishing.
- Autonomous codebase rewrites.
- Installing or applying skills without explicit approval.
- Demo/testnet exchange accounts, API keys, or broker/exchange integrations without separate explicit approval.

## Failure Behavior

If a loop fails:

1. Record failure in `log.md`.
2. Add blocker to `automation/work-queues.yaml`.
3. If the same blocker repeats 3 times, create a self-improvement note.
4. If the failure reveals a reusable lesson, draft a skill proposal, but do not apply it automatically.
5. If the same blocker repeats 3 consecutive runs, message Tomas with a short blocker report and a proposed next decision.
6. If the failure is a timeout, split the selected work into smaller queue entries before the next run.

## Output Handling

Loop outputs must be classified before saving:

- scratch only
- queue update
- wiki note
- source intake
- decision

The rule lives in `core/loop-output-policy.md`.

Input and media handling lives in `core/input-output-flow.md`.

## Notification Behavior

Notify Tomas only when:

- a candidate crosses promotion threshold
- a high-value unknown needs human judgment
- a loop is blocked for 3 consecutive runs
- a market event creates a useful research sample
- a concrete alert-worthy setup or urgent event needs Tomas's attention
- Tomas explicitly asks for the autoresearch output

Otherwise the loop should update RALPH files silently and end without Telegram output.

When Tomas asks for loop output, send a short summary and significant things only. Skip process detail.

## Current Job

- Name: `ralph-autoresearch-loop`
- Runtime: OpenClaw cron `agentTurn`
- Session target: isolated
- Delivery: none
- User-visible messages: only via explicit Telegram `message(action="send")` when notification rules are met
- Constraints: no live trading, wallet keys, exchange-account setup, paid APIs, public posting, or automatic skill installation
