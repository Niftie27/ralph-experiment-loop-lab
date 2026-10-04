---
title: Wallet Shadowing Latency Axis Correction
origin: telegram
authors: [Tomas, assistant]
published_date: '2026-07-01'
captured_at: '2026-07-01T22:45:00Z'
---

# Wallet Shadowing Latency Axis Correction

Tomas shared a prior-art-informed correction after the Trump-person scope fix.

## Core Point

The right question is not "which coin?" but:

> How fast is the edge relative to Tomas's detection and execution latency?

This reframes wallet shadowing away from BTC/ETH directional copy-trading and toward slower, more latency-tolerant signals.

## Main Claims To Preserve

- BTC and most ETH directional moves are poor on-chain shadow targets because price discovery is CEX-led and extremely fast.
- If a move starts on Binance/CME/Coinbase, on-chain wallet observation is late by construction.
- Shadowable edge likely lives in slower zones where on-chain flow can lead price over hours, days, or weeks.
- The scanner architecture is still valuable because it is asset-agnostic: change the universe and instrument, not the entire validation structure.

## Archetypes

1. Structural / funding-arb wallets
   - Most shadowable in principle because the edge is structural and accrues over hours or days.
   - Lower variance and more repeatable.
   - Harder to detect because delta-neutral books can look flat from one address.

2. Mid-cap accumulation wallets
   - Likely sweet spot.
   - Not memecoins, but real projects roughly top-20 to top-150.
   - Large enough for liquidity, small enough for on-chain accumulation to matter.
   - Latency-tolerant because positioning can unfold over days.

3. Hyperliquid perp directional traders
   - Useful infrastructure branch, but not necessarily the default strategy.
   - Hard to find residual alpha on BTC/ETH perps because majors are crowded and CEX-led.
   - Keep as one branch, not the whole thesis.

## Parallel Idea

Aggregate flow signal may be better than copying one wallet:

- follow cohorts rather than a single wallet;
- measure net smart-money positioning;
- detect stablecoin-to-alt rotation across a group;
- reduce single-wallet selection bias.

## RALPH Implication

The next M1 frame should compare strategy archetypes by shadowability:

- edge speed;
- latency tolerance;
- data availability;
- implementation difficulty;
- expected variance;
- validation method.

Hyperliquid data feasibility remains useful, but it should not pre-commit RALPH to directional BTC/ETH perp copy-trading.

