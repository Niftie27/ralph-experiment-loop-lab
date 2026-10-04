#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RALPH_ROOT = path.resolve(ROOT, "../..");
const ALERT_EDGE_ROOT = path.join(RALPH_ROOT, "experiments", "btc-eth-alert-edge");
const CANDLE_DIR = path.join(ALERT_EDGE_ROOT, "data", "candles");
const CONFIG_PATH = path.join(ALERT_EDGE_ROOT, "config.default.json");
const REPLAY_JSON = path.join(ALERT_EDGE_ROOT, "results", "historical-demo-sim-replay.json");
const TARGETED_BATCH_JSON = path.join(ROOT, "results", "usdm-orderflow-targeted-comparable-demo-sim-batch.json");
const OUT_JSON = path.join(ROOT, "results", "usdm-orderflow-targeted-full-path-mfe-mae-rescore.json");
const OUT_MD = path.join(ROOT, "results", "usdm-orderflow-targeted-full-path-mfe-mae-rescore.md");

const COMPARABLE_BUCKET_MIN_ROWS = 4;
const FEATURES = ["absorptionProxy", "alignedCvd", "liquidityThinningProxy"];
const OPPORTUNITY_THRESHOLDS_R = [0.5, 1, 2];

const [config, replay, targetedBatch] = await Promise.all([
  readJson(CONFIG_PATH),
  readJson(REPLAY_JSON),
  readJson(TARGETED_BATCH_JSON)
]);

const symbols = new Map(config.symbols.map((symbol) => [symbol.symbol, symbol]));
const replayById = new Map((replay.records ?? []).map((record) => [record.id, record]));
const candleCache = new Map();

const rows = [];
for (const targetedRow of targetedBatch.rows ?? []) {
  const replayRecord = replayById.get(targetedRow.eventId);
  rows.push(await rescoreRow(targetedRow, replayRecord));
}

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  purpose: "Full-path candle-series MFE/MAE rescore of the existing targeted USD-M absorption sample, using the same canonical candle source resolution as the historical DEMO-SIM replay.",
  sources: {
    replay: path.relative(ROOT, REPLAY_JSON),
    targetedBatch: path.relative(ROOT, TARGETED_BATCH_JSON),
    candleDirectory: path.relative(ROOT, CANDLE_DIR),
    candleSourceResolution: [
      "binance-spot-{symbol}USDT-{timeframe}.json when available",
      "coinbase-{productId}-{timeframe}.json",
      "{productId}-{timeframe}.json fallback"
    ]
  },
  parameters: {
    comparableBucketMinRows: COMPARABLE_BUCKET_MIN_ROWS,
    opportunityThresholdsR: OPPORTUNITY_THRESHOLDS_R,
    pathStart: "first candle after DEMO-SIM entry candle",
    pathEnd: "DEMO-SIM exit candle inclusive",
    riskR: "abs(entryPrice - stopLossPrice) / entryPrice; fees are preserved in finalR but not subtracted from gross MFE/MAE"
  },
  totals: summarizeTotals(rows),
  comparisons: compareFeatures(rows),
  rows,
  decision: decide(rows)
};

await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  verdict: report.decision.verdict,
  rows: report.rows.length,
  rowsWithFullPath: report.totals.rowsWithFullPath,
  absorptionOutsideFullPathLiftR: report.decision.outsideAbsorption?.meanFinalRLift ?? null,
  absorptionOutsideMfeLiftR: report.decision.outsideAbsorption?.meanMfeRLift ?? null,
  report: path.relative(ROOT, OUT_JSON)
}, null, 2));

async function rescoreRow(targetedRow, record) {
  const fullPath = record ? await measureFullPath(record) : unavailablePath("replay_record_missing");
  return {
    ...targetedRow,
    replay: record ? {
      exitTimeIso: record.exitTimeIso ?? null,
      exitPrice: record.exitPrice ?? null,
      takeProfitPrice: record.takeProfitPrice ?? null,
      stopLossPrice: record.stopLossPrice ?? null,
      timeExitBars: record.timeExitBars ?? null
    } : null,
    fullPath
  };
}

