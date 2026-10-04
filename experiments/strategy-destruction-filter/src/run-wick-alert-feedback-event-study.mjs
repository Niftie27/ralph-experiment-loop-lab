#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const WORKSPACE_ROOT = path.resolve(ROOT, "../../..");
const FEEDBACK_PATH = path.join(WORKSPACE_ROOT, "crypto-updates", "runtime", "alert-feedback.jsonl");
const RESULTS_DIR = path.join(ROOT, "results");
const REPORT_JSON = path.join(RESULTS_DIR, "wick-alert-feedback-event-study.json");
const REPORT_MD = path.join(RESULTS_DIR, "wick-alert-feedback-event-study.md");

const MIN_SAMPLE_FOR_CANDIDATE = 10;
const MIN_DOMINANT_SHARE = 0.75;
const MIN_TRADABLE_FADE_SUCCESS_SHARE = 0.6;

const records = parseJsonl(await fs.readFile(FEEDBACK_PATH, "utf8"));
const alerts = new Map();
const reviews = [];
for (const record of records) {
  if (record.type === "alert_sent" && record.alert?.id) alerts.set(record.alert.id, record);
  if (record.type === "review_finalized" && record.review?.id) reviews.push(record);
}

const rows = [];
const excludedRows = [];
for (const reviewRecord of reviews) {
  const alertRecord = alerts.get(reviewRecord.review.id);
  if (!alertRecord || reviewRecord.review.triggerKind !== "WICK") continue;
  const row = wickRow(alertRecord, reviewRecord);
  if (row.quality.exclude) excludedRows.push(row);
  else rows.push(row);
}

const buckets = summarizeBuckets(rows, (row) => [
  row.asset,
  row.triggerLabel,
  row.direction,
  row.tradeability,
  row.scoreBucket
]);
const tradableBuckets = buckets.filter((bucket) => bucket.tradeability === "tradable_fade");
const gateBuckets = buckets.map(gateBucket);
const decision = decide({ rows, gateBuckets, tradableBuckets });

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  source: path.relative(WORKSPACE_ROOT, FEEDBACK_PATH),
  purpose: "low-sample-wick-feedback-gate-before-any-wick-fade-strategy-candidate",
  gates: {
    minSampleForCandidate: MIN_SAMPLE_FOR_CANDIDATE,
    minDominantShare: MIN_DOMINANT_SHARE,
    minTradableFadeSuccessShare: MIN_TRADABLE_FADE_SUCCESS_SHARE
  },
  totals: {
    records: records.length,
    alerts: alerts.size,
    finalizedReviews: reviews.length,
    includedWickReviews: rows.length,
    excludedWickReviews: excludedRows.length,
    buckets: buckets.length,
    tradableFadeRows: rows.filter((row) => row.tradeability === "tradable_fade").length,
    tradableFadeBuckets: tradableBuckets.length,
    candidateReadyBuckets: gateBuckets.filter((bucket) => bucket.gate.decision === "candidate_ready").length
  },
  excludedRows,
  buckets: gateBuckets,
  decision
};

await fs.mkdir(RESULTS_DIR, { recursive: true });
await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(REPORT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  includedWickReviews: report.totals.includedWickReviews,
  tradableFadeRows: report.totals.tradableFadeRows,
  buckets: report.totals.buckets,
  decision: report.decision.verdict,
  candidateAdded: report.decision.candidateAdded,
  topBucket: report.buckets[0]?.key ?? null,
  report: REPORT_JSON
}, null, 2));

