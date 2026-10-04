#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);

const INPUTS = {
  queues: path.join(ROOT, "automation", "work-queues.yaml"),
  setupAnalysis: path.join(ROOT, "..", "crypto-updates", "runtime", "setup-analysis.json"),
  paperDashboard: path.join(ROOT, "experiments", "btc-eth-alert-edge", "results", "paper-dashboard.json"),
  filterReport: path.join(ROOT, "experiments", "strategy-destruction-filter", "results", "filter-report.json"),
  strategyRubric: path.join(ROOT, "outputs", "strategy-score-rubric-dry-run.json")
};

const OUTPUT_JSON = path.join(ROOT, "outputs", "evidence-ledger-prioritizer.json");
const OUTPUT_MD = path.join(ROOT, "outputs", "evidence-ledger-prioritizer.md");

const queuesText = await fs.readFile(INPUTS.queues, "utf8");
const setupAnalysis = await readJson(INPUTS.setupAnalysis, null);
const paperDashboard = await readJson(INPUTS.paperDashboard, null);
const filterReport = await readJson(INPUTS.filterReport, null);
const strategyRubric = await readJson(INPUTS.strategyRubric, null);

const evidence = buildEvidence({ setupAnalysis, paperDashboard, filterReport, strategyRubric });
const pending = parsePendingQueues(queuesText);
const watchItems = parseWatchItems(queuesText);
const queueItems = [
  ...pending.map((item) => ({ ...item, queueState: "pending" })),
  ...watchItems.map((item) => ({ ...item, queueState: "watch" }))
];
const ranked = queueItems.map((item) => scoreWorkItem(item, evidence)).sort((a, b) =>
  b.score - a.score || a.lane.localeCompare(b.lane) || a.item.localeCompare(b.item)
);
const pendingRanked = ranked.filter((item) => item.queueState === "pending");

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-router",
  note: "Ranks pending RALPH work by evidence readiness and cheap kill-test value. It does not promote strategies, change live alerts, change schedules, or authorize execution.",
  inputs: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, path.relative(ROOT, value)])),
  evidence,
  totals: {
    pendingItems: pendingRanked.length,
    watchItems: watchItems.length,
    readyNow: pendingRanked.filter((item) => item.decision === "ready-now").length,
    watchUntilThreshold: ranked.filter((item) => item.decision === "watch-until-threshold").length,
    needsWheelGate: pendingRanked.filter((item) => item.decision === "needs-wheel-gate").length,
    blockedOrLowValue: pendingRanked.filter((item) => item.decision === "blocked-or-low-value").length
  },
  topReady: pendingRanked.filter((item) => item.decision === "ready-now").slice(0, 8),
  thresholdWatch: ranked.filter((item) => item.decision === "watch-until-threshold"),
  watchGates: ranked.filter((item) => item.queueState === "watch" && item.decision === "blocked-or-low-value"),
  topNeedsWheelGate: pendingRanked.filter((item) => item.decision === "needs-wheel-gate").slice(0, 8),
  ranked
};

await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUTPUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  pendingItems: report.totals.pendingItems,
  readyNow: report.totals.readyNow,
  watchUntilThreshold: report.totals.watchUntilThreshold,
  topReady: report.topReady.slice(0, 5).map((item) => ({
    lane: item.lane,
    item: item.item,
    score: item.score,
    nextAction: item.nextAction
  })),
  output: path.relative(ROOT, OUTPUT_MD)
}, null, 2));

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

function parsePendingQueues(text) {
  const items = [];
  let lane = null;
  let state = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, "");
    const laneMatch = line.match(/^  ([a-z_]+):$/);
    if (laneMatch) {
      lane = laneMatch[1];
      state = null;
      continue;
    }

    const stateMatch = line.match(/^    (pending|active|done):/);
    if (stateMatch) {
      state = stateMatch[1];
      continue;
    }

    const itemMatch = line.match(/^      - (.+)$/);
    if (lane && state === "pending" && itemMatch) {
      items.push({ lane, item: itemMatch[1].trim() });
    }
  }

  return items;
}

function parseWatchItems(text) {
  const tracked = new Set([
    "ta-call-candidates-20-row-threshold",
    "avax-1h-range-breakdown-short-down-low-vol",
    "arkham-material-value-tiny-export-gate",
    "wallet-shadow-independent-event-window-gate"
  ]);
  const items = [];
  let inWatch = false;
  let inItems = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, "");
    const laneMatch = line.match(/^  ([a-z_]+):$/);
    if (laneMatch) {
      inWatch = laneMatch[1] === "watch";
      inItems = false;
      continue;
    }

    if (inWatch && line.match(/^    items:/)) {
      inItems = true;
      continue;
    }

    const itemMatch = line.match(/^      - (.+)$/);
    if (inWatch && inItems && itemMatch) {
      const item = itemMatch[1].trim();
      if (tracked.has(item)) items.push({ lane: "watch", item });
    }
  }

  return items;
}

