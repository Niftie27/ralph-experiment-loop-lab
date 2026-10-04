---
type: research-lane
status: active
created: 2026-09-28T22:20:00Z
tags:
  - ralph
  - research-only
  - copytrading
  - wallet-shadowing
  - no-live-trading
related:
  - ../../wiki/concepts/wallet-shadowing-strategy-model.md
  - ../../wiki/comparisons/fast-copy-trading-vs-slow-accumulator-following.md
  - ../../automation/retrieval-router.yaml
---

# Copytrading Research Lane

Purpose: separate "copytrading as a product/execution surface" from "wallet/cohort behavior as research evidence."

RALPH's current fit is not fast blind copying. The useful branch is:

- slow accumulator following
- cohort flow
- wallet/entity labels
- delayed follower paper tests
- event-window falsifiers

## Folder Use

- `tool-access-map.md` - current copy/wallet tools and what they unlock.
- Future notes can hold named wallet/cohort/export decisions, but no private keys or credentials.

## Current Stance

| Branch | Status | Reason |
| --- | --- | --- |
| Fast perp copytrading | `watch/rejected-by-default` | Latency, slippage, hidden hedges, crowded exits, and selection bias dominate. |
| Slow spot/mid-cap accumulator following | `watch/needs-access` | Better fit to Tomas's patient-retail thesis, but requires entry and exit/distribution rows. |
| Hyperliquid public known-wallet tests | `active-tiny-falsifier` | Useful for mechanics and delay samples, not enough for universe discovery. |
| Copin/GMGN style products | `prior-art/watch` | Useful for settings and failure modes; not approved for execution. |
| Nansen/Dune/Arkham exports | `needs-approval` | Could unlock smart-money/cohort rows if bought or exported. |

## What "Start Copy Trading Folder" Should Mean

It should not mean "turn on copying."

It should mean:

1. Collect tools and pricing.
2. Define copyability gates.
3. Build paper-only forward tests from frozen wallet/cohort rows.
4. Compare delayed follower results against no-trade and simple beta exposure.
5. Only after repeated positive paper evidence, ask Tomas for a separate execution mandate.

## Required Copyability Gates

- 20+ quality observations.
- 3+ independent windows or cohorts.
- Entry and exit/distribution visibility.
- Delay model: 30s/60s/180s or chain-specific realistic delay.
- Slippage and fees.
- Hidden hedge and cross-venue caveat.
- Liquidity/market-cap caps.
- Outlier control by wallet, token, event, and day.
- No single-wallet dependence.

## Boundary

No live copying, no wallet connection, no private keys, no exchange/API key, no paid signup, no public posting, no scheduler, no order execution, and no strategy promotion without explicit approval.
