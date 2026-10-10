#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const BYBIT = "https://api.bybit.com";
const SYMBOL = "BTCUSDT";
const CHECK_MS = Number(process.env.BTC_SHORT_WATCH_CHECK_MS || 30_000);
const EXPIRES_AT_RAW = process.env.BTC_SHORT_WATCH_EXPIRES_AT;
const EXPIRES_AT =
  EXPIRES_AT_RAW === "0" || EXPIRES_AT_RAW === "never"
    ? Infinity
    : Number(EXPIRES_AT_RAW || Date.now() + 2 * 60 * 60_000);
const TELEGRAM_TARGET = process.env.BTC_SHORT_WATCH_TELEGRAM_TARGET || "telegram:1539856256";
const OPENCLAW_BIN = process.env.BTC_SHORT_WATCH_OPENCLAW_BIN || "/home/coder/.npm-global/bin/openclaw";
const LOG_FILE = process.env.BTC_SHORT_WATCH_LOG_FILE || "/home/coder/.openclaw/workspace/.tmp/btc-short-watch-82k.log";

let zoneSeen = false;
let highSeen = 0;
let lastAlertAt = 0;
let lastAlertPrice = null;
let consecutiveFetchErrors = 0;
const REPEAT_ALERT_MS = 45 * 60_000;
const MIN_BETTER_RETEST_ABS = 100;
const MIN_BETTER_RETEST_PCT = 0.0012;
const ALERT_SEED_LOOKBACK_MS = 3 * 60 * 60_000;

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${BYBIT}${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const json = await response.json();
    if (json.retCode !== 0) throw new Error(json.retMsg || `retCode ${json.retCode}`);
    return json.result;
  } finally {
    clearTimeout(timeout);
  }
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

function pct(from, to) {
  return ((to - from) / from) * 100;
}

function fmt(price) {
  return Math.round(price).toLocaleString("en-US");
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

function shouldSendAlert(s, e) {
  if (!e.setup) return { ok: false, reason: "setup false" };
  if (lastAlertAt === 0 || lastAlertPrice === null) return { ok: true, reason: "first setup alert" };

  const elapsed = Date.now() - lastAlertAt;
  if (elapsed <= REPEAT_ALERT_MS) {
    return { ok: false, reason: `repeat throttle ${(elapsed / 60_000).toFixed(1)}m` };
  }

  const minBetterRetest = Math.max(MIN_BETTER_RETEST_ABS, lastAlertPrice * MIN_BETTER_RETEST_PCT);
  const betterRetest = s.mark >= lastAlertPrice + minBetterRetest;
  if (betterRetest) {
    return {
      ok: true,
      reason: `better retest ${fmt(s.mark)} >= ${fmt(lastAlertPrice + minBetterRetest)}`
    };
  }

  return {
    ok: false,
    reason: `stale same setup; mark ${fmt(s.mark)} not better than last alert ${fmt(lastAlertPrice)}`
  };
}

function seedLastAlertFromLog() {
  let text;
  try {
    text = readFileSync(LOG_FILE, "utf8");
  } catch {
    return;
  }

  const lines = text.trimEnd().split("\n");
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (!lines[i].includes("alert send result code=0")) continue;

    for (let j = i - 1; j >= 0; j -= 1) {
      const match = lines[j].match(/^\[([^\]]+)\] mark=([0-9.]+)/);
      if (!match) continue;

      const alertAt = Date.parse(match[1]);
      const alertPrice = Number(match[2]);
      if (!Number.isFinite(alertAt) || !Number.isFinite(alertPrice)) return;
      if (Date.now() - alertAt > ALERT_SEED_LOOKBACK_MS) return;

      lastAlertAt = alertAt;
      lastAlertPrice = alertPrice;
      console.error(`[${nowIso()}] seeded last alert from log at ${match[1]} price=${alertPrice}`);
      return;
    }
  }
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

async function snapshot() {
  const [tickerResult, oneMinuteResult, fiveMinuteResult, tradesResult] = await Promise.all([
    fetchJson(`/v5/market/tickers?category=linear&symbol=${SYMBOL}`),
    fetchJson(`/v5/market/kline?category=linear&symbol=${SYMBOL}&interval=1&limit=30`),
    fetchJson(`/v5/market/kline?category=linear&symbol=${SYMBOL}&interval=5&limit=24`),
    fetchJson(`/v5/market/recent-trade?category=linear&symbol=${SYMBOL}&limit=1000`)
  ]);

  const ticker = tickerResult.list[0];
  const oneMinute = oneMinuteResult.list.map(candle).sort((a, b) => a.time - b.time);
  const fiveMinute = fiveMinuteResult.list.map(candle).sort((a, b) => a.time - b.time);
  const trades = tradesResult.list || [];
  return {
    mark: Number(ticker.markPrice),
    last: Number(ticker.lastPrice),
    index: Number(ticker.indexPrice),
    high24: Number(ticker.highPrice24h),
    low24: Number(ticker.lowPrice24h),
    oneMinute,
    fiveMinute,
    deltaPct: tradeDeltaPct(trades)
  };
}

