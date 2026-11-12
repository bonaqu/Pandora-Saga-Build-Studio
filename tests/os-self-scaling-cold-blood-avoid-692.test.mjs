import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('pandora-studio-remaked-buffs.js'))(host);
Function('window',read('pandora-os-character-calculator.js'))(host);
const B=host.PandoraRemakedBuffs,C=host.PandoraOSCalculator;
const skills=JSON.parse(read('data/os/skills.json'));
const classes=JSON.parse(read('data/os/classes.json'));
const stats={vit:40,str:50,agi:70,dex:35,spi:30,int:50};
const base={skills,level:45,weapon:{kind:'1H_AXE'},stats};
test('self buff model uses entire current OS coefficient vector and source gates',()=>{
 const cold=B.applied({...base,jobKey:'WARRIOR',
  selected:[142051001],branchMasteries:{brush:21}});
 assert.deepEqual(cold.coldBlood,{critical:14,modeled:true});
 const fast=B.applied({...base,jobKey:'SNIPER',
  selected:[260005001],branchMasteries:{warding:41}});
 assert.deepEqual(fast.quickStep,{dodge:19,modeled:true});
 const comp={attack:{walkingBase:160},defense:{directRaw:80},
  accuracy:{base:80},dodge:{base:100}};
 const coldModel=C.scalingSkillPreview({skillCatalog:skills,jobKey:'WARRIOR',
  level:45,stats,combat:comp,branchMasteries:{brush:21},
  branchCaps:classes.WARRIOR.branchCaps,weaponKind:'1H_AXE'});
 assert.equal(coldModel.offense.find(x=>x.id===142051001)?.coefficientModels?.[0]?.amount,14);
 const fastModel=C.scalingSkillPreview({skillCatalog:skills,jobKey:'SNIPER',
  level:45,stats,combat:comp,branchMasteries:{warding:41},
  branchCaps:classes.SNIPER.branchCaps,weaponKind:'BARE_HAND'});
 assert.equal(fastModel.defense.find(x=>x.id===260005001)?.coefficientModels?.[0]?.amount,19);
});
test('250 synthetic source formula cases preserve floor thresholds and input state',()=>{
 const before=JSON.stringify(skills);let checked=0;
 for(let mastery=21;mastery<71;mastery++)
  for(const agi of [40,60,70,100,134]){
   const cold=B.applied({...base,jobKey:'WARRIOR',selected:[142051001],
    branchMasteries:{brush:mastery}});
   const fast=B.applied({...base,jobKey:'SNIPER',selected:[260005001],
    stats:{...stats,agi},branchMasteries:{warding:mastery}});
   assert.equal(cold.coldBlood.critical,10+Math.floor(mastery*20/100));
   assert.equal(fast.quickStep.dodge,
    10+Math.floor(agi*5/100)+Math.floor(mastery*15/100));
   checked++;
  }
 assert.equal(checked,250);
 assert.equal(JSON.stringify(skills),before);
});
test('invalid OS vector, stat, class and weapon fail closed',()=>{
 const forged=structuredClone(skills);
 forged['142051001'].funcs.find(f=>f.ep==='EP_CRITICALRATE_CONST').fv1[2]=99;
 forged['260005001'].funcs.find(f=>f.ep==='EP_AVOIDANCE_CONST').fv2[0]=1;
 assert.equal(B.applied({...base,jobKey:'WARRIOR',selected:[142051001],
  branchMasteries:{brush:21},skills:forged}).coldBlood,undefined);
 assert.equal(B.applied({...base,jobKey:'SNIPER',selected:[260005001],
  branchMasteries:{warding:41},skills:forged}).quickStep,undefined);
 assert.equal(B.applied({...base,jobKey:'SNIPER',selected:[142051001],
  branchMasteries:{brush:21},branchCaps:classes.SNIPER.branchCaps})
  .coldBlood,undefined,'No Cleaving can be trained by a Sniper');
 assert.equal(B.applied({...base,jobKey:'WARRIOR',selected:[142051001],
  branchMasteries:{brush:21},weapon:{kind:'BOW'}}).coldBlood,undefined);
 assert.equal(B.applied({...base,jobKey:'SNIPER',selected:[260005001],
  branchMasteries:{warding:41},stats:{...stats,agi:-2}}).quickStep,undefined);
});
test('combat preview exposes source model increments only if selected',()=>{
 const opts={stats,jobKey:'WARRIOR',level:45,
  weapon:{kind:'1H_AXE'},skillCatalog:skills,branchMasteries:{brush:21}};
 const plain=C.combatPreview({...opts,combatBuffs:{}});
 const active=C.combatPreview({...opts,combatBuffs:{remakedSkillIds:[142051001]}});
 assert.equal(active.critical.coldBlood,14);
 assert.equal(active.critical.known-plain.critical.known,14);
 assert.equal(active.verified,false);
 const dodgeOpts={...opts,jobKey:'SNIPER',weapon:null,branchMasteries:{warding:41}};
 const dodgeOff=C.combatPreview({...dodgeOpts,combatBuffs:{}});
 const dodgeOn=C.combatPreview({...dodgeOpts,combatBuffs:{remakedSkillIds:[260005001]}});
 assert.equal(dodgeOn.dodge.additionalSelf,19);
 assert.equal(dodgeOn.dodge.known-dodgeOff.dodge.known,19);
});
test('Book skill hints reuse their existing source-backed Skill Effects models',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/const selfModelRows=/);
 assert.match(book,/root\.PandoraOSCalculator\?\.scalingSkillPreview\?\.\(\{/);
 assert.match(book,/id===142051001\|\|id===260005001/);
 assert.match(book,/Шанс крита \+/);
 assert.match(book,/142051001:buffEffectText\(142051001\)/);
 assert.match(book,/260005001:buffEffectText\(260005001\)/);
 assert.doesNotMatch(book,/142051001:english\?'Critical chance \+10%'/);
});

test('published class caps reject impossible mastery even with a valid global skill class flag',()=>{
 const impossible=B.applied({...base,jobKey:'WARRIOR',
  branchCaps:classes.WARRIOR.branchCaps,
  selected:[260005001],branchMasteries:{warding:41}});
 assert.equal(impossible.quickStep,undefined);
 const valid=B.applied({...base,jobKey:'SNIPER',
  branchCaps:classes.SNIPER.branchCaps,
  selected:[260005001],branchMasteries:{warding:41}});
 assert.equal(valid.quickStep.dodge,19);
 const corrupt=B.applied({...base,jobKey:'WARRIOR',
  branchCaps:classes.WARRIOR.branchCaps,
  selected:[142051001],branchMasteries:{brush:99}});
 assert.equal(corrupt.coldBlood,undefined);
});
