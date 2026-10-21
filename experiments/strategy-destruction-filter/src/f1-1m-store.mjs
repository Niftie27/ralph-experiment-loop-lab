// F1a-2 1m snapshot store (docs/f1/f1a-2-contract.md, A4, A5, A10). Privileged side: it reads source zips of every
// period, writes snapshots and the 1m manifest, and reports counts, times and hashes only, never prices.
// Local sources: <zipRoot>/<Vision dir>/<sha256>/<zip> + <zip>.CHECKSUM, one directory per published version.
// Snapshots: <cacheDir>/<sha256>.bin. Manifest: canonical JSON, entries sorted, written atomically under a lock.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { encodeSnapshot, decodeSnapshot, canonicalJson, SCHEMA_VERSION } from './f1-1m-format.mjs';
import { verifyZip, parseChecksum, readZipMember, parseKlines, planUnits, assembleUnit, unitCoverage, unitQuarantine, visionSource, fillSources, mergeUnit,
  QUARANTINE_RULES, VISION_SYMBOLS } from './vision-source.mjs';

export const MANIFEST_KIND = 'binance_vision_kline_1m_manifest';
export const SOURCE = 'binance-vision-archive';
const ENTRY_KEYS = ['bytes', 'contract', 'dataEnd', 'dataStart', 'exchange', 'filledRanges', 'firstOpenTime', 'lastOpenTime', 'market', 'missingMinutes', 'missingRanges',
  'period', 'quarantinedRows', 'rowCount', 'schemaVersion', 'sha256', 'source', 'sources'];
