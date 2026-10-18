# Live operational state

Updated: 2026-10-18T15:07:41Z. Update after every change.

Snapshot checked read-only on 2026-10-18 UTC. Services, data, cron and timers were not changed. No V6 interim outcomes were inspected. Hashes below compare files at the configured runtime paths with tracked repo copies, not in-memory code loaded at process start.

## (a) User services

Sources: `systemctl --user show` (ActiveState, SubState, ActiveEnterTimestamp, ExecStart), file SHA-256. Start = unit activation time. Paths use `~` for home.

| Service | State | Start (UTC) | Script pair |
|---|---|---|---|
| `ralph-collector.service` | active/running | Fri 2026-10-09 14:09:02 UTC | collector (below) |
| `ralph-collector-ethusdt.service` | active/running | Fri 2026-10-09 14:09:01 UTC | collector (below) |
| `ralph-collector-solusdt.service` | active/running | Fri 2026-10-09 14:09:01 UTC | collector (below) |
| `ralph-collector-hypeusdt.service` | active/running | Fri 2026-10-09 14:09:01 UTC | collector (below) |
| `crypto-updates-market-watcher.service` | active/running | Thu 2026-10-15 22:39:58 UTC | v1 (below) |
| `bybit-execution-reactor.service` | active/running | Thu 2026-10-15 22:39:58 UTC | reactor (below) |
| `openclaw-gateway.service` | active/running | Fri 2026-10-16 17:46:43 UTC | OpenClaw (below) |
| `openclaw-node.service` | active/running | Fri 2026-10-16 12:18:21 UTC | OpenClaw (below) |

| Pair | Runtime path | Repo path | Runtime SHA-256 | Repo SHA-256 | Result |
|---|---|---|---|---|---|
| collector | `~/ralph_collector/binance_live.py` | `tools/collector/binance_live.py` | `130c9a650043357535320e120c31655d13d79ba99d1d447052f7bd8197f76199` | `130c9a650043357535320e120c31655d13d79ba99d1d447052f7bd8197f76199` | equal |
| v1 | `~/.openclaw/workspace/crypto-updates/realtime-market-watcher.mjs` | `tools/crypto-updates/realtime-market-watcher.mjs` | `75787e84c0c9e916215d5c201bcfeb6aefdcd0f4995ddcf166ea8e7a5af07f44` | `75787e84c0c9e916215d5c201bcfeb6aefdcd0f4995ddcf166ea8e7a5af07f44` | equal |
| reactor | `~/.openclaw/workspace/scripts/bybit-execution-reactor.mjs` | `tools/vps-scripts/bybit-execution-reactor.mjs` | `a49116529ce7429bd39bb1e772004482a8fa53e31d2fbecf5482d2d7cd3ea2ef` | `a49116529ce7429bd39bb1e772004482a8fa53e31d2fbecf5482d2d7cd3ea2ef` | equal |

Gateway and node host use `~/.npm-global/lib/node_modules/openclaw/dist/index.js`, SHA-256 `d249778c67317e86ade71cdfa064f7c4722e8564d6f80f09b2ce8ac0cee40ef2`. No project-repo counterpart: runtime == repo is **not applicable**, not claimed. The node unit description still says v2026.6.6; installed CLI version is in (e). Loaded package version at process start is not verified.

## (b) Short watchers via crontab

`crontab -l` contains `@reboot` and `* * * * *` entries invoking `~/.openclaw/workspace/scripts/ensure-short-watchers.sh`; output goes to the workspace `.tmp/short-watchers-supervisor.log`. Supervisor code checks PID + script command line before starting each watcher; configured loop interval is 30000 ms. Nothing was invoked or edited.

| Script | Live process (UTC start) | Runtime SHA-256 | Repo SHA-256 | Result |
|---|---|---|---|---|
| `btc-short-watch-82k.mjs` | Ssl  Thu Oct 15 22:45:01 2026; script identity confirmed | `b72040d2dcf382275bb6bedede5a27202a82f58824386a20bbe4e9c469a0b233` | `b72040d2dcf382275bb6bedede5a27202a82f58824386a20bbe4e9c469a0b233` | equal |
| `zec-hype-short-watch.mjs` | Ssl  Thu Oct 15 22:46:01 2026; script identity confirmed | `c920209cb0482c21378eb152c8a368e44642fd87f23e6a2f97eac2287917815d` | `c920209cb0482c21378eb152c8a368e44642fd87f23e6a2f97eac2287917815d` | equal |
| `ensure-short-watchers.sh` | minute/reboot supervisor; not a persistent process | `cc4989752464736ac7ebf83ce79fef426fe9b0515b71672fd1caf990eed619ce` | `cc4989752464736ac7ebf83ce79fef426fe9b0515b71672fd1caf990eed619ce` | equal |

