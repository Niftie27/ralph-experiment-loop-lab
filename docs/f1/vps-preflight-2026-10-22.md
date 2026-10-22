# F1a-2 VPS preflight — 2026-10-22

## 1. Memory

Measurement start (UTC): 2026-10-22T10:56:34.416951+00:00

All memory quantities below are bytes. `/proc/meminfo` kB values were multiplied by 1024.

- MemTotal: 3999678464
- MemAvailable: 869748736
- SwapTotal: 2147479552
- SwapFree: 691634176

`vmstat 1 5`: si/so in KiB/s; sample 1 is the since-boot average.

| Sample | si | so |
|---|---:|---:|
| 1 | 1 | 1 |
| 2 | 0 | 0 |
| 3 | 0 | 0 |
| 4 | 0 | 0 |
| 5 | 0 | 0 |

## 2. OpenClaw gateway

Unit: `openclaw-gateway.service`. Memory quantities are bytes.

- MainPID: 268515
- NRestarts: 1
- MemoryCurrent: 2232168448
- MemoryPeak: 3094519808
- MemoryMax: infinity
- ActiveEnterTimestamp: Wed 2026-10-21 08:35:14 UTC

Main PID `/proc` smaps_rollup (bytes):

- Rss: 1403293696
- Pss_Anon: 1359876096
- Swap: 429940736

## 3. Processes and collectors

Top 15 processes by RSS, descending; RSS and VmSwap are bytes. Process names are `comm`; unit attribution is from `/proc` cgroups.

| pid | comm | unit | RSS | VmSwap | oom_score | oom_score_adj |
|---:|---|---|---:|---:|---:|---:|
| 268515 | MainThread | openclaw-gateway.service | 1403293696 | 429940736 | 1002 | 200 |
| 4111664 | MainThread | crypto-updates-market-watcher.service | 254443520 | 20733952 | 830 | 200 |
| 329248 | codex | openclaw-gateway.service | 215719936 | 0 | 823 | 200 |
| 3693414 | python | ralph-collector.service | 182288384 | 164294656 | 837 | 200 |
| 3693403 | python | ralph-collector-ethusdt.service | 152834048 | 172306432 | 834 | 200 |
| 329318 | npm exec @model | openclaw-gateway.service | 127856640 | 0 | 1346 | 1000 |
| 329385 | npm exec @model | openclaw-gateway.service | 123060224 | 0 | 813 | 200 |
| 329311 | MainThread | openclaw-gateway.service | 101769216 | 0 | 810 | 200 |
| 314490 | systemd-journal | systemd-journald.service | 99057664 | 679936 | 511 | -250 |
| 3693400 | python | ralph-collector-hypeusdt.service | 86036480 | 99086336 | 820 | 200 |
| 329409 | MainThread | openclaw-gateway.service | 81997824 | 0 | 808 | 200 |
| 329331 | MainThread | openclaw-gateway.service | 81899520 | 0 | 1342 | 1000 |
| 4111984 | MainThread | cron.service | 69468160 | 24985600 | 676 | 0 |
| 4111909 | MainThread | cron.service | 61435904 | 36335616 | 677 | 0 |
| 3693396 | python | ralph-collector-solusdt.service | 58257408 | 73375744 | 814 | 200 |

Four live collectors; MemoryCurrent and main-process VmSwap are bytes.

| Collector | Unit | MainPID | ActiveEnterTimestamp | NRestarts | MemoryCurrent | VmSwap |
|---|---|---:|---|---:|---:|---:|
| BTC | ralph-collector.service | 3693414 | Fri 2026-10-09 14:09:02 UTC | 0 | 232079360 | 164294656 |
| ETH | ralph-collector-ethusdt.service | 3693403 | Fri 2026-10-09 14:09:01 UTC | 0 | 199249920 | 172306432 |
| SOL | ralph-collector-solusdt.service | 3693396 | Fri 2026-10-09 14:09:01 UTC | 0 | 70082560 | 73375744 |
| HYPE | ralph-collector-hypeusdt.service | 3693400 | Fri 2026-10-09 14:09:01 UTC | 0 | 92741632 | 99086336 |

## 4. OOM journal matches

Window (UTC): 2026-10-21T08:00:00Z through 2026-10-22T10:56:38.517753+00:00.

User journal: case-insensitive `oom` message matches; counts are matching journal entries, not inferred OOM incidents. Attribution uses USER_UNIT when present, otherwise the emitting unit.

| Unit | Count | Timestamps (UTC) |
|---|---:|---|
| openclaw-gateway.service | 3 | 2026-10-21T08:35:04.832826+00:00; 2026-10-21T08:35:09.404375+00:00; 2026-10-21T08:35:09.431028+00:00 |

Kernel journal: not verified (no readable matching records obtained without sudo; zero OOM events is not established).

## 5. Disk

Filesystem holding `~`; `df -B1`, no `du`. Size, used and available are bytes.

- size: 80307429376
- used: 40354967552
- available: 36629848064
- use_percent: 53%

## 6. Compare readiness

- Node version: v24.22.0
- Repo clone: `~/ralph-experiment-loop-lab`
- HEAD before any fetch or pull: e2b9c92ef9ee3c3e4591de16f60797faee25e5bc
- Branch before any fetch or pull: main
- git status --porcelain line count before any fetch or pull: 0
- Requested systemd user scope probe (MemoryMax=1G, CPUQuota=50%, /bin/true), exit code: 0
- Binance CHECKSUM HEAD request HTTP status: HTTP/2 200
- curl exit code: 0

URL: https://data.binance.vision/data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01.zip.CHECKSUM

Runtime/repo SHA-256 checks (on-disk entrypoints, before pull):

| Entrypoint | Runtime SHA-256 | Repo SHA-256 |
|---|---|---|
| collector | 130c9a650043357535320e120c31655d13d79ba99d1d447052f7bd8197f76199 | 130c9a650043357535320e120c31655d13d79ba99d1d447052f7bd8197f76199 |
| v1 | 75787e84c0c9e916215d5c201bcfeb6aefdcd0f4995ddcf166ea8e7a5af07f44 | 75787e84c0c9e916215d5c201bcfeb6aefdcd0f4995ddcf166ea8e7a5af07f44 |
| reactor | a49116529ce7429bd39bb1e772004482a8fa53e31d2fbecf5482d2d7cd3ea2ef | a49116529ce7429bd39bb1e772004482a8fa53e31d2fbecf5482d2d7cd3ea2ef |

R2 for everything running, including short watchers, downstream modules and historical loaded code: not verified. OpenClaw package has no project-repo counterpart. No runtime files, v1 or short watchers were modified. Compare was not started.

