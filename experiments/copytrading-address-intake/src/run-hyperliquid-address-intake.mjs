import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const resultsDir = join(root, "results");
const defaultAddressesPath = join(root, "data", "sample-addresses.json");
const invocationCwd = process.env.INIT_CWD ?? process.cwd();

if (process.argv.includes("--help")) {
  console.log("Usage: npm run intake:hyperliquid --prefix ralph-research-os/experiments/copytrading-address-intake -- [--addresses path/to/addresses.json] [--output-prefix name]");
  console.log("Runs public/no-key Hyperliquid info probes for a research-only address sample.");
  console.log("Address JSON shape: [{ address, source, initialStatus }]");
  process.exit(0);
}

function optionValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

async function loadAddresses() {
  const requestedPath = optionValue("--addresses");
  const addressPath = requestedPath ? resolve(invocationCwd, requestedPath) : defaultAddressesPath;
  const parsed = JSON.parse(await readFile(addressPath, "utf8"));
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`Address file must contain a non-empty array: ${addressPath}`);
  }

  return parsed.map((item, index) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(item.address ?? "")) {
      throw new Error(`Invalid EVM-style Hyperliquid address at index ${index}: ${item.address ?? ""}`);
    }
    return {
      address: item.address.toLowerCase(),
      source: item.source ?? "unspecified",
      initialStatus: item.initialStatus ?? "watch/sample-only",
    };
  });
}

async function hyperliquidInfo(payload) {
  const response = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, ok: response.ok, body };
}

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function summarizeFills(fills) {
  const rows = Array.isArray(fills) ? fills : [];
  const times = rows.map((fill) => asNumber(fill.time)).filter((time) => time !== null);
  const closeRows = rows.filter((fill) => String(fill.dir ?? "").startsWith("Close"));
  const closedPnls = closeRows.map((fill) => asNumber(fill.closedPnl)).filter((pnl) => pnl !== null);
  const coinCounts = new Map();
  let largestAbsClosedPnl = null;

  for (const fill of rows) {
    if (fill.coin) {
      coinCounts.set(fill.coin, (coinCounts.get(fill.coin) ?? 0) + 1);
    }
  }

  for (const pnl of closedPnls) {
    if (largestAbsClosedPnl === null || Math.abs(pnl) > Math.abs(largestAbsClosedPnl)) {
      largestAbsClosedPnl = pnl;
    }
  }

  const sortedCoins = [...coinCounts.entries()].sort((a, b) => b[1] - a[1]);
  const closedPnlSum = closedPnls.reduce((sum, pnl) => sum + pnl, 0);
  const dominantCoinShare = rows.length > 0 && sortedCoins.length > 0 ? sortedCoins[0][1] / rows.length : null;

  return {
    fillsReturned: rows.length,
    responseIsCapped: rows.length >= 2000,
    earliestFillTime: times.length > 0 ? new Date(Math.min(...times)).toISOString() : null,
    latestFillTime: times.length > 0 ? new Date(Math.max(...times)).toISOString() : null,
    closeFillCount: closeRows.length,
    positiveCloseFillCount: closedPnls.filter((pnl) => pnl > 0).length,
    negativeCloseFillCount: closedPnls.filter((pnl) => pnl < 0).length,
    closedPnlSum: Number(closedPnlSum.toFixed(6)),
    largestAbsClosedPnl,
    topCoins: sortedCoins.slice(0, 5).map(([coin, count]) => ({ coin, count })),
    dominantCoinShare: dominantCoinShare === null ? null : Number(dominantCoinShare.toFixed(4)),
  };
}

function summarizeClearinghouse(state) {
  const positions = Array.isArray(state?.assetPositions) ? state.assetPositions : [];
  const openPositions = positions
    .map((item) => item.position)
    .filter((position) => Math.abs(asNumber(position?.szi) ?? 0) > 0);

  return {
    accountValue: asNumber(state?.marginSummary?.accountValue),
    totalNtlPos: asNumber(state?.marginSummary?.totalNtlPos),
    withdrawable: asNumber(state?.withdrawable),
    openPositionCount: openPositions.length,
    openPositions: openPositions.map((position) => ({
      coin: position.coin,
      szi: asNumber(position.szi),
      entryPx: asNumber(position.entryPx),
      positionValue: asNumber(position.positionValue),
      unrealizedPnl: asNumber(position.unrealizedPnl),
      liquidationPx: asNumber(position.liquidationPx),
    })),
  };
}

function classify({ fills, clearinghouse, initialStatus }) {
  const reasons = [];
  let status = initialStatus;

  if (clearinghouse.openPositionCount === 0) {
    reasons.push("currently flat in clearinghouseState");
  } else {
    reasons.push("currently has open positions; live-copy temptation and hidden-hedge risk");
  }
  if ((clearinghouse.accountValue ?? 0) < 1 && clearinghouse.openPositionCount === 0) {
    reasons.push("stale or emptied account risk");
  }
  if (fills.responseIsCapped) {
    reasons.push("userFills response is capped; full history not proven");
  }
  if ((fills.dominantCoinShare ?? 0) >= 0.8) {
    reasons.push("returned fills are concentrated in one coin");
  }
  if (fills.closedPnlSum < 0) {
    status = status.includes("radar") ? status : "rejected-as-copy/watch-as-evidence";
    reasons.push("returned close-fill PnL sum is negative");
  }
  if (!status.includes("rejected") && !status.includes("radar")) {
    status = "watch/sample-only";
  }

  return { status, reasons };
}

