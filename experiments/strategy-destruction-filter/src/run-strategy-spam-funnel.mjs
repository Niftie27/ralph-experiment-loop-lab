#!/usr/bin/env node

import { spamCandidates } from "./spam-candidates.mjs";
import { researchConfig } from "./research-queue.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { validateCandidateSet } from "./candidate-spec.mjs";
import { backtestVariant, expandCandidate, marketContext, round, summarizeVariantRuns } from "./engine.mjs";
import { fetchConfiguredCandles } from "./market-data.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON = path.join(RESULTS_DIR, "strategy-spam-funnel-btc-first-pass.json");
const REPORT_MD = path.join(RESULTS_DIR, "strategy-spam-funnel-btc-first-pass.md");

const config = researchConfig(JSON.parse(await fs.readFile(CONFIG_PATH, "utf8")));
const btcSymbol = config.data.symbols.find((symbol) => symbol.symbol === "BTC");
if (!btcSymbol) throw new Error("BTC symbol missing from config");

const runProfile = strategySpamRunProfile();
const batchManifest = strategySpamBatchManifest();
const candidates = filterCandidatesForProfile(spamCandidates(), runProfile);
const validation = validateCandidateSet(candidates);
if (!validation.ok) {
  throw new Error(`spam candidate validation failed:\n${validation.errors.join("\n")}`);
}

const variants = candidates.flatMap(expandCandidate);
const btcTimeframes = config.data.timeframes.filter((timeframe) => ["1h", "4h"].includes(timeframe.id));
const symbolConfigByCode = new Map(config.data.symbols.map((symbol) => [symbol.symbol, symbol]));
const requiredSymbols = [...new Set(variants.map((variant) => variant.params.symbol).filter(Boolean))];
for (const symbol of requiredSymbols) {
  if (!symbolConfigByCode.has(symbol)) throw new Error(`missing symbol config for spam symbol: ${symbol}`);
}
const data = new Map();
const sources = [];
for (const symbol of requiredSymbols) {
  for (const timeframe of btcTimeframes) {
    const fetched = await fetchConfiguredCandles(symbolConfigByCode.get(symbol), timeframe, config);
    data.set(dataKey(symbol, timeframe.id), fetched.candles);
    sources.push({
      symbol,
      timeframe: timeframe.id,
      candles: fetched.candles.length,
      firstCandleTime: isoFromSeconds(fetched.candles[0]?.time),
      lastCandleTime: isoFromSeconds(fetched.candles.at(-1)?.time),
      source: fetched.meta.source,
      market: fetched.meta.market
    });
  }
}

const btcIndexByTimeframe = new Map(
  btcTimeframes.map((timeframe) => [
    timeframe.id,
    new Map((data.get(dataKey("BTC", timeframe.id)) || []).map((candle, index) => [candle.time, index]))
  ])
);
const btcGateDiagnostics = {};
const trialCount = Math.max(config.multipleTesting?.familyPenaltyFloor || 1, variants.length);
const verdicts = variants.map((variant) => {
  const symbol = variant.params.symbol;
  const runs = btcTimeframes.filter(t => !variant.params.timeframe || t.id === variant.params.timeframe).map((timeframe) => {
    const candles = data.get(dataKey(symbol, timeframe.id));
    return backtestVariant(variant, candles, symbol, timeframe, config, {
      signalGate: symbol === "BTC" ? null : btcGateFor(symbol, timeframe)
    });
  });
  return summarizeVariantRuns(runs, trialCount, config.gates);
}).sort((a, b) => {
  if (a.verdict.status !== b.verdict.status) return a.verdict.status === "survived_research_gate" ? -1 : 1;
  return (b.stats.deflatedSharpe ?? -Infinity) - (a.stats.deflatedSharpe ?? -Infinity);
});

const survivors = verdicts.filter((item) => item.verdict.status === "survived_research_gate");
const rejected = verdicts.filter((item) => item.verdict.status === "rejected");
const nearMisses = rejected
  .filter((item) => (item.stats.sample ?? 0) >= config.gates.minSample)
  .filter((item) => (item.stats.expectancyR ?? -Infinity) > -0.05 || (item.baseline?.comparison?.expectancyLiftR ?? -Infinity) > 0)
  .slice(0, 10);
