---
type: note
name: High Probability Setup Router
created: '2026-08-19T07:48:00Z'
status: active
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../../automation/ta-learning-loop.md
  - ../../experiments/btc-eth-alert-edge/results/edge-summary.md
  - ../../../crypto-updates/realtime-market-watcher.mjs
---
# High Probability Setup Router

Tomas clarified that RALPH should identify "high probability setups" rather than merely report fast price movement. The live watcher currently emits event/paper-test alerts. The missing layer is a setup router:

`event -> TA context -> matched historical bucket -> probability estimate -> recommendation -> paper plan`

This note is research-only. It does not change live alert text, thresholds, risk, sizing, leverage, TP/SL, entries, stops, or execution.

## Source Scan

External trading education sources converge on a few setup families, but they do not provide crypto-specific edge by themselves:

- Breakouts need strong support/resistance levels, volume/confirmation, planned exits, and clear failure when price returns through the broken level. Source: https://www.investopedia.com/articles/trading/08/trading-breakouts.asp
- Pullbacks are useful only inside an already identified trend and around support/continuation context. Source: https://www.investopedia.com/terms/p/pullback.asp
- Break-and-retest is a continuation structure: break a key level, retest it, then continue if the retest holds. Source: https://fxopen.com/blog/en/how-can-you-use-a-break-and-retest-strategy-in-trading/
- VWAP is an intraday fair-value/benchmark tool and can act as a filter, but not a standalone edge. Source: https://www.investopedia.com/ask/answers/031115/what-common-strategy-traders-implement-when-using-volume-weighted-average-price-vwap.asp

Research implication: RALPH should not label "breakout" or "pullback" as high probability by name. It should label a setup as high-probability candidate only when setup family, regime, location, orderflow, and local backtest/paper evidence align.

## Current Local Evidence

Latest verified `liquid-crypto-alert-edge-backtest` snapshot, generated `2026-08-19T04:04:15Z`, has 423 setup-stat buckets. The current best non-low-sample candidates are all B/C tier, not A tier.

Top B-tier buckets:

| Symbol | TF | Direction | Setup | Regime | N | Winrate | Exp R | PF | Baseline Exp R |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| XRP | 4h | long | range_breakout_long | up/mid-vol | 45 | 48.9% | 0.301 | 1.55 | -0.192 |
| DOGE | 1h | long | momentum_reversal_long | range/low-vol | 50 | 52.0% | 0.301 | 1.55 | -0.202 |
| AVAX | 1h | short | range_breakdown_short | down/low-vol | 43 | 48.8% | 0.240 | 1.42 | -0.039 |
| ADA | 1h | long | range_breakout_long | up/mid-vol | 55 | 43.6% | 0.149 | 1.25 | -0.158 |
| SOL | 4h | long | range_breakout_long | up/mid-vol | 42 | 42.9% | 0.138 | 1.24 | -0.109 |
| DOGE | 1h | short | trend_pullback_reject_short | down/low-vol | 82 | 45.1% | 0.125 | 1.20 | 0.009 |
| ADA | 1h | short | trend_pullback_reject_short | down/low-vol | 82 | 43.9% | 0.104 | 1.17 | -0.017 |

Important interpretation: winrate is not enough. Some candidates have sub-50% winrate but positive expectancy because winners are larger than losers under the experiment's R model. Alert probability should therefore show both probability of winning and expectancy/quality notes.

## Candidate Setup Families

### 1. Regime-aligned range breakout

Best current family: `range_breakout_long` in `up/mid-vol` on 4h or 1h liquid large caps.

High-probability candidate conditions:

- price exits a well-defined range in the direction of higher-timeframe trend
- volume/orderflow confirms expansion, not a thin fakeout
- broken level holds or retests cleanly
- backtest bucket is B tier or better with `N >= 40`, `PF >= 1.20`, positive expectancy, and lift over baseline

Router action:

- `FOLLOW_CANDIDATE` only after confirmation/retest/acceptance
- `WAIT` while breakout is only a wick or first impulse
- `SKIP` if no retest, no volume confirmation, or baseline is better than setup bucket

### 2. Range-low/low-vol momentum reversal

Best current family: `momentum_reversal_long` in `range/low-vol`.

High-probability candidate conditions:

- range or low-vol regime, not strong downtrend
- move occurs into a known range edge/support area
- post-shock reclaim or rejection confirms that continuation sellers failed
- orderflow shows absorption or failed breakdown if available

Router action:

