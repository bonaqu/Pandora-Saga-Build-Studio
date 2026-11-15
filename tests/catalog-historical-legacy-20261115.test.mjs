import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const historic='data/catalog-history/pre-2026-11-15/';
test('preserved historical skill and class signatures differ from published new catalog',()=>{
 const before=read(historic+'skills.json'),after=read('data/os/skills.json');
 assert.equal(Object.keys(before).length,569);
 assert.equal(Object.keys(after).length,571);
 assert.equal(before[320006001].funcs.length,2);
 assert.equal(after[320006001].funcs.length,1);
 assert.equal(before[240009001].learnable,false);
 assert.equal(after[240009001].learnable,true);
 assert.equal(read(historic+'classes.json').CONJURER.branchCaps.warding,5);
 assert.equal(read('data/os/classes.json').CONJURER.branchCaps.warding,10);
 assert.equal(read(historic+'tables.json').levelCap,45);
 assert.equal(read('data/os/tables.json').levelCap,50);
});
test('historical RU descriptions are carried into the candidate unmodified',()=>{
 const before=read(historic+'instances.json');
 const after=read('data/os/instances.json');
 for(const row of before)assert.deepEqual(after.find(x=>x.id===row.id),row);
});