---
type: note
topic: strategy-family-taxonomy
created: 2026-08-30T09:22:00Z
last_updated: 2026-08-30T09:22:00Z
work_item: investigation.strategy-family-taxonomy
status: complete
scope: research-only
sources:
  - raw/patient-retail-strategy-map-2026-07-01.md
  - raw/ralph-operating-thesis-voice-note-2026-07-01.md
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - 2026-07-01-m1-strategy-seed-scan.md
  - 2026-07-02-strategy-leg-garden.md
  - ../concepts/patient-retail-strategy-map.md
  - ../comparisons/patient-retail-strategy-archetypes.md
  - 2026-08-30-build-vs-buy-decision-memo.md
  - 2026-08-30-mev-bot-failure-mode-extraction.md
---
# Strategy Family Taxonomy

## Purpose

This closes `investigation.strategy-family-taxonomy` as a compact routing taxonomy for RALPH's strategy research.

It uses existing RALPH notes and does not add a new strategy candidate, data rail, package, account, key, paid service, live alert behavior, or execution path.

## Selection Axes

Every strategy family should be classified by:

- speed: structural, slow informational, delegated, fast informational, or speed/ordering;
- data rail: public/no-key, local alert history, account/key-required, paid/API-required, or unavailable;
- validation path: source falsification, local stats, replay, forward paper, or execution-only;
- baseline: staking/yield, buy-and-hold, candle/regime, random-timed trade, simple grid, or no-trade;
- main failure mode: latency, selection bias, tail risk, hidden hedges, overfit, crowding, slippage, or impossible fills;
- current state: killed, watch, candidate, active research, or approval-required.

## Family Map

| Family | Speed | Baseline | Main failure | Current state | Next allowed move |
| --- | --- | --- | --- | --- | --- |
| Funding/basis structural baseline | structural / slow | staking/yield and no-trade | funding flip, tail liquidation, hedge cost, venue risk | candidate/watch | public data feasibility and simple baseline monitor |
| Smart-money accumulation cohort | slow informational | buy-and-hold and market beta | exit/distribution risk, label survivorship, liquidity | candidate | source/access scan and frozen cohort paper spec |
| Slow mid-cap spot accumulation | slow informational | BTC/ETH/SOL beta and simple momentum | low liquidity, becoming exit liquidity, bad labels | candidate | data-source fit and exit-shadowing kill test |
| Aggregate cohort flow | slow informational | single-wallet copy and market beta | noisy cohort definition, hidden hedges, selection bias | candidate | cohort definition plus historical/forward falsifier |
| Event-triggered wallet/radar | fast informational / radar | event window beta and no-trade | attribution error, detection delay, impossible copy timing | watch/radar | radar-only rules and delay model |
| Copy vaults / auto-copy | delegated | operator benchmark and no-copy | survivorship, blow-up, fees, opacity | prior-art/reference | product/source falsification, not execution |
| CEX TA/orderflow alert edge | mixed: fast to medium | candle/regime baseline and no-trade | overfit, stale orderflow, weak forward evidence | active research/paper | strict filter and forward paper only |
| Range/grid | structural/statistical | simple grid and buy-and-hold | trend tail loss, fees, inventory | watch | existing-tool trial design before custom build |
| Liquidation-map liquidity provision | event/structural | drawdown/candle reversal | negative skew, tail clusters, crowded heatmaps | killed for current config | do not reopen without pre-registered new question |
| Speed MEV / DEX arb / sandwich | speed/ordering | no-trade after infra cost | latency competition, simulation error, execution wiring | discard/reference | case-file lessons only |
| DeFi position/risk monitoring | tool/monitor | manual monitoring | stale data, false urgency, no direct alpha | watch/tool | source/portfolio utility memo |
| New-chain scout / airdrop farming | slow/effort | opportunity cost | sybil filters, low payout, distraction | watch | source scan only if queue value rises |
| Prediction market event systems | information/microstructure | no-trade and market odds | low trust, crowded, market rules | watch | only if Tomas reopens trust question |

## Priority Rule

Current RALPH priority should favor:

1. slow structural baselines that can be measured cheaply;
2. slow informational cohort ideas with public/no-key or approved-source data;
3. active TA/orderflow/paper evidence only when it feeds strict rejection or forward-paper gates;
4. delegated/productized rails as build-vs-buy references;
5. speed/ordering work only as failure-mode research unless Tomas explicitly reopens it.

## Rejection Rule

A family should not become a candidate if:

- its edge needs millisecond or low-second execution;
- the only evidence is leaderboard rank, social proof, or vendor labels;
- it cannot name a dumb baseline;
- it requires keys, account setup, paid data, or execution before T1/T2 evidence;
- it cannot define what would kill it.

## Queue Implication

The taxonomy supports the current queue order:

- keep TA and AVAX threshold rechecks on watch until enough rows exist;
- continue ready investigation/discovery items that improve source discipline, strategy selection, or validation;
- avoid broad framework or infrastructure work unless tied to a missing capability;
- keep copytrading/wallet-following as source and forward-paper research, not live copying.

## Boundaries

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
