import fs from "node:fs/promises";
import path from "node:path";
import { fetchBinanceSpotCandles } from "../../btc-eth-alert-edge/src/binance-data.mjs";

const BYBIT_KLINE_URL = "https://api.bybit.com/v5/market/kline";
const BYBIT_INSTRUMENTS_URL = "https://api.bybit.com/v5/market/instruments-info";
const BYBIT_FUNDING_URL = "https://api.bybit.com/v5/market/funding/history";
const BYBIT_OPEN_INTEREST_URL = "https://api.bybit.com/v5/market/open-interest";
const CACHE_DIR = path.resolve(new URL("../data/market-cache", import.meta.url).pathname);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchConfiguredCandles(symbolConfig, timeframeConfig) {
  const provider = symbolConfig.provider || "binance-spot";
  if (provider === "binance-spot") {
    const fetched = await fetchBinanceSpotCandles(
      symbolConfig.binanceSpotSymbol,
      timeframeConfig.binanceInterval,
      timeframeConfig.lookbackDays
    );
    return {
      candles: fetched.candles,
      meta: {
        ...fetched.meta,
        source: "binance-public-archive-rest-tail",
        provider,
        market: "spot"
      }
    };
  }

  if (provider === "bybit-linear") {
    const fetched = await fetchBybitLinearCandles(symbolConfig.bybitSymbol, timeframeConfig.bybitInterval, timeframeConfig.lookbackDays);
    if (symbolConfig.features?.length) {
      return attachBybitLinearFeatures(fetched, symbolConfig.bybitSymbol, timeframeConfig.bybitInterval, symbolConfig.features);
    }
    return fetched;
  }

  throw new Error(`Unsupported market-data provider: ${provider}`);
}

export async function attachBybitLinearFeatures(fetched, symbol, interval, featureNames, options = {}) {
  const candles = fetched.candles;
  if (!candles.length) return fetched;

  const startMs = candles[0].time * 1000;
  const endMs = candles.at(-1).time * 1000;
  const fundingRows = featureNames.includes("funding")
    ? await fetchBybitLinearFundingHistory(symbol, startMs, endMs, options)
    : [];
  const openInterestRows = featureNames.includes("openInterest")
    ? await fetchBybitLinearOpenInterest(symbol, bybitOpenInterestInterval(interval), startMs, endMs, options)
    : [];
  const enriched = attachFunding(attachOpenInterest(candles, openInterestRows), fundingRows);

  return {
    candles: enriched,
    meta: {
      ...fetched.meta,
      features: {
        funding: {
          enabled: featureNames.includes("funding"),
          rows: fundingRows.length,
          candlesWithFunding: enriched.filter((candle) => Number.isFinite(candle.fundingRate)).length
        },
        openInterest: {
          enabled: featureNames.includes("openInterest"),
          rows: openInterestRows.length,
          candlesWithOpenInterest: enriched.filter((candle) => Number.isFinite(candle.openInterest)).length,
          candlesWithOpenInterestChange: enriched.filter((candle) => Number.isFinite(candle.openInterestChangePct)).length
        }
      }
    }
  };
}

export async function fetchBybitLinearCandles(symbol, interval, lookbackDays, options = {}) {
  const endMs = options.endMs ?? Date.now();
  const startMs = options.startMs ?? endMs - lookbackDays * 24 * 60 * 60 * 1000;
  const cacheFile = bybitCacheFile(symbol, interval, startMs, endMs);
  if (!options.disableCache) {
    const cached = await readJsonIfExists(cacheFile);
    if (cached) return cached;
  }

  try {
    const instrument = await fetchBybitLinearInstrument(symbol);
    const rows = new Map();
    let cursorEndMs = endMs;
    let requests = 0;
    const intervalMs = bybitIntervalMs(interval);

    while (cursorEndMs >= startMs) {
      const url = new URL(BYBIT_KLINE_URL);
      url.searchParams.set("category", "linear");
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("interval", interval);
      url.searchParams.set("start", String(startMs));
      url.searchParams.set("end", String(cursorEndMs));
      url.searchParams.set("limit", "1000");

      const payload = await fetchBybitJson(url);
      const parsed = parseBybitKlines(payload.result?.list || []);
      requests += 1;
      if (!parsed.length) break;

      for (const candle of parsed) {
        if (candle.time * 1000 >= startMs && candle.time * 1000 <= endMs) rows.set(candle.time, candle);
      }

      const oldestMs = Math.min(...parsed.map((candle) => candle.time * 1000));
      const nextEndMs = oldestMs - intervalMs;
      if (nextEndMs >= cursorEndMs) break;
      cursorEndMs = nextEndMs;
      await sleep(options.sleepMs ?? 80);
    }

    const result = {
      candles: [...rows.values()].sort((a, b) => a.time - b.time),
      meta: {
        source: "bybit-v5-linear-kline",
        provider: "bybit-linear",
        market: "linear_perpetual",
        symbol,
        requestedLookbackDays: lookbackDays,
        instrumentLaunchTime: instrument.launchTime ? new Date(Number(instrument.launchTime)).toISOString() : null,
        requests
      }
    };

    if (!options.disableCache) {
      await fs.mkdir(path.dirname(cacheFile), { recursive: true });
      await fs.writeFile(cacheFile, `${JSON.stringify(result, null, 2)}\n`);
    }
    return result;
  } catch (error) {
    const fallback = options.disableCache ? null : await readLatestBybitCache(`bybit-linear-${symbol}-${interval}-`);
    if (fallback) {
      return {
        ...fallback,
        meta: {
          ...fallback.meta,
          source: `${fallback.meta?.source ?? "bybit-cache"}-latest-cache-after-fetch-error`,
          fetchError: error.message
        }
      };
    }
    throw error;
  }
}

