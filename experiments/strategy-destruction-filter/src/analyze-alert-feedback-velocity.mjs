#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const WORKSPACE_ROOT = path.resolve(ROOT, "../../..");
const FEEDBACK_PATH = path.join(WORKSPACE_ROOT, "crypto-updates", "runtime", "alert-feedback.jsonl");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON = path.join(RESULTS_DIR, "volume-velocity-alert-feedback.json");
const REPORT_MD = path.join(RESULTS_DIR, "volume-velocity-alert-feedback.md");

const raw = await fs.readFile(FEEDBACK_PATH, "utf8");
const records = raw.trim().split(/\n+/).filter(Boolean).map((line, index) => ({
  ...JSON.parse(line),
  lineNumber: index + 1
}));

const alerts = new Map();
const reviews = [];
for (const record of records) {
  if (record.type === "alert_sent" && record.alert?.id) alerts.set(record.alert.id, record);
  if (record.type === "review_finalized" && record.review?.id) reviews.push(record);
}

const joinedRows = [];
const excludedRows = [];
for (const reviewRecord of reviews) {
  const alertRecord = alerts.get(reviewRecord.review.id);
  if (!alertRecord || reviewRecord.review.triggerKind !== "VELOCITY") continue;

  const row = velocityRow(alertRecord, reviewRecord);
  if (row.quality.exclude) excludedRows.push(row);
  else joinedRows.push(row);
}

const buckets = summarizeBuckets(joinedRows);
const cleanOrderflowBuckets = buckets.filter((bucket) => bucket.qualityState === "clean_orderflow_book");
const selectedBucket =
  cleanOrderflowBuckets.find((bucket) => bucket.sample >= 4 && bucket.verdictCounts["fade-useful"] === bucket.sample) ||
  cleanOrderflowBuckets[0] ||
  null;

const report = {
  generatedAt: new Date().toISOString(),
  source: path.relative(WORKSPACE_ROOT, FEEDBACK_PATH),
  strictExclusions: ["delayed_or_untrusted_delivery", "negative_bookAgeMs", "score_gt_maxScore"],
  totals: {
    records: records.length,
    alertSent: alerts.size,
    finalizedReviews: reviews.length,
    joinedVelocityReviews: joinedRows.length + excludedRows.length,
    includedVelocityReviews: joinedRows.length,
    excludedVelocityReviews: excludedRows.length
  },
  excludedRows: excludedRows.map(compactRow),
  buckets,
  selectedBucket,
  interpretation: selectedBucket
    ? "Best clean orderflow/book velocity bucket is selected as a strict research candidate seed; sample is very small and must be killed unless it survives historical proxy gates."
    : "No clean orderflow/book velocity bucket had enough quality to seed a candidate."
};

await fs.mkdir(RESULTS_DIR, { recursive: true });
await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(REPORT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  selectedBucket: selectedBucket?.bucketKey || null,
  includedVelocityReviews: report.totals.includedVelocityReviews,
  excludedVelocityReviews: report.totals.excludedVelocityReviews,
  report: REPORT_JSON
}, null, 2));

function velocityRow(alertRecord, reviewRecord) {
  const alert = alertRecord.alert;
  const review = reviewRecord.review;
  const evidence = alert.evidence || null;
  const features = evidence?.features || null;
  const quality = qualityState(alert);
  return {
    id: review.id,
    alertLine: alertRecord.lineNumber,
    reviewLine: reviewRecord.lineNumber,
    asset: review.assetLabel,
    direction: review.direction,
    triggerLabel: review.triggerLabel,
    scoreBucket: scoreBucket(evidence),
    quality,
    verdict: reviewRecord.classification?.verdict || "unknown",
    directionalMovePct30m: checkpointMove(review, "30m"),
    directionalMovePct1h: checkpointMove(review, "1h"),
    triggerMovePct: review.triggerMovePct,
    volumeVelocityRatio: review.volumeVelocityRatio,
    source: review.source,
    features: features ? {
      bookFresh: features.bookFresh,
      bookAgeMs: features.bookAgeMs,
      tradeFlowNotional: features.tradeFlowNotional,
      cvdPctOfVolume: features.cvdPctOfVolume,
      bookImbalance: features.bookImbalance,
      spreadPct: features.spreadPct,
      top5DepthNotional: features.top5DepthNotional,
      depthChangePct: features.depthChangePct
    } : null
  };
}