async function measureFullPath(record) {
  const candlesLoaded = await loadCandlesForRecord(record);
  if (!candlesLoaded.candles.length) return unavailablePath("candle_source_missing", candlesLoaded);

  const { candles } = candlesLoaded;
  const startIndex = candles.findIndex((candle) => candle.time === record.entryTime);
  const exitIndex = candles.findIndex((candle) => candle.time === record.exitTime);
  if (startIndex < 0) return unavailablePath("entry_candle_missing", candlesLoaded);
  if (exitIndex < 0) return unavailablePath("exit_candle_missing", candlesLoaded);
  if (exitIndex <= startIndex) return unavailablePath("no_post_entry_path_candles", candlesLoaded);

  const pathCandles = candles.slice(startIndex + 1, exitIndex + 1);
  const entry = Number(record.entryPrice);
  const stop = Number(record.stopLossPrice);
  if (!Number.isFinite(entry) || !Number.isFinite(stop) || entry <= 0 || stop <= 0 || entry === stop) {
    return unavailablePath("invalid_entry_or_stop", candlesLoaded);
  }

  const riskPct = Math.abs((entry - stop) / entry) * 100;
  let best = null;
  let worst = null;

  for (const [offset, candle] of pathCandles.entries()) {
    const barsFromEntry = offset + 1;
    const favorablePct = record.direction === "long"
      ? Math.max(0, ((candle.high - entry) / entry) * 100)
      : Math.max(0, ((entry - candle.low) / entry) * 100);
    const adversePct = record.direction === "long"
      ? Math.max(0, ((entry - candle.low) / entry) * 100)
      : Math.max(0, ((candle.high - entry) / entry) * 100);

    if (!best || favorablePct > best.pct) {
      best = { pct: favorablePct, candle, barsFromEntry };
    }
    if (!worst || adversePct > worst.pct) {
      worst = { pct: adversePct, candle, barsFromEntry };
    }
  }

  const finalR = record.pnl?.rMultiple ?? null;
  const mfeR = riskPct > 0 ? best.pct / riskPct : null;
  const maeR = riskPct > 0 ? worst.pct / riskPct : null;
  const finalPct = record.direction === "long"
    ? ((record.exitPrice - entry) / entry) * 100
    : ((entry - record.exitPrice) / entry) * 100;
  const loser = Number.isFinite(finalR) && finalR <= 0;
  const winner = Number.isFinite(finalR) && finalR > 0;

  return {
    available: true,
    source: path.relative(ROOT, candlesLoaded.sourceFile),
    candlesInPath: pathCandles.length,
    entryCandleTimeIso: iso(record.entryTime),
    firstPathCandleTimeIso: iso(pathCandles[0].time),
    exitCandleTimeIso: iso(record.exitTime),
    riskPct: round(riskPct, 4),
    finalR,
    finalMovePct: round(finalPct, 4),
    mfePct: round(best.pct, 4),
    maePct: round(worst.pct, 4),
    mfeR: round(mfeR, 4),
    maeR: round(maeR, 4),
    netPathOpportunityR: round(Number.isFinite(mfeR) && Number.isFinite(maeR) ? mfeR - maeR : null, 4),
    barsToMfe: best.barsFromEntry,
    barsToMae: worst.barsFromEntry,
    timeToMfeIso: iso(best.candle.time),
    timeToMaeIso: iso(worst.candle.time),
    minutesToMfe: round(((best.candle.time - record.entryTime) / 60), 2),
    minutesToMae: round(((worst.candle.time - record.entryTime) / 60), 2),
    loserOpportunity: Object.fromEntries(OPPORTUNITY_THRESHOLDS_R.map((threshold) => [`offered${threshold}RBeforeExit`, loser && Number.isFinite(mfeR) && mfeR >= threshold])),
    winnerDrawdown: Object.fromEntries(OPPORTUNITY_THRESHOLDS_R.map((threshold) => [`suffered${threshold}RBeforeExit`, winner && Number.isFinite(maeR) && maeR >= threshold])),
    exitReason: record.exitReason,
    ambiguous: record.ambiguous === true
  };
}

