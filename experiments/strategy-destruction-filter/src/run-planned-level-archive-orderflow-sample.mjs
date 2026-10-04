#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import {
  fetchBinanceSpotAggTradesDay,
  sliceAggTrades
} from "../../btc-eth-alert-edge/src/binance-aggtrades-archive.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const INPUT_JSON = path.join(RESULTS_DIR, "planned-level-proxy-replay.json");
const BASELINE_JSON = path.join(RESULTS_DIR, "planned-level-proxy-baseline-check.json");
const OUT_JSON = path.join(RESULTS_DIR, "planned-level-archive-orderflow-sample.json");
const OUT_MD = path.join(RESULTS_DIR, "planned-level-archive-orderflow-sample.md");

const MAX_WINDOWS = Number(process.env.PLANNED_LEVEL_ARCHIVE_SAMPLE_WINDOWS || 2);
const LEVEL_BAND_ATR_MULTIPLE = Number(process.env.PLANNED_LEVEL_ARCHIVE_LEVEL_BAND_ATR || 0.05);
const LEVEL_BAND_BPS = Number(process.env.PLANNED_LEVEL_ARCHIVE_LEVEL_BAND_BPS || 2);
const ABSORPTION_DOMINANCE = Number(process.env.PLANNED_LEVEL_ARCHIVE_ABSORPTION_DOMINANCE || 1.25);
const ABSORPTION_PROGRESS_BPS = Number(process.env.PLANNED_LEVEL_ARCHIVE_ABSORPTION_PROGRESS_BPS || 2);

const replay = JSON.parse(await fs.readFile(INPUT_JSON, "utf8"));
const baseline = JSON.parse(await fs.readFile(BASELINE_JSON, "utf8"));
const fetchedRows = replay.rows.filter((row) => row.tradeWindow?.status === "ok");
const sourceRows = [
  ...fetchedRows.filter((row) => (row.tradeWindow?.aggressiveVolumeAtLevel ?? 0) > 0),
  ...fetchedRows.filter((row) => (row.tradeWindow?.aggressiveVolumeAtLevel ?? 0) <= 0)
].slice(0, MAX_WINDOWS);

const dayCache = new Map();
const rows = [];
for (const row of sourceRows) {
  rows.push(await analyzeWindow(row));
}

const comparison = compareToBaseline(rows, baseline);
const decision = decide(rows, comparison);
const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  purpose: "archive-backed sanity sample aligning Binance spot aggTrades to frozen planned-level windows before any watcher-gate proposal",
  source: {
    plannedLevelReplay: path.relative(ROOT, INPUT_JSON),
    plannedLevelBaseline: path.relative(ROOT, BASELINE_JSON),
    aggTradesProvider: "binance-spot-daily-aggTrades-archive",
    auth: "none",
    selectedRows: "first fetched frozen planned-level windows with nonzero existing near-level aggressive notional, then remaining fetched windows"
  },
  parameters: {
    maxWindows: MAX_WINDOWS,
    levelBandAtrMultiple: LEVEL_BAND_ATR_MULTIPLE,
    levelBandBps: LEVEL_BAND_BPS,
    absorptionDominance: ABSORPTION_DOMINANCE,
    absorptionProgressBps: ABSORPTION_PROGRESS_BPS
  },
  totals: {
    requestedWindows: sourceRows.length,
    analyzedWindows: rows.filter((row) => row.archiveWindow.status === "ok").length,
    noTradeWindows: rows.filter((row) => row.archiveWindow.status !== "ok").length,
    absorbedNearLevel: rows.filter((row) => row.features.aggressionAbsorbedNearPlannedLevel === true).length,
    baselineLabelMatches: comparison.labelMatches,
    baselineLabelMismatches: comparison.labelMismatches
  },
  baselineComparison: comparison,
  rows,
  decision
};

