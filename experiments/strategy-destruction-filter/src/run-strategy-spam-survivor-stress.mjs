#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { backtestVariant, marketContext, round, summarizeVariantRuns } from "./engine.mjs";
import { fetchConfiguredCandles } from "./market-data.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const RESULTS_DIR = path.join(ROOT, "results");
const SPAM_REPORT_JSON = path.join(RESULTS_DIR, "strategy-spam-funnel-btc-first-pass.json");
const REPORT_JSON = path.join(RESULTS_DIR, "strategy-spam-survivor-stress.json");
const REPORT_MD = path.join(RESULTS_DIR, "strategy-spam-survivor-stress.md");

const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
const spamReport = JSON.parse(await fs.readFile(SPAM_REPORT_JSON, "utf8"));
const survivor = spamReport.survivors?.[0] ?? null;

if (!survivor) {
  const report = {
    generatedAt: new Date().toISOString(),
    status: "research-only-no-spam-survivor-to-stress",
    decision: {
      verdict: "no_survivor",
      candidateImport: false,
      strategyPromotion: false,
      liveOrPaperBehaviorChange: false
    }
  };
  await writeReport(report);
  console.log(JSON.stringify({ ok: true, status: report.status, report: REPORT_JSON }, null, 2));
  process.exit(0);
}

const timeframeId = survivor.params.timeframe;
const baseTimeframe = config.data.timeframes.find((timeframe) => timeframe.id === timeframeId);
if (!baseTimeframe) throw new Error(`missing timeframe config: ${timeframeId}`);

const stressTimeframes = config.data.timeframes.filter((timeframe) => ["1h", "4h"].includes(timeframe.id));
const transferSymbols = ["SOL", "ETH"];
const requiredSymbols = [...new Set(["BTC", survivor.params.symbol, ...transferSymbols])];
const symbolConfigByCode = new Map(config.data.symbols.map((symbol) => [symbol.symbol, symbol]));
const data = new Map();
const sources = [];

