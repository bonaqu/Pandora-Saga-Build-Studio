import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};
for(const file of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(file),{window:root});
const C=root.PandoraOSCalculator,S=root.PandoraCatalogSafety;
const json=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:json('skills'),classes:json('classes'),tables:json('tables'),
 items:json('items')};
function change(id,mutation){
 const after={...before,skills:{...before.skills}};
 after.skills[id]=structuredClone(before.skills[id]);
 mutation(after.skills[id]);
 return after;
}
const cache=new Map();
function oldProof(id,module){
 if(cache.has(module+id))return cache.get(module+id);
 const methods={
  'source-complex-spell':['complexSkillSourcePreview',['rows']],
  'source-target-status':['statusApplicationPreview',['rows']],
  'source-enemy-debuff':['enemyDebuffPreview',['rows']],
  'source-tactical-action':['tacticalSkillPreview',['rows']],
  'source-combat-technique':['combatTechniquePreview',['rows']],
  'source-specialized-defense-magic':['specializedSkillPreview',['defense','magic']],
  'source-support-action':['supportEffectPreview',['help','magic']],
  'source-situational-action':['situationalSkillPreview',['stealth','other']],
  'source-song-chain':['songSkillPreview',['rows']],
  'source-execution-chain':['skillExecutionChains',['rows']],
  'source-onhit-execution':['skillExecutionChains',['rows']],
  'source-ammunition-action':['rangedAmmoPreview',['rows']]
 };
 const [method,groups]=methods[module];
 const owner=Object.keys(before.classes).find(job=>{
  const caps=before.classes[job].branchCaps;
  const args={skillCatalog:before.skills,jobKey:job,level:55,
   branchCaps:caps,branchMasteries:caps,
   ...(module==='source-onhit-execution'?{onHit:true}:{}),
   ...(['source-combat-technique','source-ammunition-action'].includes(module)?
    {weaponKind:module==='source-combat-technique'?'2H_SWORD':'BOW'}:{})};
  const result=C[method](args);
  return groups.some(group=>result[group].some(row=>row.id===id));
 });
 cache.set(module+id,owner);
 return owner;
}
function requireLost(after,id,module){
 const b=JSON.stringify(before),a=JSON.stringify(after);
 const replay=S.replaySkills(before,after);
 assert.equal(replay.ok,false,'must fail closed on changed '+module+' for '+id);
 assert.ok(replay.lostSourceOnly>0,'source-only proof must not silently disappear: '+module);
 assert.ok(replay.samples.some(row=>row.id===String(id)&&row.module===module),
  'sample must identify the exact skill/module '+id+' '+module);
 assert.equal(JSON.stringify(before),b,'baseline source immutable');
 assert.equal(JSON.stringify(after),a,'candidate source immutable');
 return replay;
}
const signatures=[
 ['source-complex-spell',330001001],
 ['source-target-status',142501101],
 ['source-enemy-debuff',440001001],
 ['source-tactical-action',100000501],
 ['source-combat-technique',161201001],
 ['source-specialized-defense-magic',168001004],
 ['source-support-action',310011001],
 ['source-situational-action',213606001],
 ['source-song-chain',340001001],
 ['source-execution-chain',420007101],
 ['source-onhit-execution',100103001],
 ['source-ammunition-action',213603002]
];
test('12 existing source inspector families have real roots and read-only replay coverage',()=>{
 for(const [module,id] of signatures){
  assert.ok(oldProof(id,module),'expected source-qualified '+module+' skill '+id);
  const damaged=change(id,row=>{row.funcs[0].fv1[3]+=1});
  requireLost(damaged,id,module);
 }
});
test('a classless diffusion action invalidates its specialized parent proof',()=>{
 const root=420005001,child=420005004;
 assert.ok(oldProof(root,'source-specialized-defense-magic'));
 assert.equal(Object.keys(before.skills[child].classes).length,0);
 assert.ok(before.skills[root].funcs.some(x=>
  x.ep==='EP_SKILL_EXEC_DIFFUSION'&&x.fv1?.[3]===child));
 const updated=change(child,row=>{row.funcs[0].fv1[3]+=1});
 const replay=requireLost(updated,root,'source-specialized-defense-magic');
 assert.ok(replay.changedSkills>=2,'new link expands source-dependent root');
});
test('a classless parry-counter action invalidates its combat technique proof',()=>{
 const root=161202001,child=161202050;
 assert.ok(oldProof(root,'source-combat-technique'));
 assert.ok(before.skills[root].funcs.some(x=>
  x.ep==='EP_SKILL_PARRY_COUNTER'&&x.fv1?.[3]===child));
 const updated=change(child,row=>{row.funcs[0].fv1[3]+=1});
 const replay=requireLost(updated,root,'source-combat-technique');
 assert.ok(replay.changedSkills>=2);
});
test('a shield-break child invalidates its source-verified combat root',()=>{
 const root=142503001,child=142503002;
 assert.ok(oldProof(root,'source-combat-technique'));
 assert.ok(before.skills[root].funcs.some(x=>
  x.ep==='EP_ATTACK_BLOCK_BREAK'&&x.fv1?.[3]===child));
 const updated=change(child,row=>{row.funcs[0].fv1[3]+=1});
 const replay=requireLost(updated,root,'source-combat-technique');
 assert.ok(replay.changedSkills>=2);
});
test('a true unknown new EP is not promoted to a numerical or source-only claim',()=>{
 const id=440001001;
 const updated=change(id,row=>{row.funcs.push({ep:'EP_FUTURE_UNKNOWN',dir:'TARGET',
  fv1:[0,0,0,44],fv2:[0,0,0,0]})});
 const compatibility=S.compatibility(before,updated);
 assert.equal(compatibility.totals.needsReview,1);
 const result=requireLost(updated,id,'source-enemy-debuff');
 assert.ok(result.unmodeled>=0);
});
test('a presentation-only edit never triggers numerical or qualitative replay',()=>{
 for(const id of [330001001,142501101,440001001,100000501,
  161201001,168001004,310011001,213606001,340001001,213603002]){
  const after=change(id,row=>{
   row.name='Переименованный навык';row.nameEn='Translated skill';
   row.desc='Проверка текста';row.iconId=1+Number(row.iconId||0);
  });
  assert.equal(S.compatibility(before,after).totals.sourceOnly,1);
  const result=S.replaySkills(before,after);
  assert.equal(result.ok,true);
  assert.equal(result.changedSkills,0);
  assert.equal(result.scenarios,0);
 }
});
test('new qualitative proofs are separately counted and never treated as final server damage',()=>{
 const after=change(440001001,row=>{row.funcs[0].fv1[3]+=1});
 const report=S.replaySkills(before,after);
 assert.equal(report.ok,false);
 assert.ok(report.lostSourceOnly>0);
 assert.ok(report.lost>=report.lostSourceOnly);
 assert.equal(C.enemyDebuffPreview({
  skillCatalog:before.skills,jobKey:'JESTER',level:55,
  branchCaps:before.classes.JESTER.branchCaps,
  branchMasteries:before.classes.JESTER.branchCaps
 }).rows.find(row=>row.id===440001001).finalAmount,null);
});
