import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const cases=[
 [430001003,'Кража жизни','Blood Drain',[430001004]],
 [430052002,'Ядовитый удар','Infect',[430052003]],
 [430053003,'Гниение','Mind Venom',[430053004,430053005]],
 [430056001,'Ненависть','Pestilence',[430056002]],
 [430058001,'Темная грань','Dark Frenzy',[430058002,430058003,500000004,500000003]],
 [440003001,'Ядовитая топь','Wasteland',[440003002,440003003]],
 [440009001,'Немая буря','Siren Storm',[440009002]],
 [440011001,'Чума','Cursed Bolt',[440011002]]
];
const preview=(job,level=55,catalog=skills)=>C.specializedSkillPreview({
 skillCatalog:catalog,jobKey:job,level,
 branchCaps:classes[job].branchCaps,branchMasteries:classes[job].branchCaps});
const row=(result,id)=>result.magic.find(x=>x.id===id);
test('all eight roots and their nested stages have pinned official names and identities',()=>{
 for(const [id,ru,en,linked] of cases){
  assert.equal(skills[id]?.name,ru);
  assert.equal(english[id]?.n,en);
  for(const child of linked){
   assert.equal(skills[child]?.id,child);
   assert.equal(skills[child]?.learnable,false);
  }
 }
 assert.deepEqual(skills[440003001].funcs.map(x=>x.fv1[3]),[440003002,440003003]);
 assert.equal(skills[430058003].funcs.some(f=>f.fv1[3]===500000003),true);
 assert.equal(skills[430058003].funcs.some(f=>f.fv1[3]===500000004),true);
});
test('672 class and level checks show only source-verified temporary effects',()=>{
 let total=0,visible=0;
 for(const job of Object.keys(classes))for(const level of [1,45,55]){
  const result=preview(job,level);
  for(const [id,ru] of cases){
   total++;
   const s=skills[id],caps=classes[job].branchCaps;
   const allowed=Boolean(s.classes?.[job])&&s.reqs.every(
    req=>caps[req.branch]>=req.amount);
   const found=row(result,id);
   assert.equal(Boolean(found),allowed,ru+' / '+job+' / '+level);
   if(!found)continue;
   visible++;
   assert.equal(found.name,ru);
   assert.equal(found.mana,s.mana);
   assert.equal(found.cooldown,s.cooldown);
   assert.equal(found.requirementsMet,level>=s.charLevel);
   assert.equal(found.sourceOnly,true);
   assert.equal(found.finalAmount,null);
   assert.equal(found.appliedToHero,false);
   assert.ok(found.noteRu.length>25&&found.noteEn.length>25);
  }
 }
 assert.equal(total,672);
 assert.ok(visible>20);
});
test('every root/child wrong source value or direction rejects the described effect',()=>{
 for(const [id,ru,,linked] of cases){
  const s=skills[id],job=Object.keys(classes).find(j=>s.classes[j]&&
   s.reqs.every(r=>classes[j].branchCaps[r.branch]>=r.amount));
  assert.ok(row(preview(job),id));
  const edits=[
   [id,s=>{s.mana+=1}],
   [id,s=>{s.funcs[0].fv1[3]+=1}],
   [id,s=>{s.funcs[0].fv2[0]+=1}],
   [id,s=>{s.funcs[0].dir='CASTER'}],
   ...linked.map(child=>[child,s=>{s.funcs[0].fv1[3]+=1}]),
   ...linked.map(child=>[child,s=>{s.funcs[0].fv2[0]+=1}])
  ];
  for(const [target,edit] of edits){
   const changed=structuredClone(skills);
   edit(changed[String(target)]);
   const result=preview(job,55,changed);
   assert.equal(row(result,id),undefined,ru+' accepted bad source '+target);
   assert.ok(result.rejected.includes(id));
  }
 }
});
test('source-only spells increase qualitative coverage, not numeric damage',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(report.summary.skillRecords,569);
 assert.deepEqual(report.summary.statuses,{
  'numeric-preview':73,'coefficient-model':27,'source-parameter':3,
  'qualitative-preview':94,'passive-source':29,
  'internal-or-triggered-source':336,'unmodeled-learnable':7
 });
 for(const [id] of cases){
  const r=report.rows.find(x=>x.id===id);
  assert.equal(r.status,'qualitative-preview');
  assert.equal(r.numericPreview,false);
  assert.deepEqual(r.sourceModules,['specialized-skill-source']);
 }
});
