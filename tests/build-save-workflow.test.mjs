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
 assert.match(source,/if\(activeBuildId&&!builds\.some\(b=>b\.id===activeBuildId\)\)selectActiveBuild\(null\)/);
});
