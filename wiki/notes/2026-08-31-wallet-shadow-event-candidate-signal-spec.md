---
type: note
topic: wallet-shadow-event-candidate-signal-spec
created: 2026-08-31T21:37:14Z
last_updated: 2026-08-31T21:37:14Z
work_item: unknowns.U-002
status: done
scope: research-only
sources:
  - 2026-08-30-wallet-shadow-high-volatility-event-brief.md
  - 2026-08-30-event-triggered-wallet-shadow-falsification.md
  - 2026-08-30-wallet-shadowing-forward-paper-trade-spec.md
  - 2026-08-31-wallet-shadow-delay-evidence.md
  - 2026-08-31-wallet-shadowing-archetype-shadowability-map.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
  - strategy-family
related:
  - ../../decisions/unknowns.md
  - ../../decisions/candidates.md
  - ../../decisions/copytrading-watch-ledger.md
  - ../../core/profitability-flywheel.md
  - ../../core/loop-output-policy.md
---
# Wallet-Shadow Event Candidate Signal Spec

## Purpose

Resolve `U-002` for the current no-key/A2 phase: define what counts as an opportunistic wallet-shadow / high-volatility event candidate signal before RALPH spends work on rows, scanners, accounts, alerts, or paper wording.

This is an intake and falsification contract only. It does not create a scanner, collector, scheduler, threshold, account, key, paid source, demo/testnet account, live alert, trade rule, sizing rule, TP/SL, execution behavior, public post, or strategy promotion.

## Signal Families

| Signal | Definition | Access class | Default state |
| --- | --- | --- | --- |
| `event_prepositioning` | A wallet/account opens or materially increases exposure before a source-timestamped scheduled or unscheduled event window. | Public/no-key if Hyperliquid known-address fills exist; otherwise needs approved source/export. | Watch until repeated across frozen windows. |
| `event_persistence` | Exposure remains open long enough after event detection that 60s and 180s delayed entries can still model a plausible follower result. | Public/no-key for recent Hyperliquid fills plus candles; source-gated elsewhere. | Cheapest admissible copyability test. |
| `post_event_swing` | Account enters after the initial public move but holds through a secondary move over minutes/hours/days. | Public/no-key for known Hyperliquid accounts; export-gated for on-chain spot cohorts. | Watch, not copy, unless beta and late-entry checks pass. |
| `cohort_convergence` | Multiple pre-frozen accounts/entities independently add the same asset or directional exposure inside the same event window. | Needs approved/exported Nansen/Dune/Arkham-style rows for spot/entity cohorts; weak no-key coverage. | Blocked/needs-access unless a public table exists. |
| `exit_shadowable_flow` | Reductions, closes, distribution, CEX deposits, or off-ramp context are visible soon enough to model follower exits. | Public/no-key only for some perp closes; usually needs enrichment/export. | Required for paper-candidate wording; otherwise radar-only. |
| `radar_anomaly` | Timing is interesting for context but attribution, delay, exit, or hedge visibility fails copyability tests. | Public/no-key often sufficient. | Radar-only, never a trade candidate. |

## Frozen Event-Ledger Intake

A future event-ledger row is admissible only if these fields are frozen before outcome scoring:

| Field group | Required fields |
| --- | --- |
| Event identity | `event_id`, source URL or local source note, event timestamp, source publication timestamp, event class, affected assets, venue. |
| Candidate identity | address/account/entity, selection source, frozen selection timestamp, archetype, label confidence, whether selection is leaderboard-derived. |
| Wallet action | fill/transfer/position-change timestamp, side, asset, size/notional where available, entry/exit price where available, open/close/reduce status. |
| Observation | when RALPH saw or fetched the row, row age at observation, source route, raw-row storage path, capped/stale/summary-only flag. |
| Delay model | 15s, 60s, 180s, and 5m public price proxies joined in the same run as raw rows, plus missing-price handling. |
| Cost/fill model | conservative fee, slippage class, partial/missed-fill rule, capacity/liquidity note. |
| Context | BTC/ETH/broad-market move, event-volatility bucket, funding/basis where relevant, one-asset/event/address concentration flags. |
| Exit and hedge | exit observability, hidden-hedge risk, cross-venue/spot/borrow/collateral caveat, off-ramp context where visible. |
| Decision | `reject`, `watch`, `radar-only`, `blocked`, or `follow-up-ledger-proposal`; never `paper-candidate` without the pass bar below. |

Do not count rows based only on summaries, screenshots, leaderboard PnL, social claims, or retrospectively chosen winners.

## Minimum Rows And Baselines

Minimum before a copyability claim can even be reviewed:

- at least 20 quality observations after filters;
- at least 3 independent event windows for event-led rows;
- no single event, asset, or address contributes more than half of positive result;
- raw rows and delayed price joins are stored from the same bounded run;
- exits are observable, or the row is explicitly downgraded to `radar-only`;
- 60s and 180s delayed follower scenarios remain non-negative after conservative costs;
- capped history is not used as full-history proof.

Required baselines:

- no-trade baseline;
- event asset buy/short-at-detection baseline;
- BTC/ETH or broad-market beta baseline;
- same-asset momentum or reversal baseline at the event timestamp;
- wallet result with largest winner removed;
- delay sensitivity across 15s, 60s, 180s, and 5m;
- where available, market-level funding/basis baseline as the no-key comparison floor.

## Realism Gates

Reject or downgrade before expansion when:

- the wallet/action is selected because it already won;
- the event timestamp is not source-verifiable;
- the fill arrives after the obvious public move and adds no delayed edge;
- holding period is shorter than detection plus execution delay;
- costs, slippage, missed fills, or partial fills erase 60s/180s edge;
- exit rows are missing for a claimed copyable signal;
- the account is likely one visible leg of a hidden hedge;
- result is ordinary BTC/ETH beta or one outlier;
- source access requires an unapproved account, key, paid plan, export, scanner, scheduler, or live alert change.

## Decision

`U-002` is resolved for the current phase.

The signal definition is intentionally narrow: a candidate is not "a wallet made money around a big move." A candidate is a pre-frozen event/account row that survives source timing, selection-bias, delay, cost/fill, exit, beta, outlier, and hedge gates.

Current state:

- Public/no-key Hyperliquid data can support tiny known-address delay falsifiers for recent rows.
- Slow accumulator and cohort signals remain access/export-gated until approved rows exist.
- Event and Hyperliquid wallet-shadowing remain Watch or follow-up-ledger-proposal only.
- No existing wallet, cohort, event, or signal is paper-qualified.

## Follow-Up Trigger

The next allowed branch is a tiny frozen event-ledger proposal only after Tomas explicitly selects it or a new event/source row gives a named trigger. It must start from the intake fields above and stop at the first decisive reject condition.

## Boundary Delta

Changed: wiki/router/queue/state/log/index/memory only.

Boundary delta: no scanner, collector, scheduler, cron, alert wording, threshold, account, key, paid service, demo/testnet setup, live trading, live copying, orders, sizing, TP/SL, execution behavior, public posting, dependency adoption, cohort creation, paper-candidate wording, or strategy promotion changed.
