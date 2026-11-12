#!/usr/bin/env node
// Audit *every* current skill identity against existing read-only projections.
// No cloud read/write and no invented server-combat parity claims.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const local=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

export function auditOsSkillFormulaCoverage({skills,classes,calculator}={}){
 if(!skills||!classes||typeof calculator?.scalingSkillPreview!=='function')
  throw Error('Expected pinned skill/class catalog and OS formula inspector');
 const entries=Object.entries(skills).sort((a,b)=>Number(a[0])-Number(b[0]));
 const coverage=new Map();
 const effectNames=new Set();
 let effectRecords=0;
 for(const [key,source] of entries){
  const id=Number(key);
  if(!Number.isSafeInteger(id)||id<1||source?.id!==id||
   !Array.isArray(source.funcs))
   throw Error('Malformed source skill identity/effects '+key);
  effectRecords+=source.funcs.length;
  for(const effect of source.funcs)if(typeof effect?.ep==='string')
   effectNames.add(effect.ep);
  coverage.set(id,{id,name:String(source.name||''),skillType:source.skillType||null,
   learnable:source.learnable===true,
   sourceEffects:[...new Set(source.funcs.map(x=>x?.ep).filter(Boolean))].sort(),
   classCount:Object.values(source.classes||{}).filter(Boolean).length,
   sourcePreview:false,numericPreview:false,coefficientModel:false});
 }
 // Theoretical cap-level inspection, NOT a legal single build or proof of
 // how the live server calculates against targets. This is a coverage census.
 const classNames=Object.keys(classes).sort();
 const combat={attack:{walkingBase:200},defense:{directRaw:100},
  accuracy:{base:140},dodge:{base:120}};
 const stats={vit:80,str:100,agi:100,dex:90,spi:110,int:110};
 for(const jobKey of classNames){
  const branchCaps=classes[jobKey]?.branchCaps;
  if(!branchCaps||typeof branchCaps!=='object')
   throw Error('Missing class mastery caps '+jobKey);
  const branchMasteries=Object.fromEntries(Object.entries(branchCaps).map(
   ([name,limit])=>[name,Number.isSafeInteger(limit)&&limit>=0?limit:0]));
  const result=calculator.scalingSkillPreview({skillCatalog:skills,
   jobKey,level:55,branchCaps,branchMasteries,stats,combat,
   weaponKind:'BARE_HAND',hasShield:true});
  for(const row of [...(result.offense||[]),...(result.defense||[])]){
   const record=coverage.get(Number(row.id));
   if(!record)throw Error('Unrecognized formula preview skill '+row.id);
   record.sourcePreview=true;
   if(Number.isFinite(row.amount))record.numericPreview=true;
   if(Array.isArray(row.coefficientModels)&&row.coefficientModels.length>0)
    record.coefficientModel=true;
  }
 }
 const statusKeys=['numeric-preview','coefficient-model','qualitative-preview',
  'passive-source','internal-or-triggered-source','unmodeled-learnable'];
 const byStatus=Object.fromEntries(statusKeys.map(key=>[key,0]));
 const rows=[...coverage.values()].map(item=>{
  let status;
  if(!item.learnable)status='internal-or-triggered-source';
  else if(item.numericPreview)status='numeric-preview';
  else if(item.coefficientModel)status='coefficient-model';
  else if(item.sourcePreview)status='qualitative-preview';
  else if(item.skillType==='PASSIVE')status='passive-source';
  else status='unmodeled-learnable';
  byStatus[status]++;
  return {...item,status};
 });
 return {source:'checked-in data/os/skills.json (no production D1 writes)',
  methodology:'28 theoretical class-max snapshots, not legal full character builds',
  certainty:'numbers are simulator previews/models, NOT server parity proof',
  summary:{skillRecords:rows.length,effectRecords,uniqueEffectTypes:effectNames.size,
   inspectedClasses:classNames.length,statuses:byStatus},
  rows};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const host={};
 Function('window',local('pandora-os-character-calculator.js'))(host);
 const skills=JSON.parse(local('data/os/skills.json'));
 const classes=JSON.parse(local('data/os/classes.json'));
 const report=auditOsSkillFormulaCoverage({
  skills,classes,calculator:host.PandoraOSCalculator});
 const all=process.argv.includes('--all');
 console.log(JSON.stringify(all?report:{
  source:report.source,methodology:report.methodology,
  certainty:report.certainty,summary:report.summary},null,2));
}
