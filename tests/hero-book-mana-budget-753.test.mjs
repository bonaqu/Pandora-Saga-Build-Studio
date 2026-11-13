import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root={};
Function('window',read('pandora-studio-book-skill-thresholds.js'))(root);
const budget=root.PandoraBookSkillThresholds.baseManaBudget;
const source=JSON.parse(read('data/os/skills.json'));

test('Full-build MP budget is exact integer division at OS base skill cost',()=>{
 const cost=source['310022001'].mana;
 assert.equal(cost,90);
 assert.deepEqual(budget({maxMana:450,baseCost:cost}),
  {casts:5,remainder:0,maxMana:450,baseCost:90,
   baseOnly:true,usesCurrentMana:false});
 assert.deepEqual(budget({maxMana:479,baseCost:cost}),
  {casts:5,remainder:29,maxMana:479,baseCost:90,
   baseOnly:true,usesCurrentMana:false});
 assert.equal(budget({maxMana:89,baseCost:90}).casts,0);
 assert.equal(budget({maxMana:0,baseCost:90}).casts,0);
});
test('Unknown, fractional, free, or invalid resource costs never get invented cast totals',()=>{
 for(const [maxMana,baseCost] of [
  [null,90],[Number.NaN,90],[Infinity,90],
  [-1,90],[450,0],[450,-2],[450,2.5],[450,undefined],[4.5,2]
 ])assert.equal(budget({maxMana,baseCost}),null);
});
test('Hero Book uses current hero max MP only for available source-gated skills',()=>{
 const book=read('pandora-studio-hero-book.js');
 assert.match(book,/maxMana:modifiers\?\.mp/);
 assert.match(book,/baseCost:action\?\.mana/);
 assert.match(book,/showBaseManaBudget\(preview,action\)/);
 assert.match(book,/Full запас|Полный запас/);
 assert.match(book,/Без восстановления и скидок на расход/);
 assert.match(book,/row\.kind==='mp'&&row\.id===330005001/);
 assert.match(book,/Как рассчитано восстановление ОМ/);
 assert.match(book,/row\.kind==='mp'\?' ОМ':' ОЗ'/);
});
