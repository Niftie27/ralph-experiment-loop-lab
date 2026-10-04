import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  cartesianProduct,
  expandCandidate,
  splitIndexForCandles,
  splitLabelForEntryIndex,
  splitBoundaryBars,
  rollingReturnPct,
  baselineSignalFor,
  backtestVariant,
  marketContext,
  signalForVariant,
  statsForTrades,
  probabilisticSharpeDiagnostic,
  walkForwardDiagnostics,
  verdictForEvaluation,
  verdictForStats,
  simulateTrade
} from "../src/engine.mjs";
import { parseBybitKlines } from "../src/market-data.mjs";
import {
  buildFeatureRows,
  extremeBuckets,
  percentile,
  rsiBuckets,
  summarizeForwardReturns
} from "../src/feature-study.mjs";
import { validateCandidateSet, validateCandidateSpec } from "../src/candidate-spec.mjs";

test("cartesianProduct expands parameter grids deterministically", () => {
  assert.deepEqual(cartesianProduct({ a: [1, 2], b: ["x", "y"] }), [
    { a: 1, b: "x" },
    { a: 1, b: "y" },
    { a: 2, b: "x" },
    { a: 2, b: "y" }
  ]);
});

test("expandCandidate preserves identity and variant ids", () => {
  const variants = expandCandidate({
    id: "idea-a",
    family: "test",
    idea: "test idea",
    rule: "breakout",
    directions: ["long"],
    parameters: { lookback: [10, 20] }
  });
  assert.equal(variants.length, 2);
  assert.equal(variants[0].candidateId, "idea-a");
  assert.equal(variants[1].variantId, "idea-a#2");
});

test("simulateTrade applies stop-first collision and costs", () => {
  const candles = [
    { time: 1, open: 100, high: 101, low: 99, close: 100, volume: 10 },
    { time: 2, open: 100, high: 104, low: 98, close: 101, volume: 10 }
  ];
  const trade = simulateTrade(
    candles,
    0,
    { direction: "long", reason: "test" },
    { atr14: 1, trend: "range", volatility: "mid-vol" },
    { maxBars: 1 },
    {
      risk: { stopAtr: 1, targetR: 2 },
      costs: { feeBpsPerSide: 5, slippageBpsPerSide: 5 }
    }
  );
  assert.equal(trade.exitReason, "stop-first-collision");
  assert.equal(trade.rawR, -1);
  assert.ok(trade.netR < -1);
});

test("statsForTrades penalizes broad parameter searches", () => {
  const trades = Array.from({ length: 100 }, (_, index) => ({
    netR: index % 2 === 0 ? 0.7 : -0.3,
    costR: 0.04,
    regime: index < 50 ? "up|mid-vol" : "range|mid-vol"
  }));
  const lowTrials = statsForTrades(trades, 1);
  const highTrials = statsForTrades(trades, 100);
  assert.ok(lowTrials.deflatedSharpe > highTrials.deflatedSharpe);
  assert.equal(lowTrials.deflatedSharpeCalibration.label, "approximate_multiple_testing_deflated_sharpe");
  assert.equal(highTrials.deflatedSharpeCalibration.implementation, "approximate_proxy");
  assert.equal(lowTrials.probabilisticSharpeCalibration.label, "diagnostic_probabilistic_sharpe_proxy");
});

test("probabilisticSharpeDiagnostic compares trade Sharpe to a matched baseline", () => {
  const strategy = Array.from({ length: 80 }, (_, index) => (index % 4 === 0 ? -0.35 : 0.22));
  const weakBaseline = Array.from({ length: 80 }, (_, index) => (index % 2 === 0 ? 0.05 : -0.08));
  const strongBaseline = Array.from({ length: 80 }, (_, index) => (index % 4 === 0 ? -0.2 : 0.28));

  const beatsWeak = probabilisticSharpeDiagnostic(strategy, weakBaseline);
  const trailsStrong = probabilisticSharpeDiagnostic(strategy, strongBaseline);

  assert.ok(beatsWeak.probability > 0.95);
  assert.ok(trailsStrong.probability < 0.5);
  assert.ok(Number.isFinite(beatsWeak.skewness));
  assert.ok(Number.isFinite(beatsWeak.kurtosis));
});

