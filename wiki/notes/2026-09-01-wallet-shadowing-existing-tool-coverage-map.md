---
type: note
topic: wallet-shadowing-existing-tool-coverage-map
created: 2026-09-01T05:16:09Z
last_updated: 2026-09-01T05:16:09Z
work_item: unknowns.U-018
status: done
scope: research-only
sources:
  - 2026-08-30-existing-tool-fit-map.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-31-slow-accumulator-copytrading-source-fit.md
  - 2026-08-31-slow-accumulator-tool-fit-map-update.md
  - 2026-08-31-arkham-evaluation-checklist.md
  - 2026-08-31-smart-money-cohort-discovery-layer.md
  - 2026-08-31-wallet-shadow-event-candidate-signal-spec.md
  - 2026-09-01-event-vs-continuous-small-operator-map.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
  - source-scan
related:
  - ../../decisions/unknowns.md
  - ../../decisions/copytrading-watch-ledger.md
  - ../../automation/retrieval-router.yaml
---
# Wallet-Shadowing Existing Tool Coverage Map

## Purpose

Resolve `U-018` for current routing: classify which existing tools already cover enough of the wallet-shadowing workflow, and which missing pieces still require approval, exports, or a tiny falsifier instead of custom scanner work.

This is a tool-fit and access map only. It does not create accounts, keys, paid access, scrapers, collectors, scanners, schedules, alerts, thresholds, copy rules, demo/testnet setup, live trading, sizing, TP/SL, execution behavior, public posting, or strategy promotion.

## Workflow Coverage

| Workflow job | Existing tool/source coverage | Current access class | RALPH stance |
| --- | --- | --- | --- |
| Hyperliquid address seed discovery | Hyperliquid public stats leaderboard returns structured address rows without a key. | Active public/no-key, leaderboard-biased | Use only for seeds and prior-art triage; never copyability evidence. |
| Known-address state/fill checks | Hyperliquid official info endpoints support known-address state/fills/funding checks. | Active public/no-key | Good for tiny delay falsifiers and rejecting stale/tiny/high-turnover profiles. |
| Manual perp-copy UX and profiles | HypurrScan, HyperDash, Copin-style surfaces, HyperTracker pages. | Watch/manual or needs-access | Prior art and manual cross-check only; no active copytrading or account setup. |
| Slow smart-money accumulation | Nansen Smart Money netflows/holdings and Dune export/SQL routes. | Needs approval/key/export/payment or manual export | Highest-fit source family, but blocked until approved sample rows exist. |
| Entity/address enrichment | Arkham API/platform. | Needs approval/account/key/API plan | Enrichment-first candidate; not active and not primary signal source. |
| Cohort row construction | Nansen/Dune/Arkham-style rows plus local row contract. | Blocked until export/API sample | Require 20+ wallets/entities with 7-14 day entry plus exit/distribution coverage. |
| Delay and event falsifier | Hyperliquid public fills plus candles, joined in same run. | Active for tiny known-address tests after named trigger | Falsifier only; no scanner/capture run without Tomas selection or trigger. |
| Copy execution | Copytrading products, bot repos, browser-wallet/API-wallet apps. | HITL/execution-gated | Out of current scope; use as risk-boundary specimens only. |

## What Existing Tools Already Solve

Existing tools solve enough to avoid building generic wallet-shadow infrastructure now:

- address seed discovery for Hyperliquid perps;
- known-address public verification for recent fills/state;
- manual profile/UX prior art;
- source families for slow accumulator rows after approved access;
- enrichment candidates for labels/entities after approved Arkham access;
- framework and product examples showing execution risk boundaries.

RALPH's custom work should stay in the thin layer around these tools: frozen row contracts, access classification, delay/cost/exit/beta/hedge gates, quality flags, baselines, paper-only decision states, and durable memory.

## What Existing Tools Do Not Solve Yet

Missing or gated pieces:

- activity-defined non-leaderboard candidate universe;
- slow spot/mid-cap accumulation rows with exits;
- entity-level hidden-hedge visibility across venues;
- repeated event-window observations selected before outcome scoring;
- delayed follower results after realistic costs and missed fills;
- source export/API proof under Tomas's budget and approval boundaries;
- paper-candidate evidence with 20+ quality observations across independent windows.

Because these gaps are evidence gaps, not generic engineering gaps, the next move is not to build a scanner. It is to wait for a named trigger, row threshold, or HITL-approved tiny source/export sample.

## Decision

`U-018` is resolved for current routing.

Existing tools cover enough of wallet-shadowing that custom broad scanners, copy engines, and account-connected bots should remain out of scope. The active no-key route is Hyperliquid public seed plus known-address verification, but only for triage and tiny falsifiers. The serious slow-accumulator route is Nansen/Dune with Arkham enrichment after explicit approval and export/API verification.

Related open unknowns remain:

- `U-001`: Arkham value over public data awaits approved sample.
- `U-008` / `U-017`: delay, costs, exits, and selection bias need frozen rows.
- `U-019`: activity-defined non-leaderboard Hyperliquid universe still needs a bounded evidence artifact.
- `U-022` / `U-024`: cohort flow and mid-cap accumulation need exported rows.
- `U-039`: no-key non-leaderboard wallet-following discovery remains unresolved.

## Boundary Delta

Changed: wiki/router/queue/state/log/index/memory only.

Boundary delta: no account, key, paid service, API use, collector, scanner, scheduler, cron, systemd, alert, threshold, copy rule, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, wallet-shadow capture, paper-candidate wording, or strategy promotion changed.
