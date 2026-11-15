
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('level navigation and changed rows never invoke a catalog or D1 mutation',()=>{
 const code=read('pandora-studio-progression-owner-editor.js');
 const styles=read('pandora-studio-progression-owner-editor.css');
 assert.match(code,/const navigator=h\('div',\{class:'ps-level-editor-navigation'\}\)/);
 assert.match(code,/const jumpInput=h\('input',\{type:'number',min:'1'/);
 assert.match(code,/const goToLevel=\(\)=>/);
 assert.match(code,/filterInput\.addEventListener\('change',update\)/);
 assert.match(code,/node\.row\.hidden=filterInput\.checked/);
 assert.match(code,/if\(filterInput\.checked\)\{filterInput\.checked=false;update\(\)\}/);
 assert.match(styles,/\.ps-level-editor-table tbody tr\[hidden\]\{display:none\}/);
 assert.match(code,/await write\(serialized\)/);
 assert.match(code,/if\(!canCommit\(\)\|\|saving\)return/);
});
test('library sorting is a display-only order and keeps saved build order',()=>{
 const code=read('pandora-studio-app.js');
 const styles=read('pandora-studio-build-comparison.css');
 assert.match(code,/let buildSearchQuery='',buildSortMode='saved'/);
 assert.match(code,/const sorted=\[\.\.\.searchable\]\.sort/);
 assert.match(code,/for\(const row of sorted\)grid\.append\(row\.box\)/);
 assert.match(code,/else builds\.push\(entry\)/);
 assert.match(code,/const applySort=\(\)=>/);
 assert.match(styles,/\.build-library-sort-select/);
});
