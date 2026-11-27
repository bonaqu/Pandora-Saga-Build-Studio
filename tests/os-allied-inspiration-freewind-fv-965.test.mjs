import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const inspire=source=>C.alliedInspirationPreview({skillCatalog:source});
const wind=source=>C.alliedFreeWindPreview({skillCatalog:source,classCatalog:classes});

test('both current OS ally source values and historical Remaked model outputs remain intact',()=>{
 const before=JSON.stringify(skills);
 assert.deepEqual(skills['320006001'].funcs.find(f=>f.ep==='EP_SKILL_DELAY_FIN').fv1,
  [0,0,0,50]);
 assert.deepEqual(skills['260010001'].funcs.find(f=>f.ep==='EP_MOVESPEED_SCALE').fv1,
  [0,0,0,200]);
 assert.deepEqual(inspire(skills),{
  id:320006001,castTimePercent:50,castTimeReductionPercent:50,
  speedMultiplier:2,sourceConfirmed:true
 });
 assert.deepEqual(wind(skills),{
  id:260010001,bonus:200,source:'current OS EP_MOVESPEED_SCALE',
  endsOnMapChange:true,sourceConfirmed:true
 });
 assert.equal(JSON.stringify(skills),before);
});

test('all official same-shape cast and movement coefficients replay directly from FV1',()=>{
 let checked=0;
 for(let pct=1;pct<=100;pct++){
  const catalog=structuredClone(skills);
  catalog['320006001'].funcs.find(f=>f.ep==='EP_SKILL_DELAY_FIN').fv1[3]=pct;
  const x=inspire(catalog);
  assert.equal(x.castTimePercent,pct);
  assert.equal(x.castTimeReductionPercent,100-pct);
  assert.equal(x.speedMultiplier,100/pct);
  assert.equal(x.sourceConfirmed,true);
  checked++;
 }
 for(let bonus=0;bonus<=1000;bonus+=4){
  const catalog=structuredClone(skills);
  catalog['260010001'].funcs.find(f=>f.ep==='EP_MOVESPEED_SCALE').fv1[3]=bonus;
  const x=wind(catalog);
  assert.equal(x.bonus,bonus);
  assert.equal(x.endsOnMapChange,true);
  checked++;
 }
 assert.equal(checked,351);
});

test('unverified source changes fail closed without losing unrelated active buffs',()=>{
 const invalidInspire=[
  f=>{f.fv1[0]=1},f=>{f.fv1[1]=5},f=>{f.fv1[2]=10},
  f=>{f.fv1[3]=0},f=>{f.fv1[3]=101},f=>{f.fv2[0]=1},
  f=>{f.dir='CASTER'},f=>{f.ep='EP_UNKNOWN'}
 ];
 for(const change of invalidInspire){
  const altered=structuredClone(skills);
  change(altered['320006001'].funcs.find(f=>f.ep==='EP_SKILL_DELAY_FIN'));
  assert.equal(inspire(altered),null);
  assert.equal(wind(altered)?.bonus,200);
 }
 const invalidWind=[
  f=>{f.fv1[0]=1},f=>{f.fv1[1]=1},f=>{f.fv1[2]=1},
  f=>{f.fv1[3]=-1},f=>{f.fv1[3]=1001},f=>{f.fv2[2]=1},
  f=>{f.dir='CASTER'},f=>{f.ep='EP_UNKNOWN'}
 ];
 for(const change of invalidWind){
  const altered=structuredClone(skills);
  change(altered['260010001'].funcs.find(f=>f.ep==='EP_MOVESPEED_SCALE'));
  assert.equal(wind(altered),null);
  assert.equal(inspire(altered)?.castTimePercent,50);
 }
 const removed=structuredClone(skills);
 removed['260010001'].funcs.splice(1,1);
 assert.equal(wind(removed),null,'map-change cancellation must remain present');
 const below=structuredClone(classes);
 below.SNIPER.branchCaps.warding=65;
 assert.equal(C.alliedFreeWindPreview({skillCatalog:skills,classCatalog:below}),null);
});

test('live OS coefficient models are independent of recipient class and never change source catalog',()=>{
 const snapshot=JSON.stringify(skills);
 const caster=structuredClone(skills);
 caster['320006001'].funcs[0].fv1[3]=75;
 caster['260010001'].funcs[0].fv1[3]=225;
 for(const job of Object.keys(classes))for(let level=1;level<=55;level++){
  const i=inspire(caster),w=wind(caster);
  assert.equal(i.castTimePercent,75);
  assert.equal(w.bonus,225);
  assert.equal(i.sourceConfirmed,true);
  assert.equal(w.endsOnMapChange,true);
 }
 assert.equal(JSON.stringify(skills),snapshot);
});