async function loadCandlesForRecord(record) {
  const symbolConfig = symbols.get(record.symbol);
  const candidates = [];
  if (symbolConfig?.binanceSpotSymbol) {
    candidates.push(path.join(CANDLE_DIR, `binance-spot-${symbolConfig.binanceSpotSymbol}-${record.timeframe}.json`));
  }
  if (record.productId) {
    candidates.push(path.join(CANDLE_DIR, `coinbase-${record.productId}-${record.timeframe}.json`));
    candidates.push(path.join(CANDLE_DIR, `${record.productId}-${record.timeframe}.json`));
  }

  for (const file of candidates) {
    const key = file;
    if (!candleCache.has(key)) candleCache.set(key, await readOptionalJson(file));
    const candles = candleCache.get(key);
    if (Array.isArray(candles) && candles.length) return { candles, sourceFile: file };
  }

  return { candles: [], sourceFile: null };
}

function unavailablePath(reason, loaded = {}) {
  return {
    available: false,
    reason,
    source: loaded.sourceFile ? path.relative(ROOT, loaded.sourceFile) : null
  };
}

function summarizeTotals(rows) {
  const fullPathRows = rows.filter((row) => row.fullPath?.available);
  return {
    rows: rows.length,
    rowsWithFullPath: fullPathRows.length,
    rowsMissingFullPath: rows.length - fullPathRows.length,
    rowsWithAbsorptionProxy: rows.filter((row) => row.featureFlags?.absorptionProxy).length,
    rowsWithAlignedCvd: rows.filter((row) => row.featureFlags?.alignedCvd).length,
    rowsWithLiquidityThinningProxy: rows.filter((row) => row.featureFlags?.liquidityThinningProxy).length,
    losingRowsOfferedHalfR: fullPathRows.filter((row) => row.fullPath.loserOpportunity?.["offered0.5RBeforeExit"]).length,
    losingRowsOfferedOneR: fullPathRows.filter((row) => row.fullPath.loserOpportunity?.["offered1RBeforeExit"]).length,
    losingRowsOfferedTwoR: fullPathRows.filter((row) => row.fullPath.loserOpportunity?.["offered2RBeforeExit"]).length,
    winningRowsSufferedHalfR: fullPathRows.filter((row) => row.fullPath.winnerDrawdown?.["suffered0.5RBeforeExit"]).length,
    winningRowsSufferedOneR: fullPathRows.filter((row) => row.fullPath.winnerDrawdown?.["suffered1RBeforeExit"]).length,
    winningRowsSufferedTwoR: fullPathRows.filter((row) => row.fullPath.winnerDrawdown?.["suffered2RBeforeExit"]).length,
    meanMfeR: round(mean(fullPathRows.map((row) => row.fullPath.mfeR)), 4),
    meanMaeR: round(mean(fullPathRows.map((row) => row.fullPath.maeR)), 4),
    meanNetPathOpportunityR: round(mean(fullPathRows.map((row) => row.fullPath.netPathOpportunityR)), 4)
  };
}

function compareFeatures(rows) {
  const slices = [
    ["all", rows],
    ["absorptionProxy=true", rows.filter((row) => row.featureFlags?.absorptionProxy)],
    ["absorptionProxy=false", rows.filter((row) => !row.featureFlags?.absorptionProxy)],
    ["alignedCvd=true", rows.filter((row) => row.featureFlags?.alignedCvd)],
    ["alignedCvd=false", rows.filter((row) => !row.featureFlags?.alignedCvd)],
    ["liquidityThinningProxy=true", rows.filter((row) => row.featureFlags?.liquidityThinningProxy)],
    ["liquidityThinningProxy=false", rows.filter((row) => !row.featureFlags?.liquidityThinningProxy)]
  ].map(([label, sliceRows]) => summarizeFullPathSlice(label, sliceRows));

  const scopes = [
    ["all", rows],
    ["outsideOriginalCluster", rows.filter((row) => !row.inOriginalCluster)]
  ];
  const comparableBuckets = [];
  const comparableSummary = [];

  for (const [scope, scopeRows] of scopes) {
    for (const feature of FEATURES) {
      const buckets = comparableFeatureBuckets(scopeRows, feature).map((bucket) => ({ feature, scope, ...bucket }));
      comparableBuckets.push(...buckets);
      comparableSummary.push({ feature, scope, ...summarizeComparableBuckets(buckets) });
    }
  }

  return { slices, comparableSummary, comparableBuckets };
}