function buildEvidence({ setupAnalysis, paperDashboard, filterReport, strategyRubric }) {
  const callCandidates = setupAnalysis?.call_line_decision?.candidates || [];
  const maxCallSample = callCandidates.reduce((max, item) => Math.max(max, Number(item.sample) || 0), 0);
  const avaxExactForwardRows = countPaperRows(paperDashboard, (row) =>
    String(row.symbol || "").toUpperCase() === "AVAX" &&
    String(row.timeframe || "") === "1h" &&
    String(row.setup || "") === "range_breakdown_short" &&
    String(row.direction || "") === "short" &&
    String(row.regime || "") === "down/low-vol"
  );

  return {
    setupAnalysis: {
      generatedAt: setupAnalysis?.generated_at || setupAnalysis?.generatedAt || null,
      reviewedSetups: setupAnalysis?.summary?.reviewed_setups || 0,
      candleContextReady: setupAnalysis?.summary?.candle_context_ready || 0,
      maxCallCandidateSample: maxCallSample,
      callCandidateThreshold: 20,
      callCandidates: callCandidates.map((item) => ({
        key: item.key,
        sample: item.sample,
        verdicts: item.verdicts
      }))
    },
    paperDashboard: {
      generatedAt: paperDashboard?.generated || null,
      totalSignals: paperDashboard?.overall?.total || 0,
      openSignals: paperDashboard?.overall?.open || 0,
      closedSignals: paperDashboard?.overall?.closed || 0,
      avaxRangeBreakdownDownLowVolRows: avaxExactForwardRows,
      avaxForwardThreshold: 20
    },
    strategyFilter: {
      generatedAt: filterReport?.generatedAt || null,
      candidates: filterReport?.totals?.candidates || 0,
      variants: filterReport?.totals?.variants || 0,
      survivors: filterReport?.totals?.survivors || 0,
      rejected: filterReport?.totals?.rejected || 0
    },
    strategyRubric: {
      generatedAt: strategyRubric?.generatedAt || null,
      rubricBenchmark: strategyRubric?.totals?.rubricBenchmark || 0,
      rubricInvestigate: strategyRubric?.totals?.rubricInvestigate || 0,
      topAccepted: (strategyRubric?.acceptedTopRoutes || []).slice(0, 5).map((item) => ({
        id: item.id,
        candidate: item.candidate,
        rubricState: item.rubricState,
        nextLoop: item.nextLoop
      }))
    }
  };
}

function countPaperRows(dashboard, predicate) {
  if (!dashboard) return 0;
  const rows = dashboard.bySymbolTimeframeSetupRegime || [];
  return rows.filter(predicate).reduce((sum, row) => sum + (Number(row.total) || 0), 0);
}

