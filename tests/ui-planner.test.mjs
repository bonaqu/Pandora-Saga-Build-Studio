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
test('source-backed human/elf tailored sets exclude wrong sex and race in every slot',()=>{
 const groups={115:'head',125:'body',135:'legs',145:'gloves',155:'feet'};
 for(const [prefix,slot] of Object.entries(groups)){
  const variants=Number(prefix)===115?[2,12,22,32,42,52,62,72]:
   [1,2,11,12,21,22,31,32,41,42,51,52,61,62,71,72];
  for(const variant of variants){
   const item={id:Number(prefix)*100+variant,slot};
   const series=Math.trunc(variant/10),target=[0,0,1,1,2,3,4,5][series];
   for(const race of [0,1,2,3,4,5])for(const gender of [0,1])
    assert.equal(ui.raceCompatible(item,race,gender),
     race===5||(race===target&&gender===(series>=4?0:series%2===0?1:0)),
     'wrong tailored eligibility '+item.id+' / '+race+' / '+gender);
  }
 }
});
test('all Astir gloves and boots follow same gender policy as body outfits',()=>{
 const slot={126:'body',136:'legs',146:'gloves',156:'feet'};
 for(const [group,name] of Object.entries(slot)){
  for(let n=1;n<=8;n++){
   const male={id:Number(group)*100+n,slot:name};
   assert.equal(ui.raceCompatible(male,1,0),false,'elf woman: '+male.id);
   assert.equal(ui.raceCompatible(male,1,1),true);
   assert.equal(ui.raceCompatible(male,4,0),true);
   assert.equal(ui.raceCompatible(male,3,0),false);
   assert.equal(ui.raceCompatible(male,5,0),true);
   if(Number(group)!==136){
    const female={id:Number(group)*100+10+n,slot:name};
    assert.equal(ui.raceCompatible(female,1,0),true);
    assert.equal(ui.raceCompatible(female,1,1),false);
    assert.equal(ui.raceCompatible(female,3,0),true);
    assert.equal(ui.raceCompatible(female,4,0),false);
    assert.equal(ui.raceCompatible(female,5,0),true);
   }
  }
 }
 assert.equal(ui.raceCompatible({id:14601,slot:'head'},1,0),true);
 assert.equal(ui.raceCompatible({id:98001,slot:'gloves'},1,0),true);
});
test('equipment tooltips name only verified compatible races and genders',()=>{
 assert.deepEqual(ui.outfitWearers({id:12601,slot:'body'}),
  ['Человек (М)','Эльф (М)','Энкиду','Кролль']);
 assert.deepEqual(ui.outfitWearers({id:12612,slot:'body'}),
  ['Человек (Ж)','Эльф (Ж)','Мирина','Кролль']);
 assert.deepEqual(ui.outfitWearers({id:14531,slot:'gloves'}),
  ['Эльф (Ж)','Кролль']);
 assert.deepEqual(ui.outfitWearers({id:11552,slot:'head'}),
  ['Мирина','Кролль']);
 assert.deepEqual(ui.outfitWearers({id:15561,slot:'feet'}),
  ['Энкиду','Кролль']);
 assert.deepEqual(ui.outfitWearers({id:12571,slot:'body'}),['Кролль']);
 assert.equal(ui.outfitWearers({id:19022,slot:'ring'}),null);
 assert.deepEqual(ui.outfitWearers({id:12601,slot:'body'},'en'),
  ['Human (M)','Elf (M)','Enkidu','Kroll']);
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