Runtime directory: `~/.openclaw/workspace/scripts/`; repo directory: `tools/vps-scripts/`.

## (c) Timers

Sources: `systemctl --user list-timers --all`, `systemctl --user cat` and `show`. All listed times UTC; last trigger is not proof of successful completion.

| Timer | State | Schedule | Last trigger | Next |
|---|---|---|---|---|
| `ralph-data-checks.timer` | active/waiting | daily 00:20 UTC (checks hourly rows) | Sun 2026-10-18 00:20:17 UTC | Mon 2026-10-19 00:20:00 UTC |
| `ralph-archive-upload.timer` | active/waiting | hourly :40, accuracy 5 min | Sun 2026-10-18 14:44:17 UTC | Sun 2026-10-18 15:40:00 UTC |
| `ralph-storage-maintenance.timer` | active/running | hourly, accuracy 5 min | Sun 2026-10-18 15:04:17 UTC | not listed (service may be active) |
| `ralph-disk-alert.timer` | active/waiting | hourly, accuracy 5 min | Sun 2026-10-18 15:04:17 UTC | Sun 2026-10-18 16:00:00 UTC |
| `ralph-cron-report-1815.timer` | active/waiting | one-shot 2026-10-18 18:15 UTC | none recorded | Sun 2026-10-18 18:15:00 UTC |

| Activated service | Current state | Latest start / exit (UTC) | Result |
|---|---|---|---|
| `ralph-data-checks.service` | inactive/dead | Sun 2026-10-18 00:20:17 UTC / Sun 2026-10-18 00:28:52 UTC | success; exit 0 |
| `ralph-archive-upload.service` | inactive/dead | Sun 2026-10-18 14:44:17 UTC / Sun 2026-10-18 14:44:22 UTC | success; exit 0 |
| `ralph-storage-maintenance.service` | activating/start | Sun 2026-10-18 15:04:17 UTC / — | in progress; not yet a completed success |
| `ralph-disk-alert.service` | inactive/dead | Sun 2026-10-18 15:04:17 UTC / Sun 2026-10-18 15:04:17 UTC | success; exit 0 |
| `ralph-cron-report-1815.service` | inactive/dead | — / — | not run yet |

Only `ralph-cron-report-1815.timer` was present among `ralph-cron-report-*` at inspection. The four recurring RALPH timers are persistent. Disk checking is **hourly**, while alerts below **20% free** are throttled to **one per 6 hours** (`--min-free-pct 20 --throttle-hours 6`); it is not a 6-hour timer. Delivery of the most recent disk alert was not verified.

## (d) OpenClaw cron jobs

Source: OpenClaw state DB through `openclaw automations list --all --json` and `openclaw automations runs <job-id> --limit 3 --json`, with IDs resolved by name. All 11 history queries succeeded. Last-run times below are run starts, not finish times. No job was run/enabled/disabled/edited. Off reasons are Tomas’s supplied policy, not inferred from errors.

| Job | Enabled | Last run (UTC) | Status | History returned / note / off reason |
|---|---|---|---|---|
| ralph-weekly-maintenance | yes | 2026-10-11T16:00:00Z | ok | 1 entries; enabled; ok with tool diagnostic warning, not an all-clean claim |
| liquid-crypto-alert-edge-backtest | yes | 2026-10-18T12:09:26Z | error | 3 entries; enabled; latest error: subscription usage limit |
| ralph-adversarial-improvement-loop | yes | 2026-10-15T17:30:00Z | error | 3 entries; enabled; latest error: old gpt-5.5 unsupported |
| ralph-autoresearch-loop | yes | 2026-10-15T07:30:00Z | error | 3 entries; enabled; latest error: old gpt-5.5 unsupported |
| skill-collection-review-main | no | not verified (no recorded run) | not verified | 0 entries; off by config: prompt collisions, quota; no recorded run, not verified |
| crypto-updates-daily-digest-beta | no | 2026-08-11T06:00:00Z | ok | 0 entries; waits for Tomas in his main Telegram session; last-run metadata from job list only |
| RALPH ETH SOL Replay | no | 2026-10-09T07:18:53Z | error | 0 entries; obsolete one-shot (2026-10-09); last-run metadata from job list only |
| crypto-updates-urgent-watcher-beta | no | 2026-08-25T05:54:41Z | ok | 0 entries; 96 runs/day; last-run metadata from job list only |
| bybit-execution-reactor | no | 2026-08-11T14:18:55Z | ok | 0 entries; duplicate of reactor process; last-run metadata from job list only |
| ralph-state-of-edge-daily | no | 2026-10-18T07:34:10Z | ok | 3 entries; V6: report exposes aggregate shadow PnL; off until after 2026-11-15 |
| heartbeat-main | no | 2026-10-16T12:36:09Z | skipped | 2 entries; off by config: prompt collisions, quota |

