---
type: note
topic: wallet-shadow-high-volatility-event-brief
created: 2026-08-30T09:40:00Z
last_updated: 2026-08-30T09:40:00Z
work_item: investigation.wallet-shadow-high-volatility-event-brief
status: complete
scope: research-only
sources:
  - raw/wallet-shadowing-chatgpt-session-transcript.md
  - raw/wallet-shadowing-claude-session-transcript.md
  - raw/wallet-shadowing-latency-axis-correction-2026-07-01.md
  - wiki/notes/2026-07-01-wallet-shadowing-next-direction.md
  - wiki/concepts/wallet-shadowing-strategy-model.md
  - wiki/concepts/shadowability-latency-axis.md
  - wiki/comparisons/copyable-wallets-vs-radar-wallets.md
  - wiki/concepts/trump-risk-radar.md
  - wiki/concepts/forward-paper-trade-gate.md
  - wiki/notes/2026-08-30-copytrading-public-route-ledger.md
  - wiki/notes/2026-08-30-hyperliquid-leaderboard-address-sample.md
tags:
  - ralph
  - research-note
  - wallet-shadowing
  - strategy-family
related:
  - 2026-08-26-copytrading-autoresearch-lane.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-30-hyperliquid-leaderboard-address-sample.md
  - ../../decisions/copytrading-watch-ledger.md
  - ../../core/profitability-flywheel.md
---
# Wallet-Shadow High-Volatility Event Brief

## Purpose

This closes `investigation.wallet-shadow-high-volatility-event-brief`.

The branch defines what RALPH should look for when volatile market events and wallet/account behavior overlap. It does not create a live signal, copy rule, alert wording change, or execution path.

## Core Thesis

High-volatility event wallet behavior is useful as a source of hypotheses and radar context, not as immediate copy-trading evidence.

The likely value is:

- identifying accounts or cohorts that repeatedly position before or during event windows;
- separating fast, unshadowable event scalping from slower post-event positioning;
- building a paper-only event ledger where RALPH can measure delay, fees, slippage, and outcome;
- discovering reusable failure modes for strategy filtering.

## Event Classes

| Event class | Examples | RALPH use | Default action |
| --- | --- | --- | --- |
| Scheduled macro/policy | CPI/FOMC-style windows, major scheduled speeches, policy deadlines | Predefined windows for wallet/fill scans | Watch/research |
| Unscheduled political/geopolitical | presidential posts, tariff comments, crypto-reserve remarks, conflict headlines | Radar context and post-event wallet audit | Radar-only until repeated |
| Market structure shock | liquidation cascades, violent BTC/ETH/SOL/HYPE moves, funding dislocations | Candidate discovery and failure-mode extraction | Watch or falsify |
| Venue-specific event | listings, delistings, exchange outages, perps-specific squeezes | Venue mechanics audit | Watch |
| Narrative/token-specific | isolated meme or microcap mania | Usually noisy and capacity-limited | Reject unless independently sourced |

## Account Archetypes

| Archetype | Shadowability | Main risk | Evidence needed |
| --- | --- | --- | --- |
| Pre-event informed wallet | Low to medium | attribution fantasy, hidden hedges, selection bias | repeated pre-window entries before public move |
| Event scalper | Low | edge too fast for Tomas's delay | reject unless holding period survives latency |
| Post-event swing account | Medium | beta disguised as skill | round-trip fills and post-event capture ratio |
| Hedged basis/funding account | Medium to high | visible leg may be incomplete | position reconstruction and funding/basis context |
| Radar-only anomaly wallet | Not copyable | false identity, narrative overreaction | alert usefulness and source verification |

## Minimum Event Ledger Fields

Every high-volatility wallet/event record should include:

- event timestamp and source;
- event class;
- affected assets and venue;
- candidate account or cohort;
- entry/exit fill timestamps when available;
- detection timestamp available to RALPH;
- event-relative timing bucket: pre-event, during, after, late;
- holding period;
- wallet PnL after the event;
- shadow PnL under latency scenarios;
- BTC/ETH beta/context;
- fees, slippage, partial-fill assumption;
- hidden-hedge caveat;
- status: rejected, radar-only, watch, paper-candidate, or blocked.

## Cheapest Falsifiers

Before building any scanner:

1. Choose 5-10 event windows, not 100 retrospectively hand-picked winners.
2. Pull known-address fills/state through the no-key Hyperliquid route where possible.
3. Reject if the account entered after the public move was already obvious.
4. Reject if holding period is shorter than realistic detection plus execution delay.
5. Reject if PnL is dominated by one outlier or ordinary BTC/ETH beta.
6. Reject if exits cannot be shadowed or the account is probably one leg of a hidden hedge.
7. Keep radar-only if timing is interesting but copyability is not proven.

## Decision

High-volatility wallet-shadowing remains a candidate research direction, but the immediate output should be an event ledger and falsification spec, not a bot.

The next branch should be `investigation.event-triggered-wallet-shadow-falsification`, using this brief as the input contract.

## Reassess

Confidence increased that event-triggered wallet-shadowing is worth one more bounded falsification pass because RALPH now has:

- a no-key Hyperliquid public discovery route;
- a no-key official fill/state verification route for known addresses;
- clear radar-versus-copy separation;
- a forward paper gate that can measure capture after selection.

Confidence did not increase that any current address is copyable. The six-address leaderboard sample produced zero copy candidates, and event/radar wallets remain high-latency-risk until tested.

## Boundaries

No live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
