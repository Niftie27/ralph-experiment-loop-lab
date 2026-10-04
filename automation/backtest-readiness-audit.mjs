#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const FILTER_JSON = path.join(ROOT, "experiments", "strategy-destruction-filter", "results", "filter-report.json");
const PLANNED_JSON = path.join(ROOT, "experiments", "strategy-destruction-filter", "results", "planned-level-proxy-replay.json");
const OUT_JSON = path.join(ROOT, "outputs", "backtest-readiness-audit.json");
const OUT_MD = path.join(ROOT, "outputs", "backtest-readiness-audit.md");

const filter = await readJson(FILTER_JSON);
const planned = await readJson(PLANNED_JSON);
const purgedEmbargoReady = filter.evaluation?.split?.method === "purged_embargo_entry_time"
  && (filter.verdicts || []).every((item) => (
    item.splitMetadata
    && Number.isInteger(item.splitMetadata.purgedBoundaryTrades)
    && item.splitMetadata.purgedBoundaryTrades >= 0
    && item.splitMetadata.purgedBoundaryBaselineTrades === item.splitMetadata.purgedBoundaryTrades
    && item.splitMetadata.inSampleTrades + item.splitMetadata.outOfSampleTrades === item.stats?.sample
    && item.splitMetadata.baselineInSampleTrades + item.splitMetadata.baselineOutOfSampleTrades === item.baseline?.stats?.sample
  ));
const checks = [
  check("chronological-split", ["chronological_entry_time", "purged_embargo_entry_time"].includes(filter.evaluation?.split?.method), "Uses a chronological entry-time split anchor."),
  check("walk-forward-diagnostics", (filter.verdicts || []).every((item) => item.walkForward?.method === "equal_trade_count_chronological_folds"), "Every variant has walk-forward diagnostics."),
  check("baseline-comparison", filter.evaluation?.baseline?.method === "time_matched_alternating_direction", "Uses deterministic time-matched baseline."),
  check("multiple-testing-penalty", filter.multipleTesting?.label === "approximate_multiple_testing_deflated_sharpe", "Reports approximate multiple-testing deflated-Sharpe proxy."),
  check("gate-group-diagnostics", Boolean(filter.gateGroupDiagnostics), "Reports grouped pass pressure."),
  check("survivor-shape-dedup", Number.isInteger(filter.totals?.survivorShapes), "Deduplicates equivalent survivor shapes."),
  check("positive-oos-gate", (filter.gates?.minOutOfSampleExpectancyR ?? 0) > 0, "Requires positive out-of-sample expectancy."),
  check("baseline-lift-gate", (filter.gates?.minBaselineExpectancyLiftR ?? 0) > 0, "Requires lift over baseline."),
  check("planned-level-btc-gate", planned.gates?.requiresBtcGate === true, "Orderflow/planned-level rows require explicit BTC gate."),
  check("planned-level-sample-gates", planned.gates?.minFrozenEventsBeforeCandidate >= 20 && planned.gates?.minFetchedTradeWindowsBeforeRule >= 10, "Orderflow proxy has frozen-event and trade-window sample gates."),
  check("purged-embargo-split", purgedEmbargoReady, "Implements explicit purged/embargo split accounting for overlapping labels.")
];

const requiredFail = checks.filter((item) => !item.pass && item.required);
const report = {
  generatedAt: new Date().toISOString(),
  status: "research-only-backtest-readiness-audit",
  summary: {
    pass: checks.filter((item) => item.pass).length,
    fail: checks.filter((item) => !item.pass).length,
    verdict: requiredFail.length ? "not_ready_for_promotion" : "ready_for_research_only_validation"
  },
  checks,
  nextActions: [
    {
      id: "purged-embargo-split-design",
      action: "Keep explicit purged/embargo split accounting active before promoting overlapping intraday/orderflow labels.",
      status: purgedEmbargoReady ? "active_guard" : "proposed"
    },
    {
      id: "cost-assumption-surface",
      action: "Keep fees/slippage/funding/spread assumptions visible in every strategy report.",
      status: "active_guard"
    },
    {
      id: "baseline-always-on",
      action: "Every candidate must continue to beat a time-matched baseline and pass OOS baseline lift.",
      status: "active_guard"
    }
  ],
  boundary: "Audit only; no live trading, thresholds, scheduler, alert wording, risk, sizing, TP/SL, execution, public posting, or strategy promotion changed."
};

await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
await fs.writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(OUT_MD, renderMarkdown(report));

console.log(JSON.stringify({
  ok: true,
  verdict: report.summary.verdict,
  pass: report.summary.pass,
  fail: report.summary.fail,
  outputs: [path.relative(ROOT, OUT_JSON), path.relative(ROOT, OUT_MD)]
}, null, 2));

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function check(id, pass, description, required = true) {
  return { id, pass: Boolean(pass), required, description };
}

function renderMarkdown(report) {
  return `# Backtest Readiness Audit

Generated: ${report.generatedAt}

Verdict: ${report.summary.verdict}

## Checks

${report.checks.map((item) => `- ${item.pass ? "PASS" : "FAIL"} ${item.id}: ${item.description}`).join("\n")}

## Next Actions

${report.nextActions.map((item) => `- ${item.id}: ${item.action} (${item.status})`).join("\n")}

## Boundary

${report.boundary}
`;
}
