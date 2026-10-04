---
type: research-note
status: unknown
tags:
  - ralph
  - research-note
  - orderflow
  - ta
related:
  - ../research-map.md
---

# Ralph Orderflow Exporter Usage And Roadmap - 2026-09-20

## Current Verdict

`RalphOrderflowExporter` is useful for RALPH, but it is not a full ATAS replacement.

It is a read-only ATAS X custom indicator that turns chart/footprint data into structured local JSONL files. Its value is that RALPH can ingest, test, label, and monitor data that previously existed only inside ATAS UI panels.

The current proven bridge is:

```text
ATAS X chart -> RalphOrderflowExporter.dll -> local JSONL files -> future RALPH ingestion/watcher
```

## Verified Outputs

Default folder:

```text
%LOCALAPPDATA%\RalphOrderflowExporter\
```

Verified file streams:

```text
feature-windows-BTCUSDT-H1.jsonl
feature-windows-BTCUSDT-M5.jsonl
price-levels-BTCUSDT-M5.jsonl
status.json
errors.log
```

Legacy test file still exists from earlier V0 testing:

```text
feature-windows.jsonl
```

Keep it as old test output; new ingestion should prefer split files.

## What The Indicator Currently Exports

### Bar Summary Stream

File pattern:

```text
feature-windows-{instrument}-{timeframe}.jsonl
```

One row per chart candle/bar.

Fields include:

- instrument
- timeframe
- bar index
- candle time
- last trade time
- OHLC
- volume
- bid volume
- ask volume
- delta
- max delta
- min delta
- VWAP
- price level count
- max-volume price
- strongest positive delta price
- strongest negative delta price

Verified:

- BTCUSDT H1 live append
- BTCUSDT M5 live append
- timeframe switching follows the chart
- split output files by instrument/timeframe

### Price-Level Stream

File pattern:

```text
price-levels-{instrument}-{timeframe}.jsonl
```

One row per price level inside each candle/bar.

Fields:

- instrument
- timeframe
- bar index
- candle time
- last trade time
- price
- volume
- bid volume
- ask volume
- delta

Verified on BTCUSDT M5:

- `status.json.price_level_output` pointed to `price-levels-BTCUSDT-M5.jsonl`
- file existed and updated live
- tail contained valid `ralph_orderflow_price_level_v0` rows for live M5 bar `1116`

This is the first automated ATAS All Prices-style layer.

## Timeframes

The indicator is chart-bound. It reads the instrument and timeframe from the ATAS chart it is attached to.

It should work with ordinary ATAS chart timeframes such as:

```text
M1, M5, M15, H1, H4, D1
```

It does not need a rebuild per timeframe.

To collect multiple timeframes at the same time, keep multiple ATAS charts open and attach the exporter to each chart:

```text
BTCUSDT H1 chart + exporter -> feature-windows-BTCUSDT-H1.jsonl / price-levels-BTCUSDT-H1.jsonl
BTCUSDT M5 chart + exporter -> feature-windows-BTCUSDT-M5.jsonl / price-levels-BTCUSDT-M5.jsonl
```

H1 and M5 are proven. Other normal timeframes are expected to work because the same chart-bound mechanism provides `TimeFrame`, but they can be spot-checked later.

## What It Does Not Replace Yet

The exporter does not yet replace all ATAS features.

Not implemented yet:

- raw Bid/Ask Tape tick-by-tick prints
- Smart Tape-style trade classification
- full Replay engine/control
- visual/manual ATAS analysis tools
- file rotation/config
- RALPH-side watcher/ingestion

Replay nuance:

- The indicator may capture bars/trades if ATAS Replay feeds data through chart/indicator callbacks.
- The indicator does not control ATAS Replay itself.
- Tomas's current ATAS Start setup has Market Replay blocked, so Replay is not the current data rail.

## Current Manual Workflow

Use this when Tomas is at the ATAS PC:

1. Open ATAS X.
2. Open the target chart, for example BTCUSDT M5.
3. Attach `Ralph Orderflow Exporter`.
4. Leave ATAS X and the chart running.
5. The indicator writes JSONL files automatically.
6. Use PowerShell only to verify/debug output.

Verification command:

```bash
powershell.exe -NoProfile -Command '$status = Get-Content "$env:LOCALAPPDATA\RalphOrderflowExporter\status.json" -Tail 1 | ConvertFrom-Json; $status; Get-ChildItem "$env:LOCALAPPDATA\RalphOrderflowExporter\*.jsonl" | Select-Object Name,Length,LastWriteTime; "--- feature tail ---"; Get-Content $status.output -Tail 2; "--- price-level tail ---"; Get-Content $status.price_level_output -Tail 5'
```

## When Tomas Is Not At The PC

The indicator only runs where ATAS X is running. If the ATAS PC is off, sleeping, logged out in a way that stops ATAS, or ATAS/chart/indicator is closed, then current ATAS data will not be exported.

Options:

1. Keep the Windows ATAS PC on.
   - ATAS X stays open.
   - Required charts stay open.
   - Exporter stays attached.
   - RALPH watcher later reads the files.

2. Use remote access to the ATAS PC.
   - RDP, AnyDesk, Parsec, Tailscale + RDP, or another approved remote desktop path.
   - This lets Tomas check/restart ATAS when away.

3. Run ATAS X on a Windows VPS/cloud desktop.
   - More reliable than a home PC if always-on capture matters.
   - Needs ATAS login/license compatibility and exchange/data-feed access checked before treating it as active.

4. Add Windows startup automation.
   - Start ATAS on login.
   - Restore workspace/charts if ATAS supports it.
   - Later run a local watcher that monitors stale `status.json` timestamps and alerts Tomas/RALPH.

Without one of these, RALPH will only have the last files written before ATAS stopped.

## Why This Is Useful For RALPH

This is useful because it creates a structured data rail from ATAS into RALPH.

Near-term uses:

- forward-test/live context capture
- alert confirmation features
- labels for later research
- bar-level orderflow features
- price-level footprint/All Prices-like features
- comparison between price movement and footprint imbalance

Longer-term uses:

- train or score setup filters
- build replay-like datasets from captured live sessions
- compare public exchange-derived data against ATAS chart-derived footprint data
- create RALPH feature stores by symbol/timeframe

## Next Build Layers

Recommended order:

1. Raw trade/tape stream:

```text
trades-{instrument}.jsonl
```

Use ATAS `OnNewTrade` if live crypto mode exposes clean trade events. This is the path toward Bid/Ask Tape-like data.

2. Cumulative trade stream:

```text
cumulative-trades-{instrument}.jsonl
```

Use ATAS cumulative trade hooks if they behave well. This is the path toward Smart Tape-like clustering.

3. Output manager / config:

- shared writer for all streams
- enable/disable streams
- file rotation
- daily folders
- max file size
- stale status detection

4. RALPH watcher/ingestion:

- read split JSONL files
- deduplicate rows
- normalize schemas
- persist into RALPH research/forward-test store
- alert if `status.json.utc` goes stale

## Current Boundary

No live trading, orders, account access, keys, positions, execution behavior, alert wording, thresholds, scheduler changes, or strategy promotion are part of this exporter work.

The indicator is a local read-only data exporter.
