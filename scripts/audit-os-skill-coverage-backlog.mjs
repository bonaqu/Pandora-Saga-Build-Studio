#!/usr/bin/env node
// #476: triage source-only Skill Effects coverage gaps without inventing combat formulas.
// This tool reads checked-in JSON and existing deterministic inspector reports only.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditOsSkillFormulaCoverage} from './audit-os-skill-formulas.mjs';
import {auditOsSkillExecutionGraph} from './audit-os-skill-execution-graph.mjs';

const numericSort=(a,b)=>a-b;
const statusSet=new Set(['unmodeled-learnable','source-access-limited']);
const sourceCapCandidate=(skill,job)=>{
 const lvl=skill.charLevel??0;
 if(!Number.isFinite(lvl)||lvl>55)return false;
 const reqs=skill.reqs||[];
 return Array.isArray(reqs)&&reqs.every(req=>
  typeof req.branch==='string'&&Number.isFinite(req.amount)&&
  Number(job.branchCaps?.[req.branch]??0)>=req.amount);
};

export function buildOsSkillCoverageBacklog({skills,classes,coverage,graph}={}){
 if(!skills||typeof skills!=='object'||Array.isArray(skills)||
  !classes||typeof classes!=='object'||Array.isArray(classes)||
  !coverage?.rows||!Array.isArray(coverage.rows)||
  !graph?.edges||!Array.isArray(graph.edges))
  throw Error('Expected complete source, class, formula-coverage and execution-graph snapshots');
 const ids=Object.keys(skills).sort((a,b)=>Number(a)-Number(b));
 const known=new Set(ids);
 if(coverage.rows.length!==ids.length||
  coverage.summary?.skillRecords!==ids.length||
  graph.summary?.skillCount!==ids.length)
  throw Error('Coverage/graph/source snapshot sizes differ');
 const rowsById=new Map();
 for(const entry of coverage.rows){
  const key=String(entry.id);
  if(!known.has(key)||rowsById.has(key))
   throw Error('Unmatched or duplicate formula coverage skill '+key);
  rowsById.set(key,entry);
 }
 const incoming=new Map(),outgoing=new Map();
 for(const edge of graph.edges){
  if(!known.has(String(edge.from))||!known.has(String(edge.to)))
   throw Error('Execution edge points outside current skill snapshot');
  const target={from:edge.from,to:edge.to,ep:edge.ep,effectIndex:edge.effectIndex};
  if(!incoming.has(edge.to))incoming.set(edge.to,[]);
  if(!outgoing.has(edge.from))outgoing.set(edge.from,[]);
  incoming.get(edge.to).push(target);
  outgoing.get(edge.from).push(target);
 }
 const statusCounts={'unmodeled-learnable':0,'source-access-limited':0};
 const categoryCounts={
  'source-cap-candidate':0,
  'source-cap-limited':0,
  'no-source-class-assignment':0,
  'wiki-access-limited':0
 };
 const epFamilies=new Map(),types=new Map(),rows=[];
 for(const id of ids){
  const skill=skills[id],record=rowsById.get(id);
  if(skill?.id!==Number(id)||!Array.isArray(skill.funcs))
   throw Error('Malformed current OS skill '+id);
  if(!statusSet.has(record.status))continue;
  if(skill.learnable!==true)
   throw Error('Nonlearnable source must not enter learnable backlog '+id);
  const classKeys=Object.keys(skill.classes||{}).filter(key=>Boolean(skill.classes[key])).sort();
  for(const key of classKeys)if(!classes[key])
   throw Error('Unknown source class '+key+' for skill '+id);
  const capCandidateKeys=classKeys.filter(key=>sourceCapCandidate(skill,classes[key]));
  const classification=record.status==='source-access-limited'?
   'wiki-access-limited':classKeys.length===0?
    'no-source-class-assignment':capCandidateKeys.length===0?
     'source-cap-limited':'source-cap-candidate';
  const epNames=[...new Set(skill.funcs.map(f=>f.ep))].sort();
  const row={
   id:Number(id),name:String(skill.name||''),skillType:skill.skillType??null,
   status:record.status,classification,
   charLevel:skill.charLevel??null,branch:skill.branch??null,
   prereqSkillId:skill.prereq??null,
   requirements:(skill.reqs||[]).map(r=>({branch:r.branch,amount:r.amount})),
   sourceClassKeys:classKeys,
   sourceCapCandidateClassKeys:capCandidateKeys,
   sourceEffects:epNames,
   sourceVectors:skill.funcs.map((effect,index)=>({
    index,ep:effect.ep,dir:effect.dir??null,
    fv1:[...effect.fv1],fv2:[...effect.fv2]
   })),
   referencedBy:[...(incoming.get(Number(id))||[])],
   references:[...(outgoing.get(Number(id))||[])],
   sourceModules:[...(record.sourceModules||[])],
   accessNoticeKind:record.accessNoticeKind??null
  };
  if(row.sourceVectors.some(f=>f.fv1.length!==4||f.fv2.length!==4||
   ![...f.fv1,...f.fv2].every(Number.isFinite)))
   throw Error('Invalid source FV vector at skill '+id);
  rows.push(row);
  statusCounts[record.status]++;
  categoryCounts[classification]++;
  types.set(row.skillType,(types.get(row.skillType)||0)+1);
  for(const ep of epNames){
   if(!epFamilies.has(ep))epFamilies.set(ep,{
    ep,backlogSkillIds:[],capCandidateSkillIds:[],
    noClassSkillIds:[],sourceCapLimitedSkillIds:[],
    sourceAccessLimitedSkillIds:[]
   });
   const family=epFamilies.get(ep);
   family.backlogSkillIds.push(row.id);
   if(capCandidateKeys.length)family.capCandidateSkillIds.push(row.id);
   if(classification==='no-source-class-assignment')family.noClassSkillIds.push(row.id);
   if(classification==='source-cap-limited')family.sourceCapLimitedSkillIds.push(row.id);
   if(classification==='wiki-access-limited')family.sourceAccessLimitedSkillIds.push(row.id);
  }
 }
 const families=[...epFamilies.values()]
  .map(f=>({...f,backlogSkills:f.backlogSkillIds.length}))
  .sort((a,b)=>b.capCandidateSkillIds.length-a.capCandidateSkillIds.length||
   b.backlogSkills-a.backlogSkills||a.ep.localeCompare(b.ep,'en'));
 const typeCounts=Object.fromEntries([...types.entries()]
  .sort(([a],[b])=>String(a).localeCompare(String(b),'en')));
 return {
  source:'checked-in OS skill/classes JSON + existing read-only formula and reference audits',
  certainty:'source-coverage backlog only: class-cap candidate != legal build; EP/FV data != server formula; no production D1 access or writes',
  summary:{
   sourceSkills:ids.length,
   formulaCoverageStatuses:{...coverage.summary.statuses},
   backlogSkills:rows.length,
   statusCounts,categoryCounts,typeCounts,
   distinctBacklogEffectFamilies:families.length,
   distinctReferencedBacklogSkills:rows.filter(r=>r.referencedBy.length>0).length,
   sourceCapCandidateSkills:rows.filter(r=>r.sourceCapCandidateClassKeys.length>0).length
  },
  families,rows
 };
}

export function auditOsSkillCoverageBacklog({skills,classes,calculator,wikiInsights=null}={}){
 const coverage=auditOsSkillFormulaCoverage({skills,classes,calculator,wikiInsights});
 const graph=auditOsSkillExecutionGraph(skills);
 return buildOsSkillCoverageBacklog({skills,classes,coverage,graph});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.some(x=>x!=='--all')||args.length>1)
  throw Error('Usage: node scripts/audit-os-skill-coverage-backlog.mjs [--all]');
 const local=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const skills=JSON.parse(local('data/os/skills.json'));
 const classes=JSON.parse(local('data/os/classes.json'));
 const host={};
 Function('window',local('pandora-os-character-calculator.js'))(host);
 Function('window',local('pandora-studio-wiki-skill-insights.js'))(host);
 const report=auditOsSkillCoverageBacklog({
  skills,classes,calculator:host.PandoraOSCalculator,
  wikiInsights:host.PandoraWikiSkillInsights
 });
 if(!args.includes('--all'))
  report.rows=report.rows.map(({sourceVectors,requirements,sourceModules,...row})=>row);
 console.log(JSON.stringify(report,null,2));
}
