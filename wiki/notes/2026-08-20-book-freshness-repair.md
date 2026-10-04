---
type: research-note
date: 2026-08-20
tags:
  - ralph
  - orderflow
  - book-freshness
  - active-public-proxy
related:
  - 2026-08-13-orderflow-alert-alignment-check.md
  - 2026-08-11-orderflow-feature-taxonomy.md
sources:
  - ../../../crypto-updates/realtime-market-watcher.mjs
  - ../../../crypto-updates/orderflow-spike.mjs
  - ../../../crypto-updates/runtime/alert-feedback.jsonl
---

# Book Freshness Repair

Status: parser repair rolled after Tomas approval; live BTC/ETH/SOL watcher path has produced fresh post-roll book evidence. This is research support only, not financial advice or a trading signal.

## Work Item

Selected queue item: `validation.book-freshness-repair-for-orderflow-alert-gate`.

Question: why did 60 joined Crypto Updates alerts have `bookFresh=false` even though the watcher subscribes to Binance public depth?

Method: compared the live watcher parser with the working no-key orderflow spike parser and recent alert evidence records. No credentials, paid APIs, exchange accounts, live trading, alert wording, threshold changes, or user-visible alert-surface changes were used.

## Finding

The watcher already subscribes to Binance `depth5@100ms` for BTC, ETH, and SOL, but the live parser expected compact fields named `b` and `a`. Binance partial-depth stream messages in this path use `bids` and `asks`, and the working orderflow spike parser handles those names.

Effect: `handleDepth(...)` was not called for Binance partial-depth messages, so `bookState` stayed empty. At alert time, `evidenceGate(...)` therefore produced:

- `bookFresh=false`
- `bookAgeMs=null`
- `bookImbalance=null`
- `spreadPct=null`
- `top5DepthNotional=null`
- `depthChangePct=null`
- blocker: `fresh public depth unavailable`

This explains the all-60 fresh-depth miss in the 2026-08-20 alignment refresh.

## Repair

Updated `crypto-updates/realtime-market-watcher.mjs` to normalize Binance depth payloads before trade parsing:

- accepts `bids` / `asks`
- still accepts compact `b` / `a`
- derives the symbol from the combined-stream name when `s` is absent
- keeps alert text unchanged unless the already approval-gated evidence-line flag is explicitly enabled

Scope: BTC, ETH, and SOL Binance public depth. HYPE still has no fresh book state in the realtime watcher because the watcher currently consumes Hyperliquid `allMids` only, not `l2Book` or trades.

## Verification

Completed:

- `node --check crypto-updates/realtime-market-watcher.mjs`
- parser-shape smoke check for a representative `btcusdt@depth5@100ms` payload
- confirmed current running watcher PID exists
- confirmed a HYPE alert from `2026-08-20T22:05:08.105Z` is still awaiting its 1h review, so the daemon was not restarted during this pass
- `2026-08-20T22:49:17Z` no-key public capture using `orderflow-spike.mjs` for BTC/ETH/SOL over 12 seconds wrote `crypto-updates/runtime/orderflow-spikes/2026-08-20T22-49-17-670Z/manifest.yaml`
- capture count: 1,751 total records, including Binance `depth5` rows for BTCUSDT 58, ETHUSDT 58, SOLUSDT 29, plus Binance trade/bookTicker and Hyperliquid public l2/trade/mid rows
- book-shape statistic from the capture: Binance depth rows had finite bid/ask spreads for all three symbols, with average spread approximately BTC 0.000014%, ETH 0.000432%, SOL 0.011449%

Pending:

- rerun the orderflow alert alignment check once enough post-repair BTC/ETH/SOL alerts are finalized

## 2026-08-21 Live Roll Verification

Before restart, active 1h review windows were clear: `alert-feedback.jsonl` contained finalized records for `BTC-UP-1787296518640-6wsdr3` at `2026-08-21T08:16:28.858Z` and `ETH-DOWN-1787296830755-n5y2mj` at `2026-08-21T08:21:00.930Z`.

