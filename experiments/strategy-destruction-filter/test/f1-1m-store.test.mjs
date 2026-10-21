// F1a-2: 1m snapshot store: verified local sources, build, manifest, lock, verify and compare (docs/f1/f1a-2-contract.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { storeSource, recordMissing, localVersions, readManifest, buildStore, verifyStore, compareStore, snapshotPath, entryDailyFill } from '../src/f1-1m-store.mjs';
import { planUnits, visionSource } from '../src/vision-source.mjs';
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
  // Round 5: every day of a sparse fixture month is a fill day; without evidence (a version or the 404 marker) its
  // unit is missing (F5). By default every day of the month gets the marker: fill unavailable.
  if (source.kind === 'monthly' && options.fillEvidence !== false) {
    const { instrument } = planUnits(symbol, { from: month, to: month })[0];
    for (let day = source.startMs; day < source.endMs; day += 86400000) markUnavailable(s.zipRoot, visionSource(instrument, 'daily', day));
  }
  return { source, zip, ...storeSource(s.zipRoot, source, zip, checksumText(zip, source.zipName)) };
}
// The 404 marker at the path recordMissing uses, written without its fsyncs to keep the fixtures fast.
function markUnavailable(zipRoot, source) {
  const file = path.join(zipRoot, path.dirname(source.file), '404', source.zipName);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '404 on the zip and its CHECKSUM\n');
}
const fourRows = month => minutes(`${month}-03T00:00:00.000Z`, 4);
const build = (s, options = {}) => buildStore({ zipRoot: s.zipRoot, cacheDir: s.cacheDir, manifestPath: s.manifestPath, ...options });
const files = dir => { try { return fs.readdirSync(dir).sort(); } catch { return []; } };
const bytesOf = s => ({ manifest: fs.readFileSync(s.manifestPath, 'utf8'), snapshots: files(s.cacheDir).map(f => [f, sha256(fs.readFileSync(path.join(s.cacheDir, f)))]) });
const zipPathOf = (s, source, sha) => path.join(s.zipRoot, path.dirname(source.file), sha, source.zipName);
const ENTRY_KEYS = ['bytes', 'contract', 'dataEnd', 'dataStart', 'exchange', 'filledRanges', 'firstOpenTime', 'lastOpenTime', 'market', 'missingMinutes', 'missingRanges',
  'period', 'quarantinedRows', 'rowCount', 'schemaVersion', 'sha256', 'source', 'sources'];

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
    quarantinedRows: [], filledRanges: [],
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
  // The listing rule needs 404 evidence for every earlier month from the F1a range start.
  for (const unit of planUnits('HYPE', { from: '2021-10', to: '2025-02' })) recordMissing(s.zipRoot, unit.sources[0]);
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
  const result = build(s, { symbols: ['BTC'], from: '2024-10', to: '2024-11', guard: { check(label) { if (label === 'BTCUSDT 2024-11-01T00:00:00.000Z') throw new Error(`memory ceiling exceeded at ${label}`); } } });
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
  write({ ...edited, entries: [{ ...edited.entries[0], bytes: edited.entries[0].bytes + 1 }, edited.entries[1]] });
  assert.match(compare().mismatches.join('\n'), /2024-01/);
  write({ ...edited, entries: [edited.entries[0]] });
  const extra = compare();
  assert.equal(extra.status, 'failed');
  assert.equal(extra.extra.length, 1);
  // A consistent reference entry for March (January's entry moved by 60 days) whose input is missing locally.
  const shift = t => new Date(Date.parse(t) + 60 * 86400000).toISOString(), first = edited.entries[0];
  const march = { ...first, dataStart: '2024-03-01T00:00:00.000Z', dataEnd: '2024-04-01T00:00:00.000Z', firstOpenTime: shift(first.firstOpenTime), lastOpenTime: shift(first.lastOpenTime),
    missingRanges: first.missingRanges.map(r => ({ start: shift(r.start), end: shift(r.end) })), sources: [{ ...first.sources[0], file: first.sources[0].file.replace('2024-01', '2024-03') }] };
  write({ ...edited, entries: [...edited.entries, march] });
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
  const prices = { open: '187.4321', high: '187.1234', low: '186.9876', close: '187.0001' };
  // A broken value rule quarantines the row (round 5): recorded with its time and rule, never its values.
  const t = minutes('2026-01-05T00:00:00.000Z', 2);
  put(s, 'SOL', '2026-01', t, { csv: KLINE_HEADER + '\n' + klineRow(t[0], prices) + '\n' + klineRow(t[1]) + '\n' });
  const quarantined = build(s, { symbols: ['SOL'], from: '2026-01', to: '2026-01' });
  assert.equal(quarantined.status, 'ok');
  assert.deepEqual(readManifest(s.manifestPath).entries[0].quarantinedRows, [{ file: sourceOf('SOL', '2026-01').file, openTime: '2026-01-05T00:00:00.000Z', rule: 'high below max(open, close)' }]);
  // A structural error fails the unit; the failure names the row and its time, never its values.
  const u = minutes('2026-03-05T00:00:00.000Z', 2);
  put(s, 'SOL', '2026-03', u, { csv: KLINE_HEADER + '\n' + klineRow(u[0], { ...prices, closeTime: String(u[0] + 1) }) + '\n' + klineRow(u[1]) + '\n' });
  const result = build(s, { symbols: ['SOL'], from: '2026-03', to: '2026-03' });
  assert.equal(result.status, 'failed');
  const text = JSON.stringify([quarantined, result, readManifest(s.manifestPath)]);
  assert.match(text, /2026-01-05T00:00:00.000Z/);
  assert.match(text, /2026-03-05T00:00:00.000Z/);
  assert.doesNotMatch(text, /187\.|186\./);
  const ok = store();
  put(ok, 'SOL', '2026-02', fourRows('2026-02'));
  assert.doesNotMatch(JSON.stringify(build(ok, { symbols: ['SOL'], from: '2026-02', to: '2026-02' })), /42331\.9|42335\.8|42289\.6|289\.641|175\.211|12256155\./);
});

