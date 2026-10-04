#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import {
  fetchBinanceUsdmBookDepthDay,
  fetchBinanceUsdmTradesDay
} from "../../btc-eth-alert-edge/src/binance-usdm-archive.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RALPH_ROOT = path.resolve(ROOT, "../..");
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_JSON = path.join(RALPH_ROOT, "experiments/btc-eth-alert-edge/results/historical-demo-sim-replay.json");

const MAX_WINDOWS = Number(process.env.USDM_ORDERFLOW_BATCH_WINDOWS || 90);
const SAMPLE_MODE = process.env.USDM_ORDERFLOW_SAMPLE_MODE || "balanced";
const OUTPUT_STEM = SAMPLE_MODE === "bucket-targeted"
  ? "usdm-orderflow-targeted-comparable"
  : "usdm-orderflow";
const OUT_JSON = path.join(RESULTS_DIR, `${OUTPUT_STEM}-demo-sim-batch.json`);
const OUT_MD = path.join(RESULTS_DIR, `${OUTPUT_STEM}-demo-sim-batch.md`);
const OUT_MANIFEST_JSON = path.join(RESULTS_DIR, `${OUTPUT_STEM}-${SAMPLE_MODE === "bucket-targeted" ? "manifest" : "balanced-manifest"}.json`);
const OUT_MANIFEST_MD = path.join(RESULTS_DIR, `${OUTPUT_STEM}-${SAMPLE_MODE === "bucket-targeted" ? "manifest" : "balanced-manifest"}.md`);
const WINDOW_MINUTES_BEFORE = Number(process.env.USDM_ORDERFLOW_WINDOW_BEFORE_MINUTES || 15);
const WINDOW_MINUTES_AFTER = Number(process.env.USDM_ORDERFLOW_WINDOW_AFTER_MINUTES || 15);
const BOOK_DEPTH_NEAR_PCT = Number(process.env.USDM_ORDERFLOW_BOOK_DEPTH_NEAR_PCT || 1);
const ORIGINAL_CLUSTER_WINDOWS = 30;
const COMPARABLE_BUCKET_MIN_ROWS = 4;
const SUPPORTED_SYMBOLS = new Set(["BTC", "ETH", "SOL", "LINK", "ADA", "XRP", "DOGE", "AVAX", "BNB"]);
const SYMBOL_SOFT_LIMIT = Math.ceil(MAX_WINDOWS / SUPPORTED_SYMBOLS.size) + 1;
const DATE_SOFT_LIMIT = 3;

const replay = JSON.parse(await fs.readFile(REPLAY_JSON, "utf8"));
const records = (replay.records ?? [])
  .filter((record) => record.status === "closed")
  .filter((record) => SUPPORTED_SYMBOLS.has(record.symbol))
  .filter((record) => Number.isFinite(record.entryTime) && Number.isFinite(record.entryPrice));
const chronologicalRecords = records.toSorted((a, b) => a.entryTime - b.entryTime || a.id.localeCompare(b.id));
const originalClusterEventIds = new Set(chronologicalRecords.slice(0, ORIGINAL_CLUSTER_WINDOWS).map((record) => record.id));
const sourceRows = selectManifestRows(records, MAX_WINDOWS, SAMPLE_MODE);
const manifest = buildManifest(sourceRows, records.length);

const rows = [];
for (const [index, row] of sourceRows.entries()) {
  console.error(`[usdm-orderflow] ${index + 1}/${sourceRows.length} ${row.id} ${row.symbol} ${dateOf(row.entryTime)}`);
  rows.push(await analyzeRecord(row));
}

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  purpose: SAMPLE_MODE === "bucket-targeted"
    ? "bucket-targeted Binance USD-M archive falsification batch forcing same setup/regime comparisons before any orderflow feature promotion"
    : "balanced Binance USD-M archive validation batch aligning futures trades and coarse bookDepth to frozen DEMO-SIM rows before any orderflow feature promotion",
  source: {
    replay: path.relative(ROOT, REPLAY_JSON),
    manifest: path.relative(ROOT, OUT_MANIFEST_JSON),
    archiveProvider: "binance-usdm-public-daily-archives",
    archiveTypes: ["trades", "bookDepth"],
    auth: "none",
    selectedRows: SAMPLE_MODE === "bucket-targeted"
      ? "frozen bucket-targeted DEMO-SIM manifest selected to create comparable setup/direction/timeframe/regime/BTC-gate rows while preserving existing replay labels and outcomes"
      : "frozen balanced DEMO-SIM manifest diversified by date/week, symbol, setup, direction, timeframe, BTC gate, and outcome while preserving existing replay labels and outcomes",
    originalClusterDefinition: `first ${ORIGINAL_CLUSTER_WINDOWS} chronological closed DEMO-SIM rows from the previous broader sample`
  },
  parameters: {
    maxWindows: MAX_WINDOWS,
    sampleMode: SAMPLE_MODE,
    windowMinutesBefore: WINDOW_MINUTES_BEFORE,
    windowMinutesAfter: WINDOW_MINUTES_AFTER,
    bookDepthNearPct: BOOK_DEPTH_NEAR_PCT,
    comparableBucketMinRows: COMPARABLE_BUCKET_MIN_ROWS
  },
  manifest: manifest.summary,
  totals: {
    candidateRows: records.length,
    requestedWindows: sourceRows.length,
    analyzedWindows: rows.filter((row) => row.archiveWindow.status === "ok").length,
    noArchiveWindows: rows.filter((row) => row.archiveWindow.status !== "ok").length,
    rowsWithTrades: rows.filter((row) => row.tradeFeatures.trades > 0).length,
    rowsWithBookDepth: rows.filter((row) => row.bookDepthFeatures.rows > 0).length,
    absorptionProxyRows: rows.filter((row) => row.featureFlags.absorptionProxy === true).length,
    liquidityThinningProxyRows: rows.filter((row) => row.featureFlags.liquidityThinningProxy === true).length,
    alignedCvdRows: rows.filter((row) => row.featureFlags.alignedCvd === true).length,
    rowsWithEntryCandleExcursion: rows.filter((row) => Number.isFinite(row.candleOnlyFeatures?.entryCandleNetOpportunityR)).length,
    originalClusterRows: rows.filter((row) => row.inOriginalCluster === true).length,
    outsideOriginalClusterRows: rows.filter((row) => row.inOriginalCluster !== true).length,
    positiveOutcomeRows: rows.filter((row) => (row.outcome.rMultiple ?? -Infinity) > 0).length,
    negativeOutcomeRows: rows.filter((row) => (row.outcome.rMultiple ?? Infinity) <= 0).length
  },
  comparisons: compareFeatureOutcomes(rows),
  rows,
  decision: decide(rows)
};