const effectiveShapeDiagnostics = summarizeEffectiveShapes(verdicts);

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-strategy-spam-funnel-no-promotion",
  purpose: "cheap-high-throughput-hypothesis-spam-before-curated-candidate-promotion",
  runProfile,
  decision: {
    verdict: survivors.length ? "survivors_require_manual_review_before_candidate_import" : "no_survivors_rejected_batch",
    candidateImport: false,
    strategyPromotion: false,
    liveOrPaperBehaviorChange: false,
    note: "This batch intentionally stays outside seed-strategies.json. Survivors, if any, require manual review before becoming curated candidates."
  },
  batchManifest,
  sources,
  gates: config.gates,
  btcGate: {
    requiredForAltSignals: true,
    allowedRegimes: {
      long: ["BTC_RISK_ON"],
      short: ["BTC_RISK_OFF"]
    },
    blockedRegimes: ["BTC_TRANSITION", "BTC_STALE"],
    diagnostics: btcGateDiagnostics
  },
  effectiveShapeDiagnostics,
  totals: {
    candidates: candidates.length,
    variants: variants.length,
    survivors: survivors.length,
    rejected: rejected.length,
    nearMisses: nearMisses.length,
    effectiveMetricShapes: effectiveShapeDiagnostics.totalEffectiveShapes,
    duplicateMetricShapes: effectiveShapeDiagnostics.duplicateShapeGroups.length,
    duplicateVariantRows: effectiveShapeDiagnostics.duplicateVariantRows
  },
  candidates: candidates.map((candidate) => ({
    id: candidate.id,
    family: candidate.family,
    rule: candidate.rule,
    idea: candidate.idea
  })),
  survivors,
  nearMisses,
  verdicts
};

await fs.mkdir(RESULTS_DIR, { recursive: true });
await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
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
    "# Strategy Spam Funnel First Pass",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    "Research-only high-throughput first-pass strategy spam over public candles. BTC is tested directly; alt rows are allowed only through an explicit BTC regime gate. This does not import candidates into `seed-strategies.json`, change live alerts, change paper/demo behavior, change schedules, handle keys/accounts, or promote a strategy.",
    "",
    "## Decision",
    "",
    `- Verdict: ${report.decision.verdict}`,
    `- Candidate import: ${report.decision.candidateImport}`,
    `- Strategy promotion: ${report.decision.strategyPromotion}`,
    `- Live/paper behavior change: ${report.decision.liveOrPaperBehaviorChange}`,
    `- Note: ${report.decision.note}`,
    "",
    "## Totals",
    "",
    `- Candidate families: ${report.totals.candidates}`,
    `- Variants tested: ${report.totals.variants}`,
    `- Survivors: ${report.totals.survivors}`,
    `- Rejected: ${report.totals.rejected}`,
    `- Near misses: ${report.totals.nearMisses}`,
    `- Effective metric shapes: ${report.totals.effectiveMetricShapes}`,
    `- Duplicate metric shapes: ${report.totals.duplicateMetricShapes}`,
    `- Duplicate variant rows: ${report.totals.duplicateVariantRows}`,
    "",
    "## Batch Manifest",
    "",
    ...report.batchManifest.modes.map((mode) => `- ${mode.id}: ${mode.status}; ${mode.scope}`),
    "",
    "## BTC Gate",
    "",
    `- Required for alt signals: ${report.btcGate.requiredForAltSignals}`,
    `- Alt long allowed BTC regimes: ${report.btcGate.allowedRegimes.long.join(", ")}`,
    `- Alt short allowed BTC regimes: ${report.btcGate.allowedRegimes.short.join(", ")}`,
    `- Blocked BTC regimes: ${report.btcGate.blockedRegimes.join(", ")}`,
    "",
    ...renderBtcGateDiagnostics(report.btcGate.diagnostics),
    "",
    "## Effective Shape Dedupe",
    "",
    ...(report.effectiveShapeDiagnostics.duplicateShapeGroups.length
      ? report.effectiveShapeDiagnostics.duplicateShapeGroups.slice(0, 10).map((group) => `- size=${group.size}; representative=${group.representative}; variants=${group.variantIds.slice(0, 8).join(", ")}${group.variantIds.length > 8 ? ", ..." : ""}`)
      : ["- No duplicate metric-shapes detected."]),
    "",
    "## Sources",
    "",
    ...report.sources.map((source) => `- ${source.symbol} ${source.timeframe}: ${source.candles} candles, ${source.firstCandleTime} to ${source.lastCandleTime}, source=${source.source}, market=${source.market}`),
    "",
    "## Families",
    "",
    ...report.candidates.map((candidate) => `- ${candidate.id}: ${candidate.family}, rule=${candidate.rule}; ${candidate.idea}`),
    "",
    "## Top Verdicts",
    "",
    ...report.verdicts.slice(0, 15).map(renderVerdictRow),
    "",
    "## Near Misses",
    "",
    ...(report.nearMisses.length ? report.nearMisses.map(renderVerdictRow) : ["- None."]),
    "",
    "## Boundary",
    "",
    "No live trading, orders, keys, paid APIs, account setup, wallet connection, scheduler/cron change, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, candidate import, or strategy promotion changed.",
    ""
  ];
  return `${lines.join("\n")}\n`;
}

