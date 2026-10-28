// F1a-3 commit 11: the E1 list (docs/f1/f1a-3-contract.md amendment 1 D1, D2): the research hours where Vision's own 60
// 1m rows do not reproduce Vision's 1h row, computed without src/f1-aggregate.mjs. Commit 14: the E2 list (amendment 2
// D5): the research 4h and 1d bars where Vision's own 1h rows do not reproduce Vision's 4h or 1d row.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { main, e1Hour, hourFiles, referenceFiles, csvRows } from '../src/f1-e1.mjs';
import { planReferences } from '../src/f1-reference.mjs';
import { storeSource, buildStore, readManifest } from '../src/f1-1m-store.mjs';
import { planUnits, visionSource } from '../src/vision-source.mjs';
import { makeZip, klineCsv, klineRow, minutes, checksumText, KLINE_HEADER } from '../test-support/vision-fixtures.mjs';

const HYPE = { exchange: 'binance', market: 'linear_perpetual', contract: 'HYPEUSDT' };
const MIN = 60000, H = 3600000, D = 86400000;
const ms = s => Date.parse(s);
// The value tokens of a fixture minute (klineRow defaults) in column order, and their 60-minute sums as Vision writes them.
const MINUTE = ['42314.00', '42335.80', '42289.60', '42331.90', '289.641', '12256155.25625', '3310', '175.211', '7414459.86355'];
const HOUR = { open: '42314.00', high: '42335.80', low: '42289.60', close: '42331.90', volume: '17378.460', quoteVolume: '735369315.37500', count: '198600',
  takerBuyVolume: '10512.660', takerBuyQuoteVolume: '444867591.81300' };
const hourTokens = (over = {}) => { const h = { ...HOUR, ...over }; return [h.open, h.high, h.low, h.close, h.volume, h.quoteVolume, h.count, h.takerBuyVolume, h.takerBuyQuoteVolume]; };
const sixty = () => Array.from({ length: 60 }, () => [...MINUTE]);

test('E1 hour: 60 minutes that reproduce the 1h row in all nine columns as exact decimals are not E1 (trailing zeros do not matter)', () => {
  assert.equal(e1Hour(sixty(), hourTokens()), null);
  assert.equal(e1Hour(sixty(), hourTokens({ volume: '17378.46', count: '198600', quoteVolume: '735369315.3750000' })), null);
});

test('E1 hour: open is the first minute, high the max, low the min, close the last; a differing price column has no relative difference', () => {
  const rows = sixty();
  rows[0][0] = '42300.10'; rows[17][1] = '42400.00'; rows[42][2] = '42100.5'; rows[59][3] = '42333.30';
  assert.equal(e1Hour(rows, hourTokens({ open: '42300.1', high: '42400', low: '42100.50', close: '42333.3' })), null);
  assert.deepEqual(e1Hour(rows, hourTokens({ open: '42314.00', high: '42400', low: '42100.50', close: '42333.3' })), { columns: ['open'], relative: {} });
  assert.deepEqual(e1Hour(rows, hourTokens({ open: '42300.1', high: '42335.80', low: '42289.60', close: '42331.90' })), { columns: ['high', 'low', 'close'], relative: {} });
});

test('E1 hour: a decimal difference in a sum is E1 even where the Numbers are equal; relative difference (1m sum - 1h) / 1h, 4 digits', () => {
  assert.equal(Number('735369315.37500001'), Number(HOUR.quoteVolume));
  assert.deepEqual(e1Hour(sixty(), hourTokens({ quoteVolume: '735369315.37500001' })), { columns: ['quote_volume'], relative: { quote_volume: '-1.360e-17' } });
  assert.deepEqual(e1Hour(sixty(), hourTokens({ volume: '17378.461', count: '198601' })), { columns: ['volume', 'count'], relative: { volume: '-5.754e-8', count: '-5.035e-6' } });
  // As in XRP 2023-11-14T11:00: the 1m volume above the 1h row, the 1m quote volume below it.
  assert.deepEqual(e1Hour(sixty(), hourTokens({ volume: '17378.000', quoteVolume: '735369316.000' })),
    { columns: ['volume', 'quote_volume'], relative: { volume: '2.647e-5', quote_volume: '-8.499e-10' } });
  // Sums past 2^53 and past 15 significant digits stay exact.
  const big = Array.from({ length: 60 }, () => [...MINUTE.slice(0, 4), '123456789012.345678', ...MINUTE.slice(5)]);
  assert.equal(e1Hour(big, hourTokens({ volume: '7407407340740.74068' })), null);
  assert.deepEqual(e1Hour(big, hourTokens({ volume: '7407407340740.74067' })).columns, ['volume']);
});

