---
type: note
topic: wallet-shadowing-archetype-shadowability-map
created: 2026-08-31T17:47:38Z
last_updated: 2026-08-31T17:47:38Z
work_item: discovery.wallet-shadowing-archetype-shadowability-map
status: complete
scope: research-only
sources:
  - ../comparisons/wallet-shadowing-archetype-map.md
  - 2026-08-31-funding-basis-wallet-detection-spike.md
  - 2026-08-31-funding-basis-public-snapshot-table.md
  - 2026-08-31-slow-accumulator-copytrading-source-fit.md
  - 2026-08-31-slow-accumulator-following-exit-risk-scan.md
  - ../comparisons/slow-accumulator-tool-fit-map.md
  - 2026-08-31-wallet-shadow-delay-evidence.md
  - 2026-08-30-event-triggered-wallet-shadow-falsification.md
  - 2026-08-30-trump-person-event-radar-rules.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
related:
  - ../comparisons/wallet-shadowing-archetype-map.md
  - ../concepts/shadowability-latency-axis.md
  - ../concepts/forward-paper-trade-gate.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
---
# Wallet-Shadowing Archetype Shadowability Map

## Purpose

This closes `discovery.wallet-shadowing-archetype-shadowability-map` as a bounded routing synthesis.

Question: after the funding/basis, slow accumulator, event-radar, and wallet-delay work, which wallet-shadowing archetypes are actually shadowable for Tomas under current constraints?

No scanner, cohort, alert, threshold, account, key, paid source, risk sizing, TP/SL, execution behavior, scheduler change, public output, or strategy promotion was created.

## Routing Matrix

| Archetype | Latency | Data availability | Hidden-hedge risk | Exit observability | No-key measurability | Next falsifier |
| --- | --- | --- | --- | --- | --- | --- |
| Market-level funding/basis baseline | Good: hours/days | Active public Hyperliquid plus DefiLlama context | Low at market level | Observable as funding and market context, not actor exits | Works now through manual snapshots | Fixed-window paper accounting versus costs, beta, sign flips, tail risk, and stable/yield baseline |
| Wallet-level structural funding/basis | Good in principle | Weak public known-address view | Very high | Weak because one visible leg is not the book | Triage/rejection only | Actor clustering plus cross-venue exposure sample after HITL access |
| Slow mid-cap accumulator following | Good: days/weeks | Access/export gated through Nansen, Dune, Arkham | Medium | Main blocker; missing exits are veto | No complete no-key cohort rail | Approved export/manual table with 20+ wallets/entities and entry plus exit/distribution rows |
| Aggregate smart-money cohort flow | Medium-high | Access/export gated | Medium; label bias replaces single-wallet noise | Must expose reductions/off-ramp context | Not enough no-key coverage | Frozen cohort export scored after selection, with largest winner removed |
| Event-triggered wallet-shadowing | Mixed: minutes to hours | Partial for known Hyperliquid addresses and official event timestamps | Medium-high | Required or radar-only | Small delay tests are measurable | 20+ quality event/account observations across 3+ frozen event windows |
| Hyperliquid directional perp traders | Often too fast | Strong public mechanics for known addresses; biased universe | Medium | Partial and capped | Good for delay/triage only | Activity-defined universe, latency/cost/exits, no leaderboard-only selection |
| Trump-person event radar | Poor for copy; useful context | Official event routes are public, wallet attribution fragile | High | Weak without separate ledger | Context-only | Source-ranked radar record, then event-ledger row only if upstream timestamp and fills verify |

## Synthesis

The ranking changed because the evidence is now separated by measurement layer:

- Funding/basis is slow enough and no-key measurable at market level, but wallet-level actor detection is weak because hidden hedges dominate.
- Slow accumulation fits Tomas's latency best as an alpha branch, but public/no-key data cannot yet produce the minimum frozen cohort plus exit/distribution table.
- Event-triggered wallet-shadowing now has a real delay measurement path for recent Hyperliquid fills, but it has not shown copyable edge.
- Directional perp copytrading has the cleanest public account mechanics and the worst selection-bias/latency temptation.
- Trump-person events remain useful for timestamped radar context, not copy claims.

## Route

Current best order:

1. Keep market-level funding/basis as the no-key comparison floor.
2. Keep slow accumulator following as access-gated alpha research, with exits first.
3. Use event/Hyperliquid wallet-shadowing only for tiny frozen delay falsifiers.
4. Treat copytrading products and leaderboard rows as prior art and seed triage.
5. Keep Trump-person events as radar-only overlays.

## Decision

`discovery.wallet-shadowing-archetype-shadowability-map` is complete.

Verdict: the next RALPH wallet-shadowing decision should not be "which wallet to copy." It should be "which archetype has latency tolerance, data availability, exit visibility, and a cheap falsifier." Under current no-key constraints, only the market-level funding/basis baseline is ready for continued observation. Slow accumulator following needs approved/exported smart-money data with exits. Event and Hyperliquid wallet-shadowing need a tiny frozen ledger before any paper-candidate wording.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, scanner, cohort, or strategy promotion changed.
