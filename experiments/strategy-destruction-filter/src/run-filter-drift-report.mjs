#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const CURRENT_REPORT = path.join(RESULTS_DIR, "filter-report.json");
const DEFAULT_BASELINE = path.join(ROOT, "baselines", "2026-09-13-survivor-shape-report.json");
const BASELINE_REPORT = process.env.STRATEGY_FILTER_BASELINE_REPORT || DEFAULT_BASELINE;
const OUT_JSON = path.join(RESULTS_DIR, "filter-drift-report.json");
const OUT_MD = path.join(RESULTS_DIR, "filter-drift-report.md");

const current = JSON.parse(await fs.readFile(CURRENT_REPORT, "utf8"));
const previous = JSON.parse(await fs.readFile(BASELINE_REPORT, "utf8"));
const currentVerdicts = new Map(current.verdicts.map((item) => [item.variantId, item]));
const currentShapes = new Map((current.survivorShapes || []).map((shape) => [shape.shapeId, shape]));
const previousShapes = previous.survivorShapes || [];

const changedShapes = previousShapes.map((shape) => {
  const currentShape = currentShapes.get(shape.shapeId) || null;
  const representative = currentVerdicts.get(shape.representativeVariantId) || null;
  const currentStatus = currentShape ? "survived_research_gate" : representative?.verdict?.status || "missing";
  return {
    shapeId: shape.shapeId,
    candidateId: shape.candidateId,
    representativeVariantId: shape.representativeVariantId,
    previousStatus: shape.status || "survived_research_gate",
    currentStatus,
    change: currentStatus === (shape.status || "survived_research_gate") ? "unchanged" : `${shape.status || "survived_research_gate"}->${currentStatus}`,
    previousMetrics: shape.metrics || null,
    currentMetrics: representative ? metricsFor(representative) : null,
    currentFailures: representative?.verdict?.failures || []
  };
});

const addedShapes = (current.survivorShapes || [])
  .filter((shape) => !previousShapes.some((previousShape) => previousShape.shapeId === shape.shapeId))
  .map((shape) => ({
    shapeId: shape.shapeId,
    candidateId: shape.candidateId,
    representativeVariantId: shape.representativeVariantId,
    currentStatus: "survived_research_gate",
    currentMetrics: shape.metrics || null
  }));

const gateGroupComparison = compareGateGroups(previous.gateGroupDiagnostics || null, current.gateGroupDiagnostics || null);
const totalsDelta = compareTotals(previous.totals, current.totals);
const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-drift-report",
  baseline: {
    id: previous.id || null,
    source: previous.source || BASELINE_REPORT,
    generatedAt: previous.generatedAt,
    path: path.relative(ROOT, BASELINE_REPORT)
  },
  current: {
    generatedAt: current.generatedAt,
    path: path.relative(ROOT, CURRENT_REPORT)
  },
  totals: {
    previous: previous.totals,
    current: current.totals,
    delta: totalsDelta
  },
  gateGroupComparison,
  shapes: {
    added: addedShapes,
    removed: changedShapes.filter((shape) => shape.previousStatus === "survived_research_gate" && shape.currentStatus !== "survived_research_gate"),
    changed: changedShapes.filter((shape) => shape.change !== "unchanged"),
    unchanged: changedShapes.filter((shape) => shape.change === "unchanged")
  },
  decision: {
    noThresholdChange: true,
    promotionChanged: false,
    verdict:
      current.totals.survivorShapes === 0
        ? "zero_survivor_shapes_no_promotion"
        : "survivor_shapes_present_review_required",
    nextAction:
      current.totals.survivorShapes === 0
        ? "Keep strict gates; use drift report to audit survivor/watch downgrades before considering any threshold change."
        : "Review added survivor shapes against forward-paper and no-live-execution gates before any promotion wording."
  },
  boundary:
    "Generated local drift outputs only; no live trading, orders, exchange mutation, keys, paid APIs, alert wording, thresholds, sizing, TP/SL, execution behavior, scheduler cadence, or strategy promotion changed."
};

await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(report));
console.log(JSON.stringify({
  ok: true,
  verdict: report.decision.verdict,
  previousSurvivorShapes: previous.totals.survivorShapes,
  currentSurvivorShapes: current.totals.survivorShapes,
  changedShapes: report.shapes.changed.length,
  report: OUT_JSON
}, null, 2));