Restarted `crypto-updates-market-watcher.service` at `2026-08-21T08:25:36Z`. Systemd reported the service active/running with PID `1188639`; `runtime/realtime-market-watcher.pid` pointed to the same live `node /home/coder/.openclaw/workspace/crypto-updates/realtime-market-watcher.mjs` process. The watcher log showed both Binance and Hyperliquid reconnected after restart.

Post-roll verification completed on alert `ETH-UP-1787301604930-4fuxko`, recorded at `2026-08-21T08:40:23.220Z`: `bookFresh=true`, `bookAgeMs=-4606`, `bookImbalance=-34.470361264134695`, `spreadPct=0.0004151953182666541`, and `top5DepthNotional=72074.56`.

## 2026-08-21 Timestamp-Fix Follow-Up

Selected queue item: `validation.book-freshness-repair-for-orderflow-alert-gate`.

The first live roll proved that Binance book fields could populate, but the early post-roll samples exposed a timestamp-quality issue: several fresh BTC/ETH/SOL alerts had negative `bookAgeMs`, meaning the latest book timestamp was after the alert event timestamp. Those rows are useful operational evidence that book parsing works, but they should not be treated as clean edge-alignment evidence until the timestamp fix has post-roll BTC/ETH/SOL samples.

After the `2026-08-21T12:20:00Z` timestamp-fix restart, bounded local verification found:

- `crypto-updates-market-watcher.service` is active with PID `1194643`
- watcher log shows Binance and Hyperliquid reconnecting after restart
- one post-fix alert exists so far: `HYPE-UP-1787315983909-870dpd`
- post-fix BTC/ETH/SOL alerts: 0
- post-fix finalized BTC/ETH/SOL reviews: 0

Verify/Reassess: the depth parser repair is no longer blocked on public source access, and the timestamp fix appears rolled operationally. The current evidence still cannot promote C-036 because the clean post-fix BTC/ETH/SOL overlap sample is empty. Next useful step is to wait for finalized post-fix BTC/ETH/SOL alert/review rows, then rerun the alert-alignment table with book freshness, non-negative book age, spread, and imbalance grouped by asset/trigger family.

Follow-up at `2026-08-21T14:30:00Z`: post-restart BTC/ETH/SOL `alert_sent` rows now exist. Five post-12:20 rows were inspected. Four had clean fresh book evidence with non-negative age and populated public-depth fields: SOL-UP at 13:39 (`bookAgeMs=335`, `score=2/5`), ETH-UP at 13:39 (`bookAgeMs=1282`, `score=2/5`), BTC-DOWN at 13:58 (`bookAgeMs=2790`, `score=4/5`), and ETH-DOWN at 14:06 (`bookAgeMs=20`, `score=5/5`). The remaining BTC-UP at 13:39 was stale (`bookFresh=false`) but still had non-negative `bookAgeMs=21076` and `score=0/5`. No negative `bookAgeMs` and no `score > maxScore` violation appeared.

Verify/Reassess: the timestamp fix is verified on live BTC/ETH/SOL alert evidence. This is an evidence-quality repair only; C-036 remains `Candidate` until enough post-fix finalized alert/review rows support outcome analysis.

## 2026-08-20 Micro-Run Reassessment

The alternate public route confirms Binance partial-depth data is currently reachable without keys and still arrives with `bids`/`asks` rows, so the remaining blocker is operational verification in the live watcher path, not source access.

The watcher process was intentionally not restarted in this cron pass. Applying the parser fix to the live daemon could change evidence fields attached to Telegram alerts, and the standing rule requires approval before changing the user-visible crypto alert surface. Next safe research step is either an explicitly approved watcher roll or a non-user-visible shadow watcher/capture that exercises the same parser without sending alerts.

## 2026-08-21 Feature Extraction Check

Selected queue item: `validation.book-freshness-repair-for-orderflow-alert-gate`.

Ran the existing compact feature extractor on the `2026-08-20T22-49-17-670Z` no-key public capture:

