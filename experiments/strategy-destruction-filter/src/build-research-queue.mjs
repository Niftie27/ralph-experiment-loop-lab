import fs from 'node:fs';
import { buildQueue, researchConfig } from './research-queue.mjs';
import { ROOT } from './h2-contract.mjs';
const json=f=>JSON.parse(fs.readFileSync(new URL(f,ROOT),'utf8'));
const queue=buildQueue(researchConfig(json('config.default.json')),json('candidates/seed-strategies.json'));
// Never silently reset a prior queue.
fs.writeFileSync(new URL('research-queue.json',ROOT),JSON.stringify(queue,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({items:queue.items.length,skipped:queue.skipped.length,eligibleBeforeCap:queue.eligibleBeforeCap}));
