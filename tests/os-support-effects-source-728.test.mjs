import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const items=JSON.parse(read('data/os/items.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const cases=[
 [310003001,'Воскрешение','Revive','help'],
 [310011001,'Лечение отравления','Cleanse','help'],
 [310012001,'Пробуждение','Vivify','help'],
 [330101001,'Преданность','Devotion','help'],
 [330071001,'Обмен маной','Mana Swap','magic'],
 [330072001,'Обмен душами','Soul Swap','magic'],
 [440002001,'Рассеивание','Dispel','magic'],
 [440002002,'Рассеивание','Dispel','magic']
];
const inspect=(job,catalog=skills,level=55,ranks=classes[job].branchCaps)=>
 C.supportEffectPreview({skillCatalog:catalog,jobKey:job,level,
  branchCaps:classes[job].branchCaps,branchMasteries:ranks,
  branchLabels:meta.branchLabels,englishBranches:english.branches});
const find=(result,id)=>[...result.help,...result.magic].find(row=>row.id===id);
const owner=id=>Object.keys(classes).find(job=>find(inspect(job),id));
test('eight support effects retain official source IDs, RU/EN and target-only rules',()=>{
 for(const [id,ru,en,group] of cases){
  assert.equal(skills[id].name,ru,id);
  assert.equal(english.skills[id].n,en,id);
  const job=owner(id);assert.ok(job,'no eligible class '+id);
  const result=inspect(job),row=find(result,id);assert.ok(row);
  assert.ok(result[group].some(x=>x.id===id));
  assert.equal(row.mana,skills[id].mana);
  assert.equal(row.cooldown,skills[id].cooldown);
  assert.equal(row.sourceOnly,true);
  assert.equal(row.finalAmount,null);
  assert.equal(row.appliedToHero,false);
  assert.equal(row.inventoryChecked,false);
  assert.ok(row.noteRu.length>15&&row.noteEn.length>15);
 }
 assert.equal(skills[440002002].prereq,440002001);
 assert.equal(skills[440002002].funcs.find(f=>f.ep==='EP_SKILL_EXEC').fv1[3],440002003);
});
test('resurrection requires exactly three canonical Holy Water bottles',()=>{
 const record=skills[310003001];
 assert.equal(items[50059].name,'Святая вода');
 assert.equal(english.items[50059].n,'Holy Water');
 assert.deepEqual(record.funcs.filter(f=>f.ep==='EP_CONSUME_ITEM').map(f=>
  [f.dir,f.fv1[3],f.fv2[3]]),[['CASTER',50059,3]]);
 const row=find(inspect('CLERIC'),310003001);
 assert.equal(row.requiredItemId,50059);
 assert.equal(row.requiredItemCount,3);
 assert.equal(row.inventoryChecked,false);
 for(const id of [310011001,310012001,330101001,330071001,330072001,440002001,440002002])
  assert.equal(find(inspect(owner(id)),id).requiredItemCount,null);
});
test('changed root, parent or triggered child invalidates the exact claim',()=>{
 const mutations=[
  s=>s.funcs[0].fv1[3]++,
  s=>s.funcs[0].fv2[3]++,
  s=>s.funcs[0].dir='CASTER',
  s=>s.funcs.push(structuredClone(s.funcs[0])),
  s=>s.mana++,s=>s.cooldown++,s=>s.charLevel++,
  s=>s.reqLevel++,s=>s.learnable=false,
  s=>s.reqs.push({branch:'benevolence',amount:999}),
  s=>{s.classes[Object.keys(s.classes)[0]]=0}
 ];
 for(const [id] of cases)for(const mutate of mutations){
  const changed={...skills,[id]:structuredClone(skills[id])};
  mutate(changed[id]);
  const result=inspect(owner(id),changed);
  assert.equal(find(result,id),undefined,'stale source '+id);
  assert.ok(result.rejected.includes(id));
 }
 for(const dependency of [440002001,440002003]){
  const changed={...skills,[dependency]:structuredClone(skills[dependency])};
  changed[dependency].funcs[0].fv1[2]++;
  const result=inspect(owner(440002002),changed);
  assert.equal(find(result,440002002),undefined);
  assert.ok(result.rejected.includes(440002002));
 }
 const changed={...skills,[310003001]:structuredClone(skills[310003001])};
 changed[310003001].funcs.find(f=>f.ep==='EP_CONSUME_ITEM').fv2[3]++;
 assert.ok(inspect('CLERIC',changed).rejected.includes(310003001));
});
test('levels and mastery depend on class capability, not unrelated allies',()=>{
 assert.equal(find(inspect('CLERIC',skills,34),310003001).requirementsMet,false);
 assert.equal(find(inspect('CLERIC',skills,35),310003001).requirementsMet,true);
 assert.equal(find(inspect('EXORCIST',skills,44),330071001).requirementsMet,false);
 assert.equal(find(inspect('EXORCIST',skills,45),330071001).requirementsMet,true);
 assert.equal(find(inspect('EXORCIST',skills,49),330072001).requirementsMet,false);
 assert.equal(find(inspect('EXORCIST',skills,50),330072001).requirementsMet,true);
 const ranks={...classes.EXORCIST.branchCaps,exorcism:60};
 assert.equal(find(inspect('EXORCIST',skills,55,ranks),330101001).requirementsMet,false);
 assert.equal(find(inspect('WARRIOR'),310003001),undefined);
});
test('400 synthetic characters never turn target actions into permanent bonuses',()=>{
 const before=JSON.stringify(skills),names=Object.keys(classes);
 for(let i=0;i<400;i++){
  const job=names[i%names.length],caps=classes[job].branchCaps,level=i%55+1;
  const ranks=Object.fromEntries(Object.entries(caps).map(([b,max])=>[b,Math.min(max,i%103)]));
  const result=inspect(job,skills,level,ranks);
  for(const row of [...result.help,...result.magic]){
   const source=skills[row.id];
   assert.equal(row.requirementsMet,level>=source.charLevel&&source.reqs.every(
    req=>ranks[req.branch]>=req.amount));
   assert.equal(row.appliedToHero,false);
   assert.equal(row.finalAmount,null);
   assert.equal(row.inventoryChecked,false);
  }
 }
 assert.equal(JSON.stringify(skills),before);
});
test('one exact resource preview and seven qualitative models improve the audit',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(report.summary.statuses['numeric-preview'],66);
 assert.equal(report.summary.statuses['qualitative-preview'],50);
 assert.equal(report.summary.statuses['unmodeled-learnable'],58);
 for(const [id] of cases){
  const row=report.rows.find(x=>x.id===id);
  assert.equal(row.status,id===310003001?'numeric-preview':'qualitative-preview');
  assert.deepEqual(row.sourceModules,['support-effects-source']);
 }
});
test('Hero Book displays real item names without exposing internal effect codes',()=>{
 const src=read('pandora-studio-hero-book.js');
 for(const phrase of ['Помощь союзникам','Обмен и рассеивание магии',
  'Helping allies','Magic exchange and dispel','supportEffectPreview',
  'stage-skill-support-effects','sourceItemName(row.requiredItemId)'])
  assert.ok(src.includes(phrase),phrase);
 assert.ok(src.includes('&&!support?.help?.length&&!support?.magic?.length'));
});
