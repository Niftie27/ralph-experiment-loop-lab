// F1a-4: funding verify: coverage, the schedule check with the bridge class, the edges and the holdout integrity path
// (docs/f1/f1a-4-contract.md sections 2, 3 and 6, amendment 1 A1). Synthetic files with placeholder rates only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { verifyFunding, scheduleClass, firstCandleOf, main, FUNDING_HEADER } from '../src/f1-funding.mjs';
import { fundingSource, planFundingUnits, visionInstrument } from '../src/vision-source.mjs';
import { storeSource, recordMissing } from '../src/f1-1m-store.mjs';
import { makeZip, checksumText } from '../test-support/vision-fixtures.mjs';

const HOUR = 3600000, RATE = '0.00012345', MARK = '0.00077777';
const at = iso => Date.parse(iso);
const MONTHS = [...new Set(planFundingUnits('BTC').map(u => u.sources[0].zipName.slice(-11, -4)))];
const HOLDOUT_UNITS = ['2025-10 sealed part', ...MONTHS.filter(m => m > '2025-10')];
const monthStart = m => at(`${m}-01T00:00:00Z`), monthEnd = m => Date.UTC(+m.slice(0, 4), +m.slice(5), 1);
// Rows every `step` hours in [from, to), calc_time 1 ms after the hour, labelled h.
const rows = (from, to, step = 8, h = step) => { const out = []; for (let t = from; t < to; t += step * HOUR) out.push(`${t + 1},${h},${RATE}`); return out; };
const without = (list, ...isos) => list.filter(r => !isos.some(iso => r.startsWith(String(at(iso) + 1))));
function workspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-funding-verify-test-'));
  return { dir, zipRoot: path.join(dir, 'data', 'vision') };
}
function put(zipRoot, symbol, month, lines) {
  const s = fundingSource(visionInstrument(symbol), month);
  const zip = makeZip([{ name: s.csvName, data: Buffer.from(`${FUNDING_HEADER}\n${lines.map(l => `${l}\n`).join('')}`) }]);
  storeSource(zipRoot, s, zip, checksumText(zip, s.zipName));
  return s;
}
// Every month 2021-10..2026-09; months before `from` answered 404 (marker); override[m] = rows, or null for a gap.
function storeAll(zipRoot, symbol, override = {}, { from = '2021-10', step = 8 } = {}) {
  for (const m of MONTHS) {
    if (m < from) { recordMissing(zipRoot, fundingSource(visionInstrument(symbol), m)); continue; }
    if (override[m] === null) continue;
    put(zipRoot, symbol, m, override[m] ?? rows(monthStart(m), monthEnd(m), step));
  }
}
const verify = (zipRoot, symbol = 'BTC', firstCandle = () => null) => verifyFunding({ symbols: [symbol], zipRoot, firstCandle, guard: { check() {} } });
const unitResults = s => Object.fromEntries(s.holdout.map(u => [u.unit, u.result]));
const isoTimes = value => JSON.stringify(value).match(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z/g) ?? [];

test('F1a-4 schedule: the section 2 table with the bridge to the new grid', () => {
  const s = (iso, h) => ({ t: at(iso), h });
  const cases = [
    [null, s('2024-03-01T16:00:00Z', 8), null], [null, s('2024-03-01T12:00:00Z', 8), 'off_grid'],
    [s('2024-03-01T08:00:00Z', 8), s('2024-03-01T16:00:00Z', 8), 'regular'], [s('2024-03-01T00:00:00Z', 8), s('2024-03-01T16:00:00Z', 8), 'unexplained_gap'],
    [s('2022-11-09T16:00:00Z', 8), s('2022-11-09T20:00:00Z', 4), 'interval_change'], [s('2022-11-10T00:00:00Z', 4), s('2022-11-10T04:00:00Z', 2), 'interval_change'],
    [s('2022-11-18T08:00:00Z', 2), s('2022-11-18T16:00:00Z', 8), 'interval_change'], [s('2025-08-31T15:00:00Z', 1), s('2025-08-31T16:00:00Z', 4), 'interval_change'],
    [s('2025-08-31T14:00:00Z', 1), s('2025-08-31T16:00:00Z', 4), 'bridge'], [s('2025-08-31T13:00:00Z', 1), s('2025-08-31T16:00:00Z', 4), 'bridge'],
    [s('2025-08-31T14:00:00Z', 1), s('2025-08-31T17:00:00Z', 4), 'off_grid'], [s('2025-08-31T14:00:00Z', 1), s('2025-08-31T16:00:00Z', 1), 'unexplained_gap'],
    [s('2024-03-01T12:00:00Z', 2), s('2024-03-01T16:00:00Z', 8), 'unexplained_change'], [s('2024-03-01T14:00:00Z', 1), s('2024-03-01T16:00:00Z', 8), 'unexplained_change'],
    [s('2024-03-01T12:00:00Z', 4), s('2024-03-01T13:00:00Z', 1), 'interval_change'], [s('2024-03-01T12:00:00Z', 2), s('2024-03-01T15:00:00Z', 1), 'unexplained_change'],
  ];
  for (const [p, r, expected] of cases) assert.equal(scheduleClass(p, r), expected, `${p && new Date(p.t).toISOString()} ${p?.h} -> ${new Date(r.t).toISOString()} ${r.h}`);
});

