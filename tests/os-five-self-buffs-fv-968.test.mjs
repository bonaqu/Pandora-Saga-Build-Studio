import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};
Function('window',read('pandora-studio-remaked-buffs.js'))(host);
const B=host.PandoraRemakedBuffs;
const candidates=[
 {id:142051001,key:'coldBlood',field:'critical',ep:'EP_CRITICALRATE_CONST',
  ctx:{jobKey:'JUGGERNAUT',level:45,weapon:{kind:'1H_AXE'},
   branchMasteries:{brush:40}}},
 {id:260005001,key:'quickStep',field:'dodge',ep:'EP_AVOIDANCE_CONST',
  ctx:{jobKey:'SNIPER',level:45,branchMasteries:{warding:50},stats:{agi:100}}},
 {id:260008001,key:'avoidance',field:'dodge',ep:'EP_AVOIDANCE_CONST',
  ctx:{jobKey:'SNIPER',level:45,branchMasteries:{warding:50}}},
 {id:260002001,key:'lightness',field:'movement',ep:'EP_MOVESPEED_SCALE',
  ctx:{jobKey:'SNIPER',level:45,branchMasteries:{}}},
 {id:213702001,key:'swiftArrow',field:'attackSpeed',ep:'EP_ATTACKINTERVAL_SCALE',
  ctx:{jobKey:'SNIPER',level:45,weapon:{kind:'CROSSBOW'},branchMasteries:{}}}
];
const selected=({id,ctx:options},source=skills)=>B.applied({skills:source,
 branchCaps:classes[options.jobKey].branchCaps,selected:[id],...options});
const chosen=({id,ctx:options},source=skills)=>B.choices({skills:source,
 branchCaps:classes[options.jobKey].branchCaps,...options}).find(row=>row.id===id);
const modify=(id,ep,fn)=>{
 const copy=structuredClone(skills);
 const fx=copy[id].funcs.find(f=>f.ep===ep);
 assert.ok(fx,id+' '+ep);
 fn(fx,copy[id]);
 return copy;
};

test('five current OS self effects preserve old Remaked models and eligibility',()=>{
 const snapshot=JSON.stringify(skills);
 const expected=[18,22,100,30,30];
 for(const [index,c] of candidates.entries()){
  assert.equal(chosen(c).available,true,c.key);
  assert.equal(chosen(c).counted,true,c.key);
  const effect=selected(c)[c.key];
  assert.ok(effect,c.key+' is opt-in');
  assert.equal(effect[c.field],expected[index],c.key+' matches current OS source');
  const source=skills[String(c.id)];
  assert.ok(source.funcs.some(f=>f.ep===c.ep&&f.dir==='TARGET'));
 }
 assert.equal(JSON.stringify(skills),snapshot);
});

test('same-shape current OS coefficients update selected hero preview without code literals',()=>{
 for(const c of candidates){
  const base=selected(c)[c.key][c.field];
  const next=modify(c.id,c.ep,fx=>{fx.fv1[3]+=1});
  assert.equal(selected(c,next)[c.key][c.field],base+1,c.key+' current FV1 flat');
  assert.equal(chosen(c,next).counted,true,c.key+' recognizable source');
 }
 for(const c of candidates.slice(0,2)){
  const source=modify(c.id,c.ep,fx=>{fx.fv1[2]+=3});
  const base=selected(c)[c.key][c.field],changed=selected(c,source)[c.key][c.field];
  assert.ok(changed>base,c.key+' mastery channel is dynamic');
 }
 const quick=candidates[1],stat=modify(quick.id,quick.ep,fx=>{fx.fv1[0]+=2});
 assert.equal(selected(quick,stat).quickStep.dodge,
  selected(quick).quickStep.dodge+2,'AGI channel follows source');
});

test('five numerical models fail closed on unknown FV2, target, reqs and extra effects',()=>{
 let rejected=0;
 for(const c of candidates){
  const changes=[
   (fx)=>{fx.fv2[0]=1},
   (fx)=>{fx.dir='CASTER'},
   (fx,root)=>{root.funcs.push({ep:'EP_NEW_UNVERIFIED',dir:'TARGET',
    fv1:[0,0,0,8],fv2:[0,0,0,0]})},
   (fx,root)=>{root.reqs=[{branch:'unknown',amount:3}]},
   (fx,root)=>{root.prereq=9876543},
   (fx,root)=>{root.skillType='ALLY'}
  ];
  for(const mutate of changes){
   const bad=modify(c.id,c.ep,mutate);
   assert.equal(selected(c,bad)[c.key],undefined,c.key+' unknown source');
   assert.equal(chosen(c,bad).counted,false,c.key+' not counted');
   rejected++;
  }
  if(skills[c.id].funcs.length===2){
   const side=structuredClone(skills);
   side[c.id].funcs.find(f=>f.ep!==c.ep).fv1[3]+=1;
   assert.equal(selected(c,side)[c.key],undefined,c.key+' changed loss trigger');
   rejected++;
  }
 }
 assert.equal(rejected,33);
});

test('five self effects require the actual hero class, mastery and equipment',()=>{
 for(const c of candidates){
  const s=skills[c.id],invalid=Object.keys(classes).find(key=>!s.classes?.[key]);
  assert.ok(invalid,'at least one class does not learn '+c.id);
  const changed=B.applied({skills,selected:[c.id],jobKey:invalid,
   level:55,branchMasteries:c.ctx.branchMasteries,weapon:c.ctx.weapon,
   stats:c.ctx.stats});
  assert.equal(changed[c.key],undefined);
  assert.equal(B.applied({skills,selected:[],...c.ctx})[c.key],undefined);
 }
});

test('28 jobs × Lv1–55 recognize OS root but never invent active self buffs',()=>{
 let n=0;
 const source=JSON.stringify(skills);
 for(const [job,record] of Object.entries(classes))for(let level=1;level<=55;level++){
  for(const c of candidates){
   const opts={skills,jobKey:job,level,branchCaps:record.branchCaps,
    branchMasteries:Object.fromEntries(Object.entries(record.branchCaps).map(([k,v])=>[k,v])),
    weapon:{kind:'CROSSBOW'},stats:{agi:100}};
   const card=B.choices(opts).find(x=>x.id===c.id);
   assert.equal(card.counted,true,'source-model exists independently of hero');
   if(!card.available)
    assert.equal(B.applied({...opts,selected:[c.id]})[c.key],undefined);
  }
  n++;
 }
 assert.equal(n,1540);
 assert.equal(JSON.stringify(skills),source);
});