function wickRow(alertRecord, reviewRecord) {
  const alert = alertRecord.alert;
  const review = reviewRecord.review;
  const evidence = alert.evidence || null;
  const features = evidence?.features || null;
  const fadePlan = alert.fadePlan || {};
  const verdict = reviewRecord.classification?.verdict || "unknown";
  const tradeability = fadePlan.tradable ? "tradable_fade" : "event_only";
  const fadeOutcome = verdict === "fade-useful" ? "supports_fade" : verdict === "follow-useful" ? "against_fade" : "unclear";
  return {
    id: review.id,
    alertLine: alertRecord.lineNumber,
    reviewLine: reviewRecord.lineNumber,
    asset: review.assetLabel,
    symbol: review.assetSymbol,
    direction: review.direction,
    triggerLabel: review.triggerLabel,
    triggerMovePct: round(review.triggerMovePct),
    volumeVelocityRatio: round(review.volumeVelocityRatio),
    volumeRecentNotional: Number.isFinite(review.volumeRecentNotional) ? Math.round(review.volumeRecentNotional) : null,
    scoreBucket: scoreBucket(evidence),
    tradeability,
    fadeDirection: fadePlan.fadeDirection || null,
    verdict,
    fadeOutcome,
    directionalMovePct30m: checkpointMove(review, "30m"),
    directionalMovePct1h: checkpointMove(review, "1h"),
    entryResearch: compactEntryResearch(review.entryResearch),
    quality: qualityState(alert),
    features: features ? {
      bookFresh: features.bookFresh,
      bookAgeMs: features.bookAgeMs,
      tradeFlowNotional: round(features.tradeFlowNotional),
      cvdPctOfVolume: round(features.cvdPctOfVolume),
      bookImbalance: round(features.bookImbalance),
      spreadPct: round(features.spreadPct),
      top5DepthNotional: round(features.top5DepthNotional),
      depthChangePct: round(features.depthChangePct)
    } : null
  };
}

function summarizeBuckets(rows, keyParts) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyParts(row).join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([key, bucketRows]) => {
    const [asset, triggerLabel, direction, tradeability, scoreBucket] = key.split("|");
    const verdictCounts = countBy(bucketRows, (row) => row.verdict);
    const fadeOutcomeCounts = countBy(bucketRows, (row) => row.fadeOutcome);
    const [dominantVerdict, dominantCount] = Object.entries(verdictCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? ["unknown", 0];
    return {
      key,
      asset,
      triggerLabel,
      direction,
      tradeability,
      scoreBucket,
      sample: bucketRows.length,
      verdictCounts,
      fadeOutcomeCounts,
      dominantVerdict,
      dominantShare: round(dominantCount / bucketRows.length),
      fadeSupportShare: round((fadeOutcomeCounts.supports_fade || 0) / bucketRows.length),
      recordedMove30mPct: distribution(bucketRows.map((row) => row.directionalMovePct30m)),
      recordedMove1hPct: distribution(bucketRows.map((row) => row.directionalMovePct1h)),
      volumeVelocityRatio: distribution(bucketRows.map((row) => row.volumeVelocityRatio)),
      ids: bucketRows.map((row) => row.id)
    };
  }).sort((a, b) => (
    Number(b.tradeability === "tradable_fade") - Number(a.tradeability === "tradable_fade") ||
    b.sample - a.sample ||
    b.fadeSupportShare - a.fadeSupportShare ||
    a.key.localeCompare(b.key)
  ));
}

function gateBucket(bucket) {
  const failures = [];
  if (bucket.sample < MIN_SAMPLE_FOR_CANDIDATE) failures.push("low_sample");
  if (bucket.dominantShare < MIN_DOMINANT_SHARE) failures.push("weak_dominant_verdict_share");
  if (bucket.tradeability === "tradable_fade" && bucket.fadeSupportShare < MIN_TRADABLE_FADE_SUCCESS_SHARE) {
    failures.push("tradable_fade_not_supported_by_reviews");
  }
  return {
    ...bucket,
    gate: {
      decision: failures.length ? "watch_or_kill_low_sample" : "candidate_ready",
      failures
    }
  };
}

function decide({ rows, gateBuckets, tradableBuckets }) {
  if (!rows.length) {
    return {
      verdict: "killed_or_no_bucket",
      candidateAdded: false,
      rationale: "No finalized WICK reviews were available after strict quality exclusions.",
      noLiveChange: true
    };
  }
  const readyBuckets = gateBuckets.filter((bucket) => bucket.gate.decision === "candidate_ready");
  if (readyBuckets.length) {
    return {
      verdict: "candidate_ready",
      candidateAdded: false,
      rationale: "A WICK bucket cleared the low-sample event-study gates; candidate creation still requires a separate explicit edit.",
      noLiveChange: true
    };
  }
  const tradableRows = tradableBuckets.reduce((sum, bucket) => sum + bucket.sample, 0);
  const tradableFadeSupport = tradableBuckets.reduce((sum, bucket) => sum + (bucket.fadeOutcomeCounts.supports_fade || 0), 0);
  const tradableFadeAgainst = tradableBuckets.reduce((sum, bucket) => sum + (bucket.fadeOutcomeCounts.against_fade || 0), 0);
  return {
    verdict: "watch_or_kill_low_sample",
    candidateAdded: false,
    rationale: `Current WICK evidence is low-sample; tradable fade rows are ${tradableRows}, with ${tradableFadeSupport} supporting fade and ${tradableFadeAgainst} against fade.`,
    noLiveChange: true,
    nextStep: "Keep WICK evidence separate from VELOCITY; do not add a strict wick-fade candidate until sample and fade-support gates clear."
  };
}