test('F1a-4 verify: a clean history passes with research figures only and per holdout unit availability, CHECKSUM and pass', async () => {
  const w = workspace();
  storeAll(w.zipRoot, 'BTC');
  const r = verify(w.zipRoot);
  assert.equal(r.status, 'ok');
  const [b] = r.symbols;
  assert.deepEqual([b.contract, b.researchSettlements, b.firstSettlement, b.lastSettlement, b.offsetMaxMs], ['BTCUSDT', 4380, '2021-10-18T00:00:00.000Z', '2025-10-16T16:00:00.000Z', 1]);
  assert.deepEqual([b.changes, b.anomalies, b.coverage, b.gaps, b.notListed, b.failures], [[], [], [], [], [], []]);
  assert.deepEqual(b.sources, { planned: 49, verified: 49, notListed: 0, gaps: 0, failed: 0 });
  assert.deepEqual(b.holdout, HOLDOUT_UNITS.map(unit => ({ unit, available: true, checksum: 'verified', result: 'pass' })));
  assert.ok(isoTimes(r).every(t => t < '2025-10-17'));
  const cli = { out: '' };
  const code = await main(['verify', '--symbols', 'BTC', '--data-dir', path.join(w.dir, 'data'), '--manifest', path.join(w.dir, 'none.json')], { stdout: { write: s => { cli.out += s; } } });
  assert.deepEqual([code, JSON.parse(cli.out).status, JSON.parse(cli.out).symbols[0].researchSettlements], [0, 'ok', 4380]);
});

test('F1a-4 verify: the SOL-like 8 -> 4 -> 2 -> 8 sequence passes with its published labels and elapsed hours', () => {
  const w = workspace();
  const nov = [...rows(at('2022-11-01T00:00:00Z'), at('2022-11-09T20:00:00Z')), ...rows(at('2022-11-09T20:00:00Z'), at('2022-11-10T04:00:00Z'), 4),
    ...rows(at('2022-11-10T04:00:00Z'), at('2022-11-18T10:00:00Z'), 2), ...rows(at('2022-11-18T16:00:00Z'), monthEnd('2022-11'))];
  storeAll(w.zipRoot, 'SOL', { '2022-11': nov });
  const [s] = verify(w.zipRoot, 'SOL').symbols;
  assert.deepEqual([s.anomalies, s.changes], [[], [
    { time: '2022-11-09T20:00:00.000Z', class: 'interval_change', old: 8, new: 4, elapsedHours: 4 },
    { time: '2022-11-10T04:00:00.000Z', class: 'interval_change', old: 4, new: 2, elapsedHours: 4 },
    { time: '2022-11-18T16:00:00.000Z', class: 'interval_change', old: 2, new: 8, elapsedHours: 8 }]]);
  assert.equal(s.researchSettlements, 4380 - 90 + 165);
});