Total: **11 jobs; 4 enabled, 7 disabled**. Scheduler success does not establish visible message delivery. Run summaries/outcome aggregates were not inspected.

## (e) Versions

- OpenClaw: `OpenClaw 2026.10.3 (59cb447)`.
- Node: `v24.22.0`.
- System Python: `Python 3.12.3`.
- Collector Python: `Python 3.12.3`.

## (f) Disk, RAM and swap

Live command snapshots; values change with ongoing collectors/maintenance.

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        75G   60G   13G  84% /

total        used        free      shared  buff/cache   available
Mem:           3.7Gi       2.8Gi       595Mi       4.0Mi       578Mi       898Mi
Swap:          2.0Gi       1.8Gi       166Mi
```
Disk alert threshold is 20% free; current disk is below that threshold. No cleanup or memory changes performed.

## (g) Raw retention

Raw retention is **7 days**, with `--apply --delete-raw` present on all four installed maintenance commands since commit `8ed0178` (2026-10-17). Deletion is conditional, not a guarantee that every older file disappears: H/H+1 data-check gates, tape/book checks, matching local archive PASS record, and fresh remote SHA-256 verification must pass. Only eligible `.jsonl.xz` raw files are deleted; an audit is appended. No archive access or deletion was initiated in this task.
Sources: installed unit, `tools/collector/storage_maintenance.py`, `tools/collector/ralph-storage-maintenance.service`, and local workspace `continuation-prompts/2026-10-10-0623-ralph-trade-time-rebuild-action-log.md` (RET1, 2026-10-17T23:08:58Z).

| File | Runtime SHA-256 | Repo SHA-256 | Result |
|---|---|---|---|
| `storage_maintenance.py` | `285429576f42bd72205c2b92891fdc32fd8c20cbf3d94752be7b87bc5b47305a` | `285429576f42bd72205c2b92891fdc32fd8c20cbf3d94752be7b87bc5b47305a` | equal |
| `ralph-storage-maintenance.service` | `b8692d41e0c1f0a3f5d99fd9945f15a2fe66d0384c5ef28c858e1a4ad50ec77f` | `b8692d41e0c1f0a3f5d99fd9945f15a2fe66d0384c5ef28c858e1a4ad50ec77f` | equal |
| `disk_alert.py` | `ba7d36c5fc394d780c569be333629dc5e90a4290bd50e0ad362c3f1d6320a60d` | `ba7d36c5fc394d780c569be333629dc5e90a4290bd50e0ad362c3f1d6320a60d` | equal |

Installed maintenance unit SHA-256: `b8692d41e0c1f0a3f5d99fd9945f15a2fe66d0384c5ef28c858e1a4ad50ec77f`.

## (h) Open / Unresolved

- Alert-edge fix `36f1c12` still awaits a good **scheduled** run. Latest recorded run failed at the subscription usage limit; no manual rerun was requested or performed.
- Disk remains below the 20% threshold. Existing hourly checker / 6-hour alert throttle preserved; latest visible alert delivery not verified.
- Five downstream scripts remain unmirrored (whole-chain R2 remains partial): `crypto-updates/analyze-alert-setups.mjs` and `crypto-updates/orderflow-spike.mjs` were excluded by mistake for public API host literals; `scripts/a2b_history_proof.py`, `~/ralph-state/a2c_bybit_crosscheck.py`, and `~/ralph-state/a2c_minute_basis_remaining.py` contain home paths/usernames. This documentation-only task does not copy or sanitize them. Source: [D1b action log](d1b-action-log.md), [mirror manifest](data-catalog.md#downstream-source-mirror-verification-d1b); mistaken-exclusion correction supplied by Tomas in L1a.
- OpenClaw package entrypoint has no repo mirror; equality not applicable. Historical loaded bytes at process start are not verified for any service.
- Empty cron history responses cannot corroborate older job-list metadata; skill review has no recorded last run.
- Seed decisions without matching source logs retain Tomas’s supplied date and are marked historical date not independently verified in [decisions](decisions.md).
- Memory search was degraded to keyword-only (embedding quota); no index rebuild was initiated. Source-file and live checks above are independent of that recall limitation.
