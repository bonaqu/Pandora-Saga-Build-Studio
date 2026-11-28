import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const snapshot=JSON.stringify(skills),scope={};
Function('window',read('pandora-os-character-calculator.js'))(scope);
const C=scope.PandoraOSCalculator;
const stats={vit:50,str:50,agi:60,dex:50,spi:50,int:50};
const sourcePriest={lapisMedio:12,gratia:22,minstrel:24,
 sageElementDamage:16,sageCooldownDelta:-47};
const combat=(priestEffects=sourcePriest,other={})=>C.combatPreview({
 stats,level:45,jobKey:'CLERIC',records:[],branchCaps:jobs.CLERIC.branchCaps,
 skillCatalog:skills,priestEffects,...other
});
const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
const hero=(attributes={},externalPriest={})=>C.base({
 classData:jobs.WARRIOR,
 raceData:{vit:40,str:50,agi:30,dex:20,spi:70,int:15},
 jobData:zero,allocation:zero,level:45,
 attributeBuffs:attributes,
 combatContext:{jobKey:'WARRIOR',skillCatalog:skills,
  branchMasteries:{},externalPriest}
});
const pulse=(attributes={})=>hero({
 remakedSkillIds:[330005001],...attributes
})?.allyNaturalRecovery;

test('all five canonical priest effects preserve their original source-derived numeric values',()=>{
 const r=combat();
 assert.equal(r.defense.priestBonus,12);
 assert.equal(r.defense.known,12);
 assert.equal(r.attackSpeed.priestBonus,22);
 assert.equal(r.priestSong.minstrel,24);
 assert.equal(r.priestSong.sageElementDamage,16);
 assert.equal(r.priestSong.sageCooldownDelta,-47);
 assert.equal(r.priestSong.verified,false);
});

test('Boolean, numeric string, object and one-element array never grant priest effects',()=>{
 const invalid=[true,false,'20',[20],[],{},null,Infinity,NaN];
 for(const key of Object.keys(sourcePriest))for(const value of invalid){
  const copy={...sourcePriest,[key]:value},r=combat(copy);
  assert.ok(r,key+' invalid data must not crash or hide hero');
  const actual=key==='lapisMedio'?r.defense.priestBonus:
   key==='gratia'?r.attackSpeed.priestBonus:r.priestSong[key];
  assert.equal(actual,0,key+' forged '+String(value));
  if(key!=='gratia')assert.equal(r.attackSpeed.priestBonus,22,
   'Unrelated genuine priest effects remain');
 }
});

test('null and primitive priest containers safely contribute zero and preserve hero sheet',()=>{
 for(const bad of [null,false,[],{},'bad',23]){
  const r=combat(bad);
  assert.ok(r);
  assert.equal(r.defense.priestBonus,0);
  assert.equal(r.attackSpeed.priestBonus,0);
  assert.equal(r.priestSong.minstrel,0);
  assert.equal(r.priestSong.sageElementDamage,0);
  assert.equal(r.priestSong.sageCooldownDelta,0);
 }
});

test('real signed Sage values are preserved while DEF and speed cannot become negative',()=>{
 const r=combat({lapisMedio:-3,gratia:-7,minstrel:-9,
  sageElementDamage:-4,sageCooldownDelta:-30});
 assert.equal(r.defense.priestBonus,0);
 assert.equal(r.attackSpeed.priestBonus,0);
 assert.equal(r.priestSong.minstrel,0);
 assert.equal(r.priestSong.sageElementDamage,-4);
 assert.equal(r.priestSong.sageCooldownDelta,-30);
});

test('valid incoming critical equipment reductions remain exact signed numbers',()=>{
 assert.equal(combat({}, {bonuses:{incomingCriticalReduction:7}}).criticalIncoming,-7);
 assert.equal(combat({}, {bonuses:{incomingCriticalReduction:-5}}).criticalIncoming,5);
 assert.equal(combat({}, {bonuses:{incomingCriticalReduction:0}}).criticalIncoming,0);
 assert.equal(combat({}, {bonuses:{}}).criticalIncoming,0);
});

