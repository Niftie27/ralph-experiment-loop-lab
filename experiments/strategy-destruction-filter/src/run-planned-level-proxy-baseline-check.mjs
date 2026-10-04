#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const INPUT_JSON = path.join(RESULTS_DIR, "planned-level-proxy-replay.json");
const OUT_JSON = path.join(RESULTS_DIR, "planned-level-proxy-baseline-check.json");
const OUT_MD = path.join(RESULTS_DIR, "planned-level-proxy-baseline-check.md");

const replay = JSON.parse(await fs.readFile(INPUT_JSON, "utf8"));
const fetchedRows = replay.rows.filter((row) => row.tradeWindow?.status === "ok");
const horizons = [1, 3, 5];

const horizonSummaries = Object.fromEntries(horizons.map((horizon) => [horizon, summarizeHorizon(fetchedRows, horizon)]));
const labelSummaries = summarizeLabels(fetchedRows);
const decision = decide(fetchedRows, horizonSummaries, labelSummaries);

const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-no-live-execution",
  purpose: "baseline-check-for-planned-level-public-orderflow-proxy-labels",
  source: {
    replayReport: path.relative(ROOT, INPUT_JSON),
    replayGeneratedAt: replay.generatedAt,
    fetchedRows: fetchedRows.length,
    auth: replay.source?.trades?.auth ?? "unknown",
    provider: replay.source?.trades?.provider ?? "unknown"
  },
  gates: {
    minFetchedRowsBeforeInterpretation: 10,
    requiresBtcGate: true,
    requiresBaselineLiftBeforePromotion: true
  },
  totals: {
    replayRows: replay.rows.length,
    fetchedRows: fetchedRows.length,
    fastKillCandidates: fetchedRows.filter((row) => row.fastKillLabel === "fast_kill_candidate").length,
    holdOrRetestCandidates: fetchedRows.filter((row) => row.fastKillLabel === "hold_or_retest_candidate").length
  },
  horizonSummaries,
  labelSummaries,
  rows: fetchedRows.map(compactRow),
  decision
};

await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  verdict: report.decision.verdict,
  fetchedRows: report.totals.fetchedRows,
  fastKillFiveCandleSupport: report.labelSummaries.fastKillCandidate?.h5?.supportiveShare ?? null,
  holdFiveCandleSupport: report.labelSummaries.holdOrRetestCandidate?.h5?.supportiveShare ?? null,
  report: OUT_JSON
}, null, 2));

function summarizeHorizon(rows, horizon) {
  const key = horizonKey(horizon);
  const scored = rows.filter((row) => Number.isFinite(row.mfeMae?.[`mfe${horizon}cPct`]) && Number.isFinite(row.mfeMae?.[`mae${horizon}cPct`]));
  const favorableDominant = scored.filter((row) => row.mfeMae[`mfe${horizon}cPct`] > row.mfeMae[`mae${horizon}cPct`]).length;
  const adverseDominant = scored.filter((row) => row.mfeMae[`mae${horizon}cPct`] > row.mfeMae[`mfe${horizon}cPct`]).length;
  const meanNetOpportunityPct = mean(scored.map((row) => netOpportunity(row, horizon)));
  return {
    horizon: key,
    rows: scored.length,
    favorableDominant,
    adverseDominant,
    tied: scored.length - favorableDominant - adverseDominant,
    favorableShare: share(favorableDominant, scored.length),
    adverseShare: share(adverseDominant, scored.length),
    meanNetOpportunityPct: round(meanNetOpportunityPct)
  };
}

function summarizeLabels(rows) {
  return {
    fastKillCandidate: summarizeLabel(rows, "fast_kill_candidate", "fast_kill"),
    holdOrRetestCandidate: summarizeLabel(rows, "hold_or_retest_candidate", "hold")
  };
}

function summarizeLabel(rows, label, mode) {
  const labelRows = rows.filter((row) => row.fastKillLabel === label);
  const out = { rows: labelRows.length };
  for (const horizon of horizons) {
    const scored = labelRows.filter((row) => Number.isFinite(row.mfeMae?.[`mfe${horizon}cPct`]) && Number.isFinite(row.mfeMae?.[`mae${horizon}cPct`]));
    const supportive = scored.filter((row) => {
      const mfe = row.mfeMae[`mfe${horizon}cPct`];
      const mae = row.mfeMae[`mae${horizon}cPct`];
      return mode === "fast_kill" ? mae >= mfe : mfe > mae;
    }).length;
    out[`h${horizon}`] = {
      rows: scored.length,
      supportive,
      contrary: scored.length - supportive,
      supportiveShare: share(supportive, scored.length),
      meanNetOpportunityPct: round(mean(scored.map((row) => netOpportunity(row, horizon))))
    };
  }
  return out;
}

function compactRow(row) {
  const out = {
    eventId: row.eventId,
    time: row.candleTimeUtc,
    setupType: row.setupType,
    classification: row.classification,
    btcGate: row.btcGateEntry?.regime,
    proxyClusterLabel: row.proxyClusterLabel,
    fastKillLabel: row.fastKillLabel
  };
  for (const horizon of horizons) {
    out[`h${horizon}`] = {
      mfePct: row.mfeMae?.[`mfe${horizon}cPct`] ?? null,
      maePct: row.mfeMae?.[`mae${horizon}cPct`] ?? null,
      netOpportunityPct: round(netOpportunity(row, horizon))
    };
  }
  return out;
}

