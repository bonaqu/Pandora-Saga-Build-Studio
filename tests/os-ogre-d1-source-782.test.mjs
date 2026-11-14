import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-studio-target-damage.js'))(host);
const D=host.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const monsters=JSON.parse(read('data/os/monsters.json'));
const items=JSON.parse(read('data/os/items.json'));
const itemForth=JSON.parse(read('data/os/itemForth.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const blank={combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}};
const base=(more={})=>({
 skillCatalog:skills,classes,jobKey:'DISTURBANCE',level:45,
 branchCaps:classes.DISTURBANCE.branchCaps,masteries:{trap:41},
 stats:{dex:70,int:20},equipment:[],itemForth,unison,
 tables,modifiers:blank,monsters,...more
});
const hit=more=>D.crawlingTrap(base(more));
const triple=x=>x&&[x.min,x.average,x.max];
const sourceTarget=monsters['22104'];
test('live D1-compatible Ogre stats reproduce the original pinned single-explosion vector',()=>{
 assert.equal(sourceTarget.id,22104);
 assert.deepEqual(triple(hit()),[34,148,194]);
 assert.equal(hit().targetName,sourceTarget.name);
 assert.equal(hit().targetMagicResistance,sourceTarget.resists.magic);
 assert.equal(hit().targetElementResistance,sourceTarget.resists.fire);
 assert.equal(hit().hitKind,'trap-hit');
 assert.equal(skills['240005001'].funcs.filter(f=>f.ep==='EP_ELEMENT_DAMAGE').length,0);
 assert.equal(skills['240005003'].funcs.filter(f=>f.ep==='EP_ELEMENT_DAMAGE').length,1);
});
test('live D1 monster changes immediately recalculate magic and fire resistance',()=>{
 const fire=structuredClone(monsters);fire['22104'].resists.fire=60;
 assert.ok(hit({monsters:fire}).average<hit().average);
 const weakFire=structuredClone(monsters);weakFire['22104'].resists.fire=-40;
 assert.ok(hit({monsters:weakFire}).average>hit().average);
 const magic=structuredClone(monsters);magic['22104'].resists.magic=55;
 assert.ok(hit({monsters:magic}).average<hit().average);
 const level=structuredClone(monsters);level['22104'].level=55;
 assert.notDeepEqual(triple(hit({monsters:level})),triple(hit()));
 const spirit=structuredClone(monsters);spirit['22104'].spi=60;
 assert.ok(hit({monsters:spirit}).average<hit().average);
});
test('invalid, absent or cross-snapshot Ogre records never produce stale fake damage',()=>{
 assert.equal(hit({monsters:{}}),null);
 assert.equal(hit({monsters:null}),null);
 for(const edit of [
  x=>{delete x['22104'].resists.fire},
  x=>{x['22104'].magicProtection=-1},
  x=>{x['22104'].level='53'},
  x=>{x['22104'].id=22105},
  x=>{x['22104'].resists.magic='17'}
 ]){const modified=structuredClone(monsters);edit(modified);
  assert.equal(hit({monsters:modified}),null);
 }
 // Old public calculator fixtures (without D1) remain supported; the live
 // Hero Book always passes an explicit monster snapshot or displays no hit.
 assert.deepEqual(triple(hit({monsters:undefined})),[34,148,194]);
});
test('items can pierce Ogre resistance without increasing spell-damage percentage',()=>{
 const weapon={record:{...items['1'],effects:[{func:'EP_ELEMENT_BONUS',a:28}]},
  issue:[],refinement:0,gem:null,souls:[]};
 const pierced=hit({equipment:[weapon]});
 assert.ok(pierced);
 assert.equal(pierced.bonusRate,0);
 assert.equal(pierced.itemPenetration,28);
 assert.ok(pierced.average>hit().average);
 assert.equal(pierced.itemPenetrationAverageGain,pierced.average-hit().average);
 const changed=structuredClone(monsters);changed['22104'].resists.fire=70;
 const resisted=hit({monsters:changed,equipment:[weapon]});
 const unpierced=hit({monsters:changed});
 assert.equal(resisted.itemPenetrationAverageGain,resisted.average-unpierced.average);
});
test('DEX, INT, green Trap mastery, forged magic weapon and selected ally buffs all stack in full Ogre hit',()=>{
 const enhanced={record:items['1'],issue:[],refinement:10,
  gem:{type:'magical',element:'fire'},souls:[]};
 const sourceBuff={...enhanced,record:{...items['1'],effects:[
  {func:'EP_ELEMENT_DAMAGE_SCALE',a:9},
  {func:'EP_ELEMENT_DAMAGE_SCALE_FIRE',a:7},
  {func:'EP_ELEMENT_BONUS',a:18}
 ]}};
 const addons={stats:{dex:120,int:75},masteries:{trap:90},
  equipment:[sourceBuff],modifiers:{combat:{
   spellDamageEquipmentRate:9,priestSong:{sageElementDamage:21}
  },priestApplied:{priestEnchantment:{magicRate:15}}}};
 const all=hit(addons);
 assert.ok(all);
 assert.equal(all.magicGemFlat,tables.magicPlus['10'].flat);
 assert.equal(all.magicGemRate,tables.magicPlus['10'].ratio);
 assert.equal(all.bonusRate,9+7+21+15);
 assert.equal(all.itemPenetration,18);
 assert.ok(all.average>hit().average);
 for(const [field,without] of [
  ['allyAverageGain',{...addons,modifiers:{
    combat:{spellDamageEquipmentRate:9,priestSong:{}},priestApplied:{}}}],
  ['itemDamageAverageGain',{...addons,equipment:[{
    ...sourceBuff,record:{...items['1'],effects:[
     {func:'EP_ELEMENT_BONUS',a:18}]}
    }],modifiers:{...addons.modifiers,combat:{
      ...addons.modifiers.combat,spellDamageEquipmentRate:0}}}],
  ['itemPenetrationAverageGain',{...addons,equipment:[{
    ...sourceBuff,record:{...items['1'],effects:[
     {func:'EP_ELEMENT_DAMAGE_SCALE',a:9},
     {func:'EP_ELEMENT_DAMAGE_SCALE_FIRE',a:7}]}
    }]}]
 ])assert.equal(all[field],all.average-hit(without).average,field);
 const physicalGem=hit({...addons,equipment:[{
  ...sourceBuff,gem:{type:'physical',element:'fire'}}]});
 assert.equal(physicalGem.magicGemFlat,0);
 assert.ok(all.average>physicalGem.average);
});
test('broad independent build-state matrix keeps hit range and target state coherent',()=>{
 let checked=0;
 for(const level of [35,45,50,55])
 for(const mastery of [41,51,61,72,90])
 for(const dex of [0,30,70,120])
 for(const int of [0,20,45,85]){
  const o=hit({level,masteries:{trap:mastery},stats:{dex,int}});
  assert.ok(o,JSON.stringify({level,mastery,dex,int}));
  assert.ok(o.min<=o.average&&o.average<=o.max);
  assert.equal(o.monsterId,22104);
  assert.equal(o.hitKind,'trap-hit');
  checked++;
 }
 assert.equal(checked,320);
});
test('live D1 snapshot is lazy, checked and passed into existing Hero Book',()=>{
 const app=read('pandora-studio-app.js'),book=read('pandora-studio-hero-book.js');
 assert.match(app,/function ensureOgreSource\(/);
 assert.match(app,/stageAttributesPage==='effects'&&!ogreMonsters/);
 assert.match(app,/x-ps-catalog-snapshot/);
 assert.match(app,/monsters:ogreMonsters,englishMonsters:/);
 assert.match(book,/itemPenetrationAverageGain/);
 assert.match(book,/targetMagicResistance/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});
