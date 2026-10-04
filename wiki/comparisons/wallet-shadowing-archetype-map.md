---
type: comparison
name: Wallet Shadowing Archetype Map
sources:
  - raw/wallet-shadowing-latency-axis-correction-2026-07-01.md
  - raw/wallet-shadowing-chatgpt-session-transcript.md
  - raw/wallet-shadowing-claude-session-transcript.md
related:
  - wiki/concepts/shadowability-latency-axis.md
  - wiki/concepts/forward-paper-trade-gate.md
created: 2026-07-01T22:45:00Z
last_updated: 2026-08-31T17:47:38Z
---

# Wallet Shadowing Archetype Map

| Archetype | Shadowability | Why | Main risk | First RALPH test |
| --- | --- | --- | --- | --- |
| Structural / funding-arb wallets | High in principle | Edge accrues over hours/days and is less dependent on being first | Delta-neutral books may be hard to infer from one wallet | Prior-art scan and detection feasibility |
| Mid-cap accumulation wallets | High to medium | On-chain accumulation may lead price over days; enough liquidity without CEX-only speed | Coverage and false positives | Cohort-flow prior art and data-source scan |
| Aggregate smart-money flow | High to medium | Cohorts reduce single-wallet noise and selection bias | Defining cohort without vendor bias | Dune/Nansen/Arkham/Copin feasibility scan |
| Hyperliquid directional perp traders | Medium to low | Clean data rail, but BTC/ETH directional edge may be crowded and fast | CEX-led price discovery, beta masquerading as alpha | Hyperliquid data feasibility and beta-adjusted paper-trade |
| Trump-person event wallets | Low for copy, useful radar | Event-timing may be informative but moves can be too fast to copy | Late entry and false attribution | Radar-only event taxonomy |

## RALPH Decision

Do not make Hyperliquid BTC/ETH directional perp copy-trading the default. Treat it as the first data feasibility branch because the API is practical.

The strategy decision should be made after comparing archetypes by latency tolerance and evidence quality.

## 2026-08-31 Shadowability Routing Update

This update closes `discovery.wallet-shadowing-archetype-shadowability-map` as a routing-only synthesis across the funding/basis, slow accumulator, event-radar, and wallet-delay evidence branches.

No scanner, cohort, alert, threshold, account, key, paid source, risk sizing, TP/SL, execution behavior, scheduler change, public output, or strategy promotion is authorized by this map.

| Archetype | Latency fit | Data availability | Hidden-hedge risk | Exit observability | No-key measurability | Next falsifier | Route |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Market-level funding/basis baseline | High: hours/days | Strong for Hyperliquid market funding, OI, premium, mids, and DefiLlama context | Low at market level; high only if reinterpreted as wallet-level actor edge | Funding accrual and market context observable; actual hedge unwind not relevant unless turned into actor strategy | Active: public snapshot table and manual elapsed-time rerun work | Fixed-window paper accounting versus stable/yield, no-trade, BTC/ETH/SOL beta, costs, sign flips, and tail-risk flags | Best current no-key comparison floor, not wallet alpha |
| Wallet-level structural funding/basis | High in principle | Weak: known-address state/fills/funding only, capped history, no cross-venue inventory | Very high: hedge can be off-venue, split across wallets/subaccounts, spot, borrow, options, vault, or OTC | Weak: visible perp/funding leg does not show actor-level entry/exit book | Watch only: useful for rejecting stale/capped/contradictory known addresses | Approved actor-clustering plus cross-venue exposure sample; otherwise downgrade to market-level baseline | Watch / weak-public-detectability |
| Slow mid-cap accumulator following | High: days/weeks | Weak no-key; highest-fit sources are Nansen Smart Money netflows, Dune exports/SQL, Arkham enrichment after approval | Medium: less hedge-specific, but entity labels and internal/LP/treasury flows can mislead | Currently the main blocker: missing distribution rows are a veto | Not active as cohort construction; public context only via DefiLlama/liquidity routes | Approved export or manual table with 20+ wallets/entities, 7-14 day entry plus exit/distribution rows, delayed follower PnL, liquidity and beta context | Candidate / access-gated alpha branch |
| Aggregate smart-money cohort flow | Medium-high: hours/days/weeks depending window | Access-gated; source fit overlaps Nansen, Dune, Arkham | Medium: cohort aggregation reduces single-wallet noise but vendor labels can hide selection bias | Must include reductions, CEX deposits, bridge-outs, or explicit no-exit status | Not enough no-key entity/cohort coverage yet | Source/export evaluation that freezes cohort before outcome scoring and removes largest winner | Candidate / source-gated |
| Event-triggered wallet-shadowing | Medium-low: event windows can be minutes to hours | Medium for known Hyperliquid addresses and official event timestamps; weak for broad universe | Medium-high: event positioning can be hedged or beta-driven | Required; radar-only if exits cannot be captured | Active for tiny measurement: recent public fills plus candle joins can test 15s/60s/180s/5m delay | Tiny frozen event ledger with 20+ quality observations across 3+ event windows, same-run raw fills and candles, costs, beta, outlier and exit checks | Radar-to-paper only after falsifier |
| Hyperliquid directional perp traders | Low-medium: clean route, often fast edge | Stronger no-key mechanics for known addresses; leaderboard seeds are biased | Medium: positions may hedge elsewhere and leaderboard PnL is survivor-selected | Partial: fills can show closes when uncapped/recent, but broad history is capped | Active for triage and delay mechanics, not copyability proof | Activity-defined non-leaderboard universe plus latency/cost/exits; reject leaderboard-only cohort | Triage / prior art |
| Trump-person event radar wallets | Low for copy, useful context | Official event sources are public; wallet attribution/source timing is fragile | High: attribution, rumor, token-noise, and beta risk | Weak unless paired with event-wallet ledger | Context-only with source-ranked event records | Keep event records radar-only; only promote to event-ledger row if upstream timestamp and wallet fills are verified | Watch / radar-only |

## Ranking

1. Use market-level funding/basis as the current no-key comparison floor because it is measurable now and slow enough for patient-retail validation.
2. Keep slow mid-cap accumulator following as the higher-upside alpha branch, but only after approved/exported smart-money flow data includes exits.
3. Treat event-triggered wallet-shadowing as a tiny falsifier branch, not a scanner branch, because delay measurement works but edge evidence does not exist.
4. Keep Hyperliquid directional perp copying and copytrading products as prior art, seed triage, and rejection mechanics.
5. Keep Trump-person events as radar context only.

## Decision

`discovery.wallet-shadowing-archetype-shadowability-map` is complete.

Verdict: RALPH should route wallet-shadowing work by latency plus observability, not by the excitement of the source. The only currently active no-key branch with good latency and data availability is market-level funding/basis baseline observation. The most promising wallet/cohort alpha branch remains slow accumulation, but it is blocked by access/export and exit-distribution visibility. Event and Hyperliquid wallet-shadowing stay useful as falsifiers and data-rail tests, not as promoted strategies.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, scanner, cohort, or strategy promotion changed.
