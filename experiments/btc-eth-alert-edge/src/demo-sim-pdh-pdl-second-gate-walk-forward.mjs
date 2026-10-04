#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-pdh-pdl-second-gate-walk-forward.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-pdh-pdl-second-gate-walk-forward.md");

const TIMEFRAME = "1h";
const HOLD_BARS = 12;
const EMBARGO_HOURS = 24;
const STARTING_EQUITY = 10_000;
const SESSION_OFFSETS = [0, 8, 12];

const nowIso = () => new Date().toISOString();
const iso = (seconds) => new Date(seconds * 1000).toISOString();
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

function shiftedDayKey(seconds, sessionOffsetHours) {
  return new Date((seconds - sessionOffsetHours * 3600) * 1000).toISOString().slice(0, 10);
}

function previousDayKey(key) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function monthStartIso(month) {
  return `${month}-01T00:00:00.000Z`;
}

function bySessionDay(candles, sessionOffsetHours) {
  const days = new Map();
  for (const candle of candles) {
    const key = shiftedDayKey(candle.time, sessionOffsetHours);
    const day = days.get(key) ?? {
      day: key,
      high: -Infinity,
      low: Infinity,
      open: candle.open,
      close: candle.close,
      candles: 0,
    };
    day.high = Math.max(day.high, candle.high);
    day.low = Math.min(day.low, candle.low);
    day.close = candle.close;
    day.candles += 1;
    days.set(key, day);
  }
  return days;
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
  if (index < 0) return { state: "BTC_STALE", pass: false };

  const candle = btcCandles[index];
  const ma20 = sma(btcCandles, index, 20);
  const ma50 = sma(btcCandles, index, 50);
  let state = "BTC_TRANSITION";
  if (ma20 && ma50) {
    if (candle.close > ma20 && ma20 > ma50) state = "BTC_RISK_ON";
    else if (candle.close < ma20 && ma20 < ma50) state = "BTC_RISK_OFF";
  }
  return { state, pass: state === "BTC_RISK_ON", btcClose: round(candle.close, 2), btcTimeIso: iso(candle.time) };
}

function sweepEvents(candle, prevDay) {
  const events = [];
  if (candle.low < prevDay.low && candle.close > prevDay.low) {
    events.push({ eventType: "pdl_sweep_reclaim_long", levelName: "PDL", levelPrice: prevDay.low });
  }
  if (candle.low < prevDay.high && candle.close > prevDay.high) {
    events.push({ eventType: "pdh_reclaim_long", levelName: "PDH", levelPrice: prevDay.high });
  }
  return events;
}

function touchEvents(candle, prevDay) {
  const events = [];
  if (candle.low <= prevDay.low) events.push({ eventType: "pdl_touch_hold", levelName: "PDL", levelPrice: prevDay.low });
  if (candle.low <= prevDay.high && candle.high >= prevDay.high) events.push({ eventType: "pdh_touch_hold", levelName: "PDH", levelPrice: prevDay.high });
  return events;
}

function makeTrade({ symbol, candle, exitCandle, event, prevDay, sessionOffsetHours, policy, btcGate }) {
  const entry = candle.close;
  const exit = exitCandle.close;
  const grossReturn = (exit - entry) / entry;
  const roundTripCost = (4 + 2) * 2 / 10_000;
  const netReturn = grossReturn - roundTripCost;
  return {
    id: `${symbol}:${TIMEFRAME}:session${sessionOffsetHours}:${policy}:${event.eventType}:${candle.time}`,
    symbol,
    timeframe: TIMEFRAME,
    sessionOffsetHours,
    policy,
    eventType: event.eventType,
    levelName: event.levelName,
    levelPrice: round(event.levelPrice, 8),
    sessionDay: shiftedDayKey(candle.time, sessionOffsetHours),
    priorSessionDay: prevDay.day,
    entryTime: candle.time,
    entryTimeIso: iso(candle.time),
    exitTime: exitCandle.time,
    exitTimeIso: iso(exitCandle.time),
    entryPrice: round(entry, 8),
    exitPrice: round(exit, 8),
    netReturn: round(netReturn),
    netPnlPer10kUsd: round(netReturn * STARTING_EQUITY, 4),
    btcGate,
  };
}

