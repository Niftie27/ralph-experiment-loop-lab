# 2026-10-08 RALPH Collector Phase 1 Install

## Scope

Installed the provided read-only Binance USD-M BTCUSDT orderflow collector and localhost dashboard from:

`/home/coder/.openclaw/media/inbound/ralph_collector_handoff_4---58f53761-97a2-4d17-83bc-8c48f7b4631f.zip`

Boundaries preserved:

- Did not restart or modify `crypto-updates-market-watcher.service`.
- Did not change alert wording, thresholds, cooldowns, delivery, or watcher code.
- Did not use API keys.
- Did not trade or perform account writes.

## Installed Paths

- Collector source: `/home/coder/ralph_collector`
- Python environment: `/home/coder/venv-collector`
- Raw/orderflow data: `/home/coder/data/binance`
- Feature/live data: `/home/coder/data/features`
- User service: `/home/coder/.config/systemd/user/ralph-collector.service`
- User dashboard service: `/home/coder/.config/systemd/user/ralph-collector-dashboard.service`
- Staging extraction: `/home/coder/.openclaw/workspace/_staging/ralph_collector_handoff_20261008`

## Verification

Preflight:

```text
python3 --version -> Python 3.12.3
curl https://fapi.binance.com/fapi/v1/ping -> 200
timedatectl -> System clock synchronized: yes
ss :8050/:8051 -> no listeners before install
```

The upstream `setup_vps.sh` was inspected and not run as an installer because it needs passwordless sudo for system-level service install and otherwise only prints cron lines. A user-level systemd install was created instead.

Load test before service start:

```text
VYSLEDEK: PROSEL, sberac stiha i dvojnasobek spicky.
```

Two-minute acceptance:

```text
ralph-collector.service active (running)
ralph-collector-dashboard.service active (running)
crypto-updates-market-watcher.service active since 2026-09-24; same PID/command, not restarted
logs include: mezery 0, book ... urovni, spread 0.1, OI ... BTC
ports: 127.0.0.1:8051 collector WS, 127.0.0.1:8050 dashboard
live.json age: 1246 ms
collector: gaps 0, backfilled 0, book synced, resyncs 0
```

Initial output files:

```text
/home/coder/data/binance/raw_BTCUSDT_2026-10-08T21Z.jsonl.gz
/home/coder/data/binance/tape_BTCUSDT_2026-10-08T21Z.csv
/home/coder/data/binance/book_BTCUSDT_2026-10-08T21Z.jsonl.gz
/home/coder/data/features/live.json
/home/coder/data/features/live_bars_60s_2026-10-08.csv
/home/coder/data/features/live_events_2026-10-08.jsonl
/home/coder/data/features/live_footprint_60s_2026-10-08.jsonl.gz
```

## Open Items

- Ten-minute freshness/growth check passed at 2026-10-08T21:19:13Z:
  - `live.json` age: 1693 ms.
  - Collector: `gaps: 0`, `backfilled: 0`, book `synced`, `resyncs: 0`.
  - Data size: `/home/coder/data` 5.6M after roughly 10 minutes.
  - Dashboard HTTP check: `200 22517`.
  - Files grew from the two-minute snapshot; latest sizes included raw 5,185,081 bytes, tape 319,954 bytes, book 279,156 bytes.
