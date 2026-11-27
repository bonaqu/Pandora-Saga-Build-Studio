#!/usr/bin/env node
// #476: 28-class × Lv1–55 synthetic Skill Effects contract regression.
// Inspects source-backed READ-ONLY previews; never asserts live combat parity.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const groupNames=Object.freeze(['offense','defense','movement','utility']);
const weapons=Object.freeze(['BARE_HAND','1H_SWORD','BOW','CROSSBOW']);
const stats=Object.freeze({vit:80,str:100,agi:100,dex:90,spi:110,int:110});
const combat=Object.freeze({
 attack:{walkingBase:200},defense:{directRaw:100},
 accuracy:{base:140},dodge:{base:120}
});
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

/**
 * A synthetic stress matrix, not a series of legal character allocations:
 * every level has its own class/source checks; at level 50+ the class's
 * theoretical max masteries are supplied intentionally to exercise previews.
 * No game-client outcomes, D1 requests or writes are part of this audit.
 */
export function auditOsClassLevelSkillMatrix({
 skills,classes,calculator,maxLevel=55
}={}){
 if(!object(skills)||!object(classes)||
  typeof calculator?.scalingSkillPreview!=='function'||
  !Number.isSafeInteger(maxLevel)||maxLevel<1||maxLevel>55)
  throw Error('Expected OS source skills/classes, preview API and levels 1..55');
 const classKeys=Object.keys(classes).sort();
 if(!classKeys.length||!Object.keys(skills).length)
  throw Error('Empty source skill/class catalog');
 const knownIds=new Set(Object.keys(skills));
 const discovered=new Set(),problems=[];
 const totals={scenarios:0,rows:0,numericRows:0,modeledRows:0,
  unavailableRows:0,sourceIdsInspected:0,errors:0};
 const report=(job,level,reason)=>{
  totals.errors++;
  if(problems.length<25)problems.push({job,level,reason});
 };
 const byClass=[];
 for(const job of classKeys){
  const caps=classes[job]?.branchCaps;
  if(!object(caps)||!Object.values(caps).every(n=>
   Number.isSafeInteger(n)&&n>=0))
   throw Error('Invalid source mastery caps for class '+job);
  let rows=0,modeled=0;
  for(let level=1;level<=maxLevel;level++){
   // Intentional endpoint conditions: zero mastery at 1..49, caps at 50..55.
   // No claim that these allocations are reachable with normal skill points.
   const masteries=Object.fromEntries(Object.keys(caps)
    .map(name=>[name,level>=50?caps[name]:0]));
   const weaponKind=weapons[(level-1)%weapons.length];
   let result;
   try{
    result=calculator.scalingSkillPreview({
     skillCatalog:skills,jobKey:job,level,branchCaps:caps,
     branchMasteries:masteries,stats,combat,weaponKind,
     hasShield:weaponKind==='1H_SWORD'
    });
   }catch(error){
    report(job,level,'Preview threw: '+String(error?.message||error).slice(0,100));
    totals.scenarios++;
    continue;
   }
   totals.scenarios++;
   if(!object(result)||result.verified!==false||
    !groupNames.every(group=>Array.isArray(result[group]))){
    report(job,level,'Missing group array or unexpected verified:true');
    continue;
   }
   const seen=new Set();
   for(const group of groupNames)for(const row of result[group]){
    totals.rows++;rows++;
    const id=String(row?.id);
    const skill=skills[id];
    if(!knownIds.has(id)||skill?.id!==row?.id||
     skill?.learnable!==true){
     report(job,level,'Unknown/nonlearnable preview source ID '+id);
     continue;
    }
    discovered.add(id);
    if(seen.has(id))
     report(job,level,'Duplicate source ID across preview groups '+id);
    seen.add(id);
    if(!row.recipient&&!skill?.classes?.[job])
     report(job,level,'Foreign class skill presented as self '+id);
    if(typeof row.available!=='boolean')
     report(job,level,'Missing availability state '+id);
    if(row.modelOnly===true&&row.uncertain!==true)
     report(job,level,'Unverified coefficient displayed as certain '+id);
    if(row.amount!==null&&!Number.isSafeInteger(row.amount))
     report(job,level,'Non-integer numerical projection '+id);
    if(row.amount!==null)totals.numericRows++;
    if(row.available===false)totals.unavailableRows++;
    if(row.modelOnly===true){modeled++;totals.modeledRows++;}
    if(!Array.isArray(row.coefficientModels)){
     report(job,level,'Missing coefficient evidence list '+id);
     continue;
    }
    for(const coefficient of row.coefficientModels){
     if(coefficient?.confidence!=='coefficient-model'||
      !Number.isSafeInteger(coefficient.amount))
      report(job,level,'Non-model or invalid coefficient '+id);
    }
   }
  }
  byClass.push({job,scenarios:maxLevel,rows,modeledRows:modeled});
 }
 totals.sourceIdsInspected=discovered.size;
 return {
  source:'checked-in game-data skill and class snapshots',
  certainty:'synthetic source-contract regression only; modelOnly != live server formula, no D1 reads or writes',
  parameters:{classes:classKeys.length,levels:1+'..'+maxLevel,
   weapons:[...weapons],mastery:'zero through level 49; class cap at 50+'},
  totals,byClass,problems
 };
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length>2)throw Error('Usage: node scripts/audit-os-class-level-skill-matrix-476.mjs');
 const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const skills=JSON.parse(read('data/os/skills.json'));
 const classes=JSON.parse(read('data/os/classes.json'));
 const host={};
 Function('window',read('pandora-os-character-calculator.js'))(host);
 const report=auditOsClassLevelSkillMatrix({
  skills,classes,calculator:host.PandoraOSCalculator
 });
 console.log(JSON.stringify(report,null,2));
 if(report.totals.errors)process.exitCode=1;
}
