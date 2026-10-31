import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('os-calculator.js'))(host);
const C=host.PandoraOSCalculator,items=JSON.parse(read('data/os/items.json'));
const item=id=>['item:'+id,items[id],0];
test('real OS attack and bow range additions are distinguished without pair double-counting',()=>{
 const entries=[11083,11542,11202,19006].map(item);
 const actual=C.attackRangePreview({records:entries});
 assert.equal(actual.general,100);
 assert.equal(actual.bow,350);
 assert.equal(actual.entries.length,4);
 assert.equal(actual.verified,false);
 assert.equal(items[11083].effects.filter(e=>e.func==='EP_RACE_CARRY').length,1);
 assert.equal(items[11202].effects.filter(e=>e.func==='EP_BOW_CARRY').length,1);
 assert.deepEqual(C.attackRangePreview({records:[]}).entries,[]);
 assert.deepEqual(C.attackRangePreview({records:[item(11083)]}).general,50);
});
test('source grade limits and invalid effect numbers cannot inflate attack reach',()=>{
 const source={name:'Test',effects:[
  {func:'EP_BOW_RANGE',a:150,min:7,max:10},
  {func:'EP_BOW_CARRY',a:150,min:7,max:10},
  {func:'EP_RACE_RANGE',a:NaN}
 ]};
 const at6=C.attackRangePreview({records:[['item:test',source,6]]});
 assert.deepEqual([at6.general,at6.bow],[0,0]);
 const at7=C.attackRangePreview({records:[['item:test',source,7]]});
 assert.deepEqual([at7.general,at7.bow],[0,150]);
 const invalid=C.attackRangePreview({records:[['item:test',source,11]]});
 assert.equal(invalid.entries.length,0);
});
test('book presents honest equipment bonuses only on the attack page',()=>{
 const book=read('stage-attributes.js'),calc=read('os-calculator.js');
 assert.match(book,/page==='attack'&&modifiers\?\.attackRange\?\.entries\?\.length/);
 assert.match(book,/Бонусы дальности от снаряжения/);
 assert.match(book,/Дальность атаки: /);
 assert.match(book,/Дальность стрельбы: /);
 assert.match(calc,/const attackRange=attackRangePreview\(\{records:combinedRecords,itemForth\}\)/);
});