- First full-hour batch replay check passed at 2026-10-09T03:10Z using the first complete post-start hour, `2026-10-08T22Z`:
  - Current health before replay:
    - `ralph-collector.service` active/running, PID `3562490`, active since `2026-10-08 21:09:19 UTC`.
    - `ralph-collector-dashboard.service` active/running, PID `3562491`, active since `2026-10-08 21:09:19 UTC`.
    - `crypto-updates-market-watcher.service` still active/running, PID `2876500`, active since `2026-09-24 05:49:39 UTC`; not restarted.
    - Dashboard HTTP check: `200 22517`.
    - `live.json` freshness: ~1.0s by `generated`, collector `gaps: 0`, `backfilled: 0`, delay ~142 ms, book `synced`, resyncs `1`, trades `186914`.
    - Recent logs still show `mezery 0`, `book ... urovni`, spread `0.1`, and `OI ... BTC`.
  - Available finalized files included `raw/book/tape_BTCUSDT_2026-10-08T22Z`; the 21Z file is partial because the collector started at 21:09 UTC.
  - Tape sorted check for `/home/coder/data/binance/tape_BTCUSDT_2026-10-08T22Z.csv`:
    - rows `25195`
    - duplicates `0`
    - sort violations `0`
    - first key `(1791496800081, 3479962402)`
    - last key `(1791500399750, 3479987596)`
  - Batch replay command:
    - `/home/coder/venv-collector/bin/python /home/coder/ralph_collector/orderflow_engine.py --data /home/coder/data/binance --out /tmp/feat_check_20261008T22Z --from 2026-10-08T22:00 --to 2026-10-08T23:00`
  - Batch replay output:
    - `Hotovo: 32 702 zprav od 2026-10-08T22:00:00Z do 2026-10-08T22:59:59Z`
    - bars `59`
    - absorption `3`
    - big_trade `16`
    - cluster `9`
    - liquidation `15`
    - stacked_imbalance `11`
    - velocity `17`
    - wall_added `22`
    - wall_filled `3`
    - wall_pulled `18`
  - Replay outputs:
    - `/tmp/feat_check_20261008T22Z/bars_60s.csv`
    - `/tmp/feat_check_20261008T22Z/events.jsonl`
    - `/tmp/feat_check_20261008T22Z/footprint_60s.jsonl.gz`
    - `/tmp/feat_check_20261008T22Z/sessions.csv`
    - `/tmp/feat_check_20261008T22Z/all_prices_2026-10-08_partial.csv`
- Phase 2 orderflow enrichment started after explicit `Continue` on 2026-10-09:
  - Changed `crypto-updates/realtime-market-watcher.mjs` only.
  - Added read-only `orderflowContext` loading from `/home/coder/data/features/live.json`.
  - Data contract used by the watcher: BTCUSDT `last_price`, `generated` freshness, 60s bar OHLC/volume/bought/sold/delta/velocity, session VWAP/POC/VAH/VAL/CVD, OI, 5m liquidation summary, and book best bid/ask/depth/imbalance. Present in current `live.json`; marked stale/unavailable if missing or older than 15s.
  - Added explicit BTC orderflow gate classification: `BTC_RISK_ON`, `BTC_RISK_OFF`, `BTC_TRANSITION`, or `BTC_STALE`.
  - Altcoin tradable plans are blocked when the selected trade side fights the BTC gate; BTC alerts record the gate but are not blocked by their own gate.
  - Alert feedback now stores `orderflowContext` and `ta.btcGate` for later analysis.
  - Telegram surface line for BTC orderflow is guarded behind `CRYPTO_UPDATES_ALERT_SURFACE_CHANGE_APPROVED=1` plus `CRYPTO_UPDATES_INCLUDE_ORDERFLOW_CONTEXT_LINE=1`; default current service env means no extra visible line until enabled.
  - Verification run: `node --check crypto-updates/realtime-market-watcher.mjs` passed.
  - Live context sample at 2026-10-09T05:29Z: `live.json` age ~1.7s, BTC last `82474.4`, velocity `0.4`, session VWAP `82108.5`, POC `82500`, VAH `82502`, VAL `81945`, CVD `2200.965`, bar delta `-4.908`, book imbalance `-0.106`.
  - Activated the watcher code with a single `systemctl --user restart crypto-updates-market-watcher.service` at 2026-10-09T05:31:59Z after confirming no fresh open paper/demo trade in the append-only logs.
  - Post-restart status: `crypto-updates-market-watcher.service` active/running, PID `3579975`, connected to Binance and Hyperliquid by 2026-10-09T05:32:00Z.
  - Collector and dashboard were not restarted; both remained active since `2026-10-08 21:09:19 UTC`.
  - Post-restart collector/dashboard verification: `live.json` age ~1.3s, BTC last `82489.7`, velocity `1.3`; dashboard HTTP `200 22517`.
  - Post-deploy smoke at 2026-10-09T05:35Z: watcher still active/running with `NRestarts=0`, collector/dashboard still active, `live.json` age under 1s, and no feedback records had been emitted after restart yet.
  - VM harness smoke exercised the new functions without opening sockets: current BTC orderflow parsed as available; synthetic stale context classified `BTC_STALE`; current live BTC was classified `BTC_TRANSITION` because price was near the profile edge, so both ETH long and ETH short gates returned `pass: false`.
