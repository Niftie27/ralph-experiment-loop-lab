# Liquidation Q1 + Baseline Kill-Switch — Test Spec

Source: Telegram attachment from Tomas.
Date: 2026-07-02

_Purpose: the single cheapest test that can KILL the liquidation-map strategy before any
map, key, capital, or paid subscription is touched. If it fails, nothing gets built._

## Objective

Answer two questions, in one pass, on historical data only:

- **Q1 — Reversion edge:** After a large liquidation/cascade event, does a passive
 opposite-side limit rule produce positive replay EV *after* fees, missed fills, partial
 fills, adverse selection, and tail losses?
- **Baseline kill-switch:** Does the liquidation-*aware* rule beat dumb baselines that use
 NO liquidation data? If it doesn't, the liquidation map is just a more expensive proxy
 for volatility/drawdown, and nothing gets built.

Pass = both hold. Fail on either = stop.

## Explicitly OUT of scope for Q1

No liquidation map. No pre-positioning against pending clusters (that needs live-snapshotted
or paid map data — Q2). No keys. No capital. No paid data beyond the cheapest event source.
No product/gap comparison. Q1 is a research replay, nothing else.

## Data (cheapest, no-key, no-capital)

- **Liquidation events (historical):** Hyperliquid `node_fills` on S3 contains fills; the
 `trades` websocket carries a liquidation flag. Liquidation-flagged fills are the event
 source. Free, but requester-pays S3 + parsing. _Alternative:_ 0xArchive is cited as a HL
 liquidation-event export/replay source — VERIFY its history depth and cost before relying;
 node_fills S3 is the free-but-more-work fallback.
- **Price (candles):** HL info API `candleSnapshot` (free). NOTE: candles are NOT in the S3
 archive — they come from the API, and `candleSnapshot` lookback may be limited. VERIFY how
 far back it reaches before committing to a test window.
- **Do NOT** use `clearinghouseState` here — it is a LIVE snapshot with no historical
 archive, so it cannot reconstruct past positions. That is exactly why Q1 uses events, not
 the map.

Every data claim above marked VERIFY must be checked against the live doc before the test is
locked (verify-before-asserting).

## Event definition (cascade)

Aggregate liquidation-flagged fills into events:

- Cluster liq fills on one asset within a short window (e.g. liquidations summing to > T
 notional within W minutes).
- **Define "large" RELATIVE to a rolling baseline** (recent volume, ATR, or average liq
 size), never absolute. An absolute threshold just re-selects high-volatility moments — which
 is the very thing the baseline test exists to rule out.
- **Point-in-time only:** define the event using information available AT the decision moment.
 Do not use the full final cascade size if part of it prints after your simulated entry.

## Signal rule (the hypothesis under test)

After a detected cascade of side S (e.g. long liquidations → forced selling), simulate a
passive limit on the opposite side at/near the overshoot. Fill only if replay price trades
through the limit. Exit via: fixed bounce target, time stop, volatility-adjusted stop, and
trend-continuation invalidation.

## Baselines it MUST beat (the kill-switch core)

Run the SAME entry/exit/cost machinery driven by NON-liquidation triggers:

- **Baseline A:** enter after a large red candle (long) / large green candle (short), sized
 by candle magnitude.
- **Baseline B:** enter after X% drawdown from rolling high (long) / X% rally from rolling
 low (short).
- **Baseline C (optional):** simple volatility-regime reversal.

The liquidation rule must beat these on RISK-ADJUSTED terms, not raw PnL. If it can't, the
liquidation signal adds nothing over price/vol — kill.

## Cost model (realistic fills, not optimistic)

- Maker/taker fees, spread.
- Missed fills (limit never reached) — counted, not ignored.
- Partial fills.
- **Adverse selection:** you fill precisely because price kept going against you; the fill is
 conditional on continuation. Model the fill as "you are now positioned into ongoing forced
 flow," not "you got a clean dip."

## Metrics (chosen to expose negative skew)

Fill rate; bounce probability; median bounce size; time-to-bounce; max adverse excursion;
**tail-loss distribution**; EV after costs; **PnL without the top outlier win(s)**; worst
single clustered-loss day; and — critically — **cross-asset correlation during cascades**.
In a real crash everything liquidates at once, so "diversified" bids all fill and all lose
together; that correlated tail is the whole risk, not per-trade variance.

## Kill criteria (explicit — degrade to radar or drop)

Kill if ANY of:

- Liquidation rule does not beat Baselines A/B/C risk-adjusted.
- EV ≤ 0 after realistic fills and costs.
- PnL depends on a few outlier bounces (fails the no-top-outlier check).
- One clustered-loss day erases many normal wins.
- Edge disappears once the entry uses only point-in-time cascade info.
- **Signal is explained by volatility/beta:** regress the rule's returns against a simple
 volatility/drawdown proxy; if the proxy explains it, the map is a costlier vol proxy — the
 beta-vs-alpha trap again.

## Methodological traps to guard against (inside Q1 itself)

- **Lookahead:** decision inputs must be point-in-time; no post-entry cascade info.
- **Multiple testing:** you will try many thresholds (cascade size, bin width, bounce target,
 stop). Reserve a holdout window; do not tune and report on the same data. Some configs
 will look good by chance.
- **Non-IID / overlapping trades:** cascades cluster in time, so returns are not independent;
 naive significance overstates. Treat any p-value as an optimistic lower bound.
- **Asset-selection survivorship:** don't test only assets that had big moves.

## Decision output

One line: **"liquidation reversal beats baselines after costs → proceed to Q2 gap map"**, or
**"does not beat baselines / negative EV / vol-proxy → stop, build nothing."** No map, no
harness, no subscription is justified until this line reads "proceed."