await fs.mkdir(RESULTS_DIR, { recursive: true });
await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  verdict: report.decision.verdict,
  analyzedWindows: report.totals.analyzedWindows,
  absorbedNearLevel: report.totals.absorbedNearLevel,
  baselineLabelMatches: report.totals.baselineLabelMatches,
  baselineLabelMismatches: report.totals.baselineLabelMismatches,
  report: OUT_JSON
}, null, 2));

async function analyzeWindow(row) {
  const startMs = Date.parse(row.tradeWindow.start);
  const endMs = Date.parse(row.tradeWindow.end);
  const trades = await loadTrades(row.symbol, startMs, endMs);
  const features = featuresForWindow(row, trades, startMs, endMs);
  return {
    eventId: row.eventId,
    symbol: row.symbol,
    candleTimeUtc: row.candleTimeUtc,
    levelSource: row.levelSource,
    levelPrice: row.levelPrice,
    levelSide: row.levelSide,
    setupType: row.setupType,
    direction: row.direction,
    classification: row.classification,
    btcGate: row.btcGateEntry?.regime ?? null,
    baselineProxy: {
      proxyClusterLabel: row.proxyClusterLabel,
      fastKillLabel: row.fastKillLabel,
      tradeSideDeltaNotional: row.tradeWindow.tradeSideDeltaNotional,
      cvdSlopeNotionalPerMin: row.tradeWindow.cvdSlopeNotionalPerMin,
      aggressiveVolumeAtLevel: row.tradeWindow.aggressiveVolumeAtLevel,
      priceProgressPerAggressiveVolume: row.tradeWindow.priceProgressPerAggressiveVolume,
      opposingAbsorptionCandidate: row.tradeWindow.opposingAbsorptionCandidate,
      failBackOrReclaim: row.tradeWindow.failBackOrReclaim
    },
    archiveWindow: {
      status: trades.length ? "ok" : "no_trades_returned",
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
      trades: trades.length,
      firstTradeTime: trades[0]?.transactTimeIso ?? null,
      lastTradeTime: trades.at(-1)?.transactTimeIso ?? null
    },
    features
  };
}

async function loadTrades(symbol, startMs, endMs) {
  const days = daysBetween(startMs, endMs);
  const out = [];
  for (const date of days) {
    const key = `${symbol}:${date}`;
    if (!dayCache.has(key)) dayCache.set(key, await fetchBinanceSpotAggTradesDay(symbol, date));
    const day = dayCache.get(key);
    out.push(...sliceAggTrades(day.trades, { startMs, endMs }));
  }
  return out.sort((a, b) => a.transactTime - b.transactTime || a.aggTradeId - b.aggTradeId);
}

