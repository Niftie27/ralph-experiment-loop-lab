#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const FUNDING_CACHE_PATH = path.join(ROOT, "data", "funding", "hyperliquid-funding-history-demo-sim.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-survivor-cluster-postmortem.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-survivor-cluster-postmortem.md");

const STARTING_CAPITAL_USD = 10_000;
const FOCUS_MONTH = "2026-08";
const FOCUS_WEEK = "2026-W34";
const FUNDING_LOOKBACK_HOURS = 24;
const FUNDING_MAX_STALE_HOURS = 12;
const PERSISTENCE_MIN_STREAK = 8;
const PERSISTENCE_MIN_SHARE = 0.75;

const round = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "n/a";
const money = (value) => Number.isFinite(value) ? value.toFixed(2) : "n/a";
const cell = (value) => String(value ?? "n/a").replaceAll("|", " / ");
const iso = (seconds) => new Date(seconds * 1000).toISOString();
const toMs = (seconds) => seconds * 1000;

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function closedRecords(replay) {
  return (Array.isArray(replay.records) ? replay.records : [])
    .filter((record) => record.status === "closed")
    .sort((a, b) => (a.exitTime ?? 0) - (b.exitTime ?? 0) || String(a.id).localeCompare(String(b.id)));
}

function selectedRows(records) {
  return records.filter((row) => (
    row.setup === "range_breakout_long"
    && row.direction === "long"
    && row.btcGate?.state === "BTC_RISK_ON"
  ));
}

function adjustedPnl(row) {
  return row.pnl?.netPnlUsd ?? 0;
}

function maxDrawdown(rows) {
  let equity = STARTING_CAPITAL_USD;
  let peak = STARTING_CAPITAL_USD;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;
  let maxDrawdownAt = null;
  for (const row of rows) {
    equity += adjustedPnl(row);
    if (equity > peak) peak = equity;
    const drawdownUsd = peak - equity;
    const drawdownPct = peak > 0 ? drawdownUsd / peak : 0;
    if (drawdownUsd > maxDrawdownUsd) {
      maxDrawdownUsd = drawdownUsd;
      maxDrawdownPct = drawdownPct;
      maxDrawdownAt = row.exitTimeIso ?? null;
    }
  }
  return { endingEquityUsd: round(equity, 2), maxDrawdownUsd: round(maxDrawdownUsd, 2), maxDrawdownPct: round(maxDrawdownPct, 6), maxDrawdownAt };
}

function summarize(rows) {
  const pnls = rows.map(adjustedPnl);
  const wins = pnls.filter((pnl) => pnl > 0);
  const losses = pnls.filter((pnl) => pnl <= 0);
  const grossWins = wins.reduce((sum, value) => sum + value, 0);
  const grossLosses = Math.abs(losses.reduce((sum, value) => sum + value, 0));
  const netPnlUsd = pnls.reduce((sum, value) => sum + value, 0);
  return {
    closedTrades: rows.length,
    wins: wins.length,
    losses: losses.length,
    winrate: rows.length ? round(wins.length / rows.length, 6) : null,
    netPnlUsd: round(netPnlUsd, 2),
    avgNetPnlUsd: rows.length ? round(netPnlUsd / rows.length, 4) : null,
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : (grossWins > 0 ? Infinity : null),
    ambiguousTrades: rows.filter((row) => row.ambiguous).length,
    tpTrades: rows.filter((row) => row.exitReason === "TP").length,
    slTrades: rows.filter((row) => row.exitReason === "SL").length,
    timeExitTrades: rows.filter((row) => row.exitReason === "TIME_EXIT").length,
    ...maxDrawdown(rows),
  };
}

function groupRows(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .map(([key, group]) => ({ key, ...summarize(group) }))
    .sort((a, b) => (b.netPnlUsd ?? -Infinity) - (a.netPnlUsd ?? -Infinity) || b.closedTrades - a.closedTrades);
}

function monthOf(row) {
  return row.exitTimeIso?.slice(0, 7) ?? "unknown";
}

