import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

const BINANCE_ARCHIVE = "https://data.binance.vision/data/spot";
const BINANCE_REST = "https://api.binance.com/api/v3/klines";
const CACHE_DIR = path.resolve(new URL("../data/binance-archive-cache", import.meta.url).pathname);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dayKey(date) {
  return `${monthKey(date)}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function addMonths(date, n) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1));
}

function datesBetween(startMs, endMs) {
  const out = [];
  let cursor = new Date(startMs);
  cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate()));
  const end = new Date(endMs);
  while (cursor <= end) {
    out.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return out;
}

function archiveUrl(kind, symbol, interval, key) {
  return `${BINANCE_ARCHIVE}/${kind}/klines/${symbol}/${interval}/${symbol}-${interval}-${key}.zip`;
}

function cacheFileForUrl(url) {
  const u = new URL(url);
  return path.join(CACHE_DIR, `${u.pathname.replaceAll("/", "__")}.csv`);
}

async function fetchZipCsv(url) {
  const cacheFile = cacheFileForUrl(url);
  try {
    return await fs.readFile(cacheFile, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const res = await fetch(url, {
    headers: {
      "Accept": "application/zip,text/csv,*/*",
      "User-Agent": "OpenClaw-RALPH-alert-edge/0.1"
    }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Binance archive fetch failed: ${res.status} ${url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  const csv = unzipSingleFile(bytes).toString("utf8");
  await fs.mkdir(path.dirname(cacheFile), { recursive: true });
  await fs.writeFile(cacheFile, csv);
  return csv;
}

function unzipSingleFile(bytes) {
  if (bytes.readUInt32LE(0) !== 0x04034b50) {
    throw new Error("Unsupported ZIP: missing local file header");
  }
  const compressionMethod = bytes.readUInt16LE(8);
  const compressedSize = bytes.readUInt32LE(18);
  const fileNameLength = bytes.readUInt16LE(26);
  const extraLength = bytes.readUInt16LE(28);
  const dataStart = 30 + fileNameLength + extraLength;
  const compressed = bytes.subarray(dataStart, dataStart + compressedSize);

  if (compressionMethod === 0) return compressed;
  if (compressionMethod === 8) return zlib.inflateRawSync(compressed);
  throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
}

function parseKlineCsv(csv) {
  const rows = [];
  for (const line of csv.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols = line.split(",");
    const rawOpenTime = Number(cols[0]);
    if (!Number.isFinite(rawOpenTime)) continue;
    const open = Number(cols[1]);
    const high = Number(cols[2]);
    const low = Number(cols[3]);
    const close = Number(cols[4]);
    const volume = Number(cols[5]);
    if ([open, high, low, close, volume].every(Number.isFinite)) {
      rows.push({ time: normalizeTimestampSeconds(rawOpenTime), open, high, low, close, volume });
    }
  }
  return rows;
}

function parseRestKlines(rows) {
  return rows.map((row) => ({
    time: normalizeTimestampSeconds(Number(row[0])),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5])
  })).filter((c) => [c.time, c.open, c.high, c.low, c.close, c.volume].every(Number.isFinite));
}

function normalizeTimestampSeconds(value) {
  if (value > 1e14) return Math.floor(value / 1_000_000);
  if (value > 1e11) return Math.floor(value / 1_000);
  return Math.floor(value);
}

async function fetchRestTail(symbol, interval, startMs) {
  const url = new URL(BINANCE_REST);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("startTime", String(startMs));
  url.searchParams.set("limit", "1000");
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "OpenClaw-RALPH-alert-edge/0.1"
    }
  });
  if (!res.ok) throw new Error(`Binance REST klines failed: ${res.status} ${await res.text()}`);
  return parseRestKlines(await res.json());
}

export async function fetchBinanceSpotCandles(symbol, interval, lookbackDays) {
  const endMs = Date.now();
  const startMs = endMs - lookbackDays * 24 * 60 * 60 * 1000;
  const start = new Date(startMs);
  const now = new Date(endMs);
  const currentMonth = monthKey(now);
  const rows = new Map();
  const attempted = [];

  for (let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)); monthKey(cursor) < currentMonth; cursor = addMonths(cursor, 1)) {
    const key = monthKey(cursor);
    const url = archiveUrl("monthly", symbol, interval, key);
    attempted.push(url);
    const csv = await fetchZipCsv(url);
    if (csv) {
      for (const candle of parseKlineCsv(csv)) {
        if (candle.time * 1000 >= startMs) rows.set(candle.time, candle);
      }
    }
    await sleep(80);
  }

  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const currentMonthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  for (const date of datesBetween(Math.max(startMs, currentMonthStart), yesterday.getTime())) {
    const key = dayKey(date);
    const url = archiveUrl("daily", symbol, interval, key);
    attempted.push(url);
    const csv = await fetchZipCsv(url);
    if (csv) {
      for (const candle of parseKlineCsv(csv)) {
        if (candle.time * 1000 >= startMs) rows.set(candle.time, candle);
      }
    }
    await sleep(80);
  }

  const restStartMs = Math.max(startMs, endMs - 45 * 24 * 60 * 60 * 1000);
  for (const candle of await fetchRestTail(symbol, interval, restStartMs)) {
    if (candle.time * 1000 >= startMs) rows.set(candle.time, candle);
  }

  return {
    candles: [...rows.values()].sort((a, b) => a.time - b.time),
    meta: {
      source: "binance-public-archive-rest-tail",
      archiveFilesAttempted: attempted.length,
      restTailStart: new Date(restStartMs).toISOString()
    }
  };
}
