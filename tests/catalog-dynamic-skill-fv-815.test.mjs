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
const get=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:get('skills'),classes:get('classes'),tables:get('tables')};
const amended=(id,mutate)=>{
 const next={...before,skills:{...before.skills}};
 next.skills[String(id)]=structuredClone(before.skills[String(id)]);
 mutate(next.skills[String(id)]);
 return next;
};
const sample=(catalog,id,job,level=45)=>{
 const caps=before.classes[job].branchCaps;
 const mastery=Object.fromEntries(Object.entries(caps).map(([branch,cap])=>[branch,cap]));
 const result=C.scalingSkillPreview({skillCatalog:catalog,jobKey:job,level,
  branchCaps:caps,branchMasteries:mastery,
  stats:{vit:80,str:100,agi:100,dex:90,spi:100,int:100},
  combat:{attack:{walkingBase:200},defense:{directRaw:100},
   accuracy:{base:140},dodge:{base:120}},weaponKind:'BARE_HAND',
  hasShield:true});
 return [...result.offense,...result.defense,...result.movement,
  ...result.utility].find(row=>row.id===id);
};

test('declarative dynamic source registry includes only independent modeled source parameters',()=>{
 const expected=[330002001,420002001,420002002,420004001,420004002];
 assert.deepEqual(Object.keys(C.dynamicSkillContracts).map(Number).sort((a,b)=>a-b),expected);
 assert.ok(Object.isFrozen(C.dynamicSkillContracts));
 for(const id of expected){
  const contract=C.dynamicSkillContracts[id];
  assert.equal(C.dynamicSkillSourceMatches(before.skills[id],
   contract.ep,contract.fv1),true,String(id));
 }
 for(const id of [260005001,142051001,320011001])
  assert.equal(C.dynamicSkillContracts[id],undefined,
   'existing cross-module buffs and partly gated chains must not be generalized');
});
test('real scalar FV change remains modeled by actual class-specific Skill Effects',()=>{
 for(const [id,job,level] of [
  [330002001,'EXORCIST',45],
  [420002001,'WIZARD',45],
  [420002002,'CONJURER',55],
  [420004001,'WIZARD',45],
  [420004002,'CONJURER',55]
 ]){
  const next=amended(id,skill=>{skill.funcs[0].fv1[3]+=5});
  const old=sample(before.skills,id,job,level);
  const updated=sample(next.skills,id,job,level);
  assert.ok(Number.isFinite(old?.amount),id+' old model present');
  assert.equal(updated?.amount-old.amount,5,id+' updated source coefficient drives model');
  const compat=S.compatibility(before,next);
  assert.equal(compat.totals.verified,1,id+' amount-only source has numeric model');
  assert.equal(compat.totals.needsReview,0);
  const replay=S.replaySkills(before,next);
  assert.equal(replay.ok,true,id+' replays old and new model');
  assert.equal(replay.lost,0);
  assert.ok(replay.retained>0);
 }
});
test('changed reserved FV1 lane is unknown mechanics and drops old guarded source',()=>{
 const next=amended(330002001,skill=>{skill.funcs[0].fv1[1]=10});
 assert.equal(S.compatibility(before,next).totals.needsReview,1);
 assert.equal(C.dynamicSkillSourceMatches(next.skills['330002001'],
  'EP_ABSOLUTE_MAGIC',[20,0,20,10]),false);
 assert.ok(S.replaySkills(before,next).lost>0);
});
test('FV2 semantic changes and additional effects stay outside data-only contract',()=>{
 const changed=amended(420002001,skill=>{skill.funcs[0].fv2[3]=99});
 assert.equal(S.compatibility(before,changed).totals.needsReview,1);
 assert.ok(S.replaySkills(before,changed).lost>0);
 const added=amended(330002001,skill=>{
  skill.funcs.push({ep:'EP_UNKNOWN_PROC',dir:'TARGET',
   fv1:[0,0,0,12],fv2:[0,0,0,0]});
 });
 assert.equal(S.compatibility(before,added).totals.needsReview,1);
 assert.equal(C.dynamicSkillSourceMatches(added.skills['330002001'],
  'EP_ABSOLUTE_MAGIC',[20,0,20,10]),false);
});
test('cross-module Cold Blood remains review-gated despite a safe updated Skill Effects model',()=>{
 const next=amended(142051001,skill=>{skill.funcs[0].fv1[3]+=5});
 assert.equal(S.compatibility(before,next).totals.needsReview,1,
  'Other combat consumers are not proven compatible with this FV change');
 const previous=sample(before.skills,142051001,'JUGGERNAUT');
 const updated=sample(next.skills,142051001,'JUGGERNAUT');
 assert.ok(Number.isSafeInteger(previous?.amount));
 assert.equal(updated?.amount,previous.amount+5,
  'Read-only preview must use allowed current FV1 rather than freeze the old value');
 assert.equal(updated?.modelOnly,true);
 assert.equal(updated?.uncertain,true);
 const replay=S.replaySkills(before,next);
 assert.equal(replay.ok,true);
 assert.equal(replay.lost,0,
  'Safe preview calculations can replay, while cross-module compatibility still needs review');
});
test('unknown changed skill identity cannot receive numeric source contract',()=>{
 const next=amended(330002001,skill=>{skill.funcs[0].ep='EP_NOT_MODELED'});
 assert.equal(S.compatibility(before,next).totals.needsReview,1);
 assert.ok(S.replaySkills(before,next).lost>0);
});
test('safety replay and dynamic source check leave original selected snapshots intact',()=>{
 const next=amended(330002001,skill=>{skill.funcs[0].fv1[3]+=4});
 const a=JSON.stringify(before),b=JSON.stringify(next);
 S.compatibility(before,next);S.replaySkills(before,next);
 assert.equal(JSON.stringify(before),a);
 assert.equal(JSON.stringify(next),b);
});
