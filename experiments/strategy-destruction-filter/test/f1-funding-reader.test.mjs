// F1a-4: the funding research reader and digest (docs/f1/f1a-4-contract.md section 1 m5 and section 6, amendment 1 A1).
// Synthetic files with placeholder rates only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { openResearchFunding, codeIdentity, verifyFunding, FUNDING_HEADER } from '../src/f1-funding.mjs';
import { fundingSource, planFundingUnits, visionInstrument } from '../src/vision-source.mjs';
import { storeSource, recordMissing } from '../src/f1-1m-store.mjs';
import { makeZip, checksumText } from '../test-support/vision-fixtures.mjs';

const HOUR = 3600000, RATE = '0.00012345', MARK = '0.00077777';
const at = iso => Date.parse(iso);
const MONTHS = [...new Set(planFundingUnits('BTC').map(u => u.sources[0].zipName.slice(-11, -4)))];
const monthStart = m => at(`${m}-01T00:00:00Z`), monthEnd = m => Date.UTC(+m.slice(0, 4), +m.slice(5), 1);
const rows = (from, to, step = 8, h = step) => { const out = []; for (let t = from; t < to; t += step * HOUR) out.push(`${t + 1},${h},${RATE}`); return out; };
function workspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-funding-reader-test-'));
  return { dir, zipRoot: path.join(dir, 'data', 'vision') };
}
function put(zipRoot, symbol, month, lines, { header = true } = {}) {
  const s = fundingSource(visionInstrument(symbol), month);
  const zip = makeZip([{ name: s.csvName, data: Buffer.from(`${header ? `${FUNDING_HEADER}\n` : ''}${lines.map(l => `${l}\n`).join('')}`) }]);
  storeSource(zipRoot, s, zip, checksumText(zip, s.zipName));
}
function storeAll(zipRoot, symbol, override = {}, { from = '2021-10', step = 8, order = MONTHS } = {}) {
  for (const m of order) {
    if (m < from) { recordMissing(zipRoot, fundingSource(visionInstrument(symbol), m)); continue; }
    if (override[m] === null) continue;
    put(zipRoot, symbol, m, override[m] ?? rows(monthStart(m), monthEnd(m), step));
  }
}
const instrumentOf = contract => ({ exchange: 'binance', market: 'linear_perpetual', contract });
const req = (dataStart, dataEnd, contract = 'BTCUSDT') => ({ instrument: instrumentOf(contract), dataStart, dataEnd });
const FULL = req('2021-10-18T00:00:00.000Z', '2025-10-17T00:00:00.000Z');
const isoTimes = value => JSON.stringify(value).match(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z/g) ?? [];

test('F1a-4 reader: refuses windows outside the research window and malformed requests or options', () => {
  const w = workspace();
  storeAll(w.zipRoot, 'BTC');
  const reader = openResearchFunding({ zipRoot: w.zipRoot });
  for (const bad of [req('2021-10-17T16:00:00.000Z', '2021-11-01T00:00:00.000Z'), req('2025-10-01T00:00:00.000Z', '2025-10-17T08:00:00.000Z'),
    req('2025-10-17T00:00:00.000Z', '2025-11-01T00:00:00.000Z'), req('2026-10-17T00:00:00.000Z', '2026-10-18T00:00:00.000Z'), req('2024-01-01T00:00:00Z', '2024-02-01T00:00:00.000Z'),
    req('2024-02-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z'), req('2024-01-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z', 'ADAUSDT'),
    { instrument: instrumentOf('BTCUSDT'), dataStart: '2024-01-01T00:00:00.000Z' }, { ...FULL, extra: 1 }])
    assert.throws(() => reader.read(bad), /^Error: funding reader: /, JSON.stringify(bad));
  for (const options of [undefined, {}, { zipRoot: w.zipRoot, extra: 1 }, { zipRoot: 1 }]) assert.throws(() => openResearchFunding(options), /funding reader: options/);
});

