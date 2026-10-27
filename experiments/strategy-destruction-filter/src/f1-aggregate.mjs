// F1a-3 aggregation (docs/f1/f1a-3-contract.md; plan docs/f1/f1a-3-plan.md sections a, c, e): research 1m candles to
// 5m, 15m, 1h, 4h, 1d and 1w bars, computed on read and never stored. The research 1m reader (openResearch1m) is the
// only data path and is called for one calendar month at a time (V2); open bars, the week included, carry across months.
// Every timeframe comes from 1m (C1). Exact decimals: each 1m value's decimal is recovered with String(x), which fails
// closed on exponent form or more than 15 significant digits, and sums are exact scaled integers (a Number while it is a
// safe integer, BigInt beyond); a bar's Number is the correctly rounded Number of its exact decimal, never the other way
// round. Only complete bars become candles (P1);
// incomplete bars and empty ranges are listed without values. Errors name columns and times, never values.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { PERIODS } from './h2-contract.mjs';
import { canonicalJson } from './f1-1m-format.mjs';
import { KLINE_INTERVALS, gridOpen } from './vision-source.mjs';

export const TIMEFRAMES = Object.freeze(['5m', '15m', '1h', '4h', '1d', '1w']);
export const VALUE_COLUMNS = Object.freeze(['open', 'high', 'low', 'close', 'volume', 'quote_volume', 'count', 'taker_buy_volume', 'taker_buy_quote_volume']);
const OUTPUT_COLUMNS = Object.freeze(['open_time', ...VALUE_COLUMNS]);
const SUMS = Object.freeze(['volume', 'quote_volume', 'taker_buy_volume', 'taker_buy_quote_volume']);
export const DIGEST_SCHEMA = 'f1-aggregate-digest/1';
export const MODULE_SHA256 = createHash('sha256').update(fs.readFileSync(new URL(import.meta.url))).digest('hex');
const RESEARCH = PERIODS.research.map(Date.parse);
const MINUTE = 60000;
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.000Z$/;
const iso = t => new Date(t).toISOString();
const fail = message => { throw new Error(`aggregate: ${message}`); };

// Exact decimals {coef, scale}: the value coef / 10^scale, coef a BigInt, scale an integer >= 0. Not reduced: 1.50 and
// 1.5 are two representations of one value; decimalEquals compares values.
const DECIMAL = /^(-?)(\d+)(?:\.(\d+))?$/;
const POW10 = [1n];
const pow10 = k => { while (POW10.length <= k) POW10.push(POW10.at(-1) * 10n); return POW10[k]; };
const POW10_NUMBER = Array.from({ length: 23 }, (_, k) => 10 ** k); // exact doubles up to 10^22
const SAFE = Number.MAX_SAFE_INTEGER;
// A plain decimal token (-?digits[.digits]) as written, any length; null for anything else (exponent form included).
export function parseDecimal(token) {
  const m = typeof token === 'string' ? DECIMAL.exec(token) : null;
  if (!m) return null;
  const fraction = m[3] ?? '';
  return { coef: BigInt(m[1] + m[2] + fraction), scale: fraction.length };
}
export function decimalEquals(a, b) {
  return a.scale >= b.scale ? a.coef === b.coef * pow10(a.scale - b.scale) : a.coef * pow10(b.scale - a.scale) === b.coef;
}
export function decimalString({ coef, scale }) {
  const sign = coef < 0n ? '-' : '', digits = (coef < 0n ? -coef : coef).toString().padStart(scale + 1, '0');
  return scale ? `${sign}${digits.slice(0, -scale)}.${digits.slice(-scale)}` : `${sign}${digits}`;
}

