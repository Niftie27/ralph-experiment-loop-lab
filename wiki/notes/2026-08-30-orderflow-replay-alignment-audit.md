---
type: note
topic: orderflow-replay-alignment-audit
created: 2026-08-30T05:58:00Z
last_updated: 2026-08-30T05:58:00Z
work_item: discovery.public-orderflow-data-rail-spike
status: complete
scope: research-only
tags:
  - ralph
  - research-note
  - orderflow
  - ta
  - audit
related:
  - ../../../crypto-updates/orderflow-alert-replay-alignment.mjs
  - ../../../crypto-updates/runtime/orderflow-alignment/latest.json
  - ../../../crypto-updates/wiki/orderflow/replay-alignment.md
  - 2026-08-10-public-orderflow-data-rail.md
  - 2026-08-13-orderflow-alert-alignment-check.md
---
# Orderflow Replay Alignment Audit

## Purpose

This closes a bounded `discovery.public-orderflow-data-rail-spike` pass under the Profitability Flywheel.

The target gap was not exchange connectivity. Previous no-key Binance/Hyperliquid captures had already proven that public orderflow collection and 1-second feature extraction work. The open question was whether saved feature windows can be replay-aligned against finalized Crypto Updates alerts by both time and symbol.

## Output

Added `crypto-updates/orderflow-alert-replay-alignment.mjs`.

The audit reads:

- `crypto-updates/runtime/alert-feedback.jsonl`
- saved `crypto-updates/runtime/orderflow-spikes/*/features.sqlite`
- each spike `manifest.yaml` for local capture start/finish windows

It writes:

- `crypto-updates/runtime/orderflow-alignment/latest.json`
- `crypto-updates/wiki/orderflow/replay-alignment.md`

The script uses manifest start/finish times for overlap decisions because Hyperliquid trade subscriptions can include a small pre-subscription backlog by exchange timestamp.

## Result

Current saved local data:

| Measure | Count |
| --- | ---: |
| Alert records | 244 |
| Finalized reviews | 239 |
| Feature runs checked | 6 |
| Exact symbol/time matches | 0 |
| Near misses or partial overlaps | 8 |

The two-hour `2026-08-22T08-39-ralph-hl-btc-2h` capture overlapped seven finalized alert windows by time, but the alerts were HYPE/SOL while the capture only covered BTC/BTCUSDT. That makes it useful as feature-pipeline evidence, not alert-classification evidence.

## Decision

`discovery.public-orderflow-data-rail-spike` is done for this bounded replay-alignment branch.

C-036 stays `Candidate`; U-038 stays `Open`. Current saved feature captures do not justify promoting the orderflow gate, changing live alert wording, or changing thresholds.

## Next Branch

Do not spend another retrospective score-only refresh until new exact overlap exists.

The next orderflow branch should be one of:

- run a no-key capture that includes BTC/ETH/SOL/HYPE during active alert windows;
- attach `orderflow-alert-replay-alignment.mjs` to future capture jobs so exact overlap is known immediately;
- update capture planning so HYPE/SOL alerts are not audited against BTC-only orderflow.

## Verify / Reassess

Verification:

- `node crypto-updates/orderflow-alert-replay-alignment.mjs` passed.
- The audit found 244 sent alerts, 239 finalized reviews, 6 feature runs, 0 exact symbol/time matches, and 8 near misses.
- The result was regenerated after tightening overlap decisions to use manifest capture windows rather than feature timestamp extrema.

Reassessment:

Orderflow remains a promising data rail, but the current blocker is collection coverage at the exact alert window and symbol. No new custom classifier work is warranted before that evidence exists.

No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed.