function renderMarkdown(result) {
  const lines = [
    "# Hyperliquid Address Intake Report",
    "",
    `Generated: ${result.generatedAt}`,
    "",
    "Mode: research-only, public/no-key Hyperliquid `info` probes.",
    "",
    "## Verdict",
    "",
    result.verdict,
    "",
    "## Rows",
    "",
    "| Address | Status | Open positions | Account value | Fills | Window | Top coins | Closed PnL sum | Reasons |",
    "| --- | --- | ---: | ---: | ---: | --- | --- | ---: | --- |",
  ];

  for (const row of result.rows) {
    const topCoins = row.fills.topCoins.map((item) => `${item.coin}:${item.count}`).join(", ");
    const window = `${row.fills.earliestFillTime ?? "n/a"} to ${row.fills.latestFillTime ?? "n/a"}`;
    lines.push(
      `| \`${row.address}\` | ${row.classification.status} | ${row.clearinghouse.openPositionCount} | ${row.clearinghouse.accountValue ?? "n/a"} | ${row.fills.fillsReturned}${row.fills.responseIsCapped ? " capped" : ""} | ${window} | ${topCoins} | ${row.fills.closedPnlSum} | ${row.classification.reasons.join("; ")} |`,
    );
  }

  lines.push(
    "",
    "## Guardrails",
    "",
    "- No row is a strategy.",
    "- Do not promote from capped recent fills or public-profile visibility.",
    "- Require a frozen cohort and forward paper validation before any strategy claim.",
    "- No live copying, trading, keys, paid APIs, cron/cadence, watcher wording, risk/sizing, TP/SL, execution, or orders changed.",
    "",
  );

  return lines.join("\n");
}

const addresses = await loadAddresses();
const outputPrefix = optionValue("--output-prefix") || "hyperliquid-address-intake";
const rows = [];
for (const item of addresses) {
  const clearinghouseResponse = await hyperliquidInfo({ type: "clearinghouseState", user: item.address });
  const fillsResponse = await hyperliquidInfo({ type: "userFills", user: item.address });

  if (!clearinghouseResponse.ok || !fillsResponse.ok) {
    rows.push({
      ...item,
      errors: {
        clearinghouseStatus: clearinghouseResponse.status,
        fillsStatus: fillsResponse.status,
      },
    });
    continue;
  }

  const clearinghouse = summarizeClearinghouse(clearinghouseResponse.body);
  const fills = summarizeFills(fillsResponse.body);
  rows.push({
    ...item,
    clearinghouse,
    fills,
    classification: classify({ fills, clearinghouse, initialStatus: item.initialStatus }),
  });
}

const result = {
  generatedAt: new Date().toISOString(),
  source: "Hyperliquid public info endpoint",
  addressCount: addresses.length,
  rows,
};
result.verdict = buildVerdict(result.rows);

await mkdir(resultsDir, { recursive: true });
await writeFile(join(resultsDir, `${outputPrefix}.json`), `${JSON.stringify(result, null, 2)}\n`);
await writeFile(join(resultsDir, `${outputPrefix}.md`), renderMarkdown(result));

console.log(JSON.stringify({
  generatedAt: result.generatedAt,
  rows: result.rows.length,
  statuses: result.rows.map((row) => ({ address: row.address, status: row.classification?.status ?? "error" })),
  output: `results/${outputPrefix}.md`,
}, null, 2));

function buildVerdict(rows) {
  const statuses = new Set(rows.map((row) => row.classification?.status).filter(Boolean));
  const open = rows.filter((row) => (row.clearinghouse?.openPositionCount ?? 0) > 0).length;
  const capped = rows.filter((row) => row.fills?.responseIsCapped).length;
  const rejected = rows.filter((row) => String(row.classification?.status || "").includes("rejected")).length;
  const empty = rows.filter((row) => (row.fills?.fillsReturned ?? 0) === 0).length;
  const parts = [
    "The repeatable intake works for known addresses, but this sample produces no copy candidate."
  ];
  if (open > 0) parts.push(`${open}/${rows.length} sampled accounts currently have open positions, which increases live-copy temptation and hidden-hedge risk.`);
  if (capped > 0) parts.push(`${capped}/${rows.length} fill responses are capped, so full history is not proven.`);
  if (empty > 0) parts.push(`${empty}/${rows.length} returned no fills from the latest public userFills response.`);
  if (rejected > 0) parts.push(`${rejected}/${rows.length} are rejected as copy candidates from returned evidence.`);
  if (statuses.size > 0) parts.push("Remaining non-rejected rows stay watch/sample-only until a frozen cohort and forward paper test exist.");
  return parts.join(" ");
}
