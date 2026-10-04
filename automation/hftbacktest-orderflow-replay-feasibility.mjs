#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const WORKSPACE = path.resolve(new URL("../..", import.meta.url).pathname);
const RALPH_ROOT = path.join(WORKSPACE, "ralph-research-os");
const DEFAULT_RUN_ID = "2026-08-20T22-49-17-670Z";
const RUN_ID = process.env.ORDERFLOW_RUN_ID || DEFAULT_RUN_ID;
const RUN_DIR = path.join(WORKSPACE, "crypto-updates", "runtime", "orderflow-spikes", RUN_ID);
const RAW_EVENTS = path.join(RUN_DIR, "raw-events.jsonl");
const OUT_JSON = path.join(RALPH_ROOT, "outputs", "hftbacktest-orderflow-replay-feasibility.json");
const OUT_MD = path.join(RALPH_ROOT, "outputs", "hftbacktest-orderflow-replay-feasibility.md");

if (!fs.existsSync(RAW_EVENTS)) {
  throw new Error(`Missing raw orderflow capture: ${RAW_EVENTS}`);
}

const events = fs.readFileSync(RAW_EVENTS, "utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const stats = {
  totalRawEvents: events.length,
  bySourceTypeSymbol: new Map(),
  convertibleRows: 0,
  tradeRows: 0,
  depthRows: 0,
  topOfBookRows: 0,
  missingSeparateLocalTs: 0,
  missingExchangeTs: 0,
  missingDepthLevels: 0,
  missingTradeSide: 0
};

const samples = [];
const timestampEvidenceByRowKind = new Map();

for (const event of events) {
  const key = `${event.source}:${event.type}:${event.symbol}`;
  stats.bySourceTypeSymbol.set(key, (stats.bySourceTypeSymbol.get(key) || 0) + 1);
  const converted = convertEvent(event);
  for (const row of converted.rows) {
    stats.convertibleRows += 1;
    if (row.kind === "trade") stats.tradeRows += 1;
    if (row.kind === "depth") stats.depthRows += 1;
    if (row.kind === "top_of_book") stats.topOfBookRows += 1;
    if (!row.hasSeparateLocalTs) stats.missingSeparateLocalTs += 1;
    if (!row.hasExchangeTs) stats.missingExchangeTs += 1;
    const evidenceKey = `${row.source}:${row.kind}:${row.symbol}`;
    const evidence = timestampEvidenceByRowKind.get(evidenceKey) || {
      projectedRows: 0,
      nativeExchangeTsRows: 0,
      fallbackExchangeTsRows: 0,
      separateLocalTsRows: 0
    };
    evidence.projectedRows += 1;
    evidence.nativeExchangeTsRows += row.hasExchangeTs ? 1 : 0;
    evidence.fallbackExchangeTsRows += row.hasExchangeTs ? 0 : 1;
    evidence.separateLocalTsRows += row.hasSeparateLocalTs ? 1 : 0;
    timestampEvidenceByRowKind.set(evidenceKey, evidence);
    if (samples.length < 12) samples.push(row);
  }
  for (const warning of converted.warnings) {
    if (warning === "missing_depth_levels") stats.missingDepthLevels += 1;
    if (warning === "missing_trade_side") stats.missingTradeSide += 1;
  }
}

