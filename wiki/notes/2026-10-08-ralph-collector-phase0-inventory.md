---
type: handoff-inventory
created: 2026-10-08T21:03:00Z
topic: ralph-collector-phase0
status: blocked_missing_zip
tags:
  - ralph
  - collector
  - binance-usdm
  - orderflow
  - phase0
  - read-only
---
# RALPH Collector Phase 0 Inventory

Source: Claude handoff relayed by Tomas on 2026-10-08. Scope approved for Phase 0 read-only inventory and, conditionally, collector/dashboard installation as read-only services. No RALPH watcher restart or alert behavior change is approved.

## Attachment Status

- Expected attachment: `ralph_collector_handoff.zip`.
- Search result: not found under `/home/coder`, `/home/coder/.openclaw`, `/home/coder/Downloads`, or `/tmp`.
- Current blocker for Phase 1: the handoff ZIP and `HANDOFF.md` are not present on this VPS.

## Server Inventory

Commands run:

- `uname -a`
- `cat /etc/os-release`
- `nproc`
- `lscpu`
- `free -h`
- `df -h / /home /home/coder/.openclaw/workspace`
- `python3 --version`
- `systemctl --version`
- `sudo -n true`
- `timedatectl`
- `curl https://ipinfo.io/json`

Findings:

- OS: Ubuntu 24.04.4 LTS, kernel `6.8.0-124-generic`.
- CPU: 2 cores, AMD EPYC-Genoa under KVM.
- RAM: 3.7 GiB total, about 1.3 GiB available at check time, no swap.
- Disk: 75 GiB root filesystem, 37 GiB available.
- Public IP: `91.98.161.109`, Hetzner, Nuremberg, Bavaria, Germany.
- Python: 3.12.3.
- systemd: available, version 255.
- Passwordless sudo: unavailable (`sudo -n true` exit 1).
- Time: UTC, system clock synchronized, NTP active.

## Binance Access

Commands run:

- `curl -s -o /dev/null -w "%{http_code}\n" https://fapi.binance.com/fapi/v1/ping`
- `curl -s -o /dev/null -w "%{http_code}\n" https://api.binance.com/api/v3/ping`

Results:

- Binance USD-M futures ping: `200`.
- Binance spot ping: `200`.

Gate status:

- Binance access gate passes.
- Disk gate passes.
- Phase 1 is blocked only by missing ZIP/HANDOFF contents, not by network or disk.

## Current RALPH Watcher

Service:

- User service: `crypto-updates-market-watcher.service`.
- Service file: `/home/coder/.config/systemd/user/crypto-updates-market-watcher.service`.
- Active since: 2026-09-24T05:49:39Z.
- Main process: `/usr/bin/node /home/coder/.openclaw/workspace/crypto-updates/realtime-market-watcher.mjs`.
- Standard output/error append to `crypto-updates/runtime/realtime-market-watcher.log`.

Exact current WebSocket URLs from code:

- Binance spot combined stream:
  - `wss://stream.binance.com:9443/stream?streams=btcusdt@trade/btcusdt@depth5@100ms/ethusdt@trade/ethusdt@depth5@100ms/solusdt@trade/solusdt@depth5@100ms`
- Hyperliquid public stream:
  - `wss://api.hyperliquid.xyz/ws`

Current RALPH Binance streams are spot, not USD-M futures.

Symbols:

- Binance spot: BTCUSDT, ETHUSDT, SOLUSDT.
- Hyperliquid: HYPE.

## Alert Thresholds

BTC:

- 5s wick: 0.30%
- 60s velocity: 0.60%
- 5m velocity: 1.00%
- 15m velocity: 1.25%
- cooldown: 30m per asset/direction

ETH:

- 5s wick: 0.42%
- 60s velocity: 0.65%
- 5m velocity: 0.90%
- 15m velocity: 1.20%
- cooldown: 30m per asset/direction

SOL:

- 5s wick: 0.45%
- 60s velocity: 0.90%
- 5m velocity: 1.20%
- 15m velocity: 1.65%
- cooldown: 30m per asset/direction

HYPE:

- 5s wick: 0.50%
- 60s velocity: 0.65%
- 5m velocity: 0.95%
- 15m velocity: 1.75%
- cooldown: 30m per asset/direction

## Trigger And Dedupe Rules

- For each incoming trade, the watcher compares current price against historical baselines for configured windows.
- If multiple thresholds are crossed, it selects the strongest absolute move.
- Direction is derived from price move sign: positive -> `UP`, negative -> `DOWN`.
- Cooldown key is `${asset}:${direction}`.
- Cooldown is 30 minutes.
- `alertInFlight` prevents duplicate concurrent sends for the same cooldown key.
- Evidence gate can suppress an alert before Telegram send.
- Suppressed candidates are written to `crypto-updates/runtime/alert-feedback.jsonl` as `alert_suppressed` when the suppress-log throttle allows it.

