// F1a-4: funding-rate history (docs/f1/f1a-4-contract.md with amendment 1). Synthetic rows with placeholder rates only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fundingSource, planFundingUnits, visionInstrument } from '../src/vision-source.mjs';
import { parseFunding, parseFundingZip, canonicalRate, FUNDING_HEADER, SEAL_MS } from '../src/f1-funding.mjs';
import { makeZip, checksumText } from '../test-support/vision-fixtures.mjs';

const HOUR = 3600000;
const at = iso => Date.parse(iso);
const BTC = visionInstrument('BTC');
const RATE = '0.00012345', MARK = '0.00077777';
const row = (calc, h = 8, rate = RATE) => `${calc},${h},${rate}`;
const csv = (rows, { header = true } = {}) => Buffer.from((header ? FUNDING_HEADER + '\n' : '') + rows.map(r => `${r}\n`).join(''));
const parse = (rows, month = '2024-03', options) => parseFunding(csv(rows), fundingSource(BTC, month), options);
const hours = (startIso, count, step = 8, offset = 1) => Array.from({ length: count }, (_, i) => at(startIso) + i * step * HOUR + offset);

test('F1a-4 paths: fundingSource names the Vision monthly fundingRate file of a contract and month', () => {
  const s = fundingSource(BTC, '2024-03');
  assert.deepEqual(s, {
    file: 'data/futures/um/monthly/fundingRate/BTCUSDT/BTCUSDT-fundingRate-2024-03.zip',
    checksumFile: 'data/futures/um/monthly/fundingRate/BTCUSDT/BTCUSDT-fundingRate-2024-03.zip.CHECKSUM',
    zipName: 'BTCUSDT-fundingRate-2024-03.zip', csvName: 'BTCUSDT-fundingRate-2024-03.csv', kind: 'monthly',
    startMs: at('2024-03-01T00:00:00Z'), endMs: at('2024-04-01T00:00:00Z') });
  assert.equal(fundingSource(visionInstrument('HYPE'), '2025-05').zipName, 'HYPEUSDT-fundingRate-2025-05.zip');
  assert.throws(() => fundingSource(BTC, '2024-13'), error => error.usage === true);
});

test('F1a-4 paths: planFundingUnits plans 2021-10..2026-09, splits 2025-10 at 2025-10-17 and never plans 2026-10', () => {
  for (const symbol of ['BTC', 'HYPE']) {
    const units = planFundingUnits(symbol);
    assert.equal(units.length, 61, symbol);
    assert.deepEqual([units[0].dataStart, units[0].dataEnd, units[0].sources[0].zipName.slice(-11)], ['2021-10-18T00:00:00.000Z', '2021-11-01T00:00:00.000Z', '2021-10.zip']);
    assert.equal(units[0].sources[0].startMs, at('2021-10-01T00:00:00Z'));
    const oct25 = units.filter(u => u.sources[0].zipName.endsWith('2025-10.zip'));
    assert.deepEqual(oct25.map(u => [u.period, u.dataStart, u.dataEnd]), [['research', '2025-10-01T00:00:00.000Z', '2025-10-17T00:00:00.000Z'],
      ['holdout', '2025-10-17T00:00:00.000Z', '2025-11-01T00:00:00.000Z']]);
    assert.equal(oct25[0].sources, oct25[1].sources);
    assert.deepEqual([units.at(-1).period, units.at(-1).dataEnd, units.at(-1).sources[0].zipName.slice(-11)], ['holdout', '2026-10-01T00:00:00.000Z', '2026-09.zip']);
    assert.ok(units.every(u => u.sources.length === 1 && u.sources[0].kind === 'monthly' && u.instrument.contract === visionInstrument(symbol).contract));
    assert.equal(units.filter(u => u.period === 'research').length, 49);
  }
});

