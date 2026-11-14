import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-studio-target-damage.js'))(host);
const C=host.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const monsters=JSON.parse(read('data/os/monsters.json'));
const en=JSON.parse(read('data/os/strings.en.json'));
const bare={combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}};
const options=(extra={})=>({
 skillCatalog:skills,classes,jobKey:'DISTURBANCE',level:45,
 branchCaps:classes.DISTURBANCE.branchCaps,masteries:{trap:41},
 stats:{dex:70,int:20},equipment:[],itemForth:{},unison:{},
 tables,monsters,englishMonsters:en.monsters,modifiers:bare,...extra});
const trap=extra=>C.crawlingTrap(options(extra));
const hit=(extra,id=240005001)=>
 C.supportedSkillHits(options(extra)).find(row=>row.skillId===id);

test('all 702 canonical live/archive monster entries are selectable, with original RU/EN and level',()=>{
 const choices=C.availableMonsterTargets({monsters,englishMonsters:en.monsters});
 assert.equal(choices.length,Object.keys(monsters).length);
 assert.equal(new Set(choices.map(x=>x.id)).size,choices.length);
 assert.deepEqual(choices.find(x=>x.id===22104),{
  id:22104,name:'Гигантский огр',nameEn:en.monsters['22104']?.n||'Ogre Bouncer',
  level:53});
 assert.equal(choices.find(x=>x.id===11104)?.name,'Рыжий динго');
 assert.ok(choices.every(x=>x.level>=1&&x.id>0));
});
test('default Ogre remains exact legacy vector, explicit other monster changes real target and damage',()=>{
 const baseline=trap();
 assert.deepEqual([baseline.min,baseline.average,baseline.max],[34,148,194]);
 const dingo=trap({targetMonsterId:11104});
 assert.ok(dingo);
 assert.equal(dingo.monsterId,11104);
 assert.equal(dingo.targetName,monsters['11104'].name);
 assert.equal(dingo.targetNameEn,en.monsters?.['11104']?.n||monsters['11104'].name);
 assert.equal(dingo.targetElementResistance,monsters['11104'].resists.fire);
 assert.notDeepEqual([dingo.min,dingo.average,dingo.max],
  [baseline.min,baseline.average,baseline.max]);
 const batched=hit({targetMonsterId:11104});
 assert.deepEqual([batched.min,batched.average,batched.max],
  [dingo.min,dingo.average,dingo.max]);
 assert.equal(hit({targetMonsterId:22104}).average,148);
});
test('same target ID reacts to live resistance changes, no cache across calls',()=>{
 const selected=trap({targetMonsterId:11104});
 const altered=structuredClone(monsters);
 altered['11104'].resists.fire=75;
 assert.ok(trap({monsters:altered,targetMonsterId:11104}).average<selected.average);
 assert.equal(trap({targetMonsterId:11104}).average,selected.average);
 assert.equal(trap().average,148);
});
test('missing, malformed or unverified target never yields a fake Ogre result',()=>{
 assert.equal(trap({targetMonsterId:11104,monsters:undefined}),null);
 assert.equal(trap({targetMonsterId:999999}),null);
 assert.equal(trap({targetMonsterId:'11104'}),null);
 assert.equal(trap({targetMonsterId:0}),null);
 const broken=structuredClone(monsters);
 delete broken['11104'].resists.magic;
 assert.equal(trap({targetMonsterId:11104,monsters:broken}),null);
 assert.deepEqual(C.supportedSkillHits(options({
  targetMonsterId:11104,monsters:broken})),[]);
 const choices=C.availableMonsterTargets({
  monsters:broken,englishMonsters:en.monsters});
 assert.equal(choices.some(x=>x.id===11104),false);
 assert.equal(choices.some(x=>x.id===22104),true);
 assert.deepEqual(C.availableMonsterTargets({monsters:null}),[]);
});
test('book choice is a focused native select; monster ID comes from current D1, not hardcoded Ogre',()=>{
 const book=read('pandora-studio-hero-book.js');
 const app=read('pandora-studio-app.js');
 assert.match(book,/data-book-setting':'damageTarget'/);
 assert.match(book,/onTargetMonster\(Number\(event\.target\.value\)\)/);
 assert.match(book,/result\.monsterId!==targetMonsterId/);
 assert.match(app,/targetMonsterId:activeDamageTargetId/);
 assert.match(app,/const activeDamageTargetId=selectedDamageTargetId/);
 assert.match(book,/if\(!targetAvailable\)fragment\.append/);
 assert.match(app,/currentDamageTargetChoices\(ogreMonsters\)/);
 assert.match(app,/selectedDamageTargetId=id/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
});
