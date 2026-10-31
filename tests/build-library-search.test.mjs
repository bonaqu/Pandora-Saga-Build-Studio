import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('large libraries can be filtered by character name, profession and level',()=>{
 const src=read('app.js'),css=read('style.css');
 assert.match(src,/let buildSearchQuery=''/);
 assert.match(src,/builds\.length>5\?h\('input',\{type:'search'/);
 assert.match(src,/searchText:\[b\.name,races\[b\.data\?\.race\]\?\.\[0\],jobs\[b\.data\?\.job\]/);
 assert.match(src,/row\.box\.hidden=!row\.searchText\.includes\(query\)/);
 assert.match(src,/none\.hidden=!query\|\|visible>0/);
 assert.match(css,/\.build-card\[hidden\]\{display:none!important\}/);
 assert.doesNotMatch(src,/Поделиться всей библиотекой/);
});
