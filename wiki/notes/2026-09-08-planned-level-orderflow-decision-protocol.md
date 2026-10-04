---
type: research-note
date: 2026-09-08
tags:
  - ralph
  - filip-feedback
  - decision-protocol
  - level-breakout
  - cluster-search
status: v1-paper-protocol
work_item: investigation.filip-pdv-pdn-cluster-strategy-development
related:
  - 2026-09-08-level-breakout-acceptance-baseline.md
  - 2026-09-08-filip-pdv-pdn-cluster-strategy-development-lane.md
  - 2026-09-08-planned-level-post-entry-autoresearch-scan.md
  - ../concepts/multi-timeframe-full-ta.md
---

# Planned Level Orderflow Decision Protocol

## Purpose

Give Tomas a concrete v1 decision protocol for level breaks while the Filip/Cluster Search strategy is still being validated.

This is a paper protocol, not a live alert change.

Execution is not the end of the decision. Any planned-level execution alert must immediately create a short post-entry monitoring window. The monitor's job is to decide whether the trade thesis is being confirmed now, or whether Tomas should hold, warn, tighten, reduce, fast-kill, or mark the thesis invalidated.

## Core Rule

Never decide from the first poke through a level. Classify the event into one of three states:

1. accepted break;
2. sweep/rejection;
3. mixed/no-trade.

If it cannot be classified cleanly, the decision is no-trade.

After an entry is filled, never keep the trade alive only because the original entry was valid. The market must confirm the thesis on the execution timeframe quickly enough to justify continuing the risk.

## Timeframe Ladder

| Level timeframe | Confirmation timeframe | Use |
| --- | --- | --- |
| 1h level | 5m/15m close plus orderflow | fast scalp only |
| 4h level | 15m/1h close or retest | medium intraday trade |
| daily level | 1h/4h acceptance or sweep/reclaim | major session decision |

Lower timeframe orderflow times the entry. It does not override the higher timeframe level context by itself.

## Decision Phases

1. `PRE_LEVEL_MAP`: freeze the level, higher-timeframe context, BTC gate, expected reaction types, invalidation, and no-trade conditions before price reaches the level.
2. `LEVEL_REACTION_CLASSIFY`: classify the first interaction as acceptance, sweep/rejection, or mixed/no-trade.
3. `ENTRY_CANDIDATE`: allow paper entry only if confirmation, invalidation, and R/R are all valid.
4. `POST_ENTRY_MONITOR`: required after any fill or execution alert. Watch the next execution-timeframe candles and orderflow for confirmation or failure.
5. `POST_REVIEW`: label whether post-entry management would have improved or harmed the trade.

No phase may skip the BTC/regime gate. For alt setups, a BTC regime override can block entry before the fill or force a warning/fast-kill after the fill.

## Upward Break Decision

### Continue Long

Require:

- price closes beyond the level on the confirmation timeframe;
- retest holds above the level or displacement is strong and clean;
- Cluster Search/orderflow shows buying accepted above the level, or sellers fail to push price back below;
- no immediate opposing absorption above the level;
- invalidation can sit just below the reclaimed level/retest low;
- target is far enough for acceptable R/R.

### Fade Short

Prefer fade when:

- price trades above the level but closes back inside;
- aggressive buying appears above the level but price stalls;
- CVD/delta rises while price fails to progress;
- retest from below fails;
- target is back toward VWAP, value, open, or range midpoint.

### No Trade

Stand down when:

- price overlaps the level repeatedly;
- close is barely beyond the level;
- Cluster Search appears on both sides;
- delta and price agree with neither acceptance nor rejection;
- R/R is poor after confirmation.

## Downward Break Decision

### Continue Short

Require:

- BTC/regime and target structure do not fight the short;
- price closes below the level on the confirmation timeframe;
- retest rejects from below or sell displacement is strong and clean;
- Cluster Search/orderflow shows selling accepted below the level, or buyers fail to reclaim;
- no clear buyer absorption at the band;
- invalidation can sit just above the broken level/retest high;
- target is far enough for acceptable R/R.