const MINUTE_MS = 60000, DAY_MS = 86400000;
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.000Z$/;
const HEX = /^[0-9a-f]{64}$/;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const snapshotPath = (cacheDir, sha) => path.join(cacheDir, `${sha}.bin`);
const order = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function fsyncDir(dir) { const fd = fs.openSync(dir, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); } }
// Writes bytes once under their final name (temp file, fsync, hard link: never replaces an existing file). An existing
// file must already hold exactly these bytes.
function writeOnce(file, bytes, mode = 0o444) {
  const expected = sha256(bytes);
  if (fs.existsSync(file)) {
    if (sha256(fs.readFileSync(file)) !== expected) throw new Error(`existing file ${path.basename(file)} holds other bytes`);
    return false;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${randomUUID()}`;
  const fd = fs.openSync(tmp, 'wx', mode);
  try { fs.writeSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  try { fs.linkSync(tmp, file); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (sha256(fs.readFileSync(file)) !== expected) throw new Error(`existing file ${path.basename(file)} holds other bytes`);
  } finally { fs.unlinkSync(tmp); }
  fsyncDir(path.dirname(file));
  return true;
}
// Writes bytes under their final name by temp file, fsync and rename, replacing whatever was there.
function replaceFile(file, bytes, mode = 0o444) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${randomUUID()}`;
  const fd = fs.openSync(tmp, 'wx', mode);
  try { fs.writeSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(tmp, file);
  fsyncDir(path.dirname(file));
}

// Local source versions. A zip is stored only after its own CHECKSUM matched, never overwritten. The CHECKSUM is
// written first, so a zip under its final name always has its CHECKSUM beside it; a crash in between leaves a
// CHECKSUM without a zip, which is no version and is completed by the next store.
const versionDir = (zipRoot, source, sha) => path.join(zipRoot, path.dirname(source.file), sha);
// Puts the published CHECKSUM text beside version sha; a missing or different local CHECKSUM is replaced atomically.
// Returns whether it wrote.
export function persistChecksum(zipRoot, source, sha, checksumText) {
  if (parseChecksum(checksumText, source.zipName) !== sha) throw new Error(`Vision CHECKSUM: ${source.checksumFile} does not name ${sha}`);
  const file = path.join(versionDir(zipRoot, source, sha), `${source.zipName}.CHECKSUM`);
  let local;
  try { local = fs.readFileSync(file, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (local === checksumText) return false;
  replaceFile(file, Buffer.from(checksumText));
  return true;
}
export function storeSource(zipRoot, source, zipBytes, checksumText) {
  const sha = verifyZip(zipBytes, checksumText, source.zipName);
  persistChecksum(zipRoot, source, sha, checksumText);
  const stored = writeOnce(path.join(versionDir(zipRoot, source, sha), source.zipName), zipBytes);
  return { sha256: sha, stored };
}
export function localVersions(zipRoot, source) {
  const parent = path.join(zipRoot, path.dirname(source.file));
  let names;
  try { names = fs.readdirSync(parent); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  return names.filter(n => HEX.test(n) && fs.existsSync(path.join(parent, n, source.zipName))).sort(order);
}
// Evidence that both the zip and its CHECKSUM answered 404 (written by download); only such files can be not_listed.
const missingMarker = (zipRoot, source) => path.join(zipRoot, path.dirname(source.file), '404', source.zipName);
export function recordMissing(zipRoot, source) {
  const file = missingMarker(zipRoot, source);
  if (!fs.existsSync(file)) writeOnce(file, Buffer.from('404 on the zip and its CHECKSUM\n'), 0o644);
}
const recordedMissing = (zipRoot, source) => fs.existsSync(missingMarker(zipRoot, source));
// The listing rule (docs/f1/f1a-2-contract.md, amendment 2026-10-21), the one implementation used by download, build
// and compare. Over every source of the instrument in the F1a range, in time order, a missing source is not_listed
// only if (a) it and every earlier source have a recorded 404, (b) none of them exists (local version, manifest entry,
// 200 in this run) and (c) a later source exists. A source of a unit with any present source is never not_listed.
// Evidence outside the requested months counts; missing evidence never counts. Returns the not_listed source files.
// Asymmetric evidence (amendment round 3): for (b) and the unit rule any local version counts, since there it can only
// block not_listed; for (c) a local version counts only if it passes the build's own check (readVerifiedSource),
// checked lazily up to the first later source that is evidence, so a normal run hashes at most one extra zip.
export function notListedSources(symbol, { zipRoot, entries = [], fetched = new Set() }) {
  const units = planUnits(symbol);
  const sources = [...new Map(units.flatMap(u => u.sources).map(s => [s.file, s])).values()];
  const inManifest = new Set(entries.flatMap(e => e.sources.map(s => s.file)));
  const present = new Set(sources.filter(s => fetched.has(s.file) || inManifest.has(s.file) || localVersions(zipRoot, s).length).map(s => s.file));
  const result = new Set();
  if (!present.size) return result; // (c): no file of the instrument exists, so every miss is a gap
  for (const s of sources) {
    if (present.has(s.file) || !recordedMissing(zipRoot, s)) break; // (a) or (b) fails here and for every later source
    result.add(s.file);
  }
  if (!result.size) return result;
  const verified = (s, sha) => { try { readVerifiedSource(zipRoot, s, sha); return true; } catch { return false; } };
  const later = sources.slice(result.size).some(s => fetched.has(s.file) || inManifest.has(s.file) || localVersions(zipRoot, s).some(sha => verified(s, sha)));
  if (!later) return new Set(); // (c) is not proven: a later local version that fails the check is no evidence
  for (const u of units) if (u.sources.some(s => present.has(s.file))) for (const s of u.sources) result.delete(s.file);
  return result;
}
function readVerifiedSource(zipRoot, source, sha) {
  const zipFile = path.join(versionDir(zipRoot, source, sha), source.zipName);
  let checksum;
  try { checksum = fs.readFileSync(`${zipFile}.CHECKSUM`, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const zip = fs.readFileSync(zipFile);
  if (verifyZip(zip, checksum, source.zipName) !== sha) throw new Error(`Vision CHECKSUM: ${source.file} is stored under another sha256`);
  return zip;
}

// Manifest: {entries, kind, schemaVersion}; entries are immutable, unique and sorted by the A5 key.
const unitKey = e => [e.exchange, e.market, e.contract, e.period, e.dataStart, e.dataEnd, e.schemaVersion];
function compareEntries(a, b) {
  const x = [...unitKey(a), a.sha256], y = [...unitKey(b), b.sha256];
  for (let i = 0; i < x.length; i++) { const c = typeof x[i] === 'number' ? x[i] - y[i] : order(x[i], y[i]); if (c) return c; }
  return 0;
}
const sameKey = (a, b) => unitKey(a).every((v, i) => v === unitKey(b)[i]);
function checkEntry(e) {
  const fail = message => { throw new Error(`1m manifest: entry ${e?.contract} ${e?.period} ${e?.dataStart}: ${message}`); };
  if (!e || typeof e !== 'object' || Object.keys(e).sort().join() !== ENTRY_KEYS.join()) fail(`keys must be exactly ${ENTRY_KEYS.join(',')}`);
  if (!['exchange', 'market', 'contract'].every(k => typeof e[k] === 'string' && e[k])) fail('incomplete instrument');
  if (!['research', 'holdout'].includes(e.period)) fail('unknown period');
  if (![e.dataStart, e.dataEnd, e.firstOpenTime, e.lastOpenTime].every(t => typeof t === 'string' && ISO.test(t))) fail('times must be ISO strings with .000Z');
  if (e.schemaVersion !== SCHEMA_VERSION) fail(`unknown schemaVersion ${e.schemaVersion}`);
  if (!HEX.test(e.sha256)) fail('bad sha256');
  if (![e.bytes, e.rowCount].every(n => Number.isSafeInteger(n) && n > 0) || !Number.isSafeInteger(e.missingMinutes) || e.missingMinutes < 0) fail('bad counts');
  if (!Array.isArray(e.missingRanges) || !e.missingRanges.every(r => r && Object.keys(r).sort().join() === 'end,start' && ISO.test(r.start) && ISO.test(r.end))) fail('bad missingRanges');
  if (e.source !== SOURCE) fail(`source must be ${SOURCE}`);
  if (!Array.isArray(e.sources) || !e.sources.length || !e.sources.every(s => s && Object.keys(s).sort().join() === 'file,sha256'
    && typeof s.file === 'string' && /^data\/[A-Za-z0-9_./-]+\.zip$/.test(s.file) && !s.file.includes('..') && HEX.test(s.sha256))) fail('sources must be canonical Vision paths with sha256');
  // Round 5 fields and their consistency with the unit (plan approval point 7). These are consistency checks, not
  // proof: compare, which rebuilds from the sources, stays the authority.
  const unit = plannedUnit(e);
  if (!unit) fail('not a planned unit (contract, period, dataStart, dataEnd)');
  const missing = checkedRanges(e.missingRanges, unit);
  if (!missing) fail('missingRanges must be sorted, maximal, non-empty, minute-aligned ranges inside the unit');
  if (rangeMinutes(missing) !== e.missingMinutes || e.rowCount + e.missingMinutes !== (unit.endMs - unit.startMs) / MINUTE_MS) fail('missing minutes disagree with missingRanges, rowCount or the unit');
  const filled = checkedRanges(e.filledRanges, unit);
  if (!filled) fail('filledRanges must be sorted, maximal, non-empty, minute-aligned ranges inside the unit');
  if (filled.some(([s, t]) => missing.some(([a, b]) => s < b && a < t))) fail('filledRanges overlap missingRanges');
  const files = new Set(e.sources.map(s => s.file));
  if (!Array.isArray(e.quarantinedRows)) fail('quarantinedRows must be a list');
  e.quarantinedRows.forEach((q, i) => {
    if (!q || typeof q !== 'object' || Object.keys(q).sort().join() !== 'file,openTime,rule' || !files.has(q.file) || !isMinute(q.openTime) || !QUARANTINE_RULES.includes(q.rule)) {
      fail('quarantinedRows records need exactly file (one of the sources), openTime (ISO on a whole minute) and a known rule');
    }
    const t = Date.parse(q.openTime);
    if (!missing.some(([a, b]) => a <= t && t < b)) fail('a quarantined minute must lie in missingRanges');
    const p = e.quarantinedRows[i - 1];
    if (p && (order(p.openTime, q.openTime) || order(p.file, q.file)) >= 0) fail('quarantinedRows must be sorted by openTime, then file, without duplicates');
  });
  const base = new Set(unit.sources.map(s => s.file));
  if (![...base].every(f => files.has(f))) fail('sources must include the base sources of the unit');
  const fills = e.sources.filter(s => !base.has(s.file));
  if (unit.sources[0].kind !== 'monthly') {
    if (fills.length || filled.length) fail('a unit built from base dailies has no fill sources or filledRanges');
    return;
  }
  const touches = (ranges, d) => ranges.some(([a, b]) => d < b && d + DAY_MS > a);
  const dayOf = new Map();
  for (let d = unit.startMs; d < unit.endMs; d += DAY_MS) dayOf.set(visionSource(unit.instrument, 'daily', d).file, d);
  for (const s of fills) if (!dayOf.has(s.file) || !touches([...missing, ...filled], dayOf.get(s.file))) fail('a fill source must be the daily of a unit day without a monthly candle');
  for (const [file, d] of dayOf) if (touches(filled, d) && !files.has(file)) fail('a filled day needs its daily in sources');
}
const isMinute = t => typeof t === 'string' && ISO.test(t) && new Date(Date.parse(t)).toISOString() === t && Date.parse(t) % MINUTE_MS === 0;
// Sorted, maximal (never adjacent), non-empty, minute-aligned [start, end) ranges inside the unit, as [startMs, endMs]
// pairs; null if the list is anything else.
function checkedRanges(list, unit) {
  if (!Array.isArray(list)) return null;
  const out = [];
  for (const r of list) {
    if (!r || typeof r !== 'object' || Object.keys(r).sort().join() !== 'end,start' || !isMinute(r.start) || !isMinute(r.end)) return null;
    const a = Date.parse(r.start), b = Date.parse(r.end);
    if (a >= b || a < unit.startMs || b > unit.endMs || (out.length && a <= out.at(-1)[1])) return null;
    out.push([a, b]);
  }
  return out;
}
const rangeMinutes = ranges => ranges.reduce((n, [a, b]) => n + (b - a) / MINUTE_MS, 0);
// The planned unit an entry claims to be (instrument, period and bounds), with its base sources; null if none.
function plannedUnit(e) {
  const symbol = Object.keys(VISION_SYMBOLS).find(k => VISION_SYMBOLS[k] === e.contract);
  if (!symbol) return null;
  let units;
  try { units = planUnits(symbol, { from: e.dataStart.slice(0, 7), to: e.dataStart.slice(0, 7) }); } catch { return null; }
  return units.find(u => u.instrument.exchange === e.exchange && u.instrument.market === e.market && u.period === e.period
    && u.dataStart === e.dataStart && u.dataEnd === e.dataEnd) ?? null;
}
export function readManifest(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return { entries: [], kind: MANIFEST_KIND, schemaVersion: 1 }; throw error; }
  let manifest;
  try { manifest = JSON.parse(text); } catch { throw new Error('1m manifest: not valid JSON'); }
  if (!manifest || Object.keys(manifest).sort().join() !== 'entries,kind,schemaVersion' || manifest.kind !== MANIFEST_KIND || manifest.schemaVersion !== 1
    || !Array.isArray(manifest.entries)) throw new Error('1m manifest: unknown kind, schemaVersion or layout');
  manifest.entries.forEach(checkEntry);
  for (let i = 1; i < manifest.entries.length; i++) if (compareEntries(manifest.entries[i - 1], manifest.entries[i]) >= 0) throw new Error('1m manifest: entries not sorted or duplicated');
  return manifest;
}
const manifestText = entries => JSON.stringify(JSON.parse(canonicalJson({ entries: [...entries].sort(compareEntries), kind: MANIFEST_KIND, schemaVersion: 1 })), null, 2) + '\n';
function publishManifest(file, entries) {
  const tmp = `${file}.tmp`;
  const fd = fs.openSync(tmp, 'w', 0o644); // under the lock, so a leftover temp file is a crashed writer's and may be replaced
  try { fs.writeSync(fd, manifestText(entries)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(tmp, file);
  fsyncDir(path.dirname(file));
}
function acquireLock(manifestPath) {
  const file = `${manifestPath}.lock`, token = randomUUID();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let fd;
  try { fd = fs.openSync(file, 'wx', 0o644); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`manifest lock ${path.basename(file)} exists: another writer is running or one crashed; check and remove it by hand`);
    throw error;
  }
  try { fs.writeSync(fd, JSON.stringify({ pid: process.pid, token }) + '\n'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  return () => { // only ever removes its own lock
    try { if (JSON.parse(fs.readFileSync(file, 'utf8')).token === token) fs.unlinkSync(file); } catch { /* not ours or gone: leave it */ }
  };
}

const unitId = u => ({ contract: u.instrument.contract, period: u.period, dataStart: u.dataStart, dataEnd: u.dataEnd });
// One unit from verified local sources: missing, failed (with reason), empty, or an entry with its snapshot bytes.
// Dependencies (amendment round 5, F5, plan approval point 3): the base sources, and for a monthly unit the fill
// dailies derived from it. A unit is missing only after every present dependency passed versions, readVerifiedSource,
// parsing and the quarantine cap, so a failure outranks a missing source. Fill dailies are validated and merged one
// at a time and never cached. check is the run's guard check: a trip aborts the run.
function buildUnit(unit, zipRoot, parsedCache, check) {
  const multipleVersions = list => `more than one local version (version selection rule pending): ${list.map(([s, v]) => `${s.file} [${v.join(', ')}]`).join('; ')}`;
  const versions = unit.sources.map(s => [s, localVersions(zipRoot, s)]);
  const multiple = versions.filter(([, v]) => v.length > 1);
  if (multiple.length) return { status: 'failed', reason: multipleVersions(multiple) };
  const inputs = [], sources = [];
  for (const [s, [sha]] of versions.filter(([, v]) => v.length)) {
    const key = `${s.file}@${sha}`;
    if (!parsedCache.has(key)) {
      check(`parse ${s.file}`);
      parsedCache.set(key, parseKlines(readZipMember(readVerifiedSource(zipRoot, s, sha), s.csvName), s));
      check(`parsed ${s.file}`);
    }
    inputs.push({ file: s.file, parsed: parsedCache.get(key) });
    sources.push({ file: s.file, sha256: sha });
  }
  const absent = versions.filter(([, v]) => !v.length).map(([s]) => s);
  if (absent.length) return { status: 'missing', files: absent.map(s => ({ file: s.file, recorded404: recordedMissing(zipRoot, s) })) };
  const fill = { fillSources: [], unavailableFills: [] };
  if (unit.sources[0].kind !== 'monthly') {
    const { rowCount, columns } = assembleUnit(unit, inputs);
    return finishUnit(unit, rowCount, columns, sources, unitQuarantine(unit, inputs), [], fill, check);
  }
  const present = [], absentFills = [];
  for (const f of fillSources(unit, inputs[0].parsed.columns.open_time)) {
    const v = localVersions(zipRoot, f);
    if (v.length > 1) return { status: 'failed', reason: multipleVersions([[f, v]]) };
    if (v.length) present.push([f, v[0]]);
    else if (recordedMissing(zipRoot, f)) fill.unavailableFills.push(f.file);
    else absentFills.push(f);
  }
  const shaOf = new Map(present.map(([f, sha]) => [f.file, sha]));
  const loadFill = f => {
    check(`parse ${f.file}`);
    let parsed;
    try { parsed = parseKlines(readZipMember(readVerifiedSource(zipRoot, f, shaOf.get(f.file)), f.csvName), f); }
    catch (error) { throw new Error(`${f.file}: ${error.message}`); }
    check(`parsed ${f.file}`);
    return parsed;
  };
  if (absentFills.length) {
    for (const [f] of present) loadFill(f); // validated and dropped: a present failure outranks the missing fill
    return { status: 'missing', files: absentFills.map(f => ({ file: f.file, recorded404: false })) };
  }
  const merged = mergeUnit(unit, inputs[0], present.map(([f]) => f), loadFill, check);
  fill.fillSources = present.map(([f]) => f.file);
  return finishUnit(unit, merged.rowCount, merged.columns, [...sources, ...present.map(([f, sha]) => ({ file: f.file, sha256: sha }))], merged.quarantinedRows,
    merged.filledRanges, fill, check);
}
// Coverage after the merge (Q2): an empty unit gets no snapshot or entry but keeps its report fields.
function finishUnit(unit, rowCount, columns, sources, quarantinedRows, filledRanges, fill, check) {
  const coverage = unitCoverage(unit, columns.open_time);
  const report = { quarantinedRows, filledMinutes: filledRanges.reduce((n, r) => n + (Date.parse(r.end) - Date.parse(r.start)) / MINUTE_MS, 0), ...fill };
  if (!rowCount) return { status: 'empty', coverage, ...report };
  check(`encode ${unit.instrument.contract} ${unit.dataStart}`);
  const bytes = encodeSnapshot({ instrument: unit.instrument, period: unit.period, dataStart: unit.dataStart, dataEnd: unit.dataEnd, sources }, columns);
  const iso = t => new Date(t).toISOString();
  const entry = { ...unit.instrument, period: unit.period, dataStart: unit.dataStart, dataEnd: unit.dataEnd, schemaVersion: SCHEMA_VERSION, sha256: sha256(bytes),
    bytes: bytes.length, rowCount, firstOpenTime: iso(columns.open_time[0]), lastOpenTime: iso(columns.open_time[rowCount - 1]), missingMinutes: coverage.missingMinutes,
    missingRanges: coverage.missingRanges, quarantinedRows, filledRanges, source: SOURCE, sources: [...sources].sort((a, b) => order(a.file, b.file)) };
  return { status: 'ok', entry, bytes, coverage, ...report };
}

// Builds every planned unit of the symbols and months. Fail closed per unit; a guard (memory) failure or a lock
// conflict aborts the run. status: ok | incomplete (a source file missing) | failed (anything else). A missing unit is
// not_listed when all its sources are (listing rule); listingEntries adds manifest evidence (compare's reference).
export function buildStore({ symbols, from, to, zipRoot, cacheDir, manifestPath, guard = { check() {} }, listingEntries = [] }) {
  const results = [];
  let release, error = null, changed = false;
  const check = label => { try { guard.check(label); } catch (guardError) { throw Object.assign(guardError, { guard: true }); } };
  try {
    const plans = symbols.map(symbol => [symbol, planUnits(symbol, { from, to })]);
    release = acquireLock(manifestPath);
    const entries = readManifest(manifestPath).entries;
    for (const [symbol, units] of plans) {
      const notListed = notListedSources(symbol, { zipRoot, entries: [...entries, ...listingEntries] });
      let parsedCache = new Map();
      for (const unit of units) {
        // Before the unit, keep only its own base parses (the split month reuses its monthly file); this also drops
        // what a failed unit left. Fill dailies are never cached.
        parsedCache = new Map([...parsedCache].filter(([key]) => unit.sources.some(s => key.startsWith(`${s.file}@`))));
        check(`${unit.instrument.contract} ${unit.dataStart}`);
        let result;
        try {
          result = buildUnit(unit, zipRoot, parsedCache, check);
          if (result.status === 'ok') {
            const existing = entries.filter(e => sameKey(e, result.entry));
            if (existing.some(e => canonicalJson(e) === canonicalJson(result.entry))) {
              check(`${unit.instrument.contract} ${unit.dataStart} write`);
              writeOnce(snapshotPath(cacheDir, result.entry.sha256), result.bytes);
              result = { ...result, status: 'unchanged' };
            } else if (existing.length) {
              const otherSources = existing.every(e => canonicalJson(e.sources) !== canonicalJson(result.entry.sources));
              result = { status: 'failed', reason: otherSources ? 'the manifest entry for this unit uses other source versions (version selection rule pending)'
                : 'the rebuilt entry differs from the manifest entry for this unit' };
            } else {
              check(`${unit.instrument.contract} ${unit.dataStart} write`);
              writeOnce(snapshotPath(cacheDir, result.entry.sha256), result.bytes);
              entries.push(result.entry);
              changed = true;
              result = { ...result, status: 'built' };
            }
          }
        } catch (unitError) {
          if (unitError.guard) throw unitError;
          result = { status: 'failed', reason: unitError.message };
        }
        if (result.status === 'missing' && unit.sources.every(s => notListed.has(s.file))) result = { ...result, status: 'not_listed' };
        results.push({ symbol, unit, ...result, bytes: undefined });
      }
    }
    if (changed) publishManifest(manifestPath, entries);
  } catch (runError) {
    error = runError.message;
    // Nothing was published: snapshots written so far are orphans (harmless), not built units.
    for (const r of results) if (r.status === 'built') Object.assign(r, { status: 'failed', reason: 'not published: the run aborted' });
  }
  finally { release?.(); }
  return summarize('build', results, error);
}

function mergeRanges(ranges) {
  const out = [];
  for (const r of ranges) {
    if (out.length && out.at(-1).end === r.start) out.at(-1).end = r.end;
    else out.push({ ...r });
  }
  return out;
}
function coverageOf(contract, results) {
  const units = results.filter(r => r.unit.instrument.contract === contract);
  const built = units.filter(r => r.entry && ['built', 'unchanged'].includes(r.status));
  const counted = units.filter(r => r.status !== 'not_listed');
  const expectedMinutes = counted.reduce((n, r) => n + (r.unit.endMs - r.unit.startMs) / 60000, 0);
  const bars = built.reduce((n, r) => n + r.entry.rowCount, 0);
  const ranges = counted.flatMap(r => r.entry && ['built', 'unchanged'].includes(r.status) ? r.entry.missingRanges : [{ start: r.unit.dataStart, end: r.unit.dataEnd }]);
  const reported = units.filter(r => ['built', 'unchanged', 'empty'].includes(r.status));
  // firstSourceFile is the first base source of the first built unit (F7): a fill daily would sort first in sources.
  return { contract, firstSourceFile: built[0]?.unit.sources[0].file ?? null, firstCandle: built[0]?.entry.firstOpenTime ?? null, lastCandle: built.at(-1)?.entry.lastOpenTime ?? null,
    bars, expectedMinutes, missingMinutes: expectedMinutes - bars, notListed: [...new Set(units.filter(r => r.status === 'not_listed').map(r => r.unit.dataStart.slice(0, 7)))],
    gaps: counted.filter(r => ['missing', 'empty', 'failed'].includes(r.status)).map(r => ({ period: r.unit.period, dataStart: r.unit.dataStart, dataEnd: r.unit.dataEnd, status: r.status })),
    missingRanges: mergeRanges(ranges),
    quarantine: quarantineReport(reported.flatMap(r => r.quarantinedRows)),
    dailyFill: { filledMinutes: reported.reduce((n, r) => n + r.filledMinutes, 0), sources: reported.flatMap(r => r.fillSources).sort(order),
      unavailable: reported.flatMap(r => r.unavailableFills).sort(order) } };
}
// Per-symbol quarantine report (amendment round 5, Q5) from unit records, which never repeat across split units.
export function quarantineReport(records) {
  const rows = [...records].sort((a, b) => order(a.openTime, b.openTime) || order(a.file, b.file));
  return { sourceRows: rows.length, uniqueMinutes: new Set(rows.map(q => q.openTime)).size, rows };
}
function summarize(command, results, error) {
  const count = status => results.filter(r => r.status === status).length;
  const counts = { units: results.length, built: count('built'), unchanged: count('unchanged'), empty: count('empty'), missing: count('missing'), notListed: count('not_listed'), failed: count('failed') };
  const status = error || counts.failed ? 'failed' : counts.missing ? 'incomplete' : 'ok';
  return { command, status, error, counts,
    failures: results.filter(r => r.status === 'failed').map(r => ({ ...unitId(r.unit), reason: r.reason })),
    missing: results.filter(r => r.status === 'missing').map(r => ({ ...unitId(r.unit), files: r.files })),
    coverage: [...new Set(results.map(r => r.unit.instrument.contract))].map(c => coverageOf(c, results)),
    entries: results.filter(r => r.entry && ['built', 'unchanged'].includes(r.status)).map(r => r.entry),
    units: results.map(r => ({ ...unitId(r.unit), status: r.status, files: r.files })) };
}

// Offline check of everything stored: every zip against its CHECKSUM, every entry's snapshot by hash and header.
// The guard (memory) is checked before each file; when it trips, verify stops and reports what it checked so far.
export function verifyStore({ zipRoot, cacheDir, manifestPath, guard = { check() {} } }) {
  const failures = [];
  let zips = 0, checked = 0, entries = [];
  const walk = dir => { try { return fs.readdirSync(dir, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return []; throw error; } };
  const visit = dir => {
    for (const d of walk(dir)) {
      const full = path.join(dir, d.name);
      if (d.isDirectory()) { if (d.name !== '404') visit(full); continue; }
      if (!d.name.endsWith('.zip')) continue;
      const rel = path.relative(zipRoot, path.dirname(path.dirname(full))).split(path.sep).join('/') + '/' + d.name;
      guard.check(rel);
      zips++;
      try {
        let checksum;
        try { checksum = fs.readFileSync(`${full}.CHECKSUM`, 'utf8'); } catch { checksum = undefined; }
        if (verifyZip(fs.readFileSync(full), checksum, d.name) !== path.basename(dir)) throw new Error('stored under another sha256');
      } catch (zipError) { failures.push(`${rel}: ${zipError.message}`); }
    }
  };
  try {
    visit(zipRoot);
    try { entries = readManifest(manifestPath).entries; } catch (manifestError) { failures.push(manifestError.message); }
    for (const e of entries) {
      guard.check(`snapshot ${e.sha256}`);
      checked++;
      try {
        const bytes = fs.readFileSync(snapshotPath(cacheDir, e.sha256));
        if (sha256(bytes) !== e.sha256 || bytes.length !== e.bytes) throw new Error('hash or size mismatch');
        const { header } = decodeSnapshot(bytes);
        const agree = header.instrument.exchange === e.exchange && header.instrument.market === e.market && header.instrument.contract === e.contract
          && header.period === e.period && header.dataStart === e.dataStart && header.dataEnd === e.dataEnd && header.rowCount === e.rowCount
          && header.firstOpenTime === e.firstOpenTime && header.lastOpenTime === e.lastOpenTime && canonicalJson(header.sources) === canonicalJson(e.sources);
        if (!agree) throw new Error('header disagrees with the manifest entry');
      } catch (snapshotError) { failures.push(`snapshot ${e.sha256} (${e.contract} ${e.period} ${e.dataStart}): ${snapshotError.code ?? snapshotError.message}`); }
    }
  } catch (error) {
    return { command: 'verify', status: 'failed', error: error.message, counts: { zips, entries: checked }, failures, orphans: [] };
  }
  const known = new Set(entries.map(e => `${e.sha256}.bin`));
  const orphans = walk(cacheDir).filter(d => d.isFile() && !known.has(d.name)).map(d => d.name).sort(order);
  return { command: 'verify', status: failures.length ? 'failed' : 'ok', counts: { zips, entries: entries.length, orphans: orphans.length }, failures, orphans };
}

// Offline: rebuild the requested units into a temp store and compare with the reference manifest, read-only. Every
// in-scope unit gets one class: matched; mismatched (the rebuilt entry differs, or a reference entry rebuilds to no
// rows); extra (rebuilt, not in the reference); missing_input (a source missing locally without recorded 404
// evidence, or the unit is in the reference); gap (not in the reference, recorded 404s the listing rule does not make
// not_listed); not_listed (not in the reference, listing rule with the reference manifest as evidence); empty (not in
// the reference, sources present, no rows); failed (the unit's rebuild failed). Status: failed on any mismatched,
// extra, missing_input or failed unit, an aborted rebuild (memory guard) or zero compared entries; otherwise
// incomplete on any gap; otherwise ok.
export function compareStore({ symbols, from, to, zipRoot, manifestPath, guard = { check() {} } }) {
  let reference;
  try { reference = readManifest(manifestPath).entries; } catch (error) { return { command: 'compare', status: 'failed', error: error.message, counts: { compared: 0 } }; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'f1-1m-compare-'));
  try {
    const rebuilt = buildStore({ symbols, from, to, zipRoot, cacheDir: path.join(dir, 'cache'), manifestPath: path.join(dir, 'manifest.json'), guard, listingEntries: reference });
    const id = e => canonicalJson({ contract: e.contract, period: e.period, dataStart: e.dataStart, dataEnd: e.dataEnd });
    const planned = symbols.flatMap(symbol => planUnits(symbol, { from, to })).map(u => id(unitId(u)));
    if (rebuilt.error) return { command: 'compare', status: 'failed', error: rebuilt.error, counts: { units: planned.length, processed: rebuilt.counts.units, compared: 0 } };
    const scope = new Set(planned);
    const expected = reference.filter(e => e.exchange === 'binance' && e.market === 'linear_perpetual' && scope.has(id(e)));
    const byKey = new Map(rebuilt.units.map(u => [id(u), u]));
    const units = [], missing = [], extra = [], mismatches = [], missingInputs = [];
    for (const key of planned) {
      const u = byKey.get(key) ?? { status: 'failed' }, refs = expected.filter(e => id(e) === key), twin = rebuilt.entries.find(r => id(r) === key);
      let cls;
      if (!twin && refs.length) missing.push(key);
      if (twin && !refs.length) { cls = 'extra'; extra.push(key); }
      else if (twin) {
        cls = refs.length === 1 && canonicalJson(refs[0]) === canonicalJson(twin) ? 'matched' : 'mismatched';
        if (cls === 'mismatched') mismatches.push(`${key}: ${refs.length > 1 ? `${refs.length} reference entries` : 'entry differs'}`);
      } else if (u.files && (refs.length || !u.files.every(f => f.recorded404))) { cls = 'missing_input'; missingInputs.push(...u.files.map(f => ({ file: f.file }))); }
      else if (u.status === 'failed') cls = 'failed';
      else if (refs.length) { cls = 'mismatched'; mismatches.push(`${key}: the rebuild has no rows`); }
      else cls = { missing: 'gap', not_listed: 'not_listed', empty: 'empty' }[u.status];
      units.push({ ...JSON.parse(key), class: cls });
    }
    const n = cls => units.filter(u => u.class === cls).length;
    const compared = n('matched') + n('mismatched');
    const failed = ['mismatched', 'extra', 'missing_input', 'failed'].some(n) || !compared;
    return { command: 'compare', status: failed ? 'failed' : n('gap') ? 'incomplete' : 'ok', error: rebuilt.error,
      counts: { units: units.length, expected: expected.length, rebuilt: rebuilt.entries.length, compared, matched: n('matched'), mismatched: n('mismatched'), extra: n('extra'),
        missingInput: n('missing_input'), gap: n('gap'), notListed: n('not_listed'), empty: n('empty'), failed: n('failed') },
      units, missing, extra, mismatches, missingInputs, failures: rebuilt.failures };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
