import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PERIODS, windowFor, selectWindow, freezeSeries, cachedSeries, sha256, appendRegistry, registryRows, distinctVariants, guardHoldout, identityFor } from '../src/h2-contract.mjs';
import { backtestVariant, summarizeVariantRuns } from '../src/engine.mjs';
import { fetchConfiguredCandles } from '../src/market-data.mjs';
const start = Date.parse(PERIODS.research[0]) / 1000;
const end = Date.parse(PERIODS.research[1]) / 1000;
const candle = time => ({ time, open: 100, high: 102, low: 99, close: 101, volume: 10 });
function config() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'h2-contract-test-'));
  return { period: 'research', dataStart: PERIODS.research[0], dataEnd: PERIODS.research[1],
    entryMode: 'next_open', risk: { stopAtr: 1.2, targetR: 1.8 }, costs: { feeBpsPerSide: 4, slippageBpsPerSide: 3 },
    evaluation: { split: { method: 'purged_embargo_entry_time', inSampleRatio: 0.7 } },
    h2Paths: { cache: path.join(dir, 'cache'), manifest: path.join(dir, 'manifest.json'), registry: path.join(dir, 'registry.jsonl') } };
}
const variant = { candidateId: 'fixture', variantId: 'fixture:base', family: 'fixture-family', rule: 'breakout', directions: ['long'], params: { lookback: 2, volumeZ: -10, rsiMinLong: 0 } };
const tf = { id: '4h', maxBars: 4 };

