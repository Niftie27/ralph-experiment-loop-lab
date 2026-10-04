#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-range-breakout-btc-risk-on-gate.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-range-breakout-btc-risk-on-gate.md");

const STARTING_CAPITAL_USD = 10_000;
const FIT_MONTH = "2026-08";
const FORWARD_MONTH = "2026-09";

const nowIso = () => new Date().toISOString();
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

function maxDrawdown(rows, startingCapitalUsd = STARTING_CAPITAL_USD) {
  let equity = startingCapitalUsd;
  let peak = startingCapitalUsd;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;
  let maxDrawdownAt = null;

  for (const row of rows) {
    equity += row.pnl?.netPnlUsd ?? 0;
    peak = Math.max(peak, equity);
    const drawdownUsd = peak - equity;
    const drawdownPct = peak > 0 ? drawdownUsd / peak : 0;
    if (drawdownUsd > maxDrawdownUsd) {
      maxDrawdownUsd = drawdownUsd;
      maxDrawdownPct = drawdownPct;
      maxDrawdownAt = row.exitTimeIso ?? null;
    }
  }

  return {
    endingEquityUsd: round(equity, 2),
    maxDrawdownUsd: round(maxDrawdownUsd, 2),
    maxDrawdownPct: round(maxDrawdownPct, 6),
    maxDrawdownAt,
  };
}

function summarize(rows) {
  const wins = rows.filter((row) => (row.pnl?.netPnlUsd ?? 0) > 0);
  const losses = rows.filter((row) => (row.pnl?.netPnlUsd ?? 0) <= 0);
  const grossWins = wins.reduce((sum, row) => sum + row.pnl.netPnlUsd, 0);
  const grossLosses = Math.abs(losses.reduce((sum, row) => sum + row.pnl.netPnlUsd, 0));
  const grossPnlUsd = rows.reduce((sum, row) => sum + (row.pnl?.grossPnlUsd ?? 0), 0);
  const feesUsd = rows.reduce((sum, row) => sum + (row.pnl?.feesUsd ?? 0), 0);
  const netPnlUsd = rows.reduce((sum, row) => sum + (row.pnl?.netPnlUsd ?? 0), 0);
  const rRows = rows.filter((row) => Number.isFinite(row.pnl?.rMultiple));
  const netR = rRows.reduce((sum, row) => sum + row.pnl.rMultiple, 0);
  const drawdown = maxDrawdown(rows);

  return {
    closedTrades: rows.length,
    wins: wins.length,
    losses: losses.length,
    winrate: rows.length ? round(wins.length / rows.length, 6) : null,
    grossPnlUsd: round(grossPnlUsd, 2),
    feesUsd: round(feesUsd, 2),
    netPnlUsd: round(netPnlUsd, 2),
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : null,
    netR: round(netR, 4),
    avgR: rRows.length ? round(netR / rRows.length, 4) : null,
    invalidRiskRecords: rows.length - rRows.length,
    ambiguousTrades: rows.filter((row) => row.ambiguous).length,
    endingEquityUsd: drawdown.endingEquityUsd,
    maxDrawdownUsd: drawdown.maxDrawdownUsd,
    maxDrawdownPct: drawdown.maxDrawdownPct,
    maxDrawdownAt: drawdown.maxDrawdownAt,
  };
}

function monthOf(row) {
  return row.exitTimeIso?.slice(0, 7) ?? "unknown";
}

function groupRows(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  return [...groups.entries()]
    .map(([key, group]) => ({ key, ...summarize(group) }))
    .sort((a, b) => (b.netPnlUsd ?? -Infinity) - (a.netPnlUsd ?? -Infinity) || b.closedTrades - a.closedTrades);
}

function policyRows(records, policy) {
  return records.filter(policy.filter);
}

