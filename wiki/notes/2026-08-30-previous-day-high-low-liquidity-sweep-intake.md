---
type: note
topic: previous-day-high-low-liquidity-sweep-intake
created: 2026-08-30T10:10:00Z
last_updated: 2026-08-30T14:16:00Z
status: complete
scope: research-only
source: wiki/sources/chart-champions-previous-day-high-low-strategy-2026-08-30.md
source_channel: Chart Champions
source_title: "Previous Day High & Low Strategy: Master Liquidity Sweeps (Free TradingView Indicator Included)"
source_url: https://www.youtube.com/watch?v=mgK6kHH3RJI
youtube_video_id: mgK6kHH3RJI
experience_level:
  - beginner
  - intermediate
  - advanced
tags:
  - ralph
  - research-note
  - misc-research
related:
  - ../sources/chart-champions-previous-day-high-low-strategy-2026-08-30.md
  - ../concepts/multi-timeframe-full-ta.md
  - 2026-08-30-trader-grade-ta-feature-taxonomy.md
  - 2026-08-30-strategy-family-taxonomy.md
---
# Previous Day High/Low Liquidity Sweep Intake

## Classification

This is structured trading-knowledge intake from a Chart Champions YouTube transcript Tomas supplied on 2026-08-30.

Source: https://www.youtube.com/watch?v=mgK6kHH3RJI

Chapter map:

- 00:00 Intro
- 01:14 Previous day high/low definition
- 02:17 Marking levels in TradingView
- 06:02 Liquidity sweep and reversal
- 08:22 Breakout and acceptance
- 10:38 No-trade condition
- 12:34 VWAP confirmation
- 14:49 Recap

Experience levels:

- Beginner: learn to identify previous day high and previous day low cleanly.
- Intermediate: interpret reaction around the levels instead of blindly treating them as support/resistance.
- Advanced: convert PDH/PDL interactions into explicit sweep/reversal, breakout acceptance, and no-trade scenarios with VWAP/session context and session-definition discipline.

RALPH layer:

- Strategy family: intraday technical analysis / liquidity-level reaction.
- Full TA role: reusable TA primitive for prior-session liquidity, acceptance, rejection, continuation, and no-trade analysis.
- Feature layer: prior-session level context plus session/VWAP context plus LTF trigger confirmation.
- Current status: vocabulary and setup-shape knowledge only, not a validated candidate.

## When To Use In Full TA

Use this note as part of full TA when:

- price is approaching the previous day high or previous day low;
- price has just swept PDH/PDL and returned back inside the prior range;
- price has broken and accepted beyond PDH/PDL;
- the chart is chopping around PDH/PDL and the correct answer may be no trade;
- session VWAP direction is needed to judge whether buyers or sellers control the session;
- targets or invalidation reference VWAP, opposite side of balance, opening-range extensions, value area, point of control, or fixed R;
- a historical or paper record mentions liquidity sweep, failed breakout, PDH, PDL, prior day high/low, previous session extreme, or RTH/full-session levels.

Crosslink this note from future Obsidian/RALPH analysis when PDH/PDL materially affects the scenario map, not just when the level is visible on a chart.

## Core Lesson

The previous day high and previous day low are not automatic support/resistance. They are high-attention decision points where breakout orders, stop losses, and reversal interest can cluster.

The useful question is not "does PDH resist?" or "does PDL support?" The useful question is what price does after reaching the level:

- sweep and fail back inside the prior range;
- break, accept, and continue;
- churn around the level with no clean trade;
- reverse with supporting VWAP, balance, trend, or structure context.

## Marking Rules

Before a session, mark:

- previous day high: highest traded price of the prior session;
- previous day low: lowest traded price of the prior session;
- chosen session definition: regular trading hours or full/electronic trading hours.

Session definition is part of the data contract. A backtest or paper record should not mix RTH and ETH/full-session levels without separate labels.

TradingView workflow note:

