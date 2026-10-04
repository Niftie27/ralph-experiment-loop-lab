#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON = path.join(RESULTS_DIR, "market-data-access.json");
const REPORT_MD = path.join(RESULTS_DIR, "market-data-access.md");

const now = Date.now();
const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

const checks = [
  await checkHyperliquidCandles("HYPE", "1h", oneWeekAgo, now),
  await checkHyperliquidFunding("HYPE", now - 30 * 24 * 60 * 60 * 1000, now),
  await checkHyperliquidCurrentContext("HYPE"),
  await checkBybitInstrument("HYPEUSDT"),
  await checkBybitKlines("HYPEUSDT", "60", oneWeekAgo, now),
  await checkBybitFunding("HYPEUSDT"),
  await checkBybitOpenInterest("HYPEUSDT", "1h", oneWeekAgo, now)
];

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  checks,
  summary: {
    accessible: checks.filter((check) => check.status === "accessible").length,
    limited: checks.filter((check) => check.status === "limited").length,
    blocked: checks.filter((check) => check.status === "blocked").length
  },
  decision: "Use Bybit v5 linear klines as the first HYPE historical OHLCV rail; keep Hyperliquid funding/current context and Bybit funding/open-interest as verified next feature rails."
};

await fs.mkdir(RESULTS_DIR, { recursive: true });
await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(REPORT_MD, renderMarkdown(report));
console.log(JSON.stringify({ ok: true, ...report.summary, report: REPORT_JSON }, null, 2));

async function checkHyperliquidCandles(coin, interval, startTime, endTime) {
  const payload = await hyperliquidInfo({ type: "candleSnapshot", req: { coin, interval, startTime, endTime } });
  const rows = Array.isArray(payload) ? payload : [];
  return {
    id: `hyperliquid-${coin}-${interval}-candles`,
    venue: "Hyperliquid",
    endpoint: "POST /info type=candleSnapshot",
    status: rows.length ? "accessible" : "blocked",
    rows: rows.length,
    firstTime: iso(rows[0]?.t),
    lastTime: iso(rows.at(-1)?.t),
    note: "Accessible for recent candles; longer 1h pulls are row-capped in practice, so this is not the first full OHLCV backtest rail."
  };
}

async function checkHyperliquidFunding(coin, startTime, endTime) {
  const payload = await hyperliquidInfo({ type: "fundingHistory", coin, startTime, endTime });
  const rows = Array.isArray(payload) ? payload : [];
  return {
    id: `hyperliquid-${coin}-funding`,
    venue: "Hyperliquid",
    endpoint: "POST /info type=fundingHistory",
    status: rows.length ? "accessible" : "blocked",
    rows: rows.length,
    firstTime: iso(rows[0]?.time),
    lastTime: iso(rows.at(-1)?.time),
    sample: rows.at(-1) || null,
    note: "Verified no-key funding history rail for future funding/premium features."
  };
}

async function checkHyperliquidCurrentContext(coin) {
  const payload = await hyperliquidInfo({ type: "metaAndAssetCtxs" });
  const universe = payload?.[0]?.universe || [];
  const contexts = payload?.[1] || [];
  const index = universe.findIndex((item) => item.name === coin);
  const ctx = index >= 0 ? contexts[index] : null;
  return {
    id: `hyperliquid-${coin}-current-context`,
    venue: "Hyperliquid",
    endpoint: "POST /info type=metaAndAssetCtxs",
    status: ctx ? "accessible" : "blocked",
    rows: ctx ? 1 : 0,
    sample: ctx ? {
      markPx: Number(ctx.markPx),
      funding: Number(ctx.funding),
      openInterest: Number(ctx.openInterest),
      dayNtlVlm: Number(ctx.dayNtlVlm)
    } : null,
    note: "Current funding/open-interest context is accessible, but this is a snapshot rather than a historical series."
  };
}

