import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const calculator=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const en=JSON.parse(read('data/os/strings.en.json')).skills;
const cases=[
 [121703001,'Тройной укол','Triple Stab',[]],
 [121703501,'Четверной укол','Quadruple Stab',[121703001,121703511,121703512]],
 [100103001,'Удар по ногам','Leg Sweep',[100103050]],
 [121707001,'Отпор','Horse Assault',[121707002,121707003]],
 [121704001,'Внезапный рывок','Charge',[121704002]]
];
const preview=(job,level=55,weaponKind='LANCE',catalog=skills)=>calculator.combatTechniquePreview({
 skillCatalog:catalog,jobKey:job,level,weaponKind,
 branchCaps:classes[job].branchCaps,branchMasteries:classes[job].branchCaps
});
const row=(p,id)=>p.rows.find(r=>r.id===id);
test('five current OS combat roots, hidden stages and RU/EN names are pinned',()=>{
 for(const [id,ru,english,linked] of cases){
  const skill=skills[String(id)];
  assert.equal(skill?.id,id);
  assert.equal(skill.name,ru);
  assert.equal(en[String(id)]?.n,english);
  for(const helper of linked){
   const internal=skills[String(helper)];
   assert.equal(internal?.id,helper,'Missing combo source '+helper);
   assert.equal(Boolean(internal.learnable),helper===121703001,
    'Only the combo prerequisite can be learnable');
  }
 }
 assert.equal(skills['121703501'].funcs[0].fv2[3],121703001);
 assert.deepEqual(skills['121707001'].funcs.map(x=>x.ep),
  ['EP_SKILL_EXEC_GETON','EP_SKILL_EXEC']);
 assert.equal(skills['100103001'].funcs[0].ep,'EP_ONHIT_SKILL_EXEC');
});
test('840 job/level/weapon cases enforce class, mastery, weapon and level',()=>{
 let total=0,shown=0;
 for(const job of Object.keys(classes))for(const level of [1,20,50])
  for(const weaponKind of ['LANCE','BARE_HAND']){
   const result=preview(job,level,weaponKind);
   for(const [id,ru] of cases){
    total++;
    const s=skills[String(id)];
    const expected=Boolean(s.classes?.[job])&&s.reqs.every(
     r=>classes[job].branchCaps[r.branch]>=r.amount);
    const found=row(result,id);
    assert.equal(Boolean(found),expected,ru+' / '+job+'/'+level+'/'+weaponKind);
    if(!found)continue;
    shown++;
    assert.equal(found.name,ru);
    assert.equal(found.mana,s.mana);
    assert.equal(found.cooldown,s.cooldown);
    assert.equal(found.finalAmount,null);
    assert.equal(found.sourceOnly,true);
    assert.equal(found.appliedToHero,false);
    assert.equal(found.requirementsMet,
     level>=s.charLevel&&(!s.weaponUse?.length||s.weaponUse.includes(weaponKind)),
     'Wrong access state '+ru+'/'+job+'/'+level+'/'+weaponKind);
    assert.ok(found.noteRu.length>30&&found.noteEn.length>30);
   }
  }
 assert.equal(total,840);
 assert.ok(shown>20);
});
test('all exact source FV1/FV2, linked combo, child and prerequisite mutations fail closed',()=>{
 for(const [id,ru,,linked] of cases){
  const s=skills[String(id)];
  const job=Object.keys(classes).find(key=>s.classes[key]&&
   s.reqs.every(r=>classes[key].branchCaps[r.branch]>=r.amount));
  const kind=s.weaponUse?.[0]||'BARE_HAND';
  assert.ok(row(preview(job,55,kind),id),'Verified baseline not present: '+ru);
  const variants=[
   [id,record=>{record.mana+=1}],
   [id,record=>{record.funcs[0].fv1[3]+=1}],
   [id,record=>{record.funcs[0].fv2[3]+=1}],
   [id,record=>{record.funcs[0].dir=record.funcs[0].dir==='TARGET'?'CASTER':'TARGET'}],
   ...linked.map(child=>[child,record=>{record.funcs[0].fv1[3]+=1}]),
   ...linked.map(child=>[child,record=>{record.funcs[0].fv2[0]+=1}])
  ];
  for(const [target,mutate] of variants){
   const modified=structuredClone(skills);
   mutate(modified[String(target)]);
   const output=preview(job,55,kind,modified);
   assert.equal(row(output,id),undefined,
    'Source variant must invalidate '+ru+' at '+target);
   assert.ok(output.rejected.includes(id));
  }
 }
});
test('five source descriptions expand audit to 70 qualitative with no synthetic damage',()=>{
 const audit=auditOsSkillFormulaCoverage({skills,classes,calculator});
 assert.equal(audit.summary.skillRecords,569);
 assert.deepEqual(audit.summary.statuses,{
  'numeric-preview':73,'coefficient-model':27,'source-parameter':3,
  'qualitative-preview':70,'passive-source':29,
  'internal-or-triggered-source':336,'unmodeled-learnable':31
 });
 for(const [id] of cases){
  const found=audit.rows.find(x=>x.id===id);
  assert.equal(found.status,'qualitative-preview');
  assert.equal(found.numericPreview,false);
  assert.deepEqual(found.sourceModules,['combat-techniques-source']);
 }
});
test('Book keeps combat previews in one existing skill section with native name localization',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/stage-skill-combat-technique/);
 assert.match(book,/Защитные и боевые приёмы/);
 assert.match(book,/gameTerms\.englishSkills\?\.\[String\(row\.id\)\]/);
 assert.match(book,/gameSkillBadge\(row\.id,row\.name,official\?\.n\|\|row\.name/);
});
