import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const resultsDir = join(root, "results");

const defaultAddress = "0x7fdafde5cfb5465924316eced2d3715494c517d1";
const delayMs = [15_000, 60_000, 180_000, 300_000];

if (process.argv.includes("--help")) {
  console.log("Usage: npm run ledger:hyperliquid-delay-sample --prefix ralph-research-os/experiments/copytrading-address-intake -- [--address 0x...] [--lookback-minutes 60] [--settle-minutes 6] [--max-rows 24] [--cost-bps 8] [--output-prefix name]");
  console.log("Creates a tiny public/no-key frozen Hyperliquid fill-to-candle delay ledger for research only.");
  process.exit(0);
}

function optionValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
  return value;
}

function numericOption(flag, fallback) {
  const value = optionValue(flag);
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${flag} must be a positive number`);
  return parsed;
}

function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function directionSign(dir) {
  const label = String(dir || "").toLowerCase();
  if (label.includes("long")) return 1;
  if (label.includes("short")) return -1;
  return null;
}

function candleCloseAtOrAfter(candles, timestamp) {
  const sorted = candles
    .map((candle) => ({ time: asNumber(candle.t ?? candle.T), close: asNumber(candle.c) }))
    .filter((candle) => candle.time !== null && candle.close !== null)
    .sort((a, b) => a.time - b.time);
  return sorted.find((candle) => candle.time >= timestamp) ?? null;
}

async function delayJoin(fill, costBps) {
  const fillTime = asNumber(fill.time);
  const fillPrice = asNumber(fill.px);
  const sign = directionSign(fill.dir);
  if (fillTime === null || fillPrice === null || sign === null || !fill.coin) {
    return { skipped: true, reason: "missing fill time, price, direction, or coin" };
  }

  const startTime = fillTime - 60_000;
  const endTime = fillTime + Math.max(...delayMs) + 120_000;
  const response = await hyperliquidInfo({
    type: "candleSnapshot",
    req: { coin: fill.coin, interval: "1m", startTime, endTime },
  });

  if (!response.ok || !Array.isArray(response.body)) {
    return { skipped: true, reason: `candleSnapshot failed with HTTP ${response.status}` };
  }

  const delays = {};
  for (const delta of delayMs) {
    const candle = candleCloseAtOrAfter(response.body, fillTime + delta);
    const edgeBps = candle ? sign * ((candle.close - fillPrice) / fillPrice) * 10_000 : null;
    delays[`${delta / 1000}s`] = {
      proxyClose: candle?.close ?? null,
      proxyTime: candle ? new Date(candle.time).toISOString() : null,
      grossDirectionAdjustedBps: edgeBps === null ? null : Number(edgeBps.toFixed(2)),
      costStressedBps: edgeBps === null ? null : Number((edgeBps - costBps).toFixed(2)),
    };
  }

  return {
    skipped: false,
    candleRows: response.body.length,
    delays,
  };
}

function qualityFlags({ fill, ageMs, join }) {
  const flags = [];
  if (ageMs > 30 * 60_000) flags.push("stale-observation");
  if (String(fill.dir || "").startsWith("Close")) flags.push("exit-row-not-entry-signal");
  if (join.skipped) flags.push("missing-delay-prices");
  flags.push("single-known-address");
  flags.push("no-hidden-hedge-check");
  flags.push("no-selection-baseline");
  return flags;
}

function verdict(rows) {
  const usable = rows.filter((row) => !row.delayJoin.skipped);
  if (usable.length === 0) {
    return [
      `Captured ${rows.length} recent fill rows from one known public Hyperliquid address; 0 joined to public 1m candles.`,
      "There is no delay-edge verdict for this address/window.",
      "This is a mechanics/falsifier artifact only. It does not prove copyability, candidate quality, or strategy edge.",
    ].join(" ");
  }
  const positive60 = usable.filter((row) => (row.delayJoin.delays["60s"]?.grossDirectionAdjustedBps ?? -Infinity) > 0).length;
  const positive180 = usable.filter((row) => (row.delayJoin.delays["180s"]?.grossDirectionAdjustedBps ?? -Infinity) > 0).length;
  const netPositive60 = usable.filter((row) => (row.delayJoin.delays["60s"]?.costStressedBps ?? -Infinity) > 0).length;
  const netPositive180 = usable.filter((row) => (row.delayJoin.delays["180s"]?.costStressedBps ?? -Infinity) > 0).length;
  return [
    `Captured ${rows.length} recent fill rows from one known public Hyperliquid address; ${usable.length} joined to public 1m candles.`,
    `${positive60}/${usable.length} joined rows had positive gross 60s delay and ${positive180}/${usable.length} had positive gross 180s delay.`,
    `After the configured cost stress, ${netPositive60}/${usable.length} stayed positive at 60s and ${netPositive180}/${usable.length} stayed positive at 180s.`,
    "This is a mechanics/falsifier artifact only. It does not prove copyability, candidate quality, or strategy edge.",
  ].join(" ");
}

function renderMarkdown(result) {
  const lines = [
    "# Hyperliquid Wallet-Shadow Delay Sample",
    "",
    `Generated: ${result.generatedAt}`,
    "",
    "Mode: research-only, public/no-key, manual tiny sample.",
    "",
    "## Verdict",
    "",
    result.verdict,
    "",
    "## Capture",
    "",
    `- Address: \`${result.address}\``,
    `- Lookback minutes: ${result.lookbackMinutes}`,
    `- Settle minutes: ${result.settleMinutes}`,
    `- Cost stress: ${result.costBps} bps`,
    `- Window: ${result.windowStart} to ${result.windowEnd}`,
    `- Requested max rows: ${result.maxRows}`,
    `- Fills returned in window: ${result.fillsReturned}`,
    "",
    "## Rows",
    "",
    "| Time | Coin | Dir | Price | Size | Age sec | 60s gross | 60s net | 180s gross | 180s net | Flags |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ];

  for (const row of result.rows) {
    lines.push(
      `| ${row.walletEventTime} | ${row.coin} | ${row.dir} | ${row.fillPrice ?? "n/a"} | ${row.size ?? "n/a"} | ${row.ageSeconds} | ${row.delayJoin.delays?.["60s"]?.grossDirectionAdjustedBps ?? "n/a"} | ${row.delayJoin.delays?.["60s"]?.costStressedBps ?? "n/a"} | ${row.delayJoin.delays?.["180s"]?.grossDirectionAdjustedBps ?? "n/a"} | ${row.delayJoin.delays?.["180s"]?.costStressedBps ?? "n/a"} | ${row.qualityFlags.join(", ")} |`,
    );
  }

  lines.push(
    "",
    "## Decision",
    "",
    "This tiny frozen sample can inform U-008/U-017 mechanics, but it does not close either unknown. A real closeout still needs 20+ quality observations across independent frozen windows, fee/slippage modeling, selection baseline, exit observability, and hidden-hedge checks.",
    "",
    "Boundary delta: no scanner, scheduler, alert, account/key, paid source, demo/testnet, live trading, sizing, TP/SL, execution, public posting, or strategy promotion changed.",
    "",
  );
  return lines.join("\n");
}