## Volume Velocity

Current computation:

- recent window: 5 seconds of notional volume
- baseline window: previous 5 minutes excluding the recent 5 seconds
- baseline is normalized to 5-second slots
- ratio: recent 5s notional / average prior 5s slot

Current behavior:

- `volumeVelocityRatio` is contextual metadata.
- It can affect evidence/TA context.
- It does not independently trigger an alert. Price movement threshold is required first.

This matches the handoff diagnosis that a futures volume-only/liquidation event can be missed.

## Logs And Data Files

Relevant files:

- `crypto-updates/runtime/realtime-market-watcher.log`
- `crypto-updates/runtime/alert-feedback.jsonl`
- `crypto-updates/runtime/paper-trades.jsonl`
- `crypto-updates/runtime/demo-sim-trades.jsonl`
- `crypto-updates/runtime/trade-research-journal.json`

Journalctl:

- `journalctl --user -u crypto-updates-market-watcher.service --since ...` returned no entries because the user service writes stdout/stderr directly to the runtime log file.

## 2026-10-08 14:45-17:35 UTC Window

Watcher status:

- Service active throughout the window according to systemd active-since and log entries.
- Log shows repeated Binance spot websocket closes/reconnects in the window, but it also reconnects and sends alerts.

Alerts found in `alert-feedback.jsonl` for the window:

1. 2026-10-08T15:18:55.187Z ETH DOWN VELOCITY 15m
   - move: -1.2012%
   - price: 2495.53
   - volume velocity: 54.64x
   - Telegram message id: 7865
   - TA: no trade, score 3, blockers included no nearby level, no breakout/fakeout, score below 4
2. 2026-10-08T15:22:27.459Z SOL DOWN VELOCITY 15m
   - move: -1.6676%
   - price: 110.27
   - volume velocity: ~0.0001x
   - Telegram message id: 7866
   - TA: no trade, score 0
3. 2026-10-08T15:38:05.564Z BTC DOWN WICK 5s
   - move: -0.3000%
   - price: 80973.01
   - volume velocity: 3.58x
   - Telegram message id: 7868
   - TA: no trade, score 2, blockers included no SFP/orderflow confirmation and score below 4
4. 2026-10-08T16:17:15.575Z ETH UP WICK 5s
   - move: +0.4206%
   - price: 2430.52
   - volume velocity: 12.99x
   - Telegram message id: 7869
   - TA: no trade, score 0
5. 2026-10-08T17:24:34.793Z SOL DOWN VELOCITY 5m
   - move: -1.2090%
   - price: 106.23
   - volume velocity: 0.86x
   - Telegram message id: 7870
   - TA: tradeAllowed true, score 6, strategy fakeout fade, direction LONG, no blockers, but SOL is event-only for DEMO-SIM/paper trade.

Suppressed candidates in this window:

- none found in `alert-feedback.jsonl`.

Paper/DEMO-SIM opens/closes in this window:

- none found.

## Other Running Processes

Observed running processes with market-data relevance:

- `crypto-updates/realtime-market-watcher.mjs`: Binance spot + Hyperliquid public websocket.
- `scripts/bybit-execution-reactor.mjs --loop`: Bybit read-only execution reactor.
- `scripts/btc-short-watch-82k.mjs`: Bybit public linear market REST polling for BTCUSDT.
- `scripts/zec-hype-short-watch.mjs`: Bybit public linear market REST polling for ZEC/HYPE.

Other scripts in the workspace connect to Binance when manually run, but were not observed as active processes during this inventory.

## Binance API Key Audit

Search scope used:

- workspace files under `/home/coder/.openclaw/workspace`
- patterns: `BINANCE_API_KEY`, `BINANCE_SECRET`, `BINANCE_API_SECRET`, `binance_api_key`, `binance_secret`
- excluded heavy/generated dependency and database paths where possible

Result:

- No Binance API key/secret file or explicit Binance key variable found in the workspace search.
- No Binance key value was printed.

Note:

- A broader initial search was stopped because it was traversing session transcripts and irrelevant caches. The focused workspace search returned no Binance key hits.

## Current Blockers

1. `ralph_collector_handoff.zip` is missing from the VPS.
2. `HANDOFF.md` has not been read because the ZIP is missing.
3. Passwordless sudo is unavailable. User-level systemd services are available, so collector/dashboard may still be installable as user services if the handoff supports that layout.

## Boundary Preserved

- No RALPH watcher restart.
- No RALPH alert wording, thresholds, Telegram delivery, or watcher behavior changed.
- No new Telegram alert added.
- No account/API key created.
- No trading/order/transfer/write action performed.