test('F1a-4 verify: a bridge passes and is recorded; an undocumented short change and an unexplained gap stop (status stopped)', () => {
  const w = workspace();
  const aug = [...rows(monthStart('2024-08'), at('2024-08-10T00:00:00Z')), ...rows(at('2024-08-10T00:00:00Z'), at('2024-08-10T15:00:00Z'), 1),
    ...rows(at('2024-08-10T16:00:00Z'), monthEnd('2024-08'), 4, 4)];
  storeAll(w.zipRoot, 'BTC', { '2024-08': aug, '2024-09': rows(monthStart('2024-09'), monthEnd('2024-09'), 4) });
  const r = verify(w.zipRoot);
  assert.equal(r.status, 'ok');
  assert.deepEqual(r.symbols[0].changes, [{ time: '2024-08-10T00:00:00.000Z', class: 'interval_change', old: 8, new: 1, elapsedHours: 8 },
    { time: '2024-08-10T16:00:00.000Z', class: 'bridge', old: 1, new: 4, elapsedHours: 2 }, { time: '2024-10-01T00:00:00.000Z', class: 'interval_change', old: 4, new: 8, elapsedHours: 4 }]);
  const w2 = workspace();
  storeAll(w2.zipRoot, 'BTC', { '2024-03': [...rows(monthStart('2024-03'), at('2024-03-05T00:00:00Z')), ...rows(at('2024-03-05T00:00:00Z'), at('2024-03-05T13:00:00Z'), 2),
    ...rows(at('2024-03-05T16:00:00Z'), monthEnd('2024-03'))], '2024-05': without(rows(monthStart('2024-05'), monthEnd('2024-05')), '2024-05-07T08:00:00Z') });
  const stopped = verify(w2.zipRoot);
  assert.equal(stopped.status, 'stopped');
  assert.deepEqual(stopped.symbols[0].anomalies.map(a => [a.time, a.class]), [['2024-03-05T16:00:00.000Z', 'unexplained_change'], ['2024-05-07T16:00:00.000Z', 'unexplained_gap']]);
  assert.deepEqual(stopped.symbols[0].anomalies[1], { time: '2024-05-07T16:00:00.000Z', class: 'unexplained_gap', intervalHours: 8, previous: '2024-05-07T00:00:00.000Z', previousIntervalHours: 8, elapsedHours: 16 });
});

test('F1a-4 verify edges: out-of-window predecessor, the trailing edge and an empty listed file', () => {
  const w = workspace();
  storeAll(w.zipRoot, 'BTC', { '2021-10': without(rows(monthStart('2021-10'), monthEnd('2021-10')), '2021-10-18T00:00:00Z'), '2023-06': [] });
  const r = verify(w.zipRoot);
  assert.equal(r.status, 'stopped');
  assert.deepEqual(r.symbols[0].anomalies.map(a => [a.time, a.class]), [['2021-10-18T08:00:00.000Z', 'unexplained_gap'], ['2023-06-01T00:00:00.000Z', 'empty_file'],
    ['2023-07-01T00:00:00.000Z', 'unexplained_gap']]);
  assert.equal(r.symbols[0].anomalies[1].file, fundingSource(visionInstrument('BTC'), '2023-06').file);
  const w2 = workspace();
  storeAll(w2.zipRoot, 'BTC', { '2025-10': rows(monthStart('2025-10'), at('2025-10-16T16:00:00Z')).concat(rows(at('2025-10-17T00:00:00Z'), monthEnd('2025-10'))) });
  const trailing = verify(w2.zipRoot);
  assert.deepEqual(trailing.symbols[0].anomalies, [{ time: '2025-10-16T08:00:00.000Z', class: 'trailing_edge', intervalHours: 8 }]);
  assert.equal(unitResults(trailing.symbols[0])['2025-10 sealed part'], 'fail');
});

test('F1a-4 verify edges: an instrument listed inside the window needs its first settlement at the first grid point after its first 1m candle', () => {
  const candle = () => at('2025-05-30T10:30:00Z');
  const w = workspace();
  storeAll(w.zipRoot, 'HYPE', { '2025-05': rows(at('2025-05-30T12:00:00Z'), monthEnd('2025-05'), 4) }, { from: '2025-05', step: 4 });
  const ok = verify(w.zipRoot, 'HYPE', candle);
  const [h] = ok.symbols;
  assert.deepEqual([ok.status, h.firstSettlement, h.notListed.length, h.notListed[0], h.notListed.at(-1), h.anomalies], ['ok', '2025-05-30T12:00:00.000Z', 43, '2021-10', '2025-04', []]);
  assert.deepEqual(h.coverage, [{ kind: 'before_listing', start: '2021-10-18T00:00:00.000Z', end: '2025-05-01T00:00:00.000Z' },
    { kind: 'before_first_charge', start: '2025-05-30T10:30:00.000Z', end: '2025-05-30T12:00:00.000Z' }]);
  assert.equal(verify(w.zipRoot, 'HYPE').symbols[0].anomalies[0].class, 'first_settlement_unproven');
  const w2 = workspace();
  storeAll(w2.zipRoot, 'HYPE', { '2025-05': rows(at('2025-05-30T16:00:00Z'), monthEnd('2025-05'), 4) }, { from: '2025-05', step: 4 });
  const late = verify(w2.zipRoot, 'HYPE', candle);
  assert.deepEqual([late.status, late.symbols[0].anomalies], ['stopped', [{ time: '2025-05-30T16:00:00.000Z', class: 'first_settlement_unproven', expected: '2025-05-30T12:00:00.000Z' }]]);
  assert.equal(firstCandleOf(path.join(w.dir, 'no-manifest.json'), 'HYPEUSDT'), null);
});

