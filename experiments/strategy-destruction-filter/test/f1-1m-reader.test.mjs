// F1a-2: the research 1m reader and the holdout seal (docs/f1/f1a-2-contract.md, A6, A7).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openResearch1m } from '../src/f1-1m-reader.mjs';
import { storeSource, buildStore, readManifest, snapshotPath } from '../src/f1-1m-store.mjs';
import { planUnits, visionSource } from '../src/vision-source.mjs';
import { encodeSnapshot } from '../src/f1-1m-format.mjs';
import { cachedSeries } from '../src/h2-contract.mjs';
import { makeZip, klineCsv, minutes, checksumText, sha256 } from '../test-support/vision-fixtures.mjs';

const BTC = { exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT' };
const ms = iso => Date.parse(iso);
function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-1m-reader-test-'));
  const s = { zipRoot: path.join(dir, 'vision'), cacheDir: path.join(dir, 'cache'), manifestPath: path.join(dir, 'manifest-f1-1m.json') };
  const rows = { '2024-01': minutes('2024-01-31T23:57:00.000Z', 3), '2024-02': minutes('2024-02-01T00:00:00.000Z', 3), '2025-10': minutes('2025-10-16T23:58:00.000Z', 4) };
  for (const [month, openTimes] of Object.entries(rows)) {
    const source = planUnits('BTC', { from: month, to: month })[0].sources[0];
    const zip = makeZip([{ name: source.csvName, data: klineCsv(openTimes) }]);
    storeSource(s.zipRoot, source, zip, checksumText(zip, source.zipName));
    // Round 5: every day of these sparse months is a fill day; the 404 marker (at the path recordMissing uses, written
    // without its fsyncs) makes each one "fill unavailable".
    for (let day = source.startMs; day < source.endMs; day += 86400000) {
      const daily = visionSource(BTC, 'daily', day), marker = path.join(s.zipRoot, path.dirname(daily.file), '404', daily.zipName);
      fs.mkdirSync(path.dirname(marker), { recursive: true });
      fs.writeFileSync(marker, '404 on the zip and its CHECKSUM\n');
    }
    assert.notEqual(buildStore({ ...s, symbols: ['BTC'], from: month, to: month }).status, 'failed');
  }
  return s;
}
const open = (s, options = {}) => openResearch1m({ manifestPath: s.manifestPath, cacheDir: s.cacheDir, ...options });
const KEY = ['exchange', 'market', 'contract', 'period', 'dataStart', 'dataEnd', 'schemaVersion', 'sha256'];
const sortEntries = entries => entries.sort((a, b) => { for (const k of KEY) if (a[k] !== b[k]) return a[k] < b[k] ? -1 : 1; return 0; });
// Writes a hand-made snapshot and its manifest entry, bypassing the builder (for poisoned stores).
function plant(s, meta, openTimes, entryOver = {}) {
  const n = openTimes.length, fill = v => Array(n).fill(v);
  const bytes = encodeSnapshot(meta, { open_time: openTimes, open: fill(98765.43), high: fill(98799.11), low: fill(98700.01), close: fill(98777.77), volume: fill(1),
    quote_volume: fill(98777.77), count: fill(1), taker_buy_volume: fill(0.5), taker_buy_quote_volume: fill(49388.88) });
  const sha = sha256(bytes);
  fs.mkdirSync(s.cacheDir, { recursive: true });
  fs.writeFileSync(snapshotPath(s.cacheDir, sha), bytes);
  // Coverage fields consistent with the entry's rowCount (the manifest checks them), so the reader's own checks are reached.
  const missing = (ms(meta.dataEnd) - ms(meta.dataStart)) / 60000 - (entryOver.rowCount ?? n);
  const entry = { ...meta.instrument, period: meta.period, dataStart: meta.dataStart, dataEnd: meta.dataEnd, schemaVersion: 1, sha256: sha, bytes: bytes.length,
    rowCount: n, firstOpenTime: new Date(openTimes[0]).toISOString(), lastOpenTime: new Date(openTimes.at(-1)).toISOString(), missingMinutes: missing,
    missingRanges: missing ? [{ start: meta.dataStart, end: new Date(ms(meta.dataStart) + missing * 60000).toISOString() }] : [], quarantinedRows: [], filledRanges: [],
    source: 'binance-vision-archive', sources: meta.sources, ...entryOver };
  const manifest = readManifest(s.manifestPath);
  const entries = sortEntries([...manifest.entries.filter(e => !(e.contract === entry.contract && e.dataStart === entry.dataStart && e.period === entry.period)), entry]);
  fs.writeFileSync(s.manifestPath, JSON.stringify({ entries, kind: manifest.kind, schemaVersion: 1 }, null, 2) + '\n');
  return entry;
}
const SRC = [{ file: 'data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2025-10.zip', sha256: 'b'.repeat(64) }];