- `FADE_CANDIDATE` or `RECLAIM_LONG_CANDIDATE` only after reclaim
- `DATA_ONLY` for the first shock without reclaim

### 3. Downtrend breakdown / pullback reject short

Current evidence: `range_breakdown_short` and `trend_pullback_reject_short` perform only in down/low-vol or down/mid-vol contexts.

High-probability candidate conditions:

- higher timeframe downtrend
- failed bounce into resistance or broken support
- breakdown/reject follows after pullback, not after an already extended dump
- local bucket has positive expectancy and baseline lift

Router action:

- `FOLLOW_SHORT_CANDIDATE` after failed retest
- `NO_CHASE` if entry is far from invalidation

### 4. Liquidity sweep / reclaim

External source scan suggests sweep/reclaim is a common high-quality discretionary pattern, but local RALPH sample is still too small.

High-probability candidate conditions:

- sweep above/below a visible swing or range edge
- fast reclaim back inside prior structure
- confirmation candle closes back through the level
- good location and clear invalidation

Router action:

- research-only until enough local samples exist
- never call high probability on sweep alone; the reclaim is the signal

### 5. VWAP/fair-value reclaim or rejection

VWAP should be a filter, not a standalone setup.

Candidate conditions:

- intraday liquid asset
- price reclaims VWAP after sweep/support test, or rejects VWAP in a downtrend
- setup also matches a historical bucket or local alert family

Router action:

- add VWAP as confluence and probability adjuster after local testing

## Probability Block Contract

Each future alert candidate should include a compact probability block:

```text
PROBABILITY
Estimated win: 48-53%
Estimated loss: 47-52%
Confidence: medium-low
Sample: 45 historical similar setups + 6 forward paper signals
Expectancy: +0.30R, PF 1.55, baseline -0.19R
Why not higher: sample modest; no live orderflow confirmation yet
```

Rules:

- If `N < 30`, do not print numeric win/loss as a trade probability; print `unknown / low sample`.
- If `N >= 40` but PF is below 1.20 or expectancy is near zero, classify as `watch`, not high-probability.
- If winrate is low but expectancy is positive, say so explicitly.
- Include `baseline` comparison; high probability means better than baseline, not merely positive.
- Use ranges, not false precision.
- Include confidence and sample count every time.

## Dynamic Setup Lifecycle

Tomas clarified that a watcher alert and the eventual trade are not necessarily the same object. The current realtime alerts are mostly fast-event alerts with a default paper TP/SL. Tomas may instead take partial profit, leave a runner, trail the stop, or change management as the chart evolves. That means RALPH should model a high-probability setup as a live thesis, not as a fixed entry/TP/SL tuple.

The stable identity of a trade is:

- setup thesis
- market regime
- location and invalidation
- expected path
- current probability/expectancy state

TP/SL and trailing logic are management choices layered on top. They can change without invalidating the setup, as long as the original thesis remains valid.

Future alert flow should be staged:

1. `SETUP WATCH`: event occurred, TA context says a setup may be forming, but confirmation is missing.
2. `ENTRY CANDIDATE`: confirmation arrives; probability and risk/reward justify a paper entry.
3. `MANAGE`: trade is in progress; update TA state, probability, partial TP/trailing logic, and invalidation.
4. `INVALIDATED`: thesis failed; stop managing as the same setup.
5. `POST-REVIEW`: classify whether the setup logic or management logic was right/wrong.

Probability should be recalculated across the lifecycle. Example: a breakout impulse can start as low-probability chase, become higher-probability after retest acceptance, then shift from entry logic to management logic after partial TP.

This is the key distinction:

- Bad route: `alert -> fixed trade`.
- Target route: `alert -> evolving TA thesis -> probability updates -> entry/skip -> management updates -> review`.

## Initial Router Tiers

- `A`: `N >= 80`, PF >= 1.35, expectancy >= 0.20R, positive baseline lift, forward paper agreement, clean TA context.
- `B`: `N >= 40`, PF >= 1.20, expectancy >= 0.10R, positive baseline lift, TA context not contradictory.
- `C`: positive but weak or mixed; show as research/watch only.
- `Low sample`: never high-probability; data collection only.
- `Avoid`: negative expectancy or worse than baseline.

## Next Work

- Add a research-only probability formatter fed by `edge-snapshot.json`.
- Map realtime watcher events to nearest setup bucket by symbol, timeframe, direction, setup family, and regime.
- Add TA context fields: trend/range, support/resistance location, sweep/reclaim, retest/acceptance, VWAP relation.
- Keep live alert text unchanged until Tomas approves exact wording.
