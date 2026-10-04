---
type: note
topic: trump-person-event-radar-rules
created: 2026-08-30T09:45:00Z
last_updated: 2026-08-30T09:45:00Z
work_item: investigation.trump-person-event-radar-rules
status: complete
scope: research-only
sources:
  - https://www.whitehouse.gov/news/
  - https://www.whitehouse.gov/presidential-actions/
  - https://www.whitehouse.gov/remarks/
  - https://truthsocial.com/@realDonaldTrump/
  - https://trumpstruth.org/
  - ../concepts/trump-risk-radar.md
  - ../comparisons/copyable-wallets-vs-radar-wallets.md
  - 2026-08-30-wallet-shadow-high-volatility-event-brief.md
  - 2026-08-30-event-triggered-wallet-shadow-falsification.md
tags:
  - ralph
  - research-note
  - strategy-family
related:
  - ../../decisions/candidates.md
  - ../../decisions/unknowns.md
  - ../../decisions/copytrading-watch-ledger.md
  - ../../core/profitability-flywheel.md
---
# Trump-Person Event Radar Rules

## Purpose

This closes `investigation.trump-person-event-radar-rules` and resolves `U-020` for the current RALPH phase.

The branch defines how Trump-person event material may enter RALPH without becoming false copy signals, narrative overtrading, or TRUMP/MELANIA coin drift.

## Scope

In scope:

- President Donald Trump as a market-moving public person;
- White House statements, remarks, presidential actions, releases, and official live/public media;
- public social posts when source and timestamp can be verified;
- tariff, sanctions, geopolitics, energy, dollar, crypto-reserve, exchange, market-structure, or risk-on/risk-off comments;
- wallet/account behavior around those event windows as radar context only.

Out of scope unless Tomas explicitly reopens it:

- TRUMP coin;
- MELANIA coin;
- Trump-branded token treasury monitoring;
- token creator wallets;
- campaign merch or unrelated social-noise tracking;
- live trade recommendations from political posts.

## Source Priority

| Rank | Source | Access status | Use |
| ---: | --- | --- | --- |
| 1 | White House News / Remarks / Presidential Actions | Public web, accessible in this workspace | Official timestamped event source |
| 2 | Federal Register presidential documents | Public web | Secondary official confirmation for formal actions |
| 3 | Official social accounts | Public pages exist; some are JS/platform constrained | Timestamp lead only, confirm before use |
| 4 | Trumpstruth archive | Public archive route observed | Secondary searchable archive, not canonical truth by itself |
| 5 | Reputable wire/news recap | Public/news dependent | Event discovery and market-impact context, not wallet evidence |
| 6 | Social reposts/screenshots | Weak | Do not use without upstream confirmation |

Access note from 2026-08-30: White House News, Presidential Actions, and Remarks pages were reachable. Truth Social public profile loaded as JavaScript-gated text in this runtime. Trumpstruth exposed a searchable public archive page. Treat official White House pages as the cleanest repeatable source for current events; treat social/archive routes as discovery that need confirmation.

## Radar Event Record

Each radar event should record:

| Field | Requirement |
| --- | --- |
| `event_id` | Stable slug |
| `event_time` | Timestamp and timezone |
| `source_url` | Prefer official URL |
| `source_rank` | From the source priority table |
| `event_class` | tariff, sanction, geopolitics, energy, crypto, dollar, regulation, venue, other |
| `affected_assets` | BTC/ETH/SOL/HYPE/stables/sector assets |
| `market_move_window` | Pre/post windows checked |
| `wallet_evidence` | None, watch-ledger row, or no-key fill/state check |
| `radar_status` | context-only, watch, disproven, blocked |
| `copy_status` | always no-copy unless separate T3 gate passes |

## Routing Rules

- Trump-person event records are radar/context first.
- A radar event may create a wallet-shadow hypothesis, but never a live entry.
- Event wallets remain `radar-only` unless they pass the event-triggered falsification spec and forward-paper trade spec.
- Do not infer identity or inside information from timing alone.
- Do not mix official statements, social posts, token-contract events, CEX addresses, EOAs, and perp accounts into one confidence tier.
- Do not use screenshots or viral summaries unless upstream timestamp/source can be verified.
- Downgrade to `blocked` when source access, timestamp, account identity, or wallet fill/state evidence cannot be verified.

## Alert/Output Language

If this ever feeds a human-facing note, use neutral wording:

- Allowed: "Trump-person event radar context", "source-confirmed event window", "wallet/account timing anomaly", "radar-only".
- Avoid: "Trump wallet", "insider", "copy", "signal", "buy", "short", "trade now", or implied certainty.

Any live alert wording change still requires explicit Tomas approval.

## Falsifiers

Reject or downgrade a Trump-person radar item if:

- the source is not upstream-verifiable;
- timestamp precision is too weak for event-window analysis;
- price move started materially before the claimed event;
- wallet/account action happens after the obvious public move;
- wallet attribution depends on rumor or address-label leakage;
- evidence points to TRUMP/MELANIA token material rather than Trump-person macro/risk context;
- repeated event windows do not show useful context or paper-testable behavior.

## Decision

Trump-person events are a radar overlay, not a strategy.

`C-018` stays watch/radar. `U-020` is resolved for the current phase: use Trump-person event outputs as source-ranked context and anomaly routing only; require separate event-wallet falsification and T3 forward paper validation before any copyability claim.

## Reassess

Confidence increased that this branch can be kept from contaminating copytrading research. The most useful next action is not more Trump-source browsing; it is either a tiny frozen event ledger or broader slow/copytrading source-fit work.

## Boundaries

No live copying, live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
