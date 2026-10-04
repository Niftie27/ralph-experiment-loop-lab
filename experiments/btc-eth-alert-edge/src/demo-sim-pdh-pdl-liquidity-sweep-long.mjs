#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-pdh-pdl-liquidity-sweep-long.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-pdh-pdl-liquidity-sweep-long.md");

const TIMEFRAME = "1h";
const HOLD_BARS = 12;
const FIT_MONTH = "2026-08";
const FORWARD_MONTH = "2026-09";
const EMBARGO_HOURS = 24;
const STARTING_EQUITY = 10_000;

const nowIso = () => new Date().toISOString();
const iso = (seconds) => new Date(seconds * 1000).toISOString();
const dayKey = (seconds) => iso(seconds).slice(0, 10);
const monthKey = (seconds) => iso(seconds).slice(0, 7);
const round = (value, digits = 6) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : "n/a";
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

function candleFile(binanceSpotSymbol, timeframe) {
  return path.join(CANDLE_DIR, `binance-spot-${binanceSpotSymbol}-${timeframe}.json`);
}

function byDay(candles) {
  const days = new Map();
  for (const candle of candles) {
    const key = dayKey(candle.time);
    const day = days.get(key) ?? {
      day: key,
      high: -Infinity,
      low: Infinity,
      open: candle.open,
      close: candle.close,
      startTime: candle.time,
      endTime: candle.time,
      candles: 0,
    };
    day.high = Math.max(day.high, candle.high);
    day.low = Math.min(day.low, candle.low);
    day.close = candle.close;
    day.endTime = candle.time;
    day.candles += 1;
    days.set(key, day);
  }
  return days;
}

function previousDayKey(key) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function sma(candles, index, period) {
  if (index + 1 < period) return null;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) sum += candles[i].close;
  return sum / period;
}

function btcGateAt(btcCandles, time) {
  let index = -1;
  for (let i = 0; i < btcCandles.length; i += 1) {
    if (btcCandles[i].time > time) break;
    index = i;
  }
  if (index < 0) {
    return { state: "BTC_STALE", pass: false, reason: "No BTC candle at or before candidate time." };
  }

  const candle = btcCandles[index];
  const ma20 = sma(btcCandles, index, 20);
  const ma50 = sma(btcCandles, index, 50);
  let state = "BTC_TRANSITION";
  if (ma20 && ma50) {
    if (candle.close > ma20 && ma20 > ma50) state = "BTC_RISK_ON";
    else if (candle.close < ma20 && ma20 < ma50) state = "BTC_RISK_OFF";
  }

  return {
    state,
    pass: state === "BTC_RISK_ON",
    btcTime: candle.time,
    btcTimeIso: iso(candle.time),
    btcClose: round(candle.close, 2),
    reason: `Long candidate requires BTC_RISK_ON; BTC was ${state} by close/MA20/MA50.`,
  };
}

function classifyEvent(candle, prevDay) {
  const events = [];
  if (candle.low < prevDay.low && candle.close > prevDay.low) {
    events.push({
      type: "pdl_sweep_reclaim_long",
      levelName: "PDL",
      levelPrice: prevDay.low,
      sweepDistancePct: (prevDay.low - candle.low) / prevDay.low,
    });
  }
  if (candle.low < prevDay.high && candle.close > prevDay.high) {
    events.push({
      type: "pdh_reclaim_long",
      levelName: "PDH",
      levelPrice: prevDay.high,
      sweepDistancePct: (prevDay.high - candle.low) / prevDay.high,
    });
  }
  return events;
}

function classifyTouch(candle, prevDay) {
  const events = [];
  if (candle.low <= prevDay.low) {
    events.push({ type: "pdl_touch_hold", levelName: "PDL", levelPrice: prevDay.low });
  }
  if (candle.low <= prevDay.high && candle.high >= prevDay.high) {
    events.push({ type: "pdh_touch_hold", levelName: "PDH", levelPrice: prevDay.high });
  }
  return events;
}

function makeTrade({ symbol, candle, exitCandle, event, prevDay, btcGate, policy }) {
  const entry = candle.close;
  const exit = exitCandle.close;
  const grossReturn = (exit - entry) / entry;
  const roundTripCost = (4 + 2) * 2 / 10_000;
  const netReturn = grossReturn - roundTripCost;
  return {
    id: `${symbol}:${TIMEFRAME}:${policy}:${event.type}:${candle.time}`,
    symbol,
    timeframe: TIMEFRAME,
    policy,
    eventType: event.type,
    levelName: event.levelName,
    levelPrice: round(event.levelPrice, 8),
    priorDay: prevDay.day,
    entryTime: candle.time,
    entryTimeIso: iso(candle.time),
    entryPrice: round(entry, 8),
    exitTime: exitCandle.time,
    exitTimeIso: iso(exitCandle.time),
    exitPrice: round(exit, 8),
    holdBars: HOLD_BARS,
    grossReturn: round(grossReturn),
    netReturn: round(netReturn),
    netPnlPer10kUsd: round(netReturn * STARTING_EQUITY, 4),
    sweepDistancePct: round(event.sweepDistancePct),
    btcGate,
  };
}