function renderVerdictRow(item) {
  return `- ${item.variantId}: ${item.verdict.status}; failures=${item.verdict.failures.join(", ") || "none"}; sample=${item.stats.sample}, exp=${fmt(item.stats.expectancyR)}R, PF=${fmt(item.stats.profitFactor)}, OOS=${fmt(item.splitStats.outOfSample.expectancyR)}R, lift=${fmt(item.baseline.comparison.expectancyLiftR)}R, DD=${fmt(item.stats.maxDrawdownR)}R`;
}

function strategySpamBatchManifest() {
  return {
    activeModeIds: ["btc_basic_spam", "alt_btc_gated_continuation_fade"],
    modes: [
      {
        id: "btc_basic_spam",
        status: "active_in_this_run",
        scope: "BTC-only breakout, mean-reversion, MA reclaim/reject, and volume-shock fade parameter spam."
      },
      {
        id: "alt_btc_gated_continuation_fade",
        status: "active_in_this_run",
        scope: "ETH/SOL spot-candle continuation/fade spam with BTC_RISK_ON/BTC_RISK_OFF direction gating."
      },
      {
        id: "source_inspired_grid_dca_mm",
        status: "manifest_only_not_run",
        scope: "Source-inspired grid/DCA/MM claims require a specific source prior and separate inventory/fee controls before testing."
      },
      {
        id: "funding_basis_public",
        status: "manifest_only_not_run",
        scope: "Public funding/basis spam should use linear-perp data and stay separated from spot-candle batches."
      }
    ]
  };
}

function strategySpamRunProfile() {
  const profile = process.env.STRATEGY_SPAM_PROFILE || "manual_full";
  const recurringCandidateIds = [
    "spam-btc-volume-breakout-v0",
    "spam-btc-rsi-fade-v0",
    "spam-btc-ma-reclaim-v0",
    "spam-alt-btc-gated-ma-reclaim-v0"
  ];
  return {
    profile,
    recurringCandidateIds,
    recurringMaxVariants: 300,
    note: profile === "recurring"
      ? "Recurring profile keeps one bounded BTC+BTC-gated-alt batch under the target 100-300 variant budget."
      : "Manual profile runs the full current spam surface for research cleanup and stress-discovery."
  };
}

function filterCandidatesForProfile(candidates, runProfile) {
  if (runProfile.profile !== "recurring") return candidates;
  const allowed = new Set(runProfile.recurringCandidateIds);
  const filtered = candidates.filter((candidate) => allowed.has(candidate.id));
  const variantCount = filtered.flatMap(expandCandidate).length;
  if (variantCount > runProfile.recurringMaxVariants) {
    throw new Error(`recurring strategy spam profile exceeds variant budget: ${variantCount} > ${runProfile.recurringMaxVariants}`);
  }
  return filtered;
}