async function checkBybitInstrument(symbol) {
  const payload = await bybitGet("/v5/market/instruments-info", { category: "linear", symbol });
  const instrument = payload.result?.list?.[0];
  return {
    id: `bybit-${symbol}-instrument`,
    venue: "Bybit",
    endpoint: "GET /v5/market/instruments-info",
    status: instrument ? "accessible" : "blocked",
    rows: instrument ? 1 : 0,
    sample: instrument ? {
      status: instrument.status,
      launchTime: iso(Number(instrument.launchTime)),
      maxLeverage: instrument.leverageFilter?.maxLeverage,
      fundingInterval: Number(instrument.fundingInterval)
    } : null,
    note: "Confirms HYPEUSDT linear perpetual is an active public market."
  };
}

async function checkBybitKlines(symbol, interval, start, end) {
  const payload = await bybitGet("/v5/market/kline", {
    category: "linear",
    symbol,
    interval,
    start,
    end,
    limit: 10
  });
  const rows = payload.result?.list || [];
  return {
    id: `bybit-${symbol}-${interval}-klines`,
    venue: "Bybit",
    endpoint: "GET /v5/market/kline",
    status: rows.length ? "accessible" : "blocked",
    rows: rows.length,
    firstTime: iso(Number(rows.at(-1)?.[0])),
    lastTime: iso(Number(rows[0]?.[0])),
    note: "Pageable and now wired into the strategy filter for HYPE OHLCV."
  };
}

async function checkBybitFunding(symbol) {
  const payload = await bybitGet("/v5/market/funding/history", { category: "linear", symbol, limit: 5 });
  const rows = payload.result?.list || [];
  return {
    id: `bybit-${symbol}-funding`,
    venue: "Bybit",
    endpoint: "GET /v5/market/funding/history",
    status: rows.length ? "accessible" : "blocked",
    rows: rows.length,
    firstTime: iso(Number(rows.at(-1)?.fundingRateTimestamp)),
    lastTime: iso(Number(rows[0]?.fundingRateTimestamp)),
    sample: rows[0] || null,
    note: "Verified funding history rail for future feature joins."
  };
}

async function checkBybitOpenInterest(symbol, intervalTime, startTime, endTime) {
  const payload = await bybitGet("/v5/market/open-interest", {
    category: "linear",
    symbol,
    intervalTime,
    startTime,
    endTime,
    limit: 5
  });
  const rows = payload.result?.list || [];
  return {
    id: `bybit-${symbol}-open-interest`,
    venue: "Bybit",
    endpoint: "GET /v5/market/open-interest",
    status: rows.length ? "accessible" : "blocked",
    rows: rows.length,
    firstTime: iso(Number(rows.at(-1)?.timestamp)),
    lastTime: iso(Number(rows[0]?.timestamp)),
    sample: rows[0] || null,
    note: "Verified open-interest history rail for future feature joins."
  };
}

async function hyperliquidInfo(body) {
  const res = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "User-Agent": "OpenClaw-RALPH-data-rail-audit/0.1"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Hyperliquid info failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function bybitGet(endpoint, params) {
  const url = new URL(`https://api.bybit.com${endpoint}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "OpenClaw-RALPH-data-rail-audit/0.1"
    }
  });
  if (!res.ok) throw new Error(`Bybit ${endpoint} failed: ${res.status} ${await res.text()}`);
  const payload = await res.json();
  if (payload.retCode !== 0) throw new Error(`Bybit ${endpoint} retCode ${payload.retCode}: ${payload.retMsg}`);
  return payload;
}

function renderMarkdown(report) {
  const lines = [
    "# Market Data Access Audit",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    "## Summary",
    "",
    `- Accessible: ${report.summary.accessible}`,
    `- Limited: ${report.summary.limited}`,
    `- Blocked: ${report.summary.blocked}`,
    `- Decision: ${report.decision}`,
    "",
    "## Checks",
    ""
  ];
  for (const check of report.checks) {
    lines.push(
      `### ${check.id}`,
      "",
      `- Venue: ${check.venue}`,
      `- Endpoint: ${check.endpoint}`,
      `- Status: ${check.status}`,
      `- Rows: ${check.rows}`,
      `- First: ${check.firstTime || "n/a"}`,
      `- Last: ${check.lastTime || "n/a"}`,
      `- Note: ${check.note}`,
      ""
    );
  }
  return `${lines.join("\n")}\n`;
}

function iso(value) {
  return Number.isFinite(value) ? new Date(value).toISOString() : null;
}
