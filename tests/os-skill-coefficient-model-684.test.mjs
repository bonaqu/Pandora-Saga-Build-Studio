import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const stats={vit:50,str:70,agi:60,dex:55,spi:80,int:40};
const combat={attack:{walkingBase:160},defense:{directRaw:80},accuracy:{base:100},dodge:{base:125}};
const inspect=(job,branchMasteries={},overrides={})=>
 C.scalingSkillPreview({skillCatalog:skills,jobKey:job,level:50,
  branchMasteries,branchCaps:classes[job].branchCaps,stats,combat,...overrides});
const row=(job,id,mastery={})=>{
 const result=inspect(job,mastery);
 return [...result.offense,...result.defense].find(x=>x.id===id);
};
const model=(item,ep)=>item?.coefficientModels?.find(x=>x.ep===ep);

test('all projections are separate from unknown final server magnitudes',()=>{
 for(const [job,id,mastery] of [
  ['JUGGERNAUT',100058001,{slash:85}],
  ['SNIPER',213605001,{archery:40}],
  ['SNIPER',260005001,{warding:45}],
  ['JUGGERNAUT',142051001,{brush:70}],
  ['CONJURER',420002002,{embody:35}],
  ['CONJURER',420004002,{embody:35}],
  ['ENCHANTER',320011001,{blessing:78}],
  ['WARLOCK',410000101,{element:50}]
 ]){
  const x=row(job,id,mastery);
  assert.ok(x,'missing source-backed skill '+id);
  if([100058001,213605001].includes(id)){
   assert.ok(Number.isFinite(x.amount),'Numeric model required for '+id);
   assert.equal(x.modelOnly,true,'Estimated attack must not claim parity');
  }else assert.equal(x.amount,null,'Final damage is unknown for '+id);
  assert.equal(x.uncertain,true);
  assert.ok(x.coefficientModels.length>0,id);
  for(const p of x.coefficientModels)assert.equal(p.confidence,'coefficient-model');
 }
});
test('Remaked coefficient roles interpolate the CURRENT OS constants',()=>{
 assert.equal(model(row('JUGGERNAUT',100058001,{slash:85}),'EP_DAMAGERATE_SCALE')?.amount,69);
 assert.equal(model(row('SNIPER',213605001,{archery:40}),'EP_DAMAGERATE_SCALE')?.amount,32);
 assert.equal(model(row('SNIPER',213605001,{archery:40}),'EP_TOHIT_CONST')?.amount,32);
 assert.equal(model(row('SNIPER',213605001,{archery:40}),'EP_ATTACKRANGE_CONST')?.amount,320);
 assert.equal(model(row('SNIPER',260005001,{warding:45}),'EP_AVOIDANCE_CONST')?.amount,19);
 assert.equal(model(row('JUGGERNAUT',142051001,{brush:70}),'EP_CRITICALRATE_CONST')?.amount,24);
 assert.equal(model(row('CONJURER',420002002,{embody:35}),'EP_MANA_SHIELD')?.amount,17);
 assert.equal(model(row('CONJURER',420004002,{embody:35}),'EP_CASTINGCANCEL_RESISTANCE_CONST')?.amount,18);
 const priest=row('ENCHANTER',320011001,{blessing:78});
 assert.equal(model(priest,'EP_AURADAMAGE_SCALE')?.amount,41);
 assert.equal(model(priest,'EP_AURADAMAGE_CONST')?.amount,16);
 assert.equal(model(priest,'EP_ELEMENT_DAMAGE_SCALE')?.amount,25);
 assert.equal(model(row('WARLOCK',410000101,{element:50}),'EP_ELEMENT_DAMAGE_SCALE')?.amount,35);
});
test('250 artificial legal mastery scenarios are deterministic, monotone and read-only',()=>{
 const before=JSON.stringify({stats,combat});
 let checked=0;
 for(const [job,id,branch,ep] of [
  ['JUGGERNAUT',100058001,'slash','EP_DAMAGERATE_SCALE'],
  ['SNIPER',213605001,'archery','EP_TOHIT_CONST'],
  ['SNIPER',260005001,'warding','EP_AVOIDANCE_CONST'],
  ['CONJURER',420002002,'embody','EP_MANA_SHIELD'],
  ['WARLOCK',410000101,'element','EP_ELEMENT_DAMAGE_SCALE']
 ])for(let rank=0;rank<50;rank++){
  const a=row(job,id,{[branch]:rank}),b=row(job,id,{[branch]:rank+1});
  const ax=model(a,ep),bx=model(b,ep);
  assert.ok(ax&&bx,'model missing at '+id+' '+rank);
  assert.ok(bx.amount>=ax.amount,'model not monotone at '+id+' '+rank);
  if([100058001,213605001].includes(id)){
   assert.equal(a.modelOnly,true);assert.ok(Number.isFinite(a.amount));
  }else assert.equal(a.amount,null);
  checked++;
 }
 assert.equal(checked,250);
 assert.equal(JSON.stringify({stats,combat}),before);
});
test('changed OS source fails closed and unrelated skill remains available',()=>{
 const forged=structuredClone(skills);
 forged['100058001'].funcs.find(x=>x.ep==='EP_DAMAGERATE_SCALE').fv1[2]=99;
 const result=inspect('JUGGERNAUT',{slash:70},{skillCatalog:forged});
 assert.equal(result.offense.find(x=>x.id===100058001),undefined);
 assert.equal(model(row('JUGGERNAUT',142051001,{brush:50}),
  'EP_CRITICALRATE_CONST')?.amount,20);
 const outOfCap=inspect('SNIPER',{warding:999}).defense.find(x=>x.id===260005001);
 assert.ok(outOfCap);
 assert.equal(outOfCap.coefficientModels.length,0);
});
test('the Hero Book labels estimated coefficient models distinctly',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/skill\.coefficientModels/);
 assert.match(book,/Модель по коэффициентам OS/);
 assert.match(book,/server rounding not confirmed/);
 assert.match(book,/stage-skill-os-coefficient-model/);
});
