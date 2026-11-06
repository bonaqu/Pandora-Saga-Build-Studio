import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};
vm.runInNewContext(readFileSync(new URL('../pandora-studio-equipment-plan.js',import.meta.url),'utf8'),ctx);
const p=ctx.window.PandoraEquipmentPlan;
test('old one-soul build remains readable',()=>assert.equal(p.asSocketArray({id:101}).length,1));
test('actual 0,1,2,3 socket counts are respected',()=>{for(const n of [0,1,2,3])assert.equal(p.socketCapacity({soulslot:n}),n)});
test('changing to fewer sockets preserves but flags extra soul',()=>assert.equal(p.socketReport([{id:1},{id:2}],1).excess,1));
test('soul placement checks published compatible types',()=>{assert.equal(p.validSoul({slots:['weapon']},'weapon'),true);assert.equal(p.validSoul({slots:['weapon']},'head'),false)});
test('upgrade plans are bound to item ID, not slot alone',()=>{const plans={'0:22':6,'0:23':2};assert.equal(p.refinementValue(plans,0,{id:22}),6);assert.equal(p.refinementValue(plans,0,{id:23}),2)});

test('souls are available in belts but not other jewelry or cloaks',()=>{
 for(const slot of ['cloak','ring','neck','ear'])assert.equal(p.validSoul({slots:[slot]},slot),false);
 assert.equal(p.validSoul({slots:['belt']},'belt'),true);
 assert.equal(p.canSocket('cloak',{slot:'cloak',soulslot:3}),false);
 assert.equal(p.canSocket('belt',{slot:'belt',soulslot:2}),true);
});

test('replacing a weapon clears its Souls instead of carrying them to the new weapon',()=>{
 const state={equipment:{0:{id:22},11:{id:32}},souls:{0:[{id:1001}],11:[{id:2002}]}};
 const before={...state.equipment};
 state.equipment[0]={id:23};
 assert.deepEqual(Array.from(p.clearChangedEquipmentSouls(state,before)),['0']);
 assert.equal(state.souls[0],undefined);
 assert.equal(state.souls[11][0].id,2002,'Other gear retains its own Soul');
});
test('equipping the same item again preserves its Souls',()=>{
 const state={equipment:{0:{id:22}},souls:{0:[{id:1001}]}};
 const before={...state.equipment};
 state.equipment[0]={id:'22'};
 assert.deepEqual(Array.from(p.clearChangedEquipmentSouls(state,before)),[]);
 assert.equal(state.souls[0][0].id,1001);
});
test('removing an item clears its Souls, including a two-slot outfit displacement',()=>{
 const state={equipment:{3:{id:12616},5:{id:24}},souls:{3:[{id:1001}],5:[{id:2002}]}};
 const before={...state.equipment};
 state.displacedLegwear=state.equipment[5];
 delete state.equipment[5];
 p.clearChangedEquipmentSouls(state,before);
 assert.equal(state.souls[5],undefined);
 assert.equal(state.souls[3][0].id,1001);
 const next={...state.equipment};
 delete state.equipment[3];
 state.equipment[5]=state.displacedLegwear;
 p.clearChangedEquipmentSouls(state,next);
 assert.equal(state.souls[3],undefined);
 assert.equal(state.souls[5],undefined,'Restored pants must not inherit stale Souls');
});
