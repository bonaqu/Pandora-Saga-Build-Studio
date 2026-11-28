import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const original=JSON.stringify(skills);
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const by=(list,id)=>list.find(x=>x.id===id);
const clone=()=>structuredClone(skills);
const buffs=(ranks,selected={combatConcentration:true,combatLunge:true})=>
 C.activeCombatSkills({selected,jobKey:'JUGGERNAUT',level:45,
  weapon:{kind:'1H_SWORD'},skillCatalog:skills,branchMasteries:ranks});
const strike=(ranks={brush:40},catalog=skills,caps=jobs.JUGGERNAUT.branchCaps,level=50)=>
 C.directStrikeCoefficientPreview({skillCatalog:catalog,jobKey:'JUGGERNAUT',level,
  branchMasteries:ranks,branchCaps:caps,weaponKind:'1H_AXE'});
const move=(ranks={warding:70},catalog=skills,caps=jobs.SNIPER.branchCaps,labels={})=>
 C.movementSkillSourcePreview({skillCatalog:catalog,jobKey:'SNIPER',level:45,
  branchMasteries:ranks,branchCaps:caps,branchLabels:labels,englishBranches:labels});
const scaled=(ranks={warding:26},caps=jobs.SNIPER.branchCaps)=>
 C.scalingSkillPreview({skillCatalog:skills,jobKey:'SNIPER',level:45,
  branchMasteries:ranks,branchCaps:caps,
  stats:{vit:40,str:50,agi:70,dex:50,spi:50,int:50},
  combat:{attack:{walkingBase:200},defense:{directRaw:50},
   dodge:{base:100},accuracy:{base:100}}});
const chain=(ranks={trap:41},catalog=skills,caps=jobs.AGENT.branchCaps,level=55)=>
 C.skillExecutionChains({skillCatalog:catalog,jobKey:'AGENT',level,
  branchMasteries:ranks,branchCaps:caps,weaponKind:'BARE_HAND'});

