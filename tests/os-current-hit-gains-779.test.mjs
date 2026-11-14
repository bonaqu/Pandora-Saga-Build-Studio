import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-target-damage.js'))(root);
const D=root.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const items=JSON.parse(read('data/os/items.json'));
const mods=(ally=0,enchant=0,gear=0)=>({
 combat:{spellDamageEquipmentRate:gear,priestSong:{sageElementDamage:ally}},
 priestApplied:{priestEnchantment:{magicRate:enchant}}
});
const bow={record:items['2201'],issue:[],refinement:0,gem:null,souls:[]};
const opts=(more={})=>({
 skillCatalog:skills,classes,jobKey:'SNIPER',level:50,
 masteries:{archery:80},branchCaps:classes.SNIPER.branchCaps,
 stats:{str:70,dex:40,int:80,spi:20},equipment:[bow],
 tables,itemForth:{},unison:{},modifiers:mods(),...more
});
const sniper=o=>D.supportedSkillHits(opts(o)).find(h=>h.skillId===213608001);
const trap=o=>D.crawlingTrap({
 ...opts(),jobKey:'DISTURBANCE',level:45,
 masteries:{trap:41},branchCaps:classes.DISTURBANCE.branchCaps,
 stats:{str:70,dex:70,int:20,spi:40},equipment:[],...o
});
test('No invented gains when none of those bonuses are active',()=>{
 const h=sniper(),t=trap();
 assert.deepEqual([h.min,h.average,h.max],[61,65,69]);
 assert.deepEqual([t.min,t.average,t.max],[34,148,194]);
 for(const r of [h,t]){
  for(const key of ['allyAverageGain','itemDamageAverageGain','refinementAverageGain'])
   assert.equal(r[key],undefined,key+' must not create another row');
 }
});
test('Exact marginal ally bonus is recalculated with full Ogre/OS rounding',()=>{
 for(const [caster,base] of [[sniper,{}],[trap,{}]]){
  const usual=caster(base),chosen=caster({modifiers:mods(21,15)});
  assert.equal(chosen.allyAverageGain,chosen.average-usual.average);
  assert.ok(chosen.allyAverageGain>0);
  const sage=caster({modifiers:mods(21,0)});
  assert.equal(sage.allyAverageGain,sage.average-usual.average);
  const charm=caster({modifiers:mods(0,15)});
  assert.equal(charm.allyAverageGain,charm.average-usual.average);
  assert.equal(chosen.itemDamageAverageGain,undefined);
  assert.equal(chosen.refinementAverageGain,undefined);
 }
});
test('Magical refinement gain uses same target steps and zeroes only the forged effect',()=>{
 for(const lvl of [1,5,10]){
  const enchanted={...bow,refinement:lvl,gem:{type:'magical',element:'fire'}};
  const buffed=sniper({equipment:[enchanted],modifiers:mods(21,15)});
  const noForging=sniper({equipment:[{...enchanted,gem:null}],
   modifiers:mods(21,15)});
  assert.equal(buffed.refinementAverageGain,buffed.average-noForging.average);
  assert.ok(buffed.refinementAverageGain>=0);
  assert.equal(buffed.allyAverageGain,buffed.average-
   sniper({equipment:[enchanted]}).average);
 }
 const ice=sniper({equipment:[{...bow,refinement:10,
  gem:{type:'magical',element:'cold'}}]});
 assert.equal(ice.refinementAverageGain,undefined);
 assert.equal(ice.average,sniper().average);
});
test('Item-specific damage rates are separate from ally buffs, and never spill across elements',()=>{
 const boosted={...bow,record:{...bow.record,effects:[
  {func:'EP_ELEMENT_DAMAGE_SCALE_FIRE',a:40}]}};
 const fires=sniper({equipment:[boosted]});
 const neutral=sniper();
 assert.equal(fires.itemDamageAverageGain,fires.average-neutral.average);
 assert.ok(fires.itemDamageAverageGain>0);
 assert.equal(fires.allyAverageGain,undefined);
 const mixed=sniper({equipment:[boosted],modifiers:mods(21,15)});
 const withoutAlly=sniper({equipment:[boosted]});
 const withoutItem=sniper({equipment:[bow],modifiers:mods(21,15)});
 assert.equal(mixed.itemDamageAverageGain,mixed.average-withoutItem.average);
 assert.equal(mixed.allyAverageGain,mixed.average-withoutAlly.average);
 const wrongElement=sniper({equipment:[{...bow,record:{...bow.record,effects:[
  {func:'EP_ELEMENT_DAMAGE_SCALE_COLD',a:40}]}}]});
 assert.equal(wrongElement.average,neutral.average);
 assert.equal(wrongElement.itemDamageAverageGain,undefined);
});
test('No new Book cards, no status-tick sum, same UI text bilingual',()=>{
 const book=read('pandora-studio-hero-book.js'),dmg=read('pandora-studio-target-damage.js');
 assert.match(dmg,/const hitRange=\(rate,gemRate,gemFlat,pen=penetration,comparison=null,/);
 assert.match(book,/Бонусы урона вещей/);
 assert.match(book,/Усиления союзников/);
 assert.match(book,/Магическая заточка/);
 assert.match(book,/Ally buffs/);
 assert.match(book,/realGains\.join\(' · '\)/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});
