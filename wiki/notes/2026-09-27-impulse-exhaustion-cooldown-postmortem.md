---
type: note
topic: impulse-exhaustion-cooldown-postmortem
created: 2026-09-27T08:10:00Z
last_updated: 2026-09-27T08:10:00Z
work_item: validation.impulse-exhaustion-cooldown-postmortem
status: complete
scope: research-only
tags:
  - ralph
  - demo-sim
  - range-breakout-survivor
  - impulse-exhaustion
  - cooldown-postmortem
  - postmortem-viable-only
  - research-only
  - no-promotion
related:
  - ../concepts/impulse-exhaustion-research-branch.md
  - ../../automation/roadmap.md
  - ../../automation/work-queues.yaml
  - ../../experiments/btc-eth-alert-edge/results/demo-sim-impulse-exhaustion-cooldown-postmortem.md
  - 2026-09-27-survivor-cluster-postmortem.md
---

# Impulse Exhaustion Cooldown Postmortem

## Purpose

This tests simple no-trade/cooldown ideas against the existing `range_breakout_long + BTC_RISK_ON` survivor rows.

It does not create a new entry rule. It asks whether prior BTC/alt/target overextension or recent synchronized SL information can cut the 2026-08-22-style damage without deleting the whole 2026-W34 impulse.

## Implementation

Added `experiments/btc-eth-alert-edge/src/demo-sim-impulse-exhaustion-cooldown-postmortem.mjs` and standalone package script `demo-sim:impulse-cooldown-postmortem`.

Outputs:

- `experiments/btc-eth-alert-edge/results/demo-sim-impulse-exhaustion-cooldown-postmortem.json`
- `experiments/btc-eth-alert-edge/results/demo-sim-impulse-exhaustion-cooldown-postmortem.md`

The script uses existing DEMO-SIM replay rows and local public candle cache only. It is not included in `demo-sim:all` and is not wired to cron.

## Result

Verdict: `cooldown_candidate_needs_forward_test`.

Baseline selected survivor:

- 107 trades
- +9035.42 USDT
- PF 1.6348
- 50.5% winrate
- 24.54% max drawdown

Candidate filters:

| Filter | Kept | Net | PF | Max DD | Skipped | Skipped Net |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| skip BTC when prior 72h BTC return > 15% | 70 | +6231.12 | 1.7930 | 9.24% | 37 | +2804.30 |
| skip when prior 72h median alt basket return > 20% | 76 | +9123.77 | 2.1612 | 7.83% | 31 | -88.35 |
| skip when prior 72h target-symbol return > 25% | 81 | +10471.10 | 2.3427 | 10.43% | 26 | -1435.68 |
| cooldown after 3 SLs in 6h for 24h | 107 | +9035.42 | 1.6348 | 24.54% | 0 | 0.00 |

Focus-week impact:

- target 72h > 25% skip kept 45 W34 rows, +10072.14 USDT, PF 4.8452, 73.3% winrate, 12.59% max drawdown
- alt-basket 72h > 20% skip kept 35 W34 rows, +7916.22 USDT, PF 5.7058, 74.3% winrate, 12.59% max drawdown
- BTC 72h > 15% skip kept 29 W34 rows, +5023.57 USDT, PF 3.9863, 69.0% winrate, 12.59% max drawdown

Context bucket finding:

- `btc_hot|alt_hot|target_hot` is the obvious danger bucket: 19 trades, -3586.65 USDT, PF 0.3405, 21.1% winrate, 42.23% max drawdown.
- The target-symbol overextension skip is the best first crude proxy because it retains/increases net PnL while cutting the hot/hot/hot tail.

## Interpretation

This is the first postmortem branch that found a plausible defensive filter.

The current evidence is still postmortem and selected on the known cluster, so it is not a promotion. But it gives a sharper next test: a purged forward validation of the target-symbol 72h overextension no-trade rule, with alt-basket overextension as a comparison.

Do not wire this to DEMO-SIM paper fund, live alerts, watchers, sizing, TP/SL, execution, `demo-sim:all`, or cron.

## Next Route

Recommended next validation: standalone `impulse-cooldown-purged-forward-test`.

Predeclared first rule:

- keep existing `range_breakout_long + BTC_RISK_ON`
- skip candidate rows when target-symbol prior 72h return is greater than 25%
- compare against baseline selected survivor, no-trade, and alt-basket >20% skip
- use purged/monthly forward folds or at least August-fit / later-forward split
- keep standalone only

## Verification

- `node --check ralph-research-os/experiments/btc-eth-alert-edge/src/demo-sim-impulse-exhaustion-cooldown-postmortem.mjs` passed.
- `npm run demo-sim:impulse-cooldown-postmortem --prefix ralph-research-os/experiments/btc-eth-alert-edge` passed.
- `work-queues.yaml` and `package.json` parsed.
- `demo-sim:all` was checked and still does not include the impulse cooldown postmortem.
- `node ralph-research-os/automation/research-validation-checklist.mjs` ran with queue/path/delivery/HITL/boundary checks passing; overall remains `fail` because of pre-existing retrieval failure, subsystem/cron warnings, and paper-demo `not-ready`.

## Boundary Delta

Changed:

- added one research-only impulse cooldown postmortem script
- added one standalone package script
- generated standalone JSON/Markdown results
- updated roadmap, queue, log, and memory

Unchanged:

- no scheduler or cron payload changes
- no live alerts
- no watcher behavior
- no keys, accounts, wallets, or paid APIs
- no sizing, leverage, risk, TP/SL, or execution behavior
- no public posting
- no strategy promotion
