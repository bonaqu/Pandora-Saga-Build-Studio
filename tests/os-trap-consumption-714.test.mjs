import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const items=JSON.parse(read('data/os/items.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const preview=(job,catalog=skills,mastery=null,level=45)=>
 C.trapSkillCostPreview({skillCatalog:catalog,jobKey:job,level,
  branchCaps:jobs[job].branchCaps,
  branchMasteries:mastery||jobs[job].branchCaps,
  branchLabels:meta.branchLabels,englishBranches:english.branches});
const row=(a,id)=>a.find(v=>v.id===id);
const cases=[
 [240001001,'Капкан','Tangled Legs',1,240001050],
 [240002001,'Взрывающаяся ловушка','Plant Mine',1,240002050],
 [240005001,'Ползучая ловушка','Worm Bomb',2,240005002],
 [240008001,'Растворение сознания','Mind Warp',1,240008002],
 [240010001,'Вольер','Stone Prison',1,240010002]
];
test('all five source trap costs match official game names, quantity and child ID',()=>{
 assert.equal(items[65007].name,'Ловушка');
 assert.equal(english.items[65007].n,'Trap');
 for(const [id,ru,en,count,child] of cases){
  assert.equal(skills[id].name,ru);assert.equal(english.skills[id].n,en);
  const found=Object.keys(jobs).map(job=>row(preview(job).rows,id)).find(Boolean);
  assert.ok(found,'an OS class can learn the trap: '+id);
  assert.equal(found.count,count);assert.equal(found.itemId,65007);
  assert.equal(found.linkedEffectId,child);
  assert.equal(found.requirementsMet,true);
  assert.equal(found.inventoryChecked,false);
  assert.equal(found.sourceOnly,true);
 }
});
test('class capacity and actually invested trap mastery are independent',()=>{
 const job=Object.keys(jobs).find(x=>row(preview(x).rows,240005001));
 assert.ok(job);
 const locked=row(preview(job,skills,{trap:40}).rows,240005001);
 assert.equal(locked.requirementsMet,false);
 assert.match(locked.reasonRu,/41/);assert.match(locked.reasonEn,/41/);
 assert.equal(row(preview('WARRIOR').rows,240005001),undefined);
});
test('wrong items, counts, child links, unexpected directions and changed subskills fail closed',()=>{
 const job=Object.keys(jobs).find(x=>row(preview(x).rows,240005001));
 for(const mutate of [
  s=>{s[240005001].funcs[0].fv2[3]=1;},
  s=>{s[240005001].funcs[0].fv1[3]=65011;},
  s=>{s[240005001].funcs[1].fv1[3]=240002050;},
  s=>{s[240005001].funcs[0].dir='TARGET';},
  s=>{s[240005001].funcs.push(structuredClone(s[240005001].funcs[0]));},
  s=>{delete s['240005002'];},
  s=>{s[240005002].funcs[0].fv1[3]=987654321;}
 ]){
  const copy=structuredClone(skills);mutate(copy);
  const checked=preview(job,copy);
  assert.equal(row(checked.rows,240005001),undefined);
  assert.ok(checked.rejected.includes(240005001));
 }
});
test('400 synthetic class/mastery states do not misstate cost or eligibility',()=>{
 const names=Object.keys(jobs);
 for(let i=0;i<400;i++){
  const job=names[i%names.length],cap=jobs[job].branchCaps.trap||0;
  const rank=i%101,level=(i%55)+1;
  const a=preview(job,skills,{trap:rank},level);
  for(const r of a.rows){
   const req=skills[r.id].reqs[0].amount;
   assert.ok(cap>=req);
   assert.ok([1,2].includes(r.count));
   assert.equal(r.requirementsMet,rank>=req&&rank<=cap);
  }
  assert.deepEqual(a,preview(job,skills,{trap:rank},level));
 }
});
test('trap consumption is source-number arithmetic, not made-up combat damage',()=>{
 const audit=auditOsSkillFormulaCoverage({skills,classes:jobs,calculator:C});
 assert.ok(audit.summary.statuses['numeric-preview']>=69);
 assert.ok(audit.summary.statuses['unmodeled-learnable']<=55);
 for(const [id] of cases){
  const rec=audit.rows.find(r=>r.id===id);
  assert.deepEqual(rec.sourceModules,['trap-materials']);
  assert.equal(rec.numericPreview,true);
  assert.equal(rec.targetSideOnly,false);
 }
});
test('Hero Book explains uncertain mechanics and the actual game material in RU/EN',()=>{
 const book=read('pandora-studio-hero-book.js');
 const css=read('pandora-studio-hero-book-additions.css');
 assert.match(book,/stage-skill-trap-costs/);
 assert.match(book,/Количество ловушек взято из игровых данных/);
 assert.match(book,/Для применения нужно:/);
 assert.match(book,/sourceItemName\(65007\)/);
 assert.match(book,/!trapCost\?\.rows\?\.length/);
 // The section uses the common Hero Book header; legacy CSS pseudo arrows
 // must NOT be required to consider a source-backed skill rendered.
 assert.match(css,/\\.stage-book-disclosure\\.stage-attribute-row>summary\\.stage-result-section-head/);
 assert.doesNotMatch(css,/>summary:(?::after|after)/);
});
