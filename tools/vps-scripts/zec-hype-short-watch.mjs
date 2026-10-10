#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const BYBIT = "https://api.bybit.com";
const BTC_SYMBOL = "BTCUSDT";
const CHECK_MS = Number(process.env.ALT_SHORT_WATCH_CHECK_MS || 30_000);
const TELEGRAM_TARGET = process.env.ALT_SHORT_WATCH_TELEGRAM_TARGET || "telegram:1539856256";
const OPENCLAW_BIN = process.env.ALT_SHORT_WATCH_OPENCLAW_BIN || "/home/coder/.npm-global/bin/openclaw";
const LOG_FILE = process.env.ALT_SHORT_WATCH_LOG_FILE || "/home/coder/.openclaw/workspace/.tmp/zec-hype-short-watch.log";
const FETCH_TIMEOUT_MS = Number(process.env.ALT_SHORT_WATCH_FETCH_TIMEOUT_MS || 12_000);
const FETCH_RETRIES = Number(process.env.ALT_SHORT_WATCH_FETCH_RETRIES || 2);
const REPEAT_ALERT_MS = 45 * 60_000;
const MIN_BETTER_RETEST_PCT = 0.002;
const ALERT_SEED_LOOKBACK_MS = 3 * 60 * 60_000;

const CONFIGS = [
  {
    symbol: "ZECUSDT",
    label: "ZEC",
    rejectLow: 956,
    rejectHigh: 989,
    baseTrigger: 940,
    flowMaxPct: 5,
    minPullbackAbs: 7,
    minPullbackPct: 0.45,
    slPadMin: 5,
    targets: [939, 934, 923],
    note: "cleanest as retest-fail; no chasing after first dump"
  },
  {
    symbol: "HYPEUSDT",
    label: "HYPE",
    rejectLow: 84.23,
    rejectHigh: 85.13,
    baseTrigger: 83.79,
    flowMaxPct: 5,
    minPullbackAbs: 0.24,
    minPullbackPct: 0.35,
    slPadMin: 0.15,
    targets: [83.76, 83.42, 82.75],
    note: "closer to actionable; still needs rejection plus structure loss"
  }
];

const state = new Map(
  CONFIGS.map((config) => [
    config.symbol,
    { zoneSeen: false, highSeen: 0, lastAlertAt: 0, lastAlertPrice: null, consecutiveFetchErrors: 0 }
  ])
);

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientFetchError(error) {
  const name = error?.name || "";
  const message = String(error?.message || error || "");
  return (
    name === "AbortError" ||
    name === "TimeoutError" ||
    message.includes("aborted") ||
    message.includes("timeout") ||
    message.includes("UND_ERR") ||
    message.includes("fetch failed") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("EAI_AGAIN")
  );
}

