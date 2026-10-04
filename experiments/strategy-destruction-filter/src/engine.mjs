export function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

const DEFLATED_SHARPE_LABEL = "approximate_multiple_testing_deflated_sharpe";
const DEFLATED_SHARPE_NOTE =
  "Research-only proxy: subtracts a trial-count penalty from observed trade Sharpe; useful for rejecting overfit variants, not a full institutional Deflated Sharpe Ratio implementation.";
const PROBABILISTIC_SHARPE_LABEL = "diagnostic_probabilistic_sharpe_proxy";
const PROBABILISTIC_SHARPE_NOTE =
  "Diagnostic-only PSR-style proxy: estimates probability that trade Sharpe exceeds the matched baseline Sharpe while accounting for sample length, skew, and kurtosis; not a survival gate.";

export function cartesianProduct(parameters) {
  const entries = Object.entries(parameters || {});
  if (!entries.length) return [{}];
  return entries.reduce(
    (rows, [key, values]) =>
      rows.flatMap((row) => (Array.isArray(values) ? values : [values]).map((value) => ({ ...row, [key]: value }))),
    [{}]
  );
}

export function expandCandidate(candidate) {
  return cartesianProduct(candidate.parameters).map((params, index) => ({
    candidateId: candidate.id,
    family: candidate.family,
    idea: candidate.idea,
    thesis: candidate.thesis,
    dataRequirements: candidate.dataRequirements,
    validation: candidate.validation,
    rule: candidate.rule,
    directions: candidate.directions || ["long", "short"],
    variantId: `${candidate.id}#${index + 1}`,
    params
  }));
}

export function sma(candles, index, period, key = "close") {
  if (index + 1 < period) return null;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) sum += candles[i][key];
  return sum / period;
}

export function rollingHigh(candles, index, period) {
  if (index - period < 0) return null;
  let high = -Infinity;
  for (let i = index - period; i < index; i += 1) high = Math.max(high, candles[i].high);
  return high;
}

export function rollingLow(candles, index, period) {
  if (index - period < 0) return null;
  let low = Infinity;
  for (let i = index - period; i < index; i += 1) low = Math.min(low, candles[i].low);
  return low;
}

export function rsi(candles, index, period = 14) {
  if (index < period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = index - period + 1; i <= index; i += 1) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function atr(candles, index, period = 14) {
  if (index < period) return null;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i += 1) {
    const prevClose = candles[i - 1].close;
    sum += Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - prevClose),
      Math.abs(candles[i].low - prevClose)
    );
  }
  return sum / period;
}

export function volumeZ(candles, index, period = 30) {
  if (index + 1 < period) return null;
  const values = [];
  for (let i = index - period + 1; i <= index; i += 1) values.push(candles[i].volume);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const sd = Math.sqrt(variance);
  return sd > 0 ? (candles[index].volume - mean) / sd : 0;
}

export function rollingReturnPct(candles, index, period) {
  if (index - period < 0) return null;
  const previousClose = candles[index - period].close;
  if (!Number.isFinite(previousClose) || previousClose <= 0) return null;
  return (candles[index].close - previousClose) / previousClose * 100;
}

export function marketContext(candles, index) {
  const close = candles[index].close;
  const ma20 = sma(candles, index, 20);
  const ma50 = sma(candles, index, 50);
  const atr14 = atr(candles, index, 14);
  const rsi14 = rsi(candles, index, 14);
  const volZ = volumeZ(candles, index, 30);
  if (!ma20 || !ma50 || !atr14 || rsi14 === null || volZ === null) return null;

  const trend =
    close > ma50 && ma20 > ma50 ? "up" :
    close < ma50 && ma20 < ma50 ? "down" :
    "range";
  const atrPct = atr14 / close;
  const volatility = atrPct > 0.025 ? "high-vol" : atrPct < 0.01 ? "low-vol" : "mid-vol";
  const trendStrength = Math.abs(ma20 - ma50) / close;
  return {
    close,
    ma20,
    ma50,
    atr14,
    rsi14,
    volZ,
    trend,
    volatility,
    trendStrength,
    fundingRate: Number.isFinite(candles[index].fundingRate) ? candles[index].fundingRate : null,
    openInterest: Number.isFinite(candles[index].openInterest) ? candles[index].openInterest : null,
    openInterestChangePct: Number.isFinite(candles[index].openInterestChangePct) ? candles[index].openInterestChangePct : null
  };
}