// Round 5 entry schema (contract amendment round 5, Q3 and F6; plan approval point 7).
const writeEntries = (s, entries) => fs.writeFileSync(s.manifestPath, JSON.stringify({ entries, kind: 'binance_vision_kline_1m_manifest', schemaVersion: 1 }, null, 2) + '\n');
const BTC_USDM = { exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT' };
const dailyOf = day => visionSource(BTC_USDM, 'daily', Date.parse(`${day}T00:00:00.000Z`)).file;
function builtJanuary() {
  const s = store();
  put(s, 'BTC', '2024-01', fourRows('2024-01')); // 2024-01-03T00:00..00:03
  assert.equal(build(s, { symbols: ['BTC'], from: '2024-01', to: '2024-01' }).status, 'ok');
  return { s, entry: readManifest(s.manifestPath).entries[0] };
}
const rejects = (s, entry) => (over, pattern) => {
  writeEntries(s, [{ ...entry, ...over }]);
  assert.throws(() => readManifest(s.manifestPath), pattern, JSON.stringify(over));
};

test('F1a-2 r5 store: entries carry quarantinedRows and filledRanges; checkEntry rejects bad keys, foreign files, off-minute, out-of-unit, unsorted or duplicate records, unknown rules, and non-maximal, overlapping or missing-range ranges', () => {
  const { s, entry } = builtJanuary();
  assert.deepEqual([entry.quarantinedRows, entry.filledRanges], [[], []]);
  const monthly = entry.sources[0].file, day3 = dailyOf('2024-01-03');
  const q = (openTime, rule = 'volume must be >= 0', file = monthly) => ({ file, openTime, rule });
  const valid = { ...entry, quarantinedRows: [q('2024-01-01T00:00:00.000Z'), q('2024-01-03T00:05:00.000Z', 'high below max(open, close)', day3), q('2024-01-03T00:05:00.000Z')],
    filledRanges: [{ start: '2024-01-03T00:00:00.000Z', end: '2024-01-03T00:02:00.000Z' }], sources: [{ file: day3, sha256: 'a'.repeat(64) }, ...entry.sources] };
  writeEntries(s, [valid]);
  assert.deepEqual(readManifest(s.manifestPath).entries, [valid]);
  const reject = rejects(s, valid);
  for (const rows of [{}, [{ ...q('2024-01-01T00:00:00.000Z'), value: 1 }], [q('2024-01-01T00:00:00.000Z', undefined, dailyOf('2024-01-05'))],
    [q('2024-01-01T00:00:30.000Z')], [q('2024-01-01T00:00:00Z')], [q('2024-02-01T00:00:00.000Z')], [q('2024-01-03T00:01:00.000Z')],
    [q('2024-01-01T00:00:00.000Z', 'volume must be > 0')], [q('2024-01-02T00:00:00.000Z'), q('2024-01-01T00:00:00.000Z')],
    [q('2024-01-01T00:00:00.000Z'), q('2024-01-01T00:00:00.000Z')], [q('2024-01-03T00:05:00.000Z'), q('2024-01-03T00:05:00.000Z', undefined, day3)]]) {
    reject({ quarantinedRows: rows }, /quarantinedRows|quarantined minute/);
  }
  const r = (start, end) => ({ start: `2024-01-03T${start}:00.000Z`, end: `2024-01-03T${end}:00.000Z` });
  for (const ranges of [{}, [{ ...r('00:00', '00:01'), minutes: 1 }], [{ start: '2024-01-03T00:00:30.000Z', end: '2024-01-03T00:01:00.000Z' }], [r('00:01', '00:01')],
    [r('00:01', '00:00')], [r('00:00', '00:01'), r('00:01', '00:02')], [r('00:02', '00:03'), r('00:00', '00:01')], [r('00:00', '00:02'), r('00:01', '00:03')],
    [r('00:03', '00:05')], [{ start: '2024-01-31T23:59:00.000Z', end: '2024-02-01T00:01:00.000Z' }]]) {
    reject({ filledRanges: ranges }, /filledRanges/);
  }
});

test('F1a-2 r5 store: a manifest with the old key set is rejected by readManifest, build and verify', () => {
  const { s, entry } = builtJanuary();
  const { quarantinedRows, filledRanges, ...old } = entry;
  void quarantinedRows; void filledRanges;
  writeEntries(s, [old]);
  assert.throws(() => readManifest(s.manifestPath), /keys must be exactly/);
  const rebuilt = build(s, { symbols: ['BTC'], from: '2024-01', to: '2024-01' });
  assert.equal(rebuilt.status, 'failed');
  assert.match(rebuilt.error, /keys must be exactly/);
  const verified = verifyStore(s);
  assert.equal(verified.status, 'failed');
  assert.match(verified.failures.join('\n'), /keys must be exactly/);
});

test('F1a-2 r5 store: checkEntry consistency: planned unit, missingRanges sorted, maximal, inside the unit and equal to missingMinutes, rowCount + missingMinutes = unit minutes, fill dailies on lacking days, no fills for base dailies', () => {
  const { s, entry } = builtJanuary();
  const reject = rejects(s, entry);
  const m = (start, end) => ({ start: `${start}:00.000Z`, end: `${end}:00.000Z` });
  reject({ missingRanges: [m('2024-01-03T00:04', '2024-02-01T00:00'), m('2024-01-01T00:00', '2024-01-03T00:00')] }, /missingRanges/);
  reject({ missingRanges: [m('2024-01-01T00:00', '2024-01-02T00:00'), m('2024-01-02T00:00', '2024-01-03T00:00'), m('2024-01-03T00:04', '2024-02-01T00:00')] }, /missingRanges/);
  reject({ missingRanges: [{ start: '2024-01-01T00:00:30.000Z', end: '2024-01-03T00:00:00.000Z' }, m('2024-01-03T00:04', '2024-02-01T00:00')] }, /missingRanges/);
  reject({ missingRanges: [m('2023-12-31T23:59', '2024-01-03T00:00'), m('2024-01-03T00:04', '2024-02-01T00:00')] }, /missingRanges/);
  reject({ missingRanges: [m('2024-01-01T00:00', '2024-01-01T00:00'), m('2024-01-01T00:01', '2024-01-03T00:00'), m('2024-01-03T00:04', '2024-02-01T00:00')] }, /missingRanges/);
  reject({ missingMinutes: entry.missingMinutes - 1 }, /missing minutes/);
  reject({ rowCount: entry.rowCount + 1 }, /missing minutes/);
  reject({ dataEnd: '2024-01-31T00:00:00.000Z' }, /planned unit/);
  reject({ period: 'holdout' }, /planned unit/);
  reject({ contract: 'PEPEUSDT' }, /planned unit/);
  reject({ sources: [{ file: entry.sources[0].file.replace('2024-01', '2024-02'), sha256: entry.sources[0].sha256 }] }, /base source/);
  // A nearly complete January: only 2024-01-01 lacks minutes, so only that day may carry a fill daily.
  const dense = { ...entry, rowCount: 43200, missingMinutes: 1440, missingRanges: [m('2024-01-01T00:00', '2024-01-02T00:00')], firstOpenTime: '2024-01-02T00:00:00.000Z', lastOpenTime: '2024-01-31T23:59:00.000Z' };
  const withDaily = (...days) => [...days.map(d => ({ file: dailyOf(d), sha256: 'b'.repeat(64) })), entry.sources[0]];
  writeEntries(s, [{ ...dense, sources: withDaily('2024-01-01') }]);
  assert.equal(readManifest(s.manifestPath).entries.length, 1);
  const denseReject = rejects(s, dense);
  denseReject({ sources: withDaily('2024-01-05') }, /fill source/);
  denseReject({ sources: [{ file: dailyOf('2024-02-01'), sha256: 'b'.repeat(64) }, entry.sources[0]] }, /fill source/);
  denseReject({ sources: [{ file: dailyOf('2024-01-01').replaceAll('BTCUSDT', 'ETHUSDT'), sha256: 'b'.repeat(64) }, entry.sources[0]] }, /fill source/);
  denseReject({ filledRanges: [m('2024-01-05T00:00', '2024-01-05T00:10')] }, /filled day/);
  writeEntries(s, [{ ...dense, filledRanges: [m('2024-01-05T00:00', '2024-01-05T00:10')], sources: withDaily('2024-01-01', '2024-01-05') }]);
  assert.equal(readManifest(s.manifestPath).entries.length, 1);
  // 2026-10 is built from its 16 base dailies: missing minutes, but never a fill source or filledRanges.
  const days = planUnits('BTC', { from: '2026-10', to: '2026-10' })[0].sources.map(src => ({ file: src.file, sha256: 'c'.repeat(64) }));
  const daily = { ...entry, period: 'holdout', dataStart: '2026-10-01T00:00:00.000Z', dataEnd: '2026-10-17T00:00:00.000Z', firstOpenTime: '2026-10-01T00:00:00.000Z',
    lastOpenTime: '2026-10-16T23:59:00.000Z', rowCount: 16 * 1440 - 10, missingMinutes: 10, missingRanges: [m('2026-10-05T00:00', '2026-10-05T00:10')], sources: days };
  writeEntries(s, [daily]);
  assert.equal(readManifest(s.manifestPath).entries.length, 1);
  const dailyReject = rejects(s, daily);
  dailyReject({ filledRanges: [m('2026-10-01T00:00', '2026-10-01T00:01')] }, /base dailies/);
  dailyReject({ sources: [...days, { file: dailyOf('2026-10-20'), sha256: 'c'.repeat(64) }].sort((x, y) => x.file < y.file ? -1 : 1) }, /base dailies/);
  dailyReject({ sources: days.slice(1) }, /base source/);
});

// Row quarantine in the store (contract amendment round 5, Q2-Q5).
const BAD = { open: '98799.11', high: '98765.43' }; // high below max(open, close)
const csvRows = rows => KLINE_HEADER + '\n' + rows.join('\n') + '\n';

test('F1a-2 r5 store: a quarantined row is recorded in its unit entry and the build report; quarantine sets no exit code', () => {
  const s = store();
  const t = minutes('2024-03-03T00:00:00.000Z', 4);
  const { source } = put(s, 'ETH', '2024-03', t, { csv: csvRows([klineRow(t[0]), klineRow(t[1], BAD), klineRow(t[2]), klineRow(t[3])]) });
  const result = build(s, { symbols: ['ETH'], from: '2024-03', to: '2024-03' });
  assert.equal(result.status, 'ok');
  const record = { file: source.file, openTime: '2024-03-03T00:01:00.000Z', rule: 'high below max(open, close)' };
  const [entry] = readManifest(s.manifestPath).entries;
  assert.deepEqual([entry.rowCount, entry.quarantinedRows, entry.filledRanges], [3, [record], []]);
  assert.ok(entry.missingRanges.some(r => r.start === '2024-03-03T00:01:00.000Z' && r.end === '2024-03-03T00:02:00.000Z'));
  assert.deepEqual(result.coverage[0].quarantine, { sourceRows: 1, uniqueMinutes: 1, rows: [record] });
  const rerun = build(s, { symbols: ['ETH'], from: '2024-03', to: '2024-03' });
  assert.deepEqual([rerun.status, rerun.counts.unchanged, rerun.coverage[0].quarantine.rows], ['ok', 1, [record]]);
  assert.doesNotMatch(JSON.stringify([result, entry]), /9879|9876/);
});

test('F1a-2 r5 store: an all-quarantined unit is empty, without snapshot or entry, and its records are in the report', () => {
  const s = store();
  const t = minutes('2024-04-03T00:00:00.000Z', 2);
  const { source } = put(s, 'XRP', '2024-04', t, { csv: csvRows(t.map(x => klineRow(x, BAD))) });
  const result = build(s, { symbols: ['XRP'], from: '2024-04', to: '2024-04' });
  assert.equal(result.status, 'ok');
  assert.deepEqual(result.counts, { units: 1, built: 0, unchanged: 0, empty: 1, missing: 0, notListed: 0, failed: 0 });
  assert.deepEqual(files(s.cacheDir), []);
  assert.deepEqual(readManifest(s.manifestPath).entries, []);
  assert.deepEqual(result.coverage[0].quarantine.rows, t.map(x => ({ file: source.file, openTime: new Date(x).toISOString(), rule: 'high below max(open, close)' })));
});

test('F1a-2 r5 store: 6 + 5 quarantined rows across the 2025-10 boundary fail both units', () => {
  const s = store();
  const t = minutes('2025-10-16T23:53:00.000Z', 13); // rows 0-6 before 2025-10-17, rows 7-12 from it on; 0 and 12 stay valid
  put(s, 'DOGE', '2025-10', t, { csv: csvRows(t.map((x, i) => klineRow(x, i >= 1 && i <= 11 ? BAD : {}))) });
  const result = build(s, { symbols: ['DOGE'], from: '2025-10', to: '2025-10' });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.failures.map(f => [f.period, /more than 10 quarantined rows/.test(f.reason)]), [['research', true], ['holdout', true]]);
  assert.deepEqual(files(s.cacheDir), []);
  assert.doesNotMatch(JSON.stringify(result), /9879|9876/);
  const ten = store();
  put(ten, 'DOGE', '2025-10', t, { csv: csvRows(t.map((x, i) => klineRow(x, i >= 1 && i <= 10 ? BAD : {}))) });
  const ok = build(ten, { symbols: ['DOGE'], from: '2025-10', to: '2025-10' });
  assert.equal(ok.status, 'ok');
  const entries = readManifest(ten.manifestPath).entries;
  assert.deepEqual(entries.map(e => [e.period, e.quarantinedRows.length]), [['holdout', 4], ['research', 6]]);
  assert.equal(ok.coverage[0].quarantine.sourceRows, 10);
});