test('E1 hour: a token that is not a plain decimal fails, naming the column and never the token', () => {
  for (const token of ['1e-5', '', '0x10', '1.', '.5', '+1', ' 1']) {
    const rows = sixty();
    rows[3][4] = token;
    assert.throws(() => e1Hour(rows, hourTokens()), error => error.message === 'volume is not a plain decimal' || assert.fail(error.message));
  }
  assert.throws(() => e1Hour(sixty(), hourTokens({ count: '1e5' })), /^Error: count is not a plain decimal$/);
});

test('E1 rows: only rows inside [start, end) are read; outside rows are skipped on their open time alone (holdout never read)', () => {
  const t0 = ms('2025-10-16T23:58:00.000Z'), end = ms('2025-10-17T00:00:00.000Z');
  const csv = Buffer.from(`${KLINE_HEADER}\n${klineRow(t0)}\n${klineRow(t0 + MIN)}\n${end},poison\n${end + MIN},x,y\n`);
  const rows = [...csvRows(csv, { startMs: t0, endMs: end, step: MIN, file: 'f.zip' })];
  assert.deepEqual(rows.map(r => r.openTime), [t0, t0 + MIN]);
  assert.deepEqual(rows[0].tokens, MINUTE);
  assert.throws(() => [...csvRows(Buffer.from(`${t0},poison\n`), { startMs: t0, endMs: end, step: MIN, file: 'f.zip' })], /^Error: f\.zip: row 1 \(2025-10-16T23:58:00\.000Z\): expected 12 fields$/);
  assert.throws(() => [...csvRows(Buffer.from(`${klineRow(t0 + 1)}\n`), { startMs: t0, endMs: end, step: MIN, file: 'f.zip' })], /not aligned/);
  assert.throws(() => [...csvRows(Buffer.from(`${klineRow(t0)}\n${klineRow(t0)}\n`), { startMs: t0, endMs: end, step: MIN, file: 'f.zip' })], /not strictly increasing/);
  assert.throws(() => [...csvRows(Buffer.from('17606592000,1\n'), { startMs: t0, endMs: end, step: MIN, file: 'f.zip' })], /open_time is not 13 digits/);
});

test('E1 files: the 1h files of the research units are exactly the planned 1h reference files (D2 filled days included), all six symbols', () => {
  const { entries } = readManifest(new URL('../results/manifest-f1-1m.json', import.meta.url));
  for (const symbol of ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'HYPE']) {
    const contract = `${symbol}USDT`, units = entries.filter(e => e.period === 'research' && e.contract === contract);
    const files = units.flatMap(e => hourFiles(e).map(s => s.file));
    assert.equal(new Set(files).size, files.length, symbol);
    assert.deepEqual([...files].sort(), planReferences(symbol).filter(s => s.interval === '1h').map(s => s.file).sort(), symbol);
  }
});

test('E2 files: the 1h, 4h and 1d files of the research units are exactly the planned reference files of those intervals, all six symbols', () => {
  const { entries } = readManifest(new URL('../results/manifest-f1-1m.json', import.meta.url));
  for (const symbol of ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'HYPE']) for (const interval of ['1h', '4h', '1d']) {
    const contract = `${symbol}USDT`, units = entries.filter(e => e.period === 'research' && e.contract === contract);
    const files = units.flatMap(e => referenceFiles(e, interval).map(s => s.file));
    assert.equal(new Set(files).size, files.length, `${symbol} ${interval}`);
    assert.deepEqual([...files].sort(), planReferences(symbol).filter(s => s.interval === interval).map(s => s.file).sort(), `${symbol} ${interval}`);
  }
});

