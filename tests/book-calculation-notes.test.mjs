import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('methodology notes stay available but collapsed instead of filling every book page',()=>{
 const stage=read('stage-attributes.js');
 assert.match(stage,/const details=make\('details',\{class:'stage-methodology'\}\)/);
 assert.match(stage,/Подробнее о точности расчёта/);
 assert.match(stage,/details\.children\.length>1/);
 assert.match(stage,/!node\.closest\('details'\)/);
 assert.doesNotMatch(stage,/if\(chosen!=='buffs'\)body\.append\(make\('p',\{class:'stage-attribute-warning'/);
});
test('legacy effect disclosure remains usable without unconfirmed server values in main summary',()=>{
 const stage=read('stage-attributes.js');
 assert.match(stage,/Что осталось вне итоговых чисел/);
 assert.doesNotMatch(stage,/Учтено структурированных эффектов предметов и душ/);
 assert.match(read('style.css'),/\.stage-methodology:not\(\[open\]\)>p\{display:none\}/);
});
