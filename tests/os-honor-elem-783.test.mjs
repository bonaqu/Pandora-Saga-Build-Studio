import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-studio-target-damage.js'))(host);
const C=host.PandoraOSTargetDamage;
const skillCatalog=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const monsters=JSON.parse(read('data/os/monsters.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const bare=()=>({combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}});
const modifiers=(id=0,rest={})=>({
 ...bare(),honor:{id},
 elementalMagic:{fire:id===3?5:0,ice:id===4?5:0,
  lightning:id===5?5:0,poison:0,light:0,dark:0},
 ...rest
});
const base=(extra={})=>({
 skillCatalog,classes,jobKey:'DISTURBANCE',level:45,
 masteries:{trap:41},branchCaps:classes.DISTURBANCE.branchCaps,
 stats:{dex:70,int:20},equipment:[],tables,itemForth:{},unison:{},
 monsters,modifiers:modifiers(0),...extra
});
const trap=extra=>C.crawlingTrap(base(extra));
const mage=extra=>C.supportedSkillHits(base({
 jobKey:'WARLOCK',level:55,masteries:{element:80,exorcism:20,
  darkness:30,charm:15},branchCaps:classes.WARLOCK.branchCaps,
 stats:{dex:50,int:115,spi:50},...extra
}));
const spell=(id,opts={})=>mage(opts).find(h=>h.skillId===id);
const byTitle=(n,override={})=>modifiers(n,override);

test('three Honor tome titles match the current RU and EN game snapshots, not old legacy names',()=>{
 const source=[
  [950000003,'Том огня','Tome of the Inferno','EP_ELEMENT_DAMAGE_SCALE_FIRE'],
  [950000004,'Том бури','Tome of the Blizzard','EP_ELEMENT_DAMAGE_SCALE_COLD'],
  [950000005,'Том грозы','Tome of the Fulmination','EP_ELEMENT_DAMAGE_SCALE_LIGHTNING']
 ];
 for(const [id,ru,en,ep] of source){
  assert.equal(skillCatalog[String(id)].name,ru);
  assert.equal(english.skills[String(id)].n,en);
  assert.equal(skillCatalog[String(id)].funcs.at(-1).ep,ep);
  assert.deepEqual(skillCatalog[String(id)].funcs.at(-1).fv1,[0,0,0,5]);
 }
});
test('Worm Bomb receives exactly its chosen Fire Honor title, not a second hit or generic MATK',()=>{
 const plain=trap(),fire=trap({modifiers:byTitle(3)});
 assert.ok(plain&&fire);
 assert.deepEqual([plain.min,plain.average,plain.max],[34,148,194]);
 assert.equal(fire.skillId,240005001);
 assert.equal(fire.hitKind,'trap-hit');
 assert.equal(fire.honorRate,5);
 assert.equal(fire.bonusRate,5);
 assert.equal(fire.honorAverageGain,fire.average-plain.average);
 assert.ok(fire.average>plain.average);
 const none=trap({modifiers:byTitle(0)});
 const cold=trap({modifiers:byTitle(4)});
 const lightning=trap({modifiers:byTitle(5)});
 for(const off of [none,cold,lightning]){
  assert.equal(off.honorRate,0);
  assert.equal(off.honorAverageGain,undefined);
  assert.deepEqual([off.min,off.average,off.max],
   [plain.min,plain.average,plain.max]);
 }
});
test('Cold and Lightning honor affect matching school only, including Warlock knowledge',()=>{
 const plainCold=spell(410012001),plainLightning=spell(410023001);
 assert.ok(plainCold&&plainLightning);
 const ice=spell(410012001,{modifiers:byTitle(4)});
 const storm=spell(410023001,{modifiers:byTitle(5)});
 assert.ok(ice&&storm);
 assert.equal(ice.honorRate,5);
 assert.equal(storm.honorRate,5);
 assert.equal(ice.honorAverageGain,ice.average-plainCold.average);
 assert.equal(storm.honorAverageGain,storm.average-plainLightning.average);
 assert.ok(ice.max>=plainCold.max);
 assert.ok(storm.max>=plainLightning.max);
 assert.equal(spell(410012001,{modifiers:byTitle(3)}).honorRate,0);
 assert.equal(spell(410023001,{modifiers:byTitle(4)}).honorRate,0);
 const fire=spell(410001001,{modifiers:byTitle(3)});
 assert.ok(fire&&fire.honorRate===5);
 assert.equal(fire.magicKnowledgeRate,20,'The original mage passive must also remain active');
});
test('Honor title plus magic refinement, allies and item rates obey full target rounding',()=>{
 const equipped=[{record:{id:999999,slot:'weapon',effects:[
  {func:'EP_ELEMENT_DAMAGE_SCALE',a:10},
  {func:'EP_ELEMENT_DAMAGE_SCALE_FIRE',a:5}]},
  issue:[],refinement:10,gem:{type:'magical',element:'fire'},souls:[]}];
 const buffs={combat:{spellDamageEquipmentRate:10,
  priestSong:{sageElementDamage:21}},priestApplied:{
   priestEnchantment:{magicRate:15}}};
 const opt={equipment:equipped,modifiers:byTitle(3,buffs)};
 const all=trap(opt);
 const plain=trap({...opt,modifiers:byTitle(0,buffs)});
 assert.ok(all&&plain);
 assert.equal(all.honorRate,5);
 assert.equal(all.bonusRate,10+5+21+15+5);
 assert.equal(all.magicGemRate,tables.magicPlus['10'].ratio);
 assert.equal(all.magicGemFlat,tables.magicPlus['10'].flat);
 assert.equal(all.honorAverageGain,all.average-plain.average);
 assert.ok(all.average>plain.average);
});
test('Tampered or mismatched Honor sources cannot silently affect the calculated hit',()=>{
 const wrongRate=structuredClone(skillCatalog);
 wrongRate['950000003'].funcs.at(-1).fv1[3]=20;
 assert.equal(trap({skillCatalog:wrongRate,modifiers:byTitle(3)}),null);
 const wrongSecondary=structuredClone(skillCatalog);
 wrongSecondary['950000004'].funcs[0].fv1[3]=11;
 assert.equal(spell(410012001,{skillCatalog:wrongSecondary,
  modifiers:byTitle(4)}),undefined);
 const wrongSlot=structuredClone(skillCatalog);
 wrongSlot['950000005'].funcs.at(-1).dir='CASTER';
 assert.equal(spell(410023001,{skillCatalog:wrongSlot,
  modifiers:byTitle(5)}),undefined);
 const wrongSheet=modifiers(3);
 wrongSheet.elementalMagic.fire=0;
 assert.equal(trap({modifiers:wrongSheet}),null);
 const wrongId=modifiers(3);wrongId.honor={id:99};
 assert.equal(trap({modifiers:wrongId}),null);
 const sourceAbsent=structuredClone(skillCatalog);
 delete sourceAbsent['950000003'];
 assert.equal(trap({skillCatalog:sourceAbsent,modifiers:byTitle(3)}),null);
});
test('Book Honor selection uses D1 Russian/English skill name, numeric effect has no new card',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/gameTerms\.skills\?\.\[String\(950000000\+id\)\]\?\.name/);
 assert.match(book,/gameTerms\.englishSkills\?\.\[String\(950000000\+id\)\]\?\.n/);
 assert.match(book,/hitResult\.honorAverageGain/);
 assert.match(book,/Титул чести/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});
