import test from 'node:test';
import assert from 'node:assert/strict';
import '../ui-planner.js';

const ui=globalThis.PandoraUIPlanner;
test('separate portrait variants permit gender selection; single variant locks it',()=>{
 const races=[['Human','Human','human_f','human_m'],['Elf','Elf','elf_f','elf_m'],
  ['Dwarf','Dwarf','dwarf','dwarf'],['Myrine','Myrine','myrine','myrine']];
 assert.equal(ui.raceHasGender(races,0),true);
 assert.equal(ui.raceHasGender(races,1),true);
 assert.equal(ui.raceHasGender(races,2),false);
 assert.equal(ui.raceHasGender(races,3),false);
 assert.equal(ui.normalizeGender(races,0,1),1);
 assert.equal(ui.normalizeGender(races,2,1),0);
 assert.equal(ui.normalizeGender(races,0,9),0);
});
test('in-portrait picker includes only allowed, slot-matching, non-decorative equipment',()=>{
 const records=[
  {id:1,slot:'weapon',level:1},{id:2,slot:'weapon',level:99},
  {id:3,slot:'head',level:1},{id:4,slot:'weapon',isCostumeOverlay:true},
  {id:5,slot:'weapon',kind:'DECO_OUTFIT'},
  {id:6,slot:'weapon',level:20}];
 const check=(rec,{level})=>({allowed:rec.level<=level});
 assert.deepEqual(ui.equippable(records,'weapon','CLERIC',50,check).map(r=>r.id),[1,6]);
 assert.deepEqual(ui.equippable(records,'head','CLERIC',50,check).map(r=>r.id),[3]);
});
