# Planned-Level Proxy Replay

Generated: 2026-09-28T08:58:49.934Z

Research-only public-data scaffold for the Filip pdV/pdN / Cluster Search lane. It does not change live alerts, thresholds, sizing, execution, or strategy status.

## Totals

- Candidate events: 20
- Fetched trade windows: 10
- No-fetch rows: 10
- Fetch-failed rows: 0
- Verdict: proxy_replay_rows_ready_for_baseline_test
- Next action: Compare proxy labels against candle-only hold/kill baselines with costs and false-kill rates.

## Gates

- Minimum frozen events before candidate: 20
- Minimum fetched trade windows before rule: 10
- BTC gate required for every row.
- Baseline lift required before any promotion.

## Rows

### BTC-1h-previous_day_low-1788764400

- Time: 2026-09-07T07:00:00.000Z
- Level: previous_day_low down @ 79233
- Setup: fade_long, classification=sweep_rejection
- BTC gate: BTC_TRANSITION (BTC inside prior 24h range)
- Proxy: not_fetched, tradeWindow=fetch_disabled
- Fast-kill label: unscored_without_trade_window

### BTC-1h-previous_day_low-1788840000

- Time: 2026-09-08T04:00:00.000Z
- Level: previous_day_low down @ 78680
- Setup: fade_long, classification=mixed_weak_break
- BTC gate: BTC_RISK_OFF (1h close below prior 24h low)
- Proxy: not_fetched, tradeWindow=fetch_disabled
- Fast-kill label: unscored_without_trade_window

### BTC-1h-previous_day_high-1788940800

- Time: 2026-09-09T08:00:00.000Z
- Level: previous_day_high up @ 79485
- Setup: continuation_long, classification=accepted_break
- BTC gate: BTC_RISK_ON (1h close above prior 24h high)
- Proxy: not_fetched, tradeWindow=fetch_disabled
- Fast-kill label: unscored_without_trade_window

### BTC-1h-previous_day_low-1789038000

- Time: 2026-09-10T11:00:00.000Z
- Level: previous_day_low down @ 77770
- Setup: fade_long, classification=sweep_rejection
- BTC gate: BTC_TRANSITION (BTC near edge of prior 24h range)
- Proxy: not_fetched, tradeWindow=fetch_disabled
- Fast-kill label: unscored_without_trade_window

### BTC-1h-previous_day_low-1789128000

- Time: 2026-09-11T12:00:00.000Z
- Level: previous_day_low down @ 76464
- Setup: fade_long, classification=sweep_rejection
- BTC gate: BTC_RISK_ON (1h close above prior 24h high)
- Proxy: not_fetched, tradeWindow=fetch_disabled
- Fast-kill label: unscored_without_trade_window

### BTC-1h-previous_day_high-1789131600

- Time: 2026-09-11T13:00:00.000Z
- Level: previous_day_high up @ 78564.39
- Setup: continuation_long, classification=accepted_break
- BTC gate: BTC_RISK_ON (1h close above prior 24h high)
- Proxy: not_fetched, tradeWindow=fetch_disabled
- Fast-kill label: unscored_without_trade_window

### BTC-1h-previous_day_low-1789279200

- Time: 2026-09-13T06:00:00.000Z
- Level: previous_day_low down @ 77059.75
- Setup: fade_long, classification=sweep_rejection
- BTC gate: BTC_TRANSITION (BTC inside prior 24h range)
- Proxy: not_fetched, tradeWindow=fetch_disabled
- Fast-kill label: unscored_without_trade_window

### BTC-1h-previous_day_low-1789344000

- Time: 2026-09-14T00:00:00.000Z
- Level: previous_day_low down @ 76500
- Setup: fade_long, classification=sweep_rejection
- BTC gate: BTC_TRANSITION (BTC inside prior 24h range)
- Proxy: not_fetched, tradeWindow=fetch_disabled
- Fast-kill label: unscored_without_trade_window

### BTC-1h-previous_day_high-1789351200

- Time: 2026-09-14T02:00:00.000Z
- Level: previous_day_high up @ 77450
- Setup: continuation_long, classification=accepted_break
- BTC gate: BTC_RISK_ON (1h close above prior 24h high)
- Proxy: not_fetched, tradeWindow=fetch_disabled
- Fast-kill label: unscored_without_trade_window

### BTC-1h-previous_day_low-1789477200

