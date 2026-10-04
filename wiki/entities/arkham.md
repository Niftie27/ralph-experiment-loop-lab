---
type: entity
name: Arkham
aliases: [Arkham Intelligence]
sources: []
related:
  - core/data-rails.md
created: '2026-07-01T05:55:16Z'
last_updated: '2026-08-31T17:56:47Z'
---

# Arkham

Arkham is treated as a candidate wallet/entity intelligence rail.

The first question is not whether Arkham is interesting. The question is whether it produces labels, context, coverage, exports, or API access that improve research versus raw on-chain analysis.

## 2026-08-31 Access Evaluation

Current verdict: Arkham is a potentially strong enrichment rail for entity labels, address clustering, cross-chain transfers, token flow, portfolio history, and HyperCore entity/account context, but it is not active in this workspace.

Public docs show relevant endpoints for RALPH, including intelligence lookup, transfers, token top-flow, entity balance changes, portfolio/history, loans, counterparties, volume, and HyperCore summaries/trades. The docs also say API use requires an Arkham account, API plan or trial, and API key. Subscriptions are usage-based and start at $100, with trial access possible after request review. Direct no-key probes from this workspace returned HTTP 400 with an API-key signup message, including for endpoints documented as zero-credit.

Route: keep Arkham as `needs-approval / enrichment-first`. Do not treat it as an active no-key rail, and do not use it to select copy candidates without frozen export rows, confidence labels, exit/distribution coverage, and baseline/falsifier checks.
