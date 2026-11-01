import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('os-calculator.js'))(host);
const calc=host.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const souls=JSON.parse(read('data/os/souls.json'));

const confirmed=[
 ['item:422',422,'При атаке: 9% шанс сбить противника с ног',9],
 ['item:1041',1041,'При атаке: 9% шанс оглушить противника',9],
 ['item:1211',1211,'При физической атаке: 4% шанс уронить врага',4],
 ['item:2802',2802,'При физической атаке: 4% шанс оглушить врага',4],
 ['soul:101010',101010,'При атаке: 4% шанс оглушить цель',4],
 ['soul:101011',101011,'При атаке: 4% шанс ослабить цель',4],
 ['soul:101012',101012,'При атаке: 4% шанс усыпить цель',4],
 ['soul:101021',101021,'При атаке: 4% шанс отравить цель',4],
 ['soul:101022',101022,'При атаке: 5% шанс замедлить цель',5]
];
const sourceRecord=([source,id])=>source.startsWith('soul:')?souls[id]:items[id];

test('nine on-hit procs are corroborated by official structured chance + original descriptions',()=>{
 for(const row of confirmed){
  const [source,id,ru,chance]=row,record=sourceRecord(row),effect=record.effects.find(
   e=>['EP_ONHIT_SKILL_EXEC','EP_ONHIT_STUN'].includes(e.func));
  assert.ok(record,'missing source record '+source);
  assert.ok(effect,'missing original effect '+source);
  assert.equal(effect.b,chance,'verified chanceB value: '+source);
  assert.ok(record.desc.includes(String(chance)+'%'),'original item text must confirm chance '+source);
  const preview=calc.specialEquipmentPreview({records:[[source,record,0]]});
  assert.equal(preview.entries.length,1,source);
  assert.equal(preview.entries[0].ru,ru);
  assert.ok(preview.entries[0].en.includes(String(chance)+'%'));
  assert.equal(preview.entries[0].verified,false);
  assert.equal(Object.hasOwn(preview.entries[0],'roll'),false);
  assert.equal(Object.hasOwn(preview.entries[0],'damage'),false);
  const coverage=calc.effectCoverage({records:[[source,record,0]]});
  assert.ok(coverage.counts.conditional>=1,source+' remains a conditional on-hit event');
 }
});
test('grade gates and modified chance, effect code, skill ID or source identity fail closed',()=>{
 const record=souls[101010],source='soul:101010';
 assert.deepEqual(calc.specialEquipmentPreview({records:[[source,record,11]]}).entries,[]);
 for(const changes of [{b:30},{a:80000001},{func:'EP_ONHIT_STUN'},{dir:'TARGET'}]){
  const modified={...record,effects:record.effects.map(e=>({...e,...changes}))};
  assert.deepEqual(calc.specialEquipmentPreview({records:[[source,modified,0]]}).entries,[]);
 }
 assert.deepEqual(calc.specialEquipmentPreview({records:[[
  'soul:101010',{...record,id:101011},0]]}).entries,[]);
 assert.deepEqual(calc.specialEquipmentPreview({records:[[
  source,{...record,desc:'Effect description currently unverified'},0]]}).entries,[]);
 assert.deepEqual(calc.specialEquipmentPreview({records:[[source,record,undefined]]}).entries,[]);
});
test('conflicting or unsupported proc chance sources are never presented as verified gameplay percentages',()=>{
 const vampire=souls[101009];
 assert.ok(vampire.desc.includes('4%'));
 assert.equal(vampire.effects.find(e=>e.func==='EP_ONHIT_SKILL_EXEC').b,5);
 for(const [source,record] of [
  ['soul:101009',vampire],
  ['item:1241',items[1241]],
  ['item:1851',items[1851]],
  ['item:1091',items[1091]]
 ])assert.deepEqual(calc.specialEquipmentPreview({records:[[source,record,0]]}).entries,[]);
});
test('on-hit previews use existing user-facing special effect UI, not physical combat totals',()=>{
 const ui=read('stage-attributes.js'),source=read('os-calculator.js');
 assert.match(ui,/modifiers\?\.specialEquipment\?\.entries/);
 assert.match(source,/confirmedOnHitRules/);
 assert.match(source,/entries\.push\(\{code:effect\.func,source:String\(record\.name\|\|source\)/);
 assert.match(source,/verified:false/);
});

test('real OS Traveler Boots source confirms a separate 8% on-damage Gust preview',()=>{
 const record=items[15082],source='item:15082',effect=record.effects.find(
  e=>e.func==='EP_ONDAMAGE_SKILL_EXEC');
 assert.equal(effect.a,260003001);
 assert.equal(effect.b,8);
 assert.equal(effect.dir,'TARGET');
 assert.match(record.desc,/При получении физического урона есть 8% вероятность получения эффекта порыва/);
 const original=calc.specialEquipmentPreview({records:[[source,record,0]]}).entries;
 assert.equal(original.length,1);
 assert.equal(original[0].ru,'При получении физического урона: 8% шанс получить «Порыв»');
 assert.match(original[0].en,/8% chance/);
 assert.equal(original[0].verified,false);
 for(const change of [{b:9},{a:260003002},{dir:'SELF'},{func:'EP_ONHIT_SKILL_EXEC'}]){
  const modified={...record,effects:record.effects.map(e=>
   e.func==='EP_ONDAMAGE_SKILL_EXEC'?{...e,...change}:e)};
  assert.deepEqual(calc.specialEquipmentPreview({records:[[source,modified,0]]}).entries,[],
   'must not trust changed game-data effect '+JSON.stringify(change));
 }
 for(const modified of [{...record,id:15083},
  {...record,desc:'Неизвестный шанс срабатывания'},
  {...record,desc:record.desc.replace('8%','9%')}])
  assert.deepEqual(calc.specialEquipmentPreview({records:[[source,modified,0]]}).entries,[]);
 assert.deepEqual(calc.specialEquipmentPreview({records:[[source,record,11]]}).entries,[]);
});

test('official English Traveler Boots prose activates the exact RU/EN proc preview',()=>{
 const en=JSON.parse(read('data/os/strings.en.json'));
 const original=items[15082],translated=en.items[15082],record={
  ...original,name:translated.n,desc:translated.d};
 assert.match(translated.d,/8% chance of gaining a Surge effect/);
 assert.equal(en.skills[260003001].n,'Dash','use the official skill name, not invented Gust');
 const preview=calc.specialEquipmentPreview({records:[['item:15082',record,0]]});
 assert.equal(preview.entries.length,1);
 assert.match(preview.entries[0].en,/8% chance to trigger Dash/);
 assert.equal(preview.entries[0].verified,false);
 const corrupted={...record,desc:record.desc.replace('8%','9%')};
 assert.equal(calc.specialEquipmentPreview({records:[['item:15082',corrupted,0]]}).entries.length,0);
});

test('all nine detailed on-hit descriptions match exact action phrasing in official RU and EN',()=>{
 const english=JSON.parse(read('data/os/strings.en.json'));
 for(const [kind,sourceId] of [
  ['item',422],['item',1041],['item',1211],['item',2802],
  ['soul',101010],['soul',101011],['soul',101012],
  ['soul',101021],['soul',101022]
 ]){
  const id=kind+':'+sourceId,base=(kind==='item'?items:souls)[sourceId];
  const translated=(kind==='item'?english.items:english.souls)[sourceId];
  const enRecord={...base,name:translated.n,desc:translated.d};
  assert.equal(calc.specialEquipmentPreview({records:[[id,base,0]]}).entries.length,1,id+' RU');
  assert.equal(calc.specialEquipmentPreview({records:[[id,enRecord,0]]}).entries.length,1,id+' EN');
  const otherChanceDescription={...base,desc:'Other effect triggers: '+base.effects.find(
   e=>['EP_ONHIT_SKILL_EXEC','EP_ONHIT_STUN'].includes(e.func)).b+'% chance to do something else'};
  assert.equal(calc.specialEquipmentPreview({records:[[id,otherChanceDescription,0]]}).entries.length,0,
   'same percent alone must not substantiate this specific proc: '+id);
  const tampered={...enRecord,desc:translated.d.replace(/chance/i,'opportunity')};
  assert.equal(calc.specialEquipmentPreview({records:[[id,tampered,0]]}).entries.length,0,
   'modified trigger wording cannot be silently accepted: '+id);
 }
});
