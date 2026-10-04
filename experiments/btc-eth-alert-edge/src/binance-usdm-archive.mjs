#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

const BINANCE_USDM_ARCHIVE = "https://data.binance.vision/data/futures/um";
const CACHE_DIR = path.resolve(new URL("../data/binance-usdm-archive-cache", import.meta.url).pathname);

function archiveUrl(kind, symbol, date) {
  return `${BINANCE_USDM_ARCHIVE}/daily/${kind}/${symbol}/${symbol}-${kind}-${date}.zip`;
}

function cacheFileForUrl(url) {
  const u = new URL(url);
  return path.join(CACHE_DIR, `${u.pathname.replaceAll("/", "__")}.csv`);
}

async function fetchZipCsv(url) {
  const cacheFile = cacheFileForUrl(url);
  try {
    return await fs.readFile(cacheFile);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const res = await fetch(url, {
    headers: {
      "Accept": "application/zip,text/csv,*/*",
      "User-Agent": "OpenClaw-RALPH-usdm-archive/0.1"
    }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Binance USD-M archive fetch failed: ${res.status} ${url}`);

  const bytes = Buffer.from(await res.arrayBuffer());
  const csv = unzipSingleFile(bytes);
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

export function parseUsdmTradesCsv(csv, { startMs = null, endMs = null } = {}) {
  const rows = [];
  forEachCsvLine(csv, (line) => {
    if (!line.trim()) return;
    const cols = line.split(",");
    const tradeId = Number(cols[0]);
    if (!Number.isFinite(tradeId)) return;

    const price = Number(cols[1]);
    const quantity = Number(cols[2]);
    const quoteQuantity = Number(cols[3]);
    const transactTime = normalizeTimestampMs(Number(cols[4]));
    const buyerIsMaker = parseCsvBoolean(cols[5]);
    if (![price, quantity, transactTime].every(Number.isFinite)) return;
    if (Number.isFinite(startMs) && transactTime < startMs) return;
    if (Number.isFinite(endMs) && transactTime >= endMs) return;

    const notional = Number.isFinite(quoteQuantity) ? quoteQuantity : price * quantity;
    rows.push({
      tradeId,
      price,
      quantity,
      quoteQuantity: notional,
      transactTime,
      transactTimeIso: new Date(transactTime).toISOString(),
      buyerIsMaker,
      takerSide: buyerIsMaker ? "sell" : "buy",
      signedQuantity: buyerIsMaker ? -quantity : quantity,
      signedNotional: (buyerIsMaker ? -1 : 1) * notional
    });
  });
  return rows;
}

export function parseBookDepthCsv(csv, { startMs = null, endMs = null } = {}) {
  const rows = [];
  forEachCsvLine(csv, (line) => {
    if (!line.trim()) return;
    const cols = line.split(",");
    const timestamp = parseTimestamp(cols[0]);
    const percentage = Number(cols[1]);
    const depth = Number(cols[2]);
    const notional = Number(cols[3]);
    if (![timestamp, percentage, depth, notional].every(Number.isFinite)) return;
    if (Number.isFinite(startMs) && timestamp < startMs) return;
    if (Number.isFinite(endMs) && timestamp >= endMs) return;

    rows.push({
      timestamp,
      timestampIso: new Date(timestamp).toISOString(),
      percentage,
      side: percentage < 0 ? "bid" : percentage > 0 ? "ask" : "mid",
      absPercentage: Math.abs(percentage),
      depth,
      notional
    });
  });
  return rows;
}

function forEachCsvLine(csv, callback) {
  if (typeof csv === "string") {
    for (const line of csv.split(/\r?\n/)) callback(line);
    return;
  }

  const chunkSize = 1_048_576;
  let remainder = "";
  for (let offset = 0; offset < csv.length; offset += chunkSize) {
    const chunk = remainder + csv.subarray(offset, offset + chunkSize).toString("utf8");
    const lines = chunk.split(/\r?\n/);
    remainder = lines.pop() ?? "";
    for (const line of lines) callback(line);
  }
  if (remainder) callback(remainder);
}

function parseCsvBoolean(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

function normalizeTimestampMs(value) {
  if (value > 1e14) return Math.floor(value / 1_000);
  if (value > 1e11) return Math.floor(value);
  return Math.floor(value * 1_000);
}

function parseTimestamp(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return normalizeTimestampMs(numeric);
  const parsed = Date.parse(`${String(value ?? "").trim().replace(" ", "T")}Z`);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function fetchBinanceUsdmTradesDay(symbol, date, options = {}) {
  const url = archiveUrl("trades", symbol, date);
  const csv = await fetchZipCsv(url);
  return {
    symbol,
    date,
    source: "binance-usdm-daily-trades-archive",
    url,
    trades: csv ? parseUsdmTradesCsv(csv, options) : []
  };
}

export async function fetchBinanceUsdmBookDepthDay(symbol, date, options = {}) {
  const url = archiveUrl("bookDepth", symbol, date);
  const csv = await fetchZipCsv(url);
  return {
    symbol,
    date,
    source: "binance-usdm-daily-bookDepth-archive",
    url,
    rows: csv ? parseBookDepthCsv(csv, options) : []
  };
}

export function sliceTrades(trades, { startMs = null, endMs = null, limit = null } = {}) {
  let rows = trades;
  if (Number.isFinite(startMs)) rows = rows.filter((row) => row.transactTime >= startMs);
  if (Number.isFinite(endMs)) rows = rows.filter((row) => row.transactTime < endMs);
  if (Number.isFinite(limit)) rows = rows.slice(0, limit);
  return rows;
}

export function sliceBookDepth(rows, { startMs = null, endMs = null } = {}) {
  let out = rows;
  if (Number.isFinite(startMs)) out = out.filter((row) => row.timestamp >= startMs);
  if (Number.isFinite(endMs)) out = out.filter((row) => row.timestamp < endMs);
  return out;
}

export function summarizeUsdmTrades(trades) {
  let buyNotional = 0;
  let sellNotional = 0;
  let notional = 0;
  let signedNotional = 0;

  for (const trade of trades) {
    notional += trade.quoteQuantity;
    signedNotional += trade.signedNotional;
    if (trade.takerSide === "buy") buyNotional += trade.quoteQuantity;
    else sellNotional += trade.quoteQuantity;
  }

  const first = trades[0] ?? null;
  const last = trades.at(-1) ?? null;
  return {
    trades: trades.length,
    startIso: first?.transactTimeIso ?? null,
    endIso: last?.transactTimeIso ?? null,
    firstPrice: first?.price ?? null,
    lastPrice: last?.price ?? null,
    priceMoveBps: first && last ? ((last.price - first.price) / first.price) * 10_000 : null,
    notional,
    buyNotional,
    sellNotional,
    signedNotional,
    cvdPctOfNotional: notional > 0 ? (signedNotional / notional) * 100 : null
  };
}

function cliArgs(argv) {
  const args = {
    symbol: "BTCUSDT",
    date: "2025-01-01",
    start: null,
    minutes: 5
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--symbol") args.symbol = value;
    if (key === "--date") args.date = value;
    if (key === "--start") args.start = value;
    if (key === "--minutes") args.minutes = Number(value);
    if (key.startsWith("--")) i += 1;
  }
  return args;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = cliArgs(process.argv.slice(2));
  const startMs = args.start ? Date.parse(args.start) : Date.parse(`${args.date}T00:00:00.000Z`);
  const endMs = Number.isFinite(args.minutes) ? startMs + args.minutes * 60_000 : null;
  const [tradeDay, bookDepthDay] = await Promise.all([
    fetchBinanceUsdmTradesDay(args.symbol, args.date),
    fetchBinanceUsdmBookDepthDay(args.symbol, args.date)
  ]);
  const trades = sliceTrades(tradeDay.trades, { startMs, endMs });
  const bookDepth = sliceBookDepth(bookDepthDay.rows, { startMs, endMs });
  console.log(JSON.stringify({
    ok: tradeDay.trades.length > 0 || bookDepthDay.rows.length > 0,
    symbol: args.symbol,
    date: args.date,
    tradeSource: tradeDay.source,
    bookDepthSource: bookDepthDay.source,
    tradeUrl: tradeDay.url,
    bookDepthUrl: bookDepthDay.url,
    dayTrades: tradeDay.trades.length,
    dayBookDepthRows: bookDepthDay.rows.length,
    sampleTrades: summarizeUsdmTrades(trades),
    sampleBookDepthRows: bookDepth.slice(0, 6)
  }, null, 2));
}
