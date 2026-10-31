import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('saving an opened build reuses ID instead of duplicating it',()=>{
 const source=read('app.js');
 assert.match(source,/const existingIndex=builds\.findIndex\(b=>b\.id===activeBuildId\)/);
 assert.match(source,/const id=existingIndex>=0\?builds\[existingIndex\]\.id:newId\(\)/);
 assert.match(source,/if\(existingIndex>=0\)builds\.splice\(existingIndex,1\)/);
 assert.match(source,/selectActiveBuild\(latest\.id\)/);
 assert.match(source,/selectActiveBuild\(null\);state=fresh\(\)/);
 assert.match(source,/text:'Сохранить копию'/);
 assert.match(source,/text:'↻ Обновить библиотеку'/);
});
test('opening imported public build does not overwrite an unrelated saved original',()=>{
 const source=read('app.js');
 assert.match(source,/selectActiveBuild\(null\);state=incoming/);
 assert.match(source,/if\(activeBuildId===b\.id\)selectActiveBuild\(null\)/);
 assert.match(source,/if\(reconciled\.activeId!==activeBuildId\)selectActiveBuild\(reconciled\.activeId\)/);
 assert.match(read('build-library-merge.js'),/if\(selected&&!merged\.some\(x=>x\.id===selected\)\)selected=null/);
});

test('saved build identity survives closing and reopening the browser',()=>{
 const src=read('app.js');
 assert.match(src,/id=localStorage\.getItem\(ACTIVE_BUILD_KEY\)/);
 assert.match(src,/localStorage\.setItem\(ACTIVE_BUILD_KEY,id\)/);
 assert.match(src,/localStorage\.removeItem\(ACTIVE_BUILD_KEY\)/);
 assert.match(src,/builds\.some\(b=>b\.id===id\)\?id:null/);
 assert.match(src,/function newBlankBuild\(\)\{\s*selectActiveBuild\(null\)/);
 assert.match(src,/selectActiveBuild\(null\);state=incoming/);
});
