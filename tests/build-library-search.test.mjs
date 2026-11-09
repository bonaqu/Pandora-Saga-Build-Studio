import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('large libraries can be filtered by character name, profession and level',()=>{
 const src=read('pandora-studio-app.js'),css=read('pandora-studio-theme.css');
 assert.match(src,/let buildSearchQuery=''/);
 assert.match(src,/builds\.length>5\?h\('input',\{type:'search'/);
 assert.match(src,/searchText:\[b\.name,races\[b\.data\?\.race\]\?\.\[0\],races\[b\.data\?\.race\]\?\.\[1\],jobs\[b\.data\?\.job\]/);
 assert.match(src,/races\[b\.data\?\.race\]\?\.\[lang==='en'\?1:0\]/);
 assert.match(src,/row\.box\.hidden=!searchWords\(row\.searchText,query\)/,
  'Build search must share Unicode and ё/е handling with other pickers');
 assert.match(src,/none\.hidden=!query\|\|visible>0/);
 assert.match(css,/\.build-card\[hidden\]\{display:none!important\}/);
 assert.doesNotMatch(src,/Поделиться всей библиотекой/);
 assert.match(src,/function refreshBuildsAfterCloudLoad\(\)/);
 assert.match(src,/const typedName=name\?\.value,scrollTop=content\?\.scrollTop\?\?0/);
 assert.match(src,/target\.focus\(\{preventScroll:true\}\)/);
 assert.match(src,/updated\.scrollTop=scrollTop/);
 assert.match(src,/refreshBuildsAfterCloudLoad\(\);/);

});
