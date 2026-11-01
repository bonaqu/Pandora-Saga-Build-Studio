import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('os-calculator.js'))(host);
const calc=host.PandoraOSCalculator;
const items=JSON.parse(read('data/os/items.json'));
const cures=calc.statusCurePreview({items});
const byId=id=>cures.rows.find(row=>row.id===id);
test('actual OS cleansing items resolve exact status effects without healing assumptions',()=>{
 assert.equal(cures.rows.length,9);
 assert.deepEqual(byId(50013).conditions,['Ожоги']);
 assert.deepEqual(byId(50015).conditions,['Слабость и проклятие','Безумие','Болезнь']);
 assert.deepEqual(byId(50057).conditions,['Яд']);
 assert.deepEqual(byId(50058).conditions,['Заморозка','Немота','Болезнь','Ожоги']);
 assert.deepEqual(byId(50065).conditions,byId(50058).conditions);
 assert.deepEqual(byId(90038).conditions,byId(50058).conditions);
 assert.equal(cures.verified,false);
 assert.equal(Object.hasOwn(byId(50065),'hp'),false);
});
test('missing or unexpected effects never invent a cure',()=>{
 const fake=structuredClone(items);
 fake[50057]={...fake[50057],effects:[{func:'EP_HEAL_LIFE',a:100}]};
 const actual=calc.statusCurePreview({items:fake});
 assert.equal(actual.rows.some(row=>row.id===50057),false);
 assert.deepEqual(calc.statusCurePreview({items:{}}).rows,[]);
 assert.equal(calc.statusCurePreview({items:null}),null);
 const duplicate={50057:{name:'Test',effects:[
  {func:'EP_RECOVERY_POISON',dir:'TARGET'},
  {func:'EP_RECOVERY_POISON',dir:'TARGET'},
  {func:'EP_RECOVERY_BURN',dir:'SELF'}]}};
 assert.deepEqual(calc.statusCurePreview({items:duplicate}).rows[0].conditions,['Яд']);
});
test('Hero Book keeps cleansing consumables separate and directly linked to the wiki',()=>{
 const book=read('stage-attributes.js'),calculator=read('os-calculator.js');
 assert.match(book,/english\?'Remove status effects':'Снятие состояний'/);
 assert.match(book,/stage-status-cures/);
 assert.match(book,/onItem\(entry\.id\)/);
 assert.match(calculator,/const statusCures=statusCurePreview\(\{items:consumableItems\}\)/);
 assert.match(calculator,/consumableRecovery,consumableSkills,statusCures,combat/);
});

test('RU and EN status cure labels preserve every original source effect',()=>{
 assert.deepEqual(byId(50013).conditionsEn,['Burn']);
 assert.deepEqual(byId(50015).conditionsEn,['Weakness and curse','Madness','Disease']);
 assert.deepEqual(byId(50058).conditionsEn,['Freeze','Silence','Disease','Burn']);
 assert.equal(byId(50065).conditionsEn.length,byId(50065).conditions.length);
});