- Enable session breaks so the prior session boundary is visually obvious.
- An indicator that extends the completed prior day high/low can be a drawing aid, but not an edge claim.
- Before the selected session opens, be explicit about which completed session owns the displayed high/low. The transcript's NQ example shows that pre-RTH levels can overlap with overnight lows and can differ once the RTH session begins.

## Scenario Map

| Scenario | What it means | Evidence needed before acting |
| --- | --- | --- |
| Sweep and reversal | Price breaks PDH/PDL, then quickly closes back inside and cannot reclaim the swept side. | Rejection/reclaim candle, trapped breakout flow, volume/volatility context, invalidation beyond sweep extreme, no late chase. |
| Breakout and acceptance | Price breaks through PDH/PDL, opens/closes beyond it, and holds or expands without quickly returning. | Momentum through level, candle acceptance, retest/hold if present, aligned VWAP slope or session trend. |
| Decision/no trade | Price reaches the level but candles overlap, repeatedly cross both ways, and show no clear acceptance or rejection. | Stand down until acceptance, rejection, or better location appears. |

## Setup Details From The Source

Liquidity sweep and reversal:

- Bearish version: price trades above previous day high, then quickly closes back below it and cannot reclaim the level.
- Bullish version: inverse logic at previous day low, ideally in a context where a downside sweep fails and price reclaims.
- Stop example from source: beyond the sweep high/low.
- Target examples from source: session VWAP first, then opposite side of balance/range when higher-timeframe context supports it.

Breakout and acceptance:

- Price moves through previous day high/low with clear momentum.
- Consecutive bars opening/closing beyond the level make continuation more credible.
- A retest is helpful but not required in the source examples.
- Stop example from source: beyond the candle that breaks through the level.
- Target examples from source: opening-range extension targets, previous day's value area high/low, point of control, new levels above/below price, or a fixed risk/reward target.

No-trade condition:

- Repeated candles cross the level and return without clear momentum.
- Breakout traders and reversal traders can both be trapped.
- Overlapping candles and flat control mean patience is the trade; no position is a valid decision.

VWAP context:

- VWAP is used as session-control confirmation, especially regular trading hours VWAP in the examples.
- Downward-sloping VWAP supports downside continuation context; upward-sloping VWAP supports upside continuation context.
- Flat VWAP suggests buyer/seller balance and weakens both breakout and reversal confidence.

## RALPH Translation

For RALPH, PDH/PDL should be encoded as a setup context field, not as a standalone signal:

- `level_type`: previous_day_high or previous_day_low.
- `session_basis`: RTH, ETH/full-session, or exchange-native day.
- `interaction`: sweep_fail, failed_breakout, continuation_acceptance, tag_no_trade, reversal_candidate.
- `vwap_context`: rising, falling, flat, above, below, or unavailable.
- `target_family`: vwap, opposite_range_side, opening_range_extension, value_area, point_of_control, fixed_r.
- `trigger_window`: the LTF interval used to confirm reaction.
- `context_required`: HTF trend/regime, session VWAP/value, volume/volatility, and orderflow proxy when available.
- `invalidation`: beyond the sweep extreme or failed acceptance area.
- `anti_chase_rule`: no entry after the rejection/continuation move is already extended.

## Validation Implication

A future kill test should compare PDH/PDL interaction types against a baseline, not merely test touches of the levels.

Minimum falsifier:

- Freeze the session definition before computing levels.
- Compute prior day high/low without peeking into the current day.
- Label level interactions after first touch.
- Split sweep/reversal, breakout/acceptance, and unclear/no-trade outcomes.
- Track VWAP state at touch and confirmation time.
- Track target family separately from entry trigger, because VWAP/opposite-range/OR/value-area/POC targets are management logic, not proof of edge.
- Compare against random intraday horizontal levels or prior session mid/range levels.
- Require out-of-sample or forward-paper rows before candidate status.

## Boundaries

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