function featuresForWindow(row, trades, startMs, endMs) {
  if (!trades.length) {
    return {
      signedTakerDeltaNotional: 0,
      cvdSlopeNotionalPerMin: null,
      aggressiveNotionalNearLevel: 0,
      priceProgressPerAggressiveVolume: null,
      aggressionAbsorbedNearPlannedLevel: null,
      archiveProxyLabel: "not_available"
    };
  }

  const first = trades[0];
  const last = trades.at(-1);
  const minutes = Math.max(1, (endMs - startMs) / 60_000);
  const signedTakerDeltaNotional = sum(trades.map((trade) => trade.signedNotional));
  const levelBand = Math.max(row.atr * LEVEL_BAND_ATR_MULTIPLE, row.levelPrice * (LEVEL_BAND_BPS / 10_000));
  const nearLevel = trades.filter((trade) => Math.abs(trade.price - row.levelPrice) <= levelBand);
  const nearBuyNotional = sum(nearLevel.filter((trade) => trade.takerSide === "buy").map((trade) => trade.quoteQuantity));
  const nearSellNotional = sum(nearLevel.filter((trade) => trade.takerSide === "sell").map((trade) => trade.quoteQuantity));
  const aggressiveNotionalNearLevel = nearBuyNotional + nearSellNotional;
  const alignedNearNotional = row.levelSide === "up" ? nearBuyNotional : nearSellNotional;
  const opposingNearNotional = row.levelSide === "up" ? nearSellNotional : nearBuyNotional;
  const directionalPriceProgress = row.direction === "long"
    ? last.price - row.entryPriceProxy
    : row.entryPriceProxy - last.price;
  const levelSideProgress = row.levelSide === "up"
    ? last.price - row.levelPrice
    : row.levelPrice - last.price;
  const levelSideProgressBps = (levelSideProgress / row.levelPrice) * 10_000;
  const priceProgressPerAggressiveVolume = aggressiveNotionalNearLevel > 0
    ? directionalPriceProgress / aggressiveNotionalNearLevel
    : null;
  const aggressionAbsorbedNearPlannedLevel = aggressiveNotionalNearLevel > 0
    && alignedNearNotional >= opposingNearNotional * ABSORPTION_DOMINANCE
    && levelSideProgressBps <= ABSORPTION_PROGRESS_BPS;
  const archiveProxyLabel = classifyArchiveProxy({
    row,
    signedTakerDeltaNotional,
    directionalPriceProgress,
    aggressionAbsorbedNearPlannedLevel,
    failed: failedLevel(row, last.price)
  });

  return {
    firstPrice: round(first.price, 2),
    lastPrice: round(last.price, 2),
    levelBand: round(levelBand, 2),
    signedTakerDeltaNotional: Math.round(signedTakerDeltaNotional),
    cvdSlopeNotionalPerMin: Math.round(signedTakerDeltaNotional / minutes),
    aggressiveNotionalNearLevel: Math.round(aggressiveNotionalNearLevel),
    alignedAggressiveNotionalNearLevel: Math.round(alignedNearNotional),
    opposingAggressiveNotionalNearLevel: Math.round(opposingNearNotional),
    directionalPriceProgress: round(directionalPriceProgress, 2),
    levelSideProgressBps: round(levelSideProgressBps, 4),
    priceProgressPerAggressiveVolume: round(priceProgressPerAggressiveVolume, 10),
    aggressionAbsorbedNearPlannedLevel,
    archiveProxyLabel,
    archiveFastKillLabel: failedLevel(row, last.price) ? "fast_kill_candidate" : "hold_or_retest_candidate"
  };
}

function classifyArchiveProxy({ row, signedTakerDeltaNotional, directionalPriceProgress, aggressionAbsorbedNearPlannedLevel, failed }) {
  if (failed) return "fail_back_or_reclaim";
  if (aggressionAbsorbedNearPlannedLevel) return "absorption_near_planned_level";
  const aligned = row.direction === "long" ? signedTakerDeltaNotional > 0 : signedTakerDeltaNotional < 0;
  if (aligned && directionalPriceProgress > 0) return "acceptance_proxy";
  if (!aligned && directionalPriceProgress >= 0) return "absorption_proxy";
  return "mixed_no_trade_proxy";
}

function failedLevel(row, lastPrice) {
  return row.direction === "long" ? lastPrice < row.levelPrice : lastPrice > row.levelPrice;
}

function compareToBaseline(rows, baseline) {
  const baselineRows = new Map((baseline.rows ?? []).map((row) => [row.eventId, row]));
  const comparedRows = rows.map((row) => {
    const baselineRow = baselineRows.get(row.eventId);
    return {
      eventId: row.eventId,
      baselineFastKillLabel: row.baselineProxy.fastKillLabel,
      archiveFastKillLabel: row.features.archiveFastKillLabel,
      labelMatchesExistingProxy: row.baselineProxy.fastKillLabel === row.features.archiveFastKillLabel,
      baselineH5NetOpportunityPct: baselineRow?.h5?.netOpportunityPct ?? null,
      archiveProxyLabel: row.features.archiveProxyLabel,
      absorbedNearLevel: row.features.aggressionAbsorbedNearPlannedLevel
    };
  });
  const labelMatches = comparedRows.filter((row) => row.labelMatchesExistingProxy).length;
  const labelMismatches = comparedRows.length - labelMatches;
  return {
    plannedLevelProxyBaselineVerdict: baseline.decision?.verdict ?? null,
    plannedLevelProxyBaselineReason: baseline.decision?.reason ?? null,
    comparedRows: comparedRows.length,
    labelMatches,
    labelMismatches,
    rows: comparedRows
  };
}

