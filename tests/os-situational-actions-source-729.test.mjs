import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const en=JSON.parse(read('data/os/strings.en.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const cases=[
 [220007001,'Соколиный глаз','Surveillance','stealth'],
 [213606001,'Слежка','Watchful Eye','stealth'],
 [230001001,'Невидимость','Hiding','stealth'],
 [230002004,'Маскировка','Cloaking','stealth'],
 [520000001,'Вызов коня','Summon Mount','other']
];
const inspect=(job,catalog=skills,level=55,ranks=classes[job].branchCaps)=>
 C.situationalSkillPreview({skillCatalog:catalog,jobKey:job,level,
  branchCaps:classes[job].branchCaps,branchMasteries:ranks,
  branchLabels:meta.branchLabels,englishBranches:en.branches});
const rows=result=>[...result.stealth,...result.other];
const owner=id=>Object.keys(classes).find(job=>rows(inspect(job)).some(r=>r.id===id));
test('official RU/EN names and exact source costs for five contextual skills',()=>{
 for(const [id,ru,english,group] of cases){
  assert.equal(skills[id].name,ru,id);
  assert.equal(en.skills[id].n,english,id);
  const job=owner(id);assert.ok(job,'no eligible class '+id);
  const result=inspect(job),row=rows(result).find(r=>r.id===id);
  assert.ok(result[group].some(r=>r.id===id));
  assert.equal(row.mana,skills[id].mana);
  assert.equal(row.cooldown,skills[id].cooldown);
  assert.equal(row.sourceOnly,true);
  assert.equal(row.finalAmount,null);
  assert.equal(row.appliedToHero,false);
  assert.ok(row.noteRu.length>20&&row.noteEn.length>20);
 }
 assert.equal(skills[230002004].prereq,230002001);
});
test('modified root, effect, cost, class or prerequisite is rejected',()=>{
 for(const [id] of cases){
  const job=owner(id);assert.ok(job);
  for(const mutate of [
   s=>s.funcs[0].fv1[3]++,s=>s.funcs[0].fv2[3]++,
   s=>s.funcs[0].dir='CASTER',s=>s.funcs.push(structuredClone(s.funcs[0])),
   s=>s.mana++,s=>s.cooldown++,s=>s.charLevel++,s=>s.reqLevel++,
   s=>s.learnable=false,s=>{s.classes[job]=0;} ]){
   const altered={...skills,[id]:structuredClone(skills[id])};
   mutate(altered[id]);
   const result=inspect(job,altered);
   assert.equal(rows(result).some(r=>r.id===id),false,'modified source '+id);
   assert.ok(result.rejected.includes(id),'no rejection '+id);
  }
 }
 const parent={...skills,'230002001':structuredClone(skills[230002001])};
 parent['230002001'].funcs[0].fv1[3]++;
 assert.ok(inspect('ASSASSIN',parent).rejected.includes(230002004));
});
test('mastery, class and level restrictions are independent',()=>{
 assert.equal(rows(inspect('WARRIOR')).some(r=>r.id===213606001),false);
 assert.equal(rows(inspect('PREDATOR',skills,44)).find(r=>r.id===213606001).requirementsMet,false);
 assert.equal(rows(inspect('PREDATOR',skills,45)).find(r=>r.id===213606001).requirementsMet,true);
 assert.equal(rows(inspect('ASSASSIN',skills,44)).find(r=>r.id===230002004).requirementsMet,false);
 assert.equal(rows(inspect('ASSASSIN',skills,45)).find(r=>r.id===230002004).requirementsMet,true);
 const alchemy={...classes.PREDATOR.branchCaps,alchemy:70};
 assert.equal(rows(inspect('PREDATOR',skills,55,alchemy)).find(r=>r.id===220007001).requirementsMet,false);
 const riding={...classes.DRAGOON.branchCaps,riding:19};
 assert.equal(rows(inspect('DRAGOON',skills,55,riding)).find(r=>r.id===520000001).requirementsMet,false);
});
test('400 different characters never receive permanent bonuses from situational actions',()=>{
 const initial=JSON.stringify(skills),jobs=Object.keys(classes);
 for(let i=0;i<400;i++){
  const job=jobs[i%jobs.length],caps=classes[job].branchCaps,level=i%55+1;
  const ranks=Object.fromEntries(Object.entries(caps).map(([k,v])=>[k,Math.min(v,i%100)]));
  for(const row of rows(inspect(job,skills,level,ranks))){
   assert.equal(row.finalAmount,null);assert.equal(row.appliedToHero,false);
   const source=skills[row.id];
   const weaponOk=!source.weaponUse?.length||source.weaponUse.includes('BARE_HAND');
   assert.equal(row.requirementsMet,weaponOk&&level>=source.charLevel&&
    source.reqs.every(req=>ranks[req.branch]>=req.amount));
  }
 }
 assert.equal(JSON.stringify(skills),initial);
});
test('five new models and one crafting inspection per class in the audit',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.ok(report.summary.statuses['numeric-preview']>=69);
 assert.ok(report.summary.statuses['qualitative-preview']>=50);
 assert.ok(report.summary.statuses['unmodeled-learnable']<=55);
 for(const [id] of cases){
  const row=report.rows.find(x=>x.id===id);
  assert.equal(row.status,'qualitative-preview');
  assert.deepEqual(row.sourceModules,['situational-skill-source']);
 }
 let calls=0;
 const counted={...C,craftingSkillPreview:args=>{calls++;return C.craftingSkillPreview(args);}};
 auditOsSkillFormulaCoverage({skills,classes,calculator:counted});
 assert.equal(calls,Object.keys(classes).length);
});
test('Hero Book uses compact bilingual rows and standard skill tooltips',()=>{
 const src=read('pandora-studio-hero-book.js');
 for(const phrase of ['Скрытность и обнаружение','Stealth and detection',
  'Особые действия','Other abilities','situationalSkillPreview',
  'stage-skill-situational-row','gameSkillBadge'])
  assert.ok(src.includes(phrase),phrase);
 assert.ok(src.includes('&&!situational?.stealth?.length&&!situational?.other?.length'));
});
