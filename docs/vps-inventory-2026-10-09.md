# VPS Inventory - 2026-10-09

Date: 2026-10-09
Scope: read-only inventory. No service stop/restart, no edits, no trading, no keys, no deletions.

## Commands Run

```bash
systemctl --user list-units --all --no-pager
systemctl --user list-timers --all --no-pager
crontab -l
ps -eo pid,ppid,lstart,cmd
systemctl --user cat ...
systemctl --user show crypto-updates-market-watcher.service -p MainPID -p ExecStart -p Environment -p FragmentPath -p ActiveState -p SubState
tr '\0' '\n' < /proc/<pid>/environ
sha256sum ...
```

Secrets policy for this report: variable names are reported; key/token/secret values are not printed.

## User Systemd Units

Relevant user units from `systemctl --user list-units --all`:

| unit | state | description |
| --- | --- | --- |
| `bybit-execution-reactor.service` | loaded active running | Bybit read-only execution reactor for Tomas |
| `crypto-updates-market-watcher.service` | loaded active running | Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher |
| `openclaw-gateway.service` | loaded active running | OpenClaw Gateway (v2026.6.6) |
| `openclaw-node.service` | loaded active running | OpenClaw Node Host (v2026.6.6) |
| `ralph-collector-dashboard.service` | loaded active running | RALPH orderflow dashboard (localhost only) |
| `ralph-collector.service` | loaded active running | Binance BTCUSDT orderflow collector for RALPH |
| `ralph-collector-ethusdt.service` | loaded active running | Binance ETHUSDT orderflow collector for RALPH |
| `ralph-collector-hypeusdt.service` | loaded active running | Binance HYPEUSDT orderflow collector for RALPH |
| `ralph-collector-solusdt.service` | loaded active running | Binance SOLUSDT orderflow collector for RALPH |
| `gpg-agent.service` | loaded active running | GnuPG agent |
| `dbus.service` | loaded active running | D-Bus user bus |

Enabled unit files relevant to this inventory:

```text
bybit-execution-reactor.service                  enabled   enabled
crypto-updates-market-watcher.service            enabled   enabled
openclaw-gateway.service                         enabled   enabled
openclaw-node.service                            enabled   enabled
ralph-collector-dashboard.service                enabled   enabled
ralph-collector-ethusdt.service                  enabled   enabled
ralph-collector-hypeusdt.service                 enabled   enabled
ralph-collector-solusdt.service                  enabled   enabled
ralph-collector.service                          enabled   enabled
launchpadlib-cache-clean.timer                   enabled   enabled
systemd-tmpfiles-clean.timer                     disabled  enabled
```

Timers:

```text
NEXT                            LEFT LAST                         PASSED UNIT                           ACTIVATES
Fri 2026-10-09 17:55:35 UTC 3h 23min Thu 2026-10-08 17:55:35 UTC 20h ago launchpadlib-cache-clean.timer launchpadlib-cache-clean.service

1 timers listed.
```

Crontab:

```text
# OPENCLAW-SHORT-WATCHERS-BEGIN
@reboot /home/coder/.openclaw/workspace/scripts/ensure-short-watchers.sh >> /home/coder/.openclaw/workspace/.tmp/short-watchers-supervisor.log 2>&1
* * * * * /home/coder/.openclaw/workspace/scripts/ensure-short-watchers.sh >> /home/coder/.openclaw/workspace/.tmp/short-watchers-supervisor.log 2>&1
# OPENCLAW-SHORT-WATCHERS-END
```

## Running Node/Python Processes

