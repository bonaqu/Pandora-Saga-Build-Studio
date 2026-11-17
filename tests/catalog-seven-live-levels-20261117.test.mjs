import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const items=JSON.parse(read('data/os/items.json'));
const expected={
 19010:['Магическое кольцо','ring'],
 19011:['Кольцо поединка','ring'],
 20027:['Священные четки','neck'],
 20028:['Ожерелье войны','neck'],
 21019:['Пояс пророка','belt'],
 21020:['Пояс души','belt'],
 22022:['Украшение тишины','ear']
};
const host={};
Function('window',read('pandora-studio-equipment-rules.js'))(host);
Function('window',read('pandora-studio-ui-planner.js'))(host);
const rules=host.PandoraStudioRules,planner=host.PandoraUIPlanner;

test('seven live API-confirmed item requirements now use level 50 in the archive',()=>{
 for(const [key,[name,slot]]of Object.entries(expected)){
  const item=items[key];
  assert.ok(item);
  assert.equal(item.id,Number(key));
  assert.equal(item.name,name);
  assert.equal(item.slot,slot);
  assert.equal(item.level,50);
  assert.equal(item.classes.WARRIOR,1);
  assert.ok(Array.isArray(item.effects),'no effect payloads were dropped');
 }
 assert.equal(Object.keys(expected).length,7);
});

test('level 49 still blocks and level 50 unlocks all seven items; no early boosts',()=>{
 for(const key of Object.keys(expected)){
  const item=items[key],slot=item.slot,job='WARRIOR';
  assert.equal(rules.equipment(item,{slot,job,level:49}).allowed,false,
   'source-gated item '+key+' cannot apply a bonus at 49');
  assert.equal(rules.equipment(item,{slot,job,level:50}).allowed,true,
   'current source item '+key+' must activate at 50');
  assert.equal(planner.equippable([item],slot,job,49,(obj,ctx)=>
   rules.equipment(obj,ctx)).length,0);
  assert.deepEqual(planner.equippable([item],slot,job,50,(obj,ctx)=>
   rules.equipment(obj,ctx)).map(obj=>obj.id),[item.id]);
 }
});

test('archive keeps normal future planning 55 and all 1,140 item IDs',()=>{
 assert.equal(Object.keys(items).length,1140);
 assert.ok(Object.values(items).some(item=>item.level===55));
 assert.match(read('index.html'),/id="level" type="range" min="1" max="55" value="1"/);
 const set=new Set(Object.keys(expected).map(Number));
 assert.equal([...set].length,7);
});