// The decimal a float64 1m value stands for: String(x), the shortest round trip, which is the original token's value
// when that token had at most 15 significant digits (every research 1m token has, plan section a). Sets RECOVERED.coef
// (a Number integer) and RECOVERED.scale and returns true; false, so the caller fails closed, on a negative value,
// exponent form, more than 15 significant digits or a coefficient above 2^53 - 1 (a value of about 9e15 or more).
const RECOVERED = { coef: 0, scale: 0 };
function recover(x) {
  const s = String(x);
  let dot = -1, first = -1, last = -1, coef = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    if (ch === 46) { if (dot >= 0 || i === 0) return false; dot = i; continue; }
    if (ch < 48 || ch > 57) return false; // '-', 'e', '+', 'I' (Infinity), 'N' (NaN)
    if (ch !== 48) { if (first < 0) first = i; last = i; }
    // Exact while the coefficient is a safe integer; once above 2^53 - 1 it stays above, so the check below fails it.
    coef = coef * 10 + (ch - 48);
  }
  if (dot === s.length - 1) return false;
  const significant = first < 0 ? 0 : last - first + 1 - (dot > first && dot < last ? 1 : 0);
  if (significant > 15 || coef > SAFE) return false;
  RECOVERED.coef = coef;
  RECOVERED.scale = dot < 0 ? 0 : s.length - dot - 1;
  return true;
}
const NO_EXACT = 'has no exact decimal (negative, exponent form or more than 15 significant digits, or a coefficient of 2^53 or more)';

// An exact sum of non-negative decimals: (big + small) / 10^scale, big a BigInt, small a Number integer <= 2^53 - 1.
// A Number product or sum of safe integers is exact when the true result is a safe integer, and a true result above
// 2^53 - 1 never rounds down to a safe integer, so every step that would leave the safe range goes to big instead.
// The scale is the largest scale added so far, so a bar's exact sum does not depend on the window.
function addExact(acc, coef, scale) {
  if (scale > acc.scale) {
    const raised = acc.small * POW10_NUMBER[scale - acc.scale];
    if (acc.big === 0n && raised <= SAFE) acc.small = raised;
    else { acc.big = (acc.big + BigInt(acc.small)) * pow10(scale - acc.scale); acc.small = 0; }
    acc.scale = scale;
  }
  const v = scale < acc.scale ? coef * POW10_NUMBER[acc.scale - scale] : coef;
  if (v > SAFE) { acc.big += BigInt(coef) * pow10(acc.scale - scale); return; }
  const sum = acc.small + v;
  if (sum <= SAFE) acc.small = sum;
  else { acc.big += BigInt(acc.small) + BigInt(v); acc.small = 0; }
}
// The correctly rounded Number of an exact sum: a division of two exact doubles (IEEE division rounds correctly), or
// Number(decimal string) when the sum is beyond 2^53 - 1 (ECMAScript rounds correctly up to 20 significant digits,
// V8 beyond). Compare acceptance is exact-decimal equality, not this Number (V1).
const exactNumber = acc => acc.big === 0n ? acc.small / POW10_NUMBER[acc.scale] : Number(decimalString({ coef: acc.big + BigInt(acc.small), scale: acc.scale }));

// Exact columns of complete bars, in typed arrays (no object per bar): a coefficient up to 2^53 - 1 as a Number, a
// larger one (only long sums) in the overflow map, and the scale.
function putExact(column, i, acc) {
  if (acc.big === 0n) column.coef[i] = acc.small;
  else column.overflow.set(i, acc.big + BigInt(acc.small));
  column.scale[i] = acc.scale;
}

