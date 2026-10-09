#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const ROOT = resolve(new URL(".", import.meta.url).pathname);
const PYTHON = process.env.RALPH_COLLECTOR_PYTHON || "/home/coder/venv-collector/bin/python";
const ENGINE = process.env.RALPH_ORDERFLOW_ENGINE || "/home/coder/ralph_collector/orderflow_engine.py";
const REPORT_DIR = resolve(ROOT, "runtime/ralph-replay-checks");
const DEFAULTS = {
  BTC: { symbol: "BTCUSDT", data: "/home/coder/data/binance" },
  ETH: { symbol: "ETHUSDT", data: "/home/coder/data/binance-ethusdt" },
  SOL: { symbol: "SOLUSDT", data: "/home/coder/data/binance-solusdt" },
  HYPE: { symbol: "HYPEUSDT", data: "/home/coder/data/binance-hypeusdt" }
};

const args = parseArgs(process.argv.slice(2));
const label = String(args.symbol || "BTC").toUpperCase();
const config = DEFAULTS[label];
if (!config) fail(`unsupported --symbol ${label}; expected ${Object.keys(DEFAULTS).join(", ")}`);
if (!args.hour) fail("--hour is required, e.g. 2026-10-09T05Z");

const hour = String(args.hour);
const dataDir = resolve(args.data || config.data);
const outDir = resolve(args.out || `/tmp/ralph_replay_${label.toLowerCase()}_${hour.replaceAll(":", "").replaceAll("/", "_")}`);
const tapePath = join(dataDir, `tape_${config.symbol}_${hour}.csv`);
const rawPath = join(dataDir, `raw_${config.symbol}_${hour}.jsonl.gz`);
const bookPath = join(dataDir, `book_${config.symbol}_${hour}.jsonl.gz`);
const window = hourWindow(hour);

const report = {
  generatedAt: new Date().toISOString(),
  status: "ralph-orderflow-replay-check",
  label,
  symbol: config.symbol,
  hour,
  dataDir,
  outDir,
  inputContract: {
    required: [
      "tape hourly CSV with Time/Bids/Ask/Delta/AggId/TradeTimeMs",
      "raw hourly JSONL.GZ for liquidations, mark price, and open interest",
      "book hourly JSONL.GZ with top-of-book snapshots",
      "sorted unique trade keys by (TradeTimeMs, AggId)"
    ]
  },
  inputs: {
    tape: fileStatus(tapePath),
    raw: fileStatus(rawPath),
    book: fileStatus(bookPath)
  },
  tape: null,
  replay: null,
  outputs: []
};

report.tape = inspectTape(tapePath);
const missing = Object.entries(report.inputs)
  .filter(([, value]) => !value.exists)
  .map(([key]) => key);
if (missing.length) {
  report.replay = { ok: false, skipped: true, reason: `missing inputs: ${missing.join(", ")}` };
} else {
  mkdirSync(outDir, { recursive: true });
  const replay = spawnSync(PYTHON, [ENGINE, "--data", dataDir, "--out", outDir, "--from", window.from, "--to", window.to], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });
  report.replay = {
    ok: replay.status === 0,
    status: replay.status,
    signal: replay.signal,
    stdout: replay.stdout.trim(),
    stderr: replay.stderr.trim()
  };
  report.outputs = outputFiles(outDir);
}

report.ok =
  report.inputs.tape.exists &&
  report.inputs.raw.exists &&
  report.inputs.book.exists &&
  report.tape.rows > 0 &&
  report.tape.duplicates === 0 &&
  report.tape.sortViolations === 0 &&
  report.replay?.ok === true &&
  report.outputs.length > 0;

mkdirSync(REPORT_DIR, { recursive: true });
const reportBase = `${label.toLowerCase()}_${hour}`;
const jsonPath = join(REPORT_DIR, `${reportBase}.json`);
const mdPath = join(REPORT_DIR, `${reportBase}.md`);
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(mdPath, renderMarkdown(report));

