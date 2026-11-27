import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-studio-remaked-buffs.js'))(host);
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator,B=host.PandoraRemakedBuffs;
const combat={attack:{walkingBase:219},accuracy:{base:123},dodge:{base:134}};
const inspect=source=>C.alliedRecipientPreviews({skillCatalog:source,combat});
const cases=[
 [320001001,'warCry'],[100055001,'massConcentration'],
 [260006001,'windAssist'],[320004001,'windBlessing'],
 [330004001,'divineBlessing'],[320002001,'blessedRepose']
];
const appliedKeys={100055001:'thirdEye',330004001:'providence',
 320002001:'blessedRepose'};
const metaKeys=['learnable','prereq','charLevel','branch','reqs','classes'];

test('current OS all six party roots remain identical across Book preview and Remaked selection',()=>{
 const snapshot=JSON.stringify(skills),models=inspect(skills);
 const shown=B.choices({skills});
 for(const [id,key] of cases){
  assert.ok(Number.isFinite(models[key]?.bonus),key+' official source coefficient');
  const choice=shown.find(row=>row.id===id);
  assert.ok(choice?.available,key+' can be supplied by a different character');
  if(appliedKeys[id]){
   assert.equal(choice.counted,true);
   const item=B.applied({selected:[id],skills});
   assert.ok(item[appliedKeys[id]],key+' remains opt-in and applied');
  }
 }
 assert.equal(JSON.stringify(skills),snapshot);
});

test('each of six OS source roots rejects changed class/level/requirements/identity, without blocking others',()=>{
 let attempts=0;
 for(const [id,key] of cases){
  const original=skills[id],mutations={
   learnable:s=>{s.learnable=false},
   prereq:s=>{s.prereq=999999001},
   charLevel:s=>{s.charLevel+=1},
   branch:s=>{s.branch='unknown-source-branch'},
   reqs:s=>{s.reqs=[{branch:'archery',amount:3}]},
   classes:s=>{s.classes={UNKNOWN_SOURCE_CLASS:1}},
   addedClass:s=>{s.classes.UNKNOWN_SOURCE_CLASS=1},
   disabledClass:s=>{s.classes[Object.keys(s.classes)[0]]=0}
  };
  for(const [kind,mutate] of Object.entries(mutations)){
   const current=structuredClone(skills);
   mutate(current[id]);
   const report=inspect(current);
   assert.equal(report[key],null,key+' '+kind+' must fail closed');
   const choice=B.choices({skills:current}).find(row=>row.id===id);
   assert.equal(choice.available,false,key+' '+kind+' Remaked opt-in');
   if(appliedKeys[id]){
    assert.equal(choice.counted,false,key+' '+kind+' no counted amount');
    assert.equal(B.applied({selected:[id],skills:current})[appliedKeys[id]],undefined,
     key+' '+kind+' cannot inflate real hero stats');
   }
   assert.deepEqual(inspect(current)[cases.find(([other])=>other!==id)[1]],
    inspect(skills)[cases.find(([other])=>other!==id)[1]],
    'unaffected external buff survives one modified caster source');
   attempts++;
  }
  assert.ok(original.classes);
 }
 assert.equal(attempts,48);
});

test('source FV values can still change with a supported shape, but unsupported channels reject',()=>{
 for(const [id,key] of cases){
  const next=structuredClone(skills);
  next[id].funcs[0].fv1[3]++;
  assert.ok(inspect(next)[key],'current OS coefficient change remains a modeled value '+key);
  const invalid=structuredClone(skills);
  invalid[id].funcs[0].fv2[2]=1;
  assert.equal(inspect(invalid)[key],null,'new FV2 mechanics require review '+key);
 }
});

test('all 28 jobs x levels 1..55 cannot gain a caster-specific free ally skill',()=>{
 const snapshot=JSON.stringify(skills),expected=inspect(skills);
 let scenarios=0;
 for(const [key,job] of Object.entries(classes))for(let level=1;level<=55;level++){
  assert.ok(job.branchCaps,key);
  assert.deepEqual(inspect(skills),expected,key+'/'+level);
  assert.ok(B.choices({skills,jobKey:key,level}).find(row=>row.id===330004001).available);
  scenarios++;
 }
 assert.equal(scenarios,1540);
 assert.equal(JSON.stringify(skills),snapshot);
});

test('other external Remaked roots reject no longer learnable source without recipient-class gating',()=>{
 const id=320005001;
 assert.equal(B.choices({skills}).find(x=>x.id===id).available,true);
 for(const update of [s=>{s.learnable=false},s=>{s.prereq=88},
  s=>{s.classes={}},s=>{s.reqs=null}]){
  const current=structuredClone(skills);
  update(current[id]);
  const row=B.choices({skills:current}).find(x=>x.id===id);
  assert.equal(row.available,false,'invalid source no longer selectable');
 }
});
