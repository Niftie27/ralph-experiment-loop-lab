import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const resultsDir = join(root, "results");
const leaderboardUrl = "https://stats-data.hyperliquid.xyz/Mainnet/leaderboard";

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function windowMap(row) {
  return Object.fromEntries((row.windowPerformances || []).map(([key, value]) => [key, value]));
}

function rowMetric(row, window, field) {
  return asNumber(windowMap(row)[window]?.[field]);
}

function compactRow(row) {
  const dayPnl = rowMetric(row, "day", "pnl");
  const weekPnl = rowMetric(row, "week", "pnl");
  const monthPnl = rowMetric(row, "month", "pnl");
  const allTimePnl = rowMetric(row, "allTime", "pnl");
  const monthVolume = rowMetric(row, "month", "vlm");
  const accountValue = asNumber(row.accountValue);
  const oneHitRisk =
    Number.isFinite(allTimePnl) && Number.isFinite(monthPnl) && Math.abs(allTimePnl) > 0
      ? Math.abs(monthPnl) / Math.abs(allTimePnl)
      : null;

  return {
    address: String(row.ethAddress || "").toLowerCase(),
    displayName: row.displayName || null,
    accountValue,
    dayPnl,
    weekPnl,
    monthPnl,
    allTimePnl,
    monthVolume,
    oneHitRiskRatio: oneHitRisk === null ? null : Number(oneHitRisk.toFixed(4))
  };
}

function riskTags(row) {
  const tags = [];
  if ((row.accountValue ?? 0) < 10_000) tags.push("small-account-capacity-risk");
  if ((row.allTimePnl ?? 0) > 1_000_000 && (row.accountValue ?? 0) < 0.1 * (row.allTimePnl ?? 0)) {
    tags.push("withdrawn-or-stale-profit-risk");
  }
  if ((row.allTimePnl ?? 0) > 1_000_000 && (row.monthVolume ?? 0) === 0) tags.push("inactive-recent-volume-risk");
  if ((row.oneHitRiskRatio ?? 0) > 0.75) tags.push("recent-pnl-concentration-risk");
  if ((row.monthVolume ?? 0) > 100_000_000 && (row.accountValue ?? 0) < 100_000) tags.push("high-turnover-friction-risk");
  if ((row.weekPnl ?? 0) < 0 && (row.allTimePnl ?? 0) > 0) tags.push("recent-drawdown-risk");
  if (tags.length === 0) tags.push("needs-fill-history-check");
  return tags;
}

function renderMarkdown(result) {
  const lines = [
    "# Hyperliquid Public Route Ledger",
    "",
    `Generated: ${result.generatedAt}`,
    "",
    "Mode: research-only, public/no-key route audit.",
    "",
    "## Access Verdict",
    "",
    result.verdict,
    "",
    "## Routes",
    "",
    "| Route | Access class | Programmatic? | RALPH use | Status |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const route of result.routes) {
    lines.push(`| ${route.name} | ${route.accessClass} | ${route.programmatic} | ${route.ralphUse} | ${route.status} |`);
  }

  lines.push(
    "",
    "## Leaderboard Snapshot",
    "",
    `- Rows returned: ${result.leaderboard.rowsReturned}`,
    `- Rows with addresses: ${result.leaderboard.rowsWithAddress}`,
    `- Rows with positive all-time PnL: ${result.leaderboard.positiveAllTimePnl}`,
    `- Rows with positive all-time and negative week PnL: ${result.leaderboard.positiveAllTimeNegativeWeek}`,
    "",
    "## Top Compact Rows",
    "",
    "| Address | Account value | Day PnL | Week PnL | Month PnL | All-time PnL | Month volume | Risk tags |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  );

  for (const row of result.leaderboard.topRows) {
    lines.push(
      `| \`${row.address}\` | ${num(row.accountValue)} | ${num(row.dayPnl)} | ${num(row.weekPnl)} | ${num(row.monthPnl)} | ${num(row.allTimePnl)} | ${num(row.monthVolume)} | ${row.riskTags.join(", ")} |`,
    );
  }

  lines.push(
    "",
    "## Decision",
    "",
    "The official stats endpoint is an active no-key public route for candidate-source discovery, but it is leaderboard-selected and cannot prove copyability. Rows from it must pass independent `userFills`/`clearinghouseState` intake and outlier, latency, capacity, beta, hidden-hedge, and exit-shadowing checks before any frozen paper cohort spec.",
    "",
    "No live copying, trading, wallet keys, exchange keys, paid APIs, account setup, public posting, scheduler changes, alert wording, thresholds, risk/sizing, TP/SL, execution, or orders changed.",
    "",
  );

  return lines.join("\n");
}

function num(value) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : "n/a";
}

