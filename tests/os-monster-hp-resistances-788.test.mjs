import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const win={};Function('window',read('pandora-studio-target-damage.js'))(win);
const OS=win.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const monsters=JSON.parse(read('data/os/monsters.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const items=JSON.parse(read('data/os/items.json'));
const forth=JSON.parse(read('data/os/itemForth.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const blank={combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}};
const fixture=(more={})=>({skillCatalog:skills,classes,monsters,tables,
 itemForth:forth,unison,jobKey:'DISTURBANCE',level:45,
 masteries:{trap:41},branchCaps:classes.DISTURBANCE.branchCaps,
 stats:{dex:70,int:20},equipment:[],modifiers:blank,...more});
const trap=more=>OS.crawlingTrap(fixture(more));
const spells=more=>OS.supportedSkillHits(fixture(more));
const spell=(options,id)=>spells(options).find(row=>row.skillId===id);
const withEditedTarget=(opts,fn)=>{
 const targetId=opts.targetMonsterId||22104;
 const snapshot=structuredClone(opts.monsters||monsters);
 fn(snapshot[String(targetId)]);
 return {...opts,monsters:snapshot};
};
const checkAgainstSource=(opts,id,school)=>{
 const original=id===240005001?trap(opts):spell(opts,id);
 assert.ok(original,'Source-verified hit '+id);
 const again=edit=>{
  const changed=withEditedTarget(opts,edit);
  const hit=id===240005001?trap(changed):spell(changed,id);
  assert.ok(hit,'Independent full OS calculation for '+id);
  return original.average-hit.average;
 };
 assert.equal(original.targetElementResistanceAverageImpact,
  again(row=>{row.resists[school]=0;}),'element-only full OS replay');
 assert.equal(original.targetMagicResistanceAverageImpact,
  again(row=>{row.resists.magic=0;}),'magic-only full OS replay');
 assert.equal(original.targetResistanceAverageImpact,
  again(row=>{row.resists[school]=0;row.resists.magic=0;}),
  'joint-resist replay must remain source-compatible');
 assert.equal(original.targetMaxLife,
  (opts.monsters||monsters)[String(opts.targetMonsterId||22104)].life);
 assert.equal(original.targetAverageLifePercent,
  100*original.average/original.targetMaxLife);
 assert.ok(Number.isSafeInteger(original.average)&&original.average>0);
 return original;
};
test('Verified Ogre 34/148/194 remains unchanged; health is 6,126 D1 HP, not predicted damage',()=>{
 const hit=checkAgainstSource({},240005001,'fire');
 assert.deepEqual([hit.min,hit.average,hit.max],[34,148,194]);
 assert.equal(hit.targetMaxLife,6126);
 assert.equal(hit.targetAverageLifePercent,100*148/6126);
 assert.equal(hit.targetElementResistanceAverageImpact,0);
 assert.equal(hit.targetMagicResistance,17);
 assert.ok(hit.targetMagicResistanceAverageImpact<0);
});
test('Separate magic/element resistance deltas are recalculated at actual selected D1 target',()=>{
 let total=0;
 for(const targetMonsterId of [22104,11104,11101,600]){
  checkAgainstSource({targetMonsterId},240005001,'fire');
  total++;
 }
 assert.equal(total,4);
 const dingo=trap({targetMonsterId:11104});
 assert.ok(dingo.targetElementResistance<0,'OS data says Dingo is fire-vulnerable');
 assert.ok(dingo.targetElementResistanceAverageImpact>0);
 assert.ok(dingo.targetMagicResistanceAverageImpact<0);
 const coyote=trap({targetMonsterId:11101});
 assert.equal(coyote.targetMagicResistanceAverageImpact,0);
});
test('Warlock fire/cold/lightning, Exorcism holy, Charm, Darkness and linked spells share same source gates',()=>{
 const opts={jobKey:'WARLOCK',level:45,
  branchCaps:classes.WARLOCK.branchCaps,
  masteries:{element:70,exorcism:20,charm:20,darkness:25},
  stats:{str:55,dex:65,int:80,spi:50},
  targetMonsterId:11104};
 let confirmed=0;
 for(const [id,school] of [
  [410001001,'fire'],[410011001,'cold'],[410012001,'cold'],
  [410022001,'lightning'],[330001001,'holy'],
  [420003001,'charm'],[430001001,'dark']
 ]){
  // Character classes determine learnability. Unavailable hits are NOT
  // forced into the Book, but each available one must match full OS replay.
  if(spell(opts,id)){checkAgainstSource(opts,id,school);confirmed++;}
 }
 assert.ok(confirmed>=5,'Multiple verified direct and linked spell schools');
});
test('Penetrating equipment is retained when neutralizing ONLY one target resistance',()=>{
 const pierce={record:{...items['1'],effects:[
  {func:'EP_ELEMENT_BONUS',a:28}]},
  issue:[],refinement:0,gem:null,souls:[]};
 const options={targetMonsterId:11104,equipment:[pierce]};
 const hit=checkAgainstSource(options,240005001,'fire');
 assert.equal(hit.itemPenetration,28);
 const baseline=trap({targetMonsterId:11104});
 assert.ok(hit.average>baseline.average);
 assert.equal(hit.targetElementResistanceAverageImpact,
  hit.average-trap(withEditedTarget(options,m=>{m.resists.fire=0;})).average,
  'The element delta is a real replay with the same active penetration');
});
test('Current D1 maximum life changes only the HP ratio; current hit damage is not a monster-HP formula',()=>{
 const before=trap({targetMonsterId:11104});
 const doubled=trap(withEditedTarget({targetMonsterId:11104},m=>{m.life*=2;}));
 assert.ok(before&&doubled);
 assert.deepEqual([doubled.min,doubled.average,doubled.max],
  [before.min,before.average,before.max]);
 assert.equal(doubled.targetMaxLife,before.targetMaxLife*2);
 assert.equal(doubled.targetAverageLifePercent,before.targetAverageLifePercent/2);
 const nearZero=trap(withEditedTarget({targetMonsterId:11104},m=>{m.life=1;}));
 assert.ok(nearZero.targetAverageLifePercent>100,
  'Full-life ratio remains a ratio; never silently cap overkill at 100%');
 assert.equal(nearZero.average,before.average);
 assert.equal(trap({targetMonsterId:11104}).targetMaxLife,16423,
  'Changing a snapshot cannot cache or mutate the live D1 target');
});
test('Negative magic resistance and odd positive magic resistance follow truncation, not a linear percentage guess',()=>{
 const negative=withEditedTarget({targetMonsterId:11104},m=>{
  m.resists.fire=0;m.resists.magic=-11;
 });
 checkAgainstSource(negative,240005001,'fire');
 const odd=withEditedTarget({targetMonsterId:11104},m=>{
  m.resists.fire=0;m.resists.magic=1;
 });
 const hit=checkAgainstSource(odd,240005001,'fire');
 assert.equal(hit.targetMagicResistanceAverageImpact,0,
  'OS halves raw +1 magic resistance and truncates to zero');
 assert.ok(trap(negative).targetMagicResistanceAverageImpact>0,
  'A true negative magic resistance improves the current hit');
});
test('Bad monster life or resistance is not silently replaced by historical Ogre metadata',()=>{
 for(const fn of [
  m=>{m.life=0;},m=>{m.life='16423';},
  m=>{delete m.resists.magic;},m=>{m.resists.fire='-25';}
 ]){
  const options=withEditedTarget({targetMonsterId:11104},fn);
  assert.equal(trap(options),null);
  assert.deepEqual(spells(options),[]);
 }
 assert.equal(trap({targetMonsterId:999999}),null);
});
test('Compact RU/EN Book line uses only current D1 max life and exact component deltas',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/targetAverageLifePercent/);
 assert.match(book,/hitResult\.targetMaxLife/);
 assert.match(book,/Средний удар:/);
 assert.match(book,/Average hit:/);
 assert.match(book,/targetElementResistanceAverageImpact/);
 assert.match(book,/targetMagicResistanceAverageImpact/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});
