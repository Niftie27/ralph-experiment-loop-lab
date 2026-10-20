// F1a-2 research 1m reader (docs/f1/f1a-2-contract.md, A6, A7): the only public read path for 1m snapshots.
// The holdout is refused always (until F1c replaces the refusal with the real guard). Every unit is checked in full
// (hash, header against manifest, every open_time inside its unit and the research period) before any slicing.
// Results are frozen objects holding fresh Float64Array copies; errors carry times and hashes, never prices.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { PERIODS } from './h2-contract.mjs';
import { decodeSnapshot, canonicalJson, COLUMNS } from './f1-1m-format.mjs';
import { readManifest, snapshotPath } from './f1-1m-store.mjs';
import { planUnits, VISION_SYMBOLS } from './vision-source.mjs';

const RESEARCH = PERIODS.research.map(Date.parse);
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.000Z$/;
const SYMBOL_OF = Object.fromEntries(Object.entries(VISION_SYMBOLS).map(([symbol, contract]) => [contract, symbol]));
const fail = message => { throw new Error(`1m reader: ${message}`); };
const keysAre = (object, keys) => object && typeof object === 'object' && Object.keys(object).sort().join() === [...keys].sort().join();
const isoTime = s => typeof s === 'string' && ISO.test(s) && new Date(Date.parse(s)).toISOString() === s;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const monthOf = t => new Date(t).toISOString().slice(0, 7);

function checkRequest(request) {
  if (!keysAre(request, ['instrument', 'dataStart', 'dataEnd'])) fail('request must have exactly instrument, dataStart and dataEnd');
  const { instrument, dataStart, dataEnd } = request;
  if (!keysAre(instrument, ['exchange', 'market', 'contract']) || ![instrument.exchange, instrument.market, instrument.contract].every(v => typeof v === 'string' && v)) fail('incomplete instrument');
  if (instrument.exchange !== 'binance' || instrument.market !== 'linear_perpetual' || !SYMBOL_OF[instrument.contract]) fail('unsupported instrument (Binance USD-M Vision contracts only)');
  if (!isoTime(dataStart) || !isoTime(dataEnd)) fail('dataStart and dataEnd must be ISO strings with .000Z');
  const start = Date.parse(dataStart), end = Date.parse(dataEnd);
  if (!(start < end)) fail('empty window: dataStart must be before dataEnd');
  if (start < RESEARCH[0] || end > RESEARCH[1]) fail(`window outside the research window ${PERIODS.research.join('..')}: the holdout is sealed until F1c, later data is sealed`);
  return { instrument: { exchange: instrument.exchange, market: instrument.market, contract: instrument.contract }, start, end };
}
const lowerBound = (t, value) => { let lo = 0, hi = t.length; while (lo < hi) { const mid = (lo + hi) >>> 1; if (t[mid] < value) lo = mid + 1; else hi = mid; } return lo; };

