# Strategy Spam Funnel First Pass

Generated: 2026-10-04T08:38:11.018Z
Status: research-only-strategy-spam-funnel-no-promotion

Research-only high-throughput first-pass strategy spam over public candles. BTC is tested directly; alt rows are allowed only through an explicit BTC regime gate. This does not import candidates into `seed-strategies.json`, change live alerts, change paper/demo behavior, change schedules, handle keys/accounts, or promote a strategy.

## Decision

- Verdict: survivors_require_manual_review_before_candidate_import
- Candidate import: false
- Strategy promotion: false
- Live/paper behavior change: false
- Note: This batch intentionally stays outside seed-strategies.json. Survivors, if any, require manual review before becoming curated candidates.

## Totals

- Candidate families: 7
- Variants tested: 390
- Survivors: 1
- Rejected: 389
- Near misses: 10
- Effective metric shapes: 367
- Duplicate metric shapes: 11
- Duplicate variant rows: 23

## Batch Manifest

- btc_basic_spam: active_in_this_run; BTC-only breakout, mean-reversion, MA reclaim/reject, and volume-shock fade parameter spam.
- alt_btc_gated_continuation_fade: active_in_this_run; ETH/SOL spot-candle continuation/fade spam with BTC_RISK_ON/BTC_RISK_OFF direction gating.
- source_inspired_grid_dca_mm: manifest_only_not_run; Source-inspired grid/DCA/MM claims require a specific source prior and separate inventory/fee controls before testing.
- funding_basis_public: manifest_only_not_run; Public funding/basis spam should use linear-perp data and stay separated from spot-candle batches.

## BTC Gate

- Required for alt signals: true
- Alt long allowed BTC regimes: BTC_RISK_ON
- Alt short allowed BTC regimes: BTC_RISK_OFF
- Blocked BTC regimes: BTC_TRANSITION, BTC_STALE

- ETH 1h: checked=73114, passed=26758, blocked=46356, regimes=BTC_RISK_ON:23989 BTC_RISK_OFF:22085 BTC_TRANSITION:27040 BTC_STALE:0
- ETH 4h: checked=14978, passed=6526, blocked=8452, regimes=BTC_RISK_ON:4655 BTC_RISK_OFF:4745 BTC_TRANSITION:5578 BTC_STALE:0
- SOL 1h: checked=64250, passed=24737, blocked=39513, regimes=BTC_RISK_ON:20864 BTC_RISK_OFF:18556 BTC_TRANSITION:24830 BTC_STALE:0
- SOL 4h: checked=12542, passed=6015, blocked=6527, regimes=BTC_RISK_ON:4349 BTC_RISK_OFF:3664 BTC_TRANSITION:4529 BTC_STALE:0

## Effective Shape Dedupe

- size=5; representative=spam-alt-btc-gated-rsi-fade-v0#63; variants=spam-alt-btc-gated-rsi-fade-v0#63, spam-alt-btc-gated-rsi-fade-v0#65, spam-alt-btc-gated-rsi-fade-v0#66, spam-alt-btc-gated-rsi-fade-v0#69, spam-alt-btc-gated-rsi-fade-v0#71
- size=4; representative=spam-btc-volume-breakout-v0#61; variants=spam-btc-volume-breakout-v0#61, spam-btc-volume-breakout-v0#62, spam-btc-volume-breakout-v0#63, spam-btc-volume-breakout-v0#64
- size=4; representative=spam-btc-volume-breakout-v0#65; variants=spam-btc-volume-breakout-v0#65, spam-btc-volume-breakout-v0#66, spam-btc-volume-breakout-v0#67, spam-btc-volume-breakout-v0#68
- size=4; representative=spam-btc-volume-breakout-v0#69; variants=spam-btc-volume-breakout-v0#69, spam-btc-volume-breakout-v0#70, spam-btc-volume-breakout-v0#71, spam-btc-volume-breakout-v0#72
- size=3; representative=spam-alt-btc-gated-rsi-fade-v0#21; variants=spam-alt-btc-gated-rsi-fade-v0#21, spam-alt-btc-gated-rsi-fade-v0#22, spam-alt-btc-gated-rsi-fade-v0#27
- size=3; representative=spam-alt-btc-gated-rsi-fade-v0#23; variants=spam-alt-btc-gated-rsi-fade-v0#23, spam-alt-btc-gated-rsi-fade-v0#24, spam-alt-btc-gated-rsi-fade-v0#29
- size=3; representative=spam-alt-btc-gated-rsi-fade-v0#57; variants=spam-alt-btc-gated-rsi-fade-v0#57, spam-alt-btc-gated-rsi-fade-v0#59, spam-alt-btc-gated-rsi-fade-v0#60
- size=2; representative=spam-alt-btc-gated-rsi-fade-v0#19; variants=spam-alt-btc-gated-rsi-fade-v0#19, spam-alt-btc-gated-rsi-fade-v0#25
- size=2; representative=spam-alt-btc-gated-rsi-fade-v0#61; variants=spam-alt-btc-gated-rsi-fade-v0#61, spam-alt-btc-gated-rsi-fade-v0#67
- size=2; representative=spam-btc-volume-breakout-v0#57; variants=spam-btc-volume-breakout-v0#57, spam-btc-volume-breakout-v0#58

