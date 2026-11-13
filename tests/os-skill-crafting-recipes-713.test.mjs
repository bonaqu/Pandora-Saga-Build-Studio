import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const items=JSON.parse(read('data/os/items.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const preview=(job,catalog=skills,masteries=null)=>C.craftingSkillPreview({
 skillCatalog:catalog,jobKey:job,level:45,branchCaps:classes[job].branchCaps,
 branchMasteries:masteries||classes[job].branchCaps,
 branchLabels:meta.branchLabels,englishBranches:english.branches});
const get=(rows,id)=>rows.find(x=>x.id===id);
const cases=[
 [220002001,'Создание яда','Poison-Making',[[50022,1],[65011,1]],[50056,1]],
 [220003001,'Создание противоядия','Serum',[[50021,1],[65011,1]],[50057,1]],
 [220004001,'Составление зелий','Potion Crafting',[[50025,1],[50024,1],[65011,1]],[50061,1]],
 [320010001,'Освящение воды','Aqua Elymus',[[65011,1]],[50059,1]]
];
test('source-exact recipes use official RU/EN skill and item identities',()=>{
 for(const [id,ru,en,uses,out] of cases){
  assert.equal(skills[id].name,ru);assert.equal(english.skills[id].n,en);
  const r=Object.keys(classes).map(j=>get(preview(j).rows,id)).find(Boolean);
  assert.ok(r,'a qualifying OS class exists for '+id);
  assert.deepEqual(r.uses,uses.map(([ingredient,quantity])=>({id:ingredient,quantity})));
  assert.deepEqual(r.produces,{id:out[0],quantity:out[1]});
  assert.equal(r.requirementsMet,true);
  assert.equal(r.ingredientsChecked,false);
  assert.equal(r.sourceOnly,true);
  for(const [itemId] of [...uses,out]){
   assert.ok(items[String(itemId)]?.name);
   assert.ok(english.items[String(itemId)]?.n);
  }
 }
});
test('insufficient actual mastery shows requirement without assuming owned ingredients',()=>{
 const job=Object.keys(classes).find(j=>get(preview(j).rows,220004001));
 assert.ok(job);
 const locked=get(preview(job,skills,{alchemy:40}).rows,220004001);
 assert.equal(locked.requirementsMet,false);
 assert.match(locked.reasonRu,/41/);
 assert.match(locked.reasonEn,/41/);
 assert.equal(locked.ingredientsChecked,false);
});
test('tampered quantities, identities, directions, extra effects and order reject source',()=>{
 const job=Object.keys(classes).find(j=>get(preview(j).rows,220002001));
 assert.ok(job);
 for(const mutate of [
  s=>{s[220002001].funcs[0].fv1[3]=50021;},
  s=>{s[220002001].funcs[0].fv2[3]=2;},
  s=>{s[220002001].funcs[0].dir='TARGET';},
  s=>{s[220002001].funcs.push(structuredClone(s[220002001].funcs[0]));},
  s=>{s[220002001].funcs.reverse();}
 ]){
  const changed=structuredClone(skills);mutate(changed);
  const r=preview(job,changed);
  assert.equal(get(r.rows,220002001),undefined);
  assert.ok(r.rejected.includes(220002001));
 }
});
test('numeric crafting source counts as four models without a server-success claim',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(report.summary.statuses['numeric-preview'],65);
 assert.equal(report.summary.statuses['unmodeled-learnable'],71);
 for(const [id] of cases){
  const row=report.rows.find(r=>r.id===id);
  assert.deepEqual(row.sourceModules,['skill-crafting']);
  assert.equal(row.numericPreview,true);
  assert.equal(row.targetSideOnly,false);
 }
});
test('Hero Book recipes display item names from canonical RU/EN catalogs',()=>{
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 assert.match(book,/stage-skill-crafting-effects/);
 assert.match(book,/gameTerms\.englishItems\?\.\[String\(id\)\]\?\.n\|\|ru/);
 assert.match(book,/Нужны указанные ингредиенты/);
 assert.match(book,/recipe\.uses\.map\(part\)/);
 assert.match(app,/items:catalogSource\?\.items\|\|\{\},englishItems:officialEnglish\?\.items\|\|\{\}/);
});
