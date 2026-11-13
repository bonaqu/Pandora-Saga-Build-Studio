import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-target-damage.js'))(host);
const D=host.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const monsters=JSON.parse(read('data/os/monsters.json'));
const en=JSON.parse(read('data/os/strings.en.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const itemForth=JSON.parse(read('data/os/itemForth.json'));
const items=JSON.parse(read('data/os/items.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const blank={combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}};
const damage=(other={})=>D.crawlingTrap({
 skillCatalog:skills,classes,jobKey:'DISTURBANCE',level:45,
 masteries:{trap:41},branchCaps:classes.DISTURBANCE.branchCaps,
 stats:{dex:70,int:20},equipment:[],tables,itemForth,unison,modifiers:blank,
 ...other
});
test('True OS damage model: level 45, 70 DEX, 20 INT, 41 Traps versus Giant Ogre',()=>{
 const out=damage();
 assert.ok(out);
 assert.deepEqual({min:out.min,average:out.average,max:out.max},
  {min:34,average:148,max:194});
 assert.equal(out.basePower,226);
 assert.equal(out.heroDex,70);
 assert.equal(out.heroInt,20);
 assert.equal(out.trapMastery,41);
 assert.equal(out.levelPenalty,24);
 assert.equal(out.targetName,'Гигантский огр');
 assert.equal(out.targetNameEn,'Ogre Bouncer');
 assert.equal(out.monsterId,22104);
 assert.equal(skills[out.skillId].name,'Ползучая ловушка');
 assert.equal(en.skills[out.skillId].n,'Worm Bomb');
 assert.equal(monsters[out.monsterId].life,6126);
 assert.equal(monsters[out.monsterId].resists.magic,17);
 assert.equal(D.target.magicProtection,monsters['22104'].magicProtection);
});
test('Explicit half-even rounding and direct source-matched level-gap corrections',()=>{
 for(const [v,expected] of [[0.5,0],[1.5,2],[2.5,2],[3.5,4],
  [-0.5,0],[-1.5,-2]])assert.equal(D.roundEven(v),expected);
 const m=D.monsterLevelModifier(45,D.target,tables.lvModify);
 assert.deepEqual(m,{magicAc:0,magicProtection:4,magicDamageReduction:24});
 assert.deepEqual(D.monsterLevelModifier(50,D.target,tables.lvModify),
  {magicAc:0,magicProtection:0,magicDamageReduction:0});
 const noGap=damage({level:50});
 assert.ok(noGap?.min>34);
 assert.equal(noGap.levelPenalty,0);
});
test('Hero stat and trained mastery changes recalculate this actual skill hit',()=>{
 for(const [key,values] of [
  ['dex',[0,30,60,120]],
  ['int',[0,10,20,40]]
 ]){
  let prev=-1;
  for(const value of values){
   const x=damage({stats:{dex:key==='dex'?value:70,int:key==='int'?value:20}});
   assert.ok(x,key+' '+value);
   assert.ok(x.max>=prev,key+' '+value+' must not lower actual max');
   prev=x.max;
  }
 }
 let last=-1;
 for(const trap of [41,42,50,61,72,90]){
  const d=damage({masteries:{trap}});
  assert.ok(d,'mastery '+trap);
  assert.ok(d.max>=last);
  last=d.max;
 }
});
test('Unavailable skill, corrupt chain and source mutation cannot produce HP damage',()=>{
 assert.equal(damage({masteries:{trap:40}}),null);
 assert.equal(damage({jobKey:'PREDATOR'}),null);
 assert.equal(damage({masteries:{trap:91}}),null);
 assert.equal(damage({level:0}),null);
 const modified=structuredClone(skills);
 modified['240005003'].funcs[0].fv1[0]=681;
 assert.equal(damage({skillCatalog:modified}),null);
 const invalid=structuredClone(skills);
 invalid['240005002'].funcs[0].fv1[3]=240005004;
 assert.equal(damage({skillCatalog:invalid}),null);
 const wrongCaps=structuredClone(classes);
 wrongCaps.DISTURBANCE.branchCaps.trap=40;
 assert.equal(damage({classes:wrongCaps}),null);
});
test('Fire-magical enhancement is elemental damage flat+rate, not hero MATK',()=>{
 const item=items['1'];
 assert.equal(item.slot,'weapon');
 const base=damage();
 const equip=[{record:item,issue:[],refinement:1,
  gem:{type:'magical',element:'fire'},souls:[]}];
 const enhanced=damage({equipment:equip});
 assert.ok(enhanced);
 assert.equal(enhanced.magicGemRate,tables.magicPlus['1'].ratio);
 assert.equal(enhanced.magicGemFlat,tables.magicPlus['1'].flat);
 assert.ok(enhanced.max>base.max);
 const physicallyRefined=damage({equipment:[{
  ...equip[0],gem:{type:'physical',element:'fire'}
 }]});
 assert.equal(physicallyRefined.magicGemRate,0);
 assert.equal(physicallyRefined.magicGemFlat,0);
 assert.equal(physicallyRefined.max,base.max);
});
test('Equipment and ally rate bonus are effective on the target only if selected',()=>{
 const neutral=damage();
 const boosted=damage({modifiers:{
  combat:{spellDamageEquipmentRate:0,priestSong:{sageElementDamage:21}},
  priestApplied:{priestEnchantment:{magicRate:15}}
 }});
 assert.ok(boosted.max>neutral.max);
 assert.equal(boosted.bonusRate,36);
 assert.equal(damage({modifiers:{combat:{spellDamageEquipmentRate:50}}}),null,
  'A forged gear bonus that disagrees with current equipped records fails closed');
});
test('Book uses one current skill row and retains materials only in Wiki',()=>{
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 const index=read('index.html');
 assert.match(index,/pandora-studio-target-damage\.js\?v=2026\.11\.14\.770/);
 assert.match(app,/PandoraOSTargetDamage\?\.crawlingTrap/);
 assert.match(book,/stage-target-damage-row/);
 assert.match(book,/Средний урон по цели/);
 assert.match(book,/Average hit against/);
 assert.match(book,/heroMasteries\.trap>=41/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
 assert.doesNotMatch(book,/function monsterDamageSimulator\(/);
});