function comparableFeatureBuckets(rows, feature) {
  const map = new Map();
  for (const row of rows.filter((item) => item.featureFlags?.usableForExpansion && item.fullPath?.available)) {
    const key = [row.setup, row.direction, row.timeframe, row.regime, row.btcGateState].join("|");
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }

  return [...map.entries()]
    .map(([bucket, bucketRows]) => {
      const flagged = bucketRows.filter((row) => row.featureFlags?.[feature]);
      const unflagged = bucketRows.filter((row) => !row.featureFlags?.[feature]);
      const flaggedFinalR = mean(flagged.map((row) => row.outcome?.rMultiple));
      const unflaggedFinalR = mean(unflagged.map((row) => row.outcome?.rMultiple));
      const flaggedMfeR = mean(flagged.map((row) => row.fullPath?.mfeR));
      const unflaggedMfeR = mean(unflagged.map((row) => row.fullPath?.mfeR));
      const flaggedMaeR = mean(flagged.map((row) => row.fullPath?.maeR));
      const unflaggedMaeR = mean(unflagged.map((row) => row.fullPath?.maeR));
      const flaggedNetOppR = mean(flagged.map((row) => row.fullPath?.netPathOpportunityR));
      const unflaggedNetOppR = mean(unflagged.map((row) => row.fullPath?.netPathOpportunityR));
      return {
        bucket,
        rows: bucketRows.length,
        flaggedRows: flagged.length,
        unflaggedRows: unflagged.length,
        flaggedFinalR: round(flaggedFinalR, 4),
        unflaggedFinalR: round(unflaggedFinalR, 4),
        finalRLift: round(diff(flaggedFinalR, unflaggedFinalR), 4),
        flaggedMfeR: round(flaggedMfeR, 4),
        unflaggedMfeR: round(unflaggedMfeR, 4),
        mfeRLift: round(diff(flaggedMfeR, unflaggedMfeR), 4),
        flaggedMaeR: round(flaggedMaeR, 4),
        unflaggedMaeR: round(unflaggedMaeR, 4),
        maeRLift: round(diff(flaggedMaeR, unflaggedMaeR), 4),
        flaggedNetPathOpportunityR: round(flaggedNetOppR, 4),
        unflaggedNetPathOpportunityR: round(unflaggedNetOppR, 4),
        netPathOpportunityLiftR: round(diff(flaggedNetOppR, unflaggedNetOppR), 4)
      };
    })
    .filter((bucket) => bucket.rows >= COMPARABLE_BUCKET_MIN_ROWS && bucket.flaggedRows > 0 && bucket.unflaggedRows > 0)
    .toSorted((a, b) => b.rows - a.rows || a.bucket.localeCompare(b.bucket));
}

function summarizeComparableBuckets(buckets) {
  const rows = buckets.reduce((total, bucket) => total + bucket.rows, 0);
  return {
    comparableBuckets: buckets.length,
    comparableRows: rows,
    flaggedRows: buckets.reduce((total, bucket) => total + bucket.flaggedRows, 0),
    unflaggedRows: buckets.reduce((total, bucket) => total + bucket.unflaggedRows, 0),
    flaggedFinalR: weightedMean(buckets, "flaggedFinalR", "flaggedRows"),
    unflaggedFinalR: weightedMean(buckets, "unflaggedFinalR", "unflaggedRows"),
    meanFinalRLift: weightedMean(buckets, "finalRLift", "rows"),
    flaggedMfeR: weightedMean(buckets, "flaggedMfeR", "flaggedRows"),
    unflaggedMfeR: weightedMean(buckets, "unflaggedMfeR", "unflaggedRows"),
    meanMfeRLift: weightedMean(buckets, "mfeRLift", "rows"),
    flaggedMaeR: weightedMean(buckets, "flaggedMaeR", "flaggedRows"),
    unflaggedMaeR: weightedMean(buckets, "unflaggedMaeR", "unflaggedRows"),
    meanMaeRLift: weightedMean(buckets, "maeRLift", "rows"),
    meanNetPathOpportunityLiftR: weightedMean(buckets, "netPathOpportunityLiftR", "rows")
  };
}