// One timeframe: its grid slots over the window, the bar being built and the arrays of complete bars, preallocated
// for every slot of the window as views of one buffer: one large allocation is returned whole when it is collected
// (measured in F1a-3: separate column arrays left a higher RSS after successive symbols in one process).
function timeframeState(timeframe, startMs, endMs) {
  const step = KLINE_INTERVALS[timeframe], first = gridOpen(timeframe, startMs), last = gridOpen(timeframe, endMs - 1);
  const slots = (last - first) / step + 1;
  const buffer = new ArrayBuffer(slots * (8 * OUTPUT_COLUMNS.length + 9 * VALUE_COLUMNS.length));
  let offset = 0;
  const view = (Type, n = slots) => { const v = new Type(buffer, offset, n); offset += n * Type.BYTES_PER_ELEMENT; return v; };
  const columns = Object.fromEntries(OUTPUT_COLUMNS.map(name => [name, view(Float64Array)]));
  const exact = Object.fromEntries(VALUE_COLUMNS.map(name => [name, { coef: view(Float64Array), overflow: new Map() }]));
  for (const name of VALUE_COLUMNS) exact[name].scale = view(Uint8Array); // after every 8-byte view, so all stay aligned
  return { timeframe, step, offset: ((first % step) + step) % step, expected: step / MINUTE, startMs, endMs, end: last + step,
    next: first, open: null, minutes: 0, o: 0, h: 0, l: 0, c: 0, count: 0, sums: SUMS.map(() => ({ big: 0n, small: 0, scale: 0 })), bars: 0,
    columns, exact, incomplete: [], emptyRanges: [] };
}
// Slots [s.next, slot) hold no minute.
function skipTo(s, slot) {
  if (slot > s.next) s.emptyRanges.push(Object.freeze({ start: iso(s.next), end: iso(slot), slots: (slot - s.next) / s.step }));
}
function closeBar(s) {
  const end = s.open + s.step;
  if (s.minutes === s.expected && s.open >= s.startMs && end <= s.endMs) writeBar(s);
  else s.incomplete.push(Object.freeze({ openTime: iso(s.open), minutes: s.minutes, expected: s.expected,
    reason: s.open < s.startMs || end > s.endMs ? 'window_edge' : 'missing_minutes' }));
  s.next = end;
  s.open = null;
}
const PICKED = [['open', 'o'], ['high', 'h'], ['low', 'l'], ['close', 'c']];
function writeBar(s) {
  const i = s.bars++, c = s.columns, e = s.exact;
  c.open_time[i] = s.open;
  for (const [name, field] of PICKED) {
    if (!recover(s[field])) fail(`${name} of the ${s.timeframe} bar ${iso(s.open)}: the 1m value ${NO_EXACT}`);
    c[name][i] = s[field];
    e[name].coef[i] = RECOVERED.coef; e[name].scale[i] = RECOVERED.scale;
  }
  if (!Number.isSafeInteger(s.count)) fail(`count of the ${s.timeframe} bar ${iso(s.open)} is not a safe integer`);
  c.count[i] = e.count.coef[i] = s.count;
  SUMS.forEach((name, k) => { c[name][i] = exactNumber(s.sums[k]); putExact(e[name], i, s.sums[k]); });
}
// Adds the 1m row i (open time t, its sum columns recovered into coefs and scales) to the timeframe's bars.
function addMinute(s, t, cols, i, coefs, scales) {
  if (s.open !== null && t >= s.open + s.step) closeBar(s);
  if (s.open === null) {
    s.open = Math.floor((t - s.offset) / s.step) * s.step + s.offset;
    skipTo(s, s.open);
    s.minutes = 0; s.o = cols.open[i]; s.h = cols.high[i]; s.l = cols.low[i]; s.count = 0;
    for (const acc of s.sums) { acc.big = 0n; acc.small = 0; acc.scale = 0; }
  }
  if (cols.high[i] > s.h) s.h = cols.high[i];
  if (cols.low[i] < s.l) s.l = cols.low[i];
  s.c = cols.close[i];
  s.count += cols.count[i];
  for (let k = 0; k < SUMS.length; k++) addExact(s.sums[k], coefs[k], scales[k]);
  s.minutes++;
}

// V5 digest of one timeframe: sha256 over the canonical JSON of {schema, instrument, timeframe, dataStart, dataEnd,
// units, columns, bars, incomplete, emptyRanges} (keys sorted, arrays in chronological order), one newline (0x0a), then
// each column in OUTPUT_COLUMNS order as little-endian float64 values of the complete bars in chronological order.
function digestOf(meta, columns, bars) {
  const hash = createHash('sha256').update(canonicalJson(meta)).update('\n');
  const bytes = Buffer.alloc(8 * bars);
  for (const name of OUTPUT_COLUMNS) {
    const column = columns[name];
    for (let i = 0; i < bars; i++) bytes.writeDoubleLE(column[i] === 0 ? 0 : column[i], 8 * i); // -0 === 0: written as +0
    hash.update(bytes);
  }
  return hash.digest('hex');
}

const isMinuteIso = s => typeof s === 'string' && ISO.test(s) && iso(Date.parse(s)) === s && Date.parse(s) % MINUTE === 0;
const nextMonth = t => { const d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1); };
const monthStart = t => { const d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); };

