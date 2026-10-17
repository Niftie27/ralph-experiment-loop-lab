#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { ROOT, sha256, registryRows, pathsFor } from './h2-contract.mjs';
import { MAX_VARIANTS, MAX_MS, RULES, validateQueue, researchConfig, historicalCounts, countValues } from './research-queue.mjs';
const root=fileURLToPath(ROOT);
export const runtimeFiles=['src/run-queue-r6.sh','src/run-queue.mjs','src/queue-worker.mjs','src/research-queue.mjs','src/spam-candidates.mjs','src/candidate-spec.mjs','src/engine.mjs','src/h2-contract.mjs','config.default.json'];
const hashes=()=>Object.fromEntries(runtimeFiles.map(f=>[f,sha256(fs.readFileSync(path.join(root,f)))]));
const save=(file,value)=>{ fs.writeFileSync(`${file}.tmp`,JSON.stringify(value,null,2)+'\n'); fs.renameSync(`${file}.tmp`,file); };
export function executeItem(item,config,trialCount,remainingMs) {
  try {
    return JSON.parse(execFileSync(process.execPath,[path.join(root,'src/queue-worker.mjs')],{
      input:JSON.stringify({item,config,trialCount}),encoding:'utf8',timeout:Math.max(1,Math.floor(remainingMs)),killSignal:'SIGKILL',maxBuffer:1024*1024,stdio:['pipe','pipe','pipe']
    }));
  } catch(error) {
    const detail=String(error.stderr??'').split('\n').find(s=>s.startsWith('Error:'))??'';
    throw new Error(`worker failed: code=${error.code??'none'} exit=${error.status??'none'} signal=${error.signal??'none'} ${detail.replaceAll(root,'')}`);
  }
}
export function runQueue({queuePath=path.join(root,'research-queue.json'),configPath=path.join(root,'config.default.json'),resultsDir=path.join(root,'results'),maxVariants=MAX_VARIANTS,maxMs=MAX_MS,execute=executeItem,now=Date.now}={}) {
  if (!Number.isInteger(maxVariants)||maxVariants<1||maxVariants>MAX_VARIANTS) throw new Error('Invocation variant cap must be 1..600');
  if (!Number.isFinite(maxMs)||maxMs<=0||maxMs>MAX_MS) throw new Error('Invocation deadline must be <=90 minutes');
  const started=now(), generatedAt=new Date(started).toISOString();
  const queue=JSON.parse(fs.readFileSync(queuePath,'utf8')); validateQueue(queue);
  const config=researchConfig(JSON.parse(fs.readFileSync(configPath,'utf8')));
  if (queue.items.some(i=>i.status==='running')) throw new Error('Interrupted running item: review action log/registry before any restart');
  const lock=`${queuePath}.lock`; const fd=fs.openSync(lock,'wx');
  try {
    const runtimeHashes=hashes(), queueInputSha256=sha256(fs.readFileSync(queuePath));
    const history=historicalCounts(resultsDir);
    const trialCount=Math.max(config.multipleTesting?.familyPenaltyFloor??1,history.uniqueVariants+queue.items.length);
    const registry=pathsFor(config).registry;
    const prefix=fs.existsSync(registry)?fs.readFileSync(registry):Buffer.alloc(0);
    const initialRegistryLines=registryRows(registry).length;
    const processed=[];
    let stopReason='exhausted';
    for(const item of queue.items) {
      if(item.status!=='pending') continue;
      if(processed.length>=maxVariants) {stopReason='variant_cap';break;}
      // Reserve time for checkpoint/report writes. Worker cannot outlive the invocation deadline.
      const remaining=maxMs-(now()-started)-1000;
      if(remaining<=0) {stopReason='time_cap';break;}
      item.status='running';item.startedAt=new Date(now()).toISOString();save(queuePath,queue);
      try {
        const result=execute(item,config,trialCount,remaining);
        if(!['pass','reject'].includes(result.status)||!Array.isArray(result.reasons)) throw new Error('Invalid worker result');
        item.status=result.status;item.result=result;
      } catch(error) {
        item.status='error';item.error=error.message;stopReason='error';
      }
      item.finishedAt=new Date(now()).toISOString();item.trialCount=trialCount;
      processed.push(item);save(queuePath,queue);
      if(item.status==='error') break; // No automatic retries, no later data work after a failure.
    }
    const after=fs.existsSync(registry)?fs.readFileSync(registry):Buffer.alloc(0);
    const integrityErrors=[];
    if(!after.subarray(0,prefix.length).equals(prefix)) integrityErrors.push('Registry prefix changed');
    if(JSON.stringify(runtimeHashes)!==JSON.stringify(hashes())) integrityErrors.push('Runtime source hashes changed');
    const completed=processed.filter(i=>['pass','reject'].includes(i.status));
    const registryLineCount=registryRows(registry).length;
    if(execute===executeItem && registryLineCount-initialRegistryLines!==completed.length) integrityErrors.push('Registry append count does not equal completed variants; inspect before retry');
    const report={generatedAt,finishedAt:new Date(now()).toISOString(),runtimeSeconds:(now()-started)/1000,
      period:'research',entryMode:'next_open',dataStart:config.dataStart,dataEnd:config.dataEnd,costs:config.costs,gates:config.gates,
      limits:{maxVariants,maxMs},stopReason,trialCount,trialCountMethod:'max(config floor, historical distinct variants + full queued batch); conservative cross-family proxy, not formal DSR',history,
      totals:{run:processed.length,passed:processed.filter(i=>i.status==='pass').length,rejected:processed.filter(i=>i.status==='reject').length,
        errors:processed.filter(i=>i.status==='error').length+integrityErrors.length,remaining:queue.items.filter(i=>i.status==='pending').length},
      priorErrorItems:queue.items.filter(i=>i.status==='error'&&!processed.includes(i)).map(i=>i.id),
      perFamily:Object.fromEntries(RULES.map(rule=>[rule,{...{run:0,pass:0,reject:0,error:0},...countValues(processed.filter(i=>i.rule===rule).map(i=>i.status)),run:processed.filter(i=>i.rule===rule).length}])),
      rejectionReasons:countValues(completed.flatMap(i=>i.result.reasons)),
      top10:completed.filter(i=>Number.isFinite(i.result.outOfSampleExpectancyR)).sort((a,b)=>b.result.outOfSampleExpectancyR-a.result.outOfSampleExpectancyR||a.id.localeCompare(b.id)).slice(0,10).map(i=>({id:i.id,rule:i.rule,symbol:i.symbol,timeframe:i.timeframe,sourceCandidateId:i.sourceCandidateId,...i.result})),
      skipped:queue.skipped,eligibleBeforeCap:queue.eligibleBeforeCap,deferredByCap:queue.deferredByCap,
      initialRegistryLines,registryLineCount,registryAppendedRows:registryLineCount-initialRegistryLines,registryPrefixSha256:sha256(prefix),registryPrefixPreserved:after.subarray(0,prefix.length).equals(prefix),
      runtimeHashes,runtimeMatchesRepo:integrityErrors.length===0,queueInputSha256,integrityErrors,
      itemErrors:processed.filter(i=>i.status==='error').map(i=>({id:i.id,error:i.error})),
      inputContract:queue.inputContract,selectionNote:queue.selectionNote};
    fs.mkdirSync(resultsDir,{recursive:true});
    const base=path.join(resultsDir,`queue-run-${generatedAt.slice(0,10)}`);
    // Append invocations in the daily Markdown; timestamped JSON keeps each invocation auditable.
    const jsonFile=`${base}-${generatedAt.slice(11,23).replaceAll(':','').replace('.','')}.json`;
    fs.writeFileSync(jsonFile,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    fs.appendFileSync(`${base}.md`,renderReport(report));
    return {report,exitCode:report.totals.errors||report.priorErrorItems.length?1:0};
  } finally {fs.closeSync(fd);fs.unlinkSync(lock);}
}
export function renderReport(r) {
  const fmt=v=>Number.isFinite(v)?v:'n/a';
  return [`# H3a research queue — ${r.generatedAt}`,'',`Research only; next_open; unchanged costs and gates. ${r.selectionNote}`,'',
    `Run=${r.totals.run}; pass=${r.totals.passed}; reject=${r.totals.rejected}; errors=${r.totals.errors}; pending=${r.totals.remaining}; stop=${r.stopReason}; runtime=${r.runtimeSeconds}s.`,
    `Registry=${r.registryLineCount} lines; appended=${r.registryAppendedRows}; prefix preserved=${r.registryPrefixPreserved}; runtime hashes unchanged=${r.runtimeMatchesRepo}.`,
    `Trial count=${r.trialCount}: ${r.trialCountMethod}. Historical total=${r.history.uniqueVariants}.`,'','## Input contract','',r.inputContract,'','## Counts by rule family','',
    ...Object.entries(r.perFamily).map(([k,v])=>`- ${k}: run=${v.run}, pass=${v.pass}, reject=${v.reject}, error=${v.error}; historical=${r.history.perRule[k]??0}`),
    '','## Rejection reasons (overlapping)','',...Object.entries(r.rejectionReasons).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`- ${k}: ${v}`),
    '','## Top 10 by OOS expectancy (ranking is not promotion)','',...r.top10.map(i=>`- ${i.id} ${i.symbol}/${i.timeframe} ${i.rule}: ${i.status}; trades=${i.trades}; expectancy=${fmt(i.expectancyR)}R; PF=${fmt(i.profitFactor)}; OOS trades=${i.outOfSampleTrades}; OOS=${fmt(i.outOfSampleExpectancyR)}R; deflated Sharpe proxy=${fmt(i.deflatedSharpe)}`),
    '','## Historical report inventory','',...r.history.sources.map(s=>`- ${s.file}: ${s.uniqueVariants}; per-rule=${JSON.stringify(s.perRule)}`),
    '',`Historical original-family counts: ${JSON.stringify(r.history.perSourceFamily)}`,'','## Unavailable combinations','',...r.skipped.map(s=>`- ${s.rule} ${s.symbol}/${s.timeframe}: ${s.reasons.join('; ')}`),
    '',`Eligible before cap=${r.eligibleBeforeCap}; deferred by cap=${r.deferredByCap}.`,'','## Errors','',...r.itemErrors.map(e=>`- ${e.id}: ${e.error}`),...r.integrityErrors.map(e=>`- ${e}`),'',''].join('\n');
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const args=process.argv.slice(2), options={};
    const flags={'--queue':'queuePath','--config':'configPath','--results':'resultsDir','--max-variants':'maxVariants','--max-ms':'maxMs'};
    for(let i=0;i<args.length;i+=2) {
      if(!flags[args[i]]||args[i+1]===undefined) throw new Error('Unknown or incomplete queue option');
      options[flags[args[i]]]=args[i].startsWith('--max-')?Number(args[i+1]):path.resolve(args[i+1]);
    }
    const {report,exitCode}=runQueue(options);console.log(JSON.stringify({totals:report.totals,runtimeSeconds:report.runtimeSeconds,registryLineCount:report.registryLineCount,exitCode}));process.exitCode=exitCode;
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
