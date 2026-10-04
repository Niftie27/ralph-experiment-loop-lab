#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const FILTER_REPORT = path.join(RESULTS_DIR, "filter-report.json");
const OUT_JSON = path.join(RESULTS_DIR, "walk-forward-near-miss-sidecar.json");
const OUT_MD = path.join(RESULTS_DIR, "walk-forward-near-miss-sidecar.md");

const report = JSON.parse(await fs.readFile(FILTER_REPORT, "utf8"));
const generatedAt = new Date().toISOString();
const gates = report.gates ?? {};
const nearMisses = (report.verdicts ?? [])
  .filter((item) =>
    item.verdict?.status === "rejected" &&
    Array.isArray(item.verdict.failures) &&
    item.verdict.failures.length === 1 &&
    item.verdict.failures.includes("weak_walk_forward_out_of_sample")
  )
  .map(summarizeNearMiss)
  .sort((a, b) =>
    (a.walkForward.requiredDiagnosticOosFolds - a.walkForward.positiveOutOfSampleFolds) -
    (b.walkForward.requiredDiagnosticOosFolds - b.walkForward.positiveOutOfSampleFolds) ||
    b.outOfSample.expectancyR - a.outOfSample.expectancyR ||
    a.variantId.localeCompare(b.variantId)
  );

const summary = summarize(nearMisses);
const sidecar = {
  generatedAt,
  status: "research-only-walk-forward-near-miss-sidecar",
  source: {
    path: "results/filter-report.json",
    generatedAt: report.generatedAt ?? null,
    split: report.evaluation?.split ?? null,
    walkForward: report.antiOverfitControls?.walkForward ?? null
  },
  gates: {
    minOutOfSampleExpectancyR: gates.minOutOfSampleExpectancyR ?? null,
    requiredPositiveFoldShare: 0.6,
    diagnosticOosFoldWindow: "last 30 percent of valid chronological folds"
  },
  summary,
  nearMisses,
  decision: {
    verdict: nearMisses.length > 0
      ? "near_misses_visible_no_threshold_change"
      : "no_walk_forward_near_misses",
    noThresholdChange: true,
    noPromotion: true,
    rationale: nearMisses.length > 0
      ? "Variants clear the other current gates but still fail the late-fold OOS diagnostic, so the right action is visibility, not gate relaxation."
      : "No variants currently fail only the walk-forward OOS diagnostic."
  },
  boundaries: {
    liveTrading: false,
    orderPlacement: false,
    alertWordingChanges: false,
    thresholdsChanged: false,
    sizingTpSlChanged: false,
    strategyPromotion: false
  }
};

