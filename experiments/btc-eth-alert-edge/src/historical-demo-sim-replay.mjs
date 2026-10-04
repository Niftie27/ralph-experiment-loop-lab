#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const PAPER_SIGNALS_PATH = path.join(ROOT, "paper", "signals.json");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.md");

const DEFAULTS = {
  marginUsd: 1000,
  leverage: 10,
  feeBpsPerSide: 5.5,
  sameCandleAmbiguityPolicy: "SL_FIRST"
};

const nowIso = () => new Date().toISOString();
const iso = (seconds) => new Date(seconds * 1000).toISOString();
const round = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "n/a";

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function readOptionalJson(file) {
  try {
    return await readJson(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
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

function sma(candles, index, period) {
  if (index + 1 < period) return null;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) sum += candles[i].close;
  return sum / period;
}

function findCandleIndexAtOrBefore(candles, time) {
  let found = -1;
  for (let i = 0; i < candles.length; i += 1) {
    if (candles[i].time > time) break;
    found = i;
  }
  return found;
}

function btcGateForSignal(signal, candleCache) {
  if (signal.symbol === "BTC") {
    return {
      state: "BTC_SELF",
      pass: true,
      reason: "Setup is BTC itself; cross-market alt gate not applied."
    };
  }

  const btcCandles = candleCache.get(`BTC:${signal.timeframe}`);
  if (!btcCandles?.length) {
    return {
      state: "BTC_STALE",
      pass: false,
      reason: `No BTC ${signal.timeframe} candle cache available.`
    };
  }

  const index = findCandleIndexAtOrBefore(btcCandles, signal.openedAt);
  if (index < 0) {
    return {
      state: "BTC_STALE",
      pass: false,
      reason: `No BTC ${signal.timeframe} candle at or before setup time.`
    };
  }

  const candle = btcCandles[index];
  const ma20 = sma(btcCandles, index, 20);
  const ma50 = sma(btcCandles, index, 50);
  let state = "BTC_TRANSITION";
  if (ma20 && ma50) {
    if (candle.close > ma20 && ma20 > ma50) state = "BTC_RISK_ON";
    else if (candle.close < ma20 && ma20 < ma50) state = "BTC_RISK_OFF";
  }

  const direction = signal.direction?.toLowerCase();
  const pass =
    direction === "long" ? state === "BTC_RISK_ON" || state === "BTC_TRANSITION" :
    direction === "short" ? state === "BTC_RISK_OFF" || state === "BTC_TRANSITION" :
    false;

  return {
    state,
    pass,
    btcPrice: round(candle.close, 2),
    btcTime: candle.time,
    btcTimeIso: iso(candle.time),
    reason: `${signal.direction} setup with BTC ${state} by close/MA20/MA50 context.`
  };
}

function hitFlags(signal, candle) {
  if (signal.direction === "long") {
    return {
      hitTakeProfit: candle.high >= signal.target,
      hitStopLoss: candle.low <= signal.stop
    };
  }
  return {
    hitTakeProfit: candle.low <= signal.target,
    hitStopLoss: candle.high >= signal.stop
  };
}

function pnlForExit(signal, exitPrice) {
  const notional = DEFAULTS.marginUsd * DEFAULTS.leverage;
  const side = signal.direction === "short" ? "SHORT" : "LONG";
  const directionalMovePct = side === "LONG"
    ? ((exitPrice - signal.entry) / signal.entry) * 100
    : ((signal.entry - exitPrice) / signal.entry) * 100;
  const grossPnlUsd = notional * (directionalMovePct / 100);
  const feesUsd = notional * (DEFAULTS.feeBpsPerSide / 10_000) * 2;
  const netPnlUsd = grossPnlUsd - feesUsd;
  const riskUsd = notional * (Math.abs(signal.entry - signal.stop) / signal.entry);
  return {
    side,
    marginUsd: DEFAULTS.marginUsd,
    leverage: DEFAULTS.leverage,
    notionalUsd: notional,
    feeBpsPerSide: DEFAULTS.feeBpsPerSide,
    directionalMovePct: round(directionalMovePct, 4),
    grossPnlUsd: round(grossPnlUsd, 4),
    feesUsd: round(feesUsd, 4),
    netPnlUsd: round(netPnlUsd, 4),
    riskUsd: round(riskUsd, 4),
    rMultiple: riskUsd > 0 ? round(netPnlUsd / riskUsd, 4) : null
  };
}

function replaySignal(signal, candles, btcGate) {
  const startIndex = candles.findIndex((candle) => candle.time === signal.openedAt);
  if (startIndex < 0) {
    return {
      id: signal.id,
      status: "skipped",
      reason: "entry_candle_missing",
      signal,
      btcGate
    };
  }

  const maxBars = Number.isFinite(signal.maxBars) ? signal.maxBars : 12;
  const maxIndex = Math.min(candles.length - 1, startIndex + maxBars);
  if (maxIndex <= startIndex) {
    return {
      id: signal.id,
      status: "open_or_insufficient_data",
      reason: "no_forward_candles",
      signal,
      btcGate
    };
  }

  let exit = null;
  for (let i = startIndex + 1; i <= maxIndex; i += 1) {
    const candle = candles[i];
    const { hitTakeProfit, hitStopLoss } = hitFlags(signal, candle);
    if (hitTakeProfit && hitStopLoss) {
      exit = {
        reason: "SL",
        ambiguous: true,
        ambiguityPolicy: DEFAULTS.sameCandleAmbiguityPolicy,
        candle
      };
      break;
    }
    if (hitStopLoss) {
      exit = { reason: "SL", ambiguous: false, candle };
      break;
    }
    if (hitTakeProfit) {
      exit = { reason: "TP", ambiguous: false, candle };
      break;
    }
  }

  if (!exit && candles.length <= startIndex + maxBars) {
    return {
      id: signal.id,
      status: "open_or_insufficient_data",
      reason: "time_exit_not_reached",
      signal,
      btcGate,
      barsAvailable: candles.length - startIndex - 1,
      barsRequired: maxBars
    };
  }

  if (!exit) {
    exit = { reason: "TIME_EXIT", ambiguous: false, candle: candles[maxIndex] };
  }

  const exitPrice =
    exit.reason === "TP" ? signal.target :
    exit.reason === "SL" ? signal.stop :
    exit.candle.close;

  return {
    id: signal.id,
    status: "closed",
    symbol: signal.symbol,
    productId: signal.productId,
    timeframe: signal.timeframe,
    setup: signal.setup,
    direction: signal.direction,
    tier: signal.tier,
    regime: signal.regime,
    entryTime: signal.openedAt,
    entryTimeIso: iso(signal.openedAt),
    entryPrice: signal.entry,
    takeProfitPrice: signal.target,
    stopLossPrice: signal.stop,
    timeExitBars: maxBars,
    exitReason: exit.reason,
    exitTime: exit.candle.time,
    exitTimeIso: iso(exit.candle.time),
    exitPrice,
    ambiguous: exit.ambiguous,
    ambiguityPolicy: exit.ambiguityPolicy || null,
    candleRange: {
      open: exit.candle.open,
      high: exit.candle.high,
      low: exit.candle.low,
      close: exit.candle.close
    },
    pnl: pnlForExit(signal, exitPrice),
    btcGate
  };
}

function aggregate(records) {
  const closed = records.filter((record) => record.status === "closed");
  const wins = closed.filter((record) => record.pnl.netPnlUsd > 0);
  const losses = closed.filter((record) => record.pnl.netPnlUsd <= 0);
  const ambiguous = closed.filter((record) => record.ambiguous);
  const rRecords = closed.filter((record) => Number.isFinite(record.pnl.rMultiple));
  const netPnlUsd = closed.reduce((sum, record) => sum + record.pnl.netPnlUsd, 0);
  const grossWins = wins.reduce((sum, record) => sum + record.pnl.netPnlUsd, 0);
  const grossLosses = Math.abs(losses.reduce((sum, record) => sum + record.pnl.netPnlUsd, 0));
  const netR = rRecords.reduce((sum, record) => sum + record.pnl.rMultiple, 0);
  return {
    total: records.length,
    closed: closed.length,
    openOrSkipped: records.length - closed.length,
    wins: wins.length,
    losses: losses.length,
    winrate: closed.length ? wins.length / closed.length : null,
    netPnlUsd: round(netPnlUsd, 2),
    avgNetPnlUsd: closed.length ? round(netPnlUsd / closed.length, 2) : null,
    netR: round(netR, 4),
    avgR: rRecords.length ? round(netR / rRecords.length, 4) : null,
    invalidRiskRecords: closed.length - rRecords.length,
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : null,
    ambiguousCandles: ambiguous.length,
    exits: {
      TP: closed.filter((record) => record.exitReason === "TP").length,
      SL: closed.filter((record) => record.exitReason === "SL").length,
      TIME_EXIT: closed.filter((record) => record.exitReason === "TIME_EXIT").length
    },
    btcGate: {
      pass: closed.filter((record) => record.btcGate?.pass).length,
      block: closed.filter((record) => record.btcGate && !record.btcGate.pass).length
    }
  };
}

function groupBy(records, keyFn) {
  const out = new Map();
  for (const record of records) {
    const key = keyFn(record);
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(record);
  }
  return [...out.entries()]
    .map(([key, group]) => ({ key, ...aggregate(group) }))
    .sort((a, b) => b.closed - a.closed || (b.avgR ?? -999) - (a.avgR ?? -999));
}

function table(rows, columns) {
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map((column) => column.align || "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => column.format(row)).join(" | ")} |`).join("\n");
  return [header, divider, body].filter(Boolean).join("\n");
}

async function main() {
  const config = await readJson(CONFIG_PATH);
  const signalState = await readJson(PAPER_SIGNALS_PATH);
  const symbols = new Map(config.symbols.map((symbol) => [symbol.symbol, symbol]));
  const candleCache = new Map();
  const sources = [];

  const allSymbols = new Set(["BTC", ...signalState.signals.map((signal) => signal.symbol)]);
  for (const symbol of allSymbols) {
    const symbolConfig = symbols.get(symbol);
    if (!symbolConfig) continue;
    for (const timeframe of config.timeframes) {
      const signalShape = { symbol, productId: symbolConfig.productId, timeframe: timeframe.id };
      const loaded = await loadCandlesForSignal(signalShape, symbolConfig);
      candleCache.set(`${symbol}:${timeframe.id}`, loaded.candles);
      sources.push({
        symbol,
        timeframe: timeframe.id,
        candles: loaded.candles.length,
        sourceFile: loaded.sourceFile
      });
    }
  }

  const records = signalState.signals
    .slice()
    .sort((a, b) => a.openedAt - b.openedAt)
    .map((signal) => {
      const btcGate = btcGateForSignal(signal, candleCache);
      const candles = candleCache.get(`${signal.symbol}:${signal.timeframe}`) || [];
      if (!candles.length) {
        return {
          id: signal.id,
          status: "skipped",
          reason: "candle_cache_missing",
          signal,
          btcGate
        };
      }
      return replaySignal(signal, candles, btcGate);
    });

  const report = {
    generated: nowIso(),
    status: "research-only-no-live-execution",
    sourceSignals: path.relative(ROOT, PAPER_SIGNALS_PATH),
    outputs: {
      json: path.relative(ROOT, REPORT_JSON_PATH),
      markdown: path.relative(ROOT, REPORT_MD_PATH)
    },
    assumptions: {
      account: {
        marginUsd: DEFAULTS.marginUsd,
        leverage: DEFAULTS.leverage,
        notionalUsd: DEFAULTS.marginUsd * DEFAULTS.leverage
      },
      fees: {
        feeBpsPerSide: DEFAULTS.feeBpsPerSide,
        roundTripFeeBps: DEFAULTS.feeBpsPerSide * 2
      },
      execution: {
        entry: "paper signal entry price at setup candle close",
        exits: "first later candle that touches TP or SL; otherwise close at maxBars time-exit",
        sameCandleAmbiguityPolicy: DEFAULTS.sameCandleAmbiguityPolicy,
        slippage: "not modeled separately; live DEMO-SIM fee parity only"
      },
      btcGate: "explicit research context only; historical replay does not discard records"
    },
    sources,
    overall: aggregate(records),
    byTier: groupBy(records, (record) => record.tier || record.signal?.tier || "unknown"),
    bySetup: groupBy(records, (record) => record.setup || record.signal?.setup || "unknown"),
    bySymbolTimeframe: groupBy(records, (record) => `${record.symbol || record.signal?.symbol}:${record.timeframe || record.signal?.timeframe}`),
    byBtcGate: groupBy(records, (record) => record.btcGate?.state || "BTC_UNKNOWN"),
    records
  };

  await writeJson(REPORT_JSON_PATH, report);

  const summaryColumns = [
    { label: "Group", format: (row) => row.key },
    { label: "Closed", align: "---:", format: (row) => row.closed },
    { label: "Winrate", align: "---:", format: (row) => pct(row.winrate) },
    { label: "Avg R", align: "---:", format: (row) => round(row.avgR, 4) ?? "n/a" },
    { label: "Net USDT", align: "---:", format: (row) => row.netPnlUsd ?? "n/a" },
    { label: "Bad R", align: "---:", format: (row) => row.invalidRiskRecords },
    { label: "Ambig", align: "---:", format: (row) => row.ambiguousCandles },
    { label: "TP/SL/T", align: "---:", format: (row) => `${row.exits.TP}/${row.exits.SL}/${row.exits.TIME_EXIT}` }
  ];

  const recentClosed = report.records
    .filter((record) => record.status === "closed")
    .slice(-12)
    .reverse()
    .map((record) => `- ${record.entryTimeIso} ${record.symbol} ${record.timeframe} ${record.direction} ${record.setup}: ${record.exitReason}${record.ambiguous ? " ambiguous SL-first" : ""}, net ${record.pnl.netPnlUsd} USDT, ${record.pnl.rMultiple}R, BTC ${record.btcGate?.state || "n/a"}`)
    .join("\n");

  await fs.writeFile(REPORT_MD_PATH, `# Historical DEMO-SIM Replay\n\nGenerated: ${report.generated}\n\nStatus: research-only, no live execution. This report replays existing paper setup records through a DEMO-SIM-like lifecycle: entry, TP/SL, time-exit, and round-trip fees. It does not modify live watcher behavior, exchange keys, schedulers, or TradingView automation.\n\n## Assumptions\n\n- Entry: paper signal entry price at the setup candle close.\n- Position: ${DEFAULTS.marginUsd} USDT margin at ${DEFAULTS.leverage}x, ${DEFAULTS.marginUsd * DEFAULTS.leverage} USDT notional.\n- Fees: ${DEFAULTS.feeBpsPerSide} bps per side, ${DEFAULTS.feeBpsPerSide * 2} bps round trip, matching live DEMO-SIM paper fee default.\n- Time exit: signal \`maxBars\` on the signal timeframe.\n- Candle ambiguity: if TP and SL are both touched inside one candle, the record is marked ambiguous and scored ${DEFAULTS.sameCandleAmbiguityPolicy}.\n- Bad R: records where rounded signal prices made entry and stop equal, so USDT PnL is still calculated but R-multiple is excluded.\n- BTC gate: recorded as research context for each alt setup; this replay does not discard historical rows.\n\n## Overall\n\n| Total | Closed | Open/skipped | Winrate | Avg R | Net USDT | Profit factor | Bad R | Ambiguous | TP/SL/T |\n| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n| ${report.overall.total} | ${report.overall.closed} | ${report.overall.openOrSkipped} | ${pct(report.overall.winrate)} | ${round(report.overall.avgR, 4) ?? "n/a"} | ${report.overall.netPnlUsd ?? "n/a"} | ${report.overall.profitFactor ?? "n/a"} | ${report.overall.invalidRiskRecords} | ${report.overall.ambiguousCandles} | ${report.overall.exits.TP}/${report.overall.exits.SL}/${report.overall.exits.TIME_EXIT} |\n\n## By Tier\n\n${table(report.byTier, summaryColumns)}\n\n## By Setup\n\n${table(report.bySetup, summaryColumns)}\n\n## By Symbol And Timeframe\n\n${table(report.bySymbolTimeframe, summaryColumns)}\n\n## By BTC Gate\n\n${table(report.byBtcGate, summaryColumns)}\n\n## Recent Closed Replays\n\n${recentClosed || "- No closed replays."}\n`);

  console.log(`Wrote ${REPORT_JSON_PATH}`);
  console.log(`Wrote ${REPORT_MD_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
