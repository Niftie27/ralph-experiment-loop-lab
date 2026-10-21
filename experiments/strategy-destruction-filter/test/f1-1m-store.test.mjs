// F1a-2: 1m snapshot store: verified local sources, build, manifest, lock, verify and compare (docs/f1/f1a-2-contract.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { storeSource, recordMissing, localVersions, readManifest, buildStore, verifyStore, compareStore, snapshotPath } from '../src/f1-1m-store.mjs';
import { planUnits } from '../src/vision-source.mjs';
import { decodeSnapshot } from '../src/f1-1m-format.mjs';
import { makeZip, klineCsv, klineRow, minutes, checksumText, sha256, KLINE_HEADER } from '../test-support/vision-fixtures.mjs';

const H2_MANIFEST = new URL('../results/manifest-h2.json', import.meta.url);
function store() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-1m-store-test-'));
  return { zipRoot: path.join(dir, 'vision'), cacheDir: path.join(dir, 'cache'), manifestPath: path.join(dir, 'results', 'manifest-f1-1m.json'), dir };
}
const sourceOf = (symbol, month, i = 0) => planUnits(symbol, { from: month, to: month })[0].sources[i];
const zipFor = (source, openTimes, options = {}) => makeZip([{ name: source.csvName, data: options.csv ?? klineCsv(openTimes, options) }]);
function put(s, symbol, month, openTimes, options = {}) {
  const source = sourceOf(symbol, month, options.index ?? 0);
  const zip = zipFor(source, openTimes, options);
  return { source, zip, ...storeSource(s.zipRoot, source, zip, checksumText(zip, source.zipName)) };
}
const fourRows = month => minutes(`${month}-03T00:00:00.000Z`, 4);
const build = (s, options = {}) => buildStore({ zipRoot: s.zipRoot, cacheDir: s.cacheDir, manifestPath: s.manifestPath, ...options });
const files = dir => { try { return fs.readdirSync(dir).sort(); } catch { return []; } };
const bytesOf = s => ({ manifest: fs.readFileSync(s.manifestPath, 'utf8'), snapshots: files(s.cacheDir).map(f => [f, sha256(fs.readFileSync(path.join(s.cacheDir, f)))]) });
const zipPathOf = (s, source, sha) => path.join(s.zipRoot, path.dirname(source.file), sha, source.zipName);
const ENTRY_KEYS = ['bytes', 'contract', 'dataEnd', 'dataStart', 'exchange', 'firstOpenTime', 'lastOpenTime', 'market', 'missingMinutes', 'missingRanges',
  'period', 'rowCount', 'schemaVersion', 'sha256', 'source', 'sources'];

test('F1a-2 store: a source is stored only after its CHECKSUM matches, read-only under <Vision dir>/<sha256>/, never overwritten', () => {
  const s = store(), source = sourceOf('BTC', '2024-01');
  const zip = zipFor(source, fourRows('2024-01'));
  const tampered = Buffer.from(zip); tampered[tampered.length - 30] ^= 1;
  assert.throws(() => storeSource(s.zipRoot, source, tampered, checksumText(zip, source.zipName)), /sha256 mismatch/);
  assert.throws(() => storeSource(s.zipRoot, source, zip, undefined), /CHECKSUM/);
  assert.throws(() => storeSource(s.zipRoot, source, zip, checksumText(zip, 'BTCUSDT-1m-2024-02.zip')), /CHECKSUM/);
  assert.deepEqual(localVersions(s.zipRoot, source), []);
  const first = storeSource(s.zipRoot, source, zip, checksumText(zip, source.zipName));
  assert.deepEqual(first, { sha256: sha256(zip), stored: true });
  const file = zipPathOf(s, source, sha256(zip));
  assert.equal(fs.readFileSync(`${file}.CHECKSUM`, 'utf8'), checksumText(zip, source.zipName));
  assert.equal(fs.statSync(file).mode & 0o777, 0o444);
  assert.deepEqual(storeSource(s.zipRoot, source, zip, checksumText(zip, source.zipName)), { sha256: sha256(zip), stored: false });
  assert.deepEqual(localVersions(s.zipRoot, source), [sha256(zip)]);
  assert.deepEqual(files(path.dirname(file)), [source.zipName, `${source.zipName}.CHECKSUM`]);
  const republished = zipFor(source, fourRows('2024-01').slice(1));
  storeSource(s.zipRoot, source, republished, checksumText(republished, source.zipName));
  assert.deepEqual(localVersions(s.zipRoot, source), [sha256(zip), sha256(republished)].sort());
  assert.equal(sha256(fs.readFileSync(file)), sha256(zip));
});

