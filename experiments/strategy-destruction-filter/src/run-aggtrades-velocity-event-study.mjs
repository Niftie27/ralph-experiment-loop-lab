#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_JSON = path.join(RESULTS_DIR, "binance-aggtrades-velocity-replay.json");
const FILTER_REPORT_JSON = path.join(RESULTS_DIR, "filter-report.json");
const REPORT_JSON = path.join(RESULTS_DIR, "aggtrades-velocity-event-study.json");
const REPORT_MD = path.join(RESULTS_DIR, "aggtrades-velocity-event-study.md");

const MIN_SAMPLE_FOR_CANDIDATE = 10;
const MIN_DOMINANT_SHARE = 0.75;

const replayReport = JSON.parse(await fs.readFile(REPLAY_JSON, "utf8"));
const filterReport = JSON.parse(await fs.readFile(FILTER_REPORT_JSON, "utf8"));

const usableRows = replayReport.rows.filter((row) => row.replay?.usableForBucket === true);
const failedMechanisms = strictFailedMechanisms(filterReport);
const buckets = summarizeBuckets(usableRows, (row) => [
  row.asset,
  row.triggerLabel,
  row.direction
]);
const velocityBandBuckets = summarizeBuckets(usableRows, (row) => [
  row.asset,
  row.triggerLabel,
  row.direction,
  velocityBand(row.replay.volumeVelocityRatio)
]);
const gateBuckets = buckets.map((bucket) => gateBucket(bucket, failedMechanisms));
const readyBuckets = gateBuckets.filter((bucket) => bucket.gate.decision === "candidate_ready");
const watchBuckets = gateBuckets.filter((bucket) => bucket.gate.decision === "watch_low_sample");

const decision = decide({ replayReport, usableRows, readyBuckets, watchBuckets });
const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  sourceReport: path.relative(ROOT, REPLAY_JSON),
  purpose: "low-sample-event-study-gate-before-any-new-volume-velocity-strategy-candidate",
  gates: {
    minSampleForCandidate: MIN_SAMPLE_FOR_CANDIDATE,
    minDominantShare: MIN_DOMINANT_SHARE,
    sameFailedMechanismBlock: true
  },
  totals: {
    replayRows: replayReport.totals?.replayed ?? replayReport.rows.length,
    replayOk: replayReport.totals?.replayOk ?? null,
    usableRows: usableRows.length,
    buckets: buckets.length,
    velocityBandBuckets: velocityBandBuckets.length,
    candidateReadyBuckets: readyBuckets.length,
    watchLowSampleBuckets: watchBuckets.length
  },
  failedMechanisms,
  buckets: gateBuckets,
  velocityBandBuckets,
  decision
};

await fs.writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(REPORT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  usableRows: report.totals.usableRows,
  buckets: report.totals.buckets,
  decision: report.decision.verdict,
  candidateAdded: report.decision.candidateAdded,
  topBucket: report.buckets[0]?.key ?? null,
  report: REPORT_JSON
}, null, 2));

function strictFailedMechanisms(report) {
  const rejected = report.verdicts.filter((item) => (
    item.candidateId === "alert-feedback-eth-velocity-fade-v0" &&
    item.rule === "volume_velocity_fade" &&
    item.verdict?.status === "rejected"
  ));
  if (!rejected.length) return [];
  return [{
    candidateId: "alert-feedback-eth-velocity-fade-v0",
    mechanismKey: "ETH|60s|DOWN|fade-useful",
    rule: "volume_velocity_fade",
    status: "rejected",
    rejectedVariants: rejected.length,
    representativeFailures: rejected[0].verdict.failures
  }];
}

function summarizeBuckets(rows, keyParts) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyParts(row).join("|");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([key, bucketRows]) => {
    const verdictCounts = countBy(bucketRows, (row) => row.recorded.verdict);
    const [dominantVerdict, dominantCount] = Object.entries(verdictCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? ["unknown", 0];
    return {
      key,
      sample: bucketRows.length,
      verdictCounts,
      dominantVerdict,
      dominantShare: round(dominantCount / bucketRows.length),
      recordedMove30mPct: distribution(bucketRows.map((row) => row.recorded.move30mPct)),
      recordedMove1hPct: distribution(bucketRows.map((row) => row.recorded.move1hPct)),
      replayTriggerMovePct: distribution(bucketRows.map((row) => row.replay.triggerMovePct)),
      replayVelocityRatio: distribution(bucketRows.map((row) => row.replay.volumeVelocityRatio)),
      replayAggressiveBuyShare: distribution(bucketRows.map(aggressiveBuyShare)),
      ids: bucketRows.map((row) => row.id)
    };
  }).sort((a, b) => (
    b.sample - a.sample ||
    b.dominantShare - a.dominantShare ||
    Math.abs(b.recordedMove1hPct.avg ?? 0) - Math.abs(a.recordedMove1hPct.avg ?? 0) ||
    a.key.localeCompare(b.key)
  ));
}

