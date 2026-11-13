import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const preview=(job,catalog=skills,points=null,level=55)=>
 C.complexSkillSourcePreview({skillCatalog:catalog,jobKey:job,level,
  branchCaps:jobs[job].branchCaps,
  branchMasteries:points||jobs[job].branchCaps,
  branchLabels:meta.branchLabels,englishBranches:english.branches});
const get=(a,id)=>a.find(x=>x.id===id);
const ids=[
 [330001001,'Святая стрела','Pure Arrow','elemental',false],
 [410011001,'Ледяные осколки','Hailstone','elemental',true],
 [410012001,'Ледяное копье','Ice Spear','elemental',true],
 [410023001,'Громовой разряд','Thunder Crash','elemental',false],
 [300004001,'Очищение','Mental Aid','dispel',false],
 [330003001,'Освобождение','Remedium','dispel',false]
];
test('six skill identities and all special effect families match current official RU/EN',()=>{
 for(const [id,ru,en,kind,secondary] of ids){
  assert.equal(skills[id].name,ru);assert.equal(english.skills[id].n,en);
  const row=Object.keys(jobs).map(job=>get(preview(job).rows,id)).find(Boolean);
  assert.ok(row,'a current class can learn '+id);
  assert.equal(row.kind,kind);
  assert.equal(row.hasSecondaryEffect,secondary);
  assert.equal(row.sourceOnly,true);
  assert.equal(row.requirementsMet,true);
  assert.ok(row.description.length);
  assert.equal(row.sourceEffects[0],kind==='dispel'?
   'EP_REMOVE_BAD_EFFECT':'EP_ELEMENT_DAMAGE');
  if(secondary)assert.equal(row.sourceEffects[1],'EP_CAUSE_NUMB');
 }
});
test('level 20 and class mastery gates preserve the real OS requirements',()=>{
 const wizard=get(preview('WIZARD',skills,null,19).rows,410023001);
 assert.ok(wizard);assert.equal(wizard.requirementsMet,false);
 assert.match(wizard.reasonRu,/20/);assert.match(wizard.reasonEn,/20/);
 assert.equal(get(preview('WIZARD',skills,null,20).rows,410023001).requirementsMet,true);
 const caster=Object.keys(jobs).find(job=>get(preview(job).rows,410012001));
 const ice=get(preview(caster,skills,{element:20}).rows,410012001);
 assert.ok(ice);assert.equal(ice.requirementsMet,false);
 assert.match(ice.reasonRu,/21/);
 assert.equal(get(preview('WARRIOR').rows,410012001),undefined);
});
test('changed damage vectors, secondary effects, caster and cure flags invalidate only the affected ability',()=>{
 const caster=Object.keys(jobs).find(job=>get(preview(job).rows,410012001));
 const mutations=[
  s=>{s[410012001].funcs[0].fv1[1]=31;},
  s=>{s[410012001].funcs[1].fv2[3]=201;},
  s=>{s[410012001].funcs[1].ep='EP_CAUSE_SILENCE';},
  s=>{s[410012001].funcs.push(structuredClone(s[410012001].funcs[1]));},
  s=>{s[410012001].funcs[0].dir='CASTER';}
 ];
 for(const mutate of mutations){
  const copy=structuredClone(skills);mutate(copy);
  const check=preview(caster,copy);
  assert.equal(get(check.rows,410012001),undefined);
  assert.ok(check.rejected.includes(410012001));
  assert.ok(get(check.rows,410011001),
   'nearby unchanged spell retains source preview');
 }
 const dispeller=Object.keys(jobs).find(job=>get(preview(job).rows,330003001));
 const changed=structuredClone(skills);changed[330003001].funcs[0].fv2[3]=16;
 assert.equal(get(preview(dispeller,changed).rows,330003001),undefined);
});
test('300 real class and mastery combinations never report an unavailable source as ready',()=>{
 const names=Object.keys(jobs);
 for(let i=0;i<300;i++){
  const job=names[i%names.length],level=(i%55)+1;
  const branchCaps=jobs[job].branchCaps,masteries=Object.fromEntries(
   Object.entries(branchCaps).map(([name,cap])=>[name,Math.min(cap,i%73)]));
  const rows=preview(job,skills,masteries,level).rows;
  for(const row of rows){
   const raw=skills[row.id];
   const ready=level>=raw.charLevel&&raw.reqs.every(r=>
    masteries[r.branch]>=r.amount);
   assert.equal(row.requirementsMet,ready);
  }
 }
});
test('qualitative mechanics improve source coverage without fake numeric spell output',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes:jobs,calculator:C});
 assert.equal(report.summary.statuses['numeric-preview'],65);
 assert.equal(report.summary.statuses['qualitative-preview'],30);
 assert.equal(report.summary.statuses['unmodeled-learnable'],79);
 for(const [id] of ids){
  const row=report.rows.find(x=>x.id===id);
  assert.deepEqual(row.sourceModules,['complex-source-mechanics']);
  assert.equal(row.numericPreview,false);
  assert.equal(row.coefficientModel,false);
  assert.equal(row.status,'qualitative-preview');
 }
});
test('Hero Book shows official descriptions and plain uncertainty, not internal effect codes',()=>{
 const src=read('pandora-studio-hero-book.js');
 const css=read('pandora-studio-hero-book-additions.css');
 assert.match(src,/stage-skill-complex-effects/);
 assert.match(src,/gameTerms\.englishSkills\?\.\[String\(entry\.id\)\]/);
 assert.match(src,/Точный урон по цели пока не подтверждён/);
 assert.match(src,/Результат зависит от состояний цели/);
 assert.match(css,/stage-skill-complex-effects/);
});
