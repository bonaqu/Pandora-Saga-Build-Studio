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
const english=JSON.parse(read('data/os/strings.en.json'));
const itemForth=JSON.parse(read('data/os/itemForth.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const modifiers={combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}};
const input=(overrides={})=>({
 skillCatalog:skills,classes,jobKey:'WARLOCK',level:45,
 masteries:{element:50,darkness:25},branchCaps:classes.WARLOCK.branchCaps,
 stats:{dex:70,int:80,spi:50},equipment:[],tables,itemForth,unison,
 modifiers,...overrides
});
// Keep 0.771 regression snapshots focused on the original three skills;
// expanded school coverage is independently asserted in 0.773 tests.
const legacyIds=new Set([410001001,430001001,430052001]);
const hits=(overrides={})=>
 D.supportedSkillHits(input(overrides)).filter(row=>legacyIds.has(row.skillId));
const get=(list,id)=>list.find(x=>x.skillId===id);
test('Published OS Et, kt, Ie, ve and Tt: three single-hit packets versus Giant Ogre',()=>{
 const values=hits();
 assert.deepEqual(values.map(x=>x.skillId),[410001001,430001001,430052001]);
 assert.deepEqual(values.map(({min,average,max})=>[min,average,max]),
  [[6,27,36],[12,60,87],[1,8,12]]);
 for(const v of values){
  assert.equal(v.monsterId,22104);
  assert.equal(v.targetName,monsters['22104'].name);
  assert.equal(v.targetNameEn,'Ogre Bouncer');
  assert.equal(v.levelPenalty,24);
  assert.equal(v.heroInt,80);
  assert.equal(v.heroMastery,v.heroMasteryKey==='element'?50:25);
  assert.equal(v.model.includes('one elemental hit'),true);
  assert.equal(english.skills[String(v.skillId)].n.length>0,true);
 }
 assert.equal(get(values,410001001).element,'fire');
 assert.equal(get(values,430001001).element,'dark');
 assert.equal(get(values,430052001).heroPowerKey,'spi');
 assert.equal(monsters['22104'].resists.dark,-25);
});
test('Current class, real green mastery, level and power stat independently gate spells',()=>{
 assert.deepEqual(hits({masteries:{element:0,darkness:0}}).map(x=>x.skillId),
  [410001001]);
 assert.deepEqual(hits({jobKey:'MAGE',branchCaps:classes.MAGE.branchCaps,
  masteries:{element:20,darkness:0}}).map(x=>x.skillId),[410001001]);
 assert.deepEqual(hits({masteries:{element:0,darkness:8}}).map(x=>x.skillId),
  [410001001,430052001]);
 assert.deepEqual(hits({masteries:{element:0,darkness:20}}).map(x=>x.skillId),
  [410001001,430052001]);
 assert.deepEqual(hits({masteries:{element:91,darkness:25}}).map(x=>x.skillId),
  [430001001,430052001]);
 assert.equal(hits({jobKey:'DISTURBANCE'}).length,0);
 assert.equal(hits({level:0}).length,0);
 assert.equal(hits({stats:{dex:70,int:-1,spi:50}}).length,0);
 assert.deepEqual(hits({stats:{dex:70,int:80,spi:-1}}).map(x=>x.skillId),
  [410001001,430001001]);
});
test('Source changes fail closed, including secondary healing/poison action changes',()=>{
 const bad=structuredClone(skills);
 bad['410001001'].funcs[0].fv1[0]=123;
 assert.deepEqual(hits({skillCatalog:bad}).map(x=>x.skillId),
  [430001001,430052001]);
 bad['430001001'].funcs[0].fv1[3]=51;
 assert.deepEqual(hits({skillCatalog:bad}).map(x=>x.skillId),
  [430052001]);
 bad['430052001'].funcs[1].fv2[3]=71;
 assert.equal(hits({skillCatalog:bad}).length,0);
 const broken=structuredClone(skills);
 broken['430052001'].powerStat='INT';
 assert.equal(get(hits({skillCatalog:broken}),430052001),undefined);
});
test('Fire-only source bonus does not leak into dark hits; magical gem matches element',()=>{
 const baseline=hits();
 const weapon={record:{id:1,slot:'weapon',effects:[
  {func:'EP_ELEMENT_DAMAGE_SCALE_FIRE',a:35}]},
  issue:[],souls:[],refinement:0,gem:null};
 const fireOnly=hits({equipment:[weapon]});
 assert.ok(get(fireOnly,410001001).max>get(baseline,410001001).max);
 for(const id of [430001001,430052001])
  assert.equal(get(fireOnly,id).max,get(baseline,id).max);
 const darkGem=hits({equipment:[{...weapon,record:{id:1,slot:'weapon',effects:[]},
  refinement:3,gem:{type:'magical',element:'dark'}}]});
 assert.ok(get(darkGem,430001001).max>get(baseline,430001001).max);
 assert.equal(get(darkGem,410001001).max,get(baseline,410001001).max);
 const forged={combat:{spellDamageEquipmentRate:50}};
 assert.equal(hits({modifiers:forged}).length,0);
});
test('An INT, SPI or mastery change recalculates target damage, not just a coefficient',()=>{
 const baseline=hits();
 const betterInt=hits({stats:{dex:70,int:90,spi:50}});
 for(const row of betterInt)
  assert.ok(row.max>=get(baseline,row.skillId).max);
 const betterSpi=hits({stats:{dex:70,int:80,spi:90}});
 assert.ok(get(betterSpi,430052001).max>=get(baseline,430052001).max);
 assert.equal(get(betterSpi,410001001).max,get(baseline,410001001).max);
 const trained=hits({masteries:{element:60,darkness:30}});
 assert.ok(get(trained,410001001).max>=get(baseline,410001001).max);
 assert.ok(get(trained,430001001).max>=get(baseline,430001001).max);
});
test('Hero Book reads computed hits once, materials remain in the Encyclopedia',()=>{
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 assert.match(app,/PandoraOSTargetDamage\?\.supportedSkillHits/);
 assert.match(book,/calculatedById=new Map\(relevantHits\.map/);
 assert.match(book,/stage-target-damage-row/);
 assert.match(book,/heroMasteryKey/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});