export function signalForVariant(variant, candles, index, ctx) {
  const candle = candles[index];
  const prev = candles[index - 1];
  const params = variant.params;
  const signals = [];

  if (params.trend && ctx.trend !== params.trend) return signals;
  if (params.volatility && ctx.volatility !== params.volatility) return signals;

  if (variant.rule === "breakout") {
    const high = rollingHigh(candles, index, params.lookback);
    const low = rollingLow(candles, index, params.lookback);
    if (variant.directions.includes("long") && high && candle.close > high && ctx.volZ >= params.volumeZ && ctx.rsi14 >= params.rsiMinLong) {
      signals.push({ direction: "long", reason: "range-breakout-volume" });
    }
    if (variant.directions.includes("short") && low && candle.close < low && ctx.volZ >= params.volumeZ && ctx.rsi14 <= params.rsiMaxShort) {
      signals.push({ direction: "short", reason: "range-breakdown-volume" });
    }
  }

  if (variant.rule === "rsi_reversion" && ctx.trendStrength <= params.maxTrendStrength) {
    if (variant.directions.includes("long") && ctx.rsi14 <= params.rsiLow && candle.close > candle.open) {
      signals.push({ direction: "long", reason: "oversold-reversal" });
    }
    if (variant.directions.includes("short") && ctx.rsi14 >= params.rsiHigh && candle.close < candle.open) {
      signals.push({ direction: "short", reason: "overbought-reversal" });
    }
  }

  if (variant.rule === "ma_reclaim") {
    const fast = sma(candles, index, params.fast);
    const slow = sma(candles, index, params.slow);
    if (!fast || !slow) return signals;
    if (variant.directions.includes("long") && fast > slow && prev.close < fast && candle.close > fast && ctx.rsi14 >= params.rsiFloorLong) {
      signals.push({ direction: "long", reason: "fast-ma-reclaim" });
    }
    if (variant.directions.includes("short") && fast < slow && prev.close > fast && candle.close < fast && ctx.rsi14 <= params.rsiCeilShort) {
      signals.push({ direction: "short", reason: "fast-ma-reject" });
    }
  }

  if (variant.rule === "funding_oi_reversion") {
    if (ctx.fundingRate === null || ctx.openInterestChangePct === null) return signals;
    if (
      variant.directions.includes("short") &&
      ctx.fundingRate >= params.minPositiveFunding &&
      ctx.openInterestChangePct >= params.minOpenInterestChangePct &&
      ctx.rsi14 >= params.rsiHigh
    ) {
      signals.push({ direction: "short", reason: "crowded-positive-funding-oi-rsi-fade" });
    }
    if (
      variant.directions.includes("long") &&
      ctx.fundingRate <= params.maxNegativeFunding &&
      ctx.openInterestChangePct >= params.minOpenInterestChangePct &&
      ctx.rsi14 <= params.rsiLow
    ) {
      signals.push({ direction: "long", reason: "crowded-negative-funding-oi-rsi-fade" });
    }
  }

  if (
    variant.rule === "funding_reversion" ||
    variant.rule === "funding_reversion_trend" ||
    variant.rule === "funding_reversion_trend_timeframe"
  ) {
    if (ctx.fundingRate === null) return signals;
    if (
      variant.directions.includes("short") &&
      ctx.fundingRate >= params.minPositiveFunding &&
      ctx.rsi14 >= params.rsiHigh
    ) {
      signals.push({ direction: "short", reason: "stretched-positive-funding-rsi-fade" });
    }
    if (
      variant.directions.includes("long") &&
      ctx.fundingRate <= params.maxNegativeFunding &&
      ctx.rsi14 <= params.rsiLow
    ) {
      signals.push({ direction: "long", reason: "stretched-negative-funding-rsi-fade" });
    }
  }

  if (variant.rule === "volume_velocity_fade") {
    const movePct = rollingReturnPct(candles, index, params.returnLookback);
    if (movePct === null || ctx.volZ < params.volumeZ) return signals;
    if (variant.directions.includes("long") && movePct <= -params.minMovePct && ctx.rsi14 <= params.rsiLow) {
      signals.push({ direction: "long", reason: "volume-velocity-down-shock-fade" });
    }
    if (variant.directions.includes("short") && movePct >= params.minMovePct && ctx.rsi14 >= params.rsiHigh) {
      signals.push({ direction: "short", reason: "volume-velocity-up-shock-fade" });
    }
  }

  return signals;
}

