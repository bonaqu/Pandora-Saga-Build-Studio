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

test('reconcile removes stale Souls from unwearable or unsocketed item types',()=>{
 const current={
  equipment:{0:{id:100},3:{id:200},8:{id:300},11:{id:400}},
  souls:{0:[{id:1}],3:[{id:2},{id:3},{id:4}],
   8:[{id:2}],11:[{id:5}]},soulOwners:{}
 };
 const items={100:{slot:'weapon',soulslot:1},200:{slot:'body',soulslot:0},
  300:{slot:'ring',soulslot:3},400:{slot:'belt'}};
 const souls={1:{slots:['weapon']},2:{slots:['body']},3:{slots:['body']},
  4:{slots:['body']},5:{slots:['belt']}};
 assert.equal(p.reconcileSoulOwnership(current,items,souls),true);
 assert.equal(current.souls[3],undefined);
 assert.equal(current.souls[8],undefined);
 assert.equal(current.souls[11],undefined);
 assert.equal(current.souls[0][0].id,1);
 assert.equal(current.soulOwners[0],'100');
});
test('old saved Soul ownership mismatch never migrates to a newly equipped item',()=>{
 const current={equipment:{0:{id:201}},souls:{0:[{id:1}]},
  soulOwners:{0:'200'}};
 const items={201:{slot:'weapon',soulslot:2}};
 const souls={1:{slots:['weapon']}};
 assert.equal(p.reconcileSoulOwnership(current,items,souls),true);
 assert.equal(current.souls[0],undefined);
 assert.equal(current.soulOwners[0],undefined);
});
test('legacy excessive Souls are not truncated onto a smaller new item',()=>{
 const current={equipment:{3:{id:201}},souls:{3:[{id:1},{id:2},{id:3}]},
  soulOwners:{}};
 const items={201:{slot:'body',soulslot:1}};
 const souls={1:{slots:['body']},2:{slots:['body']},3:{slots:['body']}};
 p.reconcileSoulOwnership(current,items,souls);
 assert.equal(current.souls[3],undefined);
});

test('one Soul in a high-index slot is invalid after reducing socket capacity',()=>{
 const state={
  equipment:{0:{id:502}},souls:{0:[null,null,{id:7}]},soulOwners:{}
 };
 const equipment={502:{slot:'weapon',soulslot:1}};
 const souls={7:{slots:['weapon']}};
 assert.equal(p.socketReport(state.souls[0],1).excess,1);
 assert.equal(p.reconcileSoulOwnership(state,equipment,souls),true);
 assert.equal(state.souls[0],undefined);
 assert.equal(state.soulOwners[0],undefined);
});
test('a sparse Soul array within actual socket limits retains slot placement',()=>{
 const state={
  equipment:{0:{id:502}},souls:{0:[null,{id:7}]},soulOwners:{}
 };
 const equipment={502:{slot:'weapon',soulslot:2}};
 const souls={7:{slots:['weapon']}};
 assert.equal(p.reconcileSoulOwnership(state,equipment,souls),true);
 assert.equal(state.souls[0][1].id,7);
 assert.equal(state.soulOwners[0],'502');
});