for (const symbol of requiredSymbols) {
  const symbolConfig = symbolConfigByCode.get(symbol);
  if (!symbolConfig) throw new Error(`missing symbol config: ${symbol}`);
  for (const timeframe of stressTimeframes) {
    const fetched = await fetchConfiguredCandles(symbolConfig, timeframe);
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

const baseVariant = {
  candidateId: survivor.candidateId,
  variantId: survivor.variantId,
  family: survivor.family,
  idea: survivor.idea,
  thesis: survivor.thesis,
  dataRequirements: survivor.dataRequirements,
  validation: survivor.validation,
  rule: survivor.rule,
  directions: ["long", "short"],
  params: survivor.params
};

const baseCase = evaluateCase({
  id: "base_survivor",
  description: "Original survivor with the same BTC gate used by the spam funnel.",
  variant: baseVariant,
  symbol: survivor.params.symbol,
  timeframe: baseTimeframe,
  config,
  gateMode: "base"
});

const strictBtcGateCase = evaluateCase({
  id: "strict_btc_gate",
  description: "Same SOL 4h variant, but BTC_RISK_ON/OFF requires stronger RSI and MA separation.",
  variant: baseVariant,
  symbol: survivor.params.symbol,
  timeframe: baseTimeframe,
  config,
  gateMode: "strict"
});

const costCases = [
  { id: "double_costs", label: "Double fee and slippage bps", config: costStressConfig(config, 2, 0) },
  { id: "extra_10bps_round_trip", label: "Extra 10 bps round trip", config: costStressConfig(config, 1, 5) },
  { id: "extra_20bps_round_trip", label: "Extra 20 bps round trip", config: costStressConfig(config, 1, 10) }
].map((stress) => evaluateCase({
  id: stress.id,
  description: stress.label,
  variant: baseVariant,
  symbol: survivor.params.symbol,
  timeframe: baseTimeframe,
  config: stress.config,
  gateMode: "base"
}));

const transferCases = [
  ...transferSymbols.map((symbol) => ({ symbol, timeframe: baseTimeframe })),
  ...stressTimeframes
    .filter((timeframe) => timeframe.id !== baseTimeframe.id)
    .map((timeframe) => ({ symbol: survivor.params.symbol, timeframe }))
].filter(({ symbol, timeframe }) => !(symbol === survivor.params.symbol && timeframe.id === baseTimeframe.id))
  .map(({ symbol, timeframe }) => {
  const variant = {
    ...baseVariant,
    variantId: `${baseVariant.variantId}__transfer_${symbol}_${timeframe.id}`,
    params: { ...baseVariant.params, symbol, timeframe: timeframe.id }
  };
  return evaluateCase({
    id: `transfer_${symbol}_${timeframe.id}`,
    description: `Same MA reclaim/reject params on ${symbol} ${timeframe.id}.`,
    variant,
    symbol,
    timeframe,
    config,
    gateMode: symbol === "BTC" ? "none" : "base"
  });
});

const baseTrades = baseCase.run.trades;
const stress = {
  byDirection: groupTrades(baseTrades, (trade) => trade.direction),
  byMonth: groupTrades(baseTrades, (trade) => monthOfSeconds(trade.entryTime)),
  byWeek: groupTrades(baseTrades, (trade) => weekOfSeconds(trade.entryTime)),
  byExitReason: groupTrades(baseTrades, (trade) => trade.exitReason),
  byRegime: groupTrades(baseTrades, (trade) => trade.regime),
  removeBestDirection: removeBestGroup(baseTrades, (trade) => trade.direction, "remove_best_direction"),
  removeBestMonth: removeBestGroup(baseTrades, (trade) => monthOfSeconds(trade.entryTime), "remove_best_month"),
  removeBestWeek: removeBestGroup(baseTrades, (trade) => weekOfSeconds(trade.entryTime), "remove_best_week"),
  worstLossRuns: worstLossRuns(baseTrades)
};

const allCases = [baseCase, strictBtcGateCase, ...costCases, ...transferCases];
const decision = decide({ baseCase, strictBtcGateCase, costCases, transferCases, stress });
const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-strategy-spam-survivor-stress",
  purpose: "stress-test-the-single-strategy-spam-survivor-before-any-candidate-import-or-recurring-wiring",
  sourceReport: path.relative(ROOT, SPAM_REPORT_JSON),
  decision,
  boundary: {
    candidateImport: false,
    strategyPromotion: false,
    liveOrPaperBehaviorChange: false,
    schedulerOrCronChange: false,
    note: "Stress output is research-only. It does not edit seed-strategies.json or any scheduler/autoresearch loop."
  },
  survivor: {
    variantId: survivor.variantId,
    candidateId: survivor.candidateId,
    family: survivor.family,
    rule: survivor.rule,
    params: survivor.params,
    originalStats: survivor.stats,
    originalSplitStats: survivor.splitStats,
    originalBaselineComparison: survivor.baseline?.comparison
  },
  sources,
  cases: allCases.map(publicCase),
  stress,
  limitations: [
    "This reruns candle-level public OHLCV backtests only; it does not model order book queueing, funding, margin, live fills, or exchange outages.",
    "The survivor came from a spam search, so multiple-testing and selection bias remain material even when a stress row passes.",
    "Symbol-transfer checks use the same simple MA reclaim/reject params, not a newly optimized symbol-specific strategy.",
    "BTC gate classification is a coarse candle-level regime proxy, not full TA/orderflow confirmation."
  ]
};

await writeReport(report);
console.log(JSON.stringify({
  ok: true,
  status: report.status,
  verdict: report.decision.verdict,
  base: report.cases.find((item) => item.id === "base_survivor")?.summary,
  strictBtcGate: report.cases.find((item) => item.id === "strict_btc_gate")?.summary,
  report: REPORT_JSON
}, null, 2));

function evaluateCase({ id, description, variant, symbol, timeframe, config, gateMode }) {
  const candles = data.get(dataKey(symbol, timeframe.id));
  const gateDiagnostics = freshGateDiagnostics(symbol, timeframe.id, gateMode);
  const run = backtestVariant(variant, candles, symbol, timeframe, config, {
    signalGate: gateMode === "none" ? null : btcGateFor(symbol, timeframe, gateMode, gateDiagnostics)
  });
  const summary = summarizeVariantRuns([run], 1, config.gates);
  return {
    id,
    description,
    symbol,
    timeframe: timeframe.id,
    gateMode,
    run,
    summary,
    gateDiagnostics
  };
}

function btcGateFor(symbol, timeframe, mode, diagnostics) {
  if (symbol === "BTC") return null;
  const btcCandles = data.get(dataKey("BTC", timeframe.id)) || [];
  const btcIndexByTime = new Map(btcCandles.map((candle, index) => [candle.time, index]));
  return ({ candles, index, signal }) => {
    diagnostics.checkedSignals += 1;
    const btcIndex = btcIndexByTime.get(candles[index]?.time);
    const regime = classifyBtcRegime(btcCandles, btcIndex, mode);
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

function classifyBtcRegime(candles, index, mode) {
  if (!Number.isInteger(index)) return "BTC_STALE";
  const ctx = marketContext(candles, index);
  if (!ctx) return "BTC_STALE";
  if (mode === "strict") {
    if (ctx.close > ctx.ma50 && ctx.ma20 > ctx.ma50 && ctx.rsi14 >= 55 && ctx.trendStrength >= 0.0025) return "BTC_RISK_ON";
    if (ctx.close < ctx.ma50 && ctx.ma20 < ctx.ma50 && ctx.rsi14 <= 45 && ctx.trendStrength >= 0.0025) return "BTC_RISK_OFF";
    return "BTC_TRANSITION";
  }
  if (ctx.close > ctx.ma50 && ctx.ma20 > ctx.ma50 && ctx.rsi14 >= 50) return "BTC_RISK_ON";
  if (ctx.close < ctx.ma50 && ctx.ma20 < ctx.ma50 && ctx.rsi14 <= 50) return "BTC_RISK_OFF";
  return "BTC_TRANSITION";
}

function freshGateDiagnostics(symbol, timeframe, mode) {
  return {
    symbol,
    timeframe,
    mode,
    checkedSignals: 0,
    passedSignals: 0,
    blockedSignals: 0,
    regimes: { BTC_RISK_ON: 0, BTC_RISK_OFF: 0, BTC_TRANSITION: 0, BTC_STALE: 0 },
    passByDirection: { long: 0, short: 0 },
    blockByDirection: { long: 0, short: 0 }
  };
}

function costStressConfig(baseConfig, multiplier, extraBpsPerSide) {
  return {
    ...baseConfig,
    costs: {
      feeBpsPerSide: baseConfig.costs.feeBpsPerSide * multiplier + extraBpsPerSide,
      slippageBpsPerSide: baseConfig.costs.slippageBpsPerSide * multiplier
    }
  };
}

function summarizeTrades(trades) {
  const sample = trades.length;
  const returns = trades.map((trade) => trade.netR);
  const wins = returns.filter((value) => value > 0);
  const losses = returns.filter((value) => value < 0);
  const grossWins = wins.reduce((sum, value) => sum + value, 0);
  const grossLosses = Math.abs(losses.reduce((sum, value) => sum + value, 0));
  const totalNetR = returns.reduce((sum, value) => sum + value, 0);
  let equity = 0;
  let peak = 0;
  let maxDrawdownR = 0;
  for (const value of returns) {
    equity += value;
    peak = Math.max(peak, equity);
    maxDrawdownR = Math.max(maxDrawdownR, peak - equity);
  }
  return {
    sample,
    winRate: sample ? round(wins.length / sample) : null,
    expectancyR: sample ? round(totalNetR / sample) : null,
    totalNetR: round(totalNetR),
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses) : grossWins > 0 ? Infinity : null,
    maxDrawdownR: round(maxDrawdownR)
  };
}

function groupTrades(trades, keyFn) {
  const groups = new Map();
  for (const trade of trades) {
    const key = keyFn(trade) ?? "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(trade);
  }
  return [...groups.entries()]
    .map(([key, rows]) => ({ key, ...summarizeTrades(rows) }))
    .sort((a, b) => (b.totalNetR ?? -Infinity) - (a.totalNetR ?? -Infinity) || b.sample - a.sample);
}

function removeBestGroup(trades, keyFn, label) {
  const groups = groupTrades(trades, keyFn);
  const best = groups[0] ?? null;
  const remainder = best ? trades.filter((trade) => keyFn(trade) !== best.key) : trades;
  return {
    label,
    removedKey: best?.key ?? null,
    removed: best,
    remainder: summarizeTrades(remainder)
  };
}

function worstLossRuns(trades) {
  const sorted = [...trades].sort((a, b) => a.entryTime - b.entryTime || a.exitTime - b.exitTime);
  const runs = [];
  let current = null;
  for (const trade of sorted) {
    if (trade.netR <= 0) {
      if (!current) {
        current = { start: trade.entryTime, end: trade.exitTime, trades: 0, netR: 0, directions: new Set(), regimes: new Set() };
      }
      current.end = trade.exitTime;
      current.trades += 1;
      current.netR += trade.netR;
      current.directions.add(trade.direction);
      current.regimes.add(trade.regime);
    } else if (current) {
      runs.push(current);
      current = null;
    }
  }
  if (current) runs.push(current);
  return runs
    .map((run) => ({
      start: isoFromSeconds(run.start),
      end: isoFromSeconds(run.end),
      trades: run.trades,
      netR: round(run.netR),
      directions: [...run.directions].sort(),
      regimes: [...run.regimes].sort()
    }))
    .sort((a, b) => a.netR - b.netR)
    .slice(0, 5);
}

function decide({ baseCase, strictBtcGateCase, costCases, transferCases, stress }) {
  const failures = [];
  if (baseCase.summary.verdict.status !== "survived_research_gate") failures.push("base_no_longer_survives");
  if (strictBtcGateCase.summary.verdict.status !== "survived_research_gate") failures.push("strict_btc_gate_rejects");
  for (const costCase of costCases) {
    if (costCase.summary.verdict.status !== "survived_research_gate") failures.push(`${costCase.id}_rejects`);
  }
  if ((stress.removeBestWeek.remainder.expectancyR ?? -Infinity) <= 0) failures.push("best_week_concentration");
  if ((stress.removeBestMonth.remainder.expectancyR ?? -Infinity) <= 0) failures.push("best_month_concentration");
  if ((stress.removeBestDirection.remainder.expectancyR ?? -Infinity) <= 0) failures.push("direction_concentration");
  const sameParamsTransferPasses = transferCases.filter((item) => item.summary.verdict.status === "survived_research_gate");
  if (!sameParamsTransferPasses.length) failures.push("no_symbol_or_timeframe_transfer");

  const verdict = failures.length
    ? "watch_only_survivor_stress_failed"
    : "survivor_stress_passed_manual_review_required";
  return {
    verdict,
    failures,
    candidateImport: false,
    strategyPromotion: false,
    liveOrPaperBehaviorChange: false,
    schedulerOrCronChange: false,
    recurringLaneDecision: "do_not_wire_recurring_until_survivor_stress_is_reviewed",
    interpretation: verdict === "watch_only_survivor_stress_failed"
      ? "The spam survivor is still useful as a falsification target, but the stress pass found fragility. Keep it out of curated candidates and do not wire recurring promotion behavior around it."
      : "The spam survivor passed this cheap stress pass, but it still came from a parameter spam search. Manual review and an independent forward/fresh sample remain required before candidate import or recurring-lane promotion behavior."
  };
}

function publicCase(item) {
  return {
    id: item.id,
    description: item.description,
    symbol: item.symbol,
    timeframe: item.timeframe,
    gateMode: item.gateMode,
    gateDiagnostics: item.gateDiagnostics,
    summary: {
      status: item.summary.verdict.status,
      failures: item.summary.verdict.failures,
      stats: item.summary.stats,
      splitStats: item.summary.splitStats,
      baselineComparison: item.summary.baseline.comparison,
      walkForward: item.summary.walkForward
    }
  };
}

async function writeReport(report) {
  await fs.mkdir(RESULTS_DIR, { recursive: true });
  await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  await fs.writeFile(REPORT_MD, renderMarkdown(report));
}

function renderMarkdown(report) {
  const lines = [
    "# Strategy Spam Survivor Stress",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    "Research-only stress pass for the single strategy-spam survivor. This does not import candidates, promote strategies, alter live/paper/demo behavior, or change schedulers.",
    "",
    "## Decision",
    "",
    `- Verdict: ${report.decision.verdict}`,
    `- Failures: ${report.decision.failures.join(", ") || "none"}`,
    `- Candidate import: ${report.decision.candidateImport}`,
    `- Strategy promotion: ${report.decision.strategyPromotion}`,
    `- Scheduler/cron change: ${report.decision.schedulerOrCronChange}`,
    `- Recurring lane decision: ${report.decision.recurringLaneDecision}`,
    `- Interpretation: ${report.decision.interpretation}`,
    "",
    "## Survivor",
    "",
    `- Variant: ${report.survivor.variantId}`,
    `- Rule: ${report.survivor.rule}`,
    `- Params: ${JSON.stringify(report.survivor.params)}`,
    "",
    "## Cases",
    "",
    ...report.cases.map(renderCaseRow),
    "",
    "## Base Splits",
    "",
    "### Direction",
    "",
    ...renderGroupRows(report.stress.byDirection),
    "",
    "### Month",
    "",
    ...renderGroupRows(report.stress.byMonth.slice(0, 12)),
    "",
    "### Week",
    "",
    ...renderGroupRows(report.stress.byWeek.slice(0, 12)),
    "",
    "### Regime",
    "",
    ...renderGroupRows(report.stress.byRegime),
    "",
    "## Remove-Best Stresses",
    "",
    renderRemoval(report.stress.removeBestDirection),
    renderRemoval(report.stress.removeBestMonth),
    renderRemoval(report.stress.removeBestWeek),
    "",
    "## Worst Loss Runs",
    "",
    ...(report.stress.worstLossRuns.length
      ? report.stress.worstLossRuns.map((run) => `- ${run.start} to ${run.end}: trades=${run.trades}, net=${fmt(run.netR)}R, directions=${run.directions.join("/")}, regimes=${run.regimes.join(";")}`)
      : ["- None."]),
    "",
    "## Boundary",
    "",
    report.boundary.note,
    "",
    "## Limitations",
    "",
    ...report.limitations.map((item) => `- ${item}`),
    ""
  ];
  return `${lines.join("\n")}\n`;
}

function renderCaseRow(item) {
  return `- ${item.id}: ${item.summary.status}; failures=${item.summary.failures.join(", ") || "none"}; sample=${item.summary.stats.sample}; exp=${fmt(item.summary.stats.expectancyR)}R; PF=${fmt(item.summary.stats.profitFactor)}; OOS=${fmt(item.summary.splitStats.outOfSample.expectancyR)}R; lift=${fmt(item.summary.baselineComparison.expectancyLiftR)}R; DD=${fmt(item.summary.stats.maxDrawdownR)}R`;
}

function renderGroupRows(rows) {
  if (!rows.length) return ["- None."];
  return rows.map((row) => `- ${row.key}: sample=${row.sample}, exp=${fmt(row.expectancyR)}R, total=${fmt(row.totalNetR)}R, PF=${fmt(row.profitFactor)}, DD=${fmt(row.maxDrawdownR)}R`);
}

function renderRemoval(row) {
  return `- ${row.label}: removed=${row.removedKey}, removedTotal=${fmt(row.removed?.totalNetR)}R, remainderSample=${row.remainder.sample}, remainderExp=${fmt(row.remainder.expectancyR)}R, remainderTotal=${fmt(row.remainder.totalNetR)}R`;
}

function monthOfSeconds(seconds) {
  return isoFromSeconds(seconds)?.slice(0, 7) ?? "unknown";
}

function weekOfSeconds(seconds) {
  const iso = isoFromSeconds(seconds);
  if (!iso) return "unknown";
  const date = new Date(iso);
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp - yearStart) / 86_400_000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function dataKey(symbol, timeframeId) {
  return `${symbol}:${timeframeId}`;
}

function fmt(value) {
  return Number.isFinite(value) ? String(round(value, 4)) : "n/a";
}

function isoFromSeconds(seconds) {
  return Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : null;
}
