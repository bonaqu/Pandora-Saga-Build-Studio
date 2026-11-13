import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const view=(job,catalog=skills,points=null,hit=true)=>
 C.skillExecutionChains({skillCatalog:catalog,jobKey:job,level:55,onHit:hit,
  branchMasteries:points||classes[job].branchCaps,
  branchCaps:classes[job].branchCaps,
  branchLabels:meta.branchLabels,englishBranches:english.branches});
const get=(arr,id)=>arr.find(v=>v.id===id);
test('four current OS hit-triggered skill IDs have real RU/EN names and child links',()=>{
 const cases=[
  [100103001,100103050,'Удар по ногам','Leg Sweep'],
  [142502001,142502050,'Удар по броне','Shatter Armor'],
  [213607001,213607002,'Неясная тень','Pinning Arrow'],
  [430057001,430057002,'Срыв','Equalize']
 ];
 for(const [id,child,name,en] of cases){
  assert.equal(skills[id].name,name);
  assert.equal(english.skills[id].n,en);
  let candidate=null;
  for(const job of Object.keys(classes)){
   candidate=get(view(job).rows,id);
   if(candidate)break;
  }
  assert.ok(candidate,'learnable in a current OS profession: '+id);
  assert.deepEqual(candidate.paths,[[id,child]]);
  assert.equal(candidate.trigger,'on-hit');
  assert.equal(candidate.sourceOnly,true);
 }
});
test('a conditional hit is never an ordinary always-on skill execution',()=>{
 for(const job of Object.keys(classes)){
  const normal=view(job,skills,null,false);
  const conditional=view(job);
  for(const row of conditional.rows)
   assert.equal(get(normal.rows,row.id),undefined,
    'on-hit ID must not appear in ordinary execution group');
 }
});
test('on-hit child, chance metadata and direction must match full source',()=>{
 const probes=[
  s=>{s[430057001].funcs.find(f=>f.ep==='EP_ONHIT_SKILL_EXEC').fv2[3]=31;},
  s=>{s[430057001].funcs.find(f=>f.ep==='EP_ONHIT_SKILL_EXEC').dir='CASTER_OR_TARGET';},
  s=>{s[430057001].funcs.find(f=>f.ep==='EP_ONHIT_SKILL_EXEC').fv1[3]=999999999;},
  s=>{s[430057001].funcs.find(f=>f.ep==='EP_ONHIT_SKILL_EXEC').fv1[3]=213607002;},
  s=>{s[430057001].funcs.find(f=>f.ep==='EP_ONHIT_SKILL_EXEC').fv2=[0,0,0,100];},
  s=>{s[430057002].name='Сторонний эффект';},
  s=>{s[430057001].funcs.push(structuredClone(s[430057001].funcs.find(f=>f.ep==='EP_ONHIT_SKILL_EXEC')));},
  s=>{s[430057002].funcs.push({ep:'EP_SKILL_EXEC',dir:'TARGET',fv1:[0,0,0,430057001],fv2:[0,0,0,0]});}
 ];
 for(const mutate of probes){
  const copy=structuredClone(skills);mutate(copy);
  const hit=view('CALAMITY',copy);
  assert.equal(get(hit.rows,430057001),undefined);
  assert.ok(hit.rejected.includes(430057001));
 }
});
test('source census keeps on-hit metadata separate from numeric models',()=>{
 const audit=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(audit.summary.executionChains.onHitSourceLinks,4);
 assert.ok(audit.summary.executionChains.onHitEligibleSkillRoots>0);
 assert.equal(audit.summary.statuses['unmodeled-learnable'],79);
 assert.equal(audit.summary.skillRecords,569);
});
test('conditional source UI is collapsed and describes uncertainty in plain language',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/stage-skill-onhit-effects/);
 assert.match(book,/onHit:true/);
 assert.match(book,/Эти эффекты могут запускаться при попадании/);
 assert.match(book,/gameTerms\.englishSkills\?\.\[String\(entry\.id\)\]/);
 assert.match(book,/const description=\(en\?source\?\.d:null\)/);
});