console.log(JSON.stringify({
  ok: report.ok,
  label,
  hour,
  rows: report.tape.rows,
  duplicates: report.tape.duplicates,
  sortViolations: report.tape.sortViolations,
  replayOk: report.replay?.ok === true,
  outputs: report.outputs.length,
  report: jsonPath
}, null, 2));
process.exit(report.ok ? 0 : 1);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function fail(message) {
  console.error(message);
  process.exit(2);
}

function fileStatus(path) {
  if (!existsSync(path)) return { path, exists: false, bytes: 0 };
  return { path, exists: true, bytes: statSync(path).size };
}

function inspectTape(path) {
  const result = {
    path,
    rows: 0,
    duplicates: 0,
    sortViolations: 0,
    firstKey: null,
    lastKey: null
  };
  if (!existsSync(path)) return result;
  const seen = new Set();
  let previous = null;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line || line.startsWith("Time")) continue;
    const fields = line.split(";");
    if (fields.length < 9) continue;
    const aggId = Number(fields[7]);
    const tradeTimeMs = Number(fields[8]);
    if (!Number.isFinite(aggId) || !Number.isFinite(tradeTimeMs)) continue;
    const key = [tradeTimeMs, aggId];
    const keyString = `${tradeTimeMs}:${aggId}`;
    result.rows += 1;
    if (seen.has(keyString)) result.duplicates += 1;
    seen.add(keyString);
    if (previous && compareKey(key, previous) < 0) result.sortViolations += 1;
    if (!result.firstKey) result.firstKey = key;
    result.lastKey = key;
    previous = key;
  }
  return result;
}

function compareKey(a, b) {
  if (a[0] !== b[0]) return a[0] - b[0];
  return a[1] - b[1];
}

function hourWindow(hour) {
  const match = hour.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})Z$/);
  if (!match) fail(`invalid --hour ${hour}; expected YYYY-MM-DDTHHZ`);
  const startHour = Number(match[2]);
  const start = `${match[1]}T${match[2]}:00`;
  const endDate = new Date(Date.UTC(
    Number(match[1].slice(0, 4)),
    Number(match[1].slice(5, 7)) - 1,
    Number(match[1].slice(8, 10)),
    startHour + 1,
    0,
    0
  ));
  const end = `${endDate.toISOString().slice(0, 13)}:00`;
  return { from: start, to: end };
}

function outputFiles(outDir) {
  if (!existsSync(outDir)) return [];
  return readdirSync(outDir)
    .map((name) => join(outDir, name))
    .filter((path) => statSync(path).isFile())
    .map((path) => ({ path, name: basename(path), bytes: statSync(path).size }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function renderMarkdown(input) {
  const lines = [
    `# RALPH Orderflow Replay Check: ${input.label} ${input.hour}`,
    "",
    `Generated: ${input.generatedAt}`,
    `Status: ${input.ok ? "pass" : "fail"}`,
    "",
    "## Inputs",
    "",
    ...Object.entries(input.inputs).map(([key, value]) => `- ${key}: ${value.exists ? "present" : "missing"} (${value.bytes} bytes) ${value.path}`),
    "",
    "## Tape",
    "",
    `- rows: ${input.tape.rows}`,
    `- duplicates: ${input.tape.duplicates}`,
    `- sort violations: ${input.tape.sortViolations}`,
    `- first key: ${JSON.stringify(input.tape.firstKey)}`,
    `- last key: ${JSON.stringify(input.tape.lastKey)}`,
    "",
    "## Replay",
    "",
    `- ok: ${input.replay?.ok === true ? "yes" : "no"}`,
    input.replay?.stdout ? `- stdout: ${input.replay.stdout.replaceAll("\n", " | ")}` : "- stdout: n/a",
    input.replay?.stderr ? `- stderr: ${input.replay.stderr.replaceAll("\n", " | ")}` : "- stderr: n/a",
    "",
    "## Outputs",
    "",
    ...(input.outputs.length ? input.outputs.map((file) => `- ${file.name}: ${file.bytes} bytes`) : ["- none"]),
    "",
    "Boundary: read-only replay verification; no live trading, orders, keys, accounts, thresholds, alert wording, sizing, TP/SL, execution behavior, scheduler mutation, or public posting changed.",
    ""
  ];
  return `${lines.join("\n")}\n`;
}