function weekOf(row) {
  if (!row.exitTimeIso) return "unknown";
  const date = new Date(row.exitTimeIso);
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((tmp - yearStart) / 86_400_000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function dayOf(row) {
  return row.exitTimeIso?.slice(0, 10) ?? "unknown";
}

function drawdownRuns(rows) {
  const runs = [];
  let current = null;
  for (const row of rows) {
    const pnl = adjustedPnl(row);
    if (pnl <= 0) {
      if (!current) current = { start: row.exitTimeIso, end: row.exitTimeIso, trades: 0, netPnlUsd: 0, symbols: new Set() };
      current.end = row.exitTimeIso;
      current.trades += 1;
      current.netPnlUsd += pnl;
      current.symbols.add(row.symbol);
    } else if (current) {
      runs.push(current);
      current = null;
    }
  }
  if (current) runs.push(current);
  return runs.map((run) => ({
    start: run.start,
    end: run.end,
    trades: run.trades,
    netPnlUsd: round(run.netPnlUsd, 2),
    symbols: [...run.symbols].sort(),
  })).sort((a, b) => a.netPnlUsd - b.netPnlUsd).slice(0, 8);
}

function signLabel(rate) {
  if (!Number.isFinite(rate) || Math.abs(rate) < 1e-9) return "flat";
  return rate > 0 ? "positive" : "negative";
}

function latestFundingAt(rows, entryTimeMs) {
  let index = -1;
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].time > entryTimeMs) break;
    index = i;
  }
  return index >= 0 ? { row: rows[index], index } : { row: null, index: -1 };
}

function fundingPersistence(row, fundingByCoin) {
  const rows = fundingByCoin[row.symbol] || [];
  const entryTimeMs = toMs(row.entryTime);
  const { row: latest, index } = latestFundingAt(rows, entryTimeMs);
  if (!latest) return "unavailable";
  const staleHours = (entryTimeMs - latest.time) / (60 * 60 * 1000);
  if (staleHours > FUNDING_MAX_STALE_HOURS) return "stale";
  const lookbackStartMs = entryTimeMs - FUNDING_LOOKBACK_HOURS * 60 * 60 * 1000;
  const lookback = rows.filter((fundingRow) => fundingRow.time <= entryTimeMs && fundingRow.time >= lookbackStartMs);
  const latestSign = signLabel(latest.fundingRate);
  const signedLookback = lookback.filter((fundingRow) => signLabel(fundingRow.fundingRate) !== "flat");
  const positiveRows = signedLookback.filter((fundingRow) => fundingRow.fundingRate > 0);
  const negativeRows = signedLookback.filter((fundingRow) => fundingRow.fundingRate < 0);
  let sameSignStreak = 0;
  for (let i = index; i >= 0; i -= 1) {
    const sign = signLabel(rows[i].fundingRate);
    if (sign === "flat") continue;
    if (sign !== latestSign) break;
    sameSignStreak += 1;
  }
  const positiveShare = signedLookback.length ? positiveRows.length / signedLookback.length : null;
  const negativeShare = signedLookback.length ? negativeRows.length / signedLookback.length : null;
  if (latestSign === "positive" && sameSignStreak >= PERSISTENCE_MIN_STREAK && Number.isFinite(positiveShare) && positiveShare >= PERSISTENCE_MIN_SHARE) return "persistent_positive";
  if (latestSign === "negative" && sameSignStreak >= PERSISTENCE_MIN_STREAK && Number.isFinite(negativeShare) && negativeShare >= PERSISTENCE_MIN_SHARE) return "persistent_negative";
  return `${latestSign}_not_persistent`;
}

function candleFile(symbolConfig, timeframe = "4h") {
  return path.join(CANDLE_DIR, `binance-spot-${symbolConfig.binanceSpotSymbol}-${timeframe}.json`);
}

function candlesInWindow(candles, startTime, endTime) {
  return candles.filter((candle) => candle.time >= startTime && candle.time <= endTime);
}