test('F1a-4 parser: the exact header and the numeric first-row variant give the same columns; another header fails', () => {
  const rows = hours('2024-03-01T00:00:00Z', 3).map(t => row(t));
  const a = parse(rows), b = parseFunding(csv(rows, { header: false }), fundingSource(BTC, '2024-03'));
  assert.equal(a.rowCount, 3);
  assert.deepEqual([...a.columns.settlementTime], hours('2024-03-01T00:00:00Z', 3, 8, 0));
  assert.deepEqual([...a.columns.calcTime], hours('2024-03-01T00:00:00Z', 3));
  assert.deepEqual([...a.columns.intervalHours], [8, 8, 8]);
  assert.deepEqual([...a.columns.rate], [0.00012345, 0.00012345, 0.00012345]);
  assert.deepEqual(a.rateDecimal, [RATE, RATE, RATE]);
  assert.deepEqual([b.rowCount, [...b.columns.calcTime], b.rateDecimal], [a.rowCount, [...a.columns.calcTime], a.rateDecimal]);
  assert.ok(Object.isFrozen(a) && Object.isFrozen(a.columns) && Object.isFrozen(a.rateDecimal));
  assert.equal(parse([]).rowCount, 0); // header only: parses; the empty listed file is a coverage stop (verify)
  for (const header of ['calc_time,funding_interval_hours,last_funding_rate,x', 'calc_time;funding_interval_hours;last_funding_rate', 'CALC_TIME,funding_interval_hours,last_funding_rate'])
    assert.throws(() => parseFunding(Buffer.from(`${header}\n${row(hours('2024-03-01T00:00:00Z', 1)[0])}\n`), fundingSource(BTC, '2024-03')), /header/);
});

test('F1a-4 parser: a row needs exactly 3 fields and a 13-digit calc_time inside the file month', () => {
  const t = hours('2024-03-02T00:00:00Z', 1)[0];
  for (const bad of [`${t},8`, `${t},8,${RATE},0`, `${String(t).slice(1)},8,${RATE}`, `${t}0,8,${RATE}`, `${t}.0,8,${RATE}`, ` ${t},8,${RATE}`])
    assert.throws(() => parse([bad]), /fundingRate-2024-03\.zip: row 2/, bad);
  for (const outside of [at('2024-02-29T16:00:00Z') + 1, at('2024-04-01T00:00:00Z') + 1]) assert.throws(() => parse([row(outside)]), /outside the file month/);
});

test('F1a-4 parser: calc_time remainders 0, 47 and 14,999 ms pass; 15,000 ms and a time just before the hour fail', () => {
  for (const offset of [0, 47, 14999]) {
    const p = parse([row(at('2024-03-01T08:00:00Z') + offset)]);
    assert.deepEqual([p.columns.settlementTime[0], p.columns.calcTime[0]], [at('2024-03-01T08:00:00Z'), at('2024-03-01T08:00:00Z') + offset]);
  }
  for (const t of [at('2024-03-01T08:00:15Z'), at('2024-03-01T08:00:00Z') - 10]) assert.throws(() => parse([row(t)]), /15,000 ms/);
});

test('F1a-4 parser: intervals 1, 2, 4 and 8 pass; 0, 3, 6, 12, 24 and other spellings fail', () => {
  for (const h of [1, 2, 4, 8]) assert.equal(parse([row(at('2024-03-01T08:00:00Z'), h)]).columns.intervalHours[0], h);
  for (const h of ['0', '3', '6', '12', '24', '08', '8.0', '', '-8']) assert.throws(() => parse([row(at('2024-03-01T08:00:00Z'), h)]), /interval/, h);
});

test('F1a-4 parser: exponent and plain spellings of one rate give the same canonical decimal and Number', () => {
  const [t1, t2, t3] = hours('2024-03-01T00:00:00Z', 3);
  const p = parse([row(t1, 8, '-3.1E-7'), row(t2, 8, '-0.00000031'), row(t3, 8, '-31e-8')]);
  assert.deepEqual(p.rateDecimal, ['-0.00000031', '-0.00000031', '-0.00000031']);
  assert.deepEqual([...p.columns.rate], [-3.1e-7, -3.1e-7, -3.1e-7]);
  for (const token of ['100E-10', '1.0E-8', '0.00000001', '0.0000000100']) assert.deepEqual(canonicalRate(token), { decimal: '0.00000001', places: 8 }, token);
  for (const token of ['-0', '-0.0', '0E-5', '-0.00000000', '0']) assert.deepEqual(canonicalRate(token), { decimal: '0', places: 0 }, token);
  assert.equal(Object.is(parse([row(t1, 8, '-0.0')]).columns.rate[0], 0), true);
  assert.deepEqual(canonicalRate('1.5E+2'), { decimal: '150', places: 0 });
  assert.deepEqual(canonicalRate('-12.50'), { decimal: '-12.5', places: 1 });
  for (const token of ['0.000000001', '1E-9', '12.3456789E-2']) assert.throws(() => canonicalRate(token), /more than 8 exact decimal places/, token);
  for (const token of ['', '1.', '.5', '+1', '1e', '1E', 'abc', '0x1', '1,0', '1.2.3', 'NaN', 'Infinity', '- 1', '1E400', '9'.repeat(400)])
    assert.throws(() => canonicalRate(token), /rate/, token);
  assert.throws(() => parse([row(t1, 8, '1E-9')]), /fundingRate-2024-03\.zip: row 2: .*more than 8 exact decimal places/);
});