// Aggregates the research 1m candles of [dataStart, dataEnd) into the requested timeframes. reader: an openResearch1m
// instance; check(label) runs after every month (the memory guard seam). Returns, per timeframe, the complete bars as
// Number columns (open_time and the nine value columns), exact(column, i) -> {coef, scale}, the incomplete bars
// {openTime, minutes, expected, reason}, the empty ranges {start, end, slots} and the V5 digest; besides the instrument,
// window, input units {sha256, dataStart, dataEnd} and the module's sha256. Every bar of a slot that crosses the window
// is incomplete (window_edge), so a bar is complete only when open_time + interval <= dataEnd <= 2025-10-17T00:00Z (V3).
export function aggregateResearch({ reader, instrument, timeframes, dataStart, dataEnd, check = () => {} }) {
  if (!reader || typeof reader.read !== 'function') fail('reader must be an openResearch1m instance');
  if (!Array.isArray(timeframes) || !timeframes.length || new Set(timeframes).size !== timeframes.length || timeframes.some(tf => !TIMEFRAMES.includes(tf))) {
    fail(`timeframes must be distinct values of ${TIMEFRAMES.join(',')}`);
  }
  if (typeof check !== 'function') fail('check must be a function');
  if (!isMinuteIso(dataStart) || !isMinuteIso(dataEnd)) fail('dataStart and dataEnd must be minute ISO strings with .000Z');
  const startMs = Date.parse(dataStart), endMs = Date.parse(dataEnd);
  if (!(startMs < endMs)) fail('empty window: dataStart must be before dataEnd');
  if (startMs < RESEARCH[0] || endMs > RESEARCH[1]) fail(`window outside the research window ${PERIODS.research.join('..')}: the holdout and later data are sealed`);
  const states = timeframes.map(tf => timeframeState(tf, startMs, endMs));
  const units = [], coefs = new Float64Array(SUMS.length), scales = new Uint8Array(SUMS.length);
  let previous = -Infinity;
  for (let month = monthStart(startMs); month < endMs; month = nextMonth(month)) {
    const a = Math.max(month, startMs), b = Math.min(nextMonth(month), endMs);
    const part = reader.read({ instrument, dataStart: iso(a), dataEnd: iso(b) });
    if (!part?.instrument || ['exchange', 'market', 'contract'].some(k => part.instrument[k] !== instrument[k])) fail('the reader answered for another instrument');
    const cols = part.columns, t = cols.open_time, sums = SUMS.map(name => cols[name]);
    for (let i = 0; i < t.length; i++) {
      const time = t[i];
      if (!(time > previous) || time % MINUTE !== 0 || time < a || time >= b) fail(`1m open_time not strictly increasing, minute-aligned and inside the request at row ${i + 1} of ${iso(a).slice(0, 7)}`);
      previous = time;
      for (let k = 0; k < SUMS.length; k++) {
        if (!recover(sums[k][i])) fail(`${SUMS[k]} at ${iso(time)}: the 1m value ${NO_EXACT}`);
        coefs[k] = RECOVERED.coef; scales[k] = RECOVERED.scale;
      }
      for (const s of states) addMinute(s, time, cols, i, coefs, scales);
    }
    for (const u of part.units) units.push(Object.freeze({ sha256: u.sha256, dataStart: u.dataStart, dataEnd: u.dataEnd }));
    check(`aggregate ${instrument.contract} ${iso(a).slice(0, 7)}`);
  }
  const identity = Object.freeze({ exchange: instrument.exchange, market: instrument.market, contract: instrument.contract });
  Object.freeze(units);
  const result = {};
  for (const s of states) {
    if (s.open !== null) closeBar(s);
    skipTo(s, s.end);
    const bars = s.bars;
    const columns = Object.freeze(Object.fromEntries(OUTPUT_COLUMNS.map(name => [name, s.columns[name].subarray(0, bars)])));
    const incomplete = Object.freeze(s.incomplete), emptyRanges = Object.freeze(s.emptyRanges), store = s.exact;
    const exact = (name, i) => {
      const e = store[name];
      if (!e || !Number.isSafeInteger(i) || i < 0 || i >= bars) fail(`no exact value ${name} at bar ${i}`);
      return Object.freeze({ coef: e.overflow.get(i) ?? BigInt(e.coef[i]), scale: e.scale[i] });
    };
    const meta = { schema: DIGEST_SCHEMA, instrument: identity, timeframe: s.timeframe, dataStart, dataEnd, units, columns: OUTPUT_COLUMNS, bars, incomplete, emptyRanges };
    result[s.timeframe] = Object.freeze({ timeframe: s.timeframe, bars, columns, exact, incomplete, emptyRanges, digest: digestOf(meta, columns, bars) });
  }
  return Object.freeze({ instrument: identity, dataStart, dataEnd, units, code: Object.freeze({ module: 'src/f1-aggregate.mjs', sha256: MODULE_SHA256 }),
    timeframes: Object.freeze(result) });
}