await fs.writeFile(OUT_JSON, `${JSON.stringify(sidecar, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(sidecar));

console.log(JSON.stringify({
  ok: true,
  verdict: sidecar.decision.verdict,
  nearMisses: sidecar.summary.count,
  outputs: [
    path.relative(ROOT, OUT_JSON),
    path.relative(ROOT, OUT_MD)
  ]
}, null, 2));

function summarizeNearMiss(item) {
  const validFolds = (item.walkForward?.folds ?? []).filter((fold) => fold.sample > 0);
  const requiredPositiveFolds = Math.ceil(validFolds.length * 0.6);
  const oosStart = Math.floor(validFolds.length * 0.7);
  const diagnosticOosFolds = validFolds.slice(oosStart);
  const requiredDiagnosticOosFolds = validFolds.length - oosStart;
  const weakDiagnosticOosFolds = diagnosticOosFolds.filter((fold) =>
    !Number.isFinite(fold.expectancyR) ||
    fold.expectancyR <= (gates.minOutOfSampleExpectancyR ?? 0)
  );
  const params = item.params ?? {};
  const baselineComparison = item.baseline?.comparison ?? {};

  return {
    variantId: item.variantId,
    candidateId: item.candidateId,
    family: item.family,
    symbol: params.symbol ?? null,
    timeframe: params.timeframe ?? null,
    sideContext: [params.trend, params.volatility].filter(Boolean).join("/") || null,
    rule: item.rule ?? null,
    failures: item.verdict.failures,
    stats: pickStats(item.stats),
    outOfSample: pickStats(item.splitStats?.outOfSample),
    baseline: {
      expectancyLiftR: round(baselineComparison.expectancyLiftR),
      outOfSampleExpectancyLiftR: round(baselineComparison.outOfSampleExpectancyLiftR)
    },
    walkForward: {
      validFoldCount: validFolds.length,
      positiveFolds: item.walkForward?.positiveFolds ?? null,
      requiredPositiveFolds,
      positiveBaselineLiftFolds: item.walkForward?.positiveBaselineLiftFolds ?? null,
      positiveOutOfSampleFolds: item.walkForward?.positiveOutOfSampleFolds ?? null,
      requiredDiagnosticOosFolds,
      minFoldExpectancyR: round(item.walkForward?.minFoldExpectancyR)
    },
    weakDiagnosticOosFolds: weakDiagnosticOosFolds.map((fold) => ({
      fold: fold.fold,
      sample: fold.sample,
      firstEntryIso: isoSeconds(fold.firstEntryTime),
      lastEntryIso: isoSeconds(fold.lastEntryTime),
      expectancyR: round(fold.expectancyR),
      baselineExpectancyR: round(fold.baselineExpectancyR),
      expectancyLiftR: round(fold.expectancyLiftR),
      profitFactor: round(fold.profitFactor),
      maxDrawdownR: round(fold.maxDrawdownR)
    }))
  };
}

function summarize(rows) {
  const byFamily = countBy(rows, (row) => row.family ?? "unknown");
  const bySymbol = countBy(rows, (row) => row.symbol ?? "unknown");
  const weakestFoldExpectancyR = round(Math.min(...rows.map((row) => row.walkForward.minFoldExpectancyR).filter(Number.isFinite)));
  const bestOosExpectancyR = round(Math.max(...rows.map((row) => row.outOfSample.expectancyR).filter(Number.isFinite)));
  return {
    count: rows.length,
    byFamily,
    bySymbol,
    weakestFoldExpectancyR: Number.isFinite(weakestFoldExpectancyR) ? weakestFoldExpectancyR : null,
    bestOutOfSampleExpectancyR: Number.isFinite(bestOosExpectancyR) ? bestOosExpectancyR : null
  };
}

function pickStats(stats = {}) {
  return {
    sample: stats.sample ?? null,
    expectancyR: round(stats.expectancyR),
    profitFactor: round(stats.profitFactor),
    deflatedSharpe: round(stats.deflatedSharpe),
    maxDrawdownR: round(stats.maxDrawdownR)
  };
}

function countBy(rows, keyFn) {
  return rows.reduce((acc, row) => {
    const key = keyFn(row);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function renderMarkdown(sidecar) {
  const rows = sidecar.nearMisses.length
    ? sidecar.nearMisses.map((row) => {
      const weak = row.weakDiagnosticOosFolds
        .map((fold) => `f${fold.fold} ${fmtR(fold.expectancyR)}`)
        .join(", ");
      return `- ${row.variantId}: ${row.symbol} ${row.timeframe} ${row.rule} ${row.sideContext ?? "n/a"}; OOS ${fmtR(row.outOfSample.expectancyR)}, PF ${fmt(row.outOfSample.profitFactor)}, walk-forward OOS ${row.walkForward.positiveOutOfSampleFolds}/${row.walkForward.requiredDiagnosticOosFolds}; weak diagnostic folds: ${weak || "none"}.`;
    })
    : ["- None."];

  return `# Walk-Forward Near-Miss Sidecar

Generated: ${sidecar.generatedAt}

Status: ${sidecar.status}

Source filter report: ${sidecar.source.generatedAt ?? "unknown"}

Verdict: ${sidecar.decision.verdict}

## Summary

- Near misses: ${sidecar.summary.count}
- By family: ${formatCounts(sidecar.summary.byFamily)}
- By symbol: ${formatCounts(sidecar.summary.bySymbol)}
- Best OOS expectancy among near misses: ${fmtR(sidecar.summary.bestOutOfSampleExpectancyR)}
- Weakest fold expectancy among near misses: ${fmtR(sidecar.summary.weakestFoldExpectancyR)}

## Near Misses

${rows.join("\n")}

## Decision

${sidecar.decision.rationale}

## Boundary

Research-only sidecar. No live orders, alert wording changes, thresholds, sizing, TP/SL, execution behavior, scheduler changes, or strategy promotion changed.
`;
}

function formatCounts(counts) {
  const entries = Object.entries(counts ?? {});
  return entries.length ? entries.map(([key, value]) => `${key}=${value}`).join(", ") : "none";
}

function fmt(value) {
  return Number.isFinite(value) ? value.toFixed(4) : "n/a";
}

function fmtR(value) {
  return Number.isFinite(value) ? `${value.toFixed(4)}R` : "n/a";
}

function round(value, places = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(places)) : null;
}

function isoSeconds(value) {
  return Number.isFinite(value) ? new Date(value * 1000).toISOString() : null;
}
