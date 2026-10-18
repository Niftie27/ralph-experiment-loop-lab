#!/usr/bin/env node

import { DatabaseSync } from "node:sqlite";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SPIKES_DIR = resolve(ROOT, "runtime/orderflow-spikes");
const RUN_ID = process.env.ORDERFLOW_RUN_ID || latestRunId();
if (!RUN_ID) {
  throw new Error("No orderflow spike run found. Set ORDERFLOW_RUN_ID or run orderflow-spike.mjs first.");
}

const RUN_DIR = resolve(SPIKES_DIR, RUN_ID);
const INPUT_DB = resolve(RUN_DIR, "orderflow.sqlite");
const OUTPUT_DB = resolve(RUN_DIR, "features.sqlite");
const OUTPUT_CSV = resolve(RUN_DIR, "features-1s.csv");
const OUTPUT_MANIFEST = resolve(RUN_DIR, "features-manifest.yaml");
const BUCKET_MS = Number(process.env.ORDERFLOW_FEATURE_BUCKET_MS || 1000);

if (!existsSync(INPUT_DB)) {
  throw new Error(`Missing orderflow sqlite input: ${INPUT_DB}`);
}

const inputDb = new DatabaseSync(INPUT_DB, { readOnly: true });
const outputDb = new DatabaseSync(OUTPUT_DB);

outputDb.exec(`
  DROP TABLE IF EXISTS orderflow_features;
  CREATE TABLE orderflow_features (
    bucket_start_ms INTEGER NOT NULL,
    bucket_seconds INTEGER NOT NULL,
    source TEXT NOT NULL,
    symbol TEXT NOT NULL,
    trade_count INTEGER NOT NULL,
    buy_taker_qty REAL NOT NULL,
    sell_taker_qty REAL NOT NULL,
    signed_qty REAL NOT NULL,
    total_qty REAL NOT NULL,
    notional REAL NOT NULL,
    vwap REAL,
    first_price REAL,
    last_price REAL,
    price_change_bps REAL,
    book_updates INTEGER NOT NULL,
    avg_spread_bps REAL,
    avg_l1_imbalance REAL,
    min_bid REAL,
    max_ask REAL,
    PRIMARY KEY (bucket_start_ms, source, symbol)
  );
  CREATE INDEX idx_orderflow_features_symbol_time ON orderflow_features(symbol, bucket_start_ms);
`);

const rows = inputDb
  .prepare(`
    SELECT ts, source, type, symbol, price, quantity, side, bid, ask, bid_qty, ask_qty
    FROM raw_events
    WHERE symbol IS NOT NULL
    ORDER BY ts ASC
  `)
  .all();

const buckets = new Map();

function bucketKey(row) {
  const bucketStart = Math.floor(Number(row.ts) / BUCKET_MS) * BUCKET_MS;
  return `${bucketStart}|${row.source}|${row.symbol}`;
}

function getBucket(row) {
  const bucketStart = Math.floor(Number(row.ts) / BUCKET_MS) * BUCKET_MS;
  const key = bucketKey(row);
  if (!buckets.has(key)) {
    buckets.set(key, {
      bucketStart,
      bucketSeconds: BUCKET_MS / 1000,
      source: row.source,
      symbol: row.symbol,
      tradeCount: 0,
      buyTakerQty: 0,
      sellTakerQty: 0,
      signedQty: 0,
      totalQty: 0,
      notional: 0,
      firstPrice: null,
      lastPrice: null,
      bookUpdates: 0,
      spreadBpsSum: 0,
      spreadSamples: 0,
      imbalanceSum: 0,
      imbalanceSamples: 0,
      minBid: null,
      maxAsk: null
    });
  }
  return buckets.get(key);
}

function signedSide(side) {
  if (!side) return 0;
  const value = String(side).toLowerCase();
  if (value === "buy_taker" || value === "b") return 1;
  if (value === "sell_taker" || value === "a") return -1;
  return 0;
}

for (const row of rows) {
  const bucket = getBucket(row);
  const price = finite(row.price);
  const qty = finite(row.quantity);

  if (row.type === "trade" && price !== null && qty !== null) {
    const sideSign = signedSide(row.side);
    bucket.tradeCount += 1;
    bucket.totalQty += qty;
    bucket.notional += price * qty;
    bucket.signedQty += sideSign * qty;
    if (sideSign > 0) bucket.buyTakerQty += qty;
    if (sideSign < 0) bucket.sellTakerQty += qty;
    if (bucket.firstPrice === null) bucket.firstPrice = price;
    bucket.lastPrice = price;
  }

  const bid = finite(row.bid);
  const ask = finite(row.ask);
  const bidQty = finite(row.bid_qty);
  const askQty = finite(row.ask_qty);

  if (bid !== null && ask !== null && bid > 0 && ask > 0) {
    bucket.bookUpdates += 1;
    const mid = (bid + ask) / 2;
    bucket.spreadBpsSum += ((ask - bid) / mid) * 10000;
    bucket.spreadSamples += 1;
    bucket.minBid = bucket.minBid === null ? bid : Math.min(bucket.minBid, bid);
    bucket.maxAsk = bucket.maxAsk === null ? ask : Math.max(bucket.maxAsk, ask);

    if (bidQty !== null && askQty !== null && bidQty + askQty > 0) {
      bucket.imbalanceSum += (bidQty - askQty) / (bidQty + askQty);
      bucket.imbalanceSamples += 1;
    }
  }
}

