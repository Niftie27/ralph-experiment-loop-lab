#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-short-strategy-quarantine.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-short-strategy-quarantine.md");

const STARTING_CAPITAL_USD = 10_000;
const FIT_END = Date.parse("2026-09-01T00:00:00.000Z") / 1000;
const PURGE_DAYS = 3;
const PURGE_SECONDS = PURGE_DAYS * 24 * 60 * 60;
const FIT_CUTOFF = FIT_END - PURGE_SECONDS;
const FORWARD_START = FIT_END + PURGE_SECONDS;

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

function splitRows(rows) {
  return {
    fit: rows.filter((row) => (row.exitTime ?? 0) < FIT_CUTOFF),
    purgedBoundary: rows.filter((row) => (row.exitTime ?? 0) >= FIT_CUTOFF && (row.exitTime ?? 0) < FORWARD_START),
    forward: rows.filter((row) => (row.exitTime ?? 0) >= FORWARD_START),
  };
}

function maxDrawdown(rows, startingCapitalUsd = STARTING_CAPITAL_USD) {
  let equity = startingCapitalUsd;
  let peak = startingCapitalUsd;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;

  for (const row of rows) {
    equity += row.pnl?.netPnlUsd ?? 0;
    peak = Math.max(peak, equity);
    const drawdownUsd = peak - equity;
    const drawdownPct = peak > 0 ? drawdownUsd / peak : 0;
    if (drawdownUsd > maxDrawdownUsd) {
      maxDrawdownUsd = drawdownUsd;
      maxDrawdownPct = drawdownPct;
    }
  }

  return {
    endingEquityUsd: round(equity, 2),
    maxDrawdownUsd: round(maxDrawdownUsd, 2),
    maxDrawdownPct: round(maxDrawdownPct, 6),
  };
}

function summarize(rows, startingCapitalUsd = STARTING_CAPITAL_USD) {
  const wins = rows.filter((row) => (row.pnl?.netPnlUsd ?? 0) > 0);
  const losses = rows.filter((row) => (row.pnl?.netPnlUsd ?? 0) <= 0);
  const grossWins = wins.reduce((sum, row) => sum + row.pnl.netPnlUsd, 0);
  const grossLosses = Math.abs(losses.reduce((sum, row) => sum + row.pnl.netPnlUsd, 0));
  const grossPnlUsd = rows.reduce((sum, row) => sum + (row.pnl?.grossPnlUsd ?? 0), 0);
  const feesUsd = rows.reduce((sum, row) => sum + (row.pnl?.feesUsd ?? 0), 0);
  const netPnlUsd = rows.reduce((sum, row) => sum + (row.pnl?.netPnlUsd ?? 0), 0);
  const rRows = rows.filter((row) => Number.isFinite(row.pnl?.rMultiple));
  const netR = rRows.reduce((sum, row) => sum + row.pnl.rMultiple, 0);
  const drawdown = maxDrawdown(rows, startingCapitalUsd);

  return {
    closedTrades: rows.length,
    wins: wins.length,
    losses: losses.length,
    winrate: rows.length ? round(wins.length / rows.length, 6) : null,
    grossPnlUsd: round(grossPnlUsd, 2),
    feesUsd: round(feesUsd, 2),
    netPnlUsd: round(netPnlUsd, 2),
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : (grossWins > 0 ? Infinity : null),
    netR: round(netR, 4),
    avgR: rRows.length ? round(netR / rRows.length, 4) : null,
    invalidRiskRecords: rows.length - rRows.length,
    ambiguousTrades: rows.filter((row) => row.ambiguous).length,
    endingEquityUsd: drawdown.endingEquityUsd,
    maxDrawdownUsd: drawdown.maxDrawdownUsd,
    maxDrawdownPct: drawdown.maxDrawdownPct,
  };
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
    .sort((a, b) => (a.netPnlUsd ?? 0) - (b.netPnlUsd ?? 0) || b.closedTrades - a.closedTrades);
}

function revalidationVerdict(fit, forward) {
  if (fit.closedTrades < 20) return "quarantine_fit_sample_low";
  if ((fit.netPnlUsd ?? 0) <= 0 || (fit.profitFactor ?? 0) < 1.2) return "quarantine_fit_weak";
  if (forward.closedTrades < 10) return "quarantine_forward_sample_low";
  if ((forward.netPnlUsd ?? 0) <= 0 || (forward.profitFactor ?? 0) < 1.1) return "quarantine_forward_weak";
  if ((forward.maxDrawdownPct ?? 0) > 0.2) return "quarantine_forward_drawdown_high";
  return "eligible_for_watch_only_revalidation";
}

function evaluateShortFamily(rows, family) {
  const matched = rows.filter((row) => row.direction === "short" && family.filter(row));
  const split = splitRows(matched);
  const fit = summarize(split.fit);
  const forward = summarize(split.forward);
  const purgedBoundary = summarize(split.purgedBoundary);
  return {
    id: family.id,
    label: family.label,
    matched: matched.length,
    overall: summarize(matched),
    fit,
    purgedBoundary,
    forward,
    verdict: revalidationVerdict(fit, forward),
  };
}

