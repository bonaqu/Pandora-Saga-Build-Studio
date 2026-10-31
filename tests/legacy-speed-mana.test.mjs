import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=readFileSync(new URL('../os-calculator.js',import.meta.url),'utf8');
const ctx={};Function('window',text)(ctx);
const calc=ctx.PandoraOSCalculator,stats={vit:25,str:35,agi:70,dex:35,spi:20,int:40};
test('Remaked base attack and cast speed use discrete AGI and DEX steps',()=>{
 const c=calc.combatPreview({stats,level:45});
 assert.equal(c.attackSpeed.base,130);
 assert.equal(c.attackSpeed.known,130);
 assert.equal(c.castingSpeed.base,115);
 assert.equal(c.verified,false);
});
test('OS attack interval gear and Souls combine only when grade matches',()=>{
 const records=[
  ['item:ring',{effects:[{func:'EP_ATTACKINTERVAL_SCALE',a:3}]},0],
  ['soul:giant',{effects:[{func:'EP_ATTACKINTERVAL_SCALE',a:-25,min:5,max:10}]},4]
 ];
 const x=calc.combatPreview({stats,level:45,records});
 assert.equal(x.attackSpeed.known,133);
 records[1][2]=6;
 assert.equal(calc.combatPreview({stats,level:45,records}).attackSpeed.known,108);
});
test('Legacy INT reduction and selected OS Elf passive reduce mana separately',()=>{
 const before=calc.combatPreview({stats,level:45});
 assert.deepEqual([before.manaCost.intReduction,before.manaCost.remaining],[1,99]);
 const elf=calc.combatPreview({stats,level:45,racialPassiveId:900020001});
 assert.deepEqual([elf.manaCost.racial,elf.manaCost.remaining],[15,84]);
 assert.equal(calc.combatPreview({stats,level:45,racialPassiveId:900020002}).manaCost.remaining,99);
});
test('equipped mana cost reduction, conditional Soul and Elf stack once',()=>{
 const records=[
  ['item:bracelet',{effects:[{func:'EP_RACE_MANA_COSTCUT',a:5}]},0],
  ['soul:sun',{effects:[{func:'EP_RACE_MANA_COSTCUT',a:4,min:5,max:10}]},4]
 ];
 const low=calc.combatPreview({stats,level:45,records,racialPassiveId:900020001});
 assert.equal(low.manaCost.remaining,79);
 records[1][2]=7;
 assert.equal(calc.combatPreview({stats,level:45,records,racialPassiveId:900020001}).manaCost.remaining,75);
});
test('partial context without INT retains other valid combat metrics',()=>{
 const out=calc.combatPreview({stats:{str:35,agi:70,dex:35},level:45});
 assert.equal(out.manaCost,null);
 assert.equal(out.attackSpeed.base,130);
});
test('vitals and character effect views receive mana speed preview',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const stage=readFileSync(new URL('../stage-attributes.js',import.meta.url),'utf8');
 assert.match(app,/combatContext:/);
 assert.match(stage,/cm\.attackSpeed/);
 assert.match(stage,/combat\?\.manaCost/);
});
