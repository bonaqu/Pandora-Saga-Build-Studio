import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('rules.js'))(host);
Function('window',read('ui-planner.js'))(host);
const items=JSON.parse(read('data/os/items.json'));
const P=host.PandoraUIPlanner,R=host.PandoraStudioRules;
test('at level 1, planning picker includes eligible future 53 sword but not level-56 item',()=>{
 const records=[items[1],items[422],items[17001],{
  id:999998,kind:'2H_SWORD',slot:'weapon',level:56,classes:{WARRIOR:1}
 }];
 const current=P.equippable(records,'weapon','WARRIOR',1,R.equipment);
 assert.deepEqual(current,[]);
 const planning=P.planningEquippable(records,'weapon','WARRIOR',1,R.equipment);
 assert.deepEqual(planning.map(i=>i.id),[1,422]);
 assert.equal(P.planningEquippable(records,'weapon','MAGE',1,R.equipment).length,0);
 assert.equal(P.planningEquippable(records,'weapon','WARRIOR',0,R.equipment).length,0);
 assert.equal(P.planningEquippable(records,'weapon','WARRIOR',56,R.equipment).length,0);
});
test('future selection is distinct from actual equipment eligibility and persists for later use',()=>{
 const future=items[422];
 assert.equal(R.equipment(future,{slot:'weapon',job:'WARRIOR',level:45}).allowed,false);
 assert.equal(R.equipment(future,{slot:'weapon',job:'WARRIOR',level:53}).allowed,true);
 const app=read('app.js');
 assert.match(app,/PandoraUIPlanner\.planningEquippable/);
 assert.match(app,/future=Number\(rec\.level\)>state\.level/);
 assert.match(app,/Будет доступен с /);
 assert.match(app,/stage-picker-future/);
 assert.match(app,/state\.equipment\[selectedSlot\]=\{id:rec\.id/);
 assert.match(app,/if\(!item\|\|equipmentIssue\(item,Number\(slot\)\)\.length\)continue/);
});
test('future equipment cannot bypass originating job or ornamental restrictions',()=>{
 const deco={id:90,slot:'weapon',level:50,kind:'DECO_SKIN',classes:{WARRIOR:1}};
 assert.deepEqual(P.planningEquippable([deco],'weapon','WARRIOR',45,R.equipment),[]);
 const item={...items[422],classes:{ARCHER:1}};
 assert.deepEqual(P.planningEquippable([item],'weapon','WARRIOR',45,R.equipment),[]);
});
