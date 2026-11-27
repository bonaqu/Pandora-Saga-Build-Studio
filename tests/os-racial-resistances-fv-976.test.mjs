import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const jobs=JSON.parse(read('data/os/classes.json'));
const racial=JSON.parse(read('data/os/racialPassives.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const stats={vit:56,str:60,agi:65,dex:50,spi:70,int:40};
const source=skillCatalog=>({stats,bonuses:{},honorTitle:0,skillCatalog});
const cases=[
 {id:900020003,race:'ELF',effect:'EP_CHARM_RESISTANCE_CONST',
  key:'elements.charm',amount:20,changed:23},
 {id:900010002,race:'HUMAN',effect:'EP_IMMUNE_VIT_TYPE',
  key:'states.physical',amount:15,changed:18},
 {id:900050001,race:'ENKIDU',effect:'EP_ONDAMAGE_FIN_DAMAGE_SCALE',
  key:'mitigation.physical',amount:-10,changed:-13},
 {id:900060001,race:'RAPIN',effect:'EP_ONDAMAGE_ELEM_SCALE',
  key:'mitigation.magic',amount:-10,changed:-13},
 {id:900030001,race:'DWARF',effect:'EP_IMMUNE_STUN',
  key:'status.stun',amount:10,changed:13}
];
const path=(o,key)=>key.split('.').reduce((value,k)=>value?.[k],o);

test('five current OS racial passive groups preserve all official source values',()=>{
 const original=JSON.stringify(skills);
 for(const row of cases){
  assert.ok(racial[row.race]?.skills?.includes(row.id),'correct source race '+row.id);
  const proof=C.racialStatusSourcePreview({racialPassiveId:row.id,skillCatalog:skills});
  assert.ok(proof,row.race);
  assert.equal(proof.modelOnly,true);
  assert.equal(proof.verified,false);
  const target=skills[row.id].funcs.find(f=>f.ep===row.effect);
  assert.equal(target?.fv1[3],row.amount);
  const derived=C.resistancePreview({...source(skills),racialPassiveId:row.id});
  const plain=C.resistancePreview({...source(skills),racialPassiveId:null});
  assert.equal(path(derived,row.key)-path(plain,row.key),row.amount);
 }
 assert.equal(JSON.stringify(skills),original);
});

test('modified official FV1 values flow to Book resistance outputs, not old fixed legacy constants',()=>{
 for(const item of cases){
  const modified=structuredClone(skills);
  const target=modified[item.id].funcs.find(f=>f.ep===item.effect);
  target.fv1[3]=item.changed;
  const proof=C.racialStatusSourcePreview({racialPassiveId:item.id,skillCatalog:modified});
  assert.ok(proof,'valid source change '+item.id);
  const applied=C.resistancePreview({...source(modified),racialPassiveId:item.id});
  const neutral=C.resistancePreview({...source(modified),racialPassiveId:null});
  assert.equal(path(applied,item.key)-path(neutral,item.key),item.changed);
 }
 const dwarf=structuredClone(skills);
 dwarf['900030001'].funcs[1].fv1[3]=7;
 dwarf['900030001'].funcs[2].fv1[3]=12;
 dwarf['900030001'].funcs[3].fv1[3]=21;
 const r=C.resistancePreview({...source(dwarf),racialPassiveId:900030001});
 assert.deepEqual({stun:r.status.stun,numb:r.status.numb,tumble:r.status.tumble},
  {stun:12,numb:21,tumble:7});
 assert.equal(C.racialStatusSourcePreview({racialPassiveId:900030001,
  skillCatalog:dwarf}).survivalChanceSource,20);
});

test('a changed, unverified EP/FV2, direction, raw class, bad range, or incomplete dwarf chain fails closed',()=>{
 for(const row of cases){
  const changes=[
   skill=>skill.funcs[0].fv2[3]=1,
   skill=>skill.funcs[0].dir='CASTER',
   skill=>skill.funcs.push(structuredClone(skill.funcs[0])),
   skill=>skill.funcs[0].fv1[0]=1,
   skill=>skill.classes.SNIPER=1,
   skill=>skill.branchRaw='OTHER',
   skill=>skill.funcs[0].fv1[3]=101,
   skill=>skill.funcs[0].ep='EP_FUTURE_UNKNOWN'
  ];
  for(const mutate of changes){
   const bad=structuredClone(skills);
   mutate(bad[row.id]);
   assert.equal(C.racialStatusSourcePreview({
    racialPassiveId:row.id,skillCatalog:bad
   }),null,'unsafe source '+row.id);
   const preview=C.resistancePreview({...source(bad),racialPassiveId:row.id});
   const neutral=C.resistancePreview({...source(bad),racialPassiveId:null});
   assert.equal(path(preview,row.key),path(neutral,row.key),
    'untrusted source must not apply old racial value '+row.id);
  }
 }
 const badDwarf=structuredClone(skills);
 badDwarf['900030001'].funcs[0].fv2[0]=1;
 assert.equal(C.racialStatusSourcePreview({
  racialPassiveId:900030001,skillCatalog:badDwarf
 }),null);
});

test('source-native racial previews remain available for all 28 jobs without requiring active buff flags',()=>{
 let checked=0;
 for(const jobKey of Object.keys(jobs))for(const item of cases){
  const result=C.resistancePreview({...source(skills),jobKey,
   racialPassiveId:item.id,wardingMastery:0,
   wardingCap:jobs[jobKey].branchCaps.warding});
  assert.ok(result&&Number.isFinite(path(result,item.key)));
  checked++;
 }
 assert.equal(checked,140);
 const missing=structuredClone(skills);delete missing['900020003'];
 assert.equal(C.racialStatusSourcePreview({
  racialPassiveId:900020003,skillCatalog:missing
 }),null);
 assert.equal(C.resistancePreview({...source(missing),
  racialPassiveId:900020003}).elements.charm,0);
});