// Daily fill in the store (contract amendment round 5, F1, F4-F7, F10; plan approval points 3, 4, 5, 8 and 9).
function putDaily(s, symbol, day, openTimes, options = {}) {
  const { instrument } = planUnits(symbol, { from: day.slice(0, 7), to: day.slice(0, 7) })[0];
  const source = visionSource(instrument, 'daily', Date.parse(`${day}T00:00:00.000Z`));
  const zip = makeZip([{ name: source.csvName, data: options.csv ?? klineCsv(openTimes, options) }], options.zip);
  return { source, zip, ...storeSource(s.zipRoot, source, zip, checksumText(zip, source.zipName)) };
}
const dayFile = (contract, day) => `data/futures/um/daily/klines/${contract}/1m/${contract}-1m-${day}.zip`;
const monthDays = (month, n) => Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
const markDays = (s, days) => { for (const day of days) markUnavailable(s.zipRoot, visionSource(BTC_USDM, 'daily', Date.parse(`${day}T00:00:00.000Z`))); };
const JAN = { symbols: ['BTC'], from: '2024-01', to: '2024-01' };

test('F1a-2 r5 store: a filled unit lists the monthly file and every present fill daily, also one that fills nothing, in sources, header and entry; unavailable days are reported, not stored', () => {
  const s = store();
  const t3 = minutes('2024-01-03T00:00:00.000Z', 4), t5 = minutes('2024-01-05T00:00:00.000Z', 2);
  const { source: monthly, sha256: monthlySha } = put(s, 'BTC', '2024-01', [t3[0], t3[3], ...t5]);
  const day3 = putDaily(s, 'BTC', '2024-01-03', t3), day5 = putDaily(s, 'BTC', '2024-01-05', t5);
  const result = build(s, JAN);
  assert.equal(result.status, 'ok');
  const [entry] = readManifest(s.manifestPath).entries;
  assert.deepEqual(entry.sources, [{ file: day3.source.file, sha256: day3.sha256 }, { file: day5.source.file, sha256: day5.sha256 }, { file: monthly.file, sha256: monthlySha }]);
  assert.deepEqual([entry.rowCount, entry.filledRanges, entry.quarantinedRows], [6, [{ start: '2024-01-03T00:01:00.000Z', end: '2024-01-03T00:03:00.000Z' }], []]);
  assert.deepEqual(decodeSnapshot(fs.readFileSync(snapshotPath(s.cacheDir, entry.sha256))).header.sources, entry.sources);
  const unavailable = monthDays('2024-01', 31).filter(d => d !== '2024-01-03' && d !== '2024-01-05').map(d => dayFile('BTCUSDT', d));
  assert.deepEqual(result.coverage[0].dailyFill, { filledMinutes: 2, sources: [day3.source.file, day5.source.file], unavailable });
  assert.ok(!fs.readFileSync(s.manifestPath, 'utf8').includes(dayFile('BTCUSDT', '2024-01-01')));
});