async function fetchJson(path) {
  let lastError;
  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt += 1) {
    try {
      const response = await fetch(`${BYBIT}${path}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const json = await response.json();
      if (json.retCode !== 0) throw new Error(json.retMsg || `retCode ${json.retCode}`);
      return json.result;
    } catch (error) {
      lastError = error;
      if (!isTransientFetchError(error) || attempt >= FETCH_RETRIES) break;
      await sleep(500 * (attempt + 1));
    }
  }
  throw lastError;
}

function candle(row) {
  return {
    time: Number(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5])
  };
}

function atr(candles, n = 14) {
  const ranges = [];
  for (let i = 1; i < candles.length; i += 1) {
    ranges.push(
      Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      )
    );
  }
  const slice = ranges.slice(-n);
  return slice.reduce((sum, value) => sum + value, 0) / Math.max(1, slice.length);
}

function pct(from, to) {
  return ((to - from) / from) * 100;
}

function fmt(price, digits = price >= 100 ? 2 : 3) {
  return Number(price).toLocaleString("en-US", { maximumFractionDigits: digits });
}

function tradeDeltaPct(trades) {
  let buy = 0;
  let sell = 0;
  for (const trade of trades) {
    const notional = Number(trade.price) * Number(trade.size);
    if (!Number.isFinite(notional)) continue;
    if (trade.side === "Buy") buy += notional;
    else sell += notional;
  }
  const total = buy + sell;
  return total > 0 ? ((buy - sell) / total) * 100 : 0;
}

function sendTelegram(message) {
  return new Promise((resolve) => {
    const child = spawn(
      OPENCLAW_BIN,
      ["message", "send", "--channel", "telegram", "--target", TELEGRAM_TARGET, "--message", message],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() }));
  });
}

function shouldSendAlert(config, snapshotData, evaluation, symbolState) {
  if (!evaluation.setup) return { ok: false, reason: "setup false" };
  if (symbolState.lastAlertAt === 0 || symbolState.lastAlertPrice === null) {
    return { ok: true, reason: "first setup alert" };
  }

  const elapsed = Date.now() - symbolState.lastAlertAt;
  if (elapsed <= REPEAT_ALERT_MS) {
    return { ok: false, reason: `repeat throttle ${(elapsed / 60_000).toFixed(1)}m` };
  }

  const minBetterRetest = Math.max(config.minPullbackAbs * 0.75, symbolState.lastAlertPrice * MIN_BETTER_RETEST_PCT);
  const betterRetest = snapshotData.mark >= symbolState.lastAlertPrice + minBetterRetest;
  if (betterRetest) {
    return {
      ok: true,
      reason: `better retest ${fmt(snapshotData.mark)} >= ${fmt(symbolState.lastAlertPrice + minBetterRetest)}`
    };
  }

  return {
    ok: false,
    reason: `stale same setup; mark ${fmt(snapshotData.mark)} not better than last alert ${fmt(symbolState.lastAlertPrice)}`
  };
}

function seedLastAlertsFromLog() {
  let text;
  try {
    text = readFileSync(LOG_FILE, "utf8");
  } catch {
    return;
  }

  const lines = text.trimEnd().split("\n");
  const seen = new Set();
  for (let i = lines.length - 1; i >= 0 && seen.size < CONFIGS.length; i -= 1) {
    const sentMatch = lines[i].match(/(ZECUSDT|HYPEUSDT) alert send result code=0/);
    if (!sentMatch) continue;

    const symbol = sentMatch[1];
    if (seen.has(symbol)) continue;
    for (let j = i - 1; j >= 0; j -= 1) {
      const markMatch = lines[j].match(new RegExp(`^\\[([^\\]]+)\\] ${symbol} mark=([0-9.]+)`));
      if (!markMatch) continue;

      const alertAt = Date.parse(markMatch[1]);
      const alertPrice = Number(markMatch[2]);
      if (!Number.isFinite(alertAt) || !Number.isFinite(alertPrice)) break;
      if (Date.now() - alertAt > ALERT_SEED_LOOKBACK_MS) break;

      const symbolState = state.get(symbol);
      symbolState.lastAlertAt = alertAt;
      symbolState.lastAlertPrice = alertPrice;
      seen.add(symbol);
      console.error(`[${nowIso()}] ${symbol} seeded last alert from log at ${markMatch[1]} price=${alertPrice}`);
      break;
    }
  }
}

async function snapshot(symbol) {
  const [tickerResult, oneMinuteResult, fiveMinuteResult, tradesResult] = await Promise.all([
    fetchJson(`/v5/market/tickers?category=linear&symbol=${symbol}`),
    fetchJson(`/v5/market/kline?category=linear&symbol=${symbol}&interval=1&limit=60`),
    fetchJson(`/v5/market/kline?category=linear&symbol=${symbol}&interval=5&limit=48`),
    fetchJson(`/v5/market/recent-trade?category=linear&symbol=${symbol}&limit=1000`)
  ]);

  const ticker = tickerResult.list[0];
  return {
    mark: Number(ticker.markPrice),
    last: Number(ticker.lastPrice),
    high24: Number(ticker.highPrice24h),
    low24: Number(ticker.lowPrice24h),
    oneMinute: oneMinuteResult.list.map(candle).sort((a, b) => a.time - b.time),
    fiveMinute: fiveMinuteResult.list.map(candle).sort((a, b) => a.time - b.time),
    deltaPct: tradeDeltaPct(tradesResult.list || [])
  };
}

function evaluateBtcContext(snapshotData) {
  const closed1m = snapshotData.oneMinute.slice(0, -1);
  const closed5m = snapshotData.fiveMinute.slice(0, -1);
  const last1m = closed1m.at(-1);
  const prev1m = closed1m.at(-2);
  const last5m = closed5m.at(-1);
  const prev5m = closed5m.at(-2);
  const recent1m = closed1m.slice(-12);
  const recentHigh = Math.max(snapshotData.high24, ...recent1m.map((c) => c.high));
  const microLow = Math.min(...recent1m.slice(0, -1).map((c) => c.low));
  const pullbackAbs = recentHigh - snapshotData.mark;
  const nearBreakout = pullbackAbs < 350;
  const oneMinuteLoss =
    last1m && prev1m && last1m.close < microLow && last1m.close < last1m.open && last1m.close < prev1m.low;
  const fiveMinuteWeak = last5m && prev5m && last5m.close < last5m.open && last5m.close < prev5m.close;
  const aggressivePush =
    last1m &&
    prev1m &&
    last5m &&
    snapshotData.deltaPct > 25 &&
    snapshotData.mark > recentHigh - 120 &&
    last1m.close > prev1m.high &&
    last5m.close >= last5m.open;
  const confirmedRejection = snapshotData.deltaPct <= 0 && (oneMinuteLoss || fiveMinuteWeak || pullbackAbs >= 350);
  const breakoutRiskBlocked = nearBreakout && !(oneMinuteLoss && fiveMinuteWeak && snapshotData.deltaPct <= 0);
  const okForAltShort = !aggressivePush && !breakoutRiskBlocked && confirmedRejection;

  return {
    okForAltShort,
    aggressivePush,
    breakoutRiskBlocked,
    nearBreakout,
    oneMinuteLoss,
    fiveMinuteWeak,
    mark: snapshotData.mark,
    recentHigh,
    pullbackAbs,
    microLow,
    deltaPct: snapshotData.deltaPct
  };
}

function evaluate(config, snapshotData, btcContext) {
  const symbolState = state.get(config.symbol);
  const closed1m = snapshotData.oneMinute.slice(0, -1);
  const closed5m = snapshotData.fiveMinute.slice(0, -1);
  const last1m = closed1m.at(-1);
  const prev1m = closed1m.at(-2);
  const last5m = closed5m.at(-1);
  const prev5m = closed5m.at(-2);
  const recent1m = closed1m.slice(-10);
  const a1 = atr(closed1m);
  const a5 = atr(closed5m);
  const microLow = Math.min(...recent1m.slice(0, -1).map((c) => c.low));
  const recentHigh = Math.max(snapshotData.high24, ...recent1m.map((c) => c.high), symbolState.highSeen);

  symbolState.highSeen = Math.max(symbolState.highSeen, recentHigh);
  if (recentHigh >= config.rejectLow) symbolState.zoneSeen = true;

  const dynamicTrigger = Math.max(config.baseTrigger, microLow);
  const pullbackAbs = symbolState.highSeen - snapshotData.mark;
  const pullbackPct = -pct(symbolState.highSeen, snapshotData.mark);
  const oneMinuteStructureLoss =
    last1m &&
    prev1m &&
    last1m.close < dynamicTrigger &&
    last1m.close < last1m.open &&
    last1m.close < prev1m.low;
  const fiveMinuteWeak =
    last5m &&
    prev5m &&
    last5m.close < last5m.open &&
    last5m.close < prev5m.close &&
    last5m.close < dynamicTrigger;
  const flowOk = snapshotData.deltaPct <= config.flowMaxPct;
  const failedContinuation =
    pullbackAbs >= Math.max(config.minPullbackAbs, a5 * 0.75) && pullbackPct >= config.minPullbackPct;
  const acceptedAbove = last5m && last5m.close > config.rejectHigh && snapshotData.mark > config.rejectHigh;
  const setup =
    symbolState.zoneSeen &&
    btcContext.okForAltShort &&
    !acceptedAbove &&
    flowOk &&
    failedContinuation &&
    (oneMinuteStructureLoss || fiveMinuteWeak);

  return {
    setup,
    acceptedAbove,
    dynamicTrigger,
    recentHigh: symbolState.highSeen,
    pullbackAbs,
    pullbackPct,
    btcOk: btcContext.okForAltShort,
    flowOk,
    oneMinuteStructureLoss,
    fiveMinuteWeak,
    atr1: a1,
    atr5: a5
  };
}

function alertMessage(config, snapshotData, evaluation, btcContext) {
  const slPad = Math.max(config.slPadMin, evaluation.atr1 * 1.6, evaluation.atr5 * 0.35);
  const invalidation = evaluation.recentHigh + slPad;
  return [
    `${config.label} SHORT CANDIDATE @${fmt(snapshotData.mark)} | manual only`,
    `BTC OK @${fmt(btcContext.mark)} | high ${fmt(btcContext.recentHigh)} | flow ${btcContext.deltaPct.toFixed(1)}%`,
    `Setup: reject ${fmt(evaluation.recentHigh)} failed | pullback ${evaluation.pullbackPct.toFixed(2)}% | flow ${snapshotData.deltaPct.toFixed(1)}%`,
    `SL ~${fmt(invalidation)} | TP ${config.targets.map((target) => fmt(target)).join("/")}`,
    "Small size, hard SL, no naked leverage."
  ].join("\n");
}

async function checkConfig(config, btcContext) {
  const symbolState = state.get(config.symbol);
  try {
    const data = await snapshot(config.symbol);
    symbolState.consecutiveFetchErrors = 0;
    const evaluation = evaluate(config, data, btcContext);
    console.error(
      `[${nowIso()}] ${config.symbol} mark=${data.mark} highSeen=${evaluation.recentHigh} delta=${data.deltaPct.toFixed(
        1
      )} trigger=${evaluation.dynamicTrigger.toFixed(4)} btcOk=${evaluation.btcOk} setup=${evaluation.setup} note=${
        config.note
      }`
    );
    const alertDecision = shouldSendAlert(config, data, evaluation, symbolState);
    if (alertDecision.ok) {
      symbolState.lastAlertAt = Date.now();
      symbolState.lastAlertPrice = data.mark;
      const result = await sendTelegram(alertMessage(config, data, evaluation, btcContext));
      console.error(
        `[${nowIso()}] ${config.symbol} alert send result code=${result.code} reason=${alertDecision.reason} stdout=${result.stdout}`
      );
    } else if (evaluation.setup) {
      console.error(`[${nowIso()}] ${config.symbol} alert suppressed reason=${alertDecision.reason}`);
    }
  } catch (error) {
    symbolState.consecutiveFetchErrors += 1;
    console.error(`[${nowIso()}] ${config.symbol} fetch/eval failed`, error.message || error);
    if (symbolState.consecutiveFetchErrors >= 5) {
      symbolState.consecutiveFetchErrors = 0;
      await sendTelegram(`${config.label} short watch fail ${nowIso()}: repeated public data fetch errors.`);
    }
  }
}

async function main() {
  console.error(`[${nowIso()}] ZEC/HYPE short watch started; expires never`);
  seedLastAlertsFromLog();
  let consecutiveBtcGateErrors = 0;
  while (true) {
    let btcContext;
    try {
      btcContext = evaluateBtcContext(await snapshot(BTC_SYMBOL));
      consecutiveBtcGateErrors = 0;
    } catch (error) {
      consecutiveBtcGateErrors += 1;
      console.error(
        `[${nowIso()}] BTC gate fetch/eval failed count=${consecutiveBtcGateErrors}`,
        error.message || error
      );
      if (consecutiveBtcGateErrors >= 5) {
        consecutiveBtcGateErrors = 0;
        await sendTelegram(`ZEC/HYPE short watch degraded ${nowIso()}: repeated BTC public data fetch errors.`);
      }
      await sleep(CHECK_MS);
      continue;
    }
    console.error(
      `[${nowIso()}] BTC gate mark=${btcContext.mark} high=${btcContext.recentHigh} delta=${btcContext.deltaPct.toFixed(
        1
      )} nearBreakout=${btcContext.nearBreakout} breakoutRiskBlocked=${btcContext.breakoutRiskBlocked} aggressivePush=${
        btcContext.aggressivePush
      } okForAltShort=${btcContext.okForAltShort}`
    );
    await Promise.all(CONFIGS.map((config) => checkConfig(config, btcContext)));
    await sleep(CHECK_MS);
  }
}

main().catch(async (error) => {
  console.error(`[${nowIso()}] fatal`, error);
  await sendTelegram(`ZEC/HYPE watch error ${nowIso()}: ${error.message || error}. Nespolihat na alert.`);
  process.exitCode = 1;
});
