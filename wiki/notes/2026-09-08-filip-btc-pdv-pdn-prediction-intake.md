---
type: research-note
date: 2026-09-08
tags:
  - ralph
  - filip-feedback
  - btc
  - pdv-pdn
  - value-area
  - orderflow
  - strategy-hypothesis
status: intake-needs-data
related:
  - ../filip_feedback/README.md
  - templates/filip-feedback-intake.md
  - ../concepts/multi-timeframe-full-ta.md
  - ../../core/profitability-flywheel.md
source_person: Filip
relayed_by: Tomas
source_date: 2026-09-07
market: BTC
---

# Filip BTC pdV/pdN Prediction Intake

## Source

- date: 2026-09-07
- relayed by: Tomas on 2026-09-08
- source person: Filip
- asset/market: BTC
- timeframe: intraday / Monday day-session prediction
- original feedback: Filip sent a worked prediction, not post-trade feedback.
- screenshot/media/source: Telegram text relayed by Tomas.

## Raw Claim Preserved

Filip's core claim for Monday 2026-09-07:

- `O=80301` opened above `PDVAH=79980`.
- `pdV=79844` and `pdN=79900` were both below open, with `sameSide=Y`; he treats them as one support/magnet band because they are only `56` dollars apart.
- `OvsPDVA=A + sameSide=Y + stred` is weak historically: `pdV hit 46.7%`, and `OvsPDVA=A` overall has `pdV/pdN hit` around `47%`.
- Monday is the main bullish counterweight: `pdV hit 76.7% (n=30)` and `dayBias=U 56.7%`.
- Both magnets in the `201-500` dollar bucket allegedly hit around `67-70%`.
- `OvsPDVA=A + OvsPWV=A` is historically coinflip around `50/50`, while `O` above `WV+1=79980` creates bearish deviation context.

Filip's scenario split:

- Scenario A, `55%`: pullback into `79840-79910`, red cluster search / buyer absorption, delta divergence, 15m RSI above 45 and rising, then long toward open/new high.
- Scenario B, `35%`: loss of `PDVAH/WV+1`, no buyer cluster in pdN/pdV band, falling delta and RSI under 45, short toward `PDVAL=79620` and potentially `PWV=78942`.
- Scenario C, `10%`: skip if price chops between `pdN` and open without clear cluster search.

## Classification

- feedback type: TA primitive plus strategy-hypothesis intake.
- TA primitive: prior day value area relation, weekly value relation, same-side pdV/pdN magnet band, weekday conditioning.
- orderflow/absorption: cluster search, delta divergence, RSI confirmation around a pre-defined band.
- strategy critique: good separation between weak unconditional setup and conditional Monday/bucket effects.
- execution realism: good no-trade condition, but the plan needs explicit timestamp/session definition and target distance/R multiple checks.
- data gap: RALPH does not currently have Filip's row-level dataset, the definitions of `pdV`, `pdN`, `OvsPDVA`, `OvsPWV`, `sameSide`, `stred`, `cluster search`, or the exchange/session boundary used for the stats.
- risk caveat: scenario probabilities are not yet independently validated and must not change live alerts, thresholds, sizing, execution, or strategy status.

## Hypothesis

- precise claim: When BTC opens above prior-day value and both pdV/pdN are below open on Monday, the pdV/pdN band is more likely to be visited intraday than the unconditional `OvsPDVA=A + sameSide=Y + stred` sample implies, but trade direction should be decided by acceptance/rejection and orderflow at the band.
- tradeable rule candidate: Treat `pdV/pdN` within a tight distance as one band. Wait for first touch or acceptance/rejection around that band. Long only on buyer absorption plus delta divergence/RSI hold. Short only on acceptance below `PDVAH/WV+1` with no buyer absorption and falling delta.
- null hypothesis: The Monday and distance-bucket uplift is sample noise or multiple-comparison bias; after costs and realistic entries, the band-touch plan does not outperform dumb baselines such as first-touch fade, first-touch continuation, opening-range breakout, or no-trade.
- falsifier: With row-level out-of-sample testing, the conditional setup fails to produce materially positive expectancy after fees/slippage, or the claimed `76.7%` Monday pdV hit collapses when split by year/regime/volatility/session definition.
- data required: Filip's row export with date, weekday, session open, PDVAH/PDVAL, PWV/WV/WV+1, pdV/pdN, sameSide, OvsPDVA/OvsPWV buckets, hit timestamps, day bias label, cluster-search events, delta, RSI, and post-entry MFE/MAE.

## Test Plan

- historical/backtest route: Rebuild the exact labels first, then run row-level walk-forward by weekday, open-vs-value relation, same-side flag, magnet distance bucket, and volatility regime.
- replay/orderflow route: If cluster-search and delta history is available, test first-touch band reactions separately from clean breakdown/acceptance below `PDVAH/WV+1`.
- local paper/demo route: Paper-only worksheet for future days: freeze premarket levels and scenario rules before open, record first touch/breakdown, then score with fixed costs and no discretionary relabeling.
- baseline: no-trade, first pdV/pdN touch only, PDVAH breakout/acceptance, previous-day high/low liquidity-sweep primitive, and simple opening-range breakout.
- sample target: minimum `100+` comparable days overall and `30+` Monday rows is only exploratory; require a larger out-of-sample or walk-forward split before promotion.
- metrics: hit rate by condition, expectancy in R, profit factor, max drawdown, MFE/MAE, time-to-hit, slippage sensitivity, regime split, and confidence interval by bucket.

## Feedback For Filip

Strong parts:

- Separating the weak unconditional setup from the Monday-conditioned effect is exactly the right direction.
- Treating `pdV=79844` and `pdN=79900` as one band is clean; two targets `56` dollars apart would be fake precision.
- The scenario tree is practical because it defines both confirmation and no-trade behavior.

Main pushback:

- The `76.7% Monday pdV hit (n=30)` number is promising but fragile. It needs confidence interval, split by year/regime, and a guard against weekday/data-mining bias.
- `pdV hit` is not the same as trade expectancy. A level can be hit often while the executable trade has bad R, bad MAE, or too much chop.
- Scenario A uses a very near target if entry is around `79900` and `pdV` is `79844`; the real target is open/new high, so the test should score the whole rule, not just magnet hit.
- Cluster search/delta/RSI need objective definitions. Otherwise the model can look precise but be hard to replay without hindsight.

Best next ask:

Ask Filip for the row-level CSV/export behind the stats plus exact definitions for `pdV`, `pdN`, `OvsPDVA`, `OvsPWV`, `sameSide`, `stred`, `dayBias`, and cluster-search colors. Without row-level export, RALPH should keep this as a high-quality hypothesis, not evidence.

## Decision

- status: `Watch / intake-needs-data`.
- next queue item: `filip-btc-pdv-pdn-monday-band-validation`.
- HITL needed: Filip/Tomas must provide the underlying row export or explicit permission to reconstruct approximations from public BTC data.
- boundary delta: saved research memory only. No live trading, alert wording, thresholds, scheduler, account/key/API/paid access, demo/testnet, order, risk/sizing/leverage, TP/SL, execution behavior, public posting, or strategy promotion changed.
