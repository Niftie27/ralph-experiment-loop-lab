#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const WORKSPACE = path.resolve(ROOT, "..");

const paths = {
  paperDashboard: path.join(ROOT, "experiments", "btc-eth-alert-edge", "results", "paper-dashboard.json"),
  edgeSnapshot: path.join(ROOT, "experiments", "btc-eth-alert-edge", "results", "edge-snapshot.json"),
  shadowPnl: path.join(ROOT, "experiments", "strategy-destruction-filter", "results", "shadow-pnl-ledger.json"),
  tradeJournal: path.join(WORKSPACE, "crypto-updates", "runtime", "trade-research-journal.json"),
  watcherLog: path.join(WORKSPACE, "crypto-updates", "runtime", "realtime-market-watcher.log"),
  executionLog: path.join(WORKSPACE, "crypto-updates", "runtime", "bybit-execution-reactor.log"),
  outJson: path.join(ROOT, "outputs", "state-of-edge-report.json"),
  outMd: path.join(ROOT, "outputs", "state-of-edge-report.md")
};

const now = new Date();
const [
  paperDashboard,
  edgeSnapshot,
  shadowPnl,
  tradeJournal,
  watcherStat,
  executionStat
] = await Promise.all([
  readJson(paths.paperDashboard),
  readJson(paths.edgeSnapshot),
  readJson(paths.shadowPnl),
  readJson(paths.tradeJournal),
  statOrNull(paths.watcherLog),
  statOrNull(paths.executionLog)
]);

const latestCandidates = Array.isArray(edgeSnapshot.latestCandidates)
  ? edgeSnapshot.latestCandidates
  : [];

const report = {
  generatedAt: now.toISOString(),
  status: "research-paper-autonomy-no-live-execution",
  boundaries: {
    liveTrading: false,
    orderPlacement: false,
    walletKeys: false,
    paidApis: false,
    riskSizingTpSlChanges: false
  },
  freshness: {
    paperDashboard: freshness(paperDashboard.generated ?? paperDashboard.sourceUpdated),
    edgeSnapshot: freshness(edgeSnapshot.generated),
    shadowPnl: freshness(shadowPnl.generatedAt),
    tradeJournal: freshness(tradeJournal.generatedAt),
    watcherLog: freshness(watcherStat?.mtime.toISOString()),
    executionLog: freshness(executionStat?.mtime.toISOString())
  },
  paper: {
    overall: paperDashboard.overall ?? null,
    qualified: paperDashboard.qualified ?? null,
    learning: paperDashboard.learning ?? null
  },
  shadow: {
    decision: shadowPnl.decision ?? null,
    totals: shadowPnl.totals ?? null
  },
  tradeJournal: {
    summary: tradeJournal.summary ?? null
  },
  candidates: latestCandidates.map((candidate) => ({
    symbol: candidate.symbol,
    timeframe: candidate.timeframe,
    setup: candidate.setup,
    direction: candidate.direction,
    signalIso: candidate.signalIso,
    regime: candidate.regime,
    tier: candidate.tier,
    stats: candidate.stats,
    baseline: candidate.baseline,
    action: classifyCandidate(candidate)
  }))
};

report.verdict = summarize(report);

await fs.mkdir(path.dirname(paths.outJson), { recursive: true });
await fs.writeFile(paths.outJson, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(paths.outMd, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  verdict: report.verdict,
  generatedAt: report.generatedAt,
  outputs: [
    path.relative(ROOT, paths.outJson),
    path.relative(ROOT, paths.outMd)
  ]
}, null, 2));

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function statOrNull(file) {
  try {
    return await fs.stat(file);
  } catch {
    return null;
  }
}

function freshness(iso) {
  if (!iso) {
    return { status: "missing", iso: null, ageHours: null };
  }
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) {
    return { status: "unparseable", iso, ageHours: null };
  }
  const ageHours = Number(((now.getTime() - ts) / 3_600_000).toFixed(2));
  return {
    status: ageHours <= 6 ? "fresh" : ageHours <= 24 ? "aging" : "stale",
    iso,
    ageHours
  };
}