test('E1 module: imports nothing from src/f1-aggregate.mjs or src/f1-reference.mjs', () => {
  const text = fs.readFileSync(new URL('../src/f1-e1.mjs', import.meta.url), 'utf8');
  const imports = [...text.matchAll(/^\s*import\s[^;]*?from\s+'([^']+)'/gm), ...text.matchAll(/import\(\s*['"]([^'"]+)/g)].map(m => m[1]);
  assert.ok(imports.length > 0);
  assert.ok(!imports.some(m => /f1-aggregate|f1-reference/.test(m)), imports.join(' '));
  assert.ok(!/f1-aggregate\.mjs'|f1-reference\.mjs'/.test(text));
});

// CLI: a HYPE store from 1m zips. 2025-06-30 is a full day in the monthly file; 2025-07-01 is absent from the monthly
// file and filled from its daily file (filledRanges); 2025-07-02 has three monthly minutes; every other month has three
// minutes on day 2, and 2025-10 the minutes 2025-10-16T23:58 to 2025-10-17T00:01 (the last two are holdout).
let template;
function hypeStore() {
  if (template) return template;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-e1-template-'));
  const s = { zipRoot: path.join(dir, 'data', 'vision'), cacheDir: path.join(dir, 'data', 'market-cache', 'f1-1m'), manifestPath: path.join(dir, 'results', 'manifest-f1-1m.json') };
  const put = (src, rows) => { const zip = makeZip([{ name: src.csvName, data: klineCsv(rows) }]); storeSource(s.zipRoot, src, zip, checksumText(zip, src.zipName)); };
  for (const month of ['2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10']) {
    const src = planUnits('HYPE', { from: month, to: month })[0].sources[0];
    put(src, month === '2025-06' ? minutes('2025-06-30T00:00:00.000Z', 1440) : month === '2025-07' ? minutes('2025-07-02T00:00:00.000Z', 3)
      : month === '2025-10' ? minutes('2025-10-16T23:58:00.000Z', 4) : minutes(`${month}-02T00:00:00.000Z`, 3));
    for (let day = src.startMs; day < src.endMs; day += D) {
      const daily = visionSource(HYPE, 'daily', day);
      if (daily.zipName === 'HYPEUSDT-1m-2025-07-01.zip') { put(daily, minutes('2025-07-01T00:00:00.000Z', 1440)); continue; }
      const marker = path.join(s.zipRoot, path.dirname(daily.file), '404', daily.zipName);
      fs.mkdirSync(path.dirname(marker), { recursive: true });
      fs.writeFileSync(marker, '404 on the zip and its CHECKSUM\n');
    }
    assert.notEqual(buildStore({ ...s, symbols: ['HYPE'], from: month, to: month }).status, 'failed');
  }
  template = dir;
  return dir;
}
// The 1h files of the fixture's research units: HYPE's planned 1h files plus the daily file of the filled day 2025-07-01.
const FILLED_1H = { ...visionSource(HYPE, 'daily', ms('2025-07-01T00:00:00.000Z'), '1h'), interval: '1h' };
const hourSources = () => [...planReferences('HYPE').filter(s => s.interval === '1h'), FILLED_1H];
// A fresh copy with every 1h file of the research units stored: rows for 2025-06-30 (monthly 2025-06), 2025-07-01 (its
// daily file) and 2025-07-02T00:00 (monthly 2025-07); every other file holds the header only. over[t] changes the
// tokens of a row, rows[zipName] replaces the open times of a file, skip leaves files out, extra(zipRoot) adds anything else.
const HOUR_ROWS = { 'HYPEUSDT-1h-2025-06.zip': Array.from({ length: 24 }, (_, i) => ms('2025-06-30T00:00:00.000Z') + i * H),
  'HYPEUSDT-1h-2025-07-01.zip': Array.from({ length: 24 }, (_, i) => ms('2025-07-01T00:00:00.000Z') + i * H), 'HYPEUSDT-1h-2025-07.zip': [ms('2025-07-02T00:00:00.000Z')] };
// The 4h and 1d files of the same units (amendment 2 D5): HYPE's planned files plus the daily files of 2025-07-01, with
// the bars of the same days (2025-06-30 and 2025-07-01 in full, and 2025-07-02T00:00), each the exact sum of its 1h rows.
const barSources = () => ['4h', '1d'].flatMap(interval => [...planReferences('HYPE').filter(s => s.interval === interval),
  { ...visionSource(HYPE, 'daily', ms('2025-07-01T00:00:00.000Z'), interval), interval }]);