test('F1a-2 store: storeSource writes the CHECKSUM first (temp file, rename), so a crash while the zip is written leaves no version; a corrupt CHECKSUM is replaced', t => {
  const s = store(), source = sourceOf('BTC', '2024-12');
  const zip = zipFor(source, fourRows('2024-12')), text = checksumText(zip, source.zipName);
  const file = zipPathOf(s, source, sha256(zip));
  const link = t.mock.method(fs, 'linkSync', () => { throw Object.assign(new Error('simulated crash'), { code: 'EIO' }); });
  assert.throws(() => storeSource(s.zipRoot, source, zip, text), /simulated crash/);
  link.mock.restore();
  assert.equal(fs.readFileSync(`${file}.CHECKSUM`, 'utf8'), text);
  assert.deepEqual(files(path.dirname(file)), [`${source.zipName}.CHECKSUM`]);
  assert.deepEqual(localVersions(s.zipRoot, source), []);
  assert.deepEqual(storeSource(s.zipRoot, source, zip, text), { sha256: sha256(zip), stored: true });
  fs.chmodSync(`${file}.CHECKSUM`, 0o644); fs.writeFileSync(`${file}.CHECKSUM`, 'corrupt');
  assert.deepEqual(storeSource(s.zipRoot, source, zip, text), { sha256: sha256(zip), stored: false });
  assert.equal(fs.readFileSync(`${file}.CHECKSUM`, 'utf8'), text);
  assert.equal(fs.statSync(`${file}.CHECKSUM`).mode & 0o777, 0o444);
  assert.deepEqual(files(path.dirname(file)), [source.zipName, `${source.zipName}.CHECKSUM`]);
});

