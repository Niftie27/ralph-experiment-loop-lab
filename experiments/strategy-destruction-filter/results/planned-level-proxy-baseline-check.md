# Planned-Level Proxy Baseline Check

Generated: 2026-09-28T09:01:08.929Z

Research-only sanity check for public-data planned-level orderflow proxy labels. It does not change live alerts, thresholds, sizing, TP/SL, execution, schedulers, accounts, keys, paid services, watcher behavior, or strategy status.

## Totals

- Replay rows: 20
- Fetched public trade windows: 10
- Fast-kill candidates: 6
- Hold/retest candidates: 4
- Verdict: proxy_labels_mixed_no_promotion
- Reason: The refreshed proxy labels do not clear a simple 5-candle MFE/MAE sanity check; use this as a falsification baseline before richer orderflow work.

## Five-Candle Sanity Check

- Overall favorable-dominant share: 40% (4/10)
- Fast-kill label support: 50% (3/6)
- Hold/retest label support: 25% (1/4)

Support means fast-kill rows had MAE >= MFE, while hold/retest rows had MFE > MAE. This is a crude candle-only sanity check, not a tradable edge.

## Horizon Summary

| Horizon | Rows | Favorable dominant | Adverse dominant | Favorable share | Mean MFE-MAE pct |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1c | 10 | 5 | 5 | 50% | -0.0653 |
| 3c | 10 | 4 | 6 | 40% | -0.0328 |
| 5c | 10 | 4 | 6 | 40% | 0.1035 |

## Rows

### BTC-1h-previous_day_high-1789606800

- Time: 2026-09-17T01:00:00.000Z
- Setup: fade_short, classification=sweep_rejection, BTC gate=BTC_TRANSITION
- Proxy: acceptance_proxy, label=hold_or_retest_candidate
- 5c: MFE=0.4175%, MAE=0.3377%, MFE-MAE=0.0798%

### BTC-1h-previous_day_high-1789700400

- Time: 2026-09-18T03:00:00.000Z
- Setup: continuation_long, classification=accepted_break, BTC gate=BTC_RISK_ON
- Proxy: fail_back_or_reclaim, label=fast_kill_candidate
- 5c: MFE=1.1583%, MAE=0.2154%, MFE-MAE=0.9429%

### BTC-1h-previous_day_high-1789776000

- Time: 2026-09-19T00:00:00.000Z
- Setup: continuation_long, classification=accepted_break, BTC gate=BTC_RISK_ON
- Proxy: fail_back_or_reclaim, label=fast_kill_candidate
- 5c: MFE=0.0882%, MAE=0.928%, MFE-MAE=-0.8398%

### BTC-1h-previous_day_low-1789869600

- Time: 2026-09-20T02:00:00.000Z
- Setup: continuation_short, classification=accepted_break, BTC gate=BTC_RISK_OFF
- Proxy: fail_back_or_reclaim, label=fast_kill_candidate
- 5c: MFE=0.2558%, MAE=0.4191%, MFE-MAE=-0.1633%

### BTC-1h-previous_day_high-1789948800

- Time: 2026-09-21T00:00:00.000Z
- Setup: continuation_long, classification=accepted_break, BTC gate=BTC_RISK_ON
- Proxy: mixed_no_trade_proxy, label=hold_or_retest_candidate
- 5c: MFE=0.6032%, MAE=0.9282%, MFE-MAE=-0.325%

### BTC-1h-previous_day_high-1790125200

- Time: 2026-09-23T01:00:00.000Z
- Setup: fade_short, classification=sweep_rejection, BTC gate=BTC_TRANSITION
- Proxy: mixed_no_trade_proxy, label=hold_or_retest_candidate
- 5c: MFE=0.1273%, MAE=1.0519%, MFE-MAE=-0.9246%

### BTC-1h-previous_day_low-1790172000

- Time: 2026-09-23T14:00:00.000Z
- Setup: continuation_short, classification=accepted_break, BTC gate=BTC_RISK_OFF
- Proxy: fail_back_or_reclaim, label=fast_kill_candidate
- 5c: MFE=1.2232%, MAE=0.3076%, MFE-MAE=0.9156%

### BTC-1h-previous_day_low-1790236800

- Time: 2026-09-24T08:00:00.000Z
- Setup: fade_long, classification=sweep_rejection, BTC gate=BTC_TRANSITION
- Proxy: acceptance_proxy, label=hold_or_retest_candidate
- 5c: MFE=0.8128%, MAE=0.9384%, MFE-MAE=-0.1256%

### BTC-1h-previous_day_high-1790334000

- Time: 2026-09-25T11:00:00.000Z
- Setup: fade_short, classification=sweep_rejection, BTC gate=BTC_TRANSITION
- Proxy: fail_back_or_reclaim, label=fast_kill_candidate
- 5c: MFE=1.6548%, MAE=0.1435%, MFE-MAE=1.5113%

### BTC-1h-previous_day_high-1790470800

- Time: 2026-09-27T01:00:00.000Z
- Setup: continuation_long, classification=accepted_break, BTC gate=BTC_RISK_ON
- Proxy: fail_back_or_reclaim, label=fast_kill_candidate
- 5c: MFE=0.1882%, MAE=0.2245%, MFE-MAE=-0.0363%

## Boundary

No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed.
