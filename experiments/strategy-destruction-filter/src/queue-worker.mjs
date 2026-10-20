// One synchronous H2 evaluation, isolated so the parent can enforce its wall-clock deadline.
import fs from 'node:fs';
import { backtestVariant, expandCandidate, marketContext, summarizeVariantRuns } from './engine.mjs';
import { cachedSeries, instrumentOf } from './h2-contract.mjs';
import { inputIssues, researchConfig } from './research-queue.mjs';
const { item, config: supplied, trialCount } = JSON.parse(fs.readFileSync(0,'utf8'));
const config = researchConfig(supplied);
// Items built before F1a-1 carry no instrument and resolve as Binance spot only.
const instrument = instrumentOf(item.instrument ?? {}, item.symbol);
const snapshot = cachedSeries(item.symbol,item.timeframe,config,instrument);
const needsBtc = item.candidate.dataRequirements.requiredFeatures.includes('btc_regime_gate');
const btc = needsBtc ? cachedSeries('BTC',item.timeframe,config,instrumentOf(item.btcInstrument ?? {}, 'BTC')) : null;
const issues = inputIssues(item.candidate,snapshot,btc,item.symbol,item.timeframe,config,instrument);
if (issues.length) throw new Error(issues.join('; '));
if (snapshot.meta.sha256 !== item.snapshotSha256 || (needsBtc && btc.meta.sha256 !== item.btcSnapshotSha256)) throw new Error('Queued frozen snapshot identity changed');
const byTime = needsBtc ? new Map(btc.candles.map((c,i)=>[c.time,i])) : null;
const signalGate = needsBtc ? ({candles,index,signal}) => {
  const i=byTime.get(candles[index].time);
  if (!Number.isInteger(i)) return false;
  const ctx=marketContext(btc.candles,i);
  if (!ctx) return false;
  return signal.direction === 'long' ? ctx.close > ctx.ma50 && ctx.ma20 > ctx.ma50 && ctx.rsi14 >= 50 : ctx.close < ctx.ma50 && ctx.ma20 < ctx.ma50 && ctx.rsi14 <= 50;
} : null;
const timeframe=config.data.timeframes.find(t=>t.id===item.timeframe);
if (!timeframe) throw new Error('Missing configured timeframe');
const run=backtestVariant(expandCandidate(item.candidate)[0],snapshot.candles,item.symbol,timeframe,config,{signalGate,instrument});
const result=summarizeVariantRuns([run],trialCount,config.gates);
process.stdout.write(JSON.stringify({status:result.verdict.status==='survived_research_gate'?'pass':'reject',reasons:result.verdict.failures,
  trades:result.stats.sample,expectancyR:result.stats.expectancyR,profitFactor:result.stats.profitFactor,
  outOfSampleTrades:result.splitStats.outOfSample.sample,outOfSampleExpectancyR:result.splitStats.outOfSample.expectancyR,deflatedSharpe:result.stats.deflatedSharpe}));
