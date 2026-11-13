import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const calc=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const meta=JSON.parse(read('data/os/meta.json'));
const cases=[
 [213603002,'Ураган','Arrow Storm',213603003,213603001,32,10],
 [213608001,'Пламенная стрела','Kindling Arrow',213608002,null,41,15],
 [213700501,'Внезапный выстрел','Charge Shot',213700550,null,18,30]
];
const inspect=(job,source=skills,level=55,ranks=jobs[job].branchCaps,weaponKind='BOW')=>
 calc.rangedAmmoPreview({skillCatalog:source,jobKey:job,level,
  branchCaps:jobs[job].branchCaps,branchMasteries:ranks,weaponKind,
  branchLabels:meta.branchLabels,englishBranches:english.branches});
const owner=id=>Object.keys(jobs).find(job=>inspect(job).rows.some(x=>x.id===id));
test('three bow skill roots have exact RU/EN identities, cost and one ammunition source',()=>{
 for(const [id,ru,en,child,parent,mp,cooldown] of cases){
  const s=skills[id];assert.equal(s.name,ru);assert.equal(english.skills[id].n,en);
  assert.equal(s.mana,mp);assert.equal(s.cooldown,cooldown);
  assert.equal(s.prereq,parent);assert.deepEqual(s.weaponUse,['BOW']);
  assert.equal(s.funcs.find(f=>f.ep==='EP_SKILL_EXEC').fv1[3],child);
  const job=owner(id);assert.ok(job,id);
  const row=inspect(job).rows.find(x=>x.id===id);
  assert.equal(row.ammoCount,1);assert.equal(row.mana,mp);
  assert.equal(row.prerequisiteId,parent);assert.equal(row.linkedEffectId,child);
  assert.equal(row.requirementsMet,true);assert.equal(row.finalDamage,null);
  assert.equal(row.inventoryChecked,false);assert.equal(row.appliedToHero,false);
  assert.equal(row.sourceOnly,true);
 }
});
test('every root, child and prerequisite remains validated before display',()=>{
 for(const [id,, ,child,parent] of cases){
  const job=owner(id);
  const mutations=[
   s=>s.funcs[0].fv1[3]++,s=>s.funcs[1].fv2[3]++,
   s=>s.funcs[1].dir='TARGET',s=>s.mana++,
   s=>s.cooldown++,s=>s.charLevel++,s=>s.weaponUse=['CROSSBOW'],
   s=>s.reqs.push({branch:'archery',amount:1}),s=>s.learnable=false
  ];
  for(const modify of mutations){
   const damaged={...skills,[id]:structuredClone(skills[id])};
   modify(damaged[id]);const row=inspect(job,damaged);
   assert.equal(row.rows.some(x=>x.id===id),false,id+' stale root');
   assert.ok(row.rejected.includes(id));
  }
  const changed={...skills,[child]:structuredClone(skills[child])};
  changed[child].funcs[0].fv2[3]++;
  assert.ok(inspect(job,changed).rejected.includes(id),'child '+child);
  if(parent){
   const changedParent={...skills,[parent]:structuredClone(skills[parent])};
   changedParent[parent].funcs[0].fv1[2]++;
   assert.ok(inspect(job,changedParent).rejected.includes(id),'parent '+parent);
  }
 }
});
test('bow requirements, mastery and level are separate from ammunition counts',()=>{
 for(const [id] of cases){
  const job=owner(id),unarmed=inspect(job,skills,55,jobs[job].branchCaps,'BARE_HAND').rows.find(x=>x.id===id);
  assert.ok(unarmed);assert.equal(unarmed.requirementsMet,false);
  assert.match(unarmed.reasonRu,/Требуется лук/);
  assert.equal(unarmed.ammoCount,1);
  const s=skills[id];
  if(s.charLevel>1){
   const low=inspect(job,skills,s.charLevel-1).rows.find(x=>x.id===id);
   assert.ok(low);assert.equal(low.requirementsMet,false);
  }
  if(s.reqs.length){
   const ranks={...jobs[job].branchCaps};
   const first=s.reqs[0];ranks[first.branch]=first.amount-1;
   const low=inspect(job,skills,55,ranks).rows.find(x=>x.id===id);
   assert.ok(low);assert.equal(low.requirementsMet,false);
  }
 }
 assert.equal(inspect('WARRIOR').rows.some(x=>x.id===213608001),false);
});
test('400 synthetic combinations never alter stored items or character state',()=>{
 const original=JSON.stringify(skills),names=Object.keys(jobs);
 for(let i=0;i<400;i++){
  const job=names[i%names.length],cap=jobs[job].branchCaps,level=i%55+1;
  const rank=Object.fromEntries(Object.entries(cap).map(([key,n])=>[key,Math.min(n,i%78)]));
  const bow=i%2===0;
  for(const row of inspect(job,skills,level,rank,bow?'BOW':'CROSSBOW').rows){
   const s=skills[row.id];
   assert.equal(row.requirementsMet,bow&&level>=s.charLevel&&s.reqs.every(r=>rank[r.branch]>=r.amount));
   assert.equal(row.ammoCount,1);assert.equal(row.finalDamage,null);
   assert.equal(row.inventoryChecked,false);
  }
 }
 assert.equal(JSON.stringify(skills),original);
});
test('cross-module count increases for only three independently sourced quantities',()=>{
 const report=auditOsSkillFormulaCoverage({skills,classes:jobs,calculator:calc});
 assert.equal(report.summary.statuses['numeric-preview'],65);
 assert.equal(report.summary.statuses['unmodeled-learnable'],71);
 for(const [id] of cases){
  const row=report.rows.find(x=>x.id===id);
  assert.equal(row.status,'numeric-preview');
  assert.deepEqual(row.sourceModules,['skill-ammunition']);
 }
});
test('Book uses plain RU/EN names and does not claim final damage',()=>{
 const text=read('pandora-studio-hero-book.js');
 for(const phrase of ['Боеприпасы для умений','Ammunition for skills',
  'Расход боеприпасов и ОМ','Ammo: ','Боеприпасы: ',
  'rangedAmmoPreview','stage-skill-ranged-ammo'])
  assert.ok(text.includes(phrase),phrase);
 assert.ok(text.includes('&&!rangedAmmo?.rows?.length'));
});
