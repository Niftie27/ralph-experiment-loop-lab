// Fixed data windows and append-only experiment provenance. No network here.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const ROOT = new URL('../', import.meta.url);
export const PERIODS = Object.freeze({
  research: ['2021-10-18T00:00:00.000Z', '2025-10-17T00:00:00.000Z'],
  holdout: ['2025-10-17T00:00:00.000Z', '2026-10-17T00:00:00.000Z']
});
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const pathsFor = config => ({
  cache: config.h2Paths?.cache ?? new URL('data/market-cache/h2/', ROOT),
  manifest: config.h2Paths?.manifest ?? new URL('results/manifest-h2.json', ROOT),
  registry: config.h2Paths?.registry ?? new URL('results/variant-registry.jsonl', ROOT)
});
export function windowFor(config = {}) {
  const period = config.period ?? 'research';
  if (!PERIODS[period]) throw new Error(`Unknown period: ${period}`);
  const [min, max] = PERIODS[period].map(Date.parse);
  const dataStart = config.dataStart ?? PERIODS[period][0];
  const dataEnd = config.dataEnd ?? PERIODS[period][1];
  for (const value of [dataStart, dataEnd]) {
    if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Window requires UTC ISO timestamps');
  }
  const start = Date.parse(dataStart), end = Date.parse(dataEnd);
  if (!(min <= start && start < end && end <= max)) throw new Error('Window must stay inside its locked period');
  return { period, dataStart, dataEnd, start: start / 1000, end: end / 1000 };
}
export function selectWindow(candles, config) {
  const { start, end } = windowFor(config);
  return candles.filter(c => c.time >= start && c.time < end);
}
export function registryRows(file) {
  try { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
export function identityFor(variant, symbol, timeframe, config) {
  return { candidateId: variant.candidateId, variantId: variant.variantId, params: variant.params ?? {},
    symbol, timeframe: timeframe.id, entryMode: config.entryMode ?? 'signal_close', costs: config.costs,
    risk: config.risk, maxBars: timeframe.maxBars };
}
export function guardHoldout(config, identity) {
  const window = windowFor(config);
  if (window.period !== 'holdout') return;
  if (!process.argv.includes('--final')) throw new Error('Holdout requires explicit --final');
  const rows = registryRows(pathsFor(config).registry);
  if (!rows.some(row => row.period?.name === 'research' && canonical(row.identity) === canonical(identity))) {
    throw new Error('Holdout requires an existing research registry entry for this exact variant identity');
  }
}
export function appendRegistry(file, row) {
  fs.mkdirSync(path.dirname(file instanceof URL ? file.pathname : file), { recursive: true });
  // O_APPEND: never truncate, replace, deduplicate, or remove an old row.
  fs.appendFileSync(file, JSON.stringify(row) + '\n', { flag: 'a' });
}
export function distinctVariants(rows) {
  const families = new Map();
  for (const row of rows) {
    const key = row.candidateFamily ?? row.candidateId;
    if (!families.has(key)) families.set(key, new Set());
    families.get(key).add(`${row.candidateId}:${row.variantId}`);
  }
  return Object.fromEntries([...families].map(([family, ids]) => [family, ids.size]));
}
export function freezeSeries(candles, symbol, timeframe, config) {
  const selected = selectWindow(candles, config);
  if (!selected.length) throw new Error(`Empty fixed window: ${symbol} ${timeframe}`);
  for (let i = 0; i < selected.length; i++) {
    const c = selected[i];
    if (!['time', 'open', 'high', 'low', 'close', 'volume'].every(k => Number.isFinite(c[k])) || c.low <= 0 || c.volume < 0 || c.low > Math.min(c.open, c.close) || c.high < Math.max(c.open, c.close) || (i && c.time <= selected[i - 1].time)) throw new Error(`Invalid OHLCV series: ${symbol} ${timeframe}`);
  }
  const bytes = JSON.stringify(selected) + '\n';
  const hash = sha256(bytes);
  const paths = pathsFor(config);
  fs.mkdirSync(paths.cache, { recursive: true });
  const filename = `${hash}.json`;
  const file = path.join(paths.cache instanceof URL ? paths.cache.pathname : paths.cache, filename);
  if (fs.existsSync(file)) {
    if (sha256(fs.readFileSync(file)) !== hash) throw new Error('Snapshot hash mismatch');
  } else fs.writeFileSync(file, bytes, { flag: 'wx', mode: 0o444 });
  const w = windowFor(config);
  const entry = { symbol, timeframe, dataStart: w.dataStart, dataEnd: w.dataEnd, snapshot: `data/market-cache/h2/${filename}`,
    firstCandle: new Date(selected[0].time * 1000).toISOString(), lastCandle: new Date(selected.at(-1).time * 1000).toISOString(), count: selected.length, sha256: hash };
  let manifest = { schemaVersion: 1, periods: PERIODS, series: [] };
  if (fs.existsSync(paths.manifest)) manifest = JSON.parse(fs.readFileSync(paths.manifest, 'utf8'));
  const same = manifest.series.find(s => s.symbol === symbol && s.timeframe === timeframe && s.dataStart === w.dataStart && s.dataEnd === w.dataEnd);
  if (same && same.sha256 !== hash) throw new Error('Fixed series already frozen with different bytes');
  if (!same) {
    manifest.series.push(entry);
    fs.mkdirSync(path.dirname(paths.manifest instanceof URL ? paths.manifest.pathname : paths.manifest), { recursive: true });
    fs.writeFileSync(paths.manifest, JSON.stringify(manifest, null, 2) + '\n');
  }
  return { candles: Object.freeze(selected.map(c => Object.freeze({ ...c }))), entry,
    manifestSha256: sha256(fs.readFileSync(paths.manifest)) };
}
export function cachedSeries(symbol, timeframe, config) {
  const paths = pathsFor(config), w = windowFor(config);
  if (!fs.existsSync(paths.manifest)) return null;
  const manifest = JSON.parse(fs.readFileSync(paths.manifest, 'utf8'));
  const entry = manifest.series.find(s => s.symbol === symbol && s.timeframe === timeframe && s.dataStart === w.dataStart && s.dataEnd === w.dataEnd);
  if (!entry) return null;
  const file = path.join(paths.cache instanceof URL ? paths.cache.pathname : paths.cache, `${entry.sha256}.json`);
  const bytes = fs.readFileSync(file);
  if (sha256(bytes) !== entry.sha256) throw new Error('Snapshot hash mismatch');
  return { candles: JSON.parse(bytes), meta: { source: 'h2-frozen-snapshot', ...entry } };
}
