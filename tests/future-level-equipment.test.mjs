import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const items=JSON.parse(read('data/os/items.json'));
const scope={};
Function('window',read('rules.js'))(scope);
Function('window',read('ui-planner.js'))(scope);
const rules=scope.PandoraStudioRules,planner=scope.PandoraUIPlanner;

test('all ten future planning levels 46–55 retain source-defined gear records',()=>{
 const future=Object.values(items).filter(x=>
  Number.isInteger(x.level)&&x.level>=46&&x.level<=55);
 assert.ok(future.length>=35,'never strip preloaded future gear for the temporary server cap 45');
 assert.deepEqual([...new Set(future.map(x=>x.level))].sort((a,b)=>a-b),
  [46,47,48,49,50,51,52,53,54,55]);
});

test('future items remain locked at 45 but fully selectable at their true level',()=>{
 for(const id of [231,422,17041]){
  const item=items[id];
  assert.ok(item&&item.level>45&&item.level<=55);
  const job=Object.keys(item.classes||{})[0],slot=item.slot;
  assert.ok(job);
  assert.equal(rules.equipment(item,{job,slot,level:45}).allowed,false);
  assert.equal(rules.equipment(item,{job,slot,level:item.level}).allowed,true);
  assert.equal(planner.equippable([item],slot,job,45,(item,ctx)=>
   rules.equipment(item,ctx)).length,0);
  assert.deepEqual(planner.equippable([item],slot,job,item.level,(item,ctx)=>
   rules.equipment(item,ctx)).map(x=>x.id),[id]);
 }
});

test('a new blank build starts at level 1 while maximum planning remains 55',()=>{
 const app=read('app.js'),html=read('index.html');
 assert.match(app,/function fresh\(\)\{return\{[^\\n]*level:1/);
 assert.match(html,/id="level" type="range" min="1" max="55" value="1"/);
 assert.doesNotMatch(html,/id="level"[^>]+max="45"/);
});
