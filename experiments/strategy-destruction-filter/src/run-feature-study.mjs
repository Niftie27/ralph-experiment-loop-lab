#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { summarizeFeatureStudy } from "./feature-study.mjs";
import { fetchConfiguredCandles } from "./market-data.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON = path.join(RESULTS_DIR, "feature-study.json");
const REPORT_MD = path.join(RESULTS_DIR, "feature-study.md");

const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
await fs.mkdir(RESULTS_DIR, { recursive: true });

const studies = [];
const sources = [];
for (const symbol of config.data.symbols) {
  for (const timeframe of config.data.timeframes) {
    const fetched = await fetchConfiguredCandles(symbol, timeframe);
    sources.push({
      symbol: symbol.symbol,
      timeframe: timeframe.id,
      provider: fetched.meta.provider,
      market: fetched.meta.market,
      source: fetched.meta.source,
      candles: fetched.candles.length,
      features: fetched.meta.features || null
    });
    studies.push(summarizeFeatureStudy(symbol.symbol, timeframe, fetched.candles));
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  status: config.status,
  purpose: "feature-quality-diagnostics-before-new-strategy-candidates",
  note: "Research-only report. Buckets describe raw forward-return behavior after feature extremes; they are not trade recommendations and do not change live alerts, thresholds, risk, sizing, or execution.",
  sources,
  studies
};

await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(REPORT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  status: report.status,
  studies: report.studies.length,
  featureBuckets: report.studies.reduce((sum, study) => sum + study.forwardBuckets.length, 0),
  report: REPORT_JSON
}, null, 2));

function renderMarkdown(report) {
  const lines = [
    "# Feature Study Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}.`,
    "",
    report.note,
    "",
    "## Sources",
    "",
    ...report.sources.map((source) =>
      `- ${source.symbol} ${source.timeframe}: ${source.candles} candles, source=${source.source}, market=${source.market}${featureSummary(source.features)}`
    ),
    "",
    "## Findings",
    ""
  ];

  for (const study of report.studies) {
    lines.push(
      `### ${study.symbol} ${study.timeframe}`,
      "",
      `Rows: ${study.rows}; funding rows: ${study.rowsWithFunding}; OI-change rows: ${study.rowsWithOpenInterestChange}; window: ${study.firstRowTime} to ${study.lastRowTime}.`,
      "",
      "Distributions:",
      distributionLine(study.distributions.fundingRate),
      distributionLine(study.distributions.openInterestChangePct),
      "",
      "Extreme buckets:"
    );

    for (const bucket of study.forwardBuckets.filter((item) => item.sample > 0)) {
      const horizon = preferredHorizon(bucket.forward);
      const forward = bucket.forward[horizon];
      lines.push(
        `- ${bucket.id}: sample=${bucket.sample}, threshold=${bucket.threshold}, ${horizon}-bar mean=${forward.meanPct}%, positiveRate=${forward.positiveRate}, signedMean=${forward.signedMeanPct ?? "n/a"}%, signedDirection=${forward.signedDirection || "n/a"}`
      );
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function distributionLine(distribution) {
  const all = distribution.all;
  if (!all.sample) return `- ${distribution.feature}: no rows`;
  return `- ${distribution.feature}: sample=${all.sample}, p05=${all.p05}, median=${all.median}, p95=${all.p95}, mean=${all.mean}`;
}

function preferredHorizon(forward) {
  const horizons = Object.keys(forward).map(Number).sort((a, b) => a - b);
  return String(horizons.includes(6) ? 6 : horizons[Math.floor(horizons.length / 2)]);
}

function featureSummary(features) {
  if (!features) return "";
  const parts = [];
  if (features.funding?.enabled) parts.push(`fundingRows=${features.funding.rows}`);
  if (features.openInterest?.enabled) parts.push(`openInterestRows=${features.openInterest.rows}`);
  return parts.length ? `, features=[${parts.join("; ")}]` : "";
}