test("splitIndexForCandles creates a deterministic chronological split", () => {
  const candles = Array.from({ length: 100 }, (_, index) => ({ close: index + 1 }));
  assert.equal(splitIndexForCandles(candles, { inSampleRatio: 0.7 }), 70);
  assert.equal(splitIndexForCandles(candles, { inSampleRatio: 2 }), 95);
  assert.equal(splitIndexForCandles(candles, { inSampleRatio: -1 }), 5);
});

test("splitLabelForEntryIndex applies purged and embargo boundary around split", () => {
  const timeframe = { id: "1h", maxBars: 4 };
  const splitConfig = { method: "purged_embargo_entry_time", inSampleRatio: 0.7 };

  assert.deepEqual(splitBoundaryBars(timeframe, { ...splitConfig, purgeBars: 1, embargoBars: 2 }), {
    purgeBars: 4,
    embargoBars: 4,
    labelHorizonBars: 4
  });
  assert.equal(splitLabelForEntryIndex(65, 70, timeframe, splitConfig), "in_sample");
  assert.equal(splitLabelForEntryIndex(66, 70, timeframe, splitConfig), "purged_boundary");
  assert.equal(splitLabelForEntryIndex(73, 70, timeframe, splitConfig), "purged_boundary");
  assert.equal(splitLabelForEntryIndex(74, 70, timeframe, splitConfig), "out_of_sample");
  assert.equal(splitLabelForEntryIndex(69, 70, timeframe, { method: "chronological_entry_time" }), "in_sample");
  assert.equal(splitLabelForEntryIndex(70, 70, timeframe, { method: "chronological_entry_time" }), "out_of_sample");
});

test("baselineSignalFor alternates direction without using strategy direction", () => {
  assert.deepEqual(baselineSignalFor(10, 0), {
    direction: "long",
    reason: "time-matched-alternating-direction-baseline"
  });
  assert.equal(baselineSignalFor(10, 1).direction, "short");
});

test("verdictForEvaluation adds out-of-sample and baseline-lift failures", () => {
  const verdict = verdictForEvaluation(
    {
      sample: 120,
      expectancyR: 0.2,
      profitFactor: 1.5,
      deflatedSharpe: 1.2,
      maxDrawdownR: 8,
      worstSliceExpectancyR: 0.1
    },
    {
      inSample: { sample: 100, expectancyR: 0.2 },
      outOfSample: { sample: 20, expectancyR: -0.1 }
    },
    { expectancyLiftR: -0.02, outOfSampleExpectancyLiftR: -0.03 },
    {
      minSample: 80,
      minExpectancyR: 0.05,
      minProfitFactor: 1.15,
      minDeflatedSharpe: 0.35,
      maxDrawdownR: 18,
      maxWorstSliceExpectancyR: -0.25,
      minOutOfSampleSample: 30,
      minOutOfSampleExpectancyR: 0.01,
      minBaselineExpectancyLiftR: 0.01
    }
  );
  assert.equal(verdict.status, "rejected");
  assert.deepEqual(verdict.failures, [
    "low_out_of_sample_sample",
    "weak_out_of_sample_expectancy",
    "weak_baseline_lift",
    "weak_out_of_sample_baseline_lift"
  ]);
});

test("verdictForEvaluation rejects full-sample baseline lift that fails out-of-sample lift", () => {
  const verdict = verdictForEvaluation(
    {
      sample: 120,
      expectancyR: 0.2,
      profitFactor: 1.5,
      deflatedSharpe: 1.2,
      maxDrawdownR: 8,
      worstSliceExpectancyR: 0.1
    },
    {
      inSample: { sample: 90, expectancyR: 0.2 },
      outOfSample: { sample: 30, expectancyR: 0.08 }
    },
    { expectancyLiftR: 0.05, outOfSampleExpectancyLiftR: -0.02 },
    {
      minSample: 80,
      minExpectancyR: 0.05,
      minProfitFactor: 1.15,
      minDeflatedSharpe: 0.35,
      maxDrawdownR: 18,
      maxWorstSliceExpectancyR: -0.25,
      minOutOfSampleSample: 20,
      minOutOfSampleExpectancyR: 0.01,
      minBaselineExpectancyLiftR: 0.01
    }
  );
  assert.equal(verdict.status, "rejected");
  assert.deepEqual(verdict.failures, ["weak_out_of_sample_baseline_lift"]);
});