async function main() {
  const replay = await readJson(REPLAY_JSON_PATH);
  const records = closedRecords(replay);
  const shortRows = records.filter((row) => row.direction === "short");
  const longRows = records.filter((row) => row.direction === "long");

  const setupFamilies = [...new Set(shortRows.map((row) => row.setup).filter(Boolean))]
    .sort()
    .map((setup) => ({
      id: `short_setup__${setup}`,
      label: `short setup=${setup}`,
      filter: (row) => row.setup === setup,
    }));
  const btcGateFamilies = [...new Set(shortRows.map((row) => row.btcGate?.state ?? "BTC_UNKNOWN"))]
    .sort()
    .map((state) => ({
      id: `short_btc_gate__${state.toLowerCase()}`,
      label: `short BTC gate=${state}`,
      filter: (row) => (row.btcGate?.state ?? "BTC_UNKNOWN") === state,
    }));
  const compoundFamilies = [];
  for (const setup of new Set(shortRows.map((row) => row.setup).filter(Boolean))) {
    for (const state of new Set(shortRows.map((row) => row.btcGate?.state ?? "BTC_UNKNOWN"))) {
      compoundFamilies.push({
        id: `short_setup_btc__${setup}__${state.toLowerCase()}`,
        label: `short setup=${setup}, BTC gate=${state}`,
        filter: (row) => row.setup === setup && (row.btcGate?.state ?? "BTC_UNKNOWN") === state,
      });
    }
  }

  const families = [
    {
      id: "all_shorts",
      label: "all short replay rows",
      filter: () => true,
    },
    ...setupFamilies,
    ...btcGateFamilies,
    ...compoundFamilies,
  ];

  const familyEvaluations = families
    .map((family) => evaluateShortFamily(records, family))
    .sort((a, b) => (a.overall.netPnlUsd ?? 0) - (b.overall.netPnlUsd ?? 0) || b.matched - a.matched);

  const revalidated = familyEvaluations.filter((row) => row.verdict === "eligible_for_watch_only_revalidation");
  const quarantined = familyEvaluations.filter((row) => row.verdict !== "eligible_for_watch_only_revalidation");
  const allSummary = summarize(records);
  const shortSummary = summarize(shortRows);
  const longOnlySummary = summarize(longRows);
  const noShortDelta = {
    netPnlUsd: round((longOnlySummary.netPnlUsd ?? 0) - (allSummary.netPnlUsd ?? 0), 2),
    endingEquityUsd: longOnlySummary.endingEquityUsd,
    maxDrawdownPct: longOnlySummary.maxDrawdownPct,
  };

  const status = revalidated.length ? "short_revalidation_watch_only" : "all_short_families_quarantined";
  const report = {
    generated: nowIso(),
    status,
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
      "quarantine_report_only",
    ],
    assumptions: {
      fitWindow: {
        exitsBefore: new Date(FIT_CUTOFF * 1000).toISOString(),
      },
      purgedBoundary: {
        daysEachSide: PURGE_DAYS,
        exitsFrom: new Date(FIT_CUTOFF * 1000).toISOString(),
        exitsBefore: new Date(FORWARD_START * 1000).toISOString(),
      },
      forwardWindow: {
        exitsFrom: new Date(FORWARD_START * 1000).toISOString(),
      },
      revalidationGate: "fit n>=20, fit net>0, fit PF>=1.2, forward n>=10, forward net>0, forward PF>=1.1, forward maxDD<=20%",
      replayPositionSizing: replay.assumptions?.account ?? null,
      fees: replay.assumptions?.fees ?? null,
      execution: replay.assumptions?.execution ?? null,
    },
    counts: {
      closedRecords: records.length,
      shortRecords: shortRows.length,
      longRecords: longRows.length,
      familiesTested: familyEvaluations.length,
      revalidatedWatchOnly: revalidated.length,
      quarantined: quarantined.length,
    },
    accountSurfaces: {
      allReplay: allSummary,
      shortOnly: shortSummary,
      longOnly: longOnlySummary,
      noShortDelta,
    },
    familyEvaluations,
    worstShortGroups: {
      bySetup: groupRows(shortRows, (row) => row.setup ?? "unknown"),
      byBtcGate: groupRows(shortRows, (row) => row.btcGate?.state ?? "BTC_UNKNOWN"),
      bySetupAndBtcGate: groupRows(shortRows, (row) => `${row.setup ?? "unknown"}|${row.btcGate?.state ?? "BTC_UNKNOWN"}`),
      bySymbolTimeframe: groupRows(shortRows, (row) => `${row.symbol ?? "unknown"}:${row.timeframe ?? "unknown"}`),
    },
    decision: {
      verdict: status,
      interpretation: revalidated.length
        ? "Some short buckets technically pass a strict revalidation gate, but they remain watch-only because the broader short book is a severe capital drag."
        : "No short family earns revalidation. Shorts should remain quarantined in DEMO-SIM research until a separately specified short thesis passes a purged forward gate.",
      nextActions: [
        "Exclude short families from any capital-readiness interpretation of the current paper fund.",
        "Keep collecting short alerts as research rows, but mark them quarantine/watch-only.",
        "Require a new short thesis spec before testing shorts again; do not rescue them by loosening the current gate.",
        "Continue evaluating the long range-breakout BTC_RISK_ON branch against stricter baselines.",
      ],
    },
    limitations: [
      "This report does not mutate live watchers, alert text, schedulers, exchange state, or paper signal generation.",
      "The replay is synthetic historical DEMO-SIM evidence, not real exchange fills.",
      "The fit/forward split has limited month coverage and should be treated as a kill/quarantine surface, not final proof.",
      "Removing shorts improves the replay ledger mechanically, but long-only survivorship still needs separate walk-forward and baseline checks.",
    ],
  };

  await writeJson(REPORT_JSON_PATH, report);

  const summaryColumns = [
    { label: "Surface", value: (row) => row.key },
    { label: "Closed", align: "---:", value: (row) => row.closedTrades },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Net USDT", align: "---:", value: (row) => money(row.netPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? "n/a" },
    { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
  ];
  const familyColumns = [
    { label: "Family", value: (row) => row.id },
    { label: "Verdict", value: (row) => row.verdict },
    { label: "All n", align: "---:", value: (row) => row.overall.closedTrades },
    { label: "All Net", align: "---:", value: (row) => money(row.overall.netPnlUsd) },
    { label: "All PF", align: "---:", value: (row) => row.overall.profitFactor ?? "n/a" },
    { label: "Fit n", align: "---:", value: (row) => row.fit.closedTrades },
    { label: "Fit Net", align: "---:", value: (row) => money(row.fit.netPnlUsd) },
    { label: "Fit PF", align: "---:", value: (row) => row.fit.profitFactor ?? "n/a" },
    { label: "Fwd n", align: "---:", value: (row) => row.forward.closedTrades },
    { label: "Fwd Net", align: "---:", value: (row) => money(row.forward.netPnlUsd) },
    { label: "Fwd PF", align: "---:", value: (row) => row.forward.profitFactor ?? "n/a" },
  ];
  const groupColumns = [
    { label: "Group", value: (row) => row.key },
    { label: "Closed", align: "---:", value: (row) => row.closedTrades },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Net USDT", align: "---:", value: (row) => money(row.netPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? "n/a" },
  ];
  const accountRows = [
    { key: "all replay", ...allSummary },
    { key: "short only", ...shortSummary },
    { key: "long only / shorts withheld", ...longOnlySummary },
  ];

  const md = `# DEMO-SIM Short Strategy Quarantine\n\nGenerated: ${report.generated}\nSource replay: \`${report.sourceReplay}\`\n\nStatus: \`${report.status}\`\n\nThis report quarantines and revalidates short strategy families from the historical DEMO-SIM replay. It is research-only and does not alter live execution, exchange keys, schedulers, TradingView automation, alert wording, thresholds, watchers, risk/sizing, or strategy promotion.\n\n## Account Impact\n\n${table(accountRows, summaryColumns)}\n\nWithholding shorts changes the replay surface by ${money(report.accountSurfaces.noShortDelta.netPnlUsd)} USDT and leaves long-only ending equity at ${money(report.accountSurfaces.noShortDelta.endingEquityUsd)} USDT with max drawdown ${pct(report.accountSurfaces.noShortDelta.maxDrawdownPct)}.\n\n## Revalidation Contract\n\n- Fit exits before: ${report.assumptions.fitWindow.exitsBefore}\n- Purged boundary: ${report.assumptions.purgedBoundary.exitsFrom} to ${report.assumptions.purgedBoundary.exitsBefore}\n- Forward exits from: ${report.assumptions.forwardWindow.exitsFrom}\n- Revalidation gate: ${report.assumptions.revalidationGate}\n\n## Short Family Results\n\n${table(report.familyEvaluations, familyColumns)}\n\n## Worst Short Buckets\n\n### By Setup\n\n${table(report.worstShortGroups.bySetup, groupColumns)}\n\n### By BTC Gate\n\n${table(report.worstShortGroups.byBtcGate, groupColumns)}\n\n### By Setup And BTC Gate\n\n${table(report.worstShortGroups.bySetupAndBtcGate, groupColumns)}\n\n## Decision\n\n${report.decision.interpretation}\n\n## Next Actions\n\n${report.decision.nextActions.map((item) => `- ${item}`).join("\n")}\n\n## Limitations\n\n${report.limitations.map((item) => `- ${item}`).join("\n")}\n`;

  await fs.writeFile(REPORT_MD_PATH, md);
  console.log(JSON.stringify({
    ok: true,
    status,
    reportJson: REPORT_JSON_PATH,
    reportMarkdown: REPORT_MD_PATH,
    counts: report.counts,
    accountSurfaces: report.accountSurfaces,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
