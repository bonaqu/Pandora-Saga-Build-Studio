import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const stats={vit:50,str:70,agi:60,dex:55,spi:80,int:40};
const combat={attack:{walkingBase:160},defense:{directRaw:80},
 accuracy:{base:100},dodge:{base:125}};
const view=(id,source=skills,options={})=>{
 const job=id===260005001?'SNIPER':'JUGGERNAUT';
 const r=C.scalingSkillPreview({skillCatalog:source,jobKey:job,
  level:50,branchCaps:classes[job].branchCaps,
  branchMasteries:id===260005001?{warding:45}:{brush:70},
  stats,combat,weaponKind:id===142051001?'1H_AXE':'BARE_HAND',
  ...options});
 return [...r.offense,...r.defense].find(x=>x.id===id);
};
const mutated=(id,change)=>{
 const copy=structuredClone(skills);
 change(copy[String(id)]);
 return copy;
};

test('both current signed source contracts reproduce the previous numeric model',()=>{
 assert.equal(Object.keys(classes).length,28);
 for(const [id,ep,amount] of [
  [260005001,'EP_AVOIDANCE_CONST',19],
  [142051001,'EP_CRITICALRATE_CONST',24]
 ]){
  const row=view(id),model=row?.coefficientModels?.find(x=>x.ep===ep);
  assert.ok(row,'Source preview should remain visible: '+id);
  assert.equal(row.amount,amount);
  assert.equal(model?.amount,amount);
  assert.equal(model.confidence,'coefficient-model');
  assert.equal(row.available,true);
  assert.equal(row.modelOnly,true);
  assert.equal(row.uncertain,true);
 }
});

test('same-shape live FV1 changes update amounts, never freeze old numbers',()=>{
 let count=0;
 for(const id of [260005001,142051001]){
  for(const [position,increment] of [[0,2],[2,5],[3,7]]){
   if(id===142051001&&position===0)continue;
   const source=mutated(id,s=>{s.funcs[0].fv1[position]+=increment});
   const expected=view(id),updated=view(id,source);
   assert.ok(expected&&updated);
   const v=source[String(id)].funcs[0].fv1,mastery=id===260005001?45:70;
   const agility=id===260005001?stats.agi:0;
   const amount=v[3]+Math.floor(agility*v[0]/100)+
    Math.floor(mastery*v[2]/100);
   assert.equal(updated.amount,amount,id+' FV1['+position+']');
   assert.equal(updated.coefficientModels[0].amount,amount);
   assert.equal(updated.modelOnly,true);
   assert.equal(updated.uncertain,true);
   count++;
  }
 }
 assert.equal(count,5);
});

test('Cold Blood weapon-change termination is a mandatory second effect',()=>{
 const id=142051001;
 const changes=[
  rec=>{rec.funcs[1].ep='EP_NEW_EFFECT'},
  rec=>{rec.funcs[1].dir='CASTER'},
  rec=>{rec.funcs[1].fv1[3]=1},
  rec=>{rec.funcs[1].fv2[3]=3},
  rec=>{rec.funcs.push(structuredClone(rec.funcs[1]))},
  rec=>{rec.weaponUse=['1H_AXE','UNKNOWN_WEAPON']},
  rec=>{rec.reqs=[]},
  rec=>{rec.reqLevel=22},
  rec=>{rec.branchRaw='OTHER'},
  rec=>{rec.classes.WIZARD=0}
 ];
 for(const change of changes){
  const forged=mutated(id,change);
  assert.equal(view(id,forged),undefined,
   'Unexpected secondary effect/metadata must invalidate model: '+change);
 }
 const invalidWeapon=view(id,skills,{weaponKind:'BOW'});
 assert.ok(invalidWeapon);
 assert.equal(invalidWeapon.available,false);
 assert.match(invalidWeapon.reason,/оружие/);
});

test('Quick Dodge rejects unknown effects, FV2 channels and invalid coefficients',()=>{
 const id=260005001;
 const changes=[
  rec=>{rec.funcs.push(structuredClone(rec.funcs[0]))},
  rec=>{rec.funcs[0].ep='EP_AVOIDANCE_SCALE'},
  rec=>{rec.funcs[0].dir='CASTER'},
  rec=>{rec.funcs[0].fv1[1]=1},
  rec=>{rec.funcs[0].fv1[0]=-1},
  rec=>{rec.funcs[0].fv1[2]=101},
  rec=>{rec.funcs[0].fv1[3]=0.5},
  rec=>{rec.funcs[0].fv2[0]=1},
  rec=>{rec.reqs[0].amount=10},
  rec=>{rec.weaponUse=['BOW']},
  rec=>{rec.skillType='ALLY'}
 ];
 for(const change of changes){
  assert.equal(view(id,mutated(id,change)),undefined,
   'Unknown source channel must not silently become buff: '+change);
 }
});

test('all classes and levels retain access gates independent of model amount',()=>{
 let cases=0;
 for(const id of [260005001,142051001]){
  const branch=id===260005001?'warding':'brush';
  const need=id===260005001?16:21;
  for(const job of Object.keys(classes)){
   const caps=classes[job].branchCaps;
   const params={jobKey:job,level:45,branchCaps:caps,
    branchMasteries:{[branch]:0},stats,combat,skillCatalog:skills,
    weaponKind:id===142051001?'2H_AXE':'BARE_HAND'};
   const r=C.scalingSkillPreview(params);
   const found=[...r.offense,...r.defense].find(x=>x.id===id);
   if(found){
    assert.equal(found.available,false,'mastery 0 must not unlock '+id);
    assert.ok(found.modelOnly===true&&found.uncertain===true);
   }
   if((caps[branch]??0)>=need){
    const trained=C.scalingSkillPreview({...params,
     branchMasteries:{[branch]:need}});
    const enabled=[...trained.offense,...trained.defense]
     .find(x=>x.id===id);
    if(enabled)assert.equal(enabled.available,true,
     job+' should be allowed at the stated source requirement');
   }
   cases++;
  }
 }
 assert.equal(cases,56);
});
