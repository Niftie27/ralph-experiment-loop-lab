---
type: note
topic: x-reddit-strategy-inspiration-scan
created: 2026-08-30T06:14:00Z
last_updated: 2026-08-30T06:14:00Z
work_item: discovery.x-reddit-strategy-inspiration-scan
status: complete
scope: research-only
sources:
  - https://www.reddit.com/r/algotrading/
  - https://www.reddit.com/r/algotrading/comments/1um3mn2/where_did_i_go_wrong_a_failed_strategy_after_3/
  - https://www.reddit.com/r/algotrading/comments/1t4h8ms/backtesting_in_2026/
  - https://www.reddit.com/r/algotrading/comments/1qormef/genuinely_bashing_my_head_in/
  - https://www.reddit.com/r/algotrading/comments/1j9pxsr/backtest_results_for_the_opening_range_breakout/
  - https://github.com/dexlytrade/awesome-hyperliquid-copy-trading
  - https://github.com/HyperlouisehaKiml01947/Hyperliquid-Copy-Trades-Verifier
  - https://github.com/topics/hyperliquid-perp-dex
  - https://github.com/moondevonyt/Hyperliquid-Data-Layer-API/blob/main/README.md
  - https://x.com/kevaragent/status/2087967167387976166
tags:
  - ralph
  - research-note
  - source-scan
  - strategy-family
related:
  - 2026-08-29-community-idea-kill-test-template.md
  - 2026-08-30-copytrading-public-route-ledger.md
  - 2026-08-30-orderflow-replay-alignment-audit.md
---
# X / Reddit Strategy Inspiration Scan

## Purpose

This closes a bounded `discovery.x-reddit-strategy-inspiration-scan` pass.

The goal was to mine public social surfaces for falsifiable RALPH ideas, not to trust social posts as strategy evidence. X/Twitter search was especially noisy, so only items with a concrete data/code/source-backed falsifier were kept.

## Usable Themes

| Theme | Source shape | RALPH reuse | Cheapest falsifier | Decision |
| --- | --- | --- | --- | --- |
| Failed-strategy postmortems | Reddit algo-trading failures and infrastructure writeups | Add to the community kill-test template as a required postmortem lens | Before testing a new idea, require a written "how this fails" section plus data, costs, and baseline limits | watch/input-template |
| Paper-test duration and live ramp discipline | Reddit discussion on how long to forward-test before live | Reinforces RALPH forward-paper gates and Tomas approval boundaries | Require fixed sample/count thresholds before any live wording discussion | already-covered/watch |
| Robust backtesting data/source choice | Reddit backtesting platform/data threads | Reinforces source-quality and row-level parity work | Compare any claimed strategy against local candle/orderflow availability and fee/slippage assumptions | watch |
| Deep order-book realism | Reddit L2/order-book discussion plus hftbacktest-adjacent GitHub topic results | Supports orderflow replay and fill-realism branch, not a new signal | Reject orderflow ideas unless public capture has exact alert symbol/time overlap and enough depth fields | watch/needs-data |
| Opening-range breakout | Reddit ORB backtest post | Useful as a dumb baseline for range-breakout candidates | Test against existing alert-edge range buckets; reject if not better than timestamp-matched range baseline after costs | baseline-only |
| Hyperliquid copytrading verifier | Public GitHub/verifier and copytrading lists | Reinforces "verify before copy" lane | Run no-key `userFills`/`clearinghouseState` intake and one-hit/stale-account checks before any cohort spec | watch/source-falsifier |
| Hyperliquid data-layer products | Public GitHub/API/data-layer claims | Prior art for data availability and dashboard UX | Treat as source claim; verify endpoint access, freshness, exportability, and cost before adopting | watch/needs-access |

## Rejected Noise

Several X search results were generic, spammy, calendar-query artifacts, or product copy without inspectable evidence. They should not enter the RALPH backlog unless a future run finds a stable source URL, code/data artifact, and falsifier.

## Decision

`discovery.x-reddit-strategy-inspiration-scan` is done for this bounded pass.

No social idea becomes a strategy candidate from this scan. The durable output is a short list of falsification lenses:

- write the failure mode before the test;
- require forward-paper sample thresholds before live discussion;
- make data/source quality explicit;
- treat ORB/range breakout as a dumb baseline;
- verify copytrading claims with no-key fills/state before cohort work;
- reject orderflow claims without exact symbol/time feature overlap.

## Verify / Reassess

Verification:

- Public web search found Reddit, GitHub, X, and product/source pages available on 2026-08-30.
- Each retained theme has a concrete local falsifier or existing RALPH route.
- No dependency, account, key, paid API, scraping job, scheduler, watcher, alert wording, threshold, strategy candidate, risk/sizing, TP/SL, or execution change was made.

Reassessment:

Social scans are high-noise and should be used sparingly. Future social work should start from a narrow question and stop unless it produces a source-backed kill test.