test('F1a-4 reader: the columns of a window, elapsed hours from the previous month, fresh copies in a frozen result', () => {
  const w = workspace();
  storeAll(w.zipRoot, 'BTC');
  const reader = openResearchFunding({ zipRoot: w.zipRoot });
  const r = reader.read(req('2024-03-01T00:00:00.000Z', '2024-03-02T00:00:00.000Z'));
  const day = rows(at('2024-03-01T00:00:00Z'), at('2024-03-02T00:00:00Z')).map(l => +l.split(',')[0] - 1);
  assert.deepEqual([[...r.columns.settlementTime], [...r.columns.calcTime], [...r.columns.rate], [...r.columns.intervalHours], [...r.columns.elapsedHours], [...r.columns.sourceIndex]],
    [day, day.map(t => t + 1), [0.00012345, 0.00012345, 0.00012345], [8, 8, 8], [8, 8, 8], [1, 1, 1]]);
  assert.deepEqual(r.sources.map(s => s.file.slice(-11, -4)), ['2024-02', '2024-03']);
  assert.ok(r.sources.every(s => /^[0-9a-f]{64}$/.test(s.sha256)) && /^[0-9a-f]{64}$/.test(r.digest));
  assert.deepEqual([r.coverage, r.anomalies, r.dataStart, r.dataEnd, r.instrument], [[], [], '2024-03-01T00:00:00.000Z', '2024-03-02T00:00:00.000Z', instrumentOf('BTCUSDT')]);
  assert.ok([r, r.columns, r.sources, r.sources[0], r.coverage, r.anomalies, r.instrument, r.codeIdentity, r.codeIdentity.modules].every(Object.isFrozen));
  r.columns.rate[0] = 9; new Float64Array(r.columns.settlementTime.buffer)[1] = 0; r.columns.elapsedHours.fill(1);
  const again = reader.read(req('2024-03-01T00:00:00.000Z', '2024-03-02T00:00:00.000Z'));
  assert.deepEqual([[...again.columns.rate], [...again.columns.settlementTime], [...again.columns.elapsedHours], again.digest], [[0.00012345, 0.00012345, 0.00012345], day, [8, 8, 8], r.digest]);
  const first = reader.read(req('2021-10-18T00:00:00.000Z', '2021-10-19T00:00:00.000Z'));
  assert.deepEqual([[...first.columns.elapsedHours], first.sources.length], [[8, 8, 8], 1]);
});

test('F1a-4 reader: elapsedHours is null (NaN) at an instrument first settlement and after a gap month, which coverage lists', () => {
  const w = workspace();
  storeAll(w.zipRoot, 'HYPE', { '2025-05': rows(at('2025-05-30T12:00:00Z'), monthEnd('2025-05'), 4) }, { from: '2025-05', step: 4 });
  const hype = openResearchFunding({ zipRoot: w.zipRoot }).read(req('2025-05-30T00:00:00.000Z', '2025-05-31T00:00:00.000Z', 'HYPEUSDT'));
  assert.deepEqual([...hype.columns.elapsedHours].map(x => Number.isNaN(x) ? null : x), [null, 4, 4]);
  assert.deepEqual(hype.anomalies.map(a => a.class), ['first_settlement_unproven']); // no manifest given: the first 1m candle is unknown
  const w2 = workspace();
  storeAll(w2.zipRoot, 'BTC', { '2024-05': null });
  const reader = openResearchFunding({ zipRoot: w2.zipRoot });
  const after = reader.read(req('2024-06-01T00:00:00.000Z', '2024-06-02T00:00:00.000Z'));
  assert.deepEqual([[...after.columns.elapsedHours].map(x => Number.isNaN(x) ? null : x), after.sources.map(s => s.file.slice(-11, -4)), after.coverage], [[null, 8, 8], ['2024-06'], []]);
  const across = reader.read(req('2024-04-30T00:00:00.000Z', '2024-06-02T00:00:00.000Z'));
  assert.deepEqual(across.coverage, [{ kind: 'gap_month', start: '2024-05-01T00:00:00.000Z', end: '2024-06-01T00:00:00.000Z', file: fundingSource(visionInstrument('BTC'), '2024-05').file }]);
  assert.equal(across.columns.settlementTime.length, 6);
});