const STEP = { '4h': 4 * H, '1d': D };
const times = (token, n) => {
  const scale = token.includes('.') ? token.length - token.indexOf('.') - 1 : 0, s = (BigInt(token.replace('.', '')) * BigInt(n)).toString().padStart(scale + 1, '0');
  return scale ? `${s.slice(0, -scale)}.${s.slice(-scale)}` : s;
};
const barTokens = n => ({ ...HOUR, volume: times(HOUR.volume, n), quoteVolume: times(HOUR.quoteVolume, n), count: times(HOUR.count, n),
  takerBuyVolume: times(HOUR.takerBuyVolume, n), takerBuyQuoteVolume: times(HOUR.takerBuyQuoteVolume, n) });
const day = (iso, step) => Array.from({ length: D / step }, (_, i) => ms(iso) + i * step);
const BAR_ROWS = { 'HYPEUSDT-4h-2025-06.zip': day('2025-06-30T00:00:00.000Z', 4 * H), 'HYPEUSDT-4h-2025-07-01.zip': day('2025-07-01T00:00:00.000Z', 4 * H),
  'HYPEUSDT-4h-2025-07.zip': [ms('2025-07-02T00:00:00.000Z')], 'HYPEUSDT-1d-2025-06.zip': [ms('2025-06-30T00:00:00.000Z')],
  'HYPEUSDT-1d-2025-07-01.zip': [ms('2025-07-01T00:00:00.000Z')], 'HYPEUSDT-1d-2025-07.zip': [ms('2025-07-02T00:00:00.000Z')] };
// barOver[interval][t] changes the tokens of a 4h or 1d row, bars[zipName] replaces the open times of a 4h or 1d file.
function workspace({ over = {}, barOver = {}, skip = [], rows = HOUR_ROWS, bars = BAR_ROWS, extra = [] } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-e1-'));
  fs.cpSync(hypeStore(), dir, { recursive: true });
  const zipRoot = path.join(dir, 'data', 'vision');
  for (const src of hourSources()) {
    if (skip.includes(src.zipName)) continue;
    const opens = rows[src.zipName] ?? [];
    const csv = KLINE_HEADER + '\n' + opens.map(t => klineRow(t, { closeTime: String(t + H - 1), ...HOUR, ...over[t] })).join('\n') + (opens.length ? '\n' : '');
    const zip = makeZip([{ name: src.csvName, data: csv }]);
    storeSource(zipRoot, src, zip, checksumText(zip, src.zipName));
  }
  for (const src of barSources()) {
    if (skip.includes(src.zipName)) continue;
    const step = STEP[src.interval], opens = bars[src.zipName] ?? [];
    const csv = KLINE_HEADER + '\n' + opens.map(t => klineRow(t, { closeTime: String(t + step - 1), ...barTokens(step / H), ...barOver[src.interval]?.[t] })).join('\n') + (opens.length ? '\n' : '');
    const zip = makeZip([{ name: src.csvName, data: csv }]);
    storeSource(zipRoot, src, zip, checksumText(zip, src.zipName));
  }
  for (const f of extra) f(zipRoot);
  const out = path.join(dir, 'e1.csv'), e2 = path.join(dir, 'e2.csv');
  return { dir, out, e2, args: ['--symbols', 'HYPE', '--data-dir', path.join(dir, 'data'), '--manifest', path.join(dir, 'results', 'manifest-f1-1m.json'), '--out', out, '--e2-out', e2] };
}
async function run(argv, check) {
  let out = '';
  const code = await main(argv, { stdout: { write: s => { out += s; } }, check });
  return { code, summary: out ? JSON.parse(out) : null, out };
}
const CSV_HEADER = 'symbol,open_time,minutes,columns,rel_volume,rel_quote_volume,rel_count,rel_taker_buy_volume,rel_taker_buy_quote_volume';
const E2_CSV_HEADER = 'symbol,interval,open_time,columns,rel_volume,rel_quote_volume,rel_count,rel_taker_buy_volume,rel_taker_buy_quote_volume';

