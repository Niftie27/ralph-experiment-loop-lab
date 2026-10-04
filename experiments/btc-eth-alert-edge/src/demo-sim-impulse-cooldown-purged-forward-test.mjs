#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-impulse-cooldown-purged-forward-test.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-impulse-cooldown-purged-forward-test.md");

const STARTING_CAPITAL_USD = 10_000;
const FOCUS_WEEK = "2026-W34";
const EMBARGO_HOURS = 24;
const LOOKBACK_HOURS = 72;
const TARGET_RETURN_THRESHOLD = 0.25;
const ALT_BASKET_RETURN_THRESHOLD = 0.20;

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
    const targetRet72h = returnOver(candlesBySymbol.get(row.symbol), row.entryTime, LOOKBACK_HOURS);
    const basketReturns = [...candlesBySymbol.entries()]
      .filter(([symbol]) => symbol !== "BTC")
      .map(([, candles]) => returnOver(candles, row.entryTime, LOOKBACK_HOURS));
    return {
      ...row,
      impulseContext: {
        targetRet72h: round(targetRet72h, 6),
        altBasketMedianRet72h: round(median(basketReturns), 6),
      },
    };
  });
}

function applyPolicy(rows, policy) {
  if (policy === "baseline") return rows;
  if (policy === "target_72h_gt_25pct_skip") {
    return rows.filter((row) => !(row.impulseContext.targetRet72h > TARGET_RETURN_THRESHOLD));
  }
  if (policy === "alt_basket_72h_gt_20pct_skip") {
    return rows.filter((row) => !(row.impulseContext.altBasketMedianRet72h > ALT_BASKET_RETURN_THRESHOLD));
  }
  throw new Error(`Unknown policy: ${policy}`);
}

function evaluatePolicy(rows, windows, policy) {
  const keptAll = applyPolicy(rows, policy);
  const out = { key: policy, all: summarize(keptAll) };
  for (const [windowKey, windowRows] of Object.entries(windows)) {
    const kept = applyPolicy(windowRows, policy);
    const skipped = windowRows.filter((row) => !kept.includes(row));
    out[windowKey] = summarize(kept);
    out[`${windowKey}Skipped`] = summarize(skipped);
  }
  return out;
}

function classify(policyRows) {
  const target = policyRows.find((row) => row.key === "target_72h_gt_25pct_skip");
  const baseline = policyRows.find((row) => row.key === "baseline");
  if (!target || !baseline) return "invalid_test";
  if (target.purgedForward.closedTrades < 20) return "postmortem_viable_forward_sample_too_small";
  const improvesForward = target.purgedForward.netPnlUsd > baseline.purgedForward.netPnlUsd
    && (target.purgedForward.profitFactor ?? 0) > (baseline.purgedForward.profitFactor ?? 0)
    && target.purgedForward.maxDrawdownPct < baseline.purgedForward.maxDrawdownPct;
  if (improvesForward) return "viable_forward_validation_candidate";
  if (target.all.netPnlUsd > baseline.all.netPnlUsd && target.all.maxDrawdownPct < baseline.all.maxDrawdownPct) {
    return "postmortem_viable_only_forward_not_confirmed";
  }
  return "not_viable";
}