function scoreWorkItem(workItem, evidence) {
  const id = workItem.item;
  const text = `${workItem.lane}.${workItem.item}`.toLowerCase();
  let score = 20;
  const reasons = [];
  let decision = "ready-now";
  let nextAction = "Run the smallest read-only wheel gate and record a falsifier before custom work.";

  if (text.includes("recheck-ta-call-candidates")) {
    const sample = evidence.setupAnalysis.maxCallCandidateSample;
    score = sample >= 20 ? 95 : 35 + sample;
    decision = sample >= 20 ? "ready-now" : "watch-until-threshold";
    reasons.push(`largest TA call bucket is ${sample}/20 reviewed rows`);
    nextAction = sample >= 20
      ? "Rerun setup analyzer and evaluate call buckets against execution/paper evidence."
      : "Wait for more finalized reviewed alert rows before spending another full pass.";
  } else if (text.includes("recheck-avax-range-breakdown")) {
    const rows = evidence.paperDashboard.avaxRangeBreakdownDownLowVolRows;
    score = rows >= 20 ? 98 : 40 + rows;
    decision = rows >= 20 ? "ready-now" : "watch-until-threshold";
    reasons.push(`exact AVAX 1h range_breakdown_short down/low-vol forward-paper rows are ${rows}/20`);
    nextAction = rows >= 20
      ? "Compare exact forward paper support against the historical survivor and decide Watch vs Paper-Qualified proposal."
      : "Keep AVAX range breakdown in Watch / forward-paper-needed.";
  } else if (text.includes("ta-call-candidates-20-row-threshold")) {
    const sample = evidence.setupAnalysis.maxCallCandidateSample;
    score = sample >= 20 ? 95 : 35 + sample;
    decision = sample >= 20 ? "ready-now" : "watch-until-threshold";
    reasons.push(`largest TA call bucket is ${sample}/20 reviewed rows`);
    nextAction = sample >= 20
      ? "Promote the threshold item back to validation pending, then rerun setup analyzer and evaluate call buckets."
      : "Keep in Watch until more finalized reviewed alert rows arrive.";
  } else if (text.includes("avax-1h-range-breakdown-short-down-low-vol")) {
    const rows = evidence.paperDashboard.avaxRangeBreakdownDownLowVolRows;
    score = rows >= 20 ? 98 : 40 + rows;
    decision = rows >= 20 ? "ready-now" : "watch-until-threshold";
    reasons.push(`exact AVAX 1h range_breakdown_short down/low-vol forward-paper rows are ${rows}/20`);
    nextAction = rows >= 20
      ? "Promote the threshold item back to validation pending, then compare exact forward paper support against the historical survivor."
      : "Keep AVAX range breakdown in Watch / forward-paper-needed.";
  } else if (text.includes("arkham-material-value-tiny-export-gate")) {
    score = 45;
    decision = "blocked-or-low-value";
    reasons.push("approval-gated account/API/export sample; no active no-key route");
    nextAction = "Stay Watch until Tomas explicitly approves account/API-plan-or-trial/API-key access, spend cap, endpoint scope, and local export path.";
  } else if (text.includes("wallet-shadow-independent-event-window-gate")) {
    score = 45;
    decision = "blocked-or-low-value";
    reasons.push("named independent event/source/account trigger required before sampling");
    nextAction = "Stay Watch until Tomas names a trigger or a source-ranked event record creates a precise independent window.";
  } else if (text.includes("hype-feedback-to-quantified-demo-strategy-loop")) {
    score = 72;
    decision = "needs-wheel-gate";
    reasons.push("Tomas wants HYPE feedback converted into quantified strategy research, not alert commentary");
    nextAction = "In a fresh low-context session, scope one HYPE hypothesis, verify data access, then run the smallest backtest/replay or paper-demo design with exact metrics/ranges.";
  } else if (text.includes("community-idea-to-kill-test-template")) {
    score = 89;
    reasons.push("turns social/operator ideas into falsifiable records before strategy work");
    nextAction = "Create a compact claim/mechanism/data/falsifier template for public-source ideas.";
  } else if (text.includes("github-strategy-profile-scan") || text.includes("operator-profile-source-map")) {
    score = 86;
    reasons.push("uses public/no-key sources and feeds the source-falsification guide");
    nextAction = "Run a small GitHub-first source map, then store only testable ideas.";
  } else if (text.includes("x-reddit-strategy-inspiration-scan")) {
    score = 78;
    reasons.push("potentially useful but higher social-noise risk than GitHub/code-backed sources");
    nextAction = "Use only public pages; require a code/data/source-backed falsifier for every idea.";
  } else if (text.includes("public-orderflow-data-rail-spike")) {
    score = 82;
    reasons.push("critical data rail, but recent repair already made freshness usable; next pass should be targeted");
    nextAction = "Target one missing feature or one replay-alignment gap, not a broad capture rebuild.";
  } else if (text.includes("copytrading") || text.includes("wallet") || text.includes("accumulator") || text.includes("funding") || text.includes("cohort")) {
    score = 70;
    decision = text.includes("public-route-ledger") || text.includes("hyperliquid") ? "ready-now" : "needs-wheel-gate";
    reasons.push("research-only lane, but access and survivorship-bias gates must lead");
    nextAction = "Classify public/no-key access and selection bias before any paper cohort spec.";
  } else if (text.includes("arkham") || text.includes("nansen") || text.includes("dune") || text.includes("paid")) {
    score = 45;
    decision = "needs-wheel-gate";
    reasons.push("likely account/API/export dependency; keep proposed until access is verified");
    nextAction = "Verify free/public access, pricing/export/API limits, and privacy boundaries before active routing.";
  } else if (workItem.lane === "unknowns") {
    score = 55;
    decision = "needs-wheel-gate";
    reasons.push("unknown needs a concrete evidence artifact before active work");
    nextAction = "Convert the unknown into one falsifiable queue item with an access classification.";
  } else if (workItem.lane === "decision") {
    score = id.includes("autoresearch-evidence-ledger-prioritizer") ? 100 : 62;
    reasons.push("decision-layer work improves routing without touching live systems");
    nextAction = id.includes("autoresearch-evidence-ledger-prioritizer")
      ? "Generate and review the evidence-priority ledger, then move this queue item to done."
      : "Write a decision memo or split into a smaller router-safe item.";
  } else if (workItem.lane === "investigation") {
    score = 64;
    reasons.push("investigation can be useful if kept source-backed and bounded");
  } else if (workItem.lane === "discovery") {
    score = 60;
    reasons.push("discovery is useful after wheel-gate and access classification");
  }

  if (text.includes("live") || text.includes("execution")) {
    score -= 20;
    reasons.push("execution-adjacent wording keeps this behind approval gates");
  }

  return {
    ...workItem,
    score,
    decision,
    reasons,
    nextAction
  };
}

