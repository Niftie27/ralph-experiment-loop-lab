#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-range-breakout-survivor-stress.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-range-breakout-survivor-stress.md");

const STARTING_CAPITAL_USD = 10_000;
const TOP_POCKET = {
  setup: "range_breakout_long",
  direction: "long",
  btcGateState: "BTC_RISK_ON",
  timeframe: "4h",
  tiers: ["B", "low-sample"],
};

const round = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "n/a";
const money = (value) => Number.isFinite(value) ? value.toFixed(2) : "n/a";
const cell = (value) => String(value ?? "n/a").replaceAll("|", " / ");

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
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

function closedRecords(replay) {
  return (Array.isArray(replay.records) ? replay.records : [])
    .filter((record) => record.status === "closed")
    .sort((a, b) => (a.exitTime ?? 0) - (b.exitTime ?? 0) || String(a.id).localeCompare(String(b.id)));
}

function adjustedPnl(row, costStress) {
  const netPnlUsd = row.pnl?.netPnlUsd ?? 0;
  const feesUsd = row.pnl?.feesUsd ?? 0;
  const notionalUsd = row.pnl?.notionalUsd ?? 0;

  if (costStress === "base") return netPnlUsd;
  if (costStress === "double_fees") return netPnlUsd - feesUsd;
  if (costStress === "extra_10bps_round_trip") return netPnlUsd - (notionalUsd * 10 / 10_000);
  if (costStress === "extra_20bps_round_trip") return netPnlUsd - (notionalUsd * 20 / 10_000);
  throw new Error(`Unknown cost stress: ${costStress}`);
}

function maxDrawdown(rows, costStress = "base", startingCapitalUsd = STARTING_CAPITAL_USD) {
  let equity = startingCapitalUsd;
  let peak = startingCapitalUsd;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;
  let maxDrawdownAt = null;
  let peakAt = null;
  let drawdownStartAt = null;

  for (const row of rows) {
    equity += adjustedPnl(row, costStress);
    if (equity > peak) {
      peak = equity;
      peakAt = row.exitTimeIso ?? null;
    }
    const drawdownUsd = peak - equity;
    const drawdownPct = peak > 0 ? drawdownUsd / peak : 0;
    if (drawdownUsd > maxDrawdownUsd) {
      maxDrawdownUsd = drawdownUsd;
      maxDrawdownPct = drawdownPct;
      maxDrawdownAt = row.exitTimeIso ?? null;
      drawdownStartAt = peakAt;
    }
  }

  return {
    endingEquityUsd: round(equity, 2),
    maxDrawdownUsd: round(maxDrawdownUsd, 2),
    maxDrawdownPct: round(maxDrawdownPct, 6),
    drawdownStartAt,
    maxDrawdownAt,
  };
}

function summarize(rows, options = {}) {
  const costStress = options.costStress ?? "base";
  const pnls = rows.map((row) => adjustedPnl(row, costStress));
  const wins = pnls.filter((pnl) => pnl > 0);
  const losses = pnls.filter((pnl) => pnl <= 0);
  const grossWins = wins.reduce((sum, value) => sum + value, 0);
  const grossLosses = Math.abs(losses.reduce((sum, value) => sum + value, 0));
  const netPnlUsd = pnls.reduce((sum, value) => sum + value, 0);
  const grossPnlUsd = rows.reduce((sum, row) => sum + (row.pnl?.grossPnlUsd ?? 0), 0);
  const feesUsd = rows.reduce((sum, row) => sum + (row.pnl?.feesUsd ?? 0), 0);
  const rRows = rows.filter((row) => Number.isFinite(row.pnl?.rMultiple));
  const netR = rRows.reduce((sum, row) => sum + row.pnl.rMultiple, 0);
  const drawdown = maxDrawdown(rows, costStress);

  return {
    closedTrades: rows.length,
    wins: wins.length,
    losses: losses.length,
    winrate: rows.length ? round(wins.length / rows.length, 6) : null,
    grossPnlUsd: round(grossPnlUsd, 2),
    feesUsd: round(feesUsd, 2),
    costStress,
    netPnlUsd: round(netPnlUsd, 2),
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : (grossWins > 0 ? Infinity : null),
    netR: round(netR, 4),
    avgR: rRows.length ? round(netR / rRows.length, 4) : null,
    invalidRiskRecords: rows.length - rRows.length,
    ambiguousTrades: rows.filter((row) => row.ambiguous).length,
    tpTrades: rows.filter((row) => row.exitReason === "TP").length,
    slTrades: rows.filter((row) => row.exitReason === "SL").length,
    timeExitTrades: rows.filter((row) => row.exitReason === "TIME_EXIT").length,
    endingEquityUsd: drawdown.endingEquityUsd,
    maxDrawdownUsd: drawdown.maxDrawdownUsd,
    maxDrawdownPct: drawdown.maxDrawdownPct,
    drawdownStartAt: drawdown.drawdownStartAt,
    maxDrawdownAt: drawdown.maxDrawdownAt,
  };
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

function groupRows(rows, keyFn, options = {}) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  return [...groups.entries()]
    .map(([key, group]) => ({ key, ...summarize(group, options) }))
    .sort((a, b) => (b.netPnlUsd ?? -Infinity) - (a.netPnlUsd ?? -Infinity) || b.closedTrades - a.closedTrades);
}

