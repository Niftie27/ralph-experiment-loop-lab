---
type: research-note
date: 2026-09-08
tags:
  - ralph
  - autoresearch
  - filip-feedback
  - post-entry-monitor
  - orderflow
  - github
  - reddit
status: t1-prior-art-scan
work_item: investigation.filip-pdv-pdn-cluster-strategy-development
related:
  - 2026-09-08-planned-level-orderflow-decision-protocol.md
  - 2026-09-08-level-breakout-acceptance-baseline.md
  - 2026-09-08-filip-pdv-pdn-cluster-strategy-development-lane.md
  - 2026-08-27-operator-profile-community-autoresearch-lane.md
  - 2026-08-22-x-github-strategy-knowledge-scan.md
sources:
  - https://atas.net/blog/cluster-search-indicator/
  - https://github.com/AtasPlatform/Indicators
  - https://github.com/Eipix/CVD-Divergence
  - https://github.com/nkaz001/hftbacktest
  - https://hftbacktest.readthedocs.io/en/latest/tutorials/Market%20Making%20with%20Alpha%20-%20Order%20Book%20Imbalance.html
  - https://github.com/tapedelta/kline-orderbook-chart
  - https://github.com/topics/order-flow
  - https://bybit-exchange.github.io/docs/v5/market/recent-trade
  - https://bybit-exchange.github.io/docs/v5/market/orderbook
  - https://developers.binance.com/
  - https://www.reddit.com/r/algotrading/comments/1pgsphr/algo_only_based_on_orderbook_imbalance_could_it/
  - https://www.reddit.com/r/algotrading/comments/cfwtpe/order_flow_and_algorithmic_trading/
  - https://www.reddit.com/r/options/comments/1o0tmvm/to_those_who_exploit_order_flow_imbalances_to/
  - https://arxiv.org/abs/2602.00776
---

# Planned-Level Post-Entry Autoresearch Scan

## Question

Tomas asked to apply the RALPH autoresearch lane and dig GitHub, Twitter/X, Reddit, and other public sources for the Filip pdV/pdN plus Cluster Search planned-level strategy. The focus is the new requirement: after a planned-level execution alert, the system must immediately monitor the small-timeframe reaction and decide hold, warn, tighten, reduce, fast-kill, or thesis invalidated.

## Verdict

Best next direction is not "copy an orderflow strategy." The useful prior art says to make `POST_ENTRY_MONITOR` a replayable microstructure classification problem:

- level was preplanned;
- entry/fill timestamp is frozen;
- first `1-5` execution candles are scored with trade-side flow, CVD/delta proxy, shallow book imbalance, spread/volatility shock, and BTC gate;
- outcome is measured as MFE/MAE plus whether early kill saved risk or killed a later winner.

This raises confidence in the v1 protocol shape, but it does not promote the strategy to paper/live alerts. It creates a T1 prior-art basis for a bounded no-key replay/feature adapter.

## Source Findings

### ATAS Cluster Search Semantics

ATAS describes Cluster Search as a flexible indicator for finding large clusters and absorption around intraday levels. Its example uses positive delta predominance over joined price levels as market buys absorbed by limit sellers, and negative delta predominance as market sells absorbed by limit buyers. It also says traders mark the level after clusters appear and then wait for price reaction, where price may break the level or bounce.

RALPH translation:

- the cluster print is a level/context marker, not final entry proof;
- post-entry/reaction behavior is part of the method, not optional discretion;
- thresholds must be instrument-specific and volatility-adjusted, so fixed ATAS values cannot be copied directly to BTC/crypto.

Access classification: `needs-external-export` for actual ATAS labels. Filip/Tomas can provide screenshots or exports. Public proxy remains active only through local trade/book data.

### GitHub Prior Art

`nkaz001/hftbacktest` is the strongest replay/fill-realism reference found in this pass. It is public, MIT-licensed, mature by repo metadata, and explicitly supports tick-by-tick simulation, L2/L3 book reconstruction, feed/order latency, and queue-position fill modeling, with Binance and Bybit examples.

RALPH reuse path:

- do not install/adopt as a dependency yet;
- use it as the benchmark shape for any post-entry replay adapter;
- if later approved, test whether RALPH public Binance/Bybit captures can be converted into hftbacktest-compatible data.

`AtasPlatform/Indicators` is useful as an ATAS custom-indicator reference, but it requires ATAS plus Windows/.NET tooling and does not give this workspace automatic Cluster Search labels. `Eipix/CVD-Divergence` is a small MIT C# ATAS indicator with a CVD divergence concept, useful as a field-definition reference but not mature enough to drive strategy decisions.

`tapedelta/kline-orderbook-chart` and the GitHub `order-flow` topic show that public crypto tooling exists for orderbook heatmaps, footprint charts, CVD/delta visualization, and Binance/Bybit live demos. These are UI/visualization references, not evidence that a trade edge exists.

Access classification:

- GitHub repos: `verified-public/read-only`.
- `hftbacktest`: `watch/benchmark-candidate`; not installed locally in this workspace.
- ATAS indicator repos: `watch/reference`; require external platform/tooling.
- Visualization repos: `watch/ui-reference`; not evidence, do not install by default.

