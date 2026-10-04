#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const PAPER_SIGNALS_PATH = path.join(ROOT, "paper", "signals.json");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "paper-signal-precision-repair.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "paper-signal-precision-repair.md");

const PRICE_DIGITS = 8;

const nowIso = () => new Date().toISOString();
const round = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "n/a";
const cell = (value) => String(value ?? "n/a").replaceAll("|", " / ");

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function readOptionalJson(file) {
  try {
    return await readJson(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function table(rows, columns) {
  if (!rows.length) return "_No rows._";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map((column) => column.align ?? "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(column.value(row))).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function candleFile(source, productId, timeframeId) {
  return path.join(CANDLE_DIR, `${source}-${productId}-${timeframeId}.json`);
}

async function loadCandlesForSignal(signal, symbolConfig) {
  const candidates = [];
  if (symbolConfig?.binanceSpotSymbol) {
    candidates.push(candleFile("binance-spot", symbolConfig.binanceSpotSymbol, signal.timeframe));
  }
  candidates.push(candleFile("coinbase", signal.productId, signal.timeframe));
  candidates.push(path.join(CANDLE_DIR, `${signal.productId}-${signal.timeframe}.json`));

  for (const file of candidates) {
    const candles = await readOptionalJson(file);
    if (Array.isArray(candles) && candles.length) {
      return { candles, sourceFile: path.relative(ROOT, file) };
    }
  }

  return { candles: [], sourceFile: null };
}

function atr(candles, index, period = 14) {
  if (index < period) return null;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) {
    const prevClose = candles[i - 1].close;
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - prevClose),
      Math.abs(candles[i].low - prevClose)
    );
    sum += tr;
  }
  return sum / period;
}

function tradeLevels(entry, direction, atr14, config) {
  const risk = config.risk.stopAtr * atr14;
  if (direction === "long") {
    return { stop: entry - risk, target: entry + risk * config.risk.targetR, risk };
  }
  return { stop: entry + risk, target: entry - risk * config.risk.targetR, risk };
}

function findCandleIndex(candles, time) {
  return candles.findIndex((candle) => candle.time === time);
}

function needsRepair(signal) {
  if (!Number.isFinite(signal.entry) || !Number.isFinite(signal.stop) || !Number.isFinite(signal.target)) return true;
  if (signal.entry === signal.stop) return true;
  if (signal.entry === signal.target) return true;
  return Boolean(signal.precisionRepair?.status === "reconstructed_from_candle_cache");
}

function riskPct(signal) {
  if (!Number.isFinite(signal.entry) || !Number.isFinite(signal.stop) || signal.entry === 0) return null;
  return Math.abs(signal.entry - signal.stop) / signal.entry;
}

async function main() {
  const config = await readJson(CONFIG_PATH);
  const paper = await readJson(PAPER_SIGNALS_PATH);
  const symbols = new Map(config.symbols.map((symbol) => [symbol.symbol, symbol]));
  const candleCache = new Map();
  const signals = Array.isArray(paper.signals) ? paper.signals : [];
  const beforeBadRisk = signals.filter((signal) => riskPct(signal) === 0 || riskPct(signal) === null).length;
  const repaired = [];
  const skipped = [];

  for (const signal of signals) {
    const symbolConfig = symbols.get(signal.symbol);
    if (!symbolConfig) {
      skipped.push({ id: signal.id, reason: "symbol_config_missing" });
      continue;
    }

    const cacheKey = `${signal.symbol}:${signal.timeframe}`;
    if (!candleCache.has(cacheKey)) {
      candleCache.set(cacheKey, await loadCandlesForSignal(signal, symbolConfig));
    }

    const loaded = candleCache.get(cacheKey);
    const index = findCandleIndex(loaded.candles, signal.openedAt);
    if (index < 0) {
      skipped.push({ id: signal.id, reason: "entry_candle_missing" });
      continue;
    }

    const atr14 = atr(loaded.candles, index, 14);
    if (!Number.isFinite(atr14) || atr14 <= 0) {
      skipped.push({ id: signal.id, reason: "atr_unavailable" });
      continue;
    }

    if (!needsRepair(signal)) continue;

    const original = {
      entry: signal.entry,
      stop: signal.stop,
      target: signal.target,
    };
    const entry = loaded.candles[index].close;
    const levels = tradeLevels(entry, signal.direction, atr14, config);
    signal.entry = round(entry, PRICE_DIGITS);
    signal.stop = round(levels.stop, PRICE_DIGITS);
    signal.target = round(levels.target, PRICE_DIGITS);
    signal.precisionRepair = {
      status: "reconstructed_from_candle_cache",
      repairedAt: nowIso(),
      sourceFile: loaded.sourceFile,
      atr14: round(atr14, PRICE_DIGITS),
      priceDigits: PRICE_DIGITS,
      original,
    };
    repaired.push({
      id: signal.id,
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      setup: signal.setup,
      direction: signal.direction,
      openedAt: signal.openedAt,
      original,
      repaired: {
        entry: signal.entry,
        stop: signal.stop,
        target: signal.target,
      },
      riskPctBefore: round(Math.abs((original.entry ?? 0) - (original.stop ?? 0)) / (original.entry || 1), 8),
      riskPctAfter: round(riskPct(signal), 8),
    });
  }

  const afterBadRisk = signals.filter((signal) => riskPct(signal) === 0 || riskPct(signal) === null).length;
  const updatedPaper = {
    ...paper,
    updated: nowIso(),
    precisionRepair: {
      status: afterBadRisk === 0 ? "complete" : "partial",
      repairedAt: nowIso(),
      priceDigits: PRICE_DIGITS,
      beforeBadRisk,
      afterBadRisk,
      repaired: repaired.length,
      skipped: skipped.length,
      boundaries: [
        "research_only",
        "no_live_execution",
        "no_exchange_keys",
        "no_paid_apis",
        "no_tradingview_automation",
        "no_alert_wording_threshold_watcher_or_sizing_changes",
      ],
    },
    signals,
  };

  await writeJson(PAPER_SIGNALS_PATH, updatedPaper);

  const bySymbol = new Map();
  for (const row of repaired) {
    const key = `${row.symbol}:${row.timeframe}`;
    bySymbol.set(key, (bySymbol.get(key) ?? 0) + 1);
  }
  const report = {
    generated: nowIso(),
    status: updatedPaper.precisionRepair.status,
    source: path.relative(ROOT, PAPER_SIGNALS_PATH),
    outputs: {
      json: path.relative(ROOT, REPORT_JSON_PATH),
      markdown: path.relative(ROOT, REPORT_MD_PATH),
    },
    summary: updatedPaper.precisionRepair,
    bySymbolTimeframe: [...bySymbol.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)),
    sampleRepairs: repaired.slice(0, 20),
    skipped: skipped.slice(0, 50),
    limitations: [
      "This reconstructs detector paper-signal prices from cached entry candles and ATR14; it does not fetch new data.",
      "Existing paper-dashboard resultR fields are not used by DEMO-SIM replay and are not re-scored here.",
      "This repairs measurement precision only; it does not change live watcher behavior, thresholds, sizing, or execution.",
    ],
  };

  await writeJson(REPORT_JSON_PATH, report);

  const bySymbolColumns = [
    { label: "Group", value: (row) => row.key },
    { label: "Repaired", align: "---:", value: (row) => row.count },
  ];
  const repairColumns = [
    { label: "ID", value: (row) => row.id },
    { label: "Old Entry", align: "---:", value: (row) => row.original.entry },
    { label: "Old Stop", align: "---:", value: (row) => row.original.stop },
    { label: "New Entry", align: "---:", value: (row) => row.repaired.entry },
    { label: "New Stop", align: "---:", value: (row) => row.repaired.stop },
    { label: "Risk After", align: "---:", value: (row) => pct(row.riskPctAfter) },
  ];

  const md = `# Paper Signal Precision Repair\n\nGenerated: ${report.generated}\nSource: \`${report.source}\`\n\nStatus: \`${report.status}\`\n\nThis report repairs rounded paper-signal entry/stop/target levels by reconstructing them from cached entry candles and ATR14. It is research-only and does not change live execution, exchange keys, schedulers, TradingView automation, alert wording, thresholds, watchers, risk/sizing, or strategy promotion.\n\n## Summary\n\n| Before Bad Risk | After Bad Risk | Repaired | Skipped |\n| ---: | ---: | ---: | ---: |\n| ${beforeBadRisk} | ${afterBadRisk} | ${repaired.length} | ${skipped.length} |\n\n## Repairs By Symbol And Timeframe\n\n${table(report.bySymbolTimeframe, bySymbolColumns)}\n\n## Sample Repairs\n\n${table(report.sampleRepairs, repairColumns)}\n\n## Limitations\n\n${report.limitations.map((line) => `- ${line}`).join("\n")}\n`;

  await fs.writeFile(REPORT_MD_PATH, md);

  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    beforeBadRisk,
    afterBadRisk,
    repaired: repaired.length,
    skipped: skipped.length,
    reportJson: REPORT_JSON_PATH,
    reportMarkdown: REPORT_MD_PATH,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
