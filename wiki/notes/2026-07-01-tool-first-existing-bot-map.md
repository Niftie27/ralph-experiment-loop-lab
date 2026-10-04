---
type: note
name: Tool-First Existing Bot Map
sources:
  - raw/tool-first-pivot-2026-07-01.md
tags:
  - ralph
  - research-note
  - source-scan
related:
  - wiki/concepts/tool-first-not-build-first.md
  - wiki/comparisons/existing-tools-vs-custom-ralph-layer.md
created: 2026-07-01T22:58:00Z
last_updated: 2026-07-01T22:58:00Z
---

# Tool-First Existing Bot Map

## Working Answer

Tomas is right to challenge build-first framing.

Many pieces already exist:

- grid/range bots;
- backtest engines;
- dry-run engines;
- copy-trading products;
- data warehouses;
- analytics dashboards.

RALPH should only build after proving the missing piece is not already available.

## Litecoin / Range Bot Note

Litecoin as a less crowded asset is not automatically easier.

The trade-off is:

- less attention may mean less competition;
- less attention can also mean less opportunity, weaker narrative, thinner liquidity, and worse slippage.

A price-band bot is a grid/range strategy, not wallet shadowing. This is already productized and should be tested through an existing grid bot or Freqtrade-style strategy before custom work.

## Practical Pivot

Next M1 work should be:

1. `existing-tool-fit-map`
2. `freqtrade-no-key-dry-run-spike`
3. `grid-range-existing-tool-trial-design`
4. `patient-retail-archetype-prioritization`

Only after this should RALPH decide whether to build:

- smart-money cohort adapter;
- funding/basis monitor;
- Freqtrade strategy plugin;
- no custom code at all.

## Key Safety Boundary

Any tool requiring API keys, wallet/API-wallet private keys, exchange accounts, or live capital remains inspect-only until Tomas explicitly approves.

