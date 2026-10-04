---
type: note
topic: funding-basis-wallet-detection-spike
created: 2026-08-31T11:25:45Z
last_updated: 2026-08-31T11:25:45Z
work_item: discovery.funding-basis-wallet-detection-spike
status: complete
scope: research-only
sources:
  - 2026-08-31-funding-basis-baseline-monitor.md
  - 2026-08-31-funding-basis-public-snapshot-table.md
  - 2026-08-31-funding-basis-fixed-window-accounting-design.md
  - 2026-08-30-hyperliquid-data-feasibility-spike.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-30-hyperliquid-leaderboard-address-sample.md
  - 2026-08-30-wallet-shadowing-forward-paper-trade-spec.md
  - ../concepts/funding-basis-structural-baseline.md
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals
tags:
  - ralph
  - research-note
  - demo-sim
  - validation
  - wallet-shadowing
  - strategy-family
  - funding
related:
  - ../concepts/funding-basis-structural-baseline.md
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
  - ../../decisions/copytrading-watch-ledger.md
---
# Funding/Basis Wallet Detection Spike

## Purpose

This closes `discovery.funding-basis-wallet-detection-spike` as a bounded detectability classification.

Question: can structural funding/basis positions be detected reliably from public wallet or account data?

No scanner, cohort, alert, threshold, account, key, paid service, risk sizing, TP/SL, execution, scheduler, public posting, or strategy promotion was created.

## Public Data Reality

Hyperliquid is useful for known-address checks, but the public route does not make structural basis books visible enough to trust at wallet level.

What public/no-key data can show:

| Surface | Public signal | Detectability value |
| --- | --- | --- |
| `clearinghouseState` | Current perp account value, margin summary, and open perp positions for a known address | Useful live snapshot for a known account, not historical proof and not cross-venue proof |
| `userFills` | Most recent fills, capped at 2000 in the ordinary route | Useful rejection/watch triage; incomplete for active accounts with high turnover |
| `userFillsByTime` | Time-window fills, capped at 2000 per response and only the 10000 most recent fills are available | Better than latest fills, still incomplete for full long history and structural books |
| `userFunding` / ledger updates | Funding and non-funding ledger rows for a known address | Can show an address paid or received funding on Hyperliquid, not whether it was hedged elsewhere |
| `metaAndAssetCtxs`, `fundingHistory`, `predictedFundings` | Market-level funding, premium, OI, liquidity, and cross-venue predicted funding context | Stronger fit for market-level baseline monitoring than wallet-level strategy detection |
| Public stats leaderboard | Many structured addresses with public PnL/account metrics | Seed discovery only; leaderboard selection is biased by construction |

## Hidden-Hedge Risk

Structural funding/basis is specifically hard to infer from one address because the apparent perp leg may be only one side of the book.

Examples:

- Hyperliquid short perp plus spot held on a CEX, custodial venue, EVM wallet, Solana wallet, or another perp venue.
- Hyperliquid long perp paired with borrow, options, OTC, vault, or sub-account exposure that is not linked by the public address.
- Multiple addresses or sub-accounts splitting legs, collateral, and rebalance flow.
- Funding received on one account while directional or basis risk is neutralized somewhere RALPH cannot see.

Public `clearinghouseState` can say "this address has this current perp exposure." It cannot say "this economic actor is running a delta-neutral basis trade." Without account clustering and cross-venue inventory, absence of a visible hedge is not evidence that the account is directional, and presence of a visible perp leg is not evidence that the account is a copyable structural carry trade.

## Account-Level Visibility Limits

Known-address Hyperliquid checks remain useful, but they are mostly negative filters:

- reject stale or emptied accounts;
- flag capped fills and incomplete history;
- flag one-asset concentration and unknown coin concentration;
- flag open-position accounts as live-copy temptation;
- flag negative returned close-fill PnL;
- flag current state that contradicts leaderboard profile claims.

They cannot certify:

- complete trading history for high-turnover addresses;
- actor-level identity across master accounts, sub-accounts, vaults, agents, or off-venue accounts;
- the spot leg of `long spot + short perp`;
- borrow, collateral, liquidation, and rebalance mechanics;
- whether a funding stream was earned with acceptable tail risk;
- whether Tomas could enter and exit after observing the wallet.

This makes wallet-level funding/basis detection a poor primary rail in the no-key phase.

## Leaderboard Bias

Leaderboard rows are useful address seeds, not evidence. The previous public route ledger returned tens of thousands of rows, but those rows are still filtered by visible performance metrics. That bakes in survivor, withdrawal, stale-account, one-hit-winner, and current-account-value bias before RALPH even starts screening.

For structural funding/basis, the bias is worse than ordinary directional copytrading because a leaderboard can reward the visible leg or visible account while hiding:

- losses or hedge costs in another venue;
- liquidation or margin risk that did not realize inside the sampled window;
- capital intensity of the hedge;
- execution friction from repeated rebalancing;
- whether the account is a vault or strategy operator whose terms are not copyable.

No leaderboard-derived address should be treated as a funding/basis wallet candidate without independent actor-level evidence and forward paper rows. Under current constraints, that is not available.

## Better Current Shape

Market-level funding/basis monitoring is more realistic than wallet-level detection.

The market rail can measure the thing RALPH actually needs for a patient-retail baseline:

- public current funding;
- funding persistence and sign flips;
- premium / mark / oracle behavior;
- OI and daily notional;
- impact-price liquidity caveats;
- stable/yield baseline context;
- prior-run comparison after elapsed time.

This does not prove a profitable trade, but it creates a fair comparison floor. If future wallet/cohort alpha cannot beat the dumb market-level funding/basis baseline after conservative costs and tail-risk accounting, the wallet branch should be rejected or downgraded.

## Decision

`discovery.funding-basis-wallet-detection-spike` is complete.

Verdict: wallet-level structural funding/basis detection is `watch / weak-public-detectability` under current no-key constraints. Hyperliquid known-address routes can reject or triage accounts, but they cannot prove actor-level basis positions because hidden hedges, capped history, sub-account/address fragmentation, and leaderboard bias dominate the inference.

The stronger RALPH path is market-level funding/basis baseline observation plus fixed-window paper accounting. Wallet-level funding/basis should stay a source-lane watch item until Tomas explicitly approves an access path capable of actor-level clustering and cross-venue exposure checks.

## Next Safe Step

Do not build a wallet scanner for this branch now.

Safe next moves are:

- stop and leave funding/basis at manual elapsed-time rerun/watch state;
- later rerun the public snapshot table manually after real elapsed time;
- separately, if Tomas approves HITL access, evaluate Dune/Nansen/Arkham/Copin-style actor clustering and export quality before reopening wallet-level detection.

Any scheduler, live monitor, alert, account, key, paid API, demo/testnet setup, threshold, risk sizing, TP/SL, execution behavior, or public output requires separate explicit HITL.

## Boundary Delta

Changed: wiki/router/queue/state/log/memory/index only.

Boundary delta: no live trading, live copying, orders, wallet keys, exchange keys, paid services, account setup, demo/testnet setup, public posting, scheduler or cron changes, watcher behavior changes, live alert wording, thresholds, assets, taxonomy, trading implications, risk/sizing/leverage/TP/SL, execution behavior, dependency adoption, scanner, cohort, or strategy promotion changed.
