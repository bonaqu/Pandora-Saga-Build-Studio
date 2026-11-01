import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const scope={};Function('window',read('os-calculator.js'))(scope);
const items=JSON.parse(read('data/os/items.json')),calc=scope.PandoraOSCalculator;

test('actual OS mana potions recover fixed source MP and 15% of maximum MP',()=>{
 const r=calc.consumableRecoveryPreview({items,maxHp:800,maxMp:753});
 const byId=id=>r.rows.find(x=>x.id===id);
 assert.equal(byId(50006).mp,30);
 assert.equal(byId(50007).mp,60);
 assert.equal(byId(50008).mp,90);
 assert.equal(byId(50009).mp,112);
 assert.equal(byId(70027).mp,80);
 assert.ok(r.rows.every(x=>x.mp>0));
});
test('dual recovery item keeps HP and MP effects separate, source percent uses respective maximum',()=>{
 const r=calc.consumableRecoveryPreview({items,maxHp:1001,maxMp:759});
 assert.deepEqual(r.rows.find(x=>x.id===50061).effects.map(x=>[x.kind,x.basic]),
  [['hp',145],['mp',75]]);
 const dual=r.rows.find(x=>x.id===50063);
 assert.equal(dual.hp,50);
 assert.equal(dual.mp,75);
 assert.deepEqual(dual.effects.map(x=>x.func),['EP_HEAL_LIFE_RATE','EP_HEAL_MANA_RATE']);
});
test('known Remaked POT recovery bonus applies only to HP, not unverified mana multipliers',()=>{
 const r=calc.consumableRecoveryPreview({items,maxHp:1000,maxMp:1000,
  potionRate:120,applyHpPotionBonus:true});
 const mixed=r.rows.find(x=>x.id===50061);
 assert.equal(mixed.hp,174);
 assert.equal(mixed.mp,75);
 const percent=r.rows.find(x=>x.id===50063);
 assert.equal(percent.hp,60);
 assert.equal(percent.mp,100);
 const baseline=calc.consumableRecoveryPreview({items,maxHp:1000,maxMp:1000,
  potionRate:120,applyHpPotionBonus:false});
 assert.equal(baseline.rows.find(x=>x.id===50061).hp,145);
});
test('incomplete catalog and invalid maxima never invent recovery',()=>{
 assert.equal(calc.consumableRecoveryPreview({items,maxHp:NaN,maxMp:100}),null);
 assert.equal(calc.consumableRecoveryPreview({items,maxHp:100,maxMp:-1}),null);
 assert.deepEqual(calc.consumableRecoveryPreview({items:{},maxHp:100,maxMp:100}).rows,[]);
});
test('model passes actual OS items and displays clickable items in the hero book',()=>{
 assert.match(read('app.js'),/consumableItems:catalogSource\?\.items/);
 assert.match(read('os-calculator.js'),/const consumableRecovery=consumableRecoveryPreview/);
 assert.match(read('stage-attributes.js'),/Предметы восстановления ОМ/);
 assert.match(read('stage-attributes.js'),/entry\.mp\+\(english\?' MP':' ОМ'\)/);
});