- Time: 2026-09-15T13:00:00.000Z
- Level: previous_day_low down @ 76388.72
- Setup: fade_long, classification=sweep_rejection
- BTC gate: BTC_RISK_OFF (1h close below prior 24h low)
- Proxy: not_fetched, tradeWindow=fetch_disabled
- Fast-kill label: unscored_without_trade_window

### BTC-1h-previous_day_high-1789606800

- Time: 2026-09-17T01:00:00.000Z
- Level: previous_day_high up @ 76560.76
- Setup: fade_short, classification=sweep_rejection
- BTC gate: BTC_TRANSITION (BTC inside prior 24h range)
- Proxy: acceptance_proxy, tradeWindow=ok
- Fast-kill label: hold_or_retest_candidate

### BTC-1h-previous_day_high-1789700400

- Time: 2026-09-18T03:00:00.000Z
- Level: previous_day_high up @ 77179.47
- Setup: continuation_long, classification=accepted_break
- BTC gate: BTC_RISK_ON (1h close above prior 24h high)
- Proxy: fail_back_or_reclaim, tradeWindow=ok
- Fast-kill label: fast_kill_candidate

### BTC-1h-previous_day_high-1789776000

- Time: 2026-09-19T00:00:00.000Z
- Level: previous_day_high up @ 81400
- Setup: continuation_long, classification=accepted_break
- BTC gate: BTC_RISK_ON (1h close above prior 24h high)
- Proxy: fail_back_or_reclaim, tradeWindow=ok
- Fast-kill label: fast_kill_candidate

### BTC-1h-previous_day_low-1789869600

- Time: 2026-09-20T02:00:00.000Z
- Level: previous_day_low down @ 80844.58
- Setup: continuation_short, classification=accepted_break
- BTC gate: BTC_RISK_OFF (1h close below prior 24h low)
- Proxy: fail_back_or_reclaim, tradeWindow=ok
- Fast-kill label: fast_kill_candidate

### BTC-1h-previous_day_high-1789948800

- Time: 2026-09-21T00:00:00.000Z
- Level: previous_day_high up @ 81497.33
- Setup: continuation_long, classification=accepted_break
- BTC gate: BTC_RISK_ON (1h close above prior 24h high)
- Proxy: mixed_no_trade_proxy, tradeWindow=ok
- Fast-kill label: hold_or_retest_candidate

### BTC-1h-previous_day_high-1790125200

- Time: 2026-09-23T01:00:00.000Z
- Level: previous_day_high up @ 86717.6
- Setup: fade_short, classification=sweep_rejection
- BTC gate: BTC_TRANSITION (BTC inside prior 24h range)
- Proxy: mixed_no_trade_proxy, tradeWindow=ok
- Fast-kill label: hold_or_retest_candidate

### BTC-1h-previous_day_low-1790172000

- Time: 2026-09-23T14:00:00.000Z
- Level: previous_day_low down @ 85114
- Setup: continuation_short, classification=accepted_break
- BTC gate: BTC_RISK_OFF (1h close below prior 24h low)
- Proxy: fail_back_or_reclaim, tradeWindow=ok
- Fast-kill label: fast_kill_candidate

### BTC-1h-previous_day_low-1790236800

- Time: 2026-09-24T08:00:00.000Z
- Level: previous_day_low down @ 83500.01
- Setup: fade_long, classification=sweep_rejection
- BTC gate: BTC_TRANSITION (BTC near edge of prior 24h range)
- Proxy: acceptance_proxy, tradeWindow=ok
- Fast-kill label: hold_or_retest_candidate

### BTC-1h-previous_day_high-1790334000

- Time: 2026-09-25T11:00:00.000Z
- Level: previous_day_high up @ 84942.45
- Setup: fade_short, classification=sweep_rejection
- BTC gate: BTC_TRANSITION (BTC inside prior 24h range)
- Proxy: fail_back_or_reclaim, tradeWindow=ok
- Fast-kill label: fast_kill_candidate

### BTC-1h-previous_day_high-1790470800

- Time: 2026-09-27T01:00:00.000Z
- Level: previous_day_high up @ 84473.58
- Setup: continuation_long, classification=accepted_break
- BTC gate: BTC_RISK_ON (1h close above prior 24h high)
- Proxy: fail_back_or_reclaim, tradeWindow=ok
- Fast-kill label: fast_kill_candidate

