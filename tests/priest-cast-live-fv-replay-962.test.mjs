import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const args={spi:134,blessing:90,hymn:30,exorcism:26};
const cast=(catalog=skills,extra={})=>C.priestCastPreviews({...args,...extra,skills:catalog});
const definitions=[
 [320007001,'EP_ATTACKINTERVAL_SCALE','gratia',0,11,23],
 [320008001,'EP_ARMORCLASS_CONST','lapisMedio',0,4,13],
 [320003001,'EP_ONDAMAGE_FIN_DAMAGE_SCALE','groupBarrier',2,-22,-29],
 [330051001,'EP_AURAHOLY_CONSTANT','holyWeapon',0,7,11]
];

test('the 4 current OS spell vectors reproduce unchanged Remaked-stage magnitudes',()=>{
 assert.deepEqual(definitions.map(([,ep,key])=>[ep,key,cast()[key]]),[
  ['EP_ATTACKINTERVAL_SCALE','gratia',22],
  ['EP_ARMORCLASS_CONST','lapisMedio',12],
  ['EP_ONDAMAGE_FIN_DAMAGE_SCALE','groupBarrier',-28],
  ['EP_AURAHOLY_CONSTANT','holyWeapon',10]
 ]);
 assert.equal(cast().verified,false);
 const unchanged=JSON.stringify(skills);
 for(const [id,ep,key,slot,value,expected] of definitions){
  const copy=structuredClone(skills);
  const effect=copy[String(id)].funcs.find(f=>f.ep===ep);
  assert.ok(effect);
  effect.fv1[slot]=value;
  const updated=cast(copy);
  assert.equal(updated[key],expected,id+' must use updated FV1, not a hardcoded old coefficient');
  assert.equal(updated.verified,false);
  for(const [,otherEp,otherKey] of definitions){
   if(otherEp!==ep)assert.equal(updated[otherKey],cast()[otherKey],
    'unrelated spells must stay independent');
  }
 }
 assert.equal(JSON.stringify(skills),unchanged);
});

test('unknown caster level, source direction, FV2, class access and unsupported coeffs fail closed',()=>{
 for(const [id,ep,key] of definitions){
  for(const mutate of [
   f=>{f.fv1[1]=1}, // Level dependence not passed to this preview.
   f=>{f.fv2[0]=1}, // Second undocumented effect.
   f=>{f.dir='CASTER'},
   f=>{f.fv1[0]=Infinity}
  ]){
   const copy=structuredClone(skills);
   mutate(copy[String(id)].funcs.find(f=>f.ep===ep));
   assert.equal(cast(copy)[key],null,id+' unknown source must be rejected');
  }
  const meta=structuredClone(skills);
  meta[String(id)].classes.CLERIC=0;
  assert.equal(cast(meta)[key],null,id+' missing class source');
  const unmodeled=structuredClone(skills);
  unmodeled[String(id)].reqs[0].amount++;
  assert.equal(cast(unmodeled)[key],null,id+' altered access requirement');
 }
 const garbled=structuredClone(skills);
 garbled['320007001'].funcs[1].ep='EP_SKILL_EXEC';
 assert.equal(cast(garbled).gratia,null,'new Gratia side effect needs separate model review');
 const holy=structuredClone(skills);
 holy['330051001'].funcs[0].fv1[2]=1;
 assert.equal(cast(holy).holyWeapon,null,'holy model lacks mastery dependency');
 const wrongSign=structuredClone(skills);
 wrongSign['320003001'].funcs[0].fv1[2]=+20;
 assert.equal(cast(wrongSign).groupBarrier,null,'barrier sign change needs review');
});

test('negative Group Barrier floors magnitude before applying the sign, not floor(-x)',()=>{
 const alt=structuredClone(skills);
 alt['320003001'].funcs[0].fv1[2]=-21;
 const p=cast(alt,{blessing:91});
 assert.equal(p.groupBarrier,-29);
 assert.notEqual(p.groupBarrier,-10+Math.floor(91*(-21)/100),
  'the historical Remaked floor stage must not change under a source update');
});

test('all four source magnitude models remain unverified and independent of receiver level/class',()=>{
 for(let level=1;level<=55;level++)for(const job of [
  'WARRIOR','GENERAL','CLERIC','ENCHANTER','MAGE','WARLOCK','SCOUT'
 ]){
  const p=cast();
  assert.equal(p.gratia,22);
  assert.equal(p.lapisMedio,12);
  assert.equal(p.groupBarrier,-28);
  assert.equal(p.holyWeapon,10);
  assert.equal(p.verified,false);
  assert.ok(job&&level,'unverified independent external caster only');
 }
 const source=read('pandora-os-character-calculator.js');
 assert.match(source,/Number.isSafeInteger\(priestCast.gratia\)\?priestCast.gratia:null/);
 assert.match(source,/Number.isSafeInteger\(priestCast.groupBarrier\)\?priestCast.groupBarrier:0/);
 assert.doesNotMatch(source,/priestSourceMatches\(320007001/);
});
