import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const env={};
Function('window',read('pandora-os-character-calculator.js'))(env);
const C=env.PandoraOSCalculator;
const sourceId='260007001',original=skills[sourceId];
const stats={vit:50,str:55,agi:65,dex:60,spi:80,int:45};
const combat={attack:{walkingBase:200},defense:{directRaw:100},
 accuracy:{base:130},dodge:{base:125}};
const create=(mutate)=>{
 const snapshot={...skills,[sourceId]:structuredClone(original)};
 mutate(snapshot[sourceId]);
 return snapshot;
};
const preview=(job='SNIPER',green=26,catalog=skills)=>{
 const caps=classes[job].branchCaps;
 return C.scalingSkillPreview({skillCatalog:catalog,jobKey:job,level:45,
  branchCaps:caps,branchMasteries:{warding:green},stats,combat})
  .defense.find(row=>row.id===Number(sourceId));
};
const resist=(job='SNIPER',green=26,catalog=skills)=>{
 const caps=classes[job].branchCaps;
 return C.resistancePreview({stats,jobKey:job,wardingMastery:green,
  wardingCap:caps.warding,skillCatalog:catalog});
};
const passive=(job='SNIPER',green=26,catalog=skills)=>C.wardingStatusPassive({
 jobKey:job,wardingMastery:green,wardingCap:classes[job].branchCaps.warding,
 skillCatalog:catalog
});

test('current OS passive: all four effects, three distinct TARGET amounts, no CASTER double count',()=>{
 assert.deepEqual(original.funcs.map(row=>[row.ep,row.dir,row.fv1[3]]),[
  ['EP_IMMUNE_TUMBLE','TARGET',15],['EP_IMMUNE_STUN','TARGET',15],
  ['EP_IMMUNE_NUMB','TARGET',15],['EP_IMMUNE_NUMB','CASTER',15]
 ]);
 assert.deepEqual(passive(),{stun:15,numb:15,tumble:15});
 const book=resist(),effects=preview();
 assert.equal(book.status.stun,15);
 assert.equal(book.status.numb,15);
 assert.equal(book.status.tumble,15);
 assert.equal(effects.amount,15);
 assert.equal(effects.available,true);
 assert.equal(effects.modelOnly,true);
 assert.equal(effects.uncertain,true);
 assert.match(effects.detailRu,/Оглушение \+15, заморозка \+15, падение \+15/);
 assert.match(effects.detailEn,/Stun \+15, numb \+15, tumble \+15/);
});

test('revised signed official FV1 values replay in Book and Skill Effects without independent stale +15',()=>{
 const originalJson=JSON.stringify(skills);
 const trials=[
  [12,12,12,12,12],
  [5,9,13,13,null],
  [25,50,35,35,null],
  [0,0,0,0,0],
  [-5,-10,-15,-15,null]
 ];
 for(const [tumble,stun,numb,caster,shown] of trials){
  const modified=create(s=>{
   [tumble,stun,numb,caster].forEach((value,i)=>s.funcs[i].fv1[3]=value);
  });
  const expected={stun,numb,tumble};
  assert.deepEqual(passive('SNIPER',26,modified),expected);
  const book=resist('SNIPER',26,modified),effects=preview('SNIPER',26,modified);
  for(const [key,value] of Object.entries(expected))assert.equal(book.status[key],value);
  assert.ok(effects,'all four validated actions remain visible');
  assert.equal(effects.amount,shown);
  assert.equal(effects.modelOnly,true);
  assert.match(effects.detailRu,new RegExp('Оглушение '+(stun>=0?'\\+':'')+stun));
  assert.match(effects.detailEn,new RegExp('numb '+(numb>=0?'\\+':'')+numb));
 }
 assert.equal(JSON.stringify(skills),originalJson,'current OS source is immutable');
});

test('for every current OS class and supported level/green mastery: cap gate and zero duplicate',()=>{
 let cases=0,eligible=0;
 for(const job of Object.keys(classes))for(const green of [0,25,26,45,55,90]){
  const cap=classes[job].branchCaps.warding;
  const result=passive(job,green);
  const valid=cap>=26&&green>=26&&green<=cap;
  assert.equal(result!==null,valid,job+' @ '+green);
  const book=resist(job,green);
  assert.equal(book.status.stun,valid?15:0);
  assert.equal(book.status.numb,valid?15:0);
  assert.equal(book.status.tumble,valid?15:0);
  const displayed=preview(job,green);
  if(cap>=26){
   assert.ok(displayed,'source-cap class retains a Warding row');
   assert.equal(displayed.available,valid);
   assert.equal(displayed.amount,15,'source value remains visible when locked');
  }else assert.equal(displayed,undefined);
  if(valid)eligible++;
  cases++;
 }
 assert.equal(cases,168);
 assert.ok(eligible>8);
});

test('new unknown EP, FV2, reordered/caster/missing effects, noncanonical role and access fail closed',()=>{
 const mutations=[
  s=>s.funcs[0].fv2[3]=1,
  s=>s.funcs[1].fv1[0]=1,
  s=>s.funcs[1].dir='CASTER',
  s=>s.funcs[2].ep='EP_FUTURE_UNKNOWN',
  s=>s.funcs[3].fv1[3]=30,
  s=>s.funcs.reverse(),
  s=>s.funcs.push(structuredClone(s.funcs[0])),
  s=>s.reqs[0].amount=27,
  s=>s.reqLevel=35,
  s=>s.charLevel=20,
  s=>s.classes.SNIPER=0,
  s=>s.funcs[0].fv1[3]=120
 ];
 for(const mutate of mutations){
  const forged=create(mutate);
  assert.equal(passive('SNIPER',26,forged),null);
  const r=resist('SNIPER',26,forged);
  for(const key of ['stun','numb','tumble'])assert.equal(r.status[key],0);
  assert.equal(preview('SNIPER',26,forged),undefined);
 }
});
