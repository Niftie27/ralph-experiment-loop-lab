import fs from "node:fs/promises";
import path from "node:path";
import { validateFeatureTable } from "./feature-table-spec.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CONFIG_PATH = path.join(ROOT, "config.default.json");
const SNAPSHOT_PATH = path.join(ROOT, "results", "edge-snapshot.json");
const SUMMARY_PATH = path.join(ROOT, "results", "edge-summary.md");
const PAPER_DASHBOARD_JSON_PATH = path.join(ROOT, "results", "paper-dashboard.json");
const PAPER_DASHBOARD_MD_PATH = path.join(ROOT, "results", "paper-dashboard.md");
const FEATURE_TABLE_PATH = path.join(ROOT, "results", "agent-swarm-feature-table.json");

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
const snapshot = JSON.parse(await fs.readFile(SNAPSHOT_PATH, "utf8"));
const summary = await fs.readFile(SUMMARY_PATH, "utf8");
const paperDashboard = JSON.parse(await fs.readFile(PAPER_DASHBOARD_JSON_PATH, "utf8"));
const paperDashboardMd = await fs.readFile(PAPER_DASHBOARD_MD_PATH, "utf8");
const featureTable = JSON.parse(await fs.readFile(FEATURE_TABLE_PATH, "utf8"));

assert(snapshot.status === "paper-only-no-live-execution", "snapshot must stay paper-only");
assert(snapshot.assumptions?.sameCandleCollision === "stop-first", "same-candle collision assumption must be explicit");
assert(Array.isArray(snapshot.sources), "sources must be an array");
assert(Array.isArray(snapshot.setupStats), "setupStats must be an array");
assert(Array.isArray(snapshot.latestCandidates), "latestCandidates must be an array");

const expectedSymbols = new Set(config.symbols.map((symbol) => symbol.symbol));
const sourceSymbols = new Set(
  snapshot.sources
    .map((source) => config.symbols.find((symbol) => symbol.productId === source.productId)?.symbol)
    .filter(Boolean)
);
for (const symbol of expectedSymbols) {
  assert(sourceSymbols.has(symbol), `missing source data for ${symbol}`);
}

for (const source of snapshot.sources) {
  assert(source.candles >= 90, `${source.productId} ${source.timeframe} has too few candles: ${source.candles}`);
  assert(source.source, `${source.productId} ${source.timeframe} missing source label`);
}

for (const stat of snapshot.setupStats) {
  assert(expectedSymbols.has(stat.symbol), `unexpected setupStats symbol ${stat.symbol}`);
  assert(["up", "down", "range"].includes(stat.trend), `${stat.symbol} ${stat.setup} invalid trend ${stat.trend}`);
  assert(["high-vol", "mid-vol", "low-vol"].includes(stat.volatility), `${stat.symbol} ${stat.setup} invalid volatility ${stat.volatility}`);
  assert(stat.regime === `${stat.trend}/${stat.volatility}`, `${stat.symbol} ${stat.setup} regime must match trend/volatility`);
  assert(Number.isFinite(stat.stats?.sample), `${stat.symbol} ${stat.setup} missing sample`);
  assert(Number.isFinite(stat.stats?.expectancyR), `${stat.symbol} ${stat.setup} missing expectancyR`);
  assert(["A", "B", "C", "avoid", "low-sample"].includes(stat.tier), `${stat.symbol} ${stat.setup} invalid tier ${stat.tier}`);
  if (stat.tier !== "low-sample") {
    assert(stat.stats.sample >= config.sampleThresholds.low, `${stat.symbol} ${stat.setup} promoted with low sample`);
  }
}

