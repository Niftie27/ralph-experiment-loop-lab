#!/usr/bin/env node

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

const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
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
    const fetched = await fetchConfiguredCandles(symbolConfigByCode.get(symbol), timeframe);
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
  const runs = btcTimeframes.map((timeframe) => {
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

function spamCandidates() {
  const validation = {
    baseline: "time_matched_alternating_direction",
    gates: ["minSample", "expectancy", "profitFactor", "drawdown", "worstSlice", "outOfSample", "baselineLift", "deflatedSharpe"],
    killCriteria: ["low_sample", "weak_expectancy_after_costs", "weak_profit_factor", "weak_out_of_sample_expectancy", "weak_baseline_lift", "bad_failure_slice", "deflated_sharpe_fail"]
  };
  const dataRequirements = {
    markets: ["spot"],
    requiredFeatures: ["ohlcv", "volume", "rsi", "trend", "volatility"],
    minLookbackDays: 1825
  };

  return [
    {
      id: "spam-btc-volume-breakout-v0",
      idea: "Spam simple BTC volume-confirmed breakouts across 1h/4h to see whether any dumb breakout parameter pocket survives strict gates.",
      family: "spam_breakout",
      rule: "breakout",
      directions: ["long", "short"],
      thesis: thesis("range expansion after participation spike", "breakout direction should beat alternating-direction baseline after costs"),
      dataRequirements,
      validation,
      parameters: {
        symbol: ["BTC"],
        timeframe: ["1h", "4h"],
        lookback: [10, 20, 40],
        volumeZ: [0.2, 0.6, 1.0],
        rsiMinLong: [50, 55],
        rsiMaxShort: [45, 50]
      }
    },
    {
      id: "spam-btc-rsi-fade-v0",
      idea: "Spam BTC RSI mean-reversion fades with trend-strength caps.",
      family: "spam_mean_reversion",
      rule: "rsi_reversion",
      directions: ["long", "short"],
      thesis: thesis("stretched BTC moves can revert when trend strength is muted", "contrarian direction should beat timing baseline after costs"),
      dataRequirements,
      validation,
      parameters: {
        symbol: ["BTC"],
        timeframe: ["1h", "4h"],
        rsiLow: [25, 30, 35],
        rsiHigh: [65, 70, 75],
        maxTrendStrength: [0.005, 0.01, 0.02]
      }
    },
    {
      id: "spam-btc-ma-reclaim-v0",
      idea: "Spam BTC moving-average reclaim/reject continuation variants.",
      family: "spam_trend_pullback",
      rule: "ma_reclaim",
      directions: ["long", "short"],
      thesis: thesis("pullbacks can continue after reclaiming or rejecting a fast moving average", "MA reclaim/reject should survive OOS and baseline-lift gates"),
      dataRequirements,
      validation,
      parameters: {
        symbol: ["BTC"],
        timeframe: ["1h", "4h"],
        fast: [10, 20],
        slow: [50, 100],
        rsiFloorLong: [45, 50],
        rsiCeilShort: [50, 55]
      }
    },
    {
      id: "spam-btc-downshock-fade-v0",
      idea: "Spam BTC downside volume-shock fades.",
      family: "spam_velocity_fade",
      rule: "volume_velocity_fade",
      directions: ["long"],
      thesis: thesis("fast BTC downside shocks can exhaust when volume is already elevated", "down-shock fade should beat matched timestamp baseline after costs"),
      dataRequirements,
      validation,
      parameters: {
        symbol: ["BTC"],
        timeframe: ["1h", "4h"],
        returnLookback: [1, 2],
        minMovePct: [0.5, 0.8, 1.2],
        volumeZ: [0.8, 1.3],
        rsiLow: [35, 45],
        rsiHigh: [55]
      }
    },
    {
      id: "spam-btc-upshock-fade-v0",
      idea: "Spam BTC upside volume-shock fades.",
      family: "spam_velocity_fade",
      rule: "volume_velocity_fade",
      directions: ["short"],
      thesis: thesis("fast BTC upside shocks can exhaust when volume is already elevated", "up-shock fade should beat matched timestamp baseline after costs"),
      dataRequirements,
      validation,
      parameters: {
        symbol: ["BTC"],
        timeframe: ["1h", "4h"],
        returnLookback: [1, 2],
        minMovePct: [0.5, 0.8, 1.2],
        volumeZ: [0.8, 1.3],
        rsiLow: [45],
        rsiHigh: [55, 65]
      }
    },
    {
      id: "spam-alt-btc-gated-ma-reclaim-v0",
      idea: "Spam ETH/SOL continuation after moving-average reclaim/reject, but only when BTC regime explicitly agrees with the alt direction.",
      family: "spam_alt_btc_gated_continuation",
      rule: "ma_reclaim",
      directions: ["long", "short"],
      thesis: thesis("alt continuation has a better prior when BTC regime aligns first", "alt MA reclaim/reject should only count when BTC gate permits the direction"),
      dataRequirements: {
        markets: ["spot"],
        requiredFeatures: ["ohlcv", "rsi", "trend", "btc_regime_gate"],
        minLookbackDays: 1825
      },
      validation,
      parameters: {
        symbol: ["ETH", "SOL"],
        timeframe: ["1h", "4h"],
        fast: [10, 20],
        slow: [50, 100],
        rsiFloorLong: [45, 50],
        rsiCeilShort: [50, 55]
      }
    },
    {
      id: "spam-alt-btc-gated-rsi-fade-v0",
      idea: "Spam ETH/SOL RSI fades only when BTC regime permits the fade direction.",
      family: "spam_alt_btc_gated_fade",
      rule: "rsi_reversion",
      directions: ["long", "short"],
      thesis: thesis("alt mean-reversion is less dangerous when it does not fight BTC regime", "alt RSI fade should survive only after BTC-gated direction filtering"),
      dataRequirements: {
        markets: ["spot"],
        requiredFeatures: ["ohlcv", "rsi", "trend", "btc_regime_gate"],
        minLookbackDays: 1825
      },
      validation,
      parameters: {
        symbol: ["ETH", "SOL"],
        timeframe: ["1h", "4h"],
        rsiLow: [25, 30, 35],
        rsiHigh: [65, 70, 75],
        maxTrendStrength: [0.005, 0.01]
      }
    }
  ];
}

function thesis(mechanism, expectedBehavior) {
  return {
    mechanism,
    edgeSpeed: "hours",
    expectedBehavior,
    falsifiableClaim: "Reject unless the variant survives sample, expectancy, profit-factor, drawdown, worst-slice, out-of-sample, baseline-lift, and deflated-Sharpe gates."
  };
}

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