test("verdictForStats rejects weak failure slices even with headline edge", () => {
  const verdict = verdictForStats(
    {
      sample: 120,
      expectancyR: 0.2,
      profitFactor: 1.5,
      deflatedSharpe: 1.2,
      maxDrawdownR: 8,
      worstSliceExpectancyR: -0.8
    },
    {
      minSample: 80,
      minExpectancyR: 0.05,
      minProfitFactor: 1.15,
      minDeflatedSharpe: 0.35,
      maxDrawdownR: 18,
      maxWorstSliceExpectancyR: -0.25
    }
  );
  assert.equal(verdict.status, "rejected");
  assert.deepEqual(verdict.failures, ["bad_failure_slice"]);
});

test("parseBybitKlines normalizes newest-first Bybit rows", () => {
  assert.deepEqual(parseBybitKlines([
    ["1787371200000", "82.16", "82.51", "80.74", "81.47", "342323.55", "27902537.0206"]
  ]), [{
    time: 1787371200,
    open: 82.16,
    high: 82.51,
    low: 80.74,
    close: 81.47,
    volume: 342323.55
  }]);
});

test("funding_oi_reversion only signals with perp context", () => {
  const candles = Array.from({ length: 80 }, (_, index) => ({
    time: index,
    open: 100 + index * 0.2,
    high: 101 + index * 0.2,
    low: 99 + index * 0.2,
    close: 100 + index * 0.2,
    volume: 100 + index,
    fundingRate: 0.00012,
    openInterest: 1000 + index * 20,
    openInterestChangePct: 1
  }));
  const ctx = marketContext(candles, 79);
  const signals = signalForVariant({
    rule: "funding_oi_reversion",
    directions: ["short"],
    params: {
      minPositiveFunding: 0.00008,
      maxNegativeFunding: -0.00002,
      minOpenInterestChangePct: 0.5,
      rsiLow: 32,
      rsiHigh: 68
    }
  }, candles, 79, ctx);

  assert.equal(signals.length, 1);
  assert.equal(signals[0].direction, "short");
});

test("funding_reversion can test funding-only fades without open interest", () => {
  const candles = Array.from({ length: 80 }, (_, index) => ({
    time: index,
    open: 100 + index * 0.2,
    high: 101 + index * 0.2,
    low: 99 + index * 0.2,
    close: 100 + index * 0.2,
    volume: 100 + index,
    fundingRate: 0.0003
  }));
  const ctx = marketContext(candles, 79);
  const signals = signalForVariant({
    rule: "funding_reversion",
    directions: ["short"],
    params: {
      minPositiveFunding: 0.00025,
      maxNegativeFunding: -0.00008,
      rsiLow: 35,
      rsiHigh: 65
    }
  }, candles, 79, ctx);

  assert.equal(signals.length, 1);
  assert.equal(signals[0].reason, "stretched-positive-funding-rsi-fade");
});

test("volume_velocity_fade signals contrarian entries after large high-volume moves", () => {
  const candles = Array.from({ length: 90 }, (_, index) => ({
    time: index,
    open: 100 - index * 0.05,
    high: 101 - index * 0.05,
    low: 99 - index * 0.05,
    close: 100 - index * 0.05,
    volume: 100
  }));
  candles[89] = { time: 89, open: 96, high: 96.5, low: 90, close: 90, volume: 1000 };
  const ctx = marketContext(candles, 89);
  const signals = signalForVariant({
    rule: "volume_velocity_fade",
    directions: ["long"],
    params: {
      returnLookback: 1,
      minMovePct: 1,
      volumeZ: 2,
      rsiLow: 45,
      rsiHigh: 55
    }
  }, candles, 89, ctx);

  assert.ok(rollingReturnPct(candles, 89, 1) < -1);
  assert.equal(signals.length, 1);
  assert.equal(signals[0].reason, "volume-velocity-down-shock-fade");
});

test("funding_reversion_trend only signals in the requested trend regime", () => {
  const candles = Array.from({ length: 80 }, (_, index) => ({
    time: index,
    open: 100 + index * 0.2,
    high: 101 + index * 0.2,
    low: 99 + index * 0.2,
    close: 100 + index * 0.2,
    volume: 100 + index,
    fundingRate: 0.0003
  }));
  const ctx = marketContext(candles, 79);
  assert.equal(ctx.trend, "up");

  const baseVariant = {
    rule: "funding_reversion_trend",
    directions: ["short"],
    params: {
      minPositiveFunding: 0.00025,
      maxNegativeFunding: -0.00008,
      rsiLow: 35,
      rsiHigh: 65
    }
  };

  assert.equal(signalForVariant({ ...baseVariant, params: { ...baseVariant.params, trend: "up" } }, candles, 79, ctx).length, 1);
  assert.equal(signalForVariant({ ...baseVariant, params: { ...baseVariant.params, trend: "range" } }, candles, 79, ctx).length, 0);
});