function renderMarkdown(report) {
  const lines = [
    "# WICK Alert Feedback Event Study",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Status: research-only event study over local alert feedback. No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution changed.",
    "",
    "## Decision",
    "",
    `- Verdict: ${report.decision.verdict}`,
    `- Candidate added: ${report.decision.candidateAdded}`,
    `- Rationale: ${report.decision.rationale}`,
    report.decision.nextStep ? `- Next: ${report.decision.nextStep}` : null,
    "",
    "## Gates",
    "",
    `- Minimum sample for candidate: ${report.gates.minSampleForCandidate}`,
    `- Minimum dominant verdict share: ${report.gates.minDominantShare}`,
    `- Minimum tradable fade support share: ${report.gates.minTradableFadeSuccessShare}`,
    "",
    "## Totals",
    "",
    `- Included WICK reviews: ${report.totals.includedWickReviews}`,
    `- Excluded WICK reviews: ${report.totals.excludedWickReviews}`,
    `- Buckets: ${report.totals.buckets}`,
    `- Tradable fade rows: ${report.totals.tradableFadeRows}`,
    `- Candidate-ready buckets: ${report.totals.candidateReadyBuckets}`,
    "",
    "## Buckets",
    ""
  ].filter((line) => line !== null);

  if (!report.buckets.length) lines.push("- none");
  for (const bucket of report.buckets.slice(0, 16)) {
    lines.push(
      `- ${bucket.key}: N=${bucket.sample}, verdicts=${JSON.stringify(bucket.verdictCounts)}, ` +
      `fadeSupport=${bucket.fadeSupportShare}, 30mAvg=${bucket.recordedMove30mPct.avg}%, ` +
      `1hAvg=${bucket.recordedMove1hPct.avg}%, gate=${bucket.gate.decision}` +
      (bucket.gate.failures.length ? ` (${bucket.gate.failures.join(", ")})` : "")
    );
  }

  lines.push("", "## Row IDs", "");
  for (const bucket of report.buckets.slice(0, 10)) {
    lines.push(`- ${bucket.key}: ${bucket.ids.join(", ")}`);
  }

  return `${lines.join("\n")}\n`;
}

function qualityState(alert) {
  const evidence = alert?.evidence || null;
  const features = evidence?.features || {};
  const reasons = [];
  if (!alert) reasons.push("missing_alert_record");
  if (Number.isFinite(features.bookAgeMs) && features.bookAgeMs < 0) reasons.push("negative_bookAgeMs");
  if (Number.isFinite(evidence?.score) && Number.isFinite(evidence?.maxScore) && evidence.score > evidence.maxScore) {
    reasons.push("score_gt_maxScore");
  }
  return { exclude: reasons.length > 0, reasons };
}

function compactEntryResearch(entryResearch) {
  if (!entryResearch) return null;
  return {
    fadeDirection: entryResearch.fadeDirection || null,
    live2mStatus: entryResearch.live2m?.status || null,
    mark1mStatus: entryResearch.marks?.find((mark) => mark.key === "mark1m")?.status || null,
    mark5mStatus: entryResearch.marks?.find((mark) => mark.key === "mark5m")?.status || null
  };
}

function scoreBucket(evidence) {
  if (!evidence) return "unscored";
  if (Number.isFinite(evidence.score) && Number.isFinite(evidence.maxScore)) return `${evidence.score}/${evidence.maxScore}`;
  return "unscored";
}

function checkpointMove(review, label) {
  return review.checkpoints?.find((checkpoint) => checkpoint.label === label)?.directionalMovePct ?? null;
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function distribution(values) {
  const numeric = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!numeric.length) return { count: 0, min: null, median: null, avg: null, max: null };
  return {
    count: numeric.length,
    min: round(numeric[0]),
    median: round(percentile(numeric, 0.5)),
    avg: round(numeric.reduce((sum, value) => sum + value, 0) / numeric.length),
    max: round(numeric.at(-1))
  };
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return null;
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
}

function parseJsonl(raw) {
  return raw.trim().split(/\n+/).filter(Boolean).map((line, index) => ({
    ...JSON.parse(line),
    lineNumber: index + 1
  }));
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}