function candleReturn(candles, startTime, endTime) {
  const rows = candlesInWindow(candles, startTime, endTime);
  if (rows.length < 2) return null;
  const start = rows[0];
  const end = rows[rows.length - 1];
  const high = Math.max(...rows.map((candle) => candle.high));
  const low = Math.min(...rows.map((candle) => candle.low));
  const avgRangePct = rows.reduce((sum, candle) => sum + ((candle.high - candle.low) / candle.open), 0) / rows.length;
  return {
    candles: rows.length,
    startTimeIso: iso(start.time),
    endTimeIso: iso(end.time),
    startClose: round(start.close, 8),
    endClose: round(end.close, 8),
    returnPct: round((end.close - start.close) / start.close, 6),
    highPctFromStart: round((high - start.close) / start.close, 6),
    lowPctFromStart: round((low - start.close) / start.close, 6),
    avgRangePct: round(avgRangePct, 6),
  };
}

function sma(candles, index, period) {
  if (index + 1 < period) return null;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) sum += candles[i].close;
  return sum / period;
}

function btcStructure(candles, startTime, endTime) {
  const rows = candlesInWindow(candles, startTime, endTime);
  if (!rows.length) return null;
  const enriched = rows.map((candle) => {
    const index = candles.findIndex((item) => item.time === candle.time);
    const ma20 = sma(candles, index, 20);
    const ma50 = sma(candles, index, 50);
    let state = "BTC_TRANSITION";
    if (ma20 && ma50) {
      if (candle.close > ma20 && ma20 > ma50) state = "BTC_RISK_ON";
      else if (candle.close < ma20 && ma20 < ma50) state = "BTC_RISK_OFF";
    }
    return { ...candle, ma20, ma50, state };
  });
  return {
    ...candleReturn(candles, startTime, endTime),
    riskOnShare: round(enriched.filter((row) => row.state === "BTC_RISK_ON").length / enriched.length, 4),
    riskOffShare: round(enriched.filter((row) => row.state === "BTC_RISK_OFF").length / enriched.length, 4),
    transitionShare: round(enriched.filter((row) => row.state === "BTC_TRANSITION").length / enriched.length, 4),
    startState: enriched[0].state,
    endState: enriched[enriched.length - 1].state,
  };
}