function deriveTradesForSymbol(symbolConfig, candles, btcCandles, sessionOffsetHours, policy) {
  const days = bySessionDay(candles, sessionOffsetHours);
  const trades = [];
  for (let i = 0; i + HOLD_BARS < candles.length; i += 1) {
    const candle = candles[i];
    const sessionDay = shiftedDayKey(candle.time, sessionOffsetHours);
    const prevDay = days.get(previousDayKey(sessionDay));
    if (!prevDay || prevDay.candles < 12) continue;
    const btcGate = btcGateAt(btcCandles, candle.time);
    if (!btcGate.pass) continue;
    const events = policy === "sweep_reclaim" ? sweepEvents(candle, prevDay) : touchEvents(candle, prevDay);
    for (const event of events) {
      trades.push(makeTrade({
        symbol: symbolConfig.symbol,
        candle,
        exitCandle: candles[i + HOLD_BARS],
        event,
        prevDay,
        sessionOffsetHours,
        policy,
        btcGate,
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
  return { endingEquityUsd: round(equity, 2), maxDrawdownUsd: round(maxDrawdownUsd, 2), maxDrawdownPct: round(maxDrawdownPct), maxDrawdownAt };
}

function summarize(trades) {
  const wins = trades.filter((trade) => trade.netPnlPer10kUsd > 0);
  const losses = trades.filter((trade) => trade.netPnlPer10kUsd <= 0);
  const grossWins = wins.reduce((sum, trade) => sum + trade.netPnlPer10kUsd, 0);
  const grossLosses = Math.abs(losses.reduce((sum, trade) => sum + trade.netPnlPer10kUsd, 0));
  const netPnl = trades.reduce((sum, trade) => sum + trade.netPnlPer10kUsd, 0);
  const avgNetReturn = trades.length ? trades.reduce((sum, trade) => sum + trade.netReturn, 0) / trades.length : null;
  return {
    trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winrate: trades.length ? round(wins.length / trades.length) : null,
    avgNetReturn: round(avgNetReturn),
    netPnlPer10kUsd: round(netPnl, 2),
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : null,
    ...maxDrawdown(trades),
  };
}

function monthsIn(trades) {
  return [...new Set(trades.map((trade) => monthKey(trade.exitTime)))].sort();
}

function previousMonth(month) {
  const date = new Date(`${month}-01T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}

function monthlyWalkForward(trades) {
  const months = monthsIn(trades);
  const folds = [];
  for (const month of months.slice(1)) {
    const fitMonth = previousMonth(month);
    const forwardStart = new Date(monthStartIso(month)).getTime() / 1000 + EMBARGO_HOURS * 3600;
    const fitRows = trades.filter((trade) => monthKey(trade.exitTime) === fitMonth);
    const forwardRows = trades.filter((trade) => monthKey(trade.exitTime) === month && trade.entryTime >= forwardStart);
    if (!fitRows.length && !forwardRows.length) continue;
    folds.push({
      fitMonth,
      forwardMonth: month,
      fit: summarize(fitRows),
      forward: summarize(forwardRows),
    });
  }
  return folds;
}

function groupRows(trades, keyFn) {
  const groups = new Map();
  for (const trade of trades) {
    const key = keyFn(trade);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(trade);
  }
  return [...groups.entries()].map(([key, rows]) => ({ key, ...summarize(rows) }))
    .sort((a, b) => b.trades - a.trades || (b.netPnlPer10kUsd ?? -Infinity) - (a.netPnlPer10kUsd ?? -Infinity));
}

function variantKey(trade) {
  return `${trade.policy}|${trade.eventType}|session_${trade.sessionOffsetHours}h`;
}

function buildVariantSummaries(trades) {
  return groupRows(trades, variantKey).map((variant) => {
    const rows = trades.filter((trade) => variantKey(trade) === variant.key);
    const folds = monthlyWalkForward(rows);
    const forwardRows = folds.flatMap((fold) => rows.filter((trade) => (
      monthKey(trade.exitTime) === fold.forwardMonth &&
      trade.entryTimeIso >= `${fold.forwardMonth}-02T00:00:00.000Z`
    )));
    const forwardMonths = folds.filter((fold) => fold.forward.trades > 0);
    const positiveForwardMonths = forwardMonths.filter((fold) => (fold.forward.netPnlPer10kUsd ?? 0) > 0);
    return {
      ...variant,
      walkForward: summarize(forwardRows),
      folds,
      forwardMonths: forwardMonths.length,
      positiveForwardMonths: positiveForwardMonths.length,
      positiveForwardMonthRate: forwardMonths.length ? round(positiveForwardMonths.length / forwardMonths.length) : null,
    };
  }).sort((a, b) => (b.walkForward.netPnlPer10kUsd ?? -Infinity) - (a.walkForward.netPnlPer10kUsd ?? -Infinity));
}

function summarizeReplayRangeBreakout() {
  return readJson(REPLAY_PATH).then((replay) => {
    const rows = (replay.records ?? []).filter((row) => (
      row.status === "closed" &&
      row.setup === "range_breakout_long" &&
      row.direction === "long" &&
      row.btcGate?.state === "BTC_RISK_ON"
    )).map((row) => ({
      symbol: row.symbol,
      exitTime: row.exitTime,
      exitTimeIso: row.exitTimeIso,
      netPnlPer10kUsd: row.pnl?.netPnlUsd ?? 0,
      netReturn: (row.pnl?.netPnlUsd ?? 0) / STARTING_EQUITY,
    }));
    return {
      note: "Existing DEMO-SIM replay comparison is limited to available paper-signal replay rows, currently August/September only.",
      overall: summarize(rows),
      byMonth: groupRows(rows, (row) => monthKey(row.exitTime)),
      bySymbol: groupRows(rows, (row) => row.symbol),
    };
  });
}

function classifyDecision(topSweep, touchVariants, rangeComparison) {
  const topTouch = touchVariants[0];
  const reasons = [];
  let verdict = "watch_research_only";
  if (!topSweep || topSweep.walkForward.trades < 100) {
    verdict = "reject_low_walk_forward_sample";
    reasons.push("best sweep variant has fewer than 100 purged forward rows");
  }
  if ((topSweep?.positiveForwardMonthRate ?? 0) < 0.6) {
    verdict = "reject_unstable_monthly_folds";
    reasons.push("best sweep variant is not positive in at least 60% of forward months");
  }
  if ((topSweep?.walkForward.profitFactor ?? 0) <= 1.1) {
    verdict = "reject_weak_walk_forward_profit_factor";
    reasons.push("best sweep variant walk-forward PF is not above 1.1");
  }
  if ((topSweep?.walkForward.maxDrawdownPct ?? 1) > 0.25) {
    verdict = "reject_drawdown_too_high";
    reasons.push("best sweep variant max drawdown is above 25%");
  }
  if (topTouch && (topSweep?.walkForward.netPnlPer10kUsd ?? 0) <= (topTouch.walkForward.netPnlPer10kUsd ?? 0)) {
    verdict = "reject_no_touch_baseline_lift";
    reasons.push("best sweep variant does not beat best touch-only baseline");
  }
  if ((rangeComparison.overall.netPnlPer10kUsd ?? 0) > (topSweep?.walkForward.netPnlPer10kUsd ?? 0)) {
    reasons.push("existing range-breakout BTC_RISK_ON replay remains stronger on its limited available surface");
  }
  if (!reasons.length) {
    verdict = "survives_second_gate_watch_only";
    reasons.push("best sweep variant clears sample, monthly stability, PF, drawdown, and touch-baseline lift gates");
  }
  return { verdict, reasons };
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
  const trades = [];
  const loaded = [];

  for (const symbol of altSymbols) {
    const candles = await readOptionalJson(candleFile(symbol.binanceSpotSymbol, TIMEFRAME));
    if (!Array.isArray(candles) || candles.length < 100) continue;
    loaded.push({ symbol: symbol.symbol, rows: candles.length });
    for (const sessionOffsetHours of SESSION_OFFSETS) {
      trades.push(...deriveTradesForSymbol(symbol, candles, btcCandles, sessionOffsetHours, "sweep_reclaim"));
      trades.push(...deriveTradesForSymbol(symbol, candles, btcCandles, sessionOffsetHours, "touch_baseline"));
    }
  }

  const sweepTrades = trades.filter((trade) => trade.policy === "sweep_reclaim");
  const touchTrades = trades.filter((trade) => trade.policy === "touch_baseline");
  const sweepVariants = buildVariantSummaries(sweepTrades);
  const touchVariants = buildVariantSummaries(touchTrades);
  const rangeComparison = await summarizeReplayRangeBreakout();
  const topSweep = sweepVariants[0] ?? null;
  const decision = classifyDecision(topSweep, touchVariants, rangeComparison);

  const report = {
    generated: nowIso(),
    status: decision.verdict,
    candidate: "pdh-pdl-btc-gated-liquidity-sweep-long",
    test: "second_gate_monthly_walk_forward_session_sensitivity",
    boundaries: [
      "research_only",
      "no_live_alert_changes",
      "no_scheduler_changes",
      "no_keys_accounts_or_paid_services",
      "no_sizing_or_execution_changes",
      "no_strategy_promotion",
    ],
    assumptions: {
      timeframe: TIMEFRAME,
      holdBars: HOLD_BARS,
      sessionOffsetsHours: SESSION_OFFSETS,
      monthlyFold: "previous month fit, current month forward, first 24h of forward month embargoed",
      btcGate: "BTC_RISK_ON only, using close/MA20/MA50 proxy shared with DEMO-SIM replay context",
      costs: "4 bps fee plus 2 bps slippage per side",
      comparisonCaveat: rangeComparison.note,
    },
    sourceData: {
      loaded,
      candleDir: path.relative(ROOT, CANDLE_DIR),
      replay: path.relative(ROOT, REPLAY_PATH),
    },
    results: {
      topSweep,
      topTouchBaseline: touchVariants[0] ?? null,
      sweepVariants: sweepVariants.slice(0, 20),
      touchVariants: touchVariants.slice(0, 20),
      sweepBySymbol: groupRows(sweepTrades.filter((trade) => variantKey(trade) === topSweep?.key), (trade) => trade.symbol),
      sweepBySessionOffset: groupRows(sweepTrades, (trade) => `${trade.sessionOffsetHours}h`),
      rangeBreakoutBtcRiskOnComparison: rangeComparison,
    },
    decision,
    limitations: [
      "Session sensitivity uses three simple offsets only: UTC, UTC+8, and UTC+12 style session boundaries.",
      "Monthly folds are still candle-only and do not model book/trade flow, funding, liquidation context, queue position, or margin reservation.",
      "Range-breakout comparison uses available historical DEMO-SIM replay rows, not a freshly derived candle-native range-breakout simulation.",
      "The BTC gate remains a coarse research proxy, not a live watcher rule.",
    ],
    outputs: {
      json: path.relative(ROOT, REPORT_JSON_PATH),
      markdown: path.relative(ROOT, REPORT_MD_PATH),
    },
  };

  await writeJson(REPORT_JSON_PATH, report);

  const variantColumns = [
    { label: "Variant", value: (row) => row.key },
    { label: "WF Trades", align: "---:", value: (row) => row.walkForward.trades },
    { label: "WF Net/10k", align: "---:", value: (row) => row.walkForward.netPnlPer10kUsd },
    { label: "WF PF", align: "---:", value: (row) => row.walkForward.profitFactor ?? "n/a" },
    { label: "WF DD", align: "---:", value: (row) => pct(row.walkForward.maxDrawdownPct) },
    { label: "Pos Months", align: "---:", value: (row) => `${row.positiveForwardMonths}/${row.forwardMonths}` },
    { label: "All Trades", align: "---:", value: (row) => row.trades },
    { label: "All Net/10k", align: "---:", value: (row) => row.netPnlPer10kUsd },
  ];
  const groupColumns = [
    { label: "Group", value: (row) => row.key },
    { label: "Trades", align: "---:", value: (row) => row.trades },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Net/10k", align: "---:", value: (row) => row.netPnlPer10kUsd },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? "n/a" },
    { label: "DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
  ];

  const md = `# DEMO-SIM PDH/PDL Second Gate Walk-Forward

Generated: ${report.generated}

Status: \`${report.status}\`

Candidate: \`${report.candidate}\`

This is a harsher research-only second gate. It splits PDH reclaim from true PDL sweep/reclaim, tests UTC/8h/12h session boundaries, uses previous-month fit/current-month forward folds with a 24h forward embargo, and compares against touch-only plus the existing \`range_breakout_long + BTC_RISK_ON\` DEMO-SIM replay surface. It does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, risk/sizing, TP/SL, or execution.

## Decision

Verdict: \`${decision.verdict}\`

${decision.reasons.map((reason) => `- ${reason}`).join("\n")}

## Top Sweep/Reclaim Variants

${table(report.results.sweepVariants.slice(0, 12), variantColumns)}

## Top Touch Baselines

${table(report.results.touchVariants.slice(0, 12), variantColumns)}

## Best Sweep By Symbol

${table(report.results.sweepBySymbol, groupColumns)}

## Sweep By Session Offset

${table(report.results.sweepBySessionOffset, groupColumns)}

## Range Breakout BTC_RISK_ON Comparison

${rangeComparison.note}

${table(rangeComparison.byMonth, groupColumns)}

## Limitations

${report.limitations.map((item) => `- ${item}`).join("\n")}
`;

  await fs.writeFile(REPORT_MD_PATH, md);

  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    topSweep: {
      key: topSweep?.key,
      walkForward: topSweep?.walkForward,
      positiveForwardMonths: topSweep?.positiveForwardMonths,
      forwardMonths: topSweep?.forwardMonths,
    },
    topTouchBaseline: {
      key: report.results.topTouchBaseline?.key,
      walkForward: report.results.topTouchBaseline?.walkForward,
    },
    rangeBreakout: rangeComparison.overall,
    outputs: report.outputs,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
