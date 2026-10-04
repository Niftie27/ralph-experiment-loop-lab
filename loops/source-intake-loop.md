# Source Intake Loop

Purpose: turn new inputs into durable memory.

Trigger:

- Tomas provides a source.
- Agent finds a relevant local file.
- Approved automated collection creates a source candidate.

Inputs:

- links
- transcripts
- audio/video after transcript extraction
- PDFs
- images with OCR or visual notes
- local docs
- GitHub repos
- benchmark outputs
- case-file handoffs

Actions:

1. Classify source type.
2. Apply `core/input-output-flow.md`.
3. Store immutable source under `raw/` if it is source material.
4. Write or update `wiki/sources/<slug>.md`.
5. Update `index.yaml`.
6. Regenerate `index.md`.
7. Append `log.md`.
8. Surface unknowns and candidate updates.

Outputs:

- raw source
- source summary
- updated overview/synthesis if needed
- new unknowns/candidates

Stop condition:

- Source is indexed and summarized, or rejected as not source material.