test('F1a-2 r5 store: a fill with the 404 marker is unavailable (no exit 3, not listing evidence); a fill without version and marker makes the unit missing (recorded404 false)', () => {
  const s = store();
  put(s, 'BTC', '2024-01', fourRows('2024-01'));
  const ok = build(s, JAN);
  assert.deepEqual([ok.status, ok.counts.built, ok.coverage[0].dailyFill.unavailable.length], ['ok', 1, 31]);
  // A daily stored for HYPE's April 30 is no evidence that the April monthly file exists: April stays not_listed.
  const h = store();
  for (const unit of planUnits('HYPE', { from: '2021-10', to: '2025-04' })) recordMissing(h.zipRoot, unit.sources[0]);
  put(h, 'HYPE', '2025-05', minutes('2025-05-30T10:30:00.000Z', 2));
  putDaily(h, 'HYPE', '2025-04-30', minutes('2025-04-30T00:00:00.000Z', 2));
  const listed = build(h, { symbols: ['HYPE'], from: '2025-03', to: '2025-05' });
  assert.deepEqual([listed.status, listed.counts.notListed, listed.coverage[0].firstSourceFile], ['ok', 2, sourceOf('HYPE', '2025-05').file]);
  // No version and no marker for one fill day: the unit is missing, as for an absent base source.
  const m = store();
  put(m, 'BTC', '2024-01', fourRows('2024-01'), { fillEvidence: false });
  markDays(m, monthDays('2024-01', 31).filter(d => d !== '2024-01-20'));
  const missing = build(m, JAN);
  assert.equal(missing.status, 'incomplete');
  assert.deepEqual(missing.missing, [{ contract: 'BTCUSDT', period: 'research', dataStart: '2024-01-01T00:00:00.000Z', dataEnd: '2024-02-01T00:00:00.000Z',
    files: [{ file: dayFile('BTCUSDT', '2024-01-20'), recorded404: false }] }]);
});

test('F1a-2 r5 store: two versions, a corrupt version, or a present fill failing parse, CRC or the cap fails the unit and outranks a missing fill, in both enumeration orders', () => {
  const t = minutes('2024-01-03T00:00:00.000Z', 2);
  const cases = [
    ['two versions', s => { putDaily(s, 'BTC', '2024-01-03', t); putDaily(s, 'BTC', '2024-01-03', t.slice(1)); }, /more than one local version/],
    ['corrupt bytes', s => { const d = putDaily(s, 'BTC', '2024-01-03', t); const f = zipPathOf(s, d.source, d.sha256); fs.chmodSync(f, 0o644); const b = fs.readFileSync(f); b[b.length - 30] ^= 1; fs.writeFileSync(f, b); }, /sha256 mismatch/],
    ['parse', s => putDaily(s, 'BTC', '2024-01-03', t, { csv: csvRows([klineRow(t[0], { closeTime: String(t[0] + 1) })]) }), /close_time/],
    ['CRC', s => putDaily(s, 'BTC', '2024-01-03', t, { zip: { crc: 12345 } }), /CRC32/],
    ['cap', s => putDaily(s, 'BTC', '2024-01-03', [], { csv: csvRows(minutes('2024-01-03T00:00:00.000Z', 11).map(x => klineRow(x, BAD))) }), /more than 10 quarantined rows/]];
  for (const [name, damage, pattern] of cases) for (const absent of ['2024-01-20', '2024-01-02']) {
    const s = store();
    put(s, 'BTC', '2024-01', fourRows('2024-01'), { fillEvidence: false });
    markDays(s, monthDays('2024-01', 31).filter(d => d !== absent && d !== '2024-01-03'));
    damage(s);
    const result = build(s, JAN);
    assert.equal(result.status, 'failed', `${name}, absent ${absent}`);
    assert.match(result.failures[0].reason, pattern, `${name}, absent ${absent}`);
    assert.deepEqual([files(s.cacheDir), fs.existsSync(s.manifestPath)], [[], false], `${name}, absent ${absent}`);
  }
});

