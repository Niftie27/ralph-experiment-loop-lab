---
type: note
topic: obsidian-cli-status-refresh
created: 2026-09-01T20:55:00Z
last_updated: 2026-09-01T20:55:00Z
work_item: maintenance.obsidian-cli-status-refresh
status: complete
scope: tooling
tags:
  - ralph
  - research-note
  - automation
related:
  - ../../decisions/unknowns.md
  - ../../core/ai-research-os-setup.md
  - ../../automation/retrieval-router.yaml
  - ../../../TOOLS.md
---
# Obsidian CLI Status Refresh

## Purpose

`U-016` still carried an old M1 answer that no `obsidian` CLI was active in the runtime. The current workspace has since gained a working headless official Obsidian CLI path, so RALPH's tooling state needs a current-status note.

## Current Verification

Checked on 2026-09-01:

- `openclaw wiki status`: main wiki vault mode is `bridge`, render mode is `obsidian`, Obsidian CLI is available, bridge is enabled.
- `openclaw wiki obsidian status`: CLI available at `/home/coder/.local/bin/obsidian`.
- `/home/coder/.local/bin/obsidian version`: `1.13.7 (installer 1.13.7)`.
- `/home/coder/.local/bin/obsidian files`: returned workspace vault files, including `AGENTS.md` and `continuation-prompts/*`.
- `openclaw wiki obsidian search`: finds current RALPH notes from the workspace vault.

## Decision

Update `U-016` for current routing: Obsidian is no longer only a human-facing Markdown UI. The official CLI is active through the local headless wrapper and can be used for file/search/open/navigation sanity checks.

Keep the file-based AI Research OS contract anyway. Scheduled or isolated workers must still work from Markdown/YAML indexes without relying on a GUI process.

## Boundary

This is tooling-state memory only. It changes no Obsidian config, no scheduler, no connector setup, no account/key/API access, no live trading, no alert behavior, no execution behavior, and no public output.