export function splitIndexForCandles(candles, splitConfig = {}) {
  const ratio = splitConfig.inSampleRatio ?? 0.7;
  const boundedRatio = Math.min(0.95, Math.max(0.05, ratio));
  return Math.max(1, Math.min(candles.length - 2, Math.floor(candles.length * boundedRatio)));
}

export function splitMethod(splitConfig = {}) {
  return splitConfig.method ?? "chronological_entry_time";
}

export function splitBoundaryBars(timeframe, splitConfig = {}) {
  const labelHorizonBars = Math.max(0, timeframe.maxBars ?? 0);
  const configuredPurgeBars = splitConfig.purgeBars ?? labelHorizonBars;
  const configuredEmbargoBars = splitConfig.embargoBars ?? labelHorizonBars;
  return {
    purgeBars: Math.max(labelHorizonBars, configuredPurgeBars),
    embargoBars: Math.max(labelHorizonBars, configuredEmbargoBars),
    labelHorizonBars
  };
}

export function splitLabelForEntryIndex(entryIndex, splitIndex, timeframe, splitConfig = {}) {
  if (splitMethod(splitConfig) !== "purged_embargo_entry_time") {
    return entryIndex < splitIndex ? "in_sample" : "out_of_sample";
  }
  const { purgeBars, embargoBars } = splitBoundaryBars(timeframe, splitConfig);
  if (entryIndex < splitIndex - purgeBars) return "in_sample";
  if (entryIndex >= splitIndex + embargoBars) return "out_of_sample";
  return "purged_boundary";
}

function splitSummary(candles, splitIndex, timeframe, splitConfig = {}) {
  const { purgeBars, embargoBars, labelHorizonBars } = splitBoundaryBars(timeframe, splitConfig);
  return {
    method: splitMethod(splitConfig),
    inSampleRatio: splitConfig.inSampleRatio ?? 0.7,
    splitIndex,
    cutoffTime: candles[splitIndex]?.time ?? null,
    inSampleCandles: splitMethod(splitConfig) === "purged_embargo_entry_time"
      ? Math.max(0, splitIndex - purgeBars)
      : splitIndex,
    outOfSampleCandles: splitMethod(splitConfig) === "purged_embargo_entry_time"
      ? Math.max(0, candles.length - (splitIndex + embargoBars))
      : Math.max(0, candles.length - splitIndex),
    purgeBars: splitMethod(splitConfig) === "purged_embargo_entry_time" ? purgeBars : 0,
    embargoBars: splitMethod(splitConfig) === "purged_embargo_entry_time" ? embargoBars : 0,
    labelHorizonBars,
    purgedBoundaryCandles: splitMethod(splitConfig) === "purged_embargo_entry_time"
      ? Math.max(0, Math.min(candles.length, splitIndex + embargoBars) - Math.max(0, splitIndex - purgeBars))
      : 0
  };
}

export function simulateTrade(candles, entryIndex, signal, ctx, timeframe, config) {
  const entry = candles[entryIndex].close;
  const risk = config.risk.stopAtr * ctx.atr14;
  const targetR = config.risk.targetR;
  const stop = signal.direction === "long" ? entry - risk : entry + risk;
  const target = signal.direction === "long" ? entry + risk * targetR : entry - risk * targetR;
  const maxIndex = Math.min(candles.length - 1, entryIndex + timeframe.maxBars);
  const roundTripCostPct = 2 * (config.costs.feeBpsPerSide + config.costs.slippageBpsPerSide) / 10000;
  const costR = risk > 0 ? (entry * roundTripCostPct) / risk : 0;

  for (let i = entryIndex + 1; i <= maxIndex; i += 1) {
    const candle = candles[i];
    if (signal.direction === "long") {
      const hitStop = candle.low <= stop;
      const hitTarget = candle.high >= target;
      if (hitStop) {
        return finishTrade(-1, costR, candles, entryIndex, i, signal, ctx, "stop", hitTarget ? "stop-first-collision" : null);
      }
      if (hitTarget) return finishTrade(targetR, costR, candles, entryIndex, i, signal, ctx, "target");
    } else {
      const hitStop = candle.high >= stop;
      const hitTarget = candle.low <= target;
      if (hitStop) {
        return finishTrade(-1, costR, candles, entryIndex, i, signal, ctx, "stop", hitTarget ? "stop-first-collision" : null);
      }
      if (hitTarget) return finishTrade(targetR, costR, candles, entryIndex, i, signal, ctx, "target");
    }
  }

  const exit = candles[maxIndex].close;
  const rawR = signal.direction === "long" ? (exit - entry) / risk : (entry - exit) / risk;
  return finishTrade(rawR, costR, candles, entryIndex, maxIndex, signal, ctx, "horizon");
}

