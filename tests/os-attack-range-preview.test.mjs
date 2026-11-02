import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const host={};Function('window',read('pandora-os-character-calculator.js'))(host);
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
 const book=read('pandora-studio-hero-book.js'),calc=read('pandora-os-character-calculator.js');
 assert.match(book,/page==='attack'&&modifiers\?\.attackRange\?\.entries\?\.length/);
 assert.match(book,/Бонусы дальности от снаряжения/);
 assert.match(book,/Дальность атаки: /);
 assert.match(book,/Дальность стрельбы: /);
 assert.match(calc,/const attackRange=attackRangePreview\(\{records:combinedRecords,itemForth,/);
});

test('official base distance is typed by equipped weapon, without multiplying speculative gear bonuses',()=>{
 const melee={slot:'weapon',kind:'SWORD',range:115};
 const bow={slot:'weapon',kind:'BOW',range:1750};
 const crossbow={slot:'weapon',kind:'CROSSBOW',range:2050};
 const bonuses=[['item:range',{effects:[
  {func:'EP_RACE_RANGE',a:50},{func:'EP_BOW_RANGE',a:150},
  {func:'EP_RACE_CARRY',a:50},{func:'EP_BOW_CARRY',a:150}
 ]},0]];
 const sword=C.attackRangePreview({records:bonuses,weapon:melee});
 assert.deepEqual([sword.baseMelee,sword.baseRanged,sword.general,sword.bow],
  [115,null,50,150]);
 const arrow=C.attackRangePreview({records:bonuses,weapon:bow});
 assert.deepEqual([arrow.baseMelee,arrow.baseRanged,arrow.general,arrow.bow],
  [null,1750,50,150]);
 assert.deepEqual([C.attackRangePreview({weapon:crossbow}).baseRanged,
  C.attackRangePreview({weapon:{slot:'shield',kind:'BOW',range:1750}}).baseRanged],
  [2050,null]);
 assert.equal(C.attackRangePreview({records:bonuses}).baseOnly,false);
 assert.equal(C.attackRangePreview({weapon:{slot:'weapon',kind:'BOW',range:0}}).baseOnly,false);
});
test('base() passes eligible weapon source range to the 43-result book but never adds range bonuses',()=>{
 const book=read('pandora-studio-hero-book.js');
 const classes=JSON.parse(read('data/os/classes.json')),tables=JSON.parse(read('data/os/tables.json'));
 const zero={vit:0,str:0,agi:0,dex:0,spi:0,int:0};
 const weapon={id:999,slot:'weapon',kind:'BOW',range:1800,W:10};
 const out=C.base({classData:classes.ARCHER,raceData:tables.raceInit.ELF,
  jobData:tables.jobInit.SCOUT,allocation:zero,level:20,
  combatContext:{weapon}});
 assert.equal(out.attackRange.baseRanged,1800);
 assert.equal(out.attackRange.baseMelee,null);
 assert.equal(out.attackRange.baseOnly,true);
 assert.match(book,/calc\?\.attackRange\?\.baseRanged/);
 assert.match(book,/базовое значение OS в исходных единицах/);
});