const address = (optionValue("--address") || defaultAddress).toLowerCase();
if (!/^0x[a-f0-9]{40}$/.test(address)) throw new Error(`Invalid address: ${address}`);

const lookbackMinutes = numericOption("--lookback-minutes", 60);
const settleMinutes = numericOption("--settle-minutes", 6);
const maxRows = Math.floor(numericOption("--max-rows", 24));
const costBps = numericOption("--cost-bps", 8);
const outputPrefix = optionValue("--output-prefix") || "hyperliquid-wallet-shadow-delay-sample";
const capturedAtMs = Date.now();
const endTime = capturedAtMs - settleMinutes * 60_000;
const startTime = endTime - lookbackMinutes * 60_000;

const fillsResponse = await hyperliquidInfo({ type: "userFillsByTime", user: address, startTime, endTime });
if (!fillsResponse.ok || !Array.isArray(fillsResponse.body)) {
  throw new Error(`userFillsByTime failed with HTTP ${fillsResponse.status}: ${JSON.stringify(fillsResponse.body).slice(0, 240)}`);
}

const fills = fillsResponse.body
  .filter((fill) => asNumber(fill.time) !== null && asNumber(fill.px) !== null)
  .sort((a, b) => asNumber(b.time) - asNumber(a.time))
  .slice(0, maxRows);

const rows = [];
for (const fill of fills) {
  const fillTime = asNumber(fill.time);
  const fillPrice = asNumber(fill.px);
  const join = await delayJoin(fill, costBps);
  rows.push({
    address,
    capturedAt: new Date(capturedAtMs).toISOString(),
    sourceRoute: "Hyperliquid public info userFillsByTime + candleSnapshot",
    walletEventTime: new Date(fillTime).toISOString(),
    observationAgeMs: capturedAtMs - fillTime,
    ageSeconds: Number(((capturedAtMs - fillTime) / 1000).toFixed(1)),
    coin: fill.coin,
    dir: fill.dir,
    side: fill.side ?? null,
    size: asNumber(fill.sz),
    fillPrice,
    closedPnl: asNumber(fill.closedPnl),
    fee: asNumber(fill.fee),
    hash: fill.hash ?? null,
    oid: fill.oid ?? null,
    delayJoin: join,
    qualityFlags: qualityFlags({ fill, ageMs: capturedAtMs - fillTime, join }),
  });
}

const result = {
  generatedAt: new Date(capturedAtMs).toISOString(),
  address,
  lookbackMinutes,
  settleMinutes,
  maxRows,
  costBps,
  source: "Hyperliquid public info endpoint",
  windowStart: new Date(startTime).toISOString(),
  windowEnd: new Date(endTime).toISOString(),
  fillsReturned: fillsResponse.body.length,
  rows,
};
result.verdict = verdict(rows);

await mkdir(resultsDir, { recursive: true });
await writeFile(join(resultsDir, `${outputPrefix}.json`), `${JSON.stringify(result, null, 2)}\n`);
await writeFile(join(resultsDir, `${outputPrefix}.md`), renderMarkdown(result));

console.log(JSON.stringify({
  generatedAt: result.generatedAt,
  address: result.address,
  fillsReturned: result.fillsReturned,
  rows: result.rows.length,
  joinedRows: result.rows.filter((row) => !row.delayJoin.skipped).length,
  output: `results/${outputPrefix}.md`,
}, null, 2));