function finishTrade(rawR, costR, candles, entryIndex, exitIndex, signal, ctx, exitReason, collision = null) {
  return {
    entryIndex,
    exitIndex,
    entryTime: candles[entryIndex].time,
    exitTime: candles[exitIndex].time,
    direction: signal.direction,
    reason: signal.reason,
    rawR,
    netR: rawR - costR,
    costR,
    exitReason: collision || exitReason,
    regime: `${ctx.trend}|${ctx.volatility}`,
    trend: ctx.trend,
    volatility: ctx.volatility
  };
}

export function backtestVariant(variant, candles, symbol, timeframe, config, options = {}) {
  const trades = [];
  const baselineTrades = [];
  const purgedBoundaryTrades = [];
  const purgedBoundaryBaselineTrades = [];
  const splitConfig = config.evaluation?.split ?? {};
  const splitIndex = splitIndexForCandles(candles, splitConfig);
  const split = splitSummary(candles, splitIndex, timeframe, splitConfig);
  let signalOrdinal = 0;

  if (variant.params?.symbol && variant.params.symbol !== symbol) {
    return {
      ...variant,
      symbol,
      timeframe: timeframe.id,
      split,
      trades,
      baselineTrades,
      purgedBoundaryTrades,
      purgedBoundaryBaselineTrades
    };
  }

  if (variant.params?.timeframe && variant.params.timeframe !== timeframe.id) {
    return {
      ...variant,
      symbol,
      timeframe: timeframe.id,
      split,
      trades,
      baselineTrades,
      purgedBoundaryTrades,
      purgedBoundaryBaselineTrades
    };
  }

  for (let index = 60; index < candles.length - 2; index += 1) {
    const ctx = marketContext(candles, index);
    if (!ctx) continue;
    for (const signal of signalForVariant(variant, candles, index, ctx)) {
      if (options.signalGate && !options.signalGate({ variant, candles, symbol, timeframe, index, ctx, signal })) continue;
      const splitLabel = splitLabelForEntryIndex(index, splitIndex, timeframe, splitConfig);
      const trade = { ...simulateTrade(candles, index, signal, ctx, timeframe, config), split: splitLabel };
      const baselineTrade = {
        ...simulateTrade(candles, index, baselineSignalFor(index, signalOrdinal), ctx, timeframe, config),
        split: splitLabel,
        baselineMethod: "time_matched_alternating_direction"
      };
      if (splitLabel === "purged_boundary") {
        purgedBoundaryTrades.push(trade);
        purgedBoundaryBaselineTrades.push(baselineTrade);
      } else {
        trades.push(trade);
        baselineTrades.push(baselineTrade);
      }
      signalOrdinal += 1;
    }
  }

  return {
    ...variant,
    symbol,
    timeframe: timeframe.id,
    split,
    trades,
    baselineTrades,
    purgedBoundaryTrades,
    purgedBoundaryBaselineTrades
  };
}

export function baselineSignalFor(entryIndex, signalOrdinal = 0) {
  return {
    direction: (entryIndex + signalOrdinal) % 2 === 0 ? "long" : "short",
    reason: "time-matched-alternating-direction-baseline"
  };
}

