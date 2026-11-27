import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json')),classes=JSON.parse(read('data/os/classes.json')),host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const stats={vit:50,str:70,agi:60,dex:55,spi:80,int:45};
const combat={attack:{walkingBase:160},defense:{directRaw:80},accuracy:{base:100},dodge:{base:130}};
const mastery={slash:40,thrust:20,brush:20,blow:10,defense:10};
const source=(catalog=skills,job='JUGGERNAUT',branchMasteries=mastery,
 level=45)=>C.scalingSkillPreview({skillCatalog:catalog,jobKey:job,
 level,branchMasteries,branchCaps:classes[job].branchCaps,stats,combat,hasShield:true});
const find=(catalog=skills,job='JUGGERNAUT',branchMasteries=mastery,level=45)=>{
 const all=source(catalog,job,branchMasteries,level);
 return all.defense.find(r=>r.id===100057001);
};
const modify=(mutator)=>{
 const copy=structuredClone(skills);
 mutator(copy['100057001']);return copy;
};

test('Painlessness uses the official five TARGET effects and signed FV1 penalty',()=>{
 const old=JSON.stringify(skills),before=JSON.stringify(combat);
 const row=find();
 assert.ok(row);
 assert.equal(row.amount,-80,'-50% of 160 unbuffed ATK Remaked model');
 assert.equal(row.modelOnly,true);
 assert.equal(row.uncertain,true);
 assert.equal(row.available,true);
 assert.equal(row.coefficientModels.length,1);
 assert.deepEqual(row.coefficientModels.map(x=>({ep:x.ep,amount:x.amount,
  confidence:x.confidence})),[{
   ep:'EP_DAMAGERATE_SCALE',amount:-50,confidence:'coefficient-model'
  }]);
 assert.equal(JSON.stringify(skills),old);
 assert.equal(JSON.stringify(combat),before);
});

test('same-shape official negative FV1 revision replays instead of stale -50',()=>{
 for(const [newRate,expected] of [[-60,-96],[-40,-64],[-1,-2],[-100,-160]]){
  const modified=modify(s=>{s.funcs[2].fv1[3]=newRate});
  const row=find(modified);
  assert.ok(row);
  assert.equal(row.amount,expected);
  assert.equal(row.coefficientModels[0].amount,newRate);
 }
});

test('fail closed for all five effect changes and additional unknown mechanics',()=>{
 for(const index of [0,1,2,3,4]){
  const broken=modify(s=>{s.funcs[index].fv2[0]=1});
  assert.equal(find(broken),undefined,'unexpected FV2 at index '+index);
 }
 for(const [index,fn] of [
  [0,e=>{e.fv1[3]=99}],[1,e=>{e.dir='CASTER'}],
  [2,e=>{e.fv1[0]=1}],[2,e=>{e.fv1[3]=1}],
  [3,e=>{e.fv1[2]=1}],[4,e=>{e.ep='EP_UNKNOWN'}]
 ]){
  assert.equal(find(modify(s=>fn(s.funcs[index]))),undefined,
   'new mechanics index '+index);
 }
 assert.equal(find(modify(s=>s.funcs.push({
  ep:'EP_EXTRA',dir:'TARGET',fv1:[0,0,0,1],fv2:[0,0,0,0]
 }))),undefined);
 assert.equal(find(modify(s=>s.reqs[0].amount=101)),undefined);
 assert.equal(find(modify(s=>s.classes.WARRIOR=0)),undefined);
});

test('100 pooled green mastery is required; class and level do not invent availability',()=>{
 assert.equal(find()?.available,true);
 const below=find(skills,'JUGGERNAUT',{...mastery,defense:9});
 assert.ok(below);
 assert.equal(below.available,false);
 assert.match(below.reason,/100/);
 assert.equal(find(skills,'JUGGERNAUT',mastery,1)?.available,true);
 const invalid=find(skills,'JUGGERNAUT',{...mastery,slash:999});
 assert.ok(invalid);
 assert.equal(invalid.available,false);
});