test('F1a-4 digest: identical across reruns and reversed storage order, changed by a source sha256; code identity covers the import closure', () => {
  const a = workspace(), b = workspace(), c = workspace();
  storeAll(a.zipRoot, 'BTC');
  storeAll(b.zipRoot, 'BTC', {}, { order: [...MONTHS].reverse() });
  storeAll(c.zipRoot, 'BTC', { '2023-02': null });
  put(c.zipRoot, 'BTC', '2023-02', rows(monthStart('2023-02'), monthEnd('2023-02')), { header: false });
  const [ra, ra2, rb, rc] = [a, a, b, c].map(w => openResearchFunding({ zipRoot: w.zipRoot }).read(FULL));
  assert.equal(ra.digest, ra2.digest);
  assert.equal(ra.digest, rb.digest);
  assert.notEqual(ra.digest, rc.digest);
  assert.deepEqual([[...rc.columns.calcTime], [...rc.columns.elapsedHours]], [[...ra.columns.calcTime], [...ra.columns.elapsedHours]]);
  assert.deepEqual(ra.sources.filter((s, i) => s.sha256 !== rc.sources[i].sha256).map(s => s.file.slice(-11, -4)), ['2023-02']);
  const code = codeIdentity();
  assert.deepEqual(code.modules.map(m => m.path), ['src/f1-1m-format.mjs', 'src/f1-1m-store.mjs', 'src/f1-funding.mjs', 'src/h2-contract.mjs', 'src/vision-1m.mjs', 'src/vision-source.mjs', 'src/vision-transport.mjs']);
  const own = createHash('sha256').update(fs.readFileSync(new URL('../src/f1-funding.mjs', import.meta.url))).digest('hex');
  assert.equal(code.modules.find(m => m.path === 'src/f1-funding.mjs').sha256, own);
  assert.ok(code.gitRevision === null || /^[0-9a-f]{40}$/.test(code.gitRevision));
  assert.deepEqual(ra.codeIdentity, code);
});

test('F1a-4 reader: holdout fixtures leave a research read and its digest unchanged; sealed 2025-10 rows change only that file sha256', () => {
  const clean = workspace(), holdout = workspace(), sealed = workspace();
  storeAll(clean.zipRoot, 'BTC');
  storeAll(holdout.zipRoot, 'BTC', { '2025-11': null, '2026-02': [...rows(monthStart('2026-02'), at('2026-02-03T00:00:00Z')), `${at('2026-02-03T00:00:00Z') + 1},${MARK},${MARK}`], '2026-09': [] });
  storeAll(sealed.zipRoot, 'BTC', { '2025-10': [...rows(monthStart('2025-10'), at('2025-10-17T00:00:00Z')), `${at('2025-10-17T00:00:00Z') + 2},${MARK}`, `${at('2025-10-17T08:00:00Z') + 3},${MARK},${MARK},${MARK}`] });
  const [rc, rh, rs] = [clean, holdout, sealed].map(w => openResearchFunding({ zipRoot: w.zipRoot }).read(FULL));
  assert.equal(rh.digest, rc.digest);
  assert.notEqual(rs.digest, rc.digest);
  for (const key of ['settlementTime', 'calcTime', 'rate', 'intervalHours', 'elapsedHours', 'sourceIndex']) assert.deepEqual([...rs.columns[key]], [...rc.columns[key]], key);
  assert.deepEqual([rs.coverage, rs.anomalies, rs.columns.settlementTime.length], [rc.coverage, rc.anomalies, 4380]);
  assert.deepEqual(rc.sources.filter((s, i) => s.sha256 !== rs.sources[i].sha256).map(s => s.file.slice(-11, -4)), ['2025-10']);
  assert.ok(!JSON.stringify(rs).includes(MARK) && isoTimes(rs).every(t => t <= '2025-10-17T00:00:00.000Z'));
});

test('F1a-4 reader: a failed research source fails the read; verify reports the full research window digest and the code identity', () => {
  const w = workspace();
  storeAll(w.zipRoot, 'BTC');
  const v = verifyFunding({ symbols: ['BTC'], zipRoot: w.zipRoot });
  assert.equal(v.symbols[0].digest, openResearchFunding({ zipRoot: w.zipRoot }).read(FULL).digest);
  assert.deepEqual(v.code, codeIdentity());
  put(w.zipRoot, 'BTC', '2024-03', rows(monthStart('2024-03') + 1, monthEnd('2024-03')));
  assert.throws(() => openResearchFunding({ zipRoot: w.zipRoot }).read(req('2025-01-01T00:00:00.000Z', '2025-01-02T00:00:00.000Z')), /funding reader: research source .*BTCUSDT-fundingRate-2024-03\.zip fails/);
  assert.equal(verifyFunding({ symbols: ['BTC'], zipRoot: w.zipRoot }).symbols[0].digest, null);
});
