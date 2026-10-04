---
type: note
name: Public Orderflow Data Rail
created: '2026-08-10T22:41:58Z'
last_updated: '2026-08-11T11:58:00Z'
sources:
  - https://developers.binance.com/en/docs/catalog/core-trading-spot-trading/api/ws-streams/~
  - https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/ws-streams/public
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions.md
  - https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits.md
  - https://bybit-exchange.github.io/docs/v5/websocket/public/orderbook
  - https://bybit-exchange.github.io/docs/v5/websocket/public/trade
tags:
  - ralph
  - research-note
  - orderflow
  - ta
  - source-scan
  - no-key
related:
  - core/data-rails.md
  - decisions/candidates.md
  - decisions/unknowns.md
  - ../crypto-updates/monitor-index.yaml
  - ../crypto-updates/orderflow-index.yaml
---
# Public Orderflow Data Rail

Tomas identified orderflow as a required layer before RALPH proposes serious high-probability trade setups.

## Verdict

Yes, RALPH can pull useful orderflow without wallet keys or trading permissions.

The first rail should be public exchange WebSockets:

- Binance: trades/aggregate trades, best bid/ask, diff depth, partial depth, and futures book ticker streams.
- Hyperliquid: `trades`, `l2Book`, `bbo`, `allMids`, candles, and asset context streams.
- Bybit: public trades plus orderbook snapshot/delta streams.

## Why This Matters

The current Crypto Updates watcher detects fast price moves and stores post-alert reviews. That is useful, but price-only evidence is too thin. Orderflow can add context:

- did taker flow actually push the move?
- did liquidity vanish before the wick?
- was there absorption at the top of book?
- did the move sweep into poor follow-through?
- was fade/follow-through supported by book pressure?

## First Features To Test

- signed taker volume / CVD proxy over 5s, 30s, 60s, 5m
- top-of-book imbalance
- spread expansion
- depth within 5/10/25 bps
- large trade burst count
- sweep/exhaustion marker
- absorption marker: aggressive flow without price progress
- cross-exchange lead/lag between Binance, Hyperliquid, and Bybit

## Storage Shape

Do not store raw ticks in the RALPH wiki.

Use layered storage:

1. Raw ticks/deltas: compressed JSONL or SQLite in a runtime/data directory.
2. Feature rows: SQLite table keyed by symbol/time bucket.
3. Compact index: YAML manifest with coverage, symbols, date range, and feature availability.
4. Obsidian page: daily/experiment summary with charts or compact tables only.
5. RALPH pointer: `automation/retrieval-router.yaml`.

## First Spike

Bounded no-key spike:

- capture BTC/ETH for 2-4 hours from Binance and Hyperliquid first
- include Bybit public feed if connection complexity is low
- bucket features into 1s/5s/60s rows
- align buckets with existing Crypto Updates alert/review data
- answer whether any orderflow feature would have changed the ETH/HYPE/BTC alert verdicts already indexed

## Initial Capture Result

Implemented `crypto-updates/orderflow-spike.mjs` and ran a 15-second BTC/ETH capture.

Result:

- run id: `2026-08-10T22-50-15-062Z`
- records: 870
- Binance: 729 records across `trade`, `book_ticker`, and `depth5`
- Hyperliquid: 141 records across `trade`, `l2_book`, and `mid`
- output: `crypto-updates/runtime/orderflow-spikes/2026-08-10T22-50-15-062Z/`
- compact index: `crypto-updates/orderflow-index.yaml`
- Obsidian page: `crypto-updates/wiki/orderflow/index.md`

Verdict: no-key public orderflow capture is technically viable. The next question is not connectivity; it is whether derived features improve replay classification enough to matter.

## Initial Feature Result

Implemented `crypto-updates/orderflow-features.mjs` and derived compact 1-second rows from the latest spike.

Result:

- feature rows: 104
- output SQLite: `crypto-updates/runtime/orderflow-spikes/2026-08-10T22-50-15-062Z/features.sqlite`
- output CSV: `crypto-updates/runtime/orderflow-spikes/2026-08-10T22-50-15-062Z/features-1s.csv`
- feature manifest: `crypto-updates/runtime/orderflow-spikes/2026-08-10T22-50-15-062Z/features-manifest.yaml`
- current columns: signed taker quantity, buy/sell taker split, total quantity, notional, VWAP, bucket price-change bps, book update count, average spread bps, and top-of-book imbalance

This is the layer RALPH should read before raw ticks when testing high-probability fade/follow-through classifiers.

## Longer Capture Validation

Ran a bounded 10-minute no-key capture for BTC/ETH/SOL on 2026-08-11.

Result:

- run id: `2026-08-11T11-43-28-031Z`
- records: 87,516
- Binance: 82,106 records across `trade`, `book_ticker`, and `depth5`
- Hyperliquid: 5,410 records across `trade`, `l2_book`, and `mid`
- feature rows: 3,647 one-second rows
- output: `crypto-updates/runtime/orderflow-spikes/2026-08-11T11-43-28-031Z/`
- compact index: `crypto-updates/orderflow-index.yaml`

Verdict: the no-key orderflow rail is stable enough for longer bounded capture and compact feature extraction. This is still not strategy evidence because the run did not overlap an indexed Crypto Updates alert/review sample.

Caveat: Hyperliquid trade event timestamps can include a small pre-subscription backlog. Before alert alignment, add local ingestion timestamps or filter features to the local capture window.

Next validation: capture across an alert/review window or align future alert events to only those feature rows whose capture window is verified. Do not promote C-036 beyond `Candidate` until orderflow features improve fade/follow-through classification against baseline price-only alert outcomes.

## Guardrails

- no live trading
- no private keys
- no exchange account setup
- no paid feed
- no threshold change without Tomas approval
- no strategy promotion from tiny samples

> Synthesis: orderflow should become the next data rail before strategy promotion. The immediate value is not a trade call; it is better replay evidence for whether a future setup has real microstructure support.