for (const candidate of snapshot.latestCandidates) {
  assert(expectedSymbols.has(candidate.symbol), `unexpected candidate symbol ${candidate.symbol}`);
  assert(["up", "down", "range"].includes(candidate.trend), `${candidate.symbol} ${candidate.setup} invalid candidate trend ${candidate.trend}`);
  assert(["high-vol", "mid-vol", "low-vol"].includes(candidate.volatility), `${candidate.symbol} ${candidate.setup} invalid candidate volatility ${candidate.volatility}`);
  assert(candidate.regime === `${candidate.trend}/${candidate.volatility}`, `${candidate.symbol} ${candidate.setup} candidate regime must match trend/volatility`);
  assert(candidate.stats || candidate.tier === "low-sample", `${candidate.symbol} ${candidate.setup} missing stats`);
  assert(candidate.baseline, `${candidate.symbol} ${candidate.setup} missing baseline`);
}

assert(summary.startsWith("# Liquid Crypto Alert Edge Snapshot"), "summary title is not generalized");
assert(summary.includes("Status: paper-only, no live execution."), "summary missing paper-only status");
assert(summary.includes("## Top Historical Buckets"), "summary missing top buckets");
assert(summary.includes("Low-sample buckets are ranked below A/B/C candidates"), "summary missing low-sample warning");
assert(summary.includes("## Latest Detected Setups"), "summary missing latest setups");

assert(paperDashboard.status === "paper-only-no-live-execution", "paper dashboard must stay paper-only");
assert(paperDashboard.overall?.key === "all", "paper dashboard missing overall group");
assert(paperDashboard.qualified?.key === "A/B/C", "paper dashboard missing qualified group");
assert(paperDashboard.learning?.key === "low-sample/avoid", "paper dashboard missing learning group");
assert(Array.isArray(paperDashboard.byTier), "paper dashboard byTier must be an array");
assert(Array.isArray(paperDashboard.byTierSetup), "paper dashboard byTierSetup must be an array");
assert(Array.isArray(paperDashboard.byTierSetupRegime), "paper dashboard byTierSetupRegime must be an array");
assert(Array.isArray(paperDashboard.bySymbolTimeframeSetupRegime), "paper dashboard bySymbolTimeframeSetupRegime must be an array");
assert(Array.isArray(paperDashboard.openSignals), "paper dashboard openSignals must be an array");
const paperSignals = JSON.parse(await fs.readFile(path.join(ROOT, "paper", "signals.json"), "utf8"));
for (const signal of paperSignals.signals ?? []) {
  assert(["up", "down", "range"].includes(signal.trend), `paper signal ${signal.id} invalid trend ${signal.trend}`);
  assert(["high-vol", "mid-vol", "low-vol"].includes(signal.volatility), `paper signal ${signal.id} invalid volatility ${signal.volatility}`);
  assert(signal.regime === `${signal.trend}/${signal.volatility}`, `paper signal ${signal.id} regime must match trend/volatility`);
}
assert(paperDashboardMd.startsWith("# Forward Paper Dashboard"), "paper dashboard markdown title missing");
assert(paperDashboardMd.includes("Status: paper-only, no live execution."), "paper dashboard markdown missing paper-only status");
assert(paperDashboardMd.includes("## By Tier"), "paper dashboard markdown missing tier section");
assert(paperDashboardMd.includes("## By Tier, Setup, And Regime"), "paper dashboard markdown missing tier/setup/regime section");

const featureValidation = validateFeatureTable(featureTable);
assert(featureValidation.ok, `feature table validation failed: ${featureValidation.errors.join("; ")}`);
assert(featureTable.cleanRows < featureTable.rowCount, "feature table should preserve tainted rows for quality-aware scoring");
assert(featureTable.qualityFlagCounts?.book_not_fresh >= 0, "feature table must expose book freshness quality counts");

console.log(JSON.stringify({
  ok: true,
  symbols: [...expectedSymbols],
  sources: snapshot.sources.length,
  setupStats: snapshot.setupStats.length,
  latestCandidates: snapshot.latestCandidates.length,
  paperOpen: snapshot.paper?.open ?? null,
  paperClosedThisRun: snapshot.paper?.closed ?? null,
  featureRows: featureTable.rowCount,
  featureCleanRows: featureTable.cleanRows,
  paperDashboardOverall: paperDashboard.overall,
  paperDashboardQualified: paperDashboard.qualified
}, null, 2));