test('F1a-4 verify: a gap month exits 3 without a schedule check across it; two local versions of a month fail', () => {
  const w = workspace();
  storeAll(w.zipRoot, 'BTC', { '2024-05': null });
  const gap = verify(w.zipRoot);
  const missing = fundingSource(visionInstrument('BTC'), '2024-05').file;
  assert.deepEqual([gap.status, gap.symbols[0].gaps, gap.symbols[0].anomalies, gap.symbols[0].coverage],
    ['incomplete', [missing], [], [{ kind: 'gap_month', start: '2024-05-01T00:00:00.000Z', end: '2024-06-01T00:00:00.000Z', file: missing }]]);
  const w2 = workspace();
  storeAll(w2.zipRoot, 'BTC');
  put(w2.zipRoot, 'BTC', '2024-03', rows(monthStart('2024-03') + 1, monthEnd('2024-03')));
  put(w2.zipRoot, 'BTC', '2026-01', rows(monthStart('2026-01') + 1, monthEnd('2026-01')));
  const twice = verify(w2.zipRoot);
  assert.deepEqual([twice.status, twice.symbols[0].failures], ['failed', [{ file: fundingSource(visionInstrument('BTC'), '2024-03').file, error: 'more than one local version' }]]);
  assert.equal(unitResults(twice.symbols[0])['2026-01'], 'fail');
});

test('F1a-4 holdout integrity: failures name only the unit; the boundary pair fails only "2025-10 sealed part"; an empty or missing unit fails', () => {
  const w = workspace();
  storeAll(w.zipRoot, 'BTC', { '2026-02': without(rows(monthStart('2026-02'), monthEnd('2026-02')), '2026-02-11T08:00:00Z'), '2026-06': [], '2026-09': null });
  const r = verify(w.zipRoot);
  const [b] = r.symbols;
  assert.equal(r.status, 'failed');
  assert.deepEqual(Object.entries(unitResults(b)).filter(([, v]) => v === 'fail').map(([k]) => k), ['2026-02', '2026-06', '2026-07', '2026-09']);
  assert.deepEqual(b.holdout.find(u => u.unit === '2026-09'), { unit: '2026-09', available: false, checksum: 'not checked', result: 'fail' });
  assert.deepEqual([b.anomalies, b.failures, b.gaps, b.researchSettlements], [[], [], [], 4380]);
  assert.ok(isoTimes(r).every(t => t < '2025-10-17') && !JSON.stringify(r).includes('2026-02-'));
  const w2 = workspace();
  storeAll(w2.zipRoot, 'BTC', { '2025-10': without(rows(monthStart('2025-10'), monthEnd('2025-10')), '2025-10-17T00:00:00Z') });
  const boundary = verify(w2.zipRoot);
  assert.deepEqual(Object.entries(unitResults(boundary.symbols[0])).filter(([, v]) => v === 'fail').map(([k]) => k), ['2025-10 sealed part']);
  assert.deepEqual([boundary.symbols[0].anomalies, boundary.symbols[0].researchSettlements], [[], 4380]);
});

// The next unit's first predecessor is unreadable, so that unit is unresolved and fails too (m3).
test('F1a-4 holdout integrity: poison in the sealed part fails that unit and the next one and never reaches the summary', () => {
  const w = workspace();
  const oct = [...rows(monthStart('2025-10'), at('2025-10-17T00:00:00Z')), `${at('2025-10-17T00:00:00Z') + 2},${MARK},${MARK}`, ...rows(at('2025-10-17T08:00:00Z'), monthEnd('2025-10'))];
  storeAll(w.zipRoot, 'BTC', { '2025-10': oct });
  const r = verify(w.zipRoot);
  const [b] = r.symbols;
  assert.deepEqual([r.status, b.researchSettlements, b.anomalies, b.failures], ['failed', 4380, [], []]);
  assert.deepEqual(Object.entries(unitResults(b)).filter(([, v]) => v === 'fail').map(([k]) => k), ['2025-10 sealed part', '2025-11']);
  assert.ok(!JSON.stringify(r).includes('7777') && isoTimes(r).every(t => t < '2025-10-17'));
});