- Phase 2 target-symbol collection extension on 2026-10-09:
  - Confirmed `binance_live.py` supports `--symbol`, while `orderflow_engine.py` globs generic `tape_*`, `book_*`, and `raw_*`; therefore each symbol needs isolated data/features directories to avoid mixed-symbol replay and `live.json` overwrite.
  - Smoke-tested ETHUSDT and SOLUSDT collectors under `/tmp/ralph_multi_smoke` for ~75s with separate data/features directories. Both produced `raw`, `book`, `tape`, `live.json`, bars, events, and footprint files. Both had `gaps: 0`, `backfilled: 0`, synced books, and no resyncs.
  - Installed and enabled user services:
    - `/home/coder/.config/systemd/user/ralph-collector-ethusdt.service`
    - `/home/coder/.config/systemd/user/ralph-collector-solusdt.service`
  - ETH service command: `binance_live.py --symbol ethusdt --all --out /home/coder/data/binance-ethusdt --features /home/coder/data/features-ethusdt --live-port 0`.
  - SOL service command: `binance_live.py --symbol solusdt --all --out /home/coder/data/binance-solusdt --features /home/coder/data/features-solusdt --live-port 0`.
  - Post-start validation after first closed 60s bar:
    - `ralph-collector-ethusdt.service` active/running, PID `3582586`, started `2026-10-09 05:48:34 UTC`, `NRestarts=0`.
    - `ralph-collector-solusdt.service` active/running, PID `3582587`, started `2026-10-09 05:48:34 UTC`, `NRestarts=0`.
    - ETH `live.json` fresh ~1.8s, trades `1899`, gaps `0`, backfilled `0`, delay ~138 ms, book synced, bars `4`.
    - SOL `live.json` fresh ~1.8s, trades `676`, gaps `0`, backfilled `0`, delay ~135 ms, book synced, bars `4`.
  - Updated `crypto-updates/realtime-market-watcher.mjs` to read ETH/SOL target orderflow contexts from `/home/coder/data/features-ethusdt/live.json` and `/home/coder/data/features-solusdt/live.json`.
  - BTC orderflow remains the explicit BTC gate; ETH/SOL contexts are now stored as `targetOrderflowContext` in alert feedback for analysis, without changing thresholds or adding visible Telegram lines.
  - Verification: `node --check crypto-updates/realtime-market-watcher.mjs` passed; VM harness parsed BTC/ETH/SOL contexts as available and HYPE as unavailable/no configured collector path.
  - Activated the watcher update with a single restart at 2026-10-09T05:52:29Z; `crypto-updates-market-watcher.service` active/running, PID `3583380`, `NRestarts=0`.
- Health check hardening on 2026-10-09:
  - Updated `crypto-updates/service-health-check.mjs` to monitor the new RALPH services and BTC/ETH/SOL `live.json` freshness.
  - New health gates include service active state, restart count, orderflow availability, stale context over 15s, collector gaps, and unsynced book state.
  - Verification: `node --check crypto-updates/service-health-check.mjs` passed.
  - Health run at 2026-10-09T05:57:40Z returned `notifyTomas: false`; all six watched services were active/running.
  - Orderflow health at that run: BTC age `727ms`, ETH age `715ms`, SOL age `827ms`; all had gaps `0`, backfilled `0`, and book `synced`.