- command: `ORDERFLOW_RUN_ID=2026-08-20T22-49-17-670Z node crypto-updates/orderflow-features.mjs`
- feature manifest: `../../../crypto-updates/runtime/orderflow-spikes/2026-08-20T22-49-17-670Z/features-manifest.yaml`
- output SQLite: `../../../crypto-updates/runtime/orderflow-spikes/2026-08-20T22-49-17-670Z/features.sqlite`
- output CSV: `../../../crypto-updates/runtime/orderflow-spikes/2026-08-20T22-49-17-670Z/features-1s.csv`

Feature-shape statistics:

- 112 total 1-second feature rows
- 561 total trades represented in buckets
- 1,184 total book updates represented in buckets
- Binance rows: BTCUSDT 12, ETHUSDT 11, SOLUSDT 12
- Hyperliquid rows: BTC 24, ETH 24, SOL 29
- Binance feature rows had finite average spread and L1 imbalance for BTCUSDT, ETHUSDT, and SOLUSDT

Verify/Reassess: the public capture is usable for compact feature-shape validation and confirms the repaired Binance depth shape can flow into 1-second features. It still does not overlap a finalized alert/review sample, so it is not edge evidence and does not justify promotion. The next useful research-only path is a non-user-visible shadow watcher/capture that produces the same evidence fields around real alert windows, or an approved live watcher roll.

## Verdict

The no-key blocker was not public data availability for Binance. It was a watcher parser mismatch.

C-036 stays `Candidate`; U-038 stays `Open` until enough post-repair BTC/ETH/SOL alert samples are finalized and price-plus-orderflow beats the price-only baseline by asset/trigger family.

No live behavior, alert wording, risk, sizing, execution, account, key, or paid-data change was made.

## 2026-08-28 Freshness Regression Closeout

Selected queue item: `validation.book-freshness-repair-for-orderflow-alert-gate`.

Ran a bounded local JSONL join over `../../../crypto-updates/runtime/alert-feedback.jsonl` after the `2026-08-21T12:20:00Z` timestamp-fix restart. This reused existing monitor artifacts only; it did not trigger cron, restart the watcher, alter alert wording, alter watcher behavior, change thresholds, touch risk/sizing, place orders, use keys, set up accounts, install packages, or call paid APIs.

Post-fix joined BTC/ETH/SOL review rows: `73`, covering alerts from `2026-08-21T13:39:13.744Z` through `2026-08-28T11:03:14.158Z`.

Book freshness quality:

| Check | Count |
| --- | ---: |
| clean fresh rows with populated age/imbalance/spread/depth | 63 |
| stale but non-negative book age | 10 |
| missing/unavailable book age | 0 |
| negative `bookAgeMs` | 0 |
| `score > maxScore` | 0 |

Asset coverage:

| Asset | Joined rows | Fresh | Stale non-negative | Unavailable | Negative age |
| --- | ---: | ---: | ---: | ---: | ---: |
| BTC | 9 | 6 | 3 | 0 | 0 |
| ETH | 22 | 18 | 4 | 0 | 0 |
| SOL | 42 | 39 | 3 | 0 | 0 |

Fresh-book age distribution: min `6ms`, p50 `350ms`, p90 `1356ms`, max `3640ms`.

Fresh-book verdict mix remains mixed: `36` fade-useful, `23` follow-useful, `4` noisy. The repair is therefore evidence-quality complete, not an edge promotion.

Verify/Reassess: the original parser mismatch and follow-up timestamp regression are both closed for BTC/ETH/SOL alert evidence. `validation.book-freshness-repair-for-orderflow-alert-gate` can move to done. C-036 stays `Candidate`; U-038 stays `Open`; the next useful RALPH item should be a separate bounded validation such as `validation.no-key-first-experiment-selection`, `validation.ta-learning-loop-call-candidate-forward-check`, or a strict kill-test seed spec for the low-sample SOL clean-book wick bucket.