test('F1a-2 store: build writes one snapshot per unit and a canonical, sorted manifest with full identity and provenance', () => {
  const s = store();
  const a = put(s, 'BTC', '2024-01', fourRows('2024-01')), b = put(s, 'BTC', '2024-02', fourRows('2024-02')), c = put(s, 'ETH', '2024-01', fourRows('2024-01'));
  const result = build(s, { symbols: ['BTC', 'ETH'], from: '2024-01', to: '2024-02' });
  assert.equal(result.status, 'incomplete'); // ETH 2024-02 was never stored
  assert.deepEqual(result.counts, { units: 4, built: 3, unchanged: 0, empty: 0, missing: 1, notListed: 0, failed: 0 });
  const text = fs.readFileSync(s.manifestPath, 'utf8');
  assert.ok(text.endsWith('}\n'));
  const manifest = JSON.parse(text);
  assert.deepEqual(Object.keys(manifest), ['entries', 'kind', 'schemaVersion']);
  assert.equal(manifest.kind, 'binance_vision_kline_1m_manifest');
  assert.deepEqual(manifest.entries.map(e => [e.contract, e.dataStart]), [['BTCUSDT', '2024-01-01T00:00:00.000Z'], ['BTCUSDT', '2024-02-01T00:00:00.000Z'], ['ETHUSDT', '2024-01-01T00:00:00.000Z']]);
  const [entry] = manifest.entries;
  assert.deepEqual(Object.keys(entry), ENTRY_KEYS);
  assert.deepEqual({ ...entry, sha256: undefined, bytes: undefined }, { exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT', period: 'research',
    dataStart: '2024-01-01T00:00:00.000Z', dataEnd: '2024-02-01T00:00:00.000Z', schemaVersion: 1, sha256: undefined, bytes: undefined, rowCount: 4,
    firstOpenTime: '2024-01-03T00:00:00.000Z', lastOpenTime: '2024-01-03T00:03:00.000Z', missingMinutes: 44636,
    missingRanges: [{ start: '2024-01-01T00:00:00.000Z', end: '2024-01-03T00:00:00.000Z' }, { start: '2024-01-03T00:04:00.000Z', end: '2024-02-01T00:00:00.000Z' }],
    source: 'binance-vision-archive', sources: [{ file: 'data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2024-01.zip', sha256: a.sha256 }] });
  const bytes = fs.readFileSync(snapshotPath(s.cacheDir, entry.sha256));
  assert.equal(sha256(bytes), entry.sha256);
  assert.equal(bytes.length, entry.bytes);
  const { header } = decodeSnapshot(bytes);
  assert.deepEqual([header.instrument, header.period, header.dataStart, header.dataEnd, header.rowCount, header.sources],
    [{ exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT' }, 'research', entry.dataStart, entry.dataEnd, 4, entry.sources]);
  assert.deepEqual(readManifest(s.manifestPath).entries, manifest.entries);
  assert.ok(!fs.existsSync(`${s.manifestPath}.lock`) && !fs.existsSync(`${s.manifestPath}.tmp`));
  assert.deepEqual(result.missing, [{ contract: 'ETHUSDT', period: 'research', dataStart: '2024-02-01T00:00:00.000Z', dataEnd: '2024-03-01T00:00:00.000Z',
    files: [{ file: 'data/futures/um/monthly/klines/ETHUSDT/1m/ETHUSDT-1m-2024-02.zip', recorded404: false }] }]);
  void b; void c;
});

test('F1a-2 store: two clean builds, reversed enumeration and a rerun give byte-identical snapshots and manifest', () => {
  const fill = s => { put(s, 'BTC', '2024-01', fourRows('2024-01')); put(s, 'BTC', '2024-02', fourRows('2024-02')); put(s, 'SOL', '2024-01', fourRows('2024-01'), { header: false }); put(s, 'SOL', '2024-02', fourRows('2024-02')); };
  const one = store(), two = store(), rev = store();
  [one, two, rev].forEach(fill);
  assert.equal(build(one, { symbols: ['BTC', 'SOL'], from: '2024-01', to: '2024-02' }).status, 'ok');
  assert.equal(build(two, { symbols: ['BTC', 'SOL'], from: '2024-01', to: '2024-02' }).status, 'ok');
  assert.equal(build(rev, { symbols: ['SOL', 'BTC'], from: '2024-02', to: '2024-02' }).status, 'ok');
  assert.equal(build(rev, { symbols: ['SOL', 'BTC'], from: '2024-01', to: '2024-01' }).status, 'ok');
  assert.deepEqual(bytesOf(two), bytesOf(one));
  assert.deepEqual(bytesOf(rev), bytesOf(one));
  const before = bytesOf(one), mtime = fs.statSync(one.manifestPath).mtimeMs;
  const rerun = build(one, { symbols: ['BTC', 'SOL'], from: '2024-01', to: '2024-02' });
  assert.equal(rerun.status, 'ok');
  assert.deepEqual(rerun.counts, { units: 4, built: 0, unchanged: 4, empty: 0, missing: 0, notListed: 0, failed: 0 });
  assert.deepEqual(bytesOf(one), before);
  assert.equal(fs.statSync(one.manifestPath).mtimeMs, mtime);
});

test('F1a-2 store: the 2025-10 zip yields a research and a holdout entry with disjoint rows and the same source', () => {
  const s = store();
  put(s, 'DOGE', '2025-10', minutes('2025-10-16T23:57:00.000Z', 6));
  assert.equal(build(s, { symbols: ['DOGE'], from: '2025-10', to: '2025-10' }).status, 'ok');
  const entries = readManifest(s.manifestPath).entries;
  assert.deepEqual(entries.map(e => [e.period, e.dataStart, e.dataEnd, e.rowCount, e.firstOpenTime, e.lastOpenTime]), [
    ['holdout', '2025-10-17T00:00:00.000Z', '2025-11-01T00:00:00.000Z', 3, '2025-10-17T00:00:00.000Z', '2025-10-17T00:02:00.000Z'],
    ['research', '2025-10-01T00:00:00.000Z', '2025-10-17T00:00:00.000Z', 3, '2025-10-16T23:57:00.000Z', '2025-10-16T23:59:00.000Z']]);
  assert.deepEqual(entries[0].sources, entries[1].sources);
});

test('F1a-2 store: a tampered zip, a missing CHECKSUM or a mismatching CHECKSUM fails that unit before any write', () => {
  for (const damage of ['tamper', 'drop-checksum', 'foreign-checksum']) {
    const s = store();
    const { source, sha256: sha } = put(s, 'BTC', '2024-01', fourRows('2024-01'));
    const file = zipPathOf(s, source, sha);
    if (damage === 'tamper') { fs.chmodSync(file, 0o644); const b = fs.readFileSync(file); b[b.length - 30] ^= 1; fs.writeFileSync(file, b); }
    if (damage === 'drop-checksum') fs.rmSync(`${file}.CHECKSUM`);
    if (damage === 'foreign-checksum') { fs.chmodSync(`${file}.CHECKSUM`, 0o644); fs.writeFileSync(`${file}.CHECKSUM`, checksumText(Buffer.from('x'), source.zipName)); }
    const result = build(s, { symbols: ['BTC'], from: '2024-01', to: '2024-01' });
    assert.equal(result.status, 'failed', damage);
    assert.match(result.failures[0].reason, /CHECKSUM|sha256/, damage);
    assert.deepEqual(files(s.cacheDir), [], damage);
    assert.ok(!fs.existsSync(s.manifestPath), damage);
  }
});

test('F1a-2 store: more than one local version of a source fails that unit closed and leaves snapshots and entries untouched', () => {
  const s = store();
  const { source, sha256: oldSha } = put(s, 'ETH', '2024-03', fourRows('2024-03'));
  put(s, 'ETH', '2024-04', fourRows('2024-04'));
  assert.equal(build(s, { symbols: ['ETH'], from: '2024-03', to: '2024-04' }).status, 'ok');
  const before = bytesOf(s);
  const republished = zipFor(source, fourRows('2024-03').slice(1));
  storeSource(s.zipRoot, source, republished, checksumText(republished, source.zipName));
  const result = build(s, { symbols: ['ETH'], from: '2024-03', to: '2024-04' });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.counts, { units: 2, built: 0, unchanged: 1, empty: 0, missing: 0, notListed: 0, failed: 1 });
  assert.match(result.failures[0].reason, /more than one local version/);
  assert.ok(result.failures[0].reason.includes(oldSha) && result.failures[0].reason.includes(sha256(republished)));
  assert.deepEqual(bytesOf(s), before);
});

test('F1a-2 store: a unit whose manifest entry used other source versions fails closed (no automatic new snapshot)', () => {
  const s = store();
  const { source, sha256: oldSha } = put(s, 'XRP', '2024-05', fourRows('2024-05'));
  assert.equal(build(s, { symbols: ['XRP'], from: '2024-05', to: '2024-05' }).status, 'ok');
  const before = bytesOf(s);
  fs.rmSync(path.dirname(zipPathOf(s, source, oldSha)), { recursive: true });
  const republished = zipFor(source, fourRows('2024-05').slice(2));
  storeSource(s.zipRoot, source, republished, checksumText(republished, source.zipName));
  const result = build(s, { symbols: ['XRP'], from: '2024-05', to: '2024-05' });
  assert.equal(result.status, 'failed');
  assert.match(result.failures[0].reason, /version selection/);
  assert.deepEqual(bytesOf(s), before);
});

test('F1a-2 store: recorded 404s before the first file are not_listed; later missing files are gaps (incomplete); empty units are gaps but complete', () => {
  const s = store();
  for (const month of ['2025-03', '2025-04']) recordMissing(s.zipRoot, sourceOf('HYPE', month));
  put(s, 'HYPE', '2025-05', minutes('2025-05-30T07:00:00.000Z', 3));
  recordMissing(s.zipRoot, sourceOf('HYPE', '2025-07'));
  put(s, 'HYPE', '2025-06', fourRows('2025-06'));
  const result = build(s, { symbols: ['HYPE'], from: '2025-03', to: '2025-07' });
  assert.equal(result.status, 'incomplete');
  assert.deepEqual(result.counts, { units: 5, built: 2, unchanged: 0, empty: 0, missing: 1, notListed: 2, failed: 0 });
  const [coverage] = result.coverage;
  assert.deepEqual([coverage.contract, coverage.firstSourceFile, coverage.firstCandle, coverage.notListed],
    ['HYPEUSDT', 'data/futures/um/monthly/klines/HYPEUSDT/1m/HYPEUSDT-1m-2025-05.zip', '2025-05-30T07:00:00.000Z', ['2025-03', '2025-04']]);
  assert.equal(coverage.expectedMinutes, (31 + 30 + 31) * 1440);
  assert.equal(coverage.bars, 7);
  assert.deepEqual(coverage.gaps, [{ period: 'research', dataStart: '2025-07-01T00:00:00.000Z', dataEnd: '2025-08-01T00:00:00.000Z', status: 'missing' }]);
  assert.equal(coverage.missingRanges.at(-1).end, '2025-08-01T00:00:00.000Z');
  // An unrecorded missing file before the first file is a gap, never not_listed.
  const t = store();
  put(t, 'BTC', '2024-02', fourRows('2024-02'));
  assert.deepEqual(build(t, { symbols: ['BTC'], from: '2024-01', to: '2024-02' }).counts, { units: 2, built: 1, unchanged: 0, empty: 0, missing: 1, notListed: 0, failed: 0 });
  // Rows only before 2021-10-18: the unit is empty, reported as a gap, no snapshot, and the run is complete.
  const u = store();
  put(u, 'BTC', '2021-10', minutes('2021-10-01T00:00:00.000Z', 3));
  const empty = build(u, { symbols: ['BTC'], from: '2021-10', to: '2021-10' });
  assert.equal(empty.status, 'ok');
  assert.deepEqual(empty.counts, { units: 1, built: 0, unchanged: 0, empty: 1, missing: 0, notListed: 0, failed: 0 });
  assert.deepEqual(empty.coverage[0].gaps, [{ period: 'research', dataStart: '2021-10-18T00:00:00.000Z', dataEnd: '2021-11-01T00:00:00.000Z', status: 'empty' }]);
  assert.deepEqual(files(u.cacheDir), []);
});

test('F1a-2 store: the lock refuses a second writer, is never deleted automatically, and is removed by its own writer', () => {
  const s = store();
  put(s, 'SOL', '2024-06', fourRows('2024-06'));
  fs.mkdirSync(path.dirname(s.manifestPath), { recursive: true });
  fs.writeFileSync(`${s.manifestPath}.lock`, '{"pid":1,"token":"other"}\n');
  const refused = build(s, { symbols: ['SOL'], from: '2024-06', to: '2024-06' });
  assert.equal(refused.status, 'failed');
  assert.match(refused.error, /lock/);
  assert.ok(!refused.error.includes(os.tmpdir()));
  assert.equal(fs.readFileSync(`${s.manifestPath}.lock`, 'utf8'), '{"pid":1,"token":"other"}\n');
  assert.ok(!fs.existsSync(s.manifestPath));
  assert.deepEqual(files(s.cacheDir), []);
  fs.rmSync(`${s.manifestPath}.lock`);
  assert.equal(build(s, { symbols: ['SOL'], from: '2024-06', to: '2024-06' }).status, 'ok');
  assert.ok(!fs.existsSync(`${s.manifestPath}.lock`));
});

test('F1a-2 store: crash states: an orphan snapshot is harmless and listed by verify; a leftover manifest temp file is replaced', () => {
  const s = store();
  put(s, 'BTC', '2024-07', fourRows('2024-07'));
  fs.mkdirSync(s.cacheDir, { recursive: true });
  fs.writeFileSync(path.join(s.cacheDir, `${'a'.repeat(64)}.bin`), 'orphan');
  fs.mkdirSync(path.dirname(s.manifestPath), { recursive: true });
  fs.writeFileSync(`${s.manifestPath}.tmp`, '{"partial":');
  assert.equal(build(s, { symbols: ['BTC'], from: '2024-07', to: '2024-07' }).status, 'ok');
  assert.ok(!fs.existsSync(`${s.manifestPath}.tmp`));
  const verified = verifyStore(s);
  assert.equal(verified.status, 'ok');
  assert.deepEqual(verified.orphans, [`${'a'.repeat(64)}.bin`]);
  assert.deepEqual([verified.counts.zips, verified.counts.entries], [1, 1]);
});

test('F1a-2 store: an existing snapshot is verified by hash and reused; a corrupt one fails the unit and verify', () => {
  const s = store();
  put(s, 'BTC', '2024-08', fourRows('2024-08'));
  assert.equal(build(s, { symbols: ['BTC'], from: '2024-08', to: '2024-08' }).status, 'ok');
  const [entry] = readManifest(s.manifestPath).entries;
  const file = snapshotPath(s.cacheDir, entry.sha256);
  fs.rmSync(file);
  assert.equal(build(s, { symbols: ['BTC'], from: '2024-08', to: '2024-08' }).counts.unchanged, 1);
  assert.equal(sha256(fs.readFileSync(file)), entry.sha256);
  fs.chmodSync(file, 0o644); fs.appendFileSync(file, 'x');
  assert.equal(build(s, { symbols: ['BTC'], from: '2024-08', to: '2024-08' }).status, 'failed');
  const verified = verifyStore(s);
  assert.equal(verified.status, 'failed');
  assert.match(verified.failures.join('\n'), /snapshot/);
});

test('F1a-2 store: verify recomputes every stored zip against its CHECKSUM, without network', () => {
  const s = store();
  const { source, sha256: sha } = put(s, 'ETH', '2024-09', fourRows('2024-09'));
  assert.equal(verifyStore(s).status, 'ok');
  const file = zipPathOf(s, source, sha);
  fs.chmodSync(file, 0o644); fs.appendFileSync(file, 'x');
  const verified = verifyStore(s);
  assert.equal(verified.status, 'failed');
  assert.match(verified.failures.join('\n'), /ETHUSDT-1m-2024-09\.zip/);
});

test('F1a-2 store: the memory guard aborts the build before any snapshot or manifest write', () => {
  const s = store();
  put(s, 'BTC', '2024-10', fourRows('2024-10'));
  const result = build(s, { symbols: ['BTC'], from: '2024-10', to: '2024-10', guard: { check() { throw new Error('memory ceiling exceeded: 600 MiB > 512 MiB'); } } });
  assert.equal(result.status, 'failed');
  assert.match(result.error, /memory ceiling/);
  assert.deepEqual(files(s.cacheDir), []);
  assert.ok(!fs.existsSync(s.manifestPath) && !fs.existsSync(`${s.manifestPath}.lock`));
});

test('F1a-2 store: a run aborted after some snapshots publishes nothing and reports no unit as built', () => {
  const s = store();
  put(s, 'BTC', '2024-10', fourRows('2024-10'));
  put(s, 'BTC', '2024-11', fourRows('2024-11'));
  let calls = 0;
  const result = build(s, { symbols: ['BTC'], from: '2024-10', to: '2024-11', guard: { check(label) { if (++calls > 2) throw new Error(`memory ceiling exceeded at ${label}`); } } });
  assert.equal(result.status, 'failed');
  assert.equal(result.counts.built, 0);
  assert.equal(result.counts.failed, 1);
  assert.match(result.failures[0].reason, /not published/);
  assert.ok(!fs.existsSync(s.manifestPath));
  assert.deepEqual(verifyStore(s).orphans.length, 1);
});

test('F1a-2 store: compare rebuilds offline and fails on missing, extra or mismatching entries, zero entries and missing inputs; it never rewrites the reference', () => {
  const s = store();
  const jan = put(s, 'BTC', '2024-01', fourRows('2024-01'));
  put(s, 'BTC', '2024-02', fourRows('2024-02'));
  assert.equal(build(s, { symbols: ['BTC'], from: '2024-01', to: '2024-02' }).status, 'ok');
  const reference = fs.readFileSync(s.manifestPath);
  const compare = (options = {}) => compareStore({ zipRoot: s.zipRoot, manifestPath: s.manifestPath, symbols: ['BTC'], from: '2024-01', to: '2024-02', ...options });
  const ok = compare();
  assert.equal(ok.status, 'ok');
  assert.equal(ok.counts.compared, 2);
  const edited = JSON.parse(reference);
  const write = manifest => { fs.writeFileSync(s.manifestPath, JSON.stringify(manifest, null, 2) + '\n'); };
  write({ ...edited, entries: [{ ...edited.entries[0], missingMinutes: edited.entries[0].missingMinutes - 1 }, edited.entries[1]] });
  assert.match(compare().mismatches.join('\n'), /2024-01/);
  write({ ...edited, entries: [edited.entries[0]] });
  const extra = compare();
  assert.equal(extra.status, 'failed');
  assert.equal(extra.extra.length, 1);
  write({ ...edited, entries: [...edited.entries, { ...edited.entries[1], dataStart: '2024-03-01T00:00:00.000Z', dataEnd: '2024-04-01T00:00:00.000Z' }] });
  const missing = compare({ to: '2024-03' });
  assert.equal(missing.status, 'failed');
  assert.ok(missing.missing.length === 1 && missing.missingInputs.length === 1);
  fs.writeFileSync(s.manifestPath, reference);
  const zero = compare({ from: '2024-05', to: '2024-05' });
  assert.equal(zero.status, 'failed');
  assert.equal(zero.counts.compared, 0);
  fs.rmSync(path.dirname(zipPathOf(s, jan.source, jan.sha256)), { recursive: true });
  const noInput = compare();
  assert.equal(noInput.status, 'failed');
  assert.equal(noInput.missingInputs[0].file, jan.source.file);
  assert.deepEqual(fs.readFileSync(s.manifestPath), reference);
});

test('F1a-2 store: a build never touches results/manifest-h2.json', () => {
  const before = sha256(fs.readFileSync(H2_MANIFEST));
  const s = store();
  put(s, 'SOL', '2024-11', fourRows('2024-11'));
  build(s, { symbols: ['SOL'], from: '2024-11', to: '2024-11' });
  assert.equal(sha256(fs.readFileSync(H2_MANIFEST)), before);
  assert.equal(before, '41dc53724f78315658a5e07071db5b1aab4f8811ff7ff37e1849dfea4f11a308');
});

test('F1a-2 store: failures and summaries for holdout units carry counts, times and hashes, never prices', () => {
  const s = store();
  const source = sourceOf('SOL', '2026-01');
  const t = minutes('2026-01-05T00:00:00.000Z', 2);
  const csv = KLINE_HEADER + '\n' + klineRow(t[0], { open: '187.4321', high: '187.1234', low: '186.9876', close: '187.0001' }) + '\n' + klineRow(t[1]) + '\n';
  const zip = makeZip([{ name: source.csvName, data: csv }]);
  storeSource(s.zipRoot, source, zip, checksumText(zip, source.zipName));
  const result = build(s, { symbols: ['SOL'], from: '2026-01', to: '2026-01' });
  assert.equal(result.status, 'failed');
  const text = JSON.stringify(result);
  assert.match(text, /2026-01-05T00:00:00.000Z/);
  assert.doesNotMatch(text, /187\.|186\./);
  const ok = store();
  put(ok, 'SOL', '2026-02', fourRows('2026-02'));
  assert.doesNotMatch(JSON.stringify(build(ok, { symbols: ['SOL'], from: '2026-02', to: '2026-02' })), /42331\.9|42335\.8|42289\.6|289\.641|175\.211|12256155\./);
});