test('F1a-2 reader: a multi-month research window composes one entry per unit and slices half-open by open_time', () => {
  const s = fixture();
  const out = open(s).read({ instrument: BTC, dataStart: '2024-01-31T23:58:00.000Z', dataEnd: '2024-02-01T00:02:00.000Z' });
  assert.deepEqual(Array.from(out.columns.open_time), minutes('2024-01-31T23:58:00.000Z', 4));
  assert.equal(out.rowCount, 4);
  assert.deepEqual(Object.keys(out.columns), ['open_time', 'open', 'high', 'low', 'close', 'volume', 'quote_volume', 'count', 'taker_buy_volume', 'taker_buy_quote_volume']);
  assert.ok(Object.values(out.columns).every(c => c instanceof Float64Array && c.length === 4));
  assert.equal(out.columns.close[0], 42331.9);
  assert.deepEqual(out.units.map(u => u.dataStart), ['2024-01-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z']);
  assert.ok(Object.isFrozen(out) && Object.isFrozen(out.columns) && Object.isFrozen(out.units) && Object.isFrozen(out.instrument));
  assert.deepEqual(out.instrument, BTC);
  const research = open(s).read({ instrument: BTC, dataStart: '2025-10-16T23:58:00.000Z', dataEnd: '2025-10-17T00:00:00.000Z' });
  assert.deepEqual(Array.from(research.columns.open_time), minutes('2025-10-16T23:58:00.000Z', 2));
});

test('F1a-2 reader: the holdout is refused always, also across the boundary, after 2026-10-17 and with --final', () => {
  const s = fixture();
  const reader = open(s);
  const refuse = request => assert.throws(() => reader.read(request), /holdout|sealed|research window/);
  refuse({ instrument: BTC, dataStart: '2025-10-17T00:00:00.000Z', dataEnd: '2025-10-18T00:00:00.000Z' });
  refuse({ instrument: BTC, dataStart: '2025-10-16T23:00:00.000Z', dataEnd: '2025-10-17T00:01:00.000Z' });
  refuse({ instrument: BTC, dataStart: '2026-10-17T00:00:00.000Z', dataEnd: '2026-10-18T00:00:00.000Z' });
  refuse({ instrument: BTC, dataStart: '2021-10-17T00:00:00.000Z', dataEnd: '2021-10-19T00:00:00.000Z' });
  process.argv.push('--final');
  try { refuse({ instrument: BTC, dataStart: '2025-10-17T00:00:00.000Z', dataEnd: '2025-10-18T00:00:00.000Z' }); } finally { process.argv.pop(); }
  assert.throws(() => reader.read({ instrument: BTC, period: 'holdout', dataStart: '2025-10-17T00:00:00.000Z', dataEnd: '2025-10-18T00:00:00.000Z' }), /request/);
});

test('F1a-2 reader: a unit labeled research that holds a holdout time is refused before slicing, without printing prices', () => {
  const s = fixture();
  const meta = { instrument: BTC, period: 'research', dataStart: '2025-10-01T00:00:00.000Z', dataEnd: '2025-10-17T00:00:00.000Z', sources: SRC };
  plant(s, meta, [ms('2025-10-16T23:59:00.000Z'), ms('2025-10-17T00:00:00.000Z')]);
  try { open(s).read({ instrument: BTC, dataStart: '2025-10-16T23:59:00.000Z', dataEnd: '2025-10-17T00:00:00.000Z' }); assert.fail('expected a refusal'); }
  catch (error) { assert.match(error.message, /outside its unit|holdout/); assert.doesNotMatch(error.message, /9876|9879|9870|9877|4938/); }
  const wide = fixture();
  plant(wide, { ...meta, dataEnd: '2025-11-01T00:00:00.000Z' }, [ms('2025-10-16T23:59:00.000Z')]);
  assert.throws(() => open(wide).read({ instrument: BTC, dataStart: '2025-10-16T23:59:00.000Z', dataEnd: '2025-10-17T00:00:00.000Z' }), /research|holdout|unit/);
});

test('F1a-2 reader: header-manifest disagreement, a foreign instrument, ambiguity and a missing unit fail closed', () => {
  const window = { instrument: BTC, dataStart: '2024-03-02T00:00:00.000Z', dataEnd: '2024-03-03T00:00:00.000Z' };
  const meta = { instrument: BTC, period: 'research', dataStart: '2024-03-01T00:00:00.000Z', dataEnd: '2024-04-01T00:00:00.000Z',
    sources: [{ file: 'data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2024-03.zip', sha256: 'c'.repeat(64) }] };
  const t = [ms('2024-03-02T00:00:00.000Z')];
  const good = fixture(); plant(good, meta, t);
  assert.equal(open(good).read(window).rowCount, 1);
  const rows = fixture(); plant(rows, meta, t, { rowCount: 2 });
  assert.throws(() => open(rows).read(window), /disagree/);
  const foreign = fixture(); plant(foreign, { ...meta, instrument: { ...BTC, contract: 'ETHUSDT' } }, t, { contract: 'BTCUSDT' });
  assert.throws(() => open(foreign).read(window), /disagree/);
  assert.throws(() => open(good).read({ ...window, instrument: { ...BTC, contract: 'ETHUSDT' } }), /no entry/);
  const ambiguous = fixture(); plant(ambiguous, meta, t);
  const second = plant(ambiguous, meta, [...t, ms('2024-03-02T00:01:00.000Z')]);
  const manifest = readManifest(ambiguous.manifestPath);
  assert.ok(manifest.entries.some(e => e.sha256 === second.sha256));
  const both = { ...manifest, entries: [...manifest.entries, { ...manifest.entries.find(e => e.dataStart === meta.dataStart), sha256: second.sha256 === 'f'.repeat(64) ? 'e'.repeat(64) : 'f'.repeat(64) }] };
  sortEntries(both.entries);
  fs.writeFileSync(ambiguous.manifestPath, JSON.stringify(both, null, 2) + '\n');
  assert.throws(() => open(ambiguous).read(window), /ambiguous/);
  const missing = fixture();
  assert.throws(() => open(missing).read({ instrument: BTC, dataStart: '2024-02-01T00:00:00.000Z', dataEnd: '2024-03-02T00:00:00.000Z' }), /no entry/);
});

