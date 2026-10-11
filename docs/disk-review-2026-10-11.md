# Disk Review 2026-10-11

Read-only review. No delete, move, chmod, restart, config edit, download, or Storage Box action was performed.

## R6 Check

Ad-hoc R6 command form:

```sh
systemd-run --user --scope -p CPUQuota=50% -p MemoryMax=1G -- nice -n 19 ionice -c 3 <command>
```

Measured:

- `nice=19`
- `ionice=idle`
- `memory.max=1073741824`
- `cpu.max=50000 100000`
- `kernel=6.8.0-124-generic`
- active schedulers observed: `loop*=none`, `sda=none`, `sr0=mq-deadline`

## Totals

```text
17G  /home/coder/.openclaw/workspace/ralph-research-os
20G  /home/coder/.openclaw/workspace
3.7G /home/coder/.local/share/echogarden
```

## Review Table

| path | size | files | newest mtime | what | used by | recreatable from | proposal |
|---|---:|---:|---|---|---|---|---|
| `/home/coder/.openclaw/workspace/ralph-research-os/experiments` | 16.7GB | 4621 | 2026-10-11T08:05:04Z | RALPH experiment data caches and run outputs | RALPH research scripts/docs reference this tree; no open files found | Mixed: market data mostly from public Binance archives and generated outputs from repo scripts; research outputs may not be fully recreatable | move large caches to Storage Box later; keep source/docs local |
| `/home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge` | 16.3GB | 2464 | 2026-10-11T08:04:31Z | market-data cache plus RALPH experiment outputs | RALPH automation docs/scripts reference it; no active systemd/crontab/open-file user found | Mostly public Binance archive data plus repo scripts; some generated outputs may need rerun | move cache-like data to Storage Box later; keep code/results index local |
| `/home/coder/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter` | 213.0MB | 206 | 2026-10-11T08:05:04Z | strategy research outputs and small aggTrades caches | RALPH automation docs/scripts reference it; no open files found | Partly from public market data and repo scripts; some outputs are rerunnable | keep local or Tomas decides |
| `ralph-research-os other` | 27.5MB | 1697 | 2026-10-11T08:05:11Z | wiki, notes, automation docs, indexes | RALPH research OS | git/repo content, not bulk cache | keep local |
| `/home/coder/.openclaw/workspace/.tmp/openclaw-spikes` | 750.6MB | 10152 | 2026-08-26T01:37:49Z | run outputs / temporary prototypes | none found | not reliably recreatable except by rerunning prior spikes | Tomas decides |
| `trade/execution runtime data` | 711.0MB | 63 | 2026-10-11T10:21:20Z | personal trade/execution runtime data | active market watcher and read-only execution reactor had open files | not fully recreatable | keep local |
| `/home/coder/.openclaw/workspace/.tmp-stt/node_modules` | 696.6MB | 4195 | 2026-06-15T16:49:56Z | node_modules | none found | npm install | move/delete later only with approval; recreatable |
| `/home/coder/.openclaw/workspace/.tmp-transcribe/node_modules` | 675.9MB | 3920 | 2026-06-15T18:28:40Z | node_modules | none found | npm install | move/delete later only with approval; recreatable |
| `workspace other` | 78.0MB | 1429 | 2026-10-11T10:20:28Z | mixed workspace docs/config/memory below threshold | OpenClaw workspace | mixed; some not recreatable | keep local |
| `/home/coder/.local/share/echogarden/packages/whisper-large-v3-turbo-fp16-20241002` | 1.6GB | 2 | 2024-10-02T10:07:45Z | Echogarden Whisper model | no open files or active process found; active config uses OpenAI transcription plus local whisper.cpp fallback, not this package | Echogarden/package download | move to Storage Box later or Tomas decides |
| `/home/coder/.local/share/echogarden/packages/whisper.cpp-large-v3-turbo-20241003` | 1.5GB | 1 | 2024-10-03T08:28:41Z | Echogarden whisper.cpp model | no open files or active process found | Echogarden/package download | move to Storage Box later or Tomas decides |
| `/home/coder/.local/share/echogarden/packages/whisper-tiny-20231126` | 225.4MB | 2 | 2023-11-25T22:15:15Z | Echogarden Whisper model | no open files or active process found | Echogarden/package download | Tomas decides |
| `/home/coder/.local/share/echogarden/packages/whisper-tiny.en-20231126` | 221.6MB | 2 | 2023-11-25T21:09:39Z | Echogarden Whisper model | no open files or active process found | Echogarden/package download | Tomas decides |

## RALPH AggTrades Cache

- `/home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge/data/binance-aggtrades-cache`: 0 files; no symbols; no date range; no `.CHECKSUM` files.
- Other aggTrades caches found under `strategy-destruction-filter`:
  - planned-level cache: 12 JSON files, 15.5MB, symbol `BTCUSDT`, sampled event-time range 2026-09-11T11:55:00Z to 2026-09-27T01:09:59Z, no `.CHECKSUM` files.
  - general cache: 57 JSON files, 145.3MB, symbols `BTCUSDT`, `ETHUSDT`, `SOLUSDT`, sampled event-time range 2026-08-10T15:07:10Z to 2026-08-25T21:08:07Z, no `.CHECKSUM` files.
- Scripts/docs that reference aggTrades include RALPH automation, data-rail, and research-note files. No download was performed.

## Echogarden Models

Models/packages present:

- `whisper-large-v3-turbo-fp16-20241002`: 1.6GB
- `whisper.cpp-large-v3-turbo-20241003`: 1.5GB
- `whisper-tiny-20231126`: 225.4MB
- `whisper-tiny.en-20231126`: 221.6MB
- `ffmpeg-6.0-linux-x64-20240316`: 76MB
- `whisper.cpp-binaries-linux-x64-cpu-latest-20250502`: 2.2MB
- `whisper-tiktoken-data-20240408`: 1.6MB

Active OpenClaw config selects OpenAI transcription first and a local CLI fallback:

```json
"provider": "openai",
"model": "gpt-4o-mini-transcribe"
```

The configured TTS voice is:

```json
"provider": "edge",
"voice": "cs-CZ-VlastaNeural"
```

The local fallback script points at `whisper.cpp` with a `ggml-base` model, not the Echogarden package directory. No active Echogarden model open files or processes were found during the scan.