const bySourceTypeSymbol = Object.fromEntries([...stats.bySourceTypeSymbol.entries()].sort());
const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  sourceRun: RUN_ID,
  input: path.relative(WORKSPACE, RAW_EVENTS),
  hftbacktestAccess: {
    localImportAvailable: false,
    systemPython: "python3 exists, but hftbacktest is not installed in the current interpreter",
    pipAvailable: false,
    actionTaken: "No package installation was attempted."
  },
  hftbacktestDataContract: {
    fields: ["ev", "exch_ts", "local_ts", "px", "qty", "order_id", "ival", "fval"],
    requiredChecks: [
      "events sortable by exchange/local timestamp",
      "positive feed latency or explicit offset/correction",
      "depth/trade event flags",
      "price and quantity for each trade/depth row"
    ],
    source: "https://hftbacktest.readthedocs.io/en/latest/data.html"
  },
  stats: {
    ...stats,
    bySourceTypeSymbol: undefined
  },
  bySourceTypeSymbol,
  timestampEvidenceByRowKind: Object.fromEntries([...timestampEvidenceByRowKind.entries()].sort()),
  samples,
  verdict: makeVerdict(stats),
  nextTest: {
    recommended: "build a capture-v2 schema before installing hftbacktest",
    reason: "current captures can synthesize event rows, but cannot measure feed latency because they store one timestamp instead of exchange_ts and local_receive_ts separately",
    minimalCaptureV2: [
      "exchange_ts_ms from raw event time when available",
      "local_receive_ts_ms from Date.now at WebSocket receipt",
      "source sequence/update id for depth continuity checks",
      "full top-N bids/asks, not only L1 feature rows",
      "fees/slippage/latency profile frozen before replay"
    ]
  }
};

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(OUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  rawEvents: stats.totalRawEvents,
  convertibleRows: stats.convertibleRows,
  missingSeparateLocalTs: stats.missingSeparateLocalTs,
  output: path.relative(WORKSPACE, OUT_MD)
}, null, 2));

function convertEvent(event) {
  const rows = [];
  const warnings = [];
  const hasExchangeTs = hasNativeExchangeTs(event);
  const hasSeparateLocalTs = isPresentFiniteNumber(event.localReceiveTs);
  const exchTsMs = Number(event.exchangeTs || event.ts);
  const localTsMs = Number(event.localReceiveTs || event.ts);
  const exchTsNs = BigInt(Math.trunc(exchTsMs)) * 1_000_000n;
  const localTsNs = BigInt(Math.trunc(localTsMs)) * 1_000_000n;

  if (event.type === "trade" && Number.isFinite(Number(event.price)) && Number.isFinite(Number(event.quantity))) {
    if (!event.side) warnings.push("missing_trade_side");
    rows.push({
      kind: "trade",
      symbol: event.symbol,
      source: event.source,
      ev: tradeFlag(event.side),
      exch_ts_ns: String(exchTsNs),
      local_ts_ns: String(localTsNs),
      px: Number(event.price),
      qty: Number(event.quantity),
      order_id: 0,
      ival: 0,
      fval: 0,
      hasExchangeTs,
      hasSeparateLocalTs
    });
    return { rows, warnings };
  }

  const depthRows = depthLevels(event);
  if (!depthRows.length) {
    if (event.type === "depth5" || event.type === "l2_book") warnings.push("missing_depth_levels");
    return { rows, warnings };
  }

  for (const level of depthRows) {
    rows.push({
      kind: event.type === "book_ticker" ? "top_of_book" : "depth",
      symbol: event.symbol,
      source: event.source,
      ev: `${level.side.toUpperCase()}_EVENT|DEPTH_EVENT|EXCH_EVENT|LOCAL_EVENT`,
      exch_ts_ns: String(exchTsNs),
      local_ts_ns: String(localTsNs),
      px: level.price,
      qty: level.quantity,
      order_id: 0,
      ival: 0,
      fval: 0,
      hasExchangeTs,
      hasSeparateLocalTs
    });
  }

  return { rows, warnings };
}

function depthLevels(event) {
  if (event.type === "book_ticker") {
    return [
      { side: "buy", price: Number(event.bid), quantity: Number(event.bidQty) },
      { side: "sell", price: Number(event.ask), quantity: Number(event.askQty) }
    ].filter((row) => Number.isFinite(row.price) && Number.isFinite(row.quantity));
  }

  if (event.source === "binance" && event.type === "depth5") {
    return [
      ...(event.raw?.bids || []).map(([price, quantity]) => ({ side: "buy", price: Number(price), quantity: Number(quantity) })),
      ...(event.raw?.asks || []).map(([price, quantity]) => ({ side: "sell", price: Number(price), quantity: Number(quantity) }))
    ].filter((row) => Number.isFinite(row.price) && Number.isFinite(row.quantity));
  }

  if (event.source === "hyperliquid" && event.type === "l2_book") {
    const [bids = [], asks = []] = event.raw?.levels || [];
    return [
      ...bids.map((level) => ({ side: "buy", price: Number(level.px), quantity: Number(level.sz) })),
      ...asks.map((level) => ({ side: "sell", price: Number(level.px), quantity: Number(level.sz) }))
    ].filter((row) => Number.isFinite(row.price) && Number.isFinite(row.quantity));
  }

  return [];
}

