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

test('the official Dawn Veil physical-evasion chance remains a conditional, source-backed preview',()=>{
 const veil=items['11552'];
 assert.equal(veil.name,'Рассветная вуаль для мирины');
 assert.match(veil.desc,/Шанс уклониться от физической атаки \+3%/);
 assert.ok(veil.effects.some(e=>e.func==='EP_DESTINE_WARDING'&&
  e.dir==='TARGET'&&e.a===3));
 const result=calc.specialEquipmentPreview({records:[['item:11552',veil,0]]});
 assert.equal(result.entries.length,1);
 assert.equal(result.entries[0].code,'EP_DESTINE_WARDING');
 assert.equal(result.entries[0].ru,'Шанс уклониться от физической атаки +3%');
 assert.equal(result.entries[0].en,'Physical attack evasion chance +3%');
 assert.equal(result.entries[0].verified,false);
 const raw=calc.gatherEffects([['item:11552',veil,0]]);
 assert.equal(raw.bonuses.dodge||0,0,'proc must not inflate static Dodge');
 const coverage=calc.effectCoverage({records:[['item:11552',veil,0]]});
 assert.ok(coverage.counts.conditional>=1,'the proc still awaits its OS combat roll');
});
test('mismatched IDs, values or invalid grade gates never claim Dawn Veil evasion',()=>{
 const fake=(id,a,dir='TARGET')=>['item:'+id,{id,name:'unverified',
  effects:[{func:'EP_DESTINE_WARDING',a,dir}]},0];
 for(const row of [fake(11552,10),fake(11553,3),fake(11552,3,'CASTER')])
  assert.equal(calc.specialEquipmentPreview({records:[row]}).entries.length,0);
 const gated={...items['11552'],effects:[{func:'EP_DESTINE_WARDING',
  dir:'TARGET',a:3,min:5,max:10}]};
 assert.equal(calc.specialEquipmentPreview({records:[['item:11552',gated,4]]}).entries.length,0);
 assert.equal(calc.specialEquipmentPreview({records:[['item:11552',gated,5]]}).entries.length,1);
});
