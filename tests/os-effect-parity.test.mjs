import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../os-calculator.js',import.meta.url),'utf8');
const api={};Function('window',src)(api);
test('OS banker rounding handles ties, fractions and negatives',()=>{
 const f=api.PandoraOSCalculator.halfToEven;
 assert.equal(f(2.5),2);assert.equal(f(3.5),4);
 assert.equal(f(2.49),2);assert.equal(f(2.51),3);
 assert.equal(f(-1.5),-2);assert.equal(f(-2.5),-2);
});
test('basic ability percent uses floor of unmodified base',()=>{
 const f=api.PandoraOSCalculator.effectiveAbility;
 assert.equal(f(21,3,10),26);
 assert.equal(f(1,-100,0),1);
});
test('flat item and Soul effects modify only supported fields',()=>{
 const e=api.PandoraOSCalculator.gatherEffects([
 ['item1',{effects:[{func:'EP_VITARITY_CONST',a:2},{func:'EP_MAXLIFE_CONST',a:15},{func:'UNKNOWN_EFFECT',a:100}]},0],
 ['soul1',{effects:[{func:'EP_MAXMANA_CONST',a:20,min:4,max:10}]},5]
 ]);
 assert.equal(e.flat.vit,2);assert.equal(e.health.hp,15);assert.equal(e.health.mp,20);
 assert.deepEqual(e.ignored,['UNKNOWN_EFFECT']);
});
test('OS reference coefficients match saved Gladiator example',()=>{
 const c=api.PandoraOSCalculator.base({
 classData:{hp:{base:150,lv:31.35,vit:11.82},mp:{base:30,lv:2.73,spi:2.53}},
 raceData:{vit:7,spi:4,str:1,agi:1,dex:1,int:1},
 jobData:{vit:0,spi:0,str:0,agi:0,dex:0,int:0},
 allocation:{},level:45
 });
 assert.equal(c.hp,1643);assert.equal(c.mp,163);assert.equal(c.verified,false);
});