function renderMarkdown(report) {
  const topReady = report.topReady[0]
    ? `${report.topReady[0].lane}.${report.topReady[0].item}`
    : "none";
  const noReadyGuidance = report.topReady.length === 0
    ? (report.topNeedsWheelGate.length === 0
      ? " No ready-now or needs-wheel-gate pending routes remain; continue only when threshold evidence, a named trigger, or explicit HITL-gated approval appears."
      : " No ready-now routes remain; continue only by selecting a needs-wheel-gate item, waiting for threshold evidence, or asking for HITL-gated access/scheduler work.")
    : "";
  const lines = [
    "# Evidence Ledger Prioritizer",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}.`,
    "",
    report.note,
    "",
    "## Evidence Snapshot",
    "",
    `- TA setup analysis: ${report.evidence.setupAnalysis.reviewedSetups} reviewed, ${report.evidence.setupAnalysis.candleContextReady} candle-context-ready, largest call bucket ${report.evidence.setupAnalysis.maxCallCandidateSample}/${report.evidence.setupAnalysis.callCandidateThreshold}.`,
    `- Forward paper: ${report.evidence.paperDashboard.totalSignals} signals, ${report.evidence.paperDashboard.closedSignals} closed, ${report.evidence.paperDashboard.openSignals} open.`,
    `- AVAX exact forward rows: ${report.evidence.paperDashboard.avaxRangeBreakdownDownLowVolRows}/${report.evidence.paperDashboard.avaxForwardThreshold} for AVAX 1h range_breakdown_short down/low-vol.`,
    `- Strategy filter: ${report.evidence.strategyFilter.candidates} candidates, ${report.evidence.strategyFilter.variants} variants, ${report.evidence.strategyFilter.survivors} survivors, ${report.evidence.strategyFilter.rejected} rejected.`,
    `- Strategy rubric: ${report.evidence.strategyRubric.rubricBenchmark} benchmark routes and ${report.evidence.strategyRubric.rubricInvestigate} investigate routes.`,
    `- Queue state: ${report.totals.pendingItems} pending, ${report.totals.watchItems} watch, ${report.totals.readyNow} ready-now, ${report.totals.watchUntilThreshold} threshold-watch, ${report.totals.needsWheelGate} needs-wheel-gate.`,
    "",
    "## Top Ready Routes",
    "",
    "| Lane | Item | Score | Decision | Next action |",
    "| --- | --- | ---: | --- | --- |"
  ];

  for (const item of report.topReady) {
    lines.push(`| ${item.lane} | ${item.item} | ${item.score} | ${item.decision} | ${item.nextAction} |`);
  }

  lines.push("", "## Threshold Watch", "", "| Lane | Item | Score | Evidence | Next action |", "| --- | --- | ---: | --- | --- |");
  for (const item of report.thresholdWatch) {
    lines.push(`| ${item.lane} | ${item.item} | ${item.score} | ${item.reasons.join("; ")} | ${item.nextAction} |`);
  }

  lines.push("", "## Needs Wheel Gate", "", "| Lane | Item | Score | Gate | Next action |", "| --- | --- | ---: | --- | --- |");
  for (const item of report.topNeedsWheelGate) {
    lines.push(`| ${item.lane} | ${item.item} | ${item.score} | ${item.reasons.join("; ")} | ${item.nextAction} |`);
  }

  lines.push("", "## Watch Gates", "", "| Lane | Item | Score | Gate | Next action |", "| --- | --- | ---: | --- | --- |");
  for (const item of report.watchGates) {
    lines.push(`| ${item.lane} | ${item.item} | ${item.score} | ${item.reasons.join("; ")} | ${item.nextAction} |`);
  }

  lines.push(
    "",
    "## Reassess",
    "",
    `The next useful manual branch should not rerun TA or AVAX threshold checks until the required rows exist. Current top ready route is ${topReady}.${noReadyGuidance} If using social sources, require public pages plus a code/data/source-backed falsifier for every idea. Copytrading and Hyperliquid address work should classify no-key access and selection bias before any paper cohort spec.`,
    "",
    "Maintenance gate: ready discovery or strategy-adjacent routes are routing candidates only. A maintenance-only continuation must not start one unless Tomas explicitly asks for that branch.",
    "",
    "No live trading, alert wording, thresholds, risk, sizing, TP/SL, execution behavior, orders, accounts, keys, paid services, public posting, scheduler, cron, systemd, dependency adoption, watcher behavior, or strategy promotion changed."
  );

  return `${lines.join("\n")}\n`;
}