test('forged incoming critical reductions cannot become a resistance via Number coercion',()=>{
 for(const bad of [true,false,'5',[5],[],{},null,Infinity,NaN,'']){
  assert.equal(combat({}, {bonuses:{incomingCriticalReduction:bad}}),null,
   'Invalid critical reducer: '+String(bad));
 }
});

test('malformed direct combat source containers do not throw',()=>{
 for(const bad of [null,false,[],{},'bad']){
  const payload={stats:bad,bonuses:{}};
  assert.doesNotThrow(()=>combat({},payload));
  assert.equal(combat({},payload),null);
 }
 for(const bad of [null,false,[],'bad']){
  const payload={stats,bonuses:bad};
  assert.doesNotThrow(()=>combat({},payload));
  assert.equal(combat({},payload),null);
 }
 assert.ok(combat({}, {bonuses:{}}),
  'An empty well-formed bonus dictionary is a valid zero-bonus source');
});

test('real selected priest effects still match canonical source FV and caster gates',()=>{
 const external={enabled:true,spi:134,blessing:90,hymn:30};
 const fromCatalog=C.priestCastPreviews({...external,skills});
 const r=hero({priestEnabled:true,priestGratia:true,priestLapisMedio:true,
  remakedSkillIds:[340001001,340004001]},external);
 assert.equal(fromCatalog.lapisMedio,12);
 assert.equal(fromCatalog.gratia,22);
 assert.equal(r.combat.defense.priestBonus,fromCatalog.lapisMedio);
 assert.equal(r.combat.attackSpeed.priestBonus,fromCatalog.gratia);
 assert.equal(r.combat.priestSong.minstrel,fromCatalog.minstrel);
 assert.equal(r.combat.priestSong.sageElementDamage,fromCatalog.sage);
 assert.equal(r.combat.priestSong.sageCooldownDelta,fromCatalog.sageCooldownDelta);
 assert.equal(r.priestCast.verified,false);
});

test('valid numerical allied Natural Recovery caster levels retain current source pulse math',()=>{
 const official=skills[330005001],fv=official.funcs[0].fv1;
 for(const level of [20,30,45,55]){
  const expected=fv[3]+Math.floor(level*fv[1]/100);
  assert.equal(pulse({allyNaturalLevel:level})?.mpPerPulse,expected);
  assert.equal(pulse({allyNaturalLevel:level})?.casterLevel,level);
 }
 assert.equal(pulse({})?.casterLevel,45,'Absent field keeps genuine default');
 assert.equal(pulse({})?.mpPerPulse,4);
});

test('forged string, Boolean, array or null caster level cannot grant independent MP pulse',()=>{
 const forged=['45',[45],true,false,null,{},[],56,19,20.5,NaN];
 for(const level of forged){
  const r=pulse({allyNaturalLevel:level});
  assert.equal(r,null,'Untrusted caster level: '+String(level));
  const other=hero({remakedSkillIds:[] ,allyNaturalLevel:level});
  assert.equal(other?.allyNaturalRecovery,null);
  assert.ok(other?.combat,'Unrelated character remains usable');
 }
});

test('all 28 jobs x levels 1–55 retain canonical numeric priest effect projections',()=>{
 let compared=0;
 for(const [job,info] of Object.entries(jobs)){
  for(let level=1;level<=55;level++){
   const r=C.combatPreview({stats,level,jobKey:job,
    records:[],branchCaps:info.branchCaps,skillCatalog:skills,
    priestEffects:sourcePriest});
   assert.equal(r?.defense.priestBonus,12,job+' L'+level);
   assert.equal(r?.attackSpeed.priestBonus,22);
   assert.equal(r?.priestSong.minstrel,24);
   assert.equal(r?.priestSong.sageCooldownDelta,-47);
   assert.equal(r?.attack.verified,false);
   compared++;
  }
 }
 assert.equal(compared,1540);
 assert.equal(JSON.stringify(skills),snapshot);
});