test('F1a-2 r5 store: an over-cap daily that fills nothing fails its unit', () => {
  const over = store();
  put(over, 'BTC', '2024-01', fourRows('2024-01'));
  putDaily(over, 'BTC', '2024-01-05', [], { csv: csvRows(minutes('2024-01-05T00:00:00.000Z', 11).map(x => klineRow(x, BAD))) });
  const failed = build(over, JAN);
  assert.equal(failed.status, 'failed');
  assert.match(failed.failures[0].reason, /BTCUSDT-1m-2024-01-05|more than 10 quarantined rows in this file/);
  assert.deepEqual(files(over.cacheDir), []);
  const ten = store();
  put(ten, 'BTC', '2024-01', fourRows('2024-01'));
  const day5 = putDaily(ten, 'BTC', '2024-01-05', [], { csv: csvRows(minutes('2024-01-05T00:00:00.000Z', 10).map(x => klineRow(x, BAD))) });
  assert.equal(build(ten, JAN).status, 'ok');
  const [entry] = readManifest(ten.manifestPath).entries;
  assert.deepEqual([entry.quarantinedRows.length, entry.quarantinedRows.every(q => q.file === day5.source.file), entry.filledRanges, entry.rowCount], [10, true, [], 4]);
});

test('F1a-2 r5 store: the split month uses only the dailies of each unit\'s own days; no record in both units', () => {
  const s = store();
  const at = t => Date.parse(`2025-10-${t}:00.000Z`);
  const { source: monthly } = put(s, 'DOGE', '2025-10', [], { csv: csvRows([klineRow(at('16T23:57')), klineRow(at('16T23:58'), BAD), klineRow(at('17T00:01'), BAD), klineRow(at('17T00:02'))]) });
  const d16 = putDaily(s, 'DOGE', '2025-10-16', [at('16T23:57'), at('16T23:59')]), d17 = putDaily(s, 'DOGE', '2025-10-17', [at('17T00:00'), at('17T00:02')]);
  const result = build(s, { symbols: ['DOGE'], from: '2025-10', to: '2025-10' });
  assert.equal(result.status, 'ok');
  const [holdout, research] = readManifest(s.manifestPath).entries;
  assert.deepEqual([research.sources.map(x => x.file), holdout.sources.map(x => x.file)], [[d16.source.file, monthly.file], [d17.source.file, monthly.file]]);
  assert.deepEqual([research.filledRanges, holdout.filledRanges], [[{ start: '2025-10-16T23:59:00.000Z', end: '2025-10-17T00:00:00.000Z' }], [{ start: '2025-10-17T00:00:00.000Z', end: '2025-10-17T00:01:00.000Z' }]]);
  const rule = 'high below max(open, close)';
  assert.deepEqual([research.quarantinedRows, holdout.quarantinedRows], [[{ file: monthly.file, openTime: '2025-10-16T23:58:00.000Z', rule }], [{ file: monthly.file, openTime: '2025-10-17T00:01:00.000Z', rule }]]);
  assert.deepEqual(result.coverage[0].quarantine, { sourceRows: 2, uniqueMinutes: 2, rows: [...research.quarantinedRows, ...holdout.quarantinedRows] });
  assert.deepEqual([result.coverage[0].dailyFill.filledMinutes, result.coverage[0].dailyFill.sources], [2, [d16.source.file, d17.source.file]]);
});

test('F1a-2 r5 store: fill sets and common entries are byte-identical for narrow and broad selections, reversed enumeration and a warm rerun', () => {
  const fill = s => {
    put(s, 'BTC', '2024-01', fourRows('2024-01').filter((_, i) => i !== 1));
    putDaily(s, 'BTC', '2024-01-03', fourRows('2024-01'));
    put(s, 'BTC', '2024-02', fourRows('2024-02')); put(s, 'SOL', '2024-01', fourRows('2024-01')); put(s, 'SOL', '2024-02', fourRows('2024-02'));
  };
  const broad = store(), narrow = store(), reversed = store();
  [broad, narrow, reversed].forEach(fill);
  assert.equal(build(broad, { symbols: ['BTC', 'SOL'], from: '2024-01', to: '2024-02' }).status, 'ok');
  for (const month of ['2024-02', '2024-01']) assert.equal(build(narrow, { symbols: ['BTC', 'SOL'], from: month, to: month }).status, 'ok');
  for (const symbol of ['SOL', 'BTC']) assert.equal(build(reversed, { symbols: [symbol], from: '2024-01', to: '2024-02' }).status, 'ok');
  assert.deepEqual(bytesOf(narrow), bytesOf(broad));
  assert.deepEqual(bytesOf(reversed), bytesOf(broad));
  assert.deepEqual(readManifest(broad.manifestPath).entries[0].filledRanges, [{ start: '2024-01-03T00:01:00.000Z', end: '2024-01-03T00:02:00.000Z' }]);
  const before = bytesOf(broad);
  const warm = build(broad, { symbols: ['BTC', 'SOL'], from: '2024-01', to: '2024-02' });
  assert.deepEqual(warm.counts, { units: 4, built: 0, unchanged: 4, empty: 0, missing: 0, notListed: 0, failed: 0 });
  assert.deepEqual(bytesOf(broad), before);
});

test('F1a-2 r5 store: firstSourceFile is the base source when a fill daily sorts first', () => {
  const s = store();
  put(s, 'ETH', '2024-01', fourRows('2024-01').slice(1));
  putDaily(s, 'ETH', '2024-01-03', fourRows('2024-01'));
  const result = build(s, { symbols: ['ETH'], from: '2024-01', to: '2024-01' });
  assert.equal(readManifest(s.manifestPath).entries[0].sources[0].file, dayFile('ETHUSDT', '2024-01-03'));
  assert.equal(result.coverage[0].firstSourceFile, sourceOf('ETH', '2024-01').file);
  assert.equal(build(store(), { symbols: ['ETH'], from: '2024-01', to: '2024-01' }).coverage[0].firstSourceFile, null);
});

test('F1a-2 r5 store: 2026-10 base dailies record quarantine, get no fill sources and filledRanges []; a corrupt daily outranks a missing one', () => {
  const s = store();
  const days = planUnits('XRP', { from: '2026-10', to: '2026-10' })[0].sources;
  days.forEach(d => putDaily(s, 'XRP', iso10(d.startMs), [], { csv: csvRows(minutes(new Date(d.startMs).toISOString(), 2).map((x, i) => klineRow(x, d.file.endsWith('05.zip') && !i ? BAD : {}))) }));
  const result = build(s, { symbols: ['XRP'], from: '2026-10', to: '2026-10' });
  assert.equal(result.status, 'ok');
  const [entry] = readManifest(s.manifestPath).entries;
  assert.deepEqual([entry.sources.length, entry.filledRanges, entry.rowCount], [16, [], 31]);
  assert.deepEqual(entry.quarantinedRows, [{ file: days[4].file, openTime: '2026-10-05T00:00:00.000Z', rule: 'high below max(open, close)' }]);
  assert.deepEqual(result.coverage[0].dailyFill, { filledMinutes: 0, sources: [], unavailable: [] });
  // Day 3 corrupt and day 16 absent: failed, not missing.
  const t = store();
  const present = days.slice(0, 15).map(d => putDaily(t, 'XRP', iso10(d.startMs), minutes(new Date(d.startMs).toISOString(), 2)));
  const third = zipPathOf(t, days[2], present[2].sha256);
  fs.chmodSync(third, 0o644); const b = fs.readFileSync(third); b[b.length - 30] ^= 1; fs.writeFileSync(third, b);
  const corrupt = build(t, { symbols: ['XRP'], from: '2026-10', to: '2026-10' });
  assert.equal(corrupt.status, 'failed');
  assert.match(corrupt.failures[0].reason, /sha256 mismatch/);
});
const iso10 = ms => new Date(ms).toISOString().slice(0, 10);