| pid | starts | command | how it starts | exchange / venue | symbols | data URLs | Telegram | writes | behavior env |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 819 | system process | `/usr/bin/python3 /usr/share/unattended-upgrades/unattended-upgrade-shutdown --wait-for-signal` | system package process | n/a | n/a | n/a | no | n/a | standard user env only |
| 1627849 | `Sat Aug 29 09:09:50 2026` | `/usr/bin/node /home/coder/.openclaw/workspace/scripts/bybit-execution-reactor.mjs --loop` | `bybit-execution-reactor.service` | Bybit linear private/read-only execution audit | any symbols returned by `/v5/execution/list`; observed messages include BTCUSDT | `https://api.bybit.com/v5/execution/list`, `/v5/position/closed-pnl` | yes, `telegram:1539856256` | `crypto-updates/runtime/bybit-execution-reactor.log`, `bybit-execution-reactor-state.json`, `execution-feedback.jsonl`, trading journal index outputs | unit env: `OPENCLAW_BIN=/home/coder/.npm-global/bin/openclaw`, `BYBIT_REACTOR_CHANNEL=telegram`, `BYBIT_REACTOR_TELEGRAM_TARGET=telegram:1539856256`, `BYBIT_REACTOR_INTERVAL_MS=30000`; code defaults also include credential path name `BYBIT_READONLY_CREDENTIAL_PATH` but value not printed |
| 2662307 | `Sat Sep 19 08:23:01 2026` | `node /home/coder/.openclaw/workspace/scripts/zec-hype-short-watch.mjs` | cron-supervised detached process from `ensure-short-watchers.sh` | Bybit linear public market data | BTCUSDT gate, ZECUSDT, HYPEUSDT | `https://api.bybit.com/v5/market/tickers`, `/v5/market/kline`, `/v5/market/recent-trade` | yes, default `telegram:1539856256` | `.tmp/zec-hype-short-watch.log`, `.tmp/zec-hype-short-watch.pid` | running env: `ALT_SHORT_WATCH_CHECK_MS=30000`; defaults: `ALT_SHORT_WATCH_TELEGRAM_TARGET=telegram:1539856256`, `ALT_SHORT_WATCH_FETCH_TIMEOUT_MS=12000`, `ALT_SHORT_WATCH_FETCH_RETRIES=2` |
| 2673420 | `Sat Sep 19 17:24:27 2026` | `openclaw-node` | `openclaw-node.service` | n/a | n/a | local OpenClaw node host | can broker messages but not market-specific | OpenClaw runtime logs/state | service env includes `OPENCLAW_SERVICE_KIND=node`, `OPENCLAW_SERVICE_VERSION=2026.6.6`, local PATH/HOME |
| 2673555 | `Sat Sep 19 17:28:01 2026` | `node /home/coder/.openclaw/workspace/scripts/btc-short-watch-82k.mjs` | cron-supervised detached process from `ensure-short-watchers.sh` | Bybit linear public market data | BTCUSDT | `https://api.bybit.com/v5/market/tickers`, `/v5/market/kline`, `/v5/market/recent-trade` | yes, default `telegram:1539856256` | `.tmp/btc-short-watch-82k.log`, `.tmp/btc-short-watch-82k.pid` | running env: `BTC_SHORT_WATCH_CHECK_MS=30000`, `BTC_SHORT_WATCH_EXPIRES_AT=0`; defaults: `BTC_SHORT_WATCH_TELEGRAM_TARGET=telegram:1539856256` |
| 3562491 | `Thu Oct 8 21:09:18 2026` | `/home/coder/venv-collector/bin/python /home/coder/ralph_collector/dashboard.py --data /home/coder/data/binance --features /home/coder/data/features --port 8050` | `ralph-collector-dashboard.service` | local dashboard over collector output | BTCUSDT view | serves local `/live.json` from features dir | no | no market data writes observed; serves dashboard | standard user env only |
| 3590354 | `Fri Oct 9 06:40:29 2026` | `/usr/bin/node /home/coder/.openclaw/workspace/crypto-updates/realtime-market-watcher.mjs` | `crypto-updates-market-watcher.service` | Binance spot websocket plus Hyperliquid public websocket | BTCUSDT, ETHUSDT, SOLUSDT, HYPE | `wss://stream.binance.com:9443/stream?...btcusdt@trade...ethusdt@trade...solusdt@trade...`, `wss://api.hyperliquid.xyz/ws`; TA candle fetches in code use public exchange candle endpoints | yes, `telegram:1539856256` | `crypto-updates/runtime/realtime-market-watcher.log`, `alert-feedback.jsonl`, `paper-trades.jsonl`, `demo-sim-trades.jsonl`, monitor/trade journal indexes | see detailed v1 env section below |
| 3664620 | `Fri Oct 9 08:39:07 2026` | `/usr/bin/node /home/coder/.npm-global/lib/node_modules/openclaw/dist/index.js gateway --port 18789` | `openclaw-gateway.service` | n/a | n/a | local gateway | routes messages | OpenClaw runtime logs/state | service env includes `OPENCLAW_GATEWAY_PORT=18789`, `OPENCLAW_SERVICE_KIND=gateway`, `OPENCLAW_SERVICE_VERSION=2026.6.6` |
| 3664635 | `Fri Oct 9 08:39:23 2026` | `node .../codex app-server --listen stdio://` | child of OpenClaw gateway/session | n/a | n/a | local stdio | no direct market messages | session runtime | inherited OpenClaw/session env; secrets not printed |
| 3664642 | `Fri Oct 9 08:39:23 2026` | `/home/coder/.../codex app-server --listen stdio://` | child of OpenClaw gateway/session | n/a | n/a | local stdio | no direct market messages | session runtime | inherited OpenClaw/session env; secrets not printed |
| 3691838 | `Fri Oct 9 14:03:25 2026` | `node .../mcp-server-filesystem /home/coder/.openclaw/workspace/ralph-research-os /home/coder/.openclaw/wiki/main` | child of current tooling/session | n/a | n/a | local filesystem MCP | no | no market files; filesystem MCP access | inherited session env; secrets not printed |
| 3693396 | `Fri Oct 9 14:09:00 2026` | `/home/coder/venv-collector/bin/python /home/coder/ralph_collector/binance_live.py --symbol solusdt --all --out /home/coder/data/binance-solusdt --features /home/coder/data/features-solusdt --live-port 0` | `ralph-collector-solusdt.service` | Binance USD-M futures | SOLUSDT | `wss://fstream.binance.com`; `https://fapi.binance.com/fapi/v1/aggTrades`, `/depth`, `/openInterest` | no | `/home/coder/data/binance-solusdt/{raw,tape,book}_SOLUSDT_*`, `/home/coder/data/features-solusdt/live.json` and engine outputs | standard user env only; behavior from CLI args |
| 3693400 | `Fri Oct 9 14:09:01 2026` | `/home/coder/venv-collector/bin/python /home/coder/ralph_collector/binance_live.py --symbol hypeusdt --all --out /home/coder/data/binance-hypeusdt --features /home/coder/data/features-hypeusdt --live-port 0` | `ralph-collector-hypeusdt.service` | Binance USD-M futures | HYPEUSDT | same Binance futures websocket/REST set | no | `/home/coder/data/binance-hypeusdt/{raw,tape,book}_HYPEUSDT_*`, `/home/coder/data/features-hypeusdt/live.json` and engine outputs | standard user env only; behavior from CLI args |
| 3693403 | `Fri Oct 9 14:09:01 2026` | `/home/coder/venv-collector/bin/python /home/coder/ralph_collector/binance_live.py --symbol ethusdt --all --out /home/coder/data/binance-ethusdt --features /home/coder/data/features-ethusdt --live-port 0` | `ralph-collector-ethusdt.service` | Binance USD-M futures | ETHUSDT | same Binance futures websocket/REST set | no | `/home/coder/data/binance-ethusdt/{raw,tape,book}_ETHUSDT_*`, `/home/coder/data/features-ethusdt/live.json` and engine outputs | standard user env only; behavior from CLI args |
| 3693414 | `Fri Oct 9 14:09:01 2026` | `/home/coder/venv-collector/bin/python /home/coder/ralph_collector/binance_live.py --all --out /home/coder/data/binance --features /home/coder/data/features --live-port 8051` | `ralph-collector.service` | Binance USD-M futures | BTCUSDT default | same Binance futures websocket/REST set | no | `/home/coder/data/binance/{raw,tape,book}_BTCUSDT_*`, `/home/coder/data/features/live.json` and engine outputs; live dashboard port `8051` | standard user env only; behavior from CLI args |
| 3696541 | `Fri Oct 9 14:26:51 2026` | `node .../mcp-server-filesystem /home/coder/.openclaw/workspace/ralph-research-os /home/coder/.openclaw/wiki/main` | child of current tooling/session | n/a | n/a | local filesystem MCP | no | no market files; filesystem MCP access | inherited session env; secrets not printed |

