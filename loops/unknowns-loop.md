# Unknowns Loop

Purpose: maintain the highest-leverage questions RALPH should answer next.

Trigger:

- After source intake.
- After investigation.
- After contradiction detection.
- Manual "run unknowns loop".

Actions:

1. Read `wiki/open-questions.md`, `decisions/unknowns.md`, and recent `log.md`.
2. Merge duplicates.
3. Promote vague questions into testable unknowns.
4. Assign each unknown an area, evidence need, priority, and next loop.
5. Close unknowns when evidence resolves them.

Outputs:

- updated `decisions/unknowns.md`
- optional discovery tasks
- optional experiment proposals

Promotion criteria:

- Unknown affects candidate viability.
- Unknown blocks a decision.
- Unknown can be answered with available or affordable data.

