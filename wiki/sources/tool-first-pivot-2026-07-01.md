---
type: source
name: Tool-First Pivot
sources:
  - raw/tool-first-pivot-2026-07-01.md
related:
  - wiki/concepts/tool-first-not-build-first.md
  - wiki/comparisons/existing-tools-vs-custom-ralph-layer.md
created: 2026-07-01T22:58:00Z
last_updated: 2026-07-01T22:58:00Z
---

# Tool-First Pivot

## Source

Telegram discussion where Tomas challenged why RALPH was drifting toward building scanners or bots when existing products and frameworks may already solve large parts of the workflow.

Raw: `raw/tool-first-pivot-2026-07-01.md`

## Summary

This source changes the RALPH build stance:

> Before building anything, verify which existing tools already solve the job.

The key distinction is:

- do not rebuild execution engines, grid bots, copy platforms, or data warehouses;
- only build the missing strategy-specific signal, validation glue, or decision discipline that existing tools do not provide.

## Verified Tool Notes

Official or primary docs checked during this turn:

- Freqtrade supports backtesting and dry-run; its docs also include lookahead-analysis for bias detection.
- Freqtrade has official Hyperliquid exchange notes. Hyperliquid live/private operations require wallet/API-wallet signing, so RALPH should not jump to live use.
- Hyperliquid's official info endpoint supports user/exchange info and requires pagination for larger time ranges.
- Dune documents Hyperliquid market data including volume, open interest, funding, and related metrics, but marks the data as monthly-updated.
- Copin documents Hyperliquid copy-trading connection through a Hyperliquid API wallet.
- Pionex and 3Commas provide grid/range bot products.

## RALPH Implication

The next loop should be tool-first:

1. What can be used immediately?
2. What can be used only in paper/no-key mode?
3. What requires keys/capital and therefore explicit approval?
4. What truly needs custom code?