test('H2 half-open research and holdout boundaries', () => {
  const rows = [start - 1, start, end - 1, end, Date.parse(PERIODS.holdout[1]) / 1000].map(candle);
  assert.deepEqual(selectWindow(rows, config()).map(c => c.time), [start, end - 1]);
  assert.deepEqual(selectWindow(rows, { period: 'holdout' }).map(c => c.time), [end]);
});
test('H2 rejects cross-period, invalid, non-UTC and reversed windows', () => {
  for (const c of [{ dataEnd: PERIODS.holdout[1] }, { dataStart: '2021-10-18' }, { dataStart: 'bad' }, { dataStart: PERIODS.research[1] }, { period: 'other' }]) assert.throws(() => windowFor(c));
});
test('H2 frozen snapshots match manifest hash and refuse changed bytes', () => {
  const c = config();
  const a = freezeSeries([candle(start - 1), candle(start), candle(end)], 'SOL', '4h', c);
  assert.equal(a.entry.count, 1);
  const bytes = fs.readFileSync(path.join(c.h2Paths.cache, `${a.entry.sha256}.json`));
  assert.equal(sha256(bytes), a.entry.sha256);
  assert.equal(a.manifestSha256, sha256(fs.readFileSync(c.h2Paths.manifest)));
  assert.deepEqual(cachedSeries('SOL', '4h', c).candles, [candle(start)]);
  assert.throws(() => freezeSeries([{ ...candle(start), volume: 11 }], 'SOL', '4h', c), /different bytes/);
});
test('H2 registry append preserves the exact existing byte prefix', () => {
  const file = config().h2Paths.registry;
  appendRegistry(file, { candidateId: 'a', variantId: 'a:1', candidateFamily: 'family' });
  const before = fs.readFileSync(file);
  appendRegistry(file, { candidateId: 'a', variantId: 'a:2', candidateFamily: 'family' });
  appendRegistry(file, { candidateId: 'a', variantId: 'a:1', candidateFamily: 'family' });
  assert.deepEqual(fs.readFileSync(file).subarray(0, before.length), before);
  assert.equal(registryRows(file).length, 3);
  assert.deepEqual(distinctVariants(registryRows(file)), { family: 2 });
});
test('H2 holdout refuses all missing prerequisites before reading candles or signals', () => {
  const c = { ...config(), period: 'holdout', dataStart: PERIODS.holdout[0], dataEnd: PERIODS.holdout[1] };
  const identity = identityFor(variant, 'SOL', tf, c);
  appendRegistry(c.h2Paths.registry, { identity, period: { name: 'research' } });
  const poison = new Proxy([], { get() { throw new Error('candles read before guard'); } });
  assert.throws(() => backtestVariant(variant, poison, 'SOL', tf, c), /requires explicit --final/);
  assert.equal(registryRows(c.h2Paths.registry).length, 1);
});
test('H2 CLI --final alone fails nonzero; exact research identity passes guard only', () => {
  const c = { ...config(), period: 'holdout', dataStart: PERIODS.holdout[0], dataEnd: PERIODS.holdout[1] };
  const identity = identityFor(variant, 'SOL', tf, c);
  const moduleUrl = new URL('../src/h2-contract.mjs', import.meta.url).href;
  const script = `import { guardHoldout } from ${JSON.stringify(moduleUrl)}; guardHoldout(${JSON.stringify(c)}, ${JSON.stringify(identity)});`;
  const run = () => spawnSync(process.execPath, ['--input-type=module', '-e', script, '--', '--final'], { encoding: 'utf8' });
  assert.notEqual(run().status, 0);
  appendRegistry(c.h2Paths.registry, { identity: { ...identity, variantId: 'other' }, period: { name: 'research' } });
  assert.notEqual(run().status, 0);
  appendRegistry(c.h2Paths.registry, { identity, period: { name: 'research' } });
  assert.equal(run().status, 0); // Authorization only: no holdout data or metrics.
});
test('H2 altered parameters are not an exact registered identity', () => {
  const c = { ...config(), period: 'holdout', dataStart: PERIODS.holdout[0], dataEnd: PERIODS.holdout[1] };
  const identity = identityFor(variant, 'SOL', tf, c);
  appendRegistry(c.h2Paths.registry, { identity, period: { name: 'research' } });
  process.argv.push('--final');
  try { assert.throws(() => guardHoldout(c, { ...identity, params: { lookback: 999 } }), /exact variant/); }
  finally { process.argv.pop(); }
});
test('H2 research split, trade exits and walk-forward never touch holdout', () => {
  const c = config();
  const rows = Array.from({ length: 100 }, (_, i) => ({ time: end - (100 - i) * 14400, open: 100 + i, high: 102 + i, low: 99 + i, close: 102 + i, volume: 100 + i }));
  rows.push(new Proxy({ time: end }, { get(target, key) { if (key !== 'time') throw new Error('holdout price read'); return target.time; } }));
  const run = backtestVariant(variant, rows, 'SOL', tf, c);
  assert.ok(run.trades.length > 0);
  assert.ok(run.split.cutoffTime < end);
  for (const t of [...run.trades, ...run.baselineTrades, ...run.purgedBoundaryTrades]) assert.ok(t.entryTime < end && t.exitTime < end);
  const summary = summarizeVariantRuns([run], 1, {});
  for (const fold of summary.walkForward.folds) assert.ok(fold.lastEntryTime < end);
  const entries = registryRows(c.h2Paths.registry);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].metrics.trades, run.trades.length);
  assert.equal(entries[0].manifestSha256, sha256(fs.readFileSync(c.h2Paths.manifest)));
});
test('H2 fixed loader uses offline snapshots and reuses frozen bytes', async () => {
  const c = config(), input = path.join(path.dirname(c.h2Paths.registry), 'input.json');
  fs.writeFileSync(input, JSON.stringify({ candles: [candle(start - 1), candle(start), candle(end)] }));
  c.offline = true; c.snapshotInputs = { 'SOL:4h': input };
  const first = await fetchConfiguredCandles({ symbol: 'SOL' }, tf, c);
  assert.deepEqual(first.candles, [candle(start)]);
  const second = await fetchConfiguredCandles({ symbol: 'SOL' }, tf, { ...c, snapshotInputs: {} });
  assert.deepEqual(second.candles, first.candles);
});