function decide(rows, comparison) {
  const analyzed = rows.filter((row) => row.archiveWindow.status === "ok").length;
  return {
    verdict: analyzed >= 1 ? "archive_features_sample_ready_no_promotion" : "archive_features_sample_empty",
    reason: analyzed >= 1
      ? "Archive-backed window features are reproducible on the tiny sample, but the existing planned-level proxy baseline is mixed and this sample is far below any watcher-gate threshold."
      : "No archive trades were available for the selected frozen windows.",
    comparison: {
      baselineVerdict: comparison.plannedLevelProxyBaselineVerdict,
      labelMatches: comparison.labelMatches,
      labelMismatches: comparison.labelMismatches
    },
    candidateAdded: false,
    watcherGateChangeProposed: false,
    noLiveChange: true
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Planned-Level Archive Orderflow Sample",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Research-only archive-backed sample aligning Binance spot daily aggTrades to frozen planned-level windows. It does not change live alerts, watcher gates, paper logic, schedulers, risk, sizing, TP/SL, execution, accounts, keys, paid services, public posting, or strategy status.",
    "",
    "## Decision",
    "",
    `- Verdict: ${report.decision.verdict}`,
    `- Reason: ${report.decision.reason}`,
    `- Existing planned-level proxy baseline: ${report.baselineComparison.plannedLevelProxyBaselineVerdict}`,
    `- Baseline label matches/mismatches: ${report.totals.baselineLabelMatches}/${report.totals.baselineLabelMismatches}`,
    `- Absorbed near planned level: ${report.totals.absorbedNearLevel}/${report.totals.analyzedWindows}`,
    "",
    "## Rows",
    "",
    "| Event | Window | Setup | Existing label | Archive label | Signed delta | CVD slope/min | Aggressive near level | Progress/aggr | Absorbed? | H5 baseline MFE-MAE |",
    "| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: |"
  ];

  for (const row of report.rows) {
    const comparison = report.baselineComparison.rows.find((item) => item.eventId === row.eventId);
    lines.push(`| ${row.eventId} | ${row.archiveWindow.start} to ${row.archiveWindow.end} | ${row.setupType} | ${row.baselineProxy.fastKillLabel} | ${row.features.archiveFastKillLabel} | ${row.features.signedTakerDeltaNotional} | ${row.features.cvdSlopeNotionalPerMin} | ${row.features.aggressiveNotionalNearLevel} | ${row.features.priceProgressPerAggressiveVolume ?? "n/a"} | ${row.features.aggressionAbsorbedNearPlannedLevel ?? "n/a"} | ${comparison?.baselineH5NetOpportunityPct ?? "n/a"} |`);
  }

  lines.push(
    "",
    "## Notes",
    "",
    "- Signed taker delta treats buyer-is-maker trades as taker sells and the rest as taker buys.",
    "- Aggressive notional near level uses max(ATR * configured multiple, level bps band) around the frozen planned level.",
    "- Absorption near level requires aligned aggressive notional dominance but weak/failing progress through the planned level.",
    "- This is a reproducible feature plumbing sample only; it is intentionally too small for any watcher-gate change.",
    "",
    "## Boundary",
    "",
    "No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed."
  );

  return `${lines.join("\n")}\n`;
}

function daysBetween(startMs, endMs) {
  const dates = [];
  const start = new Date(startMs);
  let cursor = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  while (cursor <= endMs) {
    dates.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += 24 * 60 * 60 * 1000;
  }
  return dates;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}
