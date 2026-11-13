import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const calculator=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const cases=[
 [142005001,'Решающий удар','Desperate Strike',[]],
 [142504001,'Энергетический удар','Subvert',[]],
 [233001001,'Внезапная атака','Blindside',[]],
 [233002001,'Точный укол','Pierce Armor',[]],
 [233151001,'Беспощадная атака','Rush',[]],
 [350001001,'Захват','Paralyzing Bond',[350001002]],
 [260001001,'Быстрый отход','Backstep',[]]
];
const preview=(job,level=55,weaponKind='BARE_HAND',catalog=skills)=>calculator.combatTechniquePreview({
 skillCatalog:catalog,jobKey:job,level,weaponKind,
 branchCaps:classes[job].branchCaps,branchMasteries:classes[job].branchCaps
});
const find=(p,id)=>p.rows.find(row=>row.id===id);
test('seven abilities and full back-attack bind preserve official RU/EN source identities',()=>{
 for(const [id,ru,en,links] of cases){
  assert.equal(skills[id].id,id);
  assert.equal(skills[id].name,ru);
  assert.equal(english[id]?.n,en);
  for(const helper of links){
   assert.equal(skills[helper]?.id,helper);
   assert.equal(skills[helper]?.learnable,false);
  }
 }
 assert.equal(skills[350001001].funcs[0].ep,'EP_ONHIT_EXEC_BACK_ATK');
 assert.equal(skills[350001001].funcs[0].fv1[3],350001002);
 const bind=skills[350001002].funcs;
 assert.equal(bind.filter(f=>f.ep==='EP_UNABLE_MOVE').length,2);
 assert.deepEqual(bind.filter(f=>f.ep==='EP_UNABLE_MOVE').map(f=>f.dir),['CASTER','TARGET']);
});
test('1764 current-OS profession/level/weapon cases keep source-only eligibility truthful',()=>{
 let total=0,visible=0;
 for(const job of Object.keys(classes))for(const level of [1,45,55])
  for(const weaponKind of ['BARE_HAND','1H_TRUMP_WEAPON','2H_SWORD']){
   const p=preview(job,level,weaponKind);
   for(const [id,ru] of cases){
    total++;
    const s=skills[id],caps=classes[job].branchCaps;
    const compatible=Boolean(s.classes?.[job])&&s.reqs.every(
     r=>caps[r.branch]>=r.amount);
    const result=find(p,id);
    assert.equal(Boolean(result),compatible,
     ru+' / '+job+' / '+level+' / '+weaponKind);
    if(!result)continue;
    visible++;
    assert.equal(result.name,ru);
    assert.equal(result.mana,s.mana);
    assert.equal(result.cooldown,s.cooldown);
    assert.equal(result.sourceOnly,true);
    assert.equal(result.finalAmount,null);
    assert.equal(result.appliedToHero,false);
    assert.equal(result.requirementsMet,
     level>=s.charLevel&&(!s.weaponUse?.length||s.weaponUse.includes(weaponKind)),
     ru+' requirements');
    assert.ok(result.noteRu.length>25&&result.noteEn.length>25);
   }
  }
 assert.equal(total,1764);
 assert.ok(visible>45);
});
test('all linked and root effects fail closed on current-OS mutations',()=>{
 for(const [id,ru,,linked] of cases){
  const s=skills[id],job=Object.keys(classes).find(j=>s.classes[j]&&
   s.reqs.every(r=>classes[j].branchCaps[r.branch]>=r.amount));
  assert.ok(job);
  const weapon=s.weaponUse?.[0]||'BARE_HAND';
  assert.ok(find(preview(job,55,weapon),id));
  const edits=[
   [id,s=>{s.mana+=1}],
   [id,s=>{s.funcs[0].fv1[3]+=1}],
   [id,s=>{s.funcs[0].fv2[0]+=1}],
   [id,s=>{s.funcs[0].dir=s.funcs[0].dir==='TARGET'?'CASTER':'TARGET'}],
   ...linked.map(child=>[child,s=>{s.funcs[0].fv1[3]+=1}]),
   ...linked.map(child=>[child,s=>{s.funcs[0].fv2[0]+=1}])
  ];
  for(const [target,modify] of edits){
   const broken=structuredClone(skills);
   modify(broken[String(target)]);
   const result=preview(job,55,weapon,broken);
   assert.equal(find(result,id),undefined,ru+' must reject changed '+target);
   assert.ok(result.rejected.includes(id));
  }
 }
});
test('seven existing source records become qualitative without any damage guess',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator});
 assert.deepEqual(report.summary.statuses,{
  'numeric-preview':73,'coefficient-model':27,'source-parameter':3,
  'qualitative-preview':77,'passive-source':29,
  'internal-or-triggered-source':336,'unmodeled-learnable':24
 });
 for(const [id] of cases){
  const record=report.rows.find(r=>r.id===id);
  assert.equal(record.status,'qualitative-preview');
  assert.equal(record.numericPreview,false);
  assert.deepEqual(record.sourceModules,['combat-techniques-source']);
 }
});
test('existing combat techniques panel reuses official names, icons and descriptions',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/stage-skill-combat-technique/);
 assert.match(book,/Защитные и боевые приёмы/);
 assert.match(book,/gameTerms\.englishSkills\?\.\[String\(row\.id\)\]/);
 assert.match(book,/row\.noteEn:row\.noteRu/);
});
