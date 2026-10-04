#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SUMMARY_JSON = path.join(ROOT, "results", "e2e-latency-summary.json");
const SUMMARY_MD = path.join(ROOT, "results", "e2e-latency-summary.md");
const SAMPLES_JSONL = path.join(ROOT, "results", "e2e-latency-samples.jsonl");

const summary = JSON.parse(await fs.readFile(SUMMARY_JSON, "utf8"));
const markdown = await fs.readFile(SUMMARY_MD, "utf8");
const sampleLines = (await fs.readFile(SAMPLES_JSONL, "utf8")).trim().split("\n").filter(Boolean);
const samples = sampleLines.map((line) => JSON.parse(line));

assert(summary.status === "research-only-no-live-execution", "summary status must remain research-only");
assert(summary.decision?.noLiveChange === true, "decision must preserve no-live-change boundary");
assert(summary.config?.chain === "avalanche", "unexpected chain");
assert(summary.config?.pair === "WAVAX/USDC", "unexpected pair");
assert(summary.config?.costModelVersion === "v0_proxy", "unexpected cost model");
assert(summary.totals.samples === samples.length, "sample total mismatch");
assert(summary.totals.providers >= 1, "missing provider coverage");
assert(summary.totals.routes >= 1, "missing route coverage");
assert(samples.every((sample) => sample.status === "research-only-no-live-execution"), "sample status drift");
assert(samples.every((sample) => sample.btc_gate && sample.eth_major_state), "missing BTC/factor context");
assert(samples.every((sample) => sample.factor_class === "none"), "baseline factor class should be none");
assert(samples.every((sample) => sample.cost_model_version === "v0_proxy"), "sample cost model mismatch");
assert(samples.every((sample) => sample.token_in === "USDC" && sample.token_out === "USDC"), "unexpected route token boundary");
assert(samples.every((sample) => Array.isArray(sample.data_quality_flags)), "missing data quality flags");
assert(samples.every((sample) => sample.flashloan_fee_usd === 0), "baseline must not model active flashloan use");
assert(markdown.startsWith("# E2E Latency Baseline"), "markdown title mismatch");
assert(markdown.includes("No live trading"), "markdown missing no-live-trading boundary");
assert(markdown.includes("BTC gate:"), "markdown missing BTC gate");
assert(markdown.includes("Post-cost positives:"), "markdown missing post-cost total");

console.log(JSON.stringify({
  ok: true,
  samples: samples.length,
  verdict: summary.decision.verdict,
  postCostPositive: summary.totals.postCostPositive,
  latencySurvived: summary.totals.latencySurvived
}, null, 2));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