test('F1a-2 r5 store: build report per symbol: quarantined source rows, unique minutes, filled minutes, fill sources and unavailable days', () => {
  const s = store();
  const t = minutes('2024-01-03T00:00:00.000Z', 3);
  const { source: monthly } = put(s, 'BTC', '2024-01', [], { csv: csvRows([klineRow(t[0]), klineRow(t[1], BAD)]) });
  const day3 = putDaily(s, 'BTC', '2024-01-03', [], { csv: csvRows([klineRow(t[0]), klineRow(t[1], { volume: '-1' }), klineRow(t[2])]) });
  const result = build(s, JAN);
  assert.equal(result.status, 'ok');
  const iso = x => new Date(x).toISOString();
  assert.deepEqual(result.coverage[0].quarantine, { sourceRows: 2, uniqueMinutes: 1, rows: [
    { file: day3.source.file, openTime: iso(t[1]), rule: 'volume must be >= 0' }, { file: monthly.file, openTime: iso(t[1]), rule: 'high below max(open, close)' }] });
  assert.deepEqual(result.coverage[0].dailyFill, { filledMinutes: 1, sources: [day3.source.file], unavailable: monthDays('2024-01', 31).filter(d => d !== '2024-01-03').map(d => dayFile('BTCUSDT', d)) });
});

test('F1a-2 r5 store: holdout records, fill reports and every diagnostic path (mismatch, valid/quarantined, over-cap) contain no values', () => {
  const quarantined = { open: '187.4321', high: '187.1234', low: '186.9876', close: '187.0001' }, valid = { ...quarantined, high: '187.9999' };
  const t = minutes('2026-01-05T00:00:00.000Z', 3);
  const monthly = s => put(s, 'SOL', '2026-01', [], { csv: csvRows([klineRow(t[0], valid), klineRow(t[2], valid)]) });
  const cases = [
    ['mismatch', 'failed', /sources disagree at 2026-01-05T00:00:00.000Z/, s => putDaily(s, 'SOL', '2026-01-05', [], { csv: csvRows([klineRow(t[0], { ...valid, close: '187.0002' })]) })],
    ['valid/quarantined', 'failed', /quarantined row .* at 2026-01-05T00:00:00.000Z/, s => putDaily(s, 'SOL', '2026-01-05', [], { csv: csvRows([klineRow(t[0], quarantined)]) })],
    ['over-cap', 'failed', /more than 10 quarantined rows/, s => putDaily(s, 'SOL', '2026-01-06', [], { csv: csvRows(minutes('2026-01-06T00:00:00.000Z', 11).map(x => klineRow(x, quarantined))) })],
    ['filled', 'ok', /2026-01-05T00:01:00.000Z/, s => putDaily(s, 'SOL', '2026-01-05', [], { csv: csvRows([klineRow(t[0], valid), klineRow(t[1], valid), klineRow(t[2], valid),
      klineRow(Date.parse('2026-01-05T00:03:00.000Z'), quarantined)]) })]];
  for (const [name, status, pattern, daily] of cases) {
    const s = store();
    monthly(s); daily(s);
    const result = build(s, { symbols: ['SOL'], from: '2026-01', to: '2026-01' });
    assert.equal(result.status, status, name);
    const text = JSON.stringify([result, fs.existsSync(s.manifestPath) ? fs.readFileSync(s.manifestPath, 'utf8') : '']);
    assert.match(text, pattern, name);
    assert.doesNotMatch(text, /187\.|186\./, name);
  }
});

test('F1a-2 r5 store: the memory guard is checked before and after each parse, the merge and the assembly and before every write; a trip at a fill load aborts the build and publishes nothing', () => {
  const setup = () => {
    const s = store();
    const { source } = put(s, 'BTC', '2024-01', fourRows('2024-01').filter((_, i) => i !== 1));
    return { s, source, day3: putDaily(s, 'BTC', '2024-01-03', fourRows('2024-01')).source };
  };
  const { s, source, day3 } = setup();
  const labels = [];
  assert.equal(build(s, { ...JAN, guard: { check(label) { labels.push(label); } } }).status, 'ok');
  const unit = 'BTCUSDT 2024-01-01T00:00:00.000Z';
  assert.deepEqual(labels, [unit, `parse ${source.file}`, `parsed ${source.file}`, `parse ${day3.file}`, `parsed ${day3.file}`, `merge ${day3.file}`, `assemble ${unit}`, `encode ${unit}`, `${unit} write`]);
  labels.length = 0;
  assert.equal(build(s, { ...JAN, guard: { check(label) { labels.push(label); } } }).counts.unchanged, 1);
  assert.equal(labels.at(-1), `${unit} write`);
  const tripped = setup();
  const result = build(tripped.s, { ...JAN, guard: { check(label) { if (label === `parse ${tripped.day3.file}`) throw new Error('memory ceiling exceeded: 600 MiB > 512 MiB'); } } });
  assert.equal(result.status, 'failed');
  assert.match(result.error, /memory ceiling/);
  assert.deepEqual([files(tripped.s.cacheDir), fs.existsSync(tripped.s.manifestPath), fs.existsSync(`${tripped.s.manifestPath}.lock`)], [[], false, false]);
});

test('F1a-2 r5 store: a fill daily published after a build changes the sources: the rebuild fails with "uses other source versions" and leaves the store untouched', () => {
  const s = store();
  put(s, 'BTC', '2024-01', fourRows('2024-01'));
  assert.equal(build(s, JAN).status, 'ok');
  const before = bytesOf(s);
  putDaily(s, 'BTC', '2024-01-20', minutes('2024-01-20T00:00:00.000Z', 2));
  const result = build(s, JAN);
  assert.equal(result.status, 'failed');
  assert.equal(result.failures[0].reason, 'the manifest entry for this unit uses other source versions (version selection rule pending)');
  assert.deepEqual(bytesOf(s), before);
});

