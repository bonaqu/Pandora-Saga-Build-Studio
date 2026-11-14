import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const win={};Function('window',read('pandora-studio-target-damage.js'))(win);
const OS=win.PandoraOSTargetDamage;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const tables=JSON.parse(read('data/os/tables.json'));
const monsters=JSON.parse(read('data/os/monsters.json'));
const items=JSON.parse(read('data/os/items.json'));
const itemForth=JSON.parse(read('data/os/itemForth.json'));
const unison=JSON.parse(read('data/os/unison.json'));
const noBuff={combat:{spellDamageEquipmentRate:0,priestSong:{}},priestApplied:{}};
const base=(args={})=>({
 skillCatalog:skills,classes,monsters,tables,itemForth,unison,
 jobKey:'DISTURBANCE',level:45,masteries:{trap:41},
 branchCaps:classes.DISTURBANCE.branchCaps,
 stats:{dex:70,int:20},equipment:[],modifiers:noBuff,...args
});
const one=(args={})=>OS.crawlingTrap(base(args));
const spells=(args={})=>OS.supportedSkillHits(base(args));
const byId=(args,id)=>spells(args).find(r=>r.skillId===id);
const compare=(current,options,key)=>{
 const candidate={...options};
 if(key==='mastery')candidate.masteries={
  ...options.masteries,[current.heroMasteryKey]:current.nextHitImprovements.mastery.value
 };
 else{
  const chosen=current.nextHitImprovements[key];
  if(!chosen)return null;
  candidate.stats={...options.stats,[chosen.key]:chosen.value};
 }
 return current.skillId===240005001?one(candidate):byId(candidate,current.skillId);
};
function verifyFirst(current,options,key){
 const proposed=current.nextHitImprovements[key];
 assert.ok(proposed,'Expected '+key+' for '+current.skillId);
 assert.ok(Number.isSafeInteger(proposed.averageGain)&&proposed.averageGain>0);
 const updated=compare(current,options,key);
 assert.ok(updated,'Expected source-computed comparison '+key);
 assert.equal(updated.average-current.average,proposed.averageGain);
 const initial=key==='mastery'?
  options.masteries[current.heroMasteryKey]:options.stats[proposed.key];
 assert.equal(proposed.needed,proposed.value-initial);
 for(let value=initial+1;value<proposed.value;value++){
  const earlier={...options};
  if(key==='mastery')earlier.masteries={
   ...options.masteries,[current.heroMasteryKey]:value
  };
  else earlier.stats={...options.stats,[proposed.key]:value};
  const old=current.skillId===240005001?one(earlier):byId(earlier,current.skillId);
  assert.ok(old);
  assert.ok(old.average<=current.average,
   'No earlier mastery or stat value may increase the hit average');
 }
}
test('0.786 Ogre 34–148–194 unchanged; finds first real INT, DEX and green mastery improvements',()=>{
 const options=base(),h=one();
 assert.deepEqual([h.min,h.average,h.max],[34,148,194]);
 assert.equal(h.heroPowerKey,'dex');
 for(const key of ['mastery','primary','int'])verifyFirst(h,options,key);
});
test('Full OS hit range used for every future value; target selection changes next thresholds',()=>{
 const ogre=one(),dingo=one({targetMonsterId:11104});
 assert.ok(dingo);
 assert.notEqual(ogre.average,dingo.average);
 for(const monsterId of [22104,11104,600,11101]){
  const options=base({targetMonsterId:monsterId});
  const value=one(options);
  assert.ok(value);
  for(const key of ['mastery','primary','int']){
   const next=value.nextHitImprovements[key];
   if(next)verifyFirst(value,options,key);
  }
 }
});
test('Source class cap is a hard boundary for mastery progress, even when INT still helps',()=>{
 const cap=classes.DISTURBANCE.branchCaps.trap;
 const h=one({masteries:{trap:cap}});
 assert.ok(h);
 assert.equal(h.nextHitImprovements.mastery,null);
 assert.ok(h.nextHitImprovements.int===null||
  h.nextHitImprovements.int.key==='int');
});
test('Confirmed direct and linked spell school each reports actual next step under current gear and buffs',()=>{
 const options=base({jobKey:'WARLOCK',level:45,
  branchCaps:classes.WARLOCK.branchCaps,
  masteries:{element:70,darkness:25,exorcism:20,charm:20},
  stats:{str:55,dex:65,int:80,spi:50},
  targetMonsterId:11104});
 for(const id of [410001001,410011001,410012001,
  410022001,430001001,420003001]){
  const h=byId(options,id);
  assert.ok(h,'OS skill must exist and be learnable '+id);
  for(const key of ['int','mastery','primary']){
   const future=h.nextHitImprovements[key];
   if(future)verifyFirst(h,options,key);
  }
 }
});
test('Current Warlock one-use Concentration changes when Elemental mastery advances',()=>{
 const options=base({jobKey:'WARLOCK',level:55,
  branchCaps:classes.WARLOCK.branchCaps,
  masteries:{element:80,darkness:25,exorcism:20,charm:20},
  stats:{str:55,dex:65,int:90,spi:50},
  nextMagicConcentration:true});
 const source=byId(options,410001001);
 assert.ok(source&&source.nextMagicRate>0);
 const next=source.nextHitImprovements.mastery;
 if(next)verifyFirst(source,options,'mastery');
 const off=byId({...options,nextMagicConcentration:false},410001001);
 assert.ok(off&&off.average<source.average);
});
test('On-hit stat with ZERO OS coefficient never promises a false primary-stat milestone',()=>{
 const source=read('pandora-studio-target-damage.js');
 assert.match(source,/powerKey!=='int'&&fv\[0\]>0/);
 const direct=OS.directSpells.find(x=>x.id===410001001);
 assert.ok(direct);
 const sniper=OS.linkedSpells.find(x=>x.id===213608001);
 assert.ok(sniper&&sniper.path.some(node=>node.effects.some(f=>
  f[0]==='EP_ELEMENT_DAMAGE'&&f[2][0]===0)));
});
test('Current D1 source mutation must recalculate future hit gains; no result caching',()=>{
 const options=base({targetMonsterId:11104});
 const original=one(options);
 const modified=structuredClone(monsters);
 modified['11104'].resists.fire=85;
 const changed=one({...options,monsters:modified});
 assert.ok(changed);
 assert.ok(changed.average<original.average);
 assert.equal(one(options).average,original.average);
 for(const key of ['mastery','int','primary']){
  const future=changed.nextHitImprovements[key];
  if(future)verifyFirst(changed,{...options,monsters:modified},key);
 }
});
test('Book shows at most one new bilingual line in existing disclosure; no recipes or status totals',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/nextHitImprovements/);
 assert.match(book,/Следующий прирост среднего удара/);
 assert.match(book,/Next higher average hit/);
 assert.match(book,/nextHitParts\.join\(' · '\)/);
 assert.doesNotMatch(book,/stage-material-actions|function materialSkillResults\(/);
 const os=read('pandora-studio-target-damage.js');
 assert.match(os,/seekIncrease/);
 assert.match(os,/powerPoints\(/);
 assert.match(os,/points=sourcePoints/);
});