function evaluate(s) {
  const closed1m = s.oneMinute.slice(0, -1);
  const closed5m = s.fiveMinute.slice(0, -1);
  const last1m = closed1m.at(-1);
  const prev1m = closed1m.at(-2);
  const last5m = closed5m.at(-1);
  const prev5m = closed5m.at(-2);
  const recent1m = closed1m.slice(-8);
  const localLow = Math.min(...recent1m.slice(0, -1).map((c) => c.low));
  const recentHigh = Math.max(s.high24, ...recent1m.map((c) => c.high), highSeen);

  highSeen = Math.max(highSeen, recentHigh);
  if (recentHigh >= 81_950) zoneSeen = true;

  const pullbackFromHighPct = pct(highSeen, s.mark);
  const oneMinuteStructureLoss =
    last1m && last1m.close < localLow && last1m.close < last1m.open && prev1m && last1m.close < prev1m.low;
  const fiveMinuteWeak =
    last5m && prev5m && last5m.close < last5m.open && last5m.close < prev5m.close && pct(highSeen, last5m.close) <= -0.35;
  const flowOk = s.deltaPct <= 5;
  const extensionZone = highSeen >= 81_950;
  const failedContinuation = pullbackFromHighPct <= -0.35 && s.mark < highSeen - 180;
  const setup = extensionZone && zoneSeen && flowOk && (oneMinuteStructureLoss || fiveMinuteWeak) && failedContinuation;

  return {
    setup,
    localLow,
    recentHigh,
    pullbackFromHighPct,
    oneMinuteStructureLoss,
    fiveMinuteWeak,
    flowOk,
    last1m,
    last5m
  };
}

async function main() {
  const expiresText = Number.isFinite(EXPIRES_AT) ? new Date(EXPIRES_AT).toISOString() : "never";
  console.error(`[${nowIso()}] BTC short watch started; expires ${expiresText}`);
  seedLastAlertFromLog();
  while (!Number.isFinite(EXPIRES_AT) || Date.now() < EXPIRES_AT) {
    try {
      const s = await snapshot();
      consecutiveFetchErrors = 0;
      const e = evaluate(s);
      console.error(
        `[${nowIso()}] mark=${s.mark.toFixed(1)} highSeen=${highSeen.toFixed(1)} delta=${s.deltaPct.toFixed(1)} setup=${e.setup}`
      );
      const alertDecision = shouldSendAlert(s, e);
      if (alertDecision.ok) {
        lastAlertAt = Date.now();
        lastAlertPrice = s.mark;
        const invalidation = e.recentHigh + 120;
        const tp1 = Math.max(e.localLow, s.mark - 300);
        const tp2 = Math.max(79_280, s.mark - 650);
        const tp3 = Math.max(78_550, s.mark - 1_100);
        const message = [
          `BTC SHORT CANDIDATE @${fmt(s.mark)} | manual only`,
          `Setup: pump to ${fmt(e.recentHigh)} failing | pullback ${e.pullbackFromHighPct.toFixed(2)}% | flow ${s.deltaPct.toFixed(1)}%`,
          `SL ~${fmt(invalidation)} | TP ${fmt(tp1)}/${fmt(tp2)}/${fmt(tp3)}`,
          "Small size, hard SL, no naked leverage."
        ].join("\n");
        const result = await sendTelegram(message);
        console.error(
          `[${nowIso()}] alert send result code=${result.code} reason=${alertDecision.reason} stdout=${result.stdout}`
        );
      } else if (e.setup) {
        console.error(`[${nowIso()}] alert suppressed reason=${alertDecision.reason}`);
      }
    } catch (error) {
      consecutiveFetchErrors += 1;
      console.error(`[${nowIso()}] fetch/eval failed`, error.message || error);
      if (consecutiveFetchErrors >= 5) {
        await sendTelegram(`BTC short watch fail ${nowIso()}: repeated public data fetch errors. Nespolihat na alert.`);
        return;
      }
    }
    await sleep(CHECK_MS);
  }
  await sendTelegram(`BTC short watch expired ${nowIso()}: no confirmed short entry setup.`);
}

main().catch(async (error) => {
  console.error(`[${nowIso()}] fatal`, error);
  await sendTelegram(`BTC watch error ${nowIso()}: ${error.message || error}. Nespolihat na alert.`);
  process.exitCode = 1;
});
