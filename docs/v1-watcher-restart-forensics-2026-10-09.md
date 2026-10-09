# v1 watcher restart forensics - 2026-10-09

## Question

`crypto-updates-market-watcher.service` was reported on 2026-10-08 as active since
`2026-09-24 05:49:39 UTC`, but the later inventory found the current v1 watcher
PID started at `2026-10-09T06:40:29Z`.

This document explains why.

## Conclusion

The current PID started at `2026-10-09T06:40:29Z` because an OpenClaw agent session
ran a manual user-systemd restart:

```text
systemctl --user restart crypto-updates-market-watcher.service && sleep 2 && systemctl --user show crypto-updates-market-watcher.service -p MainPID -p ActiveState -p SubState -p ExecMainStartTimestamp -p Environment
```

It was not a crash-loop or systemd automatic restart. `systemctl --user show`
reported `NRestarts=0`, and the journal shows orderly stop/start transitions.

The restart sequence on 2026-10-09 was:

```text
2026-10-09T05:31:59Z  manual restart to activate BTC orderflow enrichment
2026-10-09T05:52:29Z  manual restart to activate ETH/SOL target context
2026-10-09T06:31:02Z  manual restart to activate HYPE target context
2026-10-09T06:35:34Z  manual restart to activate the approved BTC-gate enforcement flag fix
2026-10-09T06:40:29Z  duplicate manual restart from the resumed OpenClaw session
```

The 06:35 restart was explicitly covered by Tomas's correction/handoff: make BTC
gate blocking default OFF and "restart watcher once for this approved fix." The
06:40 restart came from the next resumed session after two runtime errors. That
session read the same handoff and believed it was still doing the one approved
restart, even though the 06:35 restart had already consumed it. I found no
separate approval for a second restart at 06:40.

## Runtime state now

Current service status:

```text
MainPID=3590354
NRestarts=0
ExecStart={ path=/usr/bin/node ; argv[]=/usr/bin/node /home/coder/.openclaw/workspace/crypto-updates/realtime-market-watcher.mjs ; ignore_errors=no ; start_time=[Fri 2026-10-09 06:40:29 UTC] ; stop_time=[n/a] ; pid=3590354 ; code=(null) ; status=0/0 }
Environment=CRYPTO_UPDATES_CHANNEL=telegram CRYPTO_UPDATES_TELEGRAM_TARGET=telegram:1539856256 CRYPTO_UPDATES_OPENCLAW_BIN=/home/coder/.npm-global/bin/openclaw
ActiveEnterTimestamp=Fri 2026-10-09 06:40:29 UTC
```

The service unit has not changed since June:

```text
2026-06-30 18:15:14.006934605 +0000 731 /home/coder/.config/systemd/user/crypto-updates-market-watcher.service
```

Runtime script and repo script are byte-identical:

```text
75787e84c0c9e916215d5c201bcfeb6aefdcd0f4995ddcf166ea8e7a5af07f44  /home/coder/.openclaw/workspace/crypto-updates/realtime-market-watcher.mjs
75787e84c0c9e916215d5c201bcfeb6aefdcd0f4995ddcf166ea8e7a5af07f44  tools/crypto-updates/realtime-market-watcher.mjs
cmp_exit=0
```

The live environment does not set `CRYPTO_UPDATES_ENFORCE_BTC_GATE_FOR_ALT_PLANS`,
so current BTC-gate enforcement is OFF by code default:

```text
Environment=CRYPTO_UPDATES_CHANNEL=telegram CRYPTO_UPDATES_TELEGRAM_TARGET=telegram:1539856256 CRYPTO_UPDATES_OPENCLAW_BIN=/home/coder/.npm-global/bin/openclaw
```

Relevant code default:

```text
const ENFORCE_BTC_GATE_FOR_ALT_PLANS = process.env.CRYPTO_UPDATES_ENFORCE_BTC_GATE_FOR_ALT_PLANS === "1";
```

## Journal evidence

`journalctl --user -u crypto-updates-market-watcher.service --since '2026-09-23 00:00:00 UTC' --until '2026-10-10 00:00:00 UTC' --no-pager`
shows no automatic failure restart. The 2026-10-09 transitions were orderly:

