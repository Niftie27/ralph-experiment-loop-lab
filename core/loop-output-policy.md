# Loop Output Policy

Every loop should leave useful memory behind, but not every finding deserves the same weight.

## Output Tiers

### Tier 0 — Scratch

Temporary reasoning, noisy searches, and failed commands.

Do not save unless the failure itself teaches a reusable lesson.

### Tier 1 — Queue Update

Use when a finding only changes task state.

Write to:

- `automation/work-queues.yaml`
- `decisions/unknowns.md`
- `decisions/candidates.md`
- `decisions/discarded.md`

### Tier 2 — Wiki Note

Use when the loop produces reusable synthesis, a comparison, a strategy map, or a guide.

Write to:

- `wiki/notes/`
- `wiki/comparisons/`
- `wiki/concepts/`
- `wiki/entities/`

### Tier 3 — Source Intake

Use when a concrete source is important enough to cite later.

Write to:

- `raw/`
- `wiki/sources/`
- `index.yaml`
- regenerated `index.md`

### Tier 4 — Decision

Use when evidence changes what RALPH should do next.

Write to:

- `decisions/decisions.md`
- optionally `outputs/decision-memos/`

## Relevance Rule

Save only if the output changes at least one of:

- a strategy hypothesis
- a candidate score
- an unknown
- a discard reason
- a benchmark/simulation plan
- a loop rule
- a reusable skill proposal

## Anti-Slop Rule

If a loop produces only generic summaries, do not promote them into the wiki. Record the source as low-signal or discard the finding.

## Tagging Rule

Every durable RALPH note should include frontmatter with:

- `type`
- `status`
- `tags`
- `related`

Use lane tags such as `demo-sim`, `orderflow`, `wallet-shadowing`, `source-scan`, `automation`, and `strategy-family`.

Use status tags such as `active`, `watch-only`, `rejected`, `postmortem-viable-only`, `not-forward-validated`, `forward-validation-candidate`, `no-promotion`, `needs-approval`, and `blocked`.

Use boundary tags when relevant: `no-live-trading`, `no-execution`, `no-cron-change`, `no-demo-sim-all`, `no-paper-fund`, and `approval-required`.

See `wiki/research-map.md` for the canonical human-facing tag vocabulary.