test("timeframe-scoped variants skip non-matching backtest runs", () => {
  const candles = Array.from({ length: 90 }, (_, index) => ({
    time: index,
    open: 100 + index * 0.2,
    high: 101 + index * 0.2,
    low: 99 + index * 0.2,
    close: 100 + index * 0.2,
    volume: 100 + index,
    fundingRate: 0.0003
  }));
  const variant = {
    variantId: "tf#1",
    candidateId: "tf",
    family: "test",
    idea: "test",
    rule: "funding_reversion_trend_timeframe",
    directions: ["short"],
    params: {
      minPositiveFunding: 0.00025,
      maxNegativeFunding: -0.00008,
      rsiLow: 35,
      rsiHigh: 65,
      trend: "up",
      timeframe: "1h"
    }
  };
  const run = backtestVariant(variant, candles, "HYPE", { id: "4h", maxBars: 12 }, {
    evaluation: { split: { method: "purged_embargo_entry_time", inSampleRatio: 0.7 } },
    risk: { stopAtr: 1.2, targetR: 1.8 },
    costs: { feeBpsPerSide: 4, slippageBpsPerSide: 3 }
  });

  assert.equal(run.trades.length, 0);
  assert.equal(run.baselineTrades.length, 0);
});

test("backtestVariant excludes purged boundary trades from candidate and baseline metrics", () => {
  const candles = Array.from({ length: 100 }, (_, index) => ({
    time: index,
    open: 100,
    high: 102,
    low: 99,
    close: 100 + (index >= 60 ? index * 0.05 : 0),
    volume: 100 + index
  }));
  const variant = {
    variantId: "boundary#1",
    candidateId: "boundary",
    family: "test",
    idea: "test",
    rule: "breakout",
    directions: ["long"],
    params: {
      lookback: 20,
      volumeZ: -10,
      rsiMinLong: 0,
      rsiMaxShort: 100
    }
  };
  const run = backtestVariant(variant, candles, "BTC", { id: "1h", maxBars: 4 }, {
    evaluation: { split: { method: "purged_embargo_entry_time", inSampleRatio: 0.7 } },
    risk: { stopAtr: 1.2, targetR: 1.8 },
    costs: { feeBpsPerSide: 4, slippageBpsPerSide: 3 }
  });

  assert.ok(run.purgedBoundaryTrades.length > 0);
  assert.equal(run.purgedBoundaryTrades.length, run.purgedBoundaryBaselineTrades.length);
  assert.equal(run.trades.some((trade) => trade.split === "purged_boundary"), false);
  assert.equal(run.baselineTrades.some((trade) => trade.split === "purged_boundary"), false);
});

test("generic symbol and regime filters narrow candidate backtests", () => {
  const candles = Array.from({ length: 90 }, (_, index) => ({
    time: index,
    open: 100 + index * 0.2,
    high: 101 + index * 0.2,
    low: 99 + index * 0.2,
    close: 100 + index * 0.2,
    volume: 100 + index
  }));
  const variant = {
    variantId: "filtered-breakout#1",
    candidateId: "filtered-breakout",
    family: "test",
    idea: "test",
    rule: "breakout",
    directions: ["long"],
    params: {
      symbol: "XRP",
      timeframe: "4h",
      trend: "up",
      volatility: "mid-vol",
      lookback: 20,
      volumeZ: -10,
      rsiMinLong: 50,
      rsiMaxShort: 50
    }
  };
  const config = {
    evaluation: { split: { inSampleRatio: 0.7 } },
    risk: { stopAtr: 1.2, targetR: 1.8 },
    costs: { feeBpsPerSide: 4, slippageBpsPerSide: 3 }
  };

  assert.equal(backtestVariant(variant, candles, "SOL", { id: "4h", maxBars: 12 }, config).trades.length, 0);
  assert.equal(backtestVariant(variant, candles, "XRP", { id: "1h", maxBars: 24 }, config).trades.length, 0);

  const context = marketContext(candles, 89);
  assert.equal(signalForVariant({ ...variant, params: { ...variant.params, volatility: "high-vol" } }, candles, 89, context).length, 0);
});

