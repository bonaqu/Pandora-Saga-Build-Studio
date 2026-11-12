#!/usr/bin/env node
// Audit *every* current skill identity against existing read-only projections.
// No cloud read/write and no invented server-combat parity claims.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const local=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

export function auditOsSkillFormulaCoverage({skills,classes,calculator}={}){
 const modules=['scalingSkillPreview','healingSpellsPreview',
  'periodicRecoveryPreview','songSkillPreview','resistanceSkillChoices'];
 if(!skills||!classes||!modules.every(name=>typeof calculator?.[name]==='function'))
  throw Error('Expected pinned skill/class catalog and all OS formula inspectors');
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
   sourcePreview:false,numericPreview:false,coefficientModel:false,
   sourceParameter:false,sourceModules:[],targetSideOnly:false});
 }
 // Theoretical class-cap inspection, NOT a legal single build or proof
 // of server parity. Walk existing formula modules before flagging gaps.
 // A skill already modeled by Healing must NOT be called "unmodeled"
 // merely because it does not belong in the combat Skill Effects inspector.
 const mark=(id,module,{numeric=false,targetSide=false}={})=>{
  const record=coverage.get(Number(id));
  if(!record||!record.learnable)
   throw Error('Unexpected formula source skill '+id+' from '+module);
  record.sourcePreview=true;
  if(numeric)record.numericPreview=true;
  if(targetSide)record.targetSideOnly=true;
  if(!record.sourceModules.includes(module))record.sourceModules.push(module);
  return record;
 };
 // Certain OS sphere/area execution records carry learnable=true despite
 // having no caster classes. If another ability explicitly EP_SKILL_EXECs
 // that ID, it is a triggered child, not a missing selectable spell.
 const skillExecChildren=new Set(entries.flatMap(([,entry])=>
  entry.funcs.filter(f=>f?.ep==='EP_SKILL_EXEC'&&
   Number.isSafeInteger(f?.fv1?.[3])).map(f=>f.fv1[3])));
 for(const item of coverage.values())
  item.triggeredChild=item.classCount===0&&skillExecChildren.has(item.id);

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
  for(const row of [...(result.offense||[]),...(result.defense||[]),...(result.movement||[]),...(result.utility||[])]){
   const record=mark(row.id,'skill-effects',{numeric:Number.isFinite(row.amount)});
   if(Array.isArray(row.coefficientModels)&&row.coefficientModels.length>0)
    record.coefficientModel=true;
   if(Array.isArray(row.sourceParameters)&&row.sourceParameters.some(p=>
    p?.confidence==='source-parameter'&&Number.isSafeInteger(p.amount)))
    record.sourceParameter=true;
  }
  // The Healing chapter has its own Remaked numerical stages and OS skill
  // gates. Include BOTH 45 and 55: level-50 CLERIC upgrades replace
  // the original skill ID, but the originals are still valid at 45.
  // The 55 snapshot is audit-only, never a claim about today's level cap.
  for(const level of [45,55]){
   const benevolenceCap=branchCaps.benevolence??0;
   const parameters={level,jobKey,skillCatalog:skills,
    benevolenceCap,benevolence:benevolenceCap,spi:stats.spi};
   if(typeof calculator.healingSpellsPreview==='function'){
    const spells=calculator.healingSpellsPreview({
     ...parameters,int:stats.int,healingPercent:100});
    for(const row of spells?.rows||[]){
     if(row.available&&Number.isSafeInteger(row.skillId)&&
      Number.isFinite(row.amount))
      mark(row.skillId,'healing-spells',{numeric:true});
    }
   }
   if(typeof calculator.periodicRecoveryPreview==='function'){
    const periodic=calculator.periodicRecoveryPreview(parameters);
    for(const row of periodic?.rows||[]){
     if(row.available&&Number.isSafeInteger(row.id)&&
      Number.isFinite(row.amount))
      mark(row.id,'periodic-recovery',{numeric:true});
    }
   }
  }
  if(typeof calculator.songSkillPreview==='function'){
   const songs=calculator.songSkillPreview({skillCatalog:skills,jobKey,
    level:45,branchMasteries,branchCaps});
   for(const row of songs?.rows||[])if(row.available)
    mark(row.id,'song-source');
  }
 }
 // The five enemy elemental spells are modeled on the hero as incoming
 // target and are NOT own passive resistance. Divine Blessing is an
 // independent party buff. These exact signed source values are numeric
 // previews, but never a verified final resistance-roll probability.
 if(typeof calculator.resistanceSkillChoices==='function'){
  for(const row of calculator.resistanceSkillChoices(skills)){
   if(!row||!Object.values(row.effects||{}).every(Number.isFinite))
    continue;
   mark(row.id,'target-resistance',{
    numeric:true,targetSide:row.incoming===true});
  }
 }
 const statusKeys=['numeric-preview','coefficient-model','source-parameter','qualitative-preview',
  'passive-source','internal-or-triggered-source','unmodeled-learnable'];
 const byStatus=Object.fromEntries(statusKeys.map(key=>[key,0]));
 const rows=[...coverage.values()].map(item=>{
  let status;
  if(!item.learnable||item.triggeredChild)status='internal-or-triggered-source';
  else if(item.numericPreview)status='numeric-preview';
  else if(item.coefficientModel)status='coefficient-model';
  else if(item.sourceParameter)status='source-parameter';
  else if(item.sourcePreview)status='qualitative-preview';
  else if(item.skillType==='PASSIVE')status='passive-source';
  else status='unmodeled-learnable';
  byStatus[status]++;
  return {...item,status};
 });
 return {source:'checked-in data/os/skills.json (no production D1 writes)',
  methodology:'28 theoretical class-max snapshots at levels 45/55; cross-module census, not legal full character builds',
  certainty:'numbers are simulator previews/models, NOT server parity proof; incoming TARGET effects are not self passives',
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
