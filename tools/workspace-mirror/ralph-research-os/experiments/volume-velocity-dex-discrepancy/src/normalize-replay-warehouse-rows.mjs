#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const DEFAULT_INPUT = path.join(ROOT, "fixtures", "warehouse-replay-sample.jsonl");
const DEFAULT_OUTPUT = path.join(ROOT, "results", "normalized-replay-input.jsonl");
const INPUT_PATH = process.env.REPLAY_WAREHOUSE_INPUT ? path.resolve(process.env.REPLAY_WAREHOUSE_INPUT) : DEFAULT_INPUT;
const OUTPUT_PATH = process.env.REPLAY_NORMALIZED_OUTPUT ? path.resolve(process.env.REPLAY_NORMALIZED_OUTPUT) : DEFAULT_OUTPUT;
const BUCKETS = (process.env.REPLAY_LATENCY_BUCKETS ?? "0,0.5,1,2,3,4,5")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

const rows = await readJsonl(INPUT_PATH);
const events = rows.map(normalizeRow);
await fs.writeFile(OUTPUT_PATH, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`);

console.log(JSON.stringify({
  ok: true,
  status: "research-only-no-live-execution",
  input: path.relative(ROOT, INPUT_PATH),
  output: path.relative(ROOT, OUTPUT_PATH),
  rows: rows.length,
  latencyBucketsSeconds: BUCKETS
}, null, 2));

function normalizeRow(row) {
  const event = {
    eventId: stringField(row, "event_id"),
    status: "research-only-no-live-execution",
    source: row.source ?? "warehouse_export",
    chain: stringField(row, "chain"),
    pair: stringField(row, "pair"),
    observedAt: stringField(row, "observed_at"),
    blockNumber: optionalNumber(row.block_number),
    txHash: row.tx_hash ?? null,
    logIndex: optionalNumber(row.log_index),
    notionalUsd: numberField(row, "notional_usd"),
    buyVenue: stringField(row, "buy_venue"),
    sellVenue: stringField(row, "sell_venue"),
    executionMode: row.execution_mode ?? "flashloan_mode",
    evidenceTier: row.evidence_tier ?? "unknown",
    grossProfitMethod: row.gross_profit_method ?? "unknown",
    buyAmmType: row.buy_amm_type ?? null,
    sellAmmType: row.sell_amm_type ?? null,
    buyPool: row.buy_pool ?? null,
    sellPool: row.sell_pool ?? null,
    buyStateBlock: optionalNumber(row.buy_state_block),
    sellStateBlock: optionalNumber(row.sell_state_block),
    buyStateLogIndex: optionalNumber(row.buy_state_log_index),
    sellStateLogIndex: optionalNumber(row.sell_state_log_index),
    buyPriceSource: row.buy_price_source ?? null,
    sellPriceSource: row.sell_price_source ?? null,
    stateQualityFlags: listField(row.state_quality_flags),
    btcGate: row.btc_gate ?? "BTC_STALE",
    btcGateReason: row.btc_gate_reason ?? "not supplied by warehouse export",
    buckets: {}
  };

  for (const bucket of BUCKETS) {
    const suffix = bucket.replace(".", "_");
    const grossProfitUsd = optionalNumber(row[`gross_profit_usd_${suffix}`]);
    const slippageUsd = optionalNumber(row[`slippage_usd_${suffix}`]);
    const dexFeeUsd = optionalNumber(row[`dex_fee_usd_${suffix}`]);
    if (grossProfitUsd !== null) {
      event.buckets[bucket] = {
        grossProfitUsd,
        ...(slippageUsd === null ? {} : { slippageUsd }),
        ...(dexFeeUsd === null ? {} : { dexFeeUsd })
      };
    }
  }
  return event;
}

async function readJsonl(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`invalid_jsonl_line_${index + 1}: ${error.message}`);
      }
    });
}

function stringField(row, field) {
  const value = row[field];
  if (value === undefined || value === null || value === "") {
    throw new Error(`missing_required_field_${field}`);
  }
  return String(value);
}

function numberField(row, field) {
  const value = optionalNumber(row[field]);
  if (value === null) {
    throw new Error(`missing_numeric_field_${field}`);
  }
  return value;
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`invalid_number_${value}`);
  }
  return number;
}

function listField(value) {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) throw new Error("state_quality_flags_must_be_array");
      return parsed.map(String).filter(Boolean);
    }
    return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
  }
  throw new Error("state_quality_flags_must_be_array_or_string");
}
