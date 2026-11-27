import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json')),classes=JSON.parse(read('data/os/classes.json')),host={};
Function('window',read('pandora-os-character-calculator.js'))(host);
const calc=host.PandoraOSCalculator;
const stats={str:70,dex:50,vit:50,agi:70,spi:80,int:45};
const combat={attack:{walkingBase:160},defense:{directRaw:80},accuracy:{base:100},dodge:{base:130}};
const cases=[
 {id:100052001,job:'GLADIATOR',group:'offense',ep:'EP_DAMAGERATE_SCALE',secondary:'EP_ARMORCLASS_SCALE',current:48,changed:53,newValue:33,second:-62},
 {id:100053001,job:'KNIGHT',group:'defense',ep:'EP_ARMORCLASS_SCALE',secondary:'EP_DAMAGERATE_SCALE',current:32,changed:36,newValue:45,second:-23},
 {id:168052001,job:'KNIGHT',group:'defense',ep:'EP_AVOIDANCE_SCALE',secondary:'EP_CRITICAL_SAFE',current:-65,changed:-59,newValue:-45,second:1}
];
const preview=(c,source=skills,options={})=>{
 const result=calc.scalingSkillPreview({skillCatalog:source,jobKey:c.job,level:45,stats,combat,hasShield:true,branchMasteries:{defense:30,slash:30,archery:40},branchCaps:classes[c.job].branchCaps,...options});
 return result[c.group].find(x=>x.id===c.id);
};
const modify=(c,ep,fn)=>{
 const source=structuredClone(skills),effect=source[c.id].funcs.find(x=>x.ep===ep);
 assert.ok(effect);fn(effect,source[c.id]);return source;
};
test('three paired self buffs retain OS baseline Remaked-model results and do not touch hero stats',()=>{
 const original=JSON.stringify(skills),before=JSON.stringify(combat);
 for(const c of cases){
  const x=preview(c);
  assert.ok(x,'source row '+c.id);
  assert.equal(x.amount,c.current);
  assert.equal(x.modelOnly,true);
  assert.equal(x.uncertain,true);
  assert.equal(x.available,true);
  assert.match(x.detailRu,/модел/);
  assert.match(x.detailEn,/model/i);
 }
 assert.equal(JSON.stringify(combat),before);
 assert.equal(JSON.stringify(skills),original);
});
test('new valid current OS FV1 values replace old hardcoded scalars and signed sibling penalties',()=>{
 for(const c of cases){
  const src=modify(c,c.ep,fx=>{fx.fv1[3]=c.newValue});
  const result=preview(c,src);
  assert.equal(result?.amount,c.changed,c.id+' replays upstream amount');
  assert.equal(result.modelOnly,true);
 }
 for(const c of cases.slice(0,2)){
  const src=modify(c,c.secondary,fx=>{fx.fv1[3]=c.second});
  const row=preview(c,src);
  assert.equal(row?.amount,c.current);
  assert.ok(row.detailEn.includes(String(-c.second)+'%'),'side penalty is current');
 }
 assert.equal(preview(cases[2],modify(cases[2],cases[2].secondary,fx=>{fx.fv1[3]=1})),undefined,'changed immunity marker must not be interpreted numerically');
});
test('all three models fail closed against unknown FV lanes, target, effects or sign reversal',()=>{
 let attempts=0;
 for(const c of cases){
  for(const ep of [c.ep,c.secondary]){
   for(const edit of [
    fx=>{fx.dir='CASTER'},fx=>{fx.fv1[0]=1},fx=>{fx.fv1[2]=1},
    fx=>{fx.fv2[0]=1},fx=>{fx.ep='EP_UNVERIFIED'}
   ]){
    assert.equal(preview(c,modify(c,ep,edit)),undefined,c.id+' '+ep);
    attempts++;
   }
  }
  assert.equal(preview(c,modify(c,c.ep,fx=>{fx.fv1[3]*=-1})),undefined);
  attempts++;
  const extra=structuredClone(skills);
  extra[c.id].funcs.push({ep:'EP_UNKNOWN_NEW',dir:'TARGET',fv1:[0,0,0,1],fv2:[0,0,0,0]});
  assert.equal(preview(c,extra),undefined);
  attempts++;
 }
 assert.equal(attempts,36);
});
test('28 classes x levels 1, 35, 55 preserve class/level gating across source previews',()=>{
 let n=0;
 for(const [job,entry] of Object.entries(classes))for(const level of [1,35,55]){
  const result=calc.scalingSkillPreview({skillCatalog:skills,jobKey:job,level,stats,combat,hasShield:true,branchMasteries:{defense:30,slash:30,archery:40},branchCaps:entry.branchCaps});
  for(const c of cases){
   const row=result[c.group].find(x=>x.id===c.id);
   if(row){
    assert.ok(skills[c.id].classes?.[job],'not a skill of unrelated class');
    assert.equal(row.amount,c.current);
    assert.equal(row.modelOnly,true);
    if(level<skills[c.id].charLevel)assert.equal(row.available,false);
   }
  }
  n++;
 }
 assert.equal(n,84);
});
