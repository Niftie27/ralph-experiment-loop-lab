# Input Output Flow

Status: active operating contract for RALPH loops.

This file explains how new inputs enter the AI Research OS layer and how loop outputs are promoted back into durable memory.

## Core Principle

RALPH should not dump everything into the wiki.

The flow is:

1. Capture input.
2. Classify whether it is source material, working context, or noise.
3. Extract usable text/data if the input is media.
4. Store immutable source material under `raw/`.
5. Write source summaries and synthesis under `wiki/`.
6. Promote only decision-relevant results into queues, unknowns, candidates, decisions, experiments, or case files.

## AI Research OS Modes

RALPH uses the workshop modes this way:

- `init`: create or repair the research directory contract.
- `append`: ingest user-provided sources, local files, links, PDFs, videos with transcripts, or notes.
- `query`: answer from the existing index/wiki/raw without broad discovery.
- `deep`: run source discovery, repo research, strategy research, or market/event research.

Most RALPH work is either `append` or `deep`.

## Input Classification

### Source Grade

Use when the input should be citable later.

Examples:

- project handoff
- benchmark result
- transcript deliberately provided as evidence
- official docs
- important GitHub repository
- public research article
- PDF
- YouTube video with transcript
- local video or audio after transcript extraction

Store as:

- `raw/<slug>.md` or `raw/assets/<slug>/original.<ext>`
- `wiki/sources/<slug>.md`
- `index.yaml`
- regenerated `index.md`
- `log.md`

### Working Note

Use when the input is useful but not a primary source.

Examples:

- Tomas clarifies direction in chat
- a loop creates a rough strategy map
- an agent writes a temporary synthesis
- a framework looks interesting but is not yet source-worthy

Store as:

- `wiki/notes/`
- `wiki/questions/`
- `decisions/unknowns.md`
- `decisions/candidates.md`
- `automation/work-queues.yaml`

### Case File Evidence

Use when the input belongs to a specific project history or failure analysis.

Examples:

- MEV bot archive details
- Zela benchmark lessons
- Polymarket concerns
- wallet-shadow/event-bot research

Store as:

- `case-files/<case>/`
- linked source summaries under `wiki/sources/` when citation-grade
- extracted failure modes or lessons under `wiki/concepts/`, `wiki/comparisons/`, or `decisions/`

### Scratch

Use when the input is noisy, duplicated, or only useful inside the current run.

Do not save unless it teaches a reusable lesson or records a blocker.

## Media Inputs

### YouTube or Web Video URL

AI Research OS supports YouTube URLs when public captions/transcripts are available.

Expected flow:

1. Extract transcript into `raw/youtube-<slug>.md`.
2. Preserve URL and metadata in the raw file.
3. Summarize into `wiki/sources/<slug>.md`.
4. Promote concepts/entities/comparisons if the content is reusable.

Fallback order:

1. Installed AI Research OS transcript script.
2. `yt-dlp` subtitle probe.
3. Public mirror probe only as an opportunistic fallback.
4. Manual transcript export from Tomas.
5. Local audio/video transcription with Whisper.

Limits:

- no transcript means no reliable semantic ingest unless Tomas provides transcript or we extract it by another tool
- visual-only claims need screenshots or manual notes
- cloud runtimes may be blocked by YouTube even when captions exist; in that case save metadata/description, record the blocker, and ask for transcript export or local media when the transcript matters
- browser cookies or logged-in YouTube sessions are not the default; use them only after explicit approval

### Telegram or Local Video File

This is not automatically understood by AI Research OS as semantic source material.

Expected RALPH flow:

1. Preserve the original file under `raw/assets/<slug>/original.<ext>` if it is source-worthy.
2. Extract audio transcript when tooling is available.
3. Optionally add manual scene notes or screenshot descriptions when visuals matter.
4. Store extracted text as `raw/<slug>.md`.
5. Summarize into `wiki/sources/<slug>.md`.

So yes, Tomas can send a video, but RALPH must convert it into transcript/notes before the wiki can reason over it.

### Audio or Voice Notes

Expected flow:

1. Preserve audio under `raw/assets/<slug>/original.<ext>` when source-worthy.
2. Transcribe to `raw/<slug>.md`.
3. Summarize into `wiki/sources/<slug>.md` if it changes RALPH direction.
4. Otherwise store the distilled action in `wiki/notes/`, `decisions/unknowns.md`, or `automation/work-queues.yaml`.

### Images and Photos

AI Research OS can preserve referenced images as assets, but images need text extraction or visual notes before they become useful research memory.

Expected flow:

1. Store original image under `raw/assets/<slug>/`.
2. Add OCR or visual description if relevant.
3. Link it from a raw markdown note or source summary.

## File And Web Inputs

### PDF

PDFs are first-class inputs when extraction works.

Expected flow:

1. Preserve original PDF under `raw/assets/<slug>/original.pdf`.
2. Extract text/images into raw markdown/assets.
3. Summarize into `wiki/sources/<slug>.md`.
4. Promote concepts, entities, comparisons, and questions.

### Web Page

Expected flow:

1. Fetch page text.
2. Store source-grade content under `raw/` when important.
3. Summarize into `wiki/sources/`.
4. If low-signal, record only queue/discard state.

### GitHub Repository

GitHub repos are research targets, not normal raw documents.

Expected flow:

1. Clone or inspect outside the research dir cache.
2. Store repo summary under `wiki/repos/<owner>-<repo>/`.
3. Pin commit SHA when used as evidence.
4. Promote architecture lessons, failure modes, or framework fit into wiki/decisions.

Do not copy large source trees into `raw/`.

## Loop Output Flow

Every loop must classify output before saving it.

1. If output is noisy: leave it as scratch.
2. If it changes task state: update `automation/work-queues.yaml`.
3. If it changes an unknown: update `decisions/unknowns.md`.
4. If it changes a strategy candidate: update `decisions/candidates.md`.
5. If it is reusable synthesis: write `wiki/notes/`, `wiki/concepts/`, `wiki/entities/`, or `wiki/comparisons/`.
6. If it is concrete evidence: run Source Intake and create `raw/` + `wiki/sources/` + index update.
7. If it changes direction: update `decisions/decisions.md` or draft an experiment/decision memo.

## Promotion Criteria

Promote a loop output only when it changes at least one of:

- strategy hypothesis
- candidate score
- unknown or blocker
- discard reason
- benchmark or simulation plan
- case-file lesson
- automation rule
- reusable skill proposal

## General Brain Versus RALPH Brain

AI Research OS can be used as a general second brain for many projects and media types.

RALPH should stay focused on:

- crypto research
- DeFi and MEV case files
- strategy discovery
- benchmark and validation discipline
- trading-system capability research
- data rails and developer tooling

If Tomas wants a life-wide second brain, create a separate top-level research directory and link RALPH as one domain vault. Do not mix unrelated life/project media into RALPH unless it changes a RALPH decision.

## Safety Gates

Inputs and loop outputs must not trigger:

- live trading
- wallet key handling
- exchange account creation
- paid infra
- public publishing
- recurring automation without explicit approval
