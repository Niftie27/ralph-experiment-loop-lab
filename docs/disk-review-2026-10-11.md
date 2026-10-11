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
| `/home/coder/.openclaw/workspace/ralph-research-os/experiments/btc-eth-alert-edge` | 16.3GB | 2464 | 2026-10-11T08:04:31Z | mostly public/no-key Binance USD-M futures daily trades/bookDepth CSV cache, plus smaller spot candle archive/cache and generated research outputs | OpenClaw cron `liquid-crypto-alert-edge-backtest` writes current generated outputs; `strategy-destruction-filter` USD-M orderflow studies import the BTC edge USD-M archive adapter and write this cache | Public Binance `data.binance.vision` USD-M archive ZIPs for trades/bookDepth, Binance spot archive + REST-tail candles, and rerunnable repo scripts | included in experiments; move cache-like data to Storage Box later; keep code/results index local |
| `/home/coder/.openclaw/workspace/ralph-research-os/experiments/strategy-destruction-filter` | 213.0MB | 206 | 2026-10-11T08:05:04Z | strategy research outputs and small aggTrades caches | RALPH automation docs/scripts reference it; no open files found | Partly from public market data and repo scripts; some outputs are rerunnable | included in experiments; keep local or Tomas decides |
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

## btc-eth-alert-edge Breakdown

Depth-1/2 subfolders at or near the large-data boundary:

| path | size | files | newest mtime | notes |
|---|---:|---:|---|---|
| `data` | 16.3GiB / 17.5GB | 2346 | 2026-10-11T08:04:23Z | Parent for public-market cache and generated candle inputs. |
| `data/binance-usdm-archive-cache` | 16.3GiB / 17.5GB | 289 | 2026-09-29T16:53:54Z | Public Binance USD-M futures daily archive CSV cache. Largest files are decompressed `trades` CSVs from `data.binance.vision`; sample header: `id,price,qty,quote_qty,time,is_buyer_maker`. |
| `data/binance-archive-cache` | 59.3MB | 2034 | 2026-10-11T04:04:14Z | Public Binance spot kline archive CSV cache from `data.binance.vision`; sample rows are raw kline CSV values with open time, OHLCV, close time, quote volume, count, taker volumes, and ignore column. |
| `data/candles` | 9.6MB | 22 | 2026-10-11T08:04:23Z | Generated JSON candle files consumed by backtest and DEMO-SIM scripts; files start as JSON arrays. |

Top file extensions in `btc-eth-alert-edge`:

| extension | size | files |
|---|---:|---:|
| `.csv` | 16.3GiB / 17.5GB | 2324 |
| `.json` | 13.7MB | 74 |
| `.mjs` | 436KB | 28 |
| `.md` | 159KB | 36 |
| `.pyc` | 17.6KB | 1 |
| `.py` | 12.1KB | 1 |

Largest subfolder writers and sources:

| subfolder | writer | source | format | recreatable |
|---|---|---|---|---|
| `data/binance-usdm-archive-cache` | `experiments/btc-eth-alert-edge/src/binance-usdm-archive.mjs` sets `CACHE_DIR`, maps archive URLs to cache files, and writes decompressed CSV with `fs.writeFile`; `experiments/strategy-destruction-filter/src/run-usdm-orderflow-demo-sim-batch.mjs` imports `fetchBinanceUsdmTradesDay`/`fetchBinanceUsdmBookDepthDay` and calls them for DEMO-SIM windows. | Binance USD-M futures public archive: `https://data.binance.vision/data/futures/um/daily/{trades,bookDepth}/...` | CSV; trades header is `id,price,qty,quote_qty,time,is_buyer_maker`; bookDepth rows are timestamp/percentage/depth/notional. | Recreatable from public/no-key archive plus repo scripts; rerun time not recorded, but prior batches loaded 60-80 windows and can be network/disk heavy because daily trade CSVs are hundreds of MB. |
| `data/binance-archive-cache` | `experiments/btc-eth-alert-edge/src/binance-data.mjs` sets `CACHE_DIR`, fetches spot monthly/daily kline ZIPs, and writes decompressed CSV. | Binance spot public archive: `https://data.binance.vision/data/spot/{monthly,daily}/klines/...`; current-month tail is fetched from Binance REST klines. | CSV kline rows, then normalized into JSON candle arrays. | Recreatable from public/no-key archive/REST plus repo scripts; rerun time not recorded. |
| `data/candles` | `experiments/btc-eth-alert-edge/src/backtest.mjs` sets `CANDLE_DIR`, calls `fetchBinanceSpotCandles`, and writes JSON candle files. DEMO-SIM scripts read those files. | Computed from the spot archive cache plus Binance REST tail, with Coinbase fallback available in `backtest.mjs`. | JSON arrays of normalized candles. | Recreatable by `npm run backtest --prefix ralph-research-os/experiments/btc-eth-alert-edge`; rerun time not recorded. |

Market boundary:

- `btc-eth-alert-edge` backtest/DEMO-SIM candles are Binance SPOT by default: `src/binance-data.mjs` uses `https://data.binance.vision/data/spot` and `https://api.binance.com/api/v3/klines`, and `src/backtest.mjs` writes `data/candles/binance-spot-...json`.
- `strategy-destruction-filter` default candle provider is also Binance SPOT through `src/market-data.mjs` (`provider = "binance-spot"`, `market: "spot"`), unless a specific branch explicitly selects another provider.
- `strategy-destruction-filter` USD-M orderflow batches are futures-specific overlays: `src/run-usdm-orderflow-demo-sim-batch.mjs` uses Binance USD-M futures public daily archives for `trades` and `bookDepth`.
- The USD-M full-path MFE/MAE rescore uses the targeted USD-M batch as its source set, but resolves full-path candles from the same canonical candle cache, preferring `binance-spot-{symbol}USDT-{timeframe}.json` when available.
- The strategy spam funnel is SPOT candle research: its data requirements declare `markets: ["spot"]`, and the active alt branch says `ETH/SOL spot-candle continuation/fade spam`.

## Writers

What wrote there today:

- The 5 newest files under `ralph-research-os` at scan time were `outputs/state-of-edge-report.md`, `outputs/state-of-edge-report.json`, `experiments/strategy-destruction-filter/results/aggtrades-velocity-event-study.md`, `experiments/strategy-destruction-filter/results/aggtrades-velocity-event-study.json`, and `experiments/strategy-destruction-filter/results/wick-alert-feedback-event-study.md`, all at `2026-10-11T08:04:56Z` to `2026-10-11T08:05:11Z`.
- The newest files inside `btc-eth-alert-edge` were DEMO-SIM/backtest output files under `results/`, all around `2026-10-11T08:04:31Z`.
- Matching OpenClaw cron job: `liquid-crypto-alert-edge-backtest`, schedule `0 */4 * * *` UTC with 5 minute stagger, last run at about `2026-10-11T08:03Z`. Its command list includes `npm run universe --prefix ralph-research-os/experiments/btc-eth-alert-edge`, `npm run backtest --prefix ralph-research-os/experiments/btc-eth-alert-edge`, `npm run demo-sim:all --prefix ralph-research-os/experiments/btc-eth-alert-edge`, `npm run verify --prefix ralph-research-os/experiments/btc-eth-alert-edge`, and strategy-destruction study commands.
- User systemd timers found were `ralph-disk-alert.timer`, `ralph-data-checks.timer`, `ralph-storage-maintenance.timer`, and `launchpadlib-cache-clean.timer`; none match the `btc-eth-alert-edge` writer path.
- User crontab only runs the short-watchers supervisor each minute and at reboot; it does not write the `btc-eth-alert-edge` tree.

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
