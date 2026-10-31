import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../os-calculator.js',import.meta.url),'utf8');
const ctx={};Function('window',src)(ctx);
const titles=ctx.PandoraOSCalculator.honorTitles;
const approved=["Сила познания","Золотое сердце","Том огня","Том льда","Том грозы","Бешенство","Мастер наездника","Тайна стража","Том тьмы","Том света","Сила воли","Невероятная ловкость","Мастер боя"];
test('all 13 Honor titles match exact Remaked approved Russian names in ID order',()=>{
 assert.equal(titles.length,14);
 assert.deepEqual(titles.slice(1).map(x=>x.ru),approved);
 assert.equal(titles[0].ru,'Нет титула');
});
test('renaming Honor labels changes no saved ids or combat effects',()=>{
 assert.deepEqual(titles.map(x=>x.id),Array.from({length:14},(_,i)=>i));
 assert.equal(titles[1].effects.allAttributes,1);
 assert.equal(titles[3].effects.attackPercent,2);
 assert.equal(titles[11].effects.defense,5);
 assert.equal(titles[12].effects.accuracy,-10);
 assert.equal(titles[13].effects.dodge,-10);
 const calc=ctx.PandoraOSCalculator;
 assert.equal(calc.selectedHonor({honorTitle:11}).ru,'Сила воли');
 assert.equal(calc.selectedHonor({honorTitle:1}).ru,'Сила познания');
});
test('source provenance is recorded, names are not inferred from machine translations',()=>{
 const docs=readFileSync(new URL('../docs/REMAKED_CALCULATOR_PORT.md',import.meta.url),'utf8');
 assert.match(docs,/approved-translations\.v1\.json/);
 assert.match(docs,/calculator\.honor\.0\.\.12/);
});
