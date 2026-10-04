---
type: note
name: AI Research OS Video Guide For RALPH
sources:
  - wiki/sources/youtube-ai-research-os-workshop-video.md
  - wiki/sources/ai-research-os-workshop-readme.md
  - wiki/sources/ai-research-os-conventions.md
tags:
  - ralph
  - research-note
  - misc-research
related:
  - core/ai-research-os-setup.md
  - core/input-output-flow.md
  - core/loop-output-policy.md
  - loops/source-intake-loop.md
created: 2026-07-01T07:58:00Z
last_updated: 2026-07-01T11:50:00Z
---

# AI Research OS Video Guide For RALPH

This note adapts the AI Research OS video source into RALPH operating rules.

Update: Tomas supplied a full browser-extension transcript after cloud transcript extraction failed. The raw video source now contains the manual transcript and the original extraction-failure record.

## Practical Model

AI Research OS is a second-brain operating pattern, not just a folder layout.

The useful loop is:

1. Capture notes, links, docs, repos, videos, or project artifacts.
2. Preserve source-grade material in `raw/`.
3. Add or update `index.yaml` so future agents know what exists.
4. Regenerate `index.md`.
5. Summarize each source under `wiki/sources/`.
6. Promote repeated or decision-relevant ideas into `wiki/concepts/`, `wiki/entities/`, `wiki/comparisons/`, `wiki/notes/`, `wiki/open-questions.md`, or RALPH's `decisions/`.
7. Query through index/wiki first and use raw only when needed.

The video makes the tool-choice boundary explicit:

- quick one-off answer: use search/chat directly
- one-off coding/action task: use Codex/Claude Code directly
- repeatable research/work where sources must stick: use AI Research OS

## What RALPH Should Copy Directly

- Read order: index first, wiki second, raw third.
- File-based memory by default; do not add a vector or graph database until a repeated retrieval failure proves the need.
- Append mode for user-provided sources.
- Deep mode only when discovery is explicitly wanted.
- Local wiki as the compounding surface for future agents.
- Source provenance as a first-class rule.
- Obsidian compatibility as browsing/UI support, not as the canonical database.
- Project-specific wikis that scope down from the larger second brain.
- Query discipline: index summary -> source page -> wiki derivatives -> raw source only when needed.
- The wiki evolves when useful questions create notes, concepts, comparisons, or entities.

## What RALPH Adds

RALPH needs a decision layer that the generic workshop does not provide strongly enough:

- unknowns
- candidates
- decisions
- experiments
- case files
- loop registry/state
- safety rules
- promotion/discard thresholds

The video also argues against overbuilding infra early. RALPH should keep plain files as the default memory substrate and avoid vector DB / graph DB complexity until retrieval failure proves the need.

## Loop Mapping

| RALPH Loop | AI Research OS Mode | What It Writes |
| --- | --- | --- |
| Source Intake | append | `raw/`, `wiki/sources/`, `index.yaml`, `index.md`, `log.md` |
| Unknowns Loop | query or append | `decisions/unknowns.md`, `wiki/open-questions.md` |
| Discovery / Strategy Research | deep when approved | `wiki/notes/`, `decisions/candidates.md`, source intake for strong evidence |
| Investigation | query plus source-backed note | `wiki/notes/`, `experiments/`, candidates/unknowns |
| Validation / Benchmark | append plus note | `experiments/`, `wiki/comparisons/`, decisions |
| Decision | query plus memo | `decisions/decisions.md`, `outputs/decision-memos/` |
| Self-Improvement | lint/distill/render plus proposal | rules/runbooks/skill proposal, never auto-apply without approval |

## Media Ingest Lesson

The video exposed a real runtime caveat: the workshop's YouTube transcript script is installed and callable, but YouTube blocked transcript API access from this environment. RALPH should record that as a media-ingest blocker, not as an install failure.

Tomas's extension export confirms the practical fallback: if the user can access the transcript in a normal browser, RALPH can ingest that transcript as `manual` and still satisfy the AI Research OS contract.

Safe fallback order:

1. Try the installed AI Research OS YouTube transcript script.
2. Try page metadata and description extraction.
3. Try public caption metadata only if it does not require auth or paid API.
4. If transcript body is blocked, save source metadata and mark transcript unavailable.
5. Ask Tomas for a transcript export or local media file if the transcript is necessary.
6. For local media, transcribe audio and ingest the transcript as the raw source.

## RALPH Rule

> Synthesis: RALPH should treat every loop as a potential source producer, but only source-grade or decision-changing outputs get promoted into durable wiki memory.
