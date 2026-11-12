import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
const C=host.PandoraOSCalculator;
const stats={vit:40,str:50,agi:65,dex:60,spi:80,int:80};
const combat={attack:{walkingBase:160},defense:{directRaw:90},accuracy:{base:100},dodge:{base:110}};
const inspect=(job,mastery,options={})=>C.scalingSkillPreview({
 skillCatalog:skills,jobKey:job,level:50,
 branchCaps:classes[job].branchCaps,branchMasteries:mastery,
 stats,combat,...options});
const lookup=(result,id)=>[...result.offense,...result.defense].find(x=>x.id===id);

test('all four source-scaled spell parameters expose their exact coefficient result',()=>{
 const abs=lookup(inspect('EXORCIST',{exorcism:45}),330002001);
 const shield=lookup(inspect('CONJURER',{embody:35}),420002002);
 const trail=lookup(inspect('CONJURER',{embody:35}),420004002);
 const focus=lookup(inspect('WARLOCK',{element:50}),410000101);
 assert.equal(abs.amount,10+Math.floor(80*.20)+Math.floor(45*.20));
 assert.equal(shield.amount,10+Math.floor(35*.20));
 assert.equal(trail.amount,1+Math.floor(80*.15)+Math.floor(35*.15));
 assert.equal(focus.amount,20+Math.floor(50*.30));
 for(const row of [abs,shield,trail,focus]){
  assert.equal(row.available,true);
  assert.equal(row.modelOnly,true,'Parameters do not assert combat target parity');
  assert.equal(row.coefficientModels[0].amount,row.amount);
 }
});

test('250 mastery / SPI thresholds preserve floor arithmetic and read-only state',()=>{
 const copy=JSON.stringify(skills);
 let count=0;
 for(let rank=21;rank<=70;rank++){
  for(const spi of [1,69,80,134,200]){
   const current={...stats,spi};
   const result=inspect('CONJURER',{embody:rank},{stats:current});
   const s=lookup(result,420002002),w=lookup(result,420004002);
   assert.equal(s.amount,10+Math.floor(rank*.20));
   assert.equal(w.amount,1+Math.floor(spi*.15)+Math.floor(rank*.15));
   assert.equal(s.coefficientModels[0].amount,s.amount);
   assert.equal(w.coefficientModels[0].amount,w.amount);
   count++;
  }
 }
 assert.equal(count,250);
 assert.equal(JSON.stringify(skills),copy);
});

test('invalid source, missing skill, class cap and secondary vector fail closed',()=>{
 const forged=structuredClone(skills);
 forged['420002002'].funcs.find(x=>x.ep==='EP_MANA_SHIELD').fv2[3]=16;
 forged['410000101'].funcs.find(x=>x.ep==='EP_ELEMENT_BONUS').fv1[3]=31;
 const selected=inspect('CONJURER',{embody:35},{skillCatalog:forged});
 assert.equal(lookup(selected,420002002),undefined);
 assert.ok(lookup(selected,420004002),'Independent valid spell preserved');
 assert.equal(lookup(inspect('WARLOCK',{element:50},{skillCatalog:forged}),410000101),undefined);
 const invalid=inspect('WARLOCK',{element:91});
 assert.equal(lookup(invalid,410000101)?.amount,null);
 const missing=inspect('WARRIOR',{element:50,embody:50,exorcism:50});
 for(const id of [330002001,420002002,420004002,410000101])
  assert.equal(lookup(missing,id),undefined,'Wrong class cannot gain '+id);
});

test('variant selection preserves level 49 lower rank and 50 Conjurer upgrade',()=>{
 const early=inspect('CONJURER',{embody:35},{level:49});
 const advanced=inspect('CONJURER',{embody:35},{level:50});
 for(const [rootId,upgradedId,rootAmount,advancedAmount] of [
  [420002001,420002002,13,17],
  [420004001,420004002,12,18]]){
  assert.equal(lookup(early,rootId)?.amount,rootAmount);
  assert.equal(lookup(early,upgradedId),undefined);
  assert.equal(lookup(advanced,rootId),undefined);
  assert.equal(lookup(advanced,upgradedId)?.amount,advancedAmount);
 }
});