function table(rows, columns) {
  if (!rows.length) return "_No rows._";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map((column) => column.align ?? "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(column.value(row))).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function renderMarkdown(report) {
  const summaryColumns = [
    { label: "Case", value: (row) => row.key },
    { label: "Closed", align: "---:", value: (row) => row.closedTrades ?? row.summary?.closedTrades },
    { label: "Net USD", align: "---:", value: (row) => money(row.netPnlUsd ?? row.summary?.netPnlUsd) },
    { label: "Avg USD", align: "---:", value: (row) => money(row.avgNetPnlUsd ?? row.summary?.avgNetPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? row.summary?.profitFactor ?? "n/a" },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate ?? row.summary?.winrate) },
    { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct ?? row.summary?.maxDrawdownPct) },
  ];
  const contextColumns = [
    { label: "Symbol", value: (row) => row.symbol },
    { label: "Month Ret", align: "---:", value: (row) => pct(row.month?.returnPct) },
    { label: "Week Ret", align: "---:", value: (row) => pct(row.week?.returnPct) },
    { label: "Week High", align: "---:", value: (row) => pct(row.week?.highPctFromStart) },
    { label: "Week Low", align: "---:", value: (row) => pct(row.week?.lowPctFromStart) },
    { label: "Avg 4h Range", align: "---:", value: (row) => pct(row.week?.avgRangePct) },
  ];
  const runColumns = [
    { label: "Start", value: (row) => row.start },
    { label: "End", value: (row) => row.end },
    { label: "Trades", align: "---:", value: (row) => row.trades },
    { label: "Net USD", align: "---:", value: (row) => money(row.netPnlUsd) },
    { label: "Symbols", value: (row) => row.symbols.join(",") },
  ];
  return `# DEMO-SIM Survivor Cluster Postmortem\n\nGenerated: ${report.generated}\nStatus: \`${report.status}\`\n\nThis report does not test a new strategy. It decomposes the only useful current pocket, \`range_breakout_long + BTC_RISK_ON\`, with special attention to ${FOCUS_MONTH} / ${FOCUS_WEEK}. It uses existing DEMO-SIM replay rows, local Binance spot candles, and cached public/no-key funding context only. It does not change live alerts, watcher behavior, scheduler payloads, keys, accounts, sizing, TP/SL, execution, or public posting.\n\n## Summary\n\n${table(report.summaryRows, summaryColumns)}\n\n## Focus Splits\n\n### By Symbol\n\n${table(report.focus.bySymbol, summaryColumns)}\n\n### By Timeframe And Tier\n\n${table(report.focus.byTimeframeTier, summaryColumns)}\n\n### By Exit Day\n\n${table(report.focus.byDay, summaryColumns)}\n\n### By Funding Context\n\n${table(report.focus.byFundingPersistence, summaryColumns)}\n\n## BTC Context\n\n- Month BTC return: ${pct(report.marketContext.btc.month.returnPct)}; risk-on share ${pct(report.marketContext.btc.month.riskOnShare)}; average 4h range ${pct(report.marketContext.btc.month.avgRangePct)}.\n- Week BTC return: ${pct(report.marketContext.btc.week.returnPct)}; risk-on share ${pct(report.marketContext.btc.week.riskOnShare)}; high from start ${pct(report.marketContext.btc.week.highPctFromStart)}; low from start ${pct(report.marketContext.btc.week.lowPctFromStart)}.\n\n## Broad Symbol Context\n\n${table(report.marketContext.symbols, contextColumns)}\n\n## Worst Loss Clusters In Focus Week\n\n${table(report.focus.drawdownRuns, runColumns)}\n\n## Mechanism Read\n\n${report.mechanismRead.map((item) => `- ${item}`).join("\n")}\n\n## Next Actions\n\n${report.nextActions.map((item) => `- ${item}`).join("\n")}\n`;
}

