# Manual Runbook

Use this for A1 agent-run loops.

## Run Unknowns Loop

1. Read `index.yaml`, `wiki/open-questions.md`, `decisions/unknowns.md`, and recent `log.md`.
2. Merge duplicates.
3. Prioritize unknowns.
4. Update `decisions/unknowns.md`.
5. Update `automation/work-queues.yaml`.
6. Append `log.md`.

## Run Discovery Loop

1. Pick one high-priority unknown.
2. Search local RALPH memory.
3. Search local related workspaces if relevant.
4. Search public web only if needed.
5. Write source candidates or an investigation brief.
6. Update candidates/unknowns.
7. Update `automation/work-queues.yaml`.

## Run Decision Loop

1. Read candidates, unknowns, investigation briefs, and experiments.
2. Assign candidate states.
3. Write decision memo if evidence is sufficient.
4. Update decisions and discarded files.
5. Update `automation/work-queues.yaml`.

## Run Maintenance Validation

1. Run `node ralph-research-os/automation/research-validation-checklist.mjs`.
2. Verify live cron state with the OpenClaw cron tool when the report says `cron: warn`.
3. Check generated `outputs/research-validation-checklist.md`, including `pathRefs`, `hitlQuality`, `loopQuality`, and `handoffReadiness`.
4. Repair only routing/state contradictions, missing simple path refs, stale local cron mirrors, or missing handoff risks.
5. Record boundary delta. Do not promote strategy candidates from maintenance validation alone.
