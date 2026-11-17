#!/usr/bin/env node
// Issue #476: inspect *source link candidates*, not runtime skill activation.
// This tool is read-only and makes no claims about hit/trigger/rounding rules.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const EXECUTION_REFERENCE_FAMILIES=Object.freeze([
 'EP_SKILL_EXEC','EP_ONHIT_SKILL_EXEC',
 'EP_ONHIT_SKILL_EXEC_CHANGE_BA','EP_SKILL_EXEC_COUNT',
 'EP_SKILL_EXEC_DIFFUSION','EP_SKILL_PARRY_COUNTER',
 'EP_ATTACK_BLOCK_BREAK'
]);
const families=new Set(EXECUTION_REFERENCE_FAMILIES);
const numericSort=(a,b)=>Number(a)-Number(b);

export function auditOsSkillExecutionGraph(skills){
 if(!skills||typeof skills!=='object'||Array.isArray(skills))
  throw Error('Expected current OS skill map');
 const ids=Object.keys(skills).sort(numericSort);
 const known=new Set(ids),outgoing=new Map(),incoming=new Map();
 const edges=[],zeroTargets=[],missingTargets=[],invalidTargets=[];
 for(const key of ids){
  const skill=skills[key],id=Number(key);
  if(!Number.isSafeInteger(id)||id<=0||String(id)!==key||
   skill?.id!==id||!Array.isArray(skill.funcs))
   throw Error('Malformed source skill '+key);
  outgoing.set(id,[]);
 }
 for(const key of ids){
  const skill=skills[key],id=Number(key);
  skill.funcs.forEach((effect,effectIndex)=>{
   if(!effect||typeof effect.ep!=='string'||
    !Array.isArray(effect.fv1)||effect.fv1.length!==4||
    !Array.isArray(effect.fv2)||effect.fv2.length!==4||
    ![...effect.fv1,...effect.fv2].every(Number.isFinite))
    throw Error('Malformed source effect '+key+' / '+effectIndex);
   if(!families.has(effect.ep))return;
   const to=effect.fv1[3];
   const evidence={from:id,to,ep:effect.ep,effectIndex,
    dir:effect.dir??null,fv1:[...effect.fv1],fv2:[...effect.fv2]};
   if(to===0){zeroTargets.push(evidence);return}
   if(!Number.isSafeInteger(to)||to<0){
    invalidTargets.push(evidence);return;
   }
   if(!known.has(String(to))){
    missingTargets.push(evidence);return;
   }
   const edge={...evidence,targetLearnable:skills[String(to)].learnable===true,
    targetClassAssigned:Object.values(skills[String(to)].classes||{}).some(Boolean)};
   edges.push(edge);outgoing.get(id).push(edge);
   if(!incoming.has(to))incoming.set(to,[]);
   incoming.get(to).push(edge);
  });
 }
 const roots=ids.map(Number).filter(id=>{
  const skill=skills[String(id)];
  return skill.learnable===true&&Object.values(skill.classes||{}).some(Boolean);
 });
 const visited=new Set(),queue=[...roots];
 while(queue.length){
  const id=queue.pop();
  if(visited.has(id))continue;
  visited.add(id);
  for(const edge of outgoing.get(id)||[])queue.push(edge.to);
 }
 // Detect cycles from *all* source records, including nonlearnable children.
 const active=new Set(),finished=new Set(),stack=[],cycles=[];
 const findCycles=id=>{
  if(finished.has(id))return;
  active.add(id);stack.push(id);
  for(const edge of outgoing.get(id)||[]){
   const next=edge.to;
   if(active.has(next)){
    cycles.push([...stack.slice(stack.indexOf(next)),next]);
   }else if(!finished.has(next))findCycles(next);
  }
  stack.pop();active.delete(id);finished.add(id);
 };
 for(const key of ids)if(!finished.has(Number(key)))findCycles(Number(key));
 // Show concrete paths for selectable skills that contain source references.
 // Only edges in the explicitly named source families are traversed; other
 // item/monster/trap triggers can exist and must not be declared inaccessible.
 const chains=[];
 const maxPaths=5000;
 for(const root of roots.filter(id=>outgoing.get(id).length)){
  const paths=[];
  const walk=(id,path,seen)=>{
   if(chains.reduce((n,row)=>n+row.paths.length,0)+paths.length>=maxPaths)
    throw Error('Execution path inventory exceeds safe report limit');
   const next=outgoing.get(id)||[];
   if(!next.length){paths.push(path);return}
   for(const edge of next){
    if(seen.has(edge.to)){paths.push([...path,edge.to]);continue}
    walk(edge.to,[...path,edge.to],new Set([...seen,edge.to]));
   }
  };
  walk(root,[root],new Set([root]));
  chains.push({rootId:root,paths});
 }
 const classlessTargets=[...incoming.keys()].filter(id=>
  !Object.values(skills[String(id)].classes||{}).some(Boolean)).sort((a,b)=>a-b);
 const unreachableTargets=[...incoming.keys()].filter(id=>!visited.has(id)).sort((a,b)=>a-b);
 const multiParentTargets=[...incoming].filter(([,refs])=>
  new Set(refs.map(x=>x.from)).size>1).map(([id,refs])=>({
   id,parentIds:[...new Set(refs.map(x=>x.from))].sort((a,b)=>a-b)
  })).sort((a,b)=>a.id-b.id);
 return {
  source:'checked-in current OS skill snapshot, no production D1 operation',
  certainty:'source-link-candidates-only: FV1[3] matching a skill ID is NOT proof of trigger timing, chance, damage or actual server execution',
  families:EXECUTION_REFERENCE_FAMILIES,
  summary:{skillCount:ids.length,referenceEdges:edges.length,
   zeroPlaceholders:zeroTargets.length,missingTargets:missingTargets.length,
   invalidTargets:invalidTargets.length,cycleCount:cycles.length,
   classAssignedLearnableRoots:roots.length,
   reachableFromClassAssignedRoots:visited.size,
   distinctTargets:incoming.size,classlessTargets:classlessTargets.length,
   notReachedFromClassAssignedRoots:unreachableTargets.length,
   multiParentTargets:multiParentTargets.length,
   chainRoots:chains.length,pathCount:chains.reduce((n,row)=>n+row.paths.length,0)},
  edges,zeroTargets,missingTargets,invalidTargets,cycles,
  roots,chains,classlessTargets,unreachableTargets,multiParentTargets
 };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const skills=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
 const report=auditOsSkillExecutionGraph(skills);
 const full=process.argv.includes('--all');
 console.log(JSON.stringify(full?report:{
  source:report.source,certainty:report.certainty,families:report.families,
  summary:report.summary,
  broken:[...report.missingTargets,...report.invalidTargets],
  cycles:report.cycles,
  classlessTargets:report.classlessTargets,
  multiParentTargets:report.multiParentTargets
 },null,2));
}
