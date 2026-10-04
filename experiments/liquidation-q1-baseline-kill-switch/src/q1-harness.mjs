#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_CONFIG_PATH = new URL("../config.default.json", import.meta.url);
const OXARCHIVE_BASE_URL = "https://api.0xarchive.io/v1";
const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";

export async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  if (!command || command === "help" || command === "--help") {
    printHelp();
    return;
  }

  if (command === "preflight") {
    console.log(JSON.stringify(await preflight(), null, 2));
    return;
  }

  if (command === "fetch") {
    const options = parseArgs(rest);
    const outDir = required(options, "out");
    await fs.mkdir(outDir, { recursive: true });
    const result = await fetchWindow({
      symbol: required(options, "symbol"),
      start: parseTime(required(options, "start")),
      end: parseTime(required(options, "end")),
      interval: options.interval ?? "5m",
      outDir,
      apiKey: process.env.OXARCHIVE_API_KEY,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "run") {
    const options = parseArgs(rest);
    const config = await loadConfig(options.config);
    const candles = await readRecords(required(options, "candles"));
    const liquidations = await readRecords(required(options, "liquidations"));
    const report = runBacktest({ candles, liquidations, config });
    if (options.out) {
      await fs.mkdir(path.dirname(options.out), { recursive: true });
      await fs.writeFile(options.out, `${JSON.stringify(report, null, 2)}\n`);
    }
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

export async function preflight() {
  const endTime = Date.now();
  const startTime = endTime - 3 * 60 * 60 * 1000;
  const candleProbe = await fetch(HYPERLIQUID_INFO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: { coin: "BTC", interval: "1h", startTime, endTime },
    }),
  });
  const candles = candleProbe.ok ? await candleProbe.json() : [];

  return {
    hyperliquidCandleSnapshot: {
      ok: candleProbe.ok,
      status: candleProbe.status,
      returnedCandles: Array.isArray(candles) ? candles.length : null,
      verifiedLimit: "Official docs state only the most recent 5000 candles are available.",
    },
    oxarchive: {
      apiKeyPresent: Boolean(process.env.OXARCHIVE_API_KEY),
      requiredForHistoricalRun: true,
      routes: [
        "/v1/hyperliquid/liquidations/{symbol}",
        "/v1/hyperliquid/candles/{symbol}",
      ],
    },
  };
}

export async function fetchWindow({ symbol, start, end, interval, outDir, apiKey }) {
  if (!apiKey) {
    throw new Error("OXARCHIVE_API_KEY is required for historical 0xArchive fetches.");
  }

  const symbols = String(symbol).split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
  const windows = [];
  for (const currentSymbol of symbols) {
    const liquidations = await fetchPaged(`/hyperliquid/liquidations/${encodeURIComponent(currentSymbol)}`, {
        start,
        end,
        limit: 1000,
      }, apiKey);
    const candles = await fetchPaged(`/hyperliquid/candles/${encodeURIComponent(currentSymbol)}`, {
        start,
        end,
        interval,
        limit: 10000,
      }, apiKey);
    windows.push({
      symbol: currentSymbol,
      liquidations: liquidations.map((row) => ({ symbol: currentSymbol, ...row })),
      candles: candles.map((row) => ({ symbol: currentSymbol, ...row })),
    });
  }
  const taggedLiquidations = windows.flatMap((window) => window.liquidations);
  const taggedCandles = windows.flatMap((window) => window.candles);

  const candlePath = path.join(outDir, "candles.json");
  const liquidationPath = path.join(outDir, "liquidations.json");
  await fs.writeFile(candlePath, `${JSON.stringify(taggedCandles, null, 2)}\n`);
  await fs.writeFile(liquidationPath, `${JSON.stringify(taggedLiquidations, null, 2)}\n`);

  return {
    symbols,
    interval,
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    candles: taggedCandles.length,
    liquidations: taggedLiquidations.length,
    files: { candles: candlePath, liquidations: liquidationPath },
  };
}

