import fs from "node:fs/promises";
import path from "node:path";
import { fetchConfiguredCandles } from "./market-data.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const CONFIG_FILE = path.join(ROOT, "config.default.json");
const OUT_JSON = path.join(RESULTS_DIR, "level-breakout-acceptance-study.json");
const OUT_MD = path.join(RESULTS_DIR, "level-breakout-acceptance-study.md");

const STUDY = {
  symbols: ["BTC", "ETH", "SOL", "HYPE"],
  candleTimeframes: ["1h", "4h"],
  resampledTimeframes: ["1d"],
  lookbackDays: 1095,
  atrPeriod: 14,
  acceptanceBufferAtr: 0.05,
  targetAtr: 0.5,
  horizonBarsByTimeframe: {
    "1h": 6,
    "4h": 6,
    "1d": 3
  }
};

function mean(values) {
  const xs = values.filter(Number.isFinite);
  return xs.length ? xs.reduce((sum, value) => sum + value, 0) / xs.length : null;
}

function pct(value) {
  return value == null ? null : Number((value * 100).toFixed(2));
}

function fixed(value, digits = 4) {
  return value == null ? null : Number(value.toFixed(digits));
}

function median(values) {
  const xs = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!xs.length) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

function trueRange(candle, previous) {
  if (!previous) return candle.high - candle.low;
  return Math.max(candle.high - candle.low, Math.abs(candle.high - previous.close), Math.abs(candle.low - previous.close));
}

function withAtr(candles, period) {
  const out = [];
  const trs = [];
  for (let i = 0; i < candles.length; i += 1) {
    trs.push(trueRange(candles[i], candles[i - 1]));
    const slice = trs.slice(Math.max(0, trs.length - period));
    out.push({ ...candles[i], atr: mean(slice) });
  }
  return out;
}

function dayKey(sec) {
  return new Date(sec * 1000).toISOString().slice(0, 10);
}

function resampleDaily(candles) {
  const byDay = new Map();
  for (const candle of candles) {
    const key = dayKey(candle.time);
    if (!byDay.has(key)) {
      byDay.set(key, { time: Date.parse(`${key}T00:00:00Z`) / 1000, open: candle.open, high: candle.high, low: candle.low, close: candle.close, volume: candle.volume });
      continue;
    }
    const row = byDay.get(key);
    row.high = Math.max(row.high, candle.high);
    row.low = Math.min(row.low, candle.low);
    row.close = candle.close;
    row.volume += candle.volume;
  }
  return [...byDay.values()].sort((a, b) => a.time - b.time);
}

function firstHit(candles, startIndex, horizonBars, direction, entry, targetDistance) {
  const favorable = direction === "up" ? entry + targetDistance : entry - targetDistance;
  const adverse = direction === "up" ? entry - targetDistance : entry + targetDistance;
  for (let i = startIndex + 1; i <= Math.min(candles.length - 1, startIndex + horizonBars); i += 1) {
    const candle = candles[i];
    const hitFavorable = direction === "up" ? candle.high >= favorable : candle.low <= favorable;
    const hitAdverse = direction === "up" ? candle.low <= adverse : candle.high >= adverse;
    if (hitFavorable && hitAdverse) return "ambiguous";
    if (hitFavorable) return "favorable_first";
    if (hitAdverse) return "adverse_first";
  }
  return "timeout";
}

function classifyEvents(candles, timeframe) {
  const withVol = withAtr(candles, STUDY.atrPeriod);
  const events = [];
  const horizonBars = STUDY.horizonBarsByTimeframe[timeframe] || 6;

  for (let i = STUDY.atrPeriod + 1; i < withVol.length - horizonBars; i += 1) {
    const previous = withVol[i - 1];
    const current = withVol[i];
    const atr = current.atr;
    if (!Number.isFinite(atr) || atr <= 0) continue;
    const buffer = atr * STUDY.acceptanceBufferAtr;
    const targetDistance = atr * STUDY.targetAtr;

    if (current.high > previous.high) {
      const kind = current.close > previous.high + buffer ? "acceptance_up" : current.close <= previous.high ? "rejection_up_sweep" : "weak_up_break";
      const intendedDirection = kind === "rejection_up_sweep" ? "down" : "up";
      const hit = firstHit(withVol, i, horizonBars, intendedDirection, current.close, targetDistance);
      events.push({
        timeframe,
        levelSide: "up",
        kind,
        intendedDirection,
        hit,
        closeReturn: ((withVol[i + horizonBars].close - current.close) / current.close) * (intendedDirection === "up" ? 1 : -1),
        atrReturn: ((withVol[i + horizonBars].close - current.close) / atr) * (intendedDirection === "up" ? 1 : -1)
      });
    }

    if (current.low < previous.low) {
      const kind = current.close < previous.low - buffer ? "acceptance_down" : current.close >= previous.low ? "rejection_down_sweep" : "weak_down_break";
      const intendedDirection = kind === "rejection_down_sweep" ? "up" : "down";
      const hit = firstHit(withVol, i, horizonBars, intendedDirection, current.close, targetDistance);
      events.push({
        timeframe,
        levelSide: "down",
        kind,
        intendedDirection,
        hit,
        closeReturn: ((withVol[i + horizonBars].close - current.close) / current.close) * (intendedDirection === "up" ? 1 : -1),
        atrReturn: ((withVol[i + horizonBars].close - current.close) / atr) * (intendedDirection === "up" ? 1 : -1)
      });
    }
  }

  return events;
}

