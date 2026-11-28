import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const original=JSON.stringify(skills);
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const stats={vit:56,spi:84};
const resist=(bonuses={},overrides={})=>
 C.resistancePreview({stats,bonuses,...overrides});
const statusKeys=['burn','stun','numb','tumble','knockback','sleep',
 'silence','evil','curse','disease','madness','blockBreak'];
const elementKeys=['fire','ice','lightning','poison','charm','light','dark','magic'];
const malformed=[true,false,'17',[17],[],{},null,Infinity,-Infinity,NaN,''];

test('all 12 status resistances reject forged saved numbers instead of adding +1',()=>{
 assert.equal(statusKeys.length,12);
 for(const key of statusKeys)for(const value of malformed){
  assert.equal(resist({[key]:value}),null,
   'corrupted status: '+key+' / '+String(value));
 }
});

test('all eight elemental resistances reject strings, booleans and arrays',()=>{
 assert.equal(elementKeys.length,8);
 for(const key of elementKeys)for(const value of malformed){
  assert.equal(resist({[key]:value}),null,
   'corrupted element: '+key+' / '+String(value));
 }
});

test('the two combined status channels never silently swallow invalid values',()=>{
 for(const key of ['physicalStatus','mentalStatus'])for(const value of malformed){
  assert.equal(resist({[key]:value}),null,'corrupted combined '+key);
 }
});

test('valid positive, zero, signed and fractional source values retain exact math',()=>{
 const r=resist({fire:17,ice:-15,stun:12,physicalStatus:4,
  mentalStatus:5,charm:-3,magic:0,tumble:0.5});
 assert.equal(r.elements.fire,17);
 assert.equal(r.elements.ice,-15);
 assert.equal(r.elements.charm,-3);
 assert.equal(r.elements.magic,0);
 assert.equal(r.status.stun,12);
 assert.equal(r.status.tumble,0.5);
 assert.equal(r.states.physical,18);
 assert.equal(r.states.mental,26);
 assert.equal(r.verified,false);
});

test('an absent bonus remains zero, but explicit malformed value is not a zero',()=>{
 const plain=resist();
 assert.equal(plain.status.stun,0);
 assert.equal(plain.elements.fire,0);
 assert.equal(plain.states.physical,14);
 assert.equal(plain.states.mental,21);
 assert.equal(resist({stun:undefined})?.status.stun,0);
 assert.equal(resist({stun:null}),null);
 assert.equal(resist({stun:''}),null);
 assert.equal(resist({physicalStatus:undefined})?.states.physical,14);
});

test('current skill source racial status values still accumulate with equipment and honor',()=>{
 const base=resist({stun:7,numb:2,tumble:1},{
  skillCatalog:skills,racialPassiveId:900030001,honorTitle:4
 });
 assert.equal(base.status.stun,17);
 assert.equal(base.status.numb,17);
 assert.equal(base.status.tumble,11);
 assert.equal(base.elements.fire,0);
 assert.equal(base.verified,false);
});

test('genuine owned item and soul numeric effects still feed their correct channels',()=>{
 const id=705777,soul={id,effects:[
  {func:'EP_FIRE_RESISTANCE_CONST',a:7},
  {func:'EP_IMMUNE_STUN',a:9},
  {func:'EP_IMMUNE_VIT_TYPE',a:4}
 ]};
 const gathered=C.gatherEffects([['soul:'+id,soul,0]]);
 const current=resist(gathered.bonuses);
 assert.equal(current.elements.fire,7);
 assert.equal(current.status.stun,9);
 assert.equal(current.states.physical,18);
});

test('resistance input must be an object with finite character stats',()=>{
 for(const invalid of [null,false,[],undefined,'bad',{}]){
  assert.doesNotThrow(()=>C.resistancePreview({stats:invalid,bonuses:{}}));
  assert.equal(C.resistancePreview({stats:invalid,bonuses:{}}),null);
 }
 for(const invalid of [null,false,[],42,'bad']){
  assert.doesNotThrow(()=>C.resistancePreview({stats,bonuses:invalid}));
  assert.equal(C.resistancePreview({stats,bonuses:invalid}),null);
 }
 for(const field of ['vit','spi'])for(const invalid of [true,'56',[56],null,NaN,Infinity]){
  assert.equal(C.resistancePreview({stats:{...stats,[field]:invalid},bonuses:{}}),null);
 }
});

test('standing HP/MP recovery preserves historical numeric arithmetic',()=>{
 const r=C.recoveryAmountPreview({maxHp:3500,maxMp:2500,stats});
 assert.equal(r.hp.maxContribution,100);
 assert.equal(r.hp.attributeContribution,18);
 assert.equal(r.hp.known,118);
 assert.equal(r.mp.maxContribution,100);
 assert.equal(r.mp.attributeContribution,28);
 assert.equal(r.mp.known,128);
 assert.equal(r.verified,false);
});

test('malformed standing recovery and regeneration structures return null, not an exception',()=>{
 const recovery={maxHp:3500,maxMp:2500};
 for(const value of [null,false,[],'bad',{}]){
  assert.doesNotThrow(()=>C.recoveryAmountPreview({...recovery,stats:value}));
  assert.equal(C.recoveryAmountPreview({...recovery,stats:value}),null);
  assert.doesNotThrow(()=>C.regenerationPreview({stats:value,guild:{}}));
  assert.equal(C.regenerationPreview({stats:value,guild:{}}),null);
 }
 for(const value of [null,false,[],'bad']){
  assert.doesNotThrow(()=>C.regenerationPreview({stats,guild:value}));
  assert.equal(C.regenerationPreview({stats,guild:value}),null);
 }
 const noGuild=C.regenerationPreview({stats,guild:{}});
 assert.equal(noGuild.hp.total,5,'An empty valid guild selector is no bonuses');
 assert.equal(noGuild.mp.total,8);
});

test('genuine regeneration guild level selectors and negative equipment resistance are unaffected',()=>{
 const r=C.regenerationPreview({stats,guild:{
  guildLifeRecovery:1,guildManaRecovery:2,guildHealing:3
 }});
 assert.equal(r.hp.total,40);
 assert.equal(r.mp.total,46);
 assert.equal(resist({fire:-15,physicalStatus:-7}).elements.fire,-15);
 assert.equal(resist({fire:-15,physicalStatus:-7}).states.physical,7);
});

test('all 28 jobs x Lv1..55 preserve original source-only status formulas',()=>{
 let compared=0;
 for(const [job,entry] of Object.entries(jobs)){
  for(let level=1;level<=55;level++){
   const result=resist({},{
    skillCatalog:skills,jobKey:job,
    wardingMastery:0,wardingCap:entry.branchCaps.warding
   });
   assert.equal(result?.states.physical,14,job+' L'+level);
   assert.equal(result?.states.mental,21,job+' L'+level);
   for(const key of statusKeys)assert.equal(result.status[key],0);
   compared++;
  }
 }
 assert.equal(compared,1540);
 assert.equal(JSON.stringify(skills),original);
});
