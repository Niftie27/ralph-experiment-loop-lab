import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const PAPER_PATH = path.join(ROOT, "paper", "signals.json");
const RESULTS_DIR = path.join(ROOT, "results");
const DASHBOARD_JSON_PATH = path.join(RESULTS_DIR, "paper-dashboard.json");
const DASHBOARD_MD_PATH = path.join(RESULTS_DIR, "paper-dashboard.md");

const round = (n, d = 4) => Number.isFinite(n) ? Number(n.toFixed(d)) : null;
const pct = (n) => Number.isFinite(n) ? `${(n * 100).toFixed(1)}%` : "n/a";
const iso = (seconds) => Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : "n/a";
const cell = (value) => String(value).replaceAll("|", " / ");
const tierOrder = new Map([["A", 0], ["B", 1], ["C", 2], ["low-sample", 3], ["avoid", 4]]);

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function emptyGroup(key) {
  return {
    key,
    total: 0,
    open: 0,
    closed: 0,
    wins: 0,
    losses: 0,
    scratch: 0,
    resultR: 0,
    target: 0,
    stop: 0,
    horizon: 0,
    stopFirstCollision: 0,
  };
}

function addSignal(group, signal) {
  group.total += 1;
  if (signal.status === "open") {
    group.open += 1;
    return;
  }

  group.closed += 1;
  const resultR = Number(signal.resultR);
  if (Number.isFinite(resultR)) {
    group.resultR += resultR;
    if (resultR > 0) group.wins += 1;
    else if (resultR < 0) group.losses += 1;
    else group.scratch += 1;
  }

  if (signal.exitReason === "target") group.target += 1;
  else if (signal.exitReason === "stop") group.stop += 1;
  else if (signal.exitReason === "horizon") group.horizon += 1;
  else if (signal.exitReason === "stop-first-collision") group.stopFirstCollision += 1;
}

function finalizeGroup(group) {
  const closedWithResult = group.wins + group.losses + group.scratch;
  return {
    ...group,
    resultR: round(group.resultR, 4),
    avgR: closedWithResult ? round(group.resultR / closedWithResult, 4) : null,
    winrate: closedWithResult ? round(group.wins / closedWithResult, 4) : null,
  };
}

function groupBy(signals, keyFn) {
  const groups = new Map();
  for (const signal of signals) {
    const key = keyFn(signal);
    if (!groups.has(key)) groups.set(key, emptyGroup(key));
    addSignal(groups.get(key), signal);
  }
  return [...groups.values()]
    .map(finalizeGroup)
    .sort((a, b) => {
      const tierA = tierOrder.has(a.key) ? tierOrder.get(a.key) : null;
      const tierB = tierOrder.has(b.key) ? tierOrder.get(b.key) : null;
      if (tierA !== null || tierB !== null) return (tierA ?? 99) - (tierB ?? 99);
      return (b.closed - a.closed) || ((b.avgR ?? -999) - (a.avgR ?? -999)) || a.key.localeCompare(b.key);
    });
}

function table(rows, columns) {
  if (!rows.length) return "_No rows._";
  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const sep = `| ${columns.map((column) => column.align ?? "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => cell(column.value(row))).join(" | ")} |`);
  return [header, sep, ...body].join("\n");
}

function shortSignal(signal) {
  const state = signal.status === "open"
    ? "open"
    : `${signal.exitReason ?? "closed"} ${Number.isFinite(signal.resultR) ? `${round(signal.resultR, 3)}R` : ""}`.trim();
  const regime = signal.regime ?? "unknown-regime";
  return `${iso(signal.openedAt)} ${signal.symbol} ${signal.timeframe} ${signal.direction} ${signal.setup} ${regime} ${signal.tier}: ${state}`;
}