test('E1 cli: no differing hour writes a header-only list, exit 0, with counts, hashes and no private paths', async () => {
  const w = workspace();
  const { code, summary, out } = await run(w.args);
  assert.equal(code, 0, out);
  assert.equal(summary.command, 'e1');
  assert.equal(summary.status, 'ok');
  assert.equal(fs.readFileSync(w.out, 'utf8'), `${CSV_HEADER}\n`);
  assert.equal(fs.readFileSync(w.e2, 'utf8'), `${E2_CSV_HEADER}\n`);
  const files = { planned: 22, verified: 22, not_published: 0, not_downloaded: 0, failed: 0 };
  assert.deepEqual(summary.symbols[0].barFiles, { '4h': files, '1d': files });
  // 12 4h bars and two days with all their 1h rows; the bars of 2025-07-02T00:00 have one 1h row of 4 and of 24.
  assert.deepEqual(summary.symbols[0].bars, { '4h': { checked: 12, equal: 12, e2: 0, short: 1, noReference: 0, referenceOnly: 0 },
    '1d': { checked: 2, equal: 2, e2: 0, short: 1, noReference: 0, referenceOnly: 0 } });
  assert.deepEqual(summary.symbols[0].shortBars, { '4h': ['2025-07-02T00:00:00.000Z'], '1d': ['2025-07-02T00:00:00.000Z'] });
  assert.deepEqual([summary.e2Csv.file, summary.e2Csv.rows, summary.inputs.barFiles], ['e2.csv', 0, 44]);
  assert.match(summary.e2Csv.sha256, /^[0-9a-f]{64}$/);
  const hype = summary.symbols[0];
  assert.deepEqual(hype.window, { dataStart: '2025-05-01T00:00:00.000Z', dataEnd: '2025-10-17T00:00:00.000Z' });
  assert.equal(hype.units, 6);
  assert.deepEqual(hype.hourFiles, { planned: 22, verified: 22, not_published: 0, not_downloaded: 0, failed: 0 });
  // 48 hours with 60 minutes and a 1h row; 2025-07-02T00 has 3 minutes and a row; four hours (05-02T00, 08-02T00,
  // 09-02T00, 10-16T23) have minutes and no row. The holdout minutes 2025-10-17T00:00 and 00:01 are not research hours.
  assert.deepEqual(hype.hours, { checked: 48, equal: 48, e1: 0, short: 1, noReference: 4, referenceOnly: 0 });
  assert.deepEqual(hype.shortHours, ['2025-07-02T00:00:00.000Z']);
  assert.equal(summary.csv.file, 'e1.csv');
  assert.equal(summary.csv.rows, 0);
  assert.match(summary.csv.sha256, /^[0-9a-f]{64}$/);
  assert.match(summary.inputs.sha256, /^[0-9a-f]{64}$/);
  assert.deepEqual([summary.inputs.minuteSources, summary.inputs.hourFiles], [7, 22]);
  assert.match(summary.code.gitRevision ?? '', /^[0-9a-f]{40}$/);
  assert.ok(!out.includes(w.dir) && !out.includes(os.homedir()));
  assert.ok(summary.memory.maxRssMiB > 0);
});

test('E1 cli: differing hours are listed by symbol and open time with minutes, columns and relative differences; short hours never', async () => {
  const t5 = ms('2025-06-30T05:00:00.000Z'), t3 = ms('2025-07-01T03:00:00.000Z'), short = ms('2025-07-02T00:00:00.000Z');
  const w = workspace({ over: { [t5]: { volume: '17378.461' }, [t3]: { high: '42335.81', count: '198601' }, [short]: { volume: '1' } } });
  const { code, summary, out } = await run(w.args);
  assert.equal(code, 0, out);
  assert.equal(fs.readFileSync(w.out, 'utf8'), [CSV_HEADER, 'HYPE,2025-06-30T05:00:00.000Z,60,volume,-5.754e-8,,,,', 'HYPE,2025-07-01T03:00:00.000Z,60,high;count,,,-5.035e-6,,', ''].join('\n'));
  assert.deepEqual(summary.symbols[0].hours, { checked: 48, equal: 46, e1: 2, short: 1, noReference: 4, referenceOnly: 0 });
  assert.equal(summary.csv.rows, 2);
  assert.ok(!out.includes('17378') && !out.includes('42335'), 'the summary holds no values');
});

