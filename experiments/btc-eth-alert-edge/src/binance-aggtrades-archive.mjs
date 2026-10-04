#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

const BINANCE_SPOT_ARCHIVE = "https://data.binance.vision/data/spot";
const CACHE_DIR = path.resolve(new URL("../data/binance-aggtrades-cache", import.meta.url).pathname);

function archiveUrl(symbol, date) {
  return `${BINANCE_SPOT_ARCHIVE}/daily/aggTrades/${symbol}/${symbol}-aggTrades-${date}.zip`;
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
      "User-Agent": "OpenClaw-RALPH-aggtrades-archive/0.1"
    }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Binance aggTrades archive fetch failed: ${res.status} ${url}`);

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

export function parseAggTradesCsv(csv) {
  const rows = [];
  for (const line of csv.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cols = line.split(",");
    const aggTradeId = Number(cols[0]);
    if (!Number.isFinite(aggTradeId)) continue;

    const price = Number(cols[1]);
    const quantity = Number(cols[2]);
    const firstTradeId = Number(cols[3]);
    const lastTradeId = Number(cols[4]);
    const transactTime = normalizeTimestampMs(Number(cols[5]));
    const buyerIsMaker = parseCsvBoolean(cols[6]);
    const isBestMatch = parseCsvBoolean(cols[7]);
    if (![price, quantity, firstTradeId, lastTradeId, transactTime].every(Number.isFinite)) continue;

    rows.push({
      aggTradeId,
      price,
      quantity,
      quoteQuantity: price * quantity,
      firstTradeId,
      lastTradeId,
      transactTime,
      transactTimeIso: new Date(transactTime).toISOString(),
      buyerIsMaker,
      takerSide: buyerIsMaker ? "sell" : "buy",
      signedQuantity: buyerIsMaker ? -quantity : quantity,
      signedNotional: (buyerIsMaker ? -1 : 1) * price * quantity,
      isBestMatch
    });
  }
  return rows;
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

export async function fetchBinanceSpotAggTradesDay(symbol, date) {
  const url = archiveUrl(symbol, date);
  const csv = await fetchZipCsv(url);
  if (!csv) {
    return {
      symbol,
      date,
      source: "binance-spot-daily-aggTrades-archive",
      url,
      trades: []
    };
  }

  return {
    symbol,
    date,
    source: "binance-spot-daily-aggTrades-archive",
    url,
    trades: parseAggTradesCsv(csv)
  };
}

export function sliceAggTrades(trades, { startMs = null, endMs = null, limit = null } = {}) {
  let rows = trades;
  if (Number.isFinite(startMs)) rows = rows.filter((row) => row.transactTime >= startMs);
  if (Number.isFinite(endMs)) rows = rows.filter((row) => row.transactTime < endMs);
  if (Number.isFinite(limit)) rows = rows.slice(0, limit);
  return rows;
}

export function summarizeAggTrades(trades) {
  let buyNotional = 0;
  let sellNotional = 0;
  let buyQuantity = 0;
  let sellQuantity = 0;
  let notional = 0;
  let signedNotional = 0;
  let signedQuantity = 0;

  for (const trade of trades) {
    notional += trade.quoteQuantity;
    signedNotional += trade.signedNotional;
    signedQuantity += trade.signedQuantity;
    if (trade.takerSide === "buy") {
      buyNotional += trade.quoteQuantity;
      buyQuantity += trade.quantity;
    } else {
      sellNotional += trade.quoteQuantity;
      sellQuantity += trade.quantity;
    }
  }

  const first = trades[0] ?? null;
  const last = trades[trades.length - 1] ?? null;
  const priceMoveBps = first && last ? ((last.price - first.price) / first.price) * 10_000 : null;

  return {
    trades: trades.length,
    startIso: first?.transactTimeIso ?? null,
    endIso: last?.transactTimeIso ?? null,
    firstPrice: first?.price ?? null,
    lastPrice: last?.price ?? null,
    priceMoveBps,
    notional,
    buyNotional,
    sellNotional,
    signedNotional,
    buyQuantity,
    sellQuantity,
    signedQuantity,
    cvdPctOfNotional: notional > 0 ? (signedNotional / notional) * 100 : null
  };
}

function cliArgs(argv) {
  const args = {
    symbol: "BTCUSDT",
    date: "2025-01-01",
    start: null,
    minutes: 5,
    limit: null
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--symbol") args.symbol = value;
    if (key === "--date") args.date = value;
    if (key === "--start") args.start = value;
    if (key === "--minutes") args.minutes = Number(value);
    if (key === "--limit") args.limit = Number(value);
    if (key.startsWith("--")) i += 1;
  }
  return args;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = cliArgs(process.argv.slice(2));
  const day = await fetchBinanceSpotAggTradesDay(args.symbol, args.date);
  const startMs = args.start ? Date.parse(args.start) : Date.parse(`${args.date}T00:00:00.000Z`);
  const endMs = Number.isFinite(args.minutes) ? startMs + args.minutes * 60_000 : null;
  const sample = sliceAggTrades(day.trades, { startMs, endMs, limit: args.limit });
  console.log(JSON.stringify({
    ok: day.trades.length > 0,
    source: day.source,
    url: day.url,
    symbol: day.symbol,
    date: day.date,
    dayTrades: day.trades.length,
    sample: summarizeAggTrades(sample),
    firstRows: sample.slice(0, 3)
  }, null, 2));
}