## Sources

- BTC 1h: 43790 candles, 2021-10-05T09:00:00.000Z to 2026-10-03T23:00:00.000Z, source=binance-public-archive-rest-tail, market=spot
- BTC 4h: 10950 candles, 2021-10-05T12:00:00.000Z to 2026-10-04T08:00:00.000Z, source=binance-public-archive-rest-tail, market=spot
- ETH 1h: 43790 candles, 2021-10-05T09:00:00.000Z to 2026-10-03T23:00:00.000Z, source=binance-public-archive-rest-tail, market=spot
- ETH 4h: 10950 candles, 2021-10-05T12:00:00.000Z to 2026-10-04T08:00:00.000Z, source=binance-public-archive-rest-tail, market=spot
- SOL 1h: 43790 candles, 2021-10-05T09:00:00.000Z to 2026-10-03T23:00:00.000Z, source=binance-public-archive-rest-tail, market=spot
- SOL 4h: 10950 candles, 2021-10-05T12:00:00.000Z to 2026-10-04T08:00:00.000Z, source=binance-public-archive-rest-tail, market=spot

## Families

- spam-btc-volume-breakout-v0: spam_breakout, rule=breakout; Spam simple BTC volume-confirmed breakouts across 1h/4h to see whether any dumb breakout parameter pocket survives strict gates.
- spam-btc-rsi-fade-v0: spam_mean_reversion, rule=rsi_reversion; Spam BTC RSI mean-reversion fades with trend-strength caps.
- spam-btc-ma-reclaim-v0: spam_trend_pullback, rule=ma_reclaim; Spam BTC moving-average reclaim/reject continuation variants.
- spam-btc-downshock-fade-v0: spam_velocity_fade, rule=volume_velocity_fade; Spam BTC downside volume-shock fades.
- spam-btc-upshock-fade-v0: spam_velocity_fade, rule=volume_velocity_fade; Spam BTC upside volume-shock fades.
- spam-alt-btc-gated-ma-reclaim-v0: spam_alt_btc_gated_continuation, rule=ma_reclaim; Spam ETH/SOL continuation after moving-average reclaim/reject, but only when BTC regime explicitly agrees with the alt direction.
- spam-alt-btc-gated-rsi-fade-v0: spam_alt_btc_gated_fade, rule=rsi_reversion; Spam ETH/SOL RSI fades only when BTC regime permits the fade direction.

## Top Verdicts

