import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const items=JSON.parse(read('data/os/items.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const cases=[
 [220006001,'Скороговорка','Confound','ARCHER','BARE_HAND',[220006002]],
 [100059001,'Стремительный удар','Equine Charge','DRAGOON','LANCE',
  [100059004,100059002,100059003]],
 [520004001,'Защита коня','Horse Guardian','DRAGOON','BARE_HAND',[]]
];
const inspect=(job,catalog=skills,level=55,mastery=classes[job].branchCaps,
 weaponKind='BARE_HAND')=>C.situationalSkillPreview({skillCatalog:catalog,jobKey:job,
 level,branchCaps:classes[job].branchCaps,branchMasteries:mastery,weaponKind,
 branchLabels:meta.branchLabels,englishBranches:english.branches});
const find=(result,id)=>[...result.stealth,...result.other].find(r=>r.id===id);
test('source identities and four internal linked effects remain exact and bilingual',()=>{
 for(const [id,ru,en,job,weapon,linked] of cases){
  assert.equal(skills[id].name,ru,id);
  assert.equal(english.skills[id].n,en,id);
  const result=inspect(job,skills,55,classes[job].branchCaps,weapon);
  const row=find(result,id);assert.ok(row,id);
  assert.equal(row.requirementsMet,true);
  assert.equal(row.mana,skills[id].mana);assert.equal(row.cooldown,skills[id].cooldown);
  assert.equal(row.sourceOnly,true);assert.equal(row.finalAmount,null);
  assert.equal(row.appliedToHero,false);assert.equal(row.inventoryChecked,false);
  assert.ok(row.noteRu.length>20&&row.noteEn.length>20);
  for(const childId of linked){
   assert.equal(skills[childId].learnable,false);
   assert.equal(skills[childId].name,ru);
   assert.equal(english.skills[childId].n,en);
  }
 }
});
test('the Venom ingredient and special resource value are source inputs, not server outcomes',()=>{
 const item=items[50056];
 assert.equal(item.name,'Ядовитое зелье');
 assert.equal(english.items[50056].n,'Venom');
 assert.deepEqual(skills[220006001].funcs.filter(f=>f.ep==='EP_CONSUME_ITEM')
  .map(f=>[f.dir,f.fv1,f.fv2]),[['TARGET',[0,0,0,50056],[0,0,0,1]]]);
 const confound=find(inspect('ARCHER'),220006001);
 assert.equal(confound.requiredItemId,50056);
 assert.equal(confound.requiredItemCount,1);
 assert.equal(confound.inventoryChecked,false);
 const equine=find(inspect('DRAGOON',skills,55,classes.DRAGOON.branchCaps,'LANCE'),100059001);
 assert.equal(equine.specialResourceValue,2);
 assert.equal(equine.requiredItemCount,null);
 assert.equal(equine.finalAmount,null);
});
test('root and every linked source change invalidates its complete preview',()=>{
 for(const [id,, ,job,weapon,children] of cases){
  for(const mutate of [
   s=>s.funcs[0].fv1[3]++,
   s=>{s.funcs[0].dir=s.funcs[0].dir==='TARGET'?'CASTER':'TARGET';},
   s=>s.mana++,s=>s.cooldown++,s=>s.charLevel++,
   s=>s.learnable=false,s=>{s.classes[job]=0;},
   s=>s.funcs.push(structuredClone(s.funcs[0]))]){
   const modified={...skills,[id]:structuredClone(skills[id])};
   mutate(modified[id]);
   const result=inspect(job,modified,55,classes[job].branchCaps,weapon);
   assert.equal(find(result,id),undefined,'changed root '+id);
   assert.ok(result.rejected.includes(id));
  }
  for(const childId of children){
   const modified={...skills,[childId]:structuredClone(skills[childId])};
   modified[childId].funcs[0].fv1[3]++;
   const result=inspect(job,modified,55,classes[job].branchCaps,weapon);
   assert.equal(find(result,id),undefined,'changed child '+childId);
   assert.ok(result.rejected.includes(id));
  }
 }
});
test('mounted charge requires level 45 and weapon; horse defense requires riding 31',()=>{
 const cap=classes.DRAGOON.branchCaps;
 assert.equal(find(inspect('DRAGOON',skills,44,cap,'LANCE'),100059001).requirementsMet,false);
 assert.equal(find(inspect('DRAGOON',skills,45,cap,'LANCE'),100059001).requirementsMet,true);
 assert.equal(find(inspect('DRAGOON',skills,55,cap,'BARE_HAND'),100059001).requirementsMet,false);
 assert.equal(find(inspect('DRAGOON',skills,55,cap,'POLE_ARM'),100059001).requirementsMet,true);
 const low={...cap,riding:30};
 assert.equal(find(inspect('DRAGOON',skills,55,low),520004001).requirementsMet,false);
 assert.equal(find(inspect('WARRIOR'),100059001),undefined);
});
test('400 synthetic characters never receive an unearned active skill or permanent stat',()=>{
 const initial=JSON.stringify(skills),jobs=Object.keys(classes);
 for(let i=0;i<400;i++){
  const job=jobs[i%jobs.length],cap=classes[job].branchCaps,level=i%55+1;
  const ranks=Object.fromEntries(Object.entries(cap).map(([k,v])=>[k,Math.min(v,i%101)]));
  const weaponKind=i%2?'LANCE':'BARE_HAND';
  const result=inspect(job,skills,level,ranks,weaponKind);
  for(const row of [...result.stealth,...result.other]){
   const source=skills[row.id];
   assert.equal(row.requirementsMet,level>=source.charLevel&&
    source.reqs.every(req=>ranks[req.branch]>=req.amount)&&
    (!source.weaponUse?.length||source.weaponUse.includes(weaponKind)));
   assert.equal(row.finalAmount,null);assert.equal(row.appliedToHero,false);
   assert.equal(row.inventoryChecked,false);
  }
 }
 assert.equal(JSON.stringify(skills),initial);
});
test('coverage counts exactly one new item cost and two qualitative mechanics',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(report.summary.statuses['numeric-preview'],70);
 assert.equal(report.summary.statuses['qualitative-preview'],52);
 assert.equal(report.summary.statuses['unmodeled-learnable'],52);
 for(const [id,expected] of [[220006001,'numeric-preview'],
  [100059001,'qualitative-preview'],[520004001,'qualitative-preview']]){
  const row=report.rows.find(x=>x.id===id);
  assert.equal(row.status,expected);
  assert.deepEqual(row.sourceModules,['situational-skill-source']);
 }
});
test('Hero Book reuses existing compact section and canonical item names',()=>{
 const code=read('pandora-studio-hero-book.js');
 for(const phrase of ['situationalSkillPreview','Особые действия',
  'Other abilities','sourceItemName(row.requiredItemId)',
  'По игровым данным нужен предмет: ',
  'Особый расход по данным умения: ',
  'Special resource entry: ','weaponKind:heroWeaponKind'])
  assert.ok(code.includes(phrase),phrase);
});