async function fetchPaged(route, params, apiKey) {
  const rows = [];
  let cursor = undefined;

  do {
    const url = new URL(`${OXARCHIVE_BASE_URL}${route}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    if (cursor) url.searchParams.set("cursor", cursor);

    const response = await fetchWithRetry(url, { headers: { "X-API-Key": apiKey } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success === false) {
      throw new Error(`0xArchive ${route} failed: HTTP ${response.status} ${JSON.stringify(body)}`);
    }

    rows.push(...unwrapRows(body));
    cursor = body.meta?.next_cursor ?? body.next_cursor ?? null;
  } while (cursor);

  return rows;
}

async function fetchWithRetry(url, options, attempts = 6) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, options);
    if (response.status !== 429 || attempt === attempts) return response;

    let retryAfterMs = 1000 * attempt;
    const retryAfterHeader = response.headers.get("retry-after");
    const body = await response.clone().json().catch(() => null);
    if (body?.retry_after != null) retryAfterMs = Number(body.retry_after) * 1000;
    else if (retryAfterHeader != null && Number.isFinite(Number(retryAfterHeader))) retryAfterMs = Number(retryAfterHeader) * 1000;
    await sleep(retryAfterMs + 250);
  }
}

export function runBacktest({ candles, liquidations, config }) {
  const normalizedCandles = normalizeCandles(candles);
  const normalizedLiquidations = normalizeLiquidations(liquidations);
  const intervalMs = inferIntervalMs(normalizedCandles);

  const liquidationSignals = buildLiquidationSignals({
    candles: normalizedCandles,
    liquidations: normalizedLiquidations,
    intervalMs,
    config,
  });
  const candleSignals = buildCandleBaselineSignals(normalizedCandles, config);
  const drawdownSignals = buildDrawdownBaselineSignals(normalizedCandles, config);

  const strategies = {
    liquidationCascade: evaluateSignals(normalizedCandles, liquidationSignals, config),
    largeCandleReversal: evaluateSignals(normalizedCandles, candleSignals, config),
    drawdownReversal: evaluateSignals(normalizedCandles, drawdownSignals, config),
  };

  const diagnostics = {
    volatilityProxyCorrelation: correlation(
      liquidationSignals.map((signal) => signal.notionalUsd),
      liquidationSignals.map((signal) => Math.abs(signal.triggerMovePct ?? 0)),
      config.minVolProxyObservations,
    ),
    crossAssetCascadeClustering: crossAssetCascadeClustering(liquidationSignals, config),
  };

  return {
    generatedAt: new Date().toISOString(),
    input: {
      candleCount: normalizedCandles.length,
      liquidationCount: normalizedLiquidations.length,
      firstCandle: normalizedCandles[0]?.timeIso ?? null,
      lastCandle: normalizedCandles.at(-1)?.timeIso ?? null,
      symbols: [...new Set(normalizedCandles.map((candle) => candle.symbol))].sort(),
    },
    config,
    signalCounts: {
      liquidationCascade: liquidationSignals.length,
      largeCandleReversal: candleSignals.length,
      drawdownReversal: drawdownSignals.length,
    },
    strategies,
    diagnostics,
    verdict: decide({ strategies, diagnostics, config }),
  };
}

function buildLiquidationSignals({ candles, liquidations, intervalMs, config }) {
  const bySymbol = groupBy(candles, (candle) => candle.symbol);
  const windowMs = config.cascadeWindowMinutes * 60 * 1000;
  const bySymbolSide = groupBy(
    liquidations.filter((liq) => liquidationTradeSide(liq)),
    (liq) => `${liq.symbol}|${liquidationTradeSide(liq)}`,
  );
  const signals = [];

  for (const group of bySymbolSide.values()) {
    const sorted = group.sort(compareSymbolTime);
    const side = liquidationTradeSide(sorted[0]);
    const series = bySymbol.get(sorted[0].symbol) ?? [];
    if (!series.length) continue;

    const bucketTotals = new Map();
    for (const row of sorted) {
      const bucket = Math.floor(row.time / windowMs) * windowMs;
      bucketTotals.set(bucket, (bucketTotals.get(bucket) ?? 0) + row.price * row.size);
    }

    let start = 0;
    let notionalUsd = 0;
    let priceSum = 0;
    for (let index = 0; index < sorted.length; index += 1) {
      const liq = sorted[index];
      notionalUsd += liq.price * liq.size;
      priceSum += liq.price;

      const windowStart = liq.time - windowMs;
      while (sorted[start]?.time <= windowStart) {
        notionalUsd -= sorted[start].price * sorted[start].size;
        priceSum -= sorted[start].price;
        start += 1;
      }

      const eventCount = index - start + 1;
      const threshold = rollingBucketThreshold({ bucketTotals, now: liq.time, windowMs, config });
      if (eventCount < config.minSameDirectionEvents) continue;
      if (notionalUsd < threshold) continue;

      const eventIndex = findCandleIndexAtOrAfter(series, liq.time);
      if (eventIndex < 1) continue;

      const candle = series[eventIndex];
      const previous = series[eventIndex - 1];
      const referencePrice = liq.price || candle.close;
      signals.push({
        strategy: "liquidationCascade",
        symbol: liq.symbol,
        time: liq.time,
        timeIso: new Date(liq.time).toISOString(),
        side,
        entryIndex: eventIndex + config.entryDelayCandles,
        limitPrice: passiveLimitPrice(referencePrice, side, config),
        referencePrice,
        notionalUsd,
        relativeThresholdUsd: threshold,
        eventCount,
        triggerMovePct: (candle.close - previous.close) / previous.close,
        metadata: {
          avgLiquidationPrice: priceSum / eventCount,
          windowMinutes: windowMs / 60000,
          intervalMinutes: intervalMs / 60000,
          pointInTime: true,
        },
      });
    }
  }

  return dedupeSignals(signals, config);
}

function buildCandleBaselineSignals(candles, config) {
  const bySymbol = groupBy(candles, (candle) => candle.symbol);
  const signals = [];
  for (const [symbol, series] of bySymbol.entries()) {
    for (let index = 1; index < series.length; index += 1) {
      const move = (series[index].close - series[index - 1].close) / series[index - 1].close;
      if (move <= -config.baselineMovePct) {
        signals.push(withPassiveLimit({ strategy: "largeCandleReversal", symbol, time: series[index].time, side: "long", entryIndex: index + 1 + config.entryDelayCandles, triggerMovePct: move, referencePrice: series[index].close }, config));
      } else if (move >= config.baselineMovePct) {
        signals.push(withPassiveLimit({ strategy: "largeCandleReversal", symbol, time: series[index].time, side: "short", entryIndex: index + 1 + config.entryDelayCandles, triggerMovePct: move, referencePrice: series[index].close }, config));
      }
    }
  }
  return dedupeSignals(signals, config);
}

function buildDrawdownBaselineSignals(candles, config) {
  const bySymbol = groupBy(candles, (candle) => candle.symbol);
  const signals = [];
  for (const [symbol, series] of bySymbol.entries()) {
    for (let index = config.drawdownLookbackCandles; index < series.length; index += 1) {
      const lookback = series.slice(index - config.drawdownLookbackCandles, index);
      const rollingHigh = Math.max(...lookback.map((candle) => candle.high));
      const rollingLow = Math.min(...lookback.map((candle) => candle.low));
      const close = series[index].close;
      if (close <= rollingHigh * (1 - config.drawdownPct)) {
        signals.push(withPassiveLimit({ strategy: "drawdownReversal", symbol, time: series[index].time, side: "long", entryIndex: index + 1 + config.entryDelayCandles, triggerMovePct: (close - rollingHigh) / rollingHigh, referencePrice: close }, config));
      } else if (close >= rollingLow * (1 + config.drawdownPct)) {
        signals.push(withPassiveLimit({ strategy: "drawdownReversal", symbol, time: series[index].time, side: "short", entryIndex: index + 1 + config.entryDelayCandles, triggerMovePct: (close - rollingLow) / rollingLow, referencePrice: close }, config));
      }
    }
  }
  return dedupeSignals(signals, config);
}

function evaluateSignals(candles, signals, config) {
  const bySymbol = groupBy(candles, (candle) => candle.symbol);
  const opportunities = [];

  for (const signal of signals) {
    const series = bySymbol.get(signal.symbol) ?? [];
    const entryIndex = signal.entryIndex;
    if (entryIndex < 0 || entryIndex >= series.length - 1) continue;
    const opportunity = evaluateOpportunity({ series, signal, entryIndex, config });
    if (opportunity) opportunities.push(opportunity);
  }

  return summarizeOpportunities(opportunities, config);
}

function evaluateOpportunity({ series, signal, entryIndex, config }) {
  const direction = signal.side === "long" ? 1 : -1;
  const limitPrice = signal.limitPrice;
  const lastEntryIndex = Math.min(series.length - 1, entryIndex + config.entryLookaheadCandles);
  let fillIndex = null;
  let fillFraction = 0;

  for (let index = entryIndex; index <= lastEntryIndex; index += 1) {
    const candle = series[index];
    const tradedThrough = direction === 1 ? candle.low <= limitPrice : candle.high >= limitPrice;
    if (!tradedThrough) continue;
    const adverseDepth = direction === 1
      ? Math.max(0, (limitPrice - candle.low) / limitPrice)
      : Math.max(0, (candle.high - limitPrice) / limitPrice);
    fillFraction = Math.max(0.05, Math.min(1, adverseDepth / config.partialFillFullDepthPct));
    fillIndex = index;
    break;
  }

  const base = {
    strategy: signal.strategy,
    symbol: signal.symbol,
    side: signal.side,
    signalTime: new Date(signal.time).toISOString(),
    limitPrice,
    triggerMovePct: signal.triggerMovePct ?? null,
    notionalUsd: signal.notionalUsd ?? null,
    relativeThresholdUsd: signal.relativeThresholdUsd ?? null,
    eventCount: signal.eventCount ?? null,
  };

  if (fillIndex == null) {
    return {
      ...base,
      filled: false,
      fillFraction: 0,
      netReturn: 0,
      grossReturn: 0,
      reason: "missed",
    };
  }

  const entry = limitPrice;
  const exitIndexLimit = Math.min(series.length - 1, fillIndex + config.holdCandles);
  let exitIndex = exitIndexLimit;
  let exit = series[exitIndexLimit].close;
  let reason = "time";

  for (let index = fillIndex; index <= exitIndexLimit; index += 1) {
    const candle = series[index];
    if (direction === 1) {
      if (candle.low <= entry * (1 - config.stopLossPct)) {
        exitIndex = index;
        exit = entry * (1 - config.stopLossPct);
        reason = "stop";
        break;
      }
      if (candle.high >= entry * (1 + config.takeProfitPct)) {
        exitIndex = index;
        exit = entry * (1 + config.takeProfitPct);
        reason = "takeProfit";
        break;
      }
    } else {
      if (candle.high >= entry * (1 + config.stopLossPct)) {
        exitIndex = index;
        exit = entry * (1 + config.stopLossPct);
        reason = "stop";
        break;
      }
      if (candle.low <= entry * (1 - config.takeProfitPct)) {
        exitIndex = index;
        exit = entry * (1 - config.takeProfitPct);
        reason = "takeProfit";
        break;
      }
    }
  }

  const grossReturn = direction * ((exit - entry) / entry);
  const roundTripCost = 2 * ((config.feeBpsPerSide + config.slippageBpsPerSide) / 10000);
  const netReturn = (grossReturn - roundTripCost) * fillFraction;

  return {
    ...base,
    filled: true,
    fillFraction,
    entryTime: series[fillIndex].timeIso,
    exitTime: series[exitIndex].timeIso,
    entry,
    exit,
    grossReturn,
    netReturn,
    reason,
  };
}

function summarizeOpportunities(opportunities, config) {
  const filled = opportunities.filter((trade) => trade.filled);
  const returns = opportunities.map((trade) => trade.netReturn);
  const filledReturns = filled.map((trade) => trade.netReturn);
  const wins = filledReturns.filter((value) => value > 0).length;
  const sortedPositive = returns.filter((value) => value > 0).sort((a, b) => b - a);
  const outlierCutoff = sum(sortedPositive.slice(0, config.topOutlierCount));
  const dailyReturns = dailyClusterReturns(opportunities);
  const sharpe = sharpeLike(returns);
  const sortino = sortinoLike(returns);
  return {
    opportunities: opportunities.length,
    trades: filled.length,
    fillRate: opportunities.length ? filled.length / opportunities.length : null,
    winRate: filled.length ? wins / filled.length : null,
    meanReturn: meanOrNull(returns),
    meanFilledReturn: meanOrNull(filledReturns),
    medianReturn: quantile(returns, 0.5),
    tail5PctReturn: quantile(returns, 0.05),
    worstReturn: returns.length ? Math.min(...returns) : null,
    totalReturnApprox: returns.reduce((sum, value) => sum + value, 0),
    totalReturnWithoutTopOutliers: returns.reduce((sum, value) => sum + value, 0) - outlierCutoff,
    worstClusteredDayReturn: dailyReturns.length ? Math.min(...dailyReturns.map((row) => row.return)) : null,
    sharpeLike: sharpe,
    sortinoLike: sortino,
    riskAdjustedScore: sortino ?? sharpe ?? meanOrNull(returns),
    exitReasons: countBy(opportunities, (trade) => trade.reason),
    clusteredDaysPreview: dailyReturns.slice(0, 10),
    tradesPreview: opportunities.slice(0, 10),
  };
}

function decide({ strategies, diagnostics, config }) {
  const liq = strategies.liquidationCascade;
  const baselines = [strategies.largeCandleReversal, strategies.drawdownReversal];
  const bestBaseline = Math.max(...baselines.map((strategy) => strategy.meanReturn ?? -Infinity));
  const bestBaselineRiskAdjusted = Math.max(...baselines.map((strategy) => strategy.riskAdjustedScore ?? -Infinity));
  const edge = liq.meanReturn == null ? null : liq.meanReturn - bestBaseline;
  const riskAdjustedEdge = liq.riskAdjustedScore == null ? null : liq.riskAdjustedScore - bestBaselineRiskAdjusted;
  const minEdge = config.minEdgeBps / 10000;
  const volProxyCorrelation = diagnostics.volatilityProxyCorrelation;

  const blockers = [];
  if (!liq.opportunities) blockers.push("no liquidation-cascade opportunities");
  if (!liq.trades) blockers.push("no liquidation-cascade fills");
  if (liq.meanReturn == null || liq.meanReturn <= 0) blockers.push("liquidation EV is not positive after costs");
  if (edge == null || edge < minEdge) blockers.push("liquidation signal does not beat dumb baselines by minEdgeBps");
  if (riskAdjustedEdge == null || riskAdjustedEdge <= config.minRiskAdjustedEdge) blockers.push("liquidation signal does not beat dumb baselines risk-adjusted");
  if (liq.worstReturn != null && liq.worstReturn < config.maxWorstTradePct) blockers.push("worst trade breaches tail threshold");
  if (liq.tail5PctReturn != null && liq.tail5PctReturn < config.maxTail5Pct) blockers.push("5th-percentile tail breaches threshold");
  if (liq.totalReturnWithoutTopOutliers != null && liq.totalReturnWithoutTopOutliers <= config.minReturnWithoutTopOutliers) blockers.push("PnL depends on top outlier wins");
  if (liq.worstClusteredDayReturn != null && liq.worstClusteredDayReturn < config.maxWorstClusteredDayReturn) blockers.push("one clustered-loss day breaches threshold");
  if (volProxyCorrelation != null && Math.abs(volProxyCorrelation) > config.maxVolProxyCorrelation) blockers.push("liquidation signal is too correlated with volatility proxy");

  return {
    decision: blockers.length ? "do_not_build" : "proceed_to_q2",
    edgeVsBestBaseline: edge,
    riskAdjustedEdgeVsBestBaseline: Number.isFinite(riskAdjustedEdge) ? riskAdjustedEdge : null,
    bestBaselineMeanReturn: Number.isFinite(bestBaseline) ? bestBaseline : null,
    bestBaselineRiskAdjusted: Number.isFinite(bestBaselineRiskAdjusted) ? bestBaselineRiskAdjusted : null,
    blockers,
  };
}

function crossAssetCascadeClustering(signals, config) {
  const symbols = new Set(signals.map((signal) => signal.symbol));
  if (symbols.size < 2) {
    return {
      evaluated: false,
      reason: "single-symbol input; cannot evaluate cross-asset cascade clustering",
    };
  }
  const windowMs = config.cascadeWindowMinutes * 60 * 1000;
  let clustered = 0;
  for (const signal of signals) {
    const hasOtherSymbol = signals.some((other) => (
      other !== signal &&
      other.symbol !== signal.symbol &&
      Math.abs(other.time - signal.time) <= windowMs
    ));
    if (hasOtherSymbol) clustered += 1;
  }
  return {
    evaluated: true,
    symbols: [...symbols].sort(),
    clusteredShare: signals.length ? clustered / signals.length : null,
  };
}

function rollingBucketThreshold({ bucketTotals, now, windowMs, config }) {
  const currentBucket = Math.floor(now / windowMs) * windowMs;
  const observed = [];
  for (let offset = 1; offset <= config.rollingLiquidationLookbackWindows; offset += 1) {
    observed.push(bucketTotals.get(currentBucket - offset * windowMs) ?? 0);
  }
  const baseline = observed.length ? quantile(observed, 0.75) : 0;
  return Math.max(config.minLiquidationNotionalUsd, baseline * config.minLiquidationNotionalMultiple);
}

function withPassiveLimit(signal, config) {
  return {
    ...signal,
    limitPrice: passiveLimitPrice(signal.referencePrice, signal.side, config),
  };
}

function passiveLimitPrice(referencePrice, side, config) {
  return side === "long"
    ? referencePrice * (1 - config.passiveLimitOffsetPct)
    : referencePrice * (1 + config.passiveLimitOffsetPct);
}

function dailyClusterReturns(opportunities) {
  const byDay = groupBy(opportunities, (trade) => trade.signalTime.slice(0, 10));
  return [...byDay.entries()]
    .map(([day, rows]) => ({
      day,
      return: sum(rows.map((row) => row.netReturn)),
      opportunities: rows.length,
      fills: rows.filter((row) => row.filled).length,
      symbols: [...new Set(rows.map((row) => row.symbol))].sort(),
    }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function normalizeCandles(rows) {
  return unwrapRows(rows).map((row) => {
    const time = parseTime(row.timestamp ?? row.time ?? row.t);
    const symbol = String(row.symbol ?? row.coin ?? "UNKNOWN").toUpperCase();
    return {
      symbol,
      time,
      timeIso: new Date(time).toISOString(),
      open: numberField(row.open ?? row.o, "open"),
      high: numberField(row.high ?? row.h, "high"),
      low: numberField(row.low ?? row.l, "low"),
      close: numberField(row.close ?? row.c, "close"),
      volume: Number(row.volume ?? row.v ?? 0),
    };
  }).sort(compareSymbolTime);
}

function normalizeLiquidations(rows) {
  return unwrapRows(rows).map((row) => {
    const price = numberField(row.price ?? row.px, "price");
    const size = numberField(row.size ?? row.sz, "size");
    return {
      symbol: String(row.symbol ?? row.coin ?? "UNKNOWN").toUpperCase(),
      time: parseTime(row.timestamp ?? row.time ?? row.t),
      price,
      size,
      direction: row.direction ?? row.dir ?? null,
      side: row.side ?? null,
      markPrice: row.mark_price == null ? null : Number(row.mark_price),
    };
  }).sort(compareSymbolTime);
}

function liquidationTradeSide(liq) {
  const direction = String(liq.direction ?? "").toLowerCase();
  if (direction.includes("close long")) return "long";
  if (direction.includes("close short")) return "short";

  const side = String(liq.side ?? "").toUpperCase();
  if (side === "A") return "short";
  if (side === "B") return "long";
  return null;
}

function dedupeSignals(signals, config) {
  const bySymbol = groupBy(signals.sort(compareSymbolTime), (signal) => signal.symbol);
  const deduped = [];
  for (const series of bySymbol.values()) {
    let lastEntryIndex = -Infinity;
    for (const signal of series) {
      if (signal.entryIndex - lastEntryIndex < config.cooldownCandles) continue;
      deduped.push(signal);
      lastEntryIndex = signal.entryIndex;
    }
  }
  return deduped;
}

async function readRecords(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  if (filePath.endsWith(".json")) return JSON.parse(text);
  if (filePath.endsWith(".csv")) return parseCsv(text);
  throw new Error(`Unsupported data file extension: ${filePath}`);
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(headerLine);
  return lines.filter(Boolean).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line) {
  const out = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current);
  return out;
}

async function loadConfig(configPath) {
  const base = JSON.parse(await fs.readFile(DEFAULT_CONFIG_PATH, "utf8"));
  if (!configPath) return base;
  const override = JSON.parse(await fs.readFile(configPath, "utf8"));
  return { ...base, ...override };
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected positional argument: ${arg}`);
    const key = arg.slice(2);
    const value = args[index + 1];
    if (value == null || value.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = value;
      index += 1;
    }
  }
  return parsed;
}

