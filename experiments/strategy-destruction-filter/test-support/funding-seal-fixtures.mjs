// Synthetic funding fixtures only; the rate token is a placeholder.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FUNDING_HEADER, HOUR_MS } from '../src/f1-funding.mjs';
import { fundingSource, planFundingUnits, visionInstrument } from '../src/vision-source.mjs';
import { storeSource, recordMissing, localVersions } from '../src/f1-1m-store.mjs';
import { makeZip, checksumText } from './vision-fixtures.mjs';

export const RATE = '0.00012345', MARK = '0.00077777';
export const at = Date.parse;
export const MONTHS = [...new Set(planFundingUnits('BTC').map(u => u.sources[0].zipName.slice(-11, -4)))];
export const HOLDOUT = ['2025-10 sealed part', ...MONTHS.filter(m => m > '2025-10')];
export const start = m => at(`${m}-01T00:00:00Z`);
export const end = m => Date.UTC(+m.slice(0, 4), +m.slice(5), 1);
export const sourceOf = (m, symbol = 'BTC') => fundingSource(visionInstrument(symbol), m);
export const rows = (from, to, step = 8) => {
  const out = [];
  for (let t = from; t < to; t += step * HOUR_MS) out.push(`${t + 1},${step},${RATE}`);
  return out;
};
export const csv = lines => Buffer.from(`${FUNDING_HEADER}\n${lines.map(l => `${l}\n`).join('')}`);
export const fullRows = m => rows(start(m), end(m));
export const without = (list, iso) => list.filter(r => !r.startsWith(String(at(iso) + 1)));
export function workspace(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'funding-seal-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return { dir, zipRoot: path.join(dir, 'data', 'vision'), args: ['--symbols', 'BTC', '--data-dir', path.join(dir, 'data'), '--manifest', path.join(dir, 'none.json')] };
}
export function putBytes(zipRoot, month, data, zipOptions, symbol = 'BTC') {
  const source = sourceOf(month, symbol), zip = makeZip([{ name: source.csvName, data }], zipOptions);
  const { sha256 } = storeSource(zipRoot, source, zip, checksumText(zip, source.zipName));
  return { source, zip, file: path.join(zipRoot, path.dirname(source.file), sha256, source.zipName) };
}
export const put = (zipRoot, month, lines = fullRows(month), symbol = 'BTC') => putBytes(zipRoot, month, csv(lines), undefined, symbol);
export function storeAll(zipRoot, overrides = {}, symbol = 'BTC') {
  for (const m of MONTHS) if (overrides[m] !== null) put(zipRoot, m, overrides[m] ?? fullRows(m), symbol);
}
export function storedFile(zipRoot, month) {
  const s = sourceOf(month);
  return path.join(zipRoot, path.dirname(s.file), localVersions(zipRoot, s)[0], s.zipName);
}
export function missingResearch(zipRoot) {
  for (const m of MONTHS.filter(m => m <= '2025-10')) recordMissing(zipRoot, sourceOf(m));
}
export const FULL = { instrument: { exchange: 'binance', market: 'linear_perpetual', contract: 'BTCUSDT' }, dataStart: '2021-10-18T00:00:00.000Z', dataEnd: '2025-10-17T00:00:00.000Z' };
export async function cli(main, command, w, deps = {}) {
  let out = '';
  const code = await main([command, ...w.args], { stdout: { write: s => { out += s; } }, sleep: async () => {}, ...deps });
  return { code, summary: JSON.parse(out) };
}
export const stableCli = ({ memory, runtime, ...rest }) => rest;
export const results = s => Object.fromEntries(s.holdout.map(u => [u.unit, u.result]));
export const failedUnits = s => Object.entries(results(s)).filter(([, v]) => v === 'fail').map(([k]) => k);
