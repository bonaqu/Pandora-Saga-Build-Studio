import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const items=Object.values(JSON.parse(read('data/os/items.json')));
const sandbox={window:{}};
vm.runInNewContext(read('ui-planner.js'),sandbox);
vm.runInNewContext(read('rules.js'),sandbox);
const planner=sandbox.window.PandoraUIPlanner;
const rules=sandbox.window.PandoraStudioRules;

test('all known race-specific and Astir outfits have an explicit wearable audience',()=>{
 const racial=items.filter(item=>item.slot&&/для (?:человека|эльфа|эльфийки|цверга|мирины|энкиду|кролля)|астирск/i.test(item.name));
 assert.equal(racial.length,128);
 for(const item of racial){
  const audience=planner.outfitWearers(item);
  assert.ok(audience?.length,'Missing wearer mapping for '+item.name);
  assert.ok(audience.includes('Кролль'),'Kroll exception lost for '+item.name);
  assert.ok(planner.raceCompatible(item,5,0),'Kroll unable to use '+item.name);
 }
});
test('explicit gender-specific human and elf outfits never cross gender or race',()=>{
 let checked=0;
 for(const item of items){
  const m=item.name.match(/для (человека|эльфа|эльфийки).*?\(([МЖ])\)/i);
  if(!m)continue;
  const race=m[1]==='человека'?0:1,sex=m[2]==='М'?1:0;
  assert.ok(planner.raceCompatible(item,race,sex),item.name);
  assert.equal(planner.raceCompatible(item,race,1-sex),false,item.name);
  assert.equal(planner.raceCompatible(item,race===0?1:0,sex),false,item.name);
  checked++;
 }
 assert.ok(checked>=20);
});
test('Myrine female and Enkidu male costume families are kept distinct',()=>{
 for(const item of items){
  if(/для мирины/i.test(item.name)){
   assert.equal(planner.raceCompatible(item,3,0),true,item.name);
   assert.equal(planner.raceCompatible(item,4,0),false,item.name);
  }
  if(/для энкиду/i.test(item.name)){
   assert.equal(planner.raceCompatible(item,4,0),true,item.name);
   assert.equal(planner.raceCompatible(item,3,0),false,item.name);
  }
 }
});
test('level 55 catalog contains all real wearable gear; class and level gates remain enforced',()=>{
 const gear=items.filter(row=>row.slot&&!String(row.kind||'').startsWith('DECO_')&&row.isCostumeOverlay!==true);
 assert.ok(gear.length>=500);
 assert.ok(gear.every(row=>Number(row.level)<=55));
 const restricted=gear.find(row=>Object.keys(row.classes||{}).length>0&&Object.keys(row.classes||{}).length<28);
 assert.ok(restricted);
 const correctClass=Object.keys(restricted.classes)[0];
 assert.equal(rules.equipment(restricted,{job:correctClass,slot:restricted.slot,level:55}).allowed,true);
 const wrongClass=['WARRIOR','SCOUT','MAGE','ACOLYTE'].find(key=>!Object.hasOwn(restricted.classes,key));
 assert.ok(wrongClass);
 assert.equal(rules.equipment(restricted,{job:wrongClass,slot:restricted.slot,level:55}).allowed,false);
 assert.equal(rules.equipment(restricted,{job:correctClass,slot:restricted.slot,level:1}).allowed,Number(restricted.level)<=1);
});
