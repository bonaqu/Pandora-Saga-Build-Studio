import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const a=app.indexOf('function sanitizeSharedState(original){');
const b=app.indexOf('\nasync function createShared(',a);
assert.ok(a>0&&b>a,'shared sanitizer must exist');
const slice=app.slice(a,b);
function sanitizer(){
 const races=Array(6).fill(['Раса']),jobKeys=Array(28).fill('CLASS'),slots=Array(14);
 const branches=[{id:'slash'}],STATS=['Сила','Дух'];
 const fresh=()=>({
  race:0,gender:0,job:0,level:1,name:'Билд',branch:'slash',
  points:{slash:0},stats:{Сила:0,Дух:0},mastery:{},
  vitalsBuffs:{guildHp:0,guildMp:0,lifeSign:false},
  attributeBuffs:{guildAll:0,honorCuriosity:false,honorTitle:null,proelium:false,proeliumPotency:0,runeJoEun:false,potionEffectsEnabled:false},
  equipment:{},souls:{},refinements:{},gems:{},profile:{guild:'',nation:'',rank:'',about:''}
 });
 const window={PandoraSkillProgression:{potential:()=>0},
  PandoraEquipmentPlan:{asSocketArray:()=>[]},PandoraEnchantModel:{normalize:()=>null},
  PandoraOSCalculator:{honorTitles:Array.from({length:14},(_,id)=>({id}))}};
 return Function('races','jobKeys','slots','branches','STATS','fresh','window',
  slice+'\nreturn sanitizeSharedState')(races,jobKeys,slots,branches,STATS,fresh,window);
}
test('shared build retains explicit HP and MP guild buffs and Life Sign',()=>{
 const sanitize=sanitizer();
 const original={race:0,job:0,level:45,name:'Клирик',
  vitalsBuffs:{guildHp:6,guildMp:3,lifeSign:true}};
 const safe=sanitize(original);
 assert.deepEqual(safe.vitalsBuffs,{guildHp:6,guildMp:3,lifeSign:true});
 assert.equal(safe.level,45);
});
test('legacy shared builds default to disabled, rather than invented, buffs',()=>{
 const safe=sanitizer()({race:0,job:0,level:45});
 assert.deepEqual(safe.vitalsBuffs,{guildHp:0,guildMp:0,lifeSign:false});
});
test('remote invalid levels and non-boolean Life Sign cannot activate buffs',()=>{
 const safe=sanitizer()({race:0,job:0,level:45,
  vitalsBuffs:{guildHp:100,guildMp:-1,lifeSign:'true'}});
 assert.deepEqual(safe.vitalsBuffs,{guildHp:0,guildMp:0,lifeSign:false});
});

test('Remaked attribute bonuses survive export and sharing without changing invested stats',()=>{
 const sanitize=sanitizer();
 const safe=sanitize({race:0,job:0,level:45,stats:{Сила:8,Дух:9},
  attributeBuffs:{guildAll:4,honorCuriosity:true,proelium:true,proeliumPotency:70}});
 assert.deepEqual(safe.attributeBuffs,{
  guildAll:4,honorCuriosity:true,honorTitle:null,proelium:true,proeliumPotency:70,runeJoEun:false});
 assert.equal(safe.stats['Сила'],8);
 assert.equal(safe.stats['Дух'],9);
});
test('malformed shared attribute buff values cannot activate Honor, guild or potion effects',()=>{
 const safe=sanitizer()({race:0,job:0,level:45,
  attributeBuffs:{guildAll:9,honorCuriosity:'true',proelium:1,proeliumPotency:10000}});
 assert.deepEqual(safe.attributeBuffs,{
  guildAll:0,honorCuriosity:false,honorTitle:null,proelium:false,proeliumPotency:0,runeJoEun:false,potionEffectsEnabled:false});
});

test('exclusive Honor title and Jo-eun rune survive validated links',()=>{
 const safe=sanitizer()({race:0,job:0,level:45,attributeBuffs:{
  honorTitle:11,honorCuriosity:true,runeJoEun:true,potionEffectsEnabled:true}});
 assert.equal(safe.attributeBuffs.honorTitle,11);
 assert.equal(safe.attributeBuffs.honorCuriosity,false);
 assert.equal(safe.attributeBuffs.runeJoEun,true);
 assert.equal(safe.attributeBuffs.potionEffectsEnabled,true);
});
test('invalid honor title is rejected, never activated from outside',()=>{
 const safe=sanitizer()({race:0,job:0,level:45,attributeBuffs:{
  honorTitle:999,honorCuriosity:'true',runeJoEun:'true',potionEffectsEnabled:'true'}});
 assert.equal(safe.attributeBuffs.honorTitle,null);
 assert.equal(safe.attributeBuffs.honorCuriosity,false);
 assert.equal(safe.attributeBuffs.runeJoEun,false);
 assert.equal(safe.attributeBuffs.potionEffectsEnabled,false);
});
