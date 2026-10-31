import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',get('os-calculator.js'))(scope);
const calc=scope.PandoraOSCalculator;
test('Legacy standing HP/MP amount uses max vitals and attributes separately',()=>{
 const result=calc.recoveryAmountPreview({maxHp:3500,maxMp:1250,
  stats:{vit:60,spi:45}});
 assert.deepEqual([result.hp.maxContribution,result.hp.attributeContribution,
  result.hp.known],[100,20,120]);
 assert.deepEqual([result.mp.maxContribution,result.mp.attributeContribution,
  result.mp.known],[50,15,65]);
 assert.equal(calc.recoveryAmountPreview({maxHp:null,maxMp:100,
  stats:{vit:1,spi:1}}),null);
});
test('invalid vitals cannot produce a misleading recovery amount',()=>{
 assert.equal(calc.recoveryAmountPreview({maxHp:NaN,maxMp:1250,stats:{vit:30,spi:30}}),null);
 assert.equal(calc.recoveryAmountPreview({maxHp:300,maxMp:1250,stats:{vit:-1,spi:30}}),null);
});
test('Honor2 and real healing scale gear stack in skill healing, not potions',()=>{
 const item={effects:[{func:'EP_CAST_HEAL_LIFE_SCALE',a:3}]};
 const soul={effects:[{func:'EP_CAST_HEAL_LIFE_SCALE',a:5,min:3,max:10}]};
 const records=[['item:1',item,0],['soul:1',soul,4]];
 const out=calc.healingSkillPreview({honorTitle:2,records});
 assert.deepEqual([out.base,out.honor,out.equipment,out.percent],[100,10,8,118]);
 assert.equal(calc.healingSkillPreview({honorTitle:2,records:
  [['item:1',item,0],['soul:1',soul,1]]}).percent,113);
});
test('Forth healing scale grade snapshots are used and never applied twice',()=>{
 const item={id:777,name:'Healing',effects:[{func:'EP_CAST_HEAL_LIFE_SCALE',a:3}]};
 const source={'777':{'7':[{'func':'EP_CAST_HEAL_LIFE_SCALE','a':2}]}};
 const result=calc.healingSkillPreview({records:[['item:777',item,7]],itemForth:source});
 assert.equal(result.percent,105);
});
test('MP recovery speed and final skill delay Soul codes are separate from recovery amounts',()=>{
 const stats={vit:50,str:40,agi:60,dex:30,spi:45,int:60};
 const records=[['soul:moon',{effects:[{func:'EP_HEAL_TIME_SCALE',a:15,min:0,max:10},
  {func:'EP_SKILL_DELAY_FIN',a:5,min:0,max:10}]},7]];
 const combat=calc.combatPreview({stats,level:45,records});
 assert.equal(combat.mpRecoveryEquipmentRate,15);
 assert.equal(combat.skillDelayFinalEquipment,5);
 const regular=calc.recoveryAmountPreview({maxHp:3500,maxMp:1250,stats});
 assert.equal(regular.mp.known,65);
});
test('stage includes distinct skill healing, standing recovery and external regen rate',()=>{
 const stage=get('stage-attributes.js');
 assert.match(stage,/modifiers\?\.healingSkill/);
 assert.match(stage,/modifiers\?\.recoveryAmount/);
 assert.match(stage,/mpRecoveryEquipmentRate/);
});