test('E2 cli: 4h and 1d rows that Vision\'s own 1h rows do not reproduce are listed by symbol, interval and open time; a bar without all its 1h rows never', async () => {
  const t5 = ms('2025-06-30T05:00:00.000Z'), t4 = ms('2025-06-30T04:00:00.000Z'), t8 = ms('2025-06-30T08:00:00.000Z');
  const july1 = ms('2025-07-01T00:00:00.000Z'), july2 = ms('2025-07-02T00:00:00.000Z');
  // The 1h row of 05:00 differs from its minutes (E1); the 4h row of 04:00 follows the 1h rows (not E2), the 1d row of
  // 2025-06-30 does not (E2 in volume): E2 is computed from the 1h rows, never from the minutes.
  const w = workspace({ over: { [t5]: { volume: '17378.461' } }, barOver: { '4h': { [t4]: { volume: '69513.841' }, [t8]: { count: '794401' }, [july2]: { volume: '1' } },
    '1d': { [july1]: { high: '42335.81' }, [july2]: { count: '1' } } } });
  const { code, summary, out } = await run(w.args);
  assert.equal(code, 0, out);
  assert.equal(fs.readFileSync(w.out, 'utf8'), [CSV_HEADER, 'HYPE,2025-06-30T05:00:00.000Z,60,volume,-5.754e-8,,,,', ''].join('\n'));
  assert.equal(fs.readFileSync(w.e2, 'utf8'), [E2_CSV_HEADER, 'HYPE,4h,2025-06-30T08:00:00.000Z,count,,,-1.259e-6,,', 'HYPE,1d,2025-06-30T00:00:00.000Z,volume,2.398e-9,,,,',
    'HYPE,1d,2025-07-01T00:00:00.000Z,high,,,,,', ''].join('\n'));
  assert.deepEqual(summary.symbols[0].bars, { '4h': { checked: 12, equal: 11, e2: 1, short: 1, noReference: 0, referenceOnly: 0 },
    '1d': { checked: 2, equal: 0, e2: 2, short: 1, noReference: 0, referenceOnly: 0 } });
  assert.equal(summary.e2Csv.rows, 3);
  assert.ok(!out.includes('69513') && !out.includes('42335'), 'the summary holds no values');
});

test('E2 cli: a 4h or 1d file not published or not downloaded exits 3 and is listed; a bar row in two files fails and writes no list', async () => {
  const daily4h = { ...visionSource(HYPE, 'daily', ms('2025-07-01T00:00:00.000Z'), '4h') };
  const marker = zipRoot => {
    const file = path.join(zipRoot, path.dirname(daily4h.file), '404', daily4h.zipName);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '404 on the zip and its CHECKSUM\n');
  };
  const w = workspace({ skip: ['HYPEUSDT-1d-2025-06.zip', daily4h.zipName], extra: [marker] });
  const { code, summary } = await run(w.args);
  assert.equal(code, 3);
  assert.equal(summary.status, 'incomplete');
  assert.deepEqual(summary.symbols[0].absentFiles, [{ file: 'data/futures/um/monthly/klines/HYPEUSDT/1d/HYPEUSDT-1d-2025-06.zip', reason: 'not_downloaded' },
    { file: 'data/futures/um/daily/klines/HYPEUSDT/4h/HYPEUSDT-4h-2025-07-01.zip', reason: 'not_published' }]);
  assert.deepEqual(summary.symbols[0].barFiles['4h'], { planned: 22, verified: 21, not_published: 1, not_downloaded: 0, failed: 0 });
  assert.deepEqual(summary.symbols[0].barFiles['1d'], { planned: 22, verified: 21, not_published: 0, not_downloaded: 1, failed: 0 });
  // The 1h rows of the bars whose file is absent have no bar row.
  assert.deepEqual(summary.symbols[0].bars, { '4h': { checked: 6, equal: 6, e2: 0, short: 1, noReference: 6, referenceOnly: 0 },
    '1d': { checked: 1, equal: 1, e2: 0, short: 1, noReference: 1, referenceOnly: 0 } });
  assert.equal(fs.readFileSync(w.e2, 'utf8'), `${E2_CSV_HEADER}\n`);
  const twice = { ...BAR_ROWS, 'HYPEUSDT-4h-2025-07.zip': [ms('2025-07-01T04:00:00.000Z'), ms('2025-07-02T00:00:00.000Z')] };
  const both = workspace({ bars: twice });
  const r = await run(both.args);
  assert.equal(r.code, 1);
  assert.match(r.summary.symbols[0].failures.join('\n'), /the 4h row 2025-07-01T04:00:00\.000Z is in two files/);
  assert.equal(fs.existsSync(both.out), false);
  assert.equal(fs.existsSync(both.e2), false);
});

