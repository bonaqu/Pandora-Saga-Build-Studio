import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 auditFocusedEpEvidence,FOCUSED_EP_FAMILIES
} from '../scripts/audit-os-focused-ep-evidence.mjs';

const skills=JSON.parse(readFileSync(new URL('../data/os/skills.json',import.meta.url),'utf8'));
const row=(ep,dir,fv1,fv2=[0,0,0,0])=>({ep,dir,fv1,fv2});

test('three current EP families: every effect exactly traced and source left untouched',()=>{
 const initial=JSON.stringify(skills);
 const one=auditFocusedEpEvidence(skills),two=auditFocusedEpEvidence(skills);
 assert.deepEqual(one,two,'sorted deterministic output');
 assert.equal(JSON.stringify(skills),initial,'no catalog changes');
 assert.deepEqual(one.families.map(f=>f.ep),FOCUSED_EP_FAMILIES);
 const expected=Object.values(skills).flatMap(s=>s.funcs).filter(f=>
  FOCUSED_EP_FAMILIES.includes(f.ep)).length;
 assert.equal(one.summary.effects,expected);
 assert.equal(one.summary.sourceShapes,one.families.reduce((n,f)=>n+f.sourceShapes.length,0));
 for(const family of one.families){
  assert.equal(family.certainty,'source-shape-only');
  assert.equal(family.effects,family.rows.length);
  assert.equal(family.effects,family.sourceShapes.reduce((n,s)=>n+s.effects,0));
  for(const shape of family.sourceShapes){
   const rows=family.rows.filter(r=>r.signature===shape.signature);
   assert.equal(shape.effects,rows.length);
   assert.equal(shape.effects,shape.signVariants.reduce((n,v)=>n+v.effects,0));
   assert.ok(shape.sample.skillId>0);
   for(const r of rows){
    const original=skills[String(r.skillId)];
    assert.deepEqual(r.fv1,original.funcs[r.effectIndex].fv1);
    assert.deepEqual(r.fv2,original.funcs[r.effectIndex].fv2);
    assert.equal(r.damageKernel,original.damage?.kernel??null);
    assert.deepEqual(r.sourceClassKeys,
     Object.keys(original.classes||{}).filter(key=>Boolean(original.classes[key])).sort());
   }
  }
 }
 assert.match(one.certainty,/do not establish/);
});

test('same FV positions can have opposite signs: preserve both without claiming different gameplay',()=>{
 const source={
  1:{id:1,name:'Source A',learnable:true,skillType:'ENEMY',
   classes:{SCOUT:1,MAGE:0},damage:{kernel:'physical'},funcs:[
    row('EP_ONHIT_DAMAGE_SCALE','CASTER',[0,0,20,25]),
    row('EP_TOHIT_CONST','CASTER',[0,0,100,50])
   ]},
  2:{id:2,name:'Source B',learnable:false,skillType:'TOGGLE',
   classes:{},funcs:[
    row('EP_ONHIT_DAMAGE_SCALE','CASTER',[0,0,-20,25]),
    row('EP_TOGGLE','TARGET',[0,0,0,0])
   ]}
 };
 const result=auditFocusedEpEvidence(source);
 assert.equal(result.summary.effects,4);
 assert.equal(result.summary.sourceShapes,3);
 const onhit=result.families[0];
 assert.equal(onhit.sourceShapes.length,1);
 const shape=onhit.sourceShapes[0];
 assert.equal(shape.signature,'CASTER;fv1=2,3;fv2=-');
 assert.equal(shape.effects,2);
 assert.deepEqual(new Set(shape.signVariants.map(v=>v.signPattern)),
  new Set(['fv1=00++;fv2=0000','fv1=00-+;fv2=0000']));
 assert.deepEqual(onhit.rows[0].siblingEffects,['EP_TOHIT_CONST']);
 assert.deepEqual(onhit.rows[0].sourceClassKeys,['SCOUT']);
 assert.equal(onhit.rows[0].damageKernel,'physical');
 assert.equal(result.families[1].sourceShapes[0].signature,'TARGET;fv1=-;fv2=-');
 assert.equal(result.families[1].sourceShapes[0].sample.skillId,2);
});

test('malformed catalogs, absent family, and invalid focus names fail safely',()=>{
 const valid={1:{id:1,funcs:[row('EP_TOGGLE','TARGET',[0,0,0,0])]}};
 assert.throws(()=>auditFocusedEpEvidence(valid),/Unknown source family/);
 assert.throws(()=>auditFocusedEpEvidence(valid,{families:[]}),/Expected distinct/);
 assert.throws(()=>auditFocusedEpEvidence(valid,{families:['EP_TOGGLE','EP_TOGGLE']}),/Expected distinct/);
 assert.throws(()=>auditFocusedEpEvidence(valid,{families:['EP_NOT ALLOWED']}),/Expected distinct/);
 assert.throws(()=>auditFocusedEpEvidence({1:{id:1,funcs:[
  row('EP_TOGGLE','TARGET',[0,0,NaN,0])
 ]}},{families:['EP_TOGGLE']}),/Invalid EP/);
});