test('F1a-2 reader: returned arrays are fresh copies; mutating them or a new view on their buffer changes no later read', () => {
  const s = fixture();
  const reader = open(s), other = open(s);
  const request = { instrument: BTC, dataStart: '2024-02-01T00:00:00.000Z', dataEnd: '2024-03-01T00:00:00.000Z' };
  const first = reader.read(request);
  first.columns.close[0] = -1;
  new Float64Array(first.columns.open.buffer).fill(-2);
  assert.throws(() => { first.columns.extra = 1; }, TypeError);
  for (const out of [reader.read(request), other.read(request)]) {
    assert.equal(out.columns.close[0], 42331.9);
    assert.ok(out.columns.open.every(v => v === 42314));
    assert.notEqual(out.columns.close.buffer, first.columns.close.buffer);
  }
});

test('F1a-2 reader: the verified-bytes cache is bounded (LRU, one unit by default); an evicted file is verified again', () => {
  const s = fixture();
  const jan = { instrument: BTC, dataStart: '2024-01-01T00:00:00.000Z', dataEnd: '2024-02-01T00:00:00.000Z' };
  const feb = { instrument: BTC, dataStart: '2024-02-01T00:00:00.000Z', dataEnd: '2024-03-01T00:00:00.000Z' };
  const janFile = snapshotPath(s.cacheDir, readManifest(s.manifestPath).entries.find(e => e.dataStart === jan.dataStart).sha256);
  const corrupt = () => { fs.chmodSync(janFile, 0o644); const b = fs.readFileSync(janFile); b[b.length - 1] ^= 1; fs.writeFileSync(janFile, b); };
  const two = open(s, { capacity: 2 });
  two.read(jan); two.read(feb);
  const one = open(s);
  one.read(jan); one.read(feb); // feb evicts jan
  corrupt();
  assert.equal(two.read(jan).rowCount, 3); // still cached: the verified bytes, not the changed file
  assert.throws(() => one.read(jan), /hash/);
  two.read(feb); two.read({ ...feb, dataEnd: '2024-02-15T00:00:00.000Z' });
  assert.equal(two.stats().cachedUnits, 2);
  assert.throws(() => open(s).read(jan), /hash/);
});

test('F1a-2 reader: every public entry point rejects poisoned options and requests, and the reader never falls back to cachedSeries', () => {
  const s = fixture();
  for (const bad of [{}, { manifestPath: s.manifestPath }, { manifestPath: s.manifestPath, cacheDir: s.cacheDir, capacity: 0 },
    { manifestPath: s.manifestPath, cacheDir: s.cacheDir, capacity: 1.5 }, { manifestPath: s.manifestPath, cacheDir: s.cacheDir, period: 'holdout' }]) {
    assert.throws(() => openResearch1m(bad), /option/);
  }
  const reader = open(s);
  const base = { instrument: BTC, dataStart: '2024-02-01T00:00:00.000Z', dataEnd: '2024-02-02T00:00:00.000Z' };
  for (const bad of [{ ...base, instrument: { exchange: 'binance', market: 'linear_perpetual' } }, { ...base, instrument: { ...BTC, market: 'spot' } },
    { ...base, instrument: { ...BTC, exchange: 'bybit' } }, { ...base, dataStart: '2024-02-01' }, { ...base, dataEnd: base.dataStart },
    { ...base, final: true }, { ...base, period: 'research' }, null, undefined]) {
    assert.throws(() => reader.read(bad), /request|instrument|ISO|window/);
  }
  assert.equal(Object.isFrozen(reader), true);
  assert.deepEqual(Object.keys(reader).sort(), ['read', 'stats']);
  // The old H2 path cannot read the 1m manifest: it has no holdout guard (h2-contract.mjs cachedSeries).
  let candles = null;
  try { candles = cachedSeries('BTC', '1m', { period: 'research', h2Paths: { manifest: s.manifestPath, cache: s.cacheDir } }, BTC); } catch { candles = null; }
  assert.equal(candles, null);
  const source = fs.readFileSync(new URL('../src/f1-1m-reader.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /cachedSeries|freezeSeries|market-data/);
});