function qualityState(alert) {
  const evidence = alert.evidence || null;
  const features = evidence?.features || {};
  const reasons = [];
  if (alert.id === "ETH-UP-1787063419374-k24uu9") reasons.push("delayed_or_untrusted_delivery");
  if (Number.isFinite(features.bookAgeMs) && features.bookAgeMs < 0) reasons.push("negative_bookAgeMs");
  if (Number.isFinite(evidence?.score) && Number.isFinite(evidence?.maxScore) && evidence.score > evidence.maxScore) {
    reasons.push("score_gt_maxScore");
  }
  if (reasons.length) return { state: "excluded_quality", exclude: true, reasons };

  const asset = String(alert.assetLabel || "").toUpperCase();
  if (asset === "HYPE" || /Hyperliquid allMids/i.test(alert.source || "")) {
    return { state: "hype_event_only", exclude: false, reasons: [] };
  }
  if (evidence && features.bookFresh === true && Number.isFinite(features.bookAgeMs)) {
    return { state: "clean_orderflow_book", exclude: false, reasons: [] };
  }
  if (evidence) return { state: "clean_evidence_no_fresh_book", exclude: false, reasons: [] };
  return { state: "legacy_price_only", exclude: false, reasons: [] };
}

function scoreBucket(evidence) {
  if (!evidence) return "unscored";
  if (Number.isFinite(evidence.score) && Number.isFinite(evidence.maxScore)) return `${evidence.score}/${evidence.maxScore}`;
  return "unscored";
}

function checkpointMove(review, label) {
  return review.checkpoints?.find((checkpoint) => checkpoint.label === label)?.directionalMovePct ?? null;
}

function summarizeBuckets(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = [row.asset, row.triggerLabel, row.direction, row.scoreBucket, row.quality.state].join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([bucketKey, bucketRows]) => {
    const [asset, triggerLabel, direction, scoreBucket, qualityState] = bucketKey.split("|");
    return {
      bucketKey,
      asset,
      triggerLabel,
      direction,
      scoreBucket,
      qualityState,
      sample: bucketRows.length,
      verdictCounts: countBy(bucketRows, (row) => row.verdict),
      directionalMovePct30mAvg: average(bucketRows.map((row) => row.directionalMovePct30m).filter(Number.isFinite)),
      directionalMovePct1hAvg: average(bucketRows.map((row) => row.directionalMovePct1h).filter(Number.isFinite)),
      ids: bucketRows.map((row) => row.id)
    };
  }).sort((a, b) => {
    if (a.qualityState !== b.qualityState) return a.qualityState === "clean_orderflow_book" ? -1 : 1;
    if (b.sample !== a.sample) return b.sample - a.sample;
    return Math.abs(b.directionalMovePct1hAvg ?? 0) - Math.abs(a.directionalMovePct1hAvg ?? 0);
  });
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function average(values) {
  if (!values.length) return null;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function compactRow(row) {
  return {
    id: row.id,
    asset: row.asset,
    triggerLabel: row.triggerLabel,
    direction: row.direction,
    scoreBucket: row.scoreBucket,
    reasons: row.quality.reasons
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Volume Velocity Alert Feedback",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Status: research-only analysis over local alert feedback. No live trading, orders, alert wording, watcher behavior, cron cadence, keys, paid APIs, risk, or sizing changed.",
    "",
    "## Totals",
    "",
    `- Joined velocity reviews: ${report.totals.joinedVelocityReviews}`,
    `- Included after strict exclusions: ${report.totals.includedVelocityReviews}`,
    `- Excluded by strict quality rules: ${report.totals.excludedVelocityReviews}`,
    "",
    "## Selected Bucket",
    "",
    report.selectedBucket
      ? `Selected: ${report.selectedBucket.bucketKey} (N=${report.selectedBucket.sample}, verdicts=${JSON.stringify(report.selectedBucket.verdictCounts)}, 30m=${report.selectedBucket.directionalMovePct30mAvg}%, 1h=${report.selectedBucket.directionalMovePct1hAvg}%).`
      : "Selected: none.",
    "",
    "## Buckets",
    ""
  ];
  for (const bucket of report.buckets) {
    lines.push(
      `- ${bucket.bucketKey}: N=${bucket.sample}, verdicts=${JSON.stringify(bucket.verdictCounts)}, 30m=${bucket.directionalMovePct30mAvg}%, 1h=${bucket.directionalMovePct1hAvg}%`
    );
  }
  lines.push("", "## Excluded Rows", "");
  if (!report.excludedRows.length) lines.push("- none");
  for (const row of report.excludedRows) {
    lines.push(`- ${row.id}: ${row.asset} ${row.triggerLabel} ${row.direction} ${row.scoreBucket}; ${row.reasons.join(", ")}`);
  }
  return `${lines.join("\n")}\n`;
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}