function previousDayLevels(candles) {
  const byDay = new Map();
  for (const candle of candles) {
    const key = dayKey(candle.time);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(candle);
  }

  const days = [...byDay.keys()].sort();
  const levels = new Map();
  for (let i = 1; i < days.length; i += 1) {
    const previousRows = byDay.get(days[i - 1]);
    levels.set(days[i], {
      high: Math.max(...previousRows.map((row) => row.high)),
      low: Math.min(...previousRows.map((row) => row.low))
    });
  }
  return levels;
}

function classifyPreviousDayLevelEvents(candles, timeframe) {
  const withVol = withAtr(candles, STUDY.atrPeriod);
  const levelsByDay = previousDayLevels(withVol);
  const horizonBars = STUDY.horizonBarsByTimeframe[timeframe] || 6;
  const seen = new Set();
  const events = [];

  for (let i = STUDY.atrPeriod + 1; i < withVol.length - horizonBars; i += 1) {
    const current = withVol[i];
    const levels = levelsByDay.get(dayKey(current.time));
    const atr = current.atr;
    if (!levels || !Number.isFinite(atr) || atr <= 0) continue;
    const buffer = atr * STUDY.acceptanceBufferAtr;
    const targetDistance = atr * STUDY.targetAtr;
    const date = dayKey(current.time);

    if (!seen.has(`${date}:pdh`) && current.high > levels.high) {
      seen.add(`${date}:pdh`);
      const kind = current.close > levels.high + buffer ? "acceptance_up" : current.close <= levels.high ? "rejection_up_sweep" : "weak_up_break";
      const intendedDirection = kind === "rejection_up_sweep" ? "down" : "up";
      const hit = firstHit(withVol, i, horizonBars, intendedDirection, current.close, targetDistance);
      events.push({
        timeframe,
        levelSource: "previous_day_high",
        levelSide: "up",
        kind,
        intendedDirection,
        hit,
        closeReturn: ((withVol[i + horizonBars].close - current.close) / current.close) * (intendedDirection === "up" ? 1 : -1),
        atrReturn: ((withVol[i + horizonBars].close - current.close) / atr) * (intendedDirection === "up" ? 1 : -1)
      });
    }

    if (!seen.has(`${date}:pdl`) && current.low < levels.low) {
      seen.add(`${date}:pdl`);
      const kind = current.close < levels.low - buffer ? "acceptance_down" : current.close >= levels.low ? "rejection_down_sweep" : "weak_down_break";
      const intendedDirection = kind === "rejection_down_sweep" ? "up" : "down";
      const hit = firstHit(withVol, i, horizonBars, intendedDirection, current.close, targetDistance);
      events.push({
        timeframe,
        levelSource: "previous_day_low",
        levelSide: "down",
        kind,
        intendedDirection,
        hit,
        closeReturn: ((withVol[i + horizonBars].close - current.close) / current.close) * (intendedDirection === "up" ? 1 : -1),
        atrReturn: ((withVol[i + horizonBars].close - current.close) / atr) * (intendedDirection === "up" ? 1 : -1)
      });
    }
  }

  return events;
}

function summarize(events) {
  const byKind = new Map();
  for (const event of events) {
    const key = `${event.timeframe}|${event.levelSource || "previous_candle"}|${event.kind}`;
    if (!byKind.has(key)) byKind.set(key, []);
    byKind.get(key).push(event);
  }
  return [...byKind.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, rows]) => {
    const favorable = rows.filter((row) => row.hit === "favorable_first").length;
    const adverse = rows.filter((row) => row.hit === "adverse_first").length;
    const ambiguous = rows.filter((row) => row.hit === "ambiguous").length;
    const timeout = rows.filter((row) => row.hit === "timeout").length;
    return {
      key,
      timeframe: key.split("|")[0],
      levelSource: key.split("|")[1],
      kind: key.split("|")[2],
      sample: rows.length,
      favorableFirstRate: pct(favorable / rows.length),
      adverseFirstRate: pct(adverse / rows.length),
      ambiguousRate: pct(ambiguous / rows.length),
      timeoutRate: pct(timeout / rows.length),
      avgCloseReturnPct: pct(mean(rows.map((row) => row.closeReturn))),
      medianAtrReturn: fixed(median(rows.map((row) => row.atrReturn)), 3),
      avgAtrReturn: fixed(mean(rows.map((row) => row.atrReturn)), 3)
    };
  });
}