test('F1a-4 parser: a row not after its predecessor in source order and two rows in one settlement hour fail the file', () => {
  const [t1, t2] = hours('2024-03-01T00:00:00Z', 2);
  assert.throws(() => parse([row(t2), row(t1)]), /row 3: calc_time not after the previous row/);
  assert.throws(() => parse([row(t1), row(t1)]), /row 3: calc_time not after the previous row/);
  assert.throws(() => parse([row(t1), row(t1 + 5)]), /row 3: two rows in one settlement hour/);
});

test('F1a-4 parser: a missing final newline, a CRC error, a wrong member name and a CHECKSUM mismatch fail', () => {
  const s = fundingSource(BTC, '2024-03'), data = csv([row(hours('2024-03-01T00:00:00Z', 1)[0])]);
  assert.throws(() => parseFunding(data.subarray(0, data.length - 1), s), /newline/);
  const good = makeZip([{ name: s.csvName, data }]);
  assert.equal(parseFundingZip(good, checksumText(good, s.zipName), s).rowCount, 1);
  const crc = makeZip([{ name: s.csvName, data }], { crc: 1 });
  assert.throws(() => parseFundingZip(crc, checksumText(crc, s.zipName), s), /CRC32/);
  const named = makeZip([{ name: 'BTCUSDT-fundingRate-2024-02.csv', data }]);
  assert.throws(() => parseFundingZip(named, checksumText(named, s.zipName), s), /unexpected member/);
  assert.throws(() => parseFundingZip(good, checksumText(crc, s.zipName), s), /sha256 mismatch/);
});

test('F1a-4 seal: sealed rows are routed by calc_time only; poison tokens neither fail nor appear in a research parse', () => {
  assert.equal(SEAL_MS, at('2025-10-17T00:00:00Z'));
  const research = hours('2025-10-16T00:00:00Z', 3).map(t => row(t));
  const sealedTimes = [at('2025-10-17T00:00:00.002Z'), at('2025-10-17T05:00:00Z') + 9, at('2025-10-17T05:00:00Z') + 11];
  const sealed = sealedTimes.map(t => `${t},${MARK},${MARK},${MARK}`);
  const p = parse([...research, ...sealed], '2025-10');
  assert.equal(p.rowCount, 3);
  assert.deepEqual([...p.columns.settlementTime], hours('2025-10-16T00:00:00Z', 3, 8, 0));
  const text = JSON.stringify([p, [...p.columns.calcTime], [...p.columns.settlementTime], [...p.columns.rate], [...p.columns.intervalHours]]);
  assert.ok(!text.includes(MARK) && !text.includes('7777'));
  for (const t of sealedTimes) assert.ok(![...p.columns.calcTime, ...p.columns.settlementTime].some(x => x >= SEAL_MS) && !text.includes(String(t)));
  // A settlement at 2025-10-17T00:00:00.002Z is holdout: it never enters research columns, even with valid fields.
  assert.equal(parse([...research, row(at('2025-10-17T00:00:00.002Z'))], '2025-10').rowCount, 3);
});

test('F1a-4 seal: an unreadable or disordered calc_time in the sealed part fails the file naming only the file and "sealed part"', () => {
  const research = hours('2025-10-16T00:00:00Z', 3).map(t => row(t));
  const s1 = at('2025-10-17T08:00:00Z') + 3, s2 = at('2025-10-17T16:00:00Z') + 4;
  for (const rows of [[...research, `${s1},${MARK}`, `x${MARK},8,${MARK}`], [...research, `1760${MARK}0,8,${MARK}`], [...research, `${s2},8,${MARK}`, `${s1},8,${MARK}`],
    [...research, `${s1},8,${MARK}`, `${at('2025-10-16T20:00:00Z')},8,${RATE}`], [...research, `${at('2025-11-01T00:00:00Z') + 1},8,${MARK}`]]) {
    let message = '';
    assert.throws(() => parse(rows, '2025-10'), error => { message = error.message; return true; });
    assert.match(message, /^Vision funding: data\/futures\/um\/monthly\/fundingRate\/BTCUSDT\/BTCUSDT-fundingRate-2025-10\.zip: .*sealed part/);
    assert.ok(!/row|\d{4}-\d\d-\d\dT|7777|\d{10}/.test(message.replace('2025-10.zip', '')), message);
  }
});