### Fade Long

Prefer fade when:

- price trades below the level but closes back inside;
- aggressive selling appears below the level but price stalls;
- CVD/delta falls while price reclaims;
- retest from above holds;
- target is back toward VWAP, value, open, or range midpoint.

### No Trade

Stand down when:

- the level is being chopped through;
- confirmation timeframe has not closed;
- orderflow contradicts price;
- the move is late and invalidation is too wide;
- BTC is near a regime-changing level and the alt setup fights BTC.

## Cluster Search Translation

Because ATAS Cluster Search is not automatically available in this workspace, preserve two labels:

- `atas_cluster_label`: Filip's actual Cluster Search signal, when he provides it.
- `proxy_cluster_label`: RALPH public-data approximation.

Proxy absorption candidate:

- high aggressive flow into or beyond the level;
- low price progress after that flow;
- quick reclaim or failure to extend;
- CVD divergence against price;
- optional book imbalance or spread shock.

Proxy acceptance candidate:

- high aggressive flow through the level;
- price progress continues after the flow;
- CVD follows price;
- retest holds on lower volume or with opposing side failing;
- spread normalizes instead of staying chaotic.

## Post-Entry Monitor

`POST_ENTRY_MONITOR` starts immediately after `ENTRY_FILLED` and runs until the trade reaches `HOLD_ACCEPTED`, `FAST_KILL`, `THESIS_INVALIDATED`, or `POST_REVIEW`.

Default monitoring window:

- 1m execution: first `1-5` candles, with emergency checks every poll while price is near invalidation.
- 5m execution: first `1-3` candles, with 1m sub-checks for fail-back through the level.
- 15m execution: first `1-2` candles, with 5m sub-checks around retest and reclaim/fail-back.

The planned row must define `max_no_progress_time` before entry. If no level-specific value exists, use the smaller of `3 execution candles` or `15 minutes` for intraday trades. No progress means price does not make a meaningful favorable move, cannot hold beyond the level, and orderflow stops supporting the thesis.

Required lifecycle states:

- `ENTRY_FILLED`: position or paper fill exists; entry price, side, level, timestamp, source, thesis, hard SL, and first check are known.
- `ACTIVE_ACCEPTANCE_TEST`: thesis is alive but not proven; monitor next candles, retest, delta/CVD, absorption, spread, and BTC gate.
- `WARNING_FAKEOUT_RISK`: early evidence contradicts the trade but invalidation is not final; prefer tighten, reduce, or prepare kill.
- `FAST_KILL`: immediate exit recommendation for paper/live guidance when the small-timeframe read invalidates the entry before the hard SL is reached.
- `THESIS_INVALIDATED`: original setup failed; stop managing it as the original trade.
- `HOLD_ACCEPTED`: thesis has been confirmed enough to hold toward planned management targets.
- `RETEST_PENDING`: initial displacement is valid, but the trade still needs a retest or failed reclaim before hold confidence rises.
- `POST_REVIEW`: record MFE/MAE, invalidation timing, alert delivery, and whether fast-kill/hold logic helped.

`FAST_KILL` is not a revenge flip signal. A reversal/fade can only become a new `ENTRY_CANDIDATE` if it separately passes the level reaction, BTC gate, invalidation, and R/R checks.

## Post-Entry Rules By Setup

### Continuation Long After Upward Break

Initial thesis: price accepted above the planned level and should hold above it or continue upward.

Hold only if:

- price stays above the level or briefly retests and reclaims without heavy selling acceptance;
- the next `1-3` execution candles show favorable progress or a controlled retest;
- delta/CVD is aligned upward, or selling attempts fail to move price back below the level;
- no large opposing absorption appears above the level;
- BTC remains `BTC_RISK_ON` or clearly transitions risk-on for alt longs.

Warn/tighten/reduce if:

- price stalls just above the level while CVD rises and no new high follows;
- aggressive buying above the level is absorbed;
- spread widens or volatility spikes without continuation;
- BTC shifts to `BTC_TRANSITION` near a breakdown/rejection area.