## v1 Watcher Actual Environment And Hash

`systemctl --user show crypto-updates-market-watcher.service`:

```text
MainPID=3590354
ExecStart={ path=/usr/bin/node ; argv[]=/usr/bin/node /home/coder/.openclaw/workspace/crypto-updates/realtime-market-watcher.mjs ; ignore_errors=no ; start_time=[Fri 2026-10-09 06:40:29 UTC] ; stop_time=[n/a] ; pid=3590354 ; code=(null) ; status=0/0 }
Environment=CRYPTO_UPDATES_CHANNEL=telegram CRYPTO_UPDATES_TELEGRAM_TARGET=telegram:1539856256 CRYPTO_UPDATES_OPENCLAW_BIN=/home/coder/.npm-global/bin/openclaw
ActiveState=active
SubState=running
FragmentPath=/home/coder/.config/systemd/user/crypto-updates-market-watcher.service
```

Actual running process environment matching behavior variables:

```text
CRYPTO_UPDATES_CHANNEL=telegram
CRYPTO_UPDATES_OPENCLAW_BIN=/home/coder/.npm-global/bin/openclaw
CRYPTO_UPDATES_TELEGRAM_TARGET=telegram:1539856256
```

The specifically requested behavior variables are not present in the running process environment, so the code defaults apply:

