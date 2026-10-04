---
type: source
name: Liquidation Map Prior Art Gap Map
source: raw/liquidation-map-prior-art-gap-map-2026-07-01.md
origin: web
authors:
  - Tomas
  - assistant
published_date: 2026-07-01
ingested_at: 2026-07-01T23:55:00Z
tags:
  - liquidations
  - build-vs-buy
  - prior-art
  - hyperliquid
  - coinglass
  - nansen
  - 0xarchive
  - negative-skew
summary: Claim-specific verification correcting the liquidation-map branch. Existing liquidation heatmap and data products already exist; the real RALPH gap is exportable history, replay, methodology transparency, passive-order simulation, adverse selection, and tail-risk scoring.
sha256: 1cb8c902455499595b01653a06024dec2d49f5a9637fd1f4114c3560fe9febdc
related:
  - wiki/comparisons/liquidation-map-build-vs-buy.md
  - wiki/notes/2026-07-01-liquidation-map-feasibility-spec.md
  - wiki/comparisons/slow-accumulator-tool-fit-map.md
---

# Liquidation Map Prior Art Gap Map

This source records Tomas's correction that RALPH must verify before asserting and must not treat liquidation-map liquidity provision as a justified build merely because it sounds differentiated.

## Key Correction

Existing liquidation map products already exist. The possible custom gap is narrower:

- historical export;
- replayable data;
- methodology clarity;
- predicted liquidation levels versus actual liquidation events;
- passive limit-order simulation;
- adverse excursion and tail-risk scoring;
- Tomas-specific no-key/no-live validation.

## Current Answer

Do not build a generic liquidation heatmap.

Run a prior-art gap map first. If existing tools can answer the replay/risk question cheaply, use them. If they cannot, build only the missing adapter/scorer. If the replay is negative after costs and tail risk, discard the branch.
