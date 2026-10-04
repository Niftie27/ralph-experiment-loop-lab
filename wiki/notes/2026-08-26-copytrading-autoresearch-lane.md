---
type: note
name: Copytrading Autoresearch Lane
created: 2026-08-26T20:58:00Z
last_updated: 2026-08-26T20:58:00Z
tags:
  - copytrading
  - wallet-shadowing
  - autoresearch
  - no-key
sources:
  - wiki/sources/slow-copy-trading-distinction-2026-07-01.md
  - wiki/notes/2026-07-01-wallet-shadowing-address-inventory.md
  - wiki/notes/2026-07-01-wallet-shadowing-next-direction.md
  - wiki/notes/2026-07-01-wallet-shadowing-prior-art-tool-scan.md
  - wiki/concepts/wallet-shadowing-strategy-model.md
  - wiki/concepts/shadowability-latency-axis.md
  - wiki/comparisons/fast-copy-trading-vs-slow-accumulator-following.md
related:
  - ../../decisions/copytrading-watch-ledger.md
  - ../../automation/ralph-autoresearch-loop.md
  - ../../automation/work-queues.yaml
---

# Copytrading Autoresearch Lane

Status: first-class RALPH autoresearch lane, research-only.

Tomas's "do not reinvent the wheel" rule applies directly here. RALPH should treat copytrading and wallet-following products, public profiles, public APIs, explorers, leaderboards, dashboards, and open repos as candidate source rails before building a scanner.

This does not mean live copying. The lane is only a watch/shadow/paper research input until Tomas explicitly approves a narrower change.

## Existing Local Direction

The older wallet-shadowing notes already split the work correctly:

- Fast perp mirroring is default-reject or radar because the edge is usually too fast for Tomas's latency.
- Slow mid-cap accumulator following remains plausible if it is cohort-based, liquidity-aware, and validated round-trip.
- Hyperliquid is the first practical public data rail for perp/account mechanics, not proof that perp copytrading is the best strategy.
- Trump-person event wallets remain radar-only unless a separate evidence gate proves they are repeatable, non-narrative signals.

The missing RALPH layer is therefore not "build copytrading." It is an independent validation layer that asks whether a source account or cohort survives delay, fees, slippage, beta, selection bias, capacity, and exit-shadowing.

## Access Check, 2026-08-26

Verified no-key/public routes:

| Route | Access observed | RALPH use | Status |
| --- | --- | --- | --- |
| Hyperliquid official `POST https://api.hyperliquid.xyz/info` | Local curl returned `meta`, `spotMeta`, `userFills`, and `clearinghouseState` without a key. Docs state `userFills` returns recent fills and `userFillsByTime` supports time windows with response limits. | Independent fill/position evidence for known addresses and small no-key feasibility tests. | active no-key read rail |
| Hyperliquid app leaderboard | Public page exists, but export/API shape was not verified. | Manual candidate leads only; avoid leaderboard-only selection bias. | watch |
| HypurrScan | Public explorer page is accessible. | Address/block/profile lookup and cross-checking. | watch/manual |
| HyperDash | Public explore pages list global/top trader discovery surfaces. | Prior-art and manual candidate source; export/API unverified. | watch/manual |
| ASXN Hyperscreener | Public dashboard describes real-time Hyperliquid analytics, top traders, perps, spot, HyperEVM, vaults, and revenue. | Prior-art and manual candidate source; export/API unverified. | watch/manual |
| HyperTracker / CoinMarketMan | Public pages describe Hyperliquid wallet leaderboard/profile tracking. | Prior-art and possible candidate source; API/product access not verified. | watch/needs-access for API |

Verified needs-access routes:

| Route | Access observed | RALPH use | Status |
| --- | --- | --- | --- |
| Dune API | Official docs require a Dune API key. Public web dashboards may still be useful manually, but repeatable API/export is not active here. | SQL screening and reproducible dashboards later. | needs-access |
| Arkham API | Official docs describe API access, keys, credit pricing, rate limits, and entity/label model. | Entity labels and attribution context; never truth by itself. | needs-access |
| Nansen API | Official docs require API key authentication. Nansen docs mention Hyperliquid leaderboard/smart-money surfaces, but this workspace has no active key. | Smart-money labels and slow accumulator discovery if Tomas approves access. | needs-access |
| Copin / HyperX / Dexly-style copy products | Public product/docs/blog pages show existing wallet discovery/copytrading UX. Account, API, export, and pricing fit were not verified here. | Prior art and manual discovery; not an active automated data rail. | watch/needs-access |

Source URLs checked:

- https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
- https://api.hyperliquid.xyz/info
- https://docs.dune.com/api-reference/overview/authentication
- https://arkm.com/api/docs
- https://docs.nansen.ai/getting-started/authentication
- https://hypurrscan.io/
- https://hyperdash.com/explore
- https://hyperscreener.asxn.xyz/
- https://hypertracker.io/
- https://hyperx.trade/hyperliquid/blog/hyperx-vs-copin-comparison

## Lane Contract

Use copytrading as a source lane, not an execution lane:

1. Find candidate accounts, wallets, or cohorts from existing public tools first.
2. Record every candidate in `decisions/copytrading-watch-ledger.md`.
3. Classify the strategy archetype before any statistics: fast perp, swing perp, slow spot accumulator, funding/basis, aggregate cohort flow, or event radar.
4. Assign latency sensitivity before trusting returns.
5. Record realized-history evidence source and whether it is full-history, recent-only, dashboard-only, API-backed, or manually observed.
6. Keep statuses conservative: `watch`, `proposed`, `needs-access`, or `rejected`.
7. Promote nothing to paper/live from leaderboard PnL alone.

## First Bounded Next Steps

1. Build a small public Hyperliquid address sample from public dashboards or known local radar addresses.
2. For each address, pull no-key `userFills` and `clearinghouseState` snapshots only.
3. Fill the copytrading ledger with evidence quality, holding period, capacity, and copyability risks.
4. Reject or demote fast/one-hit/liquidated/hidden-hedge profiles before any forward-test spec.
5. Only after a frozen cohort exists, write a forward paper-trade spec with latency/cost/capacity assumptions.

## Verify/Reassess

The lane is useful, but the first pass does not make a strategy claim. It verifies one active no-key rail, marks the high-value paid/keyed rails as unavailable in this workspace, and creates a durable ledger so future RALPH runs do not confuse public copytrading UX with validated edge.

Self-check: research-only; public/free/no-key sources only; no financial advice; no live trading; no exchange or wallet keys; no paid APIs; no cron/cadence change; no watcher wording, risk, sizing, TP/SL, execution, or orders changed. OpenClaw bridge ingest/search verified as `RALPH Copytrading Autoresearch Lane`.
