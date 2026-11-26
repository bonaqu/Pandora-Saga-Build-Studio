import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const hp=(catalog=skills,spi=134,healing=41,level=45)=>
 C.alliedHpPulsePreview({skillCatalog:catalog,classCatalog:classes,
  casterLevel:level,casterSpi:spi,casterHealing:healing});
const mp=(catalog=skills,level=45)=>
 C.alliedNaturalRecoveryPreview({skillCatalog:catalog,casterLevel:level});

test('ally-owned HP/MP pulses retain the exact official current source values',()=>{
 const original=JSON.stringify(skills);
 const out=hp();
 assert.deepEqual(Object.keys(out),['regeneration','restoration']);
 assert.equal(out.regeneration.hpPerPulse,31);
 assert.equal(out.restoration.hpPerPulse,35);
 assert.equal(out.regeneration.intervalSourceValue,2);
 assert.equal(out.restoration.intervalSourceValue,2);
 assert.equal(mp()?.mpPerPulse,4);
 assert.equal(mp(skills,55)?.mpPerPulse,5);
 const cleric=C.periodicRecoveryPreview({
  jobKey:'CLERIC',level:45,spi:134,benevolence:41,
  benevolenceCap:classes.CLERIC.branchCaps.benevolence,
  skillCatalog:skills
 });
 assert.equal(cleric.rows.find(r=>r.id===310002001)?.amount,out.regeneration.hpPerPulse);
 assert.equal(cleric.rows.find(r=>r.id===310022001)?.amount,out.restoration.hpPerPulse);
 assert.equal(JSON.stringify(skills),original,'no source or D1 writes');
});

test('a later safe official FV1 revision replays in both ally and caster previews',()=>{
 const copy=structuredClone(skills);
 copy[310002001].funcs[0].fv1[0]=20;
 copy[310022001].funcs[0].fv1[3]=12;
 copy[330005001].funcs[0].fv1[1]=11;
 const out=hp(copy);
 assert.equal(out.regeneration.hpPerPulse,44);
 assert.equal(out.restoration.hpPerPulse,42);
 assert.equal(mp(copy,55)?.mpPerPulse,6);
 const cleric=C.periodicRecoveryPreview({
  jobKey:'CLERIC',level:45,spi:134,benevolence:41,
  benevolenceCap:classes.CLERIC.branchCaps.benevolence,
  skillCatalog:copy
 });
 assert.equal(cleric.rows.find(r=>r.id===310002001)?.amount,44);
 assert.equal(cleric.rows.find(r=>r.id===310022001)?.amount,42);
});

test('new unknown dependencies, invalid vectors, FX2 and access drift fail closed',()=>{
 const failHp=[
  catalog=>{catalog[310002001].funcs[0].fv1[1]=NaN;},
  catalog=>{catalog[310002001].funcs[0].fv1[0]=-1;},
  catalog=>{catalog[310002001].funcs[0].fv1[3]=50000;},
  catalog=>{catalog[310002001].funcs[0].fv2[3]=3;},
  catalog=>{catalog[310002001].funcs[0].ep='EP_ELEMENT_DAMAGE';},
  catalog=>{catalog[310002001].classes.CLERIC=0;}
 ];
 for(const mutate of failHp){
  const copy=structuredClone(skills);mutate(copy);
  const out=hp(copy);
  assert.equal(out.regeneration,undefined,'bad Regeneration source cannot be a model');
  assert.equal(out.restoration.hpPerPulse,35,'unaffected sibling survives');
 }
 const failMp=[
  catalog=>{catalog[330005001].funcs[0].fv1[0]=1;},
  catalog=>{catalog[330005001].funcs[0].fv1[2]=1;},
  catalog=>{catalog[330005001].funcs[0].fv1[1]=-1;},
  catalog=>{catalog[330005001].funcs[0].fv2[3]=3;},
  catalog=>{catalog[330005001].funcs[0].ep='EP_HEAL_LIFE';}
 ];
 for(const mutate of failMp){
  const copy=structuredClone(skills);mutate(copy);
  assert.equal(mp(copy),null);
 }
 const missing=structuredClone(skills);delete missing[310002001];
 assert.equal(hp(missing).regeneration,undefined);
 assert.equal(hp(missing).restoration.hpPerPulse,35);
});
