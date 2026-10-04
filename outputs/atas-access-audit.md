# ATAS Access Audit

Generated: 2026-09-20T10:34:00Z

Verdict: manual_csv_active__automatic_access_unproven

## Official Surface

- ATAS docs: https://docs.atas.net/ - official developer docs are available for custom indicator and strategy development.
- ATAS X indicator docs: https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20200__ATASX__Indicator.html - ATAS X supports custom indicator DLL loading and watches its indicators folder.
- ATAS data docs: https://docs.atas.net/en/md_DataFeedsCore_2Docs_2en_20025__ReceivingProcessingData.html - documented in-platform access includes candles, footprint price levels, online ticks, cumulative trades, market depth, MBO where provider-supported, and statistics.
- ATAS GitHub examples: https://github.com/AtasPlatform/Indicators - public examples/build flow exist for ATAS indicators.

## Local Access

- dotnet: available (/home/coder/.openclaw/npm/projects/openclaw-codex-8902d781d4/node_modules/@openclaw/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex-path/dotnet)
- wine: available (/home/coder/.openclaw/npm/projects/openclaw-codex-8902d781d4/node_modules/@openclaw/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/codex-path/wine)
- windowsInstallPath: missing (/mnt/c/Program Files/ATAS Platform)
- homeAtasPath: missing (/home/coder/ATAS)
- wineInstallPath: missing (/home/coder/.wine/drive_c/Program Files/ATAS Platform)
- local ATAS process/export folder: not detected from this workspace

## Manual CSV Evidence

- Confirmed manual path: ATAS X `+ -> New Widget -> Bid/Ask Tape -> export/save CSV`.
- Bid/Ask Tape schema: `Time;Bids;;;;Ask;Delta`; primary orderflow source.
- Smart Tape schema: `Time;Price;Volume`; supplemental print source unless settings expose side/aggressor/delta.
- Newer local samples exist for both Bid/Ask Tape and Smart Tape, confirming repeatability of the manual route.

## Proposed Automation Path

- Primary mode: read-only custom indicator/exporter inside ATAS.
- Language: C# using ATAS indicator API surface.
- Preferred transport: append-only JSONL/CSV file watched by RALPH importer.
- Fallback bridge: watched folder for Tomas-provided manual exports.
- Event schema: experiments/strategy-destruction-filter/schemas/atas-orderflow-event.schema.json.
- First lane: research-only absorption/exhaustion/breakout-quality feature windows.
- Avoid: credential capture, direct broker/exchange auth in RALPH, network interception, and UI automation as a primary route.

## Metric Bridge

- Keep `volume_velocity` as screening/trigger.
- Confirm with `delta_velocity`, `bid_side_velocity`, `ask_side_velocity`, `volume_per_price_progress`, `absorption_score`, `exhaustion_score`, and `breakout_quality_score`.
- BTC regime remains mandatory before any alt setup interpretation.

## Required Human Inputs

- Confirm whether ATAS is installed on a machine OpenClaw can reach or whether a synced export folder can be shared.
- Confirm market/data feed and instrument mapping used by the ATAS widgets.
- Confirm that a custom indicator/exporter can run with no trading permissions enabled.
- Later, allow a minimal read-only exporter DLL proof or continue with manual CSV packets.

## Next Actions

- atas-csv-importer: parse Bid/Ask Tape and Smart Tape by header, preserve original row index, and output compact feature windows.
- feature-window-generator: compute delta velocity, side velocity, volume-per-price-progress, absorption, exhaustion, and breakout quality windows.
- atas-exporter-proof: build/request a minimal read-only ATAS C# exporter only after local ATAS access is available.
- public-proxy-parity: compare ATAS windows against Binance/Bybit/Hyperliquid public trade/orderflow windows around the same UTC interval.

## Boundary

Audit/spec only; no ATAS install, account setup, paid feed, credentials, live trading, order placement, strategy promotion, alert wording, thresholds, risk, sizing, TP/SL, execution, scheduler change, or automated capture enabled.
