// H3a: bounded, local-only queue using the existing eight rules and H2 engine.
import fs from 'node:fs';
import path from 'node:path';
import { RULE_PARAMETER_KEYS, validateCandidateSet } from './candidate-spec.mjs';
import { expandCandidate } from './engine.mjs';
import { PERIODS, cachedSeries, instrumentForSymbol, instrumentOf } from './h2-contract.mjs';
import { spamCandidates } from './spam-candidates.mjs';

export const MAX_VARIANTS = 600;
export const MAX_MS = 90 * 60 * 1000;
export const RULES = Object.keys(RULE_PARAMETER_KEYS);
export const SYMBOLS = ['BTC', 'ETH', 'SOL', 'HYPE'];
export const TIMEFRAMES = ['1h', '4h'];
export function researchConfig(config) {
  if (process.argv.includes('--final')) throw new Error('Research queue/funnel forbids --final');
  if (config.period !== 'research' || config.dataStart !== PERIODS.research[0] || config.dataEnd !== PERIODS.research[1]) throw new Error('H3a requires the exact H2 research window');
  return { ...config, entryMode: 'next_open' };
}
const derived = new Set(['ohlcv', 'volume', 'rsi', 'trend', 'volatility', 'movingAverages', 'trendStrength', 'timeframe']);
export function inputIssues(candidate, snapshot, btcSnapshot, symbol, timeframe, config, instrument = instrumentForSymbol(config, symbol)) {
  if (!snapshot) return ['missing frozen research OHLCV'];
  const candles = snapshot.candles;
  const step = timeframe === '1h' ? 3600 : 14400;
  const start = Date.parse(config.dataStart) / 1000, end = Date.parse(config.dataEnd) / 1000;
  const issues = [];
  if (candles.length !== (end - start) / step || candles.some((c, i) => c.time !== start + i * step)) issues.push('incomplete research OHLCV coverage');
  if (candles.some(c => !['time','open','high','low','close','volume'].every(k => Number.isFinite(c[k])) || c.low <= 0 || c.volume < 0 || c.low > Math.min(c.open,c.close) || c.high < Math.max(c.open,c.close))) issues.push('invalid OHLCV');
  const market = instrument.market;
  if (!candidate.dataRequirements.markets.includes(market)) issues.push(`required market unavailable: ${market}`);
  for (const feature of candidate.dataRequirements.requiredFeatures) {
    if (derived.has(feature)) continue;
    if (feature === 'btc_regime_gate') {
      if (!btcSnapshot || btcSnapshot.candles.length !== candles.length || candles.some((c,i) => btcSnapshot.candles[i]?.time !== c.time)) issues.push('missing aligned BTC research OHLCV');
    } else if (['fundingRate','openInterestChangePct','openInterest'].includes(feature)) {
      if (!candles.every(c => Number.isFinite(c[feature]))) issues.push(`missing complete ${feature}`);
    } else issues.push(`unavailable required feature: ${feature}`);
  }
  return issues;
}
export function buildQueue(config, seed, lookup = (s,t,i) => cachedSeries(s,t,config,i)) {
  const templates = [...spamCandidates(), ...seed];
  const validation = validateCandidateSet(templates);
  if (!validation.ok) throw new Error(validation.errors.join('\n'));
  const instruments = new Map(SYMBOLS.map(s => [s, instrumentForSymbol(config, s)]));
  const snapshots = new Map();
  for (const s of SYMBOLS) for (const t of TIMEFRAMES) snapshots.set(`${s}:${t}`, lookup(s,t,instruments.get(s)));
  const groups = [], skipped = [], excludedTemplates = [], seen = new Set();
  for (const rule of RULES) for (const symbol of SYMBOLS) for (const timeframe of TIMEFRAMES) {
    const items = [], reasons = new Set();
    for (const template of templates.filter(c => c.rule === rule)) {
      const snapshot = snapshots.get(`${symbol}:${timeframe}`);
      const issues = inputIssues(template, snapshot, snapshots.get(`BTC:${timeframe}`), symbol, timeframe, config, instruments.get(symbol));
      if (issues.length) {
        issues.forEach(r => reasons.add(r));
        excludedTemplates.push({ sourceCandidateId: template.id, rule, symbol, timeframe, reasons: issues });
        continue;
      }
      const candidate = { ...template, parameters: { ...template.parameters, symbol: [symbol], timeframe: [timeframe] } };
      for (const variant of expandCandidate(candidate)) {
        const signature = JSON.stringify([rule, template.directions, Object.entries(variant.params).sort(), template.dataRequirements.requiredFeatures.includes('btc_regime_gate')]);
        if (seen.has(signature)) continue;
        seen.add(signature);
        const gated = template.dataRequirements.requiredFeatures.includes('btc_regime_gate');
        items.push({ sourceCandidateId: template.id, sourceFamily: template.family, rule, symbol, timeframe,
          instrument: instruments.get(symbol), snapshotSha256: snapshot.meta.sha256,
          btcInstrument: gated ? instruments.get('BTC') : null, btcSnapshotSha256: gated ? snapshots.get(`BTC:${timeframe}`).meta.sha256 : null,
          candidate: { ...candidate, parameters: Object.fromEntries(Object.entries(variant.params).map(([k,v]) => [k,[v]])) }, status: 'pending' });
      }
    }
    if (!items.length) skipped.push({ rule, symbol, timeframe, reasons: [...reasons] });
    else groups.push(items);
  }
  // Round-robin across available rule/market combinations; retain source grid order within each.
  const items = [];
  for (let i=0; items.length < MAX_VARIANTS && groups.some(g => i < g.length); i++) {
    for (const group of groups) if (group[i] && items.length < MAX_VARIANTS) {
      const item = group[i], id = `h3a-${String(items.length+1).padStart(4,'0')}-v0`;
      items.push({ ...item, id, candidate: { ...item.candidate, id } });
    }
  }
  const queue = { schemaVersion: 1, period: 'research', entryMode: 'next_open', dataStart: config.dataStart, dataEnd: config.dataEnd,
    inputContract: 'Complete contiguous H2 research OHLCV; RSI/ATR/MA/volume-Z/trend/volatility locally derived. Funding/OI and BTC gate inputs required when declared. Unknown/manual evidence is not substituted. Existing minLookbackDays=1825 is a legacy rolling-fetch target; the explicit H2 research window supersedes it. No holdout is used.',
    selectionNote: 'Existing grids were historically explored outside this research window. This batch is not independent validation or strategy promotion.',
    sourceFiles: ['candidates/seed-strategies.json','src/spam-candidates.mjs'],
    eligibleBeforeCap: groups.reduce((n,g)=>n+g.length,0), deferredByCap: Math.max(0,groups.reduce((n,g)=>n+g.length,0)-MAX_VARIANTS),
    skipped, excludedTemplates, items };
  validateQueue(queue);
  return queue;
}
export function validateQueue(queue) {
  if (queue.period !== 'research' || queue.entryMode !== 'next_open' || queue.dataStart !== PERIODS.research[0] || queue.dataEnd !== PERIODS.research[1]) throw new Error('Invalid queue research contract');
  if (!Array.isArray(queue.items) || queue.items.length > MAX_VARIANTS) throw new Error('Queue exceeds 600 variant cap or items missing');
  const validation = validateCandidateSet(queue.items.map(i => i.candidate));
  if (!validation.ok) throw new Error(validation.errors.join('\n'));
  const ids = new Set();
  for (const item of queue.items) {
    if (ids.has(item.id) || item.id !== item.candidate.id) throw new Error('Invalid/duplicate queue identity');
    ids.add(item.id);
    if (!SYMBOLS.includes(item.symbol) || !TIMEFRAMES.includes(item.timeframe) || item.rule !== item.candidate.rule || !['pending','running','pass','reject','error'].includes(item.status)) throw new Error('Invalid queue item');
    const variants = expandCandidate(item.candidate);
    if (variants.length !== 1 || variants[0].params.symbol !== item.symbol || variants[0].params.timeframe !== item.timeframe) throw new Error('Each queue item must be exactly one matching variant');
    if (!/^[a-f0-9]{64}$/.test(item.snapshotSha256)) throw new Error('Missing frozen input hash');
    // Items built before F1a-1 carry neither instrument and resolve as Binance spot; newer items carry both
    // (btcInstrument is null exactly when the item has no BTC gate).
    if (item.instrument !== undefined || item.btcInstrument !== undefined) {
      if (!item.instrument || (item.btcSnapshotSha256 ? !item.btcInstrument : item.btcInstrument !== null)) throw new Error('Incomplete data identity on queue item');
      instrumentOf(item.instrument);
      if (item.btcInstrument) instrumentOf(item.btcInstrument);
    }
  }
  return true;
}
export function historicalCounts(resultsDir) {
  const files = fs.readdirSync(resultsDir).filter(n => n === 'filter-report.json' || /^strategy-spam-.*\.json$/.test(n)).sort();
  const union = new Map(), bySourceFamily = new Map(), sources = [];
  for (const file of files) {
    const report = JSON.parse(fs.readFileSync(path.join(resultsDir,file),'utf8'));
    const found = new Map();
    function visit(value) {
      if (!value || typeof value !== 'object') return;
      if (value.variantId && value.candidateId) {
        const key = `${value.candidateId}:${value.variantId}`;
        const rule = value.rule ?? report.candidates?.find(c => c.id === value.candidateId)?.rule ?? 'unknown';
        const family = value.family ?? 'unknown';
        found.set(key,{rule,family}); union.set(key,{rule,family}); bySourceFamily.set(key,family);
      }
      for (const child of Object.values(value)) if (typeof child === 'object') visit(child);
    }
    visit(report);
    sources.push({file, uniqueVariants: found.size, perRule: countValues([...found.values()].map(v=>v.rule))});
  }
  return { method: 'Distinct candidateId:variantId union across matching reports; repeated survivor/verdict rows deduplicated. Historical symbol/timeframe interpretations are unchanged.',
    uniqueVariants: union.size, perRule: { ...Object.fromEntries(RULES.map(r=>[r,0])), ...countValues([...union.values()].map(v=>v.rule)) },
    perSourceFamily: countValues([...bySourceFamily.values()]), sources };
}
export function countValues(values) { const out={}; for(const v of values) out[v]=(out[v]??0)+1; return out; }