export function statsForTrades(trades, trialCount = 1, benchmarkTrades = []) {
  const sample = trades.length;
  const calibrationBase = {
    label: DEFLATED_SHARPE_LABEL,
    implementation: "approximate_proxy",
    trialCount,
    note: DEFLATED_SHARPE_NOTE
  };

  if (!sample) {
    return {
      sample: 0,
      winRate: null,
      expectancyR: null,
      profitFactor: null,
      sharpe: null,
      deflatedSharpe: null,
      deflatedSharpeCalibration: {
        ...calibrationBase,
        sharpeStdErr: null,
        multipleTestingPenalty: null
      },
      probabilisticSharpe: null,
      probabilisticSharpeCalibration: probabilisticSharpeDiagnostic([], benchmarkTrades.map((trade) => trade.netR)),
      maxDrawdownR: null,
      worstSliceExpectancyR: null
    };
  }

  const returns = trades.map((trade) => trade.netR);
  const benchmarkReturns = benchmarkTrades.map((trade) => trade.netR);
  const wins = returns.filter((value) => value > 0);
  const losses = returns.filter((value) => value < 0);
  const mean = returns.reduce((sum, value) => sum + value, 0) / sample;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, sample - 1);
  const sd = Math.sqrt(variance);
  const sharpe = sd > 0 ? mean / sd * Math.sqrt(sample) : 0;
  const sharpeStdErr = Math.sqrt((1 + 0.5 * sharpe ** 2) / Math.max(2, sample - 1));
  const multipleTestingPenalty = Math.sqrt(2 * Math.log(Math.max(1, trialCount)));
  const deflatedSharpe = sharpe - multipleTestingPenalty * sharpeStdErr;
  const probabilisticSharpeCalibration = probabilisticSharpeDiagnostic(returns, benchmarkReturns);
  const profit = wins.reduce((sum, value) => sum + value, 0);
  const loss = Math.abs(losses.reduce((sum, value) => sum + value, 0));
  const profitFactor = loss > 0 ? profit / loss : profit > 0 ? Infinity : 0;

  let equity = 0;
  let peak = 0;
  let maxDrawdownR = 0;
  for (const value of returns) {
    equity += value;
    peak = Math.max(peak, equity);
    maxDrawdownR = Math.max(maxDrawdownR, peak - equity);
  }

  const sliceExpectancies = Object.values(groupBy(trades, (trade) => trade.regime)).map((slice) => {
    const sum = slice.reduce((total, trade) => total + trade.netR, 0);
    return sum / slice.length;
  });
  const worstSliceExpectancyR = Math.min(...sliceExpectancies);

  return {
    sample,
    winRate: round(wins.length / sample),
    expectancyR: round(mean),
    profitFactor: round(profitFactor),
    sharpe: round(sharpe),
    deflatedSharpe: round(deflatedSharpe),
    probabilisticSharpe: round(probabilisticSharpeCalibration.probability),
    deflatedSharpeCalibration: {
      ...calibrationBase,
      sharpeStdErr: round(sharpeStdErr),
      multipleTestingPenalty: round(multipleTestingPenalty),
      formula: "observedSharpe - sqrt(2*ln(trialCount))*sqrt((1+0.5*observedSharpe^2)/(sample-1))"
    },
    probabilisticSharpeCalibration,
    maxDrawdownR: round(maxDrawdownR),
    worstSliceExpectancyR: round(worstSliceExpectancyR),
    totalNetR: round(returns.reduce((sum, value) => sum + value, 0)),
    avgCostR: round(trades.reduce((sum, trade) => sum + trade.costR, 0) / sample)
  };
}

export function probabilisticSharpeDiagnostic(returns, benchmarkReturns = []) {
  const sample = returns.length;
  const base = {
    label: PROBABILISTIC_SHARPE_LABEL,
    implementation: "psr_style_proxy",
    note: PROBABILISTIC_SHARPE_NOTE,
    sample,
    benchmarkSample: benchmarkReturns.length,
    observedTradeSharpe: null,
    benchmarkTradeSharpe: null,
    skewness: null,
    kurtosis: null,
    denominator: null,
    zScore: null,
    probability: null,
    formula: "normal_cdf(((SR - SR*) * sqrt(sample - 1)) / sqrt(1 - skew*SR + ((kurtosis - 1)/4)*SR^2))"
  };
  if (sample < 3) return base;

  const moments = returnMoments(returns);
  if (!Number.isFinite(moments.sd) || moments.sd <= 0) return base;

  const benchmark = benchmarkReturns.length >= 3 ? returnMoments(benchmarkReturns).tradeSharpe : 0;
  const denominatorSquared =
    1 - moments.skewness * moments.tradeSharpe + ((moments.kurtosis - 1) / 4) * moments.tradeSharpe ** 2;
  if (!Number.isFinite(denominatorSquared) || denominatorSquared <= 0) {
    return {
      ...base,
      observedTradeSharpe: round(moments.tradeSharpe),
      benchmarkTradeSharpe: round(benchmark),
      skewness: round(moments.skewness),
      kurtosis: round(moments.kurtosis),
      denominator: null
    };
  }

  const denominator = Math.sqrt(denominatorSquared);
  const zScore = ((moments.tradeSharpe - benchmark) * Math.sqrt(sample - 1)) / denominator;
  const probability = normalCdf(zScore);
  return {
    ...base,
    observedTradeSharpe: round(moments.tradeSharpe),
    benchmarkTradeSharpe: round(benchmark),
    skewness: round(moments.skewness),
    kurtosis: round(moments.kurtosis),
    denominator: round(denominator),
    zScore: round(zScore),
    probability: round(probability)
  };
}

