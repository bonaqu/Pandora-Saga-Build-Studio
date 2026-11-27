import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json')),classes=JSON.parse(read('data/os/classes.json')),host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,stats={vit:50,str:70,agi:60,dex:55,spi:80,int:45};
const combat={attack:{walkingBase:160},defense:{directRaw:80},accuracy:{base:100},dodge:{base:130}};
const cases=[
 {id:220001001,job:'PREDATOR',branch:'alchemy',mastery:40,amount:11,ep:'EP_AURAPOISON_CONSTANT'},
 {id:220001003,job:'PREDATOR',branch:'alchemy',mastery:61,amount:19,ep:'EP_AURAPOISON_CONSTANT'},
 {id:430051001,job:'WARLOCK',branch:'darkness',mastery:20,amount:21,ep:'EP_AURADARK_CONSTANT'},
 {id:213702001,job:'SNIPER',branch:'archery',mastery:40,amount:30,ep:'EP_ATTACKINTERVAL_SCALE'}
];
const readRow=(c,source=skills,options={})=>{
 const result=C.scalingSkillPreview({skillCatalog:source,jobKey:c.job,level:45,stats,combat,hasShield:true,weaponKind:'CROSSBOW',
  branchMasteries:{[c.branch]:c.mastery},branchCaps:classes[c.job].branchCaps,...options});
 return result.offense.find(x=>x.id===c.id);
};
const change=(c,mutate,index=0)=>{
 const source=structuredClone(skills);
 const effect=source[c.id].funcs[index];
 assert.ok(effect);mutate(effect,source[c.id]);return source;
};
test('poison 1/2, Dark Aura and Swift Arrow read official OS baseline without affecting hero combat',()=>{
 const original=JSON.stringify(skills),before=JSON.stringify(combat);
 for(const c of cases){
  const row=readRow(c);
  assert.ok(row,'source-backed '+c.id);
  assert.equal(row.amount,c.amount,'current OS '+c.id);
  assert.equal(row.modelOnly,true);
  assert.equal(row.uncertain,true);
  assert.equal(row.available,true);
  assert.match(row.detailEn,/model/i);
 }
 const first=readRow(cases[0]),upgraded=readRow(cases[1]);
 assert.equal(first.id,220001001);
 assert.equal(upgraded.id,220001003);
 const below=C.scalingSkillPreview({skillCatalog:skills,jobKey:'PREDATOR',level:45,stats,combat,
  branchCaps:classes.PREDATOR.branchCaps,branchMasteries:{alchemy:60}});
 assert.ok(below.offense.some(x=>x.id===220001001));
 assert.ok(!below.offense.some(x=>x.id===220001003));
 assert.equal(JSON.stringify(combat),before);
 assert.equal(JSON.stringify(skills),original);
});
test('all four previews replay supported future OS coefficients instead of old Remaked literals',()=>{
 const [base,advanced,dark,swift]=cases;
 assert.equal(readRow(base,change(base,e=>{e.fv1[3]+=2}))?.amount,13);
 assert.equal(readRow(base,change(base,e=>{e.fv1[1]+=10}))?.amount,16);
 assert.equal(readRow(advanced,change(advanced,e=>{e.fv1[2]+=5}))?.amount,22);
 const shifted=readRow(dark,change(dark,e=>{e.fv1[0]+=2}));
 assert.equal(shifted?.amount,23);
 assert.match(shifted.detailRu,/10% СД/);
 assert.equal(readRow(swift,change(swift,e=>{e.fv1[3]+=3}))?.amount,33);
});
test('unknown FV channels, unrelated target, extra effects and changed poison costs fail closed',()=>{
 let rejected=0;
 for(const c of cases){
  for(const fn of [
   e=>{e.dir='CASTER'},e=>{e.fv2[0]=1},e=>{e.ep='EP_UNVERIFIED'}
  ]){
   assert.equal(readRow(c,change(c,fn)),undefined,c.id);
   rejected++;
  }
  const expanded=structuredClone(skills);
  expanded[c.id].funcs.push({ep:'EP_NEW',dir:'TARGET',fv1:[0,0,0,1],fv2:[0,0,0,0]});
  assert.equal(readRow(c,expanded),undefined,c.id+' full chain');
  rejected++;
 }
 for(const c of cases.slice(0,2)){
  assert.equal(readRow(c,change(c,e=>{e.fv1[3]++},1)),undefined,
   'cannot silently change the consumed item ID');
  assert.equal(readRow(c,change(c,e=>{e.fv2[3]++},1)),undefined,
   'cannot silently change poison item count');
  assert.equal(readRow(c,change(c,e=>{e.dir='CASTER'},2)),undefined,
   'poison weapon-change event is required');
  rejected+=3;
 }
 assert.equal(readRow(cases[2],change(cases[2],e=>{e.fv1[1]=1})),undefined);
 assert.equal(readRow(cases[2],change(cases[2],e=>{e.fv1[2]=1})),undefined);
 assert.equal(readRow(cases[3],change(cases[3],e=>{e.fv1[3]=3},1)),undefined);
 rejected+=3;
 assert.equal(rejected,25);
});
test('all 28 jobs x Lv1/45/55 keep source class gates for four read-only models',()=>{
 let count=0;
 const source=JSON.stringify(skills);
 for(const [job,limits] of Object.entries(classes))for(const level of [1,45,55]){
  const result=C.scalingSkillPreview({skillCatalog:skills,jobKey:job,level,stats,combat,weaponKind:'CROSSBOW',
   branchCaps:limits.branchCaps,branchMasteries:{alchemy:40,darkness:20,archery:40}});
  for(const c of cases){
   const row=result.offense.find(x=>x.id===c.id);
   if(row){
    assert.ok(skills[c.id].classes?.[job],'source has the actual caster class');
    assert.equal(row.modelOnly,true);
    assert.ok(Number.isSafeInteger(row.amount));
    if(level<skills[c.id].charLevel)assert.equal(row.available,false);
   }
  }
  count++;
 }
 assert.equal(count,84);
 assert.equal(JSON.stringify(skills),source);
});
