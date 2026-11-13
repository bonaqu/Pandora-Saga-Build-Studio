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
 [213602001,'Ядовитая стрела','Cobra Arrow',1,['BOW','CROSSBOW'],[]],
 [213603501,'Печать тишины','Silence Arrow',1,['BOW','CROSSBOW'],[213603511,213603521]],
 [213701001,'Пятикратный выстрел','Multi Shot',5,['CROSSBOW'],[]]
];
const inspect=(job,catalog=skills,level=55,ranks=classes[job].branchCaps,weaponKind='BOW')=>
 C.rangedAmmoPreview({skillCatalog:catalog,jobKey:job,level,
  branchCaps:classes[job].branchCaps,branchMasteries:ranks,weaponKind,
  branchLabels:meta.branchLabels,englishBranches:en.branches});
const find=(data,id)=>data.rows.find(row=>row.id===id);
const owner=id=>Object.keys(classes).find(job=>find(inspect(job),id));
test('three source-pinned ranged skills use current official RU/EN and exact ammunition',()=>{
 for(const [id,ru,english,quantity,weapons,linked] of cases){
  const s=skills[id];
  assert.equal(s.name,ru,id);assert.equal(en.skills[id].n,english,id);
  assert.deepEqual(s.weaponUse,weapons);
  assert.deepEqual(s.funcs.filter(f=>f.ep==='EP_CONSUME_AMMO').map(f=>
   [f.dir,f.fv1,f.fv2]),[['CASTER',[0,0,0,0],[0,0,0,quantity]]]);
  const job=owner(id);assert.ok(job,'no eligible class '+id);
  for(const weaponKind of weapons){
   const row=find(inspect(job,skills,55,classes[job].branchCaps,weaponKind),id);
   assert.ok(row);
   assert.equal(row.ammoCount,quantity);assert.equal(row.mana,s.mana);
   assert.equal(row.cooldown,s.cooldown);
   assert.deepEqual(row.linkedEffectIds,linked);
   assert.equal(row.requirementsMet,true);
   assert.equal(row.finalDamage,null);assert.equal(row.inventoryChecked,false);
   assert.equal(row.appliedToHero,false);assert.equal(row.sourceOnly,true);
   assert.ok(row.noteRu.length>25&&row.noteEn.length>25);
  }
 }
 assert.equal(skills[213603501].funcs[0].fv1[3],213603511);
 assert.equal(skills[213603501].funcs[1].fv1[3],213603521);
});
test('every root and linked silence child fails closed when source changes',()=>{
 for(const [id,,, ,weapons] of cases){
  const job=owner(id),s=skills[id];
  for(const mutate of [
   x=>x.funcs[0].fv1[3]++,x=>x.funcs[2].fv2[3]++,
   x=>{x.funcs[1].dir=x.funcs[1].dir==='CASTER'?'TARGET':'CASTER';},
   x=>x.funcs.push(structuredClone(x.funcs[0])),x=>x.mana++,
   x=>x.cooldown++,x=>x.charLevel++,x=>x.reqLevel++,
   x=>x.learnable=false,x=>{x.classes[job]=0;},
   x=>{x.weaponUse=['BARE_HAND'];},
   x=>x.reqs.push({branch:'archery',amount:1})]){
   const altered={...skills,[id]:structuredClone(s)};
   mutate(altered[id]);
   const result=inspect(job,altered,55,classes[job].branchCaps,weapons[0]);
   assert.equal(find(result,id),undefined,'stale root '+id);
   assert.ok(result.rejected.includes(id),'not rejected '+id);
  }
 }
 for(const childId of [213603511,213603521]){
  const altered={...skills,[childId]:structuredClone(skills[childId])};
  altered[childId].funcs[0].fv1[3]++;
  const result=inspect(owner(213603501),altered);
  assert.equal(find(result,213603501),undefined);
  assert.ok(result.rejected.includes(213603501));
 }
});
test('crossbow requirement and both mastery branches are independent',()=>{
 const job=owner(213701001),cap=classes[job].branchCaps;
 const bow=find(inspect(job,skills,55,cap,'BOW'),213701001);
 const crossbow=find(inspect(job,skills,55,cap,'CROSSBOW'),213701001);
 assert.equal(bow.requirementsMet,false);
 assert.match(bow.reasonRu,/арбалет/);
 assert.equal(crossbow.requirementsMet,true);
 for(const req of skills[213701001].reqs){
  const low={...cap,[req.branch]:req.amount-1};
  assert.equal(find(inspect(job,skills,55,low,'CROSSBOW'),213701001).requirementsMet,false);
 }
 const lowArchery={...classes.ARCHER.branchCaps,archery:53};
 assert.equal(find(inspect('ARCHER',skills,55,lowArchery),213603501).requirementsMet,false);
 assert.equal(find(inspect('WARRIOR'),213603501),undefined);
});
test('400 mixed characters preserve source counts and never synthesize hits',()=>{
 const initial=JSON.stringify(skills),jobs=Object.keys(classes);
 for(let i=0;i<400;i++){
  const job=jobs[i%jobs.length],caps=classes[job].branchCaps,level=i%55+1;
  const ranks=Object.fromEntries(Object.entries(caps).map(([k,v])=>[k,Math.min(v,i%100)]));
  const weaponKind=i%2?'BOW':'CROSSBOW';
  for(const row of inspect(job,skills,level,ranks,weaponKind).rows){
   const s=skills[row.id];
   assert.equal(row.requirementsMet,s.weaponUse.includes(weaponKind)&&
    level>=s.charLevel&&s.reqs.every(r=>ranks[r.branch]>=r.amount));
   assert.equal(row.ammoCount,s.funcs.find(f=>
    f.ep==='EP_CONSUME_AMMO'&&f.dir==='CASTER').fv2[3]);
   assert.equal(row.finalDamage,null);assert.equal(row.inventoryChecked,false);
   assert.equal(row.appliedToHero,false);
  }
 }
 assert.equal(JSON.stringify(skills),initial);
});
test('coverage counts three new source-material models once, not final damage',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(report.summary.statuses['numeric-preview'],69);
 assert.equal(report.summary.statuses['qualitative-preview'],50);
 assert.equal(report.summary.statuses['unmodeled-learnable'],55);
 for(const [id] of cases){
  const row=report.rows.find(x=>x.id===id);
  assert.equal(row.status,'numeric-preview');
  assert.deepEqual(row.sourceModules,['skill-ammunition']);
 }
 assert.equal(report.rows.filter(r=>r.sourceModules.includes('skill-ammunition')).length,6);
});
test('player instructions distinguish ammo cost from hits in both languages',()=>{
 const src=read('pandora-studio-hero-book.js');
 for(const phrase of ['rangedAmmoPreview','Боеприпасы для умений',
  'Ammunition for skills','Перезарядка: ','Cooldown: ',
  'не число гарантированных попаданий','not guaranteed hits',
  'stage-skill-ranged-ammo-row','gameSkillBadge'])
  assert.ok(src.includes(phrase),phrase);
});
