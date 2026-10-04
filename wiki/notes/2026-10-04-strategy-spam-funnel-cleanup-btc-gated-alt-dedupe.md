---
type: research-note
created: 2026-10-04T08:30:00Z
topic: strategy-spam-funnel-cleanup-btc-gated-alt-dedupe
status: complete
work_item: validation.strategy-spam-funnel-cleanup-btc-gated-alt-dedupe
scope: research-only
tags:
  - ralph
  - research-only
  - validation
  - strategy-spam
  - btc-gate
  - no-live-trading
  - no-execution
related:
  - 2026-10-03-strategy-spam-funnel-btc-first-pass.md
  - ../../experiments/strategy-destruction-filter/results/strategy-spam-funnel-btc-first-pass.md
  - ../../experiments/strategy-destruction-filter/src/run-strategy-spam-funnel.mjs
  - ../../experiments/strategy-destruction-filter/src/engine.mjs
---
# Strategy Spam Funnel Cleanup: BTC-Gated Alts And Dedupe

## Purpose

Tomas approved continuing toward a recurring strategy-spam lane, but the safe next step was cleanup before any scheduler wiring.

This pass keeps the funnel research-only while adding:

- effective metric-shape dedupe so parameter clones do not fake breadth;
- a small rotating batch manifest;
- ETH/SOL alt spam only behind an explicit BTC regime gate.

## Implementation

Updated:

- `experiments/strategy-destruction-filter/src/run-strategy-spam-funnel.mjs`
- `experiments/strategy-destruction-filter/src/engine.mjs`
- `experiments/strategy-destruction-filter/src/verify-filter.mjs`
- `experiments/strategy-destruction-filter/results/strategy-spam-funnel-btc-first-pass.json`
- `experiments/strategy-destruction-filter/results/strategy-spam-funnel-btc-first-pass.md`

The engine now accepts an optional `signalGate` callback for research runners. Normal filter behavior is unchanged.

## Batch Manifest

Active in this run:

- `btc_basic_spam`
- `alt_btc_gated_continuation_fade`

Manifest-only, not run:

- `source_inspired_grid_dca_mm`
- `funding_basis_public`

## BTC Gate

Alt signals require BTC regime alignment:

- alt longs pass only when BTC is `BTC_RISK_ON`;
- alt shorts pass only when BTC is `BTC_RISK_OFF`;
- `BTC_TRANSITION` and `BTC_STALE` block alt spam signals.

Gate diagnostics showed zero stale BTC rows. Across ETH/SOL 1h/4h, the gate checked `164884` alt signals, passed `64036`, and blocked `100848`.

## Result

Verdict: `survivors_require_manual_review_before_candidate_import`.

- Candidate families: 7.
- Variants tested: 390.
- Survivors: 1.
- Rejected: 389.
- Near misses: 10.
- Effective metric shapes: 367.
- Duplicate metric shapes: 11.
- Duplicate variant rows: 23.

The survivor is `spam-alt-btc-gated-ma-reclaim-v0#57`:

- symbol/timeframe: SOL 4h;
- params: fast `20`, slow `50`, long RSI floor `45`, short RSI ceiling `50`;
- sample `262`;
- expectancy `0.1391R`;
- profit factor `1.2595`;
- OOS expectancy `0.1089R`;
- baseline lift `0.0357R`;
- max drawdown `15.2085R`;
- failures: none under the current research gate.

Important caution: this is not a strategy promotion. It is a spam-funnel survivor that requires manual review, survivor-specific stress, and fresh validation before any candidate import.

## Interpretation

The cleanup did what it should:

- duplicate shape grouping exposed metric clones instead of counting them as independent evidence;
- alt spam no longer violates RALPH's BTC-first regime gate;
- a single SOL 4h BTC-gated MA reclaim/reject shape survived the current strict gate, giving the next falsification target.

Next useful step before recurring wiring:

1. Run a survivor-specific stress pass for `spam-alt-btc-gated-ma-reclaim-v0#57`.
2. Check whether the edge is direction-specific, month/week clustered, symbol-transferable, and robust to stricter BTC transition blocking/costs.
3. Only then consider wiring the spam funnel as an owned mode inside the existing autoresearch loop.

## Boundary

No live trading, orders, keys, paid APIs, account setup, wallet connection, scheduler/cron change, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, candidate import, or strategy promotion changed.