| setting | running env value | effective value from code |
| --- | --- | --- |
| `CRYPTO_UPDATES_ORDERFLOW_CONTEXT_ENABLED` | absent | enabled (`!== "0"`) |
| `CRYPTO_UPDATES_ORDERFLOW_CONTEXT_FILE` | absent | `/home/coder/data/features/live.json` |
| `CRYPTO_UPDATES_ETH_ORDERFLOW_CONTEXT_FILE` | absent | `/home/coder/data/features-ethusdt/live.json` |
| `CRYPTO_UPDATES_SOL_ORDERFLOW_CONTEXT_FILE` | absent | `/home/coder/data/features-solusdt/live.json` |
| `CRYPTO_UPDATES_HYPE_ORDERFLOW_CONTEXT_FILE` | absent | `/home/coder/data/features-hypeusdt/live.json` |
| `CRYPTO_UPDATES_ORDERFLOW_CONTEXT_MAX_AGE_MS` | absent | `15000` |
| `CRYPTO_UPDATES_ENFORCE_BTC_GATE_FOR_ALT_PLANS` | absent | `false` |
| `CRYPTO_UPDATES_PAPER_TRADING_ENABLED` | absent | `true` |
| `CRYPTO_UPDATES_PAPER_TRADING_FILE` | absent | `/home/coder/.openclaw/workspace/crypto-updates/runtime/paper-trades.jsonl` |
| `CRYPTO_UPDATES_PAPER_MAX_OPEN_TRADES` | absent | `1` |
| `CRYPTO_UPDATES_PAPER_FEE_BPS_PER_SIDE` | absent | `5.5` |
| `CRYPTO_UPDATES_PAPER_SEND_MESSAGES` | absent | `true` |
| `CRYPTO_UPDATES_DEMO_SIM_ENABLED` | absent | `true` |
| `CRYPTO_UPDATES_DEMO_SIM_FILE` | absent | `/home/coder/.openclaw/workspace/crypto-updates/runtime/demo-sim-trades.jsonl` |
| `CRYPTO_UPDATES_DEMO_SIM_SEND_MESSAGES` | absent | `true` |
| `CRYPTO_UPDATES_DEMO_TRADING_ENABLED` | absent | `false` |
| `CRYPTO_UPDATES_ALERT_SURFACE_CHANGE_APPROVED` | absent | `false` |
| `CRYPTO_UPDATES_INCLUDE_ORDERFLOW_CONTEXT_LINE` | absent | `false`, because approval flag is false |
| `CRYPTO_UPDATES_INCLUDE_ALERT_EVIDENCE_LINE` | absent | `false`, because approval flag is false |

Hash check:

```text
75787e84c0c9e916215d5c201bcfeb6aefdcd0f4995ddcf166ea8e7a5af07f44  /home/coder/.openclaw/workspace/crypto-updates/realtime-market-watcher.mjs
75787e84c0c9e916215d5c201bcfeb6aefdcd0f4995ddcf166ea8e7a5af07f44  tools/crypto-updates/realtime-market-watcher.mjs
```

Conclusion: the running v1 watcher file equals `tools/crypto-updates/realtime-market-watcher.mjs` by sha256.

## Short-Watch Scripts