test('active learnable concentration accepts trained number, not coerced ranks',()=>{
 assert.equal(buffs({slash:26}).concentration,true);
 assert.equal(buffs({slash:26}).lunge,true);
 for(const wrong of ['26',true,[26],{value:26},null,NaN,-1]){
  const active=buffs({slash:wrong});
  assert.equal(active.concentration,false,'forged trained slash: '+String(wrong));
  assert.equal(active.lunge,true,'unrelated valid skill remains');
 }
});
test('strike coefficients use raw numeric rank rather than JavaScript Number coercion',()=>{
 assert.equal(by(strike(),142002001)?.coefficientModels[0].amount,20);
 for(const wrong of ['40',true,[40],{value:40},null,NaN,-1]){
  assert.equal(by(strike({brush:wrong}),142002001),undefined,
   'invalid rank '+String(wrong));
  assert.ok(by(strike({brush:wrong}),100102001),
   'unrelated unranked valid source not discarded');
 }
});
test('forged class capacity or source character level excludes the strike model',()=>{
 for(const bad of ['100',true,[100],{},null,0.5]){
  const caps={...jobs.JUGGERNAUT.branchCaps,brush:bad};
  assert.equal(by(strike({brush:40},skills,caps),142002001),undefined);
 }
 for(const bad of ['0',true,{},null,56,-1]){
  const altered=clone();altered['142002001'].charLevel=bad;
  assert.equal(by(strike({brush:40},altered),142002001),undefined);
 }
 for(const field of ['funcs','weaponUse']){
  const altered=clone();altered['142002001'][field]='1H_AXE';
  assert.equal(by(strike({brush:40},altered),142002001),undefined);
 }
});
test('impossible forged advanced strike cannot hide its valid predecessor',()=>{
 const baseline=C.directStrikeCoefficientPreview({
  skillCatalog:skills,jobKey:'JUGGERNAUT',level:50,
  branchMasteries:{slash:71},branchCaps:jobs.JUGGERNAUT.branchCaps,
  weaponKind:'1H_SWORD'});
 assert.equal(by(baseline,110101001),undefined);
 assert.ok(by(baseline,110101002));
 for(const bad of ['71',true,[71],{},null]){
  const rows=C.directStrikeCoefficientPreview({
   skillCatalog:skills,jobKey:'JUGGERNAUT',level:50,
   branchMasteries:{slash:bad},branchCaps:jobs.JUGGERNAUT.branchCaps,
   weaponKind:'1H_SWORD'});
  assert.equal(by(rows,110101002),undefined);
  assert.equal(by(rows,110101001),undefined,
   'Malformed current-mastery cannot manufacture any successor coefficient');
 }
});
test('movement source magnitude survives invalid rank but is not shown as usable',()=>{
 const genuine=by(move(),260003001);
 assert.equal(genuine?.amount,200);
 assert.equal(genuine?.available,true);
 for(const wrong of ['70',true,[70],{},null,NaN,-1]){
  const row=by(move({warding:wrong}),260003001);
  assert.equal(row?.amount,200);
  assert.equal(row.available,false,'forged warding '+String(wrong));
  assert.equal(by(move({warding:wrong}),320004001)?.recipient,true,
   'external Wind Blessing is recipient-neutral');
 }
});
test('movement requires exact numeric source cap and still degrades gracefully for missing locale labels',()=>{
 for(const wrong of ['100',true,[100],{},0.5]){
  const caps={...jobs.SNIPER.branchCaps,warding:wrong};
  assert.equal(by(move({warding:70},skills,caps),260003001),undefined);
 }
 const locked=by(move({warding:0},skills,jobs.SNIPER.branchCaps,null),260003001);
 assert.equal(locked?.available,false);
 assert.match(locked.reason,/warding/);
 assert.match(locked.reasonEn,/warding/);
});
test('scaling source-only projections cannot mark forged trained-rank effects available',()=>{
 const valid=by(scaled({warding:26}).defense,260007001);
 assert.equal(valid?.amount,15);
 assert.equal(valid?.available,true);
 for(const bad of ['26',true,[26],{},null,NaN,-1]){
  const r=by(scaled({warding:bad}).defense,260007001);
  assert.notEqual(r?.available,true,'forged rank '+String(bad));
 }
});
test('linked trap graph loses requirementsMet on nonnumeric mastery, preserves its graph',()=>{
 const originalRow=by(chain().rows,240005001);
 assert.deepEqual(originalRow?.paths,[[240005001,240005002,240005003]]);
 assert.equal(originalRow.requirementsMet,true);
 for(const bad of ['41',true,[41],{},null,NaN,-1]){
  const r=by(chain({trap:bad}).rows,240005001);
  assert.deepEqual(r?.paths,originalRow.paths);
  assert.equal(r.requirementsMet,false,'forged mastery '+String(bad));
 }
});
test('execution graph rejects malformed class caps and source levels without breaking other skills',()=>{
 for(const bad of ['50',true,[50],{},null,45.5]){
  const caps={...jobs.AGENT.branchCaps,trap:bad};
  assert.equal(by(chain({trap:41},skills,caps).rows,240005001),undefined);
 }
 for(const bad of ['0',true,{},null,56,-1]){
  const altered=clone();altered['240005001'].charLevel=bad;
  assert.equal(by(chain({trap:41},altered).rows,240005001),undefined);
 }
});
test('28 class × 55 level valid source previews stay sourced and no final target damage is invented',()=>{
 let compared=0;
 for(const [job,info] of Object.entries(jobs)){
  for(let level=1;level<=55;level++){
   const rows=C.directStrikeCoefficientPreview({
    skillCatalog:skills,jobKey:job,level,
    branchCaps:info.branchCaps,branchMasteries:info.branchCaps,
    weaponKind:'1H_SWORD'});
   for(const hit of rows){
    assert.equal(skills[String(hit.id)].classes[job],1);
    assert.equal(hit.amount,null);
    assert.equal(hit.uncertain,true);
    assert.equal(hit.coefficientModels?.[0]?.confidence,'coefficient-model');
   }
   compared++;
  }
 }
 assert.equal(compared,1540);
 assert.equal(JSON.stringify(skills),original);
});
