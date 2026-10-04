import { marketContext, round } from "./engine.mjs";

const DEFAULT_HORIZONS = [1, 3, 6, 12, 24];
const DEFAULT_EXTREME_QUANTILES = [0.05, 0.1, 0.9, 0.95];
const RSI_THRESHOLDS = [
  { id: "rsi_oversold_30", side: "low", predicate: (row) => row.rsi14 <= 30, signedDirection: "long" },
  { id: "rsi_oversold_35", side: "low", predicate: (row) => row.rsi14 <= 35, signedDirection: "long" },
  { id: "rsi_overbought_65", side: "high", predicate: (row) => row.rsi14 >= 65, signedDirection: "short" },
  { id: "rsi_overbought_70", side: "high", predicate: (row) => row.rsi14 >= 70, signedDirection: "short" }
];

export function buildFeatureRows(candles, timeframe, options = {}) {
  const horizons = options.horizons || DEFAULT_HORIZONS;
  const maxHorizon = Math.max(...horizons);
  const rows = [];

  for (let index = 60; index < candles.length - maxHorizon; index += 1) {
    const ctx = marketContext(candles, index);
    if (!ctx) continue;
    const forwardReturnsPct = {};
    for (const horizon of horizons) {
      forwardReturnsPct[horizon] = (candles[index + horizon].close - candles[index].close) / candles[index].close * 100;
    }
    rows.push({
      index,
      time: candles[index].time,
      timeframe: timeframe.id,
      regime: `${ctx.trend}|${ctx.volatility}`,
      trend: ctx.trend,
      volatility: ctx.volatility,
      close: ctx.close,
      rsi14: ctx.rsi14,
      fundingRate: ctx.fundingRate,
      openInterestChangePct: ctx.openInterestChangePct,
      forwardReturnsPct
    });
  }

  return rows;
}

export function summarizeFeatureStudy(symbol, timeframe, candles, options = {}) {
  const horizons = options.horizons || DEFAULT_HORIZONS;
  const rows = buildFeatureRows(candles, timeframe, { horizons });
  const featureRows = rows.filter((row) => row.fundingRate !== null || row.openInterestChangePct !== null);
  const featureUniverse = featureRows.length ? featureRows : rows;

  return {
    symbol,
    timeframe: timeframe.id,
    candles: candles.length,
    rows: rows.length,
    rowsWithFunding: rows.filter((row) => row.fundingRate !== null).length,
    rowsWithOpenInterestChange: rows.filter((row) => row.openInterestChangePct !== null).length,
    firstRowTime: isoFromSeconds(rows[0]?.time),
    lastRowTime: isoFromSeconds(rows.at(-1)?.time),
    horizons,
    distributions: {
      fundingRate: distributionByRegime(rows, "fundingRate"),
      openInterestChangePct: distributionByRegime(rows, "openInterestChangePct")
    },
    forwardBuckets: [
      ...extremeBuckets(featureUniverse, "fundingRate", horizons, { signedLow: "long", signedHigh: "short" }),
      ...extremeBuckets(featureUniverse, "openInterestChangePct", horizons, {}),
      ...rsiBuckets(rows, horizons)
    ]
  };
}

export function distributionByRegime(rows, feature) {
  const available = rows.filter((row) => Number.isFinite(row[feature]));
  const regimes = Object.entries(groupBy(available, (row) => row.regime))
    .map(([regime, regimeRows]) => ({
      regime,
      ...summarizeNumeric(regimeRows.map((row) => row[feature]))
    }))
    .sort((a, b) => b.sample - a.sample || a.regime.localeCompare(b.regime));

  return {
    feature,
    all: summarizeNumeric(available.map((row) => row[feature])),
    regimes
  };
}

export function extremeBuckets(rows, feature, horizons, options = {}) {
  const available = rows.filter((row) => Number.isFinite(row[feature]));
  if (!available.length) return [];
  const values = available.map((row) => row[feature]).sort((a, b) => a - b);
  const buckets = [];

  for (const quantileValue of DEFAULT_EXTREME_QUANTILES) {
    const threshold = percentile(values, quantileValue);
    const isLow = quantileValue < 0.5;
    const selected = available.filter((row) => isLow ? row[feature] <= threshold : row[feature] >= threshold);
    const signedDirection = isLow ? options.signedLow : options.signedHigh;
    buckets.push({
      id: `${feature}_${isLow ? "bottom" : "top"}_${Math.round((isLow ? quantileValue : 1 - quantileValue) * 100)}`,
      feature,
      side: isLow ? "low" : "high",
      threshold: round(threshold, feature === "fundingRate" ? 8 : 4),
      sample: selected.length,
      regimes: regimeCounts(selected),
      forward: summarizeForwardReturns(selected, horizons, signedDirection)
    });
  }

  return buckets.sort((a, b) => a.id.localeCompare(b.id));
}

export function rsiBuckets(rows, horizons) {
  return RSI_THRESHOLDS.map((bucket) => {
    const selected = rows.filter(bucket.predicate);
    return {
      id: bucket.id,
      feature: "rsi14",
      side: bucket.side,
      threshold: Number(bucket.id.split("_").at(-1)),
      sample: selected.length,
      regimes: regimeCounts(selected),
      forward: summarizeForwardReturns(selected, horizons, bucket.signedDirection)
    };
  });
}

export function summarizeForwardReturns(rows, horizons, signedDirection = null) {
  const output = {};
  for (const horizon of horizons) {
    const values = rows
      .map((row) => row.forwardReturnsPct[horizon])
      .filter(Number.isFinite);
    const signedValues = signedDirection
      ? values.map((value) => signedDirection === "short" ? -value : value)
      : [];
    output[horizon] = {
      sample: values.length,
      meanPct: mean(values),
      medianPct: percentile(values, 0.5),
      positiveRate: rate(values, (value) => value > 0),
      signedMeanPct: signedDirection ? mean(signedValues) : null,
      signedPositiveRate: signedDirection ? rate(signedValues, (value) => value > 0) : null,
      signedDirection
    };
  }
  return output;
}

export function summarizeNumeric(values) {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  return {
    sample: finite.length,
    min: round(finite[0]),
    p05: percentile(finite, 0.05),
    p25: percentile(finite, 0.25),
    median: percentile(finite, 0.5),
    p75: percentile(finite, 0.75),
    p95: percentile(finite, 0.95),
    max: round(finite.at(-1)),
    mean: mean(finite)
  };
}

export function percentile(sortedValues, q) {
  if (!sortedValues.length) return null;
  const values = [...sortedValues].sort((a, b) => a - b);
  const position = (values.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return round(values[lower]);
  const weight = position - lower;
  return round(values[lower] * (1 - weight) + values[upper] * weight);
}

function mean(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? round(finite.reduce((sum, value) => sum + value, 0) / finite.length) : null;
}

function rate(values, predicate) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? round(finite.filter(predicate).length / finite.length) : null;
}

function regimeCounts(rows) {
  return Object.entries(groupBy(rows, (row) => row.regime))
    .map(([regime, regimeRows]) => ({ regime, sample: regimeRows.length }))
    .sort((a, b) => b.sample - a.sample || a.regime.localeCompare(b.regime));
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

function isoFromSeconds(value) {
  return Number.isFinite(value) ? new Date(value * 1000).toISOString() : null;
}
