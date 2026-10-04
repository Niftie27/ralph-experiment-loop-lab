#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const WORKSPACE = path.resolve(ROOT, "..");
const OUT_JSON = path.join(ROOT, "outputs", "ralph-adversarial-improvement-report.json");
const OUT_MD = path.join(ROOT, "outputs", "ralph-adversarial-improvement-report.md");

const files = {
  filter: path.join(ROOT, "experiments", "strategy-destruction-filter", "results", "filter-report.json"),
  walkForwardNearMissSidecar: path.join(ROOT, "experiments", "strategy-destruction-filter", "results", "walk-forward-near-miss-sidecar.json"),
  watchRowAgingLedger: path.join(ROOT, "outputs", "watch-row-aging-ledger.json"),
  drift: path.join(ROOT, "experiments", "strategy-destruction-filter", "results", "filter-drift-report.json"),
  plannedLevel: path.join(ROOT, "experiments", "strategy-destruction-filter", "results", "planned-level-proxy-replay.json"),
  shadowPnl: path.join(ROOT, "experiments", "strategy-destruction-filter", "results", "shadow-pnl-ledger.json"),
  stateOfEdge: path.join(ROOT, "outputs", "state-of-edge-report.json"),
  serviceHealth: path.join(WORKSPACE, "crypto-updates", "runtime", "service-health-report.json"),
  queues: path.join(ROOT, "automation", "work-queues.yaml")
};

const now = new Date();
const inputs = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, file]) => [
  key,
  await readJsonOrText(file)
])));

const findings = [
  ...criticFindings(inputs),
  ...backtestFindings(inputs),
  ...orderflowFindings(inputs),
  ...runtimeFindings(inputs)
].sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.id.localeCompare(b.id));

const proposals = findings.flatMap((finding) => finding.proposals || []);
const report = {
  generatedAt: now.toISOString(),
  status: "research-only-adversarial-improvement-loop",
  boundaries: {
    liveTrading: false,
    orderPlacement: false,
    walletKeys: false,
    exchangeKeys: false,
    paidApis: false,
    alertWordingChanges: false,
    riskSizingTpSlChanges: false,
    executionChanges: false
  },
  phases: ["critic", "proposal", "validation_gate", "memory_route", "telegram_gate"],
  inputs: Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, {
    path: path.relative(ROOT, files[key]),
    status: value.ok ? "read" : "missing_or_unreadable",
    error: value.ok ? null : value.error
  }])),
  summary: summarize(findings, proposals),
  findings,
  proposals,
  telegramGate: telegramGate(findings, proposals),
  nextRun: {
    mode: "scheduled_light_pass_candidate",
    cadence: "daily after state-of-edge refresh, isolated session",
    deepPass: "weekly after maintenance",
    note: "Scheduler activation requires explicit Tomas approval if not already granted for this exact loop."
  }
};

await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  verdict: report.summary.verdict,
  critical: report.summary.bySeverity.critical || 0,
  high: report.summary.bySeverity.high || 0,
  proposals: report.proposals.length,
  notifyTomas: report.telegramGate.notifyTomas,
  outputs: [path.relative(ROOT, OUT_JSON), path.relative(ROOT, OUT_MD)]
}, null, 2));

async function readJsonOrText(file) {
  try {
    const text = await fs.readFile(file, "utf8");
    if (file.endsWith(".json")) return { ok: true, file, data: JSON.parse(text) };
    return { ok: true, file, text };
  } catch (error) {
    return { ok: false, file, error: error?.message || String(error) };
  }
}

