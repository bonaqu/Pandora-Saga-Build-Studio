import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json')),classes=JSON.parse(read('data/os/classes.json')),host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const stats={vit:50,str:70,agi:60,dex:55,spi:80,int:45};
const combat={attack:{walkingBase:160},defense:{directRaw:80},accuracy:{base:100},dodge:{base:130}};
const cases=[
 {id:320001001,key:'warCry',group:'offense',ep:'EP_DAMAGERATE_CONST',basis:'physicalAttack'},
 {id:100055001,key:'massConcentration',group:'offense',ep:'EP_TOHIT_CONST',basis:'accuracy'},
 {id:260006001,key:'windAssist',group:'defense',ep:'EP_AVOIDANCE_CONST',basis:'evasion'}
];
const fx=(catalog=skills,job='WARRIOR',c=combat,level=45)=>C.scalingSkillPreview({
 skillCatalog:catalog,jobKey:job,level,branchMasteries:{},
 branchCaps:classes[job].branchCaps,stats,combat:c
});
const preview=(catalog=skills,c=combat)=>C.alliedRecipientPreviews({
 skillCatalog:catalog,combat:c,includeSource:true
});
const modified=(id,change)=>{const copy=structuredClone(skills);change(copy[id]);return copy};
const row=(catalog,id,job='WARRIOR',c=combat,level=45)=>{
 const all=fx(catalog,job,c,level);
 return [...all.offense,...all.defense].find(item=>item.id===id);
};

test('OS source is unique for three recipient previews and Skill Effects at baseline',()=>{
 const original=JSON.stringify(skills),before=JSON.stringify(combat),values=preview();
 for(const entry of cases){
  const item=row(skills,entry.id);
  const known=values[entry.key];
  assert.ok(item&&known);
  assert.equal(item.amount,known.bonus);
  assert.equal(item.uncertain,true);
  assert.equal(item.modelOnly,true);
  assert.equal(item.recipient,true);
  assert.equal(item.available,true);
  assert.equal(item.recipientBasis.source,entry.basis);
  assert.equal(item.recipientBasis.base,known.base);
  assert.equal(item.recipientBasis.flat,known.flat);
  assert.equal(item.recipientBasis.percent,known.percent);
  assert.equal(item.recipientBasis.applied,false);
  assert.equal(item.recipientBasis.model,'flat-plus-floor-percent');
 }
 const standard=C.alliedRecipientPreviews({skillCatalog:skills,combat});
 assert.deepEqual(standard.warCry,{base:160,bonus:42});
 assert.deepEqual(standard.massConcentration,{base:100,bonus:35});
 assert.deepEqual(standard.windAssist,{base:130,bonus:34});
 assert.equal(JSON.stringify(combat),before);
 assert.equal(JSON.stringify(skills),original);
});

test('all three models respond to supported source flat/percent revisions consistently',()=>{
 for(const item of cases){
  for(const index of [0,1]){
   const changed=modified(item.id,s=>{s.funcs[index].fv1[3]+=1});
   const known=preview(changed)[item.key];
   const rendered=row(changed,item.id);
   assert.ok(known&&rendered,item.key+' should retain a supported source revision');
   assert.equal(rendered.amount,known.bonus);
   assert.equal(rendered.recipientBasis.flat,known.flat);
   assert.equal(rendered.recipientBasis.percent,known.percent);
  }
 }
});

test('unknown FV2, target direction, caster class and extra effect suppress both presentations',()=>{
 for(const item of cases){
  for(const change of [
   s=>{s.funcs[0].fv2[0]=1},
   s=>{s.funcs[1].dir='CASTER'},
   s=>{s.classes={}},
   s=>{s.funcs.push({ep:'EP_EXTRA',dir:'TARGET',
    fv1:[0,0,0,1],fv2:[0,0,0,0]})}
  ]){
   const bad=modified(item.id,change);
   assert.equal(preview(bad)[item.key],null);
   assert.equal(row(bad,item.id),undefined);
  }
 }
});

test('recipient previews use the same mounted/walking basis and never leak a class gate',()=>{
 const mounted={...combat,attack:{walkingBase:160,mountedBase:200}};
 assert.equal(preview(skills,mounted).warCry.bonus,50);
 assert.equal(row(skills,320001001,'WARRIOR',mounted)?.amount,50);
 for(const job of Object.keys(classes))for(const level of [1,45,55]){
  const values=fx(skills,job,combat,level);
  for(const item of cases){
   const actual=[...values.offense,...values.defense].filter(x=>x.id===item.id);
   assert.equal(actual.length,1,job+' / '+level+' / '+item.id);
   assert.equal(actual[0].recipient,true);
   assert.equal(actual[0].modelOnly,true);
  }
 }
});