Fast-kill or invalidate if:

- price closes back below the level on the execution timeframe and cannot reclaim on the next micro-test;
- price accepts back inside the prior range;
- the retest from above fails and sellers hold the level from below;
- BTC becomes `BTC_RISK_OFF` or rejects a key level while the long has not progressed.

### Fade Short After Upward Sweep

Initial thesis: price swept above the level, buyers were trapped, and rejection back inside should continue lower.

Hold only if:

- price remains below the swept level after reclaim failure;
- any retest from below rejects with seller response;
- delta/CVD shows buyer exhaustion, bearish divergence, or aggressive buying absorbed above the level;
- target toward VWAP, value, open, or range midpoint remains reachable with acceptable R/R;
- BTC does not become `BTC_RISK_ON` in a way that blocks alt shorts.

Warn/tighten/reduce if:

- price reclaims the level but has not yet accepted above it;
- sellers cannot push away from the level within `1-3` execution candles;
- CVD starts falling but price no longer follows lower, suggesting seller absorption;
- BTC starts coiling upward near breakout.

Fast-kill or invalidate if:

- price accepts back above the swept level;
- the failed-breakout high is taken and held;
- aggressive buying appears above the level with real price progress;
- BTC is `BTC_RISK_ON` or breaks up while the short remains near entry.

### Continuation Short After Downward Break

Initial thesis: price accepted below the planned level and should hold below it or continue downward.

Hold only if:

- price stays below the level or briefly retests and rejects without buyer acceptance;
- the next `1-3` execution candles show favorable downside progress or a controlled retest;
- delta/CVD is aligned downward, or buyer attempts fail to reclaim the level;
- no large buyer absorption appears below the level;
- BTC remains `BTC_RISK_OFF` or clearly transitions risk-off for alt shorts.

Warn/tighten/reduce if:

- price stalls just below the level while CVD falls and no new low follows;
- aggressive selling below the level is absorbed;
- spread widens or volatility spikes without continuation;
- BTC shifts to `BTC_TRANSITION` near a breakout/reclaim area.

Fast-kill or invalidate if:

- price closes back above the level on the execution timeframe and cannot reject on the next micro-test;
- price accepts back inside the prior range;
- the retest from below fails for sellers and buyers hold the level from above;
- BTC becomes `BTC_RISK_ON` while the short has not progressed.

### Fade Long After Downward Sweep

Initial thesis: price swept below the level, sellers were trapped, and reclaim back inside should continue upward.

Hold only if:

- price remains above the swept level after reclaim;
- any retest from above holds with buyer response;
- delta/CVD shows seller exhaustion, bullish divergence, or aggressive selling absorbed below the level;
- target toward VWAP, value, open, or range midpoint remains reachable with acceptable R/R;
- BTC does not become `BTC_RISK_OFF` in a way that blocks alt longs.

Warn/tighten/reduce if:

- price loses the level but has not yet accepted below it;
- buyers cannot push away from the level within `1-3` execution candles;
- CVD starts rising but price no longer follows higher, suggesting buyer absorption;
- BTC starts breaking down or rejecting a key reclaim.

Fast-kill or invalidate if:

- price accepts back below the swept level;
- the sweep low is taken and held;
- aggressive selling appears below the level with real price progress;
- BTC is `BTC_RISK_OFF` or breaks down while the long remains near entry.

## Alert Mapping

- `PLANNED_LEVEL_WATCH`: near the level, but no decision.
- `LEVEL_REACTION_CANDIDATE`: sweep/reclaim or retest/hold with orderflow confirmation.
- `LEVEL_ACCEPTANCE_BREAK`: clean close-through plus retest or displacement.
- `ENTRY_FILLED`: planned-level paper/live fill exists and `POST_ENTRY_MONITOR` must start immediately.
- `ACTIVE_ACCEPTANCE_TEST`: early post-entry confirmation window is open.
- `WARNING_FAKEOUT_RISK`: thesis is weakening; tighten, reduce, or prepare fast-kill.
- `FAST_KILL`: small-timeframe read failed quickly; exit recommendation before waiting for original SL.
- `HOLD_ACCEPTED`: post-entry reaction confirms holding the planned thesis.
- `RETEST_PENDING`: initial break/reclaim is promising but hold decision depends on retest behavior.
- `THESIS_INVALIDATED`: original setup failed; stop managing it as the original thesis.
- `PLAN_INVALIDATED`: chop, contradiction, late entry, or higher-timeframe conflict.