function classifyVerdict(forward, fit) {
  if (forward.closedTrades < 30) return "watch_low_forward_sample";
  if ((forward.netPnlUsd ?? 0) <= 0 || (forward.profitFactor ?? 0) < 1.1) return "reject_forward_weak";
  if ((forward.maxDrawdownPct ?? 0) > 0.25) return "watch_drawdown_too_high";
  if ((fit.profitFactor ?? 0) > 2.5 && (forward.profitFactor ?? 0) < 1.3) return "watch_decay_from_fit";
  return "candidate_survives_forward_gate";
}

async function main() {
  const replay = await readJson(REPLAY_JSON_PATH);
  const records = closedRecords(replay);

  const policies = [
    {
      id: "all_closed_replay",
      description: "All closed historical DEMO-SIM replay rows.",
      filter: () => true,
    },
    {
      id: "long_only_all_setups",
      description: "All closed long replay rows, with short families withheld.",
      filter: (row) => row.direction === "long",
    },
    {
      id: "range_breakout_long_all_btc_gates",
      description: "Closed range-breakout long rows without discarding BTC transition rows.",
      filter: (row) => row.setup === "range_breakout_long" && row.direction === "long",
    },
    {
      id: "range_breakout_long_btc_risk_on",
      description: "Closed range-breakout long rows only when the explicit BTC gate state is BTC_RISK_ON.",
      filter: (row) => row.setup === "range_breakout_long" && row.direction === "long" && row.btcGate?.state === "BTC_RISK_ON",
    },
  ];

  const policySummaries = policies.map((policy) => {
    const rows = policyRows(records, policy);
    const fitRows = rows.filter((row) => monthOf(row) === FIT_MONTH);
    const forwardRows = rows.filter((row) => monthOf(row) === FORWARD_MONTH);
    const fit = summarize(fitRows);
    const forward = summarize(forwardRows);
    return {
      id: policy.id,
      description: policy.description,
      overall: summarize(rows),
      fitWindow: { month: FIT_MONTH, ...fit },
      forwardWindow: { month: FORWARD_MONTH, ...forward },
      verdict: classifyVerdict(forward, fit),
    };
  });

  const selectedRows = records.filter((row) => (
    row.setup === "range_breakout_long"
    && row.direction === "long"
    && row.btcGate?.state === "BTC_RISK_ON"
  ));

  const selected = policySummaries.find((policy) => policy.id === "range_breakout_long_btc_risk_on");
  const report = {
    generated: nowIso(),
    status: selected.verdict,
    sourceReplay: path.relative(ROOT, REPLAY_JSON_PATH),
    outputs: {
      json: path.relative(ROOT, REPORT_JSON_PATH),
      markdown: path.relative(ROOT, REPORT_MD_PATH),
    },
    boundaries: [
      "research_only",
      "no_live_execution",
      "no_exchange_keys",
      "no_paid_apis",
      "no_tradingview_automation",
      "no_alert_wording_threshold_watcher_or_sizing_changes",
      "no_strategy_promotion",
    ],
    assumptions: {
      fitWindow: FIT_MONTH,
      forwardWindow: FORWARD_MONTH,
      selectedGate: "setup=range_breakout_long, direction=long, btcGate.state=BTC_RISK_ON",
      startingCapitalUsd: STARTING_CAPITAL_USD,
      replayPositionSizing: replay.assumptions?.account ?? null,
      fees: replay.assumptions?.fees ?? null,
      execution: replay.assumptions?.execution ?? null,
    },
    policySummaries,
    selectedBreakdowns: {
      byMonth: groupRows(selectedRows, monthOf),
      bySymbolTimeframe: groupRows(selectedRows, (row) => `${row.symbol}:${row.timeframe}`),
      byTier: groupRows(selectedRows, (row) => row.tier ?? "unknown"),
    },
    decision: {
      verdict: selected.verdict,
      interpretation: "The BTC_RISK_ON range-breakout-long pocket survives the first crude forward gate, but September forward profit is much weaker than August fit and drawdown remains too large for capital readiness.",
      nextActions: [
        "Do not promote to live or DEMO sizing.",
        "Keep short setup families quarantined until separately validated.",
        "Repair signal price precision before trusting R-multiple diagnostics.",
        "Run a purged/walk-forward filter grid before changing watcher behavior.",
      ],
    },
    limitations: [
      "This is a coarse two-month fit/forward split over synthetic historical replay rows.",
      "It does not model overlapping margin reservation, liquidation, funding, queue priority, slippage, or live order handling.",
      "BTC_RISK_ON is the existing replay gate state, not a newly approved live watcher rule.",
      "The September forward window is short and still includes rounded-price bad-R rows.",
      "A surviving report means research should continue, not that the strategy is capital-ready.",
    ],
  };

  await writeJson(REPORT_JSON_PATH, report);

  const policyColumns = [
    { label: "Policy", value: (row) => row.id },
    { label: "All Closed", align: "---:", value: (row) => row.overall.closedTrades },
    { label: "All Net", align: "---:", value: (row) => money(row.overall.netPnlUsd) },
    { label: "All PF", align: "---:", value: (row) => row.overall.profitFactor ?? "n/a" },
    { label: "Fit Net", align: "---:", value: (row) => money(row.fitWindow.netPnlUsd) },
    { label: "Fit PF", align: "---:", value: (row) => row.fitWindow.profitFactor ?? "n/a" },
    { label: "Forward Closed", align: "---:", value: (row) => row.forwardWindow.closedTrades },
    { label: "Forward Net", align: "---:", value: (row) => money(row.forwardWindow.netPnlUsd) },
    { label: "Forward PF", align: "---:", value: (row) => row.forwardWindow.profitFactor ?? "n/a" },
    { label: "Forward DD", align: "---:", value: (row) => pct(row.forwardWindow.maxDrawdownPct) },
    { label: "Verdict", value: (row) => row.verdict },
  ];

  const groupColumns = [
    { label: "Group", value: (row) => row.key },
    { label: "Closed", align: "---:", value: (row) => row.closedTrades },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Net USDT", align: "---:", value: (row) => money(row.netPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? "n/a" },
    { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
    { label: "Bad R", align: "---:", value: (row) => row.invalidRiskRecords },
    { label: "Ambig", align: "---:", value: (row) => row.ambiguousTrades },
  ];

  const md = `# DEMO-SIM Range Breakout BTC Risk-On Gate\n\nGenerated: ${report.generated}\nSource replay: \`${report.sourceReplay}\`\n\nStatus: \`${report.status}\`\n\nThis report tests whether the strongest current DEMO-SIM pocket, \`range_breakout_long\`, still looks useful when restricted to explicit BTC \`BTC_RISK_ON\` context and checked against a simple August fit / September forward split. It is research-only and does not change live execution, keys, schedulers, TradingView automation, alert wording, thresholds, watchers, risk/sizing, or strategy promotion.\n\n## Policy Comparison\n\n${table(report.policySummaries, policyColumns)}\n\n## Selected Gate\n\nSelected filter: \`${report.assumptions.selectedGate}\`\n\nInterpretation: ${report.decision.interpretation}\n\n## Selected By Month\n\n${table(report.selectedBreakdowns.byMonth, groupColumns)}\n\n## Selected By Symbol And Timeframe\n\n${table(report.selectedBreakdowns.bySymbolTimeframe, groupColumns)}\n\n## Selected By Tier\n\n${table(report.selectedBreakdowns.byTier, groupColumns)}\n\n## Next Actions\n\n${report.decision.nextActions.map((item) => `- ${item}`).join("\n")}\n\n## Limitations\n\n${report.limitations.map((item) => `- ${item}`).join("\n")}\n`;

  await fs.writeFile(REPORT_MD_PATH, md);

  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    reportJson: REPORT_JSON_PATH,
    reportMarkdown: REPORT_MD_PATH,
    selected: {
      overall: selected.overall,
      fitWindow: selected.fitWindow,
      forwardWindow: selected.forwardWindow,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
