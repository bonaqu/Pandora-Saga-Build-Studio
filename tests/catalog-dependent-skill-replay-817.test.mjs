import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const root={};
for(const name of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js',
 'pandora-studio-skill-progression.js','pandora-studio-catalog-safety.js'])
 vm.runInNewContext(read(name),{window:root});
const calc=root.PandoraOSCalculator,safety=root.PandoraCatalogSafety;
const get=name=>JSON.parse(read('data/os/'+name+'.json'));
const before={skills:get('skills'),classes:get('classes'),tables:get('tables')};
const change=(id,edit)=>{
 const after={...before,skills:{...before.skills}};
 after.skills[id]=structuredClone(after.skills[id]);
 edit(after.skills[id]);
 return after;
};
function getRow(skills,id,job,level=55){
 const caps=before.classes[job].branchCaps;
 const mastery=Object.fromEntries(Object.entries(caps));
 const value=calc.scalingSkillPreview({skillCatalog:skills,jobKey:job,level,
  branchCaps:caps,branchMasteries:mastery,
  stats:{vit:80,str:100,agi:100,dex:90,spi:100,int:100},
  combat:{attack:{walkingBase:200},defense:{directRaw:100},
   accuracy:{base:140},dodge:{base:120}},
  weaponKind:'BARE_HAND',hasShield:true});
 return [...value.offense,...value.defense,...value.movement,
  ...value.utility].find(x=>x.id===id);
}
test('renaming a prerequisite cannot remove its advanced numerical skill',()=>{
 for(const [parent,child] of [[420002001,420002002],[420004001,420004002]]){
  const previous=getRow(before.skills,child,'CONJURER');
  assert.ok(previous&&Number.isFinite(previous.amount),String(child));
  const after=change(parent,record=>{record.name+=' (новое название)';});
  const updated=getRow(after.skills,child,'CONJURER');
  assert.ok(updated,'gameplay chain must use signed IDs and branch, not labels');
  assert.equal(updated.amount,previous.amount);
  assert.equal(safety.compatibility(before,after).totals.sourceOnly,1);
  assert.equal(safety.replaySkills(before,after).changedSkills,0);
 }
});
test('changed prerequisite branch identity forces dependent replay and catches a lost model',()=>{
 for(const [parent,child,field,value] of [
  [420004001,420004002,'branch','unknown-branch'],
  [420004001,420004002,'branchRaw','UNKNOWN_SOURCE'],
  [420002001,420002002,'skillType','ENEMY']
 ]){
  const after=change(parent,record=>{record[field]=value});
  assert.ok(getRow(before.skills,child,'CONJURER'));
  assert.equal(getRow(after.skills,child,'CONJURER'),undefined,
   'advanced source family is no longer proven');
  assert.equal(safety.compatibility(before,after).totals.needsReview,1);
  const replay=safety.replaySkills(before,after);
  assert.ok(replay.changedSkills>=2,'parent and unchanged child must be tested');
  assert.ok(replay.lost>0,'lost advanced numeric formula is blocking');
  assert.ok(replay.samples.some(row=>row.id===String(child)));
 }
});
test('deleting or restricting a prerequisite never silently retains the advanced skill',()=>{
 const removed={...before,skills:{...before.skills}};
 delete removed.skills['420004001'];
 const restricted=change(420004001,record=>{delete record.classes.CONJURER});
 for(const after of [removed,restricted]){
  const replay=safety.replaySkills(before,after);
  assert.equal(replay.ok,false);
  assert.ok(replay.changedSkills>=2);
  assert.ok(replay.samples.some(row=>row.id==='420004002'));
 }
});
test('replay classification preserves original and selected catalogs',()=>{
 const after=change(420004001,record=>{record.branchRaw='UNKNOWN_SOURCE'});
 const original=JSON.stringify(before),candidate=JSON.stringify(after);
 safety.compatibility(before,after);safety.replaySkills(before,after);
 assert.equal(JSON.stringify(before),original);
 assert.equal(JSON.stringify(after),candidate);
});
