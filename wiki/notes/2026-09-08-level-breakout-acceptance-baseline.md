---
type: research-note
date: 2026-09-08
tags:
  - ralph
  - filip-feedback
  - level-breakout
  - acceptance
  - rejection
  - baseline-study
status: baseline-complete
work_item: investigation.filip-pdv-pdn-cluster-strategy-development
related:
  - 2026-09-08-filip-pdv-pdn-cluster-strategy-development-lane.md
  - 2026-09-08-filip-btc-pdv-pdn-prediction-intake.md
  - ../concepts/multi-timeframe-full-ta.md
  - ../../../crypto-updates/orderflow-index.yaml
  - ../../experiments/strategy-destruction-filter/results/level-breakout-acceptance-study.md
---

# Level Breakout Acceptance Baseline

## Purpose

Tomas asked whether Filip's pdV/pdN plus Cluster Search idea is usable for deciding breakouts up or down across timeframes, because he often makes bad decisions around level breaks.

This pass builds the first baseline. It asks: before adding ATAS Cluster Search, does candle-only acceptance or rejection around simple levels already tell us much?

## Implementation

Added:

- `experiments/strategy-destruction-filter/src/run-level-breakout-acceptance-study.mjs`
- npm script `study:level-breakout`
- `experiments/strategy-destruction-filter/results/level-breakout-acceptance-study.json`
- `experiments/strategy-destruction-filter/results/level-breakout-acceptance-study.md`

Scope:

- symbols: BTC, ETH, SOL, HYPE;
- lookback: about 3 years where available;
- timeframes: 1h, 4h, and daily resampled from 1h;
- level families: previous candle high/low and previous-day high/low;
- classification:
  - acceptance: break and close beyond level by at least `0.05 ATR`;
  - sweep/rejection: trade beyond level but close back inside;
  - weak break: close barely beyond level;
- outcome: whether price reaches `0.5 ATR` favorable before `0.5 ATR` adverse within the horizon.

## Results

Broad candle-only breakout/rejection signals are weak. Most large-sample buckets sit around `40-50%` favorable-first, with small or negative average ATR returns.

Useful but not sufficient reads:

- BTC previous-day high on 4h acceptance had `251` samples, `48.61%` favorable-first, `40.64%` adverse-first, and `+0.286 ATR` average return. That is a mild continuation hint, not a standalone edge.
- ETH previous-day high on 4h acceptance had `217` samples, `49.77%` favorable-first, `40.09%` adverse-first, and `+0.080 ATR` average return. Also mild, not decisive.
- BTC previous-day low on 1h acceptance had `211` samples, `44.55%` favorable-first versus `33.65%` adverse-first, but only `+0.097 ATR` average return.
- Many 1h previous-candle acceptance buckets are actively poor: BTC 1h acceptance-up was only `41.26%` favorable-first and `47.89%` adverse-first; HYPE 1h acceptance-up was `41.23%` favorable-first and `49.77%` adverse-first.
- Sweep/rejection buckets are not automatically fade edges. They often look near coinflip without stronger context.

## Verdict

Filip's approach is usable only if it is treated as a decision framework:

1. preplanned level or band;
2. higher-timeframe context;
3. acceptance/rejection classification;
4. Cluster Search or orderflow confirmation;
5. post-level reaction;
6. no-trade state when the evidence is mixed.

It is not usable as:

- "price crossed level, enter";
- "close beyond level, always continuation";
- "wick through level, always fade";
- "cluster color alone, enter".

The baseline says Tomas's bad decisions around breakouts are likely happening because candle-only level breaks are structurally ambiguous. That matches the lived problem: the level is a battlefield, not the answer.

## Working Strategy Rule

### For Breakout Up

Continuation long is allowed only when:

- HTF or session context is not bearish;
- price closes beyond the level on an appropriate confirmation timeframe;
- retest holds above the level or the close is strong enough to skip retest only for fast trades;
- Cluster Search/orderflow shows aggressive buying accepted above the level, or sellers fail to push price back below;
- no large opposing absorption appears immediately above the breakout;
- invalidation is close enough that R/R is still acceptable.

Fade short is preferred when:

- price wicks above the level but closes back inside;
- buyer aggression appears above the level but price cannot continue;
- CVD rises while price stalls or falls back inside;
- lower timeframe retest fails from below;
- target is back to VWAP/value/open/opposite side of range.

### For Breakout Down

Continuation short is allowed only when:

- BTC/regime and target structure do not fight the short;
- price closes below the level on the confirmation timeframe;
- retest rejects from below or selling impulse has clean acceptance;
- Cluster Search/orderflow shows aggressive selling accepted below the level, or buyers fail to reclaim;
- no buyer absorption appears at the band;
- invalidation is close enough that R/R is still acceptable.

Fade long is preferred when:

- price wicks below the level but closes back inside;
- aggressive selling appears below the level but price does not progress;
- CVD/delta keeps falling while price reclaims the level;
- retest holds from above;
- target is back to VWAP/value/open/opposite side of range.

## Timeframe Rule

Use a timeframe ladder instead of reacting to every poke:

- 1h level: confirm with 5m/15m structure and orderflow; fast scalp only.
- 4h level: confirm with 15m/1h close or retest; better for medium trades.
- Daily level: confirm with 1h/4h acceptance or sweep/reclaim; do not let a 1m spike decide the trade.

Cluster Search belongs on the execution/confirmation timeframe, not on the level-definition timeframe. The higher timeframe defines the level; the lower timeframe tells whether the level was accepted, rejected, or noisy.

## Next Work

Next version should test a public-orderflow proxy for Cluster Search:

- aggressive flow concentrated at or just beyond the level;
- delta/CVD divergence versus price;
- price progress per unit of aggressive volume;
- book imbalance/spread shock near the level;
- follow/fade result after first test and after retest.

Then compare:

- candle-only baseline;
- candle plus public orderflow proxy;
- ATAS Cluster Search labels if Tomas/Filip provide screenshots, alerts, or exports.

## Verification

- `npm run study:level-breakout --prefix ralph-research-os/experiments/strategy-destruction-filter` passed.
- `node --check ralph-research-os/experiments/strategy-destruction-filter/src/run-level-breakout-acceptance-study.mjs` passed.
- `npm test --prefix ralph-research-os/experiments/strategy-destruction-filter` passed: 28 tests.

## Boundary

No live alert wording, thresholds, scheduler, account/key/API/paid access, demo/testnet, live trading, order, sizing, TP/SL, execution behavior, public posting, or strategy promotion changed.