function metricsFor(item) {
  return {
    sample: item.stats?.sample ?? null,
    expectancyR: item.stats?.expectancyR ?? null,
    profitFactor: item.stats?.profitFactor ?? null,
    deflatedSharpe: item.stats?.deflatedSharpe ?? null,
    outOfSampleSample: item.splitStats?.outOfSample?.sample ?? null,
    outOfSampleExpectancyR: item.splitStats?.outOfSample?.expectancyR ?? null,
    baselineExpectancyLiftR: item.baseline?.comparison?.expectancyLiftR ?? null,
    outOfSampleBaselineLiftR: item.baseline?.comparison?.outOfSampleExpectancyLiftR ?? null,
    positiveFolds: item.walkForward?.positiveFolds ?? null,
    foldCount: item.walkForward?.foldCount ?? null,
    positiveBaselineLiftFolds: item.walkForward?.positiveBaselineLiftFolds ?? null,
    positiveOutOfSampleFolds: item.walkForward?.positiveOutOfSampleFolds ?? null,
    minFoldExpectancyR: item.walkForward?.minFoldExpectancyR ?? null
  };
}

function compareTotals(previousTotals, currentTotals) {
  const keys = ["candidates", "variants", "survivors", "survivorShapes", "rejected"];
  return Object.fromEntries(keys.map((key) => [key, (currentTotals?.[key] ?? 0) - (previousTotals?.[key] ?? 0)]));
}

function compareGateGroups(previousGroups, currentGroups) {
  if (!previousGroups || !currentGroups) {
    return {
      available: false,
      reason: "baseline lacks compatible gateGroupDiagnostics"
    };
  }
  const keys = ["headline_pass", "deflated_sharpe_pass", "oos_pass", "baseline_pass", "walk_forward_pass"];
  return {
    available: true,
    groups: Object.fromEntries(keys.map((key) => [
      key,
      {
        previousPassCount: previousGroups[key]?.passCount ?? null,
        currentPassCount: currentGroups[key]?.passCount ?? null,
        delta: Number.isFinite(previousGroups[key]?.passCount) && Number.isFinite(currentGroups[key]?.passCount)
          ? currentGroups[key].passCount - previousGroups[key].passCount
          : null
      }
    ]))
  };
}

function renderMarkdown(input) {
  const lines = [
    "# Strategy Filter Drift Report",
    "",
    `Generated: ${input.generatedAt}`,
    `Baseline: ${input.baseline.generatedAt} (${input.baseline.source})`,
    `Current: ${input.current.generatedAt}`,
    "",
    "## Totals Drift",
    "",
    ...["candidates", "variants", "survivors", "survivorShapes", "rejected"].map((key) =>
      `- ${key}: ${input.totals.previous[key]} -> ${input.totals.current[key]} (${formatDelta(input.totals.delta[key])})`
    ),
    "",
    "## Shape Status Changes",
    "",
    ...(input.shapes.changed.length
      ? input.shapes.changed.flatMap((shape) => [
          `### ${shape.shapeId}`,
          "",
          `- Representative: ${shape.representativeVariantId}`,
          `- Status: ${shape.previousStatus} -> ${shape.currentStatus}`,
          `- Current failures: ${shape.currentFailures.length ? shape.currentFailures.join(", ") : "none"}`,
          `- Current metrics: sample=${shape.currentMetrics?.sample ?? "n/a"}, expectancy=${shape.currentMetrics?.expectancyR ?? "n/a"}R, profitFactor=${shape.currentMetrics?.profitFactor ?? "n/a"}, deflatedSharpe=${shape.currentMetrics?.deflatedSharpe ?? "n/a"}`,
          `- OOS: sample=${shape.currentMetrics?.outOfSampleSample ?? "n/a"}, expectancy=${shape.currentMetrics?.outOfSampleExpectancyR ?? "n/a"}R, baselineLift=${shape.currentMetrics?.outOfSampleBaselineLiftR ?? "n/a"}R`,
          `- Walk-forward: positiveFolds=${shape.currentMetrics?.positiveFolds ?? "n/a"}/${shape.currentMetrics?.foldCount ?? "n/a"}, positiveOosFolds=${shape.currentMetrics?.positiveOutOfSampleFolds ?? "n/a"}`,
          ""
        ])
      : ["- none", ""]),
    "## Gate Group Comparison",
    "",
    ...(input.gateGroupComparison.available
      ? Object.entries(input.gateGroupComparison.groups).map(([key, row]) =>
          `- ${key}: ${row.previousPassCount} -> ${row.currentPassCount} (${formatDelta(row.delta)})`
        )
      : [`- unavailable: ${input.gateGroupComparison.reason}`]),
    "",
    "## Decision",
    "",
    `- Verdict: ${input.decision.verdict}`,
    `- No threshold change: ${input.decision.noThresholdChange ? "yes" : "no"}`,
    `- Promotion changed: ${input.decision.promotionChanged ? "yes" : "no"}`,
    `- Next action: ${input.decision.nextAction}`,
    "",
    input.boundary,
    ""
  ];
  return `${lines.join("\n")}\n`;
}

function formatDelta(value) {
  if (!Number.isFinite(value)) return "n/a";
  return value >= 0 ? `+${value}` : `${value}`;
}
