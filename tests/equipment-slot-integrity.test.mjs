import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const items=JSON.parse(read('data/os/items.json'));
const host={};
Function('window',read('rules.js'))(host);
Function('window',read('ui-planner.js'))(host);
Function('window',read('equipment-plan.js'))(host);
const slots=['weapon','shield','head','body','gloves','legs','feet','cloak',
 'ring','ring','neck','belt','ear','ear'];
function dynamicIssue(state){
 const source=read('app.js');
 const from=source.indexOf('function equipmentIssue(');
 const to=source.indexOf('\nfunction trainedBranchMasteries(',from);
 assert.ok(from>=0&&to>from);
 return Function('window','state','catalog','jobKeys','slotKeys',
  source.slice(from,to)+'\nreturn equipmentIssue;')(
   host,state,{equipment:items},['WARRIOR'],slots);
}
test('untrusted saved slot IDs cannot forge an equipped item or grant bonuses',()=>{
 const plan=host.PandoraEquipmentPlan;
 assert.equal(plan.matchesEquipmentSlot(2,items[11094],slots),true);
 assert.equal(plan.matchesEquipmentSlot(14,items[11094],slots),false);
 assert.equal(plan.matchesEquipmentSlot(-1,items[11094],slots),false);
 assert.equal(plan.matchesEquipmentSlot(NaN,items[11094],slots),false);
 assert.equal(plan.matchesEquipmentSlot(0,items[17001],slots),false);
 assert.equal(plan.matchesEquipmentSlot(2,items[50001],slots),false);
 const state={job:0,race:1,gender:0,level:40,equipment:{
  0:{id:401},1:{id:17001},2:{id:11094},14:{id:11094}
 }};
 const issue=dynamicIssue(state);
 assert.deepEqual(issue(items[11094],2),[]);
 assert.deepEqual(issue(items[11094],14),['Предмет не подходит этому слоту']);
 assert.deepEqual(issue(items[17001],0),['Предмет не подходит этому слоту']);
 assert.deepEqual(issue(items[50001],2),['Предмет не подходит этому слоту']);
 assert.ok(issue(items[17001],1).includes('Двуручное оружие занимает обе руки'));
 assert.ok(issue(items[422],0).some(x=>x.includes('53')));
 state.level=55;
 assert.deepEqual(issue(items[422],0),[]);
});
test('stats, soul and gem aggregators ignore corrupted slots while local data stays intact',()=>{
 const app=read('app.js');
 assert.match(app,/if\(!item\|\|equipmentIssue\(item,Number\(slot\)\)\.length\)continue/);
 assert.match(app,/PandoraEquipmentPlan\.matchesEquipmentSlot\(Number\(slot\),/);
 assert.match(app,/records\.push\(\['item:'\+item\.id,item,grade\]\)/);
 assert.match(app,/if\(soul&&window\.PandoraEquipmentPlan\.validSoul/);
 assert.match(app,/state\.equipment\[selectedSlot\]=\{id:rec\.id/);
});