function btcGateFor(symbol, timeframe) {
  const key = `${symbol}:${timeframe.id}`;
  btcGateDiagnostics[key] ||= {
    symbol,
    timeframe: timeframe.id,
    checkedSignals: 0,
    passedSignals: 0,
    blockedSignals: 0,
    regimes: { BTC_RISK_ON: 0, BTC_RISK_OFF: 0, BTC_TRANSITION: 0, BTC_STALE: 0 },
    passByDirection: { long: 0, short: 0 },
    blockByDirection: { long: 0, short: 0 }
  };
  const diagnostics = btcGateDiagnostics[key];
  const btcCandles = data.get(dataKey("BTC", timeframe.id)) || [];
  const btcIndexByTime = btcIndexByTimeframe.get(timeframe.id) || new Map();

  return ({ candles, index, signal }) => {
    diagnostics.checkedSignals += 1;
    const btcIndex = btcIndexByTime.get(candles[index]?.time);
    const regime = classifyBtcRegime(btcCandles, btcIndex);
    diagnostics.regimes[regime] = (diagnostics.regimes[regime] || 0) + 1;
    const pass =
      (signal.direction === "long" && regime === "BTC_RISK_ON") ||
      (signal.direction === "short" && regime === "BTC_RISK_OFF");
    if (pass) {
      diagnostics.passedSignals += 1;
      diagnostics.passByDirection[signal.direction] += 1;
    } else {
      diagnostics.blockedSignals += 1;
      diagnostics.blockByDirection[signal.direction] += 1;
    }
    return pass;
  };
}

function classifyBtcRegime(candles, index) {
  if (!Number.isInteger(index)) return "BTC_STALE";
  const ctx = marketContext(candles, index);
  if (!ctx) return "BTC_STALE";
  if (ctx.close > ctx.ma50 && ctx.ma20 > ctx.ma50 && ctx.rsi14 >= 50) return "BTC_RISK_ON";
  if (ctx.close < ctx.ma50 && ctx.ma20 < ctx.ma50 && ctx.rsi14 <= 50) return "BTC_RISK_OFF";
  return "BTC_TRANSITION";
}

function summarizeEffectiveShapes(items) {
  const groups = new Map();
  for (const item of items) {
    const key = metricShapeKey(item);
    const group = groups.get(key) || { key, variantIds: [], representative: item.variantId };
    group.variantIds.push(item.variantId);
    groups.set(key, group);
  }
  const duplicateShapeGroups = [...groups.values()]
    .filter((group) => group.variantIds.length > 1)
    .map((group) => ({
      representative: group.representative,
      size: group.variantIds.length,
      variantIds: group.variantIds
    }))
    .sort((a, b) => b.size - a.size || a.representative.localeCompare(b.representative));
  return {
    method: "exact_rounded_metric_signature_excluding_variant_id_and_params",
    totalEffectiveShapes: groups.size,
    duplicateShapeGroups,
    duplicateVariantRows: duplicateShapeGroups.reduce((sum, group) => sum + group.size - 1, 0)
  };
}

function metricShapeKey(item) {
  return JSON.stringify({
    family: item.family,
    rule: item.rule,
    status: item.verdict.status,
    failures: item.verdict.failures,
    sample: item.stats.sample,
    expectancyR: item.stats.expectancyR,
    profitFactor: item.stats.profitFactor,
    deflatedSharpe: item.stats.deflatedSharpe,
    oosExpectancyR: item.splitStats.outOfSample.expectancyR,
    baselineLiftR: item.baseline.comparison.expectancyLiftR,
    maxDrawdownR: item.stats.maxDrawdownR,
    worstSliceExpectancyR: item.stats.worstSliceExpectancyR,
    minFoldExpectancyR: item.walkForward?.minFoldExpectancyR
  });
}

function renderBtcGateDiagnostics(diagnostics) {
  const rows = Object.values(diagnostics);
  if (!rows.length) return ["- No alt BTC-gated signals were evaluated."];
  return rows.map((row) =>
    `- ${row.symbol} ${row.timeframe}: checked=${row.checkedSignals}, passed=${row.passedSignals}, blocked=${row.blockedSignals}, regimes=${Object.entries(row.regimes).map(([key, value]) => `${key}:${value}`).join(" ")}`
  );
}

function fmt(value) {
  return Number.isFinite(value) ? String(round(value, 4)) : "n/a";
}

function dataKey(symbol, timeframeId) {
  return `${symbol}:${timeframeId}`;
}

function isoFromSeconds(seconds) {
  return Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : null;
}
