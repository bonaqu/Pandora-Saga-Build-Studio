import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('pandora-studio-target-damage.js'))(host);
const damage=host.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const items=JSON.parse(read('data/os/items.json'));
const english=JSON.parse(read('data/os/strings.en.json'));
const bow={record:items['2201'],issue:[],refinement:0,gem:null,souls:[]};
const blank={combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}};
const inputs=(overrides={})=>({
 skillCatalog:skills,classes,jobKey:'SNIPER',level:50,
 masteries:{archery:80},branchCaps:classes.SNIPER.branchCaps,
 stats:{str:70,dex:40,int:80,spi:20},equipment:[bow],
 tables,itemForth:{},unison:{},modifiers:blank,...overrides
});
const hit=overrides=>damage.supportedSkillHits(inputs(overrides))
 .find(row=>row.skillId===213608001);
const nums=out=>[out?.min,out?.average,out?.max];
test('Official OS Et uses STR powerStat and INT multiplier for Sniper Kindling Arrow',()=>{
 assert.equal(skills[213608001].name,'Пламенная стрела');
 assert.equal(english.skills['213608001'].n,'Kindling Arrow');
 assert.equal(skills[213608001].charLevel,50);
 assert.deepEqual(skills[213608001].weaponUse,['BOW']);
 const root=damage.linkedSpells.find(s=>s.id===213608001);
 assert.deepEqual(root.path.map(s=>s.id),[213608001,213608002]);
 assert.equal(root.requiredWeapon,'BOW');
 assert.equal(root.damageIndex,1);
 assert.equal(skills[213608002].damage.slotIndex,1);
 assert.deepEqual(skills[213608002].funcs[1].fv1,[0,0,80,60]);
 assert.deepEqual(nums(hit()),[61,65,69]);
 assert.equal(hit().heroPowerKey,'str');
 assert.equal(hit().heroPowerCoefficient,0);
 assert.equal(hit().heroMasteryKey,'archery');
 assert.equal(hit().heroMastery,80);
 assert.equal(hit().heroInt,80);
 assert.equal(hit().hitKind,'direct-part');
 assert.equal(hit().monsterId,22104);
 assert.equal(hit().element,'fire');
 assert.equal(damage.target.resists.fire,0);
 assert.deepEqual(nums(hit({stats:{str:0,dex:40,int:80,spi:20}})),nums(hit()));
 assert.deepEqual(nums(hit({stats:{str:100,dex:40,int:80,spi:20}})),nums(hit()));
 assert.ok(hit({stats:{str:70,dex:40,int:100,spi:20}}).max>hit().max);
 assert.ok(hit({masteries:{archery:90}}).max>hit().max);
});
test('Real class, level, trained branch, bow and valid equipment are all necessary',()=>{
 assert.equal(hit({level:49}),undefined);
 assert.equal(hit({jobKey:'ARCHER',branchCaps:classes.ARCHER.branchCaps}),undefined);
 assert.equal(hit({masteries:{archery:91}}),undefined);
 assert.equal(hit({masteries:{archery:-1}}),undefined);
 assert.equal(hit({branchCaps:{...classes.SNIPER.branchCaps,archery:100}}),undefined);
 assert.equal(hit({equipment:[]}),undefined);
 assert.equal(hit({equipment:[{...bow,issue:['underlevel']}]}),undefined);
 assert.equal(hit({equipment:[{...bow,record:{...items['2201'],kind:'CROSSBOW'}}]}),undefined);
 assert.equal(hit({equipment:[{...bow,record:items['1']}]}),undefined);
});
test('Source drift on both skill stages, weapon restriction, ammo, burn or vector closes the result',()=>{
 const ids=[213608001,213608002];
 for(const id of ids){
  const mutant=structuredClone(skills);
  mutant[String(id)].funcs[0].fv1[3]++;
  assert.equal(hit({skillCatalog:mutant}),undefined,'changed '+id);
  const weapon=structuredClone(skills);
  weapon[String(id)].weaponUse=['CROSSBOW'];
  assert.equal(hit({skillCatalog:weapon}),undefined,'changed weapon '+id);
 }
 const ammo=structuredClone(skills);
 ammo['213608001'].funcs[1].fv2[3]=2;
 assert.equal(hit({skillCatalog:ammo}),undefined);
 const burn=structuredClone(skills);
 burn['213608002'].funcs[0].fv1[3]=8;
 assert.equal(hit({skillCatalog:burn}),undefined);
 const hitChange=structuredClone(skills);
 hitChange['213608002'].funcs[1].fv1[2]++;
 assert.equal(hit({skillCatalog:hitChange}),undefined);
});
test('Current equipped gear, magical fire refinement and party buffs affect only the target packet',()=>{
 const old=hit(),sameNoGear=hit({equipment:[bow]});
 assert.deepEqual(nums(sameNoGear),nums(old));
 const enchanted={...bow,gem:{type:'magical',element:'fire'},refinement:10};
 const enhanced=hit({equipment:[enchanted]});
 assert.ok(enhanced?.max>old.max);
 assert.equal(enhanced.magicGemRate,tables.magicPlus['10'].ratio);
 assert.equal(enhanced.magicGemFlat,tables.magicPlus['10'].flat);
 assert.deepEqual(nums(hit({equipment:[{...enchanted,gem:{type:'physical',element:'fire'}}]})),nums(old));
 const buffed=hit({modifiers:{combat:{
  spellDamageEquipmentRate:0,priestSong:{sageElementDamage:21}},
  priestApplied:{priestEnchantment:{magicRate:15}}}});
 assert.ok(buffed.max>old.max);
 assert.equal(buffed.bonusRate,36);
 assert.equal(hit({modifiers:{combat:{spellDamageEquipmentRate:11,priestSong:{}},priestApplied:{}}}),undefined);
});
test('Hero Book shows numerical current hit, not ingredients or guessed burn totals',()=>{
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 const wiki=read('pandora-studio-wiki-skill-insights.js');
 assert.match(book,/heroPowerCoefficient!==0/);
 assert.match(book,/430056001,213608001\]\.includes\(id\)/);
 assert.match(book,/archery:'Стрельба'/);
 assert.match(app,/PandoraOSTargetDamage\?\.supportedSkillHits/);
 assert.doesNotMatch(book,/function materialSkillResults\(/);
 assert.match(wiki,/213608001/);
});
