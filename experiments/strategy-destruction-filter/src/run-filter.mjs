#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { validateCandidateSet } from "./candidate-spec.mjs";
import { backtestVariant, expandCandidate, summarizeVariantRuns } from "./engine.mjs";
import { fetchConfiguredCandles } from "./market-data.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const CANDIDATES_PATH = path.join(ROOT, "candidates", "seed-strategies.json");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON = path.join(RESULTS_DIR, "filter-report.json");
const REPORT_MD = path.join(RESULTS_DIR, "filter-report.md");
const SURVIVORS_JSON = path.join(RESULTS_DIR, "survivors.json");
const REJECTED_JSONL = path.join(RESULTS_DIR, "rejected-ideas.jsonl");

const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
const candidates = JSON.parse(await fs.readFile(CANDIDATES_PATH, "utf8"));
const candidateValidation = validateCandidateSet(candidates);
if (!candidateValidation.ok) {
  throw new Error(`candidate spec validation failed:\n${candidateValidation.errors.join("\n")}`);
}
const variants = candidates.flatMap(expandCandidate);

await fs.mkdir(RESULTS_DIR, { recursive: true });

const data = new Map();
const sources = [];
for (const symbol of config.data.symbols) {
  for (const timeframe of config.data.timeframes) {
    const fetched = await fetchConfiguredCandles(symbol, timeframe);
    data.set(`${symbol.symbol}|${timeframe.id}`, fetched.candles);
    sources.push({
      symbol: symbol.symbol,
      provider: fetched.meta.provider,
      market: fetched.meta.market,
      exchangeSymbol: symbol.binanceSpotSymbol || symbol.bybitSymbol,
      timeframe: timeframe.id,
      lookbackDays: timeframe.lookbackDays,
      candles: fetched.candles.length,
      firstCandleTime: isoFromSeconds(fetched.candles[0]?.time),
      lastCandleTime: isoFromSeconds(fetched.candles.at(-1)?.time),
      source: fetched.meta.source,
      instrumentLaunchTime: fetched.meta.instrumentLaunchTime || null,
      features: fetched.meta.features || null
    });
  }
}

const runsByVariant = new Map(variants.map((variant) => [variant.variantId, []]));
for (const variant of variants) {
  for (const symbol of config.data.symbols) {
    for (const timeframe of config.data.timeframes) {
      const candles = data.get(`${symbol.symbol}|${timeframe.id}`);
      runsByVariant.get(variant.variantId).push(backtestVariant(variant, candles, symbol.symbol, timeframe, config));
    }
  }
}

const trialCount = Math.max(config.multipleTesting?.familyPenaltyFloor || 1, variants.length);
const verdicts = [...runsByVariant.values()]
  .map((runs) => summarizeVariantRuns(runs, trialCount, config.gates))
  .sort((a, b) => {
    if (a.verdict.status !== b.verdict.status) return a.verdict.status === "survived_research_gate" ? -1 : 1;
    return (b.stats.deflatedSharpe ?? -Infinity) - (a.stats.deflatedSharpe ?? -Infinity);
  });

const survivors = verdicts.filter((item) => item.verdict.status === "survived_research_gate");
const rejected = verdicts.filter((item) => item.verdict.status === "rejected");
const survivorShapes = summarizeSurvivorShapes(survivors);
const gateGroupDiagnostics = summarizeGateGroups(verdicts, survivorShapes, config.gates);
const antiOverfitControls = summarizeAntiOverfitControls(verdicts, config);
const report = {
  generatedAt: new Date().toISOString(),
  status: config.status,
  dataSource: config.data.source,
  sources,
  gates: config.gates,
  evaluation: config.evaluation,
  multipleTesting: {
    trialCount,
    label: "approximate_multiple_testing_deflated_sharpe",
    implementation: "approximate_proxy",
    note: "deflatedSharpe is a conservative proxy penalty for broad parameter search; it is a survival gate, not a full institutional Deflated Sharpe Ratio implementation",
    diagnostics: [
      {
        label: "diagnostic_probabilistic_sharpe_proxy",
        implementation: "psr_style_proxy",
        note: "probabilisticSharpe estimates whether variant trade Sharpe beats the matched baseline Sharpe while accounting for sample length, skew, and kurtosis; diagnostic-only, not a survival gate"
      }
    ]
  },
  totals: {
    candidates: candidates.length,
    variants: variants.length,
    survivors: survivors.length,
    survivorShapes: survivorShapes.length,
    rejected: rejected.length
  },
  gateGroupDiagnostics,
  antiOverfitControls,
  survivorShapes,
  verdicts
};