test("walkForwardDiagnostics reports chronological fold stability", () => {
  const trades = Array.from({ length: 10 }, (_, index) => ({
    entryTime: index,
    netR: index < 6 ? 0.25 : -0.5,
    costR: 0.01,
    regime: "range|mid-vol"
  }));
  const baselineTrades = trades.map((trade, index) => ({
    ...trade,
    netR: index % 2 === 0 ? 0.05 : -0.05
  }));
  const diagnostics = walkForwardDiagnostics(trades, baselineTrades, 1, { minOutOfSampleExpectancyR: 0.01 }, 5);

  assert.equal(diagnostics.folds.length, 5);
  assert.equal(diagnostics.positiveFolds, 3);
  assert.equal(diagnostics.positiveOutOfSampleFolds, 0);
  assert.ok(diagnostics.minFoldExpectancyR < 0);
});

test("validateCandidateSpec accepts funding_reversion parameter grids", () => {
  const errors = validateCandidateSpec({
    id: "funding-only-test-v0",
    idea: "fade stretched funding",
    family: "perp_context_reversion",
    rule: "funding_reversion",
    directions: ["short"],
    thesis: {
      mechanism: "crowded perp funding can mean-revert",
      edgeSpeed: "hours",
      expectedBehavior: "funding fade beats baseline",
      falsifiableClaim: "reject if baseline or OOS fails"
    },
    dataRequirements: {
      markets: ["linear_perpetual"],
      requiredFeatures: ["ohlcv", "fundingRate", "rsi"],
      minLookbackDays: 365
    },
    validation: {
      baseline: "time_matched_alternating_direction",
      gates: ["outOfSample"],
      killCriteria: ["weak_out_of_sample_expectancy"]
    },
    parameters: {
      minPositiveFunding: [0.00025],
      maxNegativeFunding: [-0.00008],
      rsiLow: [35],
      rsiHigh: [65]
    }
  });

  assert.deepEqual(errors, []);
});

test("validateCandidateSpec accepts volume velocity fade parameter grids", () => {
  const errors = validateCandidateSpec({
    id: "eth-volume-velocity-fade-v0",
    idea: "Fade high-volume ETH down shocks.",
    family: "alert_feedback_velocity",
    rule: "volume_velocity_fade",
    directions: ["long"],
    thesis: {
      mechanism: "clean alert-feedback rows suggest some high-evidence ETH velocity down shocks revert",
      edgeSpeed: "hours",
      expectedBehavior: "contrarian entries beat matched timestamps after costs",
      falsifiableClaim: "reject if the historical proxy fails OOS or baseline lift"
    },
    dataRequirements: {
      markets: ["spot"],
      requiredFeatures: ["ohlcv", "volume", "rsi"],
      minLookbackDays: 365
    },
    validation: {
      baseline: "time_matched_alternating_direction",
      gates: ["outOfSample"],
      killCriteria: ["weak_out_of_sample_expectancy"]
    },
    parameters: {
      symbol: ["ETH"],
      timeframe: ["1h"],
      returnLookback: [1],
      minMovePct: [0.65],
      volumeZ: [1.5],
      rsiLow: [45],
      rsiHigh: [55]
    }
  });

  assert.deepEqual(errors, []);
});

test("percentile interpolates sorted and unsorted numeric samples", () => {
  assert.equal(percentile([10, 0, 20], 0.5), 10);
  assert.equal(percentile([0, 10], 0.25), 2.5);
  assert.equal(percentile([], 0.5), null);
});

test("summarizeForwardReturns reports signed fade direction", () => {
  const rows = [
    { forwardReturnsPct: { 1: 2, 3: -1 } },
    { forwardReturnsPct: { 1: -4, 3: -2 } }
  ];
  const summary = summarizeForwardReturns(rows, [1, 3], "short");
  assert.equal(summary[1].meanPct, -1);
  assert.equal(summary[1].signedMeanPct, 1);
  assert.equal(summary[3].signedPositiveRate, 1);
});

test("buildFeatureRows creates forward-return feature rows with market context", () => {
  const candles = Array.from({ length: 90 }, (_, index) => ({
    time: index,
    open: 100 + index,
    high: 101 + index,
    low: 99 + index,
    close: 100 + index,
    volume: 100 + index,
    fundingRate: 0.0001,
    openInterest: 1000 + index * 10,
    openInterestChangePct: 0.5
  }));
  const rows = buildFeatureRows(candles, { id: "1h" }, { horizons: [1, 3] });
  assert.ok(rows.length > 0);
  assert.equal(rows[0].time, 60);
  assert.equal(rows[0].fundingRate, 0.0001);
  assert.ok(Number.isFinite(rows[0].forwardReturnsPct[3]));
});

