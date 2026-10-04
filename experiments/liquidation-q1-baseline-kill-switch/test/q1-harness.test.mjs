import assert from "node:assert/strict";
import test from "node:test";

import { runBacktest } from "../src/q1-harness.mjs";

const config = {
  cascadeWindowMinutes: 5,
  rollingLiquidationLookbackWindows: 12,
  minLiquidationNotionalMultiple: 2,
  minLiquidationNotionalUsd: 0,
  minSameDirectionEvents: 2,
  entryDelayCandles: 0,
  entryLookaheadCandles: 2,
  passiveLimitOffsetPct: 0,
  partialFillFullDepthPct: 0.005,
  holdCandles: 3,
  cooldownCandles: 2,
  stopLossPct: 0.03,
  takeProfitPct: 0.04,
  feeBpsPerSide: 3,
  slippageBpsPerSide: 7,
  baselineMovePct: 0.03,
  drawdownLookbackCandles: 4,
  drawdownPct: 0.05,
  minEdgeBps: 10,
  minRiskAdjustedEdge: -Infinity,
  maxWorstTradePct: -0.08,
  maxTail5Pct: -0.06,
  topOutlierCount: 1,
  minReturnWithoutTopOutliers: -1,
  maxWorstClusteredDayReturn: -1,
  minVolProxyObservations: 5,
  maxVolProxyCorrelation: 0.95,
  holdoutFraction: 0.3,
  minHoldoutTrades: 1,
};

test("liquidation cascade is killed when dumb baselines explain the move", () => {
  const candles = [
    candle("2026-06-01T00:00:00Z", 100, 101, 99, 100),
    candle("2026-06-01T00:05:00Z", 100, 100, 93, 94),
    candle("2026-06-01T00:10:00Z", 94, 96, 93, 95),
    candle("2026-06-01T00:15:00Z", 95, 99, 94, 98),
    candle("2026-06-01T00:20:00Z", 98, 99, 96, 97),
    candle("2026-06-01T00:25:00Z", 97, 98, 96, 97),
    candle("2026-06-01T00:30:00Z", 97, 98, 91, 92),
    candle("2026-06-01T00:35:00Z", 92, 93, 91, 92),
    candle("2026-06-01T00:40:00Z", 92, 96, 91, 95),
    candle("2026-06-01T00:45:00Z", 95, 97, 94, 96),
    candle("2026-06-01T00:50:00Z", 96, 97, 95, 96),
    candle("2026-06-01T00:55:00Z", 96, 101, 95, 100),
    candle("2026-06-01T01:00:00Z", 100, 101, 99, 100),
  ];
  const liquidations = [
    liquidation("2026-06-01T00:05:20Z", 94, 4000, "Close Long"),
    liquidation("2026-06-01T00:06:00Z", 93, 3500, "Close Long"),
    liquidation("2026-06-01T00:30:20Z", 92, 5000, "Close Long"),
    liquidation("2026-06-01T00:31:00Z", 91, 4000, "Close Long"),
  ];

  const report = runBacktest({ candles, liquidations, config });

  assert.equal(report.signalCounts.liquidationCascade, 2);
  assert.equal(report.strategies.liquidationCascade.opportunities, 2);
  assert.equal(report.strategies.liquidationCascade.trades, 2);
  assert.equal(report.verdict.decision, "do_not_build");
  assert.ok(report.verdict.blockers.includes("liquidation signal does not beat dumb baselines by minEdgeBps"));
});

test("gate blocks when liquidation data produces no trades", () => {
  const candles = [
    candle("2026-06-01T00:00:00Z", 100, 101, 99, 100),
    candle("2026-06-01T00:05:00Z", 100, 101, 99, 100),
    candle("2026-06-01T00:10:00Z", 100, 101, 99, 100),
  ];

  const report = runBacktest({ candles, liquidations: [], config });

  assert.equal(report.verdict.decision, "do_not_build");
  assert.ok(report.verdict.blockers.includes("no liquidation-cascade opportunities"));
  assert.ok(report.verdict.blockers.includes("no liquidation-cascade fills"));
});

test("missed passive limits are counted as opportunities", () => {
  const candles = [
    candle("2026-06-01T00:00:00Z", 100, 101, 99, 100),
    candle("2026-06-01T00:05:00Z", 100, 100, 93, 94),
    candle("2026-06-01T00:10:00Z", 94, 96, 93, 95),
    candle("2026-06-01T00:15:00Z", 95, 99, 94, 98),
  ];
  const liquidations = [
    liquidation("2026-06-01T00:05:20Z", 94, 4000, "Close Long"),
    liquidation("2026-06-01T00:06:00Z", 93, 3500, "Close Long"),
  ];

  const report = runBacktest({
    candles,
    liquidations,
    config: { ...config, passiveLimitOffsetPct: 0.1 },
  });

  assert.equal(report.strategies.liquidationCascade.opportunities, 1);
  assert.equal(report.strategies.liquidationCascade.trades, 0);
  assert.equal(report.strategies.liquidationCascade.fillRate, 0);
  assert.equal(report.strategies.liquidationCascade.exitReasons.missed, 1);
  assert.ok(report.verdict.blockers.includes("no liquidation-cascade fills"));
});

function candle(timestamp, open, high, low, close) {
  return { symbol: "BTC", timestamp, open, high, low, close, volume: 100 };
}

function liquidation(timestamp, price, size, direction) {
  return { symbol: "BTC", timestamp, price: String(price), size: String(size), direction, side: "B" };
}