function returnMoments(returns) {
  const sample = returns.length;
  const mean = returns.reduce((sum, value) => sum + value, 0) / sample;
  const centered = returns.map((value) => value - mean);
  const variance = centered.reduce((sum, value) => sum + value ** 2, 0) / Math.max(1, sample - 1);
  const sd = Math.sqrt(variance);
  if (!Number.isFinite(sd) || sd <= 0) {
    return { mean, sd, tradeSharpe: null, skewness: null, kurtosis: null };
  }
  const populationSd = Math.sqrt(centered.reduce((sum, value) => sum + value ** 2, 0) / sample);
  const skewness = centered.reduce((sum, value) => sum + (value / populationSd) ** 3, 0) / sample;
  const kurtosis = centered.reduce((sum, value) => sum + (value / populationSd) ** 4, 0) / sample;
  return {
    mean,
    sd,
    tradeSharpe: mean / sd,
    skewness,
    kurtosis
  };
}

function normalCdf(value) {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

function erf(value) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

export function verdictForStats(stats, gates) {
  const failures = [];
  if (stats.sample < gates.minSample) failures.push("low_sample");
  if (!Number.isFinite(stats.expectancyR) || stats.expectancyR < gates.minExpectancyR) failures.push("weak_expectancy_after_costs");
  if (!Number.isFinite(stats.profitFactor) || stats.profitFactor < gates.minProfitFactor) failures.push("weak_profit_factor");
  if (!Number.isFinite(stats.deflatedSharpe) || stats.deflatedSharpe < gates.minDeflatedSharpe) failures.push("deflated_sharpe_fail");
  if (!Number.isFinite(stats.maxDrawdownR) || stats.maxDrawdownR > gates.maxDrawdownR) failures.push("drawdown_too_high");
  if (!Number.isFinite(stats.worstSliceExpectancyR) || stats.worstSliceExpectancyR < gates.maxWorstSliceExpectancyR) {
    failures.push("bad_failure_slice");
  }
  return {
    status: failures.length ? "rejected" : "survived_research_gate",
    failures
  };
}

export function verdictForEvaluation(stats, splitStats, baselineComparison, gates, walkForward = null) {
  const verdict = verdictForStats(stats, gates);
  const failures = [...verdict.failures];
  if ((splitStats?.outOfSample?.sample ?? 0) < (gates.minOutOfSampleSample ?? 0)) {
    failures.push("low_out_of_sample_sample");
  }
  if (
    gates.minOutOfSampleExpectancyR !== undefined &&
    (!Number.isFinite(splitStats?.outOfSample?.expectancyR) || splitStats.outOfSample.expectancyR < gates.minOutOfSampleExpectancyR)
  ) {
    failures.push("weak_out_of_sample_expectancy");
  }
  if (
    gates.minBaselineExpectancyLiftR !== undefined &&
    (!Number.isFinite(baselineComparison?.expectancyLiftR) || baselineComparison.expectancyLiftR < gates.minBaselineExpectancyLiftR)
  ) {
    failures.push("weak_baseline_lift");
  }
  if (
    gates.minBaselineExpectancyLiftR !== undefined &&
    (!Number.isFinite(baselineComparison?.outOfSampleExpectancyLiftR) || baselineComparison.outOfSampleExpectancyLiftR < gates.minBaselineExpectancyLiftR)
  ) {
    failures.push("weak_out_of_sample_baseline_lift");
  }
  if (walkForward) {
    const validWalkForwardFolds = Array.isArray(walkForward.folds)
      ? walkForward.folds.filter((fold) => fold.sample > 0)
      : [];
    const requiredPositiveFolds = Math.ceil(validWalkForwardFolds.length * 0.6);
    const outOfSampleFoldCount = validWalkForwardFolds.length - Math.floor(validWalkForwardFolds.length * 0.7);
    if (validWalkForwardFolds.length < 5) failures.push("insufficient_walk_forward_folds");
    if ((walkForward.positiveFolds ?? 0) < requiredPositiveFolds) failures.push("weak_walk_forward_expectancy");
    if ((walkForward.positiveBaselineLiftFolds ?? 0) < requiredPositiveFolds) failures.push("weak_walk_forward_baseline_lift");
    if ((walkForward.positiveOutOfSampleFolds ?? 0) < outOfSampleFoldCount) failures.push("weak_walk_forward_out_of_sample");
    if (!Number.isFinite(walkForward.minFoldExpectancyR)) failures.push("invalid_walk_forward_worst_fold");
  }
  return {
    status: failures.length ? "rejected" : "survived_research_gate",
    failures
  };
}

export function summarizeVariantRuns(runs, trialCount, gates) {
  const trades = runs.flatMap((run) =>
    run.trades.map((trade) => ({
      ...trade,
      symbol: run.symbol,
      timeframe: run.timeframe,
      variantId: run.variantId,
      candidateId: run.candidateId,
      family: run.family,
      split: trade.split
    }))
  );
  const baselineTrades = runs.flatMap((run) =>
    run.baselineTrades.map((trade) => ({
      ...trade,
      symbol: run.symbol,
      timeframe: run.timeframe,
      variantId: run.variantId,
      candidateId: run.candidateId,
      family: run.family,
      split: trade.split
    }))
  );
  const purgedBoundaryTrades = runs.flatMap((run) => run.purgedBoundaryTrades ?? []);
  const purgedBoundaryBaselineTrades = runs.flatMap((run) => run.purgedBoundaryBaselineTrades ?? []);
  const splitMetadata = {
    method: runs.find((run) => run.split?.method)?.split?.method ?? "unknown",
    splitIndexByRun: runs.map((run) => ({
      symbol: run.symbol,
      timeframe: run.timeframe,
      splitIndex: run.split?.splitIndex ?? null,
      cutoffTime: run.split?.cutoffTime ?? null,
      purgeBars: run.split?.purgeBars ?? 0,
      embargoBars: run.split?.embargoBars ?? 0,
      labelHorizonBars: run.split?.labelHorizonBars ?? null,
      purgedBoundaryTrades: run.purgedBoundaryTrades?.length ?? 0,
      purgedBoundaryBaselineTrades: run.purgedBoundaryBaselineTrades?.length ?? 0,
      inSampleTrades: run.trades.filter((trade) => trade.split === "in_sample").length,
      outOfSampleTrades: run.trades.filter((trade) => trade.split === "out_of_sample").length,
      baselineInSampleTrades: run.baselineTrades.filter((trade) => trade.split === "in_sample").length,
      baselineOutOfSampleTrades: run.baselineTrades.filter((trade) => trade.split === "out_of_sample").length
    })),
    purgedBoundaryTrades: purgedBoundaryTrades.length,
    purgedBoundaryBaselineTrades: purgedBoundaryBaselineTrades.length,
    inSampleTrades: trades.filter((trade) => trade.split === "in_sample").length,
    outOfSampleTrades: trades.filter((trade) => trade.split === "out_of_sample").length,
    baselineInSampleTrades: baselineTrades.filter((trade) => trade.split === "in_sample").length,
    baselineOutOfSampleTrades: baselineTrades.filter((trade) => trade.split === "out_of_sample").length
  };
  const baselineStats = statsForTrades(baselineTrades, trialCount);
  const stats = statsForTrades(trades, trialCount, baselineTrades);
  const splitStats = {
    inSample: statsForTrades(
      trades.filter((trade) => trade.split === "in_sample"),
      trialCount,
      baselineTrades.filter((trade) => trade.split === "in_sample")
    ),
    outOfSample: statsForTrades(
      trades.filter((trade) => trade.split === "out_of_sample"),
      trialCount,
      baselineTrades.filter((trade) => trade.split === "out_of_sample")
    )
  };
  const baselineSplitStats = {
    inSample: statsForTrades(baselineTrades.filter((trade) => trade.split === "in_sample"), trialCount),
    outOfSample: statsForTrades(baselineTrades.filter((trade) => trade.split === "out_of_sample"), trialCount)
  };
  const walkForward = walkForwardDiagnostics(trades, baselineTrades, trialCount, gates);
  const baselineComparison = {
    method: "time_matched_alternating_direction",
    expectancyLiftR: round((stats.expectancyR ?? 0) - (baselineStats.expectancyR ?? 0)),
    outOfSampleExpectancyLiftR: round((splitStats.outOfSample.expectancyR ?? 0) - (baselineSplitStats.outOfSample.expectancyR ?? 0)),
    deflatedSharpeLift: round((stats.deflatedSharpe ?? 0) - (baselineStats.deflatedSharpe ?? 0)),
    profitFactorLift: round((stats.profitFactor ?? 0) - (baselineStats.profitFactor ?? 0)),
    note: "Baseline reuses each strategy signal timestamp but alternates long/short direction deterministically; it checks whether rule direction adds value beyond matched opportunity timing."
  };
  const verdict = verdictForEvaluation(stats, splitStats, baselineComparison, gates, walkForward);
  const slices = Object.entries(groupBy(trades, (trade) => JSON.stringify([trade.symbol, trade.timeframe, trade.regime])))
    .map(([key, rows]) => {
      const [symbol, timeframe, regime] = JSON.parse(key);
      return {
        symbol,
        timeframe,
        regime,
        sample: rows.length,
        expectancyR: round(rows.reduce((sum, trade) => sum + trade.netR, 0) / rows.length),
        winRate: round(rows.filter((trade) => trade.netR > 0).length / rows.length)
      };
    })
    .sort((a, b) => a.expectancyR - b.expectancyR)
    .slice(0, 8);

  return {
    candidateId: runs[0]?.candidateId,
    variantId: runs[0]?.variantId,
    family: runs[0]?.family,
    idea: runs[0]?.idea,
    thesis: runs[0]?.thesis,
    dataRequirements: runs[0]?.dataRequirements,
    validation: runs[0]?.validation,
    rule: runs[0]?.rule,
    params: runs[0]?.params,
    stats,
    splitStats,
    splitMetadata,
    walkForward,
    baseline: {
      stats: baselineStats,
      splitStats: baselineSplitStats,
      comparison: baselineComparison
    },
    verdict,
    worstSlices: slices
  };
}

export function walkForwardDiagnostics(trades, baselineTrades = [], trialCount = 1, gates = {}, foldCount = 5) {
  const sorted = [...trades].sort((a, b) => a.entryTime - b.entryTime);
  const sortedBaseline = [...baselineTrades].sort((a, b) => a.entryTime - b.entryTime);
  if (!sorted.length) {
    return {
      method: "equal_trade_count_chronological_folds",
      foldCount,
      positiveFolds: 0,
      positiveBaselineLiftFolds: 0,
      positiveOutOfSampleFolds: 0,
      minFoldExpectancyR: null,
      folds: []
    };
  }

  const folds = [];
  for (let foldIndex = 0; foldIndex < foldCount; foldIndex += 1) {
    const start = Math.floor((sorted.length * foldIndex) / foldCount);
    const end = Math.floor((sorted.length * (foldIndex + 1)) / foldCount);
    const rows = sorted.slice(start, end);
    const baselineRows = sortedBaseline.slice(start, end);
    const stats = statsForTrades(rows, trialCount, baselineRows);
    const baselineStats = statsForTrades(baselineRows, trialCount);
    const expectancyLiftR = round((stats.expectancyR ?? 0) - (baselineStats.expectancyR ?? 0));
    folds.push({
      fold: foldIndex + 1,
      sample: rows.length,
      firstEntryTime: rows[0]?.entryTime ?? null,
      lastEntryTime: rows.at(-1)?.entryTime ?? null,
      expectancyR: stats.expectancyR,
      profitFactor: stats.profitFactor,
      deflatedSharpe: stats.deflatedSharpe,
      probabilisticSharpe: stats.probabilisticSharpe,
      maxDrawdownR: stats.maxDrawdownR,
      baselineExpectancyR: baselineStats.expectancyR,
      expectancyLiftR
    });
  }

  const valid = folds.filter((fold) => fold.sample > 0);
  return {
    method: "equal_trade_count_chronological_folds",
    foldCount,
    positiveFolds: valid.filter((fold) => Number.isFinite(fold.expectancyR) && fold.expectancyR > 0).length,
    positiveBaselineLiftFolds: valid.filter((fold) => Number.isFinite(fold.expectancyLiftR) && fold.expectancyLiftR > 0).length,
    positiveOutOfSampleFolds: valid.slice(Math.floor(valid.length * 0.7)).filter((fold) => Number.isFinite(fold.expectancyR) && fold.expectancyR > (gates.minOutOfSampleExpectancyR ?? 0)).length,
    minFoldExpectancyR: round(Math.min(...valid.map((fold) => fold.expectancyR).filter(Number.isFinite))),
    folds
  };
}

function groupBy(rows, keyFn) {
  const groups = {};
  for (const row of rows) {
    const key = keyFn(row);
    groups[key] ||= [];
    groups[key].push(row);
  }
  return groups;
}