async function main() {
  const paper = await readJson(PAPER_PATH);
  const signals = Array.isArray(paper.signals) ? paper.signals : [];
  const closed = signals.filter((signal) => signal.status === "closed");
  const open = signals.filter((signal) => signal.status === "open");
  const qualified = signals.filter((signal) => ["A", "B", "C"].includes(signal.tier));
  const learning = signals.filter((signal) => !["A", "B", "C"].includes(signal.tier));

  const overall = finalizeGroup(signals.reduce((group, signal) => {
    addSignal(group, signal);
    return group;
  }, emptyGroup("all")));

  const dashboard = {
    generated: new Date().toISOString(),
    sourceUpdated: paper.updated ?? null,
    status: "paper-only-no-live-execution",
    note: "Forward paper ledger summary. Fake entries/stops/targets only; no live orders or financial advice.",
    overall,
    qualified: finalizeGroup(qualified.reduce((group, signal) => {
      addSignal(group, signal);
      return group;
    }, emptyGroup("A/B/C"))),
    learning: finalizeGroup(learning.reduce((group, signal) => {
      addSignal(group, signal);
      return group;
    }, emptyGroup("low-sample/avoid"))),
    byTier: groupBy(signals, (signal) => signal.tier ?? "unknown"),
    byTierSetup: groupBy(signals, (signal) => `${signal.tier ?? "unknown"}|${signal.setup ?? "unknown"}`),
    byTierSetupRegime: groupBy(signals, (signal) => `${signal.tier ?? "unknown"}|${signal.setup ?? "unknown"}|${signal.regime ?? "unknown-regime"}`),
    bySymbolTimeframe: groupBy(signals, (signal) => `${signal.symbol ?? "unknown"}|${signal.timeframe ?? "unknown"}`),
    bySymbolTimeframeSetupRegime: groupBy(signals, (signal) => `${signal.symbol ?? "unknown"}|${signal.timeframe ?? "unknown"}|${signal.setup ?? "unknown"}|${signal.regime ?? "unknown-regime"}`),
    bySetup: groupBy(signals, (signal) => signal.setup ?? "unknown"),
    openSignals: open
      .sort((a, b) => b.openedAt - a.openedAt)
      .map(shortSignal),
    recentClosed: closed
      .sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))
      .slice(0, 20)
      .map(shortSignal),
  };

  await writeJson(DASHBOARD_JSON_PATH, dashboard);

  const columns = [
    { label: "Group", value: (row) => row.key },
    { label: "Total", align: "---:", value: (row) => row.total },
    { label: "Open", align: "---:", value: (row) => row.open },
    { label: "Closed", align: "---:", value: (row) => row.closed },
    { label: "Winrate", align: "---:", value: (row) => pct(row.winrate) },
    { label: "Total R", align: "---:", value: (row) => row.resultR ?? "n/a" },
    { label: "Avg R", align: "---:", value: (row) => row.avgR ?? "n/a" },
    { label: "Targets", align: "---:", value: (row) => row.target },
    { label: "Stops", align: "---:", value: (row) => row.stop + row.stopFirstCollision },
  ];

  const md = `# Forward Paper Dashboard\n\nGenerated: ${dashboard.generated}\nSource updated: ${dashboard.sourceUpdated ?? "n/a"}\n\nStatus: paper-only, no live execution.\n\nThis dashboard separates qualified A/B/C tiers from low-sample and avoid rows. Regime-aware groups are keyed by trend and volatility bucket so historical bucket checks can demand matching forward paper support. It is a research ledger, not an exchange paper account and not a trade recommendation.\n\n## Overall\n\n${table([dashboard.overall, dashboard.qualified, dashboard.learning], columns)}\n\n## By Tier\n\n${table(dashboard.byTier, columns)}\n\n## By Tier And Setup\n\n${table(dashboard.byTierSetup.slice(0, 20), columns)}\n\n## By Tier, Setup, And Regime\n\n${table(dashboard.byTierSetupRegime.slice(0, 30), columns)}\n\n## By Symbol And Timeframe\n\n${table(dashboard.bySymbolTimeframe, columns)}\n\n## By Symbol, Timeframe, Setup, And Regime\n\n${table(dashboard.bySymbolTimeframeSetupRegime.slice(0, 40), columns)}\n\n## Open Signals\n\n${dashboard.openSignals.length ? dashboard.openSignals.map((line) => `- ${line}`).join("\n") : "- None"}\n\n## Recent Closed\n\n${dashboard.recentClosed.length ? dashboard.recentClosed.map((line) => `- ${line}`).join("\n") : "- None"}\n`;

  await fs.writeFile(DASHBOARD_MD_PATH, md);

  console.log(JSON.stringify({
    ok: true,
    dashboardJson: DASHBOARD_JSON_PATH,
    dashboardMarkdown: DASHBOARD_MD_PATH,
    overall: dashboard.overall,
    qualified: dashboard.qualified,
    learning: dashboard.learning,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