function classifyCandidate(candidate) {
  const sample = candidate.stats?.sample ?? 0;
  const expectancy = candidate.stats?.expectancyR ?? 0;
  const profitFactor = candidate.stats?.profitFactor ?? 0;
  const baselineExpectancy = candidate.baseline?.expectancyR ?? null;
  const baselineLift = baselineExpectancy === null ? null : expectancy - baselineExpectancy;

  if (candidate.tier === "avoid" || expectancy <= 0 || profitFactor < 1.1) {
    return "kill_or_avoid";
  }

  if (sample < 50) {
    return "watch_low_sample";
  }

  if (baselineLift !== null && baselineLift < 0.1) {
    return "watch_no_baseline_lift";
  }

  if (expectancy >= 0.15 && profitFactor >= 1.25) {
    return "candidate_review";
  }

  return "watch";
}

function summarize(report) {
  const freshnessFailures = Object.entries(report.freshness)
    .filter(([, value]) => !["fresh", "aging"].includes(value.status));
  const overall = report.paper.overall;
  const qualified = report.paper.qualified;
  const shadow = report.shadow.totals;
  const reviewCandidates = report.candidates.filter((candidate) => candidate.action === "candidate_review");
  const lowSampleWatches = report.candidates.filter((candidate) => candidate.action === "watch_low_sample");

  if (freshnessFailures.length > 0) {
    return "needs_attention_data_stale";
  }
  if (shadow?.grossPnlUsd < 0 && overall?.avgR < 0 && reviewCandidates.length === 0) {
    return lowSampleWatches.length > 0
      ? "no_trade_watch_low_sample"
      : "no_trade_negative_edge";
  }
  if (qualified?.avgR > 0 && reviewCandidates.length > 0) {
    return "candidate_review_needed";
  }
  return "watch";
}

function renderMarkdown(report) {
  const overall = report.paper.overall ?? {};
  const qualified = report.paper.qualified ?? {};
  const shadow = report.shadow.totals ?? {};
  const candidateLines = report.candidates.length === 0
    ? ["- None."]
    : report.candidates.map((candidate) => {
      const stats = candidate.stats ?? {};
      const pf = stats.profitFactor === undefined ? "n/a" : Number(stats.profitFactor).toFixed(4);
      const expectancy = stats.expectancyR === undefined ? "n/a" : `${Number(stats.expectancyR).toFixed(4)}R`;
      return `- ${candidate.symbol} ${candidate.timeframe} ${candidate.setup} ${candidate.direction} ${candidate.regime}: ${candidate.action}, n=${stats.sample ?? "n/a"}, exp=${expectancy}, PF=${pf}`;
    });

  return `# RALPH State Of Edge Report

Generated: ${report.generatedAt}

Status: ${report.status}

Verdict: ${report.verdict}

## Freshness

${Object.entries(report.freshness).map(([key, value]) => `- ${key}: ${value.status}, age ${value.ageHours ?? "n/a"}h, ${value.iso ?? "missing"}`).join("\n")}

## Paper

- Overall: ${overall.total ?? "n/a"} total / ${overall.closed ?? "n/a"} closed, avg ${fmtR(overall.avgR)}, winrate ${fmtPct(overall.winrate)}
- Qualified A/B/C: ${qualified.total ?? "n/a"} total / ${qualified.closed ?? "n/a"} closed, avg ${fmtR(qualified.avgR)}, winrate ${fmtPct(qualified.winrate)}
- Shadow PnL: ${shadow.filled ?? "n/a"} filled, ${shadow.grossPnlUsd ?? "n/a"} USD gross, winrate ${fmtPct(shadow.winRateFilled)}

## Candidate Actions

${candidateLines.join("\n")}

## Boundary

Research/paper automation only. No live orders, exchange mutations, wallet-key handling, paid APIs, sizing, TP/SL, or execution changes.
`;
}

function fmtR(value) {
  return typeof value === "number" ? `${value.toFixed(4)}R` : "n/a";
}

function fmtPct(value) {
  return typeof value === "number" ? `${(value * 100).toFixed(2)}%` : "n/a";
}
