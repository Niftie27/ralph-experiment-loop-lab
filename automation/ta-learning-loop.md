# TA Learning Loop

Status: approved, first bounded implementation active.

## Contract

The TA learning loop turns Crypto Updates alert/review history into compact research memory for future alert recommendations. It is post-alert/post-trade analysis only.

It may:

- read local monitor feedback and paper/demo outputs
- classify setups into fade, follow, noisy, or unclassified buckets
- write compact JSON, YAML, and Markdown indexes for retrieval
- recommend candidate alert wording deltas for later approval
- feed RALPH strategy research, validation, and work queues
- connect alert review to paper-only backtests across liquid large-cap crypto assets

It must not:

- place orders
- change live order execution
- change risk, sizing, leverage, TP/SL, entry-valid, or stop rules
- enable paid APIs, exchange accounts, wallet access, or private keys
- treat delayed/untrusted alert delivery as valid trading evidence

## Inputs

Read in this order:

1. `../crypto-updates/setup-analysis-index.yaml`
2. `../crypto-updates/monitor-index.yaml`
3. `../crypto-updates/wiki/setup-analysis/latest.md`
4. `../crypto-updates/runtime/setup-analysis.json`
5. `../crypto-updates/runtime/alert-feedback.jsonl` only when row-level proof is needed

The current implementation uses existing local alert/review records plus public no-key 1m candles where available. Binance spot candle joins are active for BTC/ETH/SOL reviewed alerts, and Hyperliquid candle joins are active where the public endpoint returns history. Missing candle history stays labeled as `unknown_without_candle_context` instead of being inferred.

## Schema

Each reviewed setup keeps:

- `setup_type`: deterministic family such as `wick-shock`, `velocity-shock-60s`, `velocity-shock-5m`, or `velocity-shock-15m`
- `context`: trend/range/impulse/support-resistance fields from public 1m candles where available; unavailable history stays explicitly unknown
- `trigger_quality`: evidence score bucket plus orderflow/depth tags
- `fade_vs_follow`: `fade`, `follow`, `noisy`, or `unclassified`
- `entry_quality`: research-only hypothetical fade entry outcome bucket
- `mfe_mae`: follow and fade MFE/MAE percentages
- `volume_orderflow`: public no-key orderflow features when present
- `winner_loser_reason_tags`: compact reason tags for aggregation
- `hypothetical_trade_decision`: research-only act/skip/wait/fade/follow label with TA reasons
- `confidence`: per-record confidence
- `recommendation_rule_delta`: research-only candidate delta; not live wording

## Outputs

- Script: `../crypto-updates/analyze-alert-setups.mjs`
- Compact index: `../crypto-updates/setup-analysis-index.yaml`
- Row output: `../crypto-updates/runtime/setup-analysis.json`
- Candle cache: `../crypto-updates/runtime/setup-candle-context-cache.json`
- Human/wiki summary: `../crypto-updates/wiki/setup-analysis/latest.md`
- Backtest snapshot: `experiments/btc-eth-alert-edge/results/edge-snapshot.json`
- Backtest verifier: `experiments/btc-eth-alert-edge/src/verify-backtest.mjs`

## Recommendation Policy

Live alert text is unchanged in the watcher.

The script may produce `recommendation_rules` with `live_alert_text_change: false` and a short `suggested_call` when a bucket has enough reviewed samples, a dominant non-noisy outcome, and full candle context. A rule can only become live watcher text after:

- the bucket has enough reviewed samples for the stated confidence
- path-ordering ambiguity is handled where TP/SL claims are involved
- delayed/untrusted alerts are excluded or labeled
- the live watcher integration is deliberately edited and verified

Current non-live decision: `wick-shock|DOWN|evidence-medium` has a low-sample research candidate, `Call: follow-through favored (low-sample)`, from 3/3 follow outcomes with full candle context. It is not wired into live alerts.

Current per-alert decision state: 16 total hypothetical alert decisions are generated from local history. The action mix is 2 `consider_fade_with_confirmation`, 2 `consider_follow_after_confirmation`, 8 `observe_only`, 3 `skip_no_edge`, and 1 `skip_untrusted_delivery`.

Current expanded backtest state: the paper-only liquid-crypto alert-edge experiment covers BTC, ETH, SOL, BNB, XRP, DOGE, ADA, LINK, and AVAX. Latest verified run produced 423 setup-stat buckets, 7 latest paper detections, 18 symbol/timeframe sources, and no live execution. The existing silent cron job is `370e239c-33bf-4253-a4f9-88b81706c52e` (`liquid-crypto-alert-edge-backtest`), every 4h UTC, delivery `none`.

When integrated later, alert wording should remain short, for example one `Call:` line with a low-sample label. It must not include sizing, leverage, or risk-rule changes.

## Verify/Reassess Rule

Every run must verify and reassess its own steps before treating outputs as useful.

Minimum loop:

1. Syntax-check changed scripts.
2. Regenerate setup-analysis outputs.
3. Run `node crypto-updates/verify-setup-analysis.mjs`.
4. Confirm JSON/YAML/wiki counts agree.
5. Confirm every reviewed and unreviewed alert has a hypothetical decision.
6. Confirm `live_alert_text_change` remains false unless Tomas explicitly approved exact live wording.
7. Reassess whether any probability/confidence label is justified by sample size, candle/orderflow coverage, and manual TA context.
8. If verification fails, record the blocker and do not promote recommendations.

## Runbook

From `/home/coder/.openclaw/workspace`:

```bash
node --check crypto-updates/analyze-alert-setups.mjs
node crypto-updates/analyze-alert-setups.mjs
node crypto-updates/verify-setup-analysis.mjs
npm run universe --prefix ralph-research-os/experiments/btc-eth-alert-edge
npm run backtest --prefix ralph-research-os/experiments/btc-eth-alert-edge
npm run verify --prefix ralph-research-os/experiments/btc-eth-alert-edge
```

Then verify:

```bash
sed -n '1,120p' crypto-updates/setup-analysis-index.yaml
sed -n '1,160p' crypto-updates/wiki/setup-analysis/latest.md
node -e "const x=require('./crypto-updates/runtime/setup-analysis.json'); console.log(x.summary)"
```

## Scheduling

No standalone cron was enabled in the first setup pass because no OpenClaw cron tool was available in that worker. The loop is safe to run manually or from the approved isolated RALPH autoresearch cron.

If a standalone schedule is later added, use the OpenClaw cron tool with:

- isolated session
- delivery `none` by default
- sparse Telegram summary only on promoted candidate, repeated blocker, or explicit Tomas request

## Reusable Workflow Proposal

Pending Skill Workshop proposal: `ralph-ta-learning-loop-20260818-d79d9f390f`.

It was created only as a proposal. It was not applied, installed, or enabled.

## Self-Check

- Research/indexing only: yes.
- Live execution changed: no.
- Risk/sizing rules changed: no.
- Public/free/local data only: yes.
- Index-first retrieval supported: yes.
- Recommendation hook is non-live and marked low confidence unless promoted: yes.
