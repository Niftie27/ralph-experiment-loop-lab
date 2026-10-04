#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDLE_DIR = path.join(ROOT, "data", "candles");
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-impulse-decay-state-feature-scan.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-impulse-decay-state-feature-scan.md");

const STARTING_CAPITAL_USD = 10_000;
const FOCUS_WEEK = "2026-W34";
const EMBARGO_HOURS = 24;

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
    .sort((a, b) => (a.entryTime ?? 0) - (b.entryTime ?? 0) || String(a.id).localeCompare(String(b.id)));
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
  for (const row of [...rows].sort((a, b) => (a.exitTime ?? 0) - (b.exitTime ?? 0))) {
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

function returnBetween(candles, startTime, endTime) {
  const start = candleAtOrBefore(candles, startTime);
  const end = candleAtOrBefore(candles, endTime);
  if (!start || !end || start.time === end.time) return null;
  return (end.close - start.close) / start.close;
}

function returnOver(candles, time, lookbackHours) {
  return returnBetween(candles, time - lookbackHours * 3600, time);
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function share(values, predicate) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.filter(predicate).length / finite.length : null;
}

function decorateRows(rows, candlesBySymbol) {
  const alts = [...candlesBySymbol.keys()].filter((symbol) => symbol !== "BTC");
  return rows.map((row) => {
    const alt72 = alts.map((symbol) => returnOver(candlesBySymbol.get(symbol), row.entryTime, 72));
    const alt24 = alts.map((symbol) => returnOver(candlesBySymbol.get(symbol), row.entryTime, 24));
    const altPrev48 = alts.map((symbol) => returnBetween(candlesBySymbol.get(symbol), row.entryTime - 72 * 3600, row.entryTime - 24 * 3600));
    const prior24 = rows.filter((prior) => prior.exitTime < row.entryTime && prior.exitTime >= row.entryTime - 24 * 3600);
    const prior6 = rows.filter((prior) => prior.exitTime < row.entryTime && prior.exitTime >= row.entryTime - 6 * 3600);
    return {
      ...row,
      impulseDecayState: {
        btcRet72h: round(returnOver(candlesBySymbol.get("BTC"), row.entryTime, 72), 6),
        btcRet24h: round(returnOver(candlesBySymbol.get("BTC"), row.entryTime, 24), 6),
        targetRet72h: round(returnOver(candlesBySymbol.get(row.symbol), row.entryTime, 72), 6),
        targetRet24h: round(returnOver(candlesBySymbol.get(row.symbol), row.entryTime, 24), 6),
        altBasketMedianRet72h: round(median(alt72), 6),
        altBasketMedianRet24h: round(median(alt24), 6),
        altBasketMedianRetPrior48h: round(median(altPrev48), 6),
        altBreadth72hGt10Pct: round(share(alt72, (value) => value > 0.10), 6),
        altBreadth24hGt4Pct: round(share(alt24, (value) => value > 0.04), 6),
        prior24hSelectedSlCount: prior24.filter((prior) => prior.exitReason === "SL").length,
        prior6hSelectedSlCount: prior6.filter((prior) => prior.exitReason === "SL").length,
        prior24hSelectedNetPnlUsd: round(prior24.reduce((sum, prior) => sum + adjustedPnl(prior), 0), 2),
      },
    };
  });
}

const states = [
  {
    key: "target_72h_return_gt_25pct",
    description: "Skip target-symbol overextension from the prior postmortem.",
    predicate: (row) => row.impulseDecayState.targetRet72h > 0.25,
  },
  {
    key: "prior48_hot_recent24_cool",
    description: "Skip after broad alt prior-48h impulse when recent 24h median return cools.",
    predicate: (row) => row.impulseDecayState.altBasketMedianRetPrior48h > 0.08 && row.impulseDecayState.altBasketMedianRet24h < 0.03,
  },
  {
    key: "breadth_hot_then_breadth_fades",
    description: "Skip when 72h breadth is hot but recent 24h breadth has faded.",
    predicate: (row) => row.impulseDecayState.altBreadth72hGt10Pct >= 0.50 && row.impulseDecayState.altBreadth24hGt4Pct <= 0.25,
  },
  {
    key: "btc_up_alt_impulse_cools",
    description: "Skip when BTC remains positive while broad alt impulse cools.",
    predicate: (row) => row.impulseDecayState.btcRet24h > 0 && row.impulseDecayState.altBasketMedianRetPrior48h > 0.08 && row.impulseDecayState.altBasketMedianRet24h < 0.03,
  },
  {
    key: "target_hot_breadth_fades",
    description: "Skip target overextension only when broad breadth has already faded.",
    predicate: (row) => row.impulseDecayState.targetRet72h > 0.15 && row.impulseDecayState.altBreadth72hGt10Pct >= 0.50 && row.impulseDecayState.altBreadth24hGt4Pct <= 0.25,
  },
  {
    key: "recent_selected_sl_cluster",
    description: "Skip after 3+ selected stop losses in the prior 24h with negative selected-row net.",
    predicate: (row) => row.impulseDecayState.prior24hSelectedSlCount >= 3 && row.impulseDecayState.prior24hSelectedNetPnlUsd < 0,
  },
  {
    key: "composite_impulse_decay_v1",
    description: "Skip only when broad prior impulse cools and the target is already extended.",
    predicate: (row) => row.impulseDecayState.targetRet72h > 0.15 && row.impulseDecayState.altBasketMedianRetPrior48h > 0.08 && row.impulseDecayState.altBasketMedianRet24h < 0.04,
  },
];

function applyState(rows, state) {
  return {
    skipped: rows.filter(state.predicate),
    kept: rows.filter((row) => !state.predicate(row)),
  };
}

function evaluateState(rows, windows, state, baseline) {
  const all = applyState(rows, state);
  const out = {
    key: state.key,
    description: state.description,
    all: summarize(all.kept),
    allSkipped: summarize(all.skipped),
    skippedRows: all.skipped.length,
    retainedNetPct: baseline.all.netPnlUsd ? round(summarize(all.kept).netPnlUsd / baseline.all.netPnlUsd, 6) : null,
  };
  for (const [windowKey, windowRows] of Object.entries(windows)) {
    const { kept, skipped } = applyState(windowRows, state);
    out[windowKey] = summarize(kept);
    out[`${windowKey}Skipped`] = summarize(skipped);
  }
  out.forwardDelta = {
    netPnlUsd: round(out.purgedForward.netPnlUsd - baseline.purgedForward.netPnlUsd, 2),
    profitFactor: round((out.purgedForward.profitFactor ?? 0) - (baseline.purgedForward.profitFactor ?? 0), 4),
    maxDrawdownPct: round(out.purgedForward.maxDrawdownPct - baseline.purgedForward.maxDrawdownPct, 6),
  };
  return out;
}

function classifyState(row, baseline) {
  const improvesForward = row.purgedForward.closedTrades >= 20
    && row.purgedForward.netPnlUsd > baseline.purgedForward.netPnlUsd
    && (row.purgedForward.profitFactor ?? 0) > (baseline.purgedForward.profitFactor ?? 0)
    && row.purgedForward.maxDrawdownPct < baseline.purgedForward.maxDrawdownPct;
  if (improvesForward) return "forward_validated_candidate";
  const postmortemBetter = row.all.netPnlUsd > baseline.all.netPnlUsd && row.all.maxDrawdownPct < baseline.all.maxDrawdownPct;
  if (postmortemBetter) return "postmortem_only";
  return "rejected";
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
    { label: "State", value: (row) => row.key },
    { label: "Verdict", value: (row) => row.verdict },
    { label: "All kept", align: "---:", value: (row) => row.all.closedTrades },
    { label: "All net", align: "---:", value: (row) => money(row.all.netPnlUsd) },
    { label: "All DD", align: "---:", value: (row) => pct(row.all.maxDrawdownPct) },
    { label: "Skipped", align: "---:", value: (row) => row.skippedRows },
    { label: "Forward kept", align: "---:", value: (row) => row.purgedForward.closedTrades },
    { label: "Forward net", align: "---:", value: (row) => money(row.purgedForward.netPnlUsd) },
    { label: "Forward PF", align: "---:", value: (row) => row.purgedForward.profitFactor ?? "n/a" },
    { label: "Forward DD", align: "---:", value: (row) => pct(row.purgedForward.maxDrawdownPct) },
  ];
  const baselineRows = [
    { key: "all", summary: report.baseline.all },
    { key: "focus", summary: report.baseline.focus },
    { key: "purged_forward", summary: report.baseline.purgedForward },
  ];
  const baselineColumns = [
    { label: "Window", value: (row) => row.key },
    { label: "Rows", align: "---:", value: (row) => row.summary.closedTrades },
    { label: "Net", align: "---:", value: (row) => money(row.summary.netPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.summary.profitFactor ?? "n/a" },
    { label: "DD", align: "---:", value: (row) => pct(row.summary.maxDrawdownPct) },
  ];
  return `# DEMO-SIM Impulse Decay State Feature Scan

Generated: ${report.generated}
Status: \`${report.status}\`

This standalone research-only scan tests whether a better impulse-decay state feature can filter the existing \`range_breakout_long + BTC_RISK_ON\` survivor rows. It does not create a new entry rule and does not change \`demo-sim:all\`, schedulers, alerts, watchers, sizing, TP/SL, execution, keys/accounts, paid services, or public posting.

## Baseline

${table(baselineRows, baselineColumns)}

## State Features

${table(report.results, columns)}

## Interpretation

${report.interpretation}

## Next Actions

${report.nextActions.map((item) => `- ${item}`).join("\n")}
`;
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
  const windows = {
    focus: focusRows,
    purgedForward: rows.filter((row) => row.entryTime > embargoEnd),
  };
  const baseline = {
    all: summarize(rows),
    focus: summarize(windows.focus),
    purgedForward: summarize(windows.purgedForward),
  };
  const results = states
    .map((state) => evaluateState(rows, windows, state, baseline))
    .map((row) => ({ ...row, verdict: classifyState(row, baseline) }))
    .sort((a, b) => {
      const order = { forward_validated_candidate: 0, postmortem_only: 1, rejected: 2 };
      return order[a.verdict] - order[b.verdict] || b.forwardDelta.netPnlUsd - a.forwardDelta.netPnlUsd;
    });
  const forwardCandidates = results.filter((row) => row.verdict === "forward_validated_candidate");
  const postmortemOnly = results.filter((row) => row.verdict === "postmortem_only");
  const status = forwardCandidates.length
    ? "impulse_decay_state_forward_candidate_found"
    : (postmortemOnly.length ? "postmortem_only_no_forward_validation" : "no_impulse_decay_state_forward_validated");
  const bestForward = [...results].sort((a, b) => b.forwardDelta.netPnlUsd - a.forwardDelta.netPnlUsd)[0];
  const report = {
    generated: new Date().toISOString(),
    status,
    workItem: "validation.impulse-decay-state-feature-scan",
    windows: {
      focusWeek: FOCUS_WEEK,
      focusRows: focusRows.length,
      focusEndIso: iso(focusEnd),
      embargoHours: EMBARGO_HOURS,
      embargoEndIso: iso(embargoEnd),
      purgedForwardRows: windows.purgedForward.length,
    },
    assumptions: {
      selectedFilter: "setup=range_breakout_long, direction=long, btcGate.state=BTC_RISK_ON",
      candles: "existing local public Binance 4h candle cache",
      noNewDataFetch: true,
      stateFeatures: states.map(({ key, description }) => ({ key, description })),
    },
    baseline,
    results,
    interpretation: forwardCandidates.length
      ? `At least one impulse-decay state improves purged-forward net/PF/drawdown. Best forward candidate by net delta is \`${bestForward.key}\`; keep it research-only and run a larger rolling purged-forward validation before any DEMO-SIM or paper use.`
      : `No scanned impulse-decay state improves the purged-forward slice versus baseline. Best forward net delta is \`${bestForward.key}\` at ${money(bestForward.forwardDelta.netPnlUsd)} USDT versus baseline, so the branch is rejected as a standalone forward-validated no-trade feature for now.`,
    nextActions: forwardCandidates.length
      ? [
        "Keep the state as a forward-validation candidate only.",
        "Run a larger rolling purged-forward test before any DEMO-SIM join.",
        "Do not wire to demo-sim:all, cron, live alerts, watchers, sizing, TP/SL, or execution.",
      ]
      : [
        "Do not promote an impulse-decay no-trade state from this scan.",
        "Keep the impulse-exhaustion branch as failure-mode memory.",
        "Future work should look for richer breadth/flow/orderflow evidence or wait for more forward rows instead of tuning these thresholds.",
      ],
    boundaries: [
      "research_only",
      "existing_demo_sim_replay_rows_only",
      "existing_local_public_candle_cache",
      "no_new_data_fetch",
      "no_demo_sim_all_change",
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
    baseline: baseline.purgedForward,
    bestForward: {
      key: bestForward.key,
      verdict: bestForward.verdict,
      purgedForward: bestForward.purgedForward,
      forwardDelta: bestForward.forwardDelta,
    },
    output: "results/demo-sim-impulse-decay-state-feature-scan.md",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