function summarizeFullPathSlice(label, rows) {
  const fullPathRows = rows.filter((row) => row.fullPath?.available);
  const rMultiples = fullPathRows.map((row) => row.outcome?.rMultiple).filter(Number.isFinite);
  return {
    label,
    rows: rows.length,
    fullPathRows: fullPathRows.length,
    winRatePct: rMultiples.length ? round((rMultiples.filter((value) => value > 0).length / rMultiples.length) * 100, 2) : null,
    meanFinalR: round(mean(rMultiples), 4),
    medianFinalR: round(median(rMultiples), 4),
    meanMfeR: round(mean(fullPathRows.map((row) => row.fullPath.mfeR)), 4),
    meanMaeR: round(mean(fullPathRows.map((row) => row.fullPath.maeR)), 4),
    meanNetPathOpportunityR: round(mean(fullPathRows.map((row) => row.fullPath.netPathOpportunityR)), 4),
    losingRowsOffered1R: fullPathRows.filter((row) => row.fullPath.loserOpportunity?.["offered1RBeforeExit"]).length,
    winningRowsSuffered1R: fullPathRows.filter((row) => row.fullPath.winnerDrawdown?.["suffered1RBeforeExit"]).length
  };
}

function decide(rows) {
  const outsideAbsorption = compareFeatures(rows).comparableSummary
    .find((row) => row.feature === "absorptionProxy" && row.scope === "outsideOriginalCluster") ?? null;
  const verdict = !outsideAbsorption || outsideAbsorption.comparableRows < COMPARABLE_BUCKET_MIN_ROWS
    ? "full_path_absorption_inconclusive_low_comparable_rows"
    : (outsideAbsorption.meanFinalRLift ?? 0) <= 0 && (outsideAbsorption.meanMfeRLift ?? 0) <= 0
      ? "full_path_absorption_context_only_no_candidate"
      : "full_path_absorption_research_feature_watch_only_no_promotion";
  return {
    verdict,
    reason: outsideAbsorption
      ? `Outside the original cluster, absorption comparable buckets show final R lift ${formatNumber(outsideAbsorption.meanFinalRLift)} and MFE lift ${formatNumber(outsideAbsorption.meanMfeRLift)} across ${outsideAbsorption.comparableRows} rows. This is full-path candle evidence, but it still reuses frozen DEMO-SIM outcomes and remains no-promotion.`
      : "No qualifying outside-cluster absorption comparable buckets were available after the full-path candle join.",
    outsideAbsorption,
    candidateAdded: false,
    absorptionCandidateAdded: false,
    watcherGateChangeProposed: false,
    demoSimLogicChangeProposed: false,
    noLiveChange: true
  };
}