await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(SURVIVORS_JSON, `${JSON.stringify(survivors, null, 2)}\n`);
await fs.writeFile(REJECTED_JSONL, rejected.map((item) => JSON.stringify({
  generatedAt: report.generatedAt,
  candidateId: item.candidateId,
  variantId: item.variantId,
  family: item.family,
  idea: item.idea,
  thesis: item.thesis,
  dataRequirements: item.dataRequirements,
  validation: item.validation,
  stats: item.stats,
      splitStats: item.splitStats,
      splitMetadata: item.splitMetadata,
      baseline: item.baseline,
  failures: item.verdict.failures,
  params: item.params
})).join("\n") + (rejected.length ? "\n" : ""));
await fs.writeFile(REPORT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  status: report.status,
  candidates: report.totals.candidates,
  variants: report.totals.variants,
  survivors: report.totals.survivors,
  rejected: report.totals.rejected,
  report: REPORT_JSON
}, null, 2));

function renderMarkdown(report) {
  const lines = [
    "# Strategy Destruction Filter Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}.`,
    "",
    "## Totals",
    "",
    `- Candidates: ${report.totals.candidates}`,
    `- Variants tested: ${report.totals.variants}`,
    `- Survivors: ${report.totals.survivors}`,
    `- Effective survivor shapes: ${report.totals.survivorShapes}`,
    `- Rejected: ${report.totals.rejected}`,
    "",
    "## Gate Group Diagnostics",
    "",
    "Reproducible grouped pass counts for auditing why headline-looking variants do or do not survive the full research gate.",
    "",
    ...renderGateGroupDiagnostics(report.gateGroupDiagnostics),
    "",
    "## Survivor Shape Diagnostics",
    "",
    "Groups raw survivor variants by identical realized metrics, split results, baseline comparison, walk-forward diagnostics, and worst slices. This prevents non-operative parameter duplicates from being counted as independent edges.",
    "",
    ...renderSurvivorShapeDiagnostics(report.survivorShapes),
    "",
    "## Gates",
    "",
    `- Minimum sample: ${report.gates.minSample}`,
    `- Minimum out-of-sample sample: ${report.gates.minOutOfSampleSample}`,
    `- Minimum deflated Sharpe proxy: ${report.gates.minDeflatedSharpe}`,
    `- Minimum profit factor: ${report.gates.minProfitFactor}`,
    `- Minimum expectancy after costs: ${report.gates.minExpectancyR}R`,
    `- Minimum out-of-sample expectancy: ${report.gates.minOutOfSampleExpectancyR}R`,
    `- Minimum baseline expectancy lift: ${report.gates.minBaselineExpectancyLiftR}R`,
    `- Minimum out-of-sample baseline expectancy lift: ${report.gates.minBaselineExpectancyLiftR}R`,
    `- Maximum drawdown: ${report.gates.maxDrawdownR}R`,
    `- Worst-slice floor: ${report.gates.maxWorstSliceExpectancyR}R`,
    "",
    "## Evaluation",
    "",
    "Data:",
    ...report.sources.map((source) =>
      `- ${source.symbol} ${source.timeframe}: ${source.candles} candles, ${source.firstCandleTime} to ${source.lastCandleTime}, lookback=${source.lookbackDays}d, source=${source.source}, market=${source.market}${featureSummary(source)}`
    ),
    "",
    `- Split: ${report.evaluation.split.method}, in-sample ratio ${report.evaluation.split.inSampleRatio}${report.evaluation.split.method === "purged_embargo_entry_time" ? ", purge/embargo default to timeframe maxBars unless widened" : ""}`,
    `- Baseline: ${report.evaluation.baseline.method}`,
    `- Deflated Sharpe label: ${report.multipleTesting.label} (${report.multipleTesting.implementation})`,
    `- Probabilistic Sharpe diagnostic: ${report.multipleTesting.diagnostics?.[0]?.label} (${report.multipleTesting.diagnostics?.[0]?.implementation})`,
    "",
    "## Anti-Overfit / Split Hygiene",
    "",
    `- Chronological split: ${report.antiOverfitControls.split.method}, in-sample ratio ${report.antiOverfitControls.split.inSampleRatio}, cutoff anchored by entry time per market/timeframe.`,
    `- Purged/embargo boundary: purge bars default to each timeframe maxBars, embargo bars default to each timeframe maxBars, candidate boundary rows=${report.antiOverfitControls.purgedBoundary.candidateTrades}, baseline boundary rows=${report.antiOverfitControls.purgedBoundary.baselineTrades}.`,
    `- Baseline: ${report.antiOverfitControls.baseline.method}; candidate and baseline rows use the same split and purged-boundary accounting.`,
    `- Walk-forward diagnostic: ${report.antiOverfitControls.walkForward.method}, ${report.antiOverfitControls.walkForward.foldCount} equal-trade-count chronological folds; survival still requires majority positive folds and all diagnostic OOS folds to clear the OOS gate.`,
    `- Multiple-testing guard: ${report.multipleTesting.label} (${report.multipleTesting.implementation}); PSR-style probability is diagnostic-only and cannot promote a strategy by itself.`,
    `- Promotion result: survivors=${report.totals.survivors}, effective survivor shapes=${report.totals.survivorShapes}; no threshold or promotion change is implied by this report.`,
    "",
    "## Verdicts",
    ""
  ];

  for (const item of report.verdicts) {
    lines.push(
      `### ${item.variantId}`,
      "",
      `Status: ${item.verdict.status}`,
      `Failures: ${item.verdict.failures.length ? item.verdict.failures.join(", ") : "none"}`,
      `Stats: sample=${item.stats.sample}, expectancy=${item.stats.expectancyR}R, profitFactor=${item.stats.profitFactor}, sharpe=${item.stats.sharpe}, deflatedSharpe=${item.stats.deflatedSharpe}, probabilisticSharpe=${item.stats.probabilisticSharpe}, maxDD=${item.stats.maxDrawdownR}R`,
      `Split: inSample=${item.splitStats.inSample.sample}/${item.splitStats.inSample.expectancyR}R, outOfSample=${item.splitStats.outOfSample.sample}/${item.splitStats.outOfSample.expectancyR}R`,
      `Purged boundary: candidate=${item.splitMetadata?.purgedBoundaryTrades ?? 0}, baseline=${item.splitMetadata?.purgedBoundaryBaselineTrades ?? 0}`,
      `Walk-forward: positiveFolds=${item.walkForward.positiveFolds}/${item.walkForward.foldCount}, positiveBaselineLiftFolds=${item.walkForward.positiveBaselineLiftFolds}/${item.walkForward.foldCount}, positiveOosFolds=${item.walkForward.positiveOutOfSampleFolds}, minFoldExpectancy=${item.walkForward.minFoldExpectancyR}R`,
      `Baseline: method=${item.baseline.comparison.method}, expectancyLift=${item.baseline.comparison.expectancyLiftR}R, outOfSampleLift=${item.baseline.comparison.outOfSampleExpectancyLiftR}R, deflatedSharpeLift=${item.baseline.comparison.deflatedSharpeLift}`,
      `Idea: ${item.idea}`,
      "",
      "Worst slices:"
    );
    for (const slice of item.worstSlices) {
      lines.push(`- ${slice.symbol} ${slice.timeframe} ${slice.regime}: sample=${slice.sample}, expectancy=${slice.expectancyR}R, winRate=${slice.winRate}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function isoFromSeconds(value) {
  return Number.isFinite(value) ? new Date(value * 1000).toISOString() : null;
}

function featureSummary(source) {
  const features = source.features;
  if (!features) return "";
  const parts = [];
  if (features.funding?.enabled) {
    parts.push(`fundingRows=${features.funding.rows}, candlesWithFunding=${features.funding.candlesWithFunding}`);
  }
  if (features.openInterest?.enabled) {
    parts.push(`openInterestRows=${features.openInterest.rows}, candlesWithOpenInterestChange=${features.openInterest.candlesWithOpenInterestChange}`);
  }
  return parts.length ? `, features=[${parts.join("; ")}]` : "";
}

function summarizeSurvivorShapes(survivors) {
  const groups = new Map();
  for (const item of survivors) {
    const signature = stableJson({
      candidateId: item.candidateId,
      family: item.family,
      idea: item.idea,
      stats: pickMetrics(item.stats, [
        "sample",
        "expectancyR",
        "profitFactor",
        "sharpe",
        "deflatedSharpe",
        "probabilisticSharpe",
        "maxDrawdownR",
        "worstSliceExpectancyR"
      ]),
      splitStats: item.splitStats,
      baselineComparison: item.baseline?.comparison,
      walkForward: pickMetrics(item.walkForward, [
        "method",
        "foldCount",
        "positiveFolds",
        "positiveBaselineLiftFolds",
        "positiveOutOfSampleFolds",
        "minFoldExpectancyR"
      ]),
      worstSlices: item.worstSlices
    });
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(item);
  }

  return [...groups.values()].map((items, index) => {
    const representative = items[0];
    return {
      shapeId: `${representative.candidateId}|shape-${index + 1}`,
      candidateId: representative.candidateId,
      family: representative.family,
      idea: representative.idea,
      variantIds: items.map((item) => item.variantId),
      rawSurvivorCount: items.length,
      representativeVariantId: representative.variantId,
      duplicateParameterDifferences: differingParams(items),
      metrics: {
        sample: representative.stats.sample,
        expectancyR: representative.stats.expectancyR,
        profitFactor: representative.stats.profitFactor,
        deflatedSharpe: representative.stats.deflatedSharpe,
        maxDrawdownR: representative.stats.maxDrawdownR,
        outOfSampleSample: representative.splitStats.outOfSample.sample,
        outOfSampleExpectancyR: representative.splitStats.outOfSample.expectancyR,
        baselineExpectancyLiftR: representative.baseline.comparison.expectancyLiftR,
        outOfSampleBaselineLiftR: representative.baseline.comparison.outOfSampleExpectancyLiftR,
        positiveFolds: representative.walkForward.positiveFolds,
        foldCount: representative.walkForward.foldCount,
        positiveBaselineLiftFolds: representative.walkForward.positiveBaselineLiftFolds,
        positiveOutOfSampleFolds: representative.walkForward.positiveOutOfSampleFolds,
        minFoldExpectancyR: representative.walkForward.minFoldExpectancyR
      }
    };
  });
}

function pickMetrics(source, keys) {
  return Object.fromEntries(keys.map((key) => [key, source?.[key]]));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function differingParams(items) {
  const keys = [...new Set(items.flatMap((item) => Object.keys(item.params || {})))].sort();
  const differences = {};
  for (const key of keys) {
    const values = [...new Set(items.map((item) => stableJson(item.params?.[key])))];
    if (values.length > 1) {
      differences[key] = items.map((item) => ({
        variantId: item.variantId,
        value: item.params?.[key]
      }));
    }
  }
  return differences;
}

function renderSurvivorShapeDiagnostics(shapes) {
  if (shapes.length === 0) return ["- Effective survivor shapes: 0"];
  return shapes.flatMap((shape) => [
    `### ${shape.shapeId}`,
    "",
    `Raw survivor variants: ${shape.rawSurvivorCount} (${shape.variantIds.join(", ")})`,
    `Representative variant: ${shape.representativeVariantId}`,
    `Metrics: sample=${shape.metrics.sample}, expectancy=${shape.metrics.expectancyR}R, profitFactor=${shape.metrics.profitFactor}, deflatedSharpe=${shape.metrics.deflatedSharpe}, maxDD=${shape.metrics.maxDrawdownR}R`,
    `Out-of-sample: sample=${shape.metrics.outOfSampleSample}, expectancy=${shape.metrics.outOfSampleExpectancyR}R, baselineLift=${shape.metrics.outOfSampleBaselineLiftR}R`,
    `Walk-forward: positiveFolds=${shape.metrics.positiveFolds}/${shape.metrics.foldCount}, positiveBaselineLiftFolds=${shape.metrics.positiveBaselineLiftFolds}/${shape.metrics.foldCount}, positiveOosFolds=${shape.metrics.positiveOutOfSampleFolds}, minFoldExpectancy=${shape.metrics.minFoldExpectancyR}R`,
    `Duplicate parameter differences: ${formatDuplicateParamDifferences(shape.duplicateParameterDifferences)}`,
    ""
  ]);
}

function summarizeGateGroups(verdicts, survivorShapes, gates) {
  const groups = [
    {
      id: "headline_pass",
      description: "minimum sample, positive expectancy after costs, profit factor, drawdown, and worst-slice gates",
      predicate: (item) =>
        item.stats.sample >= gates.minSample &&
        item.stats.expectancyR >= gates.minExpectancyR &&
        item.stats.profitFactor >= gates.minProfitFactor &&
        item.stats.maxDrawdownR <= gates.maxDrawdownR &&
        item.stats.worstSliceExpectancyR >= gates.maxWorstSliceExpectancyR
    },
    {
      id: "deflated_sharpe_pass",
      description: "approximate multiple-testing deflated-Sharpe proxy clears the configured floor",
      predicate: (item) => item.stats.deflatedSharpe >= gates.minDeflatedSharpe
    },
    {
      id: "oos_pass",
      description: "chronological out-of-sample sample and expectancy gates",
      predicate: (item) =>
        item.splitStats.outOfSample.sample >= gates.minOutOfSampleSample &&
        item.splitStats.outOfSample.expectancyR >= gates.minOutOfSampleExpectancyR
    },
    {
      id: "baseline_pass",
      description: "full-sample and out-of-sample lift versus the time-matched alternating-direction baseline",
      predicate: (item) =>
        item.baseline.comparison.expectancyLiftR >= gates.minBaselineExpectancyLiftR &&
        item.baseline.comparison.outOfSampleExpectancyLiftR >= gates.minBaselineExpectancyLiftR
    },
    {
      id: "walk_forward_pass",
      description: "equal-trade-count walk-forward diagnostics clear positive-fold and diagnostic OOS-fold checks",
      predicate: (item) => walkForwardPasses(item)
    }
  ];

  const diagnostics = {};
  for (const group of groups) {
    diagnostics[group.id] = summarizePredicate(verdicts, group.description, group.predicate);
  }

  diagnostics.psr_diagnostic_band = {
    description: "diagnostic-only probabilistic-Sharpe proxy bands; not a survival gate",
    bands: [
      { id: "lt_0_95", label: "<0.95", predicate: (item) => item.stats.probabilisticSharpe < 0.95 },
      { id: "gte_0_95", label: ">=0.95", predicate: (item) => item.stats.probabilisticSharpe >= 0.95 },
      { id: "gte_0_975", label: ">=0.975", predicate: (item) => item.stats.probabilisticSharpe >= 0.975 },
      { id: "gte_0_99", label: ">=0.99", predicate: (item) => item.stats.probabilisticSharpe >= 0.99 }
    ].map((band) => ({
      id: band.id,
      label: band.label,
      ...summarizePredicate(verdicts, undefined, band.predicate, { includeDescription: false })
    }))
  };

  diagnostics.effective_shape_pass = {
    description: "raw survivors collapsed into effective survivor shapes by identical realized metrics and diagnostics",
    rawSurvivors: verdicts.filter((item) => item.verdict.status === "survived_research_gate").length,
    effectiveSurvivorShapes: survivorShapes.length,
    shapeIds: survivorShapes.map((shape) => shape.shapeId),
    representativeVariantIds: survivorShapes.map((shape) => shape.representativeVariantId)
  };

  return diagnostics;
}

function summarizePredicate(verdicts, description, predicate, options = {}) {
  const passers = verdicts.filter(predicate);
  const rejectedPassers = passers.filter((item) => item.verdict.status === "rejected");
  const survivorPassers = passers.filter((item) => item.verdict.status === "survived_research_gate");
  return {
    ...(options.includeDescription === false ? {} : { description }),
    totalCount: verdicts.length,
    passCount: passers.length,
    rejectedPassCount: rejectedPassers.length,
    survivorPassCount: survivorPassers.length,
    passRate: round(passers.length / Math.max(1, verdicts.length)),
    survivorVariantIds: survivorPassers.map((item) => item.variantId)
  };
}

function walkForwardPasses(item) {
  const folds = item.walkForward?.folds || [];
  const validFolds = folds.filter((fold) => fold.sample > 0);
  const requiredPositiveFolds = Math.ceil(validFolds.length * 0.6);
  const outOfSampleFoldCount = validFolds.length - Math.floor(validFolds.length * 0.7);
  return (
    validFolds.length >= 5 &&
    item.walkForward.positiveFolds >= requiredPositiveFolds &&
    item.walkForward.positiveBaselineLiftFolds >= requiredPositiveFolds &&
    item.walkForward.positiveOutOfSampleFolds >= outOfSampleFoldCount &&
    Number.isFinite(item.walkForward.minFoldExpectancyR)
  );
}

function renderGateGroupDiagnostics(diagnostics) {
  const rows = [
    ["headline_pass", diagnostics.headline_pass],
    ["deflated_sharpe_pass", diagnostics.deflated_sharpe_pass],
    ["oos_pass", diagnostics.oos_pass],
    ["baseline_pass", diagnostics.baseline_pass],
    ["walk_forward_pass", diagnostics.walk_forward_pass]
  ];
  const lines = rows.flatMap(([id, item]) => [
    `- ${id}: ${item.passCount} / ${item.totalCount} pass`,
    `  - Passers: ${item.passCount}; rejected passers: ${item.rejectedPassCount}; survivor passers: ${item.survivorPassCount}; pass rate: ${item.passRate}`,
    `  - Definition: ${item.description}`
  ]);

  lines.push(
    "- psr_diagnostic_band:",
    ...diagnostics.psr_diagnostic_band.bands.map((band) =>
      `  - ${band.label}: passers=${band.passCount}; rejected passers=${band.rejectedPassCount}; survivor passers=${band.survivorPassCount}; pass rate=${band.passRate}`
    ),
    `- effective_shape_pass: raw survivors=${diagnostics.effective_shape_pass.rawSurvivors}; effective survivor shapes=${diagnostics.effective_shape_pass.effectiveSurvivorShapes}; representatives=${diagnostics.effective_shape_pass.representativeVariantIds.join(", ") || "none"}`
  );

  return lines;
}

function summarizeAntiOverfitControls(verdicts, config) {
  const split = config.evaluation?.split ?? {};
  const firstWalkForward = verdicts.find((item) => item.walkForward)?.walkForward;
  return {
    split: {
      method: split.method ?? "unknown",
      inSampleRatio: split.inSampleRatio ?? null
    },
    purgedBoundary: {
      candidateTrades: sum(verdicts, (item) => item.splitMetadata?.purgedBoundaryTrades),
      baselineTrades: sum(verdicts, (item) => item.splitMetadata?.purgedBoundaryBaselineTrades)
    },
    baseline: {
      method: config.evaluation?.baseline?.method ?? "unknown"
    },
    walkForward: {
      method: firstWalkForward?.method ?? "unknown",
      foldCount: firstWalkForward?.foldCount ?? null
    }
  };
}

function sum(items, picker) {
  return items.reduce((total, item) => total + (Number(picker(item)) || 0), 0);
}

function round(value, decimals = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(decimals)) : null;
}

function formatDuplicateParamDifferences(differences) {
  const entries = Object.entries(differences);
  if (entries.length === 0) return "none";
  return entries.map(([key, rows]) => `${key} (${rows.map((row) => `${row.variantId}=${row.value}`).join(", ")})`).join("; ");
}
