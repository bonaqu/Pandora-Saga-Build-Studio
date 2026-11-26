import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 auditOsSkillCoverageBacklog,buildOsSkillCoverageBacklog
} from '../scripts/audit-os-skill-coverage-backlog.mjs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
import {auditOsSkillExecutionGraph} from '../scripts/audit-os-skill-execution-graph.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
Function('window',read('pandora-studio-wiki-skill-insights.js'))(host);

test('current 571 OS source skills: only genuine coverage gaps enter the triage',()=>{
 const originalSkills=JSON.stringify(skills),originalClasses=JSON.stringify(classes);
 const report=auditOsSkillCoverageBacklog({skills,classes,
  calculator:host.PandoraOSCalculator,
  wikiInsights:host.PandoraWikiSkillInsights});
 assert.equal(report.summary.sourceSkills,571);
 assert.equal(report.summary.backlogSkills,report.rows.length);
 assert.equal(Object.values(report.summary.statusCounts).reduce((a,b)=>a+b,0),
  report.rows.length);
 assert.equal(Object.values(report.summary.categoryCounts).reduce((a,b)=>a+b,0),
  report.rows.length);
 assert.equal(report.summary.distinctBacklogEffectFamilies,report.families.length);
 assert.equal(report.summary.sourceCapCandidateSkills,
  report.rows.filter(r=>r.sourceCapCandidateClassKeys.length>0).length);
 assert.ok(report.rows.length>0,'unresolved sources remain explicit');
 for(const row of report.rows){
  const s=skills[row.id];
  assert.equal(s.learnable,true);
  assert.ok(['unmodeled-learnable','source-access-limited'].includes(row.status));
  assert.deepEqual(row.sourceEffects,[...new Set(s.funcs.map(f=>f.ep))].sort());
  assert.equal(row.sourceVectors.length,s.funcs.length);
  for(const f of row.sourceVectors){
   assert.deepEqual(f.fv1,s.funcs[f.index].fv1);
   assert.deepEqual(f.fv2,s.funcs[f.index].fv2);
   assert.equal(f.dir,s.funcs[f.index].dir??null);
  }
  for(const key of row.sourceCapCandidateClassKeys){
   assert.ok(row.sourceClassKeys.includes(key));
   assert.ok(classes[key]);
   assert.ok(s.reqs.every(req=>
    Number(classes[key].branchCaps[req.branch]??0)>=req.amount));
  }
  assert.ok(!['numeric-preview','coefficient-model','passive-source',
   'internal-or-triggered-source'].includes(row.status));
 }
 assert.deepEqual(report.rows.map(r=>r.id),
  [...report.rows.map(r=>r.id)].sort((a,b)=>a-b));
 assert.equal(JSON.stringify(skills),originalSkills);
 assert.equal(JSON.stringify(classes),originalClasses);
 assert.match(report.certainty,/!= server formula/);
});

test('derived report rejects stale formula coverage and unknown class identifiers',()=>{
 const make=(id,ep,opts={})=>({
  id,name:'S'+id,learnable:true,skillType:'ENEMY',classes:{WIZARD:1},
  charLevel:1,prereq:null,reqs:[],branch:'element',
  funcs:[{ep,dir:'TARGET',fv1:[0,0,0,20],fv2:[0,0,0,0]}],...opts
 });
 const source={
  1:make(1,'EP_ONE',{reqs:[{branch:'element',amount:20}]}),
  2:make(2,'EP_ONE',{reqs:[{branch:'element',amount:99}]}),
  3:make(3,'EP_TWO',{classes:{}}),
  4:make(4,'EP_THREE',{classes:{WIZARD:1}}),
  5:make(5,'EP_INTERNAL',{learnable:false,classes:{}})
 };
 const jobs={WIZARD:{branchCaps:{element:80}}};
 const statuses=[
  'unmodeled-learnable','unmodeled-learnable',
  'unmodeled-learnable','source-access-limited',
  'internal-or-triggered-source'
 ];
 const coverage={summary:{skillRecords:5,statuses:{}},
  rows:statuses.map((status,i)=>({id:i+1,status,sourceModules:[]}))};
 const graph=auditOsSkillExecutionGraph(source);
 const original=JSON.stringify(source);
 const report=buildOsSkillCoverageBacklog({skills:source,classes:jobs,coverage,graph});
 assert.equal(report.summary.backlogSkills,4);
 assert.deepEqual(report.rows.map(r=>r.classification),[
  'source-cap-candidate','source-cap-limited',
  'no-source-class-assignment','wiki-access-limited'
 ]);
 assert.deepEqual(report.rows[0].sourceCapCandidateClassKeys,['WIZARD']);
 assert.deepEqual(report.rows[1].sourceCapCandidateClassKeys,[]);
 assert.equal(report.families[0].ep,'EP_ONE');
 assert.equal(report.families[0].backlogSkills,2);
 assert.equal(JSON.stringify(source),original);
 assert.throws(()=>buildOsSkillCoverageBacklog({
  skills:source,classes:jobs,
  coverage:{...coverage,rows:coverage.rows.slice(1)},graph
 }),/snapshot sizes differ/);
 const broken=structuredClone(source);
 broken[1].classes={UNKNOWN_CLASS:1};
 assert.throws(()=>buildOsSkillCoverageBacklog({
  skills:broken,classes:jobs,coverage,graph
 }),/Unknown source class/);
});

test('full formula and execution census numbers reconcile exactly with backlog',()=>{
 const coverage=auditOsSkillFormulaCoverage({skills,classes,
  calculator:host.PandoraOSCalculator,wikiInsights:host.PandoraWikiSkillInsights});
 const graph=auditOsSkillExecutionGraph(skills);
 const report=buildOsSkillCoverageBacklog({skills,classes,coverage,graph});
 const desired=(coverage.summary.statuses['unmodeled-learnable']||0)+
  (coverage.summary.statuses['source-access-limited']||0);
 assert.equal(report.rows.length,desired);
 assert.equal(Object.values(coverage.summary.statuses)
  .reduce((n,value)=>n+value,0),571);
 assert.equal(graph.summary.skillCount,571);
 for(const family of report.families){
  assert.deepEqual(family.backlogSkillIds,
   [...new Set(family.backlogSkillIds)].sort((a,b)=>a-b));
  assert.equal(family.backlogSkills,family.backlogSkillIds.length);
  assert.ok(family.capCandidateSkillIds.every(id=>family.backlogSkillIds.includes(id)));
 }
});