function criticFindings(inputs) {
  const out = [];
  const filter = inputs.filter.data;
  const drift = inputs.drift.data;
  const state = inputs.stateOfEdge.data;

  if (!inputs.filter.ok) {
    out.push(finding("missing-filter-report", "critical", "Strategy filter report is unavailable.", "validation", [
      proposal("restore-filter-report", "validation", "Run strategy-destruction-filter filter+verify before trusting any candidate state.", ["npm run filter", "npm run verify"])
    ]));
  } else {
    const survivors = filter.totals?.survivors ?? 0;
    const survivorShapes = filter.totals?.survivorShapes ?? 0;
    if (survivors === 0 && survivorShapes === 0) {
      out.push(finding("zero-survivor-state", "info", "Current destruction filter has zero survivors; this is acceptable and should block promotion pressure.", "validation", []));
    }
    const nearMisses = (filter.verdicts || []).filter((item) =>
      item.verdict?.status === "rejected" &&
      (item.verdict.failures || []).length === 1 &&
      item.verdict.failures.includes("weak_walk_forward_out_of_sample")
    );
    if (nearMisses.length > 0) {
      const sidecar = inputs.walkForwardNearMissSidecar.data;
      const sidecarFresh = inputs.walkForwardNearMissSidecar.ok &&
        sidecar?.source?.generatedAt === filter.generatedAt &&
        sidecar?.decision?.noThresholdChange === true &&
        sidecar?.decision?.noPromotion === true &&
        sidecar?.summary?.count === nearMisses.length;
      out.push(finding("walk-forward-near-miss-pressure", "medium", `${nearMisses.length} variants fail only walk-forward OOS; ${sidecarFresh ? "fresh sidecar keeps the pressure visible without relaxing gates" : "keep this pressure visible instead of loosening gates"}.`, "validation", sidecarFresh ? [] : [
        proposal("walk-forward-near-miss-sidecar", "validation", "Add or refresh a compact near-miss sidecar that explains why walk-forward stays hard.", ["local stats over filter-report.json", "no threshold change"])
      ]));
    }
  }

  if (inputs.drift.ok && drift.decision?.noThresholdChange !== true) {
    out.push(finding("drift-threshold-risk", "high", "Filter drift report does not explicitly preserve no-threshold-change.", "validation", [
      proposal("repair-drift-no-threshold-contract", "validation", "Make drift reporting state no threshold/promotion change unless a separate HITL approval exists.", ["verify-filter"])
    ]));
  }

  if (inputs.stateOfEdge.ok) {
    const verdict = state.verdict;
    const candidates = state.candidates || [];
    const review = candidates.filter((candidate) => candidate.action === "candidate_review");
    const watch = candidates.filter((candidate) => candidate.action === "watch_low_sample" || candidate.action === "watch");
    if (verdict === "no_trade_watch_low_sample" && watch.length > 0) {
      const ledger = inputs.watchRowAgingLedger.data;
      const ledgerFresh = inputs.watchRowAgingLedger.ok &&
        ledger?.source?.stateOfEdge?.generatedAt === state.generatedAt &&
        ledger?.decision?.noThresholdChange === true &&
        ledger?.decision?.noPromotion === true &&
        ledger?.summary?.activeRows === watch.length;
      out.push(finding("watch-low-sample-roster", "medium", `${watch.length} watch rows exist but remain low-sample or unproven; ${ledgerFresh ? "fresh aging ledger tracks sample progress and decay without promotion" : "do not upgrade without forward-paper support"}.`, "paper", ledgerFresh ? [] : [
        proposal("watch-row-aging-ledger", "paper", "Track how long watch rows survive and whether they decay before reaching sample gates.", ["state-of-edge-report.json", "paper/signals.json"])
      ]));
    }
    if (review.length > 0) {
      out.push(finding("candidate-review-needs-human-gate", "high", `${review.length} rows are candidate_review and need HITL before any promotion wording.`, "decision", [
        proposal("candidate-review-decision-memo", "decision", "Create a short decision memo with BTC gate, sample, OOS, baseline, shadow and failure slices.", ["state-of-edge-report.json", "filter-report.json"])
      ]));
    }
  }

  return out;
}

function backtestFindings(inputs) {
  const out = [];
  const filter = inputs.filter.data;
  if (!inputs.filter.ok) return out;

  const evaluation = filter.evaluation || {};
  const antiOverfit = filter.antiOverfitControls || {};
  const missing = [];
  const splitMethod = evaluation.split?.method;
  const hasChronologicalSplit = ["chronological_entry_time", "purged_embargo_entry_time"].includes(splitMethod);
  const hasNativePurgedEmbargo = splitMethod === "purged_embargo_entry_time"
    && antiOverfit.split?.method === "purged_embargo_entry_time"
    && Number.isInteger(antiOverfit.purgedBoundary?.candidateTrades)
    && antiOverfit.purgedBoundary.candidateTrades === antiOverfit.purgedBoundary.baselineTrades;
  if (!hasChronologicalSplit) missing.push("chronological split");
  if (splitMethod === "purged_embargo_entry_time" && !hasNativePurgedEmbargo) missing.push("purged/embargo accounting");
  if (evaluation.baseline?.method !== "time_matched_alternating_direction") missing.push("time-matched baseline");
  if (filter.multipleTesting?.label !== "approximate_multiple_testing_deflated_sharpe") missing.push("multiple-testing penalty label");
  if (!filter.gateGroupDiagnostics) missing.push("gate-group diagnostics");
  if (missing.length) {
    out.push(finding("backtest-hygiene-gap", "high", `Backtest report is missing: ${missing.join(", ")}.`, "validation", [
      proposal("repair-backtest-hygiene", "validation", "Restore missing anti-overfit report sections before considering strategy work.", ["npm run filter", "npm run verify"])
    ]));
  }

  const reportHasCosts = Number.isFinite(filter.gates?.minExpectancyR) && Number.isFinite(filter.gates?.minBaselineExpectancyLiftR);
  if (!reportHasCosts) {
    out.push(finding("cost-baseline-gate-gap", "high", "Filter gates do not expose cost/baseline floors clearly.", "validation", [
      proposal("explicit-cost-and-baseline-gates", "validation", "Make fees, slippage, funding assumptions, and baseline lift visible in reports.", ["config.default.json", "filter-report.md"])
    ]));
  }

  if (!hasNativePurgedEmbargo) {
    out.push(finding("purged-split-not-yet-native", "medium", "The filter has chronological split and walk-forward diagnostics, but no explicit purged/embargo split contract yet.", "validation", [
      proposal("purged-embargo-split-design", "validation", "Design a purged walk-forward/embargo extension before any high-frequency or overlapping-label candidate promotion.", ["engine.mjs", "testing-protocol"])
    ]));
  }

  return out;
}

