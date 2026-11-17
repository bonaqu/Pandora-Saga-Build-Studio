#!/usr/bin/env node
// Source-only inventory: no game client, mathematical inference or D1 writes.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const fields=['a','b','min','max'];
export function auditOsSoulEffectFamilies(souls){
 if(!souls||typeof souls!=='object'||Array.isArray(souls))
  throw Error('Expected current OS Soul source map');
 const families=new Map(),slots=new Map();
 let effects=0,negativeValues=0,zeroValues=0;
 const ids=Object.keys(souls).sort((a,b)=>Number(a)-Number(b));
 for(const id of ids){
  const soul=souls[id],numeric=Number(id);
  if(!Number.isSafeInteger(numeric)||numeric<=0||soul?.id!==numeric||
   typeof soul.name!=='string'||!soul.name.trim()||
   !Array.isArray(soul.slots)||!soul.slots.length||
   !soul.slots.every(x=>typeof x==='string'&&x.trim())||
   !Array.isArray(soul.effects))
   throw Error('Malformed source Soul '+id);
  for(const slot of new Set(soul.slots))
   slots.set(slot,(slots.get(slot)||0)+1);
  const seen=new Set();
  for(let index=0;index<soul.effects.length;index++){
   const effect=soul.effects[index];
   if(!effect||typeof effect.func!=='string'||
    !/^EP_[A-Z0-9_]+$/.test(effect.func)||
    !(effect.dir===null||(typeof effect.dir==='string'&&/^[A-Z_]+$/.test(effect.dir)))||
    !fields.every(key=>Number.isFinite(effect[key])))
    throw Error('Malformed Soul effect '+id+' at '+index);
   effects++;
   for(const field of fields){
    if(effect[field]<0)negativeValues++;
    if(effect[field]===0)zeroValues++;
   }
   if(!families.has(effect.func)){
    families.set(effect.func,{
     ep:effect.func,certainty:'source-parameters-only',effectRecords:0,
     soulCount:0,soulIds:[],directions:{},
     nonzero:{a:0,b:0,min:0,max:0},
     negative:{a:0,b:0,min:0,max:0},
     examples:[]
    });
   }
   const family=families.get(effect.func);
   family.effectRecords++;
   if(!seen.has(effect.func)){
    seen.add(effect.func);
    family.soulCount++;
    family.soulIds.push(numeric);
   }
   const direction=effect.dir===null?'UNSPECIFIED':effect.dir;
   family.directions[direction]=(family.directions[direction]||0)+1;
   for(const field of fields){
    if(effect[field]!==0)family.nonzero[field]++;
    if(effect[field]<0)family.negative[field]++;
   }
   if(family.examples.length<3)
    family.examples.push({soulId:numeric,dir:effect.dir,
     a:effect.a,b:effect.b,min:effect.min,max:effect.max});
  }
 }
 const effectFamilies=[...families.values()].sort((a,b)=>a.ep.localeCompare(b.ep,'en'));
 const slotCounts=Object.fromEntries([...slots].sort((a,b)=>a[0].localeCompare(b[0],'en')));
 return {
  source:'checked-in data/os/souls.json (no production D1 operations)',
  certainty:'source-parameters-only: signed a/b/min/max do NOT prove final game formulas',
  summary:{soulRecords:ids.length,effectRecords:effects,uniqueEffectFamilies:effectFamilies.length,
   negativeValues,zeroValues,slotCounts},
  effectFamilies
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const souls=JSON.parse(readFileSync(new URL('../data/os/souls.json',import.meta.url),'utf8'));
 const report=auditOsSoulEffectFamilies(souls);
 const full=process.argv.includes('--all');
 console.log(JSON.stringify(full?report:{
  source:report.source,certainty:report.certainty,summary:report.summary,
  families:report.effectFamilies.map(f=>({
   ep:f.ep,certainty:f.certainty,souls:f.soulCount,effects:f.effectRecords,
   directions:f.directions,nonzero:f.nonzero,negative:f.negative
  }))
 },null,2));
}