function decide(rows, horizonSummaries, labelSummaries) {
  const fastKillH5 = labelSummaries.fastKillCandidate.h5;
  const holdH5 = labelSummaries.holdOrRetestCandidate.h5;
  const ready = rows.length >= 10;
  if (!ready) {
    return {
      verdict: "watch_low_sample",
      reason: "Fewer than 10 fetched public trade windows; keep collecting frozen planned-level rows.",
      candidateAdded: false,
      noLiveChange: true
    };
  }
  if (fastKillH5.supportiveShare >= 0.7 && holdH5.supportiveShare >= 0.6) {
    return {
      verdict: "proxy_labels_baseline_promising_but_not_promoted",
      reason: "Both fast-kill and hold labels beat the simple 5-candle MFE/MAE direction check; still requires larger validation, costs, and false-kill analysis.",
      candidateAdded: false,
      noLiveChange: true
    };
  }
  return {
    verdict: "proxy_labels_mixed_no_promotion",
    reason: "The refreshed proxy labels do not clear a simple 5-candle MFE/MAE sanity check; use this as a falsification baseline before richer orderflow work.",
    candidateAdded: false,
    noLiveChange: true,
    headline: {
      fetchedRows: rows.length,
      overallH5FavorableShare: horizonSummaries[5].favorableShare,
      fastKillH5SupportiveShare: fastKillH5.supportiveShare,
      holdH5SupportiveShare: holdH5.supportiveShare
    }
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Planned-Level Proxy Baseline Check",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Research-only sanity check for public-data planned-level orderflow proxy labels. It does not change live alerts, thresholds, sizing, TP/SL, execution, schedulers, accounts, keys, paid services, watcher behavior, or strategy status.",
    "",
    "## Totals",
    "",
    `- Replay rows: ${report.totals.replayRows}`,
    `- Fetched public trade windows: ${report.totals.fetchedRows}`,
    `- Fast-kill candidates: ${report.totals.fastKillCandidates}`,
    `- Hold/retest candidates: ${report.totals.holdOrRetestCandidates}`,
    `- Verdict: ${report.decision.verdict}`,
    `- Reason: ${report.decision.reason}`,
    "",
    "## Five-Candle Sanity Check",
    "",
    `- Overall favorable-dominant share: ${pct(report.horizonSummaries[5].favorableShare)} (${report.horizonSummaries[5].favorableDominant}/${report.horizonSummaries[5].rows})`,
    `- Fast-kill label support: ${pct(report.labelSummaries.fastKillCandidate.h5.supportiveShare)} (${report.labelSummaries.fastKillCandidate.h5.supportive}/${report.labelSummaries.fastKillCandidate.h5.rows})`,
    `- Hold/retest label support: ${pct(report.labelSummaries.holdOrRetestCandidate.h5.supportiveShare)} (${report.labelSummaries.holdOrRetestCandidate.h5.supportive}/${report.labelSummaries.holdOrRetestCandidate.h5.rows})`,
    "",
    "Support means fast-kill rows had MAE >= MFE, while hold/retest rows had MFE > MAE. This is a crude candle-only sanity check, not a tradable edge.",
    "",
    "## Horizon Summary",
    "",
    "| Horizon | Rows | Favorable dominant | Adverse dominant | Favorable share | Mean MFE-MAE pct |",
    "| --- | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const horizon of horizons) {
    const summary = report.horizonSummaries[horizon];
    lines.push(`| ${summary.horizon} | ${summary.rows} | ${summary.favorableDominant} | ${summary.adverseDominant} | ${pct(summary.favorableShare)} | ${summary.meanNetOpportunityPct} |`);
  }

  lines.push(
    "",
    "## Rows",
    ""
  );

  for (const row of report.rows) {
    lines.push(
      `### ${row.eventId}`,
      "",
      `- Time: ${row.time}`,
      `- Setup: ${row.setupType}, classification=${row.classification}, BTC gate=${row.btcGate}`,
      `- Proxy: ${row.proxyClusterLabel}, label=${row.fastKillLabel}`,
      `- 5c: MFE=${row.h5.mfePct}%, MAE=${row.h5.maePct}%, MFE-MAE=${row.h5.netOpportunityPct}%`,
      ""
    );
  }

  lines.push(
    "## Boundary",
    "",
    "No live trading, orders, keys, paid APIs, cron, watcher behavior, alert wording, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed."
  );

  return `${lines.join("\n")}\n`;
}

function netOpportunity(row, horizon) {
  const mfe = row.mfeMae?.[`mfe${horizon}cPct`];
  const mae = row.mfeMae?.[`mae${horizon}cPct`];
  return Number.isFinite(mfe) && Number.isFinite(mae) ? mfe - mae : null;
}

function mean(values) {
  const xs = values.filter(Number.isFinite);
  return xs.length ? xs.reduce((sum, value) => sum + value, 0) / xs.length : null;
}

function share(numerator, denominator) {
  return denominator > 0 ? round(numerator / denominator, 4) : null;
}

function horizonKey(horizon) {
  return `${horizon}c`;
}

function pct(value) {
  return Number.isFinite(value) ? `${round(value * 100, 2)}%` : "n/a";
}

function round(value, digits = 4) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}
