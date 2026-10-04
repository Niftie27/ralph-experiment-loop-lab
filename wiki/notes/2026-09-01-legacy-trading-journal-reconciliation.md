---
type: note
topic: legacy-trading-journal-reconciliation
created: 2026-09-01T20:50:00Z
last_updated: 2026-09-01T20:50:00Z
work_item: maintenance.legacy-trading-journal-reconciliation
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../../../trading-journal/README.md
  - ../../../trading-journal/2026-08-10-eth-long-sl.md
  - ../../../trading-journal/2026-08-11-eth-alert-hypothetical-tp.md
  - ../../../trading-journal/2026-08-11-hype-short-close.md
  - ../../../crypto-updates/wiki/trading-journal/index.md
  - ../../../crypto-updates/wiki/trading-journal/daily/2026-08-10.md
  - ../../../crypto-updates/wiki/trading-journal/daily/2026-08-11.md
  - ./2026-09-01-workspace-evidence-routing-map.md
---
# Legacy Trading Journal Reconciliation

## Purpose

This pass checks whether the small root `trading-journal/` directory is just stale duplication or contains records missing from the newer generated `crypto-updates/wiki/trading-journal/` surface.

## Finding

Root `trading-journal/` contains three useful manual records:

| File | Record | Status |
| --- | --- | --- |
| `trading-journal/2026-08-10-eth-long-sl.md` | ETHUSDT long, alert-driven, stopped out; Bybit average entry `1878.043`, average exit `1867.25`, closed PnL `-69.36967083 USDT` | Not represented as an execution in generated daily journal. |
| `trading-journal/2026-08-11-eth-alert-hypothetical-tp.md` | ETHUSDT alert hypothetical TP reconstruction; alert `2026-08-11T15:37:24.866Z`, modeled TP hit around `1861.63-1864.43` depending on fill model | Related alert exists in generated journal, but the manual TP reconstruction is not represented. |
| `trading-journal/2026-08-11-hype-short-close.md` | HYPEUSDT manual/emotional short close; average entry `55.05`, exit `54.40`, closed PnL `+110.1164009 USDT` | Not represented as an execution in generated daily journal. |

The generated Crypto Updates daily pages for `2026-08-10` and `2026-08-11` currently report `Executions: 0` and only list paper/shadow alerts. That means the current generated journal is not complete for early August manual/live trade review.

## Decision

Keep `crypto-updates/wiki/trading-journal/index.md` as the current generated execution/alert join surface, but treat root `trading-journal/` as legacy manual evidence that must be checked when reviewing August 10-11 process quality.

Do not hand-edit generated `crypto-updates/wiki/trading-journal/*` pages. A future reconciliation should either:

- add a separate manual-import source path to the generator, or
- explicitly mark the legacy root journal as a companion source in the generated journal index.

Until that exists, any claim about August 10-11 execution counts must mention this gap.

## Routing

- Live/process review for August 10-11 should read this note, then root `trading-journal/README.md`, then the three legacy files.
- Generated journal reads should still start from `crypto-updates/wiki/trading-journal/index.md`.
- Alert-quality stats should not count the manual HYPE short as an OpenClaw setup win; the source file explicitly classifies it as manual/emotional.
- The ETH hypothetical TP is a missed alert-driven opportunity, not a filled live trade.

## Boundary

This is local reconciliation memory only. It changes no generated Crypto Updates runtime data, no watcher behavior, no alert wording, no scheduler, no account/key/API access, no live trading, no order handling, no risk/sizing/TP/SL, and no strategy promotion.
