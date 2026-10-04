---
type: research-note
date: 2026-09-20
tags:
  - ralph
  - atas
  - exporter
  - orderflow
  - csharp
related:
  - 2026-09-20-ralph-backtest-data-inventory.md
  - 2026-09-20-atas-automation-access-audit.md
  - 2026-09-20-atas-classic-vs-x-exporter-plan.md
status: gated-design
---

# RalphOrderflowExporter V0 Design

Status: `source-skeleton-created__build-gated`. The ATAS docs support the required data surface, and Tomas confirmed `Add custom indicator` is visible in ATAS X. A minimal read-only source skeleton now exists under `../../tools/atas/RalphOrderflowExporter/` and was also packaged as `../../tools/atas/RalphOrderflowExporter-v0-source.zip`. It is not a compiled DLL yet; build remains gated on the installed `.NET` runtime target and local `ATAS.Indicators.dll`.

## Hard Boundaries

- No order placement.
- No account, portfolio, position, order, execution, or trade-stat export.
- No exchange/broker/wallet/API keys.
- No paid-plan activation or trial prompt.
- No alert wording, threshold, cadence, risk, TP/SL, sizing, scheduler, or execution changes.
- Append-only feature windows only; raw firehose only for a short explicit debug mode.

## Verified ATAS API Surfaces

- Custom C# indicators are documented as DLL class libraries referencing `ATAS.Indicators.dll`.
- `OnCalculate` is called across historical bars and then on current-bar ticks.
- `GetCandle(bar)` exposes OHLC, volume, bid, ask, delta, max/min delta, VWAP, OI, and last trade time.
- Footprint/cluster data is exposed by `IndicatorCandle.GetAllPriceLevels()` and `PriceVolumeInfo`.
- Live prints can be observed with `OnNewTrade`.
- Aggregated/cumulative trades can be observed with `OnCumulativeTrade` and `OnUpdateCumulativeTrade`.
- Historical cumulative trades can be requested with `RequestForCumulativeTrades` and received through `OnCumulativeTradesResponse`, with a documented max request span of `7` days.
- Market depth callbacks and snapshots exist, but depth/MBO should be a later optional path after provider support is verified.

## V0 Output

Preferred directory:

```text
%LOCALAPPDATA%\RalphOrderflowExporter\
```

Files:

- `feature-windows.jsonl`: append-only normalized windows.
- `status.json`: heartbeat/status, last write time, last exception, version, instrument.
- `errors.log`: local non-secret exception log.

Feature window fields:

- `schema_version`
- `source`: `atas_indicator`
- `platform`: `ATAS_X` or `ATAS_CLASSIC` if known
- `instrument`
- `timeframe`
- `bar`
- `window_start`
- `window_end`
- `price_open`, `price_high`, `price_low`, `price_close`
- `volume`
- `bid_volume`
- `ask_volume`
- `delta`
- `delta_velocity`
- `bid_side_velocity`
- `ask_side_velocity`
- `volume_per_price_progress`
- `max_volume_price`
- `max_volume_price_volume`
- `max_positive_delta_price`
- `max_negative_delta_price`
- `price_level_count`
- `event_count`
- `source_quality`: `bar`, `tick`, `cumulative_trade`, `footprint_summary`

## V0 Class Shape

```csharp
using System;
using System.Globalization;
using System.IO;
using ATAS.Indicators;

namespace Ralph.Atas;

public sealed class RalphOrderflowExporter : Indicator
{
    private const string SchemaVersion = "ralph_orderflow_window_v0";
    private readonly object _writeLock = new();
    private DateTime _currentBucketStart;
    private WindowAccumulator _bucket = new();
    private string _outputDir = "";
    private string _featurePath = "";
    private string _statusPath = "";

    protected override void OnInitialize()
    {
        // Resolve a non-secret local output directory under the user's app data.
    }

    protected override void OnCalculate(int bar, decimal value)
    {
        // Read GetCandle(bar), summarize candle/footprint data, and flush compact windows.
    }

    protected override void OnNewTrade(MarketDataArg trade)
    {
        // Optional: update current window event count and live print metrics.
    }

    protected override void OnCumulativeTrade(CumulativeTrade trade)
    {
        // Optional: update signed cumulative-trade volume if available.
    }

    protected override void OnUpdateCumulativeTrade(CumulativeTrade trade)
    {
        // Optional: adjust cumulative-trade window values if ATAS updates the same trade.
    }

    protected override void OnCumulativeTradesResponse(
        CumulativeTradesRequest request,
        IEnumerable<CumulativeTrade> cumulativeTrades)
    {
        // Later: historical cumulative-trade bootstrap, bounded to <= 7 day requests.
    }
}
```

