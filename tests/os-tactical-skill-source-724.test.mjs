import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const calc=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const labels=JSON.parse(read('data/os/meta.json'));
const cases=[
 [100000501,'Провокация','Provoke',10,15],
 [100001001,'Безумная провокация','Obscene Gesture',12,10],
 [100002001,'Жертвенность','Guardian',16,10],
 [100002002,'Великая жертва','Bore Brunt',16,0.5],
 [420006001,'Непреодолимая стена','Blockade',79,120],
 [420006002,'Непреодолимая стена','Blockade',79,20]];
const inspect=(job,source=skills,level=55,ranks=jobs[job].branchCaps)=>
 calc.tacticalSkillPreview({skillCatalog:source,jobKey:job,level,
  branchCaps:jobs[job].branchCaps,branchMasteries:ranks,
  branchLabels:labels.branchLabels,englishBranches:english.branches});
const owner=id=>Object.keys(jobs).find(job=>inspect(job).rows.some(x=>x.id===id));
test('six tactical roots retain canonical RU/EN names, source cost and cooldown',()=>{
 for(const [id,ru,en,mana,cooldown] of cases){
  assert.equal(skills[id].name,ru);assert.equal(english.skills[id].n,en);
  assert.equal(skills[id].mana,mana);assert.equal(skills[id].cooldown,cooldown);
  const job=owner(id);assert.ok(job,id);
  const row=inspect(job).rows.find(x=>x.id===id);assert.ok(row.requirementsMet);
  assert.equal(row.mana,mana);assert.equal(row.cooldown,cooldown);
  assert.equal(row.finalAmount,null);assert.equal(row.appliedToHero,false);
  assert.equal(row.sourceOnly,true);
 }
 assert.equal(skills[100002002].prereq,100002001);
 assert.equal(skills[420006002].prereq,420006001);
});
test('full source identity and every FV slot must match the pinned spell',()=>{
 const mutate=[
  s=>s.funcs[0].fv1[0]++,s=>s.funcs[0].fv1[3]++,
  s=>s.funcs[0].fv2[3]++,s=>s.funcs[0].dir='CASTER',
  s=>s.funcs.push(structuredClone(s.funcs[0])),
  s=>s.mana++,s=>s.cooldown++,s=>s.range++,s=>s.cast++,
  s=>s.charLevel++,s=>s.reqLevel++,s=>s.prereq=42,s=>s.learnable=false
 ];
 for(const [id] of cases)for(const change of mutate){
  const changed={...skills,[id]:structuredClone(skills[id])};
  change(changed[id]);const out=inspect(owner(id),changed);
  assert.equal(out.rows.some(x=>x.id===id),false,'stale '+id);
  assert.ok(out.rejected.includes(id));
 }
});
test('level, mastery and prior skill are separate conditions',()=>{
 assert.equal(inspect('GENERAL',skills,1).rows.find(x=>x.id===100000501).requirementsMet,false);
 assert.equal(inspect('GENERAL',skills,5).rows.find(x=>x.id===100000501).requirementsMet,true);
 assert.equal(inspect('GENERAL',skills,19).rows.find(x=>x.id===100001001).requirementsMet,false);
 assert.equal(inspect('GENERAL',skills,20).rows.find(x=>x.id===100001001).requirementsMet,true);
 assert.equal(inspect('GENERAL',skills,55,{defense:53}).rows.find(x=>x.id===100002001).requirementsMet,false);
 assert.equal(inspect('GENERAL',skills,55,{defense:54}).rows.find(x=>x.id===100002001).requirementsMet,true);
 assert.equal(inspect('CONJURER',skills,55,{embody:50}).rows.find(x=>x.id===420006002).requirementsMet,true);
 assert.equal(inspect('WARRIOR').rows.some(x=>x.id===420006001),false);
 const bad={...skills,[100002001]:structuredClone(skills[100002001])};
 bad[100002001].funcs[0].fv1[3]++;
 assert.ok(inspect('GENERAL',bad).rejected.includes(100002002));
});
test('400 class/mastery/level allocations never turn tactics into passive stats',()=>{
 const before=JSON.stringify(skills),names=Object.keys(jobs);
 for(let i=0;i<400;i++){
  const job=names[i%names.length],level=i%55+1,caps=jobs[job].branchCaps;
  const ranks=Object.fromEntries(Object.entries(caps).map(([k,n])=>[k,Math.min(n,i%62)]));
  for(const row of inspect(job,skills,level,ranks).rows){
   const s=skills[row.id];
   assert.equal(row.requirementsMet,level>=s.charLevel&&s.reqs.every(r=>ranks[r.branch]>=r.amount));
   assert.equal(row.finalAmount,null);assert.equal(row.appliedToHero,false);
  }
 }
 assert.equal(JSON.stringify(skills),before);
});
test('audit counts six additional qualitative skills, each once',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes:jobs,calculator:calc});
 assert.ok(report.summary.statuses['qualitative-preview']>=50);
 assert.ok(report.summary.statuses['unmodeled-learnable']<=55);
 for(const [id] of cases){
  const row=report.rows.find(x=>x.id===id);
  assert.equal(row.status,'qualitative-preview');
  assert.deepEqual(row.sourceModules,['tactical-skill-source']);
 }
});
test('Hero Book uses readable game labels and has no invented final combat result',()=>{
 const code=read('pandora-studio-hero-book.js');
 for(const word of ['Тактические умения','Tactical skills','Расход ОМ и перезарядка',
  'Перезарядка: ','MP: ','tacticalSkillPreview','prerequisiteId'])
  assert.ok(code.includes(word),word);
 assert.ok(code.includes('&&!tactical?.rows?.length'));
});
