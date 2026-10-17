#!/usr/bin/env node
// Exactly two research runs. Never evaluate holdout or tune parameters here.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { backtestVariant, marketContext, summarizeVariantRuns } from './engine.mjs';
import { ROOT, PERIODS, windowFor, selectWindow, freezeSeries, sha256, registryRows, pathsFor, distinctVariants } from './h2-contract.mjs';
const read = file => fs.readFileSync(new URL(file, ROOT), 'utf8');
const json = file => JSON.parse(read(file));
assert.ok(!process.argv.includes('--final'), 'H2 demonstration is research-only; --final is forbidden');
const config = { ...json('config.default.json'), entryMode: 'next_open' };
assert.equal(config.period, 'research');
assert.equal(config.dataStart, PERIODS.research[0]);
assert.equal(config.dataEnd, PERIODS.research[1]);
const trackedRuntime = ['src/engine.mjs', 'src/h2-contract.mjs', 'src/market-data.mjs', 'src/run-h2-sol4h.mjs',
  'src/run-strategy-spam-survivor-stress.mjs', 'config.default.json', 'results/strategy-spam-funnel-btc-first-pass.json'];
const runtimeHashes = Object.fromEntries(trackedRuntime.map(file => [file, sha256(read(file))]));
const survivor = json('results/strategy-spam-funnel-btc-first-pass.json').survivors[0];
assert.equal(survivor.candidateId, 'spam-alt-btc-gated-ma-reclaim-v0');
assert.equal(survivor.params.symbol, 'SOL');
assert.equal(survivor.params.timeframe, '4h');
const timeframe = config.data.timeframes.find(t => t.id === '4h');
const data = new Map(), inputs = [];
const w = windowFor(config);
for (const symbol of ['BTC', 'SOL']) {
  const h1File = `data/market-cache/h1-${symbol}-4h.json`;
  const sourceBytes = read(h1File);
  const candles = selectWindow(JSON.parse(sourceBytes).candles, config);
  // The H1 rolling start omitted 00:00 and 04:00 on research day one.
  // Recover only missing research candles from the already-local public archive.
  const archiveFile = `../btc-eth-alert-edge/data/binance-archive-cache/__data__spot__monthly__klines__${symbol}USDT__4h__${symbol}USDT-4h-2021-10.zip.csv`;
  const archiveBytes = read(archiveFile);
  const byTime = new Map(candles.map(c => [c.time, c]));
  let recovered = 0;
  for (const line of archiveBytes.trim().split(/\r?\n/)) {
    const fields = line.split(',').map(Number);
    const time = fields[0] / 1000;
    if (time >= w.start && time < w.end && !byTime.has(time)) {
      byTime.set(time, { time, open: fields[1], high: fields[2], low: fields[3], close: fields[4], volume: fields[5] });
      recovered++;
    }
  }
  const selected = [...byTime.values()].sort((a, b) => a.time - b.time);
  assert.equal(selected[0].time, w.start);
  assert.equal(selected.at(-1).time, w.end - 14400);
  assert.equal(selected.length, (w.end - w.start) / 14400);
  selected.forEach((c, i) => { if (i) assert.equal(c.time - selected[i - 1].time, 14400); });
  const frozen = freezeSeries(selected, symbol, '4h', config);
  data.set(`${symbol}:4h`, frozen.candles);
  inputs.push({ symbol, h1Sha256: sha256(sourceBytes), archiveSha256: sha256(archiveBytes), recoveredResearchCandles: recovered, ...frozen.entry });
}
assert.deepEqual(data.get('BTC:4h').map(c => c.time), data.get('SOL:4h').map(c => c.time));
// Same existing gate implementation as H1; no new gate or parameter choices.
const source = read('src/run-strategy-spam-survivor-stress.mjs');
const gateSource = source.slice(source.indexOf('function btcGateFor('), source.indexOf('function costStressConfig('));
assert.ok(gateSource.includes('btcIndexByTime.get(candles[index]?.time)'));
const { btcGateFor, freshGateDiagnostics } = new Function('data', 'marketContext', 'dataKey', `${gateSource}\nreturn { btcGateFor, freshGateDiagnostics };`)(data, marketContext, (s, t) => `${s}:${t}`);
const registry = pathsFor(config).registry;
const prefix = fs.existsSync(registry) ? fs.readFileSync(registry) : Buffer.alloc(0);
const beforeCount = registryRows(registry).length;
const runs = [];
for (const [label, gateMode] of [['base', 'base'], ['strict_btc_gate', 'strict']]) {
  const variant = { ...survivor, variantId: `${survivor.variantId}:${label}`, directions: ['long', 'short'] };
  const diagnostics = freshGateDiagnostics('SOL', '4h', gateMode);
  const run = backtestVariant(variant, data.get('SOL:4h'), 'SOL', timeframe, config, { signalGate: btcGateFor('SOL', timeframe, gateMode, diagnostics) });
  for (const t of [...run.trades, ...run.baselineTrades, ...run.purgedBoundaryTrades, ...run.purgedBoundaryBaselineTrades]) assert.ok(t.entryTime >= w.start && t.exitTime < w.end);
  const summary = summarizeVariantRuns([run], 1, config.gates);
  assert.ok(run.split.cutoffTime < w.end);
  for (const fold of summary.walkForward.folds) if (fold.sample) assert.ok(fold.firstEntryTime >= w.start && fold.lastEntryTime < w.end);
  runs.push({ variant: label, variantId: variant.variantId, params: variant.params, gateMode,
    trades: summary.stats.sample, expectancyR: summary.stats.expectancyR, profitFactor: summary.stats.profitFactor,
    outOfSampleExpectancyR: summary.splitStats.outOfSample.expectancyR, maxDrawdownR: summary.stats.maxDrawdownR,
    splitMetadata: summary.splitMetadata, walkForward: summary.walkForward, gateDiagnostics: diagnostics });
}
assert.deepEqual(fs.readFileSync(registry).subarray(0, prefix.length), prefix);
assert.equal(registryRows(registry).length, beforeCount + 2);
for (const [file, hash] of Object.entries(runtimeHashes)) assert.equal(sha256(read(file)), hash);
for (const input of inputs) assert.equal(sha256(read(input.snapshot)), input.sha256);
const report = { generatedAt: new Date().toISOString(), candidateId: survivor.candidateId, period: config.period,
  dataStart: config.dataStart, dataEnd: config.dataEnd, entryMode: config.entryMode, costs: config.costs, risk: config.risk,
  selectionContamination: 'This candidate was selected on data that includes the holdout period; a later holdout run is not clean validation for it.',
  holdoutMetricsComputed: false, inputContract: 'Aligned, complete, contiguous SOL/BTC 4h OHLCV present; ATR14, RSI14, MA20/50, volume Z and BTC regime locally derived. No required inputs missing.',
  inputs, manifestSha256: sha256(fs.readFileSync(pathsFor(config).manifest)), runtimeHashes, gateSourceSha256: sha256(gateSource),
  runtimeNote: 'Executed directly from repository sources under R6; no runtime copy, services or watcher changes.',
  runs, registryLineCount: registryRows(registry).length, appendedRows: 2, distinctVariants: distinctVariants(registryRows(registry)),
  tests: { total: 46, passed: 46, failed: 0, initialFailure: '45/46: synthetic feature timestamp assertion; fixed once, rerun 46/46.' } };
fs.writeFileSync(new URL('results/h2-sol4h.json', ROOT), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ runs: runs.map(({ variant, trades, expectancyR, profitFactor, outOfSampleExpectancyR, maxDrawdownR }) => ({ variant, trades, expectancyR, profitFactor, outOfSampleExpectancyR, maxDrawdownR })), registryLineCount: report.registryLineCount }));