function table(rows, columns) {
  if (!rows.length) return "_No rows._";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map((column) => column.align ?? "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(column.value(row))).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function renderMarkdown(report) {
  const columns = [
    { label: "Policy", value: (row) => row.key },
    { label: "All n", align: "---:", value: (row) => row.all.closedTrades },
    { label: "All Net", align: "---:", value: (row) => money(row.all.netPnlUsd) },
    { label: "All PF", align: "---:", value: (row) => row.all.profitFactor ?? "n/a" },
    { label: "All DD", align: "---:", value: (row) => pct(row.all.maxDrawdownPct) },
    { label: "Forward n", align: "---:", value: (row) => row.purgedForward.closedTrades },
    { label: "Forward Net", align: "---:", value: (row) => money(row.purgedForward.netPnlUsd) },
    { label: "Forward PF", align: "---:", value: (row) => row.purgedForward.profitFactor ?? "n/a" },
    { label: "Forward DD", align: "---:", value: (row) => pct(row.purgedForward.maxDrawdownPct) },
  ];
  return `# DEMO-SIM Impulse Cooldown Purged Forward Test\n\nGenerated: ${report.generated}\nStatus: \`${report.status}\`\nViability tag: \`${report.viabilityTag}\`\n\nThis report tests the postmortem cooldown candidate outside the focus week with a 24h embargo. It is still standalone and research-only. No live alerts, watcher behavior, scheduler payloads, keys, accounts, sizing, TP/SL, execution, or public posting changed.\n\n## Windows\n\n- Focus week: ${FOCUS_WEEK}\n- Embargo ends: ${report.windows.embargoEndIso}\n- Purged forward rows: ${report.windows.purgedForwardRows}\n\n## Policy Comparison\n\n${table(report.policies, columns)}\n\n## Interpretation\n\n${report.interpretation}\n\n## Next Actions\n\n${report.nextActions.map((item) => `- ${item}`).join("\n")}\n`;
}

async function main() {
  const replay = await readJson(REPLAY_JSON_PATH);
  const config = await readJson(CONFIG_PATH);
  const symbolConfigs = new Map(config.symbols.map((symbol) => [symbol.symbol, symbol]));
  const selected = selectedRows(closedRecords(replay));
  const candlesBySymbol = new Map();
  for (const symbol of [...new Set(["BTC", ...selected.map((row) => row.symbol)])]) {
    const symbolConfig = symbolConfigs.get(symbol);
    if (symbolConfig) candlesBySymbol.set(symbol, await readJson(candleFile(symbolConfig)));
  }
  const rows = decorateRows(selected, candlesBySymbol);
  const focusRows = rows.filter((row) => weekOf(row) === FOCUS_WEEK);
  const focusEnd = Math.max(...focusRows.map((row) => row.exitTime));
  const embargoEnd = focusEnd + EMBARGO_HOURS * 3600;
  const purgedForwardRows = rows.filter((row) => row.entryTime > embargoEnd);
  const nonFocusRows = rows.filter((row) => weekOf(row) !== FOCUS_WEEK);
  const windows = { focus: focusRows, nonFocus: nonFocusRows, purgedForward: purgedForwardRows };
  const policies = ["baseline", "target_72h_gt_25pct_skip", "alt_basket_72h_gt_20pct_skip"]
    .map((policy) => evaluatePolicy(rows, windows, policy));
  const status = classify(policies);
  const viabilityTag = status === "viable_forward_validation_candidate"
    ? "viable_forward_validation_candidate"
    : (status === "postmortem_viable_only_forward_not_confirmed" ? "postmortem_viable_only" : "not_viable");
  const target = policies.find((row) => row.key === "target_72h_gt_25pct_skip");
  const baseline = policies.find((row) => row.key === "baseline");
  const report = {
    generated: new Date().toISOString(),
    status,
    viabilityTag,
    workItem: "validation.impulse-cooldown-purged-forward-test",
    assumptions: {
      selectedFilter: "setup=range_breakout_long, direction=long, btcGate.state=BTC_RISK_ON",
      targetRule: `skip if target-symbol prior ${LOOKBACK_HOURS}h return > ${pct(TARGET_RETURN_THRESHOLD)}`,
      comparisonRule: `skip if median alt-basket prior ${LOOKBACK_HOURS}h return > ${pct(ALT_BASKET_RETURN_THRESHOLD)}`,
      embargoHours: EMBARGO_HOURS,
    },
    windows: {
      focusWeek: FOCUS_WEEK,
      focusRows: focusRows.length,
      focusEndIso: iso(focusEnd),
      embargoEndIso: iso(embargoEnd),
      purgedForwardRows: purgedForwardRows.length,
      nonFocusRows: nonFocusRows.length,
    },
    policies,
    interpretation: status === "viable_forward_validation_candidate"
      ? "The target-symbol overextension skip improves the purged-forward slice as well as the full postmortem sample. It earns the `viable_forward_validation_candidate` tag, still research-only and not paper/live viable."
      : `The target-symbol overextension skip remains useful on the full postmortem sample, but it does not improve the purged-forward slice versus baseline. Purged-forward target policy has ${target.purgedForward.closedTrades} trades, ${money(target.purgedForward.netPnlUsd)} USDT, PF ${target.purgedForward.profitFactor}; purged-forward baseline has ${baseline.purgedForward.closedTrades} trades, ${money(baseline.purgedForward.netPnlUsd)} USDT, PF ${baseline.purgedForward.profitFactor}. Tag is downgraded to postmortem-only viability.`,
    nextActions: status === "viable_forward_validation_candidate"
      ? [
        "Keep as viable forward-validation candidate only.",
        "Run a larger rolling purged walk-forward test before any DEMO-SIM join.",
        "Do not wire to demo-sim:all, cron, live alerts, watchers, sizing, TP/SL, or execution.",
      ]
      : [
        "Tag the rule as postmortem viable only, not forward-validated.",
        "Do not promote or wire to DEMO-SIM/paper/live surfaces.",
        "Either gather more forward rows over time or search for a less overfit breadth/impulse-decay feature.",
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
    viabilityTag,
    purgedForwardBaseline: baseline.purgedForward,
    purgedForwardTargetRule: target.purgedForward,
    output: "results/demo-sim-impulse-cooldown-purged-forward-test.md",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