test("extremeBuckets and rsiBuckets produce comparable feature diagnostics", () => {
  const rows = Array.from({ length: 100 }, (_, index) => ({
    regime: index < 50 ? "up|mid-vol" : "down|high-vol",
    fundingRate: (index - 50) / 100000,
    rsi14: index,
    forwardReturnsPct: { 1: index < 50 ? 1 : -1 }
  }));
  const fundingBuckets = extremeBuckets(rows, "fundingRate", [1], { signedLow: "long", signedHigh: "short" });
  const baselineBuckets = rsiBuckets(rows, [1]);
  assert.equal(fundingBuckets.length, 4);
  assert.ok(fundingBuckets.some((bucket) => bucket.id === "fundingRate_top_5" && bucket.forward[1].signedDirection === "short"));
  assert.ok(baselineBuckets.some((bucket) => bucket.id === "rsi_overbought_70" && bucket.forward[1].signedDirection === "short"));
});

test("validateCandidateSpec requires thesis, data requirements, validation, and rule parameters", () => {
  const errors = validateCandidateSpec({
    id: "bad",
    idea: "too vague",
    family: "test",
    rule: "breakout",
    directions: ["long"],
    parameters: { lookback: [20] }
  });
  assert.ok(errors.includes("id must be kebab-case and end in -vN"));
  assert.ok(errors.includes("parameters.volumeZ must be a non-empty array"));
  assert.ok(errors.includes("thesis must be an object"));
  assert.ok(errors.includes("dataRequirements must be an object"));
  assert.ok(errors.includes("validation must be an object"));
});

test("validateCandidateSet accepts complete candidate specs and rejects duplicate ids", () => {
  const candidate = {
    id: "complete-breakout-v0",
    idea: "Trade only explicit breakouts with participation.",
    family: "trend_breakout",
    rule: "breakout",
    directions: ["long", "short"],
    thesis: {
      mechanism: "range resolution",
      edgeSpeed: "hours",
      expectedBehavior: "direction beats matched timestamps",
      falsifiableClaim: "reject if OOS fails"
    },
    dataRequirements: {
      markets: ["spot"],
      requiredFeatures: ["ohlcv", "volume"],
      minLookbackDays: 365
    },
    validation: {
      baseline: "time_matched_alternating_direction",
      gates: ["outOfSample"],
      killCriteria: ["weak_out_of_sample_expectancy"]
    },
    parameters: {
      lookback: [20],
      volumeZ: [0.5],
      rsiMinLong: [54],
      rsiMaxShort: [46]
    }
  };
  assert.equal(validateCandidateSet([candidate]).ok, true);
  const duplicate = validateCandidateSet([candidate, candidate]);
  assert.equal(duplicate.ok, false);
  assert.ok(duplicate.errors.some((error) => error.includes("duplicate id")));
});

test("validateCandidateSpec accepts optional symbol, timeframe, trend, and volatility filters", () => {
  const errors = validateCandidateSpec({
    id: "xrp-range-breakout-v0",
    idea: "Trade XRP four-hour range breakouts only in up and mid-vol regimes.",
    family: "alert_edge_breakout",
    rule: "breakout",
    directions: ["long"],
    thesis: {
      mechanism: "alert-edge bucket suggested range breakouts work best in this symbol and regime",
      edgeSpeed: "hours",
      expectedBehavior: "filtered breakout beats matched timestamps",
      falsifiableClaim: "reject if OOS or baseline lift fails"
    },
    dataRequirements: {
      markets: ["spot"],
      requiredFeatures: ["ohlcv", "volume", "trend", "volatility"],
      minLookbackDays: 365
    },
    validation: {
      baseline: "time_matched_alternating_direction",
      gates: ["outOfSample"],
      killCriteria: ["weak_out_of_sample_expectancy"]
    },
    parameters: {
      symbol: ["XRP"],
      timeframe: ["4h"],
      trend: ["up"],
      volatility: ["mid-vol"],
      lookback: [20],
      volumeZ: [0.5],
      rsiMinLong: [54],
      rsiMaxShort: [46]
    }
  });

  assert.deepEqual(errors, []);
});

