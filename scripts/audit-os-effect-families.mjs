#!/usr/bin/env node
// Read-only structural census of every current OS EP family. Source vectors
// are NOT a proof of combat math, final damage, hit rolls or rounding.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const KNOWN_EXECUTION_REFERENCES=new Set([
 'EP_SKILL_EXEC','EP_ONHIT_SKILL_EXEC',
 'EP_ONHIT_SKILL_EXEC_CHANGE_BA','EP_SKILL_EXEC_COUNT',
 'EP_SKILL_EXEC_DIFFUSION','EP_SKILL_PARRY_COUNTER',
 'EP_ATTACK_BLOCK_BREAK'
]);
const asId=value=>Number.isSafeInteger(value)&&value>0?String(value):null;
// Source shape tracks nonzero positions and direction, not combat semantics.
const activeSlots=vector=>vector.flatMap((value,index)=>value!==0?[index]:[]);
const shapeSignature=(direction,fv1Slots,fv2Slots)=>
 [direction,'fv1='+ (fv1Slots.join(',')||'-'),'fv2='+(fv2Slots.join(',')||'-')].join(';');

export function auditOsEffectFamilies(skills){
 if(!skills||typeof skills!=='object'||Array.isArray(skills))
  throw Error('Expected a complete OS skill object');
 const sourceIds=new Set(Object.keys(skills));
 const families=new Map();
 let skillCount=0,effectCount=0,sourceLinks=0,missingLinks=0,zeroVectorEffects=0;
 const keys=[...sourceIds].sort((a,b)=>Number(a)-Number(b));
 for(const id of keys){
  const skill=skills[id],numeric=Number(id);
  if(!Number.isSafeInteger(numeric)||numeric<=0||skill?.id!==numeric||
   !Array.isArray(skill.funcs))
   throw Error('Invalid source skill '+id);
  skillCount++;
  const seen=new Set();
  for(let i=0;i<skill.funcs.length;i++){
   const effect=skill.funcs[i];
   if(!effect||typeof effect.ep!=='string'||
    !/^EP_[A-Z0-9_]+$/.test(effect.ep)||
    !(effect.dir===null||(typeof effect.dir==='string'&&effect.dir))||
    !Array.isArray(effect.fv1)||effect.fv1.length!==4||
    !Array.isArray(effect.fv2)||effect.fv2.length!==4||
    ![...effect.fv1,...effect.fv2].every(Number.isFinite))
    throw Error('Invalid EP/vector at skill '+id+' effect '+i);
   effectCount++;
   if(!families.has(effect.ep))families.set(effect.ep,{
    ep:effect.ep,certainty:'source-shape-only',effectCount:0,
    skillCount:0,skillIds:[],directions:{},
    nonzeroPositionCounts:{fv1:[0,0,0,0],fv2:[0,0,0,0]},
    negativePositionCounts:{fv1:[0,0,0,0],fv2:[0,0,0,0]},
    samples:[],executionReference:null,sourceShapeMap:new Map()
   });
   const family=families.get(effect.ep);
   family.effectCount++;
   const direction=effect.dir===null?'UNSPECIFIED':effect.dir;
   family.directions[direction]=(family.directions[direction]||0)+1;
   const fv1Slots=activeSlots(effect.fv1),fv2Slots=activeSlots(effect.fv2);
   if(!fv1Slots.length&&!fv2Slots.length)zeroVectorEffects++;
   const signature=shapeSignature(direction,fv1Slots,fv2Slots);
   if(!family.sourceShapeMap.has(signature))family.sourceShapeMap.set(signature,{
    signature,direction,fv1Slots,fv2Slots,effects:0,skillIds:[]
   });
   const shape=family.sourceShapeMap.get(signature);
   shape.effects++;
   if(!shape.skillIds.includes(numeric))shape.skillIds.push(numeric);
   if(!seen.has(effect.ep)){
    seen.add(effect.ep);family.skillCount++;family.skillIds.push(numeric);
   }
   for(const vector of ['fv1','fv2'])
    effect[vector].forEach((value,position)=>{
     if(value!==0)family.nonzeroPositionCounts[vector][position]++;
     if(value<0)family.negativePositionCounts[vector][position]++;
    });
   if(family.samples.length<3)family.samples.push({
    skillId:numeric,dir:effect.dir,fv1:[...effect.fv1],fv2:[...effect.fv2]
   });
   if(KNOWN_EXECUTION_REFERENCES.has(effect.ep)){
    if(!family.executionReference)family.executionReference={
     positiveInteger:0,existingSkill:0,missingSkill:0,zeroOrNonId:0,
     missingTargets:[]
    };
    const target=asId(effect.fv1[3]);
    if(!target){family.executionReference.zeroOrNonId++;continue;}
    sourceLinks++;family.executionReference.positiveInteger++;
    if(sourceIds.has(target))family.executionReference.existingSkill++;
    else {
     missingLinks++;family.executionReference.missingSkill++;
     if(family.executionReference.missingTargets.length<10)
      family.executionReference.missingTargets.push({from:numeric,to:Number(target)});
    }
   }
  }
 }
 const effectFamilies=[...families.values()]
  .map(({sourceShapeMap,...family})=>({
   ...family,
   sourceShapes:[...sourceShapeMap.values()]
    .sort((a,b)=>a.signature<b.signature?-1:a.signature>b.signature?1:0)
  }))
  .sort((a,b)=>a.ep<b.ep?-1:a.ep>b.ep?1:0);
 return {
  source:'checked-in current game skill snapshot; no D1 operations',
  certainty:'source-shape-only: FV slots, directions and references do not prove live server formulas',
  summary:{skillCount,effectCount,distinctFamilies:effectFamilies.length,
   zeroVectorEffects,
   sourceShapeCount:effectFamilies.reduce((n,f)=>n+f.sourceShapes.length,0),
   familiesWithMultipleSourceShapes:effectFamilies.filter(f=>f.sourceShapes.length>1).length,
   executionReferences:sourceLinks,unresolvedExecutionReferences:missingLinks},
  effectFamilies
 };
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const skills=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
 const report=auditOsEffectFamilies(skills);
 const full=process.argv.includes('--all');
 console.log(JSON.stringify(full?report:{
  source:report.source,certainty:report.certainty,
  summary:report.summary,
  families:report.effectFamilies.map(f=>({
   ep:f.ep,certainty:f.certainty,effects:f.effectCount,skills:f.skillCount,
   dirs:f.directions,sourceShapes:f.sourceShapes.length,
   nonzeroFV1:f.nonzeroPositionCounts.fv1,
   nonzeroFV2:f.nonzeroPositionCounts.fv2,
   missingLinks:f.executionReference?.missingSkill||0
  }))
 },null,2));
}
