import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const labels=JSON.parse(read('data/os/meta.json'));
const inspect=(job='JESTER',ranks=classes[job].branchCaps,source=skills)=>
 C.enemyDebuffPreview({skillCatalog:source,jobKey:job,level:55,
  branchCaps:classes[job].branchCaps,branchMasteries:ranks,
  branchLabels:labels.branchLabels,englishBranches:english.branches});
const cases=[
 [440001001,'Немощь','Weakness','charm',8,['EP_DAMAGERATE_SCALE','EP_DAMAGERATE_CONST']],
 [440007001,'Слабость','Weaken','charm',26,['EP_ARMORCLASS_CONST','EP_ARMORCLASS_SCALE']],
 [260004001,'Путающая рука','Tangled Fingers','warding',21,['EP_TOHIT_CONST']],
 [440005001,'Мысленный удар','Psionic Blast','charm',21,['EP_MINDDAMAGE']]
];
test('all four current OS skills have pinned RU/EN names and complete TARGET effects',()=>{
 for(const [id,ru,en,branch,required,eps] of cases){
  const source=skills[id];
  assert.equal(source.name,ru);
  assert.equal(english.skills[id].n,en);
  assert.equal(source.skillType,'ENEMY');
  assert.equal(source.reqs[0].branch,branch);
  assert.equal(source.reqs[0].amount,required);
  assert.deepEqual(source.funcs.map(f=>f.ep),eps);
  assert.ok(source.funcs.every(f=>f.dir==='TARGET'));
  const p=inspect().rows.find(x=>x.id===id);
  assert.ok(p,id);
  assert.equal(p.requirementsMet,true);
  assert.equal(p.finalAmount,null);
  assert.equal(p.appliedToHero,false);
  assert.equal(p.targetSideOnly,true);
  assert.equal(p.sourceOnly,true);
 }
});
test('untrained branch and illegal class caps never give fake target effects',()=>{
 const low=inspect('JESTER',{charm:7,warding:20});
 assert.equal(low.rows.length,4);
 assert.ok(low.rows.every(x=>x.requirementsMet===false));
 for(const row of low.rows)assert.match(row.reasonRu,/Нужно мастерство/);
 const none=inspect('WARRIOR',{charm:0,warding:0});
 assert.ok(none.rows.length<4);
 assert.ok(none.rows.every(x=>!x.requirementsMet));
});
test('mutations to every relevant vector reject only changed skill',()=>{
 const mutations=[
  s=>s.funcs[0].fv1[0]++,
  s=>s.funcs[0].fv2[3]++,
  s=>s.funcs[0].dir='CASTER',
  s=>s.funcs.push(structuredClone(s.funcs[0])),
  s=>s.reqs[0].amount++,
  s=>s.reqLevel++,
  s=>s.prereq=100,
  s=>s.classes.PREDATOR=0,
  s=>s.powerStat='DEX',
  s=>s.learnable=false,
  s=>s.element='POISON'
 ];
 for(const [id] of cases)for(const mutate of mutations){
  const altered={...skills,[id]:structuredClone(skills[id])};
  mutate(altered[id]);
  const result=inspect('JESTER',classes.JESTER.branchCaps,altered);
  assert.equal(result.rows.find(x=>x.id===id),undefined,'malformed '+id);
  assert.ok(result.rejected.includes(id));
  assert.ok(result.rows.some(x=>x.id!==id));
 }
});
test('all 28 jobs and 400 mastery inputs do not mix source with hero numbers',()=>{
 const before=JSON.stringify(skills);
 const jobs=Object.keys(classes);
 for(let i=0;i<400;i++){
  const job=jobs[i%jobs.length],rank=i%101;
  const data=inspect(job,{charm:rank,warding:rank});
  for(const row of data.rows){
   const s=skills[row.id],req=s.reqs[0];
   const cap=classes[job].branchCaps[req.branch];
   assert.equal(row.requirementsMet,rank>=req.amount&&rank<=cap);
   assert.equal(row.finalAmount,null);
   assert.equal(row.appliedToHero,false);
  }
 }
 assert.equal(JSON.stringify(skills),before);
});
test('cross-module audit counts four new qualitative enemy-only roots',async()=>{
 const script=await import('../scripts/audit-os-skill-formulas.mjs');
 const report=script.auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.equal(report.summary.statuses['qualitative-preview'],50);
 assert.equal(report.summary.statuses['unmodeled-learnable'],58);
 for(const [id] of cases){
  const row=report.rows.find(x=>x.id===id);
  assert.equal(row.targetSideOnly,true);
  assert.equal(row.status,'qualitative-preview');
  assert.ok(row.sourceModules.includes('enemy-debuff-source'));
 }
});
test('Book presents only readable enemy-side descriptions',()=>{
 const code=read('pandora-studio-hero-book.js');
 for(const name of ['Ослабление противника','Немощь','Слабость']){}
 assert.ok(code.includes('Ослабление противника'));
 assert.ok(code.includes('Weakening enemies'));
 assert.ok(code.includes('Эти умения действуют на противника, а не на вашего героя'));
 assert.ok(code.includes('root.PandoraOSCalculator?.enemyDebuffPreview?.('));
});
