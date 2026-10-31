import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const c={};Function('window',read('os-calculator.js'))(c);
const calc=c.PandoraOSCalculator;
const pick=(slot,grade,type,element)=>({slot,grade,gem:{type,element},itemId:21});
test('Legacy physical weapon gemstone uses exact archived +7 aura values',()=>{
 const result=calc.gemstonePreview([pick('weapon',7,'physical','ice')]);
 assert.equal(result.auras.ice,11);
 assert.equal(result.status.ice,7);
 assert.equal(result.magic.ice,undefined);
 assert.equal(result.verified,false);
});
test('Legacy magical weapon +10 and +1 have non-linear bonuses',()=>{
 assert.equal(calc.gemstonePreview([pick('weapon',10,'magical','fire')]).magic.fire,40);
 assert.equal(calc.gemstonePreview([pick('weapon',1,'magical','fire')]).magic.fire,1);
 assert.equal(calc.gemstonePreview([pick('weapon',0,'magical','fire')]).items.length,0);
});
test('Legacy light armor gemstone gives half-grade three elemental resistances',()=>{
 const v=calc.gemstonePreview([
  pick('body',7,'physical','light'),pick('head',5,'magical','light')
 ]);
 assert.deepEqual(v.resistance,{fire:5,ice:5,lightning:5});
});
test('Legacy dark armor adds charm resistance, not a fabricated Dark bonus',()=>{
 const v=calc.gemstonePreview([pick('gloves',7,'magical','dark')]);
 assert.deepEqual(v.resistance,{charm:7});
 assert.equal(v.resistance.dark,undefined);
});
test('rainbow and unsupported stored legacy gem combinations remain uncounted',()=>{
 const v=calc.gemstonePreview([pick('weapon',10,'physical','rainbow'),
  pick('ring',10,'physical','fire'),pick('weapon',500,'magical','ice')]);
 assert.equal(v.items.length,0);
 assert.equal(v.uncertain.length,1);
});
test('integration reads existing saved gem choices and shows separate breakdown',()=>{
 const source=read('app.js'),book=read('stage-attributes.js');
 assert.match(source,/PandoraEnchantModel\.normalize\(/);
 assert.match(source,/gemSelections\.push\(/);
 assert.match(source,/itemForth:gameItemForth,gemSelections/);
 assert.match(book,/modifiers\.gemstones\.items\.length/);
 assert.match(book,/Сопротивления самоцветов учтены в разделе «Защита»/);
});