function removeBestGroup(rows, keyFn, label) {
  const groups = groupRows(rows, keyFn);
  const best = groups[0] ?? null;
  const remainder = best ? rows.filter((row) => keyFn(row) !== best.key) : rows;
  return {
    label,
    removedKey: best?.key ?? null,
    removed: best,
    remainder: summarize(remainder),
  };
}

function drawdownRuns(rows) {
  const runs = [];
  let current = null;
  for (const row of rows) {
    const pnl = row.pnl?.netPnlUsd ?? 0;
    if (pnl <= 0) {
      if (!current) {
        current = {
          start: row.exitTimeIso,
          end: row.exitTimeIso,
          trades: 0,
          netPnlUsd: 0,
          symbols: new Set(),
        };
      }
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

  return runs
    .map((run) => ({
      start: run.start,
      end: run.end,
      trades: run.trades,
      netPnlUsd: round(run.netPnlUsd, 2),
      symbols: [...run.symbols].sort(),
    }))
    .sort((a, b) => a.netPnlUsd - b.netPnlUsd)
    .slice(0, 5);
}

function topPocketRows(rows) {
  return rows.filter((row) => (
    row.setup === TOP_POCKET.setup
    && row.direction === TOP_POCKET.direction
    && row.btcGate?.state === TOP_POCKET.btcGateState
    && row.timeframe === TOP_POCKET.timeframe
    && TOP_POCKET.tiers.includes(row.tier)
  ));
}

function classifyStress(selectedRows, topRows, stresses) {
  if (selectedRows.length < 60) return "downgrade_low_sample";
  if ((summarize(selectedRows).netPnlUsd ?? 0) <= 0) return "reject_selected_negative";
  if ((summarize(topRows).netPnlUsd ?? 0) <= 0) return "reject_top_pocket_negative";
  if ((stresses.topPocket.removeBestWeek.remainder.netPnlUsd ?? 0) <= 0) return "downgrade_week_concentration";
  if ((stresses.topPocket.removeBestMonth.remainder.netPnlUsd ?? 0) <= 0) return "downgrade_month_concentration";
  if ((stresses.topPocket.removeBestSymbol.remainder.netPnlUsd ?? 0) <= 0) return "downgrade_symbol_concentration";
  if ((stresses.topPocket.costStress.find((row) => row.key === "extra_20bps_round_trip")?.netPnlUsd ?? 0) <= 0) return "downgrade_fee_fragile";
  return "narrow_paper_watch_research_candidate";
}

async function main() {
  const replay = await readJson(REPLAY_JSON_PATH);
  const records = closedRecords(replay);
  const selectedRows = records.filter((row) => (
    row.setup === "range_breakout_long"
    && row.direction === "long"
    && row.btcGate?.state === "BTC_RISK_ON"
  ));
  const topRows = topPocketRows(records);

  const baselines = [
    { key: "no_trade", description: "No-trade baseline on same toy 10k account.", summary: { closedTrades: 0, netPnlUsd: 0, profitFactor: null, maxDrawdownPct: 0, endingEquityUsd: STARTING_CAPITAL_USD } },
    { key: "all_closed_replay", description: "All closed DEMO-SIM replay rows.", summary: summarize(records) },
    { key: "long_only_all_setups", description: "All closed long replay rows.", summary: summarize(records.filter((row) => row.direction === "long")) },
    { key: "range_breakout_long_all_btc_gates", description: "All range_breakout_long rows, all BTC gates.", summary: summarize(records.filter((row) => row.setup === "range_breakout_long" && row.direction === "long")) },
    { key: "range_breakout_long_btc_risk_on", description: "Selected survivor: range_breakout_long + long + BTC_RISK_ON.", summary: summarize(selectedRows) },
    { key: "top_pocket_4h_b_or_low_sample", description: "Known top pocket: 4h + B|low-sample inside selected survivor.", summary: summarize(topRows) },
  ];

  const selectedBreakdowns = {
    byTimeframe: groupRows(selectedRows, (row) => row.timeframe ?? "unknown"),
    byTier: groupRows(selectedRows, (row) => row.tier ?? "unknown"),
    bySymbol: groupRows(selectedRows, (row) => row.symbol ?? "unknown"),
    byMonth: groupRows(selectedRows, monthOf),
    byWeek: groupRows(selectedRows, weekOf),
    byAmbiguity: groupRows(selectedRows, (row) => row.ambiguous ? "ambiguous" : "unambiguous"),
    byExitReason: groupRows(selectedRows, (row) => row.exitReason ?? "unknown"),
  };

  const topPocketBreakdowns = {
    bySymbol: groupRows(topRows, (row) => row.symbol ?? "unknown"),
    byMonth: groupRows(topRows, monthOf),
    byWeek: groupRows(topRows, weekOf),
    byAmbiguity: groupRows(topRows, (row) => row.ambiguous ? "ambiguous" : "unambiguous"),
    byExitReason: groupRows(topRows, (row) => row.exitReason ?? "unknown"),
  };

  const costStress = ["base", "double_fees", "extra_10bps_round_trip", "extra_20bps_round_trip"]
    .map((key) => ({ key, ...summarize(topRows, { costStress: key }) }));

  const stresses = {
    selected: {
      removeBestSymbol: removeBestGroup(selectedRows, (row) => row.symbol ?? "unknown", "selected_without_best_symbol"),
      removeBestMonth: removeBestGroup(selectedRows, monthOf, "selected_without_best_month"),
      removeBestWeek: removeBestGroup(selectedRows, weekOf, "selected_without_best_week"),
      drawdownRuns: drawdownRuns(selectedRows),
    },
    topPocket: {
      removeBestSymbol: removeBestGroup(topRows, (row) => row.symbol ?? "unknown", "top_pocket_without_best_symbol"),
      removeBestMonth: removeBestGroup(topRows, monthOf, "top_pocket_without_best_month"),
      removeBestWeek: removeBestGroup(topRows, weekOf, "top_pocket_without_best_week"),
      costStress,
      drawdownRuns: drawdownRuns(topRows),
    },
  };

  const status = classifyStress(selectedRows, topRows, stresses);
  const failedWeekConcentration = status === "downgrade_week_concentration";
  const topSummary = summarize(topRows);
  const selectedSummary = summarize(selectedRows);
  const blockers = [
    topSummary.maxDrawdownPct > 0.25
      ? `top pocket max drawdown is ${pct(topSummary.maxDrawdownPct)}, above the 25% capital-readiness gate`
      : null,
    stresses.topPocket.costStress.find((row) => row.key === "extra_20bps_round_trip")?.maxDrawdownPct > 0.25
      ? `extra 20 bps round-trip cost stress raises top-pocket drawdown to ${pct(stresses.topPocket.costStress.find((row) => row.key === "extra_20bps_round_trip")?.maxDrawdownPct)}`
      : null,
    selectedBreakdowns.byAmbiguity.find((row) => row.key === "ambiguous")?.netPnlUsd < 0
      ? `ambiguous selected rows are negative (${money(selectedBreakdowns.byAmbiguity.find((row) => row.key === "ambiguous")?.netPnlUsd)} USDT) under SL-first scoring`
      : null,
    stresses.topPocket.drawdownRuns[0]
      ? `worst top-pocket consecutive loss cluster is ${money(stresses.topPocket.drawdownRuns[0].netPnlUsd)} USDT from ${stresses.topPocket.drawdownRuns[0].start} to ${stresses.topPocket.drawdownRuns[0].end}`
      : null,
    stresses.topPocket.removeBestWeek.removed?.netPnlUsd > 0
      ? `best week ${stresses.topPocket.removeBestWeek.removedKey} contributes ${money(stresses.topPocket.removeBestWeek.removed.netPnlUsd)} USDT, so week concentration remains material even though the remainder stays positive`
      : null,
  ].filter(Boolean);

  const report = {
    generated: new Date().toISOString(),
    status,
    sourceReplay: path.relative(ROOT, REPLAY_JSON_PATH),
    outputs: {
      json: path.relative(ROOT, REPORT_JSON_PATH),
      markdown: path.relative(ROOT, REPORT_MD_PATH),
    },
    boundaries: [
      "research_only",
      "existing_replay_json_only",
      "no_live_execution",
      "no_exchange_keys",
      "no_paid_apis",
      "no_scheduler_or_cron_changes",
      "no_tradingview_automation",
      "no_alert_wording_threshold_watcher_or_sizing_changes",
      "no_strategy_promotion",
    ],
    assumptions: {
      selectedFilter: "setup=range_breakout_long, direction=long, btcGate.state=BTC_RISK_ON",
      topPocket: `timeframe=${TOP_POCKET.timeframe}, tier=${TOP_POCKET.tiers.join("|")}`,
      startingCapitalUsd: STARTING_CAPITAL_USD,
      replayPositionSizing: replay.assumptions?.account ?? null,
      fees: replay.assumptions?.fees ?? null,
      execution: replay.assumptions?.execution ?? null,
      killChecks: [
        "top pocket must remain positive after removing best week",
        "top pocket must remain positive after removing best month",
        "top pocket must remain positive after removing best symbol",
        "top pocket must remain positive under extra 20 bps round-trip cost stress",
      ],
    },
    baselines,
    selectedBreakdowns,
    topPocketBreakdowns,
    stresses,
    decision: {
      verdict: status,
      interpretation: failedWeekConcentration
        ? "The survivor remains profitable at the selected and top-pocket levels, but the known 4h B|low-sample pocket fails the remove-best-week stress. Treat the edge as concentrated and downgrade it from survivor to watch-only research reference."
        : "The survivor passed the cheap remove-best symbol/month/week and fee stresses, but remains a narrow research-only paper-watch candidate with blockers. The blockers are large enough to prevent any live, sizing, watcher, TP/SL, execution, or scheduler promotion.",
      nextRoute: failedWeekConcentration ? "funding-persistence-context-baseline" : "paper-watch-only with blockers",
      blockers,
      nextActions: failedWeekConcentration
        ? [
          "Downgrade range_breakout_long + BTC_RISK_ON from current survivor to watch-only research reference.",
          "Route next validation to funding-persistence context baseline.",
          "Do not promote to live, DEMO sizing, watcher behavior, TP/SL, execution, or scheduler automation.",
        ]
        : [
          "Keep only as narrow research-only paper-watch candidate.",
          "Require longer forward replay/paper evidence and independent mechanism validation before any promotion discussion.",
          "Do not promote to live, DEMO sizing, watcher behavior, TP/SL, execution, or scheduler automation.",
        ],
    },
    limitations: [
      "The replay is synthetic historical DEMO-SIM evidence, not exchange fills.",
      "The top pocket was identified by earlier grid search, so multiple-testing and survivorship risk remain material.",
      "Cost stress adjusts closed-row PnL only; it does not remodel queue priority, liquidation, funding, or overlapping margin.",
      "No new data was fetched; this is a falsification pass over the existing replay output.",
    ],
  };

  await writeJson(REPORT_JSON_PATH, report);

  const summaryColumns = [
    { label: "Case", value: (row) => row.key },
    { label: "Closed", align: "---:", value: (row) => row.summary?.closedTrades ?? row.closedTrades },
    { label: "Net USDT", align: "---:", value: (row) => money(row.summary?.netPnlUsd ?? row.netPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.summary?.profitFactor ?? row.profitFactor ?? "n/a" },
    { label: "Max DD", align: "---:", value: (row) => pct(row.summary?.maxDrawdownPct ?? row.maxDrawdownPct) },
  ];
  const groupColumns = [
    { label: "Group", value: (row) => row.key },
    { label: "Closed", align: "---:", value: (row) => row.closedTrades },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Net USDT", align: "---:", value: (row) => money(row.netPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? "n/a" },
    { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
    { label: "Ambig", align: "---:", value: (row) => row.ambiguousTrades },
  ];
  const removalColumns = [
    { label: "Stress", value: (row) => row.label },
    { label: "Removed", value: (row) => row.removedKey },
    { label: "Removed Net", align: "---:", value: (row) => money(row.removed?.netPnlUsd) },
    { label: "Remainder n", align: "---:", value: (row) => row.remainder.closedTrades },
    { label: "Remainder Net", align: "---:", value: (row) => money(row.remainder.netPnlUsd) },
    { label: "Remainder PF", align: "---:", value: (row) => row.remainder.profitFactor ?? "n/a" },
  ];
  const runColumns = [
    { label: "Start", value: (row) => row.start },
    { label: "End", value: (row) => row.end },
    { label: "Trades", align: "---:", value: (row) => row.trades },
    { label: "Net USDT", align: "---:", value: (row) => money(row.netPnlUsd) },
    { label: "Symbols", value: (row) => row.symbols.join(",") },
  ];

  const removalRows = [
    stresses.topPocket.removeBestSymbol,
    stresses.topPocket.removeBestMonth,
    stresses.topPocket.removeBestWeek,
  ];

  const md = `# DEMO-SIM Range Breakout Survivor Stress\n\nGenerated: ${report.generated}\nSource replay: \`${report.sourceReplay}\`\n\nStatus: \`${report.status}\`\n\nThis report runs a research-only falsification pass on \`range_breakout_long + BTC_RISK_ON\` using the existing historical DEMO-SIM replay JSON. It does not fetch data and does not change live execution, accounts, keys, schedulers, cron payloads, alert wording, watcher behavior, sizing, TP/SL, or public posting.\n\n## Baselines\n\n${table(report.baselines, summaryColumns)}\n\n## Selected Survivor Splits\n\nFilter: \`${report.assumptions.selectedFilter}\`\n\n### By Timeframe\n\n${table(report.selectedBreakdowns.byTimeframe, groupColumns)}\n\n### By Tier\n\n${table(report.selectedBreakdowns.byTier, groupColumns)}\n\n### By Symbol\n\n${table(report.selectedBreakdowns.bySymbol, groupColumns)}\n\n### By Month\n\n${table(report.selectedBreakdowns.byMonth, groupColumns)}\n\n### By Ambiguity\n\n${table(report.selectedBreakdowns.byAmbiguity, groupColumns)}\n\n### By Exit Reason\n\n${table(report.selectedBreakdowns.byExitReason, groupColumns)}\n\n## Known Top Pocket\n\nPocket: \`${report.assumptions.topPocket}\`\n\n### Top Pocket By Symbol\n\n${table(report.topPocketBreakdowns.bySymbol, groupColumns)}\n\n### Top Pocket By Month\n\n${table(report.topPocketBreakdowns.byMonth, groupColumns)}\n\n### Top Pocket By Week\n\n${table(report.topPocketBreakdowns.byWeek, groupColumns)}\n\n### Top Pocket Remove-Best Stresses\n\n${table(removalRows, removalColumns)}\n\n### Top Pocket Fee Sensitivity\n\n${table(report.stresses.topPocket.costStress, groupColumns)}\n\n### Worst Consecutive Loss Clusters\n\n${table(report.stresses.topPocket.drawdownRuns, runColumns)}\n\n## Decision\n\nVerdict: \`${report.decision.verdict}\`\n\n${report.decision.interpretation}\n\nNext route: \`${report.decision.nextRoute}\`\n\n## Blockers\n\n${report.decision.blockers.map((item) => `- ${item}`).join("\n")}\n\n## Next Actions\n\n${report.decision.nextActions.map((item) => `- ${item}`).join("\n")}\n\n## Limitations\n\n${report.limitations.map((item) => `- ${item}`).join("\n")}\n`;

  await fs.writeFile(REPORT_MD_PATH, md);

  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    reportJson: REPORT_JSON_PATH,
    reportMarkdown: REPORT_MD_PATH,
    selected: selectedSummary,
    topPocket: topSummary,
    topPocketRemoveBestWeek: stresses.topPocket.removeBestWeek,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