export function parseBybitKlines(rows) {
  return rows.map((row) => ({
    time: Math.floor(Number(row[0]) / 1000),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5])
  })).filter((candle) => [candle.time, candle.open, candle.high, candle.low, candle.close, candle.volume].every(Number.isFinite));
}

export function parseBybitFundingRows(rows) {
  return rows.map((row) => ({
    time: Math.floor(Number(row.fundingRateTimestamp) / 1000),
    fundingRate: Number(row.fundingRate)
  })).filter((row) => [row.time, row.fundingRate].every(Number.isFinite));
}

export function parseBybitOpenInterestRows(rows) {
  return rows.map((row) => ({
    time: Math.floor(Number(row.timestamp) / 1000),
    openInterest: Number(row.openInterest)
  })).filter((row) => [row.time, row.openInterest].every(Number.isFinite));
}

export async function fetchBybitLinearFundingHistory(symbol, startMs, endMs, options = {}) {
  const cacheFile = bybitFeatureCacheFile("funding", symbol, "8h", startMs, endMs);
  if (!options.disableCache) {
    const cached = await readJsonIfExists(cacheFile);
    if (cached) return cached;
  }

  const rows = new Map();
  try {
    let cursorEndMs = endMs;
    while (cursorEndMs >= startMs) {
      const url = new URL(BYBIT_FUNDING_URL);
      url.searchParams.set("category", "linear");
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("startTime", String(startMs));
      url.searchParams.set("endTime", String(cursorEndMs));
      url.searchParams.set("limit", "200");
      const payload = await fetchBybitJson(url);
      const parsed = parseBybitFundingRows(payload.result?.list || []);
      if (!parsed.length) break;
      for (const row of parsed) rows.set(row.time, row);
      const oldestMs = Math.min(...parsed.map((row) => row.time * 1000));
      const nextEndMs = oldestMs - 1;
      if (nextEndMs >= cursorEndMs) break;
      cursorEndMs = nextEndMs;
      await sleep(options.sleepMs ?? 80);
    }
  } catch (error) {
    const fallback = options.disableCache ? null : await readLatestBybitCache(`bybit-linear-${symbol}-funding-8h-`);
    if (fallback) return fallback;
    throw error;
  }

  const result = [...rows.values()].sort((a, b) => a.time - b.time);
  if (!options.disableCache) {
    await fs.mkdir(path.dirname(cacheFile), { recursive: true });
    await fs.writeFile(cacheFile, `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

export async function fetchBybitLinearOpenInterest(symbol, intervalTime, startMs, endMs, options = {}) {
  const cacheFile = bybitFeatureCacheFile("open-interest", symbol, intervalTime, startMs, endMs);
  if (!options.disableCache) {
    const cached = await readJsonIfExists(cacheFile);
    if (cached) return cached;
  }

  const rows = new Map();
  try {
    let cursorEndMs = endMs;
    while (cursorEndMs >= startMs) {
      const url = new URL(BYBIT_OPEN_INTEREST_URL);
      url.searchParams.set("category", "linear");
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("intervalTime", intervalTime);
      url.searchParams.set("startTime", String(startMs));
      url.searchParams.set("endTime", String(cursorEndMs));
      url.searchParams.set("limit", "200");
      const payload = await fetchBybitJson(url);
      const parsed = parseBybitOpenInterestRows(payload.result?.list || []);
      if (!parsed.length) break;
      for (const row of parsed) rows.set(row.time, row);
      const oldestMs = Math.min(...parsed.map((row) => row.time * 1000));
      const nextEndMs = oldestMs - bybitOpenInterestIntervalMs(intervalTime);
      if (nextEndMs >= cursorEndMs) break;
      cursorEndMs = nextEndMs;
      await sleep(options.sleepMs ?? 80);
    }
  } catch (error) {
    const fallback = options.disableCache ? null : await readLatestBybitCache(`bybit-linear-${symbol}-open-interest-${intervalTime}-`);
    if (fallback) return fallback;
    throw error;
  }

  const result = [...rows.values()].sort((a, b) => a.time - b.time);
  if (!options.disableCache) {
    await fs.mkdir(path.dirname(cacheFile), { recursive: true });
    await fs.writeFile(cacheFile, `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

function attachFunding(candles, fundingRows) {
  if (!fundingRows.length) return candles;
  const sortedFunding = [...fundingRows].sort((a, b) => a.time - b.time);
  let fundingIndex = 0;
  return candles.map((candle) => {
    while (fundingIndex + 1 < sortedFunding.length && sortedFunding[fundingIndex + 1].time <= candle.time) {
      fundingIndex += 1;
    }
    const funding = sortedFunding[fundingIndex]?.time <= candle.time ? sortedFunding[fundingIndex] : null;
    return funding ? { ...candle, fundingRate: funding.fundingRate } : candle;
  });
}

function attachOpenInterest(candles, openInterestRows) {
  if (!openInterestRows.length) return candles;
  const byTime = new Map(openInterestRows.map((row) => [row.time, row.openInterest]));
  let previousOpenInterest = null;
  return candles.map((candle) => {
    const openInterest = byTime.get(candle.time);
    if (!Number.isFinite(openInterest)) return candle;
    const openInterestChangePct = Number.isFinite(previousOpenInterest) && previousOpenInterest > 0
      ? (openInterest - previousOpenInterest) / previousOpenInterest * 100
      : null;
    previousOpenInterest = openInterest;
    return {
      ...candle,
      openInterest,
      openInterestChangePct
    };
  });
}

async function fetchBybitLinearInstrument(symbol) {
  const url = new URL(BYBIT_INSTRUMENTS_URL);
  url.searchParams.set("category", "linear");
  url.searchParams.set("symbol", symbol);
  const payload = await fetchBybitJson(url);
  const instrument = payload.result?.list?.[0];
  if (!instrument) throw new Error(`Bybit linear instrument not found: ${symbol}`);
  return instrument;
}

async function fetchBybitJson(url) {
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "OpenClaw-RALPH-strategy-filter/0.1"
    }
  });
  if (!res.ok) throw new Error(`Bybit API failed: ${res.status} ${await res.text()}`);
  const payload = await res.json();
  if (payload.retCode !== 0) throw new Error(`Bybit API retCode ${payload.retCode}: ${payload.retMsg}`);
  return payload;
}

