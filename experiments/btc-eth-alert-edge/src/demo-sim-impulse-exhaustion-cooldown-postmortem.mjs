#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-impulse-exhaustion-cooldown-postmortem.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-impulse-exhaustion-cooldown-postmortem.md");

const STARTING_CAPITAL_USD = 10_000;
const FOCUS_WEEK = "2026-W34";
const LOOKBACK_HOURS = 72;
const RECENT_SL_LOOKBACK_HOURS = 6;
const RECENT_SL_MIN_COUNT = 3;
const RECENT_SL_COOLDOWN_HOURS = 24;

const round = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "n/a";
const money = (value) => Number.isFinite(value) ? value.toFixed(2) : "n/a";
const cell = (value) => String(value ?? "n/a").replaceAll("|", " / ");
const iso = (seconds) => new Date(seconds * 1000).toISOString();

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

function candleFile(symbolConfig, timeframe = "4h") {
  return path.join(CANDLE_DIR, `binance-spot-${symbolConfig.binanceSpotSymbol}-${timeframe}.json`);
}

function candleAtOrBefore(candles, time) {
  let found = null;
  for (const candle of candles) {
    if (candle.time > time) break;
    found = candle;
  }
  return found;
}

function returnOver(candles, time, lookbackHours) {
  const end = candleAtOrBefore(candles, time);
  const start = candleAtOrBefore(candles, time - lookbackHours * 3600);
  if (!start || !end || start.time === end.time) return null;
  return (end.close - start.close) / start.close;
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function decorateRows(rows, candlesBySymbol) {
  return rows.map((row) => {
    const btcRet72h = returnOver(candlesBySymbol.get("BTC"), row.entryTime, LOOKBACK_HOURS);
    const targetRet72h = returnOver(candlesBySymbol.get(row.symbol), row.entryTime, LOOKBACK_HOURS);
    const basketReturns = [...candlesBySymbol.entries()]
      .filter(([symbol]) => symbol !== "BTC")
      .map(([, candles]) => returnOver(candles, row.entryTime, LOOKBACK_HOURS));
    return {
      ...row,
      impulseContext: {
        btcRet72h: round(btcRet72h, 6),
        targetRet72h: round(targetRet72h, 6),
        altBasketMedianRet72h: round(median(basketReturns), 6),
      },
    };
  });
}

function evaluateFilter(rows, key, predicate) {
  const kept = [];
  const skipped = [];
  for (const row of rows) {
    if (predicate(row, { kept, skipped, allRows: rows })) skipped.push(row);
    else kept.push(row);
  }
  return {
    key,
    kept: summarize(kept),
    skipped: summarize(skipped),
    skippedRows: skipped.length,
    keptRows: kept.length,
    focusWeekKept: summarize(kept.filter((row) => weekOf(row) === FOCUS_WEEK)),
    focusWeekSkipped: summarize(skipped.filter((row) => weekOf(row) === FOCUS_WEEK)),
  };
}

function recentSlCooldownPredicate(row, state) {
  const lookbackStart = row.entryTime - RECENT_SL_LOOKBACK_HOURS * 3600;
  const recentClosed = state.allRows.filter((prior) => (
    prior.exitTime < row.entryTime
    && prior.exitTime >= lookbackStart
    && prior.exitReason === "SL"
  ));
  if (recentClosed.length >= RECENT_SL_MIN_COUNT) return true;
  const cooldownStart = row.entryTime - RECENT_SL_COOLDOWN_HOURS * 3600;
  return state.skipped.some((skipped) => (
    skipped.exitReason === "SL"
    && skipped.exitTime >= cooldownStart
    && skipped.exitTime < row.entryTime
  ));
}

function classify(results, baseline) {
  const viable = results.filter((row) => (
    row.kept.closedTrades >= 40
    && row.kept.netPnlUsd > 0
    && row.kept.profitFactor >= baseline.profitFactor
    && row.kept.maxDrawdownPct < baseline.maxDrawdownPct
    && row.kept.netPnlUsd >= baseline.netPnlUsd * 0.7
  ));
  if (!viable.length) return "no_cooldown_filter_survives";
  return "cooldown_candidate_needs_forward_test";
}

function table(rows, columns) {
  if (!rows.length) return "_No rows._";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map((column) => column.align ?? "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(column.value(row))).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function renderMarkdown(report) {
  const resultColumns = [
    { label: "Filter", value: (row) => row.key },
    { label: "Kept", align: "---:", value: (row) => row.kept.closedTrades },
    { label: "Kept Net", align: "---:", value: (row) => money(row.kept.netPnlUsd) },
    { label: "Kept PF", align: "---:", value: (row) => row.kept.profitFactor ?? "n/a" },
    { label: "Kept DD", align: "---:", value: (row) => pct(row.kept.maxDrawdownPct) },
    { label: "Skipped", align: "---:", value: (row) => row.skippedRows },
    { label: "Skipped Net", align: "---:", value: (row) => money(row.skipped.netPnlUsd) },
    { label: "W34 Kept Net", align: "---:", value: (row) => money(row.focusWeekKept.netPnlUsd) },
  ];
  const summaryColumns = [
    { label: "Case", value: (row) => row.key },
    { label: "Rows", align: "---:", value: (row) => row.summary.closedTrades },
    { label: "Net", align: "---:", value: (row) => money(row.summary.netPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.summary.profitFactor ?? "n/a" },
    { label: "Winrate", align: "---:", value: (row) => pct(row.summary.winrate) },
    { label: "Max DD", align: "---:", value: (row) => pct(row.summary.maxDrawdownPct) },
  ];
  return `# DEMO-SIM Impulse Exhaustion Cooldown Postmortem\n\nGenerated: ${report.generated}\nStatus: \`${report.status}\`\n\nThis report tests simple research-only no-trade/cooldown filters against the existing \`range_breakout_long + BTC_RISK_ON\` survivor rows. It does not create a new entry rule. It asks whether prior BTC/alt overextension or recent synchronized SL information can cut the 2026-08-22-style damage without deleting the whole 2026-W34 impulse. It uses existing replay rows and local public candle cache only. No live alerts, watcher behavior, scheduler payloads, keys, accounts, sizing, TP/SL, execution, or public posting changed.\n\n## Baseline\n\n${table(report.baselineRows, summaryColumns)}\n\n## Candidate Filters\n\n${table(report.results, resultColumns)}\n\n## Focus Week Filter Impact\n\n${table(report.results.map((row) => ({ key: row.key, summary: row.focusWeekKept })), summaryColumns)}\n\n## Interpretation\n\n${report.interpretation}\n\n## Next Actions\n\n${report.nextActions.map((item) => `- ${item}`).join("\n")}\n`;
}

async function main() {
  const replay = await readJson(REPLAY_JSON_PATH);
  const config = await readJson(CONFIG_PATH);
  const symbolConfigs = new Map(config.symbols.map((symbol) => [symbol.symbol, symbol]));
  const records = closedRecords(replay);
  const selected = selectedRows(records);
  const candlesBySymbol = new Map();
  for (const symbol of [...new Set(["BTC", ...selected.map((row) => row.symbol)])]) {
    const symbolConfig = symbolConfigs.get(symbol);
    if (symbolConfig) candlesBySymbol.set(symbol, await readJson(candleFile(symbolConfig)));
  }
  const decorated = decorateRows(selected, candlesBySymbol);
  const baseline = summarize(decorated);
  const focusWeek = decorated.filter((row) => weekOf(row) === FOCUS_WEEK);

  const results = [
    evaluateFilter(decorated, "skip_btc_72h_return_gt_15pct", (row) => row.impulseContext.btcRet72h > 0.15),
    evaluateFilter(decorated, "skip_alt_basket_72h_median_gt_20pct", (row) => row.impulseContext.altBasketMedianRet72h > 0.20),
    evaluateFilter(decorated, "skip_target_72h_return_gt_25pct", (row) => row.impulseContext.targetRet72h > 0.25),
    evaluateFilter(decorated, "cooldown_after_3_sl_in_6h_for_24h", recentSlCooldownPredicate),
  ];
  const status = classify(results, baseline);
  const best = [...results].sort((a, b) => (
    (b.kept.netPnlUsd - baseline.netPnlUsd) - (a.kept.netPnlUsd - baseline.netPnlUsd)
  ))[0];

  const report = {
    generated: new Date().toISOString(),
    status,
    workItem: "validation.impulse-exhaustion-cooldown-postmortem",
    baselineRows: [
      { key: "selected_all", summary: baseline },
      { key: FOCUS_WEEK, summary: summarize(focusWeek) },
      { key: "outside_focus_week", summary: summarize(decorated.filter((row) => weekOf(row) !== FOCUS_WEEK)) },
    ],
    assumptions: {
      selectedFilter: "setup=range_breakout_long, direction=long, btcGate.state=BTC_RISK_ON",
      lookbackHours: LOOKBACK_HOURS,
      recentSlLookbackHours: RECENT_SL_LOOKBACK_HOURS,
      recentSlMinCount: RECENT_SL_MIN_COUNT,
      recentSlCooldownHours: RECENT_SL_COOLDOWN_HOURS,
      filters: [
        "skip BTC entries when prior 72h BTC return > 15%",
        "skip entries when prior 72h median alt basket return > 20%",
        "skip entries when prior 72h target-symbol return > 25%",
        "skip entries after >=3 selected SL exits in the prior 6h, continuing cooldown for 24h",
      ],
    },
    results,
    byWeek: groupRows(decorated, weekOf),
    byContextBucket: groupRows(decorated, (row) => {
      const b = row.impulseContext.btcRet72h > 0.15 ? "btc_hot" : "btc_normal";
      const a = row.impulseContext.altBasketMedianRet72h > 0.20 ? "alt_hot" : "alt_normal";
      const t = row.impulseContext.targetRet72h > 0.25 ? "target_hot" : "target_normal";
      return `${b}|${a}|${t}`;
    }),
    interpretation: status === "cooldown_candidate_needs_forward_test"
      ? `At least one cooldown candidate improves drawdown while retaining most survivor PnL. Best first candidate by retained net is \`${best.key}\`, but this is still postmortem evidence and must be tested out of sample before any paper/watch use.`
      : "None of the simple cooldown filters cleanly preserves the W34 impulse while materially improving the survivor enough for a research-filter promotion. The postmortem is still useful: overextension and recent SL state describe the failure mode, but the current crude filters are not ready.",
    nextActions: status === "cooldown_candidate_needs_forward_test"
      ? [
        "Convert the best cooldown candidate into a standalone purged forward test before any DEMO-SIM join.",
        "Do not wire to demo-sim:all, cron, live alerts, watchers, sizing, TP/SL, or execution.",
      ]
      : [
        "Keep cooldown ideas as postmortem notes only; do not promote.",
        "If continuing, design a better state feature for synchronized impulse decay using breadth/volatility/orderflow, not just fixed 72h returns.",
        "Do not wire to demo-sim:all, cron, live alerts, watchers, sizing, TP/SL, or execution.",
      ],
    boundaries: [
      "research_only",
      "existing_demo_sim_replay_rows_only",
      "existing_local_public_candle_cache",
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
    status,
    baseline,
    results: results.map((row) => ({ key: row.key, kept: row.kept, skipped: row.skippedRows, skippedNet: row.skipped.netPnlUsd })),
    output: "results/demo-sim-impulse-exhaustion-cooldown-postmortem.md",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