function deriveTradesForSymbol(symbolConfig, candles, btcCandles, policy) {
  const days = byDay(candles);
  const trades = [];

  for (let i = 0; i + HOLD_BARS < candles.length; i += 1) {
    const candle = candles[i];
    const prevDay = days.get(previousDayKey(dayKey(candle.time)));
    if (!prevDay || prevDay.candles < 12) continue;

    const btcGate = btcGateAt(btcCandles, candle.time);
    if (!btcGate.pass) continue;

    const events = policy === "sweep_reclaim"
      ? classifyEvent(candle, prevDay)
      : classifyTouch(candle, prevDay);
    for (const event of events) {
      trades.push(makeTrade({
        symbol: symbolConfig.symbol,
        candle,
        exitCandle: candles[i + HOLD_BARS],
        event,
        prevDay,
        btcGate,
        policy,
      }));
    }
  }

  return trades;
}

function maxDrawdown(trades) {
  let equity = STARTING_EQUITY;
  let peak = STARTING_EQUITY;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;
  let maxDrawdownAt = null;

  for (const trade of [...trades].sort((a, b) => a.exitTime - b.exitTime)) {
    equity += trade.netPnlPer10kUsd;
    peak = Math.max(peak, equity);
    const drawdownUsd = peak - equity;
    const drawdownPct = peak > 0 ? drawdownUsd / peak : 0;
    if (drawdownUsd > maxDrawdownUsd) {
      maxDrawdownUsd = drawdownUsd;
      maxDrawdownPct = drawdownPct;
      maxDrawdownAt = trade.exitTimeIso;
    }
  }

  return {
    endingEquityUsd: round(equity, 2),
    maxDrawdownUsd: round(maxDrawdownUsd, 2),
    maxDrawdownPct: round(maxDrawdownPct),
    maxDrawdownAt,
  };
}

function summarize(trades) {
  const wins = trades.filter((trade) => trade.netReturn > 0);
  const losses = trades.filter((trade) => trade.netReturn <= 0);
  const grossWins = wins.reduce((sum, trade) => sum + trade.netPnlPer10kUsd, 0);
  const grossLosses = Math.abs(losses.reduce((sum, trade) => sum + trade.netPnlPer10kUsd, 0));
  const netPnl = trades.reduce((sum, trade) => sum + trade.netPnlPer10kUsd, 0);
  const avgNetReturn = trades.length ? trades.reduce((sum, trade) => sum + trade.netReturn, 0) / trades.length : null;
  const dd = maxDrawdown(trades);
  return {
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winrate: trades.length ? round(wins.length / trades.length) : null,
    avgNetReturn: round(avgNetReturn),
    netPnlPer10kUsd: round(netPnl, 2),
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : null,
    ...dd,
  };
}

function splitTrades(trades) {
  const fit = trades.filter((trade) => monthKey(trade.exitTime) === FIT_MONTH && trade.exitTimeIso < "2026-09-01T00:00:00.000Z");
  const forward = trades.filter((trade) => monthKey(trade.exitTime) === FORWARD_MONTH && trade.entryTimeIso >= "2026-09-02T00:00:00.000Z");
  const embargo = trades.filter((trade) => (
    trade.entryTimeIso >= "2026-09-01T00:00:00.000Z" &&
    trade.entryTimeIso < "2026-09-02T00:00:00.000Z"
  ));
  return { fit, forward, embargo };
}

function groupRows(trades, keyFn) {
  const groups = new Map();
  for (const trade of trades) {
    const key = keyFn(trade);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(trade);
  }
  return [...groups.entries()]
    .map(([key, rows]) => ({ key, ...summarize(rows) }))
    .sort((a, b) => b.trades - a.trades || (b.netPnlPer10kUsd ?? -Infinity) - (a.netPnlPer10kUsd ?? -Infinity));
}