function bybitIntervalMs(interval) {
  if (interval === "D") return 24 * 60 * 60 * 1000;
  const minutes = Number(interval);
  if (!Number.isFinite(minutes)) throw new Error(`Unsupported Bybit interval: ${interval}`);
  return minutes * 60 * 1000;
}

function bybitOpenInterestInterval(interval) {
  if (interval === "60") return "1h";
  if (interval === "240") return "4h";
  if (interval === "D") return "1d";
  throw new Error(`Unsupported Bybit open-interest interval for kline interval: ${interval}`);
}

function bybitOpenInterestIntervalMs(intervalTime) {
  if (intervalTime === "1h") return 60 * 60 * 1000;
  if (intervalTime === "4h") return 4 * 60 * 60 * 1000;
  if (intervalTime === "1d") return 24 * 60 * 60 * 1000;
  throw new Error(`Unsupported Bybit open-interest interval: ${intervalTime}`);
}

function bybitCacheFile(symbol, interval, startMs, endMs) {
  const start = new Date(startMs).toISOString().slice(0, 10);
  const end = new Date(endMs).toISOString().slice(0, 10);
  return path.join(CACHE_DIR, `bybit-linear-${symbol}-${interval}-${start}-${end}.json`);
}

function bybitFeatureCacheFile(kind, symbol, interval, startMs, endMs) {
  const start = new Date(startMs).toISOString().slice(0, 10);
  const end = new Date(endMs).toISOString().slice(0, 10);
  return path.join(CACHE_DIR, `bybit-linear-${symbol}-${kind}-${interval}-${start}-${end}.json`);
}

async function readJsonIfExists(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function readLatestBybitCache(prefix) {
  let entries = [];
  try {
    entries = await fs.readdir(CACHE_DIR, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  const candidates = await Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.startsWith(prefix) && entry.name.endsWith(".json"))
    .map(async (entry) => {
      const file = path.join(CACHE_DIR, entry.name);
      const stat = await fs.stat(file);
      return { file, mtimeMs: stat.mtimeMs };
    }));
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  for (const candidate of candidates) {
    const parsed = await readJsonIfExists(candidate.file);
    if (parsed) return parsed;
  }
  return null;
}