function required(options, key) {
  if (options[key] == null || options[key] === true) throw new Error(`Missing required --${key}`);
  return options[key];
}

function parseTime(value) {
  if (typeof value === "number") return value;
  if (/^\d+$/.test(String(value))) return Number(value);
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new Error(`Invalid timestamp: ${value}`);
  return time;
}

function numberField(value, name) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid numeric field ${name}: ${value}`);
  return parsed;
}

function unwrapRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  throw new Error("Expected an array or response envelope with data[]");
}

function inferIntervalMs(candles) {
  const deltas = [];
  const bySymbol = groupBy(candles, (candle) => candle.symbol);
  for (const series of bySymbol.values()) {
    for (let i = 1; i < Math.min(series.length, 20); i += 1) {
      deltas.push(series[i].time - series[i - 1].time);
    }
  }
  return quantile(deltas, 0.5) ?? 0;
}

function findCandleIndexAtOrAfter(series, time) {
  let lo = 0;
  let hi = series.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (series[mid].time >= time) {
      found = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return found;
}

function compareSymbolTime(a, b) {
  return a.symbol.localeCompare(b.symbol) || a.time - b.time;
}

function groupBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

function countBy(rows, keyFn) {
  const counts = {};
  for (const row of rows) {
    const key = keyFn(row);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mean(values) {
  return sum(values) / values.length;
}

function meanOrNull(values) {
  return values.length ? mean(values) : null;
}

function quantile(values, q) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function correlation(xs, ys, minPairs = 2) {
  const pairs = xs.map((x, index) => [x, ys[index]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < minPairs) return null;
  const xMean = mean(pairs.map(([x]) => x));
  const yMean = mean(pairs.map(([, y]) => y));
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;
  for (const [x, y] of pairs) {
    numerator += (x - xMean) * (y - yMean);
    xDenominator += (x - xMean) ** 2;
    yDenominator += (y - yMean) ** 2;
  }
  const denominator = Math.sqrt(xDenominator * yDenominator);
  return denominator ? numerator / denominator : null;
}

function sharpeLike(values) {
  if (values.length < 2) return null;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  const stdev = Math.sqrt(variance);
  if (stdev < 1e-12) return null;
  return stdev ? avg / stdev * Math.sqrt(values.length) : null;
}

function sortinoLike(values) {
  if (values.length < 2) return null;
  const avg = mean(values);
  const downside = values.filter((value) => value < 0);
  if (!downside.length) return null;
  const downsideDeviation = Math.sqrt(mean(downside.map((value) => value ** 2)));
  return downsideDeviation ? avg / downsideDeviation * Math.sqrt(values.length) : null;
}

function printHelp() {
  console.log(`Usage:
  q1-harness.mjs preflight
  q1-harness.mjs fetch --symbol BTC,ETH,SOL --start ISO --end ISO --interval 5m --out data/window
  q1-harness.mjs run --candles candles.json --liquidations liquidations.json [--config config.json] [--out result.json]`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
