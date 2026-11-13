import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};Function('window',read('pandora-os-character-calculator.js'))(root);
const C=root.PandoraOSCalculator,skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const en=JSON.parse(read('data/os/strings.en.json')).skills;
const abilities=[
 [168053001,'Сковывающая песнь','Eternal Dirge','defense',null,[]],
 [330091001,'Затишье','Silent Void','magic',null,[330091002]],
 [320013001,'Распространение','Karmic Aura','magic',null,[]],
 [440004001,'Эфирная вспышка','Undermine','magic',null,[]],
 [440004002,'Эфирная вспышка','Undermine','magic',440004001,[440004003,440004004]]
];
const preview=(job,level=55,catalog=skills)=>C.specializedSkillPreview({
 skillCatalog:catalog,jobKey:job,level,
 branchCaps:classes[job].branchCaps,branchMasteries:classes[job].branchCaps});
const find=(p,id)=>[...p.defense,...p.magic].find(x=>x.id===id);

test('five source-only abilities preserve exact official RU/EN primary and linked names',()=>{
 for(const [id,ru,english,,parent,linked] of abilities){
  assert.equal(skills[id]?.name,ru);
  assert.equal(en[id]?.n,english);
  if(parent)assert.equal(skills[id].prereq,parent);
  for(const helper of linked){
   assert.equal(skills[helper].id,helper);
   assert.equal(skills[helper].learnable,false);
  }
 }
});
test('420 class/level scenarios retain profession caps and show no invented damage',()=>{
 let cases=0,shown=0;
 for(const job of Object.keys(classes)){
  for(const level of [1,45,55]){
   const p=preview(job,level);
   for(const [id,ru,,kind,parent] of abilities){
    cases++;
    const source=skills[id],caps=classes[job].branchCaps;
    const allowed=Boolean(source.classes?.[job])&&source.reqs.every(
     x=>caps[x.branch]>=x.amount);
    const row=find(p,id);
    assert.equal(Boolean(row),allowed,ru+' / '+job+' / '+level);
    if(!row)continue;
    shown++;
    assert.equal(p[kind].includes(row),true);
    assert.equal(row.name,ru);
    assert.equal(row.mana,source.mana);
    assert.equal(row.cooldown,source.cooldown);
    assert.equal(row.prerequisiteId,parent);
    assert.equal(row.requirementsMet,level>=source.charLevel);
    assert.equal(row.sourceOnly,true);
    assert.equal(row.finalAmount,null);
    assert.equal(row.appliedToHero,false);
    assert.ok(row.noteRu.length>20&&row.noteEn.length>20);
    assert.doesNotMatch(row.noteRu,/EP_[A-Z_]+/);
   }
  }
 }
 assert.equal(cases,420);
 assert.ok(shown>=15);
});
test('root, parent and nested skill helpers must all match their exact OS signatures',()=>{
 for(const [id,ru,,,parent,linked] of abilities){
  const source=skills[id];
  const job=Object.keys(classes).find(k=>source.classes?.[k]&&source.reqs.every(
   q=>classes[k].branchCaps[q.branch]>=q.amount));
  assert.ok(job);
  assert.ok(find(preview(job),id));
  const variants=[
   [id,x=>{x.mana+=1}],
   [id,x=>{x.funcs[0].fv1[3]+=1}],
   [id,x=>{x.funcs[0].fv2[0]+=1}],
   [id,x=>{x.funcs[0].dir=x.funcs[0].dir==='TARGET'?'CASTER':'TARGET'}],
   ...(parent?[[parent,x=>{x.funcs[0].fv1[0]+=1}]]:[]),
   ...linked.map(helper=>[helper,x=>{x.funcs[0].fv1[3]+=1}])
  ];
  for(const [target,mutate] of variants){
   const damaged=structuredClone(skills);
   mutate(damaged[target]);
   const q=preview(job,55,damaged);
   assert.equal(find(q,id),undefined,ru+' / broken source '+target);
   assert.ok(q.rejected.includes(id));
  }
 }
});
test('five source-backed models improve 569-skill census without fabricating totals',()=>{
 const audit=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.ok(audit.summary.statuses['numeric-preview']>=73);
 assert.ok(audit.summary.statuses['qualitative-preview']>=65);
 assert.ok(audit.summary.statuses['unmodeled-learnable']<=36);
 assert.equal(audit.summary.statuses['internal-or-triggered-source'],336);
 for(const [id] of abilities){
  const row=audit.rows.find(x=>x.id===id);
  assert.equal(row.status,'qualitative-preview');
  assert.equal(row.numericPreview,false);
  assert.deepEqual(row.sourceModules,['specialized-skill-source']);
 }
});
test('Book reuses existing defensive and special-magic groups',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/\['defense','Дополнительные защитные умения','Additional defensive skills'\]/);
 assert.match(book,/\['magic','Особые магические умения','Special magic skills'\]/);
 assert.match(book,/gameTerms\.englishSkills\?\.\[String\(row\.id\)\]/);
});
