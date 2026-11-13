import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={}; Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json')),classes=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const cases=[
 [410005001,'Метеорит','Meteor Shower',[410005002,410005003]],
 [410014001,'Ледяной вихрь','Ice Storm',[410014002]],
 [410014003,'Ледяная буря','Ice Tempest',[410014004]],
 [410022001,'Шаровая молния','Thunder Ball',[410022050]],
 [410026001,'Гроза','Thunder Storm',[410026002,410026003,410026004]],
 [420007001,'Песчаная буря','Summon Sandman',[420007002]]
];
const view=(job,level=55,catalog=skills)=>C.specializedSkillPreview({
 skillCatalog:catalog,jobKey:job,level,
 branchCaps:classes[job].branchCaps,branchMasteries:classes[job].branchCaps
});
const pick=(r,id)=>r.magic.find(x=>x.id===id);
test('official RU/EN spell titles and all hidden child stages remain intact',()=>{
 for(const [id,ru,en,links] of cases){
  assert.equal(skills[id]?.name,ru);
  assert.equal(english[id]?.n,en);
  for(const child of links){
   assert.equal(skills[child]?.id,child);
   assert.equal(skills[child].learnable,false);
  }
 }
 assert.equal(skills[410005001].funcs[0].ep,'EP_SKILL_EXEC_RANDPOS');
 assert.deepEqual(skills[410026002].funcs.filter(f=>f.ep.startsWith('EP_SKILL_EXEC'))
  .map(f=>f.fv1[3]),[410026003,410026004]);
 assert.equal(skills[420007002].funcs.some(x=>x.ep==='EP_CAUSE_SLEEP'),true);
});
test('504 class/level source-only combinations avoid synthetic final damage',()=>{
 let total=0,visible=0;
 for(const job of Object.keys(classes))for(const level of [1,45,55]){
  const result=view(job,level);
  for(const [id,ru] of cases){
   total++;
   const s=skills[id],caps=classes[job].branchCaps;
   const allowed=Boolean(s.classes?.[job])&&s.reqs.every(r=>caps[r.branch]>=r.amount);
   const row=pick(result,id);
   assert.equal(Boolean(row),allowed,ru+' '+job+' '+level);
   if(!row)continue;
   visible++;
   assert.equal(row.mana,s.mana);
   assert.equal(row.cooldown,s.cooldown);
   assert.equal(row.name,ru);
   assert.equal(row.requirementsMet,level>=s.charLevel);
   assert.equal(row.sourceOnly,true);
   assert.equal(row.finalAmount,null);
   assert.equal(row.appliedToHero,false);
   assert.ok(row.noteRu.length>25&&row.noteEn.length>25);
  }
 }
 assert.equal(total,504);
 assert.ok(visible>20);
});
test('every root and child FV1/FV2 mutation rejects a stale source claim',()=>{
 for(const [id,ru,,linked] of cases){
  const s=skills[id],job=Object.keys(classes).find(j=>s.classes[j]&&
   s.reqs.every(r=>classes[j].branchCaps[r.branch]>=r.amount));
  assert.ok(pick(view(job),id));
  const edits=[
   [id,x=>{x.mana+=1}],
   [id,x=>{x.funcs[0].fv1[3]+=1}],
   [id,x=>{x.funcs[0].fv2[3]+=1}],
   [id,x=>{x.funcs[0].dir=x.funcs[0].dir==='TARGET'?'CASTER':'TARGET'}],
   ...linked.map(child=>[child,x=>{x.funcs[0].fv1[3]+=1}]),
   ...linked.map(child=>[child,x=>{x.funcs[0].fv2[0]+=1}])
  ];
  for(const [target,edit] of edits){
   const changed=structuredClone(skills);
   edit(changed[String(target)]);
   const result=view(job,55,changed);
   assert.equal(pick(result,id),undefined,ru+' mutated '+target);
   assert.ok(result.rejected.includes(id));
  }
 }
});
test('magic chain census increases only qualitative sources',()=>{
 const result=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(result.summary.skillRecords,569);
 assert.ok(result.summary.statuses['numeric-preview']>=73);
 assert.ok(result.summary.statuses['qualitative-preview']>=83);
 assert.ok(result.summary.statuses['unmodeled-learnable']<=18);
 assert.equal(result.summary.statuses['internal-or-triggered-source'],336);
 for(const [id] of cases){
  const r=result.rows.find(x=>x.id===id);
  assert.equal(r.status,'qualitative-preview');
  assert.deepEqual(r.sourceModules,['specialized-skill-source']);
  assert.equal(r.numericPreview,false);
 }
});
