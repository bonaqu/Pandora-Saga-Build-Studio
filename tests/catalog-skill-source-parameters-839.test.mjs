import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const host={};
for(const file of ['pandora-os-character-calculator.js',
 'pandora-studio-attribute-progression.js','pandora-studio-skill-progression.js',
 'pandora-studio-catalog-safety.js'])vm.runInNewContext(read(file),{window:host});
const safety=host.PandoraCatalogSafety;
const data=x=>JSON.parse(read('data/os/'+x+'.json'));
const before={classes:data('classes'),tables:data('tables'),skills:data('skills'),
 items:data('items')};
function change(id,update){
 const after={...before,skills:{...before.skills,
  [id]:structuredClone(before.skills[id])}};
 update(after.skills[id]);return {after,report:safety.compatibility(before,after)};
}
const id='233001001';
test('source-only cost/timing/range/AOE are separated from unknown EP damage',()=>{
 for(const fn of [
  s=>{s.mana++},s=>{s.cast+=0.25},s=>{s.cooldown+=0.5},
  s=>{s.motion+=0.25},s=>{s.range+=100},
  s=>{s.aoe[1]+=5}
 ]){
  const {after,report}=change(id,fn);
  assert.equal(report.entries.length,1);
  assert.equal(report.entries[0].kind,'sourceOnly');
  assert.equal(report.entries[0].contract,'skill.source-parameters');
  assert.equal(safety.sourceGraphIntegrity(before,after).ok,true);
 }
});
test('all 571 existing skills can update signed source mana without manual id code',()=>{
 const oldJSON=JSON.stringify(before);
 const after={...before,skills:structuredClone(before.skills)};
 for(const skill of Object.values(after.skills))skill.mana++;
 const report=safety.compatibility(before,after);
 assert.equal(report.entries.length,571);
 assert.equal(report.totals.sourceOnly,571);
 assert.equal(report.totals.needsReview,0);
 assert.equal(report.totals.verified,0);
 assert.ok(report.entries.every(row=>row.contract==='skill.source-parameters'));
 assert.equal(JSON.stringify(before),oldJSON);
});
test('source-only does not bypass independent loss-of-known-model preflight',()=>{
 const {after,report}=change(id,s=>{s.mana++;});
 assert.equal(report.entries[0].kind,'sourceOnly');
 const replay=safety.replaySkills(before,after);
 assert.equal(replay.ok,false,'known source inspector must block lost modeled row');
 assert.ok(replay.lostSourceOnly>0);
 assert.ok(replay.samples.some(row=>row.id===id));
 const wb=read('pandora-os-catalog-workbench.js');
 assert.ok(wb.includes('if(replay&&!replay.ok)throw Error('));
});
test('unknown effect/class/requirement edits may not inherit source-only metadata proof',()=>{
 for(const fn of [
  s=>{s.funcs[0].ep='EP_FUTURE_NOT_MODELED';s.mana++},
  s=>{s.classes.FUTURE=1;s.mana++},
  s=>{s.reqs[0].amount++;s.mana++},
  s=>{s.learnable=!s.learnable;s.mana++},
  s=>{s.futureDamage=999;s.mana++},
  s=>{s.weaponUse=['BOW'];s.mana++}
 ]){
  const row=change(id,fn).report.entries[0];
  assert.equal(row.kind,'needsReview');
  assert.equal(row.contract,undefined);
 }
});
test('malformed, negative, missing and unbounded values fail closed',()=>{
 for(const fn of [
  s=>{s.mana='12'},s=>{s.cast=-1},s=>{s.cooldown=Infinity},
  s=>{s.motion=4000},s=>{s.range=1e8},
  s=>{s.aoe=[-1,2]},s=>{s.aoe=[0,0,0]},
  s=>{s.aoe=['1',0]},s=>{delete s.mana}
 ]){
  const row=change(id,fn).report.entries[0];
  assert.equal(row.kind,'needsReview');
  assert.equal(row.contract,undefined);
 }
});
test('textual metadata stays source-only without a numeric contract',()=>{
 const {report}=change(id,s=>{s.name+=' •';});
 assert.equal(report.totals.sourceOnly,1);
 assert.equal(report.entries[0].contract,undefined);
});