const response = await fetch(leaderboardUrl);
const leaderboardBody = await response.json();
const rows = Array.isArray(leaderboardBody?.leaderboardRows) ? leaderboardBody.leaderboardRows : [];
const compactRows = rows.map(compactRow).filter((row) => /^0x[a-f0-9]{40}$/.test(row.address));
const topRows = compactRows
  .filter((row) => Number.isFinite(row.allTimePnl))
  .sort((a, b) => (b.allTimePnl ?? -Infinity) - (a.allTimePnl ?? -Infinity))
  .slice(0, 12)
  .map((row) => ({ ...row, riskTags: riskTags(row) }));

const result = {
  generatedAt: new Date().toISOString(),
  source: leaderboardUrl,
  verdict:
    response.ok && compactRows.length > 0
      ? "Hyperliquid's public stats leaderboard is reachable without a key and returns structured wallet rows. It is usable as a discovery route only, not as evidence of copyable edge."
      : "Hyperliquid's public stats leaderboard was not usable from this workspace during this run.",
  routes: [
    {
      name: "Hyperliquid public stats leaderboard",
      url: leaderboardUrl,
      accessClass: response.ok ? "verified-public-no-key" : "blocked",
      programmatic: response.ok ? "yes" : "no",
      ralphUse: "address seed discovery only; must independent-check fills/state",
      status: response.ok ? "active-discovery-route" : "blocked"
    },
    {
      name: "Hyperliquid official info endpoint",
      url: "https://api.hyperliquid.xyz/info",
      accessClass: "verified-public-no-key",
      programmatic: "yes",
      ralphUse: "independent clearinghouseState/userFills checks for known addresses",
      status: "active-verification-route"
    },
    {
      name: "HypurrScan",
      url: "https://hypurrscan.io/",
      accessClass: "verified-public-manual",
      programmatic: "not verified",
      ralphUse: "manual address/profile cross-checks",
      status: "watch/manual"
    },
    {
      name: "HyperDash Explore",
      url: "https://hyperdash.com/explore",
      accessClass: "verified-public-js-page",
      programmatic: "not verified",
      ralphUse: "manual cohort/source discovery and prior-art UX reference",
      status: "watch/manual"
    },
    {
      name: "HyperTracker",
      url: "https://hypertracker.io/",
      accessClass: "verified-public-page; API/pricing exists",
      programmatic: "needs account/API for official product route",
      ralphUse: "manual discovery and prior-art; API remains needs-access",
      status: "watch/needs-access"
    },
    {
      name: "Nansen Hyperliquid leaderboard API",
      url: "https://docs.nansen.ai/api/hyperliquid/hyperliquid-leaderboard",
      accessClass: "documented-api-key-required",
      programmatic: "not active in this workspace",
      ralphUse: "future paid/keyed smart-money reference if approved",
      status: "needs-access"
    },
    {
      name: "Apify Hyperliquid leaderboard actors",
      url: "https://apify.com/gochujang/hyperliquid-leaderboard",
      accessClass: "public listing; paid-per-use/account path",
      programmatic: "not active in this workspace",
      ralphUse: "watch as possible extractor if free public route breaks",
      status: "watch/needs-approval"
    }
  ],
  leaderboard: {
    rowsReturned: rows.length,
    rowsWithAddress: compactRows.length,
    positiveAllTimePnl: compactRows.filter((row) => (row.allTimePnl ?? 0) > 0).length,
    positiveAllTimeNegativeWeek: compactRows.filter((row) => (row.allTimePnl ?? 0) > 0 && (row.weekPnl ?? 0) < 0).length,
    topRows
  }
};

await mkdir(resultsDir, { recursive: true });
await writeFile(join(resultsDir, "hyperliquid-public-route-ledger.json"), `${JSON.stringify(result, null, 2)}\n`);
await writeFile(join(resultsDir, "hyperliquid-public-route-ledger.md"), renderMarkdown(result));

console.log(JSON.stringify({
  generatedAt: result.generatedAt,
  routes: result.routes.length,
  leaderboardRows: result.leaderboard.rowsReturned,
  rowsWithAddress: result.leaderboard.rowsWithAddress,
  output: "results/hyperliquid-public-route-ledger.md"
}, null, 2));
