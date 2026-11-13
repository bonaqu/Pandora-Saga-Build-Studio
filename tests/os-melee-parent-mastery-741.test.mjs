import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditOsSkillFormulaCoverage} from '../scripts/audit-os-skill-formulas.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
Function('window',read('pandora-studio-skill-progression.js'))(host);
Function('window','document',read('pandora-studio-hero-path.js'))(host,{});
const C=host.PandoraOSCalculator,M=host.PandoraSkillProgression;
const readiness=host.PandoraHeroPath.readiness;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const english=JSON.parse(read('data/os/strings.en.json')).skills;
const cases=[
 [100056001,'Отвлечение','Misdirection',70],
 [100057001,'Безболезненность','Ossify',100],
 [100101001,'Беспощадный удар','Slash',3],
 [111201001,'Мощный удар','Bash',35]
];
const group=Object.freeze(['slash','thrust','brush','blow','defense']);
const total=caps=>group.reduce((sum,key)=>sum+caps[key],0);
const inspect=(job,level=55,values=classes[job].branchCaps,catalog=skills,weaponKind='2H_SWORD')=>
 C.combatTechniquePreview({skillCatalog:catalog,jobKey:job,level,
  branchCaps:classes[job].branchCaps,branchMasteries:values,weaponKind});
test('current OS and official English identity use MELEE parent, not raw martial allocation',()=>{
 assert.deepEqual(M.MELEE,group);
 for(const [id,name,en,threshold] of cases){
  const root=skills[id];
  assert.equal(root.name,name);
  assert.equal(english[id].n,en);
  assert.equal(root.branchRaw,'MELEE');
  assert.equal(root.branch,'martial');
  assert.equal(root.learnable,true);
  assert.equal(root.isLevelBased,false);
  assert.deepEqual(root.reqs,[{branch:'martial',amount:threshold}]);
 }
 for(const [key,c] of Object.entries(classes)){
  assert.equal(c.branchCaps.martial,0,key);
  assert.equal(M.meleeGroupCap(c.branchCaps),total(c.branchCaps),key);
 }
});
test('all 28 professions × 3 levels × 3 weapons × 4 roots are source-gated',()=>{
 let checked=0,visible=0;
 for(const job of Object.keys(classes))for(const level of [1,45,55])
  for(const weapon of ['BARE_HAND','2H_SWORD','POLE_ARM']){
   const output=inspect(job,level,classes[job].branchCaps,skills,weapon);
   for(const [id,name,,required] of cases){
    checked++;
    const source=skills[id];
    const expected=source.classes[job]===1&&total(classes[job].branchCaps)>=required;
    const found=output.rows.find(x=>x.id===id);
    assert.equal(Boolean(found),expected,job+'/'+level+'/'+weapon+'/'+id);
    if(!found)continue;
    visible++;
    assert.equal(found.name,name);
    assert.equal(found.mana,source.mana);
    assert.equal(found.cooldown,source.cooldown);
    assert.equal(found.sourceOnly,true);
    assert.equal(found.finalAmount,null);
    assert.equal(found.appliedToHero,false);
    assert.ok(found.noteRu.length>30&&found.noteEn.length>30);
    assert.equal(found.requirementsMet,level>=source.charLevel&&
     (!source.weaponUse||source.weaponUse.includes(weapon)),job+'/'+id);
   }
  }
 assert.equal(checked,1008);
 assert.ok(visible>75);
});
test('manual green proficiency is required; raw martial points cannot fake it',()=>{
 const caps=classes.JUGGERNAUT.branchCaps;
 const zero=Object.fromEntries(Object.keys(caps).map(key=>[key,0]));
 const fake={...zero,martial:100};
 for(const values of [zero,fake]){
  const rows=inspect('JUGGERNAUT',55,values).rows;
  for(const [id] of cases){
   const row=rows.find(x=>x.id===id);
   assert.ok(row);
   assert.equal(row.requirementsMet,false,id+' must need trained group');
   assert.match(row.reasonRu,/Ближний бой/);
   assert.doesNotMatch(row.reasonRu,/martial/);
  }
 }
 const trained={...zero,slash:35};
 for(const [id,,,threshold] of cases){
  assert.equal(inspect('JUGGERNAUT',55,trained).rows.find(x=>x.id===id).requirementsMet,
   threshold<=35,id+' sums the child branches');
 }
 // A malformed branch or a value above the OS cap never unlocks a parent.
 assert.equal(inspect('JUGGERNAUT',55,{...zero,slash:999}).rows.find(
  x=>x.id===100101001).requirementsMet,false);
});
test('Path gallery uses green MELEE total rather than the zero martial cap',()=>{
 const caps=classes.JUGGERNAUT.branchCaps;
 const state={level:55,points:{slash:35},masteryAuto:false,
  masteryFormat:2,mastery:{slash:35}};
 const api={job:'JUGGERNAUT',state,innate:{},branchCaps:caps,
  skillCatalog:Object.values(skills),lang:'ru',
  branchName:key=>key==='melee'?'Ближний бой':key,
  cap:key=>caps[key]??0};
 assert.equal(M.meleeGroupTrained(state,{},caps),35);
 for(const [id,,,required] of cases){
  const result=readiness(skills[id],api);
  assert.equal(result.learned,required<=35,'path '+id);
  if(!result.learned)assert.ok(result.problems.some(x=>x.includes('освоено')));
 }
 state.mastery.slash=0;
 assert.equal(readiness(skills[100101001],api).learned,false,
  'allocated potential alone does not satisfy a parent proficiency threshold');
 state.masteryAuto=true;
 assert.equal(readiness(skills[100101001],api).learned,true,
  'auto green is trained as displayed, without adding a martial branch');
 const changed=structuredClone(skills[100101001]);
 changed.branchRaw='OTHER';
 assert.equal(readiness(changed,api).learned,false,
  'unknown raw branch cannot accidentally use the parent rule');
});
test('full OS signatures and raw MELEE identity fail closed when modified',()=>{
 for(const [id] of cases){
  assert.ok(inspect('JUGGERNAUT').rows.find(x=>x.id===id));
  for(const mutate of [
   x=>{x.mana++},
   x=>{x.reqs[0].amount++},
   x=>{x.funcs[0].fv1[3]++},
   x=>{x.funcs[0].fv2[0]++},
   x=>{x.funcs[0].dir=x.funcs[0].dir==='TARGET'?'CASTER':'TARGET'},
   x=>{x.branchRaw='OTHER'}
  ]){
   const changed=structuredClone(skills);
   mutate(changed[id]);
   const output=inspect('JUGGERNAUT',55,classes.JUGGERNAUT.branchCaps,changed);
   assert.equal(output.rows.some(x=>x.id===id),false,id+' accepted mutated source');
   assert.ok(output.rejected.includes(id),id+' must report a rejected source');
  }
 }
});
test('all four roots become qualitative models, leaving only three unresolved learnable OS IDs',()=>{
 const r=auditOsSkillFormulaCoverage({skills,classes,calculator:C});
 assert.deepEqual(r.summary.statuses,{
  'numeric-preview':73,'coefficient-model':27,'source-parameter':3,
  'qualitative-preview':98,'passive-source':29,
  'internal-or-triggered-source':336,'unmodeled-learnable':3
 });
 for(const [id] of cases){
  const row=r.rows.find(x=>x.id===id);
  assert.equal(row.status,'qualitative-preview');
  assert.equal(row.numericPreview,false);
  assert.deepEqual(row.sourceModules,['combat-techniques-source']);
 }
 assert.deepEqual(r.rows.filter(x=>x.status==='unmodeled-learnable').map(x=>x.id),
  [260006002,300001001,300002001]);
});
