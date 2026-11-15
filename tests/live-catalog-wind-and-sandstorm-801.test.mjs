import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const live=JSON.parse(read('data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96/skills.json'));
const older=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/catalog-review/ps-ca9a604163b54a2da5c83ea55077ef96/classes.json'));
const preview=(skills,ranks=classes.CONJURER.branchCaps)=>C.scalingSkillPreview({
 skillCatalog:skills,jobKey:'CONJURER',level:55,
 branchMasteries:ranks,branchCaps:classes.CONJURER.branchCaps,
 stats:{vit:80,str:100,agi:75,dex:70,spi:100,int:110},
 combat:{attack:{walkingBase:200},defense:{directRaw:100},
  accuracy:{base:140},dodge:{base:120}}
});

test('new 50+ Wind Trail provides two separate source-only models without changing hero totals',()=>{
 const before=JSON.stringify(live);
 const oldRow=preview(older).defense.find(x=>x.id===420004002);
 const liveRow=preview(live).defense.find(x=>x.id===420004002);
 assert.ok(oldRow,'Old current-OS vector must remain supported');
 assert.ok(liveRow,'Published D1 50+ variant must remain supported');
 const oldModels=oldRow.coefficientModels.map(x=>x.ep);
 const newModels=liveRow.coefficientModels.map(x=>x.ep);
 assert.ok(oldModels.includes('EP_CASTINGCANCEL_RESISTANCE_CONST'));
 assert.ok(!oldModels.includes('EP_ALL_RESISTANCE_CONST'));
 assert.deepEqual(newModels,[
  'EP_CASTINGCANCEL_RESISTANCE_CONST','EP_ALL_RESISTANCE_CONST'
 ]);
 const extra=liveRow.coefficientModels.find(x=>x.ep==='EP_ALL_RESISTANCE_CONST');
 assert.equal(extra.amount,1+Math.floor(100*.11));
 assert.equal(extra.confidence,'coefficient-model');
 assert.equal(liveRow.modelOnly,true);
 assert.equal(liveRow.uncertain,true);
 assert.equal(JSON.stringify(live),before,'No changes to the D1 snapshot data');
});

test('Wind Trail rejects unknown new effects and altered activation timing',()=>{
 const baseline=preview(live).defense.find(x=>x.id===420004002);
 assert.ok(baseline?.coefficientModels.some(x=>x.ep==='EP_ALL_RESISTANCE_CONST'));
 for(const change of [
  record=>record.cast=5,
  record=>record.cooldown=2,
  record=>record.funcs[1].fv1[0]=12,
  record=>record.funcs[1].fv2[0]=1,
  record=>record.funcs.push(structuredClone(record.funcs[1]))
 ]){
  const wrong=structuredClone(live);
  change(wrong[420004002]);
  const modified=preview(wrong).defense.find(x=>x.id===420004002);
  assert.equal(modified?.coefficientModels.some(x=>x.ep==='EP_ALL_RESISTANCE_CONST'),
   false,'Invalid source must not show an invented second resistance');
 }
});

test('new Sandstorm is an OS skill execution chain, not a claimed damage formula',()=>{
 const result=C.skillExecutionChains({
  skillCatalog:live,jobKey:'CONJURER',level:55,
  branchCaps:classes.CONJURER.branchCaps,
  branchMasteries:classes.CONJURER.branchCaps
 });
 const sandstorm=result.rows.find(x=>x.id===420007101);
 assert.ok(sandstorm,'New learnable skill should be discoverable');
 assert.deepEqual(sandstorm.paths,[[420007101,420007102]]);
 assert.equal(sandstorm.sourceOnly,true);
 assert.equal(sandstorm.trigger,'cast');
 assert.equal(sandstorm.requirementsMet,true);
 assert.equal(Object.hasOwn(sandstorm,'finalDamage'),false);
 const zero=C.skillExecutionChains({
  skillCatalog:live,jobKey:'CONJURER',level:55,
  branchCaps:classes.CONJURER.branchCaps,
  branchMasteries:{...classes.CONJURER.branchCaps,embody:0}
 }).rows.find(x=>x.id===420007101);
 assert.ok(zero&&!zero.requirementsMet,'61 Embodiment mastery is still required');
 // 999999999 is an ACTUAL but unrelated internal skill, not a missing
 // ID. Mere catalog existence must never authorize a false Sandstorm link.
 assert.ok(live[999999999]);
 const bad=structuredClone(live);
 bad[420007101].funcs[0].fv1[3]=999999999;
 const options=skillCatalog=>C.skillExecutionChains({
  skillCatalog,jobKey:'CONJURER',level:55,
  branchCaps:classes.CONJURER.branchCaps,
  branchMasteries:classes.CONJURER.branchCaps
 });
 const unrelated=options(bad);
 assert.ok(unrelated.rejected.includes(420007101));
 assert.ok(!unrelated.rows.some(x=>x.id===420007101));
 const absent=structuredClone(live);
 absent[420007101].funcs[0].fv1[3]=987654321;
 assert.ok(options(absent).rejected.includes(420007101),
  'A nonexistent inner skill must also be refused');
 for(const mutate of [
  row=>{row.funcs[0].fv1[0]=121},
  row=>{row.funcs[1].fv2[0]=41},
  row=>{row.funcs[2].ep='EP_UNKNOWN'},
  row=>{row.aoe[0]=501}
 ]){
  const child=structuredClone(live);
  mutate(child[420007102]);
  const check=options(child);
  assert.ok(check.rejected.includes(420007101),
   'Any unapproved inner effect must invalidate the source-only chain');
  assert.ok(!check.rows.some(x=>x.id===420007101));
 }
});
