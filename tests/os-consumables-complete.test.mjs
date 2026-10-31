import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const host={};Function('window',read('os-calculator.js'))(host);
const C=host.PandoraOSCalculator,items=JSON.parse(read('data/os/items.json'));
test('all 20 current healing potions are discovered; dual HP/MP counts once',()=>{
 const p=C.consumableRecoveryPreview({items,maxHp:1000,maxMp:1000});
 assert.equal(p.allRows.length,20);
 assert.equal(p.rows.length,8);
 assert.equal(p.healthRows.length,12);
 assert.deepEqual(p.rows.map(v=>v.id).filter(id=>[50061,50063].includes(id)),[50061,50063]);
 assert.equal(p.healthRows.some(v=>[50061,50063].includes(v.id)),false);
 const h=id=>p.healthRows.find(v=>v.id===id);
 assert.equal(h(50001).hp,60);assert.equal(h(50002).hp,120);
 assert.equal(h(50003).hp,180);assert.equal(h(50004).hp,150);
 assert.equal(h(50065).hp,150);assert.equal(h(70026).hp,300);
});
test('new future OS potion enters correct recovery group without static ID changes',()=>{
 const future={...items,999998:{name:'Future mana',kind:'POTION',
  effects:[{dir:'TARGET',func:'EP_HEAL_MANA_RATE',a:10}]}};
 const p=C.consumableRecoveryPreview({items:future,maxHp:1000,maxMp:510});
 assert.equal(p.rows.find(x=>x.id===999998).mp,51);
 assert.equal(p.healthRows.some(x=>x.id===999998),false);
 const invalid={...items,999997:{name:'Not a potion',kind:'STAFF',
  effects:[{dir:'TARGET',func:'EP_HEAL_LIFE',a:50}]},
  999996:{name:'Self-only',kind:'POTION',
   effects:[{dir:'SELF',func:'EP_HEAL_LIFE',a:50}]}};
 const q=C.consumableRecoveryPreview({items:invalid,maxHp:1000,maxMp:500});
 assert.equal(q.allRows.some(x=>x.id===999997||x.id===999996),false);
});
test('status cures support newly published conditions and reject duplicates',()=>{
 const base=C.statusCurePreview({items});
 assert.equal(base.rows.length,9);
 assert.equal(base.rows.find(x=>x.id===50058).conditions.length,4);
 const next={...items,999999:{name:'Future cure',kind:'POTION',effects:[
  {dir:'TARGET',func:'EP_RECOVERY_BURN'},
  {dir:'TARGET',func:'EP_RECOVERY_BURN'},
  {dir:'TARGET',func:'EP_RECOVERY_UNKNOWN'},
  {dir:'SELF',func:'EP_RECOVERY_SILENCE'}]}};
 const extended=C.statusCurePreview({items:next});
 assert.equal(extended.rows.length,10);
 assert.deepEqual(extended.rows.at(-1).conditions,['Ожоги']);
});
test('health-only items are collapsed and link to the existing encyclopedia',()=>{
 const book=read('stage-attributes.js');
 assert.match(book,/stage-health-consumables/);
 assert.match(book,/Предметы восстановления ОЗ/);
 assert.match(book,/onItem\(entry\.id\)/);
});