```text
Oct 09 05:31:59 clawdbotcoder systemd[868]: Stopping crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher...
Oct 09 05:31:59 clawdbotcoder systemd[868]: Stopped crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher.
Oct 09 05:31:59 clawdbotcoder systemd[868]: Started crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher.
Oct 09 05:52:29 clawdbotcoder systemd[868]: Stopping crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher...
Oct 09 05:52:29 clawdbotcoder systemd[868]: Stopped crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher.
Oct 09 05:52:29 clawdbotcoder systemd[868]: Started crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher.
Oct 09 06:31:02 clawdbotcoder systemd[868]: Stopping crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher...
Oct 09 06:31:02 clawdbotcoder systemd[868]: Stopped crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher.
Oct 09 06:31:02 clawdbotcoder systemd[868]: Started crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher.
Oct 09 06:35:34 clawdbotcoder systemd[868]: Stopping crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher...
Oct 09 06:35:34 clawdbotcoder systemd[868]: Stopped crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher.
Oct 09 06:35:34 clawdbotcoder systemd[868]: Started crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher.
Oct 09 06:40:29 clawdbotcoder systemd[868]: Stopping crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher...
Oct 09 06:40:29 clawdbotcoder systemd[868]: Stopped crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher.
Oct 09 06:40:29 clawdbotcoder systemd[868]: Started crypto-updates-market-watcher.service - Crypto Updates real-time BTC/ETH/SOL/HYPE market watcher.
```

## Watcher log evidence

The watcher log shows fresh process startup lines matching the journal:

```text
[2026-10-09T06:31:02.191Z] paper trading enabled | file /home/coder/.openclaw/workspace/crypto-updates/runtime/paper-trades.jsonl | max open 1
[2026-10-09T06:31:02.192Z] demo-sim enabled | file /home/coder/.openclaw/workspace/crypto-updates/runtime/demo-sim-trades.jsonl | messages enabled
[2026-10-09T06:31:02.192Z] connecting wss://stream.binance.com:9443/stream?streams=btcusdt@trade/btcusdt@depth5@100ms/ethusdt@trade/ethusdt@depth5@100ms/solusdt@trade/solusdt@depth5@100ms
[2026-10-09T06:31:02.224Z] connecting wss://api.hyperliquid.xyz/ws
[2026-10-09T06:31:02.589Z] connected hyperliquid
[2026-10-09T06:31:04.784Z] connected
[2026-10-09T06:35:34.376Z] paper trading enabled | file /home/coder/.openclaw/workspace/crypto-updates/runtime/paper-trades.jsonl | max open 1
[2026-10-09T06:35:34.377Z] demo-sim enabled | file /home/coder/.openclaw/workspace/crypto-updates/runtime/demo-sim-trades.jsonl | messages enabled
[2026-10-09T06:35:34.377Z] connecting wss://stream.binance.com:9443/stream?streams=btcusdt@trade/btcusdt@depth5@100ms/ethusdt@trade/ethusdt@depth5@100ms/solusdt@trade/solusdt@depth5@100ms
[2026-10-09T06:35:34.419Z] connecting wss://api.hyperliquid.xyz/ws
[2026-10-09T06:35:34.676Z] connected hyperliquid
[2026-10-09T06:35:36.974Z] connected
[2026-10-09T06:40:29.620Z] paper trading enabled | file /home/coder/.openclaw/workspace/crypto-updates/runtime/paper-trades.jsonl | max open 1
[2026-10-09T06:40:29.620Z] demo-sim enabled | file /home/coder/.openclaw/workspace/crypto-updates/runtime/demo-sim-trades.jsonl | messages enabled
[2026-10-09T06:40:29.620Z] connecting wss://stream.binance.com:9443/stream?streams=btcusdt@trade/btcusdt@depth5@100ms/ethusdt@trade/ethusdt@depth5@100ms/solusdt@trade/solusdt@depth5@100ms
[2026-10-09T06:40:29.668Z] connecting wss://api.hyperliquid.xyz/ws
[2026-10-09T06:40:29.976Z] connected hyperliquid
[2026-10-09T06:40:30.670Z] connected
```

## Memory and handoff evidence

`memory/2026-10-09.md` explains the first three restarts:

```text
Restarted `crypto-updates-market-watcher.service` once at 2026-10-09T05:31:59Z to activate the code...
Updated `crypto-updates/realtime-market-watcher.mjs` again so ETH/SOL alert feedback can store `targetOrderflowContext`... Restarted watcher once at 2026-10-09T05:52:29Z to activate.
Extended RALPH collection to HYPE... updated watcher target orderflow context... then restarted watcher once at 2026-10-09T06:31:02Z.
```