// verify and compare (contract amendment round 5, F8 and Q5; plan approval points 6 and 8).
function filledJanuary() {
  const s = store();
  const t = minutes('2024-01-03T00:00:00.000Z', 4);
  const month = put(s, 'BTC', '2024-01', [t[0], t[3]]);
  const day3 = putDaily(s, 'BTC', '2024-01-03', t);
  assert.equal(build(s, JAN).status, 'ok');
  return { s, month, day3 };
}
const compareJanuary = s => compareStore({ zipRoot: s.zipRoot, manifestPath: s.manifestPath, symbols: ['BTC'], from: '2024-01', to: '2024-01' });

test('F1a-2 r5 store: verify checks every referenced source (unique file and sha256 pairs) and fails on a deleted referenced zip, monthly or fill daily, and on tampered new fields', () => {
  const { s, month, day3 } = filledJanuary();
  const ok = verifyStore(s);
  assert.equal(ok.status, 'ok');
  assert.deepEqual(ok.counts, { zips: 2, entries: 1, orphans: 0, sources: 2 });
  for (const gone of [day3, month]) {
    const t = filledJanuary();
    const victim = gone === day3 ? t.day3 : t.month;
    fs.rmSync(path.dirname(zipPathOf(t.s, victim.source, victim.sha256)), { recursive: true });
    const verified = verifyStore(t.s);
    assert.equal(verified.status, 'failed');
    assert.deepEqual(verified.failures, [`source ${victim.source.file}@${victim.sha256} of BTCUSDT research 2024-01-01T00:00:00.000Z: not a verified local version`]);
  }
  const tampered = JSON.parse(fs.readFileSync(s.manifestPath, 'utf8'));
  tampered.entries[0].filledRanges = [{ start: '2024-01-03T00:01:00.000Z', end: '2024-01-03T00:02:00.000Z' }, { start: '2024-01-03T00:02:00.000Z', end: '2024-01-03T00:03:00.000Z' }];
  fs.writeFileSync(s.manifestPath, JSON.stringify(tampered, null, 2) + '\n');
  assert.match(verifyStore(s).failures.join('\n'), /filledRanges/);
  // The two 2025-10 units share their monthly file: one pair.
  const split = store();
  put(split, 'DOGE', '2025-10', minutes('2025-10-16T23:58:00.000Z', 4));
  assert.equal(build(split, { symbols: ['DOGE'], from: '2025-10', to: '2025-10' }).status, 'ok');
  assert.deepEqual(verifyStore(split).counts, { zips: 1, entries: 2, orphans: 0, sources: 1 });
});

test('F1a-2 r5 store: compare matches a filled unit and reports mismatched when the reference lists a fill daily that is unavailable locally, or misses one published since', () => {
  const { s, day3 } = filledJanuary();
  const ok = compareJanuary(s);
  assert.deepEqual([ok.status, ok.counts.matched], ['ok', 1]);
  assert.deepEqual(ok.coverage[0].dailyFill.sources, [day3.source.file]);
  // The reference lists daily 01-03; locally it is gone and its 404 marker remains: the rebuild differs.
  fs.rmSync(path.dirname(zipPathOf(s, day3.source, day3.sha256)), { recursive: true });
  const lost = compareJanuary(s);
  assert.deepEqual([lost.status, lost.counts.mismatched, lost.mismatches], ['failed', 1, [`${JSON.stringify({ contract: 'BTCUSDT', dataEnd: '2024-02-01T00:00:00.000Z', dataStart: '2024-01-01T00:00:00.000Z', period: 'research' })}: entry differs`]]);
  // A daily published after the build (01-20, unavailable then): the rebuild lists it, so it differs too.
  const late = filledJanuary();
  putDaily(late.s, 'BTC', '2024-01-20', minutes('2024-01-20T00:00:00.000Z', 2));
  assert.deepEqual([compareJanuary(late.s).status, compareJanuary(late.s).counts.mismatched], ['failed', 1]);
});

test('F1a-2 r5 store: compare: a fill daily without version and marker is a missing input (exit 1)', () => {
  const { s, day3 } = filledJanuary();
  fs.rmSync(path.dirname(zipPathOf(s, day3.source, day3.sha256)), { recursive: true });
  fs.rmSync(path.join(s.zipRoot, path.dirname(day3.source.file), '404', day3.source.zipName));
  const result = compareJanuary(s);
  assert.equal(result.status, 'failed');
  assert.deepEqual([result.counts.missingInput, result.missingInputs], [1, [{ file: day3.source.file }]]);
});

test('F1a-2 r5 store: unavailable fill days derived from the entry alone: monthly bases only, half-open day projection, deduplicated and sorted', () => {
  const r = (start, end) => ({ start: `${start}:00.000Z`, end: `${end}:00.000Z` });
  const jan = { contract: 'BTCUSDT', exchange: 'binance', market: 'linear_perpetual', period: 'research', dataStart: '2024-01-01T00:00:00.000Z', dataEnd: '2024-02-01T00:00:00.000Z',
    sources: [{ file: dayFile('BTCUSDT', '2024-01-05'), sha256: 'a'.repeat(64) }, { file: sourceOf('BTC', '2024-01').file, sha256: 'b'.repeat(64) }] };
  const derive = (over) => entryDailyFill({ ...jan, missingRanges: [], filledRanges: [], ...over });
  // A fully filled day (01-05, its daily present), a range ending at midnight (01-07 only), two ranges in one day (01-09 once).
  assert.deepEqual(derive({ filledRanges: [r('2024-01-05T00:00', '2024-01-06T00:00')], missingRanges: [r('2024-01-07T12:00', '2024-01-08T00:00'), r('2024-01-09T01:00', '2024-01-09T02:00'),
    r('2024-01-09T05:00', '2024-01-09T06:00')] }), { filledMinutes: 1440, sources: [dayFile('BTCUSDT', '2024-01-05')], unavailableAtBuild: [dayFile('BTCUSDT', '2024-01-07'), dayFile('BTCUSDT', '2024-01-09')] });
  // The 2025-10-17 boundary: each unit only its own days.
  const oct = { ...jan, sources: [{ file: sourceOf('BTC', '2025-10').file, sha256: 'b'.repeat(64) }], filledRanges: [] };
  assert.deepEqual(entryDailyFill({ ...oct, dataStart: '2025-10-01T00:00:00.000Z', dataEnd: '2025-10-17T00:00:00.000Z', missingRanges: [r('2025-10-16T23:55', '2025-10-17T00:00')] }).unavailableAtBuild,
    [dayFile('BTCUSDT', '2025-10-16')]);
  assert.deepEqual(entryDailyFill({ ...oct, period: 'holdout', dataStart: '2025-10-17T00:00:00.000Z', dataEnd: '2025-11-01T00:00:00.000Z', missingRanges: [r('2025-10-17T00:00', '2025-10-17T00:05')] }).unavailableAtBuild,
    [dayFile('BTCUSDT', '2025-10-17')]);
  // HYPE 2025-05: the present daily of 05-30 fills nothing; 05-01..29 were unavailable.
  const hype = entryDailyFill({ contract: 'HYPEUSDT', exchange: 'binance', market: 'linear_perpetual', period: 'research', dataStart: '2025-05-01T00:00:00.000Z', dataEnd: '2025-06-01T00:00:00.000Z',
    missingRanges: [r('2025-05-01T00:00', '2025-05-30T10:30')], filledRanges: [],
    sources: [{ file: dayFile('HYPEUSDT', '2025-05-30'), sha256: 'a'.repeat(64) }, { file: sourceOf('HYPE', '2025-05').file, sha256: 'b'.repeat(64) }] });
  assert.deepEqual(hype, { filledMinutes: 0, sources: [dayFile('HYPEUSDT', '2025-05-30')], unavailableAtBuild: monthDays('2025-05', 29).map(d => dayFile('HYPEUSDT', d)) });
  // 2026-10 is built from base dailies: missing minutes, but no fill sources and no unavailable days.
  const days = planUnits('BTC', { from: '2026-10', to: '2026-10' })[0].sources.map(x => ({ file: x.file, sha256: 'c'.repeat(64) }));
  assert.deepEqual(entryDailyFill({ ...jan, period: 'holdout', dataStart: '2026-10-01T00:00:00.000Z', dataEnd: '2026-10-17T00:00:00.000Z', missingRanges: [r('2026-10-05T00:00', '2026-10-06T00:00')], filledRanges: [], sources: days }),
    { filledMinutes: 0, sources: [], unavailableAtBuild: [] });
});