### Public No-Key Data Rail

Live no-key checks from this workspace succeeded on 2026-09-08:

- Bybit public recent linear BTCUSDT trade returned price, size, taker side, ms timestamp, and sequence.
- Bybit public linear BTCUSDT orderbook returned bid/ask, timestamp, update id, sequence, and matching-engine timestamp.
- Binance futures public BTCUSDT trades returned price, quantity, time, buyer-maker side, and RPI flag.
- Binance futures public BTCUSDT depth returned top bid/ask levels and exchange timestamps.

RALPH implication:

- current workspace can compute a public proxy for trade-side CVD/delta, spread, shallow orderbook imbalance, and fail-back/reclaim timing without keys;
- actual historical depth coverage is still the main risk, especially for replaying old level events;
- this is enough for a small live/paper data capture or bounded historical trade-window replay, but not for claiming realtime management.

### Reddit / Community Scan

Reddit results are useful mostly as failure-mode reminders. Recent and older threads consistently frame orderflow/OBI/OFI as noisy, latency-sensitive, fee-sensitive, and hard to validate. Some practitioners argue that orderflow can be useful on broader timeframes, while skeptical comments warn that retail footprint/absorption language can become vendor-style narrative unless reduced to measurable features.

RALPH translation:

- do not let "absorption" remain a discretionary label;
- every cluster/absorption claim needs measurable fields: aggressive volume, price progress per aggressive volume, fail-back/reclaim timing, CVD divergence, spread shock, and retest outcome;
- validate against dumb baselines and costs before any alert promotion.

### Twitter/X Scan

Public web search found X/Twitter posts and profiles discussing BTC footprint, CVD, absorption, VWAP, and breakout validity, but no source-grade thread with reproducible code/data in this quick pass. Prior RALPH access notes still apply: X API access is not active in this workspace and systematic X monitoring remains `watch/needs-access`.

Use X/Twitter here only as a weak idea source unless a public post links to reproducible data, code, or a clear chart with timestamped levels.

### Paper / Academic Support

The 2026 crypto microstructure paper claims cross-asset feature importance stability over Binance Futures order books/trades and emphasizes order flow imbalance, spread, and adverse selection. This supports using microstructure features as generic short-horizon inputs, not a direct planned-level edge.

## Candidate: Post-Entry Microstructure Replay Adapter

- **Status:** Watch / T1 prior-art-supported.
- **Claim:** Post-entry outcomes around planned levels can be classified better than candle-only baseline by adding public trade/book features in the first `1-5` execution candles.
- **Mechanism:** Acceptance should show favorable progress, aligned CVD/delta, no immediate opposing absorption, and stable/recovering spread; fakeout should show fail-back/reclaim against the trade, flow contradiction, absorption against the trade, or BTC regime override.
- **Reuse path:** Use existing RALPH candle baseline plus public Binance/Bybit trade/book data; benchmark the replay design against hftbacktest concepts before custom fill simulation.
- **Dumb baseline:** Same entry timestamp plus candle-only hold/kill after fixed `1`, `3`, `5`, and `15` candles.
- **Cheapest kill test:** For a small set of historical or forward paper planned-level events, compute post-entry features and compare fast-kill/hold rules against candle-only outcomes.
- **Kill criteria:** no baseline lift, too many false-killed winners, insufficient data freshness/coverage, unstable thresholds by symbol/regime, or outcomes dominated by BTC regime rather than target orderflow.

## Proposed Feature Fields

- `entry_ts_utc`
- `level_id`, `level_price`, `level_timeframe`
- `setup_type`: `continuation_long`, `fade_short`, `continuation_short`, `fade_long`
- `btc_gate_entry`, `btc_gate_monitor`
- `price_progress_1c_3c_5c_15c`
- `fail_back_or_reclaim_ts`
- `retest_result`
- `trade_side_delta_1m`, `cvd_slope`
- `aggressive_volume_at_level`
- `price_progress_per_aggressive_volume`
- `opposing_absorption_candidate`
- `book_imbalance_near_level`
- `spread_shock`
- `mfe_1c_3c_5c_15c`, `mae_1c_3c_5c_15c`
- `fast_kill_label`
- `fast_kill_would_save_risk`
- `fast_kill_would_false_kill_winner`

## Next Micro-Action

Extend the existing candle-only level-breakout study with a paper schema and one no-key adapter that fetches bounded Binance/Bybit trade windows around frozen planned-level events. Do not install hftbacktest yet. First prove that the local event rows, timestamps, and public trade windows line up well enough to compute useful post-entry labels.

## Verify / Reassess

Confidence went up that `POST_ENTRY_MONITOR` is the right system boundary because ATAS itself frames Cluster Search as requiring later price reaction, and GitHub/research prior art points to trade/book replay rather than candle-only inference. Confidence remains low that this is a trade edge until RALPH measures baseline lift with realistic costs and false-kill rates.

Self-check: used public/free sources only; no credentials; no account/key/API/scheduler/paid-service changes; no live trading; no order placement; no watcher or live alert behavior changed; X/Twitter treated as weak/manual due unverified API access; GitHub/Reddit claims treated as inspiration and prior art only.