function renderMarkdown(report) {
  const lines = [
    "# USD-M Absorption Full-Path MFE/MAE Rescore",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Research-only full-path candle-series MFE/MAE rescore for the existing targeted USD-M absorption sample. It does not change live alerts, watcher gates, paper/demo logic, schedulers, thresholds, sizing, TP/SL, execution, accounts, keys, paid services, public posting, or strategy status.",
    "",
    "## Decision",
    "",
    `- Verdict: ${report.decision.verdict}`,
    `- Reason: ${report.decision.reason}`,
    `- Rows with full path: ${report.totals.rowsWithFullPath}/${report.totals.rows}`,
    `- Mean MFE/MAE R: ${report.totals.meanMfeR ?? "n/a"} / ${report.totals.meanMaeR ?? "n/a"}`,
    `- Losing rows that offered >=1R before exit: ${report.totals.losingRowsOfferedOneR}`,
    `- Winning rows that suffered >=1R adverse before exit: ${report.totals.winningRowsSufferedOneR}`,
    "",
    "## Feature Slices",
    "",
    "| Slice | Rows | Full path | Win rate | Mean final R | Median final R | Mean MFE R | Mean MAE R | Mean net path opp R | Losers offered 1R | Winners suffered 1R |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const slice of report.comparisons.slices) {
    lines.push(`| ${slice.label} | ${slice.rows} | ${slice.fullPathRows} | ${slice.winRatePct ?? "n/a"} | ${slice.meanFinalR ?? "n/a"} | ${slice.medianFinalR ?? "n/a"} | ${slice.meanMfeR ?? "n/a"} | ${slice.meanMaeR ?? "n/a"} | ${slice.meanNetPathOpportunityR ?? "n/a"} | ${slice.losingRowsOffered1R} | ${slice.winningRowsSuffered1R} |`);
  }

  lines.push(
    "",
    "## Comparable Full-Path Buckets",
    "",
    "Feature comparisons are restricted to rows with the same setup, direction, timeframe, market regime, and BTC gate, and only buckets with both flagged and unflagged rows.",
    "",
    "| Feature | Scope | Buckets | Rows | Flagged rows | Final R lift | MFE R lift | MAE R lift | Net path opp lift R |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  );

  for (const item of report.comparisons.comparableSummary) {
    lines.push(`| ${item.feature} | ${item.scope} | ${item.comparableBuckets} | ${item.comparableRows} | ${item.flaggedRows} | ${item.meanFinalRLift ?? "n/a"} | ${item.meanMfeRLift ?? "n/a"} | ${item.meanMaeRLift ?? "n/a"} | ${item.meanNetPathOpportunityLiftR ?? "n/a"} |`);
  }

  lines.push(
    "",
    "## Bucket Details",
    "",
    "| Feature | Scope | Bucket | Rows | Flagged | Final R lift | MFE R lift | MAE R lift | Net path opp lift R |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |"
  );

  for (const bucket of report.comparisons.comparableBuckets) {
    lines.push(`| ${bucket.feature} | ${bucket.scope} | ${bucket.bucket} | ${bucket.rows} | ${bucket.flaggedRows} | ${bucket.finalRLift ?? "n/a"} | ${bucket.mfeRLift ?? "n/a"} | ${bucket.maeRLift ?? "n/a"} | ${bucket.netPathOpportunityLiftR ?? "n/a"} |`);
  }

  lines.push(
    "",
    "## Row Sample",
    "",
    "| Event | Setup | Direction | Final R | MFE R | MAE R | Bars to MFE/MAE | Flags |",
    "| --- | --- | --- | ---: | ---: | ---: | --- | --- |"
  );

  for (const row of report.rows.slice(0, 40)) {
    const flags = FEATURES.filter((feature) => row.featureFlags?.[feature]).join(", ") || "none";
    lines.push(`| ${row.eventId} | ${row.setup} ${row.timeframe} ${row.regime} ${row.btcGateState} | ${row.direction} | ${row.outcome?.rMultiple ?? "n/a"} | ${row.fullPath?.mfeR ?? "n/a"} | ${row.fullPath?.maeR ?? "n/a"} | ${row.fullPath?.barsToMfe ?? "n/a"}/${row.fullPath?.barsToMae ?? "n/a"} | ${flags} |`);
  }

  lines.push(
    "",
    "## Interpretation",
    "",
    "- Full-path MFE/MAE uses the same candle-source resolution as `historical-demo-sim-replay.mjs` and measures from the first candle after entry through the exit candle.",
    "- MFE/MAE R is gross path excursion relative to entry-stop risk. Final R remains the DEMO-SIM net R after fees.",
    "- The previous `candleOnlyFeatures` field in the USD-M orderflow batch should be treated as a single-candle proxy only; this report is the durable full-path measurement surface.",
    "- A positive absorption result here remains a research feature, not a watcher, paper/demo, live alert, risk, sizing, TP/SL, execution, or promotion rule.",
    "",
    "## Boundary",
    "",
    "No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, paper/demo alert logic, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed."
  );

  return `${lines.join("\n")}\n`;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function readOptionalJson(file) {
  try {
    return await readJson(file);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function iso(seconds) {
  return new Date(seconds * 1_000).toISOString();
}

function mean(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? finite.reduce((sum, value) => sum + value, 0) / finite.length : null;
}

function median(values) {
  const finite = values.filter(Number.isFinite).toSorted((a, b) => a - b);
  if (!finite.length) return null;
  const mid = Math.floor(finite.length / 2);
  return finite.length % 2 ? finite[mid] : (finite[mid - 1] + finite[mid]) / 2;
}

function weightedMean(rows, valueKey, weightKey) {
  let numerator = 0;
  let denominator = 0;
  for (const row of rows) {
    if (!Number.isFinite(row[valueKey]) || !Number.isFinite(row[weightKey]) || row[weightKey] <= 0) continue;
    numerator += row[valueKey] * row[weightKey];
    denominator += row[weightKey];
  }
  return denominator ? round(numerator / denominator, 4) : null;
}

function diff(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) ? a - b : null;
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(4) : "n/a";
}