function hasNativeExchangeTs(event) {
  if (isPresentFiniteNumber(event.exchangeTs)) return true;
  if (event.source === "binance" && event.type === "trade") return isPresentFiniteNumber(event.raw?.T || event.raw?.E);
  if (event.source === "hyperliquid" && (event.type === "trade" || event.type === "l2_book")) return isPresentFiniteNumber(event.raw?.time);
  return false;
}

function isPresentFiniteNumber(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function tradeFlag(side) {
  const value = String(side || "").toLowerCase();
  if (value === "buy_taker" || value === "b") return "BUY_EVENT|TRADE_EVENT|EXCH_EVENT|LOCAL_EVENT";
  if (value === "sell_taker" || value === "a") return "SELL_EVENT|TRADE_EVENT|EXCH_EVENT|LOCAL_EVENT";
  return "TRADE_EVENT|EXCH_EVENT|LOCAL_EVENT";
}

function makeVerdict(s) {
  if (s.convertibleRows > 0 && s.missingSeparateLocalTs === 0 && s.missingExchangeTs === 0) {
    return "Schema fit: capture-v2 can produce hftbacktest-like trade/depth/top-of-book event rows with separate exchange and local receive timestamps. The next blocker is package/runtime setup plus a frozen fee/latency/order-size baseline, not capture schema.";
  }
  if (s.convertibleRows > 0 && s.missingSeparateLocalTs === 0 && s.missingExchangeTs > 0) {
    return "Partial fit: capture-v2 stores separate local receive timestamps, but some projected rows still lack native exchange timestamp evidence and must use a fallback timestamp. Replay is usable for runtime smoke tests, not latency-sensitive edge claims.";
  }
  if (s.convertibleRows > 0 && s.missingSeparateLocalTs === s.convertibleRows) {
    return "Partial fit: raw capture can be converted into hftbacktest-like trade/depth event rows, but current schema is not replay-grade because it lacks separate local receive timestamps for latency validation.";
  }
  return "Blocked: insufficient event conversion coverage.";
}

function renderMarkdown(report) {
  const lines = [
    "# HftBacktest Orderflow Replay Feasibility",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}.`,
    `Source run: \`${report.sourceRun}\``,
    "",
    "## Verdict",
    "",
    report.verdict,
    "",
    report.stats.missingSeparateLocalTs === 0
      ? "Do not treat this as edge evidence yet. Separate local receive timestamps are available, but exchange-time evidence still needs per-source scrutiny before latency-sensitive replay claims."
      : "Do not install or run hftbacktest yet. First fix the capture schema so replay data can pass timestamp and latency checks instead of faking them.",
    "",
    "## HftBacktest Contract",
    "",
    "HftBacktest expects normalized events with `ev`, `exch_ts`, `local_ts`, `px`, `qty`, `order_id`, `ival`, and `fval`; its docs also call out chronological ordering and positive feed latency checks.",
    "",
    "Source: https://hftbacktest.readthedocs.io/en/latest/data.html",
    "",
    "## Local Access",
    "",
    "- `python3` is available.",
    "- `hftbacktest` is not installed in the current interpreter.",
    "- `python3 -m pip` is not available here, so package installation was not attempted.",
    "- This pass stayed as schema/replay feasibility only.",
    "",
    "## Raw Capture Coverage",
    "",
    `- Raw events: ${report.stats.totalRawEvents}`,
    `- Projected hftbacktest-like rows: ${report.stats.convertibleRows}`,
    `- Trade rows: ${report.stats.tradeRows}`,
    `- Depth rows: ${report.stats.depthRows}`,
    `- Top-of-book rows: ${report.stats.topOfBookRows}`,
    `- Rows missing separate local receive timestamp: ${report.stats.missingSeparateLocalTs}`,
    `- Rows without native exchange timestamp evidence: ${report.stats.missingExchangeTs}`,
    "",
    "## Source/Type Counts",
    "",
    "| Key | Count |",
    "| --- | ---: |"
  ];

  for (const [key, count] of Object.entries(report.bySourceTypeSymbol)) {
    lines.push(`| ${key} | ${count} |`);
  }

  lines.push(
    "",
    "## Timestamp Evidence By Projected Row Kind",
    "",
    "| Key | Rows | Native exchange ts | Fallback exchange ts | Separate local ts |",
    "| --- | ---: | ---: | ---: | ---: |"
  );

  for (const [key, evidence] of Object.entries(report.timestampEvidenceByRowKind)) {
    lines.push(`| ${key} | ${evidence.projectedRows} | ${evidence.nativeExchangeTsRows} | ${evidence.fallbackExchangeTsRows} | ${evidence.separateLocalTsRows} |`);
  }

  lines.push(
    "",
    "## Interpretation",
    "",
    report.stats.missingSeparateLocalTs === 0
      ? "- Capture-v2 records separate exchange and local receive timestamps for projected rows in this test capture."
      : "- Binance trades and Hyperliquid trades/l2 books have native exchange-time fields in raw payloads.",
    report.stats.missingExchangeTs === 0
      ? "- Native exchange timestamp evidence is present for projected rows in this run."
      : "- Some rows still lack native exchange timestamp evidence and would need an explicit conservative timestamp policy.",
    report.stats.missingSeparateLocalTs === 0
      ? (
          report.stats.missingExchangeTs === 0
            ? "- This clears the first replay-data blocker; the remaining step is a real hftbacktest install/run with predeclared fees, latency assumptions, and a trivial baseline."
            : "- This is enough for package/runtime smoke tests, but not enough for latency-sensitive replay or edge claims."
        )
      : "- The current capture records a single `ts`, so any replay would have to set `exch_ts == local_ts` or invent latency. That would defeat the point of using hftbacktest for execution realism.",
    "- Existing L1 feature CSVs are useful for alert classification, but hftbacktest replay needs event-level depth/trade rows and a frozen latency/fee model.",
    "",
    "## Next Test",
    "",
    report.stats.missingSeparateLocalTs === 0
      ? (
          report.stats.missingExchangeTs === 0
            ? "Next: package/runtime spike and minimal replay:"
            : "Next: timestamp evidence gate before longer replay:"
        )
      : "Build capture-v2 before hftbacktest install/run:",
    "",
    report.stats.missingSeparateLocalTs === 0
      ? (
          report.stats.missingExchangeTs === 0
            ? "- create an isolated Python environment with pip/hftbacktest;"
            : "- report native timestamp coverage by source/type;"
        )
      : "- record `exchange_ts_ms` and `local_receive_ts_ms` separately;",
    report.stats.missingSeparateLocalTs === 0
      ? (
          report.stats.missingExchangeTs === 0
            ? "- convert this BTCUSDT capture into hftbacktest's structured-array format;"
            : "- distinguish measured exchange time from local receive and fallback timestamps;"
        )
      : "- preserve source update IDs for depth continuity;",
    report.stats.missingSeparateLocalTs === 0
      ? (
          report.stats.missingExchangeTs === 0
            ? "- freeze maker/taker fees, latency offset, and order size before any result;"
            : "- keep fallback-timestamp rows out of latency-sensitive edge metrics;"
        )
      : "- store full top-N bids/asks, not only L1 features;",
    report.stats.missingSeparateLocalTs === 0
      ? (
          report.stats.missingExchangeTs === 0
            ? "- run a trivial imbalance/spread baseline and compare against a no-trade or fixed-spread baseline."
            : "- only then run a longer bounded no-key capture."
        )
      : "- freeze fee, latency, and order-size assumptions before replay;",
    "",
    "## Candidate Impact",
    "",
    "- C-036 stays benchmark-qualified, but the immediate blocker is capture schema quality, not strategy logic.",
    report.stats.missingSeparateLocalTs === 0
      ? (
          report.stats.missingExchangeTs === 0
            ? "- `orderflow-capture-v2-schema` is complete for the test capture; the new blocker is `hftbacktest-minimal-replay-runtime-spike`."
            : "- `orderflow-capture-v2-schema` is only partially complete for latency-sensitive replay; the new blocker is timestamp evidence by source/type."
        )
      : "- `hftbacktest-orderflow-replay-feasibility` is complete as a schema-fit check; the new blocker is `orderflow-capture-v2-schema`.",
    "- No live trading, keys, paid APIs, watcher thresholds, alert wording, risk, sizing, or execution changed."
  );

  return `${lines.join("\n")}\n`;
}
