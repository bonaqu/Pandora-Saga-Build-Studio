import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const load=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};vm.runInNewContext(load('pandora-studio-equipment-plan.js'),host);
const P=host.PandoraEquipmentPlan;
const legs={id:13041,slot:'legs',soulslot:1},belt={id:21001,slot:'belt',soulslot:0};

test('catalog remains authoritative default while selected physical copy has own capacity',()=>{
 const state={socketCapacities:{'5:13041':2,'11:21001':1}};
 assert.equal(P.socketCapacity(legs),1);
 assert.equal(P.socketCapacity(belt),0);
 assert.equal(P.equippedSocketCapacity(state,5,{id:13041},legs),2);
 assert.equal(P.equippedSocketCapacity(state,11,{id:21001},belt),1);
 assert.equal(P.equippedSocketCapacity({},5,{id:13041},legs),1);
 assert.equal(P.equippedSocketCapacity({},11,{id:21001},belt),0);
 assert.equal(P.canSocket('belt',belt,1),true);
 assert.equal(P.canSocket('belt',belt,0),false);
 assert.equal(P.socketCapacity(legs,5),1);
 assert.equal(P.socketCapacity(legs,'2'),1);
 assert.equal(P.socketCapacity(legs,-1),1);
 assert.equal(P.socketCapacity({slot:'ear',soulslot:0},2),0);
 assert.equal(P.canSocket('ear',{slot:'ear',soulslot:0},2),false);
});
test('capacity is tied to slot AND item ID, not accidentally copied to replacement gear',()=>{
 const state={socketCapacities:{'5:13041':2,'11:21001':1}};
 const other={id:13042,slot:'legs',soulslot:1};
 assert.equal(P.equippedSocketCapacity(state,5,{id:13042},other),1);
 assert.equal(P.equippedSocketCapacity(state,3,{id:13041},legs),1);
 assert.equal(P.equippedSocketCapacity(state,5,{id:13041},legs),2);
});
test('two real Souls remain in 2-slot equipped leggings even if catalog snapshot says one',()=>{
 const state={equipment:{5:{id:13041},11:{id:21001}},
  socketCapacities:{'5:13041':2,'11:21001':1},
  souls:{5:[{id:201},{id:202}],11:[{id:203}]},
  soulOwners:{5:'13041',11:'21001'}};
 const catalog={'13041':legs,'21001':belt};
 const souls={'201':{slots:['legs']},'202':{slots:['legs']},'203':{slots:['belt']}};
 assert.equal(P.reconcileSoulOwnership(state,catalog,souls),false);
 assert.equal(state.souls[5].length,2);
 assert.equal(state.souls[11].length,1);
 assert.equal(P.socketReport(state.souls[5],P.equippedSocketCapacity(
  state,5,state.equipment[5],legs)).excess,0);
});
test('valid excess Souls survive a catalog capacity mismatch but remain inactive',()=>{
 const state={equipment:{5:{id:13041}},souls:{5:[{id:201},{id:202}]},
  soulOwners:{5:'13041'},socketCapacities:{}};
 const source={'13041':legs},souls={'201':{slots:['legs']},'202':{slots:['legs']}};
 const original=JSON.stringify(state.souls);
 assert.equal(P.reconcileSoulOwnership(state,source,souls),false);
 assert.equal(JSON.stringify(state.souls),original,'No Soul may disappear');
 const report=P.socketReport(state.souls[5],P.equippedSocketCapacity(
  state,5,state.equipment[5],legs));
 assert.equal(report.count,2);assert.equal(report.excess,1);
 // Combat calculation uses only the configured capacity; second Soul is
 // preserved in the snapshot but not included as an effective modifier.
 assert.equal(P.asSocketArray(state.souls[5]).slice(report.capacity).length,1);
 state.socketCapacities['5:13041']=2;
 assert.equal(P.reconcileSoulOwnership(state,source,souls),false);
 assert.equal(P.socketReport(state.souls[5],P.equippedSocketCapacity(
  state,5,state.equipment[5],legs)).excess,0);
 assert.equal(state.souls[5][1].id,202);
});

test('legacy ownerless Souls over the default can be recovered after choosing copy capacity',()=>{
 const state={equipment:{5:{id:13041}},souls:{5:[{id:201},{id:202}]},soulOwners:{}};
 const catalog={'13041':legs},souls={'201':{slots:['legs']},'202':{slots:['legs']}};
 assert.equal(P.reconcileSoulOwnership(state,catalog,souls),true,
  'Restore a verified per-item ownership marker only');
 assert.equal(state.soulOwners[5],'13041');
 assert.equal(state.souls[5].length,2);
 assert.equal(P.reconcileSoulOwnership(state,catalog,souls),false,'Second refresh is stable');
});

test('changing gear ID or inserting incompatible Soul still rejects stale ownership',()=>{
 const mismatch={equipment:{5:{id:13041}},souls:{5:[{id:201},{id:202}]},
  soulOwners:{5:'13042'}};
 assert.equal(P.reconcileSoulOwnership(mismatch,{'13041':legs},
  {'201':{slots:['legs']},'202':{slots:['legs']}}),true);
 assert.equal(mismatch.souls[5],undefined);
 const incompatible={equipment:{5:{id:13041}},souls:{5:[{id:201}]},
  soulOwners:{5:'13041'}};
 assert.equal(P.reconcileSoulOwnership(incompatible,{'13041':legs},
  {'201':{slots:['weapon']}}),true);
 assert.equal(incompatible.souls[5],undefined);
});
test('app uses effective capacity in calculations, picker, tooltip and save-link recovery',()=>{
 const app=load('pandora-studio-app.js');
 for(const needle of [
  'socketCapacities:{}',
  'socketCapacities:{...base.socketCapacities,...raw.socketCapacities}',
  'equippedSocketCapacity(snap,Number(slot),selection,item)',
  'equippedSocketCapacity(state,sourceSlot,item,source)',
  'equippedSocketCapacity(state,selectedSlot,equipped,record)',
  'safe.socketCapacities[key]=value',
  'capacity:cap,tables:gameTables',
  'updateSocketCapacity:n=>',
  '.slice(0,plan.equippedSocketCapacity(state,Number(slot),entry,rec)??0)'
 ])assert.ok(app.includes(needle),'Missing socket-capacity integration: '+needle);
 const ui=load('pandora-studio-equipment-ui.js');
 assert.match(ui,/data-socket-capacity/);
 assert.match(ui,/context\?\.capacity\?\?record\.soulslot/);
 assert.match(app,/positions\.slice\(n\)\.some\(Boolean\)/);
});
test('A/B comparison can show changed effective sockets on same selected item',()=>{
 const cmp={};vm.runInNewContext(load('pandora-studio-build-comparison.js'),cmp);
 const A={equipment:{5:{id:13041}},socketCapacities:{'5:13041':2}};
 const B={equipment:{5:{id:13041}},socketCapacities:{'5:13041':1}};
 const rows=cmp.PandoraBuildComparison.matrixRows(A,B,{
  equipment:{'13041':legs},socketCapacity:(snap,i,item)=>item&&i===5?
   P.equippedSocketCapacity(snap,i,item,legs):null
 });
 const item=rows.find(row=>row.key==='socketCapacity.5');
 assert.ok(item);
 assert.equal(item.a,'2');
 assert.equal(item.b,'1');
 assert.equal(item.delta,'-1');
 assert.equal(rows.some(row=>row.key==='socketCapacity.8'),false);
});
