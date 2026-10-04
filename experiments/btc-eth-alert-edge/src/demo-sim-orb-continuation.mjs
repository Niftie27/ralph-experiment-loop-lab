#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-orb-continuation.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-orb-continuation.md");

const TIMEFRAME = "1h";
const OPENING_RANGE_HOURS = 4;
const HOLD_BARS = 12;
const EMBARGO_HOURS = 24;
const STARTING_EQUITY = 10_000;
const ROUND_TRIP_COST = ((4 + 2) * 2) / 10_000;

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
    btcClose: round(candle.close, 2),
    btcTime: candle.time,
    btcTimeIso: iso(candle.time),
    reason: `Long ORB candidate requires BTC_RISK_ON; BTC was ${state} by close/MA20/MA50.`,
  };
}

function groupByDay(candles) {
  const days = new Map();
  for (const candle of candles) {
    const key = dayKey(candle.time);
    const day = days.get(key) ?? [];
    day.push(candle);
    days.set(key, day);
  }
  return [...days.entries()].map(([day, rows]) => ({ day, candles: rows.sort((a, b) => a.time - b.time) }));
}

function openingRange(dayCandles) {
  const opening = dayCandles.slice(0, OPENING_RANGE_HOURS);
  if (opening.length < OPENING_RANGE_HOURS) return null;
  return {
    high: Math.max(...opening.map((candle) => candle.high)),
    low: Math.min(...opening.map((candle) => candle.low)),
    startTime: opening[0].time,
    endTime: opening[opening.length - 1].time,
  };
}

function firstAcceptBreakout(dayCandles, range) {
  for (let i = OPENING_RANGE_HOURS; i < dayCandles.length; i += 1) {
    const candle = dayCandles[i];
    const prev = dayCandles[i - 1];
    if (candle.close > range.high && prev.close <= range.high) {
      return { candle, indexInDay: i, eventType: "or_accept_close_above_high" };
    }
  }
  return null;
}

function firstTouchBreakout(dayCandles, range) {
  for (let i = OPENING_RANGE_HOURS; i < dayCandles.length; i += 1) {
    const candle = dayCandles[i];
    if (candle.high >= range.high) {
      return { candle, indexInDay: i, eventType: "or_high_touch_hold" };
    }
  }
  return null;
}

function candleByTime(candles) {
  return new Map(candles.map((candle) => [candle.time, candle]));
}

function makeTrade({ symbol, policy, event, range, exitCandle, btcGate }) {
  const entry = event.candle.close;
  const exit = exitCandle.close;
  const grossReturn = (exit - entry) / entry;
  const netReturn = grossReturn - ROUND_TRIP_COST;
  return {
    id: `${symbol}:${TIMEFRAME}:${policy}:${event.eventType}:${event.candle.time}`,
    symbol,
    timeframe: TIMEFRAME,
    policy,
    eventType: event.eventType,
    day: dayKey(event.candle.time),
    openingRangeHours: OPENING_RANGE_HOURS,
    openingRangeHigh: round(range.high, 8),
    openingRangeLow: round(range.low, 8),
    openingRangeStartTimeIso: iso(range.startTime),
    openingRangeEndTimeIso: iso(range.endTime),
    entryTime: event.candle.time,
    entryTimeIso: iso(event.candle.time),
    entryPrice: round(entry, 8),
    exitTime: exitCandle.time,
    exitTimeIso: iso(exitCandle.time),
    exitPrice: round(exit, 8),
    holdBars: HOLD_BARS,
    grossReturn: round(grossReturn),
    netReturn: round(netReturn),
    netPnlPer10kUsd: round(netReturn * STARTING_EQUITY, 4),
    btcGate,
  };
}

function deriveTradesForSymbol(symbolConfig, candles, btcCandles, policy) {
  const byTime = candleByTime(candles);
  const trades = [];

  for (const day of groupByDay(candles)) {
    const range = openingRange(day.candles);
    if (!range || day.candles.length < OPENING_RANGE_HOURS + HOLD_BARS + 1) continue;

    const event = policy === "orb_acceptance"
      ? firstAcceptBreakout(day.candles, range)
      : firstTouchBreakout(day.candles, range);
    if (!event) continue;

    const exitTime = event.candle.time + HOLD_BARS * 3600;
    const exitCandle = byTime.get(exitTime);
    if (!exitCandle) continue;

    const btcGate = btcGateAt(btcCandles, event.candle.time);
    if (!btcGate.pass) continue;

    trades.push(makeTrade({
      symbol: symbolConfig.symbol,
      policy,
      event,
      range,
      exitCandle,
      btcGate,
    }));
  }

  return trades;
}