function gateBucket(bucket, failedMechanisms) {
  const mechanismKey = `${bucket.key}|${bucket.dominantVerdict}`;
  const failedMechanism = failedMechanisms.find((item) => item.mechanismKey === mechanismKey) ?? null;
  const failures = [];
  if (bucket.sample < MIN_SAMPLE_FOR_CANDIDATE) failures.push("low_sample");
  if (bucket.dominantShare < MIN_DOMINANT_SHARE) failures.push("weak_dominant_verdict_share");
  if (failedMechanism) failures.push("same_mechanism_already_failed_strict_filter_without_new_data");

  let decision = "candidate_ready";
  if (failures.includes("same_mechanism_already_failed_strict_filter_without_new_data")) decision = "killed_or_no_bucket";
  else if (failures.length) decision = "watch_low_sample";

  return {
    ...bucket,
    gate: {
      decision,
      failures,
      failedMechanism
    }
  };
}

function decide({ replayReport, usableRows, readyBuckets, watchBuckets }) {
  if (!usableRows.length) {
    return {
      verdict: "killed_or_no_bucket",
      candidateAdded: false,
      rationale: "No replay-clean aggTrades rows passed exact watcher-field matching.",
      noLiveChange: true
    };
  }
  if (readyBuckets.length) {
    return {
      verdict: "candidate_ready",
      candidateAdded: false,
      rationale: "A replay-clean bucket cleared the event-study gates; candidate creation still requires a separate explicit edit.",
      noLiveChange: true
    };
  }
  return {
    verdict: "watch_low_sample",
    candidateAdded: false,
    rationale: `Replay is feasible (${replayReport.totals?.usableRows ?? usableRows.length} usable rows), but every bucket is below N=${MIN_SAMPLE_FOR_CANDIDATE} or blocked by prior strict-filter failure.`,
    noLiveChange: true,
    nextStep: "Keep collecting replay-clean rows; do not add another broad OHLCV proxy from this evidence."
  };
}

function renderMarkdown(report) {
  const lines = [
    "# AggTrades Velocity Event Study",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Status: research-only event study over existing public/no-key Binance aggTrades replay output. No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, or execution changed.",
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
    "- Same failed strict-filter mechanism is blocked without new data.",
    "",
    "## Totals",
    "",
    `- Replay rows: ${report.totals.replayRows}`,
    `- Replay OK: ${report.totals.replayOk}`,
    `- Usable replay-clean rows: ${report.totals.usableRows}`,
    `- Primary buckets: ${report.totals.buckets}`,
    `- Velocity-band buckets: ${report.totals.velocityBandBuckets}`,
    `- Candidate-ready buckets: ${report.totals.candidateReadyBuckets}`,
    `- Watch low-sample buckets: ${report.totals.watchLowSampleBuckets}`,
    "",
    "## Top Primary Buckets",
    ""
  ].filter((line) => line !== null);

  for (const bucket of report.buckets.slice(0, 12)) {
    lines.push(
      `- ${bucket.key}: N=${bucket.sample}, dominant=${bucket.dominantVerdict}/${bucket.dominantShare}, ` +
      `30mAvg=${bucket.recordedMove30mPct.avg}%, 1hAvg=${bucket.recordedMove1hPct.avg}%, ` +
      `replayVelocityAvg=${bucket.replayVelocityRatio.avg}, gate=${bucket.gate.decision}`
    );
  }
  if (!report.buckets.length) lines.push("- none");

  lines.push("", "## Top Velocity-Band Buckets", "");
  for (const bucket of report.velocityBandBuckets.slice(0, 12)) {
    lines.push(
      `- ${bucket.key}: N=${bucket.sample}, verdicts=${JSON.stringify(bucket.verdictCounts)}, ` +
      `30mAvg=${bucket.recordedMove30mPct.avg}%, 1hAvg=${bucket.recordedMove1hPct.avg}%`
    );
  }
  if (!report.velocityBandBuckets.length) lines.push("- none");

  lines.push("", "## Row IDs", "");
  for (const bucket of report.buckets.slice(0, 8)) {
    lines.push(`- ${bucket.key}: ${bucket.ids.join(", ")}`);
  }

  return `${lines.join("\n")}\n`;
}

function velocityBand(value) {
  if (!Number.isFinite(value)) return "velocity_unknown";
  if (value < 2) return "velocity_lt_2";
  if (value < 5) return "velocity_2_to_5";
  return "velocity_gte_5";
}

function aggressiveBuyShare(row) {
  const buy = row.replay.recentAggressiveBuyNotional;
  const sell = row.replay.recentAggressiveSellNotional;
  if (!Number.isFinite(buy) || !Number.isFinite(sell) || buy + sell <= 0) return null;
  return buy / (buy + sell);
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
  if (!numeric.length) return { count: 0, min: null, p25: null, median: null, avg: null, p75: null, max: null };
  return {
    count: numeric.length,
    min: round(numeric[0]),
    p25: round(quantile(numeric, 0.25)),
    median: round(quantile(numeric, 0.5)),
    avg: average(numeric),
    p75: round(quantile(numeric, 0.75)),
    max: round(numeric[numeric.length - 1])
  };
}

function quantile(values, q) {
  const position = (values.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return values[lower];
  return values[lower] + (values[upper] - values[lower]) * (position - lower);
}

function average(values) {
  const numeric = values.filter(Number.isFinite);
  if (!numeric.length) return null;
  return round(numeric.reduce((sum, value) => sum + value, 0) / numeric.length);
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}