function orderflowFindings(inputs) {
  const out = [];
  const planned = inputs.plannedLevel.data;
  if (!inputs.plannedLevel.ok) {
    out.push(finding("planned-level-proxy-missing", "medium", "Planned-level/Cluster Search proxy replay output is unavailable.", "orderflow", [
      proposal("run-planned-level-proxy", "validation", "Refresh the existing public/no-key planned-level proxy replay before ATAS integration.", ["npm run study:planned-level-proxy"])
    ]));
    return out;
  }

  const fetched = planned.totals?.fetchedTradeWindows ?? 0;
  const rows = planned.totals?.candidateEvents ?? 0;
  if (rows < planned.gates?.minFrozenEventsBeforeCandidate) {
    out.push(finding("planned-level-low-frozen-sample", "medium", `${rows} frozen planned-level events is below the ${planned.gates.minFrozenEventsBeforeCandidate} gate.`, "orderflow", [
      proposal("freeze-more-planned-level-events", "validation", "Accumulate more frozen planned-level rows before adding an absorption candidate.", ["planned-level-proxy-replay.json"])
    ]));
  }
  if (fetched < planned.gates?.minFetchedTradeWindowsBeforeRule) {
    out.push(finding("planned-level-low-trade-window-sample", "medium", `${fetched} fetched public trade windows is below the ${planned.gates.minFetchedTradeWindowsBeforeRule} gate.`, "orderflow", [
      proposal("bounded-aggtrades-window-refresh", "validation", "Run bounded no-key aggTrades fetch windows for recent planned-level events, then compare against ATAS export if available.", ["PLANNED_LEVEL_PROXY_FETCH=1"])
    ]));
  }

  return out;
}

function runtimeFindings(inputs) {
  const out = [];
  const health = inputs.serviceHealth.data;
  if (!inputs.serviceHealth.ok) return out;

  const notify = health.notifyTomas === true || health.summary?.notifyTomas === true;
  if (notify) {
    out.push(finding("runtime-health-notify-flag", "high", "Crypto runtime health report currently indicates notify-worthy evidence.", "runtime", [
      proposal("runtime-health-followup", "operations", "Recheck whether today's pre-fix OOM/duplicate evidence clears after the 24h window.", ["node crypto-updates/service-health-check.mjs"])
    ]));
  }
  return out;
}

function finding(id, severity, message, lane, proposals) {
  return { id, severity, lane, message, proposals };
}

function proposal(id, lane, action, validation) {
  return {
    id,
    lane,
    action,
    validation,
    promotionGate: "proposal_only_until_validated",
    noLiveChange: true
  };
}

function summarize(findings, proposals) {
  const bySeverity = {};
  for (const item of findings) bySeverity[item.severity] = (bySeverity[item.severity] || 0) + 1;
  const top = findings.find((item) => ["critical", "high"].includes(item.severity));
  return {
    verdict: top ? "needs_attention_internal" : proposals.length ? "proposals_ready_internal" : "no_action_needed",
    bySeverity,
    findingCount: findings.length,
    proposalCount: proposals.length
  };
}

function telegramGate(findings, proposals) {
  const urgent = findings.filter((item) => ["critical", "high"].includes(item.severity));
  return {
    notifyTomas: urgent.length > 0,
    reason: urgent.length
      ? `High/critical internal issues: ${urgent.map((item) => item.id).join(", ")}`
      : "No Telegram notification needed; keep normal loop internal.",
    proposalIds: proposals.map((proposal) => proposal.id)
  };
}

function severityRank(value) {
  return { critical: 0, high: 1, medium: 2, low: 3, info: 4 }[value] ?? 5;
}

function renderMarkdown(report) {
  const findings = report.findings.length
    ? report.findings.map((item) => `- ${item.severity.toUpperCase()} ${item.id}: ${item.message}`).join("\n")
    : "- None.";
  const proposals = report.proposals.length
    ? report.proposals.map((item) => `- ${item.id}: ${item.action} Validation: ${item.validation.join("; ")}.`).join("\n")
    : "- None.";
  return `# RALPH Adversarial Improvement Report

Generated: ${report.generatedAt}

Status: ${report.status}

Verdict: ${report.summary.verdict}

## Findings

${findings}

## Proposals

${proposals}

## Telegram Gate

- Notify Tomas: ${report.telegramGate.notifyTomas ? "yes" : "no"}
- Reason: ${report.telegramGate.reason}

## Boundary

Research/paper/proposal loop only. No live orders, exchange mutations, wallet-key handling, exchange-key handling, paid APIs, live alert wording changes, thresholds, sizing, TP/SL, execution behavior, public posting, or strategy promotion changed.
`;
}
