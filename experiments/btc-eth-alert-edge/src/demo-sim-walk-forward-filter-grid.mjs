#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RESULTS_DIR = path.join(ROOT, "results");
const REPLAY_JSON_PATH = path.join(RESULTS_DIR, "historical-demo-sim-replay.json");
const REPORT_JSON_PATH = path.join(RESULTS_DIR, "demo-sim-walk-forward-filter-grid.json");
const REPORT_MD_PATH = path.join(RESULTS_DIR, "demo-sim-walk-forward-filter-grid.md");

const STARTING_CAPITAL_USD = 10_000;
const FIT_END = Date.parse("2026-09-01T00:00:00.000Z") / 1000;
const PURGE_DAYS = 3;
const PURGE_SECONDS = PURGE_DAYS * 24 * 60 * 60;
const FIT_CUTOFF = FIT_END - PURGE_SECONDS;
const FORWARD_START = FIT_END + PURGE_SECONDS;

const round = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const pct = (value) => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "n/a";
const money = (value) => Number.isFinite(value) ? value.toFixed(2) : "n/a";
const cell = (value) => String(value ?? "n/a").replaceAll("|", " / ");

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function table(rows, columns) {
  if (!rows.length) return "_No rows._";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map((column) => column.align ?? "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(column.value(row))).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}

function closedRecords(replay) {
  return (Array.isArray(replay.records) ? replay.records : [])
    .filter((record) => record.status === "closed")
    .sort((a, b) => (a.exitTime ?? 0) - (b.exitTime ?? 0) || String(a.id).localeCompare(String(b.id)));
}

function splitRows(rows) {
  return {
    fit: rows.filter((row) => (row.exitTime ?? 0) < FIT_CUTOFF),
    purgedBoundary: rows.filter((row) => (row.exitTime ?? 0) >= FIT_CUTOFF && (row.exitTime ?? 0) < FORWARD_START),
    forward: rows.filter((row) => (row.exitTime ?? 0) >= FORWARD_START),
  };
}

function maxDrawdown(rows, startingCapitalUsd = STARTING_CAPITAL_USD) {
  let equity = startingCapitalUsd;
  let peak = startingCapitalUsd;
  let maxDrawdownUsd = 0;
  let maxDrawdownPct = 0;

  for (const row of rows) {
    equity += row.pnl?.netPnlUsd ?? 0;
    peak = Math.max(peak, equity);
    const drawdownUsd = peak - equity;
    const drawdownPct = peak > 0 ? drawdownUsd / peak : 0;
    if (drawdownUsd > maxDrawdownUsd) {
      maxDrawdownUsd = drawdownUsd;
      maxDrawdownPct = drawdownPct;
    }
  }

  return {
    endingEquityUsd: round(equity, 2),
    maxDrawdownUsd: round(maxDrawdownUsd, 2),
    maxDrawdownPct: round(maxDrawdownPct, 6),
  };
}

function summarize(rows) {
  const wins = rows.filter((row) => (row.pnl?.netPnlUsd ?? 0) > 0);
  const losses = rows.filter((row) => (row.pnl?.netPnlUsd ?? 0) <= 0);
  const grossWins = wins.reduce((sum, row) => sum + row.pnl.netPnlUsd, 0);
  const grossLosses = Math.abs(losses.reduce((sum, row) => sum + row.pnl.netPnlUsd, 0));
  const netPnlUsd = rows.reduce((sum, row) => sum + (row.pnl?.netPnlUsd ?? 0), 0);
  const feesUsd = rows.reduce((sum, row) => sum + (row.pnl?.feesUsd ?? 0), 0);
  const rRows = rows.filter((row) => Number.isFinite(row.pnl?.rMultiple));
  const netR = rRows.reduce((sum, row) => sum + row.pnl.rMultiple, 0);
  const drawdown = maxDrawdown(rows);

  return {
    closedTrades: rows.length,
    wins: wins.length,
    losses: losses.length,
    winrate: rows.length ? round(wins.length / rows.length, 6) : null,
    netPnlUsd: round(netPnlUsd, 2),
    feesUsd: round(feesUsd, 2),
    profitFactor: grossLosses > 0 ? round(grossWins / grossLosses, 4) : (grossWins > 0 ? Infinity : null),
    avgR: rRows.length ? round(netR / rRows.length, 4) : null,
    invalidRiskRecords: rows.length - rRows.length,
    ambiguousTrades: rows.filter((row) => row.ambiguous).length,
    maxDrawdownPct: drawdown.maxDrawdownPct,
    maxDrawdownUsd: drawdown.maxDrawdownUsd,
    endingEquityUsd: drawdown.endingEquityUsd,
  };
}

function optionMatches(value, option) {
  if (option.values === "all") return true;
  return option.values.includes(value);
}

function buildPolicies(records) {
  const setupOptions = [
    { id: "all_setups", label: "all setups", values: "all" },
    ...[...new Set(records.map((row) => row.setup).filter(Boolean))].sort()
      .map((setup) => ({ id: setup, label: `setup=${setup}`, values: [setup] })),
  ];
  const directionOptions = [
    { id: "all_directions", label: "all directions", values: "all" },
    { id: "long", label: "direction=long", values: ["long"] },
    { id: "short", label: "direction=short", values: ["short"] },
  ];
  const btcOptions = [
    { id: "all_btc", label: "all BTC gates", values: "all" },
    { id: "btc_risk_on", label: "btc=BTC_RISK_ON", values: ["BTC_RISK_ON"] },
    { id: "btc_risk_on_or_transition", label: "btc=BTC_RISK_ON|BTC_TRANSITION", values: ["BTC_RISK_ON", "BTC_TRANSITION"] },
    { id: "btc_not_risk_off", label: "btc!=BTC_RISK_OFF", values: ["BTC_RISK_ON", "BTC_TRANSITION", "BTC_SELF"] },
  ];
  const timeframeOptions = [
    { id: "all_timeframes", label: "all timeframes", values: "all" },
    { id: "tf_1h", label: "timeframe=1h", values: ["1h"] },
    { id: "tf_4h", label: "timeframe=4h", values: ["4h"] },
  ];
  const tierOptions = [
    { id: "all_tiers", label: "all tiers", values: "all" },
    { id: "tier_b", label: "tier=B", values: ["B"] },
    { id: "tier_b_or_low_sample", label: "tier=B|low-sample", values: ["B", "low-sample"] },
    { id: "tier_not_avoid", label: "tier!=avoid", values: ["B", "C", "low-sample"] },
  ];

  const policies = [];
  for (const setup of setupOptions) {
    for (const direction of directionOptions) {
      for (const btc of btcOptions) {
        for (const timeframe of timeframeOptions) {
          for (const tier of tierOptions) {
            const parts = [setup, direction, btc, timeframe, tier];
            policies.push({
              id: parts.map((part) => part.id).join("__"),
              label: parts.map((part) => part.label).join(", "),
              filter: (row) => (
                optionMatches(row.setup, setup)
                && optionMatches(row.direction, direction)
                && optionMatches(row.btcGate?.state ?? "BTC_UNKNOWN", btc)
                && optionMatches(row.timeframe, timeframe)
                && optionMatches(row.tier ?? "unknown", tier)
              ),
            });
          }
        }
      }
    }
  }
  return policies;
}

function verdictFor(fit, forward) {
  if (fit.closedTrades < 30) return "reject_fit_sample_low";
  if ((fit.netPnlUsd ?? 0) <= 0 || (fit.profitFactor ?? 0) < 1.2) return "reject_fit_weak";
  if (forward.closedTrades < 15) return "watch_forward_sample_low";
  if ((forward.netPnlUsd ?? 0) <= 0 || (forward.profitFactor ?? 0) < 1.05) return "reject_forward_weak";
  if ((forward.maxDrawdownPct ?? 0) > 0.25) return "watch_forward_drawdown_high";
  if ((fit.profitFactor ?? 0) >= 1.8 && (forward.profitFactor ?? 0) < 1.2) return "watch_fit_decay";
  return "candidate_survives_walk_forward_grid";
}

function scorePolicy(fit, forward) {
  const forwardNet = forward.netPnlUsd ?? 0;
  const forwardPf = Number.isFinite(forward.profitFactor) ? forward.profitFactor : 0;
  const drawdownPenalty = (forward.maxDrawdownPct ?? 0) * 10_000;
  const sampleBonus = Math.min(forward.closedTrades, 50) * 20;
  const fitPenalty = Math.max(0, (fit.profitFactor ?? 0) - forwardPf) * 500;
  return round(forwardNet + sampleBonus + (forwardPf * 250) - drawdownPenalty - fitPenalty, 4);
}

function evaluatePolicy(records, policy) {
  const matched = records.filter(policy.filter);
  const split = splitRows(matched);
  const fit = summarize(split.fit);
  const forward = summarize(split.forward);
  const purgedBoundary = summarize(split.purgedBoundary);
  const verdict = verdictFor(fit, forward);
  return {
    id: policy.id,
    label: policy.label,
    matched: matched.length,
    fit,
    purgedBoundary,
    forward,
    verdict,
    score: scorePolicy(fit, forward),
  };
}

function groupRows(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()]
    .map(([key, group]) => ({ key, ...summarize(group) }))
    .sort((a, b) => (b.netPnlUsd ?? -Infinity) - (a.netPnlUsd ?? -Infinity) || b.closedTrades - a.closedTrades);
}

async function main() {
  const replay = await readJson(REPLAY_JSON_PATH);
  const records = closedRecords(replay);
  const policies = buildPolicies(records);
  const evaluations = policies.map((policy) => evaluatePolicy(records, policy));
  const survivors = evaluations
    .filter((row) => row.verdict === "candidate_survives_walk_forward_grid")
    .sort((a, b) => b.score - a.score || b.forward.netPnlUsd - a.forward.netPnlUsd);
  const watch = evaluations
    .filter((row) => row.verdict.startsWith("watch_"))
    .sort((a, b) => b.score - a.score || b.forward.netPnlUsd - a.forward.netPnlUsd);
  const rejected = evaluations.filter((row) => row.verdict.startsWith("reject_"));
  const topPolicies = [...survivors, ...watch, ...rejected.sort((a, b) => b.score - a.score)]
    .slice(0, 20);

  const selected = survivors[0] ?? watch[0] ?? topPolicies[0] ?? null;
  const selectedRows = selected ? records.filter(buildPolicies(records).find((policy) => policy.id === selected.id).filter) : [];
  const selectedSplit = splitRows(selectedRows);

  const status = survivors.length ? "candidate_survives_walk_forward_grid" : "no_capital_ready_filter";
  const report = {
    generated: new Date().toISOString(),
    status,
    sourceReplay: path.relative(ROOT, REPLAY_JSON_PATH),
    outputs: {
      json: path.relative(ROOT, REPORT_JSON_PATH),
      markdown: path.relative(ROOT, REPORT_MD_PATH),
    },
    boundaries: [
      "research_only",
      "no_live_execution",
      "no_exchange_keys",
      "no_paid_apis",
      "no_tradingview_automation",
      "no_alert_wording_threshold_watcher_or_sizing_changes",
      "no_strategy_promotion",
    ],
    assumptions: {
      fitWindow: {
        label: "pre-split fit",
        exitsBefore: new Date(FIT_CUTOFF * 1000).toISOString(),
      },
      purgedBoundary: {
        daysEachSide: PURGE_DAYS,
        exitsFrom: new Date(FIT_CUTOFF * 1000).toISOString(),
        exitsBefore: new Date(FORWARD_START * 1000).toISOString(),
      },
      forwardWindow: {
        label: "post-purge forward",
        exitsFrom: new Date(FORWARD_START * 1000).toISOString(),
      },
      fitPass: "closedTrades>=30, netPnlUsd>0, profitFactor>=1.2",
      forwardPass: "closedTrades>=15, netPnlUsd>0, profitFactor>=1.05, maxDrawdownPct<=25%",
      score: "forward net plus sample/PF bonuses minus drawdown and fit-decay penalties",
      replayPositionSizing: replay.assumptions?.account ?? null,
      fees: replay.assumptions?.fees ?? null,
      execution: replay.assumptions?.execution ?? null,
    },
    counts: {
      closedRecords: records.length,
      policiesTested: evaluations.length,
      survivors: survivors.length,
      watch: watch.length,
      rejected: rejected.length,
    },
    selected,
    topPolicies,
    selectedBreakdowns: selected ? {
      fitBySymbolTimeframe: groupRows(selectedSplit.fit, (row) => `${row.symbol}:${row.timeframe}`),
      forwardBySymbolTimeframe: groupRows(selectedSplit.forward, (row) => `${row.symbol}:${row.timeframe}`),
      forwardByTier: groupRows(selectedSplit.forward, (row) => row.tier ?? "unknown"),
      purgedBoundary: selected.purgedBoundary,
    } : null,
    decision: {
      verdict: status,
      interpretation: survivors.length
        ? "At least one simple policy survives the purged August/September walk-forward grid, but this is still research-only because the replay is synthetic, sample sizes are small, and the selected filter was chosen from a grid."
        : "No filter is capital-ready after the purged walk-forward grid; use the result as a rejection/filtering surface before any watcher or sizing change.",
      nextActions: survivors.length
        ? [
          "Do not promote to live, DEMO sizing, or watcher behavior from this grid alone.",
          "Freeze the top surviving policy and run a longer forward-paper or replay extension before treating it as a candidate.",
          "Compare the selected filter against a simple no-trade / long-only baseline on the same post-purge rows.",
        ]
        : [
          "Do not promote any DEMO-SIM replay filter to live, DEMO sizing, or watcher behavior.",
          "Keep the range-breakout BTC risk-on branch in research/Watch until more forward rows or stricter baselines exist.",
          "Prioritize strategy-source discovery or replay coverage improvements rather than loosening thresholds.",
        ],
    },
    limitations: [
      "The replay is synthetic historical DEMO-SIM evidence, not real exchange fills.",
      "The walk-forward split has only August/September coverage, so survivorship and multiple-testing risk remain material.",
      "Purged boundary rows are excluded by exit time only; overlapping position risk, funding, liquidation, queue priority, and slippage are not modeled.",
      "The grid intentionally uses simple interpretable filters rather than optimized parameters; a survivor is a candidate for further falsification, not a promotion.",
    ],
  };

  await writeJson(REPORT_JSON_PATH, report);

  const policyColumns = [
    { label: "Policy", value: (row) => row.id },
    { label: "Verdict", value: (row) => row.verdict },
    { label: "Score", align: "---:", value: (row) => row.score },
    { label: "Fit n", align: "---:", value: (row) => row.fit.closedTrades },
    { label: "Fit Net", align: "---:", value: (row) => money(row.fit.netPnlUsd) },
    { label: "Fit PF", align: "---:", value: (row) => row.fit.profitFactor ?? "n/a" },
    { label: "Purge n", align: "---:", value: (row) => row.purgedBoundary.closedTrades },
    { label: "Fwd n", align: "---:", value: (row) => row.forward.closedTrades },
    { label: "Fwd Net", align: "---:", value: (row) => money(row.forward.netPnlUsd) },
    { label: "Fwd PF", align: "---:", value: (row) => row.forward.profitFactor ?? "n/a" },
    { label: "Fwd DD", align: "---:", value: (row) => pct(row.forward.maxDrawdownPct) },
  ];
  const groupColumns = [
    { label: "Group", value: (row) => row.key },
    { label: "Closed", align: "---:", value: (row) => row.closedTrades },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Net USDT", align: "---:", value: (row) => money(row.netPnlUsd) },
    { label: "PF", align: "---:", value: (row) => row.profitFactor ?? "n/a" },
    { label: "Max DD", align: "---:", value: (row) => pct(row.maxDrawdownPct) },
  ];

  const md = `# DEMO-SIM Walk-Forward Filter Grid\n\nGenerated: ${report.generated}\nSource replay: \`${report.sourceReplay}\`\n\nStatus: \`${report.status}\`\n\nThis report runs a small purged walk-forward grid over existing historical DEMO-SIM replay rows. It fits simple interpretable filters before the split, excludes a ${PURGE_DAYS}-day boundary on each side, and checks post-purge forward behavior after fees. It is research-only and does not change live execution, keys, schedulers, TradingView automation, alert wording, thresholds, watchers, risk/sizing, or strategy promotion.\n\n## Summary\n\n| Closed Records | Policies Tested | Survivors | Watch | Rejected |\n| ---: | ---: | ---: | ---: | ---: |\n| ${report.counts.closedRecords} | ${report.counts.policiesTested} | ${report.counts.survivors} | ${report.counts.watch} | ${report.counts.rejected} |\n\n## Split Contract\n\n- Fit exits before: ${report.assumptions.fitWindow.exitsBefore}\n- Purged boundary: ${report.assumptions.purgedBoundary.exitsFrom} to ${report.assumptions.purgedBoundary.exitsBefore}\n- Forward exits from: ${report.assumptions.forwardWindow.exitsFrom}\n- Fit pass: ${report.assumptions.fitPass}\n- Forward pass: ${report.assumptions.forwardPass}\n\n## Top Policies\n\n${table(report.topPolicies, policyColumns)}\n\n## Selected Policy\n\n${selected ? `\`${selected.id}\`\n\n${selected.label}\n\nVerdict: \`${selected.verdict}\`` : "_No selected policy._"}\n\nInterpretation: ${report.decision.interpretation}\n\n## Selected Forward By Symbol And Timeframe\n\n${report.selectedBreakdowns ? table(report.selectedBreakdowns.forwardBySymbolTimeframe, groupColumns) : "_No selected policy._"}\n\n## Selected Forward By Tier\n\n${report.selectedBreakdowns ? table(report.selectedBreakdowns.forwardByTier, groupColumns) : "_No selected policy._"}\n\n## Next Actions\n\n${report.decision.nextActions.map((item) => `- ${item}`).join("\n")}\n\n## Limitations\n\n${report.limitations.map((item) => `- ${item}`).join("\n")}\n`;

  await fs.writeFile(REPORT_MD_PATH, md);
  console.log(JSON.stringify({
    ok: true,
    status,
    reportJson: REPORT_JSON_PATH,
    reportMarkdown: REPORT_MD_PATH,
    counts: report.counts,
    selected: selected ? {
      id: selected.id,
      verdict: selected.verdict,
      fit: selected.fit,
      forward: selected.forward,
    } : null,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
