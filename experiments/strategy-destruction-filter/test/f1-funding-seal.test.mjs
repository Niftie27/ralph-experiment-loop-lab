// Amendment 2 regressions. Every archive and transport response is synthetic.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import * as funding from '../src/f1-funding.mjs';
import { checksumText } from '../test-support/vision-fixtures.mjs';
import { RATE, MARK, at, MONTHS, HOLDOUT, start, end, sourceOf, rows, csv, fullRows, without, workspace, putBytes, put,
  storeAll, storedFile, missingResearch, FULL, cli, stableCli, failedUnits } from '../test-support/funding-seal-fixtures.mjs';

const verify = zipRoot => funding.verifyFunding({ symbols: ['BTC'], zipRoot });
const integrity = (zipRoot, symbols = ['BTC'], guard) => funding.integrityFunding({ symbols, zipRoot, guard });
const read = zipRoot => funding.openResearchFunding({ zipRoot }).read(FULL);
const sealedError = source => `Vision funding: ${source.file}: sealed part fails`;
const noHoldoutTimes = result => assert.ok(!(JSON.stringify(result).match(/\d{4}-\d\d-\d\dT[^" ]+/g) ?? []).some(t => t >= '2025-10-17'));

test('F1 research listing ignores a holdout file, including an invalid CHECKSUM', t => {
  const variants = [workspace(t), workspace(t), workspace(t)];
  for (const w of variants) missingResearch(w.zipRoot);
  put(variants[1].zipRoot, '2025-11');
  const corrupted = put(variants[2].zipRoot, '2025-11');
  fs.unlinkSync(`${corrupted.file}.CHECKSUM`);
  fs.writeFileSync(`${corrupted.file}.CHECKSUM`, 'corrupt CHECKSUM\n');
  const summaries = variants.map(w => verify(w.zipRoot));
  for (const summary of summaries) {
    assert.equal(summary.status, 'incomplete');
    assert.equal(summary.symbols[0].gaps.length, 49);
    assert.equal(summary.symbols[0].notListed.length, 0);
  }
  assert.deepEqual(summaries[1], summaries[0]);
  assert.deepEqual(summaries[2], summaries[0]);
  const reads = variants.map(w => read(w.zipRoot));
  assert.deepEqual(reads[1], reads[0]);
  assert.deepEqual(reads[2], reads[0]);
});

const prefix = rows(start('2025-10'), at('2025-10-17T00:00:00Z'));
const sealed = `${at('2025-10-17T08:00:00Z') + 1},8,${RATE}`;
const sealedLater = `${at('2025-10-17T16:00:00Z') + 1},8,${RATE}`;
const malformed = `x${MARK},8,${MARK}`;
const suffixes = [
  ['unreadable before a sealed row', csv([...prefix, malformed])],
  ['unreadable after a sealed row', csv([...prefix, sealed, malformed])],
  ['September before a sealed row', csv([...prefix, `${start('2025-09') + 1},8,${RATE}`])],
  ['September after a sealed row', csv([...prefix, sealed, `${start('2025-09') + 1},8,${RATE}`])],
  ['November', csv([...prefix, `${start('2025-11') + 1},8,${RATE}`])],
  ['decreasing', csv([...prefix, sealedLater, sealed])],
  ['duplicate sealed calc_time', csv([...prefix, sealed, sealed])],
  ['research row after a sealed row', csv([...prefix, sealed, prefix.at(-1)])],
  ['research disorder', csv([prefix[1], prefix[0]])],
  ['research duplicate', csv([prefix[0], prefix[0]])],
  ['no final newline', csv([...prefix, sealed]).subarray(0, -1)],
  ['malformed headerless first calc_time', Buffer.from(`${malformed}\n`)],
  ['bad header', Buffer.from(`wrong_header\n${sealed}\n`)],
];
for (const [name, bytes] of suffixes) test(`F2 one public sealed-part message: ${name}`, t => {
  const w = workspace(t), source = sourceOf('2025-10');
  putBytes(w.zipRoot, '2025-10', bytes);
  const expected = sealedError(source);
  assert.throws(() => funding.parseFunding(bytes, source), { message: expected });
  assert.equal(verify(w.zipRoot).symbols[0].failures[0].error, expected);
  assert.throws(() => read(w.zipRoot), { message: expected });
});

test('F2 research row diagnostics and other months retain their detailed messages', t => {
  const w = workspace(t);
  putBytes(w.zipRoot, '2025-10', csv([`${start('2025-10') + 1},3,${RATE}`]));
  assert.equal(verify(w.zipRoot).symbols[0].failures[0].error, `Vision funding: ${sourceOf('2025-10').file}: row 2: interval not one of 1, 2, 4, 8`);
  const s = sourceOf('2024-03');
  assert.throws(() => funding.parseFunding(csv(fullRows('2024-03')).subarray(0, -1), s), /does not end with a newline/);
});

for (const options of [{ declaredSize: 7 }, { crc: 1 }, { centralName: 'wrong.csv' }]) test(`M1 mixed-file zip error is fixed: ${JSON.stringify(options)}`, t => {
  const w = workspace(t), data = csv([...prefix, sealed]);
  const { source, zip } = putBytes(w.zipRoot, '2025-10', data, options);
  assert.equal(verify(w.zipRoot).symbols[0].failures[0].error, sealedError(source));
  assert.throws(() => read(w.zipRoot), { message: sealedError(source) });
  assert.throws(() => funding.parseFundingZip(zip, checksumText(zip, source.zipName), source), { message: sealedError(source) });
  const other = workspace(t);
  putBytes(other.zipRoot, '2024-03', csv(fullRows('2024-03')), options);
  const detailed = verify(other.zipRoot).symbols[0].failures[0].error;
  assert.ok(!detailed.includes('sealed part'));
  if (options.declaredSize) assert.match(detailed, /uncompressed size .* != declared 7/);
});

test('F5 request and instrument accessors are snapshotted exactly once', t => {
  const w = workspace(t);
  storeAll(w.zipRoot);
  const reader = funding.openResearchFunding({ zipRoot: w.zipRoot }), expected = reader.read(FULL);
  const counts = {}, instrument = {}, request = {};
  const property = (object, name, first, second) => Object.defineProperty(object, name, { enumerable: true, get() {
    counts[name] = (counts[name] ?? 0) + 1;
    return counts[name] === 1 ? first : second;
  } });
  for (const [k, v] of Object.entries(FULL.instrument)) property(instrument, k, v, 'changed');
  property(request, 'instrument', instrument, {});
  property(request, 'dataStart', FULL.dataStart, 'changed');
  property(request, 'dataEnd', FULL.dataEnd, 'changed');
  const actual = reader.read(request);
  assert.deepEqual(actual.instrument, FULL.instrument);
  assert.equal(Object.getPrototypeOf(actual.instrument), Object.prototype);
  assert.equal(actual.digest, expected.digest);
  assert.deepEqual(counts, { instrument: 1, dataStart: 1, dataEnd: 1, exchange: 1, market: 1, contract: 1 });
});

// Spy on actual file opens, including CHECKSUM reads, while leaving directory enumeration available.
async function watchReads(run) {
  const seen = [], saved = { readFileSync: fs.readFileSync, openSync: fs.openSync };
  for (const name of Object.keys(saved)) fs[name] = function(file, ...args) { seen.push(String(file)); return saved[name].call(this, file, ...args); };
  try { return { value: await run(), seen }; } finally { Object.assign(fs, saved); }
}
const holdoutPath = p => /fundingRate-202(?:5-(?:11|12)|6-\d\d)\.zip(?:\.CHECKSUM)?$/.test(p);

test('N1 verify opens no holdout month file and ignores poisoned or unreadable archives', async t => {
  const w = workspace(t);
  storeAll(w.zipRoot);
  const labels = [], observed = [];
  for (const variant of ['clean', 'poisoned', 'directories']) {
    if (variant !== 'clean') for (const m of MONTHS.filter(m => m > '2025-10')) {
      const file = storedFile(w.zipRoot, m);
      fs.unlinkSync(file);
      if (variant === 'directories') fs.mkdirSync(file);
      else {
        fs.unlinkSync(`${file}.CHECKSUM`);
        put(w.zipRoot, m, [`${start(m) + 1},3,${MARK}`, ...fullRows(m).slice(2)]);
      }
    }
    const record = await watchReads(async () => {
      const library = funding.verifyFunding({ symbols: ['BTC'], zipRoot: w.zipRoot, guard: { check: label => labels.push(label) } });
      const command = await cli(funding.main, 'verify', w);
      return { library, command: { code: command.code, summary: stableCli(command.summary) } };
    });
    assert.ok(record.seen.every(p => !holdoutPath(p)), record.seen.filter(holdoutPath).join('\n'));
    assert.ok(!Object.hasOwn(record.value.library.symbols[0], 'holdout'));
    observed.push(record.value);
  }
  assert.deepEqual(observed[1], observed[0]);
  assert.deepEqual(observed[2], observed[0]);
  assert.ok(labels.every(l => !l.startsWith('holdout')));
});

test('N2 verify status and exit code use only research inputs', async t => {
  const clean = workspace(t), gap = workspace(t);
  storeAll(clean.zipRoot, { '2025-11': [`${start('2025-11') + 1},3,${MARK}`] });
  storeAll(gap.zipRoot, { '2024-05': null });
  assert.deepEqual([verify(clean.zipRoot).status, (await cli(funding.main, 'verify', clean)).code], ['ok', 0]);
  assert.deepEqual([verify(gap.zipRoot).status, (await cli(funding.main, 'verify', gap)).code], ['incomplete', 3]);
});

test('N3 integrity clean history keeps the four-field A1 output (moved clean holdout assertion)', t => {
  const w = workspace(t);
  storeAll(w.zipRoot);
  const r = integrity(w.zipRoot), [b] = r.symbols;
  assert.deepEqual([r.command, r.status, b.contract, b.research], ['integrity', 'ok', 'BTCUSDT', 'ok']);
  assert.deepEqual(b.holdout, HOLDOUT.map(unit => ({ unit, available: true, checksum: 'verified', result: 'pass' })));
  assert.deepEqual(Object.keys(b).sort(), ['contract', 'holdout', 'research']);
  noHoldoutTimes(r);
});

test('N3 integrity failures name only the unit; boundary, empty and missing units (moved holdout assertions)', t => {
  const w = workspace(t);
  storeAll(w.zipRoot, { '2026-02': without(fullRows('2026-02'), '2026-02-11T08:00:00Z'), '2026-06': [], '2026-09': null });
  const r = integrity(w.zipRoot), [b] = r.symbols;
  assert.equal(r.status, 'failed');
  assert.deepEqual(failedUnits(b), ['2026-02', '2026-06', '2026-07', '2026-09']);
  assert.deepEqual(b.holdout.find(u => u.unit === '2026-09'), { unit: '2026-09', available: false, checksum: 'not checked', result: 'fail' });
  assert.ok(!JSON.stringify(r).includes('2026-02-'));
  noHoldoutTimes(r);
  const boundary = workspace(t);
  storeAll(boundary.zipRoot, { '2025-10': without(fullRows('2025-10'), '2025-10-17T00:00:00Z') });
  assert.deepEqual(failedUnits(integrity(boundary.zipRoot).symbols[0]), ['2025-10 sealed part']);
});

test('N3 integrity sealed poison fails that unit and the next (moved holdout assertions)', t => {
  const w = workspace(t);
  storeAll(w.zipRoot, { '2025-10': [...prefix, `${at('2025-10-17T00:00:00Z') + 2},${MARK},${MARK}`, ...rows(at('2025-10-17T08:00:00Z'), end('2025-10'))] });
  const r = integrity(w.zipRoot);
  assert.equal(r.status, 'failed');
  assert.deepEqual(failedUnits(r.symbols[0]), ['2025-10 sealed part', '2025-11']);
  assert.ok(!JSON.stringify(r).includes('7777'));
  noHoldoutTimes(r);
});

test('N3 integrity second holdout version fails on clean research (moved version assertion)', t => {
  const w = workspace(t);
  storeAll(w.zipRoot);
  put(w.zipRoot, '2026-01', rows(start('2026-01') + 1, end('2026-01')));
  assert.ok(failedUnits(integrity(w.zipRoot).symbols[0]).includes('2026-01'));
});

test('N4 integrity checks every requested research history before opening any holdout archive', async t => {
  const w = workspace(t), labels = [];
  storeAll(w.zipRoot);
  storeAll(w.zipRoot, { '2024-05': null, '2025-11': [`${start('2025-11') + 1},3,${MARK}`] }, 'ETH');
  const { value, seen } = await watchReads(() => integrity(w.zipRoot, ['BTC', 'ETH'], { check: label => labels.push(label) }));
  assert.equal(value.status, 'blocked');
  assert.deepEqual(value.symbols, [{ contract: 'BTCUSDT', research: 'ok' }, { contract: 'ETHUSDT', research: 'incomplete' }]);
  assert.ok(seen.every(p => !holdoutPath(p)));
  assert.ok(labels.every(l => !l.startsWith('holdout')));
  const command = await cli(funding.main, 'integrity', { ...w, args: [...w.args, '--max-rss-mib', '512'].map(v => v === 'BTC' ? 'BTC,ETH' : v) });
  assert.deepEqual([command.code, command.summary.status], [1, 'blocked']);
});

test('N4 integrity also blocks on research failures and stops, including the old trailing-edge fixture', t => {
  for (const [name, overrides, expected] of [
    ['trailing edge', { '2025-10': rows(start('2025-10'), at('2025-10-16T16:00:00Z')).concat(rows(at('2025-10-17T00:00:00Z'), end('2025-10'))) }, 'stopped'],
    ['failed research', { '2024-03': [`${start('2024-03') + 1},3,${RATE}`] }, 'failed'],
  ]) {
    const w = workspace(t);
    storeAll(w.zipRoot, overrides);
    const r = integrity(w.zipRoot);
    assert.deepEqual([r.status, r.symbols], ['blocked', [{ contract: 'BTCUSDT', research: expected }]], name);
  }
});

test('N5 integrity CLI exits 0 for clean, 1 for failed unit, 2 for usage', async t => {
  for (const [overrides, code] of [[{}, 0], [{ '2026-03': [] }, 1]]) {
    const w = workspace(t);
    storeAll(w.zipRoot, overrides);
    assert.equal((await cli(funding.main, 'integrity', w)).code, code);
  }
  let out = '';
  assert.equal(await funding.main(['integrity', '--unknown', 'x'], { stdout: { write: s => { out += s; } } }), 2);
  assert.equal(JSON.parse(out).status, 'usage');
});

test('F4 integrity guard trips use fixed text; research guard diagnostics remain detailed', async t => {
  const w = workspace(t);
  storeAll(w.zipRoot);
  for (const [phase, expected] of [['holdout', 'holdout integrity: memory guard tripped'], ['research', 'injected 123 MiB at research']]) {
    const r = await cli(funding.main, 'integrity', w, { check(label) { if (label.startsWith(phase)) throw new Error(`injected 123 MiB at ${phase}`); } });
    assert.deepEqual([r.code, r.summary.status, r.summary.error], [1, 'failed', expected]);
    assert.ok(r.summary.memory.maxRssMiB > 0);
  }
});

test('M3 an OS read error is not a CHECKSUM mismatch', t => {
  for (const kind of ['directory', 'mismatch']) {
    const w = workspace(t);
    storeAll(w.zipRoot);
    const file = storedFile(w.zipRoot, '2026-03');
    fs.unlinkSync(file);
    if (kind === 'directory') fs.mkdirSync(file); else fs.writeFileSync(file, 'wrong bytes');
    assert.deepEqual(integrity(w.zipRoot).symbols[0].holdout.find(u => u.unit === '2026-03'),
      { unit: '2026-03', available: true, checksum: kind === 'directory' ? 'not checked' : 'failed', result: 'fail' });
  }
});

for (const month of ['2025-11', '2025-10', '2024-03']) test(`M2 download truncation diagnostic: ${month}`, async t => {
  const w = workspace(t), s = sourceOf(month), zip = Buffer.from('synthetic truncated archive');
  let attempts = 0;
  const fetch = async url => {
    const file = new URL(url).pathname.slice(1);
    if (file === s.checksumFile) return new Response(checksumText(zip, s.zipName));
    if (file === s.file) { attempts++; return new Response(zip, { headers: { 'content-length': String(zip.length + 17) } }); }
    return new Response('', { status: 404 });
  };
  const r = await cli(funding.main, 'download', w, { fetch });
  assert.equal(r.code, 1);
  assert.equal(attempts, 4);
  const [failure] = r.summary.failures;
  if (month >= '2025-10') {
    assert.deepEqual(failure, { file: s.file, error: `Vision download: ${s.file}: sealable source fails` });
    const text = JSON.stringify(failure).replaceAll(s.file, 'FILE');
    assert.ok(!/bytes|\d/.test(text));
  } else assert.match(failure.error, /truncated body \(\d+ of \d+ bytes\).*4 attempts/);
});

test('N6 schedule code stays byte-identical to the pinned base', () => {
  const text = fs.readFileSync(new URL('../src/f1-funding.mjs', import.meta.url), 'utf8');
  const block = text.slice(text.indexOf('export const STOP_CLASSES')).split('\n}\n', 1)[0] + '\n}\n';
  assert.equal(createHash('sha256').update(block).digest('hex'), '77ca801e39c2150991c7cc2911e8c028776f82e3b37bf19ad0be3e6ffbd150e7');
  assert.equal(funding.HOUR_MS, 3600000);
});

test('F6 unsupported imports and re-exports fail closed; supported trees hash every file', t => {
  const w = workspace(t), entry = path.join(w.dir, 'entry.mjs'), dep = path.join(w.dir, 'dep.mjs');
  fs.writeFileSync(dep, 'export const x = 1;\n');
  for (const code of ['import { x } from "./dep.mjs";\n', "  import { x } from './dep.mjs';\n", "await import('./dep.mjs');\n",
    'export { x } from "./dep.mjs";\n', "export * from './dep.mjs' with { type: 'json' };\n", "import fs from 'node:fs'; const p = './dep.mjs'; await import(p);\n"]) {
    fs.writeFileSync(entry, code);
    assert.throws(() => funding.codeIdentity(entry), /unsupported.*(?:import|dependency)|(?:import|dependency).*unsupported/i, code);
  }
  for (const code of ["import { x } from './dep.mjs';\n", "import './dep.mjs';\n", "export { x } from './dep.mjs';\n", "export * from './dep.mjs';\n"]) {
    fs.writeFileSync(entry, code);
    const actual = funding.codeIdentity(entry).modules.map(m => m.sha256).sort();
    const expected = [entry, dep].map(file => createHash('sha256').update(fs.readFileSync(file)).digest('hex')).sort();
    assert.deepEqual(actual, expected);
  }
});

for (const [name, declaration] of [
  ['block comment', "export /* c */ * from './extra.mjs';\n"],
  ['line comment', "export // c\n* from './extra.mjs';\n"],
]) test(`F6 comment-separated re-export fails closed: ${name}`, t => {
  const w = workspace(t), entry = path.join(w.dir, 'entry.mjs');
  fs.writeFileSync(path.join(w.dir, 'extra.mjs'), 'export const x = 1;\n');
  fs.writeFileSync(entry, declaration);
  assert.throws(() => funding.codeIdentity(entry), /unsupported module dependency form/);
});

for (const quote of ["'", '"', '`']) test(`F6 relative module literals must have parsed dependencies: ${quote}`, t => {
  const w = workspace(t), entry = path.join(w.dir, 'entry.mjs');
  fs.writeFileSync(path.join(w.dir, 'extra.mjs'), 'export const x = 1;\n');
  for (const specifier of ['./extra.mjs', '../extra.mjs']) {
    fs.writeFileSync(entry, `const modulePath = ${quote}${specifier}${quote};\n`);
    assert.throws(() => funding.codeIdentity(entry), /unsupported module dependency form/);
  }
  fs.writeFileSync(entry, `import './extra.mjs';\nconst modulePath = ${quote}./extra.mjs${quote};\n`);
  assert.equal(funding.codeIdentity(entry).modules.length, 2);
});