// Review round 6: the first and last candle of an entry follow from its missingRanges (plan approval point 7).
test('F1a-2 r6 store: readManifest rejects a firstOpenTime or lastOpenTime outside the unit, reversed, inside a missing range, or not the first or last present minute', () => {
  const { s, entry } = builtJanuary(); // present 2024-01-03T00:00..00:03; missing before and after
  assert.deepEqual([entry.firstOpenTime, entry.lastOpenTime], ['2024-01-03T00:00:00.000Z', '2024-01-03T00:03:00.000Z']);
  const reject = rejects(s, entry), at = t => `2024-01-${t}:00.000Z`;
  for (const [over, pattern] of [
    [{ firstOpenTime: '2023-12-31T23:59:00.000Z' }, /firstOpenTime lies outside its unit/], [{ firstOpenTime: '2024-02-01T00:00:00.000Z' }, /firstOpenTime lies outside its unit/],
    [{ lastOpenTime: '2024-02-01T00:00:00.000Z' }, /lastOpenTime lies outside its unit/], [{ lastOpenTime: '2023-12-31T23:59:00.000Z' }, /lastOpenTime lies outside its unit/],
    [{ firstOpenTime: at('03T00:03'), lastOpenTime: at('03T00:00') }, /firstOpenTime must be the first present minute/],
    [{ firstOpenTime: at('02T00:00') }, /firstOpenTime lies in a missing range/], [{ lastOpenTime: at('10T00:00') }, /lastOpenTime lies in a missing range/],
    [{ firstOpenTime: at('03T00:01') }, /firstOpenTime must be the first present minute/], [{ lastOpenTime: at('03T00:02') }, /lastOpenTime must be the last present minute/]]) {
    reject(over, pattern);
  }
  writeEntries(s, [{ ...entry, firstOpenTime: at('03T00:01') }]);
  try { readManifest(s.manifestPath); assert.fail('expected a rejection'); }
  catch (error) { assert.match(error.message, /^1m manifest: entry BTCUSDT research 2024-01-01T00:00:00.000Z: /); assert.doesNotMatch(error.message, /4233|4231|4228/); }
});

test('F1a-2 r6 store: readManifest accepts the first and last candle derived from missingRanges: leading (the HYPE 2025-05 shape), trailing, both, none', () => {
  const s = store();
  fs.mkdirSync(path.dirname(s.manifestPath), { recursive: true });
  const m = (start, end) => ({ start: `${start}:00.000Z`, end: `${end}:00.000Z` });
  const unit = (contract, month, days, over) => ({ bytes: 1, contract, dataEnd: '', dataStart: `${month}-01T00:00:00.000Z`, exchange: 'binance', filledRanges: [], market: 'linear_perpetual',
    period: 'research', quarantinedRows: [], schemaVersion: 1, sha256: 'd'.repeat(64), source: 'binance-vision-archive', ...over,
    rowCount: days * 1440 - (over.missingMinutes ?? 0), missingMinutes: over.missingMinutes ?? 0 });
  const hype = unit('HYPEUSDT', '2025-05', 31, { dataEnd: '2025-06-01T00:00:00.000Z', missingMinutes: 42390, missingRanges: [m('2025-05-01T00:00', '2025-05-30T10:30')],
    firstOpenTime: '2025-05-30T10:30:00.000Z', lastOpenTime: '2025-05-31T23:59:00.000Z', sources: [{ file: sourceOf('HYPE', '2025-05').file, sha256: 'e'.repeat(64) }] });
  const jan = over => unit('BTCUSDT', '2024-01', 31, { dataEnd: '2024-02-01T00:00:00.000Z', sources: [{ file: sourceOf('BTC', '2024-01').file, sha256: 'e'.repeat(64) }], ...over });
  const accepted = [hype,
    jan({ missingMinutes: 12 * 1440, missingRanges: [m('2024-01-20T00:00', '2024-02-01T00:00')], firstOpenTime: '2024-01-01T00:00:00.000Z', lastOpenTime: '2024-01-19T23:59:00.000Z' }),
    jan({ missingMinutes: 2 * 1440, missingRanges: [m('2024-01-01T00:00', '2024-01-02T00:00'), m('2024-01-31T00:00', '2024-02-01T00:00')], firstOpenTime: '2024-01-02T00:00:00.000Z', lastOpenTime: '2024-01-30T23:59:00.000Z' }),
    jan({ missingMinutes: 0, missingRanges: [], firstOpenTime: '2024-01-01T00:00:00.000Z', lastOpenTime: '2024-01-31T23:59:00.000Z' }),
    jan({ missingMinutes: 1440, missingRanges: [m('2024-01-10T00:00', '2024-01-11T00:00')], firstOpenTime: '2024-01-01T00:00:00.000Z', lastOpenTime: '2024-01-31T23:59:00.000Z' })];
  for (const entry of accepted) {
    writeEntries(s, [entry]);
    assert.deepEqual(readManifest(s.manifestPath).entries, [entry], entry.contract);
  }
  rejects(s, hype)({ firstOpenTime: '2025-05-30T10:29:00.000Z' }, /firstOpenTime lies in a missing range/);
  rejects(s, hype)({ firstOpenTime: '2025-05-30T10:31:00.000Z' }, /firstOpenTime must be the first present minute/);
});
