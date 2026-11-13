import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={}; Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const cases=[
 [410000201,'Телепорт','Teleport','other',[410000202,410000203]],
 [240003001,'Обезвреживание ловушек','Disarm','stealth',[240003002]],
 [420009001,'Темное растение','Malevolent Plant','other',[]],
 [440010001,'Мираж','Leaden Hooves','other',[]],
 [240006001,'Глаз урагана','Safe Zone','other',[]],
 [430059001,'Массовая невидимость','Conceal','stealth',[230001002]]
];
const run=(job,level=55,catalog=skills)=>C.situationalSkillPreview({
 skillCatalog:catalog,jobKey:job,level,branchCaps:classes[job].branchCaps,
 branchMasteries:classes[job].branchCaps});
const find=(result,id)=>[...result.stealth,...result.other].find(x=>x.id===id);
test('six verified abilities have official game labels and pinned child sources',()=>{
 for(const [id,ru,en,,linked] of cases){
  assert.equal(skills[String(id)]?.name,ru);
  assert.equal(english[String(id)]?.n,en);
  for(const child of linked){
   assert.equal(skills[String(child)]?.id,child);
   assert.equal(skills[String(child)].learnable,false);
  }
 }
});
test('OS profession caps and levels: 504 source-only scenarios',()=>{
 let count=0,shown=0;
 for(const job of Object.keys(classes)){
  for(const level of [1,45,55]){
   const result=run(job,level);
   for(const [id,ru,,group] of cases){
    count++;
    const source=skills[String(id)],caps=classes[job].branchCaps;
    const meets=Boolean(source.classes?.[job])&&source.reqs.every(
     req=>caps[req.branch]>=req.amount);
    const row=find(result,id);
    assert.equal(Boolean(row),meets,ru+' / '+job+' / '+level);
    if(!row)continue;
    shown++;
    assert.equal(result[group].includes(row),true);
    assert.equal(row.name,ru);
    assert.equal(row.mana,source.mana);
    assert.equal(row.cooldown,source.cooldown);
    assert.equal(row.requirementsMet,level>=source.charLevel);
    assert.equal(row.finalAmount,null);
    assert.equal(row.sourceOnly,true);
    assert.equal(row.appliedToHero,false);
    assert.equal(row.inventoryChecked,false);
    assert.ok(row.noteRu.length>20&&row.noteEn.length>20);
    assert.doesNotMatch(row.noteRu,/EP_[A-Z_]+/);
   }
  }
 }
 assert.equal(count,504);
 assert.ok(shown>=12,'At least six classes should see some source actions');
});
test('full root and every linked source reject unexpected OS mutations',()=>{
 for(const [id,ru,,,linked] of cases){
  const source=skills[String(id)];
  const job=Object.keys(classes).find(key=>source.classes?.[key]&&
   source.reqs.every(req=>classes[key].branchCaps[req.branch]>=req.amount));
  assert.ok(job,'No eligible class for '+ru);
  assert.ok(find(run(job),id));
  const mutations=[
   [id,s=>{s.mana+=1}],[id,s=>{s.funcs[0].fv1[3]+=1}],
   [id,s=>{s.funcs[0].fv2[0]+=1}],
   [id,s=>{s.funcs[0].dir='CASTER'}],
   ...linked.map(child=>[child,s=>{s.funcs[0].fv1[3]+=1}])
  ];
  for(const [target,mutate] of mutations){
   const copy=structuredClone(skills);
   mutate(copy[String(target)]);
   const preview=run(job,55,copy);
   assert.equal(find(preview,id),undefined,ru+' failed to reject '+target);
   assert.equal(preview.rejected.includes(id),true);
   for(const other of [...preview.stealth,...preview.other])
    assert.equal(other.finalAmount,null,'No unsupported server totals');
  }
 }
});
test('six additional source descriptions improve audit without false numeric claims',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(report.summary.skillRecords,569);
 assert.ok(report.summary.statuses['numeric-preview']>=72);
 assert.ok(report.summary.statuses['qualitative-preview']>=59);
 assert.ok(report.summary.statuses['unmodeled-learnable']<=43);
 assert.equal(report.summary.statuses['internal-or-triggered-source'],336);
 for(const [id] of cases){
  const row=report.rows.find(x=>x.id===id);
  assert.equal(row.status,'qualitative-preview');
  assert.equal(row.numericPreview,false);
  assert.deepEqual(row.sourceModules,['situational-skill-source']);
 }
});
test('Hero Book uses the existing two compact sections and canonical RU/EN skill IDs',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/Скрытность и обнаружение/);
 assert.match(book,/Особые действия/);
 assert.match(book,/gameTerms\.englishSkills\?\.\[String\(row\.id\)\]/);
 assert.match(book,/gameSkillBadge\(row\.id,row\.name,official\?\.n\|\|row\.name/);
});