- Replay verifier setup on 2026-10-09:
  - Added `crypto-updates/verify-ralph-orderflow-replay.mjs`, a reusable read-only verifier for BTC/ETH/SOL hourly collector output.
  - The verifier checks the input contract (`tape`, `raw`, `book` hourly files), tape row count, duplicate `(TradeTimeMs, AggId)` keys, sort violations, batch `orderflow_engine.py` replay, and output files.
  - Verification: `node --check crypto-updates/verify-ralph-orderflow-replay.mjs` passed.
  - Ran BTC `2026-10-09T05Z` replay after the 10-minute finalization grace:
    - rows `32422`
    - duplicates `0`
    - sort violations `0`
    - replay `ok`
    - engine processed `39 914` messages from `2026-10-09T05:00:00Z` to `2026-10-09T05:59:59Z`
    - outputs `5`: `bars_60s.csv`, `events.jsonl`, `footprint_60s.jsonl.gz`, `sessions.csv`, `all_prices_2026-10-09_partial.csv`
    - report: `crypto-updates/runtime/ralph-replay-checks/btc_2026-10-09T05Z.json`
  - Scheduled one-shot isolated verification job `3f85b619-ef03-4387-94a3-aa9eb1112c44` for `2026-10-09T07:12:00Z` to run first full ETH/SOL `2026-10-09T06Z` replay checks after finalization grace, update notes/memory, and send Tomas a concise Telegram summary.
- HYPE collection extension on 2026-10-09:
  - Verified Binance USD-M `HYPEUSDT` depth and open interest endpoints are available.
  - Smoke-tested `binance_live.py --symbol hypeusdt` for ~75s under `/tmp/ralph_hype_smoke`; it produced `raw`, `book`, `tape`, `live.json`, bars, events, and footprint files. Smoke result: book synced, gaps `0`, backfilled `0`, bars `1`.
  - Installed and enabled `/home/coder/.config/systemd/user/ralph-collector-hypeusdt.service`.
  - HYPE service command: `binance_live.py --symbol hypeusdt --all --out /home/coder/data/binance-hypeusdt --features /home/coder/data/features-hypeusdt --live-port 0`.
  - Post-start validation after first closed 60s bar: `ralph-collector-hypeusdt.service` active/running, PID `3587010`, started `2026-10-09 06:28:49 UTC`, `NRestarts=0`; `live.json` fresh under 1s, trades `154`, gaps `0`, backfilled `0`, delay ~138 ms, book synced, bars `2`.
  - Updated `crypto-updates/realtime-market-watcher.mjs` to read HYPE target orderflow context from `/home/coder/data/features-hypeusdt/live.json`; target context remains feedback-only with no threshold or visible alert-text change.
  - Updated `crypto-updates/service-health-check.mjs` to include `ralph-collector-hypeusdt.service` and HYPE `live.json` freshness/gaps/book sync.
  - Updated `crypto-updates/verify-ralph-orderflow-replay.mjs` to support `--symbol HYPE`.
  - Verification: all three scripts passed `node --check`; VM harness parsed BTC/ETH/SOL/HYPE contexts as available; health run returned `notifyTomas: false` with 7 services and 4 orderflow contexts.
  - Activated watcher update with a single restart at `2026-10-09T06:31:02Z`; `crypto-updates-market-watcher.service` active/running, PID `3587369`, `NRestarts=0`.
  - Scheduled one-shot isolated verification job `05b1dd31-2312-4e22-a309-b4a0560d247f` for `2026-10-09T08:12:00Z` to run first full HYPE `2026-10-09T07Z` replay check after finalization grace, update notes/memory, and send Tomas a concise Telegram summary.
  - First full-hour HYPE replay verification passed at `2026-10-09T08:12Z` for `2026-10-09T07Z`:
    - rows `11644`
    - duplicates `0`
    - sort violations `0`
    - replay `ok`
    - outputs `5`
    - report: `crypto-updates/runtime/ralph-replay-checks/hype_2026-10-09T07Z.json`
  - Post-replay service health passed: `ok: true`, `notifyTomas: true`, services `7`, OOM kills `0`, duplicate alert clusters `0`, orderflow contexts `4`; report `crypto-updates/runtime/service-health-report.json`.
