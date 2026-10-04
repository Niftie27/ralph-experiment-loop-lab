#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const INPUT_JSON = path.join(ROOT, "outputs", "candidate-scoring-dry-run.json");
const OUTPUT_JSON = path.join(ROOT, "outputs", "strategy-score-rubric-dry-run.json");
const OUTPUT_MD = path.join(ROOT, "outputs", "strategy-score-rubric-dry-run.md");

const input = JSON.parse(await fs.readFile(INPUT_JSON, "utf8"));
const reviewed = input.candidates.map(reviewCandidate);

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  source: "outputs/candidate-scoring-dry-run.json",
  note: "Second-stage rubric review over the candidate router. It audits route quality only; it does not mutate candidate states, alerts, thresholds, risk, sizing, execution, or strategy promotion.",
  rubric: {
    benchmarkReady: [
      "candidate has a measurable next action",
      "candidate has evidence quality >= 3",
      "candidate has data rail fit >= 4",
      "candidate has execution-risk score >= 4",
      "candidate is strategy, validation, framework, orderflow, or discovery work rather than broad context"
    ],
    investigateReady: [
      "candidate fits portfolio/system goals",
      "candidate can be tested or researched cheaply",
      "candidate has a specific next action",
      "candidate stays inside research-only constraints"
    ],
    downgradeReasons: [
      "broad context/data-source work without a falsifiable benchmark",
      "missing specific next action",
      "paid/account-dependent rail",
      "live/key/execution-adjacent wording",
      "already discarded"
    ]
  },
  totals: countTotals(reviewed),
  acceptedTopRoutes: reviewed.filter((item) => item.rubricDecision === "accept").slice(0, 12),
  reviewFlags: reviewed.filter((item) => item.rubricDecision !== "accept"),
  candidates: reviewed
};

await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUTPUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  candidates: reviewed.length,
  accepted: report.totals.accept,
  downgrade: report.totals.downgrade,
  hold: report.totals.hold,
  discard: report.totals.discard,
  output: OUTPUT_MD
}, null, 2));

function reviewCandidate(item) {
  const text = `${item.candidate} ${item.type} ${item.thesis} ${item.nextAction} ${item.status} ${item.nextLoop}`.toLowerCase();
  const specificNextAction = hasSpecificNextAction(text);
  const broadContextOnly = hasAny(text, ["battlefield context", "context collection", "draft rail evaluation"]);
  const paidOrAccountDependent = hasAny(text, ["nansen", "arkham", "dune", "copin", "account", "paid"]);
  const executionAdjacent = hasAny(text, ["live", "wallet keys", "exchange account"]);
  const strategyRelevant = hasAny(text, [
    "strategy",
    "orderflow",
    "alert",
    "backtest",
    "benchmark",
    "validation",
    "framework",
    "repo",
    "wallet",
    "funding",
    "basis",
    "replay",
    "paper"
  ]);
  const measurable = specificNextAction && !broadContextOnly;

  const benchmarkReady = (
    item.recommendedState === "benchmark" &&
    measurable &&
    strategyRelevant &&
    item.scores.evidenceQuality >= 3 &&
    item.scores.dataRailFit >= 4 &&
    item.scores.executionRisk >= 4 &&
    !paidOrAccountDependent &&
    !executionAdjacent
  );

  const investigateReady = (
    ["benchmark", "investigate"].includes(item.recommendedState) &&
    item.scores.portfolioFit >= 3 &&
    item.scores.testability >= 3 &&
    specificNextAction &&
    !executionAdjacent
  );

  const flags = [];
  if (item.status === "Discarded") flags.push("already discarded");
  if (!specificNextAction) flags.push("missing specific next action");
  if (broadContextOnly) flags.push("broad context/data-source work needs a falsifiable benchmark before benchmark routing");
  if (paidOrAccountDependent) flags.push("rail may require account/paid access verification before active routing");
  if (executionAdjacent) flags.push("execution-adjacent wording requires research-only containment");
  if (item.recommendedState === "benchmark" && !benchmarkReady) flags.push("benchmark route is too strong under rubric");

  let rubricDecision = "hold";
  let rubricState = "watch";
  if (item.status === "Discarded") {
    rubricDecision = "discard";
    rubricState = "discard";
  } else if (benchmarkReady) {
    rubricDecision = "accept";
    rubricState = "benchmark";
  } else if (investigateReady) {
    rubricDecision = item.recommendedState === "benchmark" ? "downgrade" : "accept";
    rubricState = "investigate";
  } else if (item.recommendedState === "watch") {
    rubricDecision = "accept";
    rubricState = "watch";
  }

  return {
    ...item,
    rubric: {
      specificNextAction,
      measurable,
      strategyRelevant,
      broadContextOnly,
      paidOrAccountDependent,
      executionAdjacent,
      benchmarkReady,
      investigateReady
    },
    rubricDecision,
    rubricState,
    flags
  };
}

