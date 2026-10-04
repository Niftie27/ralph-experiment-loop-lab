# AI Research OS Setup

Status: installed locally in the workspace.

## Installed Components

- Workshop repo mirror: `.openclaw/vendor/ai-research-os-workshop`
- Local skills: `.claude/skills/`
- RALPH research dir: `ralph-research-os/`
- Obsidian-compatible vault config: `ralph-research-os/.obsidian/`

Installed skill directories:

- `.claude/skills/research`
- `.claude/skills/research-lint`
- `.claude/skills/research-distill`
- `.claude/skills/research-render`
- `.claude/skills/readwise-cli`
- `.claude/skills/obsidian-cli`
- `.claude/skills/nlm-skill`

Workshop source pinned at:

- commit: `dc66605`
- date: `2026-06-27`

## How RALPH Uses It

RALPH is an AI Research OS v4 research directory with extensions.

AI Research OS owns:

- `raw/`
- `wiki/`
- `index.yaml`
- `index.md`
- `log.md`
- source summaries
- concepts, entities, comparisons, notes, open questions

RALPH extensions own:

- `core/`
- `loops/`
- `automation/`
- `decisions/`
- `experiments/`
- `case-files/`
- `outputs/`

## Working Tooling

Index regeneration:

```bash
uv run --script .claude/skills/research/scripts/build_index_md.py --research-dir ralph-research-os
```

Lint checks:

```bash
uv run --script .claude/skills/research-lint/scripts/lint_broken_links.py --research-dir ralph-research-os
uv run --script .claude/skills/research-lint/scripts/lint_orphans.py --research-dir ralph-research-os
uv run --script .claude/skills/research-lint/scripts/lint_missing_hubs.py --research-dir ralph-research-os
```

## Current Validation

- local skills present
- index generator works against `ralph-research-os/`
- broken links: 0
- orphan sources: 0
- missing hubs: 0
- YAML files parse

## Runtime Caveat

The workshop skills are installed in the local Claude-style `.claude/skills/` location from the workshop instructions. This makes the repo and scripts available locally. Whether slash commands like `/research` appear automatically depends on the active agent runtime. In OpenClaw/Codex, RALPH uses the same files and scripts directly.

## Obsidian Status

Current verified status:

- `ralph-research-os/` is an Obsidian-compatible markdown vault.
- `.claude/skills/obsidian-cli` is installed.
- 2026-09-01 refresh: the official Obsidian CLI is active through `/home/coder/.local/bin/obsidian`.
- `/home/coder/.local/bin/obsidian version` returned `1.13.7 (installer 1.13.7)`.
- `/home/coder/.local/bin/obsidian files` returned workspace vault files.
- `openclaw wiki obsidian status` reports CLI available, and Obsidian search finds current RALPH notes.

Verification on 2026-07-01:

- `command -v obsidian` returned no CLI.
- `openclaw nodes status` returned `Known: 0 · Paired: 0 · Connected: 0`.
- `openclaw nodes list` returned `Pending: 0 · Paired: 0`.
- `openclaw mcp list` returned no configured MCP servers.

Treat Obsidian CLI as an active local helper for search/open/navigation sanity checks, while keeping Markdown/YAML files as the durable source of truth. Scheduled and isolated workers must still work from the file-based AI Research OS contract.

## Video Guide

Tomas provided the AI Research OS workshop video as a guide source:

- raw source: `raw/youtube-ai-research-os-workshop-video.md`
- source page: `wiki/sources/youtube-ai-research-os-workshop-video.md`
- RALPH adaptation note: `wiki/notes/2026-07-01-ai-research-os-video-guide.md`

The install was validated by attempting the workshop YouTube transcript script. The script is installed and callable, but YouTube blocked transcript retrieval from this runtime. RALPH therefore stores the video page notes and records the transcript blocker as a media-ingest unknown.
