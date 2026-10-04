---
type: research-lanes-index
status: active
created: 2026-09-28T22:20:00Z
tags:
  - ralph
  - research-only
  - navigation
  - data-rails
related:
  - ../wiki/research-map.md
  - ../automation/retrieval-router.yaml
  - ../core/data-rails.md
---

# RALPH Research Lanes

This folder is the durable workspace for tool/data/source research that sits before strategy code.

Use it for:

- data rails and vendor access maps
- pricing and buy/no-buy notes
- metric inventories and source routes
- workflow designs that explain how tools combine
- copytrading and wallet-following tool research

Do not use it for:

- live execution
- account credentials or API keys
- scheduler payloads
- strategy promotion
- thresholds, sizing, TP/SL, or paper/live alert logic

## Folders

- `orderflow/` - tape, book, delta, liquidity, ATAS, Tardis, exchange archive, and replay research.
- `metrics/` - market/context metrics such as OI, funding, basis, liquidations, breadth, volatility, social/narrative, and on-chain flows.
- `vendor-access-pricing/` - current pricing/access logs and buy/no-buy shortlist.
- `copytrading/` - wallet shadowing, slow accumulator following, copy products, and automation safety.

## Rule

Every file here should classify each tool or metric as one of:

- `active` - usable now from this workspace with no new approval
- `watch` - useful but waiting for evidence, trigger, or better sample
- `needs-approval` - requires account, key, payment, wallet, private export, or explicit HITL approval
- `vendor` - paid/provider rail; track pricing and fit before buying
- `rejected` - not useful for RALPH's current goal

Research here can recommend experiments, but it cannot itself change live alerts, paper/demo logic, schedulers, risk, sizing, TP/SL, or execution.