The 06:33 handoff created after Tomas's correction says:

```text
BTC gate correction:
  - In `crypto-updates/realtime-market-watcher.mjs`, BTC gate blocking alt LONG/SHORT plans must be behind a flag, default OFF.
  - Keep computing and recording BTC gate.
  - Do not block by default.
  - Restarting watcher is explicitly approved for this one fix only.
  - From now on ask Tomas before every watcher restart.
```

The same handoff's copy-paste starter said:

```text
Read continuation-prompts/20261009T063346Z-ralph-collector-corrections.md and continue with item 1: make BTC gate blocking flag default OFF, report blocked plans since 2026-10-09T05:31:00Z, restart watcher once for this approved fix, then proceed through the remaining audits.
```

The earlier session then changed `crypto-updates/realtime-market-watcher.mjs`,
verified syntax and a VM smoke result, and restarted at 06:35:

```text
{
  "enforce": false,
  "gate": {
    "regime": "BTC_TRANSITION",
    "pass": false,
    "reason": "$82,494; bull session VWAP/session CVD/current bar delta; bear session POC/book imbalance; near profile edge",
    "score": 1,
    "enforced": false,
    "wouldBlock": true
  }
}

MainPID=3588747
NRestarts=0
ActiveState=active
SubState=running
ActiveEnterTimestamp=Fri 2026-10-09 06:35:34 UTC
```

It also sent Tomas:

```text
První korekce hotová: BTC gate enforcement je za flagem `CRYPTO_UPDATES_ENFORCE_BTC_GATE_FOR_ALT_PLANS`, default OFF. Gate se dál počítá/loguje, ale defaultně neblokuje plány. Od 2026-10-09 05:31 UTC nebyl v `alert-feedback.jsonl` žádný záznam a žádný plán tím reálně blokovaný. Watcher jsem restartnul jen pro tuhle schválenou opravu, PID `3588747`.
```

After that session errored, Tomas sent:

```text
You got stuck. Unstuck and continue where you left off
```

The resumed session read the same handoff, saw the already-fixed code and live
environment, then announced and executed another restart:

```text
Service environment confirms enforcement is not set, so BTC gate blocking is OFF in the live watcher too. I’m going to do the one approved watcher restart now to lock in that state...

MainPID=3590354
ExecMainStartTimestamp=Fri 2026-10-09 06:40:29 UTC
Environment=<redacted> CRYPTO_UPDATES_TELEGRAM_TARGET=telegram:1539856256 CRYPTO_UPDATES_OPENCLAW_BIN=<redacted>
ActiveState=active
SubState=running
```

## Shell history evidence

The interactive shell history did not contain a direct
`systemctl --user restart crypto-updates-market-watcher.service` entry for the
06:40 restart. The exact actor evidence came from OpenClaw trajectory logs,
which recorded the tool call at `2026-10-09T06:40:29.677Z`.

Search caveats:

```text
rg: /home/coder/.zsh_history: No such file or directory (os error 2)
rg: /root/.bash_history: Permission denied (os error 13)
```

## Git history evidence

The repo's git history shows the v1 watcher file entered this public repo in the
collector tooling commit:

```text
84ad508ecec8ed7e75b6e24c866f72e1974b9714 2026-10-09T10:35:56+02:00 Niftie27 <88902082+Niftie27@users.noreply.github.com> Add RALPH collector and replay tooling
```

The current runtime file still equals the repo copy at the current HEAD. The
repo history does not by itself identify the 06:40 restart actor; OpenClaw
trajectory plus journalctl do.

## Approval assessment

- Approved: the code change and one restart for the BTC-gate fix were approved
  by Tomas's 06:36 copy-paste instruction / the 06:33 handoff. That restart
  occurred at 06:35.
- Not separately approved: the duplicate 06:40 restart. It happened because the
  resumed session thought it still needed to perform the same approved restart
  after a runtime interruption.
- Current code/env: current runtime equals repo, service env has no BTC-gate
  enforcement variable, and `NRestarts=0`.

## Boundary note

For the current v2/storage work, v1 must now be treated as frozen: no v1 edits,
no v1 restarts, and no v1.1 sidecar without explicit Tomas approval.
