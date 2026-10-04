using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using ATAS.Indicators;

namespace Ralph.Atas;

public sealed class RalphOrderflowExporter : Indicator
{
    private const string SchemaVersion = "ralph_orderflow_window_v0";
    private readonly object _writeLock = new();
    private readonly Dictionary<string, int> _lastWrittenBarByOutput = new();
    private string _outputDir = "";
    private string _statusPath = "";
    private string _errorPath = "";

    public RalphOrderflowExporter()
        : base(true)
    {
        Name = "Ralph Orderflow Exporter";
        DenyCalculationTimeFrameChange = true;
    }

    protected override void OnInitialize()
    {
        _outputDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "RalphOrderflowExporter");

        Directory.CreateDirectory(_outputDir);
        _statusPath = Path.Combine(_outputDir, "status.json");
        _errorPath = Path.Combine(_outputDir, "errors.log");

        WriteStatus("initialized", null, null, null);
    }

    protected override void OnCalculate(int bar, decimal value)
    {
        if (bar < 0 || bar >= CurrentBar)
            return;

        try
        {
            var instrument = Instrument ?? "";
            var timeframe = TimeFrame ?? "";
            var featurePath = GetFeaturePath(instrument, timeframe);
            var priceLevelPath = GetPriceLevelPath(instrument, timeframe);

            lock (_writeLock)
            {
                if (_lastWrittenBarByOutput.TryGetValue(featurePath, out var lastWrittenBar) && bar == lastWrittenBar)
                    return;
            }

            var candle = GetCandle(bar);
            if (candle is null)
                return;

            var levels = candle.GetAllPriceLevels()
                .Where(level => level is not null)
                .ToArray();

            var maxVolume = levels
                .OrderByDescending(level => level.Volume)
                .FirstOrDefault();

            var maxPositiveDelta = levels
                .OrderByDescending(level => level.Ask - level.Bid)
                .FirstOrDefault();

            var maxNegativeDelta = levels
                .OrderBy(level => level.Ask - level.Bid)
                .FirstOrDefault();

            var line = "{" +
                JsonField("schema_version", SchemaVersion) + "," +
                JsonField("source", "atas_indicator") + "," +
                JsonField("instrument", instrument) + "," +
                JsonField("timeframe", timeframe) + "," +
                JsonField("source_quality", "bar_footprint_summary") + "," +
                JsonField("bar", bar) + "," +
                JsonField("candle_time", candle.Time) + "," +
                JsonField("last_trade_time", candle.LastTime) + "," +
                JsonField("price_open", candle.Open) + "," +
                JsonField("price_high", candle.High) + "," +
                JsonField("price_low", candle.Low) + "," +
                JsonField("price_close", candle.Close) + "," +
                JsonField("volume", candle.Volume) + "," +
                JsonField("bid_volume", candle.Bid) + "," +
                JsonField("ask_volume", candle.Ask) + "," +
                JsonField("delta", candle.Delta) + "," +
                JsonField("max_delta", candle.MaxDelta) + "," +
                JsonField("min_delta", candle.MinDelta) + "," +
                JsonField("vwap", candle.VWAP) + "," +
                JsonField("price_level_count", levels.Length) + "," +
                JsonNullableField("max_volume_price", maxVolume?.Price) + "," +
                JsonNullableField("max_volume_price_volume", maxVolume?.Volume) + "," +
                JsonNullableField("max_positive_delta_price", maxPositiveDelta?.Price) + "," +
                JsonNullableField("max_positive_delta", maxPositiveDelta is null ? null : maxPositiveDelta.Ask - maxPositiveDelta.Bid) + "," +
                JsonNullableField("max_negative_delta_price", maxNegativeDelta?.Price) + "," +
                JsonNullableField("max_negative_delta", maxNegativeDelta is null ? null : maxNegativeDelta.Ask - maxNegativeDelta.Bid) +
                "}";

            var priceLevelLines = new StringBuilder();
            foreach (var level in levels)
            {
                var levelLine = "{" +
                    JsonField("schema_version", "ralph_orderflow_price_level_v0") + "," +
                    JsonField("source", "atas_indicator") + "," +
                    JsonField("instrument", instrument) + "," +
                    JsonField("timeframe", timeframe) + "," +
                    JsonField("source_quality", "bar_price_level") + "," +
                    JsonField("bar", bar) + "," +
                    JsonField("candle_time", candle.Time) + "," +
                    JsonField("last_trade_time", candle.LastTime) + "," +
                    JsonField("price", level.Price) + "," +
                    JsonField("volume", level.Volume) + "," +
                    JsonField("bid_volume", level.Bid) + "," +
                    JsonField("ask_volume", level.Ask) + "," +
                    JsonField("delta", level.Ask - level.Bid) +
                    "}";

                priceLevelLines.AppendLine(levelLine);
            }

            lock (_writeLock)
            {
                File.AppendAllText(featurePath, line + Environment.NewLine, Encoding.UTF8);
                if (priceLevelLines.Length > 0)
                    File.AppendAllText(priceLevelPath, priceLevelLines.ToString(), Encoding.UTF8);

                _lastWrittenBarByOutput[featurePath] = bar;
            }

            WriteStatus("ok", featurePath, priceLevelPath, null);
        }
        catch (Exception ex)
        {
            WriteError(ex);
            WriteStatus(
                "error",
                GetFeaturePath(Instrument ?? "", TimeFrame ?? ""),
                GetPriceLevelPath(Instrument ?? "", TimeFrame ?? ""),
                ex.Message);
        }
    }

    private void WriteStatus(string state, string? outputPath, string? priceLevelOutputPath, string? error)
    {
        try
        {
            var instrument = Instrument ?? "";
            var timeframe = TimeFrame ?? "";

            outputPath ??= GetFeaturePath(instrument, timeframe);
            priceLevelOutputPath ??= GetPriceLevelPath(instrument, timeframe);

            var line = "{" +
                JsonField("schema_version", SchemaVersion) + "," +
                JsonField("state", state) + "," +
                JsonField("utc", DateTime.UtcNow) + "," +
                JsonField("instrument", instrument) + "," +
                JsonField("timeframe", timeframe) + "," +
                JsonField("output", outputPath) + "," +
                JsonField("price_level_output", priceLevelOutputPath) + "," +
                JsonNullableStringField("error", error) +
                "}";

            lock (_writeLock)
                File.WriteAllText(_statusPath, line + Environment.NewLine, Encoding.UTF8);
        }
        catch
        {
            // Status writes must never break indicator calculation.
        }
    }

    private string GetFeaturePath(string instrument, string timeframe)
    {
        var safeInstrument = SafeFilePart(string.IsNullOrWhiteSpace(instrument) ? "unknown-instrument" : instrument);
        var safeTimeframe = SafeFilePart(string.IsNullOrWhiteSpace(timeframe) ? "unknown-timeframe" : timeframe);

        return Path.Combine(_outputDir, $"feature-windows-{safeInstrument}-{safeTimeframe}.jsonl");
    }

    private string GetPriceLevelPath(string instrument, string timeframe)
    {
        var safeInstrument = SafeFilePart(string.IsNullOrWhiteSpace(instrument) ? "unknown-instrument" : instrument);
        var safeTimeframe = SafeFilePart(string.IsNullOrWhiteSpace(timeframe) ? "unknown-timeframe" : timeframe);

        return Path.Combine(_outputDir, $"price-levels-{safeInstrument}-{safeTimeframe}.jsonl");
    }

    private void WriteError(Exception ex)
    {
        try
        {
            var line = $"{DateTime.UtcNow:O}\t{ex.GetType().FullName}\t{ex.Message}";
            lock (_writeLock)
                File.AppendAllText(_errorPath, line + Environment.NewLine, Encoding.UTF8);
        }
        catch
        {
            // Error logging must never break indicator calculation.
        }
    }

    private static string JsonField(string name, string value)
        => $"\"{Escape(name)}\":\"{Escape(value)}\"";

    private static string JsonField(string name, int value)
        => $"\"{Escape(name)}\":{value.ToString(CultureInfo.InvariantCulture)}";

    private static string JsonField(string name, decimal value)
        => $"\"{Escape(name)}\":{value.ToString(CultureInfo.InvariantCulture)}";

    private static string JsonField(string name, DateTime value)
        => $"\"{Escape(name)}\":\"{value:O}\"";

    private static string JsonNullableField(string name, decimal? value)
        => value is null
            ? $"\"{Escape(name)}\":null"
            : JsonField(name, value.Value);

    private static string JsonNullableStringField(string name, string? value)
        => value is null
            ? $"\"{Escape(name)}\":null"
            : JsonField(name, value);

    private static string Escape(string value)
        => value.Replace("\\", "\\\\").Replace("\"", "\\\"");

    private static string SafeFilePart(string value)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var builder = new StringBuilder(value.Length);

        foreach (var character in value)
            builder.Append(invalid.Contains(character) || char.IsWhiteSpace(character) ? "_" : character);

        return builder.ToString();
    }
}
