---
type: research-note
date: 2026-09-20
tags:
  - ralph
  - atas
  - atas-x
  - docs-ingestion
  - obsidian
related:
  - ../sources/atas-api-docs-2026-09-20.md
  - 2026-09-20-atas-x-speed-and-data-surface.md
  - 2026-09-20-atas-classic-vs-x-exporter-plan.md
  - 2026-09-20-atas-automation-access-audit.md
  - ../../core/data-rails.md
status: active-synthesis
---

# ATAS Docs Ingestion

Status: `active-synthesis`. Created after Tomas asked to read the ATAS/ATAS X docs and save the useful findings into Obsidian.

## What Was Read

- Official ATAS technical docs nav and top-level pages.
- Core implementation pages for indicators, ATAS X, receiving/processing data, performance, debugging, distribution, access, strategies/orders, data series, drawing, heatmap authoring, and examples.
- ATAS main site metadata and official GitHub examples repository.
- Local raw docs mirror created at `ralph-research-os/raw/atas-docs/2026-09-20/`: 161 downloaded files, 46 extracted HTML text pages, about 8.5 MB raw and about 400k extracted text characters. Manifest: `ralph-research-os/raw/atas-docs/2026-09-20/manifest.json`.

See [[../sources/atas-api-docs-2026-09-20|ATAS API and ATAS X Documentation]] for the source map.

## Local Cache

Use the local mirror before refetching:

- Raw HTML/assets: `ralph-research-os/raw/atas-docs/2026-09-20/docs.atas.net/en/`
- Extracted readable text: `ralph-research-os/raw/atas-docs/2026-09-20/text/`
- Manifest/checksums: `ralph-research-os/raw/atas-docs/2026-09-20/manifest.json`

Important extracted page for Classic vs ATAS X: `text/md_DataFeedsCore_2Docs_2en_20200__ATASX__Indicator.txt`.

## Synthesis

For RALPH, the useful ATAS docs reduce to three rails:

1. Manual CSV rail: already active through ATAS X Bid/Ask Tape and Smart Tape exports.
2. Read-only exporter rail: likely feasible as a no-custom-UI C# indicator running in ATAS X or Classic, writing append-only feature windows.
3. Avoided execution rail: strategy/order/account APIs exist in docs but remain explicitly out of scope.

ATAS X is the preferred platform target. The docs position X as cross-platform and compatible with most non-WPF Classic indicators. Tomas has already verified the relevant ATAS X widget exports. Classic should be checked only if ATAS X lacks a needed module/export path.

## Exporter Build Direction

- Build no UI and no custom editors.
- Multitarget `.NET 8` and `.NET 10` until Tomas provides the installed runtime.
- Install through `Add custom indicator` first; fallback to indicator folder.
- Use event/callback data:
  - `OnCalculate` for bar/cluster feature buckets.
  - `OnNewTrade` for tick/event timing.
  - `OnCumulativeTrade` and `OnUpdateCumulativeTrade` for aggregated trade flow.
  - `MarketDepthChanged` and depth snapshots only if needed.
- Do not use trading/order/account statistics in the RALPH orderflow rail.

## Parser And Feature Direction

Keep volume velocity as the screening trigger. ATAS confirmation features should come from:

- candle/tape delta -> `delta_velocity`
- bid/ask or cumulative direction -> `bid_side_velocity` / `ask_side_velocity`
- volume and price progress -> `volume_per_price_progress`
- poor progress against one-sided flow -> `absorption_score`
- flow deceleration after level test -> `exhaustion_score`
- acceptance beyond level + aligned delta + efficient progress + BTC gate -> `breakout_quality_score`

## Current Boundary

No exporter installed, no automatic ATAS capture, no order APIs, no account data, no paid feed setup, no live execution, no alert wording or threshold change. This is source ingestion and architecture memory only.