function maxDrawdown(trades) {
  let equity = STARTING_EQUITY;
  let peak = STARTING_EQUITY;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;
  let maxDrawdownAt = null;
  for (const trade of [...trades].sort((a, b) => a.exitTime - b.exitTime || a.id.localeCompare(b.id))) {
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
    const forwardStart = Date.parse(`${month}-01T00:00:00.000Z`) / 1000 + EMBARGO_HOURS * 3600;
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

function forwardRowsFromFolds(trades, folds) {
  const keys = new Set(folds.flatMap((fold) => trades
    .filter((trade) => (
      monthKey(trade.exitTime) === fold.forwardMonth &&
      trade.entryTime >= Date.parse(`${fold.forwardMonth}-01T00:00:00.000Z`) / 1000 + EMBARGO_HOURS * 3600
    ))
    .map((trade) => trade.id)));
  return trades.filter((trade) => keys.has(trade.id));
}

function walkForwardSummary(trades) {
  const folds = monthlyWalkForward(trades);
  const forwardRows = forwardRowsFromFolds(trades, folds);
  const forwardMonths = folds.filter((fold) => fold.forward.trades > 0);
  const positiveForwardMonths = forwardMonths.filter((fold) => (fold.forward.netPnlPer10kUsd ?? 0) > 0);
  return {
    walkForward: summarize(forwardRows),
    folds,
    forwardMonths: forwardMonths.length,
    positiveForwardMonths: positiveForwardMonths.length,
    positiveForwardMonthRate: forwardMonths.length ? round(positiveForwardMonths.length / forwardMonths.length) : null,
  };
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

async function summarizeReplayRangeBreakout() {
  const replay = await readJson(REPLAY_PATH);
  const rows = (replay.records ?? []).filter((row) => (
    row.status === "closed" &&
    row.setup === "range_breakout_long" &&
    row.direction === "long" &&
    row.btcGate?.state === "BTC_RISK_ON"
  )).map((row) => ({
    id: row.id,
    symbol: row.symbol,
    exitTime: row.exitTime,
    exitTimeIso: row.exitTimeIso,
    netPnlPer10kUsd: row.pnl?.netPnlUsd ?? 0,
    netReturn: (row.pnl?.netPnlUsd ?? 0) / STARTING_EQUITY,
  }));

  return {
    note: "Existing range-breakout comparison uses available historical DEMO-SIM replay rows, not a candle-native ORB derivation.",
    overall: summarize(rows),
    byMonth: groupRows(rows, (row) => monthKey(row.exitTime)),
    bySymbol: groupRows(rows, (row) => row.symbol),
  };
}

function classifyDecision(primary, touchBaseline, rangeComparison) {
  const reasons = [];
  let verdict = "watch_research_only";

  if (primary.walkForward.trades < 100) {
    verdict = "reject_low_walk_forward_sample";
    reasons.push("ORB acceptance has fewer than 100 purged forward rows");
  }
  if ((primary.walkForward.netPnlPer10kUsd ?? 0) <= 0) {
    verdict = "reject_no_positive_walk_forward_lift";
    reasons.push("ORB acceptance walk-forward net is not positive after fixed costs");
  }
  if ((primary.walkForward.profitFactor ?? 0) <= 1.1) {
    verdict = "reject_weak_walk_forward_profit_factor";
    reasons.push("ORB acceptance walk-forward PF is not above 1.1");
  }
  if ((primary.positiveForwardMonthRate ?? 0) < 0.6) {
    verdict = "reject_unstable_monthly_folds";
    reasons.push("ORB acceptance is not positive in at least 60% of forward months");
  }
  if ((primary.walkForward.maxDrawdownPct ?? 1) > 0.25) {
    verdict = "reject_drawdown_too_high";
    reasons.push("ORB acceptance walk-forward max drawdown is above 25%");
  }
  if ((primary.walkForward.netPnlPer10kUsd ?? 0) <= (touchBaseline.walkForward.netPnlPer10kUsd ?? 0)) {
    verdict = "reject_no_touch_baseline_lift";
    reasons.push("ORB acceptance does not beat the simple OR-high touch baseline");
  }
  if ((primary.walkForward.netPnlPer10kUsd ?? 0) <= (rangeComparison.overall.netPnlPer10kUsd ?? 0)) {
    reasons.push("existing range_breakout_long + BTC_RISK_ON replay remains stronger on its limited comparison surface");
  }
  if (!reasons.length) {
    verdict = "survives_fixed_rule_kill_test_watch_only";
    reasons.push("fixed ORB acceptance clears sample, PF, monthly stability, drawdown, touch-baseline, and existing replay comparison gates");
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
  const loaded = [];
  const missing = [];
  const orbTrades = [];
  const touchTrades = [];

  for (const symbol of altSymbols) {
    const candles = await readOptionalJson(candleFile(symbol.binanceSpotSymbol, TIMEFRAME));
    if (!Array.isArray(candles) || candles.length < 100) {
      missing.push(symbol.symbol);
      continue;
    }
    loaded.push({
      symbol: symbol.symbol,
      rows: candles.length,
      first: iso(candles[0].time),
      last: iso(candles[candles.length - 1].time),
    });
    orbTrades.push(...deriveTradesForSymbol(symbol, candles, btcCandles, "orb_acceptance"));
    touchTrades.push(...deriveTradesForSymbol(symbol, candles, btcCandles, "touch_baseline"));
  }

  const primary = {
    overall: summarize(orbTrades),
    ...walkForwardSummary(orbTrades),
  };
  const touchBaseline = {
    overall: summarize(touchTrades),
    ...walkForwardSummary(touchTrades),
  };
  const rangeComparison = await summarizeReplayRangeBreakout();
  const decision = classifyDecision(primary, touchBaseline, rangeComparison);

  const report = {
    generated: nowIso(),
    status: decision.verdict,
    candidate: "btc-risk-on-opening-range-breakout-continuation",
    test: "fixed_utc_4h_orb_acceptance_long_btc_risk_on",
    boundaries: [
      "research_only",
      "no_live_alert_changes",
      "no_scheduler_changes",
      "no_keys_accounts_or_paid_services",
      "no_sizing_tp_sl_or_execution_changes",
      "no_strategy_promotion",
    ],
    assumptions: {
      timeframe: TIMEFRAME,
      openingRange: "first 4 one-hour candles of each UTC day",
      primaryRule: "Long the first later 1h candle close that accepts above opening-range high, only when BTC gate is BTC_RISK_ON.",
      touchBaseline: "Long the first later 1h candle that touches opening-range high, only when BTC gate is BTC_RISK_ON.",
      entry: "candidate candle close",
      exit: `${HOLD_BARS} bars later at close`,
      costs: "4 bps fee plus 2 bps slippage per side",
      monthlyFold: "previous month fit, current month forward, first 24h of forward month embargoed",
      noTradeBaseline: "0 trades, 0 PnL, 0 drawdown",
      btcGate: "BTC_RISK_ON only, using close/MA20/MA50 proxy shared with historical DEMO-SIM replay context",
      parameterSearch: "none; one fixed ORB rule only",
    },
    sourceData: {
      candleDir: path.relative(ROOT, CANDLE_DIR),
      loaded,
      missing,
      replay: path.relative(ROOT, REPLAY_PATH),
    },
    results: {
      primary,
      touchBaseline,
      noTradeBaseline: {
        overall: summarize([]),
        walkForward: summarize([]),
      },
      primaryBySymbol: groupRows(orbTrades, (trade) => trade.symbol),
      primaryByMonth: groupRows(orbTrades, (trade) => monthKey(trade.exitTime)),
      touchBySymbol: groupRows(touchTrades, (trade) => trade.symbol),
      rangeBreakoutBtcRiskOnComparison: rangeComparison,
    },
    decision,
    limitations: [
      "This is a candle-only 1h fixed-rule kill test and does not include orderflow, funding, queue priority, live fill quality, or margin reservation.",
      "The ORB session is fixed to UTC and intentionally not tuned.",
      "The existing range-breakout comparison is from available DEMO-SIM replay rows and is not timestamp-matched to every candle-native ORB trade.",
      "BTC_RISK_ON is an explicit research proxy, not a live watcher rule change.",
    ],
    outputs: {
      json: path.relative(ROOT, REPORT_JSON_PATH),
      markdown: path.relative(ROOT, REPORT_MD_PATH),
    },
  };

  await writeJson(REPORT_JSON_PATH, report);

  const summaryColumns = [
    { label: "Policy", value: (row) => row.key },
    { label: "All Trades", align: "---:", value: (row) => row.overall.trades },
    { label: "All Net/10k", align: "---:", value: (row) => row.overall.netPnlPer10kUsd },
    { label: "All PF", align: "---:", value: (row) => row.overall.profitFactor ?? "n/a" },
    { label: "WF Trades", align: "---:", value: (row) => row.walkForward.trades },
    { label: "WF Net/10k", align: "---:", value: (row) => row.walkForward.netPnlPer10kUsd },
    { label: "WF PF", align: "---:", value: (row) => row.walkForward.profitFactor ?? "n/a" },
    { label: "WF DD", align: "---:", value: (row) => pct(row.walkForward.maxDrawdownPct) },
    { label: "Pos Months", align: "---:", value: (row) => `${row.positiveForwardMonths ?? 0}/${row.forwardMonths ?? 0}` },
  ];
  const groupColumns = [
    { label: "Group", value: (row) => row.key },
    { label: "Trades", align: "---:", value: (row) => row.trades },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Net/10k", align: "---:", value: (row) => row.netPnlPer10kUsd },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? "n/a" },
    { label: "DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
  ];

  const md = `# DEMO-SIM ORB Continuation Kill Test

Generated: ${report.generated}

Status: \`${report.status}\`

Candidate: \`${report.candidate}\`

This is a fixed-rule research-only kill test for BTC-risk-on opening-range breakout continuation. It uses cached Binance spot 1h candles, a UTC 4h opening range, first close acceptance above the opening-range high, explicit BTC \`BTC_RISK_ON\` gating, fixed 12h hold exit, and fixed conservative costs. It does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, risk/sizing, TP/SL, or execution.

## Decision

Verdict: \`${decision.verdict}\`

${decision.reasons.map((reason) => `- ${reason}`).join("\n")}

## Policy Comparison

${table([
    { key: "orb_acceptance", ...primary },
    { key: "touch_baseline", ...touchBaseline },
    { key: "no_trade", overall: report.results.noTradeBaseline.overall, walkForward: report.results.noTradeBaseline.walkForward, positiveForwardMonths: 0, forwardMonths: 0 },
  ], summaryColumns)}

## ORB By Symbol

${table(report.results.primaryBySymbol, groupColumns)}

## ORB By Month

${table(report.results.primaryByMonth, groupColumns)}

## Touch Baseline By Symbol

${table(report.results.touchBySymbol, groupColumns)}

## Existing Range Breakout BTC_RISK_ON Comparison

${rangeComparison.note}

${table(rangeComparison.byMonth, groupColumns)}

## Fixed Rule

- Timeframe: ${TIMEFRAME}
- Opening range: first ${OPENING_RANGE_HOURS} UTC hourly candles.
- Entry: first later close above opening-range high.
- BTC gate: \`BTC_RISK_ON\` only by close/MA20/MA50 proxy.
- Exit: ${HOLD_BARS} bars later at close.
- Costs: 4 bps fee plus 2 bps slippage per side.
- Parameter search: none.

## Limitations

${report.limitations.map((item) => `- ${item}`).join("\n")}
`;

  await fs.writeFile(REPORT_MD_PATH, md);

  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    primary: {
      overall: primary.overall,
      walkForward: primary.walkForward,
      positiveForwardMonths: primary.positiveForwardMonths,
      forwardMonths: primary.forwardMonths,
    },
    touchBaseline: {
      overall: touchBaseline.overall,
      walkForward: touchBaseline.walkForward,
      positiveForwardMonths: touchBaseline.positiveForwardMonths,
      forwardMonths: touchBaseline.forwardMonths,
    },
    rangeBreakout: rangeComparison.overall,
    outputs: report.outputs,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