test('E1 cli: a 1h file not published or not downloaded exits 3 and lists it; a 1h row without minutes counts as referenceOnly', async () => {
  const marker = zipRoot => {
    const file = path.join(zipRoot, path.dirname(FILLED_1H.file), '404', FILLED_1H.zipName);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '404 on the zip and its CHECKSUM\n');
  };
  const w = workspace({ skip: ['HYPEUSDT-1h-2025-07-01.zip', 'HYPEUSDT-1h-2025-08.zip'], extra: [marker] });
  const { code, summary } = await run(w.args);
  assert.equal(code, 3);
  assert.equal(summary.status, 'incomplete');
  assert.deepEqual(summary.symbols[0].absentFiles, [{ file: 'data/futures/um/daily/klines/HYPEUSDT/1h/HYPEUSDT-1h-2025-07-01.zip', reason: 'not_published' },
    { file: 'data/futures/um/monthly/klines/HYPEUSDT/1h/HYPEUSDT-1h-2025-08.zip', reason: 'not_downloaded' }]);
  assert.deepEqual(summary.symbols[0].hourFiles, { planned: 22, verified: 20, not_published: 1, not_downloaded: 1, failed: 0 });
  assert.deepEqual(summary.symbols[0].hours, { checked: 24, equal: 24, e1: 0, short: 1, noReference: 28, referenceOnly: 0 });
  assert.equal(fs.readFileSync(w.out, 'utf8'), `${CSV_HEADER}\n`);
  const extraRow = { ...HOUR_ROWS, 'HYPEUSDT-1h-2025-09.zip': [ms('2025-09-10T00:00:00.000Z')] };
  const r = await run(workspace({ rows: extraRow }).args);
  assert.equal(r.code, 0);
  assert.equal(r.summary.symbols[0].hours.referenceOnly, 1);
});

test('E1 cli: two local versions of a 1h file or a row in two 1h files fail (exit 1) and write no list; usage errors exit 2', async () => {
  const second = zipRoot => {
    const src = planReferences('HYPE').find(s => s.zipName === 'HYPEUSDT-1h-2025-06.zip');
    const zip = makeZip([{ name: src.csvName, data: KLINE_HEADER + '\n' }]);
    storeSource(zipRoot, src, zip, checksumText(zip, src.zipName));
  };
  const w = workspace({ extra: [second] });
  const two = await run(w.args);
  assert.equal(two.code, 1);
  assert.equal(two.summary.status, 'failed');
  assert.match(two.summary.symbols[0].failures.join('\n'), /HYPEUSDT-1h-2025-06\.zip: 2 local versions/);
  assert.equal(fs.existsSync(w.out), false);
  const twice = { ...HOUR_ROWS, 'HYPEUSDT-1h-2025-07.zip': [ms('2025-07-01T05:00:00.000Z'), ms('2025-07-02T00:00:00.000Z')] };
  const both = await run(workspace({ rows: twice }).args);
  assert.equal(both.code, 1);
  assert.match(both.summary.symbols[0].failures.join('\n'), /the 1h row 2025-07-01T05:00:00\.000Z is in two files/);
  for (const argv of [['compare'], ['--symbols', 'BTCUSDT'], ['--symbols', 'HYPE,HYPE'], ['--max-rss-mib', '1024'], ['--max-rss-mib', '0'], ['--from', '2025-05'], ['--out']]) {
    const { code, summary } = await run(argv);
    assert.equal(code, 2, argv.join(' '));
    assert.equal(summary.status, 'usage');
  }
});

test('E1 cli: the memory guard aborts the whole run through the check seam', async () => {
  const w = workspace();
  const aborted = await run(w.args, label => { if (label.startsWith('e1 HYPEUSDT 2025-07')) throw new Error(`memory ceiling exceeded: 600 MiB > 512 MiB at ${label}`); });
  assert.equal(aborted.code, 1);
  assert.match(aborted.summary.error, /^memory ceiling exceeded: 600 MiB > 512 MiB at e1 HYPEUSDT 2025-07/);
  assert.equal(aborted.summary.symbols, undefined);
  assert.equal(fs.existsSync(w.out), false);
});