function verdict(primary, touchBaseline) {
  if (primary.forward.trades < 30) return "reject_low_forward_sample";
  if ((primary.forward.netPnlPer10kUsd ?? 0) <= 0) return "reject_no_positive_oos_lift";
  if ((primary.forward.profitFactor ?? 0) <= 1) return "reject_no_forward_profit_factor";
  if ((primary.forward.netPnlPer10kUsd ?? 0) <= (touchBaseline.forward.netPnlPer10kUsd ?? 0)) return "reject_no_touch_baseline_lift";
  if ((primary.forward.maxDrawdownPct ?? 0) > 0.25) return "watch_drawdown_too_high";
  return "survives_first_kill_test";
}

function table(rows, columns) {
  if (!rows.length) return "_No rows._";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map((column) => column.align ?? "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(column.value(row))).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

async function main() {
  const config = await readJson(CONFIG_PATH);
  const btcCandles = await readJson(candleFile("BTCUSDT", TIMEFRAME));
  const altSymbols = config.symbols.filter((symbol) => symbol.symbol !== "BTC");
  const loaded = [];
  const missing = [];
  const sweepTrades = [];
  const touchTrades = [];

  for (const symbol of altSymbols) {
    const candles = await readOptionalJson(candleFile(symbol.binanceSpotSymbol, TIMEFRAME));
    if (!Array.isArray(candles) || candles.length < 100) {
      missing.push(symbol.symbol);
      continue;
    }
    loaded.push({ symbol: symbol.symbol, rows: candles.length });
    sweepTrades.push(...deriveTradesForSymbol(symbol, candles, btcCandles, "sweep_reclaim"));
    touchTrades.push(...deriveTradesForSymbol(symbol, candles, btcCandles, "touch_baseline"));
  }

  const sweepSplit = splitTrades(sweepTrades);
  const touchSplit = splitTrades(touchTrades);
  const primary = {
    overall: summarize(sweepTrades),
    fit: summarize(sweepSplit.fit),
    forward: summarize(sweepSplit.forward),
    embargoedTrades: sweepSplit.embargo.length,
  };
  const touchBaseline = {
    overall: summarize(touchTrades),
    fit: summarize(touchSplit.fit),
    forward: summarize(touchSplit.forward),
    embargoedTrades: touchSplit.embargo.length,
  };
  const status = verdict(primary, touchBaseline);

  const report = {
    generated: nowIso(),
    status,
    candidate: "pdh-pdl-btc-gated-liquidity-sweep-long",
    sourceData: {
      candleDir: path.relative(ROOT, CANDLE_DIR),
      timeframe: TIMEFRAME,
      symbolsLoaded: loaded,
      symbolsMissing: missing,
      btcGate: "BTC_RISK_ON only, using close/MA20/MA50 classifier shared with historical DEMO-SIM replay.",
      sessionDefinition: "UTC calendar day; prior day levels require at least 12 hourly candles.",
    },
    boundaries: [
      "research_only",
      "no_live_alert_changes",
      "no_scheduler_changes",
      "no_keys_accounts_or_paid_services",
      "no_sizing_or_execution_changes",
      "no_strategy_promotion",
    ],
    assumptions: {
      primaryRule: "Long only when an alt 1h candle sweeps below PDL and closes back above PDL, or trades below PDH and closes back above PDH, while BTC gate is BTC_RISK_ON.",
      entry: "candidate candle close",
      exit: `${HOLD_BARS} bars later at close`,
      feesAndSlippage: "4 bps fee plus 2 bps slippage per side, subtracted as fixed round-trip cost.",
      fitWindow: FIT_MONTH,
      forwardWindow: `${FORWARD_MONTH}, with first ${EMBARGO_HOURS}h embargoed after fit boundary`,
      noTradeBaseline: "0 trades, 0 PnL, 0 drawdown",
      touchBaseline: "Timestamp-matched long hold after touching PDH/PDL under the same BTC_RISK_ON gate, without reclaim requirement.",
    },
    results: {
      sweepReclaim: primary,
      touchBaseline,
      baselineLift: {
        forwardNetPnlPer10kUsd: round((primary.forward.netPnlPer10kUsd ?? 0) - (touchBaseline.forward.netPnlPer10kUsd ?? 0), 2),
        forwardProfitFactorDelta: round((primary.forward.profitFactor ?? 0) - (touchBaseline.forward.profitFactor ?? 0), 4),
      },
      breakdowns: {
        sweepForwardBySymbol: groupRows(sweepSplit.forward, (trade) => trade.symbol),
        sweepForwardByEventType: groupRows(sweepSplit.forward, (trade) => trade.eventType),
        sweepAllByMonth: groupRows(sweepTrades, (trade) => monthKey(trade.exitTime)),
        touchForwardBySymbol: groupRows(touchSplit.forward, (trade) => trade.symbol),
      },
    },
    decision: {
      verdict: status,
      interpretation: status.startsWith("reject")
        ? "The cheapest PDH/PDL sweep/reclaim long test fails first-pass falsification: forward/OOS behavior does not clear sample, expectancy, and/or touch-baseline lift gates."
        : "The candidate survived the first cheap falsification pass, but remains research-only and requires stronger purged walk-forward, drawdown, and baseline tests before any promotion.",
      queueAction: "Close validation item as first kill test complete; do not promote strategy.",
    },
    limitations: [
      "This is a mechanical 1h OHLCV-only test; no order book, trades, delta, liquidation, or volume-profile context is used.",
      "PDH/PDL uses UTC days only; alternate sessions are a known ambiguity and remain a kill criterion for later work.",
      "Fixed-hold exits are a cheap falsifier, not an optimized trading plan.",
      "Rows may overlap and do not reserve margin; this is not executable account simulation.",
      "BTC gate is a coarse MA20/MA50 proxy inherited from DEMO-SIM research outputs, not a live watcher rule.",
    ],
    outputs: {
      json: path.relative(ROOT, REPORT_JSON_PATH),
      markdown: path.relative(ROOT, REPORT_MD_PATH),
    },
  };

  await writeJson(REPORT_JSON_PATH, report);

  const summaryColumns = [
    { label: "Policy", value: (row) => row.policy },
    { label: "Window", value: (row) => row.window },
    { label: "Trades", align: "---:", value: (row) => row.trades },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Avg Net", align: "---:", value: (row) => pct(row.avgNetReturn) },
    { label: "Net / 10k", align: "---:", value: (row) => row.netPnlPer10kUsd },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? "n/a" },
    { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
    { label: "Embargo", align: "---:", value: (row) => row.embargoedTrades ?? "" },
  ];
  const groupColumns = [
    { label: "Group", value: (row) => row.key },
    { label: "Trades", align: "---:", value: (row) => row.trades },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Avg Net", align: "---:", value: (row) => pct(row.avgNetReturn) },
    { label: "Net / 10k", align: "---:", value: (row) => row.netPnlPer10kUsd },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? "n/a" },
    { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
  ];
  const summaryRows = [
    { policy: "sweep_reclaim", window: "overall", ...primary.overall },
    { policy: "sweep_reclaim", window: "fit", ...primary.fit },
    { policy: "sweep_reclaim", window: "forward", embargoedTrades: primary.embargoedTrades, ...primary.forward },
    { policy: "touch_baseline", window: "overall", ...touchBaseline.overall },
    { policy: "touch_baseline", window: "fit", ...touchBaseline.fit },
    { policy: "touch_baseline", window: "forward", embargoedTrades: touchBaseline.embargoedTrades, ...touchBaseline.forward },
  ];

  const md = `# DEMO-SIM PDH/PDL BTC-Gated Liquidity Sweep Long

Generated: ${report.generated}

Status: \`${report.status}\`

Candidate: \`${report.candidate}\`

This is the cheapest research-only kill test for the seeded PDH/PDL liquidity sweep long idea. It derives prior UTC day high/low levels from cached public OHLCV, applies the existing BTC \`BTC_RISK_ON\` gate, and compares sweep/reclaim holds against a touch-only hold baseline and no-trade. It does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, risk/sizing, or execution.

## Test Contract

- Primary rule: ${report.assumptions.primaryRule}
- Entry/exit: ${report.assumptions.entry}; ${report.assumptions.exit}.
- Cost: ${report.assumptions.feesAndSlippage}
- Split: fit \`${FIT_MONTH}\`; forward \`${FORWARD_MONTH}\` with first ${EMBARGO_HOURS}h embargoed.
- Session: ${report.sourceData.sessionDefinition}

## Results

${table(summaryRows, summaryColumns)}

Forward baseline lift:

- Net PnL per 10k USD: ${report.results.baselineLift.forwardNetPnlPer10kUsd}
- Profit factor delta: ${report.results.baselineLift.forwardProfitFactorDelta}

## Forward Sweep By Symbol

${table(report.results.breakdowns.sweepForwardBySymbol, groupColumns)}

## Forward Sweep By Event Type

${table(report.results.breakdowns.sweepForwardByEventType, groupColumns)}

## All Sweep By Month

${table(report.results.breakdowns.sweepAllByMonth, groupColumns)}

## Decision

${report.decision.interpretation}

Queue action: ${report.decision.queueAction}

## Limitations

${report.limitations.map((item) => `- ${item}`).join("\n")}
`;

  await fs.writeFile(REPORT_MD_PATH, md);

  console.log(JSON.stringify({
    ok: true,
    status,
    primaryForward: primary.forward,
    touchBaselineForward: touchBaseline.forward,
    baselineLift: report.results.baselineLift,
    outputs: report.outputs,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