- spam-alt-btc-gated-ma-reclaim-v0#57: survived_research_gate; failures=none; sample=262, exp=0.1391R, PF=1.2595, OOS=0.1089R, lift=0.0357R, DD=15.2085R
- spam-alt-btc-gated-ma-reclaim-v0#58: rejected; failures=drawdown_too_high, weak_walk_forward_out_of_sample; sample=285, exp=0.1224R, PF=1.2262, OOS=0.0822R, lift=0.1579R, DD=18.3068R
- spam-btc-volume-breakout-v0#65: rejected; failures=weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample; sample=525, exp=0.0652R, PF=1.1146, OOS=-0.1343R, lift=0.1307R, DD=31.4434R
- spam-btc-volume-breakout-v0#66: rejected; failures=weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample; sample=525, exp=0.0652R, PF=1.1146, OOS=-0.1343R, lift=0.1307R, DD=31.4434R
- spam-btc-volume-breakout-v0#67: rejected; failures=weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample; sample=525, exp=0.0652R, PF=1.1146, OOS=-0.1343R, lift=0.1307R, DD=31.4434R
- spam-btc-volume-breakout-v0#68: rejected; failures=weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample; sample=525, exp=0.0652R, PF=1.1146, OOS=-0.1343R, lift=0.1307R, DD=31.4434R
- spam-alt-btc-gated-ma-reclaim-v0#61: rejected; failures=weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift; sample=247, exp=0.0922R, PF=1.1679, OOS=0.0152R, lift=-0.0376R, DD=16.3148R
- spam-btc-volume-breakout-v0#61: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample; sample=574, exp=0.0429R, PF=1.0744, OOS=-0.1378R, lift=0.0301R, DD=37.3359R
- spam-btc-volume-breakout-v0#62: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample; sample=574, exp=0.0429R, PF=1.0744, OOS=-0.1378R, lift=0.0301R, DD=37.3359R
- spam-btc-volume-breakout-v0#63: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample; sample=574, exp=0.0429R, PF=1.0744, OOS=-0.1378R, lift=0.0301R, DD=37.3359R
- spam-btc-volume-breakout-v0#64: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample; sample=574, exp=0.0429R, PF=1.0744, OOS=-0.1378R, lift=0.0301R, DD=37.3359R
- spam-alt-btc-gated-ma-reclaim-v0#62: rejected; failures=weak_profit_factor, drawdown_too_high, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift; sample=271, exp=0.0673R, PF=1.1208, OOS=-0.0026R, lift=0.0278R, DD=19.4131R
- spam-alt-btc-gated-ma-reclaim-v0#40: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice; sample=1942, exp=0.0217R, PF=1.0342, OOS=0.0433R, lift=0.1066R, DD=46.8618R
- spam-alt-btc-gated-ma-reclaim-v0#39: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice; sample=1872, exp=0.022R, PF=1.0346, OOS=0.0427R, lift=0.0986R, DD=46.7697R
- spam-btc-volume-breakout-v0#53: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_out_of_sample; sample=719, exp=0.0355R, PF=1.0605, OOS=-0.1627R, lift=0.0561R, DD=47.2793R

## Near Misses

- spam-alt-btc-gated-ma-reclaim-v0#58: rejected; failures=drawdown_too_high, weak_walk_forward_out_of_sample; sample=285, exp=0.1224R, PF=1.2262, OOS=0.0822R, lift=0.1579R, DD=18.3068R
- spam-btc-volume-breakout-v0#65: rejected; failures=weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample; sample=525, exp=0.0652R, PF=1.1146, OOS=-0.1343R, lift=0.1307R, DD=31.4434R
- spam-btc-volume-breakout-v0#66: rejected; failures=weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample; sample=525, exp=0.0652R, PF=1.1146, OOS=-0.1343R, lift=0.1307R, DD=31.4434R
- spam-btc-volume-breakout-v0#67: rejected; failures=weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample; sample=525, exp=0.0652R, PF=1.1146, OOS=-0.1343R, lift=0.1307R, DD=31.4434R
- spam-btc-volume-breakout-v0#68: rejected; failures=weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_walk_forward_out_of_sample; sample=525, exp=0.0652R, PF=1.1146, OOS=-0.1343R, lift=0.1307R, DD=31.4434R
- spam-alt-btc-gated-ma-reclaim-v0#61: rejected; failures=weak_baseline_lift, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift; sample=247, exp=0.0922R, PF=1.1679, OOS=0.0152R, lift=-0.0376R, DD=16.3148R
- spam-btc-volume-breakout-v0#61: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample; sample=574, exp=0.0429R, PF=1.0744, OOS=-0.1378R, lift=0.0301R, DD=37.3359R
- spam-btc-volume-breakout-v0#62: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample; sample=574, exp=0.0429R, PF=1.0744, OOS=-0.1378R, lift=0.0301R, DD=37.3359R
- spam-btc-volume-breakout-v0#63: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample; sample=574, exp=0.0429R, PF=1.0744, OOS=-0.1378R, lift=0.0301R, DD=37.3359R
- spam-btc-volume-breakout-v0#64: rejected; failures=weak_expectancy_after_costs, weak_profit_factor, drawdown_too_high, bad_failure_slice, weak_out_of_sample_expectancy, weak_out_of_sample_baseline_lift, weak_walk_forward_baseline_lift, weak_walk_forward_out_of_sample; sample=574, exp=0.0429R, PF=1.0744, OOS=-0.1378R, lift=0.0301R, DD=37.3359R

## Boundary

No live trading, orders, keys, paid APIs, account setup, wallet connection, scheduler/cron change, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, candidate import, or strategy promotion changed.