function markdown(result) {
  const lines = [
    "# Level Breakout Acceptance Study",
    "",
    `Generated: ${result.generatedAt}`,
    "",
    "Scope: research-only candle baseline for deciding whether level breaks tend to behave better as acceptance/continuation or sweep/rejection across timeframes. This does not use ATAS Cluster Search; it is the baseline that a Cluster Search strategy must beat.",
    "",
    "Definitions:",
    "",
    "- `acceptance_up/down`: candle breaks previous candle high/low and closes beyond the level by at least `0.05 ATR`.",
    "- `rejection_*_sweep`: candle trades through the previous high/low but closes back inside.",
    "- `weak_*_break`: candle closes barely beyond the level but not enough for acceptance.",
    "- Outcome: whether price reaches `0.5 ATR` favorable before `0.5 ATR` adverse within the timeframe horizon.",
    "",
    "## Summary",
    "",
    "| Symbol | Timeframe | Level | Kind | Sample | Fav first % | Adv first % | Avg close return % | Avg ATR return |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const symbol of result.symbols) {
    for (const row of symbol.summary) {
      lines.push(`| ${symbol.symbol} | ${row.timeframe} | ${row.levelSource} | ${row.kind} | ${row.sample} | ${row.favorableFirstRate} | ${row.adverseFirstRate} | ${row.avgCloseReturnPct} | ${row.avgAtrReturn} |`);
    }
  }

  lines.push(
    "",
    "## Read",
    "",
    "- Candle-only acceptance/rejection is a baseline, not the final strategy.",
    "- A planned-level/Cluster Search strategy is useful only if it improves the false-break filter versus these simple candle buckets.",
    "- The next version should add predefined session levels such as PDH/PDL, VWAP/value approximations, and then public orderflow or ATAS-derived Cluster Search events.",
    "",
    "## Boundary",
    "",
    "No live alert wording, thresholds, scheduler, account/key/API/paid access, demo/testnet, live trading, order, sizing, TP/SL, execution behavior, public posting, or strategy promotion changed."
  );

  return `${lines.join("\n")}\n`;
}

async function main() {
  const config = JSON.parse(await fs.readFile(CONFIG_FILE, "utf8"));
  const symbols = config.data.symbols.filter((symbol) => STUDY.symbols.includes(symbol.symbol));
  const timeframes = config.data.timeframes.filter((timeframe) => STUDY.candleTimeframes.includes(timeframe.id));
  const output = {
    generatedAt: new Date().toISOString(),
    study: STUDY,
    symbols: []
  };

  for (const symbolConfig of symbols) {
    const symbolOut = { symbol: symbolConfig.symbol, timeframes: {}, summary: [] };
    for (const timeframeConfig of timeframes) {
      const fetched = await fetchConfiguredCandles(symbolConfig, { ...timeframeConfig, lookbackDays: STUDY.lookbackDays });
      const events = classifyEvents(fetched.candles, timeframeConfig.id);
      const previousDayEvents = classifyPreviousDayLevelEvents(fetched.candles, timeframeConfig.id);
      symbolOut.timeframes[timeframeConfig.id] = {
        meta: fetched.meta,
        candleRows: fetched.candles.length,
        previousCandleEvents: events.length,
        previousDayLevelEvents: previousDayEvents.length
      };
      symbolOut.summary.push(...summarize([...events, ...previousDayEvents]));

      if (timeframeConfig.id === "1h") {
        const daily = resampleDaily(fetched.candles);
        const dailyEvents = classifyEvents(daily, "1d");
        symbolOut.timeframes["1d"] = { meta: { source: "resampled-from-1h", base: fetched.meta }, candleRows: daily.length, events: dailyEvents.length };
        symbolOut.summary.push(...summarize(dailyEvents));
      }
    }
    output.symbols.push(symbolOut);
  }

  await fs.mkdir(RESULTS_DIR, { recursive: true });
  await fs.writeFile(OUT_JSON, `${JSON.stringify(output, null, 2)}\n`);
  await fs.writeFile(OUT_MD, markdown(output));
  console.log(JSON.stringify({ outJson: OUT_JSON, outMd: OUT_MD, symbols: output.symbols.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
