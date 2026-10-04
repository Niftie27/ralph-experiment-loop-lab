import fs from "node:fs/promises";
import path from "node:path";
import { fetchBinanceSpotCandles } from "./binance-data.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const RESULTS_DIR = path.join(ROOT, "results");
const PAPER_PATH = path.join(ROOT, "paper", "signals.json");
const SNAPSHOT_PATH = path.join(RESULTS_DIR, "edge-snapshot.json");
const SUMMARY_PATH = path.join(RESULTS_DIR, "edge-summary.md");

const nowIso = () => new Date().toISOString();
const round = (n, d = 4) => Number.isFinite(n) ? Number(n.toFixed(d)) : null;
const pct = (n) => Number.isFinite(n) ? `${(n * 100).toFixed(1)}%` : "n/a";
const SYMBOL_FILTER = new Set(
  (process.env.RALPH_BACKTEST_SYMBOLS || "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)
);

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function candleFile(source, productId, timeframeId) {
  return path.join(CANDLE_DIR, `${source}-${productId}-${timeframeId}.json`);
}

async function fetchCoinbaseCandles(productId, granularitySec, lookbackDays) {
  const endMs = Date.now();
  const startMs = endMs - lookbackDays * 24 * 60 * 60 * 1000;
  const stepMs = granularitySec * 290 * 1000;
  const out = new Map();

  for (let cursor = startMs; cursor < endMs; cursor += stepMs) {
    const start = new Date(cursor).toISOString();
    const end = new Date(Math.min(cursor + stepMs, endMs)).toISOString();
    const url = new URL(`https://api.exchange.coinbase.com/products/${productId}/candles`);
    url.searchParams.set("start", start);
    url.searchParams.set("end", end);
    url.searchParams.set("granularity", String(granularitySec));

    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "OpenClaw-RALPH-alert-edge/0.1"
      }
    });
    if (!res.ok) {
      throw new Error(`Coinbase candle fetch failed for ${productId}: ${res.status} ${await res.text()}`);
    }
    const rows = await res.json();
    for (const row of rows) {
      const [time, low, high, open, close, volume] = row;
      if ([time, low, high, open, close, volume].every(Number.isFinite)) {
        out.set(time, { time, open, high, low, close, volume });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  return [...out.values()].sort((a, b) => a.time - b.time);
}

async function loadCandles(symbol, timeframe, config) {
  const sourceId = symbol.binanceSpotSymbol && config.dataSource.startsWith("binance") ? "binance-spot" : "coinbase";
  const file = candleFile(sourceId, sourceId === "binance-spot" ? symbol.binanceSpotSymbol : symbol.productId, timeframe.id);

  if (sourceId === "binance-spot") {
    try {
      const fetched = await fetchBinanceSpotCandles(symbol.binanceSpotSymbol, timeframe.binanceInterval, timeframe.lookbackDays);
      if (fetched.candles.length > 80) {
        await writeJson(file, fetched.candles);
        return { candles: fetched.candles, source: fetched.meta.source, meta: fetched.meta };
      }
    } catch (error) {
      const cached = await readJson(file, null);
      if (cached?.length) {
        return { candles: cached, source: `binance-cache-after-fetch-error: ${error.message}` };
      }
      const coinbase = await loadCoinbaseCandles(symbol.productId, timeframe);
      return { ...coinbase, source: `coinbase-fallback-after-binance-error: ${error.message}` };
    }
  }

  return loadCoinbaseCandles(symbol.productId, timeframe);
}

async function loadCoinbaseCandles(productId, timeframe) {
  const file = candleFile("coinbase", productId, timeframe.id);
  try {
    const fetched = await fetchCoinbaseCandles(productId, timeframe.granularitySec, timeframe.lookbackDays);
    if (fetched.length > 80) {
      await writeJson(file, fetched);
      return { candles: fetched, source: "fresh" };
    }
  } catch (error) {
    const cached = await readJson(file, null);
    if (cached?.length) {
      return { candles: cached, source: `cache-after-fetch-error: ${error.message}` };
    }
    throw error;
  }

  const cached = await readJson(file, []);
  return { candles: cached, source: "cache-empty-fetch" };
}

function sma(candles, i, period, key = "close") {
  if (i + 1 < period) return null;
  let sum = 0;
  for (let j = i - period + 1; j <= i; j += 1) sum += candles[j][key];
  return sum / period;
}

function rollingHigh(candles, i, period) {
  if (i - period < 0) return null;
  let high = -Infinity;
  for (let j = i - period; j < i; j += 1) high = Math.max(high, candles[j].high);
  return high;
}

function rollingLow(candles, i, period) {
  if (i - period < 0) return null;
  let low = Infinity;
  for (let j = i - period; j < i; j += 1) low = Math.min(low, candles[j].low);
  return low;
}

function volumeZ(candles, i, period = 30) {
  if (i + 1 < period) return null;
  const xs = [];
  for (let j = i - period + 1; j <= i; j += 1) xs.push(candles[j].volume);
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
  const sd = Math.sqrt(variance);
  return sd > 0 ? (candles[i].volume - mean) / sd : 0;
}

function atr(candles, i, period = 14) {
  if (i < period) return null;
  let sum = 0;
  for (let j = i - period + 1; j <= i; j += 1) {
    const prevClose = candles[j - 1].close;
    const tr = Math.max(
      candles[j].high - candles[j].low,
      Math.abs(candles[j].high - prevClose),
      Math.abs(candles[j].low - prevClose)
    );
    sum += tr;
  }
  return sum / period;
}

function rsi(candles, i, period = 14) {
  if (i < period) return null;
  let gains = 0;
  let losses = 0;
  for (let j = i - period + 1; j <= i; j += 1) {
    const diff = candles[j].close - candles[j - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

function context(candles, i) {
  const close = candles[i].close;
  const ma20 = sma(candles, i, 20);
  const ma50 = sma(candles, i, 50);
  const atr14 = atr(candles, i, 14);
  const rsi14 = rsi(candles, i, 14);
  const volZ = volumeZ(candles, i, 30);
  if (!ma20 || !ma50 || !atr14 || !rsi14 || volZ === null) return null;

  const trend =
    close > ma50 && ma20 > ma50 ? "up" :
    close < ma50 && ma20 < ma50 ? "down" :
    "range";
  const atrPct = atr14 / close;
  const volatility = atrPct > 0.025 ? "high-vol" : atrPct < 0.01 ? "low-vol" : "mid-vol";
  return { close, ma20, ma50, atr14, atrPct, rsi14, volZ, trend, volatility };
}

function detectSetups(candles, i, ctx) {
  const c = candles[i];
  const prev = candles[i - 1];
  const high20 = rollingHigh(candles, i, 20);
  const low20 = rollingLow(candles, i, 20);
  const setups = [];

  if (ctx.trend === "up" && prev.close < ctx.ma20 && c.close > ctx.ma20 && ctx.rsi14 > 45) {
    setups.push({ name: "trend_pullback_reclaim_long", direction: "long" });
  }
  if (ctx.trend === "down" && prev.close > ctx.ma20 && c.close < ctx.ma20 && ctx.rsi14 < 55) {
    setups.push({ name: "trend_pullback_reject_short", direction: "short" });
  }
  if (high20 && c.close > high20 && ctx.volZ > 0.4 && ctx.rsi14 > 55) {
    setups.push({ name: "range_breakout_long", direction: "long" });
  }
  if (low20 && c.close < low20 && ctx.volZ > 0.4 && ctx.rsi14 < 45) {
    setups.push({ name: "range_breakdown_short", direction: "short" });
  }
  if (prev.close < prev.open && c.close > c.open && ctx.rsi14 < 38 && ctx.trend !== "down") {
    setups.push({ name: "momentum_reversal_long", direction: "long" });
  }
  if (prev.close > prev.open && c.close < c.open && ctx.rsi14 > 62 && ctx.trend !== "up") {
    setups.push({ name: "momentum_reversal_short", direction: "short" });
  }
  return setups;
}

function regimeFields(ctx) {
  return {
    trend: ctx.trend,
    volatility: ctx.volatility,
    regime: `${ctx.trend}/${ctx.volatility}`
  };
}

function tradeLevels(entry, direction, atr14, config) {
  const risk = config.risk.stopAtr * atr14;
  if (direction === "long") {
    return { stop: entry - risk, target: entry + risk * config.risk.targetR, risk };
  }
  return { stop: entry + risk, target: entry - risk * config.risk.targetR, risk };
}

function simulate(candles, startIndex, setup, ctx, timeframe, config) {
  const entry = candles[startIndex].close;
  const { stop, target, risk } = tradeLevels(entry, setup.direction, ctx.atr14, config);
  const maxIndex = Math.min(candles.length - 1, startIndex + timeframe.maxBars);
  const riskPct = Math.abs(risk / entry);
  const roundTripCostPct = 2 * (config.costs.feeBpsPerSide + config.costs.slippageBpsPerSide) / 10000;
  const costR = riskPct > 0 ? roundTripCostPct / riskPct : 0;

  for (let i = startIndex + 1; i <= maxIndex; i += 1) {
    const c = candles[i];
    if (setup.direction === "long") {
      const hitStop = c.low <= stop;
      const hitTarget = c.high >= target;
      if (hitStop) return { rawR: -1, netR: -1 - costR, exitTime: c.time, exitReason: hitTarget ? "stop-first-collision" : "stop" };
      if (hitTarget) return { rawR: config.risk.targetR, netR: config.risk.targetR - costR, exitTime: c.time, exitReason: "target" };
    } else {
      const hitStop = c.high >= stop;
      const hitTarget = c.low <= target;
      if (hitStop) return { rawR: -1, netR: -1 - costR, exitTime: c.time, exitReason: hitTarget ? "stop-first-collision" : "stop" };
      if (hitTarget) return { rawR: config.risk.targetR, netR: config.risk.targetR - costR, exitTime: c.time, exitReason: "target" };
    }
  }

  const exit = candles[maxIndex].close;
  const rawR = setup.direction === "long" ? (exit - entry) / risk : (entry - exit) / risk;
  return { rawR, netR: rawR - costR, exitTime: candles[maxIndex].time, exitReason: "horizon" };
}

function aggregate(trades) {
  if (!trades.length) return null;
  const wins = trades.filter((t) => t.netR > 0);
  const losses = trades.filter((t) => t.netR <= 0);
  const sumR = trades.reduce((a, t) => a + t.netR, 0);
  const grossWin = wins.reduce((a, t) => a + t.netR, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.netR, 0));
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  return {
    sample: trades.length,
    wins: wins.length,
    losses: losses.length,
    winrate: wins.length / trades.length,
    expectancyR: sumR / trades.length,
    medianR: trades.map((t) => t.netR).sort((a, b) => a - b)[Math.floor(trades.length / 2)],
    avgWinR: avgWin,
    avgLossR: avgLoss,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : null
  };
}

function tier(stats, baseline, thresholds) {
  if (!stats || stats.sample < thresholds.low) return "low-sample";
  const lift = baseline ? stats.expectancyR - baseline.expectancyR : 0;
  if (stats.sample >= thresholds.good && stats.expectancyR > 0.18 && lift > 0.08 && stats.profitFactor > 1.35) return "A";
  if (stats.expectancyR > 0.08 && lift > 0.03 && stats.profitFactor > 1.15) return "B";
  if (stats.expectancyR > 0) return "C";
  return "avoid";
}

function tierRank(value) {
  return { A: 0, B: 1, C: 2, "low-sample": 3, avoid: 4 }[value] ?? 5;
}

function baselineTrades(candles, timeframe, direction, config) {
  const trades = [];
  const stride = Math.max(4, Math.floor(timeframe.maxBars / 2));
  for (let i = 60; i < candles.length - timeframe.maxBars - 1; i += stride) {
    const ctx = context(candles, i);
    if (!ctx) continue;
    trades.push(simulate(candles, i, { name: "baseline", direction }, ctx, timeframe, config));
  }
  return trades;
}

async function updatePaperSignals(snapshot, marketData, config) {
  if (!config.paperTrading.enabled) return { open: 0, closed: 0, recent: [] };

  const state = await readJson(PAPER_PATH, { signals: [] });
  const byId = new Map(state.signals.map((s) => [s.id, s]));
  const cutoffMs = Date.now() - config.paperTrading.dedupeLookbackHours * 60 * 60 * 1000;

  for (const candidate of snapshot.latestCandidates) {
    const id = `${candidate.symbol}:${candidate.timeframe}:${candidate.setup}:${candidate.signalTime}`;
    if (byId.has(id)) continue;
    if (candidate.signalTime * 1000 < cutoffMs) continue;
    byId.set(id, {
      id,
      status: "open",
      openedAt: candidate.signalTime,
      symbol: candidate.symbol,
      productId: candidate.productId,
      timeframe: candidate.timeframe,
      setup: candidate.setup,
      direction: candidate.direction,
      trend: candidate.trend,
      volatility: candidate.volatility,
      regime: candidate.regime,
      tier: candidate.tier,
      entry: candidate.entry,
      stop: candidate.stop,
      target: candidate.target,
      maxBars: candidate.maxBars,
      source: "setup-detector-v0"
    });
  }

  let closed = 0;
  for (const signal of byId.values()) {
    const key = `${signal.productId}:${signal.timeframe}`;
    const candles = marketData.get(key);
    if (!candles?.length) continue;
    const startIndex = candles.findIndex((c) => c.time === signal.openedAt);
    if (startIndex < 0) continue;

    if (!signal.regime || !signal.trend || !signal.volatility) {
      const signalContext = context(candles, startIndex);
      if (signalContext) {
        Object.assign(signal, regimeFields(signalContext));
      }
    }

    if (signal.status !== "open") continue;
    const currentIndex = candles.length - 1;
    const maxIndex = Math.min(candles.length - 1, startIndex + signal.maxBars);
    const horizonReady = currentIndex >= startIndex + signal.maxBars;
    const lastEvalIndex = horizonReady ? maxIndex : Math.min(currentIndex, maxIndex);
    for (let i = startIndex + 1; i <= lastEvalIndex; i += 1) {
      const c = candles[i];
      const hitStop = signal.direction === "long" ? c.low <= signal.stop : c.high >= signal.stop;
      const hitTarget = signal.direction === "long" ? c.high >= signal.target : c.low <= signal.target;
      if (hitStop || hitTarget || (horizonReady && i === maxIndex)) {
        signal.status = "closed";
        signal.closedAt = c.time;
        signal.close = hitStop ? signal.stop : hitTarget ? signal.target : c.close;
        signal.exitReason = hitStop ? (hitTarget ? "stop-first-collision" : "stop") : hitTarget ? "target" : "horizon";
        signal.resultR = hitStop ? -1 : hitTarget ? config.risk.targetR : round((signal.direction === "long" ? c.close - signal.entry : signal.entry - c.close) / Math.abs(signal.entry - signal.stop), 4);
        closed += 1;
        break;
      }
    }
  }

  const signals = [...byId.values()].sort((a, b) => b.openedAt - a.openedAt).slice(0, 500);
  await writeJson(PAPER_PATH, { updated: nowIso(), signals });
  return {
    open: signals.filter((s) => s.status === "open").length,
    closed,
    recent: signals.slice(0, 10)
  };
}

async function main() {
  const config = await readJson(CONFIG_PATH);
  const symbols = SYMBOL_FILTER.size
    ? config.symbols.filter((symbol) => SYMBOL_FILTER.has(symbol.symbol))
    : config.symbols;
  if (!symbols.length) {
    throw new Error(`No configured symbols match RALPH_BACKTEST_SYMBOLS=${[...SYMBOL_FILTER].join(",")}`);
  }
  const groups = new Map();
  const groupsAllRegimes = new Map();
  const baselines = new Map();
  const latestCandidates = [];
  const sources = [];
  const marketData = new Map();

  console.log(`Backtest symbols: ${symbols.map((symbol) => symbol.symbol).join(", ")}`);
  for (const symbol of symbols) {
    for (const timeframe of config.timeframes) {
      console.log(`Loading ${symbol.symbol} ${timeframe.id}`);
      const { candles, source, meta } = await loadCandles(symbol, timeframe, config);
      console.log(`Loaded ${symbol.symbol} ${timeframe.id}: ${candles.length} candles from ${source}`);
      sources.push({ productId: symbol.productId, binanceSpotSymbol: symbol.binanceSpotSymbol, timeframe: timeframe.id, candles: candles.length, source, meta });
      marketData.set(`${symbol.productId}:${timeframe.id}`, candles);
      if (candles.length < 90) continue;

      for (const direction of ["long", "short"]) {
        baselines.set(`${symbol.symbol}:${timeframe.id}:${direction}`, aggregate(baselineTrades(candles, timeframe, direction, config)));
      }

      for (let i = 60; i < candles.length - timeframe.maxBars - 1; i += 1) {
        const ctx = context(candles, i);
        if (!ctx) continue;
        for (const setup of detectSetups(candles, i, ctx)) {
          const key = `${symbol.symbol}:${timeframe.id}:${setup.name}:${ctx.trend}:${ctx.volatility}`;
          const result = simulate(candles, i, setup, ctx, timeframe, config);
          const entry = {
            symbol: symbol.symbol,
            productId: symbol.productId,
            timeframe: timeframe.id,
            setup: setup.name,
            direction: setup.direction,
            signalTime: candles[i].time,
            ...regimeFields(ctx),
            entry: candles[i].close,
            ...result
          };
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(entry);
          const allRegimesKey = `${symbol.symbol}:${timeframe.id}:${setup.name}:all`;
          if (!groupsAllRegimes.has(allRegimesKey)) groupsAllRegimes.set(allRegimesKey, []);
          groupsAllRegimes.get(allRegimesKey).push(entry);
        }
      }

      const latestScanStart = Math.max(60, candles.length - 4);
      for (let i = latestScanStart; i < candles.length - 1; i += 1) {
        const ctx = context(candles, i);
        if (!ctx) continue;
        for (const setup of detectSetups(candles, i, ctx)) {
          const key = `${symbol.symbol}:${timeframe.id}:${setup.name}:${ctx.trend}:${ctx.volatility}`;
          const regimeStats = aggregate(groups.get(key) ?? []);
          const overallStats = aggregate(groupsAllRegimes.get(`${symbol.symbol}:${timeframe.id}:${setup.name}:all`) ?? []);
          const displayStats = regimeStats ?? overallStats;
          const baseline = baselines.get(`${symbol.symbol}:${timeframe.id}:${setup.direction}`);
          const levels = tradeLevels(candles[i].close, setup.direction, ctx.atr14, config);
          latestCandidates.push({
            symbol: symbol.symbol,
            productId: symbol.productId,
            timeframe: timeframe.id,
            setup: setup.name,
            direction: setup.direction,
            signalTime: candles[i].time,
            signalIso: new Date(candles[i].time * 1000).toISOString(),
            ...regimeFields(ctx),
            tier: tier(regimeStats, baseline, config.sampleThresholds),
            entry: round(candles[i].close, 8),
            stop: round(levels.stop, 8),
            target: round(levels.target, 8),
            maxBars: timeframe.maxBars,
            statsScope: regimeStats ? "regime" : overallStats ? "all-regimes-fallback" : null,
            stats: displayStats && {
              sample: displayStats.sample,
              winrate: round(displayStats.winrate, 4),
              expectancyR: round(displayStats.expectancyR, 4),
              profitFactor: round(displayStats.profitFactor, 4)
            },
            regimeStats: regimeStats && {
              sample: regimeStats.sample,
              winrate: round(regimeStats.winrate, 4),
              expectancyR: round(regimeStats.expectancyR, 4),
              profitFactor: round(regimeStats.profitFactor, 4)
            },
            baseline: baseline && {
              sample: baseline.sample,
              winrate: round(baseline.winrate, 4),
              expectancyR: round(baseline.expectancyR, 4)
            }
          });
        }
      }
    }
  }

  const setupStats = [];
  for (const [key, trades] of groups.entries()) {
    const [symbol, timeframe, setup, trend, volatility] = key.split(":");
    const direction = setup.endsWith("_short") ? "short" : "long";
    const stats = aggregate(trades);
    const baseline = baselines.get(`${symbol}:${timeframe}:${direction}`);
    setupStats.push({
      symbol,
      timeframe,
      setup,
      direction,
      trend,
      volatility,
      regime: `${trend}/${volatility}`,
      tier: tier(stats, baseline, config.sampleThresholds),
      stats: {
        sample: stats.sample,
        winrate: round(stats.winrate, 4),
        expectancyR: round(stats.expectancyR, 4),
        medianR: round(stats.medianR, 4),
        avgWinR: round(stats.avgWinR, 4),
        avgLossR: round(stats.avgLossR, 4),
        profitFactor: round(stats.profitFactor, 4)
      },
      baseline: baseline && {
        sample: baseline.sample,
        winrate: round(baseline.winrate, 4),
        expectancyR: round(baseline.expectancyR, 4)
      }
    });
  }

  setupStats.sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || (b.stats.expectancyR ?? -999) - (a.stats.expectancyR ?? -999));
  latestCandidates.sort((a, b) => b.signalTime - a.signalTime);

  const snapshot = {
    generated: nowIso(),
    status: "paper-only-no-live-execution",
    assumptions: {
      dataSource: config.dataSource,
      costs: config.costs,
      risk: config.risk,
      sameCandleCollision: "stop-first"
    },
    sources,
    setupStats,
    latestCandidates: latestCandidates.slice(0, 20)
  };

  snapshot.paper = await updatePaperSignals(snapshot, marketData, config);
  await writeJson(SNAPSHOT_PATH, snapshot);

  const top = setupStats.slice(0, 12).map((s) => (
    `| ${s.tier} | ${s.symbol} | ${s.timeframe} | ${s.setup} | ${s.regime} | ${s.stats.sample} | ${pct(s.stats.winrate)} | ${round(s.stats.expectancyR, 3)} | ${round(s.stats.profitFactor, 2)} | ${s.baseline ? round(s.baseline.expectancyR, 3) : "n/a"} |`
  )).join("\n");
  const candidates = snapshot.latestCandidates.length
    ? snapshot.latestCandidates.map((c) => `- ${c.signalIso} ${c.symbol} ${c.timeframe} ${c.direction} ${c.setup}: ${c.tier}, winrate ${c.stats ? pct(c.stats.winrate) : "n/a"}, exp ${c.stats ? round(c.stats.expectancyR, 3) : "n/a"}R`).join("\n")
    : "- No fresh setup candidates on the last completed candles.";

  await fs.writeFile(SUMMARY_PATH, `# Liquid Crypto Alert Edge Snapshot\n\nGenerated: ${snapshot.generated}\n\nStatus: paper-only, no live execution.\n\n## Top Historical Buckets\n\nLow-sample buckets are ranked below A/B/C candidates even if their raw expectancy looks high.\n\n| Tier | Symbol | TF | Setup | Regime | N | Winrate | Exp R | PF | Baseline Exp R |\n| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |\n${top}\n\n## Latest Detected Setups\n\nThese are paper-only detections, not trade instructions. Avoid and low-sample rows are learning inputs, not high-probability alerts.\n\n${candidates}\n\n## Paper State\n\nOpen: ${snapshot.paper.open}\nClosed this run: ${snapshot.paper.closed}\n\n`);

  console.log(`Wrote ${SNAPSHOT_PATH}`);
  console.log(`Wrote ${SUMMARY_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