## Paper Monitor Spec

This is the minimum spec for a paper/read-only monitor. It does not place, modify, or cancel orders.

Required data:

- frozen planned level, timeframe, side, thesis, entry trigger, hard SL, target family, and no-trade conditions;
- BTC price, structure, key nearby levels, and `BTC_RISK_ON` / `BTC_RISK_OFF` / `BTC_TRANSITION` / `BTC_STALE` gate;
- target symbol mark/last price, candles on execution and confirmation timeframes, and level distance;
- orderflow inputs when available: ATAS Cluster Search label, public proxy cluster label, delta/CVD, trade volume by side, absorption candidate, book/spread shock;
- fill source and timestamp for live or paper entry;
- Telegram delivery status for any user-facing alert.

Cadence:

- poll every `15-30s` during the first `1-5` minutes after a 1m/5m execution fill when price is inside the level band or near invalidation;
- poll at candle close for the execution timeframe, plus immediate checks on fail-back/reclaim through the level;
- stop intensive monitoring once state reaches `HOLD_ACCEPTED`, `FAST_KILL`, `THESIS_INVALIDATED`, or the predefined monitoring window expires.

Alert wording template:

```text
STATE: ENTRY_FILLED / ACTIVE_ACCEPTANCE_TEST / WARNING_FAKEOUT_RISK / FAST_KILL / HOLD_ACCEPTED / THESIS_INVALIDATED
SOURCE: market source, timestamp UTC, freshness
LEVEL: planned level, timeframe, side
THESIS: acceptance or rejection in one sentence
POST-ENTRY READ: price vs level, delta/CVD, absorption, retest, BTC gate
ACTION: hold / tighten / reduce / fast-kill / stop treating as original thesis
INVALIDATION: exact level or condition
NEXT CHECK: candle/time/price/orderflow trigger
DELIVERY: Telegram verified / pending / failed
```

Realtime honesty:

- Do not claim active management unless an actual monitor is running with fresh verified data.
- If data is older than `30s` during a leveraged active position, refresh before giving live guidance or label the read stale.
- If Telegram delivery cannot be verified, record delivery as unknown or failed; do not claim Tomas saw the alert.
- No live execution automation, order placement, account/key/API change, paid access change, or scheduler change is authorized by this protocol.

## Paper Outcome Schema

For each post-entry test row, record:

- `entry_trigger_timestamp_utc`
- `entry_state`: `LEVEL_REACTION_CANDIDATE` or `LEVEL_ACCEPTANCE_BREAK`
- `post_entry_state_sequence`
- `mfe_1c`, `mae_1c`, `mfe_3c`, `mae_3c`, `mfe_5c`, `mae_5c`, `mfe_15c`, `mae_15c`
- `first_invalidation_event`
- `time_to_favorable_progress`
- `time_to_fail_back_or_reclaim`
- `delta_cvd_confirmation`
- `absorption_against_trade`
- `btc_gate_at_entry`
- `btc_gate_during_monitor`
- `fast_kill_would_save_risk`
- `fast_kill_would_false_kill_winner`
- `hold_accepted_reason`
- `delivery_verified`

## Current Evidence Weight

Candle-only baseline is not strong enough. This protocol should reduce bad discretionary decisions by forcing classification, no-trade states, and post-entry thesis checks, but it must prove value through paper rows before live alert use.

## Boundary

No live alert thresholds, scheduler, account/key/API/paid access, demo/testnet, live trading, order, sizing, TP/SL, execution behavior, public posting, or strategy promotion changed. Alert wording above is paper/read-only protocol wording only and is not active realtime management.