### `btc-short-watch-82k.mjs`

Running command:

```text
node /home/coder/.openclaw/workspace/scripts/btc-short-watch-82k.mjs
```

Starts from cron via `ensure-short-watchers.sh`, with:

```text
BTC_SHORT_WATCH_CHECK_MS=30000
BTC_SHORT_WATCH_EXPIRES_AT=0
```

It watches Bybit linear `BTCUSDT` public data every 30 seconds:

- ticker: `/v5/market/tickers?category=linear&symbol=BTCUSDT`
- 1m klines: `/v5/market/kline?category=linear&symbol=BTCUSDT&interval=1&limit=30`
- 5m klines: `/v5/market/kline?category=linear&symbol=BTCUSDT&interval=5&limit=24`
- recent trades: `/v5/market/recent-trade?category=linear&symbol=BTCUSDT&limit=1000`

Setup logic:

- mark price must be failing after an extension zone around/above `81,950`
- `zoneSeen` becomes true after `recentHigh >= 81,950`
- pullback from `highSeen` must be at least `0.35%` and mark must be more than `180` below `highSeen`
- flow delta must be `<= 5%`
- structure loss must be either a 1m structure loss or 5m weakness
- repeat alerts are throttled for 45 minutes unless price is a better retest by at least max(`100`, `0.12%`)

Telegram messages go to `telegram:1539856256` and are titled like:

```text
BTC SHORT CANDIDATE @<mark> | manual only
```

The message includes setup context, approximate SL, TP levels, and the fixed warning: `Small size, hard SL, no naked leverage.`

### `zec-hype-short-watch.mjs`

Running command:

```text
node /home/coder/.openclaw/workspace/scripts/zec-hype-short-watch.mjs
```

Starts from cron via `ensure-short-watchers.sh`, with:

```text
ALT_SHORT_WATCH_CHECK_MS=30000
```

It watches Bybit linear public data for BTCUSDT as a gate and ZECUSDT/HYPEUSDT as candidates every 30 seconds:

- ticker: `/v5/market/tickers`
- 1m klines: `/v5/market/kline?interval=1&limit=60`
- 5m klines: `/v5/market/kline?interval=5&limit=48`
- recent trades: `/v5/market/recent-trade?limit=1000`

Configured thresholds:

| symbol | reject zone | base trigger | flow max | min pullback | SL pad min | targets | note |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| ZECUSDT | `956` to `989` | `940` | `5%` | `7` and `0.45%` | `5` | `939 / 934 / 923` | cleanest as retest-fail; no chasing after first dump |
| HYPEUSDT | `84.23` to `85.13` | `83.79` | `5%` | `0.24` and `0.35%` | `0.15` | `83.76 / 83.42 / 82.75` | closer to actionable; still needs rejection plus structure loss |

BTC gate:

- blocks alt-short alerts when BTC is near breakout without confirmed rejection
- blocks when BTC has aggressive push conditions
- requires BTC confirmed rejection context before ZEC/HYPE setup is considered actionable

Candidate setup requires:

- the configured reject zone has been seen
- BTC gate passes
- price has not accepted above the reject high
- flow delta is within the configured max
- failed continuation pullback is large enough
- 1m structure loss or 5m weakness is present

Telegram messages go to `telegram:1539856256` and are titled like:

```text
ZEC SHORT CANDIDATE @<mark> | manual only
HYPE SHORT CANDIDATE @<mark> | manual only
```

On repeated public data failures, it sends degradation/failure messages to the same chat.

## Script Hashes

```text
b72040d2dcf382275bb6bedede5a27202a82f58824386a20bbe4e9c469a0b233  /home/coder/.openclaw/workspace/scripts/btc-short-watch-82k.mjs
c920209cb0482c21378eb152c8a368e44642fd87f23e6a2f97eac2287917815d  /home/coder/.openclaw/workspace/scripts/zec-hype-short-watch.mjs
a49116529ce7429bd39bb1e772004482a8fa53e31d2fbecf5482d2d7cd3ea2ef  /home/coder/.openclaw/workspace/scripts/bybit-execution-reactor.mjs
cc4989752464736ac7ebf83ce79fef426fe9b0515b71672fd1caf990eed619ce  /home/coder/.openclaw/workspace/scripts/ensure-short-watchers.sh
```

