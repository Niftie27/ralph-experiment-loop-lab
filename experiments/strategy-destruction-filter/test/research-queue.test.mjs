import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildQueue, validateQueue, researchConfig, MAX_VARIANTS, MAX_MS, historicalCounts, inputIssues } from '../src/research-queue.mjs';
import { runQueue } from '../src/run-queue.mjs';
import { freezeSeries, PERIODS, registryRows } from '../src/h2-contract.mjs';
const root=new URL('../',import.meta.url);
const read=f=>JSON.parse(fs.readFileSync(new URL(f,root),'utf8'));
const baseConfig=researchConfig(read('config.default.json'));
const queue=read('research-queue.json');
const clone=v=>structuredClone(v);
function fixture(t,items=[clone(queue.items[0])]) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'h3a-test-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const resultsDir=path.join(dir,'results');fs.mkdirSync(resultsDir);
  const config={...baseConfig,h2Paths:{cache:path.join(dir,'cache'),manifest:path.join(dir,'manifest.json'),registry:path.join(dir,'registry.jsonl')}};
  const configPath=path.join(dir,'config.json'),queuePath=path.join(dir,'queue.json');
  fs.writeFileSync(configPath,JSON.stringify(config));
  const q={...clone(queue),items:items.map(i=>({...i,status:'pending'}))};
  fs.writeFileSync(queuePath,JSON.stringify(q));
  return {dir,resultsDir,configPath,queuePath,config,queue:q};
}
const rejected=()=>({status:'reject',reasons:['low_sample'],trades:0,expectancyR:null,profitFactor:null,outOfSampleTrades:0,outOfSampleExpectancyR:null,deflatedSharpe:null});
test('H3a queue validates all concrete candidates and enumerates all 64 combinations',()=>{
  assert.equal(validateQueue(queue),true);assert.ok(queue.items.length>0&&queue.items.length<=600);
  const combos=new Set([...queue.items,...queue.skipped].map(i=>`${i.rule}:${i.symbol}:${i.timeframe}`));assert.equal(combos.size,64);
  assert.ok(queue.items.every(i=>i.candidate.parameters.symbol[0]===i.symbol));
});
test('H3a queue rejects expanded grids, wrong mode, bad identities, duplicate IDs and cap overflow',()=>{
  for(const change of [q=>q.entryMode='signal_close',q=>q.period='holdout',q=>q.items[0].candidate.parameters.symbol.push('ETH'),q=>q.items[0].symbol='ETH',q=>q.items.push(clone(q.items[0])),q=>q.items=Array(601).fill(q.items[0])]){
    const q=clone(queue);change(q);assert.throws(()=>validateQueue(q));
  }
});
test('H3a research override leaves gates and costs unchanged and refuses holdout',()=>{
  assert.equal(baseConfig.entryMode,'next_open');assert.deepEqual(baseConfig.costs,read('config.default.json').costs);assert.deepEqual(baseConfig.gates,read('config.default.json').gates);
  assert.throws(()=>researchConfig({...baseConfig,period:'holdout'}));
});
test('H3a build skips unavailable data without network and records every combination',()=>{
  const old=globalThis.fetch;globalThis.fetch=()=>{throw new Error('network forbidden');};
  try{const q=buildQueue(baseConfig,read('candidates/seed-strategies.json'),()=>null);assert.equal(q.items.length,0);assert.equal(q.skipped.length,64);}finally{globalThis.fetch=old;}
});
test('H3a missing funding and manual evidence are not replaced by OHLCV',()=>{
  const candidate=clone(queue.items[0].candidate);candidate.dataRequirements.requiredFeatures.push('fundingRate','manual evidence');
  const issues=inputIssues(candidate,{candles:[]},null,'BTC','4h',baseConfig);
  assert.ok(issues.includes('incomplete research OHLCV coverage'));assert.ok(issues.includes('unavailable required feature: manual evidence'));
});
test('H3a hard invocation caps and per-invocation pending order',t=>{
  const items=Array.from({length:600},(_,i)=>{const item=clone(queue.items[0]);item.id=item.candidate.id=`test-${i}-v0`;return item;});
  const f=fixture(t,items),seen=[];
  for(const options of [{maxVariants:601},{maxMs:MAX_MS+1},{maxVariants:0}])assert.throws(()=>runQueue({...f,...options}));
  const result=runQueue({...f,maxVariants:2,execute:i=>{seen.push(i.id);return rejected();}});
  assert.deepEqual(seen,['test-0-v0','test-1-v0']);assert.equal(result.report.stopReason,'variant_cap');assert.equal(result.report.totals.remaining,598);assert.equal(result.exitCode,0);
  assert.equal(MAX_VARIANTS,600);
});
test('H3a deadline prevents starting another item',t=>{
  const f=fixture(t);let called=false;
  const result=runQueue({...f,maxMs:1000,execute:()=>{called=true;return rejected();}});
  assert.equal(called,false);assert.equal(result.report.stopReason,'time_cap');assert.equal(result.report.totals.run,0);
});
test('H3a failure checkpoint stops subsequent work and returns nonzero',t=>{
  const f=fixture(t,clone(queue.items.slice(0,2)));
  const result=runQueue({...f,execute:()=>{throw new Error('deliberate test failure');}});
  const saved=JSON.parse(fs.readFileSync(f.queuePath));assert.equal(saved.items[0].status,'error');assert.equal(saved.items[1].status,'pending');assert.equal(result.exitCode,1);assert.equal(result.report.totals.errors,1);
});
test('H3a actual CLI failing worker marks item error and exits nonzero, offline',t=>{
  const f=fixture(t);
  const child=spawnSync(process.execPath,[new URL('../src/run-queue.mjs',import.meta.url).pathname,'--queue',f.queuePath,'--config',f.configPath,'--results',f.resultsDir],{encoding:'utf8'});
  assert.equal(child.status,1,child.stderr);const saved=JSON.parse(fs.readFileSync(f.queuePath));assert.equal(saved.items[0].status,'error');assert.match(saved.items[0].error,/missing frozen research OHLCV/);
  assert.ok(fs.readdirSync(f.resultsDir).some(n=>n.endsWith('.md')));
});
test('H3a real worker uses H2 next_open and appends exactly one registry row',t=>{
  const f=fixture(t),start=Date.parse(PERIODS.research[0])/1000,end=Date.parse(PERIODS.research[1])/1000;
  const candles=Array.from({length:(end-start)/14400},(_,i)=>({time:start+i*14400,open:100,high:102,low:98,close:100+Math.sin(i),volume:100+i%23}));
  const item=f.queue.items[0];
  const frozen=freezeSeries(candles,item.symbol,item.timeframe,f.config);item.snapshotSha256=frozen.entry.sha256;
  fs.writeFileSync(f.queuePath,JSON.stringify(f.queue));
  const result=runQueue(f);assert.equal(result.exitCode,0);assert.equal(result.report.registryAppendedRows,1);
  const row=registryRows(f.config.h2Paths.registry)[0];assert.equal(row.entryMode,'next_open');assert.equal(row.period.name,'research');assert.deepEqual(row.identity.costs,baseConfig.costs);
});
test('H3a historical variants deduplicate repeated reports and survivor rows',t=>{
  const f=fixture(t),v={candidateId:'a',variantId:'a#1',family:'old-family',rule:'breakout'};
  fs.writeFileSync(path.join(f.resultsDir,'filter-report.json'),JSON.stringify({verdicts:[v],survivors:[v]}));
  fs.writeFileSync(path.join(f.resultsDir,'strategy-spam-test.json'),JSON.stringify({verdicts:[v,{...v,variantId:'a#2'}]}));
  const h=historicalCounts(f.resultsDir);assert.equal(h.uniqueVariants,2);assert.equal(h.perRule.breakout,2);assert.equal(h.perSourceFamily['old-family'],2);assert.equal(h.sources[0].uniqueVariants,1);
});
test('H3a interrupted running item is never automatically retried',t=>{
  const f=fixture(t);f.queue.items[0].status='running';fs.writeFileSync(f.queuePath,JSON.stringify(f.queue));assert.throws(()=>runQueue(f),/review action log/);
});