function countTotals(items) {
  return {
    candidates: items.length,
    accept: items.filter((item) => item.rubricDecision === "accept").length,
    downgrade: items.filter((item) => item.rubricDecision === "downgrade").length,
    hold: items.filter((item) => item.rubricDecision === "hold").length,
    discard: items.filter((item) => item.rubricDecision === "discard").length,
    rubricBenchmark: items.filter((item) => item.rubricState === "benchmark").length,
    rubricInvestigate: items.filter((item) => item.rubricState === "investigate").length,
    rubricWatch: items.filter((item) => item.rubricState === "watch").length,
    rubricDiscard: items.filter((item) => item.rubricState === "discard").length
  };
}

function hasSpecificNextAction(text) {
  return hasAny(text, [
    "run ",
    "create ",
    "draft ",
    "build ",
    "compare ",
    "extract ",
    "inspect ",
    "design ",
    "define ",
    "turn ",
    "defer ",
    "keep ",
    "use ",
    "test ",
    "scan ",
    "spike ",
    "map ",
    "checklist",
    "brief",
    "evaluation"
  ]);
}

function hasAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function renderMarkdown(report) {
  const lines = [
    "# Strategy Score Rubric Dry Run",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}.`,
    "",
    report.note,
    "",
    "## Verdict",
    "",
    "The rubric loop is worthwhile because the first-stage router is useful for queue ordering but too permissive for `benchmark` labels. Keep the router, but add this review layer before changing candidate states.",
    "",
    "## Totals",
    "",
    `- Candidates reviewed: ${report.totals.candidates}`,
    `- Accepted routes: ${report.totals.accept}`,
    `- Downgraded routes: ${report.totals.downgrade}`,
    `- Held routes: ${report.totals.hold}`,
    `- Discarded routes preserved: ${report.totals.discard}`,
    `- Rubric benchmark: ${report.totals.rubricBenchmark}`,
    `- Rubric investigate: ${report.totals.rubricInvestigate}`,
    `- Rubric watch: ${report.totals.rubricWatch}`,
    "",
    "## Accepted Top Routes",
    "",
    "| ID | Candidate | Router | Rubric | Decision | Notes |",
    "| --- | --- | --- | --- | --- | --- |"
  ];

  for (const item of report.acceptedTopRoutes) {
    lines.push(`| ${item.id} | ${item.candidate} | ${item.recommendedState} | ${item.rubricState} | ${item.rubricDecision} | ${item.rationale} |`);
  }

  lines.push("", "## Review Flags", "", "| ID | Candidate | Router | Rubric | Decision | Flags |", "| --- | --- | --- | --- | --- | --- |");
  for (const item of report.reviewFlags) {
    lines.push(`| ${item.id} | ${item.candidate} | ${item.recommendedState} | ${item.rubricState} | ${item.rubricDecision} | ${item.flags.join("; ") || "none"} |`);
  }

  lines.push(
    "",
    "## Interpretation",
    "",
    "- C-015, C-036, and C-009 remain good next research routes because they have specific no-key/read-only tests.",
    "- C-004 should be downgraded from benchmark to investigate until the DefiLlama context rail has a falsifiable benchmark target.",
    "- Paid/account-dependent rails such as Arkham/Nansen/Dune/Copin remain review-gated until workspace access and export paths are verified.",
    "- This dry run changes routing confidence only. It does not promote strategies or alter live systems."
  );

  return `${lines.join("\n")}\n`;
}
