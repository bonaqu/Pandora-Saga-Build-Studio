import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const h={};Function('window',read('pandora-os-character-calculator.js'))(h);
const C=h.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const en=JSON.parse(read('data/os/strings.en.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const expected=[[142501101,'Оглушающий грохот','Stun Hammer','Оглушение','stun'],
 [168005001,'Бой щитом','Shield Charge','Падение','tumble'],
 [410013001,'Морозный удар','Icy Strike','Заморозка','numb'],
 [410021001,'Удар молнии','Shock','Падение','tumble'],
 [420003001,'Песчаный вихрь','Sandstorm','Сон','sleep'],
 [430052001,'Ядовитый удар','Infect','Яд',null]];
const inspect=(job,catalog=skills,ranks=jobs[job].branchCaps,level=55)=>
 C.statusApplicationPreview({skillCatalog:catalog,jobKey:job,level,
  branchCaps:jobs[job].branchCaps,branchMasteries:ranks,
  branchLabels:meta.branchLabels,englishBranches:en.branches});
const find=id=>Object.keys(jobs).map(job=>inspect(job).rows.find(x=>x.id===id)).find(Boolean);
test('six exact current OS status names and linked channels RU/EN',()=>{
 for(const [id,ru,english,state,key] of expected){
  assert.equal(skills[id].name,ru);assert.equal(en.skills[id].n,english);
  const row=find(id);assert.ok(row,id);assert.equal(row.linkedStatus.ru,state);
  assert.equal(row.linkedStatus.key,key);assert.equal(row.sourceOnly,true);
  assert.equal(row.targetSideOnly,true);assert.equal(row.amount,undefined);
 }
 assert.equal(find(168005001).requiresBlocking,true);
 assert.equal(find(430052001).linkedStatus.en,'Poison');
});
test('every modified child effect vector or direction rejects that source',()=>{
 for(const [id] of expected){
  const job=Object.keys(jobs).find(j=>inspect(j).rows.some(x=>x.id===id));
  for(let i=0;i<skills[id].funcs.length;i++){
   const bad=structuredClone(skills);bad[id].funcs[i].fv2[3]++;
   const result=inspect(job,bad);assert.equal(result.rows.some(x=>x.id===id),false);
   assert.ok(result.rejected.includes(id));
  }
  const copy=structuredClone(skills);copy[id].funcs[0].dir='WRONG';
  assert.ok(inspect(job,copy).rejected.includes(id));
 }
});
test('400 class, level and mastery allocations keep eligibility truthful',()=>{
 const names=Object.keys(jobs);
 for(let i=0;i<400;i++){
  const job=names[i%names.length],caps=jobs[job].branchCaps,level=i%55+1;
  const points=Object.fromEntries(Object.entries(caps).map(([b,cap])=>[b,Math.min(cap,i%73)]));
  for(const row of inspect(job,skills,points,level).rows){
   const source=skills[row.id];
   assert.equal(row.requirementsMet,level>=source.charLevel&&source.reqs.every(r=>
    points[r.branch]>=r.amount));
  }
 }
});
test('poison has no invented individual status resistance roll',()=>{
 const row=find(430052001);assert.equal(row.linkedStatus.key,null);
 assert.equal(row.chance,undefined);assert.equal(row.duration,undefined);
 assert.equal(row.finalDamage,undefined);
});
test('cross-module audit counts five new qualitative roots only once',()=>{
 const result=auditOsSkillFormulaCoverage({skills,classes:jobs,calculator:C});
 assert.equal(result.summary.statuses['qualitative-preview'],22);
 assert.equal(result.summary.statuses['unmodeled-learnable'],87);
 assert.equal(result.summary.statuses['numeric-preview'],65);
 for(const [id] of expected){
  const row=result.rows.find(r=>r.id===id);
  assert.ok(row.sourceModules.includes('status-application-source'));
  assert.equal(row.targetSideOnly,true);
 }
 assert.equal(result.rows.find(r=>r.id===430052001).status,'coefficient-model');
});
test('Hero Book is localized and makes limits understandable without duplicate ice',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/stage-skill-status-effects/);
 assert.match(book,/Состояния от умений/);
 assert.match(book,/Возможное состояние:/);
 assert.match(book,/Отравление и сопротивление стихии яда — разные показатели/);
 assert.match(book,/Применяется только во время блокирования/);
 assert.match(book,/!statusesFromSkills\?\.rows\?\.length/);
 assert.equal(expected.some(([id])=>id===410011001||id===410012001),false);
});