test("signal decisions are stable after truncating warmup history", () => {
  const candles = Array.from({ length: 180 }, (_, index) => {
    const wave = Math.sin(index / 5);
    const close = 100 + index * 0.03 + wave * 2;
    return {
      time: index,
      open: close - 0.2,
      high: close + 0.8,
      low: close - 0.8,
      close,
      volume: 100 + (index % 17) * 8,
      fundingRate: index % 2 === 0 ? 0.0003 : -0.0001,
      openInterest: 1000 + index * 5,
      openInterestChangePct: 0.8
    };
  });

  for (const index of [90, 120, 150]) {
    candles[index] = {
      ...candles[index],
      open: candles[index - 1].close,
      high: candles[index - 1].close + 9,
      low: candles[index - 1].close - 1,
      close: candles[index - 1].close + 8,
      volume: 1200
    };
  }

  const variants = [
    {
      rule: "breakout",
      directions: ["long", "short"],
      params: { lookback: 20, volumeZ: 0.5, rsiMinLong: 0, rsiMaxShort: 100 }
    },
    {
      rule: "rsi_reversion",
      directions: ["long", "short"],
      params: { rsiLow: 100, rsiHigh: 0, maxTrendStrength: 1 }
    },
    {
      rule: "ma_reclaim",
      directions: ["long", "short"],
      params: { fast: 20, slow: 50, rsiFloorLong: 0, rsiCeilShort: 100 }
    },
    {
      rule: "funding_reversion",
      directions: ["long", "short"],
      params: { minPositiveFunding: 0.0002, maxNegativeFunding: -0.00005, rsiLow: 100, rsiHigh: 0 }
    },
    {
      rule: "volume_velocity_fade",
      directions: ["long", "short"],
      params: { returnLookback: 1, minMovePct: 0.5, volumeZ: 0.5, rsiLow: 100, rsiHigh: 0 }
    }
  ];

  const truncated = candles.slice(25);
  const comparableStartTime = truncated[60].time;

  for (const variant of variants) {
    const fullSignals = collectSignalDecisions(variant, candles).filter((signal) => signal.time >= comparableStartTime);
    const truncatedSignals = collectSignalDecisions(variant, truncated);
    assert.ok(fullSignals.length > 0, `${variant.rule} should produce comparable signals`);
    assert.deepEqual(truncatedSignals, fullSignals, `${variant.rule} changed after warmup truncation`);
  }
});

test("signal path source avoids explicit future candle access", () => {
  const source = fs.readFileSync(new URL("../src/engine.mjs", import.meta.url), "utf8");
  const signalPathFunctions = [
    "sma",
    "rollingHigh",
    "rollingLow",
    "rsi",
    "atr",
    "volumeZ",
    "rollingReturnPct",
    "marketContext",
    "signalForVariant"
  ];
  const forbiddenPatterns = [
    {
      name: "direct future index lookup",
      pattern: /\bcandles\s*\[\s*(?:index|i)\s*\+/u
    },
    {
      name: "future .at lookup",
      pattern: /\bcandles\s*\.\s*at\s*\(\s*(?:index|i)\s*\+/u
    },
    {
      name: "future loop start",
      pattern: /for\s*\([^)]*=\s*(?:index|i)\s*\+/u
    },
    {
      name: "whole-series candle aggregation",
      pattern: /\bcandles\s*\.\s*(?:map|filter|reduce|forEach|find|some|every)\s*\(/u
    }
  ];

  for (const functionName of signalPathFunctions) {
    const body = exportedFunctionSource(source, functionName);
    for (const { name, pattern } of forbiddenPatterns) {
      assert.equal(pattern.test(body), false, `${functionName} uses ${name}`);
    }
  }
});

function collectSignalDecisions(variant, candles) {
  const decisions = [];
  for (let index = 60; index < candles.length - 2; index += 1) {
    const ctx = marketContext(candles, index);
    if (!ctx) continue;
    for (const signal of signalForVariant(variant, candles, index, ctx)) {
      decisions.push({
        time: candles[index].time,
        direction: signal.direction,
        reason: signal.reason
      });
    }
  }
  return decisions;
}

function exportedFunctionSource(source, functionName) {
  const signature = `export function ${functionName}`;
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `missing ${signature}`);
  const openBrace = source.indexOf("{", start);
  assert.notEqual(openBrace, -1, `missing body for ${signature}`);

  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  assert.fail(`unterminated body for ${signature}`);
}
