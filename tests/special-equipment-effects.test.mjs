import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};
Function('window',read('os-calculator.js'))(host);
const calc=host.PandoraOSCalculator;
const souls=JSON.parse(read('data/os/souls.json'));
const items=JSON.parse(read('data/os/items.json'));
const critical=souls['103013'],stubborn=souls['103019'],cursed=items['2841'];
test('OS Souls show exact critical vulnerability and Stubborn Heart descriptions',()=>{
 assert.equal(critical.name,'Душа несчастья');
 assert.match(critical.desc,/Все получаемые атаки будут критическими/);
 assert.equal(stubborn.name,'Вечная душа');
 assert.match(stubborn.desc,/при 5% ОЗ/);
 const r=calc.specialEquipmentPreview({records:[
  ['soul:103013',critical,0],['soul:103019',stubborn,0]]});
 assert.deepEqual(r.entries.map(x=>x.code),['EP_ALL_CRITICAL','EP_RACE_TOUGH_HEART']);
 assert.match(r.entries[0].ru,/критические удары/);
 assert.match(r.entries[1].ru,/5% ОЗ/);
 assert.match(r.entries[1].en,/5% HP/);
 assert.ok(r.entries.every(x=>x.verified===false));
});
test('cursed staff gradual HP drain is described without invented damage ticks',()=>{
 assert.match(cursed.desc,/Постепенное уменьшение ОЗ/);
 const r=calc.specialEquipmentPreview({records:[['item:2841',cursed,0]]});
 assert.equal(r.entries.length,1);
 assert.equal(r.entries[0].code,'EP_HEAL_LIFE_REGENERATOR');
 assert.equal(r.entries[0].ru,'Постепенное уменьшение ОЗ от предмета');
 assert.equal(Object.hasOwn(r.entries[0],'frequency'),false);
 assert.equal(Object.hasOwn(r.entries[0],'chance'),false);
});
test('inactive, unrelated and contradictory effect records do not add special effects',()=>{
 const r=calc.specialEquipmentPreview({records:[
  ['soul:103013',critical,-1],['other',{name:'Unrelated',effects:[
   {func:'EP_RACE_TOUGH_HEART',a:88},
   {func:'EP_HEAL_LIFE_REGENERATOR',a:10},
   {func:'EP_VITARITY_CONST',a:10}
  ]},0]
 ]});
 assert.deepEqual(r.entries,[]);
 assert.equal(calc.specialEquipmentPreview({records:[]}).entries.length,0);
});
test('the hero book shows special equipment effects without raw EP identifiers',()=>{
 const source=read('stage-attributes.js');
 assert.match(source,/modifiers\?\.specialEquipment\?\.entries/);
 assert.match(source,/Особые эффекты предметов и душ/);
 assert.match(source,/Special item and Soul effects/);
 assert.match(read('os-calculator.js'),/const specialEquipment=specialEquipmentPreview/);
 assert.match(read('os-calculator.js'),/experienceBonus,specialEquipment,regeneration/);
});
