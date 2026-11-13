import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const expected=[
 [240001001,'Капкан','Tangled Legs','Ограничение движения цели',null],
 [240002001,'Взрывающаяся ловушка','Plant Mine','Стихийный урон и отталкивание','knockback'],
 [240005001,'Ползучая ловушка','Worm Bomb','Стихийный урон',null],
 [240008001,'Растворение сознания','Mind Warp','Уменьшение ОМ цели',null],
 [240010001,'Вольер','Stone Prison','Ограничение движения и создание препятствия',null]
];
const traps=(job,catalog=skills,ranks=jobs[job].branchCaps)=>
 C.trapSkillCostPreview({skillCatalog:catalog,jobKey:job,level:55,
  branchCaps:jobs[job].branchCaps,branchMasteries:ranks});
const pick=(id,catalog=skills)=>Object.keys(jobs).map(job=>
 traps(job,catalog).rows.find(row=>row.id===id)).find(Boolean);
test('five trap outcome summaries are pinned to current OS linked effects and canonical names',()=>{
 for(const [id,ru,en,effect,status] of expected){
  assert.equal(skills[id].name,ru);assert.equal(english.skills[id].n,en);
  const value=pick(id);assert.ok(value,id);
  assert.equal(value.sourceEffectRu,effect);
  assert.equal(typeof value.sourceEffectEn,'string');
  assert.ok(value.sourceEffectEn.length);
  assert.equal(value.statusResistanceKey,status);
  assert.equal(value.sourceOnly,true);
  assert.equal(value.inventoryChecked,false);
 }
});
test('mutated triggered vectors and nested chains fail closed, without hiding unrelated traps',()=>{
 const cases=[
  [240001001,240001050,0,'fv1',3],
  [240002001,240002050,1,'fv2',3],
  [240005001,240005003,0,'fv1',0],
  [240008001,240008002,0,'fv1',2],
  [240010001,240010003,2,'fv2',0]
 ];
 for(const [root,child,at,vector,index] of cases){
  const changed=structuredClone(skills);
  changed[child].funcs[at][vector][index]++;
  const job=Object.keys(jobs).find(j=>traps(j).rows.length===expected.length&&
   traps(j).rows.some(x=>x.id===root));
  const result=traps(job,changed);
  assert.equal(result.rows.find(x=>x.id===root),undefined);
  assert.ok(result.rejected.includes(root));
  assert.ok(result.rows.some(x=>x.id!==root));
 }
});
test('400 allocations preserve eligibility without adding damage or changing resistance',()=>{
 const before=JSON.stringify(skills);
 for(let i=0;i<400;i++){
  const job=Object.keys(jobs)[i%Object.keys(jobs).length];
  const rank=i%101;
  const current=traps(job,skills,{trap:rank});
  for(const row of current.rows){
   const cap=jobs[job].branchCaps.trap;
   assert.equal(row.requirementsMet,rank>=skills[row.id].reqs[0].amount&&rank<=cap);
   assert.equal(row.amount,undefined);
   assert.ok(!Object.hasOwn(row,'finalDamage'));
  }
 }
 assert.equal(JSON.stringify(skills),before);
});
test('six provisional spell coefficients preserve separate floor stages',()=>{
 let total=0;
 for(let int=1;int<=35;int++)for(let rank=0;rank<9;rank++){
  const list=C.elementalSpellCoefficientPreview({skillCatalog:skills,
   jobKey:'WARLOCK',level:55,branchCaps:jobs.WARLOCK.branchCaps,
   branchMasteries:{element:rank,darkness:rank},stats:{int}});
  for(const entry of list){
   const model=entry.coefficientModels[0],p=model.roundingParts;
   const fv1=skills[entry.id].funcs.find(x=>x.ep==='EP_ELEMENT_DAMAGE').fv1;
   assert.deepEqual(p,{base:fv1[3],int:Math.floor(int*fv1[0]/100),
    mastery:Math.floor(rank*fv1[2]/100),method:'floor-components'});
   assert.equal(model.amount,p.base+p.int+p.mastery);
   assert.equal(entry.amount,null);
   assert.equal(entry.uncertain,true);
   total++;
  }
 }
 assert.ok(total>=1000,total);
});
test('ice secondary status is a separate frozen-state source, never a server roll',()=>{
 const rows=C.complexSkillSourcePreview({skillCatalog:skills,jobKey:'WARLOCK',
  level:55,branchCaps:jobs.WARLOCK.branchCaps,
  branchMasteries:jobs.WARLOCK.branchCaps}).rows;
 for(const id of [410011001,410012001]){
  const row=rows.find(x=>x.id===id);
  assert.ok(row);assert.deepEqual(row.linkedStatus,{key:'numb',ru:'Заморозка',en:'Freeze'});
  assert.equal(row.sourceOnly,true);assert.equal(row.chance,undefined);
 }
 for(const id of [330001001,410023001,300004001,330003001]){
  const row=rows.find(x=>x.id===id);
  if(row)assert.equal(row.linkedStatus,null);
 }
});
test('Source-only os-trap-element-status-rounding-717 knowledge is readable in Wiki without fake results',()=>{
 const wiki=read('pandora-studio-wiki-skill-insights.js');
 const app=read('pandora-studio-app.js');
 const book=read('pandora-studio-hero-book.js');
 assert.ok(wiki.includes('trapSkillCostPreview'),'verified source projection retained');
 assert.ok(app.includes('PandoraWikiSkillInsights?.inspect'),'Wiki owns reference skill notes');
 assert.ok(!book.includes('stage-skill-trap-costs'),'Book cannot show standalone source-only notes');
});