const insert = outputDb.prepare(`
  INSERT INTO orderflow_features (
    bucket_start_ms, bucket_seconds, source, symbol, trade_count, buy_taker_qty, sell_taker_qty,
    signed_qty, total_qty, notional, vwap, first_price, last_price, price_change_bps,
    book_updates, avg_spread_bps, avg_l1_imbalance, min_bid, max_ask
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sortedBuckets = [...buckets.values()].sort((a, b) => {
  if (a.bucketStart !== b.bucketStart) return a.bucketStart - b.bucketStart;
  if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
  return a.source.localeCompare(b.source);
});

for (const bucket of sortedBuckets) {
  const vwap = bucket.totalQty > 0 ? bucket.notional / bucket.totalQty : null;
  const priceChangeBps =
    bucket.firstPrice && bucket.lastPrice
      ? ((bucket.lastPrice - bucket.firstPrice) / bucket.firstPrice) * 10000
      : null;
  insert.run(
    bucket.bucketStart,
    bucket.bucketSeconds,
    bucket.source,
    bucket.symbol,
    bucket.tradeCount,
    bucket.buyTakerQty,
    bucket.sellTakerQty,
    bucket.signedQty,
    bucket.totalQty,
    bucket.notional,
    vwap,
    bucket.firstPrice,
    bucket.lastPrice,
    priceChangeBps,
    bucket.bookUpdates,
    bucket.spreadSamples ? bucket.spreadBpsSum / bucket.spreadSamples : null,
    bucket.imbalanceSamples ? bucket.imbalanceSum / bucket.imbalanceSamples : null,
    bucket.minBid,
    bucket.maxAsk
  );
}

writeCsv(sortedBuckets);
writeManifest(sortedBuckets);

inputDb.close();
outputDb.close();

console.log(
  JSON.stringify({
    ok: true,
    runId: RUN_ID,
    bucketMs: BUCKET_MS,
    featureRows: sortedBuckets.length,
    sqlite: OUTPUT_DB,
    csv: OUTPUT_CSV,
    manifest: OUTPUT_MANIFEST
  })
);

function latestRunId() {
  if (!existsSync(SPIKES_DIR)) return null;
  return readdirSync(SPIKES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .at(-1);
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function writeCsv(bucketRows) {
  const header = [
    "bucket_start_ms",
    "bucket_iso",
    "bucket_seconds",
    "source",
    "symbol",
    "trade_count",
    "buy_taker_qty",
    "sell_taker_qty",
    "signed_qty",
    "total_qty",
    "notional",
    "vwap",
    "first_price",
    "last_price",
    "price_change_bps",
    "book_updates",
    "avg_spread_bps",
    "avg_l1_imbalance",
    "min_bid",
    "max_ask"
  ];
  const lines = [header.join(",")];
  for (const bucket of bucketRows) {
    const vwap = bucket.totalQty > 0 ? bucket.notional / bucket.totalQty : null;
    const priceChangeBps =
      bucket.firstPrice && bucket.lastPrice
        ? ((bucket.lastPrice - bucket.firstPrice) / bucket.firstPrice) * 10000
        : null;
    lines.push(
      [
        bucket.bucketStart,
        new Date(bucket.bucketStart).toISOString(),
        bucket.bucketSeconds,
        bucket.source,
        bucket.symbol,
        bucket.tradeCount,
        bucket.buyTakerQty,
        bucket.sellTakerQty,
        bucket.signedQty,
        bucket.totalQty,
        bucket.notional,
        vwap,
        bucket.firstPrice,
        bucket.lastPrice,
        priceChangeBps,
        bucket.bookUpdates,
        bucket.spreadSamples ? bucket.spreadBpsSum / bucket.spreadSamples : null,
        bucket.imbalanceSamples ? bucket.imbalanceSum / bucket.imbalanceSamples : null,
        bucket.minBid,
        bucket.maxAsk
      ]
        .map(csvValue)
        .join(",")
    );
  }
  writeFileSync(OUTPUT_CSV, `${lines.join("\n")}\n`, "utf8");
}

function writeManifest(bucketRows) {
  const bySource = countBy(bucketRows, (row) => row.source);
  const bySymbol = countBy(bucketRows, (row) => row.symbol);
  const manifest = [
    "version: 1",
    `run_id: ${RUN_ID}`,
    `generated_at: ${new Date().toISOString()}`,
    `bucket_ms: ${BUCKET_MS}`,
    `input_sqlite: ${INPUT_DB}`,
    "outputs:",
    `  sqlite: ${OUTPUT_DB}`,
    `  csv: ${OUTPUT_CSV}`,
    "counts:",
    `  feature_rows: ${bucketRows.length}`,
    "by_source:",
    yamlMap(bySource),
    "by_symbol:",
    yamlMap(bySymbol),
    "feature_columns:",
    "  - signed_qty",
    "  - taker volume split",
    "  - vwap",
    "  - price_change_bps",
    "  - avg_spread_bps",
    "  - avg_l1_imbalance",
    "notes: Compact feature layer for research/backtests; not a standalone trading signal."
  ].join("\n");
  writeFileSync(OUTPUT_MANIFEST, `${manifest}\n`, "utf8");
}

function countBy(rows, selector) {
  const out = new Map();
  for (const row of rows) {
    const key = selector(row);
    out.set(key, (out.get(key) || 0) + 1);
  }
  return out;
}

function yamlMap(map) {
  if (map.size === 0) return "  {}";
  return [...map.entries()]
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(([key, value]) => `  ${key}: ${value}`)
    .join("\n");
}
