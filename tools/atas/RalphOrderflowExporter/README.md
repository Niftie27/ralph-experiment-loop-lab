# RalphOrderflowExporter

Read-only ATAS custom indicator skeleton for RALPH orderflow feature windows.

## Boundary

- Does not place orders.
- Does not read account, portfolio, position, order, execution, or trading statistics.
- Does not use exchange/broker/wallet/API keys.
- Writes only local append-only feature rows, status, and local error diagnostics.

## Files Written By The Indicator

Default Windows output folder:

```text
%LOCALAPPDATA%\RalphOrderflowExporter\
```

Files:

- `feature-windows-{instrument}-{timeframe}.jsonl`
- `price-levels-{instrument}-{timeframe}.jsonl`
- `status.json`
- `errors.log`

Examples:

```text
feature-windows-BTCUSDT-H1.jsonl
feature-windows-BTCUSDT-M5.jsonl
price-levels-BTCUSDT-H1.jsonl
price-levels-BTCUSDT-M5.jsonl
```

`status.json` contains the currently active bar-summary file path in its `output` field and the currently active price-level file path in its `price_level_output` field.

## Locate ATAS Runtime And DLL

From this folder on the ATAS machine, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\Find-AtasRuntime.ps1
```

Send back:

- the `OFT.PlatformX.runtimeconfig.json` framework/version line;
- the `ATAS.Indicators.dll` path.

## Build Notes

1. Confirm the ATAS runtime target:
   - ATAS X: `OFT.PlatformX.runtimeconfig.json`
   - Classic: `OFT.Platform.runtimeconfig.json`
2. Copy the installed `ATAS.Indicators.dll` into `lib\ATAS.Indicators.dll` or edit the `.csproj` `HintPath`.
3. Build the matching target framework:

```powershell
dotnet build -c Release -f net8.0-windows
```

or:

```powershell
dotnet build -c Release -f net10.0-windows
```

For Tomas's ATAS X install found on 2026-09-20, use the helper:

```powershell
powershell -ExecutionPolicy Bypass -File .\Build-AtasX.ps1
```

That helper copies:

```text
C:\Program Files\ATAS X\ATAS.Indicators.dll
```

into:

```text
.\lib\ATAS.Indicators.dll
```

then builds:

```text
net10.0-windows
```

4. Add the built DLL through ATAS `Add custom indicator`, or copy it into:

```text
%APPDATA%\ATAS X\Indicators
```

or for Classic:

```text
%APPDATA%\ATAS\Indicators
```

5. Attach `RalphOrderflowExporter` to the chart/instrument to start local file output.

If you change the chart timeframe in ATAS X, the same indicator instance can stay attached. New rows should move to the matching `feature-windows-{instrument}-{timeframe}.jsonl` file after ATAS recalculates/updates the chart.

The `feature-windows-*` files contain one compact bar summary per candle. The `price-levels-*` files contain one row per candle price level, closer to an automated All Prices export.