The actual code should start smaller than this if compiler references differ. First compile target: no custom UI, no WPF settings editor, no trading manager reference, no account-stat reference.

## Runtime Check Needed From Tomas

Minimum HITL before building:

1. Find the runtime target:
   - ATAS X: `OFT.PlatformX.runtimeconfig.json`
   - Classic: `OFT.Platform.runtimeconfig.json`
2. Copy or reference the installed `ATAS.Indicators.dll` for compilation.
3. Confirm target app for first test: ATAS X preferred; Classic fallback.
4. Choose a non-secret output folder that can be synced/read back by OpenClaw if `%LOCALAPPDATA%\RalphOrderflowExporter\` is not convenient.

If custom indicators are blocked on `Start`, keep this as `needs-access` and continue with public fetchers plus manual CSV import. Do not request a plan upgrade unless Tomas explicitly asks.

## V0 Source Artifact

Created files:

- `../../tools/atas/RalphOrderflowExporter/RalphOrderflowExporter.cs`
- `../../tools/atas/RalphOrderflowExporter/RalphOrderflowExporter.csproj`
- `../../tools/atas/RalphOrderflowExporter/Find-AtasRuntime.ps1`
- `../../tools/atas/RalphOrderflowExporter/README.md`
- `../../tools/atas/RalphOrderflowExporter-v0-source.zip`

Skeleton behavior:

- writes `%LOCALAPPDATA%\RalphOrderflowExporter\feature-windows.jsonl`;
- writes `%LOCALAPPDATA%\RalphOrderflowExporter\status.json`;
- writes `%LOCALAPPDATA%\RalphOrderflowExporter\errors.log` for local non-secret exceptions;
- exports one compact bar/footprint summary per bar via `GetCandle(bar)` and `GetAllPriceLevels()`;
- avoids `TradingManager`, orders, positions, portfolio, executions, trading statistics, account data, and keys.

Known compile caveat: this workspace cannot compile the DLL without Tomas's installed `ATAS.Indicators.dll` and runtime target. The first build may need small type/namespace adjustments after testing against the real ATAS DLL.

Update 2026-09-20 16:14 UTC: source skeleton tightened against the cached ATAS docs by adding the candle-aware `Indicator` base constructor (`base(true)`), denying calculation-timeframe changes for this chart-bound footprint exporter, guarding `GetCandle(bar)` with `bar < CurrentBar`, and adding `errors.log`. Added `Find-AtasRuntime.ps1` so Tomas can locate `OFT.PlatformX.runtimeconfig.json` and `ATAS.Indicators.dll` on the ATAS machine. Refreshed `RalphOrderflowExporter-v0-source.zip` with the updated source. Build is still unverified in this workspace because `dotnet` is not installed here and the real ATAS DLL/runtime target are still local to Tomas's machine.

Update 2026-09-20 16:36 UTC: Tomas hit a PowerShell parser error in `Find-AtasRuntime.ps1`: `An empty pipe element is not allowed` on the runtime-summary `foreach (...) { ... } | Format-Table -AutoSize` block. Fixed the helper by assigning the `foreach` output to `$frameworkSummary` first, then piping `$frameworkSummary | Format-Table -AutoSize`. Rebuilt and resent `RalphOrderflowExporter-v0-source.zip`.

Update 2026-09-20 16:43 UTC: Tomas successfully ran the fixed runtime helper. ATAS X targets `C:\Program Files\ATAS X\OFT.PlatformX.runtimeconfig.json` with `Microsoft.NETCore.App 10.0.0` and `Microsoft.WindowsDesktop.App 10.0.0`; ATAS X indicator reference is `C:\Program Files\ATAS X\ATAS.Indicators.dll` (`565248` bytes, `2026-09-16 03:59:21`). Classic is also installed under `C:\Program Files (x86)\ATAS Platform\` with .NET 10 runtime and its own smaller `ATAS.Indicators.dll`. Fixed `.csproj` reference path to `lib\ATAS.Indicators.dll`, added `Build-AtasX.ps1` to copy the ATAS X DLL and build `net10.0-windows`, and resent the package.

Update 2026-09-20 16:46 UTC: first ATAS X build attempt reached `dotnet --info` but Windows has runtimes only (`10.0.2`, `8.0.8`) and `No SDKs were found`, so `dotnet build` cannot run yet. Directed Tomas to install the official Microsoft .NET 10 SDK with `winget.exe install Microsoft.DotNet.SDK.10 --accept-package-agreements --accept-source-agreements`, reopen WSL, and rerun `Build-AtasX.ps1`. Tightened the helper to stop on nonzero `dotnet build` instead of also throwing a missing output-folder error.

Update 2026-09-20 16:50 UTC: after SDK install, Tomas built `RalphOrderflowExporter` successfully for `net10.0-windows`. Output DLL: `C:\Users\tompa\Downloads\RalphOrderflowExporter\bin\Release\net10.0-windows\RalphOrderflowExporter.dll` (`10752` bytes). Remaining warnings are obsolete API warnings for `Indicator.Instrument` and `Indicator.TimeFrame`, with replacements `InstrumentInfo.Instrument` and `ChartInfo.TimeFrame`; not blocking for the first ATAS X load/write test. Next gate: load with ATAS X `Add custom indicator`, attach to chart, verify `%LOCALAPPDATA%\RalphOrderflowExporter\status.json` and `feature-windows.jsonl`.

Update 2026-09-20 16:57 UTC: first ATAS X load/write test succeeded. Tomas attached the DLL to a `BTCUSDT` `H1` chart and checked `%LOCALAPPDATA%\RalphOrderflowExporter\status.json` plus `feature-windows.jsonl`. `status.json` reported `state:"ok"` at `2026-09-20T16:55:11.4861644Z`, output path `C:\Users\tompa\AppData\Local\RalphOrderflowExporter\feature-windows.jsonl`, and no error. The JSONL tail contained real bar/footprint summary rows for bars `230` to `232`, including OHLC, total volume, bid/ask volume, delta, VWAP, price-level count, max-volume price, and max positive/negative delta prices. This verifies the initial read-only ATAS X custom indicator rail end to end; the indicator is intentionally not a visible chart overlay.

Update 2026-09-20 17:00 UTC: follow-up check proved live progression, not just a static initial dump. `status.json` advanced to `2026-09-20T16:59:59.9909144Z`, and `feature-windows.jsonl` appended bar `233` with `candle_time` `2026-09-20T17:00:00.0000000`, `last_trade_time` `2026-09-20T17:00:00.0080000Z`, `volume` `0.001`, `ask_volume` `0.001`, and `delta` `0.001`. The tiny volume is expected because it was the first update of the new H1 candle. This confirms the rail updates across a new candle boundary.

Update 2026-09-20 17:12 UTC: Tomas changed the ATAS X chart timeframe and screenshot confirmed `Ralph Orderflow Exporter (Bars, True)` stays attached to the chart. Operating assumption for V0: the exporter follows the chart/instrument/timeframe it is attached to; verify by checking new `status.json` / JSONL rows for the updated `timeframe` value after ATAS recalculates, and remove/re-add the indicator if the timeframe does not update. Important scope clarification: V0 exports bar/footprint-summary data, not a full replacement for ATAS `Bid/Ask Tape`, `Smart Tape`, `All Prices`, or `Replay`. Manual/visual ATAS tools remain useful for tape inspection, Smart Tape trade-print classification, session price distribution, and any replay workflow; V0 is the automated structured data bridge for RALPH.

Update 2026-09-20 17:14 UTC: Tomas verified the timeframe behavior after changing the chart to M5. `status.json` reported `state:"ok"`, `instrument:"BTCUSDT"`, `timeframe:"M5"`, and `utc:"2026-09-20T17:11:38.1989389Z"`. The JSONL tail contained M5 bars `1066` to `1070` with `candle_time` values `16:50`, `16:55`, `17:00`, `17:05`, and live partial bar `17:10` with `last_trade_time` `2026-09-20T17:11:37.8270000Z`. This confirms the exporter follows the manually selected ATAS X chart timeframe without re-adding the indicator. Ingestion caveat: V0 writes all test rows into one append-only `feature-windows.jsonl`, so downstream consumers must filter by `instrument + timeframe`; V1 should consider per-symbol/timeframe output files such as `feature-windows-BTCUSDT-M5.jsonl`.

Update 2026-09-20 20:25 UTC: implemented the per-symbol/timeframe split in source. Feature rows now go to `%LOCALAPPDATA%\RalphOrderflowExporter\feature-windows-{instrument}-{timeframe}.jsonl`; examples: `feature-windows-BTCUSDT-H1.jsonl` and `feature-windows-BTCUSDT-M5.jsonl`. `status.json` remains global and its `output` field points to the active file. Duplicate suppression now tracks the last written bar per output file, not one global `_lastWrittenBar`, so chart symbol/timeframe changes are less likely to suppress a valid row. README updated and `RalphOrderflowExporter-v0-source.zip` rebuilt/sent. This workspace has no local `dotnet`, `csc`, or `mcs`, so final compilation must be tested on Tomas's Windows ATAS machine with `Build-AtasX.ps1`.

Update 2026-09-20 20:29 UTC: Tomas built the split-output source successfully on Windows/ATAS X. `Build-AtasX.ps1` compiled `RalphOrderflowExporter` for `net10.0-windows` and produced `bin\Release\net10.0-windows\RalphOrderflowExporter.dll`. Build succeeded with 8 warnings, all from obsolete `Indicator.Instrument` / `Indicator.TimeFrame` calls and therefore not blocking. Next verification is ATAS runtime load/write: remove the old attached indicator, add/select the rebuilt DLL, attach to BTCUSDT, and check that `status.json.output` points to `feature-windows-BTCUSDT-M5.jsonl` or the selected timeframe file.

Update 2026-09-20 20:30 UTC: split-output runtime write is partially verified on H1. Tomas ran the verify command and `status.json` reported `state:"ok"`, `instrument:"BTCUSDT"`, `timeframe:"H1"`, and `output:"C:\\Users\\tompa\\AppData\\Local\\RalphOrderflowExporter\\feature-windows-BTCUSDT-H1.jsonl"` at `2026-09-20T20:29:12.1699961Z`. `Get-ChildItem feature-windows-*.jsonl` showed `feature-windows-BTCUSDT-H1.jsonl` with length `167958`. The command failed only on `Get-Content feature-windows-BTCUSDT-M5.jsonl` because the active chart was H1 and the rebuilt version had not written an M5 split file yet. Sent a generic verification command that tails `$status.output` instead of hardcoding M5.

Update 2026-09-20 20:33 UTC: split-output H1 runtime write is now fully live-verified. Tomas ran the generic `$status.output` command and the active output stayed `feature-windows-BTCUSDT-H1.jsonl`; file length advanced from `167958` to `335913` and last write advanced to `20.09.2026 22:31:57`. This proves the rebuilt DLL is actively appending to the new per-timeframe H1 stream. M5 split output remains an expected follow-up: switch ATAS chart to M5, wait a few seconds, and rerun the generic checker.

Update 2026-09-20 20:34 UTC: the generic tail returned concrete H1 split-file rows: bar `234` at `18:00`, bar `235` at `19:00`, and live partial bar `236` at `20:00` with `last_trade_time:"2026-09-20T20:31:56.7500000Z"`. This confirms the per-timeframe output file contains valid bar/footprint summary payloads after the split-output code change.

Update 2026-09-20 20:55 UTC: added the first deeper All Prices-style layer in source. For every written bar, the indicator now also appends one row per candle price level to `%LOCALAPPDATA%\RalphOrderflowExporter\price-levels-{instrument}-{timeframe}.jsonl`. Price-level schema version is `ralph_orderflow_price_level_v0` with fields: `instrument`, `timeframe`, `bar`, `candle_time`, `last_trade_time`, `price`, `volume`, `bid_volume`, `ask_volume`, and `delta`. `status.json` now includes `price_level_output`. README and ZIP were refreshed and sent to Tomas with a checker that tails both `status.output` and `status.price_level_output`. Compile/load verification is pending on Tomas's Windows ATAS machine.

Update 2026-09-20 21:02 UTC: price-level stream is verified on BTCUSDT M5. `status.json` reported `state:"ok"`, `timeframe:"M5"`, `output:"...feature-windows-BTCUSDT-M5.jsonl"`, and `price_level_output:"...price-levels-BTCUSDT-M5.jsonl"` at `2026-09-20T21:01:46.1699885Z`. The M5 feature file existed with length `2345769`, and the M5 price-level file existed with length `4230481`; both had fresh last write `20.09.2026 23:01:46`. Feature tail contained bars `1115` and live partial `1116`. Price-level tail contained valid bar `1116` rows for prices `81010`, `81020`, and `81030`, each with volume/bid/ask/delta. This verifies the automated All Prices-style export layer.