export function openResearch1m(options) {
  if (!options || typeof options !== 'object' || Object.keys(options).some(k => !['manifestPath', 'cacheDir', 'capacity'].includes(k))
    || typeof options.manifestPath !== 'string' || typeof options.cacheDir !== 'string') fail('options must be manifestPath, cacheDir and an optional capacity');
  const capacity = options.capacity ?? 1;
  if (!Number.isSafeInteger(capacity) || capacity < 1) fail('option capacity must be a positive integer');
  const { manifestPath, cacheDir } = options;
  const verified = new Map(); // expected sha256 -> verified bytes, least recently used first

  function verifiedBytes(entry) {
    if (verified.has(entry.sha256)) {
      const bytes = verified.get(entry.sha256);
      verified.delete(entry.sha256); verified.set(entry.sha256, bytes);
      return bytes;
    }
    const bytes = fs.readFileSync(snapshotPath(cacheDir, entry.sha256));
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) fail(`snapshot ${entry.sha256} (${entry.contract} ${entry.dataStart}) fails its hash check`);
    verified.set(entry.sha256, bytes);
    while (verified.size > capacity) verified.delete(verified.keys().next().value);
    return bytes;
  }
  function loadUnit(entry) {
    const { header, columns } = decodeSnapshot(verifiedBytes(entry));
    const agree = canonicalJson(header.instrument) === canonicalJson({ exchange: entry.exchange, market: entry.market, contract: entry.contract })
      && header.period === entry.period && header.dataStart === entry.dataStart && header.dataEnd === entry.dataEnd && header.rowCount === entry.rowCount
      && header.firstOpenTime === entry.firstOpenTime && header.lastOpenTime === entry.lastOpenTime && header.schemaVersion === entry.schemaVersion
      && canonicalJson(header.sources) === canonicalJson(entry.sources);
    if (!agree) fail(`snapshot ${entry.sha256} header disagrees with its manifest entry`);
    const lo = Math.max(Date.parse(entry.dataStart), RESEARCH[0]), hi = Math.min(Date.parse(entry.dataEnd), RESEARCH[1]);
    const t = columns.open_time;
    for (let i = 0; i < t.length; i++) {
      if (!Number.isSafeInteger(t[i]) || t[i] % 60000 !== 0 || (i && t[i] <= t[i - 1])) fail(`snapshot ${entry.sha256}: open_time not aligned and strictly increasing at row ${i + 1}`);
      if (t[i] < lo || t[i] >= hi) fail(`snapshot ${entry.sha256}: an open_time lies outside its unit window or the research period (holdout sealed)`);
    }
    return columns;
  }

  function read(request) {
    const { instrument, start, end } = checkRequest(request);
    const units = planUnits(SYMBOL_OF[instrument.contract], { from: monthOf(start), to: monthOf(end - 1) })
      .filter(u => u.period === 'research' && u.startMs < end && u.endMs > start);
    const entries = readManifest(manifestPath).entries.filter(e => e.exchange === instrument.exchange && e.market === instrument.market && e.contract === instrument.contract
      && Date.parse(e.dataStart) < end && Date.parse(e.dataEnd) > start);
    for (const e of entries) {
      if (e.period !== 'research' || Date.parse(e.dataStart) < RESEARCH[0] || Date.parse(e.dataEnd) > RESEARCH[1]) fail(`entry ${e.sha256} overlaps the window but is not inside the research period (holdout sealed)`);
      if (!units.some(u => u.dataStart === e.dataStart && u.dataEnd === e.dataEnd)) fail(`entry ${e.sha256} does not match a unit of the window`);
    }
    const parts = [];
    for (const unit of units) {
      const candidates = entries.filter(e => e.dataStart === unit.dataStart && e.dataEnd === unit.dataEnd);
      if (!candidates.length) fail(`no entry for unit ${instrument.contract} ${unit.dataStart}..${unit.dataEnd} (coverage gap)`);
      if (candidates.length > 1) fail(`ambiguous: ${candidates.length} entries for unit ${instrument.contract} ${unit.dataStart}..${unit.dataEnd}`);
      const columns = loadUnit(candidates[0]);
      const i = lowerBound(columns.open_time, start), j = lowerBound(columns.open_time, end);
      parts.push({ entry: candidates[0], columns, i, j });
    }
    const rowCount = parts.reduce((n, p) => n + p.j - p.i, 0);
    const out = {};
    for (const { name } of COLUMNS) {
      const col = new Float64Array(rowCount);
      let offset = 0;
      for (const p of parts) { col.set(p.columns[name].subarray(p.i, p.j), offset); offset += p.j - p.i; }
      out[name] = col;
    }
    return Object.freeze({ instrument: Object.freeze(instrument), dataStart: request.dataStart, dataEnd: request.dataEnd, rowCount, columns: Object.freeze(out),
      units: Object.freeze(parts.map(p => Object.freeze({ sha256: p.entry.sha256, dataStart: p.entry.dataStart, dataEnd: p.entry.dataEnd }))) });
  }
  return Object.freeze({ read, stats: () => ({ cachedUnits: verified.size }) });
}
