#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CANDIDATES_PATH = path.join(ROOT, "decisions", "candidates.md");
const OUTPUT_JSON = path.join(ROOT, "outputs", "candidate-scoring-dry-run.json");
const OUTPUT_MD = path.join(ROOT, "outputs", "candidate-scoring-dry-run.md");

const candidates = parseCandidateTable(await fs.readFile(CANDIDATES_PATH, "utf8"));
const scored = candidates.map(scoreCandidate).sort((a, b) =>
  stateRank(a.recommendedState) - stateRank(b.recommendedState) || b.total - a.total || a.id.localeCompare(b.id)
);

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  scoringSource: "core/candidate-scoring.md",
  note: "Dry-run heuristic over the candidate inventory. It routes work; it does not promote strategies, alter alerts, or authorize execution.",
  totals: {
    candidates: scored.length,
    investigate: scored.filter((item) => item.recommendedState === "investigate").length,
    benchmark: scored.filter((item) => item.recommendedState === "benchmark").length,
    prototype: scored.filter((item) => item.recommendedState === "prototype").length,
    watch: scored.filter((item) => item.recommendedState === "watch").length,
    discard: scored.filter((item) => item.recommendedState === "discard").length
  },
  top: scored.filter((item) => item.recommendedState !== "discard").slice(0, 12),
  candidates: scored
};

await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUTPUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  candidates: report.totals.candidates,
  top: report.top.slice(0, 5).map((item) => ({ id: item.id, state: item.recommendedState, total: item.total })),
  output: OUTPUT_JSON
}, null, 2));

export function parseCandidateTable(markdown) {
  return markdown
    .split(/\r?\n/)
    .filter((line) => line.startsWith("| C-"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 6)
    .map(([id, candidate, type, thesis, nextAction, status]) => ({ id, candidate, type, thesis, nextAction, status }));
}

export function scoreCandidate(candidate) {
  const text = `${candidate.candidate} ${candidate.type} ${candidate.thesis} ${candidate.nextAction} ${candidate.status}`.toLowerCase();
  const scores = {
    portfolioFit: scorePortfolioFit(text),
    testability: scoreTestability(text),
    evidenceQuality: scoreEvidenceQuality(text),
    dataRailFit: scoreDataRailFit(text),
    timeCost: scoreTimeCost(text),
    executionRisk: scoreExecutionRisk(text),
    differentiation: scoreDifferentiation(text)
  };
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  return {
    ...candidate,
    scores,
    total,
    recommendedState: recommendedState(candidate, scores),
    nextLoop: nextLoop(candidate, text),
    rationale: rationale(candidate, scores, text)
  };
}

function recommendedState(candidate, scores) {
  if (candidate.status === "Discarded") return "discard";
  if (scores.testability >= 4 && scores.evidenceQuality >= 3 && scores.executionRisk >= 4) return "benchmark";
  if (scores.portfolioFit >= 3 && scores.testability >= 3 && scores.dataRailFit >= 3) return "investigate";
  if (scores.executionRisk <= 2 || scores.dataRailFit <= 2) return "watch";
  return "watch";
}

function nextLoop(candidate, text) {
  if (candidate.status === "Discarded") return "decision-loop";
  if (text.includes("score") || text.includes("rubric")) return "validation-benchmark-loop";
  if (text.includes("framework") || text.includes("repo") || text.includes("freqtrade") || text.includes("hummingbot")) {
    return "framework-repo-discovery-loop";
  }
  if (text.includes("wallet") || text.includes("accumulation") || text.includes("funding") || text.includes("basis")) {
    return "strategy-research-loop";
  }
  if (text.includes("orderflow") || text.includes("alert") || text.includes("paper")) return "validation-benchmark-loop";
  return "investigation-loop";
}

function rationale(candidate, scores, text) {
  const parts = [];
  if (scores.testability >= 4) parts.push("cheap measurable next test");
  if (scores.dataRailFit >= 4) parts.push("fits existing/local data rails");
  if (scores.executionRisk >= 4) parts.push("low execution risk");
  if (text.includes("active")) parts.push("already active");
  if (candidate.status === "Discarded") parts.push("already discarded");
  if (!parts.length) parts.push("needs clearer evidence threshold before promotion");
  return parts.join("; ");
}

function scorePortfolioFit(text) {
  if (hasAny(text, ["benchmark", "validation", "research", "decision", "framework", "strategy"])) return 4;
  if (hasAny(text, ["data rail", "tool", "source"])) return 3;
  return 2;
}

function scoreTestability(text) {
  if (hasAny(text, ["backtest", "benchmark", "dry-run", "replay", "public", "local", "schema", "score"])) return 5;
  if (hasAny(text, ["checklist", "scan", "map", "brief", "feasibility"])) return 4;
  if (hasAny(text, ["investigation", "research"])) return 3;
  return 2;
}

function scoreEvidenceQuality(text) {
  if (hasAny(text, ["completed", "results", "review", "archive", "dashboard", "ledger"])) return 4;
  if (hasAny(text, ["public", "repos", "docs", "sources", "prior-art", "tool scan"])) return 3;
  if (hasAny(text, ["candidate", "watch"])) return 2;
  return 1;
}

function scoreDataRailFit(text) {
  if (hasAny(text, ["local", "public", "no-key", "binance", "hyperliquid", "alert", "paper", "freqtrade"])) return 5;
  if (hasAny(text, ["dune", "arkham", "nansen", "copin"])) return 3;
  if (hasAny(text, ["paid", "account", "api"])) return 2;
  return 3;
}

function scoreTimeCost(text) {
  if (hasAny(text, ["dry-run", "checklist", "scan", "schema", "score", "brief", "map"])) return 4;
  if (hasAny(text, ["prototype", "build", "scanner", "implementation"])) return 2;
  return 3;
}

function scoreExecutionRisk(text) {
  if (hasAny(text, ["live", "execution", "wallet", "keys", "exchange account"])) return 2;
  if (hasAny(text, ["paper", "read-only", "no-key", "public", "research", "benchmark", "scan"])) return 5;
  return 4;
}

function scoreDifferentiation(text) {
  if (hasAny(text, ["strategy", "orderflow", "wallet", "accumulation", "funding", "basis", "decision", "validation"])) return 4;
  if (hasAny(text, ["framework", "bot", "grid"])) return 2;
  return 3;
}

function hasAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function stateRank(state) {
  return { benchmark: 0, investigate: 1, prototype: 2, watch: 3, discard: 4 }[state] ?? 9;
}

function renderMarkdown(report) {
  const lines = [
    "# Candidate Scoring Dry Run",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}.`,
    "",
    report.note,
    "",
    "## Totals",
    "",
    `- Candidates: ${report.totals.candidates}`,
    `- Benchmark: ${report.totals.benchmark}`,
    `- Investigate: ${report.totals.investigate}`,
    `- Watch: ${report.totals.watch}`,
    `- Discard: ${report.totals.discard}`,
    "",
    "## Top Routes",
    "",
    "| ID | Candidate | Current | Recommended | Total | Next loop | Rationale |",
    "| --- | --- | --- | --- | ---: | --- | --- |"
  ];

  for (const item of report.top) {
    lines.push(`| ${item.id} | ${item.candidate} | ${item.status} | ${item.recommendedState} | ${item.total} | ${item.nextLoop} | ${item.rationale} |`);
  }

  lines.push("", "## Interpretation", "", "This dry-run ranking is a router. It should be reviewed before mutating candidate states.");
  return `${lines.join("\n")}\n`;
}