async function main() {
  const replay = await readJson(REPLAY_JSON_PATH);
  const config = await readJson(CONFIG_PATH);
  const fundingCache = await readJson(FUNDING_CACHE_PATH);
  const symbolConfigs = new Map(config.symbols.map((symbol) => [symbol.symbol, symbol]));
  const records = closedRecords(replay);
  const selected = selectedRows(records).map((row) => ({
    ...row,
    fundingPersistence: fundingPersistence(row, fundingCache.fundingByCoin || {}),
  }));
  const focusMonthRows = selected.filter((row) => monthOf(row) === FOCUS_MONTH);
  const focusWeekRows = selected.filter((row) => weekOf(row) === FOCUS_WEEK);
  const nonFocusWeekRows = selected.filter((row) => weekOf(row) !== FOCUS_WEEK);

  const focusStart = Math.min(...focusWeekRows.map((row) => row.entryTime));
  const focusEnd = Math.max(...focusWeekRows.map((row) => row.exitTime));
  const monthStart = Math.min(...focusMonthRows.map((row) => row.entryTime));
  const monthEnd = Math.max(...focusMonthRows.map((row) => row.exitTime));

  const btcConfig = symbolConfigs.get("BTC");
  const btcCandles = await readJson(candleFile(btcConfig));
  const marketSymbols = [...new Set(selected.map((row) => row.symbol))].sort();
  const symbolContext = [];
  for (const symbol of marketSymbols) {
    const symbolConfig = symbolConfigs.get(symbol);
    if (!symbolConfig) continue;
    const candles = await readJson(candleFile(symbolConfig));
    symbolContext.push({
      symbol,
      month: candleReturn(candles, monthStart, monthEnd),
      week: candleReturn(candles, focusStart, focusEnd),
    });
  }

  const summaryRows = [
    { key: "selected_all", summary: summarize(selected) },
    { key: FOCUS_MONTH, summary: summarize(focusMonthRows) },
    { key: FOCUS_WEEK, summary: summarize(focusWeekRows) },
    { key: "outside_focus_week", summary: summarize(nonFocusWeekRows) },
  ];
  const focus = {
    bySymbol: groupRows(focusWeekRows, (row) => row.symbol ?? "unknown"),
    byTimeframeTier: groupRows(focusWeekRows, (row) => `${row.timeframe}|${row.tier}`),
    byDay: groupRows(focusWeekRows, dayOf),
    byExitReason: groupRows(focusWeekRows, (row) => row.exitReason ?? "unknown"),
    byFundingPersistence: groupRows(focusWeekRows, (row) => row.fundingPersistence ?? "unknown"),
    drawdownRuns: drawdownRuns(focusWeekRows),
  };

  const report = {
    generated: new Date().toISOString(),
    status: "cluster_explains_survivor_but_not_robust_edge",
    workItem: "validation.survivor-cluster-postmortem",
    focus: {
      month: FOCUS_MONTH,
      week: FOCUS_WEEK,
      rows: focusWeekRows.length,
      bySymbol: focus.bySymbol,
      byTimeframeTier: focus.byTimeframeTier,
      byDay: focus.byDay,
      byExitReason: focus.byExitReason,
      byFundingPersistence: focus.byFundingPersistence,
      drawdownRuns: focus.drawdownRuns,
    },
    summaryRows,
    marketContext: {
      btc: {
        month: btcStructure(btcCandles, monthStart, monthEnd),
        week: btcStructure(btcCandles, focusStart, focusEnd),
      },
      symbols: symbolContext,
    },
    mechanismRead: [
      `${FOCUS_WEEK} contributes ${money(summarize(focusWeekRows).netPnlUsd)} USDT from ${focusWeekRows.length} selected rows; outside that week the same selected survivor has ${money(summarize(nonFocusWeekRows).netPnlUsd)} USDT.`,
      `The focus week is broad rather than single-symbol only: ${focus.bySymbol.filter((row) => row.netPnlUsd > 0).length}/${focus.bySymbol.length} symbols are positive, but the worst loss cluster still hits many symbols together.`,
      `BTC context is supportive but not explosive: BTC stays ${pct(btcStructure(btcCandles, focusStart, focusEnd).riskOnShare)} risk-on through the focus window with ${pct(btcStructure(btcCandles, focusStart, focusEnd).returnPct)} close-to-close return.`,
      "The useful pocket looks like a short-lived broad alt risk-on expansion under BTC confirmation, not a durable standalone range-breakout rule.",
      "The main failure mode is synchronized symbol-level loss after the expansion impulse, especially the 2026-08-22 cluster.",
    ],
    nextActions: [
      "Do not promote the survivor or funding context from this cluster alone.",
      "If continuing research, build a standalone impulse-exhaustion/post-breakout-decay postmortem around 2026-08-22 to identify no-trade or cool-down conditions.",
      "Prefer mechanisms that explain when to stand down after a broad synchronized alt impulse, not more naive entry variants.",
      "Keep all work research-only; no demo-sim:all, cron, watcher, sizing, TP/SL, execution, key, or account changes.",
    ],
    boundaries: [
      "research_only",
      "existing_demo_sim_replay_rows_only",
      "existing_local_public_candle_cache",
      "existing_cached_public_no_key_funding_only",
      "no_new_data_fetch",
      "no_scheduler_or_cron_changes",
      "no_alert_watcher_sizing_tp_sl_or_execution_changes",
      "no_strategy_promotion",
    ],
  };

  await writeJson(REPORT_JSON_PATH, report);
  await fs.writeFile(REPORT_MD_PATH, renderMarkdown(report));
  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    focusWeek: FOCUS_WEEK,
    focusSummary: summarize(focusWeekRows),
    outsideFocusSummary: summarize(nonFocusWeekRows),
    output: "results/demo-sim-survivor-cluster-postmortem.md",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
