import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const current=read('data/os/skills.json');
const historical=read('data/catalog-history/pre-2026-11-15/skills.json');
const calc=skills=>({records:Object.keys(skills).length,
 effects:Object.values(skills).reduce((n,x)=>n+x.funcs.length,0),
 types:new Set(Object.values(skills).flatMap(x=>x.funcs.map(v=>v.ep))).size,
 learnableWithClass:Object.values(skills).filter(x=>x.learnable&&
  Object.values(x.classes||{}).some(Boolean)).length});
test('current published 571-skill/1076-effect graph is not historical 569/1070',()=>{
 assert.deepEqual(calc(historical),{records:569,effects:1070,types:283,learnableWithClass:232});
 assert.deepEqual(calc(current),{records:571,effects:1076,types:283,learnableWithClass:234});
 const added=Object.keys(current).filter(id=>!Object.hasOwn(historical,id));
 assert.deepEqual(added,['420007101','420007102']);
 assert.equal(current['420007101'].funcs[0].fv1[3],420007102);
 assert.equal(current['420007102'].learnable,false);
 assert.equal(current['240009001'].learnable,true);
 assert.equal(historical['240009001'].learnable,false);
});