await fs.mkdir(RESULTS_DIR, { recursive: true });
await fs.writeFile(OUT_MANIFEST_JSON, `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(OUT_MANIFEST_MD, renderManifestMarkdown(manifest));
await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  verdict: report.decision.verdict,
  analyzedWindows: report.totals.analyzedWindows,
  rowsWithTrades: report.totals.rowsWithTrades,
  rowsWithBookDepth: report.totals.rowsWithBookDepth,
  absorptionProxyRows: report.totals.absorptionProxyRows,
  liquidityThinningProxyRows: report.totals.liquidityThinningProxyRows,
  report: OUT_JSON
}, null, 2));

function selectManifestRows(records, maxWindows, mode) {
  const sorted = records.toSorted((a, b) => a.entryTime - b.entryTime || a.id.localeCompare(b.id));
  if (mode === "chronological") return sorted.slice(0, maxWindows);
  if (mode === "bucket-targeted") return selectBucketTargetedRows(sorted, maxWindows);

  const selected = [];
  const usedIds = new Set();
  const strictGroups = groupRecords(sorted, (record) => [
    weekOf(record.entryTime),
    record.symbol,
    record.setup,
    record.direction,
    record.timeframe,
    btcGateState(record),
    outcomeBucket(record)
  ].join("|"));

  let groupCursor = 0;
  while (selected.length < maxWindows && strictGroups.some((group) => groupCursor < group.length)) {
    for (const group of strictGroups) {
      const candidate = group[groupCursor];
      if (!candidate || usedIds.has(candidate.id)) continue;
      if (!withinSoftLimits(candidate, selected)) continue;
      selected.push(candidate);
      usedIds.add(candidate.id);
      if (selected.length >= maxWindows) break;
    }
    groupCursor += 1;
  }

  while (selected.length < maxWindows) {
    const limitedCandidates = sorted.filter((record) => !usedIds.has(record.id) && withinSoftLimits(record, selected));
    const candidate = bestBalanceCandidate(limitedCandidates.length ? limitedCandidates : sorted.filter((record) => !usedIds.has(record.id)), selected);
    if (!candidate) break;
    selected.push(candidate);
    usedIds.add(candidate.id);
  }

  return selected.toSorted((a, b) => a.entryTime - b.entryTime || a.id.localeCompare(b.id));
}

function selectBucketTargetedRows(sorted, maxWindows) {
  const groups = groupRecords(sorted, comparableRecordBucketKey)
    .filter((group) => group.length >= COMPARABLE_BUCKET_MIN_ROWS)
    .map((group) => ({
      key: comparableRecordBucketKey(group[0]),
      rows: group,
      symbols: new Set(group.map((row) => row.symbol)).size,
      dates: new Set(group.map((row) => dateOf(row.entryTime))).size,
      positives: group.filter((row) => outcomeBucket(row) === "positive").length,
      negatives: group.filter((row) => outcomeBucket(row) === "negative").length
    }))
    .filter((group) => group.positives > 0 && group.negatives > 0)
    .toSorted((a, b) => (
      bucketTargetScore(b) - bucketTargetScore(a) ||
      a.rows[0].entryTime - b.rows[0].entryTime ||
      a.key.localeCompare(b.key)
    ));

  const selected = [];
  const usedIds = new Set();
  const perBucketLimit = Math.max(COMPARABLE_BUCKET_MIN_ROWS, Math.ceil(maxWindows / Math.max(1, Math.min(groups.length, 8))));

  for (const group of groups) {
    const bucketSelected = [];
    while (selected.length < maxWindows && bucketSelected.length < perBucketLimit) {
      const candidates = group.rows.filter((row) => !usedIds.has(row.id));
      const candidate = bestBalanceCandidate(candidates, bucketSelected);
      if (!candidate) break;
      selected.push(candidate);
      bucketSelected.push(candidate);
      usedIds.add(candidate.id);
    }
    if (selected.length >= maxWindows) break;
  }

  while (selected.length < maxWindows) {
    const candidate = bestBalanceCandidate(sorted.filter((record) => !usedIds.has(record.id)), selected);
    if (!candidate) break;
    selected.push(candidate);
    usedIds.add(candidate.id);
  }

  return selected.toSorted((a, b) => a.entryTime - b.entryTime || a.id.localeCompare(b.id));
}

function bucketTargetScore(group) {
  return Math.min(group.positives, group.negatives) * 4 + group.dates * 2 + group.symbols + Math.min(group.rows.length, 12);
}

function withinSoftLimits(record, selected) {
  const symbolCount = selected.filter((row) => row.symbol === record.symbol).length;
  const dateCount = selected.filter((row) => dateOf(row.entryTime) === dateOf(record.entryTime)).length;
  return symbolCount < SYMBOL_SOFT_LIMIT && dateCount < DATE_SOFT_LIMIT;
}

function bestBalanceCandidate(candidates, selected) {
  if (!candidates.length) return null;
  const counts = {
    date: countSelected(selected, (record) => dateOf(record.entryTime)),
    week: countSelected(selected, (record) => weekOf(record.entryTime)),
    symbol: countSelected(selected, (record) => record.symbol),
    setup: countSelected(selected, (record) => record.setup),
    direction: countSelected(selected, (record) => record.direction),
    timeframe: countSelected(selected, (record) => record.timeframe),
    btcGate: countSelected(selected, btcGateState),
    outcome: countSelected(selected, outcomeBucket)
  };

  return candidates
    .map((record) => ({
      record,
      score:
        scarcityScore(counts.date, dateOf(record.entryTime)) +
        scarcityScore(counts.week, weekOf(record.entryTime)) +
        scarcityScore(counts.symbol, record.symbol) +
        scarcityScore(counts.setup, record.setup) +
        scarcityScore(counts.direction, record.direction) +
        scarcityScore(counts.timeframe, record.timeframe) +
        scarcityScore(counts.btcGate, btcGateState(record)) +
        scarcityScore(counts.outcome, outcomeBucket(record))
    }))
    .toSorted((a, b) => b.score - a.score || a.record.entryTime - b.record.entryTime || a.record.id.localeCompare(b.record.id))[0]?.record ?? null;
}

function scarcityScore(counts, key) {
  return 1 / (1 + (counts.get(key) ?? 0));
}

function groupRecords(records, keyFn) {
  const groups = new Map();
  for (const record of records) {
    const key = keyFn(record);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return [...groups.values()].toSorted((a, b) => a[0].entryTime - b[0].entryTime || a[0].id.localeCompare(b[0].id));
}

function countSelected(records, keyFn) {
  const counts = new Map();
  for (const record of records) {
    const key = keyFn(record);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function buildManifest(rows, candidateRows) {
  const manifestRows = rows.map((record, index) => ({
    manifestIndex: index + 1,
    eventId: record.id,
    symbol: record.symbol,
    usdmSymbol: `${record.symbol}USDT`,
    setup: record.setup,
    direction: record.direction,
    timeframe: record.timeframe,
    regime: record.regime,
    btcGate: btcGateState(record),
    btcGatePass: record.btcGate?.pass ?? null,
    outcome: outcomeBucket(record),
    exitReason: record.exitReason,
    rMultiple: record.pnl?.rMultiple ?? null,
    netPnlUsd: record.pnl?.netPnlUsd ?? null,
    date: dateOf(record.entryTime),
    week: weekOf(record.entryTime),
    entryTimeIso: record.entryTimeIso,
    originalCluster: originalClusterEventIds.has(record.id)
  }));
  return {
    generatedAt: new Date().toISOString(),
    status: "frozen-balanced-demo-sim-manifest",
    sourceReplay: path.relative(ROOT, REPLAY_JSON),
    candidateRows,
    selectedRows: manifestRows.length,
    requestedRows: MAX_WINDOWS,
    sampleMode: SAMPLE_MODE,
    balancingDimensions: SAMPLE_MODE === "bucket-targeted"
      ? ["setup", "direction", "timeframe", "regime", "btcGate", "date", "symbol", "outcome"]
      : ["date", "week", "symbol", "setup", "direction", "timeframe", "btcGate", "outcome"],
    softLimits: {
      maxRowsPerSymbol: SYMBOL_SOFT_LIMIT,
      maxRowsPerDate: DATE_SOFT_LIMIT
    },
    originalClusterDefinition: `first ${ORIGINAL_CLUSTER_WINDOWS} chronological closed DEMO-SIM rows from the previous broader sample`,
    summary: summarizeManifest(manifestRows),
    rows: manifestRows
  };
}

function summarizeManifest(rows) {
  return {
    selectedRows: rows.length,
    dateRange: rows.length ? { first: rows[0].date, last: rows.at(-1).date } : null,
    dates: distribution(rows, (row) => row.date),
    weeks: distribution(rows, (row) => row.week),
    symbols: distribution(rows, (row) => row.symbol),
    setups: distribution(rows, (row) => row.setup),
    directions: distribution(rows, (row) => row.direction),
    timeframes: distribution(rows, (row) => row.timeframe),
    btcGates: distribution(rows, (row) => row.btcGate),
    outcomes: distribution(rows, (row) => row.outcome),
    comparableBuckets: distribution(rows, (row) => comparableManifestBucketKey(row)),
    originalClusterRows: rows.filter((row) => row.originalCluster).length,
    outsideOriginalClusterRows: rows.filter((row) => !row.originalCluster).length
  };
}

function distribution(rows, keyFn) {
  return [...countSelected(rows, keyFn).entries()]
    .map(([key, count]) => ({ key, count }))
    .toSorted((a, b) => b.count - a.count || String(a.key).localeCompare(String(b.key)));
}

async function analyzeRecord(record) {
  const symbol = `${record.symbol}USDT`;
  const entryMs = record.entryTime * 1_000;
  const startMs = entryMs - WINDOW_MINUTES_BEFORE * 60_000;
  const endMs = entryMs + WINDOW_MINUTES_AFTER * 60_000;
  const trades = await loadTrades(symbol, startMs, endMs);
  const bookDepth = await loadBookDepth(symbol, startMs, endMs);
  const tradeFeatures = summarizeTrades(record, trades, startMs, endMs);
  const bookDepthFeatures = summarizeBookDepth(bookDepth, entryMs);
  const candleOnlyFeatures = summarizeEntryCandle(record);
  const featureFlags = classifyFeatureFlags(record, tradeFeatures, bookDepthFeatures);
  return {
    eventId: record.id,
    symbol: record.symbol,
    usdmSymbol: symbol,
    setup: record.setup,
    direction: record.direction,
    timeframe: record.timeframe,
    tier: record.tier,
    regime: record.regime,
    entryTimeIso: record.entryTimeIso,
    entryPrice: record.entryPrice,
    outcome: {
      exitReason: record.exitReason,
      rMultiple: record.pnl?.rMultiple ?? null,
      netPnlUsd: record.pnl?.netPnlUsd ?? null,
      ambiguous: record.ambiguous
    },
    btcGate: record.btcGate ?? null,
    btcGateState: btcGateState(record),
    inOriginalCluster: originalClusterEventIds.has(record.id),
    archiveWindow: {
      status: trades.length || bookDepth.length ? "ok" : "no_archive_rows_returned",
      start: new Date(startMs).toISOString(),
      entry: new Date(entryMs).toISOString(),
      end: new Date(endMs).toISOString(),
      trades: trades.length,
      bookDepthRows: bookDepth.length
    },
    tradeFeatures,
    bookDepthFeatures,
    candleOnlyFeatures,
    featureFlags
  };
}

async function loadTrades(symbol, startMs, endMs) {
  const out = [];
  for (const date of daysBetween(startMs, endMs)) {
    const day = await fetchBinanceUsdmTradesDay(symbol, date, { startMs, endMs });
    for (const trade of day.trades) out.push(trade);
  }
  return out.sort((a, b) => a.transactTime - b.transactTime || a.tradeId - b.tradeId);
}

async function loadBookDepth(symbol, startMs, endMs) {
  const out = [];
  for (const date of daysBetween(startMs, endMs)) {
    const day = await fetchBinanceUsdmBookDepthDay(symbol, date, { startMs, endMs });
    for (const row of day.rows) out.push(row);
  }
  return out.sort((a, b) => a.timestamp - b.timestamp || a.percentage - b.percentage);
}

function summarizeTrades(record, trades, startMs, endMs) {
  if (!trades.length) {
    return {
      trades: 0,
      notional: 0,
      signedTakerDeltaNotional: 0,
      cvdPctOfNotional: null,
      cvdSlopeNotionalPerMin: null,
      tradeIntensityPerMin: 0,
      firstPrice: null,
      lastPrice: null,
      priceMoveBps: null,
      entryProgressBps: null,
      priceProgressPerAggressiveVolume: null
    };
  }

  const first = trades[0];
  const last = trades.at(-1);
  const minutes = Math.max(1, (endMs - startMs) / 60_000);
  const notional = sum(trades.map((trade) => trade.quoteQuantity));
  const signedTakerDeltaNotional = sum(trades.map((trade) => trade.signedNotional));
  const directionSign = record.direction === "long" ? 1 : -1;
  const entryProgressBps = directionSign * ((last.price - record.entryPrice) / record.entryPrice) * 10_000;
  return {
    trades: trades.length,
    notional: round(notional, 2),
    buyNotional: round(sum(trades.filter((trade) => trade.takerSide === "buy").map((trade) => trade.quoteQuantity)), 2),
    sellNotional: round(sum(trades.filter((trade) => trade.takerSide === "sell").map((trade) => trade.quoteQuantity)), 2),
    signedTakerDeltaNotional: round(signedTakerDeltaNotional, 2),
    cvdPctOfNotional: notional > 0 ? round((signedTakerDeltaNotional / notional) * 100, 4) : null,
    cvdSlopeNotionalPerMin: round(signedTakerDeltaNotional / minutes, 2),
    tradeIntensityPerMin: round(trades.length / minutes, 4),
    firstPrice: first.price,
    lastPrice: last.price,
    priceMoveBps: round(((last.price - first.price) / first.price) * 10_000, 4),
    entryProgressBps: round(entryProgressBps, 4),
    priceProgressPerAggressiveVolume: notional > 0 ? round(entryProgressBps / notional, 12) : null
  };
}

function summarizeBookDepth(rows, entryMs) {
  if (!rows.length) {
    return {
      rows: 0,
      preNearBidNotional: null,
      preNearAskNotional: null,
      postNearBidNotional: null,
      postNearAskNotional: null,
      nearBidNotionalChangePct: null,
      nearAskNotionalChangePct: null,
      postBidAskImbalance: null
    };
  }

  const pre = rows.filter((row) => row.timestamp < entryMs);
  const post = rows.filter((row) => row.timestamp >= entryMs);
  const preNear = summarizeDepthSide(pre);
  const postNear = summarizeDepthSide(post);
  const postTotal = postNear.bidNotional + postNear.askNotional;
  return {
    rows: rows.length,
    firstTimestamp: rows[0]?.timestampIso ?? null,
    lastTimestamp: rows.at(-1)?.timestampIso ?? null,
    preNearBidNotional: round(preNear.bidNotional, 2),
    preNearAskNotional: round(preNear.askNotional, 2),
    postNearBidNotional: round(postNear.bidNotional, 2),
    postNearAskNotional: round(postNear.askNotional, 2),
    nearBidNotionalChangePct: pctChange(preNear.bidNotional, postNear.bidNotional),
    nearAskNotionalChangePct: pctChange(preNear.askNotional, postNear.askNotional),
    postBidAskImbalance: postTotal > 0 ? round((postNear.bidNotional - postNear.askNotional) / postTotal, 6) : null
  };
}

function summarizeDepthSide(rows) {
  const nearRows = rows.filter((row) => row.absPercentage <= BOOK_DEPTH_NEAR_PCT);
  return {
    bidNotional: sum(nearRows.filter((row) => row.side === "bid").map((row) => row.notional)),
    askNotional: sum(nearRows.filter((row) => row.side === "ask").map((row) => row.notional))
  };
}

function classifyFeatureFlags(record, tradeFeatures, bookDepthFeatures) {
  const alignedDelta = record.direction === "long"
    ? tradeFeatures.signedTakerDeltaNotional > 0
    : tradeFeatures.signedTakerDeltaNotional < 0;
  const weakProgress = Number.isFinite(tradeFeatures.entryProgressBps) && tradeFeatures.entryProgressBps <= 2;
  const liquidityThinningProxy = record.direction === "long"
    ? (bookDepthFeatures.nearAskNotionalChangePct ?? 0) < -10
    : (bookDepthFeatures.nearBidNotionalChangePct ?? 0) < -10;
  return {
    alignedAggressiveFlow: alignedDelta,
    alignedCvd: alignedDelta,
    weakDirectionalProgress: weakProgress,
    absorptionProxy: alignedDelta && weakProgress,
    liquidityThinningProxy,
    usableForExpansion: tradeFeatures.trades > 0 && bookDepthFeatures.rows > 0
  };
}

function summarizeEntryCandle(record) {
  const range = record.candleRange ?? {};
  const high = Number(range.high);
  const low = Number(range.low);
  const open = Number(range.open);
  const close = Number(range.close);
  const entry = Number(record.entryPrice);
  const stop = Number(record.stopLossPrice);
  if (![high, low, entry, stop].every(Number.isFinite) || entry <= 0 || stop <= 0) {
    return {
      source: "entry-candle-range",
      available: false,
      limitation: "full-path MFE/MAE unavailable in DEMO-SIM row; entry candle range missing or invalid"
    };
  }

  const riskPct = Math.abs((entry - stop) / entry) * 100;
  const favorablePct = record.direction === "long"
    ? Math.max(0, ((high - entry) / entry) * 100)
    : Math.max(0, ((entry - low) / entry) * 100);
  const adversePct = record.direction === "long"
    ? Math.max(0, ((entry - low) / entry) * 100)
    : Math.max(0, ((high - entry) / entry) * 100);
  return {
    source: "entry-candle-range",
    available: true,
    limitation: "entry-candle-only proxy, not full path MFE/MAE",
    open,
    high,
    low,
    close,
    entryCandleFavorablePct: round(favorablePct, 4),
    entryCandleAdversePct: round(adversePct, 4),
    entryCandleNetOpportunityPct: round(favorablePct - adversePct, 4),
    riskPct: round(riskPct, 4),
    entryCandleFavorableR: riskPct > 0 ? round(favorablePct / riskPct, 4) : null,
    entryCandleAdverseR: riskPct > 0 ? round(adversePct / riskPct, 4) : null,
    entryCandleNetOpportunityR: riskPct > 0 ? round((favorablePct - adversePct) / riskPct, 4) : null
  };
}

function decide(rows) {
  const usable = rows.filter((row) => row.featureFlags.usableForExpansion).length;
  const analyzed = rows.filter((row) => row.archiveWindow.status === "ok").length;
  const absorption = rows.filter((row) => row.featureFlags.absorptionProxy);
  const liquidityThinning = rows.filter((row) => row.featureFlags.liquidityThinningProxy);
  const absorptionMeanR = mean(absorption.map((row) => row.outcome.rMultiple));
  const unflaggedMeanR = mean(rows.filter((row) => !row.featureFlags.absorptionProxy).map((row) => row.outcome.rMultiple));
  const outsideComparable = comparableFeatureLift(rows.filter((row) => !row.inOriginalCluster), "absorptionProxy");
  const absorptionKilled = outsideComparable.comparableRows >= COMPARABLE_BUCKET_MIN_ROWS && !(outsideComparable.meanLiftR > 0);
  const verdict = usable === 0
    ? "usdm_archive_features_sample_empty"
    : absorptionKilled
      ? "absorption_context_only_no_candidate"
      : SAMPLE_MODE === "bucket-targeted" && usable >= 60
        ? "targeted_usdm_absorption_falsification_watch_only_no_promotion"
        : usable >= 60
        ? "balanced_usdm_archive_absorption_watch_only_no_promotion"
        : usable >= 20
          ? "usdm_archive_features_broader_sample_ready_no_promotion"
          : "usdm_archive_features_sample_ready_no_promotion";
  const sampleDescription = SAMPLE_MODE === "bucket-targeted" ? "bucket-targeted" : "balanced";
  return {
    verdict,
    reason: usable > 0
      ? `USD-M public archives joined to ${usable}/${rows.length} ${sampleDescription} frozen DEMO-SIM rows with both futures trades and coarse bookDepth. Absorption proxy mean R=${formatNumber(absorptionMeanR)} vs unflagged mean R=${formatNumber(unflaggedMeanR)}; outside the original cluster, comparable-bucket absorption lift is ${formatNumber(outsideComparable.meanLiftR)} R across ${outsideComparable.comparableRows} rows. Absorption is ${absorptionKilled ? "context-only by kill condition" : "watch-only and not promoted"}.`
      : "No usable USD-M trade + bookDepth rows were returned for the selected frozen DEMO-SIM windows.",
    killCondition: {
      rule: "if absorption lift disappears outside the original clustered sample, mark absorption as context-only rather than a candidate",
      originalClusterRows: rows.filter((row) => row.inOriginalCluster).length,
      outsideOriginalClusterRows: rows.filter((row) => !row.inOriginalCluster).length,
      outsideComparableAbsorption: outsideComparable,
      absorptionContextOnly: absorptionKilled,
      absorptionCandidate: false
    },
    candidateAdded: false,
    absorptionCandidateAdded: false,
    watcherGateChangeProposed: false,
    demoSimLogicChangeProposed: false,
    noLiveChange: true,
    analyzedWindows: analyzed,
    absorptionProxyRows: absorption.length,
    liquidityThinningProxyRows: liquidityThinning.length
  };
}

function renderMarkdown(report) {
  const lines = [
    "# USD-M Orderflow DEMO-SIM Batch",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Research-only Binance USD-M archive batch joining futures trades and coarse bookDepth rows to frozen DEMO-SIM events. It does not change live alerts, watcher gates, paper/demo logic, schedulers, thresholds, sizing, TP/SL, execution, accounts, keys, paid services, public posting, or strategy status.",
    "",
    "## Decision",
    "",
    `- Verdict: ${report.decision.verdict}`,
    `- Reason: ${report.decision.reason}`,
    `- Manifest: ${report.source.manifest}`,
    `- Analyzed windows: ${report.totals.analyzedWindows}/${report.totals.requestedWindows}`,
    `- Rows with trades/bookDepth: ${report.totals.rowsWithTrades}/${report.totals.rowsWithBookDepth}`,
    `- Positive/negative outcome rows: ${report.totals.positiveOutcomeRows}/${report.totals.negativeOutcomeRows}`,
    `- Absorption proxy rows: ${report.totals.absorptionProxyRows}`,
    `- Liquidity-thinning proxy rows: ${report.totals.liquidityThinningProxyRows}`,
    `- Aligned CVD rows: ${report.totals.alignedCvdRows}`,
    `- Rows with entry-candle excursion proxy: ${report.totals.rowsWithEntryCandleExcursion}`,
    `- Original/outside-cluster rows: ${report.totals.originalClusterRows}/${report.totals.outsideOriginalClusterRows}`,
    `- Absorption kill condition: ${report.decision.killCondition.absorptionContextOnly ? "triggered, context-only" : "not triggered, still watch-only/no-promotion"}`,
    "",
    "## Feature Outcome Comparison",
    "",
    "| Slice | Rows | Win rate | Mean R | Median R | Net PnL USD |",
    "| --- | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const slice of report.comparisons.slices) {
    lines.push(`| ${slice.label} | ${slice.rows} | ${slice.winRatePct ?? "n/a"} | ${slice.meanR ?? "n/a"} | ${slice.medianR ?? "n/a"} | ${slice.netPnlUsd ?? "n/a"} |`);
  }

  lines.push(
    "",
    "## Comparable Setup/Regime Buckets",
    "",
    "Feature comparisons below are restricted to buckets with the same setup, direction, timeframe, market regime, and BTC gate, and only buckets that have both flagged and unflagged rows.",
    "",
    "| Feature | Scope | Buckets | Rows | Flagged rows | Flagged mean R | Unflagged mean R | Mean lift R |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |"
  );

  for (const comparison of report.comparisons.comparableFeatureSummary) {
    lines.push(`| ${comparison.feature} | ${comparison.scope} | ${comparison.comparableBuckets} | ${comparison.comparableRows} | ${comparison.flaggedRows} | ${comparison.flaggedMeanR ?? "n/a"} | ${comparison.unflaggedMeanR ?? "n/a"} | ${comparison.meanLiftR ?? "n/a"} |`);
  }

  lines.push(
    "",
    "## Entry-Candle Excursion Proxy",
    "",
    "This is an entry-candle-only candle baseline proxy from the DEMO-SIM row's candle range, not full-path MFE/MAE.",
    "",
    "| Feature | Scope | Buckets | Rows | Flagged mean net opportunity R | Unflagged mean net opportunity R | Mean lift R |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: |"
  );

  for (const comparison of report.comparisons.comparableCandleSummary) {
    lines.push(`| ${comparison.feature} | ${comparison.scope} | ${comparison.comparableBuckets} | ${comparison.comparableRows} | ${comparison.flaggedMeanNetOpportunityR ?? "n/a"} | ${comparison.unflaggedMeanNetOpportunityR ?? "n/a"} | ${comparison.meanNetOpportunityLiftR ?? "n/a"} |`);
  }

  lines.push(
    "",
    "## Comparable Bucket Details",
    "",
    "| Feature | Scope | Bucket | Rows | Flagged rows | Flagged mean R | Unflagged mean R | Lift R |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |"
  );

  for (const bucket of report.comparisons.comparableFeatureBuckets) {
    lines.push(`| ${bucket.feature} | ${bucket.scope} | ${bucket.bucket} | ${bucket.rows} | ${bucket.flaggedRows} | ${bucket.flaggedMeanR ?? "n/a"} | ${bucket.unflaggedMeanR ?? "n/a"} | ${bucket.liftR ?? "n/a"} |`);
  }

  lines.push(
    "",
    "## Rows",
    "",
    "| Event | Setup | Outcome R | Trades | Book rows | Delta notional | CVD % | Entry progress bps | Entry candle net opp R | Bid depth chg % | Ask depth chg % | Flags |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  );

  for (const row of report.rows) {
    const flags = Object.entries(row.featureFlags)
      .filter(([, value]) => value === true)
      .map(([key]) => key)
      .join(", ") || "none";
    lines.push(`| ${row.eventId} | ${row.setup} ${row.direction} | ${row.outcome.rMultiple ?? "n/a"} | ${row.tradeFeatures.trades} | ${row.bookDepthFeatures.rows} | ${row.tradeFeatures.signedTakerDeltaNotional} | ${row.tradeFeatures.cvdPctOfNotional ?? "n/a"} | ${row.tradeFeatures.entryProgressBps ?? "n/a"} | ${row.candleOnlyFeatures?.entryCandleNetOpportunityR ?? "n/a"} | ${row.bookDepthFeatures.nearBidNotionalChangePct ?? "n/a"} | ${row.bookDepthFeatures.nearAskNotionalChangePct ?? "n/a"} | ${flags} |`);
  }

  lines.push(
    "",
    "## Interpretation",
    "",
    "- `absorptionProxy` means aggressive flow aligned with the demo-sim direction, but price progress from entry stayed weak inside the sampled window.",
    "- `liquidityThinningProxy` means the relevant near-side percentage-band bookDepth notional fell by more than 10% from pre-entry to post-entry.",
    "- `alignedCvd` means signed taker delta agrees with the DEMO-SIM trade direction.",
    "- Entry-candle net opportunity R is a candle-only proxy from the entry candle range. It is not a full-path MFE/MAE replacement.",
    "- Feature/outcome comparisons are descriptive only and comparable-bucket comparisons are deliberately bucketed by setup/regime context. They reuse the existing DEMO-SIM replay outcome labels and do not introduce MFE/MAE, fill modeling, new thresholds, or signal gating.",
    "- Binance `bookDepth` is percentage-band aggregate depth, not true L2 replay. It is useful as a liquidity-surface proxy beside tape, not as a replacement for Tardis/OKX true depth samples.",
    "- The kill condition is explicit: if absorption lift disappears outside the original clustered sample, absorption is context-only rather than a candidate.",
    "",
    "## Boundary",
    "",
    "No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed."
  );

  return `${lines.join("\n")}\n`;
}

function renderManifestMarkdown(manifest) {
  const lines = [
    SAMPLE_MODE === "bucket-targeted" ? "# USD-M Orderflow Targeted Comparable Manifest" : "# USD-M Orderflow Balanced Manifest",
    "",
    `Generated: ${manifest.generatedAt}`,
    "",
    SAMPLE_MODE === "bucket-targeted"
      ? "Frozen DEMO-SIM manifest for research-only Binance USD-M public archive joins. It is targeted toward comparable setup/regime buckets."
      : "Frozen DEMO-SIM manifest for research-only Binance USD-M public archive joins. It is diversified by date/week, symbol, setup, direction, timeframe, BTC gate, and outcome.",
    "",
    "## Summary",
    "",
    `- Selected rows: ${manifest.selectedRows}/${manifest.candidateRows}`,
    `- Date range: ${manifest.summary.dateRange?.first ?? "n/a"} to ${manifest.summary.dateRange?.last ?? "n/a"}`,
    `- Original/outside-cluster rows: ${manifest.summary.originalClusterRows}/${manifest.summary.outsideOriginalClusterRows}`,
    "",
    "## Distributions",
    "",
    `- Weeks: ${formatDistribution(manifest.summary.weeks)}`,
    `- Symbols: ${formatDistribution(manifest.summary.symbols)}`,
    `- Setups: ${formatDistribution(manifest.summary.setups)}`,
    `- Directions: ${formatDistribution(manifest.summary.directions)}`,
    `- Timeframes: ${formatDistribution(manifest.summary.timeframes)}`,
    `- BTC gates: ${formatDistribution(manifest.summary.btcGates)}`,
    `- Outcomes: ${formatDistribution(manifest.summary.outcomes)}`,
    `- Comparable buckets: ${formatDistribution(manifest.summary.comparableBuckets).slice(0, 900)}`,
    "",
    "## Rows",
    "",
    "| # | Event | Date | Week | Symbol | Setup | Direction | TF | BTC gate | Outcome | R | Original cluster |",
    "| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |"
  ];

  for (const row of manifest.rows) {
    lines.push(`| ${row.manifestIndex} | ${row.eventId} | ${row.date} | ${row.week} | ${row.symbol} | ${row.setup} | ${row.direction} | ${row.timeframe} | ${row.btcGate} | ${row.outcome} | ${row.rMultiple ?? "n/a"} | ${row.originalCluster ? "yes" : "no"} |`);
  }

  lines.push(
    "",
    "## Boundary",
    "",
    "Manifest creation only. No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed."
  );

  return `${lines.join("\n")}\n`;
}

function formatDistribution(rows) {
  return rows.map((row) => `${row.key}=${row.count}`).join(", ");
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

function dateOf(entryTimeSeconds) {
  return new Date(entryTimeSeconds * 1_000).toISOString().slice(0, 10);
}

function weekOf(entryTimeSeconds) {
  const date = new Date(entryTimeSeconds * 1_000);
  const day = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfWeek = new Date(day).getUTCDay() || 7;
  const thursday = day + (4 - dayOfWeek) * 24 * 60 * 60 * 1000;
  const yearStart = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1);
  const week = Math.ceil(((thursday - yearStart) / 86_400_000 + 1) / 7);
  return `${new Date(thursday).getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function btcGateState(record) {
  return record.symbol === "BTC" ? "BTC_SELF" : record.btcGate?.state ?? "BTC_STALE";
}

function comparableRecordBucketKey(record) {
  return [record.setup, record.direction, record.timeframe, record.regime, btcGateState(record)].join("|");
}

function comparableManifestBucketKey(row) {
  return [row.setup, row.direction, row.timeframe, row.regime, row.btcGate].join("|");
}

function outcomeBucket(record) {
  const r = record.pnl?.rMultiple;
  if (!Number.isFinite(r)) return "unknown";
  if (r > 0) return "positive";
  if (r < 0) return "negative";
  return "flat";
}

function pctChange(before, after) {
  if (!Number.isFinite(before) || !Number.isFinite(after) || before === 0) return null;
  return round(((after - before) / before) * 100, 4);
}

function compareFeatureOutcomes(rows) {
  const slices = [
    ["all", rows],
    ["absorptionProxy=true", rows.filter((row) => row.featureFlags.absorptionProxy)],
    ["absorptionProxy=false", rows.filter((row) => !row.featureFlags.absorptionProxy)],
    ["liquidityThinningProxy=true", rows.filter((row) => row.featureFlags.liquidityThinningProxy)],
    ["liquidityThinningProxy=false", rows.filter((row) => !row.featureFlags.liquidityThinningProxy)],
    ["alignedCvd=true", rows.filter((row) => row.featureFlags.alignedCvd)],
    ["alignedCvd=false", rows.filter((row) => !row.featureFlags.alignedCvd)]
  ].map(([label, sliceRows]) => summarizeOutcomeSlice(label, sliceRows));

  const features = ["absorptionProxy", "liquidityThinningProxy", "alignedCvd"];
  const scopes = [
    ["all", rows],
    ["outsideOriginalCluster", rows.filter((row) => !row.inOriginalCluster)]
  ];
  const comparableFeatureBuckets = [];
  const comparableFeatureSummary = [];
  const comparableCandleSummary = [];

  for (const [scope, scopeRows] of scopes) {
    for (const feature of features) {
      const buckets = comparableBuckets(scopeRows, feature).map((bucket) => ({ feature, scope, ...bucket }));
      comparableFeatureBuckets.push(...buckets);
      comparableFeatureSummary.push({ feature, scope, ...summarizeComparableBuckets(buckets) });
      comparableCandleSummary.push({ feature, scope, ...summarizeComparableCandleBuckets(buckets) });
    }
  }

  return { slices, comparableFeatureSummary, comparableFeatureBuckets, comparableCandleSummary };
}

function comparableFeatureLift(rows, feature) {
  return summarizeComparableBuckets(comparableBuckets(rows, feature));
}

function comparableBuckets(rows, feature) {
  const bucketMap = new Map();
  for (const row of rows.filter((item) => item.featureFlags.usableForExpansion)) {
    const key = [row.setup, row.direction, row.timeframe, row.regime, row.btcGateState].join("|");
    if (!bucketMap.has(key)) bucketMap.set(key, []);
    bucketMap.get(key).push(row);
  }

  return [...bucketMap.entries()]
    .map(([bucket, bucketRows]) => {
      const flagged = bucketRows.filter((row) => row.featureFlags[feature]);
      const unflagged = bucketRows.filter((row) => !row.featureFlags[feature]);
      const flaggedMeanR = mean(flagged.map((row) => row.outcome.rMultiple));
      const unflaggedMeanR = mean(unflagged.map((row) => row.outcome.rMultiple));
      return {
        bucket,
        rows: bucketRows.length,
        flaggedRows: flagged.length,
        unflaggedRows: unflagged.length,
        flaggedMeanR: round(flaggedMeanR, 4),
        unflaggedMeanR: round(unflaggedMeanR, 4),
        liftR: round(Number.isFinite(flaggedMeanR) && Number.isFinite(unflaggedMeanR) ? flaggedMeanR - unflaggedMeanR : null, 4),
        flaggedCandleNetOpportunityR: flagged.map((row) => row.candleOnlyFeatures?.entryCandleNetOpportunityR).filter(Number.isFinite),
        unflaggedCandleNetOpportunityR: unflagged.map((row) => row.candleOnlyFeatures?.entryCandleNetOpportunityR).filter(Number.isFinite)
      };
    })
    .filter((bucket) => bucket.rows >= COMPARABLE_BUCKET_MIN_ROWS && bucket.flaggedRows > 0 && bucket.unflaggedRows > 0)
    .toSorted((a, b) => b.rows - a.rows || a.bucket.localeCompare(b.bucket));
}

function summarizeComparableBuckets(buckets) {
  const flaggedRows = buckets.flatMap((bucket) => Array(bucket.flaggedRows).fill(bucket.flaggedMeanR)).filter(Number.isFinite);
  const unflaggedRows = buckets.flatMap((bucket) => Array(bucket.unflaggedRows).fill(bucket.unflaggedMeanR)).filter(Number.isFinite);
  const comparableRows = buckets.reduce((total, bucket) => total + bucket.rows, 0);
  const weightedLiftNumerator = buckets.reduce((total, bucket) => (
    Number.isFinite(bucket.liftR) ? total + bucket.liftR * bucket.rows : total
  ), 0);
  return {
    comparableBuckets: buckets.length,
    comparableRows,
    flaggedRows: buckets.reduce((total, bucket) => total + bucket.flaggedRows, 0),
    unflaggedRows: buckets.reduce((total, bucket) => total + bucket.unflaggedRows, 0),
    flaggedMeanR: round(mean(flaggedRows), 4),
    unflaggedMeanR: round(mean(unflaggedRows), 4),
    meanLiftR: comparableRows ? round(weightedLiftNumerator / comparableRows, 4) : null
  };
}

function summarizeComparableCandleBuckets(buckets) {
  const comparableRows = buckets.reduce((total, bucket) => total + bucket.rows, 0);
  const flagged = [];
  const unflagged = [];
  for (const bucket of buckets) {
    flagged.push(...(bucket.flaggedCandleNetOpportunityR ?? []));
    unflagged.push(...(bucket.unflaggedCandleNetOpportunityR ?? []));
  }
  const flaggedMean = mean(flagged);
  const unflaggedMean = mean(unflagged);
  return {
    comparableBuckets: buckets.length,
    comparableRows,
    flaggedMeanNetOpportunityR: round(flaggedMean, 4),
    unflaggedMeanNetOpportunityR: round(unflaggedMean, 4),
    meanNetOpportunityLiftR: round(Number.isFinite(flaggedMean) && Number.isFinite(unflaggedMean) ? flaggedMean - unflaggedMean : null, 4)
  };
}

function summarizeOutcomeSlice(label, rows) {
  const rMultiples = rows.map((row) => row.outcome.rMultiple).filter(Number.isFinite);
  const netPnls = rows.map((row) => row.outcome.netPnlUsd).filter(Number.isFinite);
  const wins = rMultiples.filter((value) => value > 0).length;
  return {
    label,
    rows: rows.length,
    winRatePct: rMultiples.length ? round((wins / rMultiples.length) * 100, 2) : null,
    meanR: round(mean(rMultiples), 4),
    medianR: round(median(rMultiples), 4),
    netPnlUsd: round(sum(netPnls), 2)
  };
}

function mean(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? sum(finite) / finite.length : null;
}

function median(values) {
  const finite = values.filter(Number.isFinite).toSorted((a, b) => a - b);
  if (!finite.length) return null;
  const mid = Math.floor(finite.length / 2);
  return finite.length % 2 ? finite[mid] : (finite[mid - 1] + finite[mid]) / 2;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(4) : "n/a";
}
